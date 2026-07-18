// ⚠️ DATOS ILUSTRATIVOS de ENTRENAMIENTOS — no son registros reales del club.
// El mock de alumnos/pagos murió con el spec 11 (ahora viven en Neon vía
// Actions); acá solo queda el mock de entrenos (planes/sesiones), que persiste
// en el spec 13. El roster de asistencia sale de los alumnos reales.
import { generarSemanas, type DiaEntreno } from '@/lib/domain/entrenos';

import type { PlanSemana, Semana, Sesion } from './types';

// ─── Entrenamientos (spec 09) ───
// Semanas generadas desde la fecha viva (dominio puro); los planes/sesiones de
// ejemplo se anclan por weekId RELATIVO (semana pasada, hace 2…), no por fecha
// absoluta, para que la mock no caduque.
export const semanas: Semana[] = generarSemanas(new Date());

// Cats de los entrenadores DE EJEMPLO, solo para que la vista admin derive el
// roster (asistencia). En BD real vendrán de `user.cats` (auth, spec 04).
export interface EntrenadorMock {
  id: string;
  nombre: string;
  cats: string[];
}

export const entrenadoresMock: EntrenadorMock[] = [
  { id: 'ent-camilo', nombre: 'Camilo Andrade', cats: ['SUB 4', 'SUB 6', 'SUB 8'] },
  { id: 'ent-ebed', nombre: 'Ebed Calderón', cats: ['SUB 10', 'SUB 12', 'SUB 14', 'SUB 16'] },
];

// semanas = [próxima, actual, pasada1, pasada2, pasada3]; los ejemplos se
// anclan a las dos semanas pasadas (la actual y la próxima nacen vacías).
const [, , w1, w2] = semanas;

function plan(
  entrenadorId: string,
  entrenadorNombre: string,
  weekId: string,
  tema: string,
  objetivos: string,
): PlanSemana {
  return { id: `${entrenadorId}-${weekId}`, entrenadorId, entrenadorNombre, weekId, tema, objetivos };
}

// Sesión de ejemplo. Sin imagen (`null`): un object URL no sobrevive la
// recarga, así que la mock solo trae la nota de respaldo. `ausentes: null` =
// lista NO pasada (planeada sin lista); `[]` o ids = lista ya pasada.
function ses(
  entrenadorId: string,
  entrenadorNombre: string,
  weekId: string,
  day: DiaEntreno,
  parteCentralNota: string,
  ausentes: number[] | null,
): Sesion {
  return { id: `${entrenadorId}-${weekId}-${day}`, entrenadorId, entrenadorNombre, weekId, day, parteCentralImg: null, parteCentralNota, ausentes };
}

export const planesSemana: PlanSemana[] = [
  plan('ent-camilo', 'Camilo Andrade', w1.id, 'Control y conducción', 'Mejorar el primer toque y la conducción con ambos perfiles en espacios reducidos.'),
  plan('ent-ebed', 'Ebed Calderón', w1.id, 'Pase y control orientado', 'Afinar el pase corto bajo presión y el control orientado hacia el espacio libre.'),
  plan('ent-camilo', 'Camilo Andrade', w2.id, 'Coordinación y lateralidad', 'Desarrollar coordinación motriz gruesa y reconocimiento de lateralidad con balón.'),
  plan('ent-ebed', 'Ebed Calderón', w2.id, 'Definición y remate', 'Mecanizar el gesto de remate a portería desde distintos ángulos y distancias.'),
];

// Los 4 estados de la sesión aparecen aquí: completa (planeada + lista),
// planeada sin lista (`ausentes: null`), lista sin planeación (nota vacía) y
// vacía (días sin registro, p. ej. Ebed w2 solo tiene el viernes).
export const sesiones: Sesion[] = [
  // Camilo · SUB 4–8 (roster mock: ids 2, 6, 7, 9, 11)
  ses('ent-camilo', 'Camilo Andrade', w1.id, 'Lunes', 'Conducción en zig-zag con conos y cambios de perfil.', [7]),
  ses('ent-camilo', 'Camilo Andrade', w1.id, 'Miércoles', 'Rondos 4v1 de primer toque en cuadrado pequeño.', [6, 7]),
  ses('ent-camilo', 'Camilo Andrade', w1.id, 'Viernes', 'Partido formativo 3v3 en mini-arcos.', null), // planeada sin lista
  ses('ent-camilo', 'Camilo Andrade', w2.id, 'Lunes', 'Circuito de psicomotricidad con aros y escalera.', []),
  ses('ent-camilo', 'Camilo Andrade', w2.id, 'Miércoles', '', [9]), // lista sin planeación
  // Ebed · SUB 10–16 (roster mock: ids 1, 3, 4, 5, 8, 10, 12)
  ses('ent-ebed', 'Ebed Calderón', w1.id, 'Lunes', 'Pase y control orientado en parejas con presión pasiva.', [3, 8]),
  ses('ent-ebed', 'Ebed Calderón', w1.id, 'Miércoles', 'Posesión 5v2 con transición al contraataque.', [8]),
  ses('ent-ebed', 'Ebed Calderón', w1.id, 'Viernes', 'Partido formativo con evaluación por puestos.', []),
  ses('ent-ebed', 'Ebed Calderón', w2.id, 'Viernes', 'Circuito de definición: remate tras pared y tras conducción.', [12]),
];
