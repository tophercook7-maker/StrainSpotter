import { Box, Button, Container, Stack, Typography, Chip } from '@mui/material';
import LeafIcon from '@mui/icons-material/Spa';

export default function Home({ onNavigate }) {
  return (
    <Box sx={{ position: 'relative', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Hero background */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'url(/hero.png)',
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

      <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1, py: { xs: 10, md: 16 } }}>
        <Stack spacing={3} alignItems="center" textAlign="center">
          <Chip icon={<LeafIcon />} label="Cannabis AI" color="success" variant="outlined" sx={{ bgcolor: 'rgba(76,175,80,0.12)', borderColor: 'rgba(76,175,80,0.35)', color: 'success.light' }} />
          <Typography variant="h2" sx={{ fontWeight: 800, letterSpacing: -0.5 }}>
            StrainSpotter
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 720 }}>
            Identify strains from labels and plants, explore a living database, and grow with the community.
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ pt: 1 }}>
            <Button size="large" variant="contained" color="primary" onClick={() => onNavigate('scanner')}>
              Scan Now
            </Button>
            <Button size="large" variant="outlined" color="secondary" onClick={() => onNavigate('history')}>
              View History
            </Button>
            <Button size="large" variant="outlined" color="success" onClick={() => onNavigate('dev')}>
              Dev Dashboard
            </Button>
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ pt: 4, opacity: 0.95 }}>
            <Button variant="text" color="inherit" onClick={() => onNavigate('feedback')}>
              Leave Feedback
            </Button>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
