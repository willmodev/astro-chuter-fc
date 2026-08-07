# SPEC 15 — Catálogo único de categorías, categoría por edad y asignación a entrenadores

> **Estado:** Implementado y aplicado en producción (2026-07-30) — cliente confirmó los cambios de SUB y el seed ya corrió en COMMIT · **Depende de:** SPEC 01 (landing y colección `programas`), SPEC 02 (form público de contacto), SPEC 04 (alta de usuarios y `user.cats`), SPEC 05 (chips de categoría y ficha), SPEC 11 (seed desde el Excel, `fecha_nacimiento` nullable) · **Fecha:** 2026-07-28
> **Objetivo:** Reemplazar las **dos taxonomías desincronizadas** de categorías (SUB N en el admin, nombres en la landing) por un **catálogo único de 7 categorías** con mapeo 1:1 confirmado por el cliente; pasar la categoría a calcularse por **edad cumplida** (regla que él definió) con degradación segura mientras faltan fechas de nacimiento; y convertir la asignación de categorías a un entrenador en una **selección de las disponibles** en vez del texto libre de hoy.

---

## Por qué existe este spec

Hoy conviven dos listas de categorías que nadie mantiene sincronizadas:

- **Admin** — `SUBS` genera `SUB 4 … SUB 16` por código y `subDeAnio()` deriva la del alumno con `ANIO_TEMPORADA = 2026` **hardcodeado** (`src/lib/domain/categoria.ts:21,27,37`).
- **Landing** — `CATEGORIAS_POR_ANIO` (`categoria.ts:6`) y 4 archivos en `src/content/programas/*.md` con el rango de años **escrito a mano** (`nacidos: "2019 - 2022"`).

Y la asignación de categorías a un entrenador es **texto libre**: `NuevoUsuarioSheet.tsx:91` pide `"SUB 8, SUB 10"` en un `<input>` y `normalizaCats` solo valida el patrón `/^SUB \d{1,2}$/` (`lib/domain/usuarios.ts:39`). Eso acepta `SUB 7`, `SUB 99` o `SUB 3` sin chistar, y **nada impide que dos entrenadores queden a cargo de la misma categoría**.

Consecuencias medidas sobre los datos reales del club:

1. **2 alumnos nacidos en 2023 ya inscritos no caben en ninguna categoría publicada** (la web arranca en 2022). Un papá con un niño de esa edad entra al sitio y cree que no aplica.
2. Faltan **3 de las 7 categorías** que el club maneja (Baby, Benjamín, Juvenil).
3. Los nombres publicados no corresponden a los años que muestran: la web dice `Preinfantil = 2017-2018`, cuando en la operación real Preinfantil es SUB 10.
4. Cada 1 de enero los cuatro `nacidos:` del frontmatter y `ANIO_TEMPORADA` quedan mal y hay que tocar código.

### Respuestas del cliente que cierran el modelo

| Tema                     | Respuesta (2026-07-27/28)                                                                                                                           |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mapeo SUB ↔ nombre       | **1:1**: `SUB 4 → Baby`, `SUB 6 → Pony`, `SUB 8 → Benjamín`, `SUB 10 → Preinfantil`, `SUB 12 → Infantil`, `SUB 14 → Prejuvenil`, `SUB 16 → Juvenil` |
| SUB 16                   | Se abre — "métela también, JUVENIL"                                                                                                                 |
| Edad mínima              | Sí reciben nacidos en 2023 ("tienen en la actualidad 3 años")                                                                                       |
| Temporada                | Año calendario — "no paramos, incluso en diciembre hacemos un vacacional; desde el otro año vamos desde enero"                                      |
| **Cuándo cambia de SUB** | **Al cumplir años**, no al cambiar de temporada                                                                                                     |
| Fecha de nacimiento      | Hoy no la pide en la inscripción; **empieza a pedirla y va a pasar las 77 fechas en estos días**                                                    |
| Miguel Ángel Rodríguez   | Es **2014**, no 2024                                                                                                                                |

La decisión sobre "cambia al cumplir años" tiene consecuencias fuertes que este spec asume explícitamente — ver **Decisiones** y **Riesgos**.

---

## Alcance

**Dentro:**

- **Dominio** (`src/lib/domain/categoria.ts`, reescrito): un solo catálogo `CATEGORIAS` (`as const`, 7 entradas `{ sub, nombre }`) como fuente de verdad. `categoriaDeEdad`, `categoriaDeFecha`, `categoriaDeAnio`, `edadCumplida`, `listarCategorias`. Se **eliminan** `CATEGORIAS_POR_ANIO`, `sugerirCategoria`, `SUBS`, `ANIO_TEMPORADA` y `subDeAnio`/`subDeFecha` en su forma actual.
- **Regla por edad cumplida** con **fallback por año** mientras `fecha_nacimiento` sea `null`, y **clamp inferior a SUB 4** (un niño de 3 años es, literalmente, "sub 4").
- **Visibilidad del dato faltante**: contador de alumnos sin fecha de nacimiento en la pantalla Alumnos + badge "Falta fecha" en la ficha, para que Camilo sepa a quién le falta.
- **Colección `programas`** (`content.config.ts` + `src/content/programas/`): el frontmatter gana `sub: number` y **pierde** `nacidos` y `edadAprox`. Se crean `baby.md`, `benjamin.md`, `juvenil.md`; los 4 existentes se corrigen. `entrenador` pasa a opcional.
- **Landing** (`ProgramsSection.astro`): 7 tarjetas; muestran **edad** ("7 a 8 años") como dato principal, que bajo la regla por cumpleaños es exacto y **nunca se desactualiza**.
- **Form público** (`ContactForm.tsx` + `services/contacto.ts`): pasa de pedir **año** a pedir **fecha de nacimiento** completa, para capturar el dato en el origen y sugerir la categoría exacta.
- **Alta y edición de entrenador** (`NuevoUsuarioSheet.tsx`, `lib/domain/usuarios.ts`, `lib/services/usuarios.ts`, `lib/db/repos/usuarios.ts`): el `<input>` de texto libre se reemplaza por **selección múltiple de las 7 categorías**, con las ya tomadas por otro entrenador activo **deshabilitadas**. Validación equivalente en servidor (la UI no es la barrera).
- **Corrección de dato**: `MIGUEL ANGEL RODRIGUEZ` `anio_nacimiento` `2024 → 2014` (script idempotente por documento) + anomalía marcada resuelta en `docs/excel-data-dictionary.md`.
- **Docs**: `CLAUDE.md` (tabla de categorías, regla de edades vs años en la landing), `docs/ARCHITECTURE.md`, `docs/backlog.md`.

**Fuera del alcance (otros specs):**

- **Tabla `categorias` en BD** — 7 filas fijas que el cliente no edita; sería migración + repo + query para devolver siempre lo mismo.
- **FK `alumnos.categoria_id`** — la categoría es una proyección de la edad, no un atributo del alumno.
- **Migración de schema de cualquier tipo** — `fecha_nacimiento` ya existe y ya es nullable; `user.cats` ya existe.
- **Carga masiva de las 77 fechas** — cuando Camilo las mande, se cargan por el mismo camino del seed; no es código nuevo.
- **Override manual de categoría** por alumno (jugar en una superior por nivel).
- **Histórico** de en qué categoría estuvo un alumno.
- **Que la landing lea el entrenador desde BD** — sigue en el markdown (ver Riesgos: duplicación conocida).
- **Chip/filtro "sin fecha de nacimiento"** en la lista — basta el contador y el badge.
- **Aviso automático** cuando un alumno cambia de SUB por cumpleaños.

---

## Modelo de datos

**Cero migración.** No se crean ni alteran tablas. Se usan columnas que ya existen: `alumnos.anio_nacimiento`, `alumnos.fecha_nacimiento` (nullable, `schema/alumnos.ts:18`) y `user.cats` (`text[]`, `schema/auth.ts:26`).

### Catálogo único (`src/lib/domain/categoria.ts`)

```ts
export const CATEGORIAS = [
  { sub: 4, nombre: 'Baby' },
  { sub: 6, nombre: 'Pony' },
  { sub: 8, nombre: 'Benjamín' },
  { sub: 10, nombre: 'Preinfantil' },
  { sub: 12, nombre: 'Infantil' },
  { sub: 14, nombre: 'Prejuvenil' },
  { sub: 16, nombre: 'Juvenil' },
] as const;

export type Categoria = {
  sub: number; // 4 … 16
  nombre: string; // 'Benjamín'
  etiqueta: string; // 'SUB 8'   ← formato ya persistido en user.cats, no cambia
  edades: string; // '7 a 8 años'
};
```

### Regla de categoría

```ts
edadCumplida(fechaNacimiento: Date, hoy: Date): number;
categoriaDeEdad(edad: number): Categoria | null;
categoriaDeFecha(fecha: Date, hoy: Date): Categoria | null;
categoriaDeAnio(anio: number, hoy: Date): Categoria | null;   // fallback sin fecha
categoriaDeAlumno(a: { fechaNacimiento: Date | null; anioNacimiento: number }, hoy: Date): Categoria | null;
listarCategorias(): Categoria[];
```

**Fórmula (regla del cliente):**

```
sub = ceil(edadCumplida / 2) × 2,   con clamp inferior a 4 y sin categoría por encima de 16
```

- `edadCumplida` = años completos a la fecha de hoy. Un niño de 7 es `SUB 8`; el día que cumple 9, pasa a `SUB 10`.
- **Clamp inferior:** `sub < 4 → SUB 4`. Un niño de 3 años (nacidos 2023, que el cliente confirmó que recibe) es literalmente "sub 4". Sin el clamp caería en un inexistente "SUB 2" y desaparecería de todos los filtros.
- **Sin categoría** si `edad > 16`.

**Fallback mientras falta la fecha** (`categoriaDeAlumno` con `fechaNacimiento === null`):

```
sub = ceil((añoActual − añoNacimiento) / 2) × 2
```

Esto es **exactamente equivalente** a suponer que el alumno nació el 1 de enero, que es lo que el cliente pidió ("por ahora inventale un mes y día") — pero **sin escribir un dato falso en la base**. Ventaja concreta: `fecha_nacimiento IS NULL` sigue siendo consultable, así que el admin puede mostrar cuántos alumnos faltan por completar. Además reproduce **77/77** la asignación del Excel actual, así que **nada se mueve** hasta que lleguen las fechas reales.

### Categorías por temporada 2026 (con el fallback vigente)

| SUB    | Categoría   | Edad         | Nacidos (fallback) | Alumnos     |
| ------ | ----------- | ------------ | ------------------ | ----------- |
| SUB 4  | Baby        | 3 a 4 años   | 2022 - 2023        | 2           |
| SUB 6  | Pony        | 5 a 6 años   | 2020 - 2021        | 12          |
| SUB 8  | Benjamín    | 7 a 8 años   | 2018 - 2019        | 17          |
| SUB 10 | Preinfantil | 9 a 10 años  | 2016 - 2017        | 13          |
| SUB 12 | Infantil    | 11 a 12 años | 2014 - 2015        | 22          |
| SUB 14 | Prejuvenil  | 13 a 14 años | 2012 - 2013        | 11          |
| SUB 16 | Juvenil     | 15 a 16 años | 2010 - 2011        | 0 (se abre) |

### Asignación de categorías a entrenadores

```ts
// Dominio (lib/domain/usuarios.ts) — reemplaza el regex actual
normalizaCats(role: Rol, cats: readonly string[]): string[];        // valida contra CATEGORIAS
validaDisponibles(cats: readonly string[], ocupadas: readonly string[]): void;  // lanza UsuarioReglaError

// Repo (lib/db/repos/usuarios.ts)
categoriasOcupadas(excluirUsuarioId?: string): Promise<string[]>;   // cats de entrenadores ACTIVOS

// Service (lib/services/usuarios.ts)
listarCategoriasAsignables(usuarioId?: string): Promise<{ etiqueta: string; nombre: string; ocupadaPor: string | null }[]>;
```

Reglas:

- Una categoría pertenece **a un solo entrenador activo** a la vez.
- Un entrenador **desactivado libera** sus categorías (quedan asignables); al reactivarlo, si alguna fue tomada, se le pide reasignar.
- Al **editar** un entrenador, sus propias categorías no cuentan como ocupadas.
- Un `admin` sigue teniendo `cats = []` (no entrena).
- El formato persistido sigue siendo `"SUB 8"` → **cero migración de `user.cats`**.

---

## Plan de implementación

### Bloque A — Dominio: catálogo único y regla por edad

1. Reescribir `src/lib/domain/categoria.ts` con `CATEGORIAS` y los contratos de arriba. Sin constantes de año hardcodeadas.
2. `edadCumplida` calcula con mes y día (no `getFullYear()` a secas) y en zona local, para que un cumpleaños del 1-ene no corra de año (riesgo TZ ya anotado en SPEC 11).
3. Borrar `CATEGORIAS_POR_ANIO`, `sugerirCategoria`, `SUBS`, `ANIO_TEMPORADA`, `CategoriaSugerida`.

### Bloque B — Migrar los consumidores

| Archivo                                                 | Cambio                                                               |
| ------------------------------------------------------- | -------------------------------------------------------------------- |
| `src/lib/services/mapea-alumno.ts:32`                   | `categoriaDeAlumno(row, hoy)` — usa la fecha si existe, si no el año |
| `src/lib/services/dashboard.ts:66`                      | idem                                                                 |
| `src/lib/services/alumnos.ts:168`                       | validación de rango con `categoriaDeFecha`                           |
| `src/lib/domain/alumnos.ts:138`                         | idem                                                                 |
| `src/lib/services/contacto.ts:24`                       | `categoriaDeFecha`; el correo trae `Benjamín (SUB 8)`                |
| `features/admin/screens/alumnos/ChipsCategoria.tsx`     | chips desde `listarCategorias()`                                     |
| `features/admin/screens/alumno-form/BadgeCategoria.tsx` | muestra `SUB 8 · Benjamín`                                           |

### Bloque C — Visibilidad de las fechas faltantes

1. Repo/service: contar `fecha_nacimiento IS NULL` entre alumnos activos.
2. Pantalla Alumnos: línea `N alumnos · N en mora · N sin fecha de nacimiento`.
3. Ficha: badge **"Falta fecha de nacimiento"** cuando corresponda, junto a la categoría, con nota de que se está calculando por año.

### Bloque D — Colección `programas`: 7 categorías

1. `content.config.ts`: añadir `sub: z.number()`, quitar `nacidos` y `edadAprox`, `entrenador` pasa a `.optional()`.
2. Actualizar `pony`, `preinfantil`, `infantil`, `prejuvenil` (añadir `sub`, corregir `orden`).
3. Crear `baby.md` (SUB 4), `benjamin.md` (SUB 8), `juvenil.md` (SUB 16) con `<!-- TODO: pedir a Camilo - entrenador -->`.
4. `ProgramsSection.astro`: 7 tarjetas; el dato principal es la **edad** (`categoria.edades`); la línea del entrenador se omite si no hay dato.

### Bloque E — Form público: fecha de nacimiento

1. `ContactForm.tsx:106-111`: el `<input type="number">` de año pasa a `<input type="date">` de fecha de nacimiento, con `min`/`max` derivados del rango admitido.
2. La sugerencia bajo el campo muestra la categoría **exacta** (`Benjamín · SUB 8`).
3. `services/contacto.ts` y el schema Zod de la Action reciben `fechaNacimiento`; el correo al club la incluye.

### Bloque F — Asignación de categorías al entrenador

1. `lib/domain/usuarios.ts`: `normalizaCats` valida **pertenencia al catálogo** (adiós al regex, adiós a `SUB 7`/`SUB 99`); nueva `validaDisponibles`.
2. `lib/db/repos/usuarios.ts`: `categoriasOcupadas(excluirUsuarioId?)`.
3. `lib/services/usuarios.ts`: `listarCategoriasAsignables`; `crearUsuario`/`actualizarUsuario` llaman a `validaDisponibles` **antes** de escribir.
4. `actions/usuarios.ts`: nueva query `usuarios.categoriasAsignables`; el Zod de `cats` pasa a `z.array(z.enum(...))`.
5. `NuevoUsuarioSheet.tsx`: el `<input>` se reemplaza por chips/checkboxes de las 7 categorías (`SUB 8 · Benjamín`), las tomadas deshabilitadas y con el nombre del entrenador que las tiene. Solo visible con `role = 'entrenador'`.
6. `EquipoScreen.tsx`: nota "N categorías sin entrenador asignado" cuando aplique.

### Bloque G — Corrección del dato de Miguel Ángel

1. Script idempotente por `documento`, con guarda `WHERE anio_nacimiento = 2024`: `2024 → 2014`.
2. `docs/excel-data-dictionary.md`: anomalía → "resuelta, confirmada por el cliente 2026-07-27".

### Bloque H — Docs y cierre

1. `CLAUDE.md`: tabla de las 7 categorías; **actualizar la regla** de "mostrar años, nunca edades" → bajo la regla por cumpleaños, la edad es el dato exacto y evergreen (ver Decisiones); quitar los bloques de markdown de programas obsoletos.
2. `docs/ARCHITECTURE.md`: `lib/domain/categoria.ts` como fuente única para landing y admin; regla de unicidad categoría → entrenador.
3. `docs/backlog.md`: HU cerradas por este spec.
4. `npm run check` + revisión visual con `npm run dev`.

---

## Criterios de aceptación

> Verificado el 2026-07-30 contra el código, `npx astro check`, 20 aserciones sobre
> el dominio y una sesión real en el admin (`playwright-cli`, usuario Camilo).

### Catálogo y regla de categoría

- [x] Existe **una sola** lista de categorías; `grep CATEGORIAS_POR_ANIO` y `grep ANIO_TEMPORADA` no devuelven nada (solo quedan menciones históricas en specs anteriores).
- [x] Con fecha `2018-03-10` y hoy `2026-07-28` (8 años) → `SUB 8 · Benjamín`.
- [x] Con fecha `2019-11-20` y hoy `2026-07-28` (6 años) → `SUB 6 · Pony`; con hoy `2026-11-21` (7 años) → `SUB 8 · Benjamín`. **La categoría cambia el día del cumpleaños** (verificado también en el borde exacto: 19-nov Pony / 20-nov Benjamín).
- [x] Con fecha `2023-05-02` (3 años) → `SUB 4 · Baby` por el clamp, **no** `null`.
- [x] Con `fechaNacimiento = null` y `anioNacimiento = 2019` → `SUB 8` (fallback por año).
- [x] Con el fallback vigente, las categorías reproducen la asignación del Excel: **84/84** con el Excel del 2026-07-30. (El "77/77" del enunciado era sobre el Excel anterior.) `KEINER BOSCAN` parecía una discrepancia y resultó ser un **bug del seed**: nació el `2011-12-15`, tiene 14 años y SUB 14 (lo que dice el Excel) es lo correcto por edad cumplida — solo el fallback por año daba SUB 16. `seed-filas.mjs` comparaba la categoría del Excel contra la del año aunque la fila trajera fecha; ahora el cross-check vale contra cualquiera de las dos reglas y la fila ya no se descarta.
- [x] Un alumno de 17 años → sin categoría; a los 16 recién cumplidos sigue en SUB 16.

### Fechas faltantes

- [x] La pantalla Alumnos muestra cuántos activos no tienen fecha de nacimiento. Tras el seed: `96 alumnos · 38 en mora · 20 sin fecha de nacimiento` (8 del Excel con solo el año + 12 que ya no figuran en la hoja).
- [x] La ficha de un alumno sin fecha muestra el badge "Falta fecha de nacimiento — categoría calculada por año".
- [x] Al cargar la fecha real de un alumno, su categoría se recalcula sola en el siguiente render, sin tocar código (en el form: `2018-03-10 → SUB 8 · Benjamín`, `2023-05-02 → SUB 4 · Baby`).
- [x] **Ningún alumno tiene una fecha de nacimiento inventada en la base** — el seed solo escribe la fecha si el Excel la trae, y nunca la pisa con `null`.

### Landing

- [x] Muestra **7 tarjetas** en orden SUB 4 → SUB 16.
- [x] Ningún archivo de `src/content/programas/` contiene un rango de años escrito a mano.
- [x] Cada tarjeta muestra la edad (`3 a 4` … `15 a 16 años`) y el nombre bien escrito (`Benjamín` con tilde, `Infantil` sin el typo del flyer).
- [x] Baby, Benjamín y Juvenil **no muestran entrenador** (no se inventa un nombre) y llevan `TODO` en el markdown.
- [x] La página no necesita rebuild el 1 de enero para seguir siendo correcta.

### Form público

- [x] Pide fecha de nacimiento completa y rechaza fechas fuera del rango admitido (`min=2009-07-31`, `max=2026-07-30` + `refine` en la Action).
- [x] La categoría sugerida es la exacta según la fecha (`Categoría: Benjamín · SUB 8`).
- [x] El correo al club trae fecha de nacimiento y categoría con nombre y SUB — verificado en `inscripcion-template.ts`; **no se envió un correo real** para no escribirle a la bandeja del club.

### Asignación de categorías al entrenador

- [x] El alta de entrenador muestra las 7 categorías como opciones; **no hay campo de texto libre**.
- [x] Una categoría ya asignada a otro entrenador activo aparece **deshabilitada** e indica quién la tiene.
- [ ] Al editar un entrenador, sus propias categorías aparecen **seleccionables** (no bloqueadas por sí mismo). → **No hay flujo de edición de usuario en el admin** (solo crear, activar/desactivar y resetear contraseña). `listarCategoriasAsignables(usuarioId?)` y `categoriasOcupadas(excluir?)` ya lo soportan; el criterio queda cubierto en servicio y sin UI que lo ejercite.
- [x] Enviar `cats: ["SUB 7"]` o `["SUB 99"]` directo a la Action **falla en servidor** (400 `AstroActionInputError`, `invalid_value`).
- [x] Enviar una categoría ya ocupada directo a la Action **falla en servidor** con mensaje claro (400 `Ya tiene entrenador asignado: SUB 8.`).
- [~] Desactivar a un entrenador libera sus categorías para otro — verificado en dominio (`categoriasSinEntrenador` ignora inactivos) y en el repo (`categoriasOcupadas` filtra `banned = false`), **no end-to-end**: exige desactivar a un entrenador real en la base de producción.
- [x] **Limpieza:** el usuario de verificación `verify-trainer-…@chuter.test` (activo con `SUB 8` y `SUB 10`, duplicando las de René Torres) fue borrado junto con sus 2 planes y 2 sesiones de prueba — `scripts/borra-usuarios-prueba.mjs`, idempotente y con DRY RUN por defecto.
- [x] Crear un `admin` no muestra el selector y guarda `cats = []`.
- [x] `user.cats` sigue guardando el formato `"SUB 8"` — los entrenadores existentes siguen viendo su mismo plantel (no-regresión de `listarPlantel`).

### Dato corregido

- [x] `MIGUEL ANGEL RODRIGUEZ` tiene `anio_nacimiento = 2014` y aparece en `SUB 12` — aplicado por el seed del 2026-07-30 (`fecha_nacimiento = 2014-07-16`) y verificado en la lista del admin.
- [x] El script es idempotente: guarda `WHERE anio_nacimiento = 2024` y DRY RUN por defecto.

### Calidad y no-regresión

- [x] `npm run check` (= `astro check`, agregado en este spec junto con `@astrojs/check`) en verde: **0 errores, 0 warnings**. Cero `any`. Ningún archivo supera 200 líneas contando como la regla del proyecto (`skipBlankLines`+`skipComments`); el mayor es `src/lib/services/alumnos.ts` con 203 crudas / **167 efectivas**.
- [x] La landing sigue siendo estática (`prerender = false` solo en `/admin/**` y `/api/**`).
- [~] Lighthouse mobile sobre el build (`.vercel/output/static` servido en local): **performance 91 · a11y 90 · best-practices 100 · SEO 100**, CLS 0, LCP 3.2 s. Ninguna de las violaciones proviene de las tarjetas nuevas (son contrastes del footer/testimonios, `aria-label` en `div`s de estrellas y `label-content-name-mismatch` en CTAs, todo preexistente). El LCP local no es comparable con producción (sin compresión ni CDN). **Deuda separada:** el budget de `CLAUDE.md` exige a11y 100 y hoy la landing está en 90.

---

## Decisiones

- **Sí:** **catálogo `as const` en `lib/domain`, no tabla en BD.** _Por qué:_ 7 filas fijas que el cliente no edita; una tabla exige migración, repo, query y seed para devolver siempre lo mismo. Sigue la convención del repo. Si algún día se edita desde el admin, migra sin tocar consumidores.
- **Sí:** **cero FK `alumnos → categoría`.** _Por qué:_ la categoría es una proyección de la edad; persistirla obliga a recalcular a mano y se desincroniza al editar la fecha.
- **Sí:** **categoría por edad cumplida.** _Por qué:_ es lo que el cliente definió y reafirmó al comprometerse a recolectar las fechas. Ver el primer riesgo por lo que implica.
- **Sí:** **`fecha_nacimiento` se queda en `null` en vez de inventarle mes y día.** _Por qué:_ el resultado es **idéntico** al 1-enero que él propuso (la fórmula por año es exactamente ese caso), pero sin meter un dato falso a la base — que además `CLAUDE.md` prohíbe. Y con `null` podemos contar y perseguir los que faltan; con una fecha inventada no habría forma de distinguirlos nunca más.
- **Sí:** **clamp inferior a SUB 4.** _Por qué:_ "sub 4" significa _hasta_ 4 años, así que un niño de 3 es SUB 4 por definición. Sin clamp, los 2 alumnos de 2023 que el cliente confirmó que recibe caerían en un "SUB 2" inexistente y desaparecerían de los filtros la mitad del año.
- **Sí:** **la landing publica edades, no años de nacimiento.** _Por qué:_ invierte la regla vigente de `CLAUDE.md`, y con razón: esa regla existía porque "las edades cambian cada año". Bajo la regla por cumpleaños es al revés — `Benjamín = 7 a 8 años` es cierto para siempre, mientras que `nacidos 2018-2019` deja de serlo cada enero **y** es inexacto todo el año (un 2019 de noviembre es Pony hasta noviembre). Se actualiza `CLAUDE.md` en consecuencia.
- **Sí:** **el form público pasa a pedir fecha de nacimiento.** _Por qué:_ con la regla por edad, el año solo permite una respuesta ambigua ("Benjamín o Pony, según el mes"). Además captura en el origen justo el dato que el cliente empezó a recolectar, así que las inscripciones nuevas nunca nacen incompletas. _Contra:_ un campo algo más pesado en un formulario de conversión; mitigado con `type="date"` nativo, que en móvil es un solo tap.
- **Sí:** **una categoría, un entrenador activo.** _Por qué:_ es lo que pidió el usuario y lo que evita que dos personas se atribuyan el mismo plantel. El caso "dos entrenadores comparten grupo" no existe hoy y agregarlo después no rompe datos.
- **Sí:** **desactivar un entrenador libera sus categorías.** _Por qué:_ si no, un entrenador baneado bloquea su grupo para siempre y hay que reactivarlo solo para liberarlo.
- **Sí:** **validar disponibilidad también en servidor.** _Por qué:_ el selector es UX, no seguridad; la Action es la frontera real y hoy acepta cualquier string que pase el regex.
- **Sí:** **`user.cats` sigue guardando `"SUB 8"`.** _Por qué:_ cero migración y `listarPlantel` sigue funcionando igual.
- **No:** **inventar entrenador para Baby, Benjamín y Juvenil.** _Por qué:_ `CLAUDE.md` prohíbe inventar datos del cliente; la tarjeta simplemente omite la línea.
- **No:** **aviso automático cuando un alumno cambia de SUB al cumplir años.** _Por qué:_ no se pidió; cuando lleguen las fechas reales se verá si hace falta.

---

## Riesgos identificados

| Riesgo                                                                                                                                                                                                                                                                                                                                                                                                              | Mitigación                                                                                                                                                                                                                                                                                                          |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **La regla por cumpleaños va a mover alumnos de SUB respecto del Excel del cliente.** De los 77, **36 (47%) están en cohortes "impares"** (2013, 2015, 2017, 2019, 2021, 2023): los que aún no cumplieron años **bajan una categoría** respecto de donde él los tiene hoy. Estimado ~15 alumnos al llegar las fechas, y el número cambia cada mes. Sus hojas de asistencia por SUB dejarán de cuadrar con el admin. | **Es consecuencia directa de la regla que él eligió, no un bug.** El fallback por año hace que **hoy no se mueva nadie**: el cambio ocurre alumno por alumno a medida que él cargue cada fecha, no de golpe. Antes de cargar las 77 hay que mostrarle la lista de quiénes cambian y confirmar que es lo que espera. |
| Un alumno cambia de SUB **a mitad de torneo**, el día de su cumpleaños.                                                                                                                                                                                                                                                                                                                                             | Inherente a la regla. Se documenta como semántica esperada. Si el club se queja, el arreglo es de una línea (volver a la regla por año calendario), porque toda la lógica está aislada en `categoriaDeAlumno`.                                                                                                      |
| Los 2 alumnos de 2023 quedan fuera de rango y desaparecen de los filtros.                                                                                                                                                                                                                                                                                                                                           | Resuelto por el clamp inferior a SUB 4, con criterio de aceptación explícito.                                                                                                                                                                                                                                       |
| Cargar las 77 fechas a mano introduce errores de digitación (día/mes invertido, año mal).                                                                                                                                                                                                                                                                                                                           | La fecha se valida contra `anio_nacimiento` ya existente: si el año de la fecha no coincide, se rechaza. `anio_nacimiento` sigue siendo el dato duro que ya está verificado contra el Excel.                                                                                                                        |
| Las 3 categorías nuevas quedan **sin entrenador** y la tarjeta se ve incompleta.                                                                                                                                                                                                                                                                                                                                    | `entrenador` pasa a opcional; la tarjeta omite la línea en vez de mostrar un placeholder. Queda `TODO` en el markdown y en los pendientes de `CLAUDE.md`.                                                                                                                                                           |
| **Doble fuente de verdad del entrenador**: `user.cats` (BD, real) vs `entrenador:` en el markdown de la landing. Pueden divergir.                                                                                                                                                                                                                                                                                   | Se documenta explícitamente en `ARCHITECTURE.md` como duplicación conocida y aceptada: la landing es estática y no debe depender de la BD en build. Candidato a otro spec si empieza a doler.                                                                                                                       |
| Al cambiar el form público de año a fecha, cae la conversión.                                                                                                                                                                                                                                                                                                                                                       | `type="date"` nativo, un solo tap en móvil, campo requerido igual que antes. Vercel Analytics ya mide el envío del form; comparar dos semanas antes/después.                                                                                                                                                        |
| Borrar `sugerirCategoria` rompe el correo de contacto en silencio.                                                                                                                                                                                                                                                                                                                                                  | `strict` lo detecta en compilación (la función deja de existir) + criterio de aceptación sobre el correo.                                                                                                                                                                                                           |
| Race: dos admins asignan la misma categoría a la vez.                                                                                                                                                                                                                                                                                                                                                               | La validación en servidor lee las ocupadas dentro de la misma operación de escritura; el segundo falla con mensaje claro. Riesgo residual despreciable con 2 admins.                                                                                                                                                |
| El script de Miguel Ángel se corre dos veces o contra la BD equivocada.                                                                                                                                                                                                                                                                                                                                             | Idempotente por `documento` con guarda `WHERE anio_nacimiento = 2024`.                                                                                                                                                                                                                                              |
| `categoria.ts` supera las 200 líneas.                                                                                                                                                                                                                                                                                                                                                                               | El catálogo son 9 líneas y las funciones 3-6; si crece, los helpers de formato salen a `categoria-formato.ts`.                                                                                                                                                                                                      |

---

## Pendientes del cliente (no bloquean el desarrollo)

- [~] **Las fechas de nacimiento** — el Excel del 2026-07-30 ya trae **75 de 83**; faltan 8 (José Antonio López, Maximiliano Pinto, Matew Andrés Méndez, Matías Vides Vásquez, Ángel Santiago, Adrián Pacheco, Alan Cujía Bolaño, Cristian Ruidíaz). Hasta que lleguen, el fallback por año los mantiene donde están.
- [ ] **Entrenador de Baby, Benjamín y Juvenil** — hoy hay 4 entrenadores para 7 categorías.
- [x] **Confirmado por el cliente (2026-07-30)** y aplicado: los 11 alumnos que cambian de SUB al aplicar las fechas reales. La lista la genera `npx tsx scripts/reporte-cambios-categoria.mjs` (solo lectura, no toca la base). El 11.º es `KEINER BOSCAN` (SUB 16 → SUB 14), que solo cambia respecto del fallback por año: en el Excel del cliente ya estaba en SUB 14.

  | Alumno                   | Fecha      | Excel  | Real   |
  | ------------------------ | ---------- | ------ | ------ |
  | MARTIN SANCHEZ CONTRERAS | 2017-10-28 | SUB 10 | SUB 8  |
  | JUAN DAVID GUTIERREZ     | 2017-08-21 | SUB 10 | SUB 8  |
  | ALEX ESCALONA            | 2017-10-08 | SUB 10 | SUB 8  |
  | JAZMIN ARCINIEGAS DAMIAN | 2015-08-13 | SUB 12 | SUB 10 |
  | JONAS QUINTERO SANTANA   | 2015-11-24 | SUB 12 | SUB 10 |
  | ANGEL VASQUEZ SANTANA    | 2021-11-28 | SUB 6  | SUB 4  |
  | LIAM ISAAC LARA ARRIETA  | 2019-11-04 | SUB 8  | SUB 6  |
  | SAMUEL MARCHENA          | 2019-12-14 | SUB 8  | SUB 6  |
  | MATIAS QUINTERO          | 2019-09-27 | SUB 8  | SUB 6  |
  | ANDRES MENDOZA ANGEL     | 2019-09-01 | SUB 8  | SUB 6  |

- [ ] **3 filas del Excel que el seed omite** hasta que se corrijan: `GERONIMO ESCORCIA` (año `2106`), `ABRAHAM PEREZ` (sin nacimiento) y `JUAN PABLO MAESTRE` (sin documento).
- [ ] **13 alumnos activos en la base que ya no están en el Excel** — el seed nunca borra, así que siguen contando. Hay que preguntarle a Camilo si se retiraron (ver la lista en `docs/excel-data-dictionary.md`).

---

## Lo que **NO** entra en este spec

- Tabla `categorias` en BD ni FK desde `alumnos`.
- Migración de schema de cualquier tipo.
- Override manual de la categoría de un alumno.
- Histórico de categorías por alumno/temporada.
- Que la landing lea el entrenador desde la base de datos.
- Chip/filtro "sin fecha de nacimiento" en la lista de alumnos.
- Aviso automático de cambio de categoría por cumpleaños.
- Dos entrenadores compartiendo una misma categoría.

Cada uno, si llega, va en su propio spec.
