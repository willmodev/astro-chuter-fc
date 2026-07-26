# SPEC 14 — Retiro y reactivación de alumnos + sincronización de fuentes de verdad

> **Estado:** Implementado · **Depende de:** SPEC 05 (pantallas Alumnos + Ficha, donde viven la acción y el chip), SPEC 11 (persistencia de alumnos/cartera/dashboard y la columna `activo` que hoy nadie filtra), SPEC 04 (patrón de activar/desactivar reversible de Equipo, que se replica) · **Fecha:** 2026-07-22
> **Objetivo:** Retirar y reactivar alumnos reutilizando la columna `activo` existente (sin migración) para que un retirado salga de activos, cartera y plantel conservando su historial de pagos, y de paso dejar sincronizadas las fuentes de verdad del repo (backlog al día, `NEXT-STEPS.md` eliminado).

---

## Alcance

**Dentro:**

- **Repo** (`src/lib/db/repos/alumnos.ts`): nueva función `cambiarActivoAlumno(id, activo)` (update de la sola columna `activo`); `listarAlumnos` gana un parámetro para **incluir o excluir** retirados (por defecto solo activos). Sin cambios de schema ni migración.
- **Services** (`src/lib/services/{alumnos,cartera,dashboard}.ts`): los **retirados salen** de "alumnos activos", de la cartera y del cálculo de mora/cartera vencida; **el recaudado del año sigue sumando** los pagos ya hechos por un retirado (el dinero entró). `listarPlantel` (entrenador) **excluye** retirados. `listarAlumnosAdmin` puede devolver también los retirados cuando el admin lo pide (para el chip).
- **Action** (`src/actions/alumnos.ts`): `cambiarActivo({ id, activo })` con `requireAdmin` + Zod, replicando el patrón de `usuarios.cambiarActivo` (SPEC 04). El entrenador nunca la puede llamar.
- **Ficha del alumno** (`screens/ficha/`): acción **Retirar** (con confirmación) / **Reactivar** según el estado; encabezado marca el estado **"Retirado"**; mientras esté retirado, **"Registrar pago" queda deshabilitado** (no se cobra a un retirado). Los tabs (Pagos/Uniforme/Acudiente) siguen consultables en su historial.
- **Lista de Alumnos** (`screens/alumnos/`, solo admin): chip/toggle **"Mostrar retirados"** (por defecto ocultos); las filas de retirados aparecen con un **badge "Retirado"**; el contador "N alumnos / N en mora" cuenta **solo activos**.
- **Confirmación**: hoja/modal "¿Retirar a X?" antes de aplicar (reactivar no la necesita).
- **Hooks**: lista y ficha refrescan tras el toggle (**pesimista** → refetch, patrón specs 11–13); sin cambiar su forma de retorno.
- **Sincronización de fuentes de verdad** (bloque de cierre):
  - `docs/backlog.md`: **reconciliar todas las HU** al estado real (☑ las cerradas por specs 03–13 con su nota de spec; ☐ solo lo realmente pendiente; HU-2.6 ☑ al cerrar este spec).
  - `docs/NEXT-STEPS.md`: **eliminar** (obsoleto — afirma "aún no se ha tocado código" con 13 specs hechos).
  - `docs/ARCHITECTURE.md`: anotar el filtro por `activo` si corresponde; `CLAUDE.md` no cambia (sin variable ni stack nuevo).

**Fuera del alcance (otros specs):**

- **Motivo/fecha de retiro** (columnas nuevas) — descartado en definición: solo `activo`.
- **Borrado físico** de un alumno — nunca; el retiro es soft y reversible.
- **Retiro por lote / masivo** — se retira de a uno.
- Que el **entrenador** vea o gestione retirados — el chip y la acción son solo del admin.
- **Filtro "mostrar retirados" en Cartera** — solo en Alumnos; si se pide, otro spec.
- **Reactivación automática** al registrar un pago — reactivar es siempre acción explícita.
- Las demás HU pendientes (7.1, 7.2 montos, 7.3, 7.4, 8.2, 0.2 ESLint) — cada una su spec.

---

## Modelo de datos

**No introduce estructuras nuevas.** Reutiliza la columna `alumnos.activo` (`boolean`, `notNull`, `default true`) del SPEC 11. **Cero migración**: `activo=false` significa *retirado*.

Contratos nuevos o cambiados (solo firmas — la implementación va después):

```ts
// Repo (src/lib/db/repos/alumnos.ts)
cambiarActivoAlumno(id: number, activo: boolean): Promise<void>;             // update de la sola columna
listarAlumnos(opts?: { incluirRetirados?: boolean }): Promise<AlumnoRow[]>;  // default: solo activos

// Service (src/lib/services/alumnos.ts)
cambiarActivoAlumno(id: number, activo: boolean): Promise<void>;             // orquesta el repo
listarAlumnosAdmin(hoy: Date, incluirRetirados?: boolean): Promise<Alumno[]>;
// listarPlantel(cats) y los derivados de cartera/dashboard filtran activo=true

// Action (src/actions/alumnos.ts)
alumnos.cambiarActivo({ id: number, activo: boolean })                       // requireAdmin + Zod
```

Reglas derivadas (no son datos nuevos, son cómo se lee `activo`):

- **Alumnos activos** = `activo = true`. Los KPIs, el % al día, la lista de morosos y la cartera vencida se calculan **solo sobre activos**.
- **Recaudado del año** = Σ de los pagos reales, **incluidos los de un alumno ya retirado** (el pago ocurrió; no se revierte).
- El `Alumno` que el service arma para la UI **expone `activo`** para pintar el badge "Retirado" y decidir entre acción Retirar / Reactivar. `AlumnoRow` y `COLUMNAS` ya lo traen del repo.

Sin `ORDER BY` nuevo: los retirados, cuando se muestran, se ordenan igual que el resto (por nombre) y se distinguen solo por el badge.

---

## Plan de implementación

Cada bloque deja `tsc --noEmit` + `build` en verde, el marketing intacto y el admin funcional.

### Bloque A — Backend del toggle (repo + service + action)

1. Repo `alumnos.ts`: `cambiarActivoAlumno(id, activo)` (update de la sola columna) y `listarAlumnos({ incluirRetirados })` — por defecto `where activo = true`.
2. Service `alumnos.ts`: `cambiarActivoAlumno`; `listarAlumnosAdmin(hoy, incluirRetirados)` propaga el flag; `listarPlantel(cats)` excluye retirados.
3. Action `alumnos.cambiarActivo({ id, activo })` con `requireAdmin` + Zod; ya registrada bajo el namespace `alumnos`.

_Verifica:_ la Action niega a entrenador y sin sesión; cambiar `activo` persiste; `listarAlumnos()` sin flag no trae retirados.

### Bloque B — Filtrado en cartera y dashboard

4. Services de `cartera.ts` y `dashboard.ts`: excluir retirados de activos, mora, cartera vencida y top morosos; **el recaudado del año sigue incluyendo** los pagos de retirados.

_Verifica:_ retirar un alumno con mora baja el conteo de activos y la cartera vencida; su pago histórico sigue sumando en recaudado; reactivar revierte ambos.

### Bloque C — Ficha: retirar / reactivar + confirmación

5. Hook de la ficha: llama `alumnos.cambiarActivo` (pesimista → refetch), conservando su forma.
6. Ficha UI: botón **Retirar** (abre hoja de confirmación) / **Reactivar** según estado; badge **"Retirado"** en `FichaHeader`; **"Registrar pago" deshabilitado** mientras esté retirado.

_Verifica:_ retirar pide confirmación, aplica, y la ficha muestra "Retirado" con Registrar pago deshabilitado; reactivar revierte sin pedir confirmación.

### Bloque D — Lista de Alumnos: chip + badge

7. Estado de la lista (admin): chip **"Mostrar retirados"** que pide `listar` con `incluirRetirados`; el contador cuenta solo activos.
8. UI: badge **"Retirado"** en la fila cuando el chip está activo; el entrenador no ve el chip.

_Verifica:_ por defecto no se ven retirados; con el chip aparecen marcados; "N alumnos / N en mora" no los cuenta; el plantel del entrenador tampoco los muestra.

### Bloque E — Sincronización de fuentes de verdad

9. `docs/backlog.md`: reconciliar **todas** las HU al estado real (☑ las cerradas por specs 03–13 con su nota; ☐ solo lo pendiente real; **HU-2.6 ☑**).
10. Eliminar `docs/NEXT-STEPS.md`; anotar en `docs/ARCHITECTURE.md` el filtro por `activo` (retirados fuera de activos/cartera).

_Verifica:_ ninguna HU ya hecha queda marcada ☐; `NEXT-STEPS.md` no existe; ninguna fuente contradice a otra.

### Bloque F — Cierre y verificación

11. `tsc --noEmit` + `build` en verde; ningún archivo > 200 líneas; cero `any`; marketing prerenderizado intacto; `/admin/**` noindex; verificación visual con Playwright `--headed` (320px–desktop) en Alumnos, Ficha, Cartera y Dashboard.

---

## Criterios de aceptación

### Retiro y reactivación

- [x] Retirar un alumno pone `activo=false` y **sobrevive a recargar** (vive en Neon); reactivar lo revierte a `activo=true`.
- [x] Retirar pide **confirmación** ("¿Retirar a X?") antes de aplicar; reactivar no la pide.
- [x] Ningún dato se borra: el historial de pagos y uniformes del retirado se conserva intacto y sigue consultable en su ficha.
- [x] El retiro es **reversible** cuantas veces se quiera (toggle), sin efectos secundarios acumulados.

### Efecto en cartera y dashboard

- [x] Un alumno retirado **no cuenta** en "alumnos activos", ni en % al día, ni en la lista de morosos, ni en la cartera vencida.
- [x] Un alumno retirado **no genera mora nueva**: sus meses pendientes dejan de sumar a la cartera vencida.
- [x] Los pagos ya registrados por un retirado **siguen sumando** al "recaudado del año".
- [x] Reactivar al alumno lo devuelve a los conteos de activos y cartera de forma coherente.

### UI — Ficha y Lista

- [x] La ficha de un retirado muestra el estado **"Retirado"** y su acción principal pasa a **Reactivar**.
- [x] Mientras el alumno esté retirado, **"Registrar pago" está deshabilitado** en su ficha.
- [x] En la lista de Alumnos, por defecto **no aparecen** los retirados; el chip **"Mostrar retirados"** los trae marcados con badge **"Retirado"**.
- [x] El contador "N alumnos / N en mora" cuenta **solo activos**, con o sin el chip activo.

### Seguridad por rol

- [x] `alumnos.cambiarActivo` niega sin sesión (`UNAUTHORIZED`) y a un entrenador (`FORBIDDEN`): solo el admin retira/reactiva.
- [x] El **plantel del entrenador no muestra** alumnos retirados y el entrenador **no ve** el chip "Mostrar retirados".

### Sincronización de fuentes de verdad

- [x] `docs/backlog.md` refleja el estado real: **ninguna HU ya implementada queda marcada ☐**, y cada ☑ apunta al spec que la cerró; **HU-2.6 queda ☑**.
- [x] `docs/NEXT-STEPS.md` **ya no existe** en el repo.
- [x] `docs/ARCHITECTURE.md` documenta que los retirados quedan fuera de activos/cartera; ninguna fuente contradice a otra.

### Calidad y no-regresión

- [x] Ningún archivo > 200 líneas; cero `any`; `tsc --noEmit` + `build` en verde.
- [x] Marketing prerenderizado intacto; `/admin/**` noindex y fuera del sitemap.
- [x] De 320px a desktop: cero scroll horizontal en Alumnos, Ficha, Cartera y Dashboard.

---

## Decisiones

- **Sí:** **reusar la columna `activo` existente, sin migración.** _Por qué:_ ya existe desde el SPEC 11 y el repo la selecciona; retirar es escribir un `boolean`, no tocar el schema.
- **Sí:** **solo `activo`, sin `fechaRetiro` ni motivo.** _Por qué:_ no se pidió registrar el "cuándo/por qué"; añadir columnas sería una migración sin consumidor. Migra fácil si algún día se necesita.
- **Sí:** **retiro reversible (toggle), simétrico al ban de Equipo** (SPEC 04). _Por qué:_ un alumno puede volver; reusa un patrón ya probado en el repo.
- **Sí:** **el retirado sale de activos/cartera/mora pero conserva su historial**, y sus pagos siguen contando al recaudado. _Por qué:_ refleja la realidad contable (el dinero entró) y no infla la mora con quien ya no está.
- **Sí:** **acción en la Ficha + chip "Mostrar retirados" solo en Alumnos (admin).** _Por qué:_ la ficha es el lugar natural del cambio; el chip deja consultarlos y reactivarlos sin ensuciar la lista diaria.
- **Sí:** **confirmación antes de retirar, no al reactivar.** _Por qué:_ retirar tiene efectos (sale de cartera); reactivar es benigno.
- **Sí:** **"Registrar pago" deshabilitado en un retirado.** _Por qué:_ coherente con "sale de cartera"; no se cobra a quien no está inscrito.
- **Sí:** **el plantel del entrenador excluye retirados y el entrenador no ve el chip.** _Por qué:_ un retirado ya no entrena; el entrenador no gestiona altas/bajas.
- **Sí:** **la sincronización documental va dentro de este spec.** _Por qué:_ ya se mapeó el estado real de todo; consolidar ahora deja una fuente por propósito (backlog = qué falta · specs = por qué · ARCHITECTURE = estado actual).
- **Sí:** **eliminar `NEXT-STEPS.md` en vez de actualizarlo.** _Por qué:_ es un handoff de arranque ya superado por 13 specs; mantenerlo es otra fuente que miente.
- **No:** **borrado físico (hard delete).** _Por qué:_ destruye historial de pagos/uniformes; el retiro soft cumple el objetivo.
- **No:** **retiro por lote / masivo.** _Por qué:_ no hay caso real; se retira de a uno.
- **No:** **filtro de retirados en Cartera.** _Por qué:_ la cartera es de cobro activo; consultarlos es tarea de la pantalla Alumnos.
- **No:** **reactivación automática al registrar un pago.** _Por qué:_ implícita y peligrosa; reactivar es siempre decisión explícita del admin.

---

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| Olvidar filtrar `activo` en algún derivado (cartera, morosos, cartera vencida, cumpleaños, plantel) y que un retirado siga apareciendo en un lugar. | El filtro se centraliza en el service que arma la lista base de activos; los derivados consumen esa lista. Los criterios de aceptación cubren cada superficie por separado (activos, % al día, morosos, cartera vencida, plantel). |
| Cambiar el default de `listarAlumnos()` a "solo activos" altera en silencio a un consumidor existente que esperaba ver a todos. | Auditar los llamadores actuales antes de cambiar el default; el único caso que necesita a todos es el chip del admin, que pasa `incluirRetirados` explícito. |
| El "recaudado del año" baja por error al excluir los pagos de un retirado. | El recaudado se calcula sobre la tabla `pagos`, no sobre la lista de alumnos activos; hay un criterio de aceptación explícito para esto. |
| El chip "Mostrar retirados" se combina mal con el buscador/filtro de categoría y cuela un retirado con el chip apagado. | El filtro por `activo` se aplica **antes** del filtro de búsqueda/categoría; el criterio "por defecto no aparecen" lo verifica. |
| Reactivar a mitad de año hace reaparecer como mora los meses no cobrados durante el retiro. | Es el comportamiento correcto y buscado: reactivar devuelve al alumno con su historia real, no "perdona" mora por haber estado retirado. Se documenta como semántica esperada, no como bug. |
| Reconciliar el backlog a mano introduce marcas nuevas equivocadas. | Cada HU se cruza contra el spec que la cerró (ya mapeado en esta sesión) y cada ☑ cita su spec; el criterio de aceptación exige que ninguna HU hecha quede ☐. |

---

## Lo que **NO** entra en este spec

- Motivo o fecha de retiro (columnas nuevas).
- Borrado físico (hard delete) de un alumno.
- Retiro por lote / masivo.
- Gestión o visibilidad de retirados por el entrenador.
- Filtro de retirados en Cartera.
- Reactivación automática al registrar un pago.
- Las demás HU pendientes (7.1, 7.2 montos, 7.3, 7.4, 8.2, 0.2 ESLint).

Cada uno, si llega, va en su propio spec.
