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
  site: 'https://chuterfc.com',
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

- **`lib/domain/*`** — reglas puras: `categoriaDeAlumno`, `precioUniforme` (con descuento de hermanos, R9 — la mensualidad no tiene descuento, R2), `estadoCelda`, `saldoPendiente`, `estaEnMora`, `mesesEnMora`, `recaudoDelMes`, `recaudoAnio`, `carteraVencida`, `progresoVsMeta`, `numerosDuplicados`.

### Catálogo único de categorías (spec 15)

`lib/domain/categoria.ts` es la **única** lista de categorías del proyecto — la usan el admin _y_ la landing. Contiene las 7 entradas (`SUB 4 … SUB 16` ↔ Baby … Juvenil) y la regla de asignación:

- **Por edad cumplida:** `sub = ceil(edad / 2) × 2`, clamp inferior a SUB 4, sin categoría sobre SUB 16. La categoría cambia **el día del cumpleaños**, no al cambiar de temporada; no hay año de temporada hardcodeado.
- **Fallback por año** (`categoriaDeAnio`) mientras `alumnos.fecha_nacimiento` sea `null` — equivale a suponer el 1 de enero, sin escribir un dato falso. `categoriaDeAlumno` elige uno u otro y es la puerta que usan services y UI.
- **La categoría no se persiste**: es una proyección de la edad. No hay tabla `categorias` ni FK desde `alumnos` (7 filas fijas que el cliente no edita).
- **Landing:** `src/lib/programas.ts` cruza la colección `programas` (solo `sub` + contenido editorial) con el catálogo. El markdown no guarda ni el nombre ni la edad.
- **Unicidad categoría → entrenador:** una categoría pertenece a **un solo entrenador activo**. `repos/usuarios.categoriasOcupadas()` lee las tomadas y `domain/usuarios.validaDisponibles()` rechaza el choque **en servidor**, dentro de la misma operación de escritura (el selector de la UI es ayuda, no barrera). Desactivar a un entrenador libera sus categorías. Formato persistido en `user.cats`: `"SUB 8"`.
- **Duplicación conocida y aceptada:** el entrenador aparece en `user.cats` (BD, verdad operativa) _y_ en el frontmatter de `src/content/programas/*.md` (landing). La landing es estática y no debe depender de la BD en build; si empiezan a divergir seguido, va en su propio spec.
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
  if (!pathname.startsWith('/admin')) return next(); // marketing intacto
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

> **Actualizado por el spec 12 (2026-07-19).** El modelo real corrige lo que esta sección proponía antes: los pagos son **filas solo de meses realmente pagados** (`due/pending/na` se **derivan** en dominio, no se almacenan); **no hay tablas `categorias` ni `tarifas`** (la categoría se calcula de la fecha de nacimiento, R1; la cuota es constante, R2); el acudiente va **denormalizado** en `alumnos`. Los **uniformes reales** ya se modelan aquí (spec 12): dos kits AZUL/ORO por alumno con abonos parciales.

Un archivo por agregado en `src/lib/db/schema/`, re-export desde `schema/index.ts`. Cada uno < 200 líneas. Tablas vigentes tras el spec 13:

| Archivo schema | Tablas                                                                                                                                                                                                                                                                       | Origen Excel                   |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| `alumnos.ts`   | `alumnos` (nombre, documento, anioNacimiento, fechaNacimiento **nullable**, acudiente/celular/direccion denormalizados, fechaInicio, activo)                                                                                                                                 | hoja `CATEGORIAS`              |
| `pagos.ts`     | `pagos` (alumnoId, anio, mes enum, montoCop, metodo null, pagadoEn null, registradoPor, **anuladoEn / anuladoPor / motivoAnulacion** null) — **fila solo al pagar**, con soft delete (spec 20)                                                                               | color verde de celdas MAR–NOV  |
| `uniformes.ts` | `uniformes` (alumnoId, kit enum AZUL/ORO, entregado, numero null, talla, abonadoCop, registradoPor) — **fila por alumno-kit**, único `(alumnoId, kit)`                                                                                                                       | color de celdas AZUL=U / ORO=V |
| `entrenos.ts`  | `planes_semana` (entrenadorId FK user, semanaInicio date, tema, objetivos), único `(entrenadorId, semanaInicio)` · `sesiones` (entrenadorId, semanaInicio, dia enum, parteCentralUrl null, parteCentralNota, ausentes int[] null), único `(entrenadorId, semanaInicio, dia)` | — (arranca vacío, sin seed)    |
| `auth.ts`      | `user, session, account, verification` (`cats text[]` = categorías del entrenador)                                                                                                                                                                                           | Better Auth                    |

> **`anioNacimiento` + `fechaNacimiento` conviven a propósito** (spec 15): la fecha es la verdad cuando existe y `anioNacimiento` sostiene el fallback de los alumnos que aún no la tienen, además de servir de validación cruzada contra el Excel. Cuando el club complete el 100 % de las fechas, se hace backfill → `NOT NULL` → se elimina `anio_nacimiento` (spec aparte, con migración).

```ts
// src/lib/db/schema/pagos.ts (corazón de la cartera) — fila SOLO cuando se paga
export const mesEnum = pgEnum('mes', [
  'ENE',
  'FEB',
  'MAR',
  'ABR',
  'MAY',
  'JUN',
  'JUL',
  'AGO',
  'SEP',
  'OCT',
  'NOV',
  'DIC',
]);
export const pagos = pgTable(
  'pagos',
  {
    id: serial('id').primaryKey(),
    alumnoId: integer('alumno_id')
      .notNull()
      .references(() => alumnos.id, { onDelete: 'cascade' }),
    anio: integer('anio').notNull(), // 2026, 2027… (filtro por año)
    mes: mesEnum('mes').notNull(),
    montoCop: integer('monto_cop').notNull(), // cuota vigente al pagar
    metodo: text('metodo'), // 'efectivo' | 'transferencia' | null (seed)
    pagadoEn: timestamp('pagado_en'), // null en pagos del seed
    registradoPor: text('registrado_por').references(() => user.id), // null en seed
    // Soft delete (spec 20): las tres viajan juntas — null = pago vivo.
    anuladoEn: timestamp('anulado_en'),
    anuladoPor: text('anulado_por').references(() => user.id),
    motivoAnulacion: text('motivo_anulacion'),
  },
  // Un pago VIVO por alumno-mes-año (índice PARCIAL, no `unique`).
  (t) => [
    uniqueIndex('pagos_alumno_anio_mes_vivo')
      .on(t.alumnoId, t.anio, t.mes)
      .where(sql`${t.anuladoEn} is null`),
  ],
);
```

- El enum trae los 12 meses aunque hoy solo se cobre hasta NOV: la ventana de cobro vive en dominio (`MES_FIN_COBRO`), cambiarla no toca la BD.
- `due/pending/na` **no existen como columna**: los deriva `estadoDelMes` en `lib/domain/cartera.ts` a partir de los pagos reales + `fechaInicio` del alumno + `ARRANQUE_CLUB` (MAR 2026) + mes vivo.

#### `pagos` es la única tabla con soft delete (spec 20)

Las demás tablas del admin no borran nada porque **no tienen qué borrar**: un alumno se retira (`alumnos.activo = false`, que es estado del alumno, no una baja de registro), una entrega de uniforme se revierte cambiando un booleano (`anularEntrega`), y un plan o una sesión de entreno se sobreescriben. En todos esos casos la fila sigue significando algo después de la corrección.

Un pago es distinto: el error se corrige haciendo que la fila **deje de existir** para toda derivación. Con un `DELETE` el recaudo se arregla solo, pero desaparece la única evidencia de que hubo un cobro mal registrado — y son movimientos de dinero, en un club que apenas está dejando el Excel. Por eso `pagos` lleva `anulado_en` / `anulado_por` / `motivo_anulacion` (las tres juntas, o las tres `null`; nada las vuelve a `null`: reactivar un pago es registrarlo de nuevo).

Dos consecuencias de diseño:

- **El filtro `anulado_en IS NULL` vive en el repo** (`pagosPorAnio`, `pagosDeAlumno`), no en el dominio. Así `lib/domain/cartera.ts` no se enteró de la anulación y no hay dos lugares donde un pago pueda "contar o no contar": el mes anulado vuelve solo a `due`/`pending`, sale del recaudo y vuelve a la cartera vencida.
- **La unicidad tuvo que volverse parcial.** Con el `unique(alumno_id, anio, mes)` original, la fila anulada seguía ocupando la combinación y el mes no se podía volver a cobrar — que es el 100 % de los casos de uso, porque se anula para cobrar lo correcto. La migración `0004` elimina `pagos_alumno_id_anio_mes_unique` y crea `pagos_alumno_anio_mes_vivo` con `WHERE anulado_en IS NULL`.

El rastro se consulta por SQL (`scripts/verificar-anulacion-pagos.mjs`): **no hay pantalla de auditoría**, se construye cuando alguien la necesite.

```ts
// src/lib/db/schema/uniformes.ts (spec 12) — una fila por alumno-kit
export const kitEnum = pgEnum('kit', ['AZUL', 'ORO']);
export const uniformes = pgTable(
  'uniformes',
  {
    id: serial('id').primaryKey(),
    alumnoId: integer('alumno_id')
      .notNull()
      .references(() => alumnos.id, { onDelete: 'cascade' }),
    kit: kitEnum('kit').notNull(),
    entregado: boolean('entregado').notNull().default(false),
    numero: integer('numero'), // null hasta entregar
    talla: text('talla').notNull().default(''),
    abonadoCop: integer('abonado_cop').notNull().default(0), // 0..precio del kit
    registradoPor: text('registrado_por').references(() => user.id), // null en seed
    creadoEn: timestamp('creado_en').notNull().defaultNow(),
    actualizadoEn: timestamp('actualizado_en').notNull().defaultNow(),
  },
  (t) => [unique().on(t.alumnoId, t.kit)],
); // un registro por alumno-kit
```

- **Estado del kit derivado (no columna):** `estadoKit(entregado, abonadoCop, precio)` en `lib/domain/uniformes.ts` cruza entrega × pago; el pago es **tri-estado** (`ejePago`: sin pagar / abonado / pagado según `abonadoCop` vs precio). La unicidad de `numero` por kit es **advertencia de dominio** (`numerosDuplicados`/`numeroOcupado`), no constraint de BD (el club repite a propósito, R6).
- **Filtro por rol:** `uniformes.listar` devuelve los dos kits con dinero al admin, y **solo la entrega** (sin `abonadoCop`/saldo/estado de pago) al entrenador — verificado en el payload de red.

```ts
// src/lib/db/schema/entrenos.ts (spec 13) — planes/sesiones por semana
export const diaEnum = pgEnum('dia_entreno', ['Lunes', 'Miércoles', 'Viernes']);
export const sesiones = pgTable(
  'sesiones',
  {
    id: serial('id').primaryKey(),
    entrenadorId: text('entrenador_id')
      .notNull()
      .references(() => user.id), // sin cascade: el historial se conserva
    semanaInicio: date('semana_inicio').notNull(), // lunes de la semana (clave natural)
    dia: diaEnum('dia').notNull(),
    parteCentralUrl: text('parte_central_url'), // URL de Vercel Blob; null = sin imagen
    parteCentralNota: text('parte_central_nota').notNull().default(''),
    ausentes: integer('ausentes').array(), // null = lista NO pasada; [] = todos presentes
    creadoEn: timestamp('creado_en').notNull().defaultNow(),
    actualizadoEn: timestamp('actualizado_en').notNull().defaultNow(),
  },
  (t) => [unique().on(t.entrenadorId, t.semanaInicio, t.dia)],
);
```

- **Identidad de semana = fecha del lunes** (`semanaInicio: date`), no el número ISO (colisiona entre años). El `weekId` de la URL se traduce en el service (`semanaInicioISO`/`semanaPorWeekId`); las fechas viajan como string `YYYY-MM-DD` sin zona horaria.
- **Slots derivados:** una fila de plan/sesión existe solo si el entrenador registró algo. Planeación y asistencia son **dos escritores del mismo slot** que tocan **solo sus columnas** (url/nota vs `ausentes`), garantizado por SQL — no se pisan (`ausentes: null` = lista sin pasar; `[]` = todos presentes).
- **Filtro por rol:** `entrenos.listar` devuelve al entrenador **su** plan/sesiones y al admin **todos** los entrenadores (solo lectura). Las escrituras son **solo del entrenador y solo lo suyo**: `entrenadorId` sale de la sesión, nunca del payload; el admin recibe `FORBIDDEN`. La ventana editable = la ventana de semanas de la UI (actual + 3 pasadas + 1 futura), validada en servidor.
- **Vercel Blob** (`@vercel/blob`, server-only): la imagen de la parte central se **comprime en cliente** (canvas nativo → WebP ~0.8, máx 1280px) y viaja por **FormData** a la Action, que la sube a Blob (`access: 'public'`, ruta `entrenos/{entrenadorId}/{semanaInicio}-{dia}.{ext}` con `addRandomSuffix`) y guarda la URL en Neon; al reemplazar, borra el blob anterior (`del()`, best-effort). Token `BLOB_READ_WRITE_TOKEN` (server-only). Blobs `public`: URLs no-adivinables, solo llegan a usuarios logueados (contenido no sensible).
- **`alumnos.activo` = alumno vigente (spec 14).** `false` significa **retirado**: es un borrado lógico, nunca físico (el historial de pagos y uniformes se conserva y sigue consultable en su ficha). El filtro es del **repo**: `listarAlumnos()` trae solo activos y hay que pedir `{ incluirRetirados: true }` para verlos — así ningún derivado se olvida de filtrar. Consecuencia en los cálculos: **población y deuda** (alumnos activos, % al día, morosos, cartera vencida, meta del mes, próximos cumpleaños, plantel del entrenador) se miden **solo sobre activos**; el **dinero recaudado** (año, mes, gráfico mensual) suma **todos los pagos reales**, incluidos los de un retirado — ese pago entró y no se revierte. Escribe solo `alumnos.cambiarActivo` (`requireAdmin`); `pagos.registrar` rechaza a un retirado en servidor.
- `drizzle.config.ts` en raíz; migraciones en `drizzle/`.
- **Seed:** `scripts/seed-from-excel.mjs` + `scripts/seed-uniformes.mjs` (con `exceljs`, **devDependency**) leen el Excel **local**, marcan pago y kits por **color de relleno** de la celda (verde = pagado/entregado), upsert idempotente por documento y por `(documento, kit)`, reusando `lib/domain`. `xlsx` no sirve: no lee estilos de celda y los estilos **son** los datos.

### Dos paginados y por qué no son el mismo (specs 16 y 18)

El admin tiene **dos** estrategias de paginado conviviendo a propósito. No es inconsistencia: responden a cuellos de botella distintos.

**Paginado de render (spec 16) — Alumnos y Cartera.** El hook `useListaIncremental` recorta la ventana visible con `items.slice(0, tope)` sobre una lista que ya llegó **completa** en una sola llamada a la Action. Los contadores y totales se siguen calculando sobre la lista filtrada completa, nunca sobre la ventana. Ahí el que dolía era el **DOM** (pintar cientos de filas), no el payload: `alumnos.listar` son ~55 KB (≈10 KB gzip) para 82 alumnos.

**Paginado de servidor (spec 18) — Uniformes.** Es la única lista del admin cuyo universo es **2N**: una fila por (alumno activo × kit), hoy 82 × 2 = **164 filas**. Crece al doble de rápido que cualquier otra lista del panel, y lo que crece es el **payload**, no el DOM. Por eso `paginaUniformes()` (`src/lib/db/repos/uniformes-pagina.ts`) resuelve en **una sola consulta** el filtro, el orden, la página (20 filas), el `total`, los conteos por estado sobre el total filtrado y los números repetidos sobre todo el set. Encima van la Action `uniformes.listarPagina` y el hook `useUniformesPagina`.

- Se pagina con `row_number()` en una CTE, no con `LIMIT`/`OFFSET`, y los tres órdenes (Prioridad · Nombre · Número) cierran con el desempate `(alumno_id, kit)`: **sin un orden total, dos páginas consecutivas pueden repetir u omitir una fila**.
- Los acentos se normalizan con `translate()` y **no** con la extensión `unaccent`, para no depender de habilitar una extensión en Neon.
- Los precios se **inyectan** como parámetros desde `lib/domain/precios.ts`: no hay números mágicos en `src/lib/db/`.

**El costo consciente de esta decisión:** cuatro derivaciones que el dominio hace en TypeScript —conteo de hermanos por acudiente normalizado, precio del kit, estado del kit y categoría por edad cumplida— quedan escritas **también** en SQL. Lo que impide que las dos versiones se separen en silencio es `scripts/verificar-estados-uniformes.mjs`, que las compara fila por fila sobre el set completo y sale con código ≠ 0 ante la primera diferencia; es criterio de aceptación del spec 18, no una verificación opcional. Duplicar una regla solo se paga cuando hay un guardián que la vigila.

**El umbral, para el lector futuro:** el criterio para migrar una lista a paginado de servidor **no es cuántas filas tiene hoy**, sino si **el payload crece más rápido que el DOM**. Alumnos y Cartera siguen con paginado de render mientras su universo sea 1 fila por alumno; el día que una de ellas duplique su universo, o que el plantel crezca lo suficiente para disparar el umbral de DT-3 (>300 activos o >200 KB en `alumnos.listar`), se migra en su propio spec.

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
      meses: z
        .array(
          z.enum([
            'FEB',
            'MAR',
            'ABR',
            'MAY',
            'JUN',
            'JUL',
            'AGO',
            'SEP',
            'OCT',
            'NOV',
            'DIC',
          ]),
        )
        .min(1),
      metodo: z.enum(['efectivo', 'transferencia']),
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
├─ actions/{index,_guard,_errores,alumnos,pagos,uniformes,entrenos,dashboard,usuarios,contacto}.ts
├─ lib/
│  ├─ db/{client.ts, schema/*, repos/*}
│  ├─ domain/*                          # reglas puras (categoria.ts = catálogo único)
│  ├─ services/*                        # orquestación
│  ├─ programas.ts                      # colección `programas` × catálogo (landing)
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
BETTER_AUTH_URL=https://chuterfc.com
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_... # Vercel Blob (imagen de la parte central de entrenos)
```

Se documentan en `.env.example`. Se provisionan en Vercel (integración Neon).

---

## 9. Verificación

Desde el spec 16 el enforcement es **real**, no aspiracional: en la raíz existen `eslint.config.js`, `.prettierrc`, `.prettierignore`, `.gitattributes` (`* text=auto eol=lf`) y `.git-blame-ignore-revs` (con el commit de la pasada global de Prettier).

| Script                 | Comando                   | Qué hace                                      |
| ---------------------- | ------------------------- | --------------------------------------------- |
| `npm run lint`         | `eslint .`                | Reglas de `.claude/rules/coding-rules.md`.    |
| `npm run typecheck`    | `astro check`             | 0 errores, 0 `any`.                           |
| `npm run format`       | `prettier --write .`      | Formatea el repo.                             |
| `npm run format:check` | `prettier --check .`      | Verifica formato, sin escribir.               |
| `npm run check`        | `astro check && eslint .` | Puerta de calidad: falla si cualquiera falla. |

> `check` **no** incluye `format:check` a propósito: el formato no bloquea la validación de tipos y reglas; se corre a mano con `npm run format`.

**Alcance del linter (decidido con medición, spec 16):** **global** — todo `src/` y `scripts/` —, calibrado **por regla y por tipo de archivo**, no scopeado por directorio. Las dos reglas que definen el contrato del proyecto (`max-lines: 200` y `no-explicit-any`) tienen 0 violaciones en todo el repo, marketing incluido, así que aplicarlas globalmente cuesta cero. `max-lines-per-function: 60` rige en `.ts`/`.mjs` y está **desactivado en `.tsx`/`.astro`**: el cuerpo de un componente es un árbol de markup, no una función imperativa — con un componente por archivo, el tope real ya es `max-lines: 200`, y el guardián de "hace demasiado" es `complexity: 10`. Choca además con la decisión de §6 de conservar los estilos inline del prototipo.

**Fuera del linter:** `src/components/ui/**` (generado por shadcn, `CLAUDE.md` dice no tocarlo manualmente) y el material **no versionado** (`references/`, el bundle del design system, `docs/comercial/`, `.playwright-cli/`) — ESLint no lee `.gitignore`, así que van explícitos en `ignores`.

**Severidad type-aware (spec 17):** `strictTypeChecked`. Quedan **5 supresiones** en todo el repo, todas de una línea y con motivo escrito, todas por tipos que no reflejan el runtime (`import.meta.env` en módulos que también importan los scripts de Node, y un `const [row] = …limit(1)` sin `noUncheckedIndexedAccess`). Detalle y regla para código nuevo en `.claude/rules/coding-rules.md` §5.

- `npm run build`: marketing prerenderizado; `/admin` + `/api` como funciones del adapter.
- `npm run dev`: login → dashboard (Action) → registrar pago (celda cambia + recibo WhatsApp) → número de uniforme repetido (alerta) → logout.
- Opcional: Playwright MCP contra el dev server.
