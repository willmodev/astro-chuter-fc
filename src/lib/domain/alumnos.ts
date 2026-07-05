// Reglas puras de la lista de alumnos — capa de dominio, sin UI ni datos.
// Búsqueda y filtro corren en cliente sobre la lista completa (~100 alumnos);
// Cartera reutilizará estas mismas funciones.
import { mesesEnMora, type EstadoMes } from './cartera';

// Subconjunto estructural que necesita el filtro. `Alumno` (capa de datos)
// lo cumple, sin que el dominio dependa de la capa de features.
interface AlumnoBuscable {
  name: string;
  acu: string;
  cat: string;
}

export const CATEGORIA_TODAS = 'Todas';

export interface FiltroAlumnos {
  query: string;
  cat: string; // CATEGORIA_TODAS o una categoría exacta ("SUB 10")
}

/** Minúsculas y sin acentos: "José" → "jose" (para búsqueda). */
export function normaliza(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Filtra por nombre O acudiente (sin mayúsculas/acentos), combinable con
 * el chip de categoría. Query vacía = sin filtro de texto.
 */
export function filtraAlumnos<T extends AlumnoBuscable>(
  alumnos: readonly T[],
  { query, cat }: FiltroAlumnos,
): T[] {
  const q = normaliza(query.trim());
  return alumnos.filter((a) => {
    const pasaCategoria = cat === CATEGORIA_TODAS || a.cat === cat;
    const pasaTexto =
      q === '' || normaliza(a.name).includes(q) || normaliza(a.acu).includes(q);
    return pasaCategoria && pasaTexto;
  });
}

// Estado binario: un mes se cobra o no se cobra, sin "abono/parcial".
export type EstadoAlumno = 'alDia' | 'mora';

/** Estado del alumno según sus meses vencidos (reutiliza mesesEnMora). */
export function estadoAlumno(a: {
  states: EstadoMes[];
  cuota: number;
}): EstadoAlumno {
  return mesesEnMora(a) > 0 ? 'mora' : 'alDia';
}
