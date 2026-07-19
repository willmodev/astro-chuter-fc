import { ESTADO_UNIFORME_META } from '@/lib/domain/uniformes';

import { Avatar } from '../../ui/Avatar';
import { Badge } from '../../ui/Badge';
import { EtiquetaKit } from './EtiquetaKit';
import type { KitFila } from './filas';

// Fila del tab Estado: alumno + kit (AZUL/ORO) + badge de estado. Abre la
// pantalla de gestión del uniforme del alumno. Solo presenta.
interface Props {
  fila: KitFila;
  onAbrir: (alumnoId: number) => void;
}

export function FilaEstado({ fila, onAbrir }: Readonly<Props>) {
  const meta = ESTADO_UNIFORME_META[fila.kit.estado];

  return (
    <button
      type="button"
      onClick={() => onAbrir(fila.alumnoId)}
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
      <Avatar name={fila.nombre} size={38} />
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
          {fila.nombre}
        </strong>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            color: 'var(--text-muted)',
            fontWeight: 600,
          }}
        >
          {fila.cat} <EtiquetaKit kit={fila.kit.kit} />
        </span>
      </span>
      <Badge tone={meta.tone}>{meta.label}</Badge>
    </button>
  );
}
