import { estadoAlumno } from '@/lib/domain/alumnos';
import { mesesEnMora } from '@/lib/domain/cartera';

import { Icon } from '../../chrome/Icon';
import { Avatar } from '../../ui/Avatar';
import { Badge } from '../../ui/Badge';
import type { Alumno } from '../../data/types';

// Fila tocable de la lista: avatar (aro dorado si mora), nombre,
// categoría + acudiente y estado. Toda la fila navega a la Ficha.
// Un retirado se marca como tal y no muestra mora (spec 14).
interface Props {
  alumno: Alumno;
  onOpen: () => void;
}

export function FilaAlumno({ alumno, onOpen }: Readonly<Props>) {
  const retirado = !alumno.activo;
  const enMora = !retirado && estadoAlumno(alumno) === 'mora';
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
      <BadgeFila retirado={retirado} meses={enMora ? meses : 0} />
      <span style={{ display: 'flex', color: 'var(--text-muted)', flexShrink: 0 }}>
        <Icon name="chevron-right" size={18} />
      </span>
    </button>
  );
}

// Retirado manda sobre la mora; `meses` en 0 = al día.
function BadgeFila({
  retirado,
  meses,
}: Readonly<{ retirado: boolean; meses: number }>) {
  if (retirado) return <Badge tone="neutral">Retirado</Badge>;
  if (meses === 0) return <Badge tone="paid">Al día</Badge>;
  return (
    <Badge tone="due">
      {meses} {meses === 1 ? 'mes' : 'meses'}
    </Badge>
  );
}
