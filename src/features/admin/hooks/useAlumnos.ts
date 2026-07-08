import { useMemo, useSyncExternalStore } from 'react';

import { estaEnMora } from '@/lib/domain/cartera';

import { getAlumnos, subscribe } from '../data/store';
import type { Alumno } from '../data/types';

// Contrato estable que consume la pantalla Alumnos. Hoy lo sirve el store mock
// (la MISMA fuente del Dashboard → cifras coherentes, y reactiva a los pagos);
// mañana lo servirán las Actions con esta misma forma. Filtro/búsqueda se
// aplican en la pantalla vía dominio (filtraAlumnos).
export interface AlumnosData {
  alumnos: Alumno[]; // orden alfabético
  total: number;
  enMora: number;
}

export function useAlumnos(): AlumnosData {
  const alumnos = useSyncExternalStore(subscribe, getAlumnos);

  return useMemo(() => {
    const ordenados = [...alumnos].sort((a, b) => a.name.localeCompare(b.name, 'es'));
    return {
      alumnos: ordenados,
      total: ordenados.length,
      enMora: ordenados.filter(estaEnMora).length,
    };
  }, [alumnos]);
}
