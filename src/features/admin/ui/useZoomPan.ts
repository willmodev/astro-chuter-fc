import {
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type WheelEvent,
} from 'react';

import {
  creaGestosPuntero,
  creaZoomDirecto,
  refsIniciales,
  type CtxGesto,
} from './gestos-zoom';
import { ESTADO_INICIAL, medidaDe, type Estado } from './zoom-pan';

// Zoom + pan sin dependencias: rueda (PC), pinch y doble tap (móvil), arrastre.
// El cálculo vive en `zoom-pan.ts` y los gestos en `gestos-zoom.ts`.
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

export function useZoomPan(): ZoomPan {
  const [st, setSt] = useState<Estado>(ESTADO_INICIAL);
  const elRef = useRef<HTMLElement | null>(null);
  const refs = useRef(refsIniciales());

  useEffect(() => {
    refs.current.scale = st.scale;
  }, [st.scale]);

  const ctx: CtxGesto = {
    refs: refs.current,
    medida: () => medidaDe(elRef.current),
    aplica: setSt,
  };
  const { alternarZoom, onWheel } = creaZoomDirecto(ctx);

  return {
    scale: st.scale,
    tx: st.tx,
    ty: st.ty,
    ref: (el) => {
      elRef.current = el;
    },
    ...creaGestosPuntero(ctx, alternarZoom),
    onWheel,
    onDoubleClick: (e) => alternarZoom(e.clientX, e.clientY),
  };
}
