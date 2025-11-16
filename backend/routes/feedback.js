import express from 'express';
import { supabase } from '../supabaseClient.js';
import { supabaseAdmin } from '../supabaseAdmin.js';
import { requireAdmin, requireAuthenticated } from '../utils/accessControl.js';
import { logModerationAction } from '../utils/moderationAudit.js';

const router = express.Router();
const readClient = supabase;
const writeClient = supabaseAdmin ?? supabase;

const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000001';

async function getOrCreateFeedbackConversation() {
  // Use admin client to bypass RLS
  const adminClient = writeClient;

  // Try to find existing feedback conversation by title
  let { data: conversations, error } = await adminClient
    .from('conversations')
    .select('*')
    .eq('title', 'StrainSpotter Feedback')
    .eq('conversation_type', 'group');

  if (error) {
    console.error('[FEEDBACK] Error querying conversations:', error);
    throw new Error(error.message);
  }

  // If conversation exists, return it
  if (conversations && conversations.length > 0) {
    return conversations[0];
  }

  // Conversation doesn't exist, create it
  const { data: created, error: createErr } = await adminClient
    .from('conversations')
    .insert({
      conversation_type: 'group',
      title: 'StrainSpotter Feedback',
      created_by: null, // No specific creator for system conversation
      is_active: true
    })
    .select()
    .single();

  if (createErr) {
    console.error('[FEEDBACK] Error creating conversation:', createErr);
    // If conversation already exists (race condition), try to fetch it again
    if (createErr.code === '23505' || createErr.message.includes('duplicate key')) {
      const { data: existing, error: fetchErr } = await adminClient
        .from('conversations')
        .select('*')
        .eq('title', 'StrainSpotter Feedback')
        .single();
      if (!fetchErr && existing) {
        return existing;
      }
    }
    throw new Error("Failed to get or create feedback conversation: " + createErr.message);
  }

  return created;
}

router.get('/messages', requireAdmin, async (req, res) => {
  try {
    const conversation = await getOrCreateFeedbackConversation();

    // Get all messages from the feedback conversation
    const { data: messages, error } = await writeClient
      .from('messages')
      .select('*')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[FEEDBACK] Error fetching messages:', error);
      return res.status(500).json({ error: error.message });
    }

    // Fetch user profiles and auth data separately for each message
    const messagesWithUsers = await Promise.all(
      (messages || []).map(async (msg) => {
        if (!msg.sender_id) return msg;

        // Get profile data
        const { data: profile } = await writeClient
          .from('profiles')
          .select('id, display_name, avatar_url')
          .eq('id', msg.sender_id)
          .single();

        // Get email from auth.users
        let email = null;
        try {
          const { data: authUser } = await writeClient.auth.admin.getUserById(msg.sender_id);
          email = authUser?.user?.email || null;
        } catch (e) {
          console.error('[FEEDBACK] Error fetching auth user:', e);
        }

        // Extract username from email (part before @)
        const username = email ? email.split('@')[0] : null;

        return {
          ...msg,
          sender: profile ? {
            ...profile,
            email,
            username
          } : {
            id: msg.sender_id,
            email,
            username
          }
        };
      })
    );

    res.json(messagesWithUsers);
  } catch (e) {
    console.error('[FEEDBACK] Error in GET /messages:', e);
    res.status(500).json({ error: String(e) });
  }
});

import { rejectIfProfane, checkAndCleanMessage } from '../middleware/moderation.js';
import { sendMail, isEmailConfigured } from '../services/mailer.js';

router.post('/messages', requireAuthenticated, rejectIfProfane, async (req, res) => {
  try {
    let { content } = req.body || {};
    if (!content || !String(content).trim()) {
      return res.status(400).json({ error: 'content is required' });
    }
    const userId = req.authContext?.user?.id;

    const conversation = await getOrCreateFeedbackConversation();
    const { cleaned } = checkAndCleanMessage(content);

    // Insert the feedback message
    const { data, error } = await writeClient
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        sender_id: userId,
        content: cleaned,
        message_type: 'text'
      })
      .select()
      .single();

    if (error) {
      console.error('[FEEDBACK] Error inserting message:', error);
      return res.status(500).json({ error: error.message });
    }

    // Log feedback to console for monitoring
    console.log(`[FEEDBACK] User ${userId} submitted: ${cleaned.substring(0, 100)}...`);

    // Email notification (optional if SMTP configured)
    try {
      const to = process.env.EMAIL_TO;
      if (to && isEmailConfigured()) {
        const subject = 'New StrainSpotter Feedback';
        const text = `New feedback from user ${userId} at ${new Date().toISOString()}\n\n${cleaned}`;
        await sendMail({ to, subject, text });
      } else if (!to) {
        console.warn('[FEEDBACK] EMAIL_TO not set. Skipping email notification.');
      }
    } catch (mailErr) {
      console.warn('[FEEDBACK] Email send failed:', mailErr?.message || mailErr);
    }

    res.json(data);
  } catch (e) {
    console.error('[FEEDBACK] Unexpected error:', e);
    res.status(500).json({ error: String(e) });
  }
});

// DELETE endpoint - Admin only
router.delete('/messages/:messageId', requireAdmin, async (req, res) => {
  try {
    const { messageId } = req.params;

    // Delete the message
    const { error } = await writeClient
      .from('messages')
      .delete()
      .eq('id', messageId);

    if (error) {
      console.error('[FEEDBACK] Error deleting message:', error);
      return res.status(500).json({ error: error.message });
    }

    const actorId = req.authContext?.user?.id;
    await logModerationAction({
      actorUserId: actorId,
      targetUserId: null,
      action: 'delete_feedback_message',
      metadata: { messageId }
    });

    console.log(`[FEEDBACK] Admin ${actorId} deleted message ${messageId}`);
    res.json({ success: true });
  } catch (e) {
    console.error('[FEEDBACK] Delete error:', e);
    res.status(500).json({ error: String(e) });
  }
});

export default router;
