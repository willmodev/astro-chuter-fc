import { defineAction } from 'astro:actions';
import { z } from 'astro/zod';

import { procesarInscripcion } from '@/lib/services/contacto';

export const enviarContacto = defineAction({
  accept: 'form',
  input: z.object({
    nombreAcudiente: z.string().min(2),
    telefono: z.string().min(7),
    nombreNino: z.string().min(2),
    anioNacimiento: z.coerce.number().int().min(2000).max(2025),
    emailAcudiente: z.email().optional().or(z.literal('')),
    mensaje: z.string().max(1000).optional(),
    botcheck: z.string().optional(), // honeypot
  }),
  handler: async (datos) => {
    // Honeypot: si el campo oculto viene con valor, es un bot → se descarta
    // en silencio (respondemos ok para no revelar la trampa).
    if (datos.botcheck) {
      return { ok: true };
    }

    await procesarInscripcion({
      nombreAcudiente: datos.nombreAcudiente,
      telefono: datos.telefono,
      nombreNino: datos.nombreNino,
      anioNacimiento: datos.anioNacimiento,
      emailAcudiente: datos.emailAcudiente || undefined,
      mensaje: datos.mensaje,
    });

    return { ok: true };
  },
});
