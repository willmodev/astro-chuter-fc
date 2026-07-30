// Reglas puras de gestión de usuarios del admin. Sin dependencias de BD ni
// de la UI: reciben datos planos y devuelven decisiones testeables.
import { categoriaDeEtiqueta, listarCategorias } from './categoria';

export type Rol = 'admin' | 'entrenador';

export interface UsuarioDominio {
  id: string;
  role: Rol;
  activo: boolean;
}

// Error de regla de negocio (p. ej. categoría mal formada). La Action lo
// traduce a un ActionError de transporte.
export class UsuarioReglaError extends Error {}

// El usuario `id` es el único admin activo que quedaría en el club.
export function esUltimoAdmin(
  usuarios: readonly UsuarioDominio[],
  id: string,
): boolean {
  const adminsActivos = usuarios.filter((u) => u.role === 'admin' && u.activo);
  return adminsActivos.length === 1 && adminsActivos[0]?.id === id;
}

// ¿Se puede desactivar a `target`? No podés desactivarte a vos mismo ni
// dejar al club sin ningún administrador activo.
export function puedeDesactivar(
  actorId: string,
  target: UsuarioDominio,
  usuarios: readonly UsuarioDominio[],
): boolean {
  if (target.id === actorId) return false;
  if (target.role === 'admin' && esUltimoAdmin(usuarios, target.id)) {
    return false;
  }
  return true;
}

// Normaliza y valida las categorías de un entrenador contra el catálogo único
// (spec 15): "SUB 7" o "SUB 99" ya no pasan. En admin siempre `[]`.
export function normalizaCats(role: Rol, cats: readonly string[]): string[] {
  if (role === 'admin') return [];

  const limpias = cats
    .map((c) => c.trim().replace(/\s+/g, ' ').toUpperCase())
    .filter((c) => c.length > 0);

  for (const c of limpias) {
    if (categoriaDeEtiqueta(c) === null) {
      throw new UsuarioReglaError(
        `Categoría inválida: "${c}". No existe en el catálogo del club.`,
      );
    }
  }

  return [...new Set(limpias)];
}

/**
 * Una categoría pertenece a un solo entrenador activo: si alguna de `cats` ya
 * está en `ocupadas`, la operación se rechaza (la UI es ayuda, no barrera).
 */
export function validaDisponibles(
  cats: readonly string[],
  ocupadas: readonly string[],
): void {
  const tomadas = new Set(ocupadas);
  const choque = cats.filter((c) => tomadas.has(c));
  if (choque.length > 0) {
    throw new UsuarioReglaError(
      `Ya tiene entrenador asignado: ${choque.join(', ')}.`,
    );
  }
}

export interface UsuarioConCats {
  role: Rol;
  activo: boolean;
  cats: readonly string[];
}

/** Categorías del catálogo sin ningún entrenador activo a cargo. */
export function categoriasSinEntrenador(
  usuarios: readonly UsuarioConCats[],
): string[] {
  const tomadas = new Set(
    usuarios
      .filter((u) => u.role === 'entrenador' && u.activo)
      .flatMap((u) => u.cats),
  );
  return listarCategorias()
    .map((c) => c.etiqueta)
    .filter((etiqueta) => !tomadas.has(etiqueta));
}
