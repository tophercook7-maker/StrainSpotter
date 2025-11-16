import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Stack,
  Button,
  CircularProgress,
  Chip,
  Card,
  CardContent,
  Divider,
  Select,
  MenuItem
} from '@mui/material';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import { supabase } from '../supabaseClient';
import { API_BASE } from '../config';
import EmptyStateCard from './EmptyStateCard';
import JournalDialog from './JournalDialog';

export default function JournalPage({ onBack }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogDefaults, setDialogDefaults] = useState(null);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;
      if (!token) {
        setEntries([]);
        setLoading(false);
        return;
      }
      const resp = await fetch(`${API_BASE}/api/journals`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const payload = await resp.json().catch(() => ([]));
      if (!resp.ok) throw new Error(payload.error || 'Failed to load journal entries.');
      setEntries(Array.isArray(payload) ? payload : []);
    } catch (err) {
      setError(err.message || 'Unable to load journals.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const grouped = useMemo(() => {
    const filtered = filter === 'all' ? entries : entries.filter((entry) => entry.strain_slug === filter);
    const map = new Map();
    filtered.forEach((entry) => {
      const dateKey = entry.entry_date || entry.created_at?.split('T')[0] || 'Unknown Date';
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey).push(entry);
    });
    return Array.from(map.entries()).sort((a, b) => new Date(b[0]) - new Date(a[0]));
  }, [entries, filter]);

  const strains = useMemo(() => {
    const set = new Set();
    entries.forEach((entry) => {
      if (entry.strain_slug) {
        set.add(entry.strain_slug);
      }
    });
    return Array.from(set);
  }, [entries]);

  const renderEntry = (entry) => (
    <Card key={entry.id} variant="outlined" sx={{ mb: 1.5, background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.12)' }}>
      <CardContent>
        <Stack spacing={1}>
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="subtitle1" fontWeight={700}>
              {entry.strain_name || entry.strain_slug || 'Unknown strain'}
            </Typography>
            {entry.rating ? (
              <Chip size="small" color="success" label={`${entry.rating}/5`} />
            ) : null}
          </Stack>
          {entry.notes && (
            <Typography variant="body2">{entry.notes}</Typography>
          )}
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {entry.method && <Chip size="small" label={entry.method} />}
            {entry.dosage && <Chip size="small" label={entry.dosage} />}
            {entry.time_of_day && <Chip size="small" label={entry.time_of_day} />}
            {(entry.tags || []).map((tag) => (
              <Chip key={tag} size="small" variant="outlined" label={`#${tag}`} />
            ))}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ minHeight: '100vh', py: 4 }}>
      <Container maxWidth="md">
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <LibraryBooksIcon sx={{ color: '#7CB342' }} />
            <Typography variant="h5" fontWeight={800}>
              Journal
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={onBack}>
              Back
            </Button>
            <Button variant="contained" onClick={() => { setDialogDefaults(null); setDialogOpen(true); }}>
              New entry
            </Button>
          </Stack>
        </Stack>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <CircularProgress />
          </Box>
        )}

        {!loading && error && (
          <EmptyStateCard
            title="Unable to load journal"
            description={error}
            actionLabel="Retry"
            onAction={loadEntries}
          />
        )}

        {!loading && !error && entries.length === 0 && (
          <EmptyStateCard
            title="No entries yet"
            description="Capture how each strain made you feel, the dosage, and what you’d change next time."
            actionLabel="Scan your first strain"
            onAction={() => window.dispatchEvent(new CustomEvent('nav:set-view', { detail: 'scanner' }))}
            secondaryActionLabel="Add a manual entry"
            onSecondaryAction={() => setDialogOpen(true)}
          />
        )}

        {!loading && !error && entries.length > 0 && (
          <>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }} alignItems="center">
              <Typography variant="body2" color="text.secondary">
                Filter by strain
              </Typography>
              <Select
                size="small"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                sx={{ minWidth: 200 }}
              >
                <MenuItem value="all">All strains</MenuItem>
                {strains.map((slug) => (
                  <MenuItem key={slug} value={slug}>
                    {slug}
                  </MenuItem>
                ))}
              </Select>
            </Stack>
            <Stack spacing={3}>
              {grouped.map(([date, dayEntries]) => (
                <Box key={date}>
                  <Typography variant="subtitle2" sx={{ textTransform: 'capitalize', color: 'rgba(255,255,255,0.7)' }}>
                    {new Date(date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                  </Typography>
                  <Divider sx={{ my: 1, opacity: 0.2 }} />
                  {dayEntries.map(renderEntry)}
                </Box>
              ))}
            </Stack>
          </>
        )}
      </Container>
      <JournalDialog
        open={dialogOpen}
        defaults={dialogDefaults}
        onClose={() => setDialogOpen(false)}
        onSaved={() => {
          setDialogOpen(false);
          loadEntries();
        }}
      />
    </Box>
  );
}


