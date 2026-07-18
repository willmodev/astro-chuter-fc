// Reglas puras de cartera — capa de dominio, sin dependencias de UI ni datos.
// Testeables en aislamiento; las reusará la cartera real (otro spec).
// Modelo binario: cada mes se paga o no (sin abonos parciales por ahora).

export type EstadoMes = 'paid' | 'due' | 'pending' | 'na';

// ─── Modelo por año calendario (spec 11) ───
// La BD guarda solo pagos reales; el estado de cada mes se DERIVA aquí.

export const MESES = [
  'ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC',
] as const;
export type Mes = (typeof MESES)[number];

export const NOMBRE_MES: Record<Mes, string> = {
  ENE: 'Enero', FEB: 'Febrero', MAR: 'Marzo', ABR: 'Abril',
  MAY: 'Mayo', JUN: 'Junio', JUL: 'Julio', AGO: 'Agosto',
  SEP: 'Septiembre', OCT: 'Octubre', NOV: 'Noviembre', DIC: 'Diciembre',
};

// Arranque del club: meses previos (incl. ENE/FEB 2026) quedan `na`.
export const ARRANQUE_CLUB = { anio: 2026, mes: 'MAR' } as const satisfies {
  anio: number;
  mes: Mes;
};

// Última mensualidad cobrada del año. ← ÚNICA constante a tocar si Camilo dice DIC.
export const MES_FIN_COBRO: Mes = 'NOV';

const idxMes = (mes: Mes): number => MESES.indexOf(mes);
const ordinal = (anio: number, mes: Mes): number => anio * 12 + idxMes(mes);
const ordinalFecha = (f: Date): number => f.getFullYear() * 12 + f.getMonth();

// Tira de meses visibles en cartera/ficha: ENE..MES_FIN_COBRO.
export const MESES_VISIBLES: Mes[] = MESES.slice(0, idxMes(MES_FIN_COBRO) + 1);

// `states` siempre tiene esta longitud (una entrada por mes visible).
export const MESES_TEMPORADA = MESES_VISIBLES.length;

/**
 * Estado DERIVADO de un mes (ya no se almacena):
 *   na      → mes < arranque del club, o mes < ingreso del alumno, o mes > fin de cobro
 *   paid    → existe pago real
 *   due     → cobrable y ya vencido (mes < mes vivo)
 *   pending → cobrable y no vencido (mes ≥ mes vivo)
 */
export function estadoDelMes(params: {
  anio: number;
  mes: Mes;
  pagado: boolean;
  fechaInicio: Date;
  hoy: Date;
}): EstadoMes {
  const { anio, mes, pagado, fechaInicio, hoy } = params;
  const actual = ordinal(anio, mes);
  const esNa =
    actual < ordinal(ARRANQUE_CLUB.anio, ARRANQUE_CLUB.mes) ||
    actual < ordinalFecha(fechaInicio) ||
    idxMes(mes) > idxMes(MES_FIN_COBRO);
  if (esNa) return 'na';
  if (pagado) return 'paid';
  return actual < ordinalFecha(hoy) ? 'due' : 'pending';
}

// Subconjunto estructural que necesitan las reglas. `Alumno` (en la capa de
// datos) lo cumple, sin que el dominio dependa de la capa de features.
interface AlumnoCartera {
  states: EstadoMes[];
  cuota: number;
}

/** ¿El alumno tiene al menos un mes vencido sin pagar? */
export function estaEnMora(a: AlumnoCartera): boolean {
  return a.states.includes('due');
}

/** Cantidad de meses vencidos sin pagar. */
export function mesesEnMora(a: AlumnoCartera): number {
  return a.states.filter((estado) => estado === 'due').length;
}

/** Saldo pendiente = meses en mora × cuota mensual. */
export function saldoPendiente(a: AlumnoCartera): number {
  return mesesEnMora(a) * a.cuota;
}

/** ¿Se puede registrar el cobro de un mes? (no pagado y dentro de la temporada) */
export function esMesCobrable(estado: EstadoMes): boolean {
  return estado === 'due' || estado === 'pending';
}

/** Recaudo total del año: Σ (meses pagados × cuota) de todos los alumnos. */
export function recaudoAnio(alumnos: readonly AlumnoCartera[]): number {
  return alumnos.reduce(
    (sum, a) => sum + a.states.filter((estado) => estado === 'paid').length * a.cuota,
    0,
  );
}

/** Recaudo del mes en curso: Σ cuotas pagadas en `mesVivo`. */
export function recaudoMes(alumnos: readonly AlumnoCartera[], mesVivo: number): number {
  return alumnos.reduce((sum, a) => (a.states[mesVivo] === 'paid' ? sum + a.cuota : sum), 0);
}

/** Cartera vencida total: Σ saldo pendiente (meses en mora × cuota) de todos. */
export function carteraVencida(alumnos: readonly AlumnoCartera[]): number {
  return alumnos.reduce((sum, a) => sum + saldoPendiente(a), 0);
}

/** Meta del mes en curso: Σ cuotas esperadas (alumnos fuera de temporada no cuentan). */
export function metaMes(alumnos: readonly AlumnoCartera[], mesVivo: number): number {
  return alumnos.reduce((sum, a) => (a.states[mesVivo] !== 'na' ? sum + a.cuota : sum), 0);
}

/** % de alumnos sin ningún mes en mora. */
export function pctAlDia(alumnos: readonly AlumnoCartera[]): number {
  if (alumnos.length === 0) return 0;
  const alDia = alumnos.filter((a) => !estaEnMora(a)).length;
  return (alDia / alumnos.length) * 100;
}

/** Total a cobrar en Registrar pago: cuota × cantidad de meses marcados. */
export function totalPago(cuota: number, nMeses: number): number {
  return cuota * nMeses;
}

/**
 * States de un alumno recién inscrito: meses previos al ingreso `na`, del mes
 * de ingreso (`mesVivo`) en adelante `pending`. Nunca `due` → no nace en mora.
 * `mesVivo` se acota a [0, MESES_TEMPORADA − 1].
 * NOTA (spec 11): solo lo usa el store mock; muere con él en el Bloque D, cuando
 * el service derive `states` con `estadoDelMes`.
 */
export function statesIniciales(mesVivo: number): EstadoMes[] {
  const inicio = Math.min(Math.max(mesVivo, 0), MESES_TEMPORADA - 1);
  return Array.from({ length: MESES_TEMPORADA }, (_, i) =>
    i < inicio ? 'na' : 'pending',
  );
}
