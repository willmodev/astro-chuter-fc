import { Badge } from '../../ui/Badge';
import { EtiquetaKit } from '../uniformes/EtiquetaKit';
import type { KitEntrega } from '../../data/types';

// Uniforme en la ficha del entrenador (readOnly): SOLO la entrega de cada kit,
// sin un peso de dinero (los montos son de admin). Reemplaza el aviso migración.
interface Props {
  kits: KitEntrega[];
}

export function UniformePlantel({ kits }: Readonly<Props>) {
  return (
    <section style={{ display: 'grid', gap: 8 }}>
      <span className="eyebrow">Uniforme</span>
      {kits.map((kit) => (
        <div
          key={kit.kit}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            padding: '12px 14px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--surface-card)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <span style={{ display: 'grid', gap: 3 }}>
            <EtiquetaKit kit={kit.kit} />
            {kit.entregado && (
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
                Nº {kit.numero ?? '—'}{kit.talla ? ` · Talla ${kit.talla}` : ''}
              </span>
            )}
          </span>
          <Badge tone={kit.entregado ? 'paid' : 'pending'} dot>
            {kit.entregado ? 'Entregado' : 'Sin entregar'}
          </Badge>
        </div>
      ))}
    </section>
  );
}
