import React, { useEffect, useState } from "react";
import { 
  Box, 
  Container, 
  Typography, 
  CircularProgress, 
  Alert, 
  IconButton,
  Stack,
  Chip,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FilterListIcon from '@mui/icons-material/FilterList';
import HistoryListItem from "./HistoryListItem";
import AnalyticsSummary from "./AnalyticsSummary";
import { API_BASE } from "../config";
import { useAuth } from "../hooks/useAuth";
import { useProMode } from "../contexts/ProModeContext";
import ScanResultCard from "./ScanResultCard";
import { transformScanResult } from "../utils/scanResultUtils";

function HistoryPage({ onBack, onNavigate }) {
  const { user } = useAuth();
  const { proRole, proEnabled } = useProMode();
  const [scans, setScans] = useState([]);
  const [filteredScans, setFilteredScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedScan, setSelectedScan] = useState(null);
  
  // Filters
  const [filterRole, setFilterRole] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStrain, setFilterStrain] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function loadScans() {
      try {
        setLoading(true);
        setError("");

        const userId = user?.id || null;
        const headers = {};
        
        // Add pro role header if enabled
        if (proEnabled && (proRole === 'dispensary' || proRole === 'grower')) {
          headers['X-Pro-Role'] = proRole;
        }

        // Build query params
        const params = new URLSearchParams();
        if (userId) params.append('user_id', userId);
        if (filterRole) params.append('role', filterRole);
        if (filterType) params.append('type', filterType);
        if (filterStrain) params.append('strain', filterStrain);
        params.append('limit', '200');

        const url = `${API_BASE}/api/scans?${params.toString()}`;
        const res = await fetch(url, { headers });
        
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        
        const data = await res.json();
        if (!cancelled) {
          setScans(data.scans || []);
          setFilteredScans(data.scans || []);
        }
      } catch (e) {
        if (!cancelled) {
          setError(String(e));
          console.error('[HistoryPage] Load error', e);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadScans();
    return () => {
      cancelled = true;
    };
  }, [user?.id, filterRole, filterType, filterStrain, proRole, proEnabled]);

  const handleScanSelect = (scan) => {
    setSelectedScan(scan);
  };

  const handleBackFromDetail = () => {
    setSelectedScan(null);
  };

  // If viewing a scan detail, show the result card
  if (selectedScan) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          width: '100%',
          backgroundColor: '#050705',
          bgcolor: '#0a0f0a', // Clean, solid dark green background
          position: 'relative',
        }}
      >
        <Container
          maxWidth="md"
          sx={{
            pt: 'calc(env(safe-area-inset-top) + 20px)',
            pb: 4,
          }}
        >
          <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton onClick={handleBackFromDetail} sx={{ color: '#C5E1A5' }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" sx={{ color: '#F1F8E9', fontWeight: 700 }}>
              Scan Details
            </Typography>
          </Box>
          <ScanResultCard scan={selectedScan} result={selectedScan} />
        </Container>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        backgroundColor: '#050705',
        backgroundImage: 'url(/strainspotter-bg.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'relative',
      }}
    >
      <Container
        maxWidth="md"
        sx={{
          pt: 'calc(env(safe-area-inset-top) + 20px)',
          pb: 4,
        }}
      >
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={onBack} sx={{ color: '#C5E1A5' }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" sx={{ color: '#F1F8E9', fontWeight: 700 }}>
            Scan History
          </Typography>
        </Box>

        {/* Filters */}
        <Stack direction="row" spacing={1} sx={{ mb: 3 }} flexWrap="wrap" gap={1}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel sx={{ color: 'rgba(200, 230, 201, 0.7)' }}>Role</InputLabel>
            <Select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              label="Role"
              sx={{
                color: '#E8F5E9',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(124, 179, 66, 0.3)',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(124, 179, 66, 0.5)',
                },
                '& .MuiSvgIcon-root': {
                  color: 'rgba(200, 230, 201, 0.7)',
                },
              }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="dispensary">Dispensary</MenuItem>
              <MenuItem value="grower">Grower</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel sx={{ color: 'rgba(200, 230, 201, 0.7)' }}>Type</InputLabel>
            <Select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              label="Type"
              sx={{
                color: '#E8F5E9',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(124, 179, 66, 0.3)',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(124, 179, 66, 0.5)',
                },
                '& .MuiSvgIcon-root': {
                  color: 'rgba(200, 230, 201, 0.7)',
                },
              }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="packaged">Packaged</MenuItem>
              <MenuItem value="bud">Bud</MenuItem>
            </Select>
          </FormControl>

          <TextField
            size="small"
            placeholder="Filter by strain..."
            value={filterStrain}
            onChange={(e) => setFilterStrain(e.target.value)}
            sx={{
              flex: 1,
              minWidth: 150,
              '& .MuiOutlinedInput-root': {
                color: '#E8F5E9',
                '& fieldset': {
                  borderColor: 'rgba(124, 179, 66, 0.3)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(124, 179, 66, 0.5)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#7CB342',
                },
              },
            }}
          />
        </Stack>
        
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress sx={{ color: '#CDDC39' }} />
          </Box>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {!loading && !error && (
          <>
            {/* Analytics Summary */}
            {filteredScans.length > 0 && (
              <AnalyticsSummary scans={filteredScans} proRole={proRole} />
            )}

            {/* Scan List */}
            {filteredScans.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" sx={{ color: 'rgba(200, 230, 201, 0.7)' }}>
                  No scans found{filterRole || filterType || filterStrain ? ' matching filters' : ''}.
                </Typography>
              </Box>
            ) : (
              <Box>
                {filteredScans.map((scan) => (
                  <HistoryListItem
                    key={scan.id}
                    scan={scan}
                    onClick={() => handleScanSelect(scan)}
                  />
                ))}
              </Box>
            )}
          </>
        )}
      </Container>
    </Box>
  );
}

export default HistoryPage;
