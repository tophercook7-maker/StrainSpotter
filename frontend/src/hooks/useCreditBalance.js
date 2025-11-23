import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { API_BASE } from '../config';
import { useAuth } from './useAuth';

const FOUNDER_EMAIL = 'topher.cook7@gmail.com';

/**
 * Apply founder override to credit state if user is founder
 */
export function applyFounderOverride(session, creditState) {
  if (!session || !session.user) return creditState;
  
  const email = session.user.email;
  
  if (email === FOUNDER_EMAIL) {
    return {
      ...creditState,
      canScan: true,
      unlimited: true,
      remainingScans: Infinity,
      creditsRemaining: Infinity,
      membershipTier: 'founder_unlimited',
      tier: 'admin',
      isUnlimited: true,
      override: 'founder',
      message: 'Founder account — unlimited scans active'
    };
  }
  
  return creditState;
}

export function useCreditBalance() {
  const { session } = useAuth();
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
      const hasUnlimited = Boolean(data.unlimited || data.isUnlimited || data.tier === 'admin' || data.membershipTier === 'founder_unlimited');
      const creditState = {
        tier: data.tier,
        creditsRemaining: hasUnlimited ? Number.POSITIVE_INFINITY : (data.creditsRemaining ?? 0),
        monthlyLimit: data.monthlyLimit,
        usedThisMonth: data.usedThisMonth,
        lifetimeScansUsed: data.lifetimeScansUsed,
        resetAt: data.resetAt,
        bonusCredits: data.bonusCredits ?? data.bonus_credits ?? 0,
        isUnlimited: hasUnlimited,
        unlimited: hasUnlimited,
        membershipTier: data.membershipTier,
        needsUpgrade: hasUnlimited ? false : Boolean(data.needsUpgrade),
        canScan: hasUnlimited || (data.creditsRemaining ?? 0) > 0,
        remainingScans: hasUnlimited ? Number.POSITIVE_INFINITY : (data.creditsRemaining ?? 0)
      };
      
      // Apply founder override
      const finalState = applyFounderOverride(session, creditState);
      setSummary(finalState);
    } catch (err) {
      console.error('useCreditBalance error:', err);
      setError(err.message || 'Unable to load credits');
      
      // Even on error, apply founder override if applicable
      if (session?.user?.email === FOUNDER_EMAIL) {
        const founderState = applyFounderOverride(session, {
          tier: 'admin',
          creditsRemaining: Infinity,
          monthlyLimit: 999999,
          usedThisMonth: 0,
          lifetimeScansUsed: 0,
          resetAt: null,
          bonusCredits: 0,
          isUnlimited: true,
          unlimited: true,
          membershipTier: 'founder_unlimited',
          needsUpgrade: false,
          canScan: true,
          remainingScans: Infinity
        });
        setSummary(founderState);
      } else {
        setSummary(null);
      }
    } finally {
      setLoading(false);
    }
  }, [session]);

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

