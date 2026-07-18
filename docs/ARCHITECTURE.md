# Arquitectura — Módulo de Administración Chuter FC

> Cómo conviven el **sitio público estático** (marketing) y el **módulo admin interactivo** en el mismo proyecto Astro, con datos persistentes y autenticación, manteniendo código limpio y tipado.
>
> Reglas de código limpio y su enforcement: `.claude/rules/coding-rules.md` (referenciadas desde `CLAUDE.md`).

---

## 1. Principio rector: estático por defecto, servidor donde haga falta

El sitio de marketing es y seguirá siendo **estático/prerenderizado** (Lighthouse 95+, JS mínimo). El módulo admin es una **SPA interactiva** que necesita servidor (BD + sesión). No mezclamos sus presupuestos ni sus estilos.

- `astro.config.mjs` mantiene `output` **estático por defecto** + `adapter: vercel()`.
- Solo se opta por servidor ruta por ruta con `export const prerender = false`:
  - `src/pages/admin/index.astro`, `src/pages/admin/login.astro`
  - `src/pages/api/auth/[...all].ts`
  - Las **Astro Actions** corren siempre en servidor.
- **No** usar `output: 'server'` (obligaría a prerenderizar cada página de marketing a mano).
- Instalar con `npx astro add vercel` (configura el adapter automáticamente). Versiones verificadas 2026-06: Astro **6.1.10** instalado; `@astrojs/vercel` aún no.

```js
// astro.config.mjs (cambios)
import vercel from '@astrojs/vercel';
// ...
export default defineConfig({
  site: 'https://chuterfc.vercel.app',
  adapter: vercel(),
  vite: { plugins: [tailwindcss()] },
  integrations: [
    react(),
    sitemap({ filter: (page) => !page.includes('/admin') }),
  ],
});
```

---

## 2. Capas y responsabilidades

```
Navegador (isla React /admin)
        │  llama Actions tipadas (astro:actions)
        ▼
Astro Actions  ── _guard.requireUser(locals)
        │  orquesta
        ▼
Services (lib/services)  ── combinan repos + dominio
        │
        ├── Domain (lib/domain)   funciones PURAS (reglas de negocio)
        └── Repos  (lib/db/repos) queries Drizzle (sin lógica)
                    │
                    ▼
              Neon Postgres (Drizzle schema)
```

Regla de oro: **la lógica de negocio vive en `lib/domain` (puro, testeable), nunca en componentes, actions o schema.**

- **`lib/domain/*`** — reglas puras: `categoriaDeAnio`, `precioUniforme` (con descuento de hermanos, R9 — la mensualidad no tiene descuento, R2), `estadoCelda`, `saldoPendiente`, `estaEnMora`, `mesesEnMora`, `recaudoDelMes`, `recaudoAnio`, `carteraVencida`, `progresoVsMeta`, `numerosDuplicados`.
- **`lib/db/repos/*`** — un repo por agregado; solo queries Drizzle, devuelven filas tipadas.
- **`lib/services/*`** — orquestación (p.ej. `cartera.ts` arma la matriz alumnos×meses combinando repos + dominio).
- **`actions/*`** — RPC tipado con validación Zod; un módulo por agregado; cada handler llama `requireUser` primero.
- **`features/admin/*`** — UI React (solo presentación + estado de cliente).

---

## 3. Autenticación (Better Auth)

> Imports/API exactos de Better Auth + Drizzle + Neon (`better-auth/adapters/drizzle`, `drizzle-orm/neon-http`) se confirman contra la doc vigente al implementar (Fase 4); las versiones cambian rápido.

- Singleton servidor `src/lib/auth/server.ts` con `drizzleAdapter` (provider `pg`), `emailAndPassword.enabled = true`, `disableSignUp = true`, sesión de 7 días en cookie httpOnly.
- Handler único `src/pages/api/auth/[...all].ts` (`export const prerender = false; export const ALL = ({request}) => auth.handler(request)`).
- **Middleware** `src/middleware.ts` protege `/admin/**`:

```ts
export const onRequest = defineMiddleware(async (ctx, next) => {
  const { pathname } = ctx.url;
  if (!pathname.startsWith('/admin')) return next();           // marketing intacto
  const session = await auth.api.getSession({ headers: ctx.request.headers });
  ctx.locals.session = session ?? null;
  ctx.locals.user = session?.user ?? null;
  if (!session && pathname !== '/admin/login')
    return ctx.redirect(`/admin/login?next=${encodeURIComponent(pathname)}`);
  if (session && pathname === '/admin/login') return ctx.redirect('/admin');
  return next();
});
```

- `src/env.d.ts` extiende `App.Locals` con `user`/`session` (tipado, sin `any`).
- Las 2 cuentas (Camilo, Ebed) se crean por seed; no hay registro público.

---

## 4. Capa de datos (Drizzle + Neon, mapeo al Excel)

> **Actualizado por el spec 11 (2026-07-18).** El modelo real corrige lo que esta sección proponía antes: los pagos son **filas solo de meses realmente pagados** (`due/pending/na` se **derivan** en dominio, no se almacenan); **no hay tablas `categorias` ni `tarifas`** (la categoría se calcula de la fecha de nacimiento, R1; la cuota es constante, R2); el acudiente va **denormalizado** en `alumnos`. Uniformes reales se modelan en el **spec 12** (dos kits AZUL/ORO con abonos), no aquí.

Un archivo por agregado en `src/lib/db/schema/`, re-export desde `schema/index.ts`. Cada uno < 200 líneas. Tablas vigentes tras el spec 11:

| Archivo schema | Tablas | Origen Excel |
|---|---|---|
| `alumnos.ts` | `alumnos` (nombre, documento, anioNacimiento, fechaNacimiento null, acudiente/celular/direccion denormalizados, fechaInicio, activo) | hoja `CATEGORIAS` |
| `pagos.ts` | `pagos` (alumnoId, anio, mes enum, montoCop, metodo null, pagadoEn null, registradoPor) — **fila solo al pagar** | color verde de celdas MAR–NOV |
| `auth.ts` | `user, session, account, verification` | Better Auth |

Pendientes en sus propios specs: `uniformes` (spec 12, por kit + abonos), `entrenamientos`/`sesiones` (spec 13, con Vercel Blob).

```ts
// src/lib/db/schema/pagos.ts (corazón de la cartera) — fila SOLO cuando se paga
export const mesEnum = pgEnum('mes', ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC']);
export const pagos = pgTable('pagos', {
  id: serial('id').primaryKey(),
  alumnoId: integer('alumno_id').notNull().references(() => alumnos.id, { onDelete: 'cascade' }),
  anio: integer('anio').notNull(),                 // 2026, 2027… (filtro por año)
  mes: mesEnum('mes').notNull(),
  montoCop: integer('monto_cop').notNull(),         // cuota vigente al pagar
  metodo: text('metodo'),                           // 'efectivo' | 'transferencia' | null (seed)
  pagadoEn: timestamp('pagado_en'),                 // null en pagos del seed
  registradoPor: text('registrado_por').references(() => user.id), // null en seed
}, (t) => [unique().on(t.alumnoId, t.anio, t.mes)]); // un pago por alumno-mes-año
```

- El enum trae los 12 meses aunque hoy solo se cobre hasta NOV: la ventana de cobro vive en dominio (`MES_FIN_COBRO`), cambiarla no toca la BD.
- `due/pending/na` **no existen como columna**: los deriva `estadoDelMes` en `lib/domain/cartera.ts` a partir de los pagos reales + `fechaInicio` del alumno + `ARRANQUE_CLUB` (MAR 2026) + mes vivo.
- `drizzle.config.ts` en raíz; migraciones en `drizzle/`.
- **Seed:** `scripts/seed-from-excel.mjs` (con `exceljs`, **devDependency**) lee el Excel **local**, marca pago por **color de relleno** de la celda (verde = pagado), upsert idempotente por documento, reusando `lib/domain`. `xlsx` no sirve: no lee estilos de celda y los estilos **son** los datos.

---

## 5. La isla admin (cliente)

Una sola isla `client:only="react"` con **router interno** (no una página Astro por pantalla): preserva el feel SPA (tab bar, bottom sheets, estado) y no toca el bundle de marketing.

```astro
---
// src/pages/admin/index.astro
import AdminLayout from '@/layouts/AdminLayout.astro';
import AdminApp from '@/features/admin/AdminApp';
export const prerender = false;
const { user } = Astro.locals;
---
<AdminLayout>
  <AdminApp client:only="react" userName={user?.name ?? ''} />
</AdminLayout>
```

- **Datos:** las pantallas llaman Actions vía hooks tipados (`features/admin/hooks/*`). Las mutaciones actualizan optimista y revalidan.
- **Mock-first:** en Fase 2 los hooks leen un adaptador mock (`features/admin/data/`) con la **misma interfaz**; en Fase 5 se cambia a Actions **sin tocar la UI**.
- **Acción ejemplo:**

> **Astro 6 (2026):** Zod se importa de `astro/zod` (Zod v4 re-exportado por Astro). `astro:schema` y `z` de `astro:content` quedaron **deprecados** — no usarlos en código nuevo.

```ts
// src/actions/pagos.ts
import { defineAction, ActionError } from 'astro:actions';
import { z } from 'astro/zod';
import { requireUser } from './_guard';
import { pagosRepo } from '@/lib/db/repos/pagos';

export const pagos = {
  registrar: defineAction({
    accept: 'json',
    input: z.object({
      alumnoId: z.number().int().positive(),
      anio: z.number().int(),
      meses: z.array(z.enum(['FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'])).min(1),
      metodo: z.enum(['efectivo','transferencia']),
    }),
    handler: async (input, ctx) => {
      requireUser(ctx.locals);
      const rows = await pagosRepo.upsertMeses(input);
      return { registrados: rows.length };
    },
  }),
};
```

---

## 6. Estilos (design system aislado)

- Tokens del DS porteados a `src/features/admin/admin.css` re-declarados bajo `.admin-app` → aislados del sitio público y viceversa.
- Estilos inline del prototipo conservados para fidelidad pixel-perfect (es herramienta interna, no la página con presupuesto de performance).
- Iconos vía `lucide-react` (registro tipado en `chrome/Icon.tsx`), reemplazando el hack CDN `data-lucide` del prototipo.
- App responsive real: `100dvh`, `env(safe-area-inset-*)` en header/tab-bar; en desktop columna centrada max-width ~480px (sin marco de iPhone).

---

## 7. Estructura de carpetas

```
src/
├─ pages/admin/{index,login}.astro      # rutas servidor (prerender=false)
├─ pages/api/auth/[...all].ts           # handler Better Auth
├─ layouts/AdminLayout.astro            # head admin: noindex, scope .admin-app
├─ middleware.ts                        # gate auth /admin/**
├─ actions/{index,_guard,alumnos,pagos,uniformes,entrenamientos,dashboard}.ts
├─ lib/
│  ├─ db/{client.ts, schema/*, repos/*}
│  ├─ domain/*                          # reglas puras
│  ├─ services/*                        # orquestación
│  └─ auth/{server,client}.ts
└─ features/admin/
   ├─ AdminApp.tsx · router.tsx
   ├─ data/ (mock) · hooks/
   ├─ ui/ (Avatar, Badge, Button, Card, CarteraCell, KpiCard, TextField, SelectField)
   ├─ chrome/ (Screen, AppHeader, TabBar, BottomSheet, Segmented, StudentRow, Icon)
   ├─ screens/ (1 carpeta por pantalla; ver descomposición en el plan)
   └─ admin.css
```

---

## 8. Variables de entorno

`.env` (server-only, sin prefijo `PUBLIC_`):

```
DATABASE_URL=postgres://...neon...      # cadena pooled de Neon
BETTER_AUTH_SECRET=...                   # secreto largo aleatorio
BETTER_AUTH_URL=https://chuterfc.vercel.app
```

Se documentan en `.env.example`. Se provisionan en Vercel (integración Neon).

---

## 9. Verificación

- `npm run typecheck` (`astro check`): 0 errores, 0 `any`.
- `npm run lint`: reglas de `.claude/rules/coding-rules.md` en verde.
- `npm run build`: marketing prerenderizado; `/admin` + `/api` como funciones del adapter.
- `npm run dev`: login → dashboard (Action) → registrar pago (celda cambia + recibo WhatsApp) → número de uniforme repetido (alerta) → logout.
- Opcional: Playwright MCP contra el dev server.
