import type { ReactNode } from 'react';

import { useModalDialog } from './useModalDialog';

interface Props {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

// Hoja modal reutilizable del admin: <dialog> nativo centrado con título.
// Cierra por backdrop, Esc (evento close nativo) o desde el contenido.
export function Sheet({ title, onClose, children }: Readonly<Props>) {
  const { ref, alClickBackdrop } = useModalDialog(onClose);

  return (
    <dialog
      ref={ref}
      className="admin-dialog"
      aria-label={title}
      onClose={onClose}
      onClick={alClickBackdrop}
      style={{
        width: 'calc(100% - 32px)',
        maxWidth: 480,
        maxHeight: 'calc(100dvh - 32px)',
        overflowY: 'auto',
        border: 'none',
        background: 'var(--surface-card)',
        color: 'var(--text-body)',
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
    </dialog>
  );
}
