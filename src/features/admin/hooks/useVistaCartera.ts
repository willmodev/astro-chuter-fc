import { useCallback, useState } from 'react';

export type VistaCartera = 'tarjetas' | 'matriz';

const KEY = 'chuter.admin.carteraVista';

// Lectura defensiva: cualquier valor ausente o inválido cae a 'tarjetas'.
function leerVista(): VistaCartera {
  return window.localStorage.getItem(KEY) === 'matriz' ? 'matriz' : 'tarjetas';
}

// Preferencia de vista (Tarjetas/Matriz) persistida en localStorage (R7.2).
export function useVistaCartera(): [VistaCartera, (vista: VistaCartera) => void] {
  const [vista, setVistaState] = useState<VistaCartera>(leerVista);

  const setVista = useCallback((nueva: VistaCartera): void => {
    window.localStorage.setItem(KEY, nueva);
    setVistaState(nueva);
  }, []);

  return [vista, setVista];
}
