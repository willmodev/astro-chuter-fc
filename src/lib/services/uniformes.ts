// Orquestación de uniformes: arma la vista por alumno (dos kits + estado + saldo
// derivados en dominio) y persiste entregas/abonos. Filtro por rol en servidor:
// el entrenador ve la entrega, nunca montos ni estado de pago (spec 12).
import {
  fijarAbono,
  todosUniformes,
  uniformesDeAlumno,
  upsertEntrega,
} from '@/lib/db/repos/uniformes';
import type { UniformeRow } from '@/lib/db/repos/uniformes';
import { AlumnoReglaError } from '@/lib/domain/alumnos';
import { precioUniforme } from '@/lib/domain/precios';
import { estadoKit, KITS, saldoKit } from '@/lib/domain/uniformes';
import type { TipoKit } from '@/lib/domain/uniformes';

import type { Alumno } from '@/features/admin/data/types';
import type {
  KitEntrega,
  KitUniforme,
  UniformeAlumno,
  UniformeAlumnoEntrenador,
} from '@/features/admin/data/types';

import { construirAlumnos } from './alumnos';

// alumnoId → sus filas de uniforme (0..2).
function indice(rows: UniformeRow[]): Map<number, UniformeRow[]> {
  const idx = new Map<number, UniformeRow[]>();
  for (const r of rows) {
    const arr = idx.get(r.alumnoId) ?? [];
    arr.push(r);
    idx.set(r.alumnoId, arr);
  }
  return idx;
}

// Los dos kits del alumno con dinero: usa la fila real o un kit vacío por defecto.
function kitsDe(rows: UniformeRow[], esHermano: boolean): KitUniforme[] {
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

// Los dos kits sin dinero (entrenador): solo la entrega.
function kitsEntregaDe(rows: UniformeRow[]): KitEntrega[] {
  return KITS.map((kit) => {
    const row = rows.find((r) => r.kit === kit);
    return {
      kit,
      entregado: row?.entregado ?? false,
      numero: row?.numero ?? null,
      talla: row?.talla ?? '',
    };
  });
}

// Admin: los dos kits con dinero por cada alumno.
export async function listarUniformesAdmin(
  hoy: Date,
): Promise<UniformeAlumno[]> {
  const [{ alumnos }, rows] = await Promise.all([
    construirAlumnos(hoy),
    todosUniformes(),
  ]);
  const idx = indice(rows);
  return alumnos.map((a) => ({
    alumnoId: a.id,
    nombre: a.name,
    cat: a.cat,
    kits: kitsDe(idx.get(a.id) ?? [], a.hermanos > 1),
  }));
}

// Entrenador: solo sus categorías, contrato SIN dinero (solo entrega).
export async function listarUniformesEntrenador(
  hoy: Date,
  cats: readonly string[],
): Promise<UniformeAlumnoEntrenador[]> {
  const [{ alumnos }, rows] = await Promise.all([
    construirAlumnos(hoy),
    todosUniformes(),
  ]);
  const idx = indice(rows);
  const permitidas = new Set(cats);
  return alumnos
    .filter((a) => permitidas.has(a.cat))
    .map((a) => ({
      alumnoId: a.id,
      nombre: a.name,
      cat: a.cat,
      kits: kitsEntregaDe(idx.get(a.id) ?? []),
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
