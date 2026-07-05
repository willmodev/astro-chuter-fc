import type { ReactNode } from 'react';

// Fila etiqueta → valor de las tabs informativas (Uniforme, Acudiente).
interface Props {
  label: string;
  children: ReactNode;
}

export function FilaDato({ label, children }: Readonly<Props>) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: 16,
        padding: '11px 0',
        borderBottom: '1px solid var(--border-subtle)',
        fontSize: 13.5,
      }}
    >
      <span style={{ color: 'var(--text-muted)', fontWeight: 600, flexShrink: 0 }}>
        {label}
      </span>
      <span
        style={{
          color: 'var(--text-strong)',
          fontWeight: 600,
          textAlign: 'right',
          minWidth: 0,
          overflowWrap: 'anywhere',
        }}
      >
        {children}
      </span>
    </div>
  );
}
