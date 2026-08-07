import { Monto } from '../../ui/Monto';

import type { CSSProperties } from 'react';

// Recaudado año + Cartera vencida en COP (HU-3.1), derivados de `states`
// con las reglas de `lib/domain/cartera` (sin `stats` precocinado).
interface Props {
  recaudoAnio: number;
  carteraVencida: number;
}

export function CabeceraTotales({
  recaudoAnio,
  carteraVencida,
}: Readonly<Props>) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      <div style={tarjeta}>
        <span className="eyebrow">Recaudado año</span>
        <strong style={{ ...cifra, color: 'var(--text-strong)' }}>
          <Monto valor={recaudoAnio} />
        </strong>
      </div>
      <div style={tarjeta}>
        <span className="eyebrow">Cartera vencida</span>
        <strong style={{ ...cifra, color: 'var(--error-deep)' }}>
          <Monto valor={carteraVencida} />
        </strong>
      </div>
    </div>
  );
}

// `minWidth: 0` es lo que impide que el min-content de la cifra estire la
// columna del grid y empuje el contenido fuera de pantalla a 320px.
const tarjeta: CSSProperties = {
  display: 'grid',
  gap: 4,
  minWidth: 0,
  padding: '14px 16px',
  borderRadius: 'var(--radius-lg)',
  background: 'var(--surface-card)',
  border: '1px solid var(--border-subtle)',
  boxShadow: 'var(--shadow-sm)',
};

// Cifra fluida: baja hasta 15px en pantallas angostas sin recortarse.
const cifra: CSSProperties = {
  fontSize: 'clamp(15px, 4.6vw, 20px)',
  minWidth: 0,
  overflowWrap: 'anywhere',
};
