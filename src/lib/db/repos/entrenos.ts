import { and, eq } from 'drizzle-orm';

import { db } from '@/lib/db/client';
import { planesSemana, sesiones } from '@/lib/db/schema';
import type { DiaEntreno } from '@/lib/domain/entrenos';

// Filas crudas: `date` viaja como string 'YYYY-MM-DD' (mismo criterio spec 11).
export interface PlanRow {
  entrenadorId: string;
  semanaInicio: string;
  tema: string;
  objetivos: string;
}

export interface SesionRow {
  entrenadorId: string;
  semanaInicio: string;
  dia: DiaEntreno;
  parteCentralUrl: string | null;
  parteCentralNota: string;
  ausentes: number[] | null;
}

const PLAN_COLS = {
  entrenadorId: planesSemana.entrenadorId,
  semanaInicio: planesSemana.semanaInicio,
  tema: planesSemana.tema,
  objetivos: planesSemana.objetivos,
};

const SESION_COLS = {
  entrenadorId: sesiones.entrenadorId,
  semanaInicio: sesiones.semanaInicio,
  dia: sesiones.dia,
  parteCentralUrl: sesiones.parteCentralUrl,
  parteCentralNota: sesiones.parteCentralNota,
  ausentes: sesiones.ausentes,
};

// Planes de la semana (de un entrenador o de todos, para la vista admin).
export function planesEnSemana(
  semanaInicio: string,
  entrenadorId?: string,
): Promise<PlanRow[]> {
  const filtro = entrenadorId
    ? and(
        eq(planesSemana.semanaInicio, semanaInicio),
        eq(planesSemana.entrenadorId, entrenadorId),
      )
    : eq(planesSemana.semanaInicio, semanaInicio);
  return db.select(PLAN_COLS).from(planesSemana).where(filtro);
}

// Sesiones de la semana (de un entrenador o de todos).
export function sesionesEnSemana(
  semanaInicio: string,
  entrenadorId?: string,
): Promise<SesionRow[]> {
  const filtro = entrenadorId
    ? and(
        eq(sesiones.semanaInicio, semanaInicio),
        eq(sesiones.entrenadorId, entrenadorId),
      )
    : eq(sesiones.semanaInicio, semanaInicio);
  return db.select(SESION_COLS).from(sesiones).where(filtro);
}

// Sesión puntual (para leer la URL de blob previa antes de reemplazarla).
export async function sesionActual(
  entrenadorId: string,
  semanaInicio: string,
  dia: DiaEntreno,
): Promise<SesionRow | null> {
  const [row] = await db
    .select(SESION_COLS)
    .from(sesiones)
    .where(
      and(
        eq(sesiones.entrenadorId, entrenadorId),
        eq(sesiones.semanaInicio, semanaInicio),
        eq(sesiones.dia, dia),
      ),
    )
    .limit(1);
  return row ?? null;
}

// Upsert del plan: idempotente por (entrenadorId, semanaInicio); pisa solo tema/objetivos.
export async function upsertPlan(
  entrenadorId: string,
  semanaInicio: string,
  tema: string,
  objetivos: string,
): Promise<void> {
  await db
    .insert(planesSemana)
    .values({ entrenadorId, semanaInicio, tema, objetivos })
    .onConflictDoUpdate({
      target: [planesSemana.entrenadorId, planesSemana.semanaInicio],
      set: { tema, objetivos, actualizadoEn: new Date() },
    });
}

// Upsert de la planeación: toca SOLO url/nota (no pisa la asistencia).
export async function upsertPlaneacion(
  entrenadorId: string,
  semanaInicio: string,
  dia: DiaEntreno,
  parteCentralUrl: string | null,
  parteCentralNota: string,
): Promise<void> {
  await db
    .insert(sesiones)
    .values({ entrenadorId, semanaInicio, dia, parteCentralUrl, parteCentralNota })
    .onConflictDoUpdate({
      target: [sesiones.entrenadorId, sesiones.semanaInicio, sesiones.dia],
      set: { parteCentralUrl, parteCentralNota, actualizadoEn: new Date() },
    });
}

// Upsert de la asistencia: toca SOLO `ausentes` (no pisa la planeación).
export async function upsertAsistencia(
  entrenadorId: string,
  semanaInicio: string,
  dia: DiaEntreno,
  ausentes: number[],
): Promise<void> {
  await db
    .insert(sesiones)
    .values({ entrenadorId, semanaInicio, dia, ausentes })
    .onConflictDoUpdate({
      target: [sesiones.entrenadorId, sesiones.semanaInicio, sesiones.dia],
      set: { ausentes, actualizadoEn: new Date() },
    });
}
