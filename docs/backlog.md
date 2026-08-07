# Backlog — Módulo de Administración Chuter FC

> Producto: módulo administrativo interno (back-office) de Chuter F.C. para gestionar alumnos, cartera/cobros, uniformes y entrenamientos.
> Diseño base: prototipo móvil "Chuter FC Admin - Mobile" (Claude Design).
> Stack: Astro + React (island) · Neon Postgres · Drizzle ORM · Better Auth · Astro Actions · Vercel.
> Datos reales: `CHUTER FC 2026.xlsx` (local, **no versionado** por PII de menores). Esquema y reglas en `docs/excel-data-dictionary.md`.
>
> **Reconciliado con el código el 2026-07-24 (spec 14).** Cada ☑ cita el spec que la cerró. Lo único realmente pendiente: **HU-0.2** (ESLint/Prettier), **HU-7.1** (identidad del club en Más), **HU-7.2** (solo el toggle de montos), **HU-7.3**, **HU-7.4** y **HU-8.2**. HU-3.3 y HU-3.6 son `Won't` (obsoletas, no se harán) y HU-6.1/HU-6.2 quedaron obsoletas por el spec 09. Aparte de las HU, hay deuda técnica menor anotada en **Deuda técnica / observaciones abiertas** (final del archivo). Fuentes: **backlog** = qué falta · **specs/** = por qué se hizo así · **`docs/ARCHITECTURE.md`** = cómo está hecho hoy.

## Roles

- **Administrador** (Camilo Andrade, Ebed Shaday Calderón) — acceso total al back-office. El admin raíz crea otros admins y entrenadores desde Equipo (spec 04); sin registro público.
- **Entrenador (formador)** — existe desde el spec 04 (`role: 'entrenador'` + `cats` por usuario en Better Auth). Tiene app propia (spec 09): plan semanal, sesiones del día con asistencia, plantel de sus categorías y ficha de alumno en solo lectura **sin datos de dinero**. No accede a dashboard, cartera, uniformes ni equipo.
- _(Futuro)_ **Acudiente** — portal de solo lectura para ver el estado de pagos de su hijo. Fuera de alcance v1.

## Convenciones del backlog

- **Formato HU:** `Como [rol] quiero [acción] para [beneficio]`.
- **Criterios de aceptación:** Gherkin (`Dado / Cuando / Entonces`).
- **Prioridad (MoSCoW):** Must · Should · Could · Won't (v1).
- **Estado:** ☐ pendiente · ◐ en progreso · ☑ hecho.
- **Pantalla:** pantalla del prototipo a la que corresponde.
- **Reglas de negocio** referenciadas: ver sección final.

## Definition of Ready (DoR)

- HU con criterios de aceptación claros, prioridad y dependencias resueltas.
- Pantalla/diseño identificado; reglas de negocio referenciadas.

## Definition of Done (DoD)

- Código tipado (cero `any`), archivos < 200 líneas, pasa `npm run check` (astro check + eslint).
- Criterios de aceptación verificados en `npm run dev`.
- Commit atómico en español (Conventional Commits + emoji).
- Sin secretos en el repo; variables en `.env`.

---

## EPIC 0 — Fundación técnica (enablers)

> No son de cara al usuario, pero habilitan todo el módulo. Sin criterios Gherkin de usuario; criterios técnicos de aceptación.

### HU-0.1 · Adapter Vercel sin romper el sitio público — `Must` · ☑ (spec 02, ampliado en spec 03)

Como equipo técnico quiero habilitar render en servidor solo para `/admin` para no afectar el rendimiento del sitio de marketing.

- **Aceptación técnica:**
  - Se instala `@astrojs/vercel` y se configura `adapter` en `astro.config.mjs`.
  - El `output` permanece estático por defecto; solo `/admin/**`, `/api/**` y Actions usan `prerender = false`.
  - `npm run build` sigue listando las páginas de marketing como prerenderizadas.
- **Hecho:** `adapter: vercel()` en `astro.config.mjs` sin `output: 'server'`; el marketing sigue prerenderizado en cada build.

### HU-0.2 · Enforcement de código limpio — `Must` · ☐

Como equipo técnico quiero linters y scripts que hagan cumplir las reglas para mantener el código mantenible.

- **Aceptación técnica:** `eslint.config.js` con `max-lines:200`, `complexity:10`, `no-explicit-any:error`, etc.; `.prettierrc`; scripts `lint`, `typecheck`, `check`. Ver `.claude/rules/coding-rules.md`.
- **Estado real:** único enabler del EPIC 0 pendiente. Hoy las reglas se verifican a mano (`tsc --noEmit` + conteo de líneas por spec); falta instalar ESLint/Prettier y los scripts `lint`/`typecheck`/`check`.

### HU-0.3 · Layout y design system del admin — `Must` · ☑ (spec 03)

Como administrador quiero que la app admin tenga la identidad visual del club (navy+dorado, tipografías) aislada del sitio público.

- **Aceptación técnica:** `AdminLayout.astro`; tokens del DS porteados bajo scope `.admin-app` en `admin.css`; fuentes Bebas/Plus Jakarta/Fraunces cargadas; no hereda header/footer del marketing.
- **Hecho (spec 03):** shell móvil (header + tab bar) como isla React en `/admin`, con los tokens scopeados bajo `.admin-app` en `src/features/admin/styles/`.

### HU-0.4 · Ruta `/admin` privada y no indexable — `Must` · ☑ (spec 03)

Como dueño del club quiero que el panel no aparezca en buscadores para mantenerlo privado.

- **Aceptación técnica:** `<meta name="robots" content="noindex,nofollow">` en `AdminLayout`; `Disallow: /admin` en `public/robots.txt`; sitemap excluye `/admin`.
- **Hecho (spec 03):** las tres barreras están puestas (`AdminLayout.astro`, `public/robots.txt`, `filter` del sitemap en `astro.config.mjs`).

### HU-0.5 · Base de datos y migraciones — `Must` · ☑ (spec 11)

Como equipo técnico quiero la conexión a Neon y migraciones versionadas para persistir datos de forma confiable.

- **Aceptación técnica:** `drizzle.config.ts`, cliente Neon singleton, `db:generate`/`db:migrate` funcionando contra una rama de Neon.
- **Hecho (spec 11):** schema `alumnos` + `pagos` migrado a Neon; `db:generate`/`db:migrate`/`db:seed` en `package.json`.

---

## EPIC 1 — Acceso y seguridad

> **Cerrado por el spec 04 (2026-07-04).** Better Auth sobre Neon: login por email/contraseña, gate por middleware con `?next=`, logout, sesión de 7 días y `disableSignUp: true`. Los usuarios se crean desde la pantalla Equipo (admin raíz), no por registro público.

### HU-1.1 · Iniciar sesión — `Must` · Pantalla: Login · ☑ (spec 04)

Como administrador quiero iniciar sesión con email y contraseña para acceder al panel de forma segura.

- **Aceptación:**
  - Dado que estoy deslogueado, cuando abro `/admin`, entonces se me redirige a `/admin/login`.
  - Dado credenciales válidas, cuando envío el formulario, entonces inicio sesión y aterrizo en el Dashboard.
  - Dado credenciales inválidas, cuando envío, entonces veo un error claro ("Correo o contraseña incorrectos") y no se revela cuál falló.
  - Dado un campo vacío, cuando envío, entonces se valida en cliente antes de llamar al servidor.

### HU-1.2 · Cerrar sesión — `Must` · Pantalla: Más · ☑ (spec 04)

Como administrador quiero cerrar sesión para proteger la información en dispositivos compartidos.

- **Aceptación:**
  - Dado que estoy logueado, cuando pulso "Cerrar sesión", entonces se invalida la sesión y se me redirige a `/admin/login`.
  - Dado que cerré sesión, cuando intento volver atrás en el navegador, entonces no puedo ver datos protegidos.

### HU-1.3 · Protección de rutas — `Must` · ☑ (spec 04)

Como dueño del club quiero que todas las rutas del panel exijan sesión para evitar accesos no autorizados.

- **Aceptación:**
  - Dado que no hay sesión, cuando solicito cualquier `/admin/**` (excepto login), entonces middleware redirige a login con `?next=`.
  - Dado que hay sesión, cuando voy a `/admin/login`, entonces se me redirige al Dashboard.
  - Dado que llamo una Action protegida sin sesión, entonces recibo `UNAUTHORIZED` y la operación no se ejecuta.

### HU-1.4 · Sesión persistente — `Should` · ☑ (spec 04)

Como administrador quiero permanecer logueado un tiempo razonable para no re-autenticarme cada vez.

- **Aceptación:** Dado que inicié sesión, cuando vuelvo dentro de 7 días, entonces sigo autenticado (cookie httpOnly segura). Después expira y debo volver a entrar.

### HU-1.5 · Cuentas de administradores (seed, sin signup público) — `Must` · ☑ (spec 04)

Como dueño del club quiero solo cuentas autorizadas (Camilo, Ebed) sin registro abierto para mantener el control.

- **Aceptación:** No existe UI de registro público (`disableSignUp`). Las 2 cuentas se crean por seed/script. Un tercero no puede auto-registrarse.
- **Hecho (spec 04):** `disableSignUp: true` en `lib/auth/server.ts`, seed del admin raíz (`db:seed:admin`) y alta de los demás usuarios (admins y entrenadores) desde la pantalla Equipo.

---

## EPIC 2 — Gestión de alumnos

> **Persistencia real (spec 11, 2026-07-18; uniformes en spec 12, 2026-07-19).** Las HUs de alumnos, cartera y dashboard que estaban sobre el store mock (specs 03–10) ahora corren contra Neon + Drizzle + Actions. La UI no cambió de estructura; se marcan ☑ las afectadas con nota. Los uniformes reales (dos kits AZUL/ORO con abonos) se implementaron en el spec 12.
>
> **Retiro de alumnos (spec 14, 2026-07-24).** `alumnos.activo` pasa a leerse en todas las consultas: los retirados salen de la lista, de la cartera, de los KPIs y del plantel, pero conservan su historial y sus pagos siguen contando al recaudado del año.

### HU-2.1 · Listar y buscar alumnos — `Must` · Pantalla: Alumnos · ☑ (spec 11)

Como administrador quiero ver y buscar alumnos por nombre o acudiente para encontrarlos rápido.

- **Aceptación:**
  - Dado el listado, cuando escribo en el buscador, entonces se filtran alumnos cuyo nombre **o** acudiente coincide (sin distinguir mayúsculas/acentos).
  - Cada fila muestra avatar, nombre, categoría, acudiente y estado (al día / abono / en mora con # de meses).
  - Dado sin resultados, entonces veo un estado vacío "Sin resultados".
  - Un contador muestra "N alumnos" y "N en mora".

### HU-2.2 · Filtrar por categoría — `Must` · Pantalla: Alumnos · ☑ (spec 05)

Como administrador quiero filtrar por categoría (SUB 4–16) para revisar un grupo específico.

- **Aceptación:**
  - Dado los chips de categoría, cuando elijo una, entonces el listado y el contador se actualizan a esa categoría.
  - "Todas" restablece el filtro. El filtro de categoría se combina con el buscador.

### HU-2.3 · Ver ficha del alumno — `Must` · Pantalla: Ficha · ☑ (spec 11)

Como administrador quiero ver el detalle de un alumno (pagos, uniforme, acudiente) para tener su información completa.

- **Aceptación:**
  - Dado un alumno, cuando abro su ficha, entonces veo cabecera con nombre, categoría y estado, y acciones "Registrar pago" y "WhatsApp".
  - Pestaña **Pagos del año:** lista de meses **ENE–NOV** (`MESES_VISIBLES`) con estado por mes; tocar un mes cobrable abre Registrar pago en ese mes.
  - Pestaña **Uniforme:** los dos kits (AZUL/ORO) con estado, número/talla y saldo, más CTA a la gestión (spec 12).
  - Pestaña **Acudiente:** acudiente, celular, dirección, documento, año nac., ingreso, hermanos.

### HU-2.4 · Inscribir alumno — `Must` · Pantalla: Form · ☑ (spec 11)

Como administrador quiero inscribir un alumno calculando su categoría y tarifa automáticamente para evitar errores y agilizar.

- **Aceptación:**
  - Dada la **fecha de nacimiento** (requerida, sin campo año — spec 11), cuando la ingreso, entonces la **categoría se calcula automáticamente** (R1, vía `categoriaDeFecha`) y se muestra como badge `SUB 8 · Benjamín` (spec 15).
  - Dado que el acudiente ya tiene otro hijo inscrito, cuando ingreso su nombre, entonces se detecta el **hermano** (R4) y se muestra aviso del **descuento de uniforme** (R9); la mensualidad no cambia (R2).
  - Documento requerido y único; con < 8 dígitos muestra error.
  - Campos requeridos: nombre, documento, año nac., acudiente, celular. Al guardar se crea el alumno (y el acudiente si es nuevo).

### HU-2.5 · Editar alumno — `Should` · Pantalla: Form · ☑ (spec 11)

Como administrador quiero editar los datos de un alumno para mantenerlos actualizados.

- **Aceptación:** Dado un alumno existente, cuando abro "Editar", entonces el formulario viene precargado; al guardar se persisten los cambios y la categoría se recalcula si cambia la fecha. Al editar un **migrado** (fecha null), el campo fecha de nacimiento llega vacío y obliga a completarlo (spec 11).

### HU-2.6 · Retirar / desactivar alumno — `Could` · Pantalla: Ficha/Alumnos · ☑ (spec 14)

Como administrador quiero marcar un alumno como retirado para que no cuente en activos sin perder su historial.

- **Aceptación:** Dado un alumno activo, cuando lo desactivo, entonces deja de contar en "activos" y en cartera del año en curso, pero su historial de pagos se conserva.
- **Hecho (spec 14):** reusa la columna `alumnos.activo` (sin migración). Acción **Retirar** (con confirmación) / **Reactivar** en la ficha, con badge "Retirado" y "Registrar pago" deshabilitado; chip **"Mostrar retirados"** en la lista (solo admin, apagado por defecto). Un retirado sale de activos, mora, cartera vencida y plantel del entrenador, pero **sus pagos siguen contando al recaudado del año**. Action `alumnos.cambiarActivo` con `requireAdmin`.

---

## EPIC 3 — Cartera y cobros ★

> **Nota (spec 14):** la cartera es de **cobro activo** — los alumnos retirados no aparecen en la lista, no generan mora ni suman a la cartera vencida, pero lo que ya pagaron sigue contando en "Recaudado año". No hay filtro de retirados en Cartera: se consultan desde la pantalla Alumnos.

### HU-3.1 · Cartera en tarjetas (móvil) — `Must` · Pantalla: Cartera · ☑ (spec 11)

Como administrador quiero ver cada alumno como tarjeta con su tira de meses para revisar la cartera cómodamente en el celular.

- **Aceptación:**
  - Cada tarjeta muestra alumno, categoría, cuota/mes, saldo o "Al día", y una tira **ENE–NOV** (`MESES_VISIBLES`) de celdas de color deslizable; ENE/FEB 2026 en `na`.
  - Colores: verde=pagado, rojo=mora, gris=pendiente, neutro=fuera de temporada (R5, sin `partial`).
  - Tocar una celda cobrable abre Registrar pago en ese mes.

### HU-3.2 · Cartera en matriz — `Should` · Pantalla: Cartera · ☑ (spec 06)

Como administrador quiero una vista matriz (alumnos × meses) para revisar varios meses a la vez como en el Excel.

- **Aceptación:** Dado el toggle de vista, cuando elijo "Matriz", entonces veo filas=alumnos, columnas=ENE–NOV (`MESES_VISIBLES`) con la primera columna fija (sticky); la preferencia se recuerda (R7.2).
- **Hecho (spec 06):** `MatrizCartera` + `ToggleVista`, preferencia en `localStorage` vía `useVistaCartera`; datos reales desde el spec 11.

### HU-3.3 · Filtrar morosos / con abono — `Won't` (no se hará) · Pantalla: Cartera · ☐

Como administrador quiero filtrar morosos o con abono para enfocar la gestión de cobro.

- **Aceptación:** Dado el segmentado Todos/En mora/Con abono, cuando elijo uno, entonces la lista se filtra coherentemente (mora = tiene ≥1 mes en `due`; abono = tiene ≥1 mes `partial`).
- **Nota (spec 05, 2026-07-05):** obsoleta — el filtro "con abono" no aplica porque un mes solo se cobra o no se cobra (sin estado `partial`).

### HU-3.4 · Totales de cartera — `Must` · Pantalla: Cartera/Dashboard · ☑ (spec 11)

Como administrador quiero ver recaudado del año y cartera vencida para conocer la salud financiera.

- **Aceptación:** Se muestran "Recaudado año" (Σ pagos) y "Cartera vencida" (Σ meses en mora) con formato COP (R8). Los totales salen de los **pagos reales** en Neon y cuadran entre dashboard, cartera y ficha (sin `partial`).

### HU-3.5 · Registrar pago ★ — `Must` · Pantalla: Registrar pago · ☑ (spec 11)

Como administrador quiero registrar el pago de uno o varios meses para mantener la cartera al día.

- **Persistencia (spec 11):** `pagos.registrar` hace upsert (ignora ya pagados), mutación **pesimista** (confirma → refetch); el pago **sobrevive a recargar**.
- **Aceptación:**
  - Dado un alumno con meses pendientes/mora/abono, cuando abro Registrar pago, entonces se preseleccionan meses razonables (el mes tocado, o el primero en mora).
  - Cuando selecciono 1+ meses, entonces el **total = Σ cuotas** (½ cuota si el mes estaba en abono) en formato COP.
  - Cuando elijo método (efectivo/transferencia) y confirmo, entonces los meses pasan a "pagado", se persisten los pagos y veo pantalla de éxito.
  - Si no hay meses seleccionados, el botón Registrar está deshabilitado.
  - Si el alumno está al día, se muestra "¡Al día! No hay meses por cobrar".

### HU-3.6 · Registrar abono parcial — `Won't` (no se hará) · Pantalla: Registrar pago · ☐

Como administrador quiero registrar abonos parciales para reflejar pagos incompletos.

- **Aceptación:** Dado un mes, cuando registro menos que la cuota, entonces el mes queda en estado `partial` (ámbar) y el saldo refleja la mitad pendiente.
- **Nota (spec 05, 2026-07-05):** obsoleta — decisión de Will: un mes se cobra o no se cobra, sin estados intermedios.

### HU-3.7 · Enviar recibo por WhatsApp — `Should` · Pantalla: Registrar pago · ☑ (spec 06)

Como administrador quiero enviar un recibo por WhatsApp tras un pago para dar comprobante al acudiente.

- **Aceptación:** Dado un pago registrado, cuando pulso "Enviar recibo", entonces se abre WhatsApp (`wa.me`) al celular del acudiente con un mensaje precargado (alumno, meses, total). Usa `src/lib/whatsapp.ts`.
- **Hecho (spec 06):** `ExitoPago` arma el recibo con `waTo`; sobre pagos reales desde el spec 11.

### HU-3.8 · Recordatorio de cobro por WhatsApp — `Should` · Pantalla: Dashboard/Ficha · ☑ (spec 07)

Como administrador quiero contactar por WhatsApp a un moroso desde la lista para agilizar el cobro.

- **Aceptación:** Dado un alumno en mora, cuando pulso el ícono de WhatsApp, entonces se abre `wa.me` al celular del acudiente con mensaje de recordatorio. El ícono verde WhatsApp se usa solo aquí (R-marca).
- **Hecho (spec 07):** botón de recordatorio en cada moroso de **Cobros pendientes** (dashboard) y acción WhatsApp en la ficha. La tarjeta de Cartera no lo lleva: se contacta desde el dashboard o entrando a la ficha.

---

## EPIC 4 — Dashboard (inicio)

> **Nota (spec 14):** "Alumnos activos", % al día, morosos, cartera vencida, meta del mes y próximos cumpleaños se calculan **solo sobre alumnos activos**; "Recaudo año" y el recaudo por mes suman **todos los pagos reales**, incluidos los de un alumno ya retirado.

### HU-4.1 · Recaudo del mes vs meta — `Must` · Pantalla: Dashboard · ☑ (spec 11)

Como administrador quiero ver cuánto llevo recaudado este mes contra la meta para saber cómo voy.

- **Aceptación:** Hero muestra recaudo del mes en curso (formato corto COP), barra de progreso y % vs meta (meta = Σ cuotas esperadas), más "Cartera vencida".

### HU-4.2 · KPIs principales — `Must` · Pantalla: Dashboard · ☑ (spec 11)

Como administrador quiero indicadores clave de un vistazo para tomar decisiones rápidas.

- **Aceptación:** Tarjetas con: Alumnos activos, % al día (con N de M), En mora (# alumnos), Recaudo año. Cada KPI con su acento de color.

### HU-4.3 · Recaudo por mes — `Should` · Pantalla: Dashboard · ☑ (spec 06)

Como administrador quiero una mini gráfica de recaudo por mes para ver la tendencia.

- **Aceptación:** Barras por mes hasta el mes en curso; cada barra proporcional al recaudo del mes (solo `paid`; el estado `partial` quedó `Won't`, ver R5).
- **Hecho (spec 06):** `RecaudoPorMes` en el dashboard; sobre pagos reales de Neon desde el spec 11 (serie `monthly` derivada en servidor).

### HU-4.4 · Cobros pendientes — `Must` · Pantalla: Dashboard · ☑ (spec 11)

Como administrador quiero ver los principales morosos con acceso rápido para priorizar el cobro.

- **Aceptación:** Lista de hasta 4 morosos ordenados por saldo desc.; cada uno con # meses, saldo, acceso a su ficha y botón WhatsApp; enlace "Ver cartera".

### HU-4.5 · Próximos cumpleaños — `Must` · Pantalla: Dashboard · ☑ (spec 11)

Como administrador quiero ver cumpleaños próximos para felicitar a los niños.

- **Aceptación:** Carrusel horizontal con nombre, categoría y fecha de los próximos cumpleaños.
- **Nota (spec 11):** sube de `Could` a **`Must` por pedido explícito del cliente**. Muestra solo alumnos con fecha de nacimiento completa, ordenados por proximidad (incluye el cruce de año, vía `proximosCumples`). Los 77 migrados aparecen al completar su fecha en el form.

### HU-4.6 · Entrenamiento del día — `Should` · Pantalla: Dashboard · ☑ (spec 13)

Como administrador quiero ver el entrenamiento de hoy para tenerlo presente.

- **Aceptación:** En un día Lun/Mié/Vie, la card **EntrenoDeHoy** lista **una fila por entrenador** con su estado de registro del día (thumbnail + asistencia, o "sin registrar") y enlaza a Entrenamientos; los demás días la card **no aparece**.
- **Nota (spec 13):** vuelve al dashboard sobre datos reales (`entrenoDeHoy` en `dashboard.stats`); responde "¿cómo va el registro de hoy?", no "el próximo entreno".

---

## EPIC 5 — Uniformes

> **Implementado por el spec 12 (2026-07-19).** La inspección del Excel reveló un modelo distinto al asumido: **dos kits por alumno** (AZUL/ORO, $100.000 c/u), **4 estados por kit** (verde=pagado+entregado · rojo=entregado sin pagar · azul=pagado sin entregar · blanco=nada) y **abonos parciales** (pago tri-estado derivado). El spec 12 lo implementa completo: tabla `uniformes` por `(alumnoId, kit)`, seed AZUL/ORO por color, y realineación de UI (pantalla Uniformes con tabs Estado/Numeración por kit, gestión por kit con entrega + abono, ficha con los dos kits). El **aviso "migración de uniformes en camino"** del spec 11 quedó **retirado**.

### HU-5.1 · Control por kit — `Must` · Pantalla: Uniformes · ☑ (spec 12)

Como administrador quiero ver los uniformes entregados por kit (azul/oro) para llevar el control.

- **Aceptación:** Toggle de kit (AZUL/ORO); contadores Entregados/Por entregar; listado del kit ordenado por número con nombre, categoría y talla. Además, tab **Estado** con matriz 2×2 (entrega × pago) sobre los 2N kits y filtro por estado.

### HU-5.2 · Detección de números repetidos — `Must` · Pantalla: Uniformes · ☑ (spec 12)

Como administrador quiero que el sistema avise si un número está repetido en un kit para evitar duplicados (R6).

- **Aceptación:** Dado dos alumnos con el mismo número en el mismo kit, cuando veo el kit, entonces aparece una alerta indicando el/los número(s) repetido(s); y al capturar la entrega, el número repetido **advierte sin bloquear**.

### HU-5.3 · Registrar entrega de uniforme — `Should` · Pantalla: Uniformes/Ficha · ☑ (spec 12)

Como administrador quiero registrar la entrega (kit, número, talla) para actualizar el inventario del alumno.

- **Aceptación:** Dado un kit sin entregar, cuando asigno número + talla (kit implícito por la tarjeta), entonces queda "entregado"; si el número ya existe en ese kit, se advierte antes de confirmar. Anular entrega conserva talla y abono. Además: **registrar pago/abono** por kit (input de monto, muestra precio y saldo; acota a [0, precio]).

### HU-5.4 · Pendientes de entrega — `Should` · Pantalla: Uniformes · ☑ (spec 12)

Como administrador quiero ver quién no tiene uniforme para gestionar entregas.

- **Aceptación:** El tab **Estado** cubre los pendientes: la celda "Sin iniciar"/"Por entregar" filtra la lista de kits sin entregar, cada uno con acción para abrir su gestión (reemplaza la sección "Por entregar" del prototipo).

---

## EPIC 6 — Entrenamientos (app del profesor)

> Reescrito por el **spec 09** (2026-07-13). El modelo real del club es **semanal por entrenador** (Excel de planeación): cabecera con tema + objetivos; **Activación muscular** y **Vuelta a la calma** son fases **fijas** (no se digitan); lo único que varía es la **parte central** de cada día, planeada en TactalPad y registrada como **una imagen por día** (Lun/Mié/Vie) + asistencia. El profesor registra; el admin solo lee.
>
> **Refinado por el spec 10 (2026-07-13):** planeación y asistencia son **dos registros independientes** (la planeación se edita cuando sea; la asistencia solo desde el día del entreno, corregible hacia atrás) y la imagen tiene **visor a pantalla completa con zoom**. **Persistido por el spec 13 (2026-07-22):** planes, sesiones y asistencia viven en Neon y la imagen en Vercel Blob; ya no queda nada en mock.

### ~~HU-6.1 · Ver planificación~~ — **Obsoleta** (spec 09, 2026-07-13)

> Suponía planificación "por día y categoría" con tema y fases digitadas. Reemplazada por HU-6.3–6.6 (plan semanal + imagen de parte central + asistencia).

### ~~HU-6.2 · Editar sesión~~ — **Obsoleta** (spec 09, 2026-07-13)

> Suponía que admin/formador editaban tema y fases. Las fases son fijas y el admin **no edita** (la planificación es responsabilidad del profesor). Reemplazada por HU-6.4 y HU-6.7.

### HU-6.3 · Plan semanal del entrenador — `Must` · Pantalla: Entrenos · ☑ (spec 09 · persistido en spec 13)

Como entrenador quiero registrar el tema y los objetivos de mi semana para tener la cabecera de mi planeación en la app.

- **Aceptación:** Dado la home de Entrenos, cuando guardo tema + objetivos en la hoja modal, entonces el plan aparece en mi home y en la vista del admin; guardar dos veces no duplica (idempotente).

### HU-6.4 · Registrar la sesión del día — `Must` · Pantalla: Sesión · ☑ (spec 09 · persistido en spec 13)

Como entrenador quiero registrar la parte central del día como imagen de TactalPad (con nota opcional) para dejar constancia de la planeación.

- **Aceptación:** Dado un día Lun/Mié/Vie, cuando subo la imagen (preview local, reemplazable) y guardo, entonces la DayCard queda registrada con thumbnail; Activación y Vuelta a la calma se muestran fijas, no editables.

### HU-6.5 · Pasar lista — `Must` · Pantalla: Sesión · ☑ (spec 09 · persistido en spec 13)

Como entrenador quiero marcar presentes/ausentes de mi roster para llevar la asistencia de cada sesión.

- **Aceptación:** Dado el roster de mis categorías, cuando marco P/A y guardo, entonces la pastilla muestra presentes = roster − ausentes con el tono correcto (verde sin ausentes, info ≥ 70 %, alerta < 70 %).

### HU-6.6 · Historial semanal corregible — `Should` · Pantalla: Entrenos · ☑ (spec 09 · persistido en spec 13)

Como entrenador quiero ver la semana actual y ~3 pasadas para corregir sesiones olvidadas.

- **Aceptación:** Dado los chips de semana, cuando abro una sesión pasada, entonces puedo corregir imagen, nota y asistencia con la misma pantalla; la semana actual muestra el badge "N por registrar".

### HU-6.7 · Vista del admin (solo lectura) — `Must` · Pantalla: Entrenamientos · ☑ (spec 09 · persistido en spec 13)

Como administrador quiero ver por semana y entrenador el plan y las sesiones registradas para supervisar sin editar.

- **Aceptación:** Dado Más → Entrenamientos (solo admin), cuando elijo una semana, entonces veo por entrenador tema/objetivos y sesiones (thumbnail + asistencia); no existe ningún control de edición.

### HU-6.8 · Plantel del profesor — `Must` · Pantalla: Alumnos (entrenador) · ☑ (spec 09 · datos reales en spec 11)

Como entrenador quiero ver solo los alumnos de mis categorías, con buscador y filtro, para gestionar mi grupo.

- **Aceptación:** Dado mis `cats`, cuando busco por nombre/acudiente (sin acentos) o filtro por categoría, entonces la lista se acota; roster vacío muestra empty state con hint de revisar categorías en Equipo.
- **Nota (spec 14):** el plantel **no muestra alumnos retirados** y el entrenador no ve el chip "Mostrar retirados" (es acción de admin).

### HU-6.9 · Ficha sin datos de dinero — `Must` · Pantalla: Ficha (readOnly) · ☑ (spec 09 · datos reales en specs 11–12)

Como entrenador quiero abrir la ficha de un alumno sin ver su situación de pagos para respetar la privacidad de las familias.

- **Aceptación:** Dado la ficha en modo readOnly, entonces no hay tab Pagos, ni mora/cuota, ni estado de pago del uniforme, ni botones de escritura; sí se ven datos del alumno, la entrega del uniforme y el acudiente.
- **Nota (spec 14):** las acciones de retiro/reactivación tampoco aparecen en modo readOnly.

### HU-6.10 · Persistencia de entrenamientos — `Must` · ☑ (spec 13)

Como club queremos que planes, sesiones y asistencia sobrevivan a la recarga para que el registro sea real.

- **Aceptación:** BD (Neon) + Actions + subida de la imagen a **Vercel Blob** (compresión cliente a WebP); al recargar, todo lo registrado persiste. _(Spec de persistencia, fuera del 09.)_
- **Implementado (spec 13):** tablas `planes_semana` y `sesiones` (clave natural por `semanaInicio`); Actions `entrenos.{listar, guardarPlan, guardarPlaneacion, guardarAsistencia}` con gate por rol (entrenador escribe solo lo suyo, admin solo lee); imagen comprimida a WebP en cliente y subida a Blob por FormData (borra el anterior al reemplazar). Los 3 hooks migraron del mock a Actions; `store-entrenos.ts` eliminado.

---

## EPIC 7 — Configuración / Más

### HU-7.1 · Identidad y contacto del club — `Could` · Pantalla: Más · ☐

Como administrador quiero ver la identidad y contacto del club en el panel para tenerlos a mano.

- **Aceptación:** Tarjeta con logo + nombre; accesos a WhatsApp (300 872 5964 / @1chuter), sede (Cancha Los Algarrobillos, Valledupar · Cesar · INDER) y directores técnicos. **Todo se lee de `src/lib/site.ts`, nunca hardcodeado.** _(Corregido 2026-08-07: esta línea traía el teléfono `301 521 6830` y el nombre "Cancha de la Provincia", ninguno de los dos vigente.)_
- **Estado real:** pendiente. Hoy "Más" solo muestra la sesión activa y los accesos (Equipo, Uniformes, Entrenamientos) + cerrar sesión.

### HU-7.2 · Apariencia persistida — `Should` · Pantalla: Cartera/Más · ◐

Como administrador quiero configurar la vista de cartera (tarjetas/matriz) y mostrar/ocultar montos, y que se recuerde.

- **Aceptación:** Dado que cambio la preferencia, cuando regreso, entonces se mantiene (persistida en `localStorage`).
- **Hecho (spec 06):** la vista Tarjetas/Matriz se recuerda en `localStorage` (`useVistaCartera`, R7.2).
- **Pendiente:** el toggle de **mostrar/ocultar montos** no existe todavía.

### HU-7.3 · Gestionar tarifas/cuotas — `Could` · ☐

Como administrador quiero configurar la cuota mensual y el precio/descuento del uniforme (R2/R9) para reflejar cambios de precio.

- **Aceptación:** Dado la configuración, cuando actualizo la cuota o los precios del uniforme, entonces los nuevos cálculos usan esos valores (sin alterar pagos ya registrados).

### HU-7.4 · Gestionar categorías — `Won't` (spec 15) · ☒

Como administrador quiero ajustar los rangos de año por categoría para mantener el sistema vigente cada temporada.

- **Cerrada sin implementar:** con la regla por **edad cumplida** (R1 reescrita, spec 15) ya no hay rangos de año que mantener — el catálogo de 7 categorías es fijo y la categoría se recalcula sola cada cumpleaños. Si algún día el club edita el catálogo, vuelve como spec propio (hoy serían 7 filas que nadie toca).

### HU-7.5 · Asignar categorías a un entrenador — `Must` · Pantalla: Equipo · ☑ (spec 15)

Como administrador quiero elegir las categorías de un entrenador de una lista para no depender de que las escriba bien ni pisar el grupo de otro.

- **Aceptación:**
  - Dado el alta de entrenador, cuando elijo categorías, entonces veo las 7 del catálogo como opciones (`SUB 8 · Benjamín`) y **no hay campo de texto libre**.
  - Dada una categoría que ya tiene otro entrenador activo, entonces aparece **deshabilitada** e indica quién la tiene.
  - Dado un envío directo a la Action con una categoría inexistente u ocupada, entonces **falla en servidor** con mensaje claro.
  - Dado un `admin`, entonces no se muestra el selector y se guarda `cats = []`.
  - La pantalla Equipo avisa cuántas categorías quedaron **sin entrenador asignado**.

### HU-7.6 · Ver a quién le falta la fecha de nacimiento — `Should` · Pantalla: Alumnos/Ficha · ☑ (spec 15)

Como administrador quiero saber a qué alumnos les falta la fecha de nacimiento para completarlas y que su categoría deje de estimarse.

- **Aceptación:** la lista muestra `N sin fecha de nacimiento` junto a los otros contadores; la ficha de un alumno sin fecha muestra el badge "Falta fecha de nacimiento — categoría calculada por año". Al cargar la fecha real, la categoría se recalcula sola. **Ningún alumno tiene una fecha inventada en la base.**

---

## EPIC 8 — Datos reales / migración

### HU-8.1 · Importar datos desde el Excel — `Must` · ☑ (specs 11 + 12)

Como dueño del club quiero migrar los datos del Excel actual para arrancar con información real.

- **Aceptación:**
  - Dado `CHUTER FC 2026.xlsx` (raíz, local), cuando ejecuto `npm run db:seed`, entonces se crean **alumnos, pagos y uniformes** (pagos desde el **color verde** de MAR–NOV; kits AZUL/ORO desde el color de las cols. U/V) a partir de la hoja `CATEGORIAS`.
  - El seed es **idempotente** (claves: documento del alumno; `(documento, kit)` para uniformes): re-ejecutar no duplica.
  - El mapeo reusa las reglas de dominio (misma categoría y precio que la app).
- **Hecho (spec 11):** alumnos + pagos por color; anomalías reportadas y omitidas; conteos por mes cuadran con los fills. **Hecho (spec 12):** 100 kits AZUL/ORO por color (verde/rojo/azul), idempotente, conteos por estado y kit cuadran con los fills.
- **Nota (spec 13):** los **entrenamientos NO se siembran** — arrancan vacíos desde el deploy. El Excel de planeación no tiene estructura de datos aprovechable (imágenes/formato libre); el valor del registro está hacia adelante.

### HU-8.2 · Exportar cartera — `Could` · ☐

Como administrador quiero exportar la cartera a Excel/CSV para respaldos y contabilidad.

- **Aceptación:** Dado la cartera, cuando pulso "Exportar", entonces descargo un archivo con alumnos × meses y totales.

---

## Deuda técnica / observaciones abiertas

> Detalles menores detectados durante la verificación de un spec, que no justificaban abrir un spec propio ni frenar el cierre. Cada uno cita dónde salió. No son HU: no tienen rol ni beneficio de negocio.

### DT-1 · `robots.txt` apunta el sitemap al dominio viejo — `Should` · ☑ RESUELTO (2026-07-25)

`public/robots.txt` declaraba `Sitemap: https://chuterfc.vercel.app/sitemap-index.xml`, pero el sitemap generado publica las URLs bajo `https://chuterfc.com/`. Los buscadores recibían dos dominios distintos para el mismo sitio.

- [x] **Aceptación:** el `Sitemap:` de `robots.txt` usa el dominio propio (`chuterfc.com`), consistente con `PUBLIC_SITE_URL` y con los `<loc>` del sitemap.
- **Origen:** verificación del spec 14 (bloque F). Preexistente, no lo introdujo ese spec.
- **Resolución:** corregido en `public/robots.txt`. `astro.config.mjs` ya tenía `site: 'https://chuterfc.com'`, así que el sitemap no requirió cambios (verificado en producción: `<loc>https://chuterfc.com/sitemap-0.xml</loc>`). De paso se limpiaron las referencias al dominio viejo en `README.md`, `docs/ARCHITECTURE.md` y `.claude/pendientes.md`.

### DT-2 · El Dashboard no refresca tras retirar/reactivar — `Could` · ☐

Los hooks de lista y ficha refetchean tras el toggle (spec 14), pero el Dashboard conserva los KPIs cargados al montar: tras retirar a un alumno y volver a Inicio sigue mostrando el conteo y la cartera vencida anteriores hasta recargar la página.

- **Aceptación:** al volver al Dashboard después de un cambio que afecta activos/cartera, los KPIs reflejan el estado actual sin recargar.
- **Origen:** verificación del spec 14 (bloque F). Es el comportamiento que el spec 14 especificó (solo pidió refetch en lista y ficha); queda anotado por si molesta en uso real.

---

## Reglas de negocio (referencia)

- **R1 — Categoría automática por edad cumplida** _(reescrita en el spec 15, 2026-07-28 — antes era por año de temporada)_. Catálogo único de 7: `SUB 4 Baby (3-4) · SUB 6 Pony (5-6) · SUB 8 Benjamín (7-8) · SUB 10 Preinfantil (9-10) · SUB 12 Infantil (11-12) · SUB 14 Prejuvenil (13-14) · SUB 16 Juvenil (15-16)`. Fórmula: `sub = ceil(edad_cumplida / 2) × 2`, con **clamp inferior a SUB 4** (un niño de 3 es SUB 4) y sin categoría sobre 16. **La categoría cambia el día del cumpleaños.** Mientras falte `fecha_nacimiento`, se usa el año (equivale a nacer el 1-ene) y el admin muestra cuántos alumnos están en esa situación. El sitio público publica **edades**, no rangos de años. (Implementada en `lib/domain/categoria.ts`, fuente única para admin y landing.)
- **R1.1 — Una categoría, un entrenador activo** _(spec 15)_. Las categorías se asignan eligiendo del catálogo (sin texto libre); las que ya tiene otro entrenador activo aparecen deshabilitadas y el servidor rechaza el choque. Desactivar a un entrenador libera las suyas.
- **R2 — Mensualidad.** **$50.000** COP/mes por jugador, **sin descuento por hermanos**. _(Corregida por el cliente, 2026-07-10: la versión anterior daba $40.000 a hermanos; ese descuento en realidad aplica al uniforme, ver R9.)_
- **R4 — Detección de hermano.** Por coincidencia de acudiente entre alumnos.
- **R5 — Estados de cartera.** `paid` (pagado/verde), `due` (mora/rojo), `pending` (pendiente/gris), `na` (fuera de temporada). _(El estado `partial`/abono quedó `Won't` — decisión de Will en spec 05, 2026-07-05: un mes se cobra o no se cobra.)_
- **R6 — Número de uniforme único por kit.** Avisar duplicados dentro del mismo kit (azul/dorado/oro).
- **R7.2 — Preferencias de UI** (vista de cartera, mostrar montos) persistidas localmente.
- **R8 — Formato de dinero COP** (`$45.000`, `$4.82M`, separador de miles con punto).
- **R9 — Precio del uniforme y descuento de hermanos.** Uniforme **$100.000** COP; **$80.000** cada uno cuando son hermanos (detección por acudiente, R4). _(Aclaración del cliente, 2026-07-10.)_
- **Marca:** verde WhatsApp `#25D366` reservado solo para cobros/recordatorios; sin emojis en la UI; "Infantil" siempre bien escrito (no replicar el typo del flyer).

## Notas / pendientes del cliente (placeholders)

- ~~Costos de mensualidad/matrícula~~ **Confirmados (cliente, 2026-07-10):** mensualidad $50.000/jugador sin descuento; uniforme $100.000 ($80.000 c/u hermanos); inscripción gratis.
- ~~Aclarar qué significan las filas con CUOTA 40.000~~ **Cerrado:** dato viejo de la hoja, sin efecto — el seed fuerza $50.000 y nunca lee esa columna.
- ~~Dirección exacta + Google Maps~~ **Cerrado (cliente, 2026-08-07):** Valledupar, Cesar. Las dos canchas tienen link propio de Maps en `LOCATION.mapsUrl` y `LOCATION.secondaryMapsUrl`.
- Confirmar si el horario varía por categoría.
- Bios y fotos de los formadores.
- **Entrenador de Baby (SUB 4), Benjamín (SUB 8) y Juvenil (SUB 16)** — 4 entrenadores para 7 categorías (spec 15).
- ~~**Fechas de nacimiento**~~ **Cerrado (2026-08-07):** 82 activos, **0 sin fecha**. De los 15 que faltaban, el cliente confirmó que solo sigue `ANGEL SANTIAGO` (`2020-02-26`); los otros 14 se retiraron (`scripts/retirar-alumnos.mjs`). Ningún alumno activo usa ya el fallback por año.
- ~~**Confirmar los 10 alumnos que cambian de SUB**~~ confirmado por el cliente antes del seed del 2026-07-30 (spec 15).
