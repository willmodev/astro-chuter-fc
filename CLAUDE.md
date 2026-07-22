# CLAUDE.md — Chuter FC

> Contrato técnico y convenciones del proyecto. Claude Code debe leer este archivo al inicio de cada sesión y respetar todo lo que dice.

## Reglas y documentación

- **Reglas de código limpio (obligatorias):** @.claude/rules/coding-rules.md
- **Arquitectura del módulo admin:** `docs/ARCHITECTURE.md`
- **Backlog de historias de usuario (admin):** `docs/backlog.md`

---

## Contexto del proyecto

Sitio web institucional para el **Club Deportivo Chuter F.C.**, una escuela de fútbol para niños y niñas ubicada en Los Algarrobillos. El club está avalado por INDER y tiene presencia en Instagram (@1chuter).

**Hook actual de captación:** ¡Inscripción Gratis! — usar este mensaje como CTA destacado en el hero.

**Objetivo principal:** captar inscripciones nuevas y darle presencia profesional al club para que pueda crecer.

**Audiencia:** padres y madres colombianos buscando una academia de fútbol confiable para sus hijos. La mayoría llega desde el celular.

**Estrategia comercial:** el negocio con el cliente ya está **cerrado**. Esto **NO es un demo/MVP** — es un proyecto **profesional en producción**, ya vendido. El sitio está **en vivo en [chuterfc.com](https://chuterfc.com/)** (dominio propio del club, no `vercel.app`). Todo cambio debe cumplir estándar de producción.

---

## Información oficial del club (CONFIRMADA)

### Contacto
- **Teléfono / WhatsApp:** 300 872 5964
- **Formato internacional WhatsApp:** `573008725964`
- **Email:** olimak8@hotmail.com
- **Instagram:** [@1chuter](https://instagram.com/1chuter)

### Ubicación
- **Cancha principal:** Cancha Los Algarrobillos
- **Cancha secundaria:** Cancha del 12 de Octubre
- **Sector:** Los Algarrobillos
- *(Dirección exacta y link de Google Maps embed pendientes de confirmar con el dueño)*

### Horarios
- **Días:** Lunes, miércoles y viernes
- **Hora:** 4:30 PM a 6:00 PM
- *(Confirmar si hay diferencias por categoría)*

### Categorías por año de nacimiento

> Importante: el sitio mostrará SIEMPRE las categorías por año de nacimiento (no por edad fija), porque las edades cambian cada año y el contenido se desactualizaría.

| Categoría | Nacidos en | Edad aprox. | Entrenador |
|---|---|---|---|
| **Pony** | 2019 - 2022 | 4-7 años | Jorge Carrillo |
| **Preinfantil** | 2017 - 2018 | 8-9 años | Camilo Andrade |
| **Infantil** | 2015 - 2016 | 10-11 años | Óscar Cárdenas |
| **Prejuvenil** | 2012 - 2014 | 12-14 años | Cristian Maestre |

### Promoción actual
- **Inscripción gratis** (destacar en hero como hook principal)

### Aval institucional
- Reconocimiento Deportivo otorgado por **INDER**

### Liderazgo
- **CEO:** Camilo Andrade ([@camilo8andrade](https://instagram.com/camilo8andrade))
- **CEO:** Ebed Shaday Calderón ([@ebedshadaycalderon](https://instagram.com/ebedshadaycalderon))

---

## Stack tecnológico

- **Framework:** Astro 6
- **Lenguaje:** TypeScript con `strict: true`
- **Estilos:** Tailwind CSS v4
- **Componentes UI:** shadcn/ui (preset Nova / Radix) — solo en islands React cuando hay interactividad real
- **Iconos:** `lucide-astro` (y `lucide-react` para islands)
- **Forms:** Astro Action (`enviarContacto`) + **Resend** (correo branded desde el dominio propio). El envío corre en una función server on-demand vía adapter `@astrojs/vercel`; las páginas siguen estáticas.
- **Hosting:** Vercel
- **Analytics:** Vercel Analytics (gratis)

---

## Estructura del proyecto

```
src/
├── components/
│   ├── ui/                    ← shadcn (no tocar manualmente)
│   ├── sections/              ← Hero, About, Programs, etc. (.astro)
│   ├── layout/                ← Header, Footer, Nav (.astro)
│   └── interactive/           ← Solo islands React (Form, MobileMenu)
├── content/
│   ├── programas/             ← Markdown por categoría de edad
│   ├── testimonios/           ← Markdown por testimonio
│   └── formadores/            ← Markdown por entrenador
├── layouts/
│   └── BaseLayout.astro       ← Layout principal con SEO
├── lib/
│   └── utils.ts               ← cn() y helpers
├── pages/
│   ├── index.astro            ← Home single-page con anchors
│   └── inscripcion.astro      ← Form completo (opcional)
├── styles/
│   └── global.css             ← Tailwind + tokens custom
└── assets/
    └── images/                ← Imágenes procesadas por Astro
```

---

## Content Collections — Schemas obligatorios

Crear `src/content/config.ts` con los siguientes schemas Zod:

### Programas (categorías)
```ts
const programasCollection = defineCollection({
  type: 'content',
  schema: z.object({
    nombre: z.string(),               // "Baby", "Pony", "Benjamín", etc.
    nacidos: z.string(),              // "2020 - 2021"
    edadAprox: z.string(),            // "5-6 años aprox."
    horario: z.string(),              // "Lunes, miércoles y viernes - 4:30 a 6:00 PM"
    icono: z.string(),                // nombre de icono Lucide
    descripcion: z.string(),
    color: z.enum(['navy', 'blue', 'gold']).default('navy'),
    orden: z.number(),
  }),
});
```

### Crear los 5 archivos de programas con esta data exacta:

**`src/content/programas/baby.md`**
```markdown
---
nombre: "Baby"
nacidos: "2020 - 2021"
edadAprox: "5-6 años aprox."
horario: "Lunes, miércoles y viernes — 4:30 a 6:00 PM"
icono: "Baby"
descripcion: "Primeros pasos en el fútbol con énfasis en juego, coordinación y diversión."
color: "gold"
orden: 1
---
```

**`src/content/programas/pony.md`**
```markdown
---
nombre: "Pony"
nacidos: "2018 - 2019"
edadAprox: "7-8 años aprox."
horario: "Lunes, miércoles y viernes — 4:30 a 6:00 PM"
icono: "Footprints"
descripcion: "Desarrollo de habilidades técnicas básicas, control del balón y trabajo en equipo."
color: "blue"
orden: 2
---
```

**`src/content/programas/benjamin.md`**
```markdown
---
nombre: "Benjamín"
nacidos: "2016 - 2017"
edadAprox: "9-10 años aprox."
horario: "Lunes, miércoles y viernes — 4:30 a 6:00 PM"
icono: "Target"
descripcion: "Fundamentos técnicos avanzados, posiciones de juego y disciplina deportiva."
color: "navy"
orden: 3
---
```

**`src/content/programas/pre-infantil.md`**
```markdown
---
nombre: "Pre-infantil"
nacidos: "2014 - 2015"
edadAprox: "11-12 años aprox."
horario: "Lunes, miércoles y viernes — 4:30 a 6:00 PM"
icono: "Trophy"
descripcion: "Tácticas de equipo, preparación física y participación en torneos locales."
color: "blue"
orden: 4
---
```

**`src/content/programas/infantil.md`**
```markdown
---
nombre: "Infantil"
nacidos: "2012 - 2013"
edadAprox: "13-14 años aprox."
horario: "Lunes, miércoles y viernes — 4:30 a 6:00 PM"
icono: "Medal"
descripcion: "Alto rendimiento, competencia formal y preparación para etapas siguientes."
color: "navy"
orden: 5
---
```

### Formadores
```ts
const formadoresCollection = defineCollection({
  type: 'content',
  schema: z.object({
    nombre: z.string(),
    rol: z.string(),                  // "CEO y Director Técnico"
    bio: z.string(),
    foto: z.string(),
    instagram: z.string().optional(),
    orden: z.number(),
  }),
});
```

Crear inicialmente:
- `formadores/camilo-andrade.md` (CEO, instagram: camilo8andrade)
- `formadores/ebed-shaday-calderon.md` (CEO, instagram: ebedshadaycalderon)

### Testimonios
```ts
const testimoniosCollection = defineCollection({
  type: 'content',
  schema: z.object({
    autor: z.string(),
    relacion: z.string(),             // "Mamá de Mateo, 8 años"
    texto: z.string(),
    foto: z.string().optional(),
    orden: z.number(),
  }),
});
```

Para testimonios usar placeholder hasta que llegue la data real, marcado claramente.

---

## Convenciones de código

### TypeScript
- `strict: true` siempre
- **Cero `any`.** Si toca, justificar con comentario `// any necesario porque…`
- Tipos explícitos en props de componentes Astro:
  ```astro
  ---
  interface Props {
    title: string;
    subtitle?: string;
  }
  const { title, subtitle } = Astro.props;
  ---
  ```

### Componentes
- **`.astro` por defecto** para todo lo estático
- **`.tsx` solo si hay interactividad real** (form, menú móvil, dialog, carrusel controlado)
- Nombres en **PascalCase** para componentes
- Un componente por archivo
- Props desestructuradas, no `props.algo`

### Imports
- Alias `@/*` apuntando a `src/*` (ya configurado en `tsconfig.json`)
- Orden de imports:
  1. Librerías externas
  2. Componentes con alias `@/`
  3. Estilos
  4. Tipos al final

### Estilos
- **Tailwind utility-first.** No CSS modules ni styled-components.
- Si una clase se repite mucho, abstraer a componente, no a CSS.
- Tokens de marca solo desde `global.css`, nunca hardcodear hex en componentes.
- Mobile-first: clase base es mobile, modificadores son `md:` y `lg:`.

### Naming
- Archivos de páginas en `kebab-case` (`inscripcion.astro`)
- Componentes en `PascalCase` (`HeroSection.astro`)
- Variables y funciones en `camelCase`
- Constantes globales en `UPPER_SNAKE_CASE`

---

## Convenciones de commits

**Conventional Commits en español con emoji** (ya tengo configurado el slash command `/commit` que respeta esto).

Ejemplos:
- `✨ feat: agregar sección hero con imagen de fondo`
- `🐛 fix: corregir botón de WhatsApp en mobile`
- `💄 style: ajustar paleta del card de programa`
- `♻️ refactor: extraer lógica de form a hook`
- `📝 docs: actualizar README con instrucciones de deploy`
- `🚀 perf: optimizar imágenes del hero`
- `♿ a11y: agregar focus-visible a botones`

**Reglas:**
- Commits atómicos (un cambio lógico por commit)
- En español, siempre
- NUNCA `git add .` masivo — revisar archivos antes
- NUNCA hacer commit con archivos pendientes de revisión

---

## Performance budget

Métricas obligatorias en Lighthouse mobile (Slow 4G):
- **Performance:** 95+
- **Accessibility:** 100
- **Best Practices:** 100
- **SEO:** 100

Targets específicos:
- **LCP** (Largest Contentful Paint): < 1.5s
- **CLS** (Cumulative Layout Shift): < 0.05
- **JS bundle inicial:** < 50KB

**Tácticas obligatorias:**
- `<Image>` de Astro para todas las imágenes
- `loading="lazy"` en imágenes below-the-fold
- `fetchpriority="high"` solo en imagen del hero
- Fonts con `display: swap`
- Preconnect a Google Fonts
- Tailwind purga clases no usadas (default en v4)

---

## SEO obligatorio

- `<title>` único por página, formato: "Sección | Chuter FC"
- `<meta name="description">` única, 150-160 caracteres
- `<meta property="og:*">` completos (title, description, image, url, type)
- `<meta name="twitter:card" content="summary_large_image">`
- `<link rel="canonical">` en cada página
- `sitemap.xml` automático con `@astrojs/sitemap`
- `robots.txt` permitiendo todo
- **JSON-LD Schema.org tipo `SportsActivityLocation`** con datos del club:
  - Nombre: "Club Deportivo Chuter F.C."
  - Teléfono: +57 300 872 5964
  - Email: olimak8@hotmail.com
  - Dirección: Cancha Los Algarrobillos, Los Algarrobillos
  - URL del logo, fotos
  - `description` mencionando aval INDER
  - `openingHours`: `Mo,We,Fr 16:30-18:00`

---

## CTAs y mensajes pre-cargados de WhatsApp

El número siempre debe linkear con un mensaje pre-cargado para facilitar la conversión:

**Hero principal:**
```
https://wa.me/573008725964?text=Hola%20Chuter%20FC%2C%20quiero%20información%20para%20inscribir%20a%20mi%20hijo
```

**Card de categoría específica:**
```
https://wa.me/573008725964?text=Hola%20Chuter%20FC%2C%20quiero%20inscribir%20a%20mi%20hijo%20en%20la%20categoría%20{NOMBRE_CATEGORIA}
```

**Botón flotante:**
```
https://wa.me/573008725964?text=Hola%20Chuter%20FC
```

Centralizar la lógica en `src/lib/whatsapp.ts` con una función helper.

---

## Cosas que NO hacer

❌ Instalar librerías pesadas sin justificación (no MUI, no Bootstrap, no Framer Motion)
❌ Usar `<img>` HTML directo (siempre `<Image>` de Astro)
❌ Hardcodear textos en componentes (van a content collections o constantes)
❌ Crear componentes React si pueden ser Astro
❌ Hacer commit con `git add .` sin revisar
❌ Inventar contenido que no esté en este archivo o me pase yo (Will)
❌ Cambiar la paleta de colores sin avisarme
❌ Agregar dependencias sin preguntar
❌ Hacer cambios masivos sin plan previo aprobado por mí
❌ Asumir información del cliente — para datos faltantes usar `<!-- TODO: pedir a Camilo -->`
❌ **Mostrar edades fijas** en lugar de "nacidos en {año}-{año}" (las categorías son por año de nacimiento)
❌ Replicar el typo "INFALTIL" del flyer original — el sitio debe decir "Infantil" bien escrito (esto justamente le muestra valor al cliente)

---

## Flujo de trabajo con Claude Code

1. **Antes de codear nada nuevo**, mostrarme un plan en chat.
2. **Implementar en iteraciones pequeñas**, no todo de una.
3. **Hacer commit después de cada sección importante** con `/commit`.
4. **Probar visualmente** con `npm run dev` antes de avanzar.
5. **Si algo falla**, NO insistir 5 veces con la misma estrategia — pausar y preguntarme.

---

## Información pendiente del cliente

Estos son los TODOs que aún tengo que conseguir y que Claude Code debe respetar como placeholders:

- [ ] Logo SVG en alta calidad (mientras tanto usar el PNG en `/public/logo-temp.png`)
- [x] Costos confirmados (cliente, 2026-07-10): mensualidad **$50.000 COP/jugador sin descuento por hermanos**; uniforme **$100.000 COP** ($80.000 c/u si son hermanos); inscripción gratis. El descuento de hermanos es del **uniforme**, no de la mensualidad.
- [ ] Dirección exacta de la Cancha Los Algarrobillos + link de Google Maps embed
- [ ] Confirmar si el horario es uniforme para todas las categorías o varía
- [ ] Testimonios reales (nombre del padre/madre + texto + foto opcional)
- [ ] Logros del club (torneos, posiciones, años)
- [ ] Bios completas de Camilo Andrade y Ebed Shaday Calderón
- [ ] Fotos profesionales de los formadores

Para cualquier dato no provisto, usar texto placeholder y marcar con comentario:
```html
<!-- TODO: pedir a Camilo - costo mensualidad -->
<p>Mensualidad desde $XX.XXX COP</p>
```

---

## Variables de entorno

`.env.example` es plantilla versionada: solo **nombres** de variables con valor **vacío** (nunca
data real). Los valores reales van en `.env` (gitignored) y en el panel de Vercel.
```
PUBLIC_WHATSAPP_NUMBER=
PUBLIC_CONTACT_EMAIL=
PUBLIC_GOOGLE_MAPS_EMBED_URL=
PUBLIC_INSTAGRAM_URL=
PUBLIC_SITE_URL=

# Correo del formulario (Resend) — server-only, NUNCA con prefijo PUBLIC_
RESEND_API_KEY=
CONTACT_EMAIL_FROM=               # remitente del dominio verificado, ej. Chuter FC <inscripciones@chuterfc.com>
CONTACT_EMAIL_TO=                 # bandeja del club, ej. olimak8@hotmail.com

# Módulo admin (server-only, NUNCA con prefijo PUBLIC_)
DATABASE_URL=                      # Neon Postgres (cadena pooled)
BETTER_AUTH_SECRET=                # secreto largo aleatorio
BETTER_AUTH_URL=https://chuterfc.com
BLOB_READ_WRITE_TOKEN=             # Vercel Blob (imagen de la parte central de entrenos, spec 13)
```

Valores públicos reales (en `.env` / Vercel): `PUBLIC_WHATSAPP_NUMBER=573008725964`,
`PUBLIC_CONTACT_EMAIL=olimak8@hotmail.com`, `PUBLIC_SITE_URL=https://chuterfc.com`.
Las que empiezan con `PUBLIC_` son accesibles desde el cliente. Las otras solo en server.

---

## Módulo de Administración (back-office)

Panel interno mobile-first para gestionar alumnos, cartera/cobros, uniformes y entrenamientos. Es **interactivo y con datos persistentes** — distinto del sitio público estático.

- **Backlog (historias de usuario):** `docs/backlog.md` · **Arquitectura:** `docs/ARCHITECTURE.md`.
- **Stack admin:** Neon (Postgres) + Drizzle ORM + Better Auth + Astro Actions + adapter `@astrojs/vercel`.
- **Estático por defecto:** el marketing NO cambia. Solo `/admin/**`, `/api/**` y Actions usan `export const prerender = false`. No usar `output: 'server'`.
- **Ruta `/admin`** privada y `noindex` (meta + `robots.txt` + filtro de sitemap). Auth solo para los 2 admins (Camilo, Ebed); sin registro público.
- **Capas (clean code):** UI en `src/features/admin/` (solo `.tsx`); reglas de negocio puras en `src/lib/domain/`; queries en `src/lib/db/repos/`; orquestación en `src/lib/services/`; RPC en `src/actions/`. Nunca lógica de negocio en componentes/actions.
- **Estilos:** tokens del design system del admin scopeados bajo `.admin-app` (aislados del sitio público); fidelidad pixel-perfect al prototipo.
- **Reglas de código limpio** (200 líneas/archivo, SRP, cero `any`, etc.): @.claude/rules/coding-rules.md — aplican aquí estrictamente.