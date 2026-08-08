# SPEC 18 — Uniformes: vista única con filtros y paginado en servidor

> **Estado:** Aprobado · **Depende de:** SPEC 08 (modelo de 4 estados y las pantallas Estado/Numeración que este spec reemplaza), SPEC 11 (persistencia en Neon y el patrón Action + refetch pesimista), SPEC 12 (dos kits por alumno, abonos y el universo de 2N kits), SPEC 16 (paginado incremental de render, del que este spec se aparta a propósito) · **Fecha:** 2026-08-07
> **Objetivo:** Reemplazar los dos tabs de la pantalla Uniformes por una sola lista de kits con buscador y filtros desplegables, con el filtrado, el orden, los conteos y el paginado resueltos en SQL.

---

## Por qué existe este spec

La pantalla Uniformes del spec 12 quedó partida en dos tabs que **no son dos vistas de lo
mismo, sino dos universos distintos**:

- **Estado** opera sobre las **164 filas** (2 kits × 82 alumnos activos). Un alumno aparece
  dos veces, una por kit.
- **Numeración** opera sobre **82 filas** de un solo kit, y encima lista únicamente los
  **entregados**: en el kit azul muestra 60 de 82. Los 22 «por entregar» que anuncia el
  contador no están en la lista de abajo.

La consecuencia práctica: para responder «¿a quién le falta pagar el kit oro?» hay que saber
de antemano en cuál de los dos tabs vive la respuesta. Eso no se arregla con mejores tabs.

Al mismo tiempo, esta lista es la que **más rápido crece** del admin: es 2× el número de
alumnos. El paginado de render del spec 16 (traer todo, pintar 15) no ayuda ahí, porque el
que crece es el payload, no el DOM. Este spec cambia las dos cosas a la vez: una sola lista
filtrable, y paginado de verdad contra la base.

---

## Alcance

**Dentro:**

- **Consulta paginada en SQL** (`src/lib/db/repos/uniformes.ts`): una función nueva
  `paginaUniformes(filtros)` que resuelve todo contra Postgres en una sola consulta — CTE de
  conteo de hermanos por acudiente normalizado, precio del kit derivado de ese conteo, estado
  del kit derivado de `entregado` + `abonado_cop` vs precio, filtros, orden, `LIMIT`/`OFFSET`.
  Las constantes de precio se **importan** de `lib/domain/precios.ts`; no se reescriben en la
  consulta.
- **Conteos y duplicados sobre el total filtrado**, no sobre la página: la misma consulta
  devuelve el conteo de cada uno de los 4 estados y los números repetidos por kit.
- **Action nueva** `uniformes.listarPagina({ kit, estado, cat, query, orden, offset, limit })`
  con Zod + `requireUser` + gate de rol admin en servidor. Devuelve
  `{ filas, total, conteos, duplicados }`.
- **Vista única** en `src/features/admin/screens/uniformes/`: buscador (nombre **y** número de
  camiseta), tres desplegables (**Kit** · **Estado** · **Categoría**), selector de **Orden**
  (Prioridad · Nombre · Número), banner de números repetidos y una sola lista de filas-kit.
- **Fila unificada**: número de camiseta (`—` si no se ha entregado), nombre, categoría,
  etiqueta del kit y badge de estado. Abre la pantalla de gestión del kit, como hoy.
- **Paginado de servidor**: 20 filas por página, botón **«Mostrar más»** que agrega al final.
  Cambiar cualquier filtro, la búsqueda o el orden resetea a la primera página. Debounce de
  300 ms en el buscador.
- **Borrado de los dos tabs**: se eliminan `TabsUniformes.tsx`, `EstadoTab.tsx`,
  `NumeracionTab.tsx`, `MatrizEstado.tsx`, `ToggleKit.tsx` y `ContadoresKit.tsx`;
  `FilaEstado.tsx` y `FilaUniforme.tsx` se funden en una sola fila; `filas.ts` pierde lo que
  ahora resuelve SQL.
- **Paridad SQL ↔ dominio**: un script de verificación compara, sobre el set completo, el
  estado que calcula la consulta contra `estadoKit()` de `lib/domain/uniformes.ts`.
- **Docs**: `docs/ARCHITECTURE.md` (por qué esta pantalla pagina distinto al resto) y
  `docs/backlog.md` (HU de la pantalla Uniformes y la deuda que queda anotada).

**Fuera del alcance (otros specs):**

- **Pantalla de gestión del kit** (`/admin/alumnos/:id/uniforme`, entrega y abono) — no se toca.
- **Tab Uniforme de la ficha del alumno** — no se toca.
- **Vista del entrenador** — no ve esta pantalla; `useUniformesEntrenador` queda igual.
- **`uniformes.listar` no se elimina**: la siguen usando el entrenador (`FichaPlantel`) y la
  pantalla de gestión del kit. Solo deja de usarla la pantalla Uniformes.
- **`useUniformeAlumno` carga todos los uniformes para mostrar uno** — es la misma ineficiencia
  que el spec 17 corrigió para alumnos (DT-3). Se **registra como deuda nueva** en
  `docs/backlog.md`, no se arregla aquí.
- **Migrar Alumnos y Cartera a paginado de servidor** — siguen con paginado de render
  (spec 16). Cuando se haga, va en su propio spec.
- **Tarifas de uniforme configurables** (HU-7.3, `Could`) — los precios siguen siendo
  constantes de dominio.

---

## Modelo de datos

Este spec **no crea ni altera tablas**. Reusa `alumnos` y `uniformes` del spec 12. Lo nuevo
son el contrato de la consulta paginada y la derivación del estado en SQL.

### Contrato de entrada y salida (`src/lib/db/repos/uniformes.ts`)

```ts
export type OrdenUniformes = 'prioridad' | 'nombre' | 'numero';

export interface FiltrosUniformes {
  kit: TipoKit | null; // null = ambos
  estado: EstadoKit | null; // null = todos
  cat: string | null; // 'SUB 8' | null = todas
  query: string; // nombre o número; '' = sin búsqueda
  orden: OrdenUniformes;
  offset: number;
  limit: number; // 20
}

export interface FilaKit {
  alumnoId: number;
  nombre: string;
  cat: string; // 'SUB 8'
  kit: TipoKit;
  entregado: boolean;
  numero: number | null;
  talla: string;
  abonadoCop: number;
  precio: number; // 100.000 u 80.000
  estado: EstadoKit;
}

export interface PaginaUniformes {
  filas: FilaKit[]; // como máximo `limit`
  total: number; // filas que pasan el filtro, no las de la página
  conteos: Record<EstadoKit, number>; // sobre el total filtrado por kit/cat/query
  duplicados: Record<TipoKit, number[]>; // números repetidos, por kit, sobre TODO el set
}
```

### Universo de filas: 2N, incluidos los kits sin registro

Un alumno puede no tener fila en `uniformes` para un kit (el spec 12 crea la fila al registrar
la primera entrega o el primer abono). Esos kits **cuentan como «Sin iniciar»**, igual que hoy
en `construyeKits`. En SQL eso es un `CROSS JOIN` de los alumnos **activos** contra los dos
kits, con `LEFT JOIN` a `uniformes`:

```sql
FROM alumnos a
CROSS JOIN (VALUES ('AZUL'), ('ORO')) AS k(kit)
LEFT JOIN uniformes u ON u.alumno_id = a.id AND u.kit = k.kit
WHERE a.activo = true
```

Los **retirados quedan fuera**, como hoy (spec 14). Hoy son 82 activos → 164 filas.

### Las cuatro derivaciones que la consulta tiene que reproducir

| Derivación    | Regla en dominio                                                   | Forma en SQL                                                                                            |
| ------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| **Hermanos**  | acudientes iguales tras `normaliza()` (minúsculas + sin acentos)   | CTE `hermanos` con `GROUP BY` sobre el acudiente normalizado                                            |
| **Precio**    | `precioUniforme(hermanos > 1)`                                     | `CASE WHEN h.n > 1 THEN :hermano ELSE :normal END`, valores **inyectados** desde `lib/domain/precios.ts` |
| **Estado**    | `estadoKit(entregado, abonadoCop, precio)`                         | `CASE` sobre `entregado` × (`abonado_cop >= precio`)                                                    |
| **Categoría** | `sub = ceil(edad / 2) × 2`, acotado a [4, 16], por edad **cumplida** | `age()` sobre `fecha_nacimiento` (o `anio_nacimiento` si es null) con el mismo redondeo y clamp         |

**Acentos sin extensión:** `normaliza()` quita tildes con `NFD`. En Postgres se reproduce con
`lower(translate(acudiente, 'áéíóúüñÁÉÍÓÚÜÑ', 'aeiouunAEIOUUN'))`, **no** con `unaccent` — así
no se depende de habilitar una extensión en Neon.

### Orden

- **`prioridad`** — Pago pendiente → Por entregar → Sin iniciar → Completo, y dentro de cada
  grupo por nombre. Espeja `ORDEN_ESTADO_UNIFORME` de `lib/domain/uniformes.ts`.
- **`nombre`** — A-Z, con la misma insensibilidad a acentos que la búsqueda.
- **`numero`** — ascendente, con los kits sin número (`NULL`) **al final** (`NULLS LAST`).

En los tres casos el desempate final es `(alumno_id, kit)`, para que el paginado sea estable:
sin un orden total, dos páginas consecutivas pueden repetir u omitir una fila.

### Búsqueda

Un solo campo que matchea **nombre** (contiene, sin mayúsculas ni acentos) **o** **número de
camiseta** (igualdad exacta, solo si el texto es un entero). `10` devuelve a quien tenga el 10
en cualquiera de los dos kits.

### El abono parcial en la fila unificada

Hoy el badge de **Numeración** es tri-estado (Pagado · **Abonado** · Pendiente) y el de
**Estado** es de 4 estados. Al fusionar las dos filas gana el de 4 estados, donde el abono
parcial cae dentro de «Pago pendiente». Para no perder ese dato, la línea secundaria de la
fila agrega la palabra **«Abonado»** cuando `0 < abonadoCop < precio`:

```
[10]  JONAS QUINTERO SANTANA                    [Pago pendiente]
      SUB 10 · Kit Oro · Talla M · Abonado
```

Va **sin el monto** a propósito: así la pantalla sigue sin mostrar un solo peso y no tiene que
respetar la preferencia de mostrar/ocultar montos del spec 16.

---

## Plan de implementación

Los pasos 1 a 8 **agregan** código sin tocar la pantalla actual: los dos tabs siguen
funcionando en `npm run dev` durante todo ese tramo. El cambio visible ocurre en el paso 9.

1. **Consulta base derivada** en `src/lib/db/repos/uniformes.ts`: `paginaUniformes` con el
   `CROSS JOIN` de los dos kits, el `LEFT JOIN` a `uniformes`, el CTE de hermanos, y las
   columnas `precio`, `estado` y `cat` derivadas. Sin filtros, sin orden, sin paginado —
   devuelve las 164 filas. Los precios se inyectan como parámetros desde
   `lib/domain/precios.ts`.
   _Prueba manual:_ un script suelto que la ejecuta e imprime `filas.length` → 164.

2. **Script de paridad** `scripts/verificar-estados-uniformes.mjs`: corre la consulta del paso
   1, corre `construirAlumnos()` + `estadoKit()` del dominio, y compara fila por fila `estado`,
   `precio` y `cat`. Imprime las diferencias y sale con código ≠ 0 si hay alguna.
   _Prueba manual:_ `node scripts/verificar-estados-uniformes.mjs` → **0 diferencias sobre 164
   filas**. Este paso es el que valida que la traducción a SQL es fiel; si falla, no se sigue.

3. **Filtros y orden** en `paginaUniformes`: `kit`, `estado`, `cat`, `query` (nombre sin acentos
   o número exacto) y los tres órdenes, con `NULLS LAST` en número y desempate por
   `(alumno_id, kit)`. Todavía sin `LIMIT`.
   _Prueba manual:_ el script del paso 1 con `{ kit: 'AZUL', estado: 'porCobrar' }` devuelve
   solo kits azules con pago pendiente.

4. **Paginado, total, conteos y duplicados**: `LIMIT`/`OFFSET` sobre el resultado filtrado, y en
   la misma llamada al repo el `total`, el `Record<EstadoKit, number>` sobre el total filtrado y
   los `duplicados` por kit sobre el set completo.
   _Prueba manual:_ `{ offset: 0, limit: 20 }` → 20 filas y `total: 164`; `{ offset: 160 }` → 4
   filas; las páginas 1 y 2 no repiten ninguna fila.

5. **Action** `uniformes.listarPagina` en `src/actions/`: esquema Zod de los filtros (`limit`
   acotado a [1, 50], `offset` ≥ 0), `requireUser` y gate de rol **admin** en servidor — el
   entrenador recibe error, no una lista vacía.
   _Prueba manual:_ llamarla desde la consola del navegador con sesión de admin; repetir con
   sesión de entrenador y verificar que falla.

6. **Hook** `src/features/admin/hooks/useUniformesPagina.ts`: estado de filtros, debounce de
   300 ms en la búsqueda, reset a `offset: 0` al cambiar cualquier filtro u orden, y
   `mostrarMas()` que **agrega** al final. Spinner solo en la primera carga de la sesión; los
   refetches por filtro conservan las filas previas en pantalla (misma regla anti-parpadeo del
   spec 16).
   _Prueba manual:_ aún no hay UI; se verifica en el paso 9.

7. **Primitivo `SelectFiltro`** en `src/features/admin/ui/`: un `<select>` nativo con la
   etiqueta y las opciones tipadas, estilado con los tokens de `.admin-app`. Nativo a propósito:
   en móvil abre la rueda del sistema operativo, que es más usable que cualquier menú custom y
   no cuesta un byte de JS.
   _Prueba manual:_ renderizarlo en la pantalla y abrirlo en el celular.

8. **Componentes de la vista**: `FiltrosUniformes.tsx` (buscador + los tres `SelectFiltro` + el
   de orden, con el conteo dentro de cada opción de Estado), `FilaKit.tsx` (fusión de
   `FilaEstado` y `FilaUniforme`: número, nombre, categoría, etiqueta de kit, «Abonado» si
   aplica y badge de estado) y `AlertaDuplicados.tsx` adaptado a `Record<TipoKit, number[]>`
   para mostrar los dos kits en un solo banner.
   _Prueba manual:_ los tres se montan sin errores de tipo.

9. **Swap de la pantalla**: `Uniformes.tsx` pasa a usar `useUniformesPagina` y a componer
   filtros + banner + lista + botón «Mostrar más». Aquí desaparecen los tabs.
   _Prueba manual:_ `npm run dev` → la pantalla carga 20 filas, cada filtro recorta la lista
   completa, la búsqueda por `10` encuentra al del dorsal 10, «Mostrar más» trae 20 más.

10. **Borrado de lo muerto**: se eliminan `TabsUniformes.tsx`, `EstadoTab.tsx`,
    `NumeracionTab.tsx`, `MatrizEstado.tsx`, `ToggleKit.tsx`, `ContadoresKit.tsx`,
    `FilaEstado.tsx`, `FilaUniforme.tsx` y lo que sobra de `filas.ts`. `useUniformes.ts` se
    borra solo si no le quedó ningún consumidor.
    _Prueba manual:_ `npm run check` en verde y `grep` de cada nombre borrado sin resultados.

11. **Docs**: `docs/ARCHITECTURE.md` — por qué Uniformes pagina en servidor y Alumnos/Cartera
    no, con el umbral DT-3 citado. `docs/backlog.md` — la HU de la pantalla actualizada y la
    deuda nueva de `useUniformeAlumno` (descarga toda la tabla para pintar un alumno).

---

## Criterios de aceptación

### Paridad SQL ↔ dominio

- [ ] `node scripts/verificar-estados-uniformes.mjs` reporta **0 diferencias** en `estado`,
      `precio` y `cat` sobre las 164 filas.
- [ ] El script sale con código ≠ 0 si se introduce una diferencia a propósito (por ejemplo,
      cambiando `PRECIO_UNIFORME_HERMANO` solo en dominio).
- [ ] La consulta **importa** `PRECIO_UNIFORME` y `PRECIO_UNIFORME_HERMANO` de
      `lib/domain/precios.ts`: `grep '100000'` y `grep '80000'` en `src/lib/db/` no devuelven
      nada.

### Universo y filtros

- [ ] Sin ningún filtro, `total` es **164** (82 alumnos activos × 2 kits).
- [ ] Un alumno **retirado** no aparece en ninguna fila ni suma en ningún conteo.
- [ ] Un kit **sin fila** en la tabla `uniformes` aparece igual, con estado «Sin iniciar».
- [ ] El desplegable **Kit** con «Azul» deja `total` en 82.
- [ ] El desplegable **Estado** tiene 5 opciones (Todos + los 4 estados) y filtra la lista
      completa, no la página visible.
- [ ] El desplegable **Categoría** lista las 7 del catálogo de `lib/domain/categoria.ts` más
      «Todas»; ninguna categoría está escrita a mano en el componente.
- [ ] Los tres filtros son **combinables**: Kit Azul + Pago pendiente + SUB 12 devuelve la
      intersección.

### Conteos

- [ ] El conteo de cada opción de Estado se calcula sobre el **total filtrado** por kit,
      categoría y búsqueda — no sobre la página, ni sobre el set global.
- [ ] Con «Kit Azul» puesto, la suma de los 4 conteos de Estado es exactamente 82.
- [ ] Ninguna opción de Estado con conteo > 0 devuelve una lista vacía al seleccionarla.

### Búsqueda

- [ ] Escribir `jonas` encuentra a `JONAS QUINTERO SANTANA` (sin importar mayúsculas).
- [ ] Escribir `nuñez` encuentra a `NUÑEZ` y `munoz` encuentra a `MUÑOZ` (acentos y eñes
      insensibles en los dos sentidos).
- [ ] Escribir `10` devuelve los kits cuyo **número** es exactamente 10, en ambos kits.
- [ ] La búsqueda dispara **una** petición 300 ms después de la última tecla, no una por tecla
      (verificado en la pestaña Red).
- [ ] Limpiar la búsqueda devuelve la lista completa.

### Orden

- [ ] El orden por defecto es **Prioridad**: la primera fila es «Pago pendiente».
- [ ] Con orden por **Número**, las filas sin número (`—`) quedan **al final**, no al principio.
- [ ] Con orden por **Nombre**, `Ángel` y `Angel` quedan juntos (sin acentos).
- [ ] Cambiar el orden vuelve a la primera página.

### Paginado

- [ ] La primera carga pinta **20** filas y el pie dice «20 de 164».
- [ ] «Mostrar más» **agrega** 20 al final; las 20 anteriores siguen en pantalla.
- [ ] Ninguna fila aparece dos veces al recorrer todas las páginas hasta el final.
- [ ] Cuando ya no quedan filas, el botón «Mostrar más» **desaparece**.
- [ ] Cambiar cualquier filtro, la búsqueda o el orden resetea la lista a 20 filas.
- [ ] La primera carga pide **una** sola vez a `uniformes.listarPagina`, no una por render.

### Vista y no-regresión

- [ ] La pantalla **no tiene tabs**: no existe «Estado» ni «Numeración» en la interfaz.
- [ ] Cada fila muestra número (o `—`), nombre, categoría, etiqueta de kit y badge de estado.
- [ ] Una fila con `0 < abonado < precio` muestra la palabra **«Abonado»** en su línea
      secundaria, y **ningún monto en pesos aparece en toda la pantalla**.
- [ ] El banner de números repetidos muestra los duplicados de **los dos kits** por separado y
      está siempre visible cuando existe alguno, sin depender del filtro de kit.
- [ ] Tocar una fila abre la pantalla de gestión del uniforme de ese alumno, como antes.
- [ ] De 320 px a desktop: **cero scroll horizontal**.
- [ ] El **entrenador** no ve esta pantalla y `uniformes.listarPagina` le responde error con su
      sesión.
- [ ] `FichaPlantel` (entrenador) y la pantalla de gestión del kit siguen funcionando: nadie
      rompió `uniformes.listar`.

### Calidad

- [ ] Ningún archivo supera 200 líneas efectivas; cero `any`; `npm run check` y `npm run build`
      en verde.
- [ ] `grep` de `TabsUniformes`, `EstadoTab`, `NumeracionTab`, `MatrizEstado`, `ToggleKit`,
      `ContadoresKit`, `FilaEstado` y `FilaUniforme` no devuelve resultados en `src/`.
- [ ] `docs/backlog.md` registra la deuda de `useUniformeAlumno` con su disparador.
- [ ] `docs/ARCHITECTURE.md` explica por qué Uniformes pagina en servidor y Alumnos/Cartera no.

---

## Decisiones

- **Sí:** una sola vista con buscador y desplegables, en vez de dos tabs. Los tabs modelaban
  dos universos distintos (164 kits vs. 82 alumnos de un kit) y obligaban a saber de antemano
  dónde vive cada respuesta.
- **Sí:** la fila es **un kit**, no un alumno. Con un alumno por fila el filtro por estado se
  vuelve ambiguo (¿se muestra la tarjeta si uno de los dos kits cumple?), el orden por número
  deja de existir (un alumno tiene dos números) y la tarjeta duplica su altura sin ahorrar
  scroll.
- **Sí:** filtrado, orden, conteos y paginado **en SQL**. Es la forma correcta de un paginado:
  el filtro se aplica sobre todo el conjunto y se devuelve una página.
- **No:** leer las 164 filas y filtrarlas en el servidor con JavaScript. Se consideró porque
  permitía reusar `lib/domain` sin escribir SQL, pero es traer todo para descartar casi todo.
- **No:** un endpoint aparte solo para los conteos. Los conteos salen de la misma consulta que
  ya recorre el conjunto filtrado; una segunda llamada solo agrega latencia y una ventana en la
  que el conteo y la lista no coinciden.
- **Sí:** la consulta vive en **una sola función** del repo, con los precios importados de
  `lib/domain/precios.ts` y un script de paridad que la contrasta con el dominio. La regla queda
  expresada dos veces (TypeScript y SQL) y ese es el costo real de esta decisión; el script es
  lo que impide que las dos versiones se separen en silencio.
- **Sí:** un desplegable de **Estado con 4 opciones**, no dos desplegables cruzables
  (Entrega × Pago). Las 4 etiquetas son el vocabulario que el club ya ve en los badges.
- **No:** exponer «Abonado» como opción de filtro. Queda visible en la fila, pero filtrar por
  abono parcial no es una pregunta que el club haga hoy.
- **Sí:** `<select>` nativo. En móvil abre el selector del sistema operativo, que gana en
  usabilidad a cualquier menú custom y no agrega JavaScript.
- **Sí:** botón «Mostrar más» que agrega al final, en vez de paginador numérico. La pantalla es
  mobile-first; un `‹ 1 2 3 ›` es un blanco chico para el pulgar.
- **Sí:** 20 filas por página. Con 10 el botón se toca demasiado seguido; la fila es baja y en
  un celular entran cerca de 8 por pantalla.
- **Sí:** `NULLS LAST` al ordenar por número, y desempate por `(alumno_id, kit)` en los tres
  órdenes. Sin lo primero, la lista arranca con los kits sin entregar; sin lo segundo, `OFFSET`
  puede repetir u omitir filas entre páginas.
- **Sí:** `translate()` para ignorar acentos, no la extensión `unaccent`. Evita depender de
  habilitar una extensión en Neon; la lista de caracteres queda cubierta por el script de
  paridad.
- **No:** migrar Alumnos y Cartera a paginado de servidor en este spec. Siguen con el paginado
  de render del spec 16; Uniformes es la única lista que crece 2× por alumno.
- **No:** tocar la pantalla de gestión del kit, la ficha ni la vista del entrenador.

---

## Riesgos

| Riesgo                                                                                      | Mitigación                                                                                                                    |
| ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| La regla del estado queda escrita en TypeScript y en SQL, y las dos se separan con el tiempo | `scripts/verificar-estados-uniformes.mjs` las compara sobre el set completo y es criterio de aceptación                       |
| `OFFSET` con orden no único repite u omite filas entre páginas                              | Desempate obligatorio por `(alumno_id, kit)` en los tres órdenes                                                              |
| `translate()` no cubre algún carácter acentuado presente en los nombres reales              | El script de paridad corre sobre los acudientes y nombres reales de la base, no sobre un caso inventado                       |
| Un cambio en `precios.ts` no llega a la consulta                                            | Los valores se **inyectan** desde el módulo de dominio; el criterio de aceptación exige que no haya números mágicos en `db/`  |
| El entrenador llama la Action nueva directamente                                            | Gate de rol admin en servidor dentro de la Action, no en el cliente                                                           |
| Cada tecla del buscador dispara una consulta a Neon                                         | Debounce de 300 ms, verificado en la pestaña Red como criterio                                                                |
| El abono parcial se vuelve invisible al fusionar los dos badges                             | La fila muestra «Abonado» en su línea secundaria cuando `0 < abonado < precio`                                                |

---

## Lo que **no** está en este spec

- La pantalla de gestión del kit (`/admin/alumnos/:id/uniforme`).
- El tab Uniforme de la ficha del alumno.
- La vista del entrenador (`FichaPlantel`, `useUniformesEntrenador`).
- Arreglar `useUniformeAlumno`, que descarga toda la tabla de uniformes para pintar un alumno
  — queda **registrado como deuda** en `docs/backlog.md`.
- Migrar Alumnos y Cartera a paginado de servidor.
- Tarifas de uniforme configurables (HU-7.3, `Could`).

Cada una de esas, si llega, va en su propio spec.
