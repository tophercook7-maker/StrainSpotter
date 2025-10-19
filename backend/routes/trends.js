import express from 'express';
const router = express.Router();

// Dummy trending data for demo
router.get('/', (req, res) => {
  const { type = 'strains', limit = 10 } = req.query;
  if (type === 'strains') {
    const trending = req.app.locals.strains
      .slice(0, parseInt(limit))
      .map(s => ({ name: s.name, slug: s.slug, trend_score: Math.random() }))
      .sort((a, b) => b.trend_score - a.trend_score);
    return res.json({ trending });
  }
  if (type === 'effects') {
    // Aggregate effect popularity
    const effectCounts = {};
    req.app.locals.strains.forEach(s => {
      (s.effects || []).forEach(e => {
        effectCounts[e] = (effectCounts[e] || 0) + 1;
      });
    });
    const trending = Object.entries(effectCounts)
      .map(([effect, count]) => ({ effect, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, parseInt(limit));
    return res.json({ trending });
  }
  res.status(400).json({ error: 'Invalid type' });
});

export default router;
