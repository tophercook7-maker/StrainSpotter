import express from 'express';
import { supabase } from '../supabaseClient.js';
import { supabaseAdmin } from '../supabaseAdmin.js';

const router = express.Router();

// Use service role for writes, anon for reads
const readClient = supabase;
const writeClient = supabaseAdmin ?? supabase;

router.get('/', async (req, res) => {
  try {
    const { data, error } = await readClient.from('groups').select('*').order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data || []);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.post('/', async (req, res) => {
  try {
    const payload = { name: req.body?.name || 'New Group', created_by: req.body?.user_id || null };
    const { data, error } = await writeClient.from('groups').insert(payload).select().single();
    if (error) {
      const hint = (!supabaseAdmin && /row-level security/i.test(error.message))
        ? 'RLS blocked group creation. Service role key may be needed.'
        : null;
      return res.status(500).json({ error: error.message, hint });
    }
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.get('/:id/messages', async (req, res) => {
  try {
    const { data, error } = await readClient.from('messages').select('*').eq('group_id', req.params.id).order('created_at', { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data || []);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.post('/:id/messages', async (req, res) => {
  try {
    const payload = { group_id: req.params.id, user_id: req.body?.user_id || null, content: req.body?.content || '' };
    const { data, error } = await writeClient.from('messages').insert(payload).select().single();
    if (error) {
      const hint = (!supabaseAdmin && /row-level security/i.test(error.message))
        ? 'RLS blocked message creation. Service role key may be needed.'
        : null;
      return res.status(500).json({ error: error.message, hint });
    }
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// POST /:id/join - Join a group
router.post('/:id/join', async (req, res) => {
  try {
    const { user_id } = req.body;
    if (!user_id) return res.status(400).json({ error: 'user_id required' });

    const payload = { group_id: req.params.id, user_id };
    const { data, error } = await writeClient.from('group_members').insert(payload).select().single();
    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ error: 'Already a member' });
      }
      return res.status(500).json({ error: error.message });
    }
    res.json({ success: true, member: data });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// POST /:id/leave - Leave a group
router.post('/:id/leave', async (req, res) => {
  try {
    const { user_id } = req.body;
    if (!user_id) return res.status(400).json({ error: 'user_id required' });

    const { error } = await writeClient
      .from('group_members')
      .delete()
      .eq('group_id', req.params.id)
      .eq('user_id', user_id);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// GET /:id/members - List group members
router.get('/:id/members', async (req, res) => {
  try {
    const { data, error } = await readClient
      .from('group_members')
      .select(`
        user_id,
        joined_at,
        users(id, username, avatar_url)
      `)
      .eq('group_id', req.params.id);

    if (error) return res.status(500).json({ error: error.message });
    res.json(data || []);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

export default router;
