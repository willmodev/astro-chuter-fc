// Read-only: inventaria los usuarios del admin y lo que depende de cada uno,
// para saber qué se puede borrar sin romper referencias.
//   npx tsx scripts/listar-usuarios.mjs
import { loadEnvFile } from 'node:process';

try {
  loadEnvFile();
} catch {
  // Sin .env: se asume que las vars ya están en el entorno.
}

const { eq, sql } = await import('drizzle-orm');
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

const usuarios = await db.select().from(user);

for (const u of usuarios) {
  const planes = await cuenta(planesSemana, planesSemana.entrenadorId, u.id);
  const ses = await cuenta(sesiones, sesiones.entrenadorId, u.id);
  const pgs = await cuenta(pagos, pagos.registradoPor, u.id);
  const unis = await cuenta(uniformes, uniformes.registradoPor, u.id);
  const cats = Array.isArray(u.cats) ? u.cats.join(', ') : (u.cats ?? '');

  console.log(`${u.role === 'admin' ? '[ADMIN]     ' : '[ENTRENADOR]'} ${u.name}`);
  console.log(`             ${u.email}  ${cats ? `· cats: ${cats}` : ''}`);
  console.log(
    `             planes=${planes} sesiones=${ses} pagos=${pgs} uniformes=${unis}` +
      (planes + ses + pgs + unis > 0 ? '  ← tiene datos asociados' : ''),
  );
  console.log('');
}

console.log(
  `Total: ${usuarios.length} usuario(s) · ` +
    `${usuarios.filter((u) => u.role === 'admin').length} admin · ` +
    `${usuarios.filter((u) => u.role !== 'admin').length} entrenador(es)\n`,
);
process.exit(0);
