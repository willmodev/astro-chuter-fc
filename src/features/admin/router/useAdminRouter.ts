import { useCallback, useEffect, useState } from 'react';

import { parseRuta, rutaAPath } from './rutas';
import type { RutaAdmin } from './types';

// Mini-router de la isla (client:only, `window` siempre existe). La URL es
// la única fuente de verdad: `ruta` se deriva de `location.pathname`, se
// navega con pushState y popstate cubre atrás/adelante del navegador.
export function useAdminRouter(): {
  ruta: RutaAdmin;
  navegar: (destino: RutaAdmin) => void;
} {
  const [ruta, setRuta] = useState<RutaAdmin>(() =>
    parseRuta(window.location.pathname),
  );

  useEffect(() => {
    // Normaliza URLs no canónicas (/admin/xyz → /admin) sin sumar historial.
    const canonico = rutaAPath(parseRuta(window.location.pathname));
    if (window.location.pathname !== canonico) {
      window.history.replaceState(null, '', canonico);
    }

    const alCambiarHistorial = (): void => {
      setRuta(parseRuta(window.location.pathname));
    };
    window.addEventListener('popstate', alCambiarHistorial);
    return () => window.removeEventListener('popstate', alCambiarHistorial);
  }, []);

  const navegar = useCallback((destino: RutaAdmin): void => {
    window.history.pushState(null, '', rutaAPath(destino));
    setRuta(destino);
  }, []);

  return { ruta, navegar };
}
