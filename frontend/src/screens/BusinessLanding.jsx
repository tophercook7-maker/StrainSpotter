import React from 'react';
import { Box, Container, Typography, Button, Stack, Card, CardContent } from '@mui/material';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';
import StoreIcon from '@mui/icons-material/Store';
import { useNavigate } from 'react-router-dom';

export default function BusinessLanding({ onNavigate }) {
  const navigate = onNavigate || ((path) => window.location.hash = `#${path}`);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
        color: '#fff',
        pt: 'env(safe-area-inset-top)',
        pb: 'env(safe-area-inset-bottom)',
      }}
    >
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 4, textAlign: 'center', color: '#C5E1A5' }}>
          Join StrainSpotter
        </Typography>

        <Typography variant="body1" sx={{ mb: 4, textAlign: 'center', color: '#BDBDBD' }}>
          Connect with growers and dispensaries in your area. Share deals, manage inventory, and grow your business.
        </Typography>

        <Stack spacing={3}>
          <Card
            sx={{
              background: 'rgba(124, 179, 66, 0.1)',
              border: '2px solid rgba(124, 179, 66, 0.3)',
              borderRadius: 3,
              cursor: 'pointer',
              '&:hover': {
                background: 'rgba(124, 179, 66, 0.2)',
                borderColor: 'rgba(124, 179, 66, 0.5)',
              },
            }}
            onClick={() => navigate('/business/register?type=grower')}
          >
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <LocalFloristIcon sx={{ fontSize: 48, color: '#7cb342' }} />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#E8F5E9' }}>
                    I am a Grower
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#BDBDBD', mt: 0.5 }}>
                    Register your grow operation
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          <Card
            sx={{
              background: 'rgba(255, 167, 38, 0.1)',
              border: '2px solid rgba(255, 167, 38, 0.3)',
              borderRadius: 3,
              cursor: 'pointer',
              '&:hover': {
                background: 'rgba(255, 167, 38, 0.2)',
                borderColor: 'rgba(255, 167, 38, 0.5)',
              },
            }}
            onClick={() => navigate('/business/register?type=dispensary')}
          >
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <StoreIcon sx={{ fontSize: 48, color: '#FFA726' }} />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#E8F5E9' }}>
                    I am a Dispensary
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#BDBDBD', mt: 0.5 }}>
                    Register your dispensary
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Stack>

        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/business/claim')}
            sx={{
              borderColor: 'rgba(255,255,255,0.3)',
              color: '#fff',
              '&:hover': {
                borderColor: 'rgba(255,255,255,0.5)',
              },
            }}
          >
            Claim Existing Business
          </Button>
        </Box>
      </Container>
    </Box>
  );
}

