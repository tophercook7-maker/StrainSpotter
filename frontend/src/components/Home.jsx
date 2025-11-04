import { useState } from 'react';
import { Box, Button, Typography, Stack, Container, Grid, Card, CardContent, Chip } from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import SpaIcon from '@mui/icons-material/Spa';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';
import ScienceIcon from '@mui/icons-material/Science';
import SpeedIcon from '@mui/icons-material/Speed';
import VerifiedIcon from '@mui/icons-material/Verified';
import ScanWizard from './ScanWizard';
import GardenGate from './GardenGate';
import Garden from './Garden';

// Modern UI Overhaul - Phase 1

export default function Home({ onNavigate }) {
  const [showScan, setShowScan] = useState(false);
  const [showGarden, setShowGarden] = useState(false);
  const [inGarden, setInGarden] = useState(false);

  if (showScan) {
    return <ScanWizard onBack={() => setShowScan(false)} />;
  }

  if (showGarden && !inGarden) {
    return <GardenGate
      onSuccess={() => {
        setInGarden(true);
      }}
      onBack={() => setShowGarden(false)}
    />;
  }

  if (inGarden) {
    return <Garden
      onNavigate={onNavigate}
      onBack={() => {
        setInGarden(false);
        setShowGarden(false);
      }}
    />;
  }

  const features = [
    {
      icon: <CameraAltIcon sx={{ fontSize: 40 }} />,
      title: 'AI-Powered Scanning',
      description: 'Upload a photo and get instant strain identification using advanced computer vision'
    },
    {
      icon: <ScienceIcon sx={{ fontSize: 40 }} />,
      title: 'Scientific Analysis',
      description: 'Detailed breakdown of cannabinoids, terpenes, and genetic lineage'
    },
    {
      icon: <SpeedIcon sx={{ fontSize: 40 }} />,
      title: 'Instant Results',
      description: 'Get comprehensive strain data in seconds, not hours'
    },
    {
      icon: <LocalFloristIcon sx={{ fontSize: 40 }} />,
      title: '35,000+ Strains',
      description: 'Access our massive database of cannabis genetics and strain information'
    },
    {
      icon: <SpaIcon sx={{ fontSize: 40 }} />,
      title: 'Find Vendors',
      description: 'Discover where to buy seeds from trusted vendors worldwide'
    },
    {
      icon: <VerifiedIcon sx={{ fontSize: 40 }} />,
      title: 'Verified Data',
      description: 'Curated strain information from reliable sources and grower reviews'
    }
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        backgroundColor: '#0a0a0a',
        backgroundImage: 'url(/strainspotter-bg.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.4)',
          pointerEvents: 'none',
          zIndex: 0
        }
      }}
    >
      {/* Hero Section */}
      <Box
        sx={{
          position: 'relative',
          minHeight: { xs: '90vh', md: '100vh' },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent'
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, py: { xs: 8, md: 12 } }}>
          <Stack spacing={6} alignItems="center" textAlign="center">
            {/* Logo/Icon */}
            <Box
              className="animate-fade-in"
              sx={{
                width: { xs: 120, md: 160 },
                height: { xs: 120, md: 160 },
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(124, 179, 66, 0.2) 0%, rgba(156, 204, 101, 0.1) 100%)',
                border: '3px solid rgba(124, 179, 66, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 60px rgba(124, 179, 66, 0.3)',
                animation: 'glow 3s ease-in-out infinite alternate'
              }}
            >
              <img
                src="/hero.png?v=5"
                alt="StrainSpotter"
                style={{ width: '70%', height: '70%', objectFit: 'contain' }}
              />
            </Box>

            {/* Headline */}
            <Stack spacing={2} className="animate-slide-up">
              <Typography
                variant="h1"
                sx={{
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: 900,
                  background: 'linear-gradient(135deg, #9CCC65 0%, #7CB342 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.5rem' },
                  lineHeight: 1.1,
                  letterSpacing: '-0.02em'
                }}
              >
                StrainSpotter
              </Typography>

              <Typography
                variant="h2"
                sx={{
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
                  maxWidth: 800,
                  mx: 'auto'
                }}
              >
                AI-Powered Cannabis Strain Identification
              </Typography>

              <Typography
                variant="body1"
                sx={{
                  color: '#b0b0b0',
                  fontSize: { xs: '1.1rem', md: '1.25rem' },
                  maxWidth: 600,
                  mx: 'auto',
                  lineHeight: 1.8
                }}
              >
                Upload a photo of your cannabis and get instant strain identification,
                genetic analysis, and vendor recommendations powered by advanced AI.
              </Typography>
            </Stack>

            {/* CTA Buttons */}
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={3}
              sx={{ mt: 4 }}
              className="animate-slide-up"
            >
              <Button
                variant="contained"
                size="large"
                onClick={() => setShowScan(true)}
                startIcon={<CameraAltIcon />}
                sx={{
                  px: 6,
                  py: 2,
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  borderRadius: '50px',
                  background: 'linear-gradient(135deg, #7CB342 0%, #9CCC65 100%)',
                  boxShadow: '0 8px 30px rgba(124, 179, 66, 0.4)',
                  textTransform: 'none',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 40px rgba(124, 179, 66, 0.6)',
                    background: 'linear-gradient(135deg, #9CCC65 0%, #7CB342 100%)'
                  }
                }}
              >
                Start AI Scan
              </Button>

              <Button
                variant="outlined"
                size="large"
                onClick={() => setShowGarden(true)}
                startIcon={<SpaIcon />}
                sx={{
                  px: 6,
                  py: 2,
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  borderRadius: '50px',
                  border: '2px solid rgba(124, 179, 66, 0.5)',
                  color: '#9CCC65',
                  textTransform: 'none',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    border: '2px solid rgba(124, 179, 66, 0.8)',
                    background: 'rgba(124, 179, 66, 0.1)',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                Enter the Garden
              </Button>
            </Stack>

            {/* Trust Badges */}
            <Stack
              direction="row"
              spacing={2}
              flexWrap="wrap"
              justifyContent="center"
              sx={{ mt: 4 }}
            >
              <Chip
                label="35,000+ Strains"
                sx={{
                  bgcolor: 'rgba(124, 179, 66, 0.15)',
                  color: '#9CCC65',
                  fontWeight: 600,
                  border: '1px solid rgba(124, 179, 66, 0.3)'
                }}
              />
              <Chip
                label="AI-Powered"
                sx={{
                  bgcolor: 'rgba(124, 179, 66, 0.15)',
                  color: '#9CCC65',
                  fontWeight: 600,
                  border: '1px solid rgba(124, 179, 66, 0.3)'
                }}
              />
              <Chip
                label="Instant Results"
                sx={{
                  bgcolor: 'rgba(124, 179, 66, 0.15)',
                  color: '#9CCC65',
                  fontWeight: 600,
                  border: '1px solid rgba(124, 179, 66, 0.3)'
                }}
              />
            </Stack>
          </Stack>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 }, position: 'relative', zIndex: 1 }}>
        <Stack spacing={6}>
          {/* Section Header */}
          <Stack spacing={2} textAlign="center">
            <Typography
              variant="h2"
              sx={{
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 800,
                color: '#ffffff',
                fontSize: { xs: '2rem', md: '3rem' }
              }}
            >
              Why Choose StrainSpotter?
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: '#b0b0b0',
                fontSize: '1.1rem',
                maxWidth: 600,
                mx: 'auto'
              }}
            >
              The most advanced cannabis strain identification platform powered by AI
            </Typography>
          </Stack>

          {/* Features Grid */}
          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card
                  className="animate-fade-in"
                  sx={{
                    height: '100%',
                    background: 'rgba(44, 44, 44, 0.6)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(124, 179, 66, 0.2)',
                    borderRadius: 3,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      border: '1px solid rgba(124, 179, 66, 0.5)',
                      boxShadow: '0 12px 40px rgba(124, 179, 66, 0.2)'
                    }
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <Stack spacing={2} alignItems="center" textAlign="center">
                      <Box
                        sx={{
                          width: 80,
                          height: 80,
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, rgba(124, 179, 66, 0.2) 0%, rgba(156, 204, 101, 0.1) 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#9CCC65'
                        }}
                      >
                        {feature.icon}
                      </Box>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          color: '#ffffff'
                        }}
                      >
                        {feature.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: '#b0b0b0',
                          lineHeight: 1.7
                        }}
                      >
                        {feature.description}
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Bottom CTA */}
          <Stack
            spacing={3}
            alignItems="center"
            sx={{
              mt: 8,
              p: 6,
              borderRadius: 4,
              background: 'linear-gradient(135deg, rgba(124, 179, 66, 0.1) 0%, rgba(0, 0, 0, 0.3) 100%)',
              border: '1px solid rgba(124, 179, 66, 0.3)'
            }}
          >
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: '#ffffff',
                textAlign: 'center'
              }}
            >
              Ready to identify your strain?
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => setShowScan(true)}
              startIcon={<CameraAltIcon />}
              sx={{
                px: 8,
                py: 2.5,
                fontSize: '1.2rem',
                fontWeight: 700,
                borderRadius: '50px',
                background: 'linear-gradient(135deg, #7CB342 0%, #9CCC65 100%)',
                boxShadow: '0 8px 30px rgba(124, 179, 66, 0.4)',
                textTransform: 'none',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 12px 40px rgba(124, 179, 66, 0.6)',
                  background: 'linear-gradient(135deg, #9CCC65 0%, #7CB342 100%)'
                }
              }}
            >
              Start Your Free Scan Now
            </Button>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
