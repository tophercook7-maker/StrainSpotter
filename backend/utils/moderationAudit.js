import { supabaseAdmin } from '../supabaseAdmin.js';

export async function logModerationAction({ actorUserId, targetUserId = null, action, metadata = {} }) {
  if (!supabaseAdmin || !actorUserId || !action) {
    return;
  }
  try {
    await supabaseAdmin
      .from('moderation_audit')
      .insert({
        actor_user_id: actorUserId,
        target_user_id: targetUserId,
        action,
        metadata
      });
  } catch (error) {
    console.warn('[moderationAudit] Failed to log action:', action, error?.message || error);
  }
}


