import { loadEnvFile } from 'node:process';

import { defineConfig } from 'drizzle-kit';

// Carga .env local (en Vercel/CI las vars llegan por el entorno, sin archivo).
try {
  loadEnvFile();
} catch {
  // Sin .env: se usan las variables ya presentes en process.env.
}

// `generate` funciona offline (solo lee el schema); `migrate`/`push` sí
// necesitan la cadena real — si falta, drizzle-kit fallará al conectar.
const DATABASE_URL = process.env.DATABASE_URL ?? '';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/lib/db/schema/index.ts',
  out: './drizzle',
  dbCredentials: { url: DATABASE_URL },
  strict: true,
  verbose: true,
});
