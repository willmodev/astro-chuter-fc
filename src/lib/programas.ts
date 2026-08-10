// Programas publicados en la landing: la colección aporta lo editorial (icono,
// texto, horario, entrenador) y el catálogo de dominio el nombre y la edad, a
// partir de `sub`. Fuente única para todas las secciones del sitio (spec 15).
import { getCollection } from 'astro:content';

import { categoriaDeEtiqueta, etiquetaDeSub } from '@/lib/domain/categoria';
import { SCHEDULE } from '@/lib/site';

export interface ProgramaPublicado {
  sub: number;
  nombre: string; // del catálogo: 'Benjamín'
  edades: string; // del catálogo: '7 a 8 años'
  horario: string;
  icono: string;
  entrenador?: string;
  descripcion: string;
  color: 'navy' | 'blue' | 'gold';
  orden: number;
}

export async function listarProgramas(): Promise<ProgramaPublicado[]> {
  const entradas = await getCollection('programas');
  return entradas
    .map(({ id, data }) => {
      const categoria = categoriaDeEtiqueta(etiquetaDeSub(data.sub));
      if (!categoria) {
        throw new Error(
          `El programa '${id}' declara sub ${String(data.sub)}, que no existe en el catálogo de categorías.`,
        );
      }
      return {
        ...data,
        nombre: categoria.nombre,
        edades: categoria.edades,
        horario: SCHEDULE.resumenPrograma,
      };
    })
    .sort((a, b) => a.orden - b.orden);
}
