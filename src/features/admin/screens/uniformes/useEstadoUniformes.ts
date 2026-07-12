import { useMemo, useSyncExternalStore } from 'react';

import {
  estadoUniforme,
  ORDEN_ESTADO_UNIFORME,
  type EstadoUniforme,
} from '@/lib/domain/uniformes';

import { getAlumnos, subscribe } from '../../data/store';
import type { Alumno } from '../../data/types';

export interface AlumnoEstado {
  alumno: Alumno;
  estado: EstadoUniforme;
}

export interface EstadoUniformesData {
  conteos: Record<EstadoUniforme, number>;
  lista: AlumnoEstado[]; // todos, ordenados por prioridad de acción y nombre
}

// Deriva el tab Estado del store: conteo de cada estado (para la matriz 2×2) y
// la lista completa de alumnos con su estado, ordenada por `ORDEN_ESTADO_UNIFORME`
// (porCobrar primero). El filtro por celda se aplica en la pantalla.
export function useEstadoUniformes(): EstadoUniformesData {
  const alumnos = useSyncExternalStore(subscribe, getAlumnos);

  return useMemo(() => {
    const conteos: Record<EstadoUniforme, number> = {
      completo: 0,
      porEntregar: 0,
      porCobrar: 0,
      sinIniciar: 0,
    };
    const lista: AlumnoEstado[] = alumnos.map((alumno) => ({
      alumno,
      estado: estadoUniforme(alumno.uniforme, alumno.uniformePago),
    }));
    for (const { estado } of lista) conteos[estado] += 1;
    lista.sort((x, y) => {
      const d =
        ORDEN_ESTADO_UNIFORME.indexOf(x.estado) -
        ORDEN_ESTADO_UNIFORME.indexOf(y.estado);
      return d !== 0 ? d : x.alumno.name.localeCompare(y.alumno.name, 'es');
    });
    return { conteos, lista };
  }, [alumnos]);
}
