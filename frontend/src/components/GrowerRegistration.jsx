import React, { useState } from 'react';
import { API_BASE } from '../config';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Stack,
  TextField,
  Typography,
  Alert,
  MenuItem,
  Snackbar
} from '@mui/material';

export default function GrowerRegistration() {
  const [mode, setMode] = useState('non-certified');
  const [form, setForm] = useState({
    growerId: '',
    name: '',
    location: '',
    specialties: '',
    bio: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snack, setSnack] = useState('');

  const handleChange = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        mode,
        growerId: mode === 'certified' ? form.growerId : undefined,
        name: form.name,
        location: form.location,
        specialties: form.specialties.split(',').map(s => s.trim()).filter(Boolean),
        bio: form.bio
      };
      const res = await fetch(`${API_BASE}/api/growers/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to register');
      setSnack('Registration submitted!');
      setForm({ growerId: '', name: '', location: '', specialties: '', bio: '' });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto', py: 4 }}>
      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h5">Grower Registration</Typography>
            <TextField select label="Registration Type" value={mode} onChange={e => setMode(e.target.value)}>
              <MenuItem value="certified">Certified Grower</MenuItem>
              <MenuItem value="non-certified">Non-Certified Grower</MenuItem>
            </TextField>
            {mode === 'certified' && (
              <TextField label="Grower ID" value={form.growerId} onChange={handleChange('growerId')} required />
            )}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField label="Name" value={form.name} onChange={handleChange('name')} fullWidth />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Location" value={form.location} onChange={handleChange('location')} fullWidth />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Specialties (comma-separated)" value={form.specialties} onChange={handleChange('specialties')} fullWidth />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Bio" value={form.bio} onChange={handleChange('bio')} fullWidth multiline minRows={3} />
              </Grid>
            </Grid>
            {error && <Alert severity="error">{error}</Alert>}
            <Stack direction="row" spacing={2}>
              <Button variant="contained" onClick={submit} disabled={loading}>
                {loading ? 'Submitting…' : 'Submit'}
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
      <Snackbar open={!!snack} autoHideDuration={2500} onClose={() => setSnack('')} message={snack} />
    </Box>
  );
}
