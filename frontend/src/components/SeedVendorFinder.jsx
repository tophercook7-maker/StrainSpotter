import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Stack, Paper, Button, TextField, CircularProgress,
  Card, CardContent, Chip, IconButton, FormControl, InputLabel,
  Select, MenuItem, Alert, Grid
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import StoreIcon from '@mui/icons-material/Store';
import LanguageIcon from '@mui/icons-material/Language';
import StarIcon from '@mui/icons-material/Star';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PaymentIcon from '@mui/icons-material/Payment';
import VerifiedIcon from '@mui/icons-material/Verified';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5181';

export default function SeedVendorFinder({ onBack, strainName, strainSlug }) {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchStrain, setSearchStrain] = useState(strainName || '');
  const [country, setCountry] = useState('all');
  const [showPopular, setShowPopular] = useState(false);

  const searchVendors = useCallback(async (strain) => {
    setLoading(true);
    setError(null);
    setShowPopular(false);
    try {
      let url = `${API_BASE}/api/seeds-live?`;
      if (strain) url += `strain=${encodeURIComponent(strain)}&`;
      if (country !== 'all') url += `country=${country}&`;
      url += `include_google=true`;

      const response = await fetch(url);
      if (!response.ok) throw new Error('Search failed');
      
      const data = await response.json();
      setVendors(data.results || []);
    } catch (err) {
      console.error('Seed vendor search failed:', err);
      setError('Failed to find seed vendors. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [country]);

  const loadPopularVendors = useCallback(async () => {
    setLoading(true);
    setError(null);
    setShowPopular(true);
    try {
      const response = await fetch(`${API_BASE}/api/seeds-live/popular`);
      if (!response.ok) throw new Error('Failed to load popular vendors');
      
      const data = await response.json();
      setVendors(data.results || []);
    } catch (err) {
      console.error('Failed to load popular vendors:', err);
      setError('Failed to load seed vendors. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (strainName || strainSlug) {
      searchVendors(strainSlug || strainName);
    } else {
      loadPopularVendors();
    }
  }, [strainName, strainSlug, searchVendors, loadPopularVendors]);

  const handleSearch = () => {
    if (searchStrain.trim()) {
      searchVendors(searchStrain.trim());
    } else {
      loadPopularVendors();
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', p: 2, background: 'none' }}>
      {/* Header */}
      {onBack && (
        <Button
          size="small"
          variant="outlined"
          onClick={onBack}
          startIcon={<ArrowBackIcon />}
          sx={{
            color: '#fff',
            borderColor: 'rgba(124, 179, 66, 0.6)',
            fontSize: '0.875rem',
            mb: 2,
            '&:hover': {
              borderColor: 'rgba(124, 179, 66, 1)',
              bgcolor: 'rgba(124, 179, 66, 0.1)'
            }
          }}
        >
          Back
        </Button>
      )}
      <Stack direction="row" alignItems="center" spacing={2} mb={2}>
        <StoreIcon sx={{ fontSize: 32, color: '#7cb342' }} />
        <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700 }}>
          Seed Vendor Finder
        </Typography>
      </Stack>

      {/* Search Controls */}
      <Paper sx={{ 
        p: 2, 
        mb: 2, 
        background: 'rgba(255,255,255,0.1)', 
        backdropFilter: 'blur(20px)', 
        border: '1px solid rgba(124, 179, 66, 0.3)', 
        borderRadius: 2 
      }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              size="small"
              label="Strain Name"
              value={searchStrain}
              onChange={(e) => setSearchStrain(e.target.value)}
              placeholder="e.g., Blue Dream, OG Kush"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: '#fff',
                  '& fieldset': { borderColor: 'rgba(124, 179, 66, 0.5)' },
                  '&:hover fieldset': { borderColor: 'rgba(124, 179, 66, 0.7)' },
                  '&.Mui-focused fieldset': { borderColor: '#7cb342' }
                },
                '& .MuiInputLabel-root': { color: '#fff' }
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: '#fff' }}>Country</InputLabel>
              <Select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                label="Country"
                sx={{
                  color: '#fff',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(124, 179, 66, 0.5)' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(124, 179, 66, 0.7)' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#7cb342' }
                }}
              >
                <MenuItem value="all">All Countries</MenuItem>
                <MenuItem value="USA">USA</MenuItem>
                <MenuItem value="Canada">Canada</MenuItem>
                <MenuItem value="Netherlands">Netherlands</MenuItem>
                <MenuItem value="Spain">Spain</MenuItem>
                <MenuItem value="UK">UK</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleSearch}
              disabled={loading}
              sx={{
                bgcolor: '#7cb342',
                '&:hover': { bgcolor: '#689f38' },
                height: '40px'
              }}
            >
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Loading */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: '#7cb342' }} />
        </Box>
      )}

      {/* Results */}
      {!loading && vendors.length === 0 && (
        <Paper sx={{ 
          p: 4, 
          textAlign: 'center', 
          background: 'rgba(255,255,255,0.1)', 
          backdropFilter: 'blur(20px)', 
          border: '1px solid rgba(124, 179, 66, 0.3)', 
          borderRadius: 2 
        }}>
          <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
            No seed vendors found
          </Typography>
          <Typography variant="body2" sx={{ color: '#e0e0e0', mb: 2 }}>
            Try a different strain or view popular seed banks.
          </Typography>
          <Button
            variant="outlined"
            onClick={loadPopularVendors}
            sx={{
              color: '#fff',
              borderColor: 'rgba(124, 179, 66, 0.6)',
              '&:hover': { borderColor: '#7cb342', bgcolor: 'rgba(124, 179, 66, 0.1)' }
            }}
          >
            View Popular Seed Banks
          </Button>
        </Paper>
      )}

      {!loading && vendors.length > 0 && (
        <Box>
          <Typography variant="body2" sx={{ color: '#e0e0e0', mb: 2 }}>
            {showPopular ? 'Popular Seed Banks' : `Found ${vendors.length} seed vendors`}
          </Typography>
          <Grid container spacing={2}>
            {vendors.map((vendor) => (
              <Grid item xs={12} md={6} key={vendor.id}>
                <Card sx={{ 
                  background: 'rgba(255,255,255,0.1)', 
                  backdropFilter: 'blur(20px)', 
                  border: '1px solid rgba(124, 179, 66, 0.3)', 
                  borderRadius: 2,
                  height: '100%'
                }}>
                  <CardContent>
                    <Stack spacing={2}>
                      {/* Header */}
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Box flex={1}>
                          <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                            <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600 }}>
                              {vendor.name}
                            </Typography>
                            {vendor.verified && (
                              <VerifiedIcon sx={{ fontSize: 20, color: '#7cb342' }} />
                            )}
                          </Stack>
                          <Stack direction="row" spacing={1} flexWrap="wrap">
                            <Chip 
                              label={vendor.source} 
                              size="small" 
                              sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: '0.65rem', height: 18 }} 
                            />
                            {vendor.country && (
                              <Chip 
                                label={vendor.country} 
                                size="small" 
                                sx={{ bgcolor: 'rgba(124, 179, 66, 0.3)', color: '#fff', fontSize: '0.65rem', height: 18 }} 
                              />
                            )}
                          </Stack>
                        </Box>
                        {(vendor.website || vendor.product_url) && (
                          <IconButton
                            size="small"
                            component="a"
                            href={vendor.website || vendor.product_url}
                            target="_blank"
                            sx={{ color: '#7cb342' }}
                            title="Visit Website"
                          >
                            <LanguageIcon />
                          </IconButton>
                        )}
                      </Stack>

                      {/* Description */}
                      {vendor.description && (
                        <Typography variant="body2" sx={{ color: '#e0e0e0' }}>
                          {vendor.description}
                        </Typography>
                      )}

                      {/* Price */}
                      {vendor.price && (
                        <Box>
                          <Typography variant="h6" sx={{ color: '#7cb342', fontWeight: 600 }}>
                            ${vendor.price} {vendor.currency || 'USD'}
                          </Typography>
                          {vendor.seed_count && (
                            <Typography variant="caption" sx={{ color: '#e0e0e0' }}>
                              {vendor.seed_count} seeds
                            </Typography>
                          )}
                        </Box>
                      )}

                      {/* Rating */}
                      {vendor.rating > 0 && (
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <StarIcon sx={{ fontSize: 16, color: '#ffd600' }} />
                          <Typography variant="body2" sx={{ color: '#fff' }}>
                            {vendor.rating} {vendor.review_count > 0 && `(${vendor.review_count} reviews)`}
                          </Typography>
                        </Stack>
                      )}

                      {/* Shipping */}
                      {vendor.shipping_regions && vendor.shipping_regions.length > 0 && (
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <LocalShippingIcon sx={{ fontSize: 16, color: '#7cb342' }} />
                          <Typography variant="caption" sx={{ color: '#e0e0e0' }}>
                            Ships to: {vendor.shipping_regions.join(', ')}
                          </Typography>
                        </Stack>
                      )}

                      {/* Payment Methods */}
                      {vendor.payment_methods && vendor.payment_methods.length > 0 && (
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <PaymentIcon sx={{ fontSize: 16, color: '#7cb342' }} />
                          <Typography variant="caption" sx={{ color: '#e0e0e0' }}>
                            {vendor.payment_methods.join(', ')}
                          </Typography>
                        </Stack>
                      )}

                      {/* Stock Status */}
                      {vendor.in_stock !== undefined && (
                        <Chip 
                          label={vendor.in_stock ? 'In Stock' : 'Out of Stock'} 
                          size="small" 
                          sx={{ 
                            bgcolor: vendor.in_stock ? 'rgba(76, 175, 80, 0.3)' : 'rgba(244, 67, 54, 0.3)', 
                            color: '#fff', 
                            fontSize: '0.75rem',
                            width: 'fit-content'
                          }} 
                        />
                      )}

                      {/* Visit Button */}
                      {(vendor.website || vendor.product_url) && (
                        <Button
                          fullWidth
                          variant="contained"
                          component="a"
                          href={vendor.website || vendor.product_url}
                          target="_blank"
                          sx={{
                            bgcolor: '#7cb342',
                            '&:hover': { bgcolor: '#689f38' }
                          }}
                        >
                          Visit Store →
                        </Button>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  );
}
