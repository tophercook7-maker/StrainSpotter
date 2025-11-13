import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
  Typography
} from '@mui/material';

export default function ProfileSetupDialog({
  open,
  email,
  initialDisplayName = '',
  saving = false,
  error = '',
  onSave,
  onClose
}) {
  const [displayName, setDisplayName] = useState(initialDisplayName);

  useEffect(() => {
    if (open) {
      setDisplayName(initialDisplayName || '');
    }
  }, [open, initialDisplayName]);

  const handleSubmit = () => {
    const trimmedName = displayName.trim();

    if (!trimmedName || trimmedName.length < 2) {
      return;
    }

    onSave?.({
      displayName: trimmedName
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle sx={{ fontWeight: 700, color: '#2e7d32' }}>
        Complete Your Profile
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Pick the name other members will see in groups and direct messages. You can change this anytime.
          </Typography>
          <TextField
            label="Display Name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="e.g. Topher"
            required
            inputProps={{ maxLength: 60 }}
          />
          <TextField
            label="Email"
            value={email || ''}
            InputProps={{ readOnly: true }}
          />
          {error && (
            <Typography variant="body2" sx={{ color: '#d32f2f' }}>
              {error}
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving}>
          Not now
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

