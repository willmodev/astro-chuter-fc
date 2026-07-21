# SPEC 13 — Persistencia de entrenamientos + Vercel Blob

> **Estado:** Aprobado · **Depende de:** SPEC 09 (modelo de entrenos: plan semanal, sesiones con imagen de TactalPad, asistencia — este spec lo persiste), SPEC 11 (patrón de persistencia: Neon + Drizzle + Actions + hooks pesimistas + filtro por rol en servidor), SPEC 12 (patrón extendido a un segundo agregado) · **Fecha:** 2026-07-19
> **Objetivo:** Persistir planes semanales, sesiones y asistencia en Neon con la imagen de la parte central en Vercel Blob (comprimida a WebP en cliente), migrando los hooks de entrenos del store mock a Actions sin cambiar la UI, y devolviendo la card EntrenoDeHoy al dashboard.

---

## Alcance

**Dentro:**

- **Dominio** (`src/lib/domain/entrenos.ts`): la semana gana su **clave natural por fecha** — `semanaInicio` (lunes, `date`) como identidad persistente; helpers para traducir `weekId` de la URL (`w-25`) ↔ fecha dentro de la ventana generada por `generarSemanas` (que se conserva igual: actual + 3 pasadas + 1 futura). `asistenciaDe`, `rosterDe`, fases fijas y `puedePasarLista` no cambian.
- **Schema Drizzle** (`src/lib/db/schema/entrenos.ts`): tablas `planes_semana` (`entrenadorId` FK a `user`, `semanaInicio: date`, `tema`, `objetivos`, unique `(entrenadorId, semanaInicio)`) y `sesiones` (`entrenadorId`, `semanaInicio`, `dia` enum Lun/Mié/Vie, `parteCentralUrl` (URL de Blob, null), `parteCentralNota`, `ausentes: integer[]` **null = lista no pasada**, timestamps, unique `(entrenadorId, semanaInicio, dia)`). Migración con `db:generate`/`db:migrate`.
- **Vercel Blob** (`@vercel/blob`, server-only): la Action de planeación recibe la imagen por **FormData**, la sube a Blob y guarda la URL en Neon; al **reemplazar**, borra el blob anterior (`del()`). Variable `BLOB_READ_WRITE_TOKEN` en `.env.example` + Vercel.
- **Compresión en cliente** (helper en `features/admin/`): canvas nativo (`createImageBitmap` → `toBlob('image/webp')`, máx ~1280px), **sin dependencias nuevas de cliente**.
- **Repos + services + actions**: `entrenosRepo` (queries de planes/sesiones por ventana de semanas); `services/entrenos.ts` arma las vistas (home del entrenador, sesión del día, vista admin por entrenador); Actions `entrenos.{guardarPlan, guardarPlaneacion, guardarAsistencia, listar}` con Zod + `requireUser` + gate por rol: **el entrenador solo escribe lo suyo** (`entrenadorId` sale de la sesión, nunca del payload) y **el admin solo lee**.
- **Hooks migrados a Actions** (`useEntrenos`, `useSesion`, `useEntrenamientos`) con la misma forma: las pantallas Entrenos, Sesión y Entrenamientos **no cambian de estructura**. Mutaciones **pesimistas** (Action confirma → refetch). Se eliminan `store-entrenos.ts` y el mock de planes/sesiones.
- **Dashboard — vuelve EntrenoDeHoy** (HU-4.6): si hoy es Lun/Mié/Vie, card con una fila por entrenador y su estado de registro del día (registrado con thumbnail/asistencia, o "sin registrar") + link a Entrenamientos; si no hay entreno hoy, la card no aparece.
- **Sin seed**: los entrenos arrancan **vacíos** — el registro empieza desde el deploy.
- **Docs**: `backlog.md` (HU-6.10 ☑, HU-4.6 ☑, nota en HU-8.1), `ARCHITECTURE.md` §4 (tablas nuevas + Blob), `CLAUDE.md` (variable de entorno).

**Fuera del alcance (otros specs):**

- **Estadísticas de asistencia** (histórico por alumno, % mensual, alertas de inasistencia).
- **Histórico completo navegable** — admin y entrenador comparten la misma ventana (actual + 3 pasadas + 1 futura); un selector libre de semanas/meses sería otro spec.
- **Edición de entrenamientos por el admin** (prohibido por diseño desde el spec 09).
- **Notificaciones/recordatorios** al profesor por sesiones sin registrar.
- **Seed de entrenos históricos** desde el Excel de planeación (sin estructura aprovechable).

---

## Modelo de datos

### Tablas nuevas (Drizzle, `src/lib/db/schema/entrenos.ts`)

```ts
export const diaEnum = pgEnum('dia_entreno', ['Lunes', 'Miércoles', 'Viernes']);

// Cabecera del Excel de planeación: tema + objetivos por entrenador y semana.
export const planesSemana = pgTable('planes_semana', {
  id: serial('id').primaryKey(),
  entrenadorId: text('entrenador_id').notNull().references(() => user.id),
  semanaInicio: date('semana_inicio').notNull(),   // lunes de la semana (clave natural)
  tema: text('tema').notNull(),
  objetivos: text('objetivos').notNull(),
  creadoEn: timestamp('creado_en').notNull().defaultNow(),
  actualizadoEn: timestamp('actualizado_en').notNull().defaultNow(),
}, (t) => [unique().on(t.entrenadorId, t.semanaInicio)]);

// Un día de entrenamiento: parte central (imagen en Blob) + asistencia.
export const sesiones = pgTable('sesiones', {
  id: serial('id').primaryKey(),
  entrenadorId: text('entrenador_id').notNull().references(() => user.id),
  semanaInicio: date('semana_inicio').notNull(),
  dia: diaEnum('dia').notNull(),
  parteCentralUrl: text('parte_central_url'),      // URL de Vercel Blob; null = sin imagen
  parteCentralNota: text('parte_central_nota').notNull().default(''),
  ausentes: integer('ausentes').array(),           // null = lista NO pasada; [] = todos presentes
  creadoEn: timestamp('creado_en').notNull().defaultNow(),
  actualizadoEn: timestamp('actualizado_en').notNull().defaultNow(),
}, (t) => [unique().on(t.entrenadorId, t.semanaInicio, t.dia)]);
```

Igual que en el mock, los slots **se derivan, no se pre-crean**: una fila existe solo cuando el entrenador registró algo. La semántica `ausentes: null` vs `[]` se conserva tal cual (lista sin pasar vs todos presentes). Sin `onDelete: cascade` hacia `user`: si un entrenador se elimina, su historial de sesiones se conserva (mismo criterio que `registradoPor` en pagos/uniformes).

### Dominio (contratos nuevos/cambiados en `lib/domain/entrenos.ts`)

```ts
// Semana gana su fecha ISO persistible; el weekId de la URL se conserva.
export function semanaInicioISO(semana: Semana): string;      // 'YYYY-MM-DD' del lunes
export function semanaPorWeekId(semanas: Semana[], weekId: string): Semana | null;
// generarSemanas, asistenciaDe, rosterDe, fases fijas, puedePasarLista: sin cambios.
```

Las fechas `date` de Postgres viajan como string `YYYY-MM-DD` y se comparan como string, sin `Date` ni zona horaria (mismo criterio que `fechaNacimiento` del spec 11).

### Actions (contrato RPC)

```ts
entrenos.listar({ semanaInicio })        // entrenador: sus planes/sesiones; admin: de TODOS los entrenadores
entrenos.guardarPlan({ semanaInicio, tema, objetivos })            // upsert; solo entrenador, solo lo suyo
entrenos.guardarPlaneacion(FormData)     // semanaInicio + dia + nota + imagen? → sube a Blob, borra el anterior
entrenos.guardarAsistencia({ semanaInicio, dia, ausentes })        // upsert; preserva planeación
dashboard.stats()                        // gana `entrenoDeHoy`: filas por entrenador con estado del día (solo Lun/Mié/Vie)
```

- `entrenadorId` **sale de la sesión** en toda escritura — el payload nunca lo trae; un entrenador no puede escribir sesiones de otro.
- Las escrituras son **solo para entrenadores**; el admin recibe `FORBIDDEN` (solo lectura, por diseño del spec 09).
- `guardarPlaneacion` usa `accept: FormData` de Astro Actions (la imagen viaja como `File`); valida tipo/tamaño en servidor además del cliente.
- `semanaInicio` se valida con Zod: fecha `YYYY-MM-DD` que sea **lunes** y esté **dentro de la ventana** generable (defensa barata de forma, no regla de negocio nueva).

### Vercel Blob

- Paquete `@vercel/blob` (server-only, usado en el service). Token `BLOB_READ_WRITE_TOKEN` (server-only, sin prefijo `PUBLIC_`).
- Ruta del blob: `entrenos/{entrenadorId}/{semanaInicio}-{dia}.webp` con `addRandomSuffix: true` (evita caché stale al reemplazar).
- Al reemplazar la imagen de una sesión: subir la nueva → actualizar la URL en Neon → `del(urlAnterior)`. Si el `del` falla, no rompe la operación (se loguea; blob huérfano tolerable).
- Acceso `public` (las URLs de Blob son no-adivinables; el gate real es que solo usuarios logueados las reciben — mismo trade-off que las thumbnails del mock).

### Cliente (compresión)

- Helper `comprimeImagen(file): Promise<Blob>` en `features/admin/` — canvas nativo: `createImageBitmap` → redimensionar a máx 1280px (lado mayor) → `toBlob('image/webp', ~0.8)`. Preview local con `URL.createObjectURL` hasta que la Action confirme.

---

## Plan de implementación

Cada bloque deja `tsc --noEmit` + `build` en verde, el marketing intacto y el admin funcional (el mock de entrenos sigue vivo hasta el bloque D, donde se cambia la fuente).

### Bloque A — Dominio (semana persistible)

1. `lib/domain/entrenos.ts`: `semanaInicioISO(semana)` y `semanaPorWeekId(semanas, weekId)`; `Semana` no cambia de forma para la UI. Funciones puras, fecha como string `YYYY-MM-DD` sin zona horaria.

_Verifica:_ el lunes ISO de cada semana generada es estable e independiente de la hora del día; `semanaPorWeekId` devuelve `null` fuera de la ventana (parseo defensivo del router intacto).

### Bloque B — Schema + Blob + repos + services + actions

2. `lib/db/schema/entrenos.ts` + export en `schema/index.ts`; `db:generate` + `db:migrate` contra Neon.
3. `npm i @vercel/blob`; `BLOB_READ_WRITE_TOKEN` en `.env` local (store de Blob creado en Vercel) y `.env.example`.
4. `lib/db/repos/entrenos.ts` — queries: planes/sesiones por `semanaInicio` (de un entrenador o de todos), upserts de plan, planeación y asistencia.
5. `lib/services/entrenos.ts` — arma las vistas (home del entrenador, sesión del día, vista admin agrupada por entrenador); orquesta Blob en planeación (subir → guardar URL → `del` del anterior, tolerante a fallo del `del`).
6. `src/actions/entrenos.ts` con Zod + `requireUser` + gate por rol (escrituras solo entrenador y solo lo suyo; lectura según rol); `guardarPlaneacion` con `accept: 'form'` y validación de tipo/tamaño de la imagen; registrar en `actions/index.ts`.

_Verifica:_ Actions niegan sin sesión; un admin recibe `FORBIDDEN` al escribir; un entrenador no puede escribir con `semanaInicio` fuera de la ventana ni sesiones de otro (el `entrenadorId` sale de la sesión); subir imagen crea el blob y reemplazarla borra el anterior (verificable en el dashboard de Blob).

### Bloque C — Compresión en cliente

7. Helper `comprimeImagen(file)` (canvas nativo, máx 1280px, WebP ~0.8) en `features/admin/`; sin dependencias nuevas de cliente.

_Verifica:_ una foto de ~4MB queda en ~100–300KB WebP; una imagen ya pequeña no se agranda; un archivo no-imagen rechaza con error claro antes de llamar a la Action.

### Bloque D — Hooks y pantallas a Actions

8. `useEntrenos`, `useSesion`, `useEntrenamientos` → llaman `entrenos.listar` y las escrituras (carga + error + refetch, pesimista), conservando su forma de retorno; la pantalla Sesión comprime antes de enviar el FormData y mantiene el preview local hasta el refetch.
9. Eliminar `data/store-entrenos.ts` y el mock de planes/sesiones en `data/mock.ts`; `PlanSemana`/`Sesion` en `data/types.ts` se alinean al modelo persistido (URL de Blob en vez de object URL).

_Verifica:_ flujo completo en `npm run dev` contra Neon: registrar plan → sesión con imagen → pasar lista → **todo sobrevive a recargar**; corregir una semana pasada funciona; el admin ve lo registrado en solo lectura; el store mock no existe más en el bundle.

### Bloque E — EntrenoDeHoy en el dashboard

10. `dashboard.stats()` gana `entrenoDeHoy` (solo si hoy es Lun/Mié/Vie: fila por entrenador con estado de registro del día); card en `screens/dashboard/` con link a Entrenamientos.

_Verifica:_ en un día de entreno la card lista a cada entrenador con su estado real (thumbnail/asistencia o "sin registrar"); en un día sin entreno la card no se renderiza.

### Bloque F — Docs + cierre

11. Actualizar `backlog.md` (HU-6.10 ☑, HU-4.6 ☑, nota en HU-8.1), `ARCHITECTURE.md` §4 (tablas `planes_semana`/`sesiones` + Blob), `CLAUDE.md` (variable `BLOB_READ_WRITE_TOKEN`).
12. `tsc --noEmit` + `build` en verde; ningún archivo > 200 líneas; cero `any`; marketing prerenderizado intacto; `/admin/**` noindex; verificación visual con Playwright `--headed` (320px–desktop) en Entrenos, Sesión, Entrenamientos y Dashboard.

---

## Criterios de aceptación

### Persistencia y datos

- [ ] Registrar el plan semanal, la planeación del día (imagen + nota) o la asistencia **sobrevive a recargar la página** y a cerrar/abrir sesión (vive en Neon).
- [ ] Los slots se derivan: no existen filas de planes/sesiones que nadie registró; `guardarPlan`/`guardarPlaneacion`/`guardarAsistencia` son idempotentes (guardar dos veces no duplica — constraints únicos por `(entrenadorId, semanaInicio[, dia])`).
- [ ] Guardar la planeación no pisa la asistencia y viceversa (misma semántica del mock: `ausentes: null` = lista sin pasar, `[]` = todos presentes).
- [ ] La identidad de semana es la **fecha del lunes**: la semana 25 de 2026 y la de 2027 no colisionan.
- [ ] Los entrenos arrancan vacíos: no hay seed ni datos de ejemplo en producción.

### Imagen y Blob

- [ ] La imagen de la parte central se comprime en cliente (WebP, máx ~1280px) y se sube a Vercel Blob vía Action; la URL persistida carga el thumbnail tras recargar.
- [ ] Reemplazar la imagen de una sesión **borra el blob anterior** (verificable en el dashboard de Blob); si el borrado falla, la operación no se rompe.
- [ ] Un archivo no-imagen o gigante se rechaza con error claro (validado en cliente y en servidor).
- [ ] `BLOB_READ_WRITE_TOKEN` es server-only: no aparece en ningún bundle del cliente.

### Seguridad por rol

- [ ] Toda Action niega sin sesión (`UNAUTHORIZED`).
- [ ] Un entrenador solo escribe **sus** planes/sesiones: el `entrenadorId` sale de la sesión y un payload manipulado no puede escribir sobre otro entrenador.
- [ ] El admin recibe `FORBIDDEN` en toda escritura de entrenos (solo lectura, por diseño).
- [ ] Una escritura con `semanaInicio` fuera de la ventana (actual + 3 pasadas + 1 futura) o que no sea lunes se rechaza en servidor.

### UI y no-regresión

- [ ] Entrenos, Sesión, Plantel y Entrenamientos funcionan contra la BD con la misma estructura visual; hay estado de carga y de error en cada pantalla migrada.
- [ ] Corregir una semana pasada (imagen, nota, asistencia) funciona dentro de la ventana visible.
- [ ] La vista del admin muestra por entrenador plan y sesiones reales, sin ningún control de edición.
- [ ] `store-entrenos.ts` y el mock de planes/sesiones no existen más en el bundle.

### Dashboard

- [ ] En un día Lun/Mié/Vie, la card EntrenoDeHoy lista cada entrenador con su estado real del día (thumbnail + asistencia, o "sin registrar") y enlaza a Entrenamientos.
- [ ] En un día sin entreno, la card no se renderiza.

### Calidad y no-regresión

- [ ] Ningún archivo > 200 líneas; cero `any`; `tsc --noEmit` + `build` en verde; `@vercel/blob` solo en código de servidor.
- [ ] Marketing prerenderizado intacto; `/admin/**` noindex y fuera del sitemap.
- [ ] De 320px a desktop: cero scroll horizontal en las pantallas tocadas.
- [ ] Docs actualizadas: `backlog.md`, `ARCHITECTURE.md` §4, `CLAUDE.md` (+ `.env.example`).

---

## Decisiones

- **Sí (Will, 2026-07-19):** **clave de semana = fecha del lunes (`semanaInicio: date`)**, no `w-25`. _Por qué:_ el número ISO sin año colisiona en 2027; la fecha es estable, ordena sola y label/número se derivan en dominio. El `weekId` de la URL se conserva (se traduce en el service) — el routing del spec 09 no cambia.
- **Sí (Will, 2026-07-19):** **asistencia como columna `ausentes: integer[]` en `sesiones`**, no tabla normalizada. _Por qué:_ idéntico al contrato del mock (incluida la semántica null/[]), cero joins; las estadísticas por alumno son otro spec y podrán migrar si llegan.
- **Sí (Will, 2026-07-19):** **server upload vía Action (FormData)**, no client upload con token temporal. _Por qué:_ la imagen ya comprimida (~200KB) pasa cómoda por la función; el token de Blob nunca sale del servidor; sin endpoint de handshake extra.
- **Sí (Will, 2026-07-19):** **compresión con canvas nativo**, sin librería. _Por qué:_ regla del proyecto (cero dependencias sin justificación); ~30 líneas cubren redimensionar + WebP; `browser-image-compression` agregaría ~50KB por lo mismo.
- **Sí (Will, 2026-07-19):** **arranque vacío, sin seed de entrenos.** _Por qué:_ el Excel de planeación no tiene estructura de datos aprovechable (imágenes/formato libre); el valor del registro está hacia adelante.
- **Sí (Will, 2026-07-19):** **ventana de edición = ventana de semanas de la UI** (actual + 3 pasadas + 1 futura), sin regla de negocio extra. _Por qué:_ el límite ya lo impone `generarSemanas`; el servidor solo valida forma (lunes válido dentro de la ventana), cerrando el bypass por payload sin inventar una política nueva.
- **Sí (Will, 2026-07-19):** **borrar el blob anterior al reemplazar la imagen** (tolerante a fallo). _Por qué:_ evita acumular huérfanos en la capa gratuita (~1GB); un `del` fallido no debe romper el registro de la sesión — un huérfano ocasional es tolerable.
- **Sí (Will, 2026-07-19):** **EntrenoDeHoy solo en días de entreno**, una fila por entrenador con su estado real; sin card los demás días. _Por qué:_ la card responde "¿cómo va el registro de hoy?"; mostrar "el próximo entreno" un martes es ruido.
- **Sí (Will, 2026-07-19):** **el admin comparte la misma ventana de semanas** que el entrenador. _Por qué:_ supervisión operativa, no archivo histórico; un navegador de histórico completo sería otro spec si el club lo pide.
- **Sí:** **escrituras solo del entrenador y solo lo suyo** (`entrenadorId` desde la sesión, nunca del payload); **admin solo lectura** con `FORBIDDEN`. _Por qué:_ diseño del spec 09 ("la planificación es responsabilidad del profesor"), ahora hecho cumplir en servidor como exige el patrón del spec 11.
- **Sí:** **blobs `public` con ruta no-adivinable** (`addRandomSuffix`). _Por qué:_ Blob no ofrece auth por request sin proxy propio; las URLs solo llegan a usuarios logueados y las imágenes son planeaciones deportivas, no PII sensible.
- **Sí:** **mutaciones pesimistas** (Action confirma → refetch), preview local solo hasta el refetch. _Por qué:_ consistencia con specs 11–12; menos código.
- **No:** **tabla `asistencias` normalizada** — sin HU que la pida hoy (estadísticas son otro spec).
- **No:** **client upload de Blob** — más superficie (handshake + token temporal) sin beneficio al tamaño real de las imágenes.
- **No:** **selector libre de semanas/histórico completo** — otro spec.
- **No:** **notificaciones al profesor por sesiones sin registrar** — otro spec.

---

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| `toBlob('image/webp')` no está soportado en algún navegador viejo (Safari < 16 exporta PNG/JPEG). | El helper detecta el tipo real del blob resultante y hace fallback a JPEG (~0.8); el servidor acepta `image/webp` y `image/jpeg`. La URL guarda la extensión real. |
| La imagen viaja por la función serverless: un payload grande agota memoria o el límite del body (4.5MB). | La compresión en cliente la deja en ~100–300KB; el servidor rechaza > 1MB con error claro (defensa en profundidad, no ruta feliz). |
| Reemplazos concurrentes o `del()` fallido dejan blobs huérfanos. | Aceptado y acotado: el `del` es best-effort (se loguea el fallo); volumen estimado ~120MB/año contra ~1GB gratis. Limpieza manual por prefijo `entrenos/` si algún día duele. |
| El cambio de `weekId` a `semanaInicio` desalinea URL, dominio y BD (off-by-one de zona horaria en el lunes). | Fechas como string `YYYY-MM-DD` de punta a punta (mismo criterio del spec 11); `semanaInicioISO` es puro y testeable; el criterio de aceptación de identidad de semana lo cubre. |
| Migrar 3 hooks a async a la vez introduce estados de carga inconsistentes. | Los hooks conservan su contrato (misma forma + `loading/error` uniformes); patrón de skeleton/error ya definido en specs 11–12 y reusado. |
| Las `cats` del entrenador no cruzan con los alumnos reales y el roster de asistencia sale vacío. | Riesgo heredado del spec 09 y ya mitigado: `rosterDe` compara normalizado y el empty state con hint de revisar Equipo se conserva; ahora los alumnos son reales (spec 11), reduciendo el desalineo. |
| Un blob `public` filtra una planeación si la URL se comparte. | Aceptado explícitamente (decisión): contenido no sensible, URL no-adivinable; si el club lo objetara, el proxy autenticado sería otro spec. |
| El upsert de planeación y el de asistencia se pisan entre sí (dos escritores del mismo slot). | Cada Action actualiza **solo sus columnas** (planeación: url/nota; asistencia: ausentes) sobre la fila única por constraint — mismo patrón "no pisa" del store mock, ahora garantizado por SQL. |

---

## Lo que **NO** entra en este spec

- Estadísticas o alertas de asistencia.
- Histórico completo navegable (selector libre de semanas).
- Edición de entrenamientos por el admin.
- Notificaciones al profesor.
- Seed de entrenos históricos.

Cada uno, si llega, va en su propio spec.
