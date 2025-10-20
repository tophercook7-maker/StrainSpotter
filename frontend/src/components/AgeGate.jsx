import { Box, Button, Typography, Card, CardContent, Container } from '@mui/material';
import { LocalFlorist } from '@mui/icons-material';

function AgeGate({ onVerify }) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1a3a1a 0%, #2d5a2d 50%, #1a3a1a 100%)',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `
            radial-gradient(circle at 20% 50%, rgba(76, 175, 80, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(139, 195, 74, 0.1) 0%, transparent 50%)
          `,
        },
      }}
    >
      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <Card 
          elevation={8}
          sx={{
            background: 'linear-gradient(135deg, #2c2c2c 0%, #1f3a1f 100%)',
            border: '2px solid #4caf50',
          }}
        >
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <Box sx={{ position: 'relative', display: 'inline-block' }}>
              <LocalFlorist 
                sx={{ 
                  fontSize: 100, 
                  color: '#4caf50',
                  mb: 2,
                  filter: 'drop-shadow(0 0 20px rgba(76, 175, 80, 0.5))',
                  animation: 'pulse 2s ease-in-out infinite',
                  '@keyframes pulse': {
                    '0%, 100%': { transform: 'scale(1)' },
                    '50%': { transform: 'scale(1.05)' },
                  },
                }} 
              />
            </Box>
            
            <Typography 
              variant="h3" 
              gutterBottom 
              fontWeight="bold"
              sx={{
                background: 'linear-gradient(45deg, #4caf50 30%, #8bc34a 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              StrainSpotter
            </Typography>
            
            <Typography variant="h6" color="text.secondary" paragraph>
              AI-Powered Cannabis Strain Identification
            </Typography>
            
            <Box sx={{ my: 4, p: 3, bgcolor: 'rgba(76, 175, 80, 0.1)', borderRadius: 2, border: '1px solid rgba(76, 175, 80, 0.3)' }}>
              <Typography variant="h5" gutterBottom fontWeight="bold" color="primary.light">
                Age Verification Required
              </Typography>
              <Typography variant="body1" paragraph color="text.primary">
                You must be 21 years or older to use this application.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                By clicking "I am 21+", you confirm that you meet the age requirement for cannabis-related content in your jurisdiction.
              </Typography>
            </Box>
            
            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={onVerify}
              sx={{ 
                py: 2.5, 
                fontSize: '1.2rem',
                fontWeight: 'bold',
                background: 'linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)',
                boxShadow: '0 3px 15px 2px rgba(76, 175, 80, .3)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #388e3c 30%, #4caf50 90%)',
                  boxShadow: '0 6px 20px 4px rgba(76, 175, 80, .4)',
                },
              }}
            >
              🌿 I am 21 or Older 🌿
            </Button>
            
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 3 }}>
              Cannabis is for medical and recreational use in accordance with state laws.
              <br />
              Please consume responsibly.
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}

export default AgeGate;
