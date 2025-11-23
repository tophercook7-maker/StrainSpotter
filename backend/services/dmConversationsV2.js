// backend/services/dmConversationsV2.js
// New dedicated DM system using dm_conversations and dm_messages tables

import { supabaseAdmin } from '../supabaseAdmin.js';

/**
 * Get or create a DM conversation between two users
 * Ensures canonical ordering (participant_a < participant_b)
 * @param {string} userId - Current user ID
 * @param {string} otherUserId - Other user ID
 * @returns {Promise<object>} conversation object with participant info
 */
export async function getOrCreateConversation(userId, otherUserId) {
  if (!userId || !otherUserId) {
    throw new Error('Both user IDs are required');
  }

  if (userId === otherUserId) {
    throw new Error('Cannot create DM with yourself');
  }

  // Canonical ordering: always store smaller UUID as participant_a
  const [participantA, participantB] = [userId, otherUserId].sort();

  // Check if conversation exists
  const { data: existing, error: lookupError } = await supabaseAdmin
    .from('dm_conversations')
    .select('*')
    .eq('participant_a', participantA)
    .eq('participant_b', participantB)
    .maybeSingle();

  if (lookupError) {
    console.error('[dmConversationsV2] lookup error', lookupError);
    throw lookupError;
  }

  if (existing) {
    return existing;
  }

  // Create new conversation
  const { data: conv, error: createError } = await supabaseAdmin
    .from('dm_conversations')
    .insert({
      participant_a: participantA,
      participant_b: participantB,
    })
    .select('*')
    .single();

  if (createError) {
    console.error('[dmConversationsV2] create error', createError);
    throw createError;
  }

  return conv;
}

/**
 * List all conversations for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of conversations with other participant info
 */
export async function listConversations(userId) {
  if (!userId) {
    return [];
  }

  // Get conversations where user is participant_a or participant_b
  const { data: conversations, error } = await supabaseAdmin
    .from('dm_conversations')
    .select('*')
    .or(`participant_a.eq.${userId},participant_b.eq.${userId}`)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('[dmConversationsV2] listConversations error', error);
    return [];
  }

  // Enrich with other participant's profile info
  const enriched = await Promise.all(
    (conversations || []).map(async (conv) => {
      const otherUserId = conv.participant_a === userId ? conv.participant_b : conv.participant_a;

      // Get profile
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('display_name, username, avatar_url')
        .eq('user_id', otherUserId)
        .maybeSingle();

      // Get business profile if exists
      const { data: business } = await supabaseAdmin
        .from('business_profiles')
        .select('name, business_type, avatar_url')
        .eq('user_id', otherUserId)
        .maybeSingle();

      return {
        ...conv,
        otherUserId,
        otherUser: {
          id: otherUserId,
          display_name: profile?.display_name || business?.name || 'User',
          username: profile?.username || null,
          avatar_url: profile?.avatar_url || business?.avatar_url || null,
          business_type: business?.business_type || null,
        },
      };
    })
  );

  return enriched;
}

/**
 * List messages in a conversation with pagination
 * @param {string} conversationId - Conversation ID
 * @param {string|null} before - Cursor (message created_at timestamp)
 * @param {number} limit - Max messages to return
 * @returns {Promise<{messages: Array, hasMore: boolean, nextCursor: string|null}>}
 */
export async function listMessages(conversationId, before = null, limit = 50) {
  if (!conversationId) {
    return { messages: [], hasMore: false, nextCursor: null };
  }

  let query = supabaseAdmin
    .from('dm_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(limit + 1); // Fetch one extra to check for hasMore

  if (before) {
    query = query.lt('created_at', before);
  }

  const { data: messages, error } = await query;

  if (error) {
    console.error('[dmConversationsV2] listMessages error', error);
    return { messages: [], hasMore: false, nextCursor: null };
  }

  const hasMore = messages && messages.length > limit;
  const messagesToReturn = hasMore ? messages.slice(0, limit) : (messages || []);

  // Enrich messages with sender profile info
  const senderIds = [...new Set(messagesToReturn.map(m => m.sender_id).filter(Boolean))];
  const profilesMap = new Map();
  
  if (senderIds.length > 0) {
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('user_id, display_name, username, avatar_url')
      .in('user_id', senderIds);
    
    if (profiles) {
      profiles.forEach(p => profilesMap.set(p.user_id, p));
    }
  }

  const enrichedMessages = messagesToReturn.map(msg => ({
    ...msg,
    sender: profilesMap.get(msg.sender_id) || null,
  }));

  const nextCursor = enrichedMessages.length > 0
    ? enrichedMessages[enrichedMessages.length - 1].created_at
    : null;

  return {
    messages: enrichedMessages.slice().reverse(), // Reverse to show oldest → newest
    hasMore: hasMore || false,
    nextCursor,
  };
}

/**
 * Send a DM message
 * @param {string} conversationId - Conversation ID
 * @param {string} senderId - Sender user ID
 * @param {object} options - { text, attachments }
 * @returns {Promise<object>} Created message
 */
export async function sendDM(conversationId, senderId, { text, attachments }) {
  if (!conversationId || !senderId) {
    throw new Error('conversationId and senderId are required');
  }

  if (!text && (!attachments || attachments.length === 0)) {
    throw new Error('text or attachments is required');
  }

  // Insert message
  const insertPayload = {
    conversation_id: conversationId,
    sender_id: senderId,
    text: text || null,
    attachments: attachments && attachments.length > 0 ? attachments : null,
    is_read: false,
  };

  const { data: message, error: msgError } = await supabaseAdmin
    .from('dm_messages')
    .insert(insertPayload)
    .select('*')
    .single();

  if (msgError) {
    console.error('[dmConversationsV2] sendDM insert error', msgError);
    throw msgError;
  }

  // Update conversation metadata
  const previewText = text
    ? (text.length > 100 ? text.substring(0, 100) + '...' : text)
    : attachments && attachments.length > 0
    ? `📷 ${attachments.length} attachment${attachments.length > 1 ? 's' : ''}`
    : '';

  const { error: updateError } = await supabaseAdmin
    .from('dm_conversations')
    .update({
      last_message_preview: previewText,
      last_message_at: new Date().toISOString(),
      last_message_sender: senderId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', conversationId);

  if (updateError) {
    console.error('[dmConversationsV2] sendDM update conversation error', updateError);
    // Don't throw - message was created successfully
  }

  return message;
}

