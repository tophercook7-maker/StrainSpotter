import { useState, useEffect, useCallback, useRef } from 'react';
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
  const [locationStatus, setLocationStatus] = useState('detecting');
  const initialRadiusRef = useRef(10);

  const searchDispensaries = useCallback(async (lat, lng, searchRadius) => {
    setLoading(true);
    setError(null);
    try {
      let url = `${API_BASE}/api/dispensaries-live?lat=${lat}&lng=${lng}&radius=${searchRadius}&limit=100`;
      if (strainSlug) {
        url += `&strain=${strainSlug}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[DispensaryFinder] API error:', response.status, errorText);
        throw new Error(`Search failed: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('[DispensaryFinder] API response:', data);
      // Handle both formats: { results: [...] } or direct array
      const results = Array.isArray(data) ? data : (data.results || data.dispensaries || []);
      console.log('[DispensaryFinder] Found dispensaries:', results.length);
      setDispensaries(results);
    } catch (err) {
      console.error('Dispensary search failed:', err);
      setError('Failed to find dispensaries. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [strainSlug]);

  useEffect(() => {
    let timeoutId;

    async function requestLocation() {
      if (!navigator.geolocation) {
        setLocationStatus('unsupported');
        setError('Geolocation is not supported by your browser. Please search manually.');
        return;
      }

      try {
        setLocationStatus('detecting');
        setError(null);

        // TIMEOUT FAILSAFE
        timeoutId = setTimeout(() => {
          setLocationStatus('timeout');
          setError('Location request timed out. Please try again.');
        }, 8000);

        const pos = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 7000,
            maximumAge: 0
          });
        });

        clearTimeout(timeoutId);

        const location = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        };
        console.log('[DispensaryFinder] Location obtained:', location);
        setUserLocation(location);
        setLocationStatus('success');
        searchDispensaries(location.lat, location.lng, initialRadiusRef.current);
      } catch (err) {
        clearTimeout(timeoutId);
        console.error('[DispensaryFinder] Geolocation error', err);
        
        if (err.code === 1) {
          setLocationStatus('denied');
          setError('Location access denied. Please enable location services in your device settings.');
        } else {
          setLocationStatus('timeout');
          setError('Unable to get your location. Please try again or enable location services.');
        }
      }
    }

    requestLocation();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [searchDispensaries]);

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

      {/* Location Status */}
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
            onClick={() => {
              setError(null);
              setLocationStatus('detecting');
              setUserLocation(null);
              // Trigger location request again
              const timeoutId = setTimeout(() => {
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(
                    (position) => {
                      const location = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                      };
                      setUserLocation(location);
                      setLocationStatus('success');
                      searchDispensaries(location.lat, location.lng, initialRadiusRef.current);
                    },
                    (err) => {
                      if (err.code === 1) {
                        setLocationStatus('denied');
                        setError('Location access denied. Please enable location services in your device settings.');
                      } else {
                        setLocationStatus('timeout');
                        setError('Unable to get your location. Please try again.');
                      }
                    },
                    {
                      enableHighAccuracy: true,
                      timeout: 7000,
                      maximumAge: 0
                    }
                  );
                }
              }, 100);
            }}
            sx={{
              bgcolor: '#7cb342',
              '&:hover': { bgcolor: '#689f38' }
            }}
          >
            Try Again
          </Button>
        </Paper>
      )}

      {/* Search Controls */}
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
            disabled={!userLocation || loading}
            sx={{
              bgcolor: '#7cb342',
              '&:hover': { bgcolor: '#689f38' }
            }}
          >
            {loading ? 'Searching...' : 'Search Dispensaries'}
          </Button>
        </Stack>
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
