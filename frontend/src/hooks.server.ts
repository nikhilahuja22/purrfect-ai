import { redirect } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit/hooks';
import { PUBLIC_PATHS } from '$lib/auth/public-routes.js';
import { SESSION_COOKIE, findUserBySessionToken } from '$lib/server/auth/session.js';

// Runs on every request, including the initial document request (ssr is off, so this is the only server-side check).
export const handle: Handle = async ({ event, resolve }) => {
  const token = event.cookies.get(SESSION_COOKIE);
  const user = token ? await findUserBySessionToken(token) : null;

  event.locals.user = user
    ? { id: user.id, name: user.name, email: user.email, companyId: user.companyId }
    : null;

  // /logout is allowed without a session so a stale cookie can still be cleared.
  const isPublic = PUBLIC_PATHS.includes(event.url.pathname) || event.url.pathname === '/logout';
  if (!user && !isPublic) {
    redirect(303, '/login');
  }

  return resolve(event);
};
