// frontend/src/components/ConversationView.jsx
// Component for displaying and sending messages in a DM conversation

import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  CircularProgress,
  Paper,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { useConversationMessages } from '../hooks/useConversationMessages';
import { useAuth } from '../hooks/useAuth';

export function ConversationView({ conversation }) {
  const conversationId = conversation?.id || null;
  const { user } = useAuth();
  const currentUserId = user?.id || null;
  const { messages, loading, sending, sendMessage, error } = useConversationMessages(conversationId);
  const [draft, setDraft] = useState('');
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text) return;

    setDraft('');
    try {
      await sendMessage(text, null);
    } catch (err) {
      // Error is handled by the hook
      console.error('[ConversationView] send error', err);
    }
  };

  if (!conversationId) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <Typography variant="body2" sx={{ color: '#BDBDBD' }}>
          Select a conversation to start messaging
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        bgcolor: '#0a0a0a',
      }}
    >
      {/* Messages area */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress sx={{ color: '#7cb342' }} />
          </Box>
        )}

        {error && (
          <Box sx={{ p: 2 }}>
            <Typography variant="body2" sx={{ color: '#f44336' }}>
              {error}
            </Typography>
          </Box>
        )}

        {!loading && messages.length === 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <Typography variant="body2" sx={{ color: '#BDBDBD' }}>
              No messages yet. Start the conversation!
            </Typography>
          </Box>
        )}

        {messages.map((msg) => {
          const isMine = msg.sender_user_id === currentUserId;

          return (
            <Box
              key={msg.id}
              sx={{
                display: 'flex',
                justifyContent: isMine ? 'flex-end' : 'flex-start',
                mb: 1,
              }}
            >
              <Paper
                elevation={0}
                sx={{
                  maxWidth: '75%',
                  borderRadius: '16px',
                  px: 1.5,
                  py: 1,
                  bgcolor: isMine
                    ? 'rgba(124, 179, 66, 0.2)'
                    : 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${isMine ? 'rgba(124, 179, 66, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
                }}
              >
                {msg.body && (
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#E0E0E0',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {msg.body}
                  </Typography>
                )}
                {msg.image_url && (
                  <Box sx={{ mt: msg.body ? 1 : 0 }}>
                    <img
                      src={msg.image_url}
                      alt="Message attachment"
                      style={{
                        maxWidth: '100%',
                        borderRadius: '12px',
                        display: 'block',
                      }}
                    />
                  </Box>
                )}
                {msg.created_at && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#757575',
                      fontSize: '0.7rem',
                      display: 'block',
                      mt: 0.5,
                    }}
                  >
                    {new Date(msg.created_at).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </Typography>
                )}
              </Paper>
            </Box>
          );
        })}
        <div ref={messagesEndRef} />
      </Box>

      {/* Input area */}
      <Box
        sx={{
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          p: 1.5,
          display: 'flex',
          gap: 1,
          bgcolor: 'rgba(0, 0, 0, 0.3)',
        }}
      >
        <TextField
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Send a message…"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          disabled={sending || !conversationId}
          multiline
          maxRows={4}
          sx={{
            flex: 1,
            '& .MuiOutlinedInput-root': {
              color: '#fff',
              bgcolor: 'rgba(255, 255, 255, 0.05)',
              '& fieldset': {
                borderColor: 'rgba(255, 255, 255, 0.1)',
              },
              '&:hover fieldset': {
                borderColor: 'rgba(255, 255, 255, 0.2)',
              },
              '&.Mui-focused fieldset': {
                borderColor: 'rgba(124, 179, 66, 0.5)',
              },
            },
            '& .MuiInputBase-input': {
              color: '#fff',
            },
            '& .MuiInputBase-input::placeholder': {
              color: '#BDBDBD',
              opacity: 1,
            },
          }}
        />
        <IconButton
          onClick={handleSend}
          disabled={!draft.trim() || sending || !conversationId}
          sx={{
            bgcolor: '#7cb342',
            color: '#fff',
            '&:hover': {
              bgcolor: '#689F38',
            },
            '&:disabled': {
              bgcolor: 'rgba(124, 179, 66, 0.3)',
              color: 'rgba(255, 255, 255, 0.3)',
            },
          }}
        >
          {sending ? (
            <CircularProgress size={20} sx={{ color: '#fff' }} />
          ) : (
            <SendIcon />
          )}
        </IconButton>
      </Box>
    </Box>
  );
}

