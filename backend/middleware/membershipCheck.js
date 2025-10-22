// Membership middleware for trial enforcement
import { supabase } from '../supabaseClient.js';
import { supabaseAdmin } from '../supabaseAdmin.js';

const db = supabaseAdmin ?? supabase;
const TABLE_MISSING_MSG = "Could not find the table 'public.trial_usage'";

// Constants
const TRIAL_SCAN_LIMIT = 2;
const TRIAL_SEARCH_LIMIT = 2;
const TRIAL_DURATION_DAYS = 7;

// Middleware to check trial/membership status
export async function checkAccess(req, res, next) {
  try {
    const sessionId = req.headers['x-session-id'] || req.ip;
    const userId = req.user?.id || null; // Assumes auth middleware sets req.user

    // Check if user has active membership
    if (userId) {
      const { data: membership } = await db
        .from('memberships')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (membership) {
        // Check expiration
        if (!membership.expires_at || new Date(membership.expires_at) > new Date()) {
          req.membershipStatus = 'active';
          req.tier = membership.tier;
          return next();
        }
      }
    }

    // Check trial usage
    let trial = null;
    try {
      const resp = await db
        .from('trial_usage')
        .select('*')
        .eq(userId ? 'user_id' : 'session_id', userId || sessionId)
        .maybeSingle();
      trial = resp.data || null;
      if (resp.error && resp.error.code !== 'PGRST116') {
        // If the table truly doesn't exist, bypass trial enforcement (dev mode)
        if (String(resp.error.message || '').includes(TABLE_MISSING_MSG)) {
          req.membershipStatus = 'bypass';
          return next();
        }
        return res.status(500).json({ error: resp.error.message });
      }
    } catch (err) {
      if (String(err.message || '').includes(TABLE_MISSING_MSG)) {
        req.membershipStatus = 'bypass';
        return next();
      }
      return res.status(500).json({ error: String(err) });
    }

    if (!trial) {
      // Create new trial
      const { data: newTrial, error: createError } = await db
        .from('trial_usage')
        .insert({
          session_id: sessionId,
          user_id: userId,
          scan_count: 0,
          search_count: 0
        })
        .select()
        .single();

      if (createError) {
        return res.status(500).json({ error: createError.message });
      }

      req.membershipStatus = 'trial';
      req.trial = newTrial;
      return next();
    }

    // Check trial expiration
    if (new Date(trial.trial_expires_at) < new Date()) {
      req.membershipStatus = 'trial_expired';
      req.trial = trial;
      return next();
    }

    req.membershipStatus = 'trial';
    req.trial = trial;
    next();
  } catch (e) {
    next(e);
  }
}

// Middleware to enforce trial limits
export function enforceTrialLimit(type = 'scan') {
  return async (req, res, next) => {
    if (req.membershipStatus === 'active' || req.membershipStatus === 'bypass') {
      return next(); // Active members have unlimited access
    }

    if (req.membershipStatus === 'trial_expired') {
      return res.status(403).json({
        error: 'Trial expired',
        message: 'Your trial period has ended. Please join the club to continue.',
        trialExpired: true
      });
    }

  const trial = req.trial;
    const limit = type === 'scan' ? TRIAL_SCAN_LIMIT : TRIAL_SEARCH_LIMIT;
    const currentCount = type === 'scan' ? trial.scan_count : trial.search_count;

    if (currentCount >= limit) {
      return res.status(403).json({
        error: 'Trial limit reached',
        message: `You've used your ${limit} free ${type}s. Join the club for unlimited access!`,
        trialLimitReached: true,
        type,
        limit,
        used: currentCount
      });
    }

    // Increment usage
    const updateField = type === 'scan' ? 'scan_count' : 'search_count';
    await db
      .from('trial_usage')
      .update({
        [updateField]: currentCount + 1,
        last_activity_at: new Date().toISOString()
      })
      .eq('id', trial.id);

    req.trialUsage = {
      type,
      remaining: limit - currentCount - 1
    };

    next();
  };
}
