import {
  boolean,
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

// Los dos kits reales del club (spec 12): ORO, no DORADO.
export const kitEnum = pgEnum('kit', ['AZUL', 'ORO']);

// Una fila por alumno-kit (hasta 2 por alumno). El estado (entrega × pago) y el
// pago tri-estado se DERIVAN en dominio desde `entregado` + `abonadoCop` vs
// precio; nunca se almacena el estado. La unicidad de `numero` por kit es
// advertencia de dominio (el club repite a propósito), no constraint de BD.
export const uniformes = pgTable(
  'uniformes',
  {
    id: serial('id').primaryKey(),
    alumnoId: integer('alumno_id')
      .notNull()
      .references(() => alumnos.id, { onDelete: 'cascade' }),
    kit: kitEnum('kit').notNull(),
    entregado: boolean('entregado').notNull().default(false),
    numero: integer('numero'), // null hasta entregar
    talla: text('talla').notNull().default(''),
    abonadoCop: integer('abonado_cop').notNull().default(0), // 0..precio del kit
    registradoPor: text('registrado_por').references(() => user.id), // null en seed
    creadoEn: timestamp('creado_en').notNull().defaultNow(),
    actualizadoEn: timestamp('actualizado_en').notNull().defaultNow(),
  },
  (t) => [unique().on(t.alumnoId, t.kit)], // un registro por alumno-kit
);
