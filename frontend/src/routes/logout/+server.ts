import { redirect, type RequestHandler } from '@sveltejs/kit';
import { clearSessionCookie, deleteSession, SESSION_COOKIE } from '$lib/server/auth/session.js';

export const POST: RequestHandler = async ({ cookies }) => {
  const token = cookies.get(SESSION_COOKIE);
  if (token) {
    await deleteSession(token);
  }
  clearSessionCookie(cookies);
  redirect(303, '/login');
};
