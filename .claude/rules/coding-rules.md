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

> Migración hecha (spec 17): `src/content.config.ts` importa `z` de **`astro/zod`**. El `z` de `astro:content` que Astro 6 deprecó ya no se usa en el repo — eran 23 de los 186 hallazgos de `strictTypeChecked`, todos del mismo import.

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

| Regla                                | Valor           | Por qué                                                                    |
| ------------------------------------ | --------------- | -------------------------------------------------------------------------- |
| `max-lines`                          | **200** (error) | Ningún archivo crece más allá de su responsabilidad.                       |
| `max-lines-per-function`             | **60**          | Funciones legibles de un vistazo. **Solo `.ts`/`.mjs`** (ver override).    |
| `complexity`                         | **10**          | Evita ramificación excesiva.                                               |
| `max-depth`                          | **3**           | Anidamiento plano.                                                         |
| `max-params`                         | **4**           | Más parámetros → usar un objeto tipado.                                    |
| `@typescript-eslint/no-explicit-any` | error           | Sin `any`.                                                                 |
| `import-x/no-duplicates`             | error           | Sin imports duplicados.                                                    |
| `import-x/order`                     | error           | Orden: externos → `@/` internos → relativos → tipos, con líneas en blanco. |

**Override de `max-lines-per-function` en `.tsx` / `.astro` (spec 16):** desactivado. El
cuerpo de un componente es un árbol de markup, no una función imperativa, y este repo
conserva a propósito los estilos inline del prototipo (`ARCHITECTURE.md` §6), lo que infla
el conteo sin agregar una sola rama de lógica. Con la convención de **un componente por
archivo**, el tope real del componente ya es el `max-lines: 200` del archivo, y el guardián
de "esta función hace demasiado" sigue siendo `complexity: 10`, que queda activo en todas
partes. Medido: 34 de las 37 violaciones eran cuerpos JSX.

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

## 5. Tooling para hacer cumplir las reglas (instalado)

Estado actual (2026-08-07, spec 16): **instalado y en verde**. Los límites de la §2 ya no se
revisan a mano.

### Comandos

| Comando                | Qué hace                                              |
| ---------------------- | ----------------------------------------------------- |
| `npm run lint`         | `eslint .`                                            |
| `npm run typecheck`    | `astro check`                                         |
| `npm run check`        | `astro check && eslint .` — falla si cualquiera falla |
| `npm run format`       | `prettier --write .`                                  |
| `npm run format:check` | `prettier --check .`                                  |

`check` **no** incluye `format:check` a propósito: el formato no debe bloquear el mismo
comando que valida tipos y reglas. Se corre a mano con `npm run format`.

### Dependencias instaladas (dev), versiones verificadas 2026-08-07

```
eslint@10.8.0
@eslint/js@10.0.1
typescript-eslint@8.66.0
eslint-plugin-astro@3.1.0      # incluye astro-eslint-parser
eslint-plugin-import-x@4.17.1  # fork mantenido de eslint-plugin-import para flat config
globals                        # entorno Node de scripts/**
@astrojs/check                 # typecheck
prettier@3.8.3                 # con prettier-plugin-astro y prettier-plugin-tailwindcss
```

Archivos de configuración en la raíz: `eslint.config.js`, `.prettierrc`, `.prettierignore`,
`.gitattributes` (`* text=auto eol=lf`) y `.git-blame-ignore-revs`.

### Alcance del linter (decisión tomada — spec 16)

> Esta sección reemplaza la antigua _"Alcance del linter (decisión pendiente)"_, que proponía
> scopear las reglas estructurales a `src/features/admin/**`. **Medido contra el código real,
> la premisa estaba al revés** y la propuesta se descartó.

**Alcance global** (todo `src/` y `scripts/`), **calibrado por regla y por tipo de archivo, no
por directorio**:

| Regla                                               | Alcance                      | Severidad  |
| --------------------------------------------------- | ---------------------------- | ---------- |
| `max-lines: 200` (skip blancos + comentarios)       | global                       | `error`    |
| `@typescript-eslint/no-explicit-any`                | global                       | `error`    |
| `complexity: 10` · `max-depth: 3` · `max-params: 4` | global                       | `error`    |
| `import-x/no-duplicates` · `import-x/order`         | global                       | `error`    |
| `max-lines-per-function: 60`                        | **solo `.ts` / `.mjs`**      | `error`    |
| `max-lines-per-function`                            | **off en `.tsx` / `.astro`** | — (ver §2) |

Por qué global y no scopeado: las dos reglas que definen el contrato del proyecto
(`max-lines: 200` y `no-explicit-any`) tienen **cero violaciones en todo el repo**, marketing
incluido — aplicarlas globalmente cuesta cero. Y la única que mordía
(`max-lines-per-function`) tenía **33 de sus 37 violaciones dentro del admin**: el scope
propuesto habría metido en scope justo lo que dolía y dejado afuera lo que ya pasaba.

**Severidad de las reglas type-aware:** se usa **`strictTypeChecked`** desde el spec 17
(DT-5). El spec 16 lo había dejado en `recommendedTypeChecked` citando 563 hallazgos;
remedido sobre el repo con los `ignores` ya fijados, eran **186**, de los cuales 88 se
arreglaban con `--fix` y 23 eran un solo import (`z` de `astro:content`). Se saldaron todos.

**Las 5 supresiones que quedan en el repo** son todas `eslint-disable-next-line` de una línea
con motivo escrito, y todas por la misma causa: **el tipo no refleja el runtime**. Cuatro son
el patrón `import.meta.env?.X ?? process.env.X` (`db/client.ts`, `auth/server.ts` ×2,
`services/blob-entrenos.ts`), que es load-bearing porque `scripts/*.mjs` importan esos módulos
desde Node puro, donde `import.meta.env` no existe — y no se refactoriza a un helper porque
Vite sustituye `import.meta.env.X` **estáticamente**. La quinta es un `const [row] = await
db.select()…limit(1)` que TS tipa como no-nulo sin `noUncheckedIndexedAccess`. Activar esa
opción del compilador eliminaría la quinta de raíz, pero es un cambio global: queda como
decisión consciente, no como olvido.

> **Regla para código nuevo:** si `strictTypeChecked` marca una condición como innecesaria y
> la guarda protege un límite real (Action, base, DOM, `localStorage`, env), se arregla **el
> tipo**, no se borra la defensa. Suprimir la regla es el último recurso y siempre lleva
> motivo. Cero `any`, cero `@ts-ignore`.

**Fuera del linter (`ignores`):** `src/components/ui/**` (generado por shadcn, "no tocar
manualmente" según `CLAUDE.md`), más el material no versionado que ESLint barrería porque
no lee `.gitignore`: `references/`, `admin-design-system-*/`, `docs/comercial/` y
`.playwright-cli/`.

### Pre-commit (opcional, aún no instalado)

`husky` + `lint-staged`. Sigue siendo opcional a propósito: meter un gate en cada commit
antes de que la config lleve unas semanas rodada convierte cualquier falso positivo en un
bloqueo. Lo mismo aplica a conectar ESLint al CI o al build de Vercel (hoy el deploy corre
`astro build`, no `check`).

---

## 6. Checklist por Pull Request / commit

- [ ] Ningún archivo supera 200 líneas.
- [ ] Cero `any` (o justificado con comentario).
- [ ] Sin lógica de negocio dentro de componentes/actions (está en `lib/domain`).
- [ ] Sin duplicación: reutilicé utilidades existentes.
- [ ] `npm run check` en verde (astro check + eslint).
- [ ] Criterios de aceptación de la HU verificados.
- [ ] Commit en español (Conventional Commits + emoji), atómico.
