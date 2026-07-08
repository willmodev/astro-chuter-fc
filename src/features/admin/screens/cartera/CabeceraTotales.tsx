import type { CSSProperties } from 'react';

import { fmt } from '@/lib/format';

// Recaudado año + Cartera vencida en COP (HU-3.1), derivados de `states`
// con las reglas de `lib/domain/cartera` (sin `stats` precocinado).
interface Props {
  recaudoAnio: number;
  carteraVencida: number;
}

export function CabeceraTotales({ recaudoAnio, carteraVencida }: Readonly<Props>) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      <div style={tarjeta}>
        <span className="eyebrow">Recaudado año</span>
        <strong style={{ fontSize: 20, color: 'var(--text-strong)' }}>{fmt(recaudoAnio)}</strong>
      </div>
      <div style={tarjeta}>
        <span className="eyebrow">Cartera vencida</span>
        <strong style={{ fontSize: 20, color: 'var(--error-deep)' }}>{fmt(carteraVencida)}</strong>
      </div>
    </div>
  );
}

const tarjeta: CSSProperties = {
  display: 'grid',
  gap: 4,
  padding: '14px 16px',
  borderRadius: 'var(--radius-lg)',
  background: 'var(--surface-card)',
  border: '1px solid var(--border-subtle)',
  boxShadow: 'var(--shadow-sm)',
};
