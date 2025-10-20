import { ImageAnnotatorClient } from '@google-cloud/vision';
import express from 'express';
import dotenv from 'dotenv';
import { supabase } from './supabaseClient.js';
import { ensureBucketExists } from './supabaseAdmin.js';
import fs from 'fs';

// Import all route modules at the top (ES module requirement)
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
import groupsRoutes from './routes/groups.js';
import journalsRoutes from './routes/journals.js';
import eventsRoutes from './routes/events.js';
import feedbackRoutes from './routes/feedback.js';

// Load env from ../env/.env.local (works when launched from backend/)
dotenv.config({ path: new URL('../env/.env.local', import.meta.url).pathname });
console.log('[boot] SUPABASE_URL =', process.env.SUPABASE_URL);
console.log('[boot] GOOGLE_APPLICATION_CREDENTIALS =', process.env.GOOGLE_APPLICATION_CREDENTIALS || '(not set)');

// Optional Google Vision client (only if creds are present)
let visionClient;
try {
  visionClient = new ImageAnnotatorClient();
} catch (e) {
  console.warn('[boot] Google Vision client not initialized:', e.message);
}

const app = express();
const PORT = process.env.PORT || 5181;

// JSON body (for base64 uploads from frontend)
app.use(express.json({ limit: '10mb' }));

// Lightweight CORS for local development
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// --- Health ---
app.get('/health', async (req, res) => {
  try {
    const supabaseOk = !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
    const visionOk = !!process.env.GOOGLE_APPLICATION_CREDENTIALS || !!process.env.GOOGLE_VISION_JSON;
    res.json({ ok: true, supabaseConfigured: supabaseOk, googleVisionConfigured: visionOk });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
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

// POST /api/uploads  { filename, contentType, base64 }
app.post('/api/uploads', async (req, res) => {
  try {
    const { filename, contentType, base64 } = req.body || {};
    if (!filename || !base64) return res.status(400).json({ error: 'filename and base64 are required' });

    const buffer = Buffer.from(base64, 'base64');
    const key = `${Date.now()}-${filename}`;
    const bucket = 'scans';

    const { error: upErr } = await supabase.storage.from(bucket).upload(key, buffer, { contentType });
    if (upErr) {
      if (upErr.message?.toLowerCase().includes('bucket not found')) {
        // Try to create bucket once (best-effort)
        const ensured = await ensureBucketExists(bucket, { public: true });
        if (ensured?.ok) {
          const retry = await supabase.storage.from(bucket).upload(key, buffer, { contentType });
          if (retry.error) return res.status(500).json({ error: retry.error.message });
        } else {
          return res.status(500).json({ error: `Storage bucket '${bucket}' not found and could not be created. ${ensured?.error || ensured?.reason || ''}`.trim() });
        }
      } else {
        return res.status(500).json({ error: upErr.message });
      }
    }

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(key);
    const publicUrl = urlData?.publicUrl || null;

    const insert = await supabase.from('scans').insert({ image_url: publicUrl, status: 'pending' }).select();
    if (insert.error) return res.status(500).json({ error: insert.error.message });

    const scan = Array.isArray(insert.data) ? insert.data[0] : insert.data;
    res.json({ id: scan?.id || null, image_url: publicUrl });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// GET /api/scans - list recent
app.get('/api/scans', async (req, res) => {
  try {
    const q = supabase.from('scans').select('*').order('created_at', { ascending: false }).limit(100);
    const { data, error } = await q;
    if (error) return res.status(500).json({ error: error.message });
    res.json({ scans: data || [] });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// GET /api/scans/:id - single
app.get('/api/scans/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { data, error } = await supabase.from('scans').select('*').eq('id', id).maybeSingle();
    if (error) return res.status(500).json({ error: error.message });
    if (!data) return res.status(404).json({ error: 'scan not found' });
    res.json({ scan: data });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// POST /api/scans/:id/process - Vision annotate and save
app.post('/api/scans/:id/process', async (req, res) => {
  try {
    const id = req.params.id;
    const { data: scan, error: fetchErr } = await supabase.from('scans').select('*').eq('id', id).maybeSingle();
    if (fetchErr) return res.status(500).json({ error: fetchErr.message });
    if (!scan) return res.status(404).json({ error: 'scan not found' });
    if (!scan.image_url) return res.status(400).json({ error: 'scan has no image_url' });
    if (!visionClient) return res.status(500).json({ error: 'Google Vision client not configured' });

    await supabase.from('scans').update({ status: 'processing' }).eq('id', id);

    const [result] = await visionClient.annotateImage({
      image: { source: { imageUri: scan.image_url } },
      features: [
        { type: 'LABEL_DETECTION' },
        { type: 'TEXT_DETECTION' },
        { type: 'OBJECT_LOCALIZATION' }
      ]
    });

    const { error: upErr } = await supabase
      .from('scans')
      .update({ result, status: 'done', processed_at: new Date().toISOString() })
      .eq('id', id);
    if (upErr) return res.status(500).json({ error: upErr.message });

    res.json({ ok: true, result });
  } catch (e) {
    try {
      await supabase
        .from('scans')
        .update({ status: 'failed', result: { error: String(e) } })
        .eq('id', req.params.id);
    } catch {}
    return res.status(500).json({ error: String(e) });
  }
});

// --- Mount Route Modules ---
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
app.use('/api/groups', groupsRoutes);
app.use('/api/journals', journalsRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/feedback', feedbackRoutes);

// POST /api/strains/suggest - user suggests a new strain
app.post('/api/strains/suggest', express.json(), (req, res) => {
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

app.listen(PORT, () => {
  console.log(`[strainspotter] backend listening on http://localhost:${PORT}`);
});
