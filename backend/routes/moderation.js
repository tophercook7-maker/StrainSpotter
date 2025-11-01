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

// POST /api/moderation/report - Report a message
router.post('/report', express.json(), async (req, res, next) => {
  try {
    const { message_id, reported_by, reason, details } = req.body;
    
    if (!message_id) {
      return res.status(400).json({ error: 'message_id is required' });
    }
    
    // Check if message exists
    const { data: message, error: msgErr } = await readClient
      .from('messages')
      .select('id, content, user_id, group_id')
      .eq('id', message_id)
      .maybeSingle();
    
    if (msgErr || !message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    // Create report
    const { data, error } = await writeClient
      .from('moderation_reports')
      .insert({
        message_id,
        reported_by: reported_by || null,
        reason: reason || 'inappropriate',
        details: details || null,
        status: 'pending'
      })
      .select()
      .single();
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    res.json({ success: true, report: data });
  } catch (e) {
    next(e);
  }
});

// GET /api/moderation/reports - List all reports (admin)
router.get('/reports', async (req, res, next) => {
  try {
    const { status = 'pending' } = req.query;
    
    const { data, error } = await readClient
      .from('moderation_reports')
      .select(`
        *,
        messages (
          id,
          content,
          user_id,
          group_id,
          created_at
        )
      `)
      .eq('status', status)
      .order('created_at', { ascending: false })
      .limit(100);
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    res.json({ reports: data || [], count: data?.length || 0 });
  } catch (e) {
    next(e);
  }
});

// POST /api/moderation/reports/:id/resolve - Resolve a report (admin)
router.post('/reports/:id/resolve', express.json(), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action, moderator_notes } = req.body;
    
    if (!['approve', 'remove', 'warn'].includes(action)) {
      return res.status(400).json({ error: 'action must be approve, remove, or warn' });
    }
    
    // Get report
    const { data: report, error: reportErr } = await readClient
      .from('moderation_reports')
      .select('*, messages(*)')
      .eq('id', id)
      .single();
    
    if (reportErr || !report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    // Take action based on decision
    if (action === 'remove') {
      // Delete the message
      await writeClient
        .from('messages')
        .delete()
        .eq('id', report.message_id);
    }
    
    if (action === 'warn') {
      // Could log a warning for the user, send notification, etc.
      // For now, just mark the report
    }
    
    // Update report status
    const { data, error } = await writeClient
      .from('moderation_reports')
      .update({
        status: 'resolved',
        action_taken: action,
        moderator_notes: moderator_notes || null,
        resolved_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    res.json({ success: true, report: data });
  } catch (e) {
    next(e);
  }
});

// GET /api/moderation/stats - Moderation statistics (admin)
router.get('/stats', async (req, res, next) => {
  try {
    const { data: pending } = await readClient
      .from('moderation_reports')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending');
    
    const { data: resolved } = await readClient
      .from('moderation_reports')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'resolved');
    
    const { data: totalMessages } = await readClient
      .from('messages')
      .select('id', { count: 'exact', head: true });
    
    res.json({
      pendingReports: pending || 0,
      resolvedReports: resolved || 0,
      totalMessages: totalMessages || 0
    });
  } catch (e) {
    next(e);
  }
});

// ============================================
// GROWER DIRECTORY MODERATION
// ============================================

/**
 * GET /api/moderation/flagged-messages
 * Get all flagged messages (moderators only)
 */
router.get('/flagged-messages', async (req, res, next) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Check if user is moderator
    const moderator = await isModerator(userId);
    if (!moderator) {
      return res.status(403).json({ error: 'Not authorized. Moderators only.' });
    }

    const { data, error } = await readClient
      .from('messages')
      .select('*, sender:profiles!sender_id(*), conversation:conversations(*)')
      .eq('is_flagged', true)
      .eq('is_moderated', false)
      .order('flagged_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching flagged messages:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ flaggedMessages: data || [] });
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/moderation/pending-images
 * Get pending grower profile images (moderators only)
 */
router.get('/pending-images', async (req, res, next) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Check if user is moderator
    const moderator = await isModerator(userId);
    if (!moderator) {
      return res.status(403).json({ error: 'Not authorized. Moderators only.' });
    }

    const { data, error } = await readClient
      .from('profiles')
      .select('*')
      .eq('is_grower', true)
      .eq('grower_image_approved', false)
      .not('grower_profile_image_url', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching pending images:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ pendingImages: data || [] });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/moderation/approve-image/:targetUserId
 * Approve a grower profile image (moderators only)
 */
router.post('/approve-image/:targetUserId', express.json(), async (req, res, next) => {
  try {
    const { targetUserId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Check if user is moderator
    const moderator = await isModerator(userId);
    if (!moderator) {
      return res.status(403).json({ error: 'Not authorized. Moderators only.' });
    }

    const { data, error } = await writeClient
      .from('profiles')
      .update({
        grower_image_approved: true,
        grower_image_moderated_by: userId,
        grower_image_moderated_at: new Date().toISOString()
      })
      .eq('user_id', targetUserId)
      .select()
      .single();

    if (error) {
      console.error('Error approving image:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true, profile: data });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/moderation/reject-image/:targetUserId
 * Reject a grower profile image (moderators only)
 */
router.post('/reject-image/:targetUserId', express.json(), async (req, res, next) => {
  try {
    const { targetUserId } = req.params;
    const { userId, reason } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Check if user is moderator
    const moderator = await isModerator(userId);
    if (!moderator) {
      return res.status(403).json({ error: 'Not authorized. Moderators only.' });
    }

    const { data, error } = await writeClient
      .from('profiles')
      .update({
        grower_profile_image_url: null,
        grower_image_approved: false,
        grower_image_moderated_by: userId,
        grower_image_moderated_at: new Date().toISOString()
      })
      .eq('user_id', targetUserId)
      .select()
      .single();

    if (error) {
      console.error('Error rejecting image:', error);
      return res.status(500).json({ error: error.message });
    }

    // TODO: Send notification to user with rejection reason

    res.json({ success: true, profile: data, reason });
  } catch (e) {
    next(e);
  }
});

export default router;
