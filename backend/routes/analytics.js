import express from 'express';
import { supabase } from '../supabaseClient.js';
import { supabaseAdmin } from '../supabaseAdmin.js';
import { requireAdmin, getAuthContext } from '../utils/accessControl.js';

const router = express.Router();
const analyticsClient = supabaseAdmin ?? supabase;

async function maybeGetUserId(req) {
  if (!req.headers.authorization) return null;
  try {
    const context = await getAuthContext(req);
    return context?.user?.id || null;
  } catch {
    return null;
  }
}

const ENABLE_ANALYTICS = false;

router.post('/events', async (req, res) => {
  if (!ENABLE_ANALYTICS) {
    return res.json({ ok: true });
  }
  
  try {
    const { event_name, context: rawContext = {}, session_id = null, platform = null } = req.body || {};
    if (!event_name) {
      return res.status(400).json({ error: 'event_name is required' });
    }
    const userId = await maybeGetUserId(req);
    const context = typeof rawContext === 'object' && rawContext !== null ? rawContext : { value: rawContext };
    const payload = {
      event_name,
      user_id: userId,
      session_id,
      platform: platform || req.headers['x-platform'] || null,
      context
    };
    const { error } = await analyticsClient.from('analytics_events').insert(payload);
    if (error) {
      console.error('[analytics] Failed to log event:', error);
      return res.status(500).json({ error: 'Failed to record event' });
    }
    res.json({ ok: true });
  } catch (e) {
    console.error('[analytics] Event logging error:', e);
    res.status(500).json({ error: 'Unexpected analytics error' });
  }
});

router.get('/events/recent', requireAdmin, async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 50;
    const { data, error } = await analyticsClient
      .from('analytics_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ events: data || [] });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.get('/events/summary', requireAdmin, async (req, res) => {
  try {
    const days = Number(req.query.days) || 7;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await analyticsClient
      .from('analytics_events')
      .select('event_name, created_at, context')
      .gte('created_at', since);
    if (error) return res.status(500).json({ error: error.message });

    const totals = {};
    const perDay = {};
    const topStrains = {};
    let scanStarted = 0;
    let scanCompleted = 0;
    let scanFailed = 0;

    (data || []).forEach((event) => {
      const dayKey = event.created_at?.slice(0, 10);
      totals[event.event_name] = (totals[event.event_name] || 0) + 1;
      if (dayKey) {
        perDay[dayKey] = perDay[dayKey] || {};
        perDay[dayKey][event.event_name] = (perDay[dayKey][event.event_name] || 0) + 1;
      }

      const ctx = event.context || {};
      if (event.event_name === 'scan_started') scanStarted += 1;
      if (event.event_name === 'scan_completed') {
        scanCompleted += 1;
        if (ctx.match_slug) {
          topStrains[ctx.match_slug] = {
            count: (topStrains[ctx.match_slug]?.count || 0) + 1,
            name: ctx.match_name || ctx.match_slug
          };
        }
      }
      if (event.event_name === 'scan_failed') scanFailed += 1;
    });

    const successRate = scanStarted > 0 ? (scanCompleted / scanStarted) * 100 : null;

    const topStrainList = Object.entries(topStrains)
      .map(([slug, info]) => ({ slug, name: info.name, count: info.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    res.json({
      totals,
      perDay,
      scanStats: {
        started: scanStarted,
        completed: scanCompleted,
        failed: scanFailed,
        successRate
      },
      topStrains: topStrainList
    });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// Placeholder routes for legacy dashboards (still used in some admin cards)
router.get('/trending', (req, res) => {
  const { timeframe = '7d', limit = 10 } = req.query;
  res.json({ timeframe, trending: [], limit: Number(limit) });
});

router.get('/effectiveness/:condition', (req, res) => {
  res.json({ condition: req.params.condition, stats: [] });
});

router.get('/regional', (req, res) => {
  res.json({ region: req.query.region, popularStrains: [] });
});

export default router;