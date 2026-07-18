import { asc, eq } from 'drizzle-orm';

import { db } from '@/lib/db/client';
import { alumnos } from '@/lib/db/schema';

// Fila cruda del alumno. `fechaNacimiento`/`fechaInicio` llegan como string
// 'YYYY-MM-DD' (columna `date`, sin hora) y se parsean en zona local en el
// service — así un cumpleaños del 1-ene no corre de año (riesgo TZ del spec).
export interface AlumnoRow {
  id: number;
  nombre: string;
  documento: string;
  anioNacimiento: number;
  fechaNacimiento: string | null;
  acudiente: string;
  celular: string;
  direccion: string;
  fechaInicio: string;
  activo: boolean;
}

// Campos editables desde el form (no incluye fechaInicio: es el ingreso).
export interface DatosEditablesAlumno {
  nombre: string;
  documento: string;
  anioNacimiento: number;
  fechaNacimiento: string;
  acudiente: string;
  celular: string;
  direccion: string;
}

export interface NuevoAlumno extends DatosEditablesAlumno {
  fechaInicio: string;
}

const COLUMNAS = {
  id: alumnos.id,
  nombre: alumnos.nombre,
  documento: alumnos.documento,
  anioNacimiento: alumnos.anioNacimiento,
  fechaNacimiento: alumnos.fechaNacimiento,
  acudiente: alumnos.acudiente,
  celular: alumnos.celular,
  direccion: alumnos.direccion,
  fechaInicio: alumnos.fechaInicio,
  activo: alumnos.activo,
};

export async function listarAlumnos(): Promise<AlumnoRow[]> {
  return db.select(COLUMNAS).from(alumnos).orderBy(asc(alumnos.nombre));
}

export async function alumnoPorId(id: number): Promise<AlumnoRow | undefined> {
  const [row] = await db
    .select(COLUMNAS)
    .from(alumnos)
    .where(eq(alumnos.id, id))
    .limit(1);
  return row;
}

export async function alumnoPorDocumento(
  documento: string,
): Promise<AlumnoRow | undefined> {
  const [row] = await db
    .select(COLUMNAS)
    .from(alumnos)
    .where(eq(alumnos.documento, documento))
    .limit(1);
  return row;
}

export async function insertarAlumno(datos: NuevoAlumno): Promise<number> {
  const [row] = await db
    .insert(alumnos)
    .values(datos)
    .returning({ id: alumnos.id });
  return row.id;
}

export async function actualizarAlumno(
  id: number,
  datos: DatosEditablesAlumno,
): Promise<void> {
  await db.update(alumnos).set(datos).where(eq(alumnos.id, id));
}
