import { normaliza } from '@/lib/domain/alumnos';
import { DIAS_ENTRENO, type DiaEntreno } from '@/lib/domain/entrenos';

import type { RutaAdmin } from './types';

// El día viaja en la URL como slug sin acentos ("Miércoles" ↔ "miercoles").
function diaDeSlug(slug: string): DiaEntreno | null {
  return DIAS_ENTRENO.find((d) => normaliza(d) === slug) ?? null;
}

const WEEK_ID = /^w-\d+$/;

// Vistas sin parámetros: /admin/<vista> y nada más.
type VistaSimple =
  | 'cartera'
  | 'mas'
  | 'equipo'
  | 'uniformes'
  | 'plantel'
  | 'entrenamientos';

const VISTAS_SIMPLES = new Set<string>([
  'cartera',
  'mas',
  'equipo',
  'uniformes',
  'plantel',
  'entrenamientos',
]);

function esVistaSimple(vista: string): vista is VistaSimple {
  return VISTAS_SIMPLES.has(vista);
}

// /admin/alumnos/:id/<sub>
const SUB_ALUMNO = new Map<string, 'pago' | 'alumnoEditar' | 'uniformeEntrega'>(
  [
    ['pago', 'pago'],
    ['editar', 'alumnoEditar'],
    ['uniforme', 'uniformeEntrega'],
  ],
);

// Un :id no numérico cae a la lista (un id numérico inexistente lo resuelve
// la Ficha con su estado "Alumno no encontrado").
function parseAlumnos(id?: string, sub?: string): RutaAdmin {
  // "nuevo" se resuelve antes que :id (no es un id numérico).
  if (id === 'nuevo') return { vista: 'alumnoNuevo' };
  if (id === undefined) return { vista: 'alumnos' };

  const alumnoId = Number(id);
  if (!Number.isInteger(alumnoId) || alumnoId <= 0) return { vista: 'alumnos' };
  if (sub === undefined) return { vista: 'ficha', alumnoId };

  const vista = SUB_ALUMNO.get(sub);
  return vista === undefined ? { vista: 'alumnos' } : { vista, alumnoId };
}

// /admin/entrenos/:weekId/:day — semana o día inválidos caen a entrenos.
function parseEntrenos(id?: string, sub?: string): RutaAdmin {
  if (id === undefined) return { vista: 'entrenos' };

  const day = sub === undefined ? null : diaDeSlug(sub);
  if (WEEK_ID.test(id) && day !== null) {
    return { vista: 'sesion', weekId: id, day };
  }
  return { vista: 'entrenos' };
}

// Conversión pura pathname ↔ RutaAdmin. Parseo defensivo: cualquier ruta
// desconocida cae al dashboard.
export function parseRuta(pathname: string): RutaAdmin {
  // `split` devuelve `string[]`, pero los índices que no existen valen
  // `undefined` en runtime: se tipa explícito para no perder esa verdad.
  const partes: (string | undefined)[] = pathname.split('/').filter(Boolean);
  const [raiz, vista, id, sub, ...resto] = partes;

  if (raiz !== 'admin' || resto.length > 0) return { vista: 'dashboard' };
  if (vista === undefined) return { vista: 'dashboard' };

  if (vista === 'alumnos') return parseAlumnos(id, sub);
  if (vista === 'entrenos') return parseEntrenos(id, sub);

  if (id !== undefined) return { vista: 'dashboard' };
  return esVistaSimple(vista) ? { vista } : { vista: 'dashboard' };
}

export function rutaAPath(ruta: RutaAdmin): string {
  switch (ruta.vista) {
    case 'dashboard':
      return '/admin';
    case 'ficha':
      return `/admin/alumnos/${String(ruta.alumnoId)}`;
    case 'alumnoNuevo':
      return '/admin/alumnos/nuevo';
    case 'alumnoEditar':
      return `/admin/alumnos/${String(ruta.alumnoId)}/editar`;
    case 'pago':
      return `/admin/alumnos/${String(ruta.alumnoId)}/pago`;
    case 'uniformeEntrega':
      return `/admin/alumnos/${String(ruta.alumnoId)}/uniforme`;
    case 'sesion':
      return `/admin/entrenos/${ruta.weekId}/${normaliza(ruta.day)}`;
    default:
      return `/admin/${ruta.vista}`;
  }
}
