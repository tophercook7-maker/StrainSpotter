import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
} from '@mui/material';
import { transformScanResult } from '../utils/scanResultUtils';
import { deriveDisplayStrain } from '../utils/deriveDisplayStrain';

// AI Strain Details Panel Component
function AIStrainDetailsPanel({ transformed, scan }) {
  if (!transformed || !scan) return null;

  const aiSummary = transformed.ai_summary || scan.ai_summary || null;
  const labelInsights = transformed.label_insights || scan.label_insights || null;
  const packagingInsights = transformed.packaging_insights || scan.packaging_insights || null;

  // Only show if we have meaningful AI data
  if (!aiSummary && !labelInsights && !packagingInsights) return null;

  return (
    <Box
      sx={{
        mb: 2,
        p: 2,
        borderRadius: 2,
        background: 'rgba(5, 20, 10, 0.8)',
        border: '1px solid rgba(124, 179, 66, 0.3)',
      }}
    >
      <Typography
        variant="subtitle2"
        sx={{
          color: '#9CCC65',
          fontWeight: 600,
          mb: 1,
          textTransform: 'uppercase',
          letterSpacing: 1,
          fontSize: '0.75rem',
        }}
      >
        AI Details
      </Typography>

      {labelInsights && (
        <Box sx={{ mb: 1.5 }}>
          {labelInsights.thc != null && (
            <Typography variant="body2" sx={{ color: 'rgba(255, 204, 128, 0.9)', mb: 0.5 }}>
              THC: {labelInsights.thc}%
            </Typography>
          )}
          {labelInsights.cbd != null && (
            <Typography variant="body2" sx={{ color: 'rgba(179, 229, 252, 0.9)', mb: 0.5 }}>
              CBD: {labelInsights.cbd}%
            </Typography>
          )}
        </Box>
      )}

      {packagingInsights?.potency && (
        <Box sx={{ mb: 1.5 }}>
          {(packagingInsights.potency.thc_percent ?? packagingInsights.potency.thc_total_percent) != null && (
            <Typography variant="body2" sx={{ color: 'rgba(255, 204, 128, 0.9)', mb: 0.5 }}>
              THC: {packagingInsights.potency.thc_percent ?? packagingInsights.potency.thc_total_percent}%
            </Typography>
          )}
          {(packagingInsights.potency.cbd_percent ?? packagingInsights.potency.cbd_total_percent) != null && (
            <Typography variant="body2" sx={{ color: 'rgba(179, 229, 252, 0.9)', mb: 0.5 }}>
              CBD: {packagingInsights.potency.cbd_percent ?? packagingInsights.potency.cbd_total_percent}%
            </Typography>
          )}
        </Box>
      )}

      {aiSummary?.userFacingSummary && (
        <Typography
          variant="body2"
          sx={{
            color: 'rgba(224, 242, 241, 0.85)',
            lineHeight: 1.6,
            fontSize: '0.875rem',
          }}
        >
          {aiSummary.userFacingSummary}
        </Typography>
      )}
    </Box>
  );
}

function ScanResultCard({ result, scan, isGuest }) {
  if (!result && !scan) return null;

  // CRITICAL: Use transformScanResult to get canonical strain name and metadata
  // This ensures packaged products ALWAYS use label strain, NEVER visual/library guesses
  const transformed = transformScanResult(result || scan);
  if (!transformed) return null;

  // Destructure transformed fields
  const {
    strainName,
    strainSource,
    isPackagedProduct,
    matchConfidence,
    effectsTags,
    flavorTags,
  } = transformed;

  // Get display strain info for lineage and additional metadata
  const displayStrain = deriveDisplayStrain(result || scan);
  const lineage = displayStrain.displaySubline || null;

  // Get packaging insights for display
  const packagingInsights =
    transformed.packaging_insights || transformed.packagingInsights || null;
  const labelInsights = transformed.label_insights || scan?.label_insights || null;
  const aiSummary = transformed.ai_summary || scan?.ai_summary || null;

  // Extract additional data for display
  const basic = packagingInsights?.basic || {};
  const potency = packagingInsights?.potency || {};
  const details = packagingInsights?.package_details || {};
  const brandName = 
    basic.brand_name ||
    details.brand ||
    labelInsights?.brandName ||
    null;

  // Extract THC/CBD from packaging or label insights
  const thc = 
    potency.thc_percent ??
    potency.thc_total_percent ??
    labelInsights?.thc ??
    null;

  const cbd = 
    potency.cbd_percent ??
    potency.cbd_total_percent ??
    labelInsights?.cbd ??
    null;

  // Show THC/CBD badge only if available
  const showTHCCBD = thc != null || cbd != null;

  // Render based on strainSource
  if (strainSource === 'packaging') {
    // PACKAGED PRODUCT: Show strain name, lineage if available, THC/CBD badge
    return (
      <>
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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="overline"
                  sx={{
                    color: 'rgba(200, 230, 201, 0.7)',
                    letterSpacing: 1,
                    display: 'block',
                    mb: 0.5,
                  }}
                >
                  Label-based match
                </Typography>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 700, color: '#E8F5E9', mb: 0.5 }}
                >
                  {strainName}
                </Typography>
                {lineage && (
                  <Typography
                    variant="body2"
                    sx={{ color: 'rgba(200, 230, 201, 0.75)', fontSize: '0.875rem', mb: 0.5 }}
                  >
                    Lineage: {lineage}
                  </Typography>
                )}
                {brandName && (
                  <Typography
                    variant="body2"
                    sx={{ color: 'rgba(200, 230, 201, 0.85)', mb: 1 }}
                  >
                    {brandName}
                  </Typography>
                )}
              </Box>
              {showTHCCBD && (
                <Box sx={{ ml: 2, textAlign: 'right' }}>
                  {thc != null && (
                    <Chip
                      label={`THC ${thc}%`}
                      size="small"
                      sx={{
                        bgcolor: 'rgba(255, 204, 128, 0.15)',
                        color: '#FFCC80',
                        border: '1px solid rgba(255, 204, 128, 0.3)',
                        mb: 0.5,
                        display: 'block',
                      }}
                    />
                  )}
                  {cbd != null && (
                    <Chip
                      label={`CBD ${cbd}%`}
                      size="small"
                      sx={{
                        bgcolor: 'rgba(179, 229, 252, 0.15)',
                        color: '#B3E5FC',
                        border: '1px solid rgba(179, 229, 252, 0.3)',
                      }}
                    />
                  )}
                </Box>
              )}
            </Box>

            {details.net_weight_label || details.net_weight ? (
              <Typography
                variant="caption"
                sx={{ color: 'rgba(200, 230, 201, 0.7)', display: 'block', mt: 1 }}
              >
                Package size: {details.net_weight_label || details.net_weight}
              </Typography>
            ) : null}
          </CardContent>
        </Card>

        {/* AI Details Panel */}
        <AIStrainDetailsPanel transformed={transformed} scan={scan || result} />
      </>
    );
  }

  if (strainSource === 'visual') {
    // VISUAL MATCH: Show "Strain estimate – XX%" above name, then strainName
    return (
      <>
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
                display: 'block',
                mb: 0.5,
              }}
            >
              Strain estimate{matchConfidence != null ? ` – ${Math.round(matchConfidence * 100)}%` : ''}
            </Typography>
            <Typography
              variant="h6"
              sx={{ fontWeight: 700, color: '#E8F5E9', mb: 0.5 }}
            >
              {strainName}
            </Typography>
            {lineage && (
              <Typography
                variant="body2"
                sx={{ color: 'rgba(200, 230, 201, 0.75)', fontSize: '0.875rem', mb: 1 }}
              >
                Lineage: {lineage}
              </Typography>
            )}
            <Typography
              variant="body2"
              sx={{ color: 'rgba(200, 230, 201, 0.85)' }}
            >
              For live plants and buds, this is an estimated strain based on visual
              and label signals. Results may vary by grower and phenotype.
            </Typography>
          </CardContent>
        </Card>

        {/* AI Details Panel */}
        <AIStrainDetailsPanel transformed={transformed} scan={scan || result} />
      </>
    );
  }

  // UNKNOWN: Show "Cannabis (strain unknown)" with different subtitle for packaged vs bud
  const isUnknownPackaged = isPackagedProduct && (strainSource === 'packaged-unknown' || strainSource === 'none');
  const unknownSubtitle = isUnknownPackaged
    ? 'Label text could not be confidently decoded. You can still use the AI details below.'
    : 'For live plants and buds, this is an estimated strain based on visual and label signals. Results may vary by grower and phenotype.';

  return (
    <>
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
              display: 'block',
              mb: 0.5,
            }}
          >
            Strain unknown
          </Typography>
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, color: '#E8F5E9', mb: 0.5 }}
          >
            Cannabis (strain unknown)
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: 'rgba(200, 230, 201, 0.85)' }}
          >
            {unknownSubtitle}
          </Typography>
        </CardContent>
      </Card>

      {/* AI Details Panel */}
      <AIStrainDetailsPanel transformed={transformed} scan={scan || result} />
    </>
  );
}

export default ScanResultCard;
