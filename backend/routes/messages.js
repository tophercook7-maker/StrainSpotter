/**
 * Messaging API Routes
 * 
 * Endpoints for:
 * - Creating conversations
 * - Sending/receiving messages
 * - Marking messages as read
 * - Flagging messages
 * - Blocking users
 */

import express from 'express';
import { supabase } from '../supabaseClient.js';
import { supabaseAdmin } from '../supabaseAdmin.js';

const router = express.Router();

// ============================================
// CONVERSATION ENDPOINTS
// ============================================

/**
 * POST /api/messages/conversations/create
 * Create a new direct conversation
 */
router.post('/conversations/create', async (req, res) => {
  try {
    const { userId, otherUserId } = req.body;

    if (!userId || !otherUserId) {
      return res.status(400).json({ error: 'userId and otherUserId are required' });
    }

    if (userId === otherUserId) {
      return res.status(400).json({ error: 'Cannot create conversation with yourself' });
    }

    const client = supabaseAdmin ?? supabase;

    // Check if user is blocked
    const { data: blocked } = await client
      .from('blocked_users')
      .select('*')
      .or(`and(blocker_id.eq.${otherUserId},blocked_id.eq.${userId}),and(blocker_id.eq.${userId},blocked_id.eq.${otherUserId})`)
      .single();

    if (blocked) {
      return res.status(403).json({ error: 'Cannot create conversation with this user' });
    }

    // Check if conversation already exists using the helper function
    const { data: existingConv, error: convError } = await client
      .rpc('create_direct_conversation', { other_user_id: otherUserId });

    if (convError) {
      console.error('Error creating conversation:', convError);
      return res.status(500).json({ error: convError.message });
    }

    res.json({ success: true, conversation: existingConv });
  } catch (e) {
    console.error('Error in create conversation:', e);
    res.status(500).json({ error: String(e) });
  }
});

/**
 * GET /api/messages/conversations
 * List user's conversations
 */
router.get('/conversations', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const client = supabaseAdmin ?? supabase;

    // Get conversations where user is a participant
    const { data: participants, error: partError } = await client
      .from('conversation_participants')
      .select('conversation_id, last_read_at')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (partError) {
      console.error('Error fetching participants:', partError);
      return res.status(500).json({ error: partError.message });
    }

    if (!participants || participants.length === 0) {
      return res.json({ conversations: [] });
    }

    const conversationIds = participants.map(p => p.conversation_id);

    // Get conversation details
    const { data: conversations, error: convError } = await client
      .from('conversations')
      .select('*')
      .in('id', conversationIds)
      .order('updated_at', { ascending: false });

    if (convError) {
      console.error('Error fetching conversations:', convError);
      return res.status(500).json({ error: convError.message });
    }

    // Get other participants for each conversation
    const conversationsWithParticipants = await Promise.all(
      conversations.map(async (conv) => {
        const { data: otherParticipants } = await client
          .from('conversation_participants')
          .select('user_id, profiles!inner(*)')
          .eq('conversation_id', conv.id)
          .neq('user_id', userId);

        // Get last message
        const { data: lastMessage } = await client
          .from('messages')
          .select('*')
          .eq('conversation_id', conv.id)
          .eq('is_deleted', false)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // Get unread count
        const participant = participants.find(p => p.conversation_id === conv.id);
        const { count: unreadCount } = await client
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .neq('sender_id', userId)
          .eq('is_deleted', false)
          .gt('created_at', participant?.last_read_at || '1970-01-01');

        return {
          ...conv,
          participants: otherParticipants || [],
          lastMessage,
          unreadCount: unreadCount || 0
        };
      })
    );

    res.json({ conversations: conversationsWithParticipants });
  } catch (e) {
    console.error('Error in list conversations:', e);
    res.status(500).json({ error: String(e) });
  }
});

/**
 * GET /api/messages/conversations/:id
 * Get conversation details
 */
router.get('/conversations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const client = supabaseAdmin ?? supabase;

    // Verify user is participant
    const { data: participant, error: partError } = await client
      .from('conversation_participants')
      .select('*')
      .eq('conversation_id', id)
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (partError || !participant) {
      return res.status(403).json({ error: 'Not authorized to view this conversation' });
    }

    // Get conversation
    const { data: conversation, error: convError } = await client
      .from('conversations')
      .select('*')
      .eq('id', id)
      .single();

    if (convError) {
      console.error('Error fetching conversation:', convError);
      return res.status(500).json({ error: convError.message });
    }

    // Get all participants
    const { data: participants, error: partsError } = await client
      .from('conversation_participants')
      .select('user_id, profiles!inner(*)')
      .eq('conversation_id', id);

    if (partsError) {
      console.error('Error fetching participants:', partsError);
      return res.status(500).json({ error: partsError.message });
    }

    res.json({
      ...conversation,
      participants: participants || []
    });
  } catch (e) {
    console.error('Error in get conversation:', e);
    res.status(500).json({ error: String(e) });
  }
});

// ============================================
// MESSAGE ENDPOINTS
// ============================================

/**
 * GET /api/messages/conversations/:id/messages
 * Get messages in a conversation
 */
router.get('/conversations/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, limit = 50, offset = 0 } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const client = supabaseAdmin ?? supabase;

    // Verify user is participant
    const { data: participant, error: partError } = await client
      .from('conversation_participants')
      .select('*')
      .eq('conversation_id', id)
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (partError || !participant) {
      return res.status(403).json({ error: 'Not authorized to view these messages' });
    }

    // Get messages
    const { data: messages, error: msgError } = await client
      .from('messages')
      .select('*, sender:profiles!sender_id(*)')
      .eq('conversation_id', id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (msgError) {
      console.error('Error fetching messages:', msgError);
      return res.status(500).json({ error: msgError.message });
    }

    res.json({ messages: messages || [] });
  } catch (e) {
    console.error('Error in get messages:', e);
    res.status(500).json({ error: String(e) });
  }
});

/**
 * POST /api/messages/conversations/:id/messages
 * Send a message
 */
router.post('/conversations/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, content } = req.body;

    if (!userId || !content) {
      return res.status(400).json({ error: 'userId and content are required' });
    }

    if (content.trim().length === 0) {
      return res.status(400).json({ error: 'Message content cannot be empty' });
    }

    if (content.length > 5000) {
      return res.status(400).json({ error: 'Message content too long (max 5000 characters)' });
    }

    const client = supabaseAdmin ?? supabase;

    // Verify user is participant
    const { data: participant, error: partError } = await client
      .from('conversation_participants')
      .select('*')
      .eq('conversation_id', id)
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (partError || !participant) {
      return res.status(403).json({ error: 'Not authorized to send messages in this conversation' });
    }

    // Check rate limits using helper function
    const { data: canSend, error: rateLimitError } = await client
      .rpc('can_send_message', { p_conversation_id: id });

    if (rateLimitError || !canSend) {
      return res.status(429).json({ 
        error: 'Daily message limit reached. Please try again tomorrow.' 
      });
    }

    // Send message
    const { data: message, error: msgError } = await client
      .from('messages')
      .insert({
        conversation_id: id,
        sender_id: userId,
        content: content.trim()
      })
      .select('*, sender:profiles!sender_id(*)')
      .single();

    if (msgError) {
      console.error('Error sending message:', msgError);
      return res.status(500).json({ error: msgError.message });
    }

    // Increment rate limit counter
    await client.rpc('increment_message_count', { p_conversation_id: id });

    // Update conversation updated_at
    await client
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', id);

    res.json({ success: true, message });
  } catch (e) {
    console.error('Error in send message:', e);
    res.status(500).json({ error: String(e) });
  }
});

/**
 * POST /api/messages/:id/flag
 * Flag a message as inappropriate
 */
router.post('/:id/flag', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, reason } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const client = supabaseAdmin ?? supabase;

    // Update message
    const { data, error } = await client
      .from('messages')
      .update({
        is_flagged: true,
        flagged_by: userId,
        flagged_at: new Date().toISOString(),
        flag_reason: reason || 'No reason provided'
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error flagging message:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true, message: data });
  } catch (e) {
    console.error('Error in flag message:', e);
    res.status(500).json({ error: String(e) });
  }
});

/**
 * POST /api/messages/:id/read
 * Mark message as read
 */
router.post('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const client = supabaseAdmin ?? supabase;

    // Get message to find conversation
    const { data: message, error: msgError } = await client
      .from('messages')
      .select('conversation_id')
      .eq('id', id)
      .single();

    if (msgError) {
      console.error('Error fetching message:', msgError);
      return res.status(500).json({ error: msgError.message });
    }

    // Update last_read_at for this conversation
    const { error: updateError } = await client
      .from('conversation_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', message.conversation_id)
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error updating read status:', updateError);
      return res.status(500).json({ error: updateError.message });
    }

    res.json({ success: true });
  } catch (e) {
    console.error('Error in mark as read:', e);
    res.status(500).json({ error: String(e) });
  }
});

/**
 * GET /api/messages/unread-count
 * Get unread message count
 */
router.get('/unread-count', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const client = supabaseAdmin ?? supabase;

    // Get all conversations for user
    const { data: participants, error: partError } = await client
      .from('conversation_participants')
      .select('conversation_id, last_read_at')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (partError) {
      console.error('Error fetching participants:', partError);
      return res.status(500).json({ error: partError.message });
    }

    if (!participants || participants.length === 0) {
      return res.json({ totalUnread: 0, byConversation: [] });
    }

    // Count unread messages for each conversation
    const unreadCounts = await Promise.all(
      participants.map(async (p) => {
        const { count } = await client
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', p.conversation_id)
          .neq('sender_id', userId)
          .eq('is_deleted', false)
          .gt('created_at', p.last_read_at || '1970-01-01');

        return {
          conversationId: p.conversation_id,
          unreadCount: count || 0
        };
      })
    );

    const totalUnread = unreadCounts.reduce((sum, c) => sum + c.unreadCount, 0);

    res.json({
      totalUnread,
      byConversation: unreadCounts
    });
  } catch (e) {
    console.error('Error in get unread count:', e);
    res.status(500).json({ error: String(e) });
  }
});

// ============================================
// BLOCKING ENDPOINTS
// ============================================

/**
 * POST /api/messages/users/:id/block
 * Block a user
 */
router.post('/users/:id/block', async (req, res) => {
  try {
    const { id: blockedId } = req.params;
    const { userId, reason } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    if (userId === blockedId) {
      return res.status(400).json({ error: 'Cannot block yourself' });
    }

    const client = supabaseAdmin ?? supabase;

    const { data, error } = await client
      .from('blocked_users')
      .insert({
        blocker_id: userId,
        blocked_id: blockedId,
        reason: reason || null
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return res.status(400).json({ error: 'User is already blocked' });
      }
      console.error('Error blocking user:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true, block: data });
  } catch (e) {
    console.error('Error in block user:', e);
    res.status(500).json({ error: String(e) });
  }
});

/**
 * DELETE /api/messages/users/:id/block
 * Unblock a user
 */
router.delete('/users/:id/block', async (req, res) => {
  try {
    const { id: blockedId } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const client = supabaseAdmin ?? supabase;

    const { error } = await client
      .from('blocked_users')
      .delete()
      .eq('blocker_id', userId)
      .eq('blocked_id', blockedId);

    if (error) {
      console.error('Error unblocking user:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true });
  } catch (e) {
    console.error('Error in unblock user:', e);
    res.status(500).json({ error: String(e) });
  }
});

/**
 * GET /api/messages/users/blocked
 * Get list of blocked users
 */
router.get('/users/blocked', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const client = supabaseAdmin ?? supabase;

    const { data, error } = await client
      .from('blocked_users')
      .select('*, blocked:profiles!blocked_id(*)')
      .eq('blocker_id', userId)
      .order('blocked_at', { ascending: false });

    if (error) {
      console.error('Error fetching blocked users:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ blockedUsers: data || [] });
  } catch (e) {
    console.error('Error in get blocked users:', e);
    res.status(500).json({ error: String(e) });
  }
});

export default router;

