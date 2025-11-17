// frontend/src/components/ScanResultCard.jsx

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Stack,
  Button,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';

export default function ScanResultCard({
  result,
  isGuest,
  onSaveMatch,
  onLogExperience,
  onReportMismatch,
  onViewStrain,
}) {
  const [showLabelDialog, setShowLabelDialog] = useState(false);

  const top = result?.topMatch || result?.bestMatch || result?.strain || {};
  const labelInsights = result?.labelInsights || null;
  const otherMatches = result?.otherMatches || [];

  // Extract database metadata from the strain object
  const dbMeta = top.dbMeta || {};

  // Primary display name: prioritize label name over DB match
  const displayName = labelInsights?.strainName || top.name || 'Unknown strain';
  const dbStrainName = top.name || 'Unknown strain';
  const type = top.type || dbMeta.type || 'Hybrid';
  const description = top.description || '';
  const confidence = top.confidence ?? null;

  // Use label name for seed search, fallback to DB name
  const seedSearchName = labelInsights?.strainName || top.name || 'Unknown strain';
  const seedsQuery = encodeURIComponent(`${seedSearchName} cannabis seeds`);

  const formatPercent = (v) =>
    v != null && !Number.isNaN(v) ? `${v}%` : '—';

  const formatWeight = (value, unit) => {
    if (value == null || !unit) return '—';
    return `${value}${unit}`;
  };

  // Normalize confidence value to 0-100% display
  const normalizeConfidence = (raw) => {
    if (raw == null || Number.isNaN(raw)) return null;
    const num = Number(raw);
    if (num <= 0) return 0;
    
    let normalized;
    if (num <= 1.5) {
      // Assume it's already 0-1 scale
      normalized = num;
    } else if (num <= 100) {
      // Assume it's 0-100 scale, convert to 0-1
      normalized = num / 100;
    } else {
      // Clamp and normalize (was scaled too high)
      normalized = Math.min(num, 100) / 100;
    }
    
    const confidencePercent = Math.round(normalized * 100);
    return Math.max(0, Math.min(100, confidencePercent)); // Clamp 0-100
  };

  return (
    <Box
      sx={{
        borderRadius: 3,
        p: 2.5,
        background: 'rgba(12, 20, 12, 0.96)',
        border: '1px solid rgba(124, 179, 66, 0.7)',
        boxShadow: '0 18px 40px rgba(0,0,0,0.7)',
      }}
    >
      <Stack spacing={2}>
        {/* Main title - prioritize label name */}
        <Box>
          <Typography
            variant="h6"
            sx={{ color: '#E8F5E9', fontWeight: 700, mb: 1 }}
          >
            {displayName}
          </Typography>

          {/* Label name section */}
          {labelInsights?.strainName && (
            <Box sx={{ mb: 1.5, p: 1.5, borderRadius: 1.5, bgcolor: 'rgba(124, 179, 66, 0.1)', border: '1px solid rgba(124, 179, 66, 0.3)' }}>
              <Typography variant="subtitle2" sx={{ color: '#C5E1A5', mb: 0.5, fontWeight: 600 }}>
                Label name
              </Typography>
              <Typography variant="body2" sx={{ color: '#E8F5E9', mb: 0.5 }}>
                {labelInsights.strainName}
              </Typography>
              {labelInsights.brand && (
                <Typography variant="body2" sx={{ color: 'rgba(224, 242, 241, 0.9)' }}>
                  Brand: {labelInsights.brand}
                </Typography>
              )}
            </Box>
          )}

          {/* Database profile section */}
          {top.name && (
            <Box sx={{ mb: 1.5, p: 1.5, borderRadius: 1.5, bgcolor: 'rgba(0,0,0,0.2)', border: '1px solid rgba(124, 179, 66, 0.2)' }}>
              <Typography variant="subtitle2" sx={{ color: '#C5E1A5', mb: 0.5, fontWeight: 600 }}>
                Database strain
              </Typography>
              <Typography variant="body2" sx={{ color: '#E8F5E9', mb: 0.5 }}>
                {dbStrainName} {confidence != null && `(${normalizeConfidence(confidence)}% match)`}
              </Typography>
              {type && (
                <Typography variant="body2" sx={{ color: 'rgba(224, 242, 241, 0.9)' }}>
                  Type: {type}
                </Typography>
              )}
            </Box>
          )}

          {description && (
            <Typography
              variant="body2"
              sx={{ color: 'rgba(224, 242, 241, 0.9)', mt: 1 }}
            >
              {description}
            </Typography>
          )}
        </Box>

        {/* Database info / Strain profile */}
        {Object.keys(dbMeta).length > 0 && (
          <Box
            sx={{
              mt: 1,
              p: 2,
              borderRadius: 2,
              bgcolor: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(124,179,66,0.4)',
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{ color: '#C5E1A5', mb: 1 }}
            >
              Database info / Strain profile
            </Typography>

            <Stack spacing={0.5}>
              {dbMeta.type && (
                <Typography variant="body2" sx={{ color: '#E8F5E9' }}>
                  Type: {dbMeta.type}
                </Typography>
              )}

              {(dbMeta.thc != null || dbMeta.cbd != null) && (
                <>
                  {dbMeta.thc != null && (
                    <Typography variant="body2" sx={{ color: '#E8F5E9' }}>
                      THC range: {typeof dbMeta.thc === 'number' ? `${dbMeta.thc}%` : Array.isArray(dbMeta.thc) ? `${dbMeta.thc[0]}% - ${dbMeta.thc[1]}%` : dbMeta.thc}
                    </Typography>
                  )}
                  {dbMeta.cbd != null && (
                    <Typography variant="body2" sx={{ color: '#E8F5E9' }}>
                      CBD range: {typeof dbMeta.cbd === 'number' ? `${dbMeta.cbd}%` : Array.isArray(dbMeta.cbd) ? `${dbMeta.cbd[0]}% - ${dbMeta.cbd[1]}%` : dbMeta.cbd}
                    </Typography>
                  )}
                </>
              )}

              {dbMeta.lineage && (
                <Typography variant="body2" sx={{ color: '#E8F5E9' }}>
                  Genetics: {Array.isArray(dbMeta.lineage)
                    ? dbMeta.lineage.join(' × ')
                    : dbMeta.lineage}
                </Typography>
              )}

              {dbMeta.effects && (
                <Typography variant="body2" sx={{ color: '#E8F5E9' }}>
                  Effects: {Array.isArray(dbMeta.effects)
                    ? dbMeta.effects.join(', ')
                    : dbMeta.effects}
                </Typography>
              )}

              {dbMeta.flavors && (
                <Typography variant="body2" sx={{ color: '#E8F5E9' }}>
                  Flavors: {Array.isArray(dbMeta.flavors)
                    ? dbMeta.flavors.join(', ')
                    : dbMeta.flavors}
                </Typography>
              )}

              {(dbMeta.breeder || dbMeta.seedbank) && (
                <Typography variant="body2" sx={{ color: '#E8F5E9' }}>
                  {dbMeta.breeder && `Breeder: ${dbMeta.breeder}`}
                  {dbMeta.breeder && dbMeta.seedbank && ' | '}
                  {dbMeta.seedbank && `Seedbank: ${dbMeta.seedbank}`}
                </Typography>
              )}

              {(dbMeta.flowering_time || dbMeta.yield || dbMeta.difficulty) && (
                <>
                  {dbMeta.flowering_time && (
                    <Typography variant="body2" sx={{ color: '#E8F5E9' }}>
                      Flowering time: {dbMeta.flowering_time}
                    </Typography>
                  )}
                  {dbMeta.yield && (
                    <Typography variant="body2" sx={{ color: '#E8F5E9' }}>
                      Yield: {dbMeta.yield}
                    </Typography>
                  )}
                  {dbMeta.difficulty && (
                    <Typography variant="body2" sx={{ color: '#E8F5E9' }}>
                      Difficulty: {dbMeta.difficulty}
                    </Typography>
                  )}
                </>
              )}
            </Stack>
          </Box>
        )}

        {/* Label details */}
        {labelInsights ? (
          <Box
            sx={{
              mt: 1,
              p: 2,
              borderRadius: 2,
              bgcolor: 'rgba(0,0,0,0.35)',
              border: '1px solid rgba(124,179,66,0.6)',
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{ color: '#C5E1A5', mb: 1 }}
            >
              Label details
            </Typography>

            <Stack spacing={0.5}>
              {/* Potency */}
              {(labelInsights.thcPercent != null || labelInsights.thcMg != null) && (
                <Typography variant="body2" sx={{ color: '#E8F5E9' }}>
                  THC: {formatPercent(labelInsights.thcPercent)}
                  {labelInsights.thcMg != null
                    ? ` (${labelInsights.thcMg} mg)`
                    : ''}
                </Typography>
              )}
              {(labelInsights.cbdPercent != null || labelInsights.cbdMg != null) && (
                <Typography variant="body2" sx={{ color: '#E8F5E9' }}>
                  CBD: {formatPercent(labelInsights.cbdPercent)}
                  {labelInsights.cbdMg != null
                    ? ` (${labelInsights.cbdMg} mg)`
                    : ''}
                </Typography>
              )}

              {/* Other cannabinoids */}
              {Array.isArray(labelInsights.cannabinoids) &&
                labelInsights.cannabinoids.length > 0 && (
                  <Typography variant="body2" sx={{ color: '#E8F5E9' }}>
                    Other cannabinoids:{' '}
                    {labelInsights.cannabinoids
                      .map((c) => {
                        const parts = [c.name];
                        if (c.percent != null)
                          parts.push(`${c.percent}%`);
                        if (c.mg != null) parts.push(`${c.mg} mg`);
                        return parts.join(' ');
                      })
                      .join(', ')}
                  </Typography>
                )}

              {/* Terpenes */}
              {Array.isArray(labelInsights.terpenes) &&
                labelInsights.terpenes.length > 0 && (
                  <Typography variant="body2" sx={{ color: '#E8F5E9' }}>
                    Terpenes:{' '}
                    {labelInsights.terpenes
                      .map((t) =>
                        t.percent != null
                          ? `${t.name} ${t.percent}%`
                          : t.name
                      )
                      .join(', ')}
                  </Typography>
                )}

              {/* Product/meta */}
              {labelInsights.productType && (
                <Typography variant="body2" sx={{ color: '#E8F5E9' }}>
                  Product type: {labelInsights.productType}
                </Typography>
              )}
              {(labelInsights.netWeightValue != null || labelInsights.netWeightUnit) && (
                <Typography variant="body2" sx={{ color: '#E8F5E9' }}>
                  Net weight:{' '}
                  {formatWeight(
                    labelInsights.netWeightValue,
                    labelInsights.netWeightUnit
                  )}
                </Typography>
              )}

              {/* Producer / tracking info */}
              {labelInsights.brand && (
                <Typography variant="body2" sx={{ color: '#E8F5E9' }}>
                  Brand: {labelInsights.brand}
                </Typography>
              )}
              {labelInsights.batchId && (
                <Typography variant="body2" sx={{ color: '#E8F5E9' }}>
                  Batch / lot: {labelInsights.batchId}
                </Typography>
              )}
              {labelInsights.licenseNumber && (
                <Typography variant="body2" sx={{ color: '#E8F5E9' }}>
                  License / permit: {labelInsights.licenseNumber}
                </Typography>
              )}
              {labelInsights.labName && (
                <Typography variant="body2" sx={{ color: '#E8F5E9' }}>
                  Test lab: {labelInsights.labName}
                </Typography>
              )}

              {/* Dates */}
              {labelInsights.packageDate && (
                <Typography variant="body2" sx={{ color: '#E8F5E9' }}>
                  Packaged on: {labelInsights.packageDate}
                </Typography>
              )}
              {labelInsights.testDate && (
                <Typography variant="body2" sx={{ color: '#E8F5E9' }}>
                  Test date: {labelInsights.testDate}
                </Typography>
              )}
              {labelInsights.expirationDate && (
                <Typography variant="body2" sx={{ color: '#E8F5E9' }}>
                  Expiration: {labelInsights.expirationDate}
                </Typography>
              )}

              {/* Raw text button */}
              {labelInsights.rawText && (
                <Button
                  variant="text"
                  size="small"
                  sx={{
                    mt: 0.5,
                    alignSelf: 'flex-start',
                    textTransform: 'none',
                  }}
                  onClick={() => setShowLabelDialog(true)}
                >
                  View full label text
                </Button>
              )}
            </Stack>
          </Box>
        ) : (
          <Box
            sx={{
              mt: 1,
              p: 2,
              borderRadius: 2,
              bgcolor: 'rgba(0,0,0,0.2)',
              border: '1px solid rgba(124,179,66,0.3)',
            }}
          >
            <Typography variant="body2" sx={{ color: 'rgba(224, 242, 241, 0.7)', fontStyle: 'italic' }}>
              No label data detected
            </Typography>
          </Box>
        )}

        {/* Other matches */}
        {Array.isArray(otherMatches) && otherMatches.length > 0 && (
          <Box>
            <Divider sx={{ mb: 1, borderColor: 'rgba(255,255,255,0.08)' }} />
            <Typography
              variant="subtitle2"
              sx={{ color: '#C5E1A5', mb: 1 }}
            >
              Similar strains
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {otherMatches.map((m) => (
                <Chip
                  key={m.id || m.name}
                  label={m.name}
                  size="small"
                  sx={{
                    mb: 1,
                    bgcolor: 'rgba(255,255,255,0.04)',
                    color: '#E8F5E9',
                    borderColor: 'rgba(255,255,255,0.15)',
                    borderWidth: 1,
                    borderStyle: 'solid',
                  }}
                  onClick={
                    onViewStrain
                      ? () => onViewStrain(m)
                      : undefined
                  }
                />
              ))}
            </Stack>
          </Box>
        )}

        {/* Actions */}
        <Stack spacing={1.2}>
          <Button
            variant="contained"
            fullWidth
            disabled={!onViewStrain}
            onClick={() => onViewStrain && onViewStrain(top)}
            sx={{
              textTransform: 'none',
              borderRadius: 999,
            }}
          >
            View strain details
          </Button>

          <Button
            variant="outlined"
            fullWidth
            disabled={isGuest || !onSaveMatch}
            onClick={() => !isGuest && onSaveMatch && onSaveMatch(top)}
            sx={{
              textTransform: 'none',
              borderRadius: 999,
            }}
          >
            {isGuest ? 'Sign in to save' : 'Save this match'}
          </Button>

          <Button
            variant="outlined"
            fullWidth
            disabled={isGuest || !onLogExperience}
            onClick={() =>
              !isGuest && onLogExperience && onLogExperience(top)
            }
            sx={{
              textTransform: 'none',
              borderRadius: 999,
            }}
          >
            {isGuest ? 'Sign in to log experience' : 'Log experience'}
          </Button>

          <Button
            variant="text"
            fullWidth
            disabled={!onReportMismatch}
            onClick={() =>
              onReportMismatch && onReportMismatch(top)
            }
            sx={{
              textTransform: 'none',
              color: 'rgba(244, 199, 144, 0.9)',
            }}
          >
            Report mismatch
          </Button>

          <Button
            variant="outlined"
            fullWidth
            onClick={() =>
              window.open(
                `https://www.google.com/search?q=${seedsQuery}`,
                '_blank'
              )
            }
            sx={{
              textTransform: 'none',
              borderRadius: 999,
              borderColor: 'rgba(124, 179, 66, 0.8)',
              color: '#C5E1A5',
            }}
          >
            Find seeds for {seedSearchName}
          </Button>
        </Stack>
      </Stack>

      {/* Label text dialog */}
      <Dialog
        open={showLabelDialog}
        onClose={() => setShowLabelDialog(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Label text</DialogTitle>
        <DialogContent dividers>
          <Typography
            variant="body2"
            sx={{ whiteSpace: 'pre-wrap' }}
          >
            {labelInsights?.rawText || 'No label text captured.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowLabelDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
