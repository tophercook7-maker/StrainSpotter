import React, { useEffect, useState } from 'react';
import { supabase, isAuthConfigured } from '../supabaseClient';
import { API_BASE } from '../config';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  TextField,
  Typography,
  Alert,
  Tabs,
  Tab,
  Link as MuiLink
} from '@mui/material';

export default function Auth({ onBack }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [info, setInfo] = useState(null);

  useEffect(() => {
    if (!supabase) return;
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user || null));
    return () => authListener?.subscription?.unsubscribe();
  }, []);

  async function signIn() {
    if (!isAuthConfigured()) {
      setError('Auth not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
      return;
    }
    setLoading(true);
    setError(null);
    setInfo(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
      } else {
        // Ensure user record exists immediately after password sign-in
        try {
          const { data } = await supabase.auth.getSession();
          const user = data?.session?.user;
          if (user?.id) {
            // Check if user has a profile
            const { data: profile } = await supabase
              .from('profiles')
              .select('username, avatar_url')
              .eq('user_id', user.id)
              .single();

            // If no username or avatar, generate cannabis-themed profile
            if (!profile?.username || !profile?.avatar_url) {
              try {
                await fetch(`${API_BASE}/api/profile-generator/generate`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    email: user.email,
                    userId: user.id
                  })
                });
              } catch (e) {
                console.warn('[auth] Failed to generate profile:', e);
              }
            } else {
              // Ensure user record exists with existing username
              await fetch(`${API_BASE}/api/users/ensure`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: user.id, email: user.email, username: profile.username })
              });
            }
          }
        } catch (e) {
          console.warn('[auth] ensure user after sign-in failed:', e);
        }
        // Successfully signed in, redirect to home
        if (onBack) {
          setTimeout(() => onBack(), 500);
        }
      }
    setLoading(false);
  }

  async function signUp() {
    if (!isAuthConfigured()) {
      setError('Auth not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
      return;
    }
    setLoading(true);
    setError(null);
    setInfo(null);
    const redirectTo = typeof window !== 'undefined' ? window.location.origin : undefined;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
        data: { email_confirmed: true } // Auto-confirm for dev
      }
    });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else if (data?.user?.identities?.length === 0) {
      setError('This email is already registered. Please sign in, or use "Forgot password" to reset.');
    } else {
      // Generate cannabis-themed profile automatically
      try {
        await fetch(`${API_BASE}/api/profile-generator/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email,
            userId: data.user.id
          })
        });
      } catch (e) {
        console.warn('[auth] Failed to generate profile:', e);
      }

      setError(null);
      setInfo('🌿 Account created with a cannabis-themed profile! You can now sign in.');
    }
  }

  async function signOut() {
    await supabase?.auth.signOut();
  }

  async function sendMagicLink() {
    if (!isAuthConfigured()) {
      setError('Auth not configured.');
      return;
    }
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      const redirectTo = typeof window !== 'undefined' ? window.location.origin : undefined;
      const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } });
      if (error) setError(error.message);
      else setInfo('Magic link sent. Check your email and click the link to sign in.');
    } finally {
      setLoading(false);
    }
  }

  async function forgotPassword() {
    if (!isAuthConfigured()) {
      setError('Auth not configured.');
      return;
    }
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      // Important: redirectTo must match exactly what's in Supabase Auth settings
      const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/` : undefined;
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) setError(error.message);
      else setInfo('Password reset email sent. Check your email and click the link to reset your password. The link expires in 1 hour.');
    } finally {
      setLoading(false);
    }
  }

  // Email allowlist for web access (disabled for local dev)
  const ALLOWLIST = [
    'your@email.com', // <-- add your email(s) here
    'friend1@email.com',
    'friend2@email.com',
    'andrewbeck209@gmail.com'
    // Add more emails as needed
  ];
  if (!isAuthConfigured()) {
    return <Alert severity="info">Auth is not configured. You can still browse features.</Alert>;
  }
  // Disabled allowlist check for local development (localhost)
  const isDev = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  if (user && !isDev && !ALLOWLIST.includes(user.email)) {
    return <Alert severity="error">This app is restricted. Only select users can access StrainSpotter web. Please use the mobile app.</Alert>;
  }

  return (
  <Box sx={{ maxWidth: 420, mx: 'auto', py: 4, background: 'transparent' }}>
      {onBack && (
        <Button 
          onClick={onBack} 
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
          Home
        </Button>
      )}
      <Card sx={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(12px)', border: '2px solid rgba(0,0,0,0.12)', boxShadow: 'none' }}>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h5" sx={{ color: 'black', fontSize: '2rem', fontWeight: 700 }}>Account</Typography>
            {user ? (
              <>
                <Typography variant="body2">Signed in as {user.email}</Typography>
                <Button variant="outlined" onClick={signOut}>Sign Out</Button>
              </>
            ) : (
              <>
                <Tabs value={mode} onChange={(_e, v) => setMode(v)} aria-label="auth mode">
                  <Tab label="Sign In" value="signin" />
                  <Tab label="Sign Up" value="signup" />
                </Tabs>
                <TextField label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} fullWidth sx={{ background: 'rgba(255,255,255,0.10)', color: 'black', fontSize: '1.15rem', borderRadius: 2, input: { color: 'black' } }} InputLabelProps={{ style: { color: 'black', fontWeight: 600 } }} />
                {mode === 'signin' && (
                  <>
                    <TextField label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} fullWidth sx={{ background: 'rgba(255,255,255,0.10)', color: 'black', fontSize: '1.15rem', borderRadius: 2, input: { color: 'black' } }} InputLabelProps={{ style: { color: 'black', fontWeight: 600 } }} />
                    {error && <Alert severity="error" sx={{ fontSize: '1.1rem', color: 'black', background: 'rgba(255,255,255,0.10)' }}>{error}</Alert>}
                    {info && <Alert severity="info" sx={{ fontSize: '1.1rem', color: 'black', background: 'rgba(255,255,255,0.10)' }}>{info}</Alert>}
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                      <Button variant="contained" onClick={signIn} disabled={loading} sx={{ fontSize: '1.1rem', color: 'black', background: 'rgba(255,255,255,0.20)', border: '1.5px solid black', boxShadow: 'none', fontWeight: 700 }}>
                        {loading ? <CircularProgress size={20} /> : 'Sign In'}
                      </Button>
                      <Button variant="outlined" onClick={sendMagicLink} disabled={loading} sx={{ fontSize: '1.1rem', color: 'black', border: '1.5px solid black', fontWeight: 700 }}>Send Magic Link</Button>
                      <Button variant="text" onClick={forgotPassword} disabled={loading} sx={{ fontSize: '1.1rem', color: 'black', fontWeight: 700 }}>Forgot Password?</Button>
                    </Stack>
                  </>
                )}
                {mode === 'signup' && (
                  <>
                    <TextField label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} fullWidth sx={{ background: 'rgba(255,255,255,0.10)', color: 'black', fontSize: '1.15rem', borderRadius: 2, input: { color: 'black' } }} InputLabelProps={{ style: { color: 'black', fontWeight: 600 } }} />
                    {error && <Alert severity="error" sx={{ fontSize: '1.1rem', color: 'black', background: 'rgba(255,255,255,0.10)' }}>{error}</Alert>}
                    {info && <Alert severity="info" sx={{ fontSize: '1.1rem', color: 'black', background: 'rgba(255,255,255,0.10)' }}>{info}</Alert>}
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                      <Button variant="contained" onClick={signUp} disabled={loading} sx={{ fontSize: '1.1rem', color: 'black', background: 'rgba(255,255,255,0.20)', border: '1.5px solid black', boxShadow: 'none', fontWeight: 700 }}>
                        {loading ? <CircularProgress size={20} /> : 'Create Account'}
                      </Button>
                      <MuiLink component="button" onClick={() => setMode('signin')} sx={{ alignSelf: 'center', color: 'black', fontWeight: 700 }}>
                        Already registered? Sign in
                      </MuiLink>
                    </Stack>
                  </>
                )}
              </>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
