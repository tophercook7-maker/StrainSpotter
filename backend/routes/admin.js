import express from 'express';
import { supabase } from '../supabaseClient.js';
import { supabaseAdmin } from '../supabaseAdmin.js';
const router = express.Router();

let maintenance = false;
let settings = {
  effectsWeight: 0.3,
  thcWeight: 0.2,
  flavorWeight: 0.2,
  typeWeight: 0.3,
  maintenanceMode: false,
  impersonateUser: ''
};

// Maintenance mode toggle
router.post('/maintenance', (req, res) => {
  maintenance = !!req.body.maintenance;
  settings.maintenanceMode = maintenance;
  res.json({ maintenance });
});

// Get/set settings
router.post('/settings', (req, res) => {
  settings = { ...settings, ...req.body };
  res.json(settings);
});

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), memory: process.memoryUsage() });
});

// Report service-role availability and scans RLS behavior
router.get('/rls-status', async (req, res) => {
  try {
    const hasServiceRole = !!supabaseAdmin;
    let anonInsertAllowed = false;
    let anonError = null;
    try {
      const { error: anonErr } = await supabase.from('scans').insert({ image_url: 'about:blank', status: 'pending' }).select().limit(1);
      anonInsertAllowed = !anonErr;
      anonError = anonErr?.message || null;
    } catch (e) {
      anonError = String(e);
    }
    res.json({ ok: true, hasServiceRole, anonInsertAllowed, anonError });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

// Dev-only endpoint to relax RLS for scans (enable anon insert). DO NOT use in prod.
router.post('/rls-relax-dev', async (req, res) => {
  try {
    if (!supabaseAdmin) return res.status(400).json({ ok: false, error: 'Service role not configured' });
    // Use PostgREST RPC if available; fallback not implemented here.
    // Prefer manual SQL in Supabase if this endpoint is unavailable.
    res.status(501).json({ ok: false, error: 'Not implemented via API. Run SQL in Supabase: CREATE POLICY scans_insert_dev ON public.scans FOR INSERT TO anon WITH CHECK (true);' });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

// Refresh/reindex data
router.post('/refresh', (req, res) => {
  // TODO: Implement real refresh
  res.json({ refreshed: true, time: new Date() });
});

// Logs (dummy)
router.get('/logs', (req, res) => {
  res.type('text').send('No logs yet. (Demo)');
});

export default router;
