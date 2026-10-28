import { fail } from '@sveltejs/kit';
import { requireUser } from '$lib/server/auth/require-user.js';
import {
  deleteDocumentParser,
  listDocumentParsers,
  ParserInUseError
} from '$lib/server/document-parsers/repository.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const user = requireUser(locals);
  return { parsers: await listDocumentParsers(user.companyId) };
};

export const actions: Actions = {
  delete: async ({ request, locals }) => {
    const user = requireUser(locals);
    const formData = await request.formData();
    try {
      await deleteDocumentParser(user.companyId, String(formData.get('id') ?? ''));
    } catch (err) {
      if (err instanceof ParserInUseError) return fail(409, { message: err.message });
      throw err;
    }
  }
};
