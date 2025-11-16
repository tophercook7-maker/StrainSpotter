import express from 'express';
import { supabase } from '../supabaseClient.js';
import { supabaseAdmin } from '../supabaseAdmin.js';
import { requireAdmin, getAuthContext } from '../utils/accessControl.js';

const router = express.Router();
const db = supabaseAdmin ?? supabase;

router.get('/recent', requireAdmin, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const { data, error } = await db
      .from('admin_errors')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ errors: data || [] });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.post('/client', async (req, res) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database unavailable' });
    const context = await getAuthContext(req);
    const actorId = context.user?.id || null;
    const { message, stack, location, userAgent, currentView, platform } = req.body || {};

    await db
      .from('admin_errors')
      .insert({
        user_id: actorId,
        path: currentView || location || 'client',
        method: 'CLIENT',
        status_code: null,
        message: message || 'Client error',
        stack: stack || null,
        context: {
          client: {
            location,
            currentView,
            userAgent,
            platform,
            message
          }
        }
      });

    res.json({ ok: true });
  } catch (e) {
    console.warn('[admin-errors] Failed to log client error:', e);
    res.status(500).json({ error: String(e) });
  }
});

export default router;


