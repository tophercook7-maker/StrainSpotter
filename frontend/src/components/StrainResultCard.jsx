import React from 'react';

/**
 * Normalizes tag data to strings, handling objects like { name, percent }
 * @param {Array} raw - Raw tag data (strings or objects)
 * @returns {string[]} Array of normalized string tags
 */
function normalizeTags(raw) {
  if (!raw) return [];
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item) => {
      // Already a string, use as-is
      if (typeof item === 'string') return item.trim();

      // If object has name/percent, format nicely
      if (item && typeof item === 'object') {
        // Handle { name, percent }
        if ('name' in item && 'percent' in item) {
          const pct = typeof item.percent === 'number'
            ? Math.round(item.percent)
            : item.percent;
          if (item.name && pct != null && pct !== '') {
            return `${item.name} (${pct}%)`;
          }
          if (item.name) return String(item.name);
        }

        // Generic fallbacks:
        if ('name' in item && item.name) return String(item.name);
        if ('label' in item && item.label) return String(item.label);
        if ('value' in item && item.value) return String(item.value);
      }

      return null;
    })
    .filter(Boolean);
}

export function StrainResultCard({ matchedStrain, scan }) {
  if (!matchedStrain) return null;

  const name = matchedStrain.name || 'Unknown strain';
  const type = normalizeType(matchedStrain.type);
  const thc = formatPercent(matchedStrain.thc);
  const cbd = formatPercent(matchedStrain.cbd);
  
  // CRITICAL: Prioritize effects/flavors from AI summary and label insights
  // Priority order: matchedStrain.effects (from deriveDisplayStrain) > scan.ai_summary > scan.result > scan.label_insights > strain DB
  const rawEffects = 
    matchedStrain.effects ||
    scan?.ai_summary?.effects ||
    scan?.result?.effects ||
    scan?.label_insights?.effects ||
    scan?.packaging_insights?.effects ||
    matchedStrain.visualMatch?.effects ||
    matchedStrain.visualMatch?.strain?.effects ||
    null;
  
  const rawFlavors = 
    matchedStrain.flavors ||
    scan?.label_insights?.terpenes ||
    scan?.packaging_insights?.terpenes ||
    scan?.ai_summary?.terpenes ||
    scan?.ai_summary?.flavors ||
    matchedStrain.visualMatch?.flavors ||
    matchedStrain.visualMatch?.strain?.flavors ||
    null;
  
  // Normalize to arrays first, then normalize to strings
  const effectsArray = toArray(rawEffects);
  const flavorsArray = toArray(rawFlavors);
  
  // CRITICAL: Normalize to strings to prevent React error #31 (objects as children)
  const effects = normalizeTags(effectsArray);
  const flavors = normalizeTags(flavorsArray);
  
  const lineage = matchedStrain.lineage || '';
  const createdAt = scan?.created_at || scan?.createdAt || null;

  return (
    <div
      style={{
        marginTop: '1.25rem',
        marginBottom: '0.5rem',
        padding: '1.1rem 1.0rem',
        borderRadius: '1rem',
        border: '1px solid rgba(76, 175, 80, 0.55)',
        background:
          'radial-gradient(circle at 0% 0%, rgba(178,255,89,0.18), transparent 60%), linear-gradient(145deg, rgba(5,10,5,0.98), rgba(16,30,16,0.98))',
        color: '#e8ffe1',
        boxShadow: '0 16px 40px rgba(0,0,0,0.55)',
        fontFamily:
          'system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
      }}
    >
      {/* Header row: name + type + basic stats */}
      <div
        style={{
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: '0.75rem',
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: '0.78rem',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              opacity: 0.75,
              marginBottom: '0.15rem',
            }}
          >
            Scan result
          </div>
          <div
            style={{
              fontSize: '1.25rem',
              fontWeight: 650,
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {name}
          </div>
          {lineage && (
            <div
              style={{
                fontSize: '0.8rem',
                opacity: 0.75,
                marginTop: '0.2rem',
              }}
            >
              <span style={{ opacity: 0.65 }}>Lineage:&nbsp;</span>
              {lineage}
            </div>
          )}
          {createdAt && (
            <div
              style={{
                fontSize: '0.72rem',
                opacity: 0.65,
                marginTop: '0.2rem',
              }}
            >
              Scanned on {formatDate(createdAt)}
            </div>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem',
            alignItems: 'flex-end',
          }}
        >
          {type && (
            <span
              style={{
                fontSize: '0.7rem',
                padding: '0.24rem 0.6rem',
                borderRadius: 999,
                border: '1px solid rgba(178,255,89,0.8)',
                backgroundColor: 'rgba(12,25,12,0.95)',
                textTransform: 'uppercase',
                letterSpacing: '0.11em',
              }}
            >
              {type}
            </span>
          )}
          <div
            style={{
              display: 'flex',
              gap: '0.25rem',
              fontSize: '0.78rem',
              opacity: 0.88,
            }}
          >
            {thc && (
              <MiniStat label="THC" value={thc} highlight="rgba(255,255,255,0.08)" />
            )}
            {cbd && (
              <MiniStat label="CBD" value={cbd} highlight="rgba(255,255,255,0.04)" />
            )}
          </div>
        </div>
      </div>

      {/* Effects & flavors */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        {effects.length > 0 && (
          <TagSection title="Typical effects" items={effects} tone="effects" />
        )}
        {flavors.length > 0 && (
          <TagSection title="Common flavors" items={flavors} tone="flavors" />
        )}
      </div>
    </div>
  );
}

function MiniStat({ label, value, highlight }) {
  return (
    <div
      style={{
        padding: '0.22rem 0.45rem',
        borderRadius: '0.55rem',
        backgroundColor: highlight,
        border: '1px solid rgba(190, 220, 190, 0.5)',
        minWidth: 44,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: '0.62rem',
          textTransform: 'uppercase',
          opacity: 0.7,
          letterSpacing: '0.09em',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: '0.8rem',
          fontWeight: 600,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function TagSection({ title, items, tone }) {
  // Runtime guard: ensure items is an array and normalize to strings
  const safeItems = Array.isArray(items) ? items : [];
  
  // Filter to only strings (defensive - should already be normalized by caller)
  const cleaned = safeItems
    .map((item) => {
      if (typeof item === 'string') return item;
      // If somehow an object got through, try to extract a string
      if (item && typeof item === 'object') {
        if ('name' in item) return String(item.name);
        if ('label' in item) return String(item.label);
        if ('value' in item) return String(item.value);
      }
      return null;
    })
    .filter(Boolean);
  
  if (cleaned.length === 0) return null;

  const palette =
    tone === 'flavors'
      ? {
          chipBg: 'rgba(255, 248, 225, 0.06)',
          chipBorder: '1px solid rgba(255, 236, 179, 0.7)',
          chipText: '#fff8e1',
          titleColor: '#fff9c4',
        }
      : {
          chipBg: 'rgba(178, 255, 89, 0.08)',
          chipBorder: '1px solid rgba(200, 255, 140, 0.85)',
          chipText: '#e8ffca',
          titleColor: '#e8f5e9',
        };

  return (
    <div style={{ minWidth: 0 }}>
      <div
        style={{
          fontSize: '0.78rem',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          opacity: 0.8,
          marginBottom: '0.25rem',
          color: palette.titleColor,
        }}
      >
        {title}
      </div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.3rem',
        }}
      >
        {cleaned.map((item, idx) => (
          <div
            key={`${title}-${idx}`}
            style={{
              fontSize: '0.76rem',
              padding: '0.2rem 0.55rem',
              borderRadius: 999,
              backgroundColor: palette.chipBg,
              border: palette.chipBorder,
              color: palette.chipText,
              maxWidth: '100%',
            }}
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function toArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function formatPercent(raw) {
  if (raw === null || raw === undefined) return null;
  const num = Number(raw);
  if (!Number.isFinite(num)) return null;
  if (num === 0) return '0%';
  // If values are in range 0–1, convert to %
  if (num > 0 && num <= 1) return `${(num * 100).toFixed(1)}%`;
  if (num > 1 && num < 100) return `${num.toFixed(1)}%`;
  return `${num}%`;
}

function normalizeType(type) {
  if (!type || typeof type !== 'string') return null;
  const lower = type.toLowerCase();
  if (lower.includes('indica') && lower.includes('sativa')) return 'Hybrid';
  if (lower.includes('indica')) return 'Indica';
  if (lower.includes('sativa')) return 'Sativa';
  if (lower.includes('hybrid')) return 'Hybrid';
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function formatDate(value) {
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

export default StrainResultCard;

