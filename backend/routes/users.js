import express from 'express';
import { supabaseAdmin } from '../supabaseAdmin.js';
import { supabase } from '../supabaseClient.js';
import { ensureUserRecord } from '../utils/ensureUser.js';

const router = express.Router();
const writeClient = supabaseAdmin ?? supabase;
const adminEmails = new Set([
  'topher.cook7@gmail.com',
  'strainspotter25@gmail.com',
  'admin@strainspotter.com',
  'andrewbeck209@gmail.com'
]);

async function authenticateRequest(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Unauthorized' };
  }
  const token = authHeader.substring(7);
  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data?.user) {
      return { error: 'Unauthorized' };
    }
    return { user: data.user };
  } catch (err) {
    console.error('[users] Auth check failed:', err);
    return { error: 'Unauthorized' };
  }
}

async function fetchProfileRole(userId) {
  if (!userId) return null;
  const { data, error } = await writeClient
    .from('profiles')
    .select('role, email')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) {
    console.error('[users] Failed to load profile role:', error);
    return null;
  }
  if (data?.email && adminEmails.has(data.email.toLowerCase())) {
    return 'admin';
  }
  return data?.role || null;
}

// GET /api/users - Get all users for direct messaging
router.get('/', async (req, res) => {
  try {
    const { data, error } = await writeClient
      .from('users')
      .select('id, username, email')
      .order('username', { ascending: true });

    if (error) {
      console.error('[users] Error fetching users:', error);
      return res.status(500).json({ error: 'Failed to fetch users' });
    }

    console.log('[users] Fetched', data?.length || 0, 'users from users table');

    const users = data || [];
    const userIds = users.map(u => u.id).filter(Boolean);

    let profilesMap = new Map();
    if (userIds.length) {
      const { data: profiles, error: profileErr } = await writeClient
        .from('profiles')
        .select('user_id, display_name, username')
        .in('user_id', userIds);

      if (profileErr) {
        console.error('[users] Error fetching profiles:', profileErr);
      } else {
        profilesMap = new Map(profiles.map(p => [p.user_id, p]));
      }
    }

    const enrichedUsers = users.map(user => {
      const profile = profilesMap.get(user.id);
      const displayName = profile?.display_name
        || profile?.username
        || user.username
        || (user.email ? user.email.split('@')[0] : null)
        || `Member ${String(user.id || '').slice(0, 8)}`;

      const finalUsername = profile?.username
        || user.username
        || (user.email ? user.email.split('@')[0] : null)
        || displayName;

      return {
        user_id: user.id,
        display_name: displayName,
        username: finalUsername,
        email: user.email
      };
    }).sort((a, b) => a.display_name.localeCompare(b.display_name, undefined, { sensitivity: 'base' }));

    console.log('[users] Returning', enrichedUsers.length, 'enriched users with display names');
    res.json(enrichedUsers);
  } catch (err) {
    console.error('[users] Exception:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/heartbeat', async (req, res) => {
  try {
    const auth = await authenticateRequest(req);
    if (!auth.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const userId = auth.user.id;
    const { error } = await writeClient
      .from('profiles')
      .update({
        last_seen_at: new Date().toISOString(),
        membership_status: 'active'
      })
      .eq('user_id', userId);
    if (error) {
      console.error('[users] Heartbeat update failed:', error);
      return res.status(500).json({ error: 'Failed to update heartbeat' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('[users] Heartbeat exception:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/directory', async (req, res) => {
  try {
    const auth = await authenticateRequest(req);
    if (!auth.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const callerRole = await fetchProfileRole(auth.user.id);
    if (callerRole !== 'admin' && callerRole !== 'moderator') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const {
      role: roleFilter,
      status,
      search,
      limit = 200
    } = req.query;

    let query = writeClient
      .from('profiles')
      .select(`
        user_id,
        display_name,
        username,
        email,
        role,
        membership_status,
        profile_tags,
        is_grower,
        grower_farm_name,
        grower_city,
        grower_state,
        grower_certified,
        grower_listed_in_directory,
        grower_experience_years,
        grower_license_status,
        last_seen_at,
        created_at
      `)
      .order('last_seen_at', { ascending: false, nullsFirst: false });

    if (roleFilter) {
      query = query.eq('role', roleFilter);
    }
    if (status) {
      query = query.eq('membership_status', status);
    }
    if (search) {
      const sanitized = search.trim();
      query = query.or(
        `display_name.ilike.%${sanitized}%,username.ilike.%${sanitized}%,email.ilike.%${sanitized}%,grower_farm_name.ilike.%${sanitized}%`
      );
    }

    const cappedLimit = Math.min(parseInt(limit, 10) || 200, 500);
    query = query.limit(cappedLimit);

    const { data, error } = await query;
    if (error) {
      console.error('[users] Directory fetch failed:', error);
      return res.status(500).json({ error: 'Failed to load directory' });
    }

    res.json({ members: data || [] });
  } catch (err) {
    console.error('[users] Directory exception:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Ensure a user record exists in public.users table
// This is called after auth signup to prevent "Could not create user record" errors
router.post('/ensure', async (req, res) => {
  try {
    const userId = req.body?.user_id;
    const emailFromFrontend = req.body?.email;
    const usernameFromFrontend = req.body?.username;
    
    if (!userId) {
      return res.status(400).json({ error: 'user_id required' });
    }

    // Try to get email from auth.users if not provided
    let email = emailFromFrontend;
    if (!email && supabaseAdmin) {
      try {
        const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
        email = authUser?.user?.email || null;
        console.log('[users/ensure] Fetched email from auth:', email);
      } catch (e) {
        console.log('[users/ensure] Could not fetch auth user email:', e.message);
      }
    }

    const ensureResult = await ensureUserRecord({
      client: writeClient,
      userId,
      emailHint: email,
      usernameHint: usernameFromFrontend,
      loggerPrefix: '[users/ensure]'
    });

    if (!ensureResult.ok) {
      console.error('[users/ensure] Failed to ensure user:', ensureResult.error);
      return res.status(500).json({
        error: 'Failed to create user record',
        details: ensureResult.error?.message || ensureResult.error || null
      });
    }

    res.json({ success: true, message: ensureResult.created ? 'User created' : 'User already exists' });
  } catch (err) {
    console.error('[users/ensure] Error:', err);
    res.status(500).json({ error: String(err) });
  }
});

router.post('/profile', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !authData?.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = authData.user;
    const userId = user.id;
    const email = user.email || null;
    const rawDisplayName = req.body?.display_name ?? req.body?.displayName;
    const rawUsername = req.body?.username;

    const displayName = (rawDisplayName || '').trim();
    if (!displayName || displayName.length < 2) {
      return res.status(400).json({ error: 'Display name must be at least 2 characters.' });
    }

    const sanitizedDisplayName = displayName.slice(0, 60);

    let sanitizedUsername = (rawUsername || '').trim().toLowerCase();
    sanitizedUsername = sanitizedUsername.replace(/[^a-z0-9]+/g, '').slice(0, 32);
    if (sanitizedUsername && sanitizedUsername.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters.' });
    }

    if (sanitizedUsername) {
      const { data: existingUsername, error: usernameErr } = await writeClient
        .from('profiles')
        .select('user_id')
        .eq('username', sanitizedUsername)
        .neq('user_id', userId)
        .maybeSingle();

      if (usernameErr && usernameErr.code !== 'PGRST116') {
        console.error('[users/profile] Username lookup failed:', usernameErr);
      }

      if (existingUsername) {
        return res.status(400).json({ error: 'Username is already in use.' });
      }
    }

    const payload = {
      display_name: sanitizedDisplayName,
      username: sanitizedUsername || null,
      email
    };

    const { data: updated, error: updateErr } = await writeClient
      .from('profiles')
      .update(payload)
      .eq('user_id', userId)
      .select()
      .maybeSingle();

    let profile = updated;
    if (updateErr && updateErr.code !== 'PGRST116') {
      console.error('[users/profile] Update failed:', updateErr);
      return res.status(500).json({ error: 'Failed to update profile' });
    }

    if (!profile) {
      const { data: inserted, error: insertErr } = await writeClient
        .from('profiles')
        .insert({
          user_id: userId,
          ...payload
        })
        .select()
        .single();

      if (insertErr) {
        console.error('[users/profile] Insert failed:', insertErr);
        return res.status(500).json({ error: 'Failed to update profile' });
      }
      profile = inserted;
    }

    res.json({ profile });
  } catch (err) {
    console.error('[users/profile] Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
