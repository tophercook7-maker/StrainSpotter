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
import { API_BASE } from '../config';

export default function GrowerDirectory({ onBack, onNavigate }) {
  const [growers, setGrowers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/growers`);
        if (res.ok) {
          const payload = await res.json();
          const list = Array.isArray(payload)
            ? payload
            : Array.isArray(payload.growers)
              ? payload.growers
              : [];
          setGrowers(list);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const renderGrowerCard = (g) => (
    <Grid item xs={12} sm={6} md={4} key={g.user_id || g.id}>
      <Card sx={{ height: '100%', background: 'rgba(255,255,255,0.10)', backdropFilter: 'blur(12px)', border: '2px solid black', boxShadow: 'none' }}>
        <CardContent>
          <Stack spacing={2}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                {(g.grower_farm_name || g.grower_city || '??').substring(0, 2).toUpperCase()}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6">
                  {g.grower_farm_name || 'Grower'}
                </Typography>
                {g.grower_certified && (
                  <Chip
                    label="Certified"
                    color="success"
                    size="small"
                    sx={{ mt: 0.5, alignSelf: 'flex-start' }}
                  />
                )}
                {g.grower_city && (
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <LocationOn fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {g.grower_city}{g.grower_state ? `, ${g.grower_state}` : ''}
                    </Typography>
                  </Stack>
                )}
              </Box>
            </Stack>

            {Array.isArray(g.grower_specialties) && g.grower_specialties.length > 0 && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Specialties:
                </Typography>
                <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 0.5 }}>
                  {g.grower_specialties.map((s, i) => (
                    <Chip key={i} label={s} size="small" color="success" variant="outlined" />
                  ))}
                </Stack>
              </Box>
            )}

            <Typography variant="body2" color="text.secondary">
              Experience: {g.grower_experience_years || 0} years
            </Typography>
            <Chip
              icon={<EmojiEvents fontSize="small" />}
              label={g.grower_license_status === 'licensed' ? 'Licensed' : 'Community'}
              size="small"
              sx={{ alignSelf: 'flex-start' }}
            />

            <Button variant="outlined" size="small">
              View Profile
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Grid>
  );

  const renderSection = (title, list) => {
    if (!list || list.length === 0) return null;
    const sorted = [...list].sort((a, b) => {
      const experienceA = Number(a.grower_experience_years) || 0;
      const experienceB = Number(b.grower_experience_years) || 0;
      return experienceB - experienceA;
    });
    return (
      <Box>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
          {title}
        </Typography>
        <Grid container spacing={2}>
          {sorted.map(renderGrowerCard)}
        </Grid>
      </Box>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        {onBack && (
          <Button onClick={onBack} size="small" variant="contained" sx={{ bgcolor: 'white', color: 'black', textTransform: 'none', fontWeight: 700, borderRadius: 999, '&:hover': { bgcolor: 'grey.100' } }}>← Back to Garden</Button>
        )}
        <Button 
          variant="contained" 
          color="primary"
          onClick={() => {
            // Navigate to grower registration component
            if (typeof onNavigate === 'function') {
              onNavigate('register');
            } else {
              window.location.hash = '#/register';
            }
          }}
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
        <Stack spacing={4}>
          {renderSection('Certified Growers', growers.filter(g => g.grower_certified))}
          {renderSection('Community Growers', growers.filter(g => !g.grower_certified))}
        </Stack>
      )}
    </Container>
  );
}
