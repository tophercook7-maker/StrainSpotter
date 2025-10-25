import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Box, Card, CardContent, TextField, Button, Typography, Stack, Alert, CircularProgress } from '@mui/material';

export default function PasswordReset({ onBack }) {
  // Removed unused 'user' variable
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState('');
  const [ready, setReady] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    let timeout;
    let cleanup = false;
    
    // When arriving from password recovery link, Supabase needs to process the hash token
    // Give it time to establish the recovery session from the URL
    timeout = setTimeout(async () => {
      try {
        // First, check if Supabase has processed the recovery hash
        if (!supabase || !supabase.auth) {
          setError('Supabase client not initialized. Please reload the page.');
          return;
        }
        const { data, error: sessionError } = await supabase.auth.getSession();
        console.log('[PasswordReset] Session check:', data?.session?.user?.email || 'none');
        if (data?.session) {
          setReady(true);
          setInfo('Enter a new password below to complete the reset.');
          if (!cleanup && typeof window !== 'undefined') {
            setTimeout(() => {
              history.replaceState(null, '', window.location.pathname + window.location.search);
            }, 500);
          }
        } else {
          console.error('[PasswordReset] No session found:', sessionError);
          setError('Recovery link is invalid or expired. Please request a new reset email from the Sign In screen.');
        }
      } catch (err) {
        console.error('[PasswordReset] Session error:', err);
        setError('Unable to validate session. Please request a new reset link.');
      }
    }, 1500); // Increased delay to give Supabase more time
    
    return () => {
      cleanup = true;
      clearTimeout(timeout);
    };
  }, []);

  async function updatePassword() {
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      console.log('[PasswordReset] Updating password');
      const { data, error } = await supabase.auth.updateUser({ password: newPassword });
      
      if (error) {
        console.error('[PasswordReset] Error:', error);
        setError(error.message);
      } else {
        console.log('[PasswordReset] Password updated successfully');
        
        // Ensure user record exists in public.users table
        if (data?.user?.id) {
          try {
            await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:5181'}/api/users/ensure`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ user_id: data.user.id })
            });
          } catch (err) {
            console.warn('[PasswordReset] Failed to ensure user record:', err);
          }
        }
        
        setInfo('✅ Password updated! You are now signed in. Redirecting to home...');
        setTimeout(() => {
          if (onBack) {
            onBack(); // Use App's navigation
          } else {
            window.location.hash = '#/';
          }
        }, 2000);
      }
    } catch (err) {
      console.error('[PasswordReset] Catch error:', err);
      setError('Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function goToLogin() {
    if (onBack) {
      onBack(); // This will set currentView to 'home'
      // Then navigate to login
      setTimeout(() => {
        window.location.hash = '#/login';
      }, 100);
    } else {
      window.location.hash = '#/login';
    }
  }

  function goHome() {
    if (onBack) {
      onBack(); // Use the App.jsx's setCurrentView
    } else {
      window.location.hash = '#/';
    }
  }

  return (
    <Box sx={{ maxWidth: 420, mx: 'auto', py: 4 }}>
      <Button 
        onClick={goHome} 
        size="small" 
        variant="contained" 
        sx={{ 
          mb: 2,
          bgcolor: 'white', 
          color: 'black', 
          textTransform: 'none', 
          fontWeight: 700, 
          borderRadius: 999, 
          '&:hover': { bgcolor: 'grey.100' } 
        }}
      >
        ← Home
      </Button>
      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h5">Reset Password</Typography>
            {info && <Alert severity="success">{info}</Alert>}
            {error && <Alert severity="error">{error}</Alert>}
            {ready ? (
              <>
                <TextField 
                  label="New Password" 
                  type={showPassword ? "text" : "password"}
                  value={newPassword} 
                  onChange={e => setNewPassword(e.target.value)} 
                  fullWidth 
                  autoComplete="new-password"
                  helperText={
                    <Button 
                      size="small" 
                      onClick={() => setShowPassword(!showPassword)}
                      sx={{ textTransform: 'none', p: 0, minWidth: 0 }}
                    >
                      {showPassword ? 'Hide' : 'Show'} password
                    </Button>
                  }
                />
                <TextField 
                  label="Confirm Password" 
                  type={showPassword ? "text" : "password"}
                  value={confirm} 
                  onChange={e => setConfirm(e.target.value)} 
                  fullWidth 
                  autoComplete="new-password"
                />
                <Button variant="contained" onClick={updatePassword} disabled={loading} fullWidth>
                  {loading ? <CircularProgress size={20} /> : 'Update Password & Sign In'}
                </Button>
              </>
            ) : (
              <>
                {!error ? (
                  <Typography variant="body2">Verifying recovery link…</Typography>
                ) : (
                  <Alert severity="warning" sx={{ mt: 1 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Link Expired</strong>
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      Password reset links expire after 1 hour. Please request a new one from the Sign In page using the "Forgot Password?" button.
                    </Typography>
                    <Stack spacing={1}>
                      <Button variant="contained" onClick={goToLogin} fullWidth>
                        Go to Sign In & Request New Link
                      </Button>
                      <Button variant="outlined" onClick={goHome} fullWidth>
                        Back to Home
                      </Button>
                    </Stack>
                  </Alert>
                )}
              </>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
