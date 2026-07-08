// Reglas puras de cartera — capa de dominio, sin dependencias de UI ni datos.
// Testeables en aislamiento; las reusará la cartera real (otro spec).
// Modelo binario: cada mes se paga o no (sin abonos parciales por ahora).

export type EstadoMes = 'paid' | 'due' | 'pending' | 'na';

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
