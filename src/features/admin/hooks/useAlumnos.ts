import { useMemo } from 'react';

import { estaEnMora } from '@/lib/domain/cartera';

import { students } from '../data/mock';
import type { Alumno } from '../data/types';

// Contrato estable que consume la pantalla Alumnos. Hoy lo sirve la mock
// (la MISMA del Dashboard → cifras coherentes); mañana lo servirán las
// Actions con esta misma forma. Filtro/búsqueda se aplican en la pantalla
// vía dominio (filtraAlumnos).
export interface AlumnosData {
  alumnos: Alumno[]; // orden alfabético
  total: number;
  enMora: number;
}

export function useAlumnos(): AlumnosData {
  return useMemo(() => {
    const alumnos = [...students].sort((a, b) =>
      a.name.localeCompare(b.name, 'es'),
    );
    return {
      alumnos,
      total: alumnos.length,
      enMora: alumnos.filter(estaEnMora).length,
    };
  }, []);
}
