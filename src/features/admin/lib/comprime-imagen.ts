// Compresión de la imagen de la parte central en cliente, sin dependencias:
// canvas nativo → redimensiona a máx 1280px (lado mayor) → WebP ~0.8, con
// fallback a JPEG si el navegador no exporta WebP (Safari < 16).
const MAX_LADO = 1280;
const CALIDAD = 0.8;

// Solo reduce, nunca agranda una imagen ya pequeña.
function escala(w: number, h: number): { width: number; height: number } {
  const mayor = Math.max(w, h);
  if (mayor <= MAX_LADO) return { width: w, height: h };
  const factor = MAX_LADO / mayor;
  return { width: Math.round(w * factor), height: Math.round(h * factor) };
}

function aBlob(canvas: HTMLCanvasElement, tipo: string): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, tipo, CALIDAD));
}

export async function comprimeImagen(file: File): Promise<Blob> {
  if (!file.type.startsWith('image/')) {
    throw new Error('El archivo debe ser una imagen.');
  }
  const bitmap = await createImageBitmap(file);
  const { width, height } = escala(bitmap.width, bitmap.height);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo procesar la imagen.');
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  // Preferimos WebP; si el navegador no lo soporta, `toBlob` ignora el tipo y
  // devuelve otro formato → reintentamos como JPEG (aceptado por el servidor).
  const webp = await aBlob(canvas, 'image/webp');
  if (webp?.type === 'image/webp') return webp;
  const jpeg = await aBlob(canvas, 'image/jpeg');
  if (jpeg) return jpeg;
  throw new Error('No se pudo comprimir la imagen.');
}
