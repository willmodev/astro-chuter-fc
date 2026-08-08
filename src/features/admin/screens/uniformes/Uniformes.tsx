import { useRef } from 'react';

import { EstadoCarga } from '../../chrome/EstadoCarga';
import { useUniformesPagina } from '../../hooks/useUniformesPagina';
import { SentinelMostrarMas } from '../../ui/SentinelMostrarMas';
import { SinResultados } from '../alumnos/SinResultados';

import { AlertaDuplicados } from './AlertaDuplicados';
import { FilaKitItem } from './FilaKitItem';
import { FiltrosUniformes } from './FiltrosUniformes';

// Pantalla Uniformes (spec 18): una sola lista de filas-kit sobre el universo
// de 2N, con buscador, filtros y paginado resueltos en SQL. Solo orquesta.
interface Props {
  onEntrega: (alumnoId: number) => void;
}

const PASO = 20;

export function Uniformes({ onEntrega }: Readonly<Props>) {
  const {
    filas,
    total,
    conteos,
    duplicados,
    estado,
    hayMas,
    query,
    setQuery,
    filtros,
    cambiarFiltros,
    mostrarMas,
    recargar,
  } = useUniformesPagina();
  // `SentinelMostrarMas` pide un ref para el observer de las pantallas con
  // paginado de render; acá el botón es la única forma de traer más.
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // El spinner solo en la primera carga: un refetch por filtro conserva las
  // filas en pantalla para que la lista no parpadee.
  if (estado === 'error' || (estado === 'cargando' && filas.length === 0)) {
    return <EstadoCarga estado={estado} onReintentar={recargar} />;
  }

  return (
    <div style={{ display: 'grid', gap: 12, padding: '14px 16px 0' }}>
      <FiltrosUniformes
        query={query}
        onQuery={setQuery}
        kit={filtros.kit}
        onKit={(kit) => {
          cambiarFiltros({ kit });
        }}
        estado={filtros.estado}
        onEstado={(nuevo) => {
          cambiarFiltros({ estado: nuevo });
        }}
        cat={filtros.cat}
        onCat={(cat) => {
          cambiarFiltros({ cat });
        }}
        orden={filtros.orden}
        onOrden={(orden) => {
          cambiarFiltros({ orden });
        }}
        conteos={conteos}
      />

      <AlertaDuplicados duplicados={duplicados} />

      {filas.length === 0 ? (
        <SinResultados />
      ) : (
        <>
          <div
            style={{
              background: 'var(--surface-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            {filas.map((fila, i) => (
              <div
                key={`${String(fila.alumnoId)}-${fila.kit}`}
                style={{
                  borderTop: i ? '1px solid var(--border-subtle)' : 'none',
                }}
              >
                <FilaKitItem
                  fila={fila}
                  duplicado={
                    fila.numero !== null &&
                    duplicados[fila.kit].includes(fila.numero)
                  }
                  onAbrir={onEntrega}
                />
              </div>
            ))}
          </div>
          <SentinelMostrarMas
            sentinelRef={sentinelRef}
            hayMas={hayMas}
            visibles={filas.length}
            total={total}
            paso={PASO}
            onMostrarMas={mostrarMas}
          />
        </>
      )}
    </div>
  );
}
