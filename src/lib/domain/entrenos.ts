// Reglas puras de entrenamientos (spec 09) — capa de dominio, sin UI ni datos.
// Genera el historial de semanas (fecha inyectable → mock determinista),
// resuelve el roster del entrenador y calcula la asistencia de una sesión.
import { normaliza } from './alumnos';

// ─── Días y fases fijas (formato real del club: Excel de planeación) ───

export const DIAS_ENTRENO = ['Lunes', 'Miércoles', 'Viernes'] as const;
export type DiaEntreno = (typeof DIAS_ENTRENO)[number];

/** ¿`valor` es un día de entrenamiento? (parseo defensivo del router). */
export function esDiaEntreno(valor: string): valor is DiaEntreno {
  return (DIAS_ENTRENO as readonly string[]).includes(valor);
}

// Fases fijas de toda sesión: se muestran como información, no se digitan.
// Lo único que planea el entrenador es la parte central (imagen de TactalPad).
export const FASE_ACTIVACION = {
  titulo: 'Activación muscular',
  pasos: ['Oración', 'Charla de bienvenida', 'Estiramiento', 'Calentamiento'],
} as const;

export const FASE_VUELTA_CALMA = {
  titulo: 'Vuelta a la calma',
  pasos: ['Estiramientos', 'Charla de mejoramiento', 'Despedida de motivación'],
} as const;

// ─── Semanas (viva + pasadas, la actual primero) ───

export interface Semana {
  id: string; // "w-25"
  n: number; // número ISO de la semana
  label: string; // "8 – 12 jun"
  sub: string; // "Semana actual" | "Hace 2 semanas"
  current: boolean;
  inicio: Date; // lunes 00:00 local — permite derivar la fecha de cada día
}

export const SEMANAS_PASADAS = 3;

const MESES_CORTOS = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
];

/** Lunes (00:00 local) de la semana que contiene a `fecha`. */
function lunesDe(fecha: Date): Date {
  const d = new Date(fecha);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

/** Número ISO-8601 de la semana (la semana pertenece al año de su jueves). */
function numeroSemana(fecha: Date): number {
  const d = new Date(
    Date.UTC(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()),
  );
  const dia = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dia);
  const inicioAnio = Date.UTC(d.getUTCFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - inicioAnio) / 86400000 + 1) / 7);
}

/** "8 – 12 jun" (Lun–Vie); si cruza de mes, "29 jun – 3 jul". */
function labelSemana(lunes: Date): string {
  const viernes = new Date(lunes);
  viernes.setDate(viernes.getDate() + 4);
  const mesLun = MESES_CORTOS[lunes.getMonth()];
  const mesVie = MESES_CORTOS[viernes.getMonth()];
  return mesLun === mesVie
    ? `${lunes.getDate()} – ${viernes.getDate()} ${mesVie}`
    : `${lunes.getDate()} ${mesLun} – ${viernes.getDate()} ${mesVie}`;
}

function subSemana(offset: number): string {
  if (offset === 0) return 'Semana actual';
  if (offset === 1) return 'Semana pasada';
  return `Hace ${offset} semanas`;
}

/** Semana viva + `SEMANAS_PASADAS` anteriores. Fecha inyectable (testeable). */
export function generarSemanas(hoy: Date): Semana[] {
  const base = lunesDe(hoy);
  return Array.from({ length: SEMANAS_PASADAS + 1 }, (_, offset) => {
    const lunes = new Date(base);
    lunes.setDate(lunes.getDate() - offset * 7);
    const n = numeroSemana(lunes);
    return {
      id: `w-${n}`,
      n,
      label: labelSemana(lunes),
      sub: subSemana(offset),
      current: offset === 0,
      inicio: new Date(lunes),
    };
  });
}

// ─── Fechas y gate de la lista ───

// Estructura mínima de una sesión para las reglas de estado (sin acoplar la
// capa de datos; la `Sesion` real cumple estas formas por tipado estructural).
export interface SesionMinima {
  day: DiaEntreno;
  parteCentralImg: string | null;
  parteCentralNota: string;
  ausentes: readonly number[] | null;
}

/** Fecha (00:00 local) del día de entreno dentro de su semana. */
export function fechaDe(semana: Semana, day: DiaEntreno): Date {
  const d = new Date(semana.inicio);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + DIAS_ENTRENO.indexOf(day) * 2);
  return d;
}

/** La lista se habilita cuando el día ya llegó (hoy inclusive); pasado sí. */
export function puedePasarLista(
  semana: Semana,
  day: DiaEntreno,
  hoy: Date,
): boolean {
  const hoyMid = new Date(hoy);
  hoyMid.setHours(0, 0, 0, 0);
  return fechaDe(semana, day).getTime() <= hoyMid.getTime();
}

// ─── Estados derivados de la sesión ───

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

// ─── Roster y asistencia ───

export interface ResumenAsistencia {
  presentes: number;
  ausentes: number;
  total: number;
  pct: number;
}

/**
 * Asistencia de una sesión con lista pasada: presentes = roster − ausentes.
 * Solo cuenta ausentes que siguen en el roster (ids huérfanos no restan).
 */
export function asistenciaDe(
  ausentes: readonly number[],
  roster: readonly { id: number }[],
): ResumenAsistencia {
  const total = roster.length;
  const cuentaAusentes = roster.filter((a) => ausentes.includes(a.id)).length;
  const presentes = total - cuentaAusentes;
  const pct = total === 0 ? 0 : Math.round((presentes / total) * 100);
  return { presentes, ausentes: cuentaAusentes, total, pct };
}

/** Alumnos cuyas categorías pertenecen al entrenador (compara sin acentos). */
export function rosterDe<T extends { cat: string }>(
  cats: readonly string[],
  alumnos: readonly T[],
): T[] {
  const propias = new Set(cats.map(normaliza));
  return alumnos.filter((a) => propias.has(normaliza(a.cat)));
}
