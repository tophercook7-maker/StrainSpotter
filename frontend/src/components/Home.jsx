// frontend/src/components/Home.jsx

import { useState } from 'react';
import { Box, Button, Typography, Stack, Container, Fab, Paper, Grid, Divider } from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import SpaIcon from '@mui/icons-material/Spa';
import FeedbackIcon from '@mui/icons-material/Feedback';
import TroubleshootIcon from '@mui/icons-material/Troubleshoot';
import GardenGate from './GardenGate';
import Garden from './Garden';
import FeedbackModal from './FeedbackModal';
import { useAuth } from '../hooks/useAuth';
import { isAdminEmail } from '../utils/roles';

// Landing page: Scan + Garden, no sign-in wall

export default function Home({ onNavigate }) {
  const [scanButtonBusy, setScanButtonBusy] = useState(false);
  const [showGarden, setShowGarden] = useState(false);
  const [inGarden, setInGarden] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const { user } = useAuth();
  const isAdmin = isAdminEmail(user?.email);

  const handleScanClick = () => {
    if (scanButtonBusy) return; // ignore double taps
    setScanButtonBusy(true);

    // Navigate to scanner view
    if (typeof onNavigate === 'function') {
      onNavigate('scanner');
    }

    // Safety timeout to reset the button in case scanner load is slow
    setTimeout(() => {
      setScanButtonBusy(false);
    }, 2500);
  };

  // Garden gate flow
  if (showGarden && !inGarden) {
    return (
      <GardenGate
        onSuccess={() => {
          setInGarden(true);
        }}
        onBack={() => setShowGarden(false)}
      />
    );
  }

  // Inside Garden
  if (inGarden) {
    return (
      <Garden
        onNavigate={onNavigate}
        onBack={() => {
          setInGarden(false);
          setShowGarden(false);
        }}
      />
    );
  }

  // Feature list with detailed descriptions
  const features = [
    {
      emoji: '📷',
      title: 'AI Strain Scan',
      description: 'Snap a photo of any cannabis flower, and our advanced AI instantly identifies the strain from our database of over 35,000 varieties. Get detailed strain information including genetics, effects, terpene profiles, and growing characteristics in seconds.',
    },
    {
      emoji: '🌿',
      title: 'Strain Browser',
      description: 'Explore our comprehensive database of 35,000+ cannabis strains. Search by name, effects, terpenes, THC/CBD content, or growing difficulty. Discover new favorites, compare strains, and learn about genetics, lineage, and cultivation tips for each variety.',
    },
    {
      emoji: '⭐',
      title: 'Reviews Hub',
      description: 'Read and share authentic strain reviews from real users. Get insights on effects, taste, growing experience, and medical benefits. Rate your experiences and help the community discover the best strains for their needs.',
    },
    {
      emoji: '👥',
      title: 'Community Groups',
      description: 'Connect with fellow growers, enthusiasts, and cannabis professionals. Join discussions, share grow diaries, ask questions, and build your network. Whether you\'re a beginner or master cultivator, find your tribe here.',
    },
    {
      emoji: '🌱',
      title: 'Grow Coach',
      description: 'Access expert growing tips, guides, and tutorials covering everything from seed to harvest. Learn about lighting, nutrients, pest management, training techniques, and harvesting. Level up your cultivation skills with proven strategies.',
    },
    {
      emoji: '📓',
      title: 'Grow Logbook',
      description: 'Track every stage of your grow with detailed journaling. Record watering schedules, nutrient feeds, environmental conditions, and observations. Monitor progress with photos, set reminders, and build a searchable history of all your grows.',
    },
    {
      emoji: '🧑‍🌾',
      title: 'Grower Directory',
      description: 'Find local cultivators, breeders, and cannabis professionals in your area. Browse profiles, connect with growers, share knowledge, and discover local expertise. Whether you\'re looking for mentors or collaborators, find them here.',
    },
    {
      emoji: '🌾',
      title: 'Seed Vendors',
      description: 'Discover trusted seed banks and breeders with verified reviews from the community. Compare prices, shipping options, and genetics. Find the perfect seeds for your next grow with confidence from reputable sources.',
    },
    {
      emoji: '🏪',
      title: 'Dispensaries',
      description: 'Locate nearby dispensaries using your location. Find shops with your favorite strains in stock, check hours and menus, read reviews, and get directions. Never wonder where to find quality cannabis again.',
    }
  ];

  // Landing screen - now with comprehensive feature showcase
  return (
    <Box
      component="main"
      sx={{
        width: '100%',
        backgroundColor: '#0a0f0a',
        minHeight: '100vh',
        position: 'relative',
        overflowY: 'visible',
        overflowX: 'hidden',
      }}
    >
      <Container 
        maxWidth="md" 
        sx={{ 
          position: 'relative', 
          zIndex: 1, 
          py: 4, 
          px: 3,
        }}
      >
        <Stack spacing={4} alignItems="center" sx={{ width: '100%' }}>
          {/* Header Section */}
          <Stack spacing={3} alignItems="center" textAlign="center" sx={{ width: '100%' }}>
            {/* Logo */}
            <Box
              sx={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                background:
                  'linear-gradient(135deg, rgba(124, 179, 66, 0.2) 0%, rgba(156, 204, 101, 0.2) 100%)',
                border: '3px solid rgba(124, 179, 66, 0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow:
                  '0 0 40px rgba(124, 179, 66, 0.6), 0 0 80px rgba(124, 179, 66, 0.3), inset 0 0 20px rgba(124, 179, 66, 0.1)',
                animation: 'pulse 3s ease-in-out infinite',
                '@keyframes pulse': {
                  '0%, 100%': {
                    boxShadow:
                      '0 0 40px rgba(124, 179, 66, 0.6), 0 0 80px rgba(124, 179, 66, 0.3)',
                  },
                  '50%': {
                    boxShadow:
                      '0 0 60px rgba(124, 179, 66, 0.8), 0 0 120px rgba(124, 179, 66, 0.4)',
                  },
                },
              }}
            >
              <img
                src="/hero.png?v=13"
                alt="StrainSpotter"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: '50%',
                }}
              />
            </Box>

            {/* Title */}
            <Typography
              variant="h3"
              sx={{
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 900,
                background:
                  'linear-gradient(135deg, #CDDC39 0%, #9CCC65 50%, #7CB342 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontSize: { xs: '2.5rem', sm: '3rem' },
                lineHeight: 1.1,
                textShadow: '0 0 30px rgba(124, 179, 66, 0.5)',
                filter: 'drop-shadow(0 0 20px rgba(124, 179, 66, 0.4))',
              }}
            >
              StrainSpotter
            </Typography>

            <Typography
              variant="h6"
              sx={{
                color: '#d0d0d0',
                fontSize: '1.1rem',
                maxWidth: 600,
                lineHeight: 1.6,
                textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
                fontWeight: 400,
              }}
            >
              AI-powered cannabis strain identification and comprehensive grow journaling platform
            </Typography>

            {/* Main Actions */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ width: '100%', maxWidth: 500, mt: 1 }}>
              {/* Primary: Scan */}
              <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={handleScanClick}
                disabled={scanButtonBusy}
                startIcon={<CameraAltIcon />}
                sx={{
                  py: 1.5,
                  textTransform: 'none',
                  fontSize: '1.05rem',
                  fontWeight: 600,
                  opacity: scanButtonBusy ? 0.8 : 1,
                  borderRadius: '16px',
                  background:
                    'linear-gradient(135deg, #7CB342 0%, #9CCC65 50%, #CDDC39 100%)',
                  boxShadow:
                    '0 8px 32px rgba(124, 179, 66, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                  transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    transform: scanButtonBusy ? 'none' : 'translateY(-3px) scale(1.02)',
                    boxShadow:
                      '0 12px 40px rgba(124, 179, 66, 0.7), 0 0 60px rgba(124, 179, 66, 0.3)',
                    background:
                      'linear-gradient(135deg, #8BC34A 0%, #AED581 50%, #CDDC39 100%)',
                  },
                  '&:active': {
                    transform: 'translateY(-1px) scale(0.98)',
                    transition: 'all 0.05s ease',
                  },
                }}
              >
                {scanButtonBusy && (
                  <Box
                    component="span"
                    className="scan-button-spinner"
                  />
                )}
                {scanButtonBusy ? 'Opening scanner…' : 'Scan a Strain'}
              </Button>

              {/* Secondary: Enter Garden */}
              <Button
                variant="outlined"
                size="large"
                fullWidth
                onClick={() => setShowGarden(true)}
                startIcon={<SpaIcon />}
                sx={{
                  py: 1.5,
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  borderRadius: '16px',
                  border: '2px solid rgba(124, 179, 66, 0.7)',
                  color: '#CDDC39',
                  background: 'rgba(124, 179, 66, 0.1)',
                  backdropFilter: 'blur(10px)',
                  textTransform: 'none',
                  transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow:
                    '0 4px 16px rgba(124, 179, 66, 0.2), inset 0 1px 0 rgba(124, 179, 66, 0.2)',
                  '&:hover': {
                    border: '2px solid rgba(124, 179, 66, 1)',
                    background: 'rgba(124, 179, 66, 0.2)',
                    transform: 'translateY(-3px) scale(1.02)',
                    boxShadow:
                      '0 8px 32px rgba(124, 179, 66, 0.4), inset 0 1px 0 rgba(124, 179, 66, 0.3)',
                    color: '#fff',
                  },
                  '&:active': {
                    transform: 'translateY(-1px) scale(0.98)',
                    transition: 'all 0.05s ease',
                  },
                }}
              >
                Enter the Garden
              </Button>
            </Stack>

            {/* Stats Tagline */}
            <Typography
              variant="body2"
              sx={{
                color: '#7CB342',
                fontSize: '0.95rem',
                fontWeight: 600,
                mt: 1,
              }}
            >
              35,000+ strains • Instant AI identification • Complete grow tools • Active community
            </Typography>
          </Stack>

          <Divider sx={{ width: '100%', borderColor: 'rgba(124, 179, 66, 0.3)' }} />

          {/* Features Section */}
          <Stack spacing={3} sx={{ width: '100%' }}>
            <Typography
              variant="h5"
              sx={{
                color: '#CDDC39',
                fontWeight: 700,
                textAlign: 'center',
                textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
              }}
            >
              Everything You Need for Cannabis
            </Typography>

            <Grid container spacing={2}>
              {features.map((feature, index) => (
                <Grid item xs={12} sm={6} key={index}>
                  <Paper
                    sx={{
                      p: 3,
                      background: 'rgba(0, 0, 0, 0.4)',
                      backdropFilter: 'blur(12px)',
                      border: '2px solid rgba(124, 179, 66, 0.3)',
                      borderRadius: 3,
                      transition: 'all 0.2s ease',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      '&:hover': {
                        background: 'rgba(124, 179, 66, 0.15)',
                        border: '2px solid rgba(124, 179, 66, 0.6)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 20px rgba(124, 179, 66, 0.4)',
                      },
                    }}
                  >
                    <Stack direction="row" spacing={2} alignItems="flex-start">
                      <Box
                        sx={{
                          fontSize: '3rem',
                          lineHeight: 1,
                          flexShrink: 0,
                          filter: 'drop-shadow(0 3px 6px rgba(0, 0, 0, 0.4))',
                        }}
                      >
                        {feature.emoji}
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          variant="h6"
                          sx={{
                            color: '#CDDC39',
                            fontWeight: 700,
                            mb: 1,
                            fontSize: '1.25rem',
                            textShadow: '0 2px 4px rgba(0, 0, 0, 0.7)',
                          }}
                        >
                          {feature.title}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            color: '#d0d0d0',
                            lineHeight: 1.6,
                            fontSize: '0.95rem',
                            textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)',
                          }}
                        >
                          {feature.description}
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Stack>

          <Divider sx={{ width: '100%', borderColor: 'rgba(124, 179, 66, 0.3)' }} />

          {/* Call to Action */}
          <Stack spacing={2} alignItems="center" sx={{ width: '100%', pb: 4 }}>
            <Typography
              variant="h6"
              sx={{
                color: '#CDDC39',
                fontWeight: 700,
                textAlign: 'center',
                textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
              }}
            >
              Ready to Get Started?
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ width: '100%', maxWidth: 500 }}>
              <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={handleScanClick}
                disabled={scanButtonBusy}
                startIcon={<CameraAltIcon />}
                sx={{
                  py: 1.5,
                  textTransform: 'none',
                  fontSize: '1.05rem',
                  fontWeight: 600,
                  borderRadius: '16px',
                  background:
                    'linear-gradient(135deg, #7CB342 0%, #9CCC65 50%, #CDDC39 100%)',
                  boxShadow:
                    '0 8px 32px rgba(124, 179, 66, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                  '&:hover': {
                    background:
                      'linear-gradient(135deg, #8BC34A 0%, #AED581 50%, #CDDC39 100%)',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                Start Scanning
              </Button>
              <Button
                variant="outlined"
                size="large"
                fullWidth
                onClick={() => setShowGarden(true)}
                startIcon={<SpaIcon />}
                sx={{
                  py: 1.5,
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  borderRadius: '16px',
                  border: '2px solid rgba(124, 179, 66, 0.7)',
                  color: '#CDDC39',
                  background: 'rgba(124, 179, 66, 0.1)',
                  backdropFilter: 'blur(10px)',
                  textTransform: 'none',
                  '&:hover': {
                    border: '2px solid rgba(124, 179, 66, 1)',
                    background: 'rgba(124, 179, 66, 0.2)',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                Explore the Garden
              </Button>
            </Stack>
          </Stack>

          {isAdmin && (
            <Button
              variant="text"
              size="small"
              startIcon={<TroubleshootIcon fontSize="small" />}
              onClick={() => onNavigate('admin-status')}
              sx={{ color: '#A5D6A7', textTransform: 'none' }}
            >
              Status & debug tools
            </Button>
          )}
        </Stack>
      </Container>

      {/* Feedback fab */}
      <Fab
        color="primary"
        size="small"
        onClick={() => setShowFeedback(true)}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 1000,
          background:
            'linear-gradient(135deg, #7CB342 0%, #9CCC65 100%)',
          boxShadow: '0 4px 12px rgba(124, 179, 66, 0.3)',
          width: 48,
          height: 48,
        }}
      >
        <FeedbackIcon fontSize="small" />
      </Fab>

      <FeedbackModal
        open={showFeedback}
        onClose={() => setShowFeedback(false)}
        user={null}
      />
    </Box>
  );
}