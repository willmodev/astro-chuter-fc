// Store mock mutable en memoria — única fuente reactiva del admin mientras no
// hay BD/Actions. Contrato estable (`getAlumnos`/`registrarPago`/`subscribe`):
// cuando llegue la BD real, los hooks migran a las Actions sin cambiar de forma.
// Al recargar la página vuelve al mock base (no hay persistencia).
import { esMesCobrable } from '@/lib/domain/cartera';

import { students } from './mock';
import type { Alumno } from './types';

export type MetodoPago = 'efectivo' | 'transferencia';

interface PagoRegistrado {
  alumnoId: number;
  meses: number[];
  metodo: MetodoPago;
  fecha: string;
}

let alumnos: Alumno[] = students;
const historial: PagoRegistrado[] = [];
const listeners = new Set<() => void>();

function notificar(): void {
  listeners.forEach((listener) => listener());
}

export function getAlumnos(): Alumno[] {
  return alumnos;
}

// Por cada mes cobrable (`due`/`pending`) lo pasa a `paid`; ignora `na`/`paid`.
export function registrarPago(
  alumnoId: number,
  meses: number[],
  metodo: MetodoPago,
): void {
  historial.push({ alumnoId, meses, metodo, fecha: new Date().toISOString() });
  alumnos = alumnos.map((alumno) => {
    if (alumno.id !== alumnoId) return alumno;
    const states = alumno.states.map((estado, i) =>
      meses.includes(i) && esMesCobrable(estado) ? 'paid' : estado,
    );
    return { ...alumno, states };
  });
  notificar();
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
