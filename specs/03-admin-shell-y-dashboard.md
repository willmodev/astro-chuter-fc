# SPEC 03 — Shell del admin + pantalla Dashboard (mock)

> **Estado:** Implementado · **Depende de:** `docs/ARCHITECTURE.md` (secciones 1, 5, 6, 7) · **Fecha:** 2026-07-04
> **Objetivo:** Levantar el andamiaje del frontend admin —isla React en `/admin` con router interno de tabs, chrome móvil (header + tab bar) y tokens del design system aislados bajo `.admin-app`— sirviendo **solo la pantalla Dashboard** con datos mock tipados, sin autenticación ni base de datos todavía.

---

## Alcance

**Dentro:**

- **Ruta y layout:** `src/pages/admin/index.astro` con `export const prerender = false` + `AdminLayout.astro` (`noindex`, carga `admin.css`, `100dvh`, safe-area, **sin marco iPhone**).
- **Isla única** `features/admin/AdminApp.tsx` (`client:only="react"`) con **router interno mínimo** por estado de vista para las 4 tabs (`dashboard`, `alumnos`, `cartera`, `mas`). Solo `dashboard` renderiza contenido real; las otras 3 muestran un placeholder "Próximamente".
- **Chrome** portado a `features/admin/chrome/`: `AppHeader`, `IconButton`, `SectionLabel`, `AdminNav`, `AdminShell` y `Icon.tsx` (wrapper tipado sobre `lucide-react`, reemplaza el hack CDN `data-lucide`). El **FAB dorado central** se conserva en la variante mobile pero abre un placeholder "Próximamente" (los action sheets reales van en otro spec).
- **Primitivos del DS** portados a `features/admin/ui/` (solo los que usa Dashboard): `KpiCard`, `Card`, `Badge`, `Avatar`.
- **Pantalla Dashboard** en `features/admin/screens/dashboard/`, descompuesta en sub-componentes (hero de recaudo, KPIs 2×2, barras recaudo/mes, cobros pendientes, próximos cumpleaños, entreno de hoy) para respetar el límite de 200 líneas/archivo.
- **Mock data tipada** en `features/admin/data/`: portar `window.MOCK` a TS con tipos explícitos (`Alumno`, `EstadoMes`, `Stats`, etc.) y stats derivadas, marcada como **ilustrativa**. Se expone tras un hook `useDashboardData()` con la misma forma que tendrán las Actions, para sustituir la fuente luego **sin tocar la UI**.
- **Reglas de dominio puras** reutilizables en `src/lib/domain/`: `estaEnMora`, `saldoPendiente`, `mesesEnMora`; formateo de dinero `fmt`/`fmtShort` en `src/lib/format.ts`. Consumidas por la mock. Nomenclatura **SUB 4–16** tal cual el prototipo.
- **`admin.css`**: tokens del DS (colores navy/gold/blue, neutrales, radius, shadows), utilidades (`.eyebrow`, `.font-display`, `.tabular`, `.bg-pitch-lines`) y **breakpoints/clases de layout responsive**, todo **re-declarado bajo `.admin-app`** → aislado del sitio público y viceversa.
- **SEO/privacidad:** `sitemap({ filter: (p) => !p.includes('/admin') })` en `astro.config.mjs`; disallow `/admin` en `robots.txt` (si existe).

### Responsive (mobile-first + adaptativo en desktop)

- **Mobile-first:** base diseñada a ~360–420px; unidades relativas, `100dvh` y `env(safe-area-inset-*)`; **cero scroll horizontal** a cualquier ancho; grids que se reflujan (`minmax`/`auto-fit`) en vez de anchos fijos. El chrome y la pantalla se prueban de 320px hasta desktop.
- **Navegación responsive `AdminNav`:** **tab bar inferior** con FAB dorado central en mobile; en desktop (≥ `1024px`) muta a **sidebar lateral fija** con las 4 secciones + logo del club arriba.
- **Shell adaptativo `AdminShell`:** mobile = columna full-height con header sticky + tab bar; desktop = `sidebar | contenido` (grid), header inline en la columna de contenido, contenido a mayor ancho con `max-width` (~880px) para no estirarse.
- **Dashboard reflúido:** KPIs **2 columnas en mobile → 4 en desktop**; hero, cobros pendientes, cumpleaños y entreno usan grids `auto-fit/minmax`.
- **Decisión técnica:** los inline styles del prototipo **no soportan media queries**, así que el layout que cambia por viewport vive en **clases de `admin.css`** (scopeadas bajo `.admin-app`, con media queries/`clamp()`); los inline styles se conservan solo para detalle visual fijo (colores, radios, spacing puntual).

**Fuera del alcance (otros specs):**

- Autenticación completa (Better Auth, `middleware.ts`, `/admin/login`, sesión, gate). `/admin` queda **sin protección** por ahora.
- Base de datos (Neon/Drizzle), repos, services, Actions reales, seed desde Excel.
- Resto de pantallas reales: Alumnos, Ficha, FormAlumno, **Cartera**, RegistrarPago, Uniformes, Entrenamientos, Profesores, Más (solo placeholders).
- BottomSheets funcionales (registrar pago, nuevo alumno, apariencia), recibo por WhatsApp, notificaciones.
- App del profesor (`ProfesorApp`).
- Persistencia de preferencias (carteraMode/showAmounts) — depende de Cartera.

---

## Modelo de datos

No hay persistencia nueva (sin BD todavía). Se introducen **tipos TS** que espejan `window.MOCK` y que luego cumplirán las Actions. Nomenclatura **SUB 4–16** tal cual el prototipo, marcada como ilustrativa.

### Tipos (`src/features/admin/data/types.ts`)

```ts
export type EstadoMes = 'paid' | 'due' | 'pending' | 'na';

export interface Alumno {
  id: number;
  name: string;
  cat: string;            // "SUB 10"
  anio: number;           // año de nacimiento
  doc: string;
  acu: string;            // acudiente
  phone: string;          // "301 521 6830"
  dir: string;
  desde: string;          // "Feb 2024"
  cuota: number;          // COP
  hermanos: number;
  uniforme: 'entregado' | 'pendiente';
  uniformePago: 'pagado' | 'pendiente';
  numero: number | null;
  tipoKit: 'AZUL' | 'DORADO' | null;
  talla: string;
  states: EstadoMes[];    // 11 meses FEB..DIC
}

export interface Cumple { name: string; cat: string; fecha: string; dias: number; }
export interface Training { day: string; cat: string; focus: string; coach: string; time: string; }

export interface Stats {
  active: number; upToDate: number; morosos: number; pctUpToDate: number;
  recaudo: number; recaudoMes: number; carteraVencida: number;
  metaMes: number; pctMeta: number;
}
```

### Forma que consume el Dashboard (`useDashboardData()` → contrato estable)

Es la interfaz que luego servirán las Actions **sin tocar la UI**:

```ts
interface DashboardData {
  stats: Stats;
  morosos: Alumno[];                        // top 4 por saldo desc
  monthly: { m: string; total: number }[];  // recaudo por mes hasta el mes vivo
  cumple: Cumple[];
  entrenoHoy: Training[];
  meses: string[]; mesesLong: string[]; mesVivo: number; // CURRENT
}
```

### Reglas puras reutilizables

- `src/lib/domain/`: `estaEnMora(a)`, `saldoPendiente(a)`, `mesesEnMora(a)` — funciones puras testeables (las reusará la cartera real después).
- `src/lib/format.ts`: `fmt(n)` → `$45.000`, `fmtShort(n)` → `$4.82M` (formato `es-CO`).

---

## Plan de implementación

Cada bloque deja `npm run dev` y `npm run build` en verde y el **marketing intacto**.

### Bloque A — Fundaciones (ruta + tokens + layout)

1. `src/features/admin/admin.css`: portar tokens del DS (colores, radius, shadows, tipografías ya instaladas), utilidades (`.eyebrow`, `.font-display`, `.tabular`, `.bg-pitch-lines`) y **breakpoints/clases de layout responsive**, todo re-declarado bajo `.admin-app`.
2. `src/layouts/AdminLayout.astro`: `<meta name="robots" content="noindex">`, carga `admin.css`, envuelve en `.admin-app`, `100dvh` + safe-area.
3. `src/pages/admin/index.astro`: `export const prerender = false`; monta `AdminApp client:only="react"`.
4. `astro.config.mjs`: `sitemap({ filter: (p) => !p.includes('/admin') })`; disallow `/admin` en `robots.txt` (si existe).

*Verifica:* `/admin` carga (placeholder), marketing sin cambios, `build` sigue estático.

### Bloque B — Chrome responsive

5. `chrome/Icon.tsx`: wrapper tipado sobre `lucide-react` (reemplaza `data-lucide`).
6. `ui/`: `Avatar`, `Badge`, `Card`, `KpiCard` (los que usa Dashboard).
7. `chrome/`: `AppHeader`, `IconButton`, `SectionLabel`, **`AdminNav`** (tab bar inferior en mobile ↔ sidebar en desktop vía clases de `admin.css`) y **`AdminShell`** (compone header + nav + `<main>` con reflow y `max-width` de contenido).
8. `features/admin/AdminApp.tsx`: router interno por estado con las 4 tabs; `dashboard` real, las otras 3 con placeholder "Próximamente"; FAB dorado → placeholder.

*Verifica:* navegación entre tabs; shell muta de columna mobile a sidebar desktop; cero scroll horizontal 320px→desktop.

### Bloque C — Datos + Dashboard

9. `src/lib/format.ts` (`fmt`/`fmtShort`) y `src/lib/domain/*` (`estaEnMora`, `saldoPendiente`, `mesesEnMora`).
10. `features/admin/data/types.ts` + `data/mock.ts`: portar `window.MOCK` a TS tipado, stats derivadas, comentario de "datos ilustrativos".
11. `features/admin/hooks/useDashboardData.ts`: arma `DashboardData` desde la mock (contrato estable para Actions futuras).
12. `features/admin/screens/dashboard/`: `Dashboard.tsx` (índice) + `HeroRecaudo`, `KpisGrid` (2 cols mobile → 4 desktop), `RecaudoPorMes`, `CobrosPendientes`, `ProximosCumples`, `EntrenoDeHoy` — cada archivo < 200 líneas, grids `auto-fit/minmax`.

*Verifica:* Dashboard completo con mock, responsive real, cifras coherentes con las reglas de dominio.

### Bloque D — Cierre

13. Verificación final: `build` estático OK, `/admin` funcional y `noindex`, sitemap sin `/admin`, ningún archivo > 200 líneas, cero `any`.

---

## Criterios de aceptación

### Ruta y aislamiento
- [ ] `/admin` carga la isla React (`client:only`), renderiza Dashboard y es `noindex` (meta + `robots.txt` + fuera del `sitemap.xml`).
- [ ] `npm run build` sigue **estático**: las páginas de marketing quedan prerenderizadas; solo `/admin` es función on-demand. Ninguna página pública cambia de output ni de estilos.
- [ ] Los tokens del admin viven bajo `.admin-app`: el sitio público no hereda ni un color ni una fuente del DS admin, y viceversa.

### Responsive (mobile-first + adaptativo)
- [ ] De 320px a desktop: **cero scroll horizontal** en cualquier ancho.
- [ ] Mobile: header sticky + **tab bar inferior** con FAB dorado; `100dvh` y safe-area respetados.
- [ ] Desktop (≥1024px): la tab bar muta a **sidebar lateral fija**; los KPIs pasan de 2 a 4 columnas; el contenido respeta un `max-width` (no se estira).
- [ ] La navegación entre las 4 tabs funciona; `dashboard` es real, las otras 3 muestran "Próximamente"; el FAB abre un placeholder.

### Dashboard con datos
- [ ] Se ven las 6 secciones: hero de recaudo del mes (con % de meta y cartera vencida), KPIs 2×2/1×4, barras de recaudo por mes, cobros pendientes (top 4 morosos con botón WhatsApp), próximos cumpleaños y entreno de hoy.
- [ ] Las cifras derivan de `src/lib/domain/*` (`estaEnMora`, `saldoPendiente`, `mesesEnMora`) y `format.ts`, no de números hardcodeados en la UI.
- [ ] Cambiar la fuente de datos implicaría tocar **solo** `useDashboardData.ts` (la mock cumple el mismo contrato que tendrán las Actions); los componentes de pantalla no se tocarían.

### Calidad
- [ ] Ningún archivo supera **200 líneas**; cero `any`; sin lógica de negocio dentro de componentes.
- [ ] La mock queda marcada como **datos ilustrativos** (comentario), no registros reales.
- [ ] No se agregan dependencias nuevas (todo con lo ya instalado: React 19, `@astrojs/react`, `lucide-react`, fontsource).

---

## Decisiones

- **Sí:** empezar por **Dashboard**. *Por qué:* es la landing del router, ejercita casi todos los primitivos del DS (valida el porte de tokens) y es read-only → menos scope creep.
- **Sí:** **shell mínimo completo** (isla + router de tabs + chrome + mock adapter) junto a la pantalla. *Por qué:* renderizar una pantalla con el feel real ya exige header + nav; hacerlo suelto obligaría a rehacerlo.
- **Sí:** **diferir toda la auth y la BD**. *Por qué:* mantiene el spec en "una pantalla con mock"; auth y datos reales son piezas grandes con su propio spec.
- **Sí:** **mock-first tras `useDashboardData()`** con el mismo contrato que las Actions. *Por qué:* la Fase 5 cambia la fuente sin tocar la UI (patrón de `ARCHITECTURE.md §5`).
- **Sí:** **nomenclatura SUB 4–16** de la mock. *Por qué:* fidelidad al prototipo y al DS (el admin usa SUB; el sitio público usa Baby/Pony…); el mapeo entre ambas se resuelve en la capa de datos real, no aquí.
- **Sí:** **layout que cambia por viewport en clases de `admin.css`**, no en inline styles. *Por qué:* los inline styles no soportan media queries; se conservan inline solo los detalles visuales fijos.
- **Sí:** **AdminNav responsive** (tab bar ↔ sidebar) en vez del `TabBar` fijo del prototipo. *Por qué:* la decisión de desktop adaptativo lo exige.
- **No:** marco iPhone ni `Stage` de escalado del prototipo. *Por qué:* eran andamiaje de demo; la app real es responsive nativa (`ARCHITECTURE.md §6`).
- **No:** BottomSheets funcionales, Cartera, forms, recibo WhatsApp real. *Por qué:* fuera del alcance de "una pantalla".

---

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| Agregar `/admin` con `prerender=false` rompe el build estático del marketing. | Mantener `output` por defecto; solo `/admin` opta a server. Criterio de aceptación verifica build estático + marketing intacto. |
| Los tokens del DS "se escapan" y contaminan el sitio público (o al revés). | Todo scopeado bajo `.admin-app`; `admin.css` solo se carga en `AdminLayout`. Criterio explícito de aislamiento. |
| Portar inline styles del prototipo a un shell responsive infla archivos > 200 líneas. | Descomponer Dashboard en 6 sub-componentes y separar chrome/ui/screens desde el inicio. |
| `/admin` sin auth queda accesible en producción. | `noindex` + disallow en robots + sin enlaces entrantes; **la protección real es requisito bloqueante del siguiente spec** antes de exponer datos sensibles (aquí solo hay mock). |
| El contrato de `useDashboardData` no calza con las Actions futuras y obliga a reescribir la UI. | Modelar `DashboardData` desde la forma que ya sugiere `ARCHITECTURE.md §5` (stats + listas derivadas), no desde la mock cruda. |
| `client:only="react"` deja la pantalla en blanco si falla la hidratación. | Estado de carga mínimo en `AdminApp`; probar en `dev` y en `preview` del build. |
