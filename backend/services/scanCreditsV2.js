/**
 * Scan Credits Service V2
 *
 * New simplified plan:
 * - free: default trial bucket (10 scans lifetime)
 * - app_purchase: one-time unlock (20 scans lifetime)
 * - monthly_member: $4.99 / 200 scans per month
 * - admin: unlimited (internal use)
 *
 * Moderators now receive discounted pricing but STILL pay for plans / top-ups.
 * Discount application happens in the credits routes, not here—deduction logic
 * remains identical regardless of profile.role.
 */

import { supabase } from '../supabaseClient.js';
import { supabaseAdmin } from '../supabaseAdmin.js';

const db = supabaseAdmin ?? supabase;

const VALID_TIERS = ['free', 'app_purchase', 'monthly_member', 'admin'];

/**
 * Get user's credit balance and tier info
 */
export async function getCreditBalance(userId) {
  if (!userId) {
    throw new Error('User ID required');
  }

  const { data, error } = await db
    .from('user_credit_balance')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('[scanCreditsV2] Failed to get credit balance:', error);
    throw new Error('Failed to get credit balance');
  }

  return {
    tier: data.membership_tier,
    creditsRemaining: data.credits_remaining,
    monthlyLimit: data.monthly_limit,
    lifetimeCredits: data.lifetime_credits,
    usedThisMonth: data.scan_credits_used_this_month,
    lifetimeScansUsed: data.lifetime_scans_used,
    resetAt: data.credits_reset_at
  };
}

/**
 * Check if user has credits available
 */
export async function hasCredits(userId) {
  if (!userId) {
    return false;
  }

  try {
    const { data, error } = await db.rpc('has_scan_credits', {
      p_user_id: userId
    });

    if (error) {
      console.error('[scanCreditsV2] has_scan_credits error:', error);
      return false;
    }

    return data === true;
  } catch (e) {
    console.error('[scanCreditsV2] hasCredits exception:', e);
    return false;
  }
}

/**
 * Deduct one scan credit from user
 */
export async function deductCredit(userId) {
  if (!userId) {
    throw new Error('User ID required');
  }

  try {
    const { data, error } = await db.rpc('deduct_scan_credit', {
      p_user_id: userId
    });

    if (error) {
      console.error('[scanCreditsV2] deduct_scan_credit error:', error);
      throw new Error('Failed to deduct credit');
    }

    if (data !== true) {
      return {
        success: false,
        error: 'INSUFFICIENT_CREDITS'
      };
    }

    // Get updated balance
    const balance = await getCreditBalance(userId);

    return {
      success: true,
      creditsRemaining: balance.creditsRemaining,
      tier: balance.tier
    };
  } catch (e) {
    console.error('[scanCreditsV2] deductCredit exception:', e);
    throw e;
  }
}

/**
 * Add credits to user (for purchases)
 */
export async function addCredits(userId, amount, description = 'Credit purchase') {
  if (!userId) {
    throw new Error('User ID required');
  }

  if (amount <= 0) {
    throw new Error('Amount must be positive');
  }

  try {
    const { data, error } = await db.rpc('add_scan_credits', {
      p_user_id: userId,
      p_amount: amount,
      p_description: description
    });

    if (error) {
      console.error('[scanCreditsV2] add_scan_credits error:', error);
      throw new Error('Failed to add credits');
    }

    // Get updated balance
    const balance = await getCreditBalance(userId);

    return {
      success: true,
      creditsAdded: amount,
      creditsRemaining: balance.creditsRemaining,
      tier: balance.tier
    };
  } catch (e) {
    console.error('[scanCreditsV2] addCredits exception:', e);
    throw e;
  }
}

/**
 * Upgrade user's membership tier
 */
export async function upgradeTier(userId, newTier) {
  if (!userId) {
    throw new Error('User ID required');
  }

  if (!VALID_TIERS.includes(newTier)) {
    throw new Error(`Invalid tier: ${newTier}`);
  }

  try {
    const { data, error } = await db.rpc('upgrade_membership_tier', {
      p_user_id: userId,
      p_new_tier: newTier
    });

    if (error) {
      console.error('[scanCreditsV2] upgrade_membership_tier error:', error);
      throw new Error('Failed to upgrade tier');
    }

    // Get updated balance
    const balance = await getCreditBalance(userId);

    return {
      success: true,
      newTier: balance.tier,
      creditsRemaining: balance.creditsRemaining,
      monthlyLimit: balance.monthlyLimit
    };
  } catch (e) {
    console.error('[scanCreditsV2] upgradeTier exception:', e);
    throw e;
  }
}

/**
 * Get credit transaction history
 */
export async function getTransactionHistory(userId, limit = 50) {
  if (!userId) {
    throw new Error('User ID required');
  }

  const { data, error } = await db
    .from('scan_credit_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[scanCreditsV2] Failed to get transaction history:', error);
    throw new Error('Failed to get transaction history');
  }

  return data;
}

/**
 * Get credit summary for display
 */
export async function getCreditSummary(userId) {
  if (!userId) {
    throw new Error('User ID required');
  }

  try {
    const balance = await getCreditBalance(userId);
    const hasAvailableCredits = await hasCredits(userId);

    const baseSummary = {
      tier: balance.tier,
      creditsRemaining: balance.creditsRemaining,
      monthlyLimit: balance.monthlyLimit,
      usedThisMonth: balance.usedThisMonth,
      lifetimeScansUsed: balance.lifetimeScansUsed,
      resetAt: balance.resetAt,
      bonusCredits: balance.bonusCredits ?? balance.lifetimeCredits ?? 0,
      hasCredits: hasAvailableCredits,
      isUnlimited: balance.tier === 'admin',
      needsUpgrade: !hasAvailableCredits && (balance.tier === 'free' || balance.tier === 'app_purchase')
    };

    return baseSummary;
  } catch (e) {
    console.error('[scanCreditsV2] getCreditSummary exception:', e);
    throw e;
  }
}

/**
 * Reset monthly credits (called by cron job)
 */
export async function resetMonthlyCredits() {
  try {
    const { data, error } = await db.rpc('reset_monthly_credits');

    if (error) {
      console.error('[scanCreditsV2] reset_monthly_credits error:', error);
      throw new Error('Failed to reset monthly credits');
    }

    console.log(`[scanCreditsV2] Reset monthly credits for ${data} users`);

    return {
      success: true,
      usersReset: data
    };
  } catch (e) {
    console.error('[scanCreditsV2] resetMonthlyCredits exception:', e);
    throw e;
  }
}

/**
 * Middleware to check credits before scan
 */
export async function requireCredits(req, res, next) {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const hasAvailableCredits = await hasCredits(userId);

    if (!hasAvailableCredits) {
      const balance = await getCreditBalance(userId);
      
      return res.status(402).json({
        error: 'INSUFFICIENT_CREDITS',
        message: 'You have run out of scan credits',
        tier: balance.tier,
        creditsRemaining: balance.creditsRemaining,
        monthlyLimit: balance.monthlyLimit,
        needsUpgrade: balance.tier === 'free'
      });
    }

    // Attach credit info to request for later use
    req.creditInfo = await getCreditBalance(userId);
    next();
  } catch (e) {
    console.error('[scanCreditsV2] requireCredits middleware error:', e);
    return res.status(500).json({ error: 'Failed to check credits' });
  }
}

