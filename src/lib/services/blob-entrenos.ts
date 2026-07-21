// Vercel Blob para la imagen de la parte central (server-only). El token
// BLOB_READ_WRITE_TOKEN nunca sale del servidor. Ruta no-adivinable con
// addRandomSuffix (evita caché stale al reemplazar).
import { del, put } from '@vercel/blob';

import type { DiaEntreno } from '@/lib/domain/entrenos';

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
  });
  return url;
}

// Borra el blob anterior best-effort: un fallo no rompe el registro de la
// sesión (huérfano ocasional tolerable; se loguea).
export async function borrarBlob(url: string): Promise<void> {
  try {
    await del(url);
  } catch (e) {
    console.error('No se pudo borrar el blob anterior:', url, e);
  }
}
