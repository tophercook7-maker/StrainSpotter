// frontend/src/components/ScanPage.jsx

import React, { useState, useRef, useEffect } from 'react';
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
  Skeleton,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import ScanResultCard from './ScanResultCard';
import ScanAISummaryPanel from './ScanAISummaryPanel';
import StrainResultCard from './StrainResultCard';
import { useAuth } from '../hooks/useAuth';
import { useMembership } from '../membership/MembershipContext';
import { API_BASE } from '../config';
import { normalizeScanResult } from '../utils/scanResultUtils';
import { resizeImageToBase64 } from '../utils/resizeImageToBase64';

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

export default function ScanPage({ onBack, onNavigate }) {
  const { user } = useAuth();
  const {
    isMember,
    starterRemaining,
    memberRemaining,
    memberCap,
    extraCredits,
    totalAvailableScans,
    starterCap,
    registerScanConsumed,
  } = useMembership();
  const isGuest = !user;
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [isOpeningPicker, setIsOpeningPicker] = useState(false);
  const [isChoosingFile, setIsChoosingFile] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);
  const [hasCompletedScan, setHasCompletedScan] = useState(false); // Flag to prevent timeout race condition
  const [guestScansUsed, setGuestScansUsedState] = useState(() => getGuestScansUsed());
  const [showPlans, setShowPlans] = useState(false);
  
  // Multi-angle capture state
  const [capturedFrames, setCapturedFrames] = useState([]); // Array of { file, previewUrl }
  const [multiAngleMode, setMultiAngleMode] = useState(false); // Toggle for multi-angle mode
  const MAX_FRAMES = 3;
  
  // Now everyone depends on totalAvailableScans, including members.
  const canScan = totalAvailableScans > 0;
  const [scanPhase, setScanPhase] = useState('camera-loading'); // 'camera-loading' | 'ready' | 'capturing' | 'uploading' | 'processing' | 'done' | 'error'
  const [statusMessage, setStatusMessage] = useState('Opening scanner…');
  
  // Structured scan status state
  const [scanStatus, setScanStatus] = useState({
    phase: 'idle',
    message: '',
    details: '',
  });
  
  // Structured error state
  const [scanError, setScanError] = useState(null); // { type, message, details, scanId }
  
  // Current scan ID for tracking
  const [currentScanId, setCurrentScanId] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [lastPhotoUrl, setLastPhotoUrl] = useState(null);
  const [framePulsing, setFramePulsing] = useState(false);
  
  // View state management
  const [activeView, setActiveView] = useState('scanner'); // 'scanner' | 'result'
  const [completedScan, setCompletedScan] = useState(null); // holds the scan record / payload for the result page
  
  // Track processed scan IDs to avoid duplicate /process calls
  const processedScanIdsRef = useRef(new Set());
  // Track if scan has completed to prevent timeout race condition
  const hasCompletedScanRef = useRef(false);

  // On mount, simulate camera loading then become ready
  useEffect(() => {
    setScanPhase('camera-loading');
    setStatusMessage('Opening scanner…');
    const t = setTimeout(() => {
      setCameraReady(true);
      setScanPhase('ready');
      setStatusMessage('Take or choose a photo of any weed product or packaging.');
    }, 200);
    return () => clearTimeout(t);
  }, []);

  // Cleanup image URLs on unmount or when scan completes to prevent memory leaks
  useEffect(() => {
    return () => {
      // Cleanup preview URLs when component unmounts
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      if (lastPhotoUrl) {
        URL.revokeObjectURL(lastPhotoUrl);
      }
      // Cleanup multi-angle frame URLs
      capturedFrames.forEach(frame => {
        if (frame.previewUrl) {
          URL.revokeObjectURL(frame.previewUrl);
        }
      });
    };
  }, []); // Only run on unmount

  // Cleanup when scan completes successfully
  useEffect(() => {
    if (scanPhase === 'done' && completedScan) {
      // Clean up preview URLs after a short delay to allow user to see the result
      const cleanupTimer = setTimeout(() => {
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
          setPreviewUrl(null);
        }
        if (lastPhotoUrl) {
          URL.revokeObjectURL(lastPhotoUrl);
          setLastPhotoUrl(null);
        }
      }, 2000);
      return () => clearTimeout(cleanupTimer);
    }
  }, [scanPhase, completedScan]);

  const handleBack = () => {
    if (onBack) onBack();
  };

  // Reset scan state completely
  const resetScan = () => {
    setError(null);
    setScanError(null);
    setScanPhase('ready');
    setStatusMessage('Take or choose a photo of the product or packaging.');
    setScanStatus({
      phase: 'idle',
      message: 'Ready to scan.',
      details: '',
    });
    setSelectedFile(null);
    setPreviewUrl(null);
    setLastPhotoUrl(null);
    setScanResult(null);
    setIsUploading(false);
    setIsPolling(false);
    setActiveView('scanner');
    setCompletedScan(null);
    setHasCompletedScan(false); // Reset completion flag
    setCurrentScanId(null);
    hasCompletedScanRef.current = false; // Reset ref flag
    processedScanIdsRef.current.clear();
    // Reset multi-angle state
    setCapturedFrames([]);
    setMultiAngleMode(false);
  };
  
  const handleRetry = () => {
    resetScan();
  };
  
  // Handle multi-angle scan start
  const handleStartMultiAngleScan = async () => {
    if (capturedFrames.length === 0) {
      setError('Please capture at least one photo');
      return;
    }
    
    // Start scan with first frame (additional frames will be uploaded in startScan)
    await startScan(capturedFrames[0].file);
  };
  
  // Toggle multi-angle mode
  const toggleMultiAngleMode = () => {
    setMultiAngleMode(!multiAngleMode);
    setCapturedFrames([]);
    setSelectedFile(null);
    setPreviewUrl(null);
    if (!multiAngleMode) {
      setStatusMessage('Step 1/3: Capture the product from the front / top');
    } else {
      setStatusMessage('Take or choose a photo of the product or packaging.');
    }
  };

  const handleScanAgain = () => {
    resetScan();
  };

  const handleBackToHome = () => {
    // Prefer using the onBack prop if provided by App/Home
    if (typeof onBack === 'function') {
      onBack();
      return;
    }
    // Fallback: hard reset SPA to home
    if (onNavigate && typeof onNavigate === 'function') {
      onNavigate('home');
      return;
    }
    // Last resort: reload
    window.location.href = '/';
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
    setIsChoosingFile(false);
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setScanResult(null);
    
    // Generate preview URL
    const previewUrl = URL.createObjectURL(file);
    setPreviewUrl(previewUrl);
    setLastPhotoUrl((oldUrl) => {
      if (oldUrl) URL.revokeObjectURL(oldUrl);
      return previewUrl;
    });
    setFramePulsing(true);
    
    if (multiAngleMode && capturedFrames.length < MAX_FRAMES) {
      // Multi-angle mode: add to frames array
      const newFrame = { file, previewUrl };
      const updatedFrames = [...capturedFrames, newFrame];
      setCapturedFrames(updatedFrames);
      
      if (updatedFrames.length >= MAX_FRAMES) {
        // All frames captured, ready to scan
        setStatusMessage(`All ${MAX_FRAMES} photos captured. Ready to scan.`);
        setScanPhase('ready');
      } else {
        // More frames needed
        const step = updatedFrames.length + 1;
        const instructions = [
          'Capture the product from the front / top',
          'Capture from a side angle',
          'Capture a close-up of the bud/label'
        ];
        setStatusMessage(`Step ${step}/${MAX_FRAMES}: ${instructions[step - 1]}`);
        setScanPhase('ready');
      }
    } else {
      // Single-frame mode (default)
      setSelectedFile(file);
      setIsUploading(false);
      setIsPolling(false);
      setScanPhase('capturing');
      setStatusMessage('Preparing image…');
      
      // Auto-start scan when file is selected
      startScanForFile(file);
    }
    
    // Reset file input so same file can be selected again
    event.target.value = '';
  };

  const handlePickImageClick = () => {
    const input = document.getElementById('scan-file-input');
    if (!input) return;
    // Give instant feedback
    setIsOpeningPicker(true);
    input.click();
  };

  const handleChoosePhotoClick = () => {
    const input = document.getElementById('scan-file-input');
    if (!input) return;
    setIsChoosingFile(true);
    input.click();
    // Reset after a short delay in case onChange is slow
    setTimeout(() => {
      setIsChoosingFile(false);
    }, 800);
  };

  const handleStartScan = async () => {
    // Re-run scan for the currently selected file
    await startScanForFile(selectedFile);
  };

  async function startScan(file) {
    if (!canScan) {
      setError(
        `You're out of scans. Members get ${memberCap} scans included; you can also top up scan packs any time.`
      );
      return;
    }

    try {
      setError(null);
      setScanError(null);
      setCurrentScanId(null);
      setScanPhase('capturing');
      setStatusMessage('Preparing image…');
      setScanStatus({
        phase: 'preparing',
        message: 'Preparing your scan...',
        details: '',
      });

      // Resize and compress image using the new utility
      setScanPhase('uploading');
      setStatusMessage('Resizing image for faster upload…');
      setScanStatus({
        phase: 'compressing',
        message: 'Compressing photo for upload...',
        details: 'Keeping image sharp while shrinking file size.',
      });
      
      console.time('[Scanner] image-compression');
      const { base64, contentType } = await resizeImageToBase64(file, 1280, 0.7);
      console.timeEnd('[Scanner] image-compression');

      setStatusMessage('Uploading image…');
      setScanStatus({
        phase: 'uploading',
        message: 'Uploading image securely...',
        details: 'Sending your scan to StrainSpotter servers.',
      });
      const payload = {
        filename: file.name || 'scan.jpg',
        contentType: contentType || 'image/jpeg',
        base64,
      };

    console.time('[Scanner] upload');
    const res = await fetch(apiUrl('/api/uploads'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    console.timeEnd('[Scanner] upload');

    const data = await safeJson(res);

      if (!res.ok) {
        // Check if it's a guest limit error
        if (res.status === 403 && data?.error === 'Guest scan limit reached') {
          setShowPlans(true);
          setIsUploading(false);
          setIsPolling(false);
          setScanPhase('error');
          setStatusMessage('Guest scan limit reached.');
          return;
        }
        
        // Improved error messages based on status code
        let errorMessage = data?.error || data?.hint || `Upload failed (${res.status})`;
        if (res.status === 413 || errorMessage.includes('too large')) {
          errorMessage = 'Image is too large. Try taking the photo a bit farther away or with lower resolution.';
        } else if (res.status === 400) {
          errorMessage = 'Image problem (too large or wrong type). Try another photo.';
        } else if (res.status >= 500) {
          errorMessage = 'Scan failed on the server. Try again in a moment.';
        }
        
        setScanPhase('error');
        throw new Error(errorMessage);
      }

    const scanId = data.id || data.scan_id || data.scanId;
    if (!scanId) {
      setScanPhase('idle');
      setScanStatus({
        phase: 'error',
        message: 'Server did not return scan ID.',
        details: 'Please try again.',
      });
      throw new Error('Did not receive a scan id from the server.');
    }
    
    setCurrentScanId(scanId);
    setScanStatus({
      phase: 'queued',
      message: 'Scan received. Getting in line...',
      details: 'Our AI is about to process your image.',
    });

    // Trigger Vision processing (only once per scanId)
    if (!processedScanIdsRef.current.has(scanId)) {
      processedScanIdsRef.current.add(scanId);
      try {
        // If multi-angle mode, upload additional frames and pass their URLs
        let frameImageUrls = [];
        if (multiAngleMode && capturedFrames.length > 1) {
          // Upload remaining frames
          for (let i = 1; i < capturedFrames.length; i++) {
            const frame = capturedFrames[i];
            const { base64: frameBase64, contentType: frameContentType } = await resizeImageToBase64(frame.file, 1280, 0.7);
            const framePayload = {
              filename: frame.file.name || `frame-${i}.jpg`,
              contentType: frameContentType || 'image/jpeg',
              base64: frameBase64,
            };
            
            const frameRes = await fetch(apiUrl('/api/uploads'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(framePayload),
            });
            
            const frameData = await safeJson(frameRes);
            if (frameRes.ok && frameData.image_url) {
              frameImageUrls.push(frameData.image_url);
            }
          }
        }
        
        console.time('[Scanner] process-trigger');
        const processRes = await fetch(apiUrl(`/api/scans/${scanId}/process`), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ frameImageUrls }),
        });
        console.timeEnd('[Scanner] process-trigger');
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
    setScanPhase('processing');
    setStatusMessage('Processing image with Vision API…');
    setScanStatus({
      phase: 'processing',
      message: 'Analyzing label & bud details...',
      details: 'Running vision, OCR, and strain matching.',
    });
    setHasCompletedScan(false); // Reset completion flag for new scan
    hasCompletedScanRef.current = false; // Reset ref flag for new scan

    // Removed hard timeout - let the server complete processing
    // Increased to 120 seconds as a safety net (heavy multi-step AI scan needs more time)
    const timeoutId = setTimeout(() => {
      // Only fire timeout if scan hasn't completed yet (check ref for immediate updates)
      if (!hasCompletedScanRef.current) {
        console.warn('[Scanner] Scan timed out', { scanId: currentScanId });
        setIsPolling(false);
        setScanPhase('error');
        setScanError({
          type: 'timeout',
          message: 'Our AI took longer than expected.',
          details: 'This scan may still finish in the background. It\'s usually a temporary slowdown on the server or network.',
          scanId: currentScanId || undefined,
        });
        setScanStatus({
          phase: 'error',
          message: 'Scan is taking longer than normal.',
          details: 'You can try again now, or wait a bit and retry on a stronger connection.',
        });
        setError('Our AI took longer than expected to finish this scan. Please try again in a moment.');
        setStatusMessage('Scan timed out. Please try again.');
      }
    }, 120000); // 120 seconds safety timeout (increased from 90s for heavy AI scans)

    try {
      console.time('[Scanner] total-scan-time');
      await pollScan(scanId, 0, timeoutId);
      console.timeEnd('[Scanner] total-scan-time');
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (e) {
      console.error('[Scanner] startScan error', e);
      setIsUploading(false);
      setIsPolling(false);
      setHasCompletedScan(true); // Mark as completed to prevent timeout race
      hasCompletedScanRef.current = true; // Also set ref for immediate timeout check
      setScanPhase('error');
      
      // Improved error handling with specific messages
      // Never show raw JS errors to users - sanitize all error messages
      const errorMsg = String(e?.message || e || '');
      let userMessage = 'We couldn\'t finish this scan. Please try again.';
      let errorType = 'unknown';
      
      // Check for internal JS errors (ReferenceError, TypeError, etc.) and hide them
      const isInternalError = /ReferenceError|TypeError|SyntaxError|hasCompletedScanRef|Can't find variable|is not defined/i.test(errorMsg);
      
      if (isInternalError) {
        // Log internal errors but don't show them to users
        console.error('[Scanner] Internal error detected, showing generic message:', errorMsg);
        userMessage = 'We couldn\'t finish this scan. Please try again.';
        errorType = 'client';
      } else {
        // Map common user-facing errors to friendly messages
        if (errorMsg.includes('413') || errorMsg.includes('too large') || errorMsg.includes('PayloadTooLargeError')) {
          userMessage = 'Image is too large. Try taking the photo a bit farther away or with lower resolution.';
          errorType = 'client';
        } else if (errorMsg.includes('400') || errorMsg.includes('Bad Request')) {
          userMessage = 'Image problem (too large or wrong type). Try another photo.';
          errorType = 'client';
        } else if (errorMsg.includes('Network') || errorMsg.includes('fetch') || errorMsg.includes('Failed to fetch') || /NetworkError|network/i.test(errorMsg)) {
          userMessage = 'Network issue while scanning. Please check your connection and try again.';
          errorType = 'network';
        } else if (errorMsg.includes('500') || errorMsg.includes('Internal Server Error')) {
          userMessage = 'Scan failed on the server. Try again in a moment.';
          errorType = 'server';
        } else if (errorMsg.includes('403') || errorMsg.includes('Guest scan limit')) {
          userMessage = 'You\'ve reached the guest scan limit. Sign up or upgrade to continue scanning.';
          errorType = 'server';
        } else if (!errorMsg || errorMsg === 'undefined' || errorMsg === 'null') {
          userMessage = 'Something went wrong. Please try again.';
          errorType = 'unknown';
        }
      }
      
      setScanError({
        type: errorType,
        message: errorType === 'network' ? 'Network issue during scan.' : errorType === 'server' ? 'Server couldn\'t finish your scan.' : errorType === 'client' ? 'App had trouble reading the scan result.' : 'We couldn\'t finish this scan.',
        details: isInternalError ? 'Internal error (see console)' : errorMsg,
        scanId: currentScanId || undefined,
      });
      setScanStatus({
        phase: 'error',
        message: errorType === 'network' ? 'Network issue.' : errorType === 'server' ? 'Server error.' : 'Display error.',
        details: errorType === 'network' ? 'Check your connection and try again.' : errorType === 'server' ? 'Our AI had trouble finishing this scan.' : 'We\'ll fix this in an update.',
      });
      setError(userMessage);
      setStatusMessage(userMessage);
    }
  }

  async function pollScan(scanId, attempt = 0, timeoutRef = null) {
    const maxAttempts = 120; // ~120s at 1s delay (increased from 90s to match timeout)
    const delayMs = 1000; // 1 second polling interval

    try {
      // Update status message based on attempt number to show progress
      if (attempt === 0) {
        setStatusMessage('Processing image with Vision API…');
        setScanStatus({
          phase: 'processing',
          message: 'Analyzing label & bud details...',
          details: 'Running vision, OCR, and strain matching.',
        });
      } else if (attempt < 5) {
        setStatusMessage('Extracting text from label…');
        setScanStatus({
          phase: 'processing',
          message: 'Extracting text from label...',
          details: 'Reading product information and batch numbers.',
        });
      } else if (attempt < 10) {
        setStatusMessage('Matching against strain database…');
        setScanStatus({
          phase: 'processing',
          message: 'Matching against strain database...',
          details: 'Comparing your image against 35,000+ strains.',
        });
      } else if (attempt < 20) {
        setStatusMessage('Analyzing product details…');
        setScanStatus({
          phase: 'finalizing',
          message: 'Building summary & insights...',
          details: 'Summarizing effects, warnings, and packaging info.',
        });
      } else {
        setStatusMessage('Finalizing results…');
        setScanStatus({
          phase: 'finalizing',
          message: 'Finalizing results...',
          details: 'Almost done!',
        });
      }

      if (attempt === 0) {
        console.time('[Scanner] polling');
      }
      const res = await fetch(apiUrl(`/api/scans/${scanId}`));
      const data = await safeJson(res);

      if (!res.ok) {
        // Improved error messages for polling failures
        let errorMessage = data?.error || `Scan lookup failed (${res.status})`;
        if (res.status >= 500) {
          errorMessage = 'Server error while processing scan. Try again in a moment.';
        } else if (res.status === 404) {
          errorMessage = 'Scan not found. Please try scanning again.';
        }
        throw new Error(errorMessage);
      }

      // Backend GET /api/scans/:id returns the scan object directly (not wrapped)
      // Handle both wrapped { scan: {...} } and direct scan object for compatibility
      const scan = data?.scan || data;
      
      // Debug logging to understand response structure
      if (attempt === 0 || attempt % 10 === 0) {
        console.log('[pollScan] response structure', {
          attempt,
          scanId,
          hasData: !!data,
          hasScan: !!data?.scan,
          scanStatus: scan?.status,
          scanState: scan?.state,
          hasResult: !!scan?.result,
          resultKeys: scan?.result ? Object.keys(scan.result) : [],
        });
      }
      
      // Extract AI summary, match, and visionText from response (could be at top level or in scan object)
      const aiSummary = data?.aiSummary || scan?.ai_summary || null;
      const summary = data?.summary || null; // Rich structured summary from buildScanAISummary
      const match = data?.match || null; // Matched strain from backend
      const visionText = data?.visionText || null; // Vision OCR text from backend

      if (!scan) {
        throw new Error('Invalid scan response from server');
      }

      // Backend sets status to 'done' when scan completes (backend/index.js line 1661)
      const status = scan?.status || scan?.state || 'unknown';
      const result = scan?.result;

      // Check if scan has a result (matches or visualMatches or labelInsights)
      // Backend result structure includes: vision_raw, packagingInsights, visualMatches, labelInsights
      const hasResult = !!(
        result && (
          (result.visualMatches && (result.visualMatches.match || result.visualMatches.candidates?.length > 0)) ||
          (Array.isArray(result.matches) && result.matches.length > 0) ||
          result.match ||
          result.labelInsights ||
          result.vision_raw || // Vision API result indicates processing completed
          result.packagingInsights // Packaging insights indicate processing completed
        )
      );

      // Check if scan is complete
      // Backend sets status to 'done' when scan completes (backend/index.js line 1661)
      const isComplete = 
        status === 'done' || 
        status === 'complete' || 
        status === 'completed' || 
        status === 'success';
      
      // Debug logging for completion check
      if (attempt > 0 && (isComplete || hasResult)) {
        console.log('[pollScan] completion check', {
          attempt,
          scanId,
          status,
          isComplete,
          hasResult,
          resultType: result ? typeof result : 'null',
          resultKeys: result ? Object.keys(result) : [],
        });
      }

      // Check if scan has an error
      const isError = 
        status === 'error' || 
        status === 'failed' || 
        !!scan?.error || 
        !!scan?.errorMessage;

      // If scan is complete OR has a result, stop polling and show results
      // IMPORTANT: Backend sets status='done' when scan completes (backend/index.js line 1661)
      // Also check for result object presence as a fallback
      if (isComplete || hasResult) {
        if (timeoutRef) clearTimeout(timeoutRef);
        console.timeEnd('[Scanner] polling');
        console.log('[pollScan] SCAN COMPLETE - stopping polling', {
          scanId,
          attempt,
          status,
          isComplete,
          hasResult,
          resultPresent: !!result,
          resultType: result ? typeof result : null,
          resultKeys: result ? Object.keys(result).slice(0, 10) : [],
        });
        setIsPolling(false);
        setHasCompletedScan(true); // Mark as completed to prevent timeout race
        hasCompletedScanRef.current = true; // Also set ref for immediate timeout check
        setScanPhase('done');
        setStatusMessage('Scan complete!');
        setError(null); // Clear any previous errors
        setScanError(null); // Clear any previous structured errors
        setScanStatus({
          phase: 'completed',
          message: 'Scan complete.',
          details: '',
        });
        
        // Temporary debug log
        console.log('[pollScan] done', { status, hasResult, result: scan.result, attempts: attempt });
        
        const normalized = normalizeScanResult(scan);
        
        // Even if normalizeScanResult returns null (no matches), we still have a valid scan
        // Show the result with available data (label insights, vision text, etc.)
        if (normalized) {
          setScanResult(normalized);
        } else {
          // No matches found, but scan completed - create a minimal result
          setScanResult({
            topMatch: null,
            otherMatches: [],
            matches: [],
            matched_strain_slug: null,
            labelInsights: result?.labelInsights || null,
            aiSummary: result?.labelInsights?.aiSummary || null,
            isPackagedProduct: result?.labelInsights?.isPackagedProduct || false,
            packagingInsights: result?.packagingInsights || null,
            visionRaw: result?.vision_raw || null,
          });
        }

        // Store the completed scan locally for the result view
        const processedResult = scan.result || normalized;
        
        // Extract matched strain from multiple sources (prioritize backend match, then fallback to result)
        // Note: serializeMatch flattens the structure, so match already has strain fields at top level
        const matchedStrain = 
          match || // From backend response (already serialized)
          result?.visualMatches?.match || // Already serialized (flattened structure)
          result?.matches?.[0] || // Array of matches
          normalized?.top_match || // Normalized result
          null;
        
        // Extract vision text (prioritize backend response, then fallback to result)
        const extractedVisionText =
          visionText || // From backend response
          result?.vision_raw?.textAnnotations?.[0]?.description ||
          result?.vision_raw?.fullTextAnnotation?.text ||
          result?.visionRaw?.textAnnotations?.[0]?.description ||
          result?.visionRaw?.fullTextAnnotation?.text ||
          null;
        
        setCompletedScan({
          id: scan.id,
          result: processedResult,
          created_at: scan.created_at || new Date().toISOString(),
          ai_summary: aiSummary || scan.ai_summary || null,
          summary: summary || null, // Rich structured summary
          matchedStrain: matchedStrain || null,
          visionText: extractedVisionText || null,
          matched_strain_slug: scan.matched_strain_slug || null,
        });
        setActiveView('result');

        // Count successful scans (only for non-members)
        if (!isMember) {
          registerScanConsumed();
          // Also maintain legacy guest scan tracking for backward compatibility
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
        if (timeoutRef) clearTimeout(timeoutRef);
        setIsPolling(false);
        setHasCompletedScan(true); // Mark as completed to prevent timeout race
        hasCompletedScanRef.current = true; // Also set ref for immediate timeout check
        setScanPhase('error');
        setFramePulsing(false);
        const errorMessage = scan?.error || scan?.errorMessage || 'Scan failed on the server.';
        // Provide more specific error messages
        let userMessage = errorMessage;
        if (errorMessage.includes('Vision') || errorMessage.includes('OCR')) {
          userMessage = 'Could not read text from the image. Try a clearer photo with better lighting.';
        } else if (errorMessage.includes('match') || errorMessage.includes('strain')) {
          userMessage = 'Could not find a matching strain. Try a photo that shows the product label clearly.';
        } else if (errorMessage.includes('storage') || errorMessage.includes('bucket')) {
          userMessage = 'Storage error. Please try again in a moment.';
        }
        setScanError({
          type: 'server',
          message: 'Server couldn\'t finish your scan.',
          details: errorMessage,
          scanId: scanId || currentScanId || undefined,
        });
        setScanStatus({
          phase: 'error',
          message: 'Server error.',
          details: 'Our AI had trouble finishing this scan.',
        });
        setError(userMessage);
        setStatusMessage(userMessage);
        return;
      }

      // If we've hit max attempts, stop polling (increased to 120 attempts = 120 seconds)
      if (attempt >= 120) {
        if (timeoutRef) clearTimeout(timeoutRef);
        setIsPolling(false);
        setHasCompletedScan(true); // Mark as completed to prevent duplicate errors
        hasCompletedScanRef.current = true; // Also set ref for immediate timeout check
        setScanPhase('error');
        setFramePulsing(false);
        // Set timeout error (not a hard failure)
        setScanError({
          type: 'timeout',
          message: 'Our AI took longer than expected.',
          details: 'This scan may still finish in the background. It\'s usually a temporary slowdown on the server or network.',
          scanId: scanId || currentScanId || undefined,
        });
        setScanStatus({
          phase: 'error',
          message: 'Scan is taking longer than normal.',
          details: 'You can try again now, or wait a bit and retry on a stronger connection.',
        });
        const timeoutError = 'Our AI took longer than expected to finish this scan. Please try again in a moment.';
        setError(timeoutError);
        setStatusMessage(timeoutError);
        return;
      }

      // Otherwise, schedule another poll attempt
      setTimeout(() => {
        pollScan(scanId, attempt + 1);
      }, delayMs);
    } catch (e) {
      if (timeoutRef) clearTimeout(timeoutRef);
      console.error('[Scanner] pollScan error', e);
      setIsPolling(false);
      setHasCompletedScan(true); // Mark as completed to prevent timeout race
      hasCompletedScanRef.current = true; // Also set ref for immediate timeout check
      setScanPhase('error');
      
      // Never show raw JS errors to users - sanitize all error messages
      const errorMsg = String(e?.message || e || '');
      let userMessage = 'We couldn\'t finish this scan. Please try again.';
      let errorType = 'unknown';
      
      // Check for internal JS errors (ReferenceError, TypeError, etc.) and hide them
      const isInternalError = /ReferenceError|TypeError|SyntaxError|hasCompletedScanRef|Can't find variable|is not defined/i.test(errorMsg);
      
      if (isInternalError) {
        // Log internal errors but don't show them to users
        console.error('[Scanner] Internal error detected, showing generic message:', errorMsg);
        userMessage = 'We couldn\'t finish this scan. Please try again.';
        errorType = 'client';
      } else {
        // Provide user-friendly error messages
        if (errorMsg.includes('404') || errorMsg.includes('not found')) {
          userMessage = 'Scan not found. Please try scanning again.';
          errorType = 'server';
        } else if (errorMsg.includes('500') || errorMsg.includes('Server error')) {
          userMessage = 'Server error while processing scan. Please try again in a moment.';
          errorType = 'server';
        } else if (errorMsg.includes('Network') || errorMsg.includes('fetch') || /NetworkError|network/i.test(errorMsg)) {
          userMessage = 'Network issue while scanning. Please check your connection and try again.';
          errorType = 'network';
        }
      }
      
      setScanError({
        type: errorType,
        message: errorType === 'network' ? 'Network issue during scan.' : errorType === 'server' ? 'Server couldn\'t finish your scan.' : 'App had trouble reading the scan result.',
        details: isInternalError ? 'Internal error (see console)' : errorMsg,
        scanId: scanId || currentScanId || undefined,
      });
      setScanStatus({
        phase: 'error',
        message: errorType === 'network' ? 'Network issue.' : errorType === 'server' ? 'Server error.' : 'Display error.',
        details: errorType === 'network' ? 'Check your connection and try again.' : errorType === 'server' ? 'Our AI had trouble finishing this scan.' : 'We\'ll fix this in an update.',
      });
      setError(userMessage);
      setStatusMessage(userMessage);
    }
  }

  // Lightweight image compression for large files
  async function maybeCompressImage(file) {
    // More aggressive compression for iOS to prevent memory crashes
    const MAX_SIZE = 1 * 1024 * 1024; // 1MB (reduced from 2MB)
    const MAX_DIMENSION = 1280; // Reduced from 1600 for faster processing
    const QUALITY = 0.75; // Slightly higher quality but still compressed

    // Always compress on mobile/Capacitor for consistency
    const isMobile = typeof window !== 'undefined' && 
      (window.location.protocol === 'capacitor:' || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent));

    if (!isMobile && file.size <= MAX_SIZE) {
      return file; // No compression needed on desktop for small files
    }

    try {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            // Calculate new dimensions maintaining aspect ratio
            let width = img.width;
            let height = img.height;
            
            // Always resize if larger than max dimension (for mobile) or if file is large
            if (width > MAX_DIMENSION || height > MAX_DIMENSION || file.size > MAX_SIZE) {
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
                  // Clean up the object URL
                  URL.revokeObjectURL(e.target.result);
                  resolve(compressedFile);
                } else {
                  resolve(file); // Fallback to original
                }
              },
              'image/jpeg',
              QUALITY
            );
          };
          img.onerror = () => {
            URL.revokeObjectURL(e.target.result);
            resolve(file); // Fallback to original
          };
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
      reader.onerror = reject;
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


  // Show loading state if camera is not ready (for future camera integration)
  // RESULT MODE
  if (activeView === 'result' && completedScan) {
    return (
      <Container
        maxWidth="md"
        sx={{
          pt: 'calc(env(safe-area-inset-top) + 20px)',
          pb: 4,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
        }}
      >
        {/* Back button */}
        <Box sx={{ mb: 2, mt: 0, pt: 0, display: 'flex', alignItems: 'center' }}>
          <IconButton
            onClick={handleBackToHome}
            sx={{
              mr: 1,
              color: '#C5E1A5',
            }}
            aria-label="Back to home"
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
            Scan result
          </Typography>
        </Box>

        {/* Results area (scrollable) */}
        <Box
          sx={{
            flex: 1,
            mt: 2,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            pb: 10, // space so last card isn't hidden behind sticky buttons
          }}
        >
          {/* Strain Result Card - shows matched strain if present */}
          {completedScan?.matchedStrain && (
            <Box sx={{ mb: 1 }}>
              <StrainResultCard
                matchedStrain={completedScan.matchedStrain}
                scan={completedScan}
              />
            </Box>
          )}

          {/* Fallback basic scan info if no matched strain */}
          {!completedScan?.matchedStrain && (
            <Box
              sx={{
                mb: 1.5,
                p: 1,
                borderRadius: 1.5,
                border: '1px solid rgba(90, 130, 90, 0.7)',
                background: 'rgba(5, 10, 5, 0.96)',
                color: '#d6f5d6',
                fontSize: '0.84rem',
              }}
            >
              <Typography
                variant="overline"
                sx={{
                  fontSize: '0.78rem',
                  letterSpacing: '0.08em',
                  opacity: 0.75,
                  mb: 0.5,
                  display: 'block',
                }}
              >
                Scan details
              </Typography>
              <Box
                component="pre"
                sx={{
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  fontFamily:
                    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                  fontSize: '0.76rem',
                  opacity: 0.88,
                }}
              >
                {JSON.stringify(
                  {
                    id: completedScan.id,
                    matched_strain_slug: completedScan.matched_strain_slug,
                    created_at: completedScan.created_at,
                  },
                  null,
                  2
                )}
              </Box>
            </Box>
          )}

          {/* Legacy ScanResultCard for packaging insights */}
          <ScanResultCard
            scan={completedScan}
            result={normalizeScanResult(completedScan)}
            onCorrectionSaved={() => {
              console.log('[ScanResultCard] correction saved');
            }}
          />

          {/* AI Summary Panel */}
          {/* Rich structured summary panel */}
          {completedScan?.summary && (
            <Box sx={{ mt: 2 }}>
              <ScanAISummaryPanel summary={completedScan.summary} />
            </Box>
          )}
          
          {/* Legacy AI summary panel (for backward compatibility) */}
          {completedScan?.ai_summary && !completedScan?.summary && (
            <Box sx={{ mt: 2 }}>
              <ScanAISummaryPanel
                aiSummary={completedScan.ai_summary}
                visionText={completedScan.visionText || null}
              />
            </Box>
          )}
          
          {/* AI summary from /api/visual-match endpoint */}
          {completedScan?.aiSummary && !completedScan?.summary && !completedScan?.ai_summary && (
            <Box sx={{ mt: 2 }}>
              <ScanAISummaryPanel summary={completedScan.aiSummary} />
            </Box>
          )}
        </Box>

        {/* Sticky bottom action bar - always visible when scrolling */}
        <Box
          sx={{
            position: 'sticky',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 20,
            px: 2,
            pb: 1.5,
            pt: 1,
            background:
              'linear-gradient(to top, rgba(5, 7, 5, 0.96), rgba(5, 7, 5, 0.2))',
            backdropFilter: 'blur(6px)',
            mt: 3,
          }}
        >
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="outlined"
              fullWidth
              onClick={handleBackToHome}
              sx={{
                textTransform: 'none',
                borderColor: 'rgba(197, 225, 165, 0.8)',
                color: '#C5E1A5',
                fontWeight: 500,
                '&:hover': {
                  borderColor: '#CDDC39',
                  backgroundColor: 'rgba(156, 204, 101, 0.08)',
                },
              }}
            >
              Back home
            </Button>
            <Button
              variant="contained"
              fullWidth
              onClick={handleScanAgain}
              sx={{
                textTransform: 'none',
                backgroundColor: '#9CCC65',
                color: '#050705',
                fontWeight: 600,
                '&:hover': {
                  backgroundColor: '#CDDC39',
                },
              }}
            >
              Scan again
            </Button>
          </Stack>
        </Box>
      </Container>
    );
  }

  // Camera loading state - ensure no black overlay blocks touches
  if (!cameraReady) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          width: '100%',
          backgroundColor: '#050705',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 1,
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <Paper
          elevation={6}
          sx={{
            p: 4,
            borderRadius: 3,
            background: 'rgba(12, 20, 12, 0.95)',
            border: '1px solid rgba(124, 179, 66, 0.6)',
            textAlign: 'center',
            maxWidth: 320,
            pointerEvents: 'auto',
          }}
        >
          <Stack spacing={2} alignItems="center">
            <CircularProgress size={48} sx={{ color: '#CDDC39' }} />
            <Typography variant="h6" sx={{ color: '#F1F8E9', fontWeight: 600 }}>
              {statusMessage || 'Opening camera…'}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(224, 242, 241, 0.8)' }}>
              Preparing scanner for you.
            </Typography>
          </Stack>
        </Paper>
      </Box>
    );
  }

  // SCANNER MODE - ensure no black overlays block touches
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
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)',
        boxSizing: 'border-box',
      }}
    >
      {/* Subtle overlay - ensure it doesn't block touches */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at top, rgba(124,179,66,0.25), transparent 55%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Top bar with back button */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          px: 2,
          pb: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pointerEvents: 'auto',
        }}
      >
        <IconButton
          onClick={handleBack}
          sx={{
            color: '#C5E1A5',
            padding: 1,
          }}
          aria-label="Back"
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography
          variant="subtitle2"
          sx={{ color: '#A5D6A7', fontWeight: 500, fontSize: 14 }}
        >
          Scanner
        </Typography>
        <Box sx={{ width: 40 }} /> {/* Spacer for centering */}
      </Box>

      {/* Status Strip */}
      {scanStatus.phase !== 'idle' && (
        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            px: 2,
            pb: 1,
          }}
        >
          <Box
            sx={{
              padding: '8px 12px',
              borderRadius: '999px',
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              backgroundColor:
                scanStatus.phase === 'error'
                  ? 'rgba(220, 53, 69, 0.12)'
                  : scanStatus.phase === 'completed'
                  ? 'rgba(25, 135, 84, 0.14)'
                  : 'rgba(15, 118, 110, 0.16)',
              color: '#e5fbea',
              border: scanStatus.phase === 'error' ? '1px solid rgba(220, 53, 69, 0.3)' : 'none',
            }}
          >
            <span style={{ fontSize: 14 }}>
              {scanStatus.phase === 'error'
                ? '⚠️'
                : scanStatus.phase === 'completed'
                ? '✅'
                : '🔍'}
            </span>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ fontWeight: 500, fontSize: 13 }}>
                {scanStatus.message || 'Ready to scan.'}
              </Box>
              {scanStatus.details && (
                <Box sx={{ fontSize: 11, opacity: 0.8, mt: 0.25 }}>
                  {scanStatus.details}
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      )}

      {/* Scrollable content area */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          position: 'relative',
          zIndex: 1,
          px: 2,
          pb: 2,
          display: 'flex',
          flexDirection: 'column',
          pointerEvents: 'auto',
        }}
      >
        <Container
          maxWidth="sm"
          sx={{
            px: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {/* Header */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="h5"
                  sx={{
                    color: '#F1F8E9',
                    fontWeight: 700,
                    mb: 0.5,
                  }}
                >
                  Scan weed products
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: 'rgba(224, 242, 241, 0.9)' }}
                >
                  Choose or take a photo of a cannabis product or bud. We'll analyze
                  it and show you the closest strain matches.
                </Typography>
              </Box>
            {/* Scan credits summary */}
            <Box sx={{ textAlign: 'right', ml: 2, minWidth: 160 }}>
              {isMember ? (
                <>
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'rgba(163, 230, 186, 0.9)',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                    }}
                  >
                    Member
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'rgba(255,255,255,0.9)',
                      fontWeight: 500,
                    }}
                  >
                    Included scans: {memberCap - memberRemaining}/{memberCap}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: 'rgba(190, 242, 100, 0.9)' }}
                  >
                    Scans left: {totalAvailableScans}
                    {extraCredits > 0 ? ' (with top-ups)' : ''}
                  </Typography>
                </>
              ) : (
                <>
                  <Typography
                    variant="caption"
                    sx={{ color: 'rgba(248, 250, 252, 0.7)' }}
                  >
                    Free starter scans used:{' '}
                    <strong>{starterCap - starterRemaining}</strong> / {starterCap}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      mt: 0.25,
                      color:
                        totalAvailableScans === 0
                          ? '#fecaca'
                          : totalAvailableScans <= 5
                          ? '#fde68a'
                          : '#bbf7d0',
                    fontWeight: 600,
                  }}
                >
                  Scans available: {totalAvailableScans}
                </Typography>
                  {extraCredits > 0 && (
                    <Typography
                      variant="caption"
                      sx={{ color: 'rgba(190, 242, 100, 0.9)' }}
                    >
                      Includes {extraCredits} top-up scans
                    </Typography>
                  )}
                </>
              )}
            </Box>
          </Box>
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
                border: '2px dashed rgba(200, 230, 201, 0.5)',
                minHeight: 200,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                background:
                  'radial-gradient(circle at top, rgba(76, 175, 80, 0.15), rgba(0, 0, 0, 0.95))',
                position: 'relative',
                animation: framePulsing ? 'scan-pulse 1.4s infinite' : 'none',
                '@keyframes scan-pulse': {
                  '0%': { boxShadow: '0 0 0 0 rgba(0, 255, 120, 0.5)' },
                  '70%': { boxShadow: '0 0 0 12px rgba(0, 255, 120, 0)' },
                  '100%': { boxShadow: '0 0 0 0 rgba(0, 255, 120, 0)' },
                },
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
                    {scanPhase === 'ready' && 'Align the label in this area when you take the photo.'}
                    {scanPhase === 'capturing' && 'Preparing image…'}
                    {scanPhase === 'uploading' && (statusMessage || 'Uploading image…')}
                    {scanPhase === 'processing' && (statusMessage || 'Processing image with Vision API…')}
                    {scanPhase === 'done' && 'Scan complete! You can review the details below.'}
                    {scanPhase !== 'ready' && scanPhase !== 'capturing' && scanPhase !== 'uploading' && scanPhase !== 'processing' && scanPhase !== 'done' && 'Tap below to take a new photo or choose one from your library.'}
                  </Typography>
                </Stack>
              )}
              {lastPhotoUrl && (
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 8,
                    right: 8,
                    width: 64,
                    height: 64,
                    borderRadius: 1,
                    overflow: 'hidden',
                    border: '1px solid rgba(255, 255, 255, 0.4)',
                  }}
                >
                  <Box
                    component="img"
                    src={lastPhotoUrl}
                    alt="Last captured"
                    sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </Box>
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
                disabled={isOpeningPicker || scanPhase === 'uploading' || scanPhase === 'processing' || scanPhase === 'capturing' || !canScan}
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
                {scanPhase === 'uploading' 
                  ? 'Uploading…' 
                  : scanPhase === 'processing' 
                  ? 'Processing…' 
                  : isOpeningPicker 
                  ? 'Opening camera…' 
                  : !canScan
                  ? 'Upgrade to keep scanning'
                  : multiAngleMode && capturedFrames.length > 0
                  ? `Capture photo ${capturedFrames.length + 1}/${MAX_FRAMES}`
                  : 'Take or choose photo'}
              </Button>

              <Button
                variant="outlined"
                fullWidth
                size="large"
                onClick={selectedFile ? handleStartScan : handleChoosePhotoClick}
                disabled={(!selectedFile && isChoosingFile) || isUploading || isPolling}
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
                : isChoosingFile
                ? 'Opening photos…'
                : 'Choose photo'}
              </Button>

              {/* Multi-angle mode toggle */}
              <Button
                variant="text"
                size="small"
                onClick={toggleMultiAngleMode}
                sx={{
                  textTransform: 'none',
                  color: multiAngleMode ? '#CDDC39' : 'rgba(224, 242, 241, 0.7)',
                  fontSize: '0.75rem',
                  py: 0.5,
                }}
              >
                {multiAngleMode ? '✓ Multi-angle mode' : 'Multi-angle mode (3 photos)'}
              </Button>
              
              {/* Multi-angle progress indicator */}
              {multiAngleMode && capturedFrames.length > 0 && (
                <Box
                  sx={{
                    mt: 1,
                    p: 1.5,
                    borderRadius: 1,
                    backgroundColor: 'rgba(124, 179, 66, 0.15)',
                    border: '1px solid rgba(124, 179, 66, 0.3)',
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{ color: 'rgba(224, 242, 241, 0.9)', mb: 0.5 }}
                  >
                    {capturedFrames.length}/{MAX_FRAMES} photos captured
                  </Typography>
                  {capturedFrames.length >= MAX_FRAMES ? (
                    <Button
                      variant="contained"
                      fullWidth
                      size="medium"
                      onClick={handleStartMultiAngleScan}
                      disabled={isUploading || isPolling || !canScan}
                      sx={{
                        textTransform: 'none',
                        background: 'linear-gradient(135deg, #7CB342, #9CCC65)',
                        mt: 0.5,
                      }}
                    >
                      Start multi-angle scan
                    </Button>
                  ) : (
                    <Typography
                      variant="caption"
                      sx={{ color: 'rgba(224, 242, 241, 0.7)' }}
                    >
                      Capture {MAX_FRAMES - capturedFrames.length} more photo{MAX_FRAMES - capturedFrames.length > 1 ? 's' : ''}
                    </Typography>
                  )}
                </Box>
              )}

              <Typography
                variant="caption"
                sx={{ color: 'rgba(224, 242, 241, 0.8)' }}
              >
                {multiAngleMode 
                  ? 'Capture the same product from different angles for better accuracy.'
                  : 'Clear, close-up photos of labels or flowers give the best results.'}
              </Typography>
            </Stack>

            {/* Status bar */}
            <Box
              sx={{
                mt: 2,
                p: 1.5,
                borderRadius: 1,
                backgroundColor: scanPhase === 'error' 
                  ? 'rgba(239, 68, 68, 0.15)' 
                  : 'rgba(124, 179, 66, 0.1)',
                border: `1px solid ${scanPhase === 'error' 
                  ? 'rgba(239, 68, 68, 0.4)' 
                  : 'rgba(124, 179, 66, 0.3)'}`,
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                {scanPhase !== 'ready' && scanPhase !== 'done' && scanPhase !== 'error' && (
                  <CircularProgress size={18} sx={{ color: '#CDDC39' }} />
                )}
                {scanPhase === 'error' && (
                  <Typography sx={{ color: '#fecaca', fontSize: 18 }}>⚠</Typography>
                )}
                <Typography
                  variant="body2"
                  sx={{ 
                    color: scanPhase === 'error' 
                      ? '#fecaca' 
                      : 'rgba(224, 242, 241, 0.9)', 
                    flex: 1 
                  }}
                >
                  {scanPhase === 'ready' && (statusMessage || 'Ready to scan.')}
                  {scanPhase === 'capturing' && 'Preparing image…'}
                  {scanPhase === 'uploading' && (statusMessage || 'Uploading image…')}
                  {scanPhase === 'processing' && (statusMessage || 'Processing image with Vision API…')}
                  {scanPhase === 'done' && 'Scan complete!'}
                  {scanPhase === 'error' && (error || 'Scan failed. Please try again.')}
                </Typography>
              </Stack>
              {scanPhase === 'error' && (
                <Button
                  variant="contained"
                  fullWidth
                  size="medium"
                  onClick={() => {
                    setError(null);
                    setScanPhase('ready');
                    setStatusMessage('Ready to scan.');
                    setSelectedFile(null);
                    setPreviewUrl(null);
                    if (previewUrl) {
                      URL.revokeObjectURL(previewUrl);
                    }
                    if (lastPhotoUrl) {
                      URL.revokeObjectURL(lastPhotoUrl);
                    }
                    setCapturedFrames([]);
                  }}
                  sx={{
                    mt: 1.5,
                    textTransform: 'none',
                    background: 'linear-gradient(135deg, #7CB342, #9CCC65)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #8BC34A, #AED581)',
                    },
                  }}
                >
                  Try again
                </Button>
              )}
            </Box>

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

        {/* Skeleton loading state while scanning */}
        {scanPhase !== 'ready' && scanPhase !== 'done' && scanPhase !== 'error' && !scanResult && !error && (
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
              <Skeleton
                variant="text"
                width="60%"
                height={40}
                sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }}
              />
              <Skeleton
                variant="text"
                width="100%"
                height={24}
                sx={{ bgcolor: 'rgba(255, 255, 255, 0.08)' }}
              />
              <Skeleton
                variant="text"
                width="80%"
                height={24}
                sx={{ bgcolor: 'rgba(255, 255, 255, 0.08)' }}
              />
            </Stack>
          </Paper>
        )}

        {/* Results are now shown in separate result view - removed from scanner view */}

        {scanPhase === 'error' && (
          <Button
            variant="outlined"
            fullWidth
            onClick={handleScanAgain}
            sx={{
              mt: 2,
              textTransform: 'none',
              borderColor: '#9CCC65',
              color: '#C5E1A5',
              '&:hover': {
                borderColor: '#CDDC39',
                backgroundColor: 'rgba(156, 204, 101, 0.1)',
              },
            }}
          >
            Scan again
          </Button>
        )}

          {!scanResult && scanPhase === 'ready' && !error && (
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

          {/* Error display - consolidated to single location (Alert above handles it) */}
          {/* Removed duplicate error display to prevent duplicate error cards */}
        </Container>
      </Box>

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

// ============================================================================
// END-TO-END TEST CHECKLIST
// ============================================================================
//
// BACKEND TESTS:
// ---------------
// 1) Start backend: npm run dev (from backend folder)
// 2) Hit GET /health → confirm supabaseConfigured and googleVisionConfigured are true
// 3) Upload a known-good label via the Scanner in the app or Dev dashboard
// 4) Confirm:
//    - A row appears in public.scans with image_url set
//    - After processing, matched_strain_slug is set (for known strains)
//    - ai_summary column is a JSON object with the expected keys:
//      * userFacingSummary (string)
//      * effectsAndUseCases (array)
//      * risksAndWarnings (array)
//      * dispensaryNotes (string)
//      * growerNotes (string)
//      * confidenceNote (string)
// 5) Temporarily break OPENAI_API_KEY (e.g., comment out in env or set to empty) and repeat a scan:
//    - Scan must still complete successfully
//    - ai_summary should be null, but no 500 errors
//    - Frontend should still show at least the basic scan result without crashing
// 6) Test with a scan that has no matched strain:
//    - AI summary should still generate using OCR/labels only
//    - confidenceNote should indicate uncertainty
//
// FRONTEND TESTS (mobile/web):
// -----------------------------
// 1) Upload a very clear label → Expect:
//    - Correct strain matched
//    - High-quality AI summary appears under result card
//    - All sections populated (summary, effects, warnings, notes)
// 2) Upload a noisy label with lots of legal text → Expect:
//    - Scan completes successfully
//    - AI summary emphasizes uncertainty in confidenceNote
//    - "risks & cautions" list still shows generic safe advice
//    - No crashes or freezes
// 3) Upload a blurry/bad photo → Expect:
//    - Either no match or low-confidence match
//    - AI summary indicates low confidence or is empty
//    - UI suggests retaking photo (not crash)
//    - "Scan again" button works to reset state
// 4) On each scan, verify that the UI:
//    - Doesn't reuse previous AI summary for a new scan (state resets correctly)
//    - Disables the scan button while processing (uploading/processing states)
//    - Shows correct button text: "Uploading…" → "Processing…" → "Take or choose photo"
//    - Allows "Scan again" to cleanly reset all state
//    - AI summary panel only appears when ai_summary exists
// 5) Test error handling:
//    - Network failure during upload → Shows error, allows retry
//    - Network failure during processing → Shows error, allows retry
//    - Backend returns error → Shows error message, doesn't crash
//
// INTEGRATION TESTS:
// -------------------
// 1) Full flow: Upload → Process → Poll → Display:
//    - Upload completes → status shows "Processing…"
//    - Polling detects completion → status shows "Scan complete"
//    - Result view shows ScanResultCard + ScanAISummaryPanel
//    - Both components render without errors
// 2) State management:
//    - "Scan again" resets all state (scanResult, completedScan, error, phase)
//    - Active view switches correctly (scanner ↔ result)
//    - No memory leaks or stale state between scans
// 3) Guest vs authenticated:
//    - Guest scans count correctly (localStorage)
//    - Guest limit enforced (shows plans dialog)
//    - Authenticated users bypass limit
//
// If any of these steps fail, log details to the console on both backend and frontend,
// but never throw uncaught exceptions in production paths.
//
// ============================================================================
