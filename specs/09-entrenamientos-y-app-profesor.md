# SPEC 09 — Entrenamientos + app del Profesor (mock)

> **Estado:** Aprobado · **Depende de:** SPEC 03 (shell, DS, mock), SPEC 04 (roles admin/entrenador, `cats` por usuario), SPEC 05 (routing por URL, alumnos/ficha), SPEC 08 (ficha/uniforme, patrón Sheet) · **Fecha:** 2026-07-12
> **Objetivo:** Darle al entrenador su app propia — plan semanal (tema + objetivos), sesiones por día con la planeación de TactalPad como imagen y asistencia (pasar lista), plantel de sus categorías y ficha de alumno en solo lectura sin datos de dinero — y al admin la vista de solo lectura de lo que registran los profesores, sobre el store mock.

---

## Por qué existe este spec

El prototipo evolucionó respecto al backlog: EPIC 6 (HU-6.1/6.2) habla de "planificación por día y categoría" editada por admin/formador, pero el prototipo vigente (`references/mobile/ProfesorApp.js`, `Entrenos.js`, `Extras.js`) modela **semanas con historial**, **sesiones por profesor** con **asistencia (pasar lista)** — concepto que no existe en ninguna HU — y reparte responsabilidades: **el profesor registra, el admin solo lee**. Además, el backlog aún dice "Administrador — único rol en v1", pero el rol entrenador existe desde el spec 04 y hoy solo ve un placeholder (`EntrenadorHome.tsx`).

A eso se suma el formato real del club (Excel de planeación, confirmado por Will 2026-07-12): la planeación es **semanal** por entrenador (cabecera con tema y objetivos), la **Activación muscular** y la **Vuelta a la calma** son **fijas** (oración, charla, estiramiento, calentamiento / estiramientos, charla de mejoramiento, despedida de motivación), y lo único que varía es la **Parte central de cada día**, que los entrenadores planean en **TactalPad** y queda como **una imagen por día** (Lun/Mié/Vie). Este spec construye ese modelo y actualiza las HUs desactualizadas.

---

## Alcance

**Dentro:**

- **Dominio** (`src/lib/domain/entrenos.ts`, funciones puras):
  - `DIAS_ENTRENO = ['Lunes', 'Miércoles', 'Viernes']` y generación de la **semana viva** + ~3 semanas pasadas (etiquetas tipo "8 – 12 jun", la actual marcada; fecha inyectable).
  - **Fases fijas** como constantes presentacionales: `FASE_ACTIVACION` (Oración, Charla de bienvenida, Estiramiento, Calentamiento) y `FASE_VUELTA_CALMA` (Estiramientos, Charla de mejoramiento, Despedida de motivación) — se muestran, no se digitan.
  - `asistenciaDe(sesion, roster)` → `{ presentes, ausentes, total, pct }` (presentes = roster − ausentes).
  - `rosterDe(cats, alumnos)` → alumnos cuyas categorías pertenecen al entrenador (comparación normalizada, reusa `normaliza`).
- **Data / store** (`features/admin/data/`):
  - Tipos `Semana`, `PlanSemana` (tema + objetivos por entrenador y semana) y `Sesion` (por día: imagen de parte central + asistencia). Ver modelo de datos.
  - Mock: ~4 semanas, y planes/sesiones de ejemplo en semanas pasadas (para que la vista del admin tenga contenido).
  - Escrituras idempotentes: `guardarPlanSemana(...)` (crea o actualiza tema/objetivos) y `guardarSesion(...)` (crea o actualiza imagen, nota y asistencia del día; marca `registrado`). El mismo contrato sirve para registrar y para corregir historial.
  - Los slots Lun/Mié/Vie de cada semana se **derivan** (no se pre-crean): plan y sesiones existen solo cuando se registraron.
- **Imagen de la parte central (mock-first):** file input con **preview local** (`URL.createObjectURL`); la imagen vive en memoria y **se pierde al recargar, como todo el mock**. La **subida real a Vercel Blob** (compresión cliente a WebP + URL persistida en Neon) queda decidida y documentada, pero se implementa en el spec de persistencia.
- **Router** — nuevas variantes tipadas (mismo patrón `parseRuta`/`rutaAPath`):
  - `{ vista: 'entrenos' }` → `/admin/entrenos` (home del entrenador).
  - `{ vista: 'sesion'; weekId: string; day: string }` → `/admin/entrenos/:weekId/:day` (sesión del día, deep-linkable).
  - `{ vista: 'plantel' }` → `/admin/plantel` (alumnos del entrenador).
  - `{ vista: 'entrenamientos' }` → `/admin/entrenamientos` (vista solo lectura del admin, entrada desde Más).
  - El plan semanal (tema/objetivos) se edita en una **hoja modal (`Sheet`)** desde la home de Entrenos — patrón `HojaEntrega` del spec 08, sin ruta propia.
- **Gate por rol en `AdminApp`:**
  - El entrenador recibe sus `cats` (nueva prop desde la isla; ya viven en la sesión de Better Auth — spec 04) y navega con **tabs propias**: Entrenos / Alumnos (plantel) / Más, **sin FAB**.
  - Vistas de admin (dashboard, cartera, pago, forms, uniformes, equipo, entrenamientos) prohibidas para el entrenador → redirige a `entrenos`. `entrenamientos` es solo-admin.
  - `EntrenadorHome.tsx` (placeholder) **se elimina**.
- **Pantallas del entrenador:**
  - `screens/entrenos/` — tarjeta de sede (Cancha Los Algarrobillos · Lun/Mié/Vie 4:30–6:00 PM), chips de semana, **card del plan semanal** (tema + objetivos, CTA registrar/editar → Sheet), badge "N por registrar" en la semana actual y una DayCard por día (registrada = thumbnail de la parte central + pastilla de asistencia; sin registrar = CTA "Registrar").
  - `screens/sesion/` — sesión del día: fases fijas de Activación arriba y Vuelta a la calma abajo (informativas), **Parte central = subir imagen de TactalPad** (preview local, se puede reemplazar) + nota de texto opcional, lista de asistencia con toggles P/A por alumno y guardar; las semanas pasadas se corrigen con la misma pantalla.
  - `screens/plantel/` — buscador (nombre/acudiente, sin acentos) + segmented con las cats del entrenador + lista; tocar abre la ficha en solo lectura.
  - **Ficha readOnly sin plata** — la `Ficha` existente acepta modo `readOnly`: sin tab **Pagos**, sin botones Registrar pago / Editar / WhatsApp de cobro; el tab Uniforme muestra solo la **entrega** (kit/número/talla), **no** el estado de pago; Acudiente visible.
  - **Más del entrenador** — perfil (nombre, cats), sede y horario, cerrar sesión (variante de `MasMenu`).
- **Vista del admin** (`screens/entrenamientos/`): chips de semana + por entrenador: tema/objetivos de su plan y sus sesiones del día (thumbnail de parte central, pastilla de asistencia); **sin edición**. Entrada "Entrenamientos" en `MasMenu` (solo admin).
- **Docs:** actualizar `docs/backlog.md`: sección de roles (entrenador ya existe, spec 04), reescribir EPIC 6 con las HUs reales (plan semanal, parte central con imagen, asistencia, historial, vista admin readonly, plantel del profesor, ficha sin plata) y marcar HU-6.1/6.2 originales como obsoletas con nota.

**Fuera del alcance (otros specs):**

- **Persistencia real** de planes/sesiones/asistencia (BD, Actions, seed) y la **subida a Vercel Blob** con compresión — al recargar se pierde lo escrito, incluida la imagen.
- **Edición de entrenamientos por el admin** (el prototipo lo prohíbe: "la planificación es responsabilidad del profesor").
- **Estadísticas de asistencia** (histórico por alumno, % del mes, alertas de inasistencia).
- **Rehacer la tarjeta EntrenoDeHoy del dashboard** (sigue leyendo la mock `Training` actual; se cablea al nuevo modelo cuando llegue la persistencia).
- **Notificaciones/recordatorios** al profesor por sesiones sin registrar.

---

## Modelo de datos

Sin persistencia nueva (sigue mock). Los entrenadores y sus `cats` ya viven en la BD real de auth (spec 04); los planes/sesiones viven en el store mock y los alumnos siguen mock.

```ts
// features/admin/data/types.ts
export interface Semana {
  id: string;      // "w-25"
  n: number;       // número de semana
  label: string;   // "8 – 12 jun"
  sub: string;     // "Semana actual" | "Hace 2 semanas"
  current: boolean;
}

// Cabecera del Excel: tema + objetivos por semana y entrenador.
export interface PlanSemana {
  id: string;                 // `${entrenadorId}-${weekId}`
  entrenadorId: string;       // user.id de Better Auth
  entrenadorNombre: string;   // denormalizado (mock); en BD será FK
  weekId: string;
  tema: string;
  objetivos: string;
}

// Un día de entrenamiento: parte central (imagen TactalPad) + asistencia.
export interface Sesion {
  id: string;                 // `${entrenadorId}-${weekId}-${day}`
  entrenadorId: string;
  entrenadorNombre: string;   // denormalizado (mock); en BD será FK
  weekId: string;
  day: string;                // 'Lunes' | 'Miércoles' | 'Viernes'
  parteCentralImg: string | null; // object URL local (mock); URL de Blob al persistir
  parteCentralNota: string;   // texto corto opcional de respaldo
  registrado: boolean;
  ausentes: number[];         // ids de alumnos ausentes
}
```

Router:

```ts
| { vista: 'entrenos' }
| { vista: 'sesion'; weekId: string; day: string }
| { vista: 'plantel' }
| { vista: 'entrenamientos' }
```

---

## Plan de implementación

Cada bloque deja `tsc` + `build` en verde, el marketing intacto y el admin funcional.

### Bloque A — Dominio + data

1. `src/lib/domain/entrenos.ts`: días, fases fijas, generación de semanas (viva + 3 pasadas, fecha inyectable), `asistenciaDe`, `rosterDe`.
2. `data/types.ts` + `data/mock.ts`: tipos `Semana`/`PlanSemana`/`Sesion` y planes/sesiones de ejemplo en semanas pasadas.
3. `data/store.ts`: `guardarPlanSemana` y `guardarSesion` (crear/actualizar, idempotentes) + lecturas.

_Verifica:_ funciones puras correctas para roster multi-categoría y asistencia; el store notifica y no duplica planes/sesiones al guardar dos veces.

### Bloque B — Router + gate por rol

4. Variantes `entrenos`/`sesion`/`plantel`/`entrenamientos` en `parseRuta`/`rutaAPath` (parseo defensivo: semana/día inválidos → `entrenos`).
5. `AdminApp`: prop `cats` del entrenador; tabs propias del entrenador sin FAB; redirects por rol (entrenador fuera de vistas admin → `entrenos`; `entrenamientos` solo admin). Eliminar `EntrenadorHome.tsx`.

_Verifica:_ deep-links montan su vista según rol; un entrenador que pega `/admin/cartera` cae en `/admin/entrenos`; atrás/adelante funcionan.

### Bloque C — Entrenos + sesión del día

6. `screens/entrenos/`: sede, chips de semana, card del plan semanal (tema/objetivos + Sheet de edición), badge "por registrar", DayCards con thumbnail.
7. `screens/sesion/`: fases fijas + imagen de parte central (file input, preview local, reemplazable) + nota opcional + pasar lista P/A + guardar; corrige historial.

_Verifica:_ registrar el plan muestra tema/objetivos en la home; registrar una sesión guarda imagen y asistencia y la DayCard cambia a registrada con thumbnail; una semana pasada se puede corregir; la pastilla de asistencia cuadra (presentes = roster − ausentes).

### Bloque D — Plantel + ficha readOnly

8. `screens/plantel/`: buscador + segmented de cats + lista → ficha.
9. `Ficha` en modo `readOnly`: sin tab Pagos, sin acciones de admin, uniforme solo entrega (sin pago); Más del entrenador.

_Verifica:_ el plantel solo muestra alumnos de las cats del entrenador; la ficha no expone ningún dato de dinero ni permite escrituras; el admin sigue viendo la ficha completa.

### Bloque E — Vista admin + docs

10. `screens/entrenamientos/`: semanas + por entrenador (plan + sesiones con thumbnail y asistencia), solo lectura; entrada en `MasMenu` (solo admin).
11. Actualizar `docs/backlog.md` (roles + EPIC 6 reescrito + HUs obsoletas anotadas).

_Verifica:_ el admin ve lo registrado en la mock; no hay ningún control de edición; el backlog refleja el modelo real.

### Bloque F — Cierre

12. `tsc --noEmit` + `build` en verde, marketing estático, `/admin/**` noindex y fuera del sitemap, ningún archivo > 200 líneas, cero `any`, sin dependencias nuevas, sin scroll horizontal de 320px a desktop en las pantallas nuevas.

---

## Criterios de aceptación

### Routing y roles

- [ ] `/admin/entrenos`, `/admin/entrenos/:weekId/:day`, `/admin/plantel` y `/admin/entrenamientos` cargan directo por URL con sesión activa; sin sesión redirigen a `/admin/login?next=<ruta>`.
- [ ] Un entrenador logueado aterriza en Entrenos (el placeholder "Tu panel está en camino" ya no existe) y sus tabs son Entrenos / Alumnos / Más, sin FAB.
- [ ] Un entrenador que navega a una vista de admin (`/admin/cartera`, `/admin/equipo`, …) es redirigido a `/admin/entrenos`; `/admin/entrenamientos` es solo para admin.

### Plan semanal y sesiones

- [ ] La home muestra sede/horario, chips de semanas (actual + pasadas), la card del plan semanal y una DayCard por día Lun/Mié/Vie.
- [ ] El plan semanal (tema + objetivos) se registra/edita en una hoja modal y se refleja en la home y en la vista del admin.
- [ ] La semana actual muestra el badge "N por registrar" cuando hay sesiones sin registrar.
- [ ] La sesión del día muestra Activación y Vuelta a la calma como fases fijas (no editables) y captura la **imagen de la parte central** con preview local, reemplazable, más una nota opcional.
- [ ] Registrar una sesión guarda imagen/nota + asistencia, marca la DayCard como registrada (con thumbnail) y muestra la pastilla presentes/total con el tono correcto.
- [ ] Una sesión de una semana pasada se puede abrir y corregir (imagen, nota y asistencia).
- [ ] `guardarPlanSemana` y `guardarSesion` son idempotentes: guardar dos veces no duplica ni corrompe.

### Plantel y ficha

- [ ] El plantel lista solo los alumnos de las categorías del entrenador, con buscador (nombre/acudiente, sin acentos) y filtro por categoría.
- [ ] La ficha en modo readOnly no muestra el tab Pagos, ni estados de mora/cuota, ni el estado de pago del uniforme, ni botones de escritura; sí muestra datos del alumno, entrega de uniforme y acudiente.
- [ ] Para el admin, la ficha sigue exactamente como en los specs 05–08.

### Vista del admin

- [ ] Desde Más (solo admin) se abre Entrenamientos: por semana y entrenador se ven tema/objetivos del plan y las sesiones (thumbnail + asistencia).
- [ ] No existe ningún control de edición en esa vista.

### Docs

- [ ] `docs/backlog.md` actualizado: rol entrenador documentado, EPIC 6 reescrito con las HUs del modelo real (plan semanal, imagen, asistencia) y HU-6.1/6.2 originales marcadas obsoletas con nota y fecha.

### Calidad y no-regresión

- [ ] Ningún archivo > 200 líneas; cero `any`; sin dependencias nuevas; `tsc --noEmit` + `build` en verde.
- [ ] Marketing estático; `/admin/**` noindex y fuera del sitemap.
- [ ] De 320px a desktop: cero scroll horizontal en las pantallas nuevas.

---

## Decisiones

- **Sí (Will, 2026-07-12):** **sesión por profesor**, no por categoría. _Por qué:_ modelo del prototipo; una sola lista por día minimiza fricción al pasar lista. En la práctica coincide con el Excel (cada entrenador lleva su categoría).
- **Sí (Will, 2026-07-12):** **ficha sin plata para el profesor**. _Por qué:_ la cartera es asunto del admin; evita exponer deudas de las familias a los entrenadores. Diverge del prototipo (que reusa la ficha completa readOnly) — divergencia intencional por privacidad.
- **Sí (Will, 2026-07-12):** **plan semanal con tema/objetivos + una imagen de TactalPad por día** (Lun/Mié/Vie), fases de Activación y Vuelta a la calma **fijas**. _Por qué:_ es el formato real del club (Excel de planeación); reemplaza el "tema por sesión + fases derivadas" del prototipo, que quedó obsoleto.
- **Sí (Will, 2026-07-12):** **imagen mock-first**: file input con preview local ahora; **Vercel Blob** (compresión cliente a WebP + URL en Neon) en el spec de persistencia. _Por qué:_ guardar binarios en Neon (~0.5 GB gratis) no escala ni es sano para Postgres; el link manual de Drive tiene mala UX y permisos frágiles; Blob es nativo del hosting y su capa gratuita (~1 GB) cubre años de historial (~600 imágenes/año × ~200 KB ≈ 120 MB/año).
- **Sí:** **semana actual + ~3 pasadas, historial editable** (default recomendado; Will confirmó que se lleva historial). _Por qué:_ fiel al prototipo (WeekChips); permite corregir olvidos del profesor.
- **Sí:** **admin solo lectura** + **backlog actualizado en este spec** (default recomendado, sin objeción de Will). _Por qué:_ el prototipo lo dice explícito ("No edita: la planificación es responsabilidad del profesor"); y dejar las HUs viejas genera specs futuros contra requisitos falsos.
- **Sí:** **plan semanal en Sheet, sin ruta propia**; la sesión del día sí tiene URL (`/admin/entrenos/:weekId/:day`). _Por qué:_ el plan son 2 campos (patrón `HojaEntrega` del spec 08); la sesión es una pantalla completa y deep-linkable, coherente con "la URL es la única fuente" (specs 05–08).
- **Sí:** **nota de texto opcional junto a la imagen** de la parte central. _Por qué:_ respaldo barato si un día no hay imagen (TactalPad falló, sesión improvisada); no reemplaza la imagen.
- **Sí:** **planes/sesiones derivados, no pre-creados** (slot vacío = no existe hasta registrarse). _Por qué:_ evita seeds artificiales y estados fantasma; `registrado` queda como flag del registro real.
- **Sí:** **`entrenadorNombre` denormalizado** en plan/sesión mock. _Por qué:_ los entrenadores viven en la BD real (auth) y los planes/sesiones en el mock; denormalizar evita cruzar cliente/servidor solo para un nombre. En BD será FK a `user`.
- **Sí:** **eliminar `EntrenadorHome.tsx`**. _Por qué:_ era placeholder explícito de "otro spec"; este es ese spec.
- **No:** **subir la imagen a Drive con link manual** — descartado por UX (salir de la app desde el celular, permisos, links rotos) frente a Blob.
- **No:** **EntrenoDeHoy del dashboard cableado al nuevo modelo** — se pospone a la persistencia para no crecer el alcance.
- **No:** **estadísticas de asistencia** (histórico por alumno, % mensual) — otro spec si el club lo pide.
- **No:** **edición por admin** — descartada por diseño del prototipo.

---

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| La imagen (object URL) se pierde al recargar y puede leerse como bug. | Es coherente con todo el mock (spec 07/08 igual); la pantalla lo asume sin romper (placeholder "Sin planeación") y la persistencia real llega con Blob. |
| Las `cats` del entrenador (BD auth) no coinciden con las `cat` de los alumnos mock (texto libre en NuevoUsuarioSheet). | `rosterDe` compara normalizado (mismo `normaliza` del spec 05); si el roster queda vacío, el plantel muestra empty state con hint de revisar categorías en Equipo. |
| El gate por rol dentro de la isla no protege datos (todo el mock viaja al cliente). | Aceptado en fase mock: no hay datos reales de alumnos. Al migrar a Actions, `requireUser` + filtro por rol en servidor (ya previsto en ARCHITECTURE.md). |
| `weekId`/`day` en la URL admiten valores inválidos. | Parseo defensivo como en specs 05/07: semana o día inexistente → redirige a `entrenos`. |
| Imágenes de TactalPad muy pesadas degradan la preview en celulares. | En mock es solo object URL local (sin red); la compresión cliente (WebP, máx ~1280px) queda especificada para el spec de Blob. |
| La Ficha con modo `readOnly` infla archivos > 200 líneas. | El modo se resuelve por composición (ocultar tabs/acciones desde `Ficha.tsx` índice), no duplicando pantalla. |
| Semanas generadas por fecha viva hacen el mock no determinista (labels cambian según el día). | La generación vive en dominio puro con fecha inyectable; la mock fija planes/sesiones por `weekId` relativo (w-actual, w-1…), no por fecha absoluta. |
| El entrenador corrige historial muy viejo por error. | Alcance limitado: solo existen ~4 semanas en el mock; límites reales (ventana de edición) se decidirán con la persistencia. |

---

## Lo que **NO** entra en este spec

- Persistencia real de planes/sesiones/asistencia (BD, Actions, seed) y la subida a Vercel Blob con compresión.
- Estadísticas o alertas de asistencia.
- Edición de entrenamientos por el admin.
- EntrenoDeHoy del dashboard sobre el nuevo modelo.
- Notificaciones al profesor.

Cada uno, si llega, va en su propio spec.
