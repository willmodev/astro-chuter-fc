import { ActionError } from 'astro:actions';

import type { AuthUser } from '@/lib/auth/server';

// Exige sesión: si no hay usuario en `locals`, la Action no se ejecuta.
export function requireUser(locals: App.Locals): AuthUser {
  const user = locals.user;
  if (!user) {
    throw new ActionError({
      code: 'UNAUTHORIZED',
      message: 'Necesitás iniciar sesión.',
    });
  }
  return user;
}

// Exige rol admin. Un entrenador que invoque la Action recibe FORBIDDEN.
export function requireAdmin(locals: App.Locals): AuthUser {
  const user = requireUser(locals);
  if (user.role !== 'admin') {
    throw new ActionError({
      code: 'FORBIDDEN',
      message: 'Solo un administrador puede hacer esto.',
    });
  }
  return user;
}

// Exige rol entrenador. El admin es solo lectura en entrenos (diseño spec 09).
export function requireEntrenador(locals: App.Locals): AuthUser {
  const user = requireUser(locals);
  if (user.role !== 'entrenador') {
    throw new ActionError({
      code: 'FORBIDDEN',
      message: 'Solo el entrenador puede registrar sus entrenamientos.',
    });
  }
  return user;
}
