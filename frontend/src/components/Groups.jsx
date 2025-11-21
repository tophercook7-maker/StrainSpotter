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
  Alert,
  Tabs,
  Tab,
  Badge,
  ToggleButtonGroup,
  ToggleButton
} from '@mui/material';
import FlagIcon from '@mui/icons-material/Flag';
import GroupsIcon from '@mui/icons-material/Groups';
import ChatIcon from '@mui/icons-material/Chat';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import PushPinIcon from '@mui/icons-material/PushPin';
import ProfileSetupDialog from './ProfileSetupDialog.jsx';
import { API_BASE } from '../config';
import { supabase } from '../supabaseClient';
import { useAuth } from '../hooks/useAuth.js';

export default function Groups({ userId: userIdProp, onNavigate, onBack }) {
  const { user: authUser } = useAuth(); // Get user from global context
  const [groups, setGroups] = useState([]);
  const [userId, setUserId] = useState(userIdProp || authUser?.id || null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [members, setMembers] = useState([]);
  const [messages, setMessages] = useState([]); // Group messages
  const [pinnedMessages, setPinnedMessages] = useState([]); // Pinned messages
  const [userRole, setUserRole] = useState('consumer'); // Current user's role
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [replyTo, setReplyTo] = useState(null); // Message being replied to
  const [loading, setLoading] = useState(true);

  // Direct Messages state
  const [activeTab, setActiveTab] = useState(0); // 0 = Groups, 1 = Direct Messages
  const [directChats, setDirectChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [chatDialogOpen, setChatDialogOpen] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [directMessages, setDirectMessages] = useState([]); // Direct messages (separate from group messages)
  const [usersError, setUsersError] = useState(null); // Error loading users
  const [loadingUsers, setLoadingUsers] = useState(false); // Loading state for users
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [dmFilter, setDmFilter] = useState('recent');

  // Check if current user is admin
  const isCurrentUserAdmin = authUser?.email === 'topher.cook7@gmail.com' ||
                             authUser?.email === 'strainspotter25@gmail.com' ||
                             authUser?.email === 'admin@strainspotter.com' ||
                             authUser?.email === 'andrewbeck209@gmail.com';
  const [showMemberList, setShowMemberList] = useState(false);
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

  const normalizeText = useCallback((value) => (value || '').toString().toLowerCase().trim(), []);

  const userDisplayName = useCallback((user) => {
    return user?.display_name
      || user?.username
      || (user?.email ? user.email.split('@')[0] : null)
      || 'User';
  }, []);

  const filteredDirectChats = useMemo(() => {
    const term = normalizeText(userSearchTerm);
    if (!term) return directChats;
    return directChats.filter(chat => normalizeText(userDisplayName(chat.user)).includes(term));
  }, [directChats, userSearchTerm, normalizeText, userDisplayName]);

  const filteredUsers = useMemo(() => {
    const term = normalizeText(userSearchTerm);
    const list = allUsers.map(user => ({
      ...user,
      _label: userDisplayName(user)
    })).sort((a, b) => a._label.localeCompare(b._label));

    if (!term) return list;
    return list.filter(user => normalizeText(user._label).includes(term));
  }, [allUsers, userSearchTerm, normalizeText, userDisplayName]);
  const [adminUserId, setAdminUserId] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [profileInfo, setProfileInfo] = useState(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profilePromptDismissed, setProfilePromptDismissed] = useState(false);

  const sendHeartbeat = useCallback(async () => {
    if (!userId) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;
      await fetch(`${API_BASE}/api/users/heartbeat`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
    } catch (err) {
      console.error('[Groups] Heartbeat failed:', err);
    }
  }, [userId]);

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

  const [currentUserName, setCurrentUserName] = useState('You');

  const shouldPromptProfile = useCallback((profile, email, id) => {
    const name = (profile?.display_name || '').trim();
    if (!name) return true;
    if (name.length < 3) return true;
    const lower = name.toLowerCase();
    const emailPrefix = email ? email.split('@')[0].toLowerCase() : '';
    const sanitizedEmail = emailPrefix.replace(/[^a-z]/g, '');
    const fallbacks = [
      emailPrefix,
      sanitizedEmail,
      `user_${(id || '').slice(0, 8)}`.toLowerCase(),
      `user ${(id || '').slice(0, 8)}`.toLowerCase(),
      `member ${(id || '').slice(0, 8)}`.toLowerCase()
    ];
    if (fallbacks.includes(lower)) return true;
    if (lower.includes('@')) return true;
    if (/_/.test(lower) || /[0-9]{3,}/.test(lower)) return true;
    return false;
  }, []);

  const deriveDisplayName = useCallback((profile, email, id) => {
    if (profile?.display_name) return profile.display_name;
    if (profile?.username) return profile.username;
    if (email === 'topher.cook7@gmail.com') return 'Topher';
    if (email) return email.split('@')[0];
    if (id) return `Member ${id.slice(0, 8)}`;
    return 'You';
  }, []);

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
    if (!userId) return;
    sendHeartbeat();
    const interval = setInterval(() => {
      sendHeartbeat();
    }, 60000);
    return () => clearInterval(interval);
  }, [userId, sendHeartbeat]);
  
  useEffect(() => {
    (async () => {
      // Auto-setup user account when component loads
      if (userId) {
        try {
          console.log('[Groups] Auto-setting up user account for:', userId);
          const { data: { session } } = await supabase.auth.getSession();
          const email = session?.user?.email;

          if (email) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('display_name, username, email, role')
              .eq('user_id', userId)
              .single();

            const profileWithEmail = profile
              ? { ...profile, email: profile.email ?? email }
              : { display_name: null, username: null, email, role: 'consumer' };

            setProfileInfo(profileWithEmail);
            setUserRole(profile?.role || 'consumer');

            const userName = deriveDisplayName(profileWithEmail, email, userId);
            setCurrentUserName(userName);

            if (!profilePromptDismissed && shouldPromptProfile(profileWithEmail, email, userId)) {
              setProfileDialogOpen(true);
            }

            console.log('[Groups] Ensuring user record exists for:', userId, email);
            const ensureRes = await fetch(`${API_BASE}/api/users/ensure`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ user_id: userId, email, username: userName })
            });
            if (ensureRes.ok) {
              console.log('[Groups] User account ready');
            }
          } else if (!profilePromptDismissed) {
            setProfileDialogOpen(true);
          }
        } catch (e) {
          console.error('[Groups] Auto-setup error:', e);
        }
      }

      // Load groups
      await loadGroups();
      setLoading(false);
    })();
    const stored = localStorage.getItem(guidelinesKey);
    if (stored === 'true') setGuidelinesAccepted(true);
  }, [guidelinesKey, userId, adminUserId, profilePromptDismissed, deriveDisplayName, shouldPromptProfile]);

  // Auto-refresh messages when a group is selected
  useEffect(() => {
    if (!selectedGroup || !groupDialogOpen) return;

    console.log('🔄 Starting auto-refresh for group:', selectedGroup.id);

    // Refresh messages every 3 seconds
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing messages...');
      loadMessages(selectedGroup.id);
    }, 3000);

    return () => {
      console.log('🛑 Stopping auto-refresh');
      clearInterval(interval);
    };
  }, [selectedGroup, groupDialogOpen]);

  // Auto-refresh direct messages when a chat is selected
  useEffect(() => {
    if (!selectedChat || !chatDialogOpen) return;

    console.log('🔄 Starting auto-refresh for direct chat:', selectedChat.user_id);

    // Refresh messages every 3 seconds
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing direct messages...');
      loadDirectMessages(selectedChat.user_id);
    }, 3000);

    return () => {
      console.log('🛑 Stopping direct chat auto-refresh');
      clearInterval(interval);
    };
  }, [selectedChat, chatDialogOpen]);

  // Load users and direct chats when switching to DM tab
  useEffect(() => {
    if (activeTab === 1 && userId) {
      console.log('🔄 Direct Messages tab activated, loading users...');
      console.log('🔄 API_BASE:', API_BASE);
      console.log('🔄 userId:', userId);
      loadAllUsers();
      loadDirectChats();
    }
  }, [activeTab, userId]);

  // Load groups list
  const loadGroups = async () => {
    try {
      console.log('[Groups] Fetching from:', `${API_BASE}/api/groups`);
      const res = await fetch(`${API_BASE}/api/groups`);
      console.log('[Groups] Response status:', res.status, res.statusText);
      if (res.ok) {
        const payload = await res.json();
        console.log('[Groups] Received groups:', payload?.length || 0);
        const curated = Array.isArray(payload)
          ? payload.filter(group => ALLOWED_GROUPS.includes(group.name))
          : [];
        console.log('[Groups] Filtered groups:', curated?.length || 0);
        setGroups(curated);
        if (!adminUserId && Array.isArray(payload) && payload.length) {
          setAdminUserId(payload[0]?.admin_user_id || null);
        }
      } else {
        console.error('[Groups] Failed to fetch groups:', res.status, res.statusText);
      }
    } catch (err) {
      console.error('[Groups] Fetch error:', err);
    }
  };

  const loadMessages = async (groupId) => {
    try {
      console.log('📥 Loading messages for group:', groupId);
      console.log('📥 API URL:', `${API_BASE}/api/groups/${groupId}/messages`);
      const res = await fetch(`${API_BASE}/api/groups/${groupId}/messages`);
      console.log('📥 Load messages response:', res.status, res.ok);
      if (res.ok) {
        const data = await res.json();
        // Handle both old format (array) and new format (object with messages/pinnedMessages)
        if (Array.isArray(data)) {
          setMessages(data);
          setPinnedMessages([]);
        } else {
          setMessages(data.messages || []);
          setPinnedMessages(data.pinnedMessages || []);
        }
        console.log('📥 Loaded messages:', (data.messages || data).length, 'messages');
        console.log('📥 Loaded pinned messages:', (data.pinnedMessages || []).length);
        setLastRefresh(new Date());
      } else {
        console.error('❌ Failed to load messages:', res.status, res.statusText);
      }
    } catch (e) {
      console.error('❌ Error loading messages:', e);
    }
  };

  // Pin/unpin handlers
  const canPin = ['grower', 'dispensary', 'moderator', 'admin'].includes(userRole);

  const handlePin = async (msg) => {
    if (!canPin || !userId || !selectedGroup) return;
    try {
      await fetch(`${API_BASE}/api/groups/${selectedGroup.id}/messages/${msg.id}/pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      });
      loadMessages(selectedGroup.id);
    } catch (e) {
      console.error('Error pinning message:', e);
    }
  };

  const handleUnpin = async (msg) => {
    if (!canPin || !userId || !selectedGroup) return;
    try {
      await fetch(`${API_BASE}/api/groups/${selectedGroup.id}/messages/${msg.id}/unpin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      });
      loadMessages(selectedGroup.id);
    } catch (e) {
      console.error('Error unpinning message:', e);
    }
  };

  const loadMembers = async (groupId) => {
    console.log('👥 Loading members for group:', groupId);
    const res = await fetch(`${API_BASE}/api/groups/${groupId}/members`);
    if (res.ok) {
      const data = await res.json();
      console.log('👥 Members loaded:', data.length, 'members');
      console.log('👥 Member details:', data.map(m => ({
        user_id: m.user_id,
        username: m.users?.username,
        email: m.users?.email
      })));
      setMembers(data);
      setIsMember(userId ? data.some(m => m.user_id === userId) : false);
      return data;
    }
    console.error('👥 Failed to load members:', res.status);
    return [];
  };

  // Load all users for direct messaging
  const loadAllUsers = async () => {
    setUsersError(null); // Clear previous errors
    setLoadingUsers(true);
    try {
      console.log('👤 Loading all users from:', `${API_BASE}/api/users`);
      console.log('👤 Current user ID:', userId);

      const res = await fetch(`${API_BASE}/api/users`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      console.log('👤 Users response status:', res.status, res.statusText);
      console.log('👤 Response headers:', Object.fromEntries(res.headers.entries()));

      if (res.ok) {
        const data = await res.json();
        console.log('👤 Total users loaded:', data.length);
        console.log('👤 User details:', data.map(u => ({
          user_id: u.user_id,
          display_name: u.display_name,
          username: u.username,
          email: u.email
        })));
        // Filter out current user
        const otherUsers = data.filter(u => u.user_id !== userId);
        console.log('👤 Other users (excluding current):', otherUsers.length);
        setAllUsers(otherUsers);
        setUsersError(null);
      } else {
        const errorText = await res.text();
        console.error('👤 Failed to load users:', res.status, res.statusText);
        console.error('👤 Error response:', errorText);
        const errorMsg = `Failed to load users: ${res.status} ${res.statusText}`;
        setUsersError(errorMsg);
      }
    } catch (e) {
      console.error('👤 Failed to load users - Exception:', e);
      console.error('👤 Error stack:', e.stack);
      const errorMsg = `Cannot connect to backend: ${e.message}\n\nMake sure:\n1. Backend is running (npm run dev)\n2. You're on the same WiFi network\n3. API_BASE is set to: ${API_BASE}`;
      setUsersError(errorMsg);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleProfileSave = async ({ displayName }) => {
    setProfileSaving(true);
    setProfileError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        throw new Error('Please log in again.');
      }

      const res = await fetch(`${API_BASE}/api/users/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          display_name: displayName
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update profile.');
      }

      const { profile } = await res.json();
      if (profile) {
        setProfileInfo(profile);
        const friendlyName = deriveDisplayName(profile, profile.email || session?.user?.email, userId);
        setCurrentUserName(friendlyName);
      }

      setProfileDialogOpen(false);
      setProfilePromptDismissed(false);
      setSnackbar({ open: true, message: 'Profile updated!', severity: 'success' });

      if (selectedGroup) {
        await loadMembers(selectedGroup.id);
      }
      await loadAllUsers();
    } catch (e) {
      console.error('[Groups] Profile update failed:', e);
      setProfileError(e.message || 'Failed to update profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleProfileDialogClose = () => {
    setProfileDialogOpen(false);
    setProfilePromptDismissed(true);
  };

  // Load direct chats for current user
  const loadDirectChats = async () => {
    if (!userId) return;
    try {
      const res = await fetch(`${API_BASE}/api/direct-chats/chats/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setDirectChats(data);
      }
    } catch (e) {
      console.error('Failed to load direct chats:', e);
    }
  };

  // Load messages for a direct chat
  const loadDirectMessages = async (otherUserId) => {
    if (!userId) return;
    try {
      console.log('💬 Loading direct messages with user:', otherUserId);
      const res = await fetch(`${API_BASE}/api/direct-messages/${userId}/${otherUserId}`);
      console.log('💬 Direct messages response:', res.status);
      if (res.ok) {
        const data = await res.json();
        console.log('💬 Loaded direct messages:', data.length);
        setDirectMessages(data);
        setLastRefresh(new Date());
      }
    } catch (e) {
      console.error('Failed to load direct messages:', e);
    }
  };

  // Start a direct chat with a user
  const startDirectChat = async (otherUser) => {
    console.log('💬 Starting direct chat with:', otherUser.display_name || otherUser.username, otherUser.user_id);
    setSelectedChat(otherUser);
    setDirectMessages([]); // Clear previous messages
    setChatDialogOpen(true);
    await loadDirectMessages(otherUser.user_id);

    // Mark messages from this user as read
    if (userId) {
      try {
        await fetch(`${API_BASE}/api/direct-messages/mark-read/${userId}/${otherUser.user_id}`, {
          method: 'PUT'
        });
        // Reload chats to update unread counts
        loadDirectChats();
      } catch (e) {
        console.error('Failed to mark messages as read:', e);
      }
    }
  };

  // Send a direct message
  const sendDirectMessage = async () => {
    const content = input.trim();
    if (!content || !selectedChat) return;
    if (!userId) {
      alert('Please log in to send messages.');
      onNavigate && onNavigate('login');
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token;

    if (!accessToken) {
      alert('Please log in to send messages.');
      onNavigate && onNavigate('login');
      return;
    }

    const optimisticId = `temp-${Date.now()}`;
    const optimisticMessage = {
      id: optimisticId,
      content,
      created_at: new Date().toISOString(),
      sender_id: userId,
      receiver_id: selectedChat.user_id,
      sender: {
        user_id: userId,
        display_name: currentUserName,
        username: currentUserName,
        avatar_url: null
      },
      optimistic: true
    };

    setDirectMessages(prev => [...prev, optimisticMessage]);
    setInput('');

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const apiUrl = `${API_BASE}/api/direct-messages`;

      console.log('🚀 Sending direct message to:', apiUrl);
      console.log('📝 Message content:', content);
      console.log('👤 Sender ID:', userId);
      console.log('👤 Receiver ID:', selectedChat.user_id);

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          sender_id: userId,
          receiver_id: selectedChat.user_id,
          content
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        console.log('✅ Direct message sent successfully!');
        const responseData = await res.json();
        setDirectMessages(prev => prev.filter(m => m.id !== optimisticId));

        if (responseData && responseData.id) {
          setDirectMessages(prev => [...prev, responseData]);
        } else {
          setTimeout(async () => {
            await loadDirectMessages(selectedChat.user_id);
          }, 500);
        }

        // Reload the chats list to show this conversation in "Recent Chats"
        loadDirectChats();
      } else {
        const errorText = await res.text();
        console.error('❌ Server error response:', errorText);
        setDirectMessages(prev => prev.filter(m => m.id !== optimisticId));
        alert(`Failed to send direct message!\n\nStatus: ${res.status} ${res.statusText}\nError: ${errorText}\n\nAPI: ${apiUrl}\n\nMake sure:\n1. Backend is running\n2. You're on the same WiFi\n3. API is: ${API_BASE}`);
      }
    } catch (e) {
      setDirectMessages(prev => prev.filter(m => m.id !== optimisticId));
      console.error('❌ Send direct message error:', e);
      alert(`Failed to send direct message!\n\nError: ${e.message}\n\nAPI: ${apiUrl}\n\nThis usually means:\n1. Backend is not running\n2. Wrong WiFi network\n3. Firewall blocking connection\n\nCurrent API: ${API_BASE}`);
    }
  };

  const selectGroup = async (g) => {
    console.log('📂 Opening group:', g.name, g.id);
    console.log('📂 Current messages state before clearing:', messages.length);
    setSelectedGroup(g);
    setMessages([]); // Clear previous group messages
    console.log('📂 Messages cleared, opening dialog');
    setGroupDialogOpen(true);
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

  const closeGroupDialog = useCallback(() => {
    setGroupDialogOpen(false);
    setSelectedGroup(null);
    setMessages([]);
  }, []);

  const sendMessage = async () => {
    const content = input.trim();
    if (!content || !selectedGroup) return;
    if (sending) return; // Prevent double sends
    
    if (!guidelinesAccepted) {
      setGuidelinesOpen(true);
      return;
    }
    if (!userId) {
      setSendError('Please log in to send messages.');
      onNavigate && onNavigate('login');
      return;
    }

    setSending(true);
    setSendError('');

    // Get access token from Supabase session
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token;

    if (!accessToken) {
      setSendError('Please log in to send messages.');
      setSending(false);
      onNavigate && onNavigate('login');
      return;
    }

    const optimisticId = `temp-${Date.now()}`;
    const optimisticMessage = {
      id: optimisticId,
      content,
      created_at: new Date().toISOString(),
      user_id: userId,
      users: {
        id: userId,
        display_name: currentUserName,
        username: currentUserName,
        avatar_url: null
      },
      optimistic: true
    };

    setMessages(prev => [...prev, optimisticMessage]);
    const messageToSend = input; // Save before clearing
    setInput('');
    const replyToId = replyTo?.id || null;
    setReplyTo(null); // Clear reply after sending

    let timeoutId;
    try {
      // Add timeout to prevent hanging
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const apiUrl = `${API_BASE}/api/groups/${selectedGroup.id}/messages`;

      console.log('🚀 Sending message to:', apiUrl);
      console.log('📝 Message content:', content);
      console.log('👤 User ID:', userId);

      const payload = {
        content: messageToSend.trim(),
        user_id: userId,
        // Include reply_to_id if backend supports it (will be ignored if not)
        reply_to_id: replyToId
      };

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log('📡 Response status:', res.status);
      console.log('📡 Response ok:', res.ok);

      if (res.ok) {
        console.log('✅ Message sent successfully!');
        const responseData = await res.json();
        console.log('📨 Response data:', responseData);

        // Remove optimistic message
        setMessages(prev => prev.filter(m => m.id !== optimisticId));

        // If backend returns the message, add it immediately
        if (responseData && responseData.id) {
          console.log('📨 Adding message from response:', responseData);
          const displayName = responseData?.users?.display_name
            || responseData?.users?.username
            || currentUserName
            || `Member ${String(userId || '').slice(0, 8)}`;

          setMessages(prev => [...prev, {
            ...responseData,
            users: {
              ...responseData.users,
              display_name: displayName,
              username: responseData?.users?.username || displayName
            }
          }]);
        } else {
          // Otherwise wait a moment for backend to save, then reload
          console.log('📨 No message in response, reloading...');
          setTimeout(async () => {
            await loadMessages(selectedGroup.id);
          }, 500);
        }

        // Reload groups list to update last_message on button
        loadGroups();
      } else {
        let body = null;
        try {
          body = await res.json();
        } catch {
          body = null;
        }
        
        const errorMsg = body?.error || body?.hint || `Send failed (${res.status})`;
        console.error('❌ Server error response:', errorMsg);
        
        setMessages(prev => prev.filter(m => m.id !== optimisticId));
        setSendError(errorMsg);
        
        // Restore input and reply if send failed
        setInput(messageToSend);
        if (replyToId) {
          // Try to restore replyTo from messages
          const originalReply = messages.find(m => m.id === replyToId);
          if (originalReply) setReplyTo(originalReply);
        }
      }
    } catch (err) {
      console.error('❌ Error sending message:', err);
      setMessages(prev => prev.filter(m => m.id !== optimisticId));
      
      let errorMsg = 'Failed to send message. Please try again.';
      if (err.name === 'AbortError') {
        errorMsg = 'Request timed out. Please check your connection and try again.';
      } else if (err.message) {
        errorMsg = err.message;
      }
      
      setSendError(errorMsg);
      
      // Restore input and reply if send failed
      setInput(messageToSend);
      if (replyToId) {
        const originalReply = messages.find(m => m.id === replyToId);
        if (originalReply) setReplyTo(originalReply);
      }
    } finally {
      setSending(false);
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
      const { data: { session } } = await supabase.auth.getSession();
      const headers = {
        'Content-Type': 'application/json'
      };
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }
      const res = await fetch(`${API_BASE}/api/moderation/report`, {
        method: 'POST',
        headers,
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
    const lastAuthor = last?.user?.display_name || last?.user?.username;
    const snippet = last
      ? `${lastAuthor ? `${lastAuthor}: ` : ''}${messageSnippet(last.content)}`
      : 'No conversations yet.';
    const timestamp = formatTimestamp(last?.created_at || group.created_at);
    return (
      <Button
        key={group.id}
        variant="outlined"
        onClick={() => selectGroup(group)}
        fullWidth
        sx={{
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          textAlign: 'left',
          p: 2,
          borderRadius: 3,
          borderColor: 'rgba(124,179,66,0.4)',
          bgcolor: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          color: '#CDDC39',
          '&:hover': {
            bgcolor: 'rgba(124,179,66,0.2)',
            borderColor: 'rgba(124,179,66,0.6)'
          }
        }}
      >
        <Stack spacing={0.5} sx={{ flex: 1, pr: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#CDDC39' }}>{group.name}</Typography>
          <Typography variant="body2" sx={{ color: '#9CCC65' }}>{snippet}</Typography>
          <Typography variant="caption" sx={{ color: '#7CB342' }}>
            {group.member_count || 0} member{group.member_count === 1 ? '' : 's'}
          </Typography>
        </Stack>
        <Typography variant="caption" sx={{ color: 'rgba(22,34,22,0.6)' }}>{timestamp}</Typography>
      </Button>
    );
  };

  const renderMessageAuthor = (message) => {
    const name = message.users?.display_name
      || message.profile?.display_name
      || message.users?.username
      || (message.users?.email ? message.users.email.split('@')[0] : null)
      || `Member ${String(message.user_id || '').slice(0, 8)}`;
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
          inset: 0,
          zIndex: 0,
          background: `
            linear-gradient(135deg,
              rgba(10, 31, 10, 0.4) 0%,
              rgba(26, 58, 26, 0.5) 15%,
              rgba(45, 90, 45, 0.6) 30%,
              rgba(34, 139, 34, 0.5) 45%,
              rgba(45, 90, 45, 0.6) 60%,
              rgba(26, 58, 26, 0.5) 75%,
              rgba(10, 31, 10, 0.4) 100%
            ),
            radial-gradient(circle at 20% 30%, rgba(124, 179, 66, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(34, 139, 34, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(45, 90, 45, 0.2) 0%, transparent 70%),
            linear-gradient(180deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 50, 0, 0.4) 100%)
          `,
          backgroundSize: '100% 100%, 150% 150%, 150% 150%, 200% 200%, 100% 100%',
          backgroundPosition: 'center, 20% 30%, 80% 70%, 50% 50%, center',
          boxShadow: 'inset 0 0 100px rgba(0, 0, 0, 0.3), inset 0 0 50px rgba(124, 179, 66, 0.1)',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100\' height=\'100\' filter=\'url(%23noise)\' opacity=\'0.05\'/%3E%3C/svg%3E")',
            opacity: 0.5,
            pointerEvents: 'none'
          }
        }}
      />
      <Container
        maxWidth="lg"
        sx={{
          position: 'relative',
          zIndex: 1,
          color: '#f5f5f5',
          pt: 'calc(env(safe-area-inset-top, 0px) + 64px)',
          pb: 3
        }}
      >
        <ProfileSetupDialog
          open={profileDialogOpen}
          email={profileInfo?.email || authUser?.email || ''}
          initialDisplayName={profileInfo?.display_name || currentUserName}
          initialUsername={profileInfo?.username || ''}
          saving={profileSaving}
          error={profileError}
          onSave={handleProfileSave}
          onClose={handleProfileDialogClose}
        />

        <Button
          onClick={onBack || (() => window.history.back())}
          size="small"
          variant="contained"
          sx={{
            bgcolor: 'rgba(124, 179, 66, 0.9)',
            color: '#fff',
            textTransform: 'none',
            fontWeight: 700,
            borderRadius: 999,
            mb: 2,
            boxShadow: '0 4px 12px rgba(124, 179, 66, 0.4)',
            '&:hover': {
              bgcolor: 'rgba(156, 204, 101, 1)',
              boxShadow: '0 6px 16px rgba(124, 179, 66, 0.6)',
              transform: 'translateY(-2px)'
            }
          }}
        >
          ← Back to Garden
        </Button>

        {/* Hero Image Icon */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Box
            sx={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: 'transparent',
              border: '2px solid rgba(124, 179, 66, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(124, 179, 66, 0.4)',
              overflow: 'hidden',
              flexShrink: 0
            }}
          >
            <img
              src="/hero.png?v=13"
              alt="StrainSpotter"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.25rem', color: '#CDDC39' }}>
            Groups & Chat
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} sx={{ mb: 2 }} alignItems="center">
          <Typography variant="body2" sx={{ color: '#9CCC65', flex: 1 }}>
            Signed in as {currentUserName}
          </Typography>
          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              setProfilePromptDismissed(false);
              setProfileDialogOpen(true);
            }}
            sx={{
              color: '#CDDC39',
              borderColor: 'rgba(124,179,66,0.4)',
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': {
                borderColor: 'rgba(124,179,66,0.7)',
                bgcolor: 'rgba(124,179,66,0.15)'
              }
            }}
          >
            Edit Profile
          </Button>
        </Stack>

        {/* Tabs for Groups and Direct Messages */}
        <Card sx={{
          bgcolor: 'rgba(255,255,255,0.08)',
          color: '#CDDC39',
          boxShadow: '0 12px 30px rgba(0,0,0,0.4)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: 3,
          border: '1px solid rgba(124,179,66,0.3)'
        }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{
              borderBottom: '1px solid rgba(124,179,66,0.3)',
              '& .MuiTab-root': {
                color: '#9CCC65',
                '&.Mui-selected': {
                  color: '#CDDC39'
                }
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#CDDC39'
              }
            }}
          >
            <Tab icon={<GroupsIcon />} label="Groups" iconPosition="start" />
            <Tab
              icon={
                <Badge
                  badgeContent={directChats.reduce((sum, chat) => sum + (chat.unread_count || 0), 0)}
                  color="error"
                  sx={{
                    '& .MuiBadge-badge': {
                      bgcolor: '#FF5252',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '0.65rem',
                      minWidth: '18px',
                      height: '18px'
                    }
                  }}
                >
                  <ChatIcon />
                </Badge>
              }
              label="Direct Messages"
              iconPosition="start"
            />
          </Tabs>

          <CardContent sx={{ p: 2 }}>
            {/* Groups Tab */}
            {activeTab === 0 && (
              <Stack spacing={1.5}>
                <Typography variant="caption" sx={{ mb: 0.5, color: '#9CCC65', fontSize: '0.75rem' }}>
                  {userId ? 'Tap a group to open the chat.' : 'Sign in to join groups.'}
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
                  <Typography variant="body2" sx={{ color: '#9CCC65' }}>
                    No groups yet.
                  </Typography>
                ) : (
                  <Stack spacing={1.5}>
                    {sortedGroups.map(renderGroupButton)}
                  </Stack>
                )}
              </Stack>
            )}

            {/* Direct Messages Tab */}
            {activeTab === 1 && (
              <Stack spacing={1.5}>
                <Typography variant="caption" sx={{ mb: 0.5, color: '#9CCC65', fontSize: '0.75rem' }}>
                  {userId ? 'Start a private conversation with any user.' : 'Sign in to send direct messages.'}
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
                  <>
                    <TextField
                      size="small"
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      placeholder="Search by name"
                      variant="outlined"
                      fullWidth
                      sx={{
                        '& .MuiInputBase-root': {
                          bgcolor: 'rgba(255,255,255,0.05)',
                          borderRadius: 2,
                          border: '1px solid rgba(124,179,66,0.3)',
                          color: '#CDDC39'
                        },
                        mb: 2
                      }}
                    />

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }} sx={{ mb: 1 }}>
                      <Typography variant="subtitle2" sx={{ color: '#CDDC39', fontWeight: 700 }}>
                        Direct Messages
                      </Typography>
                      <ToggleButtonGroup
                        color="success"
                        exclusive
                        value={dmFilter}
                        onChange={(_e, next) => next && setDmFilter(next)}
                        size="small"
                        sx={{
                          borderRadius: 999,
                          '& .MuiToggleButton-root': {
                            color: '#9CCC65',
                            borderColor: 'rgba(124,179,66,0.3)',
                            textTransform: 'none',
                            fontSize: '0.8rem'
                          },
                          '& .Mui-selected': {
                            color: '#0c220f',
                            backgroundColor: 'rgba(124,179,66,0.7) !important'
                          }
                        }}
                      >
                        <ToggleButton value="recent">Recent</ToggleButton>
                        <ToggleButton value="all">All Users</ToggleButton>
                      </ToggleButtonGroup>
                      <Button
                        size="small"
                        onClick={loadAllUsers}
                        disabled={loadingUsers}
                        variant="outlined"
                        sx={{
                          color: '#CDDC39',
                          borderColor: 'rgba(124,179,66,0.4)',
                          '&:hover': {
                            borderColor: 'rgba(124,179,66,0.6)',
                            bgcolor: 'rgba(124,179,66,0.1)'
                          }
                        }}
                      >
                        {loadingUsers ? 'Loading...' : 'Refresh'}
                      </Button>
                    </Stack>

                    {/* Error Message */}
                    {usersError && (
                      <Typography
                        variant="body2"
                        sx={{
                          color: '#ff8a80',
                          fontWeight: 500,
                          mb: 1
                        }}
                      >
                        {usersError}
                      </Typography>
                    )}

                    {/* Loading State */}
                    {loadingUsers && (
                      <Typography variant="body2" sx={{ color: '#9CCC65' }}>
                        Loading users...
                      </Typography>
                    )}

                    {/* Recent Chats Section */}
                    {dmFilter === 'recent' && filteredDirectChats.length > 0 && (
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" sx={{ color: '#CDDC39', fontWeight: 700, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                          💬 Recent Chats
                        </Typography>
                        <Stack spacing={1}>
                          {filteredDirectChats.map(chat => (
                            <Button
                              key={chat.user.user_id}
                              variant="outlined"
                              onClick={() => startDirectChat(chat.user)}
                              fullWidth
                              sx={{
                                justifyContent: 'flex-start',
                                textAlign: 'left',
                                p: 1.5,
                                borderRadius: 2,
                                borderColor: 'rgba(124,179,66,0.6)',
                                bgcolor: 'rgba(124,179,66,0.15)',
                                backdropFilter: 'blur(10px)',
                                WebkitBackdropFilter: 'blur(10px)',
                                color: '#CDDC39',
                                '&:hover': {
                                  bgcolor: 'rgba(124,179,66,0.25)',
                                  borderColor: 'rgba(124,179,66,0.8)'
                                }
                              }}
                            >
                              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ width: '100%' }}>
                                <Badge
                                  badgeContent={chat.unread_count || 0}
                                  color="error"
                                  sx={{
                                    '& .MuiBadge-badge': {
                                      bgcolor: '#FF5252',
                                      color: '#fff',
                                      fontWeight: 700
                                    }
                                  }}
                                >
                                  <Avatar sx={{ bgcolor: 'rgba(124,179,66,0.5)', color: '#0c220f' }}>
                                    {(chat.user.username || 'U').slice(0, 2).toUpperCase()}
                                  </Avatar>
                                </Badge>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#CDDC39' }}>
                                {chat.user.display_name || chat.user.username || 'User'}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      color: '#9CCC65',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                      display: 'block'
                                    }}
                                  >
                                    {chat.last_message?.content || 'No messages yet'}
                                  </Typography>
                                </Box>
                              </Stack>
                            </Button>
                          ))}
                        </Stack>
                      </Box>
                    )}

                    {dmFilter === 'recent' && !loadingUsers && !usersError && filteredDirectChats.length === 0 && (
                      <Typography variant="body2" sx={{ color: '#9CCC65' }}>
                        No recent chats yet. Switch to “All Users” to start a new conversation.
                      </Typography>
                    )}

                    {/* All Users Section */}
                    {dmFilter === 'all' && !loadingUsers && !usersError && filteredUsers.length === 0 && (
                      <Typography variant="body2" sx={{ color: '#9CCC65' }}>
                        No other users found. Click Refresh to try again.
                      </Typography>
                    )}

                    {dmFilter === 'all' && !loadingUsers && !usersError && filteredUsers.length > 0 && (
                      <Box>
                        <Typography variant="subtitle2" sx={{ color: '#9CCC65', fontWeight: 700, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                          👥 All Users
                        </Typography>
                        <Stack spacing={1}>
                          {filteredUsers.map(user => (
                            <Button
                              key={user.user_id}
                              variant="outlined"
                              onClick={() => startDirectChat(user)}
                              fullWidth
                              sx={{
                                justifyContent: 'flex-start',
                                textAlign: 'left',
                                p: 1.5,
                                borderRadius: 2,
                                borderColor: 'rgba(124,179,66,0.4)',
                                bgcolor: 'rgba(255,255,255,0.05)',
                                backdropFilter: 'blur(10px)',
                                WebkitBackdropFilter: 'blur(10px)',
                                color: '#CDDC39',
                                '&:hover': {
                                  bgcolor: 'rgba(124,179,66,0.2)',
                                  borderColor: 'rgba(124,179,66,0.6)'
                                }
                              }}
                            >
                              <Stack direction="row" spacing={1.5} alignItems="center">
                                <Avatar sx={{ bgcolor: 'rgba(124,179,66,0.35)', color: '#0c220f' }}>
                                  {(user.display_name || user.username || 'U').slice(0, 2).toUpperCase()}
                                </Avatar>
                                <Box>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#CDDC39' }}>
                                    {user.display_name || user.username || 'User'}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: '#9CCC65' }}>
                                    Click to chat
                                  </Typography>
                                </Box>
                              </Stack>
                            </Button>
                          ))}
                        </Stack>
                      </Box>
                    )}
                  </>
                )}
              </Stack>
            )}
          </CardContent>
        </Card>

      {/* Group Chat Dialog */}
      <Dialog
        open={groupDialogOpen}
        onClose={closeGroupDialog}
        maxWidth="md"
        fullWidth
        fullScreen
        PaperProps={{
          sx: {
            background: 'rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(30px)',
            WebkitBackdropFilter: 'blur(30px)',
            m: 0,
            maxHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid rgba(124,179,66,0.3)'
          }
        }}
      >
        <DialogTitle sx={{
          borderBottom: '2px solid rgba(124,179,66,0.4)',
          background: 'rgba(124,179,66,0.1)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: { xs: 1.5, md: 2.5 },
          pt: { xs: 'calc(env(safe-area-inset-top, 0px) + 16px)', md: 3 },
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          gap: 2
        }}>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
            <Button
              startIcon={<ArrowBackIosNewIcon fontSize="small" />}
              onClick={closeGroupDialog}
              sx={{
                color: '#CDDC39',
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': { bgcolor: 'rgba(124,179,66,0.2)' }
              }}
            >
              Back
            </Button>
            <Typography
              variant="h6"
              noWrap
              sx={{ fontWeight: 700, color: '#CDDC39', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}
            >
              {selectedGroup?.name}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1}>
            {isMember ? (
              <Button
                size="small"
                variant="outlined"
                color="error"
                onClick={leaveGroup}
                sx={{
                  borderColor: 'rgba(244,67,54,0.6)',
                  color: '#ff6b6b',
                  '&:hover': {
                    borderColor: '#ff6b6b',
                    bgcolor: 'rgba(244,67,54,0.1)'
                  }
                }}
              >
                Leave
              </Button>
            ) : (
              <Button
                size="small"
                variant="contained"
                onClick={() => joinGroup()}
                sx={{
                  bgcolor: 'rgba(124,179,66,0.9)',
                  color: '#fff',
                  '&:hover': {
                    bgcolor: 'rgba(156,204,101,1)'
                  }
                }}
              >
                Join
              </Button>
            )}
            <Button
              size="small"
              onClick={closeGroupDialog}
              sx={{
                color: '#CDDC39',
                '&:hover': {
                  bgcolor: 'rgba(124,179,66,0.2)'
                }
              }}
            >
              Close
            </Button>
          </Stack>
        </DialogTitle>

        <DialogContent sx={{
          flex: 1,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          p: 0,
          overflow: 'hidden'
        }}>
          {/* User List Sidebar - Facebook Style */}
          <Box sx={{
            width: { xs: '100%', md: '280px' },
            maxHeight: { xs: 220, md: 'unset' },
            borderRight: { xs: 'none', md: '2px solid rgba(124,179,66,0.4)' },
            borderBottom: { xs: '2px solid rgba(124,179,66,0.4)', md: 'none' },
            background: 'rgba(0,0,0,0.3)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <Box sx={{
              p: 2,
              borderBottom: '1px solid rgba(124,179,66,0.3)',
              bgcolor: 'rgba(124,179,66,0.08)'
            }}>
              <Typography variant="subtitle2" sx={{ color: '#CDDC39', fontWeight: 700 }}>
                Members ({members.length})
              </Typography>
              <Typography variant="caption" sx={{ color: '#9CCC65', fontSize: '0.7rem' }}>
                Click to send direct message
              </Typography>
            </Box>

            {/* Scrollable User List */}
            <Box sx={{
              flex: 1,
              overflow: 'auto',
              p: 1
            }}>
              <Stack spacing={0.5}>
                {members.map((m, idx) => {
                  const memberDisplayName = m.users?.display_name
                    || m.profile?.display_name
                    || m.users?.username
                    || m.users?.email?.split('@')[0]
                    || `Member ${String(m.user_id || '').slice(0, 8)}`;
                  const isCurrentUser = m.user_id === userId;

                  return (
                    <Button
                      key={idx}
                      onClick={() => {
                        if (!isCurrentUser) {
                          // Start DM with this user
                          const chatUser = {
                            user_id: m.user_id,
                            username: memberDisplayName,
                            email: m.users?.email
                          };
                          startDirectChat(chatUser);
                          setGroupDialogOpen(false); // Close group chat
                        }
                      }}
                      disabled={isCurrentUser}
                      sx={{
                        justifyContent: 'flex-start',
                        textAlign: 'left',
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: isCurrentUser ? 'rgba(124,179,66,0.15)' : 'rgba(255,255,255,0.03)',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                        border: '1px solid rgba(124,179,66,0.2)',
                        color: isCurrentUser ? '#7CB342' : '#CDDC39',
                        '&:hover': {
                          bgcolor: isCurrentUser ? 'rgba(124,179,66,0.15)' : 'rgba(124,179,66,0.2)',
                          borderColor: 'rgba(124,179,66,0.5)'
                        },
                        cursor: isCurrentUser ? 'default' : 'pointer'
                      }}
                    >
                      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ width: '100%' }}>
                        <Avatar sx={{
                          bgcolor: isCurrentUser ? 'rgba(124,179,66,0.5)' : 'rgba(124,179,66,0.35)',
                          color: '#0c220f',
                          width: 36,
                          height: 36,
                          fontSize: '0.9rem',
                          fontWeight: 700
                        }}>
                          {memberDisplayName.slice(0, 2).toUpperCase()}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 600,
                              color: isCurrentUser ? '#7CB342' : '#CDDC39',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {memberDisplayName} {isCurrentUser && '(You)'}
                          </Typography>
                          {!isCurrentUser && (
                            <Typography variant="caption" sx={{ color: '#9CCC65', fontSize: '0.7rem' }}>
                              Click to message
                            </Typography>
                          )}
                        </Box>
                      </Stack>
                    </Button>
                  );
                })}
              </Stack>
            </Box>
          </Box>

          {/* Main Chat Area */}
          <Stack spacing={1.5} sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, p: 2 }}>
            {!guidelinesAccepted && (
              <Alert
                severity="warning"
                icon={false}
                sx={{
                  background: 'rgba(255,193,7,0.25)',
                  color: '#CDDC39',
                  border: '1px solid rgba(255,193,7,0.5)',
                  flexShrink: 0
                }}
              >
                By participating, you agree to our{' '}
                <MuiLink
                  component="button"
                  onClick={() => onNavigate && onNavigate('guidelines')}
                  sx={{ fontWeight: 700, color: '#fff', textDecoration: 'underline' }}
                >
                  Community Guidelines
                </MuiLink>.
              </Alert>
            )}

            <Stack direction="row" spacing={2} sx={{ flexShrink: 0, flexWrap: 'wrap', alignItems: 'center' }}>
              <Typography variant="caption" sx={{ color: '#7CB342', fontWeight: 700 }}>
                📂 Group: {selectedGroup?.name || 'Unknown'}
              </Typography>
              <Typography variant="caption" sx={{ color: '#7CB342', fontWeight: 700 }}>
                • {messages.length} message{messages.length !== 1 ? 's' : ''}
                {lastRefresh && ` • Updated ${new Date(lastRefresh).toLocaleTimeString()}`}
              </Typography>
            </Stack>

            {/* Pinned Messages Bar */}
            {pinnedMessages.length > 0 && (
              <Box
                sx={{
                  mb: 2,
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: 'rgba(205, 220, 57, 0.15)',
                  border: '2px solid rgba(205, 220, 57, 0.4)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{
                    color: '#CDDC39',
                    fontWeight: 700,
                    mb: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                  }}
                >
                  <PushPinIcon fontSize="small" />
                  Pinned Messages
                </Typography>
                <Stack spacing={1}>
                  {pinnedMessages.slice(0, 3).map((pm) => (
                    <Box
                      key={pm.id}
                      sx={{
                        p: 1,
                        borderRadius: 1,
                        bgcolor: 'rgba(0, 0, 0, 0.2)',
                        border: '1px solid rgba(205, 220, 57, 0.2)',
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          color: '#F1F8E9',
                          fontSize: '0.875rem',
                          mb: 0.5,
                        }}
                      >
                        {pm.content}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: '#9CCC65', fontSize: '0.75rem' }}
                      >
                        {pm.users?.display_name || pm.users?.username || 'Member'} • {new Date(pm.created_at).toLocaleDateString()}
                      </Typography>
                    </Box>
                  ))}
                  {pinnedMessages.length > 3 && (
                    <Typography
                      variant="caption"
                      sx={{ color: '#9CCC65', fontSize: '0.75rem', textAlign: 'center', mt: 0.5 }}
                    >
                      + {pinnedMessages.length - 3} more pinned message{pinnedMessages.length - 3 > 1 ? 's' : ''}
                    </Typography>
                  )}
                </Stack>
              </Box>
            )}

            {/* Message Limit Notice */}
            <Alert
              severity="info"
              sx={{
                flexShrink: 0,
                bgcolor: 'rgba(124,179,66,0.08)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                color: '#CDDC39',
                border: '1px solid rgba(124,179,66,0.3)',
                '& .MuiAlert-icon': {
                  color: '#CDDC39'
                }
              }}
            >
              <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
                💬 Only the most recent 1,000 messages are shown. Older messages are automatically archived.
              </Typography>
            </Alert>

            {/* Messages - Scrollable */}
            <Box sx={{
              flex: 1,
              overflow: 'auto',
              minHeight: 0,
              border: '2px solid rgba(124,179,66,0.4)',
              borderRadius: 2,
              p: 2,
              background: 'rgba(0,0,0,0.2)',
              backdropFilter: 'blur(15px)',
              WebkitBackdropFilter: 'blur(15px)',
              boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.3)'
            }}>
              <List sx={{ p: 0 }}>
                {messages.length === 0 ? (
                  <ListItem>
                    <ListItemText
                      secondary={
                        <Typography variant="body2" sx={{ color: '#9CCC65' }}>
                          Be the first to say hello! Share what brings you here or ask a quick question to get the conversation rolling.
                        </Typography>
                      }
                    />
                  </ListItem>
                ) : (
                  // Filter out pinned messages from regular list (they're shown in pinned bar)
                  messages.filter(m => !m.pinned_at).map((m) => (
                    <ListItem
                      key={m.id}
                      alignItems="flex-start"
                      sx={{
                        alignItems: 'flex-start',
                        bgcolor: isAdminMessage(m) ? 'rgba(124,179,66,0.15)' : 'rgba(255,255,255,0.03)',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                        borderLeft: isAdminMessage(m) ? '4px solid rgba(205,220,57,0.9)' : '4px solid rgba(124,179,66,0.3)',
                        mb: 1.5,
                        borderRadius: 2,
                        pr: 6,
                        border: '1px solid rgba(124,179,66,0.2)',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                      }}
                      secondaryAction={
                        <Stack direction="row" spacing={0.5}>
                          {canPin && (
                            <Tooltip title={m.pinned_at ? 'Unpin message' : 'Pin message'}>
                              <IconButton
                                edge="end"
                                size="small"
                                onClick={() => m.pinned_at ? handleUnpin(m) : handlePin(m)}
                                sx={{
                                  color: m.pinned_at ? '#CDDC39' : '#9CCC65',
                                  opacity: m.pinned_at ? 1 : 0.7,
                                }}
                              >
                                <PushPinIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Report this message">
                            <IconButton
                              edge="end"
                              size="small"
                              onClick={() => {
                                setReportingMessage(m);
                                setReportDialogOpen(true);
                              }}
                              sx={{ color: '#9CCC65' }}
                            >
                              <FlagIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      }
                    >
                      {renderMessageAuthor(m)}
                      <ListItemText
                        primary={
                          <Typography variant="body2" sx={{ color: '#CDDC39', fontWeight: 500 }}>
                            {m.content}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="caption" sx={{ color: '#9CCC65' }}>
                            {(m.users?.display_name
                              || m.profile?.display_name
                              || m.users?.username
                              || (m.users?.email ? m.users.email.split('@')[0] : `Member ${String(m.user_id || '').slice(0, 8)}`))
                            } • {new Date(m.created_at).toLocaleString()}
                            {m.optimistic ? ' • sending…' : ''}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))
                )}
              </List>
            </Box>

            {/* Message Composer - Fixed at bottom */}
            {isMember ? (
              <Box
                data-message-composer
                sx={{
                  flexShrink: 0,
                  p: '8px 12px',
                  paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)',
                  borderTop: '1px solid rgba(255,255,255,0.05)',
                  backgroundColor: 'rgba(0,0,0,0.85)',
                  backdropFilter: 'blur(10px)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.75,
                }}
              >
                {/* Reply preview */}
                {replyTo && (
                  <Box
                    sx={{
                      fontSize: '0.6875rem',
                      p: '4px 8px',
                      borderRadius: 1,
                      backgroundColor: 'rgba(255,255,255,0.03)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      border: '1px solid rgba(124,179,66,0.2)',
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        color: '#9CCC65',
                        fontSize: '0.6875rem',
                        flex: 1,
                      }}
                    >
                      Replying to <strong>{replyTo.users?.display_name || replyTo.users?.username || 'someone'}</strong>:{' '}
                      <span style={{ opacity: 0.8 }}>
                        {replyTo.content?.slice(0, 60) || ''}
                        {replyTo.content?.length > 60 ? '…' : ''}
                      </span>
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => setReplyTo(null)}
                      sx={{
                        color: '#9CCC65',
                        p: 0.25,
                        minWidth: 'auto',
                        width: 20,
                        height: 20,
                      }}
                    >
                      ×
                    </IconButton>
                  </Box>
                )}

                {/* Input row */}
                <Stack direction="row" spacing={1} alignItems="flex-end">
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Type a message…"
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value);
                      setSendError(''); // Clear error when user types
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    multiline
                    maxRows={4}
                    disabled={sending}
                    error={!!sendError}
                    sx={{
                      '& .MuiInputBase-root': {
                        bgcolor: 'rgba(5,12,8,0.95)',
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                        border: sendError 
                          ? '1px solid rgba(239,68,68,0.6)' 
                          : '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '999px',
                        '&:hover': {
                          border: sendError
                            ? '1px solid rgba(239,68,68,0.8)'
                            : '1px solid rgba(124,179,66,0.4)'
                        },
                        '&.Mui-focused': {
                          border: sendError
                            ? '1px solid rgba(239,68,68,0.8)'
                            : '1px solid rgba(205,220,57,0.8)',
                          boxShadow: sendError
                            ? '0 0 8px rgba(239,68,68,0.3)'
                            : '0 0 8px rgba(124,179,66,0.4)'
                        },
                        '&.Mui-disabled': {
                          opacity: 0.6,
                        }
                      },
                      '& .MuiInputBase-input': {
                        color: '#f5fff5',
                        fontSize: '0.875rem',
                        padding: '8px 12px',
                        maxHeight: '100px',
                        overflowY: 'auto',
                      },
                      '& .MuiInputBase-input::placeholder': {
                        color: '#9CCC65',
                        opacity: 0.7
                      }
                    }}
                  />
                  <Button
                    variant="contained"
                    onClick={sendMessage}
                    disabled={sending || !input.trim()}
                    sx={{
                      minWidth: '80px',
                      borderRadius: '999px',
                      bgcolor: input.trim()
                        ? 'linear-gradient(135deg, #7CB342, #9CCC65)'
                        : 'rgba(255,255,255,0.1)',
                      color: input.trim() ? '#04140a' : '#888',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      boxShadow: input.trim()
                        ? '0 4px 12px rgba(124,179,66,0.4)'
                        : 'none',
                      '&:hover': {
                        bgcolor: input.trim()
                          ? 'linear-gradient(135deg, #8BC34A, #AED581)'
                          : 'rgba(255,255,255,0.1)',
                        boxShadow: input.trim()
                          ? '0 6px 16px rgba(124,179,66,0.6)'
                          : 'none'
                      },
                      '&:disabled': {
                        opacity: 0.5,
                      }
                    }}
                  >
                    {sending ? 'Sending…' : 'Send'}
                  </Button>
                </Stack>

                {/* Error message */}
                {sendError && (
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: '0.6875rem',
                      color: '#ff9b9b',
                      ml: 1,
                      mt: -0.5,
                    }}
                  >
                    {sendError}
                  </Typography>
                )}
              </Box>
            ) : (
              <Typography variant="body2" sx={{ textAlign: 'center', flexShrink: 0, color: '#9CCC65', p: 2 }}>
                Join this group to send messages.
              </Typography>
            )}
          </Stack>
        </DialogContent>
      </Dialog>

      {/* Direct Chat Dialog */}
      <Dialog
        open={chatDialogOpen}
        onClose={() => setChatDialogOpen(false)}
        maxWidth="md"
        fullWidth
        fullScreen
        PaperProps={{
          sx: {
            background: 'rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(30px)',
            WebkitBackdropFilter: 'blur(30px)',
            m: 0,
            maxHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid rgba(124,179,66,0.3)'
          }
        }}
      >
        <DialogTitle sx={{
          borderBottom: '2px solid rgba(124,179,66,0.4)',
          background: 'rgba(124,179,66,0.1)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 2,
          pt: '120px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
        }}>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
            <Button
              startIcon={<ArrowBackIosNewIcon fontSize="small" />}
              onClick={() => setChatDialogOpen(false)}
              sx={{
                color: '#CDDC39',
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': { bgcolor: 'rgba(124,179,66,0.2)' }
              }}
            >
              Back
            </Button>
            <Avatar sx={{ bgcolor: 'rgba(124,179,66,0.35)', color: '#0c220f' }}>
              {(selectedChat?.username || selectedChat?.display_name || 'U').slice(0, 2).toUpperCase()}
            </Avatar>
            <Typography variant="h6" noWrap sx={{ fontWeight: 700, color: '#CDDC39', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
              {selectedChat?.display_name || selectedChat?.username || 'User'}
            </Typography>
          </Stack>
          <Button
            size="small"
            onClick={() => setChatDialogOpen(false)}
            sx={{
              color: '#CDDC39',
              '&:hover': {
                bgcolor: 'rgba(124,179,66,0.2)'
              }
            }}
          >
            Close
          </Button>
        </DialogTitle>

        <DialogContent sx={{
          p: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: 'rgba(0,0,0,0.2)'
        }}>
          <Stack spacing={2} sx={{
            p: 2,
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0
          }}>
            {/* Message Limit Notice */}
            <Alert
              severity="info"
              sx={{
                flexShrink: 0,
                bgcolor: 'rgba(124,179,66,0.08)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                color: '#CDDC39',
                border: '1px solid rgba(124,179,66,0.3)',
                '& .MuiAlert-icon': {
                  color: '#CDDC39'
                }
              }}
            >
              <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
                💬 Only the most recent 500 messages are shown. Older messages are automatically archived.
              </Typography>
            </Alert>

            {/* Messages - Scrollable */}
            <Box sx={{
              flex: 1,
              overflow: 'auto',
              minHeight: 0,
              border: '2px solid rgba(124,179,66,0.4)',
              borderRadius: 2,
              p: 2,
              background: 'rgba(0,0,0,0.2)',
              backdropFilter: 'blur(15px)',
              WebkitBackdropFilter: 'blur(15px)',
              boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.3)'
            }}>
              <List sx={{ p: 0 }}>
                {directMessages.length === 0 ? (
                  <ListItem>
                    <ListItemText
                      secondary={
                        <Typography variant="body2" sx={{ color: '#9CCC65' }}>
                          Start a conversation! Say hello or ask a question.
                        </Typography>
                      }
                    />
                  </ListItem>
                ) : (
                  directMessages.map((m, idx) => {
                    const isCurrentUser = m.sender_id === userId;
                    const senderName = isCurrentUser
                      ? 'You'
                      : (m.sender?.display_name
                        || m.sender?.username
                        || selectedChat?.display_name
                        || selectedChat?.username
                        || 'User');
                    const initials = senderName.slice(0, 2).toUpperCase();

                    return (
                      <ListItem
                        key={m.id || idx}
                        sx={{
                          flexDirection: isCurrentUser ? 'row-reverse' : 'row',
                          alignItems: 'flex-start',
                          gap: 1,
                          mb: 1.5
                        }}
                      >
                        <ListItemAvatar sx={{ minWidth: 'auto' }}>
                          <Avatar sx={{
                            bgcolor: isCurrentUser ? 'rgba(124,179,66,0.5)' : 'rgba(124,179,66,0.35)',
                            color: '#0c220f',
                            width: 32,
                            height: 32,
                            fontSize: '0.875rem'
                          }}>
                            {initials}
                          </Avatar>
                        </ListItemAvatar>
                        <Box sx={{
                          maxWidth: '70%',
                          bgcolor: isCurrentUser ? 'rgba(124,179,66,0.2)' : 'rgba(255,255,255,0.05)',
                          backdropFilter: 'blur(10px)',
                          WebkitBackdropFilter: 'blur(10px)',
                          border: `1px solid ${isCurrentUser ? 'rgba(124,179,66,0.4)' : 'rgba(124,179,66,0.3)'}`,
                          borderRadius: 2,
                          p: 1.5,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                        }}>
                          <Typography variant="body2" sx={{ color: '#CDDC39', wordBreak: 'break-word' }}>
                            {m.content}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#9CCC65', display: 'block', mt: 0.5 }}>
                            {senderName} • {new Date(m.created_at).toLocaleString()}
                            {m.optimistic ? ' • sending…' : ''}
                          </Typography>
                        </Box>
                      </ListItem>
                    );
                  })
                )}
              </List>
            </Box>

            {/* Message Input - Fixed at bottom */}
            <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Type a message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendDirectMessage()}
                multiline
                maxRows={3}
                sx={{
                  '& .MuiInputBase-root': {
                    bgcolor: 'rgba(255,255,255,0.05)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    border: '1px solid rgba(124,179,66,0.4)',
                    borderRadius: 2,
                    '&:hover': {
                      border: '1px solid rgba(124,179,66,0.6)'
                    },
                    '&.Mui-focused': {
                      border: '1px solid rgba(205,220,57,0.8)',
                      boxShadow: '0 0 8px rgba(124,179,66,0.4)'
                    }
                  },
                  '& .MuiInputBase-input': { color: '#CDDC39' },
                  '& .MuiInputBase-input::placeholder': { color: '#9CCC65', opacity: 0.7 }
                }}
              />
              <Button
                variant="contained"
                onClick={sendDirectMessage}
                sx={{
                  minWidth: '80px',
                  bgcolor: 'rgba(124,179,66,0.9)',
                  color: '#fff',
                  fontWeight: 700,
                  boxShadow: '0 4px 12px rgba(124,179,66,0.4)',
                  '&:hover': {
                    bgcolor: 'rgba(156,204,101,1)',
                    boxShadow: '0 6px 16px rgba(124,179,66,0.6)'
                  }
                }}
              >
                Send
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>

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
