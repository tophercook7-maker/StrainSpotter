import express from 'express';
import { supabase } from '../supabaseClient.js';
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { user_id } = req.query;
    let q = supabase.from('journals').select('*').order('created_at', { ascending: false });
    if (user_id) q = q.eq('user_id', user_id);
    const { data, error } = await q;
    if (error) return res.status(500).json({ error: error.message });
    res.json(data || []);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.post('/', async (req, res) => {
  try {
    const payload = { ...req.body };
    const { data, error } = await supabase.from('journals').insert(payload).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

export default router;
