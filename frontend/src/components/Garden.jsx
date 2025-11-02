import { useState, useEffect, useCallback } from 'react';
import { Box, Button, Typography, Grid, Paper, Stack, Avatar, Alert, Dialog, DialogTitle, DialogContent, Chip, Divider, CircularProgress } from '@mui/material';
import { supabase } from '../supabaseClient';
import { useMembershipGuard } from '../hooks/useMembershipGuard';
import ScanWizard from './ScanWizard';
import StrainBrowser from './StrainBrowser';
import ReviewsHub from './ReviewsHub';
import DispensaryFinder from './DispensaryFinder';
import SeedVendorFinder from './SeedVendorFinder';
import Groups from './Groups';
import GrowerDirectory from './GrowerDirectory';
import GrowCoach, { LOGBOOK_TAB_INDEX } from './GrowCoach';
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
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import Diversity3Icon from '@mui/icons-material/Diversity3';
import BoltIcon from '@mui/icons-material/Bolt';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import NoteAltIcon from '@mui/icons-material/NoteAlt';
import { API_BASE } from '../config';

export default function Garden({ onNavigate, onBack }) {
  const { user, isExpired, canLogout, loading } = useMembershipGuard();
  const [showLogoutWarning, setShowLogoutWarning] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState('');
  const [showScan, setShowScan] = useState(false);
  const [showStrainBrowser, setShowStrainBrowser] = useState(false);
  const [showReviews, setShowReviews] = useState(false);
  const [showDispensaryFinder, setShowDispensaryFinder] = useState(false);
  const [showSeedFinder, setShowSeedFinder] = useState(false);
  const [showGrowerDirectory, setShowGrowerDirectory] = useState(false);
  const [showGroups, setShowGroups] = useState(false);
  const [showGrowCoach, setShowGrowCoach] = useState(false);
  const [growCoachInitialTab, setGrowCoachInitialTab] = useState(0);
  const [creditSummary, setCreditSummary] = useState(null);
  const [creditsLoading, setCreditsLoading] = useState(false);

  const metadata = user?.user_metadata || {};
  const avatarUrl = metadata.avatar_url || metadata.avatar || null;
  const displayName = metadata.username || metadata.full_name || user?.email || 'Member';
  const initials = displayName.substring(0, 2).toUpperCase();
  const membershipTierRaw = (metadata.membership || 'guest').toLowerCase();
  const roleLabelRaw = (metadata.role_label || metadata.role || '').toString();
  const roleLabel = roleLabelRaw
    ? roleLabelRaw.charAt(0).toUpperCase() + roleLabelRaw.slice(1)
    : null;
  const membershipJoined = metadata.membership_started ? new Date(metadata.membership_started) : null;
  const membershipLabel = membershipTierRaw === 'club'
    ? 'Club Member'
    : membershipTierRaw === 'pro'
      ? 'Pro Member'
      : 'Guest Pass';
  const membershipChipColor = membershipTierRaw === 'club' && !isExpired
    ? 'success'
    : membershipTierRaw === 'guest'
      ? 'default'
      : 'primary';
  const compReason = metadata.membership_comp_reason || metadata.comp_reason || null;
  const isModerator = metadata.moderator === true || metadata.is_moderator === true || metadata.moderator_role === 'grower';
  const loadCredits = useCallback(async () => {
    if (!user?.id) {
      setCreditSummary(null);
      return;
    }
    setCreditsLoading(true);
    try {
      const baseUrl = API_BASE || 'http://localhost:5181';
      const resp = await fetch(`${baseUrl}/api/scans/credits?user_id=${user.id}`);
      if (resp.ok) {
        const data = await resp.json();
        setCreditSummary(data);
      }
    } catch (err) {
      console.error('Failed to load credits:', err);
    } finally {
      setCreditsLoading(false);
    }
  }, [user?.id]);

  const membershipBenefits = [
    {
      icon: <WorkspacePremiumIcon sx={{ color: '#ffd54f' }} />,
      title: 'VIP Access',
      description: 'Unlock the full strain vault, scan history, and curated grow recipes.'
    },
    {
      icon: <AutoAwesomeIcon sx={{ color: '#80deea' }} />,
      title: 'AI Boost',
      description: 'Enjoy premium scan credits and tailored recommendations for your garden.'
    },
    {
      icon: <Diversity3Icon sx={{ color: '#a5d6a7' }} />,
      title: 'Community Perks',
      description: 'Priority invites to expert AMAs, giveaways, and local meetups.'
    }
  ];

  useEffect(() => {
    loadCredits();
  }, [loadCredits]);

  const creditsRemaining = typeof creditSummary?.credits === 'number' ? creditSummary.credits : null;
  const membershipActive = typeof creditSummary?.membershipActive === 'boolean'
    ? creditSummary.membershipActive
    : (metadata.membership || '').toLowerCase() === 'club';
  const monthlyBundle = typeof creditSummary?.monthlyBundle === 'number' ? creditSummary.monthlyBundle : null;
  const trialDaysRemaining = typeof creditSummary?.trialDaysRemaining === 'number' ? creditSummary.trialDaysRemaining : null;
  const starterExpired = Boolean(creditSummary?.starterExpired);
  const accessExpiresLabel = creditSummary?.accessExpiresAt
    ? new Date(creditSummary.accessExpiresAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : null;
  const lowCredits = typeof creditsRemaining === 'number' && creditsRemaining <= 5;

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

    if (nav === 'growers') {
      setShowGrowerDirectory(true);
      return;
    }

    if (nav === 'groups') {
      setShowGroups(true);
      return;
    }

    if (nav === 'grow-coach') {
      setGrowCoachInitialTab(0);
      setShowGrowCoach(true);
      return;
    }

    if (nav === 'grow-logbook') {
      setGrowCoachInitialTab(LOGBOOK_TAB_INDEX);
      setShowGrowCoach(true);
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
    { title: 'Grow Logbook', icon: <NoteAltIcon />, nav: 'grow-logbook', color: '#81c784' },
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
    return <ScanWizard onBack={() => { setShowScan(false); loadCredits(); }} />;
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

  if (showGrowerDirectory) {
    return (
      <GrowerDirectory
        onNavigate={onNavigate}
        onBack={() => setShowGrowerDirectory(false)}
      />
    );
  }

  if (showGroups) {
    return (
      <Groups
        onNavigate={onNavigate}
        onBack={() => setShowGroups(false)}
      />
    );
  }

  if (showGrowCoach) {
    return (
      <GrowCoach
        initialTab={growCoachInitialTab}
        onBack={() => setShowGrowCoach(false)}
      />
    );
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
        p: { xs: 2, md: 3 },
        mb: 3,
        background: 'rgba(255,255,255,0.15)',
        backdropFilter: 'blur(20px)',
        border: '2px solid rgba(124, 179, 66, 0.3)',
        borderRadius: 4
      }}>
        {/* Header actions */}
        <Stack
          direction={{ xs: 'column-reverse', sm: 'row' }}
          spacing={1.5}
          sx={{ mb: { xs: 2, md: 3 }, alignSelf: { xs: 'stretch', sm: 'flex-end' } }}
        >
          <Button
            variant="outlined"
            startIcon={<ExitToAppIcon />}
            onClick={handleLogout}
            sx={{
              width: { xs: '100%', sm: 'auto' },
              color: '#fff',
              borderColor: 'rgba(255, 82, 82, 0.6)',
              '&:hover': { borderColor: 'rgba(255, 82, 82, 1)', bgcolor: 'rgba(255, 82, 82, 0.1)' }
            }}
          >
            Logout
          </Button>
        </Stack>

        {/* Welcome section below buttons */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }}>
          <Avatar
            src={avatarUrl || undefined}
            sx={{
              bgcolor: '#7cb342',
              width: { xs: 56, md: 64 },
              height: { xs: 56, md: 64 },
              fontSize: { xs: 20, md: 24 },
              border: '3px solid rgba(124, 179, 66, 0.4)'
            }}
          >
            {!avatarUrl && initials}
          </Avatar>
          <Box>
            <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700 }}>
              Welcome to the Garden
            </Typography>
            <Typography variant="body2" sx={{ color: '#e0e0e0' }}>
              {displayName}
            </Typography>
            {roleLabel && (
              <Typography variant="caption" sx={{ color: '#c8ff9e', textTransform: 'uppercase', letterSpacing: 1 }}>
                {roleLabel}
              </Typography>
            )}
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5, flexWrap: 'wrap' }}>
              <Chip
                label={isExpired ? 'Membership Past Due' : membershipLabel}
                color={isExpired ? 'error' : membershipChipColor}
                size="small"
                icon={<WorkspacePremiumIcon fontSize="small" />}
                sx={{ color: isExpired ? '#fff' : undefined }}
              />
              {membershipJoined && (
                <Chip
                  label={`Member since ${membershipJoined.toLocaleDateString()}`}
                  size="small"
                  sx={{ bgcolor: 'rgba(255,255,255,0.08)', color: '#fff' }}
                />
              )}
              {isModerator && (
                <Chip
                  label="Community Moderator"
                  size="small"
                  color="secondary"
                  icon={<VerifiedUserIcon fontSize="small" />}
                />
              )}
              {compReason && (
                <Chip
                  label={`Perk: ${compReason}`}
                  size="small"
                  sx={{ bgcolor: 'rgba(124,179,66,0.18)', color: '#c8ff9e' }}
                />
              )}
            </Stack>
          </Box>
        </Stack>
      </Paper>

      {/* Membership details */}
      <Paper sx={{
        p: { xs: 2, md: 3 },
        mb: 4,
        background: 'linear-gradient(135deg, rgba(124,179,66,0.25), rgba(0,0,0,0.35))',
        borderRadius: 4,
        border: '1px solid rgba(124,179,66,0.4)',
        color: '#e8f5e9'
      }}>
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Your Membership Snapshot
              </Typography>
              <Typography variant="body2" sx={{ color: '#d7ffd9', maxWidth: 520 }}>
                {isExpired
                  ? 'Bring your membership current to keep enjoying premium features and the club community.'
                  : 'You’ve unlocked the full Garden experience. Lean into the perks, connect with growers, and keep experimenting.'}
              </Typography>
            </Box>
            <Stack spacing={1}>
              <Stack direction="row" spacing={1} alignItems="center">
                <BoltIcon sx={{ color: '#ffeb3b' }} />
                <Typography variant="body2" sx={{ color: '#fff' }}>
                  Status: {isExpired ? 'Needs attention' : 'Active'}
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <SpaIcon sx={{ color: '#c5e1a5' }} />
                <Typography variant="body2" sx={{ color: '#e6f7e9' }}>
                  Tier: {membershipLabel}
                </Typography>
              </Stack>
            </Stack>
          </Stack>
          <Divider sx={{ borderColor: 'rgba(255,255,255,0.15)' }} />
          <Grid container spacing={{ xs: 1.5, sm: 2 }}>
            {membershipBenefits.map((benefit, idx) => (
              <Grid item xs={12} sm={6} md={4} key={idx}>
                <Stack
                  spacing={1}
                  sx={{
                    p: { xs: 1.5, sm: 2 },
                    borderRadius: 3,
                    bgcolor: 'rgba(0,0,0,0.35)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    height: '100%'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {benefit.icon}
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#fff' }}>
                      {benefit.title}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: '#d0ffd6' }}>
                    {benefit.description}
                  </Typography>
                </Stack>
              </Grid>
            ))}
          </Grid>
        </Stack>
      </Paper>

      {user && (
        <Paper sx={{
          p: { xs: 2, md: 3 },
          mb: 4,
          background: 'linear-gradient(135deg, rgba(0,0,0,0.45), rgba(124,179,66,0.2))',
          borderRadius: 4,
          border: '1px solid rgba(124,179,66,0.35)',
          color: '#e8f5e9'
        }}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={3}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', md: 'center' }}
          >
            <Box>
              <Typography variant="subtitle2" sx={{ textTransform: 'uppercase', letterSpacing: 1, color: '#c8ff9e' }}>
                Scan Credits
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'baseline', gap: 1 }}>
                {creditsLoading ? <CircularProgress size={28} sx={{ color: '#c8ff9e' }} /> : (creditsRemaining ?? '--')}
                <Typography component="span" variant="body2" sx={{ color: '#cceabb' }}>
                  remaining
                </Typography>
              </Typography>
              <Typography variant="body2" sx={{ color: '#d0ffd6', maxWidth: 480 }}>
                {membershipActive
                  ? `Membership bundle${monthlyBundle ? `: ${monthlyBundle} scans refill automatically each month.` : ' active — refills automatically each month.'}`
                  : 'Starter bundles last 3 days. Grab a Garden membership or a top-up pack to extend your access.'}
              </Typography>
              {!membershipActive && accessExpiresLabel && (
                <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#ffcc80' }}>
                  Starter access expires: {accessExpiresLabel}
                </Typography>
              )}
              {membershipActive && monthlyBundle && (
                <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#b2fab4' }}>
                  Monthly bundle size: {monthlyBundle} scans
                </Typography>
              )}
              {!membershipActive && typeof trialDaysRemaining === 'number' && trialDaysRemaining >= 0 && !starterExpired && (
                <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#c8ff9e' }}>
                  Starter access ends in {trialDaysRemaining} day{trialDaysRemaining === 1 ? '' : 's'}.
                </Typography>
              )}
            </Box>
            <Button
              variant="outlined"
              onClick={() => setShowScan(true)}
              sx={{
                borderRadius: 999,
                textTransform: 'none',
                color: '#fff',
                borderColor: 'rgba(200,255,158,0.6)',
                '&:hover': { borderColor: 'rgba(200,255,158,1)', bgcolor: 'rgba(200,255,158,0.1)' }
              }}
            >
              Manage Credits
            </Button>
          </Stack>
          {!membershipActive && starterExpired && (
            <Alert
              severity="error"
              sx={{ mt: 2, bgcolor: 'rgba(244,67,54,0.2)', color: '#fff', '& .MuiAlert-icon': { color: '#ffccbc' } }}
            >
              Starter access has ended. Open the mobile app to redeem a top-up pack or join the Garden membership for unlimited refills.
            </Alert>
          )}
          {!membershipActive && lowCredits && !starterExpired && (
            <Alert
              severity="warning"
              sx={{ mt: 2, bgcolor: 'rgba(255,193,7,0.18)', color: '#fff', '& .MuiAlert-icon': { color: '#ffe082' } }}
            >
              Only {creditsRemaining} scan{creditsRemaining === 1 ? '' : 's'} left. Membership unlocks monthly bundles, or grab a quick top-up pack in the mobile app.
            </Alert>
          )}
        </Paper>
      )}

      {/* Feature Tiles */}
      <Grid container spacing={{ xs: 1.5, md: 3 }}>
        {tiles.map((tile) => (
          <Grid
            item
            xs={6}
            sm={4}
            md={3}
            key={tile.nav}
            sx={{
              display: 'flex'
            }}
          >
            <Paper
              onClick={() => handleFeatureClick(tile.title, tile.nav)}
              sx={{
                flex: 1,
                p: { xs: 2.25, sm: 3, md: 4 },
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
                width: { xs: 60, sm: 72, md: 80 },
                height: { xs: 60, sm: 72, md: 80 },
                margin: '0 auto 16px auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: tile.color,
                borderRadius: '50%',
                '& svg': { fontSize: { xs: 28, sm: 36, md: 40 }, color: '#fff' }
              }}>
                {tile.icon}
              </Box>
              <Typography
                variant="subtitle1"
                sx={{ color: '#fff', fontWeight: 700, fontSize: { xs: '0.95rem', sm: '1rem', md: '1.15rem' } }}
              >
                {tile.title}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

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
