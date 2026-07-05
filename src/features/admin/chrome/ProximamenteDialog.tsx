import { useModalDialog } from './useModalDialog';

// Bottom sheet "Próximamente": puntos de navegación ya cableados cuyo
// flujo real llega en specs posteriores (Cartera, Uniformes…).
interface Props {
  eyebrow: string;
  mensaje: string;
  onClose: () => void;
}

export function ProximamenteDialog({ eyebrow, mensaje, onClose }: Readonly<Props>) {
  const { ref, alClickBackdrop } = useModalDialog(onClose);

  return (
    <dialog
      ref={ref}
      className="admin-dialog admin-sheet"
      aria-label={eyebrow}
      onClose={onClose}
      onClick={alClickBackdrop}
    >
      <p className="eyebrow">{eyebrow}</p>
      <h3 style={{ marginTop: 8, fontSize: 18, fontWeight: 800, color: 'var(--text-strong)' }}>
        Próximamente
      </h3>
      <p style={{ marginTop: 6, fontSize: 13.5, color: 'var(--text-muted)' }}>
        {mensaje}
      </p>
      <button
        onClick={onClose}
        style={{
          marginTop: 18,
          height: 44,
          width: '100%',
          borderRadius: 'var(--radius-md)',
          border: 'none',
          background: 'var(--brand-navy)',
          color: '#fff',
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Entendido
      </button>
    </dialog>
  );
}
