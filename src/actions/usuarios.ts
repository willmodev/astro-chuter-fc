import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro/zod';

import { requireAdmin } from '@/actions/_guard';
import { UsuarioReglaError } from '@/lib/domain/usuarios';
import {
  cambiarActivo,
  crearUsuario,
  listarEquipo,
  resetearPassword,
} from '@/lib/services/usuarios';

const rolSchema = z.enum(['admin', 'entrenador']);

// Traduce un error de regla de negocio a un error de transporte legible.
function comoAccion<T>(fn: () => Promise<T>): Promise<T> {
  return fn().catch((e: unknown) => {
    if (e instanceof UsuarioReglaError) {
      throw new ActionError({ code: 'BAD_REQUEST', message: e.message });
    }
    throw e;
  });
}

export const listar = defineAction({
  handler: async (_input, { locals }) => {
    requireAdmin(locals);
    return listarEquipo();
  },
});

export const crear = defineAction({
  input: z.object({
    name: z.string().min(2).max(80),
    email: z.email(),
    password: z.string().min(8).max(128),
    role: rolSchema,
    cats: z.array(z.string()).default([]),
  }),
  handler: async (input, { locals, request }) => {
    requireAdmin(locals);
    await comoAccion(() => crearUsuario(request.headers, input));
    return { ok: true };
  },
});

export const toggleActivo = defineAction({
  input: z.object({
    userId: z.string().min(1),
    activo: z.boolean(),
  }),
  handler: async (input, { locals, request }) => {
    const admin = requireAdmin(locals);
    await comoAccion(() =>
      cambiarActivo(request.headers, admin.id, input.userId, input.activo),
    );
    return { ok: true };
  },
});

export const resetPassword = defineAction({
  input: z.object({
    userId: z.string().min(1),
    password: z.string().min(8).max(128),
  }),
  handler: async (input, { locals, request }) => {
    requireAdmin(locals);
    await comoAccion(() =>
      resetearPassword(request.headers, input.userId, input.password),
    );
    return { ok: true };
  },
});
