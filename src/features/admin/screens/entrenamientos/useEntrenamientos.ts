import { useMemo, useState, useSyncExternalStore } from 'react';

import { DIAS_ENTRENO, rosterDe, type Semana } from '@/lib/domain/entrenos';

import { useAlumnosPlantel } from '../../hooks/useAlumnosPlantel';
import { entrenadoresMock, semanas } from '../../data/mock';
import { getPlanes, getSesiones, subscribe } from '../../data/store-entrenos';
import type { AlumnoPlantel, PlanSemana, Sesion } from '../../data/types';

// Lo registrado en una semana, agrupado por entrenador (solo lectura del
// admin). El roster sale de las cats mock; en BD real vendrá de user.cats.
export interface GrupoEntrenador {
  id: string;
  nombre: string;
  cats: string[];
  plan: PlanSemana | null;
  sesiones: Sesion[];
  roster: AlumnoPlantel[];
}

export interface EntrenamientosData {
  semanas: readonly Semana[];
  semana: Semana;
  setWeekId: (id: string) => void;
  grupos: GrupoEntrenador[];
}

function grupoDe(
  id: string,
  planes: PlanSemana[],
  sesiones: Sesion[],
  alumnos: AlumnoPlantel[],
): GrupoEntrenador {
  const meta = entrenadoresMock.find((e) => e.id === id);
  const nombre =
    meta?.nombre ??
    planes[0]?.entrenadorNombre ??
    sesiones[0]?.entrenadorNombre ??
    'Entrenador';
  const cats = meta?.cats ?? [];
  const porDia = [...sesiones].sort(
    (a, b) => DIAS_ENTRENO.indexOf(a.day) - DIAS_ENTRENO.indexOf(b.day),
  );
  return {
    id,
    nombre,
    cats,
    plan: planes[0] ?? null,
    sesiones: porDia,
    roster: rosterDe(cats, alumnos),
  };
}

export function useEntrenamientos(): EntrenamientosData {
  const todasSesiones = useSyncExternalStore(subscribe, getSesiones);
  const todosPlanes = useSyncExternalStore(subscribe, getPlanes);
  const { alumnos } = useAlumnosPlantel();
  const actual = semanas.find((w) => w.current) ?? semanas[0];
  const [weekId, setWeekId] = useState(actual.id);

  const semana = semanas.find((w) => w.id === weekId) ?? actual;

  const grupos = useMemo(() => {
    const planes = todosPlanes.filter((p) => p.weekId === semana.id);
    const sesiones = todasSesiones.filter((s) => s.weekId === semana.id);
    const ids = [
      ...new Set([...planes, ...sesiones].map((x) => x.entrenadorId)),
    ];
    return ids
      .map((id) =>
        grupoDe(
          id,
          planes.filter((p) => p.entrenadorId === id),
          sesiones.filter((s) => s.entrenadorId === id),
          alumnos,
        ),
      )
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }, [todosPlanes, todasSesiones, alumnos, semana.id]);

  return { semanas, semana, setWeekId, grupos };
}
