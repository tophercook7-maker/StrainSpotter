// frontend/src/components/Home.jsx

import { useState } from 'react';
import { Box, Button, Typography, Stack, Container, Fab } from '@mui/material';
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

  // Landing screen
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
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          pointerEvents: 'none',
          zIndex: 0,
        },
      }}
    >
      <Container maxWidth="xs" sx={{ position: 'relative', zIndex: 1, px: 3 }}>
        <Stack spacing={3} alignItems="center" textAlign="center">
          {/* Logo */}
          <Box
            sx={{
              width: 100,
              height: 100,
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
            variant="h4"
            sx={{
              fontFamily: 'Poppins, sans-serif',
              fontWeight: 900,
              background:
                'linear-gradient(135deg, #CDDC39 0%, #9CCC65 50%, #7CB342 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontSize: '2.5rem',
              lineHeight: 1.1,
              textShadow: '0 0 30px rgba(124, 179, 66, 0.5)',
              filter: 'drop-shadow(0 0 20px rgba(124, 179, 66, 0.4))',
            }}
          >
            StrainSpotter
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: '#d0d0d0',
              fontSize: '1rem',
              maxWidth: 320,
              lineHeight: 1.5,
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
            }}
          >
            AI-powered cannabis strain identification and grow journaling.
          </Typography>

          {/* Main Actions */}
          <Stack spacing={2} sx={{ width: '100%', maxWidth: 300, mt: 2 }}>
            {/* Primary: Scan */}
            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={handleScanClick}
              disabled={scanButtonBusy}
              sx={{
                mt: 2,
                py: 1.5,
                textTransform: 'none',
                fontSize: '1.05rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
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
              {scanButtonBusy ? 'Opening scanner…' : 'Scan'}
            </Button>

            {/* Secondary: Enter Garden */}
            <Button
              variant="outlined"
              size="large"
              fullWidth
              onClick={() => setShowGarden(true)}
              startIcon={<SpaIcon />}
              sx={{
                py: 2,
                fontSize: '1.1rem',
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

          {/* Tagline */}
          <Typography
            variant="caption"
            sx={{
              color: '#7CB342',
              fontSize: '0.875rem',
              fontWeight: 600,
              mt: 2,
            }}
          >
            35,000+ strains • Instant scan results • AI-powered matching
          </Typography>

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