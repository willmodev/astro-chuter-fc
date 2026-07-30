// Corrección puntual (spec 15): el año de nacimiento de MIGUEL ANGEL RODRIGUEZ
// está cargado como 2024 y el cliente confirmó (2026-07-27) que es 2014.
// Idempotente: la guarda `anio_nacimiento = 2024` hace que la segunda corrida
// no toque nada. Corre con tsx (resuelve el alias @/).
//
//   npx tsx scripts/fix-anio-miguel-angel.mjs          → DRY RUN (no escribe)
//   npx tsx scripts/fix-anio-miguel-angel.mjs --yes    → COMMIT
//
// Se identifica por nombre + año equivocado, no por documento: el documento de
// un menor no se versiona (ver docs/excel-data-dictionary.md).
import { loadEnvFile } from 'node:process';

try {
  loadEnvFile();
} catch {
  // Sin .env: se asume que las vars ya están en el entorno.
}

const COMMIT = process.argv.includes('--yes');
const NOMBRE = 'MIGUEL ANGEL RODRIGUEZ';
const ANIO_MALO = 2024;
const ANIO_BUENO = 2014;

const { and, eq } = await import('drizzle-orm');
const { db } = await import('@/lib/db/client');
const { alumnos } = await import('@/lib/db/schema');

const host = process.env.DATABASE_URL
  ? new URL(process.env.DATABASE_URL).host
  : '(sin DATABASE_URL)';
const condicion = and(
  eq(alumnos.nombre, NOMBRE),
  eq(alumnos.anioNacimiento, ANIO_MALO),
);

const pendientes = await db
  .select({ id: alumnos.id })
  .from(alumnos)
  .where(condicion);

console.log(`\nBD: ${host}`);
console.log(`Filas con ${NOMBRE} y año ${ANIO_MALO}: ${pendientes.length}`);

if (pendientes.length === 0) {
  console.log('✓ Nada que corregir (ya está en 2014 o el alumno no existe).\n');
  process.exit(0);
}

if (!COMMIT) {
  console.log('\n(DRY RUN) No se escribió nada. Usá --yes para aplicar.\n');
  process.exit(0);
}

await db
  .update(alumnos)
  .set({ anioNacimiento: ANIO_BUENO })
  .where(condicion);

console.log(`✓ Corregido: ${ANIO_MALO} → ${ANIO_BUENO} (${pendientes.length} fila).\n`);
process.exit(0);
