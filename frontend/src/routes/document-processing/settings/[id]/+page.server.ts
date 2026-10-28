import { error, fail, redirect } from '@sveltejs/kit';
import { requireUser } from '$lib/server/auth/require-user.js';
import { readParserForm } from '$lib/server/document-parsers/form.js';
import {
  DuplicateParserNameError,
  getDocumentParser,
  updateDocumentParser
} from '$lib/server/document-parsers/repository.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
  const user = requireUser(locals);
  const parser = await getDocumentParser(user.companyId, params.id);
  if (!parser) error(404, 'Parser not found');
  return { parser };
};

export const actions: Actions = {
  default: async ({ request, params, locals }) => {
    const user = requireUser(locals);
    const result = readParserForm(await request.formData());
    if (!result.ok) return fail(400, { errors: result.errors });

    let updated: boolean;
    try {
      updated = await updateDocumentParser(user.companyId, params.id, result.value);
    } catch (err) {
      if (err instanceof DuplicateParserNameError) {
        return fail(409, { errors: [err.message] });
      }
      throw err;
    }
    if (!updated) error(404, 'Parser not found');

    redirect(303, '/document-processing/settings');
  }
};
