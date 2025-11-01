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

const router = express.Router();
const readClient = supabase;
const writeClient = supabaseAdmin ?? supabase;

// ============================================
// HELPER: Check if user is moderator
// ============================================
async function isModerator(userId) {
  const { data, error } = await readClient
    .from('moderators')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single();
  
  return !error && data;
}

// ============================================
// USER MODERATION ACTIONS
// ============================================

/**
 * POST /api/moderator-actions/warn/:targetUserId
 * Issue a warning to a user (moderators only)
 */
router.post('/warn/:targetUserId', express.json(), async (req, res, next) => {
  try {
    const { targetUserId } = req.params;
    const { userId, reason } = req.body;

    if (!userId || !reason) {
      return res.status(400).json({ error: 'userId and reason are required' });
    }

    // Check if user is moderator
    const moderator = await isModerator(userId);
    if (!moderator) {
      return res.status(403).json({ error: 'Not authorized. Moderators only.' });
    }

    const { data, error } = await writeClient
      .from('user_moderation_actions')
      .insert({
        user_id: targetUserId,
        action_type: 'warning',
        reason,
        moderator_id: userId,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('Error issuing warning:', error);
      return res.status(500).json({ error: error.message });
    }

    // TODO: Send notification to user

    res.json({ success: true, action: data });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/moderator-actions/suspend/:targetUserId
 * Suspend a user temporarily (moderators only)
 */
router.post('/suspend/:targetUserId', express.json(), async (req, res, next) => {
  try {
    const { targetUserId } = req.params;
    const { userId, reason, days = 7 } = req.body;

    if (!userId || !reason) {
      return res.status(400).json({ error: 'userId and reason are required' });
    }

    // Check if user is moderator
    const moderator = await isModerator(userId);
    if (!moderator) {
      return res.status(403).json({ error: 'Not authorized. Moderators only.' });
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + parseInt(days));

    const { data, error } = await writeClient
      .from('user_moderation_actions')
      .insert({
        user_id: targetUserId,
        action_type: 'suspension',
        reason,
        moderator_id: userId,
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

    res.json({ success: true, action: data });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/moderator-actions/ban/:targetUserId
 * Permanently ban a user (moderators only)
 */
router.post('/ban/:targetUserId', express.json(), async (req, res, next) => {
  try {
    const { targetUserId } = req.params;
    const { userId, reason } = req.body;

    if (!userId || !reason) {
      return res.status(400).json({ error: 'userId and reason are required' });
    }

    // Check if user is moderator
    const moderator = await isModerator(userId);
    if (!moderator) {
      return res.status(403).json({ error: 'Not authorized. Moderators only.' });
    }

    const { data, error } = await writeClient
      .from('user_moderation_actions')
      .insert({
        user_id: targetUserId,
        action_type: 'ban',
        reason,
        moderator_id: userId,
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

    res.json({ success: true, action: data });
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/moderator-actions/history/:targetUserId
 * Get moderation history for a user
 */
router.get('/history/:targetUserId', async (req, res, next) => {
  try {
    const { targetUserId } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Check if user is moderator or viewing their own history
    const moderator = await isModerator(userId);
    if (!moderator && userId !== targetUserId) {
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
router.post('/appeal/:actionId', express.json(), async (req, res, next) => {
  try {
    const { actionId } = req.params;
    const { userId, appealText } = req.body;

    if (!userId || !appealText) {
      return res.status(400).json({ error: 'userId and appealText are required' });
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

    res.json({ success: true, action: data });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/moderator-actions/appeal/:actionId/resolve
 * Resolve an appeal (moderators only)
 */
router.post('/appeal/:actionId/resolve', express.json(), async (req, res, next) => {
  try {
    const { actionId } = req.params;
    const { userId, approved } = req.body;

    if (!userId || approved === undefined) {
      return res.status(400).json({ error: 'userId and approved are required' });
    }

    // Check if user is moderator
    const moderator = await isModerator(userId);
    if (!moderator) {
      return res.status(403).json({ error: 'Not authorized. Moderators only.' });
    }

    const updateData = {
      appeal_status: approved ? 'approved' : 'denied',
      appeal_resolved_by: userId,
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
router.post('/moderators/add', express.json(), async (req, res, next) => {
  try {
    const { userId, targetUserId, permissions } = req.body;

    if (!userId || !targetUserId) {
      return res.status(400).json({ error: 'userId and targetUserId are required' });
    }

    // TODO: Add admin check (for now, any moderator can add moderators)
    const moderator = await isModerator(userId);
    if (!moderator) {
      return res.status(403).json({ error: 'Not authorized. Moderators only.' });
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
        assigned_by: userId,
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

    res.json({ success: true, moderator: data });
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/moderator-actions/moderators
 * List all active moderators
 */
router.get('/moderators', async (req, res, next) => {
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

