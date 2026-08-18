// Borra usuarios del admin identificados por correo. Pensado para limpiar
// cuentas de prueba puntuales sin tocar al resto del equipo.
//
//   npx tsx scripts/borrar-usuarios-por-email.mjs a@x.com b@y.com
//   npx tsx scripts/borrar-usuarios-por-email.mjs a@x.com --yes
//   ... --con-historial   → borra también sus planes/sesiones de entreno
//
// Sin --yes es DRY RUN: solo informa. Se niega a borrar admins y a borrar a
// quien tenga pagos o uniformes registrados (esas FK no son ON DELETE CASCADE
// y son historial real). `session` y `account` sí caen en cascada.
import { loadEnvFile } from 'node:process';

try {
  loadEnvFile();
} catch {
  // Sin .env: se asume que las vars ya están en el entorno.
}

const COMMIT = process.argv.includes('--yes');
const CON_HISTORIAL = process.argv.includes('--con-historial');
const EMAILS = process.argv.slice(2).filter((a) => !a.startsWith('--'));

if (EMAILS.length === 0) {
  console.error(
    'Uso: npx tsx scripts/borrar-usuarios-por-email.mjs <correo…> [--con-historial] [--yes]',
  );
  process.exit(1);
}

const { eq, inArray, sql } = await import('drizzle-orm');
const { db } = await import('@/lib/db/client');
const { user } = await import('@/lib/db/schema/auth');
const { planesSemana, sesiones } = await import('@/lib/db/schema/entrenos');
const { pagos } = await import('@/lib/db/schema/pagos');
const { uniformes } = await import('@/lib/db/schema/uniformes');

const host = process.env.DATABASE_URL
  ? new URL(process.env.DATABASE_URL).host
  : '(sin DATABASE_URL)';
console.log(`\nBD: ${host}\n`);

const cuenta = async (tabla, columna, id) => {
  const [r] = await db
    .select({ n: sql`count(*)::int` })
    .from(tabla)
    .where(eq(columna, id));
  return r.n;
};

// Dependencias de un usuario, separadas en las que se pueden arrastrar
// (entrenos) y las que bloquean el borrado (dinero registrado).
const dependencias = async (id) => ({
  planes: await cuenta(planesSemana, planesSemana.entrenadorId, id),
  ses: await cuenta(sesiones, sesiones.entrenadorId, id),
  pagosReg: await cuenta(pagos, pagos.registradoPor, id),
  pagosAnul: await cuenta(pagos, pagos.anuladoPor, id),
  unis: await cuenta(uniformes, uniformes.registradoPor, id),
});

const encontrados = await db
  .select()
  .from(user)
  .where(inArray(user.email, EMAILS));

for (const correo of EMAILS) {
  if (!encontrados.some((u) => u.email === correo)) {
    console.log(`· ${correo}: no existe en la BD (nada que borrar)`);
  }
}

const aBorrar = [];

for (const u of encontrados) {
  const d = await dependencias(u.id);
  const cats = u.cats.length ? ` · cats: ${u.cats.join(', ')}` : '';
  console.log(`${u.name} <${u.email}> · rol=${u.role}${cats}`);
  console.log(
    `   planes=${d.planes} sesiones=${d.ses} pagos=${d.pagosReg} ` +
      `anulaciones=${d.pagosAnul} uniformes=${d.unis}`,
  );

  if (u.role === 'admin') {
    console.log('   ✗ es admin: no se borra desde este script.\n');
    continue;
  }
  if (d.pagosReg + d.pagosAnul + d.unis > 0) {
    console.log('   ✗ tiene movimientos de dinero registrados: no se borra.\n');
    continue;
  }
  if (d.planes + d.ses > 0 && !CON_HISTORIAL) {
    console.log('   ✗ tiene entrenos asociados. Usá --con-historial.\n');
    continue;
  }

  aBorrar.push(u);
  console.log(
    d.planes + d.ses > 0
      ? '   → se elimina, junto con sus planes y sesiones.\n'
      : '   → se elimina.\n',
  );
}

if (aBorrar.length === 0) {
  console.log('Nada por borrar.\n');
  process.exit(0);
}

if (!COMMIT) {
  console.log(
    `(DRY RUN) ${aBorrar.length} usuario(s) por eliminar. Usá --yes.\n`,
  );
  process.exit(0);
}

const ids = aBorrar.map((u) => u.id);
await db.delete(sesiones).where(inArray(sesiones.entrenadorId, ids));
await db.delete(planesSemana).where(inArray(planesSemana.entrenadorId, ids));
await db.delete(user).where(inArray(user.id, ids));
console.log(`✓ Eliminados ${aBorrar.length} usuario(s).\n`);
process.exit(0);
