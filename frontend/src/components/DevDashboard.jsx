import { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography, Grid, Alert, Button, CircularProgress, Dialog, DialogTitle, DialogContent, IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';
import { API_BASE } from '../config';
import { testScanUpload } from '../utils/testScanUpload';
import VisionDiagnostic from './VisionDiagnostic';

export default function DevDashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [health, setHealth] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);
  const [showVisionDiag, setShowVisionDiag] = useState(false);
  const host = typeof window !== 'undefined' ? window.location.origin : 'n/a';

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/dev/stats`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setStats(data);
      } catch (e) {
        setError(e.message);
      }
    })();

    // Fetch health check
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/health`);
        const data = await res.json();
        setHealth(data);
      } catch (e) {
        console.error('Health check failed:', e);
      }
    })();
  }, []);

  const dailyNew = (() => {
    const rpt = stats?.importReport;
    if (!rpt) return null;
    return rpt.counts?.matched ?? null;
  })();

  const scraperFoundNew = dailyNew && dailyNew > 0;

  const handleTestScan = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      // Tiny 1x1 transparent PNG for testing
      const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const result = await testScanUpload(base64, 'test.png');
      setTestResult(result);
    } catch (e) {
      setTestResult({ ok: false, error: String(e) });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      {error && <Alert severity="error">{error}</Alert>}
      
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>Dev Dashboard</Typography>

      <Grid container spacing={2}>
        {/* Env / API Info */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary">Environment</Typography>
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2"><strong>Host:</strong> {host}</Typography>
                <Typography variant="body2" sx={{ wordBreak: 'break-all' }}><strong>API_BASE:</strong> {API_BASE}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Strain Stats */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary">Total Strains</Typography>
              <Typography variant="h3" sx={{ fontWeight: 800 }}>{stats?.totalStrains ?? '—'}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary">Daily New (scraped)</Typography>
              <Typography variant="h3" sx={{ fontWeight: 800, color: scraperFoundNew ? 'success.main' : 'text.primary' }}>
                {dailyNew ?? '—'}
              </Typography>
              {scraperFoundNew && (
                <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
                  ✓ Scraper found new strains today
                </Typography>
              )}
              {dailyNew === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  No new strains today
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Health Check */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary">Health Check</Typography>
              {health ? (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2">Supabase: {health.supabaseConfigured ? '✓' : '✗'}</Typography>
                  <Typography variant="body2">Google Vision: {health.googleVisionConfigured ? '✓' : '✗'}</Typography>
                  <Typography variant="body2">Bucket: {health.bucketExists ? '✓' : '✗'}</Typography>
                  <Typography variant="body2" sx={{ color: health.rlsPermissive ? 'success.main' : 'error.main' }}>
                    RLS Permissive: {health.rlsPermissive ? '✓' : '✗ (Run migration!)'}
                  </Typography>
                </Box>
              ) : (
                <Typography variant="body2">Loading...</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Scan Upload Test */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Test Scan Upload (RLS Check)</Typography>
              <Button 
                variant="contained" 
                onClick={handleTestScan} 
                disabled={testing}
                startIcon={testing && <CircularProgress size={20} />}
              >
                {testing ? 'Testing...' : 'Test Scan Upload'}
              </Button>
              {testResult && (
                <Alert severity={testResult.ok ? 'success' : 'error'} sx={{ mt: 2 }}>
                  {testResult.ok ? (
                    <>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>✓ Scan upload successful!</Typography>
                      <Typography variant="body2">ID: {testResult.id}</Typography>
                      <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>URL: {testResult.image_url}</Typography>
                    </>
                  ) : (
                    <>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>✗ Scan upload failed</Typography>
                      <Typography variant="body2">{testResult.error}</Typography>
                      {testResult.error?.toLowerCase().includes('rls') && (
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          <strong>Fix:</strong> Run the migration SQL in Supabase: <code>backend/migrations/2025_create_full_schema.sql</code>
                        </Typography>
                      )}
                    </>
                  )}
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Vision API Diagnostic Tool */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>🔬 Vision API Diagnostic</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Test what Google Vision detects from your images.
              </Typography>
              <Button 
                variant="outlined" 
                onClick={() => setShowVisionDiag(true)}
              >
                Open Vision Diagnostic Tool
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Vision Diagnostic Dialog */}
      <Dialog 
        open={showVisionDiag} 
        onClose={() => setShowVisionDiag(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Vision API Diagnostic</Typography>
            <IconButton onClick={() => setShowVisionDiag(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <VisionDiagnostic />
        </DialogContent>
      </Dialog>
    </Box>
  );
}
