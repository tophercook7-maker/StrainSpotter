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
import { useStrainImage } from '../hooks/useStrainImage';

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
  growProfile,
  canonicalStrain,
  heroImageUrl,
  plantHealth: plantHealthProp,
  packagingInsights: packagingInsightsProp,
  labelInsights: labelInsightsProp,
  displayBreeder,
  displayType,
  aiSummary: aiSummaryProp,
}) {
  // Get packaging insights for display (lineage and brand info)
  // Safe property access with fallbacks - prefer props, then result/scan
  const packagingInsights = packagingInsightsProp || result?.packaging_insights || scan?.packaging_insights || scan?.result?.packaging_insights || null;
  const labelInsights = labelInsightsProp || result?.label_insights || scan?.label_insights || scan?.result?.label_insights || null;
  const plantHealthData = plantHealthProp || result?.plant_health || scan?.plant_health || scan?.result?.plant_health || null;
  const growProfileData = growProfile || result?.grow_profile || scan?.grow_profile || scan?.result?.grow_profile || null;
  const aiSummary = aiSummaryProp || result?.ai_summary || result?.aiSummary || scan?.ai_summary || scan?.aiSummary || scan?.result?.ai_summary || scan?.result?.aiSummary || null;
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
            '#0a0f0a', // Clean, solid dark green background
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
              {(displayBreeder || displayType) && (
                <Box sx={{ mb: 0.5 }}>
                  {displayBreeder && (
                    <Typography
                      variant="body2"
                      sx={{ color: 'rgba(200, 230, 201, 0.85)', fontSize: '0.875rem', mb: 0.25 }}
                    >
                      <strong>Breeder:</strong> {displayBreeder}
                    </Typography>
                  )}
                  {displayType && (
                    <Typography
                      variant="body2"
                      sx={{ color: 'rgba(200, 230, 201, 0.75)', fontSize: '0.875rem', mb: 0.25 }}
                    >
                      <strong>Type:</strong> {displayType}
                    </Typography>
                  )}
                </Box>
              )}
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

        </CardContent>
      </Card>

      {/* Packaging Summary Section */}
      {packagingInsights && (
        <Box
          sx={{
            mt: 3,
            p: 3,
            borderRadius: 2,
            background: 'rgba(0, 0, 0, 0.35)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(124, 179, 66, 0.2)',
            mb: 2,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              color: 'rgba(200, 230, 201, 0.9)',
              fontWeight: 600,
              fontSize: '1rem',
              mb: 1,
            }}
          >
            Packaging summary
          </Typography>
          
          {packagingInsights.overallConfidence != null && (
            <Typography variant="body2" sx={{ color: 'rgba(200, 230, 201, 0.85)', mb: 0.5 }}>
              Match confidence: {((packagingInsights.overallConfidence || 0) * 100).toFixed(0)}%
            </Typography>
          )}
          
          {packagingInsights.thc != null && (
            <Typography variant="body2" sx={{ color: 'rgba(200, 230, 201, 0.85)', mb: 0.5, mt: 0.5 }}>
              <strong>Label THC:</strong> {packagingInsights.thc}%
            </Typography>
          )}
          
          {packagingInsights.cbd != null && (
            <Typography variant="body2" sx={{ color: 'rgba(200, 230, 201, 0.85)', mb: 0.5, mt: 0.5 }}>
              <strong>Label CBD:</strong> {packagingInsights.cbd}%
            </Typography>
          )}
        </Box>
      )}

      {/* Additional Packaging Details (if needed) */}
      {(labelInsights && (labelInsights.batchNumber || labelInsights.packagedDate || labelInsights.testingLab)) && (
        <Box
          sx={{
            mt: 2,
            p: 3,
            borderRadius: 2,
            background: 'rgba(0, 0, 0, 0.35)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(124, 179, 66, 0.2)',
            mb: 2,
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
            Additional Details
          </Typography>
          
          {labelInsights?.batchNumber && (
            <Typography variant="body2" sx={{ color: 'rgba(200, 230, 201, 0.85)', mb: 0.5 }}>
              <strong>Batch:</strong> {labelInsights.batchNumber}
            </Typography>
          )}
          
          {labelInsights?.packagedDate && (
            <Typography variant="body2" sx={{ color: 'rgba(200, 230, 201, 0.85)', mb: 0.5 }}>
              <strong>Packaged:</strong> {labelInsights.packagedDate}
            </Typography>
          )}
          
          {labelInsights?.testingLab && (
            <Typography variant="body2" sx={{ color: 'rgba(200, 230, 201, 0.85)', mb: 0.5 }}>
              <strong>Testing Lab:</strong> {labelInsights.testingLab}
            </Typography>
          )}
        </Box>
      )}

      {/* Plant Health Section - Show whenever plant health or grow profile exists (independent of strain/aiSummary) */}
      {(plantHealthData || growProfileData) && (
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
            Plant Health & Diagnostics
          </Typography>
          
          {plantHealthData?.overall_health && (
            <Typography variant="body2" sx={{ color: 'rgba(200, 230, 201, 0.85)', mb: 0.5 }}>
              <strong>Overall Health:</strong> {plantHealthData.overall_health}
            </Typography>
          )}
          
          {plantHealthData?.issues && Array.isArray(plantHealthData.issues) && plantHealthData.issues.length > 0 && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2" sx={{ color: 'rgba(255, 152, 152, 0.9)', mb: 0.5, fontWeight: 600 }}>
                Issues Detected:
              </Typography>
              <Box component="ul" sx={{ marginTop: 0.5, paddingLeft: 2.25, marginBottom: 0 }}>
                {plantHealthData.issues.map((issue, idx) => (
                  <Box component="li" key={idx} sx={{ mb: 0.5 }}>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 152, 152, 0.9)' }}>
                      {issue}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
          
          {plantHealthData?.recommendations && Array.isArray(plantHealthData.recommendations) && plantHealthData.recommendations.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ color: 'rgba(200, 230, 201, 0.85)', mb: 0.5, fontWeight: 600 }}>
                Recommendations:
              </Typography>
              <Box component="ul" sx={{ marginTop: 0.5, paddingLeft: 2.25, marginBottom: 0 }}>
                {plantHealthData.recommendations.map((rec, idx) => (
                  <Box component="li" key={idx} sx={{ mb: 0.5 }}>
                    <Typography variant="body2" sx={{ color: 'rgba(200, 230, 201, 0.85)' }}>
                      {rec}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </Box>
      )}

      {/* Effects & Flavors Section - Use safe arrays from props */}
      {aiSummary && (effects.length > 0 || flavors.length > 0) && (
        <Box
          sx={{
            mt: 3,
            p: 3,
            borderRadius: 2,
            background: 'rgba(0, 0, 0, 0.35)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(124, 179, 66, 0.2)',
            mb: 2,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              color: 'rgba(200, 230, 201, 0.9)',
              fontWeight: 600,
              fontSize: '1rem',
              mb: 1,
            }}
          >
            Effects & flavors
          </Typography>
          
          {effects.length > 0 && (
            <Typography variant="body2" sx={{ color: 'rgba(200, 230, 201, 0.85)', mb: 0.5, mt: 0.5 }}>
              <strong>Effects:</strong> {effects.join(", ")}
            </Typography>
          )}
          
          {flavors.length > 0 && (
            <Typography variant="body2" sx={{ color: 'rgba(200, 230, 201, 0.85)', mb: 0.5, mt: 0.5 }}>
              <strong>Flavors:</strong> {flavors.join(", ")}
            </Typography>
          )}
        </Box>
      )}

      {/* Notes Section - Use safe arrays from props */}
      {aiSummary && (dispensaryNotes.length > 0 || growerNotes.length > 0) && (
        <Box
          sx={{
            mt: 2,
            p: 3,
            borderRadius: 2,
            background: 'rgba(0, 0, 0, 0.35)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(124, 179, 66, 0.2)',
            mb: 2,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              color: 'rgba(200, 230, 201, 0.9)',
              fontWeight: 600,
              fontSize: '1rem',
              mb: 1,
            }}
          >
            Notes
          </Typography>
          
          {dispensaryNotes.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ color: 'rgba(200, 230, 201, 0.85)', mb: 0.5, fontWeight: 600 }}>
                <strong>Dispensary:</strong>
              </Typography>
              <Box component="ul" sx={{ paddingLeft: 2.25, margin: '4px 0', mt: 0.5 }}>
                {dispensaryNotes.map((n, idx) => (
                  <Box component="li" key={idx} sx={{ mb: 0.5 }}>
                    <Typography variant="body2" sx={{ color: 'rgba(200, 230, 201, 0.85)' }}>
                      {n}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
          
          {growerNotes.length > 0 && (
            <Box>
              <Typography variant="body2" sx={{ color: 'rgba(200, 230, 201, 0.85)', mb: 0.5, fontWeight: 600 }}>
                <strong>Grower:</strong>
              </Typography>
              <Box component="ul" sx={{ paddingLeft: 2.25, margin: '4px 0', mt: 0.5 }}>
                {growerNotes.map((n, idx) => (
                  <Box component="li" key={idx} sx={{ mb: 0.5 }}>
                    <Typography variant="body2" sx={{ color: 'rgba(200, 230, 201, 0.85)' }}>
                      {n}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </Box>
      )}

      {/* Potency & Warnings Section - Use safe arrays from props */}
      {aiSummary && (aiSummary.thc != null || aiSummary.cbd != null || warnings.length > 0) && (
        <Box
          sx={{
            mt: 2,
            p: 3,
            borderRadius: 2,
            background: 'rgba(0, 0, 0, 0.35)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(124, 179, 66, 0.2)',
            mb: 2,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              color: 'rgba(200, 230, 201, 0.9)',
              fontWeight: 600,
              fontSize: '1rem',
              mb: 1,
            }}
          >
            Potency & Warnings
          </Typography>
          
          {(aiSummary.thc != null || aiSummary.cbd != null) && (
            <Box sx={{ mb: 2 }}>
              {aiSummary.thc != null && (
                <Typography variant="body2" sx={{ color: 'rgba(200, 230, 201, 0.85)', mb: 0.5 }}>
                  <strong>Estimated THC:</strong> {aiSummary.thc}%
                </Typography>
              )}
              {aiSummary.cbd != null && (
                <Typography variant="body2" sx={{ color: 'rgba(200, 230, 201, 0.85)', mb: 0.5 }}>
                  <strong>Estimated CBD:</strong> {aiSummary.cbd}%
                </Typography>
              )}
            </Box>
          )}
          
          {warnings.length > 0 && (
            <Box>
              <Typography variant="body2" sx={{ color: 'rgba(255, 152, 152, 0.9)', mb: 0.5, fontWeight: 600 }}>
                Warnings:
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
  result,
  scan,
  plantHealth,
  growProfile,
  displayName,
  hasStrainName,
  isLikelyPlantOnly,
  aiSummary: aiSummaryProp,
}) {
  // If packaged product AND we already know the strain (from packaging),
  // OR if canonical.confidence === 1 (certain match), do NOT render this card at all.
  if (isPackagedProduct && (isPackagedKnown || (canonicalStrain && canonicalStrain.confidence === 1))) {
    return null;
  }

  // Extract aiSummary from props, result, or scan (same pattern as PackagedProductCard)
  const aiSummary = aiSummaryProp || result?.ai_summary || result?.aiSummary || scan?.ai_summary || scan?.aiSummary || scan?.result?.ai_summary || scan?.result?.aiSummary || null;

  // Determine if this is a plant-only scan (has plant health but no strain)
  const hasPlantData = plantHealth || growProfile;
  const isPlantOnly = !isPackagedProduct && hasPlantData;

  let title = 'Cannabis (strain unknown)';
  let subtitle = 'STRAIN UNKNOWN • 0%';
  let description = '';

  if (isPackagedProduct && !isPackagedKnown) {
    // Packaged product, but we couldn't extract a strain name
    title = 'Packaged product (strain unknown)';
    subtitle = 'STRAIN UNKNOWN • 0%';
    description =
      'This looks like a packaged product, but the strain name was not clearly detected from the label. THC, CBD, and other label details may still be available below.';
  } else if (isPlantOnly) {
    // Plant-only scan: we detected a plant but couldn't identify the strain
    title = displayName || 'Unknown strain (plant detected)';
    subtitle = 'STRAIN UNKNOWN • PLANT DETECTED';
    description = 'We detected a cannabis plant in your photo, but couldn\'t identify the specific strain. Plant health diagnostics and grow information are available below.';
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
            '#0a0f0a', // Clean, solid dark green background
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

      {/* Optional banner for plant-only scans */}
      {isLikelyPlantOnly && (
        <Box
          sx={{
            mb: 2,
            p: 2,
            borderRadius: 2,
            background: 'rgba(124, 179, 66, 0.15)',
            border: '1px solid rgba(124, 179, 66, 0.3)',
          }}
        >
          <Typography
            variant="body2"
            sx={{
              margin: 0,
              fontSize: '0.8125rem',
              color: 'rgba(200, 230, 201, 0.8)',
              lineHeight: 1.5,
            }}
          >
            This looks like a plant photo. We couldn't confidently match a strain,
            but we analyzed the plant for health and grow signals below.
          </Typography>
        </Box>
      )}

      {/* Plant Health Section - Show whenever plant health or grow profile exists */}
      {(plantHealth || growProfile) && (
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
            Plant Health & Diagnostics
          </Typography>
          
          {plantHealth?.overall_health && (
            <Typography variant="body2" sx={{ color: 'rgba(200, 230, 201, 0.85)', mb: 0.5 }}>
              <strong>Overall Health:</strong> {plantHealth.overall_health}
            </Typography>
          )}
          
          {plantHealth?.issues && Array.isArray(plantHealth.issues) && plantHealth.issues.length > 0 && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2" sx={{ color: 'rgba(255, 152, 152, 0.9)', mb: 0.5, fontWeight: 600 }}>
                Issues Detected:
              </Typography>
              <Box component="ul" sx={{ marginTop: 0.5, paddingLeft: 2.25, marginBottom: 0 }}>
                {plantHealth.issues.map((issue, idx) => (
                  <Box component="li" key={idx} sx={{ mb: 0.5 }}>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 152, 152, 0.9)' }}>
                      {issue}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
          
          {plantHealth?.recommendations && Array.isArray(plantHealth.recommendations) && plantHealth.recommendations.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ color: 'rgba(200, 230, 201, 0.85)', mb: 0.5, fontWeight: 600 }}>
                Recommendations:
              </Typography>
              <Box component="ul" sx={{ marginTop: 0.5, paddingLeft: 2.25, marginBottom: 0 }}>
                {plantHealth.recommendations.map((rec, idx) => (
                  <Box component="li" key={idx} sx={{ mb: 0.5 }}>
                    <Typography variant="body2" sx={{ color: 'rgba(200, 230, 201, 0.85)' }}>
                      {rec}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </Box>
      )}

      {/* Grow Profile Section - Show for plant-only scans */}
      {growProfile && (
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
            Grow Profile
          </Typography>
          
          {growProfile.vigor && (
            <Typography variant="body2" sx={{ color: 'rgba(200, 230, 201, 0.85)', mb: 0.5 }}>
              <strong>Vigor:</strong> {growProfile.vigor}
            </Typography>
          )}
          
          {growProfile.harvestWeeks && (
            <Typography variant="body2" sx={{ color: 'rgba(200, 230, 201, 0.85)', mb: 0.5 }}>
              <strong>Harvest:</strong> ~{growProfile.harvestWeeks} weeks
            </Typography>
          )}
          
          {growProfile.yield && (
            <Typography variant="body2" sx={{ color: 'rgba(200, 230, 201, 0.85)', mb: 0.5 }}>
              <strong>Yield:</strong> {growProfile.yield}
            </Typography>
          )}
        </Box>
      )}

      {/* Effects & Flavors Section - Use safe arrays from props */}
      {aiSummary && (effects.length > 0 || flavors.length > 0) && (
        <Box
          sx={{
            mt: 3,
            p: 3,
            borderRadius: 2,
            background: 'rgba(0, 0, 0, 0.35)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(124, 179, 66, 0.2)',
            mb: 2,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              color: 'rgba(200, 230, 201, 0.9)',
              fontWeight: 600,
              fontSize: '1rem',
              mb: 1,
            }}
          >
            Effects & flavors
          </Typography>
          
          {effects.length > 0 && (
            <Typography variant="body2" sx={{ color: 'rgba(200, 230, 201, 0.85)', mb: 0.5, mt: 0.5 }}>
              <strong>Effects:</strong> {effects.join(", ")}
            </Typography>
          )}
          
          {flavors.length > 0 && (
            <Typography variant="body2" sx={{ color: 'rgba(200, 230, 201, 0.85)', mb: 0.5, mt: 0.5 }}>
              <strong>Flavors:</strong> {flavors.join(", ")}
            </Typography>
          )}
        </Box>
      )}

      {/* Notes Section - Use safe arrays from props */}
      {aiSummary && (dispensaryNotes.length > 0 || growerNotes.length > 0) && (
        <Box
          sx={{
            mt: 2,
            p: 3,
            borderRadius: 2,
            background: 'rgba(0, 0, 0, 0.35)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(124, 179, 66, 0.2)',
            mb: 2,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              color: 'rgba(200, 230, 201, 0.9)',
              fontWeight: 600,
              fontSize: '1rem',
              mb: 1,
            }}
          >
            Notes
          </Typography>
          
          {dispensaryNotes.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ color: 'rgba(200, 230, 201, 0.85)', mb: 0.5, fontWeight: 600 }}>
                <strong>Dispensary:</strong>
              </Typography>
              <Box component="ul" sx={{ paddingLeft: 2.25, margin: '4px 0', mt: 0.5 }}>
                {dispensaryNotes.map((n, idx) => (
                  <Box component="li" key={idx} sx={{ mb: 0.5 }}>
                    <Typography variant="body2" sx={{ color: 'rgba(200, 230, 201, 0.85)' }}>
                      {n}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
          
          {growerNotes.length > 0 && (
            <Box>
              <Typography variant="body2" sx={{ color: 'rgba(200, 230, 201, 0.85)', mb: 0.5, fontWeight: 600 }}>
                <strong>Grower:</strong>
              </Typography>
              <Box component="ul" sx={{ paddingLeft: 2.25, margin: '4px 0', mt: 0.5 }}>
                {growerNotes.map((n, idx) => (
                  <Box component="li" key={idx} sx={{ mb: 0.5 }}>
                    <Typography variant="body2" sx={{ color: 'rgba(200, 230, 201, 0.85)' }}>
                      {n}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </Box>
      )}

      {/* Potency & Warnings Section - Use safe arrays from props */}
      {aiSummary && (aiSummary.thc != null || aiSummary.cbd != null || warnings.length > 0) && (
        <Box
          sx={{
            mt: 2,
            p: 3,
            borderRadius: 2,
            background: 'rgba(0, 0, 0, 0.35)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(124, 179, 66, 0.2)',
            mb: 2,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              color: 'rgba(200, 230, 201, 0.9)',
              fontWeight: 600,
              fontSize: '1rem',
              mb: 1,
            }}
          >
            Potency & Warnings
          </Typography>
          
          {(aiSummary.thc != null || aiSummary.cbd != null) && (
            <Box sx={{ mb: 2 }}>
              {aiSummary.thc != null && (
                <Typography variant="body2" sx={{ color: 'rgba(200, 230, 201, 0.85)', mb: 0.5 }}>
                  <strong>Estimated THC:</strong> {aiSummary.thc}%
                </Typography>
              )}
              {aiSummary.cbd != null && (
                <Typography variant="body2" sx={{ color: 'rgba(200, 230, 201, 0.85)', mb: 0.5 }}>
                  <strong>Estimated CBD:</strong> {aiSummary.cbd}%
                </Typography>
              )}
            </Box>
          )}
          
          {warnings.length > 0 && (
            <Box>
              <Typography variant="body2" sx={{ color: 'rgba(255, 152, 152, 0.9)', mb: 0.5, fontWeight: 600 }}>
                Warnings:
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
  growProfile,
  canonicalStrain,
  heroImageUrl,
  plantHealth: plantHealthProp,
  packagingInsights: packagingInsightsProp,
  labelInsights: labelInsightsProp,
  displayBreeder,
  displayType,
  aiSummary: aiSummaryProp,
}) {
  const aiSummary = aiSummaryProp || result?.ai_summary || result?.aiSummary || scan?.ai_summary || scan?.aiSummary || scan?.result?.ai_summary || scan?.result?.aiSummary || null;
  // Get lineage from packaging insights or label insights
  // Prefer props, then result/scan
  const packagingInsights = packagingInsightsProp || result?.packaging_insights || scan?.packaging_insights || scan?.result?.packaging_insights || null;
  const labelInsights = labelInsightsProp || result?.label_insights || scan?.label_insights || scan?.result?.label_insights || null;
  const plantHealth = plantHealthProp || result?.plant_health || scan?.plant_health || scan?.result?.plant_health || null;
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
            '#0a0f0a', // Clean, solid dark green background
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

    </>
  );
}

function ScanResultCard({ result, scan, isGuest }) {
  // Defensive guard if scan is somehow missing
  if (!scan || (!scan.id && !scan.result)) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 2, fontWeight: 600 }}>
          Scan ready, but details are missing
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
          We processed your scan, but couldn&apos;t load the full details. Try checking your scan history or scanning again.
        </Typography>
      </Box>
    );
  }

  const { proRole, proEnabled } = useProMode();

  // ===============================
  // COMPREHENSIVE NORMALIZATION
  // ===============================
  // Extract raw data - handle both scan.result and direct scan properties
  const raw = scan?.result || scan || result || {};
  
  // Normalize canonical_strain (handle both object and legacy string fields)
  const canonical =
    raw.canonical_strain ||
    raw.canonicalStrain ||
    (raw.canonical_strain_name
      ? {
          name: raw.canonical_strain_name,
          source: raw.canonical_strain_source || null,
          confidence: raw.canonical_match_confidence ?? null,
        }
      : null) ||
    raw.canonical ||
    null;

  const seedBank =
    raw.seedBank ||
    raw.seed_bank ||
    null;

  const aiSummary =
    raw.ai_summary ||
    raw.aiSummary ||
    null;

  const packagingInsights =
    raw.packaging_insights ||
    raw.packagingInsights ||
    null;

  const labelInsights =
    raw.label_insights ||
    raw.labelInsights ||
    null;

  const plantHealth =
    raw.plant_health ||
    raw.plantHealth ||
    null;

  const growProfile =
    raw.grow_profile ||
    raw.growProfile ||
    null;

  // Determine what data we have
  const hasStrain =
    !!(canonical?.name || seedBank?.name || aiSummary?.canonicalName);

  const hasPlantOnlyData = !!(plantHealth || growProfile);

  // SAFE arrays - always ensure arrays, never undefined
  const effects = Array.isArray(aiSummary?.effects) ? aiSummary.effects : [];
  const flavors = Array.isArray(aiSummary?.flavors) ? aiSummary.flavors : [];
  const dispensaryNotes = Array.isArray(aiSummary?.dispensaryNotes) ? aiSummary.dispensaryNotes : [];
  const growerNotes = Array.isArray(aiSummary?.growerNotes) ? aiSummary.growerNotes : [];
  const warnings = Array.isArray(aiSummary?.warnings) ? aiSummary.warnings : [];
  
  // Also normalize for backward compatibility with existing code
  const normalizedResult = raw;
  const scanData = result || scan || {};

  // Determine display values for strain name, type, and breeder
  // Title for plant-only scans
  const title =
    canonical?.name ||
    seedBank?.name ||
    aiSummary?.canonicalName ||
    packagingInsights?.strainName ||
    labelInsights?.strainName ||
    (hasPlantOnlyData ? "Unknown strain (plant detected)" : "Unknown strain");
  
  const displayName = title;

  const displayType =
    seedBank?.type ||
    aiSummary?.type ||
    canonical?.type ||
    null;

  const displayBreeder =
    seedBank?.breeder ||
    aiSummary?.breeder ||
    null;

  // Helper booleans for determining scan type and what to display
  const hasStrainName = Boolean(hasStrain && displayName && displayName !== "Unknown strain" && displayName !== "Unknown strain (plant detected)");
  const hasPlantDiagnostics = Boolean(hasPlantOnlyData);
  const isLikelyPlantOnly = !hasStrainName && hasPlantDiagnostics && !packagingInsights;

  // Get canonical strain name for image lookup
  const canonicalNameForImage =
    canonical?.name ||
    seedBank?.name ||
    aiSummary?.canonicalName ||
    null;

  // Fetch strain image from API (only if we have a canonical name)
  const { imageUrl: strainImageUrl } = useStrainImage(canonicalNameForImage);

  // Determine best image URL: prefer API strain image, fallback to scan image
  const getBestImageUrl = (transformedImageUrl) => {
    return strainImageUrl || transformedImageUrl || scan?.image_url || null;
  };

  // CRITICAL: Use transformScanResult to get canonical strain name and metadata
  // This ensures packaged products ALWAYS use label strain, NEVER visual/library guesses
  // Wrap in try-catch to handle any transform errors gracefully
  let transformed = null;
  try {
    transformed = transformScanResult(scanData);
  } catch (error) {
    console.error('[ScanResultCard] transformScanResult error:', error);
    // Continue with null transformed - we'll handle plant-only scans below
  }
  
  // For plant-only scans (has plant health but no strain), show UnknownStrainCard directly
  // This handles cases where transformScanResult might fail or return unexpected structure
  if (!transformed && hasPlantDiagnostics && !hasStrainName) {
    return (
      <UnknownStrainCard
        isPackagedProduct={false}
        isPackagedKnown={false}
        isBudUnknown={true}
        summary={null}
        effects={[]}
        flavors={[]}
        intensity={null}
        dispensaryNotes={[]}
        growerNotes={[]}
        warnings={[]}
        canonicalStrain={null}
        result={result}
        scan={scan}
        plantHealth={plantHealth}
        growProfile={growProfile}
        displayName={displayName}
        hasStrainName={hasStrainName}
        isLikelyPlantOnly={isLikelyPlantOnly}
        aiSummary={aiSummary}
      />
    );
  }
  
  // Handle transform failure gracefully (for other cases)
  if (!transformed) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Preparing your result…
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
          Your scan is processing. This may take a moment.
        </Typography>
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
        strainName={displayName || transformed?.strainName || null}
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
        growProfile={growProfile || transformed?.growProfile || null}
        canonicalStrain={canonicalStrain}
        heroImageUrl={getBestImageUrl(transformed?.heroImageUrl)}
        plantHealth={plantHealth}
        packagingInsights={packagingInsights}
        labelInsights={labelInsights}
        displayBreeder={displayBreeder}
        displayType={displayType}
        aiSummary={aiSummary}
      />
    );
  }

  // Unknown strain: either bud unknown OR packaged product without detected strain
  // BUT: Don't show if canonical.confidence === 1 (we know the strain)
  // IMPORTANT: For plant-only scans, show plant health even if strain is unknown
  // Also handle plant-only scans that might not have isBudUnknown set correctly
  const isUnknownStrain = (transformed?.isBudUnknown || (transformed?.isPackagedProduct && !transformed?.isPackagedKnown)) && !isCanonicalConfident;
  const isPlantOnlyScan = !hasStrainName && hasPlantDiagnostics && !packagingInsights;
  
  if (isUnknownStrain || isPlantOnlyScan) {
    return (
      <UnknownStrainCard
        isPackagedProduct={transformed?.isPackagedProduct || false}
        isPackagedKnown={transformed?.isPackagedKnown || false}
        isBudUnknown={transformed?.isBudUnknown || false}
        summary={transformed?.summary || null}
        effects={transformed?.effectsTags || effects || []}
        flavors={transformed?.flavorTags || flavors || []}
        intensity={transformed?.intensity || null}
        dispensaryNotes={transformed?.dispensaryNotes || dispensaryNotes || []}
        growerNotes={transformed?.growerNotes || growerNotes || []}
        warnings={transformed?.warnings || warnings || []}
        canonicalStrain={canonicalStrain}
        result={result}
        scan={scan}
        plantHealth={plantHealth}
        growProfile={growProfile}
        displayName={displayName}
        hasStrainName={hasStrainName}
        isLikelyPlantOnly={isLikelyPlantOnly}
        aiSummary={aiSummary}
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
      strainName={transformed?.strainName || displayName || 'Unknown Strain'}
      matchConfidence={transformed?.matchConfidence || null}
      summary={transformed?.summary || null}
      effects={transformed?.effectsTags || effects || []}
      flavors={transformed?.flavorTags || flavors || []}
      intensity={transformed?.intensity || null}
      dispensaryNotes={transformed?.dispensaryNotes || dispensaryNotes || []}
      growerNotes={transformed?.growerNotes || growerNotes || []}
      warnings={transformed?.warnings || warnings || []}
      result={result}
      scan={scan}
      growProfile={growProfile || transformed?.growProfile || null}
      canonicalStrain={canonicalStrain}
      heroImageUrl={getBestImageUrl(transformed?.heroImageUrl)}
      plantHealth={plantHealth}
      packagingInsights={packagingInsights}
      labelInsights={labelInsights}
      displayBreeder={displayBreeder}
      displayType={displayType}
      aiSummary={aiSummary}
    />
  );
}

export default ScanResultCard;
