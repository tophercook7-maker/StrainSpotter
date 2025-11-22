import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
} from '@mui/material';
import { deriveDisplayStrain } from '../utils/deriveDisplayStrain';

function ScanResultCard({ result, scan, isGuest }) {
  if (!result && !scan) return null;

  const effective = result || scan || {};
  
  // CRITICAL: Use deriveDisplayStrain to prioritize OCR/packaging strain
  const displayStrain = deriveDisplayStrain(effective);

  const packagingInsights =
    effective.packagingInsights || effective.packaging_insights || null;

  const matchQuality = effective.match_quality || 'none';
  const matchConf = effective.match_confidence ?? displayStrain.estimateConfidence ?? null;

  // Use primaryName from deriveDisplayStrain (prioritizes OCR/packaging)
  let strainName = displayStrain.primaryName;

  if (!strainName) {
    // Absolute fallback when we truly have nothing
    strainName =
      matchQuality === 'none'
        ? 'Cannabis (strain unknown)'
        : 'Best guess strain';
  }

  // Use estimateLabel from deriveDisplayStrain
  const matchLabel = displayStrain.estimateLabel || (() => {
    if (matchQuality === 'high') return 'High confidence match';
    if (matchQuality === 'medium') return 'Likely match';
    if (matchQuality === 'low') return 'Best guess match';
    if (matchQuality === 'label-fallback') return 'Label-based guess';
    return 'Strain estimate';
  })();

  // If packagingInsights exists, you can show your rich packaging UI.
  // To keep things fast and avoid freezes, use a lightweight header +
  // simple body instead of rendering massive raw payloads.

  if (packagingInsights || displayStrain.isPackagedProduct) {
    const basic = packagingInsights?.basic || {};
    const potency = packagingInsights?.potency || {};
    const details = packagingInsights?.package_details || {};
    const confidence = packagingInsights?.confidence || {};

    // Use displayStrain values (prioritizes OCR/packaging strain)
    const pkgStrainName = displayStrain.primaryName || strainName;

    const brandName = displayStrain.brandName || 
      basic.brand_name ||
      details.brand ||
      'Unknown brand';

    // Use displayStrain THC/CBD (from packaging or label_insights)
    const thc = displayStrain.thcPercent ??
      potency.thc_percent ??
      potency.thc_total_percent ??
      null;

    const cbd = displayStrain.cbdPercent ??
      potency.cbd_percent ??
      potency.cbd_total_percent ??
      null;

    const overallConf = displayStrain.estimateConfidence ?? 
      confidence.overall ?? 
      matchConf;

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
