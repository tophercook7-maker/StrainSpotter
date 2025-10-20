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

// GET /api/seeds
router.get('/', (req, res) => {
  const seeds = loadSeedsFromSample();
  res.json(seeds);
});

export default router;
