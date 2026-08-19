import { and, asc, eq, ne } from 'drizzle-orm';

import { db } from '@/lib/db/client';
import { user } from '@/lib/db/schema';

export interface UsuarioRepo {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'entrenador';
  banned: boolean;
  cats: string[];
}

// Lista todos los usuarios (activos e inactivos), ordenados por antigüedad.
// El `role` viene ya acotado por el pgEnum → tipado sin `any`.
export async function listarUsuarios(): Promise<UsuarioRepo[]> {
  return db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      banned: user.banned,
      cats: user.cats,
    })
    .from(user)
    .orderBy(asc(user.createdAt));
}

/**
 * Categorías ya tomadas por entrenadores ACTIVOS (spec 15). Un entrenador
 * desactivado libera las suyas. `excluirUsuarioId` deja fuera al usuario que se
 * está editando, para que sus propias categorías no se le bloqueen.
 */
export async function categoriasOcupadas(
  excluirUsuarioId?: string,
): Promise<string[]> {
  const filas = await db
    .select({ cats: user.cats })
    .from(user)
    .where(
      and(
        eq(user.role, 'entrenador'),
        eq(user.banned, false),
        excluirUsuarioId ? ne(user.id, excluirUsuarioId) : undefined,
      ),
    );
  return filas.flatMap((f) => f.cats);
}

/**
 * Escribe las categorías de varios usuarios de una sola vez. El driver
 * `neon-http` no tiene transacciones interactivas, pero `batch` viaja como una
 * sola transacción del lado de Neon: o se mueven todas, o no se mueve ninguna.
 */
export async function actualizarCats(
  cambios: readonly { userId: string; cats: string[] }[],
): Promise<void> {
  if (cambios.length === 0) return;
  const [primera, ...resto] = cambios.map((c) =>
    db
      .update(user)
      .set({ cats: c.cats, updatedAt: new Date() })
      .where(eq(user.id, c.userId)),
  );
  await db.batch([primera, ...resto]);
}
