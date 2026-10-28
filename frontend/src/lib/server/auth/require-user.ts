import { error } from '@sveltejs/kit';

// The auth guard in hooks.server.ts already redirects signed-out users.
// This narrows the type for route code and fails loudly if that guard is ever bypassed.
export function requireUser(locals: App.Locals): NonNullable<App.Locals['user']> {
  if (!locals.user) error(401, 'Not signed in');
  return locals.user;
}
