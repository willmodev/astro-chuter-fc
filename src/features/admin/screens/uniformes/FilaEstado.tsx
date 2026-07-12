import { ESTADO_UNIFORME_META, type EstadoUniforme } from '@/lib/domain/uniformes';

import { Avatar } from '../../ui/Avatar';
import { Badge } from '../../ui/Badge';
import type { Alumno } from '../../data/types';

// Fila del tab Estado: alumno + badge de su estado de uniforme. Abre la pantalla
// de uniforme del alumno. Solo presenta.
interface Props {
  alumno: Alumno;
  estado: EstadoUniforme;
  onAbrir: (alumnoId: number) => void;
}

export function FilaEstado({ alumno, estado, onAbrir }: Readonly<Props>) {
  const meta = ESTADO_UNIFORME_META[estado];

  return (
    <button
      type="button"
      onClick={() => onAbrir(alumno.id)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        width: '100%',
        padding: '10px 12px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)',
        background: 'var(--surface-card)',
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      <Avatar name={alumno.name} size={38} />
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
          {alumno.name}
        </strong>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
          {alumno.cat}
        </span>
      </span>
      <Badge tone={meta.tone}>{meta.label}</Badge>
    </button>
  );
}
