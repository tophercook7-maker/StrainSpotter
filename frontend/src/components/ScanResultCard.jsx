import React from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Chip,
  Stack,
  Divider,
  Button,
} from '@mui/material';

// ---------- Helpers ----------

// Make sure this is declared BEFORE any use
function normalizeConfidence(conf) {
  if (conf == null || Number.isNaN(conf)) return null;

  let value = Number(conf);

  // If it's clearly 0–1, scale to %
  if (value > 0 && value <= 1) {
    value = value * 100;
  }

  // If it's huge (like 7800), assume already % × 100
  if (value > 100) {
    value = value / 100;
  }

  if (value < 0) value = 0;
  if (value > 100) value = 100;

  return Math.round(value);
}

function formatPercent(value) {
  if (value == null || Number.isNaN(Number(value))) return '—';
  return `${Number(value).toFixed(2).replace(/\.00$/, '')}%`;
}

function formatMg(value) {
  if (value == null || Number.isNaN(Number(value))) return null;
  return `${Number(value).toFixed(2).replace(/\.00$/, '')} mg`;
}

function SectionCard({ title, children }) {
  if (!children) return null;

  return (
    <Card
      variant="outlined"
      sx={{
        mb: 2,
        borderRadius: 2,
        borderColor: 'divider',
        background:
          'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(245,255,250,0.9))',
      }}
    >
      {title && (
        <CardHeader
          title={
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {title}
            </Typography>
          }
          sx={{ pb: 0.5 }}
        />
      )}
      <CardContent sx={{ pt: title ? 0.5 : 1.5, '&:last-child': { pb: 1.5 } }}>
        {children}
      </CardContent>
    </Card>
  );
}

function FieldRow({ label, value, emphasis = false }) {
  if (
    value === undefined ||
    value === null ||
    value === '' ||
    (Array.isArray(value) && value.length === 0)
  ) {
    return null;
  }

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 2,
        mb: 0.75,
      }}
    >
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ minWidth: 120, flexShrink: 0 }}
      >
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          fontWeight: emphasis ? 600 : 400,
          textAlign: 'right',
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

// ---------- Main Component ----------

export default function ScanResultCard({ scan }) {
  if (!scan) return null;

  const {
    imageUrl,
    createdAt,
    visualMatch,
    candidates,
    plantStage,
    plantHealth,
    labelInsights: rawLabelInsights,
    aiSummary: topLevelAiSummary,
    isPackagedProduct: topLevelIsPackaged,
  } = scan;

  const labelInsights = rawLabelInsights || {};
  const {
    strainName: labelStrainName,
    brand,
    productType,
    category,
    thcPercent,
    cbdPercent,
    totalCannabinoidsPercent,
    thcMg,
    cbdMg,
    totalCannabinoidsMg,
    netWeightValue,
    netWeightUnit,
    terpenes,
    terpenePercentTotal,
    batchId,
    licenseNumber,
    labName,
    jurisdiction,
    warnings,
    ageRestricted,
    medicalUseOnly,
    drivingWarning,
    pregnancyWarning,
    dosage,
    marketingTags,
    rawText,
    aiSummary: labelAiSummary,
    isPackagedProduct: labelIsPackaged,
  } = labelInsights;

  const isPackagedProduct =
    typeof labelIsPackaged === 'boolean'
      ? labelIsPackaged
      : typeof topLevelIsPackaged === 'boolean'
      ? topLevelIsPackaged
      : Boolean(
          batchId ||
            licenseNumber ||
            netWeightValue ||
            productType ||
            category ||
            warnings
        );

  const aiSummary = topLevelAiSummary || labelAiSummary || null;

  const dbName = visualMatch?.name || null;
  const dbConfidence = normalizeConfidence(visualMatch?.confidence);

  const titleFromLabel = labelStrainName && labelStrainName.trim();
  const titlePrimary = isPackagedProduct
    ? titleFromLabel || dbName || 'Cannabis product'
    : dbName || titleFromLabel || 'Cannabis strain';

  const subtitleParts = [];
  if (brand) subtitleParts.push(brand);
  if (productType) subtitleParts.push(productType);
  if (category && category !== productType) subtitleParts.push(category);
  const subtitle = subtitleParts.join(' • ');

  const potFieldsPresent =
    thcPercent != null ||
    cbdPercent != null ||
    totalCannabinoidsPercent != null ||
    thcMg != null ||
    cbdMg != null ||
    totalCannabinoidsMg != null ||
    (labelInsights.cannabinoids && labelInsights.cannabinoids.length > 0);

  const terpeneList = Array.isArray(terpenes) ? terpenes : [];

  const warningsList = Array.isArray(warnings) ? warnings : [];

  const dosageInfo =
    dosage &&
    (dosage.totalServings ||
      dosage.mgPerServingTHC ||
      dosage.mgPerServingCBD)
      ? dosage
      : null;

  return (
    <Box sx={{ mt: 2, mb: 4 }}>
      {/* Header / Hero */}
      <Card
        elevation={6}
        sx={{
          borderRadius: 3,
          overflow: 'hidden',
          mb: 2.5,
          background:
            'radial-gradient(circle at top, #e8f5e9 0, #ffffff 45%, #fafafa 100%)',
        }}
      >
        <CardContent sx={{ p: 2.5 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            {imageUrl && (
              <Box
                component="img"
                src={imageUrl}
                alt={titlePrimary}
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: 2,
                  objectFit: 'cover',
                  border: '1px solid rgba(0,0,0,0.08)',
                  boxShadow: 1,
                  flexShrink: 0,
                }}
              />
            )}
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="h6"
                sx={{ fontWeight: 800, letterSpacing: 0.3, mb: 0.5 }}
              >
                {titlePrimary}
              </Typography>

              {subtitle && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 0.5 }}
                >
                  {subtitle}
                </Typography>
              )}

              <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={0.5}>
                {isPackagedProduct && (
                  <Chip
                    size="small"
                    color="primary"
                    variant="outlined"
                    label="Packaged product"
                  />
                )}
                {!isPackagedProduct && (
                  <Chip
                    size="small"
                    color="success"
                    variant="outlined"
                    label="Plant / bud"
                  />
                )}
                {dbName && (
                  <Chip
                    size="small"
                    variant="outlined"
                    label={
                      dbConfidence != null
                        ? `DB guess: ${dbName} (${dbConfidence}%)`
                        : `DB guess: ${dbName}`
                    }
                  />
                )}
                {plantStage && (
                  <Chip
                    size="small"
                    variant="outlined"
                    label={`Stage: ${plantStage}`}
                  />
                )}
                {plantHealth && (
                  <Chip
                    size="small"
                    variant="outlined"
                    label={`Health: ${plantHealth}`}
                  />
                )}
                {netWeightValue && (
                  <Chip
                    size="small"
                    variant="outlined"
                    label={`Net: ${netWeightValue} ${
                      netWeightUnit || ''
                    }`.trim()}
                  />
                )}
              </Stack>

              {createdAt && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: 'block', mt: 0.75 }}
                >
                  Scanned{' '}
                  {new Date(createdAt).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </Typography>
              )}
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* AI Decoded Label */}
      {isPackagedProduct && aiSummary && (
        <SectionCard title="AI Decoded Label">
          {aiSummary.title && (
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 700, mb: 0.75 }}
            >
              {aiSummary.title}
            </Typography>
          )}

          {aiSummary.summary && (
            <Typography variant="body2" sx={{ mb: 1.25 }}>
              {aiSummary.summary}
            </Typography>
          )}

          <Stack spacing={0.75}>
            {aiSummary.potencyAnalysis && (
              <FieldRow
                label="Potency"
                value={aiSummary.potencyAnalysis}
                emphasis
              />
            )}
            {aiSummary.terpeneAnalysis && (
              <FieldRow label="Terpenes" value={aiSummary.terpeneAnalysis} />
            )}
            {aiSummary.usageNotes && (
              <FieldRow label="How it might feel" value={aiSummary.usageNotes} />
            )}
            {aiSummary.brandStory && (
              <FieldRow label="Brand story" value={aiSummary.brandStory} />
            )}
            {aiSummary.jurisdictionNotes && (
              <FieldRow
                label="Local rules"
                value={aiSummary.jurisdictionNotes}
              />
            )}
            {aiSummary.dbConsistency && (
              <FieldRow
                label="Database consistency"
                value={aiSummary.dbConsistency}
              />
            )}
          </Stack>

          {Array.isArray(aiSummary.warnings) &&
            aiSummary.warnings.length > 0 && (
              <>
                <Divider sx={{ my: 1.25 }} />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 600, textTransform: 'uppercase' }}
                >
                  Key warnings
                </Typography>
                <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                  {aiSummary.warnings.map((w, idx) => (
                    <Typography key={idx} variant="caption">
                      • {w}
                    </Typography>
                  ))}
                </Stack>
              </>
            )}
        </SectionCard>
      )}

      {/* Potency / Cannabinoids */}
      {potFieldsPresent && (
        <SectionCard title="Potency & Cannabinoids">
          <Stack spacing={0.75}>
            <FieldRow
              label="THC"
              value={formatPercent(thcPercent)}
              emphasis
            />
            <FieldRow label="CBD" value={formatPercent(cbdPercent)} />
            <FieldRow
              label="Total cannabinoids"
              value={formatPercent(totalCannabinoidsPercent)}
            />

            <Divider sx={{ my: 1 }} />

            <FieldRow
              label="THC total"
              value={formatMg(thcMg) || '—'}
            />
            <FieldRow
              label="CBD total"
              value={formatMg(cbdMg) || '—'}
            />
            <FieldRow
              label="Cannabinoids total"
              value={formatMg(totalCannabinoidsMg) || '—'}
            />

            {Array.isArray(labelInsights.cannabinoids) &&
              labelInsights.cannabinoids.length > 0 && (
                <>
                  <Divider sx={{ my: 1 }} />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mb: 0.5 }}
                  >
                    Other cannabinoids
                  </Typography>
                  {labelInsights.cannabinoids.map((c, idx) => (
                    <FieldRow
                      key={idx}
                      label={c.name || 'Cannabinoid'}
                      value={[
                        c.percent != null ? formatPercent(c.percent) : null,
                        c.mg != null ? formatMg(c.mg) : null,
                      ]
                        .filter(Boolean)
                        .join(' • ')}
                    />
                  ))}
                </>
              )}
          </Stack>
        </SectionCard>
      )}

      {/* Terpenes */}
      {terpeneList.length > 0 && (
        <SectionCard title="Terpene Profile">
          <FieldRow
            label="Total terpenes"
            value={
              terpenePercentTotal != null
                ? formatPercent(terpenePercentTotal)
                : null
            }
          />
          <Divider sx={{ my: 1 }} />
          <Stack spacing={0.5}>
            {terpeneList.map((t, idx) => (
              <FieldRow
                key={idx}
                label={t.name || 'Terpene'}
                value={formatPercent(t.percent)}
              />
            ))}
          </Stack>
        </SectionCard>
      )}

      {/* Product Details */}
      {(productType ||
        category ||
        batchId ||
        licenseNumber ||
        labName ||
        jurisdiction ||
        labelInsights.packageDate ||
        labelInsights.testDate ||
        labelInsights.expirationDate ||
        netWeightValue) && (
        <SectionCard title="Product Details">
          <Stack spacing={0.75}>
            <FieldRow label="Product type" value={productType} />
            <FieldRow label="Category" value={category} />
            <FieldRow label="Batch / lot" value={batchId} />
            <FieldRow label="License" value={licenseNumber} />
            <FieldRow label="Testing lab" value={labName} />
            <FieldRow label="Jurisdiction" value={jurisdiction} />
            <FieldRow
              label="Package date"
              value={labelInsights.packageDate}
            />
            <FieldRow label="Test date" value={labelInsights.testDate} />
            <FieldRow
              label="Expiration"
              value={labelInsights.expirationDate}
            />
            <FieldRow
              label="Net weight"
              value={
                netWeightValue
                  ? `${netWeightValue} ${netWeightUnit || ''}`.trim()
                  : null
              }
            />
          </Stack>
        </SectionCard>
      )}

      {/* Warnings & Legal */}
      {(warningsList.length > 0 ||
        ageRestricted ||
        medicalUseOnly ||
        drivingWarning ||
        pregnancyWarning) && (
        <SectionCard title="Warnings & Legal">
          <Stack spacing={0.75}>
            <Stack
              direction="row"
              spacing={1}
              flexWrap="wrap"
              rowGap={0.75}
              sx={{ mb: warningsList.length ? 1 : 0 }}
            >
              {ageRestricted && (
                <Chip
                  size="small"
                  color="error"
                  variant="outlined"
                  label="21+ only"
                />
              )}
              {medicalUseOnly && (
                <Chip
                  size="small"
                  color="error"
                  variant="outlined"
                  label="Medical patients only"
                />
              )}
              {drivingWarning && (
                <Chip
                  size="small"
                  color="warning"
                  variant="outlined"
                  label="Do not drive or operate machinery"
                />
              )}
              {pregnancyWarning && (
                <Chip
                  size="small"
                  color="warning"
                  variant="outlined"
                  label="Not for use during pregnancy or breastfeeding"
                />
              )}
            </Stack>

            {warningsList.length > 0 && (
              <>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 600 }}
                >
                  Label warnings
                </Typography>
                <Stack spacing={0.5}>
                  {warningsList.map((w, idx) => (
                    <Typography key={idx} variant="caption">
                      • {w}
                    </Typography>
                  ))}
                </Stack>
              </>
            )}
          </Stack>
        </SectionCard>
      )}

      {/* Dosage (mostly for edibles) */}
      {dosageInfo && (
        <SectionCard title="Dosage (per serving)">
          <Stack spacing={0.75}>
            <FieldRow
              label="Total servings"
              value={dosageInfo.totalServings}
            />
            <FieldRow
              label="THC per serving"
              value={
                dosageInfo.mgPerServingTHC != null
                  ? `${dosageInfo.mgPerServingTHC} mg`
                  : null
              }
            />
            <FieldRow
              label="CBD per serving"
              value={
                dosageInfo.mgPerServingCBD != null
                  ? `${dosageInfo.mgPerServingCBD} mg`
                  : null
              }
            />
          </Stack>
        </SectionCard>
      )}

      {/* Marketing tags */}
      {Array.isArray(marketingTags) && marketingTags.length > 0 && (
        <SectionCard title="Product Highlights">
          <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={0.75}>
            {marketingTags.map((tag, idx) => (
              <Chip
                key={idx}
                size="small"
                variant="outlined"
                label={tag}
              />
            ))}
          </Stack>
        </SectionCard>
      )}

      {/* Database reference */}
      {(dbName || (Array.isArray(candidates) && candidates.length > 0)) && (
        <SectionCard title="Database Reference (Best Guess)">
          {dbName && (
            <Box sx={{ mb: 1 }}>
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 600, mb: 0.25 }}
              >
                {dbName}
              </Typography>
              {dbConfidence != null && (
                <Typography variant="caption" color="text.secondary">
                  Match confidence: {dbConfidence}%
                </Typography>
              )}
            </Box>
          )}

          {visualMatch && (visualMatch.effects || visualMatch.flavors) && (
            <Stack spacing={0.75} sx={{ mb: 1 }}>
              {visualMatch.effects && visualMatch.effects.length > 0 && (
                <FieldRow
                  label="Common effects"
                  value={visualMatch.effects.join(', ')}
                />
              )}
              {visualMatch.flavors && visualMatch.flavors.length > 0 && (
                <FieldRow
                  label="Flavors / aromas"
                  value={visualMatch.flavors.join(', ')}
                />
              )}
            </Stack>
          )}

          {Array.isArray(candidates) && candidates.length > 1 && (
            <>
              <Divider sx={{ my: 1 }} />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mb: 0.5, display: 'block' }}
              >
                Other close matches
              </Typography>
              <Stack spacing={0.25}>
                {candidates.slice(1, 6).map((c, idx) => (
                  <Typography key={idx} variant="caption">
                    • {c.name}{' '}
                    {normalizeConfidence(c.confidence) != null
                      ? `(${normalizeConfidence(c.confidence)}%)`
                      : ''}
                  </Typography>
                ))}
              </Stack>
            </>
          )}
        </SectionCard>
      )}

      {/* Raw label text */}
      {rawText && (
        <SectionCard title="Full Label Text">
          <Typography
            variant="caption"
            component="pre"
            sx={{
              whiteSpace: 'pre-wrap',
              fontFamily: 'monospace',
              fontSize: '0.7rem',
              maxHeight: 220,
              overflow: 'auto',
              p: 1,
              borderRadius: 1,
              bgcolor: 'rgba(0,0,0,0.02)',
            }}
          >
            {rawText}
          </Typography>
        </SectionCard>
      )}

      {/* Actions */}
      <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
        <Button
          fullWidth
          variant="outlined"
          onClick={() => {
            window.location.reload();
          }}
        >
          Scan another
        </Button>
        {titlePrimary && (
          <Button
            fullWidth
            variant="contained"
            color="primary"
            component="a"
            href={`https://www.google.com/search?q=${encodeURIComponent(
              `${titlePrimary} cannabis strain`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn more online
          </Button>
        )}
      </Box>
    </Box>
  );
}