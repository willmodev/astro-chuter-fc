// Orquestación de uniformes: reshapea los kits que ya derivó `construirAlumnos`
// (fuente única en mapea-alumno) y persiste entregas/abonos. Filtro por rol en
// servidor: el entrenador ve la entrega, nunca montos ni estado de pago (spec 12).
import {
  fijarAbono,
  uniformesDeAlumno,
  upsertEntrega,
} from '@/lib/db/repos/uniformes';
import { AlumnoReglaError } from '@/lib/domain/alumnos';
import { precioUniforme } from '@/lib/domain/precios';
import type { TipoKit } from '@/lib/domain/uniformes';

import type { Alumno, KitUniforme } from '@/features/admin/data/types';
import type {
  KitEntrega,
  UniformeAlumno,
  UniformeAlumnoEntrenador,
} from '@/features/admin/data/types';

import { construirAlumnos } from './alumnos';

// Kit con dinero → solo entrega (payload del entrenador, sin un peso).
function aEntrega({ kit, entregado, numero, talla }: KitUniforme): KitEntrega {
  return { kit, entregado, numero, talla };
}

// Admin: los dos kits con dinero por cada alumno.
export async function listarUniformesAdmin(
  hoy: Date,
): Promise<UniformeAlumno[]> {
  const { alumnos } = await construirAlumnos(hoy);
  return alumnos.map((a) => ({
    alumnoId: a.id,
    nombre: a.name,
    cat: a.cat,
    kits: a.kits,
  }));
}

// Entrenador: solo sus categorías, contrato SIN dinero (solo entrega).
export async function listarUniformesEntrenador(
  hoy: Date,
  cats: readonly string[],
): Promise<UniformeAlumnoEntrenador[]> {
  const { alumnos } = await construirAlumnos(hoy);
  const permitidas = new Set(cats);
  return alumnos
    .filter((a) => permitidas.has(a.cat))
    .map((a) => ({
      alumnoId: a.id,
      nombre: a.name,
      cat: a.cat,
      kits: a.kits.map(aEntrega),
    }));
}

async function alumnoOFalla(id: number, hoy: Date): Promise<Alumno> {
  const { alumnos } = await construirAlumnos(hoy);
  const alumno = alumnos.find((a) => a.id === id);
  if (!alumno) throw new AlumnoReglaError('El alumno ya no existe.');
  return alumno;
}

export interface EntregaInput {
  alumnoId: number;
  kit: TipoKit;
  numero: number;
  talla: string;
  registradoPor: string;
}

export async function registrarEntrega(input: EntregaInput): Promise<void> {
  await alumnoOFalla(input.alumnoId, new Date());
  await upsertEntrega(
    input.alumnoId,
    input.kit,
    { entregado: true, numero: input.numero, talla: input.talla.trim() },
    input.registradoPor,
  );
}

export async function anularEntrega(
  alumnoId: number,
  kit: TipoKit,
  registradoPor: string,
): Promise<void> {
  const rows = await uniformesDeAlumno(alumnoId);
  const actual = rows.find((r) => r.kit === kit);
  // Conserva talla y abono; solo revierte la entrega y libera el número.
  await upsertEntrega(
    alumnoId,
    kit,
    { entregado: false, numero: null, talla: actual?.talla ?? '' },
    registradoPor,
  );
}

export interface PagoInput {
  alumnoId: number;
  kit: TipoKit;
  montoCop: number;
  registradoPor: string;
}

// Suma el monto al abono y lo acota a [0, precio del kit]. Devuelve el abono final.
export async function registrarPago(input: PagoInput): Promise<number> {
  const alumno = await alumnoOFalla(input.alumnoId, new Date());
  const precio = precioUniforme(alumno.hermanos > 1);
  const rows = await uniformesDeAlumno(input.alumnoId);
  const previo = rows.find((r) => r.kit === input.kit)?.abonadoCop ?? 0;
  const acotado = Math.min(Math.max(previo + input.montoCop, 0), precio);
  await fijarAbono(input.alumnoId, input.kit, acotado, input.registradoPor);
  return acotado;
}
