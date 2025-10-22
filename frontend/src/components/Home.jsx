
import { useEffect, useState } from 'react';
import { Box, Button, Stack, Typography, Chip, Dialog, IconButton } from '@mui/material';
import CannabisLeafIcon from './CannabisLeafIcon';
import { isAuthConfigured } from '../supabaseClient';
import DevDashboard from './DevDashboard';

export default function Home({ onNavigate }) {
  const [strainCount, setStrainCount] = useState(null);
  const [showDev, setShowDev] = useState(false);
  const isDev = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  useEffect(() => {
    fetch(`${window.FUNCTIONS_BASE || '/functions'}/strains-count`)
      .then(r => r.json())
      .then(data => setStrainCount(data.count))
      .catch(() => setStrainCount(null));
  }, []);

  return (
    <Box sx={{ position: 'relative', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Hero background */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'url(/strainspotter-bg.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'saturate(1.05) contrast(1.02)',
        }}
      />
      {/* Gradient overlay */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(6,15,6,0.70) 0%, rgba(10,25,10,0.85) 55%, rgba(10,25,10,1) 100%)',
          backdropFilter: 'blur(2px)',
        }}
      />

      <Box maxWidth="md" sx={{ position: 'relative', zIndex: 1, py: { xs: 10, md: 16 }, mx: 'auto' }}>
        <Stack spacing={3} alignItems="center" textAlign="center">
          {/* Hero icon with long-press-to-enter-dev */}
          <Box
            sx={{ cursor: 'pointer', mb: 1 }}
            onClick={() => (isDev ? setShowDev(true) : onNavigate('help'))}
            onPointerDown={e => {
              if (e.pointerType === 'touch' || e.pointerType === 'mouse') {
                e.target._pressTimer = setTimeout(() => {
                  setShowDev(true);
                }, 1200);
              }
            }}
            onPointerUp={e => {
              clearTimeout(e.target._pressTimer);
            }}
            onPointerLeave={e => {
              clearTimeout(e.target._pressTimer);
            }}
            aria-label="StrainSpotter Hero Icon"
          >
            <img
              src="/hero.png"
              alt="StrainSpotter Hero"
              style={{ width: 72, height: 72, filter: 'drop-shadow(0 0 12px #4caf50aa)' }}
              draggable={false}
            />
          </Box>
          <Chip icon={<CannabisLeafIcon size={20} />} label="Cannabis AI" color="success" variant="outlined" sx={{ bgcolor: 'rgba(76,175,80,0.12)', borderColor: 'rgba(76,175,80,0.35)', color: 'success.light' }} />
          <Typography variant="h2" sx={{ fontWeight: 800, letterSpacing: -0.5 }}>
            StrainSpotter
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 720 }}>
            Identify strains from labels and plants, explore a living database, and grow with the community.
          </Typography>

          {strainCount !== null && (
            <Typography variant="h5" color="primary" sx={{ fontWeight: 700, mt: 2 }}>
              {strainCount.toLocaleString()} strains in our database
            </Typography>
          )}

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ pt: 1 }}>
            <Button size="large" variant="contained" color="primary" sx={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(2px)', border: '1.5px solid #fff', color: '#fff', fontWeight: 700, boxShadow: 3 }} onClick={() => onNavigate('guest-scan')}>
              Try It Now
            </Button>
            <Button size="large" variant="outlined" color="secondary" sx={{ background: 'rgba(255,255,255,0.10)', border: '1.5px solid #fff', color: '#fff', fontWeight: 700 }} onClick={() => onNavigate(isAuthConfigured() ? 'login' : 'scanner')}>
              Sign In & Scan
            </Button>
            <Button size="large" variant="outlined" color="secondary" onClick={() => onNavigate('history')}>
              View History
            </Button>
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ pt: 4, opacity: 0.95 }}>
            <Button variant="text" color="inherit" onClick={() => onNavigate('feedback')}>
              Leave Feedback
            </Button>
          </Stack>

          <Box sx={{ mt: 4, p: 2, borderRadius: 2, bgcolor: 'background.paper', boxShadow: 2, maxWidth: 420, mx: 'auto', opacity: 0.98 }}>
            <Typography variant="body1" color="text.secondary">
              <b>Unlock full access:</b> Subscribe to view all strains, details, and advanced features. Only paid members can browse the full database.
            </Typography>
          </Box>
        </Stack>
      </Box>

      {/* Hidden Dev Dashboard Dialog */}
      {isDev && (
      <Dialog open={showDev} onClose={() => setShowDev(false)} maxWidth="md" fullWidth>
        <Box sx={{ p: 2, position: 'relative' }}>
          <IconButton onClick={() => setShowDev(false)} sx={{ position: 'absolute', top: 8, right: 8 }}>
            ×
          </IconButton>
          <DevDashboard />
        </Box>
      </Dialog>
      )}
    </Box>
  );
}
