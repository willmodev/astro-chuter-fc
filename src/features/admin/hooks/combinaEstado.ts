import type { EstadoCargaValor } from '../chrome/EstadoCarga';

// Combina dos estados de carga: error gana, luego cargando, luego listo.
export function combinaEstado(
  a: EstadoCargaValor,
  b: EstadoCargaValor,
): EstadoCargaValor {
  if (a === 'error' || b === 'error') return 'error';
  if (a === 'cargando' || b === 'cargando') return 'cargando';
  return 'listo';
}
