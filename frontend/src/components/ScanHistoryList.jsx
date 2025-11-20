import React from "react";
import { Box, Paper, Stack, Typography, Chip, Button } from "@mui/material";

function ScanHistoryList({ scans, onSelect }) {
  if (!scans || scans.length === 0) {
    return (
      <Paper
        elevation={6}
        sx={{
          p: 4,
          background: 'rgba(12, 20, 12, 0.95)',
          border: '1px solid rgba(124, 179, 66, 0.6)',
          borderRadius: 3,
          textAlign: 'center',
        }}
      >
        <Typography variant="body1" sx={{ color: 'rgba(224, 242, 241, 0.8)' }}>
          No scans yet.
        </Typography>
      </Paper>
    );
  }

  return (
    <Stack spacing={2}>
      {scans.map((scan) => {
        const id = scan.id;
        const createdAt = scan.created_at ? new Date(scan.created_at) : null;
        const strain_name = scan.strain_name || null;
        const brand_name = scan.brand_name || null;
        const product_type = scan.product_type || null;
        const thc_percent = scan.thc_percent || null;

        const title = strain_name || "Unknown strain";
        const subtitle = brand_name
          ? brand_name
          : product_type || "Cannabis product";

        return (
          <Paper
            key={id}
            elevation={6}
            sx={{
              p: 2,
              background: 'rgba(12, 20, 12, 0.95)',
              border: '1px solid rgba(124, 179, 66, 0.6)',
              borderRadius: 2,
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                borderColor: 'rgba(124, 179, 66, 1)',
                transform: 'translateY(-2px)',
              },
            }}
            onClick={() => onSelect && onSelect(scan)}
          >
            <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ color: '#F1F8E9', fontWeight: 600, mb: 0.5 }}>
                  {title}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(224, 242, 241, 0.8)', mb: 1 }}>
                  {subtitle}
                </Typography>
                {createdAt && (
                  <Typography variant="caption" sx={{ color: 'rgba(224, 242, 241, 0.6)' }}>
                    {createdAt.toLocaleDateString()} {createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                )}
              </Box>
              {thc_percent != null && (
                <Chip
                  label={`THC ${thc_percent}%`}
                  size="small"
                  color="success"
                  sx={{ fontWeight: 600 }}
                />
              )}
            </Stack>
          </Paper>
        );
      })}
    </Stack>
  );
}

export default ScanHistoryList;


