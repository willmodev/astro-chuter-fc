// Crea al admin raíz (Camilo) desde variables de entorno. Idempotente por
// email: re-ejecutarlo no duplica. Se corre con tsx (resuelve el alias @/).
//
//   npm run db:seed:admin
//
// Requiere en .env: DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL,
// SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD, SEED_ADMIN_NAME.
import { loadEnvFile } from 'node:process';

// Cargar .env ANTES de importar los módulos que leen process.env al evaluarse.
try {
  loadEnvFile();
} catch {
  // Sin archivo .env: se asume que las vars ya están en el entorno.
}

const email = process.env.SEED_ADMIN_EMAIL;
const password = process.env.SEED_ADMIN_PASSWORD;
const name = process.env.SEED_ADMIN_NAME;

if (!email || !password || !name) {
  console.error(
    '✗ Faltan variables: SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD y SEED_ADMIN_NAME.',
  );
  process.exit(1);
}

// Import dinámico: recién aquí server.ts/client.ts leen el entorno ya cargado.
const { eq } = await import('drizzle-orm');
const { db } = await import('@/lib/db/client');
const { user } = await import('@/lib/db/schema');
const { auth } = await import('@/lib/auth/server');

const existentes = await db
  .select({ id: user.id })
  .from(user)
  .where(eq(user.email, email));

if (existentes.length > 0) {
  console.log(`✓ El admin ${email} ya existe; no se crea de nuevo.`);
  process.exit(0);
}

// Sin headers/request: el plugin admin omite el chequeo de sesión, lo que
// permite sembrar el primer admin cuando aún no hay ninguno.
const creado = await auth.api.createUser({
  body: {
    email,
    password,
    name,
    role: 'admin',
    data: { cats: [] },
  },
});

console.log(`✓ Admin raíz creado: ${creado.user.email} (${creado.user.role}).`);
process.exit(0);
