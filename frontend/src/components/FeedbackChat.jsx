import { useEffect, useState } from 'react';
import { Box, Card, CardContent, TextField, Button, Typography, Stack } from '@mui/material';
import { API_BASE } from '../config';

export default function FeedbackChat({ onBack }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [posting, setPosting] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const load = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/feedback/messages`);
      if (res.ok) {
        setMessages(await res.json());
      }
    } catch (e) {
      console.error('[Feedback] Load error:', e);
    }
  };

  const sendTestEmail = async () => {
    setTestingEmail(true);
    setTestResult(null);
    try {
      const res = await fetch(`${API_BASE}/diagnostic/email-test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: 'strainspotter25feedback@gmail.com' })
      });
      const data = await res.json();
      setTestResult(data.ok ? 'Email sent!' : `Error: ${data.error || 'Unknown'}`);
    } catch {
      setTestResult('Network error');
    }
    setTestingEmail(false);
  };

  useEffect(() => {
    load();
  }, []);

  const send = async () => {
    const content = input.trim();
    if (!content) return;
    setPosting(true);
    try {
      console.log('[Feedback] Sending to:', `${API_BASE}/api/feedback/messages`);
      const res = await fetch(`${API_BASE}/api/feedback/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
        },
        body: JSON.stringify({ content, user_id: null })
      });
      if (res.ok) {
        setInput('');
        await load();
      } else {
        const errText = await res.text();
        console.error('[Feedback] Send failed:', errText);
        alert('Failed to send feedback. Please try again.');
      }
    } catch (e) {
      console.error('[Feedback] Error:', e);
      alert('Network error sending feedback.');
    } finally {
      setPosting(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      {onBack && (
        <Button
          onClick={onBack}
          size="small"
          variant="contained"
          sx={{
            bgcolor: 'white',
            color: 'black',
            textTransform: 'none',
            fontWeight: 700,
            borderRadius: 999,
            mb: 2,
            '&:hover': { bgcolor: 'grey.100' }
          }}
        >
          Home
        </Button>
      )}
      <Card sx={{
        bgcolor: 'rgba(255,255,255,0.7)',
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        backdropFilter: 'blur(12px)',
        borderRadius: 4,
        border: '1px solid rgba(255,255,255,0.18)'
      }}>
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
            <TextField
              fullWidth
              size="small"
              placeholder="Type feedback... (press Enter to send)"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <Button
              variant="outlined"
              size="small"
              onClick={sendTestEmail}
              disabled={testingEmail}
              sx={{ textTransform: 'none' }}
            >
              {testingEmail ? 'Sending...' : 'Send Test Email'}
            </Button>
            <Button variant="contained" onClick={send} disabled={posting}>Send</Button>
          </Stack>
          {testResult && (
            <Box sx={{ px: 2, pb: 1 }}>
              <Typography variant="body2" color={testResult === 'Email sent!' ? 'success.main' : 'error.main'}>
                {testResult}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
