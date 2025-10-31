import { useState } from 'react';
import { Box, Button, Typography, Stack } from '@mui/material';
import ScanWizard from './ScanWizard';
import GardenGate from './GardenGate';
import Garden from './Garden';

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
        // User successfully joined/logged in, show garden dashboard
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
    <Box sx={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      p: 0,
      background: 'none',
    }}>
      <Box sx={{ textAlign: 'center', mt: 8, bgcolor: 'rgba(255,255,255,0.85)', borderRadius: 6, px: 4, py: 4, boxShadow: 3, display: 'inline-block' }}>
        <Box sx={{
          width: 220,
          height: 220,
          margin: '0 auto 24px auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#fff',
          borderRadius: 24,
          boxShadow: 2,
        }}>
          <img src="/hero.png" alt="hero" style={{ width: '80%', height: '80%', objectFit: 'contain', background: 'transparent', borderRadius: 16 }} />
        </Box>
        <Typography variant="h2" sx={{ fontWeight: 900, color: '#388e3c', mb: 1 }}>
          StrainSpotter
        </Typography>
        <Typography variant="h5" sx={{ color: '#222', fontWeight: 700, mb: 2 }}>
          AI Cannabis Scan: Reveal Your Strain
        </Typography>
        <Typography variant="body1" sx={{ color: '#444', fontWeight: 500, fontSize: 20, mb: 4 }}>
          Upload a photo of your cannabis plant or bud and let our AI deliver a full scientific breakdown—no hype, just next-gen genetics.
        </Typography>
        <Stack direction="row" spacing={3} justifyContent="center" sx={{ mt: 4 }}>
          <Button
            variant="contained"
            color="success"
            sx={{
              fontWeight: 700,
              borderRadius: 999,
              px: 6,
              py: 2,
              fontSize: 24,
              boxShadow: 'none',
              bgcolor: 'rgba(124, 179, 66, 0.3)',
              border: '2px solid rgba(124, 179, 66, 0.6)',
              backdropFilter: 'blur(10px)',
              color: '#fff',
              textTransform: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              '&:hover': {
                bgcolor: 'rgba(124, 179, 66, 0.5)',
                border: '2px solid rgba(124, 179, 66, 0.8)'
              }
            }}
            onClick={() => setShowScan(true)}
          >
            <img src="/hero.png" alt="hero" style={{ width: 32, height: 32, borderRadius: '50%', marginRight: 8, background: 'transparent' }} />
            Start AI Scan
          </Button>
          <Button
            variant="outlined"
            color="success"
            sx={{
              borderRadius: 999,
              px: 6,
              py: 2,
              fontWeight: 700,
              fontSize: 24,
              bgcolor: 'rgba(124, 179, 66, 0.2)',
              border: '2px solid rgba(124, 179, 66, 0.5)',
              backdropFilter: 'blur(10px)',
              color: '#fff',
              boxShadow: 'none',
              textTransform: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              '&:hover': {
                bgcolor: 'rgba(124, 179, 66, 0.3)',
                border: '2px solid rgba(124, 179, 66, 0.7)'
              }
            }}
            onClick={() => setShowGarden(true)}
          >
            <img src="/hero.png" alt="hero" style={{ width: 32, height: 32, borderRadius: '50%', marginRight: 8, background: 'transparent' }} />
            Enter the Garden
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}
