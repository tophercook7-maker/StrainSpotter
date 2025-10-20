import express from 'express';
import { supabaseAdmin, supabase } from '../supabaseClient.js';

const router = express.Router();
const db = supabaseAdmin ?? supabase;

// GET /api/friends - List user's friends (accepted) and pending requests
router.get('/', async (req, res) => {
  try {
    const { user_id } = req.query;
    if (!user_id) return res.status(400).json({ error: 'user_id required' });

    // Accepted friends (bidirectional)
    const { data: friends, error: friendsErr } = await db
      .from('friendships')
      .select(`
        id,
        user_id,
        friend_id,
        status,
        accepted_at,
        users!friendships_user_id_fkey(id, username, avatar_url),
        friend:users!friendships_friend_id_fkey(id, username, avatar_url)
      `)
      .or(`user_id.eq.${user_id},friend_id.eq.${user_id}`)
      .eq('status', 'accepted');

    if (friendsErr) return res.status(500).json({ error: friendsErr.message });

    // Pending requests sent by user
    const { data: sent, error: sentErr } = await db
      .from('friendships')
      .select(`
        id,
        user_id,
        friend_id,
        status,
        requested_at,
        friend:users!friendships_friend_id_fkey(id, username, avatar_url)
      `)
      .eq('user_id', user_id)
      .eq('status', 'pending');

    if (sentErr) return res.status(500).json({ error: sentErr.message });

    // Pending requests received by user
    const { data: received, error: receivedErr } = await db
      .from('friendships')
      .select(`
        id,
        user_id,
        friend_id,
        status,
        requested_at,
        users!friendships_user_id_fkey(id, username, avatar_url)
      `)
      .eq('friend_id', user_id)
      .eq('status', 'pending');

    if (receivedErr) return res.status(500).json({ error: receivedErr.message });

    res.json({
      friends: friends || [],
      sent: sent || [],
      received: received || []
    });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// POST /api/friends/request - Send friend request
router.post('/request', async (req, res) => {
  try {
    const { user_id, friend_id } = req.body;
    if (!user_id || !friend_id) {
      return res.status(400).json({ error: 'user_id and friend_id required' });
    }
    if (user_id === friend_id) {
      return res.status(400).json({ error: 'Cannot friend yourself' });
    }

    // Check if friendship already exists
    const { data: existing } = await db
      .from('friendships')
      .select('*')
      .or(`and(user_id.eq.${user_id},friend_id.eq.${friend_id}),and(user_id.eq.${friend_id},friend_id.eq.${user_id})`)
      .maybeSingle();

    if (existing) {
      if (existing.status === 'accepted') {
        return res.status(400).json({ error: 'Already friends' });
      }
      if (existing.status === 'pending') {
        return res.status(400).json({ error: 'Friend request already pending' });
      }
    }

    // Create new request
    const { data, error } = await db
      .from('friendships')
      .insert({ user_id, friend_id, status: 'pending' })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true, friendship: data });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// POST /api/friends/accept - Accept friend request
router.post('/accept', async (req, res) => {
  try {
    const { friendship_id } = req.body;
    if (!friendship_id) return res.status(400).json({ error: 'friendship_id required' });

    const { data, error } = await db
      .from('friendships')
      .update({ status: 'accepted', accepted_at: new Date().toISOString() })
      .eq('id', friendship_id)
      .eq('status', 'pending')
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    if (!data) return res.status(404).json({ error: 'Friend request not found' });

    res.json({ success: true, friendship: data });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// POST /api/friends/reject - Reject friend request
router.post('/reject', async (req, res) => {
  try {
    const { friendship_id } = req.body;
    if (!friendship_id) return res.status(400).json({ error: 'friendship_id required' });

    const { data, error } = await db
      .from('friendships')
      .update({ status: 'rejected' })
      .eq('id', friendship_id)
      .eq('status', 'pending')
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    if (!data) return res.status(404).json({ error: 'Friend request not found' });

    res.json({ success: true, friendship: data });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// DELETE /api/friends/:friendship_id - Remove friend
router.delete('/:friendship_id', async (req, res) => {
  try {
    const { friendship_id } = req.params;
    const { error } = await db
      .from('friendships')
      .delete()
      .eq('id', friendship_id);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

export default router;
