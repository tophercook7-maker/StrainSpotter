import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  Stack,
  Chip,
  Divider
} from '@mui/material';
import { API_BASE } from '../config';
import { supabase } from '../supabaseClient';

export default function ErrorViewer({ onBack }) {
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const loadErrors = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setMessage('Sign in as an admin to view recent errors.');
        setErrors([]);
        return;
      }
      const resp = await fetch(`${API_BASE}/api/admin/errors/recent?limit=100`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (!resp.ok) {
        const text = await resp.text();
        setMessage(text || 'Failed to load errors');
        setErrors([]);
        return;
      }
      const data = await resp.json();
      setErrors(data.errors || []);
      setMessage(data.message || '');
    } catch (e) {
      setMessage(`Connection error: ${e.message}`);
      setErrors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadErrors();
  }, []);

  const getStatusColor = (status) => {
    if (status >= 500) return 'error';
    if (status >= 400) return 'warning';
    return 'default';
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {onBack && (
        <Button onClick={onBack} size="small" variant="contained" sx={{ bgcolor: 'white', color: 'black', textTransform: 'none', fontWeight: 700, borderRadius: 999, mb: 1, '&:hover': { bgcolor: 'grey.100' } }}>Home</Button>
      )}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          🚨 Error Logs
        </Typography>
        <Button variant="contained" onClick={loadErrors} disabled={loading}>
          Refresh
        </Button>
      </Stack>

      {message && (
        <Alert severity="info" sx={{ mb: 3 }}>
          {message}
        </Alert>
      )}

      {loading ? (
        <Typography>Loading...</Typography>
      ) : errors.length === 0 ? (
        <Alert severity="success">
          ✅ No recent errors! Everything is running smoothly.
        </Alert>
      ) : (
        <Stack spacing={2}>
          {errors.map((err, idx) => (
            <Card 
              key={idx}
              sx={{ 
                bgcolor: (err.status_code || 0) >= 500 ? 'rgba(211, 47, 47, 0.05)' : 'rgba(255, 152, 0, 0.05)',
                border: `1px solid ${(err.status_code || 0) >= 500 ? '#d32f2f44' : '#ff980044'}`
              }}
            >
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                  <Chip 
                    label={`${err.status_code ?? 'n/a'}`} 
                    color={getStatusColor(err.status_code ?? 0)} 
                    size="small" 
                  />
                  <Chip 
                    label={err.method || 'SERVER'} 
                    variant="outlined" 
                    size="small" 
                  />
                  <Typography variant="caption" color="text.secondary">
                    {new Date(err.created_at).toLocaleString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                    User: {err.user_id || 'n/a'}
                  </Typography>
                </Stack>

                <Typography variant="body2" fontWeight="bold" sx={{ mb: 1 }}>
                  Endpoint: <code>{err.path}</code>
                </Typography>

                <Typography variant="body1" color="error.main" sx={{ mb: 2 }}>
                  ❌ {err.message}
                </Typography>

                {err.context?.client && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Client crash on {err.context.client.currentView || err.context.client.location || 'unknown view'}
                    <br />
                    {err.context.client.userAgent}
                  </Alert>
                )}

                {err.stack && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                      Stack Trace:
                    </Typography>
                    <Box
                      component="pre"
                      sx={{
                        bgcolor: 'rgba(0,0,0,0.05)',
                        p: 2,
                        borderRadius: 1,
                        fontSize: '0.75rem',
                        overflow: 'auto',
                        maxHeight: 200
                      }}
                    >
                      {err.stack}
                    </Box>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      <Alert severity="info" sx={{ mt: 4 }}>
        <Typography variant="body2" fontWeight="bold" sx={{ mb: 1 }}>
          💡 How to view full logs:
        </Typography>
        <Typography variant="body2" component="div">
          • <strong>PM2 logs:</strong> <code>pm2 logs strainspotter-backend</code>
        </Typography>
        <Typography variant="body2" component="div">
          • <strong>PM2 errors only:</strong> <code>pm2 logs strainspotter-backend --err</code>
        </Typography>
        <Typography variant="body2" component="div">
          • <strong>PM2 flush logs:</strong> <code>pm2 flush</code>
        </Typography>
        <Typography variant="body2" component="div" sx={{ mt: 1 }}>
          • <strong>Browser console:</strong> Open DevTools (F12) → Console tab to see frontend errors
        </Typography>
      </Alert>
    </Container>
  );
}
