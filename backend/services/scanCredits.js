import { supabase } from '../supabaseClient.js';
import { supabaseAdmin } from '../supabaseAdmin.js';

const db = supabaseAdmin ?? supabase;

const DEFAULT_STARTER_BUNDLE = Number(process.env.SCAN_STARTER_BUNDLE || 20);
const DEFAULT_MEMBERSHIP_BUNDLE = Number(process.env.SCAN_MEMBERSHIP_BUNDLE || 30);
const DEFAULT_MODERATOR_BUNDLE = Number(process.env.SCAN_MODERATOR_BUNDLE || 15);
const BUNDLE_RESET_DAYS = Number(process.env.SCAN_BUNDLE_RESET_DAYS || 30);
const STARTER_ACCESS_DAYS = Number(process.env.SCAN_STARTER_DAYS || 3);
const DAY_MS = 86_400_000;

export async function fetchProfile(userId) {
  const { data, error } = await db
    .from('profiles')
    .select('user_id, scan_credits, scan_credits_reset_at, scan_credits_monthly_bundle')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw new Error(`[scanCredits] Failed to fetch profile: ${error.message}`);
  if (!data) throw new Error('[scanCredits] Profile not found for user');
  return data;
}

export async function fetchMembership(userId) {
  const { data, error } = await db
    .from('memberships')
    .select('status, tier, comped, comped_reason, expires_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw new Error(`[scanCredits] Failed to fetch membership: ${error.message}`);
  return data;
}

export async function fetchProfileAndMembership(userId) {
  const [profile, membership] = await Promise.all([
    fetchProfile(userId),
    fetchMembership(userId)
  ]);
  return { profile, membership };
}

export function isMembershipActive(membership) {
  if (!membership) return false;
  if (membership.status !== 'active') return false;
  if (membership.expires_at) {
    const expiresAt = new Date(membership.expires_at);
    if (Number.isFinite(expiresAt.getTime()) && expiresAt <= new Date()) {
      return false;
    }
  }
  return true;
}

export function resolveMembershipBundle(membership) {
  if (!membership) return 0;
  if (membership.status !== 'active') return 0;
  if (!membership.tier) return 0;
  if (membership.comped_reason === 'grower-moderator') {
    return DEFAULT_MODERATOR_BUNDLE;
  }
  if (membership.comped_reason === 'owner' || membership.comped_reason === 'admin') {
    return DEFAULT_MEMBERSHIP_BUNDLE;
  }
  if (membership.tier === 'full-access' || membership.tier === 'full' || membership.tier === 'premium') {
    return DEFAULT_MEMBERSHIP_BUNDLE;
  }
  return 0;
}

export async function ensureMonthlyBundle(userId, context = {}) {
  let profile = context.profile ?? null;
  let membership = context.membership ?? null;

  if (!profile || !membership) {
    const combined = await fetchProfileAndMembership(userId);
    profile = profile ?? combined.profile;
    membership = membership ?? combined.membership;
  }

  const bundleAmount = resolveMembershipBundle(membership);

  if (!bundleAmount) {
    // ensure monthly bundle metadata cleared so stale values are not used
    if (profile.scan_credits_monthly_bundle !== 0) {
      await db
        .from('profiles')
        .update({
          scan_credits_monthly_bundle: 0
        })
        .eq('user_id', userId);
      profile = {
        ...profile,
        scan_credits_monthly_bundle: 0
      };
    }
    return { profile, membership, bundleAmount, resetApplied: false };
  }

  const now = new Date();
  const lastReset = profile.scan_credits_reset_at ? new Date(profile.scan_credits_reset_at) : null;
  const shouldReset = !lastReset || (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24) >= BUNDLE_RESET_DAYS;

  if (shouldReset) {
    await grantScanCredits(userId, bundleAmount, 'membership-reset', { bundle: bundleAmount });
    await db
      .from('profiles')
      .update({
        scan_credits_reset_at: now.toISOString(),
        scan_credits_monthly_bundle: bundleAmount
      })
      .eq('user_id', userId);
    profile = await fetchProfile(userId);
    return { profile, membership, bundleAmount, resetApplied: true };
  } else if (profile.scan_credits_monthly_bundle !== bundleAmount) {
    await db
      .from('profiles')
      .update({ scan_credits_monthly_bundle: bundleAmount })
      .eq('user_id', userId);
    profile = {
      ...profile,
      scan_credits_monthly_bundle: bundleAmount
    };
  }

  return { profile, membership, bundleAmount, resetApplied: false };
}

export async function grantScanCredits(userId, amount, reason, metadata = null) {
  if (!userId) throw new Error('[scanCredits] userId required for grant');
  if (amount <= 0) return;
  const { error } = await db.rpc('grant_scan_credits', {
    p_user_id: userId,
    p_amount: amount,
    p_reason: reason,
    p_metadata: metadata
  });
  if (error) throw new Error(`[scanCredits] Failed to grant credits: ${error.message}`);
}

export async function consumeScanCredits(userId, amount, metadata = null) {
  if (!userId) throw new Error('[scanCredits] userId required for consume');
  if (amount <= 0) return { success: true };

  const { profile, membership } = await ensureMonthlyBundle(userId);
  const membershipActive = isMembershipActive(membership);

  let accessExpiresAt = null;
  if (!membershipActive) {
    const now = new Date();
    const resetAt = profile.scan_credits_reset_at ? new Date(profile.scan_credits_reset_at) : null;
    if (!resetAt || Number.isNaN(resetAt.getTime())) {
      // initialize starter window on first use
      const nowIso = now.toISOString();
      await db
        .from('profiles')
        .update({ scan_credits_reset_at: nowIso })
        .eq('user_id', userId);
      accessExpiresAt = new Date(now.getTime() + STARTER_ACCESS_DAYS * DAY_MS);
    } else {
      accessExpiresAt = new Date(resetAt.getTime() + STARTER_ACCESS_DAYS * DAY_MS);
      if (now > accessExpiresAt) {
        return {
          success: false,
          code: 'STARTER_WINDOW_EXPIRED',
          membershipActive: false,
          accessExpiresAt: accessExpiresAt.toISOString()
        };
      }
    }
  }

  const { data, error } = await db.rpc('consume_scan_credits', {
    p_user_id: userId,
    p_amount: amount,
    p_reason: 'scan-use',
    p_metadata: metadata
  });

  if (error) throw new Error(`[scanCredits] Failed to consume credits: ${error.message}`);
  if (data !== true) {
    return {
      success: false,
      code: 'INSUFFICIENT_SCAN_CREDITS',
      membershipActive,
      accessExpiresAt: accessExpiresAt ? accessExpiresAt.toISOString() : null
    };
  }

  const updatedProfile = await fetchProfile(userId);
  const credits = updatedProfile.scan_credits ?? 0;
  const resetAtIso = updatedProfile.scan_credits_reset_at || null;
  const recalculatedExpiresAt = membershipActive || !resetAtIso
    ? null
    : new Date(new Date(resetAtIso).getTime() + STARTER_ACCESS_DAYS * DAY_MS);

  return {
    success: true,
    membershipActive,
    creditsRemaining: credits,
    accessExpiresAt: recalculatedExpiresAt ? recalculatedExpiresAt.toISOString() : null
  };
}

export function computeStarterExpiration(profile) {
  if (!profile?.scan_credits_reset_at) return null;
  const resetAt = new Date(profile.scan_credits_reset_at);
  if (Number.isNaN(resetAt.getTime())) return null;
  return new Date(resetAt.getTime() + STARTER_ACCESS_DAYS * DAY_MS);
}

export async function getCreditSummary(userId) {
  const { profile, membership } = await ensureMonthlyBundle(userId);
  const membershipActive = isMembershipActive(membership);
  const expiration = membershipActive ? null : computeStarterExpiration(profile);
  const now = new Date();
  const isExpired = !membershipActive && expiration ? now > expiration : false;
  const daysRemaining = !membershipActive && expiration
    ? Math.max(0, Math.ceil((expiration.getTime() - now.getTime()) / DAY_MS))
    : null;

  return {
    credits: profile.scan_credits ?? 0,
    monthlyBundle: profile.scan_credits_monthly_bundle ?? 0,
    resetAt: profile.scan_credits_reset_at,
    membershipActive,
    membershipTier: membership?.tier ?? null,
    membershipCompReason: membership?.comped_reason ?? null,
    accessExpiresAt: expiration ? expiration.toISOString() : null,
    starterExpired: isExpired,
    trialDaysRemaining: daysRemaining
  };
}

export async function ensureStarterBundle(userId) {
  if (!userId) return;

  const profile = await fetchProfile(userId);
  if ((profile.scan_credits ?? 0) > 0 || profile.scan_credits_reset_at) {
    return;
  }

  await grantScanCredits(userId, DEFAULT_STARTER_BUNDLE, 'starter-bundle', { amount: DEFAULT_STARTER_BUNDLE });
  await db
    .from('profiles')
    .update({
      scan_credits_reset_at: new Date().toISOString()
    })
    .eq('user_id', userId);
}

export async function refreshStarterWindow(userId, context = {}) {
  if (!userId) return { updated: false };

  let membership = context.membership ?? null;
  if (!membership) {
    membership = await fetchMembership(userId);
  }

  if (isMembershipActive(membership)) {
    return { updated: false, membership };
  }

  const nowIso = new Date().toISOString();
  await db
    .from('profiles')
    .update({ scan_credits_reset_at: nowIso })
    .eq('user_id', userId);

  return { updated: true, membership, resetAt: nowIso };
}
