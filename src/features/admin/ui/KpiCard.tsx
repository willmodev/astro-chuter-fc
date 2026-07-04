import type { CSSProperties, ReactNode } from 'react';

// Tile de métrica del dashboard: numeral Bebas grande, label, delta y
// franja de acento. `accent` tinta el chip del icono y la franja.
type Accent = 'navy' | 'gold' | 'blue' | 'success' | 'error';
type DeltaTone = 'paid' | 'due' | 'neutral';

interface Props {
  label: string;
  value: string | number;
  unit?: string;
  delta?: string;
  deltaTone?: DeltaTone;
  icon?: ReactNode;
  accent?: Accent;
  style?: CSSProperties;
}

const ACCENTS: Record<Accent, string> = {
  navy: 'var(--brand-navy)',
  gold: 'var(--brand-gold-deep)',
  blue: 'var(--brand-blue)',
  success: 'var(--success)',
  error: 'var(--error)',
};

const DELTA_COLORS: Record<DeltaTone, string> = {
  paid: 'var(--success-deep)',
  due: 'var(--error-deep)',
  neutral: 'var(--text-muted)',
};

export function KpiCard({
  label,
  value,
  unit,
  delta,
  deltaTone = 'paid',
  icon,
  accent = 'navy',
  style,
}: Props) {
  const a = ACCENTS[accent];
  return (
    <div
      style={{
        position: 'relative',
        background: 'var(--surface-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        padding: '18px 20px',
        overflow: 'hidden',
        ...style,
      }}
    >
      <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: a }} />
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        <div className="eyebrow">{label}</div>
        {icon && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 30,
              height: 30,
              borderRadius: 'var(--radius-md)',
              background: `color-mix(in srgb, ${a} 12%, white)`,
              color: a,
            }}
          >
            {icon}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 10 }}>
        <span
          className="tabular"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 38,
            lineHeight: 1,
            color: 'var(--text-strong)',
            letterSpacing: '.01em',
          }}
        >
          {value}
        </span>
        {unit && (
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)' }}>{unit}</span>
        )}
      </div>
      {delta && (
        <div
          style={{ marginTop: 8, fontSize: 12, fontWeight: 600, color: DELTA_COLORS[deltaTone] }}
        >
          {delta}
        </div>
      )}
    </div>
  );
}
