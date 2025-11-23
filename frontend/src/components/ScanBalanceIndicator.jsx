import { useMemo } from 'react';
import { Alert, Chip, Stack, Button, CircularProgress } from '@mui/material';
import BoltIcon from '@mui/icons-material/Bolt';
import { useCreditBalance } from '../hooks/useCreditBalance';
import { FOUNDER_EMAIL } from '../config';
import { useAuth } from '../hooks/useAuth';

export default function ScanBalanceIndicator({ onBuyCredits }) {
  const { user } = useAuth();
  const { summary, loading, refresh } = useCreditBalance();
  const email = user?.email ?? null;
  const isFounder = email === FOUNDER_EMAIL;
  const hasUnlimited = isFounder || Boolean(summary?.unlimited || summary?.isUnlimited || summary?.membershipTier === 'founder_unlimited' || summary?.tier === 'admin');

  const state = useMemo(() => {
    if (!summary) return null;
    if (hasUnlimited) return 'unlimited';
    const credits = summary.creditsRemaining ?? 0;
    if (credits <= 0) return 'empty';
    if (credits <= 5) return 'low';
    return 'ok';
  }, [summary, hasUnlimited]);

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
        label={hasUnlimited ? 'Unlimited scans' : `Scans left: ${summary.creditsRemaining === Infinity || summary.creditsRemaining === Number.POSITIVE_INFINITY ? '∞' : (summary.creditsRemaining ?? 0)}`}
        color={hasUnlimited ? 'primary' : (state === 'ok' ? 'success' : state === 'low' ? 'warning' : 'default')}
        variant="outlined"
        onClick={refresh}
        sx={hasUnlimited ? {
          background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(255, 165, 0, 0.2) 100%)',
          border: '1px solid rgba(255, 215, 0, 0.5)'
        } : undefined}
      />
      {state === 'low' && !hasUnlimited && (
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
      {state === 'empty' && !hasUnlimited && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={onBuyCredits}>
              Add scans
            </Button>
          }
        >
          You're out of scans. Add a top-up pack or upgrade membership.
        </Alert>
      )}
    </Stack>
  );
}


