import { useEffect, useMemo, useState } from 'react';
import { getMembershipStatus, canScanNow, trialCtaText, tryMeScan, verifySubscription } from '../lib/membership';

export function useMembership({ supabase }) {
  const [status, setStatus] = useState({ isMember: false, membership: 'none', userId: null, localTrialUses: 0, trialRemaining: 2 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const s = await getMembershipStatus({ supabase });
        if (mounted) setStatus(s);
      } catch (e) {
        if (mounted) setError(e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [supabase]);

  const gated = useMemo(() => ({
    canScan: canScanNow(status),
    cta: trialCtaText(status),
  }), [status]);

  return {
    status,
    loading,
    error,
    gated,
    async doTryMeScan({ imageBase64, signal } = {}) {
      setError(null);
      const result = await tryMeScan({ imageBase64, supabase, signal });
      const s = await getMembershipStatus({ supabase });
      setStatus(s);
      return result;
    },
    async doVerifySubscription({ payload, signal } = {}) {
      setError(null);
      const res = await verifySubscription({ payload, supabase, signal });
      const s = await getMembershipStatus({ supabase });
      setStatus(s);
      return res;
    },
  };
}
