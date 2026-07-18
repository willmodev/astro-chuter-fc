// Estados derivados de una sesión de entrenamiento (spec 10) — reglas puras.
// Separado de `entrenos.ts` para respetar el límite de 200 líneas por archivo.
import { DIAS_ENTRENO, puedePasarLista, type DiaEntreno, type Semana } from './entrenos';

// Estructura mínima de una sesión para las reglas de estado (sin acoplar la
// capa de datos; la `Sesion` real cumple estas formas por tipado estructural).
export interface SesionMinima {
  day: DiaEntreno;
  parteCentralImg: string | null;
  parteCentralNota: string;
  ausentes: readonly number[] | null;
}

/** Tiene planeación: imagen o nota no vacía. */
export function planeada(
  sesion: Pick<SesionMinima, 'parteCentralImg' | 'parteCentralNota'> | null,
): boolean {
  if (sesion === null) return false;
  return sesion.parteCentralImg !== null || sesion.parteCentralNota.trim() !== '';
}

/** La lista ya se pasó: `ausentes` deja de ser `null`. */
export function listaPasada(
  sesion: Pick<SesionMinima, 'ausentes'> | null,
): boolean {
  return sesion !== null && sesion.ausentes !== null;
}

/**
 * Pendientes del entrenador en la semana: días sin planear y días ya llegados
 * sin lista (los futuros no son deuda todavía).
 */
export function pendientesDe(
  semana: Semana,
  sesiones: readonly SesionMinima[],
  hoy: Date,
): { sinPlanear: number; sinLista: number } {
  let sinPlanear = 0;
  let sinLista = 0;
  for (const day of DIAS_ENTRENO) {
    const s = sesiones.find((x) => x.day === day) ?? null;
    if (!planeada(s)) sinPlanear += 1;
    if (puedePasarLista(semana, day, hoy) && !listaPasada(s)) sinLista += 1;
  }
  return { sinPlanear, sinLista };
}
