import { esMesCobrable } from '@/lib/domain/cartera';

import { MONTHS, MONTHS_LONG } from '../../data/mock';
import type { Alumno, EstadoMes } from '../../data/types';

// Tab Pagos: los 11 meses de la temporada (FEB–DIC) con su estado binario.
// Un mes cobrable (debe o pendiente) es tocable → registrar cobro
// (placeholder hasta el spec de Cartera).
interface Props {
  alumno: Alumno;
  onCobrarMes: (mesLong: string) => void;
}

const ESTILO_MES: Record<EstadoMes, { bg: string; fg: string; label: string }> = {
  paid: { bg: 'var(--cell-paid-bg)', fg: 'var(--cell-paid-fg)', label: 'Pagado' },
  due: { bg: 'var(--cell-due-bg)', fg: 'var(--cell-due-fg)', label: 'Debe' },
  pending: {
    bg: 'var(--cell-pending-bg)',
    fg: 'var(--cell-pending-fg)',
    label: 'Pendiente',
  },
  na: { bg: 'var(--cell-na-bg)', fg: 'var(--cell-na-fg)', label: '—' },
};

export function PagosDelAnio({ alumno, onCobrarMes }: Readonly<Props>) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(88px, 1fr))',
        gap: 8,
      }}
    >
      {MONTHS.map((mes, i) => {
        const estado = alumno.states[i] ?? 'na';
        const s = ESTILO_MES[estado];
        const cobrable = esMesCobrable(estado);
        const celda = (
          <>
            <span style={{ fontSize: 12.5, fontWeight: 800 }}>{mes}</span>
            <span style={{ fontSize: 11, fontWeight: 600 }}>{s.label}</span>
          </>
        );
        const estilo = {
          display: 'grid',
          gap: 2,
          justifyItems: 'center',
          alignContent: 'center',
          minHeight: 58,
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          background: s.bg,
          color: s.fg,
        } as const;

        return cobrable ? (
          <button
            key={mes}
            type="button"
            onClick={() => onCobrarMes(MONTHS_LONG[i] ?? mes)}
            aria-label={`Registrar cobro de ${MONTHS_LONG[i] ?? mes}`}
            style={{ ...estilo, cursor: 'pointer' }}
          >
            {celda}
          </button>
        ) : (
          <div key={mes} style={estilo}>
            {celda}
          </div>
        );
      })}
    </div>
  );
}
