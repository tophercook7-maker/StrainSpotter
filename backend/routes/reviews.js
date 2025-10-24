import express from 'express';
import { supabase } from '../supabaseClient.js';
import { supabaseAdmin } from '../supabaseAdmin.js';

const router = express.Router();
const readClient = supabase;
const writeClient = supabaseAdmin ?? supabase;

// GET /api/reviews?strain_slug=blue-dream
router.get('/', async (req, res) => {
  try {
    const { strain_slug } = req.query;
    if (!strain_slug) return res.json([]);
    const { data, error } = await readClient
      .from('reviews')
      .select('id, user_id, strain_slug, rating, comment, created_at, users(id, username, avatar_url)')
      .eq('strain_slug', strain_slug)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) {
      // Graceful fallback if the reviews table hasn't been created yet
      // Postgres undefined_table error code is 42P01
      const msg = error.message || '';
      if (error.code === '42P01' || /relation .*reviews.* does not exist/i.test(msg)) {
        return res.json([]);
      }
      return res.status(500).json({ error: error.message });
    }
    res.json(data || []);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// POST /api/reviews { user_id, strain_slug, rating (1-5), comment }
router.post('/', async (req, res) => {
  try {
    const { user_id, strain_slug, rating, comment } = req.body || {};
    if (!user_id) return res.status(400).json({ error: 'user_id required' });
    if (!strain_slug) return res.status(400).json({ error: 'strain_slug required' });
    const r = parseInt(rating, 10);
    if (!(r >= 1 && r <= 5)) return res.status(400).json({ error: 'rating must be 1-5' });

    // Validate user exists
    const { data: user, error: userErr } = await writeClient.from('users').select('id').eq('id', user_id).single();
  if (userErr || !user) return res.status(400).json({ error: 'Invalid user_id' });

    // Optional: prevent review spam (1 per user per strain)
    const { data: existing } = await readClient
      .from('reviews')
      .select('id')
      .eq('user_id', user_id)
      .eq('strain_slug', strain_slug)
      .maybeSingle();

    let inserted;
    if (existing) {
      const { data, error } = await writeClient
        .from('reviews')
        .update({ rating: r, comment })
        .eq('id', existing.id)
        .select()
        .single();
      if (error) {
        const msg = error.message || '';
        if (error.code === '42P01' || /relation .*reviews.* does not exist/i.test(msg)) {
          return res.status(500).json({ 
            error: 'reviews table not found',
            hint: 'Run backend/migrations/2025_10_22_create_reviews_table.sql in Supabase SQL editor.'
          });
        }
        return res.status(500).json({ error: error.message });
      }
      inserted = data;
    } else {
      const { data, error } = await writeClient
        .from('reviews')
        .insert({ user_id, strain_slug, rating: r, comment })
        .select()
        .single();
      if (error) {
        const msg = error.message || '';
        if (error.code === '42P01' || /relation .*reviews.* does not exist/i.test(msg)) {
          return res.status(500).json({ 
            error: 'reviews table not found',
            hint: 'Run backend/migrations/2025_10_22_create_reviews_table.sql in Supabase SQL editor.'
          });
        }
        return res.status(500).json({ error: error.message });
      }
      inserted = data;
    }

    res.json(inserted);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

export default router;
