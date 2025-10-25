import { useEffect, useMemo, useState } from 'react';
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
  Container,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Checkbox,
  Link as MuiLink
} from '@mui/material';
import FlagIcon from '@mui/icons-material/Flag';
import { API_BASE } from '../config';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';

export default function Groups({ userId: userIdProp, onNavigate, onBack }) {
  const { user: authUser } = useAuth(); // Get user from global context
  const [groups, setGroups] = useState([]);
  const [userId, setUserId] = useState(userIdProp || authUser?.id || null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const ALLOWED_GROUPS = [
    'Growers',
    'Budtenders',
    'Medical',
    'Recreational',
    'Local Chat',
    'General',
    'Dispensary Owners',
    'Seed Swap',
    'Events',
    'Help & Advice'
  ];
  const [newGroupName, setNewGroupName] = useState(ALLOWED_GROUPS[0]);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportingMessage, setReportingMessage] = useState(null);
  const [reportReason, setReportReason] = useState('inappropriate');
  const [reportDetails, setReportDetails] = useState('');
  const [guidelinesOpen, setGuidelinesOpen] = useState(false);
  const [guidelinesChecked, setGuidelinesChecked] = useState(false);
  const [guidelinesAccepted, setGuidelinesAccepted] = useState(false);
  const guidelinesKey = useMemo(() => `ss_guidelines_accepted_${userId || 'guest'}`, [userId]);

  // Track auth user id if not provided via props
  useEffect(() => {
    if (userIdProp) {
      setUserId(userIdProp);
      return; // external override
    }
    
    // Use authUser from context first
    if (authUser?.id) {
      setUserId(authUser.id);
      console.log('[Groups] Using auth context user:', authUser.email);
      return;
    }
    
    // Fallback to checking session directly
    let sub;
    (async () => {
      try {
        if (!supabase) return;
        const { data } = await supabase.auth.getSession();
        const sessionUserId = data?.session?.user?.id || null;
        console.log('[Groups] Session user ID:', sessionUserId);
        setUserId(sessionUserId);
      } catch {
        console.error('Groups: getSession failed');
      }
    })();
    
    if (supabase) {
      const listener = supabase.auth.onAuthStateChange((_e, session) => {
        setUserId(session?.user?.id || null);
      });
      sub = listener?.data?.subscription;
    }
    return () => sub?.unsubscribe?.();
  }, [userIdProp, authUser]);
  
  // Create a new group via backend API
  const createGroup = async () => {
    const name = newGroupName.trim();
    if (!name) return;
    
    // Always use the current Supabase user ID
    let validUserId = userId;
    if (!validUserId && supabase) {
      try {
        const { data } = await supabase.auth.getSession();
        validUserId = data?.session?.user?.id || null;
      } catch {
        console.error('Groups: getSession in createGroup failed');
      }
    }
    
    if (!validUserId) {
      alert('Please sign in to create a group.');
      onNavigate && onNavigate('login');
      return;
    }
    
    setCreatingGroup(true);
    
    try {
      // Get user info from supabase session for email/username
      let userEmail = null;
      let userName = null;
      if (supabase) {
        try {
          const { data } = await supabase.auth.getSession();
          userEmail = data?.session?.user?.email || null;
          userName = data?.session?.user?.user_metadata?.username || 
                     userEmail?.split('@')[0] || 
                     `user_${validUserId.substring(0, 8)}`;
        } catch (e) {
          console.log('[Groups] Could not fetch session for email');
        }
      }
      
      // First, ensure user record exists with email and username
      console.log('[Groups] Ensuring user record exists for:', validUserId, userEmail);
      const ensureRes = await fetch(`${API_BASE}/api/users/ensure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_id: validUserId,
          email: userEmail,
          username: userName
        })
      });
      
      if (!ensureRes.ok) {
        console.error('[Groups] Failed to ensure user record');
        const ensureErr = await ensureRes.json().catch(() => ({}));
        console.error('[Groups] Ensure error:', ensureErr);
      } else {
        console.log('[Groups] User record verified/created');
      }
      
      // Now create the group
      console.log('[Groups] Creating group:', name, 'for user:', validUserId);
      const res = await fetch(`${API_BASE}/api/groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, user_id: validUserId })
      });
      
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const errorMsg = err.error || 'Failed to create group';
        console.error('[Groups] Create failed:', errorMsg, err);
        
        // Show more helpful error messages
        if (errorMsg.includes('already exists')) {
          alert(`The "${name}" group already exists. Please join it from the list below.`);
        } else {
          alert(errorMsg + (err.hint ? `\n\n${err.hint}` : ''));
        }
        return;
      }
      
      const g = await res.json();
      console.log('[Groups] Group created successfully:', g);
      setGroups([g, ...groups]);
      setNewGroupName(ALLOWED_GROUPS[0]); // Reset to first option
      selectGroup(g);
      
    } catch (e) {
      console.error('[Groups] Exception:', e);
      alert('Network error creating group. Please check your connection and try again.');
    } finally {
      setCreatingGroup(false);
    }
  };

  useEffect(() => {
    (async () => {
      // Auto-setup user account when component loads
      if (userId) {
        try {
          console.log('[Groups] Auto-setting up user account for:', userId);
          const { data: { session } } = await supabase.auth.getSession();
          const email = session?.user?.email;
          const userName = session?.user?.user_metadata?.username || 
                          (email ? email.split('@')[0] : null) || 
                          `user_${userId.substring(0, 8)}`;
          
          if (email) {
            console.log('[Groups] Ensuring user record exists for:', userId, email);
            const ensureRes = await fetch(`${API_BASE}/api/users/ensure`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ user_id: userId, email, username: userName })
            });
            if (ensureRes.ok) {
              console.log('[Groups] User account ready');
            }
          }
        } catch (e) {
          console.error('[Groups] Auto-setup error:', e);
        }
      }
      
      try {
        const res = await fetch(`${API_BASE}/api/groups`);
        if (res.ok) setGroups(await res.json());
      } finally {
        setLoading(false);
      }
    })();
    const stored = localStorage.getItem(guidelinesKey);
    if (stored === 'true') setGuidelinesAccepted(true);
  }, [guidelinesKey, userId]);

  const loadMessages = async (groupId) => {
    const res = await fetch(`${API_BASE}/api/groups/${groupId}/messages`);
    if (res.ok) setMessages(await res.json());
  };

  const loadMembers = async (groupId) => {
    const res = await fetch(`${API_BASE}/api/groups/${groupId}/members`);
    if (res.ok) {
      const data = await res.json();
      setMembers(data);
      setIsMember(userId ? data.some(m => m.user_id === userId) : false);
    }
  };

  const selectGroup = (g) => {
    setSelectedGroup(g);
    loadMessages(g.id);
    loadMembers(g.id);
  };

  const joinGroup = async () => {
    if (!selectedGroup) return;
    try {
      if (!userId) {
        alert('Please log in to join groups.');
        onNavigate && onNavigate('login');
        return;
      }
      const res = await fetch(`${API_BASE}/api/groups/${selectedGroup.id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      });
      if (res.ok) {
        await loadMembers(selectedGroup.id);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Failed to join group');
      }
    } catch (e) {
      console.error('Failed to join group', e);
      alert('Failed to join group');
    }
  };

  const leaveGroup = async () => {
    if (!selectedGroup) return;
    try {
      if (!userId) {
        alert('Please log in to leave groups.');
        onNavigate && onNavigate('login');
        return;
      }
      const res = await fetch(`${API_BASE}/api/groups/${selectedGroup.id}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      });
      if (res.ok) {
        await loadMembers(selectedGroup.id);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Failed to leave group');
      }
    } catch (e) {
      console.error('Failed to leave group', e);
      alert('Failed to leave group');
    }
  };

  const sendMessage = async () => {
    const content = input.trim();
    if (!content || !selectedGroup) return;
    if (!guidelinesAccepted) {
      setGuidelinesOpen(true);
      return;
    }
    if (!userId) {
      alert('Please log in to send messages.');
      onNavigate && onNavigate('login');
      return;
    }
    const accessToken = localStorage.getItem('sb-access-token');
    const res = await fetch(`${API_BASE}/api/groups/${selectedGroup.id}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({ content, user_id: userId })
    });
    if (res.ok) {
      setInput('');
      await loadMessages(selectedGroup.id);
    } else {
      const err = await res.json();
      alert(err.error || 'Failed to send message');
    }
  };

  const handleReport = async () => {
    if (!reportingMessage) return;
    
    try {
      if (!userId) {
        alert('Please log in to report messages.');
        onNavigate && onNavigate('login');
        return;
      }
      const res = await fetch(`${API_BASE}/api/moderation/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message_id: reportingMessage.id,
          reported_by: userId,
          reason: reportReason,
          details: reportDetails
        })
      });
      
      if (res.ok) {
        alert('Report submitted. Thank you for helping keep our community safe.');
        setReportDialogOpen(false);
        setReportingMessage(null);
        setReportDetails('');
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to submit report');
      }
    } catch (e) {
      console.error('Failed to submit report', e);
      alert('Failed to submit report');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {onBack && (
        <Button onClick={onBack} size="small" variant="contained" sx={{ bgcolor: 'white', color: 'black', textTransform: 'none', fontWeight: 700, borderRadius: 999, mb: 1, '&:hover': { bgcolor: 'grey.100' } }}>Home</Button>
      )}
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
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {userId ? 'Select a group below or create a new one:' : 'Sign in to create or join groups'}
              </Typography>
              
              {!userId && (
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  onClick={() => onNavigate && onNavigate('login')}
                  sx={{ mb: 2 }}
                >
                  Sign In to Continue
                </Button>
              )}
              
              {userId && (
                <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                  <TextField
                    id="add-group-input"
                    select
                    size="small"
                    label="Select Group Type"
                    value={newGroupName}
                    onChange={e => setNewGroupName(e.target.value)}
                    disabled={creatingGroup}
                    fullWidth
                    SelectProps={{ native: true }}
                  >
                    {ALLOWED_GROUPS.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </TextField>
                  <Button
                    variant="contained"
                    onClick={createGroup}
                    disabled={creatingGroup || !newGroupName.trim()}
                    sx={{ minWidth: 120 }}
                  >
                    {creatingGroup ? 'Creating...' : 'Create Group'}
                  </Button>
                </Stack>
              )}
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
                {!guidelinesAccepted && (
                  <Box sx={{ p: 1, bgcolor: 'warning.light', color: 'black', borderRadius: 1 }}>
                    <Typography variant="caption">
                      By participating, you agree to our{' '}
                      <MuiLink component="button" onClick={() => onNavigate && onNavigate('guidelines')} sx={{ fontWeight: 700 }}>
                        Community Guidelines
                      </MuiLink>.
                    </Typography>
                  </Box>
                )}
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
                      <ListItem 
                        key={m.id}
                        secondaryAction={
                          <Tooltip title="Report this message">
                            <IconButton 
                              edge="end" 
                              size="small"
                              onClick={() => {
                                setReportingMessage(m);
                                setReportDialogOpen(true);
                              }}
                            >
                              <FlagIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        }
                      >
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

      {/* Report Dialog */}
      <Dialog open={reportDialogOpen} onClose={() => setReportDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Report Message</DialogTitle>
        <DialogContent>
          {reportingMessage && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Message:
              </Typography>
              <Typography variant="body2" sx={{ p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
                {reportingMessage.content}
              </Typography>
            </Box>
          )}
          
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              select
              label="Reason"
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              fullWidth
              SelectProps={{ native: true }}
            >
              <option value="inappropriate">Inappropriate content</option>
              <option value="harassment">Harassment or bullying</option>
              <option value="spam">Spam or advertising</option>
              <option value="hate">Hate speech</option>
              <option value="threats">Threats or violence</option>
              <option value="other">Other</option>
            </TextField>
            
            <TextField
              label="Additional details (optional)"
              multiline
              rows={3}
              fullWidth
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value)}
              placeholder="Provide any additional context..."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReportDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleReport} variant="contained" color="error">
            Submit Report
          </Button>
        </DialogActions>
      </Dialog>

      {/* Guidelines Acceptance Dialog */}
      <Dialog open={guidelinesOpen} onClose={() => setGuidelinesOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Agree to Community Guidelines</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2">
              To keep conversations helpful and safe, please agree to follow our
              community rules (no solicitations, no personal contact info, no harassment, obey local laws).
            </Typography>
            <MuiLink component="button" onClick={() => onNavigate && onNavigate('guidelines')} sx={{ alignSelf: 'flex-start' }}>
              View full Community Guidelines
            </MuiLink>
            <FormControlLabel
              control={<Checkbox checked={guidelinesChecked} onChange={(e) => setGuidelinesChecked(e.target.checked)} />}
              label="I agree to follow the Community Guidelines"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGuidelinesOpen(false)}>Cancel</Button>
          <Button
            onClick={() => {
              localStorage.setItem(guidelinesKey, 'true');
              setGuidelinesAccepted(true);
              setGuidelinesOpen(false);
            }}
            variant="contained"
            disabled={!guidelinesChecked}
          >
            Accept & Continue
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
