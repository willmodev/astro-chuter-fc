// Orquestación de alumnos: arma el contrato de UI desde repos + dominio y
// aplica las reglas de creación/edición. Sin lógica de negocio propia (vive en
// `lib/domain`); sin queries crudas (viven en `lib/db/repos`).
import {
  actualizarAlumno,
  alumnoPorDocumento,
  insertarAlumno,
  listarAlumnos,
} from '@/lib/db/repos/alumnos';
import type { AlumnoRow, DatosEditablesAlumno } from '@/lib/db/repos/alumnos';
import { pagosPorAnio } from '@/lib/db/repos/pagos';
import type { PagoRow } from '@/lib/db/repos/pagos';
import { todosUniformes } from '@/lib/db/repos/uniformes';
import type { UniformeRow } from '@/lib/db/repos/uniformes';
import { AlumnoReglaError, normaliza } from '@/lib/domain/alumnos';
import type { Mes } from '@/lib/domain/cartera';
import { subDeFecha } from '@/lib/domain/categoria';

import type { Alumno, AlumnoPlantel } from '@/features/admin/data/types';

import { aAlumno, aPlantel, parseFechaLocal } from './mapea-alumno';

export interface DatosAlumnoServicio {
  nombre: string;
  documento: string;
  fechaNacimiento: string; // 'YYYY-MM-DD'
  acudiente: string;
  celular: string;
  direccion: string;
}

const VACIO: ReadonlySet<Mes> = new Set<Mes>();

// Índice alumnoId → meses pagados del año.
function indicePagos(pagos: PagoRow[]): Map<number, Set<Mes>> {
  const idx = new Map<number, Set<Mes>>();
  for (const p of pagos) {
    const set = idx.get(p.alumnoId) ?? new Set<Mes>();
    set.add(p.mes);
    idx.set(p.alumnoId, set);
  }
  return idx;
}

// Índice alumnoId → sus filas de uniforme (0..2 kits).
function indiceKits(rows: UniformeRow[]): Map<number, UniformeRow[]> {
  const idx = new Map<number, UniformeRow[]>();
  for (const r of rows) {
    const arr = idx.get(r.alumnoId) ?? [];
    arr.push(r);
    idx.set(r.alumnoId, arr);
  }
  return idx;
}

// Cuántos alumnos comparte cada acudiente normalizado (para `hermanos`).
function conteoHermanos(rows: AlumnoRow[]): Map<string, number> {
  const conteo = new Map<string, number>();
  for (const r of rows) {
    const key = normaliza(r.acudiente);
    conteo.set(key, (conteo.get(key) ?? 0) + 1);
  }
  return conteo;
}

// Arma los alumnos del admin (estados derivados). Reusado por el dashboard;
// devuelve también las filas crudas para derivar cumpleaños (con fecha).
export async function construirAlumnos(
  hoy: Date,
): Promise<{ alumnos: Alumno[]; rows: AlumnoRow[] }> {
  const anio = hoy.getFullYear();
  const [rows, pagos, unis] = await Promise.all([
    listarAlumnos(),
    pagosPorAnio(anio),
    todosUniformes(),
  ]);
  const idx = indicePagos(pagos);
  const idxKits = indiceKits(unis);
  const hermanos = conteoHermanos(rows);
  const alumnos = rows.map((r) =>
    aAlumno({
      row: r,
      pagados: idx.get(r.id) ?? VACIO,
      hermanos: hermanos.get(normaliza(r.acudiente)) ?? 1,
      kits: idxKits.get(r.id) ?? [],
      anio,
      hoy,
    }),
  );
  return { alumnos, rows };
}

export async function listarAlumnosAdmin(hoy: Date): Promise<Alumno[]> {
  const { alumnos } = await construirAlumnos(hoy);
  return alumnos;
}

// Todos los alumnos en contrato sin dinero (roster completo). Base de plantel.
export async function listarPlantelCompleto(): Promise<AlumnoPlantel[]> {
  const rows = await listarAlumnos();
  const hermanos = conteoHermanos(rows);
  return rows.map((r) => aPlantel(r, hermanos.get(normaliza(r.acudiente)) ?? 1));
}

// Entrenador: solo alumnos de sus categorías, contrato sin dinero.
export async function listarPlantel(
  cats: readonly string[],
): Promise<AlumnoPlantel[]> {
  const permitidas = new Set(cats);
  return (await listarPlantelCompleto()).filter((a) => permitidas.has(a.cat));
}

export async function alumnoAdminPorId(
  id: number,
  hoy: Date,
): Promise<Alumno | undefined> {
  const { alumnos } = await construirAlumnos(hoy);
  return alumnos.find((a) => a.id === id);
}

function aEditables(
  datos: DatosAlumnoServicio,
  fecha: Date,
): DatosEditablesAlumno {
  return {
    nombre: datos.nombre.trim(),
    documento: datos.documento.trim(),
    anioNacimiento: fecha.getFullYear(),
    fechaNacimiento: datos.fechaNacimiento,
    acudiente: datos.acudiente.trim(),
    celular: datos.celular.trim(),
    direccion: datos.direccion.trim(),
  };
}

function hoyISO(): string {
  const n = new Date();
  const p = (x: number): string => String(x).padStart(2, '0');
  return `${n.getFullYear()}-${p(n.getMonth() + 1)}-${p(n.getDate())}`;
}

// Valida categoría (por fecha) y documento único; delega el resto al repo.
async function validar(
  datos: DatosAlumnoServicio,
  idActual?: number,
): Promise<Date> {
  const fecha = parseFechaLocal(datos.fechaNacimiento);
  if (subDeFecha(fecha) === null) {
    throw new AlumnoReglaError(
      'La fecha de nacimiento no corresponde a ninguna categoría (SUB 4–16).',
    );
  }
  const existente = await alumnoPorDocumento(datos.documento.trim());
  if (existente && existente.id !== idActual) {
    throw new AlumnoReglaError('Ya existe un alumno con este documento.');
  }
  return fecha;
}

export async function crearAlumno(datos: DatosAlumnoServicio): Promise<number> {
  const fecha = await validar(datos);
  return insertarAlumno({ ...aEditables(datos, fecha), fechaInicio: hoyISO() });
}

export async function editarAlumno(
  id: number,
  datos: DatosAlumnoServicio,
): Promise<void> {
  const fecha = await validar(datos, id);
  await actualizarAlumno(id, aEditables(datos, fecha));
}
