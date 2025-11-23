import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { API_BASE, FOUNDER_EMAIL, FOUNDER_UNLIMITED_ENABLED } from '../config';
import { useAuth } from './useAuth';

/**
 * Apply founder override to credit state if user is founder
 */
export function applyFounderOverride(session, creditState) {
  if (!session || !session.user) return creditState;
  
  const email = session.user.email;
  const isFounder = FOUNDER_UNLIMITED_ENABLED && email === FOUNDER_EMAIL;
  
  if (isFounder) {
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
  // Get founder flags from AuthContext - this ensures isFounder is always defined
  const { session, isFounder: isFounderFromContext, FOUNDER_UNLIMITED_ENABLED: FOUNDER_UNLIMITED_ENABLED_FROM_CONTEXT } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Use founder flags from context, with fallback to local calculation for safety
  const email = session?.user?.email ?? null;
  const FOUNDER_EMAILS = [FOUNDER_EMAIL];
  const isFounderLocal = email ? FOUNDER_EMAILS.includes(email.toLowerCase()) : false;
  // Prefer context value, fallback to local calculation
  const isFounder = isFounderFromContext !== undefined ? Boolean(isFounderFromContext) : isFounderLocal;
  const FOUNDER_UNLIMITED_ENABLED_VALUE = FOUNDER_UNLIMITED_ENABLED_FROM_CONTEXT !== undefined ? Boolean(FOUNDER_UNLIMITED_ENABLED_FROM_CONTEXT) : FOUNDER_UNLIMITED_ENABLED;
  const effectiveUnlimited = FOUNDER_UNLIMITED_ENABLED_VALUE && isFounder;

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(null);

    // If founder, set unlimited credits immediately and skip API call
    // This short-circuits all credit checks for founders
    if (isFounder && session) {
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
      setLoading(false);
      return;
    }

    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();

      if (!currentSession) {
        setSummary(null);
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE}/api/credits/balance`, {
        headers: {
          'Authorization': `Bearer ${currentSession.access_token}`
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
      const finalState = applyFounderOverride(currentSession, creditState);
      setSummary(finalState);
    } catch (err) {
      console.error('useCreditBalance error:', err);
      setError(err.message || 'Unable to load credits');
      
      // Even on error, apply founder override if applicable
      // Founders should always have unlimited credits, even if API fails
      if (isFounder && session) {
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
  }, [session, isFounder, FOUNDER_UNLIMITED_ENABLED_VALUE, email]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return {
    summary,
    loading,
    error,
    refresh: fetchSummary,
    isFounder, // Export isFounder so components can use it
    canScan: isFounder || (summary?.canScan ?? false) // Short-circuit: founders can always scan
  };
}

