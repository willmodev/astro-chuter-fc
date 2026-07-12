import { useMemo, useSyncExternalStore } from 'react';

import { numerosDuplicados, type TipoKit } from '@/lib/domain/uniformes';

import { getAlumnos, subscribe } from '../../data/store';
import type { Alumno } from '../../data/types';

export interface UniformesData {
  entregados: Alumno[]; // del kit, ordenados por número
  totalEntregados: number;
  totalPendientes: number; // global (los que faltan por entregar)
  duplicados: number[];
}

// Deriva el tab Numeración del store: entregados del kit ordenados por número,
// pendientes globales (contador) y números duplicados (R6). Reactivo a las
// entregas. La sección "Por entregar" se movió al tab Estado (spec 08).
export function useUniformes(kit: TipoKit): UniformesData {
  const alumnos = useSyncExternalStore(subscribe, getAlumnos);

  return useMemo(() => {
    const entregados = alumnos
      .filter((a) => a.tipoKit === kit && a.uniforme === 'entregado')
      .sort((a, b) => (a.numero ?? 0) - (b.numero ?? 0));
    const totalPendientes = alumnos.filter((a) => a.uniforme === 'pendiente').length;
    return {
      entregados,
      totalEntregados: entregados.length,
      totalPendientes,
      duplicados: numerosDuplicados(alumnos, kit),
    };
  }, [alumnos, kit]);
}
