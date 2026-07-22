// Vercel Blob para la imagen de la parte central (server-only). El token
// BLOB_READ_WRITE_TOKEN nunca sale del servidor. Ruta no-adivinable con
// addRandomSuffix (evita caché stale al reemplazar).
import { del, put } from '@vercel/blob';

import type { DiaEntreno } from '@/lib/domain/entrenos';

// El token se pasa explícito: en el dev de Astro/Vite las vars sin prefijo
// PUBLIC_ viven en import.meta.env, no en process.env (que es lo que lee el SDK).
const BLOB_TOKEN =
  import.meta.env?.BLOB_READ_WRITE_TOKEN ?? process.env.BLOB_READ_WRITE_TOKEN;

// Extensión real según el tipo del blob (Safari viejo exporta JPEG, no WebP).
function extensionDe(tipo: string): string {
  return tipo === 'image/jpeg' ? 'jpg' : 'webp';
}

// Sube la imagen y devuelve su URL pública. `public`: las URLs son
// no-adivinables y solo llegan a usuarios logueados (mismo trade-off del mock).
export async function subirImagen(
  entrenadorId: string,
  semanaInicio: string,
  dia: DiaEntreno,
  imagen: File,
): Promise<string> {
  const ext = extensionDe(imagen.type);
  const ruta = `entrenos/${entrenadorId}/${semanaInicio}-${dia}.${ext}`;
  const { url } = await put(ruta, imagen, {
    access: 'public',
    addRandomSuffix: true,
    contentType: imagen.type,
    token: BLOB_TOKEN,
  });
  return url;
}

// Borra el blob anterior best-effort: un fallo no rompe el registro de la
// sesión (huérfano ocasional tolerable; se loguea).
export async function borrarBlob(url: string): Promise<void> {
  try {
    await del(url, { token: BLOB_TOKEN });
  } catch (e) {
    console.error('No se pudo borrar el blob anterior:', url, e);
  }
}
