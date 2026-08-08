import { KITS } from '@/lib/domain/uniformes';
import type { TipoKit } from '@/lib/domain/uniformes';

import { Icon } from '../../chrome/Icon';

// Alerta de números repetidos (R6), con los dos kits en un solo banner.
// No aparece si no hay ninguno.
interface Props {
  duplicados: Record<TipoKit, number[]>;
}

const NOMBRE: Record<TipoKit, string> = { AZUL: 'Azul', ORO: 'Oro' };

export function AlertaDuplicados({ duplicados }: Readonly<Props>) {
  const partes = KITS.filter((k) => duplicados[k].length > 0).map(
    (k) => `Kit ${NOMBRE[k]}: ${duplicados[k].join(', ')}`,
  );
  if (partes.length === 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        gap: 10,
        padding: '12px 14px',
        borderRadius: 'var(--radius-md)',
        background: 'var(--warning-soft)',
        border: '1px solid color-mix(in srgb, var(--warning) 40%, white)',
      }}
    >
      <span style={{ color: '#946200', flexShrink: 0, marginTop: 1 }}>
        <Icon name="triangle-alert" size={18} />
      </span>
      <span style={{ fontSize: 12.5, color: '#946200', lineHeight: 1.35 }}>
        Números repetidos: <strong>{partes.join(' · ')}</strong>. Revisá las
        entregas para evitar duplicados.
      </span>
    </div>
  );
}
