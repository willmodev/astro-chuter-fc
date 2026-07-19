import { defineAction } from 'astro:actions';
import { z } from 'astro/zod';

import { comoAccion } from '@/actions/_errores';
import { requireAdmin, requireUser } from '@/actions/_guard';
import {
  anularEntrega,
  listarUniformesAdmin,
  listarUniformesEntrenador,
  registrarEntrega,
  registrarPago,
} from '@/lib/services/uniformes';

const kitSchema = z.enum(['AZUL', 'ORO']);
const alumnoKit = z.object({
  alumnoId: z.number().int().positive(),
  kit: kitSchema,
});

// Admin: dos kits con dinero; entrenador: solo sus cats y SOLO la entrega.
// El discriminante `rol` deja que el cliente sepa qué forma recibió.
export const listar = defineAction({
  handler: async (_input, { locals }) => {
    const user = requireUser(locals);
    const hoy = new Date();
    if (user.role === 'admin') {
      return { rol: 'admin' as const, alumnos: await listarUniformesAdmin(hoy) };
    }
    return {
      rol: 'entrenador' as const,
      alumnos: await listarUniformesEntrenador(hoy, user.cats ?? []),
    };
  },
});

export const registrarEntregaKit = defineAction({
  input: alumnoKit.extend({
    numero: z.number().int().min(1).max(999),
    talla: z.string().trim().max(10).default(''),
  }),
  handler: async (input, { locals }) => {
    const admin = requireAdmin(locals);
    await comoAccion(() =>
      registrarEntrega({ ...input, registradoPor: admin.id }),
    );
    return { ok: true };
  },
});

export const anularEntregaKit = defineAction({
  input: alumnoKit,
  handler: async (input, { locals }) => {
    const admin = requireAdmin(locals);
    await comoAccion(() => anularEntrega(input.alumnoId, input.kit, admin.id));
    return { ok: true };
  },
});

export const registrarPagoKit = defineAction({
  input: alumnoKit.extend({ montoCop: z.number().int() }),
  handler: async (input, { locals }) => {
    const admin = requireAdmin(locals);
    const abonado = await comoAccion(() =>
      registrarPago({ ...input, registradoPor: admin.id }),
    );
    return { abonado };
  },
});
