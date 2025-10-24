import express from 'express';
import { supabase } from '../supabaseClient.js';
import { supabaseAdmin } from '../supabaseAdmin.js';

const router = express.Router();
const readClient = supabase;
const writeClient = supabaseAdmin ?? supabase;

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

export default router;
