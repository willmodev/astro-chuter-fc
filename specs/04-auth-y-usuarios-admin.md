# SPEC 04 — Auth y usuarios del admin (Better Auth + roles)

> **Estado:** Implementado · **Depende de:** SPEC 03, `docs/ARCHITECTURE.md` (§3, §4, §7, §8) · **Fecha:** 2026-07-04
> **Objetivo:** Poner detrás de sesión el back-office `/admin` con Better Auth (login, gate por middleware, logout), dos roles (`admin` y `entrenador`) y una pantalla "Equipo" donde un admin crea y gestiona usuarios, sin registro público y montando el slice mínimo de Neon+Drizzle que la auth necesita.

---

## Por qué este spec existe

Es el **requisito bloqueante** que dejó el spec 03: hoy `/admin` está sin protección real (solo `noindex`), sirviendo mock. Antes de exponer datos sensibles de menores hay que cerrarlo con sesión.

Además **extiende** `ARCHITECTURE.md §3`, que solo contemplaba admins seed de un rol: ahora hay **dos roles** (`admin`, `entrenador`) y **alta de usuarios desde dentro** (un admin los crea). El entrenador que inicie sesión verá un placeholder "Próximamente"; su app real (listas, entrenamientos) es otro spec.

---

## Alcance

**Dentro:**

- **Fundación BD (slice de auth):** cliente Neon singleton `src/lib/db/client.ts`, `drizzle.config.ts` en raíz, migraciones en `drizzle/`, scripts `db:generate`/`db:migrate` en `package.json`. Solo las tablas que la auth necesita; el resto del schema (alumnos, pagos…) se difiere.
- **Schema de auth** `src/lib/db/schema/auth.ts`: tablas `user, session, account, verification` de Better Auth, más los campos extra en `user`: `role` (`'admin' | 'entrenador'`), `banned`, `cats` (`text[]`, categorías del entrenador).
- **Better Auth server** `src/lib/auth/server.ts`: singleton con `drizzleAdapter` (provider `pg`), `emailAndPassword.enabled = true`, `disableSignUp = true`, sesión de 7 días en cookie httpOnly, y el **plugin `admin`** (createUser, listUsers, setRole, ban/unban, setUserPassword).
- **Cliente Better Auth** `src/lib/auth/client.ts` para la isla React (signIn, signOut, useSession) más helpers del plugin admin.
- **Handler** `src/pages/api/auth/[...all].ts` (`prerender = false`, `ALL` → `auth.handler`).
- **Middleware** `src/middleware.ts`: protege `/admin/**`, deja el marketing intacto, redirige a `/admin/login?next=` sin sesión, y saca de `/admin/login` a quien ya tiene sesión. Puebla `ctx.locals.user`/`session`.
- **Tipos** `src/env.d.ts`: extiende `App.Locals` con `user`/`session` tipados (sin `any`).
- **Guard de Actions** `src/actions/_guard.ts`: `requireUser(locals)` y `requireAdmin(locals)` (lanzan `ActionError UNAUTHORIZED`/`FORBIDDEN`).
- **Página de login** `src/pages/admin/login.astro` (`prerender = false`) + isla `features/admin/screens/login/` con el DS admin (navy/gold, logo del club, campos email/contraseña, estados de error, `?next=`).
- **Logout** desde la tab **Más** (botón "Cerrar sesión" → invalida sesión → `/admin/login`).
- **Gate por rol dentro de la isla:** `AdminApp` recibe `role`; un **entrenador** ve un placeholder "Próximamente" (su app va en otro spec); un **admin** ve el Dashboard del spec 03 y la tab Más con acceso a "Equipo".
- **Pantalla "Equipo"** `features/admin/screens/equipo/` (**solo admins**, desde Más): listar usuarios; crear usuario (nombre, email, rol, contraseña inicial; si es entrenador, `cats`); desactivar/reactivar (ban); resetear contraseña. Con salvaguardas: no auto-desactivarte, no desactivar/degradar al último admin activo.
- **Actions de usuarios** `src/actions/usuarios.ts`: `crear`, `listar`, `toggleActivo`, `resetPassword` — validación Zod, `requireAdmin`, reglas duras en `lib/domain`.
- **Reglas puras** `src/lib/domain/usuarios.ts`: `esUltimoAdmin`, `puedeDesactivar`, `normalizaCats` — testeables, fuera de la UI.
- **Seed** `scripts/seed-admin.mjs` + script `db:seed:admin`: crea **solo a Camilo** como admin raíz, tomando email/contraseña de variables de entorno.
- **Variables de entorno** en `.env.example`: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_ADMIN_NAME`.

**Fuera del alcance (otros specs):**

- **App real del entrenador** (sus listas, entrenamientos, pasar lista) — aquí solo su cuenta y el placeholder.
- **Editar nombre/rol** de un usuario existente — por ahora solo crear, desactivar/reactivar y resetear contraseña.
- **Segundo admin (Ebed)** — no va en el seed; Camilo lo crea desde "Equipo".
- **Resto del schema y datos reales** (alumnos, acudientes, pagos, uniformes, entrenamientos) y el seed desde Excel — spec de datos.
- **Recuperación/verificación de contraseña por email**, verificación de email, 2FA, "recordar sesión" configurable.
- **Auto-servicio** (que un usuario edite su propio perfil o cambie su contraseña) — más adelante.
- **Portal de acudientes** (rol futuro del backlog).

---

## Modelo de datos

Este spec introduce las **primeras tablas persistentes** del proyecto: el schema de auth de Better Auth más los campos de rol. El resto del modelo (alumnos, pagos…) se difiere.

### Schema de auth (`src/lib/db/schema/auth.ts`)

```ts
export const roleEnum = pgEnum('role', ['admin', 'entrenador']);

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(true), // sin flujo de verificación
  // --- campos del dominio Chuter ---
  role: roleEnum('role').notNull().default('entrenador'),
  banned: boolean('banned').notNull().default(false),
  cats: text('cats').array().notNull().default([]), // ["SUB 8","SUB 10"], vacío para admin
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
// session, account: forma estándar de Better Auth (Drizzle).
```

Notas:

- **Sin verificación de email:** `emailVerified` queda `true` por defecto y no montamos ningún flujo de verificación ni de recuperación. La tabla `verification` (base que genera el CLI de Better Auth) queda sin uso; no construimos UI sobre ella.
- `role` por defecto `entrenador`: crear un admin es el caso explícito. El plugin `admin` usa el campo `role`; el enum lo acota a los dos válidos.
- `banned = true` ⇒ usuario desactivado: no puede iniciar sesión. No se borran usuarios (se conserva historial).
- `cats` solo aplica a entrenadores; en admin queda `[]`.

### Contrato de la pantalla "Equipo" (`features/admin/screens/equipo/types.ts`)

```ts
export interface UsuarioRow {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'entrenador';
  activo: boolean;          // = !banned
  cats: string[];
}

export interface NuevoUsuarioInput {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'entrenador';
  cats: string[];           // [] si role = 'admin'
}
```

### App.Locals (`src/env.d.ts`)

```ts
declare namespace App {
  interface Locals {
    user: import('@/lib/auth/server').AuthUser | null;
    session: import('@/lib/auth/server').AuthSession | null;
  }
}
```

### Reglas puras (`src/lib/domain/usuarios.ts`)

- `esUltimoAdmin(usuarios, id)` → el usuario es el único admin activo restante.
- `puedeDesactivar(actorId, target, usuarios)` → `false` si `target === actor` o si desactivarlo dejaría al club sin admin.
- `normalizaCats(role, cats)` → `[]` si `admin`; valida códigos `SUB n` si `entrenador`.

---

## Plan de implementación

Cada bloque deja `npm run dev`/`npm run build` en verde y el **marketing intacto**. Requiere una rama de Neon con `DATABASE_URL` configurada.

### Bloque A — Fundación BD (Neon + Drizzle)

1. Instalar deps: `drizzle-orm`, `@neondatabase/serverless`, `better-auth`; dev: `drizzle-kit`. Añadir a `.env.example` las vars de BD/auth/seed.
2. `src/lib/db/client.ts`: singleton Neon + `drizzle`. `drizzle.config.ts` en raíz apuntando a `src/lib/db/schema/`. Scripts `db:generate`/`db:migrate`.
3. `src/lib/db/schema/auth.ts` + `schema/index.ts` (re-export). `npm run db:generate` → primera migración en `drizzle/`. `npm run db:migrate` contra Neon.

_Verifica:_ migración aplicada; tablas `user/session/account/verification` existen en Neon; `build` sigue estático.

### Bloque B — Better Auth (server + handler + cliente)

4. `src/lib/auth/server.ts`: singleton con `drizzleAdapter` (pg), `emailAndPassword` (`disableSignUp: true`), sesión 7 días, plugin `admin`. Exporta tipos `AuthUser`/`AuthSession`.
5. `src/pages/api/auth/[...all].ts` (`prerender = false`, `ALL` → `auth.handler`).
6. `src/lib/auth/client.ts`: `createAuthClient` con `adminClient()` para la isla.
7. `scripts/seed-admin.mjs` + script `db:seed:admin`: crea a **Camilo** (admin) desde las vars de entorno vía `auth.api` (idempotente por email). Correrlo.

_Verifica:_ seed crea 1 admin; no hay endpoint de signup público (`disableSignUp`).

### Bloque C — Gate: middleware + login + logout

8. `src/env.d.ts`: extender `App.Locals` con `user`/`session`.
9. `src/middleware.ts`: gate `/admin/**` (redirige a `/admin/login?next=`), saca de login a los ya logueados, puebla `locals`. Marketing sin tocar.
10. `src/pages/admin/login.astro` (`prerender = false`) + `features/admin/screens/login/`: form email/contraseña con DS admin (logo, error genérico "Correo o contraseña incorrectos", honra `?next=`). `src/pages/admin/index.astro` pasa `role`/`userName` desde `locals` a `AdminApp`.
11. Logout en la tab **Más**: botón "Cerrar sesión" → `signOut` → `/admin/login`.

_Verifica:_ deslogueado en `/admin` → login; login OK → Dashboard; volver a `/admin/login` logueado → Dashboard; logout invalida sesión; Action protegida sin sesión → `UNAUTHORIZED`.

### Bloque D — Roles + pantalla "Equipo"

12. `src/actions/_guard.ts`: `requireUser` / `requireAdmin`. `src/lib/domain/usuarios.ts`: `esUltimoAdmin`, `puedeDesactivar`, `normalizaCats`.
13. `AdminApp`: gate por rol — `entrenador` → placeholder "Próximamente"; `admin` → Dashboard + Más con acceso a "Equipo".
14. `src/actions/usuarios.ts`: `listar`, `crear`, `toggleActivo`, `resetPassword` (Zod + `requireAdmin` + reglas de dominio; usan el plugin `admin`).
15. `features/admin/screens/equipo/` (solo admins): lista de usuarios (badge de rol, activo/inactivo, cats), sheet "Nuevo usuario" (nombre/email/rol/contraseña; cats si entrenador), acciones desactivar/reactivar y resetear contraseña, con las salvaguardas del dominio. Cada archivo < 200 líneas.

_Verifica:_ Camilo crea a Ebed (admin) y a un entrenador con cats; el entrenador loguea y ve el placeholder; desactivar/reactivar y reset funcionan; no puedes auto-desactivarte ni dejar al club sin admin.

### Bloque E — Cierre

16. Verificación final: `build` estático (marketing intacto), `/admin` y `/api/auth` como funciones, `/admin` sigue `noindex` y fuera del sitemap, ningún archivo > 200 líneas, cero `any`.

---

## Criterios de aceptación

### Gate y sesión

- [x] Deslogueado, al abrir cualquier `/admin/**` (salvo `/admin/login`) el middleware redirige a `/admin/login?next=<ruta>`.
- [x] Con credenciales válidas, el login inicia sesión y aterriza en el Dashboard (o en `next` si venía de una ruta protegida).
- [x] Con credenciales inválidas se ve un error genérico ("Correo o contraseña incorrectos"); no se revela si falló el correo o la contraseña.
- [x] Ya logueado, al ir a `/admin/login` se redirige al Dashboard.
- [x] "Cerrar sesión" (tab Más) invalida la sesión y lleva a `/admin/login`; volver atrás en el navegador no muestra datos protegidos.
- [x] La sesión persiste en cookie httpOnly y sigue válida al volver dentro de 7 días.
- [x] Una Action protegida invocada sin sesión responde `UNAUTHORIZED` y no ejecuta la operación.

### Roles

- [x] No existe endpoint ni UI de registro público (`disableSignUp`); un tercero no puede auto-registrarse.
- [x] Un usuario `entrenador` que inicia sesión ve el placeholder "Próximamente" (no el Dashboard ni "Equipo").
- [x] Un usuario `admin` ve el Dashboard y, en la tab Más, el acceso a "Equipo".
- [x] Un usuario con `banned = true` no puede iniciar sesión.

### Gestión de usuarios (pantalla "Equipo", solo admins)

- [x] La pantalla "Equipo" solo es visible/accesible para admins; un entrenador no la ve.
- [x] Un admin puede **crear** un usuario (nombre, email, rol, contraseña inicial); si el rol es `entrenador` puede asignar `cats`, si es `admin` quedan `[]`.
- [x] El usuario recién creado puede iniciar sesión con la contraseña que fijó el admin.
- [x] Un admin puede **desactivar/reactivar** (ban/unban) y **resetear la contraseña** de otro usuario.
- [x] No puedes desactivarte a ti mismo.
- [x] No puedes desactivar (ni, a futuro, degradar) al último admin activo; se muestra un error claro.
- [x] Las Actions de usuarios exigen rol admin (`requireAdmin`): un entrenador que las invoque recibe `FORBIDDEN`.

### Datos y seed

- [x] `npm run db:migrate` crea las tablas de auth en Neon; el schema vive en `src/lib/db/schema/auth.ts`.
- [x] El seed crea **solo a Camilo** como admin desde variables de entorno; re-ejecutarlo no duplica (idempotente por email).
- [x] No hay secretos en el repo: `.env.example` lista los nombres; los valores van en `.env`/Vercel.

### Calidad y no-regresión

- [x] `npm run build` sigue **estático**: el marketing queda prerenderizado; solo `/admin/**` y `/api/auth/**` son funciones on-demand.
- [x] `/admin` sigue `noindex` y fuera del `sitemap.xml`; el sitio público no cambia de estilos ni de output.
- [x] Ningún archivo supera **200 líneas**; cero `any`; la lógica de las salvaguardas vive en `lib/domain/usuarios.ts`, no en la UI ni en las Actions.

---

## Decisiones

- **Sí:** **Better Auth con el plugin `admin`.** _Por qué:_ trae `createUser`, `listUsers`, `setRole`, `ban/unban` y `setUserPassword` server-side — encaja exacto con "el admin crea usuarios, sin signup público", sin reinventar CRUD de identidad.
- **Sí:** **montar el slice mínimo de Neon+Drizzle en este spec** (cliente + tablas de auth + migraciones). _Por qué:_ la auth no existe sin BD; el resto del schema no lo necesita todavía y agranda el spec.
- **Sí:** **rol como campo `role` en `user`** (`admin | entrenador`) acotado por `pgEnum`. _Por qué:_ el plugin `admin` ya usa `role`; el enum lo restringe a los dos válidos sin tabla de roles aparte (overkill para dos roles).
- **Sí:** **desactivar = `banned`**, nunca borrar. _Por qué:_ conserva historial (a futuro un entrenador tendrá sesiones/listas asociadas) y el plugin ya bloquea el login del baneado.
- **Sí:** **contraseña inicial fijada por el admin.** _Por qué:_ no hay email transaccional para invitaciones; con 1 admin y pocos entrenadores, comunicar la clave a mano es suficiente y simple.
- **Sí:** **seed solo de Camilo** (admin raíz) desde variables de entorno. _Por qué:_ es el CEO operativo; a Ebed lo crea él desde "Equipo", validando de paso el alta real de usuarios.
- **Sí:** **todos los admins son iguales.** _Por qué:_ dos personas de confianza; un nivel extra de "super-admin" no aporta y complica las salvaguardas.
- **Sí:** **salvaguardas en `lib/domain/usuarios.ts`** (no auto-desactivarte, no dejar al club sin admin). _Por qué:_ son reglas de negocio puras y testeables; no deben vivir en la UI ni en la Action.
- **Sí:** **el entrenador que loguea ve un placeholder.** _Por qué:_ su app real es un feature grande con su propio spec; aquí solo probamos que el rol y el gate funcionan.
- **No:** **verificación/recuperación de contraseña por email, 2FA.** _Por qué:_ cuentas creadas por un admin de confianza; sin buzón transaccional montado. Se puede añadir luego sin romper el schema.
- **No:** **editar nombre/rol de un usuario existente** en este spec. _Por qué:_ crear + desactivar + reset cubre la operación real inmediata; editar es incremental y evita inflar la pantalla.
- **No:** **una página Astro por pantalla de admin.** _Por qué:_ se mantiene la isla única con router interno del spec 03; login es la única ruta Astro nueva (necesita render server previo a la sesión).

---

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| Añadir Neon+Drizzle+Better Auth rompe el build estático del marketing. | Solo `/admin/**` y `/api/auth/**` optan a servidor (`prerender = false`); `output` sigue por defecto. Criterio de aceptación verifica build estático + marketing intacto. |
| Los imports/API de Better Auth + Drizzle + Neon cambian rápido y el bosquejo de `ARCHITECTURE.md §3` queda desfasado. | Confirmar `better-auth/adapters/drizzle`, el plugin `admin` y `drizzle-orm/neon-http` contra la doc vigente al implementar (Bloque B); fijar versiones en `package.json`. |
| El plugin `admin` requiere que el actor tenga rol admin, y su config de roles no calza con el enum. | Configurar `adminRoles`/`role` del plugin al valor `admin` y cubrir con `requireAdmin` en cada Action; probar que un entrenador recibe `FORBIDDEN`. |
| Middleware mal alcanzado bloquea el marketing o deja `/admin` abierto. | Guard temprano `if (!pathname.startsWith('/admin')) return next()`; caso login exceptuado. Criterios cubren ambos lados (marketing pasa, `/admin` protegido). |
| `text[]` (`cats`) sin soporte parejo entre Drizzle y Neon serverless. | Usar `text('cats').array()`; si diera guerra, fallback a `jsonb`. `normalizaCats` centraliza el saneo antes de persistir. |
| Dejar al club sin admin (auto-ban o degradar al último). | `esUltimoAdmin`/`puedeDesactivar` en `lib/domain`, aplicadas en la Action antes de mutar; criterios de aceptación las verifican. |
| Secretos (`DATABASE_URL`, `BETTER_AUTH_SECRET`, clave del seed) filtrados al repo. | Solo nombres en `.env.example`; valores en `.env` (gitignored) y Vercel. Criterio explícito de "sin secretos en el repo". |
| Contraseña inicial comunicada por canal inseguro (WhatsApp) queda expuesta. | Fuera de alcance técnico, pero el reset de contraseña permite rotarla; documentar en el handoff que la primera clave se cambie pronto. |

---

## Lo que **no** entra en este spec

- App real del entrenador (listas, entrenamientos, pasar lista).
- Editar nombre/rol de usuarios existentes.
- Segundo admin (Ebed) en el seed — lo crea Camilo desde "Equipo".
- Resto del schema y datos reales (alumnos, pagos, uniformes…) y seed desde Excel.
- Recuperación/verificación de contraseña por email, 2FA.
- Auto-servicio de perfil/contraseña.
- Portal de acudientes.

Cada uno, si aterriza, va en su propio spec.
