# SPEC 21 — Editar usuarios y traspaso de categorías

> **Estado:** Implementado · **Depende de:** SPEC 04 (pantalla Equipo, roles y plugin `admin` de
> Better Auth), SPEC 15 (catálogo único de categorías y la regla de un entrenador por
> categoría) · **Fecha:** 2026-08-18
> **Objetivo:** Permitir que un admin corrija el nombre y el correo de cualquier usuario del
> equipo y reasigne las categorías de un entrenador, traspasando en la misma operación las que
> ya tenga otro.

---

## Por qué existe este spec

El spec 04 dejó "editar nombre/rol de un usuario existente" explícitamente fuera de alcance: la
pantalla Equipo solo sabe **crear, desactivar/reactivar y resetear contraseña**. Con el club ya
operando, eso deja dos callejones sin salida:

- **Un dato mal escrito es permanente.** Un nombre con typo o un correo equivocado solo se
  arregla creando otro usuario y desactivando el anterior, lo que ensucia la lista del equipo y
  deja al usuario original sin poder entrar.
- **Una categoría no se puede mover entre entrenadores.** `SelectorCategorias.tsx` deshabilita el
  checkbox de toda categoría con dueño activo y `validaDisponibles()` la rechaza también en el
  servidor. Como no hay pantalla de edición, la única forma de liberar SUB 12 es **desactivar a
  Óscar** — es decir, sacarlo del club para mover un grupo.

La regla del spec 15 ("una categoría pertenece a un solo entrenador activo") sigue en pie y no se
toca. Lo que cambia es **cómo se llega a cumplirla**: hasta hoy se cumplía bloqueando; desde acá
se cumple traspasando, que es la operación que el club realmente necesita.

---

## Alcance

**Dentro:**

- **Action `usuarios.editar({ userId, name, email, cats })`** en `src/actions/usuarios.ts`, con
  Zod (mismos límites que `crear`: nombre 2–80, email válido, `cats` acotado a `ETIQUETAS`) y
  `requireAdmin`.
- **Servicio `editarUsuario(headers, actorId, input)`** en `src/lib/services/usuarios.ts`:
  resuelve el traspaso, valida y escribe. Actualiza `name`/`email` vía
  `auth.api.adminUpdateUser` y las `cats` (las del editado y las de quienes pierden una) vía
  repo, dentro de una transacción.
- **Traspaso de categorías.** Marcar una categoría que hoy tiene otro entrenador **activo** se la
  quita a ese entrenador y se la da al que se está editando, en la misma operación. Ningún
  entrenador puede terminar con una categoría repetida.
- **Reglas puras nuevas en `src/lib/domain/usuarios.ts`:** `traspasosDe(catsNuevas, usuarios,
targetId)` → lista de `{ etiqueta, de }` (quién pierde qué), y
  `emailDisponible(usuarios, targetId, email)` → `false` si otro usuario ya lo tiene.
- **Repo `src/lib/db/repos/usuarios.ts`:** `actualizarCats(cambios)` — recibe pares
  `{ userId, cats }` y los escribe en una sola transacción.
- **Campos editables: nombre, correo y categorías.** El **rol no se edita** ni viaja en el input.
- **Usuarios inactivos:** se les edita nombre y correo; el selector de categorías queda
  bloqueado con la nota "Reactivá al entrenador para asignarle categorías". El servidor ignora
  `cats` si el usuario está inactivo.
- **Usuarios admin:** solo nombre y correo (un admin no tiene categorías; `cats` se ignora).
- **Auto-edición:** un admin puede editar su propio nombre y correo.
- **UI:** botón **"Editar"** como primera acción de `UsuarioCard.tsx` (la fila de botones pasa a
  `flexWrap: 'wrap'` para que en pantalla angosta bajen solos), nueva hoja
  `EditarUsuarioSheet.tsx`, `SelectorCategorias.tsx` con prop `permitirTraspaso`, y un resumen de
  traspasos arriba del botón Guardar.
- **Refetch pesimista:** tras guardar, `useEquipo.recargar()` — igual que `crear` y
  `toggleActivo`.
- **Docs:** `docs/backlog.md` (HU de edición de usuarios en el EPIC de Equipo) y nota en el
  spec 04 de que su "fuera de alcance" quedó cubierto acá.

**Fuera del alcance (otros specs):**

- **Cambiar el rol** de un usuario existente (admin ↔ entrenador). Sigue siendo alta nueva.
- **Eliminar usuarios.** El club conserva historial; desactivar sigue siendo la salida.
- **Auto-servicio:** que un entrenador edite su propio perfil o cambie su contraseña. La
  edición vive solo en la pantalla Equipo, que es de admins.
- **Historial o auditoría de cambios** (quién editó qué y cuándo). No se registra.
- **Aviso por correo** al usuario de que su correo o sus categorías cambiaron.
- **Reasignar los entrenos ya registrados** cuando una categoría cambia de dueño. Las sesiones y
  planes guardados quedan atados a su `entrenador_id` original — ver Riesgos.
- **Exigir que un entrenador tenga al menos una categoría.** Puede quedar con cero, igual que
  hoy en el alta; el banner de "categorías sin entrenador" ya lo hace visible.

---

## Modelo de datos

**Este spec no crea ni altera tablas.** Reusa `user` (spec 04) con sus columnas `name`, `email` y
`cats`. Lo que aparece son contratos nuevos.

### Input de la edición (`features/admin/screens/equipo/types.ts`)

```ts
export interface EditarUsuarioInput {
  userId: string;
  name: string;
  email: string;
  cats: string[]; // ignorado si el usuario es admin o está inactivo
}

// Una categoría que cambia de dueño al guardar: alimenta el resumen de la hoja.
export interface Traspaso {
  etiqueta: string; // 'SUB 12'
  de: string; // 'Óscar Cárdenas'
}
```

`CategoriaAsignable` (ya existente) no cambia de forma: `ocupadaPor` sigue trayendo el nombre del
dueño activo. Lo que cambia es su lectura en la UI — en modo edición, `ocupadaPor` deja de
significar "bloqueada" y pasa a significar "se la quitás a esta persona".

### Escritura de categorías (`lib/db/repos/usuarios.ts`)

```ts
// Un solo `db.transaction`: o se mueven todas las categorías, o ninguna.
export async function actualizarCats(
  cambios: readonly { userId: string; cats: string[] }[],
): Promise<void>;
```

Convenciones que se mantienen del spec 15: las etiquetas viajan normalizadas (`'SUB 12'`), el
catálogo sigue siendo `src/lib/domain/categoria.ts`, y solo los entrenadores **activos** ocupan
categoría.

---

## Plan de implementación

1. **Reglas puras.** Agregar `traspasosDe()` y `emailDisponible()` a
   `src/lib/domain/usuarios.ts`. Sin tocar nada más. Prueba manual: todavía no hay flujo nuevo,
   `npm run check` debe quedar en verde.
2. **Repo.** Agregar `actualizarCats(cambios)` en `src/lib/db/repos/usuarios.ts` con
   `db.transaction`.
3. **Servicio.** `editarUsuario(headers, actorId, input)` en `src/lib/services/usuarios.ts`:
   busca al usuario, valida que exista, valida el correo con `emailDisponible` (si cambió),
   descarta `cats` si el usuario es admin o está inactivo, normaliza con `normalizaCats`,
   calcula los traspasos, escribe las categorías con `actualizarCats` y luego el nombre y el
   correo con `auth.api.adminUpdateUser`. Los errores de regla salen como `UsuarioReglaError`.
4. **Action.** `editar` en `src/actions/usuarios.ts`, con Zod y `requireAdmin`, envuelta en el
   `comoAccion()` que ya existe.
5. **Hook.** `editar(input)` en `useEquipo.ts`, con el mismo contrato que `crear`: devuelve
   `null` si salió bien o el mensaje de error, y hace `recargar()` al terminar.
6. **Selector.** Prop `permitirTraspaso` en `SelectorCategorias.tsx`: con `true`, las ocupadas
   son seleccionables y el nombre del dueño se muestra como "hoy: Óscar Cárdenas"; con `false`
   (alta) se comporta exactamente como hoy.
7. **Hoja de edición.** `EditarUsuarioSheet.tsx` con nombre, correo, el selector (solo para
   entrenadores activos) y el resumen de traspasos arriba del botón Guardar.
8. **Tarjeta y pantalla.** Botón "Editar" en `UsuarioCard.tsx` con `flexWrap: 'wrap'` en la fila
   de acciones, y la rama `{ tipo: 'editar', usuario }` en el `SheetState` de
   `EquipoScreen.tsx`. Si el archivo pasa de 200 líneas, extraer el bloque de hojas a
   `SheetsEquipo.tsx`.
9. **Docs.** HU en `docs/backlog.md` y nota en `specs/04-auth-y-usuarios-admin.md`.

---

## Criterios de aceptación

- [x] Cada tarjeta de la pantalla Equipo tiene un botón "Editar" y los tres botones se ven
      completos en un viewport de 360 px de ancho, sin desbordar.
- [x] Editar el nombre de un usuario y guardar deja el nombre nuevo en la lista tras el refetch,
      sin recargar la página.
- [x] Editar el correo de un usuario y guardar le permite iniciar sesión con el correo nuevo, y
      el anterior deja de funcionar.
- [x] Intentar poner un correo que ya usa otro usuario muestra un mensaje de error en la hoja y
      no guarda nada.
- [x] Al editar un entrenador, las categorías que tiene otro entrenador activo aparecen
      seleccionables y muestran el nombre de su dueño actual.
- [x] Marcar SUB 12 (que tiene Óscar) en la edición de Cristian y guardar deja SUB 12 en la
      tarjeta de Cristian y la quita de la de Óscar, en una sola operación.
- [x] Después de ese traspaso, ninguna categoría aparece en dos tarjetas a la vez.
- [x] Desmarcar todas las categorías de un entrenador y guardar lo deja con cero y suma esas
      categorías al banner de "categorías sin entrenador asignado".
- [x] La hoja lista los traspasos pendientes ("SUB 12 · hoy de Óscar Cárdenas") antes de
      confirmar, y el listado se actualiza al marcar y desmarcar.
- [x] La hoja de edición **no** muestra ningún control de rol.
- [x] Al editar un usuario admin, la hoja muestra solo nombre y correo, sin selector de
      categorías.
- [x] Al editar un entrenador desactivado, el selector aparece bloqueado con la nota de
      reactivarlo, y guardar no cambia sus categorías.
- [x] Un admin puede editar su propio nombre y correo desde Equipo.
- [x] La Action `usuarios.editar` responde `FORBIDDEN` cuando la llama un entrenador.
- [x] `npm run check` en verde y ningún archivo tocado supera las 200 líneas.

---

## Decisiones

- **Sí:** editar nombre, correo y categorías. **No:** editar el rol. Cambiar de rol arrastra
  permisos, categorías y el guardián del último admin; el club no lo ha pedido y hoy se resuelve
  creando la cuenta con el rol correcto.
- **Sí:** traspaso directo al marcar una categoría ocupada. **No:** obligar a quitársela primero
  al dueño. Dos pasos es justo el flujo que hoy no se puede hacer sin desactivar a nadie, y deja
  una ventana en la que la categoría no tiene entrenador.
- **Sí:** resumen de traspasos dentro de la hoja, arriba del botón Guardar. **No:** diálogo de
  confirmación aparte. La operación es reversible en dos toques y un diálogo encima de una hoja
  en móvil estorba más de lo que protege.
- **Sí:** categorías bloqueadas en usuarios inactivos. **No:** permitir asignarlas y revalidar el
  choque al reactivar. Un entrenador inactivo no ocupa categoría (`categoriasOcupadas` filtra
  `banned = false`), así que asignarle una crearía un duplicado que recién explotaría al
  reactivarlo, lejos de donde se cometió el error.
- **Sí:** `auth.api.adminUpdateUser` para nombre y correo. Es la API del plugin `admin` de Better
  Auth 1.6.23 y mantiene la auth al tanto del cambio de credencial.
- **Sí:** escribir `cats` con Drizzle en una transacción, no con `adminUpdateUser` por usuario. Un
  traspaso toca a dos personas: hacerlo con dos llamadas sueltas a la auth deja el hueco de que
  la primera funcione y la segunda falle, con la categoría duplicada o perdida. `cats` es una
  columna del dominio Chuter, no de Better Auth.
- **Sí:** validar el correo duplicado en el dominio antes de escribir. Dejar que reviente el
  índice único de Postgres daría un mensaje ilegible para el cliente.
- **Sí:** un entrenador puede quedar con cero categorías. Es un estado legítimo (entrenador nuevo,
  o uno al que se le reasignó todo) y el banner de categorías huérfanas ya lo hace visible.
- **No:** historial de cambios. El club tiene dos admins y la información es corregible; una
  tabla de auditoría es peso muerto hoy.
- **Definición rápida:** el spec se aprobó de corrido tras cerrar las preguntas, sin revisión
  sección por sección.

### Ajustes durante la implementación

- **`db.batch()` en vez de `db.transaction()`.** El driver `neon-http` no soporta transacciones
  interactivas; `batch` viaja a Neon como una sola transacción, que es la garantía que este spec
  necesitaba.
- **`editarUsuario(headers, input)` sin `actorId`.** Con la auto-edición permitida, ninguna regla
  necesita saber quién edita.
- **`traspasosDe(cats, categorias)`** en vez de `(cats, usuarios, targetId)`. La hoja ya tiene las
  categorías con su dueño resuelto; la firma original obligaba a mandar toda la lista de usuarios
  al cliente sin ganar nada. El cálculo del lado servidor vive en `cambiosDeCats`.
- **Tres archivos no previstos**, forzados por las reglas de código limpio: `ItemCategoria.tsx` y
  `SheetsEquipo.tsx` (complejidad > 10 en el selector y en la pantalla) y el helper
  `mensajeDeError` en `useEquipo.ts` (la función pasaba de 60 líneas).
- **`gridTemplateColumns: minmax(0, 1fr)` en la tarjeta.** Con solo `flexWrap` el tercer botón
  desbordaba a 360 px: la columna del grid se dimensionaba por el contenido, así que el flex
  nunca envolvía. Medido en el navegador antes y después.

---

## Riesgos

| Riesgo                                                                                                | Mitigación                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| El traspaso toca a dos usuarios; si falla a mitad, una categoría queda duplicada o sin dueño          | Las `cats` de todos los afectados se escriben en un solo `db.transaction` (`actualizarCats`).                                                                                     |
| Nombre y correo se escriben por la auth y las categorías por el repo: son dos escrituras, no una      | Primero las categorías (la parte que puede dejar datos inconsistentes), después nombre y correo. Si lo segundo falla, el traspaso ya quedó firme y se reintenta.                  |
| Cambiar el correo cambia la credencial de login sin avisarle al usuario                               | La hoja muestra la advertencia junto al campo. El aviso por correo queda fuera de alcance.                                                                                        |
| Un entrenador con sesión abierta sigue viendo su plantel viejo tras un traspaso                       | El middleware relee la sesión desde la base en cada request: alcanza con que recargue la app. No se invalidan sesiones.                                                           |
| Los entrenos y listas ya registrados quedan atados al `entrenador_id` que los creó, no a la categoría | Es el comportamiento correcto para el historial (quién dictó ese entreno no cambia). El roster se deriva de `cats` al leer, así que la próxima sesión ya es del nuevo entrenador. |
| `EquipoScreen.tsx` (163 líneas) se acerca al tope de 200 al sumar la tercera hoja                     | El paso 8 del plan contempla extraer el bloque de hojas a `SheetsEquipo.tsx` si se pasa.                                                                                          |
| Dos admins editando el mismo entrenador a la vez                                                      | La disponibilidad se lee dentro de la operación de escritura, igual que en `crearUsuario`: el segundo ve el estado ya actualizado tras su refetch.                                |

---

## Lo que **no** está en este spec

- Cambiar el rol de un usuario existente.
- Eliminar usuarios de la base.
- Que un entrenador edite su propio perfil o su contraseña.
- Historial o auditoría de quién editó a quién.
- Aviso por correo del cambio de credencial.
- Reasignar entrenos, planes o listas de asistencia ya guardados.
- Obligar a que todo entrenador tenga al menos una categoría.

Cada uno de esos, si entra, va en su propio spec.
