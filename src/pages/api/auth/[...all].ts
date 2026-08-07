import { auth } from '@/lib/auth/server';

import type { APIRoute } from 'astro';

// Endpoints de Better Auth (login, logout, plugin admin…): función on-demand.
export const prerender = false;

export const ALL: APIRoute = ({ request }) => auth.handler(request);
