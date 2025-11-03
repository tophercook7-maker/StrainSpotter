import { useState } from 'react';
import { Box, Button, Typography, Grid, Paper, Stack, Avatar, Alert, Dialog, DialogTitle, DialogContent } from '@mui/material';
import { supabase } from '../supabaseClient';
import { useMembershipGuard } from '../hooks/useMembershipGuard';
import ScanWizard from './ScanWizard';
import StrainBrowser from './StrainBrowser';
import ReviewsHub from './ReviewsHub';
import DispensaryFinder from './DispensaryFinder';
import SeedVendorFinder from './SeedVendorFinder';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import SpaIcon from '@mui/icons-material/Spa';
import GroupsIcon from '@mui/icons-material/Groups';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import StoreIcon from '@mui/icons-material/Store';
import PeopleIcon from '@mui/icons-material/People';
import WarningIcon from '@mui/icons-material/Warning';
import RateReviewIcon from '@mui/icons-material/RateReview';

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

  const handleLogout = async () => {
    if (!canLogout) {
      setShowLogoutWarning(true);
      return;
    }

    try {
      await supabase.auth.signOut();
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

    // For other features, show "coming soon" (later this could call into a navigator)
    setSelectedFeature(featureName);
    setShowComingSoon(true);
  };

  const tiles = [
    { title: 'AI Strain Scan', icon: <CameraAltIcon />, nav: 'scan', color: '#00e676' },
    { title: 'Strain Browser', icon: <SpaIcon />, nav: 'strains', color: '#7cb342' },
    { title: 'Reviews Hub', icon: <RateReviewIcon />, nav: 'reviews', color: '#ffd600' },
    { title: 'Community Groups', icon: <GroupsIcon />, nav: 'groups', color: '#66bb6a' },
    { title: 'Grow Coach', icon: <LocalFloristIcon />, nav: 'grow-coach', color: '#9ccc65' },
    { title: 'Grower Directory', icon: <PeopleIcon />, nav: 'growers', color: '#8bc34a' },
    { title: 'Seed Vendors', icon: <MenuBookIcon />, nav: 'seeds', color: '#aed581' },
    { title: 'Dispensaries', icon: <StoreIcon />, nav: 'dispensaries', color: '#c5e1a5' },
  ];

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

  return (
    <Box sx={{
      minHeight: '100vh',
      p: 3,
      background: 'none'
    }}>
      {/* Expired Membership Warning */}
      {isExpired && (
        <Alert
          severity="error"
          icon={<WarningIcon />}
          sx={{ mb: 3, fontWeight: 600 }}
        >
          Your membership payment is overdue. Please update your payment method to continue accessing premium features.
          You cannot logout until payment is resolved.
        </Alert>
      )}

      {/* Header */}
      <Paper sx={{
        p: 3,
        mb: 3,
        background: 'rgba(255,255,255,0.15)',
        backdropFilter: 'blur(20px)',
        border: '2px solid rgba(124, 179, 66, 0.3)',
        borderRadius: 4
      }}>
        {/* Buttons on top left */}
        <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
          {onBack && (
            <Button
              variant="outlined"
              onClick={onBack}
              sx={{
                color: '#fff',
                borderColor: 'rgba(124, 179, 66, 0.6)',
                '&:hover': { borderColor: 'rgba(124, 179, 66, 1)', bgcolor: 'rgba(124, 179, 66, 0.1)' }
              }}
            >
              ← Home
            </Button>
          )}
          <Button
            variant="outlined"
            startIcon={<ExitToAppIcon />}
            onClick={handleLogout}
            sx={{
              color: '#fff',
              borderColor: 'rgba(124, 179, 66, 0.6)',
              '&:hover': { borderColor: 'rgba(124, 179, 66, 1)', bgcolor: 'rgba(124, 179, 66, 0.1)' }
            }}
          >
            Logout
          </Button>
        </Stack>

        {/* Welcome section below buttons */}
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar sx={{ bgcolor: '#7cb342', width: 56, height: 56 }}>
            {user?.user_metadata?.username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
          </Avatar>
          <Box>
            <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700 }}>
              Welcome to the Garden
            </Typography>
            <Typography variant="body2" sx={{ color: '#e0e0e0' }}>
              {user?.user_metadata?.username || user?.email || 'Member'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#7cb342', fontWeight: 600 }}>
              ✓ Club Member
            </Typography>
          </Box>
        </Stack>
      </Paper>

      {/* Feature Tiles */}
      <Grid container spacing={3}>
        {tiles.map((tile) => (
          <Grid item xs={12} sm={6} md={4} key={tile.nav}>
            <Paper
              onClick={() => handleFeatureClick(tile.title, tile.nav)}
              sx={{
                p: 4,
                textAlign: 'center',
                cursor: 'pointer',
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(20px)',
                border: '2px solid rgba(124, 179, 66, 0.3)',
                borderRadius: 4,
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: 'rgba(124, 179, 66, 0.2)',
                  border: '2px solid rgba(124, 179, 66, 0.6)',
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 24px rgba(124, 179, 66, 0.3)'
                }
              }}
            >
              <Box sx={{
                width: 80,
                height: 80,
                margin: '0 auto 16px auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: tile.color,
                borderRadius: '50%',
                '& svg': { fontSize: 40, color: '#fff' }
              }}>
                {tile.icon}
              </Box>
              <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700 }}>
                {tile.title}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Membership Info */}
      <Paper sx={{
        p: 3,
        mt: 3,
        background: 'rgba(255,255,255,0.1)',
        backdropFilter: 'blur(20px)',
        border: '2px solid rgba(124, 179, 66, 0.3)',
        borderRadius: 4
      }}>
        <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, mb: 2 }}>
          Your Membership
        </Typography>
        <Stack spacing={1}>
          <Typography variant="body2" sx={{ color: '#e0e0e0' }}>
            <strong>Status:</strong> Active Club Member
          </Typography>
          <Typography variant="body2" sx={{ color: '#e0e0e0' }}>
            <strong>Plan:</strong> $4.99/month
          </Typography>
          <Typography variant="body2" sx={{ color: '#e0e0e0' }}>
            <strong>Benefits:</strong> Unlimited scans, reviews, community access, and more
          </Typography>
          <Button
            variant="outlined"
            size="small"
            sx={{
              mt: 2,
              color: '#fff',
              borderColor: 'rgba(255, 82, 82, 0.6)',
              '&:hover': { borderColor: 'rgba(255, 82, 82, 1)', bgcolor: 'rgba(255, 82, 82, 0.1)' }
            }}
          >
            Cancel Membership
          </Button>
        </Stack>
      </Paper>

      {/* Logout Warning Dialog */}
      <Dialog open={showLogoutWarning} onClose={() => setShowLogoutWarning(false)}>
        <DialogTitle sx={{ bgcolor: '#ff5252', color: '#fff' }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <WarningIcon />
            <span>Cannot Logout</span>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
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
        PaperProps={{
          sx: {
            background: 'linear-gradient(135deg, rgba(124, 179, 66, 0.95) 0%, rgba(104, 159, 56, 0.95) 100%)',
            backdropFilter: 'blur(20px)',
            borderRadius: 4,
            border: '2px solid rgba(255, 255, 255, 0.2)'
          }
        }}
      >
        <DialogTitle sx={{ color: '#fff', fontWeight: 700 }}>
          🚧 Coming Soon!
        </DialogTitle>
        <DialogContent>
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
    </Box>
  );
}
