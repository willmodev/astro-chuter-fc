import { actions } from 'astro:actions';
import { useCallback, useEffect, useState } from 'react';

import type { NuevoUsuarioInput, UsuarioRow } from './types';

type Estado = 'cargando' | 'listo' | 'error';

interface UseEquipo {
  usuarios: UsuarioRow[];
  estado: Estado;
  recargar: () => Promise<void>;
  crear: (input: NuevoUsuarioInput) => Promise<string | null>;
  toggleActivo: (userId: string, activo: boolean) => Promise<string | null>;
  resetPassword: (userId: string, password: string) => Promise<string | null>;
}

// Estado de cliente de la pantalla Equipo + llamadas a las Actions. Las
// mutaciones devuelven `null` si todo salió bien o el mensaje de error.
export function useEquipo(): UseEquipo {
  const [usuarios, setUsuarios] = useState<UsuarioRow[]>([]);
  const [estado, setEstado] = useState<Estado>('cargando');

  const recargar = useCallback(async () => {
    setEstado('cargando');
    const { data, error } = await actions.usuarios.listar();
    if (error || !data) {
      setEstado('error');
      return;
    }
    setUsuarios(data);
    setEstado('listo');
  }, []);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  const crear = useCallback<UseEquipo['crear']>(
    async (input) => {
      const { error } = await actions.usuarios.crear(input);
      if (error) return error.message;
      await recargar();
      return null;
    },
    [recargar],
  );

  const toggleActivo = useCallback<UseEquipo['toggleActivo']>(
    async (userId, activo) => {
      const { error } = await actions.usuarios.toggleActivo({ userId, activo });
      if (error) return error.message;
      await recargar();
      return null;
    },
    [recargar],
  );

  const resetPassword = useCallback<UseEquipo['resetPassword']>(
    async (userId, password) => {
      const { error } = await actions.usuarios.resetPassword({
        userId,
        password,
      });
      if (error) return error.message;
      return null;
    },
    [],
  );

  return { usuarios, estado, recargar, crear, toggleActivo, resetPassword };
}
