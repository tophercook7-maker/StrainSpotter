import { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Stack,
  Avatar,
  Button,
  Container
} from '@mui/material';
import { LocationOn, EmojiEvents } from '@mui/icons-material';
import { FUNCTIONS_BASE } from '../config';

export default function GrowerDirectory({ onBack }) {
  const [growers, setGrowers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${FUNCTIONS_BASE}/growers-list`);
        if (res.ok) setGrowers(await res.json());
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        {onBack && (
          <Button onClick={onBack} size="small" variant="contained" sx={{ bgcolor: 'white', color: 'black', textTransform: 'none', fontWeight: 700, borderRadius: 999, '&:hover': { bgcolor: 'grey.100' } }}>Home</Button>
        )}
        <Button 
          variant="contained" 
          color="primary"
          onClick={() => window.location.href = '#/auth'}
          sx={{ textTransform: 'none', fontWeight: 600 }}
        >
          Register as Grower
        </Button>
      </Stack>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>
        Grower Directory
      </Typography>

      {loading ? (
        <Typography>Loading...</Typography>
      ) : growers.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 5 }}>
            <Typography variant="body1" color="text.secondary">
              No growers yet. Be the first to register!
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {growers.map((g) => (
            <Grid item xs={12} sm={6} md={4} key={g.id}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Stack spacing={2}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                        {g.user_id?.substring(0, 2).toUpperCase() || '??'}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6">Grower</Typography>
                        {g.location && (
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <LocationOn fontSize="small" color="action" />
                            <Typography variant="body2" color="text.secondary">
                              {g.location}
                            </Typography>
                          </Stack>
                        )}
                      </Box>
                    </Stack>

                    {g.specialties && g.specialties.length > 0 && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Specialties:
                        </Typography>
                        <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 0.5 }}>
                          {g.specialties.map((s, i) => (
                            <Chip key={i} label={s} size="small" color="success" variant="outlined" />
                          ))}
                        </Stack>
                      </Box>
                    )}

                    {g.reputation != null && (
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <EmojiEvents fontSize="small" color="warning" />
                        <Typography variant="body2">Rep: {g.reputation}</Typography>
                      </Stack>
                    )}

                    {g.badges && g.badges.length > 0 && (
                      <Stack direction="row" spacing={0.5} flexWrap="wrap">
                        {g.badges.map((b, i) => (
                          <Chip key={i} label={b} size="small" color="secondary" />
                        ))}
                      </Stack>
                    )}

                    <Button variant="outlined" size="small">
                      View Profile
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}
