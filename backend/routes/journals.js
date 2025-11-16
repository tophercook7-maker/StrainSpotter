import express from 'express';
import { getUserScopedClient } from '../utils/rlsMode.js';
import { requireAuthenticated } from '../utils/accessControl.js';

const router = express.Router();

router.use(requireAuthenticated);

router.get('/', async (req, res) => {
  try {
    const requesterId = req.authContext?.user?.id;
    const targetUserId = req.query.user_id || requesterId;
    if (!targetUserId) {
      return res.status(400).json({ error: 'user_id required' });
    }
    const client = getUserScopedClient();
    const { data, error } = await client
      .from('journals')
      .select('*')
      .eq('user_id', targetUserId)
      .order('entry_date', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data || []);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.post('/', async (req, res) => {
  try {
    const userId = req.authContext?.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const payload = {
      user_id: userId,
      strain_slug: req.body?.strain_slug || null,
      strain_name: req.body?.strain_name || null,
      entry_date: req.body?.entry_date || new Date().toISOString().slice(0, 10),
      rating: req.body?.rating ?? null,
      notes: req.body?.notes || null,
      method: req.body?.method || null,
      dosage: req.body?.dosage || null,
      time_of_day: req.body?.time_of_day || null,
      tags: Array.isArray(req.body?.tags)
        ? req.body.tags
        : typeof req.body?.tags === 'string'
          ? req.body.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
          : [],
      scan_id: req.body?.scan_id || null,
      content: req.body?.content || null,
      is_public: !!req.body?.is_public
    };
    const client = getUserScopedClient();
    const { data, error } = await client.from('journals').insert(payload).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

export default router;
