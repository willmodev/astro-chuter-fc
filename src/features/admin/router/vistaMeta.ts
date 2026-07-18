import type { TabId } from '../chrome/tabs';

import type { RutaAdmin } from './types';

// Metadata de cada vista del admin (título/eyebrow del header, tab resaltada y
// ruta de cada tab). Extraído de AdminApp para mantenerlo bajo 200 líneas.
export const META: Record<RutaAdmin['vista'], { title: string; eyebrow: string }> = {
  dashboard: { title: 'Dashboard', eyebrow: 'Temporada 2026' },
  alumnos: { title: 'Alumnos', eyebrow: 'Inscripciones' },
  ficha: { title: 'Alumnos', eyebrow: 'Ficha del alumno' },
  alumnoNuevo: { title: 'Alumnos', eyebrow: 'Inscribir alumno' },
  alumnoEditar: { title: 'Alumnos', eyebrow: 'Editar alumno' },
  cartera: { title: 'Cartera', eyebrow: 'Control de cobros' },
  pago: { title: 'Cartera', eyebrow: 'Registrar pago' },
  uniformes: { title: 'Uniformes', eyebrow: 'Control de kits' },
  uniformeEntrega: { title: 'Alumnos', eyebrow: 'Registrar uniforme' },
  mas: { title: 'Más', eyebrow: 'Club Chuter F.C.' },
  equipo: { title: 'Más', eyebrow: 'Club Chuter F.C.' },
  entrenamientos: { title: 'Más', eyebrow: 'Entrenamientos' },
  entrenos: { title: 'Más', eyebrow: 'Entrenamientos' },
  sesion: { title: 'Más', eyebrow: 'Entrenamientos' },
  plantel: { title: 'Más', eyebrow: 'Entrenamientos' },
};

// Tab resaltada por vista (Ficha/form/entrega cuelgan de Alumnos; Equipo/
// Uniformes/Entrenamientos de Más; Pago de Cartera).
export const TAB_DE_VISTA: Record<RutaAdmin['vista'], TabId> = {
  dashboard: 'dashboard',
  alumnos: 'alumnos',
  ficha: 'alumnos',
  alumnoNuevo: 'alumnos',
  alumnoEditar: 'alumnos',
  cartera: 'cartera',
  pago: 'cartera',
  uniformes: 'mas',
  uniformeEntrega: 'alumnos',
  mas: 'mas',
  equipo: 'mas',
  entrenamientos: 'mas',
  entrenos: 'mas',
  sesion: 'mas',
  plantel: 'mas',
};

export const RUTA_DE_TAB: Record<TabId, RutaAdmin> = {
  dashboard: { vista: 'dashboard' },
  alumnos: { vista: 'alumnos' },
  cartera: { vista: 'cartera' },
  mas: { vista: 'mas' },
  entrenos: { vista: 'entrenos' },
  plantel: { vista: 'plantel' },
};
