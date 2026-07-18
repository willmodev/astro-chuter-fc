// Orquestación del dashboard: KPIs, morosos, recaudo mensual y próximos
// cumpleaños, todo derivado en servidor desde los pagos reales.
import { subDeAnio } from '@/lib/domain/categoria';
import {
  carteraVencida,
  estaEnMora,
  MESES,
  MESES_VISIBLES,
  metaMes,
  NOMBRE_MES,
  pctAlDia,
  recaudoAnio,
  recaudoMes,
  saldoPendiente,
} from '@/lib/domain/cartera';
import { proximosCumples } from '@/lib/domain/cumples';
import type { Cumple } from '@/lib/domain/cumples';

import type { AlumnoRow } from '@/lib/db/repos/alumnos';
import type { Alumno, Stats } from '@/features/admin/data/types';

import { construirAlumnos } from './alumnos';
import { parseFechaLocal } from './mapea-alumno';

export interface DashboardStats {
  stats: Stats;
  morosos: Alumno[]; // top 4 por saldo desc
  monthly: { m: string; total: number }[];
  cumples: Cumple[];
  meses: string[];
  mesesLong: string[];
  mesVivo: number;
}

// Índice del mes en curso dentro de la tira visible (acotado a [0, len−1]).
function mesVivoDe(hoy: Date): number {
  const idx = MESES_VISIBLES.indexOf(MESES[hoy.getMonth()]);
  return Math.min(Math.max(idx, 0), MESES_VISIBLES.length - 1);
}

function computeStats(alumnos: Alumno[], mesVivo: number): Stats {
  const active = alumnos.length;
  const enMora = alumnos.filter(estaEnMora).length;
  const recMes = recaudoMes(alumnos, mesVivo);
  const meta = metaMes(alumnos, mesVivo);
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

function cumplesDe(rows: AlumnoRow[], hoy: Date): Cumple[] {
  return proximosCumples(
    rows.map((r) => ({
      name: r.nombre,
      cat: subDeAnio(r.anioNacimiento) ?? '—',
      fechaNacimiento: r.fechaNacimiento
        ? parseFechaLocal(r.fechaNacimiento)
        : null,
    })),
    hoy,
  );
}

export async function statsDashboard(hoy: Date): Promise<DashboardStats> {
  const { alumnos, rows } = await construirAlumnos(hoy);
  const mesVivo = mesVivoDe(hoy);
  const morosos = alumnos
    .filter(estaEnMora)
    .sort((a, b) => saldoPendiente(b) - saldoPendiente(a))
    .slice(0, 4);
  const monthly = MESES_VISIBLES.slice(0, mesVivo + 1).map((m, i) => ({
    m,
    total: alumnos.reduce(
      (sum, s) => (s.states[i] === 'paid' ? sum + s.cuota : sum),
      0,
    ),
  }));
  return {
    stats: computeStats(alumnos, mesVivo),
    morosos,
    monthly,
    cumples: cumplesDe(rows, hoy),
    meses: [...MESES_VISIBLES],
    mesesLong: MESES_VISIBLES.map((m) => NOMBRE_MES[m]),
    mesVivo,
  };
}
