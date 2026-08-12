import { actions } from 'astro:actions';
import { useCallback, useEffect, useState } from 'react';

import type { PagoDetalle } from '@/lib/db/repos/pagos';
import type { Mes } from '@/lib/domain/cartera';

import type { EstadoCargaValor } from '../chrome/EstadoCarga';
import type { Alumno } from '../data/types';

// Ficha/Pago: un alumno servido por `alumnos.porId` (admin), que consulta solo
// sus datos (spec 17, DT-3). `alumno` es `undefined` si no existe (la pantalla
// muestra su propio estado). Refetch tras mutación (pesimista) al re-montar la
// vista. Incluye retirados: su ficha sigue consultable (spec 14).
export interface AlumnoData {
  alumno: Alumno | undefined;
  pagos: PagoDetalle[];
  estado: EstadoCargaValor;
  recargar: () => Promise<void>;
  cambiarActivo: (activo: boolean) => Promise<string | null>;
  anularPago: (mes: Mes, motivo: string) => Promise<string | null>;
}

export function useAlumno(id: number): AlumnoData {
  const [alumno, setAlumno] = useState<Alumno | undefined>(undefined);
  const [pagos, setPagos] = useState<PagoDetalle[]>([]);
  const [estado, setEstado] = useState<EstadoCargaValor>('cargando');

  const recargar = useCallback(async () => {
    setEstado('cargando');
    const { data, error } = await actions.alumnos.porId({ id });
    if (error) {
      setEstado('error');
      return;
    }
    setAlumno(data.alumno);
    setPagos(data.pagos);
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

  // Anula el pago de un mes y refetch (pesimista, igual que cambiarActivo).
  // El año es el en curso: la ficha solo pinta esa temporada (spec 20).
  const anularPago = useCallback<AlumnoData['anularPago']>(
    async (mes, motivo) => {
      const { error } = await actions.pagos.anular({
        alumnoId: id,
        anio: new Date().getFullYear(),
        mes,
        motivo,
      });
      if (error) return error.message;
      await recargar();
      return null;
    },
    [id, recargar],
  );

  return { alumno, pagos, estado, recargar, cambiarActivo, anularPago };
}
