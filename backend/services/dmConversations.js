// backend/services/dmConversations.js
// Helper functions for DM conversations (1:1 messaging)

import { supabaseAdmin } from '../supabaseAdmin.js';

/**
 * Get or create a DM conversation between two users
 * Ensures canonical ordering (user_a_id < user_b_id)
 * @param {string} userId1 - First user ID
 * @param {string} userId2 - Second user ID
 * @returns {Promise<string>} conversation_id
 */
export async function getOrCreateUserUserDM(userId1, userId2) {
  if (!userId1 || !userId2) {
    throw new Error('Both user IDs are required for user-user DM');
  }

  if (userId1 === userId2) {
    throw new Error('Cannot create DM with yourself');
  }

  // Canonical ordering: always store smaller ID as user_a_id
  const [userA, userB] = [userId1, userId2].sort();

  // Check if conversation already exists
  const { data: existing, error: existingError } = await supabaseAdmin
    .from('dm_conversations')
    .select('id')
    .eq('user_a_id', userA)
    .eq('user_b_id', userB)
    .is('business_b_id', null)
    .maybeSingle();

  if (existingError) {
    console.error('[dmConversations] getOrCreateUserUserDM lookup error', existingError);
    throw existingError;
  }

  if (existing?.id) {
    return existing.id;
  }

  // Create new conversation
  const { data: newConv, error: createError } = await supabaseAdmin
    .from('dm_conversations')
    .insert({
      user_a_id: userA,
      user_b_id: userB,
      business_b_id: null,
    })
    .select('id')
    .single();

  if (createError) {
    console.error('[dmConversations] getOrCreateUserUserDM create error', createError);
    throw createError;
  }

  // Initialize read receipts for both users
  await supabaseAdmin.from('dm_read_receipts').insert([
    { conversation_id: newConv.id, user_id: userA, unread_count: 0 },
    { conversation_id: newConv.id, user_id: userB, unread_count: 0 },
  ]);

  return newConv.id;
}

/**
 * Get or create a DM conversation between a user and a business
 * @param {string} userId - User ID
 * @param {string} businessId - Business profile ID
 * @returns {Promise<string>} conversation_id
 */
export async function getOrCreateUserBusinessDM(userId, businessId) {
  if (!userId || !businessId) {
    throw new Error('User ID and business ID are required for user-business DM');
  }

  // Check if conversation already exists
  // For user-business, user_a_id is always the user
  const { data: existing, error: existingError } = await supabaseAdmin
    .from('dm_conversations')
    .select('id')
    .eq('user_a_id', userId)
    .eq('business_b_id', businessId)
    .is('user_b_id', null)
    .maybeSingle();

  if (existingError) {
    console.error('[dmConversations] getOrCreateUserBusinessDM lookup error', existingError);
    throw existingError;
  }

  if (existing?.id) {
    return existing.id;
  }

  // Get business owner's user_id for read receipts
  const { data: business, error: businessError } = await supabaseAdmin
    .from('business_profiles')
    .select('user_id')
    .eq('id', businessId)
    .single();

  if (businessError || !business) {
    throw new Error('Business not found');
  }

  // Create new conversation
  const { data: newConv, error: createError } = await supabaseAdmin
    .from('dm_conversations')
    .insert({
      user_a_id: userId,
      user_b_id: null,
      business_b_id: businessId,
    })
    .select('id')
    .single();

  if (createError) {
    console.error('[dmConversations] getOrCreateUserBusinessDM create error', createError);
    throw createError;
  }

  // Initialize read receipts for user and business owner
  await supabaseAdmin.from('dm_read_receipts').insert([
    { conversation_id: newConv.id, user_id: userId, unread_count: 0 },
    { conversation_id: newConv.id, user_id: business.user_id, unread_count: 0 },
  ]);

  return newConv.id;
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

  // Insert message
  const { data: message, error: msgError } = await supabaseAdmin
    .from('dm_messages')
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      body,
      image_url: imageUrl || null,
      image_type: imageType || null,
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
    .from('dm_conversations')
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
    .from('dm_conversations')
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

