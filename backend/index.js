import fs from 'fs';
import path from 'path';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { supabase } from './supabaseClient.js';
import {
  ensureBucketExists,
  supabaseAdmin,
  supabaseServiceRoleKey,
  supabaseUrl
} from './supabaseAdmin.js';
import serverless from 'serverless-http';
import sharp from 'sharp';
import strainRoutes from './routes/strains.js';
import healthRoutes from './routes/health.js';
import compareRoutes from './routes/compare.js';
import notesRoutes from './routes/notes.js';
import reviewsRoutes from './routes/reviews.js';
import availabilityRoutes from './routes/availability.js';
import growlogsRoutes from './routes/growlogs.js';
import legalRoutes from './routes/legal.js';
import trendsRoutes from './routes/trends.js';
import analyticsRoutes from './routes/analytics.js';
import adminRoutes from './routes/admin.js';
import devRoutes from './routes/dev.js';
import growersRoutes from './routes/growers.js';
import seedsRoutes from './routes/seeds.js';
import dispensariesRoutes from './routes/dispensaries.js';
import seedsLiveRoutes from './routes/seeds-live.js';
import dispensariesLiveRoutes from './routes/dispensaries-live.js';
import groupsRoutes from './routes/groups.js';
import journalsRoutes from './routes/journals.js';
import eventsRoutes from './routes/events.js';
import feedbackRoutes from './routes/feedback.js';
import diagnosticRoutes from './routes/diagnostic.js';
import scanDiagnosticRoutes from './routes/scanDiagnostic.js';
import friendsRoutes from './routes/friends.js';
import membershipRoutes from './routes/membership.js';
import pipelineRoutes from './routes/pipeline.js';
import moderationRoutes from './routes/moderation.js';
import moderatorActionsRoutes from './routes/moderator-actions.js';
import messagesRoutes from './routes/messages.js';
import profileGeneratorRoutes from './routes/profile-generator.js';
import usersRoutes from './routes/users.js';
import { matchStrainByVisuals } from './services/visualMatcher.js';
import {
  consumeScanCredits,
  ensureMonthlyBundle,
  getCreditSummary,
  grantScanCredits,
  ensureStarterBundle,
  refreshStarterWindow
} from './services/scanCredits.js';
import { checkAccess, enforceTrialLimit } from './middleware/membershipCheck.js';

// Load env from ../env/.env.local (works when launched from backend/)
// In Vercel, environment variables are injected automatically
if (!process.env.VERCEL) {
  dotenv.config({ path: new URL('../env/.env.local', import.meta.url).pathname });
}
if (process.env.NODE_ENV !== 'production') {
  console.log('[boot] SUPABASE_URL present =', !!process.env.SUPABASE_URL);
  console.log('[boot] GOOGLE_APPLICATION_CREDENTIALS set =', !!process.env.GOOGLE_APPLICATION_CREDENTIALS || !!process.env.GOOGLE_VISION_JSON);
  // Helpful to confirm admin client usage without exposing secrets
  console.log('[boot] Service role client active =', !!supabaseAdmin);
}

// Optional Google Vision client (only if creds are present)
let visionClient;
try {
  // For Vercel/serverless: support GOOGLE_VISION_JSON inline credentials
  if (process.env.GOOGLE_VISION_JSON) {
    const credentials = JSON.parse(process.env.GOOGLE_VISION_JSON);
    visionClient = new ImageAnnotatorClient({ credentials });
  } else {
    // Fall back to default credentials file (local development)
    visionClient = new ImageAnnotatorClient();
  }
} catch (e) {
  console.warn('[boot] Google Vision client not initialized:', e.message);
}

const app = express();
app.set('trust proxy', 1); // trust Vercel/Edge proxies so rate limiting sees the real IP
const PORT = process.env.PORT || 5181;
const STORAGE_BASE_URL = supabaseUrl ? new URL('/storage/v1', supabaseUrl).toString().replace(/\/$/, '') : null;

async function generateSignedUploadUrl(bucket, path, { upsert = false } = {}) {
  const cleanPath = String(path || '').replace(/^\/+/, '');
  if (!cleanPath) throw new Error('upload path required');

  const storageClient = supabaseAdmin?.storage?.from(bucket);
  if (storageClient && typeof storageClient.createSignedUploadUrl === 'function') {
    const { data, error } = await storageClient.createSignedUploadUrl(cleanPath, { upsert });
    if (!error && data?.signedUrl && data?.token) {
      return data;
    }
    if (error) {
      console.warn('[uploads] createSignedUploadUrl via SDK failed:', error.message);
    }
  }

  if (!supabaseServiceRoleKey || !STORAGE_BASE_URL) {
    throw new Error('Service role key unavailable for signed upload');
  }

  const fullPath = `${bucket}/${cleanPath}`;
  const encoded = fullPath.split('/').map(encodeURIComponent).join('/');
  const endpoint = `${STORAGE_BASE_URL}/object/upload/sign/${encoded}`;
  const headers = {
    Authorization: `Bearer ${supabaseServiceRoleKey}`,
    'Content-Type': 'application/json'
  };
  if (upsert) headers['x-upsert'] = 'true';

  const resp = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify({}) });
  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Signed upload API failed: ${resp.status} ${errText}`);
  }
  const payload = await resp.json();
  if (!payload?.url) {
    throw new Error('Signed upload response missing URL');
  }
  const resolved = new URL(payload.url, STORAGE_BASE_URL);
  const token = resolved.searchParams.get('token');
  if (!token) {
    throw new Error('Signed upload response missing token');
  }
  return { signedUrl: resolved.toString(), token, path: cleanPath };
}

// Security headers
app.use(helmet({
  contentSecurityPolicy: false // keep simple for API-only
}));

// JSON body (for base64 uploads from frontend)
// Increased to 50MB to accept large images, which we'll compress server-side with sharp
app.use(express.json({ limit: '50mb' }));

// CORS allowlist: allow any localhost/127.0.0.1 port in dev
const DEFAULT_ORIGINS = [
  'http://localhost:5173', 'http://127.0.0.1:5173',
  'http://localhost:5174', 'http://127.0.0.1:5174',
  'http://localhost:4173', 'http://127.0.0.1:4173',
  'https://strainspotter-frontend.vercel.app',
  'https://frontend-goaqagqo9-tophercook7-makers-projects.vercel.app',
  'https://frontend-gmgc1mgxt-tophercook7-makers-projects.vercel.app'
];
const ALLOW_ORIGINS = (process.env.CORS_ALLOW_ORIGINS || DEFAULT_ORIGINS.join(','))
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

function isAllowedOrigin(origin) {
  if (!origin) return false;
  if (ALLOW_ORIGINS.includes(origin)) return true;
  // Allow any localhost or 127.0.0.1 with any port explicitly for dev previews
  // This permits local dev machines to call the backend regardless of port drift
  try {
    const u = new URL(origin);
    if ((u.hostname === 'localhost' || u.hostname === '127.0.0.1')) {
      // Accept any localhost/127.0.0.1 port (no port restriction for maximum dev flexibility)
      return true;
    }
  } catch {}
  // Allow Vercel preview/prod frontend domains for this project
  try {
    const { host } = new URL(origin);
    if (
      host.endsWith('.vercel.app') &&
      (
        host.includes('strainspotter-frontend') ||
        host.includes('frontend-') ||
        host.includes('tophercook7-makers-projects')
      )
    ) {
      return true;
    }
  } catch {}
  return false;
}

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  res.setHeader('Vary', 'Origin');
  // Allow custom headers used by frontend (add more as needed)
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-session-id, x-user-id');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
    return res.sendStatus(204);
  }
  next();
});

// Enhanced error logging and handler
const errorLog = [];
const MAX_ERROR_LOG = 100;

function logError(err, req) {
  const timestamp = new Date().toISOString();
  const errorEntry = {
    timestamp,
    method: req?.method,
    url: req?.originalUrl || req?.url,
    error: err.message || String(err),
    stack: err.stack,
    status: err.status || 500,
    userId: req?.body?.user_id || req?.query?.user_id || 'unknown'
  };
  
  // Console log with clear formatting
  console.error('\n═══════════════════════════════════════════════════════');
  console.error('🚨 ERROR CAUGHT');
  console.error('───────────────────────────────────────────────────────');
  console.error('Time:', timestamp);
  console.error('Endpoint:', `${errorEntry.method} ${errorEntry.url}`);
  console.error('Status:', errorEntry.status);
  console.error('User:', errorEntry.userId);
  console.error('Message:', errorEntry.error);
  console.error('───────────────────────────────────────────────────────');
  if (err.stack) {
    console.error('Stack Trace:');
    console.error(err.stack);
  }
  console.error('═══════════════════════════════════════════════════════\n');
  
  // Keep in-memory log (last 100 errors)
  errorLog.unshift(errorEntry);
  if (errorLog.length > MAX_ERROR_LOG) errorLog.pop();
}

// Centralized error handler middleware
function errorHandler(err, req, res, next) {
  logError(err, req);
  const status = err.status || 500;
  const message = err.message || String(err);
  res.status(status).json({ 
    error: message,
    timestamp: new Date().toISOString(),
    endpoint: `${req.method} ${req.originalUrl || req.url}`
  });
}

// Rate limiter for write-heavy endpoints
const writeLimiter = rateLimit({ windowMs: 60 * 1000, max: 30 }); // 30 req/min per IP

// --- Health ---
app.get('/health', async (req, res, next) => {
  try {
    const supabaseOk = !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
    const visionOk = !!process.env.GOOGLE_APPLICATION_CREDENTIALS || !!process.env.GOOGLE_VISION_JSON;
    res.json({ ok: true, supabaseConfigured: supabaseOk, googleVisionConfigured: visionOk });
  } catch (e) {
    next(e);
  }
});

app.get('/', (req, res) => {
  res.send('StrainSpotter backend is running. Hit /health for status.');
});

// --- Uploads & Scans ---

// Ensure storage bucket exists on startup (best-effort)
(async () => {
  const result = await ensureBucketExists('scans', { public: true });
  if (result?.ok) {
    console.log(`[boot] Storage bucket 'scans' ${result.created ? 'created' : 'present'}.`);
  } else if (result?.skipped) {
    console.log(`[boot] Skipped bucket ensure (no service role key).`);
  } else if (result?.error) {
    console.warn(`[boot] Could not ensure bucket: ${result.error}`);
  }
})();

// POST /api/uploads  { filename, contentType, base64, user_id? } - with trial enforcement
app.post('/api/uploads', writeLimiter, async (req, res, next) => {
  try {
    const { filename, contentType, base64, user_id } = req.body || {};
    if (!filename || !base64) return res.status(400).json({ error: 'filename and base64 are required' });
    if (contentType && !/^image\/(png|jpe?g|webp)$/i.test(contentType)) {
      return res.status(400).json({ error: 'unsupported contentType' });
    }

    if (!user_id) {
      return res.status(401).json({ error: 'Sign in required to upload scans. Please log in to continue.' });
    }

    // Ensure starter credits exist and membership bundle is aligned before any processing
    await ensureStarterBundle(user_id);
    await ensureMonthlyBundle(user_id);

    let buffer = Buffer.from(base64, 'base64');

    // Allow anon uploads: if user_id is missing/null, use 'anon' for image_key and owner
    const uploadOwnerId = (user_id && String(user_id)) || (req.headers['x-session-id'] && String(req.headers['x-session-id'])) || req.ip || 'anon';
    const uploadSafeOwner = String(uploadOwnerId).replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 64) || 'anon';
    const uploadSafeName = String(filename).replace(/[^A-Za-z0-9._-]+/g, '_').replace(/^[_\.\-]+/, '').slice(0, 100) || `file_${Date.now()}.jpg`;
    const uploadKey = `users/${uploadSafeOwner}/${Date.now()}-${uploadSafeName}`;
    const uploadBucket = 'scans';

    // Auto-compress/resize if image is too large
    const MAX_SIZE = 2 * 1024 * 1024; // 2MB target
    const MAX_DIMENSION = 2048; // Max width/height

    if (buffer.length > MAX_SIZE) {
      console.log(`[upload] Compressing image from ${(buffer.length / 1024 / 1024).toFixed(2)}MB`);
      buffer = await sharp(buffer)
        .resize(MAX_DIMENSION, MAX_DIMENSION, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85, progressive: true })
        .toBuffer();
      console.log(`[upload] Compressed to ${(buffer.length / 1024 / 1024).toFixed(2)}MB`);
    }

    // Normalize storage key: users/{owner}/{timestamp-filename}
    // Prefer authenticated user id; otherwise use a session-based bucket to avoid collisions
    const rawName = String(filename || 'upload.jpg').split('/').pop();
    const normalizedSafeName = rawName
      .replace(/[^A-Za-z0-9._-]+/g, '_')
      .replace(/^[_\.\-]+/, '')
      .slice(0, 100) || `file_${Date.now()}.jpg`;

    const normalizedOwnerId = uploadOwnerId;
    const normalizedSafeOwner = uploadSafeOwner;
    const normalizedKey = `users/${normalizedSafeOwner}/${Date.now()}-${normalizedSafeName}`;
    const normalizedBucket = uploadBucket;

  // Prefer service role for storage writes to bypass RLS
  const storageClient = supabaseAdmin ?? supabase;
  const { error: upErr } = await storageClient.storage.from(normalizedBucket).upload(normalizedKey, buffer, { contentType });
    if (upErr) {
      if (upErr.message?.toLowerCase().includes('bucket not found')) {
        // Try to create bucket once (best-effort)
        const ensured = await ensureBucketExists(normalizedBucket, { public: true });
        if (ensured?.ok) {
          const retry = await storageClient.storage.from(normalizedBucket).upload(normalizedKey, buffer, { contentType });
          if (retry.error) return res.status(500).json({ error: retry.error.message });
        } else {
          return res.status(500).json({ error: `Storage bucket '${normalizedBucket}' not found and could not be created. ${ensured?.error || ensured?.reason || ''}`.trim() });
        }
      } else {
        return res.status(500).json({ error: upErr.message });
      }
    }

    const { data: urlData } = storageClient.storage.from(normalizedBucket).getPublicUrl(normalizedKey);
    const publicUrl = urlData?.publicUrl || null;

    // Use service role for table insert to bypass RLS
    const dbClient = supabaseAdmin ?? supabase;
    const insert = await dbClient.from('scans').insert({ image_url: publicUrl, image_key: normalizedKey, status: 'pending', user_id }).select();
    if (insert.error) {
      const msg = insert.error.message || 'insert failed';
      const rlsHint = (!supabaseAdmin && /row-level security/i.test(msg))
        ? 'Supabase RLS blocked anon insert. Add SUPABASE_SERVICE_ROLE_KEY to env/.env.local and restart the backend.'
        : null;
      return res.status(500).json({ error: msg, hint: rlsHint });
    }

    const scan = Array.isArray(insert.data) ? insert.data[0] : insert.data;
    res.json({ id: scan?.id || null, image_url: publicUrl });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// Request a signed upload URL so the client can stream large files directly to Supabase Storage
app.post('/api/uploads/signed-url', writeLimiter, async (req, res) => {
  try {
    const { filename, contentType, user_id } = req.body || {};
    if (!filename || !user_id) {
      return res.status(400).json({ error: 'filename and user_id are required' });
    }

    await ensureStarterBundle(user_id);
    await ensureMonthlyBundle(user_id);

    const uploadOwnerId = String(user_id || req.headers['x-session-id'] || req.ip || 'anon');
    const uploadSafeOwner = uploadOwnerId.replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 64) || 'anon';
    const rawName = String(filename).split('/').pop();
    const normalizedSafeName = rawName
      .replace(/[^A-Za-z0-9._-]+/g, '_')
      .replace(/^[_\.\-]+/, '')
      .slice(0, 100) || `file_${Date.now()}.jpg`;
    const bucket = 'scans';
    const path = `users/${uploadSafeOwner}/${Date.now()}-${normalizedSafeName}`;

    const signedPayload = await generateSignedUploadUrl(bucket, path, { upsert: false });
    const { data: publicData } = (supabaseAdmin ?? supabase).storage.from(bucket).getPublicUrl(path);

    res.json({
      bucket,
      path,
      token: signedPayload.token,
      signedUrl: signedPayload.signedUrl,
      publicUrl: publicData?.publicUrl || null,
      contentType: contentType || 'image/jpeg'
    });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// Finalize signed upload: create scan record after the client uploads to storage
app.post('/api/uploads/complete', writeLimiter, async (req, res) => {
  try {
    const { path, user_id, bucket } = req.body || {};
    if (!path || !user_id) {
      return res.status(400).json({ error: 'path and user_id are required' });
    }

    const storageBucket = bucket || 'scans';
    const storageClient = supabaseAdmin ?? supabase;
    const { data: publicData } = storageClient.storage.from(storageBucket).getPublicUrl(path);
    const publicUrl = publicData?.publicUrl || null;

    const insert = await storageClient
      .from('scans')
      .insert({ image_url: publicUrl, image_key: path, status: 'pending', user_id })
      .select()
      .single();

    if (insert.error) {
      return res.status(500).json({ error: insert.error.message });
    }

    res.json({ id: insert.data.id, image_url: publicUrl, key: path });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// GET /api/scans - list recent
app.get('/api/scans', async (req, res, next) => {
  try {
    const { user_id } = req.query; // Optional: filter to user's own + friends' scans
    // Use service role for reads if available to ensure visibility of all scans
    const readClient = supabaseAdmin ?? supabase;

    if (user_id) {
      // Fetch user's own scans only with joined strain data
      const { data, error } = await readClient
        .from('scans')
        .select('*, strain:strains!matched_strain_slug(*)')
        .eq('user_id', user_id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) return res.status(500).json({ error: error.message });
      return res.json({ scans: data || [] });
    } else {
      // No user_id: return all scans (permissive for dev; tighten in prod) with joined strain data
      const q = readClient.from('scans').select('*, strain:strains!matched_strain_slug(*)').order('created_at', { ascending: false }).limit(100);
      const { data, error } = await q;
      if (error) return res.status(500).json({ error: error.message });
      res.json({ scans: data || [] });
    }
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// POST /api/scans/from-url { url }
app.post('/api/scans/from-url', async (req, res, next) => {
  const writeClient = supabaseAdmin ?? supabase;
  try {
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ error: 'url required' });
    const insert = await writeClient.from('scans').insert({ image_url: url, status: 'pending' }).select().single();
    if (insert.error) return res.status(400).json({ error: insert.error.message });
    res.json({ id: insert.data.id, image_url: url });
  } catch (e) {
    next(e);
  }
});

// GET /api/scans/credits?user_id=...
app.get('/api/scans/credits', async (req, res) => {
  try {
    const userId = req.query.user_id || req.headers['x-user-id'] || req.headers['x-session-id'] || null;
    if (!userId) {
      return res.status(400).json({ error: 'user_id required' });
    }
    await ensureStarterBundle(userId);
    const summary = await getCreditSummary(userId);
    res.json(summary);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// POST /api/scans/credits/grant - backoffice/IAP redemption
app.post('/api/scans/credits/grant', async (req, res) => {
  try {
    const { user_id, amount, reason, metadata, secret } = req.body || {};
    if (!user_id || !amount || amount <= 0) {
      return res.status(400).json({ error: 'user_id and positive amount are required' });
    }

    const requiredSecret = process.env.SCAN_TOPUP_SECRET || null;
    if (requiredSecret) {
      if (!secret || secret !== requiredSecret) {
        return res.status(401).json({ error: 'Invalid top-up secret' });
      }
    }

    const grantReason = reason || 'iap-topup';
    await grantScanCredits(user_id, Number(amount), grantReason, metadata || null);

    await refreshStarterWindow(user_id);

    const summary = await getCreditSummary(user_id);
    res.json({ ok: true, summary });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// GET /api/scans/:id - single
app.get('/api/scans/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    // Validate UUID format (v4)
    const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidV4Regex.test(id)) {
      return res.status(400).json({ error: 'Invalid scan ID: must be a UUID v4.' });
    }
    // Use service role for reads if available to ensure visibility of all scans
    const readClient = supabaseAdmin ?? supabase;
    const { data, error } = await readClient.from('scans').select('*, strain:strains!matched_strain_slug(*)').eq('id', id).maybeSingle();
    if (error) return res.status(500).json({ error: error.message });
    if (!data) return res.status(404).json({ error: 'scan not found' });
    res.json(data);
  } catch (e) {
    next(e);
  }
});

// POST /api/scans/:id/process - Vision annotate and save
app.post('/api/scans/:id/process', writeLimiter, async (req, res, next) => {
  // Use service role for all scan operations when available
  const readClient = supabaseAdmin ?? supabase;
  const writeClient = supabaseAdmin ?? supabase;
  let creditConsumed = false;
  try {
    const id = req.params.id;
    const { data: scan, error: fetchErr } = await readClient.from('scans').select('*').eq('id', id).maybeSingle();
    if (fetchErr) return res.status(500).json({ error: fetchErr.message });
    if (!scan) return res.status(404).json({ error: 'scan not found' });
    if (!scan.image_url) return res.status(400).json({ error: 'scan has no image_url' });
    if (!visionClient) return res.status(500).json({ error: 'Google Vision client not configured' });

    if (scan.status === 'done' && scan.result) {
      const result = scan.result;
      return res.json({
        ok: true,
        result,
        cached: true,
        debug: {
          labelCount: result.labelAnnotations?.length || 0,
          topLabels: (result.labelAnnotations || []).slice(0, 10).map(x => ({ label: x.description, score: Math.round((x.score || 0) * 100) })),
          textBlocks: result.textAnnotations?.length || 0,
          webEntities: result.webDetection?.webEntities?.length || 0,
          dominantColors: (result.imagePropertiesAnnotation?.dominantColors?.colors || []).slice(0, 5).map(c => ({
            rgb: `rgb(${Math.round(c.color.red || 0)}, ${Math.round(c.color.green || 0)}, ${Math.round(c.color.blue || 0)})`,
            score: Math.round((c.score || 0) * 100),
            pixelFraction: Math.round((c.pixelFraction || 0) * 100)
          })),
          objects: (result.localizedObjectAnnotations || []).map(o => ({ name: o.name, score: Math.round((o.score || 0) * 100) }))
        }
      });
    }

    const scanOwnerId = scan.user_id;
    if (!scanOwnerId) {
      return res.status(400).json({ error: 'Scan is not associated with a user. Please upload again while signed in.' });
    }

    await ensureStarterBundle(scanOwnerId);

    const creditResult = await consumeScanCredits(scanOwnerId, 1, { scan_id: id, stage: 'process' });
    if (!creditResult.success) {
      if (creditResult.code === 'STARTER_WINDOW_EXPIRED') {
        return res.status(403).json({
          error: 'Your starter access window has ended. Join the Garden membership or redeem a top-up pack within 3 days to keep scanning.',
          code: 'STARTER_WINDOW_EXPIRED',
          accessExpiresAt: creditResult.accessExpiresAt || null
        });
      }

      const status = creditResult.code === 'INSUFFICIENT_SCAN_CREDITS' ? 402 : 400;
      return res.status(status).json({
        error: 'No scan credits remaining. Join the Garden or purchase a top-up pack to continue scanning.',
        code: creditResult.code || 'SCAN_CREDIT_ERROR',
        accessExpiresAt: creditResult.accessExpiresAt || null
      });
    }
    creditConsumed = true;

    await writeClient.from('scans').update({ status: 'processing' }).eq('id', id);

    // Download the image bytes server-side so Vision doesn't need to fetch the URL
    let contentBuffer = null;
    try {
      const resp = await fetch(scan.image_url);
      if (resp.ok) {
        const ab = await resp.arrayBuffer();
        contentBuffer = Buffer.from(ab);
        
        // Auto-compress if needed (Google Vision has 20MB limit)
        const MAX_VISION_SIZE = 10 * 1024 * 1024; // 10MB to be safe
        if (contentBuffer.length > MAX_VISION_SIZE) {
          console.log(`[process] Compressing image from ${(contentBuffer.length / 1024 / 1024).toFixed(2)}MB for Vision API`);
          contentBuffer = await sharp(contentBuffer)
            .resize(2048, 2048, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 85, progressive: true })
            .toBuffer();
          console.log(`[process] Compressed to ${(contentBuffer.length / 1024 / 1024).toFixed(2)}MB`);
        }
      }
    } catch {}

    if (!contentBuffer) {
      // Fallback: attempt storage download via Supabase (requires key extraction)
      try {
        const url = new URL(scan.image_url);
        const pathParts = url.pathname.split('/');
        const idx = pathParts.findIndex((p) => p === 'public');
        if (idx !== -1 && pathParts[idx + 1] === 'scans') {
          const key = pathParts.slice(idx + 2).join('/');
          const { data, error } = await (supabaseAdmin ?? supabase).storage.from('scans').download(key);
          if (!error && data) {
            if (typeof data.arrayBuffer === 'function') {
              const ab = await data.arrayBuffer();
              contentBuffer = Buffer.from(ab);
            }
          }
        }
      } catch {}
    }

    if (!contentBuffer) {
      return res.status(500).json({ error: 'Could not download image bytes for Vision processing' });
    }

    // Enhanced: Extract ALL visual features for better matching
    const [result] = await visionClient.annotateImage({
      image: { content: contentBuffer },
      features: [
        { type: 'LABEL_DETECTION', maxResults: 50 },      // Increased for cannabis feature detection
        { type: 'TEXT_DETECTION' },                       // Text (strain names, labels)
        { type: 'OBJECT_LOCALIZATION', maxResults: 20 },  // Objects in image
        { type: 'IMAGE_PROPERTIES' },                     // Dominant colors (critical for strain ID)
        { type: 'WEB_DETECTION', maxResults: 30 },        // Find similar images on web
        { type: 'SAFE_SEARCH_DETECTION' },                // Validate image content
        { type: 'CROP_HINTS', maxResults: 5 }             // Optimal crop suggestions
      ],
    });

    console.log('[Vision Debug] Labels:', result.labelAnnotations?.length || 0);
    console.log('[Vision Debug] Web entities:', result.webDetection?.webEntities?.length || 0);
    console.log('[Vision Debug] Dominant colors:', result.imagePropertiesAnnotation?.dominantColors?.colors?.length || 0);
    console.log('[Vision Debug] Objects:', result.localizedObjectAnnotations?.length || 0);

    const { error: upErr } = await writeClient
      .from('scans')
      .update({ result, status: 'done', processed_at: new Date().toISOString() })
      .eq('id', id);
    if (upErr) return res.status(500).json({ error: upErr.message });

    // Return debug info in response
    res.json({ 
      ok: true, 
      result,
      debug: {
        labelCount: result.labelAnnotations?.length || 0,
        topLabels: (result.labelAnnotations || []).slice(0, 10).map(x => ({ label: x.description, score: Math.round((x.score||0)*100) })),
        textBlocks: result.textAnnotations?.length || 0,
        webEntities: result.webDetection?.webEntities?.length || 0,
        dominantColors: (result.imagePropertiesAnnotation?.dominantColors?.colors || []).slice(0, 5).map(c => ({
          rgb: `rgb(${Math.round(c.color.red || 0)}, ${Math.round(c.color.green || 0)}, ${Math.round(c.color.blue || 0)})`,
          score: Math.round((c.score || 0) * 100),
          pixelFraction: Math.round((c.pixelFraction || 0) * 100)
        })),
        objects: (result.localizedObjectAnnotations || []).map(o => ({ name: o.name, score: Math.round((o.score||0)*100) }))
      }
    });
  } catch (e) {
    if (req?.params?.id) {
      try {
        const { data: scan } = await (supabaseAdmin ?? supabase)
          .from('scans')
          .select('user_id')
          .eq('id', req.params.id)
          .maybeSingle();
        if (scan?.user_id) {
          if (scan?.user_id && creditConsumed) {
            await grantScanCredits(scan.user_id, 1, 'scan-refund', { scan_id: req.params.id, reason: 'processing-error' });
          }
        }
      } catch (refundErr) {
        console.error('[scan] Failed to refund credits after error:', refundErr);
      }
    }
    try {
      await writeClient
        .from('scans')
        .update({ status: 'failed', result: { error: String(e) } })
        .eq('id', req.params.id);
    } catch {}
    return res.status(500).json({ error: String(e) });
  }
});

// Save match selection and associate with user
app.post('/api/scans/:id/save-match', async (req, res) => {
  try {
    const { id } = req.params;
    const { matched_strain_slug, user_id } = req.body || {};
    if (!id || !matched_strain_slug) return res.status(400).json({ error: 'id and matched_strain_slug required' });
    const writeClient = supabaseAdmin ?? supabase;
    const { error } = await writeClient
      .from('scans')
      .update({ matched_strain_slug, user_id: user_id || null })
      .eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// POST /api/visual-match - Match strain by Vision API results
app.post('/api/visual-match', writeLimiter, async (req, res, next) => {
  try {
    const { visionResult } = req.body;
    if (!visionResult) {
      return res.status(400).json({ error: 'visionResult required' });
    }

    // Load strain library (try primary path, fallback to enhanced or latest backup)
    let strains = [];
    try {
      const dataDir = new URL('./data/', import.meta.url).pathname;
      const primary = path.join(dataDir, 'strain_library.json');
      const enhanced = path.join(dataDir, 'strain_library_enhanced.json');
      if (fs.existsSync(primary)) {
        strains = JSON.parse(fs.readFileSync(primary, 'utf8'));
      } else if (fs.existsSync(enhanced)) {
        strains = JSON.parse(fs.readFileSync(enhanced, 'utf8'));
      } else {
        const files = fs.readdirSync(dataDir).filter(f => /^strain_library\..*\.bak\.json$/.test(f)).sort().reverse();
        if (files.length) {
          strains = JSON.parse(fs.readFileSync(path.join(dataDir, files[0]), 'utf8'));
        } else {
          throw new Error('strain library not found');
        }
      }
    } catch (e) {
      console.error('[VisualMatch] Could not load strain library:', e);
      return res.status(500).json({ error: 'Strain library unavailable' });
    }

    // Perform visual matching
    const matches = matchStrainByVisuals(visionResult, strains);

    console.log(`[VisualMatch] Found ${matches.length} matches, top score: ${matches[0]?.score || 0}`);

    res.json({
      success: true,
      matchCount: matches.length,
      matches: matches.map(m => ({
        strain: {
          slug: m.strain.slug,
          name: m.strain.name,
          type: m.strain.type,
          description: m.strain.description,
          effects: m.strain.effects,
          flavors: m.strain.flavors,
          thc: m.strain.thc,
          cbd: m.strain.cbd,
          lineage: m.strain.lineage
        },
        score: Math.round(m.score),
        confidence: m.confidence,
        reasoning: m.reasoning
      }))
    });
  } catch (e) {
    console.error('[VisualMatch] Error:', e);
    res.status(500).json({ error: String(e) });
  }
});

// --- Mount Route Modules ---
// app.use('/api/stripe', stripeWebhook); // Removed: not using Stripe
app.use('/api/health', healthRoutes);
app.use('/api', strainRoutes);
app.use('/api/compare', compareRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/growlogs', growlogsRoutes);
app.use('/api/legal', legalRoutes);
app.use('/api/trends', trendsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/dev', devRoutes);
app.use('/api/growers', growersRoutes);
app.use('/api/seeds', seedsRoutes);
app.use('/api/seeds-live', seedsLiveRoutes);
app.use('/api/dispensaries', dispensariesRoutes);
app.use('/api/dispensaries-live', dispensariesLiveRoutes);
app.use('/api/groups', groupsRoutes);
app.use('/api/journals', journalsRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/diagnostic', diagnosticRoutes);
app.use('/api/diagnostic', scanDiagnosticRoutes);
app.use('/api/friends', friendsRoutes);
app.use('/api/membership', membershipRoutes);
app.use('/api/pipeline', pipelineRoutes);
app.use('/api/moderation', moderationRoutes);
app.use('/api/moderator-actions', moderatorActionsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/profile-generator', profileGeneratorRoutes);
app.use('/api/users', usersRoutes);

// Error logs viewer endpoint (only accessible in development)
app.get('/api/errors/recent', (req, res) => {
  const isDev = req.hostname === 'localhost' || req.hostname === '127.0.0.1';
  if (!isDev) {
    return res.status(403).json({ error: 'Error logs only available in development' });
  }
  res.json({ 
    total: errorLog.length, 
    errors: errorLog.slice(0, 20),
    message: 'Showing last 20 errors. Full log in PM2: pm2 logs strainspotter-backend' 
  });
});

// POST /api/strains/suggest - user suggests a new strain
app.post('/api/strains/suggest', writeLimiter, express.json(), (req, res) => {
  const suggestion = req.body;
  // In production, store in DB or send to admin for review
  // For now, just append to a file
  const suggestionsPath = new URL('./strains/strains-suggestions.json', import.meta.url).pathname;
  let suggestions = [];
  try {
    suggestions = JSON.parse(fs.readFileSync(suggestionsPath, 'utf8'));
  } catch (e) {}
  suggestions.push({ ...suggestion, submitted_at: new Date().toISOString() });
  fs.writeFileSync(suggestionsPath, JSON.stringify(suggestions, null, 2));
  res.json({ ok: true });
});

app.use(errorHandler);

// Global uncaught error handlers
process.on('uncaughtException', (err) => {
  console.error('\n💥 UNCAUGHT EXCEPTION 💥');
  console.error('═══════════════════════════════════════════════════════');
  console.error('Time:', new Date().toISOString());
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);
  console.error('═══════════════════════════════════════════════════════\n');
  // Keep process alive in development
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('\n⚠️  UNHANDLED PROMISE REJECTION ⚠️');
  console.error('═══════════════════════════════════════════════════════');
  console.error('Time:', new Date().toISOString());
  console.error('Reason:', reason);
  console.error('Promise:', promise);
  console.error('═══════════════════════════════════════════════════════\n');
});

// In Vercel serverless, don't call listen(); export the app handler instead
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`[strainspotter] backend listening on http://localhost:${PORT}`);
  });
}

export default app;
export const handler = serverless(app);
