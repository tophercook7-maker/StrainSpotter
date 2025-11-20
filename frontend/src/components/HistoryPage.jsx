import React, { useEffect, useState } from "react";
import { Box, Container, Typography, CircularProgress, Alert, IconButton } from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ScanHistoryList from "./ScanHistoryList";
import { API_BASE } from "../config";

function HistoryPage({ onBack }) {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function loadScans() {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/api/analytics/summary`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) setScans(data.recentScans || []);
      } catch (e) {
        if (!cancelled) setErr(String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadScans();
    return () => {
      cancelled = true;
    };
  }, []);

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
            Scan history
          </Typography>
        </Box>
        
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress sx={{ color: '#CDDC39' }} />
          </Box>
        )}
        
        {err && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {err}
          </Alert>
        )}
        
        {!loading && !err && (
          <ScanHistoryList scans={scans} onSelect={(scan) => console.log("select scan", scan)} />
        )}
      </Container>
    </Box>
  );
}

export default HistoryPage;

