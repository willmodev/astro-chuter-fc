import { useMemo, useState, useSyncExternalStore } from 'react';

import {
  asistenciaDe,
  rosterDe,
  type DiaEntreno,
  type ResumenAsistencia,
  type Semana,
} from '@/lib/domain/entrenos';

import { semanas } from '../../data/mock';
import { getAlumnos, subscribe as subscribeAlumnos } from '../../data/store';
import {
  guardarAsistencia,
  guardarPlaneacion,
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

// Borrador local de la sesión del día (imagen, nota, ausentes) inicializado
// desde el store si ya se registró; guardar hace el upsert idempotente. La
// misma pantalla registra y corrige historial (spec 09).
export interface SesionData {
  semana: Semana | null; // null = weekId inexistente (redirigir a entrenos)
  existente: boolean;
  img: string | null;
  nota: string;
  setNota: (v: string) => void;
  elegirImagen: (file: File) => void;
  roster: Alumno[];
  estaAusente: (alumnoId: number) => boolean;
  marcar: (alumnoId: number, presente: boolean) => void;
  asistencia: ResumenAsistencia;
  guardar: () => void;
}

export function useSesion(params: ParamsSesion): SesionData {
  const { entrenadorId, entrenadorNombre, weekId, day } = params;
  const alumnos = useSyncExternalStore(subscribeAlumnos, getAlumnos);

  const semana = semanas.find((w) => w.id === weekId) ?? null;
  // Snapshot al montar: el borrador es local y se persiste solo al guardar.
  const [inicial] = useState(() => sesionDe(entrenadorId, weekId, day));
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

  const guardar = (): void => {
    const ref = { entrenadorId, entrenadorNombre, weekId, day };
    guardarPlaneacion({ ...ref, parteCentralImg: img, parteCentralNota: nota });
    guardarAsistencia({ ...ref, ausentes });
  };

  return {
    semana,
    existente: inicial !== null,
    img,
    nota,
    setNota,
    elegirImagen,
    roster,
    estaAusente,
    marcar,
    asistencia: asistenciaDe(ausentes, roster),
    guardar,
  };
}
