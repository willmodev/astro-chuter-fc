import { and, eq } from 'drizzle-orm';

import { db } from '@/lib/db/client';
import { pagos } from '@/lib/db/schema';
import type { Mes } from '@/lib/domain/cartera';

// Fila cruda de pago (lo mínimo para derivar estados y recaudo).
export interface PagoRow {
  alumnoId: number;
  anio: number;
  mes: Mes;
  montoCop: number;
}

export interface NuevoPago {
  alumnoId: number;
  anio: number;
  mes: Mes;
  montoCop: number;
  metodo: string | null;
  pagadoEn: Date | null;
  registradoPor: string | null;
}

const COLUMNAS = {
  alumnoId: pagos.alumnoId,
  anio: pagos.anio,
  mes: pagos.mes,
  montoCop: pagos.montoCop,
};

// Todos los pagos de un año (para armar la cartera de todos los alumnos).
export async function pagosPorAnio(anio: number): Promise<PagoRow[]> {
  return db.select(COLUMNAS).from(pagos).where(eq(pagos.anio, anio));
}

export async function pagosDeAlumno(
  alumnoId: number,
  anio: number,
): Promise<PagoRow[]> {
  return db
    .select(COLUMNAS)
    .from(pagos)
    .where(and(eq(pagos.alumnoId, alumnoId), eq(pagos.anio, anio)));
}

// Inserta pagos ignorando los que ya existen (constraint alumno-año-mes).
// Devuelve cuántas filas nuevas se crearon.
export async function insertarPagos(filas: NuevoPago[]): Promise<number> {
  if (filas.length === 0) return 0;
  const creadas = await db
    .insert(pagos)
    .values(filas)
    .onConflictDoNothing()
    .returning({ id: pagos.id });
  return creadas.length;
}
