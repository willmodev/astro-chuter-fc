import { estadoAlumno } from '@/lib/domain/alumnos';
import { mesesEnMora } from '@/lib/domain/cartera';

import { Icon } from '../../chrome/Icon';
import { Avatar } from '../../ui/Avatar';
import { Badge } from '../../ui/Badge';
import type { Alumno } from '../../data/types';

// Fila tocable de la lista: avatar (aro dorado si mora), nombre,
// categoría + acudiente y estado. Toda la fila navega a la Ficha.
interface Props {
  alumno: Alumno;
  onOpen: () => void;
}

export function FilaAlumno({ alumno, onOpen }: Readonly<Props>) {
  const enMora = estadoAlumno(alumno) === 'mora';
  const meses = mesesEnMora(alumno);

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
      <Avatar name={alumno.name} size={42} ring={enMora} />
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
          {alumno.cat} · {alumno.acu}
        </span>
      </span>
      {enMora ? (
        <Badge tone="due">
          {meses} {meses === 1 ? 'mes' : 'meses'}
        </Badge>
      ) : (
        <Badge tone="paid">Al día</Badge>
      )}
      <span style={{ display: 'flex', color: 'var(--text-muted)', flexShrink: 0 }}>
        <Icon name="chevron-right" size={18} />
      </span>
    </button>
  );
}
