import type { CSSProperties, ReactNode } from 'react';

// Superficie base del admin: blanca, borde 1px, sombra suave, radio lg.
// `pad` alterna el padding interno; `title`/`eyebrow`/`actions` arman
// una fila de cabecera opcional.
interface Props {
  title?: string;
  eyebrow?: string;
  actions?: ReactNode;
  pad?: boolean;
  children: ReactNode;
  style?: CSSProperties;
}

export function Card({ title, eyebrow, actions, pad = true, children, style }: Props) {
  const hasHeader = title || eyebrow || actions;
  return (
    <section
      style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        overflow: 'hidden',
        ...style,
      }}
    >
      {hasHeader && (
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div>
            {eyebrow && (
              <div className="eyebrow" style={{ marginBottom: 3 }}>
                {eyebrow}
              </div>
            )}
            {title && (
              <h3
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 16,
                  fontWeight: 700,
                  color: 'var(--text-strong)',
                  margin: 0,
                }}
              >
                {title}
              </h3>
            )}
          </div>
          {actions && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>{actions}</div>
          )}
        </header>
      )}
      <div style={{ padding: pad ? 20 : 0 }}>{children}</div>
    </section>
  );
}
