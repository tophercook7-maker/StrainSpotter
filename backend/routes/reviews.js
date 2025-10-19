import express from 'express';
const router = express.Router();

// In-memory reviews store for demo
const reviews = [];

// Get reviews for a strain
router.get('/', (req, res) => {
  const { strain_id } = req.query;
  res.json(reviews.filter(r => r.strain_id === strain_id));
});

// Add a review
router.post('/', (req, res) => {
  const review = { ...req.body, id: Date.now().toString() };
  reviews.push(review);
  res.json(review);
});

// Update a review
router.put('/:id', (req, res) => {
  const idx = reviews.findIndex(r => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Review not found' });
  reviews[idx] = { ...reviews[idx], ...req.body };
  res.json(reviews[idx]);
});

// Delete a review
router.delete('/:id', (req, res) => {
  const idx = reviews.findIndex(r => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Review not found' });
  reviews.splice(idx, 1);
  res.json({ success: true });
});

export default router;
