import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Stack,
  Alert,
  LinearProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { API_BASE } from '../config';
import { supabase } from '../supabaseClient';

export default function MembershipJoin() {
  // Strain count and last updated
  const [strainStats, setStrainStats] = useState({ count: null, lastUpdated: null });
  useEffect(() => {
    (async () => {
      try {
        const [countRes, updatedRes] = await Promise.all([
          fetch(`${API_BASE}/api/strains/count`),
          fetch(`${API_BASE}/api/strains/last-updated`)
        ]);
        const countData = await countRes.json();
        const updatedData = await updatedRes.json();
        setStrainStats({
          count: countData.count,
          lastUpdated: updatedData.lastUpdated ? new Date(updatedData.lastUpdated) : null
        });
  } catch { /* ignore errors */ }
    })();
  }, []);

  // All hooks at top level
  const [showLogin, setShowLogin] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState(null);
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    phone: '',
    message: ''
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const getSessionId = useCallback(() => {
    let sid = localStorage.getItem('ss-session-id');
    if (!sid) {
      sid = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('ss-session-id', sid);
    }
    return sid;
  }, []);

  const loadStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/membership/status`, {
        headers: { 'x-session-id': getSessionId() }
      });
      if (res.ok) {
        setStatus(await res.json());
      }
    } catch (e) {
      console.error('Failed to load status:', e);
    } finally {
      setLoading(false);
    }
  }, [getSessionId]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  // Login handler (Supabase Auth)
  const handleLogin = async () => {
    setLoginError(null);
    if (!loginEmail || !loginPassword) {
      setLoginError('Please enter both email and password.');
      return;
    }
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword });
      if (error) {
        setLoginError(error.message);
        return;
      }
      setShowLogin(false);
    } catch (e) {
      setLoginError('Login failed. Please try again.');
    }
  };

  // Supabase Auth: get current user
  useEffect(() => {
    let listener;
    const getSession = async () => {
      const sessionObj = await supabase.auth.getSession?.();
      if (sessionObj?.data?.session?.user) setUser(sessionObj.data.session.user);
    };
    getSession();
    listener = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    return () => { listener?.data?.unsubscribe && listener.data.unsubscribe(); };
  }, []);

  // Render full-access welcome if logged in
  if (user) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Button
          onClick={() => window.location.href = '/'}
          variant="contained"
          sx={{ position: 'absolute', top: 16, left: 16, bgcolor: '#388e3c', color: 'white', fontWeight: 700, borderRadius: 999, boxShadow: '0 2px 8px 0 rgba(46,125,50,0.18)', zIndex: 10, textTransform: 'none', px: 3, py: 1 }}
        >
          Home
        </Button>
        <Box sx={{ mt: 8, textAlign: 'center' }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#2e7d32', mb: 2 }}>Welcome, {user.email}!</Typography>
          <Typography variant="body1" sx={{ color: '#388e3c', mb: 2 }}>You are now logged in and have full access to all features.</Typography>
          <Button variant="contained" color="error" sx={{ borderRadius: 999, px: 4, py: 1, fontWeight: 600 }} onClick={async () => { await supabase.auth.signOut(); setUser(null); }}>
            Logout
          </Button>
        </Box>
      </Container>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setApplying(true);
    try {
      const res = await fetch(`${API_BASE}/api/membership/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Application failed');
        return;
      }
      setSuccess('Application submitted! We will review and be in touch via email within 24-48 hours. Thank you!');
      setShowForm(false);
      setFormData({ email: '', full_name: '', phone: '', message: '' });
    } catch (e) {
      console.error('Membership apply error:', e);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <LinearProgress />
      </Container>
    );
  }


  return (

    <Container maxWidth="md" sx={{ py: 4, position: 'relative' }}>
      <Button
        onClick={() => window.location.href = '/'}
        variant="contained"
        sx={{
          position: 'absolute',
          top: 16,
          left: 16,
          bgcolor: '#388e3c',
          color: 'white',
          fontWeight: 700,
          borderRadius: 999,
          boxShadow: '0 2px 8px 0 rgba(46,125,50,0.18)',
          zIndex: 10,
          textTransform: 'none',
          px: 3,
          py: 1
        }}
      >
        Home
      </Button>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', opacity: 0.95 }}>
        {strainStats.count !== null && (
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#388e3c', textAlign: 'center', fontSize: '1rem', mb: 0.5 }}>
            Over <span style={{ fontWeight: 800 }}>{strainStats.count.toLocaleString()}</span> strains in our database
          </Typography>
        )}
        {strainStats.lastUpdated && (
          <Typography variant="caption" sx={{ color: '#388e3c', textAlign: 'center' }}>
            Updated {strainStats.lastUpdated.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </Typography>
        )}
      </Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700, color: '#2e7d32', textShadow: '0 2px 12px rgba(46,125,50,0.2)' }}>
        Welcome to StrainSpotter Membership
      </Typography>
      {status?.isMember ? (
        <Box sx={{
          mt: 3,
          p: 4,
          borderRadius: 4,
          background: 'rgba(255,255,255,0.15)',
          boxShadow: '0 8px 32px 0 rgba(46,125,50,0.25)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(56,142,60,0.25)',
          color: '#2e7d32',
          fontWeight: 600,
        }}>
          You're an active member! Enjoy unlimited access to all features.
        </Box>
      ) : (
        <Card sx={{
          mb: 3,
          borderRadius: 4,
          background: 'rgba(255,255,255,0.10)',
          boxShadow: '0 8px 32px 0 rgba(46,125,50,0.18)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(56,142,60,0.18)',
          color: '#388e3c',
        }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, color: '#388e3c' }}>
              Basic Access
            </Typography>
            <Box sx={{
              background: 'rgba(255,255,255,0.10)',
              borderRadius: 2,
              p: 2,
              color: '#388e3c',
              fontWeight: 500,
              boxShadow: '0 2px 8px 0 rgba(46,125,50,0.10)',
              border: '1px solid rgba(56,142,60,0.10)',
            }}>
              You have access to the scanner and results.<br />
              <strong>Unlock Full Access:</strong> <br />
              <ul style={{ margin: '8px 0 0 16px', color: '#388e3c' }}>
                <li>Sign up for membership to enjoy exclusive strain data, grow guides, chat/groups, dispensary/grower access, and more.</li>
              </ul>
              <Button variant="contained" sx={{ mt: 2, bgcolor: '#388e3c', color: 'white', fontWeight: 700, borderRadius: 2, boxShadow: '0 2px 8px 0 rgba(46,125,50,0.18)' }} onClick={() => setShowForm(true)}>
                Join Now
              </Button>
              <Button variant="outlined" sx={{ mt: 2, ml: 2, borderRadius: 2, fontWeight: 700 }} onClick={() => setShowLogin(true)}>
                Login to Unlock Full Access
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

        {/* Login Modal with Supabase Auth options */}
        <Dialog open={showLogin} onClose={() => setShowLogin(false)}>
          <DialogTitle>Login</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <Button variant="contained" color="primary" sx={{ borderRadius: 999, px: 4, py: 1, fontWeight: 600 }} onClick={async () => {
                const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
                if (error) setLoginError('Google login failed: ' + error.message);
              }}>
                Login with Google
              </Button>
              <Button variant="contained" color="secondary" sx={{ borderRadius: 999, px: 4, py: 1, fontWeight: 600 }} onClick={async () => {
                const { error } = await supabase.auth.signInWithOAuth({ provider: 'apple' });
                if (error) setLoginError('Apple login failed: ' + error.message);
              }}>
                Login with Apple
              </Button>
              <form onSubmit={e => { e.preventDefault(); handleLogin(); }}>
                <TextField
                  label="Email"
                  type="email"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  fullWidth
                  autoFocus
                  sx={{ mt: 1 }}
                  required
                />
                <TextField
                  label="Password"
                  type="password"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  fullWidth
                  sx={{ mt: 2 }}
                  required
                />
                <Button type="submit" variant="outlined" sx={{ mt: 2, borderRadius: 999, px: 3, py: 1, fontWeight: 600 }}>Login with Email</Button>
              </form>
              {loginError && <Alert severity="error" sx={{ mt: 2 }}>{loginError}</Alert>}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowLogin(false)}>Cancel</Button>
          </DialogActions>
        </Dialog>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mt: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        <Dialog open={showForm} onClose={() => setShowForm(false)} maxWidth="sm" fullWidth>
          <form onSubmit={handleSubmit}>
            <DialogTitle>Membership Application</DialogTitle>
            <DialogContent>
              <Stack spacing={2} sx={{ pt: 1 }}>
                <TextField
                  label="Email"
                  type="email"
                  required
                  fullWidth
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                <TextField
                  label="Full Name"
                  required
                  fullWidth
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                />
                <TextField
                  label="Phone (optional)"
                  fullWidth
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
                <TextField
                  label="Message (optional)"
                  multiline
                  rows={3}
                  fullWidth
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Tell us why you want to join..."
                />
                <Alert severity="info">
                  After submitting, our team will review your application and contact you with payment instructions.
                </Alert>
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setShowForm(false)} disabled={applying}>
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={applying}>
                {applying ? 'Submitting...' : 'Submit Application'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
    </Container>
  );
}
