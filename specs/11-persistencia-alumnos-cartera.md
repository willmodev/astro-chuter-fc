# SPEC 11 — Persistencia core: alumnos y cartera reales

> **Estado:** Implementado · **Depende de:** SPEC 04 (Neon + Drizzle + Better Auth + middleware), SPEC 05–06 (dominio de cartera y alumnos, hooks, routing), SPEC 08–10 (decisiones que este spec respeta: pago binario, roles) · **Fecha:** 2026-07-18
> **Objetivo:** Conectar el admin a la base de datos real — schema Drizzle y Astro Actions para alumnos y pagos, seed idempotente desde el Excel del club (leyendo los pagos del color de las celdas), migración de los hooks del mock a Actions sin tocar la UI, y modelo de cartera por año calendario (ENE–NOV, fin configurable) con fecha de cumpleaños opcional.

---

## Por qué existe este spec

Los specs 03–10 dejaron el frontend del admin completo sobre un store mock en memoria; solo auth persiste (spec 04). Este spec sustituye la fuente de datos de alumnos y cartera por Neon + Drizzle + Actions, cargando el histórico real del club desde `CHUTER FC 2026.xlsx` (raíz del proyecto, no versionado por PII).

La inspección del Excel real (2026-07-18) corrigió varios supuestos de la documentación:

- Los pagos **no están en texto**: se marcan con **color de relleno** (verde = pagado) — el diccionario de datos decía "columnas vacías".
- El cobro real es **MAR–NOV** (el club nació en marzo 2026), no FEB–DIC como modela el dominio actual.
- Los uniformes son **dos kits por alumno** (AZUL y ORO, $100.000 c/u) con 4 estados por kit y **abonos parciales** — invalida el modelo del spec 08 y se va al spec 12.
- `ARCHITECTURE.md` §4 proponía pagos con enum que incluía `partial` (obsoleto desde el spec 05) y tablas `categorias`/`tarifas` innecesarias (todo se deriva en dominio).

---

## Alcance

**Dentro:**

- **Dominio** (`lib/domain/`):
  - Cartera por **año calendario**: meses visibles ENE–NOV con `MES_FIN_COBRO = 'NOV'` (constante única, cambiar a DIC si Camilo confirma). Estados `paid/due/pending/na` **derivados** de: pagos reales + fecha de ingreso del alumno + arranque del club (**MAR 2026**) + mes vivo. Muere `states[]` almacenado.
  - Categoría derivada de la **fecha de nacimiento** (reusa `subDeAnio` sobre el año de la fecha).
  - `proximosCumples(alumnos, hoy)` — próximos cumpleaños (solo alumnos con fecha completa).
- **Schema Drizzle** (`lib/db/schema/`): tablas `alumnos` (acudiente denormalizado: nombre/celular/dirección; `anio` not null; `fechaNacimiento` date **null** por el seed; `fechaInicio`; `activo`) y `pagos` (fila **solo al pagar**: `alumnoId, anio, mes, montoCop, metodo null, pagadoEn null, registradoPor`). Migración con `db:generate`/`db:migrate`.
- **Repos + services + actions**: `alumnosRepo`/`pagosRepo` (solo queries); services de cartera y dashboard (stats derivadas); Actions `alumnos.{listar,crear,editar}` y `pagos.registrar` con `requireUser` + **filtro por rol en servidor** (entrenador: solo sus `cats`, sin datos de dinero — el gate deja de ser solo de cliente).
- **Hooks migrados a Actions** (`useAlumnos`, `useAlumno`, `useDashboardData`) con la misma forma: la UI de alumnos, ficha, cartera, pago, form y plantel **no cambia de estructura**. Mutaciones **pesimistas** (Action confirma → refetch). El store mock de alumnos/pagos se elimina.
- **UI tocada mínimamente:**
  - Form alumno: campo **fecha de nacimiento (date, requerida)** reemplaza al año; categoría auto desde la fecha.
  - Cartera/ficha: tira ENE–NOV (ENE/FEB 2026 en `na`).
  - Dashboard: carrusel de **cumpleaños real** (alumnos con fecha); **sale la card EntrenoDeHoy** (vuelve con la persistencia de entrenos).
  - Pantalla Uniformes y tab Uniforme de la ficha: **aviso "migración de uniformes en camino"** (evita mezclar mock con alumnos reales).
- **Seed** (`scripts/seed-from-excel.mjs` + `exceljs` devDependency): lee `CHUTER FC 2026.xlsx` local (hoja CATEGORIAS), crea alumnos y **pagos desde el color verde** de MAR–NOV; idempotente por documento; fuerza cuota $50.000 (R2); **reporta y omite** filas anómalas (año 2024, documentos duplicados/vacíos) para corregir en el Excel y re-ejecutar.
- **Docs**: `ARCHITECTURE.md` §4 (modelo de pagos corregido), `excel-data-dictionary.md` (semántica de colores, MAR–NOV, 2 kits), `backlog.md` (HUs afectadas).

**Fuera del alcance (otros specs):**

- **Uniformes reales** (spec 12): modelo por kit (AZUL/ORO) con abonos, seed de colores, realineación de UI. Pendiente confirmar con Camilo si el descuento de hermanos aplica por kit.
- **Persistencia de entrenos** + Vercel Blob (spec 13); EntrenoDeHoy recableado.
- **Selector de año** en la UI de cartera (cuando exista 2027; el modelo ya queda listo).
- Becados, tooling ESLint (HU-0.2), exportar cartera (HU-8.2), tarifas/categorías en BD (HU-7.3/7.4), mutaciones optimistas.

---

## Modelo de datos

### Tablas nuevas (Drizzle, `src/lib/db/schema/`)

```ts
// src/lib/db/schema/alumnos.ts
export const alumnos = pgTable('alumnos', {
  id: serial('id').primaryKey(),
  nombre: text('nombre').notNull(),
  documento: text('documento').notNull().unique(), // clave de idempotencia del seed
  anioNacimiento: integer('anio_nacimiento').notNull(),   // deriva categoría (R1)
  fechaNacimiento: date('fecha_nacimiento'),              // null en migrados; requerida en el form
  // Acudiente denormalizado (decisión 2b)
  acudiente: text('acudiente').notNull(),
  celular: text('celular').notNull(),
  direccion: text('direccion').notNull().default(''),
  fechaInicio: date('fecha_inicio').notNull(),            // col. INCIO del Excel (año 2026)
  activo: boolean('activo').notNull().default(true),
  creadoEn: timestamp('creado_en').notNull().defaultNow(),
});
```

```ts
// src/lib/db/schema/pagos.ts — fila SOLO cuando se paga (decisión 1a)
export const mesEnum = pgEnum('mes', ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC']);
export const pagos = pgTable('pagos', {
  id: serial('id').primaryKey(),
  alumnoId: integer('alumno_id').notNull().references(() => alumnos.id, { onDelete: 'cascade' }),
  anio: integer('anio').notNull(),                        // 2026, 2027… (filtro por año futuro)
  mes: mesEnum('mes').notNull(),
  montoCop: integer('monto_cop').notNull(),               // cuota vigente al pagar
  metodo: text('metodo'),                                 // 'efectivo' | 'transferencia' | null (seed)
  pagadoEn: timestamp('pagado_en'),                       // null en pagos del seed
  registradoPor: text('registrado_por').references(() => user.id), // null en seed
}, (t) => [unique().on(t.alumnoId, t.anio, t.mes)]);      // un pago por alumno-mes-año
```

Sin tablas `categorias` ni `tarifas` (derivadas en dominio). El enum trae los 12 meses aunque hoy solo se cobre hasta NOV — cambiar la ventana de cobro no toca la BD.

### Dominio (contratos nuevos/cambiados en `lib/domain/cartera.ts`)

```ts
export const ARRANQUE_CLUB = { anio: 2026, mes: 'MAR' } as const; // antes: na para todos
export const MES_FIN_COBRO: Mes = 'NOV';       // ← única constante a tocar si Camilo dice DIC
export const MESES_VISIBLES: Mes[];            // ENE..MES_FIN_COBRO (tira de cartera/ficha)

// Estado de un mes DERIVADO (ya no se almacena):
// na      → mes < ARRANQUE_CLUB, o mes < fechaInicio del alumno, o mes > MES_FIN_COBRO
// paid    → existe fila en pagos
// due     → cobrable y ya venció (mes < mes vivo)
// pending → cobrable y no vencido (mes ≥ mes vivo)
export function estadoDelMes(params: {
  anio: number; mes: Mes; pagado: boolean;
  fechaInicio: Date; hoy: Date;
}): EstadoMes;

export function proximosCumples(alumnos: AlumnoConFecha[], hoy: Date): Cumple[];
```

`lib/domain/categoria.ts`: `subDeFecha(fechaNacimiento)` delega en `subDeAnio(year)`. El tipo `Alumno` de la UI (`features/admin/data/types.ts`) pasa a construirse desde la Action (`states` se calcula en el service con `estadoDelMes` — la UI sigue recibiendo la misma forma).

### Actions (contrato RPC)

```ts
alumnos.listar()   // admin: todo; entrenador: solo sus cats, SIN cuota/states/saldo
alumnos.crear({ nombre, documento, fechaNacimiento, acudiente, celular, direccion? })
alumnos.editar({ id, ...mismos campos })   // exige fechaNacimiento (completa migrados)
pagos.registrar({ alumnoId, anio, meses: Mes[], metodo })  // upsert, ignora ya pagados
dashboard.stats()  // KPIs + morosos top + próximos cumples, todo derivado en server
```

### Seed (`scripts/seed-from-excel.mjs`, con `exceljs`)

- Fuente: hoja `CATEGORIAS`. Celda de mes con relleno verde (`theme9`) = pagado → fila en `pagos` (monto $50.000, `metodo/pagadoEn` null). Blanco/`theme0` = sin pago.
- Alumno: upsert por `documento`. `INCIO` ("26-ene") → `fechaInicio` con año 2026. `fechaNacimiento` queda null.
- Anomalías (año fuera de rango, documento vacío/duplicado, categoría del Excel ≠ calculada): se **reportan en consola y la fila se omite** — corregir en el Excel y re-ejecutar.
- Columnas AZUL/ORO: **se ignoran** en este spec (las carga el seed del spec 12, que extenderá este script).

---

## Plan de implementación

Cada bloque deja `tsc` + `build` en verde, el marketing intacto y el admin funcional (el mock sigue vivo hasta el bloque D, donde se cambia la fuente).

### Bloque A — Dominio por año calendario

> **Nota de orden (decidido 2026-07-18):** para respetar el invariante "cada bloque deja `tsc`+`build` en verde con el mock vivo", los dos cambios _rompedores_ — matar `statesIniciales` y cambiar `DatosAlumnoInput` (`anio`→`fechaNacimiento`) — se **difieren al Bloque D**, donde mueren junto a sus únicos consumidores (`store.ts` y el form). En A solo se **agrega** dominio nuevo y se adapta la tira a ENE–NOV, sin romper a los consumidores del mock.

1. `lib/domain/cartera.ts`: `ARRANQUE_CLUB`, `MES_FIN_COBRO`, `MESES_VISIBLES` (ENE–NOV), `estadoDelMes` derivado; `MESES_TEMPORADA` deriva de `MESES_VISIBLES`. Las funciones agregadas (`saldoPendiente`, `mesesEnMora`, `recaudo*`, `carteraVencida`, `metaMes`) **siguen operando sobre `states[]`** — en D ese array pasa a ser derivado por el service con `estadoDelMes` en vez de venir del mock, sin cambiar sus firmas. `statesIniciales` se conserva (lo usa el mock); muere en el Bloque D.
2. `lib/domain/categoria.ts`: `subDeFecha(fechaNacimiento)` delega en `subDeAnio`. `DatosAlumnoInput` (`anio`→`fechaNacimiento`) y su validación se migran en el Bloque D con el form.
3. `lib/domain/cumples.ts`: `proximosCumples` (orden por proximidad, ignora sin fecha).

_Verifica:_ con fecha de julio 2026, un alumno de marzo sin pagos da MAR–JUN `due`, JUL–NOV `pending`, ENE–FEB `na`; cumpleaños ordena correctamente cruzando el año.

### Bloque B — Schema + repos + services + actions

4. `lib/db/schema/{alumnos,pagos}.ts` + export en `schema/index.ts`; `npm run db:generate` + `db:migrate` contra Neon.
5. `lib/db/repos/{alumnos,pagos}.ts` — solo queries (list, byId, insert, update, upsert de pagos, pagos por año).
6. `lib/services/{alumnos,cartera,dashboard}.ts` — arman el `Alumno` de la UI (con `states` derivados vía dominio), stats, morosos, cumples; filtro por rol (entrenador: sus `cats`, sin campos de dinero).
7. `src/actions/{alumnos,pagos,dashboard}.ts` con Zod + `requireUser`; registrar en `actions/index.ts`.

_Verifica:_ Actions responden con sesión y niegan sin ella; el payload del entrenador no contiene cuota/states/saldo (verificado en la respuesta de red, no solo en UI).

### Bloque C — Seed desde el Excel

8. `npm i -D exceljs`; `scripts/seed-from-excel.mjs`: parsea CATEGORIAS (fills verdes → pagos), upsert por documento, fuerza cuota $50.000, reporte de anomalías con detalle de fila, resumen final (creados/actualizados/omitidos/pagos).
9. Script `db:seed` en `package.json`. Ejecutar contra Neon y validar contra el Excel real (77 alumnos, conteos de pagos por mes: 44/54/50/35/5/1…).

_Verifica:_ re-ejecutar el seed no duplica nada; los conteos por mes cuadran con los fills del Excel.

### Bloque D — Migrar hooks y UI a Actions

10. `hooks/{useAlumnos,useAlumno,useDashboardData}.ts` → llaman Actions (carga + error + refetch tras mutación, pesimista). Eliminar `data/store.ts` y el mock de alumnos en `data/mock.ts` (queda solo `store-entrenos.ts` y su mock). Al morir el mock: **borrar `statesIniciales`** de `cartera.ts` (sin más consumidores).
11. Migrar `DatosAlumnoInput` (`anio`→`fechaNacimiento`) y su validación (fecha real, categoría existente vía `subDeFecha`). Form alumno: campo fecha de nacimiento (date, requerida) reemplaza año; badge de categoría derivado de la fecha; al editar un migrado sin fecha, el campo llega vacío y es obligatorio.
12. Cartera/ficha/pago: tira `MESES_VISIBLES` (ENE–NOV); registrar pago llama `pagos.registrar` y refresca.
13. Dashboard: KPIs/morosos desde `dashboard.stats()`; carrusel de cumpleaños real; quitar EntrenoDeHoy. Plantel/ficha readOnly del entrenador sobre `alumnos.listar` filtrada.
14. Pantalla Uniformes + tab Uniforme de la ficha: aviso "Migración de uniformes en camino" (sin datos mock mezclados).

_Verifica:_ flujo completo en `npm run dev` contra Neon: login → dashboard real → buscar alumno → registrar pago (celda cambia y **sobrevive a recargar**) → crear alumno con fecha → aparece en cartera con `na` previos al ingreso.

### Bloque E — Docs + cierre

15. Actualizar `ARCHITECTURE.md` §4 (pagos solo-reales, sin `partial`, sin tablas categorias/tarifas), `excel-data-dictionary.md` (colores, MAR–NOV, 2 kits, abonos de uniforme), `backlog.md` (HU-0.5 ☑, HU-2.x/3.x/4.x afectadas ☑ con nota, HU-4.5 cumpleaños `Must` por pedido del cliente).
16. `tsc --noEmit` + `build` en verde; ningún archivo > 200 líneas; cero `any`; marketing prerenderizado intacto; verificación visual con playwright (320px–desktop).

---

## Criterios de aceptación

### Persistencia y datos

- [x] Registrar un pago, crear un alumno o editarlo **sobrevive a recargar la página** y a cerrar/abrir sesión (los datos viven en Neon, no en memoria).
- [x] La tabla `pagos` solo contiene filas de meses realmente pagados; `due/pending/na` nunca se almacenan.
- [x] No se puede registrar dos veces el mismo alumno-año-mes (constraint único) ni duplicar documento de alumno.
- [x] El seed carga los 77 alumnos del Excel y sus pagos cuadran con los fills verdes por mes (MAR 44 · ABR 54 · MAY 50 · JUN 35 · JUL 5 · AGO–NOV 1); re-ejecutarlo no duplica ni altera nada.
- [x] Las filas anómalas del Excel (año inválido, documento vacío/duplicado) se reportan en consola con número de fila y se omiten sin abortar el seed.

### Cartera por año calendario

- [x] La tira de meses muestra ENE–NOV; para 2026, ENE y FEB aparecen `na` para todos (arranque del club en marzo).
- [x] Un alumno con `fechaInicio` posterior a marzo muestra `na` en los meses previos a su ingreso.
- [x] Cambiar `MES_FIN_COBRO` a `'DIC'` hace aparecer diciembre en cartera, ficha, pago y totales **sin tocar BD ni ninguna otra parte del código**.
- [x] Saldo, mora, recaudo del mes/año, cartera vencida y meta salen de los pagos reales y cuadran entre dashboard, cartera y ficha.

### Fecha de nacimiento y cumpleaños

- [x] El form pide fecha de nacimiento (requerida, sin campo año); la categoría se deriva de la fecha y se muestra como badge.
- [x] Al editar un alumno migrado (fecha null), el campo llega vacío y obliga a completarlo antes de guardar.
- [x] El dashboard muestra próximos cumpleaños solo de alumnos con fecha completa, ordenados por proximidad (incluye el cruce de año).
- [x] La card EntrenoDeHoy ya no está en el dashboard.

### Seguridad por rol (en servidor)

- [x] Toda Action niega sin sesión (`UNAUTHORIZED`), verificable con una petición directa sin cookie.
- [x] La respuesta de red de `alumnos.listar` para un entrenador no contiene cuota, estados de pago ni saldo, y solo trae alumnos de sus `cats` (verificado en el payload, no solo en la UI).
- [x] Un entrenador no puede invocar `pagos.registrar` ni `alumnos.crear/editar`.

### UI y no-regresión

- [x] Alumnos, ficha, cartera, pago, form, plantel y dashboard funcionan contra la BD con la misma estructura visual; hay estado de carga y de error en cada pantalla migrada.
- [x] Pantalla Uniformes y tab Uniforme muestran el aviso de migración (sin datos mock mezclados); Entrenos sigue en mock intacto.
- [x] `data/store.ts` y el mock de alumnos no existen más en el bundle.
- [x] Ningún archivo > 200 líneas; cero `any`; `tsc --noEmit` + `build` en verde; `exceljs` solo como devDependency (no aparece en ningún bundle del sitio).
- [x] Marketing prerenderizado intacto; `/admin/**` noindex y fuera del sitemap.
- [x] Docs actualizadas: `ARCHITECTURE.md` §4, `excel-data-dictionary.md`, `backlog.md`.

---

## Decisiones

- **Sí (Will, 2026-07-18):** **tabla `pagos` con filas solo de pagos reales**; `due/pending/na` derivados en dominio. _Por qué:_ fiel al modelo binario del spec 05, cero seeds artificiales de estados, imposible tener estados fantasma. Corrige `ARCHITECTURE.md` §4, que aún proponía fila por alumno-mes con enum que incluía `partial` (obsoleto).
- **Sí (Will, 2026-07-18):** **acudiente denormalizado en `alumnos`** (nombre/celular/dirección como texto); hermanos por nombre normalizado. _Por qué:_ es el modelo del form y el mock actuales — cero cambio de UX ni semántica; normalizar a tabla `acudientes` solo si algún día duele.
- **Sí (Will, 2026-07-18):** **cartera por año calendario ENE–NOV** con `MES_FIN_COBRO` como constante única. _Por qué:_ el Excel real cobra MAR–NOV (el club nació en marzo 2026) y Camilo aún no confirma si diciembre se cobra; la constante deja el cambio a un solo lugar. ENE–FEB 2026 quedan `na` vía `ARRANQUE_CLUB`; en 2027 los 12 meses listados habilitan el filtro por año futuro.
- **Sí (Will, 2026-07-18):** **el seed carga el histórico real leyendo el color de relleno** de las celdas (verde = pagado) del Excel de la raíz. _Por qué:_ el club marca pagos con color, no con texto — el CSV salía vacío y el diccionario de datos estaba equivocado ("columnas vacías"). La mora inicial del sistema es la real.
- **Sí (Will, 2026-07-18):** **`exceljs` como devDependency** para el seed. _Por qué:_ `xlsx` (SheetJS community) no lee estilos de celda; los estilos **son** los datos. Solo vive en `scripts/`.
- **Sí (Will, 2026-07-18):** **fecha de nacimiento requerida en el form, sin campo año**; categoría derivada de la fecha. _Por qué:_ el cliente pidió cumpleaños; un solo campo evita redundancia año/fecha. En BD `fechaNacimiento` es nullable solo porque el Excel trae únicamente el año: los 77 migrados la completan al editarse.
- **Sí (Will, 2026-07-18):** **uniformes se van al spec 12.** _Por qué:_ el Excel reveló un modelo distinto al del spec 08 — dos kits por alumno ($100.000 c/u), 4 estados **por kit** (verde = pagado y entregado, rojo = entregado sin pagar, azul = pagado sin entregar, blanco = nada) y abonos parciales; remodelar dominio + UI + seed es un spec completo. Mientras tanto, esas vistas muestran aviso de migración para no mezclar mock con datos reales.
- **Sí (Will, 2026-07-18):** **sin modelado de becados.** _Por qué:_ "no nos compliquemos" — el caso real (familiar becado) se lleva como pagos marcados, igual que en el Excel.
- **Sí:** **mutaciones pesimistas** (Action confirma → refetch), corrigiendo el "optimista + revalidar" de `ARCHITECTURE.md`. _Por qué:_ datos de dinero con ~80 alumnos: la consistencia vale más que la latencia percibida; menos código.
- **Sí:** **filtro por rol en servidor** — el payload del entrenador no incluye datos de dinero. _Por qué:_ con datos reales de familias, el gate solo-cliente del spec 09 deja de ser aceptable (riesgo ya anotado en ese spec).
- **Sí:** **cumpleaños entra como `Must`** (era `Could`, HU-4.5). _Por qué:_ pedido explícito del cliente.
- **No:** **tablas `categorias` y `tarifas`** — la categoría se calcula (R1) y la cuota es constante (R2); tenerlas en BD solo sirve a HU-7.3/7.4 (`Could`), que traerán su propia migración si llegan.
- **No:** **selector de año en la UI** — con un solo año (2026) no filtra nada; el modelo (`pagos.anio`) ya queda listo.
- **No:** **inferir/corregir datos sucios del Excel en el seed** (p. ej. año 2024 en SUB 12) — el seed reporta y omite; la corrección se hace en el Excel, que sigue siendo la fuente que el club entiende.
- **No:** **ESLint/tooling (HU-0.2)** — pendiente real, pero es ortogonal a la persistencia; engordaría el spec.
- **No:** **EntrenoDeHoy en el dashboard** — se recablea con la persistencia de entrenos (spec 13).

---

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| La detección del verde depende de cómo Excel codifica el color (`theme9` hoy; Camilo podría pintar con otro tono de verde a futuro). | El seed clasifica por lista blanca de fills conocidos (`theme9` = pagado, `theme0`/sin fill = no pagado) y **reporta como anomalía cualquier fill desconocido** con fila y mes, en vez de adivinar. |
| El Excel tiene celdas verdes en meses futuros (becado) que el modelo carga como pagos adelantados. | Comportamiento aceptado y deseado: `pagos.registrar` y el seed permiten pagar meses `pending` futuros; el dominio ya los muestra `paid`. |
| Cambiar `DatosAlumnoInput` (año → fecha) rompe consumidores del dominio en cadena. | Diferido al bloque D: el cambio de tipo y el form (único punto de captura, spec 07) migran juntos, con `tsc` como red. Cada frontera de bloque (A–C) queda verde con el mock vivo. |
| Migrar 6 pantallas a datos async a la vez introduce estados de carga inconsistentes o parpadeos. | Los hooks conservan el contrato actual (misma forma de retorno + `loading/error` uniformes); patrón único de skeleton/error definido una vez en `chrome/` y reusado. |
| Latencia de Neon en cada navegación (la isla refetchea por pantalla). | Volumen chico (~80 filas): una query por vista es aceptable; si duele, cache en memoria del hook por sesión de navegación — no se optimiza por adelantado. |
| El seed corre contra la BD de producción por accidente a mitad de desarrollo. | El seed imprime host de la BD y pide confirmación (`--yes` para saltarla); en dev se usa una rama de Neon (`DATABASE_URL` local distinta, ya soportado por `.env`). |
| Un documento corregido en el Excel re-crea al alumno en vez de actualizarlo (la idempotencia es por documento). | Riesgo documentado en el reporte del seed: si un documento cambia, el resumen muestra "creados: 1" inesperado; el diccionario de datos lo advierte y la corrección es manual (borrar el duplicado). |
| `date` de Postgres vs `Date` de JS y zona horaria corren un día los cumpleaños o `fechaInicio`. | Columnas `date` (sin hora) leídas como string `YYYY-MM-DD` y parseadas en dominio sin conversión de zona; criterio de aceptación de cumpleaños lo cubre. |
| El payload del entrenador filtra dinero en el service pero un refactor futuro lo une al del admin. | Tipos de retorno distintos (`AlumnoAdmin` vs `AlumnoPlantel`) en el contrato de la Action: el compilador impide devolver dinero al entrenador por accidente. |

---

## Lo que **NO** entra en este spec

- Uniformes reales (modelo por kit + abonos + seed AZUL/ORO + UI) → spec 12.
- Persistencia de entrenos + Vercel Blob + EntrenoDeHoy → spec 13.
- Selector de año en la UI de cartera.
- Becados, ESLint (HU-0.2), exportar cartera (HU-8.2), tarifas/categorías en BD (HU-7.3/7.4).

Cada uno, si llega, va en su propio spec.
