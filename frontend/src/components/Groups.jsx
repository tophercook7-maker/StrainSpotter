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

export default function Groups() {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);

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

  const selectGroup = (g) => {
    setSelectedGroup(g);
    loadMessages(g.id);
  };

  const sendMessage = async () => {
    const content = input.trim();
    if (!content || !selectedGroup) return;
    const res = await fetch(`${API_BASE}/api/groups/${selectedGroup.id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
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
                <Typography variant="h6">{selectedGroup.name}</Typography>
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
              </Stack>
            )}
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}
