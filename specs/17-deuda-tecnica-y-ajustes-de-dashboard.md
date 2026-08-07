# SPEC 17 — Deuda técnica del cierre y tres ajustes de lectura del Dashboard

> **Estado:** Implementado y verificado en vivo con las dos sesiones (admin y entrenador) · **Depende de:** SPEC 03 (shell del admin, `AdminNav` y pantalla "Más"), SPEC 09 (app del entrenador y la regla de que **no ve dinero**), SPEC 11 (persistencia de alumnos/cartera y el servicio de dashboard), SPEC 14 (retiro de alumnos), SPEC 16 (de donde salen las tres deudas y el primitivo `<Monto>`) · **Fecha:** 2026-08-07
> **Objetivo:** Saldar las **tres deudas técnicas abiertas** que dejó el cierre del back-office (DT-3, DT-4, DT-5) y corregir **tres defectos de lectura** que aparecieron al recorrer el admin con datos reales: el Dashboard lista los cumpleaños del año entero, el gráfico de recaudo no dice cuánto recaudó cada mes, y "Cerrar sesión" está enterrado en "Más" cuando en desktop hay una barra lateral con el pie vacío.

---

## Por qué existe este spec

Los seis puntos comparten naturaleza —**cero migración de datos, cero regla de negocio nueva**— y ninguno justifica un spec propio. Tres vienen anotados del spec 16; los otros tres los encontró Will usando el admin en producción, que es exactamente el tipo de defecto que no aparece en una revisión estática:

| #   | Punto                                                     | Origen                     | Prioridad |
| --- | --------------------------------------------------------- | -------------------------- | --------- |
| 1   | **DT-3** · `alumnoAdminPorId` arma los 82 para devolver 1 | backlog (spec 16)          | `Should`  |
| 2   | **DT-4** · `Ficha.tsx` readOnly muerto que filtra dinero  | backlog (spec 16)          | `Should`  |
| 3   | **DT-5** · Promover ESLint a `strictTypeChecked`          | backlog (spec 16)          | `Could`   |
| 4   | **DT-6** · "Próximos cumpleaños" no tiene ventana         | Will, verificación en vivo | `Should`  |
| 5   | **DT-7** · "Recaudo por mes" sin valores                  | Will, verificación en vivo | `Should`  |
| 6   | **HU-7.7** · Cerrar sesión en la barra lateral            | Will, verificación en vivo | `Should`  |

DT-4 es el único con riesgo de negocio real: es código muerto que **contradice** una regla del spec 09.

---

## Decisión mayor: DT-5 se promueve, y el número del backlog estaba mal

### Lo que se midió (2026-08-07)

Se corrió ESLint sobre el repo actual con `strictTypeChecked` en lugar de `recommendedTypeChecked`, sin tocar nada más de `eslint.config.js`:

| Regla                                              | Hallazgos | ¿Autofijable?             |
| -------------------------------------------------- | --------- | ------------------------- |
| `@typescript-eslint/no-confusing-void-expression`  | 88        | **sí**                    |
| `@typescript-eslint/restrict-template-expressions` | 44        | no                        |
| `@typescript-eslint/no-deprecated`                 | 28        | no                        |
| `@typescript-eslint/no-unnecessary-condition`      | 24        | parcial                   |
| `@typescript-eslint/restrict-plus-operands`        | 2         | no                        |
| **Total**                                          | **186**   | **88 con fix automático** |

**186, no 563.** El backlog y el comentario de `eslint.config.js:26` dicen 563. No puedo reconstruir con certeza de dónde salió ese número; la hipótesis más probable es que se midió **antes** de fijar la lista final de `ignores` (que saca `src/components/ui/**`, `references/`, `admin-design-system-*/` y `.playwright-cli/`) y **antes** del autofix de imports del Bloque A′. Sea cual sea la causa, **la cifra escrita no es reproducible hoy** y este spec la corrige en los dos lugares donde está.

### Qué se concluye

Con 88 hallazgos que se arreglan solos y **23 de los 186 concentrados en un único archivo** (`src/content.config.ts`, todos por el mismo `import { z } from 'astro:content'` que Astro 6 deprecó y que `.claude/rules/coding-rules.md` §0 ya tenía anotado como migración pendiente), el trabajo real es mucho menor que el conteo bruto. Los otros 95 archivos promedian **menos de 2 hallazgos cada uno**.

El umbral escrito en el spec 16 era ~40 y 186 lo supera, pero ese umbral se fijó para decidir si la promoción entraba **dentro** de aquel spec. Aquí es el objeto del spec, y de paso salda la migración de `astro:content` → `astro/zod` gratis.

### Recomendación

**Promover a `strictTypeChecked`** en un bloque propio, en este orden: autofix → `content.config.ts` → el resto por regla. Si al terminar quedara alguna regla con una cola larga de falsos positivos, se desactiva **esa regla puntual** con comentario justificado, no se revierte el preset entero.

---

## Decisión mayor: la ficha readOnly se borra, no se arregla (DT-4)

`src/features/admin/screens/ficha/Ficha.tsx` acepta `readOnly` y ramifica en cuatro lugares (`seccionesVisibles`, `tabInicial`, `FichaHeader`, `TabsFicha`), pero **ningún call site lo pasa**: `VistaDetalle.tsx:31` monta `<Ficha>` sin la prop, y el entrenador usa `FichaPlantel` (`screens/plantel/`), que es otro componente. Verificado por búsqueda de `readOnly` en todo `src/`: los únicos usos vivos son comentarios que describen una ficha readOnly que no existe.

**Se borra la rama, no el archivo.** `Ficha.tsx` es la ficha del admin y se queda; lo que sale es la prop `readOnly` y sus cuatro ramas, más los comentarios que anuncian un modo inexistente. _Por qué borrar y no reconectar:_ el entrenador **ya tiene** su ficha (`FichaPlantel`, alimentada por `useAlumnosPlantel` con un contrato sin dinero, spec 09). Mantener una segunda ruta hacia la ficha del admin —cuyo `UniformeTab` **sí** muestra saldo— es exactamente el escenario que HU-6.9 prohíbe, y el gate de rol (`router/gate.ts:5`) hoy documenta lo contrario de lo que hace.

> **Nota:** `router/gate.ts` deja `ficha` entre las vistas montables por el entrenador "en modo readOnly". Como ese modo desaparece, hay que verificar contra qué componente resuelve esa ruta para el entrenador y corregir el comentario o el gate. Es el punto más delicado del spec: si el entrenador puede navegar a `/admin/alumnos/:id` y ahí se monta la `Ficha` del admin, hoy **ya** está viendo saldo de uniforme.

---

## Decisión mayor: DT-3 se arregla con las queries que ya existen

`alumnoAdminPorId` (`src/lib/services/alumnos.ts:144`) llama a `construirAlumnos(hoy, true)`: tres queries full-table (`listarAlumnos`, `pagosPorAnio`, `todosUniformes`) más el armado en memoria de los 82 alumnos, para después hacer `.find()` y descartar 81.

Los repos **ya tienen las tres queries puntuales** —`alumnoPorId`, `pagosDeAlumno(alumnoId, anio)`, `uniformesDeAlumno(alumnoId)`— y `aAlumno()` (`services/mapea-alumno.ts`) ya recibe todo por parámetro. El único dato que falta es `hermanos`, que hoy sale de `conteoHermanos(rows)` sobre la lista completa.

**Solución para hermanos:** una query nueva en el repo que traiga **solo la columna `acudiente`** de todos los alumnos (activos y retirados, igual que hoy) y se cuente en memoria con `normaliza()`. _Por qué no contar en SQL:_ `normaliza()` baja a minúsculas y quita tildes en JS; replicar esa semántica en SQL abriría la puerta a que la ficha y la lista discrepen en el conteo de hermanos, que es lo que decide el descuento de uniforme (R9). Una columna × 82 filas es irrelevante frente a las tres tablas completas que se cargan hoy.

---

## Alcance

### Entra

- **DT-3:** `alumnoAdminPorId` consulta solo el alumno pedido. Nueva query `acudientesDeAlumnos()` en `repos/alumnos.ts`. `construirAlumnos` no cambia (lo usan la lista y el dashboard).
- **DT-4:** se elimina la prop `readOnly` de `Ficha.tsx`, `FichaHeader.tsx` y `TabsFicha.tsx`, y se documenta que la ficha del entrenador es `FichaPlantel`. Se revisa `router/gate.ts`.
- **DT-5:** `eslint.config.js` pasa a `strictTypeChecked`; `npm run lint` queda en verde. Incluye la migración de `src/content.config.ts` a `astro/zod`.
- **DT-6:** "Próximos cumpleaños" muestra solo los de los **próximos 30 días**, con estado vacío cuando no hay ninguno.
- **DT-7:** cada barra de "Recaudo por mes" muestra su monto, **enmascarado por el toggle de montos** (spec 16).
- **HU-7.7:** "Cerrar sesión" aparece al pie de la barra lateral de desktop, y **se mantiene** en "Más" para mobile.

### No entra

- **Paginado en servidor de `alumnos.listar`** — DT-3 arregla la ruta de la ficha, no el contrato de la lista. El disparador escrito (>300 alumnos activos o >200 KB de payload) sigue sin cumplirse: hoy son 82 y ~55 KB.
- **Rediseñar el gráfico de recaudo** (tooltips, eje Y, librería de charts) — solo se agrega la etiqueta de valor.
- **Cambiar el diseño de la tab bar de mobile** — el cierre de sesión de mobile se queda donde está.
- **HU-7.3** (gestionar tarifas) y **HU-8.2** (exportar cartera) — siguen siendo `Could` sin abrir.

---

## Contratos que cambian

```ts
// src/actions/alumnos.ts  (nuevo, registrado en src/actions/index.ts)
// Solo admin (el contrato lleva dinero). Incluye retirados (spec 14).
porId: (input: { id: number }) => Promise<{ alumno: Alumno | undefined }>;

// src/lib/db/repos/alumnos.ts  (nuevo)
// Solo la columna `acudiente`, todos los alumnos (activos y retirados).
acudientesDeAlumnos(): Promise<string[]>;

// src/lib/services/alumnos.ts  (misma firma, implementación puntual)
alumnoAdminPorId(id: number, hoy: Date): Promise<Alumno | undefined>;

// src/lib/domain/cumples.ts  (parámetro nuevo, con valor por defecto)
proximosCumples(
  alumnos: readonly AlumnoConFecha[],
  hoy: Date,
  ventanaDias = 30,
): Cumple[];
```

`DashboardStats.cumples` **no cambia de tipo** — cambia cuántos elementos trae. `Cumple` ya expone `dias`, así que el filtro es `c.dias <= ventanaDias` y no requiere dato nuevo.

> **Dónde se aplica la ventana:** en `proximosCumples` (dominio puro, testeable), no en `ProximosCumples.tsx`. La UI no decide reglas; además así el payload de `dashboard.stats` deja de cargar 82 objetos que nadie iba a pintar.

---

## Plan de implementación

### Bloque A — DT-4: borrar la ficha readOnly muerta

1. Verificar a qué componente resuelve la ruta `ficha` **para un usuario entrenador** (`router/gate.ts`, `EntrenadorApp.tsx`, `VistaDetalle.tsx`). Si resuelve a `Ficha`, es un hallazgo de seguridad de datos: se corrige el gate y se anota en el spec.
2. Eliminar la prop `readOnly` y sus ramas en `Ficha.tsx` (`seccionesVisibles`, `tabInicial`, `TABS_READONLY`), `FichaHeader.tsx` y `TabsFicha.tsx`.
3. Actualizar los comentarios que mencionan "ficha readOnly": `hooks/useAlumnosPlantel.ts:8`, `hooks/useUniformesEntrenador.ts:8`, `router/gate.ts:5`. La ficha del entrenador es `screens/plantel/FichaPlantel.tsx` y así queda escrito.
4. Verificar con sesión de entrenador que el plantel y su ficha siguen funcionando y que no aparece ningún monto.

### Bloque B — DT-3: ficha puntual

5. `repos/alumnos.ts`: agregar `acudientesDeAlumnos()`.
6. `services/alumnos.ts`: reescribir `alumnoAdminPorId` sobre `alumnoPorId` + `pagosDeAlumno` + `uniformesDeAlumno` + el conteo de hermanos, en un solo `Promise.all`. Devuelve `undefined` si el alumno no existe (mismo contrato de hoy).
7. Verificar contra la ficha de un alumno **con hermano** que el descuento de uniforme sigue igual que antes del cambio, y contra un **alumno retirado** que su ficha sigue abriendo.

### Bloque C — DT-6: ventana de 30 días

8. `lib/domain/cumples.ts`: parámetro `ventanaDias = 30` y filtro por `dias`.
9. `ProximosCumples.tsx`: estado vacío cuando la lista llega vacía ("Sin cumpleaños en los próximos 30 días"), en la línea visual de los otros estados vacíos del admin.
10. Verificar en el Dashboard que quedan los del mes en curso y no los 82.

### Bloque D — DT-7: valores en el gráfico

11. `RecaudoPorMes.tsx`: etiqueta de monto sobre cada barra con `<Monto valor={d.total} corto />` — **no** con `fmt` directo, para que el toggle de ocultar montos la enmascare como el resto del Dashboard.
12. Cuidar el layout: la altura de la barra hoy sale de `height: 110` menos el label del mes; agregar una línea arriba obliga a recalcular para que no se corte ni cambie la altura de la card. Los meses sin recaudo (`total: 0`) muestran `$0`, no vacío.
13. Verificar a 320px que las 8–11 columnas siguen entrando sin scroll horizontal.

### Bloque E — HU-7.7: cerrar sesión en la barra lateral

14. `AdminNav.tsx` → `Sidebar`: bloque `admin-sidebar__footer` después de `<nav>`, con el nombre del usuario, su rol y el botón de cerrar sesión con icono `log-out`. `.admin-sidebar__nav` ya tiene `flex: 1`, así que el pie se ancla abajo sin trucos.
15. `styles/layout.css`: estilos del footer dentro del `@media (min-width: 1024px)` que ya existe — separador superior sutil, mismo tratamiento de hover que `__link`, y el rojo del design system para el botón (tokens `--error` / `--error-soft`, los mismos que usa hoy el botón de "Más"). Sobre navy oscuro hay que verificar el contraste real; si `--error-deep` no da AA, se usa el borde y el texto claro en vez del relleno.
16. `AdminNav` necesita `userName`, `role` y el logout: pasarlos por props desde `AdminShell`/`AdminApp` reutilizando `useLogout()`. **No** duplicar la llamada a `signOut`.
17. `MasMenu.tsx` y `MasEntrenador.tsx` **se quedan como están**: en mobile la barra lateral es `display: none` (`layout.css:89`), así que quitarlo de "Más" dejaría al admin sin forma de cerrar sesión en el celular, que es el dispositivo principal del club.

### Bloque F — DT-5: promoción de ESLint

18. `eslint.config.js`: `recommendedTypeChecked` → `strictTypeChecked`, y corregir el comentario de las líneas 25-27 con el número real.
19. `npx eslint . --fix` → resuelve los 88 de `no-confusing-void-expression`. Revisar el diff, no confiar a ciegas.
20. `src/content.config.ts`: migrar `import { z } from 'astro:content'` a `astro/zod` (23 hallazgos de `no-deprecated` en un solo cambio). Cierra también la nota de migración de `coding-rules.md` §0.
21. El resto por regla: `restrict-template-expressions` (44), `no-unnecessary-condition` (24), `no-deprecated` restantes (5, incluido `FormEvent` en `useContactForm.ts:22`), `restrict-plus-operands` (2).
22. `npm run check` en verde. Si alguna regla deja una cola de falsos positivos, se desactiva **esa** regla con comentario justificado; no se revierte el preset.

### Bloque G — Documentación y cierre

23. `docs/backlog.md`: marcar DT-3, DT-4 y DT-5 como ☑ citando este spec; **corregir el 563 → 186**; agregar HU-7.7 al EPIC 7 y DT-6/DT-7 como resueltas de origen.
24. `.claude/rules/coding-rules.md`: §5 pasa a `strictTypeChecked`; borrar la nota de migración de `astro:content` de §0 (ya hecha).
25. `docs/ARCHITECTURE.md`: §9 (tooling) y la sección de la ficha del entrenador.
26. Marcar el criterio pendiente del **spec 16** ("confirmar la lista de montos ocultables") como cerrado: **Will lo confirmó el 2026-08-07** — las pantallas transaccionales (Registrar pago, `HojaAbono`, `AvisoHermano`, recibo de WhatsApp) **no** se enmascaran.

---

## Lo que se encontró al ejecutar (2026-08-07)

Cinco cosas que el plan no anticipaba. Se dejan escritas porque tres de ellas eran defectos reales:

0. **DT-3 señalaba la función equivocada — y la deuda era peor de lo escrito.** El backlog decía que "cada apertura de una Ficha paga el costo íntegro" a través de `alumnoAdminPorId`. Al ir a verificarlo en vivo apareció que **`alumnoAdminPorId` no la llamaba nadie**: era código muerto, igual que la ficha de DT-4. El costo real lo pagaba `useAlumno`, que pedía `alumnos.listar({incluirRetirados:true})` —**los 97 alumnos completos**— y hacía el `.find()` **en el cliente**. Optimizar la función muerta no habría mejorado nada. Se cerró de verdad: **action nueva `alumnos.porId`** (solo admin, incluye retirados) montada sobre la función ya optimizada, y `useAlumno` la consume. Medido en vivo: el payload de abrir una ficha pasó de **49.822 a 617 bytes (80×)**.

1. **DT-4 no era una fuga de datos.** El riesgo estaba planteado como "si el gate deja pasar al entrenador a la `Ficha` del admin, ya está viendo saldo". No pasa: el corte por rol ocurre **antes del router** (`AdminApp.tsx:30` retorna `<EntrenadorApp>` y termina ahí), así que `VistaDetalle` —único call site de `<Ficha>` en todo `src/`— solo se monta para el admin. Lo único falso era el comentario del gate. Se verificó **antes** de tocar código, como mandaba el Bloque A.

2. **La cifra de DT-5 estaba mal por 3×** (563 → 186), y el trabajo real era aún menor: 88 autofijables y 23 de un solo import.

3. **`ProgramCard.astro` tenía un cast mentiroso** (bug real, sitio público). `iconMap[icono as keyof typeof iconMap] ?? Trophy`: `icono` es `z.string()` del frontmatter, o sea string libre, pero el cast le prometía a TS que siempre era una clave válida — por eso el linter marcaba el `??` como innecesario. Borrarlo (la lectura ingenua del hallazgo) habría hecho que **cualquier typo en un `.md` renderizara un componente indefinido**. Se arregló el tipo (`Record<string, typeof Trophy | undefined>`) y el fallback quedó legítimo.

4. **El gráfico de recaudo mentía en su propio layout.** `height: 110` con `box-sizing: border-box` y padding dejaba 76px de contenido para piezas que sumaban 106: el `flex-shrink` por defecto venía **aplastando las barras**, que topaban en 42px y no en los 78 que decía el código. Se corrigió con `flexShrink: 0` y un presupuesto honesto; la card mide lo mismo que antes (188,5px).

5. **`rutas.ts` y `gestos-zoom.ts` tenían tipos demasiado optimistas.** `pathname.split('/')` da `string[]` y sin `noUncheckedIndexedAccess` TS cree que los segmentos siempre existen, cuando `/admin` los deja en `undefined`: borrar esas guardas —lo que sugería el hallazgo— **rompía el routing del dashboard**. Se arreglaron los tipos, no las guardas. Mismo patrón en `gestos-zoom.ts`, donde un `as HTMLElement` volvía "innecesario" un `?.` que sí hacía falta.

> **Regla que se llevó de acá:** en `no-unnecessary-condition`, el hallazgo casi nunca dice "borrá la guarda" — dice "tu tipo miente". Quedó escrito en `.claude/rules/coding-rules.md` §5.

---

## Cambio de alcance pedido en ejecución: etiquetas del gráfico a 45°

Will vio el gráfico ya con los valores puestos y reportó que **en mobile las cifras quedaban demasiado apretadas**: la primera implementación las mantenía horizontales y, para que entraran 11 columnas en 320px, bajaba la fuente hasta 6,5px — ilegible.

**Resuelto rotando la etiqueta -45° en mobile** (horizontal en desktop ≥1024px, donde la columna mide ~88px y sobra ancho). Al dejar de competir por el ancho de columna, la fuente sube a **10px**. Como `transform` no ocupa espacio en el flujo, la altura del texto rotado se reservó a mano: se midió el texto real en el navegador con la fuente real (`"$4.10M"` = 34,13 × 11px), y a 45° la altura proyectada es (34,13 + 11) × 0,707 ≈ **32px**. El `<span>` va absoluto y centrado sobre su propia barra, así que el bbox rotado no se corre a la vecina. Verificado a 320px (incluido el peor caso forzado de 11 columnas con `"$4.10M"` en todas), 375px y desktop: sin solape, sin recorte y `scrollWidth = 320`.

---

## Criterios de aceptación

### DT-3 · Ficha puntual

- [x] Abrir una ficha **no** ejecuta `listarAlumnos` completo, `pagosPorAnio` ni `todosUniformes`; consulta el alumno, sus pagos, sus uniformes y la columna de acudientes. Verificado en vivo: recargar `/admin/alumnos/38` dispara **una sola** petición, `alumnos.porId`, de **617 bytes** contra los **49.822** de `alumnos.listar`.
- [x] La ficha de un alumno **con hermano** muestra el mismo descuento de uniforme que antes del cambio. Verificado exhaustivamente contra la base real: se comparó `JSON.stringify` del objeto de la lista contra el de la ficha para **los 97 alumnos** (82 activos + 15 retirados), **0 diferencias**, incluidos los **17 con hermanos** (hasta 3 por acudiente).
- [x] La ficha de un alumno **retirado** sigue abriendo con su historial (spec 14) — entra en la comparación de los 97.
- [x] Un `:id` inexistente sigue mostrando "Alumno no encontrado" (la action devuelve `alumno: undefined`, mismo contrato).
- [x] `construirAlumnos`, la lista de Alumnos y el Dashboard no cambian de comportamiento.

### DT-4 · Ficha readOnly

- [x] No queda ninguna referencia a `readOnly` en `screens/ficha/**` (verificado por búsqueda en todo `src/`).
- [x] Está documentado en código que la ficha del entrenador es `FichaPlantel` (`gate.ts`, `useAlumnosPlantel.ts`, `useUniformesEntrenador.ts`).
- [x] **Extra:** los tres callbacks pasaron de opcionales a requeridos, para que el compilador impida montar la ficha con botones inertes.
- [x] Con sesión de **entrenador**, ninguna ruta alcanzable muestra un monto (no-regresión de HU-6.9). **Verificado en vivo** (René Torres, 2026-08-07): barrido de 8 rutas (`/admin`, `entrenos`, `alumnos`, `alumnos/:id`, `mas`, `cartera`, `uniformes`, `equipo`) buscando `$`, montos con miles y vocabulario de cartera (mora, cuota, saldo, pagado, abono, recaudo, deuda) → **0 coincidencias**. Las rutas con dinero redirigen a `/admin/entrenos`. La prueba fuerte: la ficha de **ANGEL GUERRERO** —que en el Dashboard del admin figura con 3 meses y $150.000— muestra al entrenador solo contacto, hermanos y estado de entrega del uniforme, **sin un solo monto ni estado de pago**. Doble barrera: un `:id` fuera de sus categorías (alumno 38) da "Alumno no encontrado".
- [x] Con sesión de **admin**, la ficha conserva sus 3 tabs, acciones y badge de mora. Verificado en vivo sobre la ficha de un alumno real (tabs Pagos/Uniforme/Acudiente, "Registrar pago", "WhatsApp", "Retirar alumno", "1 mes" de mora).

### DT-5 · ESLint estricto

- [x] `eslint.config.js` usa `strictTypeChecked` y `npm run lint` sale **en verde**.
- [x] `src/content.config.ts` importa `z` de `astro/zod`.
- [x] Ninguna regla quedó desactivada. Las **5 supresiones puntuales** (`eslint-disable-next-line`) llevan motivo escrito y son todas de la misma clase: el tipo no refleja el runtime. Cero `any`, cero `@ts-ignore`, cero desactivaciones a nivel de archivo.
- [x] El comentario de `eslint.config.js`, `docs/backlog.md` y `.claude/rules/coding-rules.md` citan **186**, no 563. El spec 16 quedó anotado con la corrección.

### DT-6 · Ventana de cumpleaños

- [x] El Dashboard muestra únicamente los cumpleaños de los **próximos 30 días**. Verificado en vivo: de 82 tarjetas a **7**, corta en el 4 de septiembre (28 días) y deja fuera el 7 de septiembre (31).
- [x] El filtro vive en `lib/domain/cumples.ts` (`VENTANA_CUMPLES_DIAS`), no en el componente.
- [x] Sin cumpleaños en la ventana, se muestra un estado vacío y no una sección en blanco. No es observable hoy (hay 7), así que se verificó el dominio contra los tres escenarios que lo disparan —lista vacía, solo alumnos sin fecha, solo alumnos fuera de ventana— y los tres devuelven `[]`, que es lo que activa el early return del componente.
- [x] Se sigue ignorando a los alumnos sin fecha de nacimiento y a los retirados. Verificado contra la base real: de **15 sin fecha** y **15 retirados**, **0 aparecen** en los cumples del Dashboard; el máximo real es de 28 días, dentro de la ventana de 30.

### DT-7 · Valores del gráfico

- [x] Cada barra muestra su monto recaudado, con el formato corto de `fmtShort` (`$0 · $0 · $2.20M · $2.70M · $2.60M · $2.25M · $1.90M · $50k`).
- [x] Con el toggle de montos **apagado**, las etiquetas se enmascaran como `$•••` junto al resto del Dashboard. Verificado en vivo apagando la preferencia.
- [x] La card no crece ni se desborda a 320px (`scrollWidth = 320`, card de 110px), y los meses en cero muestran `$0`.
- [x] **Corregido tras verlo en desktop:** la banda de 32px que necesita la cifra rotada dejaba las barras flotando en una card alta cuando el texto va horizontal. La altura de la barra pasó de píxeles a **porcentaje de su zona**, de modo que el reparto vertical lo decide el CSS: mobile mantiene 110px con banda de 32, y desktop usa 150px con banda de 18. Una sola fuente de medidas, sin constantes duplicadas por viewport.

### HU-7.7 · Cerrar sesión en la barra lateral

- [x] En desktop (≥1024px) el pie de la barra lateral muestra usuario, rol y "Cerrar sesión", anclado abajo aunque la lista de tabs sea corta. Verificado con sesión real ("Camilo Andrade · ADMINISTRADOR").
- [x] El botón cierra la sesión de verdad y redirige a `/admin/login`. Verificado en vivo pulsándolo desde el sidebar. Aplica también al **entrenador**, cuyo pie muestra "René Torres · ENTRENADOR".
- [x] En mobile "Más" **conserva** su botón de cerrar sesión (`MasMenu.tsx` y `MasEntrenador.tsx` sin cambios funcionales).
- [x] Contraste del botón sobre el navy del sidebar ≥ AA: `--error-deep` daba 3,1:1, así que se usa variante de borde con `color-mix` sobre `--error` → **≈8,2:1** (AA y AAA). Foco visible con outline dorado.
- [x] Hay **una sola** implementación de logout (`hooks/useLogout.ts`), consumida por `SidebarFooter`, `MasMenu` y `MasEntrenador`.

### Calidad y no-regresión

- [x] `npm run check` (0 errores, 0 warnings sobre 305 archivos) y `npm run build` en verde.
- [x] Ningún archivo supera 200 líneas; cero `any`. `npm run format` aplicado.
- [x] **Sitio público sin regresión** (11 archivos tocados por la promoción de ESLint): las 7 tarjetas de categoría renderizan con su icono y el formulario sigue calculando la categoría sugerida al escribir la fecha ("✓ Categoría: Benjamín · SUB 8" para un nacido en 2018).
- [x] Verificación en vivo con sesión de **admin** (Will la abrió el 2026-08-07): Dashboard, gráfico con y sin montos, sidebar en desktop, lista de alumnos y ficha. Sitio público verificado aparte.
- [x] Verificación en vivo con sesión de **entrenador** (Will facilitó el acceso): plantel, ficha de un alumno moroso, "Más" y las rutas bloqueadas. Ningún monto visible.

---

## Riesgos identificados

| Riesgo                                                                                                                                 | Mitigación                                                                                                                                                       |
| -------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **El entrenador ya alcanza la `Ficha` del admin** por el gate, y el borrado de `readOnly` lo deja viendo saldo en vez de arreglarlo.   | El Bloque A **empieza** verificando esa ruta con sesión real de entrenador, antes de tocar código. Si el gate la permite, se corrige el gate en el mismo bloque. |
| `alumnoAdminPorId` puntual calcula **distinto** el conteo de hermanos y cambia un descuento de uniforme sin que nadie lo note.         | Se reusa `normaliza()` y el mismo conjunto de filas (activos + retirados). Criterio de aceptación explícito sobre un alumno con hermano, comparado contra hoy.   |
| `--fix` de ESLint toca 88 sitios y cuela un cambio de semántica (`no-confusing-void-expression` reescribe cuerpos de arrow functions). | El autofix va en un commit propio, separado de los arreglos a mano, y se revisa el diff archivo por archivo antes de commitear.                                  |
| La etiqueta de monto rompe la altura del gráfico o se solapa con barras cortas.                                                        | Se recalcula la altura disponible en el mismo cambio y se verifica a 320px, el ancho donde el spec 16 ya encontró un defecto de layout.                          |
| El rojo del botón de logout no contrasta sobre el navy del sidebar.                                                                    | Criterio de aceptación de contraste AA; si no da, variante de borde en vez de relleno.                                                                           |
| La base de producción es la única base (no hay entorno de pruebas).                                                                    | Todos los cambios de este spec son de **lectura** salvo ninguno: no hay migración, no hay escritura nueva. Aun así, verificar sin registrar pagos reales.        |

---

## Pendientes del cliente / TODO para Will

- [x] Nada de este spec depende del cliente. Los pendientes vigentes siguen siendo fotos y bios de los formadores.
- [x] Recorrer la app con una sesión de entrenador — hecho el 2026-08-07 con el usuario de René Torres.

---

## Lo que **NO** entra en este spec

- Paginado en servidor de `alumnos.listar` (el disparador de DT-3 sigue sin cumplirse: 82 alumnos, ~55 KB).
- Rediseño del gráfico de recaudo: tooltips, eje Y, o cualquier librería de charts.
- Mover el cierre de sesión fuera de "Más" en mobile.
- HU-7.3 (tarifas configurables) y HU-8.2 (exportar cartera).
- Cerrar los puntos de Lighthouse (`PageBoot`, foto del hero): pide decisiones de diseño, va aparte.
