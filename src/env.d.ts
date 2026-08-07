/// <reference types="astro/client" />

// Astro tipa `import.meta.env` como `any`, así que cada lectura de una
// variable de entorno se propagaba como `any` por todo el repo (40 hallazgos
// de `no-unsafe-*` en el inventario del spec 16). Declararlas aquí las vuelve
// `string | undefined` y el `?? 'valor-por-defecto'` de `lib/site.ts` pasa a
// estar realmente tipado.
interface ImportMetaEnv {
  // Públicas (accesibles desde el cliente)
  readonly PUBLIC_WHATSAPP_NUMBER?: string;
  readonly PUBLIC_CONTACT_EMAIL?: string;
  readonly PUBLIC_GOOGLE_MAPS_EMBED_URL?: string;
  readonly PUBLIC_INSTAGRAM_URL?: string;
  readonly PUBLIC_SITE_URL?: string;

  // Server-only: nunca deben llevar el prefijo PUBLIC_
  readonly RESEND_API_KEY?: string;
  readonly CONTACT_EMAIL_FROM?: string;
  readonly CONTACT_EMAIL_TO?: string;
  readonly DATABASE_URL?: string;
  readonly BETTER_AUTH_SECRET?: string;
  readonly BETTER_AUTH_URL?: string;
  readonly BLOB_READ_WRITE_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// `lucide-astro` reexporta cada icono desde un `.astro`, extensión que TS no
// resuelve: sin este shim esos imports quedan con tipo `error` (no-unsafe-*).
// Acotarlo a 'lucide-astro' no sirve (probado); el language server de Astro
// resuelve el archivo real y gana sobre este wildcard, así que no afloja el
// tipado de props de los `.astro` propios.
declare module '*.astro' {
  const componente: (props: Record<string, unknown>) => unknown;
  export default componente;
}

declare namespace App {
  interface Locals {
    user: import('@/lib/auth/server').AuthUser | null;
    session: import('@/lib/auth/server').AuthSession | null;
  }
}
