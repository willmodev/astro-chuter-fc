import { Icon, type IconName } from './Icon';

// Botón redondo para el slot derecho del header.
type Tone = 'default' | 'gold';

interface Props {
  icon: IconName;
  onClick?: () => void;
  tone?: Tone;
  badge?: number | null;
  label?: string;
}

const TONES: Record<Tone, { bg: string; fg: string; bd: string }> = {
  default: { bg: 'var(--surface-sunken)', fg: 'var(--brand-navy)', bd: 'var(--border-subtle)' },
  gold: { bg: 'var(--brand-gold)', fg: 'var(--text-on-gold)', bd: 'var(--brand-gold)' },
};

export function IconButton({ icon, onClick, tone = 'default', badge, label }: Props) {
  const t = TONES[tone];
  return (
    <button
      onClick={onClick}
      aria-label={label}
      style={{
        position: 'relative',
        width: 38,
        height: 38,
        borderRadius: 'var(--radius-md)',
        border: `1px solid ${t.bd}`,
        background: t.bg,
        color: t.fg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        padding: 0,
      }}
    >
      <Icon name={icon} size={19} />
      {badge != null && (
        <span
          style={{
            position: 'absolute',
            top: -6,
            right: -6,
            minWidth: 18,
            height: 18,
            padding: '0 4px',
            borderRadius: 999,
            background: 'var(--error)',
            color: '#fff',
            fontSize: 10.5,
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid var(--surface-card)',
          }}
        >
          {badge}
        </span>
      )}
    </button>
  );
}
