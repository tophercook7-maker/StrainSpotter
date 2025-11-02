import { useState, useEffect } from 'react';
import { Box, Button, Typography, TextField, Stack, Paper, Dialog, DialogTitle, DialogContent, Alert, CircularProgress } from '@mui/material';
import { supabase, isAuthConfigured } from '../supabaseClient';

export default function GardenGate({ onSuccess, onBack }) {
  const [mode, setMode] = useState('welcome'); // 'welcome', 'signup', 'login'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkingAuth, setCheckingAuth] = useState(true);
  
  // Signup fields
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  
  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  const [paymentComplete, setPaymentComplete] = useState(false);
  const authConfigured = isAuthConfigured();

  // Check if user is already logged in and has membership
  useEffect(() => {
    if (!supabase) {
      setCheckingAuth(false);
      return;
    }
    let isMounted = true;

    const checkAuthStatus = async () => {
      if (!supabase) return;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;

        if (session?.user) {
          const membership = session.user.user_metadata?.membership;
          if (membership === 'club') {
            onSuccess?.();
          } else {
            setMode('payment');
          }
        }
      } catch (e) {
        console.error('Auth check failed:', e);
      } finally {
        if (isMounted) {
          setCheckingAuth(false);
        }
      }
    };

    checkAuthStatus();

    return () => {
      isMounted = false;
    };
  }, [onSuccess, supabase]);

  const handleSignup = async () => {
    if (!supabase) {
      setError('Supabase authentication is not configured for this deployment. Please contact support.');
      return;
    }
    setError('');
    if (!signupEmail || !signupPassword || !signupName) {
      setError('Please fill in all fields');
      return;
    }
    
    setLoading(true);
    try {
      // Create account with Supabase Auth
      const { data, error: signupError } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          data: {
            username: signupName,
            membership: 'none' // Will be upgraded after payment
          }
        }
      });

      if (signupError) throw signupError;

      if (data.user) {
        // Account created, now show payment
        setMode('payment');
      }
    } catch (e) {
      setError(e.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!supabase) {
      setError('Supabase authentication is not configured for this deployment. Please contact support.');
      return;
    }
    setError('');
    if (!loginEmail || !loginPassword) {
      setError('Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      console.log('🔐 Attempting login for:', loginEmail);

      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword
      });

      console.log('Login response:', { data, error: loginError });

      if (loginError) {
        console.error('Login error:', loginError);
        throw loginError;
      }

      if (data.session?.user) {
        console.log('✅ Login successful!', data.session.user);

        // Check membership status
        const membership = data.session.user.user_metadata?.membership;
        console.log('Membership status:', membership);

        if (membership === 'club') {
          // Already a member
          console.log('✅ User is a club member, granting access');
          onSuccess?.();
        } else {
          // Need to pay
          console.log('⚠️ User needs to pay for membership');
          setMode('payment');
        }
      }
    } catch (e) {
      console.error('❌ Login failed:', e);
      setError(e.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!supabase) {
      setError('Supabase authentication is not configured for this deployment. Please contact support.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not logged in');

      // TODO: Integrate real payment processor (Stripe, Apple Pay, Google Pay)
      // For now, simulate payment success

      // Update user metadata to grant membership - AUTOMATICALLY SET TO CLUB MEMBER
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          membership: 'club',
          membership_started: new Date().toISOString(),
          payment_status: 'active',
          subscription_tier: 'premium'
        }
      });

      if (updateError) throw updateError;

      // Also update the username if it was set during signup
      if (signupName && !user.user_metadata?.username) {
        await supabase.auth.updateUser({
          data: {
            username: signupName
          }
        });
      }

      setPaymentComplete(true);

      // Grant access after short delay
      setTimeout(() => {
        onSuccess?.();
      }, 2000);

    } catch (e) {
      setError(e.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress sx={{ color: '#7cb342' }} />
      </Box>
    );
  }

  if (!authConfigured) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
        <Paper sx={{ p: 4, borderRadius: 6, maxWidth: 420, textAlign: 'center', bgcolor: 'rgba(0,0,0,0.6)', color: '#fff' }}>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
            Authentication Offline
          </Typography>
          <Typography variant="body2">
            The StrainSpotter authentication service is not configured for this deployment. Please reach out to the site administrator or try again later.
          </Typography>
          {onBack && (
            <Button variant="outlined" sx={{ mt: 3, color: '#fff', borderColor: 'rgba(255,255,255,0.4)' }} onClick={onBack}>
              ← Back
            </Button>
          )}
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      p: { xs: 2, sm: 3 }
    }}>
      <Paper sx={{
        p: { xs: 3, sm: 4 },
        borderRadius: 6,
        width: '100%',
        maxWidth: 480,
        textAlign: 'center',
        background: 'rgba(255,255,255,0.15)',
        backdropFilter: 'blur(20px)',
        border: '2px solid rgba(124, 179, 66, 0.3)'
      }}>
        {/* Welcome Screen */}
        {mode === 'welcome' && (
          <>
            <Typography variant="h3" sx={{ mb: 2, color: '#fff', fontWeight: 900 }}>
              🌿 Enter the Garden
            </Typography>
            <Typography variant="body1" sx={{ mb: 4, color: '#e0e0e0' }}>
              Join the StrainSpotter community to access exclusive features, unlimited scans, and connect with growers worldwide.
            </Typography>
            
            <Stack spacing={2}>
              <Button
                variant="contained"
                size="large"
                onClick={() => setMode('signup')}
                sx={{
                  width: '100%',
                  py: 2,
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  bgcolor: 'rgba(124, 179, 66, 0.8)',
                  '&:hover': { bgcolor: 'rgba(124, 179, 66, 1)' }
                }}
              >
                Sign Up & Join
              </Button>
              
              <Button
                variant="outlined"
                size="large"
                onClick={() => setMode('login')}
                sx={{
                  width: '100%',
                  py: 2,
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  color: '#fff',
                  borderColor: 'rgba(124, 179, 66, 0.6)',
                  '&:hover': { borderColor: 'rgba(124, 179, 66, 1)', bgcolor: 'rgba(124, 179, 66, 0.1)' }
                }}
              >
                I'm Already a Member
              </Button>

              {onBack && (
                <Button
                  variant="text"
                  onClick={onBack}
                  sx={{ color: '#ccc', mt: 2 }}
                >
                  ← Back to Home
                </Button>
              )}
            </Stack>
          </>
        )}

        {/* Signup Screen */}
        {mode === 'signup' && (
          <>
            <Typography variant="h4" sx={{ mb: 3, color: '#fff', fontWeight: 900 }}>
              Create Account
            </Typography>
            
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            
            <Stack spacing={2}>
              <TextField
                label="Full Name"
                value={signupName}
                onChange={e => setSignupName(e.target.value)}
                fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': { color: '#fff' },
                  '& .MuiInputLabel-root': { color: '#ccc' },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(124, 179, 66, 0.5)' }
                }}
              />
              <TextField
                label="Email"
                type="email"
                value={signupEmail}
                onChange={e => setSignupEmail(e.target.value)}
                fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': { color: '#fff' },
                  '& .MuiInputLabel-root': { color: '#ccc' },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(124, 179, 66, 0.5)' }
                }}
              />
              <TextField
                label="Password"
                type="password"
                value={signupPassword}
                onChange={e => setSignupPassword(e.target.value)}
                fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': { color: '#fff' },
                  '& .MuiInputLabel-root': { color: '#ccc' },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(124, 179, 66, 0.5)' }
                }}
              />
              
              <Button
                variant="contained"
                onClick={handleSignup}
                disabled={loading}
                sx={{
                  width: '100%',
                  py: 2,
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  bgcolor: 'rgba(124, 179, 66, 0.8)',
                  '&:hover': { bgcolor: 'rgba(124, 179, 66, 1)' }
                }}
              >
                {loading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Continue to Payment'}
              </Button>
              
              <Button
                variant="text"
                onClick={() => setMode('welcome')}
                sx={{ color: '#ccc' }}
              >
                ← Back
              </Button>
            </Stack>
          </>
        )}

        {/* Login Screen */}
        {mode === 'login' && (
          <>
            <Typography variant="h4" sx={{ mb: 3, color: '#fff', fontWeight: 900 }}>
              Welcome Back
            </Typography>
            
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            
            <Stack spacing={2}>
              <TextField
                label="Email"
                type="email"
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': { color: '#fff' },
                  '& .MuiInputLabel-root': { color: '#ccc' },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(124, 179, 66, 0.5)' }
                }}
              />
              <TextField
                label="Password"
                type="password"
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': { color: '#fff' },
                  '& .MuiInputLabel-root': { color: '#ccc' },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(124, 179, 66, 0.5)' }
                }}
              />
              
              <Button
                variant="contained"
                onClick={handleLogin}
                disabled={loading}
                sx={{
                  width: '100%',
                  py: 2,
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  bgcolor: 'rgba(124, 179, 66, 0.8)',
                  '&:hover': { bgcolor: 'rgba(124, 179, 66, 1)' }
                }}
              >
                {loading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Login'}
              </Button>
              
              <Button
                variant="text"
                onClick={() => setMode('welcome')}
                sx={{ color: '#ccc' }}
              >
                ← Back
              </Button>
            </Stack>
          </>
        )}

        {/* Payment Screen */}
        {mode === 'payment' && (
          <>
            <Typography variant="h4" sx={{ mb: 2, color: '#fff', fontWeight: 900 }}>
              Join the Club
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, color: '#e0e0e0' }}>
              Get unlimited access to all features for just $4.99/month
            </Typography>
            
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            
            {paymentComplete ? (
              <Alert severity="success" sx={{ mb: 2 }}>
                🎉 Payment successful! Welcome to the Garden!
              </Alert>
            ) : (
              <Stack spacing={2}>
                <Box sx={{ p: 3, bgcolor: 'rgba(0,0,0,0.3)', borderRadius: 2, mb: 2 }}>
                  <Typography variant="h6" sx={{ color: '#fff', mb: 1 }}>Membership Benefits:</Typography>
                  <Typography variant="body2" sx={{ color: '#e0e0e0', textAlign: 'left' }}>
                    ✓ Unlimited AI scans<br />
                    ✓ Leave reviews & ratings<br />
                    ✓ Access to community groups<br />
                    ✓ Grow coach & expert tips<br />
                    ✓ Strain browser & database<br />
                    ✓ Priority support
                  </Typography>
                </Box>
                
                <Button
                  variant="contained"
                  onClick={handlePayment}
                  disabled={loading}
                  sx={{
                    width: '100%',
                    py: 2,
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    bgcolor: 'rgba(124, 179, 66, 0.8)',
                    '&:hover': { bgcolor: 'rgba(124, 179, 66, 1)' }
                  }}
                >
                  {loading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Pay $4.99/month'}
                </Button>
                
                <Typography variant="caption" sx={{ color: '#ccc', mt: 2 }}>
                  Cancel anytime. No commitments.
                </Typography>
              </Stack>
            )}
          </>
        )}
      </Paper>
    </Box>
  );
}
