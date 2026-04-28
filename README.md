# Chuter FC — Sitio Web Institucional

Sitio web del **Club Deportivo Chuter F.C.**, escuela de fútbol para niños y niñas en Los Algarrobillos, avalada por INDER. Demo gratuito de 1 mes para el cliente.

---

## Stack

- **Framework:** Astro 6 (static output)
- **Estilos:** Tailwind CSS v4 (utility-first, self-hosted)
- **Tipografía:** Bebas Neue (display) + Inter Variable (body) — self-hosted vía `@fontsource`
- **Componentes UI:** shadcn/ui radix-nova (solo en islands React)
- **Iconos:** SVG inline (Lucide paths) para componentes Astro; `lucide-react` en islands
- **Forms:** Web3Forms (no backend propio)
- **Hosting:** Vercel
- **Imágenes:** Astro Image + sharp (WebP responsive)

---

## Comandos

```bash
npm run dev       # Dev server en localhost:4321
npm run build     # Build de producción → ./dist/
npm run preview   # Preview del build en local
```

---

## Variables de entorno

Copiar `.env.example` a `.env` y completar:

```
PUBLIC_WEB3FORMS_KEY=       # Requerido para que el formulario de contacto envíe
PUBLIC_GOOGLE_MAPS_EMBED_URL=  # URL embed del mapa (opcional — muestra placeholder si está vacío)
PUBLIC_WHATSAPP_NUMBER=573015216830
PUBLIC_INSTAGRAM_URL=https://instagram.com/1chuter
PUBLIC_SITE_URL=https://chuterfc.vercel.app
```

En Vercel: Settings → Environment Variables.

---

## Estructura del proyecto

```
src/
├── assets/images/          ← Imágenes procesadas por Astro (WebP responsive)
├── components/
│   ├── ui/                 ← shadcn/ui (no editar manualmente)
│   ├── layout/             ← Header, Footer, Nav, Logo, Container, Section, etc.
│   ├── sections/           ← Hero, Programas, Nosotros, Formadores, Galería, etc.
│   └── interactive/        ← Islands React (MobileMenu, GalleryLightbox, ContactForm)
├── content/
│   ├── programas/          ← 5 categorías por año de nacimiento (.md)
│   ├── formadores/         ← Camilo Andrade + Ebed Shaday Calderón (.md)
│   └── testimonios/        ← Testimonios (3 placeholder, reemplazar con reales)
├── layouts/
│   └── BaseLayout.astro    ← Layout global: SEO + OG + JSON-LD + Header + Footer + Fab
├── lib/
│   ├── site.ts             ← Constantes del club (número, IG, horarios, NAV_LINKS)
│   ├── whatsapp.ts         ← Links WhatsApp con mensajes pre-cargados
│   └── seo.ts              ← JSON-LD SportsActivityLocation
├── styles/
│   └── global.css          ← Paleta de marca + tipografías + tokens Tailwind v4
└── content.config.ts       ← Schemas Zod de las content collections (Astro 6)
```

---

## Secciones del home (en orden)

| Anchor | Sección | Notas |
|---|---|---|
| `#inicio` | Hero | Imagen hero + "¡Inscripción Gratis!" + CTA WhatsApp |
| `#programas` | Categorías | 5 categorías por año de nacimiento — CTA WhatsApp por cada una |
| `#nosotros` | Sobre el club | Aval INDER + stats placeholder |
| `#formadores` | Formadores | Camilo + Ebed Shaday — fotos y bios pendientes |
| `#galeria` | Galería | 7 imágenes con lightbox (←/→/Esc) |
| `#testimonios` | Testimonios | Placeholder hasta recibir testimonios reales |
| `#ubicacion` | Dónde entrenamos | Cancha de la Provincia — mapa pendiente |
| `#contacto` | Contacto | WhatsApp directo + formulario Web3Forms |
| — | Footer | Redes + INDER + programas |

---

## Pendientes del cliente

Ver `.claude/pendientes.md` para la lista completa de datos que faltan confirmar con Camilo Andrade (logo, fotos, bios, logros, mapa, testimonios reales, costos de mensualidad).

---

## Decisiones de diseño

- **Paleta:** `#1B3A6B` navy (primary) + `#F5C842` gold (acento) — tokens en `global.css`
- **Tipografía:** Bebas Neue solo en H1/H2 y números grandes; Inter en todo el cuerpo
- **WhatsApp:** color exacto `#25D366` — no modificar
- **Categorías:** siempre "nacidos XXXX-XXXX", nunca edades fijas (se desactualizarían)
- **Islands React:** `client:idle` (MobileMenu), `client:visible` (Galería, Form) — no bloquean LCP
- **Imágenes:** van en `src/assets/` (no `public/`) para procesarse con Astro Image

---

## Convenciones de commits

Conventional Commits en español con emoji, usando el slash command `/commit`:
```
✨ feat(sección): descripción en imperativo
🐛 fix(componente): descripción del arreglo
🎨 style(theme): cambio visual
♻️ refactor: cambio sin impacto funcional
🚀 perf: mejora de rendimiento
```
