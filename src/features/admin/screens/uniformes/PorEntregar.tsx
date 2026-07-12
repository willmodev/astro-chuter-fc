import { Avatar } from '../../ui/Avatar';
import type { Alumno } from '../../data/types';

// Sección "Por entregar": alumnos sin uniforme, con acción "Asignar" que lleva
// al flujo de registro de entrega.
interface Props {
  alumnos: Alumno[];
  onAsignar: (alumnoId: number) => void;
}

export function PorEntregar({ alumnos, onAsignar }: Readonly<Props>) {
  if (alumnos.length === 0) {
    return (
      <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
        No hay uniformes por entregar.
      </p>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {alumnos.map((a) => (
        <div
          key={a.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '8px 10px 8px 8px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            background: 'var(--surface-card)',
          }}
        >
          <Avatar name={a.name} size={38} />
          <span style={{ flex: 1, minWidth: 0 }}>
            <strong
              style={{
                display: 'block',
                fontSize: 14,
                color: 'var(--text-strong)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {a.name}
            </strong>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
              {a.cat}
            </span>
          </span>
          <button
            type="button"
            onClick={() => onAsignar(a.id)}
            style={{
              height: 36,
              padding: '0 16px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: 'var(--brand-navy)',
              color: '#fff',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            Asignar
          </button>
        </div>
      ))}
    </div>
  );
}
