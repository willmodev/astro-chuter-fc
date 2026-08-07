import { VENTANA_CUMPLES_DIAS } from '@/lib/domain/cumples';

import { Icon } from '../../chrome/Icon';

import type { Cumple } from '../../data/types';

// Próximos cumpleaños. Grid `auto-fit/minmax` que reflúye (2 cols en mobile,
// más en desktop) — sin scroll horizontal.
interface Props {
  cumple: Cumple[];
}

export function ProximosCumples({ cumple }: Readonly<Props>) {
  if (cumple.length === 0) {
    return (
      <p
        role="status"
        style={{
          margin: 0,
          padding: '0 16px',
          fontSize: 13,
          color: 'var(--text-muted)',
        }}
      >
        Sin cumpleaños en los próximos {VENTANA_CUMPLES_DIAS} días.
      </p>
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: 10,
        padding: '0 16px',
      }}
    >
      {cumple.map((c) => (
        <div
          key={c.name}
          style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '12px 14px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <span
              style={{
                width: 34,
                height: 34,
                borderRadius: 'var(--radius-md)',
                background: 'var(--brand-gold-soft)',
                color: 'var(--brand-gold-deep)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon name="gift" size={18} />
            </span>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'var(--text-strong)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {c.name.split(' ').slice(0, 2).join(' ')}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                {c.cat} · {c.fecha}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
