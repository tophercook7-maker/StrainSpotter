import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { API_BASE } from '../config';

export function useCreditBalance() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setSummary(null);
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE}/api/credits/balance`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Unable to load credit balance');
      }

      const data = await response.json();
      setSummary({
        tier: data.tier,
        creditsRemaining: data.creditsRemaining,
        monthlyLimit: data.monthlyLimit,
        usedThisMonth: data.usedThisMonth,
        lifetimeScansUsed: data.lifetimeScansUsed,
        resetAt: data.resetAt,
        bonusCredits: data.bonusCredits ?? data.bonus_credits ?? 0,
        isUnlimited: Boolean(data.isUnlimited || data.tier === 'admin'),
        needsUpgrade: Boolean(data.needsUpgrade)
      });
    } catch (err) {
      console.error('useCreditBalance error:', err);
      setError(err.message || 'Unable to load credits');
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return {
    summary,
    loading,
    error,
    refresh: fetchSummary
  };
}

