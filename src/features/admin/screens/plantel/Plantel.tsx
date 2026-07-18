import { CATEGORIA_TODAS } from '@/lib/domain/alumnos';

import { EstadoCarga } from '../../chrome/EstadoCarga';
import { BuscadorAlumnos } from '../alumnos/BuscadorAlumnos';
import { ChipsCategoria } from '../alumnos/ChipsCategoria';
import { SinResultados } from '../alumnos/SinResultados';
import { FilaPlantel } from './FilaPlantel';
import { usePlantel } from './usePlantel';

// Plantel del entrenador (spec 09): buscador + chips de SUS categorías +
// lista sin datos de plata. Tocar un alumno abre la ficha en solo lectura.
interface Props {
  cats: string[];
  onOpenFicha: (alumnoId: number) => void;
}

export function Plantel({ cats, onOpenFicha }: Readonly<Props>) {
  const p = usePlantel(cats);

  if (p.estado !== 'listo') {
    return <EstadoCarga estado={p.estado} onReintentar={p.recargar} />;
  }
  if (p.rosterVacio) return <PlantelVacio />;

  return (
    <div style={{ display: 'grid', gap: 12, padding: '14px 16px 0' }}>
      <BuscadorAlumnos value={p.query} onChange={p.setQuery} />
      <ChipsCategoria value={p.cat} onChange={p.setCat} opciones={p.opcionesCat} />
      <span className="eyebrow" style={{ padding: '0 2px' }}>
        {p.visibles.length} {p.visibles.length === 1 ? 'alumno' : 'alumnos'}
        {p.cat !== CATEGORIA_TODAS ? ` · ${p.cat}` : ''}
      </span>

      {p.visibles.length === 0 ? (
        <SinResultados />
      ) : (
        <div
          style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          {p.visibles.map((a, i) => (
            <div
              key={a.id}
              style={{ borderTop: i ? '1px solid var(--border-subtle)' : 'none' }}
            >
              <FilaPlantel alumno={a} onOpen={() => onOpenFicha(a.id)} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Roster vacío: las cats del entrenador (BD auth) no calzan con ninguna
// categoría de alumnos — el admin las corrige en Equipo (riesgo del spec 09).
function PlantelVacio() {
  return (
    <div style={{ padding: '48px 24px', textAlign: 'center' }}>
      <strong style={{ display: 'block', fontSize: 15, color: 'var(--text-strong)' }}>
        Aún no tienes alumnos asignados
      </strong>
      <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.45 }}>
        Pídele al administrador que revise tus categorías en Equipo.
      </p>
    </div>
  );
}
