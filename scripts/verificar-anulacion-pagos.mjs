// Verifica la mecánica de anulación de pagos (spec 20) contra la base real:
// columnas nuevas, índice único parcial, detalle de pagos de un alumno y el
// error del servicio cuando el mes no tiene pago vivo.
//
//   npx tsx scripts/verificar-anulacion-pagos.mjs [documento]
//
// Solo lee: no anula nada.
import { loadEnvFile } from 'node:process';

try {
  loadEnvFile();
} catch {
  // Sin .env: se asume que las vars ya están en el entorno.
}

const { db } = await import('@/lib/db/client');
const { sql } = await import('drizzle-orm');

const host = process.env.DATABASE_URL
  ? new URL(process.env.DATABASE_URL).host
  : '(sin DATABASE_URL)';
console.log(`\nBD: ${host}\n`);

const { rows: columnas } = await db.execute(sql`
  select column_name, is_nullable
  from information_schema.columns
  where table_name = 'pagos'
    and column_name in ('anulado_en', 'anulado_por', 'motivo_anulacion')
  order by column_name
`);
console.log('Columnas nuevas:', columnas);

const { rows: indices } = await db.execute(sql`
  select indexname, indexdef from pg_indexes where tablename = 'pagos'
`);
for (const i of indices) console.log(`\n${i.indexname}\n  ${i.indexdef}`);

const { rows: anulados } = await db.execute(sql`
  select count(*)::int as total from pagos where anulado_en is not null
`);
console.log('\nPagos anulados en la base:', anulados[0]?.total);

// Detalle de un alumno con pagos: los del seed deben salir con autor null.
const documento = process.argv[2];
const { detallePagosDeAlumno } = await import('@/lib/db/repos/pagos');
const { rows: alumno } = documento
  ? await db.execute(
      sql`select id, nombre from alumnos where documento = ${documento} limit 1`,
    )
  : await db.execute(sql`
      select a.id, a.nombre from alumnos a
      join pagos p on p.alumno_id = a.id and p.anulado_en is null
      group by a.id, a.nombre order by count(*) desc limit 1
    `);

if (!alumno[0]) {
  console.log('\nSin alumno para inspeccionar.');
} else {
  const { id, nombre } = alumno[0];
  const detalle = await detallePagosDeAlumno(id, new Date().getFullYear());
  console.log(`\nDetalle de ${nombre} (id ${id}):`);
  console.table(detalle);

  const { anularPago } = await import('@/lib/services/cartera');
  const mesLibre = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO',
    'SEP', 'OCT', 'NOV', 'DIC'].find(
    (m) => !detalle.some((d) => d.mes === m),
  );
  if (mesLibre) {
    try {
      await anularPago({
        alumnoId: id,
        anio: new Date().getFullYear(),
        mes: mesLibre,
        motivo: 'prueba de validación',
        anuladoPor: 'script',
      });
      console.log(`\n❌ ${mesLibre} sin pago NO lanzó error.`);
    } catch (e) {
      console.log(`\n✅ ${mesLibre} sin pago → "${e.message}"`);
    }
  }
}
