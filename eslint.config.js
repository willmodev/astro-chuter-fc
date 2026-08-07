import eslint from '@eslint/js';
import astro from 'eslint-plugin-astro';
import importX from 'eslint-plugin-import-x';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'dist/',
      '.astro/',
      '.vercel/',
      'drizzle/',
      // Generado por shadcn: CLAUDE.md dice "no tocar manualmente".
      'src/components/ui/**',
      // Material no versionado (.gitignore): prototipo de referencia,
      // bundle del design system y artefactos locales. No es código del proyecto.
      'references/',
      'admin-design-system-*/',
      'docs/comercial/',
      '.playwright-cli/',
    ],
  },
  eslint.configs.recommended,
  // `strictTypeChecked` desde el spec 17 (DT-5). Remedido: 186 hallazgos, no
  // los 563 que citaba el spec 16; se saldaron todos y el preset queda en pie.
  tseslint.configs.strictTypeChecked,
  astro.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: { 'import-x': importX },
    rules: {
      'max-lines': [
        'error',
        { max: 200, skipBlankLines: true, skipComments: true },
      ],
      'max-lines-per-function': [
        'error',
        { max: 60, skipBlankLines: true, skipComments: true },
      ],
      complexity: ['error', 10],
      'max-depth': ['error', 3],
      'max-params': ['error', 4],
      '@typescript-eslint/no-explicit-any': 'error',
      'import-x/no-duplicates': 'error',
      'import-x/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
            'type',
          ],
          pathGroups: [{ pattern: '@/**', group: 'internal' }],
          'newlines-between': 'always',
        },
      ],
    },
  },
  // El cuerpo de un componente es un árbol de markup, no una función: lo acota
  // `max-lines: 200` (un componente por archivo) + `complexity: 10`.
  {
    files: ['**/*.tsx', '**/*.astro'],
    rules: { 'max-lines-per-function': 'off' },
  },
  {
    files: ['src/lib/db/schema/**'],
    rules: { 'max-lines-per-function': 'off' },
  },
  // Scripts de mantenimiento: Node puro, fuera del proyecto TS.
  {
    files: ['scripts/**', '*.mjs', '*.cjs', '*.config.js'],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
);
