import { useEffect, useRef, type MouseEvent, type RefObject } from 'react';

// Base común de los modales del admin sobre <dialog> nativo: se abre como
// modal al montar (showModal → foco, Esc y top layer los maneja el
// navegador) y cierra al clickar el backdrop — un click cuyo target es el
// propio <dialog> solo puede ocurrir fuera de su contenido.
export function useModalDialog(onClose: () => void): {
  ref: RefObject<HTMLDialogElement | null>;
  alClickBackdrop: (e: MouseEvent<HTMLDialogElement>) => void;
} {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  const alClickBackdrop = (e: MouseEvent<HTMLDialogElement>): void => {
    if (e.target === ref.current) onClose();
  };

  return { ref, alClickBackdrop };
}
