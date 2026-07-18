import { useEffect, useRef, useState, type PointerEvent, type WheelEvent } from 'react';

// Zoom + pan sin dependencias: rueda (PC), pinch y doble tap (móvil), arrastre.
// Transform con origen en el centro; el translate se limita al overflow para
// que la imagen no se pierda de vista.
const MIN = 1;
const MAX = 5;
const TAP_MS = 300;
const TAP_PX = 30;

interface Estado {
  scale: number;
  tx: number;
  ty: number;
}

interface Punto {
  x: number;
  y: number;
}

export interface ZoomPan {
  scale: number;
  tx: number;
  ty: number;
  ref: (el: HTMLElement | null) => void;
  onPointerDown: (e: PointerEvent) => void;
  onPointerMove: (e: PointerEvent) => void;
  onPointerUp: (e: PointerEvent) => void;
  onWheel: (e: WheelEvent) => void;
  onDoubleClick: (e: { clientX: number; clientY: number }) => void;
}

const clamp = (v: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, v));

const dist = (a: Punto, b: Punto): number => Math.hypot(a.x - b.x, a.y - b.y);

export function useZoomPan(): ZoomPan {
  const [st, setSt] = useState<Estado>({ scale: 1, tx: 0, ty: 0 });
  const elRef = useRef<HTMLElement | null>(null);
  const pts = useRef(new Map<number, Punto>());
  const pinch = useRef<{ dist: number; scale: number } | null>(null);
  const start = useRef<Punto & { t: number } | null>(null);
  const lastTap = useRef<Punto & { t: number } | null>(null);
  const scaleRef = useRef(1);

  useEffect(() => {
    scaleRef.current = st.scale;
  }, [st.scale]);

  const centro = () => {
    const r = elRef.current?.getBoundingClientRect();
    if (!r) return { cx: 0, cy: 0, w: 0, h: 0 };
    return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, w: r.width, h: r.height };
  };

  // Limita el translate al overflow (mitad del alto/ancho sobrante al ampliar).
  const limita = (s: Estado): Estado => {
    const { w, h } = centro();
    const maxX = (w * (s.scale - 1)) / 2;
    const maxY = (h * (s.scale - 1)) / 2;
    return { scale: s.scale, tx: clamp(s.tx, -maxX, maxX), ty: clamp(s.ty, -maxY, maxY) };
  };

  // Zoom manteniendo fijo el punto (qx, qy) relativo al centro.
  const zoomA = (qx: number, qy: number, calc: (prev: number) => number): void => {
    setSt((p) => {
      const s2 = clamp(calc(p.scale), MIN, MAX);
      const k = s2 / p.scale;
      return limita({ scale: s2, tx: qx * (1 - k) + p.tx * k, ty: qy * (1 - k) + p.ty * k });
    });
  };

  const alternarZoom = (clientX: number, clientY: number): void => {
    const { cx, cy } = centro();
    setSt((p) =>
      p.scale > 1
        ? { scale: 1, tx: 0, ty: 0 }
        : limita({ scale: 2.5, tx: (clientX - cx) * -1.5, ty: (clientY - cy) * -1.5 }),
    );
  };

  const onWheel = (e: WheelEvent): void => {
    e.preventDefault();
    const { cx, cy } = centro();
    const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
    zoomA(e.clientX - cx, e.clientY - cy, (s) => s * factor);
  };

  const onPointerDown = (e: PointerEvent): void => {
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pts.current.size === 2) {
      const [a, b] = [...pts.current.values()];
      pinch.current = { dist: dist(a, b), scale: scaleRef.current };
      start.current = null;
    } else {
      start.current = { x: e.clientX, y: e.clientY, t: Date.now() };
    }
  };

  const onPointerMove = (e: PointerEvent): void => {
    const prev = pts.current.get(e.pointerId);
    if (!prev) return;
    const cur = { x: e.clientX, y: e.clientY };
    pts.current.set(e.pointerId, cur);
    if (pts.current.size === 2 && pinch.current) {
      const [a, b] = [...pts.current.values()];
      const { cx, cy } = centro();
      const base = pinch.current;
      zoomA((a.x + b.x) / 2 - cx, (a.y + b.y) / 2 - cy, () => base.scale * (dist(a, b) / base.dist));
    } else if (pts.current.size === 1 && scaleRef.current > 1) {
      const dx = cur.x - prev.x;
      const dy = cur.y - prev.y;
      setSt((p) => limita({ scale: p.scale, tx: p.tx + dx, ty: p.ty + dy }));
    }
  };

  const onPointerUp = (e: PointerEvent): void => {
    pts.current.delete(e.pointerId);
    if (pts.current.size < 2) pinch.current = null;
    // Solo en touch: en mouse el doble clic lo maneja `onDoubleClick` (si no,
    // ambos se disparan y el zoom se alterna dos veces, cancelándose).
    if (e.pointerType === 'touch') detectarTap(e.clientX, e.clientY);
  };

  // Doble tap táctil (el gesto principal en móvil): dos taps rápidos y cercanos.
  const detectarTap = (x: number, y: number): void => {
    const s = start.current;
    start.current = null;
    if (!s || dist({ x, y }, s) > 10 || Date.now() - s.t > TAP_MS) return;
    const lt = lastTap.current;
    if (lt && Date.now() - lt.t < TAP_MS && dist({ x, y }, lt) < TAP_PX) {
      alternarZoom(x, y);
      lastTap.current = null;
    } else {
      lastTap.current = { x, y, t: Date.now() };
    }
  };

  return {
    scale: st.scale,
    tx: st.tx,
    ty: st.ty,
    ref: (el) => {
      elRef.current = el;
    },
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onWheel,
    onDoubleClick: (e) => alternarZoom(e.clientX, e.clientY),
  };
}
