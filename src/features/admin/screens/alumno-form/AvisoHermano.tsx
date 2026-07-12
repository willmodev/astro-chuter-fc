import { CUOTA_MENSUAL, PRECIO_UNIFORME_HERMANO } from '@/lib/domain/precios';
import { fmt } from '@/lib/format';

import { Icon } from '../../chrome/Icon';

// Aviso al detectar un hermano por acudiente (R4): el descuento aplica al
// UNIFORME (R9); la mensualidad se mantiene fija (R2).
export function AvisoHermano() {
  return (
    <div
      style={{
        display: 'flex',
        gap: 10,
        padding: '12px 14px',
        borderRadius: 'var(--radius-md)',
        background: 'var(--info-soft)',
        border: '1px solid color-mix(in srgb, var(--brand-blue) 22%, white)',
      }}
    >
      <span style={{ color: 'var(--brand-blue)', flexShrink: 0, marginTop: 1 }}>
        <Icon name="users" size={18} />
      </span>
      <div style={{ display: 'grid', gap: 3 }}>
        <strong style={{ fontSize: 13.5, color: 'var(--brand-navy)' }}>
          Hermano detectado
        </strong>
        <span style={{ fontSize: 12.5, color: 'var(--text-body)', lineHeight: 1.35 }}>
          Descuento en el uniforme: {fmt(PRECIO_UNIFORME_HERMANO)} c/u. La
          mensualidad se mantiene en {fmt(CUOTA_MENSUAL)}.
        </span>
      </div>
    </div>
  );
}
