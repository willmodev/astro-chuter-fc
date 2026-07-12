// Tarifas del club como constantes de dominio. HU-7.3 (tarifas configurables)
// es `Could` y quedó fuera; cuando llegue la BD, migran a la tabla `tarifas`.
// Aclaración del cliente (2026-07-10): el descuento de hermanos es del UNIFORME,
// no de la mensualidad. Mensualidad $50.000 fija para todos (R2).

export const CUOTA_MENSUAL = 50000;
export const PRECIO_UNIFORME = 100000;
export const PRECIO_UNIFORME_HERMANO = 80000;

/** Precio del uniforme según R9: $100.000, u $80.000 c/u si el alumno tiene hermanos. */
export function precioUniforme(esHermano: boolean): number {
  return esHermano ? PRECIO_UNIFORME_HERMANO : PRECIO_UNIFORME;
}
