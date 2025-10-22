import { useState, useEffect } from 'react';
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

export default function MembershipJoin() {
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

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/membership/status`, {
        headers: {
          'x-session-id': getSessionId()
        }
      });
      if (res.ok) {
        setStatus(await res.json());
      }
    } catch (e) {
      console.error('Failed to load status:', e);
    } finally {
      setLoading(false);
    }
  };

  const getSessionId = () => {
    let sid = localStorage.getItem('ss-session-id');
    if (!sid) {
      sid = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('ss-session-id', sid);
    }
    return sid;
  };

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

  const isTrial = status?.status === 'trial';
  const isExpired = status?.status === 'trial_expired';
  const isActive = status?.status === 'active';

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>
        Join the Club
      </Typography>

      {isActive && (
        <Alert severity="success" sx={{ mb: 3 }}>
          You're an active member! Enjoy unlimited access to all features.
        </Alert>
      )}

      {isTrial && status.trial && (
        <Card sx={{ mb: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Try Me Mode Active
            </Typography>
            <Stack spacing={2}>
              <Box>
                <Typography variant="body2">Scans</Typography>
                <LinearProgress
                  variant="determinate"
                  value={(status.trial.scanCount / status.trial.scanLimit) * 100}
                  sx={{ height: 8, borderRadius: 1, mb: 0.5 }}
                />
                <Typography variant="caption">
                  {status.trial.scansRemaining} of {status.trial.scanLimit} remaining
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2">Searches</Typography>
                <LinearProgress
                  variant="determinate"
                  value={(status.trial.searchCount / status.trial.searchLimit) * 100}
                  sx={{ height: 8, borderRadius: 1, mb: 0.5 }}
                />
                <Typography variant="caption">
                  {status.trial.searchesRemaining} of {status.trial.searchLimit} remaining
                </Typography>
              </Box>
              <Alert severity="info">
                Trial expires: {new Date(status.trial.expiresAt).toLocaleDateString()}
              </Alert>
            </Stack>
          </CardContent>
        </Card>
      )}

      {isExpired && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Your trial has expired. Join the club to continue using StrainSpotter!
        </Alert>
      )}

      <Card>
        <CardContent>
          <Typography variant="h5" sx={{ mb: 2 }}>
            Membership Benefits
          </Typography>
          <Stack spacing={2} sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip label="✓" color="success" size="small" />
              <Typography>Unlimited strain scans with AI identification</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip label="✓" color="success" size="small" />
              <Typography>Full access to 35,000+ strain database</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip label="✓" color="success" size="small" />
              <Typography>Advanced search and filtering tools</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip label="✓" color="success" size="small" />
              <Typography>Grower directory and community access</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip label="✓" color="success" size="small" />
              <Typography>Grow logs and journal tracking</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip label="✓" color="success" size="small" />
              <Typography>Private groups and messaging</Typography>
            </Box>
          </Stack>

          {!isActive && (
            <>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Ready to Join?
              </Typography>
              <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={() => setShowForm(true)}
                sx={{ fontWeight: 700 }}
              >
                Apply for Membership
              </Button>
            </>
          )}
        </CardContent>
      </Card>

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
