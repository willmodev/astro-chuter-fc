// Orquestación del dashboard: KPIs, morosos, recaudo mensual y próximos
// cumpleaños, todo derivado en servidor desde los pagos reales.
import { soloActivos } from '@/lib/domain/alumnos';
import {
  estaEnMora,
  faltanteMeta,
  indiceMesVivo,
  MESES_VISIBLES,
  MESES_VISIBLES_LARGOS,
  metaMes,
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
import { entrenoDeHoy, type EntrenoDeHoy } from './entreno-de-hoy';
import { catDe, parseFechaLocal } from './mapea-alumno';

// Cuántos morosos viajan al dashboard: es una cola de trabajo, no la lista
// completa (esa vive en Cartera).
const TOP_MOROSOS = 5;

export interface DashboardStats {
  stats: Stats;
  morosos: Alumno[]; // top TOP_MOROSOS por saldo desc
  monthly: { m: string; total: number }[];
  cumples: Cumple[];
  meses: string[];
  mesesLong: string[];
  mesVivo: number;
  entrenoDeHoy: EntrenoDeHoy | null; // null los días sin entreno
}

// Población y deuda se miden sobre `activos`; el dinero recaudado sobre
// `todos`, porque el pago de un retirado entró igual (spec 14).
function computeStats(
  activos: Alumno[],
  todos: Alumno[],
  mesVivo: number,
): Stats {
  const active = activos.length;
  const enMora = activos.filter(estaEnMora).length;
  const recMes = recaudoMes(todos, mesVivo);
  const meta = metaMes(activos, mesVivo);
  return {
    active,
    upToDate: active - enMora,
    morosos: enMora,
    pctUpToDate: Math.round(pctAlDia(activos)),
    recaudo: recaudoAnio(todos),
    recaudoMes: recMes,
    metaMes: meta,
    pctMeta: meta === 0 ? 0 : Math.round((recMes / meta) * 100),
    faltaMeta: faltanteMeta(meta, recMes),
  };
}

function cumplesDe(rows: AlumnoRow[], hoy: Date): Cumple[] {
  return proximosCumples(
    rows.map((r) => ({
      name: r.nombre,
      cat: catDe(r, hoy),
      fechaNacimiento: r.fechaNacimiento
        ? parseFechaLocal(r.fechaNacimiento)
        : null,
    })),
    hoy,
  );
}

// Trae también a los retirados (para el recaudo) y separa a los activos aquí.
export async function statsDashboard(hoy: Date): Promise<DashboardStats> {
  const [{ alumnos, rows }, entreno] = await Promise.all([
    construirAlumnos(hoy, true),
    entrenoDeHoy(hoy),
  ]);
  const activos = soloActivos(alumnos);
  const mesVivo = indiceMesVivo(hoy);
  const morosos = activos
    .filter(estaEnMora)
    .sort((a, b) => saldoPendiente(b) - saldoPendiente(a))
    .slice(0, TOP_MOROSOS);
  const monthly = MESES_VISIBLES.slice(0, mesVivo + 1).map((m, i) => ({
    m,
    total: alumnos.reduce(
      (sum, s) => (s.states[i] === 'paid' ? sum + s.cuota : sum),
      0,
    ),
  }));
  return {
    stats: computeStats(activos, alumnos, mesVivo),
    morosos,
    monthly,
    cumples: cumplesDe(soloActivos(rows), hoy),
    meses: [...MESES_VISIBLES],
    mesesLong: MESES_VISIBLES_LARGOS,
    mesVivo,
    entrenoDeHoy: entreno,
  };
}
