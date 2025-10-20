import express from 'express';
import { supabase } from '../supabaseClient.js';
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase.from('groups').select('*').order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data || []);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.post('/', async (req, res) => {
  try {
    const payload = { name: req.body?.name || 'New Group', created_by: req.body?.user_id || null };
    const { data, error } = await supabase.from('groups').insert(payload).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.get('/:id/messages', async (req, res) => {
  try {
    const { data, error } = await supabase.from('messages').select('*').eq('group_id', req.params.id).order('created_at', { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data || []);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.post('/:id/messages', async (req, res) => {
  try {
    const payload = { group_id: req.params.id, user_id: req.body?.user_id || null, content: req.body?.content || '' };
    const { data, error } = await supabase.from('messages').insert(payload).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

export default router;
