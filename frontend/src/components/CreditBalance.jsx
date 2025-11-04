import { useState, useEffect } from 'react';
import { Box, Chip, Tooltip, CircularProgress } from '@mui/material';
import { Bolt as BoltIcon } from '@mui/icons-material';
import { supabase } from '../supabaseClient';

/**
 * Credit Balance Display Component
 * Shows user's remaining scan credits in the Garden header
 */
export default function CreditBalance() {
  const [credits, setCredits] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tier, setTier] = useState('free');

  useEffect(() => {
    fetchCredits();
  }, []);

  const fetchCredits = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setLoading(false);
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/credits/balance`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCredits(data.creditsRemaining);
        setTier(data.tier);
      }
    } catch (error) {
      console.error('Failed to fetch credits:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CircularProgress size={20} sx={{ color: 'rgba(124, 179, 66, 0.8)' }} />
      </Box>
    );
  }

  if (credits === null) {
    return null;
  }

  // Determine color based on credits remaining
  const getColor = () => {
    if (tier === 'admin') return 'primary';
    if (credits === 0) return 'error';
    if (credits <= 5) return 'warning';
    return 'success';
  };

  // Determine label
  const getLabel = () => {
    if (tier === 'admin') return '∞ Scans';
    return `${credits} Scans`;
  };

  // Determine tooltip
  const getTooltip = () => {
    if (tier === 'admin') return 'Unlimited scans (Admin)';
    if (tier === 'free') return `${credits} free scans remaining`;
    if (tier === 'member') return `${credits} scans remaining this month (Member)`;
    if (tier === 'premium') return `${credits} scans remaining this month (Premium)`;
    if (tier === 'moderator') return `${credits} scans remaining this month (Moderator)`;
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
          background: tier === 'admin' 
            ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(255, 165, 0, 0.2) 100%)'
            : undefined,
          backdropFilter: 'blur(10px)',
          border: tier === 'admin' ? '1px solid rgba(255, 215, 0, 0.5)' : undefined,
          boxShadow: credits <= 5 && tier !== 'admin' 
            ? '0 0 10px rgba(255, 152, 0, 0.5)' 
            : undefined,
          animation: credits === 0 ? 'pulse 2s ease-in-out infinite' : undefined,
          '@keyframes pulse': {
            '0%, 100%': { opacity: 1 },
            '50%': { opacity: 0.7 }
          }
        }}
      />
    </Tooltip>
  );
}

