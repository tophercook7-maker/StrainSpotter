import express from 'express';
const router = express.Router();

// In-memory notes store for demo
const notes = [];

// Get notes for a user
router.get('/', (req, res) => {
  const { user_id } = req.query;
  res.json(notes.filter(n => n.user_id === user_id));
});

// Add a note
router.post('/', (req, res) => {
  const note = { ...req.body, id: Date.now().toString() };
  notes.push(note);
  res.json(note);
});

// Update a note
router.put('/:id', (req, res) => {
  const idx = notes.findIndex(n => n.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Note not found' });
  notes[idx] = { ...notes[idx], ...req.body };
  res.json(notes[idx]);
});

// Delete a note
router.delete('/:id', (req, res) => {
  const idx = notes.findIndex(n => n.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Note not found' });
  notes.splice(idx, 1);
  res.json({ success: true });
});

export default router;
