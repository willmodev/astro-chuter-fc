import { actions } from 'astro:actions';
import { useCallback, useEffect, useState } from 'react';

import type { EstadoCargaValor } from '../chrome/EstadoCarga';
import type { AlumnoPlantel } from '../data/types';

// Roster real del entrenador servido por `alumnos.listar` (rol entrenador →
// AlumnoPlantel[], SIN dinero). Fuente única para plantel, ficha readOnly y el
// roster de asistencia de entrenos (que sigue en mock para plan/sesión).
export interface AlumnosPlantelData {
  alumnos: AlumnoPlantel[];
  estado: EstadoCargaValor;
  recargar: () => Promise<void>;
}

export function useAlumnosPlantel(): AlumnosPlantelData {
  const [alumnos, setAlumnos] = useState<AlumnoPlantel[]>([]);
  const [estado, setEstado] = useState<EstadoCargaValor>('cargando');

  const recargar = useCallback(async () => {
    setEstado('cargando');
    const { data, error } = await actions.alumnos.listar();
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
