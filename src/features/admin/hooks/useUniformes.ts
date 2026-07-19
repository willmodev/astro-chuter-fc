import { actions } from 'astro:actions';
import { useCallback, useEffect, useState } from 'react';

import type { EstadoCargaValor } from '../chrome/EstadoCarga';
import type { UniformeAlumno } from '../data/types';

// Uniformes del admin servidos por `uniformes.listar` (2 kits por alumno con
// dinero). Carga + error + refetch pesimista, como el resto del admin (spec 11).
export interface UniformesData {
  alumnos: UniformeAlumno[];
  estado: EstadoCargaValor;
  recargar: () => Promise<void>;
}

export function useUniformes(): UniformesData {
  const [alumnos, setAlumnos] = useState<UniformeAlumno[]>([]);
  const [estado, setEstado] = useState<EstadoCargaValor>('cargando');

  const recargar = useCallback(async () => {
    setEstado('cargando');
    const { data, error } = await actions.uniformes.listar();
    if (error || !data || data.rol !== 'admin') {
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
