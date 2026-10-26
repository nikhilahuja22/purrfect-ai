import type { LayoutServerLoad } from './$types';

// Exposes the signed-in user to every page. The hook has already redirected signed-out requests.
export const load: LayoutServerLoad = ({ locals }) => ({
  user: locals.user ? { name: locals.user.name, email: locals.user.email } : null
});
