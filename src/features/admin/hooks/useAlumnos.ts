import { actions } from 'astro:actions';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { soloActivos } from '@/lib/domain/alumnos';
import { estaEnMora } from '@/lib/domain/cartera';

import type { EstadoCargaValor } from '../chrome/EstadoCarga';
import type { Alumno } from '../data/types';

// Contrato de la pantalla Alumnos, ahora servido por `alumnos.listar` (admin).
// Carga + error + refetch (pesimista). El filtro/búsqueda sigue en el dominio.
// `incluirRetirados` decide si el server manda también los retirados; `activos`
// es la sublista vigente y los contadores se calculan siempre sobre ella.
export interface AlumnosData {
  alumnos: Alumno[]; // orden alfabético
  activos: Alumno[]; // los mismos, sin retirados
  total: number;
  enMora: number;
  estado: EstadoCargaValor;
  recargar: () => Promise<void>;
}

export function useAlumnos(incluirRetirados = false): AlumnosData {
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [estado, setEstado] = useState<EstadoCargaValor>('cargando');

  const recargar = useCallback(async () => {
    setEstado('cargando');
    const { data, error } = await actions.alumnos.listar({ incluirRetirados });
    if (error || !data || data.rol !== 'admin') {
      setEstado('error');
      return;
    }
    setAlumnos(
      [...data.alumnos].sort((a, b) => a.name.localeCompare(b.name, 'es')),
    );
    setEstado('listo');
  }, [incluirRetirados]);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  return useMemo(() => {
    const activos = soloActivos(alumnos);
    return {
      alumnos,
      activos,
      total: activos.length,
      enMora: activos.filter(estaEnMora).length,
      estado,
      recargar,
    };
  }, [alumnos, estado, recargar]);
}
