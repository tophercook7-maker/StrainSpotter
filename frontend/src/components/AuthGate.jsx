import React, { useState } from 'react';
import { useAuthRequired } from '../hooks/useAuthRequired';

// Props: supabase, children
export default function AuthGate({ supabase, children }) {
  const { user, loading, error } = useAuthRequired(supabase);
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [signInError, setSignInError] = useState(null);

  async function handleSignIn(e) {
    e.preventDefault();
    setSignInError(null);
    try {
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) throw error;
      setSent(true);
    } catch (err) {
      setSignInError(err.message || 'Sign-in failed');
    }
  }

  if (loading) return <div>Loading…</div>;
  if (error) return <div style={{ color: 'crimson' }}>Auth error: {error.message || String(error)}</div>;
  if (!user) {
    return (
      <div style={{ maxWidth: 320, margin: '2rem auto', padding: 24, border: '1px solid #ccc', borderRadius: 8 }}>
        <h2>Sign in to continue</h2>
        <form onSubmit={handleSignIn}>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Your email"
            required
            style={{ width: '100%', padding: 8, marginBottom: 12 }}
          />
          <button type="submit" style={{ width: '100%', padding: 8 }}>Send magic link</button>
        </form>
        {signInError && <div style={{ color: 'crimson', marginTop: 8 }}>{signInError}</div>}
        {sent && <div style={{ color: 'green', marginTop: 8 }}>Check your email for a sign-in link.</div>}
      </div>
    );
  }
  return <>{children}</>;
}