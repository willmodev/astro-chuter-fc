import { actions } from 'astro:actions';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { FilaKit, OrdenUniformes } from '@/lib/db/repos/uniformes';
import type { EstadoKit, TipoKit } from '@/lib/domain/uniformes';

import type { EstadoCargaValor } from '../chrome/EstadoCarga';

// Pantalla Uniformes con paginado de SERVIDOR (spec 18): a diferencia del resto
// del admin, acá cada filtro es una consulta nueva —no un recorte de una lista
// ya descargada—, porque esta lista crece 2× por alumno.
const LIMITE = 20;
const DEBOUNCE_MS = 300;

const CONTEOS_VACIOS: Record<EstadoKit, number> = {
  completo: 0,
  porEntregar: 0,
  porCobrar: 0,
  sinIniciar: 0,
};

export interface FiltrosVista {
  kit: TipoKit | null;
  estado: EstadoKit | null;
  cat: string | null;
  orden: OrdenUniformes;
}

const FILTROS_INICIALES: FiltrosVista = {
  kit: null,
  estado: null,
  cat: null,
  orden: 'prioridad',
};

interface Datos {
  filas: FilaKit[];
  total: number;
  conteos: Record<EstadoKit, number>;
  duplicados: Record<TipoKit, number[]>;
}

const DATOS_VACIOS: Datos = {
  filas: [],
  total: 0,
  conteos: CONTEOS_VACIOS,
  duplicados: { AZUL: [], ORO: [] },
};

export interface UniformesPaginaData extends Datos {
  estado: EstadoCargaValor;
  hayMas: boolean;
  query: string;
  setQuery: (query: string) => void;
  filtros: FiltrosVista;
  cambiarFiltros: (cambio: Partial<FiltrosVista>) => void;
  mostrarMas: () => void;
  recargar: () => void;
}

// Retrasa el texto que llega al servidor: una petición tras la última tecla,
// no una por tecla. Avisa aparte para poder volver a la primera página.
function useDebounce(query: string, alEstabilizar: (q: string) => void): void {
  const cb = useRef(alEstabilizar);
  cb.current = alEstabilizar;

  useEffect(() => {
    const id = setTimeout(() => {
      cb.current(query);
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(id);
    };
  }, [query]);
}

// Los filtros de la vista son el input de la Action salvo por la página.
function pedirPagina(
  filtros: FiltrosVista,
  query: string,
  offset: number,
): ReturnType<typeof actions.uniformes.listarPagina> {
  return actions.uniformes.listarPagina({
    ...filtros,
    query,
    offset,
    limit: LIMITE,
  });
}

export function useUniformesPagina(): UniformesPaginaData {
  const [query, setQuery] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [filtros, setFiltros] = useState<FiltrosVista>(FILTROS_INICIALES);
  const [offset, setOffset] = useState(0);
  const [datos, setDatos] = useState<Datos>(DATOS_VACIOS);
  const [estado, setEstado] = useState<EstadoCargaValor>('cargando');

  // El spinner solo aparece la primera vez: un refetch por filtro conserva las
  // filas en pantalla para que la lista no parpadee (misma regla del spec 16).
  const yaCargo = useRef(false);
  // Descarta respuestas que llegan fuera de orden tras un cambio rápido.
  const vigente = useRef(0);

  useDebounce(query, (q) => {
    setBusqueda(q);
    setOffset(0);
  });

  const cargar = useCallback(
    async (desde: number): Promise<void> => {
      const id = ++vigente.current;
      if (!yaCargo.current) setEstado('cargando');

      const { data, error } = await pedirPagina(filtros, busqueda, desde);
      if (id !== vigente.current) return;
      if (error) {
        setEstado('error');
        return;
      }

      yaCargo.current = true;
      setDatos((prev) => ({
        ...data,
        filas: desde === 0 ? data.filas : [...prev.filas, ...data.filas],
      }));
      setEstado('listo');
    },
    [filtros, busqueda],
  );

  useEffect(() => {
    void cargar(offset);
  }, [cargar, offset]);

  const cambiarFiltros = useCallback((cambio: Partial<FiltrosVista>): void => {
    setFiltros((prev) => ({ ...prev, ...cambio }));
    setOffset(0); // cualquier filtro nuevo vuelve a la primera página
  }, []);

  const mostrarMas = useCallback((): void => {
    setOffset(datos.filas.length);
  }, [datos.filas.length]);

  const recargar = useCallback((): void => {
    setOffset(0);
    void cargar(0);
  }, [cargar]);

  return {
    ...datos,
    estado,
    hayMas: datos.filas.length < datos.total,
    query,
    setQuery,
    filtros,
    cambiarFiltros,
    mostrarMas,
    recargar,
  };
}
