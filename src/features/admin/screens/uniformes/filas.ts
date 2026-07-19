import {
  contarEstados,
  numerosDuplicados,
  ORDEN_ESTADO_UNIFORME,
  type EstadoKit,
  type TipoKit,
} from '@/lib/domain/uniformes';

import type { KitUniforme, UniformeAlumno } from '../../data/types';

// Una fila de la pantalla Uniformes = un kit de un alumno (universo 2N).
export interface KitFila {
  alumnoId: number;
  nombre: string;
  cat: string;
  kit: KitUniforme;
}

// Aplana los alumnos a filas por kit (dos por alumno).
export function aFilas(alumnos: readonly UniformeAlumno[]): KitFila[] {
  return alumnos.flatMap((a) =>
    a.kits.map((kit) => ({
      alumnoId: a.alumnoId,
      nombre: a.nombre,
      cat: a.cat,
      kit,
    })),
  );
}

// Conteo por estado sobre todas las filas (para la matriz 2×2).
export function conteosDe(filas: readonly KitFila[]): Record<EstadoKit, number> {
  return contarEstados(filas.map((f) => f.kit.estado));
}

// Ordena por prioridad de acción (porCobrar primero) y luego por nombre.
export function ordenaPorPrioridad(filas: KitFila[]): KitFila[] {
  return [...filas].sort((x, y) => {
    const d =
      ORDEN_ESTADO_UNIFORME.indexOf(x.kit.estado) -
      ORDEN_ESTADO_UNIFORME.indexOf(y.kit.estado);
    return d !== 0 ? d : x.nombre.localeCompare(y.nombre, 'es');
  });
}

// Filas entregadas de un kit, ordenadas por número (tab Numeración).
export function entregadasDeKit(filas: KitFila[], kit: TipoKit): KitFila[] {
  return filas
    .filter((f) => f.kit.kit === kit && f.kit.entregado)
    .sort((a, b) => (a.kit.numero ?? 0) - (b.kit.numero ?? 0));
}

// Números repetidos dentro de un kit (R6), sobre los registros reales.
export function duplicadosDeKit(filas: KitFila[], kit: TipoKit): number[] {
  return numerosDuplicados(
    filas.map((f) => ({ kit: f.kit.kit, numero: f.kit.numero })),
    kit,
  );
}
