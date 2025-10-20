import express from 'express';
import { supabase } from '../supabaseClient.js';
import { supabaseAdmin } from '../supabaseAdmin.js';
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const client = supabaseAdmin ?? supabase;
    const { data, error } = await client.from('growers').select('*').order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data || []);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.post('/', async (req, res) => {
  try {
    const body = req.body || {};
    const client = supabaseAdmin ?? supabase;
    const { data, error } = await client.from('growers').insert(body).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// Alias endpoint expected by frontend
router.post('/register', async (req, res) => {
  try {
    const body = req.body || {};
    // Only include columns that exist in the growers table schema
    const payload = {
      user_id: null,
      location: body.location || null,
      specialties: Array.isArray(body.specialties) ? body.specialties : [],
      available_strains: Array.isArray(body.available_strains) ? body.available_strains : null,
      seed_sources: body.seed_sources ?? null,
      reputation: body.reputation ?? null,
      badges: Array.isArray(body.badges) ? body.badges : null
    };
    const client = supabaseAdmin ?? supabase;
    const { data, error } = await client.from('growers').insert(payload).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

export default router;
