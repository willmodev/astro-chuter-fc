import type { CSSProperties } from 'react';

import { esMesCobrable } from '@/lib/domain/cartera';

import { MONTHS } from '../../data/mock';
import type { Alumno, EstadoMes } from '../../data/types';

interface Props {
  alumnos: Alumno[];
  onCobrarMes: (alumnoId: number, mesIndex: number) => void;
}

const COLOR: Record<EstadoMes, string> = {
  paid: 'var(--cell-paid-bg)',
  due: 'var(--cell-due-bg)',
  pending: 'var(--cell-pending-bg)',
  na: 'var(--cell-na-bg)',
};

// Filas=alumnos, columnas FEB–DIC (HU-3.2). Scrollea dentro de su propio
// contenedor (`overflow-x`), nunca la página; primera columna (nombre)
// sticky. No pagina (~100 alumnos no lo ameritan).
export function MatrizCartera({ alumnos, onCobrarMes }: Readonly<Props>) {
  return (
    <div style={contenedor}>
      <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 640 }}>
        <thead>
          <tr>
            <th style={cabeceraSticky}>Alumno</th>
            {MONTHS.map((mes) => (
              <th key={mes} style={cabecera}>
                {mes}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {alumnos.map((a) => (
            <tr key={a.id}>
              <td style={nombreSticky}>{a.name}</td>
              {a.states.map((estado, i) => {
                const cobrable = esMesCobrable(estado);
                const estiloCelda: CSSProperties = { ...celda, background: COLOR[estado] };
                return (
                  <td key={MONTHS[i]} style={{ padding: 3 }}>
                    {cobrable ? (
                      <button
                        type="button"
                        onClick={() => onCobrarMes(a.id, i)}
                        aria-label={`Registrar cobro de ${MONTHS[i]} para ${a.name}`}
                        style={{ ...estiloCelda, cursor: 'pointer', border: 'none', width: '100%' }}
                      />
                    ) : (
                      <div style={estiloCelda} />
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const contenedor: CSSProperties = {
  overflowX: 'auto',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--border-subtle)',
  background: 'var(--surface-card)',
  boxShadow: 'var(--shadow-sm)',
};

const cabecera: CSSProperties = {
  padding: '10px 8px',
  fontSize: 11,
  fontWeight: 800,
  color: 'var(--text-muted)',
  textAlign: 'center',
};

const cabeceraSticky: CSSProperties = {
  ...cabecera,
  position: 'sticky',
  left: 0,
  background: 'var(--surface-card)',
  textAlign: 'left',
  paddingLeft: 14,
  zIndex: 1,
};

const nombreSticky: CSSProperties = {
  position: 'sticky',
  left: 0,
  background: 'var(--surface-card)',
  padding: '8px 14px',
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--text-strong)',
  whiteSpace: 'nowrap',
  borderTop: '1px solid var(--border-subtle)',
  zIndex: 1,
};

const celda: CSSProperties = {
  height: 32,
  borderRadius: 6,
};
