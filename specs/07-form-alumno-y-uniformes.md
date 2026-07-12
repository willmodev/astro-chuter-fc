# SPEC 07 — Form de alumno + Uniformes (mock)

> **Estado:** Implementado · **Depende de:** SPEC 03 (shell, mock, DS), SPEC 05 (routing por URL, dominio, hooks), SPEC 06 (store mutable, patrón de escritura) · **Fecha:** 2026-07-10
> **Objetivo:** Construir el **Form de alumno** (inscribir/editar con categoría automática R1 y detección de hermanos R4) y las pantallas de **Uniformes** (control por kit con alerta de números repetidos R6 + registrar entrega con precio y pago R9), cerrando los Must de UI restantes (EPIC 2 y 5) sobre el store mock.

---

## Alcance

**Dentro:**

- **Form de alumno** `features/admin/screens/alumno-form/` (HU-2.4, HU-2.5):
  - Rutas nuevas tipadas: `/admin/alumnos/nuevo` (inscribir) y `/admin/alumnos/:id/editar` (editar, precargado) — deep-linkables, botón atrás nativo.
  - **FAB de acción rápida** deja de ser placeholder: abre menú con "Inscribir alumno" (→ `/admin/alumnos/nuevo`) y "Registrar pago" (→ Cartera, para elegir alumno).
  - Campos requeridos: nombre, documento, año de nacimiento, acudiente, celular; dirección opcional. Ingreso automático (mes/año actual).
  - **Categoría automática (R1):** al digitar el año se muestra badge SUB 4–16 — nueva regla pura `subDeAnio` en dominio (la `sugerirCategoria` actual es del sitio público, no se toca).
  - **Acudiente con autocomplete** sobre existentes (vía `normaliza`); al elegir uno existente → aviso de **hermano detectado con descuento de uniforme (R9)**; la mensualidad no cambia (R2: $50.000 fija).
  - Validaciones: documento requerido, **único** y ≥8 dígitos; celular de 10 dígitos; año dentro de los rangos SUB.
  - **States iniciales:** meses previos al ingreso → `na`; del mes de ingreso en adelante → `pending` (no nace en mora).
  - Editar: botón "Editar" en la cabecera de la Ficha; si cambia el año, la categoría se recalcula; unicidad de documento también al editar.
  - Store: `registrarAlumno(...)` y `actualizarAlumno(...)` (mismo patrón que `registrarPago`).
  - **Corrección de mock:** las 2 alumnas con `cuota: 40000` pasan a `50000` (R2 corregida).
- **Pantalla Uniformes** `features/admin/screens/uniformes/` (HU-5.1, HU-5.2, HU-5.4):
  - Ruta `/admin/uniformes`, con entrada desde el menú **Más** (como Equipo).
  - Toggle kit **AZUL / DORADO**; contadores Entregados/Pendientes; listado del kit ordenado por número con nombre, categoría, talla y estado de pago del uniforme.
  - **Alerta de números repetidos** dentro del kit (regla pura `numerosDuplicados`).
  - Sección **"Por entregar"** con acción "Asignar" por alumno.
- **Flujo Registrar entrega** `features/admin/screens/uniforme-entrega/` (HU-5.3):
  - Ruta propia `/admin/alumnos/:id/uniforme`; llega desde la Ficha (CTA del tab Uniforme, hoy placeholder) y desde "Asignar" en Uniformes; también **corrige** una entrega ya registrada.
  - Form: kit + número + talla + estado de pago (pagado/pendiente); muestra el **precio según R9** ($100.000, $80.000 c/u si hay hermanos).
  - Número repetido en el kit → **advierte antes de confirmar, sin bloquear**.
  - Store: `guardarUniforme(...)`.

**Fuera del alcance (otros specs):**

- **Retirar/desactivar alumno** (HU-2.6, `Could`).
- **Entrenamientos** (EPIC 6), **Más real** completo (EPIC 7), **recordatorio WhatsApp en Cartera** (HU-3.8) — siguen pendientes.
- **El pago del uniforme NO entra a los totales de cartera:** `uniformePago` es un flag informativo; recaudo/cartera vencida siguen siendo solo de mensualidades.
- **Gestión de tarifas** (HU-7.3): $50.000 / $100.000 / $80.000 quedan como constantes de dominio, no configurables.
- **Persistencia real** (BD, Actions, seed) — sigue mock-first; al recargar se pierde lo escrito.

---

## Modelo de datos

Sin persistencia nueva (sigue mock). El tipo `Alumno` ya cubre todo (`uniformePago`, `tipoKit`, `numero`, `talla`, `hermanos`) — no se amplía. Se introducen variantes de router, contratos del store y reglas puras.

### Router (`features/admin/router/types.ts`) — nuevas variantes

```ts
| { vista: 'alumnoNuevo' }
| { vista: 'alumnoEditar'; alumnoId: number }
| { vista: 'uniformes' }
| { vista: 'uniformeEntrega'; alumnoId: number }
```

- `parseRuta`: `/admin/alumnos/nuevo` → `alumnoNuevo` (se resuelve **antes** que `/admin/alumnos/:id` — "nuevo" no es id numérico); `/admin/alumnos/12/editar` → `alumnoEditar`; `/admin/uniformes` → `uniformes`; `/admin/alumnos/12/uniforme` → `uniformeEntrega`. Inversas en `rutaAPath`.

### Store (`features/admin/data/store.ts`) — nuevas escrituras

```ts
export interface DatosAlumno {
  name: string;
  doc: string;
  anio: number;
  acu: string;
  phone: string;
  dir?: string;
}

export interface EntregaUniforme {
  tipoKit: 'AZUL' | 'DORADO';
  numero: number;
  talla: string;
  pago: 'pagado' | 'pendiente';
}

// registrarAlumno(datos: DatosAlumno): number  — devuelve el id nuevo.
//   Deriva: cat = subDeAnio(anio) · cuota = CUOTA_MENSUAL · desde = mes/año actual
//   · states = statesIniciales(mesVivo) · uniforme 'pendiente'.
// actualizarAlumno(id: number, datos: DatosAlumno): void — recalcula cat si cambia anio.
// guardarUniforme(alumnoId: number, entrega: EntregaUniforme): void — marca 'entregado';
//   también sobreescribe una entrega previa (corrección).
```

- Al registrar/editar se recalcula `hermanos` para **todos** los alumnos del mismo acudiente (comparación normalizada), en una sola pasada dentro del store.

### Reglas puras nuevas (`src/lib/domain/`)

- `subDeAnio(anio)` → `'SUB 4'…'SUB 16' | null` — R1: `(añoTemporada − año)` redondeado al par superior, acotado [4, 16].
- `statesIniciales(mesVivo)` → `EstadoMes[11]` — previos al ingreso `na`, del mes vivo en adelante `pending`.
- `precioUniforme(esHermano)` → `100000 | 80000` (R9) + constantes `CUOTA_MENSUAL`, `PRECIO_UNIFORME`, `PRECIO_UNIFORME_HERMANO`.
- `numerosDuplicados(alumnos, kit)` → `number[]` — R6, alimenta la alerta de Uniformes y la advertencia del form.
- `validarAlumno(datos, alumnos, idActual?)` — requeridos, doc ≥8 dígitos y único, celular 10 dígitos.
- `sugerirAcudientes(alumnos, query)` — autocomplete reutilizando `normaliza`.
- `esHermano(alumnos, acu, idActual?)` — detección R4 normalizada (alimenta aviso y precio).

---

## Plan de implementación

Cada bloque deja `npm run dev`/`npm run build` en verde, el **marketing intacto** y el admin funcional.

### Bloque A — Dominio + corrección de mock

1. `src/lib/domain/`: `subDeAnio`, `statesIniciales`, `precioUniforme` + constantes (`CUOTA_MENSUAL`, `PRECIO_UNIFORME`, `PRECIO_UNIFORME_HERMANO`), `numerosDuplicados`, `validarAlumno`, `sugerirAcudientes`, `esHermano` (puras, reutilizan `normaliza`).
2. Corregir la mock: `cuota: 40000` → `50000` (ids 6 y 11, R2 corregida).

_Verifica:_ los KPIs de Dashboard/Cartera se recalculan coherentes con la nueva cuota (cambian de valor, misma fuente derivada); nada más se altera.

### Bloque B — Router

3. `router/types.ts`: variantes `alumnoNuevo`, `alumnoEditar`, `uniformes`, `uniformeEntrega` + `parseRuta`/`rutaAPath` (`nuevo` se resuelve antes que `:id`; parseo defensivo → id inválido cae en `alumnos`).
4. `AdminApp.tsx`: entradas en `META` y `TAB_DE_VISTA` (form y entrega cuelgan de la tab **Alumnos**; Uniformes cuelga de **Más**).

_Verifica:_ los 4 deep-links montan su vista (aunque sea esqueleto); atrás/adelante funcionan; `/admin/alumnos/nuevo` no se confunde con una ficha.

### Bloque C — Form de alumno

5. `screens/alumno-form/`: `AlumnoForm.tsx` (índice, modo nuevo/editar) + sub-componentes (campos, `BadgeCategoria`, `AutocompleteAcudiente`, `AvisoHermano`) — cada archivo < 200 líneas.
6. Store: `registrarAlumno`/`actualizarAlumno` + recálculo de `hermanos` del acudiente.
7. Navegación al guardar: nuevo → Ficha del alumno creado; edición → vuelve a la Ficha.
8. Cablear ganchos: el **FAB** abre menú "Inscribir alumno" / "Registrar pago" (reemplaza el `ProximamenteDialog`); botón **"Editar"** en la cabecera de la Ficha.

_Verifica:_ año 2018 → badge SUB 8; acudiente existente → aviso hermano + descuento R9 (la cuota sigue $50.000); doc duplicado o corto bloquea con error; el alumno nuevo aparece en Alumnos/Cartera/Dashboard con cifras coherentes y **sin mora**.

### Bloque D — Pantalla Uniformes

9. `screens/uniformes/`: `Uniformes.tsx` (índice) + `ToggleKit`, contadores, `AlertaDuplicados`, fila de alumno, sección "Por entregar" — cada archivo < 200 líneas.
10. Entrada "Uniformes" en `MasMenu` → `/admin/uniformes`.

_Verifica:_ toggle AZUL/DORADO filtra; contadores Entregados/Pendientes cuadran con la mock; lista ordenada por número.

### Bloque E — Flujo Registrar entrega

11. `screens/uniforme-entrega/`: form kit + número + talla + pago, precio según R9, advertencia de número repetido (no bloqueante), modo corrección precargado si ya hay entrega.
12. Store: `guardarUniforme`; cablear el CTA del tab Uniforme de la **Ficha** (deja de ser placeholder) y "Asignar" en **Uniformes**.

_Verifica:_ la entrega marca `entregado` y se refleja al instante en Ficha y Uniformes; hermano ve $80.000; número repetido advierte pero permite guardar y la alerta de Uniformes lo refleja.

### Bloque F — Cierre

13. Verificación final: build estático (marketing intacto), `/admin/**` noindex y fuera del sitemap, ningún archivo > 200 líneas, cero `any`, sin dependencias nuevas, `tsc --noEmit` + `build` en verde, flujos completos mobile (320px) y desktop sin scroll horizontal.

---

## Criterios de aceptación

### Routing

- [x] `/admin/alumnos/nuevo`, `/admin/alumnos/:id/editar`, `/admin/uniformes` y `/admin/alumnos/:id/uniforme` cargan directo por URL con sesión activa; sin sesión redirigen a `/admin/login?next=<ruta>`.
- [x] `/admin/alumnos/nuevo` abre el form vacío (no se interpreta como ficha); un `:id` inexistente en editar/entrega muestra "Alumno no encontrado" con volver.
- [x] Atrás/adelante del navegador recorren el flujo sin recargar la página.

### Form de alumno

- [x] El FAB abre el menú con "Inscribir alumno" (→ form) y "Registrar pago" (→ Cartera); el placeholder "Próximamente" del FAB ya no existe.
- [x] Al digitar el año de nacimiento aparece el badge de categoría automática (SUB 4–16, R1); año fuera de rango muestra error y no permite guardar.
- [x] El autocomplete de acudiente sugiere existentes sin distinguir mayúsculas/acentos; elegir uno dispara el aviso de **hermano detectado con descuento de uniforme (R9)** y la cuota mostrada sigue siendo **$50.000** (R2).
- [x] Documento: requerido, ≥8 dígitos y **único** (también al editar); celular de 10 dígitos; errores visibles por campo.
- [x] Guardar en modo nuevo crea el alumno (meses previos `na`, del mes vivo en adelante `pending` — **no nace en mora**) y navega a su Ficha; aparece en Alumnos, Cartera y Dashboard con cifras coherentes.
- [x] "Editar" desde la Ficha abre el form precargado; cambiar el año recalcula la categoría; al guardar, la Ficha refleja los cambios.
- [x] `hermanos` se recalcula para todos los alumnos del mismo acudiente al registrar/editar.

### Pantalla Uniformes

- [x] La entrada "Uniformes" en Más navega a `/admin/uniformes`.
- [x] El toggle AZUL/DORADO filtra el listado; los contadores Entregados/Pendientes cuadran con los datos.
- [x] El listado del kit va ordenado por número y muestra nombre, categoría, talla y estado de pago del uniforme.
- [x] Si hay números repetidos dentro del kit, se muestra una alerta indicando cuáles (R6).
- [x] "Por entregar" lista los alumnos sin uniforme con acción "Asignar".

### Flujo Registrar entrega

- [x] Se llega desde la Ficha (tab Uniforme, ya sin placeholder) y desde "Asignar" en Uniformes.
- [x] El form captura kit + número + talla + pago y muestra el precio: $100.000, u **$80.000 si el alumno tiene hermanos** (R9).
- [x] Elegir un número ya usado en ese kit advierte antes de confirmar pero **permite guardar**; la alerta de Uniformes lo refleja después.
- [x] Guardar marca `entregado` y se ve al instante en Ficha y Uniformes; una entrega existente se puede corregir con el form precargado.

### Calidad y no-regresión

- [x] La mock ya no tiene cuotas de $40.000; los totales derivados siguen coherentes entre Dashboard, Cartera y Ficha.
- [x] Toda la lógica (categoría, validación, precios, duplicados, hermanos) vive en `src/lib/domain/` (puras); los componentes no calculan negocio.
- [x] Contratos del store estables: migrar a Actions no cambiaría la forma de `registrarAlumno`/`actualizarAlumno`/`guardarUniforme`.
- [x] `npm run build` sigue estático para el marketing; `/admin/**` noindex y fuera del sitemap.
- [x] Ningún archivo > 200 líneas; cero `any`; sin dependencias nuevas; `tsc --noEmit` + `build` en verde.
- [x] De 320px a desktop: cero scroll horizontal en las 3 pantallas nuevas.

---

## Decisiones

- **Sí:** **Form de alumno + Uniformes juntos** en este spec. _Por qué:_ Will pidió un spec de tamaño medio (ni corto ni extenso, como 05/06); juntos cierran todos los Must de UI restantes (EPIC 2 y 5) y los dos placeholders vivos (FAB y CTA de la Ficha). Entrenamientos + Más real + HU-3.8 quedan para el spec 08.
- **Sí:** **el descuento de hermanos es del uniforme, no de la mensualidad** (aclaración del cliente por WhatsApp, 2026-07-10). _Por qué:_ corrige la R2 original (que daba $40.000 de mensualidad a hermanos, interpretación errónea de la col. CUOTA del Excel). Mensualidad **$50.000 fija** para todos (R2); uniforme **$100.000 → $80.000 c/u** si son hermanos (R9 nueva). Se actualizaron `backlog.md`, `excel-data-dictionary.md`, `ARCHITECTURE.md` y `CLAUDE.md` en esta misma ronda; la detección de hermanos (R4) se conserva pero su efecto es el precio del uniforme.
- **Sí:** **FAB con menú de 2 acciones** (Inscribir alumno / Registrar pago → Cartera). _Por qué:_ el FAB prometía ambas desde el spec 03; "Registrar pago" sin alumno elegido aterriza en Cartera, donde ya se cobra por celda.
- **Sí:** **el alumno nuevo no nace en mora**: meses previos al ingreso `na`, del mes vivo en adelante `pending`. _Por qué:_ refleja la realidad (no debe meses de antes de inscribirse); se descartó el campo "mes de inicio de cobro" por fricción innecesaria.
- **Sí:** **autocomplete de acudiente** sobre existentes (vía `normaliza`) con texto libre para nuevos. _Por qué:_ la detección de hermanos por coincidencia exacta fallaría por tildes o variaciones al digitar; elegir de la lista garantiza el vínculo (R4).
- **Sí:** **Uniformes entra por el menú Más** (como Equipo), sin quinta tab. _Por qué:_ la bottom nav móvil ya está completa (4 tabs + FAB); recargarla penaliza lo más usado (Cartera/Alumnos).
- **Sí:** **ruta propia** `/admin/alumnos/:id/uniforme` para la entrega, que también corrige entregas existentes. _Por qué:_ coherente con "la URL es la única fuente" (specs 05/06); reutilizable desde Ficha y Uniformes. Se descartó el bottom sheet sin URL.
- **Sí:** **precio + pago del uniforme dentro del alcance**. _Por qué:_ el tipo `Alumno` ya traía `uniformePago` y la aclaración del cliente puso el precio en el centro del flujo (R9); ignorarlo dejaría el descuento de hermanos sin lugar donde verse.
- **Sí:** **advertencia no bloqueante** para número repetido en el kit. _Por qué:_ es lo que dice HU-5.3 ("se advierte antes de confirmar"); el club puede tener razones puntuales, y la alerta de la pantalla Uniformes (HU-5.2) mantiene visible el conflicto.
- **Sí:** **precios como constantes de dominio** (`CUOTA_MENSUAL`, `PRECIO_UNIFORME`, `PRECIO_UNIFORME_HERMANO`). _Por qué:_ HU-7.3 (tarifas configurables) es `Could` y quedó fuera; una constante bien nombrada migra fácil a la tabla `tarifas` cuando llegue la BD.
- **No:** **tarifa de hermanos en la mensualidad** — anulada por el cliente; la respuesta previa de Will que la aprobaba (2a del primer bloque de preguntas) partía de la regla errónea y quedó sin efecto.
- **No:** **`uniformePago` en los totales de cartera**. _Por qué:_ recaudo/cartera vencida son de mensualidades; mezclar el uniforme descuadraría los KPIs ya cerrados. Si el club lo pide, será regla nueva en otro spec.
- **No:** **retirar/desactivar alumno** (HU-2.6, `Could`) — alcance propio, con implicaciones en KPIs e historial.

---

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| `/admin/alumnos/nuevo` colisiona con `/admin/alumnos/:id` y el parser lo trata como id inválido. | `parseRuta` resuelve el literal `nuevo` **antes** del segmento `:id` (regla pura con test mental de orden); criterio de aceptación lo verifica explícitamente. |
| El recálculo de `hermanos` por nombre normalizado del acudiente da falsos positivos (nombres parecidos) o negativos (typos al digitar). | El vínculo fuerte nace del **autocomplete** (elegir existente copia el nombre exacto); texto libre solo crea acudientes nuevos. En BD real esto será `acudiente_id` (FK), como ya modela `ARCHITECTURE.md`. |
| El form de alumno (campos + validación + autocomplete + badge + modos) infla archivos > 200 líneas. | Descomponer desde el diseño (`AlumnoForm` índice + campos + `AutocompleteAcudiente` + `AvisoHermano`), como la Ficha (05) y Pago (06). |
| El store crece con 3 escrituras nuevas y rompe el límite de 200 líneas. | Si se acerca, dividir por agregado (`data/store/alumnos.ts`, `data/store/uniformes.ts`) manteniendo una sola fuente de suscripción. |
| La corrección de cuota 40.000 → 50.000 cambia KPIs cerrados en specs anteriores y parece regresión. | Es intencional (R2 corregida por el cliente); el Bloque A lo hace aislado y el criterio lo documenta como cambio esperado. |
| La unicidad de documento choca consigo misma al editar. | `validarAlumno(datos, alumnos, idActual?)` excluye el propio id; criterio de edición lo cubre. |
| `statesIniciales` con bordes raros (inscribir en FEB → todo `pending`; en DIC → 10 meses `na`). | Función pura sobre el índice del mes vivo, acotada a [0, 10]; se verifican ambos extremos al implementar. |
| Deep-link a la entrega de un alumno que ya tiene uniforme entregado. | No es error: monta el modo corrección con el form precargado; criterio lo cubre. |
| El precio R9 se muestra mal si `hermanos` quedó desactualizado tras editar un acudiente. | El recálculo de `hermanos` vive **centralizado en el store** y corre en cada escritura (`registrarAlumno`/`actualizarAlumno`); `precioUniforme` solo lee ese dato. |
| Los contratos nuevos del store no calzan con las Actions futuras. | Firmas modeladas desde `ARCHITECTURE.md §5` (misma disciplina que `registrarPago` en el spec 06). |
