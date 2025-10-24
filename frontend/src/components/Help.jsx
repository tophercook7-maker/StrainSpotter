import { Box, Container, Typography, Card, CardContent, Stack, Button, Alert, ButtonBase } from '@mui/material';
import CannabisLeafIcon from './CannabisLeafIcon';

export default function Help({ onNavigate, onBack }) {
  const tiles = [
    { key: 'scanner', title: 'Scanner', emoji: '📷', blurb: 'Snap bud or label for AI match' },
    { key: 'history', title: 'Scan History', emoji: '🕘', blurb: 'Revisit past scans & results' },
    { key: 'strains', title: 'Strain Browser', emoji: '🌿', blurb: 'Explore 35k+ strains' },
    { key: 'dispensaries', title: 'Dispensaries', emoji: '🛍️', blurb: 'Find nearby shops' },
    { key: 'seeds', title: 'Seeds', emoji: '🌱', blurb: 'Where to buy seed packs' },
    { key: 'grow-coach', title: 'Grow Coach', emoji: '📘', blurb: 'Step‑by‑step grow guide' },
    { key: 'groups', title: 'Groups & Chat', emoji: '💬', blurb: 'Talk with the community' },
    { key: 'friends', title: 'Friends', emoji: '👥', blurb: 'Add friends and connect' },
    { key: 'growers', title: 'Grower Directory', emoji: '🧑‍🌾', blurb: 'Discover local growers' },
    { key: 'membership', nav: 'membership-join', title: 'Membership', emoji: '💎', blurb: 'Unlimited scans & more' },
    { key: 'feedback', title: 'Feedback', emoji: '✉️', blurb: 'Send us ideas & issues' }
  ];

  const GlassTile = ({ title, emoji, onClick }) => (
    <ButtonBase
      disableRipple
      onClick={onClick}
      sx={{
        position: 'relative',
        borderRadius: 3,
        p: 0.5,
        // Little buttons
        minHeight: { xs: 72, sm: 84 },
        aspectRatio: '1 / 1',
        width: '100%',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1,
        // Single-layer, highly see-through glass
        background: 'rgba(20, 40, 30, 0.10)',
        border: '1px solid rgba(124,179,66,0.14)',
        backdropFilter: 'blur(3px)',
        boxShadow: '0 1px 8px rgba(0,0,0,0.10)',
        color: 'white',
        transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        outline: 'none',
        '&:focus-visible': { outline: 'none', boxShadow: 'none' },
        '&:hover': {
          transform: 'none',
          background: 'rgba(24, 52, 38, 0.12)',
          borderColor: 'rgba(124,179,66,0.18)',
          boxShadow: '0 2px 10px rgba(0,0,0,0.12)'
        }
      }}
    >
      <Box sx={{ 
        fontSize: { xs: 20, sm: 22 }, 
        lineHeight: 1,
        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
      }} aria-hidden>
        {emoji}
      </Box>
      <Typography 
        variant="subtitle2" 
        sx={{ 
          fontWeight: 700, 
          lineHeight: 1.3, 
          fontSize: { xs: '0.70rem', sm: '0.80rem' },
          textShadow: '0 1px 2px rgba(0,0,0,0.25), 0 0 12px rgba(124,179,66,0.15)',
          maxWidth: '90%'
        }}
      >
        {title}
      </Typography>

      {/* Leaf watermark */}
      <Box sx={{ position: 'absolute', bottom: 8, left: 8, opacity: 0.08 }} aria-hidden>
        <CannabisLeafIcon />
      </Box>
    </ButtonBase>
  );

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Stack spacing={3}>
          {onBack && (
            <Button onClick={onBack} size="small" variant="contained" sx={{ bgcolor: 'white', color: 'black', textTransform: 'none', fontWeight: 700, alignSelf: 'flex-start', borderRadius: 999, '&:hover': { bgcolor: 'grey.100' } }}>Home</Button>
          )}

          <Stack direction="row" spacing={1} alignItems="center">
            <CannabisLeafIcon />
            <Typography variant="h4" fontWeight="bold" color="primary.light">Help & How-To</Typography>
          </Stack>

          {/* Quick start: big glass tiles */}
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: {
                xs: 'repeat(2, minmax(0, 1fr))',
                sm: 'repeat(3, minmax(0, 1fr))',
                md: 'repeat(4, minmax(0, 1fr))'
              }
            }}
          >
            {tiles.map((t) => (
              <GlassTile
                key={t.key}
                title={t.title}
                emoji={t.emoji}
                onClick={() => onNavigate?.(t.nav || t.key)}
              />
            ))}
          </Box>

          {/* Deeper tips */}
          <Card sx={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(6px)' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Getting Started</Typography>
              <Stack spacing={1}>
                <Typography variant="body2"><strong>1. Create an Account:</strong> Tap the Account tile to sign up with email and password.</Typography>
                <Typography variant="body2"><strong>2. Enable Location:</strong> Allow location access for nearby dispensaries and grower directory.</Typography>
                <Typography variant="body2"><strong>3. Start Scanning:</strong> Tap the Scanner tile and take a photo of your cannabis to identify the strain.</Typography>
                <Typography variant="body2"><strong>4. Join the Community:</strong> Use Groups & Chat to connect with other cannabis enthusiasts.</Typography>
                <Typography variant="body2"><strong>5. Upgrade to Premium:</strong> Get unlimited scans, exclusive features, and support the app.</Typography>
              </Stack>
            </CardContent>
          </Card>

          <Card sx={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(6px)' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Scanning tips</Typography>
              <Stack spacing={1}>
                <Typography variant="body2">• Frame the whole bud inside the guide. Avoid extreme macro.</Typography>
                <Typography variant="body2">• Even lighting. Avoid glare and deep shadows.</Typography>
                <Typography variant="body2">• Include the label or strain name when possible.</Typography>
                <Typography variant="body2">• Try 2–3 angles of the same bud for richer features.</Typography>
              </Stack>
            </CardContent>
          </Card>

          <Card sx={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(6px)' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Common issues</Typography>
              <Stack spacing={1}>
                <Typography variant="subtitle2">No match or low confidence</Typography>
                <Typography variant="body2">Retake with better lighting and framing; include text if available.</Typography>
                <Typography variant="subtitle2" sx={{ mt: 1 }}>Upload error</Typography>
                <Typography variant="body2">Check connectivity and retry. Service may be briefly busy.</Typography>
                <Typography variant="subtitle2" sx={{ mt: 1 }}>Stuck on processing</Typography>
                <Typography variant="body2">Close and retry the scan. If repeated, wait a minute and try again.</Typography>
              </Stack>
            </CardContent>
          </Card>

          <Alert severity="info">
            Questions or suggestions? Use the Feedback tile to send us a message.
          </Alert>

          <Typography variant="caption" color="text.secondary">
            For privacy, login isn’t required. Select scans may be used to improve the service.
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}
