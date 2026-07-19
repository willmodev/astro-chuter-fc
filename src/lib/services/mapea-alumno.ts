// Mapeo fila BD → contrato de UI (`Alumno` / `AlumnoPlantel`), derivando los
// estados de cada mes con el dominio. Aislado del resto del service para que
// ninguno de los dos archivos pase de 200 líneas.
import { estadoDelMes, MESES, MESES_VISIBLES } from '@/lib/domain/cartera';
import type { EstadoMes, Mes } from '@/lib/domain/cartera';
import { subDeAnio } from '@/lib/domain/categoria';
import { CUOTA_MENSUAL, precioUniforme } from '@/lib/domain/precios';
import { estadoKit, KITS, saldoKit } from '@/lib/domain/uniformes';

import type { AlumnoRow } from '@/lib/db/repos/alumnos';
import type { UniformeRow } from '@/lib/db/repos/uniformes';
import type {
  Alumno,
  AlumnoPlantel,
  KitUniforme,
} from '@/features/admin/data/types';

// 'YYYY-MM-DD' → Date en zona local (sin corrimiento de zona horaria).
export function parseFechaLocal(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

const cap = (mes: Mes): string => mes.charAt(0) + mes.slice(1).toLowerCase();

// "Abr 2026" a partir de la fecha de ingreso.
function desdeDe(fechaInicio: string): string {
  const f = parseFechaLocal(fechaInicio);
  return `${cap(MESES[f.getMonth()])} ${f.getFullYear()}`;
}

const catDe = (row: AlumnoRow): string => subDeAnio(row.anioNacimiento) ?? '—';

function statesDe(
  row: AlumnoRow,
  pagados: ReadonlySet<Mes>,
  anio: number,
  hoy: Date,
): EstadoMes[] {
  const fechaInicio = parseFechaLocal(row.fechaInicio);
  return MESES_VISIBLES.map((mes) =>
    estadoDelMes({ anio, mes, pagado: pagados.has(mes), fechaInicio, hoy }),
  );
}

// Los dos kits del alumno con estado y saldo derivados en dominio (spec 12).
// Kit sin fila en BD → valores por defecto (sin iniciar).
function construyeKits(
  rows: readonly UniformeRow[],
  esHermano: boolean,
): KitUniforme[] {
  const precio = precioUniforme(esHermano);
  return KITS.map((kit) => {
    const row = rows.find((r) => r.kit === kit);
    const entregado = row?.entregado ?? false;
    const abonadoCop = row?.abonadoCop ?? 0;
    return {
      kit,
      entregado,
      numero: row?.numero ?? null,
      talla: row?.talla ?? '',
      abonadoCop,
      precio,
      estado: estadoKit(entregado, abonadoCop, precio),
      saldo: saldoKit(abonadoCop, precio),
    };
  });
}

// Datos para armar un `Alumno` (objeto para no pasar de 4 params, regla del repo).
export interface DatosMapeoAlumno {
  row: AlumnoRow;
  pagados: ReadonlySet<Mes>;
  hermanos: number;
  kits: readonly UniformeRow[];
  anio: number;
  hoy: Date;
}

// Alumno completo del admin (con dinero: cuota + estados + kits derivados).
export function aAlumno(d: DatosMapeoAlumno): Alumno {
  const { row, pagados, hermanos, kits, anio, hoy } = d;
  return {
    id: row.id,
    name: row.nombre,
    cat: catDe(row),
    anio: row.anioNacimiento,
    fechaNacimiento: row.fechaNacimiento,
    doc: row.documento,
    acu: row.acudiente,
    phone: row.celular,
    dir: row.direccion,
    desde: desdeDe(row.fechaInicio),
    cuota: CUOTA_MENSUAL,
    hermanos,
    kits: construyeKits(kits, hermanos > 1),
    states: statesDe(row, pagados, anio, hoy),
  };
}

// Vista del entrenador: identidad + contacto, sin un solo campo de dinero.
export function aPlantel(row: AlumnoRow, hermanos: number): AlumnoPlantel {
  return {
    id: row.id,
    name: row.nombre,
    cat: catDe(row),
    anio: row.anioNacimiento,
    doc: row.documento,
    acu: row.acudiente,
    phone: row.celular,
    dir: row.direccion,
    desde: desdeDe(row.fechaInicio),
    hermanos,
  };
}
