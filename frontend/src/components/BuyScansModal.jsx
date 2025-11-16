import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Chip,
  IconButton,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Close as CloseIcon,
  Bolt as BoltIcon,
  Star as StarIcon,
  LocalOffer as OfferIcon
} from '@mui/icons-material';
import { supabase } from '../supabaseClient';
import { API_BASE } from '../config';
import { logEvent } from '../utils/analyticsClient';

/**
 * Buy Scans Modal
 * Allows users to purchase credit top-ups or upgrade membership
 */
export default function BuyScansModal({ open, onClose, currentTier = 'free', creditsRemaining = 0 }) {
  const [packages, setPackages] = useState([]);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (open) {
      logEvent('credits_modal_opened');
      fetchPackages();
    }
  }, [open]);

  const fetchPackages = async () => {
    setLoading(true);
    setError(null);
    try {
      let token = null;
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        token = session?.access_token || null;
      }
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await fetch(`${API_BASE}/api/credits/packages`, { headers });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Unable to load packages');
      }

      setPackages(Array.isArray(data.packages) ? data.packages : []);
      setRole(data.role || null);
    } catch (err) {
      console.error('Failed to fetch packages:', err);
      setError(err.message || 'Failed to load packages');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchasePackage = async (packageId) => {
    logEvent('credits_cta_clicked', { type: 'top_up', packageId });
    setPurchasing(true);
    setError(null);
    setSuccess(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setError('Please sign in to purchase credits');
        setPurchasing(false);
        return;
      }

      // TODO: Integrate with Stripe payment
      // For now, show a message
      setError('Top-up purchases are coming soon! Contact support and mention the package you want.');
      
      // const response = await fetch(`${API_BASE}/api/credits/purchase`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${session.access_token}`
      //   },
      //   body: JSON.stringify({
      //     package: packageId,
      //     paymentMethodId: 'pm_test_123' // Replace with actual Stripe payment method
      //   })
      // });

      // if (response.ok) {
      //   const data = await response.json();
      //   setSuccess(`Successfully purchased ${data.creditsAdded} scan credits!`);
      //   setTimeout(() => {
      //     onClose();
      //     window.location.reload(); // Refresh to update credit balance
      //   }, 2000);
      // } else {
      //   setError('Purchase failed. Please try again.');
      // }
    } catch (err) {
      console.error('Purchase error:', err);
      setError('Purchase failed. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  const handleUpgradeTier = async (tierId) => {
    logEvent('credits_cta_clicked', { type: 'membership', tierId });
    setPurchasing(true);
    setError(null);
    setSuccess(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setError('Please sign in to upgrade');
        setPurchasing(false);
        return;
      }

      // TODO: Integrate with Stripe subscription
      setError('Membership billing inside the app is coming soon. Contact support to upgrade manually.');
      
    } catch (err) {
      console.error('Upgrade error:', err);
      setError('Upgrade failed. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  const tierAliases = useMemo(() => ({
    premium: 'monthly_member',
    member: 'monthly_member',
    moderator: 'monthly_member'
  }), []);

  const normalizedTier = useMemo(() => {
    const lowered = (currentTier || '').toLowerCase();
    return tierAliases[lowered] || lowered || 'free';
  }, [currentTier, tierAliases]);

  const packageGroups = useMemo(() => {
    return {
      appUnlock: packages.find((pkg) => pkg.type === 'app_purchase'),
      membership: packages.find((pkg) => pkg.type === 'membership'),
      topUps: packages.filter((pkg) => pkg.type === 'top_up')
    };
  }, [packages]);

  const priceLabel = (pkg) => {
    if (!pkg) return '';
    return `$${pkg.effectivePrice.toFixed(2)}`;
  };

  const perScanLabel = (pkg) => {
    if (!pkg?.credits) return '';
    const cost = pkg.effectivePrice / pkg.credits;
    if (cost < 1) return `${(cost * 100).toFixed(1)}¢ per scan`;
    return `$${cost.toFixed(2)} per scan`;
  };

  const renderPriceStack = (pkg, { showRecurringLabel = false } = {}) => (
    <Box>
      <Typography variant="h4" color="primary" gutterBottom>
        {priceLabel(pkg)}
        {showRecurringLabel && (
          <Typography component="span" variant="body2" color="text.secondary">
            /month
          </Typography>
        )}
      </Typography>
      {pkg?.moderatorDiscount && (
        <Typography variant="body2" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
          ${pkg.price.toFixed(2)}
        </Typography>
      )}
    </Box>
  );

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          background: 'linear-gradient(135deg, rgba(18, 18, 18, 0.98) 0%, rgba(30, 30, 30, 0.98) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(124, 179, 66, 0.2)'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: '1px solid rgba(124, 179, 66, 0.2)'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BoltIcon sx={{ color: '#7CB342' }} />
          <Typography variant="h6">Get More Scans</Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ mt: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {success}
              </Alert>
            )}

            {/* Current Status */}
            <Box sx={{ mb: 3, p: 2, background: 'rgba(124, 179, 66, 0.1)', borderRadius: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Current Plan: <strong>{normalizedTier.replace('_', ' ').toUpperCase()}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Scans Remaining: <strong>{creditsRemaining}</strong>
              </Typography>
            </Box>

            {/* Membership Options */}
            {(packageGroups.appUnlock || packageGroups.membership) && (
              <>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <StarIcon sx={{ color: '#FFD700' }} />
                  Membership & Unlocks
                </Typography>
                {role === 'moderator' && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Moderator pricing applied automatically.
                  </Alert>
                )}
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 4 }}>
                  {packageGroups.appUnlock && normalizedTier === 'free' && (
                    <Card
                      key="app_purchase"
                      sx={{
                        background: 'linear-gradient(135deg, rgba(124, 179, 66, 0.12) 0%, rgba(156, 204, 101, 0.08) 100%)',
                        border: '1px solid rgba(124, 179, 66, 0.25)'
                      }}
                    >
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Unlock StrainSpotter
                        </Typography>
                        {renderPriceStack(packageGroups.appUnlock)}
                        <Typography variant="body1" color="text.secondary" gutterBottom>
                          {packageGroups.appUnlock.scans} starter scans (one-time)
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Own the app forever and unlock Groups, Grower tools, and the Garden.
                        </Typography>
                      </CardContent>
                      <CardActions>
                        <Button
                          fullWidth
                          variant="contained"
                          color="primary"
                          disabled={purchasing}
                          onClick={() => handleUpgradeTier('app_purchase')}
                        >
                          Unlock for {priceLabel(packageGroups.appUnlock)}
                        </Button>
                      </CardActions>
                    </Card>
                  )}

                  {packageGroups.membership && (
                    <Card
                      key="monthly_member"
                      sx={{
                        background: 'linear-gradient(135deg, rgba(124, 179, 66, 0.15) 0%, rgba(156, 204, 101, 0.12) 100%)',
                        border: '1px solid rgba(124, 179, 66, 0.35)',
                        position: 'relative'
                      }}
                    >
                      <Chip
                        label="BEST VALUE"
                        size="small"
                        color="success"
                        sx={{ position: 'absolute', top: -10, right: 12, fontWeight: 700 }}
                      />
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Monthly Member
                        </Typography>
                        {renderPriceStack(packageGroups.membership, { showRecurringLabel: true })}
                        <Typography variant="body1" color="text.secondary" gutterBottom>
                          {packageGroups.membership.scansPerMonth || 200} scans/month + community perks
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Includes Groups, Grow Coach, Grower Directory, error reporting, and more.
                        </Typography>
                        {packageGroups.membership.moderatorDiscount && (
                          <Chip
                            label={`${packageGroups.membership.moderatorDiscount.percent}% moderator discount`}
                            size="small"
                            color="success"
                            sx={{ mt: 1 }}
                          />
                        )}
                      </CardContent>
                      <CardActions>
                        <Button
                          fullWidth
                          variant="contained"
                          color="primary"
                          disabled={purchasing || normalizedTier === 'monthly_member'}
                          onClick={() => handleUpgradeTier('monthly_member')}
                        >
                          {normalizedTier === 'monthly_member' ? 'Membership Active' : 'Upgrade to Monthly Member'}
                        </Button>
                      </CardActions>
                    </Card>
                  )}
                </Box>
              </>
            )}

            {/* Credit Packages */}
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <OfferIcon sx={{ color: '#7CB342' }} />
              Buy Credit Packs
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              {packageGroups.topUps.map((pkg) => (
                <Card 
                  key={pkg.id}
                  sx={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(124, 179, 66, 0.2)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      border: '1px solid rgba(124, 179, 66, 0.5)'
                    }
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {pkg.credits} Scans
                    </Typography>
                    {renderPriceStack(pkg)}
                    <Typography variant="body2" color="text.secondary">
                      {perScanLabel(pkg)}
                    </Typography>
                    {pkg.moderatorDiscount && (
                      <Chip
                        label={`${pkg.moderatorDiscount.percent}% moderator discount`}
                        size="small"
                        color="success"
                        sx={{ mt: 1 }}
                      />
                    )}
                  </CardContent>
                  <CardActions>
                    <Button 
                      fullWidth 
                      variant="outlined" 
                      color="primary"
                      disabled={purchasing}
                      onClick={() => handlePurchasePackage(pkg.id)}
                    >
                      Buy Now
                    </Button>
                  </CardActions>
                </Card>
              ))}
            </Box>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ borderTop: '1px solid rgba(124, 179, 66, 0.2)', p: 2 }}>
        <Button onClick={onClose} color="inherit">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

