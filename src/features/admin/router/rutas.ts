import { normaliza } from '@/lib/domain/alumnos';
import { DIAS_ENTRENO, type DiaEntreno } from '@/lib/domain/entrenos';

import type { RutaAdmin } from './types';

// El día viaja en la URL como slug sin acentos ("Miércoles" ↔ "miercoles").
function diaDeSlug(slug: string): DiaEntreno | null {
  return DIAS_ENTRENO.find((d) => normaliza(d) === slug) ?? null;
}

const WEEK_ID = /^w-\d+$/;

// Conversión pura pathname ↔ RutaAdmin. Parseo defensivo: cualquier ruta
// desconocida cae al dashboard y un :id no numérico cae a la lista de
// alumnos (un id numérico inexistente lo resuelve la Ficha con su estado
// "Alumno no encontrado").
export function parseRuta(pathname: string): RutaAdmin {
  const [raiz, vista, id, sub, ...resto] = pathname.split('/').filter(Boolean);

  if (raiz !== 'admin' || resto.length > 0) return { vista: 'dashboard' };
  if (vista === undefined) return { vista: 'dashboard' };

  if (vista === 'alumnos') {
    // "nuevo" se resuelve antes que :id (no es un id numérico).
    if (id === 'nuevo') return { vista: 'alumnoNuevo' };
    if (id === undefined) return { vista: 'alumnos' };
    const alumnoId = Number(id);
    if (!Number.isInteger(alumnoId) || alumnoId <= 0) return { vista: 'alumnos' };
    if (sub === undefined) return { vista: 'ficha', alumnoId };
    if (sub === 'pago') return { vista: 'pago', alumnoId };
    if (sub === 'editar') return { vista: 'alumnoEditar', alumnoId };
    if (sub === 'uniforme') return { vista: 'uniformeEntrega', alumnoId };
    return { vista: 'alumnos' };
  }

  if (vista === 'entrenos') {
    if (id === undefined) return { vista: 'entrenos' };
    // /admin/entrenos/:weekId/:day — semana o día inválidos caen a entrenos.
    const day = sub === undefined ? null : diaDeSlug(sub);
    if (WEEK_ID.test(id) && day !== null) {
      return { vista: 'sesion', weekId: id, day };
    }
    return { vista: 'entrenos' };
  }

  if (id !== undefined) return { vista: 'dashboard' };
  if (
    vista === 'cartera' ||
    vista === 'mas' ||
    vista === 'equipo' ||
    vista === 'uniformes' ||
    vista === 'plantel' ||
    vista === 'entrenamientos'
  ) {
    return { vista };
  }
  return { vista: 'dashboard' };
}

export function rutaAPath(ruta: RutaAdmin): string {
  switch (ruta.vista) {
    case 'dashboard':
      return '/admin';
    case 'ficha':
      return `/admin/alumnos/${ruta.alumnoId}`;
    case 'alumnoNuevo':
      return '/admin/alumnos/nuevo';
    case 'alumnoEditar':
      return `/admin/alumnos/${ruta.alumnoId}/editar`;
    case 'pago':
      return `/admin/alumnos/${ruta.alumnoId}/pago`;
    case 'uniformeEntrega':
      return `/admin/alumnos/${ruta.alumnoId}/uniforme`;
    case 'sesion':
      return `/admin/entrenos/${ruta.weekId}/${normaliza(ruta.day)}`;
    default:
      return `/admin/${ruta.vista}`;
  }
}
