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
  CardMedia,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fade,
  Slide,
  Zoom,
  Tooltip,
  Badge
} from '@mui/material';
import { ArrowBack, LocalFlorist, Visibility, Close, Share, Favorite, FavoriteBorder } from '@mui/icons-material';

import { API_BASE } from '../config';
import { supabase } from '../supabaseClient';

function ScanHistory({ onBack }) {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedScan, setSelectedScan] = useState(null);
  const [strainDetails, setStrainDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    fetchScans();
  }, []);

  const fetchScans = async () => {
    try {
      let userId = null;
      try {
        const session = await supabase?.auth.getSession();
        userId = session?.data?.session?.user?.id || null;
      } catch (e) {
        console.debug('[ScanHistory] getSession failed', e);
      }
      const url = userId ? `${API_BASE}/api/scans?user_id=${encodeURIComponent(userId)}` : `${API_BASE}/api/scans`;
      console.log('[ScanHistory] Fetching scans from:', url);
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch scans');
      const data = await response.json();
      console.log('[ScanHistory] Received scans:', data.scans?.length || 0, 'scans');
      setScans(data.scans || []);
    } catch (err) {
      console.error('[ScanHistory] Error fetching scans:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewStrain = async (scan) => {
    if (!scan.matched_strain_slug) return;
    setSelectedScan(scan);
    setLoadingDetails(true);
    try {
      const response = await fetch(`${API_BASE}/api/strains/${scan.matched_strain_slug}`);
      if (response.ok) {
        const data = await response.json();
        setStrainDetails(data);
      } else {
        setStrainDetails(null);
      }
    } catch (err) {
      console.error('Failed to fetch strain details:', err);
      setStrainDetails(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCloseDialog = () => {
    setSelectedScan(null);
    setStrainDetails(null);
  };

  return (
    <Box sx={{ minHeight: '100vh' }}>
      {/* Back to Home button */}
      {onBack && (
        <Box sx={{ position: 'fixed', top: 16, left: 16, zIndex: 1000 }}>
          <Button
            onClick={onBack}
            size="small"
            variant="contained"
            sx={{
              bgcolor: 'white',
              color: 'black',
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: 999,
              px: 1.5,
              minWidth: 0,
              '&:hover': { bgcolor: 'grey.100' }
            }}
          >
            Home
          </Button>
        </Box>
      )}

      <Container maxWidth="md" sx={{ py: 4 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : scans.length === 0 ? (
          <Zoom in>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 5 }}>
                <Typography variant="h4" sx={{ mb: 2 }}>
                  📸
                </Typography>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No scans yet
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Your scan history will appear here
                </Typography>
                <Chip 
                  label="💡 Tip: Scan a strain label to get started!" 
                  color="primary" 
                  variant="outlined"
                />
              </CardContent>
            </Card>
          </Zoom>
        ) : (
          <Stack spacing={2}>
            {scans.map((scan, index) => (
              <Slide in direction="up" timeout={300 + index * 100} key={scan.id}>
                <Card 
                  sx={{
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 6
                    }
                  }}
                >
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

                      {/* Show matched strain OR processing message */}
                      {scan.matched_strain_slug ? (
                        <Box sx={{ mt: 2, p: 1.5, bgcolor: 'success.light', borderRadius: 1, border: '2px solid', borderColor: 'success.main' }}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <LocalFlorist sx={{ color: 'success.dark' }} />
                            <Box>
                              <Typography variant="caption" color="success.dark" fontWeight="bold">
                                Identified Strain:
                              </Typography>
                              <Typography variant="body1" fontWeight="bold" color="success.dark">
                                {scan.matched_strain_slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                              </Typography>
                            </Box>
                          </Stack>
                        </Box>
                      ) : (
                        <Box sx={{ mt: 2, p: 1.5, bgcolor: 'info.light', borderRadius: 1, border: '2px solid', borderColor: 'info.main' }}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="body2" color="info.dark" fontWeight="600">
                              {scan.status === 'processing' ? '🔄 Processing scan...' : 
                               scan.status === 'failed' ? '❌ Scan failed - please try again' : 
                               '📸 Image scanned - no strain label detected. Try scanning a product label or package with strain name visible.'}
                            </Typography>
                          </Stack>
                        </Box>
                      )}

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

                      {/* View Full Details Button */}
                      {scan.matched_strain_slug && (
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<Visibility />}
                          onClick={() => handleViewStrain(scan)}
                          sx={{ mt: 2 }}
                        >
                          View Full Details
                        </Button>
                      )}
                    </Box>
                  </Stack>
                </CardContent>
                </Card>
              </Slide>
            ))}
          </Stack>
        )}
      </Container>

      {/* Strain Details Dialog */}
      <Dialog 
        open={!!selectedScan} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ bgcolor: 'success.main', color: 'white' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={1} alignItems="center">
              <LocalFlorist />
              <Typography variant="h6" fontWeight="bold">
                Strain Details
              </Typography>
            </Stack>
            <IconButton onClick={handleCloseDialog} sx={{ color: 'white' }}>
              <Close />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {loadingDetails ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : strainDetails ? (
            <Stack spacing={2}>
              <Typography variant="h4" fontWeight="bold" color="primary.main">
                {strainDetails.name}
              </Typography>
              
              {strainDetails.type && (
                <Chip 
                  label={strainDetails.type} 
                  color="primary" 
                  sx={{ width: 'fit-content' }}
                />
              )}

              {strainDetails.description && (
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Description
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {strainDetails.description}
                  </Typography>
                </Box>
              )}

              {(strainDetails.thc || strainDetails.cbd) && (
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Cannabinoid Content
                  </Typography>
                  <Stack direction="row" spacing={2}>
                    {strainDetails.thc && (
                      <Chip label={`THC: ${strainDetails.thc}%`} color="warning" variant="outlined" />
                    )}
                    {strainDetails.cbd && (
                      <Chip label={`CBD: ${strainDetails.cbd}%`} color="info" variant="outlined" />
                    )}
                  </Stack>
                </Box>
              )}

              {strainDetails.effects && strainDetails.effects.length > 0 && (
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Effects
                  </Typography>
                  <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                    {strainDetails.effects.map((effect, idx) => (
                      <Chip key={idx} label={effect} size="small" />
                    ))}
                  </Stack>
                </Box>
              )}

              {strainDetails.flavors && strainDetails.flavors.length > 0 && (
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Flavors
                  </Typography>
                  <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                    {strainDetails.flavors.map((flavor, idx) => (
                      <Chip key={idx} label={flavor} size="small" color="secondary" variant="outlined" />
                    ))}
                  </Stack>
                </Box>
              )}

              {strainDetails.lineage && (
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Lineage
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {strainDetails.lineage}
                  </Typography>
                </Box>
              )}

              {/* Show scan image */}
              {selectedScan?.image_url && (
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Your Scan
                  </Typography>
                  <CardMedia
                    component="img"
                    image={selectedScan.image_url}
                    alt="Scan"
                    sx={{
                      maxWidth: '100%',
                      maxHeight: 300,
                      borderRadius: 2,
                      objectFit: 'contain',
                      bgcolor: 'grey.100'
                    }}
                  />
                </Box>
              )}
            </Stack>
          ) : (
            <Alert severity="info">
              Strain details not available
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ScanHistory;
