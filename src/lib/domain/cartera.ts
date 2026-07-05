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
