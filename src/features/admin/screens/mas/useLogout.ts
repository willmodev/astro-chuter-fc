import { useState } from 'react';

import { signOut } from '@/lib/auth/client';

interface UseLogout {
  saliendo: boolean;
  cerrarSesion: () => Promise<void>;
}

export function useLogout(): UseLogout {
  const [saliendo, setSaliendo] = useState(false);

  async function cerrarSesion(): Promise<void> {
    setSaliendo(true);
    // Invalida la sesión en el servidor y borra la cookie; luego el
    // middleware ya no verá sesión y el login queda accesible.
    await signOut();
    window.location.href = '/admin/login';
  }

  return { saliendo, cerrarSesion };
}
