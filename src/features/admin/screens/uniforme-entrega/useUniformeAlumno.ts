import { actions } from 'astro:actions';
import { useCallback, useEffect, useState } from 'react';

import { numeroOcupado, type TipoKit } from '@/lib/domain/uniformes';

import type { EstadoCargaValor } from '../../chrome/EstadoCarga';
import type { UniformeAlumno } from '../../data/types';
import { aFilas } from '../uniformes/filas';

// Gestión de uniforme de un alumno (spec 12): sirve sus dos kits desde
// `uniformes.listar` (admin) y expone las mutaciones (pesimistas: Action →
// refetch). `numeroOcupadoEn` mira TODOS los kits para la advertencia (R6).
export interface UniformeAlumnoData {
  alumno: UniformeAlumno | undefined;
  estado: EstadoCargaValor;
  recargar: () => Promise<void>;
  numeroOcupadoEn: (kit: TipoKit, numero: number) => boolean;
  registrarEntrega: (
    kit: TipoKit,
    numero: number,
    talla: string,
  ) => Promise<string | null>;
  anularEntrega: (kit: TipoKit) => Promise<string | null>;
  registrarAbono: (kit: TipoKit, montoCop: number) => Promise<string | null>;
}

export function useUniformeAlumno(alumnoId: number): UniformeAlumnoData {
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

  const numeroOcupadoEn = (kit: TipoKit, numero: number): boolean =>
    numeroOcupado(
      aFilas(alumnos).map((f) => ({
        id: f.alumnoId,
        kit: f.kit.kit,
        numero: f.kit.numero,
      })),
      kit,
      numero,
      alumnoId,
    );

  const trasMutar = async (
    correr: () => Promise<{ error?: { message: string } }>,
  ): Promise<string | null> => {
    const { error } = await correr();
    if (error) return error.message;
    await recargar();
    return null;
  };

  return {
    alumno: alumnos.find((a) => a.alumnoId === alumnoId),
    estado,
    recargar,
    numeroOcupadoEn,
    registrarEntrega: (kit, numero, talla) =>
      trasMutar(() =>
        actions.uniformes.registrarEntrega({ alumnoId, kit, numero, talla }),
      ),
    anularEntrega: (kit) =>
      trasMutar(() => actions.uniformes.anularEntrega({ alumnoId, kit })),
    registrarAbono: (kit, montoCop) =>
      trasMutar(() =>
        actions.uniformes.registrarPago({ alumnoId, kit, montoCop }),
      ),
  };
}
