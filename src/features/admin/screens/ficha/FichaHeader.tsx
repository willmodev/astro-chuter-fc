import { estadoAlumno } from '@/lib/domain/alumnos';
import { mesesEnMora } from '@/lib/domain/cartera';

import { Icon } from '../../chrome/Icon';
import { Avatar } from '../../ui/Avatar';
import { Badge } from '../../ui/Badge';

import { BadgeFaltaFecha } from './BadgeFaltaFecha';

import type { Alumno } from '../../data/types';

// Cabecera de la Ficha del admin: volver, identidad (avatar, nombre,
// categoría) y estado. Un retirado se marca como tal en vez de mostrar mora
// (spec 14). Las acciones viven en `FichaAcciones`.
interface Props {
  alumno: Alumno;
  onVolver: () => void;
  onEditar: () => void;
}

export function FichaHeader({ alumno, onVolver, onEditar }: Readonly<Props>) {
  const retirado = !alumno.activo;
  const enMora = !retirado && estadoAlumno(alumno) === 'mora';
  const meses = mesesEnMora(alumno);

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          type="button"
          onClick={onVolver}
          aria-label="Volver a la lista"
          style={{
            width: 38,
            height: 38,
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            background: 'var(--surface-sunken)',
            color: 'var(--brand-navy)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <Icon name="arrow-left" size={19} />
        </button>
        <Avatar name={alumno.name} size={46} ring={enMora} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <strong
            style={{
              display: 'block',
              fontSize: 17,
              color: 'var(--text-strong)',
              lineHeight: 1.2,
            }}
          >
            {alumno.name}
          </strong>
          <span
            style={{
              fontSize: 12.5,
              color: 'var(--text-muted)',
              fontWeight: 600,
            }}
          >
            {alumno.cat}
          </span>
        </div>
        <BadgeEstado retirado={retirado} meses={enMora ? meses : 0} />
        <button
          type="button"
          onClick={onEditar}
          aria-label="Editar alumno"
          style={{
            width: 38,
            height: 38,
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            background: 'var(--surface-sunken)',
            color: 'var(--brand-navy)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <Icon name="pencil" size={17} />
        </button>
      </div>
      {alumno.fechaNacimiento === null && <BadgeFaltaFecha />}
    </div>
  );
}

// Estado del alumno: retirado manda sobre la mora; `meses` en 0 = al día.
function BadgeEstado({
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
