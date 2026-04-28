# Pendientes — Chuter FC

> Archivo de referencia para retomar el proyecto. Leer al inicio de cada sesión junto con CLAUDE.md y DESING.md.

---

## Información a pedir a Camilo (cliente)

Estos datos bloquean contenido real. Están marcados como `<!-- TODO: pedir a Camilo -->` en el código.

- [ ] **Logo SVG** en alta calidad → reemplazar el logotipo textual en `src/components/layout/Logo.astro` y el placeholder en `public/logo-temp.png`
- [ ] **Ciudad y departamento exacto** de Los Algarrobillos → actualizar `LOCATION.city` y `LOCATION.region` en `src/lib/site.ts`
- [ ] **Link embed de Google Maps** de la Cancha de la Provincia → poner en variable `PUBLIC_GOOGLE_MAPS_EMBED_URL` del `.env` en Vercel; `LocationSection` lo muestra automáticamente cuando está definido
- [ ] **Confirmar horario** por categoría: ¿es el mismo para todas (Lunes/Mié/Vie 4:30-6PM) o varía? Actualizar en `src/content/programas/*.md` si difiere
- [ ] **Costo de mensualidad** → `AboutSection.astro` (línea con stats) y `ContactSection.astro`; hoy dice "Inscripción gratis" pero no muestra mensualidad
- [ ] **Logros del club** (torneos ganados, posiciones, años de trayectoria) → reemplazar los 3 stats placeholder en `src/components/sections/AboutSection.astro`
- [ ] **Bio completa de Camilo Andrade** → editar `src/content/formadores/camilo-andrade.md`, campo `bio`
- [ ] **Bio completa de Ebed Shaday Calderón** → editar `src/content/formadores/ebed-shaday-calderon.md`, campo `bio`
- [ ] **Fotos profesionales de los formadores** → poner en `public/images/formadores/camilo-andrade.jpg` y `ebed-shaday-calderon.jpg`; `CoachCard.astro` las muestra automáticamente cuando existen
- [ ] **Testimonios reales** (nombre del padre/madre, relación con el niño, texto) → reemplazar los 3 archivos en `src/content/testimonios/placeholder-*.md`. Poner `esPlaceholder: false`

---

## Variables de entorno (para Vercel)

Crear en el dashboard de Vercel → Settings → Environment Variables:

```
PUBLIC_WEB3FORMS_KEY=<clave de web3forms.com>   ← SIN esta, el form de contacto no envía
PUBLIC_GOOGLE_MAPS_EMBED_URL=<embed URL del mapa>
PUBLIC_WHATSAPP_NUMBER=573015216830              ← ya tiene fallback en código
PUBLIC_INSTAGRAM_URL=https://instagram.com/1chuter
PUBLIC_SITE_URL=https://chuterfc.vercel.app
```

Ver `.env.example` para el formato completo.

---

## Tareas técnicas pendientes

- [ ] **Obtener `WEB3FORMS_ACCESS_KEY`**: registrarse en [web3forms.com](https://web3forms.com) con el correo del cliente, copiar la key y setearla en Vercel. Sin esto el formulario de contacto muestra error silencioso.
- [ ] **Deploy a Vercel**: conectar el repo de GitHub a Vercel. El proyecto ya tiene `site: 'https://chuterfc.vercel.app'` en `astro.config.mjs`.
- [ ] **Imagen OG** (`/og-default.jpg` en `public/`): crear una imagen 1200×630px para compartir en redes. Actualmente el OG apunta a esa ruta pero no existe el archivo.
- [ ] **Favicon SVG** (`/favicon.svg`): crear o pedir el logo en formato SVG para usar como favicon. Actualmente usa el default de Astro.
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

- Todas las imágenes deben ir en `src/assets/images/` (no en `public/`) para que Astro las procese con sharp y genere WebP optimizados.
- Las categorías SIEMPRE se muestran por año de nacimiento (`nacidos: "2020 - 2021"`), nunca por edad fija.
- El número de WhatsApp está centralizado en `src/lib/whatsapp.ts` — cambiar solo ahí si cambia el número.
- El color `#25D366` del WhatsApp NO debe cambiarse (identidad de marca de WhatsApp).
- shadcn/ui (`src/components/ui/`) no tocar manualmente — usar `npx shadcn add <componente>` si se necesita algo nuevo.
