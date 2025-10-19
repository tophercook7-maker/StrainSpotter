import express from 'express';
const router = express.Router();

// Compare strains by IDs
router.get('/', (req, res) => {
  const { ids } = req.query;
  if (!ids) return res.status(400).json({ error: 'No strain IDs provided' });
  const idArr = Array.isArray(ids) ? ids : ids.split(',');
  const strains = req.app.locals.strains.filter(s => idArr.includes(s.slug) || idArr.includes(s._id));
  if (strains.length < 2) return res.status(404).json({ error: 'Not enough strains found' });
  // Compare effects, flavors, lineage, THC/CBD, reviews
  const comparison = strains.map(s => ({
    name: s.name,
    slug: s.slug,
    effects: s.effects,
    flavors: s.flavors,
    lineage: s.lineage,
    thc: s.thc,
    cbd: s.cbd,
    reviews: s.reviews || [],
    rating: s.rating || null
  }));
  res.json({ comparison });
});

export default router;
