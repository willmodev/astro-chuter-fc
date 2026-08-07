import {
  alternado,
  arrastra,
  conZoom,
  dist,
  TAP_MS,
  TAP_PX,
  type Estado,
  type Medida,
  type Punto,
  type Toque,
} from './zoom-pan';

import type { PointerEvent, WheelEvent } from 'react';

// Gestos del visor sin dependencias: rueda (PC), pinch y doble tap (móvil),
// arrastre. El estado vivo del gesto es mutable (refs), no reactivo.
export interface RefsGesto {
  pts: Map<number, Punto>;
  pinch: { dist: number; scale: number } | null;
  start: Toque | null;
  lastTap: Toque | null;
  scale: number;
}

export interface CtxGesto {
  refs: RefsGesto;
  medida: () => Medida;
  aplica: (calc: (prev: Estado) => Estado) => void;
}

export function refsIniciales(): RefsGesto {
  return {
    pts: new Map<number, Punto>(),
    pinch: null,
    start: null,
    lastTap: null,
    scale: 1,
  };
}

// Doble tap táctil (el gesto principal en móvil): dos taps rápidos y cercanos.
function esDobleTap(r: RefsGesto, x: number, y: number): boolean {
  const s = r.start;
  r.start = null;
  if (!s || dist({ x, y }, s) > 10 || Date.now() - s.t > TAP_MS) return false;
  const lt = r.lastTap;
  if (lt && Date.now() - lt.t < TAP_MS && dist({ x, y }, lt) < TAP_PX) {
    r.lastTap = null;
    return true;
  }
  r.lastTap = { x, y, t: Date.now() };
  return false;
}

export function creaZoomDirecto(ctx: CtxGesto) {
  const alternarZoom = (clientX: number, clientY: number): void => {
    const m = ctx.medida();
    ctx.aplica((p) => alternado(p, m, clientX, clientY));
  };

  const onWheel = (e: WheelEvent): void => {
    e.preventDefault();
    const m = ctx.medida();
    const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
    const q = { x: e.clientX - m.cx, y: e.clientY - m.cy };
    ctx.aplica((p) => conZoom(p, m, q, (s) => s * factor));
  };

  return { alternarZoom, onWheel };
}

export function creaGestosPuntero(
  ctx: CtxGesto,
  alternarZoom: (x: number, y: number) => void,
) {
  const r = ctx.refs;

  const onPointerDown = (e: PointerEvent): void => {
    // `target` puede no ser un elemento (el tipo del DOM es `EventTarget`).
    if (e.target instanceof HTMLElement)
      e.target.setPointerCapture(e.pointerId);
    r.pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (r.pts.size === 2) {
      const [a, b] = [...r.pts.values()];
      r.pinch = { dist: dist(a, b), scale: r.scale };
      r.start = null;
    } else {
      r.start = { x: e.clientX, y: e.clientY, t: Date.now() };
    }
  };

  const onPointerMove = (e: PointerEvent): void => {
    const prev = r.pts.get(e.pointerId);
    if (!prev) return;
    const cur = { x: e.clientX, y: e.clientY };
    r.pts.set(e.pointerId, cur);
    if (r.pts.size === 2 && r.pinch) {
      const [a, b] = [...r.pts.values()];
      const base = r.pinch;
      const m = ctx.medida();
      const q = { x: (a.x + b.x) / 2 - m.cx, y: (a.y + b.y) / 2 - m.cy };
      const calc = (): number => base.scale * (dist(a, b) / base.dist);
      ctx.aplica((p) => conZoom(p, m, q, calc));
    } else if (r.pts.size === 1 && r.scale > 1) {
      const m = ctx.medida();
      ctx.aplica((p) => arrastra(p, m, cur.x - prev.x, cur.y - prev.y));
    }
  };

  const onPointerUp = (e: PointerEvent): void => {
    r.pts.delete(e.pointerId);
    if (r.pts.size < 2) r.pinch = null;
    // Solo en touch: en mouse el doble clic lo maneja `onDoubleClick` (si no,
    // ambos se disparan y el zoom se alterna dos veces, cancelándose).
    if (e.pointerType !== 'touch') return;
    if (esDobleTap(r, e.clientX, e.clientY)) alternarZoom(e.clientX, e.clientY);
  };

  return { onPointerDown, onPointerMove, onPointerUp };
}
