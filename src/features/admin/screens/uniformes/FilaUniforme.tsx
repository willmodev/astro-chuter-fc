import { ejePago } from '@/lib/domain/uniformes';

import { Badge, type BadgeTone } from '../../ui/Badge';
import type { KitFila } from './filas';

// Fila del listado del kit: número, nombre, categoría, talla y estado de pago
// (tri-estado). Resalta si el número está repetido (R6). Abre la gestión.
interface Props {
  fila: KitFila;
  duplicado: boolean;
  onAbrir: (alumnoId: number) => void;
}

const PAGO: Record<string, { tone: BadgeTone; label: string }> = {
  pagado: { tone: 'paid', label: 'Pagado' },
  abonado: { tone: 'partial', label: 'Abonado' },
  pendiente: { tone: 'pending', label: 'Pendiente' },
};

export function FilaUniforme({ fila, duplicado, onAbrir }: Readonly<Props>) {
  const { numero, talla, abonadoCop, precio } = fila.kit;
  const pago = PAGO[ejePago(abonadoCop, precio)];

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
        {numero ?? '—'}
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
          {fila.nombre}
        </strong>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
          {fila.cat}
          {talla ? ` · Talla ${talla}` : ''}
        </span>
      </span>
      <Badge tone={pago.tone}>{pago.label}</Badge>
    </button>
  );
}
