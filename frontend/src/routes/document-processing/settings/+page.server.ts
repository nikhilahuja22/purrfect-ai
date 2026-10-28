import { requireUser } from '$lib/server/auth/require-user.js';
import { deleteDocumentParser, listDocumentParsers } from '$lib/server/document-parsers/repository.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const user = requireUser(locals);
  return { parsers: await listDocumentParsers(user.companyId) };
};

export const actions: Actions = {
  delete: async ({ request, locals }) => {
    const user = requireUser(locals);
    const formData = await request.formData();
    await deleteDocumentParser(user.companyId, String(formData.get('id') ?? ''));
  }
};
