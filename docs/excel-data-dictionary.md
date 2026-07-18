# Diccionario de datos — fuente Excel del club

> Derivado de `CHUTER FC 2026.xlsx` (hoja-especificación + hojas operativas). **El Excel NO se versiona** (contiene PII de menores: nombres, documentos, celulares, direcciones). Se conserva local como fuente del seed (HU-8.1). Aquí queda solo el **esquema y las reglas**, sin datos personales.

> **Corregido por la inspección real del Excel (spec 11, 2026-07-18).** Tres supuestos de este diccionario estaban equivocados y ya se corrigen abajo: (1) los pagos **no están en texto sino en el color de relleno** de la celda (verde = pagado); el "columnas vacías" era falso. (2) El cobro real es **MAR–NOV** (el club nació en marzo 2026), no FEB–DIC. (3) Los uniformes son **dos kits por alumno** (AZUL y ORO, $100.000 c/u) con estados **por kit** y **abonos parciales** — se modelan en el spec 12, no en el 11.

## Origen

- Hojas operativas: `PLANIFICACION`, `CATEGORIAS` (hoja maestra), una hoja por grupo `SUB 4 … SUB 16`, `UNIFORMES`.
- Hoja-especificación interna: modelo de datos, pantallas y reglas R1–R6 (el brief usado para el diseño).
- Volumen actual: **~81 alumnos activos**. Ubicación: Colombia (Valledupar/Cesar). Cancha Los Algarrobillos.
- Hoy el control es manual y **duplicado** entre `CATEGORIAS` y cada hoja `SUB`.

## Tablas (mapeo Excel → modelo)

### `categoria` (catálogo fijo)
| Campo | Tipo | Origen |
|---|---|---|
| id | PK int | hojas SUB 4…SUB 16 |
| nombre | texto | nombre de la hoja ("SUB 4"…"SUB 16") |
| anio_desde / anio_hasta | int | rango de año de nacimiento del grupo |

### `acudiente` (un acudiente → varios alumnos)
| Campo | Origen |
|---|---|
| id | — |
| nombre | `CATEGORIAS` col. NOMBRE ACUDIENTE |
| celular | `CATEGORIAS` col. CELULAR (10 dígitos) |
| direccion | `CATEGORIAS` col. DIRECCION (barrio) |

### `alumno` (entidad central)
| Campo | Origen / regla |
|---|---|
| id | `CATEGORIAS` col. # (1..81) |
| nombre | `CATEGORIAS` col. NOMBRE |
| identificacion | `CATEGORIAS` col. IDENTIFICACION (validar; hay vacías/cortas) |
| anio_nacimiento | `CATEGORIAS` col. AÑO (determina la categoría) |
| categoria_id | FK → categoria (se **calcula** del año, R1; no se digita) |
| acudiente_id | FK → acudiente |
| cuota_mensual | `CATEGORIAS` col. CUOTA (50.000 / 40.000 — ver nota de migración: la mensualidad real es $50.000 para todos) |
| fecha_inicio | `CATEGORIAS` col. INCIO (sic) |
| activo | nuevo (booleano) |

### `pago` (fila SOLO cuando se paga — corazón de la cartera)
> Modelo real (spec 11): la tabla `pagos` guarda **una fila por mes efectivamente pagado**. Los estados `due/pending/na` **no se almacenan**: se derivan en dominio (`estadoDelMes`) a partir de los pagos reales + `fechaInicio` del alumno + arranque del club (MAR 2026) + mes vivo.

| Campo | Origen / regla |
|---|---|
| alumno_id | FK → alumno |
| anio | periodo (ej. 2026) |
| mes | enum ENE…DIC; en el histórico se cobra **MAR–NOV** (`CATEGORIAS` cols. MAR…NOV) |
| monto_cop | cuota vigente al pagar (el seed fuerza $50.000) |
| metodo | `efectivo` / `transferencia` / null (null en el seed) |
| pagado_en | timestamp del registro; null en el seed |
| registrado_por | FK → user; null en el seed |

**Origen del pago en el Excel:** el pago se marca con el **color de relleno** de la celda del mes, no con texto. Verde (`theme9`) = pagado → se crea la fila. Blanco / `theme0` / sin relleno = sin pago → no hay fila. Cualquier otro fill se **reporta como anomalía** (fila + mes) en vez de adivinar. Constraint único `(alumno_id, anio, mes)`: un pago por alumno-mes-año.

### `uniforme` — **modelo del spec 12, no del 11**
> La inspección real invalidó el modelo de un solo booleano `entregado`. El real: **dos kits por alumno** (AZUL y ORO, $100.000 c/u) con **4 estados por kit** y **abonos parciales**. Se implementa en el spec 12; el spec 11 muestra un aviso "migración de uniformes en camino" para no mezclar mock con datos reales.

| Campo | Origen |
|---|---|
| alumno_id | FK → alumno |
| kit | AZUL / ORO (hoja `UNIFORMES`, dos kits por alumno) |
| numero | col. N° (único por kit, R6) |
| estado | verde = pagado y entregado · rojo = entregado sin pagar · azul = pagado sin entregar · blanco = nada |
| abonado_cop | abono parcial acumulado del kit |

### `sesion_plan` (plantilla por categoría y día)
| Campo | Origen |
|---|---|
| categoria | `PLANIFICACION` encabezado CATEGORIA |
| dia | LUNES / MIERCOLES / VIERNES |
| tema / objetivos | `PLANIFICACION` TEMA / OBJETIVOS |
| fases | ACTIVACION MUSCULAR · PARTE CENTRAL · VUELTA A LA CALMA |

## Reglas de negocio (exactas, del Excel)

- **R1 · Categoría automática.** Se calcula del año de nacimiento (no se digita). Mapeo temporada 2026:
  `2022-2023→SUB 4 · 2020-2021→SUB 6 · 2018-2019→SUB 8 · 2016-2017→SUB 10 · 2014-2015→SUB 12 · 2012-2013→SUB 14 · 2010-2011→SUB 16`.
  Fórmula general: `categoria = (año_temporada − año_nacimiento)` redondeado al **par superior**, acotado a [4, 16].
- **R2 · Cuota y descuento.** **Corregida por el cliente (2026-07-10):** la mensualidad es **$50.000** COP/mes por jugador **sin descuento por hermanos**; el descuento de hermanos aplica al **uniforme** ($100.000 → $80.000 c/u). La detección de hermanos por acudiente (R4) se mantiene. _(La versión anterior — $40.000 de mensualidad a hermanos — salió de la col. CUOTA del Excel y era una interpretación errónea.)_
- **R3 · Estado de pago.** Cobro mensual por **año calendario**, ventana real **MAR–NOV** (`MES_FIN_COBRO = 'NOV'`, constante única; cambia a DIC si Camilo confirma). Un mes se cobra o no (sin `partial`, spec 05). Estado **derivado**: `paid` (existe fila de pago) · `due` (cobrable y vencido) · `pending` (cobrable y no vencido) · `na` (antes del arranque del club MAR 2026, antes del ingreso del alumno, o después de `MES_FIN_COBRO`). "Mora" = uno o más meses `due`.
- **R4 · Acudiente y hermanos.** Un acudiente puede tener varios alumnos; no duplicar el acudiente (vincular varios niños al mismo registro).
- **R5 · Validación.** Identificación requerida y única (hoy hay vacías y de pocos dígitos); celular de 10 dígitos; categoría nunca vacía ni "SUB" sin número.
- **R6 · Uniformes.** Dos kits por alumno (AZUL / ORO), $100.000 c/u; 4 estados por kit y abonos parciales; el número de camiseta no se repite dentro del mismo kit. Modelo completo en el spec 12.

## Notas de migración (limpieza detectada — revisar con el cliente)

- **Duplicación:** el mismo alumno está en `CATEGORIAS` y en su hoja `SUB`. En el módulo: **una sola tabla `alumno`**; las vistas por categoría son filtros, no copias.
- **Categorías incompletas:** hay filas sin categoría o con "SUB" sin número → recalcular por año al migrar.
- **Identificaciones:** varios documentos de 7 dígitos o vacíos → revisar antes de cargar.
- **Pagos históricos:** ~~las columnas de meses están vacías~~ **falso** — los pagos se marcan con **color de relleno** (verde), no con texto; el CSV salía vacío porque no exporta estilos. El seed lee el histórico real desde el color (spec 11). La mora inicial del sistema es la real.
- **CUOTA 40.000:** hay filas con 40.000 en `CATEGORIAS`, pero el cliente aclaró (2026-07-10) que la mensualidad es $50.000 para todos → confirmar qué representan esas filas antes del seed (¿dato viejo? ¿acuerdo puntual?).

> El seed (`scripts/seed-from-excel.mjs`, HU-8.1) usa `exceljs` (devDependency) para leer el Excel **local** con estilos, marca pagos por **color de relleno** (verde) de MAR–NOV, fuerza cuota $50.000, y **reporta y omite** filas anómalas (año fuera de rango, documento vacío/duplicado, fill desconocido) sin abortar. Idempotente por documento. Las columnas AZUL/ORO se ignoran (las carga el seed del spec 12).
