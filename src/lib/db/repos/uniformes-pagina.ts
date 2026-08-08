// Consulta paginada de la pantalla Uniformes (spec 18): filtra, ordena, cuenta
// y pagina las 2N filas-kit contra Postgres en una sola ida a la base.
//
// Por qué en SQL y no en dominio: esta lista crece 2× por alumno y es la única
// del admin donde el payload —no el DOM— es el problema. Las derivaciones que
// esto duplica del dominio quedan amarradas por
// `scripts/verificar-estados-uniformes.mjs`.
import { sql } from 'drizzle-orm';

import { db } from '@/lib/db/client';
import type { EstadoKit, TipoKit } from '@/lib/domain/uniformes';

import {
  condicionesFiltro,
  ctesUniformes,
  expresionOrden,
} from './uniformes-sql';

export type OrdenUniformes = 'prioridad' | 'nombre' | 'numero';

export interface FiltrosUniformes {
  kit: TipoKit | null; // null = ambos
  estado: EstadoKit | null; // null = todos
  cat: string | null; // 'SUB 8' | null = todas
  query: string; // nombre o número; '' = sin búsqueda
  orden: OrdenUniformes;
  offset: number;
  limit: number;
}

export interface FilaKit {
  alumnoId: number;
  nombre: string;
  cat: string;
  kit: TipoKit;
  entregado: boolean;
  numero: number | null;
  talla: string;
  abonadoCop: number;
  precio: number;
  estado: EstadoKit;
}

export interface PaginaUniformes {
  filas: FilaKit[];
  total: number;
  conteos: Record<EstadoKit, number>;
  duplicados: Record<TipoKit, number[]>;
}

// Coerciones explícitas: `db.execute` devuelve `unknown` por columna y el
// proyecto no admite `any`.
const aNumero = (v: unknown): number =>
  typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : 0;

const aTexto = (v: unknown): string => (typeof v === 'string' ? v : '');

const aBool = (v: unknown): boolean => v === true;

const aNumeroOpcional = (v: unknown): number | null =>
  v === null || v === undefined ? null : aNumero(v);

function aFilaKit(row: Record<string, unknown>): FilaKit {
  return {
    alumnoId: aNumero(row.alumno_id),
    nombre: aTexto(row.nombre),
    cat: aTexto(row.cat),
    kit: aTexto(row.kit) === 'ORO' ? 'ORO' : 'AZUL',
    entregado: aBool(row.entregado),
    numero: aNumeroOpcional(row.numero),
    talla: aTexto(row.talla),
    abonadoCop: aNumero(row.abonado_cop),
    precio: aNumero(row.precio),
    estado: aTexto(row.estado) as EstadoKit,
  };
}

/**
 * Todas las filas-kit derivadas, sin filtrar ni paginar. Es la relación sobre
 * la que trabajan el paginado y el script de paridad.
 */
export async function todasLasFilasKit(hoy = new Date()): Promise<FilaKit[]> {
  const res = await db.execute(
    sql`${ctesUniformes(hoy)} SELECT * FROM derivada`,
  );
  return res.rows.map(aFilaKit);
}

// `json_agg` llega parseado desde Neon, pero se acepta también el texto crudo.
function aArreglo(v: unknown): Record<string, unknown>[] {
  const dato: unknown = typeof v === 'string' ? JSON.parse(v) : v;
  if (!Array.isArray(dato)) return [];
  return dato.filter(
    (x): x is Record<string, unknown> => typeof x === 'object' && x !== null,
  );
}

function aConteos(filas: Record<string, unknown>[]): Record<EstadoKit, number> {
  // Los 4 estados existen siempre: una opción en 0 se muestra igual, deshabilitada.
  const base: Record<EstadoKit, number> = {
    completo: 0,
    porEntregar: 0,
    porCobrar: 0,
    sinIniciar: 0,
  };
  for (const f of filas) {
    const estado = aTexto(f.estado);
    if (estado in base) base[estado as EstadoKit] = aNumero(f.n);
  }
  return base;
}

function aDuplicados(
  filas: Record<string, unknown>[],
): Record<TipoKit, number[]> {
  const base: Record<TipoKit, number[]> = { AZUL: [], ORO: [] };
  for (const f of filas) {
    const numero = aNumeroOpcional(f.numero);
    if (numero !== null) base[aTexto(f.kit) === 'ORO' ? 'ORO' : 'AZUL'].push(numero);
  }
  return base;
}

/**
 * Página de la pantalla Uniformes. Una sola consulta resuelve filtro, orden,
 * página, total, conteos por estado (sobre el total filtrado) y números
 * repetidos (sobre TODO el set, para que el banner no dependa del filtro).
 *
 * Se pagina con `row_number()` en vez de `LIMIT/OFFSET` para que la ventana
 * salga del mismo orden total y no repita ni omita filas entre páginas.
 */
export async function paginaUniformes(
  filtros: FiltrosUniformes,
  hoy = new Date(),
): Promise<PaginaUniformes> {
  const desde = Math.max(0, filtros.offset);
  const hasta = desde + filtros.limit;

  const res = await db.execute(sql`
    ${ctesUniformes(hoy)},
    filtrada AS (
      SELECT * FROM derivada WHERE ${condicionesFiltro(filtros)}
    ),
    ordenada AS (
      SELECT f.*, row_number() OVER (
        ORDER BY ${expresionOrden(filtros.orden)}
      ) AS rn
      FROM filtrada f
    ),
    pagina AS (
      SELECT * FROM ordenada WHERE rn > ${desde}::int AND rn <= ${hasta}::int
    ),
    conteos AS (
      SELECT estado, count(*)::int AS n FROM filtrada GROUP BY estado
    ),
    dups AS (
      SELECT kit, numero FROM derivada
      WHERE numero IS NOT NULL
      GROUP BY kit, numero
      HAVING count(*) > 1
    )
    SELECT
      (SELECT coalesce(json_agg(p ORDER BY p.rn), '[]'::json) FROM pagina p)
        AS filas,
      (SELECT count(*)::int FROM filtrada) AS total,
      (SELECT coalesce(json_agg(c), '[]'::json) FROM conteos c) AS conteos,
      (SELECT coalesce(json_agg(d ORDER BY d.kit, d.numero), '[]'::json)
        FROM dups d) AS duplicados
  `);

  const fila = res.rows[0] ?? {};
  return {
    filas: aArreglo(fila.filas).map(aFilaKit),
    total: aNumero(fila.total),
    conteos: aConteos(aArreglo(fila.conteos)),
    duplicados: aDuplicados(aArreglo(fila.duplicados)),
  };
}
