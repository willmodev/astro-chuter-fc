import { defineAction } from 'astro:actions';
import { z } from 'astro/zod';

import { requireAdmin } from '@/actions/_guard';
import { MESES } from '@/lib/domain/cartera';
import { registrarPagos } from '@/lib/services/cartera';

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
