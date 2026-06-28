# 01 — Actualización de la landing page al diseño de Claude Design

- **Estado:** Implementado ✅ (2026-06-28)
- **Fecha:** 2026-06-28
- **Dependencias:** Sistema de motion existente (`src/components/motion/Reveal.astro`,
  `src/styles/motion.css`, `PageBoot.astro`), tipografías `@fontsource` ya cargadas,
  content collections de programas/formadores/testimonios.
- **Objetivo (una frase):** Actualizar la landing page existente para que coincida con
  el diseño de `references/Chuter FC - Landing.html` — agregando las secciones faltantes
  (Historia y Esencia), actualizando las secciones y el splash de boot que cambiaron, y
  migrando a las 4 categorías reales (Pony, Pre-infantil, Infantil, Prejuvenil).

---

## Alcance

### Dentro del alcance

**Secciones nuevas (no existen hoy):**
- `#historia` — Tributo a Jesús David "Chuter" (narrativa biográfica). Texto tal cual
  el diseño; foto en placeholder (cliente aún no la pasó).
- `#esencia` — Misión, visión y los 10 principios institucionales (texto real del diseño).

**Secciones existentes a actualizar para igualar el diseño:**
- `HeroSection` — ticket animado "CUPO 2026 ¡GRATIS!", badges de cancha, sello INDER
  giratorio, barra inferior con scroll-hint, headline con "campeones" en serif.
- `ProgramsSection` / `ProgramCard` — migrar de 5 a **4 categorías** (Pony,
  Pre-infantil, Infantil, Prejuvenil), markup y estilos del diseño.
- `AboutSection` (#nosotros) — manifiesto Chuter, badge INDER, contadores/stats.
- `CoachesSection` (#equipo) — cards de monograma (iniciales) para directores/profes.
- `GallerySection` — grid masonry de 7 imágenes + lightbox (ya existe).
- `LocationSection` (#ubicacion) — mapa SVG de cancha con pin animado y botones de nav.
- `ContactSection` (#contacto) — form con sugerencia de categoría por año de nacimiento.
- `TestimonialsSection` — ajustar solo estilos/markup al diseño (marquee). **El contenido
  de los testimonios NO se toca** (quedan los ficticios actuales).
- `Header` / nav / drawer móvil — items del diseño: Inicio, Programas, Nosotros, Historia,
  Equipo, Galería, Ubicación, Contacto.
- `PageBoot` — reemplazar el SVG de texto "CHUTER" por el **logo** (`chuter-logo.jpg`)
  con animación `icon-pop`.

**Datos / contenido:**
- Content collection `programas`: reemplazar los 5 archivos actuales por los 4 del diseño.
- Mantener `whatsapp.ts` / `site.ts` como única fuente de CTAs y constantes.

**Documentación:**
- Actualizar `CLAUDE.md` (tabla de categorías → 4 reales) **al final**, una vez validado
  el sitio.

### Fuera del alcance

- Fotos reales (formadores, historia, galería definitiva): siguen como placeholder con
  comentario `<!-- TODO: pedir a Camilo -->`.
- Contenido nuevo de testimonios (el cliente no lo ha enviado).
- Módulo admin (`/admin/**`), Actions, base de datos: intactos.
- Costos de mensualidad/matrícula, dirección exacta + Google Maps embed: siguen TODO.
- Reescribir el sistema de motion: se **reutiliza** el existente; solo se agregan
  keyframes/utilidades que falten.

---

## Modelo de datos

### 1. Colección `programas` — schema y contenido (CAMBIA)

**Schema (`src/content.config.ts`):** agregar campo `entrenador`.
```ts
schema: z.object({
  nombre: z.string(),
  nacidos: z.string(),
  edadAprox: z.string(),
  horario: z.string(),
  icono: z.string(),
  entrenador: z.string(),        // ← NUEVO (lo usa la card del diseño)
  descripcion: z.string(),
  color: z.enum(['navy', 'blue', 'gold']).default('navy'),
  orden: z.number(),
}),
```

**Reemplazar los 5 .md actuales por estos 4** (data exacta del diseño,
`references/Chuter FC - Landing.html` líneas 821-824):

| archivo | nombre | nacidos | edadAprox | entrenador | icono | color | orden |
|---|---|---|---|---|---|---|---|
| `pony.md` | Pony | 2019 - 2022 | 4-7 años aprox. | Jorge Carrillo | Footprints | gold | 1 |
| `preinfantil.md` | Preinfantil | 2017 - 2018 | 8-9 años aprox. | Camilo Andrade | Target | blue | 2 |
| `infantil.md` | Infantil | 2015 - 2016 | 10-11 años aprox. | Óscar Cárdenas | Trophy | navy | 3 |
| `prejuvenil.md` | Prejuvenil | 2012 - 2014 | 12-14 años aprox. | Cristian Maestre | Medal | blue | 4 |

- `horario` para los 4: `"Lunes, miércoles y viernes — 4:30 a 6:00 PM"`.
- Borrar `baby.md` y `benjamin.md`; renombrar el slug `pre-infantil` → `preinfantil`.
- Descripciones: texto exacto de las líneas 821-824 del diseño.

### 2. Colección `formadores` — contenido (CAMBIA, schema igual)

`#equipo` del diseño muestra (líneas 829-836):
- **Dirección:** Alirio Andrade — *Presidente* (nota del diseño).
- **Entrenadores (1 por categoría):** Jorge Carrillo (Pony), Camilo Andrade
  (Preinfantil, "Cofundador del club"), Óscar Cárdenas (Infantil), Cristian Maestre
  (Prejuvenil).
- Cards de **monograma** (iniciales), sin foto → `foto` queda en placeholder/vacío.
- Schema actual sirve; solo se actualiza el contenido de los .md.

### 3. Secciones nuevas — contenido estático (NO usan content collection)

`#historia` y `#esencia` son secciones únicas (one-off). Su texto vive en el
componente o en un módulo de constantes `as const`, no en una collection.

- **Historia:** narrativa de Jesús David "Chuter" (texto del diseño). Foto = placeholder.
- **Esencia:** misión, visión y **array de 10 principios** (texto real del diseño)
  como constante `PRINCIPIOS` en el componente/`src/lib/`.

### 4. Validación de categoría por año (form de contacto)

Mapa año → categoría (diseño líneas 1096-1099), usado para sugerir categoría:
```ts
[
  { label: 'Pony (nacidos 2019-2022)', years: [2019, 2020, 2021, 2022] },
  { label: 'Preinfantil (nacidos 2017-2018)', years: [2017, 2018] },
  { label: 'Infantil (nacidos 2015-2016)', years: [2015, 2016] },
  { label: 'Prejuvenil (nacidos 2012-2014)', years: [2012, 2013, 2014] },
]
```
Centralizar en `src/lib/domain/categoria.ts` (regla pura, reutilizable).

---

## Plan de implementación

Cada paso deja el sitio compilando (`npm run dev`) y desplegable.

### Paso 1 — Fundaciones de motion y boot
1. Comparar `references` vs `src/styles/motion.css`: agregar SOLO los keyframes/utilidades
   que falten (p.ej. `ticket-breathe`, `stamp-spin`, `pin-pulse`, `coach-reveal`,
   `testimonials-scroll`, `icon-pop`) sin duplicar los existentes.
2. `PageBoot.astro`: reemplazar el SVG de texto "CHUTER" por `<Image>` del logo
   (`chuter-logo.jpg`) con animación `icon-pop`. Mantener la lógica de sessionStorage.

### Paso 2 — Datos de programas (4 categorías)
3. `src/content.config.ts`: agregar `entrenador` al schema de `programas`.
4. Borrar `baby.md`, `benjamin.md`; crear/renombrar a `pony.md`, `preinfantil.md`,
   `infantil.md`, `prejuvenil.md` con la data de la tabla del modelo de datos.
5. Verificar que `ProgramsSection`/`ProgramCard` renderizan 4 cards sin romper.

### Paso 3 — Constantes y dominio
6. Crear `src/lib/domain/categoria.ts` con el mapa año→categoría (regla pura).
7. Crear constantes de Historia (`HISTORIA`) y Esencia (`PRINCIPIOS`, misión, visión)
   en `src/lib/` (o junto al componente), con el texto real del diseño.

### Paso 4 — Header / navegación
8. Actualizar items del nav y drawer móvil: Inicio, Programas, Nosotros, Historia,
   Equipo, Galería, Ubicación, Contacto (orden del diseño).

### Paso 5 — Secciones nuevas
9. Crear `HistoriaSection.astro` (#historia) con markup y motion del diseño.
10. Crear `EsenciaSection.astro` (#esencia): misión, visión y grid de 10 principios.
11. Insertar ambas en `index.astro` en el orden del diseño
    (Hero → Programas → Nosotros → Historia → Esencia → Equipo → Galería →
    Testimonios → Ubicación → Contacto).

### Paso 6 — Actualizar secciones existentes al diseño
12. `HeroSection` — ticket "CUPO 2026", badges de cancha, sello INDER, barra inferior.
13. `ProgramCard` — markup/estilos del diseño + mostrar `entrenador`.
14. `AboutSection` (#nosotros) — manifiesto, badge INDER, contadores.
15. `CoachesSection` (#equipo) — cards de monograma; actualizar `formadores/*.md`.
16. `GallerySection` — ajustar grid masonry de 7 imágenes (reusar lightbox).
17. `LocationSection` (#ubicacion) — mapa SVG con pin animado + botones de nav.
18. `ContactSection` (#contacto) — form con sugerencia de categoría (usa `categoria.ts`).
19. `TestimonialsSection` — solo ajustar markup/estilos del marquee (contenido intacto).

### Paso 7 — SEO y metadatos
20. Actualizar `<title>`/`description`/JSON-LD si cambiaron categorías y secciones
    (mencionar Pony→Prejuvenil; mantener datos del club).

### Paso 8 — Cierre y documentación
21. Revisión visual contra el HTML de referencia (desktop + mobile).
22. Actualizar la tabla de categorías en `CLAUDE.md` (4 reales).
23. `npm run check` (astro check) en verde y commits atómicos con `/commit`.

---

## Criterios de aceptación

Checklist booleano (cada ítem es verificable como sí/no):

### Boot y navegación
- [x] Al recargar por primera vez en la sesión, el splash muestra el **logo**
      (`chuter-logo.jpg`), no el texto "CHUTER".
- [x] El nav (desktop y drawer móvil) tiene exactamente: Inicio, Programas, Nosotros,
      Historia, Equipo, Galería, Ubicación, Contacto.
- [x] Todos los anchors del nav apuntan a una sección existente (sin enlaces rotos).

### Secciones nuevas
- [x] Existe la sección `#historia` con la narrativa de Jesús David "Chuter".
- [x] Existe la sección `#esencia` con misión, visión y los **10 principios**.
- [x] El orden de secciones en `index.astro` coincide con el diseño
      (Hero → Programas → Nosotros → Historia → Esencia → Equipo → Galería →
      Testimonios → Ubicación → Contacto).

### Categorías
- [x] Se muestran exactamente **4 categorías**: Pony, Preinfantil, Infantil, Prejuvenil.
- [x] No quedan referencias a Baby ni Benjamín en el sitio público.
- [x] Cada card muestra nombre, años de nacimiento, edad aprox., entrenador y CTA de
      WhatsApp con la categoría precargada.
- [x] No existen `baby.md` ni `benjamin.md` en `src/content/programas/`.

### Form de contacto
- [x] Al ingresar un año de nacimiento, el form sugiere la categoría correcta según el
      mapa de `categoria.ts` (p.ej. 2018 → Preinfantil).

### Datos y constantes
- [x] El schema de `programas` incluye `entrenador` y los 4 .md validan contra él.
- [x] El texto de los 10 principios y la historia coincide con el diseño de referencia.
- [x] Los testimonios actuales NO fueron modificados.

### Fidelidad visual y motion
- [x] El sitio usa las tipografías Bebas Neue, Plus Jakarta Sans y Fraunces.
- [x] El ticket del hero ("CUPO 2026 ¡GRATIS!"), el sello INDER y el mapa SVG con pin
      animado están presentes y animados.
- [x] Las animaciones reutilizan el sistema de motion existente (no se introdujo
      Framer Motion ni otra librería de animación).
- [x] Con `prefers-reduced-motion: reduce` las animaciones se desactivan correctamente.

### Calidad y cierre
- [x] `npm run check` (astro check) pasa sin errores.
- [x] Ningún archivo nuevo supera 200 líneas; cero `any`.
- [x] La tabla de categorías en `CLAUDE.md` quedó actualizada a las 4 reales.
- [x] El sitio se ve correctamente en mobile (≤375px) y desktop sin scroll horizontal.

---

## Decisiones tomadas y descartadas

### Tomadas

1. **Actualización incremental, no reescritura.** Se actualizan/agregan secciones sobre
   la base existente en vez de regenerar el sitio desde cero.
   *Por qué:* el sitio actual ya replica gran parte del diseño (tipografías, tokens,
   motion, parallax, lightbox); reescribir violaría DRY y tiraría trabajo válido.

2. **Reutilizar el sistema de motion existente.** Solo se agregan los keyframes/utilidades
   que falten en `motion.css`.
   *Por qué:* respeta la regla de "no duplicación" y la prohibición de librerías de
   animación pesadas (Framer Motion) del `CLAUDE.md`.

3. **Historia y Esencia como constantes, no content collections.**
   *Por qué:* son secciones únicas (one-off), no listas repetibles; una collection con un
   solo registro añade complejidad sin beneficio. Descartado: crear collections
   `historia`/`esencia`.

4. **Migrar a 4 categorías reales (Pony, Preinfantil, Infantil, Prejuvenil).** Las 5
   categorías previas (Baby…Infantil) eran data de ejemplo.
   *Por qué:* el diseño refleja la oferta real confirmada del club. Implica borrar
   `baby.md`/`benjamin.md` y renombrar el slug `pre-infantil`→`preinfantil`.

5. **Logo (imagen) en el splash de boot** en lugar del SVG de texto "CHUTER".
   *Por qué:* corrección explícita del cliente; el texto dibujado se percibía como
   "texto raro". Se conserva la lógica de sessionStorage (solo primera carga).

6. **Campo `entrenador` en el schema de `programas`.**
   *Por qué:* el diseño muestra el entrenador por categoría; centralizarlo en la
   collection evita hardcodear nombres en la UI.

7. **Mapa año→categoría como regla pura en `src/lib/domain/categoria.ts`.**
   *Por qué:* lógica de negocio fuera de la UI (regla del proyecto), testeable y
   reutilizable entre el form y las cards.

8. **Actualizar `CLAUDE.md` al final.** La tabla de categorías se corrige una vez
   validado el sitio.
   *Por qué:* evita desincronización si el alcance cambia durante la implementación.

### Descartadas

- **Tocar los testimonios.** El cliente no envió contenido real; los ficticios actuales
  quedan tal cual (fuera de alcance).
- **Fotos reales** de formadores/historia/galería: siguen como placeholder con
  `<!-- TODO: pedir a Camilo -->`.
- **Portar el JS vanilla del HTML tal cual** (scripts inline duplicando lógica):
  descartado a favor de reutilizar el motion existente (decisión 2).

---

## Riesgos identificados

1. **Rutas de imágenes inconsistentes.** El HTML de referencia apunta a
   `landing/img/*`, pero en el repo las imágenes viven en `src/assets/images/`
   (procesadas por Astro) y `public/images/`.
   - *Impacto:* imágenes rotas si se copia el markup tal cual.
   - *Mitigación:* usar `<Image>` de Astro con imports desde `src/assets/images/`;
     nunca copiar las rutas `landing/img/` literales.

2. **Renombrar slug `pre-infantil` → `preinfantil`.** Si algún CTA, ancla o enlace de
   WhatsApp referencia el nombre viejo, queda inconsistente.
   - *Mitigación:* buscar referencias a "pre-infantil"/"Pre-infantil" en todo `src/`
     antes de cerrar; el CTA usa `nombre` de la collection, no un slug hardcodeado.

3. **Drift entre las 4 categorías y datos derivados.** El mapa año→categoría
   (`categoria.ts`), el JSON-LD/SEO y `CLAUDE.md` deben reflejar las mismas 4
   categorías.
   - *Mitigación:* el criterio de aceptación verifica que no queden referencias a
     Baby/Benjamín; `categoria.ts` como única fuente del mapeo.

4. **Límite de 200 líneas por archivo.** Las secciones del diseño (Hero con ticket,
   Esencia con 10 principios, Ubicación con mapa SVG) son extensas.
   - *Mitigación:* descomponer en sub-componentes (carpeta por pantalla/sección)
     y extraer SVGs o constantes a archivos propios.

5. **`astro check` con el campo nuevo `entrenador`.** Si se agrega al schema pero falta
   en algún .md, el build falla.
   - *Mitigación:* actualizar los 4 .md y el schema en el mismo paso; correr
     `npm run check` antes de commitear.

6. **Regresión de motion / reduced-motion.** Agregar keyframes nuevos podría chocar con
   los existentes o ignorar `prefers-reduced-motion`.
   - *Mitigación:* agregar solo lo faltante, revisar nombres duplicados y verificar el
     bloque `@media (prefers-reduced-motion: reduce)` cubre las animaciones nuevas.
