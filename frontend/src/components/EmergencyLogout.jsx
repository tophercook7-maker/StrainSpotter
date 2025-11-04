import { useState } from 'react';
import { Button, Box, Typography, Paper } from '@mui/material';
import { supabase } from '../supabaseClient';
import LogoutIcon from '@mui/icons-material/Logout';

/**
 * Emergency Logout Component
 * 
 * This component provides a simple, unconditional logout button
 * that bypasses all membership checks and guards.
 * 
 * Access it by going to: http://localhost:5176/#/emergency-logout
 */
export default function EmergencyLogout() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleEmergencyLogout = async () => {
    setLoading(true);
    setMessage('Logging out...');

    try {
      // Force logout - bypass all checks
      await supabase.auth.signOut();

      setMessage('✅ Logged out successfully!');

      // Redirect to home after 1 second
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);

    } catch (error) {
      console.error('Emergency logout error:', error);
      setMessage('❌ Logout failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFullReset = async () => {
    setLoading(true);
    setMessage('Performing full reset...');

    try {
      // 1. Logout from Supabase
      await supabase.auth.signOut();

      // 2. Clear ALL localStorage (including age verification)
      localStorage.clear();

      // 3. Clear ALL sessionStorage
      sessionStorage.clear();

      setMessage('✅ Full reset complete! Redirecting...');

      // 4. Redirect to home (age gate will show)
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);

    } catch (error) {
      console.error('Full reset error:', error);
      setMessage('❌ Reset failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
        p: 2
      }}
    >
      <Paper
        elevation={8}
        sx={{
          p: 4,
          maxWidth: 500,
          width: '100%',
          background: 'linear-gradient(135deg, rgba(255, 82, 82, 0.1) 0%, rgba(255, 107, 107, 0.1) 100%)',
          border: '2px solid #ff5252',
          borderRadius: 3
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <LogoutIcon sx={{ fontSize: 64, color: '#ff5252', mb: 2 }} />
          <Typography variant="h4" sx={{ color: '#fff', fontWeight: 700, mb: 1 }}>
            Emergency Logout
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 2 }}>
            This will log you out immediately, bypassing all membership checks.
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
            Use "Full Reset" to also clear age verification and see the age gate again.
          </Typography>
        </Box>

        <Button
          variant="contained"
          fullWidth
          size="large"
          onClick={handleEmergencyLogout}
          disabled={loading}
          startIcon={<LogoutIcon />}
          sx={{
            bgcolor: '#ff5252',
            color: '#fff',
            fontWeight: 700,
            fontSize: '1.1rem',
            py: 1.5,
            mb: 2,
            '&:hover': {
              bgcolor: '#ff1744'
            },
            '&:disabled': {
              bgcolor: '#666',
              color: '#999'
            }
          }}
        >
          {loading ? 'Logging Out...' : 'Force Logout Now'}
        </Button>

        <Button
          variant="outlined"
          fullWidth
          size="large"
          onClick={handleFullReset}
          disabled={loading}
          sx={{
            borderColor: '#ff9800',
            color: '#ff9800',
            fontWeight: 700,
            fontSize: '1rem',
            py: 1.5,
            '&:hover': {
              borderColor: '#f57c00',
              bgcolor: 'rgba(255, 152, 0, 0.1)'
            },
            '&:disabled': {
              borderColor: '#666',
              color: '#999'
            }
          }}
        >
          {loading ? 'Resetting...' : 'Full Reset (Clear Age Gate Too)'}
        </Button>

        {message && (
          <Typography
            variant="body1"
            sx={{
              mt: 3,
              p: 2,
              bgcolor: 'rgba(0, 0, 0, 0.3)',
              borderRadius: 2,
              color: '#fff',
              textAlign: 'center',
              fontWeight: 600
            }}
          >
            {message}
          </Typography>
        )}

        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
            This is a developer tool for emergency logout situations.
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}

