import React from 'react';

// AI summary panel for scan results.
// - Shows everything the AI / OCR knows about the product.
// - Only shows the "Packaged product detected" callout when summary.isPackagedProduct === true.
// - Includes dedicated sections "For dispensaries" and "For growers".
//
// Expected `summary` shape (from backend buildScanAISummary):
// {
//   isPackagedProduct: boolean,
//   matchConfidence: number | null,  // 0–1
//   matchedStrainName: string | null,
//   estimateConfidenceLabel: string,
//   estimateType: "visual+label" | "visual-only" | "label-only",
//   notes: string,
//   label: {
//     productName,
//     brandName,
//     packageType,
//     packageSize,
//     thcPercent,
//     cbdPercent,
//     thcaPercent,
//     batchId,
//     lotNumber,
//     harvestDate,
//     testDate,
//     labName,
//     licenseNumber,
//     originType
//   }
// }

function formatPercent(value) {
  if (value == null || Number.isNaN(Number(value))) return '—';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return `${num.toFixed(2)}%`;
}

function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString();
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <span style={{ fontSize: 11, opacity: 0.7 }}>{label}</span>
      <span style={{ fontSize: 13 }}>
        {value != null && value !== '' ? value : '—'}
      </span>
    </div>
  );
}

export default function ScanAISummaryPanel({ summary }) {
  if (!summary) return null;

  const {
    isPackagedProduct,
    matchConfidence,
    matchedStrainName,
    estimateConfidenceLabel,
    estimateType,
    notes,
    scanType = 'bud',
    stabilityScore = 1.0,
    stabilityLabel = 'single-frame',
    numberOfFrames = 1,
    label = {},
  } = summary;

  const {
    productName,
    brandName,
    packageType,
    packageSize,
    thcPercent,
    cbdPercent,
    thcaPercent,
    batchId,
    lotNumber,
    harvestDate,
    testDate,
    labName,
    licenseNumber,
    originType,
  } = label;

  const confidenceText =
    estimateConfidenceLabel ||
    (matchConfidence != null
      ? `${Math.round(
          (matchConfidence <= 1 ? matchConfidence * 100 : matchConfidence)
        )}% match`
      : 'Unknown');

  const effectiveEstimateType =
    estimateType || (isPackagedProduct ? 'visual+label' : 'visual-only');

  const showLabelBlock =
    isPackagedProduct ||
    Boolean(
      productName ||
        brandName ||
        thcPercent != null ||
        cbdPercent != null ||
        thcaPercent != null
    );

  return (
    <div
      style={{
        marginTop: 16,
        marginBottom: 16,
        padding: 16,
        borderRadius: 24,
        background:
          'linear-gradient(145deg, rgba(5,20,10,0.96), rgba(5,35,15,0.96))',
        color: '#f5fff5',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Header */}
      <div
        style={{
          marginBottom: 12,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <div>
          <div
            style={{
              textTransform: 'uppercase',
              fontSize: 11,
              letterSpacing: 1.2,
              opacity: 0.7,
            }}
          >
            AI scan summary
          </div>
          <div style={{ fontSize: 14, opacity: 0.8 }}>
            {confidenceText}
            {matchConfidence != null && (
              <>
                {' '}
                •{' '}
                {Math.round(
                  (matchConfidence <= 1 ? matchConfidence * 100 : matchConfidence)
                )}
                %
              </>
            )}
          </div>
          {/* Scan type and stability info */}
          <div
            style={{
              fontSize: 11,
              opacity: 0.7,
              marginTop: 4,
              display: 'flex',
              gap: 8,
              flexWrap: 'wrap',
            }}
          >
            <span>
              Scan type: {scanType === 'package' ? 'Packaged product' : scanType === 'bud' ? 'Loose flower' : 'Live plant'}
            </span>
            {numberOfFrames > 1 && (
              <>
                <span>•</span>
                <span>{numberOfFrames}-angle scan</span>
                <span>•</span>
                <span>
                  Stability: {stabilityLabel === 'high' ? 'High' : stabilityLabel === 'medium' ? 'Medium' : 'Low'}
                  {stabilityLabel === 'low' && ' (angles disagree, consider rescanning)'}
                  {stabilityLabel === 'medium' && ' (angles partly agree)'}
                </span>
              </>
            )}
            {numberOfFrames === 1 && (
              <>
                <span>•</span>
                <span>Single-frame scan. Add more angles in future updates for higher stability.</span>
              </>
            )}
          </div>
        </div>
        {matchedStrainName && (
          <div
            style={{
              fontSize: 13,
              padding: '4px 10px',
              borderRadius: 999,
              border: '1px solid rgba(180,255,190,0.3)',
              textAlign: 'right',
            }}
          >
            Closest match: <strong>{matchedStrainName}</strong>
          </div>
        )}
      </div>

      {/* Packaged product callout */}
      {isPackagedProduct && (
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            borderRadius: 16,
            background:
              'linear-gradient(135deg, rgba(40,80,30,0.9), rgba(15,40,20,0.95))',
            border: '1px solid rgba(200,255,200,0.18)',
            fontSize: 13,
            lineHeight: 1.4,
          }}
        >
          <div
            style={{
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: 1,
              opacity: 0.7,
              marginBottom: 4,
            }}
          >
            Packaged product detected
          </div>
          <div>
            This looks like a packaged cannabis product. THC, CBD, and other
            label details were read directly from the photo and used to refine
            the strain estimate.
          </div>
        </div>
      )}

      {/* Label decode section */}
      {showLabelBlock && (
        <div style={{ marginBottom: 18 }}>
          <div
            style={{
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: 1,
              opacity: 0.7,
              marginBottom: 6,
            }}
          >
            Label decode
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
              gap: 8,
              fontSize: 13,
            }}
          >
            <InfoRow label="Product name" value={productName} />
            <InfoRow label="Brand" value={brandName} />
            <InfoRow
              label="Package type"
              value={packageType || (isPackagedProduct ? 'Packaged product' : '—')}
            />
            <InfoRow label="Package size" value={packageSize} />
            <InfoRow label="THC on label" value={formatPercent(thcPercent)} />
            <InfoRow label="CBD on label" value={formatPercent(cbdPercent)} />
            <InfoRow label="THCA on label" value={formatPercent(thcaPercent)} />
            <InfoRow label="Batch / Lot" value={batchId || lotNumber} />
            <InfoRow label="Harvest date" value={formatDate(harvestDate)} />
            <InfoRow label="Test date" value={formatDate(testDate)} />
            <InfoRow label="Lab" value={labName} />
            <InfoRow label="License #" value={licenseNumber} />
          </div>
        </div>
      )}

      {/* How this estimate was made */}
      <div style={{ marginBottom: 18 }}>
        <div
          style={{
            fontSize: 11,
            textTransform: 'uppercase',
            letterSpacing: 1,
            opacity: 0.7,
            marginBottom: 6,
          }}
        >
          How this estimate was made
        </div>
        <p
          style={{
            fontSize: 13,
            lineHeight: 1.5,
            margin: 0,
            opacity: 0.9,
          }}
        >
          {effectiveEstimateType === 'visual+label' && (
            <>
              This estimate combines what the AI sees in the plant/packaging
              (color, structure, visual features) with text decoded from the
              label (THC/CBD numbers, brand, product name).
            </>
          )}
          {effectiveEstimateType === 'label-only' && (
            <>
              This estimate relies mainly on the label text (THC/CBD numbers,
              product name, brand). Visual features had little or no impact.
            </>
          )}
          {effectiveEstimateType === 'visual-only' && (
            <>
              No reliable label text was found. This estimate is based mainly on
              visual features and should be treated as an educated guess.
            </>
          )}
        </p>
        {notes && (
          <p
            style={{
              fontSize: 13,
              lineHeight: 1.5,
              marginTop: 8,
              opacity: 0.85,
            }}
          >
            {notes}
          </p>
        )}
      </div>

      {/* Section: For dispensaries */}
      <div
        style={{
          marginBottom: 14,
          padding: 12,
          borderRadius: 16,
          background: 'rgba(10, 40, 15, 0.9)',
          border: '1px solid rgba(130, 220, 150, 0.35)',
        }}
      >
        <div
          style={{
            fontSize: 11,
            textTransform: 'uppercase',
            letterSpacing: 1,
            opacity: 0.8,
            marginBottom: 4,
          }}
        >
          For dispensaries
        </div>
        <ul
          style={{
            paddingLeft: 16,
            margin: 0,
            fontSize: 13,
            lineHeight: 1.45,
          }}
        >
          <li>
            Use the <strong>THC/CBD on label</strong> values above to verify
            they match your menu and label requirements.
          </li>
          {brandName && (
            <li>
              Confirm this product is listed under{' '}
              <strong>{brandName}</strong> in your POS / menu system.
            </li>
          )}
          {licenseNumber && (
            <li>
              Check that license <strong>{licenseNumber}</strong> is valid for
              the product&apos;s origin.
            </li>
          )}
          {batchId || lotNumber ? (
            <li>
              Record batch/lot ID <strong>{batchId || lotNumber}</strong> for
              traceability and recall audits.
            </li>
          ) : (
            <li>
              Consider recording <strong>batch / lot ID</strong> for
              traceability, if present on the physical label.
            </li>
          )}
          {isPackagedProduct ? (
            <li>
              This scan looks like a <strong>ready-for-sale package</strong>.
              Use it to support intake checks and compliance reviews.
            </li>
          ) : (
            <li>
              This scan does <strong>not</strong> look like a full retail
              package. Treat this as a visual estimate only, not a compliance
              check.
            </li>
          )}
        </ul>
      </div>

      {/* Section: For growers */}
      <div
        style={{
          padding: 12,
          borderRadius: 16,
          background: 'rgba(5, 35, 15, 0.9)',
          border: '1px solid rgba(110, 200, 140, 0.3)',
        }}
      >
        <div
          style={{
            fontSize: 11,
            textTransform: 'uppercase',
            letterSpacing: 1,
            opacity: 0.8,
            marginBottom: 4,
          }}
        >
          For growers
        </div>
        <ul
          style={{
            paddingLeft: 16,
            margin: 0,
            fontSize: 13,
            lineHeight: 1.45,
          }}
        >
          {matchedStrainName ? (
            <li>
              Visual / label features are closest to{' '}
              <strong>{matchedStrainName}</strong>. Use this as a reference
              when tracking phenotype consistency across batches.
            </li>
          ) : (
            <li>
              Use this estimate as a starting point when comparing phenotypes or
              dialing in new genetics.
            </li>
          )}
          {thcPercent != null && (
            <li>
              Label THC: <strong>{formatPercent(thcPercent)}</strong>. Compare
              this to your historical averages for this strain or batch.
            </li>
          )}
          {thcaPercent != null && (
            <li>
              Label THCA: <strong>{formatPercent(thcaPercent)}</strong>. Use
              this alongside THC and CBD to track decarb and curing results.
            </li>
          )}
          {originType && (
            <li>
              Origin detected as: <strong>{originType}</strong>. Keep this
              consistent between your internal records and packaging.
            </li>
          )}
          <li>
            Future versions of StrainSpotter can add{' '}
            <strong>terpene profiles</strong> and grow notes once lab data is
            linked to this product.
          </li>
        </ul>
      </div>
    </div>
  );
}
