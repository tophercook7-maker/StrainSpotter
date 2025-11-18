// frontend/src/components/ScanPage.jsx

import React, { useState, useRef } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import ScanResultCard from './ScanResultCard';
import { useAuth } from '../hooks/useAuth';
import { API_BASE } from '../config';

const GUEST_LIMIT = 20;

function getGuestScansUsed() {
  if (typeof window === 'undefined') return 0;
  const raw = window.localStorage.getItem('ss_guest_scans_used');
  const n = raw ? parseInt(raw, 10) : 0;
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function setGuestScansUsed(n) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem('ss_guest_scans_used', String(n));
}

function apiUrl(path) {
  if (!path.startsWith('/')) path = `/${path}`;
  return `${API_BASE}${path}`;
}

// Normalize backend scan row into the shape ScanResultCard expects,
// including labelInsights from the backend.
function normalizeScanResult(scan) {
  if (!scan || !scan.result) return null;

  const result = scan?.result || {};
  
  // Build matches from visualMatches structure
  let matchesFromVisual = [];
  if (result.visualMatches) {
    // visualMatches.match is the top match (single object)
    // visualMatches.candidates is an array of additional candidates
    const topMatch = result.visualMatches.match;
    const candidates = Array.isArray(result.visualMatches.candidates) 
      ? result.visualMatches.candidates 
      : [];
    
    if (topMatch) {
      matchesFromVisual = [topMatch, ...candidates];
    } else if (candidates.length > 0) {
      matchesFromVisual = candidates;
    }
  }
  
  // Build matches from flat structure (fallback)
  let matchesFromFlat = [];
  if (Array.isArray(result.matches)) {
    matchesFromFlat = result.matches;
  } else if (result.match) {
    matchesFromFlat = [result.match];
  }
  
  // Decide which list to use (prefer visualMatches if available)
  const allMatches = matchesFromVisual.length > 0 ? matchesFromVisual : matchesFromFlat;
  
  // If no matches found, return null so UI shows "No strain match found yet"
  if (allMatches.length === 0) {
    return null;
  }

  // Map each match to normalized format
  const toItem = (candidate) => {
    // Candidates may be serialized (strain fields directly) or have nested strain
    const strainObj = candidate.strain || candidate;
    const confidence = 
      candidate.confidence ?? 
      candidate.score ?? 
      candidate.probability ?? 
      0;
    
    return {
      id: strainObj.strain_slug || strainObj.slug || strainObj.id || strainObj.name || 'unknown',
      name: strainObj.name || 'Unknown strain',
      type: strainObj.type || strainObj.category || 'Hybrid',
      description: strainObj.description || strainObj.summary || '',
      confidence,
      // IMPORTANT: pass through any DB metadata on the strain, if present
      dbMeta: strainObj, // we'll use this in ScanResultCard
    };
  };

  const [first, ...rest] = allMatches;

  // Extract labelInsights from various possible locations
  const labelInsights = 
    result.labelInsights || 
    result.visualMatches?.labelInsights || 
    null;

  return {
    topMatch: toItem(first),
    otherMatches: rest.map(toItem),
    labelInsights,
    aiSummary: labelInsights?.aiSummary || null,
    isPackagedProduct: labelInsights?.isPackagedProduct || false,
  };
}

export default function ScanPage({ onBack, onNavigate }) {
  const { user } = useAuth();
  const isGuest = !user;
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [isOpeningPicker, setIsOpeningPicker] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);
  const [guestScansUsed, setGuestScansUsedState] = useState(() => getGuestScansUsed());
  const [showPlans, setShowPlans] = useState(false);
  
  // Track processed scan IDs to avoid duplicate /process calls
  const processedScanIdsRef = useRef(new Set());

  const handleBack = () => {
    if (onBack) onBack();
  };

  // Helper function to start a scan for a given file
  const startScanForFile = async (file) => {
    if (!file) {
      setError('Choose a photo first.');
      return;
    }

    // Check guest limit before starting
    if (isGuest && guestScansUsed >= GUEST_LIMIT) {
      setShowPlans(true);
      return;
    }

    setError(null);
    setScanResult(null);
    await startScan(file);
  };

  const handleFileChange = (event) => {
    setIsOpeningPicker(false);
    const file = event.target.files?.[0];
    if (!file) return;

    // Clear previous state
    setError(null);
    setScanResult(null);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setIsUploading(false);
    setIsPolling(false);

    // Auto-start scan when file is selected
    startScanForFile(file);
  };

  const handlePickImageClick = () => {
    const input = document.getElementById('scan-file-input');
    if (!input) return;
    // Give instant feedback
    setIsOpeningPicker(true);
    input.click();
  };

  const handleStartScan = async () => {
    // Re-run scan for the currently selected file
    await startScanForFile(selectedFile);
  };

  async function startScan(file) {
    setError(null);

    // Compress image if needed
    const processedFile = await maybeCompressImage(file);
    const base64 = await fileToBase64(processedFile);

    const payload = {
      filename: processedFile.name || 'scan.jpg',
      contentType: processedFile.type || 'image/jpeg',
      base64,
    };

    const res = await fetch(apiUrl('/api/uploads'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await safeJson(res);

    if (!res.ok) {
      // Check if it's a guest limit error
      if (res.status === 403 && data?.error === 'Guest scan limit reached') {
        setShowPlans(true);
        setIsUploading(false);
        setIsPolling(false);
        return;
      }
      throw new Error(data?.error || data?.hint || `Upload failed (${res.status})`);
    }

    const scanId = data.id || data.scan_id || data.scanId;
    if (!scanId) {
      throw new Error('Did not receive a scan id from the server.');
    }

    // Trigger Vision processing (only once per scanId)
    if (!processedScanIdsRef.current.has(scanId)) {
      processedScanIdsRef.current.add(scanId);
      try {
        const processRes = await fetch(apiUrl(`/api/scans/${scanId}/process`), {
          method: 'POST',
        });
        if (!processRes.ok) {
          console.warn('[startScan] Process endpoint returned non-OK:', processRes.status);
        }
      } catch (e) {
        console.error('[startScan] Error triggering scan processing', e);
        // Do not throw here; we'll let pollScan handle timeouts/errors
      }
    }

    setIsUploading(false);
    setIsPolling(true);

    await pollScan(scanId);
  }

  async function pollScan(scanId, attempt = 0) {
    const maxAttempts = 25; // ~25s at 1s delay
    const delayMs = 1000; // 1 second polling interval

    try {
      const res = await fetch(apiUrl(`/api/scans/${scanId}`));
      const data = await safeJson(res);

      if (!res.ok) {
        throw new Error(data?.error || `Scan lookup failed (${res.status})`);
      }

      // Backend may return wrapped { scan: {...} } or direct scan object
      const scan = data?.scan || data;
      
      // Temporary debug log
      console.log('[pollScan] response', data);

      if (!scan) {
        throw new Error('Invalid scan response from server');
      }

      const status = scan?.status || scan?.state || 'unknown';
      const result = scan?.result;

      // Check if scan has a result (matches or visualMatches or labelInsights)
      const hasResult = !!(
        result && (
          (result.visualMatches && (result.visualMatches.match || result.visualMatches.candidates?.length > 0)) ||
          (Array.isArray(result.matches) && result.matches.length > 0) ||
          result.match ||
          result.labelInsights
        )
      );

      // Check if scan is complete
      const isComplete = 
        status === 'done' || 
        status === 'complete' || 
        status === 'completed' || 
        status === 'success';

      // Check if scan has an error
      const isError = 
        status === 'error' || 
        status === 'failed' || 
        !!scan?.error || 
        !!scan?.errorMessage;

      // If scan is complete OR has a result, stop polling and show results
      if (isComplete || hasResult) {
        setIsPolling(false);
        
        // Temporary debug log
        console.log('[pollScan] done', { status, hasResult, result: scan.result });
        
        const normalized = normalizeScanResult(scan);
        if (!normalized) {
          setError('No strain match found yet. Try a clearer photo or different angle.');
          setScanResult(null);
        } else {
          setScanResult(normalized);

          // Count successful guest scans
          if (isGuest) {
            const used = guestScansUsed + 1;
            setGuestScansUsedState(used);
            setGuestScansUsed(used);
          }
        }
        return;
      }

      // If scan has an error status or error field, stop polling and show error
      if (isError) {
        setIsPolling(false);
        const errorMessage = scan?.error || scan?.errorMessage || 'Scan failed on the server.';
        setError(errorMessage);
        return;
      }

      // If we've hit max attempts, stop polling
      if (attempt >= maxAttempts) {
        setIsPolling(false);
        setError('Scan is taking too long. Please try again with a clearer photo.');
        return;
      }

      // Otherwise, schedule another poll attempt
      setTimeout(() => {
        pollScan(scanId, attempt + 1);
      }, delayMs);
    } catch (e) {
      console.error('pollScan error', e);
      setIsPolling(false);
      setError(String(e.message || e));
    }
  }

  // Lightweight image compression for large files
  async function maybeCompressImage(file) {
    const MAX_SIZE = 2 * 1024 * 1024; // 2MB
    const MAX_DIMENSION = 1600;
    const QUALITY = 0.7;

    if (file.size <= MAX_SIZE) {
      return file; // No compression needed
    }

    try {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            // Calculate new dimensions maintaining aspect ratio
            let width = img.width;
            let height = img.height;
            
            if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
              if (width > height) {
                height = (height / width) * MAX_DIMENSION;
                width = MAX_DIMENSION;
              } else {
                width = (width / height) * MAX_DIMENSION;
                height = MAX_DIMENSION;
              }
            }

            // Create canvas and compress
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
              (blob) => {
                if (blob) {
                  const compressedFile = new File([blob], file.name, {
                    type: 'image/jpeg',
                    lastModified: Date.now(),
                  });
                  resolve(compressedFile);
                } else {
                  resolve(file); // Fallback to original
                }
              },
              'image/jpeg',
              QUALITY
            );
          };
          img.onerror = () => resolve(file); // Fallback to original
          img.src = e.target.result;
        };
        reader.onerror = () => resolve(file); // Fallback to original
        reader.readAsDataURL(file);
      });
    } catch (e) {
      console.warn('[ScanPage] Image compression failed, using original:', e);
      return file; // Fallback to original
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
          pt: 'calc(env(safe-area-inset-top) + 20px)',
          pb: 4,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Back button */}
        <Box sx={{ mb: 2, mt: 0, pt: 0, display: 'flex', alignItems: 'center' }}>
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
            Choose or take a photo of a cannabis product or bud. We'll analyze
            it and show you the closest strain matches.
          </Typography>
        </Box>

        {/* Signed-in hint (non-blocking) */}
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
                    Tap below to take a new photo or choose one from your
                    library.
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
                disabled={isUploading || isPolling}
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
                {isOpeningPicker ? 'Opening camera…' : 'Take or choose photo'}
              </Button>

              <Button
                variant="outlined"
                fullWidth
                size="large"
                onClick={handleStartScan}
                disabled={!selectedFile || isUploading || isPolling}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                py: 1.1,
                borderRadius: 2,
                borderColor: selectedFile ? '#9CCC65' : 'rgba(200, 230, 201, 0.4)',
                color: selectedFile ? '#C5E1A5' : 'rgba(224, 242, 241, 0.6)',
                '&:hover': {
                  borderColor: selectedFile ? '#CDDC39' : 'rgba(200, 230, 201, 0.4)',
                  backgroundColor: selectedFile
                    ? 'rgba(156, 204, 101, 0.12)'
                    : 'transparent',
                },
              }}
            >
              {isUploading
                ? 'Uploading photo…'
                : isPolling
                ? 'Analyzing…'
                : selectedFile
                ? 'Start scan'
                : 'Choose a photo to enable scan'}
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
                    : 'Analyzing your package...'}
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
            isGuest={isGuest}
            onSaveMatch={undefined}
            onLogExperience={undefined}
            onReportMismatch={undefined}
            onViewStrain={undefined}
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
            After you scan, we'll show you the best match and similar strains
            here.
          </Typography>
        )}
      </Container>

      {/* Plans popup for guests who hit the limit */}
      <Dialog
        open={showPlans}
        onClose={() => setShowPlans(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Get more scans</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 2 }}>
            You've used your 20 free guest scans. Join the garden to unlock full
            access and auto-refreshing monthly scan bundles.
          </Typography>
          <Stack spacing={2}>
            <Button
              variant="contained"
              fullWidth
              onClick={() => {
                setShowPlans(false);
                onNavigate?.('membership');
              }}
            >
              View membership plans
            </Button>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => {
                setShowPlans(false);
                onNavigate?.('buy-scans');
              }}
            >
              Buy additional scan packs
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPlans(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
