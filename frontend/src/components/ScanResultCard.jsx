import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
} from '@mui/material';
import { transformScanResult } from '../utils/scanResultUtils';

function ScanResultCard({ result, scan, isGuest }) {
  if (!result && !scan) return null;

  // CRITICAL: Use transformScanResult to get canonical strain name and metadata
  // This ensures packaged products ALWAYS use label strain, NEVER visual/library guesses
  const transformed = transformScanResult(result || scan);
  if (!transformed) return null;

  // Use ONLY fields from transformScanResult - NEVER use old fields
  const strainName = transformed.strainName || 'Cannabis (strain unknown)';
  const strainSource = transformed.strainSource || 'none';
  const isPackagedProduct = transformed.isPackagedProduct || false;
  const matchConfidence = transformed.matchConfidence ?? null;

  // Determine match label based on strainSource
  let matchLabel = 'Strain estimate';
  if (strainSource === 'packaging') {
    matchLabel = 'Label-based match';
  } else if (strainSource === 'visual') {
    if (matchConfidence >= 0.7) {
      matchLabel = 'Visual match';
    } else {
      matchLabel = 'Best guess match';
    }
  } else if (strainSource === 'visual-low-confidence' || strainSource === 'none') {
    matchLabel = 'Strain unknown';
  }

  // Get packaging insights for display (but strain name comes from transformScanResult)
  const packagingInsights =
    transformed.packaging_insights || transformed.packagingInsights || null;

  // If packagingInsights exists, show rich packaging UI
  if (packagingInsights || isPackagedProduct) {
    const basic = packagingInsights?.basic || {};
    const potency = packagingInsights?.potency || {};
    const details = packagingInsights?.package_details || {};
    const confidence = packagingInsights?.confidence || {};

    // CRITICAL: Use strainName from transformScanResult (already prioritized correctly)
    const pkgStrainName = strainName;

    const brandName = 
      basic.brand_name ||
      details.brand ||
      'Unknown brand';

    // Extract THC/CBD from packaging or label insights
    const thc = 
      potency.thc_percent ??
      potency.thc_total_percent ??
      transformed.label_insights?.thc ??
      null;

    const cbd = 
      potency.cbd_percent ??
      potency.cbd_total_percent ??
      transformed.label_insights?.cbd ??
      null;

    const overallConf = 
      confidence.overall ?? 
      matchConfidence ??
      null;

    return (
      <Card
        variant="outlined"
        sx={{
          mb: 2,
          borderColor: 'rgba(165, 214, 167, 0.35)',
          background:
            'radial-gradient(circle at top left, rgba(129, 199, 132, 0.12), transparent 55%), #0b100a',
        }}
      >
        <CardContent>
          <Typography
            variant="overline"
            sx={{
              color: 'rgba(200, 230, 201, 0.7)',
              letterSpacing: 1,
            }}
          >
            {matchLabel}
            {overallConf != null &&
              ` • ${(overallConf * 100).toFixed(0)}%`}
          </Typography>

          <Typography
            variant="h6"
            sx={{ fontWeight: 700, color: '#E8F5E9', mb: 0.5 }}
          >
            {pkgStrainName}
          </Typography>

          <Typography
            variant="body2"
            sx={{ color: 'rgba(200, 230, 201, 0.85)', mb: 1 }}
          >
            {brandName}
          </Typography>

          <Box
            sx={{
              display: 'flex',
              gap: 2,
              flexWrap: 'wrap',
              mb: 1,
            }}
          >
            <Box>
              <Typography
                variant="caption"
                sx={{ color: 'rgba(200, 230, 201, 0.7)' }}
              >
                THC
              </Typography>
              <Typography
                variant="body1"
                sx={{ color: '#FFCC80', fontWeight: 600 }}
              >
                {thc != null ? `${thc}%` : '—'}
              </Typography>
            </Box>

            <Box>
              <Typography
                variant="caption"
                sx={{ color: 'rgba(200, 230, 201, 0.7)' }}
              >
                CBD
              </Typography>
              <Typography
                variant="body1"
                sx={{ color: '#B3E5FC', fontWeight: 600 }}
              >
                {cbd != null ? `${cbd}%` : '—'}
              </Typography>
            </Box>

            <Box>
              <Typography
                variant="caption"
                sx={{ color: 'rgba(200, 230, 201, 0.7)' }}
              >
                Package size
              </Typography>
              <Typography
                variant="body1"
                sx={{ color: '#E8F5E9', fontWeight: 500 }}
              >
                {details.net_weight_label || details.net_weight || '—'}
              </Typography>
            </Box>
          </Box>

          <Typography
            variant="body2"
            sx={{
              color: 'rgba(200, 230, 201, 0.8)',
              mt: 1,
            }}
          >
            This looks like a packaged product. THC, CBD, and core label
            information have been decoded from the photo.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  // Non-packaging fallback: simple plant/bud or legacy result
  return (
    <Card
      variant="outlined"
      sx={{
        mb: 2,
        borderColor: 'rgba(165, 214, 167, 0.35)',
        background:
          'radial-gradient(circle at top left, rgba(129, 199, 132, 0.12), transparent 55%), #0b100a',
      }}
    >
      <CardContent>
        <Typography
          variant="overline"
          sx={{
            color: 'rgba(200, 230, 201, 0.7)',
            letterSpacing: 1,
          }}
        >
          {matchLabel}
          {matchConf != null && ` • ${(matchConf * 100).toFixed(0)}%`}
        </Typography>

        <Typography
          variant="h6"
          sx={{ fontWeight: 700, color: '#E8F5E9', mb: 0.5 }}
        >
          {strainName}
        </Typography>

        <Typography
          variant="body2"
          sx={{ color: 'rgba(200, 230, 201, 0.85)' }}
        >
          For live plants and buds, this is an estimated strain based on visual
          and label signals. Results may vary by grower and phenotype.
        </Typography>
      </CardContent>
    </Card>
  );
}

export default ScanResultCard;
