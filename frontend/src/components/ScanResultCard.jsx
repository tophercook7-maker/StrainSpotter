import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
} from '@mui/material';
import { transformScanResult } from '../utils/scanResultUtils';

// AI Strain Details Panel Component
function AIStrainDetailsPanel({ 
  intensity, 
  effects, 
  flavors, 
  dispensaryNotes, 
  growerNotes, 
  warnings, 
  summary 
}) {

  // Only show if we have meaningful AI data
  if (
    !intensity &&
    (!effects || effects.length === 0) &&
    (!flavors || flavors.length === 0) &&
    (!dispensaryNotes || dispensaryNotes.length === 0) &&
    (!growerNotes || growerNotes.length === 0) &&
    (!warnings || warnings.length === 0) &&
    !summary
  ) {
    return null;
  }

  return (
    <Box
      sx={{
        mt: 3,
        p: 3,
        borderRadius: 2,
        background: 'rgba(0, 0, 0, 0.35)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(124, 179, 66, 0.2)',
      }}
    >
      <Typography
        variant="overline"
        sx={{
          color: 'rgba(200, 230, 201, 0.7)',
          textTransform: 'uppercase',
          letterSpacing: 1,
          fontSize: '0.75rem',
          fontWeight: 600,
        }}
      >
        AI STRAIN DETAILS
      </Typography>

      {typeof intensity === 'number' && (
        <Box sx={{ mt: 1 }}>
          <Typography
            variant="caption"
            sx={{
              color: 'rgba(200, 230, 201, 0.7)',
              display: 'block',
              mb: 0.5,
            }}
          >
            Estimated intensity
          </Typography>
          {/* Simple 5-dot meter */}
          <Box sx={{ mt: 0.5, display: 'flex', gap: 0.5 }}>
            {Array.from({ length: 5 }).map((_, i) => {
              const filled = intensity >= (i + 1) / 5;
              return (
                <Box
                  key={i}
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    opacity: filled ? 1 : 0.3,
                    backgroundColor: '#9AE66E',
                  }}
                />
              );
            })}
          </Box>
        </Box>
      )}

      {effects && effects.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography
            variant="caption"
            sx={{
              color: 'rgba(200, 230, 201, 0.7)',
              display: 'block',
              mb: 0.5,
            }}
          >
            Likely effects
          </Typography>
          <Box sx={{ mt: 0.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {effects.map((effect, idx) => (
              <Chip
                key={idx}
                size="small"
                label={typeof effect === 'string' ? effect : effect.name || String(effect)}
                sx={{
                  bgcolor: 'rgba(178, 255, 89, 0.08)',
                  border: '1px solid rgba(200, 255, 140, 0.85)',
                  color: '#e8ffca',
                  fontSize: '0.75rem',
                }}
              />
            ))}
          </Box>
        </Box>
      )}

      {flavors && flavors.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography
            variant="caption"
            sx={{
              color: 'rgba(200, 230, 201, 0.7)',
              display: 'block',
              mb: 0.5,
            }}
          >
            Aroma & flavor
          </Typography>
          <Box sx={{ mt: 0.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {flavors.map((flavor, idx) => (
              <Chip
                key={idx}
                size="small"
                label={typeof flavor === 'string' ? flavor : flavor.name || String(flavor)}
                sx={{
                  bgcolor: 'rgba(255, 248, 225, 0.06)',
                  border: '1px solid rgba(255, 236, 179, 0.7)',
                  color: '#fff8e1',
                  fontSize: '0.75rem',
                }}
              />
            ))}
          </Box>
        </Box>
      )}

      {summary && (
        <Box sx={{ mt: 2 }}>
          <Typography
            variant="caption"
            sx={{
              color: 'rgba(200, 230, 201, 0.7)',
              display: 'block',
              mb: 0.5,
            }}
          >
            Overview
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: 'rgba(224, 242, 241, 0.85)',
              lineHeight: 1.6,
              mt: 0.5,
            }}
          >
            {summary}
          </Typography>
        </Box>
      )}

      {dispensaryNotes && dispensaryNotes.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography
            variant="caption"
            sx={{
              color: 'rgba(200, 230, 201, 0.7)',
              display: 'block',
              mb: 0.5,
            }}
          >
            For dispensaries
          </Typography>
          <Box component="ul" sx={{ marginTop: 0.5, paddingLeft: 2.25, marginBottom: 0 }}>
            {dispensaryNotes.map((note, idx) => (
              <Box component="li" key={idx} sx={{ mb: 0.5 }}>
                <Typography variant="body2" sx={{ color: 'rgba(224, 242, 241, 0.85)' }}>
                  {note}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {growerNotes && growerNotes.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography
            variant="caption"
            sx={{
              color: 'rgba(200, 230, 201, 0.7)',
              display: 'block',
              mb: 0.5,
            }}
          >
            For growers
          </Typography>
          <Box component="ul" sx={{ marginTop: 0.5, paddingLeft: 2.25, marginBottom: 0 }}>
            {growerNotes.map((note, idx) => (
              <Box component="li" key={idx} sx={{ mb: 0.5 }}>
                <Typography variant="body2" sx={{ color: 'rgba(224, 242, 241, 0.85)' }}>
                  {note}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {warnings && warnings.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography
            variant="caption"
            sx={{
              color: 'rgba(200, 230, 201, 0.7)',
              display: 'block',
              mb: 0.5,
            }}
          >
            Warnings
          </Typography>
          <Box component="ul" sx={{ marginTop: 0.5, paddingLeft: 2.25, marginBottom: 0 }}>
            {warnings.map((w, idx) => (
              <Box component="li" key={idx} sx={{ mb: 0.5 }}>
                <Typography variant="body2" sx={{ color: 'rgba(255, 152, 152, 0.9)' }}>
                  {w}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}

// Packaged Product Card Component
function PackagedProductCard({ 
  strainName, 
  thc, 
  cbd, 
  summary, 
  effects, 
  flavors, 
  intensity, 
  dispensaryNotes, 
  growerNotes, 
  warnings,
  result,
  scan,
}) {
  // Get packaging insights for display (lineage and brand info)
  const packagingInsights = result?.packaging_insights || scan?.packaging_insights || null;
  const labelInsights = result?.label_insights || scan?.label_insights || null;
  // Lineage can come from packaging insights or be null
  const lineage = packagingInsights?.lineage || labelInsights?.lineage || null;
  const basic = packagingInsights?.basic || {};
  const details = packagingInsights?.package_details || {};
  const brandName = 
    basic.brand_name ||
    details.brand ||
    labelInsights?.brandName ||
    null;

  const showTHCCBD = thc != null || cbd != null;

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
      <AIStrainDetailsPanel
        intensity={intensity}
        effects={effects}
        flavors={flavors}
        dispensaryNotes={dispensaryNotes}
        growerNotes={growerNotes}
        warnings={warnings}
        summary={summary}
      />
    </>
  );
}

// Unknown Strain Card Component
// Handles both packaged products and buds with unknown strains
function UnknownStrainCard({ 
  isPackagedProduct,
  isPackagedKnown,
  isBudUnknown,
  summary, 
  effects, 
  flavors, 
  intensity, 
  dispensaryNotes, 
  growerNotes, 
  warnings 
}) {
  // If packaged product AND we already know the strain (from packaging),
  // do NOT render this card at all.
  if (isPackagedProduct && isPackagedKnown) {
    return null;
  }

  let title = 'Cannabis (strain unknown)';
  let subtitle = 'STRAIN UNKNOWN • 0%';
  let description = '';

  if (isPackagedProduct && !isPackagedKnown) {
    // Packaged product, but we couldn't extract a strain name
    title = 'Packaged product (strain unknown)';
    subtitle = 'STRAIN UNKNOWN • 0%';
    description =
      'This looks like a packaged product, but the strain name was not clearly detected from the label. THC, CBD, and other label details may still be available below.';
  } else if (!isPackagedProduct && isBudUnknown) {
    // Bud / live plant, unknown strain
    title = 'Cannabis (strain unknown)';
    subtitle = 'STRAIN UNKNOWN • 0%';
    description =
      'For live plants and buds, this is an estimated strain based on visual and label signals. Results may vary by grower and phenotype.';
  } else {
    // Fallback
    subtitle = 'STRAIN UNKNOWN • 0%';
    description =
      'Strain information is not available for this scan. Other label or AI details may still be shown below.';
  }

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
            {subtitle}
          </Typography>
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, color: '#E8F5E9', mb: 0.5 }}
          >
            {title}
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: 'rgba(200, 230, 201, 0.85)' }}
          >
            {description}
          </Typography>
        </CardContent>
      </Card>

      {/* AI Details Panel - still show even for unknown strains */}
      <AIStrainDetailsPanel
        intensity={intensity}
        effects={effects}
        flavors={flavors}
        dispensaryNotes={dispensaryNotes}
        growerNotes={growerNotes}
        warnings={warnings}
        summary={summary}
      />
    </>
  );
}

// Bud Estimate Card Component
function BudEstimateCard({ 
  strainName, 
  matchConfidence, 
  summary, 
  effects, 
  flavors, 
  intensity, 
  dispensaryNotes, 
  growerNotes, 
  warnings,
  result,
  scan,
}) {
  // Get lineage from packaging insights or label insights
  const packagingInsights = result?.packaging_insights || scan?.packaging_insights || null;
  const labelInsights = result?.label_insights || scan?.label_insights || null;
  const lineage = packagingInsights?.lineage || labelInsights?.lineage || null;

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
      <AIStrainDetailsPanel
        intensity={intensity}
        effects={effects}
        flavors={flavors}
        dispensaryNotes={dispensaryNotes}
        growerNotes={growerNotes}
        warnings={warnings}
        summary={summary}
      />
    </>
  );
}

function ScanResultCard({ result, scan, isGuest }) {
  if (!result && !scan) return null;

  // CRITICAL: Use transformScanResult to get canonical strain name and metadata
  // This ensures packaged products ALWAYS use label strain, NEVER visual/library guesses
  const transformed = transformScanResult(result || scan);
  if (!transformed) return null;

  // ===============================
  // NEW RENDER LOGIC
  // ===============================

  if (transformed.isPackagedKnown) {
    return (
      <PackagedProductCard
        strainName={transformed.strainName}
        thc={transformed.thc}
        cbd={transformed.cbd}
        summary={transformed.summary}
        effects={transformed.effectsTags}
        flavors={transformed.flavorTags}
        intensity={transformed.intensity}
        dispensaryNotes={transformed.dispensaryNotes}
        growerNotes={transformed.growerNotes}
        warnings={transformed.warnings}
        result={result}
        scan={scan}
      />
    );
  }

  // Unknown strain: either bud unknown OR packaged product without detected strain
  if (transformed.isBudUnknown || (transformed.isPackagedProduct && !transformed.isPackagedKnown)) {
    return (
      <UnknownStrainCard
        isPackagedProduct={transformed.isPackagedProduct}
        isPackagedKnown={transformed.isPackagedKnown}
        isBudUnknown={transformed.isBudUnknown}
        summary={transformed.summary}
        effects={transformed.effectsTags}
        flavors={transformed.flavorTags}
        intensity={transformed.intensity}
        dispensaryNotes={transformed.dispensaryNotes}
        growerNotes={transformed.growerNotes}
        warnings={transformed.warnings}
      />
    );
  }

  return (
    <BudEstimateCard
      strainName={transformed.strainName}
      matchConfidence={transformed.matchConfidence}
      summary={transformed.summary}
      effects={transformed.effectsTags}
      flavors={transformed.flavorTags}
      intensity={transformed.intensity}
      dispensaryNotes={transformed.dispensaryNotes}
      growerNotes={transformed.growerNotes}
      warnings={transformed.warnings}
      result={result}
      scan={scan}
    />
  );
}

export default ScanResultCard;
