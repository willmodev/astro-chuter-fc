import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

import * as schema from './schema';

// `import.meta.env` existe en Astro/Vite; en scripts Node es undefined y se
// cae a `process.env` (por eso el optional chaining).
const DATABASE_URL =
  import.meta.env?.DATABASE_URL ?? process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('Falta DATABASE_URL: configúrala en .env / Vercel.');
}

// Singleton: una sola conexión Neon HTTP + instancia Drizzle para toda la app.
const sql = neon(DATABASE_URL);

export const db = drizzle(sql, { schema });

export type Db = typeof db;
