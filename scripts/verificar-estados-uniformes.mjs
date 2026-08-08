// Read-only: contrasta la consulta SQL de la pantalla Uniformes (spec 18)
// contra las reglas de `lib/domain` sobre TODO el set de filas-kit.
//
// La regla del estado del kit queda escrita dos veces —TypeScript y SQL— y ese
// es el costo consciente del paginado en servidor. Este script es lo que impide
// que las dos versiones se separen en silencio: compara estado, precio y
// categoría fila por fila y sale con código ≠ 0 ante la primera diferencia.
//
//   npx tsx scripts/verificar-estados-uniformes.mjs
import { loadEnvFile } from 'node:process';

try {
  loadEnvFile();
} catch {
  // Sin .env: se asume que las vars ya están en el entorno.
}

const { todasLasFilasKit } = await import('@/lib/db/repos/uniformes-pagina');
const { construirAlumnos } = await import('@/lib/services/alumnos');

const host = process.env.DATABASE_URL
  ? new URL(process.env.DATABASE_URL).host
  : '(sin DATABASE_URL)';
console.log(`\nBD: ${host}\n`);

// Mismo instante para las dos versiones: la categoría depende de "hoy".
const hoy = new Date();

const [filasSql, { alumnos }] = await Promise.all([
  todasLasFilasKit(hoy),
  construirAlumnos(hoy),
]);

// Índice del dominio: (alumnoId, kit) → lo que dice `lib/domain`.
const dominio = new Map();
for (const a of alumnos) {
  for (const k of a.kits) {
    dominio.set(`${a.id}-${k.kit}`, {
      nombre: a.name,
      estado: k.estado,
      precio: k.precio,
      cat: a.cat,
    });
  }
}

const diferencias = [];
const anota = (d) => {
  diferencias.push(d);
};

for (const f of filasSql) {
  const clave = `${f.alumnoId}-${f.kit}`;
  const d = dominio.get(clave);
  const nombre = f.nombre;
  if (!d) {
    anota({ clave, campo: 'existencia', sql: 'presente', dominio: 'ausente', nombre });
    continue;
  }
  for (const campo of ['estado', 'precio', 'cat']) {
    if (f[campo] !== d[campo]) {
      anota({ clave, campo, sql: f[campo], dominio: d[campo], nombre });
    }
  }
}

// El universo tiene que ser el mismo en los dos sentidos, no solo SQL ⊆ dominio.
const clavesSql = new Set(filasSql.map((f) => `${f.alumnoId}-${f.kit}`));
for (const [clave, d] of dominio) {
  if (!clavesSql.has(clave)) {
    anota({
      clave,
      campo: 'existencia',
      sql: 'ausente',
      dominio: 'presente',
      nombre: d.nombre,
    });
  }
}

const esperadas = alumnos.length * 2;
console.log(`Alumnos activos: ${alumnos.length}`);
console.log(`Filas SQL:       ${filasSql.length}  (esperadas: ${esperadas})`);

if (filasSql.length !== esperadas) {
  console.error(
    `\n❌ La consulta no devuelve 2 filas por alumno activo.\n`,
  );
  process.exit(1);
}

if (diferencias.length > 0) {
  console.error(`\n❌ ${diferencias.length} diferencia(s) SQL ↔ dominio:\n`);
  for (const d of diferencias.slice(0, 40)) {
    console.error(
      `   ${d.clave.padEnd(10)} ${d.campo.padEnd(11)} ` +
        `sql=${String(d.sql).padEnd(14)} dominio=${String(d.dominio).padEnd(14)} ${d.nombre ?? ''}`,
    );
  }
  if (diferencias.length > 40) {
    console.error(`   … y ${diferencias.length - 40} más`);
  }
  console.error('');
  process.exit(1);
}

console.log(
  `\n✅ 0 diferencias en estado, precio y categoría sobre ${filasSql.length} filas.\n`,
);
process.exit(0);
