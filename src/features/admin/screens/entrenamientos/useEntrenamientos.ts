import { actions } from 'astro:actions';
import { useCallback, useEffect, useState } from 'react';

import { semanaInicioISO, type Semana } from '@/lib/domain/entrenos';

import type { EstadoCargaValor } from '../../chrome/EstadoCarga';
import { semanas } from '../../data/mock';
import { aPlan, aSesiones } from '../../data/mapea-entrenos';
import type { AlumnoPlantel, PlanSemana, Sesion } from '../../data/types';

// Lo registrado en una semana, agrupado por entrenador (solo lectura del
// admin). Nombre, cats y roster salen del servidor (user real + alumnos reales).
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
  estado: EstadoCargaValor;
  recargar: () => Promise<void>;
}

export function useEntrenamientos(): EntrenamientosData {
  const actual = semanas.find((w) => w.current) ?? semanas[0];
  const [weekId, setWeekId] = useState(actual.id);
  const [grupos, setGrupos] = useState<GrupoEntrenador[]>([]);
  const [estado, setEstado] = useState<EstadoCargaValor>('cargando');

  const semana = semanas.find((w) => w.id === weekId) ?? actual;
  const semanaInicio = semanaInicioISO(semana);

  const recargar = useCallback(async () => {
    setEstado('cargando');
    const { data, error } = await actions.entrenos.listar({ semanaInicio });
    if (error || data?.rol !== 'admin') {
      setEstado('error');
      return;
    }
    setGrupos(
      data.grupos.map((g) => {
        const ctx = {
          entrenadorId: g.entrenadorId,
          entrenadorNombre: g.entrenadorNombre,
          weekId: semana.id,
        };
        return {
          id: g.entrenadorId,
          nombre: g.entrenadorNombre,
          cats: g.cats,
          plan: aPlan(g.plan, ctx),
          sesiones: aSesiones(g.sesiones, ctx),
          roster: g.roster,
        };
      }),
    );
    setEstado('listo');
  }, [semanaInicio, semana.id]);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  return { semanas, semana, setWeekId, grupos, estado, recargar };
}
