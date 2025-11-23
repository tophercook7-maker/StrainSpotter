import { useNavigate } from "react-router-dom";
import CannabisLeafIcon from "./CannabisLeafIcon";
import React, { useEffect, useState } from 'react';
import { API_BASE } from '../config';
import { Card, CardContent, Typography, Grid, CircularProgress, Alert, Button, Stack, Container, Box, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

export default function Seeds({ onBack }) {
  const navigate = useNavigate();
  const [seeds, setSeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const fallbackSeeds = [
      { id: 'ilgm', name: 'I Love Growing Marijuana (ILGM)', breeder: 'ILGM', type: 'seed bank', description: 'Premium cannabis seeds with germination guarantee. Feminized, autoflower, and regular seeds available.', url: 'https://ilgm.com' },
      { id: 'seedsman', name: 'Seedsman', breeder: 'Seedsman', type: 'seed bank', description: 'One of the oldest and most trusted online seed banks. Huge selection from top breeders worldwide.', url: 'https://www.seedsman.com' },
      { id: 'crop-king', name: 'Crop King Seeds', breeder: 'Crop King', type: 'seed bank', description: 'Canadian seed bank with fast shipping to US. Great selection of feminized and autoflower strains.', url: 'https://www.cropkingseeds.com' },
      { id: 'msnl', name: 'Marijuana Seeds NL', breeder: 'MSNL', type: 'seed bank', description: 'Established seed bank with stealth shipping worldwide. Competitive prices and frequent sales.', url: 'https://www.msnl.com' },
      { id: 'growers-choice', name: 'Growers Choice Seeds', breeder: 'Growers Choice', type: 'seed bank', description: 'US-based seed company with 90% germination guarantee. Fast domestic shipping.', url: 'https://growerschoiceseeds.com' },
      { id: 'homegrown', name: 'Homegrown Cannabis Co.', breeder: 'Homegrown', type: 'seed bank', description: 'Premium genetics with expert growing advice. Free seeds with every order.', url: 'https://homegrowncannabisco.com' }
    ];
    
    async function fetchVendors() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/api/seeds`);
        if (!res.ok) {
          throw new Error(`Failed to load seeds: ${res.status}`);
        }
        const data = await res.json();
        if (cancelled) return;
        
        // Merge API and fallback, deduplicate by id
        const allSeeds = [...(Array.isArray(data) ? data : []), ...fallbackSeeds].filter((seed, idx, arr) =>
          arr.findIndex(s => s.id === seed.id) === idx
        );
        setSeeds(allSeeds);
      } catch (e) {
        console.error('[Seeds] Error loading vendors:', e);
        if (!cancelled) {
          setError('Unable to load seed vendors right now.');
          setSeeds(fallbackSeeds); // Use fallback on error
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    
    fetchVendors();
    return () => {
      cancelled = true;
    };
  }, []);


  // Show placeholder only if truly empty
  const showPlaceholder = !seeds || seeds.length === 0;

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate("/");
    }
  };

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header (fixed) */}
      <Box
        sx={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          p: 2,
          gap: 1.5,
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          bgcolor: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(10px)',
          zIndex: 1,
        }}
      >
        <IconButton
          edge="start"
          onClick={handleBack}
          sx={{ color: '#fff' }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#fff', flex: 1 }}>
          Seed Vendors
        </Typography>
      </Box>

      {/* Scrollable content */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <Container maxWidth="lg" sx={{ py: 3 }}>
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
              <CircularProgress size={28} />
            </Box>
          )}

          {!loading && error && (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body1" sx={{ color: '#fff', mb: 1 }}>
                Seed vendor search is warming up. Live data isn't available yet, but we'll add it soon.
              </Typography>
              <Button 
                variant="outlined" 
                size="small" 
                onClick={() => window.location.reload()}
                sx={{ mt: 1, color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}
              >
                Retry
              </Button>
            </Box>
          )}

          {!loading && !error && (!seeds || seeds.length === 0) && (
            <Box sx={{ padding: '16px', textAlign: 'center', opacity: 0.7, mt: 4 }}>
              <Typography variant="h6" sx={{ color: '#fff', mb: 1 }}>
                No vendors available
              </Typography>
              <Typography variant="body2" sx={{ color: '#fff' }}>
                Seed vendors will appear here once configured.
              </Typography>
            </Box>
          )}

          {!loading && !error && seeds && seeds.length > 0 && (
            <Grid container spacing={2}>
              {seeds.map(seed => (
                <Grid item xs={12} sm={6} md={4} key={seed.id || seed.name}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                        {seed.name || 'Unknown Vendor'}
                      </Typography>
                      {seed.breeder && (
                        <Typography variant="body2" sx={{ opacity: 0.8, mb: 0.5 }}>
                          {seed.breeder}
                        </Typography>
                      )}
                      {seed.type && (
                        <Typography variant="body2" sx={{ opacity: 0.7, mb: 0.5 }}>
                          Type: {seed.type}
                        </Typography>
                      )}
                      {seed.description && (
                        <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
                          {seed.description}
                        </Typography>
                      )}
                      {seed.url && (
                        <Button
                          size="small"
                          variant="contained"
                          color="primary"
                          href={seed.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ mt: 2 }}
                        >
                          Visit Website
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Container>
      </Box>
    </Box>
  );
}
