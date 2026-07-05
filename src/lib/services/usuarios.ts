import { auth } from '@/lib/auth/server';
import { listarUsuarios, type UsuarioRepo } from '@/lib/db/repos/usuarios';
import {
  normalizaCats,
  puedeDesactivar,
  UsuarioReglaError,
  type UsuarioDominio,
} from '@/lib/domain/usuarios';
import type {
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

export async function crearUsuario(
  headers: Headers,
  input: NuevoUsuarioInput,
): Promise<void> {
  const cats = normalizaCats(input.role, input.cats);
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
