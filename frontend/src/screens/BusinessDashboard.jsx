import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Button, Stack, Card, CardContent, CircularProgress, Alert, Chip } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import InventoryIcon from '@mui/icons-material/Inventory';
import MessageIcon from '@mui/icons-material/Message';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PeopleIcon from '@mui/icons-material/People';
import { API_BASE } from '../config';
import { useAuth } from '../hooks/useAuth';

export default function BusinessDashboard({ onBack, onNavigate }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalViews: 0,
    totalChats: 0,
    totalFollowers: 0,
    itemsPosted: 0,
  });

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const token = user?.access_token || (await window.supabase?.auth.getSession())?.data?.session?.access_token;
      if (!token) {
        throw new Error('Not authenticated');
      }

      const res = await fetch(`${API_BASE}/api/business/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load profile');
      }

      setProfile(data.profile);
      // TODO: Load stats from API
      setStats({
        totalViews: 0,
        totalChats: 0,
        totalFollowers: 0,
        itemsPosted: 0,
      });
    } catch (err) {
      console.error('[BusinessDashboard] error', err);
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const copyBusinessCode = () => {
    if (profile?.business_code) {
      navigator.clipboard.writeText(profile.business_code);
      // TODO: Show toast notification
    }
  };

  const navigate = onNavigate || ((path) => window.location.hash = `#${path}`);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress sx={{ color: '#7cb342' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">{error}</Alert>
        {onBack && (
          <Button startIcon={<ArrowBackIcon />} onClick={onBack} sx={{ mt: 2 }}>
            Back
          </Button>
        )}
      </Box>
    );
  }

  if (!profile) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" sx={{ mb: 2, color: '#fff' }}>
          No business profile found
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate('/business/register')}
          sx={{ bgcolor: '#7cb342' }}
        >
          Register Business
        </Button>
      </Box>
    );
  }

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

        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: '#C5E1A5' }}>
          {profile.name || 'Business Dashboard'}
        </Typography>

        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 3 }}>
          <Chip
            label={profile.business_type === 'grower' ? 'Grower' : 'Dispensary'}
            sx={{
              bgcolor: profile.business_type === 'grower' ? 'rgba(124, 179, 66, 0.2)' : 'rgba(255, 167, 38, 0.2)',
              color: profile.business_type === 'grower' ? '#A5D6A7' : '#FFB74D',
            }}
          />
          <Chip
            label={`Code: ${profile.business_code}`}
            icon={<ContentCopyIcon sx={{ fontSize: 16 }} />}
            onClick={copyBusinessCode}
            sx={{
              bgcolor: 'rgba(255,255,255,0.1)',
              color: '#fff',
              cursor: 'pointer',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
            }}
          />
        </Stack>

        {profile.city && profile.state && (
          <Typography variant="body2" sx={{ mb: 4, color: '#BDBDBD' }}>
            {profile.city}, {profile.state} {profile.country ? `(${profile.country})` : ''}
          </Typography>
        )}

        {/* Stats Cards */}
        <Stack spacing={2} sx={{ mb: 4 }}>
          <Card sx={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(124, 179, 66, 0.2)' }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Stack direction="row" spacing={2} alignItems="center">
                  <VisibilityIcon sx={{ color: '#7cb342' }} />
                  <Box>
                    <Typography variant="h6" sx={{ color: '#fff' }}>
                      {stats.totalViews}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#BDBDBD' }}>
                      Total Views
                    </Typography>
                  </Box>
                </Stack>
              </Stack>
            </CardContent>
          </Card>

          <Card sx={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(124, 179, 66, 0.2)' }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Stack direction="row" spacing={2} alignItems="center">
                  <MessageIcon sx={{ color: '#7cb342' }} />
                  <Box>
                    <Typography variant="h6" sx={{ color: '#fff' }}>
                      {stats.totalChats}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#BDBDBD' }}>
                      Total Chats
                    </Typography>
                  </Box>
                </Stack>
              </Stack>
            </CardContent>
          </Card>

          <Card sx={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(124, 179, 66, 0.2)' }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Stack direction="row" spacing={2} alignItems="center">
                  <PeopleIcon sx={{ color: '#7cb342' }} />
                  <Box>
                    <Typography variant="h6" sx={{ color: '#fff' }}>
                      {stats.totalFollowers}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#BDBDBD' }}>
                      Total Followers
                    </Typography>
                  </Box>
                </Stack>
              </Stack>
            </CardContent>
          </Card>

          <Card sx={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(124, 179, 66, 0.2)' }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Stack direction="row" spacing={2} alignItems="center">
                  <InventoryIcon sx={{ color: '#7cb342' }} />
                  <Box>
                    <Typography variant="h6" sx={{ color: '#fff' }}>
                      {stats.itemsPosted}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#BDBDBD' }}>
                      Items Posted
                    </Typography>
                  </Box>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Stack>

        {/* Action Buttons */}
        <Stack spacing={2}>
          <Button
            variant="contained"
            startIcon={<LocalOfferIcon />}
            fullWidth
            sx={{
              bgcolor: '#7cb342',
              py: 1.5,
              '&:hover': { bgcolor: '#689f38' },
            }}
            onClick={() => navigate('/business/post-deal')}
          >
            Post Daily Deal
          </Button>

          <Button
            variant="outlined"
            startIcon={<InventoryIcon />}
            fullWidth
            sx={{
              borderColor: 'rgba(255,255,255,0.3)',
              color: '#fff',
              py: 1.5,
              '&:hover': { borderColor: 'rgba(255,255,255,0.5)' },
            }}
            onClick={() => navigate('/business/inventory')}
          >
            Manage Inventory
          </Button>

          <Button
            variant="outlined"
            startIcon={<MessageIcon />}
            fullWidth
            sx={{
              borderColor: 'rgba(255,255,255,0.3)',
              color: '#fff',
              py: 1.5,
              '&:hover': { borderColor: 'rgba(255,255,255,0.5)' },
            }}
            onClick={() => navigate('/business/messages')}
          >
            View Messages
          </Button>

          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            fullWidth
            sx={{
              borderColor: 'rgba(255,255,255,0.3)',
              color: '#fff',
              py: 1.5,
              '&:hover': { borderColor: 'rgba(255,255,255,0.5)' },
            }}
            onClick={() => navigate('/business/edit')}
          >
            Edit Profile
          </Button>
        </Stack>
      </Container>
    </Box>
  );
}

