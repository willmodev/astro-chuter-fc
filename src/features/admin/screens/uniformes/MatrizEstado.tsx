import type { ReactNode } from 'react';

import { ESTADO_UNIFORME_META, type EstadoKit } from '@/lib/domain/uniformes';

// Matriz 2×2 alineada a los ejes (spec 08): filas = entrega, columnas = pago.
// Cada celda es un estado; tocarla filtra la lista (toca la activa → limpia).
interface Props {
  conteos: Record<EstadoKit, number>;
  filtro: EstadoKit | null;
  onFiltrar: (estado: EstadoKit) => void;
}

// [fila entrega][columna pago] → estado. Espeja el cruce del dominio.
const CELDAS: readonly (readonly EstadoKit[])[] = [
  ['completo', 'porCobrar'], // Entregado:   pagado · sin pagar
  ['porEntregar', 'sinIniciar'], // Sin entregar: pagado · sin pagar
];
const FILAS = ['Entregado', 'Sin entregar'] as const;
const COLUMNAS = ['Pagado', 'Sin pagar'] as const;

export function MatrizEstado({ conteos, filtro, onFiltrar }: Readonly<Props>) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr', gap: 8 }}>
      <span />
      {COLUMNAS.map((c) => (
        <span key={c} className="eyebrow" style={{ textAlign: 'center' }}>
          {c}
        </span>
      ))}

      {CELDAS.map((columnas, fila) => (
        <Fila key={FILAS[fila]} label={FILAS[fila]}>
          {columnas.map((estado) => (
            <Celda
              key={estado}
              estado={estado}
              conteo={conteos[estado]}
              activa={filtro === estado}
              onClick={() => onFiltrar(estado)}
            />
          ))}
        </Fila>
      ))}
    </div>
  );
}

function Fila({ label, children }: Readonly<{ label: string; children: ReactNode }>) {
  return (
    <>
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          fontSize: 11.5,
          fontWeight: 700,
          color: 'var(--text-muted)',
        }}
      >
        {label}
      </span>
      {children}
    </>
  );
}

interface CeldaProps {
  estado: EstadoKit;
  conteo: number;
  activa: boolean;
  onClick: () => void;
}

function Celda({ estado, conteo, activa, onClick }: Readonly<CeldaProps>) {
  const meta = ESTADO_UNIFORME_META[estado];
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activa}
      style={{
        display: 'grid',
        gap: 2,
        padding: '12px 10px',
        borderRadius: 'var(--radius-md)',
        border: activa ? '2px solid var(--brand-navy)' : '1px solid var(--border-subtle)',
        background: activa ? 'var(--brand-blue-soft)' : 'var(--surface-card)',
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      <strong style={{ fontSize: 22, color: 'var(--text-strong)', lineHeight: 1 }}>
        {conteo}
      </strong>
      <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)' }}>
        {meta.label}
      </span>
    </button>
  );
}
