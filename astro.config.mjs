// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  site: 'https://chuterfc.com',
  // output estático por defecto: las páginas siguen prerenderizadas;
  // solo la Astro Action se renderiza on-demand gracias al adapter.
  adapter: vercel(),
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    react(),
    // El back-office es privado: se excluye del sitemap público.
    sitemap({ filter: (page) => !page.includes('/admin') }),
  ],
});
