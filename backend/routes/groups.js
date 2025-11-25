import express from 'express';
import { supabase } from '../supabaseClient.js';
import { supabaseAdmin } from '../supabaseAdmin.js';
import { ensureUserRecord } from '../utils/ensureUser.js';

const router = express.Router();


// Use service role when available for both reads and writes (RLS-safe fallbacks)
const readClient = supabaseAdmin ?? supabase;
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

const DEFAULT_GROUP_ADMIN = {
  id: process.env.DEFAULT_GROUP_ADMIN_ID || '00000000-0000-0000-0000-000000000001',
  email: process.env.DEFAULT_GROUP_ADMIN_EMAIL || 'admin@strainspotter.app',
  username: process.env.DEFAULT_GROUP_ADMIN_USERNAME || 'StrainSpotter Admin'
};

const DEFAULT_GROUP_WELCOMES = {
  Growers: 'Welcome to Growers! Share your cultivation setup, swap tips, and cheer on fellow growers.',
  Budtenders: 'Hey Budtenders! Compare notes on today’s menus, questions you’re hearing, and stories from behind the counter.',
  Medical: 'Medical patients and caregivers—introduce yourselves and let us know how the community can support you.',
  Recreational: 'Recreational enthusiasts unite! Share your latest finds, favorite pairings, and what’s in your weekend rotation.',
  'Local Chat': 'Say hello to nearby members and let folks know what’s happening in your local scene.',
  General: 'Welcome to the general lounge—jump in, introduce yourself, and keep the vibes kind.',
  'Dispensary Owners': 'Dispensary leaders—swap wins, challenges, and ideas you’re testing in your shops.',
  'Seed Swap': 'Seed savers assemble! Offer up extras, make requests, and coordinate swaps responsibly.',
  Events: 'Promote upcoming events, meetups, and workshops so the community can show up!',
  'Help & Advice': 'Need a hand? Ask anything here and share solutions when you can.',
  __default: 'Welcome to this StrainSpotter group! Introduce yourself and start the conversation.'
};

let groupsSeedCompleted = false;
let groupsSeedPromise = null;

async function ensureAdminMembership(groupId) {
  const { data: existingMember, error: memberLookupErr } = await writeClient
    .from('group_members')
    .select('user_id')
    .eq('group_id', groupId)
    .eq('user_id', DEFAULT_GROUP_ADMIN.id)
    .maybeSingle();
  if (memberLookupErr) {
    console.log('[groups/seed] Failed to check admin membership:', memberLookupErr.message);
    return;
  }
  if (existingMember) return;

  const basePayload = { group_id: groupId, user_id: DEFAULT_GROUP_ADMIN.id };
  const payloads = [
    { ...basePayload, role: 'admin' },
    basePayload
  ];

  for (const payload of payloads) {
    const { error: insertErr } = await writeClient
      .from('group_members')
      .insert(payload)
      .select()
      .maybeSingle();
    if (!insertErr || insertErr?.code === '23505') {
      return;
    }
    if (insertErr?.code !== '42703') {
      console.log('[groups/seed] Failed to add admin membership:', insertErr.message);
      return;
    }
    // If column does not exist, fall through to the next payload attempt.
  }
}

async function ensureWelcomeMessageForGroup(group) {
  const groupId = group?.id;
  if (!groupId) return;

  const { data: existingMsg, error: messageCheckErr } = await writeClient
    .from('messages')
    .select('id')
    .eq('group_id', groupId)
    .limit(1);
  if (messageCheckErr) {
    console.log('[groups/seed] Failed to check welcome message for group', group.name, messageCheckErr.message);
    return;
  }
  if (Array.isArray(existingMsg) && existingMsg.length) {
    await ensureAdminMembership(groupId);
    return;
  }

  await ensureUserRecord({
    client: writeClient,
    userId: DEFAULT_GROUP_ADMIN.id,
    emailHint: DEFAULT_GROUP_ADMIN.email,
    usernameHint: DEFAULT_GROUP_ADMIN.username,
    loggerPrefix: '[groups/seed]'
  });

  const welcomeText = DEFAULT_GROUP_WELCOMES[group.name] || DEFAULT_GROUP_WELCOMES.__default;
  const { error: insertErr } = await writeClient
    .from('messages')
    .insert({
      group_id: groupId,
      user_id: DEFAULT_GROUP_ADMIN.id,
      content: welcomeText
    })
    .select()
    .maybeSingle();
  if (insertErr && insertErr.code !== '23505') {
    console.log('[groups/seed] Failed to insert welcome message for', group.name, insertErr.message);
  }

  await ensureAdminMembership(groupId);
}

async function ensureDefaultGroups() {
  if (groupsSeedCompleted) return;
  if (groupsSeedPromise) {
    await groupsSeedPromise;
    return;
  }

  groupsSeedPromise = (async () => {
    const { data: existingGroups, error: fetchErr } = await writeClient
      .from('groups')
      .select('id, name');
    if (fetchErr) {
      console.error('[groups/seed] Failed to read groups table:', fetchErr.message);
      return;
    }

    const groupMap = new Map();
    for (const group of existingGroups ?? []) {
      if (group?.name) {
        groupMap.set(group.name, group);
      }
    }

    await ensureUserRecord({
      client: writeClient,
      userId: DEFAULT_GROUP_ADMIN.id,
      emailHint: DEFAULT_GROUP_ADMIN.email,
      usernameHint: DEFAULT_GROUP_ADMIN.username,
      loggerPrefix: '[groups/seed]'
    });

    for (const name of ALLOWED_GROUPS) {
      if (groupMap.has(name)) continue;
      let groupRecord = null;
      const { data: inserted, error: insertErr } = await writeClient
        .from('groups')
        .insert({ name, created_by: null })
        .select()
        .maybeSingle();
      if (insertErr) {
        if (insertErr.code === '23505') {
          const { data: existing } = await writeClient
            .from('groups')
            .select('id, name')
            .eq('name', name)
            .maybeSingle();
          groupRecord = existing;
        } else {
          console.log('[groups/seed] Failed to insert default group', name, insertErr.message);
        }
      } else {
        groupRecord = inserted;
      }
      if (groupRecord) {
        groupMap.set(name, groupRecord);
      }
    }

    const deduped = new Map();
    for (const group of groupMap.values()) {
      if (group?.id && group?.name) {
        deduped.set(group.name, group);
      }
    }

    for (const group of deduped.values()) {
      await ensureWelcomeMessageForGroup(group);
    }

    groupsSeedCompleted = true;
  })().catch(err => {
    console.error('[groups/seed] Unexpected error ensuring default groups:', err);
  }).finally(() => {
    groupsSeedPromise = null;
  });

  await groupsSeedPromise;
}

function buildLastMessageMap(messageRows = []) {
  const map = new Map();
  for (const row of messageRows) {
    if (!row?.group_id) continue;
    if (map.has(row.group_id)) continue; // already captured newest due to sorted order
    map.set(row.group_id, {
      content: row.content,
      created_at: row.created_at,
      user_id: row.user_id,
      user: row.users ? {
        id: row.users.id,
        username: row.users.username,
        avatar_url: row.users.avatar_url
      } : null
    });
  }
  return map;
}

function buildMemberSummary(memberRows = []) {
  const map = new Map();
  for (const row of memberRows) {
    if (!row?.group_id) continue;
    const entry = map.get(row.group_id) || { count: 0, preview: [] };
    entry.count += 1;
    if (entry.preview.length < 3) {
      entry.preview.push({
        id: row.user_id,
        username: row.users?.username || 'Member',
        avatar_url: row.users?.avatar_url || null
      });
    }
    map.set(row.group_id, entry);
  }
  return map;
}

async function getAuthEmail(userId, context = '[groups]') {
  if (!supabaseAdmin || !userId) return null;
  try {
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
    return authUser?.user?.email || null;
  } catch (e) {
    console.log(`${context} Could not fetch auth user email:`, e.message);
    return null;
  }
}

router.get('/', async (req, res) => {
  try {
    await ensureDefaultGroups();
    const { data: groups, error } = await readClient.from('groups').select('*').order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });

    const groupIds = (groups || []).map(g => g.id).filter(Boolean);
    let lastMessageMap = new Map();
    let memberSummaryMap = new Map();

    if (groupIds.length) {
      // Fetch messages without foreign key relationship (to avoid schema cache issues)
      const { data: lastMessages, error: lastErr } = await readClient
        .from('messages')
        .select('group_id, content, created_at, user_id')
        .in('group_id', groupIds)
        .order('created_at', { ascending: false });

      if (lastErr) {
        console.error('[groups] Error fetching last messages:', lastErr);
      }

      // Fetch users separately
      let usersMap = new Map();
      if (Array.isArray(lastMessages) && lastMessages.length > 0) {
        const userIds = [...new Set(lastMessages.map(m => m.user_id).filter(Boolean))];
        if (userIds.length > 0) {
          const { data: users, error: usersErr } = await readClient
            .from('users')
            .select('id, username, avatar_url')
            .in('id', userIds);

          if (usersErr) {
            console.error('[groups] Error fetching users for messages:', usersErr);
          } else if (Array.isArray(users)) {
            users.forEach(u => usersMap.set(u.id, u));
          }
        }

        // Build last message map with user details
        for (const msg of lastMessages) {
          if (!msg?.group_id) continue;
          if (lastMessageMap.has(msg.group_id)) continue; // already captured newest

          const user = usersMap.get(msg.user_id);
          lastMessageMap.set(msg.group_id, {
            content: msg.content,
            created_at: msg.created_at,
            user_id: msg.user_id,
            user: user ? {
              id: user.id,
              username: user.username,
              avatar_url: user.avatar_url
            } : null
          });
        }
      }

      const { data: memberships, error: memberErr } = await readClient
        .from('group_members')
        .select('group_id, user_id, users(id, username, avatar_url)')
        .in('group_id', groupIds);
      if (!memberErr && Array.isArray(memberships)) {
        memberSummaryMap = buildMemberSummary(memberships);
      }
    }

    const enriched = (groups || []).map(group => {
      const summary = memberSummaryMap.get(group.id) || { count: 0, preview: [] };
      const lastMessage = lastMessageMap.get(group.id) || null;
      return {
        ...group,
        member_count: summary.count,
        member_preview: summary.preview,
        last_message: lastMessage,
        admin_user_id: DEFAULT_GROUP_ADMIN.id
      };
    });

    res.json(enriched);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.post('/', async (req, res) => {
  try {
    // Validate user_id exists in public.users
    const userId = req.body?.user_id || null;
    if (!userId) return res.status(400).json({ error: 'user_id required' });
    
    const emailHint = await getAuthEmail(userId, '[groups]');

    const ensureResult = await ensureUserRecord({
      client: writeClient,
      userId,
      emailHint,
      loggerPrefix: '[groups]'
    });

    if (!ensureResult.ok) {
      console.error('[groups] Failed to ensure user record for group creation:', ensureResult.error);
      return res.status(500).json({
        error: 'Could not create user record. Please ensure you are signed in and try again.',
        hint: 'Your account may need to be set up. Try signing out and back in.',
        details: ensureResult.error?.message || ensureResult.error || null
      });
    }
    
    // Verify we have a matching auth user, otherwise drop created_by to avoid FK violations
    let creatorId = userId;
    if (supabaseAdmin && userId) {
      try {
        const { data: authLookup, error: authErr } = await supabaseAdmin.auth.admin.getUserById(userId);
        if (authErr || !authLookup?.user) {
          console.log('[groups] auth.users record missing for', userId, '- storing null created_by');
          creatorId = null;
        }
      } catch (authCheckErr) {
        console.log('[groups] auth user lookup failed:', authCheckErr.message);
        creatorId = null;
      }
    } else if (!supabaseAdmin) {
      creatorId = null;
    }

    // Final safety check: if the public.users row still does not exist, avoid FK violations
    if (creatorId) {
      const { data: finalUser, error: finalUserErr } = await writeClient
        .from('users')
        .select('id')
        .eq('id', creatorId)
        .maybeSingle();
      if (finalUserErr) {
        console.log('[groups] Final user lookup failed, storing null created_by:', finalUserErr.message);
        creatorId = null;
      } else if (!finalUser) {
        console.log('[groups] Final user lookup returned empty, storing null created_by');
        creatorId = null;
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
    
    const payload = { name: groupName, created_by: creatorId };
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

// Helper functions for role-based pinning
async function getProfileRole(userId) {
  if (!userId || !supabaseAdmin) return 'consumer';
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) {
    console.error('[groups] Failed to get profile role:', error.message);
    return 'consumer';
  }
  return data?.role || 'consumer';
}

function canPinRole(role) {
  return ['grower', 'dispensary', 'moderator', 'admin'].includes(role);
}

router.get('/:id/messages', async (req, res) => {
  try {
    // Use select('*') to handle missing columns gracefully
    const { data, error } = await readClient
      .from('messages')
      .select('*')
      .eq('group_id', req.params.id)
      .order('created_at', { ascending: false })
      .limit(1000);

    if (error) {
      console.error('[groups/:id/messages] Supabase error', { 
        groupId: req.params.id,
        error: error.message || error,
        code: error.code,
        details: error.details
      });
      // Return empty array instead of 500 to keep frontend alive
      return res.status(200).json({ messages: [], pinnedMessages: [] });
    }

    const rawMessages = data || [];
    const userIds = [...new Set(rawMessages.map(m => m.user_id).filter(Boolean))];

    let profilesMap = new Map();
    let usersMap = new Map();

    if (userIds.length) {
      const [{ data: profileRows, error: profileErr }, { data: userRows, error: userErr }] = await Promise.all([
        readClient
          .from('profiles')
          .select('user_id, display_name, username, avatar_url')
          .in('user_id', userIds),
        readClient
          .from('users')
          .select('id, username, email, avatar_url')
          .in('id', userIds)
      ]);

      if (profileErr) {
        console.error('[groups/messages] Failed to load profiles:', profileErr.message);
      } else if (Array.isArray(profileRows)) {
        profilesMap = new Map(profileRows.map(row => [row.user_id, row]));
      }

      if (userErr) {
        console.error('[groups/messages] Failed to load users:', userErr.message);
      } else if (Array.isArray(userRows)) {
        usersMap = new Map(userRows.map(row => [row.id, row]));
      }
    }

    const messages = rawMessages
      .reverse()
      .map(message => {
        const profile = profilesMap.get(message.user_id);
        const supaUser = usersMap.get(message.user_id);
        const fallbackName = profile?.display_name
          || supaUser?.username
          || (supaUser?.email ? supaUser.email.split('@')[0] : null)
          || `Member ${String(message.user_id || '').slice(0, 8)}`;

        return {
          ...message,
          users: {
            id: message.user_id,
            username: profile?.username || supaUser?.username || fallbackName,
            avatar_url: profile?.avatar_url || supaUser?.avatar_url || null,
            email: supaUser?.email || null,
            display_name: fallbackName
          },
          profile
        };
      });

    // Separate pinned messages
    const pinnedMessages = messages
      .filter(m => m.pinned_at)
      .sort((a, b) => new Date(b.pinned_at) - new Date(a.pinned_at));

    res.json({ messages, pinnedMessages });
  } catch (e) {
    console.error('[groups/:id/messages] error', {
      message: e.message,
      stack: e.stack,
      groupId: req.params.id
    });
    // Return empty array instead of 500 to keep frontend alive
    res.status(200).json({ messages: [], pinnedMessages: [] });
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
      const ensureResult = await ensureUserRecord({
        client: writeClient,
        userId,
        emailHint: await getAuthEmail(userId, '[groups/message]'),
        loggerPrefix: '[groups/message]'
      });

      if (!ensureResult.ok) {
        console.error('[groups/message] Failed to ensure user before posting message:', ensureResult.error);
        return res.status(500).json({
          error: 'Could not verify your account for messaging. Please try again.',
          details: ensureResult.error?.message || ensureResult.error || null
        });
      }
    }
    
    // Insert new message
    const payload = { group_id: groupId, user_id: userId, content: cleaned };
    const { data: messageData, error } = await writeClient
      .from('messages')
      .insert(payload)
      .select('*')
      .single();
    if (error) {
      const hint = (!supabaseAdmin && /row-level security/i.test(error.message))
        ? 'RLS blocked message creation. Service role key may be needed.'
        : null;
      return res.status(500).json({ error: error.message, hint });
    }

    // Fetch user data separately
    let userData = null;
    if (userId) {
      const { data: user } = await writeClient
        .from('users')
        .select('id, username, avatar_url')
        .eq('id', userId)
        .single();
      userData = user;
    }

    // Combine message and user data
    const data = {
      ...messageData,
      users: userData
    };
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

    const ensureResult = await ensureUserRecord({
      client: writeClient,
      userId: user_id,
      emailHint: await getAuthEmail(user_id, '[groups/join]'),
      loggerPrefix: '[groups/join]'
    });

    if (!ensureResult.ok) {
      console.error('[groups/join] Failed to ensure user before joining group:', ensureResult.error);
      return res.status(500).json({
        error: 'Could not verify your account for joining this group.',
        details: ensureResult.error?.message || ensureResult.error || null
      });
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

// POST /:groupId/messages/:messageId/pin - Pin a message
router.post('/:groupId/messages/:messageId/pin', async (req, res) => {
  try {
    const { groupId, messageId } = req.params;
    const { user_id } = req.body;
    if (!user_id) return res.status(400).json({ error: 'user_id required' });

    const role = await getProfileRole(user_id);
    if (!canPinRole(role)) {
      return res.status(403).json({ error: 'Not allowed to pin messages' });
    }

    const { data, error } = await supabaseAdmin
      .from('messages')
      .update({
        pinned_at: new Date().toISOString(),
        pinned_by: user_id
      })
      .eq('id', messageId)
      .eq('group_id', groupId)
      .select('*')
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ message: 'Pinned', data });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
});

// POST /:groupId/messages/:messageId/unpin - Unpin a message
router.post('/:groupId/messages/:messageId/unpin', async (req, res) => {
  try {
    const { groupId, messageId } = req.params;
    const { user_id } = req.body;
    if (!user_id) return res.status(400).json({ error: 'user_id required' });

    const role = await getProfileRole(user_id);
    if (!canPinRole(role)) {
      return res.status(403).json({ error: 'Not allowed to unpin messages' });
    }

    const { data, error } = await supabaseAdmin
      .from('messages')
      .update({
        pinned_at: null,
        pinned_by: null
      })
      .eq('id', messageId)
      .eq('group_id', groupId)
      .select('*')
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ message: 'Unpinned', data });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
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
        users(id, username, avatar_url, email)
      `)
      .eq('group_id', req.params.id);

    if (error) return res.status(500).json({ error: error.message });

    const members = data || [];
    const memberIds = [...new Set(members.map(m => m.user_id).filter(Boolean))];
    let profilesMap = new Map();

    if (memberIds.length) {
      const { data: profileRows, error: profileErr } = await readClient
        .from('profiles')
        .select('user_id, display_name, username, avatar_url')
        .in('user_id', memberIds);

      if (profileErr) {
        console.error('[groups/members] Failed to load profiles:', profileErr.message);
      } else {
        profilesMap = new Map(profileRows.map(row => [row.user_id, row]));
      }
    }

    const enrichedMembers = members.map(member => {
      const profile = profilesMap.get(member.user_id);
      const fallbackName = member.users?.username
        || (member.users?.email ? member.users.email.split('@')[0] : null)
        || `Member ${String(member.user_id || '').slice(0, 8)}`;

      return {
        ...member,
        users: {
          ...member.users,
          display_name: profile?.display_name || fallbackName,
          username: profile?.username || member.users?.username,
          avatar_url: profile?.avatar_url || member.users?.avatar_url || null
        },
        profile
      };
    });

    enrichedMembers.sort((a, b) => {
      const nameA = a.users?.display_name || '';
      const nameB = b.users?.display_name || '';
      return nameA.localeCompare(nameB, undefined, { sensitivity: 'base' });
    });

    res.json(enrichedMembers);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

export default router;
