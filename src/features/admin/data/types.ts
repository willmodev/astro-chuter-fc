// Tipos que espejan `window.MOCK` del prototipo y que luego cumplirán las
// Actions reales. Nomenclatura SUB 4–16 tal cual el prototipo.
// `EstadoMes` y `Semana`/`DiaEntreno` son propiedad del dominio (fuente única).
import type { EstadoMes } from '@/lib/domain/cartera';
import type { Cumple } from '@/lib/domain/cumples';
import type { DiaEntreno, Semana } from '@/lib/domain/entrenos';

export type { EstadoMes, DiaEntreno, Semana, Cumple };

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
  states: EstadoMes[]; // una entrada por mes visible (ENE..MES_FIN_COBRO)
}

// Vista del entrenador: identidad + contacto SIN datos de dinero (cuota,
// estados de pago, saldo). El service nunca envía más que esto a un entrenador
// (seguridad por rol en servidor, spec 11).
export interface AlumnoPlantel {
  id: number;
  name: string;
  cat: string;
  anio: number;
  doc: string;
  acu: string;
  phone: string;
  dir: string;
  desde: string;
}

export interface Training {
  day: string;
  cat: string;
  focus: string;
  coach: string;
  time: string;
}

// Cabecera del Excel de planeación: tema + objetivos por semana y entrenador.
export interface PlanSemana {
  id: string; // `${entrenadorId}-${weekId}`
  entrenadorId: string; // user.id de Better Auth
  entrenadorNombre: string; // denormalizado (mock); en BD será FK
  weekId: string;
  tema: string;
  objetivos: string;
}

// Un día de entrenamiento: parte central (imagen TactalPad) + asistencia.
export interface Sesion {
  id: string; // `${entrenadorId}-${weekId}-${day}`
  entrenadorId: string;
  entrenadorNombre: string; // denormalizado (mock); en BD será FK
  weekId: string;
  day: DiaEntreno;
  parteCentralImg: string | null; // object URL local (mock); URL de Blob al persistir
  parteCentralNota: string; // texto corto opcional de respaldo
  ausentes: number[] | null; // null = lista NO pasada; [] = pasada, todos presentes
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
