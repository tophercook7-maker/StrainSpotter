import { ImageAnnotatorClient } from '@google-cloud/vision';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { supabase } from './supabaseClient.js';
import { ensureBucketExists, supabaseAdmin } from './supabaseAdmin.js';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

// Import all route modules at the top (ES module requirement)
// import stripeWebhook from './routes/stripeWebhook.js'; // Removed: not using Stripe
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
import groupsRoutes from './routes/groups.js';
import journalsRoutes from './routes/journals.js';
import eventsRoutes from './routes/events.js';
import feedbackRoutes from './routes/feedback.js';
import diagnosticRoutes from './routes/diagnostic.js';
import scanDiagnosticRoutes from './routes/scanDiagnostic.js';
import friendsRoutes from './routes/friends.js';
import membershipRoutes from './routes/membership.js';
import { matchStrainByVisuals } from './services/visualMatcher.js';
import { checkAccess, enforceTrialLimit } from './middleware/membershipCheck.js';

// Load env from ../env/.env.local (works when launched from backend/)
// In Vercel, environment variables are injected automatically
if (!process.env.VERCEL) {
  dotenv.config({ path: new URL('../env/.env.local', import.meta.url).pathname });
}
if (process.env.NODE_ENV !== 'production') {
  console.log('[boot] SUPABASE_URL present =', !!process.env.SUPABASE_URL);
  console.log('[boot] GOOGLE_APPLICATION_CREDENTIALS set =', !!process.env.GOOGLE_APPLICATION_CREDENTIALS || !!process.env.GOOGLE_VISION_JSON);
}

// Optional Google Vision client (only if creds are present)
let visionClient;
try {
  visionClient = new ImageAnnotatorClient();
} catch (e) {
  console.warn('[boot] Google Vision client not initialized:', e.message);
}

const app = express();
const PORT = process.env.PORT || 5181;

// Security headers
app.use(helmet({
  contentSecurityPolicy: false // keep simple for API-only
}));

// JSON body (for base64 uploads from frontend)
// Increased to 50MB to accept large images, which we'll compress server-side with sharp
app.use(express.json({ limit: '50mb' }));

// CORS allowlist
const ALLOW_ORIGINS = (process.env.CORS_ALLOW_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173').split(',');
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && ALLOW_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Centralized error handler middleware
function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const message = err.message || String(err);
  res.status(status).json({ error: message });
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

// POST /api/uploads  { filename, contentType, base64 } - with trial enforcement
app.post('/api/uploads', checkAccess, enforceTrialLimit('scan'), writeLimiter, async (req, res, next) => {
  try {
    const { filename, contentType, base64 } = req.body || {};
    if (!filename || !base64) return res.status(400).json({ error: 'filename and base64 are required' });
    if (contentType && !/^image\/(png|jpe?g|webp)$/i.test(contentType)) {
      return res.status(400).json({ error: 'unsupported contentType' });
    }

    let buffer = Buffer.from(base64, 'base64');
    
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

    const key = `${Date.now()}-${filename}`;
    const bucket = 'scans';

  // Prefer service role for storage writes to bypass RLS
  const storageClient = supabaseAdmin ?? supabase;
  const { error: upErr } = await storageClient.storage.from(bucket).upload(key, buffer, { contentType });
    if (upErr) {
      if (upErr.message?.toLowerCase().includes('bucket not found')) {
        // Try to create bucket once (best-effort)
        const ensured = await ensureBucketExists(bucket, { public: true });
        if (ensured?.ok) {
          const retry = await storageClient.storage.from(bucket).upload(key, buffer, { contentType });
          if (retry.error) return res.status(500).json({ error: retry.error.message });
        } else {
          return res.status(500).json({ error: `Storage bucket '${bucket}' not found and could not be created. ${ensured?.error || ensured?.reason || ''}`.trim() });
        }
      } else {
        return res.status(500).json({ error: upErr.message });
      }
    }

  const { data: urlData } = storageClient.storage.from(bucket).getPublicUrl(key);
    const publicUrl = urlData?.publicUrl || null;

  // Use service role for table insert to bypass RLS
  const dbClient = supabaseAdmin ?? supabase;
    const insert = await dbClient.from('scans').insert({ image_url: publicUrl, status: 'pending' }).select();
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

// GET /api/scans - list recent
app.get('/api/scans', async (req, res, next) => {
  try {
    const { user_id } = req.query; // Optional: filter to user's own + friends' scans
    // Use service role for reads if available to ensure visibility of all scans
    const readClient = supabaseAdmin ?? supabase;
    
    if (user_id) {
      // Fetch user's scans + friends' scans only
      const { data: friendships, error: friendErr } = await readClient
        .from('friendships')
        .select('user_id, friend_id')
        .or(`user_id.eq.${user_id},friend_id.eq.${user_id}`)
        .eq('status', 'accepted');
      
      if (friendErr) return res.status(500).json({ error: friendErr.message });
      
      const friendIds = new Set([user_id]);
      (friendships || []).forEach(f => {
        if (f.user_id === user_id) friendIds.add(f.friend_id);
        else friendIds.add(f.user_id);
      });
      
      // Step 2: Get scans from user + friends
      const { data, error } = await readClient
        .from('scans')
        .select('*')
        .in('user_id', Array.from(friendIds))
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) return res.status(500).json({ error: error.message });
      return res.json({ scans: data || [] });
    } else {
      // No user_id: return all scans (permissive for dev; tighten in prod)
      const q = readClient.from('scans').select('*').order('created_at', { ascending: false }).limit(100);
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

// GET /api/scans/:id - single
app.get('/api/scans/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    // Use service role for reads if available to ensure visibility of all scans
    const readClient = supabaseAdmin ?? supabase;
    const { data, error } = await readClient.from('scans').select('*').eq('id', id).maybeSingle();
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
  try {
    const id = req.params.id;
    const { data: scan, error: fetchErr } = await readClient.from('scans').select('*').eq('id', id).maybeSingle();
    if (fetchErr) return res.status(500).json({ error: fetchErr.message });
    if (!scan) return res.status(404).json({ error: 'scan not found' });
    if (!scan.image_url) return res.status(400).json({ error: 'scan has no image_url' });
    if (!visionClient) return res.status(500).json({ error: 'Google Vision client not configured' });

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
    try {
      await writeClient
        .from('scans')
        .update({ status: 'failed', result: { error: String(e) } })
        .eq('id', req.params.id);
    } catch {}
    return res.status(500).json({ error: String(e) });
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
app.use('/api/dispensaries', dispensariesRoutes);
app.use('/api/groups', groupsRoutes);
app.use('/api/journals', journalsRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/diagnostic', diagnosticRoutes);
app.use('/api/diagnostic', scanDiagnosticRoutes);
app.use('/api/friends', friendsRoutes);
app.use('/api/membership', membershipRoutes);

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

// In Vercel serverless, don't call listen(); export the app handler instead
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`[strainspotter] backend listening on http://localhost:${PORT}`);
  });
}

export default app;
