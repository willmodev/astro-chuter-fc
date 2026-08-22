# SPEC 22 — Fotos reales del cuerpo técnico en la sección Equipo

> **Estado:** Implementado · **Depende de:** SPEC 01 (las 9 secciones de la landing),
> SPEC 19 (bloque de fundadores, `credenciales` y las salas de la galería) ·
> **Fecha:** 2026-08-22
> **Objetivo:** Reemplazar los avatares de iniciales de la sección «El equipo detrás del club»
> por los retratos reales que Camilo envió el 2026-08-22, y sumar a la galería la única foto
> nueva que aporta algo que no tenía.

---

## Por qué existe este spec

El spec 19 dejó dos cosas abiertas a propósito:

- «**Fotos de Camilo y Ebed en las tarjetas del equipo.** Los archivos existen en
  `public/images/formadores/`, pero los markdowns tienen `foto: ''`; cambiar eso es una decisión
  de contenido separada.»
- `CLAUDE.md` → «Fotos profesionales de los formadores».

Ahora llegaron: 6 retratos individuales (los 4 entrenadores, el presidente y la cofundadora) más
material de escena. Con eso las 7 tarjetas del equipo dejan de mostrar iniciales.

Hay además una **deuda técnica** que este spec paga. El campo `foto` existía en el schema de
`formadores` como `z.string()` **obligatorio**, con `''` en los 7 archivos, y **nadie lo leía**:
su único consumidor, `CoachCard.astro`, no estaba importado en ningún archivo de `src/`. Era un
campo fantasma con un componente muerto detrás. Al conectarlo de verdad, `foto` pasa a
`image().optional()` y `CoachCard.astro` se borra.

---

## Alcance

**Dentro:**

- **`foto` deja de ser un string.** En `src/content.config.ts` la colección `formadores` pasa a
  schema-función para usar el helper `image()` de `astro:content`: la ruta del frontmatter llega
  resuelta como `ImageMetadata` y `<Image>` la optimiza en build. `foto` pasa de obligatorio a
  `.optional()`, que es lo que refleja la realidad (puede entrar una persona sin foto).
- **`CoachAvatar.astro`** (nuevo): un solo avatar para los tres bloques de la sección. Con foto
  renderiza `<Image>`; sin foto, las iniciales sobre navy exactamente como antes.
- **`CoachesSection.astro` y `FoundersBlock.astro`** consumen `CoachAvatar` y **borran su copia
  de `initials()`** — la función estaba duplicada literalmente en los dos archivos, y el markup
  del avatar triplicado (fundadores, dirección, cuerpo técnico).
- **Foto de apertura de la sección:** la grupal del cuerpo técnico completo (`img13`), en
  `max-w-2xl` con `aspect-[3/2]` en móvil y `aspect-[16/10]` en desktop.
- **Una foto nueva a la galería:** `img11` a la sala `02 · En juego`.
- **Script de pre-optimización** `scripts/optimizar-fotos-equipo.mjs`.
- **Limpieza:** borrar `src/components/sections/CoachCard.astro` (muerto, y usaba `<img>` crudo,
  prohibido por `CLAUDE.md`) y las dos `.webp` huérfanas de `public/images/formadores/`.

**Fuera de alcance:**

- **11 de las 17 fotos no se versionan.** Ver Decisiones.
- **Foto propia por categoría** en las tarjetas de programa: sigue pendiente, siguen faltando las
  7 reales (una por SUB). El pendiente del spec 19 no se cierra.
- **Bios largas y testimonios reales:** siguen pendientes del cliente.
- **El campo `foto` de `testimonios`**, que tampoco se renderiza. Es la misma clase de campo
  fantasma, pero sin fotos que conectar todavía; se deja como está.

---

## Optimización de imágenes

Las fotos llegan como JPEG de WhatsApp a 1200×1600 (una a 806×1600) y pesan 129–488 KB. Dos capas:

1. **Pre-optimización al versionar** — `scripts/optimizar-fotos-equipo.mjs`, con `sharp` (ya
   disponible vía Astro, igual que `scripts/generate-static-images.mjs`). Dry-run por defecto,
   `--yes` para escribir, como el resto de `scripts/`. Tres perfiles, uno por destino:

   | Destino               | Qué hace                                             | Resultado        |
   | --------------------- | ---------------------------------------------------- | ---------------- |
   | **Retrato** (avatar)  | Recorte cuadrado desde arriba → 640×640, mozjpeg q82 | ~180 KB → ~40 KB |
   | **Apertura** (grupal) | Recorte a 3:2 de la banda con las 6 personas, q90    | 321 KB → 217 KB  |
   | **Galería**           | Sin recorte, 1200×1600, mozjpeg q82                  | 488 KB → ~400 KB |

2. **`<Image>` de Astro en build**, con `widths` explícitos: es la capa que genera las variantes
   WebP/AVIF responsivas y decide qué descarga el navegador. Medido en el build: los retratos se
   sirven en 17–43 KB (336/448/640 px) y la grupal en 205–252 KB (1008/1200 px).

   Las calidades del paso 1 son deliberadamente altas (q92/q97) porque **ese archivo no es lo que
   se sirve**: es el insumo del reencode de Astro. Comprimirlo fuerte solo le quita detalle al
   WebP que sí llega al navegador, sin ahorrarle un byte al visitante.

El objetivo del paso 1 **no es comprimir al máximo**, es no versionar píxeles que nadie va a ver
y gastar ese presupuesto en calidad. Esto mantiene la decisión del spec 19 («no convertir a WebP
a mano, `<Image>` ya lo hace») y le agrega lo que faltaba: no versionar 1600 px y 500 KB cuando
el destino es un avatar de 112 px.

**Los topes no son arbitrarios.** 640 px de retrato cubre el avatar de 112 px CSS a DPR 3
(336 px) con margen. La galería no pasa de 1080 de ancho (`GallerySection.astro` la sirve con
`getImage()`), así que los 1200 del original quedan tal cual.

### El error que costó dos rondas: el piso de `widths`

**Síntoma:** el cliente reportó dos veces que las fotos se veían mal. La causa no era la
compresión, era el **tamaño mínimo del `srcset`**.

`CoachAvatar` declaraba `widths={[112, 224, 336]}` con `sizes` de 112 px. En un monitor DPR 1
—la mayoría de los de escritorio— el navegador elige correctamente la variante más chica que
cumple: **112×112 px, 3 KB**. Para una cara humana eso es una miniatura de avatar de foro; el
escudo del uniforme quedaba en una manchita. La grupal tenía el mismo defecto en su versión:
`widths` arrancaba en 672, exactamente el ancho CSS del contenedor, o sea 1× sin margen.

**La regla que queda:** el `width` más chico de la lista es el que van a ver la mayoría de los
visitantes, no el más grande. Se pone en **2× el tamaño CSS**, no en 1×. Ahora los retratos van
`[336, 448, 640]` con `quality={88}` (3× del avatar de 112 px) y la grupal `[1008, 1200]` con
`quality={92}` (1,5× de 672).

Por qué no se detectó antes: la verificación se hizo en el navegador de Playwright, que corre a
DPR 1 y por tanto servía justamente la variante mala — pero se miró la captura de pantalla
escalada, donde 112 px estirados a 112 px CSS se ven bien. El chequeo correcto es leer
`img.currentSrc` y confirmar qué `w=` cargó, no mirar la captura.

### Dos ajustes más que salieron de verificar en el navegador, no del plan

- **La grupal se veía blanda, y el arreglo real fue mostrarla más chica.** Hubo tres pérdidas
  acumuladas —la fuente reducida a 1080 de ancho, `quality={72}` encima, y el tope de `widths`
  igualado al ancho CSS del contenedor (1× en retina)— pero corregirlas no alcanzó. El techo es
  físico: **el original es 1200×1600 y ya viene recomprimido por WhatsApp**, así que un
  contenedor de 896 px CSS necesita 1792 px en DPR 2 y esos píxeles no existen.

  Por eso el contenedor bajó a `max-w-2xl` (672 px): los 1200 disponibles lo cubren 1,79× en
  retina y la foto se ve nítida. Se acompaña de `quality={92}`, `widths={[1008, 1200]}` y q97 en
  el script, para no gastar el poco detalle que hay en recompresiones encadenadas (script JPEG →
  Astro WebP ya son dos).

  <!-- TODO: pedir a Camilo - el archivo original de la grupal SIN pasar por WhatsApp (enviado
       como documento, no como foto). Con más resolución la foto puede volver a max-w-4xl. -->

- **El recorte se hace en el script, no en el CSS.** El original es 3:4 y el contenedor es
  panorámico, así que `object-cover` estaba tirando más de la mitad del archivo descargado. Con
  el recorte a 3:2 previo (`recorte: { top: 560, ancho: 1200, alto: 800 }`) el mismo peso compra
  el doble de detalle en la zona que sí se ve. `top: 560` se eligió comparando tres recortes: a
  680 las cabezas quedaban cortadas.

### Recorte de retratos

El cuadrado se toma **desde el borde superior**: en una foto vertical de una persona de pie la
cara vive en el tercio superior, así que arrancar arriba es determinista y no corta caras. Dos
hallazgos:

- **`sharp.strategy.attention` se descartó.** Probado sobre estas fotos, encuadra el **torso**,
  no la cara. Una heurística que hay que verificar foto por foto no ahorra nada frente a un
  recorte explícito.
- **`SHADAY CALDERON.jpeg` llegó a 806×1600** (vertical de story, no 3:4). Desde el borde le
  cortaba el mentón. Por eso las entradas aceptan un `offsetY` opcional; ella lleva
  `offsetY: 200`. Es el único caso hoy.

---

## Destinos

| Origen                  | Destino                                                 | Dónde se ve                        |
| ----------------------- | ------------------------------------------------------- | ---------------------------------- |
| `ALIRIO ANDRADE.jpeg`   | `src/assets/images/formadores/alirio-andrade.jpg`       | Equipo · Dirección                 |
| `CAMILO ANDRADE.jpeg`   | `src/assets/images/formadores/camilo-andrade.jpg`       | Equipo · Fundador y Cuerpo técnico |
| `SHADAY CALDERON.jpeg`  | `src/assets/images/formadores/ebed-shaday-calderon.jpg` | Equipo · Fundadora                 |
| `JORGE CARRILLO.jpeg`   | `src/assets/images/formadores/jorge-carrillo.jpg`       | Equipo · Cuerpo técnico            |
| `OSCAR CARDENAS.jpeg`   | `src/assets/images/formadores/oscar-cardenas.jpg`       | Equipo · Cuerpo técnico            |
| `CRISTIAN MAESTRE.jpeg` | `src/assets/images/formadores/cristian-maestre.jpg`     | Equipo · Cuerpo técnico            |
| `img13.jpeg`            | `src/assets/images/club/equipo-cuerpo-tecnico.jpg`      | Equipo · apertura                  |
| `img11.jpeg`            | `src/assets/images/club/juego-charla-partido.jpg`       | Galería · sala 02                  |

`camilo-andrade.md` y `camilo-andrade-entrenador.md` apuntan al **mismo** archivo: Camilo aparece
dos veces a propósito desde el spec 19 (fundador y entrenador de Preinfantil). Astro deduplica el
asset, así que la foto se procesa una sola vez.

---

## Decisiones

- **Sí:** `foto` pasa a `image().optional()` en vez de seguir siendo `z.string()`. El helper
  `image()` entrega `ImageMetadata` directo; con un string habría que resolverlo a mano con
  `import.meta.glob` y `<Image>` no podría optimizarlo.
- **Sí:** `.optional()` y no obligatorio. El fallback a iniciales se conserva a propósito: el día
  que entre el entrenador de Baby, Benjamín o Juvenil (pendiente abierto) su tarjeta funciona sin
  foto en vez de romper el build.
- **Sí:** un solo `CoachAvatar.astro` para los tres bloques. `initials()` estaba duplicada
  carácter por carácter en dos archivos y el markup del avatar triplicado; era la duplicación más
  clara del directorio `sections/`.
- **Sí:** borrar `CoachCard.astro` en vez de resucitarlo. Era el único consumidor de `foto`, pero
  usaba `<img>` crudo (prohibido) y traía un placeholder SVG y una convención
  `bio.startsWith('TODO:')` que ya no se usa en ninguna parte. Lo que servía de él —foto con
  fallback— lo cumple `CoachAvatar`.
- **Sí:** las fotos del equipo van **solo** en la sección Equipo, no repartidas por la landing.
  Decisión del cliente.
- **No versionar 11 de las 17.** Las 5 de los fundadores posando en pareja (`img1`, `img2`,
  `img10`, `img15`, `img16`) y la de ambiente (`img9`) quedan fuera: el sitio le vende a padres
  que buscan escuela para sus hijos, y media docena de fotos de los dueños posando desvía el
  foco — sus retratos individuales ya están en las tarjetas de fundadores. `img12` es la misma
  escena de `img11` en plano cerrado, e `img14` (Camilo + Alirio) queda cubierta por `img13`, que
  muestra a los 6.
- **Sí:** `img11` a la sala `02 · En juego` y no a la 03. La sala 02 —«el balón de por medio,
  aquí se aprende a competir sin dejar de jugar»— tenía 4 fotos y **las 4 eran de
  entrenamiento**: no había ninguna de partido real. `img11` es justo eso (plantel con dorsales,
  arco y red al fondo, rival de amarillo, los tres entrenadores dando indicaciones). La sala 03,
  en cambio, ya tenía **tres** fotos de círculo/charla: meterla ahí habría repetido en vez de
  sumar.
- **No:** una cuarta sala «El cuerpo técnico» en la galería. Se evaluó y se descartó: las fotos
  del equipo van en la sección Equipo, y una sala de adultos en una galería que cuenta la vida de
  los niños desbalancea el conjunto.
- **No:** `sharp.strategy.attention` para el recorte de retratos. Ver arriba: elige el torso.
- **Sí:** recortar la grupal a 3:2 en el script en vez de dejar que `object-cover` lo haga en el
  navegador. Descargar píxeles que el layout descarta es peso puro; con el recorte previo el
  mismo tamaño de archivo rinde el doble de detalle donde se mira.
- **Sí:** el `width` mínimo del `srcset` en 2× el tamaño CSS, no en 1×. Es el que sirve a la
  mayoría de los visitantes; ponerlo en 1× fue el bug que costó dos rondas de correcciones.
- **Sí:** q92/q97 en el paso manual, aunque el archivo pese más en el repo. No es lo que se
  descarga: es el insumo del reencode de Astro. Ahorrar ahí no le ahorra nada al visitante y sí
  le quita detalle al WebP final.
- **Sí:** mostrar la grupal a 672 px y no a 896. Es la decisión incómoda pero correcta: con
  1200 px de fuente, agrandarla en pantalla solo reparte los mismos píxeles en más área. Se
  revisa cuando llegue el original sin comprimir.
- **No:** tocar el `foto` de `testimonios`. Es el mismo campo fantasma, pero no hay fotos de
  testimonios que conectar; cambiarlo ahora sería churn sin efecto visible.

---

## Criterios de aceptación

- [x] Las 7 tarjetas de la sección Equipo muestran el retrato de la persona, no sus iniciales.
- [x] Camilo aparece con foto en los dos bloques donde ya estaba (fundador y cuerpo técnico).
- [x] Quitar `foto:` de un markdown devuelve esa tarjeta a las iniciales sin romper el build.
- [x] La sección Equipo abre con la foto del cuerpo técnico completo y no deforma a nadie ni a
      360 px ni en desktop.
- [x] La sala `02 · En juego` de la galería muestra 5 piezas; la nueva abre en el lightbox y las
      flechas siguen cruzando de una sala a la siguiente.
- [x] Las fotos se sirven en WebP/AVIF generado por Astro, no como el `.jpg` versionado.
- [x] `initials()` existe en un solo archivo del repo (`CoachAvatar.astro`).
- [x] No queda ninguna referencia a `CoachCard` ni a `public/images/formadores/` en `src/`.
- [x] Ningún retrato versionado pasa de 75 KB; ninguna cara quedó cortada por el recorte.
- [x] La variante más chica del `srcset` de cada foto es al menos 2× su tamaño CSS, verificado
      leyendo `img.currentSrc` en el navegador (no mirando la captura).
- [x] `npm run check` en verde y ningún archivo supera 200 líneas.

---

## Riesgos

| Riesgo                                                                              | Mitigación                                                                                                                        |
| ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| El recorte cuadrado corta la cara de alguien en una foto futura con otra proporción | `RETRATOS` acepta `offsetY` por entrada y el script tiene dry-run; se revisan las salidas antes de escribir.                      |
| La foto de apertura (vertical recortada a 16/10) pierde a la gente de los extremos  | Va en `max-w-4xl`, no a ancho completo, con `object-center`. Verificado a 360 px y en desktop.                                    |
| Ocho imágenes nuevas mueven el presupuesto de Lighthouse                            | Todo entra `loading="lazy"` y below-the-fold; el LCP sigue siendo el hero. Los retratos suman ~230 KB de fuente, ~40 KB servidos. |
| `image()` en el schema rompe el build si una ruta del frontmatter no existe         | Es justamente el punto: falla en build con la ruta exacta, en vez de servir un `<img>` roto en producción.                        |
