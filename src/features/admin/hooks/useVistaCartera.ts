import { usePreferenciaLocal } from './usePreferenciaLocal';

export type VistaCartera = 'tarjetas' | 'matriz';

const KEY = 'chuter.admin.carteraVista';
const VALORES = ['tarjetas', 'matriz'] as const;

// Preferencia de vista (Tarjetas/Matriz) persistida en localStorage (R7.2).
export function useVistaCartera(): [
  VistaCartera,
  (vista: VistaCartera) => void,
] {
  return usePreferenciaLocal<VistaCartera>(KEY, VALORES, 'tarjetas');
}
