import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro/zod';

import { requireAdmin, requireUser } from '@/actions/_guard';
import { AlumnoReglaError } from '@/lib/domain/alumnos';
import {
  crearAlumno,
  editarAlumno,
  listarAlumnosAdmin,
  listarPlantel,
} from '@/lib/services/alumnos';

// Traduce un error de regla de negocio a un error de transporte legible.
function comoAccion<T>(fn: () => Promise<T>): Promise<T> {
  return fn().catch((e: unknown) => {
    if (e instanceof AlumnoReglaError) {
      throw new ActionError({ code: 'BAD_REQUEST', message: e.message });
    }
    throw e;
  });
}

const datosSchema = z.object({
  nombre: z.string().trim().min(2).max(80),
  documento: z.string().trim().min(6).max(20),
  fechaNacimiento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida.'),
  acudiente: z.string().trim().min(2).max(80),
  celular: z.string().trim().min(7).max(20),
  direccion: z.string().trim().max(120).default(''),
});

// Admin: todo con dinero; entrenador: solo sus cats, contrato SIN dinero.
// El discriminante `rol` deja que el cliente sepa qué forma recibió.
export const listar = defineAction({
  handler: async (_input, { locals }) => {
    const user = requireUser(locals);
    const hoy = new Date();
    if (user.role === 'admin') {
      return { rol: 'admin' as const, alumnos: await listarAlumnosAdmin(hoy) };
    }
    return {
      rol: 'entrenador' as const,
      alumnos: await listarPlantel(user.cats ?? []),
    };
  },
});

export const crear = defineAction({
  input: datosSchema,
  handler: async (input, { locals }) => {
    requireAdmin(locals);
    const id = await comoAccion(() => crearAlumno(input));
    return { id };
  },
});

export const editar = defineAction({
  input: datosSchema.extend({ id: z.number().int().positive() }),
  handler: async (input, { locals }) => {
    requireAdmin(locals);
    const { id, ...datos } = input;
    await comoAccion(() => editarAlumno(id, datos));
    return { ok: true };
  },
});
