// Read-only: lista los alumnos activos sin fecha_nacimiento.
//   npx tsx scripts/listar-sin-fecha.mjs
import { loadEnvFile } from 'node:process';

try {
  loadEnvFile();
} catch {
  // Sin .env: se asume que las vars ya están en el entorno.
}

const { and, eq, isNull, asc } = await import('drizzle-orm');
const { db } = await import('@/lib/db/client');
const { alumnos } = await import('@/lib/db/schema');

const filas = await db
  .select({
    id: alumnos.id,
    nombre: alumnos.nombre,
    documento: alumnos.documento,
    anio: alumnos.anioNacimiento,
  })
  .from(alumnos)
  .where(and(eq(alumnos.activo, true), isNull(alumnos.fechaNacimiento)))
  .orderBy(asc(alumnos.nombre));

console.log(`\nActivos sin fecha de nacimiento: ${filas.length}\n`);
for (const f of filas) {
  console.log(`${String(f.id).padStart(4)}  ${f.nombre.padEnd(34)} doc=${f.documento}  año=${f.anio}`);
}

const total = await db
  .select({ id: alumnos.id })
  .from(alumnos)
  .where(eq(alumnos.activo, true));
console.log(`\nTotal activos: ${total.length}\n`);
process.exit(0);
