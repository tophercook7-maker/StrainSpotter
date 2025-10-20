import express from 'express';
import { supabase } from '../supabaseClient.js';
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase.from('growers').select('*').order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data || []);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.post('/', async (req, res) => {
  try {
    const body = req.body || {};
    const { data, error } = await supabase.from('growers').insert(body).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

export default router;
