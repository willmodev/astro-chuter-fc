import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { admin } from 'better-auth/plugins';

import { db } from '@/lib/db/client';
import * as schema from '@/lib/db/schema';

const SECRET =
  import.meta.env?.BETTER_AUTH_SECRET ?? process.env.BETTER_AUTH_SECRET;
const BASE_URL =
  import.meta.env?.BETTER_AUTH_URL ?? process.env.BETTER_AUTH_URL;

const UNA_SEMANA_EN_SEGUNDOS = 60 * 60 * 24 * 7;

export const auth = betterAuth({
  secret: SECRET,
  baseURL: BASE_URL,
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    // Solo un admin crea usuarios: sin registro público.
    disableSignUp: true,
  },
  session: {
    expiresIn: UNA_SEMANA_EN_SEGUNDOS,
  },
  user: {
    additionalFields: {
      // Categorías del entrenador; el admin las fija al crear el usuario.
      cats: {
        type: 'string[]',
        required: false,
        defaultValue: [],
        input: true,
      },
    },
  },
  plugins: [
    admin({
      // El enum de BD acota `role` a estos dos valores.
      defaultRole: 'entrenador',
      adminRoles: ['admin'],
    }),
  ],
});

export type AuthUser = typeof auth.$Infer.Session.user;
export type AuthSession = typeof auth.$Infer.Session.session;
