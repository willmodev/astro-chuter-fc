import { useState } from 'react';

import { ESTADO_UNIFORME_META, type EstadoUniforme } from '@/lib/domain/uniformes';

import { FilaEstado } from './FilaEstado';
import { MatrizEstado } from './MatrizEstado';
import { useEstadoUniformes } from './useEstadoUniformes';

// Tab Estado (spec 08): matriz 2×2 (entrega × pago) + lista de todos los alumnos
// por prioridad de acción. Tocar una celda filtra; celda en 0 → empty state.
interface Props {
  onAbrir: (alumnoId: number) => void;
}

export function EstadoTab({ onAbrir }: Readonly<Props>) {
  const { conteos, lista } = useEstadoUniformes();
  const [filtro, setFiltro] = useState<EstadoUniforme | null>(null);

  const alternar = (estado: EstadoUniforme): void =>
    setFiltro((prev) => (prev === estado ? null : estado));
  const filtrada = filtro ? lista.filter((x) => x.estado === filtro) : lista;
  const titulo = filtro ? ESTADO_UNIFORME_META[filtro].label : 'Todos';

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <MatrizEstado conteos={conteos} filtro={filtro} onFiltrar={alternar} />

      <section style={{ display: 'grid', gap: 8 }}>
        <span className="eyebrow">
          {titulo} ({filtrada.length})
        </span>
        {filtrada.length === 0 ? (
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
            No hay alumnos en «{titulo}».
          </p>
        ) : (
          filtrada.map(({ alumno, estado }) => (
            <FilaEstado key={alumno.id} alumno={alumno} estado={estado} onAbrir={onAbrir} />
          ))
        )}
      </section>
    </div>
  );
}
