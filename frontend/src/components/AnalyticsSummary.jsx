import React from 'react';
import { Box, Card, CardContent, Typography, Chip, Stack, Divider } from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import SpaIcon from '@mui/icons-material/Spa';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WarningIcon from '@mui/icons-material/Warning';

export default function AnalyticsSummary({ scans, proRole }) {
  if (!scans || scans.length === 0) {
    return null;
  }

  // Calculate stats
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthScans = scans.filter(s => new Date(s.created_at) >= startOfMonth);

  // Determine packaged vs bud
  const packagedScans = scans.filter(s => {
    const pkg = s.packaging_insights || s.label_insights || {};
    return !!(pkg.strainName || pkg.basic?.strain_name);
  });
  const budScans = scans.filter(s => {
    const pkg = s.packaging_insights || s.label_insights || {};
    return !(pkg.strainName || pkg.basic?.strain_name);
  });

  // Top strains
  const strainCounts = {};
  scans.forEach(scan => {
    const strainName = scan.canonical_strain_name || scan.matched_strain_name || 'Unknown';
    strainCounts[strainName] = (strainCounts[strainName] || 0) + 1;
  });
  const topStrains = Object.entries(strainCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, count]) => ({ name, count }));

  // Average AI intensity
  const intensities = scans
    .map(s => s.ai_summary?.intensity || s.ai_summary?.potency_score)
    .filter(i => typeof i === 'number');
  const avgIntensity = intensities.length > 0
    ? intensities.reduce((a, b) => a + b, 0) / intensities.length
    : null;

  // Warnings count
  const warningsCount = scans.filter(s => {
    const warnings = s.ai_summary?.risksAndWarnings || s.ai_summary?.warnings || [];
    return Array.isArray(warnings) && warnings.length > 0;
  }).length;

  // Pro role breakdown
  const dispensaryScans = scans.filter(s => s.pro_role === 'dispensary').length;
  const growerScans = scans.filter(s => s.pro_role === 'grower').length;

  return (
    <Card
      sx={{
        mb: 3,
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(124, 179, 66, 0.3)',
        backdropFilter: 'blur(6px)',
      }}
    >
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2, color: '#E8F5E9', fontWeight: 700 }}>
          Analytics Summary
        </Typography>

        <Stack spacing={2}>
          {/* This Month */}
          <Box>
            <Typography variant="body2" sx={{ color: 'rgba(200, 230, 201, 0.7)', mb: 0.5 }}>
              This Month
            </Typography>
            <Typography variant="h5" sx={{ color: '#E8F5E9', fontWeight: 700 }}>
              {thisMonthScans.length} scans
            </Typography>
          </Box>

          <Divider sx={{ borderColor: 'rgba(124, 179, 66, 0.2)' }} />

          {/* Packaged vs Bud */}
          <Box>
            <Typography variant="body2" sx={{ color: 'rgba(200, 230, 201, 0.7)', mb: 1 }}>
              Product Type
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
              <Chip
                icon={<LocalShippingIcon />}
                label={`${packagedScans.length} Packaged`}
                size="small"
                sx={{
                  bgcolor: 'rgba(124, 179, 66, 0.15)',
                  color: '#9AE66E',
                  border: '1px solid rgba(124, 179, 66, 0.3)',
                }}
              />
              <Chip
                icon={<SpaIcon />}
                label={`${budScans.length} Bud`}
                size="small"
                sx={{
                  bgcolor: 'rgba(124, 179, 66, 0.15)',
                  color: '#9AE66E',
                  border: '1px solid rgba(124, 179, 66, 0.3)',
                }}
              />
            </Stack>
            {scans.length > 0 && (
              <Typography variant="caption" sx={{ color: 'rgba(200, 230, 201, 0.6)', mt: 0.5, display: 'block' }}>
                {Math.round((packagedScans.length / scans.length) * 100)}% packaged
              </Typography>
            )}
          </Box>

          {/* Top Strains */}
          {topStrains.length > 0 && (
            <>
              <Divider sx={{ borderColor: 'rgba(124, 179, 66, 0.2)' }} />
              <Box>
                <Typography variant="body2" sx={{ color: 'rgba(200, 230, 201, 0.7)', mb: 1 }}>
                  Top Strains
                </Typography>
                <Stack spacing={0.5}>
                  {topStrains.map(({ name, count }, idx) => (
                    <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ color: '#E8F5E9' }}>
                        {idx + 1}. {name}
                      </Typography>
                      <Chip
                        label={count}
                        size="small"
                        sx={{
                          bgcolor: 'rgba(124, 179, 66, 0.15)',
                          color: '#9AE66E',
                          height: '20px',
                          fontSize: '0.7rem',
                        }}
                      />
                    </Box>
                  ))}
                </Stack>
              </Box>
            </>
          )}

          {/* Average Intensity */}
          {avgIntensity !== null && (
            <>
              <Divider sx={{ borderColor: 'rgba(124, 179, 66, 0.2)' }} />
              <Box>
                <Typography variant="body2" sx={{ color: 'rgba(200, 230, 201, 0.7)', mb: 0.5 }}>
                  Avg AI Intensity
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TrendingUpIcon sx={{ color: '#9AE66E', fontSize: '1.2rem' }} />
                  <Typography variant="h6" sx={{ color: '#E8F5E9', fontWeight: 700 }}>
                    {avgIntensity.toFixed(1)}/5
                  </Typography>
                </Box>
              </Box>
            </>
          )}

          {/* Warnings */}
          {warningsCount > 0 && (
            <>
              <Divider sx={{ borderColor: 'rgba(124, 179, 66, 0.2)' }} />
              <Box>
                <Typography variant="body2" sx={{ color: 'rgba(200, 230, 201, 0.7)', mb: 0.5 }}>
                  Warnings Encountered
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <WarningIcon sx={{ color: '#FFCC80', fontSize: '1.2rem' }} />
                  <Typography variant="h6" sx={{ color: '#FFCC80', fontWeight: 700 }}>
                    {warningsCount} scans
                  </Typography>
                </Box>
              </Box>
            </>
          )}

          {/* Pro Role Breakdown */}
          {(proRole || dispensaryScans > 0 || growerScans > 0) && (
            <>
              <Divider sx={{ borderColor: 'rgba(124, 179, 66, 0.2)' }} />
              <Box>
                <Typography variant="body2" sx={{ color: 'rgba(200, 230, 201, 0.7)', mb: 1 }}>
                  Pro Mode Breakdown
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                  {dispensaryScans > 0 && (
                    <Chip
                      label={`${dispensaryScans} Dispensary`}
                      size="small"
                      sx={{
                        bgcolor: 'rgba(124, 179, 66, 0.15)',
                        color: '#9AE66E',
                        border: '1px solid rgba(124, 179, 66, 0.3)',
                      }}
                    />
                  )}
                  {growerScans > 0 && (
                    <Chip
                      label={`${growerScans} Grower`}
                      size="small"
                      sx={{
                        bgcolor: 'rgba(124, 179, 66, 0.15)',
                        color: '#9AE66E',
                        border: '1px solid rgba(124, 179, 66, 0.3)',
                      }}
                    />
                  )}
                </Stack>
              </Box>
            </>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

