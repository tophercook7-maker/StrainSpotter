import { Box, Button, Typography, Stack } from '@mui/material';
import CannabisLeafIcon from './CannabisLeafIcon';
import { useMembership } from '../membership/MembershipContext';

function featureLabel(featureKey) {
  switch (featureKey) {
    case 'garden':
      return 'Garden';
    case 'reviews':
      return 'Reviews';
    case 'logbook':
      return 'Logbook';
    default:
      return 'This feature';
  }
}

export default function FeatureGate({ featureKey, children }) {
  const {
    isMember,
    totalAvailableScans,
    requestMembershipPurchase,
    requestTopupPurchase,
  } = useMembership();
  const label = featureLabel(featureKey);

  if (isMember) {
    return children;
  }

  return (
    <Box
      sx={{
        maxWidth: 520,
        mx: 'auto',
        mt: 5,
        p: 3,
        borderRadius: 3,
        border: '1px solid rgba(134, 239, 172, 0.5)',
        background:
          'radial-gradient(circle at top, rgba(16, 185, 129, 0.16), rgba(10, 15, 10, 0.96))',
        boxShadow: '0 0 24px rgba(16, 185, 129, 0.35)',
        textAlign: 'center',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
        <CannabisLeafIcon sx={{ fontSize: 40, color: '#4caf50' }} />
      </Box>
      <Typography variant="h5" sx={{ mb: 1, fontWeight: 700 }}>
        Members Only
      </Typography>
      <Typography
        variant="body1"
        sx={{ mb: 1.5, color: 'rgba(255,255,255,0.9)' }}
      >
        {label} unlocks when you join StrainSpotter as a member.
      </Typography>
      <Typography
        variant="body2"
        sx={{ mb: 2.5, color: 'rgba(255,255,255,0.7)' }}
      >
        Members get unlimited scans plus full access to Garden, Reviews, and
        Logbook tools to track grows, stash, and sessions.
      </Typography>

      <Stack
        direction="row"
        spacing={1.5}
        sx={{ justifyContent: 'center', flexWrap: 'wrap' }}
      >
        <Button
          variant="contained"
          size="large"
          onClick={requestMembershipPurchase}
          sx={{
            borderRadius: 999,
            px: 4,
            py: 1.1,
            textTransform: 'none',
            fontWeight: 700,
            background: 'linear-gradient(135deg, #4caf50, #8bc34a)',
            boxShadow: '0 0 18px rgba(76, 175, 80, 0.6)',
          }}
        >
          Unlock membership
        </Button>
        <Button
          variant="outlined"
          size="large"
          onClick={() => requestTopupPurchase('pack_20')}
          sx={{
            borderRadius: 999,
            px: 3,
            py: 1.1,
            textTransform: 'none',
            fontWeight: 600,
            borderColor: 'rgba(148, 163, 184, 0.8)',
            color: 'rgba(226, 232, 240, 0.95)',
          }}
        >
          Just buy scans
        </Button>
      </Stack>

      <Typography
        variant="caption"
        sx={{ display: 'block', mt: 2, color: 'rgba(148,163,184,0.8)' }}
      >
        You can keep scanning with top-ups even without membership, but members
        always get the best experience.
      </Typography>

      {totalAvailableScans > 0 && (
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            mt: 0.75,
            color: 'rgba(190, 242, 100, 0.9)',
          }}
        >
          You still have some scan credits left for the scanner.
        </Typography>
      )}
    </Box>
  );
}
