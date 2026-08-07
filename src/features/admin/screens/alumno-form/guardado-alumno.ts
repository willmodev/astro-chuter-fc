import { actions } from 'astro:actions';

import type { FormValores } from './useAlumnoForm';

// Payload que esperan las Actions de alumnos (nombres del dominio, ya
// recortados). El form usa nombres cortos; aquí se traduce una sola vez.
export interface InputAlumno {
  nombre: string;
  documento: string;
  fechaNacimiento: string;
  acudiente: string;
  celular: string;
  direccion: string;
}

// `null` = no había nada que enviar (editar sin id); el form solo deja de enviar.
export type ResultadoGuardado = { id: number } | { error: string } | null;

export function aInput(v: FormValores): InputAlumno {
  return {
    nombre: v.name.trim(),
    documento: v.doc.trim(),
    fechaNacimiento: v.fechaNacimiento,
    acudiente: v.acu.trim(),
    celular: v.phone.trim(),
    direccion: v.dir.trim(),
  };
}

async function crear(input: InputAlumno): Promise<ResultadoGuardado> {
  const { data, error } = await actions.alumnos.crear(input);
  if (error) return { error: error.message };
  return { id: data.id };
}

async function editar(
  id: number,
  input: InputAlumno,
): Promise<ResultadoGuardado> {
  const { error } = await actions.alumnos.editar({ id, ...input });
  if (error) return { error: error.message };
  return { id };
}

export function guardaAlumno(
  modo: 'nuevo' | 'editar',
  alumnoId: number | undefined,
  input: InputAlumno,
): Promise<ResultadoGuardado> {
  if (modo === 'nuevo') return crear(input);
  if (alumnoId === undefined) return Promise.resolve(null);
  return editar(alumnoId, input);
}
