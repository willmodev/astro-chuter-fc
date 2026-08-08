import { defineAction } from 'astro:actions';
import { z } from 'astro/zod';

import { comoAccion } from '@/actions/_errores';
import { requireAdmin, requireUser } from '@/actions/_guard';
import { ETIQUETAS } from '@/lib/domain/categoria';
import {
  anularEntrega,
  listarUniformesAdmin,
  listarUniformesEntrenador,
  paginaUniformesAdmin,
  registrarEntrega,
  registrarPago,
} from '@/lib/services/uniformes';

const kitSchema = z.enum(['AZUL', 'ORO']);
const alumnoKit = z.object({
  alumnoId: z.number().int().positive(),
  kit: kitSchema,
});

// Filtros de la pantalla Uniformes (spec 18). Las categorías salen del catálogo
// de dominio: no hay una segunda lista de cats acá.
const filtrosSchema = z.object({
  kit: kitSchema.nullable().default(null),
  estado: z
    .enum(['completo', 'porEntregar', 'porCobrar', 'sinIniciar'])
    .nullable()
    .default(null),
  cat: z.enum(ETIQUETAS).nullable().default(null),
  query: z.string().trim().max(60).default(''),
  orden: z.enum(['prioridad', 'nombre', 'numero']).default('prioridad'),
  offset: z.number().int().min(0).default(0),
  limit: z.number().int().min(1).max(50).default(20),
});

// Página de la lista de kits. Solo admin: el entrenador no ve esta pantalla y
// el gate está en servidor, no en el cliente — recibe FORBIDDEN, no una lista
// vacía que parecería "no hay datos".
export const listarPagina = defineAction({
  input: filtrosSchema,
  handler: async (input, { locals }) => {
    requireAdmin(locals);
    return paginaUniformesAdmin(input, new Date());
  },
});

// Admin: dos kits con dinero; entrenador: solo sus cats y SOLO la entrega.
// El discriminante `rol` deja que el cliente sepa qué forma recibió.
export const listar = defineAction({
  handler: async (_input, { locals }) => {
    const user = requireUser(locals);
    const hoy = new Date();
    if (user.role === 'admin') {
      return {
        rol: 'admin' as const,
        alumnos: await listarUniformesAdmin(hoy),
      };
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
