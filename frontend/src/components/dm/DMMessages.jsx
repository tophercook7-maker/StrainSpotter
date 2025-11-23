// ===============================================
// FILE: frontend/src/components/dm/DMMessages.jsx
// Renders the message bubbles inside a DM thread
// ===============================================

import React, { useRef } from 'react';
import { Box, Typography } from '@mui/material';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';

function formatTime(ts) {
  try {
    return format(new Date(ts), 'p');
  } catch {
    return '';
  }
}

export default function DMMessages({
  messages,
  scrollContainerRef,
}) {
  const { user } = useAuth();
  const currentUserId = user?.id;

  // NOTE: For now, we are not wiring swipe-to-reply in DMs to keep it simpler.
  // If you want it, you can mirror the GroupMessages swipe logic here.

  return (
    <Box
      ref={scrollContainerRef}
      sx={{
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        paddingY: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 0.5,
      }}
    >
      {messages.map((message) => {
        const msg = message.raw || message;
        const isMine = msg.sender_id === currentUserId || msg.senderId === currentUserId;

        const senderName =
          msg.sender?.display_name ||
          msg.sender?.username ||
          msg.senderName ||
          msg.sender_name ||
          (isMine ? 'You' : 'Someone');

        const text = msg.text || msg.body || '';

        const attachments = Array.isArray(msg.attachments)
          ? msg.attachments
          : Array.isArray(msg.attachments?.images)
          ? msg.attachments.images
          : [];

        const createdAt = msg.created_at || msg.createdAt;

        return (
          <Box
            key={msg.id || message.id}
            sx={{
              display: 'flex',
              justifyContent: isMine ? 'flex-end' : 'flex-start',
              paddingX: 2,
            }}
          >
            <Box
              sx={{
                maxWidth: '80%',
                borderRadius: 3,
                paddingX: 1.5,
                paddingY: 1,
                backgroundColor: isMine
                  ? 'rgba(124, 179, 66, 0.3)'
                  : 'rgba(255, 255, 255, 0.07)',
                border: isMine
                  ? '1px solid rgba(124, 179, 66, 0.4)'
                  : '1px solid rgba(255,255,255,0.1)',
              }}
            >
              {!isMine && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 1,
                    marginBottom: 0.25,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{ fontWeight: 600, color: '#CDDC39' }}
                  >
                    {senderName}
                  </Typography>
                  {createdAt && (
                    <Typography
                      variant="caption"
                      sx={{ opacity: 0.7, color: 'rgba(255,255,255,0.6)' }}
                    >
                      {formatTime(createdAt)}
                    </Typography>
                  )}
                </Box>
              )}

              {text && (
                <Typography
                  variant="body2"
                  sx={{ whiteSpace: 'pre-wrap', color: '#F1F8E9' }}
                >
                  {text}
                </Typography>
              )}

              {attachments.length > 0 && (
                <Box sx={{ marginTop: text ? 0.75 : 0 }}>
                  {attachments.map((att, idx) =>
                    att.type === 'image' || att.url ? (
                      <Box
                        key={idx}
                        component="img"
                        src={att.url}
                        alt="attachment"
                        sx={{
                          display: 'block',
                          maxWidth: '100%',
                          borderRadius: 2,
                          marginTop: idx === 0 && !text ? 0 : 0.5,
                        }}
                      />
                    ) : null
                  )}
                </Box>
              )}

              {isMine && createdAt && (
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    textAlign: 'right',
                    opacity: 0.7,
                    marginTop: 0.25,
                    color: 'rgba(255,255,255,0.6)',
                  }}
                >
                  {formatTime(createdAt)}
                </Typography>
              )}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

