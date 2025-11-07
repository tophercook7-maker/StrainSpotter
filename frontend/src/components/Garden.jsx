import { useState } from 'react';
import { Box, Button, Typography, Grid, Paper, Stack, Avatar, Alert, Dialog, DialogTitle, DialogContent, Fab, Tooltip } from '@mui/material';
import { supabase } from '../supabaseClient';
import { useMembershipGuard } from '../hooks/useMembershipGuard';
import ScanWizard from './ScanWizard';
import StrainBrowser from './StrainBrowser';
import ReviewsHub from './ReviewsHub';
import DispensaryFinder from './DispensaryFinder';
import SeedVendorFinder from './SeedVendorFinder';
import Groups from './Groups';
import GrowCoach from './GrowCoach';
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
import CreditBalance from './CreditBalance';
import BuyScansModal from './BuyScansModal';

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
  const [showGrowerDirectory, setShowGrowerDirectory] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showFeedbackReader, setShowFeedbackReader] = useState(false);
  const [showBuyScans, setShowBuyScans] = useState(false);

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
    // Special case for AI Scan
    if (nav === 'scan') {
      setShowScan(true);
      return;
    }

    // Special case for Strain Browser
    if (nav === 'strains') {
      setShowStrainBrowser(true);
      return;
    }

    // Special case for Reviews Hub
    if (nav === 'reviews') {
      setShowReviews(true);
      return;
    }

    // Special case for Dispensary Finder
    if (nav === 'dispensaries') {
      setShowDispensaryFinder(true);
      return;
    }

    // Special case for Seed Vendor Finder
    if (nav === 'seeds') {
      setShowSeedFinder(true);
      return;
    }

    // Special case for Community Groups
    if (nav === 'groups') {
      setShowGroups(true);
      return;
    }

    // Special case for Grow Coach
    if (nav === 'grow-coach') {
      setShowGrowCoach(true);
      return;
    }

    // Special case for Grower Directory
    if (nav === 'growers') {
      setShowGrowerDirectory(true);
      return;
    }

    // Special case for Feedback Reader (admin only)
    if (nav === 'feedback-reader') {
      setShowFeedbackReader(true);
      return;
    }

    // For other features, show "coming soon" (later this could call into a navigator)
    setSelectedFeature(featureName);
    setShowComingSoon(true);
  };

  // Check if user is admin
  const isAdmin = user?.email === 'topher.cook7@gmail.com' ||
                  user?.email === 'strainspotter25@gmail.com' ||
                  user?.email === 'admin@strainspotter.com' ||
                  user?.email === 'andrewbeck209@gmail.com';

  const tiles = [
    { title: 'AI Strain Scan', icon: <CameraAltIcon />, nav: 'scan', color: '#00e676', description: 'Identify any strain instantly' },
    { title: 'Strain Browser', icon: <SpaIcon />, nav: 'strains', color: '#7cb342', description: 'Explore 1000+ strains' },
    { title: 'Reviews Hub', icon: <RateReviewIcon />, nav: 'reviews', color: '#ffd600', description: 'Read & share experiences' },
    { title: 'Community Groups', icon: <GroupsIcon />, nav: 'groups', color: '#66bb6a', description: 'Connect with growers' },
    { title: 'Grow Coach', icon: <LocalFloristIcon />, nav: 'grow-coach', color: '#9ccc65', description: 'Expert growing tips' },
    { title: 'Grower Directory', icon: <PeopleIcon />, nav: 'growers', color: '#8bc34a', description: 'Find local cultivators' },
    { title: 'Seed Vendors', icon: <MenuBookIcon />, nav: 'seeds', color: '#aed581', description: 'Trusted seed sources' },
    { title: 'Dispensaries', icon: <StoreIcon />, nav: 'dispensaries', color: '#c5e1a5', description: 'Find nearby shops' },
  ];

  // Add admin-only tiles
  if (isAdmin) {
    tiles.push({
      title: 'Feedback Reader',
      icon: <FeedbackIcon />,
      nav: 'feedback-reader',
      color: '#ff6b6b',
      description: 'Admin feedback tool',
      adminOnly: true
    });
  }

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography sx={{ color: '#fff' }}>Loading...</Typography>
      </Box>
    );
  }

  // Show ScanWizard if user clicked AI Scan
  if (showScan) {
    return <ScanWizard onBack={() => setShowScan(false)} />;
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

  // Show SeedVendorFinder if user clicked Seed Vendors
  if (showSeedFinder) {
    return <SeedVendorFinder onBack={() => setShowSeedFinder(false)} />;
  }

  // Show Groups if user clicked Community Groups
  if (showGroups) {
    return <Groups onBack={() => setShowGroups(false)} />;
  }

  // Show GrowCoach if user clicked Grow Coach
  if (showGrowCoach) {
    return <GrowCoach onBack={() => setShowGrowCoach(false)} />;
  }

  // Show GrowerDirectory if user clicked Grower Directory
  if (showGrowerDirectory) {
    return <GrowerDirectory onBack={() => setShowGrowerDirectory(false)} />;
  }

  // Show FeedbackReader if admin clicked Feedback Reader
  if (showFeedbackReader) {
    return <FeedbackReader user={user} onBack={() => setShowFeedbackReader(false)} />;
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      paddingTop: '120px',  // Fixed padding to clear the notch
      pb: 'calc(env(safe-area-inset-bottom) + 12px)',
      px: 2,
      background: 'none'
    }}>
      {/* Expired Membership Warning */}
      {isExpired && (
        <Alert
          severity="error"
          icon={<WarningIcon />}
          sx={{ mb: 1.5, py: 0.5, fontSize: '0.75rem' }}
        >
          Payment overdue. Update payment to continue.
        </Alert>
      )}

      {/* Premium Glassmorphism Header */}
      <Paper sx={{
        p: 1.5,
        mb: 1.5,
        background: 'linear-gradient(135deg, rgba(124, 179, 66, 0.15) 0%, rgba(156, 204, 101, 0.1) 100%)',
        backdropFilter: 'blur(20px)',
        border: '1.5px solid rgba(124, 179, 66, 0.4)',
        borderRadius: 3,
        boxShadow: '0 4px 20px rgba(124, 179, 66, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        transition: 'all 0.15s ease'
      }}>
        {/* Compact buttons and welcome in one row */}
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'transparent',
                border: '2px solid rgba(124, 179, 66, 0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}
            >
              <img
                src="/hero.png?v=13"
                alt="StrainSpotter"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, fontSize: '1.4rem', lineHeight: 1.2, mb: 0.25 }}>
                The Garden
              </Typography>
              <Typography variant="caption" sx={{ color: '#7cb342', fontWeight: 600, fontSize: '0.75rem' }}>
                {isAdmin ? '✓ Member • Admin & Moderator' : '✓ Member'}
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={0.5} alignItems="center">
            {/* Credit Balance */}
            <Box onClick={() => setShowBuyScans(true)} sx={{ cursor: 'pointer' }}>
              <CreditBalance />
            </Box>
            {onBack && (
              <Button
                variant="outlined"
                size="small"
                onClick={onBack}
                sx={{
                  color: '#CDDC39',
                  borderColor: 'rgba(124, 179, 66, 0.5)',
                  fontSize: '0.7rem',
                  py: 0.5,
                  px: 1,
                  minWidth: 'auto',
                  background: 'rgba(124, 179, 66, 0.1)',
                  backdropFilter: 'blur(5px)',
                  transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    borderColor: 'rgba(124, 179, 66, 1)',
                    background: 'rgba(124, 179, 66, 0.2)',
                    transform: 'scale(1.05)',
                    color: '#fff'
                  },
                  '&:active': {
                    transform: 'scale(0.95)',
                    transition: 'all 0.05s ease'
                  }
                }}
              >
                Home
              </Button>
            )}
            <Button
              variant="outlined"
              size="small"
              onClick={handleLogout}
              sx={{
                color: '#CDDC39',
                borderColor: 'rgba(124, 179, 66, 0.5)',
                fontSize: '0.7rem',
                py: 0.5,
                px: 1,
                minWidth: 'auto',
                background: 'rgba(124, 179, 66, 0.1)',
                backdropFilter: 'blur(5px)',
                transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  borderColor: 'rgba(124, 179, 66, 1)',
                  background: 'rgba(124, 179, 66, 0.2)',
                  transform: 'scale(1.05)',
                  color: '#fff'
                },
                '&:active': {
                  transform: 'scale(0.95)',
                  transition: 'all 0.05s ease'
                }
              }}
            >
              Logout
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* Welcome & Info Section */}
      <Paper sx={{
        p: 2,
        mb: 2,
        background: 'linear-gradient(135deg, rgba(124, 179, 66, 0.08) 0%, rgba(156, 204, 101, 0.05) 100%)',
        backdropFilter: 'blur(15px)',
        border: '1.5px solid rgba(124, 179, 66, 0.25)',
        borderRadius: 3,
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.2)'
      }}>
        <Typography variant="h6" sx={{
          color: '#CDDC39',
          fontWeight: 700,
          fontSize: '1.1rem',
          mb: 1,
          textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)'
        }}>
          <Stack direction="row" alignItems="center" spacing={1} justifyContent="center">
            <span>Welcome to The Garden</span>
            <Box component="img" src="/hero.png?v=13" alt="" sx={{ width: 20, height: 20, borderRadius: '50%', filter: 'drop-shadow(0 0 4px rgba(124, 179, 66, 0.6))' }} />
          </Stack>
        </Typography>
        <Typography variant="body2" sx={{
          color: '#e8e8e8',
          fontSize: '0.85rem',
          lineHeight: 1.6,
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
        }}>
          Your premium cannabis companion. Identify strains instantly, track your favorites, find nearby dispensaries, and connect with the community. Every feature is designed to enhance your cannabis experience.
        </Typography>
      </Paper>

      {/* Premium Feature Tiles - 2 per row, bigger */}
      <Grid container spacing={2}>
        {tiles.map((tile) => (
          <Grid item xs={6} key={tile.nav}>
            <Paper
              onClick={() => handleFeatureClick(tile.title, tile.nav)}
              sx={{
                p: 2,
                textAlign: 'center',
                cursor: 'pointer',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(124, 179, 66, 0.08) 100%)',
                backdropFilter: 'blur(15px)',
                border: '1.5px solid rgba(124, 179, 66, 0.3)',
                borderRadius: 2.5,
                transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                position: 'relative',
                overflow: 'hidden',
                minHeight: '120px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: '-50%',
                  left: '-50%',
                  width: '200%',
                  height: '200%',
                  background: 'radial-gradient(circle, rgba(124, 179, 66, 0.1) 0%, transparent 70%)',
                  opacity: 0,
                  transition: 'opacity 0.15s ease'
                },
                '&:hover': {
                  background: 'linear-gradient(135deg, rgba(124, 179, 66, 0.2) 0%, rgba(156, 204, 101, 0.15) 100%)',
                  border: '1.5px solid rgba(124, 179, 66, 0.6)',
                  transform: 'translateY(-4px) scale(1.05)',
                  boxShadow: '0 8px 24px rgba(124, 179, 66, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                  '&::before': {
                    opacity: 1
                  }
                },
                '&:active': {
                  transform: 'translateY(-2px) scale(1.02)',
                  transition: 'all 0.05s ease'
                }
              }}
            >
              <Box sx={{
                width: 48,
                height: 48,
                margin: '0 auto 8px auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: `linear-gradient(135deg, ${tile.color} 0%, ${tile.color}dd 100%)`,
                borderRadius: '50%',
                boxShadow: `0 3px 10px ${tile.color}66, inset 0 1px 0 rgba(255, 255, 255, 0.3)`,
                transition: 'all 0.15s ease',
                '& svg': { fontSize: 28, color: '#fff', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }
              }}>
                {tile.icon}
              </Box>
              <Typography variant="body2" sx={{
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.9rem',
                lineHeight: 1.2,
                mb: 0.5,
                display: 'block',
                textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)',
                transition: 'all 0.15s ease'
              }}>
                {tile.title}
              </Typography>
              <Typography variant="caption" sx={{
                color: '#b0b0b0',
                fontSize: '0.7rem',
                lineHeight: 1.3,
                display: 'block',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)'
              }}>
                {tile.description}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Premium Membership Info */}
      <Paper sx={{
        p: 1.5,
        mt: 1.5,
        background: 'linear-gradient(135deg, rgba(124, 179, 66, 0.12) 0%, rgba(156, 204, 101, 0.08) 100%)',
        backdropFilter: 'blur(15px)',
        border: '1.5px solid rgba(124, 179, 66, 0.3)',
        borderRadius: 3,
        boxShadow: '0 2px 12px rgba(124, 179, 66, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        transition: 'all 0.15s ease'
      }}>
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
          <Typography variant="caption" sx={{
            color: '#e8e8e8',
            fontSize: '0.7rem',
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
          }}>
            <strong style={{ color: '#CDDC39' }}>Plan:</strong> $4.99/mo • Active Member
          </Typography>
          <Button
            variant="text"
            size="small"
            sx={{
              color: '#ff5252',
              fontSize: '0.65rem',
              py: 0.25,
              px: 1,
              minWidth: 'auto',
              transition: 'all 0.15s ease',
              '&:hover': {
                bgcolor: 'rgba(255, 82, 82, 0.15)',
                transform: 'scale(1.05)'
              },
              '&:active': {
                transform: 'scale(0.95)',
                transition: 'all 0.05s ease'
              }
            }}
          >
            Cancel
          </Button>
        </Stack>
      </Paper>

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
