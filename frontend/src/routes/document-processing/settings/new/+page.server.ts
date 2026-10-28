import { fail, redirect } from '@sveltejs/kit';
import { requireUser } from '$lib/server/auth/require-user.js';
import { readParserForm } from '$lib/server/document-parsers/form.js';
import {
  createDocumentParser,
  DuplicateParserNameError
} from '$lib/server/document-parsers/repository.js';
import type { Actions } from './$types';

export const actions: Actions = {
  default: async ({ request, locals }) => {
    const user = requireUser(locals);
    const result = readParserForm(await request.formData());
    if (!result.ok) return fail(400, { errors: result.errors });

    try {
      await createDocumentParser(user.companyId, user.id, result.value);
    } catch (err) {
      if (err instanceof DuplicateParserNameError) {
        return fail(409, { errors: [err.message] });
      }
      throw err;
    }

    redirect(303, '/document-processing/settings');
  }
};
