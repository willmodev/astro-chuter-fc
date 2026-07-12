import { ESTADO_UNIFORME_META, estadoUniforme } from '@/lib/domain/uniformes';

import { Badge } from '../../ui/Badge';
import { Card } from '../../ui/Card';
import { FilaDato } from './FilaDato';
import type { Alumno } from '../../data/types';

// Tab Uniforme (spec 08): muestra los DOS ejes (Entregado/Sin entregar +
// Pagado/Sin pagar) con su estado derivado; kit/número si fue entregado. El CTA
// navega a la pantalla de uniforme (la gestión no es inline).
interface Props {
  alumno: Alumno;
  onRegistrarEntrega: () => void;
}

export function UniformeTab({ alumno, onRegistrarEntrega }: Readonly<Props>) {
  const entregado = alumno.uniforme === 'entregado';
  const pagado = alumno.uniformePago === 'pagado';
  const meta = ESTADO_UNIFORME_META[estadoUniforme(alumno.uniforme, alumno.uniformePago)];

  return (
    <Card>
      <div style={{ display: 'grid', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <span style={{ fontSize: 13.5, color: 'var(--text-muted)' }}>{meta.desc}</span>
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

        {entregado && (
          <div style={{ marginTop: 2 }}>
            <FilaDato label="Kit">{alumno.tipoKit ?? '—'}</FilaDato>
            <FilaDato label="Número">{alumno.numero ?? '—'}</FilaDato>
            <FilaDato label="Talla">{alumno.talla}</FilaDato>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onRegistrarEntrega}
        style={{
          marginTop: 14,
          width: '100%',
          height: 44,
          borderRadius: 'var(--radius-md)',
          border: entregado ? '1px solid var(--border-subtle)' : 'none',
          background: entregado ? 'var(--surface-sunken)' : 'var(--brand-navy)',
          color: entregado ? 'var(--brand-navy)' : '#fff',
          fontSize: 14,
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        {entregado ? 'Gestionar uniforme' : 'Registrar uniforme'}
      </button>
    </Card>
  );
}
