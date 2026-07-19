# SPEC 12 — Uniformes reales: dos kits por alumno con abonos

> **Estado:** Implementado · **Depende de:** SPEC 08 (modelo de 4 estados y pantallas Estado/Numeración, que este spec generaliza a dos kits), SPEC 11 (persistencia: Neon + Drizzle + Actions + seed por color, patrón que este spec extiende) · **Fecha:** 2026-07-19
> **Objetivo:** Sustituir el modelo mock de "un uniforme por alumno" por el modelo real del club — **dos kits por alumno (AZUL y ORO), $100.000 c/u**, cada kit con **cuatro estados** (entrega × pago) y **abonos parciales** — persistido en Neon, sembrado desde el color de las celdas AZUL/ORO del Excel, y con las pantallas de uniformes realineadas (quitando el aviso de "migración en camino" del spec 11).

---

## Por qué existe este spec

El spec 08 modeló el uniforme como **un solo registro por alumno** con dos ejes binarios (entrega/pago). La inspección del Excel real (spec 11, 2026-07-18) reveló un modelo distinto:

- Cada alumno tiene **dos kits**: **AZUL** y **ORO** (no "DORADO"), **$100.000 cada uno**.
- Cada kit tiene **cuatro estados** codificados por **color de relleno** de la celda: **verde** = pagado y entregado · **rojo** = entregado sin pagar · **azul** = pagado sin entregar · **blanco** = nada.
- Hay **abonos parciales**: un kit puede estar pagado a medias (a diferencia de la cuota mensual, que es binaria — decisión de Will, spec 05).

Por eso el spec 11 **difirió los uniformes** y dejó las vistas de uniformes (pantalla Uniformes y tab Uniforme de la ficha) con un **aviso "migración en camino"**, para no mezclar el mock viejo (un kit) con los alumnos reales de Neon. Este spec implementa el modelo real y **retira ese aviso**.

---

## Alcance

**Dentro:**

- **Dominio** (`src/lib/domain/uniformes.ts`): generalizar el modelo de 4 estados a **dos kits por alumno** y a **pago tri-estado** (sin pagar / abonado / pagado, derivado de `abonadoCop` vs precio del kit). Conservar `numerosDuplicados`/`numeroOcupado` pero **por kit** sobre el conjunto real. Renombrar `TipoKit` de `'AZUL' | 'DORADO'` a **`'AZUL' | 'ORO'`**.
- **Schema Drizzle** (`src/lib/db/schema/uniformes.ts`): tabla `uniformes` con **una fila por alumno-kit** (hasta 2 por alumno): `alumnoId`, `kit` (enum AZUL/ORO), `entregado`, `numero` (null hasta entregar), `talla`, `abonadoCop` (0..precio), `registradoPor`, timestamps. Constraint único `(alumnoId, kit)` y — para R6 — unicidad lógica de `numero` por kit validada en dominio (no en BD, porque el club a veces repite a propósito → advertencia no bloqueante). Migración con `db:generate`/`db:migrate`.
- **Repos + services + actions**: `uniformesRepo` (queries: por alumno, por kit, upsert de entrega/pago); `services/uniformes.ts` arma la vista por alumno (los dos kits + estado derivado) y los contadores de la pantalla; **filtro por rol** (el entrenador ve la **entrega** del uniforme en la ficha readOnly pero **no** montos ni estado de pago — spec 11). Actions `uniformes.{registrarEntrega, anularEntrega, registrarPago}` con Zod + `requireUser` + gate de rol en servidor.
- **Seed** (extiende `scripts/seed-from-excel.mjs`): leer las columnas **AZUL** y **ORO** de la hoja `CATEGORIAS`, mapear **color → estado del kit** (verde/rojo/azul/blanco), crear filas en `uniformes`. Idempotente por `(documento, kit)`. Reporta y omite colores desconocidos, como el resto del seed.
- **UI realineada** (retira `AvisoMigracion` de las vistas de uniformes):
  - **Ficha, tab Uniforme**: muestra los **dos kits** (AZUL y ORO), cada uno con su estado, número/talla si entregado y su abono; CTA a la pantalla de gestión del kit.
  - **Pantalla de gestión** (`/admin/alumnos/:id/uniforme`): permite registrar entrega y pago/abono **por kit**; advertencia no bloqueante de número repetido; muestra el precio del kit.
  - **Pantalla Uniformes** (Estado + Numeración): **Estado** cuenta los estados **por kit** (el universo pasa de N alumnos a 2N kits); **Numeración** lista por kit (AZUL/ORO) con alerta de duplicados.
- **Tipos** (`data/types.ts` + `services/mapea-alumno.ts`): reemplazar en `Alumno` los campos de un solo kit (`uniforme`, `uniformePago`, `numero`, `tipoKit`, `talla`) por una estructura de **dos kits** tipada.
- **Docs**: `excel-data-dictionary.md` (mapa color→estado del kit, abonos), `ARCHITECTURE.md` §4 (tabla `uniformes`), `backlog.md` (EPIC 5 y HU-8.1 uniformes ☑).

**Fuera del alcance (otros specs):**

- **`abonadoCop` en los totales de cartera** — el uniforme sigue siendo deuda **aparte** de la cuota mensual (como en spec 08). Una bandeja única de deuda sería otro spec.
- **Tarifas de uniforme configurables** (HU-7.3, `Could`): $100.000 / $80.000 siguen como constantes de dominio.
- **Persistencia de entrenamientos** + Vercel Blob (spec 13).
- **Vista readOnly del entrenador para la pantalla Uniformes** (el entrenador solo ve la entrega en la ficha; la pantalla Uniformes agregada es de admin).

---

## Decisiones pendientes de confirmar con Camilo (bloquean detalles, no el spec)

> Marcar con `<!-- TODO: pedir a Camilo -->` donde apliquen, según la convención del proyecto.

1. **¿Cómo se registran los abonos parciales en el Excel?** El color da los 4 estados base (verde/rojo/azul/blanco), pero **no** el monto abonado. Opciones: (a) el Excel no lleva abonos y arrancan en 0/entero → el seed solo siembra estados binarios y los abonos se capturan en vivo; (b) hay una columna/nota con el monto → el seed la lee. **Supuesto por defecto mientras no confirme:** opción (a) — el seed marca pagado (abono = precio) o sin pagar (abono = 0) según color, y los abonos parciales se registran desde la app.
2. **¿El descuento de hermanos ($80.000) aplica por kit?** El spec 11 lo dejó abierto. **Supuesto por defecto:** sí, el precio de **cada kit** es $100.000, u $80.000 si el alumno tiene hermanos (misma regla R9, por kit).

---

## Modelo de datos

### Tabla nueva (Drizzle, `src/lib/db/schema/uniformes.ts`)

```ts
export const kitEnum = pgEnum('kit', ['AZUL', 'ORO']);
export const uniformes = pgTable('uniformes', {
  id: serial('id').primaryKey(),
  alumnoId: integer('alumno_id').notNull().references(() => alumnos.id, { onDelete: 'cascade' }),
  kit: kitEnum('kit').notNull(),
  entregado: boolean('entregado').notNull().default(false),
  numero: integer('numero'),                 // null hasta entregar
  talla: text('talla').notNull().default(''),
  abonadoCop: integer('abonado_cop').notNull().default(0), // 0..precio del kit
  registradoPor: text('registrado_por').references(() => user.id), // null en seed
  creadoEn: timestamp('creado_en').notNull().defaultNow(),
  actualizadoEn: timestamp('actualizado_en').notNull().defaultNow(),
}, (t) => [unique().on(t.alumnoId, t.kit)]);   // un registro por alumno-kit
```

El **estado de pago es tri-estado derivado** de `abonadoCop` vs el precio del kit: `0` → sin pagar · `0 < abono < precio` → abonado (parcial) · `abono ≥ precio` → pagado. La unicidad de `numero` por kit **no** es constraint de BD (el club puede repetir a propósito): se valida en dominio como advertencia.

### Dominio (contratos nuevos/cambiados en `lib/domain/uniformes.ts`)

```ts
export type TipoKit = 'AZUL' | 'ORO';           // antes 'AZUL' | 'DORADO'
export type EjePago = 'pagado' | 'abonado' | 'pendiente';   // ahora tri-estado
export type EstadoKit = 'completo' | 'porEntregar' | 'porCobrar' | 'sinIniciar';

// Estado del kit a partir de entrega + abono vs precio (extiende estadoUniforme):
//  entregado && pagado        → 'completo'
// !entregado && pagado        → 'porEntregar'
//  entregado && !pagado       → 'porCobrar'   (etiqueta "Pago pendiente"; incluye abono parcial)
// !entregado && !pagado       → 'sinIniciar'
export function estadoKit(entregado: boolean, abonadoCop: number, precio: number): EstadoKit;
export function ejePago(abonadoCop: number, precio: number): EjePago;
export function saldoKit(abonadoCop: number, precio: number): number;   // precio − abono, ≥ 0

// ESTADO_UNIFORME_META y ORDEN_ESTADO_UNIFORME se conservan (mismas etiquetas/orden).
// numerosDuplicados / numeroOcupado: firma igual, ahora por kit sobre los registros reales.
```

`precioUniforme(esHermano)` (en `lib/domain/precios.ts`) sigue dando el precio de **un** kit; el saldo total de uniformes de un alumno es la suma de `saldoKit` de sus dos kits.

### Actions (contrato RPC)

```ts
uniformes.registrarEntrega({ alumnoId, kit, numero, talla })   // entregado=true + numero/talla
uniformes.anularEntrega({ alumnoId, kit })                     // entregado=false, numero=null (talla y abono intactos)
uniformes.registrarPago({ alumnoId, kit, montoCop })           // suma al abono (acota a [0, precio]); pagar completo = precio
uniformes.listar()   // admin: 2 kits por alumno + estados + saldos; entrenador: solo entrega (sin montos)
```

Mutaciones **pesimistas** (Action confirma → refetch), como en spec 11.

### Seed (extiende `scripts/seed-from-excel.mjs`)

- Fuente: hoja `CATEGORIAS`, columnas **AZUL** y **ORO**. Color de relleno → estado del kit:
  `verde` → entregado + pagado (abono = precio) · `rojo` → entregado + sin pagar (abono = 0) · `azul` → sin entregar + pagado (abono = precio) · `blanco`/sin fill → sin iniciar (no crea fila, o fila en `sinIniciar`).
- Crea filas en `uniformes` por `(alumnoId, kit)`. Idempotente: re-ejecutar no duplica.
- Colores desconocidos: **reportar y omitir** con fila + kit (mismo criterio del seed de pagos).
- Abonos parciales: según la **decisión pendiente #1** (por defecto no se siembran; se capturan en vivo).

---

## Plan de implementación

Cada bloque deja `tsc --noEmit` + `build` en verde, el marketing intacto y el admin funcional. El aviso de migración se retira recién en el bloque de UI (E), cuando la data real ya fluye.

### Bloque A — Dominio (dos kits + pago tri-estado)

1. `lib/domain/uniformes.ts`: renombrar `TipoKit` a `'AZUL' | 'ORO'`; agregar `EjePago` tri-estado, `estadoKit(entregado, abonadoCop, precio)`, `ejePago`, `saldoKit`. Conservar `ESTADO_UNIFORME_META`, `ORDEN_ESTADO_UNIFORME`, `numerosDuplicados`, `numeroOcupado` (por kit). Funciones puras.

_Verifica:_ las 4 combinaciones (entrega × pago) dan el estado correcto; un abono parcial cae en `porCobrar`/`sinIniciar` según entrega; `saldoKit` nunca es negativo ni supera el precio.

### Bloque B — Schema + repos + services + actions

2. `lib/db/schema/uniformes.ts` + export en `schema/index.ts`; `db:generate` + `db:migrate` contra Neon.
3. `lib/db/repos/uniformes.ts` — queries (por alumno, todos, upsert entrega/pago).
4. `lib/services/uniformes.ts` — vista por alumno (2 kits + estado + saldo), contadores de la pantalla; filtro por rol (entrenador: entrega sin montos).
5. `src/actions/uniformes.ts` con Zod + `requireUser` + gate de rol; registrar en `actions/index.ts`.

_Verifica:_ Actions responden con sesión y niegan sin ella; el payload del entrenador no trae `abonadoCop`/saldo/estado de pago; `registrarPago` acota el abono a `[0, precio]`.

### Bloque C — Seed AZUL/ORO desde el Excel

6. Extender `scripts/seed-from-excel.mjs`: parsear columnas AZUL/ORO, mapear color→estado, upsert en `uniformes` idempotente por `(documento, kit)`, reporte de colores desconocidos, resumen (kits creados por estado).

_Verifica:_ re-ejecutar no duplica; los conteos por estado y kit cuadran con los fills del Excel.

### Bloque D — Tipos y mapeo

7. `data/types.ts`: reemplazar en `Alumno` los campos de un kit por una estructura de **dos kits** (p. ej. `kits: KitUniforme[]` con `kit`, `entregado`, `numero`, `talla`, `abonadoCop`, `estado`, `saldo`). `services/mapea-alumno.ts`: construir esa estructura desde los registros reales.

_Verifica:_ `tsc` en verde; la ficha y las pantallas compilan contra la nueva forma (aún con aviso de migración si hace falta hasta E).

### Bloque E — UI realineada (retira el aviso de migración)

8. **Ficha, tab Uniforme** (`screens/ficha/UniformeTab.tsx`): dos kits con estado, número/talla y abono/saldo; CTA por kit a la pantalla de gestión.
9. **Pantalla de gestión** (`screens/uniforme-entrega/`): gestionar **por kit** — registrar/anular entrega (form kit implícito + número + talla, advertencia no bloqueante de número repetido) y registrar pago/abono (input de monto, muestra precio y saldo). Cablear las Actions.
10. **Pantalla Uniformes** (`screens/uniformes/`): quitar `AvisoMigracion`; **Estado** con contadores **por kit** (universo 2N kits) y lista ordenada por `ORDEN_ESTADO_UNIFORME`; **Numeración** por kit (AZUL/ORO) con alerta de duplicados. Filtro/segmented como spec 08.

_Verifica:_ flujo completo en `npm run dev` contra Neon: entregar el kit AZUL de un alumno y abonar la mitad del ORO → estados y saldos correctos, **sobreviven a recargar**; número repetido advierte sin bloquear; el entrenador no ve montos.

### Bloque F — Docs + cierre

11. Actualizar `excel-data-dictionary.md` (color→estado del kit, abonos), `ARCHITECTURE.md` §4 (tabla `uniformes`), `backlog.md` (EPIC 5 y HU-8.1 uniformes ☑).
12. `tsc --noEmit` + `build` en verde; ningún archivo > 200 líneas; cero `any`; `exceljs` sigue solo devDependency; marketing intacto; `/admin/**` noindex; verificación visual con Playwright `--headed` (320px–desktop).

---

## Criterios de aceptación

### Modelo y persistencia

- [x] Cada alumno tiene **dos kits** (AZUL y ORO); registrar entrega o pago de un kit **sobrevive a recargar** y a cerrar/abrir sesión (vive en Neon).
- [x] El estado de cada kit se **deriva** (entrega × pago) y el pago es tri-estado (sin pagar / abonado / pagado) según `abonadoCop` vs precio; nunca se almacena el estado.
- [x] `registrarPago` acota el abono a `[0, precio]`; abonar el precio completo deja el kit `pagado`.
- [x] No se puede duplicar un registro `(alumnoId, kit)` (constraint único).
- [x] El seed carga los kits AZUL/ORO desde el color de las celdas; re-ejecutarlo no duplica; los conteos por estado y kit cuadran con los fills; colores desconocidos se reportan y omiten sin abortar.

### UI

- [x] La pantalla Uniformes y el tab Uniforme de la ficha **ya no muestran el aviso de migración**; muestran datos reales por kit.
- [x] El tab Uniforme de la ficha muestra los dos kits con estado, número/talla (si entregado) y abono/saldo.
- [x] La pantalla de gestión permite registrar/anular entrega y registrar pago/abono **por kit**; un número repetido en el kit **advierte sin bloquear**; se muestra el precio y el saldo del kit.
- [x] La pantalla Uniformes tiene **Estado** (contadores por kit sobre 2N kits, orden por prioridad de acción, filtro por estado con empty state) y **Numeración** (por kit AZUL/ORO, alerta de duplicados, orden por número).
- [x] Hay estado de carga y de error en cada pantalla migrada.

### Seguridad por rol

- [x] `uniformes.listar` para un entrenador no incluye `abonadoCop`, saldo ni estado de pago (solo la entrega), verificable en el payload de red.
- [x] Un entrenador no puede invocar `uniformes.registrarPago` ni `registrarEntrega/anularEntrega`.
- [x] Toda Action niega sin sesión (`UNAUTHORIZED`).

### Calidad y no-regresión

- [x] `TipoKit` es `'AZUL' | 'ORO'` en todo el código; no queda ninguna referencia a `'DORADO'`.
- [x] Ningún archivo > 200 líneas; cero `any`; `tsc --noEmit` + `build` en verde; `exceljs` solo como devDependency.
- [x] Marketing prerenderizado intacto; `/admin/**` noindex y fuera del sitemap.
- [x] De 320px a desktop: cero scroll horizontal en la pantalla Uniformes (ambos tabs), la ficha y la pantalla de gestión.
- [x] Docs actualizadas: `excel-data-dictionary.md`, `ARCHITECTURE.md` §4, `backlog.md`.

---

## Decisiones

- **Sí:** **dos kits por alumno (AZUL/ORO), fila por `(alumnoId, kit)`.** _Por qué:_ es el modelo real del Excel; el spec 08 asumía un solo uniforme y no cabe. Hasta 2 filas por alumno mantiene el schema simple y el constraint único evita duplicados.
- **Sí:** **pago tri-estado con `abonadoCop`** (sin pagar / abonado / pagado). _Por qué:_ el club maneja abonos parciales del uniforme (a diferencia de la cuota mensual, binaria por decisión de Will en spec 05). El estado se deriva del monto vs precio, sin columna de estado.
- **Sí:** **renombrar `TipoKit` a `'AZUL' | 'ORO'`.** _Por qué:_ el Excel usa ORO, no DORADO; alinear el código con la fuente evita confusión y traducciones.
- **Sí:** **el uniforme NO entra a los totales de cartera** (sigue como en spec 08). _Por qué:_ deuda distinta de la cuota mensual; mezclarlas sería otro spec (bandeja única de deuda).
- **Sí:** **unicidad de número por kit como advertencia de dominio, no constraint de BD.** _Por qué:_ el club a veces repite números a propósito (R6 es aviso, no bloqueo); mantiene el comportamiento del spec 08.
- **Sí:** **seed por color de las celdas AZUL/ORO**, extendiendo el script del spec 11. _Por qué:_ misma fuente y semántica (el color son los datos); un solo script de seed idempotente.
- **Sí:** **mutaciones pesimistas + filtro por rol en servidor.** _Por qué:_ consistencia con spec 11; el entrenador no debe ver dinero de uniformes.
- **No:** **tarifas configurables** — $100.000/$80.000 siguen como constantes de dominio (HU-7.3 `Could`).
- **No:** **abonos en el Excel** hasta confirmar con Camilo (decisión pendiente #1): por defecto el seed solo siembra estados base y los abonos se capturan en la app.

---

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| Cambiar `Alumno` de un kit a dos kits rompe consumidores en cadena (ficha, plantel, uniformes). | El bloque D cambia el tipo con `tsc` como red; los consumidores se migran en el mismo bloque/E antes de retirar el aviso. |
| El Excel no codifica los abonos parciales, solo los 4 estados por color. | Decisión pendiente #1: por defecto el seed siembra estados binarios (abono 0 o precio) y los abonos parciales se capturan en vivo; se confirma con Camilo antes del bloque C. |
| La detección de color de AZUL/ORO depende de cómo Excel codifica cada tono. | Lista blanca de fills conocidos (verde/rojo/azul/blanco) y **reporte de anomalía** para cualquier fill desconocido con fila + kit, como el seed de pagos (spec 11). |
| El descuento de hermanos por kit no está confirmado. | Decisión pendiente #2: por defecto R9 aplica por kit ($100.000/$80.000 cada uno); se confirma con Camilo. |
| El universo del tab Estado pasa de N alumnos a 2N kits y puede confundir los contadores. | La lista y los contadores operan sobre **kits**, no alumnos; se rotula claramente (AZUL/ORO) y se reusa el patrón de filtro del spec 08. |
| Referencias residuales a `'DORADO'` en tipos/UI tras el rename. | Un criterio de aceptación exige cero referencias a `'DORADO'`; `tsc` y una búsqueda global lo verifican. |

---

## Lo que **NO** entra en este spec

- `abonadoCop` en los totales de cartera (el uniforme sigue como deuda aparte).
- Tarifas de uniforme configurables (HU-7.3).
- Persistencia de entrenamientos + Vercel Blob (spec 13).
- Vista readOnly del entrenador para la pantalla Uniformes agregada.

Cada uno, si llega, va en su propio spec.
