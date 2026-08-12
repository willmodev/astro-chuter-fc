import { and, eq, isNull } from 'drizzle-orm';

import { db } from '@/lib/db/client';
import { pagos, user } from '@/lib/db/schema';
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

// Detalle de un pago vivo para la hoja de anulación (spec 20). Los `null` son
// pagos de la carga inicial del Excel: no tienen método, fecha ni autor.
export interface PagoDetalle {
  mes: Mes;
  montoCop: number;
  pagadoEn: Date | null;
  metodo: string | null;
  registradoPorNombre: string | null;
}

export interface AnulacionPago {
  anuladoPor: string;
  motivo: string;
  anuladoEn: Date;
}

// Un pago anulado no existe para nadie que derive estados (spec 20): el filtro
// vive acá y no en el dominio, para no tener dos lugares donde un pago cuenta.
// Todos los pagos de un año (para armar la cartera de todos los alumnos).
export async function pagosPorAnio(anio: number): Promise<PagoRow[]> {
  return db
    .select(COLUMNAS)
    .from(pagos)
    .where(and(eq(pagos.anio, anio), isNull(pagos.anuladoEn)));
}

export async function pagosDeAlumno(
  alumnoId: number,
  anio: number,
): Promise<PagoRow[]> {
  return db
    .select(COLUMNAS)
    .from(pagos)
    .where(
      and(
        eq(pagos.alumnoId, alumnoId),
        eq(pagos.anio, anio),
        isNull(pagos.anuladoEn),
      ),
    );
}

// LEFT JOIN a propósito: los pagos del seed no tienen autor y tienen que salir.
export async function detallePagosDeAlumno(
  alumnoId: number,
  anio: number,
): Promise<PagoDetalle[]> {
  return db
    .select({
      mes: pagos.mes,
      montoCop: pagos.montoCop,
      pagadoEn: pagos.pagadoEn,
      metodo: pagos.metodo,
      registradoPorNombre: user.name,
    })
    .from(pagos)
    .leftJoin(user, eq(user.id, pagos.registradoPor))
    .where(
      and(
        eq(pagos.alumnoId, alumnoId),
        eq(pagos.anio, anio),
        isNull(pagos.anuladoEn),
      ),
    );
}

// Marca la fila viva de ese mes. Devuelve false si no había nada que anular.
export async function anularPago(
  alumnoId: number,
  anio: number,
  mes: Mes,
  anulacion: AnulacionPago,
): Promise<boolean> {
  const tocadas = await db
    .update(pagos)
    .set({
      anuladoEn: anulacion.anuladoEn,
      anuladoPor: anulacion.anuladoPor,
      motivoAnulacion: anulacion.motivo,
    })
    .where(
      and(
        eq(pagos.alumnoId, alumnoId),
        eq(pagos.anio, anio),
        eq(pagos.mes, mes),
        isNull(pagos.anuladoEn),
      ),
    )
    .returning({ id: pagos.id });
  return tocadas.length > 0;
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
