// Reglas puras de gestión de usuarios del admin. Sin dependencias de BD ni
// de la UI: reciben datos planos y devuelven decisiones testeables.

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

const CATEGORIA_RE = /^SUB \d{1,2}$/;

// Normaliza y valida las categorías de un entrenador. En admin siempre `[]`.
// Formato aceptado: "SUB 8", "SUB 10" (se normalizan mayúsculas/espacios).
export function normalizaCats(role: Rol, cats: readonly string[]): string[] {
  if (role === 'admin') return [];

  const limpias = cats
    .map((c) => c.trim().replace(/\s+/g, ' ').toUpperCase())
    .filter((c) => c.length > 0);

  for (const c of limpias) {
    if (!CATEGORIA_RE.test(c)) {
      throw new UsuarioReglaError(
        `Categoría inválida: "${c}". Usá el formato "SUB 8".`,
      );
    }
  }

  return [...new Set(limpias)];
}
