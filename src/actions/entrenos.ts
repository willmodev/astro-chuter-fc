import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro/zod';

import { requireEntrenador, requireUser } from '@/actions/_guard';
import {
  generarSemanas,
  semanaInicioISO,
  type DiaEntreno,
} from '@/lib/domain/entrenos';
import {
  guardarAsistencia,
  guardarPlan,
  guardarPlaneacion,
  vistaAdmin,
  vistaEntrenador,
} from '@/lib/services/entrenos';

const TIPOS_IMAGEN = ['image/webp', 'image/jpeg'];
const MAX_BYTES = 1_000_000; // 1MB: la imagen ya llega comprimida (~200KB)

const diaSchema = z.enum(['Lunes', 'Miércoles', 'Viernes']);
const semanaSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida.');

// La ventana editable = la ventana de semanas de la UI (actual + 3 pasadas + 1
// futura). Estar en ella garantiza además que es un lunes válido.
function exigirSemanaEnVentana(semanaInicio: string): void {
  const ventana = generarSemanas(new Date()).map(semanaInicioISO);
  if (!ventana.includes(semanaInicio)) {
    throw new ActionError({
      code: 'BAD_REQUEST',
      message: 'Esa semana está fuera del rango editable.',
    });
  }
}

// Lectura según rol: el entrenador ve lo suyo; el admin ve a TODOS (solo lectura).
export const listar = defineAction({
  input: z.object({ semanaInicio: semanaSchema }),
  handler: async ({ semanaInicio }, { locals }) => {
    const user = requireUser(locals);
    if (user.role === 'admin') {
      return { rol: 'admin' as const, grupos: await vistaAdmin(semanaInicio) };
    }
    return {
      rol: 'entrenador' as const,
      ...(await vistaEntrenador(semanaInicio, user.id)),
    };
  },
});

export const guardarPlanSemana = defineAction({
  input: z.object({
    semanaInicio: semanaSchema,
    tema: z.string().trim().min(1).max(200),
    objetivos: z.string().trim().min(1).max(2000),
  }),
  handler: async ({ semanaInicio, tema, objetivos }, { locals }) => {
    const user = requireEntrenador(locals);
    exigirSemanaEnVentana(semanaInicio);
    await guardarPlan(user.id, semanaInicio, tema, objetivos);
    return { ok: true };
  },
});

// Imagen opcional por FormData (validada en tipo/tamaño además del cliente).
export const guardarPlaneacionDia = defineAction({
  accept: 'form',
  input: z.object({
    semanaInicio: semanaSchema,
    dia: diaSchema,
    nota: z.string().max(500).default(''),
    imagen: z.instanceof(File).optional(),
  }),
  handler: async ({ semanaInicio, dia, nota, imagen }, { locals }) => {
    const user = requireEntrenador(locals);
    exigirSemanaEnVentana(semanaInicio);
    const archivo = imagen && imagen.size > 0 ? validarImagen(imagen) : null;
    await guardarPlaneacion({
      entrenadorId: user.id,
      semanaInicio,
      dia: dia as DiaEntreno,
      nota,
      imagen: archivo,
    });
    return { ok: true };
  },
});

function validarImagen(imagen: File): File {
  if (!TIPOS_IMAGEN.includes(imagen.type)) {
    throw new ActionError({
      code: 'BAD_REQUEST',
      message: 'La imagen debe ser WebP o JPEG.',
    });
  }
  if (imagen.size > MAX_BYTES) {
    throw new ActionError({
      code: 'BAD_REQUEST',
      message: 'La imagen es demasiado grande.',
    });
  }
  return imagen;
}

export const guardarAsistenciaDia = defineAction({
  input: z.object({
    semanaInicio: semanaSchema,
    dia: diaSchema,
    ausentes: z.array(z.number().int().positive()),
  }),
  handler: async ({ semanaInicio, dia, ausentes }, { locals }) => {
    const user = requireEntrenador(locals);
    exigirSemanaEnVentana(semanaInicio);
    await guardarAsistencia(user.id, semanaInicio, dia as DiaEntreno, ausentes);
    return { ok: true };
  },
});
