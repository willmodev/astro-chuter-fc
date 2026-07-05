# SPEC 05 — Alumnos y Ficha del alumno (mock) + routing por URL

> **Estado:** Implementado · **Depende de:** SPEC 03 (shell, mock, DS), SPEC 04 (middleware, roles) · **Fecha:** 2026-07-05
> **Objetivo:** Construir las pantallas **Alumnos** (lista con búsqueda y filtro por categoría) y **Ficha del alumno** (tabs Pagos / Uniforme / Acudiente) con la mock extendida del spec 03, introduciendo **routing por URL real** (`/admin/alumnos`, `/admin/alumnos/:id`) en la isla admin vía catch-all + History API.

---

## Alcance

**Dentro:**

- **Routing por URL real** en la isla admin:
  - `src/pages/admin/[...ruta].astro` (`prerender = false`): catch-all que monta `AdminApp` para cualquier `/admin/**` (excepto `/admin/login` e `/admin`, que ya existen como rutas estáticas de Astro y tienen prioridad).
  - Mini-router en la isla (`features/admin/router/`): lee `location.pathname`, navega con `history.pushState`, escucha `popstate` (botón atrás). Rutas: `/admin` (dashboard), `/admin/alumnos`, `/admin/alumnos/:id`, `/admin/cartera`, `/admin/mas`, `/admin/equipo`. Ruta desconocida → redirige a `/admin`.
  - Las tabs existentes (`AdminNav`, accesos desde Más como "Equipo") migran del estado de vista interno a URLs — se elimina el router por estado del spec 03.
- **Pantalla Alumnos** `features/admin/screens/alumnos/` (HU-2.1, HU-2.2):
  - Lista de alumnos: avatar, nombre, categoría, acudiente, estado (al día / en mora con # meses).
  - Buscador por nombre **o** acudiente, sin distinguir mayúsculas/acentos.
  - Chips de categoría (Todas + SUB 4–16) combinables con el buscador.
  - Contadores "N alumnos" y "N en mora"; estado vacío "Sin resultados".
  - Tocar una fila → navega a `/admin/alumnos/:id`.
- **Pantalla Ficha** `features/admin/screens/ficha/` (HU-2.3):
  - Cabecera: nombre, categoría, estado; botón volver; acciones "Registrar pago" (→ placeholder "Próximamente") y "WhatsApp" (→ `wa.me` real al celular del acudiente vía `src/lib/whatsapp.ts`).
  - Tab **Pagos del año:** meses FEB–DIC con estado por mes; tocar mes cobrable → placeholder "Próximamente".
  - Tab **Uniforme:** kit/número/talla si entregado, o CTA "Registrar entrega" (→ placeholder).
  - Tab **Acudiente:** acudiente, celular, dirección, documento, año nac., ingreso, hermanos.
  - `:id` inexistente → estado "Alumno no encontrado" con volver a la lista.
- **Mock extendida:** los mismos `Alumno[]` del spec 03, ampliados si a la Ficha le falta algún campo; hook `useAlumnos()` / `useAlumno(id)` con contrato estable (misma forma que tendrán las Actions). Dashboard y Alumnos muestran cifras coherentes (misma fuente).
- **Dominio:** reutilizar `estaEnMora`, `saldoPendiente`, `mesesEnMora`; agregar lo puro que exija la lista (p. ej. `filtraAlumnos` con normalización de acentos) en `src/lib/domain/`.

**Fuera del alcance (otros specs):**

- **Registrar pago** real y tocar-mes-para-cobrar (spec Cartera/pagos).
- **Form de inscripción / edición** de alumno (HU-2.4, HU-2.5) — categoría automática y tarifa de hermanos van ahí.
- **Cartera**, Uniformes, Entrenamientos, Más real (siguen "Próximamente", ahora con URL propia).
- Retirar/desactivar alumno (HU-2.6).
- BD real, Actions, seed Excel — la fuente sigue siendo mock.
- App del entrenador (su gate por rol no cambia).

---

## Modelo de datos

Sin persistencia nueva (sigue mock). Se introducen **tipos del router** y los **contratos de los hooks**; el tipo `Alumno` del spec 03 ya cubre todo lo que pide la Ficha — no se amplía salvo que al maquetar falte algo puntual.

### Router (`features/admin/router/types.ts`)

```ts
export type RutaAdmin =
  | { vista: 'dashboard' }
  | { vista: 'alumnos' }
  | { vista: 'ficha'; alumnoId: number }
  | { vista: 'cartera' }
  | { vista: 'mas' }
  | { vista: 'equipo' };
```

- `parseRuta(pathname: string): RutaAdmin` — pura, `/admin/alumnos/12` → `{ vista: 'ficha', alumnoId: 12 }`; desconocida → `{ vista: 'dashboard' }`.
- `rutaAPath(ruta: RutaAdmin): string` — inversa, para `pushState`.
- Hook `useAdminRouter()`: expone `ruta` + `navegar(ruta)`, escucha `popstate`.

### Contratos de hooks (mismos que servirán las Actions)

```ts
// features/admin/hooks/useAlumnos.ts
interface AlumnosData {
  alumnos: Alumno[];        // orden alfabético
  total: number;
  enMora: number;
}
// useAlumnos(): AlumnosData — filtro/búsqueda se aplican en la pantalla vía dominio

// features/admin/hooks/useAlumno.ts
// useAlumno(id: number): Alumno | undefined
```

### Reglas puras nuevas (`src/lib/domain/`)

- `normaliza(texto)` — minúsculas + sin acentos (para búsqueda).
- `filtraAlumnos(alumnos, { query, cat })` — nombre **o** acudiente, combinable con chip de categoría.
- `estadoAlumno(a)` → `'alDia' | 'mora'` — un mes **se cobra o no se cobra**, sin estados intermedios (reutiliza `mesesEnMora`).

---

## Plan de implementación

Cada bloque deja `npm run dev`/`npm run build` en verde, el **marketing intacto** y el admin funcional.

### Bloque A — Routing por URL

1. `features/admin/router/`: `types.ts` (`RutaAdmin`), `parseRuta`/`rutaAPath` (puras) y `useAdminRouter()` (`pushState` + `popstate`).
2. `src/pages/admin/[...ruta].astro` (`prerender = false`): monta `AdminApp` igual que `index.astro`, pasando `role`/`userName` desde `locals`. Extraer el markup común si se duplica.
3. `AdminApp.tsx`: reemplazar el router por estado del spec 03 por `useAdminRouter()`; `AdminNav` y accesos de Más (Equipo) navegan por URL. Dashboard, Equipo y placeholders quedan igual pero con URL propia.

_Verifica:_ `/admin/cartera` directo por URL carga la tab Cartera (placeholder); atrás/adelante del navegador funciona; `/admin/login` y el middleware intactos; ruta desconocida → dashboard.

### Bloque B — Dominio + datos

4. `src/lib/domain/`: `normaliza`, `filtraAlumnos`, `estadoAlumno` (puras, reutilizan `mesesEnMora`).
5. `features/admin/hooks/`: `useAlumnos()` (lista + contadores desde la mock del spec 03) y `useAlumno(id)`.

_Verifica:_ contadores coherentes con los KPIs del Dashboard (misma mock, mismas reglas).

### Bloque C — Pantalla Alumnos

6. `features/admin/screens/alumnos/`: `Alumnos.tsx` (índice) + sub-componentes (`BuscadorAlumnos`, `ChipsCategoria`, `FilaAlumno`, contadores, estado vacío) — cada archivo < 200 líneas.
7. Fila → `navegar({ vista: 'ficha', alumnoId })`.

_Verifica:_ búsqueda sin acentos/mayúsculas por nombre o acudiente; chips combinables; "Sin resultados"; responsive 320px→desktop sin scroll horizontal.

### Bloque D — Pantalla Ficha

8. `features/admin/screens/ficha/`: `Ficha.tsx` (índice) + cabecera (volver, estado, acciones), tabs `PagosDelAnio`, `Uniforme`, `Acudiente` — cada archivo < 200 líneas.
9. Acciones: "WhatsApp" → `wa.me` real vía `src/lib/whatsapp.ts`; "Registrar pago", mes cobrable y "Registrar entrega" → placeholder "Próximamente".
10. `alumnoId` inexistente → "Alumno no encontrado" + volver a la lista.

_Verifica:_ deep-link `/admin/alumnos/:id` directo funciona; volver regresa a la lista conservando el flujo del navegador.

### Bloque E — Cierre

11. Verificación final: build estático (marketing intacto), `/admin/**` noindex y fuera del sitemap, ningún archivo > 200 líneas, cero `any`, navegación completa mobile y desktop.

---

## Criterios de aceptación

### Routing por URL

- [x] `/admin/alumnos`, `/admin/alumnos/:id`, `/admin/cartera`, `/admin/mas` y `/admin/equipo` cargan directo por URL (deep-link) la vista correcta, con sesión activa.
- [x] Sin sesión, cualquiera de esas URLs redirige a `/admin/login?next=<ruta>` y tras el login aterriza en la vista pedida.
- [x] Navegar entre tabs actualiza la URL sin recargar la página; atrás/adelante del navegador recorren el historial de vistas.
- [x] Una ruta desconocida bajo `/admin/**` muestra el Dashboard.
- [x] `/admin/login` sigue funcionando igual (no la captura el catch-all).

### Pantalla Alumnos

- [x] La lista muestra por alumno: avatar, nombre, categoría, acudiente y estado (al día / en mora con # de meses).
- [x] El buscador filtra por nombre **o** acudiente, sin distinguir mayúsculas ni acentos ("jose" encuentra "José").
- [x] Los chips de categoría filtran y se combinan con el buscador; "Todas" restablece.
- [x] Se ven los contadores "N alumnos" y "N en mora", coherentes con el filtro activo y con los KPIs del Dashboard (misma mock).
- [x] Sin coincidencias se muestra "Sin resultados".
- [x] Tocar una fila navega a `/admin/alumnos/:id`.

### Pantalla Ficha

- [x] La cabecera muestra nombre, categoría y estado, con botón volver y acciones "Registrar pago" (placeholder) y "WhatsApp" (abre `wa.me` al celular del acudiente vía `src/lib/whatsapp.ts`).
- [x] Tab Pagos: meses FEB–DIC con su estado; tocar un mes cobrable abre el placeholder "Próximamente".
- [x] Tab Uniforme: kit/número/talla si entregado, o CTA "Registrar entrega" (placeholder) si pendiente.
- [x] Tab Acudiente: acudiente, celular, dirección, documento, año de nacimiento, ingreso y hermanos.
- [x] Un `:id` inexistente muestra "Alumno no encontrado" con acción de volver a la lista.

### Calidad y no-regresión

- [x] Estados solo binarios por mes (se cobró o no): ninguna UI ni regla introduce "abono/parcial".
- [x] Toda la lógica de filtro/estado vive en `src/lib/domain/` (puras); los componentes no calculan negocio.
- [x] Cambiar la fuente de datos tocaría solo `useAlumnos`/`useAlumno` (contrato estable para Actions futuras).
- [x] `npm run build` sigue estático para el marketing; `/admin/**` noindex y fuera del sitemap.
- [x] Ningún archivo > 200 líneas; cero `any`; sin dependencias nuevas.
- [x] De 320px a desktop: cero scroll horizontal en ambas pantallas.

---

## Decisiones

- **Sí:** **routing por URL real con catch-all + History API** (sin librería). _Por qué:_ el usuario pidió lo profesional sin deuda técnica; deep-links y botón atrás nativos, cero dependencias nuevas, y las rutas quedan listas para las pantallas futuras. Se descartó hash-routing (`#alumnos/123`) por menos limpio y el estado interno del spec 03 por no soportar deep-links.
- **Sí:** **Alumnos + Ficha juntas** en este spec. _Por qué:_ la Ficha es el destino natural de la lista; separadas dejarían una lista sin destino. El Form de inscripción/edición (HU-2.4/2.5) se descartó aquí porque trae lógica propia (categoría automática, tarifa de hermanos) que inflaría el alcance.
- **Sí:** **sin estado "abono/parcial"** — un mes se cobra o no se cobra (decisión de Will, 2026-07-05). _Por qué:_ refleja la operación real del club. Deja obsoletas HU-3.3 (filtro "con abono"), HU-3.6 y el estado `partial` de R5 en el backlog → marcar como `Won't` al cerrar este spec.
- **Sí:** **extender la mock del spec 03**, no crear otra. _Por qué:_ Dashboard y Alumnos deben mostrar cifras coherentes; una sola fuente evita divergencias.
- **Sí:** **placeholder "Próximamente"** en Registrar pago, mes cobrable y Registrar entrega. _Por qué:_ deja los puntos de navegación cableados para los specs de Cartera/Uniformes sin adelantar sus pantallas.
- **Sí:** **filtro y búsqueda en cliente** sobre la lista completa (`filtraAlumnos` en dominio). _Por qué:_ ~100 alumnos no ameritan búsqueda en servidor; la regla pura se reutilizará igual cuando la fuente sean Actions.
- **No:** **librería de routing** (react-router, wouter). _Por qué:_ 6 rutas planas no justifican una dependencia; `parseRuta`/`rutaAPath` puras son suficientes y testeables.
- **No:** **una página Astro por pantalla.** _Por qué:_ se mantiene la isla única (decisión del spec 03/04); el catch-all sirve todas las rutas y el middleware ya las protege.
- **No:** **paginación o virtualización** de la lista. _Por qué:_ volumen pequeño; si algún día duele, es un cambio interno de la pantalla.

---

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| El catch-all `[...ruta].astro` captura rutas que no debe (`/admin/login`, `/api/**`) o rompe el gate. | Astro prioriza rutas estáticas sobre dinámicas (`login.astro` e `index.astro` ganan); el middleware protege `/admin/**` antes de renderizar. Criterios verifican login y deep-links con y sin sesión. |
| Duplicar el markup de montaje entre `index.astro` y `[...ruta].astro` genera divergencia. | Extraer lo común (o hacer que `index.astro` sea trivial); criterio de DRY en la revisión del cierre. |
| Migrar el router por estado a URL rompe navegación existente (Equipo, FAB, gate de rol del entrenador). | El Bloque A migra todo en un solo paso y verifica cada tab + rol entrenador antes de seguir; `RutaAdmin` tipado hace imposible una vista sin ruta. |
| Desincronización URL ↔ estado (doble fuente de verdad). | La URL es la única fuente: `useAdminRouter` deriva `ruta` de `location.pathname`; nadie guarda la vista en estado propio. |
| `parseRuta` con `:id` malformado (`/admin/alumnos/abc`) crashea. | Parseo defensivo: id no numérico → `{ vista: 'alumnos' }`; id numérico inexistente → "Alumno no encontrado". Ambos con criterio. |
| La Ficha (cabecera + 3 tabs) infla archivos > 200 líneas. | Descomponer en sub-componentes por tab desde el diseño, como en el Dashboard del spec 03. |
| La búsqueda sin acentos se implementa distinto en cada pantalla futura. | `normaliza`/`filtraAlumnos` viven en `lib/domain` y son la única vía; Cartera las reutilizará. |
| El contrato de `useAlumnos`/`useAlumno` no calza con las Actions futuras. | Modelarlo desde `ARCHITECTURE.md §5` (misma disciplina que `useDashboardData`, que ya pasó por esto). |
