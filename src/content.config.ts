import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const programasCollection = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/programas' }),
  schema: z.object({
    nombre: z.string(),
    nacidos: z.string(),
    edadAprox: z.string(),
    horario: z.string(),
    icono: z.string(),
    descripcion: z.string(),
    color: z.enum(['navy', 'blue', 'gold']).default('navy'),
    orden: z.number(),
  }),
});

const formadoresCollection = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/formadores' }),
  schema: z.object({
    nombre: z.string(),
    rol: z.string(),
    bio: z.string(),
    foto: z.string(),
    instagram: z.string().optional(),
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
