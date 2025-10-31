import express from 'express';
import { supabase } from '../supabaseClient.js';
import { supabaseAdmin } from '../supabaseAdmin.js';

const router = express.Router();
const readClient = supabase;
const writeClient = supabaseAdmin ?? supabase;

async function getOrCreateFeedbackGroup() {
  // Try to select the existing 'Feedback' group
  let { data: groups, error } = await readClient
    .from('groups')
    .select('*')
    .eq('name', 'Feedback');
  if (error) throw new Error(error.message);
  if (!groups || groups.length === 0) {
    // Auto-create the Feedback group using service role
    const { data: created, error: createErr } = await writeClient
      .from('groups')
      .insert({ name: 'Feedback' })
      .select()
      .single();
    if (createErr) throw new Error("Failed to auto-create 'Feedback' group: " + createErr.message);
    return created;
  }
  // If multiple, use the first
  return groups[0];
}

router.get('/messages', async (req, res) => {
  try {
    const grp = await getOrCreateFeedbackGroup();
    const { data, error } = await readClient
      .from('messages')
      .select('*')
      .eq('group_id', grp.id)
      .order('created_at', { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data || []);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

import { rejectIfProfane, checkAndCleanMessage } from '../middleware/moderation.js';
import { sendMail, isEmailConfigured } from '../services/mailer.js';

router.post('/messages', rejectIfProfane, async (req, res) => {
  try {
    let { user_id = null, content } = req.body || {};
    if (!content || !String(content).trim()) return res.status(400).json({ error: 'content is required' });
    // Validate user_id: must be null or a valid UUID
    if (user_id && !/^[0-9a-fA-F-]{36}$/.test(user_id)) user_id = null;
    const grp = await getOrCreateFeedbackGroup();
    const { cleaned } = checkAndCleanMessage(content);
    const { data, error } = await writeClient
      .from('messages')
      .insert({ group_id: grp.id, user_id, content: cleaned })
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    
    // Log feedback to console for monitoring (until email service is configured)
    console.log(`[FEEDBACK] User ${user_id || 'anonymous'} submitted: ${cleaned.substring(0, 100)}...`);
    
    // Email notification (optional if SMTP configured)
    try {
      const to = process.env.EMAIL_TO;
      if (to && isEmailConfigured()) {
        const subject = 'New StrainSpotter Feedback';
        const text = `New feedback${user_id ? ` from ${user_id}` : ''} at ${new Date().toISOString()}\n\n${cleaned}`;
        await sendMail({ to, subject, text });
      } else if (!to) {
        console.warn('[FEEDBACK] EMAIL_TO not set. Skipping email notification.');
      }
    } catch (mailErr) {
      console.warn('[FEEDBACK] Email send failed:', mailErr?.message || mailErr);
    }
    
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

export default router;
