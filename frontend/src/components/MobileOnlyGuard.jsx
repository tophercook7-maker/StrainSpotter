import { useState, useEffect } from 'react';
import { Box, Typography, Container } from '@mui/material';

/**
 * MobileOnlyGuard - Restricts access to mobile/tablet devices only
 * 
 * In production: Blocks desktop users and shows a message
 * In development: Allows all devices (so you can work on desktop)
 * On web (non-Capacitor): Always allows access (web version supports desktop)
 */
export default function MobileOnlyGuard({ children }) {
  const [isMobile, setIsMobile] = useState(true);
  const [isProduction, setIsProduction] = useState(false);
  const [isWeb, setIsWeb] = useState(false);

  useEffect(() => {
    // Check if we're running in web mode (not Capacitor)
    const isWebMode = typeof window !== 'undefined' && window.location.protocol !== 'capacitor:';
    setIsWeb(isWebMode);

    // Check if we're in production
    const isProd = import.meta.env.PROD;
    setIsProduction(isProd);

    // Check if device is mobile/tablet
    const checkDevice = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet/i.test(userAgent);
      const isSmallScreen = window.innerWidth <= 1024; // Tablets and below
      
      setIsMobile(isMobileDevice || isSmallScreen);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);

    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // On web (non-Capacitor), always allow access regardless of device
  if (isWeb) {
    return <>{children}</>;
  }

  // In development, always allow access
  if (!isProduction) {
    return (
      <>
        {/* Development mode indicator */}
        <Box sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bgcolor: 'rgba(255, 152, 0, 0.9)',
          color: '#fff',
          py: 0.5,
          px: 2,
          zIndex: 9999,
          textAlign: 'center',
          fontSize: '0.75rem',
          fontWeight: 600
        }}>
          🔧 DEV MODE - Desktop access enabled for development
        </Box>
        <Box sx={{ pt: { xs: 0, sm: 4 } }}>
          {children}
        </Box>
      </>
    );
  }

  // In production (Capacitor only), block desktop users
  if (isProduction && !isMobile) {
    return (
      <Container maxWidth="sm">
        <Box sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          px: 3,
          background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)'
        }}>
          <Box sx={{
            bgcolor: 'rgba(124, 179, 66, 0.1)',
            border: '2px solid rgba(124, 179, 66, 0.3)',
            borderRadius: 4,
            p: 4,
            maxWidth: 400
          }}>
            <Typography variant="h4" sx={{ 
              color: '#9CCC65', 
              fontWeight: 700, 
              mb: 2,
              fontSize: { xs: '1.5rem', sm: '2rem' }
            }}>
              📱 Mobile Only
            </Typography>
            
            <Typography variant="body1" sx={{ 
              color: '#fff', 
              mb: 3,
              lineHeight: 1.6
            }}>
              StrainSpotter is designed exclusively for mobile devices and tablets.
            </Typography>

            <Typography variant="body2" sx={{ 
              color: 'rgba(255, 255, 255, 0.7)',
              mb: 2
            }}>
              Please access this app from:
            </Typography>

            <Box sx={{ 
              bgcolor: 'rgba(0, 0, 0, 0.3)',
              borderRadius: 2,
              p: 2,
              mb: 3
            }}>
              <Typography variant="body2" sx={{ color: '#9CCC65', mb: 1 }}>
                📱 iPhone or Android phone
              </Typography>
              <Typography variant="body2" sx={{ color: '#9CCC65' }}>
                📱 iPad or Android tablet
              </Typography>
            </Box>

            <Typography variant="caption" sx={{ 
              color: 'rgba(255, 255, 255, 0.5)',
              display: 'block',
              mt: 2
            }}>
              Scan the QR code with your mobile device or visit this URL on your phone
            </Typography>
          </Box>
        </Box>
      </Container>
    );
  }

  // Mobile device in production - allow access
  return children;
}

