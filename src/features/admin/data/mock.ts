// Ventana de semanas de entrenamientos (spec 09), derivada de la fecha viva por
// dominio puro. NO es mock de datos: planes/sesiones ya viven en Neon vía
// Actions (spec 13). Es solo el eje temporal compartido por Entrenos, Sesión y
// Entrenamientos (la identidad persistible sale de `semanaInicioISO`).
import { generarSemanas } from '@/lib/domain/entrenos';

import type { Semana } from './types';

export const semanas: Semana[] = generarSemanas(new Date());
