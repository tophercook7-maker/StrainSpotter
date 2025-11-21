import React from 'react';

export function ScanAISummaryPanel({ aiSummary, visionText }) {
  if (!aiSummary) return null;

  const {
    userFacingSummary = '',
    effectsAndUseCases = [],
    risksAndWarnings = [],
    dispensaryNotes = '',
    growerNotes = '',
    confidenceNote = '',
  } = aiSummary || {};

  const [showLabelText, setShowLabelText] = React.useState(false);

  const confidenceBadge = getConfidenceBadge(confidenceNote);

  return (
    <div
      style={{
        marginTop: '1.5rem',
        padding: '1.25rem',
        borderRadius: '0.9rem',
        border: '1px solid rgba(76, 175, 80, 0.4)',
        background:
          'radial-gradient(circle at top left, rgba(178,255,89,0.08), transparent 55%), linear-gradient(135deg, rgba(6,12,6,0.98), rgba(18,32,18,0.98))',
        color: '#e9fbe9',
        boxShadow: '0 14px 40px rgba(0,0,0,0.55)',
        fontFamily:
          'system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
      }}
    >
      {/* Header row: icon + title + confidence badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '0.75rem',
        }}
      >
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: '999px',
            background:
              'radial-gradient(circle at 28% 28%, #b2ff59, #4caf50 45%, #1b5e20 90%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            boxShadow: '0 0 16px rgba(178,255,89,0.7)',
          }}
        >
          🌿
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: '0.8rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              opacity: 0.75,
            }}
          >
            AI-Assisted Strain Insight
          </div>
          <div
            style={{
              fontSize: '1.05rem',
              fontWeight: 600,
              marginTop: 1,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            What this scan suggests
          </div>
        </div>

        {confidenceBadge && (
          <div
            style={{
              fontSize: '0.7rem',
              padding: '0.25rem 0.55rem',
              borderRadius: '999px',
              border: `1px solid ${confidenceBadge.border}`,
              color: confidenceBadge.text,
              backgroundColor: confidenceBadge.bg,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              whiteSpace: 'nowrap',
            }}
          >
            {confidenceBadge.label}
          </div>
        )}
      </div>

      {/* Primary summary - "For you" */}
      {userFacingSummary && (
        <div
          style={{
            marginBottom: '1.05rem',
            padding: '0.65rem 0.7rem',
            borderRadius: '0.7rem',
            backgroundColor: 'rgba(16, 28, 16, 0.95)',
            border: '1px solid rgba(120, 180, 120, 0.6)',
          }}
        >
          <div
            style={{
              fontSize: '0.78rem',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              opacity: 0.75,
              marginBottom: '0.25rem',
            }}
          >
            For you
          </div>
          <p
            style={{
              fontSize: '0.9rem',
              lineHeight: 1.55,
              margin: 0,
              color: '#f5fff5',
            }}
          >
            {userFacingSummary}
          </p>
        </div>
      )}

      {/* Effects, risks, and role-specific sections in a grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 1.1fr)',
          gap: '1.05rem',
          alignItems: 'flex-start',
        }}
      >
        <div>
          {effectsAndUseCases?.length > 0 && (
            <PillSection
              title="Likely effects & use cases"
              subtitle="Based on typical reports"
              items={effectsAndUseCases}
              tone="positive"
            />
          )}

          {risksAndWarnings?.length > 0 && (
            <PillSection
              title="Risks & cautions"
              subtitle="Not medical advice"
              items={risksAndWarnings}
              tone="warning"
            />
          )}
        </div>

        <div>
          {dispensaryNotes && (
            <TextSection
              title="For dispensary staff"
              body={dispensaryNotes}
              accent="accent"
            />
          )}
          {growerNotes && (
            <TextSection
              title="For growers"
              body={growerNotes}
              accent="muted"
            />
          )}
        </div>
      </div>

      {/* Optional label text (what Vision read) */}
      {visionText && visionText.trim().length > 0 && (
        <div
          style={{
            marginTop: '1rem',
            padding: '0.6rem 0.75rem',
            borderRadius: '0.7rem',
            backgroundColor: 'rgba(10, 18, 10, 0.96)',
            border: '1px solid rgba(110, 160, 110, 0.6)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <div
              style={{
                fontSize: '0.78rem',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                opacity: 0.8,
              }}
            >
              What we read from your label
            </div>
            <button
              type="button"
              onClick={() => setShowLabelText((v) => !v)}
              style={{
                fontSize: '0.7rem',
                padding: '0.25rem 0.55rem',
                borderRadius: '999px',
                border: '1px solid rgba(130, 170, 130, 0.8)',
                background: 'rgba(4, 8, 4, 0.95)',
                color: '#def9de',
                cursor: 'pointer',
              }}
            >
              {showLabelText ? 'Hide text' : 'Show text'}
            </button>
          </div>
          {showLabelText && (
            <pre
              style={{
                margin: '0.45rem 0 0',
                padding: '0.45rem 0.55rem',
                borderRadius: '0.55rem',
                backgroundColor: 'rgba(3, 5, 3, 0.95)',
                fontSize: '0.75rem',
                lineHeight: 1.4,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                fontFamily:
                  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                color: '#e5ffe5',
                border: '1px solid rgba(70, 110, 70, 0.7)',
              }}
            >
              {visionText.trim()}
            </pre>
          )}
        </div>
      )}

      {/* Confidence note + disclaimer */}
      {confidenceNote && (
        <div
          style={{
            marginTop: '0.9rem',
            padding: '0.6rem 0.75rem',
            borderRadius: '0.7rem',
            backgroundColor: 'rgba(24, 32, 24, 0.96)',
            border: '1px solid rgba(150, 200, 150, 0.35)',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.5rem',
            color: '#d4ecd4',
          }}
        >
          <span style={{ fontSize: '1rem', lineHeight: 1 }}>🧭</span>
          <span>
            <span style={{ fontWeight: 500 }}>Confidence note:&nbsp;</span>
            {confidenceNote}
          </span>
        </div>
      )}

      <div
        style={{
          marginTop: '0.5rem',
          fontSize: '0.7rem',
          opacity: 0.65,
        }}
      >
        This information is generated by AI and is not medical advice. Always
        follow local laws and consult a professional if you have health
        questions.
      </div>
    </div>
  );
}

function PillSection({ title, subtitle, items, tone }) {
  if (!items || items.length === 0) return null;

  const palette =
    tone === 'warning'
      ? {
          bg: 'rgba(255, 204, 128, 0.06)',
          border: '1px solid rgba(255, 214, 102, 0.35)',
          chipBg: 'rgba(255, 214, 102, 0.12)',
          chipBorder: '1px solid rgba(255, 214, 102, 0.5)',
          chipText: '#ffe9ae',
        }
      : {
          bg: 'rgba(178, 255, 89, 0.06)',
          border: '1px solid rgba(178, 255, 89, 0.35)',
          chipBg: 'rgba(178, 255, 89, 0.12)',
          chipBorder: '1px solid rgba(178, 255, 89, 0.5)',
          chipText: '#e8ffca',
        };

  return (
    <div
      style={{
        marginBottom: '0.9rem',
        padding: '0.6rem 0.7rem',
        borderRadius: '0.7rem',
        backgroundColor: palette.bg,
        border: palette.border,
      }}
    >
      <div
        style={{
          fontSize: '0.8rem',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          opacity: 0.8,
          marginBottom: '0.1rem',
        }}
      >
        {title}
      </div>
      {subtitle && (
        <div
          style={{
            fontSize: '0.72rem',
            opacity: 0.7,
            marginBottom: '0.4rem',
          }}
        >
          {subtitle}
        </div>
      )}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.35rem',
        }}
      >
        {items.map((item, idx) => {
          if (!item) return null;
          return (
            <div
              key={`${title}-${idx}`}
              style={{
                fontSize: '0.78rem',
                padding: '0.22rem 0.55rem',
                borderRadius: 999,
                backgroundColor: palette.chipBg,
                border: palette.chipBorder,
                color: palette.chipText,
                maxWidth: '100%',
              }}
            >
              {item}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TextSection({ title, body, accent }) {
  if (!body) return null;

  const palette =
    accent === 'accent'
      ? {
          bg: 'rgba(16, 26, 18, 0.96)',
          border: '1px solid rgba(110, 170, 130, 0.6)',
        }
      : {
          bg: 'rgba(10, 18, 12, 0.96)',
          border: '1px solid rgba(90, 130, 100, 0.6)',
        };

  return (
    <div
      style={{
        marginBottom: '0.8rem',
        padding: '0.65rem 0.7rem',
        borderRadius: '0.7rem',
        backgroundColor: palette.bg,
        border: palette.border,
      }}
    >
      <div
        style={{
          fontSize: '0.78rem',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          opacity: 0.75,
          marginBottom: '0.2rem',
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: '0.82rem',
          lineHeight: 1.45,
          color: '#f1fff1',
        }}
      >
        {body}
      </div>
    </div>
  );
}

function getConfidenceBadge(confidenceNote) {
  if (!confidenceNote || typeof confidenceNote !== 'string') return null;

  const note = confidenceNote.toLowerCase();

  if (note.includes('high')) {
    return {
      label: 'High confidence',
      bg: 'rgba(76, 175, 80, 0.16)',
      border: 'rgba(129, 199, 132, 0.9)',
      text: '#c8facc',
    };
  }

  if (note.includes('medium') || note.includes('moderate')) {
    return {
      label: 'Medium confidence',
      bg: 'rgba(255, 213, 79, 0.14)',
      border: 'rgba(255, 241, 118, 0.9)',
      text: '#fff8c5',
    };
  }

  if (note.includes('low') || note.includes('uncertain') || note.includes('limited')) {
    return {
      label: 'Low confidence',
      bg: 'rgba(176, 190, 197, 0.18)',
      border: 'rgba(207, 216, 220, 0.9)',
      text: '#eceff1',
    };
  }

  return {
    label: 'AI estimate',
    bg: 'rgba(120, 144, 156, 0.16)',
    border: 'rgba(176, 190, 197, 0.9)',
    text: '#eceff1',
  };
}

export default ScanAISummaryPanel;
