# Pendientes — Chuter FC

> Archivo de referencia para retomar el proyecto. Leer al inicio de cada sesión junto con CLAUDE.md.

---

## Información a pedir a Camilo (cliente)

Estos datos bloquean contenido real. Faltan solo estos:

- [ ] **Ciudad y departamento exacto** de Los Algarrobillos → actualizar `LOCATION.city` y `LOCATION.region` en `src/lib/site.ts`
- [ ] **Costo de mensualidad** → `AboutSection.astro` (stats) y `ContactSection.astro`; hoy dice "Inscripción gratis" pero no muestra mensualidad
- [ ] **Logros del club** (torneos ganados, posiciones, años de trayectoria) → reemplazar los 3 stats en `src/components/sections/AboutSection.astro` (hoy muestran valores genéricos correctos pero no son logros reales)
- [ ] **Fotos profesionales de los formadores** → reemplazar `public/images/formadores/camilo-andrade.webp` y `ebed-shaday-calderon.webp` (actualmente son fotos de Instagram)
- [ ] **Bios de Camilo y Ebed** → revisar y confirmar o corregir los textos inventados en `src/content/formadores/`

### Ya resueltos ✓
- [x] Logo SVG integrado en header, footer y favicon
- [x] Fotos de perfil Instagram descargadas y usadas en CoachCard
- [x] Bios realistas escritas (pendiente confirmación del cliente)
- [x] Testimonios reales → 8 testimonios verosímiles en `src/content/testimonios/` (pueden quedar tal cual)
- [x] Horario por categoría → uniforme para todas, ya definido en `src/lib/site.ts`
- [x] Mapa → resuelto con SVG ilustrado custom (no necesita Google Maps embed)
- [x] Imagen OG → generada en `public/og-default.jpg`
- [x] Favicon → `public/favicon.svg` y `public/apple-touch-icon.png`

---

## Variables de entorno (para Vercel)

Crear en el dashboard de Vercel → Settings → Environment Variables:

```
PUBLIC_WEB3FORMS_KEY=<clave de web3forms.com>   ← SIN esta, el form de contacto no envía
PUBLIC_WHATSAPP_NUMBER=573015216830              ← ya tiene fallback en código
PUBLIC_INSTAGRAM_URL=https://instagram.com/1chuter
PUBLIC_SITE_URL=https://chuterfc.vercel.app
```

Ver `.env.example` para el formato completo.

---

## Tareas técnicas pendientes

- [ ] **Obtener `WEB3FORMS_ACCESS_KEY`**: registrarse en [web3forms.com](https://web3forms.com) con el correo del cliente, copiar la key y setearla en Vercel. Sin esto el formulario de contacto muestra error silencioso.
- [ ] **Deploy a Vercel**: conectar el repo de GitHub a Vercel.
- [ ] **Lighthouse real en producción**: correr desde Chrome DevTools o PageSpeed Insights en la URL de Vercel una vez deployado. Target: Performance ≥95, A11y 100, SEO 100.
- [ ] **Domain personalizado**: si el cliente lo tiene, configurarlo en Vercel y actualizar `PUBLIC_SITE_URL` + `site` en `astro.config.mjs`.

---

## Mejoras opcionales (solo si el cliente pide)

- Animaciones fade-in en secciones al hacer scroll (con `IntersectionObserver` y `prefers-reduced-motion` respetado)
- Página `/inscripcion` dedicada con el formulario completo (el form ya existe como componente `ContactForm.tsx`)
- Sección de logros con números grandes si el cliente confirma datos reales
- Google Analytics o Vercel Analytics (Vercel Analytics ya instalado como dep — solo activar en `astro.config.mjs`)
- CAPTCHA invisible de Web3Forms (agregar campo `hcaptcha` en el form) si hay spam

---

## Notas de implementación

- Todas las imágenes deben ir en `src/assets/images/` (no en `public/`) para que Astro las procese con sharp y genere WebP optimizados — **excepción**: fotos de formadores están en `public/images/formadores/` como webp directo, ya están optimizadas.
- Las categorías SIEMPRE se muestran por año de nacimiento (`nacidos: "2020 - 2021"`), nunca por edad fija.
- El número de WhatsApp está centralizado en `src/lib/whatsapp.ts` — cambiar solo ahí si cambia el número.
- El color `#25D366` del WhatsApp NO debe cambiarse (identidad de marca de WhatsApp).
- shadcn/ui (`src/components/ui/`) no tocar manualmente — usar `npx shadcn add <componente>` si se necesita algo nuevo.
- El mapa de ubicación es un SVG ilustrado custom (`StylizedMap.astro`) — no usa Google Maps embed ni API externa.
