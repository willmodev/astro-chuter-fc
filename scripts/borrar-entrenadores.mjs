// Borra los usuarios con rol distinto de `admin`, para entregarle al cliente
// solo la cuenta de administrador: él da de alta a sus entrenadores desde la
// pantalla Equipo y les asigna categorías (HU-7.5, spec 15).
//
//   npx tsx scripts/borrar-entrenadores.mjs         → DRY RUN (no escribe)
//   npx tsx scripts/borrar-entrenadores.mjs --yes   → COMMIT
//
// Se niega a borrar un entrenador que tenga planes o sesiones asociados: esas
// FK no son ON DELETE CASCADE y perderíamos historial de entrenamientos.
// Las filas de `session` y `account` sí caen en cascada (son de Better Auth).
import { loadEnvFile } from 'node:process';

try {
  loadEnvFile();
} catch {
  // Sin .env: se asume que las vars ya están en el entorno.
}

const COMMIT = process.argv.includes('--yes');

const { eq, ne, sql } = await import('drizzle-orm');
const { db } = await import('@/lib/db/client');
const { user } = await import('@/lib/db/schema/auth');
const { planesSemana, sesiones } = await import('@/lib/db/schema/entrenos');

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

const entrenadores = await db.select().from(user).where(ne(user.role, 'admin'));

if (entrenadores.length === 0) {
  console.log('No hay usuarios con rol entrenador. Nada que hacer.\n');
  process.exit(0);
}

let borrables = 0;

for (const u of entrenadores) {
  const planes = await cuenta(planesSemana, planesSemana.entrenadorId, u.id);
  const ses = await cuenta(sesiones, sesiones.entrenadorId, u.id);

  if (planes + ses > 0) {
    console.log(
      `✗ ${u.name} (${u.email}): tiene ${planes} plan(es) y ${ses} sesión(es). ` +
        'No se borra para no perder historial de entrenamientos.',
    );
    continue;
  }

  borrables++;
  console.log(`→ ${u.name} (${u.email}) · rol=${u.role}: se elimina`);

  if (COMMIT) {
    await db.delete(user).where(eq(user.id, u.id));
  }
}

const admins = await db.select().from(user).where(eq(user.role, 'admin'));
console.log(
  COMMIT
    ? `\n✓ Eliminados ${borrables} entrenador(es).`
    : `\n(DRY RUN) ${borrables} entrenador(es) por eliminar. Usá --yes.`,
);
console.log(
  `  Quedan ${admins.length} admin(s): ${admins.map((a) => a.email).join(', ')}\n`,
);
process.exit(0);
