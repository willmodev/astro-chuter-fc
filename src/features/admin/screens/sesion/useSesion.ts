import { actions } from 'astro:actions';
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  asistenciaDe,
  puedePasarLista,
  rosterDe,
  semanaInicioISO,
  type DiaEntreno,
  type ResumenAsistencia,
  type Semana,
} from '@/lib/domain/entrenos';

import type { EstadoCargaValor } from '../../chrome/EstadoCarga';
import { comprimeImagen } from '../../lib/comprime-imagen';
import { combinaEstado } from '../../hooks/combinaEstado';
import { useAlumnosPlantel } from '../../hooks/useAlumnosPlantel';
import { semanas } from '../../data/mock';
import type { AlumnoPlantel } from '../../data/types';
import { cargaSesionDia, construyeForm } from './carga-sesion';

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
  const [img, setImg] = useState<string | null>(null);
  const [nota, setNota] = useState('');
  const [ausentes, setAusentes] = useState<number[]>([]);
  const [listaExistente, setListaExistente] = useState(false);
  const [archivo, setArchivo] = useState<Blob | null>(null);
  const [errorImagen, setErrorImagen] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!semanaInicio) return;
    let vivo = true;
    setEstado('cargando');
    void cargaSesionDia(semanaInicio, day).then((snap) => {
      if (!vivo) return;
      if (!snap) return setEstado('error');
      setImg(snap.img);
      setNota(snap.nota);
      setAusentes(snap.ausentes);
      setListaExistente(snap.listaExistente);
      setEstado('listo');
    });
    return () => {
      vivo = false;
    };
  }, [semanaInicio, day]);

  const roster = useMemo(
    () =>
      rosterDe(params.cats, plantel.alumnos).sort((a, b) =>
        a.name.localeCompare(b.name, 'es'),
      ),
    [plantel.alumnos, params.cats],
  );

  const elegirImagen = useCallback(async (file: File) => {
    setErrorImagen(null);
    try {
      const blob = await comprimeImagen(file);
      setArchivo(blob);
      setImg((prev) => {
        if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
        return URL.createObjectURL(blob);
      });
    } catch (e) {
      setErrorImagen(e instanceof Error ? e.message : 'No se pudo procesar la imagen.');
    }
  }, []);

  const guardarPlaneacion = useCallback(async (): Promise<boolean> => {
    if (!semanaInicio) return false;
    setGuardando(true);
    const { error } = await actions.entrenos.guardarPlaneacion(
      construyeForm(semanaInicio, day, nota, archivo),
    );
    setGuardando(false);
    if (error) {
      setErrorImagen(error.message);
      return false;
    }
    return true;
  }, [semanaInicio, day, nota, archivo]);

  const guardarAsistencia = useCallback(async (): Promise<boolean> => {
    if (!semanaInicio) return false;
    setGuardando(true);
    const { error } = await actions.entrenos.guardarAsistencia({
      semanaInicio,
      dia: day,
      ausentes,
    });
    setGuardando(false);
    return !error;
  }, [semanaInicio, day, ausentes]);

  return {
    semana,
    estado: combinaEstado(estado, plantel.estado),
    img,
    nota,
    setNota,
    elegirImagen,
    errorImagen,
    guardarPlaneacion,
    guardando,
    roster,
    estaAusente: (id) => ausentes.includes(id),
    marcar: (id, presente) =>
      setAusentes((prev) =>
        presente ? prev.filter((x) => x !== id) : [...new Set([...prev, id])],
      ),
    asistencia: asistenciaDe(ausentes, roster),
    puedeLista: semana !== null && puedePasarLista(semana, day, hoy),
    listaExistente,
    guardarAsistencia,
  };
}
