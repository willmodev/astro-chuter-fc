import { useMemo, useSyncExternalStore } from 'react';

import { getAlumnos, subscribe } from '../data/store';
import type { Alumno } from '../data/types';

// Contrato estable que consume la Ficha: `undefined` = alumno no encontrado
// (la pantalla muestra su estado propio). Misma fuente (store) que el resto;
// reactivo a `registrarPago`.
export function useAlumno(id: number): Alumno | undefined {
  const alumnos = useSyncExternalStore(subscribe, getAlumnos);
  return useMemo(() => alumnos.find((a) => a.id === id), [alumnos, id]);
}
