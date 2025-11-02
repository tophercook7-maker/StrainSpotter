import React, { useMemo, useState } from 'react';
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
  Snackbar,
  FormControlLabel,
  Checkbox,
  Switch,
  Divider
} from '@mui/material';
import { supabase } from '../supabaseClient';

export default function GrowerRegistration({ onBack }) {
  const [mode, setMode] = useState('non-certified');
  const [form, setForm] = useState({
    growerId: '',
    farmName: '',
    city: '',
    state: '',
    specialties: '',
    bio: '',
    experienceYears: 3,
    licenseStatus: 'not_applicable',
    acceptsMessages: true,
    optInDirectory: true,
    phone: '',
    address: '',
    contactRiskAcknowledged: false,
    moderatorOptIn: false,
    moderatorMotivation: '',
    moderatorAvailability: '',
    moderatorExperience: '',
    moderatorNotes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snack, setSnack] = useState('');

  const handleChange = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const handleBoolean = (key) => (e) => setForm({ ...form, [key]: e.target.checked });

  const licenseOptions = useMemo(() => ([
    { value: 'licensed', label: 'Licensed' },
    { value: 'unlicensed', label: 'Unlicensed' },
    { value: 'not_applicable', label: 'Not Applicable' }
  ]), []);

  const resetForm = () => setForm({
    growerId: '',
    farmName: '',
    city: '',
    state: '',
    specialties: '',
    bio: '',
    experienceYears: 3,
    licenseStatus: mode === 'certified' ? 'licensed' : 'not_applicable',
    acceptsMessages: true,
    optInDirectory: true,
    phone: '',
    address: '',
    contactRiskAcknowledged: false,
    moderatorOptIn: false,
    moderatorMotivation: '',
    moderatorAvailability: '',
    moderatorExperience: '',
    moderatorNotes: ''
  });

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
      if (sessionErr) throw sessionErr;
      const userId = sessionData?.session?.user?.id;
      if (!userId) {
        throw new Error('Please sign in before registering as a grower.');
      }

      const certified = mode === 'certified';
      const basePayload = {
        userId,
        isGrower: true,
        licenseStatus: certified ? 'licensed' : form.licenseStatus,
        experienceYears: Number(form.experienceYears) || 0,
        bio: form.bio,
        specialties: form.specialties,
        city: form.city,
        state: form.state,
        country: 'USA',
        farmName: form.farmName,
        acceptsMessages: form.acceptsMessages,
        optInDirectory: form.optInDirectory,
        phone: form.phone || null,
        address: form.address || null,
        contactRiskAcknowledged: form.contactRiskAcknowledged,
        certified,
        moderatorOptIn: certified && form.moderatorOptIn
      };

      if ((basePayload.phone || basePayload.address) && !basePayload.contactRiskAcknowledged) {
        throw new Error('Please acknowledge the risks of sharing contact information.');
      }

      if (certified && !form.growerId) {
        throw new Error('Certified growers must provide their certification or license ID.');
      }

      let moderatorApplication = null;
      if (certified && form.moderatorOptIn) {
        const motivation = form.moderatorMotivation.trim();
        const availability = form.moderatorAvailability.trim();
        const experience = form.moderatorExperience.trim();
        const notes = form.moderatorNotes.trim();

        if (!motivation || !availability) {
          throw new Error('Please tell us why you would be a great moderator and when you are available.');
        }

        moderatorApplication = {
          motivation,
          availability,
          ...(experience ? { experience } : {}),
          ...(notes ? { notes } : {})
        };
      }

      const payload = {
        ...basePayload,
        growerId: certified ? form.growerId : null,
        moderatorApplication
      };

      const res = await fetch(`${API_BASE}/api/growers/profile/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const message = await res.json().catch(() => ({}));
        throw new Error(message.error || 'Failed to register grower profile.');
      }

      setSnack('Registration submitted!');
      resetForm();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto', py: 4 }}>
      {onBack && (
        <Button onClick={onBack} size="small" variant="contained" sx={{ bgcolor: 'white', color: 'black', textTransform: 'none', fontWeight: 700, borderRadius: 999, mb: 1, '&:hover': { bgcolor: 'grey.100' } }}>Home</Button>
      )}
      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h5">Grower Registration</Typography>
            <TextField
              select
              label="Registration Type"
              value={mode}
              onChange={(e) => {
                const value = e.target.value;
                setMode(value);
                setForm(prev => ({
                  ...prev,
                  licenseStatus: value === 'certified' ? 'licensed' : prev.licenseStatus === 'licensed' ? 'licensed' : 'not_applicable',
                  moderatorOptIn: value === 'certified' ? prev.moderatorOptIn : false,
                  moderatorMotivation: value === 'certified' ? prev.moderatorMotivation : '',
                  moderatorAvailability: value === 'certified' ? prev.moderatorAvailability : '',
                  moderatorExperience: value === 'certified' ? prev.moderatorExperience : '',
                  moderatorNotes: value === 'certified' ? prev.moderatorNotes : ''
                }));
              }}
            >
              <MenuItem value="certified">Certified Grower</MenuItem>
              <MenuItem value="non-certified">Non-Certified Grower</MenuItem>
            </TextField>
            {mode === 'certified' && (
              <TextField label="Grower ID" value={form.growerId} onChange={handleChange('growerId')} required />
            )}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField label="Farm / Brand Name" value={form.farmName} onChange={handleChange('farmName')} fullWidth />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="City" value={form.city} onChange={handleChange('city')} fullWidth />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="State" value={form.state} onChange={handleChange('state')} fullWidth />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Years of Experience"
                  type="number"
                  inputProps={{ min: 0 }}
                  value={form.experienceYears}
                  onChange={handleChange('experienceYears')}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Specialties (comma-separated)" value={form.specialties} onChange={handleChange('specialties')} fullWidth />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Bio" value={form.bio} onChange={handleChange('bio')} fullWidth multiline minRows={3} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="License Status"
                  value={form.licenseStatus}
                  onChange={handleChange('licenseStatus')}
                  fullWidth
                  disabled={mode === 'certified'}
                >
                  {licenseOptions.map(opt => (
                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} sx={{ display: 'flex', alignItems: 'center' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.acceptsMessages}
                      onChange={handleBoolean('acceptsMessages')}
                    />
                  }
                  label="Accept direct messages from members"
                />
              </Grid>
            </Grid>

            <Divider />

            <FormControlLabel
              control={
                <Switch
                  checked={form.optInDirectory}
                  onChange={handleBoolean('optInDirectory')}
                />
              }
              label="List me in the public grower directory"
            />
            <Typography variant="caption" color="text.secondary">
              New growers are welcome — we highlight certified growers separately and sort the list by experience so members can find the right fit.
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField label="Public Phone (optional)" value={form.phone} onChange={handleChange('phone')} fullWidth />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Public Address (optional)" value={form.address} onChange={handleChange('address')} fullWidth />
              </Grid>
            </Grid>

            {(form.phone || form.address) && (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.contactRiskAcknowledged}
                    onChange={handleBoolean('contactRiskAcknowledged')}
                  />
                }
                label="I understand the risks of sharing my contact information publicly."
              />
            )}

            {mode === 'certified' && (
              <FormControlLabel
                control={
                  <Switch
                    checked={form.moderatorOptIn}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setForm(prev => ({
                        ...prev,
                        moderatorOptIn: checked,
                        moderatorMotivation: checked ? prev.moderatorMotivation : '',
                        moderatorAvailability: checked ? prev.moderatorAvailability : '',
                        moderatorExperience: checked ? prev.moderatorExperience : '',
                        moderatorNotes: checked ? prev.moderatorNotes : ''
                      }));
                    }}
                  />
                }
                label="I'll earn that free membership by helping moderate the community (you gotta earn it!)"
              />
            )}
            {mode === 'certified' && form.moderatorOptIn && (
              <Stack spacing={2} sx={{ p: 2, bgcolor: 'rgba(124,179,66,0.08)', borderRadius: 2, border: '1px solid rgba(124,179,66,0.3)' }}>
                <Alert severity="info" sx={{ bgcolor: 'rgba(255,255,255,0.7)' }}>
                  Certified moderators help keep conversations safe and on-topic. Share a quick note about how you can contribute so we can activate your complimentary membership.
                </Alert>
                <TextField
                  label="Why you'd be a great moderator"
                  value={form.moderatorMotivation}
                  onChange={handleChange('moderatorMotivation')}
                  fullWidth
                  multiline
                  minRows={2}
                  required
                />
                <TextField
                  label="Weekly availability (hours / time windows)"
                  value={form.moderatorAvailability}
                  onChange={handleChange('moderatorAvailability')}
                  fullWidth
                  multiline
                  minRows={2}
                  required
                />
                <TextField
                  label="Experience moderating or supporting communities"
                  value={form.moderatorExperience}
                  onChange={handleChange('moderatorExperience')}
                  fullWidth
                  multiline
                  minRows={2}
                />
                <TextField
                  label="Anything else we should know?"
                  value={form.moderatorNotes}
                  onChange={handleChange('moderatorNotes')}
                  fullWidth
                  multiline
                  minRows={2}
                />
              </Stack>
            )}

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
