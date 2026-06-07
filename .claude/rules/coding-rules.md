# Reglas de código limpio — Chuter FC

> Reglas de trabajo para Claude Code y el equipo. Importadas desde `CLAUDE.md`. Aplican a todo el código (sitio público y módulo admin).
> Las reglas de estilo se derivan del **código actual del repo**; el tooling se basa en las **versiones realmente instaladas** y la documentación vigente (verificado 2026-06).

---

## 0. Estilo observado en el código actual (fuente de verdad)

Estas convenciones ya están en el repo (`src/lib/site.ts`, `src/components/interactive/ContactForm.tsx`, `src/content.config.ts`, `astro.config.mjs`). El código nuevo las respeta:

- **Comillas simples** en TS/TSX/Astro (`'Chuter FC'`).
- **Punto y coma** al final de sentencia.
- **Indentación 2 espacios** (TS/TSX/Astro). _(El CSS en `global.css` usa 4; no se toca.)_
- **Trailing commas** en multilínea (objetos/arrays).
- **`printWidth` ~80** (el código actual ya envuelve a ese ancho; es el default de Prettier 3).
- **Constantes** = objetos `as const` agrupados por dominio en `src/lib/*` (ej. `SITE`, `CONTACT`, `COACHES`).
- **Config por entorno:** `import.meta.env.PUBLIC_X ?? 'valor-por-defecto'`.
- **Alias `@/*` → `src/*`** (definido en `tsconfig.json`, que extiende `astro/tsconfigs/strict`).
- **React:** componentes función con hooks; props tipadas; estados como _union types_ (`type Status = 'idle' | 'submitting' | ...`). **No hay `any` en el código actual** — se mantiene así.
- **Content collections:** schemas Zod con loader `glob` (`src/content.config.ts`).

> Nota de migración (no hacer ahora): `src/content.config.ts` importa `z` de `astro:content`, que **Astro 6 deprecó** a favor de `astro/zod`. Migrar cuando se toque ese archivo.

---

## 1. Principios

1. **Responsabilidad única (SRP).** Un archivo = una idea. Si un archivo empieza a hacer dos cosas, se divide. Las pantallas grandes se descomponen en carpetas con sub-componentes.
2. **No duplicación (DRY).** La lógica compartida vive en un solo lugar: reglas de negocio en `src/lib/domain`, primitivos visuales en `features/admin/ui`, chrome compartido en `features/admin/chrome`, constantes en `src/lib/site.ts`.
3. **Archivos pequeños.** Máximo **200 líneas por archivo**. Si crece, es señal de que mezcla responsabilidades → dividir.
4. **Todo tipado, cero `any`.** TypeScript `strict` (ya activo vía `astro/tsconfigs/strict`). Si un `any` fuera inevitable, se justifica con comentario `// any necesario porque…` (caso excepcional, evitarlo).
5. **Funciones cortas y simples.** Máx. ~60 líneas y complejidad ciclomática ≤ 10 por función.
6. **La lógica de negocio no vive en la UI.** Componentes y actions orquestan; las reglas son funciones puras en `lib/domain` (testeables en aislamiento).

---

## 2. Límites cuantitativos (política del equipo, ESLint los hace cumplir)

| Regla | Valor | Por qué |
|---|---|---|
| `max-lines` | **200** (error) | Ningún archivo crece más allá de su responsabilidad. |
| `max-lines-per-function` | **60** | Funciones legibles de un vistazo. |
| `complexity` | **10** | Evita ramificación excesiva. |
| `max-depth` | **3** | Anidamiento plano. |
| `max-params` | **4** | Más parámetros → usar un objeto tipado. |
| `@typescript-eslint/no-explicit-any` | error | Sin `any`. |
| `import-x/no-duplicates` | error | Sin imports duplicados. |
| `import-x/order` | error | Orden: externos → `@/` internos → relativos → tipos, con líneas en blanco. |

Excepción: en `src/lib/db/schema/**` se desactiva `max-lines-per-function` (definiciones de tablas Drizzle).

---

## 3. Convenciones de nombres y estructura

- **Componentes:** PascalCase, uno por archivo (`CarteraCell.tsx`).
- **Variables/funciones:** camelCase. **Constantes globales:** UPPER_SNAKE_CASE u objetos `as const`.
- **Páginas Astro:** kebab-case (`login.astro`).
- **Reglas de dominio:** nombres claros en español (`categoriaDeAnio`, `saldoPendiente`).
- **Imports:** alias `@/*` (no rutas relativas largas `../../../`).
- **`.astro` por defecto** para lo estático; **`.tsx` solo con interactividad real** (la app admin califica).
- **Props desestructuradas** y tipadas con `interface Props` (Astro) o tipo de props (React).

---

## 4. Organización por capas (admin)

- `features/admin/ui` — primitivos presentacionales (sin lógica de negocio).
- `features/admin/chrome` — shell compartido (header, tab bar, sheets…).
- `features/admin/screens` — composición de primitivos + hooks; **una carpeta por pantalla** para no superar 200 líneas.
- `features/admin/hooks` — estado de cliente + llamadas a Actions (o mock).
- `lib/domain` — reglas puras. `lib/db/repos` — solo queries. `lib/services` — orquestación.
- `actions` — RPC tipado + validación Zod + `requireUser`.

Antes de crear código nuevo: **buscar si ya existe** una utilidad/función/patrón reutilizable (p.ej. `src/lib/whatsapp.ts`, `src/lib/site.ts`, `lib/domain/categoria.ts`).

---

## 5. Tooling para hacer cumplir las reglas (PLAN — aún NO instalado)

Estado actual: **no hay** `eslint`, `eslint.config.js`, `.prettierrc` ni `@astrojs/check` en el repo. Esto se agrega en la Fase 0 de implementación (no ahora). Versiones verificadas 2026-06.

### Dependencias a instalar (dev)
```
eslint@^10                 # ESLint v10 es la línea actual
typescript-eslint@^8        # usar la versión que declare soporte para tu ESLint
eslint-plugin-astro@^1.7    # parser + reglas para .astro (incluye astro-eslint-parser)
@typescript-eslint/parser   # requerido por eslint-plugin-astro para TS en .astro
eslint-plugin-import-x      # fork mantenido de eslint-plugin-import para flat config / ESLint 9+
@astrojs/check              # necesario para `astro check` (typecheck); typescript ya está instalado
```
Prettier ya está instalado (3.8.3) con `prettier-plugin-astro` y `prettier-plugin-tailwindcss`.

### ESLint flat config (`eslint.config.js`) — esquema propuesto
```js
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';
import importX from 'eslint-plugin-import-x';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,   // "todo tipado"
  ...astro.configs.recommended,            // configura astro-eslint-parser + TS en .astro
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    plugins: { 'import-x': importX },
    rules: {
      'max-lines': ['error', { max: 200, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': ['error', { max: 60, skipBlankLines: true, skipComments: true }],
      complexity: ['error', 10],
      'max-depth': ['error', 3],
      'max-params': ['error', 4],
      '@typescript-eslint/no-explicit-any': 'error',
      'import-x/no-duplicates': 'error',
      'import-x/order': ['error', { 'newlines-between': 'always' }],
    },
  },
  { files: ['src/lib/db/schema/**'], rules: { 'max-lines-per-function': 'off' } },
);
```
> Nota: `strictTypeChecked` requiere `parserOptions.projectService`. El type-aware en `.astro` tiene limitaciones conocidas; se aplica sobre todo a `.ts`/`.tsx`. Confirmar la combinación exacta de versiones ESLint/typescript-eslint al instalar.

### Prettier (`.prettierrc`) — mínimo que coincide con el código actual
```json
{
  "singleQuote": true,
  "plugins": ["prettier-plugin-astro", "prettier-plugin-tailwindcss"]
}
```
> El resto (`semi: true`, `tabWidth: 2`, `trailingComma: 'all'`, `printWidth: 80`) ya son los **defaults de Prettier 3** y coinciden con el repo; solo se fuerza `singleQuote`.

### Scripts (`package.json`)
```json
"lint": "eslint .",
"typecheck": "astro check",
"check": "astro check && eslint .",
"db:generate": "drizzle-kit generate",
"db:migrate": "drizzle-kit migrate",
"db:seed": "node scripts/seed-from-excel.mjs"
```

### Pre-commit (opcional, recomendado)
`husky` + `lint-staged`: en cada commit corre `eslint --fix` + `prettier --write` + `astro check` sobre los archivos staged. Alineado con la regla de `CLAUDE.md`: commits atómicos, nunca `git add .` masivo.

### Alcance del linter (decisión pendiente)
Las reglas estructurales (`max-lines`, etc.) están pensadas para el **código nuevo del admin**. El sitio de marketing existente podría tener violaciones (p.ej. `ContactForm.tsx`). Al instalar, decidir entre: (a) scopear las reglas estructurales a `src/features/admin/**`, `src/lib/**`, `src/actions/**`, o (b) aplicarlas globalmente y limpiar el marketing de forma incremental.

---

## 6. Checklist por Pull Request / commit

- [ ] Ningún archivo supera 200 líneas.
- [ ] Cero `any` (o justificado con comentario).
- [ ] Sin lógica de negocio dentro de componentes/actions (está en `lib/domain`).
- [ ] Sin duplicación: reutilicé utilidades existentes.
- [ ] `npm run check` en verde (astro check + eslint).
- [ ] Criterios de aceptación de la HU verificados.
- [ ] Commit en español (Conventional Commits + emoji), atómico.
