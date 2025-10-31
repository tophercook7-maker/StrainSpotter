import { useState, useEffect } from 'react';
import {
  Box, Typography, Stack, Paper, Button, TextField, CircularProgress,
  Card, CardContent, Chip, IconButton, Slider, FormControl, InputLabel,
  Select, MenuItem, Alert
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import StoreIcon from '@mui/icons-material/Store';
import DirectionsIcon from '@mui/icons-material/Directions';
import PhoneIcon from '@mui/icons-material/Phone';
import LanguageIcon from '@mui/icons-material/Language';
import StarIcon from '@mui/icons-material/Star';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5181';

export default function DispensaryFinder({ onBack, strainSlug }) {
  const [dispensaries, setDispensaries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [radius, setRadius] = useState(10);
  const [locationStatus, setLocationStatus] = useState('detecting');

  useEffect(() => {
    // Get user's location
    if (navigator.geolocation) {
      setLocationStatus('detecting');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
          setLocationStatus('success');
          searchDispensaries(location.lat, location.lng, radius);
        },
        (error) => {
          console.error('Location access denied:', error);
          setLocationStatus('denied');
          // Fallback to San Francisco
          const fallback = { lat: 37.7749, lng: -122.4194 };
          setUserLocation(fallback);
          searchDispensaries(fallback.lat, fallback.lng, radius);
        }
      );
    } else {
      setLocationStatus('unsupported');
      setError('Geolocation is not supported by your browser');
    }
  }, []);

  const searchDispensaries = async (lat, lng, searchRadius) => {
    setLoading(true);
    setError(null);
    try {
      let url = `${API_BASE}/api/dispensaries-live?lat=${lat}&lng=${lng}&radius=${searchRadius}`;
      if (strainSlug) {
        url += `&strain=${strainSlug}`;
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error('Search failed');
      
      const data = await response.json();
      setDispensaries(data.results || []);
    } catch (err) {
      console.error('Dispensary search failed:', err);
      setError('Failed to find dispensaries. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRadiusChange = (event, newValue) => {
    setRadius(newValue);
  };

  const handleSearch = () => {
    if (userLocation) {
      searchDispensaries(userLocation.lat, userLocation.lng, radius);
    }
  };

  const getDirections = (lat, lng) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
  };

  return (
    <Box sx={{ minHeight: '100vh', p: 2, background: 'none' }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <StoreIcon sx={{ fontSize: 32, color: '#7cb342' }} />
          <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700 }}>
            Dispensary Finder
          </Typography>
        </Stack>
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
              '&:hover': { 
                borderColor: 'rgba(124, 179, 66, 1)', 
                bgcolor: 'rgba(124, 179, 66, 0.1)' 
              } 
            }}
          >
            Back
          </Button>
        )}
      </Stack>

      {/* Location Status */}
      {locationStatus === 'detecting' && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Detecting your location...
        </Alert>
      )}
      {locationStatus === 'denied' && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Location access denied. Showing results for San Francisco, CA.
        </Alert>
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
              max={50}
              step={1}
              marks={[
                { value: 1, label: '1mi' },
                { value: 10, label: '10mi' },
                { value: 25, label: '25mi' },
                { value: 50, label: '50mi' }
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
                          onClick={() => getDirections(dispensary.latitude, dispensary.longitude)}
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
              </Card>
            ))}
          </Stack>
        </Box>
      )}
    </Box>
  );
}

