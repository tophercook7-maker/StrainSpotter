import React from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

export function BackHeader({ title, onBack }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 4px)',
        paddingBottom: 0.5,
        px: 1.5,
        gap: 1,
        flexShrink: 0,
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        backgroundColor: 'transparent',
        backdropFilter: 'blur(8px)',
        minHeight: 44, // Reduced header height
        maxHeight: 44,
      }}
    >
      <IconButton
        edge="start"
        onClick={onBack}
        sx={{ 
          color: '#fff',
          '&:hover': {
            backgroundColor: 'rgba(124, 179, 66, 0.2)',
          }
        }}
      >
        <ArrowBackIcon />
      </IconButton>
      {title && (
        <Typography variant="h6" fontWeight={600} sx={{ color: '#fff', flex: 1 }}>
          {title}
        </Typography>
      )}
    </Box>
  );
}

