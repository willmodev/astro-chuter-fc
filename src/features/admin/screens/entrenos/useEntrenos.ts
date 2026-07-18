import { useCallback, useMemo, useState, useSyncExternalStore } from 'react';

import { rosterDe, type DiaEntreno, type Semana } from '@/lib/domain/entrenos';
import { pendientesDe } from '@/lib/domain/sesion';

import { semanas } from '../../data/mock';
import { getAlumnos, subscribe as subscribeAlumnos } from '../../data/store';
import {
  getPlanes,
  getSesiones,
  guardarPlanSemana,
  subscribe,
} from '../../data/store-entrenos';
import type { Alumno, PlanSemana, Sesion } from '../../data/types';

// Estado de la home de Entrenos: semana seleccionada (local, sin ruta propia),
// plan y sesiones del entrenador en esa semana, roster de sus categorías.
export interface EntrenosData {
  semanas: readonly Semana[];
  semana: Semana;
  setWeekId: (id: string) => void;
  plan: PlanSemana | null;
  sesionDeDia: (day: DiaEntreno) => Sesion | null;
  pendientes: { sinPlanear: number; sinLista: number };
  roster: Alumno[];
  guardarPlan: (tema: string, objetivos: string) => void;
}

export function useEntrenos(
  entrenadorId: string,
  entrenadorNombre: string,
  cats: readonly string[],
): EntrenosData {
  const sesiones = useSyncExternalStore(subscribe, getSesiones);
  const planes = useSyncExternalStore(subscribe, getPlanes);
  const alumnos = useSyncExternalStore(subscribeAlumnos, getAlumnos);
  const actual = semanas.find((w) => w.current) ?? semanas[0];
  const [weekId, setWeekId] = useState(actual.id);
  const [hoy] = useState(() => new Date()); // único punto donde se inyecta "hoy"

  const semana = semanas.find((w) => w.id === weekId) ?? actual;
  const roster = useMemo(() => rosterDe(cats, alumnos), [cats, alumnos]);

  const mias = useMemo(
    () =>
      sesiones.filter(
        (s) => s.entrenadorId === entrenadorId && s.weekId === semana.id,
      ),
    [sesiones, entrenadorId, semana.id],
  );

  const plan =
    planes.find(
      (p) => p.entrenadorId === entrenadorId && p.weekId === semana.id,
    ) ?? null;

  const sesionDeDia = useCallback(
    (day: DiaEntreno) => mias.find((s) => s.day === day) ?? null,
    [mias],
  );

  const pendientes = pendientesDe(semana, mias, hoy);

  const guardarPlan = useCallback(
    (tema: string, objetivos: string) => {
      guardarPlanSemana({
        entrenadorId,
        entrenadorNombre,
        weekId: semana.id,
        tema,
        objetivos,
      });
    },
    [entrenadorId, entrenadorNombre, semana.id],
  );

  return {
    semanas,
    semana,
    setWeekId,
    plan,
    sesionDeDia,
    pendientes,
    roster,
    guardarPlan,
  };
}
