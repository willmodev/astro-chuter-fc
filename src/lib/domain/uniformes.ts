// Reglas puras de uniformes — capa de dominio, sin UI ni datos.
// Modelo real (spec 12): dos kits por alumno (AZUL/ORO), 4 estados por kit
// (entrega × pago) y pago tri-estado derivado del abono vs precio del kit.

export type TipoKit = 'AZUL' | 'ORO';

// Los dos kits que tiene cada alumno, en orden de presentación.
export const KITS: readonly TipoKit[] = ['AZUL', 'ORO'];

// Eje de pago tri-estado, derivado del abono vs el precio del kit (spec 12):
// sin pagar (0) · abonado (parcial) · pagado (≥ precio).
export type EjePago = 'pagado' | 'abonado' | 'pendiente';

// Estado derivado del cruce de entrega × pago. Un abono parcial NO es "pagado":
// cae en `porCobrar`/`sinIniciar` según la entrega.
export type EstadoKit = 'completo' | 'porEntregar' | 'porCobrar' | 'sinIniciar';

// Alias conservado del spec 08: el estado es el mismo, ahora razonado por kit.
export type EstadoUniforme = EstadoKit;

/** Eje de pago del kit a partir del abono vs el precio (spec 12). */
export function ejePago(abonadoCop: number, precio: number): EjePago {
  if (abonadoCop >= precio) return 'pagado';
  if (abonadoCop > 0) return 'abonado';
  return 'pendiente';
}

/** Saldo pendiente del kit (precio − abono), acotado a [0, precio]. */
export function saldoKit(abonadoCop: number, precio: number): number {
  const acotado = Math.min(Math.max(abonadoCop, 0), precio);
  return precio - acotado;
}

/**
 * Estado del kit a partir de entrega + abono vs precio. e = entregado,
 * p = pagado (abono ≥ precio; un abono parcial NO cuenta como pagado):
 *   e && p  → 'completo'    (entregado y pagado)
 *  !e && p  → 'porEntregar' (pagó · falta entregar)
 *   e && !p → 'porCobrar'   (entregado · falta el pago → "Pago pendiente")
 *  !e && !p → 'sinIniciar'  (sin pagar ni entregar)
 */
export function estadoKit(
  entregado: boolean,
  abonadoCop: number,
  precio: number,
): EstadoKit {
  const pagado = ejePago(abonadoCop, precio) === 'pagado';
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
  EstadoKit,
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
export const ORDEN_ESTADO_UNIFORME: readonly EstadoKit[] = [
  'porCobrar',
  'porEntregar',
  'sinIniciar',
  'completo',
];

// Subconjunto estructural que necesita la regla de numeración. Un registro de
// kit (capa de datos) lo cumple, sin que el dominio dependa de las features.
interface RegistroKit {
  kit: TipoKit;
  numero: number | null;
}

interface RegistroKitId extends RegistroKit {
  id: number;
}

/**
 * Números repetidos dentro de un kit (R6): los que aparecen en 2+ registros del
 * mismo `kit`. Ordenados ascendente. Ignora `numero` nulo.
 */
export function numerosDuplicados(
  registros: readonly RegistroKit[],
  kit: TipoKit,
): number[] {
  const conteo = new Map<number, number>();
  for (const r of registros) {
    if (r.kit === kit && r.numero !== null) {
      conteo.set(r.numero, (conteo.get(r.numero) ?? 0) + 1);
    }
  }
  return [...conteo.entries()]
    .filter(([, n]) => n > 1)
    .map(([numero]) => numero)
    .sort((a, b) => a - b);
}

/**
 * ¿El `numero` ya está usado en ese `kit` por otro registro? (excluye `idActual`).
 * Alimenta la advertencia no bloqueante del form de entrega (R6).
 */
export function numeroOcupado(
  registros: readonly RegistroKitId[],
  kit: TipoKit,
  numero: number,
  idActual?: number,
): boolean {
  return registros.some(
    (r) => r.id !== idActual && r.kit === kit && r.numero === numero,
  );
}
