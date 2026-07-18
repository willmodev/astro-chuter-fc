import { Icon } from '../../chrome/Icon';
import { Avatar } from '../../ui/Avatar';
import type { AlumnoPlantel } from '../../data/types';

// Fila del plantel del entrenador: identidad + categoría/acudiente. A
// diferencia de FilaAlumno (admin), NO expone estado de mora ni plata.
interface Props {
  alumno: AlumnoPlantel;
  onOpen: () => void;
}

export function FilaPlantel({ alumno, onOpen }: Readonly<Props>) {
  return (
    <button
      type="button"
      onClick={onOpen}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 14px',
        background: 'none',
        border: 'none',
        textAlign: 'left',
        cursor: 'pointer',
      }}
    >
      <Avatar name={alumno.name} size={42} />
      <span style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            display: 'block',
            fontSize: 14.5,
            fontWeight: 700,
            color: 'var(--text-strong)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {alumno.name}
        </span>
        <span
          style={{
            display: 'block',
            fontSize: 12,
            color: 'var(--text-muted)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          <b style={{ color: 'var(--text-body)', fontWeight: 700 }}>{alumno.cat}</b>
          {' · '}
          {alumno.acu}
        </span>
      </span>
      <span style={{ display: 'flex', color: 'var(--text-faint)', flexShrink: 0 }}>
        <Icon name="chevron-right" size={18} />
      </span>
    </button>
  );
}
