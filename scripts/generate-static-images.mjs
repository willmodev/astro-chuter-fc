// Genera favicon.svg, apple-touch-icon.png y og-default.jpg desde el logo principal.
// Correr una sola vez: `node scripts/generate-static-images.mjs`
import { readFile, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import sharp from 'sharp';

const root = fileURLToPath(new URL('..', import.meta.url));
const logoPath = path.join(root, 'public', 'images', 'chuter-logo.svg');
const publicDir = path.join(root, 'public');

const NAVY = '#1B3A6B';
const NAVY_DEEP = '#0F2647';
const GOLD = '#F5C842';

// Logo vectorial → PNG cuadrado transparente del tamaño pedido.
async function logoPng(logoSvg, densidad, lado) {
  return sharp(logoSvg, { density: densidad })
    .resize(lado, lado, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
}

// favicon.svg → copia directa del logo (los browsers modernos lo soportan)
async function generarFavicon() {
  await copyFile(logoPath, path.join(publicDir, 'favicon.svg'));
  console.log('OK favicon.svg');
}

// apple-touch-icon.png 180x180 con padding y fondo navy redondeado
async function generarAppleTouchIcon(logoSvg) {
  await sharp({
    create: {
      width: 180,
      height: 180,
      channels: 4,
      background: NAVY,
    },
  })
    .composite([{ input: await logoPng(logoSvg, 300, 160), gravity: 'center' }])
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('OK apple-touch-icon.png');
}

// Lienzo 1200x630: fondo navy gradient + tagline + INDER badge.
function lienzoOg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${NAVY}"/>
      <stop offset="100%" stop-color="${NAVY_DEEP}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.2" cy="0.4" r="0.6">
      <stop offset="0%" stop-color="${GOLD}" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="${GOLD}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#glow)"/>
  <!-- decoración: arcos de cancha estilizados -->
  <circle cx="-80" cy="630" r="280" fill="none" stroke="${GOLD}" stroke-opacity="0.12" stroke-width="2"/>
  <circle cx="1280" cy="0" r="320" fill="none" stroke="${GOLD}" stroke-opacity="0.1" stroke-width="2"/>
  <!-- texto principal -->
  <text x="430" y="280" font-family="Bebas Neue, Impact, sans-serif" font-size="92" fill="white" letter-spacing="2">CHUTER FC</text>
  <text x="432" y="338" font-family="Inter, Arial, sans-serif" font-size="32" fill="${GOLD}" font-weight="700">Escuela de Fútbol Infantil</text>
  <text x="432" y="384" font-family="Inter, Arial, sans-serif" font-size="26" fill="white" fill-opacity="0.7">Los Algarrobillos · Cancha de la Provincia</text>
  <!-- badge INDER -->
  <rect x="430" y="430" width="240" height="52" rx="26" fill="${GOLD}" fill-opacity="0.15" stroke="${GOLD}" stroke-opacity="0.4" stroke-width="1.5"/>
  <text x="465" y="463" font-family="Inter, Arial, sans-serif" font-size="20" fill="${GOLD}" font-weight="700">✓ Avalado por INDER</text>
  <!-- tag inscripción gratis -->
  <rect x="430" y="500" width="280" height="52" rx="26" fill="${GOLD}"/>
  <text x="465" y="533" font-family="Inter, Arial, sans-serif" font-size="22" fill="${NAVY_DEEP}" font-weight="800">¡INSCRIPCIÓN GRATIS!</text>
</svg>`;
}

// og-default.jpg 1200x630: lienzo + logo a la izquierda.
async function generarOgImage(logoSvg) {
  await sharp(Buffer.from(lienzoOg()))
    .composite([
      { input: await logoPng(logoSvg, 400, 320), left: 70, top: 155 },
    ])
    .jpeg({ quality: 88, mozjpeg: true })
    .toFile(path.join(publicDir, 'og-default.jpg'));
  console.log('OK og-default.jpg');
}

async function main() {
  const logoSvg = await readFile(logoPath);
  await generarFavicon();
  await generarAppleTouchIcon(logoSvg);
  await generarOgImage(logoSvg);
  console.log('\n✓ Imágenes estáticas generadas en /public');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
