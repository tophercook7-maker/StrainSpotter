// frontend/src/components/InboxList.jsx
// Component for displaying DM inbox conversations list

import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  Typography,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useInbox } from '../hooks/useInbox';

export function InboxList({ onSelectConversation }) {
  const { conversations, loading, error } = useInbox();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress sx={{ color: '#7cb342' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!conversations || conversations.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" sx={{ color: '#BDBDBD', textAlign: 'center' }}>
          No conversations yet.
        </Typography>
      </Box>
    );
  }

  return (
    <List sx={{ width: '100%', bgcolor: 'transparent' }}>
      {conversations.map((conv) => {
        const isBusiness = !!conv.business_b_id;
        const name = isBusiness
          ? conv.business?.name || 'Business'
          : 'Member chat';

        return (
          <ListItem
            key={conv.id}
            disablePadding
            sx={{
              mb: 1,
              borderRadius: 2,
              bgcolor: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(124, 179, 66, 0.2)',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.1)',
                borderColor: 'rgba(124, 179, 66, 0.4)',
              },
            }}
          >
            <ListItemButton
              onClick={() => onSelectConversation?.(conv)}
              sx={{
                flexDirection: 'column',
                alignItems: 'flex-start',
                py: 1.5,
                px: 2,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  width: '100%',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 0.5,
                }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 600,
                    color: '#E8F5E9',
                    fontSize: '0.95rem',
                  }}
                >
                  {name}
                </Typography>
                {conv.unread_count > 0 && (
                  <Chip
                    label={conv.unread_count}
                    size="small"
                    sx={{
                      bgcolor: '#7cb342',
                      color: '#fff',
                      fontWeight: 600,
                      minWidth: '24px',
                      height: '24px',
                      fontSize: '0.75rem',
                    }}
                  />
                )}
              </Box>
              <Typography
                variant="body2"
                sx={{
                  color: '#BDBDBD',
                  fontSize: '0.85rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  width: '100%',
                }}
              >
                {conv.last_message_text || 'No messages yet'}
              </Typography>
              {conv.last_message_at && (
                <Typography
                  variant="caption"
                  sx={{
                    color: '#757575',
                    fontSize: '0.7rem',
                    mt: 0.5,
                  }}
                >
                  {new Date(conv.last_message_at).toLocaleDateString()}
                </Typography>
              )}
            </ListItemButton>
          </ListItem>
        );
      })}
    </List>
  );
}

