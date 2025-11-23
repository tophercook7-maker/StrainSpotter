import React, { useState } from 'react';
import { Box, Container, Typography, TextField, Button, Stack, Alert, CircularProgress } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { API_BASE } from '../config';
import { useAuth } from '../hooks/useAuth';

export default function BusinessRegister({ onBack, onSuccess, businessType: initialType }) {
  const { user } = useAuth();
  const [businessType, setBusinessType] = useState(initialType || 'grower');
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('US');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setError('Please sign in to register a business');
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

      const res = await fetch(`${API_BASE}/api/business/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          business_type: businessType,
          name: name.trim(),
          city: city.trim() || null,
          state: state.trim() || null,
          country: country.trim() || 'US',
          phone: phone.trim() || null,
          website: website.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to register business');
      }

      setSuccess(true);
      if (onSuccess) {
        setTimeout(() => onSuccess(data.profile), 1000);
      }
    } catch (err) {
      console.error('[BusinessRegister] error', err);
      setError(err.message || 'Failed to register business');
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
          Register Business
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Business registered successfully! Redirecting...
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>
            <TextField
              select
              label="Business Type"
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              SelectProps={{ native: true }}
              required
              sx={{
                '& .MuiOutlinedInput-root': { color: '#fff' },
                '& .MuiInputLabel-root': { color: '#fff' },
              }}
            >
              <option value="grower">Grower</option>
              <option value="dispensary">Dispensary</option>
            </TextField>

            <TextField
              label="Business Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': { color: '#fff' },
                '& .MuiInputLabel-root': { color: '#fff' },
              }}
            />

            <TextField
              label="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': { color: '#fff' },
                '& .MuiInputLabel-root': { color: '#fff' },
              }}
            />

            <TextField
              label="State"
              value={state}
              onChange={(e) => setState(e.target.value)}
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': { color: '#fff' },
                '& .MuiInputLabel-root': { color: '#fff' },
              }}
            />

            <TextField
              label="Country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': { color: '#fff' },
                '& .MuiInputLabel-root': { color: '#fff' },
              }}
            />

            <TextField
              label="Phone (optional)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              type="tel"
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': { color: '#fff' },
                '& .MuiInputLabel-root': { color: '#fff' },
              }}
            />

            <TextField
              label="Website (optional)"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              type="url"
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': { color: '#fff' },
                '& .MuiInputLabel-root': { color: '#fff' },
              }}
            />

            <Button
              type="submit"
              variant="contained"
              disabled={loading || success}
              fullWidth
              sx={{
                bgcolor: '#7cb342',
                color: '#fff',
                py: 1.5,
                '&:hover': { bgcolor: '#689f38' },
              }}
            >
              {loading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Register Business'}
            </Button>
          </Stack>
        </form>
      </Container>
    </Box>
  );
}

