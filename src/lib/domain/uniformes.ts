// Reglas puras de uniformes — capa de dominio, sin UI ni datos.
// Alimentan la alerta de la pantalla Uniformes (HU-5.2), la advertencia del
// form de entrega (HU-5.3) y el modelo de 4 estados (spec 08).

export type TipoKit = 'AZUL' | 'DORADO';

// Los dos ejes independientes de un uniforme (espejan `Alumno`).
export type EjeEntrega = 'entregado' | 'pendiente';
export type EjePago = 'pagado' | 'pendiente';

// Estado derivado del cruce de los dos ejes (entrega × pago).
export type EstadoUniforme = 'completo' | 'porEntregar' | 'porCobrar' | 'sinIniciar';

/**
 * Estado del uniforme a partir de sus dos ejes (spec 08). e = entregado, p = pagado:
 *   e && p  → 'completo'    (entregado y pagado)
 *  !e && p  → 'porEntregar' (pagó · falta entregar)
 *   e && !p → 'porCobrar'   (entregado · falta el pago → etiqueta "Pago pendiente")
 *  !e && !p → 'sinIniciar'  (sin pagar ni entregar)
 */
export function estadoUniforme(
  uniforme: EjeEntrega,
  uniformePago: EjePago,
): EstadoUniforme {
  const entregado = uniforme === 'entregado';
  const pagado = uniformePago === 'pagado';
  if (entregado && pagado) return 'completo';
  if (!entregado && pagado) return 'porEntregar';
  if (entregado && !pagado) return 'porCobrar';
  return 'sinIniciar';
}

// Tono del design system por estado (mapea a los `tone` del Badge).
type TonoEstado = 'paid' | 'info' | 'due' | 'pending';

// Metadatos presentacionales por estado: label, descripción y tono. La etiqueta
// de `porCobrar` es "Pago pendiente" (no "Por cobrar"): esta deuda de uniforme
// NO entra a cartera, así el admin no la busca ahí.
export const ESTADO_UNIFORME_META: Record<
  EstadoUniforme,
  { label: string; desc: string; tone: TonoEstado }
> = {
  completo: { label: 'Completo', desc: 'Entregado y pagado', tone: 'paid' },
  porEntregar: { label: 'Por entregar', desc: 'Pagó · falta entregar', tone: 'info' },
  porCobrar: { label: 'Pago pendiente', desc: 'Entregado · falta el pago', tone: 'due' },
  sinIniciar: { label: 'Sin iniciar', desc: 'Sin pagar ni entregar', tone: 'pending' },
};

// Orden por prioridad de acción para la lista del tab Estado. `porCobrar`
// primero: mercancía entregada sin pagar = plata en riesgo real (máxima
// urgencia); la pagada sin entregar es menor riesgo (el club ya tiene el dinero).
export const ORDEN_ESTADO_UNIFORME: readonly EstadoUniforme[] = [
  'porCobrar',
  'porEntregar',
  'sinIniciar',
  'completo',
];

// Subconjunto estructural que necesita la regla. `Alumno` (capa de datos) lo
// cumple, sin que el dominio dependa de la capa de features.
interface AlumnoUniforme {
  numero: number | null;
  tipoKit: TipoKit | null;
}

interface AlumnoUniformeId extends AlumnoUniforme {
  id: number;
}

/**
 * Números repetidos dentro de un kit (R6): los que aparecen en 2+ alumnos con
 * uniforme del mismo `kit`. Ordenados ascendente. Ignora `numero`/`tipoKit` nulos.
 */
export function numerosDuplicados(
  alumnos: readonly AlumnoUniforme[],
  kit: TipoKit,
): number[] {
  const conteo = new Map<number, number>();
  for (const a of alumnos) {
    if (a.tipoKit === kit && a.numero !== null) {
      conteo.set(a.numero, (conteo.get(a.numero) ?? 0) + 1);
    }
  }
  return [...conteo.entries()]
    .filter(([, n]) => n > 1)
    .map(([numero]) => numero)
    .sort((a, b) => a - b);
}

/**
 * ¿El `numero` ya está usado en ese `kit` por otro alumno? (excluye `idActual`).
 * Alimenta la advertencia no bloqueante del form de entrega (HU-5.3).
 */
export function numeroOcupado(
  alumnos: readonly AlumnoUniformeId[],
  kit: TipoKit,
  numero: number,
  idActual?: number,
): boolean {
  return alumnos.some(
    (a) => a.id !== idActual && a.tipoKit === kit && a.numero === numero,
  );
}
