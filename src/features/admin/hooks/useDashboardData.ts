import { useMemo } from 'react';

import { estaEnMora, saldoPendiente } from '@/lib/domain/cartera';

import { CURRENT, MONTHS, MONTHS_LONG, cumple, stats, students, trainings } from '../data/mock';
import type { Alumno, Cumple, Stats, Training } from '../data/types';

// Contrato estable que consume el Dashboard. Hoy lo sirve la mock; mañana lo
// servirán las Actions con esta MISMA forma → cambiar la fuente no toca la UI.
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

export function useDashboardData(): DashboardData {
  return useMemo(() => {
    const morosos = students
      .filter(estaEnMora)
      .sort((a, b) => saldoPendiente(b) - saldoPendiente(a))
      .slice(0, 4);

    const monthly = MONTHS.slice(0, CURRENT + 1).map((m, i) => ({
      m,
      total: students.reduce((sum, s) => (s.states[i] === 'paid' ? sum + s.cuota : sum), 0),
    }));

    const entrenoHoy = trainings.filter((t) => t.day === DIA_HOY);

    return {
      stats,
      morosos,
      monthly,
      cumple,
      entrenoHoy,
      meses: MONTHS,
      mesesLong: MONTHS_LONG,
      mesVivo: CURRENT,
    };
  }, []);
}
