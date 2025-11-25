// frontend/src/components/groups/GroupMessages.jsx
// Discord/Telegram-style message bubbles with swipe-to-reply

import { useState, useRef } from 'react';
import { Box, Typography, Avatar, Stack, Button } from '@mui/material';
import { useAuth } from '../../hooks/useAuth';
import { useMediaQuery, useTheme } from '@mui/material';
import GroupHeader from './GroupHeader';
import ChatInput from './ChatInput';

function formatTime(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function getInitials(name) {
  if (!name) return '?';
  return name.slice(0, 2).toUpperCase();
}

export default function GroupMessages({
  messages,
  pinnedMessages,
  isLoadingInitial,
  isLoadingMore,
  hasMore,
  onLoadMore,
  scrollContainerRef,
  scrollToBottomRef,
  onScroll,
  currentUserId,
  onReply = null,
  group,
  onBack,
  onSend,
  typingUsers = [],
}) {
  const { user } = useAuth();
  const userId = currentUserId || user?.id;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Reply state
  const [replyTo, setReplyTo] = useState(null);
  const clearReply = () => setReplyTo(null);
  const handleReply = (message) => {
    if (onReply) {
      onReply(message);
    } else {
      setReplyTo(message);
    }
  };
  
  const handleSend = (text, attachments) => {
    if (onSend) {
      onSend(text, attachments, replyTo);
      clearReply();
    }
  };
  
  // Scroll anchor ref
  const scrollAnchorRef = useRef(null);
  
  // Swipe-to-reply state
  const touchStartXRef = useRef(0);
  const touchStartYRef = useRef(0);

  const loading = isLoadingInitial;
  
  // Show error state if messages failed to load (gracefully handle missing messages)
  if (!loading && (!messages || messages.length === 0)) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          overflow: "hidden",
          bgcolor: '#0a0f0a', // Match app background
        }}
      >
        {group && (
          <GroupHeader
            group={group}
            onBack={onBack}
            typingUsers={typingUsers}
            isMobile={isMobile}
          />
        )}
        <Box sx={{ 
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
          textAlign: 'center'
        }}>
          <Box>
            <Typography variant="body2" sx={{ color: "#9CCC65", mb: 1 }}>
              Couldn't load messages right now. You can still send a new one.
            </Typography>
            {onSend && (
              <Typography variant="caption" sx={{ color: "#7CB342" }}>
                Try sending a message to refresh the conversation.
              </Typography>
            )}
          </Box>
        </Box>
        {group && onSend && (
          <ChatInput
            value=""
            onChange={() => {}}
            onSend={handleSend}
            disabled={false}
            sending={false}
            placeholder="Type a message…"
            replyToMessage={replyTo}
            onCancelReply={clearReply}
            scope="group"
            channelId={group.id}
          />
        )}
      </Box>
    );
  }
  
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        bgcolor: '#0a0f0a', // Match app background
      }}
    >
      {group && (
        <GroupHeader
          group={group}
          onBack={onBack}
          typingUsers={typingUsers}
          isMobile={isMobile}
        />
      )}

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          paddingBottom: "16px",
        }}
        ref={scrollContainerRef}
        onScroll={onScroll}
      >
        {loading && (!messages || messages.length === 0) && (
          <Box sx={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            p: 2,
            color: "#9CCC65"
          }}>
            Loading messages…
          </Box>
        )}

        {!loading && (!messages || messages.length === 0) && (
          <Box sx={{ 
            p: 2, 
            color: "#9CCC65",
            textAlign: 'center',
            mt: 2
          }}>
            No messages yet. Be the first to say hi 👋
          </Box>
        )}

        {/* Load older messages button */}
        {hasMore && (
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center', pt: 2 }}>
            <Button
              onClick={onLoadMore}
              disabled={isLoadingMore}
              variant="outlined"
              size="small"
              sx={{
                color: '#9CCC65',
                borderColor: 'rgba(124,179,66,0.4)',
                '&:hover': {
                  borderColor: 'rgba(124,179,66,0.6)',
                  bgcolor: 'rgba(124,179,66,0.1)',
                },
              }}
            >
              {isLoadingMore ? 'Loading…' : 'Load earlier messages'}
            </Button>
          </Box>
        )}

      {/* Pinned Messages */}
      {pinnedMessages && pinnedMessages.length > 0 && (
        <Box
          sx={{
            mb: 2,
            p: 1.5,
            borderRadius: 2,
            bgcolor: 'rgba(205, 220, 57, 0.15)',
            border: '2px solid rgba(205, 220, 57, 0.4)',
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{
              color: '#CDDC39',
              fontWeight: 700,
              mb: 1,
              fontSize: '0.75rem',
            }}
          >
            📌 Pinned Messages
          </Typography>
          <Stack spacing={1}>
            {pinnedMessages.slice(0, 3).map((pm) => (
              <Typography
                key={pm.id}
                variant="caption"
                sx={{
                  color: '#F1F8E9',
                  fontSize: '0.75rem',
                  display: 'block',
                }}
              >
                {pm.body || pm.text || pm.content}
              </Typography>
            ))}
          </Stack>
        </Box>
      )}

      {/* Messages */}
      <Stack spacing={1} sx={{ px: 2 }}>
        {(Array.isArray(messages) ? messages : [])
          .filter((m) => !m.isPinned && !m.pinned_at)
          .map((message, idx) => {
              const msg = message.raw || message;
              const isMine = msg.sender_user_id === userId || msg.senderId === userId;
              const senderName =
                msg.senderName ||
                msg.users?.display_name ||
                msg.users?.username ||
                msg.sender?.display_name ||
                msg.sender?.username ||
                'User';
              const text = msg.text || msg.body || msg.content || '';
              const createdAt = msg.createdAt || msg.created_at;
              const avatarUrl =
                msg.senderAvatarUrl ||
                msg.users?.avatar_url ||
                msg.sender?.avatar_url ||
                null;

              // Group consecutive messages from same sender
              const prevMessage = idx > 0 ? messages[idx - 1] : null;
              const prevMsg = prevMessage?.raw || prevMessage;
              const isSameSender =
                prevMsg &&
                (prevMsg.sender_user_id === msg.sender_user_id ||
                  prevMsg.senderId === msg.senderId);
              const showAvatar = !isMine && (!isSameSender || idx === 0);
              const showName = !isMine && !isSameSender;

              // Swipe handlers for mobile
              const handleTouchStart = (e) => {
                if (!isMobile || !onReply || isMine) return;
                touchStartXRef.current = e.touches[0].clientX;
                touchStartYRef.current = e.touches[0].clientY;
              };

              const handleTouchEnd = (e) => {
                if (!isMobile || !onReply || isMine) return;
                const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
                const deltaY = Math.abs(e.changedTouches[0].clientY - touchStartYRef.current);
                
                // Swipe right (deltaX > 40) and not vertical scroll (deltaY < 50)
                if (deltaX > 40 && deltaY < 50) {
                  onReply(message);
                }
              };

              return (
                <Box
                  key={msg.id || idx}
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                  sx={{
                    display: 'flex',
                    justifyContent: isMine ? 'flex-end' : 'flex-start',
                    paddingX: 1,
                    paddingY: showAvatar ? 0.5 : 0.25,
                    cursor: isMobile && !isMine && onReply ? 'grab' : 'default',
                    userSelect: 'none',
                  }}
                >
                  {!isMine && (
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        bgcolor: 'rgba(124, 179, 66, 0.3)',
                        color: '#CDDC39',
                        mr: 1,
                        flexShrink: 0,
                        display: showAvatar ? 'flex' : 'none',
                      }}
                      src={avatarUrl}
                    >
                      {getInitials(senderName)}
                    </Avatar>
                  )}

                  <Box
                    sx={{
                      maxWidth: '75%',
                      minWidth: '120px',
                    }}
                  >
                    {showName && (
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'rgba(255,255,255,0.7)',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          mb: 0.25,
                          display: 'block',
                        }}
                      >
                        {senderName}
                      </Typography>
                    )}

                    <Box
                      sx={{
                        borderRadius: 3,
                        padding: '8px 12px',
                        backgroundColor: isMine
                          ? 'rgba(124, 179, 66, 0.25)'
                          : 'rgba(255, 255, 255, 0.08)',
                        border: isMine
                          ? '1px solid rgba(124, 179, 66, 0.3)'
                          : '1px solid rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(10px)',
                      }}
                    >
                      {text && (
                        <Typography
                          variant="body2"
                          sx={{
                            color: '#F1F8E9',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            fontSize: '0.9rem',
                            lineHeight: 1.4,
                          }}
                        >
                          {text}
                        </Typography>
                      )}

                      {/* Image attachments */}
                      {msg.image_url && (
                        <Box sx={{ mt: text ? 1 : 0 }}>
                          <img
                            src={msg.image_url}
                            alt="Attachment"
                            style={{
                              maxWidth: '100%',
                              borderRadius: '8px',
                              display: 'block',
                            }}
                          />
                        </Box>
                      )}
                      {msg.attachments && Array.isArray(msg.attachments) && msg.attachments.length > 0 && (
                        <Box sx={{ mt: text ? 1 : 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
                          {msg.attachments.map((att, idx) => {
                            if (att.type === 'image' && att.url) {
                              return (
                                <Box
                                  key={idx}
                                  sx={{
                                    borderRadius: 2,
                                    overflow: 'hidden',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                  }}
                                >
                                  <img
                                    src={att.url}
                                    alt="Message attachment"
                                    style={{
                                      maxWidth: '100%',
                                      height: 'auto',
                                      display: 'block',
                                    }}
                                  />
                                </Box>
                              );
                            }
                            return null;
                          })}
                        </Box>
                      )}

                      <Typography
                        variant="caption"
                        sx={{
                          display: 'block',
                          textAlign: isMine ? 'right' : 'left',
                          color: 'rgba(255,255,255,0.5)',
                          fontSize: '0.65rem',
                          marginTop: 0.25,
                        }}
                      >
                        {formatTime(createdAt)}
                        {msg.optimistic && ' • sending…'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              );
            })}
        </Stack>

        <div
          ref={scrollAnchorRef}
          data-scroll-anchor="group-messages-end"
          style={{ height: 1 }}
        />
        {scrollToBottomRef && <div ref={scrollToBottomRef} />}
      </Box>

      {group && onSend && (
        <ChatInput
          value=""
          onChange={() => {}}
          onSend={handleSend}
          disabled={false}
          sending={false}
          placeholder="Type a message…"
          replyToMessage={replyTo}
          onCancelReply={clearReply}
          scope="group"
          channelId={group.id}
        />
      )}
    </Box>
  );
}

