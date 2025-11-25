// backend/routes/strain-images.js
// API endpoint to get strain images by canonical name

import express from 'express';
import { supabaseAdmin } from '../supabaseAdmin.js';

const router = express.Router();

/**
 * GET /api/strain-images?canonicalName=SCOTT'S OG
 * Returns the best image URL for a given canonical strain name
 */
router.get('/', async (req, res) => {
  const canonicalName = req.query.canonicalName;

  if (!canonicalName || typeof canonicalName !== 'string') {
    return res.status(400).json({ error: 'canonicalName query parameter is required' });
  }

  try {
    // Normalize to uppercase for consistent matching
    const normalizedName = canonicalName.toUpperCase().trim();

    const { data, error } = await supabaseAdmin
      .from('strain_images')
      .select('image_url, source, seed_bank_name')
      .eq('canonical_name', normalizedName)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('[strain-images] supabase error', error.message);
      return res.status(500).json({ error: 'internal_error', message: error.message });
    }

    if (!data || !data.image_url) {
      return res.json({ imageUrl: null, canonicalName: normalizedName });
    }

    return res.json({ 
      imageUrl: data.image_url,
      source: data.source,
      seedBankName: data.seed_bank_name,
      canonicalName: normalizedName
    });
  } catch (err) {
    console.error('[strain-images] unexpected error', err);
    return res.status(500).json({ error: 'internal_error', message: err.message });
  }
});

/**
 * GET /api/strain-images/batch?canonicalNames=SCOTT'S OG,COMMERCE CITY KUSH
 * Returns images for multiple canonical names
 */
router.get('/batch', async (req, res) => {
  const canonicalNamesParam = req.query.canonicalNames;

  if (!canonicalNamesParam || typeof canonicalNamesParam !== 'string') {
    return res.status(400).json({ error: 'canonicalNames query parameter is required (comma-separated)' });
  }

  try {
    // Parse comma-separated list and normalize
    const canonicalNames = canonicalNamesParam
      .split(',')
      .map(name => name.trim().toUpperCase())
      .filter(name => name.length > 0);

    if (canonicalNames.length === 0) {
      return res.status(400).json({ error: 'No valid canonical names provided' });
    }

    const { data, error } = await supabaseAdmin
      .from('strain_images')
      .select('canonical_name, image_url, source, seed_bank_name')
      .in('canonical_name', canonicalNames);

    if (error) {
      console.error('[strain-images] supabase error', error.message);
      return res.status(500).json({ error: 'internal_error', message: error.message });
    }

    // Build a map for easy lookup
    const imageMap = {};
    (data || []).forEach(item => {
      imageMap[item.canonical_name] = {
        imageUrl: item.image_url,
        source: item.source,
        seedBankName: item.seed_bank_name
      };
    });

    // Return results for all requested names (null if not found)
    const results = {};
    canonicalNames.forEach(name => {
      results[name] = imageMap[name] || { imageUrl: null };
    });

    return res.json({ images: results });
  } catch (err) {
    console.error('[strain-images] unexpected error', err);
    return res.status(500).json({ error: 'internal_error', message: err.message });
  }
});

export default router;

