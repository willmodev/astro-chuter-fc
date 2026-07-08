# SPEC 06 — Cartera + Registrar pago (mock)

> **Estado:** Aprobado · **Depende de:** SPEC 03 (shell, mock, DS), SPEC 04 (middleware, roles), SPEC 05 (routing por URL, dominio de cartera, hooks de alumnos) · **Fecha:** 2026-07-08
> **Objetivo:** Construir las pantallas **Cartera** (tarjetas + matriz alumnos×meses) y **Registrar pago** (selección de meses, método y recibo por WhatsApp), introduciendo un **store mock mutable en memoria** para que registrar un pago vire los meses a pagado y se refleje coherentemente en Cartera, Ficha y Dashboard durante la sesión.

---

## Alcance

**Dentro:**

- **Store mock mutable (`features/admin/data/store.ts`):** convierte la mock estática de alumnos en una fuente reactiva en memoria (patrón `useSyncExternalStore` o context en la raíz de `AdminApp`). Expone lectura + `registrarPago(alumnoId, meses, metodo)`. Al recargar vuelve al mock base. **Contrato estable** (misma forma que tendrán las Actions).
  - Migrar `useAlumnos`, `useAlumno` y `useDashboardData` a leer del store en vez del array de módulo → un pago re-renderiza las tres pantallas ya existentes.
- **Totales derivados (dominio):** los KPIs dejan de venir precocinados; se calculan desde `states`. Nuevas reglas puras en `src/lib/domain/cartera.ts`: `recaudoAnio`, `recaudoMes`, `carteraVencida`, `metaMes`, `pctAlDia` (reutilizan `cuota`/`states`, sin abonos). `useDashboardData` pasa a derivar `stats` con ellas.
- **Pantalla Cartera** `features/admin/screens/cartera/` (HU-3.1, HU-3.2, HU-3.3, HU-3.4):
  - **Cabecera con totales:** "Recaudado año" y "Cartera vencida" en formato COP (`src/lib/format.ts`).
  - **Vista Tarjetas:** por alumno → nombre, categoría, cuota/mes, saldo o "Al día", y tira FEB–DIC de celdas de color (R5: verde=pagado, rojo=mora, gris=pendiente, neutro=fuera de temporada). Tocar celda cobrable → Registrar pago con ese mes.
  - **Vista Matriz:** filas=alumnos, columnas FEB–DIC, **primera columna sticky**; tocar celda cobrable → Registrar pago.
  - **Toggle Tarjetas/Matriz**, con la preferencia **persistida en `localStorage`** (R7.2).
  - **Segmento Todos / En mora** (HU-3.3, solo esos dos; "con abono" sigue `Won't`): filtra la lista de tarjetas / filas de la matriz y actualiza los contadores. Combinable con el toggle de vista. "En mora" = alumnos con ≥1 mes `due`.
- **Pantalla Registrar pago** `features/admin/screens/pago/` (HU-3.5, HU-3.7):
  - Nueva ruta tipada `/admin/alumnos/:id/pago` (deep-linkable, botón atrás nativo).
  - Meses cobrables seleccionables; **preselección según origen** (mes tocado → ese mes; botón genérico → primer mes cobrable).
  - **Total = Σ cuotas** de los meses marcados, en COP. Botón deshabilitado si no hay meses.
  - Selector de **método: efectivo / transferencia**.
  - Confirmar → `registrarPago(...)` (los meses viran a pagado en el store) → **pantalla de éxito**.
  - En éxito: **"Enviar recibo por WhatsApp"** → `wa.me` al celular del acudiente con mensaje precargado (alumno, meses, total) vía `src/lib/whatsapp.ts`.
  - Alumno **al día** → "¡Al día! No hay meses por cobrar". `:id` inexistente → "Alumno no encontrado" + volver.
- **Cableado de ganchos abiertos por el spec 05:** en la Ficha, "Registrar pago" y tocar un mes cobrable dejan de ser placeholder "Próximamente" y navegan a la ruta real. El placeholder "Próximamente" de **Cartera** se reemplaza por la pantalla real.

**Fuera del alcance (otros specs):**

- **Abono/parcial:** un mes se paga o no se paga (sin estado `partial`) — se mantiene la decisión del spec 05.
- **Persistencia real:** el pago vive solo en memoria; BD, Actions y `seed-from-excel` siguen fuera (specs de datos reales).
- **Form inscribir/editar** alumno (HU-2.4/2.5), **Uniformes** (EPIC 5), **Entrenamientos** (EPIC 6), **Más** real (EPIC 7) — siguen "Próximamente".
- **"Mostrar/ocultar montos"** (parte de Más, HU-7.2) — solo se persiste la vista de cartera, no el toggle de montos.
- **Exportar cartera** (HU-8.2).
- **Recaudo por mes (mini-gráfica, HU-4.3)** ya existe en el Dashboard; aquí solo se asegura que siga coherente tras un pago, no se rehace.

---

## Modelo de datos

Sin persistencia nueva (sigue mock). Se introduce el **store mutable** y los **contratos** que servirán las Actions; el tipo `Alumno` del spec 03 ya cubre todo (tiene `states`, `cuota`, `phone`, `acu`).

### Store mock mutable (`features/admin/data/store.ts`)

```ts
export type MetodoPago = 'efectivo' | 'transferencia';

// Fuente reactiva en memoria (useSyncExternalStore). Parte del mock base
// del spec 03; registrarPago muta y notifica a los suscriptores.
interface AdminStore {
  getAlumnos(): Alumno[];
  registrarPago(alumnoId: number, meses: number[], metodo: MetodoPago): void;
  subscribe(cb: () => void): () => void;
}
```

- `registrarPago`: por cada índice de mes en `meses`, si el estado es cobrable (`due`/`pending`) lo pasa a `'paid'`; ignora meses `na`/`paid`. Reset al recargar (es mock).
- `useAlumnos`, `useAlumno`, `useDashboardData` pasan a leer del store (mismo contrato de retorno, sin cambio de forma).

### Router (`features/admin/router/types.ts`)

Se agrega una variante:

```ts
| { vista: 'cartera' }                              // ya existe
| { vista: 'pago'; alumnoId: number; mes?: number } // nueva
```

- `parseRuta('/admin/alumnos/12/pago')` → `{ vista: 'pago', alumnoId: 12 }`.
- El mes tocado se pasa por estado de navegación (no ensucia la URL); `mes` opcional en el tipo lo transporta al preseleccionar.
- `rutaAPath({ vista:'pago', alumnoId:12 })` → `/admin/alumnos/12/pago`.

### Reglas puras nuevas (`src/lib/domain/cartera.ts`)

Derivan totales desde `states` (una sola fuente; reemplazan el `stats` precocinado):

- `recaudoAnio(alumnos)` — Σ (meses `paid` × `cuota`) de todos.
- `recaudoMes(alumnos, mesVivo)` — Σ cuotas `paid` en el mes en curso.
- `carteraVencida(alumnos)` — Σ `saldoPendiente` (meses `due` × cuota).
- `metaMes(alumnos, mesVivo)` — Σ cuotas esperadas del mes (meses no-`na`).
- `pctAlDia(alumnos)` — % de alumnos sin `due`.
- `totalPago(cuota, nMeses)` — `cuota × nMeses` (para Registrar pago).

Reutilizan `estaEnMora`, `mesesEnMora`, `saldoPendiente`, `esMesCobrable` (ya existen).

### Preferencia de UI (`localStorage`)

- Clave `chuter.admin.carteraVista` → `'tarjetas' | 'matriz'`. Lectura defensiva (valor inválido → `'tarjetas'`). Hook `useVistaCartera()` encapsula lectura/escritura.

---

## Plan de implementación

Cada bloque deja `npm run dev`/`npm run build` en verde, el **marketing intacto** y el admin funcional.

### Bloque A — Store mutable + totales derivados

1. `src/lib/domain/cartera.ts`: agregar `recaudoAnio`, `recaudoMes`, `carteraVencida`, `metaMes`, `pctAlDia`, `totalPago` (puras, con test mental de coherencia).
2. `features/admin/data/store.ts`: store `useSyncExternalStore` sobre el mock base del spec 03 + `registrarPago`.
3. Migrar `useAlumnos`, `useAlumno`, `useDashboardData` a leer del store; `useDashboardData` deriva `stats` con las reglas nuevas (elimina el `stats` precocinado de la mock).

_Verifica:_ Dashboard, Alumnos y Ficha muestran las **mismas cifras que antes** (sin regresión); nada rompe; build estático intacto.

### Bloque B — Ruta de Registrar pago

4. `router/types.ts`: variante `{ vista:'pago'; alumnoId; mes? }` + `parseRuta`/`rutaAPath` (parseo defensivo de id no numérico → `alumnos`).
5. `useAdminRouter`: soportar navegar a `pago` transportando el `mes` tocado por estado de navegación.

_Verifica:_ deep-link `/admin/alumnos/12/pago` monta la vista; id inválido → "no encontrado"; atrás regresa al origen.

### Bloque C — Pantalla Registrar pago

6. `features/admin/screens/pago/`: `Pago.tsx` (índice) + sub-componentes (`SelectorMeses`, `SelectorMetodo`, resumen/total, `ExitoPago`) — cada archivo < 200 líneas.
7. Preselección según origen (mes tocado → ese mes; genérico → primer cobrable); total = `totalPago`; botón deshabilitado sin meses.
8. Confirmar → `registrarPago(...)` → pantalla de éxito con **"Enviar recibo por WhatsApp"** (`src/lib/whatsapp.ts`, mensaje: alumno + meses + total).
9. Estados borde: alumno al día → "¡Al día!"; `:id` inexistente → "Alumno no encontrado" + volver.

_Verifica:_ registrar 1+ meses los vira a pagado; la Ficha del mismo alumno ya refleja el cambio al volver; recibo abre `wa.me` correcto.

### Bloque D — Cableado de ganchos de la Ficha

10. En la Ficha (spec 05): "Registrar pago" y tocar un mes cobrable dejan de ser placeholder y **navegan** a `/admin/alumnos/:id/pago` (con `mes` cuando aplica).

_Verifica:_ el flujo Ficha → Registrar pago → éxito → volver funciona y es coherente.

### Bloque E — Pantalla Cartera

11. `features/admin/hooks/useVistaCartera.ts` (localStorage, lectura defensiva).
12. `features/admin/screens/cartera/`: `Cartera.tsx` (índice) + `CabeceraTotales`, `ToggleVista`, `SegmentoFiltro` (Todos/En mora), `TarjetaAlumno` (con `TiraMeses`), `MatrizCartera` (primera columna sticky), estado vacío — cada archivo < 200 líneas.
13. Reemplazar el placeholder "Próximamente" de Cartera por la pantalla real; celda cobrable (tarjeta o matriz) → navega a Registrar pago con ese mes.

_Verifica:_ toggle persiste entre recargas; segmento Todos/En mora filtra y ajusta contadores; totales coherentes con Dashboard; celda → pago; 320px→desktop sin scroll horizontal (matriz scrollea dentro de su contenedor).

### Bloque F — Cierre

14. Verificación final: build estático (marketing intacto), `/admin/**` noindex y fuera del sitemap, ningún archivo > 200 líneas, cero `any`, sin dependencias nuevas, `npm run check` en verde, flujo completo mobile y desktop.

---

## Criterios de aceptación

### Store y coherencia de datos

- [ ] Registrar un pago vira los meses elegidos a "pagado" y el cambio se ve **al instante** en Registrar pago, Ficha, Cartera y Dashboard (misma fuente reactiva).
- [ ] Los totales (Recaudado año, Cartera vencida, Recaudo mes, % al día, En mora) se **derivan de `states`**; tras un pago se recalculan solos, sin `stats` precocinado.
- [ ] Recargar la página revierte al mock base (es memoria, no persistencia).
- [ ] Antes de tocar nada, Dashboard/Alumnos/Ficha muestran las **mismas cifras que en el spec 05** (sin regresión).

### Pantalla Cartera

- [ ] Vista Tarjetas: cada tarjeta muestra alumno, categoría, cuota/mes, saldo o "Al día", y tira FEB–DIC con colores R5 (verde/rojo/gris/neutro).
- [ ] Vista Matriz: filas=alumnos, columnas FEB–DIC, **primera columna sticky**; scrollea dentro de su contenedor sin romper el layout.
- [ ] El toggle Tarjetas/Matriz cambia la vista y la preferencia **persiste en `localStorage`** entre recargas.
- [ ] El segmento **Todos / En mora** filtra la lista y ajusta los contadores; se combina con la vista activa.
- [ ] La cabecera muestra "Recaudado año" y "Cartera vencida" en formato COP, coherentes con el Dashboard.
- [ ] Tocar una celda cobrable (tarjeta o matriz) navega a Registrar pago con ese mes preseleccionado.

### Pantalla Registrar pago

- [ ] Deep-link `/admin/alumnos/:id/pago` monta la pantalla; `:id` inexistente muestra "Alumno no encontrado" con volver.
- [ ] La preselección respeta el origen: mes tocado → ese mes; botón genérico → primer mes cobrable.
- [ ] El total = Σ cuotas de los meses marcados, en COP; el botón Registrar está deshabilitado sin meses seleccionados.
- [ ] El selector ofrece **efectivo** y **transferencia**; el método se guarda con el pago en el store.
- [ ] Confirmar lleva a una pantalla de éxito; desde ahí "Enviar recibo por WhatsApp" abre `wa.me` al celular del acudiente con mensaje precargado (alumno, meses, total).
- [ ] Alumno al día muestra "¡Al día! No hay meses por cobrar" sin permitir cobro.

### Calidad y no-regresión

- [ ] Estados solo binarios por mes (pagado / no pagado): ninguna UI ni regla introduce "abono/parcial".
- [ ] Toda la lógica de totales/estado vive en `src/lib/domain/` (puras); los componentes no calculan negocio.
- [ ] Cambiar la fuente de datos tocaría solo el store y los hooks (contrato estable para Actions futuras).
- [ ] `npm run build` sigue estático para el marketing; `/admin/**` noindex y fuera del sitemap.
- [ ] Ningún archivo > 200 líneas; cero `any`; sin dependencias nuevas; `npm run check` en verde.
- [ ] De 320px a desktop: cero scroll horizontal en ambas pantallas (la matriz scrollea dentro de su contenedor).

---

## Decisiones

- **Sí:** **store mock mutable en memoria** (`useSyncExternalStore`) como fuente reactiva única. _Por qué:_ Registrar pago es la primera escritura del admin; sin un store compartido el pago no se reflejaría en Ficha/Cartera/Dashboard y el flujo quedaría incoherente. El contrato queda idéntico al que servirán las Actions → migrar a BD no toca la UI. Se descartó el "pago cosmético" (éxito sin mutar) por dejar los meses en rojo al volver.
- **Sí:** **totales derivados de `states`** (nuevas reglas puras), eliminando el `stats` precocinado. _Por qué:_ un total estático se desincroniza en cuanto hay un pago; derivarlo es la única forma de mantener coherencia Cartera↔Dashboard.
- **Sí:** **Cartera + Registrar pago juntas** en este spec. _Por qué:_ Registrar pago sin Cartera queda a medias, igual que Alumnos sin Ficha en el spec 05; la Ficha ya dejó los ganchos cableados hacia el pago.
- **Sí:** **Tarjetas + Matriz con toggle** y preferencia persistida en `localStorage`. _Por qué:_ el club revisa cartera como el Excel (matriz) y también card-por-card en el celular; persistir la vista (R7.2) evita re-elegir cada vez. Se descartó el toggle "mostrar/ocultar montos" (es de Más, HU-7.2).
- **Sí:** **ruta URL propia** `/admin/alumnos/:id/pago` para Registrar pago. _Por qué:_ coherente con "la URL es la única fuente" del spec 05; deep-link y botón atrás nativos. Se descartó el sheet/overlay móvil por romper esa regla. El **mes tocado** viaja por estado de navegación, no por la URL, para no ensuciarla.
- **Sí:** **segmento Todos / En mora** en Cartera (decisión de Will en esta ronda). _Por qué:_ enfoca la gestión de cobro. "Con abono" sigue `Won't` (no hay estado parcial).
- **Sí:** **método efectivo / transferencia** guardado con el pago. _Por qué:_ el club distingue ambos; el dato queda listo para las Actions aunque hoy viva en memoria.
- **Sí:** **preselección de meses según origen**. _Por qué:_ reduce fricción — tocar Jun cobra Jun; el botón genérico arranca por el primer mes cobrable.
- **No:** **abono/parcial** (estado `partial`). _Por qué:_ un mes se paga o no se paga (decisión de Will, spec 05). Confirma `Won't` de HU-3.3 (con abono) y HU-3.6.
- **No:** **persistencia real / Actions / seed** en este spec. _Por qué:_ sigue la estrategia mock-first; se cablea a BD en el spec de datos reales sin tocar la UI.
- **No:** **paginación/virtualización** de la matriz. _Por qué:_ ~100 alumnos no lo ameritan; si duele, es cambio interno de la pantalla.

---

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| Migrar `useAlumnos`/`useAlumno`/`useDashboardData` al store rompe cifras ya cerradas (regresión en Dashboard/Alumnos/Ficha). | El Bloque A migra los tres hooks y deriva `stats` en un solo paso, con criterio explícito de "mismas cifras que el spec 05" antes de seguir. El contrato de retorno no cambia de forma. |
| `stats` precocinado en la mock queda huérfano o en uso doble tras derivar los totales. | Se elimina de la mock en el mismo commit que introduce las reglas derivadas; búsqueda de referencias residuales en el cierre. |
| El store con `useSyncExternalStore` provoca re-renders excesivos o suscripciones colgadas. | Snapshot estable (misma referencia si no muta) + `subscribe` con cleanup; el volumen (~100 alumnos) hace irrelevante cualquier costo. |
| El `mes` tocado viaja por estado de navegación y se pierde en un deep-link directo o al refrescar. | Es intencional: sin `mes` (deep-link directo) cae en la preselección "primer mes cobrable"; nunca crashea. Criterio lo verifica. |
| La matriz (alumnos×meses, columna sticky) genera scroll horizontal en 320px o rompe el layout. | La matriz scrollea **dentro de su contenedor** (`overflow-x`), no la página; criterio 320px→desktop. La columna sticky se prueba en móvil real. |
| Pantalla Registrar pago (selector meses + método + resumen + éxito) infla archivos > 200 líneas. | Descomponer desde el diseño en sub-componentes (`SelectorMeses`, `SelectorMetodo`, resumen, `ExitoPago`), como la Ficha del spec 05. |
| `registrarPago` cobra meses no cobrables (`na`/`paid`) y descuadra totales. | La función ignora todo mes no cobrable (solo `due`/`pending` → `paid`); reutiliza `esMesCobrable`. Regla pura, testeable. |
| El contrato del store no calza con las Actions futuras de pago. | Modelarlo desde `ARCHITECTURE.md §5` (agregado por alumno, misma disciplina que los hooks del spec 05); `registrarPago(alumnoId, meses, metodo)` espeja la firma de la Action. |
| El recibo por WhatsApp arma un `wa.me` con número mal formateado. | Reutiliza `src/lib/whatsapp.ts` (única vía, ya probada en Ficha del spec 05); no se duplica la lógica. |
