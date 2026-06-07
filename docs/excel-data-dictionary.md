# Diccionario de datos — fuente Excel del club

> Derivado de `CHUTER FC 2026.xlsx` (hoja-especificación + hojas operativas). **El Excel NO se versiona** (contiene PII de menores: nombres, documentos, celulares, direcciones). Se conserva local como fuente del seed (HU-8.1). Aquí queda solo el **esquema y las reglas**, sin datos personales.

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
| cuota_mensual | `CATEGORIAS` col. CUOTA (50.000 / 40.000) |
| fecha_inicio | `CATEGORIAS` col. INCIO (sic) |
| activo | nuevo (booleano) |

### `pago` (un registro por alumno + mes — corazón de la cartera)
| Campo | Origen / regla |
|---|---|
| alumno_id | FK → alumno |
| anio | periodo (ej. 2026) |
| mes | FEB=2 … DIC=12 (`CATEGORIAS` cols. FEB…NOV) |
| monto | valor de la celda; por defecto la cuota |
| estado | PAGADO / PENDIENTE / PARCIAL (celda llena = pagado) |
| fecha_pago | cuándo se registró |

### `uniforme`
| Campo | Origen |
|---|---|
| alumno_id | FK → alumno |
| tipo | AZUL / DORADO (hoja `UNIFORMES`) |
| numero | col. N° (único por tipo, R6) |
| entregado | booleano |

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
- **R2 · Cuota y descuento.** Base **$50.000** COP/mes; **$40.000** cuando el acudiente tiene más de un hijo inscrito (hermanos). El sistema detecta hermanos por acudiente y sugiere la tarifa.
- **R3 · Estado de pago.** Cobro mensual FEB–DIC. Estado por mes: PAGADO / PENDIENTE / PARCIAL. "Mora" = uno o más meses vencidos sin pagar.
- **R4 · Acudiente y hermanos.** Un acudiente puede tener varios alumnos; no duplicar el acudiente (vincular varios niños al mismo registro).
- **R5 · Validación.** Identificación requerida y única (hoy hay vacías y de pocos dígitos); celular de 10 dígitos; categoría nunca vacía ni "SUB" sin número.
- **R6 · Uniformes.** Dos juegos (AZUL / DORADO); el número de camiseta no se repite dentro del mismo tipo.

## Notas de migración (limpieza detectada — revisar con el cliente)

- **Duplicación:** el mismo alumno está en `CATEGORIAS` y en su hoja `SUB`. En el módulo: **una sola tabla `alumno`**; las vistas por categoría son filtros, no copias.
- **Categorías incompletas:** hay filas sin categoría o con "SUB" sin número → recalcular por año al migrar.
- **Identificaciones:** varios documentos de 7 dígitos o vacíos → revisar antes de cargar.
- **Pagos históricos:** las columnas de meses están vacías hoy → arrancar el control de pagos desde la salida en vivo del módulo (no inventar histórico).

> El seed (`scripts/seed-from-excel.mjs`, HU-8.1) lee el Excel **local**, aplica R1/R5 y carga datos limpios; es idempotente por documento.
