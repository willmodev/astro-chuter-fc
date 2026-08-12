# SPEC 20 — Anular pago de mensualidad

> **Estado:** Aprobado · **Depende de:** SPEC 06 (tab Pagos de la ficha y pantalla Registrar pago), SPEC 11 (persistencia de pagos en Neon y patrón Action + refetch pesimista), SPEC 14 (un retirado conserva su historial de pagos) · **Fecha:** 2026-08-12
> **Objetivo:** Permitir que un admin anule un pago de mensualidad registrado por error, dejando rastro en la base y devolviendo el mes a su estado de cobro derivado.

---

## Por qué existe este spec

Durante la fase de prueba con el cliente se registró el cobro de un **mes equivocado**. El
sistema no tiene forma de deshacerlo: `pagos.registrar` es la única operación sobre la tabla
`pagos` y solo inserta. La única salida hoy es un `DELETE` a mano contra la base de producción.

Eso es un problema de dos filas:

- **Operativo.** El mes queda "pagado" para siempre: infla "Recaudado año", baja la cartera
  vencida y el alumno deja de aparecer en mora por un mes que nadie pagó. Los tres números que
  el cliente mira en el dashboard quedan mal.
- **De confianza.** El club está aprendiendo a usar el back-office. Un error de dedo que solo se
  arregla con SQL enseña que el sistema no perdona, y empuja a volver al Excel.

El módulo ya tiene el precedente de la reversa: `anularEntrega` en uniformes (servicio + Action +
hoja de confirmación). Este spec aplica el mismo patrón al dinero, con una diferencia: la
entrega de un uniforme se revierte cambiando un booleano, mientras que un pago **desaparece**
como fila — y por eso acá el rastro es explícito y el motivo obligatorio.

---

## Alcance

**Dentro:**

- **Migración de `pagos`** (`src/lib/db/schema/pagos.ts` + Drizzle): tres columnas nuevas —
  `anulado_en` (timestamp, nullable), `anulado_por` (FK a `user.id`, nullable) y
  `motivo_anulacion` (text, nullable) — y el `unique(alumno_id, anio, mes)` convertido en
  **índice único parcial** con `WHERE anulado_en IS NULL`, para que un mes anulado se pueda
  volver a cobrar.
- **Repo `src/lib/db/repos/pagos.ts`:** `pagosPorAnio` y `pagosDeAlumno` filtran
  `anulado_en IS NULL` (los anulados dejan de existir para toda derivación). Se agrega
  `anularPago(alumnoId, anio, mes, { anuladoPor, motivo })`, que marca la fila viva de ese mes y
  devuelve si encontró algo, y `detallePagosDeAlumno(alumnoId, anio)` para la ficha.
- **Servicio `src/lib/services/cartera.ts`:** `anularPago(input)` — verifica que exista un pago
  vivo en ese mes, falla con `AlumnoReglaError` si no, y delega al repo. Se permite sobre
  alumnos **retirados** y sobre pagos de la **carga inicial** (los que tienen `metodo`,
  `pagado_en` y `registrado_por` en `null`).
- **Action `pagos.anular({ alumnoId, anio, mes, motivo })`** en `src/actions/pagos.ts`, con Zod
  (`motivo` recortado, mínimo 5 caracteres) y `requireAdmin` — el entrenador recibe error, igual
  que en `pagos.registrar`.
- **Contrato de la ficha:** `alumnos.porId` pasa de devolver `{ alumno }` a `{ alumno, pagos }`,
  donde `pagos` es el detalle de los pagos vivos del año (mes, monto, fecha, método, autor). Sale
  de la consulta que `alumnoAdminPorId` ya hace; el contrato de las listas (Cartera, Alumnos,
  dashboard) **no cambia**.
- **UI en el tab Pagos de la ficha** (`PagosDelAnio.tsx`): la celda de un mes `paid` se vuelve
  tocable y abre `HojaAnularPago.tsx` (mismo patrón que `HojaRetiro`), que muestra mes, monto
  real, fecha y autor del pago, pide el motivo y confirma. Tras confirmar, refetch pesimista y
  el mes vuelve a `due`/`pending`.
- **La celda `paid` es tocable incluso con `cobrosHabilitados` en `false`** (alumno retirado):
  ese flag apaga cobrar, no corregir.
- **Docs:** `docs/backlog.md` — HU nueva en el EPIC 3 (anular pago) y la deuda del abono de
  uniforme sin reversa; `docs/ARCHITECTURE.md` — por qué `pagos` es la única tabla con soft
  delete.

**Fuera del alcance (otros specs):**

- **Anular el abono de uniforme.** `uniformes.registrarPago` sigue sumando sin poder bajar. Queda
  como deuda registrada en `docs/backlog.md`, no se arregla acá.
- **Anular desde la pantalla Cartera** (tarjetas y matriz). El único punto de entrada es la ficha
  del alumno; en Cartera la celda pagada sigue inerte.
- **Pantalla de historial o auditoría de anulaciones.** El rastro queda en la base y se consulta
  por SQL.
- **Editar un pago** (cambiar mes, método o monto). El camino es anular y volver a registrar.
- **Anular varios meses en una sola operación.** Una celda, una anulación; tres meses mal
  cobrados son tres confirmaciones.
- **Aviso al acudiente por WhatsApp** de que un cobro se anuló.
- **Anulación por parte del entrenador.** Sigue sin ver ni tocar dinero.

---

## Modelo de datos

Este spec **altera una tabla** (`pagos`) y **no crea ninguna**. No toca `alumnos`, `uniformes`
ni `entrenos`.

### `pagos` — tres columnas y un índice

```ts
// src/lib/db/schema/pagos.ts
export const pagos = pgTable(
  'pagos',
  {
    // … columnas actuales sin cambios …
    anuladoEn: timestamp('anulado_en'), // null = pago vivo
    anuladoPor: text('anulado_por').references(() => user.id),
    motivoAnulacion: text('motivo_anulacion'),
  },
  (t) => [
    // Reemplaza a `unique().on(...)`: un solo pago VIVO por alumno-año-mes.
    uniqueIndex('pagos_alumno_anio_mes_vivo')
      .on(t.alumnoId, t.anio, t.mes)
      .where(sql`${t.anuladoEn} is null`),
  ],
);
```

**Por qué el índice tiene que ser parcial:** con el `unique` actual, anular AGO y volver a
cobrarlo choca contra la constraint, porque la fila anulada sigue ocupando la combinación
`(alumno, 2026, AGO)`. La migración **elimina** `pagos_alumno_id_anio_mes_unique` y crea el
índice parcial en su lugar.

**Invariante:** las tres columnas viajan juntas. O las tres son `null` (pago vivo), o las tres
tienen valor (pago anulado). No existe estado intermedio, y nada las vuelve a `null`: anular es
definitivo — reactivar un pago es registrarlo de nuevo.

### Un pago anulado no existe para nadie que derive estados

`pagosPorAnio` y `pagosDeAlumno` agregan `anulado_en IS NULL` al `WHERE`. Con eso, **sin tocar
una sola línea de `lib/domain/cartera.ts`**, el mes anulado vuelve a `due` o `pending`, sale del
recaudo del año y del mes, vuelve a sumar a la cartera vencida y el alumno reaparece en morosos.
La derivación no sabe que existe la anulación, y esa es la idea.

### Detalle de pagos para la ficha

```ts
// src/lib/db/repos/pagos.ts — nuevo, solo para la ficha
export interface PagoDetalle {
  mes: Mes;
  montoCop: number;
  pagadoEn: Date | null; // null = carga inicial del Excel
  metodo: string | null; // null = carga inicial del Excel
  registradoPorNombre: string | null; // null = carga inicial del Excel
}
```

`registradoPorNombre` es el **nombre** del admin, no su id: la hoja lo muestra en pantalla. Sale
de un `LEFT JOIN` a `user`, que es `LEFT` a propósito — los pagos del seed no tienen autor y
tienen que seguir apareciendo.

### Contrato de la Action de la ficha

```ts
// alumnos.porId — antes: { alumno }
{ alumno: Alumno | undefined, pagos: PagoDetalle[] }
```

Solo los pagos **vivos** del año en curso, que son los únicos que la ficha puede anular.
`PagoDetalle` es un tipo de la capa de datos, no del contrato de UI de
`features/admin/data/types.ts`: la ficha lo consume tal cual y ningún otro consumidor lo ve.

### Entrada del servicio

```ts
export interface AnularPagoInput {
  alumnoId: number;
  anio: number;
  mes: Mes;
  motivo: string; // recortado, mínimo 5 caracteres (validado en la Action)
  anuladoPor: string; // id del admin de la sesión
}
```

**Convenciones:**

- `anulado_en` lo pone el **servidor** (`new Date()`), nunca el cliente.
- El `motivo` se guarda recortado (`trim`), tal como lo escribió el admin, sin categorías ni
  enum: un catálogo de motivos es una decisión de producto que hoy nadie pidió.
- La cuota **no se recalcula** al anular. `monto_cop` de la fila es histórico y se conserva
  intacto.

---

## Plan de implementación

Los pasos 1 a 5 no cambian nada de lo que el usuario ve: la app sigue funcionando igual mientras
se construye la mecánica por debajo. El cambio visible ocurre en el paso 7.

1. **Schema y migración.** Agregar las tres columnas a `src/lib/db/schema/pagos.ts` y cambiar
   `unique().on(...)` por el `uniqueIndex(...).where(...)` parcial. `npm run db:generate` y
   **revisar el SQL emitido a mano**: tiene que traer el `DROP CONSTRAINT
   pagos_alumno_id_anio_mes_unique` y un `CREATE UNIQUE INDEX … WHERE "anulado_en" is null`. Si
   `drizzle-kit` omite el `WHERE`, se edita el archivo de migración antes de aplicarlo. Luego
   `npm run db:migrate`.
   _Prueba manual:_ `npm run dev` → la cartera, la ficha y el dashboard muestran exactamente los
   mismos números que antes de la migración (las columnas nuevas están en `null` y nadie las
   lee).

2. **Repo: filtrar anulados.** `pagosPorAnio` y `pagosDeAlumno` suman `isNull(pagos.anuladoEn)` a
   su `WHERE`.
   _Prueba manual:_ los números del dashboard no cambian (todavía no hay ninguna fila anulada);
   marcar una fila a mano en la base con `anulado_en = now()`, recargar y ver que ese mes vuelve
   a rojo — después dejarla en `null` otra vez.

3. **Repo: `anularPago` y `detallePagosDeAlumno`.** El primero hace `UPDATE … SET anulado_en,
   anulado_por, motivo_anulacion WHERE alumno_id = … AND anio = … AND mes = … AND anulado_en IS
   NULL`, con `returning` para saber si tocó una fila. El segundo es el `LEFT JOIN` a `user` que
   devuelve `PagoDetalle[]` de los pagos vivos del año.
   _Prueba manual:_ un script suelto que imprime el detalle de un alumno con pagos y verifica que
   los del seed aparecen con autor `null`.

4. **Servicio `anularPago`** en `src/lib/services/cartera.ts`: valida que el alumno exista, llama
   al repo y lanza `AlumnoReglaError('Ese mes no tiene un pago registrado.')` si no se tocó
   ninguna fila. **No** valida que el alumno esté activo — a diferencia de `registrarPagos`.
   _Prueba manual:_ el mismo script, llamando al servicio con un mes sin pago → error claro; con
   un mes pagado → la fila queda anulada.

5. **Action `pagos.anular`** en `src/actions/pagos.ts` + registro en `src/actions/index.ts`. Zod:
   `alumnoId` entero positivo, `anio` en [2026, 2100], `mes` del enum `MESES`, `motivo` string
   recortado con mínimo 5 caracteres. `requireAdmin`.
   _Prueba manual:_ llamarla desde la consola del navegador con sesión de admin (anula) y con
   sesión de entrenador (`FORBIDDEN`); con `motivo: 'x'` devuelve error de validación.

6. **Contrato de la ficha.** `alumnoAdminPorId` devuelve `{ alumno, pagos }`, `alumnos.porId`
   lo pasa tal cual, y `useAlumno` expone `pagos` más una función `anularPago(mes, motivo)` que
   llama la Action y hace `recargar()` (mismo patrón que `cambiarActivo`).
   _Prueba manual:_ la ficha carga igual que antes; `pagos` visible en las devtools de React.

7. **UI.** `HojaAnularPago.tsx` (hoja con mes, monto, fecha y autor del pago; `textarea` de
   motivo; botón Anular deshabilitado hasta 5 caracteres) y `PagosDelAnio.tsx` con la celda
   `paid` tocable — `aria-label` "Anular pago de <Mes>", y tocable también cuando
   `cobrosHabilitados` es `false`. `Ficha.tsx` orquesta el estado de la hoja.
   _Prueba manual:_ `npm run dev` → tocar un mes verde abre la hoja con los datos correctos,
   confirmar deja el mes en rojo, y recargar la página lo mantiene en rojo.

8. **Cierre.** `npm run check` en verde, `docs/backlog.md` con la HU nueva del EPIC 3 y la deuda
   del abono de uniforme, y `docs/ARCHITECTURE.md` con el párrafo del soft delete.

---

## Criterios de aceptación

### Migración

- [ ] Después de `npm run db:migrate`, la tabla `pagos` tiene `anulado_en`, `anulado_por` y
      `motivo_anulacion`, y las tres están en `null` en todas las filas existentes.
- [ ] La constraint `pagos_alumno_id_anio_mes_unique` **ya no existe** y en su lugar hay un índice
      único con `WHERE anulado_en IS NULL`.
- [ ] Insertar dos pagos vivos del mismo alumno-año-mes sigue fallando.
- [ ] Insertar un pago para un alumno-año-mes que ya tiene una fila **anulada** funciona.
- [ ] Los totales del dashboard (recaudo año, recaudo mes, cartera vencida, % al día) son
      idénticos antes y después de la migración.

### Anulación

- [ ] Anular un mes pagado lo devuelve a **rojo (debe)** si ya venció, o a **gris (pendiente)** si
      no.
- [ ] Tras anular, el monto sale del "Recaudado año" y del recaudo del mes, y vuelve a sumar a la
      "Cartera vencida".
- [ ] Tras anular un mes vencido, el alumno reaparece en "Cobros pendientes" del dashboard.
- [ ] El mes anulado se puede **volver a cobrar** desde Registrar pago, y queda verde otra vez.
- [ ] La fila anulada conserva `monto_cop`, `metodo`, `pagado_en` y `registrado_por` intactos, y
      guarda `anulado_en`, `anulado_por` y el `motivo_anulacion` que se escribió.
- [ ] Recargar la página mantiene la anulación (persiste en Neon, no es estado de cliente).
- [ ] Anular dos veces el mismo mes no es posible: la segunda vez la celda ya no está en `paid`.

### Reglas y permisos

- [ ] `pagos.anular` responde error con sesión de **entrenador** y sin sesión (`FORBIDDEN` /
      `UNAUTHORIZED`).
- [ ] Un `motivo` de menos de 5 caracteres (o solo espacios) es rechazado por la Action.
- [ ] Se puede anular el pago de un alumno **retirado** sin reactivarlo.
- [ ] Se puede anular un pago de la **carga inicial** (sin método, fecha ni autor).
- [ ] Anular un mes que no tiene pago devuelve el mensaje "Ese mes no tiene un pago registrado."
      en vez de un error genérico.

### Interfaz

- [ ] En el tab Pagos de la ficha, una celda **verde** es un botón; una celda `na` sigue sin ser
      tocable.
- [ ] La celda verde es tocable también en un alumno **retirado**, aunque las celdas cobrables
      sigan apagadas.
- [ ] La hoja muestra el nombre largo del mes, el monto real de la fila en formato COP, la fecha
      del pago y el nombre de quien lo registró.
- [ ] Cuando el pago viene de la carga inicial, la hoja lo dice explícitamente en vez de mostrar
      campos vacíos.
- [ ] El botón Anular está deshabilitado mientras el motivo tenga menos de 5 caracteres.
- [ ] Cerrar la hoja sin confirmar no cambia nada.
- [ ] De 320 px a desktop: cero scroll horizontal en la hoja.

### Calidad

- [ ] `npm run check` en verde (astro check + eslint).
- [ ] Ningún archivo supera 200 líneas efectivas; cero `any`.
- [ ] `docs/backlog.md` tiene la HU de anular pago en el EPIC 3 y la deuda del abono de uniforme
      sin reversa.
- [ ] `docs/ARCHITECTURE.md` explica por qué `pagos` usa soft delete y las demás tablas no.

---

## Decisiones

- **Sí:** **soft delete** (`anulado_en`, `anulado_por`, `motivo_anulacion`) en vez de `DELETE`.
  Son movimientos de dinero y el error ya ocurrió una vez; el rastro es lo único que después
  permite explicar un descuadre. Si nunca se consulta, no costó nada.
- **No:** `DELETE` de la fila. Más simple y el recaudo se corrige solo, pero el error desaparece
  sin dejar quién, cuándo ni por qué.
- **Sí:** **índice único parcial** (`WHERE anulado_en IS NULL`) reemplazando la constraint. Es lo
  que hace que un mes anulado se pueda volver a cobrar, que es el 100 % de los casos de uso: se
  anula porque hay que cobrar otra cosa.
- **No:** reutilizar la fila anulada haciendo `UPDATE` al volver a cobrar. Ahorraría el índice
  parcial, pero pisaría el rastro que este spec existe para crear.
- **Sí:** **filtrar los anulados en el repo**, no en el dominio. Así `lib/domain/cartera.ts` no
  se toca y no hay dos lugares donde un pago puede "contar o no contar".
- **Sí:** **cualquier admin, sin ventana de tiempo.** Con 2 admins y una base chica, una ventana
  de "solo hoy" solo garantiza que el error de ayer termine arreglándose con SQL a mano, que es
  justo lo que este spec viene a eliminar.
- **No:** restringir la anulación al admin que registró el pago. Son dos personas que trabajan
  sobre el mismo plantel; bloquear al otro no protege nada.
- **Sí:** **motivo obligatorio** de 5 caracteres mínimo. Sin motivo el rastro guarda cuándo y
  quién, que es la mitad menos útil de la respuesta.
- **No:** enum o catálogo de motivos. Nadie pidió reportar por causa de anulación, y un catálogo
  cerrado obliga a elegir "Otro" el día que no encaja.
- **Sí:** **un solo punto de entrada — la celda verde del tab Pagos de la ficha.** Es donde el
  admin ya está mirando cuando detecta el error, y es la única pantalla con contexto suficiente
  (monto, fecha, autor) para confirmar con seguridad.
- **No:** anular desde la celda de Cartera. Ahí la celda es de 8 px en móvil y no hay espacio
  para mostrar los datos del pago; un toque accidental sobre dinero es un riesgo real.
- **Sí:** **permitir anular con el alumno retirado**, a diferencia de `registrarPagos`, que lo
  bloquea. Corregir un error no es cobrar, y exigir reactivar al alumno para arreglar un typo
  agrega dos mutaciones a un flujo que debería tener una.
- **Sí:** **permitir anular los pagos de la carga inicial** del Excel. Son los más propensos a
  estar mal, porque nadie los revisó uno por uno.
- **Sí:** **extender `alumnos.porId` a `{ alumno, pagos }`** para alimentar la hoja. La Action ya
  devolvía un objeto envoltorio, ya consultaba `pagosDeAlumno`, y el contrato de las listas no se
  entera.
- **No:** una Action nueva `pagos.detalleMes` que la hoja llama al abrirse. Agrega un round trip
  y un estado de carga dentro de una hoja de confirmación.
- **No:** mostrar en la hoja la cuota actual (`alumno.cuota`) en lugar del monto real de la fila.
  Cuesta lo mismo traer el dato correcto, y el día que la cuota cambie la hoja mentiría sobre lo
  que se está anulando.
- **Sí:** **una celda, una anulación.** Registrar pago acepta varios meses porque cobrar varios
  meses juntos es normal; anular varios a la vez no lo es, y cada anulación tiene su propio
  motivo.
- **No:** pantalla de auditoría de anulaciones en este spec. El rastro existe desde el día uno en
  la base; la pantalla se construye cuando alguien la necesite.
- **No:** tocar el abono de uniforme, que también es irreversible hoy. Es el mismo problema en
  otra tabla y con otro modelo (monto acumulado, no fila por mes); mezclarlo duplicaría el
  tamaño del spec.

---

## Riesgos

| Riesgo                                                                                              | Mitigación                                                                                                                            |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| La migración corre contra la **base de producción** (no hay entorno de pruebas)                     | Es aditiva: tres columnas nulables y un cambio de índice. El paso 1 exige revisar el SQL antes de aplicarlo y verificar que los totales del dashboard no se muevan |
| `drizzle-kit` no emite el `WHERE` del índice parcial y crea un único total                          | El paso 1 obliga a leer el SQL generado; si falta el `WHERE`, se edita a mano antes de `db:migrate`. El criterio "insertar sobre una fila anulada funciona" lo detecta |
| Queda un consumidor de pagos que no filtra `anulado_en` y sigue contando el pago anulado            | Los únicos accesos a `pagos` son `pagosPorAnio` y `pagosDeAlumno`; el criterio compara los cuatro totales del dashboard antes y después de anular  |
| Un toque accidental sobre una celda verde anula un pago bueno                                       | La celda solo abre una hoja; anular exige escribir un motivo de 5+ caracteres y confirmar                                              |
| El entrenador llama `pagos.anular` directamente                                                     | `requireAdmin` en la Action, en servidor, igual que `pagos.registrar`                                                                  |
| Se anula un pago y nadie recuerda por qué                                                           | `motivo_anulacion` obligatorio, más `anulado_por` y `anulado_en`                                                                       |
| El monto anulado descuadra contra un recibo de WhatsApp ya enviado al acudiente                     | Fuera del alcance técnico: el club avisa por su cuenta. Queda anotado como pendiente de producto, no de código                         |

---

## Lo que **no** está en este spec

- Anular o bajar el **abono de uniforme** (`uniformes.registrarPago`) — queda registrado como
  deuda en `docs/backlog.md`.
- Anular desde la pantalla **Cartera** (tarjetas y matriz).
- **Pantalla de historial o auditoría** de anulaciones.
- **Editar** un pago (mes, método o monto): se anula y se registra de nuevo.
- Anular **varios meses** en una sola operación.
- Anular pagos de **años anteriores**: la ficha solo pinta el año en curso, así que la anulación
  llega hasta donde llega esa vista. Hoy la base solo tiene pagos de 2026.
- **Aviso al acudiente** de que un cobro se anuló.
- Anulación por parte del **entrenador**.

Cada una de esas, si llega, va en su propio spec.
