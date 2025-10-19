import express from 'express';
const router = express.Router();

// Dummy legal info for demo
const legal = [
  { region: 'CA', recreational: true, medical: true, notes: '21+ for rec, 18+ for med' },
  { region: 'NY', recreational: true, medical: true, notes: '21+ for rec, 18+ for med' },
  { region: 'TX', recreational: false, medical: false, notes: 'Illegal' }
];

router.get('/', (req, res) => {
  const { region } = req.query;
  if (!region) return res.json(legal);
  const info = legal.find(l => l.region === region);
  if (!info) return res.status(404).json({ error: 'Region not found' });
  res.json(info);
});

export default router;
