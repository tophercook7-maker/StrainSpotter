import { supabaseAdmin } from '../supabaseAdminClient.js';

const TABLE = 'chat_typing_indicators';

export async function upsertTypingIndicator({ userId, groupId, expiresAt }) {
  if (!userId || !groupId) return;

  await supabaseAdmin.from(TABLE).upsert(
    {
      user_id: userId,
      group_id: groupId,
      expires_at: expiresAt ?? new Date(Date.now() + 15_000).toISOString(),
    },
    {
      onConflict: 'user_id,group_id',
    }
  );
}

export async function listTypingIndicators(groupId) {
  if (!groupId) return [];

  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .select('*')
    .eq('group_id', groupId)
    .gt('expires_at', new Date().toISOString());

  if (error) {
    console.error('[chatTyping] listTypingIndicators error', error);
    return [];
  }

  return data || [];
}

export async function cleanupStaleTyping() {
  try {
    const { error } = await supabaseAdmin
      .from(TABLE)
      .delete()
      .lt('expires_at', new Date().toISOString());

    if (error) {
      console.error('[chatTyping] cleanupStaleTyping error', error);
    }
  } catch (e) {
    console.error('[chatTyping] cleanupStaleTyping exception', e);
  }
}

// Backward compatibility: export old function names that backend/index.js uses
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
        expiresAt: new Date(Date.now() + 15_000).toISOString(),
      });
    } else {
      // Delete typing indicator
      const { error } = await supabaseAdmin
        .from(TABLE)
        .delete()
        .eq('user_id', userId)
        .eq('group_id', channelId);

      if (error) {
        console.error('[chatTyping] updateTyping delete error', error);
      }
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
    const indicators = await listTypingIndicators(channelId);
    
    // Transform to user objects (would need to join with profiles table for full user info)
    return indicators.map((indicator) => ({
      id: indicator.user_id,
      lastTypedAt: indicator.expires_at,
    }));
  }

  return [];
}
