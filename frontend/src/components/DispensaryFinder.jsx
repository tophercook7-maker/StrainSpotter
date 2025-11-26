import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Box, Typography, Stack, Paper, Button, CircularProgress,
  Card, CardContent, Chip, IconButton, Slider, Alert, CardActionArea
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import StoreIcon from '@mui/icons-material/Store';
import DirectionsIcon from '@mui/icons-material/Directions';
import PhoneIcon from '@mui/icons-material/Phone';
import LanguageIcon from '@mui/icons-material/Language';
import StarIcon from '@mui/icons-material/Star';
import { BackHeader } from './BackHeader';
import { API_BASE } from '../config';

export default function DispensaryFinder({ onBack, strainSlug }) {
  const [dispensaries, setDispensaries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [radius, setRadius] = useState(10);
  const [locationStatus, setLocationStatus] = useState('idle');
  const initialRadiusRef = useRef(10);

  const searchDispensaries = useCallback(async (lat, lng, searchRadius) => {
    setLoading(true);
    setError(null);
    try {
      let url = `${API_BASE}/api/dispensaries-live?lat=${lat}&lng=${lng}&radius=${searchRadius}&limit=100`;
      if (strainSlug) {
        url += `&strain=${strainSlug}`;
      }

      console.log('[DispensaryFinder] Calling API:', url);
      const response = await fetch(url);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[DispensaryFinder] API error:', response.status, errorText);
        console.error('[DispensaryFinder] API URL:', url);
        console.error('[DispensaryFinder] API_BASE:', API_BASE);
        
        let errorMsg = `Search failed: ${response.status}`;
        if (response.status === 404) {
          errorMsg = 'Dispensary search endpoint not found. The backend server may not be running.';
        } else if (response.status === 500) {
          errorMsg = 'Server error during search. This may be a temporary issue - please try again.';
        }
        throw new Error(errorMsg);
      }
      
      const data = await response.json();
      console.log('[DispensaryFinder] API response:', data);
      
      // Backend returns { total, results, sources } format
      let results = [];
      if (Array.isArray(data)) {
        results = data;
      } else if (data && typeof data === 'object') {
        results = data.results || data.dispensaries || [];
      }
      
      console.log('[DispensaryFinder] Found dispensaries:', results.length);
      console.log('[DispensaryFinder] Response structure:', { 
        isArray: Array.isArray(data), 
        hasResults: !!data.results, 
        resultsLength: results.length,
        total: data.total,
        sources: data.sources 
      });
      
      if (!Array.isArray(results) || results.length === 0) {
        console.warn('[DispensaryFinder] No dispensaries found in response');
        const total = data?.total || 0;
        if (total === 0) {
          setError(`No dispensaries found within ${searchRadius} miles. Try increasing the search radius.`);
        } else {
          setError('No dispensaries found. The search may have returned no results for this area.');
        }
        setDispensaries([]);
      } else {
        setError(null);
        setDispensaries(results);
      }
    } catch (err) {
      console.error('[DispensaryFinder] Search failed:', err);
      const errorMsg = err?.message || 'Failed to find dispensaries. Please check your connection and try again.';
      setError(errorMsg);
      setDispensaries([]);
    } finally {
      setLoading(false);
    }
  }, [strainSlug]);

  // Location request function - called by button click
  const requestLocation = useCallback(async () => {
    try {
      setLocationStatus('detecting');
      setError(null);

      console.log('[DispensaryFinder] Requesting location permission...');
      
      let location = null;

      // Try Capacitor Geolocation first (for mobile apps)
      if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Geolocation) {
        try {
          const { Geolocation } = window.Capacitor.Plugins;
          console.log('[DispensaryFinder] Using Capacitor Geolocation plugin...');
          
          // Add manual timeout for Capacitor too
          const position = await Promise.race([
            Geolocation.getCurrentPosition({
              timeout: 15000, // 15 seconds - shorter timeout
              enableHighAccuracy: false,
              maximumAge: 300000, // 5 min cache
            }),
            new Promise((_, reject) => {
              setTimeout(() => reject(new Error('TIMEOUT')), 15000);
            })
          ]);
          
          console.log('[DispensaryFinder] Location obtained via Capacitor:', position);
          location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
        } catch (capacitorErr) {
          console.warn('[DispensaryFinder] Capacitor Geolocation failed, trying browser API:', capacitorErr);
          if (capacitorErr.message === 'TIMEOUT') {
            throw { code: 3, message: 'Location request timed out after 15 seconds' };
          }
          // Fall through to browser geolocation
        }
      }

      // Fallback to browser geolocation API
      if (!location && navigator.geolocation) {
        console.log('[DispensaryFinder] Using browser geolocation API...');
        
        // Add manual timeout to prevent hanging
        const timeoutId = setTimeout(() => {
          console.warn('[DispensaryFinder] Geolocation timeout exceeded (15s)');
        }, 15000);
        
        try {
          const pos = await Promise.race([
            new Promise((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(
                (position) => {
                  clearTimeout(timeoutId);
                  resolve(position);
                }, 
                (error) => {
                  clearTimeout(timeoutId);
                  reject(error);
                }, 
                {
                  enableHighAccuracy: false,
                  timeout: 15000, // 15 seconds - shorter timeout
                  maximumAge: 300000 // Accept cached location up to 5 minutes old
                }
              );
            }),
            new Promise((_, reject) => {
              setTimeout(() => {
                clearTimeout(timeoutId);
                reject(new Error('TIMEOUT'));
              }, 15000);
            })
          ]);

          location = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          };
          console.log('[DispensaryFinder] Location obtained via browser API:', location);
        } catch (geoError) {
          clearTimeout(timeoutId);
          if (geoError.message === 'TIMEOUT') {
            throw { code: 3, message: 'Location request timed out after 15 seconds' };
          }
          throw geoError;
        }
      }

      if (!location) {
        setLocationStatus('unsupported');
        setError('Geolocation is not supported. Please search manually.');
        return;
      }

      setUserLocation(location);
      setLocationStatus('success');
      setError(null);
      // Automatically search when location is obtained
      await searchDispensaries(location.lat, location.lng, initialRadiusRef.current);
    } catch (err) {
      console.error('[DispensaryFinder] Geolocation error', err);

      if (err.code === 1) {
        setLocationStatus('denied');
        setError('Location permission denied. Please enable location access in Settings → StrainSpotter → Location, then tap "Find Dispensaries" below.');
      } else if (err.code === 2) {
        setLocationStatus('unavailable');
        setError('Location is unavailable. Please check that location services are enabled on your device.');
      } else if (err.code === 3) {
        setLocationStatus('timeout');
        setError('Location request timed out. Please tap "Find Dispensaries" to retry.');
      } else {
        setLocationStatus('error');
        setError(`Unable to get your location: ${err.message || 'Unknown error'}. Please tap "Find Dispensaries" to retry.`);
      }
    }
  }, [searchDispensaries]);

  // Auto-request location when component mounts (with timeout protection)
  useEffect(() => {
    if (!userLocation && locationStatus === 'idle') {
      console.log('[DispensaryFinder] Auto-requesting location on mount...');
      // Small delay to ensure component is fully mounted
      const timer = setTimeout(() => {
        requestLocation();
      }, 100);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount - requestLocation is stable

  const handleRadiusChange = (_event, newValue) => {
    setRadius(newValue);
    if (userLocation) {
      searchDispensaries(userLocation.lat, userLocation.lng, newValue);
    }
  };

  const handleSearch = () => {
    if (userLocation) {
      searchDispensaries(userLocation.lat, userLocation.lng, radius);
    }
  };

  const openPlaceOnMaps = (dispensary) => {
    if (dispensary.place_id) {
      window.open(`https://www.google.com/maps/place/?q=place_id:${dispensary.place_id}`, '_blank');
      return;
    }

    const name =
      dispensary.name ||
      dispensary.business_name ||
      dispensary.legal_name ||
      dispensary.title;

    const parts = [];
    if (name) parts.push(name);
    if (dispensary.address) parts.push(dispensary.address);
    if (dispensary.formatted_address) parts.push(dispensary.formatted_address);

    const cityState = [dispensary.city, dispensary.state]
      .filter(Boolean)
      .join(', ')
      .trim();
    if (cityState) parts.push(cityState);

    // Include postal/zip if available
    if (dispensary.postal_code) parts.push(dispensary.postal_code);

    // As a last resort, append coordinates to the textual query
    if (
      (!dispensary.address && !dispensary.city && !dispensary.state) &&
      dispensary.latitude !== undefined &&
      dispensary.longitude !== undefined
    ) {
      parts.push(`${dispensary.latitude}, ${dispensary.longitude}`);
    }

    if (parts.length > 0) {
      const query = encodeURIComponent(parts.join(', '));
      window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
      return;
    }

    if (dispensary.latitude !== undefined && dispensary.longitude !== undefined) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${dispensary.latitude},${dispensary.longitude}`)}`, '_blank');
    }
  };

  const getDirections = (lat, lng) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
  };

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'hidden',
      background: 'none'
    }}>
      {/* Header */}
      <BackHeader title="Dispensary Finder" onBack={onBack} />
      
      {/* Scrollable Content */}
      <Box sx={{
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        px: 2,
        pb: 2,
        pt: 1
      }}>

      {/* Initial State - Show button to request location */}
      {!userLocation && locationStatus !== 'detecting' && locationStatus !== 'success' && !error && (
        <Paper sx={{ 
          p: 4, 
          mb: 2,
          background: 'rgba(255,255,255,0.1)', 
          backdropFilter: 'blur(20px)', 
          border: '1px solid rgba(124, 179, 66, 0.3)', 
          borderRadius: 2,
          textAlign: 'center'
        }}>
          <Stack spacing={3} alignItems="center">
            <LocationOnIcon sx={{ fontSize: 64, color: '#7cb342' }} />
            <Box>
              <Typography variant="h6" sx={{ color: '#fff', mb: 1, fontWeight: 700 }}>
                Find Nearby Dispensaries
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                We need your location to find dispensaries near you
              </Typography>
            </Box>
            <Button
              variant="contained"
              size="large"
              startIcon={<LocationOnIcon />}
              onClick={requestLocation}
              disabled={locationStatus === 'detecting'}
              sx={{
                bgcolor: '#7cb342',
                color: '#fff',
                fontWeight: 700,
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                '&:hover': { bgcolor: '#689f38' },
                '&:disabled': { bgcolor: 'rgba(124, 179, 66, 0.5)' }
              }}
            >
              {locationStatus === 'detecting' ? 'Requesting Location...' : 'Find Dispensaries'}
            </Button>
          </Stack>
        </Paper>
      )}

      {/* Location Status - Detecting */}
      {locationStatus === 'detecting' && !error && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <Stack spacing={2} alignItems="center">
            <CircularProgress sx={{ color: '#7cb342' }} />
            <Typography variant="body2" sx={{ color: '#e0e0e0' }}>
              Getting your location…
            </Typography>
          </Stack>
        </Box>
      )}
      
      {/* Error State */}
      {error && locationStatus !== 'success' && (
        <Paper sx={{ 
          p: 3, 
          mb: 2,
          background: 'rgba(255,255,255,0.1)', 
          backdropFilter: 'blur(20px)', 
          border: '1px solid rgba(124, 179, 66, 0.3)', 
          borderRadius: 2 
        }}>
          <Alert severity="warning" sx={{ mb: 2, bgcolor: 'rgba(255, 193, 7, 0.15)', color: '#fff', border: '1px solid rgba(255, 193, 7, 0.4)' }}>
            {error}
          </Alert>
          <Button
            variant="contained"
            fullWidth
            startIcon={<LocationOnIcon />}
            onClick={() => {
              setError(null);
              setUserLocation(null);
              setDispensaries([]);
              requestLocation();
            }}
            disabled={locationStatus === 'detecting'}
            sx={{
              bgcolor: '#7cb342',
              '&:hover': { bgcolor: '#689f38' },
              '&:disabled': { bgcolor: 'rgba(124, 179, 66, 0.5)' }
            }}
          >
            {locationStatus === 'detecting' ? 'Requesting...' : 'Find Dispensaries'}
          </Button>
        </Paper>
      )}

      {/* Search Controls - Only show if location is found */}
      {userLocation && locationStatus === 'success' && (
        <Paper sx={{ 
          p: 2, 
          mb: 2, 
          background: 'rgba(255,255,255,0.1)', 
          backdropFilter: 'blur(20px)', 
          border: '1px solid rgba(124, 179, 66, 0.3)', 
          borderRadius: 2 
        }}>
          <Stack spacing={2}>
            <Box>
              <Typography variant="body2" sx={{ color: '#fff', mb: 1 }}>
                Search Radius: {radius} miles
              </Typography>
              <Slider
                value={radius}
                onChange={handleRadiusChange}
                min={1}
                max={100}
                step={1}
                marks={[
                  { value: 1, label: '1mi' },
                  { value: 25, label: '25mi' },
                  { value: 50, label: '50mi' },
                  { value: 100, label: '100mi' }
                ]}
                sx={{
                  color: '#7cb342',
                  '& .MuiSlider-markLabel': { color: '#fff', fontSize: '0.75rem' }
                }}
              />
            </Box>
            <Button
              variant="contained"
              onClick={handleSearch}
              disabled={loading}
              sx={{
                bgcolor: '#7cb342',
                '&:hover': { bgcolor: '#689f38' }
              }}
            >
              {loading ? 'Searching...' : 'Update Search'}
            </Button>
          </Stack>
        </Paper>
      )}

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
      {!loading && dispensaries.length === 0 && (
        <Paper sx={{ 
          p: 4, 
          textAlign: 'center', 
          background: 'rgba(255,255,255,0.1)', 
          backdropFilter: 'blur(20px)', 
          border: '1px solid rgba(124, 179, 66, 0.3)', 
          borderRadius: 2 
        }}>
          <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
            No dispensaries found
          </Typography>
          <Typography variant="body2" sx={{ color: '#e0e0e0' }}>
            Try increasing the search radius or check back later.
          </Typography>
        </Paper>
      )}

      {!loading && dispensaries.length > 0 && (
        <Box>
          <Typography variant="body2" sx={{ color: '#e0e0e0', mb: 2 }}>
            Found {dispensaries.length} dispensaries within {radius} miles
          </Typography>
          <Stack spacing={2}>
            {dispensaries.map((dispensary) => (
              <Card key={dispensary.id} sx={{ 
                background: 'rgba(255,255,255,0.1)', 
                backdropFilter: 'blur(20px)', 
                border: '1px solid rgba(124, 179, 66, 0.3)', 
                borderRadius: 2 
              }}>
                <CardActionArea onClick={() => openPlaceOnMaps(dispensary)}>
                  <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Box flex={1}>
                      <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                        <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600 }}>
                          {dispensary.name}
                        </Typography>
                        {dispensary.verified && (
                          <Chip label="Verified" size="small" sx={{ bgcolor: '#7cb342', color: '#fff', fontSize: '0.7rem', height: 20 }} />
                        )}
                        <Chip 
                          label={dispensary.source} 
                          size="small" 
                          sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: '0.65rem', height: 18 }} 
                        />
                      </Stack>
                      
                      <Stack spacing={0.5}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <LocationOnIcon sx={{ fontSize: 16, color: '#7cb342' }} />
                          <Typography variant="body2" sx={{ color: '#e0e0e0' }}>
                            {dispensary.address || `${dispensary.city}, ${dispensary.state}`}
                          </Typography>
                        </Stack>
                        
                        {dispensary.distance !== undefined && (
                          <Typography variant="body2" sx={{ color: '#7cb342', fontWeight: 600 }}>
                            📍 {dispensary.distance.toFixed(1)} miles away
                          </Typography>
                        )}
                        
                        {dispensary.rating > 0 && (
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            <StarIcon sx={{ fontSize: 16, color: '#ffd600' }} />
                            <Typography variant="body2" sx={{ color: '#fff' }}>
                              {dispensary.rating} ({dispensary.review_count} reviews)
                            </Typography>
                          </Stack>
                        )}
                        
                        {dispensary.open_now !== undefined && (
                          <Chip 
                            label={dispensary.open_now ? 'Open Now' : 'Closed'} 
                            size="small" 
                            sx={{ 
                              bgcolor: dispensary.open_now ? 'rgba(76, 175, 80, 0.3)' : 'rgba(244, 67, 54, 0.3)', 
                              color: '#fff', 
                              fontSize: '0.75rem',
                              width: 'fit-content'
                            }} 
                          />
                        )}
                      </Stack>
                    </Box>
                    
                    <Stack spacing={1}>
                      {dispensary.latitude && dispensary.longitude && (
                        <IconButton
                          size="small"
                            onClick={(event) => {
                              event.stopPropagation();
                              getDirections(dispensary.latitude, dispensary.longitude);
                            }}
                          sx={{ color: '#7cb342' }}
                          title="Get Directions"
                        >
                          <DirectionsIcon />
                        </IconButton>
                      )}
                      {dispensary.phone && (
                        <IconButton
                          size="small"
                          component="a"
                          href={`tel:${dispensary.phone}`}
                            onClick={(event) => event.stopPropagation()}
                          sx={{ color: '#7cb342' }}
                          title="Call"
                        >
                          <PhoneIcon />
                        </IconButton>
                      )}
                      {dispensary.website && (
                        <IconButton
                          size="small"
                          component="a"
                          href={dispensary.website}
                          target="_blank"
                            onClick={(event) => event.stopPropagation()}
                          sx={{ color: '#7cb342' }}
                          title="Visit Website"
                        >
                          <LanguageIcon />
                        </IconButton>
                      )}
                    </Stack>
                  </Stack>
                  
                  {dispensary.description && (
                    <Typography variant="body2" sx={{ color: '#e0e0e0', mt: 1 }}>
                      {dispensary.description}
                    </Typography>
                  )}
                  </CardContent>
                </CardActionArea>
              </Card>
            ))}
          </Stack>
        </Box>
      )}
      </Box>
    </Box>
  );
}
