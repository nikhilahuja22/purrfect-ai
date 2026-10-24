// Local session only. Replace with a real auth provider when a backend exists.
const STORAGE_KEY = 'purrfect-ai.session';

export type Session = { email: string };

export const session = $state<{ current: Session | null }>({ current: null });

export function loadSession(): Session | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    session.current = raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    session.current = null;
  }
  return session.current;
}

export function signIn(email: string): void {
  const next: Session = { email };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  session.current = next;
}

export function signOut(): void {
  localStorage.removeItem(STORAGE_KEY);
  session.current = null;
}
