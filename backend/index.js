import fs from 'fs';
import path from 'path';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import OpenAI from 'openai';
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
import adminErrorsRoutes from './routes/admin-errors.js';
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
import creditsRoutes from './routes/credits.js';
import directMessagesRoutes from './routes/direct-messages.js';
import { matchStrainByVisuals } from './services/visualMatcher.js';
import { resolveCanonicalStrain } from './services/strainResolution.js';
import { generateLabelAISummary } from './services/aiLabelExplainer.js';
import { generateScanAISummary, buildScanAISummary } from './services/aiSummaries.js';
import { analyzePlantHealth } from './services/plantHealthAnalyzer.js';
import { normalizeMatchConfidence } from './services/matchUtils.js';
import { findSeedBankEntry } from './services/seedBank.js';
import { buildGrowProfile } from './services/buildGrowProfile.js';
import { generateBusinessCode } from './services/businessCode.js';
import { joinZipGroupAndSendMessage, getOrCreateDM } from './services/messaging.js';
import { ensureZipGroup } from './services/groups.js';
import {
  getOrCreateUserUserDM,
  getOrCreateUserBusinessDM,
  sendDMMessage,
  markDMConversationAsRead,
  findOrCreateConversationForUserUser,
  findOrCreateConversationForUserBusiness,
} from './services/dmConversations.js';
import {
  ensureDefaultGroups,
  ensureZipGroup,
  autoJoinUserToGroups,
} from './services/groupSeeder.js';
import {
  consumeScanCredits,
  ensureMonthlyBundle,
  getCreditSummary,
  grantScanCredits,
  ensureStarterBundle,
  refreshStarterWindow
} from './services/scanCredits.js';
import * as scanCreditsV2 from './services/scanCreditsV2.js';
import { checkAccess, enforceTrialLimit } from './middleware/membershipCheck.js';
import { schemaSync } from './services/schemaSync.js';
import { safeUpdateScan, isSchemaError } from './services/safeWrites.js';
import { resolveProRoleForCode, getProRoleFromRequest } from './config/proMode.js';

// Load env from ../env/.env.local (works when launched from backend/)
// In Vercel, environment variables are injected automatically
if (!process.env.VERCEL) {
  dotenv.config({ path: new URL('../env/.env.local', import.meta.url).pathname });
}
if (process.env.NODE_ENV !== 'production') {
  console.log('[boot] SUPABASE_URL present =', !!process.env.SUPABASE_URL);
  console.log('[boot] GOOGLE_APPLICATION_CREDENTIALS set =', !!process.env.GOOGLE_APPLICATION_CREDENTIALS || !!process.env.GOOGLE_VISION_JSON || !!process.env.GOOGLE_VISION_CREDENTIALS_PATH);
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
  } else if (process.env.GOOGLE_VISION_CREDENTIALS_PATH) {
    // For Render.com: use secret file path
    process.env.GOOGLE_APPLICATION_CREDENTIALS = process.env.GOOGLE_VISION_CREDENTIALS_PATH;
    visionClient = new ImageAnnotatorClient();
  } else {
    // Fall back to default credentials file (local development)
    visionClient = new ImageAnnotatorClient();
  }
} catch (e) {
  console.warn('[boot] Google Vision client not initialized:', e.message);
}

// Schema sync on server start - ensure all required columns exist
(async () => {
  try {
    await schemaSync(supabaseAdmin, supabase);
    console.log('[SchemaSync] Completed');
  } catch (err) {
    console.error('[SchemaSync] Failed:', err);
    // Don't block server startup - safe writes will handle missing columns
  }
})();

// OpenAI client for GPT-5 nano packaging analysis
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

if (!process.env.OPENAI_API_KEY) {
  console.warn('[boot] OPENAI_API_KEY not set; GPT-5 nano packaging analysis disabled.');
}

const PACKAGING_SYSTEM_PROMPT = `
You are the StrainSpotter Packaging Intelligence engine.

Your job:
- Take noisy OCR text and Vision metadata from cannabis packaging (any country, any language).
- Output ONE JSON object called "packagingInsights" using the EXACT schema below.
- Do not include any keys outside this structure.

SCHEMA (fixed):

{
  "basic": {
    "detected_language": string | null,
    "brand_name": string | null,
    "product_line": string | null,
    "strain_name": string | null,
    "strain_slug_guess": string | null,
    "product_type": string | null,
    "category_tags": string[],
    "country": string | null,
    "region": string | null
  },
  "potency": {
    "thc_percent": number | null,
    "cbd_percent": number | null,
    "thc_range": [number, number] | null,
    "other_cannabinoids": [
      { "name": string, "percent": number | null }
    ],
    "total_cannabinoids_percent": number | null
  },
  "terpenes": {
    "listed_terpenes": [
      { "name": string, "percent": number | null }
    ],
    "terpene_profile_tags": string[]
  },
  "package_details": {
    "net_weight_grams": number | null,
    "servings": number | null,
    "harvest_date": string | null,
    "packaged_date": string | null,
    "best_by_date": string | null,
    "batch_number": string | null,
    "unit_barcode": string | null
  },
  "regulatory": {
    "license_number": string | null,
    "producer_name": string | null,
    "producer_address": string | null,
    "testing_lab_name": string | null,
    "testing_lab_license": string | null,
    "regulatory_symbols": string[],
    "age_restriction": string | null,
    "warning_statements": string[],
    "compliance_flags": string[]
  },
  "marketing_copy": {
    "effects_claims": string[],
    "flavor_notes": string[],
    "use_cases": string[]
  },
  "business_tags": {
    "intended_channel": string[],
    "price_tier_guess": string | null,
    "bundle_type": string | null,
    "has_loyalty_program_mentions": boolean
  },
  "raw": {
    "ocr_text_raw": string,
    "ocr_text_cleaned": string,
    "vision_labels": string[],
    "model_notes": string
  },
  "confidence": {
    "overall": number,
    "strain_name": number,
    "potency": number,
    "license_number": number,
    "country_inference": number
  }
}

CRUCIAL RULES:
- Return ONLY that JSON object (no explanations).
- If a field is missing or unclear, use null, [], or "" instead of guessing wildly.
- Keep brand_name, product_line, and strain_name exactly as written on the label (do NOT translate).
- When a strain name on the label contains multiple words, keep the FULL phrase in basic.strain_name.
  - Example: if the label text says "Commerce City Kush", basic.strain_name MUST be "Commerce City Kush" exactly.
  - Do NOT shorten it to "City Kush", "Kush", or any other subset of the words.
- Do NOT replace the printed strain name with a more popular or standardized strain, even if you think it might be related.
  - Example: never change "Commerce City Kush" to "MAC" or "Miracle Alien Cookies", even if they seem related.
- If the same phrase appears as both a location and part of the strain name, prefer to treat it as part of the strain name when it is printed together with "kush", "og", or other strain keywords.
- If a clear strain name cannot be found in the OCR text at all, then:
  - Set basic.strain_name = null,
  - Put any best-effort guess into basic.strain_slug_guess instead,
  - And keep confidence.strain_name <= 0.5.
- If the OCR text clearly contains a strain name, set confidence.strain_name >= 0.9 and DO NOT change that printed name based on external knowledge or popularity.
- detected_language describes the OCR text language (e.g., "en", "fr").
- product_type should be terms like "flower", "pre-roll", "vape", "edible", "concentrate", "tincture", "topical", "capsule", etc.

POTENCY INTERPRETATION:
- Map any clearly labeled "THC" or "Total THC" percentage to potency.thc_percent.
  Example: "THC 28.5%" → 28.5
- If a range is shown ("THC 27–29%"), fill thc_range: [27, 29].
- If numbers are in mg per package or per serving, do NOT convert to percent unless percent is printed.
  - mg-only values can contribute to total_cannabinoids_percent = null.
- If a "Total Cannabinoids" percentage is present, set total_cannabinoids_percent to that number.
- For other cannabinoids like CBG, CBN, CBC, etc., put each as { "name": "CBG", "percent": 0.8 } if a % is shown.
- If only mg is shown for a cannabinoid and no percentage, set percent=null but still include it by name.

TERPENES:
- listed_terpenes: only terpenes actually named on the label (e.g., limonene, myrcene, caryophyllene).
- terpene_profile_tags: short human-friendly tags like "citrus", "gassy", "earthy", "sweet", "herbal".

REGION / COUNTRY:
- If you see symbols like the California cannabis warning triangle or text like "Government Warning (California)", infer country="US", region="CA".
- If nothing suggests region, leave both as null.

COMPLIANCE_FLAGS:
- Use string flags like:
  - "has_state_warning_text"
  - "has_state_symbol"
  - "has_license_number"
  - "has_lab_results"
  - "missing_license_number"
  - "missing_state_symbol"
  etc.
- Only include flags you are confident about.

CONFIDENCE:
- overall, strain_name, potency, license_number, country_inference must be in [0.0, 1.0].
- If the strain name text clearly appears on the label, strain_name confidence >= 0.9.
- If potency numbers appear next to THC/CBD labels, potency confidence >= 0.95.
- Be conservative with license_number and country_inference: only high if the label is explicit.

NEVER OVERRIDE PRINTED STRAIN NAMES:

- If the OCR text clearly contains a strain name (for example: "Commerce City Kush", "Apple Fritter", "Gary Payton"), you MUST copy it exactly into basic.strain_name.

- Do NOT replace the printed strain name with a more popular or standardized strain name, even if they are similar.
  - Example: if the package says "Commerce City Kush", do NOT change it to "MAC" or "Miracle Alien Cookies" or anything else.
  - Example: if the package says "Gary Payton", keep "Gary Payton" exactly, even if you think it might be a different spelling or a different variant.

- Never infer a strain name that is not printed on the label. If a strain name does not appear in the OCR text, leave basic.strain_name = null and basic.strain_slug_guess can be a best-effort guess.

- If the OCR text clearly contains a strain name, set confidence.strain_name >= 0.9 and do not change that name based on external popularity.

RAW VS INTERPRETATION:

- Whenever there is a conflict between "what the label literally says" and "what you think it might be", always trust the label.

- The JSON must represent the text on the packaging first; educated guesses go only into fields like basic.strain_slug_guess, business_tags, or model_notes, never into basic.strain_name.

raw.model_notes:
- Add short notes about any weirdness or uncertainty (e.g., "THC printed as 'Total THC 1000 mg per package' – mg only, no percent.").
`;

async function buildPackagingInsightsFromVision({ visionResult, strainLibrarySample = [], countryHint = null, regionHint = null }) {
  if (!openai.apiKey) {
    console.warn('[packagingInsights] OPENAI_API_KEY missing; skipping GPT analysis.');
    return null;
  }

  // Extract OCR text & labels from Vision result
  const fullText = visionResult?.fullTextAnnotation?.text || '';
  const labelAnnotations = Array.isArray(visionResult?.labelAnnotations)
    ? visionResult.labelAnnotations
    : [];
  const webEntities = Array.isArray(visionResult?.webDetection?.webEntities)
    ? visionResult.webDetection.webEntities
    : [];

  const cleanedText = fullText
    .replace(/\s+/g, ' ')
    .trim();

  const visionLabels = [
    ...labelAnnotations.map(l => l.description).filter(Boolean),
    ...webEntities.map(w => w.description).filter(Boolean),
  ].filter(Boolean);

  const payload = {
    ocr_text_raw: fullText,
    ocr_text_cleaned: cleanedText,
    vision_labels: visionLabels.slice(0, 40),
    country_hint: countryHint,
    region_hint: regionHint,
    strain_library_sample: strainLibrarySample.slice(0, 150), // keep prompt small
  };

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Using gpt-4o-mini as gpt-5.1-nano doesn't exist yet
      messages: [
        { role: 'system', content: PACKAGING_SYSTEM_PROMPT },
        {
          role: 'user',
          content: JSON.stringify(payload),
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const text = response?.choices?.[0]?.message?.content;
    if (!text) {
      console.error('[packagingInsights] Missing text in OpenAI response');
      return null;
    }
    
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (parseErr) {
      console.error('[packagingInsights] JSON parse error', parseErr);
      return null;
    }
    
    console.log('[packagingInsights] success', {
      ocrChars: payload.ocr_text_raw?.length || 0,
      labels: payload.vision_labels?.slice(0, 5) || [],
      countryHint: payload.country_hint || null,
      regionHint: payload.region_hint || null,
    });
    
    return parsed;
  } catch (err) {
    console.error('[packagingInsights] Error from GPT-5 nano', {
      message: err?.message || String(err),
      ocrChars: payload.ocr_text_raw?.length || 0,
      labels: payload.vision_labels?.slice(0, 5) || [],
    });
    return null;
  }
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
  'https://strain-spotter.vercel.app',
  'https://strainspotter-frontend.vercel.app',
  'https://frontend-goaqagqo9-tophercook7-makers-projects.vercel.app',
  'https://frontend-gmgc1mgxt-tophercook7-makers-projects.vercel.app',
  'capacitor://localhost',  // iOS/Android Capacitor app
  'ionic://localhost',      // Alternative Capacitor protocol
  'http://localhost',       // Capacitor fallback
  'https://localhost'       // Capacitor fallback
];
const ALLOW_ORIGINS = (process.env.CORS_ALLOW_ORIGINS || DEFAULT_ORIGINS.join(','))
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

function isAllowedOrigin(origin) {
  if (!origin) return false;

  // Check exact match first
  if (ALLOW_ORIGINS.includes(origin)) {
    console.log('[CORS] Allowed (exact match):', origin);
    return true;
  }

  // Always allow Capacitor mobile app (capacitor:// and ionic:// protocols)
  if (origin.startsWith('capacitor://') || origin.startsWith('ionic://')) {
    console.log('[CORS] Allowed (Capacitor mobile app):', origin);
    return true;
  }

  // In production, be strict - only allow exact matches
  if (process.env.NODE_ENV === 'production') {
    console.log('[CORS] Rejected (production mode, no exact match):', origin);
    return false;
  }

  // Development mode: Allow localhost and 127.0.0.1 with any port
  // This permits local dev machines to call the backend regardless of port drift
  try {
    const u = new URL(origin);
    if ((u.hostname === 'localhost' || u.hostname === '127.0.0.1')) {
      console.log('[CORS] Allowed (localhost dev):', origin);
      return true;
    }
  } catch {}

  // Development mode: Allow Vercel preview/prod frontend domains for this project
  try {
    const { host } = new URL(origin);
    if (
      host.endsWith('.vercel.app') &&
      (
        host.includes('strain-spotter') ||
        host.includes('strainspotter-frontend') ||
        host.includes('frontend-') ||
        host.includes('tophercook7-maker')
      )
    ) {
      console.log('[CORS] Allowed (Vercel wildcard dev):', origin);
      return true;
    }
  } catch {}

  console.log('[CORS] Rejected:', origin);
  return false;
}

app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowed = isAllowedOrigin(origin);

  // Debug logging for CORS issues
  if (origin && !allowed) {
    console.log('[CORS] Rejected origin:', origin);
  }

  if (allowed) {
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
let cachedStrains = null;
let cachedStrainsLoadedAt = 0;
const STRAIN_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function sanitizeContextBody(body) {
  if (!body || typeof body !== 'object') return null;
  try {
    const clone = JSON.parse(JSON.stringify(body));
    if (clone.base64) clone.base64 = '[omitted base64]';
    if (clone.content && typeof clone.content === 'string' && clone.content.length > 500) {
      clone.content = `${clone.content.slice(0, 500)}…`;
    }
    return clone;
  } catch {
    return null;
  }
}

async function persistAdminError(entry) {
  if (!supabaseAdmin) return;
  try {
    await supabaseAdmin
      .from('admin_errors')
      .insert(entry);
  } catch (err) {
    console.warn('[admin_errors] Failed to persist:', err?.message || err);
  }
}

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

  const context = {
    body: sanitizeContextBody(req?.body),
    query: req?.query || undefined,
    headers: req?.headers ? {
      'x-request-id': req.headers['x-request-id'] || undefined
    } : undefined
  };

  persistAdminError({
    created_at: timestamp,
    user_id: errorEntry.userId || null,
    path: errorEntry.url,
    method: errorEntry.method,
    status_code: errorEntry.status,
    message: errorEntry.error,
    stack: errorEntry.stack,
    context
  });
}

async function loadStrainLibrary(force = false) {
  const now = Date.now();
  if (!force && cachedStrains && now - cachedStrainsLoadedAt < STRAIN_CACHE_TTL_MS) {
    return cachedStrains;
  }

  let strains = [];
  const dataDir = new URL('./data/', import.meta.url).pathname;
  const primary = path.join(dataDir, 'strain_library.json');
  const enhanced = path.join(dataDir, 'strain_library_enhanced.json');

  if (fs.existsSync(primary)) {
    strains = JSON.parse(fs.readFileSync(primary, 'utf8'));
  } else if (fs.existsSync(enhanced)) {
    strains = JSON.parse(fs.readFileSync(enhanced, 'utf8'));
  } else {
    const { data: dbStrains, error: dbError } = await supabase
      .from('strains')
      .select('*');
    if (dbError) {
      throw new Error(`Supabase error: ${dbError.message}`);
    }
    strains = dbStrains || [];
  }

  if (!strains?.length) {
    throw new Error('Strain library unavailable');
  }

  cachedStrains = strains;
  cachedStrainsLoadedAt = now;
  return strains;
}

function serializeMatch(match) {
  if (!match) return null;
  const strain = match.strain || {};
  return {
    strain_slug: strain.slug,
    name: strain.name,
    type: strain.type,
    description: strain.description,
    effects: strain.effects,
    flavors: strain.flavors,
    thc: strain.thc,
    cbd: strain.cbd,
    lineage: strain.lineage,
    confidence: match.confidence,
    score: Math.round(match.score || 0),
    reasoning: match.reasoning
  };
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

// Rate limiters for different endpoint types
const writeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute per IP
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

// Stricter limiter for expensive scan processing
const scanProcessLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 scans per hour per IP
  message: 'Scan limit reached. Please try again in an hour.',
  standardHeaders: true,
  legacyHeaders: false
});

// General API rate limiter (applied to all /api routes)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes per IP
  message: 'Too many API requests, please slow down.',
  standardHeaders: true,
  legacyHeaders: false
});

// --- Health ---
app.get('/health', async (req, res, next) => {
  try {
    const supabaseOk = !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
    const visionOk = !!process.env.GOOGLE_APPLICATION_CREDENTIALS || !!process.env.GOOGLE_VISION_JSON || !!process.env.GOOGLE_VISION_CREDENTIALS_PATH;
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
    const payload = req.body || {};
    const { user_id } = payload;
    let { filename, contentType, base64 } = payload;

    // Legacy/mobile payloads sometimes send { image: 'data:image/...;base64,XXXX' } or imageData
    const dataUrlFields = ['image', 'imageData', 'data_url'];
    for (const field of dataUrlFields) {
      const value = payload[field];
      if (!base64 && typeof value === 'string') {
        const commaIndex = value.indexOf(',');
        if (value.startsWith('data:') && commaIndex >= 0) {
          const header = value.slice(0, commaIndex);
          const matches = /^data:([^;]+);base64$/i.exec(header);
          if (matches && matches[1] && !contentType) {
            contentType = matches[1];
          }
          base64 = value.slice(commaIndex + 1);
        } else {
          base64 = value;
        }
      }
    }

    if (!filename) {
      filename = payload.name || `scan-${Date.now()}.jpg`;
    }

    if (!base64) {
      return res.status(400).json({
        error: 'Base64 payload missing',
        details: { receivedFields: Object.keys(payload || {}) }
      });
    }

    const allowedTypes = [
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/webp',
      'image/heic',
      'image/heif'
    ];

    let normalizedContentType = contentType ? contentType.toLowerCase() : null;
    if (normalizedContentType && !allowedTypes.includes(normalizedContentType)) {
      return res.status(400).json({
        error: 'unsupported contentType',
        details: { contentType: normalizedContentType, allowedTypes }
      });
    }
    if (!normalizedContentType) {
      normalizedContentType = 'image/jpeg';
    }

    // Guest scan limit: effectively infinite for dev (1000 = no practical limit)
    const GUEST_SCAN_LIMIT = 1000;
    
    if (!user_id) {
      const guestIdentifier = req.headers['x-session-id'] || req.ip || 'unknown';
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      // Count guest scans by session_id in last 24 hours
      const { data: guestScans, error: countError } = await (supabaseAdmin ?? supabase)
        .from('scans')
        .select('id')
        .is('user_id', null)
        .gte('created_at', oneDayAgo);
      
      // Filter by session_id (client-side since Supabase OR with multiple fields is complex)
      const matchingScans = guestScans?.filter(scan => {
        // This will work if we store session_id, otherwise count all guest scans
        return true; // For now, count all guest scans in last 24h
      }) || [];
      
      // Log warning if limit exceeded, but don't block in dev
      if (!countError && matchingScans.length >= GUEST_SCAN_LIMIT) {
        console.warn('[GuestScanLimit] Guest has exceeded nominal limit but continuing for dev', {
          guestIdentifier,
          guestScanCount: matchingScans.length,
          limit: GUEST_SCAN_LIMIT
        });
        // DO NOT return here, just continue to create the scan
      }
    }

    // Ensure starter credits exist and membership bundle is aligned before any processing (only if user is logged in)
    if (user_id) {
      await ensureStarterBundle(user_id);
      await ensureMonthlyBundle(user_id);
    }

    let buffer;
    try {
      buffer = Buffer.from(base64, 'base64');
    } catch (err) {
      return res.status(400).json({ error: 'Invalid base64 payload', details: err.message });
    }

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
  try {
    const { error: upErr, data: uploadData } = await storageClient.storage.from(normalizedBucket).upload(normalizedKey, buffer, { contentType: normalizedContentType });
    if (upErr) {
      console.error('[uploads:error] Storage upload failed:', {
        status: upErr.status || null,
        message: upErr.message || 'unknown error',
        error: upErr.error || null,
        hint: upErr.hint || null,
        stack: upErr.stack || null,
        bucket: normalizedBucket,
        key: normalizedKey
      });
      
      if (upErr.message?.toLowerCase().includes('bucket not found')) {
        // Try to create bucket once (best-effort)
        const ensured = await ensureBucketExists(normalizedBucket, { public: true });
        if (ensured?.ok) {
          const retry = await storageClient.storage.from(normalizedBucket).upload(normalizedKey, buffer, { contentType: normalizedContentType });
          if (retry.error) {
            console.error('[uploads:error] Storage retry failed:', {
              status: retry.error.status || null,
              message: retry.error.message || 'unknown error',
              error: retry.error.error || null,
              hint: retry.error.hint || null
            });
            return res.status(500).json({ 
              error: retry.error.message || 'Storage upload failed',
              hint: retry.error.hint || null
            });
          }
        } else {
          return res.status(500).json({ 
            error: `Storage bucket '${normalizedBucket}' not found and could not be created. ${ensured?.error || ensured?.reason || ''}`.trim(),
            hint: 'Ensure the scans bucket exists in Supabase Storage'
          });
        }
      } else {
        return res.status(500).json({ 
          error: upErr.message || 'Storage upload failed',
          hint: upErr.hint || null
        });
      }
    }
  } catch (storageErr) {
    console.error('[uploads:error] Storage upload exception:', {
      message: storageErr?.message || 'unknown exception',
      stack: storageErr?.stack || null,
      name: storageErr?.name || null
    });
    return res.status(500).json({ 
      error: storageErr?.message || 'Storage upload failed',
      hint: 'Check backend logs for details'
    });
  }

    const { data: urlData } = storageClient.storage.from(normalizedBucket).getPublicUrl(normalizedKey);
    const publicUrl = urlData?.publicUrl || null;

    // Use service role for table insert to bypass RLS
    const dbClient = supabaseAdmin ?? supabase;
    try {
      // For guest scans, track by session ID for limit enforcement
      const guestIdentifier = !user_id ? (req.headers['x-session-id'] || req.ip || null) : null;
      const insertData = {
        image_url: publicUrl,
        image_key: normalizedKey,
        status: 'pending',
        user_id: user_id || null
      };
      // Add guest tracking field if available
      if (guestIdentifier) {
        insertData.session_id = guestIdentifier;
      }
      
      const insert = await dbClient.from('scans').insert(insertData).select();
      if (insert.error) {
        console.error('[uploads:error] Database insert failed:', {
          status: insert.error.status || null,
          message: insert.error.message || 'unknown error',
          error: insert.error.error || null,
          hint: insert.error.hint || null,
          code: insert.error.code || null,
          details: insert.error.details || null
        });
        
        const msg = insert.error.message || 'Database insert failed';
        const hint = insert.error.hint || ((!supabaseAdmin && /row-level security/i.test(msg))
          ? 'Supabase RLS blocked anon insert. Add SUPABASE_SERVICE_ROLE_KEY to env/.env.local and restart the backend.'
          : null);
        return res.status(500).json({ error: msg, hint });
      }

      const scan = Array.isArray(insert.data) ? insert.data[0] : insert.data;
      const scanId = scan?.id || null;
      
      // CRITICAL: Log the exact scan ID being returned to frontend
      console.log('[uploads] Returning scan ID to frontend', {
        scanId,
        hasScan: !!scan,
        scanKeys: scan ? Object.keys(scan) : [],
      });
      
      if (!scanId) {
        console.error('[uploads] ERROR: No scan ID in insert response', {
          insertData: insert.data,
          scan,
        });
      }
      
      res.json({ id: scanId, image_url: publicUrl });
    } catch (dbErr) {
      console.error('[uploads:error] Database insert exception:', {
        message: dbErr?.message || 'unknown exception',
        stack: dbErr?.stack || null,
        name: dbErr?.name || null
      });
      return res.status(500).json({ 
        error: dbErr?.message || 'Database insert failed',
        hint: 'Check backend logs for details'
      });
    }
  } catch (e) {
    console.error('[uploads:error] Unexpected exception:', {
      message: e?.message || String(e),
      stack: e?.stack || null,
      name: e?.name || null
    });
    res.status(500).json({ 
      error: e?.message || String(e),
      hint: 'Check backend logs for full error details'
    });
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
    const { 
      user_id, 
      role,           // 'dispensary' | 'grower'
      type,           // 'packaged' | 'bud'
      strain,         // strain name filter
      date_start,     // ISO date string
      date_end,       // ISO date string
      limit = 200
    } = req.query;
    
    // Use service role for reads if available to ensure visibility of all scans
    const readClient = supabaseAdmin ?? supabase;

    // Build query
    let query = readClient
      .from('scans')
      .select(
        `
          id,
          user_id,
          created_at,
          processed_at,
          image_url,
          status,
          result,
          packaging_insights,
          label_insights,
          ai_summary,
          error,
          match_confidence,
          match_quality,
          matched_strain_name,
          matched_strain_slug,
          canonical_strain_name,
          canonical_strain_source,
          canonical_match_confidence,
          pro_role,
          plant_health,
          plant_age
        `
      );

    // Apply filters
    if (user_id) {
      query = query.eq('user_id', user_id);
    }

    if (role === 'dispensary' || role === 'grower') {
      query = query.eq('pro_role', role);
    }

    if (strain) {
      // Search in canonical_strain_name or matched_strain_name
      // PostgREST or() syntax: column1.ilike.value1,column2.ilike.value2
      const strainPattern = `%${strain}%`;
      query = query.or(`canonical_strain_name.ilike.${strainPattern},matched_strain_name.ilike.${strainPattern}`);
    }

    if (date_start) {
      query = query.gte('created_at', date_start);
    }

    if (date_end) {
      query = query.lte('created_at', date_end);
    }

    // Apply type filter (packaged vs bud)
    // This requires checking packaging_insights or label_insights
    // We'll filter in memory after fetching since JSONB filtering is complex
    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(parseInt(limit, 10) || 200);

    if (error) return res.status(500).json({ error: error.message });

    let filteredScans = data || [];

    // Apply type filter in memory (packaged vs bud)
    if (type === 'packaged' || type === 'bud') {
      filteredScans = filteredScans.filter(scan => {
        const pkg = scan.packaging_insights || scan.label_insights || {};
        const hasPackagingStrain = !!(pkg.strainName || pkg.basic?.strain_name);
        const isPackaged = hasPackagingStrain;
        
        if (type === 'packaged') {
          return isPackaged;
        } else {
          return !isPackaged;
        }
      });
    }

    return res.json({ scans: filteredScans });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// POST /api/scans - Create scan from base64 image data
app.post('/api/scans', async (req, res, next) => {
  const writeClient = supabaseAdmin ?? supabase;
  try {
    const { imageData } = req.body || {};
    if (!imageData) return res.status(400).json({ error: 'imageData required' });

    // Upload base64 image to Supabase storage
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const fileName = `scan-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;

    const { data: uploadData, error: uploadError } = await writeClient.storage
      .from('scans')
      .upload(fileName, buffer, {
        contentType: 'image/jpeg',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return res.status(500).json({ error: 'Failed to upload image' });
    }

    // Get public URL
    const { data: { publicUrl } } = writeClient.storage
      .from('scans')
      .getPublicUrl(fileName);

    // Create scan record
    const insert = await writeClient.from('scans').insert({
      image_url: publicUrl,
      status: 'pending'
    }).select().single();

    if (insert.error) return res.status(400).json({ error: insert.error.message });
    res.json({ scanId: insert.data.id, image_url: publicUrl });
  } catch (e) {
    console.error('Scan creation error:', e);
    next(e);
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
    
    // FOUNDER OVERRIDE: Check if user is founder before credit checks
    if (await isFounder(userId)) {
      return res.json({
        canScan: true,
        unlimited: true,
        remainingScans: Number.POSITIVE_INFINITY,
        membershipTier: 'founder_unlimited',
        tier: 'admin',
        creditsRemaining: 999999,
        monthlyLimit: 999999,
        usedThisMonth: 0,
        lifetimeScansUsed: 0,
        isUnlimited: true,
        needsUpgrade: false,
        override: 'founder',
        message: 'Founder account — unlimited scans active'
      });
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
// BACKEND CONTRACT: Returns scan object directly (not wrapped)
// Response shape: { id, status, result, ai_summary, matched_strain_slug, matched_strain_name, match_confidence, match_quality, processed_at, ... }
// Status values: 'pending' | 'processing' | 'completed' | 'failed'
// When status='completed', result object contains: vision_raw, packagingInsights, visualMatches, labelInsights
app.get('/api/scans/:id', async (req, res, next) => {
  try {
    const scanId = req.params.id;
    // Validate UUID format (v4)
    const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidV4Regex.test(scanId)) {
      return res.status(400).json({ error: 'Invalid scan ID: must be a UUID v4.' });
    }
    // Use service role for reads if available to ensure visibility of all scans
    const readClient = supabaseAdmin ?? supabase;
    
    // CRITICAL: Do NOT use relationship queries - FK constraint was dropped
    // Select only columns directly from scans table
    const { data: scan, error } = await readClient
      .from('scans')
      .select(
        `
          id,
          created_at,
          processed_at,
          image_url,
          status,
          result,
          packaging_insights,
          label_insights,
          ai_summary,
          error,
          match_confidence,
          match_quality,
          matched_strain_name,
          matched_strain_slug,
          canonical_strain_name,
          canonical_strain_source,
          canonical_match_confidence,
          pro_role,
          plant_health,
          plant_age
        `
      )
      .eq('id', scanId)
      .maybeSingle();
    
    // Handle Supabase errors
    if (error) {
      // PGRST116 = no rows found (PostgREST error code)
      if (error.code === 'PGRST116' || error.message?.includes('Results contain 0 rows')) {
        console.error('[GET /api/scans/:id] Not found', { scanId, error });
        return res.status(404).json({ error: 'Scan not found' });
      }
      console.error('[GET /api/scans/:id] Supabase error', { scanId, error });
      return res.status(500).json({ error: 'Failed to fetch scan' });
    }
    
    // Handle case where no scan found but no error returned
    if (!scan) {
      console.error('[GET /api/scans/:id] No scan found, but no error from Supabase', { scanId });
      return res.status(404).json({ error: 'Scan not found' });
    }
    
    // Ensure canonicalStrain is included in response
    // Priority: dedicated columns > result.canonicalStrain > legacy fields
    const result = scan.result || {};
    const canonicalStrain = 
      (scan.canonical_strain_name || scan.canonical_strain_source || scan.canonical_match_confidence != null)
        ? {
            name: scan.canonical_strain_name || null,
            source: scan.canonical_strain_source || null,
            confidence: scan.canonical_match_confidence ?? null,
          }
        : (result.canonicalStrain || {
            name: scan.matched_strain_name || null,
            source: scan.match_quality || null,
            confidence: scan.match_confidence || null,
          });
    
    // Add business profile if user is a business
    let businessProfile = null;
    if (scan.user_id) {
      try {
        const { data: business, error: businessError } = await supabaseAdmin
          .from('business_profiles')
          .select('*')
          .eq('user_id', scan.user_id)
          .maybeSingle();

        if (!businessError && business) {
          businessProfile = business;
        }
      } catch (err) {
        // Don't fail the request if business profile lookup fails
        console.warn('[GET /api/scans/:id] Business profile lookup error', err);
      }
    }

    // Return scan object directly (not wrapped) - frontend expects this shape
    return res.json({
      ...scan,
      canonicalStrain,
      business_profile: businessProfile,
    });
  } catch (e) {
    console.error('[GET /api/scans/:id] Unexpected error', { scanId: req.params.id, error: e });
    next(e);
  }
});

// POST /api/scans/:id/process - Vision annotate and save
// Supports both single-frame and multi-frame (multi-angle) processing
app.post('/api/scans/:id/process', scanProcessLimiter, async (req, res, next) => {
  // Use service role for all scan operations when available
  const readClient = supabaseAdmin ?? supabase;
  const writeClient = supabaseAdmin ?? supabase;
  let creditConsumed = false;
  const id = req.params.id;
  
  // CRITICAL: Log process endpoint start with scan ID and request body
  console.log('[scan-process] START', {
    id,
    hasBody: !!req.body,
    bodyKeys: req.body ? Object.keys(req.body) : [],
    frameImageUrls: req.body?.frameImageUrls?.length || 0,
  });
  
  console.time(`[scan-process-total] ${id}`);
  
  // CRITICAL: Wrap entire processing in try/catch to handle schema errors gracefully
  try {
    const { frameImageUrls } = req.body || {}; // Optional: array of additional frame image URLs for multi-angle
    
    const { data: scan, error: fetchErr } = await readClient.from('scans').select('*').eq('id', id).maybeSingle();
    if (fetchErr) return res.status(500).json({ error: fetchErr.message });
    if (!scan) return res.status(404).json({ error: 'scan not found' });
    if (!scan.image_url) return res.status(400).json({ error: 'scan has no image_url' });
    if (!visionClient) return res.status(500).json({ error: 'Google Vision client not configured' });

    // Determine if this is a multi-frame scan
    const isMultiFrame = Array.isArray(frameImageUrls) && frameImageUrls.length > 0;
    const allFrameUrls = isMultiFrame ? [scan.image_url, ...frameImageUrls] : [scan.image_url];
    const numberOfFrames = allFrameUrls.length;

    console.log('[scan-process] start', { id, imageUrl: scan.image_url, status: scan.status, isMultiFrame, numberOfFrames });

    if ((scan.status === 'done' || scan.status === 'completed') && scan.result) {
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

    // CREDIT SYSTEM V2: Check and deduct credits
    if (scanOwnerId) {
      console.log('[scan/process] Checking credits for user:', scanOwnerId);

      // Check if user has credits (founders always pass)
      const hasAvailableCredits = await scanCreditsV2.hasCredits(scanOwnerId);

      if (!hasAvailableCredits) {
        const balance = await scanCreditsV2.getCreditBalance(scanOwnerId);

        return res.status(402).json({
          error: 'INSUFFICIENT_CREDITS',
          message: balance.tier === 'free'
            ? 'You have used all 10 free scans. Upgrade to Member ($4.99/mo) for 200 scans/month or buy a top-up pack!'
            : `You have used all ${balance.monthlyLimit} scans this month. Upgrade your plan or buy a top-up pack!`,
          tier: balance.tier,
          creditsRemaining: balance.creditsRemaining,
          monthlyLimit: balance.monthlyLimit,
          usedThisMonth: balance.usedThisMonth,
          needsUpgrade: balance.tier === 'free'
        });
      }

      // Deduct credit (founders skip deduction)
      const deductResult = await scanCreditsV2.deductCredit(scanOwnerId);

      if (!deductResult.success) {
        return res.status(402).json({
          error: 'INSUFFICIENT_CREDITS',
          message: 'Failed to deduct scan credit',
          code: deductResult.error
        });
      }

      if (deductResult.unlimited) {
        console.log(`[scan/process] Founder scan - unlimited credits`);
      } else {
        console.log(`[scan/process] Credit deducted. Remaining: ${deductResult.creditsRemaining}`);
      }
      creditConsumed = true;
    } else {
      // Guest scan - no credit enforcement
      console.log('[scan/process] Processing guest scan (no user_id)');
    }

    // CRITICAL: Use safe write for status update
    await safeUpdateScan(writeClient, id, { status: 'processing' }, 'scan-process-start');

    // Process single frame or multiple frames (multi-angle)
    // Use the frameUrls already declared above
    const frameUrls = allFrameUrls;
    const totalFrames = numberOfFrames;
    
    // Process all frames with Vision API
    const visionResults = [];
    const frameMatchResults = [];
    
    for (let i = 0; i < frameUrls.length; i++) {
      const frameUrl = frameUrls[i];
      console.log(`[scan-process] Processing frame ${i + 1}/${totalFrames}: ${frameUrl}`);
      
      // Download the image bytes server-side
      let contentBuffer = null;
      try {
        const resp = await fetch(frameUrl);
        if (resp.ok) {
          const ab = await resp.arrayBuffer();
          contentBuffer = Buffer.from(ab);
          
          // Auto-compress if needed
          const MAX_VISION_SIZE = 10 * 1024 * 1024; // 10MB to be safe
          if (contentBuffer.length > MAX_VISION_SIZE) {
            console.log(`[process] Compressing frame ${i + 1} from ${(contentBuffer.length / 1024 / 1024).toFixed(2)}MB`);
            contentBuffer = await sharp(contentBuffer)
              .resize(2048, 2048, { fit: 'inside', withoutEnlargement: true })
              .jpeg({ quality: 85, progressive: true })
              .toBuffer();
          }
        }
      } catch (e) {
        console.warn(`[process] Failed to download frame ${i + 1}:`, e.message);
        continue;
      }

      if (!contentBuffer) {
        // Fallback: attempt storage download via Supabase
        try {
          const url = new URL(frameUrl);
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
        } catch (e) {
          console.warn(`[process] Fallback download failed for frame ${i + 1}:`, e.message);
          continue;
        }
      }

      if (!contentBuffer) {
        console.warn(`[process] Could not download frame ${i + 1}, skipping`);
        continue;
      }

      // Preprocess image for faster Vision API response
      const optimizedBuffer = await sharp(contentBuffer)
        .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 90, progressive: true })
        .toBuffer();

      // Call Vision API
      console.time(`[scan-process-vision] ${id}-frame${i + 1}`);
      const [frameResult] = await visionClient.annotateImage({
        image: { content: optimizedBuffer },
        features: [
          { type: 'LABEL_DETECTION', maxResults: 50 },
          { type: 'IMAGE_PROPERTIES' },
          { type: 'WEB_DETECTION', maxResults: 20 },
          { type: 'TEXT_DETECTION' }
        ],
      });
      console.timeEnd(`[scan-process-vision] ${id}-frame${i + 1}`);

      visionResults.push(frameResult);
      
      // Run visual matching on this frame
      try {
        console.time(`[scan-process-matching] ${id}-frame${i + 1}`);
        const strains = await loadStrainLibrary();
        const frameMatchResult = matchStrainByVisuals(frameResult, strains);
        console.timeEnd(`[scan-process-matching] ${id}-frame${i + 1}`);
        frameMatchResults.push(frameMatchResult);
      } catch (matchErr) {
        console.error(`[process] Error matching frame ${i + 1}:`, matchErr);
        frameMatchResults.push({ matches: [], labelInsights: null });
      }
    }

    if (visionResults.length === 0) {
      return res.status(500).json({ error: 'Could not process any frames' });
    }

    // Aggregate results if multi-frame
    let aggregatedMatchResult = null;
    let combinedVisionResult = null;
    let stabilityScore = 1.0;
    let stabilityLabel = 'single-frame';
    
    if (isMultiFrame && frameMatchResults.length > 1) {
      aggregatedMatchResult = aggregateMultiFrameMatches(frameMatchResults);
      combinedVisionResult = combineVisionResults(visionResults);
      const stability = calculateStability(frameMatchResults, aggregatedMatchResult);
      stabilityScore = stability.score;
      stabilityLabel = stability.label;
      console.log(`[scan-process] Multi-frame aggregation complete: ${frameMatchResults.length} frames, stability: ${stabilityLabel} (${(stabilityScore * 100).toFixed(0)}%)`);
    } else {
      // Single frame
      aggregatedMatchResult = frameMatchResults[0] || { matches: [], labelInsights: null };
      combinedVisionResult = visionResults[0];
    }

    // Use combined/aggregated results for rest of processing
    const result = combinedVisionResult;
    const matchResult = aggregatedMatchResult;

    console.log('[scan-process] vision complete', {
      id,
      numberOfFrames: totalFrames,
      isMultiFrame,
      hasText: !!result?.fullTextAnnotation?.text,
      labelCount: (result?.labelAnnotations || []).length || 0,
      stabilityLabel,
      stabilityScore,
    });

    // Analyze plant health (use first frame's result for analysis)
    let plantHealth = null;
    try {
      plantHealth = analyzePlantHealth(result);
      console.log('[Plant Health] Stage:', plantHealth.growthStage.stage, 'Health:', plantHealth.healthStatus.status);
    } catch (healthErr) {
      console.warn('[Plant Health] Error analyzing plant health:', healthErr);
      plantHealth = { growthStage: { stage: 'unknown' }, healthStatus: { status: 'unknown' } };
    }

    // Extract matches from aggregated result (already matched above)
    let visualMatches = null;
    let matchedStrainSlug = null;
    const matches = matchResult?.matches || [];
    const labelInsights = matchResult?.labelInsights || null;
    const topMatch = matches[0] || null;
    const otherMatches = matches.slice(1, 5) || [];
    
    // CRITICAL: Extract visual matches array EARLY (before packaging insights block)
    // This prevents "Cannot access 'visualMatchesArray' before initialization" error
    // SINGLE DECLARATION: This is the ONLY place visualMatchesArray is declared
    const visualMatchesArray = Array.isArray(matches) && matches.length > 0
      ? matches.map(m => {
          const matchName = m.strain?.name || m.strain?.strain_name || m.strain?.slug || m.name || null;
          const matchConf = typeof m.confidence === 'number' 
            ? (m.confidence <= 1 ? m.confidence : m.confidence / 100) // Normalize to 0-1
            : null;
          return {
            name: matchName,
            confidence: matchConf,
          };
        }).filter(m => m.name)
      : [];
    
    // Debug log labelInsights.strainName if present
    if (labelInsights?.strainName) {
      console.log(`[process] Label strain name detected: "${labelInsights.strainName}"`);
    }
    
    if (topMatch) {
      visualMatches = {
        match: serializeMatch(topMatch),
        candidates: otherMatches.map(serializeMatch).filter(Boolean),
        labelInsights
      };
      matchedStrainSlug = visualMatches.match?.strain_slug || null;
      console.log(`[process] Visual matching found ${matches.length} matches, top: ${visualMatches.match?.name || 'unknown'}`);
    } else {
      console.log('[process] Visual matching found no matches above threshold');
      visualMatches = {
        match: null,
        candidates: [],
        labelInsights
      };
    }

    // Extract match data
    const {
      matchedStrainSlug: visualSlugFinal,
      matchedStrainName: visualNameFinal,
      matchConfidence: visualConfidence,
      matchQuality: visualQuality,
    } = matchResult || {};

    // Temporary values (will be replaced by canonical strain after packaging insights)
    let finalStrainName = visualNameFinal || null;
    let finalStrainSlug = visualSlugFinal || null;
    let finalMatchQuality = visualQuality || 'none';
    let finalMatchConfidence = visualConfidence || 0;

    // Generate AI summary if we have label insights (for packaged products)
    let aiSummary = null;
    if (labelInsights && labelInsights.isPackagedProduct) {
      try {
        console.time(`[scan-process-label-ai] ${id}`);
        const detectedText = result.textAnnotations?.[0]?.description || '';
        const rawText = labelInsights.rawText || detectedText;
        
        // Extract DB match info for AI
        const dbTopMatchName = topMatch?.strain?.name || topMatch?.name || null;
        let dbTopMatchConfidence = null;
        if (typeof topMatch?.confidence === 'number') {
          // Convert 0-1 scale to 0-100 if needed, otherwise use as-is
          dbTopMatchConfidence = topMatch.confidence <= 1 
            ? Math.round(topMatch.confidence * 100)
            : Math.round(topMatch.confidence);
        }
        const detectedCategory = labelInsights.category || labelInsights.productType || null;
        
        aiSummary = await generateLabelAISummary({
          rawText,
          dbTopMatchName,
          dbTopMatchConfidence,
          detectedCategory,
          extraHints: null
        });
        console.timeEnd(`[scan-process-label-ai] ${id}`);
        
        if (aiSummary) {
          console.log('[process] AI summary generated successfully');
          
          // Transform AI summary to match frontend expectations
          // Frontend expects: { title, summary/overview, ... }
          // AI returns: { product_name, label_explanation, ... }
          const transformedAiSummary = {
            title: aiSummary.product_name || null,
            summary: aiSummary.label_explanation || null,
            overview: aiSummary.label_explanation || null, // Alias for compatibility
            potencyAnalysis: null, // Not provided by current AI, can be added later
            terpeneAnalysis: null, // Not provided by current AI, can be added later
            usageNotes: null, // Not provided by current AI, can be added later
            warnings: Array.isArray(aiSummary.warnings) ? aiSummary.warnings : (typeof aiSummary.warnings === 'string' ? [aiSummary.warnings] : []),
            brandStory: null, // Not provided by current AI, can be added later
            jurisdictionNotes: aiSummary.jurisdiction_or_license || null,
            dbConsistency: null, // Not provided by current AI, can be added later
            // Include original fields for backward compatibility
            brand: aiSummary.brand || null,
            productType: aiSummary.product_type || null,
            ...aiSummary
          };
          
          aiSummary = transformedAiSummary;
        }
      } catch (aiErr) {
        console.error('[AI] Failed to generate label summary:', aiErr);
        // Don't fail the scan - just continue without AI summary
      }
    }

    // Attach AI summary to labelInsights
    if (labelInsights) {
      labelInsights.aiSummary = aiSummary || null;
    }

    // Update visualMatches with updated labelInsights
    if (visualMatches) {
      visualMatches.labelInsights = labelInsights;
    }

    // Generate GPT-5 nano packaging insights AFTER Vision processing
    let packagingInsights = null;
    try {
      console.time(`[scan-process-packaging] ${id}`);
      // Sample strain library for GPT context
      let strainLibrarySample = [];
      try {
        const { data: strainRows, error: strainErr } = await readClient
          .from('strains')
          .select('name,slug,type')
          .limit(200);

        if (!strainErr && Array.isArray(strainRows)) {
          strainLibrarySample = strainRows.map(r => ({
            name: r.name,
            slug: r.slug,
            type: r.type,
          }));
        }
      } catch (e) {
        console.warn('[packagingInsights] Could not load strain library sample:', e.message);
      }

      packagingInsights = await buildPackagingInsightsFromVision({
        visionResult: result,
        strainLibrarySample,
        countryHint: null,
        regionHint: null,
      });
      console.timeEnd(`[scan-process-packaging] ${id}`);

      console.log('[scan-process] packagingInsights computed', {
        id,
        hasInsights: !!packagingInsights,
        strainName: packagingInsights?.strainName || packagingInsights?.basic?.strain_name || null,
        overallConfidence: packagingInsights?.confidence?.overall ?? packagingInsights?.overallConfidence ?? null,
      });
      
      // CRITICAL: Re-determine canonical strain AFTER packaging insights are available
      // This ensures packaging strain takes priority over visual guesses
      if (packagingInsights) {
        const isPackagedProductFlag = 
          !!(packagingInsights?.isPackagedProduct ||
             labelInsights?.isPackagedProduct);
        
        const updatedCanonicalStrain = resolveCanonicalStrain({
          labelInsights: labelInsights || null,
          packagingInsights: packagingInsights,
          visualMatches: visualMatchesArray,
          aiSummary: null, // Not available yet at this point
          isPackagedProduct: isPackagedProductFlag,
        });
        
        // If packaging insights provide a strain name, use it as canonical
        if (updatedCanonicalStrain.source === 'packaging' && updatedCanonicalStrain.name) {
          finalStrainName = updatedCanonicalStrain.name;
          finalStrainSlug = updatedCanonicalStrain.name
            .toString()
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
          finalMatchQuality = 'packaging';
          finalMatchConfidence = updatedCanonicalStrain.confidence ?? 1.0;
          
          console.log('[process] Updated to packaging strain after packagingInsights:', {
            strainName: finalStrainName,
            source: updatedCanonicalStrain.source,
            confidence: finalMatchConfidence,
          });
        }
      }
    } catch (packagingErr) {
      console.error('[packagingInsights] Error generating packaging insights:', packagingErr);
      // Don't fail the scan - continue without packaging insights
    }

    // Generate rich AI summary for dispensaries and growers
    let scanAISummary = null;
    try {
      console.time(`[scan-process-summary] ${id}`);
      // Extract Vision data (fallback if not available from other sources)
      const visionText = result.textAnnotations?.[0]?.description || result.fullTextAnnotation?.text || '';
      const visionLabels = result.labelAnnotations || [];
      
      // Extract matched strain record
      const matchedStrainRecord = topMatch?.strain || null;

      // Generate canonical strain first (needed for AI summary)
      const isPackagedProductFlag = 
        !!(packagingInsights?.isPackagedProduct ||
           labelInsights?.isPackagedProduct);
      
      const canonicalForAI = resolveCanonicalStrain({
        packagingInsights: packagingInsights || null,
        labelInsights: labelInsights || null,
        visualMatches: visualMatchesArray,
        aiSummary: null, // Not available yet
        isPackagedProduct: isPackagedProductFlag,
      });

      scanAISummary = await generateScanAISummary({
        packagingInsights: packagingInsights || null,
        labelInsights: labelInsights || null,
        visualMatches: visualMatchesArray,
        plantHealth: plantHealth || null,
        canonical: canonicalForAI,
        visionText,
        visionLabels,
        strainRecord: matchedStrainRecord
      });
      console.timeEnd(`[scan-process-summary] ${id}`);

      if (scanAISummary) {
        console.log('[scan-process] AI summary generated successfully', {
          id,
          hasSummary: !!scanAISummary.summary,
          intensity: scanAISummary.intensity,
          effectsCount: scanAISummary.effects?.length || 0,
          flavorsCount: scanAISummary.flavors?.length || 0,
          dispensaryNotesCount: scanAISummary.dispensaryNotes?.length || 0,
          growerNotesCount: scanAISummary.growerNotes?.length || 0,
          warningsCount: scanAISummary.warnings?.length || 0,
        });
      }
    } catch (aiSummaryErr) {
      console.error('[AI Summary] Error generating scan AI summary:', aiSummaryErr);
      // Don't fail the scan - continue without AI summary
      scanAISummary = null;
    }

    // Build comprehensive scan summary (rich structured data) with multi-angle support
    let scanSummary = null;
    try {
      scanSummary = buildScanAISummary({
        visionResult: result,
        matches: matchResult,
        stabilityScore,
        stabilityLabel,
        numberOfFrames: totalFrames,
      });

      if (scanSummary && scanSummary.hasSummary) {
        console.log('[scan-process] AI summary generated successfully', {
          id,
          hasSummary: true,
          isPackagedProduct: scanSummary.isPackagedProduct,
          matchConfidence: scanSummary.matchConfidence,
          matchedStrainName: scanSummary.matchedStrainName,
        });
      } else {
        console.log('[scan-process] AI summary step completed without summary', {
          id,
          hasSummary: false,
          error: scanSummary?.error || 'Unknown error',
        });
      }
    } catch (summaryErr) {
      console.error('[Scan Summary] Error building scan summary:', summaryErr);
      // Don't fail the scan - continue without summary
      scanSummary = { hasSummary: false, error: 'AI summary failed to generate' };
    }

    // ---------------------------------------------
    // CANONICAL STRAIN: Packaging > Label > Visual
    // ---------------------------------------------
    // Determine isPackagedProduct flag
    const isPackagedProductFlag = 
      !!(packagingInsights?.isPackagedProduct ||
         labelInsights?.isPackagedProduct ||
         scanSummary?.isPackagedProduct);
    
    // visualMatchesArray is declared earlier (line ~1543) before packaging insights block
    // Reuse it here for canonical strain resolution - DO NOT redeclare
    
    const canonical = resolveCanonicalStrain({
      packagingInsights: packagingInsights || null,
      labelInsights: labelInsights || null,
      visualMatches: visualMatchesArray,
      aiSummary: scanSummary || null,
      isPackagedProduct: isPackagedProductFlag,
    });
    
    console.log('[canonical-strain]', {
      id,
      canonical: canonical,
      packaging: packagingInsights?.strainName || packagingInsights?.basic?.strain_name || null,
      label: labelInsights?.strainName || null,
      visual: visualMatchesArray[0] || null,
    });
    
    // ---------------------------------------------
    // SEED BANK LOOKUP: Fetch genetics data for confident canonical strains
    // ---------------------------------------------
    let seedBank = null;
    let growProfile = null;
    
    const isPackaged = Boolean(isPackagedProductFlag);
    const hasCanonical =
      canonical &&
      canonical.name &&
      typeof canonical.name === 'string' &&
      canonical.name !== 'Cannabis (strain unknown)' &&
      canonical.confidence != null &&
      canonical.confidence >= 0.8;
    
    if (hasCanonical) {
      // Fetch seed bank data
      try {
        seedBank = await findSeedBankEntry({ canonicalName: canonical.name });
        if (seedBank) {
          console.log('[seed-bank] attached', {
            id,
            canonicalName: canonical.name,
            breeder: seedBank.breeder,
            type: seedBank.type,
          });
        }
      } catch (err) {
        console.error('[seed-bank] lookup error', {
          id,
          canonicalName: canonical.name,
          message: err?.message || String(err),
        });
      }

      // Generate grow profile
      try {
        growProfile = await buildGrowProfile(canonical);
        if (growProfile && growProfile.strain !== 'unknown') {
          console.log('[grow-profile] generated', {
            id,
            canonicalName: canonical.name,
            vigor: growProfile.vigor,
            harvestWeeks: growProfile.harvest?.estWeeks,
          });
        }
      } catch (err) {
        console.error('[grow-profile] generation error', {
          id,
          canonicalName: canonical.name,
          message: err?.message || String(err),
        });
      }
    }
    
    // Merge Vision result with visual matches and packaging insights
    const finalResult = {
      vision_raw: result,
      packagingInsights: packagingInsights || null,
      visualMatches,
      labelInsights,
      matched_strain_slug: finalStrainSlug,
      matched_strain_name: canonical.name !== 'Cannabis (strain unknown)' ? canonical.name : finalStrainName,
      match_confidence: canonical.confidence ?? finalMatchConfidence,
      match_quality: canonical.source || finalMatchQuality,
      // Attach canonical strain to the final result object
      canonicalStrain: {
        name: canonical.name,
        source: canonical.source,
        confidence: canonical.confidence,
      },
      // Attach seed bank data if found
      seedBank: seedBank || null,
      // Attach grow profile if generated
      growProfile: growProfile || null,
    };

    // Get pro role from request (if provided via header)
    const proRole = getProRoleFromRequest(req);

    // Build update payload with AI summary if available
    const updatePayload = {
      result: finalResult,
      status: 'completed', // Standardized status: pending | processing | completed | failed
      processed_at: new Date().toISOString(),
      matched_strain_slug: finalStrainSlug,
      matched_strain_name: finalStrainName,
      match_confidence: finalMatchConfidence,
      match_quality: finalMatchQuality,
      // Save canonical strain to dedicated columns for analytics and frontend queries
      canonical_strain_name: canonical.name || null,
      canonical_strain_source: canonical.source || null,
      canonical_match_confidence: canonical.confidence ?? null,
      // Tag scan with pro role if provided
      pro_role: proRole || null,
      error: null, // Explicitly clear any error on success
    };

    // Add AI summary to database if available
    if (scanAISummary) {
      updatePayload.ai_summary = scanAISummary;
    }

    // CRITICAL: Use safe write to handle missing columns gracefully
    const updateResult = await safeUpdateScan(writeClient, id, updatePayload, 'scan-process');
    if (!updateResult.success && updateResult.error && !isSchemaError(updateResult.error)) {
      // Only return 500 for non-schema errors
      return res.status(500).json({ error: updateResult.error.message });
    }
    
    // Log skipped fields if any
    if (updateResult.skippedFields && updateResult.skippedFields.length > 0) {
      console.warn('[scan-process] Some fields skipped due to missing columns', {
        id,
        skippedFields: updateResult.skippedFields,
      });
    }

    // Safety logging for scan completion
    console.log('[scan-process] done', {
      id,
      status: 'completed',
      hasResult: !!finalResult,
      hasVision: !!finalResult.vision_raw,
      hasPackagingInsights: !!finalResult.packagingInsights,
      hasAISummary: !!scanAISummary,
      error: null,
    });
    console.timeEnd(`[scan-process-total] ${id}`);

    // Extract vision text and matched strain for response
    const visionText = result.textAnnotations?.[0]?.description || result.fullTextAnnotation?.text || null;
    const matchedStrain = topMatch?.strain || null;

    // Return debug info and plant health analysis in response
    res.json({
      ok: true,
      result: finalResult,
      aiSummary: scanAISummary || null,
      summary: scanSummary || null, // Rich structured summary for frontend
      match: matchedStrain || null,
      visionText: visionText || null,
      plantHealth,
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
    console.timeEnd(`[scan-process-total] ${id}`);
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
    // CRITICAL: Check if error is schema-related
    const isSchema = isSchemaError(e);
    
    if (isSchema) {
      // Schema error - return 200 with warning instead of 500
      console.warn('[scan-process] Schema error detected, returning 200 with warning', {
        id,
        error: String(e),
        message: e?.message || 'Unknown schema error',
      });
      
      // Try to refund credits if consumed
      if (creditConsumed) {
        try {
          const { data: scan } = await (supabaseAdmin ?? supabase)
            .from('scans')
            .select('user_id')
            .eq('id', req.params.id)
            .maybeSingle();
          if (scan?.user_id) {
            await grantScanCredits(scan.user_id, 1, 'scan-refund', { scan_id: req.params.id, reason: 'schema-error' });
          }
        } catch (refundErr) {
          console.error('[scan] Failed to refund credits after schema error:', refundErr);
        }
      }
      
      // Return 200 - scan can still proceed, just some fields won't be saved
      return res.json({
        ok: true,
        scanId: id,
        status: 'processing',
        warning: 'Column missing, some fields skipped',
      });
    }
    
    // CRITICAL: Use safe write for error status update
    try {
      const updateResult = await safeUpdateScan(
        writeClient,
        req.params.id,
        { 
          status: 'failed', 
          result: null,
          error: { code: 'PROCESSING_ERROR', message: String(e) }
        },
        'scan-process-error'
      );
      
      if (updateResult.success) {
        console.log('[scan-process] marked as failed', {
          id: req.params.id,
          status: 'failed',
          skippedFields: updateResult.skippedFields || [],
        });
      } else if (updateResult.error && !isSchemaError(updateResult.error)) {
        console.error('[scan-process] Failed to update scan status to failed:', updateResult.error);
      }
    } catch (updateErr) {
      if (!isSchemaError(updateErr)) {
        console.error('[scan-process] Failed to update scan status to failed:', updateErr);
      }
    }
    
    // CRITICAL: Log full error details before returning 500
    console.error('[scan-process] ERROR - 500 response', {
      id,
      error: String(e),
      message: e?.message || 'Unknown error',
      stack: e?.stack || null,
      name: e?.name || null,
    });
    
    // Return structured error response
    return res.status(500).json({ 
      ok: false,
      error: {
        code: 'SCAN_START_FAILED',
        message: 'Failed to start scan pipeline',
        details: String(e),
      }
    });
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

app.post('/api/scans/:id/match', async (req, res) => {
  const readClient = supabaseAdmin ?? supabase;
  const writeClient = supabaseAdmin ?? supabase;
  try {
    const { id } = req.params;
    const { data: scan, error } = await readClient
      .from('scans')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) return res.status(500).json({ error: error.message });
    if (!scan) return res.status(404).json({ error: 'Scan not found' });
    if (!scan.result) {
      return res.status(400).json({ error: 'Scan has no Vision result yet. Run /api/scans/:id/process first.' });
    }

    const strains = await loadStrainLibrary();
    const matchResult = matchStrainByVisuals(scan.result, strains);
    const matches = matchResult?.matches || [];
    const labelInsights = matchResult?.labelInsights || null;
    const topMatch = matches[0] || null;
    const payload = {
      match: serializeMatch(topMatch),
      candidates: matches.slice(1, 5).map(serializeMatch).filter(Boolean),
      labelInsights // Include label insights in response
    };

    const updatedResult = {
      ...scan.result,
      visualMatches: payload,
      labelInsights
    };

    await writeClient
      .from('scans')
      .update({
        result: updatedResult,
        status: 'completed', // Standardized status
        matched_strain_slug: payload.match?.strain_slug || scan.matched_strain_slug || null,
        processed_at: scan.processed_at || new Date().toISOString(),
        error: null, // Explicitly clear any error on success
      })
      .eq('id', id);

    res.json({
      ok: true,
      scan_id: id,
      ...payload
    });
  } catch (e) {
    logError(e, req);
    res.status(500).json({ error: 'Failed to run visual match. Please try again.' });
  }
});

// POST /api/visual-match - Match strain by Vision API results + AI summary
// Supports both single-frame and multi-frame (multi-angle) scanning
app.post('/api/visual-match', writeLimiter, async (req, res, next) => {
  try {
    const { visionResult, frames } = req.body;
    
    // Support both single-frame (backward compat) and multi-frame
    let frameResults = [];
    let numberOfFrames = 1;
    let stabilityScore = 1.0;
    let stabilityLabel = 'single-frame';
    let aggregatedMatchResult = null;
    let combinedVisionResult = null;

    if (frames && Array.isArray(frames) && frames.length > 0) {
      // Multi-frame mode
      numberOfFrames = frames.length;
      console.log(`[VisualMatch] Multi-frame mode: ${numberOfFrames} frames`);

      let strains = [];
      try {
        strains = await loadStrainLibrary();
      } catch (e) {
        console.error('[VisualMatch] Could not load strain library:', e);
        return res.status(500).json({ error: 'Strain library unavailable', details: e.message });
      }

      // Process each frame
      const frameMatchResults = [];
      const frameVisionResults = [];

      for (let i = 0; i < frames.length; i++) {
        const frame = frames[i];
        const frameVisionResult = frame.visionResult || frame;
        
        if (!frameVisionResult) {
          console.warn(`[VisualMatch] Frame ${i + 1} missing visionResult, skipping`);
          continue;
        }

        frameVisionResults.push(frameVisionResult);
        const frameMatchResult = matchStrainByVisuals(frameVisionResult, strains);
        frameMatchResults.push(frameMatchResult);
      }

      if (frameMatchResults.length === 0) {
        return res.status(400).json({ error: 'No valid frames provided' });
      }

      // Aggregate matches across frames
      aggregatedMatchResult = aggregateMultiFrameMatches(frameMatchResults);
      
      // Combine vision results (use first frame's text/labels, merge label annotations)
      combinedVisionResult = combineVisionResults(frameVisionResults);
      
      // Calculate stability
      const stability = calculateStability(frameMatchResults, aggregatedMatchResult);
      stabilityScore = stability.score;
      stabilityLabel = stability.label;

      console.log(`[VisualMatch] Multi-frame: ${frameMatchResults.length} frames processed, stability: ${stabilityLabel} (${(stabilityScore * 100).toFixed(0)}%)`);
    } else if (visionResult) {
      // Single-frame mode (backward compatibility)
      let strains = [];
      try {
        strains = await loadStrainLibrary();
      } catch (e) {
        console.error('[VisualMatch] Could not load strain library:', e);
        return res.status(500).json({ error: 'Strain library unavailable', details: e.message });
      }

      aggregatedMatchResult = matchStrainByVisuals(visionResult, strains);
      combinedVisionResult = visionResult;
    } else {
      return res.status(400).json({ error: 'visionResult or frames array required' });
    }

    const matches = aggregatedMatchResult?.matches || [];
    const labelInsights = aggregatedMatchResult?.labelInsights || null;

    console.log(`[VisualMatch] Found ${matches.length} matches, top score: ${matches[0]?.score || 0}`);

    // Build AI summary with stability and scan type info
    let aiSummary = null;
    try {
      aiSummary = buildScanAISummary({ 
        visionResult: combinedVisionResult, 
        matches: aggregatedMatchResult,
        stabilityScore,
        stabilityLabel,
        numberOfFrames,
      });
      
      if (aiSummary && aiSummary.hasSummary) {
        console.log('[scan-process] AI summary generated successfully', {
          hasSummary: true,
          matchConfidence: aiSummary.matchConfidence,
          matchedStrainName: aiSummary.matchedStrainName,
        });
      } else {
        console.log('[scan-process] AI summary step completed without summary', {
          hasSummary: false,
          error: aiSummary?.error || 'Unknown error',
        });
      }
    } catch (summaryErr) {
      console.error('[Scan Summary] Error building scan summary:', summaryErr);
      // Don't fail the scan - continue without summary
      aiSummary = { hasSummary: false, error: 'AI summary failed to generate' };
    }

    res.json({
      success: true,
      matchCount: matches.length,
      aiSummary, // Include AI summary in response
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
      })),
      labelInsights,
      stability: {
        score: stabilityScore,
        label: stabilityLabel,
        numberOfFrames
      }
    });
  } catch (e) {
    console.error('[VisualMatch] Error:', e);
    res.status(500).json({ error: String(e) });
  }
});

/**
 * Aggregate matches across multiple frames
 */
function aggregateMultiFrameMatches(frameMatchResults) {
  if (frameMatchResults.length === 0) return null;
  if (frameMatchResults.length === 1) return frameMatchResults[0];

  // Map to track aggregated confidence per strain
  const strainMap = new Map();

  // Process each frame's matches
  for (const frameResult of frameMatchResults) {
    const frameMatches = frameResult?.matches || [];
    
    for (const match of frameMatches) {
      const strainId = match.strain?.slug || match.strain?.name || match.name || 'unknown';
      const confidence = normalizeMatchConfidence(match);
      
      if (confidence == null) continue;

      if (!strainMap.has(strainId)) {
        strainMap.set(strainId, {
          strain: match.strain,
          name: match.strain?.name || match.name,
          confidences: [],
          scores: [],
          reasoning: match.reasoning || '',
        });
      }

      const entry = strainMap.get(strainId);
      entry.confidences.push(confidence);
      if (typeof match.score === 'number') {
        entry.scores.push(match.score);
      }
    }
  }

  // Calculate average confidence per strain
  const aggregatedMatches = Array.from(strainMap.values()).map(entry => {
    const avgConfidence = entry.confidences.length > 0
      ? entry.confidences.reduce((a, b) => a + b, 0) / entry.confidences.length
      : 0;
    
    const avgScore = entry.scores.length > 0
      ? entry.scores.reduce((a, b) => a + b, 0) / entry.scores.length
      : 0;

    return {
      strain: entry.strain,
      name: entry.name,
      confidence: avgConfidence,
      score: avgScore,
      reasoning: entry.reasoning || `Aggregated from ${entry.confidences.length} frames`,
    };
  });

  // Sort by confidence descending
  aggregatedMatches.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));

  // Return in the same format as single-frame match result
  return {
    matches: aggregatedMatches,
    labelInsights: frameMatchResults[0]?.labelInsights || null,
  };
}

/**
 * Calculate stability score and label from multi-frame results
 */
function calculateStability(frameMatchResults, aggregatedResult) {
  if (frameMatchResults.length <= 1) {
    return { score: 1.0, label: 'single-frame' };
  }

  const topStrain = aggregatedResult?.matches?.[0];
  if (!topStrain) {
    return { score: 0, label: 'low' };
  }

  const topStrainId = topStrain.strain?.slug || topStrain.strain?.name || topStrain.name;
  
  // Count how many frames have this strain as their top match
  let matchingFrames = 0;
  
  for (const frameResult of frameMatchResults) {
    const frameTop = frameResult?.matches?.[0];
    if (frameTop) {
      const frameTopId = frameTop.strain?.slug || frameTop.strain?.name || frameTop.name;
      if (frameTopId === topStrainId) {
        matchingFrames++;
      }
    }
  }

  const stabilityScore = matchingFrames / frameMatchResults.length;
  
  let stabilityLabel;
  if (stabilityScore >= 0.8) {
    stabilityLabel = 'high';
  } else if (stabilityScore >= 0.5) {
    stabilityLabel = 'medium';
  } else {
    stabilityLabel = 'low';
  }

  return { score: stabilityScore, label: stabilityLabel };
}

/**
 * Combine multiple vision results into one
 */
function combineVisionResults(visionResults) {
  if (visionResults.length === 0) return null;
  if (visionResults.length === 1) return visionResults[0];

  // Use first frame's text annotations (most complete)
  const combined = { ...visionResults[0] };

  // Merge label annotations from all frames (deduplicate)
  const labelMap = new Map();
  for (const result of visionResults) {
    const labels = result.labelAnnotations || [];
    for (const label of labels) {
      const key = label.description?.toLowerCase() || '';
      if (key && !labelMap.has(key)) {
        labelMap.set(key, label);
      }
    }
  }

  combined.labelAnnotations = Array.from(labelMap.values());

  return combined;
}

// normalizeMatchConfidence moved to backend/services/matchUtils.js - import if needed

// --- Mount Route Modules ---
// Apply general rate limiting to all /api routes
app.use('/api', apiLimiter);

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
app.use('/api/admin/errors', adminErrorsRoutes);
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
app.use('/api/credits', creditsRoutes);
app.use('/api/direct-messages', directMessagesRoutes);
app.use('/api/direct-chats', directMessagesRoutes);

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
// GET /api/analytics/summary - Analytics dashboard data
app.get('/api/analytics/summary', async (req, res) => {
  const readClient = supabaseAdmin ?? supabase;
  try {
    // Limit to recent scans to avoid huge payloads (e.g., last 30 days or last 5000 rows)
    const { data: scans, error } = await readClient
      .from('scans')
      .select('id, created_at, result')
      .order('created_at', { ascending: false })
      .limit(5000);

    if (error) {
      console.error('[analytics] supabase error', error);
      return res.status(500).json({ error: error.message });
    }

    const byStrain = new Map();
    const byBrand = new Map();
    const potencyBuckets = {
      '0-10': 0,
      '10-20': 0,
      '20-25': 0,
      '25-30': 0,
      '30+': 0,
      'unknown': 0,
    };

    const recentScans = [];

    for (const scan of scans || []) {
      const result = scan.result || {};
      const packaging = result.packagingInsights || null;
      const basic = packaging?.basic || {};
      const potency = packaging?.potency || {};
      const thc = typeof potency?.thc_percent === 'number' ? potency.thc_percent : null;

      // Recent list entry
      recentScans.push({
        id: scan.id,
        created_at: scan.created_at,
        strain_name: basic.strain_name || null,
        brand_name: basic.brand_name || null,
        product_type: basic.product_type || null,
        thc_percent: thc,
      });

      // Top strains
      if (basic.strain_name) {
        const key = basic.strain_name;
        byStrain.set(key, (byStrain.get(key) || 0) + 1);
      }

      // Top brands
      if (basic.brand_name) {
        const key = basic.brand_name;
        byBrand.set(key, (byBrand.get(key) || 0) + 1);
      }

      // THC buckets
      if (thc == null) {
        potencyBuckets.unknown++;
      } else if (thc < 10) {
        potencyBuckets['0-10']++;
      } else if (thc < 20) {
        potencyBuckets['10-20']++;
      } else if (thc < 25) {
        potencyBuckets['20-25']++;
      } else if (thc < 30) {
        potencyBuckets['25-30']++;
      } else {
        potencyBuckets['30+']++;
      }
    }

    const topStrains = Array.from(byStrain.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([name, count]) => ({ name, count }));

    const topBrands = Array.from(byBrand.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([name, count]) => ({ name, count }));

    res.json({
      topStrains,
      topBrands,
      potencyBuckets,
      recentScans,
      totalScans: scans?.length || 0,
    });
  } catch (e) {
    console.error('[analytics] unexpected error', e);
    res.status(500).json({ error: String(e) });
  }
});

// POST /api/scans/:id/corrections - Store user corrections
app.post('/api/scans/:id/corrections', express.json(), async (req, res) => {
  const writeClient = supabaseAdmin ?? supabase;
  const scanId = req.params.id;
  const correction = req.body?.correction;

  if (!correction || typeof correction !== 'object') {
    return res.status(400).json({ error: 'Missing or invalid correction object' });
  }

  try {
    const { data: scan, error: fetchErr } = await writeClient
      .from('scans')
      .select('id, result')
      .eq('id', scanId)
      .maybeSingle();

    if (fetchErr) {
      console.error('[corrections] fetch error', fetchErr);
      return res.status(500).json({ error: fetchErr.message });
    }
    if (!scan) {
      return res.status(404).json({ error: 'Scan not found' });
    }

    const existingResult = scan.result || {};
    const existingCorrections = Array.isArray(existingResult.corrections)
      ? existingResult.corrections
      : [];

    const stamped = {
      ...correction,
      _created_at: new Date().toISOString(),
    };

    const newResult = {
      ...existingResult,
      corrections: [...existingCorrections, stamped],
    };

    const { error: upErr } = await writeClient
      .from('scans')
      .update({ result: newResult })
      .eq('id', scanId);

    if (upErr) {
      console.error('[corrections] update error', upErr);
      return res.status(500).json({ error: upErr.message });
    }

    console.log('[corrections] stored', { scanId, keys: Object.keys(correction) });
    res.json({ ok: true });
  } catch (e) {
    console.error('[corrections] unexpected error', e);
    res.status(500).json({ error: String(e) });
  }
});

// GET /api/barcode/lookup - Find scans by barcode
app.get('/api/barcode/lookup', async (req, res) => {
  const barcode = req.query?.code;
  if (!barcode || typeof barcode !== 'string') {
    return res.status(400).json({ error: 'Missing barcode "code" query parameter' });
  }

  const readClient = supabaseAdmin ?? supabase;
  try {
    const { data: scans, error } = await readClient
      .from('scans')
      .select('id, created_at, result')
      .order('created_at', { ascending: false })
      .limit(2000);

    if (error) {
      console.error('[barcode] supabase error', error);
      return res.status(500).json({ error: error.message });
    }

    const matches = [];
    for (const scan of scans || []) {
      const result = scan.result || {};
      const packaging = result.packagingInsights || null;
      const details = packaging?.package_details || {};
      const code = details.unit_barcode;
      if (code && String(code).replace(/\s+/g, '') === barcode.replace(/\s+/g, '')) {
        matches.push({
          id: scan.id,
          created_at: scan.created_at,
          brand: packaging?.basic?.brand_name || null,
          strain: packaging?.basic?.strain_name || null,
          product_type: packaging?.basic?.product_type || null,
        });
      }
    }

    res.json({ matches });
  } catch (e) {
    console.error('[barcode] unexpected error', e);
    res.status(500).json({ error: String(e) });
  }
});

// ========================================
// BUSINESS PROFILES: Register and lookup
// ========================================

// Founder email whitelist
const FOUNDER_EMAIL = 'topher.cook7@gmail.com';

/**
 * Check if a user is a founder by their user ID
 */
async function isFounder(userId) {
  if (!userId) return false;
  
  try {
    const { data: { user }, error } = await supabaseAdmin.auth.admin.getUserById(userId);
    
    if (error || !user || !user.email) {
      return false;
    }
    
    return user.email.toLowerCase().trim() === FOUNDER_EMAIL.toLowerCase();
  } catch (e) {
    console.error('[isFounder] Error checking founder status', e);
    return false;
  }
}

// Helper: Get authenticated user from request
async function getUserFromRequest(req) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return null;
    }

    const token = authHeader.replace('Bearer ', '').trim();
    
    if (!token) {
      return null;
    }

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error || !user) {
      return null;
    }

    return user;
  } catch (e) {
    console.error('[getUserFromRequest] Error', e);
    return null;
  }
}

// Helper: build zip group key
function makeZipGroupKey(postalCode, country = 'US') {
  if (!postalCode) return null;
  const trimmedPostal = String(postalCode).trim();
  if (!trimmedPostal) return null;
  const normalizedCountry = (country || 'US').toUpperCase();
  return `${trimmedPostal}:${normalizedCountry}`;
}

// Helper: ensure there is a zip group and membership for a given business_profile row
async function ensureZipGroupForBusinessProfile(profile) {
  try {
    const { id, postal_code, city, state, country } = profile;
    const key = makeZipGroupKey(postal_code, country || 'US');
    if (!key) {
      console.warn('[business-groups] No postal code for profile, skipping group creation', { profileId: id });
      return null;
    }

    // 1) Find or create the group
    const groupName = `${postal_code} Local Cannabis Network`;
    const { data: existingGroups, error: groupFetchError } = await supabaseAdmin
      .from('business_groups')
      .select('*')
      .eq('type', 'zip')
      .eq('key', key)
      .limit(1);

    if (groupFetchError) {
      console.error('[business-groups] Error fetching group', { error: groupFetchError, profileId: id, key });
      throw groupFetchError;
    }

    let group = existingGroups && existingGroups[0];
    if (!group) {
      const { data: insertedGroups, error: insertError } = await supabaseAdmin
        .from('business_groups')
        .insert({
          type: 'zip',
          key,
          name: groupName,
          city: city || null,
          state: state || null,
          country: (country || 'US').toUpperCase(),
        })
        .select()
        .limit(1);

      if (insertError) {
        console.error('[business-groups] Error creating group', { error: insertError, profileId: id, key });
        throw insertError;
      }

      group = insertedGroups && insertedGroups[0];
      console.log('[business-groups] Created new zip group', { profileId: id, groupId: group.id, key });
    }

    if (!group) {
      console.warn('[business-groups] Could not resolve or create group', { profileId: id, key });
      return null;
    }

    // 2) Ensure membership
    const { error: membershipError } = await supabaseAdmin
      .from('business_group_memberships')
      .upsert(
        {
          business_profile_id: id,
          group_id: group.id,
          role: 'owner', // the auth user who owns this profile is effectively the "owner"
        },
        {
          onConflict: 'business_profile_id,group_id',
        }
      );

    if (membershipError) {
      console.error('[business-groups] Error upserting membership', { error: membershipError, profileId: id, groupId: group.id });
      throw membershipError;
    }

    console.log('[business-groups] Ensured membership', { profileId: id, groupId: group.id, key });
    return group;
  } catch (err) {
    console.error('[business-groups] ensureZipGroupForBusinessProfile error', {
      message: err?.message,
      name: err?.name,
      stack: err?.stack,
    });
    return null;
  }
}

// GET /api/business/me - Get current user's business profile
app.get('/api/business/me', async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { data, error } = await supabaseAdmin
      .from('business_profiles')
      .select('*')
      .eq('user_id', user.id)
      .limit(1);

    if (error) {
      console.error('[business] Error fetching profile', { error, userId: user.id });
      return res.status(500).json({ error: 'Error fetching business profile' });
    }

    const profile = data && data[0] ? data[0] : null;
    return res.json({ profile });
  } catch (err) {
    console.error('[business] /api/business/me error', {
      message: err?.message,
      name: err?.name,
      stack: err?.stack,
    });
    return res.status(500).json({ error: 'Unexpected error fetching business profile' });
  }
});

// POST /api/business/me - Create or update current user's business profile
app.post('/api/business/me', express.json(), async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const {
      business_type,
      name,
      city,
      state,
      country,
      postal_code,
      phone,
      website,
    } = req.body || {};

    if (!business_type || !['grower', 'dispensary'].includes(business_type)) {
      return res.status(400).json({ error: 'Invalid or missing business_type' });
    }

    // Fetch existing profile (if any)
    const { data: existingRows, error: fetchError } = await supabaseAdmin
      .from('business_profiles')
      .select('*')
      .eq('user_id', user.id)
      .limit(1);

    if (fetchError) {
      console.error('[business] Error fetching existing profile', { error: fetchError, userId: user.id });
      return res.status(500).json({ error: 'Error checking existing profile' });
    }

    const existing = existingRows && existingRows[0];

    let savedProfile = null;

    if (existing) {
      // UPDATE
      const { data: updatedRows, error: updateError } = await supabaseAdmin
        .from('business_profiles')
        .update({
          business_type,
          name: name ?? existing.name,
          city: city ?? existing.city,
          state: state ?? existing.state,
          country: country ?? existing.country,
          postal_code: postal_code ?? existing.postal_code,
          phone: phone ?? existing.phone,
          website: website ?? existing.website,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .limit(1);

      if (updateError) {
        console.error('[business] Error updating profile', { error: updateError, userId: user.id });
        return res.status(500).json({ error: 'Error updating business profile' });
      }

      savedProfile = updatedRows && updatedRows[0];
    } else {
      // INSERT
      // Generate business_code if not exists
      let code = null;
      let attempts = 0;
      let isUnique = false;
      while (!isUnique && attempts < 10) {
        code = generateBusinessCode();
        const { data: checkExisting } = await supabaseAdmin
          .from('business_profiles')
          .select('business_code')
          .eq('business_code', code)
          .maybeSingle();
        if (!checkExisting) {
          isUnique = true;
        }
        attempts++;
      }
      if (!isUnique) {
        return res.status(500).json({ error: 'Failed to generate unique business code' });
      }

      const { data: insertedRows, error: insertError } = await supabaseAdmin
        .from('business_profiles')
        .insert({
          user_id: user.id,
          business_type,
          business_code: code,
          name: name || null,
          city: city || null,
          state: state || null,
          country: country || 'US',
          postal_code: postal_code || null,
          phone: phone || null,
          website: website || null,
        })
        .select()
        .limit(1);

      if (insertError) {
        console.error('[business] Error creating profile', { error: insertError, userId: user.id });
        return res.status(500).json({ error: 'Error creating business profile' });
      }

      savedProfile = insertedRows && insertedRows[0];
    }

    // Ensure ZIP group + membership (best effort)
    if (savedProfile) {
      try {
        await ensureZipGroupForBusinessProfile(savedProfile);
      } catch (groupErr) {
        // Log but don't fail the request
        console.error('[business] Group creation failed (non-blocking)', {
          profileId: savedProfile.id,
          error: groupErr?.message || String(groupErr),
        });
      }
    }

    return res.json({ profile: savedProfile });
  } catch (err) {
    console.error('[business] /api/business/me POST error', {
      message: err?.message,
      name: err?.name,
      stack: err?.stack,
    });
    return res.status(500).json({ error: 'Unexpected error saving business profile' });
  }
});

// GET /api/business/groups/my-zip - Get current user's ZIP group + members
app.get('/api/business/groups/my-zip', async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // 1) Get user profile
    const { data: profileRows, error: profileError } = await supabaseAdmin
      .from('business_profiles')
      .select('*')
      .eq('user_id', user.id)
      .limit(1);

    if (profileError) {
      console.error('[business-groups] Error fetching profile for my-zip', { error: profileError, userId: user.id });
      return res.status(500).json({ error: 'Error fetching business profile' });
    }

    const profile = profileRows && profileRows[0];
    if (!profile) {
      return res.status(404).json({ error: 'No business profile found for this user' });
    }

    // 2) Find memberships for this profile
    const { data: memberships, error: membershipError } = await supabaseAdmin
      .from('business_group_memberships')
      .select('id, group_id, role')
      .eq('business_profile_id', profile.id);

    if (membershipError) {
      console.error('[business-groups] Error fetching memberships', { error: membershipError, profileId: profile.id });
      return res.status(500).json({ error: 'Error fetching group memberships' });
    }

    if (!memberships || memberships.length === 0) {
      return res.json({ group: null, members: [] });
    }

    const groupIds = memberships.map(m => m.group_id);

    // 3) Fetch groups
    const { data: groups, error: groupError } = await supabaseAdmin
      .from('business_groups')
      .select('*')
      .in('id', groupIds);

    if (groupError) {
      console.error('[business-groups] Error fetching groups', { error: groupError, groupIds });
      return res.status(500).json({ error: 'Error fetching groups' });
    }

    if (!groups || groups.length === 0) {
      return res.json({ group: null, members: [] });
    }

    // 4) Pick first zip group
    const zipGroups = groups.filter(g => g.type === 'zip');
    const group = zipGroups[0] || groups[0];

    if (!group) {
      return res.json({ group: null, members: [] });
    }

    // 5) Fetch all memberships for this group
    const { data: groupMemberships, error: groupMembersError } = await supabaseAdmin
      .from('business_group_memberships')
      .select('id, business_profile_id, role')
      .eq('group_id', group.id);

    if (groupMembersError) {
      console.error('[business-groups] Error fetching group memberships', { error: groupMembersError, groupId: group.id });
      return res.status(500).json({ error: 'Error fetching group members' });
    }

    if (!groupMemberships || groupMemberships.length === 0) {
      return res.json({ group, members: [] });
    }

    const memberProfileIds = groupMemberships.map(m => m.business_profile_id);

    // 6) Fetch profiles for members
    const { data: memberProfiles, error: memberProfilesError } = await supabaseAdmin
      .from('business_profiles')
      .select('*')
      .in('id', memberProfileIds);

    if (memberProfilesError) {
      console.error('[business-groups] Error fetching member profiles', { error: memberProfilesError, groupId: group.id });
      return res.status(500).json({ error: 'Error fetching member profiles' });
    }

    const profileById = new Map();
    (memberProfiles || []).forEach(p => {
      profileById.set(p.id, p);
    });

    const members = groupMemberships.map(m => ({
      role: m.role,
      profile: profileById.get(m.business_profile_id) || null,
    }));

    return res.json({ group, members });
  } catch (err) {
    console.error('[business-groups] /api/business/groups/my-zip error', {
      message: err?.message,
      name: err?.name,
      stack: err?.stack,
    });
    return res.status(500).json({ error: 'Unexpected error fetching zip group' });
  }
});

// POST /api/business/register - Create or update grower/dispensary profile
app.post('/api/business/register', express.json(), async (req, res) => {
  try {
    const { user_id, name, business_type, city, state, country, phone, website, postal_code } = req.body || {};

    // 1. Validate business type
    if (!business_type || !['grower', 'dispensary'].includes(business_type)) {
      return res.status(400).json({ error: 'Invalid business_type. Must be "grower" or "dispensary".' });
    }

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    // 2. Check if a record already exists
    const { data: existing, error: existingError } = await supabaseAdmin
      .from('business_profiles')
      .select('*')
      .eq('user_id', user_id)
      .maybeSingle();

    if (existingError && existingError.code !== 'PGRST116') {
      console.error('[business/register] Error checking existing profile', existingError);
      return res.status(500).json({ error: 'Failed to check existing profile' });
    }

    // 3. Generate or keep business_code
    let code = existing?.business_code;
    if (!code) {
      // Generate new code and ensure uniqueness
      let attempts = 0;
      let isUnique = false;
      while (!isUnique && attempts < 10) {
        code = generateBusinessCode();
        const { data: checkExisting } = await supabaseAdmin
          .from('business_profiles')
          .select('business_code')
          .eq('business_code', code)
          .maybeSingle();
        if (!checkExisting) {
          isUnique = true;
        }
        attempts++;
      }
      if (!isUnique) {
        return res.status(500).json({ error: 'Failed to generate unique business code' });
      }
    }

    const payload = {
      user_id,
      name: name || null,
      business_type,
      business_code: code,
      city: city || null,
      state: state || null,
      country: country || null,
      postal_code: postal_code || null,
      phone: phone || null,
      website: website || null,
      updated_at: new Date().toISOString(),
    };

    let result;
    if (existing) {
      // Update existing profile
      const { data, error } = await supabaseAdmin
        .from('business_profiles')
        .update(payload)
        .eq('user_id', user_id)
        .select()
        .single();

      if (error) {
        console.error('[business/register] Update error', error);
        return res.status(500).json({ error: 'Failed to update business profile' });
      }
      result = data;
    } else {
      // Insert new profile
      const { data, error } = await supabaseAdmin
        .from('business_profiles')
        .insert(payload)
        .select()
        .single();

      if (error) {
        console.error('[business/register] Insert error', error);
        return res.status(500).json({ error: 'Failed to create business profile' });
      }
      result = data;
    }

    // Ensure ZIP group membership (non-blocking)
    if (result && result.postal_code) {
      try {
        await ensureZipGroupForBusinessProfile(result);
      } catch (groupErr) {
        // Log but don't fail the request
        console.error('[business/register] Group creation failed (non-blocking)', {
          profileId: result.id,
          error: groupErr?.message || String(groupErr),
        });
      }
    }

    return res.json({
      success: true,
      profile: result,
      business_code: result.business_code,
    });
  } catch (err) {
    console.error('[business/register] Unexpected error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ========================================
// DIRECT MESSAGING SYSTEM
// ========================================

// Helper: Get or create thread between two users
async function getOrCreateThread(userA, userB) {
  // Ensure consistent ordering (smaller UUID first)
  const [a, b] = [userA, userB].sort();
  
  const { data: existing, error: fetchError } = await supabaseAdmin
    .from('direct_threads')
    .select('*')
    .or(`and(user_a.eq.${a},user_b.eq.${b}),and(user_a.eq.${b},user_b.eq.${a})`)
    .maybeSingle();

  if (fetchError && fetchError.code !== 'PGRST116') {
    throw fetchError;
  }

  if (existing) {
    return existing;
  }

  // Create new thread
  const { data: created, error: createError } = await supabaseAdmin
    .from('direct_threads')
    .insert({
      user_a: a,
      user_b: b,
    })
    .select()
    .single();

  if (createError) {
    throw createError;
  }

  return created;
}

// Helper: Check if user can message receiver
async function canUserMessage(senderId, receiverId) {
  // Check receiver's public message setting
  const { data: receiverProfile } = await supabaseAdmin
    .from('profiles')
    .select('allow_public_messages')
    .eq('user_id', receiverId)
    .maybeSingle();

  const { data: receiverBusiness } = await supabaseAdmin
    .from('business_profiles')
    .select('allow_public_messages')
    .eq('user_id', receiverId)
    .maybeSingle();

  const allowPublic = receiverProfile?.allow_public_messages ?? receiverBusiness?.allow_public_messages ?? true;

  if (allowPublic) {
    return { allowed: true, reason: null };
  }

  // If not public, check if they have an existing thread (accepted contact)
  const thread = await getOrCreateThread(senderId, receiverId).catch(() => null);
  if (thread) {
    // Check if thread has messages (indicates accepted contact)
    const { data: messages } = await supabaseAdmin
      .from('direct_messages')
      .select('id')
      .eq('thread_id', thread.id)
      .limit(1);

    if (messages && messages.length > 0) {
      return { allowed: true, reason: 'existing_thread' };
    }
  }

  return { allowed: false, reason: 'private_profile' };
}

// POST /api/direct-messages/send - Send a direct message
app.post('/api/direct-messages/send', express.json(), async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { receiver_id, message, image_url, image_width, image_height } = req.body || {};

    if (!receiver_id) {
      return res.status(400).json({ error: 'receiver_id is required' });
    }

    if (!message && !image_url) {
      return res.status(400).json({ error: 'message or image_url is required' });
    }

    // Check if user can message receiver
    const canMessage = await canUserMessage(user.id, receiver_id);
    if (!canMessage.allowed) {
      return res.status(403).json({ 
        error: 'Cannot send message',
        reason: canMessage.reason 
      });
    }

    // Get or create thread
    const thread = await getOrCreateThread(user.id, receiver_id);

    // Insert message (use existing schema: sender_id/receiver_id/content)
    const { data: newMessage, error: insertError } = await supabaseAdmin
      .from('direct_messages')
      .insert({
        sender_id: user.id,
        receiver_id: receiver_id,
        thread_id: thread.id,
        content: message || null,
        message: message || null, // Also set message field if it exists
        image_url: image_url || null,
        image_width: image_width || null,
        image_height: image_height || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[dm/send] Insert error', insertError);
      return res.status(500).json({ error: 'Failed to send message' });
    }

    // Update thread's last_message_at
    await supabaseAdmin
      .from('direct_threads')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', thread.id);

    return res.json({ message: newMessage, thread });
  } catch (err) {
    console.error('[dm/send] Error', err);
    return res.status(500).json({ error: 'Unexpected error sending message' });
  }
});

// GET /api/direct-messages/threads - List user's message threads
app.get('/api/direct-messages/threads', async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Get all threads where user is user_a or user_b
    const { data: threads, error } = await supabaseAdmin
      .from('direct_threads')
      .select('*')
      .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .limit(100);

    if (error) {
      console.error('[dm/threads] Error', error);
      return res.status(500).json({ error: 'Failed to fetch threads' });
    }

    // For each thread, get the other user's info and last message
    const enrichedThreads = await Promise.all(
      (threads || []).map(async (thread) => {
        const otherUserId = thread.user_a === user.id ? thread.user_b : thread.user_a;
        
        // Get other user's profile
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('username, avatar_url')
          .eq('user_id', otherUserId)
          .maybeSingle();

        const { data: businessProfile } = await supabaseAdmin
          .from('business_profiles')
          .select('name, business_type')
          .eq('user_id', otherUserId)
          .maybeSingle();

        // Get last message
        const { data: messages } = await supabaseAdmin
          .from('direct_messages')
          .select('id, content, message, image_url, created_at, read_at, receiver_id')
          .eq('thread_id', thread.id)
          .order('created_at', { ascending: false })
          .limit(1);

        const lastMessage = messages && messages[0] ? {
          ...messages[0],
          message: messages[0].message || messages[0].content || null,
        } : null;
        const unreadCount = lastMessage && !lastMessage.read_at && lastMessage.receiver_id === user.id ? 1 : 0;

        return {
          ...thread,
          other_user_id: otherUserId,
          other_user_name: businessProfile?.name || profile?.username || 'Unknown',
          other_user_avatar: profile?.avatar_url || null,
          other_user_type: businessProfile?.business_type || 'user',
          last_message: lastMessage,
          unread_count: unreadCount,
        };
      })
    );

    return res.json({ threads: enrichedThreads });
  } catch (err) {
    console.error('[dm/threads] Error', err);
    return res.status(500).json({ error: 'Unexpected error fetching threads' });
  }
});

// GET /api/direct-messages/thread/:threadId - Get messages in a thread
app.get('/api/direct-messages/thread/:threadId', async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { threadId } = req.params;

    // Verify user is part of this thread
    const { data: thread, error: threadError } = await supabaseAdmin
      .from('direct_threads')
      .select('*')
      .eq('id', threadId)
      .maybeSingle();

    if (threadError || !thread) {
      return res.status(404).json({ error: 'Thread not found' });
    }

    if (thread.user_a !== user.id && thread.user_b !== user.id) {
      return res.status(403).json({ error: 'Not authorized to view this thread' });
    }

    // Get messages
    const { data: messages, error: messagesError } = await supabaseAdmin
      .from('direct_messages')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true })
      .limit(200);

    if (messagesError) {
      console.error('[dm/thread] Error fetching messages', messagesError);
      return res.status(500).json({ error: 'Failed to fetch messages' });
    }

    // Normalize messages (map content to message field)
    const normalizedMessages = (messages || []).map(msg => ({
      ...msg,
      message: msg.message || msg.content || null,
    }));

    // Mark messages as read
    await supabaseAdmin
      .from('direct_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('thread_id', threadId)
      .eq('receiver_id', user.id)
      .is('read_at', null);

    return res.json({ thread, messages: messages || [] });
  } catch (err) {
    console.error('[dm/thread] Error', err);
    return res.status(500).json({ error: 'Unexpected error fetching thread' });
  }
});

// POST /api/direct-messages/mark-read - Mark messages as read
app.post('/api/direct-messages/mark-read', express.json(), async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { thread_id } = req.body || {};

    if (!thread_id) {
      return res.status(400).json({ error: 'thread_id is required' });
    }

    // Verify user is part of thread
    const { data: thread } = await supabaseAdmin
      .from('direct_threads')
      .select('*')
      .eq('id', thread_id)
      .maybeSingle();

    if (!thread || (thread.user_a !== user.id && thread.user_b !== user.id)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Mark all unread messages as read
    const { error: updateError } = await supabaseAdmin
      .from('direct_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('thread_id', thread_id)
      .eq('receiver_id', user.id)
      .is('read_at', null);

    if (updateError) {
      console.error('[dm/mark-read] Error', updateError);
      return res.status(500).json({ error: 'Failed to mark as read' });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('[dm/mark-read] Error', err);
    return res.status(500).json({ error: 'Unexpected error' });
  }
});

// ========================================
// CROSS-ZIP GROUP MERGED FEED
// ========================================

// Helper: Get merged group feed for a ZIP code and its neighbors
async function getMergedGroupFeed(zipCode, radiusKm = 25) {
  // 1. Find neighboring zip codes within the radius
  const { data: neighbors, error: neighborsError } = await supabaseAdmin
    .from('geo_group_neighbors')
    .select('neighbor_zip, distance_km')
    .eq('zip_code', zipCode)
    .lte('distance_km', radiusKm);

  if (neighborsError) {
    console.error('[groups] Error loading neighbors', { zipCode, neighborsError });
    throw neighborsError;
  }

  const nearbyZips = neighbors?.map(n => n.neighbor_zip) || [];

  // Always include the primary zip itself
  const allZips = Array.from(new Set([zipCode, ...nearbyZips]));

  // 2. Load messages for all these zips
  const { data: messages, error: messagesError } = await supabaseAdmin
    .from('geo_group_messages')
    .select('id, zip_code, user_id, message, image_url, created_at')
    .in('zip_code', allZips)
    .order('created_at', { ascending: false })
    .limit(200);

  if (messagesError) {
    console.error('[groups] Error loading messages', { allZips, messagesError });
    throw messagesError;
  }

  // 3. Optionally join with business_profiles so we can show badges
  const userIds = Array.from(new Set((messages || []).map(m => m.user_id).filter(Boolean)));
  let businessProfilesByUser = {};

  if (userIds.length > 0) {
    const { data: businessProfiles, error: businessError } = await supabaseAdmin
      .from('business_profiles')
      .select('user_id, business_type, business_code, name, city, state, country')
      .in('user_id', userIds);

    if (businessError) {
      console.error('[groups] Error loading business_profiles', { userIds, businessError });
      // Non-fatal: continue without business metadata
    } else {
      businessProfilesByUser = (businessProfiles || []).reduce((acc, bp) => {
        acc[bp.user_id] = bp;
        return acc;
      }, {});
    }
  }

  const mergedMessages = (messages || []).map(m => ({
    id: m.id,
    zip: m.zip_code,
    userId: m.user_id,
    message: m.message,
    imageUrl: m.image_url,
    createdAt: m.created_at,
    business: businessProfilesByUser[m.user_id] || null,
  }));

  return {
    zip: zipCode,
    nearbyZips,
    zips: allZips,
    messages: mergedMessages,
  };
}

// GET /api/groups/:zip/merged-feed - Get merged feed for ZIP and neighbors
app.get('/api/groups/:zip/merged-feed', async (req, res) => {
  const zip = (req.params.zip || '').trim();
  const radiusKmParam = req.query.radiusKm;
  const radiusKm = radiusKmParam ? Number(radiusKmParam) : 25;

  if (!zip) {
    return res.status(400).json({ error: 'Missing zip parameter' });
  }

  try {
    console.log('[groups] merged-feed request', { zip, radiusKm });
    const payload = await getMergedGroupFeed(zip, radiusKm);
    return res.json(payload);
  } catch (err) {
    console.error('[groups] merged-feed error', {
      zip,
      radiusKm,
      message: err?.message,
      stack: err?.stack,
    });
    return res.status(500).json({ error: 'Failed to load merged group feed' });
  }
});

// ========================================
// DM THREADS + PRIVACY FLAGS
// ========================================

// Helper: Canonical user pair (always sorted)
function canonicalUserPair(userId1, userId2) {
  if (!userId1 || !userId2) {
    throw new Error('canonicalUserPair: missing user ids');
  }
  return userId1 < userId2
    ? { user_a: userId1, user_b: userId2 }
    : { user_a: userId2, user_b: userId1 };
}

// Load business profile + privacy for a given user
async function getBusinessProfileByUserId(userId) {
  const { data, error } = await supabaseAdmin
    .from('business_profiles')
    .select('user_id, business_type, business_code, name, city, state, country, zip_code, is_public_profile, allow_dms, avatar_url')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('[dm] error loading business profile by user_id', { userId, error });
    throw error;
  }

  return data;
}

// Load business profile by code (for "enter by code" flows)
async function getBusinessProfileByCode(businessCode) {
  const { data, error } = await supabaseAdmin
    .from('business_profiles')
    .select('user_id, business_type, business_code, name, city, state, country, zip_code, is_public_profile, allow_dms, avatar_url')
    .eq('business_code', businessCode)
    .maybeSingle();

  if (error) {
    console.error('[dm] error loading business profile by code', { businessCode, error });
    throw error;
  }

  return data;
}

// POST /api/dm/threads - Create or get DM thread
app.post('/api/dm/threads', express.json(), async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const currentUserId = user.id;
    const { peerUserId, peerBusinessCode } = req.body || {};

    let targetUserId = peerUserId || null;

    if (!targetUserId && peerBusinessCode) {
      // Resolve the business code to a user_id
      const bp = await getBusinessProfileByCode(peerBusinessCode);
      if (!bp) {
        return res.status(404).json({ error: 'Business profile not found' });
      }
      targetUserId = bp.user_id;
    }

    if (!targetUserId) {
      return res.status(400).json({ error: 'Missing peerUserId or peerBusinessCode' });
    }

    if (targetUserId === currentUserId) {
      return res.status(400).json({ error: 'Cannot DM yourself' });
    }

    // Check receiver's privacy
    const receiverProfile = await getBusinessProfileByUserId(targetUserId);
    if (receiverProfile) {
      const { is_public_profile, allow_dms } = receiverProfile;
      if (allow_dms === false || is_public_profile === false) {
        return res.status(403).json({ error: 'This user is not accepting DMs' });
      }
    }

    // If they don't have a business_profile row, treat as regular user allowed for now.
    const { user_a, user_b } = canonicalUserPair(currentUserId, targetUserId);

    // Upsert-like behavior: try to find existing thread first
    const { data: existing, error: findError } = await supabaseAdmin
      .from('dm_threads')
      .select('id, user_a, user_b, created_at, updated_at')
      .eq('user_a', user_a)
      .eq('user_b', user_b)
      .maybeSingle();

    if (findError) {
      console.error('[dm] Error checking existing thread', { user_a, user_b, findError });
      return res.status(500).json({ error: 'Failed to check existing DM thread' });
    }

    let thread = existing;

    if (!thread) {
      const { data: inserted, error: insertError } = await supabaseAdmin
        .from('dm_threads')
        .insert({
          user_a,
          user_b,
        })
        .select('id, user_a, user_b, created_at, updated_at')
        .single();

      if (insertError) {
        console.error('[dm] Error creating DM thread', { user_a, user_b, insertError });
        return res.status(500).json({ error: 'Failed to create DM thread' });
      }

      thread = inserted;
    }

    return res.json({
      thread,
      peerUserId: targetUserId,
    });
  } catch (err) {
    console.error('[dm] create/get thread error', {
      message: err?.message,
      stack: err?.stack,
    });
    return res.status(500).json({ error: 'Failed to create or fetch DM thread' });
  }
});

// GET /api/dm/threads - List DM threads for current user
app.get('/api/dm/threads', async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const currentUserId = user.id;

    const { data: threads, error: threadsError } = await supabaseAdmin
      .from('dm_threads')
      .select('id, user_a, user_b, created_at, updated_at')
      .or(`user_a.eq.${currentUserId},user_b.eq.${currentUserId}`)
      .order('updated_at', { ascending: false })
      .limit(100);

    if (threadsError) {
      console.error('[dm] error listing threads', { currentUserId, threadsError });
      return res.status(500).json({ error: 'Failed to list DM threads' });
    }

    // Determine the "other" user for each thread
    const peerIds = Array.from(
      new Set(
        (threads || []).map(t =>
          t.user_a === currentUserId ? t.user_b : t.user_a
        )
      )
    ).filter(Boolean);

    let profilesByUserId = {};

    if (peerIds.length > 0) {
      const { data: bps, error: bpError } = await supabaseAdmin
        .from('business_profiles')
        .select('user_id, business_type, business_code, name, city, state, country, zip_code, avatar_url')
        .in('user_id', peerIds);

      if (bpError) {
        console.error('[dm] error loading business profiles for threads', { peerIds, bpError });
      } else {
        profilesByUserId = (bps || []).reduce((acc, bp) => {
          acc[bp.user_id] = bp;
          return acc;
        }, {});
      }
    }

    const payload = (threads || []).map(t => {
      const peerId = t.user_a === currentUserId ? t.user_b : t.user_a;
      return {
        id: t.id,
        createdAt: t.created_at,
        updatedAt: t.updated_at,
        peerUserId: peerId,
        peerBusiness: profilesByUserId[peerId] || null,
      };
    });

    return res.json({ threads: payload });
  } catch (err) {
    console.error('[dm] list threads error', {
      message: err?.message,
      stack: err?.stack,
    });
    return res.status(500).json({ error: 'Failed to list DM threads' });
  }
});

// GET /api/dm/threads/:threadId/messages - List messages in a thread
app.get('/api/dm/threads/:threadId/messages', async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const currentUserId = user.id;
    const threadId = req.params.threadId;

    // Ensure user is a participant in the thread
    const { data: thread, error: threadError } = await supabaseAdmin
      .from('dm_threads')
      .select('id, user_a, user_b')
      .eq('id', threadId)
      .maybeSingle();

    if (threadError) {
      console.error('[dm] error loading thread for messages', { threadId, threadError });
      return res.status(500).json({ error: 'Failed to load thread' });
    }

    if (!thread || (thread.user_a !== currentUserId && thread.user_b !== currentUserId)) {
      return res.status(403).json({ error: 'Not a participant in this DM thread' });
    }

    const { data: messages, error: msgError } = await supabaseAdmin
      .from('dm_messages')
      .select('id, thread_id, sender_id, body, image_url, created_at')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true })
      .limit(200);

    if (msgError) {
      console.error('[dm] error loading messages', { threadId, msgError });
      return res.status(500).json({ error: 'Failed to load messages' });
    }

    return res.json({ messages: messages || [] });
  } catch (err) {
    console.error('[dm] list messages error', {
      threadId: req.params.threadId,
      message: err?.message,
      stack: err?.stack,
    });
    return res.status(500).json({ error: 'Failed to list messages' });
  }
});

// POST /api/dm/threads/:threadId/messages - Send message in a thread
app.post('/api/dm/threads/:threadId/messages', express.json(), async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const currentUserId = user.id;
    const threadId = req.params.threadId;
    const { body, imageUrl } = req.body || {};

    if (!body && !imageUrl) {
      return res.status(400).json({ error: 'Message must have body or imageUrl' });
    }

    // Ensure user is a participant in the thread
    const { data: thread, error: threadError } = await supabaseAdmin
      .from('dm_threads')
      .select('id, user_a, user_b')
      .eq('id', threadId)
      .maybeSingle();

    if (threadError) {
      console.error('[dm] error loading thread for send', { threadId, threadError });
      return res.status(500).json({ error: 'Failed to load thread' });
    }

    if (!thread || (thread.user_a !== currentUserId && thread.user_b !== currentUserId)) {
      return res.status(403).json({ error: 'Not a participant in this DM thread' });
    }

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from('dm_messages')
      .insert({
        thread_id: threadId,
        sender_id: currentUserId,
        body: body || null,
        image_url: imageUrl || null,
      })
      .select('id, thread_id, sender_id, body, image_url, created_at')
      .single();

    if (insertError) {
      console.error('[dm] error inserting message', { threadId, insertError });
      return res.status(500).json({ error: 'Failed to send message' });
    }

    // Update thread updated_at
    const { error: updateThreadError } = await supabaseAdmin
      .from('dm_threads')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', threadId);

    if (updateThreadError) {
      console.error('[dm] error updating thread timestamp', {
        threadId,
        updateThreadError,
      });
      // Non-fatal
    }

    return res.status(201).json({ message: inserted });
  } catch (err) {
    console.error('[dm] send message error', {
      threadId: req.params.threadId,
      message: err?.message,
      stack: err?.stack,
    });
    return res.status(500).json({ error: 'Failed to send message' });
  }
});

// GET /api/business/:code - Lookup grower/dispensary by code
app.get('/api/business/:code', async (req, res) => {
  try {
    const { code } = req.params;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Invalid business code' });
    }

    const { data, error } = await supabaseAdmin
      .from('business_profiles')
      .select('*')
      .eq('business_code', code.toUpperCase())
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('[business/get] Database error', error);
      return res.status(500).json({ error: 'Failed to lookup business' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Business not found' });
    }

    return res.json({ success: true, profile: data });
  } catch (err) {
    console.error('[business/get] Unexpected error', err);
    return res.status(500).json({ error: 'Internal error' });
  }
});

// ========================================
// PRO MODE: Access code validation
// ========================================
app.post('/api/pro/validate-code', express.json(), async (req, res) => {
  try {
    const { code } = req.body || {};

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Missing code' });
    }

    const role = resolveProRoleForCode(code);

    if (!role) {
      return res.status(401).json({ error: 'Invalid code' });
    }

    // Optionally tie to authenticated user via Supabase access token / user_id
    // For now, we'll just return the role without persisting to profile
    // Frontend will store this in localStorage
    let profileUpdate = null;

    // If you have user_id in request, optionally update profile
    const userId = req.body?.user_id || req.query?.user_id || null;
    if (userId && supabaseAdmin) {
      try {
        const { data: profile, error: profileError } = await supabaseAdmin
          .from('profiles')
          .update({
            pro_role: role,
            pro_enabled: true
          })
          .eq('id', userId)
          .select('*')
          .single();

        if (profileError) {
          console.error('[pro/validate-code] Failed to update profile', profileError);
        } else {
          profileUpdate = profile;
        }
      } catch (profileErr) {
        console.error('[pro/validate-code] Profile update error', profileErr);
        // Don't fail the request if profile update fails
      }
    }

    return res.json({
      ok: true,
      role,
      proEnabled: true,
      profile: profileUpdate ? {
        id: profileUpdate.id,
        pro_role: profileUpdate.pro_role,
        pro_enabled: profileUpdate.pro_enabled
      } : null
    });
  } catch (err) {
    console.error('[pro/validate-code] Error', err);
    return res.status(500).json({ error: 'Internal error' });
  }
});

// ========================================
// ZIP-BASED GROUP CHAT ENDPOINTS
// ========================================

// POST /api/chat/zip/send - Send a message to a ZIP group
app.post('/api/chat/zip/send', express.json(), async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { zipCode, body } = req.body || {};
    if (!zipCode || !body) {
      return res.status(400).json({ error: 'zipCode and body are required' });
    }

    const { conversationId, message } = await joinZipGroupAndSendMessage({
      zipCode,
      userId: user.id,
      body,
    });

    return res.json({
      conversationId,
      message,
    });
  } catch (err) {
    console.error('[api/chat/zip/send] error', err);
    return res.status(500).json({ error: 'Failed to send message' });
  }
});

// GET /api/chat/zip/:zipCode - Get messages for a ZIP group
app.get('/api/chat/zip/:zipCode', async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { zipCode } = req.params;
    const { limit = 50, before } = req.query;

    const { data: zipGroup, error: zipError } = await supabaseAdmin
      .from('zip_groups')
      .select('conversation_id')
      .eq('zip_code', zipCode)
      .eq('country', 'US')
      .maybeSingle();

    if (zipError) {
      console.error('[api/chat/zip/:zipCode] zip lookup error', zipError);
      return res.status(500).json({ error: 'Failed to load zip group' });
    }

    if (!zipGroup?.conversation_id) {
      return res.json({ messages: [], hasMore: false });
    }

    const conversationId = zipGroup.conversation_id;

    let query = supabaseAdmin
      .from('messages')
      .select('id, body, sender_id, created_at, attachment_url, attachment_type, strain_slug, scan_id')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(Number(limit));

    if (before) {
      query = query.lt('created_at', before);
    }

    const { data: messages, error: msgError } = await query;

    if (msgError) {
      console.error('[api/chat/zip/:zipCode] messages error', msgError);
      return res.status(500).json({ error: 'Failed to load messages' });
    }

    return res.json({
      messages: messages || [],
      hasMore: (messages || []).length === Number(limit),
    });
  } catch (err) {
    console.error('[api/chat/zip/:zipCode] error', err);
    return res.status(500).json({ error: 'Failed to load messages' });
  }
});

// POST /api/chat/upload - Upload image/media attachment for chat
app.post('/api/chat/upload', express.raw({ type: 'image/*', limit: '10mb' }), async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const conversationId = req.headers['x-conversation-id'] || req.query.conversationId;
    if (!conversationId) {
      return res.status(400).json({ error: 'conversationId is required' });
    }

    if (!req.body || req.body.length === 0) {
      return res.status(400).json({ error: 'No file data provided' });
    }

    // Determine content type from headers or default to image/jpeg
    const contentType = req.headers['content-type'] || 'image/jpeg';
    const fileExtension = contentType.includes('png') ? 'png' : contentType.includes('gif') ? 'gif' : 'jpg';
    const fileName = `messages/${conversationId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('chat-media')
      .upload(fileName, req.body, {
        contentType,
        upsert: false,
      });

    if (uploadError) {
      console.error('[api/chat/upload] storage upload error', uploadError);
      return res.status(500).json({ error: 'Upload failed' });
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('chat-media')
      .getPublicUrl(fileName);

    // Create message with attachment
    const { data: msg, error: msgError } = await supabaseAdmin
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        body: '',
        attachment_url: publicUrl,
        attachment_type: contentType,
      })
      .select('id, attachment_url, attachment_type, created_at, sender_id, conversation_id')
      .single();

    if (msgError) {
      console.error('[api/chat/upload] message insert error', msgError);
      return res.status(500).json({ error: 'Failed to create message' });
    }

    return res.json({
      message: msg,
      attachmentUrl: publicUrl,
    });
  } catch (err) {
    console.error('[api/chat/upload] error', err);
    return res.status(500).json({ error: 'Failed to upload attachment' });
  }
});

// POST /api/chat/dm/create - Create or get DM conversation between two users
app.post('/api/chat/dm/create', express.json(), async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { peerUserId } = req.body || {};
    if (!peerUserId) {
      return res.status(400).json({ error: 'peerUserId is required' });
    }

    if (peerUserId === user.id) {
      return res.status(400).json({ error: 'Cannot create DM with yourself' });
    }

    const conversationId = await getOrCreateDM(user.id, peerUserId);

    return res.json({
      conversationId,
    });
  } catch (err) {
    console.error('[api/chat/dm/create] error', err);
    return res.status(500).json({ error: 'Failed to create DM conversation' });
  }
});

// POST /api/chat/dm/send - Send a message in a DM conversation
app.post('/api/chat/dm/send', express.json(), async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { conversationId, body, attachmentUrl, attachmentType, strainSlug, scanId } = req.body || {};
    if (!conversationId || !body) {
      return res.status(400).json({ error: 'conversationId and body are required' });
    }

    // Verify user is a member of this conversation
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('conversation_members')
      .select('user_id')
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (membershipError) {
      console.error('[api/chat/dm/send] membership check error', membershipError);
      return res.status(500).json({ error: 'Failed to verify membership' });
    }

    if (!membership) {
      return res.status(403).json({ error: 'Not a member of this conversation' });
    }

    // Insert message
    const { data: msg, error: msgError } = await supabaseAdmin
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        body,
        attachment_url: attachmentUrl || null,
        attachment_type: attachmentType || null,
        strain_slug: strainSlug || null,
        scan_id: scanId || null,
      })
      .select('id, body, sender_id, created_at, attachment_url, attachment_type, strain_slug, scan_id')
      .single();

    if (msgError) {
      console.error('[api/chat/dm/send] message insert error', msgError);
      return res.status(500).json({ error: 'Failed to send message' });
    }

    return res.json({
      message: msg,
    });
  } catch (err) {
    console.error('[api/chat/dm/send] error', err);
    return res.status(500).json({ error: 'Failed to send message' });
  }
});

// ========================================
// ZIP GROUP FEED POSTS ENDPOINTS
// ========================================

// POST /api/groups/:zip/posts - Create a post in a ZIP group feed
app.post('/api/groups/:zip/posts', express.json(), async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const zip = (req.params.zip || '').trim();
    if (!zip) {
      return res.status(400).json({ error: 'ZIP code is required' });
    }

    const { postType, title, body, imageUrl, strainSlug, scanId } = req.body || {};

    // Ensure ZIP group exists
    const groupId = await ensureZipGroup(zip, 'US');

    // Check if user has a business profile
    const { data: business, error: businessError } = await supabaseAdmin
      .from('business_profiles')
      .select('id, business_type, business_code, name')
      .eq('user_id', user.id)
      .maybeSingle();

    if (businessError) {
      console.error('[api/groups/:zip/posts] business lookup error', businessError);
    }

    // Create post
    const { data: post, error: postError } = await supabaseAdmin
      .from('group_posts')
      .insert({
        group_id: groupId,
        author_user_id: user.id,
        business_id: business?.id || null,
        post_type: postType || 'general',
        title: title || null,
        body: body || null,
        image_url: imageUrl || null,
        strain_slug: strainSlug || null,
        scan_id: scanId || null,
      })
      .select(`
        *,
        business:business_profiles (
          id,
          business_type,
          business_code,
          name,
          city,
          state
        )
      `)
      .single();

    if (postError) {
      console.error('[api/groups/:zip/posts] create post error', postError);
      return res.status(500).json({ error: 'Failed to create post' });
    }

    return res.json({ post });
  } catch (err) {
    console.error('[api/groups/:zip/posts] error', err);
    return res.status(500).json({ error: 'Internal error' });
  }
});

// GET /api/groups/:zip/feed - Get feed posts for a ZIP group
app.get('/api/groups/:zip/feed', async (req, res) => {
  try {
    const zip = (req.params.zip || '').trim();
    if (!zip) {
      return res.status(400).json({ error: 'ZIP code is required' });
    }

    // Ensure ZIP group exists (or create it)
    const groupId = await ensureZipGroup(zip, 'US');

    // Fetch posts with business info
    const { data: posts, error: postsError } = await supabaseAdmin
      .from('group_posts')
      .select(`
        *,
        business:business_profiles (
          id,
          business_type,
          business_code,
          name,
          city,
          state
        )
      `)
      .eq('group_id', groupId)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(100);

    if (postsError) {
      console.error('[api/groups/:zip/feed] fetch posts error', postsError);
      return res.status(500).json({ error: 'Failed to load feed' });
    }

    return res.json({ posts: posts || [] });
  } catch (err) {
    console.error('[api/groups/:zip/feed] error', err);
    return res.status(500).json({ error: 'Internal error' });
  }
});

// POST /api/groups/:zip/posts/:id/pin - Pin a post (businesses only)
app.post('/api/groups/:zip/posts/:id/pin', express.json(), async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const postId = req.params.id;
    const { pinnedUntil } = req.body || {};

    // Check if user has a business profile
    const { data: business, error: businessError } = await supabaseAdmin
      .from('business_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (businessError) {
      console.error('[api/groups/:zip/posts/:id/pin] business lookup error', businessError);
      return res.status(500).json({ error: 'Failed to verify business' });
    }

    if (!business?.id) {
      return res.status(403).json({ error: 'Only businesses can pin posts' });
    }

    // Get the post
    const { data: post, error: postFetchError } = await supabaseAdmin
      .from('group_posts')
      .select('id, business_id')
      .eq('id', postId)
      .single();

    if (postFetchError || !post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Verify post belongs to this business
    if (post.business_id !== business.id) {
      return res.status(403).json({ error: 'Not your post to pin' });
    }

    // Calculate pinned_until (default 24 hours from now)
    const defaultPinnedUntil = new Date(Date.now() + 86400000).toISOString();
    const finalPinnedUntil = pinnedUntil || defaultPinnedUntil;

    // Update post
    const { data: updatedPost, error: updateError } = await supabaseAdmin
      .from('group_posts')
      .update({
        is_pinned: true,
        pinned_until: finalPinnedUntil,
      })
      .eq('id', postId)
      .select(`
        *,
        business:business_profiles (
          id,
          business_type,
          business_code,
          name,
          city,
          state
        )
      `)
      .single();

    if (updateError) {
      console.error('[api/groups/:zip/posts/:id/pin] update error', updateError);
      return res.status(500).json({ error: 'Failed to pin post' });
    }

    return res.json({ post: updatedPost });
  } catch (err) {
    console.error('[api/groups/:zip/posts/:id/pin] error', err);
    return res.status(500).json({ error: 'Internal error' });
  }
});

// POST /api/groups/:zip/posts/:id/reaction - Add/remove reaction to a post
app.post('/api/groups/:zip/posts/:id/reaction', express.json(), async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const postId = req.params.id;
    const { reactionType = 'like' } = req.body || {};

    if (!['like', 'fire', 'save'].includes(reactionType)) {
      return res.status(400).json({ error: 'Invalid reaction type' });
    }

    // Check if reaction already exists
    const { data: existing, error: checkError } = await supabaseAdmin
      .from('group_post_reactions')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .eq('reaction_type', reactionType)
      .maybeSingle();

    if (checkError) {
      console.error('[api/groups/:zip/posts/:id/reaction] check error', checkError);
      return res.status(500).json({ error: 'Failed to check reaction' });
    }

    if (existing) {
      // Remove reaction (toggle off)
      const { error: deleteError } = await supabaseAdmin
        .from('group_post_reactions')
        .delete()
        .eq('id', existing.id);

      if (deleteError) {
        console.error('[api/groups/:zip/posts/:id/reaction] delete error', deleteError);
        return res.status(500).json({ error: 'Failed to remove reaction' });
      }

      return res.json({ reaction: null, action: 'removed' });
    } else {
      // Add reaction
      const { data: reaction, error: insertError } = await supabaseAdmin
        .from('group_post_reactions')
        .insert({
          post_id: postId,
          user_id: user.id,
          reaction_type: reactionType,
        })
        .select('*')
        .single();

      if (insertError) {
        console.error('[api/groups/:zip/posts/:id/reaction] insert error', insertError);
        return res.status(500).json({ error: 'Failed to add reaction' });
      }

      return res.json({ reaction, action: 'added' });
    }
  } catch (err) {
    console.error('[api/groups/:zip/posts/:id/reaction] error', err);
    return res.status(500).json({ error: 'Internal error' });
  }
});

// ========================================
// DIRECT MESSAGING (DM) ENDPOINTS
// ========================================

// POST /api/dm/start - Start or get a DM conversation
app.post('/api/dm/start', express.json(), async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { targetUserId, targetBusinessId } = req.body || {};

    if (!targetUserId && !targetBusinessId) {
      return res.status(400).json({ error: 'Missing target' });
    }

    let conversation;

    if (targetUserId) {
      conversation = await findOrCreateConversationForUserUser(
        user.id,
        targetUserId
      );
    } else {
      conversation = await findOrCreateConversationForUserBusiness(
        user.id,
        targetBusinessId
      );
    }

    return res.json({ conversation });
  } catch (e) {
    console.error('[api/dm/start] error', e);
    return res.status(500).json({ error: e?.message || 'Internal error' });
  }
});

// POST /api/dm/:conversationId/messages - Send a message in a DM conversation
app.post('/api/dm/:conversationId/messages', express.json(), async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const conversationId = req.params.conversationId;
    const { body, imageUrl } = req.body || {};

    if (!body && !imageUrl) {
      return res.status(400).json({ error: 'body or imageUrl is required' });
    }

    // Ensure user is part of conversation
    const { data: conv, error: convErr } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .maybeSingle();

    if (convErr) {
      console.error('[api/dm/:conversationId/messages] conversation lookup error', convErr);
      return res.status(500).json({ error: 'Failed to verify conversation' });
    }

    if (!conv) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Check if user is participant
    // For user-user: user_a_id or user_b_id
    // For user-business: user_a_id (user) or business owner
    let isParticipant = false;
    if (conv.user_a_id === user.id || conv.user_b_id === user.id) {
      isParticipant = true;
    } else if (conv.business_b_id) {
      // Check if user owns the business
      const { data: business } = await supabaseAdmin
        .from('business_profiles')
        .select('user_id')
        .eq('id', conv.business_b_id)
        .single();
      if (business && business.user_id === user.id) {
        isParticipant = true;
      }
    }

    if (!isParticipant) {
      return res.status(403).json({ error: 'Not allowed in this conversation' });
    }

    // Insert message
    const { data: message, error: msgErr } = await supabaseAdmin
      .from('conversation_messages')
      .insert({
        conversation_id: conversationId,
        sender_user_id: user.id,
        body: body || null,
        image_url: imageUrl || null,
      })
      .select('*')
      .single();

    if (msgErr) {
      console.error('[api/dm/:conversationId/messages] message insert error', msgErr);
      return res.status(500).json({ error: 'Failed to send message' });
    }

    // Update conversation metadata
    const previewText = body || (imageUrl ? '[image]' : '');
    const preview = previewText.length > 100 ? previewText.substring(0, 100) + '...' : previewText;

    await supabaseAdmin
      .from('conversations')
      .update({
        last_message_text: preview,
        last_message_at: message.created_at,
        updated_at: message.created_at,
      })
      .eq('id', conversationId);

    return res.json({ message });
  } catch (e) {
    console.error('[api/dm/:conversationId/messages] error', e);
    return res.status(500).json({ error: e?.message || 'Internal error' });
  }
});

// GET /api/dm/:conversationId/messages - Get messages in a DM conversation
app.get('/api/dm/:conversationId/messages', async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const conversationId = req.params.conversationId;
    const limit = Math.min(parseInt(req.query.limit || '50', 10), 100);
    const before = req.query.before;

    // Verify conversation exists
    const { data: conv, error: convErr } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .maybeSingle();

    if (convErr) {
      console.error('[api/dm/:conversationId/messages] conversation lookup error', convErr);
      return res.status(500).json({ error: 'Failed to verify conversation' });
    }

    if (!conv) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Check if user is participant
    let isParticipant = false;
    if (conv.user_a_id === user.id || conv.user_b_id === user.id) {
      isParticipant = true;
    } else if (conv.business_b_id) {
      // Check if user owns the business
      const { data: business } = await supabaseAdmin
        .from('business_profiles')
        .select('user_id')
        .eq('id', conv.business_b_id)
        .single();
      if (business && business.user_id === user.id) {
        isParticipant = true;
      }
    }

    if (!isParticipant) {
      return res.status(403).json({ error: 'Not allowed' });
    }

    // Fetch messages
    let query = supabaseAdmin
      .from('conversation_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (before) {
      query = query.lt('created_at', before);
    }

    const { data: messages, error: msgError } = await query;

    if (msgError) {
      console.error('[api/dm/:conversationId/messages] fetch messages error', msgError);
      return res.status(500).json({ error: 'Failed to load messages' });
    }

    // Mark messages from the other side as read
    await supabaseAdmin
      .from('conversation_messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_user_id', user.id)
      .eq('is_read', false);

    return res.json({ messages: messages || [] });
  } catch (e) {
    console.error('[api/dm/:conversationId/messages] error', e);
    return res.status(500).json({ error: e?.message || 'Internal error' });
  }
});

// GET /api/dm/inbox - Get all DM conversations for current user with unread counts
app.get('/api/dm/inbox', async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get all conversations where user is a participant
    const { data: conversations, error: convError } = await supabaseAdmin
      .from('conversations')
      .select(`
        *,
        business:business_profiles (
          id,
          business_type,
          business_code,
          name,
          city,
          state
        )
      `)
      .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
      .eq('is_group', false)
      .order('last_message_at', { ascending: false, nullsFirst: false });

    if (convError) {
      console.error('[api/dm/inbox] fetch conversations error', convError);
      return res.status(500).json({ error: 'Failed to load inbox' });
    }

    // For each conversation, count unread messages
    const convoIds = (conversations || []).map((c) => c.id);
    let unreadByConv = {};

    if (convoIds.length > 0) {
      // Get unread message counts per conversation
      const { data: unreadData, error: unreadError } = await supabaseAdmin
        .from('conversation_messages')
        .select('conversation_id')
        .in('conversation_id', convoIds)
        .eq('is_read', false)
        .neq('sender_user_id', user.id);

      if (unreadError) {
        console.error('[api/dm/inbox] unread count error', unreadError);
      } else {
        // Count unread messages per conversation
        (unreadData || []).forEach((msg) => {
          unreadByConv[msg.conversation_id] = (unreadByConv[msg.conversation_id] || 0) + 1;
        });
      }
    }

    // Also check business conversations where user owns the business
    if (conversations && conversations.length > 0) {
      const businessConvoIds = conversations
        .filter((c) => c.business_b_id)
        .map((c) => c.id);

      if (businessConvoIds.length > 0) {
        // Get business conversations where user owns the business
        const { data: userBusinesses } = await supabaseAdmin
          .from('business_profiles')
          .select('id')
          .eq('user_id', user.id);

        const userBusinessIds = (userBusinesses || []).map((b) => b.id);

        const businessConvos = conversations.filter(
          (c) => c.business_b_id && userBusinessIds.includes(c.business_b_id)
        );

        businessConvos.forEach((conv) => {
          if (!convoIds.includes(conv.id)) {
            convoIds.push(conv.id);
          }
        });
      }
    }

    // Format response with unread counts
    const formatted = (conversations || []).map((c) => ({
      ...c,
      unread_count: unreadByConv[c.id] || 0,
    }));

    return res.json({ conversations: formatted });
  } catch (e) {
    console.error('[api/dm/inbox] error', e);
    return res.status(500).json({ error: e?.message || 'Internal error' });
  }
});

// GET /api/dm/conversations - List all DM conversations for current user
app.get('/api/dm/conversations', async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get conversations where user is participant A or B
    const { data: conversations, error: convError } = await supabaseAdmin
      .from('dm_conversations')
      .select(`
        *,
        user_a:user_a_id (
          id,
          email
        ),
        user_b:user_b_id (
          id,
          email
        ),
        business:business_b_id (
          id,
          business_type,
          business_code,
          name,
          city,
          state
        )
      `)
      .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .limit(100);

    if (convError) {
      console.error('[api/dm/conversations] fetch error', convError);
      return res.status(500).json({ error: 'Failed to load conversations' });
    }

    // Get unread counts for each conversation
    const conversationIds = (conversations || []).map((c) => c.id);
    const { data: receipts } = await supabaseAdmin
      .from('dm_read_receipts')
      .select('conversation_id, unread_count')
      .eq('user_id', user.id)
      .in('conversation_id', conversationIds);

    const unreadMap = new Map();
    (receipts || []).forEach((r) => {
      unreadMap.set(r.conversation_id, r.unread_count || 0);
    });

    // Attach unread counts and format response
    const formatted = (conversations || []).map((conv) => ({
      id: conv.id,
      lastMessageText: conv.last_message_text,
      lastMessageAt: conv.last_message_at,
      createdAt: conv.created_at,
      unreadCount: unreadMap.get(conv.id) || 0,
      participant: conv.user_a_id === user.id
        ? (conv.user_b || conv.business)
        : (conv.user_a || null),
      isBusiness: !!conv.business_b_id,
    }));

    return res.json({ conversations: formatted });
  } catch (err) {
    console.error('[api/dm/conversations] error', err);
    return res.status(500).json({ error: 'Internal error' });
  }
});

// POST /api/dm/conversations/create - Create or get DM conversation
app.post('/api/dm/conversations/create', express.json(), async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { peerUserId, businessId } = req.body || {};

    if (!peerUserId && !businessId) {
      return res.status(400).json({ error: 'peerUserId or businessId is required' });
    }

    let conversationId;
    if (businessId) {
      conversationId = await getOrCreateUserBusinessDM(user.id, businessId);
    } else {
      conversationId = await getOrCreateUserUserDM(user.id, peerUserId);
    }

    return res.json({ conversationId });
  } catch (err) {
    console.error('[api/dm/conversations/create] error', err);
    return res.status(500).json({ error: err?.message || 'Failed to create conversation' });
  }
});

// GET /api/dm/conversations/:id/messages - Get messages in a DM conversation
app.get('/api/dm/conversations/:id/messages', async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const conversationId = req.params.id;
    const { limit = 50, before } = req.query;

    // Verify user is a participant
    const { data: conversation, error: convError } = await supabaseAdmin
      .from('dm_conversations')
      .select('user_a_id, user_b_id, business_b_id')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const isParticipant =
      conversation.user_a_id === user.id ||
      conversation.user_b_id === user.id ||
      (conversation.business_b_id && await (async () => {
        const { data: business } = await supabaseAdmin
          .from('business_profiles')
          .select('user_id')
          .eq('id', conversation.business_b_id)
          .single();
        return business?.user_id === user.id;
      })());

    if (!isParticipant) {
      return res.status(403).json({ error: 'Not a participant in this conversation' });
    }

    // Fetch messages
    let query = supabaseAdmin
      .from('dm_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(Number(limit));

    if (before) {
      query = query.lt('created_at', before);
    }

    const { data: messages, error: msgError } = await query;

    if (msgError) {
      console.error('[api/dm/conversations/:id/messages] fetch error', msgError);
      return res.status(500).json({ error: 'Failed to load messages' });
    }

    // Mark conversation as read
    await markDMConversationAsRead(conversationId, user.id);

    return res.json({
      messages: messages || [],
      hasMore: (messages || []).length === Number(limit),
    });
  } catch (err) {
    console.error('[api/dm/conversations/:id/messages] error', err);
    return res.status(500).json({ error: 'Internal error' });
  }
});

// POST /api/dm/conversations/:id/messages - Send a message in a DM conversation
app.post('/api/dm/conversations/:id/messages', express.json(), async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const conversationId = req.params.id;
    const { body, imageUrl, imageType } = req.body || {};

    if (!body && !imageUrl) {
      return res.status(400).json({ error: 'body or imageUrl is required' });
    }

    // Verify user is a participant
    const { data: conversation, error: convError } = await supabaseAdmin
      .from('dm_conversations')
      .select('user_a_id, user_b_id, business_b_id')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const isParticipant =
      conversation.user_a_id === user.id ||
      conversation.user_b_id === user.id ||
      (conversation.business_b_id && await (async () => {
        const { data: business } = await supabaseAdmin
          .from('business_profiles')
          .select('user_id')
          .eq('id', conversation.business_b_id)
          .single();
        return business?.user_id === user.id;
      })());

    if (!isParticipant) {
      return res.status(403).json({ error: 'Not a participant in this conversation' });
    }

    // Send message
    const { message } = await sendDMMessage(
      conversationId,
      user.id,
      body || '',
      { imageUrl, imageType }
    );

    return res.json({ message });
  } catch (err) {
    console.error('[api/dm/conversations/:id/messages] error', err);
    return res.status(500).json({ error: err?.message || 'Failed to send message' });
  }
});

// POST /api/dm/conversations/:id/read - Mark conversation as read
app.post('/api/dm/conversations/:id/read', async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const conversationId = req.params.id;

    await markDMConversationAsRead(conversationId, user.id);

    return res.json({ success: true });
  } catch (err) {
    console.error('[api/dm/conversations/:id/read] error', err);
    return res.status(500).json({ error: 'Failed to mark as read' });
  }
});

// ========================================
// GROUP CHAT ENDPOINTS
// ========================================

// GET /api/groups - List all available groups (filtered by type, zip, etc.)
app.get('/api/groups', async (req, res) => {
  try {
    const { type, zipCode } = req.query || {};

    let query = supabaseAdmin
      .from('chat_groups')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    if (type && ['zip', 'global', 'interest'].includes(type)) {
      query = query.eq('group_type', type);
    }

    if (zipCode) {
      query = query.eq('zip_code', zipCode);
    }

    const { data: groups, error: groupsError } = await query;

    if (groupsError) {
      console.error('[api/groups] fetch error', groupsError);
      return res.status(500).json({ error: 'Failed to load groups' });
    }

    return res.json({ groups: groups || [] });
  } catch (err) {
    console.error('[api/groups] error', err);
    return res.status(500).json({ error: 'Internal error' });
  }
});

// GET /api/groups/:groupId - Get group details
app.get('/api/groups/:groupId', async (req, res) => {
  try {
    const groupId = req.params.groupId;

    const { data: group, error: groupError } = await supabaseAdmin
      .from('chat_groups')
      .select('*')
      .eq('id', groupId)
      .single();

    if (groupError || !group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Get member count
    const { count: memberCount } = await supabaseAdmin
      .from('chat_group_members')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', groupId);

    return res.json({
      group: {
        ...group,
        member_count: memberCount || 0,
      },
    });
  } catch (err) {
    console.error('[api/groups/:groupId] error', err);
    return res.status(500).json({ error: 'Internal error' });
  }
});

// POST /api/groups/:groupId/join - Join a group
app.post('/api/groups/:groupId/join', express.json(), async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const groupId = req.params.groupId;

    // Verify group exists and is public
    const { data: group, error: groupError } = await supabaseAdmin
      .from('chat_groups')
      .select('*')
      .eq('id', groupId)
      .single();

    if (groupError || !group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (!group.is_public) {
      return res.status(403).json({ error: 'Group is not public' });
    }

    // Check if already a member
    const { data: existing } = await supabaseAdmin
      .from('chat_group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      return res.json({ success: true, already_member: true });
    }

    // Join group
    const { data: membership, error: joinError } = await supabaseAdmin
      .from('chat_group_members')
      .insert({
        group_id: groupId,
        user_id: user.id,
        role: 'member',
      })
      .select('*')
      .single();

    if (joinError) {
      console.error('[api/groups/:groupId/join] join error', joinError);
      return res.status(500).json({ error: 'Failed to join group' });
    }

    return res.json({ success: true, membership });
  } catch (err) {
    console.error('[api/groups/:groupId/join] error', err);
    return res.status(500).json({ error: 'Internal error' });
  }
});

// GET /api/groups/:groupId/messages - Get messages in a group
app.get('/api/groups/:groupId/messages', async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const groupId = req.params.groupId;
    const { limit = 50, before } = req.query;

    // Verify user is a member
    const { data: membership } = await supabaseAdmin
      .from('chat_group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!membership) {
      return res.status(403).json({ error: 'Not a member of this group' });
    }

    // Fetch messages (pinned first, then by date)
    let query = supabaseAdmin
      .from('chat_group_messages')
      .select(`
        *,
        sender: sender_user_id (
          id,
          email
        )
      `)
      .eq('group_id', groupId)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(Number(limit));

    if (before) {
      query = query.lt('created_at', before);
    }

    const { data: messages, error: msgError } = await query;

    if (msgError) {
      console.error('[api/groups/:groupId/messages] fetch error', msgError);
      return res.status(500).json({ error: 'Failed to load messages' });
    }

    return res.json({
      messages: messages || [],
      hasMore: (messages || []).length === Number(limit),
    });
  } catch (err) {
    console.error('[api/groups/:groupId/messages] error', err);
    return res.status(500).json({ error: 'Internal error' });
  }
});

// POST /api/groups/:groupId/messages - Send a message in a group
app.post('/api/groups/:groupId/messages', express.json(), async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const groupId = req.params.groupId;
    const { body, imageUrl } = req.body || {};

    if (!body && !imageUrl) {
      return res.status(400).json({ error: 'body or imageUrl is required' });
    }

    // Verify user is a member
    const { data: membership } = await supabaseAdmin
      .from('chat_group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!membership) {
      return res.status(403).json({ error: 'Not a member of this group' });
    }

    // Check if group is business-only
    const { data: group } = await supabaseAdmin
      .from('chat_groups')
      .select('business_only')
      .eq('id', groupId)
      .single();

    if (group?.business_only) {
      // Verify user has a business profile
      const { data: business } = await supabaseAdmin
        .from('business_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!business) {
        return res.status(403).json({ error: 'Only businesses can post in this group' });
      }
    }

    // Insert message
    const { data: message, error: msgError } = await supabaseAdmin
      .from('chat_group_messages')
      .insert({
        group_id: groupId,
        sender_user_id: user.id,
        body: body || null,
        image_url: imageUrl || null,
        is_pinned: false,
      })
      .select(`
        *,
        sender: sender_user_id (
          id,
          email
        )
      `)
      .single();

    if (msgError) {
      console.error('[api/groups/:groupId/messages] insert error', msgError);
      return res.status(500).json({ error: 'Failed to send message' });
    }

    // Update group updated_at
    await supabaseAdmin
      .from('chat_groups')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', groupId);

    return res.json({ message });
  } catch (err) {
    console.error('[api/groups/:groupId/messages] error', err);
    return res.status(500).json({ error: 'Internal error' });
  }
});

// POST /api/groups/:groupId/messages/:messageId/pin - Pin a message (businesses/moderators only)
app.post('/api/groups/:groupId/messages/:messageId/pin', express.json(), async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { groupId, messageId } = req.params;

    // Verify user is a member
    const { data: membership } = await supabaseAdmin
      .from('chat_group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!membership) {
      return res.status(403).json({ error: 'Not a member of this group' });
    }

    // Check if user is moderator/owner or has business profile
    const isModerator = ['owner', 'moderator'].includes(membership.role);
    const { data: business } = await supabaseAdmin
      .from('business_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!isModerator && !business) {
      return res.status(403).json({ error: 'Only businesses and moderators can pin messages' });
    }

    // Verify message exists and belongs to this group
    const { data: message } = await supabaseAdmin
      .from('chat_group_messages')
      .select('id, is_pinned')
      .eq('id', messageId)
      .eq('group_id', groupId)
      .single();

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Toggle pin status
    const { data: updatedMessage, error: updateError } = await supabaseAdmin
      .from('chat_group_messages')
      .update({ is_pinned: !message.is_pinned })
      .eq('id', messageId)
      .select('*')
      .single();

    if (updateError) {
      console.error('[api/groups/:groupId/messages/:messageId/pin] update error', updateError);
      return res.status(500).json({ error: 'Failed to pin/unpin message' });
    }

    return res.json({ message: updatedMessage });
  } catch (err) {
    console.error('[api/groups/:groupId/messages/:messageId/pin] error', err);
    return res.status(500).json({ error: 'Internal error' });
  }
});

// GET /api/groups/my - Get groups user is a member of
app.get('/api/groups/my', async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data: memberships, error: membershipError } = await supabaseAdmin
      .from('chat_group_members')
      .select(`
        *,
        group: chat_groups (*)
      `)
      .eq('user_id', user.id)
      .order('joined_at', { ascending: false });

    if (membershipError) {
      console.error('[api/groups/my] fetch error', membershipError);
      return res.status(500).json({ error: 'Failed to load groups' });
    }

    const groups = (memberships || []).map((m) => ({
      ...m.group,
      role: m.role,
      joined_at: m.joined_at,
    }));

    return res.json({ groups });
  } catch (err) {
    console.error('[api/groups/my] error', err);
    return res.status(500).json({ error: 'Internal error' });
  }
});

// POST /api/groups/ensure-defaults - Ensure default groups exist (admin/startup)
app.post('/api/groups/ensure-defaults', async (req, res) => {
  try {
    await ensureDefaultGroups();
    return res.json({ success: true, message: 'Default groups ensured' });
  } catch (err) {
    console.error('[api/groups/ensure-defaults] error', err);
    return res.status(500).json({ error: 'Failed to ensure default groups' });
  }
});

  app.listen(PORT, () => {
    console.log(`[strainspotter] backend listening on http://localhost:${PORT}`);
  });
}

export default app;
export const handler = serverless(app);
