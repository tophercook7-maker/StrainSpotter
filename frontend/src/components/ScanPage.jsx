import { useState, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  Stack,
  CircularProgress,
  Alert,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { API_BASE } from '../config';
import { supabase } from '../supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { useCreditBalance } from '../hooks/useCreditBalance';
import ScanResultCard from './ScanResultCard';
import BuyScansModal from './BuyScansModal';
import JournalDialog from './JournalDialog';
import { logEvent } from '../utils/analyticsClient';

const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

export default function ScanPage({ onNavigate, onBack }) {
  const fileInputRef = useRef(null);
  const { user } = useAuth();
  const { summary, loading: creditsLoading, refresh } = useCreditBalance();
  const [stage, setStage] = useState('idle');
  const [status, setStatus] = useState('');
  const [error, setError] = useState(null);
  const [scanId, setScanId] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [showBuyScans, setShowBuyScans] = useState(false);
  const [reportDialog, setReportDialog] = useState(false);
  const [reportText, setReportText] = useState('');
  const [journalDefaults, setJournalDefaults] = useState(null);
  const [journalOpen, setJournalOpen] = useState(false);

  const creditsRemaining = summary?.creditsRemaining ?? null;
  const tier = summary?.tier;
  const lowBalance = typeof creditsRemaining === 'number' && creditsRemaining > 0 && creditsRemaining <= 5;

  const resetState = () => {
    setStage('idle');
    setStatus('');
    setError(null);
    setScanId(null);
    setScanResult(null);
  };

  const requireAuth = () => {
    if (!user) {
      setError('Sign in to scan strains and compare results.');
      return false;
    }
    return true;
  };

  const handleFileSelect = async (event) => {
    if (!requireAuth()) return;
    const file = event.target.files?.[0];
    if (!file) return;
    setError(null);
    setScanResult(null);
    setStage('upload');
    setStatus('Uploading photo…');

    try {
      logEvent('scan_started', { filename: file.name, size: file.size, type: file.type });
      const base64 = await fileToBase64(file);
      const base64Payload = base64.includes(',') ? base64.split(',')[1] : base64;
      if (!base64Payload || base64Payload.length < 100) {
        throw new Error('Failed to read image data. Please try a different photo.');
      }
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      let contentType = file.type || '';
      if (!contentType) {
        const match = /^data:([^;]+);base64/i.exec(base64.split(',')[0]);
        if (match && match[1]) {
          contentType = match[1];
        }
      }
      const normalizedType = contentType.toLowerCase();
      const sendContentType = allowedTypes.includes(normalizedType) ? normalizedType : undefined;

      const uploadResp = await fetch(`${API_BASE}/api/uploads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-session-id': session?.access_token || '' },
        body: JSON.stringify({
          filename: file.name || `scan-${Date.now()}.jpg`,
          base64: base64Payload,
          ...(sendContentType ? { contentType: sendContentType } : {}),
          user_id: userId
        })
      });

      if (!uploadResp.ok) {
        let payload = {};
        try {
          const text = await uploadResp.text();
          payload = text ? JSON.parse(text) : {};
        } catch (e) {
          payload = { error: `Server error ${uploadResp.status}` };
        }
        logEvent('scan_upload_error', { status: uploadResp.status, error: payload.error || payload.message });
        const errorMsg = payload.error || payload.message || payload.details || `Upload failed with status ${uploadResp.status}. Please check your image and try again.`;
        throw new Error(errorMsg);
      }

      logEvent('scan_upload_success');

      const uploadData = await uploadResp.json();
      if (!uploadData?.id) {
        throw new Error('Upload response missing scan ID');
      }
      setScanId(uploadData.id);

      setStage('processing');
      setStatus('Analyzing with Vision AI…');
      const processResp = await fetch(`${API_BASE}/api/scans/${uploadData.id}/process`, { method: 'POST' });
      if (!processResp.ok) {
        const payload = await processResp.json().catch(() => ({}));
        const errorMsg = payload.message || payload.error || `Processing failed (status ${processResp.status})`;
        throw new Error(errorMsg);
      }

      setStage('matching');
      setStatus('Matching to known strains…');
      const matchResp = await fetch(`${API_BASE}/api/scans/${uploadData.id}/match`, { method: 'POST' });
      if (!matchResp.ok) {
        const payload = await matchResp.json().catch(() => ({}));
        const errorMsg = payload.error || payload.message || `Visual match failed (status ${matchResp.status})`;
        throw new Error(errorMsg);
      }
      const matchData = await matchResp.json();
      setScanResult(matchData);
      logEvent('scan_match_success', {
        scan_id: uploadData.id,
        match: matchData?.match?.strain_slug || null,
        candidates: matchData?.candidates?.length || 0
      });
      setStage('done');
      setStatus('');
      refresh?.();
    } catch (err) {
      console.error('[ScanPage] Failed to complete scan flow:', err);
      logEvent('scan_match_error', { message: err?.message, stage });
      const errorMessage = err?.message || 'Scan failed. Please try again.';
      setError(errorMessage);
      setStage('error');
      setStatus('');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSaveMatch = async () => {
    if (!scanId || !scanResult?.match) return;
    try {
      await fetch(`${API_BASE}/api/scans/${scanId}/save-match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matched_strain_slug: scanResult.match.strain_slug, user_id: user?.id })
      });
    } catch (err) {
      console.warn('[ScanPage] Failed to save match:', err);
    }
  };

  const handleLogExperience = () => {
    if (!scanResult?.match) return;
    setJournalDefaults({
      strain_name: scanResult.match.name,
      strain_slug: scanResult.match.strain_slug
    });
    setJournalOpen(true);
  };

  const handleReportMismatch = async () => {
    if (!requireAuth()) return;
    setReportDialog(true);
  };

  const submitMismatchReport = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await fetch(`${API_BASE}/api/admin/errors/client`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
        },
        body: JSON.stringify({
          message: `Scan mismatch reported: ${reportText}`,
          currentView: '/scan',
          platform: 'web',
          stack: `scanId=${scanId}`
        })
      });
      setReportText('');
      setReportDialog(false);
    } catch (e) {
      console.warn('[ScanPage] Failed to submit mismatch report:', e);
      setReportDialog(false);
    }
  };

  const renderStatusCard = () => {
    if (!stage || stage === 'idle' || stage === 'done') return null;
    return (
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center">
            <CircularProgress size={32} />
            <Box>
              <Typography variant="subtitle1">{status || 'Working…'}</Typography>
              <Typography variant="body2" color="text.secondary">
                This usually takes 5–10 seconds.
              </Typography>
            </Box>
          </Stack>
          <LinearProgress sx={{ mt: 2 }} />
        </CardContent>
      </Card>
    );
  };

  if (!user) {
    return (
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h5">Sign in to start scanning</Typography>
          <Typography variant="body2" sx={{ mt: 1 }} color="text.secondary">
            You’ll unlock AI strain matching, grow logs, and the community once you create an account.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (!creditsLoading && creditsRemaining === 0) {
    return (
      <>
        <OutOfScans
          tier={tier}
          onBuyTopUp={() => setShowBuyScans(true)}
          onUpgrade={() => setShowBuyScans(true)}
        />
        <BuyScansModal open={showBuyScans} onClose={() => setShowBuyScans(false)} />
      </>
    );
  }

  const goBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    if (window.history && window.history.length > 1) {
      window.history.back();
      return;
    }
    // Fallback: emit a navigation event Home listeners can catch
    try {
      window.dispatchEvent(new CustomEvent('navigate', { detail: 'home' }));
    } catch {}
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={goBack}
        sx={{ 
          mb: 2, 
          position: 'sticky', 
          top: 16, 
          zIndex: 1000, 
          backgroundColor: 'background.paper',
          boxShadow: 2,
          minWidth: 140
        }}
        variant="contained"
        color="primary"
        size="large"
      >
        ← Back to Home
      </Button>
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Upload a photo to start
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Take a clear photo of the bud, packaging, or label. We’ll analyze it and suggest the closest known strains.
          </Typography>

          <Button
            variant="contained"
            startIcon={<CloudUploadIcon />}
            onClick={() => fileInputRef.current?.click()}
            disabled={stage === 'upload' || stage === 'processing' || stage === 'matching'}
          >
            Choose photo
          </Button>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />

          {lowBalance && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Only {creditsRemaining} scans remaining. Consider adding a top-up before your next session.
            </Alert>
          )}
        </CardContent>
      </Card>

      {error && stage === 'error' && (
        <Card sx={{ mt: 3, border: '2px solid', borderColor: 'error.main' }}>
          <CardContent>
            <Alert 
              severity="error" 
              sx={{ mb: 2 }} 
              onClose={() => {
                setError(null);
                setStage('idle');
              }}
            >
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                Scan Failed
              </Typography>
              <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                {error}
              </Typography>
            </Alert>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              {onBack && (
                <Button
                  variant="contained"
                  color="error"
                  onClick={() => {
                    setError(null);
                    setStage('idle');
                    onBack();
                  }}
                  startIcon={<ArrowBackIcon />}
                  sx={{ width: { xs: '100%', sm: 'auto' } }}
                >
                  Back to Home
                </Button>
              )}
              <Button
                variant="contained"
                onClick={() => {
                  setError(null);
                  setStage('idle');
                  fileInputRef.current?.click();
                }}
                startIcon={<RestartAltIcon />}
                sx={{ width: { xs: '100%', sm: 'auto' } }}
              >
                Try Again
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}

      {renderStatusCard()}

      {scanResult && stage === 'done' && (
        <ScanResultCard
          result={scanResult}
          onSaveMatch={handleSaveMatch}
          onLogExperience={handleLogExperience}
          onReportMismatch={handleReportMismatch}
          onViewStrain={(candidate) => {
            const slug = candidate?.strain_slug;
            if (slug) {
              onNavigate?.('strains');
              window.dispatchEvent(new CustomEvent('strain:open', { detail: slug }));
            }
          }}
        />
      )}

      {scanResult && (
        <Button
          sx={{ mt: 2 }}
          startIcon={<RestartAltIcon />}
          onClick={resetState}
        >
          Scan another photo
        </Button>
      )}

      <BuyScansModal open={showBuyScans} onClose={() => setShowBuyScans(false)} />

      <Dialog open={reportDialog} onClose={() => setReportDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Report mismatch</DialogTitle>
        <DialogContent>
          <TextField
            multiline
            rows={4}
            fullWidth
            value={reportText}
            onChange={(e) => setReportText(e.target.value)}
            placeholder="Tell us what went wrong so we can improve."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReportDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={submitMismatchReport} disabled={!reportText.trim()}>
            Submit
          </Button>
        </DialogActions>
      </Dialog>

      <JournalDialog
        open={journalOpen}
        defaults={journalDefaults}
        onClose={() => setJournalOpen(false)}
        onSaved={() => setJournalOpen(false)}
      />
    </Box>
  );
}

function OutOfScans({ tier, onBuyTopUp, onUpgrade }) {
  return (
    <Card sx={{ mt: 3 }}>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          You’re out of scans
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          All {tier === 'app_purchase' ? 20 : tier === 'free' ? 10 : 200} scans have been used. Grab a quick top-up or upgrade to keep scanning.
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <Button variant="contained" onClick={onBuyTopUp}>
            Buy top-up
          </Button>
          <Button variant="outlined" onClick={onUpgrade}>
            Upgrade membership
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
