import type { ReactNode } from 'react';

import { Icon } from './Icon';

// Header del contenido: eyebrow + título display, botón atrás y slot
// derecho opcional. Vive dentro de la columna de contenido tanto en
// mobile (arriba) como en desktop (inline). El notch iOS del prototipo
// se reemplaza por la safe-area del layout.
interface Props {
  title: string;
  eyebrow?: string;
  onBack?: () => void;
  right?: ReactNode;
}

export function AppHeader({ title, eyebrow, onBack, right }: Readonly<Props>) {
  return (
    <header
      style={{
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        zIndex: 10,
        background: 'var(--surface-card)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '16px 18px 12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
        {onBack && (
          <button
            onClick={onBack}
            aria-label="Atrás"
            style={{
              flexShrink: 0,
              width: 38,
              height: 38,
              marginBottom: 1,
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              background: 'var(--surface-sunken)',
              color: 'var(--brand-navy)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <Icon name="arrow-left" size={19} />
          </button>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          {eyebrow && (
            <div className="eyebrow" style={{ color: 'var(--accent-deep)', marginBottom: 1 }}>
              {eyebrow}
            </div>
          )}
          <h1
            className="font-display"
            style={{
              fontSize: 32,
              lineHeight: 0.95,
              color: 'var(--brand-navy)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {title}
          </h1>
        </div>
        {right && (
          <div
            style={{
              flexShrink: 0,
              display: 'flex',
              gap: 8,
              alignItems: 'center',
              marginBottom: 1,
            }}
          >
            {right}
          </div>
        )}
      </div>
    </header>
  );
}
