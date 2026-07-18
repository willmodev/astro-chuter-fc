import {
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core';

import { alumnos } from './alumnos';
import { user } from './auth';

// Los 12 meses aunque hoy solo se cobre hasta NOV: cambiar la ventana de cobro
// (MES_FIN_COBRO en dominio) no toca la BD.
export const mesEnum = pgEnum('mes', [
  'ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC',
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
  },
  (t) => [unique().on(t.alumnoId, t.anio, t.mes)], // un pago por alumno-mes-año
);
