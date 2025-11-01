import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Button,
  Stack,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

/**
 * ProfileGenerator Component
 * 
 * Automatically generates cannabis-themed username and avatar for new users
 * Allows users to regenerate if they don't like the initial one
 */
export default function ProfileGenerator({ user, onProfileGenerated }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Generate initial profile on mount
  useEffect(() => {
    if (user?.email) {
      generateProfile();
    }
  }, [user]);

  const generateProfile = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/profile-generator/preview?email=${encodeURIComponent(user.email)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate profile');
      }

      setProfile(data);
    } catch (err) {
      console.error('Error generating profile:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const regenerateProfile = async () => {
    setLoading(true);
    setError(null);

    try {
      // Add timestamp to email to get a different profile
      const response = await fetch(`${API_BASE_URL}/api/profile-generator/preview?email=${encodeURIComponent(user.email + Date.now())}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to regenerate profile');
      }

      setProfile(data);
    } catch (err) {
      console.error('Error regenerating profile:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/profile-generator/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          userId: user.id
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save profile');
      }

      // Notify parent component
      if (onProfileGenerated) {
        onProfileGenerated(data.profile);
      }
    } catch (err) {
      console.error('Error saving profile:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading && !profile) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !profile) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 3 }}>
      <Stack spacing={3}>
        {/* Header */}
        <Box sx={{ textAlign: 'center' }}>
          <LocalFloristIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
          <Typography variant="h4" gutterBottom>
            Welcome to StrainSpotter! 🌿
          </Typography>
          <Typography variant="body1" color="text.secondary">
            We've generated a cannabis-themed profile for you
          </Typography>
        </Box>

        {/* Profile Preview Card */}
        <Card elevation={3}>
          <CardContent>
            <Stack spacing={3} alignItems="center">
              {/* Avatar */}
              <Avatar
                src={profile?.avatarUrl}
                alt={profile?.username}
                sx={{ width: 120, height: 120, border: '4px solid', borderColor: 'success.main' }}
              />

              {/* Username */}
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5" gutterBottom>
                  {profile?.username}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {profile?.displayName}
                </Typography>
              </Box>

              {/* Farm Name */}
              <Box sx={{ textAlign: 'center', bgcolor: 'success.light', p: 2, borderRadius: 2, width: '100%' }}>
                <Typography variant="caption" color="text.secondary">
                  Farm Name
                </Typography>
                <Typography variant="h6" color="success.dark">
                  {profile?.farmName}
                </Typography>
              </Box>

              {/* Location */}
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  📍 {profile?.city}, {profile?.state}
                </Typography>
              </Box>

              {/* Experience */}
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  🌱 {profile?.experienceYears} years of growing experience
                </Typography>
              </Box>

              {/* Specialties */}
              <Box sx={{ width: '100%' }}>
                <Typography variant="caption" color="text.secondary" gutterBottom>
                  Specialties:
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
                  {profile?.specialties?.map((specialty, index) => (
                    <Chip
                      key={index}
                      label={specialty}
                      size="small"
                      color="success"
                      variant="outlined"
                      sx={{ mb: 1 }}
                    />
                  ))}
                </Stack>
              </Box>

              {/* Bio */}
              <Box sx={{ width: '100%', bgcolor: 'grey.100', p: 2, borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {profile?.growerBio}
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Stack direction="row" spacing={2} justifyContent="center">
          <Button
            variant="outlined"
            startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
            onClick={regenerateProfile}
            disabled={loading || saving}
            size="large"
          >
            Generate New Profile
          </Button>

          <Button
            variant="contained"
            color="success"
            startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <CheckCircleIcon />}
            onClick={saveProfile}
            disabled={loading || saving}
            size="large"
          >
            {saving ? 'Saving...' : 'Use This Profile'}
          </Button>
        </Stack>

        {/* Info Text */}
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>Don't worry!</strong> You can change your username, avatar, and profile details anytime in your settings.
          </Typography>
        </Alert>

        {error && (
          <Alert severity="error">
            {error}
          </Alert>
        )}
      </Stack>
    </Box>
  );
}

