import React, { useEffect, useState } from "react";
import { Box, Container, Typography, Stack, Paper, Chip, CircularProgress, Alert } from "@mui/material";
import { API_BASE } from "../config";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import IconButton from '@mui/material/IconButton';

function AnalyticsDashboard({ onBack }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchSummary() {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(`${API_BASE}/api/analytics/summary`);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = await res.json();
        if (!cancelled) setSummary(data);
      } catch (e) {
        if (!cancelled) setError(String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchSummary();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        backgroundColor: '#050705',
        backgroundImage: 'url(/strainspotter-bg.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'relative',
      }}
    >
      <Container
        maxWidth="md"
        sx={{
          pt: 'calc(env(safe-area-inset-top) + 20px)',
          pb: 4,
        }}
      >
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={onBack} sx={{ color: '#C5E1A5' }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" sx={{ color: '#F1F8E9', fontWeight: 700 }}>
            Analytics
          </Typography>
        </Box>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress sx={{ color: '#CDDC39' }} />
          </Box>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {!loading && !error && summary && (
          <Stack spacing={3}>
            <Paper
              elevation={6}
              sx={{
                p: 3,
                background: 'rgba(12, 20, 12, 0.95)',
                border: '1px solid rgba(124, 179, 66, 0.6)',
                borderRadius: 3,
              }}
            >
              <Typography variant="h6" sx={{ color: '#F1F8E9', mb: 2, fontWeight: 600 }}>
                Total Scans: {summary.totalScans || 0}
              </Typography>
            </Paper>

            <Paper
              elevation={6}
              sx={{
                p: 3,
                background: 'rgba(12, 20, 12, 0.95)',
                border: '1px solid rgba(124, 179, 66, 0.6)',
                borderRadius: 3,
              }}
            >
              <Typography variant="h6" sx={{ color: '#F1F8E9', mb: 2, fontWeight: 600 }}>
                Top Strains
              </Typography>
              {summary.topStrains?.length ? (
                <Stack spacing={1}>
                  {summary.topStrains.map((s) => (
                    <Box key={s.name} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body1" sx={{ color: '#F1F8E9' }}>
                        {s.name}
                      </Typography>
                      <Chip label={s.count} size="small" color="success" />
                    </Box>
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" sx={{ color: 'rgba(224, 242, 241, 0.8)' }}>
                  No strain data yet.
                </Typography>
              )}
            </Paper>

            <Paper
              elevation={6}
              sx={{
                p: 3,
                background: 'rgba(12, 20, 12, 0.95)',
                border: '1px solid rgba(124, 179, 66, 0.6)',
                borderRadius: 3,
              }}
            >
              <Typography variant="h6" sx={{ color: '#F1F8E9', mb: 2, fontWeight: 600 }}>
                Top Brands
              </Typography>
              {summary.topBrands?.length ? (
                <Stack spacing={1}>
                  {summary.topBrands.map((b) => (
                    <Box key={b.name} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body1" sx={{ color: '#F1F8E9' }}>
                        {b.name}
                      </Typography>
                      <Chip label={b.count} size="small" color="success" />
                    </Box>
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" sx={{ color: 'rgba(224, 242, 241, 0.8)' }}>
                  No brand data yet.
                </Typography>
              )}
            </Paper>

            <Paper
              elevation={6}
              sx={{
                p: 3,
                background: 'rgba(12, 20, 12, 0.95)',
                border: '1px solid rgba(124, 179, 66, 0.6)',
                borderRadius: 3,
              }}
            >
              <Typography variant="h6" sx={{ color: '#F1F8E9', mb: 2, fontWeight: 600 }}>
                THC Potency Distribution
              </Typography>
              <Stack spacing={1}>
                {summary.potencyBuckets &&
                  Object.entries(summary.potencyBuckets).map(([bucket, count]) => (
                    <Box key={bucket} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body1" sx={{ color: '#F1F8E9' }}>
                        {bucket === 'unknown' ? 'Unknown' : `${bucket}%`}
                      </Typography>
                      <Chip label={count} size="small" color="success" />
                    </Box>
                  ))}
              </Stack>
            </Paper>
          </Stack>
        )}
      </Container>
    </Box>
  );
}

export default AnalyticsDashboard;

