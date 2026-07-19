// Seed del histórico real desde `CHUTER FC 2026.xlsx` (hoja CATEGORIAS). Pagos y
// kits de uniforme se leen del COLOR de relleno de las celdas, no de texto.
// Idempotente por documento. Corre con tsx (resuelve el alias @/).
//   npm run db:seed          → DRY RUN: parsea, reporta anomalías, NO escribe.
//   npm run db:seed -- --yes → COMMIT: escribe en la BD de DATABASE_URL.
// Anomalías (año/documento/categoría inválidos, color desconocido) se reportan
// con nº de fila y se omiten SIN abortar — se corrigen en el Excel y se re-corre.
import { loadEnvFile } from 'node:process';

import ExcelJS from 'exceljs';

import { insertarUniformes, kitsDeFila, resumenUniformes } from './seed-uniformes.mjs';

try {
  loadEnvFile();
} catch {
  // Sin .env: se asume que las vars ya están en el entorno.
}

const COMMIT = process.argv.includes('--yes');
const ARCHIVO = 'CHUTER FC 2026.xlsx';
const ANIO = 2026;
const CUOTA = 50000;
const HEADER_ROW = 4;
// Columnas de mes en CATEGORIAS: MAR..NOV (el club nació en marzo 2026).
const MES_COL = {
  L: 'MAR', M: 'ABR', N: 'MAY', O: 'JUN', P: 'JUL',
  Q: 'AGO', R: 'SEP', S: 'OCT', T: 'NOV',
};

// Import dinámico: recién aquí client.ts/domain leen el entorno ya cargado.
const { db } = await import('@/lib/db/client');
const { alumnos, pagos, uniformes } = await import('@/lib/db/schema');
const { subDeAnio } = await import('@/lib/domain/categoria');
const { normaliza } = await import('@/lib/domain/alumnos');
const { precioUniforme } = await import('@/lib/domain/precios');

// Relleno de celda de mes → estado del pago. theme9=verde=pagado; theme0/sin
// relleno=no pagado; otro color=desconocido (se reporta, no se adivina).
function estadoCelda(cell) {
  const f = cell.fill;
  if (!f || f.type !== 'pattern' || f.pattern === 'none') return 'vacio';
  const t = f.fgColor?.theme;
  if (t === 9) return 'pagado';
  if (t === 0) return 'vacio';
  return 'desconocido';
}

// Date de Excel (UTC medianoche) → 'YYYY-MM-DD' sin corrimiento de zona.
function fechaISO(v) {
  if (!(v instanceof Date)) return null;
  const p = (n) => String(n).padStart(2, '0');
  return `${v.getUTCFullYear()}-${p(v.getUTCMonth() + 1)}-${p(v.getUTCDate())}`;
}

const texto = (cell) => String(cell.value ?? '').trim();

function parseFilas(ws, anomalias) {
  const filas = [];
  const vistos = new Map(); // documento → nº de fila
  for (let r = HEADER_ROW + 1; r <= ws.rowCount; r++) {
    const nombre = texto(ws.getCell(`C${r}`));
    if (nombre === '') continue;
    const anio = ws.getCell(`F${r}`).value;
    const catCalc = Number.isInteger(anio) ? subDeAnio(anio) : null;
    const docRaw = ws.getCell(`D${r}`).value;
    const documento = docRaw == null ? '' : String(docRaw).replace(/\D/g, '');
    const catExcel = texto(ws.getCell(`E${r}`));
    const fechaInicio = fechaISO(ws.getCell(`H${r}`).value);

    if (catCalc === null) {
      anomalias.push(`F${r} ${nombre}: año '${anio}' fuera de rango (SUB 4–16) → omitida`);
      continue;
    }
    if (documento === '') {
      anomalias.push(`F${r} ${nombre}: documento vacío → omitida`);
      continue;
    }
    if (vistos.has(documento)) {
      anomalias.push(`F${r} ${nombre}: documento ${documento} duplicado (ya en F${vistos.get(documento)}) → omitida`);
      continue;
    }
    if (catExcel && catExcel !== catCalc) {
      anomalias.push(`F${r} ${nombre}: categoría Excel '${catExcel}' ≠ calculada '${catCalc}' → omitida`);
      continue;
    }
    if (fechaInicio === null) {
      anomalias.push(`F${r} ${nombre}: fecha de inicio (INCIO) inválida → omitida`);
      continue;
    }
    vistos.set(documento, r);

    const mesesPagados = [];
    for (const [col, mes] of Object.entries(MES_COL)) {
      const est = estadoCelda(ws.getCell(`${col}${r}`));
      if (est === 'pagado') mesesPagados.push(mes);
      else if (est === 'desconocido') {
        anomalias.push(`F${r} ${nombre}: relleno de color desconocido en ${mes} → pago omitido`);
      }
    }

    filas.push({
      nombre,
      documento,
      anioNacimiento: anio,
      acudiente: texto(ws.getCell(`I${r}`)),
      celular: String(ws.getCell(`J${r}`).value ?? '').replace(/\D/g, ''),
      direccion: texto(ws.getCell(`K${r}`)),
      fechaInicio,
      mesesPagados,
      kits: kitsDeFila(ws, r, nombre, anomalias),
    });
  }
  return filas;
}
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
    const [row] = await db
      .insert(alumnos)
      .values({
        nombre: f.nombre, documento: f.documento, anioNacimiento: f.anioNacimiento,
        fechaNacimiento: null, acudiente: f.acudiente, celular: f.celular,
        direccion: f.direccion, fechaInicio: f.fechaInicio, activo: true,
      })
      .onConflictDoUpdate({
        target: alumnos.documento,
        // NO toca fechaNacimiento (la puede haber completado un admin) ni activo.
        set: {
          nombre: f.nombre, anioNacimiento: f.anioNacimiento, acudiente: f.acudiente,
          celular: f.celular, direccion: f.direccion, fechaInicio: f.fechaInicio,
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
console.log(`\nBD: ${host}`);
console.log(`Modo: ${COMMIT ? 'COMMIT (escribe)' : 'DRY RUN (no escribe; usá -- --yes para aplicar)'}`);
console.log(`\nAlumnos a cargar: ${filas.length}   ·   pagos: ${resumenPagos(filas)}`);
console.log(`Kits (uniformes): ${resumenUniformes(filas)}`);
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
