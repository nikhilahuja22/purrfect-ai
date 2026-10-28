import { requireUser } from '$lib/server/auth/require-user.js';
import { createUploadUrl, documentStorageKey } from '$lib/server/storage/s3.js';
import type { RequestHandler } from './$types';

// Step 1 of an upload. Returns a new document id and a presigned PUT URL.
// Nothing is saved to the database here; the document row is created after the file is in S3.
export const POST: RequestHandler = async ({ request, locals }) => {
  const user = requireUser(locals);
  const body = (await request.json().catch(() => null)) as { contentType?: unknown } | null;
  const contentType =
    typeof body?.contentType === 'string' && body.contentType !== ''
      ? body.contentType
      : 'application/octet-stream';

  const id = crypto.randomUUID();
  const uploadUrl = await createUploadUrl(documentStorageKey(user.companyId, id), contentType);
  return Response.json({ id, uploadUrl, contentType }, { status: 201 });
};
