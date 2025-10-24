import express from 'express';
import { supabase } from '../supabaseClient.js';
import { supabaseAdmin } from '../supabaseAdmin.js';

const router = express.Router();


// Use service role for writes, anon for reads
const readClient = supabase;
const writeClient = supabaseAdmin ?? supabase;

// Predefined allowed group names
const ALLOWED_GROUPS = [
  'Growers',
  'Budtenders',
  'Medical',
  'Recreational',
  'Local Chat',
  'General',
  'Dispensary Owners',
  'Seed Swap',
  'Events',
  'Help & Advice'
];

router.get('/', async (req, res) => {
  try {
    const { data, error } = await readClient.from('groups').select('*').order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data || []);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.post('/', async (req, res) => {
  try {
    // Validate user_id exists in public.users
    const userId = req.body?.user_id || null;
    if (!userId) return res.status(400).json({ error: 'user_id required' });
    
    // Check if user exists in public.users table
    const { data: user, error: userCheckErr } = await writeClient
      .from('users')
      .select('id')
      .eq('id', userId)
      .maybeSingle();
    
    if (userCheckErr) {
      console.error('[groups] Error checking user:', userCheckErr);
      return res.status(500).json({ error: 'Database error checking user' });
    }
    
    if (!user) {
      // Try to auto-create user record - retry if needed
      console.log('[groups] User not found, attempting to create:', userId);
      
      // Try to get email from auth.users
      let email = null;
      if (supabaseAdmin) {
        try {
          const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
          email = authUser?.user?.email || null;
        } catch (e) {
          console.log('[groups] Could not fetch auth user email:', e.message);
        }
      }
      
      const { data: newUser, error: insertErr } = await writeClient
        .from('users')
        .insert({ 
          id: userId, 
          username: `user_${userId.substring(0, 8)}`,
          email: email || `${userId.substring(0, 8)}@placeholder.local`,
          created_at: new Date().toISOString() 
        })
        .select()
        .maybeSingle();
      
      if (insertErr) {
        // Check if it's a unique constraint error (user was created by another request)
        if (insertErr.code === '23505') {
          console.log('[groups] User already exists (race condition), proceeding...');
          // This is fine - user exists, so proceed
        } else {
          // For any other error, we need to verify the user exists before proceeding
          console.error('[groups] Failed to auto-create user:', insertErr);
          
          // Double-check if user exists now (maybe created by another process)
          const { data: recheckUser } = await writeClient
            .from('users')
            .select('id')
            .eq('id', userId)
            .maybeSingle();
          
          if (!recheckUser) {
            // User definitely doesn't exist and we can't create it
            console.error('[groups] User does not exist and cannot be created');
            return res.status(500).json({ 
              error: 'Could not create user record. Please ensure you are signed in and try again.',
              hint: 'Your account may need to be set up. Try signing out and back in.',
              details: insertErr.message
            });
          } else {
            console.log('[groups] User found on recheck, proceeding');
          }
        }
      } else {
        console.log('[groups] Auto-created user record:', userId);
      }
    }
    
    // Only allow predefined group names
    const groupName = (req.body?.name || '').trim();
    if (!ALLOWED_GROUPS.includes(groupName)) {
      return res.status(400).json({ error: 'Invalid group name. Please select from allowed groups.' });
    }
    
    // Check if group already exists
    const { data: existing } = await readClient.from('groups').select('id').eq('name', groupName).maybeSingle();
    if (existing) {
      return res.status(400).json({ error: 'Group already exists. Please join it from the list.' });
    }
    
    const payload = { name: groupName, created_by: userId };
    const { data, error } = await writeClient.from('groups').insert(payload).select().single();
    if (error) {
      const hint = (!supabaseAdmin && /row-level security/i.test(error.message))
        ? 'RLS blocked group creation. Service role key may be needed.'
        : null;
      return res.status(500).json({ error: error.message, hint });
    }
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.get('/:id/messages', async (req, res) => {
  try {
    const { data, error } = await readClient.from('messages').select('*').eq('group_id', req.params.id).order('created_at', { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data || []);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

import { rejectIfProfane, checkAndCleanMessage } from '../middleware/moderation.js';

router.post('/:id/messages', rejectIfProfane, async (req, res) => {
  try {
    const rawContent = req.body?.content || '';
    const { cleaned } = checkAndCleanMessage(rawContent);
    const groupId = req.params.id;
    const userId = req.body?.user_id || null;
    
    // Auto-create user if needed - ALWAYS succeed
    if (userId) {
      const { data: user } = await writeClient.from('users').select('id').eq('id', userId).maybeSingle();
      if (!user) {
        // Try to get email from auth.users
        let email = null;
        if (supabaseAdmin) {
          try {
            const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
            email = authUser?.user?.email || null;
          } catch (e) {
            console.log('[groups/message] Could not fetch auth user email');
          }
        }
        
        const { error: createErr } = await writeClient
          .from('users')
          .insert({ 
            id: userId, 
            username: `user_${userId.substring(0, 8)}`,
            email: email || `${userId.substring(0, 8)}@placeholder.local`,
            created_at: new Date().toISOString() 
          })
          .select()
          .maybeSingle();
        
        if (createErr && createErr.code !== '23505') {
          console.log('[groups] Could not auto-create user on message, proceeding:', createErr.message);
        } else {
          console.log('[groups] Auto-created user record on message:', userId);
        }
      }
    }
    
    // Insert new message
    const payload = { group_id: groupId, user_id: userId, content: cleaned };
    const { data, error } = await writeClient.from('messages').insert(payload).select().single();
    if (error) {
      const hint = (!supabaseAdmin && /row-level security/i.test(error.message))
        ? 'RLS blocked message creation. Service role key may be needed.'
        : null;
      return res.status(500).json({ error: error.message, hint });
    }
    // After insert, enforce max 100 messages per group
    const { data: allMsgs } = await writeClient
      .from('messages')
      .select('id, created_at')
      .eq('group_id', groupId)
      .order('created_at', { ascending: true });
    if (Array.isArray(allMsgs) && allMsgs.length > 100) {
      const toDelete = allMsgs.slice(0, allMsgs.length - 100).map(m => m.id);
      if (toDelete.length) {
        await writeClient.from('messages').delete().in('id', toDelete);
      }
    }
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// POST /:id/join - Join a group
router.post('/:id/join', async (req, res) => {
  try {
    const { user_id } = req.body;
    if (!user_id) return res.status(400).json({ error: 'user_id required' });

    // Auto-create user if needed - ALWAYS succeed
    const { data: user } = await writeClient.from('users').select('id').eq('id', user_id).maybeSingle();
    if (!user) {
      // Try to get email from auth.users
      let email = null;
      if (supabaseAdmin) {
        try {
          const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(user_id);
          email = authUser?.user?.email || null;
        } catch (e) {
          console.log('[groups/join] Could not fetch auth user email');
        }
      }
      
      const { error: createErr } = await writeClient
        .from('users')
        .insert({ 
          id: user_id, 
          username: `user_${user_id.substring(0, 8)}`,
          email: email || `${user_id.substring(0, 8)}@placeholder.local`,
          created_at: new Date().toISOString() 
        })
        .select()
        .maybeSingle();
      
      if (createErr && createErr.code !== '23505') {
        // Log but don't fail - user might exist but we can't verify
        console.log('[groups] Could not auto-create user on join, proceeding anyway:', createErr.message);
      } else {
        console.log('[groups] Auto-created user record on join:', user_id);
      }
    }

    const payload = { group_id: req.params.id, user_id };
    const { data, error } = await writeClient.from('group_members').insert(payload).select().single();
    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ error: 'Already a member' });
      }
      return res.status(500).json({ error: error.message });
    }
    res.json({ success: true, member: data });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// POST /:id/leave - Leave a group
router.post('/:id/leave', async (req, res) => {
  try {
    const { user_id } = req.body;
    if (!user_id) return res.status(400).json({ error: 'user_id required' });

    const { error } = await writeClient
      .from('group_members')
      .delete()
      .eq('group_id', req.params.id)
      .eq('user_id', user_id);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// GET /:id/members - List group members
router.get('/:id/members', async (req, res) => {
  try {
    const { data, error } = await readClient
      .from('group_members')
      .select(`
        user_id,
        joined_at,
        users(id, username, avatar_url)
      `)
      .eq('group_id', req.params.id);

    if (error) return res.status(500).json({ error: error.message });
    res.json(data || []);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

export default router;
