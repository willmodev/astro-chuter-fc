import { sql } from 'drizzle-orm';
import {
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

import { alumnos } from './alumnos';
import { user } from './auth';

// Los 12 meses aunque hoy solo se cobre hasta NOV: cambiar la ventana de cobro
// (MES_FIN_COBRO en dominio) no toca la BD.
export const mesEnum = pgEnum('mes', [
  'ENE',
  'FEB',
  'MAR',
  'ABR',
  'MAY',
  'JUN',
  'JUL',
  'AGO',
  'SEP',
  'OCT',
  'NOV',
  'DIC',
]);

// Fila SOLO cuando se paga (decisión 1a): `due/pending/na` se derivan en dominio.
export const pagos = pgTable(
  'pagos',
  {
    id: serial('id').primaryKey(),
    alumnoId: integer('alumno_id')
      .notNull()
      .references(() => alumnos.id, { onDelete: 'cascade' }),
    anio: integer('anio').notNull(), // 2026, 2027… (filtro por año)
    mes: mesEnum('mes').notNull(),
    montoCop: integer('monto_cop').notNull(), // cuota vigente al pagar
    metodo: text('metodo'), // 'efectivo' | 'transferencia' | null (seed)
    pagadoEn: timestamp('pagado_en'), // null en pagos del seed
    registradoPor: text('registrado_por').references(() => user.id), // null en seed
    // Soft delete (spec 20): las tres viajan juntas — null = pago vivo.
    anuladoEn: timestamp('anulado_en'),
    anuladoPor: text('anulado_por').references(() => user.id),
    motivoAnulacion: text('motivo_anulacion'),
  },
  // Un solo pago VIVO por alumno-año-mes: parcial para poder volver a cobrar
  // un mes anulado (spec 20).
  (t) => [
    uniqueIndex('pagos_alumno_anio_mes_vivo')
      .on(t.alumnoId, t.anio, t.mes)
      .where(sql`${t.anuladoEn} is null`),
  ],
);
