import express from 'express';
import { supabase } from '../supabaseClient.js';

const router = express.Router();

async function getOrCreateFeedbackGroup() {
  // Try fetch existing 'Feedback' group
  let { data: grp, error } = await supabase
    .from('groups')
    .select('*')
    .eq('name', 'Feedback')
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!grp) {
    const ins = await supabase.from('groups').insert({ name: 'Feedback' }).select().single();
    if (ins.error) throw new Error(ins.error.message);
    grp = ins.data;
  }
  return grp;
}

router.get('/messages', async (req, res) => {
  try {
    const grp = await getOrCreateFeedbackGroup();
    const { data, error } = await supabase
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

router.post('/messages', async (req, res) => {
  try {
    const { user_id = null, content } = req.body || {};
    if (!content || !String(content).trim()) return res.status(400).json({ error: 'content is required' });
    const grp = await getOrCreateFeedbackGroup();
    const { data, error } = await supabase
      .from('messages')
      .insert({ group_id: grp.id, user_id, content })
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

export default router;
