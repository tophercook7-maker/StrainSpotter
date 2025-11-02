import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

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

      if (currentUser) {
        const membership = currentUser.user_metadata?.membership;
        const membershipStarted = currentUser.user_metadata?.membership_started;
        
        setIsMember(membership === 'club');

        // Check if membership is expired (example: 30 days grace period)
        if (membership === 'club' && membershipStarted) {
          const startDate = new Date(membershipStarted);
          const now = new Date();
          const daysSinceStart = (now - startDate) / (1000 * 60 * 60 * 24);
          
          // If more than 30 days and no payment, mark as expired
          // In production, this would check actual subscription status from payment provider
          setIsExpired(daysSinceStart > 30);
        }
      } else {
        setIsMember(false);
        setIsExpired(false);
      }
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

  // User can only logout if they're not a member or if membership is not expired
  const canLogout = !isMember || !isExpired;

  return {
    user,
    isMember,
    isExpired,
    canLogout,
    loading,
    refreshMembership: checkMembership
  };
}
