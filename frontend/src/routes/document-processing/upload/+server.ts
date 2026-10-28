import { requireUser } from '$lib/server/auth/require-user.js';
import { createDocument, type NewDocumentInput } from '$lib/server/documents/repository.js';
import type { RequestHandler } from './$types';

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== '';
}

function parseUpload(body: unknown): NewDocumentInput | null {
  if (typeof body !== 'object' || body === null) return null;
  const { fileName, contentType, sizeBytes, parserId } = body as Record<string, unknown>;
  if (!isNonEmptyString(fileName) || typeof contentType !== 'string') return null;
  if (typeof sizeBytes !== 'number' || !Number.isSafeInteger(sizeBytes) || sizeBytes < 0) return null;
  if (!isNonEmptyString(parserId)) return null;
  return { fileName, contentType, sizeBytes, parserId };
}

// Creates the document record. The file bytes are stored in the browser under the returned id.
export const POST: RequestHandler = async ({ request, locals }) => {
  const user = requireUser(locals);
  const input = parseUpload(await request.json().catch(() => null));
  if (!input) return new Response('Invalid upload.', { status: 400 });

  const id = await createDocument(user.companyId, user.id, input);
  if (!id) return new Response('Document type not found.', { status: 404 });
  return Response.json({ id }, { status: 201 });
};
