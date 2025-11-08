import express from 'express';
import { supabaseAdmin } from '../supabaseAdmin.js';
import { supabase } from '../supabaseClient.js';
import { ensureUserRecord } from '../utils/ensureUser.js';

const router = express.Router();
const writeClient = supabaseAdmin ?? supabase;

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

    // Enrich with profile usernames if available
    const enrichedUsers = await Promise.all((data || []).map(async (user) => {
      // Try to get username from profiles table
      const { data: profile } = await writeClient
        .from('profiles')
        .select('username')
        .eq('user_id', user.id)
        .single();

      // Use profile username if available, otherwise fall back to users table username
      const finalUsername = profile?.username || user.username || user.email?.split('@')[0] || 'User';

      console.log('[users] User', user.id, '- username:', finalUsername, '(from', profile?.username ? 'profiles' : 'users', 'table)');

      return {
        user_id: user.id,
        username: finalUsername,
        email: user.email
      };
    }));

    console.log('[users] Returning', enrichedUsers.length, 'enriched users');
    res.json(enrichedUsers);
  } catch (err) {
    console.error('[users] Exception:', err);
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

export default router;
