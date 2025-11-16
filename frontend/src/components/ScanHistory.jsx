import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Stack,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate } from 'react-router-dom';
import CannabisLeafIcon from './CannabisLeafIcon';
import { API_BASE } from '../config';
import { supabase } from '../supabaseClient';
import EmptyStateCard from './EmptyStateCard';
import CameraAltIcon from '@mui/icons-material/CameraAlt';

function ScanHistory({ onBack }) {
  const navigate = useNavigate();
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedScan, setSelectedScan] = useState(null);
  const [strainDetails, setStrainDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const fetchScans = useCallback(async () => {
    try {
      setLoading(true);
      let userId = null;
      try {
        const session = await supabase?.auth.getSession();
        userId = session?.data?.session?.user?.id || null;
      } catch (sessionError) {
        console.debug('[ScanHistory] getSession failed', sessionError);
      }

      const url = userId
        ? `${API_BASE}/api/scans?user_id=${encodeURIComponent(userId)}`
        : `${API_BASE}/api/scans`;

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch scans');

      const data = await response.json();
      setScans(data.scans || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScans();
  }, [fetchScans]);

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
      console.error('Failed to load strain details:', err);
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
    <Box sx={{ minHeight: '100vh', py: 4 }}>
      <Container maxWidth="md">
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <CannabisLeafIcon style={{ height: 28 }} />
            <Typography variant="h5" fontWeight={700}>
              Scan History
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1}>
            {onBack && (
              <Button variant="outlined" onClick={onBack}>
                Back
              </Button>
            )}
            <Button
              variant="contained"
              color="success"
              startIcon={<CannabisLeafIcon style={{ height: 20 }} />}
              onClick={() => navigate('/')}
              sx={{ textTransform: 'none' }}
            >
              Home
            </Button>
          </Stack>
        </Stack>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        )}

        {!loading && error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {!loading && !error && scans.length === 0 && (
          <EmptyStateCard
            title="No scans yet"
            description="Upload your first bud photo to see AI matches and build your history."
            icon={<CameraAltIcon sx={{ fontSize: 56, color: '#7cb342' }} />}
            actionLabel="Start a scan"
            onAction={() => window.dispatchEvent(new CustomEvent('nav:set-view', { detail: 'scanner' }))}
            secondaryActionLabel="Back to home"
            onSecondaryAction={onBack}
          />
        )}

        {!loading && !error && scans.length > 0 && (
          <Stack spacing={2}>
            {scans.map((scan) => (
              <Card
                key={scan.id}
                variant="outlined"
                sx={{ borderRadius: 3, background: 'rgba(255,255,255,0.08)' }}
              >
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="h6" fontWeight={600}>
                        {scan.matched_strain_name || 'Unknown Strain'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Scanned on {new Date(scan.created_at).toLocaleString()}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        onClick={() => handleViewStrain(scan)}
                        disabled={!scan.matched_strain_slug}
                      >
                        View Details
                      </Button>
                    </Stack>
                  </Stack>
                  {scan.notes && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {scan.notes}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}
      </Container>

      <Dialog
        open={Boolean(selectedScan)}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" alignItems="center" spacing={1}>
              <LocalFloristIcon color="success" />
              <Typography variant="h6" fontWeight={600}>
                Strain Details
              </Typography>
            </Stack>
            <Button
              onClick={handleCloseDialog}
              size="small"
              color="inherit"
              startIcon={<CloseIcon fontSize="small" />}
            >
              Close
            </Button>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          {loadingDetails && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          )}
          {!loadingDetails && strainDetails && (
            <Stack spacing={2}>
              <Typography variant="h6">{strainDetails.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {strainDetails.description || 'No description available.'}
              </Typography>
              {Array.isArray(strainDetails.effects) && strainDetails.effects.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Effects
                  </Typography>
                  <Typography variant="body2">
                    {strainDetails.effects.join(', ')}
                  </Typography>
                </Box>
              )}
              {Array.isArray(strainDetails.flavors) && strainDetails.flavors.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Flavors
                  </Typography>
                  <Typography variant="body2">
                    {strainDetails.flavors.join(', ')}
                  </Typography>
                </Box>
              )}
            </Stack>
          )}
          {!loadingDetails && !strainDetails && (
            <Alert severity="info">Strain details not available.</Alert>
          )}
        </DialogContent>
        {selectedScan && (
          <DialogActions>
            <Typography variant="caption" color="text.secondary" sx={{ px: 2, pb: 1 }}>
              Scan ID: {selectedScan.id}
            </Typography>
          </DialogActions>
        )}
      </Dialog>
    </Box>
  );
}

export default ScanHistory;
