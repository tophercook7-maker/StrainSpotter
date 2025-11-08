import { Box, Button, Typography, Card, CardContent, Container, Stack, Fade, Grow } from '@mui/material';
import { LocalFlorist, Verified } from '@mui/icons-material';
import { useState, useEffect } from 'react';

function AgeGate({ onVerify }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(true);
  }, []);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0a1f0a 0%, #1a3a1a 25%, #2d5a2d 50%, #1a3a1a 75%, #0a1f0a 100%)',
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
            radial-gradient(circle at 20% 30%, rgba(76, 175, 80, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(139, 195, 74, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(124, 179, 66, 0.1) 0%, transparent 70%)
          `,
          animation: 'pulse 8s ease-in-out infinite',
          '@keyframes pulse': {
            '0%, 100%': { opacity: 0.5 },
            '50%': { opacity: 1 },
          },
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          top: '-50%',
          left: '-50%',
          width: '200%',
          height: '200%',
          background: `
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(76, 175, 80, 0.03) 2px,
              rgba(76, 175, 80, 0.03) 4px
            )
          `,
          animation: 'scan 20s linear infinite',
          '@keyframes scan': {
            '0%': { transform: 'translateY(0)' },
            '100%': { transform: 'translateY(50px)' },
          },
        },
      }}
    >
      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <Fade in={show} timeout={1000}>
          <Card 
            elevation={24}
            sx={{
              background: 'linear-gradient(135deg, rgba(28, 28, 28, 0.95) 0%, rgba(31, 58, 31, 0.95) 100%)',
              backdropFilter: 'blur(20px)',
              border: '2px solid transparent',
              backgroundClip: 'padding-box',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                borderRadius: 'inherit',
                padding: '2px',
                background: 'linear-gradient(135deg, #4caf50, #8bc34a, #4caf50)',
                WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                WebkitMaskComposite: 'xor',
                maskComposite: 'exclude',
                animation: 'borderGlow 3s ease-in-out infinite',
                '@keyframes borderGlow': {
                  '0%, 100%': { opacity: 0.5 },
                  '50%': { opacity: 1 },
                },
              },
            }}
          >
            <CardContent sx={{ p: 5, textAlign: 'center' }}>
              <Grow in={show} timeout={1200}>
                <Box sx={{ position: 'relative', display: 'inline-block', mb: 2 }}>
                  <LocalFlorist 
                    sx={{ 
                      fontSize: 120, 
                      color: '#4caf50',
                      filter: 'drop-shadow(0 0 30px rgba(76, 175, 80, 0.8))',
                      animation: 'float 3s ease-in-out infinite',
                      '@keyframes float': {
                        '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
                        '50%': { transform: 'translateY(-10px) rotate(5deg)' },
                      },
                    }} 
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: '140px',
                      height: '140px',
                      border: '2px solid rgba(76, 175, 80, 0.3)',
                      borderRadius: '50%',
                      animation: 'ripple 2s ease-out infinite',
                      '@keyframes ripple': {
                        '0%': { 
                          transform: 'translate(-50%, -50%) scale(0.8)',
                          opacity: 1,
                        },
                        '100%': { 
                          transform: 'translate(-50%, -50%) scale(1.5)',
                          opacity: 0,
                        },
                      },
                    }}
                  />
                </Box>
              </Grow>
              
              <Typography 
                variant="h2" 
                gutterBottom 
                fontWeight="900"
                sx={{
                  background: 'linear-gradient(135deg, #4caf50 0%, #8bc34a 50%, #4caf50 100%)',
                  backgroundSize: '200% auto',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  animation: 'shimmer 3s linear infinite',
                  letterSpacing: '2px',
                  textShadow: '0 0 40px rgba(76, 175, 80, 0.5)',
                  '@keyframes shimmer': {
                    '0%': { backgroundPosition: '0% center' },
                    '100%': { backgroundPosition: '200% center' },
                  },
                }}
              >
                StrainSpotter
              </Typography>
              
              <Typography 
                variant="h6" 
                sx={{ 
                  color: '#8bc34a',
                  fontWeight: 500,
                  mb: 4,
                  textShadow: '0 0 20px rgba(139, 195, 74, 0.3)',
                }}
              >
                AI-Powered Cannabis Strain Identification
              </Typography>
              
              <Box 
                sx={{ 
                  my: 4, 
                  p: 4, 
                  background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.15) 0%, rgba(139, 195, 74, 0.15) 100%)',
                  borderRadius: 3,
                  border: '1px solid rgba(76, 175, 80, 0.4)',
                  boxShadow: 'inset 0 0 20px rgba(76, 175, 80, 0.1)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: '-100%',
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
                    animation: 'shine 3s infinite',
                    '@keyframes shine': {
                      '0%': { left: '-100%' },
                      '100%': { left: '100%' },
                    },
                  },
                }}
              >
                <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} mb={2}>
                  <Verified sx={{ color: '#4caf50', fontSize: 32 }} />
                  <Typography variant="h4" fontWeight="bold" sx={{ color: '#4caf50' }}>
                    Age Verification
                  </Typography>
                  <Verified sx={{ color: '#4caf50', fontSize: 32 }} />
                </Stack>
                
                <Typography variant="h6" paragraph sx={{ color: '#fff', fontWeight: 500 }}>
                  You must be 21 years or older
                </Typography>
                <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.8)', lineHeight: 1.8 }}>
                  By clicking "I am 21+", you confirm that you meet the age requirement for cannabis-related content in your jurisdiction.
                </Typography>
              </Box>
              
              <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={onVerify}
                sx={{ 
                  py: 3, 
                  fontSize: '1.3rem',
                  fontWeight: 'bold',
                  background: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 50%, #4caf50 100%)',
                  backgroundSize: '200% auto',
                  boxShadow: '0 8px 30px rgba(76, 175, 80, .4)',
                  borderRadius: 3,
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(135deg, transparent 0%, rgba(255, 255, 255, 0.2) 50%, transparent 100%)',
                    transform: 'translateX(-100%)',
                    transition: 'transform 0.6s',
                  },
                  '&:hover': {
                    background: 'linear-gradient(135deg, #388e3c 0%, #4caf50 50%, #388e3c 100%)',
                    backgroundSize: '200% auto',
                    boxShadow: '0 12px 40px rgba(76, 175, 80, .6)',
                    transform: 'translateY(-2px)',
                    '&::before': {
                      transform: 'translateX(100%)',
                    },
                  },
                  '&:active': {
                    transform: 'translateY(0px)',
                  },
                }}
              >
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Box 
                    component="img" 
                    src="/hero.png?v=13" 
                    alt="" 
                    sx={{ 
                      width: 28, 
                      height: 28, 
                      borderRadius: '50%', filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.8))',
                      animation: 'spin 10s linear infinite',
                      '@keyframes spin': {
                        '0%': { transform: 'rotate(0deg)' },
                        '100%': { transform: 'rotate(360deg)' },
                      },
                    }} 
                  />
                  <span>I am 21 or Older</span>
                  <Box 
                    component="img" 
                    src="/hero.png?v=13" 
                    alt="" 
                    sx={{ 
                      width: 28, 
                      height: 28, 
                      borderRadius: '50%', filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.8))',
                      animation: 'spin 10s linear infinite reverse',
                    }} 
                  />
                </Stack>
              </Button>
              
              <Typography 
                variant="caption" 
                display="block" 
                sx={{ 
                  mt: 4,
                  color: 'rgba(255, 255, 255, 0.5)',
                  lineHeight: 1.6,
                  fontSize: '0.85rem',
                }}
              >
                Cannabis is for medical and recreational use in accordance with state laws.
                <br />
                Please consume responsibly and know your local regulations.
              </Typography>
            </CardContent>
          </Card>
        </Fade>
      </Container>
    </Box>
  );
}

export default AgeGate;
