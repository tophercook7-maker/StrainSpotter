import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import {
  AutoAwesome,
  ContentCopy,
  NoteAdd,
  Refresh,
  Save,
  Share
} from '@mui/icons-material';
import { supabase } from '../supabaseClient';
import { API_BASE } from '../config';
import EmptyStateCard from './EmptyStateCard';
import GrassIcon from '@mui/icons-material/Grass';
import { BackHeader } from './BackHeader';

const stageOptions = [
  'Planning',
  'Germination',
  'Seedling',
  'Vegetative',
  'Early Flower',
  'Mid Flower',
  'Late Flower',
  'Flush',
  'Harvest',
  'Dry & Cure',
  'Maintenance'
];

const initialForm = () => ({
  runLabel: '',
  strainSlug: '',
  stage: 'Vegetative',
  day: '',
  entryDate: new Date().toISOString().slice(0, 10),
  notes: '',
  highlight: '',
  healthIssues: '',
  remedies: '',
  nextActions: '',
  tasksCompleted: '',
  nutrientsUsed: '',
  medium: '',
  waterVolume: '',
  environmentNotes: '',
  aiPrompt: '',
  imageUrls: '',
  metrics: {
    temperature: '',
    humidity: '',
    vpd: '',
    ec: '',
    ph: '',
    co2: '',
    height: ''
  },
  shareEnabled: true,
  shareMessage: '',
  shareTags: '#StrainSpotter #GrowLog',
  vigor: 'Thriving',
  pestCheck: 'No pests detected'
});

const parseList = (value) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const buildShareSummary = (log) => {
  const progress = log.progress || {};
  const environment = progress.metrics || {};
  const share = progress.share || {};
  const lines = [
    `Grow Update – ${progress.run_label || 'Untitled Run'}`,
    progress.day ? `Day ${progress.day}` : null,
    log.stage ? `Stage: ${log.stage}` : null,
    log.strain_slug ? `Strain: ${log.strain_slug}` : null,
    environment.temperature || environment.humidity || environment.ec || environment.ph
      ? `Vitals → Temp: ${environment.temperature || '—'} | RH: ${environment.humidity || '—'} | EC: ${environment.ec || '—'} | pH: ${environment.ph || '—'}`
      : null,
    log.notes ? `Highlights: ${log.notes}` : null,
    progress.tasks_completed?.length ? `Tasks: ${progress.tasks_completed.join(', ')}` : null,
    progress.next_actions?.length ? `Next: ${progress.next_actions.join(', ')}` : null,
    log.health_status?.issues?.length ? `Watch: ${log.health_status.issues.join(', ')}` : null,
    share.tags?.length ? `Tags: ${share.tags.map((tag) => (tag.startsWith('#') ? tag : `#${tag}`)).join(' ')}` : null
  ].filter(Boolean);

  if (share.summary) {
    return share.summary;
  }

  return lines.join('\n');
};

export default function GrowLogBook({ onBack: externalOnBack }) {
  const [form, setForm] = useState(() => initialForm());
  const [logs, setLogs] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });
  
  // Shared TextField styling for dark theme
  const textFieldSx = {
    '& .MuiInputLabel-root': { color: '#C5E1A5' },
    '& .MuiInputLabel-root.Mui-focused': { color: '#7CB342' },
    '& .MuiInputBase-input': { color: '#E8F5E9' },
    '& .MuiSelect-icon': { color: '#C5E1A5' },
    '& .MuiFormHelperText-root': { color: '#C5E1A5' },
    '& .MuiOutlinedInput-root': {
      bgcolor: 'rgba(124, 179, 66, 0.05)',
      '& fieldset': { borderColor: 'rgba(124, 179, 66, 0.3)' },
      '&:hover fieldset': { borderColor: 'rgba(124, 179, 66, 0.5)' },
      '&.Mui-focused fieldset': { borderColor: 'rgba(124, 179, 66, 0.7)' },
      '&.Mui-disabled': {
        bgcolor: 'rgba(124, 179, 66, 0.02)',
        '& fieldset': { borderColor: 'rgba(124, 179, 66, 0.1)' }
      }
    },
    '& input::placeholder': { color: '#9CCC65', opacity: 0.7 }
  };

  const loadUserAndLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await supabase.auth.getSession();
      const sessionUser = data?.session?.user || null;
      setUser(sessionUser);

      if (!sessionUser?.id || !data?.session?.access_token) {
        setLogs([]);
        setLoading(false);
        return;
      }

      const resp = await fetch(`${API_BASE}/api/growlogs?user_id=${sessionUser.id}`, {
        headers: {
          'Authorization': `Bearer ${data.session.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!resp.ok) {
        if (resp.status === 401) {
          // User not authenticated - clear user and show sign-in message
          setUser(null);
          setLogs([]);
          setError(null); // Don't show error, just show sign-in message
          setLoading(false);
          return;
        }
        const body = await resp.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to load grow logs.');
      }
      const dataLogs = await resp.json();
      setLogs(Array.isArray(dataLogs) ? dataLogs : []);
    } catch (err) {
      console.error('[grow-logbook] load failed', err);
      setError(err.message || 'Unable to load grow logs.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUserAndLogs();
  }, [loadUserAndLogs]);

  const groupedLogs = useMemo(() => {
    const groups = new Map();
    logs.forEach((log) => {
      const label = log.progress?.run_label || 'Unlabeled Run';
      if (!groups.has(label)) {
        groups.set(label, []);
      }
      groups.get(label).push(log);
    });

    return Array.from(groups.entries()).map(([label, items]) => ({
      label,
      items: items.sort((a, b) => {
        const dateA = new Date(a.progress?.entry_date || a.created_at || 0).getTime();
        const dateB = new Date(b.progress?.entry_date || b.created_at || 0).getTime();
        return dateB - dateA;
      })
    }));
  }, [logs]);

  const handleFormChange = (field) => (event) => {
    const value = event.target.value;
    if (field.startsWith('metrics.')) {
      const key = field.split('.')[1];
      setForm((prev) => ({
        ...prev,
        metrics: {
          ...prev.metrics,
          [key]: value
        }
      }));
      return;
    }
    setForm((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleToggleShare = (_event, checked) => {
    setForm((prev) => ({
      ...prev,
      shareEnabled: checked
    }));
  };

  const handleSubmit = async () => {
    if (!user?.id) {
      setError('You need to be signed in to save grow logs.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const shareSummary = form.shareMessage || [
        `${form.runLabel || 'Grow Log'} – ${form.stage}`,
        form.day ? `Day ${form.day}` : null,
        form.highlight || form.notes || null,
        form.nextActions ? `Next: ${form.nextActions}` : null
      ].filter(Boolean).join('\n');

      const payload = {
        user_id: user.id,
        strain_slug: form.strainSlug || null,
        stage: form.stage,
        notes: form.notes,
        images: parseList(form.imageUrls).slice(0, 6),
        health_status: {
          vigor: form.vigor,
          highlight: form.highlight,
          issues: parseList(form.healthIssues),
          medium: form.medium,
          pest_check: form.pestCheck,
          environment_notes: form.environmentNotes,
          water_volume: form.waterVolume
        },
        remedies: {
          actions: parseList(form.remedies),
          next_actions: parseList(form.nextActions),
          ai_prompt: form.aiPrompt
        },
        progress: {
          run_label: form.runLabel || 'Untitled Run',
          day: form.day ? Number(form.day) : null,
          entry_date: form.entryDate,
          metrics: form.metrics,
          tasks_completed: parseList(form.tasksCompleted),
          next_actions: parseList(form.nextActions),
          nutrients: parseList(form.nutrientsUsed),
          environment_notes: form.environmentNotes,
          share: {
            enabled: form.shareEnabled,
            summary: shareSummary,
            tags: parseList(form.shareTags),
            token: form.shareEnabled ? crypto.randomUUID() : null
          },
          created_with: 'grow-logbook-v1',
          last_updated: new Date().toISOString()
        }
      };

      // Get auth token for authenticated request
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      
      const resp = await fetch(`${API_BASE}/api/growlogs`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
        },
        body: JSON.stringify(payload)
      });

      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        throw new Error(data.error || 'Failed to save grow log entry.');
      }

      setLogs((prev) => [data, ...prev]);
      setForm((prev) => ({
        ...initialForm(),
        runLabel: prev.runLabel,
        strainSlug: prev.strainSlug,
        stage: prev.stage
      }));
      setSnackbar({ open: true, message: 'Grow log entry saved.' });
    } catch (err) {
      console.error('[grow-logbook] save failed', err);
      setError(err.message || 'Unable to save grow log entry.');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyShare = async (log) => {
    const summary = buildShareSummary(log);
    try {
      await navigator.clipboard.writeText(summary);
      setSnackbar({ open: true, message: 'Share summary copied to clipboard.' });
    } catch (err) {
      console.error('[grow-logbook] copy share failed', err);
      setError('Could not copy to clipboard. Please copy manually.');
    }
  };

  const handleBack = externalOnBack || (() => {
    if (window.history.length > 1) {
      window.history.back();
    }
  });

  // If embedded in GrowCoach, don't show separate header
  const isEmbedded = !externalOnBack && typeof window !== 'undefined' && window.location.pathname !== '/grow-logbook';
  
  return (
    <Box sx={{ 
      width: '100%', 
      maxWidth: '100%', 
      overflow: 'hidden',
      minHeight: externalOnBack ? '100vh' : 'auto',
      background: externalOnBack ? 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)' : 'transparent',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {externalOnBack && <BackHeader title="Grow Logbook" onBack={handleBack} />}
      <Box sx={{ flex: 1, overflowY: 'auto', py: externalOnBack ? 1.5 : 0, px: { xs: 0.5, sm: 1 }, mx: 0, width: '100%', boxSizing: 'border-box' }}>
    <Stack spacing={externalOnBack ? 2 : 1.5} sx={{ width: '100%', maxWidth: '100%', overflow: 'hidden', mx: 0 }}>
      <Paper
        elevation={0}
        id="grow-log-form"
        sx={{
          p: { xs: 1.25, sm: 1.5 },
          borderRadius: 2,
          background: 'rgba(124, 179, 66, 0.1)',
          border: '2px solid rgba(124, 179, 66, 0.3)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
          width: '100%',
          maxWidth: '100%',
          overflow: 'hidden',
          wordWrap: 'break-word',
          overflowWrap: 'break-word',
          mx: 0
        }}
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} sx={{ mb: 1.5 }}>
          <Box sx={{ flex: 1 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
              <AutoAwesome sx={{ color: '#7CB342', fontSize: 20 }} />
              <Typography variant="h6" fontWeight={800} sx={{ fontSize: '1.1rem', color: '#E8F5E9' }}>
                🤖 AI-Powered Log Entry
              </Typography>
            </Stack>
            <Typography variant="body2" sx={{ color: '#C5E1A5', fontSize: '0.85rem', maxWidth: '100%', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
              AI analyzes your data and provides instant insights. Log metrics, photos, and observations—get recommendations automatically.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Tooltip title="Refresh entries">
              <IconButton onClick={loadUserAndLogs} color="success">
                <Refresh />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </Paper>

      {error && (
        <Alert 
          severity="error" 
          onClose={() => setError(null)}
          sx={{
            bgcolor: 'rgba(244, 67, 54, 0.2)',
            color: '#FFB74D',
            border: '1px solid rgba(244, 67, 54, 0.4)',
            '& .MuiAlert-icon': { color: '#FFB74D' }
          }}
        >
          {error}
        </Alert>
      )}

      {!user && !loading && (
        <Alert 
          severity="info"
          sx={{
            bgcolor: 'rgba(124, 179, 66, 0.2)',
            color: '#E8F5E9',
            border: '1px solid rgba(124, 179, 66, 0.4)',
            '& .MuiAlert-icon': { color: '#7CB342' }
          }}
        >
          Sign in to unlock the Grow Logbook and keep detailed records of every run.
        </Alert>
      )}

      <Paper
        elevation={0}
        sx={{
          p: { xs: 1.25, sm: 1.5 },
          borderRadius: 2,
          background: 'rgba(124, 179, 66, 0.1)',
          border: '2px solid rgba(124, 179, 66, 0.3)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
          width: '100%',
          maxWidth: '100%',
          overflow: 'hidden',
          wordWrap: 'break-word',
          overflowWrap: 'break-word',
          mx: 0
        }}
      >
        <Stack spacing={1.5}>
          <Typography variant="subtitle1" fontWeight={800} sx={{ wordBreak: 'break-word', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 1, color: '#E8F5E9' }}>
            <AutoAwesome sx={{ fontSize: 18, color: '#7CB342' }} /> Quick Entry
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Grow / Run Label"
                placeholder="e.g., Blue Dream - Spring 2024"
                value={form.runLabel}
                onChange={handleFormChange('runLabel')}
                fullWidth
                required
                helperText="Name this grow run for easy tracking"
                sx={textFieldSx}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                label="Day"
                placeholder="42"
                value={form.day}
                onChange={handleFormChange('day')}
                fullWidth
                type="number"
                inputProps={{ min: 0 }}
                helperText="Days since germination"
                sx={textFieldSx}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                label="Entry Date"
                type="date"
                value={form.entryDate}
                onChange={handleFormChange('entryDate')}
                fullWidth
                InputLabelProps={{ shrink: true }}
                helperText="When did this happen?"
                sx={textFieldSx}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Strain Name"
                placeholder="e.g., Blue Dream, OG Kush"
                value={form.strainSlug}
                onChange={handleFormChange('strainSlug')}
                fullWidth
                helperText="Strain name or nickname"
                sx={textFieldSx}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Growth Stage"
                select
                value={form.stage}
                onChange={handleFormChange('stage')}
                fullWidth
                sx={textFieldSx}
              >
                {stageOptions.map((option) => (
                  <MenuItem key={option} value={option} sx={{ color: '#E8F5E9', bgcolor: 'rgba(124, 179, 66, 0.1)' }}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Session Notes / Highlights"
                placeholder="What happened today? Any observations, changes, or important notes..."
                value={form.notes}
                onChange={handleFormChange('notes')}
                multiline
                minRows={3}
                fullWidth
                helperText="Describe today's grow session in detail"
                sx={textFieldSx}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Key Highlight"
                placeholder="e.g., First pistils appeared, Topped main cola"
                value={form.highlight}
                onChange={handleFormChange('highlight')}
                fullWidth
                helperText="One key thing that happened today"
                sx={textFieldSx}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Tasks Completed"
                placeholder="Watered, Defoliated, Checked pH"
                value={form.tasksCompleted}
                onChange={handleFormChange('tasksCompleted')}
                fullWidth
                helperText="Separate with commas"
                sx={textFieldSx}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Upcoming Actions"
                placeholder="Feed tomorrow, Check for pests, Increase humidity"
                value={form.nextActions}
                onChange={handleFormChange('nextActions')}
                fullWidth
                helperText="What's next? Separate with commas"
                sx={textFieldSx}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Nutrients / Additives"
                placeholder="e.g., Cal-Mag 5ml, Bloom nutes 10ml"
                value={form.nutrientsUsed}
                onChange={handleFormChange('nutrientsUsed')}
                fullWidth
                helperText="What did you feed?"
                sx={textFieldSx}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Growing Medium"
                placeholder="e.g., Coco, Soil, Hydro, DWC"
                value={form.medium}
                onChange={handleFormChange('medium')}
                fullWidth
                helperText="What medium are you using?"
                sx={textFieldSx}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Water / Feed Volume"
                placeholder="e.g., 2 gallons, 500ml per plant"
                value={form.waterVolume}
                onChange={handleFormChange('waterVolume')}
                fullWidth
                helperText="How much did you water/feed?"
                sx={textFieldSx}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Environment Notes"
                placeholder="e.g., Temp spiked to 82°F, Added humidifier, Fan speed increased"
                value={form.environmentNotes}
                onChange={handleFormChange('environmentNotes')}
                multiline
                minRows={2}
                fullWidth
                helperText="Any environmental changes or observations"
                sx={textFieldSx}
              />
            </Grid>
          </Grid>

          <Divider />

          <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#E8F5E9' }}>
            Vital Metrics
          </Typography>
          <Grid container spacing={1.5}>
            {Object.entries(form.metrics).map(([key, value]) => {
              const placeholders = {
                temperature: '75°F',
                humidity: '55%',
                vpd: '1.2',
                ec: '2.0',
                ph: '6.5',
                co2: '400ppm',
                height: '24"'
              };
              const helpers = {
                temperature: 'Room temperature',
                humidity: 'Relative humidity',
                vpd: 'Vapor pressure deficit',
                ec: 'Electrical conductivity',
                ph: 'pH level',
                co2: 'CO₂ concentration',
                height: 'Plant height'
              };
              return (
                <Grid item xs={6} sm={4} md={3} key={key}>
                  <TextField
                    label={key.charAt(0).toUpperCase() + key.slice(1)}
                    placeholder={placeholders[key] || 'Enter value'}
                    value={value}
                    onChange={handleFormChange(`metrics.${key}`)}
                    fullWidth
                    helperText={helpers[key] || ''}
                    size="small"
                    sx={textFieldSx}
                  />
                </Grid>
              );
            })}
          </Grid>

          <Divider />

          <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#E8F5E9' }}>
            Health Check
          </Typography>
          <Grid container spacing={1.5}>
            <Grid item xs={12} md={4}>
              <TextField
                label="Plant Vigor"
                placeholder="e.g., Thriving, Good, Struggling"
                value={form.vigor}
                onChange={handleFormChange('vigor')}
                fullWidth
                helperText="Overall plant health"
                sx={textFieldSx}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Health Issues"
                placeholder="e.g., Yellowing leaves, Brown spots, Slow growth"
                value={form.healthIssues}
                onChange={handleFormChange('healthIssues')}
                fullWidth
                helperText="Separate with commas"
                sx={textFieldSx}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Pest Check"
                placeholder="e.g., No pests detected, Found spider mites"
                value={form.pestCheck}
                onChange={handleFormChange('pestCheck')}
                fullWidth
                helperText="Pest inspection results"
                sx={textFieldSx}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Corrective Actions"
                placeholder="e.g., Applied neem oil, Increased airflow, Adjusted pH"
                value={form.remedies}
                onChange={handleFormChange('remedies')}
                fullWidth
                helperText="What did you do to fix issues?"
                sx={textFieldSx}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="🤖 AI Question / Prompt"
                placeholder="e.g., Why are my leaves curling? Best nutrients for week 4?"
                value={form.aiPrompt}
                onChange={handleFormChange('aiPrompt')}
                fullWidth
                helperText="Ask AI for help or insights"
                sx={textFieldSx}
              />
            </Grid>
          </Grid>

          <Divider />

          <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#E8F5E9' }}>
            Media & Sharing
          </Typography>
          <Grid container spacing={1.5} alignItems="center">
            <Grid item xs={12} md={8}>
              <TextField
                label="Image URLs"
                placeholder="Paste image URLs separated by commas"
                value={form.imageUrls}
                onChange={handleFormChange('imageUrls')}
                fullWidth
                helperText="Add photos of your grow (comma separated URLs)"
                sx={textFieldSx}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControlLabel
                control={<Switch checked={form.shareEnabled} onChange={handleToggleShare} color="success" />}
                label={<Typography sx={{ color: '#E8F5E9' }}>Generate share summary</Typography>}
              />
            </Grid>
            {form.shareEnabled && (
              <>
                <Grid item xs={12}>
                  <TextField
                    label="Share summary override"
                    value={form.shareMessage}
                    onChange={handleFormChange('shareMessage')}
                    multiline
                    minRows={2}
                    fullWidth
                    placeholder="Optional custom message for social posts or group chats"
                    sx={textFieldSx}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Share tags (comma separated)"
                    value={form.shareTags}
                    onChange={handleFormChange('shareTags')}
                    fullWidth
                    sx={textFieldSx}
                  />
                </Grid>
              </>
            )}
          </Grid>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="flex-end">
            <Button
              variant="outlined"
              startIcon={<AutoAwesome />}
              onClick={async () => {
                try {
                  // AI-powered summary generation
                  const summaryParts = [
                    `${form.runLabel || 'Grow Log'} – ${form.stage}`,
                    form.day && `Day ${form.day}`,
                    form.highlight && `✨ ${form.highlight}`,
                    form.tasksCompleted && `✅ Tasks: ${form.tasksCompleted}`,
                    form.nextActions && `📋 Next: ${form.nextActions}`,
                    form.healthIssues && `⚠️ Watch: ${form.healthIssues}`,
                    form.metrics.temperature && `🌡️ Temp: ${form.metrics.temperature}°F`,
                    form.metrics.humidity && `💧 RH: ${form.metrics.humidity}%`,
                    form.metrics.ph && `🧪 pH: ${form.metrics.ph}`,
                    form.metrics.ec && `⚡ EC: ${form.metrics.ec}`
                  ].filter(Boolean);
                  
                  const autoShare = summaryParts.join('\n');
                  setForm((prev) => ({ ...prev, shareMessage: autoShare }));
                  setSnackbar({ open: true, message: 'AI summary generated!' });
                } catch (err) {
                  console.error('Failed to generate summary:', err);
                }
              }}
              sx={{
                borderColor: 'rgba(124, 179, 66, 0.5)',
                color: '#7CB342',
                '&:hover': {
                  borderColor: '#7CB342',
                  bgcolor: 'rgba(124, 179, 66, 0.1)'
                }
              }}
            >
              🤖 AI Generate Summary
            </Button>
            <Button
              variant="contained"
              color="success"
              startIcon={<Save />}
              onClick={handleSubmit}
              disabled={saving || !user}
            >
              {saving ? 'Saving…' : 'Save Entry'}
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          p: { xs: 1.25, sm: 1.5 },
          borderRadius: 2,
          background: 'rgba(124, 179, 66, 0.1)',
          border: '2px solid rgba(124, 179, 66, 0.3)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
          mx: 0
        }}
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} sx={{ mb: 2 }}>
          <Typography variant="subtitle1" fontWeight={800} sx={{ color: '#E8F5E9' }}>
            Logged Sessions
          </Typography>
          <Chip label={`${logs.length} entries`} color="success" variant="outlined" />
        </Stack>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress color="success" />
          </Box>
        ) : groupedLogs.length === 0 ? (
          <EmptyStateCard
            title="No grow logs yet"
            description="Capture your daily environment, feedings, and canopy changes to unlock AI insights."
            icon={<GrassIcon sx={{ fontSize: 56, color: '#2e7d32' }} />}
            actionLabel="Add first log"
            onAction={() => {
              const section = document.getElementById('grow-log-form');
              if (section) {
                section.scrollIntoView({ behavior: 'smooth' });
              }
            }}
          />
        ) : (
          <Stack spacing={3}>
            {groupedLogs.map(({ label, items }) => (
              <Paper
                key={label}
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 3,
                  border: '1px solid rgba(124, 179, 66, 0.3)',
                  background: 'rgba(124, 179, 66, 0.08)'
                }}
              >
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} sx={{ mb: 1 }}>
                  <Typography variant="subtitle2" fontWeight={800} sx={{ color: '#E8F5E9' }}>
                    {label}
                  </Typography>
                  <Chip label={`${items.length} updates`} size="small" />
                </Stack>
                <Stack spacing={2}>
                  {items.map((log) => (
                    <Paper
                      key={log.id}
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        border: '1px solid rgba(124, 179, 66, 0.2)',
                        background: 'rgba(124, 179, 66, 0.05)'
                      }}
                    >
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between">
                        <Stack spacing={0.5}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Chip label={log.stage || 'Stage?'} size="small" color="success" variant="outlined" />
                            {log.progress?.day && (
                              <Chip label={`Day ${log.progress.day}`} size="small" />
                            )}
                            <Typography variant="caption" sx={{ color: '#C5E1A5' }}>
                              {new Date(log.progress?.entry_date || log.created_at).toLocaleString()}
                            </Typography>
                          </Stack>
                          {log.notes && (
                            <Typography variant="body2" sx={{ color: '#E8F5E9' }}>
                              {log.notes}
                            </Typography>
                          )}
                          {log.progress?.tasks_completed?.length ? (
                            <Typography variant="body2" sx={{ color: '#E8F5E9' }}>
                              Tasks: {log.progress.tasks_completed.join(', ')}
                            </Typography>
                          ) : null}
                          {log.progress?.next_actions?.length ? (
                            <Typography variant="body2" sx={{ color: '#E8F5E9' }}>
                              Next: {log.progress.next_actions.join(', ')}
                            </Typography>
                          ) : null}
                          {log.health_status?.issues?.length ? (
                            <Typography variant="body2" sx={{ color: '#FFB74D' }}>
                              Watch: {log.health_status.issues.join(', ')}
                            </Typography>
                          ) : null}
                          {log.progress?.metrics ? (
                            <Typography variant="caption" sx={{ color: '#C5E1A5' }}>
                              Vitals → Temp {log.progress.metrics.temperature || '—'} | RH {log.progress.metrics.humidity || '—'} | EC {log.progress.metrics.ec || '—'} | pH {log.progress.metrics.ph || '—'}
                            </Typography>
                          ) : null}
                        </Stack>
                        <Stack spacing={1} direction={{ xs: 'row', sm: 'column' }} justifyContent="flex-start" alignItems={{ xs: 'center', sm: 'flex-end' }}>
                          <Tooltip title="Copy share summary">
                            <IconButton color="success" onClick={() => handleCopyShare(log)}>
                              <Share />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Copy raw entry JSON">
                            <IconButton
                              onClick={async () => {
                                try {
                                  await navigator.clipboard.writeText(JSON.stringify(log, null, 2));
                                  setSnackbar({ open: true, message: 'Entry JSON copied.' });
                                } catch {
                                  setError('Unable to copy JSON to clipboard.');
                                }
                              }}
                            >
                              <ContentCopy />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ open: false, message: '' })}
        message={snackbar.message}
      />
    </Stack>
      </Box>
    </Box>
  );
}
