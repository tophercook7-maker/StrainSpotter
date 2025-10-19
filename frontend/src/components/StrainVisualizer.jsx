import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Grid,
  Typography,
  Chip,
  CircularProgress,
  useTheme
} from '@mui/material';
import { Radar } from 'react-chartjs-2';

const StrainVisualizer = ({ strain }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [similar, setSimilar] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    if (strain) {
      Promise.all([
        fetch(`/api/strains/${strain.slug}/similar`).then(r => r.json()),
        fetch(`/api/analytics/effectiveness/${strain.slug}`).then(r => r.json())
      ]).then(([similarData, analyticsData]) => {
        setSimilar(similarData.similar);
        setAnalytics(analyticsData);
        setLoading(false);
      });
    }
  }, [strain]);

  if (!strain || loading) {
    return <CircularProgress />;
  }

  const radarData = {
    labels: ['THC', 'CBD', 'Euphoria', 'Relaxation', 'Energy', 'Creativity'],
    datasets: [{
      label: strain.name,
      data: [
        strain.thc || 0,
        strain.cbd || 0,
        strain.effects?.includes('euphoric') ? 1 : 0,
        strain.effects?.includes('relaxed') ? 1 : 0,
        strain.effects?.includes('energetic') ? 1 : 0,
        strain.effects?.includes('creative') ? 1 : 0
      ],
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      borderColor: 'rgba(75, 192, 192, 1)',
      borderWidth: 1
    }]
  };

  return (
    <Box sx={{ p: 2 }}>
      <Card sx={{ mb: 3, p: 2 }}>
        <Typography variant="h4" gutterBottom>
          {strain.name}
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Box sx={{ height: 300 }}>
              <Radar data={radarData} options={{
                scales: {
                  r: {
                    beginAtZero: true,
                    max: 1
                  }
                }
              }} />
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Effects
            </Typography>
            <Box sx={{ mb: 2 }}>
              {strain.effects?.map(effect => (
                <Chip
                  key={effect}
                  label={effect}
                  sx={{ m: 0.5 }}
                  color="primary"
                  variant="outlined"
                />
              ))}
            </Box>

            <Typography variant="h6" gutterBottom>
              Flavors
            </Typography>
            <Box sx={{ mb: 2 }}>
              {strain.flavors?.map(flavor => (
                <Chip
                  key={flavor}
                  label={flavor}
                  sx={{ m: 0.5 }}
                  color="secondary"
                  variant="outlined"
                />
              ))}
            </Box>

            {strain.lineage && (
              <>
                <Typography variant="h6" gutterBottom>
                  Lineage
                </Typography>
                <Box sx={{ mb: 2 }}>
                  {strain.lineage.map(parent => (
                    <Chip
                      key={parent}
                      label={parent}
                      sx={{ m: 0.5 }}
                      color="success"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </>
            )}
          </Grid>
        </Grid>
      </Card>

      {similar.length > 0 && (
        <Box>
          <Typography variant="h5" gutterBottom>
            Similar Strains
          </Typography>
          <Grid container spacing={2}>
            {similar.map(s => (
              <Grid item xs={12} sm={6} md={4} key={s.slug}>
                <Card sx={{ p: 2 }}>
                  <Typography variant="h6">{s.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Similarity: {Math.round(s.similarity * 100)}%
                  </Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {analytics && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h5" gutterBottom>
            Effectiveness Statistics
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Card sx={{ p: 2 }}>
                <Typography variant="h6">User Rating</Typography>
                <Typography variant="h3">
                  {analytics.stats[0]?.effectiveness.toFixed(1)}/5.0
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Based on {analytics.stats[0]?.users} users
                </Typography>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}
    </Box>
  );
};

export default StrainVisualizer;