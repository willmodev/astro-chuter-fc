// Optimiza las fotos que envía el cliente antes de versionarlas en src/assets.
// El objetivo NO es comprimir al máximo: es no versionar píxeles que nadie va a
// ver, y gastar ese presupuesto en calidad. `<Image>` de Astro hace el resto en
// build (variantes WebP/AVIF responsivas).
//
//   node scripts/optimizar-fotos-equipo.mjs         → DRY RUN (no escribe)
//   node scripts/optimizar-fotos-equipo.mjs --yes   → escribe
import { mkdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import sharp from 'sharp';

const COMMIT = process.argv.includes('--yes');
const root = fileURLToPath(new URL('..', import.meta.url));
const ORIGEN = 'C:/Users/USUARIO/Documents/Docs/Camilo/nuevas fotos';

// Avatar de 112 px CSS a DPR 3 = 336 px; 640 deja margen para rediseños.
const LADO_RETRATO = 640;

// `recorte`: banda a extraer del original, en píxeles. Se recorta acá y no con
// `object-cover` en CSS para no descargar píxeles que el layout va a descartar
// — así el mismo peso compra más detalle en la zona que sí se ve.
//
// `offsetY`: cuánto bajar el cuadrado del retrato. Solo hace falta cuando el
// original no llega en 3:4. Se descartó `sharp.strategy.attention`: en estas
// fotos encuadra el torso, no la cara.
const TRABAJOS = [
  // — Retratos para las tarjetas de la sección Equipo —
  { archivo: 'ALIRIO ANDRADE.jpeg', destino: 'formadores/alirio-andrade.jpg' },
  { archivo: 'CAMILO ANDRADE.jpeg', destino: 'formadores/camilo-andrade.jpg' },
  {
    archivo: 'SHADAY CALDERON.jpeg',
    destino: 'formadores/ebed-shaday-calderon.jpg',
    // Original 806x1600 (vertical de story): desde el borde le corta el mentón.
    offsetY: 200,
  },
  { archivo: 'JORGE CARRILLO.jpeg', destino: 'formadores/jorge-carrillo.jpg' },
  { archivo: 'OSCAR CARDENAS.jpeg', destino: 'formadores/oscar-cardenas.jpg' },
  {
    archivo: 'CRISTIAN MAESTRE.jpeg',
    destino: 'formadores/cristian-maestre.jpg',
  },

  // — Foto de apertura de la sección Equipo —
  {
    archivo: 'img13.jpeg',
    destino: 'club/equipo-cuerpo-tecnico.jpg',
    // 3:2 desde la banda donde están las 6 personas. El original es 3:4 y el
    // contenedor es panorámico: sin este recorte, más de la mitad del archivo
    // eran techo y piso que el CSS tiraba.
    recorte: { top: 560, ancho: 1200, alto: 800 },
    // q97: el original ya viene comprimido por WhatsApp y Astro lo reencodea a
    // WebP encima. Recomprimir fuerte acá es una tercera pérdida gratuita.
    calidad: 97,
  },

  // — Fondo del hero —
  {
    archivo: 'img11.jpeg',
    destino: 'club/hero-charla-formadores.jpg',
    // 4:3 desde la banda donde entran las caras de los tres formadores y el
    // círculo completo de niños. El original es 3:4 y el hero es panorámico:
    // sin este recorte, la mitad del archivo era malla y piso.
    recorte: { top: 460, ancho: 1200, alto: 900 },
    // q100: el cliente pidió el hero lo más nítido posible. El original ya
    // viene comprimido por WhatsApp; este recorte no le suma una segunda
    // pérdida encima. El peso no importa: es el insumo, no lo que se sirve.
    calidad: 100,
    // Unsharp suave. La fuente mide 1200 px de ancho y el hero la amplía en
    // pantallas grandes, así que se recupera el micro-contraste que el JPEG de
    // WhatsApp aplanó. sigma bajo a propósito: más agresivo mete halos.
    nitidez: { sigma: 0.7, m1: 0.4, m2: 2.2 },
  },

  // — Fondo del hero en móvil (viewport vertical, spec del 2026-08-26) —
  {
    archivo: 'img17.jpeg',
    destino: 'club/hero-pareja-uniformes.jpg',
    // Sin recorte: el frame vertical 1200x1600 ES el encuadre para móvil;
    // `object-cover` solo pela un poco los bordes laterales.
    calidad: 100,
    nitidez: { sigma: 0.7, m1: 0.4, m2: 2.2 },
  },

  // — Foto para la galería (sala 02 · En juego) —
  {
    archivo: 'img11.jpeg',
    destino: 'club/juego-charla-partido.jpg',
    // Sin recorte: la galería la sirve completa. El lightbox pide 1080 de
    // ancho, así que los 1200 del original quedan tal cual.
    calidad: 82,
  },
];

const kb = (bytes) => `${String(Math.round(bytes / 1024))} KB`;

// Cuadrado del ancho completo, bajado `offsetY` píxeles desde el borde superior.
// En una foto vertical de una persona de pie la cara vive en el tercio superior,
// así que arrancar arriba es determinista y no corta caras.
async function canalRetrato(origen, offsetY) {
  const img = sharp(origen).rotate();
  const { width = 0, height = 0 } = await img.metadata();
  const lado = Math.min(width, height);
  return (
    img
      .extract({
        left: Math.round((width - lado) / 2),
        top: Math.min(offsetY, height - lado),
        width: lado,
        height: lado,
      })
      .resize(LADO_RETRATO, LADO_RETRATO)
      // q92: este archivo es el insumo de Astro, no lo que se sirve. Comprimirlo
      // fuerte acá solo le quita detalle al WebP que sí llega al navegador.
      .jpeg({ quality: 92, mozjpeg: true })
  );
}

function canalEscena(origen, recorte, calidad, nitidez) {
  const img = sharp(origen).rotate();
  const recortada = recorte
    ? img.extract({
        left: 0,
        top: recorte.top,
        width: recorte.ancho,
        height: recorte.alto,
      })
    : img;
  const realzada = nitidez ? recortada.sharpen(nitidez) : recortada;
  return realzada.jpeg({ quality: calidad, mozjpeg: true });
}

async function procesar(trabajo) {
  const { archivo, destino: rel, offsetY, recorte, calidad, nitidez } = trabajo;
  const origen = path.join(ORIGEN, archivo);
  const esRetrato = calidad === undefined;
  const canal = esRetrato
    ? await canalRetrato(origen, offsetY ?? 0)
    : canalEscena(origen, recorte, calidad, nitidez);

  const antes = (await stat(origen)).size;
  const buffer = await canal.toBuffer();
  const { width = 0, height = 0 } = await sharp(buffer).metadata();

  console.log(
    `${archivo.padEnd(24)} → ${rel.padEnd(38)} ` +
      `${String(width)}x${String(height)}  ${kb(antes)} → ${kb(buffer.length)}`,
  );

  if (COMMIT) {
    const destino = path.join(root, 'src', 'assets', 'images', rel);
    await mkdir(path.dirname(destino), { recursive: true });
    await sharp(buffer).toFile(destino);
  }
}

console.log('');
for (const trabajo of TRABAJOS) {
  await procesar(trabajo);
}

console.log(
  COMMIT
    ? `\n✓ ${String(TRABAJOS.length)} imágenes escritas en src/assets/images/\n`
    : '\n(DRY RUN) nada escrito. Usá --yes.\n',
);
