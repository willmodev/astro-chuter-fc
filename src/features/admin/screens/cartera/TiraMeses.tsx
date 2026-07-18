import type { CSSProperties } from 'react';

import {
  esMesCobrable,
  MESES_VISIBLES as MONTHS,
  MESES_VISIBLES_LARGOS as MONTHS_LONG,
} from '@/lib/domain/cartera';

import type { EstadoMes } from '../../data/types';

interface Props {
  states: EstadoMes[];
  onTocarMes: (mesIndex: number) => void;
}

const COLOR: Record<EstadoMes, { bg: string; fg: string }> = {
  paid: { bg: 'var(--cell-paid-bg)', fg: 'var(--cell-paid-fg)' },
  due: { bg: 'var(--cell-due-bg)', fg: 'var(--cell-due-fg)' },
  pending: { bg: 'var(--cell-pending-bg)', fg: 'var(--cell-pending-fg)' },
  na: { bg: 'var(--cell-na-bg)', fg: 'var(--cell-na-fg)' },
};

// Tira compacta FEB–DIC (R5): verde=pagado, rojo=mora, gris=pendiente,
// neutro=fuera de temporada. Solo las celdas cobrables (due/pending) son
// tocables → navegan a Registrar pago con ese mes.
export function TiraMeses({ states, onTocarMes }: Readonly<Props>) {
  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {MONTHS.map((mes, i) => {
        const estado = states[i] ?? 'na';
        const c = COLOR[estado];
        const cobrable = esMesCobrable(estado);
        const estilo: CSSProperties = {
          flex: 1,
          height: 22,
          borderRadius: 4,
          background: c.bg,
          border: 'none',
          padding: 0,
        };

        return cobrable ? (
          <button
            key={mes}
            type="button"
            onClick={() => onTocarMes(i)}
            title={MONTHS_LONG[i] ?? mes}
            aria-label={`Registrar cobro de ${MONTHS_LONG[i] ?? mes}`}
            style={{ ...estilo, cursor: 'pointer' }}
          />
        ) : (
          <div key={mes} style={estilo} title={MONTHS_LONG[i] ?? mes} />
        );
      })}
    </div>
  );
}
