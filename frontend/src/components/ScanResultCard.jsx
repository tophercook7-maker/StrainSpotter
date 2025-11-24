import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  Stack,
} from '@mui/material';
import { transformScanResult } from '../utils/scanResultUtils';
import { useProMode } from '../contexts/ProModeContext';

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

      {(intensity != null) && (
        <Box sx={{ mt: 1 }}>
          <Typography
            variant="caption"
            sx={{
              color: 'rgba(200, 230, 201, 0.7)',
              display: 'block',
              mb: 0.5,
            }}
          >
            Intensity
            {typeof intensity === 'string' && `: ${intensity}`}
          </Typography>
          {/* Simple 5-dot meter - convert string to number if needed */}
          {(() => {
            let intensityValue = 0;
            if (typeof intensity === 'number') {
              intensityValue = intensity;
            } else if (typeof intensity === 'string') {
              // Convert "LOW" | "MEDIUM" | "HIGH" to 0-1 scale
              const upper = intensity.toUpperCase();
              if (upper === 'HIGH') intensityValue = 0.9;
              else if (upper === 'MEDIUM') intensityValue = 0.6;
              else if (upper === 'LOW') intensityValue = 0.3;
            }
            return (
              <Box sx={{ mt: 0.5, display: 'flex', gap: 0.5 }}>
                {Array.from({ length: 5 }).map((_, i) => {
                  const filled = intensityValue >= (i + 1) / 5;
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
            );
          })()}
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
            {Array.isArray(effects) && effects.map((effect, idx) => (
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
            {Array.isArray(flavors) && flavors.map((flavor, idx) => (
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
            {Array.isArray(dispensaryNotes) && dispensaryNotes.map((note, idx) => (
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
            {Array.isArray(growerNotes) && growerNotes.map((note, idx) => (
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
            {Array.isArray(warnings) && warnings.map((w, idx) => (
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
  proRole,
  proEnabled,
  seedBank,
  growProfile,
  canonicalStrain,
  heroImageUrl,
  onViewSeeds,
}) {
  // Get packaging insights for display (lineage and brand info)
  // Safe property access with fallbacks
  const packagingInsights = result?.packaging_insights || scan?.packaging_insights || null;
  const labelInsights = result?.label_insights || scan?.label_insights || null;
  
  // Ensure seedBank and canonicalStrain are safely accessed
  const safeSeedBank = seedBank || null;
  const safeCanonicalStrain = canonicalStrain || null;
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
      {/* Hero Image */}
      {heroImageUrl && (
        <Box
          sx={{
            mb: 2,
            borderRadius: 2,
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'rgba(124, 179, 66, 0.3)',
          }}
        >
          <Box
            component="img"
            src={heroImageUrl}
            alt={strainName || 'Strain photo'}
            sx={{
              width: '100%',
              height: 220,
              objectFit: 'cover',
              display: 'block'
            }}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </Box>
      )}
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Typography
                  variant="overline"
                  sx={{
                    color: 'rgba(200, 230, 201, 0.7)',
                    letterSpacing: 1,
                  }}
                >
                  Label-based match
                </Typography>
                {proEnabled && proRole && (
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

      {/* Seed Bank & Grow Profile Section */}
      {(seedBank || growProfile) && (
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
              display: 'block',
              mb: 2,
            }}
          >
            Seed Info & Grow Profile
          </Typography>

          {/* Seed Bank Info */}
          {seedBank && (
            <Box sx={{ mb: 2 }}>
              {seedBank?.breeder ? (
                <Typography
                  variant="body2"
                  sx={{
                    color: 'rgba(200, 230, 201, 0.85)',
                    mb: 0.5,
                  }}
                >
                  <strong>Breeder:</strong> {seedBank.breeder}
                </Typography>
              ) : (
                <Typography
                  variant="body2"
                  sx={{
                    color: 'rgba(200, 230, 201, 0.6)',
                    mb: 0.5,
                  }}
                >
                  <strong>Breeder:</strong> Unknown breeder
                </Typography>
              )}
              {seedBank?.type && (
                <Typography
                  variant="body2"
                  sx={{
                    color: 'rgba(200, 230, 201, 0.85)',
                    mb: 0.5,
                  }}
                >
                  <strong>Type:</strong> {seedBank.type}
                </Typography>
              )}
              {seedBank?.seedBankUrl && (
                <Typography
                  variant="body2"
                  component="a"
                  href={seedBank.seedBankUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    color: '#9AE66E',
                    textDecoration: 'underline',
                    display: 'block',
                    mt: 1,
                  }}
                >
                  View seed vendors →
                </Typography>
              )}
            </Box>
          )}

          {/* Grow Profile Info */}
          {growProfile && (
            <Box>
              {growProfile.vigor && (
                <Typography
                  variant="body2"
                  sx={{
                    color: 'rgba(200, 230, 201, 0.85)',
                    mb: 0.5,
                  }}
                >
                  <strong>Vigor:</strong> {growProfile.vigor}
                </Typography>
              )}
              {growProfile.harvestWeeks && (
                <Typography
                  variant="body2"
                  sx={{
                    color: 'rgba(200, 230, 201, 0.85)',
                    mb: 0.5,
                  }}
                >
                  <strong>Harvest:</strong> ~{growProfile.harvestWeeks} weeks
                </Typography>
              )}
              {growProfile.yield && (
                <Typography
                  variant="body2"
                  sx={{
                    color: 'rgba(200, 230, 201, 0.85)',
                    mb: 0.5,
                  }}
                >
                  <strong>Yield:</strong> {growProfile.yield}
                </Typography>
              )}
            </Box>
          )}
        </Box>
      )}

      {/* Seed Vendor Buttons - Always show */}
      {onViewSeeds && (
        <Box
          sx={{
            mt: 3,
            p: 2,
            borderRadius: 2,
            background: 'rgba(124, 179, 66, 0.1)',
            border: '1px solid rgba(124, 179, 66, 0.3)',
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
              display: 'block',
              mb: 1.5,
            }}
          >
            Find Seeds
          </Typography>
          <Stack direction="column" spacing={1.5}>
            {canonicalStrain?.name || strainName ? (
              <Button
                variant="contained"
                fullWidth
                onClick={() => onViewSeeds({
                  strainName: canonicalStrain?.name || strainName,
                  strainSlug: canonicalStrain?.slug,
                  scan: scan,
                  result: result,
                })}
                sx={{
                  py: 1.5,
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #7CB342 0%, #9CCC65 100%)',
                  boxShadow: '0 4px 12px rgba(124, 179, 66, 0.3)',
                  textTransform: 'none',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #9CCC65 0%, #AED581 100%)',
                    boxShadow: '0 6px 16px rgba(124, 179, 66, 0.4)',
                  },
                }}
              >
                🌾 View Seeds for {canonicalStrain?.name || strainName}
              </Button>
            ) : null}
            <Button
              variant="outlined"
              fullWidth
              onClick={() => onViewSeeds({})}
              sx={{
                py: 1.5,
                fontSize: '0.95rem',
                fontWeight: 600,
                borderRadius: '8px',
                border: '2px solid rgba(124, 179, 66, 0.6)',
                color: '#9CCC65',
                textTransform: 'none',
                '&:hover': {
                  border: '2px solid rgba(124, 179, 66, 0.9)',
                  background: 'rgba(124, 179, 66, 0.15)',
                },
              }}
            >
              🌱 Browse All Seeds
            </Button>
          </Stack>
        </Box>
      )}
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
  warnings,
  canonicalStrain,
  onViewSeeds,
  result,
  scan,
}) {
  // If packaged product AND we already know the strain (from packaging),
  // OR if canonical.confidence === 1 (certain match), do NOT render this card at all.
  if (isPackagedProduct && (isPackagedKnown || (canonicalStrain && canonicalStrain.confidence === 1))) {
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

      {/* Seed Vendor Buttons - Always show, even for unknown strains */}
      {onViewSeeds && (
        <Box
          sx={{
            mt: 3,
            p: 2,
            borderRadius: 2,
            background: 'rgba(124, 179, 66, 0.1)',
            border: '1px solid rgba(124, 179, 66, 0.3)',
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
              display: 'block',
              mb: 1.5,
            }}
          >
            Find Seeds
          </Typography>
          <Stack direction="column" spacing={1.5}>
            {canonicalStrain?.name ? (
              <Button
                variant="contained"
                fullWidth
                onClick={() => onViewSeeds({
                  strainName: canonicalStrain?.name,
                  strainSlug: canonicalStrain?.slug,
                  scan: scan,
                  result: result,
                })}
                sx={{
                  py: 1.5,
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #7CB342 0%, #9CCC65 100%)',
                  boxShadow: '0 4px 12px rgba(124, 179, 66, 0.3)',
                  textTransform: 'none',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #9CCC65 0%, #AED581 100%)',
                    boxShadow: '0 6px 16px rgba(124, 179, 66, 0.4)',
                  },
                }}
              >
                🌾 View Seeds for {canonicalStrain?.name}
              </Button>
            ) : null}
            <Button
              variant="outlined"
              fullWidth
              onClick={() => onViewSeeds({})}
              sx={{
                py: 1.5,
                fontSize: '0.95rem',
                fontWeight: 600,
                borderRadius: '8px',
                border: '2px solid rgba(124, 179, 66, 0.6)',
                color: '#9CCC65',
                textTransform: 'none',
                '&:hover': {
                  border: '2px solid rgba(124, 179, 66, 0.9)',
                  background: 'rgba(124, 179, 66, 0.15)',
                },
              }}
            >
              🌱 Browse All Seeds
            </Button>
          </Stack>
        </Box>
      )}
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
  seedBank,
  growProfile,
  canonicalStrain,
  heroImageUrl,
  onViewSeeds,
}) {
  // Get lineage from packaging insights or label insights
  const packagingInsights = result?.packaging_insights || scan?.packaging_insights || null;
  const labelInsights = result?.label_insights || scan?.label_insights || null;
  const lineage = packagingInsights?.lineage || labelInsights?.lineage || null;

  return (
    <>
      {/* Hero Image */}
      {heroImageUrl && (
        <Box
          sx={{
            mb: 2,
            borderRadius: 2,
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'rgba(124, 179, 66, 0.3)',
          }}
        >
          <Box
            component="img"
            src={heroImageUrl}
            alt={strainName || 'Strain photo'}
            sx={{
              width: '100%',
              height: 220,
              objectFit: 'cover',
              display: 'block'
            }}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </Box>
      )}
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
          {/* Don't show "strain estimate" if canonical.confidence === 1 (certain match) */}
          {canonicalStrain && canonicalStrain.confidence === 1 ? (
            <Typography
              variant="overline"
              sx={{
                color: 'rgba(200, 230, 201, 0.7)',
                letterSpacing: 1,
                display: 'block',
                mb: 0.5,
              }}
            >
              Strain match
            </Typography>
          ) : (
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
          )}
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

      {/* Seed Bank & Grow Profile Section */}
      {(seedBank || growProfile) && (
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
              display: 'block',
              mb: 2,
            }}
          >
            Seed Info & Grow Profile
          </Typography>

          {/* Seed Bank Info */}
          {seedBank && (
            <Box sx={{ mb: 2 }}>
              {seedBank?.breeder ? (
                <Typography
                  variant="body2"
                  sx={{
                    color: 'rgba(200, 230, 201, 0.85)',
                    mb: 0.5,
                  }}
                >
                  <strong>Breeder:</strong> {seedBank.breeder}
                </Typography>
              ) : (
                <Typography
                  variant="body2"
                  sx={{
                    color: 'rgba(200, 230, 201, 0.6)',
                    mb: 0.5,
                  }}
                >
                  <strong>Breeder:</strong> Unknown breeder
                </Typography>
              )}
              {seedBank?.type && (
                <Typography
                  variant="body2"
                  sx={{
                    color: 'rgba(200, 230, 201, 0.85)',
                    mb: 0.5,
                  }}
                >
                  <strong>Type:</strong> {seedBank.type}
                </Typography>
              )}
              {seedBank?.seedBankUrl && (
                <Typography
                  variant="body2"
                  component="a"
                  href={seedBank.seedBankUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    color: '#9AE66E',
                    textDecoration: 'underline',
                    display: 'block',
                    mt: 1,
                  }}
                >
                  View seed vendors →
                </Typography>
              )}
            </Box>
          )}

          {/* Grow Profile Info */}
          {growProfile && (
            <Box>
              {growProfile.vigor && (
                <Typography
                  variant="body2"
                  sx={{
                    color: 'rgba(200, 230, 201, 0.85)',
                    mb: 0.5,
                  }}
                >
                  <strong>Vigor:</strong> {growProfile.vigor}
                </Typography>
              )}
              {growProfile.harvestWeeks && (
                <Typography
                  variant="body2"
                  sx={{
                    color: 'rgba(200, 230, 201, 0.85)',
                    mb: 0.5,
                  }}
                >
                  <strong>Harvest:</strong> ~{growProfile.harvestWeeks} weeks
                </Typography>
              )}
              {growProfile.yield && (
                <Typography
                  variant="body2"
                  sx={{
                    color: 'rgba(200, 230, 201, 0.85)',
                    mb: 0.5,
                  }}
                >
                  <strong>Yield:</strong> {growProfile.yield}
                </Typography>
              )}
            </Box>
          )}
        </Box>
      )}

      {/* Seed Vendor Buttons - Always show */}
      {onViewSeeds && (
        <Box
          sx={{
            mt: 3,
            p: 2,
            borderRadius: 2,
            background: 'rgba(124, 179, 66, 0.1)',
            border: '1px solid rgba(124, 179, 66, 0.3)',
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
              display: 'block',
              mb: 1.5,
            }}
          >
            Find Seeds
          </Typography>
          <Stack direction="column" spacing={1.5}>
            {canonicalStrain?.name || strainName ? (
              <Button
                variant="contained"
                fullWidth
                onClick={() => onViewSeeds({
                  strainName: canonicalStrain?.name || strainName,
                  strainSlug: canonicalStrain?.slug,
                  scan: scan,
                  result: result,
                })}
                sx={{
                  py: 1.5,
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #7CB342 0%, #9CCC65 100%)',
                  boxShadow: '0 4px 12px rgba(124, 179, 66, 0.3)',
                  textTransform: 'none',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #9CCC65 0%, #AED581 100%)',
                    boxShadow: '0 6px 16px rgba(124, 179, 66, 0.4)',
                  },
                }}
              >
                🌾 View Seeds for {canonicalStrain?.name || strainName}
              </Button>
            ) : null}
            <Button
              variant="outlined"
              fullWidth
              onClick={() => onViewSeeds({})}
              sx={{
                py: 1.5,
                fontSize: '0.95rem',
                fontWeight: 600,
                borderRadius: '8px',
                border: '2px solid rgba(124, 179, 66, 0.6)',
                color: '#9CCC65',
                textTransform: 'none',
                '&:hover': {
                  border: '2px solid rgba(124, 179, 66, 0.9)',
                  background: 'rgba(124, 179, 66, 0.15)',
                },
              }}
            >
              🌱 Browse All Seeds
            </Button>
          </Stack>
        </Box>
      )}
    </>
  );
}

// Helper: safely resolve best strain name for linking to seeds
const getCanonicalStrainName = (scan, result) => {
  const scanResult = result || scan?.result || {};
  
  const candidates = [
    scanResult.canonical?.name,
    scanResult.seedBank?.name,
    scanResult.packaging?.strainName,
    scanResult.label?.strainName,
    scanResult.packaging_insights?.strainName,
    scanResult.label_insights?.strainName,
    scan?.strainName,
    scan?.matched_strain_name,
  ];
  
  const found = candidates.find(
    (name) => typeof name === 'string' && name.trim().length > 0
  );
  
  return found || 'this strain';
};

function ScanResultCard({ result, scan, isGuest, onViewSeeds }) {
  // Defensive null checks at the top
  if (!scan && !result) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Scan ready, but details are missing
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
          We processed your scan, but couldn't load the full details. You can check it in your scan history.
        </Typography>
        {onViewSeeds && (
          <Button
            variant="outlined"
            onClick={() => onViewSeeds({})}
            sx={{
              border: '2px solid rgba(124, 179, 66, 0.6)',
              color: '#9CCC65',
            }}
          >
            🌱 Browse All Seeds
          </Button>
        )}
      </Box>
    );
  }

  // Ensure we have at least an id
  const scanId = scan?.id || scan?.scanId || result?.id || result?.scanId;
  if (!scanId) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Preparing your result…
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
          Your scan is processing. This may take a moment.
        </Typography>
        {onViewSeeds && (
          <Button
            variant="outlined"
            onClick={() => onViewSeeds({})}
            sx={{
              border: '2px solid rgba(124, 179, 66, 0.6)',
              color: '#9CCC65',
            }}
          >
            🌱 Browse All Seeds
          </Button>
        )}
      </Box>
    );
  }

  const { proRole, proEnabled } = useProMode();

  // CRITICAL: Use transformScanResult to get canonical strain name and metadata
  // This ensures packaged products ALWAYS use label strain, NEVER visual/library guesses
  // Safely access result/scan with fallbacks
  const scanData = result || scan || {};
  const transformed = transformScanResult(scanData);
  
  // Get canonical strain name for seed linking
  const canonicalStrainName = getCanonicalStrainName(scan, result);
  
  // Handle transform failure gracefully
  if (!transformed) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Preparing your result…
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
          Your scan is processing. This may take a moment.
        </Typography>
        {onViewSeeds && (
          <Button
            variant="outlined"
            onClick={() => onViewSeeds({})}
            sx={{
              border: '2px solid rgba(124, 179, 66, 0.6)',
              color: '#9CCC65',
            }}
          >
            🌱 Browse All Seeds
          </Button>
        )}
      </Box>
    );
  }

  // ===============================
  // NEW RENDER LOGIC
  // ===============================

  // For packaged products with canonical.confidence === 1, show PackagedProductCard
  // Don't show "strain unknown" or "strain estimate" copy
  // Safe property access
  const canonicalStrain = transformed?.canonicalStrain || null;
  const isCanonicalConfident = canonicalStrain && canonicalStrain.confidence === 1;
  const shouldShowPackagedCard = transformed?.isPackagedKnown || (transformed?.isPackagedProduct && isCanonicalConfident);

  if (shouldShowPackagedCard) {
    return (
      <PackagedProductCard
        strainName={transformed?.strainName || null}
        thc={transformed?.thc || null}
        cbd={transformed?.cbd || null}
        summary={transformed?.summary || null}
        effects={transformed?.effectsTags || []}
        flavors={transformed?.flavorTags || []}
        intensity={transformed?.intensity || null}
        dispensaryNotes={transformed?.dispensaryNotes || []}
        growerNotes={transformed?.growerNotes || []}
        warnings={transformed?.warnings || []}
        result={result}
        scan={scan}
        proRole={proRole}
        proEnabled={proEnabled}
        seedBank={transformed?.seedBank || null}
        growProfile={transformed?.growProfile || null}
        canonicalStrain={canonicalStrain}
        heroImageUrl={transformed?.heroImageUrl || null}
        onViewSeeds={onViewSeeds}
      />
    );
  }

  // Unknown strain: either bud unknown OR packaged product without detected strain
  // BUT: Don't show if canonical.confidence === 1 (we know the strain)
  if ((transformed?.isBudUnknown || (transformed?.isPackagedProduct && !transformed?.isPackagedKnown)) && !isCanonicalConfident) {
    return (
      <UnknownStrainCard
        isPackagedProduct={transformed?.isPackagedProduct || false}
        isPackagedKnown={transformed?.isPackagedKnown || false}
        isBudUnknown={transformed?.isBudUnknown || false}
        summary={transformed?.summary || null}
        effects={transformed?.effectsTags || []}
        flavors={transformed?.flavorTags || []}
        intensity={transformed?.intensity || null}
        dispensaryNotes={transformed?.dispensaryNotes || []}
        growerNotes={transformed?.growerNotes || []}
        warnings={transformed?.warnings || []}
        canonicalStrain={canonicalStrain}
        onViewSeeds={onViewSeeds}
        result={result}
        scan={scan}
      />
    );
  }

  // Bud estimate card - only show "strain estimate" if NOT canonical.confidence === 1
  // For packaged products with canonical.confidence === 1, we already showed PackagedProductCard above
  if (transformed?.isPackagedProduct && isCanonicalConfident) {
    // This shouldn't happen, but handle gracefully
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Processing result…
        </Typography>
      </Box>
    );
  }

  return (
    <BudEstimateCard
      strainName={transformed?.strainName || 'Unknown Strain'}
      matchConfidence={transformed?.matchConfidence || null}
      summary={transformed?.summary || null}
      effects={transformed?.effectsTags || []}
      flavors={transformed?.flavorTags || []}
      intensity={transformed?.intensity || null}
      dispensaryNotes={transformed?.dispensaryNotes || []}
      growerNotes={transformed?.growerNotes || []}
      warnings={transformed?.warnings || []}
      result={result}
      scan={scan}
      seedBank={transformed?.seedBank || null}
      growProfile={transformed?.growProfile || null}
      canonicalStrain={canonicalStrain}
      heroImageUrl={transformed?.heroImageUrl || null}
      onViewSeeds={onViewSeeds}
    />
  );
}

export default ScanResultCard;
