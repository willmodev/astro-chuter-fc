# SPEC 02 — Datos de contacto y correo del formulario con Resend

> **Estado:** Implementado · **Depende de:** SPEC 01 · **Fecha:** 2026-07-02
> **Objetivo:** Centralizar el WhatsApp, el email y la URL del club en variables de entorno con los datos reales de producción (`chuterfc.com`), mostrar el email como `mailto:`, y migrar el envío del formulario de Web3Forms a Resend con una plantilla HTML propia que llegue branded a `olimak8@hotmail.com`.

---

## Por qué existe este spec

El proyecto está **en producción** (negocio cerrado) en el dominio propio **`chuterfc.com`**,
ya no es un demo en `vercel.app`. El cliente pasó el WhatsApp real (`300 872 5964`) y el email
(`olimak8@hotmail.com`). Hoy: el número viejo (`301 521 6830`) está **hardcodeado en 3
componentes** que ignoran `PUBLIC_WHATSAPP_NUMBER`; la URL apunta a `chuterfc.vercel.app`; y el
form envía por **Web3Forms**, que no permite plantilla branded en free. Con dominio propio
verificable usamos **Resend**: enviar desde `chuterfc.com` (SPF/DKIM → entra a bandeja de
Hotmail/Outlook), HTML 100% propio, y alineado con el backend que ya introduce el módulo admin
(adapter de Vercel + Astro Actions).

> Este spec introduce el **primer backend propio** del sitio y cambia la regla "Forms: sin
> backend propio" del `CLAUDE.md`. Coherente con el módulo admin. Se actualiza `CLAUDE.md`.

---

## Alcance

**Dentro:**

- Env vars: `PUBLIC_WHATSAPP_NUMBER=573008725964`, `PUBLIC_CONTACT_EMAIL=olimak8@hotmail.com`,
  `PUBLIC_SITE_URL=https://chuterfc.com`; y server-only `RESEND_API_KEY`,
  `CONTACT_EMAIL_FROM`, `CONTACT_EMAIL_TO`. Quitar `PUBLIC_WEB3FORMS_KEY`.
- `src/lib/site.ts`: `CONTACT` con número real (`whatsappNumber`, `phoneDisplay`
  `300 872 5964`, `phoneE164` `+573008725964`, nuevo `email`) y `SITE.url` default `https://chuterfc.com`.
- **Eliminar el número hardcodeado** en `MobileMenu.tsx`, `ContactForm.tsx` y
  `ProgramsSection.astro`; que todos usen `whatsapp.ts` / `CONTACT`.
- Agregar `email` al JSON-LD `SportsActivityLocation` (`src/lib/seo.ts`).
- Mostrar el email como `mailto:` en la columna "Contacto" del `Footer.astro` y en el bloque
  de contacto de `ContactSection.astro`.
- Instalar y configurar el adapter `@astrojs/vercel` **manteniendo `output` estático**: solo
  la Astro Action se renderiza on-demand; las páginas siguen prerenderizadas.
- Verificar el dominio `chuterfc.com` en Resend (DNS SPF/DKIM/DMARC) — paso de ops.
- Astro Action `enviarContacto` con Zod (`src/actions/`), servicio (`src/lib/services/`),
  plantilla HTML pura (`src/lib/emails/`) y wrapper de Resend. Reusar `src/lib/domain/categoria.ts`.
- Reescribir `ContactForm.tsx` para llamar la Action vía `astro:actions`; agregar campo
  opcional "Email del acudiente" → `replyTo`.
- Actualizar `CLAUDE.md`: número/email del club, dominio `chuterfc.com`, stack de forms
  (Resend + Action) y env vars; quitar "sin backend propio".

**Fuera del alcance (otros specs):**

- Autorespuesta/confirmación al acudiente; rate limiting o captcha (más allá del honeypot).
- Persistir consultas en base de datos (módulo admin).
- Migrar páginas del sitio a SSR (solo la Action usa server).
- Costos de mensualidad/matrícula; dirección exacta + Google Maps embed; testimonios reales,
  logo SVG, fotos, logros, bios (dependen del cliente).

---

## Modelo de datos

No hay estructuras de dominio nuevas persistentes. Cambian env vars, constantes de config y
se agrega el modelo interno del correo.

### Variables de entorno

`.env.example` es **plantilla versionada**: lleva solo los **nombres** de las variables con el
valor **vacío** (nunca data real, ni siquiera la pública). Los valores reales van en `.env`
(gitignored, no se versiona) y en el panel de Vercel.

```
# .env.example — solo nombres, sin valores
PUBLIC_WHATSAPP_NUMBER=
PUBLIC_CONTACT_EMAIL=
PUBLIC_INSTAGRAM_URL=
PUBLIC_SITE_URL=

# Correo del formulario (Resend) — server-only, NUNCA con prefijo PUBLIC_
RESEND_API_KEY=
CONTACT_EMAIL_FROM=
CONTACT_EMAIL_TO=
```

Valores reales (en `.env` / Vercel): `PUBLIC_WHATSAPP_NUMBER=573008725964`,
`PUBLIC_CONTACT_EMAIL=olimak8@hotmail.com`, `PUBLIC_SITE_URL=https://chuterfc.com`,
`CONTACT_EMAIL_FROM=Chuter FC <inscripciones@chuterfc.com>`, `CONTACT_EMAIL_TO=olimak8@hotmail.com`.
Los fallbacks en `src/lib/site.ts` cubren estos valores públicos en local, así que el sitio
compila sin `.env`; solo el envío de correo requiere las 3 vars server de Resend.
`CONTACT_EMAIL_TO` como server var permite reenrutar sin tocar config pública. El `from` debe
ser un remitente del dominio verificado en Resend.

### `CONTACT` y `SITE` (`src/lib/site.ts`)

```ts
export const SITE = {
  // ...
  url: import.meta.env.PUBLIC_SITE_URL ?? 'https://chuterfc.com',
} as const;

const whatsappNumber =
  import.meta.env.PUBLIC_WHATSAPP_NUMBER ?? '573008725964';
const numeroNacional = whatsappNumber.replace(/^57/, '');

export const CONTACT = {
  whatsappNumber,
  phoneE164: `+${whatsappNumber}`,
  phoneDisplay: numeroNacional.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3'),
  email: import.meta.env.PUBLIC_CONTACT_EMAIL ?? 'olimak8@hotmail.com',
  instagramUrl:
    import.meta.env.PUBLIC_INSTAGRAM_URL ?? 'https://instagram.com/1chuter',
  instagramHandle: '@1chuter',
} as const;
```

`phoneE164` y `phoneDisplay` se **derivan** de `whatsappNumber` (celular colombiano:
`57` + 10 dígitos). Así una sola variable `PUBLIC_WHATSAPP_NUMBER` gobierna las tres formas:
cambiarla en Vercel + redeploy actualiza todo sin tocar código.

### Entrada de la Action (`src/actions/contacto.ts`) — Zod

```ts
const input = z.object({
  nombreAcudiente: z.string().min(2),
  telefono: z.string().min(7),
  nombreNino: z.string().min(2),
  anioNacimiento: z.coerce.number().int().min(2000).max(2025),
  emailAcudiente: z.email().optional().or(z.literal('')), // zod v4: z.email(), no z.string().email()
  mensaje: z.string().max(1000).optional(),
  botcheck: z.string().optional(), // honeypot; si viene con valor, se descarta
});
```

### Modelo del correo (interno, lo arma el servicio)

```ts
interface CorreoInscripcion {
  nombreAcudiente: string;
  telefono: string;
  nombreNino: string;
  anioNacimiento: number;
  categoriaSugerida: string | null; // de categoria.ts
  emailAcudiente?: string;
  mensaje?: string;
}
```

---

## Plan de implementación

Cada paso deja el sitio compilando (`npm run dev`) y desplegable.

### Bloque A — Datos de contacto (sin backend)

1. **`.env.example`**: agregar los nombres `PUBLIC_CONTACT_EMAIL` y las vars de Resend con valores
   vacíos (plantilla sin data real); la data real va en `.env` / Vercel.
2. **`src/lib/site.ts`**: `SITE.url` y `CONTACT` (número, `phoneDisplay`, `phoneE164`, `email`).
3. **`MobileMenu.tsx`**: eliminar `WA_HERO` hardcodeado; importarlo de `@/lib/whatsapp`.
4. **`ProgramsSection.astro`**: reemplazar la URL `wa.me/573015216830` por el helper de
   `@/lib/whatsapp` (o `CONTACT.whatsappNumber`).
5. **`ContactForm.tsx`**: reemplazar el número hardcodeado del mensaje de éxito por
   `CONTACT.phoneDisplay` + helper de WhatsApp.
6. **`src/lib/seo.ts`**: agregar `email: CONTACT.email` al JSON-LD.
7. **`Footer.astro`** y **`ContactSection.astro`**: mostrar el email como `mailto:${CONTACT.email}`
   (ícono de sobre en el footer; junto al botón de WhatsApp en contacto).

### Bloque B — Migración a Resend

8. **Ops — Resend:** crear proyecto, agregar `chuterfc.com`, publicar DNS (SPF/DKIM/DMARC),
   esperar verificación, generar `RESEND_API_KEY` y cargar las 3 env vars en Vercel.
9. **Adapter:** instalar `@astrojs/vercel`; en `astro.config.mjs` agregar `adapter: vercel()`
   sin cambiar `output`. Verificar que `npm run build` sigue estático.
10. **Transporte:** instalar `resend`; `src/lib/emails/resend.ts` instancia el cliente y expone
    `enviarCorreo({ to, from, subject, html, replyTo })`.
11. **Plantilla:** `src/lib/emails/inscripcion-template.ts` — función pura que recibe
    `CorreoInscripcion` y devuelve `{ subject, html }` branded (navy/gold, inline-styled).
12. **Servicio:** `src/lib/services/contacto.ts` — calcula categoría con `categoria.ts`, arma
    `CorreoInscripcion`, genera plantilla y llama al transporte.
13. **Action:** `src/actions/contacto.ts` con `defineAction` + Zod; descarta si `botcheck`
    tiene valor; delega en el servicio. Exportar en `src/actions/index.ts`.
14. **Form:** reescribir `ContactForm.tsx` para usar `actions.enviarContacto` de
    `astro:actions`; agregar input opcional "Email del acudiente"; quitar los hidden de
    Web3Forms y el `fetch` a `api.web3forms.com`.
15. **Limpieza:** quitar `PUBLIC_WEB3FORMS_KEY` de `.env.example` y del código.

### Bloque C — Cierre

16. **`CLAUDE.md`**: número `300 872 5964`, email del club, dominio `chuterfc.com`, stack de
    forms (Resend + Action) y env vars; quitar "sin backend propio".
17. **Verificación**: `grep` de `573015216830`, `301 521 6830`, `chuterfc.vercel.app` y
    `web3forms` en el repo = 0; envío de prueba real llega branded a `olimak8@hotmail.com`;
    `npm run build` (+ `astro sync`) en verde. *(`npm run check` queda para la Fase 0 del tooling.)*

---

## Criterios de aceptación

### Datos de contacto
- [x] `.env.example` incluye los **nombres** de las variables (`PUBLIC_CONTACT_EMAIL`,
      `PUBLIC_SITE_URL`, las de Resend, etc.) con **valores vacíos**; la data real vive en `.env`
      (gitignored) y en Vercel, no en el ejemplo versionado.
- [x] `CONTACT` expone `email`, `phoneDisplay` `300 872 5964`, `phoneE164` `+573008725964`;
      `SITE.url` default es `https://chuterfc.com`.
- [x] No queda `573015216830`, `301 521 6830` ni `chuterfc.vercel.app` en `src/`.
- [x] El botón de WhatsApp del menú móvil, el CTA de `ProgramsSection` y el mensaje de éxito
      del form abren `wa.me/573008725964`.
- [x] El JSON-LD incluye `"email"` y `url`/canonical usan `https://chuterfc.com`.
- [x] Footer y bloque de contacto muestran el email como `mailto:` a `olimak8@hotmail.com`.

### Correo (Resend)
- [x] `npm run build` genera el sitio estático y la Action funciona en Vercel (páginas siguen
      prerenderizadas; solo la Action es server).
- [x] El dominio `chuterfc.com` figura **verificado** en Resend (SPF/DKIM/DMARC en verde).
- [x] Enviar el form hace llegar un correo a `olimak8@hotmail.com` desde `CONTACT_EMAIL_FROM`.
- [x] El correo es branded (no tabla cruda): encabezado del club, datos legibles y la
      categoría sugerida resaltada; el `subject` incluye el nombre del niño/a y la categoría.
- [x] Si el acudiente llena su email, el correo llega con `reply-to` a ese email.
- [x] Un envío con el honeypot `botcheck` lleno NO dispara correo.
- [x] No queda referencia a `web3forms` ni `PUBLIC_WEB3FORMS_KEY` en el repo.
- [x] `RESEND_API_KEY`, `CONTACT_EMAIL_FROM` y `CONTACT_EMAIL_TO` son server-only (sin `PUBLIC_`).

### Calidad
- [x] La lógica de negocio vive en `lib/services`/`lib/domain`, no en el componente ni en la
      Action; ningún archivo supera 200 líneas; cero `any`.
- [x] `CLAUDE.md` refleja número, email, dominio y el nuevo stack de forms.
- [x] `npm run build` (con `astro sync`) pasa sin errores. *(El script `npm run check` —eslint +
      `astro check`— es la Fase 0 del tooling en `coding-rules.md`, fuera del alcance de este spec;
      cuando exista, debe quedar en verde.)*

---

## Decisiones

- **Sí:** número, email y URL vía `PUBLIC_*` con fallback real. *Por qué:* patrón del repo;
  fuente única.
- **Sí:** eliminar el número hardcodeado de los 3 componentes. *Por qué:* DRY; hoy la env var
  no los actualiza.
- **Sí:** `phoneE164`/`phoneDisplay` **derivados** de `whatsappNumber` con una regex simple.
  *Por qué:* una sola variable (`PUBLIC_WHATSAPP_NUMBER`) gobierna las tres formas; cambiarla en
  Vercel + redeploy actualiza todo sin tocar código. El celular colombiano (`57` + 10 dígitos,
  agrupación 3-3-4) es determinístico, así que la derivación es trivial y no agrega complejidad
  real. *(Revisa la decisión original de dejarlas como constantes literales.)*
- **Sí:** email como `mailto:` en footer y contacto. *Por qué:* pedido explícito de Will; vía
  alterna al WhatsApp.
- **Sí:** Resend como proveedor. *Por qué:* dominio propio verificable → mejor entrega a
  Hotmail; HTML branded; free tier suficiente; oficial y liviano.
- **No:** Nodemailer/SMTP (solo transporte, exige SMTP externo, peor entrega) ni Web3Forms Pro
  (pagar por menos control que Resend gratis con dominio propio).
- **Sí:** Astro Action (no endpoint `/api` a mano). *Por qué:* RPC tipado + Zod; patrón del admin.
- **Sí:** plantilla como función pura con HTML inline-styled. *Por qué:* los clientes de correo
  no soportan CSS externo; evita libs de render (React Email).
- **Sí:** capas `action → service → template/transport`, categoría desde `lib/domain`.
  *Por qué:* la lógica no vive en la UI ni en la Action.
- **No:** autorespuesta al padre por ahora. *Por qué:* suma alcance; se agrega luego.

---

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| DNS de Resend sin verificar → correos a spam o rechazados. | El paso 8 bloquea: no cerrar el spec hasta ver el dominio verificado y una prueba real en bandeja. |
| Agregar el adapter rompe el build estático actual. | Mantener `output` por defecto; el adapter solo habilita la Action. Verificar `npm run build` y un preview. |
| `RESEND_API_KEY` expuesta al cliente. | Nunca prefijo `PUBLIC_`; se usa solo en Action/servicio. Criterio de aceptación lo verifica. |
| Coincidencia con el adapter que instale el módulo admin. | Si el admin ya lo agregó, no duplicar: reusar el `adapter` de `astro.config.mjs`. |
| Queda número/URL viejos escondidos. | Paso 17: `grep` de `573015216830`, `301 521 6830`, `chuterfc.vercel.app`, `web3forms` = 0. |
| Bots enviando el form. | Honeypot `botcheck` en la Action; rate limiting/captcha para otro spec. |

---

## Lo que **no** está en este spec

- Autorespuesta/confirmación al acudiente; rate limiting o captcha.
- Persistir consultas en base de datos (módulo admin).
- Migrar páginas del sitio a SSR (solo la Action usa server).
- Costos de mensualidad/matrícula; dirección exacta + Google Maps embed; testimonios reales,
  logo SVG, fotos, logros, bios.

Cada uno, si llega, va en su propio spec.
