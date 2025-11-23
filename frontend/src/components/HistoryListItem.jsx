import React from 'react';
import { Card, CardContent, Box, Typography, Chip, Stack } from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import SpaIcon from '@mui/icons-material/Spa';
import { transformScanResult } from '../utils/scanResultUtils';

export default function HistoryListItem({ scan, onClick }) {
  if (!scan) return null;

  const transformed = transformScanResult(scan);
  const strainName = transformed?.strainName || scan.canonical_strain_name || scan.matched_strain_name || 'Unknown';
  const isPackaged = transformed?.isPackagedProduct || false;
  const matchConfidence = transformed?.matchConfidence || scan.canonical_match_confidence || scan.match_confidence || null;
  const intensity = transformed?.intensity || scan.ai_summary?.intensity || scan.ai_summary?.potency_score || null;
  const proRole = scan.pro_role;

  // Format date
  const date = new Date(scan.created_at);
  const dateStr = date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
  });
  const timeStr = date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });

  // Get thumbnail URL
  const thumbnailUrl = scan.image_url || null;

  return (
    <Card
      onClick={onClick}
      sx={{
        mb: 2,
        cursor: 'pointer',
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(124, 179, 66, 0.2)',
        backdropFilter: 'blur(6px)',
        transition: 'all 0.2s',
        '&:hover': {
          borderColor: 'rgba(124, 179, 66, 0.4)',
          background: 'rgba(255, 255, 255, 0.08)',
          transform: 'translateY(-2px)',
        },
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {/* Thumbnail */}
          {thumbnailUrl && (
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: 2,
                overflow: 'hidden',
                flexShrink: 0,
                background: 'rgba(0, 0, 0, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <img
                src={thumbnailUrl}
                alt="Scan"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </Box>
          )}

          {/* Content */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack spacing={1}>
              {/* Strain name and type */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography
                  variant="h6"
                  sx={{
                    color: '#E8F5E9',
                    fontWeight: 700,
                    fontSize: '1rem',
                    flex: 1,
                    minWidth: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {strainName}
                </Typography>
                <Chip
                  icon={isPackaged ? <LocalShippingIcon /> : <SpaIcon />}
                  label={isPackaged ? 'Packaged' : 'Bud'}
                  size="small"
                  sx={{
                    height: '24px',
                    fontSize: '0.7rem',
                    bgcolor: isPackaged 
                      ? 'rgba(124, 179, 66, 0.15)' 
                      : 'rgba(179, 229, 252, 0.15)',
                    color: isPackaged ? '#9AE66E' : '#B3E5FC',
                    border: `1px solid ${isPackaged ? 'rgba(124, 179, 66, 0.3)' : 'rgba(179, 229, 252, 0.3)'}`,
                  }}
                />
                {proRole && (
                  <Chip
                    label={proRole === 'dispensary' ? 'Dispensary' : 'Grower'}
                    size="small"
                    sx={{
                      height: '20px',
                      fontSize: '0.65rem',
                      bgcolor: 'rgba(124, 179, 66, 0.2)',
                      color: '#9AE66E',
                      border: '1px solid rgba(124, 179, 66, 0.4)',
                    }}
                  />
                )}
              </Box>

              {/* Date and time */}
              <Typography
                variant="caption"
                sx={{ color: 'rgba(200, 230, 201, 0.7)' }}
              >
                {dateStr} • {timeStr}
              </Typography>

              {/* Confidence and intensity badges */}
              <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.5}>
                {!isPackaged && matchConfidence !== null && (
                  <Chip
                    label={`${Math.round(matchConfidence * 100)}% match`}
                    size="small"
                    sx={{
                      height: '20px',
                      fontSize: '0.65rem',
                      bgcolor: matchConfidence >= 0.8 
                        ? 'rgba(76, 175, 80, 0.2)' 
                        : 'rgba(255, 152, 0, 0.2)',
                      color: matchConfidence >= 0.8 ? '#81C784' : '#FFB74D',
                      border: `1px solid ${matchConfidence >= 0.8 ? 'rgba(76, 175, 80, 0.3)' : 'rgba(255, 152, 0, 0.3)'}`,
                    }}
                  />
                )}
                {intensity !== null && (
                  <Chip
                    label={`Intensity: ${intensity.toFixed(1)}/5`}
                    size="small"
                    sx={{
                      height: '20px',
                      fontSize: '0.65rem',
                      bgcolor: 'rgba(255, 204, 128, 0.15)',
                      color: '#FFCC80',
                      border: '1px solid rgba(255, 204, 128, 0.3)',
                    }}
                  />
                )}
              </Stack>
            </Stack>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

