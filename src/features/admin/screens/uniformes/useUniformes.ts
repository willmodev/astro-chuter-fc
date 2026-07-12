import { useMemo, useSyncExternalStore } from 'react';

import { numerosDuplicados, type TipoKit } from '@/lib/domain/uniformes';

import { getAlumnos, subscribe } from '../../data/store';
import type { Alumno } from '../../data/types';

export interface UniformesData {
  entregados: Alumno[]; // del kit, ordenados por número
  totalEntregados: number;
  totalPendientes: number; // global (los que faltan por entregar)
  duplicados: number[];
  porEntregar: Alumno[]; // global, orden alfabético
}

// Deriva la vista de Uniformes del store: entregados del kit ordenados por
// número, pendientes globales y números duplicados (R6). Reactivo a las entregas.
export function useUniformes(kit: TipoKit): UniformesData {
  const alumnos = useSyncExternalStore(subscribe, getAlumnos);

  return useMemo(() => {
    const entregados = alumnos
      .filter((a) => a.tipoKit === kit && a.uniforme === 'entregado')
      .sort((a, b) => (a.numero ?? 0) - (b.numero ?? 0));
    const porEntregar = alumnos
      .filter((a) => a.uniforme === 'pendiente')
      .sort((a, b) => a.name.localeCompare(b.name, 'es'));
    return {
      entregados,
      totalEntregados: entregados.length,
      totalPendientes: porEntregar.length,
      duplicados: numerosDuplicados(alumnos, kit),
      porEntregar,
    };
  }, [alumnos, kit]);
}
