// ===============================================
// FILE: frontend/src/components/dm/DMInbox.jsx
// DM conversation list (inbox)
// ===============================================

import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, IconButton } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { fetchDMConversations } from '../../api/dmApi';
import DMConversationItem from './DMConversationItem';

export default function DMInbox() {
  const { user } = useAuth();
  const currentUserId = user?.id;
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();
  const activeConversationId = location.pathname.startsWith('/dm/')
    ? location.pathname.split('/dm/')[1].split('/')[0]
    : null;

  async function loadConversations() {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchDMConversations();
      // Expecting an array; adjust if backend packs in { conversations: [...] }
      const list = Array.isArray(data) ? data : data.conversations || [];
      setConversations(list);
    } catch (err) {
      console.error('Failed to load DM inbox', err);
      setError(err.message || 'Failed to load DMs');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadConversations();
  }, []);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        backgroundColor: 'rgba(0,0,0,0.3)',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          paddingX: 2,
          paddingY: 1.5,
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          flexShrink: 0,
          gap: 1,
        }}
      >
        <ChatIcon sx={{ opacity: 0.8, color: '#CDDC39' }} />
        <Typography variant="subtitle1" sx={{ flex: 1, color: '#F1F8E9', fontWeight: 600 }}>
          Direct Messages
        </Typography>
        <IconButton size="small" onClick={loadConversations} sx={{ color: '#9CCC65' }}>
          <RefreshIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Body */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          paddingY: 1,
        }}
      >
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', paddingY: 4 }}>
            <CircularProgress size={24} sx={{ color: '#CDDC39' }} />
          </Box>
        )}

        {error && !loading && (
          <Typography
            variant="body2"
            sx={{ color: '#ff8a80', paddingX: 2, paddingY: 1 }}
          >
            {error}
          </Typography>
        )}

        {!loading && !conversations.length && !error && (
          <Typography
            variant="body2"
            sx={{ opacity: 0.7, paddingX: 2, paddingY: 1, color: 'rgba(255,255,255,0.6)' }}
          >
            No conversations yet. Start a chat from a profile or business card.
          </Typography>
        )}

        {conversations.map((c) => (
          <DMConversationItem
            key={c.id}
            conversation={c}
            currentUserId={currentUserId}
            isActive={c.id === activeConversationId}
            onClick={() => navigate(`/dm/${c.id}`, { state: { conversation: c } })}
          />
        ))}
      </Box>
    </Box>
  );
}

