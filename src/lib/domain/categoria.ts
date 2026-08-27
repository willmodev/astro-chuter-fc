// Catálogo único de categorías y regla de asignación (spec 15). Fuente de verdad
// para el admin y la landing: no hay otra lista de categorías en el proyecto.
// La categoría se calcula por EDAD CUMPLIDA — cambia el día del cumpleaños, no
// al cambiar de temporada. No hay año de temporada hardcodeado en ninguna parte.

export const CATEGORIAS = [
  { sub: 4, nombre: 'Baby' },
  { sub: 6, nombre: 'Pony' },
  { sub: 8, nombre: 'Benjamín' },
  { sub: 10, nombre: 'Preinfantil' },
  { sub: 12, nombre: 'Infantil' },
  { sub: 14, nombre: 'Prejuvenil' },
  { sub: 16, nombre: 'Juvenil' },
] as const;

export interface Categoria {
  sub: number; // 4 … 16
  nombre: string; // 'Benjamín'
  etiqueta: string; // 'SUB 8' — formato ya persistido en user.cats
  edades: string; // '7 a 8 años'
}

export interface AlumnoParaCategoria {
  fechaNacimiento: Date | null;
  anioNacimiento: number;
}

const SUB_MIN = Math.min(...CATEGORIAS.map((c) => c.sub));
const SUB_MAX = Math.max(...CATEGORIAS.map((c) => c.sub));

// Rango de CAPTACIÓN (pedido literal del cliente, 2026-08-26): el club recibe
// de 3 a 15 años. La regla de permanencia sigue llegando a SUB 16 — un
// inscrito de 15 cumple 16 y sigue en Juvenil — por eso el tope es aparte.
export const EDAD_MIN_CAPTACION = SUB_MIN - 1;
export const EDAD_MAX_CAPTACION = 15;

export const etiquetaDeSub = (sub: number): string => `SUB ${String(sub)}`;

// "SUB 8" cubre a los de 7 y 8. En SUB 4 caen además los más chicos, por el
// clamp inferior (un niño de 3 es, literalmente, sub 4). La edad publicada se
// topa en la de captación: Juvenil dice "15 años", no "15 a 16".
const edadesDeSub = (sub: number): string =>
  sub - 1 >= EDAD_MAX_CAPTACION
    ? `${String(sub - 1)} años`
    : `${String(sub - 1)} a ${String(sub)} años`;

function aCategoria(sub: number, nombre: string): Categoria {
  return {
    sub,
    nombre,
    etiqueta: etiquetaDeSub(sub),
    edades: edadesDeSub(sub),
  };
}

/** Las 7 categorías en orden SUB 4 → SUB 16. */
export function listarCategorias(): Categoria[] {
  return CATEGORIAS.map((c) => aCategoria(c.sub, c.nombre));
}

/** Etiquetas del catálogo (`['SUB 4', … 'SUB 16']`), para validar y filtrar. */
// Tupla no vacía: CATEGORIAS lo es por construcción (lo necesita `z.enum`).
export const ETIQUETAS = CATEGORIAS.map((c) => etiquetaDeSub(c.sub)) as [
  string,
  ...string[],
];

/** Categoría por su etiqueta persistida (`'SUB 8'`). Fuera del catálogo → null. */
export function categoriaDeEtiqueta(etiqueta: string): Categoria | null {
  const found = CATEGORIAS.find((c) => etiquetaDeSub(c.sub) === etiqueta);
  return found ? aCategoria(found.sub, found.nombre) : null;
}

/**
 * Años completos a `hoy`, con mes y día (no `getFullYear()` a secas) y en zona
 * local, para que un cumpleaños del 1-ene no corra de año (riesgo TZ, spec 11).
 */
export function edadCumplida(fechaNacimiento: Date, hoy: Date): number {
  let edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
  const mes = hoy.getMonth() - fechaNacimiento.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNacimiento.getDate())) {
    edad--;
  }
  return edad;
}

/**
 * Regla del cliente: `sub = ceil(edad / 2) × 2`, con clamp inferior a SUB 4 y
 * sin categoría por encima de SUB 16. Un niño de 7 es SUB 8; el día que cumple
 * 9 pasa a SUB 10.
 */
export function categoriaDeEdad(edad: number): Categoria | null {
  if (!Number.isFinite(edad) || edad < 0) return null;
  const sub = Math.max(SUB_MIN, Math.ceil(edad / 2) * 2);
  if (sub > SUB_MAX) return null;
  return categoriaDeEtiqueta(etiquetaDeSub(sub));
}

/** Categoría exacta a partir de la fecha de nacimiento completa. */
export function categoriaDeFecha(fecha: Date, hoy: Date): Categoria | null {
  if (Number.isNaN(fecha.getTime())) return null;
  return categoriaDeEdad(edadCumplida(fecha, hoy));
}

/**
 * Fallback mientras falta `fecha_nacimiento`: equivale a suponer que nació el
 * 1 de enero, sin escribir un dato falso en la base.
 */
export function categoriaDeAnio(anio: number, hoy: Date): Categoria | null {
  if (!Number.isInteger(anio)) return null;
  return categoriaDeEdad(hoy.getFullYear() - anio);
}

/** Usa la fecha si existe; si no, cae al año de nacimiento. */
export function categoriaDeAlumno(
  alumno: AlumnoParaCategoria,
  hoy: Date,
): Categoria | null {
  return alumno.fechaNacimiento !== null
    ? categoriaDeFecha(alumno.fechaNacimiento, hoy)
    : categoriaDeAnio(alumno.anioNacimiento, hoy);
}

/** Categoría solo si la edad está en el rango de captación (form público). */
export function categoriaDeCaptacion(fecha: Date, hoy: Date): Categoria | null {
  if (Number.isNaN(fecha.getTime())) return null;
  const edad = edadCumplida(fecha, hoy);
  return edad > EDAD_MAX_CAPTACION ? null : categoriaDeEdad(edad);
}

/** Rango de fechas de nacimiento que capta el form público (`min`/`max`). */
export function rangoFechasAdmitidas(hoy: Date): { min: Date; max: Date } {
  return {
    min: new Date(
      hoy.getFullYear() - (EDAD_MAX_CAPTACION + 1),
      hoy.getMonth(),
      hoy.getDate() + 1,
    ),
    max: hoy,
  };
}
