import { Icon, type IconName } from './Icon';
import { Sheet } from './Sheet';

// Menú de la acción rápida (FAB): "Inscribir alumno" → form nuevo · "Registrar
// pago" → Cartera (allí se elige alumno y mes). Reemplaza el placeholder previo.
interface Props {
  onInscribir: () => void;
  onRegistrarPago: () => void;
  onClose: () => void;
}

interface Opcion {
  icon: IconName;
  label: string;
  detalle: string;
  onClick: () => void;
}

export function AccionRapidaMenu({
  onInscribir,
  onRegistrarPago,
  onClose,
}: Readonly<Props>) {
  const opciones: Opcion[] = [
    {
      icon: 'user-plus',
      label: 'Inscribir alumno',
      detalle: 'Registrar un nuevo jugador',
      onClick: onInscribir,
    },
    {
      icon: 'wallet',
      label: 'Registrar pago',
      detalle: 'Ir a Cartera para elegir alumno',
      onClick: onRegistrarPago,
    },
  ];

  return (
    <Sheet title="Acción rápida" onClose={onClose}>
      <div style={{ display: 'grid', gap: 10 }}>
        {opciones.map((op) => (
          <button
            key={op.label}
            type="button"
            onClick={op.onClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '14px 16px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              background: 'var(--surface-card)',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <span
              style={{
                width: 42,
                height: 42,
                flexShrink: 0,
                borderRadius: 'var(--radius-md)',
                background: 'var(--brand-blue-soft)',
                color: 'var(--brand-navy)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name={op.icon} size={20} />
            </span>
            <span style={{ display: 'grid', gap: 2 }}>
              <strong style={{ fontSize: 14.5, color: 'var(--text-strong)' }}>
                {op.label}
              </strong>
              <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                {op.detalle}
              </span>
            </span>
          </button>
        ))}
      </div>
    </Sheet>
  );
}
