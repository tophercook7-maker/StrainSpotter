import { useState } from 'react';
import { Modal, Box, Typography, TextField, Button, Stack, Avatar, Card, CardContent } from '@mui/material';
import { API_BASE } from '../config';

export default function FeedbackModal({ open, onClose, user }) {
  const [input, setInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    if (!input.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/feedback/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: input, user_id: user?.id || null })
      });
      if (res.ok) {
        setSuccess(true);
        setInput('');
      } else {
        setError('Failed to send feedback.');
      }
    } catch {
      setError('Network error.');
    }
    setSubmitting(false);
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 380,
        bgcolor: 'rgba(255,255,255,0.15)',
        backdropFilter: 'blur(12px)',
        border: '2px solid #4caf50',
        boxShadow: 24,
        p: 4,
        borderRadius: 3
      }}>
        <Typography variant="h6" sx={{ mb: 2, color: 'black', fontWeight: 700 }}>Send Feedback</Typography>
        <TextField
          multiline
          minRows={3}
          maxRows={6}
          fullWidth
          placeholder="Share your thoughts, suggestions, or issues..."
          value={input}
          onChange={e => setInput(e.target.value)}
          sx={{ mb: 2, background: 'rgba(255,255,255,0.10)', borderRadius: 2, input: { color: 'black' } }}
        />
        {error && <Typography color="error" sx={{ mb: 1 }}>{error}</Typography>}
        {success && <Typography color="success.main" sx={{ mb: 1 }}>Thank you for your feedback!</Typography>}
        <Stack direction="row" spacing={2}>
          <Button variant="contained" onClick={handleSubmit} disabled={submitting || !input.trim()} sx={{ fontWeight: 700, background: '#4caf50', color: 'black' }}>
            {submitting ? 'Sending…' : 'Send'}
          </Button>
          <Button variant="outlined" onClick={onClose} sx={{ fontWeight: 700, color: 'black', borderColor: '#4caf50' }}>Cancel</Button>
        </Stack>
      </Box>
    </Modal>
  );
}
