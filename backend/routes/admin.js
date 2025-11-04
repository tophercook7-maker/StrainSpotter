import express from 'express';
import { supabase } from '../supabaseClient.js';
import { supabaseAdmin } from '../supabaseAdmin.js';
import { requireAdmin, optionalAdmin } from '../middleware/adminAuth.js';

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

// Maintenance mode toggle (admin only)
router.post('/maintenance', requireAdmin, (req, res) => {
  maintenance = !!req.body.maintenance;
  settings.maintenanceMode = maintenance;
  console.log(`[admin] Maintenance mode set to ${maintenance} by ${req.user.email}`);
  res.json({ maintenance });
});

// Get/set settings (admin only)
router.post('/settings', requireAdmin, (req, res) => {
  settings = { ...settings, ...req.body };
  console.log(`[admin] Settings updated by ${req.user.email}`);
  res.json(settings);
});

// Health check (allow in dev, protect in production)
const healthMiddleware = process.env.NODE_ENV === 'production' ? requireAdmin : optionalAdmin;
router.get('/health', healthMiddleware, (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    admin: req.isAdmin || false
  });
});

// Report service-role availability and scans RLS behavior (allow in dev, protect in production)
const rlsMiddleware = process.env.NODE_ENV === 'production' ? requireAdmin : optionalAdmin;
router.get('/rls-status', rlsMiddleware, async (req, res) => {
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
router.post('/rls-relax-dev', requireAdmin, async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ ok: false, error: 'Not available in production' });
    }
    if (!supabaseAdmin) return res.status(400).json({ ok: false, error: 'Service role not configured' });
    // Use PostgREST RPC if available; fallback not implemented here.
    // Prefer manual SQL in Supabase if this endpoint is unavailable.
    console.log(`[admin] RLS relax requested by ${req.user.email}`);
    res.status(501).json({ ok: false, error: 'Not implemented via API. Run SQL in Supabase: CREATE POLICY scans_insert_dev ON public.scans FOR INSERT TO anon WITH CHECK (true);' });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

// Refresh/reindex data (admin only)
router.post('/refresh', requireAdmin, (req, res) => {
  // TODO: Implement real refresh
  console.log(`[admin] Refresh requested by ${req.user.email}`);
  res.json({ refreshed: true, time: new Date() });
});

// Logs (admin only)
router.get('/logs', requireAdmin, (req, res) => {
  res.type('text').send('No logs yet. (Demo)');
});

export default router;
