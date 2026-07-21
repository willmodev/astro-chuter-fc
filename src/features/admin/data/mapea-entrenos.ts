// Traduce las filas persistidas (Actions) a las formas de UI PlanSemana/Sesion,
// derivando los ids e insertando el weekId de la ruta (el server habla en
// semanaInicio; la UI y el router siguen en weekId).
import type { DiaEntreno } from '@/lib/domain/entrenos';

import type { PlanSemana, Sesion } from './types';

interface PlanCrudo {
  tema: string;
  objetivos: string;
}

interface SesionCruda {
  dia: DiaEntreno;
  parteCentralUrl: string | null;
  parteCentralNota: string;
  ausentes: number[] | null;
}

export interface CtxEntreno {
  entrenadorId: string;
  entrenadorNombre: string;
  weekId: string;
}

export function aPlan(row: PlanCrudo | null, ctx: CtxEntreno): PlanSemana | null {
  if (!row) return null;
  return {
    id: `${ctx.entrenadorId}-${ctx.weekId}`,
    entrenadorId: ctx.entrenadorId,
    entrenadorNombre: ctx.entrenadorNombre,
    weekId: ctx.weekId,
    tema: row.tema,
    objetivos: row.objetivos,
  };
}

export function aSesion(row: SesionCruda, ctx: CtxEntreno): Sesion {
  return {
    id: `${ctx.entrenadorId}-${ctx.weekId}-${row.dia}`,
    entrenadorId: ctx.entrenadorId,
    entrenadorNombre: ctx.entrenadorNombre,
    weekId: ctx.weekId,
    day: row.dia,
    parteCentralImg: row.parteCentralUrl, // ahora URL de Blob (antes object URL)
    parteCentralNota: row.parteCentralNota,
    ausentes: row.ausentes,
  };
}

export function aSesiones(rows: SesionCruda[], ctx: CtxEntreno): Sesion[] {
  return rows.map((r) => aSesion(r, ctx));
}
