import { useCallback, useEffect, useRef, useState } from 'react';

import type { RefObject } from 'react';

const PASO = 15;

export interface ListaIncremental<T> {
  visibles: T[];
  hayMas: boolean;
  mostrarMas: () => void;
  sentinelRef: RefObject<HTMLDivElement | null>;
}

// Ventana de render sobre una lista ya cargada: NO pide datos, recorta.
// `clave` es la firma de los filtros activos; cambiarla resetea a `paso`.
// Un refetch (mismo filtro, array nuevo) NO resetea: no se pierde el scroll.
export function useListaIncremental<T>(
  items: readonly T[],
  clave: string,
  paso: number = PASO,
): ListaIncremental<T> {
  const [tope, setTope] = useState(paso);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setTope(paso);
  }, [clave, paso]);

  const hayMas = tope < items.length;

  const mostrarMas = useCallback((): void => {
    setTope((t) => t + paso);
  }, [paso]);

  // El admin scrollea el documento, así que el root por defecto sirve.
  // rootMargin adelanta la carga antes de tocar el fondo.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hayMas || typeof IntersectionObserver === 'undefined') return;

    const obs = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((e) => e.isIntersecting)) mostrarMas();
      },
      { rootMargin: '400px' },
    );
    obs.observe(el);
    return () => {
      obs.disconnect();
    };
  }, [hayMas, mostrarMas]);

  return { visibles: items.slice(0, tope), hayMas, mostrarMas, sentinelRef };
}
