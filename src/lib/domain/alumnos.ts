// Reglas puras de la lista de alumnos — capa de dominio, sin UI ni datos.
// Búsqueda y filtro corren en cliente sobre la lista completa (~100 alumnos);
// Cartera reutilizará estas mismas funciones.
import { subDeFecha } from './categoria';
import { mesesEnMora, type EstadoMes } from './cartera';

// Subconjunto estructural que necesita el filtro. `Alumno` (capa de datos)
// lo cumple, sin que el dominio dependa de la capa de features.
interface AlumnoBuscable {
  name: string;
  acu: string;
  cat: string;
}

export const CATEGORIA_TODAS = 'Todas';

// Error de regla de negocio de alumnos (documento duplicado, fecha inválida…).
// El Action lo traduce a un error de transporte legible (BAD_REQUEST).
export class AlumnoReglaError extends Error {}

export interface FiltroAlumnos {
  query: string;
  cat: string; // CATEGORIA_TODAS o una categoría exacta ("SUB 10")
}

/** Minúsculas y sin acentos: "José" → "jose" (para búsqueda). */
export function normaliza(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Filtra por nombre O acudiente (sin mayúsculas/acentos), combinable con
 * el chip de categoría. Query vacía = sin filtro de texto.
 */
export function filtraAlumnos<T extends AlumnoBuscable>(
  alumnos: readonly T[],
  { query, cat }: FiltroAlumnos,
): T[] {
  const q = normaliza(query.trim());
  return alumnos.filter((a) => {
    const pasaCategoria = cat === CATEGORIA_TODAS || a.cat === cat;
    const pasaTexto =
      q === '' || normaliza(a.name).includes(q) || normaliza(a.acu).includes(q);
    return pasaCategoria && pasaTexto;
  });
}

// Estado binario: un mes se cobra o no se cobra, sin "abono/parcial".
export type EstadoAlumno = 'alDia' | 'mora';

/** Estado del alumno según sus meses vencidos (reutiliza mesesEnMora). */
export function estadoAlumno(a: {
  states: EstadoMes[];
  cuota: number;
}): EstadoAlumno {
  return mesesEnMora(a) > 0 ? 'mora' : 'alDia';
}

// --- Inscribir / editar alumno (HU-2.4, HU-2.5) ---

// Núcleo validable del form (sin `dir`, opcional). La fecha de nacimiento
// reemplaza al año (spec 11): un solo campo, la categoría se deriva de ella.
export interface DatosAlumnoInput {
  name: string;
  doc: string;
  fechaNacimiento: string; // 'YYYY-MM-DD'
  acu: string;
  phone: string;
}

export type CampoAlumno = 'name' | 'doc' | 'fechaNacimiento' | 'acu' | 'phone';
export type ErroresAlumno = Partial<Record<CampoAlumno, string>>;

const soloDigitos = (texto: string): string => texto.replace(/\D/g, '');

// 'YYYY-MM-DD' → Date local válida, o null (formato malo o fecha imposible).
export function parseFechaNacimiento(iso: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [y, m, d] = iso.split('-').map(Number);
  const fecha = new Date(y, m - 1, d);
  const real =
    fecha.getFullYear() === y && fecha.getMonth() === m - 1 && fecha.getDate() === d;
  return real ? fecha : null;
}

interface AlumnoDocumento {
  id: number;
  doc: string;
}

function docDuplicado(
  alumnos: readonly AlumnoDocumento[],
  doc: string,
  idActual?: number,
): boolean {
  return alumnos.some((a) => a.id !== idActual && soloDigitos(a.doc) === doc);
}

/**
 * Valida el form de alumno: requeridos, documento ≥8 dígitos y único (excluye
 * `idActual` al editar), celular de 10 dígitos, año dentro de los rangos SUB.
 * Devuelve un error por campo; objeto vacío = válido.
 */
export function validarAlumno(
  datos: DatosAlumnoInput,
  alumnos: readonly AlumnoDocumento[],
  idActual?: number,
): ErroresAlumno {
  const errores: ErroresAlumno = {};
  if (datos.name.trim() === '') errores.name = 'El nombre es obligatorio.';
  if (datos.acu.trim() === '') errores.acu = 'El acudiente es obligatorio.';

  const doc = soloDigitos(datos.doc);
  if (doc === '') errores.doc = 'El documento es obligatorio.';
  else if (doc.length < 8) errores.doc = 'El documento debe tener al menos 8 dígitos.';
  else if (docDuplicado(alumnos, doc, idActual))
    errores.doc = 'Ya existe un alumno con este documento.';

  if (soloDigitos(datos.phone).length !== 10)
    errores.phone = 'El celular debe tener 10 dígitos.';

  const fecha = parseFechaNacimiento(datos.fechaNacimiento);
  if (fecha === null)
    errores.fechaNacimiento = 'La fecha de nacimiento es obligatoria.';
  else if (subDeFecha(fecha) === null)
    errores.fechaNacimiento = 'La fecha no corresponde a ninguna categoría (SUB 4–16).';

  return errores;
}

/** Acudientes existentes que coinciden con `query` (sin mayúsculas/acentos), sin repetir. */
export function sugerirAcudientes(
  alumnos: readonly { acu: string }[],
  query: string,
): string[] {
  const q = normaliza(query.trim());
  if (q === '') return [];
  const vistos = new Set<string>();
  const res: string[] = [];
  for (const { acu } of alumnos) {
    if (normaliza(acu).includes(q) && !vistos.has(acu)) {
      vistos.add(acu);
      res.push(acu);
    }
  }
  return res;
}

/** ¿Otro alumno (excluye `idActual`) comparte el mismo acudiente normalizado? (R4) */
export function esHermano(
  alumnos: readonly { id: number; acu: string }[],
  acu: string,
  idActual?: number,
): boolean {
  const key = normaliza(acu.trim());
  if (key === '') return false;
  return alumnos.some((a) => a.id !== idActual && normaliza(a.acu) === key);
}
