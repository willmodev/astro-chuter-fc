import { ActionError } from 'astro:actions';

import { AlumnoReglaError } from '@/lib/domain/alumnos';

// Traduce un error de regla de negocio a un error de transporte legible.
// Compartido por todas las Actions que orquestan reglas de dominio (DRY).
export function comoAccion<T>(fn: () => Promise<T>): Promise<T> {
  return fn().catch((e: unknown) => {
    if (e instanceof AlumnoReglaError) {
      throw new ActionError({ code: 'BAD_REQUEST', message: e.message });
    }
    throw e;
  });
}
