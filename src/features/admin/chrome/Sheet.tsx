import type { ReactNode } from 'react';

interface Props {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

// Hoja inferior (bottom sheet) reutilizable del admin: overlay + panel
// redondeado anclado abajo, con título y cierre por backdrop.
export function Sheet({ title, onClose, children }: Readonly<Props>) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 80,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        background: 'rgba(10,15,26,0.45)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 480,
          maxHeight: 'calc(100dvh - 32px)',
          overflowY: 'auto',
          background: 'var(--surface-card)',
          borderRadius: 22,
          boxShadow: 'var(--shadow-pop)',
          padding: 22,
        }}
      >
        <header style={{ marginBottom: 16 }}>
          <h3
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: 'var(--text-strong)',
              margin: 0,
            }}
          >
            {title}
          </h3>
        </header>
        {children}
      </div>
    </div>
  );
}
