# SPEC 10 — Asistencia en dos momentos + visor de imagen

> **Estado:** Implementado · **Depende de:** SPEC 09 (entrenos, sesión del día, DayCard, vista admin de entrenamientos) · **Fecha:** 2026-07-13
> **Objetivo:** Separar la sesión del día en dos registros independientes — planeación (imagen + nota, editable en cualquier momento) y asistencia (solo desde el día del entreno, corregible hacia atrás) — y agregar un visor a pantalla completa con zoom para la imagen de la parte central, que los entrenadores muestran a los padres en la cancha.

---

## Por qué existe este spec

El spec 09 guarda planeación y asistencia en un solo "Guardar" con default "todos presentes" (`ausentes: []`). El flujo real del club es en dos momentos: el profe planea desde casa un día antes y pasa lista en la cancha el día del entreno. Hoy, registrar la planeación la noche anterior deja guardada una asistencia falsa. Además, la imagen de TactalPad solo se ve como preview/thumbnail — sin forma de ampliarla para mostrarla a padres y jugadores desde el móvil o PC.

---

## Alcance

**Dentro:**

- **Dominio** (`src/lib/domain/entrenos.ts`):
  - `fechaDe(semana, day)` y `puedePasarLista(semana, day, hoy)` — la lista se habilita solo cuando el día del entreno ya llegó (fecha inyectable, como el resto del dominio); los días pasados siguen habilitados (corregibles).
  - Estados derivados de la sesión: `planeada` (tiene imagen o nota) y `listaPasada` (`ausentes !== null`) — el flag `registrado` del spec 09 desaparece a favor de la derivación.
  - `generarSemanas` incluye la **próxima semana** (1 futura) además de la actual y las pasadas, para poder planear con anticipación; la semana **actual** sigue siendo la seleccionada por defecto.
- **Data / store** (`features/admin/data/`):
  - `Sesion.ausentes: number[] | null` — `null` = lista no pasada (deja de existir el default "todos presentes").
  - `guardarSesion` se divide en dos upserts independientes e idempotentes: `guardarPlaneacion(...)` y `guardarAsistencia(...)`.
  - Mock actualizado: sesiones de ejemplo con los nuevos estados (alguna planeada sin lista, alguna con lista sin planeación).
- **Pantalla de sesión** (`screens/sesion/`):
  - Dos bloques con CTA propio: "Guardar planeación" (imagen + nota, editable en cualquier momento) y "Guardar asistencia" (toggles P/A).
  - Día futuro → sección de lista deshabilitada con hint "Disponible el día del entreno"; día pasado sin lista → se puede pasar/corregir.
- **DayCard** (`screens/entrenos/`): 4 estados — vacía / planeada sin lista / lista sin planeación / completa — con pastilla "N/M presentes" o "Sin lista"; tocar el **thumbnail** abre el visor, tocar el resto de la card navega a la sesión.
- **Badge de la semana actual:** dos contadores — "N sin planear · M sin lista"; "sin lista" cuenta solo días ya llegados (los futuros no son deuda).
- **Visor de imagen** (`ui/VisorImagen.tsx`, sin dependencias nuevas): overlay a pantalla completa con zoom por rueda / doble tap / pinch, arrastre para desplazarse, cierre con X, Escape o tap en el fondo. Se abre desde la preview en sesión, el thumbnail de la DayCard y el thumbnail de la vista admin.
- **Vista admin** (`screens/entrenamientos/`): pastilla "Sin lista" cuando `ausentes === null`; thumbnails abren el visor.

**Fuera del alcance (otros specs):**

- Persistencia real de planes/sesiones/asistencia y subida a Vercel Blob (igual que el 09).
- Estadísticas o alertas de asistencia.
- Ventana real de edición del historial (límites al corregir se deciden con la persistencia).
- Notificaciones/recordatorios al profesor.

---

## Modelo de datos

Sin persistencia nueva (sigue mock). Solo cambia el contrato de `Sesion` y se dividen las escrituras:

```ts
// features/admin/data/types.ts — cambia ausentes y muere `registrado`
export interface Sesion {
  id: string;                 // `${entrenadorId}-${weekId}-${day}`
  entrenadorId: string;
  entrenadorNombre: string;   // denormalizado (mock); en BD será FK
  weekId: string;
  day: string;                // 'Lunes' | 'Miércoles' | 'Viernes'
  parteCentralImg: string | null; // object URL local (mock)
  parteCentralNota: string;
  ausentes: number[] | null;  // null = lista NO pasada; [] = pasada, todos presentes
}
```

```ts
// features/admin/data/store-entrenos.ts — dos upserts independientes
guardarPlaneacion(params: {
  entrenadorId: string; entrenadorNombre: string;
  weekId: string; day: DiaEntreno;
  parteCentralImg: string | null; parteCentralNota: string;
}): void;

guardarAsistencia(params: {
  entrenadorId: string; entrenadorNombre: string;
  weekId: string; day: DiaEntreno;
  ausentes: number[];
}): void;
```

```ts
// src/lib/domain/entrenos.ts — reglas puras nuevas
fechaDe(semana: Semana, day: DiaEntreno): Date;
puedePasarLista(semana: Semana, day: DiaEntreno, hoy: Date): boolean; // fechaDe <= hoy
planeada(sesion: Sesion | null): boolean;      // img o nota no vacía
listaPasada(sesion: Sesion | null): boolean;   // ausentes !== null
pendientesDe(semana, sesiones, hoy): { sinPlanear: number; sinLista: number };
// sinLista solo cuenta días con fechaDe <= hoy
```

Nota: `Semana` necesita cargar la fecha de su lunes (`inicio: Date` o ISO string) para poder derivar `fechaDe` — hoy solo tiene el label de texto. `asistenciaDe` pasa a aceptar `ausentes: number[]` (ya no aplica sobre sesiones sin lista).

Sin cambios en `PlanSemana`, router ni rutas — no hay URLs nuevas.

---

## Plan de implementación

Cada bloque deja `tsc` + `build` en verde, el marketing intacto y el admin funcional.

### Bloque A — Dominio + data

1. `src/lib/domain/entrenos.ts`: `Semana.inicio`, `fechaDe`, `puedePasarLista`, `planeada`, `listaPasada`, `pendientesDe`; `asistenciaDe` sobre `ausentes: number[]`.
2. `data/types.ts` + `data/mock.ts`: `Sesion.ausentes: number[] | null`, eliminar `registrado`, sesiones de ejemplo con los 4 estados.
3. `data/store-entrenos.ts`: dividir `guardarSesion` en `guardarPlaneacion` + `guardarAsistencia` (upserts idempotentes que no pisan el otro registro) y adaptar los consumidores a los tipos nuevos (comportamiento visual aún el del spec 09).

_Verifica:_ guardar planeación no toca `ausentes`; guardar asistencia no toca imagen/nota; doble guardado no duplica; `pendientesDe` no cuenta listas futuras.

### Bloque B — Sesión en dos momentos

4. `screens/sesion/`: bloque de planeación con CTA "Guardar planeación" y bloque de asistencia con CTA "Guardar asistencia"; toggles sin default guardado (la lista existe solo al guardarla).
5. Gate por fecha: día futuro → lista deshabilitada con hint "Disponible el día del entreno"; día pasado → corregible.

_Verifica:_ planear la noche anterior no crea asistencia; pasar lista sin planeación funciona; un día futuro no deja pasar lista; uno pasado sí.

### Bloque C — DayCard + badge + vista admin

6. `screens/entrenos/DayCard.tsx`: 4 estados (vacía / planeada sin lista / lista sin planeación / completa), pastilla "N/M presentes" o "Sin lista".
7. Badge de semana actual con dos contadores ("N sin planear · M sin lista") vía `pendientesDe`.
8. `screens/entrenamientos/SesionRow.tsx`: pastilla "Sin lista" cuando `ausentes === null`.

_Verifica:_ los 4 estados se distinguen; el badge cuadra con los datos; el admin ve "Sin lista" sin controles de edición.

### Bloque D — Visor de imagen

9. `ui/VisorImagen.tsx`: overlay fullscreen, zoom (rueda / doble tap / pinch), arrastre, cierre (X / Escape / tap en fondo), sin dependencias nuevas.
10. Integrarlo: preview de sesión, thumbnail de DayCard (tap en thumbnail = visor, resto de card = navegar) y thumbnail de la vista admin.

_Verifica:_ el visor abre desde los tres puntos, hace zoom y pan en móvil y desktop, y cierra sin romper la navegación.

### Bloque E — Cierre

11. `tsc --noEmit` + `build` en verde, ningún archivo > 200 líneas, cero `any`, sin dependencias nuevas, sin scroll horizontal de 320px a desktop, verificación visual con playwright.

---

## Criterios de aceptación

### Planeación y asistencia separadas

- [x] Guardar la planeación (imagen y/o nota) no crea ni modifica asistencia: la DayCard queda "planeada · Sin lista".
- [x] Se puede pasar lista sin planeación previa: la DayCard queda "lista sin planeación" con su pastilla N/M.
- [x] La lista de un día futuro está deshabilitada con el hint "Disponible el día del entreno"; la de un día pasado se puede pasar o corregir.
- [x] La planeación es editable en cualquier momento (pasado, presente o futuro).
- [x] `guardarPlaneacion` y `guardarAsistencia` son idempotentes y no se pisan entre sí (guardar una no altera la otra).
- [x] Ya no existe el default "todos presentes": la asistencia solo existe cuando el profe la guarda explícitamente.

### DayCard y badge

- [x] La DayCard distingue los 4 estados: vacía / planeada sin lista / lista sin planeación / completa.
- [x] La pastilla muestra "N/M presentes" cuando hay lista y "Sin lista" cuando no, en días ya llegados.
- [x] El badge de la semana actual muestra los dos contadores ("N sin planear · M sin lista") y "sin lista" no cuenta días futuros.

### Visor de imagen

- [x] La imagen de la parte central se abre en visor a pantalla completa desde: la sesión, el thumbnail de la DayCard y el thumbnail de la vista admin.
- [x] El visor permite zoom (rueda en PC, pinch y doble tap en móvil) y arrastre para desplazarse.
- [x] Se cierra con X, Escape o tap en el fondo, sin romper la navegación (atrás/adelante siguen funcionando).
- [x] En la DayCard, tocar el thumbnail abre el visor y tocar el resto de la card sigue navegando a la sesión.

### Vista del admin

- [x] Las sesiones sin lista muestran "Sin lista" en lugar de la pastilla de asistencia. _(verificado por código/tsc; no en pantalla — solo había cuenta de profe disponible)_
- [x] Sigue sin existir ningún control de edición en esa vista. _(sin cambios respecto al spec 09)_

### Calidad y no-regresión

- [x] Ningún archivo > 200 líneas; cero `any`; sin dependencias nuevas; `tsc --noEmit` + `build` en verde.
- [x] Marketing estático; `/admin/**` noindex y fuera del sitemap.
- [x] De 320px a desktop: cero scroll horizontal en las pantallas tocadas.

---

## Decisiones

- **Sí (Will, 2026-07-13):** **planeación y asistencia como registros independientes** con CTA propio cada uno. _Por qué:_ es el flujo real del club — se planea desde casa un día antes y se pasa lista en la cancha; el guardado único del spec 09 creaba asistencias "todos presentes" falsas.
- **Sí (Will, 2026-07-13):** **se puede pasar lista sin planeación previa.** _Por qué:_ cubre el día improvisado (TactalPad falló, sesión sin planear); la asistencia no debe depender de la planeación.
- **Sí (Will, 2026-07-13):** **lista bloqueada solo hacia futuro; el pasado es corregible.** _Por qué:_ pasar lista de un día que no ha llegado no tiene sentido, pero el olvido de pasarla va a pasar seguido — bloquear el pasado dejaría datos incompletos sin remedio. Mantiene el criterio de historial corregible del spec 09.
- **Sí (Will, 2026-07-13):** **badge con dos contadores** ("N sin planear · M sin lista"). _Por qué:_ le dice al profe exactamente qué le falta; "sin lista" no cuenta días futuros porque aún no son deuda.
- **Sí (Will, 2026-07-13):** **visor de imagen propio (lightbox), sin dependencias.** _Por qué:_ los entrenadores muestran la planeación a padres y jugadores en la cancha desde el móvil o PC; una librería violaría la regla de cero deps nuevas para algo resoluble con CSS transforms y pointer events.
- **Sí (Will, 2026-07-13):** **en la DayCard el thumbnail abre el visor y el resto de la card navega.** _Por qué:_ resuelve el conflicto de tap sin quitar el acceso rápido a la imagen, que es lo que se muestra en la cancha.
- **Sí:** **`ausentes: number[] | null`** con `null` = lista no pasada, y **eliminar el flag `registrado`** a favor de estados derivados (`planeada`, `listaPasada`). _Por qué:_ el flag único no puede representar los 4 estados; derivar evita estados fantasma e inconsistencias.
- **Sí:** **`Semana` carga la fecha de su lunes** (`inicio`). _Por qué:_ `puedePasarLista` necesita comparar fechas reales; hoy la semana solo tiene label de texto. Sigue siendo dominio puro con fecha inyectable.
- **Sí (Will, 2026-07-18):** **`generarSemanas` incluye la próxima semana** (1 futura). _Por qué:_ el flujo real es planear un día antes; sin una semana futura navegable no había dónde hacerlo y el gate de lista nunca se ejercitaba (con la fecha de hoy, todos los días de la semana actual ya pasaron). La semana actual sigue seleccionada por defecto; los chips quedan "Próxima · Actual · Pasada · …". Es una extensión menor sobre el modelo de `generarSemanas` del spec 09.
- **No:** **bloquear la corrección de asistencia en el pasado** — descartado: revertiría el historial corregible del spec 09 y castigaría el olvido, el caso más común.
- **No:** **restricción de la planeación por fecha** — descartada: planear con anticipación es justamente el objetivo.
- **No:** **librería de lightbox / abrir imagen en pestaña nueva** — descartadas por la regla de deps y por UX pobre en la cancha, respectivamente.
- **No:** **ventana real de edición del historial** (hasta cuándo se puede corregir) — se decide con la persistencia.

---

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| El pinch/pan táctil custom es delicado (gestos simultáneos, jitter). | Pointer events estándar con doble tap como gesto principal en móvil; pinch como mejora progresiva. Si el gesto falla, el doble tap siempre funciona. |
| La DayCard hoy es un solo `<button>`; meter el thumbnail clickeable adentro anida interactivos (inválido en HTML y rompe a11y). | Reestructurar la DayCard por composición: card contenedora con dos zonas interactivas hermanas (thumbnail → visor, cuerpo → sesión), sin botones anidados. |
| "Hoy" del dispositivo hace el gate de lista no determinista en el mock. | Igual que el spec 09: la regla vive en dominio puro con fecha inyectable; la UI inyecta `new Date()` en un solo punto. |
| El cambio de semántica de `ausentes` (antes `[]` = default todos presentes; ahora `[]` = lista pasada sin ausentes) puede confundir al migrar el mock. | El mock se reescribe en el bloque A con la semántica nueva; no hay datos reales que migrar. En BD (spec de persistencia) nacerá ya con `null`. |
| El visor sobre object URLs muestra imagen rota tras recargar. | Coherente con todo el mock (specs 07–09); el visor solo se ofrece cuando hay imagen viva. |
| Con el visor abierto, el scroll del body de fondo se mueve o Escape/atrás rompen la navegación. | Bloquear scroll del body mientras el visor está abierto; el visor es estado local (no ruta), así atrás/adelante del navegador no lo ven. |
| Los 4 estados de la DayCard inflan el archivo > 200 líneas. | Los estados se resuelven con las funciones de dominio (`planeada`, `listaPasada`) y sub-componentes pequeños, no con ramas inline. |

---

## Lo que **NO** entra en este spec

- Persistencia real de planes/sesiones/asistencia y subida a Vercel Blob.
- Estadísticas o alertas de asistencia.
- Ventana real de edición del historial.
- Notificaciones/recordatorios al profesor.

Cada uno, si llega, va en su propio spec.
