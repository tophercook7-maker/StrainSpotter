import React, { useEffect, useState } from 'react';
import { API_BASE } from '../config';
import { Card, CardContent, Typography, Grid, CircularProgress, Alert } from '@mui/material';

export default function Dispensaries() {
  const [dispensaries, setDispensaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/dispensaries`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to load dispensaries');
        return res.json();
      })
      .then(setDispensaries)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <CircularProgress sx={{ m: 4 }} />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <div>
      <Typography variant="h4" gutterBottom>Dispensaries Near You</Typography>
      <Grid container spacing={2}>
        {dispensaries.map(d => (
          <Grid item xs={12} sm={6} md={4} key={d.id}>
            <Card>
              <CardContent>
                <Typography variant="h6">{d.name}</Typography>
                <Typography variant="body2">{d.address}</Typography>
                <Typography variant="body2">{d.city}, {d.state}</Typography>
                <Typography variant="body2">Phone: {d.phone || 'N/A'}</Typography>
                <Typography variant="body2">{d.description}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </div>
  );
}
