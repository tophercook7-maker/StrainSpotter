// frontend/src/components/groups/GroupHeader.jsx
// Telegram/Discord-style chat header

import { Box, Typography, IconButton, Stack } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import GroupsIcon from '@mui/icons-material/Groups';

export default function GroupHeader({
  group,
  memberCount,
  onBack,
  onMenu,
  isMobile = false,
  typingUsers = [],
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        paddingX: 1.5,
        paddingY: 1,
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        flexShrink: 0,
        backgroundColor: 'transparent',
        backdropFilter: 'blur(10px)',
        minHeight: 44,
        maxHeight: 44,
      }}
    >
      {onBack && (
        <IconButton
          onClick={onBack}
          sx={{
            color: '#CDDC39',
            '&:hover': {
              bgcolor: 'rgba(124,179,66,0.1)',
            },
          }}
        >
          <ArrowBackIcon />
        </IconButton>
      )}

      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          bgcolor: 'rgba(124, 179, 66, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <GroupsIcon sx={{ color: '#CDDC39' }} />
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 600,
            color: '#F1F8E9',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {group?.name || 'Group'}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: 'rgba(255,255,255,0.6)',
            fontSize: '0.75rem',
          }}
        >
          {memberCount || 0} member{memberCount !== 1 ? 's' : ''}
        </Typography>
        {typingUsers.length > 0 && (
          <Typography
            variant="caption"
            sx={{
              color: '#9CCC65',
              fontSize: '0.7rem',
              fontStyle: 'italic',
              mt: 0.25,
            }}
          >
            {typingUsers.length === 1
              ? `${typingUsers[0].displayName} is typing…`
              : 'Several people are typing…'}
          </Typography>
        )}
      </Box>

      {onMenu && (
        <IconButton
          onClick={onMenu}
          sx={{
            color: '#9CCC65',
            '&:hover': {
              bgcolor: 'rgba(124,179,66,0.1)',
            },
          }}
        >
          <MoreVertIcon />
        </IconButton>
      )}
    </Box>
  );
}

