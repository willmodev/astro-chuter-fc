// Carga las fechas de nacimiento que el cliente fue enviando para los alumnos
// migrados sin fecha. Idempotente: solo escribe donde sigue en NULL.
//
//   npx tsx scripts/fix-fechas-nacimiento.mjs         → DRY RUN (no escribe)
//   npx tsx scripts/fix-fechas-nacimiento.mjs --yes   → COMMIT
//
// Se identifica por documento (clave de idempotencia del seed) y se verifica
// que el año de la fecha coincida con `anio_nacimiento` antes de escribir.
import { loadEnvFile } from 'node:process';

try {
  loadEnvFile();
} catch {
  // Sin .env: se asume que las vars ya están en el entorno.
}

const COMMIT = process.argv.includes('--yes');

const FECHAS = [
  { documento: '1066891011', nombre: 'GERONIMO ESCORCIA', fecha: '2016-09-08' },
  { documento: '1124089273', nombre: 'MATEW ANDRES MENDEZ', fecha: '2019-01-19' },
  { documento: '1137877038', nombre: 'ADRIAN PACHECO', fecha: '2016-04-05' },
  { documento: '1065830677', nombre: 'CRISTIAN RUIDIAZ', fecha: '2015-01-17' },
  { documento: '1066298435', nombre: 'ABRAHAM PEREZ', fecha: '2018-01-05' },
  // 2026-08-07: única fecha que faltaba de alumnos que siguen en el club.
  { documento: '1066304302', nombre: 'ANGEL SANTIAGO', fecha: '2020-02-26' },
];

const { and, eq, isNull } = await import('drizzle-orm');
const { db } = await import('@/lib/db/client');
const { alumnos } = await import('@/lib/db/schema');

const host = process.env.DATABASE_URL
  ? new URL(process.env.DATABASE_URL).host
  : '(sin DATABASE_URL)';
console.log(`\nBD: ${host}\n`);

let aplicables = 0;

for (const { documento, nombre, fecha } of FECHAS) {
  const [fila] = await db
    .select({
      id: alumnos.id,
      nombre: alumnos.nombre,
      anio: alumnos.anioNacimiento,
      fechaNacimiento: alumnos.fechaNacimiento,
    })
    .from(alumnos)
    .where(eq(alumnos.documento, documento));

  if (!fila) {
    console.log(`✗ ${nombre}: no existe el documento ${documento}.`);
    continue;
  }
  if (fila.fechaNacimiento !== null) {
    console.log(`· ${fila.nombre}: ya tiene fecha (${fila.fechaNacimiento}).`);
    continue;
  }
  if (fila.anio !== Number(fecha.slice(0, 4))) {
    console.log(
      `✗ ${fila.nombre}: el año en base (${fila.anio}) no coincide con ${fecha}.`,
    );
    continue;
  }

  aplicables++;
  console.log(`→ ${fila.nombre}: NULL → ${fecha}`);

  if (COMMIT) {
    await db
      .update(alumnos)
      .set({ fechaNacimiento: fecha })
      .where(and(eq(alumnos.documento, documento), isNull(alumnos.fechaNacimiento)));
  }
}

console.log(
  COMMIT
    ? `\n✓ Aplicadas ${aplicables} fecha(s).\n`
    : `\n(DRY RUN) ${aplicables} fecha(s) por aplicar. Usá --yes.\n`,
);
process.exit(0);
