import { useEffect, useMemo, useState } from 'react';

import {
  puedePasarLista,
  rosterDe,
  semanaInicioISO,
  type DiaEntreno,
  type ResumenAsistencia,
  type Semana,
} from '@/lib/domain/entrenos';

import { combinaEstado } from '../../hooks/combinaEstado';
import { useAlumnosPlantel } from '../../hooks/useAlumnosPlantel';
import { semanas } from '../../data/mock';

import { cargaSesionDia } from './carga-sesion';
import { useAsistenciaSesion } from './useAsistenciaSesion';
import { usePlaneacion } from './usePlaneacion';

import type { AlumnoPlantel } from '../../data/types';
import type { EstadoCargaValor } from '../../chrome/EstadoCarga';

export interface ParamsSesion {
  entrenadorId: string;
  entrenadorNombre: string;
  cats: string[];
  weekId: string;
  day: DiaEntreno;
}

// Borrador local de la sesión: planeación (imagen + nota) y asistencia son dos
// registros independientes con su propio guardado (Action → navega/refetch). El
// preview local vive hasta que la Action confirma.
export interface SesionData {
  semana: Semana | null;
  estado: EstadoCargaValor;
  img: string | null;
  nota: string;
  setNota: (v: string) => void;
  elegirImagen: (file: File) => void;
  errorImagen: string | null;
  guardarPlaneacion: () => Promise<boolean>;
  guardando: boolean;
  roster: AlumnoPlantel[];
  estaAusente: (alumnoId: number) => boolean;
  marcar: (alumnoId: number, presente: boolean) => void;
  asistencia: ResumenAsistencia;
  puedeLista: boolean;
  listaExistente: boolean;
  guardarAsistencia: () => Promise<boolean>;
}

export function useSesion(params: ParamsSesion): SesionData {
  const { weekId, day } = params;
  const plantel = useAlumnosPlantel();
  const semana = semanas.find((w) => w.id === weekId) ?? null;
  const semanaInicio = semana ? semanaInicioISO(semana) : null;
  const [hoy] = useState(() => new Date());
  const [estado, setEstado] = useState<EstadoCargaValor>('cargando');

  const roster = useMemo(
    () =>
      rosterDe(params.cats, plantel.alumnos).sort((a, b) =>
        a.name.localeCompare(b.name, 'es'),
      ),
    [plantel.alumnos, params.cats],
  );

  const plan = usePlaneacion(semanaInicio, day);
  const asis = useAsistenciaSesion(semanaInicio, day, roster);

  useEffect(() => {
    if (!semanaInicio) return;
    let vivo = true;
    setEstado('cargando');
    void cargaSesionDia(semanaInicio, day).then((snap) => {
      if (!vivo) return;
      if (!snap) return setEstado('error');
      plan.aplicar(snap);
      asis.aplicar(snap);
      setEstado('listo');
    });
    return () => {
      vivo = false;
    };
    // Solo la semana/día definen qué cargar; `aplicar` solo llama a setState.
  }, [semanaInicio, day]);

  return {
    semana,
    estado: combinaEstado(estado, plantel.estado),
    img: plan.img,
    nota: plan.nota,
    setNota: plan.setNota,
    elegirImagen: plan.elegirImagen,
    errorImagen: plan.errorImagen,
    guardarPlaneacion: plan.guardarPlaneacion,
    guardando: plan.guardando || asis.guardando,
    roster,
    estaAusente: asis.estaAusente,
    marcar: asis.marcar,
    asistencia: asis.asistencia,
    puedeLista: semana !== null && puedePasarLista(semana, day, hoy),
    listaExistente: asis.listaExistente,
    guardarAsistencia: asis.guardarAsistencia,
  };
}
