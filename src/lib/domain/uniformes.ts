// Reglas puras de uniformes — capa de dominio, sin UI ni datos.
// Alimentan la alerta de la pantalla Uniformes (HU-5.2) y la advertencia del
// form de entrega (HU-5.3).

export type TipoKit = 'AZUL' | 'DORADO';

// Subconjunto estructural que necesita la regla. `Alumno` (capa de datos) lo
// cumple, sin que el dominio dependa de la capa de features.
interface AlumnoUniforme {
  numero: number | null;
  tipoKit: TipoKit | null;
}

interface AlumnoUniformeId extends AlumnoUniforme {
  id: number;
}

/**
 * Números repetidos dentro de un kit (R6): los que aparecen en 2+ alumnos con
 * uniforme del mismo `kit`. Ordenados ascendente. Ignora `numero`/`tipoKit` nulos.
 */
export function numerosDuplicados(
  alumnos: readonly AlumnoUniforme[],
  kit: TipoKit,
): number[] {
  const conteo = new Map<number, number>();
  for (const a of alumnos) {
    if (a.tipoKit === kit && a.numero !== null) {
      conteo.set(a.numero, (conteo.get(a.numero) ?? 0) + 1);
    }
  }
  return [...conteo.entries()]
    .filter(([, n]) => n > 1)
    .map(([numero]) => numero)
    .sort((a, b) => a - b);
}

/**
 * ¿El `numero` ya está usado en ese `kit` por otro alumno? (excluye `idActual`).
 * Alimenta la advertencia no bloqueante del form de entrega (HU-5.3).
 */
export function numeroOcupado(
  alumnos: readonly AlumnoUniformeId[],
  kit: TipoKit,
  numero: number,
  idActual?: number,
): boolean {
  return alumnos.some(
    (a) => a.id !== idActual && a.tipoKit === kit && a.numero === numero,
  );
}
