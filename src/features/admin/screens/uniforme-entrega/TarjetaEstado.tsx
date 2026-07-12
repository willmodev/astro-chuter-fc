import { ESTADO_UNIFORME_META, type EstadoUniforme } from '@/lib/domain/uniformes';

import { Badge } from '../../ui/Badge';

// Tarjeta de estado actual del uniforme: badge del estado derivado + los dos
// ejes (Entregado/Sin entregar · Pagado/Sin pagar). Solo presenta.
interface Props {
  estado: EstadoUniforme;
  entregado: boolean;
  pagado: boolean;
}

export function TarjetaEstado({ estado, entregado, pagado }: Readonly<Props>) {
  const meta = ESTADO_UNIFORME_META[estado];

  return (
    <div
      style={{
        display: 'grid',
        gap: 12,
        padding: '14px 16px',
        borderRadius: 'var(--radius-md)',
        background: 'var(--surface-sunken)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <span className="eyebrow">Estado del uniforme</span>
          <strong style={{ display: 'block', fontSize: 15, color: 'var(--text-strong)' }}>
            {meta.desc}
          </strong>
        </div>
        <Badge tone={meta.tone}>{meta.label}</Badge>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Badge tone={entregado ? 'paid' : 'pending'} dot>
          {entregado ? 'Entregado' : 'Sin entregar'}
        </Badge>
        <Badge tone={pagado ? 'paid' : 'pending'} dot>
          {pagado ? 'Pagado' : 'Sin pagar'}
        </Badge>
      </div>
    </div>
  );
}
