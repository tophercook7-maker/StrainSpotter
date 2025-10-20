import React, { useEffect, useState } from 'react';
import { supabase, isAuthConfigured } from '../supabaseClient';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  TextField,
  Typography,
  Alert
} from '@mui/material';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

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
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  }

  async function signUp() {
    if (!isAuthConfigured()) {
      setError('Auth not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
      return;
    }
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  }

  async function signOut() {
    await supabase?.auth.signOut();
  }

  // Email allowlist for web access
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
  if (user && !ALLOWLIST.includes(user.email)) {
    return <Alert severity="error">This app is restricted. Only select users can access StrainSpotter web. Please use the mobile app.</Alert>;
  }

  return (
    <Box sx={{ maxWidth: 420, mx: 'auto', py: 4 }}>
      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h5">Account</Typography>
            {user ? (
              <>
                <Typography variant="body2">Signed in as {user.email}</Typography>
                <Button variant="outlined" onClick={signOut}>Sign Out</Button>
              </>
            ) : (
              <>
                <TextField label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} fullWidth />
                <TextField label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} fullWidth />
                {error && <Alert severity="error">{error}</Alert>}
                <Stack direction="row" spacing={1}>
                  <Button variant="contained" onClick={signIn} disabled={loading}>
                    {loading ? <CircularProgress size={20} /> : 'Sign In'}
                  </Button>
                  <Button variant="text" onClick={signUp} disabled={loading}>Sign Up</Button>
                </Stack>
              </>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
