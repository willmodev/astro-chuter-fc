# Próximos pasos — Módulo Admin Chuter FC

> Handoff para retomar en otra sesión. (No commiteado a propósito.)

## Dónde estamos
Planeación COMPLETA y commiteada (`8888e70`). Aún **no se ha tocado código ni configuración** de la app.
Leer primero: `docs/backlog.md`, `docs/ARCHITECTURE.md`, `.claude/rules/coding-rules.md`, `docs/excel-data-dictionary.md`.

## Decisiones cerradas
- App admin responsive real en `/admin` (noindex), tokens DS bajo `.admin-app`, estilos inline (fiel al prototipo).
- Stack: **Neon + Drizzle + Better Auth + Astro Actions + adapter Vercel**. Astro 6: estático por defecto + `prerender=false` por ruta. Zod = `astro/zod`.
- Build **mock-first**: UI con datos mock detrás de hooks tipados → luego cablear BD/auth sin tocar la UI.
- Reglas: 200 líneas/archivo, SRP, DRY, cero `any` (ESLint v10 + typescript-eslint v8 + eslint-plugin-astro 1.7).

## Próximos pasos (en orden)
1. **Fase 0 — fundación** (tarea pendiente): `astro add vercel`; instalar `eslint @eslint/js typescript-eslint eslint-plugin-astro @typescript-eslint/parser eslint-plugin-import-x @astrojs/check`; crear `eslint.config.js` + `.prettierrc` (solo `singleQuote`) + scripts (`lint`,`typecheck`,`check`); `AdminLayout.astro` + `admin.css` (tokens); ruta `/admin` noindex + `robots.txt` + filtro sitemap. Verificar que el build de marketing sigue estático.
2. **Fase 1** — primitivos `features/admin/ui` + `chrome` (portar del prototipo).
3. **Fase 2 (HITO)** — 8 pantallas + router interno + `data/` mock. Demo `/admin` navegable.
4. **Fase 3** — Drizzle schema (ver diccionario) + Neon + migraciones + `lib/domain` + repos + `scripts/seed-from-excel.mjs`.
5. **Fase 4** — Better Auth + middleware + login + seed de 2 admins.
6. **Fase 5** — Actions por agregado + `_guard`; hooks pasan de mock a Actions sin tocar UI.
7. **Fase 6** — verificación (`npm run check`, build, flujos en dev) + noindex.

## Decisiones que faltan / prerequisitos
- [ ] Crear proyecto **Neon** y entregar `DATABASE_URL` (+ `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`). Necesario desde Fase 3.
- [ ] Definir **alcance del linter**: scopear reglas estrictas a `src/features/admin/**`,`src/lib/**`,`src/actions/**` vs aplicarlas global (el marketing existente puede violar `max-lines`).
- [ ] El **Excel** (`CHUTER FC 2026.xlsx`) está local e ignorado (PII). Es la fuente del seed (HU-8.1); confirmar limpieza de datos (docs incompletos, categorías filas sin número).

## Prototipo original
Bundle del diseño extraído en el directorio temporal de la sesión (`tool-results/design_bundle/chuterfc/`); si ya no está, re-fetch del link de Claude Design del primer mensaje.
