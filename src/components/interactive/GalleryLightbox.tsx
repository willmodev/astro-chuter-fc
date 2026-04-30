import { useState, useEffect, useCallback } from 'react';
import { Dialog } from 'radix-ui';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import MotionProvider from '@/components/motion/MotionProvider';
import { m, AnimatePresence } from '@/components/motion/M';
import { ease } from '@/lib/motion';

interface GalleryImage {
  src: string;
  thumbnail: string;
  alt: string;
  width: number;
  height: number;
  gridClass?: string;
}

interface GalleryLightboxProps {
  images: GalleryImage[];
}

function GalleryInner({ images }: GalleryLightboxProps) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(0);

  const prev = useCallback(() => {
    setCurrent((i) => (i - 1 + images.length) % images.length);
  }, [images.length]);

  const next = useCallback(() => {
    setCurrent((i) => (i + 1) % images.length);
  }, [images.length]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, prev, next]);

  const openAt = (index: number) => {
    setCurrent(index);
    setOpen(true);
  };

  const img = images[current];

  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:auto-rows-[200px] md:gap-4 lg:auto-rows-[240px]">
        {images.map((image, index) => (
          <button
            key={index}
            onClick={() => openAt(index)}
            aria-label={`Ver imagen ${index + 1}: ${image.alt}`}
            style={{ ['--idx' as never]: index }}
            className={`reveal group relative aspect-[4/5] overflow-hidden rounded-xl bg-neutral-100 focus-visible:outline-2 focus-visible:outline-brand-gold focus-visible:outline-offset-2 md:aspect-auto md:h-full ${image.gridClass ?? ''}`}
          >
            <img
              src={image.thumbnail}
              alt={image.alt}
              loading="lazy"
              decoding="async"
              style={{ animationDelay: `${index * -1.7}s` }}
              className="thumb-ken-burns h-full w-full object-cover transition-[filter] duration-300 group-hover:brightness-110"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-navy-deep/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="absolute inset-0 flex items-center justify-center bg-brand-navy/0 opacity-0 transition-all duration-300 group-hover:bg-brand-navy/15 group-hover:opacity-100">
              <svg
                aria-hidden="true"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="1.5"
                className="drop-shadow-lg transition-transform duration-300 group-hover:scale-110"
              >
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
            </div>
          </button>
        ))}
      </div>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <AnimatePresence>
          {open && (
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
                    Galería de fotos — imagen {current + 1} de {images.length}
                  </Dialog.Title>

                  <div className="relative flex max-h-full max-w-5xl flex-col items-center gap-4">
                    <AnimatePresence mode="wait" initial={false}>
                      <m.img
                        key={current}
                        src={img.src}
                        alt={img.alt}
                        className="max-h-[80vh] max-w-full rounded-xl object-contain shadow-2xl"
                        initial={{ opacity: 0, x: 24 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -24 }}
                        transition={{ duration: 0.28, ease: ease.outQuint }}
                      />
                    </AnimatePresence>

                    <p className="text-center text-sm text-white/70">{img.alt}</p>

                    <div className="flex items-center gap-3 text-white/50 text-xs">
                      {current + 1} / {images.length}
                    </div>
                  </div>

                  <Dialog.Close
                    aria-label="Cerrar galería"
                    className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-brand-gold focus-visible:outline-offset-2"
                  >
                    <X size={20} strokeWidth={1.5} aria-hidden="true" />
                  </Dialog.Close>

                  {images.length > 1 && (
                    <>
                      <button
                        onClick={prev}
                        aria-label="Imagen anterior"
                        className="absolute left-2 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-brand-gold focus-visible:outline-offset-2 md:left-4 md:h-12 md:w-12"
                      >
                        <ChevronLeft size={20} strokeWidth={1.5} aria-hidden="true" />
                      </button>
                      <button
                        onClick={next}
                        aria-label="Imagen siguiente"
                        className="absolute right-2 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-brand-gold focus-visible:outline-offset-2 md:right-4 md:h-12 md:w-12"
                      >
                        <ChevronRight size={20} strokeWidth={1.5} aria-hidden="true" />
                      </button>
                    </>
                  )}
                </m.div>
              </Dialog.Content>
            </Dialog.Portal>
          )}
        </AnimatePresence>
      </Dialog.Root>
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
