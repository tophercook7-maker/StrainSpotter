import express from 'express';
import { supabaseAdmin } from '../supabaseAdmin.js';

const router = express.Router();

async function fetchUserDirectory(userIds = []) {
  const ids = [...new Set(userIds.filter(Boolean))];
  if (!ids.length) {
    return new Map();
  }

  const { data: users, error: usersError } = await supabaseAdmin
    .from('users')
    .select('id, username, email')
    .in('id', ids);

  if (usersError) {
    console.error('[direct-messages] Error loading users:', usersError);
  }

  const { data: profiles, error: profilesError } = await supabaseAdmin
    .from('profiles')
    .select('user_id, display_name, username, avatar_url')
    .in('user_id', ids);

  if (profilesError) {
    console.error('[direct-messages] Error loading profiles:', profilesError);
  }

  const profilesMap = new Map((profiles || []).map(profile => [profile.user_id, profile]));

  return new Map((users || []).map(user => {
    const profile = profilesMap.get(user.id);
    const displayName = profile?.display_name
      || profile?.username
      || user.username
      || (user.email ? user.email.split('@')[0] : null)
      || `Member ${String(user.id || '').slice(0, 8)}`;

    const username = profile?.username
      || user.username
      || displayName;

    return [user.id, {
      user_id: user.id,
      display_name: displayName,
      username,
      email: user.email,
      avatar_url: profile?.avatar_url || null
    }];
  }));
}

/**
 * GET /api/direct-messages/:userId/:otherUserId
 * Load all messages between two users
 */
router.get('/:userId/:otherUserId', async (req, res) => {
  try {
    const { userId, otherUserId } = req.params;

    if (!userId || !otherUserId) {
      return res.status(400).json({ error: 'Both userId and otherUserId are required' });
    }

    // Query messages where either:
    // - sender_id = userId AND receiver_id = otherUserId
    // - sender_id = otherUserId AND receiver_id = userId
    // Limit to last 500 messages to prevent performance issues
    const { data, error } = await supabaseAdmin
      .from('direct_messages')
      .select('*')
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`)
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) {
      console.error('[direct-messages] Error loading messages:', error);
      return res.status(500).json({ error: 'Failed to load messages' });
    }

    // Fetch user details separately
    const userIds = [userId, otherUserId];
    const usersMap = await fetchUserDirectory(userIds);

    // Map response to match frontend expectations and reverse to chronological order
    const messages = (data || []).reverse().map(msg => ({
      ...msg,
      sender: usersMap.get(msg.sender_id) || null,
      receiver: usersMap.get(msg.receiver_id) || null
    }));

    res.json(messages);
  } catch (err) {
    console.error('[direct-messages] Exception:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/direct-messages
 * Send a new direct message
 * Body: { sender_id, receiver_id, content }
 */
router.post('/', async (req, res) => {
  try {
    const { sender_id, receiver_id, content } = req.body;

    if (!sender_id || !receiver_id || !content) {
      return res.status(400).json({ error: 'sender_id, receiver_id, and content are required' });
    }

    // Verify sender is authenticated (check Authorization header)
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user || user.id !== sender_id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Insert the message
    const { data, error } = await supabaseAdmin
      .from('direct_messages')
      .insert({
        sender_id,
        receiver_id,
        content,
        created_at: new Date().toISOString()
      })
      .select('*')
      .single();

    if (error) {
      console.error('[direct-messages] Error sending message:', error);
      return res.status(500).json({ error: 'Failed to send message' });
    }

    // Fetch user details separately
    const usersMap = await fetchUserDirectory([sender_id, receiver_id]);

    // Map response to match frontend expectations
    const message = {
      ...data,
      sender: usersMap.get(sender_id) || null,
      receiver: usersMap.get(receiver_id) || null
    };

    res.json(message);
  } catch (err) {
    console.error('[direct-messages] Exception:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/direct-chats/chats/:userId
 * Get list of all users the current user has chatted with
 * Returns unique users with last message preview
 */
router.get('/chats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Get all messages where user is sender or receiver
    const { data: messages, error } = await supabaseAdmin
      .from('direct_messages')
      .select('*')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[direct-messages] Error loading chats:', error);
      return res.status(500).json({ error: 'Failed to load chats' });
    }

    // Get unique user IDs
    const userIds = [...new Set(messages.flatMap(m => [m.sender_id, m.receiver_id]))];

    // Fetch user details
    const usersMap = await fetchUserDirectory(userIds);

    // Group by other user and get last message + unread count
    const chatsMap = new Map();

    for (const msg of messages) {
      const otherUserId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
      const otherUser = usersMap.get(otherUserId);

      if (!chatsMap.has(otherUserId)) {
        // Count unread messages from this user
        const unreadCount = messages.filter(m =>
          m.sender_id === otherUserId &&
          m.receiver_id === userId &&
          !m.read_at
        ).length;

        chatsMap.set(otherUserId, {
          user: otherUser,
          last_message: msg,
          unread_count: unreadCount
        });
      }
    }

    const chats = Array.from(chatsMap.values());
    res.json(chats);
  } catch (err) {
    console.error('[direct-messages] Exception:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/direct-messages/mark-read/:userId/:otherUserId
 * Mark all messages from otherUserId to userId as read
 */
router.put('/mark-read/:userId/:otherUserId', async (req, res) => {
  try {
    const { userId, otherUserId } = req.params;

    if (!userId || !otherUserId) {
      return res.status(400).json({ error: 'userId and otherUserId are required' });
    }

    // Mark all messages from otherUserId to userId as read
    const { data, error } = await supabaseAdmin
      .from('direct_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('sender_id', otherUserId)
      .eq('receiver_id', userId)
      .is('read_at', null);

    if (error) {
      console.error('[direct-messages] Error marking messages as read:', error);
      return res.status(500).json({ error: 'Failed to mark messages as read' });
    }

    res.json({ success: true, updated: data?.length || 0 });
  } catch (err) {
    console.error('[direct-messages] Exception:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

