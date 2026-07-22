import { actions } from 'astro:actions';
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  rosterDe,
  semanaInicioISO,
  type DiaEntreno,
  type Semana,
} from '@/lib/domain/entrenos';
import { pendientesDe } from '@/lib/domain/sesion';

import type { EstadoCargaValor } from '../../chrome/EstadoCarga';
import { useAlumnosPlantel } from '../../hooks/useAlumnosPlantel';
import { semanas } from '../../data/mock';
import { aPlan, aSesiones } from '../../data/mapea-entrenos';
import type { AlumnoPlantel, PlanSemana, Sesion } from '../../data/types';
import { combinaEstado } from '../../hooks/combinaEstado';

// Home del entrenador: semana seleccionada (local), su plan y sesiones desde
// Neon (Action), roster de sus categorías. Mutación pesimista (Action → refetch).
export interface EntrenosData {
  semanas: readonly Semana[];
  semana: Semana;
  setWeekId: (id: string) => void;
  plan: PlanSemana | null;
  sesionDeDia: (day: DiaEntreno) => Sesion | null;
  pendientes: { sinPlanear: number; sinLista: number };
  roster: AlumnoPlantel[];
  guardarPlan: (tema: string, objetivos: string) => Promise<void>;
  estado: EstadoCargaValor;
  recargar: () => Promise<void>;
}

export function useEntrenos(
  entrenadorId: string,
  entrenadorNombre: string,
  cats: readonly string[],
): EntrenosData {
  const plantel = useAlumnosPlantel();
  const actual = semanas.find((w) => w.current) ?? semanas[0];
  const [weekId, setWeekId] = useState(actual.id);
  const [hoy] = useState(() => new Date());
  const [plan, setPlan] = useState<PlanSemana | null>(null);
  const [sesiones, setSesiones] = useState<Sesion[]>([]);
  const [estado, setEstado] = useState<EstadoCargaValor>('cargando');

  const semana = semanas.find((w) => w.id === weekId) ?? actual;
  const semanaInicio = semanaInicioISO(semana);
  const roster = useMemo(() => rosterDe(cats, plantel.alumnos), [cats, plantel.alumnos]);

  const recargar = useCallback(async () => {
    setEstado('cargando');
    const ctx = { entrenadorId, entrenadorNombre, weekId: semana.id };
    const { data, error } = await actions.entrenos.listar({ semanaInicio });
    if (error || data?.rol !== 'entrenador') {
      setEstado('error');
      return;
    }
    setPlan(aPlan(data.plan, ctx));
    setSesiones(aSesiones(data.sesiones, ctx));
    setEstado('listo');
  }, [entrenadorId, entrenadorNombre, semana.id, semanaInicio]);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  const sesionDeDia = useCallback(
    (day: DiaEntreno) => sesiones.find((s) => s.day === day) ?? null,
    [sesiones],
  );

  const guardarPlan = useCallback(
    async (tema: string, objetivos: string) => {
      await actions.entrenos.guardarPlan({ semanaInicio, tema, objetivos });
      await recargar();
    },
    [semanaInicio, recargar],
  );

  return {
    semanas,
    semana,
    setWeekId,
    plan,
    sesionDeDia,
    pendientes: pendientesDe(semana, sesiones, hoy),
    roster,
    guardarPlan,
    estado: combinaEstado(estado, plantel.estado),
    recargar: async () => {
      await Promise.all([recargar(), plantel.recargar()]);
    },
  };
}
