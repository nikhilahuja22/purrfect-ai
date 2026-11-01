import { fail } from '@sveltejs/kit';
import { requireUser } from '$lib/server/auth/require-user.js';
import { getDocumentDetail, resetExtraction } from '$lib/server/documents/repository.js';
import { runExtraction } from '$lib/server/extraction/run.js';
import { createDownloadUrl, documentStorageKey } from '$lib/server/storage/s3.js';
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
  reprocess: async ({ request, locals }) => {
    const user = requireUser(locals);
    const formData = await request.formData();
    const extractionId = String(formData.get('extractionId') ?? '');
    const reset = await resetExtraction(user.companyId, extractionId);
    if (!reset) {
      return fail(409, {
        message: 'This extraction is already running or was not found. Try again in a few minutes if it is stuck.'
      });
    }
    // Runs in the background. The page refreshes while the run is processing.
    void runExtraction(user.companyId, extractionId);
  }
};
