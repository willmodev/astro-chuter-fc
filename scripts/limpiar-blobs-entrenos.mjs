// Borra de Vercel Blob las imágenes de la parte central de entrenos que ya no
// referencia ninguna sesión de la BD (huérfanas). `borrarBlob` es best-effort
// y al borrar un usuario con su historial los archivos quedan colgados.
//
//   npx tsx scripts/limpiar-blobs-entrenos.mjs         → DRY RUN (no escribe)
//   npx tsx scripts/limpiar-blobs-entrenos.mjs --yes   → COMMIT
//
// Se le pueden pasar subcadenas de ruta para acotar el borrado a esos blobs
// (p. ej. el id de un entrenador); sin argumentos, alcanza a todos.
//
// Compara contra TODAS las sesiones vivas, no contra un usuario concreto: si
// una imagen sigue en uso no se toca, sin importar de quién sea.
import { loadEnvFile } from 'node:process';

try {
  loadEnvFile();
} catch {
  // Sin .env: se asume que las vars ya están en el entorno.
}

const COMMIT = process.argv.includes('--yes');
const FILTROS = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const PREFIJO = 'entrenos/';

const { isNotNull } = await import('drizzle-orm');
const { list, del } = await import('@vercel/blob');
const { db } = await import('@/lib/db/client');
const { sesiones } = await import('@/lib/db/schema/entrenos');

const token = process.env.BLOB_READ_WRITE_TOKEN;
if (!token) {
  console.error('Falta BLOB_READ_WRITE_TOKEN en el entorno.');
  process.exit(1);
}

// El pathname es la identidad estable del blob; las URLs pueden variar.
const rutaDe = (url) => {
  try {
    return decodeURIComponent(new URL(url).pathname).replace(/^\//, '');
  } catch {
    return null;
  }
};

const filas = await db
  .select({ url: sesiones.parteCentralUrl })
  .from(sesiones)
  .where(isNotNull(sesiones.parteCentralUrl));
const enUso = new Set(filas.map((f) => rutaDe(f.url)).filter(Boolean));

const { blobs } = await list({ prefix: PREFIJO, limit: 1000, token });

console.log(`\nBlobs bajo "${PREFIJO}": ${blobs.length}`);
console.log(`Sesiones con imagen en la BD: ${filas.length}\n`);

const alcanzado = (ruta) =>
  FILTROS.length === 0 || FILTROS.some((f) => ruta.includes(f));

const huerfanos = blobs.filter(
  (b) => !enUso.has(b.pathname) && alcanzado(b.pathname),
);

for (const b of blobs) {
  const marca = enUso.has(b.pathname)
    ? '✓ en uso   '
    : alcanzado(b.pathname)
      ? '→ huérfano '
      : '· huérfano (fuera del filtro)';
  console.log(`${marca}  ${b.pathname}`);
}

if (huerfanos.length === 0) {
  console.log('\n✓ No hay blobs huérfanos.\n');
  process.exit(0);
}

if (!COMMIT) {
  console.log(
    `\n(DRY RUN) ${huerfanos.length} blob(s) por borrar. Usá --yes.\n`,
  );
  process.exit(0);
}

await del(
  huerfanos.map((b) => b.url),
  { token },
);
console.log(`\n✓ Borrados ${huerfanos.length} blob(s) huérfano(s).\n`);
process.exit(0);
