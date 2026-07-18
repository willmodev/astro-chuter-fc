import {
  boolean,
  date,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

// Alumno con acudiente denormalizado (decisión 2b del spec 11): nombre/celular/
// dirección como texto; los hermanos se agrupan por acudiente normalizado.
export const alumnos = pgTable('alumnos', {
  id: serial('id').primaryKey(),
  nombre: text('nombre').notNull(),
  documento: text('documento').notNull().unique(), // clave de idempotencia del seed
  anioNacimiento: integer('anio_nacimiento').notNull(), // deriva categoría (R1)
  fechaNacimiento: date('fecha_nacimiento'), // null en migrados; requerida en el form
  acudiente: text('acudiente').notNull(),
  celular: text('celular').notNull(),
  direccion: text('direccion').notNull().default(''),
  fechaInicio: date('fecha_inicio').notNull(), // col. INCIO del Excel (año 2026)
  activo: boolean('activo').notNull().default(true),
  creadoEn: timestamp('creado_en').notNull().defaultNow(),
});
