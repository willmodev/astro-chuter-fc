import { defineAction } from 'astro:actions';
import { z } from 'astro/zod';

import { parseFechaNacimiento } from '@/lib/domain/alumnos';
import {
  categoriaDeCaptacion,
  EDAD_MAX_CAPTACION,
  EDAD_MIN_CAPTACION,
} from '@/lib/domain/categoria';
import { procesarInscripcion } from '@/lib/services/contacto';

// La fecha debe caer en el rango de captación: el `min`/`max` del input es UX,
// la frontera real es esta.
const fechaEnCaptacion = (iso: string): boolean => {
  const fecha = parseFechaNacimiento(iso);
  return fecha !== null && categoriaDeCaptacion(fecha, new Date()) !== null;
};

export const enviarContacto = defineAction({
  accept: 'form',
  input: z.object({
    nombreAcudiente: z.string().min(2),
    telefono: z.string().min(7),
    nombreNino: z.string().min(2),
    fechaNacimiento: z
      .string()
      .refine(
        fechaEnCaptacion,
        `Recibimos niños y niñas de ${String(EDAD_MIN_CAPTACION)} a ${String(EDAD_MAX_CAPTACION)} años.`,
      ),
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
      fechaNacimiento: datos.fechaNacimiento,
      emailAcudiente: datos.emailAcudiente || undefined,
      mensaje: datos.mensaje,
    });

    return { ok: true };
  },
});
