// Fragmentos SQL de la consulta paginada de uniformes (spec 18). Viven aparte
// de `uniformes.ts` solo por el límite de 200 líneas por archivo.
//
// Estos CTE reproducen en Postgres cuatro derivaciones que el dominio hace en
// TypeScript (hermanos, precio, estado y categoría). `verificar-estados-uniformes.mjs`
// compara las dos versiones sobre el set completo para que no se separen.
import { sql } from 'drizzle-orm';

import { normaliza } from '@/lib/domain/alumnos';
import { PRECIO_UNIFORME, PRECIO_UNIFORME_HERMANO } from '@/lib/domain/precios';
import { ORDEN_ESTADO_UNIFORME } from '@/lib/domain/uniformes';

import type { FiltrosUniformes, OrdenUniformes } from './uniformes-pagina';
import type { SQL } from 'drizzle-orm';

// Acentos que `normaliza()` elimina vía NFD en TS. Se reproducen con
// `translate()` y no con `unaccent` para no depender de una extensión en Neon.
const ACENTOS = 'áéíóúüñÁÉÍÓÚÜÑàèìòùÀÈÌÒÙ';
const SIN_ACENTOS = 'aeiouunAEIOUUNaeiouAEIOU';

/** `lower(sin acentos)` de una columna — espeja `normaliza()` de dominio. */
export function norm(columna: string): SQL {
  return sql`lower(translate(${sql.raw(columna)}, ${ACENTOS}, ${SIN_ACENTOS}))`;
}

// 'YYYY-MM-DD' en zona local: la misma lectura de "hoy" que hace el dominio.
function aIso(fecha: Date): string {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${String(fecha.getFullYear())}-${mes}-${dia}`;
}

// `sub = ceil(edad / 2) × 2` con clamp inferior en 4 (espeja categoriaDeEdad).
const SUB = sql`GREATEST(4, CEIL(b.edad / 2.0) * 2)`;

/**
 * CTEs `hermanos` → `base` → `derivada`. Deja disponible una relación
 * `derivada` con una fila por (alumno activo × kit): 2N filas, incluidos los
 * kits que todavía no tienen registro en `uniformes`.
 */
export function ctesUniformes(hoy: Date): SQL {
  const hoyIso = aIso(hoy);
  return sql`
    WITH hermanos AS (
      SELECT ${norm('acudiente')} AS clave, count(*)::int AS n
      FROM alumnos
      WHERE activo = true
      GROUP BY 1
    ),
    base AS (
      SELECT
        a.id AS alumno_id,
        a.nombre AS nombre,
        ${norm('a.nombre')} AS nombre_norm,
        k.kit AS kit,
        COALESCE(u.entregado, false) AS entregado,
        u.numero AS numero,
        COALESCE(u.talla, '') AS talla,
        COALESCE(u.abonado_cop, 0)::int AS abonado_cop,
        (CASE
          WHEN h.n > 1 THEN ${PRECIO_UNIFORME_HERMANO}::int
          ELSE ${PRECIO_UNIFORME}::int
        END) AS precio,
        (CASE
          WHEN a.fecha_nacimiento IS NOT NULL
            THEN date_part('year', age(${hoyIso}::date, a.fecha_nacimiento))::int
          ELSE EXTRACT(year FROM ${hoyIso}::date)::int - a.anio_nacimiento
        END) AS edad
      FROM alumnos a
      CROSS JOIN (VALUES ('AZUL'), ('ORO')) AS k(kit)
      LEFT JOIN uniformes u ON u.alumno_id = a.id AND u.kit = k.kit::kit
      LEFT JOIN hermanos h ON h.clave = ${norm('a.acudiente')}
      WHERE a.activo = true
    ),
    derivada AS (
      SELECT
        b.*,
        (CASE
          WHEN b.edad < 0 OR ${SUB} > 16 THEN '—'
          ELSE 'SUB ' || (${SUB})::int::text
        END) AS cat,
        (CASE
          WHEN b.entregado AND b.abonado_cop >= b.precio THEN 'completo'
          WHEN NOT b.entregado AND b.abonado_cop >= b.precio THEN 'porEntregar'
          WHEN b.entregado THEN 'porCobrar'
          ELSE 'sinIniciar'
        END) AS estado
      FROM base b
    )
  `;
}

/** `WHERE` de la pantalla. Sin filtros activos devuelve `true` (todo pasa). */
export function condicionesFiltro(filtros: FiltrosUniformes): SQL {
  const partes: SQL[] = [];
  if (filtros.kit) partes.push(sql`kit = ${filtros.kit}`);
  if (filtros.estado) partes.push(sql`estado = ${filtros.estado}`);
  if (filtros.cat) partes.push(sql`cat = ${filtros.cat}`);

  const texto = filtros.query.trim();
  if (texto !== '') {
    // Un solo campo: nombre (contiene, sin acentos) o dorsal exacto. El número
    // solo entra si el texto es un entero — "10" busca al del dorsal 10.
    // El texto se normaliza con la MISMA regla que la columna: si acá no se
    // quitara el acento, buscar "bolaños" no encontraría a BOLAÑOS.
    const patron = `%${normaliza(texto)}%`;
    const busqueda = [sql`nombre_norm LIKE ${patron}`];
    if (/^\d+$/.test(texto)) {
      busqueda.push(sql`numero = ${Number(texto)}::int`);
    }
    partes.push(sql`(${sql.join(busqueda, sql` OR `)})`);
  }

  return partes.length > 0 ? sql.join(partes, sql` AND `) : sql`true`;
}

// Prioridad de acción tomada del dominio, no reescrita: si cambia el orden en
// `ORDEN_ESTADO_UNIFORME`, cambia aquí.
const PRIORIDAD: SQL = sql.join(
  [
    sql`CASE estado`,
    ...ORDEN_ESTADO_UNIFORME.map(
      (estado, i) => sql`WHEN ${estado} THEN ${i}::int`,
    ),
    sql`ELSE 99 END`,
  ],
  sql` `,
);

/**
 * `ORDER BY` de cada orden. Los tres cierran con `(alumno_id, kit)`: sin un
 * orden total, dos páginas consecutivas pueden repetir u omitir una fila.
 */
export function expresionOrden(orden: OrdenUniformes): SQL {
  const desempate = sql`alumno_id, kit`;
  if (orden === 'numero') {
    return sql`numero ASC NULLS LAST, ${desempate}`;
  }
  if (orden === 'nombre') {
    return sql`nombre_norm ASC, ${desempate}`;
  }
  return sql`${PRIORIDAD} ASC, nombre_norm ASC, ${desempate}`;
}
