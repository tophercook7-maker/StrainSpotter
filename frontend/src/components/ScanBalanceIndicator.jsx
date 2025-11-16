import { useMemo } from 'react';
import { Alert, Chip, Stack, Button, CircularProgress } from '@mui/material';
import BoltIcon from '@mui/icons-material/Bolt';
import { useCreditBalance } from '../hooks/useCreditBalance';

export default function ScanBalanceIndicator({ onBuyCredits }) {
  const { summary, loading, refresh } = useCreditBalance();

  const state = useMemo(() => {
    if (!summary) return null;
    const credits = summary.creditsRemaining ?? 0;
    if (credits <= 0) return 'empty';
    if (credits <= 5) return 'low';
    return 'ok';
  }, [summary]);

  if (loading) {
    return (
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
        <CircularProgress size={16} />
        <Chip size="small" icon={<BoltIcon />} label="Checking credits…" />
      </Stack>
    );
  }

  if (!summary) return null;

  return (
    <Stack spacing={1} sx={{ mb: 2 }}>
      <Chip
        icon={<BoltIcon />}
        label={`Scans left: ${summary.creditsRemaining ?? 0}`}
        color={state === 'ok' ? 'success' : state === 'low' ? 'warning' : 'default'}
        variant="outlined"
        onClick={refresh}
      />
      {state === 'low' && (
        <Alert
          severity="warning"
          action={
            <Button color="inherit" size="small" onClick={onBuyCredits}>
              Buy top-up
            </Button>
          }
        >
          Only a few scans remaining. Top up before your next session.
        </Alert>
      )}
      {state === 'empty' && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={onBuyCredits}>
              Add scans
            </Button>
          }
        >
          You’re out of scans. Add a top-up pack or upgrade membership.
        </Alert>
      )}
    </Stack>
  );
}


