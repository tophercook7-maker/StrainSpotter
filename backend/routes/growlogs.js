import express from 'express';
import { supabase } from '../supabaseClient.js';
const router = express.Router();

// Get grow logs for a user
router.get('/', async (req, res) => {
  try {
    const { user_id } = req.query;
    if (!user_id) return res.status(400).json({ error: 'user_id is required' });
    const { data, error } = await supabase
      .from('grow_logs')
      .select('*')
      .eq('user_id', user_id)
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
    const payload = { ...req.body };
    const { data, error } = await supabase.from('grow_logs').insert(payload).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// Update a grow log
router.put('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('grow_logs')
      .update(req.body)
      .eq('id', req.params.id)
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
    const { error } = await supabase.from('grow_logs').delete().eq('id', req.params.id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

export default router;
