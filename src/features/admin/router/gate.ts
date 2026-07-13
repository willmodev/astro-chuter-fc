import type { Rol } from '@/lib/domain/usuarios';

import type { RutaAdmin } from './types';

// Vistas que puede montar el entrenador (la ficha va en modo readOnly, spec 09).
const VISTAS_ENTRENADOR: ReadonlySet<RutaAdmin['vista']> = new Set([
  'entrenos',
  'sesion',
  'plantel',
  'ficha',
  'mas',
]);

// Vistas exclusivas del entrenador; el admin ve lo registrado en 'entrenamientos'.
const VISTAS_SOLO_ENTRENADOR: ReadonlySet<RutaAdmin['vista']> = new Set([
  'entrenos',
  'sesion',
  'plantel',
]);

/** Gate por rol: una vista prohibida cae a la home equivalente del rol. */
export function aplicarGate(ruta: RutaAdmin, role: Rol): RutaAdmin {
  if (role === 'entrenador' && !VISTAS_ENTRENADOR.has(ruta.vista)) {
    return { vista: 'entrenos' };
  }
  if (role === 'admin' && VISTAS_SOLO_ENTRENADOR.has(ruta.vista)) {
    return { vista: 'entrenamientos' };
  }
  return ruta;
}
