import { and, eq } from 'drizzle-orm';

import { db } from '@/lib/db/client';
import { uniformes } from '@/lib/db/schema';
import type { TipoKit } from '@/lib/domain/uniformes';

// Fila cruda de uniforme (lo mínimo para derivar estado y saldo por kit).
export interface UniformeRow {
  alumnoId: number;
  kit: TipoKit;
  entregado: boolean;
  numero: number | null;
  talla: string;
  abonadoCop: number;
}

const COLUMNAS = {
  alumnoId: uniformes.alumnoId,
  kit: uniformes.kit,
  entregado: uniformes.entregado,
  numero: uniformes.numero,
  talla: uniformes.talla,
  abonadoCop: uniformes.abonadoCop,
};

// Todos los registros de uniformes (para armar la pantalla Uniformes).
export async function todosUniformes(): Promise<UniformeRow[]> {
  return db.select(COLUMNAS).from(uniformes);
}

export async function uniformesDeAlumno(
  alumnoId: number,
): Promise<UniformeRow[]> {
  return db
    .select(COLUMNAS)
    .from(uniformes)
    .where(eq(uniformes.alumnoId, alumnoId));
}

// Campos que fija/actualiza una entrega o anulación de entrega.
export interface EntregaKit {
  entregado: boolean;
  numero: number | null;
  talla: string;
}

// Upsert de la entrega de un kit: crea la fila si no existe, o la actualiza
// dejando el abono intacto. `registradoPor` = admin que hace la operación.
export async function upsertEntrega(
  alumnoId: number,
  kit: TipoKit,
  datos: EntregaKit,
  registradoPor: string,
): Promise<void> {
  await db
    .insert(uniformes)
    .values({ alumnoId, kit, ...datos, registradoPor })
    .onConflictDoUpdate({
      target: [uniformes.alumnoId, uniformes.kit],
      set: { ...datos, registradoPor, actualizadoEn: new Date() },
    });
}

// Fija el abono absoluto del kit (ya acotado a [0, precio] por el service).
// Crea la fila si el kit aún no existía (abono sin entrega previa).
export async function fijarAbono(
  alumnoId: number,
  kit: TipoKit,
  abonadoCop: number,
  registradoPor: string,
): Promise<void> {
  await db
    .insert(uniformes)
    .values({ alumnoId, kit, abonadoCop, registradoPor })
    .onConflictDoUpdate({
      target: [uniformes.alumnoId, uniformes.kit],
      set: { abonadoCop, registradoPor, actualizadoEn: new Date() },
    });
}
