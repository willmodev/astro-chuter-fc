import { Badge } from '../../ui/Badge';
import type { Alumno } from '../../data/types';

// Fila del listado del kit: número, nombre, categoría, talla y estado de pago
// del uniforme. Resalta si el número está repetido (R6). Abre la corrección.
interface Props {
  alumno: Alumno;
  duplicado: boolean;
  onAbrir: (alumnoId: number) => void;
}

export function FilaUniforme({ alumno, duplicado, onAbrir }: Readonly<Props>) {
  const pagado = alumno.uniformePago === 'pagado';

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
      <span
        style={{
          width: 38,
          height: 38,
          flexShrink: 0,
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 15,
          fontWeight: 800,
          background: duplicado ? 'var(--warning-soft)' : 'var(--surface-sunken)',
          color: duplicado ? '#946200' : 'var(--brand-navy)',
          border: duplicado ? '1px solid var(--warning)' : 'none',
        }}
      >
        {alumno.numero ?? '—'}
      </span>
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
          {alumno.cat} · Talla {alumno.talla}
        </span>
      </span>
      <Badge tone={pagado ? 'paid' : 'pending'}>
        {pagado ? 'Pagado' : 'Pendiente'}
      </Badge>
    </button>
  );
}
