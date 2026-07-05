import { useState } from 'react';

import { signIn } from '@/lib/auth/client';

type Estado = 'idle' | 'enviando' | 'error';

// Mensaje deliberadamente genérico: no revela si falló el correo o la
// contraseña (ni si la cuenta existe o está desactivada).
const ERROR_GENERICO = 'Correo o contraseña incorrectos.';

interface UseLogin {
  estado: Estado;
  error: string | null;
  ingresar: (email: string, password: string) => Promise<void>;
}

export function useLogin(destino: string): UseLogin {
  const [estado, setEstado] = useState<Estado>('idle');
  const [error, setError] = useState<string | null>(null);

  async function ingresar(email: string, password: string): Promise<void> {
    setEstado('enviando');
    setError(null);

    const { error: fallo } = await signIn.email({ email, password });

    if (fallo) {
      setEstado('error');
      setError(ERROR_GENERICO);
      return;
    }

    // Sesión iniciada: recargamos hacia el destino para que el middleware
    // ya vea la cookie y sirva la ruta protegida.
    window.location.href = destino;
  }

  return { estado, error, ingresar };
}
