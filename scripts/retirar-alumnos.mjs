// Retira (activo = false) a los alumnos que el cliente confirmó que ya no están
// en el club. No borra nada: conserva historial y pagos (spec 14).
//
//   npx tsx scripts/retirar-alumnos.mjs         → DRY RUN (no escribe)
//   npx tsx scripts/retirar-alumnos.mjs --yes   → COMMIT
//
// Confirmado por Camilo el 2026-08-07: de los 15 alumnos sin fecha de
// nacimiento solo sigue ANGEL SANTIAGO (fecha cargada aparte); los otros 14 ya
// no están en el club. El seed no reactiva (`activo` no va en el upsert).
import { loadEnvFile } from 'node:process';

try {
  loadEnvFile();
} catch {
  // Sin .env: se asume que las vars ya están en el entorno.
}

const COMMIT = process.argv.includes('--yes');

const DOCUMENTOS = [
  { documento: '1066293089', nombre: 'CRISTOPHER RODRIGUEZ' },
  { documento: '1137877019', nombre: 'DIMAS GUTIERREZ MARQUEZ' },
  { documento: '1066886649', nombre: 'JASSIEL MEJIA MORENO' },
  { documento: '1066883450', nombre: 'JATNIEL MEJIA MORENO' },
  { documento: '1067623534', nombre: 'JOSE ANTONIO LOPEZ' },
  { documento: '1065813904', nombre: 'JOSUE BALMACEDA BECERRA' },
  { documento: '1137732637', nombre: 'LIAM GONZALEZ' },
  { documento: '1066899646', nombre: 'LIAM RAMOS ARREGOCES' },
  { documento: '1065852330', nombre: 'MATIAS MORENO' },
  { documento: '1066898120', nombre: 'MATIAS VIDES VASQUEZ' },
  { documento: '1066298012', nombre: 'MAXIMILIANO PINTO' },
  { documento: '1065827676', nombre: 'SAMUEL ACUÑA' },
  { documento: '1066895067', nombre: 'SANTIAGO MARTINEZ' },
  { documento: '1122415014', nombre: 'THIAGO DAZA OLIVEROS' },
];

const { and, eq } = await import('drizzle-orm');
const { db } = await import('@/lib/db/client');
const { alumnos } = await import('@/lib/db/schema');

const host = process.env.DATABASE_URL
  ? new URL(process.env.DATABASE_URL).host
  : '(sin DATABASE_URL)';
console.log(`\nBD: ${host}\n`);

let aplicables = 0;

for (const { documento, nombre } of DOCUMENTOS) {
  const [fila] = await db
    .select({ nombre: alumnos.nombre, activo: alumnos.activo })
    .from(alumnos)
    .where(eq(alumnos.documento, documento));

  if (!fila) {
    console.log(`✗ ${nombre}: no existe el documento ${documento}.`);
    continue;
  }
  if (!fila.activo) {
    console.log(`· ${fila.nombre}: ya estaba retirado.`);
    continue;
  }

  aplicables++;
  console.log(`→ ${fila.nombre}: activo → retirado`);

  if (COMMIT) {
    await db
      .update(alumnos)
      .set({ activo: false })
      .where(and(eq(alumnos.documento, documento), eq(alumnos.activo, true)));
  }
}

console.log(
  COMMIT
    ? `\n✓ Retirados ${aplicables} alumno(s).\n`
    : `\n(DRY RUN) ${aplicables} alumno(s) por retirar. Usá --yes.\n`,
);
process.exit(0);
