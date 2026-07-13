import { useCallback, useEffect, useState } from 'react';

import { aplicarGate } from './gate';
import { parseRuta, rutaAPath } from './rutas';
import type { RutaAdmin } from './types';
import type { Rol } from '@/lib/domain/usuarios';

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
// refrescar (comportamiento intencional, ver spec 06). Toda ruta pasa por el
// gate por rol (spec 09): una vista prohibida cae a la home del rol.
export function useAdminRouter(role: Rol): {
  ruta: RutaAdmin;
  navegar: (destino: RutaAdmin) => void;
  volver: () => void;
} {
  const [ruta, setRuta] = useState<RutaAdmin>(() =>
    aplicarGate(parseRuta(window.location.pathname), role),
  );

  useEffect(() => {
    // Normaliza URLs no canónicas o prohibidas por rol (/admin/cartera de un
    // entrenador → /admin/entrenos) sin sumar historial.
    const canonico = rutaAPath(
      aplicarGate(parseRuta(window.location.pathname), role),
    );
    if (window.location.pathname !== canonico) {
      window.history.replaceState(null, '', canonico);
    }

    const alCambiarHistorial = (evento: PopStateEvent): void => {
      const base = aplicarGate(parseRuta(window.location.pathname), role);
      const mes = esEstadoNavegacion(evento.state) ? evento.state.mes : undefined;
      setRuta(base.vista === 'pago' && mes !== undefined ? { ...base, mes } : base);
    };
    window.addEventListener('popstate', alCambiarHistorial);
    return () => window.removeEventListener('popstate', alCambiarHistorial);
  }, [role]);

  const navegar = useCallback(
    (destino: RutaAdmin): void => {
      const efectivo = aplicarGate(destino, role);
      const estado: EstadoNavegacion | null =
        efectivo.vista === 'pago' ? { mes: efectivo.mes } : null;
      window.history.pushState(estado, '', rutaAPath(efectivo));
      setRuta(efectivo);
    },
    [role],
  );

  // Vuelve a la ruta anterior real del historial (popstate re-sincroniza la
  // vista). Respeta de dónde vino el usuario en vez de forzar un destino fijo.
  const volver = useCallback((): void => {
    window.history.back();
  }, []);

  return { ruta, navegar, volver };
}
