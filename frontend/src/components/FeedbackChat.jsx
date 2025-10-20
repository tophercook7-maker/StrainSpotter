import { useEffect, useState } from 'react';
import { Box, Card, CardContent, TextField, Button, Typography, Stack } from '@mui/material';
import { API_BASE } from '../config';

export default function FeedbackChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [posting, setPosting] = useState(false);

  const load = async () => {
    const res = await fetch(`${API_BASE}/api/feedback/messages`);
    if (res.ok) {
      setMessages(await res.json());
    }
  };

  useEffect(() => {
    load();
  }, []);

  const send = async () => {
    const content = input.trim();
    if (!content) return;
    setPosting(true);
    try {
      const res = await fetch(`${API_BASE}/api/feedback/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
      if (res.ok) {
        setInput('');
        await load();
      }
    } finally {
      setPosting(false);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Feedback</Typography>
          <Stack spacing={1} sx={{ mb: 2, maxHeight: 300, overflow: 'auto' }}>
            {messages.map(m => (
              <Box key={m.id} sx={{ p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">{new Date(m.created_at).toLocaleString()}</Typography>
                <Typography variant="body1">{m.content}</Typography>
              </Box>
            ))}
            {messages.length === 0 && (
              <Typography variant="body2" color="text.secondary">No feedback yet. Be the first!</Typography>
            )}
          </Stack>
          <Stack direction="row" spacing={1}>
            <TextField fullWidth size="small" placeholder="Type feedback..." value={input} onChange={e => setInput(e.target.value)} />
            <Button variant="contained" onClick={send} disabled={posting}>Send</Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
