import { requireUser } from '$lib/server/auth/require-user.js';
import { createDocument, UUID_PATTERN, type NewDocumentInput } from '$lib/server/documents/repository.js';
import { documentStorageKey, getObjectSize } from '$lib/server/storage/s3.js';
import type { RequestHandler } from './$types';

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== '';
}

function parseUpload(body: unknown): NewDocumentInput | null {
  if (typeof body !== 'object' || body === null) return null;
  const { id, fileName, contentType, sizeBytes, parserId } = body as Record<string, unknown>;
  if (!isNonEmptyString(id) || !UUID_PATTERN.test(id)) return null;
  if (!isNonEmptyString(fileName) || typeof contentType !== 'string') return null;
  if (typeof sizeBytes !== 'number' || !Number.isSafeInteger(sizeBytes) || sizeBytes < 0) return null;
  if (!isNonEmptyString(parserId)) return null;
  return { id, fileName, contentType, sizeBytes, parserId };
}

// Step 3 of an upload. Creates the document row only if the file is already in S3 with the reported size.
export const POST: RequestHandler = async ({ request, locals }) => {
  const user = requireUser(locals);
  const input = parseUpload(await request.json().catch(() => null));
  if (!input) return new Response('Invalid upload.', { status: 400 });

  const storedSize = await getObjectSize(documentStorageKey(user.companyId, input.id));
  if (storedSize !== input.sizeBytes) {
    return new Response('File not found in storage.', { status: 409 });
  }

  const id = await createDocument(user.companyId, user.id, input);
  if (!id) return new Response('Document type not found.', { status: 404 });
  return Response.json({ id }, { status: 201 });
};
