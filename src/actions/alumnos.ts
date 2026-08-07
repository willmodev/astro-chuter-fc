import { defineAction } from 'astro:actions';
import { z } from 'astro/zod';

import { comoAccion } from '@/actions/_errores';
import { requireAdmin, requireUser } from '@/actions/_guard';
import {
  cambiarActivoAlumno,
  crearAlumno,
  editarAlumno,
  listarAlumnosAdmin,
  listarPlantel,
} from '@/lib/services/alumnos';

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
// `incluirRetirados` es solo del admin: el plantel nunca los trae (spec 14).
export const listar = defineAction({
  input: z.object({ incluirRetirados: z.boolean().default(false) }).optional(),
  handler: async (input, { locals }) => {
    const user = requireUser(locals);
    const hoy = new Date();
    if (user.role === 'admin') {
      return {
        rol: 'admin' as const,
        alumnos: await listarAlumnosAdmin(
          hoy,
          input?.incluirRetirados ?? false,
        ),
      };
    }
    return {
      rol: 'entrenador' as const,
      alumnos: await listarPlantel(user.cats ?? [], hoy),
    };
  },
});

export const crear = defineAction({
  input: datosSchema,
  handler: async (input, { locals }) => {
    requireAdmin(locals);
    const id = await comoAccion(() => crearAlumno(input, new Date()));
    return { id };
  },
});

export const editar = defineAction({
  input: datosSchema.extend({ id: z.number().int().positive() }),
  handler: async (input, { locals }) => {
    requireAdmin(locals);
    const { id, ...datos } = input;
    await comoAccion(() => editarAlumno(id, datos, new Date()));
    return { ok: true };
  },
});

// Retirar (activo:false) o reactivar (activo:true). Solo admin: el entrenador
// no gestiona altas ni bajas.
export const cambiarActivo = defineAction({
  input: z.object({
    id: z.number().int().positive(),
    activo: z.boolean(),
  }),
  handler: async (input, { locals }) => {
    requireAdmin(locals);
    await comoAccion(() => cambiarActivoAlumno(input.id, input.activo));
    return { ok: true };
  },
});
