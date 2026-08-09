import { actions } from 'astro:actions';
import { useEffect, useMemo, useState } from 'react';

import { semanasVisibles, type Semana } from '@/lib/domain/entrenos';

import { semanas } from '../data/mock';

/**
 * Semanas que pinta el selector. Arranca solo con la actual y las futuras y
 * suma las pasadas con historial cuando responde la Action: crecer no molesta,
 * encoger sí. Si la consulta falla, se queda con la ventana mínima.
 */
export function useSemanasVisibles(seleccionada: string): readonly Semana[] {
  const [conRegistro, setConRegistro] = useState<readonly string[]>([]);

  useEffect(() => {
    let vigente = true;
    const cargar = async () => {
      const { data } = await actions.entrenos.semanasConDatos({});
      if (vigente && data) setConRegistro(data.semanas);
    };
    void cargar();
    return () => {
      vigente = false;
    };
  }, []);

  return useMemo(
    () => semanasVisibles(semanas, conRegistro, seleccionada),
    [conRegistro, seleccionada],
  );
}
