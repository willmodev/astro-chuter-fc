import { useState } from 'react';

import { signOut } from '@/lib/auth/client';

// Única implementación de cierre de sesión del admin: la consumen la
// pantalla "Más" (mobile) y el pie del sidebar (desktop, HU-7.7).
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
