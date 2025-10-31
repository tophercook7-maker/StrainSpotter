import { useRef, useState, useEffect } from "react";
import MembershipLogin from "./MembershipLogin";
import ErrorBoundary from "./ErrorBoundary";
import Snackbar from '@mui/material/Snackbar';
import { Container, Box, Button, Typography, Paper, CircularProgress, Tabs, Tab, Dialog, DialogTitle, DialogContent, Chip, Stack, TextField, IconButton } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import { supabase } from '../supabaseClient';

let API_BASE = "http://localhost:5181";
try {
  if (import.meta.env && import.meta.env.VITE_API_BASE) {
    API_BASE = import.meta.env.VITE_API_BASE;
  }
} catch (e) {
  console.warn('Could not load API_BASE from env:', e);
}

export default function ScanWizard({ onBack }) {
  const fileInputRef = useRef(null);
  const [membershipComplete, setMembershipComplete] = useState(true); // Skip membership for now
  const [loading, setLoading] = useState(false);
  const [scanStatus, setScanStatus] = useState("");
  const [result, setResult] = useState(null);
  const [match, setMatch] = useState(null);
  const [pendingScans, setPendingScans] = useState([]);
  const [scanHistory, setScanHistory] = useState([]);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMsg, setAlertMsg] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsTab, setDetailsTab] = useState(0);

  // Review state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [reviewEffects, setReviewEffects] = useState("");
  const [reviewFlavors, setReviewFlavors] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [existingReviews, setExistingReviews] = useState([]);

  // Auth state
  const [currentUser, setCurrentUser] = useState(null);
  const [showMembershipDialog, setShowMembershipDialog] = useState(false);

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

  // Handle file selection and upload
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setScanStatus("Uploading image...");

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result.split(',')[1];

        // Step 1: Upload image
        const uploadResp = await fetch(`${API_BASE}/api/uploads`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: file.name,
            contentType: file.type,
            base64
          })
        });

        if (!uploadResp.ok) throw new Error("Upload failed");
        const uploadData = await uploadResp.json();
        const scanId = uploadData.id;

        setScanStatus("Processing scan...");

        // Step 2: Process scan
        const processResp = await fetch(`${API_BASE}/api/scans/${scanId}/process`, {
          method: "POST",
          headers: { "Content-Type": "application/json" }
        });

        if (!processResp.ok) throw new Error("Scan processing failed");
        const processData = await processResp.json();
        setResult(processData.result);
        setScanStatus("Matching strain...");

        // Step 3: Visual match
        const matchResp = await fetch(`${API_BASE}/api/visual-match`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ visionResult: processData.result })
        });

        if (matchResp.ok) {
          const matchData = await matchResp.json();
          if (matchData.matches && matchData.matches.length > 0) {
            const topMatch = matchData.matches[0];
            setMatch(topMatch);

            // Step 4: Save the matched strain to the scan record
            try {
              await fetch(`${API_BASE}/api/scans/${scanId}/save-match`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  matched_strain_slug: topMatch.strain.slug,
                  user_id: currentUser?.id || null
                })
              });
            } catch (saveErr) {
              console.error('Failed to save match:', saveErr);
              // Don't fail the whole scan if saving the match fails
            }

            setScanStatus("Scan complete!");
          } else {
            setScanStatus("No matches found");
          }
        }
        setLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Scan error:', err);
      setScanStatus("Error: Upload or scan failed");
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
          const pending = (data.scans || []).filter(s => s.status === 'pending');
          const completed = (data.scans || []).filter(s => s.status === 'complete');
          if (completed.length > 0) {
            setAlertMsg(`Scan matched: ${completed.map(s => s.strain?.name || 'Unknown').join(', ')}`);
            setAlertOpen(true);
          }
          setPendingScans(pending);
          setScanHistory(data.scans || []);
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
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{strain.name} Details</DialogTitle>
        <Tabs value={detailsTab} onChange={(_e, v) => setDetailsTab(v)}>
          <Tab label="Overview" />
          <Tab label="Dispensaries" />
          <Tab label="Seeds" />
          <Tab label="Care Guide" />
        </Tabs>
        <DialogContent>
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

  return (
    <ErrorBoundary>
      {!membershipComplete ? (
        <MembershipLogin onSuccess={() => setMembershipComplete(true)} />
      ) : (
        <Container
          maxWidth="md"
          sx={{
            minHeight: '100vh',
            width: '100vw',
            py: 2,
            pb: 10,
            background: 'none',
            backdropFilter: 'none',
            boxShadow: 'none',
            opacity: 1,
            borderRadius: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Box sx={{ position: 'absolute', top: 24, left: 24, zIndex: 100 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => onBack ? onBack() : window.history.back()}
              sx={{
                fontWeight: 700,
                borderRadius: 999,
                px: 4,
                py: 1,
                fontSize: 18,
                boxShadow: 'none',
                bgcolor: '#1976d2',
                color: '#fff',
                textTransform: 'none'
              }}
            >
              ← Back to Garden
            </Button>
          </Box>

          <Typography
            variant="h3"
            align="center"
            sx={{
              fontWeight: 900,
              letterSpacing: 1,
              color: '#fff',
              mb: 1,
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
              mt: 2,
              color: '#fff',
              fontSize: 22,
              fontWeight: 600,
              textShadow: '0 1px 8px #388e3c',
              fontFamily: 'Montserrat, Arial, sans-serif'
            }}
          >
            Snap a photo of your cannabis and let our AI deliver the full strain breakdown—<span style={{ color: '#00e676', fontWeight: 900 }}>no hype</span>, just <span style={{ color: '#ffd600', fontWeight: 900 }}>next-gen science</span>.
          </Typography>

          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <input
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            <Button
              variant="contained"
              color="success"
              sx={{
                fontWeight: 700,
                borderRadius: 999,
                px: 5,
                py: 1.5,
                fontSize: 20,
                boxShadow: 'none',
                mb: 2,
                bgcolor: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(8px)',
                color: '#388e3c',
                textTransform: 'none'
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <span role="img" aria-label="camera" style={{ marginRight: 8 }}>📷</span>
              Add Photo & Scan
            </Button>
            {loading && (
              <CircularProgress color="success" sx={{ mt: 2 }} />
            )}
            {scanStatus && !loading && (
              <Typography align="center" sx={{ mt: 2, color: '#388e3c', fontWeight: 700 }}>
                {scanStatus}
              </Typography>
            )}
          </Box>

          {/* Scan Results Section */}
          {match && (
          <Box sx={{
            mt: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 6,
            p: 3,
            maxWidth: 600,
            minHeight: 200,
            width: '100%',
            opacity: 1,
            boxShadow: 'none',
            border: 'none'
          }}>
            <Typography sx={{
              fontSize: 32,
              fontWeight: 900,
              color: '#00e676',
              letterSpacing: 2,
              mb: 1,
              textShadow: '0 2px 12px #388e3c, 0 0px 2px #000',
              filter: 'drop-shadow(0 0 8px #00e676)',
              fontFamily: 'Montserrat, Arial, sans-serif'
            }}>
              Strain Identified!
            </Typography>
            <Typography sx={{
              fontSize: 26,
              fontWeight: 900,
              color: '#ffd600',
              mb: 2,
              textShadow: '0 2px 8px #388e3c',
              fontFamily: 'Montserrat, Arial, sans-serif'
            }}>
              {match.strain?.name}
            </Typography>

            {/* Type Badge */}
            {match.strain?.type && (
              <Chip
                label={match.strain.type}
                color={match.strain.type === 'Indica' ? 'primary' : match.strain.type === 'Sativa' ? 'success' : 'secondary'}
                sx={{ mb: 2, fontSize: 16, fontWeight: 700 }}
              />
            )}

            {/* THC/CBD */}
            {(match.strain?.thc || match.strain?.cbd) && (
              <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                {match.strain.thc && (
                  <Chip
                    label={`THC: ${match.strain.thc}%`}
                    sx={{
                      bgcolor: 'rgba(255, 152, 0, 0.3)',
                      color: '#fff',
                      fontWeight: 700,
                      border: '2px solid rgba(255, 152, 0, 0.6)',
                      fontSize: 14
                    }}
                  />
                )}
                {match.strain.cbd && (
                  <Chip
                    label={`CBD: ${match.strain.cbd}%`}
                    sx={{
                      bgcolor: 'rgba(33, 150, 243, 0.3)',
                      color: '#fff',
                      fontWeight: 700,
                      border: '2px solid rgba(33, 150, 243, 0.6)',
                      fontSize: 14
                    }}
                  />
                )}
              </Stack>
            )}

            {/* Description */}
            {match.strain?.description && (
              <Typography variant="body1" sx={{ color: '#fff', mb: 3, fontSize: 16, lineHeight: 1.6 }}>
                {match.strain.description}
              </Typography>
            )}

            {/* Effects */}
            {match.strain?.effects && match.strain.effects.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ color: '#00e676', fontWeight: 700, mb: 1 }}>
                  Effects:
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {match.strain.effects.map((effect, i) => (
                    <Chip
                      key={i}
                      label={effect}
                      size="small"
                      sx={{
                        bgcolor: 'rgba(0, 230, 118, 0.2)',
                        color: '#fff',
                        border: '1px solid rgba(0, 230, 118, 0.4)'
                      }}
                    />
                  ))}
                </Stack>
              </Box>
            )}

            {/* Flavors */}
            {match.strain?.flavors && match.strain.flavors.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ color: '#ffd600', fontWeight: 700, mb: 1 }}>
                  Flavors:
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {match.strain.flavors.map((flavor, i) => (
                    <Chip
                      key={i}
                      label={flavor}
                      size="small"
                      sx={{
                        bgcolor: 'rgba(255, 214, 0, 0.2)',
                        color: '#fff',
                        border: '1px solid rgba(255, 214, 0, 0.4)'
                      }}
                    />
                  ))}
                </Stack>
              </Box>
            )}

            {/* Lineage */}
            {match.strain?.lineage && (
              <Typography variant="body2" color="#fff" sx={{ mb: 2 }}>
                <strong style={{ color: '#00e676' }}>Lineage:</strong> {typeof match.strain.lineage === 'string' ? match.strain.lineage : match.strain.lineage.join(' × ')}
              </Typography>
            )}

            {/* Indica/Sativa Ratio */}
            {(typeof match.strain?.indicaPercent === 'number' && typeof match.strain?.sativaPercent === 'number') ? (
              <Typography variant="body2" color="#fff" sx={{ mb: 2 }}>
                <strong style={{ color: '#00e676' }}>Ratio:</strong> {match.strain.indicaPercent}% Indica / {match.strain.sativaPercent}% Sativa
              </Typography>
            ) : match.strain?.ratio ? (
              <Typography variant="body2" color="#fff" sx={{ mb: 2 }}>
                <strong style={{ color: '#00e676' }}>Ratio:</strong> {match.strain.ratio}
              </Typography>
            ) : null}

            {/* Grow Info */}
            {(match.strain?.growDifficulty || match.strain?.floweringTime || match.strain?.yield) && (
              <Box sx={{ mb: 2, p: 2, bgcolor: 'rgba(0, 0, 0, 0.3)', borderRadius: 2, border: '1px solid rgba(124, 179, 66, 0.3)' }}>
                <Typography variant="body2" sx={{ color: '#00e676', fontWeight: 700, mb: 1 }}>
                  Growing Information:
                </Typography>
                {match.strain.growDifficulty && (
                  <Typography variant="body2" color="#fff" sx={{ mb: 0.5 }}>
                    • Difficulty: {match.strain.growDifficulty}
                  </Typography>
                )}
                {match.strain.floweringTime && (
                  <Typography variant="body2" color="#fff" sx={{ mb: 0.5 }}>
                    • Flowering Time: {match.strain.floweringTime}
                  </Typography>
                )}
                {match.strain.yield && (
                  <Typography variant="body2" color="#fff">
                    • Yield: {match.strain.yield}
                  </Typography>
                )}
              </Box>
            )}

            {/* Medical Uses */}
            {match.strain?.medicalUses && match.strain.medicalUses.length > 0 && (
              <Typography variant="body2" color="#fff" sx={{ mb: 2 }}>
                <strong style={{ color: '#00e676' }}>Medical Uses:</strong> {match.strain.medicalUses.join(', ')}
              </Typography>
            )}

            {/* Terpenes */}
            {match.strain?.terpeneProfile && match.strain.terpeneProfile.length > 0 && (
              <Typography variant="body2" color="#fff" sx={{ mb: 2 }}>
                <strong style={{ color: '#00e676' }}>Terpenes:</strong> {match.strain.terpeneProfile.join(', ')}
              </Typography>
            )}

            {/* Awards */}
            {match.strain?.awards && match.strain.awards.length > 0 && (
              <Typography variant="body2" sx={{ color: '#ffd600', mb: 2 }}>
                <strong>🏆 Awards:</strong> {match.strain.awards.join(', ')}
              </Typography>
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

            {/* Action Buttons */}
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              mt: 3,
              background: 'rgba(30,30,30,0.25)',
              backdropFilter: 'blur(16px) saturate(180%)',
              borderRadius: 6,
              px: 4,
              py: 3,
              boxShadow: '0 4px 32px 0 rgba(0,0,0,0.12)',
              border: '1px solid rgba(255,255,255,0.18)'
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
                sx={{
                  fontWeight: 700,
                  borderRadius: 999,
                  px: 5,
                  py: 1.5,
                  fontSize: 18,
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
                onClick={() => fileInputRef.current?.click()}
              >
                <span role="img" aria-label="camera" style={{ marginRight: 8 }}>📷</span>
                Scan Another Strain
              </Button>

              {/* Navigation Buttons */}
              <Stack direction="row" spacing={2}>
                <Button
                  variant="outlined"
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
                  onClick={() => window.location.href = '/'}
                >
                  🏠 Home
                </Button>
                <Button
                  variant="outlined"
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
                  onClick={() => {
                    setMatch(null);
                    setResult(null);
                    setScanStatus('');
                  }}
                >
                  ← Back to Scanner
                </Button>
              </Stack>

              {loading && (
                <CircularProgress color="success" sx={{ mt: 2 }} />
              )}
              {scanStatus && !loading && (
                <Typography align="center" sx={{ mt: 2, color: '#00e676', fontWeight: 700 }}>{scanStatus}</Typography>
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
                    <Chip key={idx} label={vendor.name} size="small" color="info" variant="outlined" component="a" href={vendor.url} clickable />
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

          {/* Membership Dialog */}
          <Dialog
            open={showMembershipDialog}
            onClose={() => setShowMembershipDialog(false)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              bgcolor: 'rgba(0, 0, 0, 0.9)',
              color: '#00e676'
            }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                🌿 Members Only Feature
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
                Leaving reviews is a members-only feature. Join the StrainSpotter community to:
              </Typography>
              <Box component="ul" sx={{ pl: 3, mb: 3 }}>
                <li>Leave reviews and ratings</li>
                <li>Share your experiences with the community</li>
                <li>Help others discover great strains</li>
                <li>Access unlimited scans</li>
                <li>Connect with other growers</li>
              </Box>
              <MembershipLogin onSuccess={() => {
                setShowMembershipDialog(false);
                setAlertMsg('Welcome! You can now leave reviews.');
                setAlertOpen(true);
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
        </Container>
      )}
    </ErrorBoundary>
  );
}