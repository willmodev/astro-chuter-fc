export interface CategoriaSugerida {
  label: string;
  years: number[];
}

export const CATEGORIAS_POR_ANIO: CategoriaSugerida[] = [
  { label: 'Pony (nacidos 2019-2022)', years: [2019, 2020, 2021, 2022] },
  { label: 'Preinfantil (nacidos 2017-2018)', years: [2017, 2018] },
  { label: 'Infantil (nacidos 2015-2016)', years: [2015, 2016] },
  { label: 'Prejuvenil (nacidos 2012-2014)', years: [2012, 2013, 2014] },
];

export function sugerirCategoria(anioNacimiento: number): CategoriaSugerida | null {
  return CATEGORIAS_POR_ANIO.find((c) => c.years.includes(anioNacimiento)) ?? null;
}

// --- Categoría automática del admin (R1) ---
// Distinta de `sugerirCategoria` (sitio público): el admin agrupa por "SUB N"
// según el año de la temporada. En BD real, ANIO_TEMPORADA vendrá de la config
// de temporada; aquí es constante (mock-first, como el mes vivo de la mock).
export const ANIO_TEMPORADA = 2026;
const SUB_MIN = 4;
const SUB_MAX = 16;

// Catálogo fijo de categorías del admin (chips de filtro). Deriva del rango
// [SUB_MIN, SUB_MAX] en pasos de 2, para no repetir la lista a mano.
export const SUBS: string[] = Array.from(
  { length: (SUB_MAX - SUB_MIN) / 2 + 1 },
  (_, i) => `SUB ${SUB_MIN + i * 2}`,
);

/**
 * Categoría "SUB N" del alumno: (añoTemporada − año) redondeado al par superior,
 * acotado a [4, 16]. Fuera de ese rango no hay categoría → `null`.
 * Ej.: nacido 2018 → 2026−2018=8 → "SUB 8".
 */
export function subDeAnio(anio: number): string | null {
  if (!Number.isInteger(anio)) return null;
  const diff = ANIO_TEMPORADA - anio;
  const par = Math.ceil(diff / 2) * 2;
  if (par < SUB_MIN || par > SUB_MAX) return null;
  return `SUB ${par}`;
}

/**
 * Categoría "SUB N" a partir de la fecha de nacimiento (spec 11): delega en
 * `subDeAnio` sobre el año. La fecha debe venir parseada en zona local para que
 * un cumpleaños del 1-ene no corra de año (ver riesgo TZ del spec).
 */
export function subDeFecha(fechaNacimiento: Date): string | null {
  return subDeAnio(fechaNacimiento.getFullYear());
}
