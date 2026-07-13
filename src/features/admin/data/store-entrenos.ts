// Store mock de entrenamientos (spec 09) — hermano de `store.ts` (SRP: los
// planes/sesiones son otro agregado). Mismo contrato estable: cuando llegue la
// BD real, los hooks migran a Actions sin cambiar de forma. Al recargar vuelve
// al mock base (no hay persistencia; la imagen object URL también se pierde).
import type { DiaEntreno } from '@/lib/domain/entrenos';

import { planesSemana, sesiones as sesionesMock } from './mock';
import type { PlanSemana, Sesion } from './types';

let planes: PlanSemana[] = planesSemana;
let sesiones: Sesion[] = sesionesMock;
const listeners = new Set<() => void>();

function notificar(): void {
  listeners.forEach((listener) => listener());
}

export function getPlanes(): PlanSemana[] {
  return planes;
}

export function getSesiones(): Sesion[] {
  return sesiones;
}

/** Plan del entrenador en una semana, o `null` si aún no lo registró. */
export function planDe(entrenadorId: string, weekId: string): PlanSemana | null {
  const id = `${entrenadorId}-${weekId}`;
  return planes.find((p) => p.id === id) ?? null;
}

/** Sesión del entrenador en un día, o `null` (los slots se derivan, no se pre-crean). */
export function sesionDe(
  entrenadorId: string,
  weekId: string,
  day: DiaEntreno,
): Sesion | null {
  const id = `${entrenadorId}-${weekId}-${day}`;
  return sesiones.find((s) => s.id === id) ?? null;
}

// Núcleo del form del plan (tema + objetivos). El id se deriva, no se pasa.
export interface DatosPlanSemana {
  entrenadorId: string;
  entrenadorNombre: string;
  weekId: string;
  tema: string;
  objetivos: string;
}

// Crea o actualiza el plan de la semana. Idempotente: guardar dos veces con el
// mismo id no duplica; solo pisa tema/objetivos.
export function guardarPlanSemana(datos: DatosPlanSemana): void {
  const nuevo: PlanSemana = {
    ...datos,
    id: `${datos.entrenadorId}-${datos.weekId}`,
    tema: datos.tema.trim(),
    objetivos: datos.objetivos.trim(),
  };
  const existe = planes.some((p) => p.id === nuevo.id);
  planes = existe
    ? planes.map((p) => (p.id === nuevo.id ? { ...p, ...nuevo } : p))
    : [...planes, nuevo];
  notificar();
}

// Registro/corrección de la sesión de un día: imagen + nota + asistencia.
export interface DatosSesion {
  entrenadorId: string;
  entrenadorNombre: string;
  weekId: string;
  day: DiaEntreno;
  parteCentralImg: string | null;
  parteCentralNota: string;
  ausentes: number[];
}

// Crea o actualiza la sesión del día y la marca `registrado`. Idempotente:
// el mismo contrato sirve para registrar y para corregir historial.
export function guardarSesion(datos: DatosSesion): void {
  const nueva: Sesion = {
    ...datos,
    id: `${datos.entrenadorId}-${datos.weekId}-${datos.day}`,
    parteCentralNota: datos.parteCentralNota.trim(),
    registrado: true,
  };
  const existe = sesiones.some((s) => s.id === nueva.id);
  sesiones = existe
    ? sesiones.map((s) => (s.id === nueva.id ? { ...s, ...nueva } : s))
    : [...sesiones, nueva];
  notificar();
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
