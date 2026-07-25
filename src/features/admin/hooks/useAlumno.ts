import { actions } from 'astro:actions';
import { useCallback, useEffect, useState } from 'react';

import type { EstadoCargaValor } from '../chrome/EstadoCarga';
import type { Alumno } from '../data/types';

// Ficha/Pago: un alumno servido por `alumnos.listar` (admin). `alumno` es
// `undefined` si no existe (la pantalla muestra su propio estado). Refetch tras
// mutación (pesimista) al re-montar la vista. Pide también los retirados: su
// ficha sigue consultable y desde ahí se los reactiva (spec 14).
export interface AlumnoData {
  alumno: Alumno | undefined;
  estado: EstadoCargaValor;
  recargar: () => Promise<void>;
  cambiarActivo: (activo: boolean) => Promise<string | null>;
}

export function useAlumno(id: number): AlumnoData {
  const [alumno, setAlumno] = useState<Alumno | undefined>(undefined);
  const [estado, setEstado] = useState<EstadoCargaValor>('cargando');

  const recargar = useCallback(async () => {
    setEstado('cargando');
    const { data, error } = await actions.alumnos.listar({
      incluirRetirados: true,
    });
    if (error || !data || data.rol !== 'admin') {
      setEstado('error');
      return;
    }
    setAlumno(data.alumnos.find((a) => a.id === id));
    setEstado('listo');
  }, [id]);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  // Devuelve `null` si salió bien, o el mensaje de error (patrón del repo).
  const cambiarActivo = useCallback<AlumnoData['cambiarActivo']>(
    async (activo) => {
      const { error } = await actions.alumnos.cambiarActivo({ id, activo });
      if (error) return error.message;
      await recargar();
      return null;
    },
    [id, recargar],
  );

  return { alumno, estado, recargar, cambiarActivo };
}
