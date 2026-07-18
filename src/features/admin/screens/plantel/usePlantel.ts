import { useMemo, useState } from 'react';

import { CATEGORIA_TODAS, filtraAlumnos } from '@/lib/domain/alumnos';
import { rosterDe } from '@/lib/domain/entrenos';

import type { EstadoCargaValor } from '../../chrome/EstadoCarga';
import type { AlumnoPlantel } from '../../data/types';
import { useAlumnosPlantel } from '../../hooks/useAlumnosPlantel';

// Plantel del entrenador: SOLO los alumnos de sus categorías (payload sin
// dinero), con búsqueda (nombre/acudiente, sin acentos) y filtro por cat —
// mismo dominio que Alumnos.
export interface PlantelData {
  visibles: AlumnoPlantel[];
  total: number;
  query: string;
  setQuery: (q: string) => void;
  cat: string;
  setCat: (c: string) => void;
  opcionesCat: string[];
  rosterVacio: boolean;
  estado: EstadoCargaValor;
  recargar: () => Promise<void>;
}

export function usePlantel(cats: readonly string[]): PlantelData {
  const { alumnos, estado, recargar } = useAlumnosPlantel();
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState<string>(CATEGORIA_TODAS);

  const roster = useMemo(
    () =>
      rosterDe(cats, alumnos).sort((a, b) =>
        a.name.localeCompare(b.name, 'es'),
      ),
    [cats, alumnos],
  );

  const visibles = useMemo(
    () => filtraAlumnos(roster, { query, cat }),
    [roster, query, cat],
  );

  return {
    visibles,
    total: roster.length,
    query,
    setQuery,
    cat,
    setCat,
    opcionesCat: [CATEGORIA_TODAS, ...cats],
    rosterVacio: roster.length === 0,
    estado,
    recargar,
  };
}
