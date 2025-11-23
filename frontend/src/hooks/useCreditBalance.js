import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from './useAuth';
import { API_BASE } from '../config';
import { useProMode } from '../contexts/ProModeContext';

export function useCreditBalance() {
  const { user, session } = useAuth();
  const { isFounder, founderUnlimitedEnabled } = useProMode();
  const [state, setState] = useState({
    loading: true,
    error: null,
    remainingScans: 0,
    isUnlimited: false,
  });

  useEffect(() => {
    if (!user && !session) {
      setState({
        loading: false,
        error: null,
        remainingScans: 0,
        isUnlimited: false,
      });
      return;
    }

    // Short-circuit for founders BEFORE any network request
    if (isFounder && founderUnlimitedEnabled) {
      setState({
        loading: false,
        error: null,
        remainingScans: Infinity,
        isUnlimited: true,
      });
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const userId = user?.id || session?.user?.id;
        if (!userId) {
          setState(prev => ({
            ...prev,
            loading: false,
            error: 'No user ID available',
          }));
          return;
        }

        // Try to fetch from API endpoint instead of direct table access
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (!currentSession) {
          setState(prev => ({
            ...prev,
            loading: false,
            error: 'Not authenticated',
          }));
          return;
        }

        const response = await fetch(`${API_BASE}/api/credits/balance`, {
          headers: {
            'Authorization': `Bearer ${currentSession.access_token}`
          }
        });

        if (cancelled) return;

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.error || 'Unable to load credit balance');
        }

        const data = await response.json();
        const hasUnlimited = Boolean(data.unlimited || data.isUnlimited || data.tier === 'admin' || data.membershipTier === 'founder_unlimited');
        const remainingScans = hasUnlimited ? Number.POSITIVE_INFINITY : (data.creditsRemaining ?? 0);

        setState({
          loading: false,
          error: null,
          remainingScans: remainingScans,
          isUnlimited: hasUnlimited,
        });
      } catch (err) {
        if (cancelled) return;
        setState(prev => ({
          ...prev,
          loading: false,
          error: err?.message || String(err),
        }));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.email, session?.user?.id, session?.user?.email, isFounder, founderUnlimitedEnabled]);

  return state;
}
