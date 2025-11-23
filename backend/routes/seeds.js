import express from 'express';
import fs from 'fs';

const router = express.Router();

function loadSeedsFromSample() {
  try {
    const p = new URL('../strains/strains-sample.json', import.meta.url).pathname;
    const arr = JSON.parse(fs.readFileSync(p, 'utf8'));
    const seeds = [];
    for (const s of arr) {
      const vendors = s.seed_vendors || [];
      for (const v of vendors) {
        seeds.push({
          id: `${s.name}-${v.name}`.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          name: `${s.name} — Seeds`,
          breeder: v.name,
          type: s.type || null,
          thc: s.thc ?? null,
          cbd: s.cbd ?? null,
          description: s.description || null,
          url: v.url || null
        });
      }
    }
    return seeds;
  } catch {
    return [];
  }
}

// GET /api/seeds?strain_slug=blue-dream&lat=37.7749&lng=-122.4194&radius=50
router.get('/', (req, res) => {
  try {
    const { strain_slug, lat, lng, radius } = req.query;
    let seeds = loadSeedsFromSample();
    
    // Filter by strain slug if provided
    if (strain_slug) {
      const slugNorm = String(strain_slug).toLowerCase().replace(/[^a-z0-9]+/g, '-');
      seeds = seeds.filter(s => s.id.startsWith(slugNorm));
    }
    
    // Optional: if vendors have lat/lng, filter by proximity (future enhancement)
    // For now, no seed vendors have coordinates in the sample data
    
    // Always return array, never crash
    res.json(Array.isArray(seeds) ? seeds : []);
  } catch (error) {
    console.error('[seeds] Error loading seeds:', error);
    // Never 500 - return empty array instead
    res.status(200).json([]);
  }
});

export default router;
