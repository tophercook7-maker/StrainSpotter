// ===============================================
// FILE: frontend/src/components/dm/DMThreadPage.jsx
// Full DM thread view (header + messages + input)
// ===============================================

import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, IconButton, Avatar, useMediaQuery } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useTheme } from '@mui/material/styles';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ChatInput from '../groups/ChatInput';
import DMMessages from './DMMessages';
import { useInfiniteMessages } from '../../hooks/useInfiniteMessages';
import { useTypingIndicator } from '../../hooks/useTypingIndicator';
import { sendDMMessage } from '../../api/dmApi';

export default function DMThreadPage() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useAuth();
  const currentUserId = user?.id;

  const [replyTo, setReplyTo] = useState(null);
  const [inputValue, setInputValue] = useState('');

  const scrollContainerRef = useRef(null);
  const bottomRef = useRef(null);

  const {
    messages,
    isLoadingInitial,
    isLoadingMore,
    hasMore,
    loadMore,
    onNewMessage,
  } = useInfiniteMessages({
    mode: 'dm',
    id: conversationId,
    scrollContainerRef,
    bottomRef,
  });

  const {
    typingUsers,
    notifyTyping,
  } = useTypingIndicator({
    scope: 'dm',
    id: conversationId,
    currentUserId,
  });

  const conversationFromNav = location.state?.conversation;
  const other = conversationFromNav?.otherUser || {};

  const headerName =
    other.display_name ||
    other.name ||
    other.fullName ||
    other.username ||
    other.email ||
    'Direct Message';

  // Auto-scroll to bottom on initial load
  useEffect(() => {
    if (!isLoadingInitial && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'auto' });
    }
  }, [isLoadingInitial]);

  const handleSend = async (text, attachments) => {
    const messageText = text || inputValue.trim();
    if (!messageText && (!attachments || !attachments.length)) return;

    try {
      const response = await sendDMMessage(conversationId, {
        text: messageText,
        attachments,
      });

      const newMsg = response.message || response;
      if (newMsg) {
        onNewMessage(newMsg);
        setInputValue('');
        setReplyTo(null);
        if (bottomRef.current) {
          setTimeout(() => {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }
      }
    } catch (err) {
      console.error('Failed to send DM message', err);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        overflow: 'hidden',
        backgroundColor: 'transparent',
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
          gap: 1.5,
          backgroundColor: 'transparent',
        }}
      >
        {isMobile && (
          <IconButton
            edge="start"
            onClick={() => navigate(-1)}
            sx={{ marginRight: 0.5, color: '#CDDC39' }}
          >
            <ArrowBackIcon />
          </IconButton>
        )}
        <Avatar src={other.avatar_url || other.avatarUrl} sx={{ bgcolor: 'rgba(124,179,66,0.3)' }}>
          {headerName ? headerName[0]?.toUpperCase() : '?'}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" noWrap sx={{ color: '#F1F8E9', fontWeight: 600 }}>
            {headerName}
          </Typography>
          {typingUsers.length > 0 ? (
            <Typography
              variant="caption"
              sx={{ opacity: 0.8, color: '#9CCC65' }}
              noWrap
            >
              {typingUsers.length === 1
                ? `${typingUsers[0].displayName || 'Someone'} is typing…`
                : 'Several people are typing…'}
            </Typography>
          ) : (
            <Typography
              variant="caption"
              sx={{ opacity: 0.6, color: 'rgba(255,255,255,0.6)' }}
              noWrap
            >
              Direct conversation
            </Typography>
          )}
        </Box>
      </Box>

      {/* Messages + load more */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {hasMore && (
          <Box
            sx={{
              flexShrink: 0,
              paddingX: 2,
              paddingY: 1,
              textAlign: 'center',
            }}
          >
            <Typography
              variant="body2"
              sx={{
                cursor: 'pointer',
                opacity: isLoadingMore ? 0.6 : 0.9,
                color: '#9CCC65',
                '&:hover': {
                  opacity: 1,
                },
              }}
              onClick={() => !isLoadingMore && loadMore()}
            >
              {isLoadingMore ? 'Loading earlier messages…' : 'Load earlier messages'}
            </Typography>
          </Box>
        )}

        {isLoadingInitial ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
              Loading messages...
            </Typography>
          </Box>
        ) : (
          <>
            <DMMessages
              messages={messages}
              scrollContainerRef={scrollContainerRef}
            />
            <div ref={bottomRef} />
          </>
        )}
      </Box>

      {/* Input */}
      <Box
        sx={{
          borderTop: '1px solid rgba(255,255,255,0.08)',
          flexShrink: 0,
        }}
      >
        <ChatInput
          value={inputValue}
          onChange={setInputValue}
          onSend={handleSend}
          replyToMessage={replyTo}
          onCancelReply={() => setReplyTo(null)}
          notifyTyping={notifyTyping}
          scope="dm"
          channelId={conversationId}
          placeholder="Type a message…"
        />
      </Box>
    </Box>
  );
}

