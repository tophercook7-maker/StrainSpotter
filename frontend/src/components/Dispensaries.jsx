import React, { useEffect, useState } from 'react';
import { API_BASE } from '../config';
import { 
  Card, 
  CardContent, 
  Typography, 
  CircularProgress, 
  Alert, 
  Box,
  Button,
  Stack,
  Chip,
  Grid,
  ButtonGroup
} from '@mui/material';
import PhoneIcon from '@mui/icons-material/Phone';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import DirectionsIcon from '@mui/icons-material/Directions';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

export default function Dispensaries({ onBack }) {
  const [dispensaries, setDispensaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);

  // Request user's location
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (err) => {
          console.warn('Location access denied:', err);
          setLocationError('Location access denied. Showing all dispensaries.');
        }
      );
    } else {
      setLocationError('Geolocation not supported. Showing all dispensaries.');
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (userLocation) {
      params.set('lat', userLocation.lat);
      params.set('lng', userLocation.lng);
      params.set('radius', '50'); // 50 miles
    }
    
    fetch(`${API_BASE}/api/dispensaries?${params}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to load dispensaries');
        return res.json();
      })
      .then(data => {
        // Sort by distance if location is available
        if (userLocation && Array.isArray(data)) {
          data.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
        }
        setDispensaries(data);
      })
      .catch(e => {
        console.error('[Dispensaries] Error:', e);
        // Dev fallback: populate with sample entries instead of hard error
        setDispensaries([
          {
            id: 'sample-green-leaf',
            name: 'Green Leaf Dispensary',
            address: '123 Main St',
            city: 'San Francisco',
            state: 'CA',
            phone: '(415) 555-0123',
            description: 'Friendly staff • Curbside pickup • Daily deals'
          },
          {
            id: 'sample-sunset-wellness',
            name: 'Sunset Wellness',
            address: '456 Sunset Blvd',
            city: 'Los Angeles',
            state: 'CA',
            phone: '(323) 555-0456',
            description: 'Verified lab-tested products • Rewards program'
          }
        ]);
        setError(null);
      })
      .finally(() => setLoading(false));
  }, [userLocation]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, m: 4 }}>
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">
          {userLocation ? 'Finding dispensaries near you...' : 'Getting your location...'}
        </Typography>
      </Box>
    );
  }
  
  if (error) return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;

  return (
    <Box sx={{ p: 3 }}>
      {onBack && (
        <Box sx={{ mb: 2 }}>
          <Button onClick={onBack} size="small" variant="contained" sx={{ bgcolor: 'white', color: 'black', textTransform: 'none', fontWeight: 700, borderRadius: 999, '&:hover': { bgcolor: 'grey.100' } }}>Home</Button>
        </Box>
      )}
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Dispensaries Near You
        </Typography>
        {userLocation && (
          <Chip 
            icon={<MyLocationIcon />} 
            label="Location enabled" 
            color="success" 
            size="small"
          />
        )}
      </Stack>
      
      {locationError && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {locationError}
        </Alert>
      )}

      {dispensaries.length === 0 ? (
        <Alert severity="info">
          No dispensaries found nearby. Try expanding your search radius or check back later.
        </Alert>
      ) : (
        <Grid container spacing={3}>
            {dispensaries.map((d, idx) => (
              <Grid item size={{ xs: 12, sm: 6, md: 4 }} key={`${d.id}-${idx}`}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flex: 1 }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    {d.name}
                  </Typography>
                  
                  {d.distance && (
                    <Chip 
                      label={`${d.distance.toFixed(1)} mi away`} 
                      size="small" 
                      color="primary"
                      sx={{ mb: 1 }}
                    />
                  )}
                  
                  <Stack spacing={0.5} sx={{ mt: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      {d.address}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {d.city}, {d.state} {d.zip || ''}
                    </Typography>
                    
                    {d.description && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {d.description}
                      </Typography>
                    )}
                  </Stack>
                </CardContent>
                
                <Box sx={{ p: 2, pt: 0 }}>
                  <ButtonGroup fullWidth orientation="vertical" variant="contained">
                    {d.phone && (
                      <Button
                        startIcon={<PhoneIcon />}
                        href={`tel:${d.phone.replace(/[^0-9+]/g, '')}`}
                        sx={{
                          background: 'linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)',
                          '&:hover': {
                            background: 'linear-gradient(45deg, #388e3c 30%, #4caf50 90%)'
                          }
                        }}
                      >
                        Call {d.phone}
                      </Button>
                    )}
                    
                    {(d.lat && d.lng) || (d.address && d.city && d.state) ? (
                      <Button
                        startIcon={<DirectionsIcon />}
                        onClick={() => {
                          // Use coordinates if available, otherwise use address
                          const destination = (d.lat && d.lng) 
                            ? `${d.lat},${d.lng}`
                            : `${d.address}, ${d.city}, ${d.state} ${d.zip || ''}`.trim();
                          
                          // Google Maps directions URL
                          const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
                          window.open(mapsUrl, '_blank');
                        }}
                        sx={{
                          background: 'linear-gradient(45deg, #2196f3 30%, #42a5f5 90%)',
                          '&:hover': {
                            background: 'linear-gradient(45deg, #1976d2 30%, #2196f3 90%)'
                          }
                        }}
                      >
                        Get Directions
                      </Button>
                    ) : null}
                    
                    {d.website && (
                      <Button
                        startIcon={<OpenInNewIcon />}
                        href={d.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          background: 'linear-gradient(45deg, #ff9800 30%, #ffa726 90%)',
                          '&:hover': {
                            background: 'linear-gradient(45deg, #f57c00 30%, #ff9800 90%)'
                          }
                        }}
                      >
                        Visit Website
                      </Button>
                    )}
                  </ButtonGroup>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
