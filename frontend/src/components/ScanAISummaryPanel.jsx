import React, { useState } from 'react';

/**
 * Comprehensive AI Scan Summary Panel
 * Displays detailed scan results for consumers, dispensaries, and growers
 */
export function ScanAISummaryPanel({ summary }) {
  if (!summary) return null;

  const {
    isPackagedProduct = false,
    matchConfidence = 0,
    matchedStrainName = null,
    estimateConfidenceLabel = 'Unknown',
    estimateType = 'visual-only',
    notes = '',
    label = {},
  } = summary || {};

  const confidencePercent = Math.round(matchConfidence * 100);

  return (
    <div
      style={{
        marginTop: '1.5rem',
        padding: '1.5rem',
        borderRadius: '1rem',
        border: '1px solid rgba(76, 175, 80, 0.5)',
        background:
          'radial-gradient(circle at top left, rgba(178,255,89,0.12), transparent 60%), linear-gradient(135deg, rgba(5,10,5,0.98), rgba(18,32,18,0.98))',
        color: '#e9fbe9',
        boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
        fontFamily:
          'system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.25rem',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              opacity: 0.75,
              marginBottom: '0.25rem',
            }}
          >
            AI scan summary
          </div>
          <div
            style={{
              fontSize: '1.15rem',
              fontWeight: 650,
              lineHeight: 1.2,
            }}
          >
            {matchedStrainName || 'Strain identification'}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '0.25rem',
          }}
        >
          <div
            style={{
              fontSize: '0.7rem',
              padding: '0.3rem 0.65rem',
              borderRadius: '999px',
              border: '1px solid rgba(178,255,89,0.6)',
              backgroundColor: 'rgba(12,25,12,0.95)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              whiteSpace: 'nowrap',
            }}
          >
            {estimateConfidenceLabel} • {confidencePercent}%
          </div>
        </div>
      </div>

      {/* Packaged product callout */}
      {isPackagedProduct && (
        <div
          style={{
            marginBottom: '1.25rem',
            padding: '0.75rem 1rem',
            borderRadius: '0.7rem',
            backgroundColor: 'rgba(76, 175, 80, 0.15)',
            border: '1px solid rgba(178,255,89,0.5)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <span style={{ fontSize: '1.2rem' }}>📦</span>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: '0.85rem',
                fontWeight: 600,
                marginBottom: '0.15rem',
              }}
            >
              Packaged product detected
            </div>
            <div
              style={{
                fontSize: '0.75rem',
                opacity: 0.85,
              }}
            >
              This appears to be a retail cannabis product with compliance labeling.
            </div>
          </div>
        </div>
      )}

      {/* Label decode section */}
      {(label.productName ||
        label.brandName ||
        label.packageType ||
        label.thcPercent ||
        label.cbdPercent) && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div
            style={{
              fontSize: '0.8rem',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              opacity: 0.8,
              marginBottom: '0.75rem',
            }}
          >
            Label decode
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '0.75rem',
            }}
          >
            <LabelField label="Product name" value={label.productName} />
            <LabelField label="Brand name" value={label.brandName} />
            <LabelField label="Package type" value={label.packageType} />
            <LabelField label="Package size" value={label.packageSize} />
            <LabelField label="THC %" value={label.thcPercent ? `${label.thcPercent}%` : null} />
            <LabelField label="CBD %" value={label.cbdPercent ? `${label.cbdPercent}%` : null} />
            <LabelField label="THCA %" value={label.thcaPercent ? `${label.thcaPercent}%` : null} />
            <LabelField label="Batch ID" value={label.batchId} />
            <LabelField label="Lot number" value={label.lotNumber} />
            <LabelField label="Harvest date" value={label.harvestDate} />
            <LabelField label="Test date" value={label.testDate} />
            <LabelField label="Lab name" value={label.labName} />
            <LabelField label="License number" value={label.licenseNumber} />
          </div>
        </div>
      )}

      {/* How this estimate was made */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div
          style={{
            fontSize: '0.8rem',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            opacity: 0.8,
            marginBottom: '0.75rem',
          }}
        >
          How this estimate was made
        </div>
        <div
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '0.7rem',
            backgroundColor: 'rgba(16, 28, 16, 0.95)',
            border: '1px solid rgba(120, 180, 120, 0.6)',
          }}
        >
          <div
            style={{
              fontSize: '0.85rem',
              marginBottom: '0.5rem',
              fontWeight: 500,
            }}
          >
            Method: {estimateType === 'visual+label' ? 'Visual + Label' : estimateType === 'label-only' ? 'Label only' : 'Visual only'}
          </div>
          {notes && (
            <div
              style={{
                fontSize: '0.8rem',
                opacity: 0.9,
                lineHeight: 1.5,
              }}
            >
              {notes}
            </div>
          )}
        </div>
      </div>

      {/* For dispensaries */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div
          style={{
            fontSize: '0.8rem',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            opacity: 0.8,
            marginBottom: '0.75rem',
          }}
        >
          For dispensaries
        </div>
        <div
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '0.7rem',
            backgroundColor: 'rgba(16, 26, 18, 0.96)',
            border: '1px solid rgba(110, 170, 130, 0.6)',
          }}
        >
          <ul
            style={{
              margin: 0,
              paddingLeft: '1.25rem',
              fontSize: '0.85rem',
              lineHeight: 1.6,
              listStyleType: 'disc',
            }}
          >
            <li>Verify THC/CBD percentages match your POS system</li>
            <li>Confirm brand name matches inventory records</li>
            <li>Validate license number against state database</li>
            <li>Record batch/lot number for compliance tracking</li>
            {isPackagedProduct && (
              <li style={{ fontWeight: 600, color: '#b2ff59' }}>
                ✓ Appears to be a ready-for-sale packaged product
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* For growers */}
      <div>
        <div
          style={{
            fontSize: '0.8rem',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            opacity: 0.8,
            marginBottom: '0.75rem',
          }}
        >
          For growers
        </div>
        <div
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '0.7rem',
            backgroundColor: 'rgba(10, 18, 12, 0.96)',
            border: '1px solid rgba(90, 130, 100, 0.6)',
          }}
        >
          <ul
            style={{
              margin: 0,
              paddingLeft: '1.25rem',
              fontSize: '0.85rem',
              lineHeight: 1.6,
              listStyleType: 'disc',
            }}
          >
            <li>Use strain match for phenotype tracking and lineage verification</li>
            <li>Compare THC/THCA percentages against previous batch records</li>
            <li>Track origin, curing results, and harvest dates</li>
            <li>Prepare for future terpene profile integration</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function LabelField({ label, value }) {
  return (
    <div
      style={{
        padding: '0.5rem 0.65rem',
        borderRadius: '0.55rem',
        backgroundColor: 'rgba(16, 28, 16, 0.95)',
        border: '1px solid rgba(120, 180, 120, 0.4)',
      }}
    >
      <div
        style={{
          fontSize: '0.7rem',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          opacity: 0.7,
          marginBottom: '0.2rem',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: '0.85rem',
          fontWeight: value ? 500 : 400,
          color: value ? '#e8ffe1' : 'rgba(255,255,255,0.4)',
        }}
      >
        {value || '—'}
      </div>
    </div>
  );
}

export default ScanAISummaryPanel;
