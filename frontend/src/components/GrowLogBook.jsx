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

export default function GrowLogBook() {
  const [form, setForm] = useState(() => initialForm());
  const [logs, setLogs] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });

  const loadUserAndLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await supabase.auth.getSession();
      const sessionUser = data?.session?.user || null;
      setUser(sessionUser);

      if (!sessionUser?.id) {
        setLogs([]);
        setLoading(false);
        return;
      }

      const resp = await fetch(`${API_BASE}/api/growlogs?user_id=${sessionUser.id}`);
      if (!resp.ok) {
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

      const resp = await fetch(`${API_BASE}/api/growlogs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  return (
    <Stack spacing={3}>
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 3,
          background: 'rgba(255,255,255,0.96)',
          border: '1px solid rgba(0,0,0,0.08)'
        }}
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }}>
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <NoteAdd sx={{ color: '#7CB342' }} />
              <Typography variant="h6" fontWeight={800}>
                Capture Today’s Grow Session
              </Typography>
            </Stack>
            <Typography variant="body2" sx={{ color: '#333', maxWidth: 520 }}>
              Log environment vitals, training moves, feed adjustments, and AI prompts so every run builds on real data. Entries sync with your private grow log and can be shared with peers in a single tap.
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
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {!user && !loading && (
        <Alert severity="info">
          Sign in to unlock the Grow Logbook and keep detailed records of every run.
        </Alert>
      )}

      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 3,
          background: 'rgba(255,255,255,0.97)',
          border: '1px solid rgba(0,0,0,0.08)'
        }}
      >
        <Stack spacing={2}>
          <Typography variant="subtitle1" fontWeight={800}>
            Log Entry
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Grow / Run Label"
                value={form.runLabel}
                onChange={handleFormChange('runLabel')}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                label="Day"
                value={form.day}
                onChange={handleFormChange('day')}
                fullWidth
                type="number"
                inputProps={{ min: 0 }}
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
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Strain (slug or nickname)"
                value={form.strainSlug}
                onChange={handleFormChange('strainSlug')}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Growth Stage"
                select
                value={form.stage}
                onChange={handleFormChange('stage')}
                fullWidth
              >
                {stageOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Session Notes / Highlights"
                value={form.notes}
                onChange={handleFormChange('notes')}
                multiline
                minRows={3}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Key Highlight"
                value={form.highlight}
                onChange={handleFormChange('highlight')}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Tasks Completed (comma separated)"
                value={form.tasksCompleted}
                onChange={handleFormChange('tasksCompleted')}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Upcoming Actions (comma separated)"
                value={form.nextActions}
                onChange={handleFormChange('nextActions')}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Nutrients or additives"
                value={form.nutrientsUsed}
                onChange={handleFormChange('nutrientsUsed')}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Medium"
                value={form.medium}
                onChange={handleFormChange('medium')}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Water volume / feed rate"
                value={form.waterVolume}
                onChange={handleFormChange('waterVolume')}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Environment Notes"
                value={form.environmentNotes}
                onChange={handleFormChange('environmentNotes')}
                multiline
                minRows={2}
                fullWidth
              />
            </Grid>
          </Grid>

          <Divider />

          <Typography variant="subtitle2" fontWeight={700}>
            Vital Metrics
          </Typography>
          <Grid container spacing={2}>
            {Object.entries(form.metrics).map(([key, value]) => (
              <Grid item xs={6} sm={4} md={3} key={key}>
                <TextField
                  label={key.toUpperCase()}
                  value={value}
                  onChange={handleFormChange(`metrics.${key}`)}
                  fullWidth
                />
              </Grid>
            ))}
          </Grid>

          <Divider />

          <Typography variant="subtitle2" fontWeight={700}>
            Health Check
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                label="Plant vigor"
                value={form.vigor}
                onChange={handleFormChange('vigor')}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Health Issues (comma separated)"
                value={form.healthIssues}
                onChange={handleFormChange('healthIssues')}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Pest check result"
                value={form.pestCheck}
                onChange={handleFormChange('pestCheck')}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Corrective actions (comma separated)"
                value={form.remedies}
                onChange={handleFormChange('remedies')}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="AI prompt to revisit"
                value={form.aiPrompt}
                onChange={handleFormChange('aiPrompt')}
                fullWidth
              />
            </Grid>
          </Grid>

          <Divider />

          <Typography variant="subtitle2" fontWeight={700}>
            Media & Sharing
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <TextField
                label="Image URLs (comma separated)"
                value={form.imageUrls}
                onChange={handleFormChange('imageUrls')}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControlLabel
                control={<Switch checked={form.shareEnabled} onChange={handleToggleShare} color="success" />}
                label="Generate share summary"
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
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Share tags (comma separated)"
                    value={form.shareTags}
                    onChange={handleFormChange('shareTags')}
                    fullWidth
                  />
                </Grid>
              </>
            )}
          </Grid>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="flex-end">
            <Button
              variant="outlined"
              startIcon={<AutoAwesome />}
              onClick={() => {
                const autoShare = [
                  `${form.runLabel || 'Grow Log'} – ${form.stage}`,
                  form.highlight && `Highlight: ${form.highlight}`,
                  form.tasksCompleted && `Tasks: ${form.tasksCompleted}`,
                  form.nextActions && `Next: ${form.nextActions}`
                ]
                  .filter(Boolean)
                  .join('\n');
                setForm((prev) => ({ ...prev, shareMessage: autoShare }));
              }}
            >
              Generate Summary
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
          p: 3,
          borderRadius: 3,
          background: 'rgba(255,255,255,0.97)',
          border: '1px solid rgba(0,0,0,0.08)'
        }}
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} sx={{ mb: 2 }}>
          <Typography variant="subtitle1" fontWeight={800}>
            Logged Sessions
          </Typography>
          <Chip label={`${logs.length} entries`} color="success" variant="outlined" />
        </Stack>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress color="success" />
          </Box>
        ) : groupedLogs.length === 0 ? (
          <Alert severity="info">
            No log entries yet. Start by documenting today’s tasks and vitals above.
          </Alert>
        ) : (
          <Stack spacing={3}>
            {groupedLogs.map(({ label, items }) => (
              <Paper
                key={label}
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 3,
                  border: '1px solid rgba(0,0,0,0.06)',
                  background: 'rgba(255,255,255,0.92)'
                }}
              >
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} sx={{ mb: 1 }}>
                  <Typography variant="subtitle2" fontWeight={800} sx={{ color: '#2e7d32' }}>
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
                        border: '1px solid rgba(0,0,0,0.05)',
                        background: 'rgba(250,250,250,0.95)'
                      }}
                    >
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between">
                        <Stack spacing={0.5}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Chip label={log.stage || 'Stage?'} size="small" color="success" variant="outlined" />
                            {log.progress?.day && (
                              <Chip label={`Day ${log.progress.day}`} size="small" />
                            )}
                            <Typography variant="caption" sx={{ color: '#666' }}>
                              {new Date(log.progress?.entry_date || log.created_at).toLocaleString()}
                            </Typography>
                          </Stack>
                          {log.notes && (
                            <Typography variant="body2" sx={{ color: '#1b5e20' }}>
                              {log.notes}
                            </Typography>
                          )}
                          {log.progress?.tasks_completed?.length ? (
                            <Typography variant="body2" sx={{ color: '#2f4f2f' }}>
                              Tasks: {log.progress.tasks_completed.join(', ')}
                            </Typography>
                          ) : null}
                          {log.progress?.next_actions?.length ? (
                            <Typography variant="body2" sx={{ color: '#2f4f2f' }}>
                              Next: {log.progress.next_actions.join(', ')}
                            </Typography>
                          ) : null}
                          {log.health_status?.issues?.length ? (
                            <Typography variant="body2" sx={{ color: '#c62828' }}>
                              Watch: {log.health_status.issues.join(', ')}
                            </Typography>
                          ) : null}
                          {log.progress?.metrics ? (
                            <Typography variant="caption" sx={{ color: '#455a64' }}>
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
  );
}
