// EntrenoDeHoy (HU-4.6): en un día Lun/Mié/Vie, una fila por entrenador con su
// estado de registro del día. Solo lectura del admin (lo consume dashboard.stats).
import { sesionesEnSemana, type SesionRow } from '@/lib/db/repos/entrenos';
import { listarUsuarios, type UsuarioRepo } from '@/lib/db/repos/usuarios';
import {
  asistenciaDe,
  diaDeFecha,
  generarSemanas,
  rosterDe,
  semanaInicioISO,
  type DiaEntreno,
  type ResumenAsistencia,
} from '@/lib/domain/entrenos';

import type { AlumnoPlantel } from '@/features/admin/data/types';

import { listarPlantelCompleto } from './alumnos';

export interface EntrenoDeHoyFila {
  entrenadorId: string;
  entrenadorNombre: string;
  registrado: boolean; // hay planeación o lista para hoy
  parteCentralUrl: string | null;
  asistencia: ResumenAsistencia | null; // solo si la lista ya se pasó
}

export interface EntrenoDeHoy {
  dia: DiaEntreno;
  filas: EntrenoDeHoyFila[];
}

function aFila(
  u: UsuarioRepo,
  dia: DiaEntreno,
  sesiones: SesionRow[],
  plantel: AlumnoPlantel[],
): EntrenoDeHoyFila {
  const s = sesiones.find((x) => x.entrenadorId === u.id && x.dia === dia) ?? null;
  const registrado =
    s !== null &&
    (s.parteCentralUrl !== null || s.parteCentralNota.trim() !== '' || s.ausentes !== null);
  const asistencia =
    s && s.ausentes !== null ? asistenciaDe(s.ausentes, rosterDe(u.cats, plantel)) : null;
  return {
    entrenadorId: u.id,
    entrenadorNombre: u.name,
    registrado,
    parteCentralUrl: s?.parteCentralUrl ?? null,
    asistencia,
  };
}

export async function entrenoDeHoy(hoy: Date): Promise<EntrenoDeHoy | null> {
  const dia = diaDeFecha(hoy);
  if (!dia) return null; // sin card los días sin entreno
  const actual = generarSemanas(hoy).find((w) => w.current);
  if (!actual) return null;
  const semanaInicio = semanaInicioISO(actual);
  const [sesiones, usuarios, plantel] = await Promise.all([
    sesionesEnSemana(semanaInicio),
    listarUsuarios(),
    listarPlantelCompleto(),
  ]);
  const filas = usuarios
    .filter((u) => u.role === 'entrenador' && !u.banned)
    .map((u) => aFila(u, dia, sesiones, plantel))
    .sort((a, b) => a.entrenadorNombre.localeCompare(b.entrenadorNombre, 'es'));
  return { dia, filas };
}
