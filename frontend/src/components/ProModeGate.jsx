import React, { useState } from 'react';
import { useProMode } from '../contexts/ProModeContext';
import { Box, TextField, Button, Typography, Alert, Chip } from '@mui/material';

export function ProModeGate() {
  const { proRole, proEnabled, proLoading, activateProWithCode, clearProMode } = useProMode();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!code.trim()) {
      setError('Please enter your access code.');
      return;
    }

    try {
      const result = await activateProWithCode(code.trim());
      setSuccess(`Pro mode activated for ${result.role === 'dispensary' ? 'Dispensary' : 'Grower'}.`);
      setCode('');
    } catch (err) {
      setError(err?.message || 'Invalid access code.');
    }
  }

  function handleClear() {
    clearProMode();
    setSuccess('');
    setError('');
  }

  return (
    <Box
      sx={{
        p: 3,
        borderRadius: 2,
        border: '1px solid rgba(124, 179, 66, 0.3)',
        background: 'rgba(0, 0, 0, 0.2)',
        mb: 2,
      }}
    >
      <Typography variant="h6" sx={{ mb: 1, color: '#E8F5E9' }}>
        Dispensary & Grower Mode
      </Typography>

      {proEnabled && proRole ? (
        <Box sx={{ mb: 2 }}>
          <Chip
            label={`Active: ${proRole === 'dispensary' ? 'Dispensary mode' : 'Grower mode'}`}
            color="success"
            sx={{ mb: 1 }}
          />
          <Typography variant="body2" sx={{ color: 'rgba(200, 230, 201, 0.8)' }}>
            Pro-level AI details are now enabled for your scans.
          </Typography>
        </Box>
      ) : (
        <Typography variant="body2" sx={{ mb: 2, color: 'rgba(200, 230, 201, 0.8)' }}>
          Enter your access code to unlock pro-level AI details tailored for dispensaries and growers.
        </Typography>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <TextField
          type="text"
          value={code}
          onChange={e => setCode(e.target.value)}
          placeholder="Enter access code"
          disabled={proLoading || proEnabled}
          fullWidth
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '999px',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              color: '#fff',
              '& fieldset': {
                borderColor: 'rgba(255, 255, 255, 0.2)',
              },
              '&:hover fieldset': {
                borderColor: 'rgba(255, 255, 255, 0.3)',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#7CB342',
              },
            },
            '& .MuiInputBase-input': {
              color: '#fff',
            },
          }}
        />
        <Button
          type="submit"
          disabled={proLoading || proEnabled}
          variant="contained"
          sx={{
            borderRadius: '999px',
            backgroundColor: '#7CB342',
            color: '#000',
            fontWeight: 600,
            '&:hover': {
              backgroundColor: '#9AE66E',
            },
            '&:disabled': {
              backgroundColor: 'rgba(124, 179, 66, 0.3)',
              color: 'rgba(255, 255, 255, 0.5)',
            },
          }}
        >
          {proLoading ? 'Checking code…' : proEnabled ? 'Already Active' : 'Activate Pro Mode'}
        </Button>

        {proEnabled && (
          <Button
            type="button"
            onClick={handleClear}
            variant="outlined"
            sx={{
              borderRadius: '999px',
              borderColor: 'rgba(255, 255, 255, 0.2)',
              color: '#fff',
              fontSize: '12px',
              mt: 1,
              '&:hover': {
                borderColor: 'rgba(255, 255, 255, 0.4)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
              },
            }}
          >
            Disable Pro Mode
          </Button>
        )}
      </form>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mt: 2 }}>
          {success}
        </Alert>
      )}
    </Box>
  );
}

