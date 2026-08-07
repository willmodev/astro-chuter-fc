# SPEC 16 — Cierre del back-office: enforcement de código limpio, identidad del club, montos ocultables, refresco del Dashboard y paginado de listas

> **Estado:** Implementado · **Depende de:** SPEC 03 (shell del admin y pantalla "Más"), SPEC 04 (sesión y roles que hoy pinta "Más"), SPEC 06 (`useVistaCartera`, el patrón de preferencia persistida que aquí se generaliza), SPEC 09 (app del entrenador, que comparte la pantalla "Más" y **no ve dinero**), SPEC 14 (retiro de alumnos — de ahí sale la DT-2), SPEC 15 (catálogo único, último spec cerrado) · **Fecha:** 2026-08-07
> **Objetivo:** Cerrar los **cinco cabos sueltos que le quedan al back-office** en un solo spec, porque ninguno justifica uno propio y todos son de la misma naturaleza (cero migración, cero regla de negocio nueva): instalar el **enforcement automático** de las reglas de código limpio que hoy se verifican a mano, publicar la **identidad y el contacto del club** en la pantalla "Más", agregar el **toggle de mostrar/ocultar montos** que le falta a la apariencia persistida, hacer que el **Dashboard revalide** al volver a Inicio, y **paginar el render** de Alumnos y Cartera de a 15 para que las listas no crezcan sin techo.

---

## Por qué existe este spec

Después del spec 15 el back-office está funcionalmente completo. Lo que queda son cinco cabos sueltos — los cuatro primeros anotados en `docs/backlog.md`, el quinto pedido por Will el 2026-08-07:

| #   | Pendiente                                                      | Prioridad | Estado hoy                                                                 |
| --- | -------------------------------------------------------------- | --------- | -------------------------------------------------------------------------- |
| 1   | **HU-0.2** · Enforcement de código limpio                      | `Must`    | ☐ — **el último enabler abierto del EPIC 0**                               |
| 2   | **HU-7.1** · Identidad y contacto del club en "Más"            | `Could`   | ☐                                                                          |
| 3   | **HU-7.2** · Apariencia persistida — falta el toggle de montos | `Should`  | ◐ (la vista Tarjetas/Matriz ya persiste)                                   |
| 4   | **DT-2** · El Dashboard no refresca tras retirar/reactivar     | `Could`   | ☐ (deuda del spec 14)                                                      |
| 5   | **Paginado incremental** de Alumnos y Cartera                  | `Should`  | ☐ — hoy se renderiza la lista completa (82 filas, ~1.000 celdas en Matriz) |

Se agrupan porque comparten tres cosas: **cero migración**, **cero regla de negocio nueva** y un alcance de UI acotado. Separarlos daría cinco specs de una página cada uno.

### El caso de HU-0.2 en concreto

`.claude/rules/coding-rules.md` define límites numéricos (200 líneas por archivo, 60 por función, complejidad 10, cero `any`, orden de imports) y dice explícitamente que **hoy no hay tooling que los haga cumplir**: solo existe `npm run check` = `astro check`. Cada spec desde el 11 los ha verificado **contando líneas a mano** en el bloque de cierre. Eso funcionó mientras el repo crecía spec a spec con una sola persona; no es una garantía, es una costumbre.

Y hay una decisión que el propio archivo de reglas dejó abierta (sección _"Alcance del linter (decisión pendiente)"_): si las reglas estructurales se **scopean** a `src/features/admin/**`, `src/lib/**` y `src/actions/**`, o se aplican **globalmente** limpiando el marketing de a poco. Este spec la resuelve con números, no con intuición — ver la sección siguiente.

### Las otras cuatro, en una línea cada una

- **HU-7.1** — "Más" del admin hoy muestra solo la sesión activa y tres accesos. La del entrenador (`MasEntrenador.tsx:67-85`) **ya tiene** una tarjeta "Sede y horario" leyendo `LOCATION` de `src/lib/site.ts`. Falta la identidad del club (logo, WhatsApp, Instagram, directores) y falta unificarla entre los dos roles.
- **HU-7.2** — `useVistaCartera` (spec 06) resolvió la mitad de la HU. La otra mitad, ocultar montos, no existe. El caso de uso es concreto y móvil: Camilo abre la cartera con un acudiente al lado.
- **DT-2** — bug de ubicación de un hook, no de datos: `useDashboardData()` se llama en `AdminHome` (`AdminApp.tsx:46`), que **nunca se desmonta**, así que su `useEffect` de carga corre una sola vez por sesión.
- **Paginado** — `Alumnos.tsx:78` y `Cartera.tsx:54` renderizan la lista completa. Con 82 alumnos ya son 82 filas y, en la vista Matriz, ~1.000 celdas de una sola vez en un celular. La red **no** es el problema (ver la medición del paginado más abajo); el render sí.

---

## Decisión mayor: alcance del linter (resuelta con medición)

`coding-rules.md` supone que _"el sitio de marketing existente podría tener violaciones (p.ej. `ContactForm.tsx`)"_ y que las reglas estructurales _"están pensadas para el código nuevo del admin"_. **Medido contra el código real del 2026-08-07, la premisa está al revés.**

### Lo que se midió

Conteo sobre los 244 archivos `.ts` / `.tsx` / `.astro` de `src/`, con el mismo criterio que declara la regla (`skipBlankLines` + `skipComments`):

| Regla                                                     | Violaciones hoy | Detalle                                                                                                                                    |
| --------------------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `max-lines: 200`                                          | **0**           | El archivo más grande es `src/lib/services/alumnos.ts`: **204 crudas / 167 efectivas**. Ninguno más pasa de 190 crudas.                    |
| `@typescript-eslint/no-explicit-any`                      | **0**           | La única aparición de la palabra en todo `src/` es un comentario de `lib/db/repos/usuarios.ts:16` que dice _"tipado sin `any`"_.           |
| `max-lines-per-function: 60`                              | **37**          | **33 en `src/features/admin/**` · 4 fuera** (`ContactForm.tsx`154,`GalleryLightbox.tsx`138,`HeroHeadline.tsx`98,`HeroTicket.tsx` 86).      |
| ↳ de esas 37, en `.ts` (lógica pura)                      | **3**           | `ui/useZoomPan.ts` (101), `screens/sesion/useSesion.ts` (97), `screens/alumno-form/useAlumnoForm.ts` (71).                                 |
| ↳ de esas 37, en `.tsx` (componentes)                     | **34**          | Peores: `AdminApp.tsx` `AdminHome` (121), `EquipoScreen.tsx` (107), `SesionRow.tsx` (104), `VisorImagen.tsx` (103), `HojaAbono.tsx` (101). |
| `complexity`, `max-depth`, `max-params`, `import-x/order` | **sin medir**   | Requieren ESLint corriendo; se inventarían en el Bloque A (ver plan).                                                                      |

### Qué se concluye

1. **Scopear por directorio no sirve para nada.** Las dos reglas que definen el contrato del proyecto (`max-lines: 200` y `no-explicit-any`) tienen **cero violaciones en todo el repo**, marketing incluido: aplicarlas globalmente cuesta **cero**. Y la única regla que sí muerde (`max-lines-per-function`) tiene **33 de sus 37 violaciones dentro del admin** — o sea que el scope propuesto en `coding-rules.md` habría metido en scope justo lo que duele y dejado afuera lo que ya pasa.
2. **El eje correcto es el tipo de archivo, no la carpeta.** 34 de las 37 violaciones son cuerpos de **componentes JSX**. Un componente React no es una función imperativa: su `return` es un árbol de markup, y este repo decidió a propósito (`docs/ARCHITECTURE.md` §6) **conservar los estilos inline del prototipo** para fidelidad pixel-perfect. Eso infla el conteo de líneas sin agregar una sola rama de lógica. Partir `EquipoScreen` en tres sub-componentes de 35 líneas para complacer a un contador produciría peor código: más archivos, más prop-drilling, misma complejidad.
3. **Para un archivo `.tsx` de un componente, `max-lines` y `max-lines-per-function` miden lo mismo.** La convención del repo es **un componente por archivo**; el tope real del componente ya es el `max-lines: 200` del archivo. Y el guardián de "esta función hace demasiado" no es el largo, es `complexity: 10`, que sí queda activo.

### Recomendación

**Alcance global** (todo `src/` y `scripts/`), **calibrado por regla y por tipo de archivo**:

| Regla                                               | Alcance                      | Severidad | Costo hoy                                        |
| --------------------------------------------------- | ---------------------------- | --------- | ------------------------------------------------ |
| `max-lines: 200` (skip blancos + comentarios)       | global                       | `error`   | 0 violaciones                                    |
| `@typescript-eslint/no-explicit-any`                | global                       | `error`   | 0 violaciones                                    |
| `import-x/no-duplicates` · `import-x/order`         | global                       | `error`   | autofixables con `--fix`                         |
| `complexity: 10` · `max-depth: 3` · `max-params: 4` | global                       | `error`   | por medir (Bloque A)                             |
| `max-lines-per-function: 60`                        | **solo `.ts` / `.mjs`**      | `error`   | **3** violaciones → se arreglan en este spec     |
| `max-lines-per-function`                            | **off en `.tsx` / `.astro`** | —         | cubierto por `max-lines: 200` + `complexity: 10` |

Las 3 violaciones `.ts` **sí se arreglan** (son hooks con lógica real: extraer helpers, no partir markup). Las 34 de JSX **no se tocan**: la regla deja de aplicarles porque nunca fue para ellas.

> **Consecuencia documental:** `.claude/rules/coding-rules.md` §5 ("Alcance del linter — decisión pendiente") se reemplaza por esta decisión, y §2 gana la fila del override de `.tsx`. La tabla de dependencias de esa sección también está desactualizada: dice `eslint-plugin-astro@^1.7` y hoy la línea vigente es **3.1.0**.

---

## Decisión mayor: paginado en cliente, no en servidor (resuelta con medición)

### Lo que se midió

| Dato                        | Hoy                                                                                                              |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Alumnos activos             | **82**                                                                                                           |
| Payload de `alumnos.listar` | ~600-700 B por alumno (`states[12]` + `kits[2]`) → **≈55 KB, ~10 KB gzip**                                       |
| Queries por llamada         | **3 full-table** (`listarAlumnos` + `pagosPorAnio` + `todosUniformes`), armadas en memoria en `construirAlumnos` |
| Render más pesado           | Cartera en Matriz: 82 × 12 ≈ **1.000 celdas** de una sola vez                                                    |

### Qué se concluye

1. **La red no es el problema.** 10 KB gzip para una app interna de 2 usuarios no se nota. El umbral donde sí empieza a pesar está en **~300 alumnos activos (≈200 KB)**.
2. **El render sí lo es**, y crece con cada alumno nuevo. Es lo que se puede arreglar hoy sin tocar nada más.
3. **Paginar en servidor sería caro y prematuro.** Búsqueda, chips de categoría, segmento "En mora", contadores (`total`/`enMora`/`sinFecha`) y totales de Cartera (`recaudoAnio`, `carteraVencida`) hoy se calculan **en cliente sobre la lista completa**. Paginar en servidor obliga a mover la búsqueda a SQL, **recalcular la mora en SQL duplicando `lib/domain/cartera`** (rompe la fuente única de reglas) y agregar un endpoint aparte de agregados. Es un cambio de contrato de datos — justo lo que este spec declara no tocar.
4. **Hay un problema peor que ningún paginado de lista arregla:** `alumnoAdminPorId` (`services/alumnos.ts:143-149`) llama a `construirAlumnos(hoy, true)` y arma **los 82 alumnos completos para devolver 1**. Cada apertura de Ficha paga el costo íntegro. Se registra como deuda con su disparador (DT-3), no se toca acá.

### Recomendación

**Paginado incremental en cliente** (ventana de render de 15, crece al hacer scroll), con el disparador del paginado en servidor escrito: **>300 alumnos activos o >200 KB de payload**.

---

## Alcance

**Dentro:**

- **Tooling** (raíz): `eslint.config.js` (flat config), `.prettierrc`, `.gitattributes`, `.git-blame-ignore-revs`; scripts `lint`, `typecheck`, `format`, `format:check` y `check` en `package.json`. Dependencias dev: `eslint`, `typescript-eslint`, `eslint-plugin-astro`, `eslint-plugin-import-x`, `@eslint/js`.
- **Refactor mínimo por linter**: las 3 funciones `.ts` que pasan de 60 líneas efectivas (`useZoomPan`, `useSesion`, `useAlumnoForm`) + lo que aparezca en el inventario del Bloque A.
- **Formato**: una pasada de Prettier sobre todo el repo, en **un commit dedicado sin cambios funcionales**.
- **Identidad del club en "Más"** (HU-7.1): componente nuevo `screens/mas/TarjetaClub.tsx` con logo + nombre legal, y accesos a **WhatsApp**, **sede** (enlazada a Google Maps, las dos canchas) e **Instagram**, más la fila de **directores técnicos**. Consumido por `MasMenu` (admin) **y** `MasEntrenador` (entrenador). `InfoRow` se extrae de `MasEntrenador.tsx` a `screens/mas/InfoRow.tsx` para no duplicarlo.
- **Toggle de montos** (HU-7.2): hook `usePreferenciaLocal` (generaliza el patrón de `useVistaCartera`, R7.2) + `useMontosVisibles` + primitivo `ui/Monto.tsx`; interruptor en "Más" y botón de ojo en la cabecera de Cartera. Enmascara los montos de **Dashboard, Cartera y Ficha**.
- **Revalidación del Dashboard** (DT-2): `AdminHome` vuelve a pedir `dashboard.stats` cuando la vista activa pasa a `dashboard`, conservando los datos previos en pantalla mientras revalida (sin parpadeo).
- **Paginado incremental en cliente**: hook `hooks/useListaIncremental.ts` + primitivo `ui/SentinelMostrarMas.tsx`. Aplica a **Alumnos** (`Alumnos.tsx`) y a **Cartera** en sus **dos vistas**: Tarjetas (`TarjetaAlumno`) y Matriz (`MatrizCartera`). Tamaño de página **15**, crece de a 15 al acercarse al final del scroll.
- **Docs**: `.claude/rules/coding-rules.md` (decisión de alcance + versiones), `docs/ARCHITECTURE.md` §9, `docs/backlog.md` (HU-0.2, HU-7.1, HU-7.2 y DT-2 a ☑; encabezado desactualizado; DT-3 y DT-4 nuevas), `CLAUDE.md` (scripts nuevos).

**Fuera del alcance (otros specs):**

- **HU-7.3** (gestionar tarifas/cuotas) y **HU-8.2** (exportar cartera) — las dos HU que siguen abiertas después de este spec; cada una la suya.
- **Paginado en servidor** — `alumnos.listar` sigue devolviendo la lista completa en una llamada. Disparador escrito: **>300 alumnos activos o >200 KB de payload**. Ese spec incluiría búsqueda en SQL, keyset por `nombre+id`, endpoint de agregados y el arreglo de `alumnoAdminPorId` (DT-3).
- **Virtualización real** (`react-window` o similar, reciclando nodos del DOM) — dependencia nueva para un problema que la ventana incremental ya resuelve a esta escala.
- **Paginar Uniformes, Plantel del entrenador y Equipo** — Equipo son ≤10 filas; los otros dos reusan el mismo hook cuando molesten, sin spec nuevo.
- **Husky / lint-staged / pre-commit** — `coding-rules.md` lo marca como opcional; sin CI de por medio, agrega fricción antes de que la config esté rodada. Candidato a un follow-up de una línea.
- **ESLint en CI (GitHub Actions / Vercel build)** — hoy el deploy no corre `check`; conectarlo es otra decisión (y otro riesgo de romper deploys).
- **Reglas de accesibilidad** (`eslint-plugin-jsx-a11y`) — la deuda de a11y 90 en la landing quedó anotada en el spec 15 y es un problema de contraste y `aria-label`, no de lint.
- **Refactorizar los 34 componentes JSX de más de 60 líneas** — la decisión de arriba es explícitamente **no hacerlo**.
- **Ocultar montos en el flujo de Registrar pago, en `HojaAbono` y en `AvisoHermano`** — ver Decisiones: son pantallas transaccionales.
- **PIN / desbloqueo por biometría** para revelar los montos — el toggle es una comodidad visual, no un control de seguridad.
- **El email del club en la tarjeta** y **el toggle de montos para el entrenador** — ver Decisiones.
- Cualquier **migración de schema** o cambio de reglas de negocio.

---

## Modelo de datos

**No toca la base.** Cero tablas, cero columnas, cero migraciones, cero Actions nuevas. El paginado tampoco agrega datos: es una ventana de render sobre una lista ya cargada.

Lo único que persiste es una **preferencia de UI local**, en `localStorage`, siguiendo la convención de clave que ya existe (`chuter.admin.*`):

| Clave                         | Valores                    | Por defecto  | Origen              |
| ----------------------------- | -------------------------- | ------------ | ------------------- |
| `chuter.admin.carteraVista`   | `'tarjetas'` \| `'matriz'` | `'tarjetas'` | ya existe (spec 06) |
| `chuter.admin.montosVisibles` | `'si'` \| `'no'`           | `'si'`       | **nuevo**           |

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

// src/features/admin/hooks/useListaIncremental.ts  (nuevo, ~35 líneas)
// Ventana de render sobre una lista ya cargada. NO pide datos: recorta.
// `clave` = firma de los filtros activos; cambiarla resetea la ventana a `paso`.
// Un refetch (mismo filtro, array nuevo) NO resetea: no se pierde el scroll.
useListaIncremental<T>(
  items: readonly T[],
  clave: string,
  paso?: number,          // 15
): {
  visibles: T[];
  hayMas: boolean;
  mostrarMas: () => void;
  sentinelRef: RefObject<HTMLDivElement>;
};

// src/features/admin/ui/SentinelMostrarMas.tsx  (nuevo, ~30 líneas)
// Div observado por IntersectionObserver (rootMargin 400px → carga antes de
// tocar el fondo) que además renderiza un botón real "Mostrar 15 más".
// El botón es el fallback accesible: teclado y lector de pantalla no dependen
// del scroll. Si `hayMas` es false no renderiza nada.
<SentinelMostrarMas ref={sentinelRef} hayMas={boolean} onMostrarMas={() => void} />
```

**Claves de filtro por pantalla:**

| Pantalla | `clave`         |
| -------- | --------------- | ------------ | ---------------- |
| Alumnos  | `` `${query}    | ${cat}       | ${retirados}` `` |
| Cartera  | `` `${segmento} | ${vista}` `` |

> **Regla invariable del paginado:** los contadores y totales (`total`, `enMora`, `sinFecha`, `recaudoAnio`, `carteraVencida`, el badge del `SegmentoFiltro`) se siguen calculando sobre la **lista completa filtrada**, nunca sobre `visibles`. La ventana es solo de render.

`src/lib/format.ts` (`fmt`, `fmtShort`) **no cambia**: sigue siendo el único formateador de COP del repo y `<Monto>` lo envuelve. Los usos de `fmt` que **no** pasan por `<Monto>` (el recibo de WhatsApp en `ExitoPago.tsx:22`, el total de `ResumenPago`, `HojaAbono` y `AvisoHermano`) quedan intactos a propósito.

> **Por qué `useSyncExternalStore` y no copiar `useVistaCartera` tal cual:** `useVistaCartera` funciona con `useState(lector)` porque tiene **un solo consumidor** (`Cartera.tsx:26`). Los montos tienen ~7 consumidores repartidos en tres pantallas y **dos** interruptores (Más y Cartera); con estado local por componente, tocar el ojo en Cartera no actualizaría la tarjeta de al lado. `usePreferenciaLocal` conserva todo lo que define el patrón actual — clave namespaced, lectura defensiva con caída al valor por defecto, tupla estilo `useState` — y solo cambia el mecanismo de suscripción. `useVistaCartera` se reescribe **encima** de él (misma firma, mismos call sites) para que quede **un** patrón y no dos.

> **Sin `getServerSnapshot`:** el admin monta con `client:only="react"` (`src/pages/admin/_AdminPage.astro:23`), así que no hay render en servidor y `useSyncExternalStore` nunca necesita el snapshot de servidor. Queda escrito para que nadie lo "arregle" agregando uno.

---

## Plan de implementación

Cada bloque deja `npm run check` y `npm run build` en verde, el marketing prerenderizado intacto y el admin funcional.

**Orden de ejecución:** **A → C → A′ → B → D → E → F → G → I → H.** El formato global (C) va **antes** del refactor (B) para que el diff del refactor no quede contaminado por la reformateada, y el `--fix` de imports (A′) corre sobre el código ya formateado.

### Bloque A — ESLint: instalar, inventariar y decidir

1. Instalar dev: `eslint@10`, `@eslint/js@10`, `typescript-eslint@8`, `eslint-plugin-astro@3`, `eslint-plugin-import-x@4` (versiones vigentes verificadas 2026-08-07; `coding-rules.md` todavía dice `eslint-plugin-astro@^1.7`, corregir).
2. Escribir `eslint.config.js` partiendo del esquema ya propuesto en `coding-rules.md` §5, con estos ajustes:

```js
export default tseslint.config(
  {
    ignores: [
      'dist/',
      '.astro/',
      '.vercel/',
      'drizzle/',
      'src/components/ui/**',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...astro.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: { 'import-x': importX },
    rules: {
      'max-lines': [
        'error',
        { max: 200, skipBlankLines: true, skipComments: true },
      ],
      'max-lines-per-function': [
        'error',
        { max: 60, skipBlankLines: true, skipComments: true },
      ],
      complexity: ['error', 10],
      'max-depth': ['error', 3],
      'max-params': ['error', 4],
      '@typescript-eslint/no-explicit-any': 'error',
      'import-x/no-duplicates': 'error',
      'import-x/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
            'type',
          ],
          pathGroups: [{ pattern: '@/**', group: 'internal' }],
          'newlines-between': 'always',
        },
      ],
    },
  },
  // El cuerpo de un componente es un árbol de markup, no una función: lo acota
  // `max-lines: 200` (un componente por archivo) + `complexity: 10`.
  {
    files: ['**/*.tsx', '**/*.astro'],
    rules: { 'max-lines-per-function': 'off' },
  },
  {
    files: ['src/lib/db/schema/**'],
    rules: { 'max-lines-per-function': 'off' },
  },
  // Scripts de mantenimiento: Node puro, fuera del proyecto TS.
  { files: ['scripts/**'], extends: [tseslint.configs.disableTypeChecked] },
);
```

3. **`ignores`:** `src/components/ui/**` queda fuera porque es código generado por shadcn y `CLAUDE.md` dice explícitamente _"no tocar manualmente"_.
4. **Correr `npx eslint .` (sin `--fix`) y anotar el inventario en este spec** (conteo por regla). El grupo `strictTypeChecked` es el riesgo real: sobre un repo que nunca pasó por linter, reglas como `no-floating-promises`, `no-unnecessary-condition` o `restrict-template-expressions` pueden disparar decenas de hallazgos.
   **Regla de corte:** si `strictTypeChecked` deja **más de ~40 hallazgos**, se baja a `recommendedTypeChecked`, se cierra en verde, y la promoción a `strictTypeChecked` queda anotada como deuda con el número medido. Si son menos, se arreglan acá.

_Verifica:_ el inventario queda escrito; ninguna regla quedó silenciada con `eslint-disable` sin comentario que justifique.

#### Inventario medido (2026-08-07)

Versiones instaladas: `eslint@10.8.0`, `@eslint/js@10.0.1`, `typescript-eslint@8.66.0`,
`eslint-plugin-astro@3.1.0`, `eslint-plugin-import-x@4.17.1`, más `globals` (necesario
para declarar el entorno Node de `scripts/**`, que el esquema del spec no contemplaba).

**Hallazgo que el spec no previó:** el conteo del spec se hizo sobre los 244 archivos de
`src/`, pero `npx eslint .` barre **todo el repo**. La primera corrida dio **4256 errores**,
de los cuales **3671 (86%)** venían de `references/`, `admin-design-system-*/`,
`docs/comercial/` y `.playwright-cli/` — todo material **no versionado** (está en
`.gitignore`): el prototipo de referencia y el bundle del design system. ESLint no lee
`.gitignore`, así que se agregaron a `ignores`. **No es código del proyecto.**

**Decisión de severidad — se aplica la regla de corte:** con `strictTypeChecked` quedaban
**563 hallazgos**, muy por encima del umbral escrito (~40). Se baja a
**`recommendedTypeChecked`** y la promoción queda como deuda anotada con el número medido.

Inventario con `recommendedTypeChecked` sobre el scope real: **214 hallazgos**, de los
cuales **129 son autofixables** (`--fix`, Bloque A′) → **85 reales**:

| Regla                                    | Total | Autofix | Reales | Origen                                                                                                                                                                           |
| ---------------------------------------- | ----- | ------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `import-x/order`                         | 127   | 126     | 1      | Bloque A′                                                                                                                                                                        |
| `@typescript-eslint/no-unsafe-*`         | 40    | 0       | 40     | **Todos** de `import.meta.env`: Astro lo tipa como `any`. Se resuelve tipando `ImportMetaEnv` en `src/env.d.ts` (un cambio, −40).                                                |
| `@typescript-eslint/no-misused-promises` | 18    | 0       | 18     | `onClick={async …}` en JSX → envolver con `void`. Mecánico.                                                                                                                      |
| `complexity`                             | 9     | 0       | 9      | `parseRuta` 25, `AdminHome` 18, `HojaEntrega` 16, `EquipoScreen`/`Ficha`/`carga-sesion` 12, `DayCard`/`middleware` 11, `parseFila` (script) 21. **El spec no los había medido.** |
| `@typescript-eslint/no-unused-vars`      | 7     | 0       | 7      | Imports muertos (incluido el `RutaAdmin` de `AdminApp.tsx:23`).                                                                                                                  |
| `max-lines-per-function`                 | 5     | 0       | 5      | Las 3 previstas (`useZoomPan` 101, `useSesion` 97, `useAlumnoForm` 71) + 2 en `scripts/` que el spec no midió.                                                                   |
| `max-params`                             | 2     | 0       | 2      | `upsertPlaneacion` (5), `insertarUniformes` (5).                                                                                                                                 |
| `import-x/no-duplicates`                 | 2     | 1       | 1      | `services/uniformes.ts`.                                                                                                                                                         |
| `no-unnecessary-type-assertion`          | 2     | 2       | 0      | Autofix.                                                                                                                                                                         |
| `no-floating-promises`                   | 1     | 0       | 1      | `Entrenos.tsx:89`.                                                                                                                                                               |
| Error de parseo                          | 1     | —       | 1      | `StylizedMap.astro:129` — limitación del parser de Astro, ver Bloque B.                                                                                                          |
| `max-lines: 200`                         | **0** | —       | **0**  | ✅ confirma la medición del spec.                                                                                                                                                |
| `@typescript-eslint/no-explicit-any`     | **0** | —       | **0**  | ✅ confirma la medición del spec.                                                                                                                                                |
| `max-depth: 3`                           | **0** | —       | **0**  | No medido antes; sale limpio.                                                                                                                                                    |

Las dos reglas que definen el contrato del proyecto (`max-lines: 200` y `no-explicit-any`)
salieron en **cero violaciones**, tal como el spec predijo. El alcance global se confirma.

### Bloque C — Prettier y normalización de finales de línea

5. `.prettierrc` mínimo (el resto son defaults de Prettier 3, que ya coinciden con el repo):

```json
{
  "singleQuote": true,
  "plugins": ["prettier-plugin-astro", "prettier-plugin-tailwindcss"]
}
```

6. `.gitattributes` con `* text=auto eol=lf`. **Medido:** hoy los archivos están en disco con **CRLF**; con el `endOfLine: 'lf'` por defecto de Prettier, **239 de los 244** archivos cambian, de los cuales **114 son solo finales de línea** y **125 tienen deriva real de formato**. Normalizar a LF es lo correcto para un repo que compila y despliega en Linux (Vercel).
7. Correr `npx prettier --write .` en **un commit dedicado y exclusivo** (`💄 style: aplicar Prettier y normalizar finales de línea a LF`), sin ningún cambio funcional mezclado.
8. Registrar ese commit en `.git-blame-ignore-revs` para que `git blame` siga siendo útil.

_Verifica:_ `npm run build` y `npm run check` dan el mismo resultado antes y después del commit de formato; `git diff --stat` del commit siguiente vuelve a ser pequeño.

### Bloque A′ — Autofix de imports

9. Correr `npx eslint . --fix` sobre el código ya formateado, para `import-x/order` y demás autofixables, y revisar el diff **archivo por archivo** (nunca `git add .`).

_Verifica:_ `npx eslint .` sale en verde salvo por lo que quedó pendiente del inventario del Bloque A.

### Bloque B — Las 3 funciones `.ts` que pasan de 60 líneas

10. `src/features/admin/ui/useZoomPan.ts` (101 efectivas) — extraer los cálculos de límites/gestos a helpers puros del mismo archivo o a `ui/zoom-pan.ts`.
11. `src/features/admin/screens/sesion/useSesion.ts` (97) — separar la carga de la sesión del guardado (dos funciones internas).
12. `src/features/admin/screens/alumno-form/useAlumnoForm.ts` (71) — extraer la construcción del payload / validación local.

_Verifica:_ ninguna función `.ts` pasa de 60 efectivas; el zoom del visor, la sesión del entrenador y el alta/edición de alumno siguen funcionando igual (revisión manual en `npm run dev`).

### Bloque D — Scripts y documentación del tooling

13. `package.json`:

```json
"lint": "eslint .",
"typecheck": "astro check",
"format": "prettier --write .",
"format:check": "prettier --check .",
"check": "astro check && eslint ."
```

> **`check` no incluye `format:check` a propósito:** el formato no bloquea, se corre a mano con `npm run format`. Queda escrito para que no se vuelva a discutir.

14. `docs/ARCHITECTURE.md` §9: `npm run lint` deja de ser aspiracional. `CLAUDE.md`: agregar los scripts nuevos. `.claude/rules/coding-rules.md`: reemplazar §5 _"Alcance del linter (decisión pendiente)"_ por la decisión de este spec, actualizar versiones y agregar el override de `.tsx` a la tabla de §2.

_Verifica:_ `npm run check` corre las dos herramientas y falla si cualquiera falla; ninguna doc sigue describiendo el linter como pendiente.

### Bloque E — HU-7.1: identidad y contacto del club en "Más"

15. Extraer `InfoRow` de `MasEntrenador.tsx:109-148` a `screens/mas/InfoRow.tsx` (hoy es privado de ese archivo y lo va a necesitar la tarjeta nueva).
16. Crear `screens/mas/TarjetaClub.tsx`, **sin un solo dato escrito a mano** — todo sale de `src/lib/site.ts` y `src/lib/whatsapp.ts`:
    - Cabecera: `/images/chuter-logo.svg` (el mismo que ya usa `chrome/AdminNav.tsx:28`) + `SITE.legalName` + `SITE.tagline`.
    - `InfoRow` **WhatsApp** → `whatsappURL('Hola Chuter FC')` (o `WA_FAB`), subtítulo `CONTACT.phoneDisplay`.
    - `InfoRow` **Sede** → `LOCATION.venue`, subtítulo `${LOCATION.neighborhood} · ${LOCATION.city}, ${LOCATION.region} · INDER`, **enlazando a `LOCATION.mapsUrl`**. La cancha alterna (`LOCATION.secondaryVenue`) enlaza a `LOCATION.secondaryMapsUrl`.
    - `InfoRow` **Horario** → `SCHEDULE.daysHuman` / `SCHEDULE.hoursHuman` (**hoy `MasEntrenador.tsx:84` los tiene hardcodeados** como `"Lun · Mié · Vie"` / `"4:30 – 6:00 PM"`, contra la regla de `CLAUDE.md` de no hardcodear textos — se corrige de paso).
    - `InfoRow` **Instagram** → `CONTACT.instagramUrl` / `CONTACT.instagramHandle`.
    - Bloque **Directores técnicos**: las dos entradas de `COACHES` (nombre, rol e Instagram), con `Avatar` del DS.
17. Montar `<TarjetaClub />` en `MasMenu.tsx` (admin) y en `MasEntrenador.tsx` (entrenador), reemplazando en este último su bloque "Sede y horario" para no duplicarlo.
18. Borrar el `// TODO: pedir a Camilo — confirmar ciudad y departamento` de `site.ts:28`: quedó obsoleto el 2026-08-07 (`city` y `region` ya están poblados).

_Verifica:_ los dos roles ven la misma tarjeta; los enlaces abren WhatsApp con mensaje precargado, Google Maps de cada cancha e Instagram del club y de cada director; ni `MasMenu.tsx` ni `MasEntrenador.tsx` pasan de 200 líneas.

### Bloque F — HU-7.2: toggle de mostrar/ocultar montos

19. `hooks/usePreferenciaLocal.ts` (nuevo, ~40 líneas): store sobre `localStorage` + `useSyncExternalStore`, lectura defensiva contra la lista de valores válidos.
20. Reescribir `hooks/useVistaCartera.ts` sobre él — **misma firma exportada**, `Cartera.tsx` no se toca. Agregar `hooks/useMontosVisibles.ts`.
21. `ui/Monto.tsx`: `<Monto valor corto? />` → `fmt`/`fmtShort` cuando están visibles, `'$•••'` cuando no, con `aria-label="Monto oculto"` y `title` para lectores de pantalla.
22. Reemplazar `fmt`/`fmtShort` por `<Monto>` en las **6 superficies de lectura**: `dashboard/HeroRecaudo.tsx` (recaudo del mes, meta, cartera vencida), `dashboard/KpisGrid.tsx` (Recaudo año), `dashboard/CobrosPendientes.tsx` (saldo por moroso), `cartera/CabeceraTotales.tsx` (recaudado año + cartera vencida), `cartera/TarjetaAlumno.tsx` (cuota/mes + badge de saldo), `ficha/UniformeTab.tsx` (saldo por kit).
23. Interruptores: fila con switch **"Mostrar montos"** en "Más" (**solo para el admin**), y un `IconButton` de ojo (`eye` / `eye-off`) en la cabecera de Cartera, junto a `ToggleVista`.
    **Registrar los iconos nuevos** en `chrome/Icon.tsx` (registro tipado kebab-case → `lucide-react`): hoy no están `eye` ni `eye-off`, y el Bloque E también necesita `instagram`.

_Verifica:_ ocultar en Cartera actualiza la cabecera **y** las tarjetas en el mismo render; navegar a Inicio y a una Ficha los mantiene ocultos; recargar la página los mantiene ocultos; volver a mostrarlos revierte todo.

### Bloque G — DT-2: revalidación del Dashboard

24. En `AdminApp.tsx`, `AdminHome` vuelve a llamar `recargar()` cuando `ruta.vista` pasa a `'dashboard'`:

```ts
useEffect(() => {
  if (ruta.vista === 'dashboard') void recargar();
}, [ruta.vista, recargar]);
```

25. Confirmar que **no hay parpadeo**: `recargar` pone `estado = 'cargando'` pero **no limpia `data`**, y el render de `AdminApp.tsx:66-78` muestra `<EstadoCarga>` solo cuando `data` es `null`. Es decir, la primera carga muestra el spinner y las revalidaciones posteriores mantienen los KPIs anteriores hasta que llegan los nuevos.

_Verifica:_ retirar un alumno desde su ficha y volver a Inicio actualiza "Alumnos activos", "% al día", "En mora", "Cartera vencida" y "Cobros pendientes" **sin recargar la página**; reactivarlo los revierte; registrar un pago también se refleja.

### Bloque I — Paginado incremental de Alumnos y Cartera

26. `hooks/useListaIncremental.ts`: `useState` del tope, `useEffect` que lo resetea a `paso` cuando cambia `clave`, `useCallback` de `mostrarMas`, y `useEffect` que monta el `IntersectionObserver` sobre `sentinelRef` (root por defecto = documento, `rootMargin: '400px'`).
27. `ui/SentinelMostrarMas.tsx`: botón `Mostrar 15 más` sobre el `div` observado, con `aria-live="polite"` anunciando `N de M`.
28. `Alumnos.tsx`: `visibles` pasa por el hook; la lista renderiza la ventana, y `ResumenAlumnos` **sigue leyendo `activos` completo**.
29. `Cartera.tsx`: mismo tratamiento; `CabeceraTotales` y `SegmentoFiltro` **siguen leyendo las listas completas**. `MatrizCartera` recibe la ventana (la cabecera sticky de meses no cambia).
30. Registrar el icono `chevron-down` en `chrome/Icon.tsx` si el botón lo lleva.

_Verifica:_ con 82 alumnos, Alumnos y Cartera montan **15 filas**; bajar carga de a 15 hasta las 82; buscar "and" resetea a 15 sobre los resultados; registrar un pago recarga la lista **sin perder la ventana ni el scroll**; los contadores siempre dicen 82, no 15.

### Bloque H — Docs, backlog y cierre

31. `docs/backlog.md`:
    - HU-0.2, HU-7.1, HU-7.2 y DT-2 a ☑ con su nota de spec.
    - Actualizar el **encabezado (`backlog.md:8`)**: hoy sigue listando HU-7.1 y HU-7.4 como pendientes, y HU-7.4 ya es `Won't`/☒. Tras este spec, lo único abierto es **HU-7.3** y **HU-8.2**.
    - El paginado **no** abre HU nueva: se anota como _hecho_ bajo **HU-2.1**.
    - **DT-3 · `alumnoAdminPorId` construye toda la lista para devolver un alumno** (`services/alumnos.ts:143-149`) — cada apertura de Ficha paga el costo de los 82. Incluye el **disparador del paginado en servidor**: >300 activos o >200 KB de payload.
    - **DT-4 · `Ficha.tsx` con prop `readOnly` no está montado en ningún lado** y su `UniformeTab` muestra saldo; si alguien lo reconecta, filtra dinero al entrenador (contradice el spec 09).
    - Agregar a **R7.2** la clave nueva (`chuter.admin.montosVisibles`).
32. `npm run check` + `npm run build` en verde; revisión visual con `playwright-cli --headed` de 320px a desktop en Más (los dos roles), Cartera, Inicio y Ficha.

---

## Criterios de aceptación

### Enforcement de código limpio (HU-0.2)

- [x] Existen `eslint.config.js` y `.prettierrc` en la raíz, y `npm run lint`, `npm run typecheck`, `npm run format:check` y `npm run check` corren desde `package.json`.
- [x] `npm run check` ejecuta **astro check + eslint** y **falla** si cualquiera de los dos falla (verificado introduciendo a propósito un `any` y un archivo de 210 líneas efectivas, y luego revirtiéndolos).
- [x] `npx eslint .` sale en **verde**, sin `eslint-disable` sin comentario que lo justifique.
- [x] `max-lines: 200` y `no-explicit-any` están en `error` **globalmente** (marketing incluido) y no hay ni una violación.
- [x] `max-lines-per-function: 60` está en `error` para `.ts`/`.mjs` y **desactivado** para `.tsx`/`.astro`, con el porqué escrito como comentario en la config.
- [x] Las 3 funciones `.ts` que superaban 60 líneas efectivas (`useZoomPan` 101, `useSesion` 97, `useAlumnoForm` 71) quedan por debajo del límite **sin perder comportamiento**.
- [x] El inventario de la primera corrida (conteo por regla, y si `strictTypeChecked` se mantuvo o se bajó a `recommendedTypeChecked`) queda anotado en este spec al cerrarlo.
- [x] El commit de Prettier es **exclusivo de formato**: `npm run build` produce el mismo resultado antes y después, y el hash queda en `.git-blame-ignore-revs`.
- [x] El commit de formato va **antes** del refactor del Bloque B: el diff del refactor no trae líneas reformateadas.
- [x] `.claude/rules/coding-rules.md` ya **no** tiene una "decisión pendiente" sobre el alcance del linter y sus versiones de dependencias son las vigentes.

### Identidad y contacto del club (HU-7.1)

- [x] "Más" muestra una tarjeta con el logo del club y **"Club Deportivo Chuter F.C."**.
- [x] La tarjeta tiene accesos a **WhatsApp** (`300 872 5964`, con mensaje precargado vía `src/lib/whatsapp.ts`), **sede** (`Cancha Los Algarrobillos`, Los Algarrobillos · Valledupar, Cesar · INDER, con la cancha alterna `Cancha del 12 de Octubre`), **horario** (Lun/Mié/Vie 4:30–6:00 PM) e **Instagram** (`@1chuter`).
- [x] Las dos canchas **enlazan a Google Maps** (`LOCATION.mapsUrl` y `LOCATION.secondaryMapsUrl`) y el enlace abre el mapa correcto de cada una.
- [x] Aparecen los **directores técnicos** (Camilo Andrade y Ebed Shaday Calderón) con enlace a su Instagram.
- [x] **Ningún dato está escrito a mano** en el componente: todos salen de `src/lib/site.ts`. `grep '300 872'` y `grep 'Algarrobillos'` en `src/features/` no devuelven nada.
- [x] El **horario deja de estar hardcodeado** en `MasEntrenador.tsx` y pasa a leerse de `SCHEDULE`.
- [x] La tarjeta se ve igual para **admin y entrenador**, y `InfoRow` existe una sola vez en el repo.
- [x] El `TODO` obsoleto de `site.ts:28` ya no está.

### Mostrar / ocultar montos (HU-7.2)

- [x] Existe un interruptor **"Mostrar montos"** en "Más" (solo admin) y un botón de ojo en la cabecera de **Cartera**; los dos escriben la misma preferencia.
- [x] Con los montos ocultos, se enmascaran como `$•••`: recaudo del mes, meta, cartera vencida y recaudo del año (Dashboard), saldo de cada moroso (Cobros pendientes), recaudado año y cartera vencida (Cartera), cuota/mes y saldo de cada tarjeta, y el saldo por kit en la Ficha.
- [x] **No** se ocultan: conteos (alumnos activos, N en mora, N meses), porcentajes, la barra de progreso, los colores de la tira de meses ni la matriz de cartera.
- [x] **No** se ocultan las pantallas transaccionales: el total de **Registrar pago**, el precio/saldo de **HojaAbono**, el aviso de **descuento de hermano** y el **recibo de WhatsApp** siguen mostrando la cifra siempre.
- [x] Cambiar el toggle en Cartera actualiza **en el mismo render** la cabecera y todas las tarjetas visibles (sin navegar ni recargar).
- [x] La preferencia **sobrevive a recargar** la página (`localStorage`, clave `chuter.admin.montosVisibles`) y el valor por defecto es **visible**.
- [x] `useVistaCartera` conserva su firma y `Cartera.tsx` no cambió su call site; hay **un solo** mecanismo de preferencia local en el repo (`usePreferenciaLocal`).
- [x] La app del **entrenador sigue sin mostrar ningún monto** y **no ve el interruptor**, con la preferencia en cualquier estado (no-regresión del spec 09).

### Refresco del Dashboard (DT-2)

- [x] Retirar un alumno desde su ficha y volver a Inicio actualiza **sin recargar la página**: Alumnos activos, % al día, En mora, Cartera vencida y Cobros pendientes.
- [x] Reactivarlo revierte los mismos indicadores.
- [ ] Registrar un pago y volver a Inicio actualiza recaudo del mes, recaudo del año y la gráfica por mes.
      **No ejecutado a propósito:** el único entorno disponible apunta a la base de producción del club y
      un pago no se puede deshacer desde la UI. El mecanismo es el mismo `useEffect` que sí se verificó con
      retirar/reactivar (que revierte sin dejar rastro), así que la revalidación está probada; lo que falta
      es solo esta variante concreta. Queda para cuando haya un entorno de pruebas.
- [x] **Sin parpadeo:** al volver a Inicio no aparece el spinner de carga — los KPIs previos siguen en pantalla hasta que llegan los nuevos. El spinner solo se ve en la primera carga de la sesión.
- [x] No hay un bucle de peticiones: volver a Inicio dispara **una** llamada a `dashboard.stats`, no una por render (verificado en la pestaña Red).

### Paginado incremental

- [x] Alumnos y Cartera (Tarjetas **y** Matriz) montan **15 filas**, no la lista completa (verificado contando nodos en el inspector).
- [x] Al acercarse al final del scroll se agregan **15 más**, sin llamadas nuevas a la red (verificado en la pestaña Red: **cero** peticiones al hacer scroll).
- [x] Existe un botón **"Mostrar 15 más"** operable por teclado; con el scroll deshabilitado o con `IntersectionObserver` ausente, la lista sigue siendo navegable.
- [x] Cambiar búsqueda, chip de categoría, "Mostrar retirados" o el segmento Todos/En mora **resetea la ventana a 15**.
- [x] Un **refetch** (registrar pago, retirar alumno) **no resetea la ventana**: si había 45 filas visibles, quedan 45.
- [x] Los contadores y totales miden la **lista completa**, no la ventana: `ResumenAlumnos` dice `82`, `SegmentoFiltro` dice el total real, `CabeceraTotales` no cambia al hacer scroll.
- [x] Cuando no quedan más filas, el centinela **desaparece** (no queda un botón muerto).
- [x] `alumnos.listar` sigue devolviendo la lista completa en **una** llamada: el paginado es de render, no de datos.
- [x] El umbral de migración a paginado en servidor (**>300 activos o >200 KB**) queda escrito en `docs/backlog.md` como deuda con su disparador (DT-3).

### Calidad y no-regresión

- [x] Ningún archivo supera 200 líneas efectivas; cero `any`; `npm run check` y `npm run build` en verde.
- [x] Marketing prerenderizado intacto (`prerender = false` solo en `/admin/**` y `/api/**`); `/admin/**` sigue `noindex` y fuera del sitemap.
- [x] De 320px a desktop: cero scroll horizontal en Más (los dos roles), Inicio, Cartera y Ficha.
- [x] `docs/backlog.md` marca HU-0.2, HU-7.1, HU-7.2 y DT-2 como ☑, su encabezado ya no lista HU-7.1 ni HU-7.4 como pendientes, y quedan registradas DT-3 y DT-4.

---

## Verificación en vivo (2026-08-07)

Se recorrió el admin completo con `playwright-cli --headed` contra el dev server, con
sesión real. **44 de los 45 criterios quedan cerrados.**

**Sitio público** (390px y 1440px): `scrollWidth > clientWidth` da `false` en ambos anchos;
hero, mapa SVG, botones de Maps/Waze y los 6 campos del formulario sin cambios tras el
refactor; la categoría sugerida sigue calculándose bien. Sin errores de consola.

**Admin** (320px, 390px y 1440px): paginado (15 al montar, +15 por scroll y por botón, cero
peticiones de red, reset por filtro, contadores sobre la lista completa, centinela que
desaparece), toggle de montos (135 máscaras en un mismo render, persistencia tras F5,
propagación a Inicio y Ficha, conteos y porcentajes intactos) y DT-2 (retirar → 82→81,
mora 51→50, cartera $3.85M→$3.70M, badge 51→50, sin recargar; reactivar revierte todo; sin
parpadeo; una sola llamada a `dashboard.stats` por retorno).

Único criterio abierto: **registrar un pago**. No se ejecutó a propósito — el único entorno
disponible apunta a la base de producción del club y un pago no se revierte desde la UI. La
revalidación que ese criterio comprueba es el mismo `useEffect` ya verificado con
retirar/reactivar, que sí es reversible.

### Tres defectos encontrados en la verificación y corregidos

1. **`dashboard.stats` se pedía dos veces en la primera carga.** `useDashboardData` tenía su
   propia carga inicial _además_ del `useEffect` de DT-2. Ahora hay un solo dueño: la
   pantalla pide cuando entra a `dashboard`.
2. **A 320px el botón del ojo quedaba fuera de pantalla e inalcanzable** en Cartera vista
   Tarjetas (`main` medía 407px contra 320 de viewport). La causa no era la cabecera sino el
   `min-content` del nombre de alumno propagándose por grids de columna `auto`; se corrige
   con `minmax(0, 1fr)` en el contenedor de la pantalla, el de la lista y el de la tarjeta,
   más `minWidth: 0` y cifra fluida en `CabeceraTotales`.
3. **La ventana del paginado se reseteaba a 15 al volver de una ficha**, que es exactamente
   el flujo que nombra el criterio ("retirar alumno"). `VistaAdmin` desmonta la pantalla, así
   que el `useState` del tope se perdía. El tope pasó a un `Map` de módulo que sobrevive al
   desmontaje y solo recuerda el filtro vigente. Verificado: 45 filas siguen siendo 45 tras
   ir a la ficha, retirar y volver, y cambiar de filtro sigue reseteando a 15.

Los tres eran defectos reales que la revisión estática no habría encontrado.

---

## Decisiones

### Tooling

- **Sí:** **linter global, calibrado por regla y tipo de archivo, no scopeado por directorio.** _Por qué:_ medido, las dos reglas que definen el contrato (`max-lines: 200`, `no-explicit-any`) tienen **0 violaciones en todo el repo** — scopearlas sería regalar cobertura gratis; y la única que muerde tiene **33 de 37** violaciones **dentro** del admin, o sea que el scope propuesto habría dejado afuera justo lo limpio.
- **Sí:** **`max-lines-per-function` desactivado en `.tsx`/`.astro`.** _Por qué:_ 34 de las 37 violaciones son cuerpos JSX; con un componente por archivo, `max-lines: 200` ya es el tope del componente, y `complexity: 10` sigue siendo el guardián real de "esta función hace demasiado". Partir markup para complacer un contador produce peor código, y choca con la decisión explícita de conservar los estilos inline del prototipo (`ARCHITECTURE.md` §6).
- **Sí:** **las 3 funciones `.ts` largas se arreglan, no se exceptúan.** _Por qué:_ son hooks con lógica real (zoom, sesión, formulario) — exactamente lo que la regla existe para acotar. Son 3, es trabajo acotado.
- **Sí:** **inventariar antes de decidir la severidad de `strictTypeChecked`,** con umbral escrito (~40 hallazgos). _Por qué:_ es el único grupo de reglas cuyo costo no se pudo medir sin instalar ESLint; dejar la decisión "a criterio" garantiza que se resuelva mal bajo presión.
- **Sí:** **el commit de formato (C) va antes del refactor (B).** _Por qué:_ si el refactor va primero, la pasada de Prettier lo reformatea después y el diff del refactor queda contaminado con ruido de formato. Invertirlos no cuesta nada y deja los dos diffs limpios.
- **Sí:** **Prettier en un commit exclusivo + `.gitattributes` a LF + `.git-blame-ignore-revs`.** _Por qué:_ son 239 archivos (114 solo por CRLF→LF). Mezclar eso con cambios funcionales haría el diff irrevisable; aislarlo lo vuelve un commit que se aprueba de un vistazo. LF es lo correcto: el proyecto compila y despliega en Linux.
- **Sí:** **`src/components/ui/**`fuera del linter.** _Por qué:_ es código generado por shadcn y`CLAUDE.md`dice "no tocar manualmente"; lintearlo obligaría a editarlo o a llenarlo de`eslint-disable`.
- **No:** **`format:check` dentro de `npm run check`.** _Por qué:_ el formato no debe bloquear el mismo comando que valida tipos y reglas; se corre a mano con `npm run format`. Queda escrito para que no se re-litigue.
- **No:** **pre-commit hooks (husky + lint-staged) en este spec.** _Por qué:_ `coding-rules.md` ya los marca como opcionales, y meter un gate en cada commit antes de que la config esté rodada convierte cualquier falso positivo en un bloqueo. Follow-up trivial una vez que el linter lleve unas semanas en verde.
- **No:** **refactorizar los 34 componentes JSX largos.** _Por qué:_ es la consecuencia directa de la decisión de arriba; hacerlo sería trabajo puro de contador sin mejorar el código.

### Identidad del club y montos

- **Sí:** **la tarjeta del club se arma 100% desde `src/lib/site.ts`.** _Por qué:_ ya es la fuente única de esos datos para la landing; duplicarlos en el admin es exactamente la clase de divergencia que produjo el dato equivocado que el backlog arrastró hasta el 2026-08-07.
- **Sí:** **la misma tarjeta para admin y entrenador.** _Por qué:_ es identidad del club, no información administrativa: no tiene dinero ni datos de alumnos, así que no hay nada que filtrar por rol. Y evita mantener dos versiones.
- **Sí:** **la sede enlaza a Google Maps.** _Por qué:_ el dato llegó del cliente el 2026-08-07 (`LOCATION.mapsUrl` y `LOCATION.secondaryMapsUrl`, commit `83a82f5`); dejar la fila como texto plano sería no usar un dato que ya está en el repo.
- **Sí:** **`usePreferenciaLocal` con `useSyncExternalStore`, y `useVistaCartera` reescrito encima.** _Por qué:_ conserva todo lo que define el patrón del spec 06 (clave `chuter.admin.*`, lectura defensiva, tupla estilo `useState`) y solo arregla su límite real: con `useState` por componente, un toggle no puede sincronizar 7 consumidores en la misma pantalla. Reescribir `useVistaCartera` encima deja **un** patrón, no dos.
- **Sí:** **los montos se ocultan solo en las superficies de lectura (Dashboard, Cartera, Ficha).** _Por qué:_ el caso de uso es "reviso la cartera con alguien al lado". En Registrar pago o en un abono estás **cobrando**: ocultar el total que vas a confirmar es un error esperando ocurrir. Regla de una línea, fácil de verificar.
- **Sí:** **la máscara es `$•••` y no un espacio en blanco.** _Por qué:_ conserva el `$` y el ancho aproximado, así el layout no salta y se entiende que hay un dato oculto, no un dato faltante.
- **Sí:** **el toggle es comodidad visual, no seguridad.** _Por qué:_ el dato ya está en el cliente; quien tenga el teléfono desbloqueado puede volver a mostrarlo con un tap. Se documenta así para que nadie lo confunda con un control de acceso.
- **No:** **el email del club en la tarjeta.** _Por qué:_ la HU no lo pide y el canal real del club es WhatsApp. Sigue disponible en `CONTACT.email` si algún día se agrega.
- **No:** **el toggle de montos para el entrenador.** _Por qué:_ su app no muestra un solo monto — el interruptor no haría nada y sugeriría que hay dinero oculto detrás. La tarjeta del club sí la ve.

### Dashboard y paginado

- **Sí:** **DT-2 se arregla revalidando al entrar a la vista `dashboard`, dejando el hook donde está.** _Por qué:_ una llamada extra por visita a Inicio, en una app interna de 2 usuarios, es gratis; y cubre **todas** las mutaciones (retiro, pago, uniforme, alta), no solo el retiro que originó la deuda.
- **No:** **mover `useDashboardData` dentro de `<Dashboard>`** (lo "arquitectónicamente correcto", ya que las demás pantallas sí son dueñas de su hook). _Por qué:_ `AdminHome` usa `data.stats.morosos` para el badge de la campana del header (`AdminApp.tsx:52`), que se renderiza desde el slot `right` del `AdminShell`; bajarlo obligaría a subir el conteo con un callback o a duplicar la consulta. Mismo resultado visible, más cirugía. Queda anotado como mejora si el dashboard crece.
- **Sí:** **paginado en cliente (ventana de render), no en servidor.** _Por qué:_ medido, `alumnos.listar` pesa ~55 KB con 82 alumnos (≈10 KB gzip) — la red no es el problema. El costo real es pintar ~1.000 celdas de la Matriz en un celular. Paginar en servidor obligaría a mover la búsqueda a SQL y a **recalcular la mora en SQL, duplicando `lib/domain/cartera`**, más un endpoint aparte de agregados porque los totales dejarían de poder calcularse en cliente. Es un cambio de contrato de datos, justo lo que este spec declara no tocar.
- **Sí:** **el disparador del paginado en servidor queda escrito (>300 activos o >200 KB), no a criterio.** _Por qué:_ es la misma disciplina del umbral de `strictTypeChecked`; una decisión diferida sin número se resuelve mal y tarde.
- **Sí:** **un refetch no resetea la ventana; cambiar un filtro sí.** _Por qué:_ registrar un pago desde la fila 40 de Cartera y volver a ver 15 filas es una regresión de uso. Cambiar el filtro, en cambio, es una lista distinta y empezar arriba es lo esperado. Por eso el hook toma una `clave` de filtros y no reacciona a la identidad del array.
- **Sí:** **centinela + botón real "Mostrar 15 más".** _Por qué:_ el scroll infinito puro es inaccesible por teclado y por lector de pantalla, y el proyecto tiene Accessibility 100 como presupuesto. El botón cuesta ~10 líneas y es también el fallback si el observer falla.
- **Sí:** **contadores y totales siempre sobre la lista completa.** _Por qué:_ es el error clásico de este patrón — que la cabecera diga "15 alumnos" y cambie al hacer scroll. Va como criterio de aceptación explícito, no como cuidado tácito.
- **No:** **virtualización real (`react-window` o similar).** _Por qué:_ es una dependencia nueva para un problema que la ventana incremental ya resuelve a esta escala, y `CLAUDE.md` prohíbe agregar librerías sin justificación.
- **No:** **paginar Uniformes, Plantel y Equipo.** _Por qué:_ Equipo son ≤10 filas. Los otros dos pueden reusar el mismo hook cuando molesten, sin spec nuevo.

---

## Riesgos identificados

| Riesgo                                                                                                                                                                                                                   | Mitigación                                                                                                                                                                                                                                                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`strictTypeChecked` dispara decenas de hallazgos** sobre un repo que nunca pasó por linter (`no-floating-promises`, `no-unnecessary-condition`, `restrict-template-expressions`) y el bloque A se vuelve interminable. | Bloque A es explícitamente un bloque de **medición**, con umbral escrito (~40): por encima, se baja a `recommendedTypeChecked`, se cierra en verde y la promoción queda como deuda con el número anotado. (Señal favorable: el código ya usa `void recargar()` / `void cerrarSesion()`, como si `no-floating-promises` ya estuviera activo.) |
| El commit de Prettier toca **239 archivos** y arruina `git blame`.                                                                                                                                                       | Commit exclusivo de formato, sin cambios funcionales, registrado en `.git-blame-ignore-revs`; `npm run build` verificado igual antes y después.                                                                                                                                                                                              |
| **`import-x/order` con el grupo `type`** no clasifica los `import type` como espera la convención del repo ("tipos al final") y `--fix` reordena medio repo mal.                                                         | Confirmar el comportamiento del grupo `type` en `eslint-plugin-import-x@4` al instalar, sobre 2-3 archivos, **antes** de correr `--fix` global (Bloque A′). Si no se comporta, se cae al orden por defecto y se quita "tipos al final" de la convención escrita (una de las dos tiene que ceder).                                            |
| El type-aware de `typescript-eslint` sobre `.astro` tiene limitaciones conocidas y puede fallar o dar falsos positivos.                                                                                                  | Ya está anotado en `coding-rules.md` §5. Si molesta, `.astro` se lintea sin type-aware (`disableTypeChecked` en su bloque de `files`): las reglas estructurales que importan (`max-lines`) no necesitan tipos.                                                                                                                               |
| El toggle de montos se confunde con un control de **privacidad/seguridad** y alguien asume que un entrenador no puede ver dinero por tenerlo apagado.                                                                    | Se documenta como preferencia visual y **no se le muestra al entrenador**. La barrera real por rol sigue siendo del servidor (specs 09/12: los payloads del entrenador **no traen** montos) y hay un criterio de aceptación de no-regresión sobre eso.                                                                                       |
| Al reemplazar `fmt` por `<Monto>` se cuela un monto sin enmascarar en alguna superficie de lectura.                                                                                                                      | Las superficies están enumeradas una por una en el Bloque F (6 archivos, mapeados contra los 11 que hoy importan `fmt`/`fmtShort`); los 5 restantes son transaccionales y quedan por decisión, no por olvido.                                                                                                                                |
| Existe un `Ficha.tsx` con prop `readOnly` que **no está montado en ningún lado** (el entrenador usa `FichaPlantel`), y su `UniformeTab` sí muestra saldo. Si alguien lo reconecta, filtra dinero al entrenador.          | Fuera del alcance de este spec, pero se registra como **DT-4** en el backlog (código muerto que contradice el spec 09), con paso propio en el Bloque H.                                                                                                                                                                                      |
| El `useEffect` de revalidación del dashboard entra en bucle si `recargar` cambia de identidad en cada render.                                                                                                            | `recargar` ya está envuelto en `useCallback` con deps vacías (`useDashboardData.ts:21-30`), así que es estable. Hay criterio de aceptación explícito sobre "una sola llamada, verificado en la pestaña Red".                                                                                                                                 |
| El `IntersectionObserver` no dispara porque el centinela queda dentro de un contenedor con `overflow` y el `root` por defecto no aplica.                                                                                 | **Verificado:** el admin scrollea el documento; `AdminShell` no tiene contenedor con `overflow` (el único es `Sheet.tsx:27`, que es otra superficie). Si en el futuro se agrega uno, el hook recibe un `root` opcional.                                                                                                                      |
| La ventana se resetea en cada refetch y el usuario pierde el scroll al registrar un pago.                                                                                                                                | El hook resetea por `clave` de filtros, no por identidad del array. Hay criterio de aceptación explícito ("si había 45 filas visibles, quedan 45").                                                                                                                                                                                          |
| Un contador o total termina midiendo la ventana en vez de la lista completa.                                                                                                                                             | Las cuatro superficies afectadas están enumeradas (`ResumenAlumnos`, `SegmentoFiltro`, `CabeceraTotales`, badge de la campana) y hay criterio de aceptación de que dicen 82 y no cambian al hacer scroll.                                                                                                                                    |
| El paginado tapa el problema real: `alumnoAdminPorId` sigue construyendo los 82 alumnos para devolver 1, y eso no lo arregla ninguna ventana de render.                                                                  | Se registra como **DT-3** con su disparador, para que quede visible y no lo entierre el "ya paginamos".                                                                                                                                                                                                                                      |
| Cambiar la semántica de `npm run check` rompe algún flujo que lo daba por sentado (por ejemplo un deploy).                                                                                                               | Hoy `check` no lo corre nadie automáticamente: el build de Vercel ejecuta `astro build`, no `check`. Se verifica que el deploy no lo invoque antes de cambiarlo.                                                                                                                                                                             |

---

## Pendientes del cliente / TODO para Will

- [ ] **`CLAUDE.md` dice usar `/public/logo-temp.png` "mientras llega el SVG"** — ese archivo **no existe** y el SVG **sí** (`public/images/chuter-logo.svg`, ya en uso por `AdminNav.tsx`). Confirmar que el SVG actual es el definitivo para poder cerrar ese pendiente de `CLAUDE.md`.
- [x] **Confirmar el umbral de `strictTypeChecked`** (~40 hallazgos) — **confirmado por Will (2026-08-07)**: se aplica el umbral escrito. Medido, `strict` dejaba 563 hallazgos, así que se cerró en `recommendedTypeChecked` y la promoción quedó como DT-5.
- [ ] **Confirmar la lista de montos ocultables**, en especial la exclusión de las pantallas transaccionales (Registrar pago, abono de uniforme, aviso de hermano) — es una decisión de producto, no técnica.

---

## Lo que **NO** entra en este spec

- HU-7.3 (gestionar tarifas/cuotas) y HU-8.2 (exportar cartera) — las dos HU que siguen abiertas al cerrar este spec.
- Paginado en servidor, búsqueda en SQL, endpoint de agregados y el arreglo de `alumnoAdminPorId` (DT-3). Disparador: >300 activos o >200 KB.
- Virtualización real del DOM (`react-window` o similar).
- Paginar Uniformes, Plantel del entrenador y Equipo.
- Husky / lint-staged / pre-commit, y ESLint en CI o en el build de Vercel.
- `eslint-plugin-jsx-a11y` y la deuda de accesibilidad de la landing (a11y 90, anotada en el spec 15).
- Refactorizar los 34 componentes JSX de más de 60 líneas.
- Ocultar montos en Registrar pago, en el abono de uniforme, en el aviso de hermano o en el recibo de WhatsApp.
- PIN, biometría o cualquier control de acceso asociado al toggle de montos.
- El email del club en la tarjeta y el toggle de montos para el entrenador.
- Mover `useDashboardData` dentro de `<Dashboard>`, o revalidar por `focus`/`visibilitychange`.
- Reconectar o borrar el `Ficha.tsx` muerto (DT-4).
- Cualquier migración de schema, Action nueva o cambio de regla de negocio.

Cada uno, si llega, va en su propio spec.
