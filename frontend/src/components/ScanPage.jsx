// frontend/src/components/ScanPage.jsx

import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Stack,
  Container,
  Paper,
  CircularProgress,
  Alert,
  IconButton,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import ScanResultCard from './ScanResultCard';
import { useAuth } from '../hooks/useAuth';

// Helper to build API URL based on VITE_API_BASE_URL if present
const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

function apiUrl(path) {
  if (!path.startsWith('/')) path = `/${path}`;
  return API_BASE ? `${API_BASE}${path}` : path;
}

// Convert backend scan row into the shape ScanResultCard expects
function normalizeScanResult(scan) {
  if (!scan || !scan.result) return null;

  const matches = scan.result.matches || scan.result.match || [];
  const list = Array.isArray(matches) ? matches : [matches];
  if (!list.length) return null;

  const [first, ...rest] = list;
  const toItem = (m) => {
    const s = m.strain || {};
    const confidence = m.confidence ?? m.score ?? 0;
    return {
      id: s.slug || s.id || s.name || 'unknown',
      name: s.name || 'Unknown strain',
      type: s.type || 'Hybrid',
      description: s.description || '',
      confidence,
    };
  };

  return {
    topMatch: toItem(first),
    otherMatches: rest.map(toItem),
  };
}

export default function ScanPage({ onBack, onNavigate }) {
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);

  const handleBack = () => {
    if (onBack) onBack();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setScanResult(null);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));

    await startScan(file);
  };

  const handlePickImageClick = () => {
    const input = document.getElementById('scan-file-input');
    if (input) {
      input.click();
    }
  };

  async function startScan(file) {
    try {
      setIsUploading(true);
      setIsPolling(false);
      setError(null);
      setScanResult(null);

      const base64 = await fileToBase64(file);

      const payload = {
        filename: file.name || 'scan.jpg',
        contentType: file.type || 'image/jpeg',
        base64,
      };

      const res = await fetch(apiUrl('/api/uploads'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await safeJson(res);
        throw new Error(data?.error || `Upload failed (${res.status})`);
      }

      const data = await res.json();
      const scanId = data.id || data.scan_id || data.scanId;
      if (!scanId) {
        throw new Error('Did not receive a scan id from the server.');
      }

      setIsUploading(false);
      setIsPolling(true);

      await pollScan(scanId);
    } catch (e) {
      console.error('startScan error', e);
      setIsUploading(false);
      setIsPolling(false);
      setError(String(e.message || e));
    }
  }

  async function pollScan(scanId, attempt = 0) {
    const maxAttempts = 25; // ~37.5s at 1.5s delay
    const delayMs = 1500;

    try {
      const res = await fetch(apiUrl(`/api/scans/${scanId}`));
      const data = await safeJson(res);

      if (!res.ok) {
        throw new Error(data?.error || `Scan lookup failed (${res.status})`);
      }

      const scan = data.scan || data;
      const status = scan.status || scan.state || 'unknown';

      if (status === 'complete' || status === 'done' || scan.result) {
        setIsPolling(false);
        const normalized = normalizeScanResult(scan);
        if (!normalized) {
          setError('No strain match found yet. Try a clearer photo or different angle.');
          setScanResult(null);
        } else {
          setScanResult(normalized);
        }
        return;
      }

      if (status === 'error') {
        setIsPolling(false);
        setError(scan.error || 'Scan failed on the server.');
        return;
      }

      if (attempt >= maxAttempts) {
        setIsPolling(false);
        setError('Scan is taking too long. Please try again with a clearer photo.');
        return;
      }

      // Wait before polling again
      setTimeout(() => {
        pollScan(scanId, attempt + 1);
      }, delayMs);
    } catch (e) {
      console.error('pollScan error', e);
      setIsPolling(false);
      setError(String(e.message || e));
    }
  }

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        try {
          const result = reader.result || '';
          const base64 = typeof result === 'string' ? result.split(',').pop() : '';
          resolve(base64 || '');
        } catch (e) {
          reject(e);
        }
      };
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  }

  async function safeJson(res) {
    try {
      return await res.json();
    } catch {
      return null;
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        backgroundColor: '#050705',
        backgroundImage: 'url(/strainspotter-bg.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Subtle overlay */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at top, rgba(124,179,66,0.25), transparent 55%)',
          pointerEvents: 'none',
        }}
      />

      {/* Content */}
      <Container
        maxWidth="sm"
        sx={{
          position: 'relative',
          zIndex: 1,
          pt: 2,
          pb: 4,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Back button */}
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
          <IconButton
            onClick={handleBack}
            sx={{
              mr: 1,
              color: '#C5E1A5',
            }}
            aria-label="Back"
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography
            variant="subtitle2"
            sx={{ color: '#A5D6A7', fontWeight: 500 }}
          >
            Back to home
          </Typography>
        </Box>

        {/* Header */}
        <Box sx={{ mb: 2 }}>
          <Typography
            variant="h5"
            sx={{
              color: '#F1F8E9',
              fontWeight: 700,
              mb: 0.5,
            }}
          >
            Scan a strain
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: 'rgba(224, 242, 241, 0.9)' }}
          >
            Upload a photo of a cannabis product or bud. We’ll analyze the
            label, colors, and visual features to find the closest strains in
            your library.
          </Typography>
        </Box>

        {/* User hint (non-blocking) */}
        {user && (
          <Typography
            variant="caption"
            sx={{ color: '#9CCC65', mb: 1.5 }}
          >
            Signed in as {user.email}. Your scans will be saved to your account.
          </Typography>
        )}

        {/* Main card */}
        <Paper
          elevation={6}
          sx={{
            p: 2.5,
            borderRadius: 3,
            background: 'rgba(12, 20, 12, 0.95)',
            border: '1px solid rgba(124, 179, 66, 0.6)',
            boxShadow: '0 18px 40px rgba(0, 0, 0, 0.7)',
            mb: 3,
          }}
        >
          <Stack spacing={2}>
            {/* Image preview or placeholder */}
            <Box
              sx={{
                borderRadius: 2,
                border: '1px dashed rgba(200, 230, 201, 0.5)',
                minHeight: 180,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                background:
                  'radial-gradient(circle at top, rgba(76, 175, 80, 0.15), rgba(0, 0, 0, 0.95))',
              }}
            >
              {previewUrl ? (
                <Box
                  component="img"
                  src={previewUrl}
                  alt="Selected to scan"
                  sx={{ width: '100%', maxHeight: 280, objectFit: 'cover' }}
                />
              ) : (
                <Stack spacing={1} alignItems="center">
                  <CameraAltIcon sx={{ fontSize: 40, color: '#A5D6A7' }} />
                  <Typography
                    variant="body2"
                    sx={{ color: 'rgba(224, 242, 241, 0.9)' }}
                  >
                    Tap below to choose a photo of a label or bud.
                  </Typography>
                </Stack>
              )}
            </Box>

            {/* Hidden file input */}
            <input
              id="scan-file-input"
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />

            {/* Actions */}
            <Stack spacing={1.5}>
              <Button
                variant="contained"
                fullWidth
                size="large"
                startIcon={<CloudUploadIcon />}
                onClick={handlePickImageClick}
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  py: 1.3,
                  borderRadius: 2,
                  background:
                    'linear-gradient(135deg, #7CB342 0%, #9CCC65 50%, #CDDC39 100%)',
                  boxShadow:
                    '0 8px 32px rgba(124, 179, 66, 0.5), 0 0 40px rgba(124, 179, 66, 0.3)',
                  '&:hover': {
                    background:
                      'linear-gradient(135deg, #8BC34A 0%, #AED581 50%, #CDDC39 100%)',
                    boxShadow:
                      '0 12px 40px rgba(124, 179, 66, 0.7), 0 0 60px rgba(124, 179, 66, 0.4)',
                  },
                }}
              >
                Choose photo to scan
              </Button>

              <Typography
                variant="caption"
                sx={{ color: 'rgba(224, 242, 241, 0.8)' }}
              >
                Clear, close-up photos of labels or flowers give the best
                results.
              </Typography>
            </Stack>

            {/* Status */}
            {(isUploading || isPolling) && (
              <Stack
                direction="row"
                spacing={2}
                alignItems="center"
                sx={{ mt: 1 }}
              >
                <CircularProgress size={22} sx={{ color: '#CDDC39' }} />
                <Typography
                  variant="body2"
                  sx={{ color: 'rgba(224, 242, 241, 0.9)' }}
                >
                  {isUploading
                    ? 'Uploading photo securely...'
                    : 'Analyzing image and matching strains...'}
                </Typography>
              </Stack>
            )}

            {error && (
              <Alert
                severity="warning"
                sx={{
                  mt: 1.5,
                  backgroundColor: 'rgba(255, 244, 179, 0.08)',
                  color: '#FFF59D',
                  '& .MuiAlert-icon': { color: '#FFEE58' },
                }}
              >
                {error}
              </Alert>
            )}
          </Stack>
        </Paper>

        {/* Results */}
        {scanResult && (
          <ScanResultCard
            result={scanResult}
            onSaveMatch={() => {}}
            onLogExperience={() => {}}
            onReportMismatch={() => {}}
            onViewStrain={() => {}}
          />
        )}

        {!scanResult && !isUploading && !isPolling && !error && (
          <Typography
            variant="body2"
            sx={{
              color: 'rgba(224, 242, 241, 0.8)',
              textAlign: 'center',
            }}
          >
            After you scan, we’ll show you the best match and similar strains
            here.
          </Typography>
        )}
      </Container>
    </Box>
  );
}