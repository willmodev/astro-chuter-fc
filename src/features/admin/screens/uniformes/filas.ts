import type { KitUniforme, UniformeAlumno } from '../../data/types';

// Aplanado de alumnos a filas por kit. La pantalla Uniformes ya no lo usa —su
// lista sale aplanada de SQL (spec 18)—; sobrevive porque la pantalla de
// gestión del kit lo necesita para la advertencia de número repetido (R6).
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
