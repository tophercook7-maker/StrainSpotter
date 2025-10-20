import express from 'express';

const router = express.Router();

// Simple demo dataset; replace with DB-backed listings if available
const DISPENSARIES = [
  { id: 'disp-a', name: 'Dispensary A', address: '123 Green St', city: 'San Francisco', state: 'CA', phone: '555-1234', description: 'Premium selection and friendly staff.' },
  { id: 'disp-b', name: 'Dispensary B', address: '987 Bud Ave', city: 'Los Angeles', state: 'CA', phone: '555-9876', description: 'Great deals and daily specials.' }
];

// GET /api/dispensaries?state=CA&city=San%20Francisco
router.get('/', (req, res) => {
  const { state, city } = req.query;
  let data = DISPENSARIES;
  if (state) data = data.filter(d => d.state?.toLowerCase() === String(state).toLowerCase());
  if (city) data = data.filter(d => d.city?.toLowerCase() === String(city).toLowerCase());
  res.json(data);
});

export default router;
