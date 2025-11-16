import React from 'react';
import { Box, Container, Typography, Button, Alert, Card, CardContent } from '@mui/material';
import { API_BASE } from '../config';
import { supabase } from '../supabaseClient';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    
    // Log to console with clear formatting
    console.error('\n🔥 FRONTEND ERROR CAUGHT BY BOUNDARY 🔥');
    console.error('═══════════════════════════════════════════════════════');
    console.error('Time:', new Date().toISOString());
    console.error('Error:', error.toString());
    console.error('Component Stack:', errorInfo.componentStack);
    console.error('═══════════════════════════════════════════════════════\n');

    this.sendClientError(error, errorInfo);
  }

  async sendClientError(error, errorInfo) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers = { 'Content-Type': 'application/json' };
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }
      await fetch(`${API_BASE}/api/admin/errors/client`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: error?.toString(),
          stack: errorInfo?.componentStack,
          location: window.location.href,
          currentView: window.location.pathname,
          platform: navigator?.platform || null,
          userAgent: navigator?.userAgent || null
        })
      });
    } catch (e) {
      console.warn('[ErrorBoundary] Failed to report client error:', e);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <Container maxWidth="md" sx={{ py: 8 }}>
          <Card sx={{ bgcolor: 'rgba(211, 47, 47, 0.05)', border: '2px solid #d32f2f44' }}>
            <CardContent>
              <Typography variant="h4" gutterBottom color="error">
                🚨 Something went wrong
              </Typography>
              
              <Alert severity="error" sx={{ mb: 3 }}>
                <Typography variant="body1" fontWeight="bold">
                  {this.state.error && this.state.error.toString()}
                </Typography>
              </Alert>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                The application encountered an error. This has been logged to the console.
              </Typography>

              <Box sx={{ mb: 3 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  Component Stack:
                </Typography>
                <Box
                  component="pre"
                  sx={{
                    bgcolor: 'rgba(0,0,0,0.05)',
                    p: 2,
                    borderRadius: 1,
                    fontSize: '0.75rem',
                    overflow: 'auto',
                    maxHeight: 300
                  }}
                >
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </Box>
              </Box>

              <Button
                variant="contained"
                onClick={() => window.location.reload()}
                sx={{ mr: 2 }}
              >
                Reload Page
              </Button>
              
              <Button
                variant="outlined"
                onClick={() => {
                  this.setState({ hasError: false, error: null, errorInfo: null });
                  window.history.back();
                }}
              >
                Go Back
              </Button>

              <Alert severity="info" sx={{ mt: 3 }}>
                <Typography variant="caption" fontWeight="bold">
                  💡 For developers:
                </Typography>
                <Typography variant="caption" display="block">
                  • Open browser DevTools (F12) → Console tab for full error details
                </Typography>
                <Typography variant="caption" display="block">
                  • Check backend errors at: <code>http://localhost:5173/errors</code>
                </Typography>
                <Typography variant="caption" display="block">
                  • PM2 logs: <code>pm2 logs strainspotter-backend</code>
                </Typography>
              </Alert>
            </CardContent>
          </Card>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
