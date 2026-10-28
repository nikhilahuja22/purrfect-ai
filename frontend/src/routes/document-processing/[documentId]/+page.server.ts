import { SAMPLE_INVOICE_DATA } from '$lib/documents/sample-extraction.js';
import { requireUser } from '$lib/server/auth/require-user.js';
import { completeExtraction, getDocumentDetail } from '$lib/server/documents/repository.js';
import { createDownloadUrl, documentStorageKey } from '$lib/server/storage/s3.js';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
  const user = requireUser(locals);
  const document = await getDocumentDetail(user.companyId, params.documentId);
  const fileUrl = document
    ? await createDownloadUrl(documentStorageKey(user.companyId, document.id))
    : null;
  return { document, fileUrl };
};

export const actions: Actions = {
  // Placeholder until the AI backend exists. Fills a pending run with the sample invoice data.
  loadSample: async ({ request, locals }) => {
    const user = requireUser(locals);
    const formData = await request.formData();
    const updated = await completeExtraction(
      user.companyId,
      String(formData.get('extractionId') ?? ''),
      SAMPLE_INVOICE_DATA
    );
    if (!updated) return fail(404, { message: 'Extraction not found.' });
  }
};
