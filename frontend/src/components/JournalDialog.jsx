import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Rating,
  Stack,
  Chip,
  Box
} from '@mui/material';
import { supabase } from '../supabaseClient';
import { API_BASE } from '../config';

const defaultForm = (defaults) => {
  const safeDefaults = (defaults && typeof defaults === 'object') ? defaults : {};
  return {
    strain_name: safeDefaults.strain_name || '',
    strain_slug: safeDefaults.strain_slug || '',
    entry_date: new Date().toISOString().slice(0, 10),
    rating: safeDefaults.rating || 0,
    notes: '',
    method: '',
    dosage: '',
    time_of_day: '',
    tags: ''
  };
};

export default function JournalDialog({ open, defaults, onClose, onSaved }) {
  const [form, setForm] = useState(() => defaultForm(defaults));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setForm(defaultForm(defaults));
  }, [defaults, open]);

  const handleChange = (field) => (event, value) => {
    if (field === 'rating') {
      setForm((prev) => ({ ...prev, rating: value || 0 }));
      return;
    }
    const val = event?.target?.value ?? '';
    setForm((prev) => ({ ...prev, [field]: val }));
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;
      const resp = await fetch(`${API_BASE}/api/journals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          ...form,
          tags: form.tags
            ? form.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
            : []
        })
      });
      const payload = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        throw new Error(payload.error || 'Failed to save journal entry.');
      }
      onSaved?.(payload);
      onClose?.();
    } catch (err) {
      setError(err.message || 'Unable to save entry.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Log your experience</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Strain name"
            value={form.strain_name}
            onChange={handleChange('strain_name')}
            fullWidth
          />
          <TextField
            label="Strain slug / nickname"
            value={form.strain_slug}
            onChange={handleChange('strain_slug')}
            fullWidth
          />
          <TextField
            label="Date"
            type="date"
            value={form.entry_date}
            onChange={handleChange('entry_date')}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <Box>
            <Rating
              value={form.rating}
              onChange={handleChange('rating')}
              size="large"
            />
          </Box>
          <TextField
            label="Consumption method"
            value={form.method}
            onChange={handleChange('method')}
            placeholder="Joint, vape, edible..."
            fullWidth
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Dosage"
              value={form.dosage}
              onChange={handleChange('dosage')}
              placeholder="0.5g, 5mg edible..."
              fullWidth
            />
            <TextField
              label="Time of day"
              value={form.time_of_day}
              onChange={handleChange('time_of_day')}
              placeholder="Morning, Night..."
              fullWidth
            />
          </Stack>
          <TextField
            label="Tags"
            value={form.tags}
            onChange={handleChange('tags')}
            placeholder="sleep, focus"
            helperText="Comma-separated keywords"
            fullWidth
          />
          <TextField
            label="Notes"
            value={form.notes}
            onChange={handleChange('notes')}
            fullWidth
            multiline
            rows={4}
          />
          {error && (
            <Chip color="error" label={error} />
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={saving}>
          Save entry
        </Button>
      </DialogActions>
    </Dialog>
  );
}


