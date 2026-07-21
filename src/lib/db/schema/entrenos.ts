import {
  date,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core';

import { user } from './auth';

// Los tres días de entreno del club (spec 09). El label lleva tilde en 'Miércoles'.
export const diaEnum = pgEnum('dia_entreno', ['Lunes', 'Miércoles', 'Viernes']);

// Cabecera del Excel de planeación: tema + objetivos por entrenador y semana.
// Clave natural = `semanaInicio` (lunes, `date`); sin onDelete cascade hacia
// `user` (el historial se conserva si un entrenador se elimina).
export const planesSemana = pgTable(
  'planes_semana',
  {
    id: serial('id').primaryKey(),
    entrenadorId: text('entrenador_id')
      .notNull()
      .references(() => user.id),
    semanaInicio: date('semana_inicio').notNull(), // lunes de la semana
    tema: text('tema').notNull(),
    objetivos: text('objetivos').notNull(),
    creadoEn: timestamp('creado_en').notNull().defaultNow(),
    actualizadoEn: timestamp('actualizado_en').notNull().defaultNow(),
  },
  (t) => [unique().on(t.entrenadorId, t.semanaInicio)],
);

// Un día de entrenamiento: parte central (imagen en Blob) + asistencia. Los
// slots se DERIVAN: una fila existe solo cuando el entrenador registró algo.
export const sesiones = pgTable(
  'sesiones',
  {
    id: serial('id').primaryKey(),
    entrenadorId: text('entrenador_id')
      .notNull()
      .references(() => user.id),
    semanaInicio: date('semana_inicio').notNull(),
    dia: diaEnum('dia').notNull(),
    parteCentralUrl: text('parte_central_url'), // URL de Blob; null = sin imagen
    parteCentralNota: text('parte_central_nota').notNull().default(''),
    ausentes: integer('ausentes').array(), // null = lista NO pasada; [] = todos presentes
    creadoEn: timestamp('creado_en').notNull().defaultNow(),
    actualizadoEn: timestamp('actualizado_en').notNull().defaultNow(),
  },
  (t) => [unique().on(t.entrenadorId, t.semanaInicio, t.dia)],
);
