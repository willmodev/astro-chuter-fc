import { useState, useEffect, useCallback, useMemo } from 'react';

import MotionProvider from '@/components/motion/MotionProvider';

import GallerySala from './gallery/GallerySala';
import GalleryDialog from './gallery/GalleryDialog';

import type { SalaRenderizada } from './gallery/types';

interface GalleryLightboxProps {
  salas: SalaRenderizada[];
}

function GalleryInner({ salas }: GalleryLightboxProps) {
  const [abierto, setAbierto] = useState(false);
  const [actual, setActual] = useState(0);

  // El recorrido es continuo: las flechas cruzan de una sala a la siguiente.
  const piezas = useMemo(() => salas.flatMap((sala) => sala.piezas), [salas]);

  const anterior = useCallback(() => {
    setActual((i) => (i - 1 + piezas.length) % piezas.length);
  }, [piezas.length]);

  const siguiente = useCallback(() => {
    setActual((i) => (i + 1) % piezas.length);
  }, [piezas.length]);

  useEffect(() => {
    if (!abierto) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') anterior();
      if (e.key === 'ArrowRight') siguiente();
    };
    window.addEventListener('keydown', handler);
    return () => {
      window.removeEventListener('keydown', handler);
    };
  }, [abierto, anterior, siguiente]);

  const abrirEn = useCallback((indiceGlobal: number) => {
    setActual(indiceGlobal);
    setAbierto(true);
  }, []);

  return (
    <>
      <div className="space-y-14 md:space-y-20">
        {salas.map((sala) => (
          <GallerySala key={sala.numero} sala={sala} onAbrir={abrirEn} />
        ))}
      </div>

      <GalleryDialog
        piezas={piezas}
        actual={actual}
        abierto={abierto}
        onAbiertoChange={setAbierto}
        onAnterior={anterior}
        onSiguiente={siguiente}
      />
    </>
  );
}

export default function GalleryLightbox(props: GalleryLightboxProps) {
  return (
    <MotionProvider>
      <GalleryInner {...props} />
    </MotionProvider>
  );
}
