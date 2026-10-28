import { requireUser } from '$lib/server/auth/require-user.js';
import { listDocumentParsers } from '$lib/server/document-parsers/repository.js';
import { deleteDocument, listDocuments } from '$lib/server/documents/repository.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const user = requireUser(locals);
  const [documents, parsers] = await Promise.all([
    listDocuments(user.companyId),
    listDocumentParsers(user.companyId)
  ]);
  return { documents, parsers };
};

export const actions: Actions = {
  delete: async ({ request, locals }) => {
    const user = requireUser(locals);
    const formData = await request.formData();
    await deleteDocument(user.companyId, String(formData.get('id') ?? ''));
  }
};
