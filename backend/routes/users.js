import express from 'express';
import { supabaseAdmin } from '../supabaseAdmin.js';
import { supabase } from '../supabaseClient.js';

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

    // Check if user already exists
    const { data: existing } = await writeClient
      .from('users')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (existing) {
      return res.json({ success: true, message: 'User already exists' });
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

    const placeholderEmail = `${userId.substring(0, 8)}@placeholder.local`;
    const finalEmail = email || placeholderEmail || 'unknown@strainspotter.app';
    const finalUsername = usernameFromFrontend || `user_${userId.substring(0, 8)}`;
    
    console.log('[users/ensure] Will use email:', finalEmail, 'username:', finalUsername);

    // Create user record with username and email
    const insertData = { 
      id: userId,
      username: finalUsername,
      email: finalEmail,
      created_at: new Date().toISOString()
    };
    console.log('[users/ensure] Insert data:', JSON.stringify(insertData));
    
    const { error: insertErr } = await writeClient
      .from('users')
      .insert(insertData)
      .select()
      .single();

    if (insertErr) {
      console.error('[users/ensure] Failed to create user:', insertErr);
      return res.status(500).json({ 
        error: 'Failed to create user record',
        details: insertErr.message 
      });
    }

    res.json({ success: true, message: 'User created' });
  } catch (err) {
    console.error('[users/ensure] Error:', err);
    res.status(500).json({ error: String(err) });
  }
});

export default router;
