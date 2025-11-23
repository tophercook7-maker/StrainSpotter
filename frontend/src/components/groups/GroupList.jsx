// frontend/src/components/groups/GroupList.jsx
// Discord-style group list sidebar

import { Box, Typography, Stack, Badge, Avatar } from '@mui/material';
import GroupsIcon from '@mui/icons-material/Groups';

function formatTime(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString();
}

function messageSnippet(content) {
  if (!content) return 'No messages yet';
  return content.length > 50 ? `${content.slice(0, 47)}…` : content;
}

export default function GroupList({ groups, selectedGroupId, onSelectGroup, isLoading }) {
  if (isLoading) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
          Loading groups...
        </Typography>
      </Box>
    );
  }

  if (!groups || groups.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
          No groups available
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        flex: 1,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        padding: 1,
      }}
    >
      <Stack spacing={0.5}>
        {groups.map((group) => {
          const isActive = group.id === selectedGroupId;
          const lastMessage = group.last_message;
          const unreadCount = group.unread_count || 0;

          return (
            <Box
              key={group.id}
              onClick={() => onSelectGroup?.(group)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                padding: '10px 12px',
                borderRadius: 2,
                cursor: 'pointer',
                backgroundColor: isActive ? 'rgba(124, 179, 66, 0.15)' : 'transparent',
                border: isActive ? '1px solid rgba(124, 179, 66, 0.3)' : '1px solid transparent',
                '&:hover': {
                  backgroundColor: isActive 
                    ? 'rgba(124, 179, 66, 0.2)' 
                    : 'rgba(255,255,255,0.06)',
                },
                transition: 'background-color 0.2s',
              }}
            >
              <Avatar
                sx={{
                  width: 40,
                  height: 40,
                  bgcolor: 'rgba(124, 179, 66, 0.3)',
                  color: '#CDDC39',
                  flexShrink: 0,
                }}
              >
                <GroupsIcon />
              </Avatar>
              
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 600,
                      color: '#F1F8E9',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {group.name}
                  </Typography>
                  {lastMessage && (
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'rgba(255,255,255,0.5)',
                        fontSize: '0.7rem',
                        flexShrink: 0,
                        ml: 1,
                      }}
                    >
                      {formatTime(lastMessage.created_at)}
                    </Typography>
                  )}
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'rgba(255,255,255,0.6)',
                      fontSize: '0.75rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1,
                    }}
                  >
                    {lastMessage
                      ? `${lastMessage.user?.display_name || lastMessage.user?.username || 'Someone'}: ${messageSnippet(lastMessage.content)}`
                      : 'No messages yet'}
                  </Typography>
                  
                  {unreadCount > 0 && (
                    <Badge
                      badgeContent={unreadCount}
                      sx={{
                        '& .MuiBadge-badge': {
                          bgcolor: '#7CB342',
                          color: '#0c220f',
                          fontWeight: 700,
                          fontSize: '0.65rem',
                          minWidth: '18px',
                          height: '18px',
                        },
                      }}
                    />
                  )}
                </Box>
              </Box>
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}

