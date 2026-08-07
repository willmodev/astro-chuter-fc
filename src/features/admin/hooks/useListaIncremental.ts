import { useCallback, useEffect, useRef, useState } from 'react';

import type { RefObject } from 'react';

const PASO = 15;

// El tope vive fuera de React: al abrir una ficha, `VistaAdmin` desmonta la
// pantalla y un `useState` se perdería. Solo se recuerda el filtro vigente;
// al cambiar de filtro se olvida el anterior para que empiece en `paso`.
const memoria = new Map<string, number>();

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
  const [tope, setTope] = useState(() => memoria.get(clave) ?? paso);
  const claveAnterior = useRef(clave);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (claveAnterior.current === clave) return;
    memoria.delete(claveAnterior.current);
    claveAnterior.current = clave;
    memoria.set(clave, paso);
    setTope(paso);
  }, [clave, paso]);

  const hayMas = tope < items.length;

  const mostrarMas = useCallback((): void => {
    setTope((t) => {
      const nuevo = t + paso;
      memoria.set(clave, nuevo);
      return nuevo;
    });
  }, [clave, paso]);

  // Quien scrollea es `main.admin-main`, pero con `root: null` el observer
  // mide contra el viewport y funciona igual. rootMargin adelanta la carga.
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
