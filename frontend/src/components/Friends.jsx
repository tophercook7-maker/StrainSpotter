import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Stack,
  TextField,
  Alert,
  Tabs,
  Tab,
  CircularProgress
} from '@mui/material';
import { API_BASE } from '../config';

export default function Friends({ userId = 'demo-user' }) {
  const [tab, setTab] = useState(0);
  const [friends, setFriends] = useState([]);
  const [sent, setSent] = useState([]);
  const [received, setReceived] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [friendUsername, setFriendUsername] = useState('');

  useEffect(() => {
    fetchFriends();
  }, []);

  const fetchFriends = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/friends?user_id=${userId}`);
      if (!res.ok) throw new Error('Failed to load friends');
      const data = await res.json();
      setFriends(data.friends || []);
      setSent(data.sent || []);
      setReceived(data.received || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const sendRequest = async () => {
    if (!friendUsername.trim()) return;
    try {
      // For demo, assume we have a user lookup endpoint or direct friend_id
      // Here we'll just use a placeholder friend_id
      const res = await fetch(`${API_BASE}/api/friends/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, friend_id: 'friend-user-id' }) // Replace with actual lookup
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to send request');
      }
      setFriendUsername('');
      fetchFriends();
    } catch (e) {
      setError(e.message);
    }
  };

  const acceptRequest = async (friendshipId) => {
    try {
      const res = await fetch(`${API_BASE}/api/friends/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendship_id: friendshipId })
      });
      if (!res.ok) throw new Error('Failed to accept');
      fetchFriends();
    } catch (e) {
      setError(e.message);
    }
  };

  const rejectRequest = async (friendshipId) => {
    try {
      const res = await fetch(`${API_BASE}/api/friends/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendship_id: friendshipId })
      });
      if (!res.ok) throw new Error('Failed to reject');
      fetchFriends();
    } catch (e) {
      setError(e.message);
    }
  };

  const removeFriend = async (friendshipId) => {
    try {
      const res = await fetch(`${API_BASE}/api/friends/${friendshipId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to remove');
      fetchFriends();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>Friends</Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Add Friend</Typography>
            <Stack direction="row" spacing={2}>
              <TextField
                placeholder="Enter username"
                value={friendUsername}
                onChange={(e) => setFriendUsername(e.target.value)}
                fullWidth
              />
              <Button variant="contained" onClick={sendRequest}>Send Request</Button>
            </Stack>
          </CardContent>
        </Card>

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
          <Tab label={`Friends (${friends.length})`} />
          <Tab label={`Requests (${received.length})`} />
          <Tab label={`Sent (${sent.length})`} />
        </Tabs>

        {loading ? (
          <CircularProgress />
        ) : (
          <>
            {tab === 0 && (
              <List>
                {friends.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">No friends yet</Typography>
                ) : (
                  friends.map((f) => {
                    const friend = f.user_id === userId ? f.friend : f.users;
                    return (
                      <ListItem key={f.id}>
                        <ListItemAvatar>
                          <Avatar src={friend?.avatar_url}>{friend?.username?.[0] || '?'}</Avatar>
                        </ListItemAvatar>
                        <ListItemText primary={friend?.username || 'Unknown'} secondary={`Friends since ${new Date(f.accepted_at).toLocaleDateString()}`} />
                        <Button size="small" color="error" onClick={() => removeFriend(f.id)}>Remove</Button>
                      </ListItem>
                    );
                  })
                )}
              </List>
            )}

            {tab === 1 && (
              <List>
                {received.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">No pending requests</Typography>
                ) : (
                  received.map((r) => (
                    <ListItem key={r.id}>
                      <ListItemAvatar>
                        <Avatar src={r.users?.avatar_url}>{r.users?.username?.[0] || '?'}</Avatar>
                      </ListItemAvatar>
                      <ListItemText primary={r.users?.username || 'Unknown'} secondary={`Requested ${new Date(r.requested_at).toLocaleDateString()}`} />
                      <Stack direction="row" spacing={1}>
                        <Button size="small" variant="contained" onClick={() => acceptRequest(r.id)}>Accept</Button>
                        <Button size="small" variant="outlined" onClick={() => rejectRequest(r.id)}>Reject</Button>
                      </Stack>
                    </ListItem>
                  ))
                )}
              </List>
            )}

            {tab === 2 && (
              <List>
                {sent.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">No sent requests</Typography>
                ) : (
                  sent.map((s) => (
                    <ListItem key={s.id}>
                      <ListItemAvatar>
                        <Avatar src={s.friend?.avatar_url}>{s.friend?.username?.[0] || '?'}</Avatar>
                      </ListItemAvatar>
                      <ListItemText primary={s.friend?.username || 'Unknown'} secondary={`Sent ${new Date(s.requested_at).toLocaleDateString()}`} />
                      <Chip label="Pending" size="small" />
                    </ListItem>
                  ))
                )}
              </List>
            )}
          </>
        )}
      </Container>
    </Box>
  );
}
