import { dev } from '$app/env';
import type { Cookies } from '@sveltejs/kit';
import { and, eq, gt } from 'drizzle-orm';
import { getDb } from '$lib/server/db/index.js';
import { sessions, users, type User } from '$lib/server/db/schema.js';

export const SESSION_COOKIE = 'purrfect_session';
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// Web Crypto is used instead of node:crypto so no Node type package is needed.
async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function generateToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Creates a session row and returns the raw token for the cookie. The raw token is never stored.
export async function createSession(userId: string): Promise<{ token: string; expiresAt: Date }> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await getDb().insert(sessions).values({
    tokenHash: await hashToken(token),
    userId,
    expiresAt
  });

  return { token, expiresAt };
}

// Returns the user for a valid, unexpired token, or null.
export async function findUserBySessionToken(token: string): Promise<User | null> {
  const tokenHash = await hashToken(token);
  const [row] = await getDb()
    .select({ user: users })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.tokenHash, tokenHash), gt(sessions.expiresAt, new Date())))
    .limit(1);

  return row?.user ?? null;
}

export async function deleteSession(token: string): Promise<void> {
  await getDb().delete(sessions).where(eq(sessions.tokenHash, await hashToken(token)));
}

// Ends every session for a user, for example after a password change.
export async function deleteAllSessionsForUser(userId: string): Promise<void> {
  await getDb().delete(sessions).where(eq(sessions.userId, userId));
}

export function setSessionCookie(cookies: Cookies, token: string, expiresAt: Date): void {
  cookies.set(SESSION_COOKIE, token, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: !dev,
    expires: expiresAt
  });
}

export function clearSessionCookie(cookies: Cookies): void {
  cookies.delete(SESSION_COOKIE, { path: '/' });
}
