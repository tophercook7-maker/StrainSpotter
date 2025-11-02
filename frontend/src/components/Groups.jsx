import { useCallback, useEffect, useMemo, useState } from 'react';
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
  ListItemAvatar,
  Avatar,
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
  Link as MuiLink,
  Snackbar,
  Alert
} from '@mui/material';
import FlagIcon from '@mui/icons-material/Flag';
import { API_BASE } from '../config';
import { supabase } from '../supabaseClient';
import { useAuth } from '../hooks/useAuth.js';

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
  const [isMember, setIsMember] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportingMessage, setReportingMessage] = useState(null);
  const [reportReason, setReportReason] = useState('inappropriate');
  const [reportDetails, setReportDetails] = useState('');
  const [guidelinesOpen, setGuidelinesOpen] = useState(false);
  const [guidelinesChecked, setGuidelinesChecked] = useState(false);
  const [guidelinesAccepted, setGuidelinesAccepted] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const guidelinesKey = useMemo(() => `ss_guidelines_accepted_${userId || 'guest'}`, [userId]);
  const handleSnackbarClose = (_event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar(prev => ({ ...prev, open: false }));
  };
  const [adminUserId, setAdminUserId] = useState(null);

  const formatTimestamp = useCallback((iso) => {
    if (!iso) return '';
    const date = new Date(iso);
    const diffSeconds = (Date.now() - date.getTime()) / 1000;
    if (diffSeconds < 45) return 'just now';
    if (diffSeconds < 90) return '1 min ago';
    const diffMinutes = diffSeconds / 60;
    if (diffMinutes < 60) return `${Math.round(diffMinutes)} min ago`;
    const diffHours = diffMinutes / 60;
    if (diffHours < 24) return `${Math.round(diffHours)} hr${Math.round(diffHours) === 1 ? '' : 's'} ago`;
    const diffDays = diffHours / 24;
    if (diffDays < 30) return `${Math.round(diffDays)} day${Math.round(diffDays) === 1 ? '' : 's'} ago`;
    return date.toLocaleDateString();
  }, []);

  const messageSnippet = useCallback((content) => {
    if (!content) return '';
    return content.length > 90 ? `${content.slice(0, 87)}…` : content;
  }, []);

  const currentUserName = useMemo(() => {
    return authUser?.user_metadata?.username ||
      authUser?.email?.split('@')[0] ||
      'You';
  }, [authUser]);

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
        if (res.ok) {
          const payload = await res.json();
          const curated = Array.isArray(payload)
            ? payload.filter(group => ALLOWED_GROUPS.includes(group.name))
            : [];
          setGroups(curated);
          if (!adminUserId && Array.isArray(payload) && payload.length) {
            setAdminUserId(payload[0]?.admin_user_id || null);
          }
        }
      } finally {
        setLoading(false);
      }
    })();
    const stored = localStorage.getItem(guidelinesKey);
    if (stored === 'true') setGuidelinesAccepted(true);
  }, [guidelinesKey, userId, adminUserId]);

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
      return data;
    }
    return [];
  };

  const selectGroup = async (g) => {
    setSelectedGroup(g);
    await loadMessages(g.id);
    const currentMembers = await loadMembers(g.id);
    const alreadyMember = userId ? currentMembers.some(m => m.user_id === userId) : false;
    if (userId && !alreadyMember) {
      await joinGroup({ group: g, silent: true });
      await loadMembers(g.id);
      await loadMessages(g.id);
    }
  };

  const joinGroup = async ({ group = selectedGroup, silent = false } = {}) => {
    const targetGroup = group;
    if (!targetGroup) return;
    try {
      if (!userId) {
        if (!silent) {
          alert('Please log in to join groups.');
          onNavigate && onNavigate('login');
        }
        return;
      }
      const res = await fetch(`${API_BASE}/api/groups/${targetGroup.id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      });
      if (res.ok) {
        await loadMembers(targetGroup.id);
        setIsMember(true);
        if (!silent) {
          setSnackbar({ open: true, message: 'Joined group!', severity: 'success' });
        }
        return;
      }

      const err = await res.json().catch(() => ({}));
      const message = err.error || '';
      if (typeof message === 'string' && message.toLowerCase().includes('already a member')) {
        await loadMembers(targetGroup.id);
        setIsMember(true);
        if (!silent) {
          setSnackbar({ open: true, message: 'You are already in this group.', severity: 'info' });
        }
        return;
      }

      if (!silent) {
        alert(message || 'Failed to join group');
      } else {
        console.error('Failed to join group silently:', message || 'Unknown error');
      }
    } catch (e) {
      console.error('Failed to join group', e);
      if (!silent) {
        alert('Failed to join group');
      }
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
    const optimisticId = `temp-${Date.now()}`;
    const optimisticMessage = {
      id: optimisticId,
      content,
      created_at: new Date().toISOString(),
      user_id: userId,
      users: {
        id: userId,
        username: currentUserName,
        avatar_url: null
      },
      optimistic: true
    };

    setMessages(prev => [...prev, optimisticMessage]);
    setInput('');

    try {
      const res = await fetch(`${API_BASE}/api/groups/${selectedGroup.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ content, user_id: userId })
      });
      if (res.ok) {
        await loadMessages(selectedGroup.id);
      } else {
        const err = await res.json();
        setMessages(prev => prev.filter(m => m.id !== optimisticId));
        alert(err.error || 'Failed to send message');
      }
    } catch (e) {
      setMessages(prev => prev.filter(m => m.id !== optimisticId));
      alert('Failed to send message');
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

  useEffect(() => {
    if (!selectedGroup) return;
    const updated = groups.find(g => g.id === selectedGroup.id);
    if (updated && updated !== selectedGroup) {
      setSelectedGroup(updated);
    }
  }, [groups, selectedGroup]);

  const sortedGroups = useMemo(() => {
    const copy = [...groups];
    return copy.sort((a, b) => {
      const aTime = a?.last_message?.created_at || a?.created_at || 0;
      const bTime = b?.last_message?.created_at || b?.created_at || 0;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });
  }, [groups]);

  const renderGroupButton = (group) => {
    const last = group.last_message;
    const snippet = last ? `${last.user?.username ? `${last.user.username}: ` : ''}${messageSnippet(last.content)}` : 'No conversations yet.';
    const timestamp = formatTimestamp(last?.created_at || group.created_at);
    return (
      <Button
        key={group.id}
        variant={selectedGroup?.id === group.id ? 'contained' : 'outlined'}
        onClick={() => selectGroup(group)}
        fullWidth
        sx={{
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          textAlign: 'left',
          p: 2,
          borderRadius: 3,
          borderColor: 'rgba(124,179,66,0.35)',
          bgcolor: selectedGroup?.id === group.id ? 'rgba(124,179,66,0.25)' : 'rgba(255,255,255,0.8)',
          color: '#1f3320',
          '&:hover': {
            bgcolor: 'rgba(124,179,66,0.3)'
          }
        }}
      >
        <Stack spacing={0.5} sx={{ flex: 1, pr: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{group.name}</Typography>
          <Typography variant="body2" sx={{ color: 'rgba(22,34,22,0.75)' }}>{snippet}</Typography>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <Typography variant="caption" sx={{ color: 'rgba(22,34,22,0.6)' }}>
              {group.member_count || 0} member{group.member_count === 1 ? '' : 's'}
            </Typography>
            {group.member_preview?.map(member => (
              <Chip
                key={`${group.id}-${member.id}`}
                label={member.username}
                size="small"
                sx={{ maxWidth: 120 }}
              />
            ))}
          </Stack>
        </Stack>
        <Typography variant="caption" sx={{ color: 'rgba(22,34,22,0.6)' }}>{timestamp}</Typography>
      </Button>
    );
  };

  const renderMessageAuthor = (message) => {
    const name = message.users?.username || 'Member';
    const initials = name.slice(0, 2).toUpperCase();
    return (
      <ListItemAvatar>
        <Avatar sx={{ bgcolor: 'rgba(124,179,66,0.35)', color: '#0c220f' }}>
          {initials}
        </Avatar>
      </ListItemAvatar>
    );
  };

  const isAdminMessage = (message) => {
    if (!adminUserId) return false;
    return message.user_id === adminUserId;
  };

  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: '100vh',
        py: { xs: 3, md: 6 },
        px: { xs: 1.5, md: 4 },
        display: 'flex',
        justifyContent: 'center'
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: { xs: 16, md: 48 },
          zIndex: 0,
          borderRadius: 6,
          background: 'rgba(6, 20, 7, 0.78)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.55)'
        }}
      />
      <Container
        maxWidth="lg"
        sx={{
          position: 'relative',
          zIndex: 1,
          color: '#f5f5f5'
        }}
      >
        {onBack && (
          <Button
            onClick={onBack}
            size="small"
            variant="contained"
            sx={{
              bgcolor: 'rgba(255,255,255,0.2)',
              color: '#fff',
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: 999,
              mb: 1,
              '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
            }}
          >
            ← Back to Garden
          </Button>
        )}
        <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>
          Groups & Chat
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
          {/* Groups list */}
          <Card sx={{
            flex: { xs: '1 1 auto', md: '0 0 300px' },
            bgcolor: 'rgba(255,255,255,0.9)',
            color: '#1f3320',
          boxShadow: '0 18px 50px rgba(0,0,0,0.3)',
          backdropFilter: 'blur(12px)',
          borderRadius: 4,
          border: '1px solid rgba(255,255,255,0.18)'
        }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Groups
            </Typography>
            <Stack spacing={2}>
              <Typography variant="body2" sx={{ mb: 1, color: 'rgba(22,34,22,0.8)' }}>
                {userId ? 'Select one of our curated community groups below to jump into the conversation.' : 'Sign in to join the community groups.'}
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
              {loading ? (
                <Typography variant="body2" sx={{ color: 'rgba(22,34,22,0.6)' }}>
                  Loading...
                </Typography>
              ) : sortedGroups.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No groups yet.
                </Typography>
              ) : (
                <Stack spacing={1.5}>
                  {sortedGroups.map(renderGroupButton)}
                </Stack>
              )}
            </Stack>
          </CardContent>
        </Card>

        {/* Chat area */}
        <Card sx={{
          flex: 1,
          bgcolor: 'rgba(255,255,255,0.9)',
          color: '#1f3320',
          boxShadow: '0 18px 50px rgba(0,0,0,0.3)',
          backdropFilter: 'blur(12px)',
          borderRadius: 4,
          border: '1px solid rgba(255,255,255,0.18)'
        }}>
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
                    <Button size="small" variant="contained" onClick={() => joinGroup()}>Join</Button>
                  )}
                </Stack>
                {!guidelinesAccepted && (
                  <Alert
                    severity="warning"
                    icon={false}
                    sx={{
                      background: 'rgba(255,193,7,0.18)',
                      color: '#3f2c02',
                      border: '1px solid rgba(255,193,7,0.4)'
                    }}
                  >
                    By participating, you agree to our{' '}
                    <MuiLink component="button" onClick={() => onNavigate && onNavigate('guidelines')} sx={{ fontWeight: 700 }}>
                      Community Guidelines
                    </MuiLink>.
                  </Alert>
                )}
                <Alert
                  severity="info"
                  icon={false}
                  sx={{
                    background: 'rgba(124,179,66,0.12)',
                    color: '#102A12',
                    border: '1px solid rgba(124,179,66,0.4)'
                  }}
                >
                  Groups keep the 100 most recent messages so conversations stay tidy. Older threads roll off automatically.
                </Alert>
                <Typography variant="caption" color="text.secondary">
                  {members.length} member{members.length !== 1 ? 's' : ''}
                  {members.length > 0 && ': '}
                  {members.slice(0, 5).map(m => m.users?.username || 'Unknown').join(', ')}
                  {members.length > 5 && '...'}
                </Typography>
                <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                  {messages.length === 0 ? (
                    <ListItem>
                      <ListItemText
                        secondary={
                          <Typography variant="body2" color="text.secondary">
                            Be the first to say hello! Share what brings you here or ask a quick question to get the conversation rolling.
                          </Typography>
                        }
                      />
                    </ListItem>
                  ) : (
                    messages.map((m) => (
                      <ListItem 
                        key={m.id}
                        alignItems="flex-start"
                        sx={{
                          alignItems: 'flex-start',
                          bgcolor: isAdminMessage(m) ? 'rgba(124,179,66,0.12)' : 'transparent',
                          borderLeft: isAdminMessage(m) ? '4px solid rgba(124,179,66,0.8)' : '4px solid transparent',
                          mb: 1,
                          borderRadius: 2,
                          pr: 6
                        }}
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
                        {renderMessageAuthor(m)}
                        <ListItemText
                          primary={
                            <Typography variant="body2" sx={{ color: '#112516' }}>
                              {m.content}
                            </Typography>
                          }
                          secondary={
                            <Typography variant="caption" color="text.secondary">
                              {(m.users?.username || 'Member')} • {new Date(m.created_at).toLocaleString()}
                              {m.optimistic ? ' • sending…' : ''}
                            </Typography>
                          }
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
        <DialogTitle sx={{
          bgcolor: 'rgba(255,255,255,0.7)',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
          backdropFilter: 'blur(12px)',
          borderRadius: 4,
          border: '1px solid rgba(255,255,255,0.18)'
        }}>Report Message</DialogTitle>
        <DialogContent sx={{
          bgcolor: 'rgba(255,255,255,0.7)',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
          backdropFilter: 'blur(12px)',
          borderRadius: 4,
          border: '1px solid rgba(255,255,255,0.18)'
        }}>
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

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  </Box>
  );
}
