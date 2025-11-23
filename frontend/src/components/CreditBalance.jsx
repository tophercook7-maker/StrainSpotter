import { Box, Chip, Tooltip, CircularProgress } from '@mui/material';
import BoltIcon from '@mui/icons-material/Bolt';
import { useCreditBalance } from '../hooks/useCreditBalance';
import { FOUNDER_EMAIL, FOUNDER_UNLIMITED_ENABLED } from '../config';
import { useAuth } from '../hooks/useAuth';

/**
 * Credit Balance Display Component
 * Shows user's remaining scan credits in the Garden header
 */
export default function CreditBalance({ summary: externalSummary, loading: externalLoading }) {
  const { user } = useAuth();
  const email = user?.email ?? null;
  const isFounder = FOUNDER_UNLIMITED_ENABLED && email === FOUNDER_EMAIL;
  const shouldUseExternal = typeof externalSummary !== 'undefined' || typeof externalLoading !== 'undefined';
  const { summary: internalSummary, loading: internalLoading } = useCreditBalance();

  const summary = shouldUseExternal ? externalSummary : internalSummary;
  const loading = shouldUseExternal ? !!externalLoading : internalLoading;
  const tierAliases = {
    premium: 'monthly_member',
    member: 'monthly_member',
    moderator: 'monthly_member'
  };
  const rawTier = summary?.tier ?? 'free';
  const tier = tierAliases[rawTier] || rawTier;
  const credits = summary?.creditsRemaining ?? null;
  const hasUnlimited = isFounder || Boolean(summary?.unlimited || summary?.isUnlimited || summary?.membershipTier === 'founder_unlimited' || tier === 'admin');

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CircularProgress size={20} sx={{ color: 'rgba(124, 179, 66, 0.8)' }} />
      </Box>
    );
  }

  if (credits === null && !hasUnlimited) {
    return null;
  }

  const getColor = () => {
    if (hasUnlimited) return 'primary';
    if (credits === 0) return 'error';
    if (credits <= 10) return 'warning';
    return 'success';
  };

  const getLabel = () => {
    if (hasUnlimited) return '∞ Scans';
    const displayCredits = credits === Infinity || credits === Number.POSITIVE_INFINITY ? '∞' : (credits ?? 0);
    return `${displayCredits} Scans`;
  };

  const getTooltip = () => {
    if (hasUnlimited) {
      if (summary?.membershipTier === 'founder_unlimited') {
        return 'Unlimited scans (Founder)';
      }
      return 'Unlimited scans (Admin)';
    }
    if (tier === 'free') return `${credits} free scans remaining`;
    if (tier === 'app_purchase') return `${credits} scans from your app unlock`;
    if (tier === 'monthly_member') {
      return `${credits} scans remaining (monthly allotment + top-ups)`;
    }
    return `${credits} scans remaining`;
  };

  return (
    <Tooltip title={getTooltip()} arrow>
      <Chip
        icon={<BoltIcon />}
        label={getLabel()}
        color={getColor()}
        size="small"
        sx={{
          fontWeight: 600,
          background: hasUnlimited
            ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(255, 165, 0, 0.2) 100%)'
            : undefined,
          backdropFilter: 'blur(10px)',
          border: hasUnlimited ? '1px solid rgba(255, 215, 0, 0.5)' : undefined,
          boxShadow: !hasUnlimited && credits <= 10
            ? '0 0 10px rgba(255, 152, 0, 0.4)'
            : undefined,
          animation: !hasUnlimited && credits === 0 ? 'pulse 2s ease-in-out infinite' : undefined,
          '@keyframes pulse': {
            '0%, 100%': { opacity: 1 },
            '50%': { opacity: 0.7 }
          }
        }}
      />
    </Tooltip>
  );
}

