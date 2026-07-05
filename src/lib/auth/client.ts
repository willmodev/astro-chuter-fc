import { adminClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

// Sin `baseURL`: el cliente usa el origen actual (window.location.origin), así
// login/logout pegan al mismo host donde corre la app (localhost en dev,
// chuterfc.com en prod) y la cookie de sesión queda en el dominio correcto.
export const authClient = createAuthClient({
  plugins: [adminClient()],
});

export const { signIn, signOut, useSession } = authClient;
