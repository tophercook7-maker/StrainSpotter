import { useState } from 'react';
import { Box, Button, Typography, Stack, Container, Grid, Card, Fab } from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import SpaIcon from '@mui/icons-material/Spa';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';
import ScienceIcon from '@mui/icons-material/Science';
import SpeedIcon from '@mui/icons-material/Speed';
import VerifiedIcon from '@mui/icons-material/Verified';
import FeedbackIcon from '@mui/icons-material/Feedback';
import ScanWizard from './ScanWizard';
import GardenGate from './GardenGate';
import Garden from './Garden';
import FeedbackModal from './FeedbackModal';

// Compact Mobile-First UI - No Scrolling

export default function Home({ onNavigate }) {
  const [showScan, setShowScan] = useState(false);
  const [showGarden, setShowGarden] = useState(false);
  const [inGarden, setInGarden] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

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
        overflow: 'auto',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          pointerEvents: 'none',
          zIndex: 0
        }
      }}
    >
      {/* Compact Mobile-First Hero */}
      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1, py: 2, px: 2 }}>
        <Stack spacing={2} alignItems="center" textAlign="center">
          {/* Compact Logo */}
          <Box
            sx={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: 'transparent',
              border: '2px solid rgba(124, 179, 66, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(124, 179, 66, 0.3)',
              mt: 1
            }}
          >
            <img
              src="/hero.png?v=13"
              alt="StrainSpotter"
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
            />
          </Box>

          {/* Compact Title */}
          <Typography
            variant="h5"
            sx={{
              fontFamily: 'Poppins, sans-serif',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #9CCC65 0%, #7CB342 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontSize: '1.75rem',
              lineHeight: 1.2
            }}
          >
            StrainSpotter
          </Typography>

          <Typography
            variant="body2"
            sx={{
              color: '#b0b0b0',
              fontSize: '0.875rem',
              maxWidth: 300,
              lineHeight: 1.4
            }}
          >
            AI-Powered Cannabis Identification
          </Typography>

          {/* Compact Action Grid - 2x3 */}
          <Grid container spacing={1.5} sx={{ mt: 1, maxWidth: 400 }}>
            {/* Row 1 */}
            <Grid item xs={6}>
              <Button
                variant="contained"
                fullWidth
                onClick={() => setShowScan(true)}
                startIcon={<CameraAltIcon />}
                sx={{
                  py: 1.5,
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #7CB342 0%, #9CCC65 100%)',
                  boxShadow: '0 4px 12px rgba(124, 179, 66, 0.3)',
                  textTransform: 'none'
                }}
              >
                Scan
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => onNavigate('strains')}
                startIcon={<LocalFloristIcon />}
                sx={{
                  py: 1.5,
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  borderRadius: '12px',
                  border: '1.5px solid rgba(124, 179, 66, 0.5)',
                  color: '#9CCC65',
                  textTransform: 'none'
                }}
              >
                Browse
              </Button>
            </Grid>

            {/* Row 2 */}
            <Grid item xs={6}>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => onNavigate('dispensaries')}
                startIcon={<SpaIcon />}
                sx={{
                  py: 1.5,
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  borderRadius: '12px',
                  border: '1.5px solid rgba(124, 179, 66, 0.5)',
                  color: '#9CCC65',
                  textTransform: 'none'
                }}
              >
                Dispensaries
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => onNavigate('seeds')}
                startIcon={<ScienceIcon />}
                sx={{
                  py: 1.5,
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  borderRadius: '12px',
                  border: '1.5px solid rgba(124, 179, 66, 0.5)',
                  color: '#9CCC65',
                  textTransform: 'none'
                }}
              >
                Seeds
              </Button>
            </Grid>

            {/* Row 3 */}
            <Grid item xs={6}>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => onNavigate('groups')}
                startIcon={<VerifiedIcon />}
                sx={{
                  py: 1.5,
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  borderRadius: '12px',
                  border: '1.5px solid rgba(124, 179, 66, 0.5)',
                  color: '#9CCC65',
                  textTransform: 'none'
                }}
              >
                Groups
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => setShowGarden(true)}
                startIcon={<SpeedIcon />}
                sx={{
                  py: 1.5,
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  borderRadius: '12px',
                  border: '1.5px solid rgba(124, 179, 66, 0.5)',
                  color: '#9CCC65',
                  textTransform: 'none'
                }}
              >
                Garden
              </Button>
            </Grid>
          </Grid>

          {/* Compact Feature Cards - 2 columns */}
          <Grid container spacing={1.5} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <Card
                sx={{
                  background: 'rgba(44, 44, 44, 0.7)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(124, 179, 66, 0.2)',
                  borderRadius: 2,
                  p: 1.5
                }}
              >
                <Stack spacing={0.5} alignItems="center" textAlign="center">
                  <CameraAltIcon sx={{ fontSize: 28, color: '#9CCC65' }} />
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#fff', fontSize: '0.75rem' }}>
                    AI Scanning
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#b0b0b0', fontSize: '0.65rem', lineHeight: 1.3 }}>
                    Instant ID
                  </Typography>
                </Stack>
              </Card>
            </Grid>
            <Grid item xs={6}>
              <Card
                sx={{
                  background: 'rgba(44, 44, 44, 0.7)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(124, 179, 66, 0.2)',
                  borderRadius: 2,
                  p: 1.5
                }}
              >
                <Stack spacing={0.5} alignItems="center" textAlign="center">
                  <LocalFloristIcon sx={{ fontSize: 28, color: '#9CCC65' }} />
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#fff', fontSize: '0.75rem' }}>
                    35K+ Strains
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#b0b0b0', fontSize: '0.65rem', lineHeight: 1.3 }}>
                    Huge Database
                  </Typography>
                </Stack>
              </Card>
            </Grid>
            <Grid item xs={6}>
              <Card
                sx={{
                  background: 'rgba(44, 44, 44, 0.7)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(124, 179, 66, 0.2)',
                  borderRadius: 2,
                  p: 1.5
                }}
              >
                <Stack spacing={0.5} alignItems="center" textAlign="center">
                  <SpaIcon sx={{ fontSize: 28, color: '#9CCC65' }} />
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#fff', fontSize: '0.75rem' }}>
                    Find Vendors
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#b0b0b0', fontSize: '0.65rem', lineHeight: 1.3 }}>
                    Trusted Sources
                  </Typography>
                </Stack>
              </Card>
            </Grid>
            <Grid item xs={6}>
              <Card
                sx={{
                  background: 'rgba(44, 44, 44, 0.7)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(124, 179, 66, 0.2)',
                  borderRadius: 2,
                  p: 1.5
                }}
              >
                <Stack spacing={0.5} alignItems="center" textAlign="center">
                  <VerifiedIcon sx={{ fontSize: 28, color: '#9CCC65' }} />
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#fff', fontSize: '0.75rem' }}>
                    Verified Data
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#b0b0b0', fontSize: '0.65rem', lineHeight: 1.3 }}>
                    Accurate Info
                  </Typography>
                </Stack>
              </Card>
            </Grid>
          </Grid>
        </Stack>
      </Container>

      {/* Compact Feedback Button */}
      <Fab
        color="primary"
        size="small"
        onClick={() => setShowFeedback(true)}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 1000,
          background: 'linear-gradient(135deg, #7CB342 0%, #9CCC65 100%)',
          boxShadow: '0 4px 12px rgba(124, 179, 66, 0.3)',
          width: 48,
          height: 48
        }}
      >
        <FeedbackIcon fontSize="small" />
      </Fab>

      {/* Feedback Modal */}
      <FeedbackModal
        open={showFeedback}
        onClose={() => setShowFeedback(false)}
        user={null}
      />
    </Box>
  );
}
