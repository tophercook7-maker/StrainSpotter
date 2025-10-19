import express from 'express';
const router = express.Router();

// In-memory grow logs for demo
const growlogs = [];

// Get grow logs for a user
router.get('/', (req, res) => {
  const { user_id } = req.query;
  res.json(growlogs.filter(g => g.user_id === user_id));
});

// Add a grow log
router.post('/', (req, res) => {
  const log = { ...req.body, id: Date.now().toString() };
  growlogs.push(log);
  res.json(log);
});

// Update a grow log
router.put('/:id', (req, res) => {
  const idx = growlogs.findIndex(g => g.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Log not found' });
  growlogs[idx] = { ...growlogs[idx], ...req.body };
  res.json(growlogs[idx]);
});

// Delete a grow log
router.delete('/:id', (req, res) => {
  const idx = growlogs.findIndex(g => g.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Log not found' });
  growlogs.splice(idx, 1);
  res.json({ success: true });
});

export default router;
