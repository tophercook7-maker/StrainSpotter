/**
 * Moderator Actions API Routes
 * 
 * Endpoints for:
 * - Warning users
 * - Suspending users
 * - Banning users
 * - Viewing moderation history
 * - Managing moderators
 * - Handling appeals
 */

import express from 'express';
import { supabase } from '../supabaseClient.js';
import { supabaseAdmin } from '../supabaseAdmin.js';
import {
  requireAdmin,
  requireModerator,
  requireAuthenticated,
  isModeratorContext
} from '../utils/accessControl.js';
import { logModerationAction } from '../utils/moderationAudit.js';

const router = express.Router();
const readClient = supabase;
const writeClient = supabaseAdmin ?? supabase;

// ============================================
// USER MODERATION ACTIONS
// ============================================

/**
 * POST /api/moderator-actions/warn/:targetUserId
 * Issue a warning to a user (moderators only)
 */
router.post('/warn/:targetUserId', requireModerator, express.json(), async (req, res, next) => {
  try {
    const { targetUserId } = req.params;
    const { reason } = req.body;
    const moderatorId = req.authContext?.user?.id;

    if (!reason) {
      return res.status(400).json({ error: 'reason is required' });
    }

    const { data, error } = await writeClient
      .from('user_moderation_actions')
      .insert({
        user_id: targetUserId,
        action_type: 'warning',
        reason,
        moderator_id: moderatorId,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('Error issuing warning:', error);
      return res.status(500).json({ error: error.message });
    }

    // TODO: Send notification to user
    await logModerationAction({
      actorUserId: moderatorId,
      targetUserId,
      action: 'warn_user',
      metadata: { reason }
    });
    res.json({ success: true, action: data });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/moderator-actions/suspend/:targetUserId
 * Suspend a user temporarily (moderators only)
 */
router.post('/suspend/:targetUserId', requireModerator, express.json(), async (req, res, next) => {
  try {
    const { targetUserId } = req.params;
    const { reason, days = 7 } = req.body;
    const moderatorId = req.authContext?.user?.id;

    if (!reason) {
      return res.status(400).json({ error: 'reason is required' });
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + parseInt(days));

    const { data, error } = await writeClient
      .from('user_moderation_actions')
      .insert({
        user_id: targetUserId,
        action_type: 'suspension',
        reason,
        moderator_id: moderatorId,
        expires_at: expiresAt.toISOString(),
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('Error suspending user:', error);
      return res.status(500).json({ error: error.message });
    }

    // Remove user from directory during suspension
    await writeClient
      .from('profiles')
      .update({ grower_listed_in_directory: false })
      .eq('user_id', targetUserId);

    // TODO: Send notification to user
    await logModerationAction({
      actorUserId: moderatorId,
      targetUserId,
      action: 'suspend_user',
      metadata: { reason, days: parseInt(days, 10) }
    });
    res.json({ success: true, action: data });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/moderator-actions/ban/:targetUserId
 * Permanently ban a user (moderators only)
 */
router.post('/ban/:targetUserId', requireModerator, express.json(), async (req, res, next) => {
  try {
    const { targetUserId } = req.params;
    const { reason } = req.body;
    const moderatorId = req.authContext?.user?.id;

    if (!reason) {
      return res.status(400).json({ error: 'reason is required' });
    }

    const { data, error } = await writeClient
      .from('user_moderation_actions')
      .insert({
        user_id: targetUserId,
        action_type: 'ban',
        reason,
        moderator_id: moderatorId,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('Error banning user:', error);
      return res.status(500).json({ error: error.message });
    }

    // Remove user from directory permanently
    await writeClient
      .from('profiles')
      .update({ 
        grower_listed_in_directory: false,
        is_grower: false
      })
      .eq('user_id', targetUserId);

    // Delete all user's messages
    await writeClient
      .from('messages')
      .update({ is_deleted: true })
      .eq('sender_id', targetUserId);

    // TODO: Send notification to user
    await logModerationAction({
      actorUserId: moderatorId,
      targetUserId,
      action: 'ban_user',
      metadata: { reason }
    });
    res.json({ success: true, action: data });
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/moderator-actions/history/:targetUserId
 * Get moderation history for a user
 */
router.get('/history/:targetUserId', requireAuthenticated, async (req, res, next) => {
  try {
    const { targetUserId } = req.params;
    const requesterId = req.authContext?.user?.id;
    const isSelf = requesterId === targetUserId;
    const moderator = await isModeratorContext(req.authContext);

    if (!isSelf && !moderator) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { data, error } = await readClient
      .from('user_moderation_actions')
      .select('*, moderator:profiles!moderator_id(*)')
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching moderation history:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ history: data || [] });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/moderator-actions/appeal/:actionId
 * Submit an appeal for a moderation action
 */
router.post('/appeal/:actionId', requireAuthenticated, express.json(), async (req, res, next) => {
  try {
    const { actionId } = req.params;
    const { appealText } = req.body;
    const userId = req.authContext?.user?.id;

    if (!appealText) {
      return res.status(400).json({ error: 'appealText is required' });
    }

    // Verify this is the user's own action
    const { data: action, error: actionError } = await readClient
      .from('user_moderation_actions')
      .select('*')
      .eq('id', actionId)
      .eq('user_id', userId)
      .single();

    if (actionError || !action) {
      return res.status(404).json({ error: 'Moderation action not found' });
    }

    if (action.appeal_status && action.appeal_status !== 'none') {
      return res.status(400).json({ error: 'Appeal already submitted' });
    }

    const { data, error } = await writeClient
      .from('user_moderation_actions')
      .update({
        appeal_status: 'pending',
        appeal_text: appealText,
        appeal_date: new Date().toISOString()
      })
      .eq('id', actionId)
      .select()
      .single();

    if (error) {
      console.error('Error submitting appeal:', error);
      return res.status(500).json({ error: error.message });
    }

    await logModerationAction({
      actorUserId: userId,
      targetUserId,
      action: 'submit_appeal',
      metadata: { actionId }
    });

    res.json({ success: true, action: data });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/moderator-actions/appeal/:actionId/resolve
 * Resolve an appeal (moderators only)
 */
router.post('/appeal/:actionId/resolve', requireModerator, express.json(), async (req, res, next) => {
  try {
    const { actionId } = req.params;
    const { approved } = req.body;
    const moderatorId = req.authContext?.user?.id;

    if (approved === undefined) {
      return res.status(400).json({ error: 'approved flag is required' });
    }

    const updateData = {
      appeal_status: approved ? 'approved' : 'denied',
      appeal_resolved_by: moderatorId,
      appeal_resolved_at: new Date().toISOString()
    };

    // If approved, deactivate the action
    if (approved) {
      updateData.is_active = false;
    }

    const { data, error } = await writeClient
      .from('user_moderation_actions')
      .update(updateData)
      .eq('id', actionId)
      .select()
      .single();

    if (error) {
      console.error('Error resolving appeal:', error);
      return res.status(500).json({ error: error.message });
    }

    // TODO: Send notification to user

    await logModerationAction({
      actorUserId: moderatorId,
      targetUserId: action?.user_id || null,
      action: 'resolve_appeal',
      metadata: { actionId, approved: Boolean(approved) }
    });

    res.json({ success: true, action: data });
  } catch (e) {
    next(e);
  }
});

// ============================================
// MODERATOR MANAGEMENT
// ============================================

/**
 * POST /api/moderator-actions/moderators/add
 * Add a new moderator (admin only)
 */
router.post('/moderators/add', requireAdmin, express.json(), async (req, res, next) => {
  try {
    const { targetUserId, permissions } = req.body;
    const adminId = req.authContext?.user?.id;

    if (!targetUserId) {
      return res.status(400).json({ error: 'targetUserId is required' });
    }

    const defaultPermissions = permissions || [
      'moderate_messages',
      'moderate_images',
      'warn_users'
    ];

    const { data, error } = await writeClient
      .from('moderators')
      .insert({
        user_id: targetUserId,
        assigned_by: adminId,
        permissions: defaultPermissions,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return res.status(400).json({ error: 'User is already a moderator' });
      }
      console.error('Error adding moderator:', error);
      return res.status(500).json({ error: error.message });
    }

    await logModerationAction({
      actorUserId: adminId,
      targetUserId,
      action: 'add_moderator',
      metadata: { permissions: defaultPermissions }
    });

    res.json({ success: true, moderator: data });
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/moderator-actions/moderators
 * List all active moderators
 */
router.get('/moderators', requireAdmin, async (req, res, next) => {
  try {
    const { data, error } = await readClient
      .from('moderators')
      .select('*, user:profiles!user_id(*), assigned_by_user:profiles!assigned_by(*)')
      .eq('is_active', true)
      .order('assigned_at', { ascending: false });

    if (error) {
      console.error('Error fetching moderators:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ moderators: data || [] });
  } catch (e) {
    next(e);
  }
});

export default router;

