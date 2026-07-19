import { actions } from 'astro:actions';
import { useCallback, useEffect, useState } from 'react';

import type { EstadoCargaValor } from '../chrome/EstadoCarga';
import type { UniformeAlumnoEntrenador } from '../data/types';

// Uniformes del entrenador: `uniformes.listar` en su rama de rol devuelve SOLO
// la entrega (sin montos ni estado de pago). Para la ficha readOnly del plantel.
export interface UniformesEntrenadorData {
  alumnos: UniformeAlumnoEntrenador[];
  estado: EstadoCargaValor;
  recargar: () => Promise<void>;
}

export function useUniformesEntrenador(): UniformesEntrenadorData {
  const [alumnos, setAlumnos] = useState<UniformeAlumnoEntrenador[]>([]);
  const [estado, setEstado] = useState<EstadoCargaValor>('cargando');

  const recargar = useCallback(async () => {
    setEstado('cargando');
    const { data, error } = await actions.uniformes.listar();
    if (error || !data || data.rol !== 'entrenador') {
      setEstado('error');
      return;
    }
    setAlumnos(data.alumnos);
    setEstado('listo');
  }, []);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  return { alumnos, estado, recargar };
}
