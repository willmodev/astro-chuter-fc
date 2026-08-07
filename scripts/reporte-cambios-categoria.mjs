// Reporte de SOLO LECTURA sobre el Excel del club: quiénes cambian de SUB al
// aplicar la fecha de nacimiento real (spec 15). No abre la BD ni escribe nada.
// Es la lista que hay que confirmar con el cliente ANTES de correr el seed en
// COMMIT.  Corre con: npx tsx scripts/reporte-cambios-categoria.mjs
import ExcelJS from 'exceljs';

import { cambiosDeCategoria, parseFilas } from './seed-filas.mjs';

const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile('CHUTER FC 2026.xlsx');
const ws = wb.getWorksheet('CATEGORIAS');

const anomalias = [];
const filas = parseFilas(ws, anomalias);
const sinFecha = filas.filter((f) => f.fechaNacimiento === null);
const cambios = cambiosDeCategoria(filas);

console.log(`Hoy: ${new Date().toISOString().slice(0, 10)}`);
console.log(
  `Filas válidas: ${filas.length} · con fecha: ${filas.length - sinFecha.length} · sin fecha: ${sinFecha.length}`,
);

const desvios = anomalias.filter((a) => a.includes('categoría Excel'));
console.log(
  `\n== Categoría por AÑO (fallback) ≠ categoría del Excel: ${desvios.length} ==`,
);
desvios.forEach((a) => console.log('   ' + a));

console.log(
  `\n== Cambian de SUB al aplicar la fecha real (${cambios.length}) ==`,
);
for (const c of [...cambios].sort((a, b) =>
  a.catAnio.localeCompare(b.catAnio),
)) {
  console.log(
    `   ${c.nombre.padEnd(34)} ${c.fechaNacimiento}   ${c.catAnio.padEnd(7)} → ${c.catFecha}`,
  );
}

console.log(`\n== Sin fecha de nacimiento (${sinFecha.length}) ==`);
sinFecha.forEach((f) =>
  console.log(
    `   ${f.nombre.padEnd(34)} año ${f.anioNacimiento} → ${f.catAnio}`,
  ),
);

console.log(`\n== Anomalías (${anomalias.length}) ==`);
anomalias.forEach((a) => console.log('   ' + a));
