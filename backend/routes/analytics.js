import express from 'express';
const router = express.Router();

// Get trending strains based on views and ratings
router.get('/trending', (req, res) => {
  const { timeframe = '7d', limit = 10 } = req.query;
  // TODO: Implement actual analytics tracking
  const trending = req.app.locals.strains
    .slice(0, parseInt(limit))
    .map(s => ({ ...s, trend_score: Math.random() }))
    .sort((a, b) => b.trend_score - a.trend_score);
  
  res.json({ timeframe, trending });
});

// Get strain effectiveness statistics
router.get('/effectiveness/:condition', (req, res) => {
  const { condition } = req.params;
  const stats = req.app.locals.strains
    .filter(s => s.medical?.includes(condition.toLowerCase()))
    .map(s => ({
      name: s.name,
      effectiveness: Math.random() * 5, // TODO: Implement real user ratings
      users: Math.floor(Math.random() * 1000),
      thc: s.thc,
      cbd: s.cbd
    }))
    .sort((a, b) => b.effectiveness - a.effectiveness);

  res.json({ condition, stats });
});

// Get regional popularity data
router.get('/regional', (req, res) => {
  const { region } = req.query;
  const popularStrains = req.app.locals.strains
    .slice(0, 20)
    .map(s => ({
      name: s.name,
      popularity: Math.random(),
      local_dispensaries: Math.floor(Math.random() * 50)
    }))
    .sort((a, b) => b.popularity - a.popularity);

  res.json({ region, popularStrains });
});

export default router;