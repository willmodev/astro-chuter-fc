import type { RutaAdmin } from './types';

// Conversión pura pathname ↔ RutaAdmin. Parseo defensivo: cualquier ruta
// desconocida cae al dashboard y un :id no numérico cae a la lista de
// alumnos (un id numérico inexistente lo resuelve la Ficha con su estado
// "Alumno no encontrado").
export function parseRuta(pathname: string): RutaAdmin {
  const [raiz, vista, id, ...resto] = pathname.split('/').filter(Boolean);

  if (raiz !== 'admin' || resto.length > 0) return { vista: 'dashboard' };
  if (vista === undefined) return { vista: 'dashboard' };

  if (vista === 'alumnos') {
    if (id === undefined) return { vista: 'alumnos' };
    const alumnoId = Number(id);
    return Number.isInteger(alumnoId) && alumnoId > 0
      ? { vista: 'ficha', alumnoId }
      : { vista: 'alumnos' };
  }

  if (id !== undefined) return { vista: 'dashboard' };
  if (vista === 'cartera' || vista === 'mas' || vista === 'equipo') {
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
    default:
      return `/admin/${ruta.vista}`;
  }
}
