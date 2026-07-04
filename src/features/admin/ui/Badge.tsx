import type { CSSProperties, ReactNode } from 'react';

// Píldora de estado. Los tonos siguen el vocabulario de la cartera:
// paid (verde), due (rojo), pending (gris), partial (ámbar) + marca.
export type BadgeTone =
  | 'paid'
  | 'due'
  | 'pending'
  | 'partial'
  | 'info'
  | 'navy'
  | 'gold'
  | 'neutral';

interface Props {
  tone?: BadgeTone;
  subtle?: boolean;
  dot?: boolean;
  children: ReactNode;
  style?: CSSProperties;
}

const TONES: Record<BadgeTone, { bg: string; fg: string; solidBg: string }> = {
  paid: { bg: 'var(--success-soft)', fg: 'var(--success-deep)', solidBg: 'var(--success)' },
  due: { bg: 'var(--error-soft)', fg: 'var(--error-deep)', solidBg: 'var(--error)' },
  pending: { bg: 'var(--cell-pending-bg)', fg: 'var(--cell-pending-fg)', solidBg: 'var(--neutral-400)' },
  partial: { bg: 'var(--warning-soft)', fg: '#946200', solidBg: 'var(--warning)' },
  info: { bg: 'var(--info-soft)', fg: 'var(--brand-navy)', solidBg: 'var(--brand-blue)' },
  navy: { bg: 'var(--brand-navy)', fg: '#fff', solidBg: 'var(--brand-navy)' },
  gold: { bg: 'var(--brand-gold-soft)', fg: 'var(--brand-gold-deep)', solidBg: 'var(--brand-gold)' },
  neutral: { bg: 'var(--neutral-100)', fg: 'var(--neutral-700)', solidBg: 'var(--neutral-500)' },
};

export function Badge({ tone = 'neutral', subtle = true, dot = false, children, style }: Props) {
  const t = TONES[tone];
  const solid = !subtle;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        height: 22,
        padding: '0 9px',
        borderRadius: 'var(--radius-pill)',
        fontFamily: 'var(--font-sans)',
        fontSize: 12,
        fontWeight: 700,
        lineHeight: 1,
        letterSpacing: '0.01em',
        background: solid ? t.solidBg : t.bg,
        color: solid ? '#fff' : t.fg,
        ...style,
      }}
    >
      {dot && (
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: solid ? '#fff' : t.solidBg,
          }}
        />
      )}
      {children}
    </span>
  );
}
