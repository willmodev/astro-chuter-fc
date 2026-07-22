// Orquestación de entrenos: arma las vistas (home del entrenador, vista admin
// agrupada) y persiste plan/planeación/asistencia. La planeación orquesta Blob
// (subir → guardar URL → borrar el anterior, tolerante a fallo del borrado).
import {
  planesEnSemana,
  sesionActual,
  sesionesEnSemana,
  upsertAsistencia,
  upsertPlan,
  upsertPlaneacion,
  type PlanRow,
  type SesionRow,
} from '@/lib/db/repos/entrenos';
import { listarUsuarios } from '@/lib/db/repos/usuarios';
import { DIAS_ENTRENO, rosterDe, type DiaEntreno } from '@/lib/domain/entrenos';

import type { AlumnoPlantel } from '@/features/admin/data/types';

import { listarPlantelCompleto } from './alumnos';
import { borrarBlob, subirImagen } from './blob-entrenos';

// Lo registrado por un entrenador en una semana, agrupado (solo lectura admin).
export interface GrupoEntrenador {
  entrenadorId: string;
  entrenadorNombre: string;
  cats: string[];
  plan: PlanRow | null;
  sesiones: SesionRow[];
  roster: AlumnoPlantel[];
}

function ordenarPorDia(rows: SesionRow[]): SesionRow[] {
  return [...rows].sort(
    (a, b) => DIAS_ENTRENO.indexOf(a.dia) - DIAS_ENTRENO.indexOf(b.dia),
  );
}

// Home del entrenador: su plan y sus sesiones de la semana.
export async function vistaEntrenador(
  semanaInicio: string,
  entrenadorId: string,
): Promise<{ plan: PlanRow | null; sesiones: SesionRow[] }> {
  const [planes, sesiones] = await Promise.all([
    planesEnSemana(semanaInicio, entrenadorId),
    sesionesEnSemana(semanaInicio, entrenadorId),
  ]);
  return { plan: planes[0] ?? null, sesiones: ordenarPorDia(sesiones) };
}

// Vista admin: cada entrenador con datos en la semana + su nombre/cats reales.
export async function vistaAdmin(
  semanaInicio: string,
): Promise<GrupoEntrenador[]> {
  const [planes, sesiones, usuarios, plantel] = await Promise.all([
    planesEnSemana(semanaInicio),
    sesionesEnSemana(semanaInicio),
    listarUsuarios(),
    listarPlantelCompleto(),
  ]);
  const ids = [
    ...new Set([...planes, ...sesiones].map((x) => x.entrenadorId)),
  ];
  return ids
    .map((id) => {
      const u = usuarios.find((x) => x.id === id);
      const cats = u?.cats ?? [];
      return {
        entrenadorId: id,
        entrenadorNombre: u?.name ?? 'Entrenador',
        cats,
        plan: planes.find((p) => p.entrenadorId === id) ?? null,
        sesiones: ordenarPorDia(sesiones.filter((s) => s.entrenadorId === id)),
        roster: rosterDe(cats, plantel),
      };
    })
    .sort((a, b) => a.entrenadorNombre.localeCompare(b.entrenadorNombre, 'es'));
}

export async function guardarPlan(
  entrenadorId: string,
  semanaInicio: string,
  tema: string,
  objetivos: string,
): Promise<void> {
  await upsertPlan(entrenadorId, semanaInicio, tema.trim(), objetivos.trim());
}

export interface PlaneacionInput {
  entrenadorId: string;
  semanaInicio: string;
  dia: DiaEntreno;
  nota: string;
  imagen: File | null;
}

// Planeación: si llega imagen nueva la sube y borra la anterior; si no, conserva
// la URL previa. Solo toca url/nota (la asistencia queda intacta por SQL).
export async function guardarPlaneacion(input: PlaneacionInput): Promise<void> {
  const { entrenadorId, semanaInicio, dia, nota, imagen } = input;
  const previa = await sesionActual(entrenadorId, semanaInicio, dia);
  let url = previa?.parteCentralUrl ?? null;
  let anterior: string | null = null;
  if (imagen) {
    anterior = url;
    url = await subirImagen(entrenadorId, semanaInicio, dia, imagen);
  }
  await upsertPlaneacion(entrenadorId, semanaInicio, dia, url, nota.trim());
  if (anterior) await borrarBlob(anterior);
}

export async function guardarAsistencia(
  entrenadorId: string,
  semanaInicio: string,
  dia: DiaEntreno,
  ausentes: number[],
): Promise<void> {
  await upsertAsistencia(entrenadorId, semanaInicio, dia, ausentes);
}
