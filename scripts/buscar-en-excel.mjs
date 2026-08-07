// Read-only: cruza los alumnos activos SIN fecha de nacimiento contra el Excel
// del club (todas las hojas, por documento y por nombre) para saber a quién hay
// que ir a buscar y dónde estaba.
//   npx tsx scripts/buscar-en-excel.mjs
import { loadEnvFile } from 'node:process';

import ExcelJS from 'exceljs';

try {
  loadEnvFile();
} catch {
  // Sin .env: se asume que las vars ya están en el entorno.
}

const ARCHIVOS = [
  ['Excel actual', 'CHUTER FC 2026.xlsx'],
  ['Excel viejo (docs/)', 'docs/CHUTER FC 2026.xlsx'],
];

const { and, asc, eq, inArray, isNull } = await import('drizzle-orm');
const { db } = await import('@/lib/db/client');
const { alumnos } = await import('@/lib/db/schema');
const { normaliza } = await import('@/lib/domain/alumnos');

const tokens = (s) =>
  new Set(
    normaliza(s)
      .split(' ')
      .filter((t) => t.length > 2),
  );

// Índice del libro: una entrada por fila con nombre, con sus documentos y el
// contenido de la celda de nacimiento cuando se puede ubicar.
async function indexar(ruta) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(ruta);
  const entradas = [];
  wb.eachSheet((ws) => {
    for (let r = 1; r <= ws.rowCount; r++) {
      const celdas = [];
      ws.getRow(r).eachCell({ includeEmpty: false }, (cell, col) => {
        celdas.push({ col, v: cell.value });
      });
      const textos = celdas
        .map((c) => (typeof c.v === 'string' ? c.v.trim() : ''))
        .filter((t) => /[A-Za-zÁÉÍÓÚÑáéíóúñ]{3,}/.test(t));
      if (textos.length === 0) continue;
      const docs = celdas
        .map((c) => String(c.v ?? '').replace(/\D/g, ''))
        .filter((d) => d.length >= 7);
      entradas.push({
        hoja: ws.name,
        fila: r,
        textos,
        docs: new Set(docs),
        nacimiento: celdas
          .map((c) => c.v)
          .find(
            (v) =>
              v instanceof Date ||
              (Number.isInteger(v) && v > 1900 && v < 2100),
          ),
      });
    }
  });
  return entradas;
}

function buscar(entradas, alumno) {
  const tks = tokens(alumno.nombre);
  const hits = [];
  for (const e of entradas) {
    if (e.docs.has(alumno.documento)) {
      hits.push({ ...e, motivo: 'documento' });
      continue;
    }
    const comunes = e.textos
      .flatMap((t) => [...tokens(t)])
      .filter((t) => tks.has(t));
    if (new Set(comunes).size >= 2) hits.push({ ...e, motivo: 'nombre' });
  }
  return hits;
}

// Por defecto, los activos sin fecha. Se pueden pasar documentos sueltos como
// argumento para rastrear a cualquier otro alumno.
const EXTRA = process.argv.slice(2).filter((a) => /^\d{7,}$/.test(a));
const columnas = {
  nombre: alumnos.nombre,
  documento: alumnos.documento,
  anio: alumnos.anioNacimiento,
};

const pendientes =
  EXTRA.length > 0
    ? await db
        .select(columnas)
        .from(alumnos)
        .where(inArray(alumnos.documento, EXTRA))
    : await db
        .select(columnas)
        .from(alumnos)
        .where(and(eq(alumnos.activo, true), isNull(alumnos.fechaNacimiento)))
        .orderBy(asc(alumnos.nombre));

const libros = [];
for (const [etiqueta, ruta] of ARCHIVOS) {
  libros.push([etiqueta, await indexar(ruta)]);
}

const fmt = (v) =>
  v instanceof Date
    ? v.toISOString().slice(0, 10)
    : v === undefined
      ? '—'
      : String(v);

console.log(
  EXTRA.length > 0
    ? `\nAlumnos consultados: ${pendientes.length}\n`
    : `\nActivos sin fecha de nacimiento: ${pendientes.length}\n`,
);
for (const a of pendientes) {
  console.log(`${a.nombre}  ·  doc=${a.documento}  ·  año=${a.anio}`);
  for (const [etiqueta, entradas] of libros) {
    const hits = buscar(entradas, a);
    if (hits.length === 0) {
      console.log(`   ${etiqueta}: NO APARECE`);
      continue;
    }
    for (const h of hits.slice(0, 3)) {
      console.log(
        `   ${etiqueta}: hoja '${h.hoja}' fila ${h.fila} (match por ${h.motivo}) · nacimiento=${fmt(h.nacimiento)} · "${h.textos[0]}"`,
      );
    }
  }
  console.log('');
}
process.exit(0);
