import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  AppBar,
  Toolbar,
  IconButton,
  CircularProgress,
  Alert,
  Chip,
  Stack,
  CardMedia
} from '@mui/material';
import { ArrowBack, LocalFlorist } from '@mui/icons-material';

import { FUNCTIONS_BASE } from '../config';

function ScanHistory() {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchScans();
  }, []);

  const fetchScans = async () => {
    try {
      // Get JWT from localStorage (or Supabase client if available)
      const accessToken = localStorage.getItem('sb-access-token');
      if (!accessToken) throw new Error('Not signed in');
      const response = await fetch(`${FUNCTIONS_BASE}/scans-history`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (!response.ok) throw new Error('Failed to fetch scans');
      const data = await response.json();
      setScans(data.scans || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Using global TopNav */}

      <Container maxWidth="md" sx={{ py: 4 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : scans.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 5 }}>
              <Typography variant="h6" color="text.secondary">
                No scans yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Your scan history will appear here
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Stack spacing={2}>
            {scans.map((scan) => (
              <Card key={scan.id}>
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="flex-start">
                    {/* Image thumbnail */}
                    {scan.image_url && (
                      <CardMedia
                        component="img"
                        image={scan.image_url}
                        alt="Scan"
                        sx={{
                          width: 100,
                          height: 100,
                          borderRadius: 1,
                          objectFit: 'cover'
                        }}
                      />
                    )}

                    {/* Scan details */}
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(scan.created_at).toLocaleString()}
                      </Typography>
                      
                      <Chip
                        label={scan.status}
                        size="small"
                        color={
                          scan.status === 'done' ? 'success' :
                          scan.status === 'processing' ? 'info' :
                          scan.status === 'failed' ? 'error' : 'default'
                        }
                        sx={{ ml: 1 }}
                      />

                      {/* Show labels if available */}
                      {scan.result?.labelAnnotations && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2" gutterBottom>
                            Detected:
                          </Typography>
                          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                            {scan.result.labelAnnotations.slice(0, 5).map((label, idx) => (
                              <Chip
                                key={idx}
                                label={label.description}
                                size="small"
                                variant="outlined"
                              />
                            ))}
                          </Stack>
                        </Box>
                      )}

                      {/* Show detected text preview */}
                      {scan.result?.textAnnotations?.[0]?.description && (
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            mt: 1, 
                            p: 1, 
                            bgcolor: 'grey.100', 
                            borderRadius: 1,
                            fontSize: '0.75rem',
                            maxHeight: 60,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {scan.result.textAnnotations[0].description.substring(0, 100)}...
                        </Typography>
                      )}
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}
      </Container>
    </Box>
  );
}

export default ScanHistory;
