import { Icon } from '../../chrome/Icon';
import type { Training } from '../../data/types';

// Entrenamientos del día. Grid `auto-fit/minmax` que reflúye en desktop.
interface Props {
  entreno: Training[];
}

export function EntrenoDeHoy({ entreno }: Readonly<Props>) {
  return (
    <div
      style={{
        margin: '0 16px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 10,
      }}
    >
      {entreno.map((t) => (
        <div
          key={`${t.day}-${t.cat}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: 'var(--surface-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '12px 14px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <span
            style={{
              width: 40,
              height: 40,
              borderRadius: 'var(--radius-md)',
              background: 'var(--info-soft)',
              color: 'var(--brand-navy)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon name="footprints" size={20} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-strong)' }}>
              {t.focus}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>
              {t.cat} · {t.time}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
