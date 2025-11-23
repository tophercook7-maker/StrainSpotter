// backend/services/dmConversations.js
// Helper functions for DM conversations (1:1 messaging)
// Uses the conversations table with is_group=false for DMs

import { supabaseAdmin } from '../supabaseAdmin.js';

/**
 * Find or create a conversation for user-user DM
 * Ensures canonical ordering (user_a_id < user_b_id)
 * @param {string} userAId - First user ID
 * @param {string} userBId - Second user ID
 * @returns {Promise<object>} conversation object
 */
export async function findOrCreateConversationForUserUser(userAId, userBId) {
  if (!userAId || !userBId) {
    throw new Error('Both user IDs are required for user-user DM');
  }

  if (userAId === userBId) {
    throw new Error('Cannot create DM with yourself');
  }

  // Order IDs so (A,B) and (B,A) match same row
  const [minId, maxId] = [userAId, userBId].sort();

  const { data: conv, error: lookupError } = await supabaseAdmin
    .from('conversations')
    .select('*')
    .eq('user_a_id', minId)
    .eq('user_b_id', maxId)
    .eq('is_group', false)
    .is('business_b_id', null)
    .maybeSingle();

  if (lookupError) {
    console.error('[dmConversations] findOrCreateConversationForUserUser lookup error', lookupError);
    throw lookupError;
  }

  if (conv) return conv;

  const { data, error } = await supabaseAdmin
    .from('conversations')
    .insert({
      is_group: false,
      user_a_id: minId,
      user_b_id: maxId,
      business_b_id: null,
    })
    .select('*')
    .single();

  if (error) {
    console.error('[dmConversations] findOrCreateConversationForUserUser create error', error);
    throw error;
  }

  return data;
}

/**
 * Find or create a conversation for user-business DM
 * @param {string} userId - User ID
 * @param {string} businessId - Business profile ID
 * @returns {Promise<object>} conversation object
 */
export async function findOrCreateConversationForUserBusiness(userId, businessId) {
  if (!userId || !businessId) {
    throw new Error('User ID and business ID are required for user-business DM');
  }

  const { data: conv, error: lookupError } = await supabaseAdmin
    .from('conversations')
    .select('*')
    .eq('user_a_id', userId)
    .eq('is_group', false)
    .is('user_b_id', null)
    .eq('business_b_id', businessId)
    .maybeSingle();

  if (lookupError) {
    console.error('[dmConversations] findOrCreateConversationForUserBusiness lookup error', lookupError);
    throw lookupError;
  }

  if (conv) return conv;

  const { data, error } = await supabaseAdmin
    .from('conversations')
    .insert({
      is_group: false,
      user_a_id: userId,
      user_b_id: null,
      business_b_id: businessId,
    })
    .select('*')
    .single();

  if (error) {
    console.error('[dmConversations] findOrCreateConversationForUserBusiness create error', error);
    throw error;
  }

  return data;
}

/**
 * Get or create a DM conversation between two users (backward compatibility)
 * @param {string} userId1 - First user ID
 * @param {string} userId2 - Second user ID
 * @returns {Promise<string>} conversation_id
 */
export async function getOrCreateUserUserDM(userId1, userId2) {
  const conv = await findOrCreateConversationForUserUser(userId1, userId2);
  return conv.id;
}

/**
 * Get or create a DM conversation between a user and a business (backward compatibility)
 * @param {string} userId - User ID
 * @param {string} businessId - Business profile ID
 * @returns {Promise<string>} conversation_id
 */
export async function getOrCreateUserBusinessDM(userId, businessId) {
  const conv = await findOrCreateConversationForUserBusiness(userId, businessId);
  return conv.id;
}

/**
 * Send a message in a DM conversation and update conversation metadata
 * @param {string} conversationId - Conversation ID
 * @param {string} senderId - Sender user ID
 * @param {string} body - Message body
 * @param {object} options - Optional imageUrl, imageType
 * @returns {Promise<object>} { message, conversation }
 */
export async function sendDMMessage(conversationId, senderId, body, options = {}) {
  const { imageUrl, imageType } = options;

  // Insert message (use conversation_messages for group chats, dm_messages for DMs)
  // For now, we'll use conversation_messages for all conversations
  const { data: message, error: msgError } = await supabaseAdmin
    .from('conversation_messages')
    .insert({
      conversation_id: conversationId,
      sender_user_id: senderId,
      body: body || null,
      image_url: imageUrl || null,
    })
    .select('*')
    .single();

  if (msgError) {
    console.error('[dmConversations] sendDMMessage insert error', msgError);
    throw msgError;
  }

  // Update conversation metadata
  const previewText = body.length > 100 ? body.substring(0, 100) + '...' : body;
  const { error: updateError } = await supabaseAdmin
    .from('conversations')
    .update({
      last_message_text: previewText,
      last_message_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', conversationId);

  if (updateError) {
    console.error('[dmConversations] sendDMMessage update conversation error', updateError);
    // Don't throw - message was created successfully
  }

  // Increment unread count for the recipient(s)
  const { data: conversation } = await supabaseAdmin
    .from('conversations')
    .select('user_a_id, user_b_id, business_b_id')
    .eq('id', conversationId)
    .single();

  if (conversation) {
    const recipientIds = [];
    if (conversation.user_a_id !== senderId) recipientIds.push(conversation.user_a_id);
    if (conversation.user_b_id && conversation.user_b_id !== senderId) {
      recipientIds.push(conversation.user_b_id);
    }
    if (conversation.business_b_id) {
      // Get business owner's user_id
      const { data: business } = await supabaseAdmin
        .from('business_profiles')
        .select('user_id')
        .eq('id', conversation.business_b_id)
        .single();
      if (business && business.user_id !== senderId) {
        recipientIds.push(business.user_id);
      }
    }

    // Increment unread count for recipients
    for (const recipientId of recipientIds) {
      await supabaseAdmin.rpc('increment_dm_unread_count', {
        p_conversation_id: conversationId,
        p_user_id: recipientId,
      }).catch(() => {
        // Fallback if RPC doesn't exist - update manually
        const { data: receipt } = await supabaseAdmin
          .from('dm_read_receipts')
          .select('unread_count')
          .eq('conversation_id', conversationId)
          .eq('user_id', recipientId)
          .single();
        
        if (receipt) {
          await supabaseAdmin
            .from('dm_read_receipts')
            .update({ unread_count: (receipt.unread_count || 0) + 1 })
            .eq('conversation_id', conversationId)
            .eq('user_id', recipientId);
        }
      });
    }
  }

  return { message, conversationId };
}

/**
 * Mark messages as read in a conversation
 * @param {string} conversationId - Conversation ID
 * @param {string} userId - User ID marking as read
 * @returns {Promise<void>}
 */
export async function markDMConversationAsRead(conversationId, userId) {
  // Mark all unread messages as read
  const { error: updateError } = await supabaseAdmin
    .from('dm_messages')
    .update({ read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .neq('sender_id', userId)
    .is('read_at', null);

  if (updateError) {
    console.error('[dmConversations] markDMConversationAsRead update messages error', updateError);
  }

  // Get the latest message ID
  const { data: latestMessage } = await supabaseAdmin
    .from('dm_messages')
    .select('id')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  // Update read receipt
  const { error: receiptError } = await supabaseAdmin
    .from('dm_read_receipts')
    .upsert({
      conversation_id: conversationId,
      user_id: userId,
      last_read_message_id: latestMessage?.id || null,
      last_read_at: new Date().toISOString(),
      unread_count: 0,
    }, {
      onConflict: 'conversation_id,user_id',
    });

  if (receiptError) {
    console.error('[dmConversations] markDMConversationAsRead update receipt error', receiptError);
  }
}

