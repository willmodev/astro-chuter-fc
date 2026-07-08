import { useMemo, useSyncExternalStore } from 'react';

import {
  carteraVencida,
  estaEnMora,
  metaMes,
  pctAlDia,
  recaudoAnio,
  recaudoMes,
  saldoPendiente,
} from '@/lib/domain/cartera';

import { CURRENT, MONTHS, MONTHS_LONG, cumple, trainings } from '../data/mock';
import { getAlumnos, subscribe } from '../data/store';
import type { Alumno, Cumple, Stats, Training } from '../data/types';

// Contrato estable que consume el Dashboard. Hoy lo sirve el store mock; mañana
// lo servirán las Actions con esta MISMA forma → cambiar la fuente no toca la UI.
export interface DashboardData {
  stats: Stats;
  morosos: Alumno[]; // top 4 por saldo desc
  monthly: { m: string; total: number }[]; // recaudo por mes hasta el mes vivo
  cumple: Cumple[];
  entrenoHoy: Training[];
  meses: string[];
  mesesLong: string[];
  mesVivo: number;
}

// Ilustrativo: día representativo de entreno mientras no hay "hoy" real.
const DIA_HOY = 'Miércoles';

// Los KPIs se derivan de `states` (fuente única); nada precocinado.
function computeStats(alumnos: Alumno[]): Stats {
  const active = alumnos.length;
  const enMora = alumnos.filter(estaEnMora).length;
  const recMes = recaudoMes(alumnos, CURRENT);
  const meta = metaMes(alumnos, CURRENT);
  return {
    active,
    upToDate: active - enMora,
    morosos: enMora,
    pctUpToDate: Math.round(pctAlDia(alumnos)),
    recaudo: recaudoAnio(alumnos),
    recaudoMes: recMes,
    carteraVencida: carteraVencida(alumnos),
    metaMes: meta,
    pctMeta: meta === 0 ? 0 : Math.round((recMes / meta) * 100),
  };
}

export function useDashboardData(): DashboardData {
  const alumnos = useSyncExternalStore(subscribe, getAlumnos);

  return useMemo(() => {
    const morosos = alumnos
      .filter(estaEnMora)
      .sort((a, b) => saldoPendiente(b) - saldoPendiente(a))
      .slice(0, 4);

    const monthly = MONTHS.slice(0, CURRENT + 1).map((m, i) => ({
      m,
      total: alumnos.reduce((sum, s) => (s.states[i] === 'paid' ? sum + s.cuota : sum), 0),
    }));

    const entrenoHoy = trainings.filter((t) => t.day === DIA_HOY);

    return {
      stats: computeStats(alumnos),
      morosos,
      monthly,
      cumple,
      entrenoHoy,
      meses: MONTHS,
      mesesLong: MONTHS_LONG,
      mesVivo: CURRENT,
    };
  }, [alumnos]);
}
