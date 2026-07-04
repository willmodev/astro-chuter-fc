// Tipos que espejan `window.MOCK` del prototipo y que luego cumplirán las
// Actions reales. Nomenclatura SUB 4–16 tal cual el prototipo.
// `EstadoMes` es propiedad de la capa de dominio (fuente única).
import type { EstadoMes } from '@/lib/domain/cartera';

export type { EstadoMes };

export interface Alumno {
  id: number;
  name: string;
  cat: string; // "SUB 10"
  anio: number; // año de nacimiento
  doc: string;
  acu: string; // acudiente
  phone: string; // "301 521 6830"
  dir: string;
  desde: string; // "Feb 2024"
  cuota: number; // COP
  hermanos: number;
  uniforme: 'entregado' | 'pendiente';
  uniformePago: 'pagado' | 'pendiente';
  numero: number | null;
  tipoKit: 'AZUL' | 'DORADO' | null;
  talla: string;
  states: EstadoMes[]; // 11 meses FEB..DIC
}

export interface Cumple {
  name: string;
  cat: string;
  fecha: string;
  dias: number;
}

export interface Training {
  day: string;
  cat: string;
  focus: string;
  coach: string;
  time: string;
}

export interface Stats {
  active: number;
  upToDate: number;
  morosos: number;
  pctUpToDate: number;
  recaudo: number;
  recaudoMes: number;
  carteraVencida: number;
  metaMes: number;
  pctMeta: number;
}
