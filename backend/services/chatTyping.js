// backend/services/chatTyping.js
// Service for managing typing indicators in group chats and DMs

import { supabaseAdmin } from '../supabaseAdmin.js';

/**
 * Update typing status for a user in a channel
 * @param {string} scope - 'group' or 'dm'
 * @param {string} channelId - group_id or conversation_id
 * @param {string} userId - User ID
 * @param {boolean} isTyping - Whether user is typing
 */
export async function updateTyping(scope, channelId, userId, isTyping) {
  if (!scope || !channelId || !userId) {
    throw new Error('scope, channelId, and userId are required');
  }

  if (!['group', 'dm'].includes(scope)) {
    throw new Error('scope must be "group" or "dm"');
  }

  try {
    if (isTyping) {
      // UPSERT typing record
      const { error } = await supabaseAdmin
        .from('chat_typing')
        .upsert(
          {
            scope,
            channel_id: channelId,
            user_id: userId,
            last_typed_at: new Date().toISOString(),
          },
          {
            onConflict: 'scope,channel_id,user_id',
          }
        );

      if (error) {
        console.error('[chatTyping] updateTyping upsert error', error);
        throw error;
      }
    } else {
      // DELETE typing record
      const { error } = await supabaseAdmin
        .from('chat_typing')
        .delete()
        .eq('scope', scope)
        .eq('channel_id', channelId)
        .eq('user_id', userId);

      if (error) {
        console.error('[chatTyping] updateTyping delete error', error);
        throw error;
      }
    }

    return { success: true };
  } catch (err) {
    console.error('[chatTyping] updateTyping error', err);
    throw err;
  }
}

/**
 * Get currently typing users for a channel
 * @param {string} scope - 'group' or 'dm'
 * @param {string} channelId - group_id or conversation_id
 * @returns {Promise<Array>} Array of typing user objects with id, name, etc.
 */
export async function getTypingUsers(scope, channelId) {
  if (!scope || !channelId) {
    return [];
  }

  try {
    // Get typing records from last 7 seconds
    const sevenSecondsAgo = new Date(Date.now() - 7000).toISOString();

    const { data: typingRecords, error } = await supabaseAdmin
      .from('chat_typing')
      .select(`
        user_id,
        last_typed_at,
        profiles:user_id (
          display_name,
          username,
          email
        )
      `)
      .eq('scope', scope)
      .eq('channel_id', channelId)
      .gte('last_typed_at', sevenSecondsAgo)
      .order('last_typed_at', { ascending: false });

    if (error) {
      console.error('[chatTyping] getTypingUsers error', error);
      return [];
    }

    // Transform to user objects
    return (typingRecords || []).map((record) => {
      const profile = record.profiles || {};
      return {
        id: record.user_id,
        name: profile.display_name || profile.username || (profile.email ? profile.email.split('@')[0] : 'User'),
        lastTypedAt: record.last_typed_at,
      };
    });
  } catch (err) {
    console.error('[chatTyping] getTypingUsers error', err);
    return [];
  }
}

/**
 * Clean up stale typing records (older than 10 seconds)
 * Can be called periodically or on-demand
 */
export async function cleanupStaleTyping() {
  try {
    const tenSecondsAgo = new Date(Date.now() - 10000).toISOString();

    const { error } = await supabaseAdmin
      .from('chat_typing')
      .delete()
      .lt('last_typed_at', tenSecondsAgo);

    if (error) {
      console.error('[chatTyping] cleanupStaleTyping error', error);
    }
  } catch (err) {
    console.error('[chatTyping] cleanupStaleTyping error', err);
  }
}

