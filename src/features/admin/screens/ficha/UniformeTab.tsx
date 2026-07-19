import { ESTADO_UNIFORME_META } from '@/lib/domain/uniformes';
import { fmt } from '@/lib/format';

import { Badge } from '../../ui/Badge';
import { Card } from '../../ui/Card';
import { EtiquetaKit } from '../uniformes/EtiquetaKit';
import type { Alumno, KitUniforme } from '../../data/types';

// Tab Uniforme (spec 12): los DOS kits (AZUL/ORO) con estado, número/talla si
// entregado y su abono/saldo. El CTA navega a la pantalla de gestión.
interface Props {
  alumno: Alumno;
  onGestionar: () => void;
}

export function UniformeTab({ alumno, onGestionar }: Readonly<Props>) {
  return (
    <Card>
      <div style={{ display: 'grid', gap: 12 }}>
        {alumno.kits.map((kit) => (
          <FilaKit key={kit.kit} kit={kit} />
        ))}
      </div>

      <button
        type="button"
        onClick={onGestionar}
        style={{
          marginTop: 14,
          width: '100%',
          height: 44,
          borderRadius: 'var(--radius-md)',
          border: 'none',
          background: 'var(--brand-navy)',
          color: '#fff',
          fontSize: 14,
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        Gestionar uniformes
      </button>
    </Card>
  );
}

function FilaKit({ kit }: Readonly<{ kit: KitUniforme }>) {
  const meta = ESTADO_UNIFORME_META[kit.estado];
  const pagado = kit.saldo === 0;
  const detalle = kit.entregado
    ? `Nº ${kit.numero ?? '—'}${kit.talla ? ` · Talla ${kit.talla}` : ''}`
    : 'Sin entregar';

  return (
    <div
      style={{
        display: 'grid',
        gap: 8,
        padding: '12px 14px',
        borderRadius: 'var(--radius-md)',
        background: 'var(--surface-sunken)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <EtiquetaKit kit={kit.kit} />
        <Badge tone={meta.tone}>{meta.label}</Badge>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
        <span style={{ fontSize: 12.5, color: 'var(--text-muted)', fontWeight: 600 }}>
          {detalle}
        </span>
        <span style={{ fontSize: 12.5, color: 'var(--text-muted)', fontWeight: 600 }}>
          {pagado ? 'Pagado' : `Saldo ${fmt(kit.saldo)}`}
        </span>
      </div>
    </div>
  );
}
