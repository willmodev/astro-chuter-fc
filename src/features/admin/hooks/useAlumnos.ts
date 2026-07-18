import { actions } from 'astro:actions';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { estaEnMora } from '@/lib/domain/cartera';

import type { EstadoCargaValor } from '../chrome/EstadoCarga';
import type { Alumno } from '../data/types';

// Contrato de la pantalla Alumnos, ahora servido por `alumnos.listar` (admin).
// Carga + error + refetch (pesimista). El filtro/búsqueda sigue en el dominio.
export interface AlumnosData {
  alumnos: Alumno[]; // orden alfabético
  total: number;
  enMora: number;
  estado: EstadoCargaValor;
  recargar: () => Promise<void>;
}

export function useAlumnos(): AlumnosData {
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [estado, setEstado] = useState<EstadoCargaValor>('cargando');

  const recargar = useCallback(async () => {
    setEstado('cargando');
    const { data, error } = await actions.alumnos.listar();
    if (error || !data || data.rol !== 'admin') {
      setEstado('error');
      return;
    }
    setAlumnos(
      [...data.alumnos].sort((a, b) => a.name.localeCompare(b.name, 'es')),
    );
    setEstado('listo');
  }, []);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  return useMemo(
    () => ({
      alumnos,
      total: alumnos.length,
      enMora: alumnos.filter(estaEnMora).length,
      estado,
      recargar,
    }),
    [alumnos, estado, recargar],
  );
}
