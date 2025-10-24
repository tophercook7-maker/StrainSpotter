import { useState, useMemo } from 'react';
import { Box, Fab, Tooltip, Popover, Stack, Typography, Button, Divider } from '@mui/material';
import { AutoFixHigh, SmartToy, CameraAlt, LocalFlorist, History } from '@mui/icons-material';

export default function AIAssistantBubble({ onNavigate }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const tips = useMemo(() => ([
    'Even lighting helps the AI see more detail.',
    'Flat angle reduces glare on labels.',
    'Crop or move closer so the label fills the frame.',
    'Text clarity boosts matching accuracy.'
  ]), []);

  const handleOpen = (e) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  return (
    <>
      <Box sx={{ position: 'fixed', bottom: 20, right: 20, zIndex: 2000 }}>
        <Tooltip title="AI Assistant">
          <Fab color="primary" onClick={handleOpen} aria-label="ai-assistant" sx={{ boxShadow: '0 10px 30px rgba(0,0,0,0.35)' }}>
            <SmartToy />
          </Fab>
        </Tooltip>
      </Box>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        PaperProps={{ sx: { p: 2, borderRadius: 2, maxWidth: 320 } }}
      >
        <Stack spacing={1.25}>
          <Stack direction="row" spacing={1} alignItems="center">
            <AutoFixHigh color="primary" />
            <Typography variant="subtitle1" fontWeight={700}>AI Assistant</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            I can help you get the best results and find what you need.
          </Typography>
          <Stack spacing={0.5}>
            {tips.map((t, i) => (
              <Typography key={i} variant="caption" color="text.secondary">• {t}</Typography>
            ))}
          </Stack>
          <Divider sx={{ my: 1 }} />
          <Stack direction="row" spacing={1}>
            <Button onClick={() => { onNavigate?.('wizard'); handleClose(); }} variant="contained" size="small" startIcon={<CameraAlt />} sx={{ flex: 1, minHeight: 38 }}>
              Start Scan
            </Button>
            <Button onClick={() => { onNavigate?.('strains'); handleClose(); }} variant="outlined" size="small" startIcon={<LocalFlorist />} sx={{ flex: 1, minHeight: 38 }}>
              Browse
            </Button>
            <Button onClick={() => { onNavigate?.('history'); handleClose(); }} variant="outlined" size="small" startIcon={<History />} sx={{ flex: 1, minHeight: 38 }}>
              History
            </Button>
          </Stack>
        </Stack>
      </Popover>
    </>
  );
}
