import { esMesCobrable, MESES_VISIBLES as MONTHS } from '@/lib/domain/cartera';

import { Icon } from '../../chrome/Icon';
import type { Alumno, EstadoMes } from '../../data/types';

// Tira FEB–DIC reutilizando el vocabulario visual de `PagosDelAnio` (Ficha),
// pero seleccionable: los meses cobrables (due/pending) son checkboxes:
// tocar marca/desmarca; paid/na quedan de solo lectura.
interface Props {
  alumno: Alumno;
  seleccionados: number[];
  onToggle: (mesIndex: number) => void;
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

export function SelectorMeses({ alumno, seleccionados, onToggle }: Readonly<Props>) {
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <p className="eyebrow">Meses a cobrar</p>
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
          const marcado = seleccionados.includes(i);
          const estilo = {
            display: 'grid',
            gap: 2,
            justifyItems: 'center',
            alignContent: 'center',
            minHeight: 58,
            position: 'relative',
            borderRadius: 'var(--radius-md)',
            border: marcado ? '2px solid var(--brand-navy)' : '1px solid var(--border-subtle)',
            background: s.bg,
            color: s.fg,
          } as const;
          const celda = (
            <>
              {marcado && (
                <span
                  style={{ position: 'absolute', top: 4, right: 4, color: 'var(--brand-navy)' }}
                >
                  <Icon name="circle-check" size={14} />
                </span>
              )}
              <span style={{ fontSize: 12.5, fontWeight: 800 }}>{mes}</span>
              <span style={{ fontSize: 11, fontWeight: 600 }}>{s.label}</span>
            </>
          );

          return cobrable ? (
            <button
              key={mes}
              type="button"
              onClick={() => onToggle(i)}
              aria-pressed={marcado}
              aria-label={`${marcado ? 'Quitar' : 'Marcar'} ${mes}`}
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
    </div>
  );
}
