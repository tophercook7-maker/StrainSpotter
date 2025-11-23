// ===============================================
// FILE: frontend/src/components/dm/DMConversationItem.jsx
// Single row in the DM inbox list
// ===============================================

import React from 'react';
import { Box, Typography, Avatar, Badge } from '@mui/material';
import { formatDistanceToNow } from 'date-fns';

function getInitials(name = '') {
  const parts = name.trim().split(/\s+/);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?';
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function DMConversationItem({ conversation, isActive, onClick, currentUserId }) {
  const other = conversation.otherUser || {};

  const name =
    other.display_name ||
    other.name ||
    other.fullName ||
    other.username ||
    other.email ||
    'Unknown user';

  const lastText =
    conversation.last_message_preview ||
    (conversation.last_message_sender === currentUserId
      ? 'You sent a message'
      : 'New conversation');

  const lastAt = conversation.last_message_at
    ? formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true })
    : null;

  const isUnread =
    conversation.last_message_sender &&
    conversation.last_message_sender !== currentUserId &&
    !conversation.last_message_read; // optional flag if backend sends it

  return (
    <Box
      onClick={onClick}
      sx={{
        cursor: 'pointer',
        paddingX: 1.5,
        paddingY: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        borderRadius: 2,
        backgroundColor: isActive ? 'rgba(255,255,255,0.10)' : 'transparent',
        '&:hover': {
          backgroundColor: 'rgba(255,255,255,0.08)',
        },
      }}
    >
      <Badge
        color="primary"
        variant="dot"
        invisible={!isUnread}
        overlap="circular"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Avatar src={other.avatar_url || other.avatarUrl}>
          {getInitials(name)}
        </Avatar>
      </Badge>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="subtitle2"
          noWrap
          sx={{ fontWeight: isUnread ? 700 : 500, color: '#F1F8E9' }}
        >
          {name}
        </Typography>
        <Typography
          variant="body2"
          noWrap
          sx={{ opacity: 0.8, fontWeight: isUnread ? 600 : 400, color: 'rgba(255,255,255,0.7)' }}
        >
          {lastText}
        </Typography>
      </Box>

      {lastAt && (
        <Typography
          variant="caption"
          sx={{ opacity: 0.6, marginLeft: 1, flexShrink: 0, color: 'rgba(255,255,255,0.6)' }}
        >
          {lastAt}
        </Typography>
      )}
    </Box>
  );
}

