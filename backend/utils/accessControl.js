import { supabase } from '../supabaseClient.js';
import { supabaseAdmin } from '../supabaseAdmin.js';

export const ADMIN_EMAILS = new Set([
  'topher.cook7@gmail.com',
  'andrewbeck209@gmail.com',
  'strainspotter25feedback@gmail.com'
]);

const profileClient = supabaseAdmin ?? supabase;

async function fetchProfile(userId) {
  if (!userId) return null;
  const { data, error } = await profileClient
    .from('profiles')
    .select('user_id, role, email')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) {
    console.warn('[accessControl] Failed to load profile:', error.message);
  }
  return data || null;
}

async function getSupabaseUserFromRequest(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Unauthorized' };
  }
  const token = authHeader.replace('Bearer ', '');
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    return { error: 'Unauthorized' };
  }
  return { user: data.user, token };
}

function normalizeEmail(email) {
  return (email || '').toLowerCase();
}

export function isAdminUser(user, profile) {
  const email = normalizeEmail(profile?.email || user?.email);
  if (profile?.role === 'admin') return true;
  if (ADMIN_EMAILS.has(email)) return true;
  return false;
}

async function hasActiveModeratorRecord(userId) {
  if (!userId) return false;
  const { data, error } = await profileClient
    .from('moderators')
    .select('user_id')
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle();
  if (error) {
    console.warn('[accessControl] Moderator lookup failed:', error.message);
    return false;
  }
  return Boolean(data);
}

export async function getAuthContext(req) {
  const authResult = await getSupabaseUserFromRequest(req);
  if (!authResult.user) {
    return { error: authResult.error || 'Unauthorized' };
  }
  const profile = await fetchProfile(authResult.user.id);
  return {
    user: authResult.user,
    profile,
    token: authResult.token
  };
}

export async function requireAdmin(req, res, next) {
  try {
    const context = await getAuthContext(req);
    if (!context.user) {
      return res.status(401).json({ error: context.error || 'Unauthorized' });
    }
    if (!isAdminUser(context.user, context.profile)) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    req.authContext = { ...context, isAdmin: true };
    next();
  } catch (err) {
    next(err);
  }
}

export async function requireModerator(req, res, next) {
  try {
    const context = await getAuthContext(req);
    if (!context.user) {
      return res.status(401).json({ error: context.error || 'Unauthorized' });
    }
    let hasAccess = false;
    if (isAdminUser(context.user, context.profile)) {
      hasAccess = true;
    } else if ((context.profile?.role || '').toLowerCase() === 'moderator') {
      hasAccess = true;
    } else {
      hasAccess = await hasActiveModeratorRecord(context.user.id);
    }

    if (!hasAccess) {
      return res.status(403).json({ error: 'Moderator access required' });
    }

    req.authContext = { ...context, isModerator: true };
    next();
  } catch (err) {
    next(err);
  }
}

export async function requireAuthenticated(req, res, next) {
  try {
    const context = await getAuthContext(req);
    if (!context.user) {
      return res.status(401).json({ error: context.error || 'Unauthorized' });
    }
    req.authContext = context;
    next();
  } catch (err) {
    next(err);
  }
}

export async function isModeratorContext(context) {
  if (!context?.user) return false;
  if (isAdminUser(context.user, context.profile)) return true;
  if ((context.profile?.role || '').toLowerCase() === 'moderator') return true;
  return hasActiveModeratorRecord(context.user.id);
}


