// Matemática pura del zoom + pan del visor. Transform con origen en el centro;
// el translate se limita al overflow para que la imagen no se pierda de vista.
export interface Estado {
  scale: number;
  tx: number;
  ty: number;
}

export interface Punto {
  x: number;
  y: number;
}

export interface Medida {
  cx: number;
  cy: number;
  w: number;
  h: number;
}

export interface Toque extends Punto {
  t: number;
}

export const ESTADO_INICIAL: Estado = { scale: 1, tx: 0, ty: 0 };
export const TAP_MS = 300;
export const TAP_PX = 30;

const MIN = 1;
const MAX = 5;

export const clamp = (v: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, v));

export const dist = (a: Punto, b: Punto): number =>
  Math.hypot(a.x - b.x, a.y - b.y);

export function medidaDe(el: HTMLElement | null): Medida {
  const r = el?.getBoundingClientRect();
  if (!r) return { cx: 0, cy: 0, w: 0, h: 0 };
  return {
    cx: r.left + r.width / 2,
    cy: r.top + r.height / 2,
    w: r.width,
    h: r.height,
  };
}

// Limita el translate al overflow (mitad del alto/ancho sobrante al ampliar).
export function limita(s: Estado, m: Medida): Estado {
  const maxX = (m.w * (s.scale - 1)) / 2;
  const maxY = (m.h * (s.scale - 1)) / 2;
  return {
    scale: s.scale,
    tx: clamp(s.tx, -maxX, maxX),
    ty: clamp(s.ty, -maxY, maxY),
  };
}

// Zoom manteniendo fijo el punto `q` (relativo al centro del elemento).
export function conZoom(
  prev: Estado,
  m: Medida,
  q: Punto,
  calc: (escala: number) => number,
): Estado {
  const s2 = clamp(calc(prev.scale), MIN, MAX);
  const k = s2 / prev.scale;
  return limita(
    {
      scale: s2,
      tx: q.x * (1 - k) + prev.tx * k,
      ty: q.y * (1 - k) + prev.ty * k,
    },
    m,
  );
}

// Doble tap / doble clic: alterna entre tamaño original y 2.5×.
export function alternado(
  prev: Estado,
  m: Medida,
  clientX: number,
  clientY: number,
): Estado {
  if (prev.scale > 1) return { ...ESTADO_INICIAL };
  return limita(
    {
      scale: 2.5,
      tx: (clientX - m.cx) * -1.5,
      ty: (clientY - m.cy) * -1.5,
    },
    m,
  );
}

export function arrastra(
  prev: Estado,
  m: Medida,
  dx: number,
  dy: number,
): Estado {
  return limita({ scale: prev.scale, tx: prev.tx + dx, ty: prev.ty + dy }, m);
}
