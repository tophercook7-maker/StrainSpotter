import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { API_BASE } from '../config';

/**
 * Hook to monitor membership status and prevent logout until payment is resolved
 * Returns: { isMember, isExpired, canLogout, user, loading }
 */
export function useMembershipGuard() {
  const [user, setUser] = useState(null);
  const [isMember, setIsMember] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkMembership = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user || null;
      setUser(currentUser);

      let inferredTier = null;

      if (currentUser?.id && session?.access_token) {
        try {
          const resp = await fetch(`${API_BASE}/api/credits/balance`, {
            headers: { Authorization: `Bearer ${session.access_token}` }
          });
          if (resp.ok) {
            const payload = await resp.json();
            inferredTier = payload?.tier || null;
          }
        } catch (err) {
          console.warn('useMembershipGuard: failed to fetch credit balance', err);
        }
      }

      if (!inferredTier && currentUser) {
        const metadataTier = (currentUser.user_metadata?.membership || '').toLowerCase();
        if (metadataTier.includes('club')) {
          inferredTier = 'monthly_member';
        }
      }

      const normalizedTier = (inferredTier || '').toLowerCase();
      const memberTiers = new Set(['monthly_member', 'admin']);

      setIsMember(memberTiers.has(normalizedTier));
      setIsExpired(false);
    } catch (e) {
      console.error('Membership check failed:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkMembership();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkMembership();
    });

    return () => subscription.unsubscribe();
  }, [checkMembership]);

  // Admin users can always logout
  // Regular users can only logout if they're not a member or if membership is not expired
  const adminEmails = new Set([
    'topher.cook7@gmail.com',
    'andrewbeck209@gmail.com',
    'strainspotter25feedback@gmail.com',
    'strainspotter25@gmail.com',
    'admin@strainspotter.com'
  ]);
  const isAdmin = adminEmails.has((user?.email || '').toLowerCase());
  const canLogout = isAdmin || !isMember || !isExpired;

  return {
    user,
    isMember,
    isExpired,
    canLogout,
    loading,
    refreshMembership: checkMembership
  };
}
