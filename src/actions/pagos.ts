import { defineAction } from 'astro:actions';
import { z } from 'astro/zod';

import { comoAccion } from '@/actions/_errores';
import { requireAdmin } from '@/actions/_guard';
import { MESES } from '@/lib/domain/cartera';
import { anularPago, registrarPagos } from '@/lib/services/cartera';

// Solo un admin cobra: el entrenador no ve ni toca dinero (filtro en servidor).
export const registrar = defineAction({
  input: z.object({
    alumnoId: z.number().int().positive(),
    anio: z.number().int().min(2026).max(2100),
    meses: z.array(z.enum(MESES)).min(1),
    metodo: z.enum(['efectivo', 'transferencia']),
  }),
  handler: async (input, { locals }) => {
    const admin = requireAdmin(locals);
    const registrados = await registrarPagos({
      ...input,
      registradoPor: admin.id,
    });
    return { registrados };
  },
});

// Anular un cobro mal registrado (spec 20): una celda, una anulación, motivo
// obligatorio. Solo admin, igual que registrar.
export const anular = defineAction({
  input: z.object({
    alumnoId: z.number().int().positive(),
    anio: z.number().int().min(2026).max(2100),
    mes: z.enum(MESES),
    motivo: z.string().trim().min(5).max(200),
  }),
  handler: async (input, { locals }) => {
    const admin = requireAdmin(locals);
    await comoAccion(() => anularPago({ ...input, anuladoPor: admin.id }));
    return { ok: true };
  },
});
