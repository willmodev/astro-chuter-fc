import { Dialog } from 'radix-ui';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

import { m, AnimatePresence } from '@/components/motion/M';
import { ease } from '@/lib/motion';

import type { PiezaGaleria } from './types';

interface GalleryDialogProps {
  piezas: PiezaGaleria[];
  actual: number;
  abierto: boolean;
  onAbiertoChange: (abierto: boolean) => void;
  onAnterior: () => void;
  onSiguiente: () => void;
}

const NAV_BASE =
  'focus-visible:outline-brand-gold absolute top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 md:h-12 md:w-12';

export default function GalleryDialog({
  piezas,
  actual,
  abierto,
  onAbiertoChange,
  onAnterior,
  onSiguiente,
}: GalleryDialogProps) {
  const pieza = piezas[actual];

  return (
    <Dialog.Root open={abierto} onOpenChange={onAbiertoChange}>
      <AnimatePresence>
        {abierto && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <m.div
                className="fixed inset-0 z-50 bg-neutral-950/92 backdrop-blur-md"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: ease.outQuint }}
              />
            </Dialog.Overlay>

            <Dialog.Content
              className="fixed inset-0 z-50 flex items-center justify-center p-4 focus:outline-none"
              aria-describedby={undefined}
              asChild
            >
              <m.div
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.32, ease: ease.outExpo }}
              >
                <Dialog.Title className="sr-only">
                  Galería de fotos — imagen {actual + 1} de {piezas.length}
                </Dialog.Title>

                <div className="relative flex max-h-full max-w-5xl flex-col items-center gap-4">
                  <AnimatePresence mode="wait" initial={false}>
                    <m.img
                      key={actual}
                      src={pieza.src}
                      alt={pieza.alt}
                      className="max-h-[78vh] max-w-full rounded-xl object-contain shadow-2xl"
                      initial={{ opacity: 0, x: 24 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -24 }}
                      transition={{ duration: 0.28, ease: ease.outQuint }}
                    />
                  </AnimatePresence>

                  <div className="text-center">
                    <p className="font-mono text-sm tracking-wide text-white/85">
                      {pieza.cedula}
                    </p>
                    <p className="mt-1 text-xs text-white/45">{pieza.alt}</p>
                  </div>

                  <div className="font-mono text-xs text-white/40">
                    {actual + 1} / {piezas.length}
                  </div>
                </div>

                <Dialog.Close
                  aria-label="Cerrar galería"
                  className="focus-visible:outline-brand-gold absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  <X size={20} strokeWidth={1.5} aria-hidden="true" />
                </Dialog.Close>

                {piezas.length > 1 && (
                  <>
                    <button
                      onClick={onAnterior}
                      aria-label="Imagen anterior"
                      className={`${NAV_BASE} left-2 md:left-4`}
                    >
                      <ChevronLeft
                        size={20}
                        strokeWidth={1.5}
                        aria-hidden="true"
                      />
                    </button>
                    <button
                      onClick={onSiguiente}
                      aria-label="Imagen siguiente"
                      className={`${NAV_BASE} right-2 md:right-4`}
                    >
                      <ChevronRight
                        size={20}
                        strokeWidth={1.5}
                        aria-hidden="true"
                      />
                    </button>
                  </>
                )}
              </m.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
