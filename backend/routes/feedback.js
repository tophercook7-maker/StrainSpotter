import express from 'express';
import { supabase } from '../supabaseClient.js';
import { supabaseAdmin } from '../supabaseAdmin.js';

const router = express.Router();
const readClient = supabase;
const writeClient = supabaseAdmin ?? supabase;

async function getOrCreateFeedbackGroup() {
  // Try fetch existing 'Feedback' group
  let { data: grp, error } = await readClient
    .from('groups')
    .select('*')
    .eq('name', 'Feedback')
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!grp) {
    const ins = await writeClient.from('groups').insert({ name: 'Feedback' }).select().single();
    if (ins.error) throw new Error(ins.error.message);
    grp = ins.data;
  }
  return grp;
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

router.post('/messages', rejectIfProfane, async (req, res) => {
  try {
    const { user_id = null, content } = req.body || {};
    if (!content || !String(content).trim()) return res.status(400).json({ error: 'content is required' });
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
    
    // TODO: Send email notification to strainspotterfeedback@gmail.com
    // Options: Use nodemailer with Gmail SMTP, SendGrid, or Supabase Edge Function with Resend
    // For now, admins can monitor feedback via the database or console logs
    
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

export default router;
