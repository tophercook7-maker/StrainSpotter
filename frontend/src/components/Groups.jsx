import { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  Chip,
  Container
} from '@mui/material';
import { API_BASE } from '../config';

export default function Groups({ userId = 'demo-user' }) {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [newGroupName, setNewGroupName] = useState('');
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const createGroup = async () => {
    const name = newGroupName.trim();
    if (!name) return;
    setCreatingGroup(true);
    try {
      const res = await fetch(`${API_BASE}/api/groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      if (res.ok) {
        setNewGroupName('');
        const updated = await fetch(`${API_BASE}/api/groups`);
        if (updated.ok) setGroups(await updated.json());
      }
    } finally {
      setCreatingGroup(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/groups`);
        if (res.ok) setGroups(await res.json());
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const loadMessages = async (groupId) => {
    const res = await fetch(`${API_BASE}/api/groups/${groupId}/messages`);
    if (res.ok) setMessages(await res.json());
  };

  const loadMembers = async (groupId) => {
    const res = await fetch(`${API_BASE}/api/groups/${groupId}/members`);
    if (res.ok) {
      const data = await res.json();
      setMembers(data);
      setIsMember(data.some(m => m.user_id === userId));
    }
  };

  const selectGroup = (g) => {
    setSelectedGroup(g);
    loadMessages(g.id);
    loadMembers(g.id);
  };

  const joinGroup = async () => {
    if (!selectedGroup) return;
    const res = await fetch(`${API_BASE}/api/groups/${selectedGroup.id}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId })
    });
    if (res.ok) {
      await loadMembers(selectedGroup.id);
    }
  };

  const leaveGroup = async () => {
    if (!selectedGroup) return;
    const res = await fetch(`${API_BASE}/api/groups/${selectedGroup.id}/leave`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId })
    });
    if (res.ok) {
      await loadMembers(selectedGroup.id);
    }
  };

  const sendMessage = async () => {
    const content = input.trim();
    if (!content || !selectedGroup) return;
    const res = await fetch(`${API_BASE}/api/groups/${selectedGroup.id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, user_id: userId })
    });
    if (res.ok) {
      setInput('');
      await loadMessages(selectedGroup.id);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>
        Groups & Chat
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
        {/* Groups list */}
        <Card sx={{ flex: { xs: '1 1 auto', md: '0 0 300px' } }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Groups
            </Typography>
            <Stack spacing={2}>
              <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                <TextField
                  size="small"
                  label="New Group Name"
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && createGroup()}
                  disabled={creatingGroup}
                />
                <Button
                  variant="contained"
                  onClick={createGroup}
                  disabled={creatingGroup || !newGroupName.trim()}
                >
                  Create
                </Button>
              </Stack>
              {loading ? (
                <Typography variant="body2" color="text.secondary">
                  Loading...
                </Typography>
              ) : groups.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No groups yet.
                </Typography>
              ) : (
                <Stack spacing={1}>
                  {groups.map((g) => (
                    <Button
                      key={g.id}
                      variant={selectedGroup?.id === g.id ? 'contained' : 'outlined'}
                      onClick={() => selectGroup(g)}
                      fullWidth
                      sx={{ justifyContent: 'flex-start' }}
                    >
                      {g.name}
                    </Button>
                  ))}
                </Stack>
              )}
            </Stack>
          </CardContent>
        </Card>

        {/* Chat area */}
        <Card sx={{ flex: 1 }}>
          <CardContent>
            {!selectedGroup ? (
              <Typography variant="body2" color="text.secondary">
                Select a group to view messages.
              </Typography>
            ) : (
              <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6">{selectedGroup.name}</Typography>
                  {isMember ? (
                    <Button size="small" variant="outlined" color="error" onClick={leaveGroup}>Leave</Button>
                  ) : (
                    <Button size="small" variant="contained" onClick={joinGroup}>Join</Button>
                  )}
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  {members.length} member{members.length !== 1 ? 's' : ''}
                  {members.length > 0 && ': '}
                  {members.slice(0, 5).map(m => m.users?.username || 'Unknown').join(', ')}
                  {members.length > 5 && '...'}
                </Typography>
                <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                  {messages.length === 0 ? (
                    <ListItem>
                      <ListItemText secondary="No messages yet. Start the conversation!" />
                    </ListItem>
                  ) : (
                    messages.map((m) => (
                      <ListItem key={m.id}>
                        <ListItemText
                          primary={m.content}
                          secondary={new Date(m.created_at).toLocaleString()}
                        />
                      </ListItem>
                    ))
                  )}
                </List>
                {isMember ? (
                  <Stack direction="row" spacing={1}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Type a message..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    />
                    <Button variant="contained" onClick={sendMessage}>
                      Send
                    </Button>
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Join this group to send messages.
                  </Typography>
                )}
              </Stack>
            )}
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}
