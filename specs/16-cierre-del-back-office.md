# SPEC 16 — Cierre del back-office: enforcement de código limpio, identidad del club, montos ocultables y refresco del Dashboard

> **Estado:** Propuesto · **Depende de:** SPEC 03 (shell del admin y pantalla "Más"), SPEC 04 (sesión y roles que hoy pinta "Más"), SPEC 06 (`useVistaCartera`, el patrón de preferencia persistida que aquí se generaliza), SPEC 09 (app del entrenador, que comparte la pantalla "Más" y **no ve dinero**), SPEC 14 (retiro de alumnos — de ahí sale la DT-2), SPEC 15 (catálogo único, último spec cerrado) · **Fecha:** 2026-08-07
> **Objetivo:** Cerrar los **cuatro pendientes que le quedan al back-office** en un solo spec, porque ninguno justifica uno propio y los cuatro son de la misma naturaleza (nada de modelo de datos, nada de negocio nuevo): instalar el **enforcement automático** de las reglas de código limpio que hoy se verifican a mano, publicar la **identidad y el contacto del club** en la pantalla "Más", agregar el **toggle de mostrar/ocultar montos** que le falta a la apariencia persistida, y hacer que el **Dashboard revalide** al volver a Inicio.

---

## Por qué existe este spec

Después del spec 15 el back-office está funcionalmente completo. Lo que queda son cuatro cabos sueltos, todos anotados en `docs/backlog.md`:

| # | Pendiente | Prioridad | Estado hoy |
| --- | --- | --- | --- |
| 1 | **HU-0.2** · Enforcement de código limpio | `Must` | ☐ — **el último enabler abierto del EPIC 0** |
| 2 | **HU-7.1** · Identidad y contacto del club en "Más" | `Could` | ☐ |
| 3 | **HU-7.2** · Apariencia persistida — falta el toggle de montos | `Should` | ◐ (la vista Tarjetas/Matriz ya persiste) |
| 4 | **DT-2** · El Dashboard no refresca tras retirar/reactivar | `Could` | ☐ (deuda del spec 14) |

Se agrupan porque comparten tres cosas: **cero migración**, **cero regla de negocio nueva** y un alcance de UI acotado. Separarlos daría cuatro specs de una página cada uno.

### El caso de HU-0.2 en concreto

`.claude/rules/coding-rules.md` define límites numéricos (200 líneas por archivo, 60 por función, complejidad 10, cero `any`, orden de imports) y dice explícitamente que **hoy no hay tooling que los haga cumplir**: solo existe `npm run check` = `astro check`. Cada spec desde el 11 los ha verificado **contando líneas a mano** en el bloque de cierre. Eso funcionó mientras el repo crecía spec a spec con una sola persona; no es una garantía, es una costumbre.

Y hay una decisión que el propio archivo de reglas dejó abierta (sección *"Alcance del linter (decisión pendiente)"*): si las reglas estructurales se **scopean** a `src/features/admin/**`, `src/lib/**` y `src/actions/**`, o se aplican **globalmente** limpiando el marketing de a poco. Este spec la resuelve con números, no con intuición — ver la sección siguiente.

### Las otras tres, en una línea cada una

- **HU-7.1** — "Más" del admin hoy muestra solo la sesión activa y tres accesos. La del entrenador (`MasEntrenador.tsx:67-85`) **ya tiene** una tarjeta "Sede y horario" leyendo `LOCATION` de `src/lib/site.ts`. Falta la identidad del club (logo, WhatsApp, Instagram, directores) y falta unificarla entre los dos roles.
- **HU-7.2** — `useVistaCartera` (spec 06) resolvió la mitad de la HU. La otra mitad, ocultar montos, no existe. El caso de uso es concreto y móvil: Camilo abre la cartera con un acudiente al lado.
- **DT-2** — bug de ubicación de un hook, no de datos: `useDashboardData()` se llama en `AdminHome` (`AdminApp.tsx:46`), que **nunca se desmonta**, así que su `useEffect` de carga corre una sola vez por sesión.

---

## Decisión mayor: alcance del linter (resuelta con medición)

`coding-rules.md` supone que *"el sitio de marketing existente podría tener violaciones (p.ej. `ContactForm.tsx`)"* y que las reglas estructurales *"están pensadas para el código nuevo del admin"*. **Medido contra el código real del 2026-08-07, la premisa está al revés.**

### Lo que se midió

Conteo sobre los 244 archivos `.ts` / `.tsx` / `.astro` de `src/`, con el mismo criterio que declara la regla (`skipBlankLines` + `skipComments`):

| Regla | Violaciones hoy | Detalle |
| --- | --- | --- |
| `max-lines: 200` | **0** | El archivo más grande es `src/lib/services/alumnos.ts`: **203 crudas / 167 efectivas**. Ninguno más pasa de 190 crudas. |
| `@typescript-eslint/no-explicit-any` | **0** | La única aparición de la palabra en todo `src/` es un comentario de `lib/db/repos/usuarios.ts:16` que dice *"tipado sin `any`"*. |
| `max-lines-per-function: 60` | **37** | **33 en `src/features/admin/**` · 4 fuera** (`ContactForm.tsx` 154, `GalleryLightbox.tsx` 138, `HeroHeadline.tsx` 98, `HeroTicket.tsx` 86). |
| ↳ de esas 37, en `.ts` (lógica pura) | **3** | `ui/useZoomPan.ts` (101), `screens/sesion/useSesion.ts` (97), `screens/alumno-form/useAlumnoForm.ts` (71). |
| ↳ de esas 37, en `.tsx` (componentes) | **34** | Peores: `AdminApp.tsx` `AdminHome` (121), `EquipoScreen.tsx` (107), `SesionRow.tsx` (104), `VisorImagen.tsx` (103), `HojaAbono.tsx` (101). |
| `complexity`, `max-depth`, `max-params`, `import-x/order` | **sin medir** | Requieren ESLint corriendo; se inventarían en el Bloque A (ver plan). |

### Qué se concluye

1. **Scopear por directorio no sirve para nada.** Las dos reglas que definen el contrato del proyecto (`max-lines: 200` y `no-explicit-any`) tienen **cero violaciones en todo el repo**, marketing incluido: aplicarlas globalmente cuesta **cero**. Y la única regla que sí muerde (`max-lines-per-function`) tiene **33 de sus 37 violaciones dentro del admin** — o sea que el scope propuesto en `coding-rules.md` habría metido en scope justo lo que duele y dejado afuera lo que ya pasa.
2. **El eje correcto es el tipo de archivo, no la carpeta.** 34 de las 37 violaciones son cuerpos de **componentes JSX**. Un componente React no es una función imperativa: su `return` es un árbol de markup, y este repo decidió a propósito (`docs/ARCHITECTURE.md` §6) **conservar los estilos inline del prototipo** para fidelidad pixel-perfect. Eso infla el conteo de líneas sin agregar una sola rama de lógica. Partir `EquipoScreen` en tres sub-componentes de 35 líneas para complacer a un contador produciría peor código: más archivos, más prop-drilling, misma complejidad.
3. **Para un archivo `.tsx` de un componente, `max-lines` y `max-lines-per-function` miden lo mismo.** La convención del repo es **un componente por archivo**; el tope real del componente ya es el `max-lines: 200` del archivo. Y el guardián de "esta función hace demasiado" no es el largo, es `complexity: 10`, que sí queda activo.

### Recomendación

**Alcance global** (todo `src/` y `scripts/`), **calibrado por regla y por tipo de archivo**:

| Regla | Alcance | Severidad | Costo hoy |
| --- | --- | --- | --- |
| `max-lines: 200` (skip blancos + comentarios) | global | `error` | 0 violaciones |
| `@typescript-eslint/no-explicit-any` | global | `error` | 0 violaciones |
| `import-x/no-duplicates` · `import-x/order` | global | `error` | autofixables con `--fix` |
| `complexity: 10` · `max-depth: 3` · `max-params: 4` | global | `error` | por medir (Bloque A) |
| `max-lines-per-function: 60` | **solo `.ts` / `.mjs`** | `error` | **3** violaciones → se arreglan en este spec |
| `max-lines-per-function` | **off en `.tsx` / `.astro`** | — | cubierto por `max-lines: 200` + `complexity: 10` |

Las 3 violaciones `.ts` **sí se arreglan** (son hooks con lógica real: extraer helpers, no partir markup). Las 34 de JSX **no se tocan**: la regla deja de aplicarles porque nunca fue para ellas.

> **Consecuencia documental:** `.claude/rules/coding-rules.md` §5 ("Alcance del linter — decisión pendiente") se reemplaza por esta decisión, y §2 gana la fila del override de `.tsx`. La tabla de dependencias de esa sección también está desactualizada: dice `eslint-plugin-astro@^1.7` y hoy la línea vigente es **3.1.0**.

---

## Alcance

**Dentro:**

- **Tooling** (raíz): `eslint.config.js` (flat config), `.prettierrc`, `.gitattributes`, `.git-blame-ignore-revs`; scripts `lint`, `typecheck`, `format`, `format:check` y `check` en `package.json`. Dependencias dev: `eslint`, `typescript-eslint`, `eslint-plugin-astro`, `eslint-plugin-import-x`, `@eslint/js`.
- **Refactor mínimo por linter**: las 3 funciones `.ts` que pasan de 60 líneas efectivas (`useZoomPan`, `useSesion`, `useAlumnoForm`) + lo que aparezca en el inventario del Bloque A.
- **Formato**: una pasada de Prettier sobre todo el repo, en **un commit dedicado sin cambios funcionales**.
- **Identidad del club en "Más"** (HU-7.1): componente nuevo `screens/mas/TarjetaClub.tsx` con logo + nombre legal, y accesos a **WhatsApp**, **sede** e **Instagram**, más la fila de **directores técnicos**. Consumido por `MasMenu` (admin) **y** `MasEntrenador` (entrenador). `InfoRow` se extrae de `MasEntrenador.tsx` a `screens/mas/InfoRow.tsx` para no duplicarlo.
- **Toggle de montos** (HU-7.2): hook `usePreferenciaLocal` (generaliza el patrón de `useVistaCartera`, R7.2) + `useMontosVisibles` + primitivo `ui/Monto.tsx`; interruptor en "Más" y botón de ojo en la cabecera de Cartera. Enmascara los montos de **Dashboard, Cartera y Ficha**.
- **Revalidación del Dashboard** (DT-2): `AdminHome` vuelve a pedir `dashboard.stats` cuando la vista activa pasa a `dashboard`, conservando los datos previos en pantalla mientras revalida (sin parpadeo).
- **Docs**: `.claude/rules/coding-rules.md` (decisión de alcance + versiones), `docs/ARCHITECTURE.md` §9, `docs/backlog.md` (HU-0.2, HU-7.1, HU-7.2 y DT-2 a ☑, **más la corrección de los datos falsos de HU-7.1**, ver Riesgos), `CLAUDE.md` (scripts nuevos).

**Fuera del alcance (otros specs):**

- **HU-7.3** (gestionar tarifas/cuotas) y **HU-8.2** (exportar cartera) — las dos HU que siguen abiertas después de este spec; cada una la suya.
- **Husky / lint-staged / pre-commit** — `coding-rules.md` lo marca como opcional; sin CI de por medio, agrega fricción antes de que la config esté rodada. Candidato a un follow-up de una línea.
- **ESLint en CI (GitHub Actions / Vercel build)** — hoy el deploy no corre `check`; conectarlo es otra decisión (y otro riesgo de romper deploys).
- **Reglas de accesibilidad** (`eslint-plugin-jsx-a11y`) — la deuda de a11y 90 en la landing quedó anotada en el spec 15 y es un problema de contraste y `aria-label`, no de lint.
- **Refactorizar los 34 componentes JSX de más de 60 líneas** — la decisión de arriba es explícitamente **no hacerlo**.
- **Ocultar montos en el flujo de Registrar pago, en `HojaAbono` y en `AvisoHermano`** — ver Decisiones: son pantallas transaccionales.
- **PIN / desbloqueo por biometría** para revelar los montos — el toggle es una comodidad visual, no un control de seguridad.
- **Mapa embebido / link a Google Maps** en la tarjeta del club — falta el dato (ver Pendientes del cliente).
- Cualquier **migración de schema** o cambio de reglas de negocio.

---

## Modelo de datos

**No toca la base.** Cero tablas, cero columnas, cero migraciones, cero Actions nuevas.

Lo único que persiste es una **preferencia de UI local**, en `localStorage`, siguiendo la convención de clave que ya existe (`chuter.admin.*`):

| Clave | Valores | Por defecto | Origen |
| --- | --- | --- | --- |
| `chuter.admin.carteraVista` | `'tarjetas'` \| `'matriz'` | `'tarjetas'` | ya existe (spec 06) |
| `chuter.admin.montosVisibles` | `'si'` \| `'no'` | `'si'` | **nuevo** |

Contratos nuevos (solo firmas):

```ts
// src/features/admin/hooks/usePreferenciaLocal.ts  (nuevo)
// Store mínimo sobre localStorage, compartido entre consumidores vía
// useSyncExternalStore: cambiar la preferencia en un lugar re-renderiza a todos.
usePreferenciaLocal<T extends string>(
  clave: string,
  valores: readonly T[],
  porDefecto: T,
): [T, (valor: T) => void];

// src/features/admin/hooks/useVistaCartera.ts  (se reescribe sobre el anterior)
useVistaCartera(): [VistaCartera, (v: VistaCartera) => void];   // firma intacta

// src/features/admin/hooks/useMontosVisibles.ts  (nuevo)
useMontosVisibles(): [boolean, (visible: boolean) => void];

// src/features/admin/ui/Monto.tsx  (nuevo)
<Monto valor={number} corto?={boolean} />   // fmt/fmtShort, o '$•••' si están ocultos
```

`src/lib/format.ts` (`fmt`, `fmtShort`) **no cambia**: sigue siendo el único formateador de COP del repo y `<Monto>` lo envuelve. Los usos de `fmt` que **no** pasan por `<Monto>` (el recibo de WhatsApp en `ExitoPago.tsx:22`, el total de `ResumenPago`, `HojaAbono` y `AvisoHermano`) quedan intactos a propósito.

> **Por qué `useSyncExternalStore` y no copiar `useVistaCartera` tal cual:** `useVistaCartera` funciona con `useState(lector)` porque tiene **un solo consumidor** (`Cartera.tsx:26`). Los montos tienen ~7 consumidores repartidos en tres pantallas y **dos** interruptores (Más y Cartera); con estado local por componente, tocar el ojo en Cartera no actualizaría la tarjeta de al lado. `usePreferenciaLocal` conserva todo lo que define el patrón actual — clave namespaced, lectura defensiva con caída al valor por defecto, tupla estilo `useState` — y solo cambia el mecanismo de suscripción. `useVistaCartera` se reescribe **encima** de él (misma firma, mismos call sites) para que quede **un** patrón y no dos.

---

## Plan de implementación

Cada bloque deja `npm run check` y `npm run build` en verde, el marketing prerenderizado intacto y el admin funcional.

### Bloque A — ESLint: instalar, inventariar y decidir

1. Instalar dev: `eslint@10`, `@eslint/js@10`, `typescript-eslint@8`, `eslint-plugin-astro@3`, `eslint-plugin-import-x@4` (versiones vigentes verificadas 2026-08-07; `coding-rules.md` todavía dice `eslint-plugin-astro@^1.7`, corregir).
2. Escribir `eslint.config.js` partiendo del esquema ya propuesto en `coding-rules.md` §5, con estos ajustes:

```js
export default tseslint.config(
  { ignores: ['dist/', '.astro/', '.vercel/', 'drizzle/', 'src/components/ui/**'] },
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...astro.configs.recommended,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    plugins: { 'import-x': importX },
    rules: {
      'max-lines': ['error', { max: 200, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': ['error', { max: 60, skipBlankLines: true, skipComments: true }],
      complexity: ['error', 10],
      'max-depth': ['error', 3],
      'max-params': ['error', 4],
      '@typescript-eslint/no-explicit-any': 'error',
      'import-x/no-duplicates': 'error',
      'import-x/order': ['error', {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'type'],
        pathGroups: [{ pattern: '@/**', group: 'internal' }],
        'newlines-between': 'always',
      }],
    },
  },
  // El cuerpo de un componente es un árbol de markup, no una función: lo acota
  // `max-lines: 200` (un componente por archivo) + `complexity: 10`.
  { files: ['**/*.tsx', '**/*.astro'], rules: { 'max-lines-per-function': 'off' } },
  { files: ['src/lib/db/schema/**'], rules: { 'max-lines-per-function': 'off' } },
  // Scripts de mantenimiento: Node puro, fuera del proyecto TS.
  { files: ['scripts/**'], extends: [tseslint.configs.disableTypeChecked] },
);
```

3. **`ignores`:** `src/components/ui/**` queda fuera porque es código generado por shadcn y `CLAUDE.md` dice explícitamente *"no tocar manualmente"*.
4. **Correr `npx eslint .` y anotar el inventario en este spec** (conteo por regla). El grupo `strictTypeChecked` es el riesgo real: sobre un repo que nunca pasó por linter, reglas como `no-floating-promises`, `no-unnecessary-condition` o `restrict-template-expressions` pueden disparar decenas de hallazgos.
   **Regla de corte:** si `strictTypeChecked` deja **más de ~40 hallazgos**, se baja a `recommendedTypeChecked`, se cierra en verde, y la promoción a `strictTypeChecked` queda anotada como deuda con el número medido. Si son menos, se arreglan acá.
5. Correr `npx eslint . --fix` para `import-x/order` y demás autofixables, y revisar el diff **archivo por archivo** (nunca `git add .`).

_Verifica:_ `npx eslint .` sale en verde; ninguna regla quedó silenciada con `eslint-disable` sin comentario que justifique.

### Bloque B — Las 3 funciones `.ts` que pasan de 60 líneas

6. `src/features/admin/ui/useZoomPan.ts` (101 efectivas) — extraer los cálculos de límites/gestos a helpers puros del mismo archivo o a `ui/zoom-pan.ts`.
7. `src/features/admin/screens/sesion/useSesion.ts` (97) — separar la carga de la sesión del guardado (dos funciones internas).
8. `src/features/admin/screens/alumno-form/useAlumnoForm.ts` (71) — extraer la construcción del payload / validación local.

_Verifica:_ ninguna función `.ts` pasa de 60 efectivas; el zoom del visor, la sesión del entrenador y el alta/edición de alumno siguen funcionando igual (revisión manual en `npm run dev`).

### Bloque C — Prettier y normalización de finales de línea

9. `.prettierrc` mínimo (el resto son defaults de Prettier 3, que ya coinciden con el repo):

```json
{ "singleQuote": true, "plugins": ["prettier-plugin-astro", "prettier-plugin-tailwindcss"] }
```

10. `.gitattributes` con `* text=auto eol=lf`. **Medido:** hoy los archivos están en disco con **CRLF**; con el `endOfLine: 'lf'` por defecto de Prettier, **239 de los 244** archivos cambian, de los cuales **114 son solo finales de línea** y **125 tienen deriva real de formato**. Normalizar a LF es lo correcto para un repo que compila y despliega en Linux (Vercel).
11. Correr `npx prettier --write .` en **un commit dedicado y exclusivo** (`💄 style: aplicar Prettier y normalizar finales de línea a LF`), sin ningún cambio funcional mezclado.
12. Registrar ese commit en `.git-blame-ignore-revs` para que `git blame` siga siendo útil.

_Verifica:_ `npm run build` y `npm run check` dan el mismo resultado antes y después del commit de formato; `git diff --stat` del commit siguiente vuelve a ser pequeño.

### Bloque D — Scripts y documentación del tooling

13. `package.json`:

```json
"lint": "eslint .",
"typecheck": "astro check",
"format": "prettier --write .",
"format:check": "prettier --check .",
"check": "astro check && eslint ."
```

14. `docs/ARCHITECTURE.md` §9: `npm run lint` deja de ser aspiracional. `CLAUDE.md`: agregar los scripts nuevos. `.claude/rules/coding-rules.md`: reemplazar §5 *"Alcance del linter (decisión pendiente)"* por la decisión de este spec, actualizar versiones y agregar el override de `.tsx` a la tabla de §2.

_Verifica:_ `npm run check` corre las dos herramientas y falla si cualquiera falla; ninguna doc sigue describiendo el linter como pendiente.

### Bloque E — HU-7.1: identidad y contacto del club en "Más"

15. Extraer `InfoRow` de `MasEntrenador.tsx:109-148` a `screens/mas/InfoRow.tsx` (hoy es privado de ese archivo y lo va a necesitar la tarjeta nueva).
16. Crear `screens/mas/TarjetaClub.tsx`, **sin un solo dato escrito a mano** — todo sale de `src/lib/site.ts` y `src/lib/whatsapp.ts`:
    - Cabecera: `/images/chuter-logo.svg` (el mismo que ya usa `chrome/AdminNav.tsx:28`) + `SITE.legalName` + `SITE.tagline`.
    - `InfoRow` **WhatsApp** → `whatsappURL('Hola Chuter FC')` (o `WA_FAB`), subtítulo `CONTACT.phoneDisplay`.
    - `InfoRow` **Sede** → `LOCATION.venue`, subtítulo `${LOCATION.neighborhood} · INDER`, con `LOCATION.secondaryVenue` como cancha alterna.
    - `InfoRow` **Horario** → `SCHEDULE.daysHuman` / `SCHEDULE.hoursHuman` (**hoy `MasEntrenador.tsx:84` los tiene hardcodeados** como `"Lun · Mié · Vie"` / `"4:30 – 6:00 PM"`, contra la regla de `CLAUDE.md` de no hardcodear textos — se corrige de paso).
    - `InfoRow` **Instagram** → `CONTACT.instagramUrl` / `CONTACT.instagramHandle`.
    - Bloque **Directores técnicos**: las dos entradas de `COACHES` (nombre, rol e Instagram), con `Avatar` del DS.
17. Montar `<TarjetaClub />` en `MasMenu.tsx` (admin) y en `MasEntrenador.tsx` (entrenador), reemplazando en este último su bloque "Sede y horario" para no duplicarlo.

_Verifica:_ los dos roles ven la misma tarjeta; los enlaces abren WhatsApp con mensaje precargado e Instagram del club y de cada director; ni `MasMenu.tsx` ni `MasEntrenador.tsx` pasan de 200 líneas.

### Bloque F — HU-7.2: toggle de mostrar/ocultar montos

18. `hooks/usePreferenciaLocal.ts` (nuevo, ~40 líneas): store sobre `localStorage` + `useSyncExternalStore`, lectura defensiva contra la lista de valores válidos.
19. Reescribir `hooks/useVistaCartera.ts` sobre él — **misma firma exportada**, `Cartera.tsx` no se toca. Agregar `hooks/useMontosVisibles.ts`.
20. `ui/Monto.tsx`: `<Monto valor corto? />` → `fmt`/`fmtShort` cuando están visibles, `'$•••'` cuando no, con `aria-label="Monto oculto"` y `title` para lectores de pantalla.
21. Reemplazar `fmt`/`fmtShort` por `<Monto>` en las **6 superficies de lectura**: `dashboard/HeroRecaudo.tsx` (recaudo del mes, meta, cartera vencida), `dashboard/KpisGrid.tsx` (Recaudo año), `dashboard/CobrosPendientes.tsx` (saldo por moroso), `cartera/CabeceraTotales.tsx` (recaudado año + cartera vencida), `cartera/TarjetaAlumno.tsx` (cuota/mes + badge de saldo), `ficha/UniformeTab.tsx` (saldo por kit).
22. Interruptores: fila con switch **"Mostrar montos"** en "Más", y un `IconButton` de ojo (`eye` / `eye-off`) en la cabecera de Cartera, junto a `ToggleVista`.
    **Registrar los iconos nuevos** en `chrome/Icon.tsx` (registro tipado kebab-case → `lucide-react`): hoy no están `eye` ni `eye-off`, y el Bloque E también necesita `instagram`.

_Verifica:_ ocultar en Cartera actualiza la cabecera **y** las tarjetas en el mismo render; navegar a Inicio y a una Ficha los mantiene ocultos; recargar la página los mantiene ocultos; volver a mostrarlos revierte todo.

### Bloque G — DT-2: revalidación del Dashboard

23. En `AdminApp.tsx`, `AdminHome` vuelve a llamar `recargar()` cuando `ruta.vista` pasa a `'dashboard'`:

```ts
useEffect(() => {
  if (ruta.vista === 'dashboard') void recargar();
}, [ruta.vista, recargar]);
```

24. Confirmar que **no hay parpadeo**: `recargar` pone `estado = 'cargando'` pero **no limpia `data`**, y el render de `AdminApp.tsx:66-78` muestra `<EstadoCarga>` solo cuando `data` es `null`. Es decir, la primera carga muestra el spinner y las revalidaciones posteriores mantienen los KPIs anteriores hasta que llegan los nuevos.

_Verifica:_ retirar un alumno desde su ficha y volver a Inicio actualiza "Alumnos activos", "% al día", "En mora", "Cartera vencida" y "Cobros pendientes" **sin recargar la página**; reactivarlo los revierte; registrar un pago también se refleja.

### Bloque H — Docs, backlog y cierre

25. `docs/backlog.md`: HU-0.2, HU-7.1, HU-7.2 y DT-2 a ☑ con su nota de spec; **corregir los datos falsos de HU-7.1** (ver Riesgos) y la mención a "Cancha de la Provincia" en *Notas / pendientes del cliente*; agregar la R7.2 la clave nueva.
26. `npm run check` + `npm run build` en verde; revisión visual con `playwright-cli --headed` de 320px a desktop en Más (los dos roles), Cartera, Inicio y Ficha.

---

## Criterios de aceptación

### Enforcement de código limpio (HU-0.2)

- [ ] Existen `eslint.config.js` y `.prettierrc` en la raíz, y `npm run lint`, `npm run typecheck`, `npm run format:check` y `npm run check` corren desde `package.json`.
- [ ] `npm run check` ejecuta **astro check + eslint** y **falla** si cualquiera de los dos falla (verificado introduciendo a propósito un `any` y un archivo de 210 líneas efectivas, y luego revirtiéndolos).
- [ ] `npx eslint .` sale en **verde**, sin `eslint-disable` sin comentario que lo justifique.
- [ ] `max-lines: 200` y `no-explicit-any` están en `error` **globalmente** (marketing incluido) y no hay ni una violación.
- [ ] `max-lines-per-function: 60` está en `error` para `.ts`/`.mjs` y **desactivado** para `.tsx`/`.astro`, con el porqué escrito como comentario en la config.
- [ ] Las 3 funciones `.ts` que superaban 60 líneas efectivas (`useZoomPan` 101, `useSesion` 97, `useAlumnoForm` 71) quedan por debajo del límite **sin perder comportamiento**.
- [ ] El inventario de la primera corrida (conteo por regla, y si `strictTypeChecked` se mantuvo o se bajó a `recommendedTypeChecked`) queda anotado en este spec al cerrarlo.
- [ ] El commit de Prettier es **exclusivo de formato**: `npm run build` produce el mismo resultado antes y después, y el hash queda en `.git-blame-ignore-revs`.
- [ ] `.claude/rules/coding-rules.md` ya **no** tiene una "decisión pendiente" sobre el alcance del linter y sus versiones de dependencias son las vigentes.

### Identidad y contacto del club (HU-7.1)

- [ ] "Más" muestra una tarjeta con el logo del club y **"Club Deportivo Chuter F.C."**.
- [ ] La tarjeta tiene accesos a **WhatsApp** (`300 872 5964`, con mensaje precargado vía `src/lib/whatsapp.ts`), **sede** (`Cancha Los Algarrobillos`, Los Algarrobillos · INDER, con la cancha alterna `Cancha del 12 de Octubre`), **horario** (Lun/Mié/Vie 4:30–6:00 PM) e **Instagram** (`@1chuter`).
- [ ] Aparecen los **directores técnicos** (Camilo Andrade y Ebed Shaday Calderón) con enlace a su Instagram.
- [ ] **Ningún dato está escrito a mano** en el componente: todos salen de `src/lib/site.ts`. `grep '300 872'` y `grep 'Algarrobillos'` en `src/features/` no devuelven nada.
- [ ] El **horario deja de estar hardcodeado** en `MasEntrenador.tsx` y pasa a leerse de `SCHEDULE`.
- [ ] La tarjeta se ve igual para **admin y entrenador**, y `InfoRow` existe una sola vez en el repo.

### Mostrar / ocultar montos (HU-7.2)

- [ ] Existe un interruptor **"Mostrar montos"** en "Más" y un botón de ojo en la cabecera de **Cartera**; los dos escriben la misma preferencia.
- [ ] Con los montos ocultos, se enmascaran como `$•••`: recaudo del mes, meta, cartera vencida y recaudo del año (Dashboard), saldo de cada moroso (Cobros pendientes), recaudado año y cartera vencida (Cartera), cuota/mes y saldo de cada tarjeta, y el saldo por kit en la Ficha.
- [ ] **No** se ocultan: conteos (alumnos activos, N en mora, N meses), porcentajes, la barra de progreso, los colores de la tira de meses ni la matriz de cartera.
- [ ] **No** se ocultan las pantallas transaccionales: el total de **Registrar pago**, el precio/saldo de **HojaAbono**, el aviso de **descuento de hermano** y el **recibo de WhatsApp** siguen mostrando la cifra siempre.
- [ ] Cambiar el toggle en Cartera actualiza **en el mismo render** la cabecera y todas las tarjetas visibles (sin navegar ni recargar).
- [ ] La preferencia **sobrevive a recargar** la página (`localStorage`, clave `chuter.admin.montosVisibles`) y el valor por defecto es **visible**.
- [ ] `useVistaCartera` conserva su firma y `Cartera.tsx` no cambió su call site; hay **un solo** mecanismo de preferencia local en el repo (`usePreferenciaLocal`).
- [ ] La app del **entrenador sigue sin mostrar ningún monto**, con el toggle en cualquier estado (no-regresión del spec 09).

### Refresco del Dashboard (DT-2)

- [ ] Retirar un alumno desde su ficha y volver a Inicio actualiza **sin recargar la página**: Alumnos activos, % al día, En mora, Cartera vencida y Cobros pendientes.
- [ ] Reactivarlo revierte los mismos indicadores.
- [ ] Registrar un pago y volver a Inicio actualiza recaudo del mes, recaudo del año y la gráfica por mes.
- [ ] **Sin parpadeo:** al volver a Inicio no aparece el spinner de carga — los KPIs previos siguen en pantalla hasta que llegan los nuevos. El spinner solo se ve en la primera carga de la sesión.
- [ ] No hay un bucle de peticiones: volver a Inicio dispara **una** llamada a `dashboard.stats`, no una por render (verificado en la pestaña Red).

### Calidad y no-regresión

- [ ] Ningún archivo supera 200 líneas efectivas; cero `any`; `npm run check` y `npm run build` en verde.
- [ ] Marketing prerenderizado intacto (`prerender = false` solo en `/admin/**` y `/api/**`); `/admin/**` sigue `noindex` y fuera del sitemap.
- [ ] De 320px a desktop: cero scroll horizontal en Más (los dos roles), Inicio, Cartera y Ficha.
- [ ] `docs/backlog.md` marca HU-0.2, HU-7.1, HU-7.2 y DT-2 como ☑ y **ya no contiene el teléfono ni la sede equivocados**.

---

## Decisiones

- **Sí:** **linter global, calibrado por regla y tipo de archivo, no scopeado por directorio.** _Por qué:_ medido, las dos reglas que definen el contrato (`max-lines: 200`, `no-explicit-any`) tienen **0 violaciones en todo el repo** — scopearlas sería regalar cobertura gratis; y la única que muerde tiene **33 de 37** violaciones **dentro** del admin, o sea que el scope propuesto habría dejado afuera justo lo limpio.
- **Sí:** **`max-lines-per-function` desactivado en `.tsx`/`.astro`.** _Por qué:_ 34 de las 37 violaciones son cuerpos JSX; con un componente por archivo, `max-lines: 200` ya es el tope del componente, y `complexity: 10` sigue siendo el guardián real de "esta función hace demasiado". Partir markup para complacer un contador produce peor código, y choca con la decisión explícita de conservar los estilos inline del prototipo (`ARCHITECTURE.md` §6).
- **Sí:** **las 3 funciones `.ts` largas se arreglan, no se exceptúan.** _Por qué:_ son hooks con lógica real (zoom, sesión, formulario) — exactamente lo que la regla existe para acotar. Son 3, es trabajo acotado.
- **Sí:** **inventariar antes de decidir la severidad de `strictTypeChecked`,** con umbral escrito (~40 hallazgos). _Por qué:_ es el único grupo de reglas cuyo costo no se pudo medir sin instalar ESLint; dejar la decisión "a criterio" garantiza que se resuelva mal bajo presión.
- **Sí:** **Prettier en un commit exclusivo + `.gitattributes` a LF + `.git-blame-ignore-revs`.** _Por qué:_ son 239 archivos (114 solo por CRLF→LF). Mezclar eso con cambios funcionales haría el diff irrevisable; aislarlo lo vuelve un commit que se aprueba de un vistazo. LF es lo correcto: el proyecto compila y despliega en Linux.
- **Sí:** **`src/components/ui/**` fuera del linter.** _Por qué:_ es código generado por shadcn y `CLAUDE.md` dice "no tocar manualmente"; lintearlo obligaría a editarlo o a llenarlo de `eslint-disable`.
- **Sí:** **la tarjeta del club se arma 100% desde `src/lib/site.ts`.** _Por qué:_ ya es la fuente única de esos datos para la landing; duplicarlos en el admin es exactamente la clase de divergencia que produjo el dato equivocado que hoy tiene el backlog.
- **Sí:** **la misma tarjeta para admin y entrenador.** _Por qué:_ es identidad del club, no información administrativa: no tiene dinero ni datos de alumnos, así que no hay nada que filtrar por rol. Y evita mantener dos versiones.
- **Sí:** **`usePreferenciaLocal` con `useSyncExternalStore`, y `useVistaCartera` reescrito encima.** _Por qué:_ conserva todo lo que define el patrón del spec 06 (clave `chuter.admin.*`, lectura defensiva, tupla estilo `useState`) y solo arregla su límite real: con `useState` por componente, un toggle no puede sincronizar 7 consumidores en la misma pantalla. Reescribir `useVistaCartera` encima deja **un** patrón, no dos.
- **Sí:** **los montos se ocultan solo en las superficies de lectura (Dashboard, Cartera, Ficha).** _Por qué:_ el caso de uso es "reviso la cartera con alguien al lado". En Registrar pago o en un abono estás **cobrando**: ocultar el total que vas a confirmar es un error esperando ocurrir. Regla de una línea, fácil de verificar.
- **Sí:** **la máscara es `$•••` y no un espacio en blanco.** _Por qué:_ conserva el `$` y el ancho aproximado, así el layout no salta y se entiende que hay un dato oculto, no un dato faltante.
- **Sí:** **el toggle es comodidad visual, no seguridad.** _Por qué:_ el dato ya está en el cliente; quien tenga el teléfono desbloqueado puede volver a mostrarlo con un tap. Se documenta así para que nadie lo confunda con un control de acceso.
- **Sí:** **DT-2 se arregla revalidando al entrar a la vista `dashboard`, dejando el hook donde está.** _Por qué:_ una llamada extra por visita a Inicio, en una app interna de 2 usuarios, es gratis; y cubre **todas** las mutaciones (retiro, pago, uniforme, alta), no solo el retiro que originó la deuda.
- **No:** **mover `useDashboardData` dentro de `<Dashboard>`** (lo "arquitectónicamente correcto", ya que las demás pantallas sí son dueñas de su hook). _Por qué:_ `AdminHome` usa `data.stats.morosos` para el badge de la campana del header (`AdminApp.tsx:52`), que se renderiza desde el slot `right` del `AdminShell`; bajarlo obligaría a subir el conteo con un callback o a duplicar la consulta. Mismo resultado visible, más cirugía. Queda anotado como mejora si el dashboard crece.
- **No:** **pre-commit hooks (husky + lint-staged) en este spec.** _Por qué:_ `coding-rules.md` ya los marca como opcionales, y meter un gate en cada commit antes de que la config esté rodada convierte cualquier falso positivo en un bloqueo. Follow-up trivial una vez que el linter lleve unas semanas en verde.
- **No:** **refactorizar los 34 componentes JSX largos.** _Por qué:_ es la consecuencia directa de la decisión de arriba; hacerlo sería trabajo puro de contador sin mejorar el código.

---

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| **`strictTypeChecked` dispara decenas de hallazgos** sobre un repo que nunca pasó por linter (`no-floating-promises`, `no-unnecessary-condition`, `restrict-template-expressions`) y el bloque A se vuelve interminable. | Bloque A es explícitamente un bloque de **medición**, con umbral escrito (~40): por encima, se baja a `recommendedTypeChecked`, se cierra en verde y la promoción queda como deuda con el número anotado. (Señal favorable: el código ya usa `void recargar()` / `void cerrarSesion()`, como si `no-floating-promises` ya estuviera activo.) |
| El commit de Prettier toca **239 archivos** y arruina `git blame`. | Commit exclusivo de formato, sin cambios funcionales, registrado en `.git-blame-ignore-revs`; `npm run build` verificado igual antes y después. |
| **`import-x/order` con el grupo `type`** no clasifica los `import type` como espera la convención del repo ("tipos al final") y `--fix` reordena medio repo mal. | Confirmar el comportamiento del grupo `type` en `eslint-plugin-import-x@4` al instalar, sobre 2-3 archivos, **antes** de correr `--fix` global. Si no se comporta, se cae al orden por defecto y se quita "tipos al final" de la convención escrita (una de las dos tiene que ceder). |
| El type-aware de `typescript-eslint` sobre `.astro` tiene limitaciones conocidas y puede fallar o dar falsos positivos. | Ya está anotado en `coding-rules.md` §5. Si molesta, `.astro` se linteva sin type-aware (`disableTypeChecked` en su bloque de `files`): las reglas estructurales que importan (`max-lines`) no necesitan tipos. |
| **`docs/backlog.md` HU-7.1 tiene datos del cliente equivocados**: dice WhatsApp `301 521 6830` y sede `Cancha de la Provincia`. Los datos confirmados (`CLAUDE.md` + `src/lib/site.ts`) son **300 872 5964** y **Cancha Los Algarrobillos** (alterna: Cancha del 12 de Octubre). Implementar la HU al pie de la letra publicaría un teléfono falso en producción. | Este spec implementa **solo desde `src/lib/site.ts`** (criterio de aceptación explícito: `grep '300 872'` en `src/features/` no devuelve nada) y **corrige el backlog** en el bloque H — HU-7.1 y la línea de *Notas / pendientes del cliente* que también dice "Cancha de la Provincia". |
| El toggle de montos se confunde con un control de **privacidad/seguridad** y alguien asume que un entrenador no puede ver dinero por tenerlo apagado. | Se documenta como preferencia visual. La barrera real por rol sigue siendo del servidor (specs 09/12: los payloads del entrenador **no traen** montos) y hay un criterio de aceptación de no-regresión sobre eso. |
| Al reemplazar `fmt` por `<Monto>` se cuela un monto sin enmascarar en alguna superficie de lectura. | Las superficies están enumeradas una por una en el Bloque F (6 archivos, mapeados contra los 11 que hoy importan `fmt`/`fmtShort`); los 5 restantes son transaccionales y quedan por decisión, no por olvido. |
| Existe un `Ficha.tsx` con prop `readOnly` que **no está montado en ningún lado** (el entrenador usa `FichaPlantel`), y su `UniformeTab` sí muestra saldo. Si alguien lo reconecta, filtra dinero al entrenador. | Fuera del alcance de este spec, pero se anota como **deuda nueva en el backlog** (código muerto que contradice el spec 09). |
| El `useEffect` de revalidación del dashboard entra en bucle si `recargar` cambia de identidad en cada render. | `recargar` ya está envuelto en `useCallback` con deps vacías (`useDashboardData.ts:21-30`), así que es estable. Hay criterio de aceptación explícito sobre "una sola llamada, verificado en la pestaña Red". |
| Cambiar la semántica de `npm run check` rompe algún flujo que lo daba por sentado (por ejemplo un deploy). | Hoy `check` no lo corre nadie automáticamente: el build de Vercel ejecuta `astro build`, no `check`. Se verifica que el deploy no lo invoque antes de cambiarlo. |

---

## Pendientes del cliente / TODO para Will

- [ ] **Dirección exacta de la Cancha Los Algarrobillos + link de Google Maps** — sin ese dato, la fila "Sede" de la tarjeta es texto informativo y **no** enlaza a un mapa. Ya está como TODO en `CLAUDE.md` y en `src/lib/site.ts:28` (que además pide confirmar ciudad y departamento).
- [ ] **Decidir si la tarjeta del club debe mostrar el email** (`olimak8@hotmail.com`). Está disponible en `CONTACT.email` pero no lo pide la HU; se omite salvo indicación contraria.
- [ ] **`CLAUDE.md` dice usar `/public/logo-temp.png` "mientras llega el SVG"** — ese archivo **no existe** y el SVG **sí** (`public/images/chuter-logo.svg`, ya en uso por `AdminNav.tsx`). Confirmar que el SVG actual es el definitivo para poder cerrar ese pendiente de `CLAUDE.md`.
- [ ] **Confirmar el umbral de `strictTypeChecked`** (~40 hallazgos) o dejarlo a criterio de quien implemente el Bloque A.
- [ ] **Confirmar la lista de montos ocultables**, en especial la exclusión de las pantallas transaccionales (Registrar pago, abono de uniforme, aviso de hermano) — es una decisión de producto, no técnica.
- [ ] **Decidir si el toggle de montos debe existir para el entrenador.** Hoy su app no muestra ningún monto, así que el interruptor no haría nada; la propuesta es **no mostrárselo**, pero la tarjeta del club sí.

---

## Lo que **NO** entra en este spec

- HU-7.3 (gestionar tarifas/cuotas) y HU-8.2 (exportar cartera) — las dos HU que siguen abiertas al cerrar este spec.
- Husky / lint-staged / pre-commit, y ESLint en CI o en el build de Vercel.
- `eslint-plugin-jsx-a11y` y la deuda de accesibilidad de la landing (a11y 90, anotada en el spec 15).
- Refactorizar los 34 componentes JSX de más de 60 líneas.
- Ocultar montos en Registrar pago, en el abono de uniforme, en el aviso de hermano o en el recibo de WhatsApp.
- PIN, biometría o cualquier control de acceso asociado al toggle de montos.
- Mover `useDashboardData` dentro de `<Dashboard>`, o revalidar por `focus`/`visibilitychange`.
- Mapa embebido o enlace a Google Maps en la tarjeta del club (falta el dato).
- Cualquier migración de schema, Action nueva o cambio de regla de negocio.

Cada uno, si llega, va en su propio spec.
