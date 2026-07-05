import { asc } from 'drizzle-orm';

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
