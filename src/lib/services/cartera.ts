// Orquestación de cobros: registrar pagos reales. La derivación de estados vive
// en el dominio; aquí solo se decide qué meses son insertables y se persiste.
import { alumnoPorId } from '@/lib/db/repos/alumnos';
import { insertarPagos, pagosDeAlumno } from '@/lib/db/repos/pagos';
import type { NuevoPago } from '@/lib/db/repos/pagos';
import { AlumnoReglaError } from '@/lib/domain/alumnos';
import { esMesCobrable, estadoDelMes } from '@/lib/domain/cartera';
import type { Mes } from '@/lib/domain/cartera';
import { CUOTA_MENSUAL } from '@/lib/domain/precios';

import { parseFechaLocal } from './mapea-alumno';

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

  const hoy = new Date();
  const fechaInicio = parseFechaLocal(alumno.fechaInicio);
  const yaPagados = new Set(
    (await pagosDeAlumno(input.alumnoId, input.anio)).map((p) => p.mes),
  );

  const filas: NuevoPago[] = input.meses
    .filter((mes) => !yaPagados.has(mes))
    .filter((mes) =>
      esMesCobrable(
        estadoDelMes({ anio: input.anio, mes, pagado: false, fechaInicio, hoy }),
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
