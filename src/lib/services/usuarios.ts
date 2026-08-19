import { auth } from '@/lib/auth/server';
import {
  actualizarCats,
  categoriasOcupadas,
  listarUsuarios,
  type UsuarioRepo,
} from '@/lib/db/repos/usuarios';
import { listarCategorias } from '@/lib/domain/categoria';
import {
  cambiosDeCats,
  emailDisponible,
  normalizaCats,
  puedeDesactivar,
  UsuarioReglaError,
  validaDisponibles,
  type UsuarioAsignable,
  type UsuarioDominio,
} from '@/lib/domain/usuarios';
import type {
  CategoriaAsignable,
  EditarUsuarioInput,
  NuevoUsuarioInput,
  UsuarioRow,
} from '@/features/admin/screens/equipo/types';

function aRow(u: UsuarioRepo): UsuarioRow {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    activo: !u.banned,
    cats: u.cats,
  };
}

function aDominio(u: UsuarioRepo): UsuarioDominio {
  return { id: u.id, role: u.role, activo: !u.banned };
}

export async function listarEquipo(): Promise<UsuarioRow[]> {
  const usuarios = await listarUsuarios();
  return usuarios.map(aRow);
}

/**
 * Las 7 categorías con quién las tiene hoy: la UI deshabilita las ocupadas.
 * `usuarioId` (edición) excluye al propio usuario de las ocupadas.
 */
export async function listarCategoriasAsignables(
  usuarioId?: string,
): Promise<CategoriaAsignable[]> {
  const usuarios = await listarUsuarios();
  const dueno = new Map<string, string>();
  for (const u of usuarios) {
    if (u.role !== 'entrenador' || u.banned || u.id === usuarioId) continue;
    for (const cat of u.cats) dueno.set(cat, u.name);
  }
  return listarCategorias().map((c) => ({
    etiqueta: c.etiqueta,
    nombre: c.nombre,
    ocupadaPor: dueno.get(c.etiqueta) ?? null,
  }));
}

export async function crearUsuario(
  headers: Headers,
  input: NuevoUsuarioInput,
): Promise<void> {
  const cats = normalizaCats(input.role, input.cats);
  // La disponibilidad se lee dentro de la misma operación de escritura: si dos
  // admins asignan a la vez, el segundo falla con mensaje claro.
  if (cats.length > 0) validaDisponibles(cats, await categoriasOcupadas());
  await auth.api.createUser({
    headers,
    body: {
      email: input.email,
      password: input.password,
      name: input.name,
      role: input.role,
      data: { cats },
    },
  });
}

export async function cambiarActivo(
  headers: Headers,
  actorId: string,
  targetId: string,
  activar: boolean,
): Promise<void> {
  const usuarios = await listarUsuarios();
  const target = usuarios.find((u) => u.id === targetId);
  if (!target) {
    throw new UsuarioReglaError('El usuario ya no existe.');
  }

  if (!activar) {
    const dominio = usuarios.map(aDominio);
    if (!puedeDesactivar(actorId, aDominio(target), dominio)) {
      throw new UsuarioReglaError(
        target.id === actorId
          ? 'No podés desactivarte a vos mismo.'
          : 'No podés dejar al club sin un administrador activo.',
      );
    }
    await auth.api.banUser({ headers, body: { userId: targetId } });
    return;
  }

  await auth.api.unbanUser({ headers, body: { userId: targetId } });
}

export async function resetearPassword(
  headers: Headers,
  userId: string,
  newPassword: string,
): Promise<void> {
  await auth.api.setUserPassword({
    headers,
    body: { userId, newPassword },
  });
}

function aAsignable(u: UsuarioRepo): UsuarioAsignable {
  return {
    id: u.id,
    name: u.name,
    role: u.role,
    activo: !u.banned,
    cats: u.cats,
  };
}

// Las categorías solo se tocan en un entrenador activo: en un admin no aplican
// y en un inactivo crearían un duplicado al reactivarlo.
function catsAEscribir(
  target: UsuarioRepo,
  pedidas: readonly string[],
): string[] | null {
  if (target.role === 'admin' || target.banned) return null;
  return normalizaCats('entrenador', pedidas);
}

/**
 * Edita nombre, correo y categorías. Marcar una categoría de otro entrenador
 * activo se la quita a esa persona en la misma escritura (spec 21).
 */
export async function editarUsuario(
  headers: Headers,
  input: EditarUsuarioInput,
): Promise<void> {
  const usuarios = await listarUsuarios();
  const target = usuarios.find((u) => u.id === input.userId);
  if (!target) {
    throw new UsuarioReglaError('El usuario ya no existe.');
  }

  const email = input.email.trim();
  if (!emailDisponible(usuarios, target.id, email)) {
    throw new UsuarioReglaError(
      'Ese correo ya lo usa otro usuario del equipo.',
    );
  }

  // Primero las categorías: es la parte que puede dejar datos inconsistentes.
  const cats = catsAEscribir(target, input.cats);
  if (cats !== null) {
    await actualizarCats(
      cambiosDeCats(cats, usuarios.map(aAsignable), target.id),
    );
  }

  await auth.api.adminUpdateUser({
    headers,
    body: { userId: target.id, data: { name: input.name.trim(), email } },
  });
}
