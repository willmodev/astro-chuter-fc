import { useMemo, useState, useSyncExternalStore } from 'react';

import {
  asistenciaDe,
  listaPasada,
  puedePasarLista,
  rosterDe,
  type DiaEntreno,
  type ResumenAsistencia,
  type Semana,
} from '@/lib/domain/entrenos';

import { semanas } from '../../data/mock';
import { getAlumnos, subscribe as subscribeAlumnos } from '../../data/store';
import {
  guardarAsistencia as persistirAsistencia,
  guardarPlaneacion as persistirPlaneacion,
  sesionDe,
} from '../../data/store-entrenos';
import type { Alumno } from '../../data/types';

export interface ParamsSesion {
  entrenadorId: string;
  entrenadorNombre: string;
  cats: string[];
  weekId: string;
  day: DiaEntreno;
}

// Borrador local de la sesión del día. Planeación (imagen + nota) y asistencia
// (ausentes) son dos registros independientes con su propio guardado. La lista
// solo existe cuando se guarda: el borrador arranca "todos presentes" en la UI
// pero no se persiste hasta pulsar "Guardar asistencia".
export interface SesionData {
  semana: Semana | null; // null = weekId inexistente (redirigir a entrenos)
  img: string | null;
  nota: string;
  setNota: (v: string) => void;
  elegirImagen: (file: File) => void;
  guardarPlaneacion: () => void;
  roster: Alumno[];
  estaAusente: (alumnoId: number) => boolean;
  marcar: (alumnoId: number, presente: boolean) => void;
  asistencia: ResumenAsistencia;
  puedeLista: boolean; // el día ya llegó → se puede pasar/corregir lista
  listaExistente: boolean; // la lista ya se pasó antes
  guardarAsistencia: () => void;
}

export function useSesion(params: ParamsSesion): SesionData {
  const { entrenadorId, entrenadorNombre, weekId, day } = params;
  const alumnos = useSyncExternalStore(subscribeAlumnos, getAlumnos);

  const semana = semanas.find((w) => w.id === weekId) ?? null;
  // Snapshot al montar: el borrador es local y se persiste solo al guardar.
  const [inicial] = useState(() => sesionDe(entrenadorId, weekId, day));
  const [hoy] = useState(() => new Date()); // único punto donde se inyecta "hoy"
  const [img, setImg] = useState<string | null>(inicial?.parteCentralImg ?? null);
  const [nota, setNota] = useState(inicial?.parteCentralNota ?? '');
  const [ausentes, setAusentes] = useState<number[]>(inicial?.ausentes ?? []);

  const roster = useMemo(
    () =>
      rosterDe(params.cats, alumnos).sort((a, b) =>
        a.name.localeCompare(b.name, 'es'),
      ),
    [alumnos, params.cats],
  );

  const estaAusente = (alumnoId: number): boolean => ausentes.includes(alumnoId);

  const marcar = (alumnoId: number, presente: boolean): void => {
    setAusentes((prev) => {
      if (presente) return prev.filter((id) => id !== alumnoId);
      return prev.includes(alumnoId) ? prev : [...prev, alumnoId];
    });
  };

  // Object URL local (mock): se pierde al recargar, igual que todo el store.
  const elegirImagen = (file: File): void => {
    setImg(URL.createObjectURL(file));
  };

  const ref = { entrenadorId, entrenadorNombre, weekId, day };
  const guardarPlaneacion = (): void => {
    persistirPlaneacion({ ...ref, parteCentralImg: img, parteCentralNota: nota });
  };
  const guardarAsistencia = (): void => {
    persistirAsistencia({ ...ref, ausentes });
  };

  return {
    semana,
    img,
    nota,
    setNota,
    elegirImagen,
    guardarPlaneacion,
    roster,
    estaAusente,
    marcar,
    asistencia: asistenciaDe(ausentes, roster),
    puedeLista: semana !== null && puedePasarLista(semana, day, hoy),
    listaExistente: listaPasada(inicial),
    guardarAsistencia,
  };
}
