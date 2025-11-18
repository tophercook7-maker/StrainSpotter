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
  const label = result?.labelInsights || null;
  const otherMatches = result?.otherMatches || [];

  // Extract database metadata from the strain object
  const dbMeta = top.dbMeta || {};

  // Determine scan type
  const isPackaged = !!label?.isPackagedProduct;
  
  // Title logic based on scan type
  const labelName = label?.strainName || null;
  const dbName = top.name || null;
  
  let mainTitle, subtitle, seedSearchName;
  
  if (isPackaged && labelName) {
    // Packaged product: label name is primary
    mainTitle = labelName;
    if (dbName && dbName !== labelName) {
      const confidence = normalizeConfidence(top.confidence);
      subtitle = `Database strain (best guess): ${dbName}${confidence != null ? ` – ${confidence}% match` : ''}`;
    }
    seedSearchName = labelName;
  } else {
    // Non-packaged (bud/plant): DB name is primary
    mainTitle = dbName || labelName || 'Cannabis strain';
    seedSearchName = dbName || labelName || 'Unknown strain';
  }
  
  const seedsQuery = encodeURIComponent(`${seedSearchName} cannabis seeds`);
  if (isPackaged && labelName && dbName && dbName !== labelName) {
    // For packaged products, optionally mention DB strain in search
    const seedsQueryWithAlso = encodeURIComponent(`${labelName} cannabis seeds also known as ${dbName}`);
    // Use the extended query for better search results
  }

  const type = top.type || dbMeta.type || 'Hybrid';
  const description = top.description || '';
  const confidence = top.confidence ?? null;

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
      normalized = num;
    } else if (num <= 100) {
      normalized = num / 100;
    } else {
      normalized = Math.min(num, 100) / 100;
    }
    
    const confidencePercent = Math.round(normalized * 100);
    return Math.max(0, Math.min(100, confidencePercent));
  };

  // Helper to render a section card
  const SectionCard = ({ title, children, sx = {} }) => (
    <Box
      sx={{
        mt: 1,
        p: 2,
        borderRadius: 2,
        bgcolor: 'rgba(0,0,0,0.35)',
        border: '1px solid rgba(124,179,66,0.6)',
        ...sx,
      }}
    >
      <Typography
        variant="subtitle2"
        sx={{ color: '#C5E1A5', mb: 1, fontWeight: 600 }}
      >
        {title}
      </Typography>
      {children}
    </Box>
  );

  // Helper to render a field row (only if value exists)
  const FieldRow = ({ label, value, children }) => {
    if (value == null && !children) return null;
    return (
      <Typography variant="body2" sx={{ color: '#E8F5E9', mb: 0.5 }}>
        {label}: {value != null ? value : children}
      </Typography>
    );
  };

  // Build product summary for packaged products
  const productSummaryParts = [];
  if (label?.netWeightValue && label?.netWeightUnit) {
    productSummaryParts.push(`${label.netWeightValue}${label.netWeightUnit}`);
  }
  if (label?.productType) {
    productSummaryParts.push(label.productType);
  }
  if (label?.marketingTags && label.marketingTags.length > 0) {
    productSummaryParts.push(...label.marketingTags.slice(0, 2));
  }
  const productSummary = productSummaryParts.join(' ');
  const categoryLabel = label?.category 
    ? label.category.charAt(0).toUpperCase() + label.category.slice(1)
    : null;

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
        {/* Header / title area */}
        <Box>
          <Typography
            variant="h6"
            sx={{ color: '#E8F5E9', fontWeight: 700, mb: 0.5 }}
          >
            {mainTitle}
          </Typography>
          
          {/* Subtitle for packaged products with DB match */}
          {subtitle && (
            <Typography variant="body2" sx={{ color: 'rgba(224, 242, 241, 0.8)', mb: 0.5, fontStyle: 'italic' }}>
              {subtitle}
            </Typography>
          )}
          
          {/* Product summary for packaged products */}
          {isPackaged && (productSummary || categoryLabel) && (
            <Typography variant="body2" sx={{ color: 'rgba(224, 242, 241, 0.9)', mb: 0.5 }}>
              {productSummary}
              {productSummary && categoryLabel && ' • '}
              {categoryLabel && `${categoryLabel}`}
            </Typography>
          )}
          
          {/* Brand */}
          {label?.brand && (
            <Typography variant="caption" sx={{ color: 'rgba(224, 242, 241, 0.8)' }}>
              by {label.brand}
            </Typography>
          )}
          
          {/* Description (for non-packaged scans) */}
          {!isPackaged && description && (
            <Typography
              variant="body2"
              sx={{ color: 'rgba(224, 242, 241, 0.9)', mt: 1 }}
            >
              {description}
            </Typography>
          )}
        </Box>

        {/* PACKAGED PRODUCT SECTIONS */}
        {isPackaged ? (
          <>
            {/* Section 1: Potency */}
            {(label?.thcPercent != null || label?.cbdPercent != null || label?.totalCannabinoidsPercent != null ||
              label?.thcMg != null || label?.cbdMg != null || label?.totalCannabinoidsMg != null) && (
              <SectionCard title="Potency">
                <Stack spacing={0.5}>
                  {label.thcPercent != null && (
                    <FieldRow
                      label="THC"
                      value={`${formatPercent(label.thcPercent)}${label.thcMg != null ? ` (${label.thcMg} mg total)` : ''}`}
                    />
                  )}
                  {label.cbdPercent != null && (
                    <FieldRow
                      label="CBD"
                      value={`${formatPercent(label.cbdPercent)}${label.cbdMg != null ? ` (${label.cbdMg} mg total)` : ''}`}
                    />
                  )}
                  {label.totalCannabinoidsPercent != null && (
                    <FieldRow
                      label="Total cannabinoids"
                      value={`${formatPercent(label.totalCannabinoidsPercent)}${label.totalCannabinoidsMg != null ? ` (${label.totalCannabinoidsMg} mg)` : ''}`}
                    />
                  )}
                  {Array.isArray(label.cannabinoids) && label.cannabinoids.length > 0 && (
                    <FieldRow label="Other cannabinoids">
                      {label.cannabinoids
                        .map((c) => {
                          const parts = [c.name];
                          if (c.percent != null) parts.push(`${c.percent}%`);
                          if (c.mg != null) parts.push(`${c.mg} mg`);
                          return parts.join(' ');
                        })
                        .join(', ')}
                    </FieldRow>
                  )}
                </Stack>
              </SectionCard>
            )}

            {/* Section 2: Terpenes */}
            {Array.isArray(label?.terpenes) && label.terpenes.length > 0 && (
              <SectionCard title={`Terpenes${label.terpenePercentTotal ? ` (${label.terpenePercentTotal.toFixed(2)}% total)` : ' (label detected)'}`}>
                <Stack spacing={0.5}>
                  {label.terpenes.map((t, idx) => (
                    <Typography key={idx} variant="body2" sx={{ color: '#E8F5E9' }}>
                      {t.name.charAt(0).toUpperCase() + t.name.slice(1)}: {t.percent != null ? `${t.percent}%` : '—'}
                    </Typography>
                  ))}
                </Stack>
              </SectionCard>
            )}

            {/* Section 3: Product details */}
            {(label?.productType || label?.category || label?.netWeightValue || label?.batchId ||
              label?.licenseNumber || label?.labName || label?.packageDate || label?.testDate ||
              label?.expirationDate || label?.jurisdiction) && (
              <SectionCard title="Product details">
                <Stack spacing={0.5}>
                  {label.productType && (
                    <FieldRow label="Product type" value={label.productType} />
                  )}
                  {label.netWeightValue != null && (
                    <FieldRow
                      label="Net weight"
                      value={formatWeight(label.netWeightValue, label.netWeightUnit)}
                    />
                  )}
                  {label.category && (
                    <FieldRow label="Category" value={categoryLabel} />
                  )}
                  {label.batchId && (
                    <FieldRow label="Batch / lot" value={label.batchId} />
                  )}
                  {label.licenseNumber && (
                    <FieldRow label="License / permit" value={label.licenseNumber} />
                  )}
                  {label.labName && (
                    <FieldRow label="Test lab" value={label.labName} />
                  )}
                  {label.packageDate && (
                    <FieldRow label="Packaged on" value={label.packageDate} />
                  )}
                  {label.testDate && (
                    <FieldRow label="Test date" value={label.testDate} />
                  )}
                  {label.expirationDate && (
                    <FieldRow label="Expiration" value={label.expirationDate} />
                  )}
                  {label.jurisdiction && (
                    <FieldRow label="Jurisdiction" value={label.jurisdiction} />
                  )}
                </Stack>
              </SectionCard>
            )}

            {/* Section 4: Warnings & legal */}
            {(label?.warnings?.length > 0 || label?.ageRestricted || label?.medicalUseOnly ||
              label?.drivingWarning || label?.pregnancyWarning) && (
              <SectionCard title="Warnings & legal info">
                <Stack spacing={1}>
                  {label.warnings && label.warnings.length > 0 && (
                    <Stack spacing={0.5}>
                      {label.warnings.map((warning, idx) => (
                        <Typography key={idx} variant="body2" sx={{ color: '#E8F5E9' }}>
                          • {warning}
                        </Typography>
                      ))}
                    </Stack>
                  )}
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {label.ageRestricted && (
                      <Chip
                        label="21+ only"
                        size="small"
                        sx={{
                          bgcolor: 'rgba(255, 152, 0, 0.2)',
                          color: '#FFB74D',
                          borderColor: 'rgba(255, 152, 0, 0.5)',
                          borderWidth: 1,
                          borderStyle: 'solid',
                        }}
                      />
                    )}
                    {label.medicalUseOnly && (
                      <Chip
                        label="Medical use only"
                        size="small"
                        sx={{
                          bgcolor: 'rgba(156, 39, 176, 0.2)',
                          color: '#BA68C8',
                          borderColor: 'rgba(156, 39, 176, 0.5)',
                          borderWidth: 1,
                          borderStyle: 'solid',
                        }}
                      />
                    )}
                    {label.drivingWarning && (
                      <Chip
                        label="Do not drive"
                        size="small"
                        sx={{
                          bgcolor: 'rgba(244, 67, 54, 0.2)',
                          color: '#EF5350',
                          borderColor: 'rgba(244, 67, 54, 0.5)',
                          borderWidth: 1,
                          borderStyle: 'solid',
                        }}
                      />
                    )}
                    {label.pregnancyWarning && (
                      <Chip
                        label="Not for pregnancy"
                        size="small"
                        sx={{
                          bgcolor: 'rgba(244, 67, 54, 0.2)',
                          color: '#EF5350',
                          borderColor: 'rgba(244, 67, 54, 0.5)',
                          borderWidth: 1,
                          borderStyle: 'solid',
                        }}
                      />
                    )}
                  </Stack>
                </Stack>
              </SectionCard>
            )}

            {/* Section 5: Dosage (mainly for edibles) */}
            {label?.dosage && (label.dosage.totalServings != null || label.dosage.mgPerServingTHC != null ||
              label.dosage.mgPerServingCBD != null) && (
              <SectionCard title="Dosage">
                <Stack spacing={0.5}>
                  {label.dosage.mgPerServingTHC != null && label.dosage.totalServings != null && (
                    <FieldRow
                      label="THC per serving"
                      value={`${label.dosage.mgPerServingTHC} mg THC per serving • ${label.dosage.totalServings} servings`}
                    />
                  )}
                  {label.dosage.mgPerServingCBD != null && label.dosage.totalServings != null && (
                    <FieldRow
                      label="CBD per serving"
                      value={`${label.dosage.mgPerServingCBD} mg CBD per serving • ${label.dosage.totalServings} servings`}
                    />
                  )}
                  {label.thcMg != null && label.dosage.mgPerServingTHC == null && (
                    <FieldRow label="Approx total THC" value={`${label.thcMg} mg THC total`} />
                  )}
                </Stack>
              </SectionCard>
            )}

            {/* Section 6: Marketing tags */}
            {label?.marketingTags && label.marketingTags.length > 0 && (
              <Box>
                <Typography variant="subtitle2" sx={{ color: '#C5E1A5', mb: 1 }}>
                  Product features
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {label.marketingTags.map((tag, idx) => (
                    <Chip
                      key={idx}
                      label={tag}
                      size="small"
                      sx={{
                        bgcolor: 'rgba(124, 179, 66, 0.15)',
                        color: '#C5E1A5',
                        borderColor: 'rgba(124, 179, 66, 0.4)',
                        borderWidth: 1,
                        borderStyle: 'solid',
                      }}
                    />
                  ))}
                </Stack>
              </Box>
            )}

            {/* Section 7: Database strain (secondary for packaged products) */}
            {dbName && (
              <SectionCard title="Database strain profile (best guess)">
                <Stack spacing={0.5}>
                  <FieldRow label="Strain name" value={dbName} />
                  {type && (
                    <FieldRow label="Type" value={type} />
                  )}
                  {dbMeta.thc != null && (
                    <FieldRow
                      label="THC range"
                      value={typeof dbMeta.thc === 'number' ? `${dbMeta.thc}%` : Array.isArray(dbMeta.thc) ? `${dbMeta.thc[0]}% - ${dbMeta.thc[1]}%` : dbMeta.thc}
                    />
                  )}
                  {dbMeta.cbd != null && (
                    <FieldRow
                      label="CBD range"
                      value={typeof dbMeta.cbd === 'number' ? `${dbMeta.cbd}%` : Array.isArray(dbMeta.cbd) ? `${dbMeta.cbd[0]}% - ${dbMeta.cbd[1]}%` : dbMeta.cbd}
                    />
                  )}
                  {dbMeta.lineage && (
                    <FieldRow
                      label="Genetics"
                      value={Array.isArray(dbMeta.lineage) ? dbMeta.lineage.join(' × ') : dbMeta.lineage}
                    />
                  )}
                  {dbMeta.effects && (
                    <FieldRow
                      label="Effects"
                      value={Array.isArray(dbMeta.effects) ? dbMeta.effects.join(', ') : dbMeta.effects}
                    />
                  )}
                  {dbMeta.flavors && (
                    <FieldRow
                      label="Flavors"
                      value={Array.isArray(dbMeta.flavors) ? dbMeta.flavors.join(', ') : dbMeta.flavors}
                    />
                  )}
                </Stack>
              </SectionCard>
            )}
          </>
        ) : (
          /* NON-PACKAGED SCAN SECTIONS (buds, plants, etc.) */
          <>
            {/* Potency card */}
            {(label?.thcPercent != null || label?.cbdPercent != null || label?.totalCannabinoidsPercent != null ||
              label?.thcMg != null || label?.cbdMg != null || label?.totalCannabinoidsMg != null) && (
              <SectionCard title="Potency">
                <Stack spacing={0.5}>
                  {label.thcPercent != null && (
                    <FieldRow
                      label="THC"
                      value={`${formatPercent(label.thcPercent)}${label.thcMg != null ? ` (${label.thcMg} mg total)` : ''}`}
                    />
                  )}
                  {label.cbdPercent != null && (
                    <FieldRow
                      label="CBD"
                      value={`${formatPercent(label.cbdPercent)}${label.cbdMg != null ? ` (${label.cbdMg} mg total)` : ''}`}
                    />
                  )}
                  {label.totalCannabinoidsPercent != null && (
                    <FieldRow
                      label="Total cannabinoids"
                      value={`${formatPercent(label.totalCannabinoidsPercent)}${label.totalCannabinoidsMg != null ? ` (${label.totalCannabinoidsMg} mg)` : ''}`}
                    />
                  )}
                </Stack>
              </SectionCard>
            )}

            {/* Database info / Strain profile (primary for non-packaged) */}
            {Object.keys(dbMeta).length > 0 && (
              <SectionCard title="Database info / Strain profile">
                <Stack spacing={0.5}>
                  {dbMeta.type && (
                    <FieldRow label="Type" value={dbMeta.type} />
                  )}
                  {dbMeta.thc != null && (
                    <FieldRow
                      label="THC range"
                      value={typeof dbMeta.thc === 'number' ? `${dbMeta.thc}%` : Array.isArray(dbMeta.thc) ? `${dbMeta.thc[0]}% - ${dbMeta.thc[1]}%` : dbMeta.thc}
                    />
                  )}
                  {dbMeta.cbd != null && (
                    <FieldRow
                      label="CBD range"
                      value={typeof dbMeta.cbd === 'number' ? `${dbMeta.cbd}%` : Array.isArray(dbMeta.cbd) ? `${dbMeta.cbd[0]}% - ${dbMeta.cbd[1]}%` : dbMeta.cbd}
                    />
                  )}
                  {dbMeta.lineage && (
                    <FieldRow
                      label="Genetics"
                      value={Array.isArray(dbMeta.lineage) ? dbMeta.lineage.join(' × ') : dbMeta.lineage}
                    />
                  )}
                  {dbMeta.effects && (
                    <FieldRow
                      label="Effects"
                      value={Array.isArray(dbMeta.effects) ? dbMeta.effects.join(', ') : dbMeta.effects}
                    />
                  )}
                  {dbMeta.flavors && (
                    <FieldRow
                      label="Flavors"
                      value={Array.isArray(dbMeta.flavors) ? dbMeta.flavors.join(', ') : dbMeta.flavors}
                    />
                  )}
                </Stack>
              </SectionCard>
            )}
          </>
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

        {/* Raw label text button */}
        {label?.rawText && (
          <Button
            variant="text"
            size="small"
            sx={{
              alignSelf: 'flex-start',
              textTransform: 'none',
            }}
            onClick={() => setShowLabelDialog(true)}
          >
            View full label text
          </Button>
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
            {label?.rawText || 'No label text captured.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowLabelDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
