import type { APIRoute } from 'astro';

import { auth } from '@/lib/auth/server';

// Endpoints de Better Auth (login, logout, plugin admin…): función on-demand.
export const prerender = false;

export const ALL: APIRoute = ({ request }) => auth.handler(request);
