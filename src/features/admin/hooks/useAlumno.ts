import { useMemo } from 'react';

import { students } from '../data/mock';
import type { Alumno } from '../data/types';

// Contrato estable que consume la Ficha: `undefined` = alumno no encontrado
// (la pantalla muestra su estado propio). Misma fuente mock que el resto.
export function useAlumno(id: number): Alumno | undefined {
  return useMemo(() => students.find((a) => a.id === id), [id]);
}
