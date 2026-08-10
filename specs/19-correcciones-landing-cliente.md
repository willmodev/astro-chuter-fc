# SPEC 19 — Correcciones de la landing pedidas por el cliente

> **Estado:** Implementado · **Depende de:** SPEC 01 (rediseño de la landing y sus 9 secciones
> numeradas), SPEC 09 (pantalla de entrenos del admin, donde vive `VenueCard`), SPEC 15
> (catálogo único de categorías, que sigue siendo la fuente de las edades) ·
> **Fecha:** 2026-08-10
> **Objetivo:** Aplicar en la landing y en la tarjeta de sede del admin las correcciones que
> Camilo envió por WhatsApp el 2026-08-09: horario partido por día, historia de fundación de
> la escuela, credenciales de los propietarios, lema del club, misión y visión arriba de la
> página, y dos fotos nuevas en la galería.

---

## Por qué existe este spec

Es un lote de feedback del cliente, no una funcionalidad nueva. Se mantiene como un solo spec
porque los cambios se concentran en los mismos archivos (`src/lib/site.ts`,
`src/pages/index.astro`, `AboutSection.astro`), y partirlo obligaría a coordinar dos ramas
sobre el mismo código.

Hay un cambio que sí tiene fondo técnico: **el horario dejó de ser uniforme**. Hasta hoy los
tres días entrenaban de 4:30 a 6:00 PM, y eso permitía modelarlo como dos strings
(`daysHuman` + `hoursHuman`). Con el horario nuevo —lunes y miércoles 5:30 PM, viernes 3:00
PM— ese modelo ya no representa la realidad, y el `openingHours` del JSON-LD tampoco: una
sola entrada `Mo,We,Fr 16:30-18:00` pasaría a Google un horario falso. Por eso el spec cambia
la estructura, no solo los valores.

El segundo cambio de fondo es de **fuente única**: el campo `horario` estaba repetido a mano
en los 7 markdowns de `programas/`. Corregir la hora obligaría a tocar los 7 y a repetir esa
tarea cada vez que el club mueva el horario. Como el cliente confirmó que es el mismo para
todas las categorías, el campo sale del frontmatter y se deriva de `SCHEDULE`.

---

## Alcance

**Dentro:**

- **Horario partido por día.** `SCHEDULE` en `src/lib/site.ts` deja de ser un par de strings
  (`daysHuman` / `hoursHuman`) y pasa a ser una lista de bloques con un resumen corto
  derivado. Consumidores a actualizar: `HeroSection.astro`, `ContactSection.astro`,
  `LocationSection.astro`, `Footer.astro`, `lib/seo.ts` (el JSON-LD pasa a dos entradas de
  `openingHours`), y en el admin `TarjetaClub.tsx` y `VenueCard.tsx`.
- **`VenueCard.tsx` deja de hardcodear** `'Lun · Mié · Vie · 4:30–6:00 PM'` y lee el resumen
  corto de `SCHEDULE`.
- **Fuente única del horario en programas.** Se elimina el campo `horario` del frontmatter de
  los 7 markdowns y del schema en `src/content.config.ts`; `listarProgramas()` lo inyecta
  desde `SCHEDULE`. `ProgramCard.astro` sigue recibiéndolo como prop, sin cambios en su firma.
- **Reordenamiento de la landing.** `EsenciaSection` sube a la posición 2 en
  `src/pages/index.astro`. Numeración resultante: `01 Programas · 02 Esencia · 03 Sobre el
club · 04 Historia · 05 Equipo · 06 Galería · 07 Testimonios · 08 Ubicación · 09 Contacto`.
  Se actualizan los rótulos `Nº 0X` de las secciones afectadas. `NAV_LINKS` no cambia (no
  tiene entrada de Esencia).
- **Sección «Sobre el club» (`AboutSection.astro`):** título → _«Una escuela del barrio, con
  propósito.»_; subtítulo → _«niños y niñas de la ciudad de Valledupar»_; párrafos nuevos con
  el origen de la escuela (marzo de 2025, Camilo Andrade y Ebed Shaday Calderón, en homenaje a
  «Chuter»); firma del manifiesto → _«Familia Andrade Calderón · Fundadores»_; sello circular
  `desde 2024` → `desde 2025`.
- **Lema del club.** `SITE.tagline` → `'Todo niño es un campeón'` (impacta footer, `<title>`
  de SEO y la tarjeta del club en el admin) más una franja visual
  `Somos fútbol · Somos Chuter`.
- **`SITE.description` y `SITE.shortDescription`:** cambian «Los Algarrobillos» por
  «Valledupar» y la lista desactualizada de 4 categorías por el rango real (Baby a Juvenil,
  3 a 16 años).
- **Bloque «Propietarios y fundadores»** al inicio de `CoachesSection.astro`, con Camilo
  Andrade Guerra (Licenciado en Educación Física, Recreación y Deportes · Magíster en
  Educación · Tarjeta de entrenador COCED) y Ebed Shaday Calderón Rosales (Psicóloga ·
  emprendedora apasionada por el desarrollo integral de niños y adolescentes). Requiere un
  campo `credenciales: string[]` opcional en el schema de `formadores`. Camilo sigue
  apareciendo además como entrenador de Preinfantil, y Alirio Andrade sigue como Presidente en
  el bloque de Dirección.
- **Dos fotos nuevas a la galería:** la del círculo de charla entra a la sala «La familia
  Chuter» y la del plantel con los trofeos a la sala «La cantera». Se copian a
  `src/assets/images/club/` con nombre semántico y las optimiza `<Image>` de Astro en build,
  sin conversión manual previa.

**Fuera de alcance (para specs futuras):**

- **Foto propia por categoría** en las tarjetas de programa. Es lo que pidió el cliente, pero
  las 4 fotos enviadas no son de categorías: hacen falta 7 fotos, una por SUB. Queda como
  pendiente a solicitar a Camilo y se implementa cuando lleguen.
- **Las dos fotos duplicadas** (`img1` y `img3`): no se versionan, son casi idénticas a las
  elegidas.
- **La sección Historia (`HistoriaSection`)**, que cuenta la vida de Jesús David «Chuter». El
  cliente separó explícitamente esa historia de la de la escuela; su texto no se toca.
- **Reemplazar el texto del manifiesto.** Solo cambia la firma.
- **Cualquier otro cambio del back-office** más allá de las dos tarjetas de horario.
- **Fotos de Camilo y Ebed en las tarjetas del equipo.** Los archivos existen en
  `public/images/formadores/`, pero los markdowns tienen `foto: ''`; cambiar eso es una
  decisión de contenido separada.
- **Horario distinto por categoría** (pendiente viejo, cerrado por ahora: el cliente confirmó
  que es el mismo para todas).
- Testimonios reales, logros del club y bios largas: siguen pendientes del cliente.

---

## Modelo de datos

### 1. `SCHEDULE` — de dos strings a bloques (`src/lib/site.ts`)

```ts
interface BloqueHorario {
  /** Días del bloque, para leer humano: 'Lunes y miércoles'. */
  dias: string;
  /** Abreviatura para espacios apretados: 'Lun y Mié'. */
  diasCorto: string;
  /** Franja legible: '5:30 a 7:00 PM'. */
  horas: string;
  /** Franja compacta: '5:30–7:00 PM'. */
  horasCorto: string;
  /** Entrada de schema.org: 'Mo,We 17:30-19:00'. */
  schema: string;
}

export const SCHEDULE = {
  bloques: [
    {
      dias: 'Lunes y miércoles',
      diasCorto: 'Lun y Mié',
      horas: '5:30 a 7:00 PM',
      horasCorto: '5:30–7:00 PM',
      schema: 'Mo,We 17:30-19:00',
    },
    {
      dias: 'Viernes',
      diasCorto: 'Vie',
      horas: '3:00 a 4:30 PM',
      horasCorto: '3:00–4:30 PM',
      schema: 'Fr 15:00-16:30',
    },
  ],
  /** Solo los días, sin horas: 'Lunes, miércoles y viernes'. */
  daysHuman: 'Lunes, miércoles y viernes',
  /** Una línea completa: 'Lun y Mié 5:30–7:00 PM · Vie 3:00–4:30 PM'. */
  resumenCorto: 'Lun y Mié 5:30–7:00 PM · Vie 3:00–4:30 PM',
  /** Para el frontmatter derivado de programas y las tarjetas de categoría. */
  resumenPrograma: 'Lun y Mié 5:30–7:00 PM · Vie 3:00–4:30 PM',
  /** Array para el JSON-LD; schema.org acepta varias entradas. */
  schemaOpeningHours: ['Mo,We 17:30-19:00', 'Fr 15:00-16:30'],
} as const;
```

`resumenCorto` y `schemaOpeningHours` se escriben como constantes literales, no se calculan
con `.map().join()`: son dos bloques fijos y derivarlos añadiría código sin ganar nada.

`hoursHuman` **desaparece**. Cualquier uso que quede rompe el `astro check`, que es
justamente el punto: obliga a revisar los 7 consumidores en vez de dejar uno con la hora vieja.

### 2. Schema de `programas` — sale `horario` (`src/content.config.ts`)

```ts
schema: z.object({
  sub: z.number(),
  // horario: ELIMINADO — se deriva de SCHEDULE en listarProgramas()
  icono: z.string(),
  entrenador: z.string().optional(),
  descripcion: z.string(),
  color: z.enum(['navy', 'blue', 'gold']).default('navy'),
  orden: z.number(),
});
```

`listarProgramas()` en `src/lib/programas.ts` agrega `horario: SCHEDULE.resumenPrograma` al
objeto que ya construye con el catálogo de `lib/domain/categoria.ts`. Los consumidores
(`ProgramsSection` → `ProgramCard`) no cambian de firma.

### 3. Schema de `formadores` — entra `credenciales` (`src/content.config.ts`)

```ts
schema: z.object({
  nombre: z.string(),
  rol: z.string(),
  bio: z.string(),
  foto: z.string(),
  instagram: z.string().optional(),
  etiqueta: z.string(),
  /** Títulos y certificaciones; solo la usan los fundadores. */
  credenciales: z.array(z.string()).optional(),
  orden: z.number(),
});
```

Frontmatter resultante de los dos fundadores:

```yaml
# src/content/formadores/camilo-andrade.md
nombre: 'Camilo Andrade Guerra'
rol: 'Dirección · Entrenador Preinfantil'
etiqueta: 'Fundador'
credenciales:
  - 'Licenciado en Educación Física, Recreación y Deportes'
  - 'Magíster en Educación'
  - 'Tarjeta de entrenador — COCED'
```

```yaml
# src/content/formadores/ebed-shaday-calderon.md
nombre: 'Ebed Shaday Calderón Rosales'
rol: 'Psicóloga'
etiqueta: 'Fundadora'
credenciales:
  - 'Psicóloga'
  - 'Emprendedora, apasionada por el desarrollo integral de niños y adolescentes'
```

`CoachesSection.astro` filtra hoy por `etiqueta === 'Dirección'` y `=== 'Entrenador'`. Pasa a
tres grupos: `Fundador`/`Fundadora` → bloque nuevo arriba; `Dirección` → Alirio; `Entrenador`
→ los cuatro de siempre. Camilo aparece **dos veces a propósito**: como fundador y en la lista
de entrenadores, con su `rol` de categoría.

> Nota de implementación: `CoachesSection.astro` está en 178 de las 200 líneas permitidas.
> El bloque de fundadores va en un componente aparte —`FoundersBlock.astro` en
> `src/components/sections/`— y la sección solo lo invoca.

### 4. Fotos nuevas

| Origen                                              | Destino en `src/assets/images/club/` | Sala de la galería     |
| --------------------------------------------------- | ------------------------------------ | ---------------------- |
| `Docs/Camilo/fotos-club/nuevas/img2.jpeg` (trofeos) | `cantera-trofeos.jpg`                | 01 · La cantera        |
| `Docs/Camilo/fotos-club/nuevas/img4.jpeg` (círculo) | `familia-charla.jpg`                 | 03 · La familia Chuter |

Entradas nuevas en `SALAS_GALERIA` (`src/lib/galeria.ts`), respetando la interfaz
`FotoGaleria` existente:

```ts
{
  src: canteraTrofeos,
  alt: 'Plantel de Chuter FC posando en la cancha con cinco trofeos',
  cedula: 'Los primeros trofeos',
  gridClass: 'md:col-span-2 md:row-span-2',
}
```

```ts
{
  src: familiaCharla,
  alt: 'Equipo de Chuter FC en círculo alrededor del formador al atardecer',
  cedula: 'El círculo del formador',
  gridClass: 'md:col-span-2 md:row-span-2',
}
```

Las imágenes se copian tal cual (960–1280 px, JPEG de WhatsApp). `<Image>` de Astro genera
las variantes WebP/AVIF responsivas en build; no se convierten a mano.

---

## Plan de implementación

Cada paso deja el sitio compilando y desplegable.

1. **Remodelar `SCHEDULE`** en `src/lib/site.ts` con la estructura de bloques y borrar
   `hoursHuman`. `npm run typecheck` falla a propósito y lista los consumidores rotos: ese es
   el inventario del paso 2.
2. **Actualizar los consumidores del horario en la landing:** `HeroSection.astro` y
   `Footer.astro` usan `SCHEDULE.resumenCorto`; `ContactSection.astro` y
   `LocationSection.astro` recorren `SCHEDULE.bloques` y pintan una línea por bloque.
   Verificación: `npm run dev`, las cuatro zonas muestran el horario nuevo.
3. **Actualizar el JSON-LD** en `src/lib/seo.ts`: `openingHours` pasa a recibir el array de
   dos entradas. Verificación: ver el `<script type="application/ld+json">` en el HTML
   generado y validarlo en el Rich Results Test de Google.
4. **Actualizar el admin:** `TarjetaClub.tsx` usa `SCHEDULE.resumenCorto` y `VenueCard.tsx`
   borra su constante `HORARIO_CORTO` para leer la misma. Verificación: entrar a `/admin` y a
   la pantalla de entrenos.
5. **Sacar `horario` del frontmatter** de los 7 markdowns de `src/content/programas/`,
   quitarlo del schema en `src/content.config.ts` e inyectarlo desde `SCHEDULE` en
   `listarProgramas()`. Verificación: las 7 tarjetas de categoría muestran el horario nuevo.
6. **Reordenar `index.astro`**: `EsenciaSection` sube a la posición 2 y se actualizan los
   rótulos `Nº 0X` de las secciones afectadas. Verificación: recorrer la página y comprobar
   que la numeración va de 01 a 09 sin saltos ni repeticiones.
7. **Actualizar los textos de `AboutSection.astro`**: título, subtítulo, párrafos de origen de
   la escuela, firma del manifiesto y sello `desde 2025`.
8. **Actualizar `SITE`** en `src/lib/site.ts`: `tagline`, `description` y `shortDescription`.
   Verificación: el `<title>` y la meta description del HTML generado.
9. **Agregar la franja del lema** `Somos fútbol · Somos Chuter` como componente
   `LemaBand.astro`, ubicada entre «Sobre el club» e «Historia».
10. **Agregar `credenciales` al schema de formadores** y actualizar los dos markdowns de los
    fundadores con su nombre completo, etiqueta y credenciales.
11. **Crear `FoundersBlock.astro`** y montarlo al inicio de `CoachesSection.astro`, ajustando
    el filtrado a los tres grupos. Verificación: la sección Equipo muestra fundadores,
    dirección y entrenadores, y `CoachesSection.astro` sigue bajo 200 líneas.
12. **Copiar las dos fotos** a `src/assets/images/club/` con su nombre semántico y registrarlas
    en `src/lib/galeria.ts`. Verificación: aparecen en sus salas y el build genera las
    variantes optimizadas.
13. **Actualizar `CLAUDE.md`**: horario nuevo en «Horarios», marcar cerrado el pendiente de
    horario por categoría y abrir el pendiente de las 7 fotos de categoría.
14. **`npm run format` y `npm run check`** en verde.

---

## Criterios de aceptación

- [x] El hero, el footer, la sección de contacto y la de ubicación muestran el horario nuevo;
      no queda ninguna aparición de «4:30» ni de «6:00 PM» en `src/`.
- [x] Las cuatro zonas anteriores muestran los dos bloques (lunes y miércoles 5:30–7:00 PM;
      viernes 3:00–4:30 PM), no un rango único.
- [x] El JSON-LD de la home tiene `openingHours` con exactamente dos entradas:
      `Mo,We 17:30-19:00` y `Fr 15:00-16:30`.
- [x] La tarjeta de sede de la pantalla de entrenos y la tarjeta del club en «Más» muestran el
      horario nuevo, y `VenueCard.tsx` ya no declara `HORARIO_CORTO`.
- [x] Las 7 tarjetas de categoría muestran el horario nuevo, y ningún markdown de
      `src/content/programas/` tiene campo `horario`.
- [x] La sección de misión, visión y principios aparece inmediatamente después de Programas y
      está rotulada `Nº 02`.
- [x] Las 9 secciones están numeradas de `01` a `09` en orden, sin saltos ni repeticiones.
- [x] «Sobre el club» se titula «Una escuela del barrio, con propósito.» y su subtítulo dice
      «Valledupar», no «Los Algarrobillos».
- [x] «Sobre el club» incluye el origen de la escuela: marzo de 2025, Camilo Andrade y Ebed
      Shaday Calderón, en homenaje a «Chuter».
- [x] El manifiesto está firmado «Familia Andrade Calderón» y el sello circular dice 2025.
- [x] No queda ninguna aparición de «2024» como año de fundación en `src/`.
- [x] El `<title>` de la home y el footer usan el lema «Todo niño es un campeón».
- [x] La franja «Somos fútbol · Somos Chuter» es visible entre «Sobre el club» e «Historia».
- [x] `SITE.description` menciona Valledupar y ya no lista solo 4 categorías.
- [x] La sección Equipo abre con «Propietarios y fundadores» mostrando a Camilo con sus tres
      credenciales y a Ebed con las suyas.
- [x] Camilo sigue apareciendo en la lista de entrenadores como responsable de Preinfantil, y
      Alirio sigue listado como Presidente.
- [x] La sala «La cantera» muestra la foto de los trofeos y «La familia Chuter» la del círculo.
- [x] Las dos fotos se sirven en formato optimizado (WebP/AVIF) generado por Astro, no como
      JPEG original.
- [x] `npm run check` en verde y ningún archivo supera 200 líneas.
- [x] Lighthouse mobile de la home se mantiene en el presupuesto del proyecto: Performance
      95+, Accesibilidad 100, SEO 100.

---

## Decisiones

- **Sí:** `SCHEDULE` como lista de bloques. El horario dejó de ser uniforme y dos strings ya
  no lo representan; con bloques, el próximo cambio de hora se hace en un solo archivo.
- **Sí:** borrar `hoursHuman` en vez de dejarlo con un valor de compatibilidad. Que
  `astro check` falle es el mecanismo que garantiza revisar los 7 consumidores.
- **No:** calcular `resumenCorto` y `schemaOpeningHours` con `.map().join()`. Son dos bloques
  fijos; derivarlos agrega código y ninguna flexibilidad real.
- **Sí:** asumir 1h30 de duración para los bloques nuevos (Lun y Mié 5:30–7:00 PM; Vie
  3:00–4:30 PM). El cliente solo dio la hora de inicio; 1h30 es la duración que el club ya
  tenía. **Supuesto explícito, confirmar con Camilo.**
- **Sí:** sacar `horario` del frontmatter de programas. El cliente confirmó que es igual para
  las 7 categorías, y repetirlo a mano garantizaba que se desactualizara.
- **No:** un campo `horario` opcional en el frontmatter como escape para una categoría con
  horario distinto. Sería una segunda fuente de verdad para un caso que hoy no existe; si
  algún día pasa, se agrega entonces.
- **Sí:** Esencia en la posición 2, no en la 1. El cliente pidió misión y visión «arriba»; las
  categorías siguen siendo el hook comercial y se quedan primero.
- **Sí:** capitalización normal en los títulos, no la mayúscula sostenida del mensaje del
  cliente. El display serif de la landing ya aplica el tratamiento tipográfico; la mayúscula
  sostenida se ve mal y perjudica la lectura.
- **Sí:** corregir «adolecentes» → «adolescentes» y demás ortografía del mensaje original,
  igual que se hizo con el «INFALTIL» del flyer.
- **Sí:** mantener el texto actual del manifiesto y cambiar solo la firma. El texto vigente es
  más corto y golpea mejor que el párrafo enviado por WhatsApp.
- **Sí:** el lema pasa a ser `SITE.tagline`. Es la frase que el club quiere que lo represente,
  y así entra al `<title>`, al footer y al admin sin duplicarla en tres lugares.
- **Sí:** Camilo aparece dos veces en la sección Equipo (fundador y entrenador de
  Preinfantil). Son dos roles reales y el cliente los mencionó en dos listas distintas.
- **No:** convertir las fotos a WebP a mano antes de versionarlas. `<Image>` de Astro ya
  genera WebP/AVIF responsivos en build; hacerlo antes duplicaría el trabajo y perdería el
  original.
- **No:** usar recortes de las 4 fotos como «foto de categoría». Serían fotos falsas; se
  esperan las 7 reales.
- **No:** versionar `img1` e `img3`. Son casi idénticas a las elegidas y solo pesarían en el
  repo.
- **Sí:** el bloque de fundadores en un componente aparte. `CoachesSection.astro` está en 178
  líneas y el límite del proyecto es 200.

---

## Riesgos

| Riesgo                                                                                        | Mitigación                                                                                                                                          |
| --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| La hora de fin (7:00 PM / 4:30 PM) es un supuesto, no un dato confirmado                      | Está registrada como supuesto en Decisiones y en `CLAUDE.md`. Si Camilo corrige, es un solo cambio en `SCHEDULE.bloques`.                           |
| El horario partido no cabe en una línea en pantallas angostas (hero, tarjetas del admin)      | `resumenCorto` usa abreviaturas (`Lun y Mié`) y separador `·`. Verificar a 360 px antes de cerrar el paso 2.                                        |
| Renumerar las secciones deja un `Nº 0X` desfasado en alguna sección                           | Criterio de aceptación explícito: recorrer las 9 y verificar la secuencia completa.                                                                 |
| Borrar `hoursHuman` rompe el build de Vercel si queda un consumidor sin migrar                | Vercel corre `astro build`, no `check`; el paso 1 exige correr `npm run typecheck` local antes de seguir, y el paso 14 cierra con `check` en verde. |
| Las fotos de WhatsApp (960–1280 px) se ven blandas si la galería las estira a ancho completo  | Se les asigna `md:col-span-2`, no el ancho completo de la retícula de 4 columnas. Revisar visualmente en desktop.                                   |
| Cambiar `SITE.tagline` altera el `<title>` de todas las páginas y puede mover posicionamiento | El sitio es joven y el término de marca («Chuter FC») no cambia. Riesgo aceptado por decisión del cliente.                                          |

---

## Lo que **no** entra en este spec

- Fotos propias por categoría en las tarjetas de programa: faltan las 7 imágenes reales.
- Cualquier cambio al texto de la sección Historia (la vida de Jesús David «Chuter»).
- Reemplazar el texto del manifiesto (solo cambia la firma).
- Cambios en el back-office más allá de las dos tarjetas que muestran el horario.
- Poner las fotos de Camilo y Ebed en sus tarjetas del equipo.
- Testimonios reales, logros del club y bios largas de los fundadores.
- Horario diferenciado por categoría.

Cada uno de esos, si entra, va en su propio spec.
