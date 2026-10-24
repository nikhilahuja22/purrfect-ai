import { redirect } from '@sveltejs/kit';
import { loadSession } from '$lib/auth/session.svelte.js';

// Session lives in localStorage, so the app renders only in the browser.
export const ssr = false;

export function load({ url }) {
  const signedIn = loadSession() !== null;
  if (!signedIn && url.pathname !== '/login') {
    redirect(307, '/login');
  }
}
