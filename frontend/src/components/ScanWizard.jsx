import { useRef, useState, useEffect, useCallback } from "react";
import MembershipLogin from "./MembershipLogin";
import ErrorBoundary from "./ErrorBoundary";
import SeedVendorFinder from "./SeedVendorFinder";
import DispensaryFinder from "./DispensaryFinder";
import FeedbackModal from "./FeedbackModal";
import ScanResultCard from "./ScanResultCard";
import AnimatedScanProgress from "./AnimatedScanProgress";
import Snackbar from '@mui/material/Snackbar';
import { Container, Box, Button, Typography, Paper, CircularProgress, Tabs, Tab, Dialog, DialogTitle, DialogContent, Chip, Stack, TextField, IconButton, Alert, DialogActions, DialogContentText, Divider, Fab, Tooltip } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FeedbackIcon from '@mui/icons-material/Feedback';
import { supabase, SUPABASE_ANON_KEY } from '../supabaseClient';
import { API_BASE, FUNCTIONS_BASE } from '../config';
import { normalizeScanResult, getScanKindLabel, cleanCandidateName } from '../utils/scanResultUtils';
import { useCanScan } from '../hooks/useCanScan';
import { useScanCredits } from '../hooks/useScanCredits';

const ConfidenceCallout = ({ confidence }) => {
  if (confidence == null) return null;
  const normalized = confidence > 1 ? confidence : confidence * 100;
  const pct = Math.max(0, Math.min(100, Math.round(normalized)));
  let severity = 'success';
  if (pct < 50) severity = 'warning';
  if (pct < 25) severity = 'error';
  return (
    <Alert
      severity={severity}
      sx={{ mt: 2, bgcolor: 'rgba(124,179,66,0.08)', border: '1px solid rgba(124,179,66,0.3)' }}
    >
      AI confidence: {pct}%
    </Alert>
  );
};

export default function ScanWizard({ onBack, onScanComplete }) {
  const fileInputRef = useRef(null);
  const [membershipComplete, setMembershipComplete] = useState(true); // Skip membership for now
  const [loading, setLoading] = useState(false);
  const [scanStatus, setScanStatus] = useState("idle"); // "idle" | "uploading" | "processing" | "error" | "done"
  const [scanPhase, setScanPhase] = useState(null); // "uploading" | "processing" | "matching" | "analyzing" | "finalizing"
  const [scanProgress, setScanProgress] = useState(null); // 0-100 for progress bar
  const [scanMessage, setScanMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [result] = useState(null);
  const [match, setMatch] = useState(null);
  const [plantHealth] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMsg, setAlertMsg] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsTab, setDetailsTab] = useState(0);
  const [scanResult, setScanResult] = useState(null); // Normalized scan result for ScanResultCard
  const [isPolling, setIsPolling] = useState(false);
  const [activeView, setActiveView] = useState('scanner'); // 'scanner' | 'result'

  // Review state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [reviewEffects, setReviewEffects] = useState("");
  const [reviewFlavors, setReviewFlavors] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [existingReviews, setExistingReviews] = useState([]);

  // Navigation state for seed vendors and dispensaries
  const [showSeedVendorFinder, setShowSeedVendorFinder] = useState(false);
  const [showDispensaryFinder, setShowDispensaryFinder] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  // Auth state
  const [currentUser, setCurrentUser] = useState(null);
  const [showMembershipDialog, setShowMembershipDialog] = useState(false);
  const [creditSummary, setCreditSummary] = useState(null);
  const [creditsLoading, setCreditsLoading] = useState(false);
  const [showTopUpDialog, setShowTopUpDialog] = useState(false);
  const [topUpMessage, setTopUpMessage] = useState('');
  const topUpOptions = [
    { credits: 50, price: '$4.99' },
    { credits: 200, price: '$9.99' },
    { credits: 500, price: '$19.99' }
  ];

  // Use shared canScan hook for founder checks
  const { isFounder: isFounderFromHook } = useCanScan();
  
  // Use normalized scan credits hook for button logic
  const { remainingScans, isFounder, isGuest } = useScanCredits();

  const membershipTier = (currentUser?.user_metadata?.membership || currentUser?.user_metadata?.tier || '').toString().toLowerCase();
  const metadataMembershipActive = ['club', 'full-access', 'pro', 'owner', 'admin', 'garden', 'member'].some((token) => membershipTier.includes(token));

  const canUseEdgeUploads = typeof FUNCTIONS_BASE === 'string' && FUNCTIONS_BASE.length > 0 && FUNCTIONS_BASE !== `${API_BASE}/api`;

  const uploadViaEdgeFunction = useCallback(async ({ base64, filename, contentType, userId }) => {
    // FUNCTIONS_BASE is from outer scope, not a dependency
    if (!canUseEdgeUploads || !base64) return null;
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (SUPABASE_ANON_KEY) {
        headers.Authorization = `Bearer ${SUPABASE_ANON_KEY}`;
        headers.apikey = SUPABASE_ANON_KEY;
      }
      const resp = await fetch(`${FUNCTIONS_BASE}/uploads`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ filename, base64, contentType, user_id: userId })
      });
      if (!resp.ok) {
        const text = await resp.text().catch(() => '');
        console.warn('[ScanWizard] Edge upload failed:', resp.status, text);
        return null;
      }
      const data = await resp.json();
      if (data?.id) {
        return data;
      }
    } catch (err) {
      console.warn('[ScanWizard] Edge upload exception:', err);
    }
    return null;
  }, [canUseEdgeUploads]); // FUNCTIONS_BASE is from outer scope

  // Track authentication state
  useEffect(() => {
    if (!supabase) return;

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadCredits = useCallback(async () => {
    if (!currentUser) {
      setCreditSummary(null);
      return;
    }
    setCreditsLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/api/scans/credits?user_id=${currentUser.id}`);
      if (resp.ok) {
        const data = await resp.json();
        setCreditSummary(data);
      } else {
        const err = await resp.json().catch(() => ({}));
        console.error('Failed to load credits', err);
        if (metadataMembershipActive) {
          setCreditSummary(prev => prev ?? {
            credits: 999,
            membershipActive: true,
            starterExpired: false,
            trialDaysRemaining: null,
            monthlyBundle: 999
          });
        }
      }
    } catch (err) {
      console.error('Credit summary error:', err);
      if (metadataMembershipActive) {
        setCreditSummary(prev => prev ?? {
          credits: 999,
          membershipActive: true,
          starterExpired: false,
          trialDaysRemaining: null,
          monthlyBundle: 999
        });
      }
    } finally {
      setCreditsLoading(false);
    }
  }, [currentUser, metadataMembershipActive]);

  useEffect(() => {
    if (!currentUser) {
      setCreditSummary(null);
      return;
    }
    loadCredits();
  }, [currentUser, loadCredits]);

  // Fetch existing reviews when match changes
  useEffect(() => {
    if (match?.strain?.slug) {
      fetch(`${API_BASE}/api/reviews?strain_slug=${match.strain.slug}`)
        .then(res => res.json())
        .then(data => {
          setExistingReviews(Array.isArray(data) ? data : []);
        })
        .catch(() => {
          setExistingReviews([]);
        });
    }
  }, [match?.strain?.slug]);

  // Handle review button click - check auth first
  const handleLeaveReviewClick = () => {
    if (!currentUser) {
      setShowMembershipDialog(true);
      return;
    }
    setShowReviewForm(true);
  };

  // Handle review submission
  const handleSubmitReview = async () => {
    if (!match?.strain?.slug || !currentUser) return;

    setSubmittingReview(true);
    try {
      // Build review text with effects and flavors
      let fullReview = reviewText;
      if (reviewEffects.trim()) {
        fullReview += `\n\nEffects: ${reviewEffects}`;
      }
      if (reviewFlavors.trim()) {
        fullReview += `\n\nFlavors: ${reviewFlavors}`;
      }

      // Submit to Supabase reviews table via API
      const response = await fetch(`${API_BASE}/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUser.id,
          strain_slug: match.strain.slug,
          rating: reviewRating,
          comment: fullReview
        })
      });

      if (response.ok) {
        setAlertMsg('Thank you for your review! It helps the community learn about this strain.');
        setAlertOpen(true);
        setShowReviewForm(false);
        setReviewText('');
        setReviewEffects('');
        setReviewFlavors('');
        setReviewRating(5);

        // Reload reviews from Supabase
        const reviewsResponse = await fetch(`${API_BASE}/api/reviews?strain_slug=${match.strain.slug}`);
        const reviewsData = await reviewsResponse.json();
        setExistingReviews(reviewsData || []);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit review');
      }
    } catch (err) {
      setAlertMsg(err.message || 'Failed to submit review. Please try again.');
      setAlertOpen(true);
    } finally {
      setSubmittingReview(false);
    }
  };

  const parseErrorResponse = async (response) => {
    try {
      const data = await response.json();
      return data.error || data.message || response.statusText || 'Unexpected error';
    } catch {
      return response.statusText || 'Unexpected error';
    }
  };

  // Handle successful poll with normalized scan object
  const handlePollSuccess = useCallback((scan, scanId) => {
    if (!scan) {
      console.warn('[ScanWizard] handlePollSuccess called without scan object');
      return;
    }

    // Create normalized scan object with all result fields properly structured
    const normalizedScan = {
      id: scan.id || scan.scanId || scan.scan_id || scanId || null,
      status: scan.status || 'completed',
      created_at: scan.created_at ?? scan.createdAt ?? null,
      processed_at: scan.processed_at ?? scan.processedAt ?? null,
      image_url:
        scan.image_url ||
        scan.imageUrl ||
        scan.result?.image_url ||
        null,
      // Move all result-like fields under result, but keep backward compatibility
      result: {
        ...(scan.result || {}),
        // Normalize seedBank
        seedBank:
          scan.result?.seedBank ??
          scan.result?.seed_bank ??
          null,
        // Normalize canonical_strain (handle both object and legacy string fields)
        canonical_strain:
          scan.result?.canonical_strain ??
          scan.result?.canonicalStrain ??
          (scan.canonical_strain_name
            ? {
                name: scan.canonical_strain_name,
                source: scan.canonical_strain_source || null,
                confidence: scan.canonical_match_confidence ?? null,
              }
            : null),
        // Normalize ai_summary
        ai_summary:
          scan.result?.ai_summary ??
          scan.result?.aiSummary ??
          scan.ai_summary ??
          scan.aiSummary ??
          null,
        // Normalize packaging_insights
        packaging_insights:
          scan.result?.packaging_insights ??
          scan.result?.packagingInsights ??
          scan.packaging_insights ??
          scan.packagingInsights ??
          null,
        // Normalize label_insights
        label_insights:
          scan.result?.label_insights ??
          scan.result?.labelInsights ??
          scan.label_insights ??
          scan.labelInsights ??
          null,
        // Normalize plant_health
        plant_health:
          scan.result?.plant_health ??
          scan.result?.plantHealth ??
          scan.plant_health ??
          scan.plantHealth ??
          null,
        // Normalize grow_profile
        grow_profile:
          scan.result?.grow_profile ??
          scan.result?.growProfile ??
          scan.grow_profile ??
          scan.growProfile ??
          null,
      },
      // Include the full scan object for backward compatibility
      ...scan,
    };

    if (!normalizedScan.id) {
      console.warn('[ScanWizard] Poll success but missing scan id', { scan, normalizedScan });
    }

    // Try to normalize the result for ScanResultCard
    const normalized = normalizeScanResult(normalizedScan);
    if (normalized) {
      normalizedScan.normalizedResult = normalized;
    }

    // Call parent callback with normalized scan
    if (onScanComplete && typeof onScanComplete === 'function') {
      onScanComplete(normalizedScan);
    } else {
      // Otherwise, switch to result view internally
      setActiveView('result');
    }
  }, [onScanComplete]);

  // Poll for scan result (similar to ScanPage)
  const pollScanResult = async (scanId, attempt = 0) => {
    const maxAttempts = 25; // ~25s at 1s delay
    const delayMs = 1000; // 1 second polling interval

    try {
      const res = await fetch(`${API_BASE}/api/scans/${scanId}`);
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || `Scan lookup failed (${res.status})`);
      }

      // Backend may return wrapped { scan: {...} } or direct scan object
      const scan = data?.scan || data;
      
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

      // Update progress based on attempt - show we're actively working
      const progressPercent = Math.min(70 + (attempt * 2), 95);
      setScanProgress(progressPercent);
      setScanPhase('matching');
      setScanMessage(`Searching our database of 35,000+ strains… (attempt ${attempt + 1})`);
      
      // Check if we have any results at all - don't wait for AI, show results immediately
      const hasVisualMatch = !!(result?.visualMatches?.match || result?.visualMatches?.candidates?.length > 0);
      const hasLabelData = !!(result?.labelInsights);
      const hasAnyMatch = !!(result?.matches?.length > 0 || result?.match);
      const hasStrainName = !!(result?.canonical_strain?.name || scan?.canonical_strain_name || result?.labelInsights?.strainName);
      
      // Show results as soon as we have ANY usable data - don't wait for AI
      if (isComplete || hasResult || hasVisualMatch || hasLabelData || hasAnyMatch || hasStrainName) {
        // Transition to finalizing
        setScanPhase('finalizing');
        setScanProgress(95);
        setScanMessage('Compiling your complete strain breakdown…');
        
        // Stop polling and show results immediately
        setIsPolling(false);
        setLoading(false); // Make sure loading is off
        
        // Normalize result for internal state
        const normalized = normalizeScanResult(scan);
        if (normalized) {
          setScanProgress(100);
          // Brief delay to show 100% before transitioning
          setTimeout(() => {
            setScanPhase(null);
            setScanProgress(null);
            setScanResult(normalized);
            setScanStatus("Scan complete!");
            
            // Also set match for backward compatibility with existing code that uses match.strain
            if (normalized.topMatch) {
              setMatch({
                strain: {
                  ...normalized.topMatch.dbMeta,
                  name: normalized.topMatch.name,
                  type: normalized.topMatch.type,
                  slug: normalized.topMatch.id,
                },
                confidence: normalized.topMatch.confidence,
              });
            }
            
            // Always call handlePollSuccess to ensure normalized scan is passed to parent
            handlePollSuccess(scan, scanId);
          }, 800);
        } else {
          setScanPhase(null);
          setScanProgress(null);
          setLoading(false);
          setScanStatus('No strain match found yet. Try a clearer photo or different angle.');
          setScanResult(null);
        }
        return;
      }
      
      // If scan has an error status or error field, stop polling and show error
      if (isError) {
        setIsPolling(false);
        setLoading(false);
        setScanPhase(null);
        setScanProgress(null);
        const errorMessage = scan?.error || scan?.errorMessage || 'Scan failed on the server.';
        setScanStatus(errorMessage);
        return;
      }

      // If we've hit max attempts, stop polling
      if (attempt >= maxAttempts) {
        setIsPolling(false);
        setLoading(false);
        setScanPhase(null);
        setScanProgress(null);
        setScanStatus('Scan is taking too long. Please try again with a clearer photo.');
        return;
      }

      // Update progress while polling - always show we're working
      // Schedule another poll attempt
      setTimeout(() => {
        pollScanResult(scanId, attempt + 1);
      }, delayMs);
    } catch (e) {
      console.error('pollScanResult error', e);
      setIsPolling(false);
      setScanPhase(null);
      setScanProgress(null);
      setScanStatus(String(e.message || e));
    }
  };

  // Simplified scan flow: pick file -> upload -> process -> call onScanComplete immediately
  // No internal polling - parent (Garden/App) handles result display
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setScanStatus("idle");
      return;
    }

    // Reset file input so same file can be selected again
    if (e.target) {
      e.target.value = '';
    }

    setLoading(true);
    setScanPhase('uploading');
    setScanProgress(10);
    setScanStatus("Uploading image...");
    setScanMessage("Securely uploading your photo to our servers…");
    setErrorMessage("");

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = reader.result.split(',')[1];

          let uploadData = null;
          if (canUseEdgeUploads && currentUser) {
            setScanPhase('uploading');
            setScanProgress(30);
            setScanMessage('Uploading image to Supabase…');
            setScanStatus('Uploading image to Supabase...');
            const edge = await uploadViaEdgeFunction({
              base64,
              filename: file.name,
              contentType: file.type,
              userId: currentUser.id
            });
            if (edge?.id) {
              uploadData = edge;
            }
          }

          if (!uploadData) {
            setScanPhase('uploading');
            setScanProgress(50);
            setScanMessage('Uploading image to backend…');
            setScanStatus('Uploading image to backend...');
            const uploadResp = await fetch(`${API_BASE}/api/uploads`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                filename: file.name,
                contentType: file.type,
                base64,
                user_id: currentUser?.id || null
              })
            });

            if (!uploadResp.ok) {
              const message = await parseErrorResponse(uploadResp);
              throw new Error(message || "Upload failed");
            }

            uploadData = await uploadResp.json();
          }

          const scanId = uploadData.id;

          // Transition to processing phase
          setScanPhase('processing');
          setScanProgress(60);
          setScanMessage('Extracting text and visual features…');
          setScanStatus("Processing scan...");

          const processResp = await fetch(`${API_BASE}/api/scans/${scanId}/process`, {
            method: "POST",
            headers: { "Content-Type": "application/json" }
          });

          if (processResp.status === 402) {
            // If user is founder, they should never hit 402 - log warning and continue
            if (isFounderFromHook) {
              console.warn('[ScanWizard] Founder account hit 402 - backend may not be recognizing founder status. Continuing anyway.');
            } else {
              let errorPayload = {};
              try {
                errorPayload = await processResp.json();
              } catch (err) {
                console.warn('[ScanWizard] Could not parse credit error payload:', err);
              }

              const tier = errorPayload.tier || 'free';
              const needsUpgrade = errorPayload.needsUpgrade || false;
              let message = errorPayload.message || 'No scan credits remaining.';

              if (needsUpgrade) {
                message = '🎯 You\'ve used all 10 free scans! Unlock StrainSpotter (20 scans) or join Monthly Member ($4.99/mo) for 200 scans/month. Top-up packs (50 • 200 • 500) are also available.';
              } else if (tier === 'member' || tier === 'monthly_member') {
                message = '📊 You\'ve used all 200 scans this month! Add a top-up pack (50 • 200 • 500 scans) or wait for your next monthly refresh.';
              } else if (tier === 'premium') {
                message = '🚀 You\'ve used the legacy premium allotment. Grab a top-up pack (50 • 200 • 500 scans) to keep scanning.';
              }

              setAlertMsg(message);
              setAlertOpen(true);
              setTopUpMessage(message);
              setShowTopUpDialog(true);
              setScanStatus('Out of credits');
              await loadCredits();
              setLoading(false);
              return;
            }
          }

          if (!processResp.ok) {
            const message = await parseErrorResponse(processResp);
            throw new Error(message || "Scan processing failed");
          }

          const processData = await processResp.json();
          
          // Get the scan object from the process response or fetch it
          let scan = processData.scan || processData;
          if (!scan || !scan.id) {
            // Fetch the scan if not in response
            const scanResp = await fetch(`${API_BASE}/api/scans/${scanId}`);
            if (scanResp.ok) {
              const scanData = await scanResp.json();
              scan = scanData.scan || scanData;
            } else {
              // If fetch fails, create minimal scan object with scanId
              scan = { id: scanId, status: 'processing' };
            }
          }

          // Transition to matching phase
          setScanPhase('matching');
          setScanProgress(70);
          setScanMessage('Searching our database of 35,000+ strains…');
          setScanStatus("Scan started successfully!");

          // Start polling with animated progress
          setIsPolling(true);
          setLoading(false); // Upload/process done, but keep polling active
          pollScanResult(scanId, 0);

          // Build normalized scan object with all required fields (same structure as handlePollSuccess)
          const normalizedScan = {
            id: scan.id || scan.scanId || scan.scan_id || scanId || null,
            status: scan.status || 'processing',
            created_at: scan.created_at ?? scan.createdAt ?? null,
            processed_at: scan.processed_at ?? scan.processedAt ?? null,
            image_url: scan.image_url ?? scan.imageUrl ?? scan.result?.image_url ?? null,
            result: {
              ...(scan.result || {}),
              // Normalize all result fields for consistency
              seedBank:
                scan.result?.seedBank ??
                scan.result?.seed_bank ??
                null,
              canonical_strain:
                scan.result?.canonical_strain ??
                scan.result?.canonicalStrain ??
                (scan.canonical_strain_name
                  ? {
                      name: scan.canonical_strain_name,
                      source: scan.canonical_strain_source || null,
                      confidence: scan.canonical_match_confidence ?? null,
                    }
                  : null),
              ai_summary:
                scan.result?.ai_summary ??
                scan.result?.aiSummary ??
                scan.ai_summary ??
                scan.aiSummary ??
                null,
              packaging_insights:
                scan.result?.packaging_insights ??
                scan.result?.packagingInsights ??
                scan.packaging_insights ??
                scan.packagingInsights ??
                null,
              label_insights:
                scan.result?.label_insights ??
                scan.result?.labelInsights ??
                scan.label_insights ??
                scan.labelInsights ??
                null,
              plant_health:
                scan.result?.plant_health ??
                scan.result?.plantHealth ??
                scan.plant_health ??
                scan.plantHealth ??
                null,
              grow_profile:
                scan.result?.grow_profile ??
                scan.result?.growProfile ??
                scan.grow_profile ??
                scan.growProfile ??
                null,
            },
            // Include the full scan object for backward compatibility
            ...scan,
          };

          // Call parent callback immediately with normalized scan object
          // Parent (Garden/App) will handle polling and result display
          if (onScanComplete && typeof onScanComplete === 'function') {
            onScanComplete(normalizedScan);
          }

          await loadCredits();
          // Don't clear loading/phase here - polling is still active
          // setLoading(false); // Keep false from above
          // setScanPhase(null); // Keep phase active for polling
          // setScanProgress(null); // Keep progress active for polling
          // setScanStatus("idle"); // Keep status active
        } catch (err) {
          console.error('Scan error:', err);
          setScanPhase(null);
          setScanProgress(null);
          setScanStatus("error");
          setErrorMessage(err.message || 'Scan failed. Please try again.');
          setAlertMsg(err.message || 'Scan failed. Please try again.');
          setAlertOpen(true);
          setLoading(false);
        }
      };
      reader.onerror = () => {
        setScanStatus("error");
        setErrorMessage("Unable to read the selected file.");
        setAlertMsg("Unable to read the selected file.");
        setAlertOpen(true);
        setLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Scan error:', err);
      setScanStatus("error");
      setErrorMessage(err.message || 'Scan failed. Please try again.');
      setAlertMsg(err.message || 'Scan failed. Please try again.');
      setAlertOpen(true);
      setLoading(false);
    }
  };

  // Poll for scans
  useEffect(() => {
    const poll = setInterval(async () => {
      try {
        const resp = await fetch(`${API_BASE}/api/scans`);
        if (resp.ok) {
          const data = await resp.json();
          const scans = data.scans || [];
          const completed = scans.filter(s => s.status === 'complete');
          if (completed.length > 0) {
            setAlertMsg(`Scan matched: ${completed.map(s => s.strain?.name || 'Unknown').join(', ')}`);
            setAlertOpen(true);
          }
          setScanHistory(scans);
        }
      } catch (err) {
        console.error('Poll error:', err);
      }
    }, 30000);
    return () => clearInterval(poll);
  }, []);

  // Match details removed - not needed in scan area

  // Dialog for tabs
  const renderDetailsDialog = () => {
    if (!match || !match.strain) return null;
    const { strain } = match;
    return (
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
        fullScreen
        PaperProps={{
          sx: {
            bgcolor: 'rgba(0,0,0,0.95)',
            m: 0,
            maxHeight: '100vh'
          }
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid rgba(124,179,66,0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">{strain.name} Details</Typography>
          <IconButton onClick={() => setDetailsOpen(false)} sx={{ color: '#fff' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <Tabs value={detailsTab} onChange={(_e, v) => setDetailsTab(v)} sx={{ borderBottom: '1px solid rgba(124,179,66,0.2)' }}>
          <Tab label="Overview" sx={{ color: '#c8ff9e' }} />
          <Tab label="Dispensaries" sx={{ color: '#c8ff9e' }} />
          <Tab label="Seeds" sx={{ color: '#c8ff9e' }} />
          <Tab label="Care Guide" sx={{ color: '#c8ff9e' }} />
        </Tabs>
        <DialogContent sx={{ bgcolor: 'rgba(0,0,0,0.95)' }}>
          {detailsTab === 0 && (
            <Box>
              <Typography variant="subtitle1" fontWeight={700}>Overview</Typography>
              {strain.description && <Typography>{strain.description}</Typography>}
            </Box>
          )}
          {detailsTab === 1 && (
            <Box>
              <Typography variant="subtitle1" fontWeight={700}>Dispensaries</Typography>
              <Typography>Nearby dispensaries feature coming soon.</Typography>
            </Box>
          )}
          {detailsTab === 2 && (
            <Box>
              <Typography variant="subtitle1" fontWeight={700}>Seeds</Typography>
              <Typography>Seed info feature coming soon.</Typography>
            </Box>
          )}
          {detailsTab === 3 && (
            <Box>
              <Typography variant="subtitle1" fontWeight={700}>Care Guide</Typography>
              <Typography>Care guide feature coming soon.</Typography>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    );
  };

  const membershipActive = (() => {
    if (typeof creditSummary?.membershipActive === 'boolean') {
      if (creditSummary.membershipActive) return true;
      if (metadataMembershipActive) return true;
      if (typeof creditSummary.monthlyBundle === 'number' && creditSummary.monthlyBundle > 0) return true;
      return false;
    }
    return metadataMembershipActive;
  })();
  const creditsRemaining = typeof creditSummary?.credits === 'number' ? creditSummary.credits : null;
  const monthlyBundle = typeof creditSummary?.monthlyBundle === 'number' ? creditSummary.monthlyBundle : null;
  const resetAt = creditSummary?.resetAt ? new Date(creditSummary.resetAt) : null;
  const accessExpiresAt = creditSummary?.accessExpiresAt ? new Date(creditSummary.accessExpiresAt) : null;
  const starterExpired = Boolean(creditSummary?.starterExpired) && !membershipActive;
  const trialDaysRemaining = typeof creditSummary?.trialDaysRemaining === 'number'
    ? creditSummary.trialDaysRemaining
    : (accessExpiresAt
        ? Math.max(0, Math.ceil((accessExpiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        : null);
  const lowCredits = typeof creditsRemaining === 'number' && creditsRemaining <= 5;
  
  // Button logic using normalized scan credits
  const isOutOfScans = !isFounder && !isGuest && (remainingScans ?? 0) <= 0;
  const primaryLabel = isOutOfScans ? 'Upgrade to keep scanning' : 'Scan';

  const trialMessage = (() => {
    if (membershipActive) return null;
    if (!accessExpiresAt) return null;
    if (starterExpired) {
      return 'Your starter access has ended. Join the Garden to keep scanning with full AI access.';
    }
    const diffDays = trialDaysRemaining ?? Math.ceil((accessExpiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) {
      return 'Starter access ends today. Join the Garden to keep scanning with full AI access.';
    }
    return `Starter access ends in ${diffDays} day${diffDays === 1 ? '' : 's'}. Join the Garden or grab a top-up pack to keep scanning.`;
  })();

  const nextResetLabel = (() => {
    if (!resetAt) return null;
    return resetAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  })();
  const accessExpiresLabel = accessExpiresAt
    ? accessExpiresAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  // Show SeedVendorFinder if user clicked Buy Seeds
  if (showSeedVendorFinder) {
    return <SeedVendorFinder onBack={() => setShowSeedVendorFinder(false)} />;
  }

  // Show DispensaryFinder if user clicked Find Dispensaries
  if (showDispensaryFinder) {
    return <DispensaryFinder onBack={() => setShowDispensaryFinder(false)} />;
  }

  // Result view - full-screen scrollable layout
  if (activeView === 'result' && scanResult) {
    return (
      <ErrorBoundary>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            overflow: 'hidden',
            bgcolor: '#000',
          }}
        >
          {/* Fixed header with back button */}
          <Box
            sx={{
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              p: 2,
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              bgcolor: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(10px)',
              zIndex: 1,
            }}
          >
            <IconButton
              edge="start"
              onClick={() => {
                setActiveView('scanner');
                setScanResult(null);
              }}
              sx={{ color: '#fff' }}
              aria-label="Go back to scanner"
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#fff', flex: 1 }}>
              Scan Result
            </Typography>
          </Box>

          {/* Scrollable content */}
          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch',
              px: 2,
              py: 2,
            }}
          >
            <Container maxWidth="md" sx={{ py: 2 }}>
              {/* Product type label */}
              {(() => {
                const isPackage = Boolean(scanResult.isPackagedProduct);
                const dbName = cleanCandidateName(
                  (scanResult?.topMatch && scanResult.topMatch.name) ||
                  scanResult?.matchedName ||
                  scanResult?.name
                );
                const labelStrain = cleanCandidateName(scanResult.labelInsights?.strainName);
                const aiTitle = cleanCandidateName(
                  scanResult.aiSummary?.title || scanResult.labelInsights?.aiSummary?.title
                );
                const primaryName = isPackage
                  ? (aiTitle || labelStrain || dbName || "Unknown product")
                  : (dbName || labelStrain || "Unknown strain");
                
                return (
                  <Typography sx={{
                    fontSize: { xs: '1.25rem', sm: '1.5rem' },
                    fontWeight: 900,
                    color: '#00e676',
                    letterSpacing: { xs: 0.5, sm: 1 },
                    mb: { xs: 1, sm: 1.5 },
                    textAlign: 'center',
                    textShadow: '0 2px 8px #388e3c',
                    fontFamily: 'Montserrat, Arial, sans-serif'
                  }}>
                    {getScanKindLabel({
                      isPackagedProduct: scanResult.isPackagedProduct || false,
                      category: scanResult.labelInsights?.category,
                      productType: scanResult.labelInsights?.productType,
                    })} identified: {primaryName}
                  </Typography>
                );
              })()}
              
              {/* ScanResultCard */}
              <ScanResultCard
                result={scanResult}
                isGuest={!currentUser}
                onSaveMatch={() => console.log('Save match')}
                onLogExperience={() => handleLeaveReviewClick()}
                onReportMismatch={() => {
                  setAlertMsg('Thank you for reporting. We\'ll review this match.');
                  setAlertOpen(true);
                }}
                onViewStrain={() => setDetailsOpen(true)}
              />

              {/* Plant Health Analysis - if available */}
              {plantHealth && (
                <Box sx={{
                  mb: { xs: 2, sm: 3 },
                  p: { xs: 2, sm: 3 },
                  bgcolor: 'rgba(0, 0, 0, 0.4)',
                  borderRadius: { xs: 2, sm: 3 },
                  border: `2px solid ${plantHealth.healthStatus.color}`,
                  boxShadow: `0 0 20px ${plantHealth.healthStatus.color}40`,
                  width: '100%',
                  mt: 2
                }}>
                  <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, mb: { xs: 1.5, sm: 2 } }}>
                    Plant Analysis
                  </Typography>
                  {/* Plant health content - simplified for result view */}
                  <Typography variant="body2" sx={{ color: '#fff' }}>
                    Growth Stage: {plantHealth.growthStage?.stage || 'Unknown'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#fff', mt: 1 }}>
                    Health Status: {plantHealth.healthStatus?.status || 'Unknown'}
                  </Typography>
                </Box>
              )}

              {/* Action buttons */}
              <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                mt: 3,
                width: '100%',
                maxWidth: '400px',
                mx: 'auto',
              }}>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => {
                    setActiveView('scanner');
                    setScanResult(null);
                    fileInputRef.current?.click();
                  }}
                  sx={{
                    py: 2,
                    fontSize: '1rem',
                    fontWeight: 700,
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #7CB342 0%, #9CCC65 100%)',
                    textTransform: 'none',
                  }}
                >
                  📷 Scan Another
                </Button>
              </Box>
            </Container>
          </Box>
        </Box>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      {!membershipComplete ? (
        <MembershipLogin onSuccess={() => setMembershipComplete(true)} />
      ) : (
        <Box
          sx={{
            height: '100dvh',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: '#0a0f0a', // Clean, solid dark green background
            color: '#fff',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {/* Header row */}
          <Box
            sx={{
              flexShrink: 0,
              pt: 'calc(env(safe-area-inset-top) + 8px)',
              px: 2,
              pb: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
            }}
          >
            <IconButton
              edge="start"
              onClick={() => onBack ? onBack() : window.history.back()}
              size="small"
              sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', color: '#fff' }}
            >
              <ArrowBackIcon fontSize="small" />
            </IconButton>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" fontWeight={600} noWrap sx={{ color: '#fff' }}>
                StrainSpotter Scanner
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }} noWrap>
                Snap packaging or buds to decode everything
              </Typography>
            </Box>
            {currentUser && (
              <Button
                variant="text"
                size="small"
                onClick={async () => {
                  try {
                    await supabase.auth.signOut();
                    setCurrentUser(null);
                    setAlertMsg('Logged out successfully');
                    setAlertOpen(true);
                    setTimeout(() => {
                      if (onBack) {
                        onBack();
                      } else {
                        window.location.href = '/';
                      }
                    }, 1000);
                  } catch (err) {
                    console.error('Logout error:', err);
                    setAlertMsg('Logout failed');
                    setAlertOpen(true);
                  }
                }}
                sx={{
                  color: '#fff',
                  textTransform: 'none',
                }}
              >
                Logout
              </Button>
            )}
          </Box>

          {/* Scrollable content */}
          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch',
              px: 2,
              pb: 2,
            }}
          >
            {/* Main content wrapper for centering */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                minHeight: '100%',
              }}
            >
            {/* Hero Image Icon */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: { xs: 1, sm: 2 } }}>
            <Box
              sx={{
                width: { xs: 50, sm: 70 },
                height: { xs: 50, sm: 70 },
                borderRadius: '50%',
                background: 'transparent',
                border: '2px solid rgba(124, 179, 66, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 30px rgba(124, 179, 66, 0.5)',
                overflow: 'hidden'
              }}
            >
              <img
                src="/hero.png?v=13"
                alt="StrainSpotter"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </Box>
          </Box>

          <Typography
            variant="h3"
            align="center"
            sx={{
              fontWeight: 900,
              letterSpacing: 1,
              color: '#fff',
              mb: { xs: 0.5, sm: 1 },
              fontSize: { xs: '1.5rem', sm: '2.5rem' },
              textShadow: '0 2px 12px #388e3c, 0 0px 2px #000',
              filter: 'drop-shadow(0 0 8px #00e676)',
              fontFamily: 'Montserrat, Arial, sans-serif'
            }}
          >
            Identify Your Cannabis Plant
          </Typography>
          <Typography
            align="center"
            sx={{
              mt: { xs: 1, sm: 2 },
              color: '#fff',
              fontSize: { xs: '0.875rem', sm: '1.375rem' },
              fontWeight: 600,
              px: { xs: 1, sm: 0 },
              textShadow: '0 1px 8px #388e3c',
              fontFamily: 'Montserrat, Arial, sans-serif'
            }}
          >
            Snap a photo of your cannabis and let our AI deliver the full strain breakdown—<span style={{ color: '#00e676', fontWeight: 900 }}>no hype</span>, just <span style={{ color: '#ffd600', fontWeight: 900 }}>next-gen science</span>.
          </Typography>

          {currentUser && (
            <Paper
              sx={{
                mt: { xs: 2, sm: 4 },
                mb: { xs: 2, sm: 3 },
                p: { xs: 2, sm: 3 },
                width: '100%',
                maxWidth: 720,
                background: 'rgba(0, 0, 0, 0.45)',
                borderRadius: { xs: 2, sm: 4 },
                border: '1px solid rgba(124, 179, 66, 0.4)',
                color: '#e8f5e9'
              }}
            >
              <Box>
                <Typography variant="subtitle2" sx={{ textTransform: 'uppercase', letterSpacing: 1, color: '#c8ff9e', fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>
                  Scan Credits
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'baseline', gap: 1, fontSize: { xs: '2rem', sm: '3rem' } }}>
                  {creditsLoading ? <CircularProgress size={28} sx={{ color: '#c8ff9e' }} /> : (
                    isFounder ? 'Unlimited' : 
                    (typeof remainingScans === 'number' && remainingScans === Infinity ? 'Unlimited' :
                    (typeof remainingScans === 'number' ? remainingScans : creditsRemaining ?? '--'))
                  )}
                  {!isFounder && !(typeof remainingScans === 'number' && remainingScans === Infinity) && (
                    <Typography component="span" variant="h6" sx={{ color: '#c8ff9e', fontWeight: 500, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                      left
                    </Typography>
                  )}
                </Typography>
                <Typography variant="body2" sx={{ color: '#d0ffd6', maxWidth: 420, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  {membershipActive
                    ? 'Membership perks active — we auto-refresh your bundle every month so you never lose your streak.'
                    : 'Starter bundle includes 20 scans. After 3 days you\'ll need a membership or a top-up pack to keep scanning.'}
                </Typography>
                {membershipActive && nextResetLabel && (
                  <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#b2fab4', fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                    Next monthly reset: {nextResetLabel}
                  </Typography>
                )}
                {!membershipActive && accessExpiresLabel && (
                  <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#ffcc80', fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                    Starter access expires: {accessExpiresLabel}
                  </Typography>
                )}
              </Box>
              {!membershipActive && trialMessage && (
                <Alert
                  severity={starterExpired ? 'error' : 'info'}
                  sx={{
                    mt: 2,
                    bgcolor: starterExpired ? 'rgba(244, 67, 54, 0.2)' : 'rgba(124, 179, 66, 0.18)',
                    color: '#fff',
                    '& .MuiAlert-icon': { color: starterExpired ? '#ffccbc' : '#c8ff9e' }
                  }}
                >
                  {trialMessage}
                </Alert>
              )}
              {membershipActive && monthlyBundle && (
                <Alert
                  severity="success"
                  sx={{
                    mt: 2,
                    bgcolor: 'rgba(76, 175, 80, 0.18)',
                    color: '#e8f5e9',
                    '& .MuiAlert-icon': { color: '#c8ff9e' }
                  }}
                >
                  Your membership includes a {monthlyBundle}-scan bundle each month. We’ll keep it topped up automatically.
                </Alert>
              )}
              {!membershipActive && lowCredits && !starterExpired && (
                <Alert
                  severity="warning"
                  sx={{
                    mt: 2,
                    bgcolor: 'rgba(255, 193, 7, 0.18)',
                    color: '#fff',
                    '& .MuiAlert-icon': { color: '#ffe082' }
                  }}
                >
                  Only {creditsRemaining} scan{creditsRemaining === 1 ? '' : 's'} left. Add a top-up pack or join the Garden to keep results flowing.
                </Alert>
              )}
              {!membershipActive && starterExpired && (
                <Alert
                  severity="error"
                  sx={{
                    mt: 2,
                    bgcolor: 'rgba(244, 67, 54, 0.25)',
                    color: '#fff',
                    '& .MuiAlert-icon': { color: '#ffccbc' }
                  }}
                >
                  Starter access has ended. Join the Garden membership or redeem a top-up pack within the app stores to continue scanning.
                </Alert>
              )}
            </Paper>
          )}

            {/* Animated scan progress */}
            {(loading || isPolling || scanPhase) && (
              <Box sx={{ mt: 4, mb: 4 }}>
                <AnimatedScanProgress
                  phase={scanPhase}
                  message={scanMessage || scanStatus}
                  progress={scanProgress}
                  error={errorMessage || null}
                />
              </Box>
            )}
            {errorMessage && !loading && (
              <Typography
                variant="body2"
                color="error"
                sx={{ mt: 2, textAlign: "center", px: 2 }}
              >
                {errorMessage}
              </Typography>
            )}
            {scanStatus && scanStatus !== "idle" && !loading && !errorMessage && (
              <Typography align="center" sx={{ mt: { xs: 1, sm: 2 }, color: '#388e3c', fontWeight: 700, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                {scanStatus}
              </Typography>
            )}
          </Box>

          {/* Scan Results Section - Only show in scanner view */}
          {scanResult && activeView === 'scanner' && (
          <Box sx={{
            mt: { xs: 2, sm: 4 },
            width: '100%',
            maxWidth: 600,
          }}>
            {/* Product type label with primary name */}
            {(() => {
              // Compute primaryName the same way as ScanResultCard
              const isPackage = Boolean(scanResult.isPackagedProduct);
              
              // Extract and clean candidate names (same logic as ScanResultCard)
              const dbName = cleanCandidateName(
                (scanResult?.topMatch && scanResult.topMatch.name) ||
                scanResult?.matchedName ||
                scanResult?.name
              );
              
              const labelStrain = cleanCandidateName(scanResult.labelInsights?.strainName);
              const aiTitle = cleanCandidateName(
                scanResult.aiSummary?.title || scanResult.labelInsights?.aiSummary?.title
              );
              
              let primaryName = null;
              
              if (isPackage) {
                primaryName = aiTitle || labelStrain || dbName || "Unknown product";
              } else {
                primaryName = dbName || labelStrain || "Unknown strain";
              }
              
              return (
                <Typography sx={{
                  fontSize: { xs: '1.25rem', sm: '1.5rem' },
                  fontWeight: 900,
                  color: '#00e676',
                  letterSpacing: { xs: 0.5, sm: 1 },
                  mb: { xs: 1, sm: 1.5 },
                  textAlign: 'center',
                  textShadow: '0 2px 8px #388e3c',
                  fontFamily: 'Montserrat, Arial, sans-serif'
                }}>
                  {getScanKindLabel({
                    isPackagedProduct: scanResult.isPackagedProduct || false,
                    category: scanResult.labelInsights?.category,
                    productType: scanResult.labelInsights?.productType,
                  })} identified: {primaryName}
                </Typography>
              );
            })()}
            
            {/* Use ScanResultCard for consistent display */}
            <ScanResultCard
              result={scanResult}
              isGuest={!currentUser}
              onSaveMatch={() => {
                // Save match functionality if needed
                console.log('Save match');
              }}
              onLogExperience={() => {
                // Log experience functionality
                handleLeaveReviewClick();
              }}
              onReportMismatch={() => {
                setAlertMsg('Thank you for reporting. We\'ll review this match.');
                setAlertOpen(true);
              }}
              onViewStrain={() => {
                // View strain details
                setDetailsOpen(true);
              }}
            />

            {/* Plant Health Analysis */}
            {plantHealth && (
              <Box sx={{
                mb: { xs: 2, sm: 3 },
                p: { xs: 2, sm: 3 },
                bgcolor: 'rgba(0, 0, 0, 0.4)',
                borderRadius: { xs: 2, sm: 3 },
                border: `2px solid ${plantHealth.healthStatus.color}`,
                boxShadow: `0 0 20px ${plantHealth.healthStatus.color}40`,
                width: '100%'
              }}>
                <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, mb: { xs: 1.5, sm: 2 }, display: 'flex', alignItems: 'center', gap: 1, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Box component="img" src="/hero.png?v=13" alt="" sx={{ width: 18, height: 18, filter: 'drop-shadow(0 0 4px rgba(124, 179, 66, 0.6))' }} />
                    <span>Plant Analysis</span>
                  </Stack>
                </Typography>

                {/* Growth Stage */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ color: '#9CCC65', fontWeight: 700, mb: 0.5 }}>
                    Growth Stage:
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#fff', fontSize: 18, fontWeight: 600 }}>
                    {plantHealth.growthStage.icon} {plantHealth.growthStage.stage}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#b0b0b0', mt: 0.5 }}>
                    {plantHealth.growthStage.description}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#808080' }}>
                    Timeframe: {plantHealth.growthStage.timeframe}
                  </Typography>
                </Box>

                {/* Health Status */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ color: '#9CCC65', fontWeight: 700, mb: 0.5 }}>
                    Health Status:
                  </Typography>
                  <Chip
                    label={plantHealth.healthStatus.status}
                    sx={{
                      bgcolor: `${plantHealth.healthStatus.color}30`,
                      color: plantHealth.healthStatus.color,
                      fontWeight: 700,
                      border: `2px solid ${plantHealth.healthStatus.color}`,
                      fontSize: 16,
                      px: 2,
                      py: 2.5
                    }}
                  />
                  {plantHealth.healthStatus.issues.length > 0 && (
                    <Box sx={{ mt: 1 }}>
                      {plantHealth.healthStatus.issues.map((issue, idx) => (
                        <Typography key={idx} variant="body2" sx={{ color: '#fff', mt: 0.5 }}>
                          • {issue}
                        </Typography>
                      ))}
                    </Box>
                  )}
                </Box>

                {/* Recommendations */}
                {plantHealth.recommendations && plantHealth.recommendations.length > 0 && (
                  <Box>
                    <Typography variant="body2" sx={{ color: '#9CCC65', fontWeight: 700, mb: 1 }}>
                      Care Recommendations:
                    </Typography>
                    <Stack spacing={0.5}>
                      {plantHealth.recommendations.map((rec, idx) => (
                        <Typography key={idx} variant="body2" sx={{ color: '#fff', fontSize: 14 }}>
                          {rec}
                        </Typography>
                      ))}
                    </Stack>
                  </Box>
                )}

                {/* Confidence */}
                <ConfidenceCallout confidence={plantHealth.confidence} />
              </Box>
            )}


            {/* Review Section */}
            <Box sx={{
              mt: 3,
              mb: 3,
              p: 3,
              bgcolor: 'rgba(0, 0, 0, 0.3)',
              borderRadius: 3,
              border: '2px solid rgba(124, 179, 66, 0.3)',
              width: '100%'
            }}>
              <Typography variant="h6" sx={{ color: '#00e676', fontWeight: 700, mb: 2 }}>
                📝 Share Your Experience
              </Typography>

              {!showReviewForm ? (
                <>
                  <Typography variant="body2" color="#fff" sx={{ mb: 2 }}>
                    Have you tried {match.strain?.name}? Help the community by sharing your experience with effects, flavors, and overall rating.
                  </Typography>
                  <Button
                    variant="contained"
                    sx={{
                      fontWeight: 700,
                      borderRadius: 999,
                      px: 4,
                      py: 1,
                      fontSize: 16,
                      boxShadow: 'none',
                      bgcolor: 'rgba(124, 179, 66, 0.3)',
                      border: '2px solid rgba(124, 179, 66, 0.6)',
                      backdropFilter: 'blur(10px)',
                      color: '#fff',
                      textTransform: 'none',
                      '&:hover': {
                        bgcolor: 'rgba(124, 179, 66, 0.5)',
                        border: '2px solid rgba(124, 179, 66, 0.8)'
                      }
                    }}
                    onClick={handleLeaveReviewClick}
                  >
                    ✍️ Leave a Review {!currentUser && '(Members Only)'}
                  </Button>
                </>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    label="Your Review"
                    multiline
                    rows={4}
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Share your experience with this strain..."
                    fullWidth
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: '#fff',
                        '& fieldset': { borderColor: 'rgba(124, 179, 66, 0.5)' },
                        '&:hover fieldset': { borderColor: 'rgba(124, 179, 66, 0.7)' },
                        '&.Mui-focused fieldset': { borderColor: 'rgba(124, 179, 66, 0.9)' }
                      },
                      '& .MuiInputLabel-root': { color: '#fff' }
                    }}
                  />
                  <TextField
                    label="Effects (comma-separated)"
                    value={reviewEffects}
                    onChange={(e) => setReviewEffects(e.target.value)}
                    placeholder="e.g., relaxed, happy, euphoric"
                    fullWidth
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: '#fff',
                        '& fieldset': { borderColor: 'rgba(124, 179, 66, 0.5)' },
                        '&:hover fieldset': { borderColor: 'rgba(124, 179, 66, 0.7)' },
                        '&.Mui-focused fieldset': { borderColor: 'rgba(124, 179, 66, 0.9)' }
                      },
                      '& .MuiInputLabel-root': { color: '#fff' }
                    }}
                  />
                  <TextField
                    label="Flavors (comma-separated)"
                    value={reviewFlavors}
                    onChange={(e) => setReviewFlavors(e.target.value)}
                    placeholder="e.g., berry, sweet, earthy"
                    fullWidth
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: '#fff',
                        '& fieldset': { borderColor: 'rgba(124, 179, 66, 0.5)' },
                        '&:hover fieldset': { borderColor: 'rgba(124, 179, 66, 0.7)' },
                        '&.Mui-focused fieldset': { borderColor: 'rgba(124, 179, 66, 0.9)' }
                      },
                      '& .MuiInputLabel-root': { color: '#fff' }
                    }}
                  />
                  <Box>
                    <Typography variant="body2" color="#fff" sx={{ mb: 1 }}>
                      Rating: {reviewRating}/10
                    </Typography>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={reviewRating}
                      onChange={(e) => setReviewRating(parseInt(e.target.value))}
                      style={{ width: '100%' }}
                    />
                  </Box>
                  <Stack direction="row" spacing={2}>
                    <Button
                      variant="contained"
                      disabled={submittingReview || !reviewText.trim()}
                      sx={{
                        fontWeight: 700,
                        borderRadius: 999,
                        px: 4,
                        py: 1,
                        fontSize: 16,
                        boxShadow: 'none',
                        bgcolor: 'rgba(124, 179, 66, 0.3)',
                        border: '2px solid rgba(124, 179, 66, 0.6)',
                        backdropFilter: 'blur(10px)',
                        color: '#fff',
                        textTransform: 'none',
                        '&:hover': {
                          bgcolor: 'rgba(124, 179, 66, 0.5)',
                          border: '2px solid rgba(124, 179, 66, 0.8)'
                        }
                      }}
                      onClick={handleSubmitReview}
                    >
                      {submittingReview ? <CircularProgress size={20} color="inherit" /> : 'Submit Review'}
                    </Button>
                    <Button
                      variant="outlined"
                      disabled={submittingReview}
                      sx={{
                        fontWeight: 700,
                        borderRadius: 999,
                        px: 4,
                        py: 1,
                        fontSize: 16,
                        boxShadow: 'none',
                        bgcolor: 'rgba(124, 179, 66, 0.2)',
                        border: '2px solid rgba(124, 179, 66, 0.5)',
                        backdropFilter: 'blur(10px)',
                        color: '#fff',
                        textTransform: 'none',
                        '&:hover': {
                          bgcolor: 'rgba(124, 179, 66, 0.3)',
                          border: '2px solid rgba(124, 179, 66, 0.7)'
                        }
                      }}
                      onClick={() => setShowReviewForm(false)}
                    >
                      Cancel
                    </Button>
                  </Stack>
                </Box>
              )}
            </Box>

            {/* Existing Reviews Section */}
            {existingReviews.length > 0 && (
              <Box sx={{
                mt: 3,
                mb: 3,
                p: 3,
                bgcolor: 'rgba(0, 0, 0, 0.3)',
                borderRadius: 3,
                border: '2px solid rgba(124, 179, 66, 0.3)',
                width: '100%'
              }}>
                <Typography variant="h6" sx={{ color: '#00e676', fontWeight: 700, mb: 2 }}>
                  💬 Community Reviews ({existingReviews.length})
                </Typography>

                <Stack spacing={2}>
                  {existingReviews.map((review, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        p: 2,
                        bgcolor: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: 2,
                        borderLeft: '3px solid rgba(124, 179, 66, 0.6)'
                      }}
                    >
                      <Typography variant="body2" sx={{ color: '#ffd600', fontWeight: 700, mb: 1 }}>
                        {review.users?.username || review.user || 'Anonymous'} • {new Date(review.created_at || review.date).toLocaleDateString()}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#fff', whiteSpace: 'pre-line' }}>
                        {review.comment || review.review}
                      </Typography>
                      {review.rating && (
                        <Typography variant="body2" sx={{ color: '#00e676', mt: 1 }}>
                          ⭐ Rating: {review.rating}/5
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}

            {/* Quick Action Buttons - Seeds & Dispensaries - Mobile Optimized */}
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              mt: 3,
              width: '100%',
              maxWidth: '400px',
              mx: 'auto',
              px: 2
            }}>
              <Button
                variant="contained"
                fullWidth
                onClick={() => {
                  if (currentUser) {
                    // Logged-in users: Navigate to in-app seed vendor finder
                    setShowSeedVendorFinder(true);
                  } else {
                    // Anonymous users: Open external seed vendor site
                    const strainName = match.strain?.slug || match.strain?.name;
                    window.open(`https://www.seedsman.com/en/search?q=${encodeURIComponent(strainName)}`, '_blank');
                  }
                }}
                sx={{
                  py: 2,
                  fontSize: '1rem',
                  fontWeight: 700,
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #7CB342 0%, #9CCC65 100%)',
                  boxShadow: '0 4px 12px rgba(124, 179, 66, 0.3)',
                  textTransform: 'none',
                  transition: 'all 0.2s ease',
                  '&:active': {
                    transform: 'scale(0.98)',
                    boxShadow: '0 2px 8px rgba(124, 179, 66, 0.4)'
                  }
                }}
              >
                🌱 Buy Seeds
              </Button>

              <Button
                variant="outlined"
                fullWidth
                onClick={() => {
                  if (currentUser) {
                    // Logged-in users: Navigate to in-app dispensary finder
                    setShowDispensaryFinder(true);
                  } else {
                    // Anonymous users: Open Google search
                    const strainName = match.strain?.name || match.strain?.slug;
                    window.open(`https://www.google.com/search?q=${encodeURIComponent(strainName + ' cannabis dispensary near me')}`, '_blank');
                  }
                }}
                sx={{
                  py: 2,
                  fontSize: '1rem',
                  fontWeight: 700,
                  borderRadius: '12px',
                  border: '2px solid rgba(124, 179, 66, 0.6)',
                  color: '#9CCC65',
                  textTransform: 'none',
                  transition: 'all 0.2s ease',
                  '&:active': {
                    transform: 'scale(0.98)',
                    background: 'rgba(124, 179, 66, 0.15)',
                    border: '2px solid rgba(124, 179, 66, 0.8)'
                  }
                }}
              >
                🏪 Find Dispensaries
              </Button>
            </Box>

            {/* Action Buttons */}
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: { xs: 1.5, sm: 2 },
              mt: { xs: 2, sm: 3 },
              background: 'rgba(30,30,30,0.25)',
              backdropFilter: 'blur(16px) saturate(180%)',
              borderRadius: { xs: 3, sm: 6 },
              px: { xs: 2, sm: 4 },
              py: { xs: 2, sm: 3 },
              boxShadow: '0 4px 32px 0 rgba(0,0,0,0.12)',
              border: '1px solid rgba(255,255,255,0.18)',
              width: '100%'
            }}>
              <input
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                ref={fileInputRef}
                onChange={handleFileChange}
              />

              {/* Scan Another Button */}
              <Button
                variant="contained"
                color="success"
                fullWidth
                sx={{
                  fontWeight: 700,
                  borderRadius: 999,
                  px: { xs: 3, sm: 5 },
                  py: { xs: 1.25, sm: 1.5 },
                  fontSize: { xs: '0.95rem', sm: '1.125rem' },
                  boxShadow: 'none',
                  bgcolor: 'rgba(124, 179, 66, 0.3)',
                  border: '2px solid rgba(124, 179, 66, 0.6)',
                  backdropFilter: 'blur(10px)',
                  color: '#fff',
                  textTransform: 'none',
                  maxWidth: { xs: '100%', sm: '400px' },
                  '&:hover': {
                    bgcolor: 'rgba(124, 179, 66, 0.5)',
                    border: '2px solid rgba(124, 179, 66, 0.8)'
                  },
                  '&:active': {
                    transform: 'scale(0.98)'
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <span role="img" aria-label="camera" style={{ marginRight: 8 }}>📷</span>
                Scan Another Strain
              </Button>

              {loading && (
                <CircularProgress color="success" sx={{ mt: { xs: 1, sm: 2 } }} />
              )}
              {scanStatus && !loading && (
                <Typography align="center" sx={{ mt: { xs: 1, sm: 2 }, color: '#00e676', fontWeight: 700, fontSize: { xs: '0.875rem', sm: '1rem' } }}>{scanStatus}</Typography>
              )}
            </Box>
            {match.strain?.labTestResults && match.strain.labTestResults.length > 0 && (
              <Box sx={{ mb: 2, width: '100%' }}>
                <Typography variant="subtitle2" color="#fff" gutterBottom>Lab Test Results:</Typography>
                <Stack spacing={1}>
                  {match.strain.labTestResults.map((test, idx) => (
                    <Box key={idx} sx={{ bgcolor: 'rgba(255,255,255,0.10)', backdropFilter: 'blur(6px)', borderRadius: 2, p: 1 }}>
                      <Typography variant="body2" color="#fff">
                        {test.date && <span><strong>Date:</strong> {test.date} </span>}
                        {test.lab && <span><strong>Lab:</strong> {test.lab} </span>}
                        {test.testType && <span><strong>Type:</strong> {test.testType} </span>}
                        {typeof test.thc === 'number' && <span><strong>THC:</strong> {test.thc}% </span>}
                        {typeof test.cbd === 'number' && <span><strong>CBD:</strong> {test.cbd}% </span>}
                        {test.comment && <span><strong>Note:</strong> {test.comment}</span>}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}
            {match.strain?.growTips && (
              <Box sx={{ mb: 2, width: '100%' }}>
                <Typography variant="subtitle2" color="#fff" gutterBottom>Grow Tips:</Typography>
                <Typography variant="body2" color="#fff">{match.strain.growTips}</Typography>
              </Box>
            )}
            {match.strain?.seedVendors && match.strain.seedVendors.length > 0 && (
              <Box sx={{ mb: 2, width: '100%' }}>
                <Typography variant="subtitle2" color="#fff" gutterBottom>Seed Vendors:</Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {match.strain.seedVendors.map((vendor, idx) => (
                    <Chip
                      key={idx}
                      label={vendor.name}
                      size="small"
                      variant="outlined"
                      component="a"
                      href={vendor.url}
                      clickable
                      sx={{
                        borderColor: '#7CB342',
                        color: '#9CCC65',
                        '&:hover': {
                          borderColor: '#9CCC65',
                          bgcolor: 'rgba(124, 179, 66, 0.1)'
                        }
                      }}
                    />
                  ))}
                </Stack>
              </Box>
            )}
            {match.strain?.breeder && (
              <Box sx={{ mb: 2, width: '100%' }}>
                <Typography variant="subtitle2" color="#fff" gutterBottom>Breeder:</Typography>
                <Typography variant="body2" color="#fff">{match.strain.breeder}</Typography>
              </Box>
            )}
            {/* Reviews are shown in renderMatchDetails below */}
          </Box>
        )}
        {/* Scan History Section - Members Only */}
        {currentUser && (
          <Box sx={{ mt: 4 }}>
            <Box sx={{
              borderRadius: 6,
              p: 3,
              boxShadow: 'none',
              border: 'none'
            }}>
              <Typography variant="h6" sx={{ mb: 2, color: '#fff' }}>Your Scan History</Typography>
              <Stack spacing={2}>
                {scanHistory && Array.isArray(scanHistory) && scanHistory.length === 0 ? (
                  <Typography sx={{ color: '#e0e0e0' }}>No scans yet.</Typography>
                ) : (
                  (scanHistory || []).map((scan, idx) => (
                    <Paper key={scan?.id || idx} sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: 'rgba(255,255,255,0.1)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(124, 179, 66, 0.3)',
                      boxShadow: 'none'
                    }}>
                      <Typography variant="body2" sx={{ color: '#fff' }}>
                        {scan?.status === 'pending' ? 'Pending scan...' : `Matched: ${scan?.strain?.name || 'Unknown'}`}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#e0e0e0' }}>
                        {scan?.created}
                      </Typography>
                    </Paper>
                  ))
                )}
              </Stack>
            </Box>
          </Box>
        )}
        {result && !match && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" fontWeight={700}>
              Raw Scan Result
            </Typography>
            <Box sx={{ mt: 1, p: 2, borderRadius: 4 }}>
              <pre style={{ textAlign: "left", fontSize: 14 }}>{JSON.stringify(result, null, 2)}</pre>
            </Box>
          </Box>
        )}
          {renderDetailsDialog()}

          <Dialog
            open={showTopUpDialog}
            onClose={() => setShowTopUpDialog(false)}
            maxWidth="sm"
            fullWidth
            fullScreen
            PaperProps={{
              sx: {
                bgcolor: '#111',
                m: 0,
                maxHeight: '100vh'
              }
            }}
          >
            <DialogTitle sx={{ bgcolor: '#111', color: '#c8ff9e', fontWeight: 700, borderBottom: '1px solid rgba(124,179,66,0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Keep Your Scans Going</Typography>
              <IconButton onClick={() => setShowTopUpDialog(false)} sx={{ color: '#c8ff9e' }}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent sx={{ bgcolor: '#111', color: '#fff', pt: 3 }}>
              {topUpMessage && (
                <DialogContentText sx={{ color: '#e0ffe3', mb: 2 }}>
                  {topUpMessage}
                </DialogContentText>
              )}
              {!membershipActive && (
                <Paper
                  sx={{
                    p: 2,
                    mb: 3,
                    background: 'linear-gradient(135deg, rgba(124,179,66,0.25), rgba(0,0,0,0.65))',
                    border: '1px solid rgba(124,179,66,0.4)',
                    borderRadius: 3
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#c8ff9e', mb: 1 }}>
                    Garden Membership · $7.99 / month
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#e8f5e9', mb: 1 }}>
                    Unlimited monthly scan bundles, private grower community access, and priority support. Perfect if you scan often or want the full Garden experience.
                  </Typography>
                  <Button
                    variant="contained"
                    color="success"
                    fullWidth
                    sx={{ mt: 1, borderRadius: 999, textTransform: 'none', fontWeight: 700 }}
                    onClick={() => {
                      setShowTopUpDialog(false);
                      setShowMembershipDialog(true);
                    }}
                  >
                    Join the Garden
                  </Button>
                </Paper>
              )}

              <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)', mb: 3 }} />

              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#c8ff9e', mb: 1 }}>
                Quick Top-Up Packs (3-day access window)
              </Typography>
              <Typography variant="body2" sx={{ color: '#e8f5e9', mb: 2 }}>
                Redeem on iOS or Android. Each pack reloads your credits instantly and keeps your non-member access alive for 3 more days.
              </Typography>
              <Stack spacing={2} sx={{ mb: 3 }}>
                {topUpOptions.map((pack) => (
                  <Paper
                    key={pack.credits}
                    sx={{
                      p: 2,
                      borderRadius: 3,
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(124,179,66,0.3)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <Box>
                      <Typography variant="subtitle1" sx={{ color: '#fff', fontWeight: 700 }}>
                        {pack.credits} scans
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#c8ff9e' }}>
                        Expires 3 days after activation
                      </Typography>
                    </Box>
                    <Button
                      variant="outlined"
                      sx={{
                        borderColor: 'rgba(200,255,158,0.7)',
                        color: '#c8ff9e',
                        textTransform: 'none',
                        borderRadius: 999,
                        fontWeight: 600,
                        '&:hover': { borderColor: 'rgba(200,255,158,1)' }
                      }}
                      onClick={() => {
                        setAlertMsg('Checkout for scan packs happens through Apple App Store or Google Play. Launch the mobile app to complete your purchase.');
                        setAlertOpen(true);
                      }}
                    >
                      {pack.price}
                    </Button>
                  </Paper>
                ))}
              </Stack>

              <Alert
                severity="info"
                sx={{
                  bgcolor: 'rgba(124, 179, 66, 0.2)',
                  color: '#e8f5e9',
                  '& .MuiAlert-icon': { color: '#c8ff9e' }
                }}
              >
                Purchases finalize inside the Apple App Store or Google Play app. Once the store confirms your order we auto-sync credits to your account. Need a hand? Email support@strainspotter.com.
              </Alert>
            </DialogContent>
            <DialogActions sx={{ bgcolor: '#111', borderTop: '1px solid rgba(255,255,255,0.12)' }}>
              <Button onClick={() => setShowTopUpDialog(false)} sx={{ color: '#c8ff9e', textTransform: 'none' }}>
                Close
              </Button>
            </DialogActions>
          </Dialog>

          {/* Membership Dialog */}
          <Dialog
            open={showMembershipDialog}
            onClose={() => setShowMembershipDialog(false)}
            maxWidth="sm"
            fullWidth
            fullScreen
            PaperProps={{
              sx: {
                bgcolor: 'rgba(0, 0, 0, 0.95)',
                m: 0,
                maxHeight: '100vh'
              }
            }}
          >
            <DialogTitle sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              bgcolor: 'rgba(0, 0, 0, 0.9)',
              color: '#00e676',
              borderBottom: '1px solid rgba(124,179,66,0.3)'
            }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Box component="img" src="/hero.png?v=13" alt="" sx={{ width: 18, height: 18, filter: 'drop-shadow(0 0 4px rgba(124, 179, 66, 0.6))' }} />
                  <span>Garden Membership Access</span>
                </Stack>
              </Typography>
              <IconButton
                onClick={() => setShowMembershipDialog(false)}
                sx={{ color: '#fff' }}
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent sx={{ bgcolor: 'rgba(0, 0, 0, 0.9)', color: '#fff', pt: 3 }}>
              <Typography variant="body1" sx={{ mb: 3 }}>
                Membership unlocks unlimited scan refills, in-depth strain tools, and the private grower community. Join the StrainSpotter Garden to:
              </Typography>
              <Box component="ul" sx={{ pl: 3, mb: 3 }}>
                <li>Access unlimited AI scan bundles every month</li>
                <li>Unlock reviews, ratings, and premium strain breakdowns</li>
                <li>Connect with certified growers in members-only chats</li>
                <li>Get early access to new cultivation features</li>
                <li>Support the AI lab that keeps strain matching sharp</li>
              </Box>
              <MembershipLogin onSuccess={() => {
                setShowMembershipDialog(false);
                setAlertMsg('Welcome to the Garden! Membership perks are now active.');
                setAlertOpen(true);
                loadCredits();
              }} />
            </DialogContent>
          </Dialog>

          <Snackbar
            open={alertOpen}
            autoHideDuration={4000}
            onClose={() => setAlertOpen(false)}
            message={alertMsg}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          />

          {/* Floating Feedback Button */}
          <Tooltip title="Send Feedback" placement="left">
            <Fab
              color="primary"
              onClick={() => setShowFeedback(true)}
              sx={{
                position: 'fixed',
                bottom: 24,
                right: 24,
                zIndex: 1000,
                background: 'linear-gradient(135deg, #7CB342 0%, #9CCC65 100%)',
                boxShadow: '0 8px 30px rgba(124, 179, 66, 0.4)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #9CCC65 0%, #7CB342 100%)',
                  boxShadow: '0 12px 40px rgba(124, 179, 66, 0.6)',
                  transform: 'scale(1.05)'
                }
              }}
            >
              <FeedbackIcon />
            </Fab>
          </Tooltip>

          {/* Feedback Modal */}
          <FeedbackModal
            open={showFeedback}
            onClose={() => setShowFeedback(false)}
            user={currentUser}
          />
          </Box>

          {/* Bottom actions */}
          <Box
            sx={{
              position: 'sticky',
              bottom: 0,
              zIndex: 20,
              background: 'linear-gradient(to top, rgba(3,10,3,0.95), rgba(3,10,3,0.4))',
              pt: 1,
              pb: 'calc(env(safe-area-inset-bottom) + 8px)',
              px: 2,
              flexShrink: 0,
            }}
          >
            <input
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={() => {
                if (isOutOfScans) {
                  // Show upgrade dialog if out of scans
                  const message = starterExpired
                    ? 'Your starter access window has ended. Join the Garden membership or purchase a top-up pack within 3 days to keep scanning.'
                    : 'You are out of scan credits. Join the Garden or purchase a top-up pack to continue scanning.';
                  setAlertMsg(message);
                  setAlertOpen(true);
                  setTopUpMessage(message);
                  setShowTopUpDialog(true);
                  return;
                }
                fileInputRef.current?.click();
              }}
              disabled={isOutOfScans || loading}
              sx={{
                borderRadius: 999,
                py: 1.4,
                fontWeight: 600,
                textTransform: 'none',
                mb: 1,
              }}
            >
              {loading ? 'Scanning…' : primaryLabel}
            </Button>
            
            {/* Show remaining scans count when available and not unlimited */}
            {!isOutOfScans && !isFounder && typeof remainingScans === 'number' && remainingScans > 0 && remainingScans !== Infinity && (
              <Typography variant="body2" sx={{ mt: 1, textAlign: 'center', color: '#c8ff9e', opacity: 0.9 }}>
                {remainingScans} scan{remainingScans === 1 ? '' : 's'} remaining
              </Typography>
            )}
          </Box>
        </Box>
      )}
    </ErrorBoundary>
  );
}
