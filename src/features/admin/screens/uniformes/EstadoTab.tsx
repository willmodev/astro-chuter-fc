import { useState } from 'react';

import { ESTADO_UNIFORME_META, type EstadoKit } from '@/lib/domain/uniformes';

import { conteosDe, ordenaPorPrioridad, type KitFila } from './filas';
import { FilaEstado } from './FilaEstado';
import { MatrizEstado } from './MatrizEstado';

// Tab Estado (spec 12): matriz 2×2 (entrega × pago) sobre los 2N kits + lista de
// todos los kits por prioridad de acción. Tocar una celda filtra; celda en 0 →
// empty state. Solo orquesta; conteos/orden vienen de `filas`.
interface Props {
  filas: KitFila[];
  onAbrir: (alumnoId: number) => void;
}

export function EstadoTab({ filas, onAbrir }: Readonly<Props>) {
  const [filtro, setFiltro] = useState<EstadoKit | null>(null);

  const conteos = conteosDe(filas);
  const ordenadas = ordenaPorPrioridad(filas);
  const alternar = (estado: EstadoKit): void =>
    setFiltro((prev) => (prev === estado ? null : estado));
  const filtrada = filtro
    ? ordenadas.filter((f) => f.kit.estado === filtro)
    : ordenadas;
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
            No hay kits en «{titulo}».
          </p>
        ) : (
          filtrada.map((f) => (
            <FilaEstado
              key={`${f.alumnoId}-${f.kit.kit}`}
              fila={f}
              onAbrir={onAbrir}
            />
          ))
        )}
      </section>
    </div>
  );
}
