// Frontend membership helpers: status, trial scans, purchase verification
// Assumptions:
// - Membership flag stored on user metadata: user.user_metadata.membership === 'club'
// - Trial usage tracked both server-side (Edge Function) and locally (localStorage fallback)
// - Edge Functions deployed: try-me, verify-subscription

import { FUNCTIONS_BASE } from '../config';

const LOCAL_TRIAL_KEY = 'ss_trial_uses_v1';

export function getLocalTrialUses() {
  try {
    return parseInt(localStorage.getItem(LOCAL_TRIAL_KEY) || '0', 10);
  } catch {
    return 0;
  }
}

export function setLocalTrialUses(n) {
  try {
    localStorage.setItem(LOCAL_TRIAL_KEY, String(n));
  } catch {}
}

export function incLocalTrialUses() {
  const n = getLocalTrialUses() + 1;
  setLocalTrialUses(n);
  return n;
}

// Determine membership from Supabase user session (preferred) with local trial fallback
export async function getMembershipStatus({ supabase }) {
  let isMember = false;
  let membership = 'none';
  let userId = null;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      userId = user.id;
      membership = user.user_metadata?.membership || 'none';
      isMember = membership === 'club';
    }
  } catch {}

  // Local fallback for trial count; server remains source of truth when calling try-me
  const localTrial = getLocalTrialUses();
  const trialRemaining = Math.max(0, 2 - localTrial);

  return { isMember, membership, userId, localTrialUses: localTrial, trialRemaining };
}

// Try-Me scan via Edge Function
// imageBase64: data URL (data:image/jpeg;base64,...) or raw base64 string
export async function tryMeScan({ imageBase64, supabase, signal }) {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(`${FUNCTIONS_BASE}/try-me`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    },
    body: JSON.stringify({ imageBase64 }),
    signal,
  });

  const json = await res.json().catch(() => ({ error: 'invalid_json' }));
  if (!res.ok) {
    // Update local trial counter only if server confirms a trial attempt
    if (json?.code === 'TRIAL_LIMIT' || json?.trialUsed) {
      incLocalTrialUses();
    }
    const message = json?.message || 'Trial scan not available';
    const error = new Error(message);
    error.code = json?.code || 'TRIAL_ERROR';
    error.details = json;
    throw error;
  }

  // Successful trial attempt; increment local counter if server marks it as used
  if (json?.trialUsed) incLocalTrialUses();
  return json; // expected: { bestMatch, matches, vision, trialRemaining, membership }
}

// Verify a purchase with the Edge Function; on success backend will upsert membership
// payload depends on platform: { platform: 'apple'|'google', receipt: string } or token fields
export async function verifySubscription({ payload, supabase, signal }) {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(`${FUNCTIONS_BASE}/verify-subscription`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    },
    body: JSON.stringify(payload),
    signal,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(json?.message || 'Subscription verification failed');
    error.details = json;
    throw error;
  }
  // Optionally refresh session to pick up updated user_metadata.membership
  try { await supabase.auth.refreshSession(); } catch {}
  return json; // expected: { status: 'active', membership: 'club' }
}

export function canScanNow(status) {
  if (status.isMember) return true;
  return status.trialRemaining > 0;
}

export function trialCtaText(status) {
  if (status.isMember) return 'Scan now';
  if (status.trialRemaining <= 0) return 'Join StrainSpotter Club to keep scanning';
  return `Try Me (${status.trialRemaining} left)`;
}
