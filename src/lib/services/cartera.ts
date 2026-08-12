// Orquestación de cobros: registrar pagos reales. La derivación de estados vive
// en el dominio; aquí solo se decide qué meses son insertables y se persiste.
import { alumnoPorId } from '@/lib/db/repos/alumnos';
import {
  anularPago as anularEnRepo,
  insertarPagos,
  pagosDeAlumno,
} from '@/lib/db/repos/pagos';
import type { NuevoPago } from '@/lib/db/repos/pagos';
import { AlumnoReglaError } from '@/lib/domain/alumnos';
import { esMesCobrable, estadoDelMes } from '@/lib/domain/cartera';
import type { Mes } from '@/lib/domain/cartera';
import { CUOTA_MENSUAL } from '@/lib/domain/precios';

import { parseFechaLocal } from './mapea-alumno';

export interface AnularPagoInput {
  alumnoId: number;
  anio: number;
  mes: Mes;
  motivo: string; // recortado, mínimo 5 caracteres (validado en la Action)
  anuladoPor: string; // id del admin de la sesión
}

export interface RegistrarPagosInput {
  alumnoId: number;
  anio: number;
  meses: Mes[];
  metodo: 'efectivo' | 'transferencia';
  registradoPor: string;
}

// Inserta un pago por cada mes cobrable (due/pending) aún no pagado. Nunca crea
// pagos en meses `na` (quedarían ocultos) ni duplica (constraint + este filtro).
export async function registrarPagos(
  input: RegistrarPagosInput,
): Promise<number> {
  const alumno = await alumnoPorId(input.alumnoId);
  if (!alumno) throw new AlumnoReglaError('El alumno ya no existe.');
  // Un retirado sale de la cartera: no se le cobra (spec 14).
  if (!alumno.activo) {
    throw new AlumnoReglaError(
      'El alumno está retirado. Reactivalo para registrar pagos.',
    );
  }

  const hoy = new Date();
  const fechaInicio = parseFechaLocal(alumno.fechaInicio);
  const yaPagados = new Set(
    (await pagosDeAlumno(input.alumnoId, input.anio)).map((p) => p.mes),
  );

  const filas: NuevoPago[] = input.meses
    .filter((mes) => !yaPagados.has(mes))
    .filter((mes) =>
      esMesCobrable(
        estadoDelMes({
          anio: input.anio,
          mes,
          pagado: false,
          fechaInicio,
          hoy,
        }),
      ),
    )
    .map((mes) => ({
      alumnoId: input.alumnoId,
      anio: input.anio,
      mes,
      montoCop: CUOTA_MENSUAL,
      metodo: input.metodo,
      pagadoEn: hoy,
      registradoPor: input.registradoPor,
    }));

  return insertarPagos(filas);
}

// Anula un pago registrado por error (spec 20). A diferencia de `registrarPagos`
// NO exige que el alumno esté activo: corregir un error no es cobrar. También
// aplica a los pagos de la carga inicial (sin método, fecha ni autor).
export async function anularPago(input: AnularPagoInput): Promise<void> {
  const alumno = await alumnoPorId(input.alumnoId);
  if (!alumno) throw new AlumnoReglaError('El alumno ya no existe.');

  const anulado = await anularEnRepo(input.alumnoId, input.anio, input.mes, {
    anuladoPor: input.anuladoPor,
    motivo: input.motivo.trim(),
    anuladoEn: new Date(), // lo pone el servidor, nunca el cliente
  });
  if (!anulado) {
    throw new AlumnoReglaError('Ese mes no tiene un pago registrado.');
  }
}
