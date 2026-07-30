// Limpieza (spec 15): borra los usuarios de verificación que quedaron en la BD
// con dominio @chuter.test. Uno de ellos ("Entrenador Prueba") estaba activo
// con SUB 8 y SUB 10 — las mismas que un entrenador real — lo que viola la
// regla de una categoría por entrenador activo.
// `session` y `account` caen por `onDelete: 'cascade'`; `planes_semana` y
// `sesiones` NO (el schema conserva el historial a propósito), así que se
// borran a mano — son entrenos ficticios del propio usuario de prueba.
//
//   npx tsx scripts/borra-usuarios-prueba.mjs          → DRY RUN (no escribe)
//   npx tsx scripts/borra-usuarios-prueba.mjs --yes    → COMMIT
//
// Idempotente: si no queda ninguno, la segunda corrida no hace nada.
import { loadEnvFile } from 'node:process';

try {
  loadEnvFile();
} catch {
  // Sin .env: se asume que las vars ya están en el entorno.
}

const COMMIT = process.argv.includes('--yes');
const DOMINIO = '%@chuter.test';

const { inArray, like } = await import('drizzle-orm');
const { db } = await import('@/lib/db/client');
const { planesSemana, sesiones, user } = await import('@/lib/db/schema');

const host = process.env.DATABASE_URL
  ? new URL(process.env.DATABASE_URL).host
  : '(sin DATABASE_URL)';

const objetivo = await db
  .select({ id: user.id, name: user.name, email: user.email, cats: user.cats })
  .from(user)
  .where(like(user.email, DOMINIO));

console.log(`\nBD: ${host}`);
console.log(`Usuarios con correo ${DOMINIO}: ${objetivo.length}`);
objetivo.forEach((u) => console.log(`   ${u.name} · ${u.email} · [${u.cats.join(', ')}]`));

if (objetivo.length === 0) {
  console.log('✓ Nada que borrar.\n');
  process.exit(0);
}

const ids = objetivo.map((u) => u.id);
const planes = await db
  .select({ semana: planesSemana.semanaInicio, tema: planesSemana.tema })
  .from(planesSemana)
  .where(inArray(planesSemana.entrenadorId, ids));
const sesionesPrueba = await db
  .select({ semana: sesiones.semanaInicio, dia: sesiones.dia })
  .from(sesiones)
  .where(inArray(sesiones.entrenadorId, ids));

console.log(`Planes de semana suyos: ${planes.length}`);
planes.forEach((p) => console.log(`   ${p.semana} · ${p.tema}`));
console.log(`Sesiones suyas: ${sesionesPrueba.length}`);
sesionesPrueba.forEach((s) => console.log(`   ${s.semana} · ${s.dia}`));

if (!COMMIT) {
  console.log('\n(DRY RUN) No se borró nada. Usá --yes para aplicar.\n');
  process.exit(0);
}

await db.delete(sesiones).where(inArray(sesiones.entrenadorId, ids));
await db.delete(planesSemana).where(inArray(planesSemana.entrenadorId, ids));
await db.delete(user).where(like(user.email, DOMINIO));
console.log(`✓ Borrados ${objetivo.length} usuario(s) de prueba con su historial.\n`);
process.exit(0);
