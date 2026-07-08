import { useCallback, useEffect, useState } from 'react';

import { parseRuta, rutaAPath } from './rutas';
import type { RutaAdmin } from './types';

// Estado de `history` (no ensucia la URL): hoy solo transporta el mes tocado
// hacia Registrar pago, para preseleccionarlo sin que viaje en el path.
interface EstadoNavegacion {
  mes?: number;
}

function esEstadoNavegacion(valor: unknown): valor is EstadoNavegacion {
  return typeof valor === 'object' && valor !== null;
}

// Mini-router de la isla (client:only, `window` siempre existe). La URL es
// la única fuente de verdad de la vista; `mes` es la única excepción y vive
// en `history.state`, así que se pierde en un deep-link directo o al
// refrescar (comportamiento intencional, ver spec 06).
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

    const alCambiarHistorial = (evento: PopStateEvent): void => {
      const base = parseRuta(window.location.pathname);
      const mes = esEstadoNavegacion(evento.state) ? evento.state.mes : undefined;
      setRuta(base.vista === 'pago' && mes !== undefined ? { ...base, mes } : base);
    };
    window.addEventListener('popstate', alCambiarHistorial);
    return () => window.removeEventListener('popstate', alCambiarHistorial);
  }, []);

  const navegar = useCallback((destino: RutaAdmin): void => {
    const estado: EstadoNavegacion | null =
      destino.vista === 'pago' ? { mes: destino.mes } : null;
    window.history.pushState(estado, '', rutaAPath(destino));
    setRuta(destino);
  }, []);

  return { ruta, navegar };
}
