import { useNavigate } from "react-router-dom";
import CannabisLeafIcon from "./CannabisLeafIcon";
import React, { useEffect, useState } from 'react';
import { API_BASE } from '../config';
import { Card, CardContent, Typography, Grid, CircularProgress, Alert, Button, Stack, Container, Box } from '@mui/material';

export default function Seeds({ onBack }) {
  const navigate = useNavigate();
  const [seeds, setSeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fallbackSeeds = [
      { id: 'ilgm', name: 'I Love Growing Marijuana (ILGM)', breeder: 'ILGM', type: 'seed bank', description: 'Premium cannabis seeds with germination guarantee. Feminized, autoflower, and regular seeds available.', url: 'https://ilgm.com' },
      { id: 'seedsman', name: 'Seedsman', breeder: 'Seedsman', type: 'seed bank', description: 'One of the oldest and most trusted online seed banks. Huge selection from top breeders worldwide.', url: 'https://www.seedsman.com' },
      { id: 'crop-king', name: 'Crop King Seeds', breeder: 'Crop King', type: 'seed bank', description: 'Canadian seed bank with fast shipping to US. Great selection of feminized and autoflower strains.', url: 'https://www.cropkingseeds.com' },
      { id: 'msnl', name: 'Marijuana Seeds NL', breeder: 'MSNL', type: 'seed bank', description: 'Established seed bank with stealth shipping worldwide. Competitive prices and frequent sales.', url: 'https://www.msnl.com' },
      { id: 'growers-choice', name: 'Growers Choice Seeds', breeder: 'Growers Choice', type: 'seed bank', description: 'US-based seed company with 90% germination guarantee. Fast domestic shipping.', url: 'https://growerschoiceseeds.com' },
      { id: 'homegrown', name: 'Homegrown Cannabis Co.', breeder: 'Homegrown', type: 'seed bank', description: 'Premium genetics with expert growing advice. Free seeds with every order.', url: 'https://homegrowncannabisco.com' }
    ];
    fetch(`${API_BASE}/api/seeds`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to load seeds');
        return res.json();
      })
      .then(data => {
        // Merge API and fallback, deduplicate by id
        const allSeeds = [...data, ...fallbackSeeds].filter((seed, idx, arr) =>
          arr.findIndex(s => s.id === seed.id) === idx
        );
        setSeeds(allSeeds);
      })
      .catch(e => {
        console.error('[Seeds] Error:', e);
        setSeeds(fallbackSeeds);
        setError(null);
      })
      .finally(() => setLoading(false));
  }, []);


  // Show placeholder only if truly empty
  const showPlaceholder = !seeds || seeds.length === 0;

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
        <button
          style={{
            position: "absolute",
            top: 16,
            left: 16,
            zIndex: 100,
            background: "rgba(34, 139, 34, 0.25)",
            border: "1px solid #228B22",
            borderRadius: 12,
            boxShadow: "0 2px 12px rgba(34,139,34,0.15)",
            backdropFilter: "blur(8px)",
            color: "#228B22",
            padding: "8px 16px",
            display: "flex",
            alignItems: "center",
            fontWeight: 600,
            fontSize: 18,
          }}
          onClick={() => navigate("/")}
        >
          <CannabisLeafIcon style={{ marginRight: 8, height: 24 }} />
          Home
        </button>
      {onBack && (
        <Button onClick={onBack} size="small" variant="contained" sx={{ bgcolor: '#7CB342', color: 'white', textTransform: 'none', fontWeight: 700, borderRadius: 999, mb: 2, '&:hover': { bgcolor: '#689f38' } }}>← Back to Garden</Button>
      )}
      <Typography variant="h4" gutterBottom sx={{ color: 'white' }}>Seeds & Genetics</Typography>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

  {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {!loading && !error && showPlaceholder && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Our seed catalog is being populated. In the meantime, browse strains to research genetics or check back soon for sellers and breeders.
        </Alert>
      )}

      {!loading && !error && !showPlaceholder && (
        <Grid container spacing={2}>
          {seeds.map(seed => (
            <Grid item size={{ xs: 12, sm: 6, md: 4 }} key={seed.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{seed.name}</Typography>
                  <Typography variant="body2">{seed.breeder}</Typography>
                  <Typography variant="body2">Type: {seed.type}</Typography>
                  <Typography variant="body2">THC: {seed.thc || 'N/A'}%</Typography>
                  <Typography variant="body2">CBD: {seed.cbd || 'N/A'}%</Typography>
                  {seed.description && (
                    <Typography variant="body2" sx={{ mt: 1 }}>{seed.description}</Typography>
                  )}
                  {seed.url && (
                    <Stack direction="row" sx={{ mt: 1 }}>
                      <Button
                        size="small"
                        variant="contained"
                        color="primary"
                        href={seed.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View Seller
                      </Button>
                    </Stack>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}
