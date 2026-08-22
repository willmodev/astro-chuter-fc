import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const programasCollection = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/programas' }),
  // `sub` enlaza con el catálogo único (`lib/domain/categoria.ts`): de ahí salen
  // el nombre y la edad publicados, así que aquí NO se escriben ni el nombre ni
  // los años a mano. `entrenador` es opcional: sin dato no se muestra la línea.
  schema: z.object({
    sub: z.number(),
    icono: z.string(),
    entrenador: z.string().optional(),
    descripcion: z.string(),
    color: z.enum(['navy', 'blue', 'gold']).default('navy'),
    orden: z.number(),
  }),
});

const formadoresCollection = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/formadores' }),
  // Schema-función para usar el helper `image()`: la ruta del frontmatter llega
  // resuelta como `ImageMetadata` y `<Image>` la optimiza en build.
  schema: ({ image }) =>
    z.object({
      nombre: z.string(),
      rol: z.string(),
      bio: z.string(),
      /** Retrato en `src/assets/images/formadores/`; sin foto la tarjeta usa iniciales. */
      foto: image().optional(),
      instagram: z.string().optional(),
      /** Títulos y certificaciones; solo la usan los fundadores. */
      credenciales: z.array(z.string()).optional(),
      etiqueta: z.string().default('Formador'),
      orden: z.number(),
    }),
});

const testimoniosCollection = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/testimonios' }),
  schema: z.object({
    autor: z.string(),
    relacion: z.string(),
    texto: z.string(),
    foto: z.string().optional(),
    orden: z.number(),
    esPlaceholder: z.boolean().default(false),
  }),
});

export const collections = {
  programas: programasCollection,
  formadores: formadoresCollection,
  testimonios: testimoniosCollection,
};
