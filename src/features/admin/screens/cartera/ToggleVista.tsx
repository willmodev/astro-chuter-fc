import { Icon, type IconName } from '../../chrome/Icon';
import type { VistaCartera } from '../../hooks/useVistaCartera';

interface Props {
  vista: VistaCartera;
  onChange: (vista: VistaCartera) => void;
}

const OPCIONES: { id: VistaCartera; label: string; icon: IconName }[] = [
  { id: 'tarjetas', label: 'Tarjetas', icon: 'layout-grid' },
  { id: 'matriz', label: 'Matriz', icon: 'table-2' },
];

// Toggle Tarjetas/Matriz; la preferencia la persiste `useVistaCartera`.
export function ToggleVista({ vista, onChange }: Readonly<Props>) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 4,
        padding: 4,
        borderRadius: 'var(--radius-md)',
        background: 'var(--surface-sunken)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      {OPCIONES.map((op) => {
        const activa = vista === op.id;
        return (
          <button
            key={op.id}
            type="button"
            onClick={() => onChange(op.id)}
            aria-pressed={activa}
            style={{
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: activa ? 'var(--surface-card)' : 'transparent',
              boxShadow: activa ? 'var(--shadow-sm)' : 'none',
              color: activa ? 'var(--brand-navy)' : 'var(--text-muted)',
              fontSize: 13,
              fontWeight: activa ? 700 : 600,
              cursor: 'pointer',
            }}
          >
            <Icon name={op.icon} size={16} />
            {op.label}
          </button>
        );
      })}
    </div>
  );
}
