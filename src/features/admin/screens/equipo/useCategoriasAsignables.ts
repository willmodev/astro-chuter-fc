import { actions } from 'astro:actions';
import { useEffect, useState } from 'react';

import type { CategoriaAsignable } from './types';

// Las 7 categorías con quién las tiene hoy (spec 15). Se pide al abrir el alta,
// para que las ocupadas se vean deshabilitadas con el nombre de su entrenador.
export function useCategoriasAsignables(usuarioId?: string) {
  const [categorias, setCategorias] = useState<CategoriaAsignable[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let vigente = true;
    void actions.usuarios
      .categoriasAsignables({ usuarioId })
      .then(({ data }) => {
        if (!vigente) return;
        setCategorias(data ?? []);
        setCargando(false);
      });
    return () => {
      vigente = false;
    };
  }, [usuarioId]);

  return { categorias, cargando };
}
