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

import { useNavigate } from "react-router-dom";
import CannabisLeafIcon from "./CannabisLeafIcon";
import { API_BASE } from '../config';
import { supabase } from '../supabaseClient';

function ScanHistory({ onBack }) {
  const navigate = useNavigate();
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
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch scans');
      const data = await response.json();
      setScans(data.scans || []);
    } catch (err) {
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
      <Box>
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
        <button
          style={{
            position: "absolute",
            top: 16,
            left: 16,
            zIndex: 100,
            background: "rgba(34, 139, 34, 0.25)",
            border: "1px solid #228B22",
            borderRadius: 12,
            boxShadow: "0 2px 12px rgba(34,139,34,0.15)",
            backdropFilter: "blur(8px)",
            color: "#228B22",
            padding: "8px 16px",
            display: "flex",
            alignItems: "center",
            fontWeight: 600,
            fontSize: 18,
          }}
          onClick={() => navigate("/")}
        >
          <CannabisLeafIcon style={{ marginRight: 8, height: 24 }} />
          Home
        </button>
      </Box>
      <Container maxWidth="md" sx={{ py: 4 }}>
        {/* ...existing code for scan list and details... */}
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
              {/* ...existing code for strain details... */}
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
