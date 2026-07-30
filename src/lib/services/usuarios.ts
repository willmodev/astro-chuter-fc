import { auth } from '@/lib/auth/server';
import {
  categoriasOcupadas,
  listarUsuarios,
  type UsuarioRepo,
} from '@/lib/db/repos/usuarios';
import { listarCategorias } from '@/lib/domain/categoria';
import {
  normalizaCats,
  puedeDesactivar,
  UsuarioReglaError,
  validaDisponibles,
  type UsuarioDominio,
} from '@/lib/domain/usuarios';
import type {
  CategoriaAsignable,
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
