import express from 'express';
import { supabaseAdmin } from '../supabaseAdmin.js';
import { supabase } from '../supabaseClient.js';
import { ensureUserRecord } from '../utils/ensureUser.js';

const router = express.Router();
const writeClient = supabaseAdmin ?? supabase;

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
