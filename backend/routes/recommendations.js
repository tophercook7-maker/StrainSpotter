import express from 'express';
const router = express.Router();

// Calculate strain similarity based on various factors
function calculateSimilarity(strain1, strain2) {
  let score = 0;
  let factors = 0;

  // Type similarity
  if (strain1.type && strain2.type) {
    if (strain1.type === strain2.type) score += 1;
    factors++;
  }

  // Effects similarity (Jaccard index)
  if (strain1.effects?.length && strain2.effects?.length) {
    const s1 = new Set(strain1.effects);
    const s2 = new Set(strain2.effects);
    const intersection = new Set([...s1].filter(x => s2.has(x)));
    const union = new Set([...s1, ...s2]);
    score += intersection.size / union.size;
    factors++;
  }

  // Flavor similarity (Jaccard index)
  if (strain1.flavors?.length && strain2.flavors?.length) {
    const s1 = new Set(strain1.flavors);
    const s2 = new Set(strain2.flavors);
    const intersection = new Set([...s1].filter(x => s2.has(x)));
    const union = new Set([...s1, ...s2]);
    score += intersection.size / union.size;
    factors++;
  }

  // THC level similarity
  if (strain1.thc != null && strain2.thc != null) {
    const thcDiff = Math.abs(strain1.thc - strain2.thc);
    score += 1 - (thcDiff / 30); // Assume max THC difference of 30%
    factors++;
  }

  // CBD level similarity
  if (strain1.cbd != null && strain2.cbd != null) {
    const cbdDiff = Math.abs(strain1.cbd - strain2.cbd);
    score += 1 - (cbdDiff / 30);
    factors++;
  }

  // Lineage similarity
  if (strain1.lineage?.length && strain2.lineage?.length) {
    const s1 = new Set(strain1.lineage);
    const s2 = new Set(strain2.lineage);
    const intersection = new Set([...s1].filter(x => s2.has(x)));
    const union = new Set([...s1, ...s2]);
    score += intersection.size / union.size;
    factors++;
  }

  return factors > 0 ? score / factors : 0;
}

// Get similar strains based on various attributes
router.get('/strains/:slug/similar', (req, res) => {
  const { limit = 5 } = req.query;
  const strain = req.app.locals.strains.find(s => s.slug === req.params.slug);
  if (!strain) return res.status(404).json({ error: 'Strain not found' });

  const similar = req.app.locals.strains
    .filter(s => s.slug !== strain.slug)
    .map(s => ({
      ...s,
      similarity: calculateSimilarity(strain, s)
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, parseInt(limit));

  res.json({
    strain: strain.name,
    similar
  });
});

// Get strain recommendations based on desired effects
router.get('/recommend', (req, res) => {
  const { effects = [], flavors = [], type, minThc, maxThc, limit = 5 } = req.query;
  const desiredEffects = Array.isArray(effects) ? effects : [effects];
  const desiredFlavors = Array.isArray(flavors) ? flavors : [flavors];

  const recommendations = req.app.locals.strains
    .filter(strain => {
      // Filter by type if specified
      if (type && strain.type?.toLowerCase() !== type.toLowerCase()) return false;
      
      // Filter by THC range if specified
      if (minThc && (!strain.thc || strain.thc < parseFloat(minThc))) return false;
      if (maxThc && (!strain.thc || strain.thc > parseFloat(maxThc))) return false;
      
      return true;
    })
    .map(strain => {
      let score = 0;
      let factors = 0;

      // Score effects match
      if (desiredEffects.length && strain.effects?.length) {
        const matches = desiredEffects.filter(e => 
          strain.effects.includes(e.toLowerCase())
        );
        score += matches.length / desiredEffects.length;
        factors++;
      }

      // Score flavors match
      if (desiredFlavors.length && strain.flavors?.length) {
        const matches = desiredFlavors.filter(f => 
          strain.flavors.includes(f.toLowerCase())
        );
        score += matches.length / desiredFlavors.length;
        factors++;
      }

      return {
        ...strain,
        score: factors > 0 ? score / factors : 0
      };
    })
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, parseInt(limit));

  res.json({
    criteria: { effects: desiredEffects, flavors: desiredFlavors, type },
    recommendations
  });
});

// Get effects combinations that work well together
router.get('/effects/combinations', (req, res) => {
  const combinations = new Map();
  
  // Analyze effect co-occurrence
  req.app.locals.strains.forEach(strain => {
    if (!strain.effects?.length) return;
    
    for (let i = 0; i < strain.effects.length; i++) {
      for (let j = i + 1; j < strain.effects.length; j++) {
        const pair = [strain.effects[i], strain.effects[j]].sort().join(':');
        combinations.set(pair, (combinations.get(pair) || 0) + 1);
      }
    }
  });

  // Convert to array and sort by frequency
  const sorted = Array.from(combinations.entries())
    .map(([pair, count]) => ({
      effects: pair.split(':'),
      count,
      strains: req.app.locals.strains
        .filter(s => s.effects?.includes(pair.split(':')[0]) && s.effects?.includes(pair.split(':')[1]))
        .map(s => s.name)
        .slice(0, 3) // Example strains
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20); // Top 20 combinations

  res.json(sorted);
});

export default router;