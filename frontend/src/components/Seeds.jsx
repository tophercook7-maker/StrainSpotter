import React, { useEffect, useState } from 'react';
import { API_BASE } from '../config';
import { Card, CardContent, Typography, Grid, CircularProgress, Alert } from '@mui/material';

export default function Seeds() {
  const [seeds, setSeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/seeds`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to load seeds');
        return res.json();
      })
      .then(setSeeds)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <CircularProgress sx={{ m: 4 }} />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <div>
      <Typography variant="h4" gutterBottom>Seeds & Genetics</Typography>
      <Grid container spacing={2}>
        {seeds.map(seed => (
          <Grid item xs={12} sm={6} md={4} key={seed.id}>
            <Card>
              <CardContent>
                <Typography variant="h6">{seed.name}</Typography>
                <Typography variant="body2">{seed.breeder}</Typography>
                <Typography variant="body2">Type: {seed.type}</Typography>
                <Typography variant="body2">THC: {seed.thc || 'N/A'}%</Typography>
                <Typography variant="body2">CBD: {seed.cbd || 'N/A'}%</Typography>
                <Typography variant="body2">{seed.description}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </div>
  );
}
