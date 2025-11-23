// frontend/src/components/MessageButton.jsx
// Reusable button component for starting DM conversations from various integration points

import React, { useState } from 'react';
import { Button, CircularProgress, Alert, Snackbar } from '@mui/material';
import MessageIcon from '@mui/icons-material/Message';
import { useStartDM } from '../hooks/useStartDM';

export function MessageButton({ targetUserId, targetBusinessId, onConversationStarted, variant = 'contained', size = 'medium', fullWidth = false }) {
  const { startConversation, loading, error } = useStartDM();
  const [showError, setShowError] = useState(false);

  const handleClick = async () => {
    try {
      const conversation = await startConversation(targetUserId, targetBusinessId);
      if (onConversationStarted) {
        onConversationStarted(conversation);
      }
    } catch (err) {
      setShowError(true);
    }
  };

  const getLabel = () => {
    if (targetBusinessId) {
      return 'Message Business';
    }
    if (targetUserId) {
      return 'Message Member';
    }
    return 'Message';
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        fullWidth={fullWidth}
        startIcon={loading ? <CircularProgress size={16} sx={{ color: 'inherit' }} /> : <MessageIcon />}
        onClick={handleClick}
        disabled={loading || (!targetUserId && !targetBusinessId)}
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
        {loading ? 'Starting...' : getLabel()}
      </Button>

      <Snackbar
        open={showError}
        autoHideDuration={6000}
        onClose={() => setShowError(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setShowError(false)}
          severity="error"
          sx={{ width: '100%' }}
        >
          {error || 'Failed to start conversation'}
        </Alert>
      </Snackbar>
    </>
  );
}

