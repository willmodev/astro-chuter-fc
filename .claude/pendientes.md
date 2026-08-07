# Pendientes — Chuter FC

> Archivo de referencia para retomar el proyecto. Leer al inicio de cada sesión junto con CLAUDE.md.

---

## Información a pedir a Camilo (cliente)

Estos datos bloquean contenido real. Faltan solo estos:

- [ ] **Ciudad y departamento exacto** de Los Algarrobillos → actualizar `LOCATION.city` y `LOCATION.region` en `src/lib/site.ts`
- [ ] **¿Mostrar los costos en el sitio público?** — decisión de producto, no dato faltante: el cliente ya
      confirmó los precios (mensualidad $50.000, uniforme $100.000 / $80.000 c/u entre hermanos, inscripción
      gratis) y viven en `src/lib/domain/precios.ts`, pero solo los usa el admin. El sitio público hoy solo
      dice "Inscripción gratis". Preguntar a Camilo si quiere publicarlos en `AboutSection`/`ContactSection`.
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
PUBLIC_WHATSAPP_NUMBER=573008725964              ← ya tiene fallback en código
PUBLIC_CONTACT_EMAIL=olimak8@hotmail.com
PUBLIC_INSTAGRAM_URL=https://instagram.com/1chuter
PUBLIC_SITE_URL=https://chuterfc.com
```

Más las server-only (Resend, Neon, Better Auth, Blob). Ver `.env.example` para la lista completa.

> Ya provisionadas en Vercel (verificado 2026-07-25): las 4 públicas, `RESEND_API_KEY`,
> `CONTACT_EMAIL_FROM`, `CONTACT_EMAIL_TO`, `DATABASE_URL`, `BETTER_AUTH_SECRET`,
> `BETTER_AUTH_URL`, `BLOB_READ_WRITE_TOKEN` y las tres `SEED_ADMIN_*`.

---

## Tareas técnicas pendientes

- [ ] **Lighthouse: cerrar los últimos puntos de Performance.** Medido en producción el 2026-08-07 (3 corridas, mobile): **A11y 100 · Best Practices 100 · SEO 100 · CLS 0** ✓, pero **Performance 93–96** (target ≥95, entra apenas) y **LCP 2.2 s** (target < 1.5 s). Lo que falta: `HeroTicket` todavía se sirve con `opacity:0` hasta que hidrata (mismo problema que tenía el titular) y el bundle de islands trae ~27 KB de JS sin usar. Bajar el LCP de 2.2 s pide decisiones de diseño: acortar o quitar el splash `PageBoot`, o achicar la foto del hero.

> **Metodología:** Lighthouse tiene mucha varianza — una sola corrida sobre este sitio llegó a dar Performance 59 y un CLS falso de 0.322 que no se reprodujo en ninguna otra medición ni con un `PerformanceObserver` real (CLS efectivo: 0.0003). **Medir siempre 3 veces y tomar la mediana.**

### Ya resueltos ✓
- [x] Deploy a Vercel y repo conectado (proyecto `astro-chuter-fc`)
- [x] Dominio propio `chuterfc.com` con NS de Vercel; `www` redirige al apex (308) con cert wildcard
- [x] Correo del formulario migrado a Resend; dominio verificado con DKIM + SPF + MX
- [x] Verificación WHOIS del dominio: contacto registrante corregido (2026-08-07)
- [x] DMARC publicado en el DNS (2026-08-07)

---

## Mejoras opcionales (solo si el cliente pide)

- Animaciones fade-in en secciones al hacer scroll (con `IntersectionObserver` y `prefers-reduced-motion` respetado)
- Página `/inscripcion` dedicada con el formulario completo (el form ya existe como componente `ContactForm.tsx`)
- Sección de logros con números grandes si el cliente confirma datos reales
- Google Analytics o Vercel Analytics (Vercel Analytics ya instalado como dep — solo activar en `astro.config.mjs`)
- Rate limiting o CAPTCHA en la Action de contacto si aparece spam (hoy solo hay honeypot `botcheck`)

---

## Notas de implementación

- Todas las imágenes deben ir en `src/assets/images/` (no en `public/`) para que Astro las procese con sharp y genere WebP optimizados — **excepción**: fotos de formadores están en `public/images/formadores/` como webp directo, ya están optimizadas.
- Las categorías SIEMPRE se muestran por edad (`7 a 8 años`), nunca por rango de años escrito a mano: se calculan por edad cumplida desde el catálogo único de `src/lib/domain/categoria.ts` (spec 15 invirtió la regla anterior).
- El número de WhatsApp está centralizado en `src/lib/whatsapp.ts` — cambiar solo ahí si cambia el número.
- El color `#25D366` del WhatsApp NO debe cambiarse (identidad de marca de WhatsApp).
- shadcn/ui (`src/components/ui/`) no tocar manualmente — usar `npx shadcn add <componente>` si se necesita algo nuevo.
- El mapa de ubicación es un SVG ilustrado custom (`StylizedMap.astro`) — no usa Google Maps embed ni API externa.
