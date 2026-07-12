# SPEC 08 — Uniformes: pago y entrega independientes + estados

> **Estado:** Implementado · **Depende de:** SPEC 05 (ficha, routing por URL), SPEC 07 (pantalla Uniformes, entrega, store) · **Fecha:** 2026-07-12
> **Objetivo:** Realinear la gestión de uniformes al prototipo separando **pago** y **entrega** en dos registros independientes (modelo de 4 estados) y llevando la pantalla Uniformes a dos tabs (**Estado** + **Numeración**), corrigiendo el flujo combinado del spec 07.

---

## Por qué existe este spec

El spec 07 modeló la entrega de uniforme como **un solo registro** (guardar = entregado, con el pago como sub-dato), pero el prototipo trata **pago y entrega como ejes independientes** que producen **4 estados** (Completo, Por entregar = pagó y falta entregar, Pago pendiente = entregado y falta el pago, Sin iniciar). Por eso hoy no se puede registrar "pagó pero no entregado", y falta el tab **Estado** con su resumen 2×2 y filtro. Este spec corrige esa divergencia.

---

## Alcance

**Dentro:**

- **Dominio — modelo de 4 estados** (`src/lib/domain/uniformes.ts`):
  - `estadoUniforme(uniforme, uniformePago)` → `'completo' | 'porEntregar' | 'porCobrar' | 'sinIniciar'`.
  - Metadatos por estado (label, descripción, tono) y orden por prioridad de acción (`porCobrar`, `porEntregar`, `sinIniciar`, `completo`). La etiqueta de `porCobrar` es **"Pago pendiente"** (no "Por cobrar", para no colisionar con cartera).
- **Store — escrituras independientes** (`data/store.ts`), reemplazan a `guardarUniforme`:
  - `registrarPagoUniforme(id, pagado)` — setea solo `uniformePago`.
  - `registrarEntregaUniforme(id, { tipoKit, numero, talla })` — setea `uniforme: 'entregado'` + kit/número/talla; **no toca el pago**.
  - `anularEntrega(id)` — vuelve a `pendiente`, `numero`/`tipoKit` a null (talla y pago intactos).
- **Pantalla de entrega** (`/admin/alumnos/:id/uniforme`, se conserva la ruta): se reestructura en **dos registros independientes** dentro de la misma pantalla:
  - **Pago del uniforme:** botón Registrar pago / Anular; muestra el **precio R9** ($100.000, $80.000 con hermano).
  - **Entrega del uniforme:** form kit + **número + talla**; Registrar / Anular; **advertencia no bloqueante** de número repetido en el kit.
  - Tarjeta de estado actual arriba (badges Entregado/Sin entregar + Pagado/Sin pagar).
- **Pantalla Uniformes** (`screens/uniformes/`): pasa a **dos tabs** (Segmented):
  - **Estado:** matriz 2×2 **alineada a los ejes** (filas = entregado/sin entregar × columnas = pagado/sin pagar) con el conteo de cada estado (tocar una celda filtra; celda en 0 muestra empty state) + lista de **todos** los alumnos con su badge de estado, ordenada por prioridad; tocar un alumno abre su pantalla de uniforme.
  - **Numeración:** el listado actual por kit (toggle azul/dorado, alerta de duplicados, entregados por número).
- **Tab Uniforme de la ficha** (`screens/ficha/UniformeTab.tsx`): muestra los **dos ejes** (Entregado/Sin entregar + Pagado/Sin pagar); el CTA sigue navegando a la pantalla de uniforme.

**Fuera del alcance (otros specs):**

- **Vista de solo lectura del profesor/entrenador** (el prototipo la tiene; el entrenador aún no tiene app — otro spec).
- **Gestión inline dentro de la ficha** (se descartó: se mantiene la ruta separada).
- **Que `uniformePago` entre a los totales de cartera** (sigue siendo flag informativo, como en spec 07).
- **Persistencia real** (BD/Actions/seed): sigue mock-first; al recargar se pierde lo escrito.
- **Tarifas configurables** (HU-7.3): $100.000/$80.000 siguen como constantes de dominio.

---

## Modelo de datos

No se agregan campos nuevos: el tipo `Alumno` ya tiene los dos ejes (`uniforme: 'entregado' | 'pendiente'` y `uniformePago: 'pagado' | 'pendiente'`). Se introduce una regla de dominio y se cambian los contratos de escritura del store.

### Dominio — estado derivado (`src/lib/domain/uniformes.ts`)

```ts
export type EstadoUniforme = 'completo' | 'porEntregar' | 'porCobrar' | 'sinIniciar';

// e = entregado, p = pagado:
//  e && p  → 'completo'      (Entregado y pagado)
// !e && p  → 'porEntregar'   (Pagó · falta entregar)
//  e && !p → 'porCobrar'     (Entregado · falta el pago → etiqueta "Pago pendiente")
// !e && !p → 'sinIniciar'    (Sin pagar ni entregar)
export function estadoUniforme(uniforme, uniformePago): EstadoUniforme;

// Metadatos presentacionales por estado (label + descripción + tono del DS).
export const ESTADO_UNIFORME_META: Record<EstadoUniforme, {
  label: string;   // "Completo" | "Por entregar" | "Pago pendiente" | "Sin iniciar"
  desc: string;    // "Entregado y pagado", etc.
  tone: 'paid' | 'info' | 'due' | 'pending';
}>;

// Orden por prioridad de acción (para la lista del tab Estado).
// porCobrar primero: mercancía entregada sin pagar = plata en riesgo real.
export const ORDEN_ESTADO_UNIFORME: EstadoUniforme[] =
  ['porCobrar', 'porEntregar', 'sinIniciar', 'completo'];
```

### Store — contratos nuevos (`data/store.ts`)

```ts
// Reemplazan a guardarUniforme (spec 07):
registrarPagoUniforme(id: number, pagado: boolean): void;
//   → setea solo uniformePago ('pagado' | 'pendiente')

registrarEntregaUniforme(id: number, entrega: EntregaUniforme): void;
//   EntregaUniforme = { tipoKit: 'AZUL' | 'DORADO'; numero: number; talla: string }
//   → uniforme: 'entregado' + tipoKit/numero/talla; NO toca uniformePago

anularEntrega(id: number): void;
//   → uniforme: 'pendiente', numero: null, tipoKit: null (talla y pago intactos)
```

Nota: `EntregaUniforme` pierde el campo `pago` que tenía en spec 07 (el pago ahora es un registro aparte).

---

## Plan de implementación

Cada bloque deja `tsc` + `build` en verde, el marketing intacto y el admin funcional.

### Bloque A — Dominio (modelo de 4 estados)

1. `src/lib/domain/uniformes.ts`: `estadoUniforme(uniforme, uniformePago)`, `ESTADO_UNIFORME_META` (label/desc/tono por estado) y `ORDEN_ESTADO_UNIFORME`. Funciones puras, sin tocar `numerosDuplicados`/`numeroOcupado`.

_Verifica:_ las 4 combinaciones devuelven el estado correcto; nada de UI cambia todavía.

### Bloque B — Store (escrituras independientes)

2. `data/store.ts`: agregar `registrarPagoUniforme`, `registrarEntregaUniforme` (sin `pago`) y `anularEntrega`. **Mantener** `guardarUniforme` por ahora para no romper la pantalla de entrega actual.

_Verifica:_ build en verde; las 3 funciones nuevas mutan el eje correcto y notifican; la pantalla vieja sigue andando.

### Bloque C — Pantalla de entrega reestructurada

3. `screens/uniforme-entrega/`: reescribir la pantalla en **tres partes** — tarjeta de estado actual (badges de los dos ejes), registro **Pago** (Registrar/Anular + precio R9) y registro **Entrega** (form kit + número + talla, Registrar/Anular, advertencia no bloqueante de número repetido).
4. Cablear las nuevas escrituras del store; **eliminar** `guardarUniforme` y el campo `pago` de `EntregaUniforme`.

_Verifica:_ registrar solo el pago deja al alumno en `porEntregar`; registrar solo la entrega (sin pago) lo deja en `porCobrar` (etiqueta "Pago pendiente"); anular cada eje revierte; re-entregar tras anular **pre-rellena la talla** que quedó en el alumno; llamar dos veces una misma escritura no rompe el estado (idempotente); número repetido advierte pero no bloquea; hermano ve $80.000.

### Bloque D — Tab Uniforme de la ficha

5. `screens/ficha/UniformeTab.tsx`: mostrar los **dos ejes** (badges Entregado/Sin entregar + Pagado/Sin pagar) y el número/kit si corresponde; el CTA sigue navegando a `/admin/alumnos/:id/uniforme`.

_Verifica:_ la ficha refleja al instante lo registrado en la pantalla de uniforme; los 4 estados se leen bien en la cabecera del tab.

### Bloque E — Pantalla Uniformes (Estado + Numeración)

6. `screens/uniformes/`: introducir tabs (Segmented) **Estado** / **Numeración**.
7. **Estado:** matriz 2×2 **alineada a los ejes** (filas = entregado/sin entregar × columnas = pagado/sin pagar) con el conteo de cada estado (tocar una celda filtra; celda en 0 → empty state) + lista de **todos** los alumnos con su badge de estado, ordenada por `ORDEN_ESTADO_UNIFORME`; tocar un alumno navega a su pantalla de uniforme.
8. **Numeración:** el listado actual por kit (toggle, alerta de duplicados, entregados por número); se **quita** la sección "Por entregar" (la cubre el tab Estado).

_Verifica:_ los contadores 2×2 cuadran con la mock; el filtro acota la lista; Numeración sigue mostrando duplicados y orden por número; toggle azul/dorado filtra.

### Bloque F — Cierre

9. Verificación final: `tsc --noEmit` + `build` en verde, marketing estático, `/admin/**` noindex y fuera del sitemap, ningún archivo > 200 líneas, cero `any`, sin dependencias nuevas, flujos completos y sin scroll horizontal de 320px a desktop.

---

## Criterios de aceptación

### Dominio / estados

- [x] `estadoUniforme` devuelve `completo`/`porEntregar`/`porCobrar`/`sinIniciar` según los dos ejes.
- [x] La lógica de estados vive en `lib/domain` (pura); los componentes no la calculan.

### Store

- [x] `registrarPagoUniforme` cambia solo `uniformePago`.
- [x] `registrarEntregaUniforme` marca `entregado` + kit/número/talla sin tocar el pago.
- [x] `anularEntrega` revierte la entrega (`pendiente`, número/kit null) sin tocar pago ni talla.
- [x] `guardarUniforme` ya no existe y nada lo referencia.
- [x] Las escrituras (pago / entrega / anular) son seguras de llamar en cualquier estado (idempotentes; no rompen ni duplican).

### Pantalla de entrega

- [x] Registrar solo el pago deja al alumno en **Por entregar** (pagó, falta entregar).
- [x] Registrar solo la entrega (sin pago) lo deja en **Pago pendiente** (interno `porCobrar`).
- [x] Cada registro (pago / entrega) tiene su **Anular** y revierte solo su eje.
- [x] El registro de pago muestra el **precio R9** ($100.000, $80.000 con hermano).
- [x] La entrega captura kit + número + talla; un número repetido en el kit **advierte sin bloquear**.
- [x] Al re-entregar tras anular, el form **pre-rellena la talla** que quedó en el alumno.

> **Divergencia de implementación (aprobada por Will durante la construcción):** la pantalla NO usa el layout inline de "tres partes con form suelto". El eje **pago** es un **toggle instantáneo** (botón Registrar/Anular pago, sin form) y el eje **entrega** abre una **hoja modal** (`Sheet`) con el form kit+número+talla. En la pantalla quedan **dos botones lado a lado** (sólido = acción por hacer; contorno = ya hecho → Anular/Editar), el precio R9 encima y, si está entregado, una línea de detalle (Kit · Nº · Talla). Motivo: el layout inline generaba un "muro de campos" poco intuitivo en el estado "Sin iniciar"; los dos ejes son toggles y así se leen mejor. Componentes: `AccionesUniforme.tsx` (fila de botones + precio) y `HojaEntrega.tsx` (Sheet). Todos los criterios de comportamiento de arriba se cumplen igual.

### Ficha

- [x] El tab Uniforme muestra los **dos ejes** (Entregado/Sin entregar + Pagado/Sin pagar) y navega a la pantalla de uniforme.
- [x] Lo registrado se refleja al instante en la ficha.

### Pantalla Uniformes

- [x] Hay dos tabs: **Estado** y **Numeración**.
- [x] Estado: matriz 2×2 **alineada a los ejes** (entrega × pago) con el conteo de cada estado; tocar una celda **filtra** la lista.
- [x] Tocar una celda con conteo 0 muestra un **empty state**, no una lista en blanco.
- [x] La lista del tab Estado ordena por prioridad de acción (`porCobrar`, `porEntregar`, `sinIniciar`, `completo`).
- [x] Tocar un alumno en Estado abre su **pantalla de uniforme**.
- [x] Numeración conserva toggle azul/dorado, alerta de duplicados y orden por número; **ya no** tiene sección "Por entregar".

### Calidad y no-regresión

- [x] Ningún archivo > 200 líneas; cero `any`; sin dependencias nuevas; `tsc --noEmit` + `build` en verde. _(Nota: `astro check` reporta 1 error pre-existente en `src/lib/services/usuarios.ts:45`, ajeno a este spec — tipado de roles de Better Auth del spec 04.)_
- [x] Marketing estático; `/admin/**` noindex y fuera del sitemap.
- [x] De 320px a desktop: cero scroll horizontal en la pantalla Uniformes (ambos tabs) y en la pantalla de uniforme.

---

## Decisiones

- **Sí:** **pago y entrega como registros independientes.** _Por qué:_ habilita "pagó pero no entregado" (`porEntregar`) y "entregado que debe pago" (`porCobrar`), como el prototipo; corrige el flujo combinado del spec 07.
- **Sí:** **mantener la ruta separada** `/admin/alumnos/:id/uniforme` (no inline en la ficha). _Por qué:_ reusa lo del spec 07 y la URL como única fuente (specs 05/06). Diverge del prototipo, que lo hace inline en el tab.
- **Sí:** **mantener la talla en el registro de entrega** (kit + número + talla). _Por qué:_ decisión de Will; el prototipo captura solo kit+número, acá se conserva la talla.
- **Sí:** **mostrar el precio R9 al registrar el pago** ($100.000 / $80.000 con hermano). _Por qué:_ conserva la visibilidad del descuento de hermanos; el prototipo no muestra monto.
- **Sí:** **advertencia no bloqueante** de número repetido en el form de entrega + **alerta** en el tab Numeración. _Por qué:_ mantiene lo del spec 07; el club puede tener motivos puntuales.
- **Sí:** **tab Estado con matriz 2×2 alineada a los ejes (entrega × pago) + filtro**, y Numeración sin "Por entregar". _Por qué:_ una matriz que mapea los dos ejes (filas entregado/no × columnas pagado/no) enseña el modelo de un vistazo — más intuitiva que 4 cards sueltas. Diverge del prototipo (`Extras.js`, que usa tarjetas): **divergencia intencional**, en la misma línea que talla, precio y ruta separada.
- **Sí:** **API del store asimétrica a propósito**: el pago es un toggle de una función (`registrarPagoUniforme(id, pagado)`), la entrega es un par (`registrarEntregaUniforme` + `anularEntrega`). _Por qué:_ el pago es solo un flag sí/no; la entrega carga datos (kit/número/talla) y su anulación limpia campos, así que separar registrar y anular es más claro. **No "emparejar" ambos estilos.**
- **Sí:** **etiquetar `porCobrar` como "Pago pendiente"** (no "Por cobrar") en la UI. _Por qué:_ "por cobrar" es el lenguaje de cartera, y esta deuda de uniforme **no** entra a cartera; un nombre honesto evita que el admin la busque ahí. La clave interna sigue siendo `porCobrar`.
- **Sí:** **orden de prioridad `porCobrar` → `porEntregar` → `sinIniciar` → `completo`**. _Por qué:_ la camiseta ya entregada sin pagar es plata en riesgo real (máxima urgencia); la ya pagada sin entregar es menor riesgo (el club ya tiene el dinero, solo debe logística).
- **No:** **gestión inline dentro de la ficha** — descartada a favor de la ruta separada.
- **No:** **vista readOnly del profesor** — el entrenador no tiene app aún (otro spec).
- **No:** **`uniformePago` en los totales de cartera** — sigue siendo flag informativo (por eso el estado se etiqueta "Pago pendiente" y no "Por cobrar"). Una bandeja única de deuda (cuotas + uniforme) sería otro spec.
- **No:** **tarifas configurables** — $100.000/$80.000 siguen como constantes de dominio.

---

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| Eliminar `guardarUniforme` rompe la pantalla de entrega actual. | El Bloque B mantiene `guardarUniforme` hasta que el Bloque C reescribe la pantalla; se borra al final de C, todo en verde. |
| `anularEntrega` deja número/kit en null pero conserva la talla. | Es intencional: la talla es atributo del alumno, no de la entrega; un criterio lo cubre. |
| El tab Estado lista a todos (~100 alumnos) sin paginación. | Filtro y orden en cliente sobre la lista completa, mismo patrón que `filtraAlumnos` (spec 05); volumen chico. |
| Número repetido tras anular y reasignar. | `numerosDuplicados`/`numeroOcupado` siguen siendo la fuente; la alerta de Numeración y el aviso del form lo reflejan. |
| Reescribir la pantalla de entrega infla archivos > 200 líneas. | Descomponer en sub-componentes (estado actual, registro pago, registro entrega) como el resto del admin. |

---

## Lo que **NO** entra en este spec

- Gestión inline del uniforme dentro de la ficha (se mantiene la ruta separada).
- Vista de solo lectura del profesor/entrenador.
- `uniformePago` en los totales de cartera.
- Tarifas de uniforme configurables.
- Persistencia real (BD/Actions/seed).

Cada uno, si llega, va en su propio spec.
