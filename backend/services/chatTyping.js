// backend/services/chatTyping.js

import { supabaseAdmin } from '../supabaseAdminClient.js';

const TABLE = 'chat_typing_indicators';
const TYPING_TTL_SECONDS = 10;

function nowPlusSeconds(seconds) {
  const d = new Date();
  d.setSeconds(d.getSeconds() + seconds);
  return d.toISOString();
}

/**
 * Upsert a typing indicator for a user in a group.
 * If it already exists, extends the expiry; otherwise inserts a new row.
 */
export async function upsertTypingIndicator({ userId, groupId, expiresAt }) {
  try {
    if (!userId || !groupId) {
      console.warn('[chatTyping] Missing userId or groupId', { userId, groupId });
      return;
    }

    const expires_at = expiresAt || nowPlusSeconds(TYPING_TTL_SECONDS);

    const { error } = await supabaseAdmin
      .from(TABLE)
      .upsert(
        {
          user_id: userId,
          group_id: groupId,
          expires_at,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,group_id' }
      );

    if (error) {
      console.error('[chatTyping] upsertTypingIndicator error', error);
    } else {
      console.log('[chatTyping] upsertTypingIndicator ok', { userId, groupId, expires_at });
    }
  } catch (err) {
    console.error('[chatTyping] upsertTypingIndicator threw', err);
  }
}

/**
 * Clear typing indicator when the user stops typing or leaves the group.
 */
export async function clearTypingIndicator({ userId, groupId }) {
  try {
    if (!userId || !groupId) return;

    const { error } = await supabaseAdmin
      .from(TABLE)
      .delete()
      .match({ user_id: userId, group_id: groupId });

    if (error) {
      console.error('[chatTyping] clearTypingIndicator error', error);
    } else {
      console.log('[chatTyping] clearTypingIndicator ok', { userId, groupId });
    }
  } catch (err) {
    console.error('[chatTyping] clearTypingIndicator threw', err);
  }
}

/**
 * Get all active typing indicators for a group (non-expired).
 */
export async function getTypingIndicatorsForGroup(groupId) {
  try {
    if (!groupId) return [];

    const nowIso = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .select('user_id, group_id, expires_at, updated_at')
      .eq('group_id', groupId)
      .gt('expires_at', nowIso);

    if (error) {
      console.error('[chatTyping] getTypingIndicatorsForGroup error', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('[chatTyping] getTypingIndicatorsForGroup threw', err);
    return [];
  }
}

/**
 * Housekeeping: delete expired rows.
 * NOTE: uses chat_typing_indicators (correct table), not chat_typing.
 */
export async function cleanupStaleTyping() {
  try {
    const nowIso = new Date().toISOString();

    const { error } = await supabaseAdmin
      .from(TABLE)
      .delete()
      .lte('expires_at', nowIso);

    if (error) {
      console.error('[chatTyping] cleanupStaleTyping error', error);
    } else {
      console.log('[chatTyping] cleanupStaleTyping ok');
    }
  } catch (err) {
    console.error('[chatTyping] cleanupStaleTyping threw', err);
  }
}

/**
 * Backward compatibility: old function names used by backend/index.js
 * Maps to new function signatures
 */
export async function updateTyping(scope, channelId, userId, isTyping) {
  if (!scope || !channelId || !userId) {
    throw new Error('scope, channelId, and userId are required');
  }

  if (!['group', 'dm'].includes(scope)) {
    throw new Error('scope must be "group" or "dm"');
  }

  // For now, only handle group scope (DM typing can be added later if needed)
  if (scope === 'group') {
    if (isTyping) {
      await upsertTypingIndicator({
        userId,
        groupId: channelId,
        expiresAt: nowPlusSeconds(TYPING_TTL_SECONDS),
      });
    } else {
      await clearTypingIndicator({
        userId,
        groupId: channelId,
      });
    }
  }

  return { success: true };
}

export async function getTypingUsers(scope, channelId) {
  if (!scope || !channelId) {
    return [];
  }

  // For now, only handle group scope
  if (scope === 'group') {
    const indicators = await getTypingIndicatorsForGroup(channelId);
    
    // Transform to user objects (would need to join with profiles table for full user info)
    return indicators.map((indicator) => ({
      id: indicator.user_id,
      lastTypedAt: indicator.expires_at,
    }));
  }

  return [];
}

// Alias for backward compatibility
export const listTypingIndicators = getTypingIndicatorsForGroup;
