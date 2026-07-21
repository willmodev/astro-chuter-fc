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
export const SEMANAS_FUTURAS = 1; // permite planear la próxima semana con antelación

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
  if (offset < 0) return offset === -1 ? 'Próxima semana' : `En ${-offset} semanas`;
  if (offset === 0) return 'Semana actual';
  if (offset === 1) return 'Semana pasada';
  return `Hace ${offset} semanas`;
}

/**
 * `SEMANAS_FUTURAS` próximas + semana viva + `SEMANAS_PASADAS` anteriores,
 * ordenadas de futura a pasada (0 = actual). Fecha inyectable (testeable).
 */
export function generarSemanas(hoy: Date): Semana[] {
  const base = lunesDe(hoy);
  const total = SEMANAS_FUTURAS + SEMANAS_PASADAS + 1;
  return Array.from({ length: total }, (_, i) => {
    const offset = i - SEMANAS_FUTURAS; // -futuras … +pasadas
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

// ─── Identidad persistible de la semana (clave natural por fecha) ───

/** 'YYYY-MM-DD' del lunes de la semana, en componentes locales (sin zona/UTC). */
export function semanaInicioISO(semana: Semana): string {
  const d = semana.inicio;
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

/** Semana de la ventana cuyo `weekId` (`w-25`) coincide; `null` si no está. */
export function semanaPorWeekId(
  semanas: readonly Semana[],
  weekId: string,
): Semana | null {
  return semanas.find((s) => s.id === weekId) ?? null;
}

// ─── Fechas y gate de la lista ───
// (los estados derivados de la sesión viven en `./sesion`)

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
