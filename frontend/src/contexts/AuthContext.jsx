import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { AuthContext } from './AuthContextValue.js';
import { API_BASE } from '../config.js';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('[AuthContext] Initial session:', session?.user?.email || 'none');
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[AuthContext] Auth state change:', event, session?.user?.email || 'none');
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Ensure user record exists in public.users table when signed in
        if (session?.user?.id && (event === 'SIGNED_IN' || event === 'USER_UPDATED')) {
          try {
            await fetch(`${API_BASE}/api/users/ensure`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                user_id: session.user.id,
                email: session.user.email,
                username: session.user.user_metadata?.username || session.user.email?.split('@')[0] || `user_${session.user.id.substring(0, 8)}`
              })
            });
            console.log('[AuthContext] User record ensured for:', session.user.email);
          } catch (err) {
            console.error('[AuthContext] Failed to ensure user record:', err);
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
      console.log('[AuthContext] User signed out');
    }
  };

  const value = {
    user,
    session,
    loading,
    signOut
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
