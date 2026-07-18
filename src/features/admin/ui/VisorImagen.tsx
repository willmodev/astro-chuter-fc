import { useEffect, useRef, type WheelEvent } from 'react';
import { createPortal } from 'react-dom';

import { Icon } from '../chrome/Icon';
import { useZoomPan } from './useZoomPan';

// Visor a pantalla completa de la imagen de la parte central (lightbox propio,
// sin dependencias). Zoom con rueda/pinch/doble tap, arrastre para desplazar y
// cierre con X, Escape o tap en el fondo. Es estado local (no ruta): el
// historial del navegador no lo ve, así atrás/adelante siguen funcionando.
interface Props {
  src: string;
  onClose: () => void;
}

export function VisorImagen({ src, onClose }: Readonly<Props>) {
  const zp = useZoomPan();
  const zpRef = useRef(zp);
  zpRef.current = zp;
  const contRef = useRef<HTMLDivElement | null>(null);

  // Cierre con Escape + bloqueo del scroll del body mientras el visor vive.
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  // Rueda con listener nativo no pasivo: permite preventDefault del scroll.
  useEffect(() => {
    const el = contRef.current;
    if (el === null) return;
    const onWheelNative = (e: globalThis.WheelEvent): void =>
      zpRef.current.onWheel(e as unknown as WheelEvent);
    el.addEventListener('wheel', onWheelNative, { passive: false });
    return () => el.removeEventListener('wheel', onWheelNative);
  }, []);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2147483000,
        background: 'rgba(0,0,0,.92)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        touchAction: 'none',
      }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar visor"
        style={{
          position: 'absolute',
          top: 14,
          right: 14,
          width: 42,
          height: 42,
          borderRadius: '50%',
          border: 'none',
          background: 'rgba(255,255,255,.14)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        <Icon name="x" size={22} />
      </button>

      <div
        ref={(el) => {
          contRef.current = el;
          zp.ref(el);
        }}
        onPointerDown={zp.onPointerDown}
        onPointerMove={zp.onPointerMove}
        onPointerUp={zp.onPointerUp}
        onPointerCancel={zp.onPointerUp}
        onDoubleClick={zp.onDoubleClick}
        style={{
          maxWidth: '94vw',
          maxHeight: '92vh',
          touchAction: 'none',
          cursor: zp.scale > 1 ? 'grab' : 'zoom-in',
        }}
      >
        <img
          src={src}
          alt="Planeación de la parte central"
          draggable={false}
          style={{
            display: 'block',
            maxWidth: '94vw',
            maxHeight: '92vh',
            objectFit: 'contain',
            transform: `translate(${zp.tx}px, ${zp.ty}px) scale(${zp.scale})`,
            transformOrigin: 'center',
            transition: 'transform .04s linear',
            userSelect: 'none',
            WebkitUserSelect: 'none',
          }}
        />
      </div>
    </div>,
    document.body,
  );
}
