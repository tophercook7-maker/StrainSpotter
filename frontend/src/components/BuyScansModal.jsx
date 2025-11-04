import { useState, useEffect } from 'react';
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

/**
 * Buy Scans Modal
 * Allows users to purchase credit top-ups or upgrade membership
 */
export default function BuyScansModal({ open, onClose, currentTier = 'free', creditsRemaining = 0 }) {
  const [packages, setPackages] = useState([]);
  const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (open) {
      fetchPackages();
    }
  }, [open]);

  const fetchPackages = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/credits/packages`);
      const data = await response.json();
      
      if (data.success) {
        setPackages(data.packages);
        setTiers(data.tiers);
      }
    } catch (err) {
      console.error('Failed to fetch packages:', err);
      setError('Failed to load packages');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchasePackage = async (packageId) => {
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
      setError('Payment integration coming soon! Please contact support to purchase credits.');
      
      // const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/credits/purchase`, {
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
      setError('Membership upgrades coming soon! Please contact support to upgrade.');
      
    } catch (err) {
      console.error('Upgrade error:', err);
      setError('Upgrade failed. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

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
                Current Plan: <strong>{currentTier.toUpperCase()}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Scans Remaining: <strong>{creditsRemaining}</strong>
              </Typography>
            </Box>

            {/* Membership Tiers */}
            {currentTier === 'free' && (
              <>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <StarIcon sx={{ color: '#FFD700' }} />
                  Upgrade Membership
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 4 }}>
                  {tiers.filter(t => t.id !== 'free').map((tier) => (
                    <Card 
                      key={tier.id}
                      sx={{
                        background: 'linear-gradient(135deg, rgba(124, 179, 66, 0.1) 0%, rgba(156, 204, 101, 0.1) 100%)',
                        border: '1px solid rgba(124, 179, 66, 0.3)',
                        position: 'relative',
                        overflow: 'visible'
                      }}
                    >
                      {tier.id === 'member' && (
                        <Chip 
                          label="BEST VALUE" 
                          size="small" 
                          color="success"
                          sx={{ 
                            position: 'absolute', 
                            top: -10, 
                            right: 10,
                            fontWeight: 700
                          }}
                        />
                      )}
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {tier.name}
                        </Typography>
                        <Typography variant="h4" color="primary" gutterBottom>
                          ${tier.price}
                          <Typography component="span" variant="body2" color="text.secondary">
                            /month
                          </Typography>
                        </Typography>
                        <Typography variant="body1" color="text.secondary" gutterBottom>
                          {tier.scans} scans/month
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {tier.description}
                        </Typography>
                      </CardContent>
                      <CardActions>
                        <Button 
                          fullWidth 
                          variant="contained" 
                          color="primary"
                          disabled={purchasing}
                          onClick={() => handleUpgradeTier(tier.id)}
                        >
                          Upgrade to {tier.name}
                        </Button>
                      </CardActions>
                    </Card>
                  ))}
                </Box>
              </>
            )}

            {/* Credit Packages */}
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <OfferIcon sx={{ color: '#7CB342' }} />
              Buy Credit Packs
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              {packages.map((pkg) => (
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
                    <Typography variant="h5" color="primary" gutterBottom>
                      ${pkg.price.toFixed(2)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      ${(pkg.perScanCost * 100).toFixed(1)}¢ per scan
                    </Typography>
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

