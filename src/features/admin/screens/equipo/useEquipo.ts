import { actions } from 'astro:actions';
import { useCallback, useEffect, useState } from 'react';

import type {
  EditarUsuarioInput,
  NuevoUsuarioInput,
  UsuarioRow,
} from './types';

type Estado = 'cargando' | 'listo' | 'error';

interface UseEquipo {
  usuarios: UsuarioRow[];
  estado: Estado;
  recargar: () => Promise<void>;
  crear: (input: NuevoUsuarioInput) => Promise<string | null>;
  editar: (input: EditarUsuarioInput) => Promise<string | null>;
  toggleActivo: (userId: string, activo: boolean) => Promise<string | null>;
  resetPassword: (userId: string, password: string) => Promise<string | null>;
}

// Devuelve null si la Action salió bien, o su mensaje de error.
async function mensajeDeError(
  llamada: Promise<{ error?: { message: string } }>,
): Promise<string | null> {
  const { error } = await llamada;
  return error ? error.message : null;
}

// Estado de cliente de la pantalla Equipo + llamadas a las Actions. Las
// mutaciones devuelven `null` si todo salió bien o el mensaje de error.
export function useEquipo(): UseEquipo {
  const [usuarios, setUsuarios] = useState<UsuarioRow[]>([]);
  const [estado, setEstado] = useState<Estado>('cargando');

  const recargar = useCallback(async () => {
    setEstado('cargando');
    const { data, error } = await actions.usuarios.listar();
    if (error) {
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
      const fallo = await mensajeDeError(actions.usuarios.crear(input));
      if (!fallo) await recargar();
      return fallo;
    },
    [recargar],
  );

  const editar = useCallback<UseEquipo['editar']>(
    async (input) => {
      const fallo = await mensajeDeError(actions.usuarios.editar(input));
      if (!fallo) await recargar();
      return fallo;
    },
    [recargar],
  );

  const toggleActivo = useCallback<UseEquipo['toggleActivo']>(
    async (userId, activo) => {
      const fallo = await mensajeDeError(
        actions.usuarios.toggleActivo({ userId, activo }),
      );
      if (!fallo) await recargar();
      return fallo;
    },
    [recargar],
  );

  const resetPassword = useCallback<UseEquipo['resetPassword']>(
    async (userId, password) =>
      mensajeDeError(actions.usuarios.resetPassword({ userId, password })),
    [],
  );

  return {
    usuarios,
    estado,
    recargar,
    crear,
    editar,
    toggleActivo,
    resetPassword,
  };
}
