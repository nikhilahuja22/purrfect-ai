import { fail, redirect } from '@sveltejs/kit';
import { validateSignUp } from '$lib/auth/sign-up-validation.js';
import { createSession, setSessionCookie } from '$lib/server/auth/session.js';
import { EmailTakenError, signUp } from '$lib/server/auth/sign-up.js';
import type { Actions } from './$types';

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const formData = await request.formData();

    const result = validateSignUp({
      name: formData.get('name'),
      companyName: formData.get('companyName'),
      email: formData.get('email'),
      password: formData.get('password')
    });

    if (!result.ok) {
      return fail(400, { errors: result.errors });
    }

    let account: Awaited<ReturnType<typeof signUp>>;
    try {
      account = await signUp(result.value);
    } catch (err) {
      if (err instanceof EmailTakenError) {
        return fail(409, { errors: { email: err.message } });
      }
      console.error('Sign-up failed', err);
      return fail(500, { formError: 'Could not create the account. Please try again.' });
    }

    // New accounts start signed in.
    const { token, expiresAt } = await createSession(account.user.id);
    setSessionCookie(cookies, token, expiresAt);
    redirect(303, '/');
  }
};
