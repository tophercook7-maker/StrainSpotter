import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Stack,
  Card,
  CardContent,
  Button,
  Chip,
  Grid,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import LinkIcon from '@mui/icons-material/Link';
import TroubleshootIcon from '@mui/icons-material/Troubleshoot';
import BarChartIcon from '@mui/icons-material/BarChart';
import { API_BASE } from '../config';
import { useAuth } from '../hooks/useAuth';
import { isAdminEmail } from '../utils/roles';
import { supabase } from '../supabaseClient';

async function authHeaders() {
  if (!supabase) return {};
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function AdminStatus({ onBack, onNavigate }) {
  const { user, loading } = useAuth();
  const [health, setHealth] = useState(null);
  const [apiHealth, setApiHealth] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState(null);

  const isAdmin = useMemo(() => isAdminEmail(user?.email), [user]);

  useEffect(() => {
    if (loading || !isAdmin) return;
    (async () => {
      try {
        const headers = await authHeaders();
        const [rootHealth, apiHealthResp, analyticsSummary] = await Promise.all([
          fetch(`${API_BASE}/health`).then((res) => res.json()),
          fetch(`${API_BASE}/api/health`).then((res) => res.json()),
          fetch(`${API_BASE}/api/analytics/events/summary`, { headers }).then((res) => res.json())
        ]);
        setHealth(rootHealth);
        setApiHealth(apiHealthResp);
        setAnalytics(analyticsSummary);
      } catch (err) {
        console.error('[AdminStatus] Failed to load status:', err);
        setError(err.message || 'Unable to load status page.');
      }
    })();
  }, [loading, isAdmin]);

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAdmin) {
    return (
      <Container maxWidth="sm" sx={{ py: 6 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Admin-only page. Please sign in with an approved admin account.
        </Alert>
        <Button variant="contained" onClick={onBack}>
          Back
        </Button>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', py: 4 }}>
      <Container maxWidth="lg">
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <HealthAndSafetyIcon color="success" />
            <Typography variant="h5" fontWeight={800}>
              Status & Debug
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={onBack}>
              Back
            </Button>
            <Button variant="contained" startIcon={<TroubleshootIcon />} onClick={() => onNavigate?.('errors')}>
              Admin Errors
            </Button>
          </Stack>
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>
                  Environment
                </Typography>
                <Stack spacing={1}>
                  <Chip label={`Mode: ${import.meta.env.MODE}`} size="small" />
                  <Chip label={`API Base: ${API_BASE}`} size="small" icon={<LinkIcon />} />
                  {apiHealth?.rls?.mode && (
                    <Chip
                      label={`RLS Mode: ${apiHealth.rls.mode}`}
                      size="small"
                      color={apiHealth.rls.mode === 'prod' ? 'success' : 'default'}
                    />
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>
                  Backend Health
                </Typography>
                <Stack spacing={1}>
                  <Chip
                    label={`Supabase: ${health?.supabaseConfigured ? 'OK' : 'Missing'}`}
                    color={health?.supabaseConfigured ? 'success' : 'error'}
                    size="small"
                  />
                  <Chip
                    label={`Vision: ${health?.googleVisionConfigured ? health?.visionMethod : 'Missing'}`}
                    color={health?.googleVisionConfigured ? 'success' : 'warning'}
                    size="small"
                  />
                  <Chip
                    label={`Bucket: ${health?.bucketExists ? 'Found' : 'Missing'}`}
                    color={health?.bucketExists ? 'success' : 'warning'}
                    size="small"
                  />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>
                  Links
                </Typography>
                <Stack spacing={1}>
                  <Button
                    variant="outlined"
                    onClick={() => onNavigate?.('moderation')}
                  >
                    Moderation Dashboard
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => onNavigate?.('membership-admin')}
                  >
                    Membership Admin
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
              <BarChartIcon color="primary" />
              <Typography variant="subtitle1" fontWeight={700}>
                Last 7 days of activity
              </Typography>
            </Stack>
            {analytics ? (
              <>
                <Stack direction="row" spacing={2} sx={{ mb: 2, flexWrap: 'wrap' }}>
                  <Chip label={`Scans started: ${analytics.scanStats?.started ?? 0}`} />
                  <Chip label={`Scans completed: ${analytics.scanStats?.completed ?? 0}`} />
                  <Chip
                    label={`Success rate: ${
                      analytics.scanStats?.successRate != null
                        ? `${analytics.scanStats.successRate.toFixed(1)}%`
                        : 'n/a'
                    }`}
                  />
                  <Chip label={`Journal entries: ${analytics.totals?.journal_entry_created ?? 0}`} />
                </Stack>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" gutterBottom>
                  Top matched strains
                </Typography>
                {analytics.topStrains?.length ? (
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {analytics.topStrains.map((strain) => (
                      <Chip
                        key={strain.slug}
                        label={`${strain.name} (${strain.count})`}
                        color="success"
                        variant="outlined"
                      />
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No scan activity logged yet.
                  </Typography>
                )}
              </>
            ) : (
              <CircularProgress size={24} />
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}


