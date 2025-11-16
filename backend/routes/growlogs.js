import express from 'express';
import { requireAuthenticated } from '../utils/accessControl.js';
import { getUserScopedClient } from '../utils/rlsMode.js';

const router = express.Router();

router.use(requireAuthenticated);

const isAdmin = (profile) => (profile?.role || '').toLowerCase() === 'admin';

// Get grow logs for a user
router.get('/', async (req, res) => {
  try {
    const requester = req.authContext;
    const targetUserId = isAdmin(requester.profile) && req.query.user_id
      ? req.query.user_id
      : requester.user.id;

    const client = getUserScopedClient();
    const { data, error } = await client
      .from('grow_logs')
      .select('*')
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data || []);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// Add a grow log
router.post('/', async (req, res) => {
  try {
    const requester = req.authContext;
    const payload = {
      ...req.body,
      user_id: requester.user.id
    };
    const client = getUserScopedClient();
    const { data, error } = await client.from('grow_logs').insert(payload).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// Update a grow log
router.put('/:id', async (req, res) => {
  try {
    const requester = req.authContext;
    const client = getUserScopedClient();
    const { data, error } = await client
      .from('grow_logs')
      .update(req.body)
      .eq('id', req.params.id)
      .eq('user_id', requester.user.id)
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    if (!data) return res.status(404).json({ error: 'Log not found' });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// Delete a grow log
router.delete('/:id', async (req, res) => {
  try {
    const requester = req.authContext;
    const client = getUserScopedClient();
    const { error } = await client
      .from('grow_logs')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', requester.user.id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

export default router;
