// Seed del histórico real desde `CHUTER FC 2026.xlsx` (hoja CATEGORIAS). Pagos y
// kits de uniforme se leen del COLOR de relleno de las celdas, no de texto.
// Idempotente por documento. Corre con tsx (resuelve el alias @/).
//   npm run db:seed          → DRY RUN: parsea, reporta anomalías, NO escribe.
//   npm run db:seed -- --yes → COMMIT: escribe en la BD de DATABASE_URL.
// Anomalías (nacimiento/documento/categoría inválidos, color desconocido) se
// reportan con nº de fila y se omiten SIN abortar — se corrigen en el Excel y
// se re-corre. El parseo de filas vive en `seed-filas.mjs`.
import { loadEnvFile } from 'node:process';

import ExcelJS from 'exceljs';

import { insertarUniformes, resumenUniformes } from './seed-uniformes.mjs';

try {
  loadEnvFile();
} catch {
  // Sin .env: se asume que las vars ya están en el entorno.
}

const COMMIT = process.argv.includes('--yes');
const ARCHIVO = 'CHUTER FC 2026.xlsx';
const ANIO = 2026;
const CUOTA = 50000;

// Import dinámico: recién aquí client.ts/domain leen el entorno ya cargado.
const { db } = await import('@/lib/db/client');
const { alumnos, pagos, uniformes } = await import('@/lib/db/schema');
const { normaliza } = await import('@/lib/domain/alumnos');
const { precioUniforme } = await import('@/lib/domain/precios');
const { cambiosDeCategoria, MES_COL, parseFilas } = await import('./seed-filas.mjs');

// Cuántos alumnos comparte cada acudiente normalizado (para el precio por kit, R9).
function conteoHermanos(filas) {
  const cnt = new Map();
  for (const f of filas) {
    const k = normaliza(f.acudiente);
    cnt.set(k, (cnt.get(k) ?? 0) + 1);
  }
  return cnt;
}

async function escribir(filas) {
  const existentes = new Set(
    (await db.select({ documento: alumnos.documento }).from(alumnos)).map((a) => a.documento),
  );
  const hermanos = conteoHermanos(filas);
  let creados = 0, actualizados = 0, pagosInsertados = 0, kitsInsertados = 0;
  for (const f of filas) {
    if (existentes.has(f.documento)) actualizados++;
    else creados++;
    // La fecha solo se escribe si el Excel la trae: nunca se pisa con null lo
    // que un admin pudo completar a mano.
    const fecha = f.fechaNacimiento === null ? {} : { fechaNacimiento: f.fechaNacimiento };
    const [row] = await db
      .insert(alumnos)
      .values({
        nombre: f.nombre, documento: f.documento, anioNacimiento: f.anioNacimiento,
        fechaNacimiento: f.fechaNacimiento, acudiente: f.acudiente, celular: f.celular,
        direccion: f.direccion, fechaInicio: f.fechaInicio, activo: true,
      })
      .onConflictDoUpdate({
        target: alumnos.documento,
        set: {
          nombre: f.nombre, anioNacimiento: f.anioNacimiento, acudiente: f.acudiente,
          celular: f.celular, direccion: f.direccion, fechaInicio: f.fechaInicio,
          ...fecha,
        },
      })
      .returning({ id: alumnos.id });
    if (f.mesesPagados.length > 0) {
      const ins = await db
        .insert(pagos)
        .values(f.mesesPagados.map((mes) => ({
          alumnoId: row.id, anio: ANIO, mes, montoCop: CUOTA,
          metodo: null, pagadoEn: null, registradoPor: null,
        })))
        .onConflictDoNothing()
        .returning({ id: pagos.id });
      pagosInsertados += ins.length;
    }
    const precio = precioUniforme((hermanos.get(normaliza(f.acudiente)) ?? 1) > 1);
    kitsInsertados += await insertarUniformes(db, uniformes, row.id, f.kits, precio);
  }
  return { creados, actualizados, pagosInsertados, kitsInsertados };
}

function resumenPagos(filas) {
  const cnt = {};
  for (const f of filas) for (const m of f.mesesPagados) cnt[m] = (cnt[m] ?? 0) + 1;
  return Object.values(MES_COL).map((m) => `${m}=${cnt[m] ?? 0}`).join(' ');
}

// ─── Ejecución ───
const host = process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL).host : '(sin DATABASE_URL)';
const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile(ARCHIVO);
const ws = wb.getWorksheet('CATEGORIAS');
if (!ws) {
  console.error('✗ No se encontró la hoja CATEGORIAS.');
  process.exit(1);
}
const anomalias = [];
const filas = parseFilas(ws, anomalias);
const sinFecha = filas.filter((f) => f.fechaNacimiento === null);
const cambios = cambiosDeCategoria(filas);

console.log(`\nBD: ${host}`);
console.log(`Modo: ${COMMIT ? 'COMMIT (escribe)' : 'DRY RUN (no escribe; usá -- --yes para aplicar)'}`);
console.log(`\nAlumnos a cargar: ${filas.length}   ·   pagos: ${resumenPagos(filas)}`);
console.log(`Kits (uniformes): ${resumenUniformes(filas)}`);
console.log(`Sin fecha de nacimiento (categoría por año): ${sinFecha.length}`);
for (const f of sinFecha) console.log(`   · F${f.fila} ${f.nombre} (${f.anioNacimiento})`);

if (cambios.length > 0) {
  console.log(`\n⚠ Cambian de categoría al aplicar la fecha real (${cambios.length}) — CONFIRMAR CON EL CLIENTE:`);
  for (const f of cambios) {
    console.log(`   · F${f.fila} ${f.nombre} (${f.fechaNacimiento}): ${f.catAnio} → ${f.catFecha}`);
  }
}

if (anomalias.length > 0) {
  console.log(`\n⚠ Anomalías (${anomalias.length}) — se omiten y se corrigen en el Excel:`);
  for (const a of anomalias) console.log(`   · ${a}`);
}

if (!COMMIT) {
  console.log('\n(DRY RUN) No se escribió nada.\n');
  process.exit(0);
}

const { creados, actualizados, pagosInsertados, kitsInsertados } = await escribir(filas);
console.log(`\n✓ Seed aplicado: creados=${creados} actualizados=${actualizados} pagos nuevos=${pagosInsertados} kits nuevos=${kitsInsertados}\n`);
process.exit(0);
