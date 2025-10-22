import { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography, Stack, Chip, Divider, LinearProgress, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { API_BASE } from '../config';

export default function PipelineStatus() {
  const [latest, setLatest] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [l, h] = await Promise.all([
          fetch(`${API_BASE}/api/pipeline/latest`).then(r => r.json()),
          fetch(`${API_BASE}/api/pipeline/history`).then(r => r.json())
        ]);
        setLatest(l);
        setHistory(Array.isArray(h) ? h : [h].filter(Boolean));
      } catch (e) {
        console.error('[Pipeline] load error', e);
        setError('Could not load pipeline status');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', p: 2 }}>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>Data Pipeline</Typography>
      <Typography variant="body1" sx={{ color: 'text.secondary', mb: 2 }}>
        Schedule: Daily at 3:00 AM UTC via GitHub Actions.
      </Typography>
      {loading && <LinearProgress />}
      {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}

      {latest && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Latest Run</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Date: {new Date(latest.date || latest.when || Date.now()).toLocaleString()}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1}>
                <Chip label={`Strains (main): ${latest.totals?.strainsMain ?? '—'}`} color="success" variant="outlined" />
                <Chip label={`Strains (enhanced): ${latest.totals?.strainsEnhanced ?? '—'}`} color="success" variant="outlined" />
              </Stack>
            </Stack>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Import Report</Typography>
            <Stack direction="row" spacing={2} flexWrap="wrap">
              <Chip label={`Attributes: ${latest.report?.counts?.attributes ?? '—'}`} />
              <Chip label={`CSV Rows: ${latest.report?.counts?.csvRows ?? '—'}`} />
              <Chip label={`Matched: ${latest.report?.counts?.matched ?? '—'}`} color="primary" />
              <Chip label={`Unmatched: ${latest.report?.counts?.unmatched ?? '—'}`} color="warning" />
            </Stack>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Run History</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date (UTC)</TableCell>
                <TableCell align="right">Strains (main)</TableCell>
                <TableCell align="right">Strains (enhanced)</TableCell>
                <TableCell align="right">Matched</TableCell>
                <TableCell align="right">Unmatched</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {history.map((h, idx) => (
                <TableRow key={idx} hover>
                  <TableCell>{h.date_utc || (h.date ? new Date(h.date).toISOString().slice(0,10) : '—')}</TableCell>
                  <TableCell align="right">{h.totals?.strainsMain ?? '—'}</TableCell>
                  <TableCell align="right">{h.totals?.strainsEnhanced ?? '—'}</TableCell>
                  <TableCell align="right">{h.report?.counts?.matched ?? '—'}</TableCell>
                  <TableCell align="right">{h.report?.counts?.unmatched ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Box>
  );
}
