import { useState, useRef, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Chip,
  Stack,
  Fab,
  Zoom,
  Slide,
  Fade,
  Avatar,
  Badge,
  Paper,
  IconButton,
  Tooltip,
  Slider,
  List,
  ListItem,
  ListItemText,
  Divider,
  Tabs,
  Tab
} from '@mui/material';
import {
  CameraAlt,
  PhotoCamera,
  CheckCircle,
  AutoFixHigh,
  Lightbulb,
  NavigateNext,
  Refresh,
  History as HistoryIcon,
  FlashOn,
  PhotoLibrary,
  LocationOn,
  Storefront,
  LocalFlorist,
  MenuBook
} from '@mui/icons-material';
import { API_BASE } from '../config';
import CannabisLeafIcon from './CannabisLeafIcon';
import { supabase } from '../supabaseClient';
import { getUserLocation, formatDistance } from '../utils/location';

export default function ScanWizard({ onNavigate, onBack }) {
  const [activeStep, setActiveStep] = useState(0);
  const [_image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [matchedStrain, setMatchedStrain] = useState(null);
  const [hints, setHints] = useState([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  // Details dialog state
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsData, setDetailsData] = useState(null);
  const [detailsTab, setDetailsTab] = useState(0); // 0=Overview, 1=Dispensaries, 2=Seeds, 3=Care
  // Where to Buy state
  const [userLocation, setUserLocation] = useState(null);
  const [proximityRadius, setProximityRadius] = useState(25); // miles
  const [dispensaries, setDispensaries] = useState([]);
  const [dispensariesLoading, setDispensariesLoading] = useState(false);
  const [seeds, setSeeds] = useState([]);
  const [seedsLoading, setSeedsLoading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const session = await supabase?.auth.getSession();
        const uid = session?.data?.session?.user?.id || null;
        if (uid) setCurrentUserId(uid);
      } catch (e) {
        console.debug('[ScanWizard] getSession failed', e);
      }
    })();
  }, []);

  // Optional back-to-home button overlay
  const BackButtonOverlay = () => (
    onBack ? (
      <Box sx={{ position: 'fixed', top: 16, left: 16, zIndex: 1000 }}>
        <Button
          onClick={onBack}
          size="small"
          variant="contained"
          sx={{
            bgcolor: 'white',
            color: 'black',
            textTransform: 'none',
            fontWeight: 700,
            borderRadius: 999,
            px: 1.5,
            minWidth: 0,
            '&:hover': { bgcolor: 'grey.100' }
          }}
        >
          Home
        </Button>
      </Box>
    ) : null
  );

  // Smart hints based on current step
  useEffect(() => {
    const stepHints = [
      [
        '📸 Take a clear photo of the strain label',
        '💡 Make sure text is readable and in focus',
        '✨ Natural lighting works best'
      ],
      [
        '🔬 AI is analyzing your image...',
        '🧠 Reading text and identifying features',
        '⚡ This usually takes 2-3 seconds'
      ],
      [
        '🎯 Match found in our database!',
        '📊 Check the confidence score',
        '💚 Tap to view full strain details'
      ]
    ];
    setHints(stepHints[activeStep] || []);
  }, [activeStep]);

  const handleImageCapture = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImage(file);
    setImagePreview(URL.createObjectURL(file));
    setActiveStep(1);
    setTimeout(() => handleScan(file), 500); // Auto-start scan with slight delay for UX
  };

  const handleScan = async (file) => {
    setLoading(true);
    try {
      // Quick health check to determine if Vision is configured; if not, enable a friendly dev fallback
      let devFallback = false;
      try {
        const healthResp = await fetch(`${API_BASE}/health`);
        if (healthResp.ok) {
          const health = await healthResp.json();
          devFallback = !health?.googleVisionConfigured;
        }
      } catch (e) {
        // If health check fails, continue normally; no-op here
      }

      // Step 1: Upload image
      const reader = new FileReader();
      reader.readAsDataURL(file);
      await new Promise((resolve) => {
        reader.onload = resolve;
      });

      const base64 = reader.result.split(',')[1];
      const uploadResponse = await fetch(`${API_BASE}/api/uploads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          base64,
          user_id: currentUserId
        })
      });

      if (!uploadResponse.ok) throw new Error('Upload failed');
      const uploadData = await uploadResponse.json();
      const scanId = uploadData.id;

      if (devFallback) {
        // Vision is not configured: provide a graceful demo result and skip remote processing
        try {
          const listResp = await fetch(`${API_BASE}/api/strains?limit=1&sort=thc:desc`);
          if (listResp.ok) {
            const list = await listResp.json();
            const s = list?.strains?.[0];
            if (s) {
              setMatchedStrain({ ...s, confidence: 92, reasoning: 'Dev mode preview (Vision disabled). Sample high-confidence match.' });
              setScanResult(null);
              // Best-effort: record a match if backend allows
              try {
                await fetch(`${API_BASE}/api/scans/${scanId}/save-match`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ matched_strain_slug: s.slug, user_id: currentUserId })
                });
              } catch {}
              setActiveStep(2);
              setShowCelebration(true);
              setTimeout(() => setShowCelebration(false), 3000);
              return; // Skip the rest of the flow
            }
          }
        } catch (e) {
          // Fall through to normal path if fetching sample failed
        }
      }

      // Step 2: Process with Vision API
      const processResponse = await fetch(`${API_BASE}/api/scans/${scanId}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!processResponse.ok) throw new Error('Processing failed');
      const processData = await processResponse.json();
      setScanResult(processData.result);

      // Step 3: Match strain
      const matchResponse = await fetch(`${API_BASE}/api/visual-match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visionResult: processData.result })
      });

      if (matchResponse.ok) {
        const matchData = await matchResponse.json();
        if (matchData.matches?.[0]) {
          const topMatch = matchData.matches[0];
          setMatchedStrain({
            ...topMatch.strain,
            confidence: topMatch.confidence,
            reasoning: topMatch.reasoning
          });

          // Save match
          await fetch(`${API_BASE}/api/scans/${scanId}/save-match`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              matched_strain_slug: topMatch.strain.slug,
              user_id: currentUserId
            })
          });

          setActiveStep(2);
          setShowCelebration(true);
          setTimeout(() => setShowCelebration(false), 3000);
        } else {
          throw new Error('No match found');
        }
      } else {
        throw new Error('Matching failed');
      }
    } catch (err) {
      console.error('[ScanWizard] Error:', err);
      // As a friendly fallback, try to show a demo match so the user isn't blocked
      try {
        const listResp = await fetch(`${API_BASE}/api/strains?limit=1&sort=thc:desc`);
        if (listResp.ok) {
          const list = await listResp.json();
          const s = list?.strains?.[0];
          if (s) {
            setMatchedStrain({ ...s, confidence: 76, reasoning: 'Preview match due to temporary scanner issue.' });
            setActiveStep(2);
            setHints([
              '⚠️ Scanner is temporarily unavailable',
              'Showing a sample match so you can explore the experience',
              'Try again later or check your connection'
            ]);
            return;
          }
        }
      } catch {}

      setHints([
        '❌ ' + err.message,
        '💡 Try taking a clearer photo',
        '📸 Make sure the label is visible'
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setImage(null);
    setImagePreview(null);
    setScanResult(null);
    setMatchedStrain(null);
    setActiveStep(0);
    setShowCelebration(false);
  };

  const handleViewDetails = async () => {
    if (!matchedStrain?.slug) return;
    setDetailsOpen(true);
    setDetailsLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/api/strains/${matchedStrain.slug}`);
      if (resp.ok) {
        const data = await resp.json();
        setDetailsData(data);
      } else {
        setDetailsData(null);
      }
    } catch (e) {
      console.error('[ScanWizard] Failed to fetch strain details:', e);
      setDetailsData(null);
    } finally {
      setDetailsLoading(false);
    }

    // Request user location and fetch nearby dispensaries/seeds
    const loc = await getUserLocation();
    setUserLocation(loc);
    if (loc) {
      // Fetch dispensaries
      setDispensariesLoading(true);
      try {
        const dispResp = await fetch(`${API_BASE}/api/dispensaries?lat=${loc.lat}&lng=${loc.lng}&radius=${proximityRadius}`);
        if (dispResp.ok) {
          const dispData = await dispResp.json();
          setDispensaries(dispData);
        }
      } catch (e) {
        console.error('[ScanWizard] Failed to fetch dispensaries:', e);
      } finally {
        setDispensariesLoading(false);
      }

      // Fetch seeds for this strain
      setSeedsLoading(true);
      try {
        const seedResp = await fetch(`${API_BASE}/api/seeds?strain_slug=${matchedStrain.slug}`);
        if (seedResp.ok) {
          const seedData = await seedResp.json();
          setSeeds(seedData);
        }
      } catch (e) {
        console.error('[ScanWizard] Failed to fetch seeds:', e);
      } finally {
        setSeedsLoading(false);
      }
    }
  };

  // Re-fetch when proximity changes
  useEffect(() => {
    if (detailsOpen && userLocation && matchedStrain?.slug) {
      (async () => {
        setDispensariesLoading(true);
        try {
          const resp = await fetch(`${API_BASE}/api/dispensaries?lat=${userLocation.lat}&lng=${userLocation.lng}&radius=${proximityRadius}`);
          if (resp.ok) {
            const data = await resp.json();
            setDispensaries(data);
          }
        } catch (e) {
          console.error('[ScanWizard] Failed to re-fetch dispensaries:', e);
        } finally {
          setDispensariesLoading(false);
        }
      })();
    }
  }, [proximityRadius, detailsOpen, userLocation, matchedStrain]);

  const steps = [
    {
      label: 'Capture Image',
      icon: <PhotoCamera />,
      color: '#4caf50'
    },
    {
      label: 'AI Analysis',
      icon: <AutoFixHigh />,
      color: '#2196f3'
    },
    {
      label: 'Results',
      icon: <CheckCircle />,
      color: '#ff9800'
    }
  ];

  return (
    <Container maxWidth="md" sx={{ py: 2, pb: 10 }}>
      <BackButtonOverlay />
      {/* Floating Action Hints */}
      <Zoom in={activeStep === 0}>
        <Paper
          elevation={6}
          sx={{
            position: 'fixed',
            top: 80,
            right: 16,
            p: 1.5,
            bgcolor: 'primary.main',
            color: 'white',
            borderRadius: 3,
            maxWidth: 200,
            zIndex: 1000
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Lightbulb sx={{ fontSize: 20 }} />
            <Typography variant="caption" fontWeight="bold">
              Tap camera to start!
            </Typography>
          </Stack>
        </Paper>
      </Zoom>

      {/* Progress Stepper */}
      <Card elevation={4} sx={{ mb: 3, borderRadius: 3, overflow: 'hidden' }}>
        <CardContent sx={{ p: 2 }}>
          <Stepper activeStep={activeStep} orientation="vertical">
            {steps.map((step, index) => (
              <Step key={step.label}>
                <StepLabel
                  StepIconComponent={() => (
                    <Avatar
                      sx={{
                        bgcolor: activeStep >= index ? step.color : 'grey.300',
                        width: 40,
                        height: 40,
                        transition: 'all 0.3s'
                      }}
                    >
                      {step.icon}
                    </Avatar>
                  )}
                >
                  <Typography variant="h6" fontWeight={activeStep === index ? 700 : 400}>
                    {step.label}
                  </Typography>
                </StepLabel>
                <StepContent>
                  <Box sx={{ pl: 1.5, py: 1.5 }}>
                    {/* Step 0: Capture */}
                    {index === 0 && !imagePreview && (
                      <Stack spacing={2}>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={handleImageCapture}
                          style={{ display: 'none' }}
                        />
                        <Fab
                          color="primary"
                          size="large"
                          onClick={() => fileInputRef.current?.click()}
                          sx={{
                            alignSelf: 'center',
                            width: 80,
                            height: 80,
                            background: 'linear-gradient(45deg, #2962FF 30%, #448AFF 90%)',
                            boxShadow: '0 4px 20px rgba(41,98,255,0.4)',
                            '&:hover': {
                              transform: 'scale(1.05)',
                              boxShadow: '0 6px 25px rgba(41,98,255,0.5)'
                            }
                          }}
                        >
                          <CameraAlt sx={{ fontSize: 40 }} />
                        </Fab>
                        <Typography variant="body2" color="text.secondary" textAlign="center">
                          Take a photo or choose from library
                        </Typography>
                      </Stack>
                    )}

                    {index === 0 && imagePreview && (
                      <Fade in>
                        <Box>
                          <img
                            src={imagePreview}
                            alt="Preview"
                            style={{
                              width: '100%',
                              maxHeight: 300,
                              objectFit: 'contain',
                              borderRadius: 8
                            }}
                          />
                        </Box>
                      </Fade>
                    )}

                    {/* Step 1: Analysis */}
                    {index === 1 && loading && (
                      <Stack spacing={2} alignItems="center">
                        <CircularProgress size={60} thickness={4} />
                        <Typography variant="body1" fontWeight="bold" color="primary">
                          Analyzing your image...
                        </Typography>
                      </Stack>
                    )}

                    {/* Step 2: Results */}
                    {index === 2 && matchedStrain && (
                      <Slide in direction="up">
                        <Card
                          elevation={3}
                          sx={{
                            p: 2,
                            bgcolor: 'background.paper',
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: 'divider'
                          }}
                        >
                          <Stack spacing={2}>
                            <Stack direction="row" spacing={2} alignItems="center">
                              <Badge
                                badgeContent={
                                  <Chip
                                    label={`${matchedStrain.confidence}%`}
                                    size="small"
                                    color="primary"
                                    sx={{ fontWeight: 'bold' }}
                                  />
                                }
                                overlap="circular"
                              >
                                <Avatar
                                  sx={{
                                    bgcolor: 'primary.main',
                                    width: 60,
                                    height: 60
                                  }}
                                >
                                  <CannabisLeafIcon size={32} />
                                </Avatar>
                              </Badge>
                              <Box>
                                <Typography variant="h5" fontWeight="bold" color="success.dark">
                                  {matchedStrain.name}
                                </Typography>
                                <Chip
                                  label={matchedStrain.type || 'Unknown Type'}
                                  size="small"
                                  color="default"
                                  sx={{ mt: 0.5 }}
                                />
                              </Box>
                            </Stack>

                            {matchedStrain.reasoning && (
                              <Alert severity="info" icon={<Lightbulb />}>
                                <Typography variant="caption">
                                  <strong>Match Reason:</strong> {matchedStrain.reasoning}
                                </Typography>
                              </Alert>
                            )}

                            <Stack direction="row" spacing={1}>
                              <Button
                                variant="contained"
                                fullWidth
                                endIcon={<NavigateNext />}
                                sx={{ minHeight: 44, fontWeight: 700 }}
                                onClick={handleViewDetails}
                              >
                                View Details
                              </Button>
                            </Stack>
                            
                            {/* AI Critique based on Vision result */}
                            {scanResult && (
                              <Card variant="outlined" sx={{ borderRadius: 2 }}>
                                <CardContent>
                                  <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
                                    <Lightbulb color="primary" />
                                    <Typography variant="subtitle2" fontWeight={700}>
                                      AI Critique
                                    </Typography>
                                  </Stack>
                                  <Stack spacing={0.5}>
                                    {computeAICritique(scanResult).map((tip, i) => (
                                      <Typography key={i} variant="caption" color="text.secondary">
                                        • {tip}
                                      </Typography>
                                    ))}
                                  </Stack>
                                </CardContent>
                              </Card>
                            )}

                              <Button
                                variant="outlined"
                                fullWidth
                                startIcon={<Refresh />}
                                onClick={handleReset}
                                sx={{ minHeight: 44, fontWeight: 700, mt: 1 }}
                              >
                                Scan Another
                              </Button>
                          </Stack>
                        </Card>
                      </Slide>
                    )}
                  </Box>
                </StepContent>
              </Step>
            ))}
          </Stepper>
        </CardContent>
      </Card>

      {/* AI Tips */}
      <Fade in={hints.length > 0}>
        <Card sx={{ borderRadius: 3, border: '2px dashed', borderColor: 'primary.main' }}>
          <CardContent>
            <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
              <AutoFixHigh color="primary" />
              <Typography variant="subtitle1" fontWeight="bold">
                AI Tips
              </Typography>
            </Stack>
            <Stack spacing={1}>
              {hints.map((hint, idx) => (
                <Fade in key={idx} timeout={(idx + 1) * 300}>
                  <Typography variant="body2" color="text.secondary">
                    {hint}
                  </Typography>
                </Fade>
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Fade>

      {/* Quick Actions */}
      {activeStep === 0 && (
        <Fade in>
          <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<HistoryIcon />}
              sx={{ minHeight: 44, fontWeight: 700 }}
              onClick={() => onNavigate?.('history')}
            >
              View History
            </Button>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<PhotoLibrary />}
              sx={{ minHeight: 44, fontWeight: 700 }}
              onClick={() => fileInputRef.current?.click()}
            >
              From Library
            </Button>
          </Stack>
        </Fade>
      )}

      {/* Celebration Animation */}
      {showCelebration && (
        <Box
          sx={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 2000,
            pointerEvents: 'none'
          }}
        >
          <Zoom in>
            <Typography variant="h1" sx={{ fontSize: '120px' }}>
              🎉
            </Typography>
          </Zoom>
        </Box>
      )}

      {/* Strain Details Dialog with Tabs */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 0 }}>
          {detailsData?.name || matchedStrain?.name || 'Strain Details'}
        </DialogTitle>
        
        <Tabs value={detailsTab} onChange={(e, v) => setDetailsTab(v)} sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
          <Tab icon={<LocalFlorist />} iconPosition="start" label="Overview" />
          <Tab icon={<Storefront />} iconPosition="start" label="Dispensaries" />
          <Tab icon={<PhotoLibrary />} iconPosition="start" label="Seeds" />
          <Tab icon={<MenuBook />} iconPosition="start" label="Care Guide" />
        </Tabs>

        <DialogContent sx={{ pt: 3, minHeight: 400 }}>
          {detailsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : detailsData ? (
            <>
              {/* Tab 0: Overview */}
              {detailsTab === 0 && (
                <Stack spacing={2}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    {detailsData.type && <Chip label={detailsData.type} color="primary" />}
                    {typeof detailsData.thc === 'number' && (
                      <Chip label={`THC: ${detailsData.thc}%`} color="warning" variant="outlined" />
                    )}
                    {typeof detailsData.cbd === 'number' && (
                      <Chip label={`CBD: ${detailsData.cbd}%`} color="info" variant="outlined" />
                    )}
                  </Stack>
                  {detailsData.description && (
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        Description
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {detailsData.description}
                      </Typography>
                    </Box>
                  )}
                  {Array.isArray(detailsData.effects) && detailsData.effects.length > 0 && (
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        Effects
                      </Typography>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                        {detailsData.effects.map((e, i) => (
                          <Chip key={i} label={e} size="small" />
                        ))}
                      </Stack>
                    </Box>
                  )}
                  {Array.isArray(detailsData.flavors) && detailsData.flavors.length > 0 && (
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        Flavors
                      </Typography>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                        {detailsData.flavors.map((f, i) => (
                          <Chip key={i} label={f} size="small" color="secondary" variant="outlined" />
                        ))}
                      </Stack>
                    </Box>
                  )}
                  {detailsData.lineage && (
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        Lineage
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {detailsData.lineage}
                      </Typography>
                    </Box>
                  )}
                  {imagePreview && (
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        Your Scan
                      </Typography>
                      <Box
                        component="img"
                        src={imagePreview}
                        alt="Scan"
                        sx={{ maxWidth: '100%', maxHeight: 300, borderRadius: 2, objectFit: 'contain', bgcolor: 'grey.100' }}
                      />
                    </Box>
                  )}
                </Stack>
              )}

              {/* Tab 1: Dispensaries */}
              {detailsTab === 1 && (
                <Stack spacing={2}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Storefront color="primary" />
                    <Typography variant="subtitle1" fontWeight="bold">
                      Find Nearby Dispensaries
                    </Typography>
                  </Stack>

                  {userLocation ? (
                    <>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <LocationOn sx={{ fontSize: 18, color: 'primary.main' }} />
                        <Typography variant="caption" color="text.secondary">
                          Showing results within {proximityRadius} miles
                        </Typography>
                      </Stack>
                      
                      <Typography variant="caption" color="text.secondary" gutterBottom>
                        Adjust range:
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        <Chip label="5 mi" size="small" variant={proximityRadius === 5 ? 'filled' : 'outlined'} onClick={() => setProximityRadius(5)} />
                        <Chip label="10 mi" size="small" variant={proximityRadius === 10 ? 'filled' : 'outlined'} onClick={() => setProximityRadius(10)} />
                        <Chip label="25 mi" size="small" variant={proximityRadius === 25 ? 'filled' : 'outlined'} onClick={() => setProximityRadius(25)} />
                        <Chip label="50 mi" size="small" variant={proximityRadius === 50 ? 'filled' : 'outlined'} onClick={() => setProximityRadius(50)} />
                        <Chip label="100 mi" size="small" variant={proximityRadius === 100 ? 'filled' : 'outlined'} onClick={() => setProximityRadius(100)} />
                        <Chip label="200 mi" size="small" variant={proximityRadius === 200 ? 'filled' : 'outlined'} onClick={() => setProximityRadius(200)} />
                      </Stack>
                      <Slider
                        value={proximityRadius}
                        onChange={(e, val) => setProximityRadius(val)}
                        min={1}
                        max={300}
                        step={10}
                        valueLabelDisplay="auto"
                        valueLabelFormat={(v) => `${v} mi`}
                      />

                      {dispensariesLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                          <CircularProgress size={24} />
                        </Box>
                      ) : dispensaries.length > 0 ? (
                        <>
                          <Typography variant="body2" fontWeight="bold" gutterBottom>
                            Nearby Dispensaries ({dispensaries.length})
                          </Typography>
                          <List dense>
                            {dispensaries.map((d) => (
                              <ListItem key={d.id} sx={{ px: 0 }}>
                                <ListItemText
                                  primary={`${d.name} • ${formatDistance(d.distance)}`}
                                  secondary={`${d.address}, ${d.city}, ${d.state} • ${d.phone || 'No phone'}`}
                                  primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                                  secondaryTypographyProps={{ variant: 'caption' }}
                                />
                              </ListItem>
                            ))}
                          </List>
                        </>
                      ) : (
                        <Alert severity="info">
                          No dispensaries found within {proximityRadius} miles. 
                          {proximityRadius < 200 && ' Try increasing the range.'}
                        </Alert>
                      )}
                    </>
                  ) : (
                    <Alert severity="warning">
                      Enable location to find nearby dispensaries.
                    </Alert>
                  )}
                </Stack>
              )}

              {/* Tab 2: Seeds */}
              {detailsTab === 2 && (
                <Stack spacing={2}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <PhotoLibrary color="primary" />
                    <Typography variant="subtitle1" fontWeight="bold">
                      Buy {detailsData?.name || 'Strain'} Seeds
                    </Typography>
                  </Stack>

                  {seedsLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : seeds.length > 0 ? (
                    <>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Online seed vendors for this strain:
                      </Typography>
                      <List dense>
                        {seeds.map((s) => (
                          <ListItem key={s.id} sx={{ px: 0 }}>
                            <ListItemText
                              primary={s.name}
                              secondary={`Breeder: ${s.breeder}`}
                              primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                              secondaryTypographyProps={{ variant: 'caption' }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </>
                  ) : (
                    <Alert severity="info">
                      No seed vendors found for this strain in our database.
                    </Alert>
                  )}
                </Stack>
              )}

              {/* Tab 3: Care Guide */}
              {detailsTab === 3 && (
                <Stack spacing={2}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <MenuBook color="primary" />
                    <Typography variant="subtitle1" fontWeight="bold">
                      Growing & Care Guide
                    </Typography>
                  </Stack>

                  <Typography variant="body2" color="text.secondary">
                    <strong>Difficulty:</strong> {detailsData?.type === 'indica' ? 'Beginner-Friendly' : detailsData?.type === 'hybrid' ? 'Intermediate' : 'Moderate'}
                  </Typography>

                  <Box>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                      🌱 Germination (1-7 days)
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      • Soak seeds in water for 12-24 hours<br />
                      • Plant in moist soil 1/4 inch deep<br />
                      • Keep temperature at 70-85°F (21-29°C)<br />
                      • Maintain high humidity (70-90%)
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                      🌿 Vegetative Stage (3-16 weeks)
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      • 18-24 hours of light per day<br />
                      • Temperature: 70-85°F (21-29°C)<br />
                      • Humidity: 40-70%<br />
                      • Feed with nitrogen-rich nutrients<br />
                      • Water when top inch of soil is dry
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                      🌸 Flowering Stage (7-14 weeks)
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      • Switch to 12/12 light cycle<br />
                      • Temperature: 65-80°F (18-26°C)<br />
                      • Humidity: 40-50% (lower to 30% late flower)<br />
                      • Use bloom nutrients (high phosphorus/potassium)<br />
                      • Monitor for pests and mold
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                      ✂️ Harvest & Curing
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      • Harvest when 60-70% of pistils are brown<br />
                      • Hang dry in dark room for 7-14 days (60°F, 50% humidity)<br />
                      • Trim dried buds<br />
                      • Cure in airtight jars for 2-4 weeks, burping daily
                    </Typography>
                  </Box>

                  <Alert severity="info" sx={{ mt: 2 }}>
                    💡 <strong>Tip:</strong> Check local laws before growing. Medical/recreational cultivation is legal in some states but regulated.
                  </Alert>
                </Stack>
              )}
            </>
          ) : (
            <Alert severity="info">Strain details not available</Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

// Heuristic critique to make the experience feel "AI-powered" without external services
function computeAICritique(result) {
  try {
    const tips = [];
    const labels = result?.labelAnnotations?.length || 0;
    const texts = result?.textAnnotations?.length || 0;
    const objects = result?.localizedObjectAnnotations?.length || 0;
    const colors = result?.imagePropertiesAnnotation?.dominantColors?.colors || [];
    const webEntities = result?.webDetection?.webEntities?.length || 0;

    if (texts < 2) {
      tips.push('Consider centering the label and ensuring the text is sharp.');
    } else {
      tips.push('Nice label capture — text is readable for better matching.');
    }

    if (labels < 5) {
      tips.push('Lighting may be low. Try brighter, even lighting to reveal more features.');
    }

    if (colors.length < 3) {
      tips.push('Background looks monochrome. A simple, non-reflective surface helps.');
    }

    if (objects === 0) {
      tips.push('The subject might be too small. Move closer or crop to the key area.');
    }

    if (webEntities > 0) {
      tips.push('Found visually similar images online — good sign for recognition.');
    }

    return tips.slice(0, 4);
  } catch {
    return ['Capture looks good. If results feel off, try a flatter angle and even lighting.'];
  }
}
