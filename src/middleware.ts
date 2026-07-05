import { defineMiddleware } from 'astro:middleware';

import { auth } from '@/lib/auth/server';

const LOGIN = '/admin/login';
const DASHBOARD = '/admin';

// Solo permitimos rutas internas del admin como destino `next` (evita
// open-redirect): debe empezar por "/admin" y no ser un "//host" externo.
function destinoSeguro(next: string | null): string {
  if (!next || !next.startsWith('/admin') || next.startsWith('//')) {
    return DASHBOARD;
  }
  return next;
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  const esAdmin = pathname.startsWith('/admin');
  // Las Actions se sirven en /_actions/**: necesitan `locals` poblado para
  // que `requireUser`/`requireAdmin` funcionen, pero no pasan por el gate.
  const esAction = pathname.startsWith('/_actions');

  // El marketing (todo lo demás) no toca la sesión y queda intacto.
  if (!esAdmin && !esAction) return next();

  const sesion = await auth.api.getSession({
    headers: context.request.headers,
  });
  context.locals.user = sesion?.user ?? null;
  context.locals.session = sesion?.session ?? null;

  if (esAction) return next();

  const enLogin = pathname === LOGIN;

  if (!sesion) {
    if (enLogin) return next();
    const destino = encodeURIComponent(pathname + context.url.search);
    return context.redirect(`${LOGIN}?next=${destino}`);
  }

  // Ya autenticado: no tiene sentido volver al login.
  if (enLogin) {
    return context.redirect(destinoSeguro(context.url.searchParams.get('next')));
  }

  return next();
});
