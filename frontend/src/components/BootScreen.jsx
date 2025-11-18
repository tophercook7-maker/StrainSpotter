// frontend/src/components/BootScreen.jsx
// Lightweight boot screen that renders immediately

import { Box, CircularProgress, Typography } from '@mui/material';

export default function BootScreen() {
  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#020503',
        backgroundImage: 'url(/strainspotter-bg.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        zIndex: 9999,
      }}
    >
      <Typography
        variant="h5"
        sx={{
          color: '#C5E1A5',
          fontWeight: 700,
          mb: 3,
          textShadow: '0 2px 8px rgba(0,0,0,0.8)',
        }}
      >
        StrainSpotter
      </Typography>
      <CircularProgress
        size={40}
        sx={{
          color: '#7CB342',
        }}
      />
      <Typography
        variant="body2"
        sx={{
          color: 'rgba(224, 242, 241, 0.8)',
          mt: 2,
        }}
      >
        Initializing...
      </Typography>
    </Box>
  );
}

