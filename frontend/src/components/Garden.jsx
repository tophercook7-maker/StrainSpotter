import { useState, useCallback, useEffect } from 'react';
import { Box, Button, Typography, Grid, Paper, Stack, Avatar, Alert, Dialog, DialogTitle, DialogContent, Fab, Tooltip } from '@mui/material';
import { supabase } from '../supabaseClient';
import { useMembershipGuard } from '../hooks/useMembershipGuard';
import ScanWizard from './ScanWizard';
import ScanResultCard from './ScanResultCard';
import StrainBrowser from './StrainBrowser';
import ReviewsHub from './ReviewsHub';
import DispensaryFinder from './DispensaryFinder';
import SeedVendorFinder from './SeedVendorFinder';
import Groups from './Groups';
import GrowCoach, { LOGBOOK_TAB_INDEX } from './GrowCoach';
import GrowerDirectory from './GrowerDirectory';
import FeedbackModal from './FeedbackModal';
import FeedbackReader from './FeedbackReader';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import SpaIcon from '@mui/icons-material/Spa';
import GroupsIcon from '@mui/icons-material/Groups';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import StoreIcon from '@mui/icons-material/Store';
import PeopleIcon from '@mui/icons-material/People';
import WarningIcon from '@mui/icons-material/Warning';
import RateReviewIcon from '@mui/icons-material/RateReview';
import FeedbackIcon from '@mui/icons-material/Feedback';
import NoteAltIcon from '@mui/icons-material/NoteAlt';
import CreditBalance from './CreditBalance';
import BuyScansModal from './BuyScansModal';
import GardenNavBar from './GardenNavBar';

export default function Garden({ onBack, onNavigate }) {
  const { user, isExpired, canLogout, loading } = useMembershipGuard();
  const [showLogoutWarning, setShowLogoutWarning] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState('');
  const [showScan, setShowScan] = useState(false);
  const [showStrainBrowser, setShowStrainBrowser] = useState(false);
  const [showReviews, setShowReviews] = useState(false);
  const [showDispensaryFinder, setShowDispensaryFinder] = useState(false);
  const [showSeedFinder, setShowSeedFinder] = useState(false);
  const [showGroups, setShowGroups] = useState(false);
  const [showGrowCoach, setShowGrowCoach] = useState(false);
  const [growCoachInitialTab, setGrowCoachInitialTab] = useState(0);
  const [showGrowerDirectory, setShowGrowerDirectory] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showFeedbackReader, setShowFeedbackReader] = useState(false);
  const [showBuyScans, setShowBuyScans] = useState(false);
  const [navValue, setNavValue] = useState('home');
  const [activeScan, setActiveScan] = useState(null);
  const [activeView, setActiveView] = useState('scanner'); // 'scanner' | 'result' | 'history'

  // Version log to confirm new bundle is running
  useEffect(() => {
    console.log('[Garden] mounted – bundle v2 (seedFinderStrain removed)');
  }, []);

  // Get display name for user
  const getUserDisplayName = () => {
    if (!user) return 'Guest';

    // Special case for Topher
    if (user.email === 'topher.cook7@gmail.com') {
      return 'Topher';
    }

    // Check user_metadata for username
    if (user.user_metadata?.username) {
      return user.user_metadata.username;
    }

    // Fallback to email prefix
    if (user.email) {
      return user.email.split('@')[0];
    }

    return 'Member';
  };

  const handleLogout = async () => {
    // Admin users can always logout
    const isAdminUser = user?.email === 'topher.cook7@gmail.com' ||
                        user?.email === 'strainspotter25@gmail.com' ||
                        user?.email === 'admin@strainspotter.com' ||
                        user?.email === 'andrewbeck209@gmail.com';

    if (!canLogout && !isAdminUser) {
      setShowLogoutWarning(true);
      return;
    }

    try {
      await supabase.auth.signOut();
      // Clear localStorage to reset age verification
      localStorage.clear();
      sessionStorage.clear();
      onBack?.();
    } catch (e) {
      console.error('Logout failed:', e);
    }
  };

  const handleFeatureClick = (featureName, nav) => {
    switch (nav) {
      case 'scan':
        openScreen('scan', () => setShowScan(true));
        return;
      case 'strains':
        openScreen('home', () => setShowStrainBrowser(true));
        return;
      case 'reviews':
        openScreen('home', () => setShowReviews(true));
        return;
      case 'dispensaries':
        openScreen('dispensaries', () => setShowDispensaryFinder(true));
        return;
      case 'seeds':
        openScreen('home', () => setShowSeedFinder(true));
        return;
      case 'groups':
        openScreen('groups', () => setShowGroups(true));
        return;
      case 'grow-coach':
        setGrowCoachInitialTab(0);
        openScreen('home', () => setShowGrowCoach(true));
        return;
      case 'grow-logbook':
        setGrowCoachInitialTab(LOGBOOK_TAB_INDEX);
        openScreen('home', () => setShowGrowCoach(true));
        return;
      case 'growers':
        openScreen('growers', () => setShowGrowerDirectory(true));
        return;
      case 'feedback-reader':
        // Handled via header button only
        return;
      default:
        setSelectedFeature(featureName);
        setShowComingSoon(true);
    }
  };

  // Check if user is admin
  const isAdmin = user?.email === 'topher.cook7@gmail.com' ||
                  user?.email === 'strainspotter25@gmail.com' ||
                  user?.email === 'admin@strainspotter.com' ||
                  user?.email === 'andrewbeck209@gmail.com';

  const tiles = [
    { title: 'AI Strain Scan', icon: <CameraAltIcon />, nav: 'scan', color: '#00e676', description: 'Identify any strain instantly', image: '📷', useEmoji: true },
    { title: 'Strain Browser', icon: <SpaIcon />, nav: 'strains', color: '#7cb342', description: 'Explore 1000+ strains', image: '🌿', useEmoji: true },
    { title: 'Reviews Hub', icon: <RateReviewIcon />, nav: 'reviews', color: '#ffd600', description: 'Read & share experiences', image: '⭐', useEmoji: true },
    { title: 'Community Groups', icon: <GroupsIcon />, nav: 'groups', color: '#66bb6a', description: 'Connect with growers', image: '👥', useEmoji: true },
    { title: 'Grow Coach', icon: <LocalFloristIcon />, nav: 'grow-coach', color: '#9ccc65', description: 'Expert growing tips', image: '🌱', useEmoji: true },
    { title: 'Grow Logbook', icon: <NoteAltIcon />, nav: 'grow-logbook', color: '#81c784', description: 'Track every stage', image: '📓', useEmoji: true },
    { title: 'Grower Directory', icon: <PeopleIcon />, nav: 'growers', color: '#8bc34a', description: 'Find local cultivators', image: '🧑‍🌾', useEmoji: true },
    { title: 'Seed Vendors', icon: <MenuBookIcon />, nav: 'seeds', color: '#aed581', description: 'Trusted seed sources', image: '🌾', useEmoji: true },
    { title: 'Dispensaries', icon: <StoreIcon />, nav: 'dispensaries', color: '#c5e1a5', description: 'Find nearby shops', image: '🏪', useEmoji: true },
  ];

  // Feedback Reader is only accessible via header button for admins
  // No need for a separate tile

  const resetScreens = (nextNav = 'home') => {
    setShowScan(false);
    setShowStrainBrowser(false);
    setShowReviews(false);
    setShowDispensaryFinder(false);
    setShowSeedFinder(false);
    setShowGroups(false);
    setShowGrowCoach(false);
    setShowGrowerDirectory(false);
    setShowFeedbackReader(false);
    setNavValue(nextNav);
  };

  const openScreen = (navId, openCallback) => {
    resetScreens(navId);
    openCallback?.();
  };

  // Handle scan complete - defined before early returns to avoid conditional hook call
  const handleScanComplete = useCallback((scan) => {
    console.log('[GardenScanner] scan complete:', scan);

    if (!scan || (!scan.id && !scan.scanId && !scan.scan_id)) {
      console.warn('[GardenScanner] scan complete but no scan/id', scan);
      // Optionally show error, but do NOT crash - just return without navigating
      return;
    }

    // ScanWizard already normalizes the scan object, so we can use it directly
    // Just store it and switch to result view (NOT history)
    setActiveScan(scan);
    setActiveView('result');
    setShowScan(false);
  }, []);

  // Detect if running in Capacitor (mobile app)
  const isCapacitor = typeof window !== 'undefined' && 
    (window.Capacitor || window.location.protocol === 'capacitor:' || 
     /iPhone|iPad|iPod|Android/i.test(window.navigator.userAgent));
  const GARDEN_TOP_PAD = isCapacitor ? 'calc(env(safe-area-inset-top) + 8px)' : '8px';

  const renderWithNav = (content, navActive = navValue) => (
    <Box sx={{ 
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      width: '100%',
      maxWidth: '100vw',
      overflow: 'hidden',
      overflowX: 'hidden',
      backgroundColor: 'background.default',
    }}>
      <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden', overflowX: 'hidden', width: '100%', maxWidth: '100vw', left: 0, right: 0, position: 'relative' }}>
        {content}
      </Box>
      {/* GardenNavBar removed per user request */}
    </Box>
  );

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography sx={{ color: '#fff' }}>Loading...</Typography>
      </Box>
    );
  }

  // Show result view if we have a completed scan
  if (activeView === 'result' && activeScan) {
    return renderWithNav(
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          width: '100%',
          maxWidth: '100%',
          overflow: 'hidden',
          overflowX: 'hidden',
          bgcolor: 'transparent',
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
            pt: 'calc(env(safe-area-inset-top) + 8px)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            bgcolor: 'transparent',
            backdropFilter: 'blur(8px)',
            zIndex: 1,
          }}
        >
          <Button
            variant="text"
            onClick={() => {
              setActiveView('scanner');
              setActiveScan(null);
            }}
            sx={{ 
              color: '#fff', 
              minWidth: 'auto', 
              px: 1,
              fontSize: '1rem',
              fontWeight: 600,
            }}
          >
            ← Back
          </Button>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#fff', flex: 1 }}>
            Scan Result
          </Typography>
        </Box>

        {/* Scrollable content */}
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            width: '100%',
            maxWidth: '100vw',
            overflowY: 'auto',
            overflowX: 'hidden',
            WebkitOverflowScrolling: 'touch',
            left: 0,
            right: 0,
            position: 'relative',
            paddingBottom: 'calc(env(safe-area-inset-bottom) + 80px)',
            px: 2,
            py: 2,
          }}
        >
          <ScanResultCard
            scan={activeScan}
            result={activeScan}
            isGuest={!user}
          />
        </Box>
      </Box>,
      'scan'
    );
  }

  // Show ScanWizard if user clicked AI Scan
  if (showScan) {
    return (
      <ScanWizard 
        onBack={() => {
          setShowScan(false);
          setActiveView('scanner');
        }}
        onScanComplete={handleScanComplete}
      />
    );
  }

  // Show StrainBrowser if user clicked Strain Browser
  if (showStrainBrowser) {
    return <StrainBrowser onBack={() => setShowStrainBrowser(false)} />;
  }

  // Show ReviewsHub if user clicked Reviews Hub
  if (showReviews) {
    return <ReviewsHub onBack={() => setShowReviews(false)} currentUser={user} />;
  }

  // Show DispensaryFinder if user clicked Dispensaries
  if (showDispensaryFinder) {
    return <DispensaryFinder onBack={() => setShowDispensaryFinder(false)} />;
  }

  // Show SeedVendorFinder if user clicked Seed Vendors (handled below with state)

  // Show Groups if user clicked Community Groups
  if (showGroups) {
    return <Groups onBack={() => setShowGroups(false)} />;
  }

  // Show GrowCoach if user clicked Grow Coach
  if (showGrowCoach) {
    return <GrowCoach onBack={() => setShowGrowCoach(false)} initialTab={growCoachInitialTab} />;
  }

  // Show GrowerDirectory if user clicked Grower Directory
  if (showGrowerDirectory) {
    return <GrowerDirectory onBack={() => setShowGrowerDirectory(false)} />;
  }

  // Show FeedbackReader if admin clicked Feedback Reader
  if (showFeedbackReader) {
    return <FeedbackReader user={user} onBack={() => setShowFeedbackReader(false)} />;
  }

  const handleNavChange = (next) => {
    if (next === navValue) return;
    switch (next) {
      case 'home':
        resetScreens('home');
        return;
      case 'scan':
        openScreen('scan', () => setShowScan(true));
        return;
      case 'groups':
        openScreen('groups', () => setShowGroups(true));
        return;
      case 'dispensaries':
        openScreen('dispensaries', () => setShowDispensaryFinder(true));
        return;
      case 'growers':
        openScreen('growers', () => setShowGrowerDirectory(true));
        return;
      default:
        break;
    }
  };

  if (loading) {
    return renderWithNav(
      <Box sx={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography sx={{ color: '#fff' }}>Loading...</Typography>
      </Box>
    );
  }

  if (showScan) {
    // Show result view if we have a completed scan
    if (activeView === 'result' && activeScan) {
      return renderWithNav(
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflow: 'hidden',
            bgcolor: 'transparent',
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
              bgcolor: 'transparent',
              backdropFilter: 'blur(8px)',
              zIndex: 1,
            }}
          >
            <Button
              variant="text"
              onClick={() => {
                setActiveView('scanner');
                setActiveScan(null);
              }}
              sx={{ color: '#fff', minWidth: 'auto', px: 1 }}
            >
              ← Back
            </Button>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#fff', flex: 1 }}>
              Scan Result
            </Typography>
          </Box>

          {/* Scrollable content */}
          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              width: '100%',
              maxWidth: '100%',
              overflowY: 'auto',
              overflowX: 'hidden',
              WebkitOverflowScrolling: 'touch',
              paddingBottom: 'calc(env(safe-area-inset-bottom) + 80px)',
              px: 2,
              py: 2,
            }}
          >
            {!activeScan ? (
              <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Preparing your result…
                </Typography>
              </Box>
            ) : (
              <ScanResultCard
                scan={activeScan}
                result={activeScan}
                isGuest={!user}
              />
            )}
          </Box>
        </Box>,
        'scan'
      );
    }
    
    // Show scanner view
    return renderWithNav(
      <ScanWizard
        onBack={() => resetScreens('home')}
        onScanComplete={(scan) => {
          setActiveScan(scan);
          setActiveView('result');
        }}
      />,
      'scan'
    );
  }
  if (showStrainBrowser) {
    return renderWithNav(<StrainBrowser onBack={() => resetScreens('home')} />);
  }
  if (showReviews) {
    return renderWithNav(<ReviewsHub onBack={() => resetScreens('home')} currentUser={user} />);
  }
  if (showDispensaryFinder) {
    return renderWithNav(<DispensaryFinder onBack={() => resetScreens('home')} />, 'dispensaries');
  }
  if (showSeedFinder) {
    return renderWithNav(
      <SeedVendorFinder 
        onBack={() => {
          setShowSeedFinder(false);
          resetScreens('home');
        }}
      />
    );
  }
  if (showGroups) {
    return renderWithNav(<Groups onBack={() => resetScreens('home')} />, 'groups');
  }
  if (showGrowCoach) {
    return renderWithNav(<GrowCoach onBack={() => resetScreens('home')} initialTab={growCoachInitialTab} />);
  }
  if (showGrowerDirectory) {
    return renderWithNav(<GrowerDirectory onBack={() => resetScreens('home')} />, 'growers');
  }
  if (showFeedbackReader) {
    return renderWithNav(
      <FeedbackReader 
        user={user} 
        onBack={() => resetScreens('home')}
        onSendFeedback={() => setShowFeedback(true)}
        onMessageUser={isAdmin ? ((senderId, sender) => {
          // Navigate to Groups and open DM with this user (admins only)
          resetScreens('home');
          setShowGroups(true);
          // Store the user info to auto-open DM (Groups component will handle this)
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('openDMWith', JSON.stringify({ user_id: senderId, ...sender }));
          }
        }) : undefined}
      />
    );
  }

  return renderWithNav(
      <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      height: '100dvh', // Use dynamic viewport height for better mobile support
      width: '100%',
      maxWidth: '100vw',
      overflow: 'hidden',
      overflowX: 'hidden',
      position: 'relative',
      backgroundImage: 'url(./strainspotter-bg.jpg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'scroll', // Changed from 'fixed' for better mobile support
      backgroundRepeat: 'no-repeat',
    }}>
      {/* Overlay removed per user request */}
      {/* Fixed header - no overlay */}
      <Box sx={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        paddingTop: 'calc(env(safe-area-inset-top) * 0.2 + 4px)',
        paddingBottom: 0.5,
        px: 1,
        backgroundColor: 'transparent',
        flexShrink: 0,
      }}>
        {/* Expired Membership Warning */}
        {isExpired && (
          <Alert
            severity="error"
            icon={<WarningIcon />}
            sx={{ mb: 2, py: 0.75, fontSize: '0.85rem', width: '100%' }}
          >
            Payment overdue. Update payment to continue.
          </Alert>
        )}

        {/* Ultra Compact Header */}
        <Paper sx={{
        p: 0.5,
        mb: 0,
        background: 'transparent',
        border: 'none',
        boxShadow: 'none',
        width: '100%',
        maxWidth: '100%',
        overflowX: 'hidden',
        overflow: 'hidden'
      }}>
        {/* Compact buttons and welcome in one row */}
        <Stack direction="row" spacing={0.25} alignItems="center" justifyContent="space-between" sx={{ flexWrap: 'nowrap', gap: 0.25 }}>
          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
            <Avatar
              src="/hero.png?v=13"
              alt="StrainSpotter"
              sx={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                overflow: 'hidden',
                border: '1px solid rgba(124, 179, 66, 0.6)',
                flexShrink: 0
              }}
            />
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="body2" sx={{ color: '#fff', fontWeight: 700, fontSize: '0.8rem', lineHeight: 1.1, mb: 0 }}>
                The Garden
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={0.25} alignItems="center" sx={{ flexWrap: 'nowrap', gap: 0.25, justifyContent: 'flex-end' }}>
            {/* Credit Balance */}
            <Box onClick={() => setShowBuyScans(true)} sx={{ cursor: 'pointer' }}>
              <CreditBalance />
            </Box>
            {onBack && (
              <Button
                variant="text"
                size="small"
                onClick={onBack}
                sx={{
                  color: '#CDDC39',
                  fontSize: '0.65rem',
                  py: 0.15,
                  px: 0.5,
                  minWidth: 'auto',
                  textTransform: 'none',
                  '&:hover': {
                    background: 'rgba(124, 179, 66, 0.2)'
                  }
                }}
              >
                Home
              </Button>
            )}
            <Button
              variant="text"
              size="small"
              onClick={handleLogout}
              sx={{
                color: '#CDDC39',
                fontSize: '0.65rem',
                py: 0.15,
                px: 0.5,
                minWidth: 'auto',
                textTransform: 'none',
                '&:hover': {
                  background: 'rgba(124, 179, 66, 0.2)'
                }
              }}
            >
              Logout
            </Button>
          </Stack>
        </Stack>
      </Paper>
      </Box>

      {/* Content - scrollable for better layout with bigger buttons */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          width: '100%',
          maxWidth: '100%',
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
          px: 1,
          pb: 'calc(env(safe-area-inset-bottom) + 16px)',
          pt: 1,
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* All Feature Tiles - Fill screen width */}
        <Grid 
          container
          spacing={1.5} 
          sx={{ 
            width: '100%',
            maxWidth: '100%',
            justifyContent: 'flex-start', 
            mx: 0,
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            WebkitOverflowScrolling: 'touch',
            display: 'flex',
            alignContent: 'flex-start',
            alignItems: 'stretch',
            py: 1,
            px: { xs: 1, sm: 2, md: 3 },
          }}
        >
          {tiles.map((tile) => (
          <Grid item xs={6} key={tile.nav} sx={{ display: 'flex', justifyContent: 'center', minHeight: '120px' }}>
            <Paper
              onClick={() => handleFeatureClick(tile.title, tile.nav)}
              sx={{
                p: 2,
                textAlign: 'center',
                cursor: 'pointer',
                background: 'rgba(0, 0, 0, 0.3)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '2px solid rgba(124, 179, 66, 0.3)',
                borderRadius: 3,
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                position: 'relative',
                overflow: 'hidden',
                width: '100%',
                height: '100%',
                minHeight: '120px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 0.75,
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: '-50%',
                  left: '-50%',
                  width: '200%',
                  height: '200%',
                  background: 'radial-gradient(circle, rgba(124, 179, 66, 0.15) 0%, transparent 70%)',
                  opacity: 0,
                  transition: 'opacity 0.2s ease'
                },
                '&:hover': {
                  background: 'rgba(124, 179, 66, 0.15)',
                  border: '2px solid rgba(124, 179, 66, 0.6)',
                  transform: 'translateY(-2px) scale(1.03)',
                  boxShadow: '0 6px 20px rgba(124, 179, 66, 0.4)',
                  '&::before': {
                    opacity: 1
                  }
                },
                '&:active': {
                  transform: 'translateY(0px) scale(0.98)',
                  transition: 'all 0.1s ease'
                }
              }}
            >
              {tile.useEmoji ? (
                <Box sx={{
                  fontSize: '3rem',
                  lineHeight: 1,
                  mb: 0.5,
                  filter: 'drop-shadow(0 3px 6px rgba(0, 0, 0, 0.4))',
                  transition: 'all 0.2s ease',
                  textAlign: 'center',
                  width: '100%'
                }}>
                  {tile.image}
                </Box>
              ) : (
                <Box sx={{
                  width: '56px',
                  height: '56px',
                  mb: 0.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  border: '2px solid rgba(124, 179, 66, 0.5)',
                  boxShadow: '0 0 16px rgba(124, 179, 66, 0.4)',
                  overflow: 'hidden',
                  background: 'transparent',
                  transition: 'all 0.2s ease',
                  mx: 'auto'
                }}>
                  <img
                    src={tile.image}
                    alt={tile.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </Box>
              )}
              <Typography variant="body1" sx={{
                color: '#CDDC39',
                fontWeight: 700,
                fontSize: '1rem',
                lineHeight: 1.2,
                mb: 0,
                display: 'block',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.7)',
                transition: 'all 0.2s ease',
                textAlign: 'center',
                width: '100%'
              }}>
                {tile.title}
              </Typography>
            </Paper>
          </Grid>
          ))}
        </Grid>
      </Box>

      {/* Logout Warning Dialog */}
      <Dialog
        open={showLogoutWarning}
        onClose={() => setShowLogoutWarning(false)}
        fullScreen
        PaperProps={{
          sx: {
            bgcolor: '#1a1a1a',
            m: 0,
            maxHeight: '100vh'
          }
        }}
      >
        <DialogTitle sx={{ bgcolor: '#ff5252', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <WarningIcon />
            <span>Cannot Logout</span>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ mt: 2, bgcolor: '#1a1a1a', color: '#fff' }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Your membership payment is overdue. You must resolve your payment before you can logout.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Please update your payment method or contact support for assistance.
          </Typography>
          <Button
            variant="contained"
            fullWidth
            sx={{ mt: 3, bgcolor: '#7cb342', '&:hover': { bgcolor: '#689f38' } }}
            onClick={() => setShowLogoutWarning(false)}
          >
            Update Payment Method
          </Button>
          <Button
            variant="outlined"
            fullWidth
            color="error"
            sx={{ mt: 1 }}
            onClick={async () => {
              // Force logout regardless of membership status
              try {
                await supabase.auth.signOut();
                // Clear localStorage to reset age verification
                localStorage.clear();
                sessionStorage.clear();
                setShowLogoutWarning(false);
                onBack?.();
              } catch (e) {
                console.error('Force logout failed:', e);
              }
            }}
          >
            Force Logout Anyway
          </Button>
          <Button
            variant="text"
            fullWidth
            sx={{ mt: 1 }}
            onClick={() => setShowLogoutWarning(false)}
          >
            Close
          </Button>
        </DialogContent>
      </Dialog>

      {/* Coming Soon Dialog */}
      <Dialog
        open={showComingSoon}
        onClose={() => setShowComingSoon(false)}
        fullScreen
        PaperProps={{
          sx: {
            background: 'linear-gradient(135deg, rgba(124, 179, 66, 0.95) 0%, rgba(104, 159, 56, 0.95) 100%)',
            backdropFilter: 'blur(20px)',
            borderRadius: { xs: 0, sm: 4 },
            border: '2px solid rgba(255, 255, 255, 0.2)',
            m: 0,
            maxHeight: '100vh'
          }
        }}
      >
        <DialogTitle sx={{ color: '#fff', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
          🚧 Coming Soon!
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', p: 4 }}>
          <Typography sx={{ color: '#fff', mb: 2 }}>
            <strong>{selectedFeature}</strong> is currently under development.
          </Typography>
          <Typography sx={{ color: '#e0e0e0', mb: 2 }}>
            We're working hard to bring you this feature soon! In the meantime, enjoy scanning strains and exploring the community.
          </Typography>
          <Button
            variant="contained"
            fullWidth
            sx={{
              mt: 2,
              bgcolor: '#fff',
              color: '#7cb342',
              '&:hover': { bgcolor: '#f0f0f0' }
            }}
            onClick={() => setShowComingSoon(false)}
          >
            Got it!
          </Button>
        </DialogContent>
      </Dialog>

      {/* Floating Feedback Button at bottom right */}
      <Fab
        color="success"
        aria-label="feedback"
        onClick={() => isAdmin ? setShowFeedbackReader(true) : setShowFeedback(true)}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 1000,
          bgcolor: '#7cb342',
          '&:hover': {
            bgcolor: '#689f38'
          }
        }}
      >
        <FeedbackIcon />
      </Fab>

      {/* Feedback Modal */}
      <FeedbackModal
        open={showFeedback}
        onClose={() => setShowFeedback(false)}
        user={user}
      />

      {/* Buy Scans Modal */}
      <BuyScansModal
        open={showBuyScans}
        onClose={() => setShowBuyScans(false)}
        currentTier="free"
        creditsRemaining={0}
      />
    </Box>
  );
}
