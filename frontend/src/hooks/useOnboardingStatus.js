import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { API_BASE } from '../config';
import { useAuth } from './useAuth';

export function useOnboardingStatus() {
  const { session, user } = useAuth();
  const [status, setStatus] = useState({
    loading: true,
    error: null,
    onboardingRequired: false,
    needsDisplayName: false,
    needsRole: false,
    needsPersona: false,
    profile: null
  });

  const fetchStatus = useCallback(async () => {
    if (!user || !session?.access_token) {
      setStatus((prev) => ({
        ...prev,
        loading: false,
        onboardingRequired: false,
        profile: null,
        error: null
      }));
      return;
    }

    setStatus((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await fetch(`${API_BASE}/api/users/onboarding-status`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to load onboarding status');
      }
      const payload = await response.json();
      setStatus({
        loading: false,
        error: null,
        onboardingRequired: Boolean(payload.onboardingRequired),
        needsDisplayName: Boolean(payload.needsDisplayName),
        needsRole: Boolean(payload.needsRole),
        needsPersona: Boolean(payload.needsPersona),
        profile: payload.profile
      });
    } catch (err) {
      console.error('[useOnboardingStatus] Failed to load status:', err);
      setStatus((prev) => ({
        ...prev,
        loading: false,
        error: err.message || 'Failed to load onboarding status'
      }));
    }
  }, [user, session?.access_token]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return {
    ...status,
    refresh: fetchStatus
  };
}

