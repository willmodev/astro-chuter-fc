# DESIGN.md — Chuter FC

> Sistema de diseño y guía visual para el sitio del Club Deportivo Chuter F.C.
> Este archivo es la fuente de verdad para todas las decisiones visuales del proyecto.

---

## 1. Identidad de marca

**Nombre:** Club Deportivo Chuter F.C.
**Tagline propuesto:** *"Formando campeones dentro y fuera de la cancha"*

**Tono de voz:**
- Cercano y motivador (le hablamos a padres colombianos)
- Profesional pero no acartonado
- Orgulloso del barrio y del club

**Personalidad de marca:**
- Disciplina deportiva + alegría infantil + orgullo de comunidad
- Inspirador, no aspiracional vacío
- Confiable: somos avalados por INDER

**Lo que NO somos:**
- Un sitio corporativo frío
- Una academia genérica con stock photos
- Un sitio "premium" inalcanzable — somos del barrio

---

## 2. Paleta de colores

Extraída del logo del escudo (azul marino + ancla dorada + alas).

### Colores principales
```css
--brand-navy:        #1B3A6B;  /* Azul marino del escudo - color base */
--brand-navy-deep:   #0F2647;  /* Azul más oscuro para contraste */
--brand-blue:        #4A90E2;  /* Azul cielo de los uniformes */
--brand-gold:        #F5C842;  /* Dorado de las alas - color acento */
--brand-gold-deep:   #D4A82A;  /* Dorado oscuro para hover */
```

### Neutrales
```css
--neutral-950:       #0A0F1A;  /* Casi negro, fondos hero */
--neutral-900:       #0F1B2D;  /* Texto principal sobre claro */
--neutral-700:       #334155;  /* Texto secundario */
--neutral-500:       #64748B;  /* Texto terciario / placeholders */
--neutral-300:       #CBD5E1;  /* Bordes */
--neutral-100:       #F1F5F9;  /* Fondos suaves */
--neutral-50:        #F8FAFC;  /* Fondo base claro */
--white:             #FFFFFF;
```

### Funcionales
```css
--success:           #10B981;  /* Confirmaciones */
--whatsapp:          #25D366;  /* Botón WhatsApp obligatorio este color */
--error:             #EF4444;  /* Errores en form */
```

### Mapeo a tokens de shadcn
Sobreescribir en `src/styles/global.css` los CSS variables de shadcn:
- `--primary` → `--brand-navy`
- `--primary-foreground` → `--white`
- `--accent` → `--brand-gold`
- `--accent-foreground` → `--neutral-900`
- `--background` → `--neutral-50`
- `--foreground` → `--neutral-900`

---

## 3. Tipografía

**Display (titulares grandes):** **Bebas Neue**
- Carácter deportivo, condensada
- Solo para H1, H2 y números grandes (estadísticas)
- Siempre en mayúsculas
- `font-weight: 400` (única que tiene)

**Body (todo lo demás):** **Inter**
- Legible, neutra, multiplataforma
- Pesos: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)

**Acento opcional para citas/testimonios:** **Plus Jakarta Sans** italic — solo si se necesita diferenciar.

### Escala tipográfica (mobile → desktop)
| Token | Tamaño | Uso |
|---|---|---|
| `text-hero` | 48px → 80px | H1 del hero |
| `text-display` | 36px → 56px | Títulos de sección |
| `text-h2` | 28px → 36px | Subtítulos |
| `text-h3` | 22px → 28px | Cards, subsecciones |
| `text-lg` | 18px | Lead paragraphs |
| `text-base` | 16px | Body por defecto |
| `text-sm` | 14px | Metadata, captions |
| `text-xs` | 12px | Labels, footer |

### Importación
En el layout base, importar de Google Fonts:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

---

## 4. Sistema de espaciado

Múltiplos de 4px (Tailwind default).

**Padding vertical de secciones:**
- Mobile: `py-16` (64px)
- Desktop: `py-24` o `py-32` (96-128px)

**Container max-width:** `max-w-7xl` (1280px) con `px-4 md:px-6 lg:px-8`.

**Gap entre cards:** `gap-6` mobile, `gap-8` desktop.

---

## 5. Componentes clave

### Hero
- Imagen full-bleed (foto de niños entrenando)
- Overlay azul navy con `bg-brand-navy/70`
- H1 en Bebas Neue blanco
- Subtítulo en Inter blanco con `opacity-90`
- CTA primario dorado + CTA secundario outline blanco
- Mínimo `min-h-[80vh]` desktop, `min-h-[70vh]` mobile

### Card de programa (categorías por edad)
- Fondo `bg-white`, borde `border border-neutral-200`
- Border radius `rounded-2xl`
- Padding `p-6 md:p-8`
- Hover: `hover:shadow-xl hover:-translate-y-1 transition`
- Icono Lucide arriba, en círculo dorado de fondo
- Título en Bebas Neue, body en Inter

### Botón primario (CTA)
- Fondo `bg-brand-gold`
- Texto `text-neutral-900` en `font-semibold`
- Padding `px-8 py-4`
- Border radius `rounded-full`
- Hover: `hover:bg-brand-gold-deep`
- Sombra sutil: `shadow-lg shadow-brand-gold/30`

### Botón secundario (outline)
- Borde `border-2 border-brand-navy`
- Texto `text-brand-navy`
- Hover: invierte (fondo navy, texto blanco)

### Botón WhatsApp flotante
- Fixed bottom-right (`bottom-6 right-6`)
- Color `bg-[#25D366]` exacto (NO cambiar)
- Icono WhatsApp de Lucide
- Tamaño `w-14 h-14` con tooltip al hover
- z-index alto (`z-50`)
- Aria-label descriptivo

### Sección de testimonios
- Fondo `bg-brand-navy` (sección oscura)
- Cards blancas con foto del padre/madre + cita
- Quote en Plus Jakarta Sans italic
- Estrellas opcionales en dorado

### Footer
- Fondo `bg-neutral-950`
- Logo en blanco arriba
- Tres columnas: Contacto · Programas · Síguenos
- Badge INDER visible
- Copyright + créditos al final

---

## 6. Iconografía

**Librería única:** `lucide-astro` (también disponible como `lucide-react` para islands).

**Iconos clave para este proyecto:**
- `Trophy` — logros
- `Users` — comunidad / formadores
- `Calendar` — horarios
- `MapPin` — ubicación
- `Phone`, `MessageCircle` — contacto
- `Instagram`, `Facebook` — redes
- `ChevronRight`, `ArrowRight` — navegación
- `Star` — testimonios
- `Shield` — INDER / aval

**Tamaños estándar:** 20px en línea con texto, 24px en botones, 32px+ en features destacados.

**Stroke:** `stroke-width: 1.5` por defecto (look más moderno que el 2 default).

---

## 7. Imágenes

### Reglas de aspecto
- **4:5 (vertical):** retratos de niños, formadores individuales
- **16:9 (horizontal):** entrenamientos grupales, cancha
- **1:1 (cuadrado):** thumbnails de redes, grid de galería

### Optimización
- Formato: **WebP** siempre (con fallback JPG si Astro lo genera)
- Tamaño máximo: **200KB por imagen**
- `loading="lazy"` excepto la del hero (que va con `fetchpriority="high"`)
- Usar componente `<Image>` de Astro, NUNCA `<img>` directo

### Alt text
- Descriptivo y útil, no genérico
- ❌ "imagen 1", "foto de niño"
- ✅ "Niño de 8 años haciendo dribling en entrenamiento de Chuter FC"

### Tratamiento visual
- En la galería, hover con `brightness-110` y `scale-105` suave
- En cards, ratio fijo con `object-cover`

---

## 8. Accesibilidad (WCAG AA mínimo)

- **Contraste:** mínimo 4.5:1 en todo texto. Validar dorado sobre blanco (puede no pasar — usar `--brand-gold-deep` si es necesario).
- **Foco visible:** todos los interactivos con `focus-visible:ring-2 ring-brand-gold ring-offset-2`.
- **Navegación por teclado:** menú móvil debe cerrarse con `Esc`.
- **Forms:** labels visibles siempre, `aria-describedby` para mensajes de error.
- **Imágenes:** alt text en todas. Decorativas con `alt=""`.
- **Idioma:** `<html lang="es">` obligatorio.
- **Motion:** respetar `prefers-reduced-motion` desactivando animaciones de scroll.

---

## 9. Responsive

**Mobile-first siempre.** Diseñar primero para 380px, luego ampliar.

**Breakpoints (Tailwind defaults):**
- `sm:` 640px
- `md:` 768px (tablet)
- `lg:` 1024px (desktop)
- `xl:` 1280px (desktop grande)

**Cambios clave por breakpoint:**
- Mobile: stack vertical, menú hamburguesa, CTAs full-width
- Tablet: 2 columnas en grids, menú aún hamburguesa
- Desktop: 3-4 columnas, menú horizontal, hero más alto

---

## 10. Animaciones

**Filosofía:** sutiles y con propósito. Cero animaciones decorativas innecesarias.

**Permitidas:**
- Fade-in al entrar en viewport (con `prefers-reduced-motion` respetado)
- Hover transitions de 150-200ms en botones y cards
- Smooth scroll en anchors del menú

**Prohibidas:**
- Parallax exagerado
- Auto-play de carruseles sin control
- Gradientes animados
- Efectos "chunky" tipo blob morado/rosa

**Librería si se necesita algo:** `astro-animate` o CSS puro con `@keyframes`. Nunca importar Framer Motion para este proyecto (overkill).

---

## 11. Inspiración visual

**Sí:**
- Look deportivo tipo Nike/Adidas adaptado a contexto local
- Energía, movimiento, fotos reales
- Tipografía deportiva condensada para titulares
- Mucho azul navy + acentos dorados puntuales

**No:**
- Gradientes morado/rosa genéricos de IA
- Glassmorphism abusivo
- Stock photos de niños rubios que no son del público
- Diseños "premium agencia" que no comunican calidez de barrio

---

## 12. Anti-patrones a evitar

- ❌ Headers gigantes en mobile que tapan medio viewport
- ❌ Carruseles automáticos sin pausa
- ❌ Modales que aparecen sin acción del usuario
- ❌ Pop-up de "suscríbete al newsletter"
- ❌ Cookie banner intrusivo (usar solo si toca por ley)
- ❌ Botones fantasma con bajo contraste
- ❌ Texto blanco sobre fondo blanco con overlay débil
- ❌ Iconos de librerías mezcladas (solo Lucide)