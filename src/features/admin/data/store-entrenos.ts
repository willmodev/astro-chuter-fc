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

// Identidad común de una sesión: quién, qué semana y qué día.
interface RefSesion {
  entrenadorId: string;
  entrenadorNombre: string;
  weekId: string;
  day: DiaEntreno;
}

function idDe(ref: RefSesion): string {
  return `${ref.entrenadorId}-${ref.weekId}-${ref.day}`;
}

// Upsert que preserva los campos que no toca (planeación no pisa lista y
// viceversa). El upsert es idempotente: guardar dos veces no duplica.
function upsertSesion(id: string, construir: (previa: Sesion | null) => Sesion): void {
  const previa = sesiones.find((s) => s.id === id) ?? null;
  const nueva = construir(previa);
  sesiones = previa
    ? sesiones.map((s) => (s.id === id ? nueva : s))
    : [...sesiones, nueva];
  notificar();
}

// Planeación del día (imagen + nota). No toca la asistencia: si la sesión no
// existía, nace con `ausentes: null` (lista aún no pasada).
export interface DatosPlaneacion extends RefSesion {
  parteCentralImg: string | null;
  parteCentralNota: string;
}

export function guardarPlaneacion(datos: DatosPlaneacion): void {
  const id = idDe(datos);
  const parteCentralNota = datos.parteCentralNota.trim();
  upsertSesion(id, (previa) => ({
    id,
    entrenadorId: datos.entrenadorId,
    entrenadorNombre: datos.entrenadorNombre,
    weekId: datos.weekId,
    day: datos.day,
    parteCentralImg: datos.parteCentralImg,
    parteCentralNota,
    ausentes: previa?.ausentes ?? null,
  }));
}

// Asistencia del día. No toca la planeación: si la sesión no existía, nace sin
// imagen ni nota. `ausentes: []` = lista pasada, todos presentes.
export interface DatosAsistencia extends RefSesion {
  ausentes: number[];
}

export function guardarAsistencia(datos: DatosAsistencia): void {
  const id = idDe(datos);
  upsertSesion(id, (previa) => ({
    id,
    entrenadorId: datos.entrenadorId,
    entrenadorNombre: datos.entrenadorNombre,
    weekId: datos.weekId,
    day: datos.day,
    parteCentralImg: previa?.parteCentralImg ?? null,
    parteCentralNota: previa?.parteCentralNota ?? '',
    ausentes: datos.ausentes,
  }));
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
