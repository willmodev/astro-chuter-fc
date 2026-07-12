// Store mock mutable en memoria — única fuente reactiva del admin mientras no
// hay BD/Actions. Contrato estable (`getAlumnos`/`registrarPago`/`subscribe`):
// cuando llegue la BD real, los hooks migran a las Actions sin cambiar de forma.
// Al recargar la página vuelve al mock base (no hay persistencia).
import { normaliza, type DatosAlumnoInput } from '@/lib/domain/alumnos';
import { esMesCobrable, statesIniciales } from '@/lib/domain/cartera';
import { ANIO_TEMPORADA, subDeAnio } from '@/lib/domain/categoria';
import { CUOTA_MENSUAL } from '@/lib/domain/precios';

import { CURRENT, MONTHS, students } from './mock';
import type { Alumno } from './types';

export type MetodoPago = 'efectivo' | 'transferencia';

// Núcleo del form + dirección opcional. Reutiliza el contrato validable del
// dominio para no duplicar la forma (migra igual a Actions).
export interface DatosAlumno extends DatosAlumnoInput {
  dir?: string;
}

let alumnos: Alumno[] = students;
let secuencia = students.reduce((max, a) => Math.max(max, a.id), 0) + 1;
const listeners = new Set<() => void>();

function notificar(): void {
  listeners.forEach((listener) => listener());
}

export function getAlumnos(): Alumno[] {
  return alumnos;
}

// Por cada mes cobrable (`due`/`pending`) lo pasa a `paid`; ignora `na`/`paid`.
// `metodo` es parte del contrato estable (la Action real lo persistirá); el mock
// aún no guarda el método de pago, por eso no se lee aquí.
export function registrarPago(
  alumnoId: number,
  meses: number[],
  metodo: MetodoPago,
): void {
  alumnos = alumnos.map((alumno) => {
    if (alumno.id !== alumnoId) return alumno;
    const states = alumno.states.map((estado, i) =>
      meses.includes(i) && esMesCobrable(estado) ? 'paid' : estado,
    );
    return { ...alumno, states };
  });
  notificar();
}

// Ingreso = mes vivo de la temporada (coherente con la cartera): "Jun 2026".
function mesDeIngreso(): string {
  const abr = MONTHS[CURRENT] ?? 'FEB';
  return `${abr.charAt(0)}${abr.slice(1).toLowerCase()} ${ANIO_TEMPORADA}`;
}

// Recalcula `hermanos` (nº de alumnos del mismo acudiente normalizado) para los
// grupos afectados. Al editar se pasan el acudiente previo y el nuevo.
function recalcularHermanos(...keys: string[]): void {
  const objetivo = new Set(keys.filter((k) => k !== ''));
  if (objetivo.size === 0) return;
  alumnos = alumnos.map((a) => {
    const key = normaliza(a.acu);
    if (!objetivo.has(key)) return a;
    const total = alumnos.filter((o) => normaliza(o.acu) === key).length;
    return a.hermanos === total ? a : { ...a, hermanos: total };
  });
}

// Inscribir: deriva categoría (R1), cuota fija (R2), states sin mora y uniforme
// pendiente. Devuelve el id nuevo. Asume `datos` ya validados por el dominio.
export function registrarAlumno(datos: DatosAlumno): number {
  const cat = subDeAnio(datos.anio);
  if (cat === null) throw new Error(`Año fuera de categoría: ${datos.anio}`);
  const id = secuencia++;
  const nuevo: Alumno = {
    id,
    name: datos.name.trim(),
    cat,
    anio: datos.anio,
    doc: datos.doc.trim(),
    acu: datos.acu.trim(),
    phone: datos.phone.trim(),
    dir: datos.dir?.trim() ?? '',
    desde: mesDeIngreso(),
    cuota: CUOTA_MENSUAL,
    hermanos: 1,
    uniforme: 'pendiente',
    uniformePago: 'pendiente',
    numero: null,
    tipoKit: null,
    talla: cat.replace('SUB ', ''),
    states: statesIniciales(CURRENT),
  };
  alumnos = [...alumnos, nuevo];
  recalcularHermanos(normaliza(nuevo.acu));
  notificar();
  return id;
}

// Editar: recalcula categoría si cambió el año; preserva datos de uniforme/pagos.
export function actualizarAlumno(id: number, datos: DatosAlumno): void {
  const cat = subDeAnio(datos.anio);
  if (cat === null) throw new Error(`Año fuera de categoría: ${datos.anio}`);
  const acuPrevio = normaliza(alumnos.find((a) => a.id === id)?.acu ?? '');
  alumnos = alumnos.map((a) =>
    a.id === id
      ? {
          ...a,
          name: datos.name.trim(),
          cat,
          anio: datos.anio,
          doc: datos.doc.trim(),
          acu: datos.acu.trim(),
          phone: datos.phone.trim(),
          dir: datos.dir?.trim() ?? a.dir,
        }
      : a,
  );
  recalcularHermanos(acuPrevio, normaliza(datos.acu));
  notificar();
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
