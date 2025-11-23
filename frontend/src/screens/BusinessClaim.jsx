import React, { useState } from 'react';
import { Box, Container, Typography, TextField, Button, Stack, Alert, CircularProgress } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { API_BASE } from '../config';
import { useAuth } from '../hooks/useAuth';

export default function BusinessClaim({ onBack, onSuccess }) {
  const { user } = useAuth();
  const [businessCode, setBusinessCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setError('Please sign in to claim a business');
      return;
    }

    const code = businessCode.trim().toUpperCase();
    if (!code || code.length !== 4) {
      setError('Please enter a valid 4-character business code');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const token = user?.access_token || (await window.supabase?.auth.getSession())?.data?.session?.access_token;
      if (!token) {
        throw new Error('Not authenticated');
      }

      const res = await fetch(`${API_BASE}/api/business/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ business_code: code }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to claim business');
      }

      setSuccess(true);
      if (onSuccess) {
        setTimeout(() => onSuccess(data.profile), 1000);
      }
    } catch (err) {
      console.error('[BusinessClaim] error', err);
      setError(err.message || 'Failed to claim business');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
        color: '#fff',
        pt: 'env(safe-area-inset-top)',
        pb: 'env(safe-area-inset-bottom)',
      }}
    >
      <Container maxWidth="sm" sx={{ py: 4 }}>
        {onBack && (
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={onBack}
            sx={{ mb: 3, color: '#C5E1A5' }}
          >
            Back
          </Button>
        )}

        <Typography variant="h4" sx={{ fontWeight: 700, mb: 2, color: '#C5E1A5' }}>
          Claim Business
        </Typography>

        <Typography variant="body2" sx={{ mb: 4, color: '#BDBDBD' }}>
          Enter your 4-character business code to claim your business profile.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Business claimed successfully! Redirecting...
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>
            <TextField
              label="Business Code"
              value={businessCode}
              onChange={(e) => {
                const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
                setBusinessCode(value);
              }}
              placeholder="A1B9"
              required
              fullWidth
              inputProps={{
                maxLength: 4,
                style: { textTransform: 'uppercase', textAlign: 'center', fontSize: '24px', letterSpacing: '8px' },
              }}
              sx={{
                '& .MuiOutlinedInput-root': { color: '#fff' },
                '& .MuiInputLabel-root': { color: '#fff' },
              }}
            />

            <Button
              type="submit"
              variant="contained"
              disabled={loading || success || businessCode.length !== 4}
              fullWidth
              sx={{
                bgcolor: '#7cb342',
                color: '#fff',
                py: 1.5,
                '&:hover': { bgcolor: '#689f38' },
              }}
            >
              {loading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Claim Business'}
            </Button>
          </Stack>
        </form>
      </Container>
    </Box>
  );
}

