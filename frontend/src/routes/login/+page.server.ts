import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { validateLogin } from '$lib/auth/login-validation.js';
import { verifyPassword } from '$lib/server/auth/password.js';
import { createSession, setSessionCookie } from '$lib/server/auth/session.js';
import { getDb } from '$lib/server/db/index.js';
import { users } from '$lib/server/db/schema.js';
import type { Actions } from './$types';

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const formData = await request.formData();

    const result = validateLogin({
      email: formData.get('email'),
      password: formData.get('password')
    });

    if (!result.ok) {
      return fail(400, { errors: result.errors });
    }

    const [user] = await getDb()
      .select()
      .from(users)
      .where(eq(users.email, result.value.email))
      .limit(1);

    // The same message is used for unknown email and wrong password so the form does not reveal which accounts exist.
    const valid = user !== undefined && (await verifyPassword(result.value.password, user.passwordHash));
    if (!user || !valid) {
      return fail(401, { formError: 'Invalid email or password.' });
    }

    const { token, expiresAt } = await createSession(user.id);
    setSessionCookie(cookies, token, expiresAt);
    redirect(303, '/');
  }
};
