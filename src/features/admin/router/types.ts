// Rutas de la isla admin. La URL es la única fuente de verdad de la vista:
// cada variante corresponde a un path bajo /admin/** (ver rutas.ts).
export type RutaAdmin =
  | { vista: 'dashboard' }
  | { vista: 'alumnos' }
  | { vista: 'ficha'; alumnoId: number }
  | { vista: 'cartera' }
  | { vista: 'pago'; alumnoId: number; mes?: number }
  | { vista: 'mas' }
  | { vista: 'equipo' };
