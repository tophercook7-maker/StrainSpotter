import express from 'express';
const router = express.Router();

// Dummy data for demo
const availability = [
  { strain: 'blue-dream', region: 'CA', dispensaries: ['Dispensary A', 'Dispensary B'] },
  { strain: 'sour-diesel', region: 'NY', dispensaries: ['Dispensary C'] }
];

router.get('/', (req, res) => {
  const { region, strain } = req.query;
  let results = availability;
  if (region) results = results.filter(a => a.region === region);
  if (strain) results = results.filter(a => a.strain === strain);
  res.json(results);
});

export default router;
