import { and, desc, eq, lt, ne, or } from 'drizzle-orm';
import type { FieldDef } from '$lib/document-parsers/types.js';
import { getDb } from '$lib/server/db/index.js';
import {
  documentExtractions,
  documentParsers,
  documents,
  type ExtractionStatus
} from '$lib/server/db/schema.js';
import { documentStorageKey } from '$lib/server/storage/s3.js';

export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type NewDocumentInput = {
  // Chosen by the server when the upload URL was created. The file is already stored under this id.
  id: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  parserId: string;
};

export type DocumentSummary = {
  id: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  createdAt: string;
  // The most recent extraction run, or null if the document has none.
  latestExtraction: { status: ExtractionStatus; parserName: string } | null;
};

export type ExtractionRun = {
  id: string;
  parserName: string;
  fields: FieldDef[];
  status: ExtractionStatus;
  data: Record<string, unknown> | null;
  error: string | null;
  createdAt: string;
};

export type DocumentDetail = {
  id: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  createdAt: string;
  // Newest first. The first item is the latest extraction run.
  extractions: ExtractionRun[];
};

export async function listDocuments(companyId: string): Promise<DocumentSummary[]> {
  const db = getDb();
  const docRows = await db
    .select()
    .from(documents)
    .where(eq(documents.companyId, companyId))
    .orderBy(desc(documents.createdAt));
  if (docRows.length === 0) return [];

  // Runs are newest first, so the first run seen for each document is its latest.
  const runRows = await db
    .select({
      documentId: documentExtractions.documentId,
      status: documentExtractions.status,
      parserName: documentParsers.name
    })
    .from(documentExtractions)
    .innerJoin(documents, eq(documentExtractions.documentId, documents.id))
    .innerJoin(documentParsers, eq(documentExtractions.parserId, documentParsers.id))
    .where(eq(documents.companyId, companyId))
    .orderBy(desc(documentExtractions.createdAt));

  const latest = new Map<string, { status: ExtractionStatus; parserName: string }>();
  for (const run of runRows) {
    if (!latest.has(run.documentId)) {
      latest.set(run.documentId, { status: run.status, parserName: run.parserName });
    }
  }

  return docRows.map((doc) => ({
    id: doc.id,
    fileName: doc.fileName,
    contentType: doc.contentType,
    sizeBytes: doc.sizeBytes,
    createdAt: doc.createdAt.toISOString(),
    latestExtraction: latest.get(doc.id) ?? null
  }));
}

export async function getDocumentDetail(
  companyId: string,
  id: string
): Promise<DocumentDetail | null> {
  if (!UUID_PATTERN.test(id)) return null;
  const db = getDb();
  const [doc] = await db
    .select()
    .from(documents)
    .where(and(eq(documents.companyId, companyId), eq(documents.id, id)))
    .limit(1);
  if (!doc) return null;

  const runs = await db
    .select({
      id: documentExtractions.id,
      status: documentExtractions.status,
      data: documentExtractions.data,
      error: documentExtractions.error,
      createdAt: documentExtractions.createdAt,
      parserName: documentParsers.name,
      fields: documentParsers.config
    })
    .from(documentExtractions)
    .innerJoin(documentParsers, eq(documentExtractions.parserId, documentParsers.id))
    .where(eq(documentExtractions.documentId, doc.id))
    .orderBy(desc(documentExtractions.createdAt));

  return {
    id: doc.id,
    fileName: doc.fileName,
    contentType: doc.contentType,
    sizeBytes: doc.sizeBytes,
    createdAt: doc.createdAt.toISOString(),
    extractions: runs.map((run) => ({
      id: run.id,
      parserName: run.parserName,
      fields: run.fields,
      status: run.status,
      data: run.data,
      error: run.error,
      createdAt: run.createdAt.toISOString()
    }))
  };
}

// Stores the file record and its first extraction run (status processing).
// Returns the new document and run ids, or null if the parser does not belong to the company.
export async function createDocument(
  companyId: string,
  submitterId: string,
  input: NewDocumentInput
): Promise<{ documentId: string; extractionId: string } | null> {
  if (!UUID_PATTERN.test(input.parserId)) return null;
  const db = getDb();
  const [parser] = await db
    .select({ id: documentParsers.id })
    .from(documentParsers)
    .where(and(eq(documentParsers.companyId, companyId), eq(documentParsers.id, input.parserId)))
    .limit(1);
  if (!parser) return null;

  const id = input.id;
  const extractionId = await db.transaction(async (tx) => {
    await tx.insert(documents).values({
      id,
      companyId,
      submitterId,
      fileName: input.fileName,
      contentType: input.contentType,
      sizeBytes: input.sizeBytes,
      storageKey: documentStorageKey(companyId, id)
    });
    const [run] = await tx
      .insert(documentExtractions)
      .values({ documentId: id, parserId: parser.id })
      .returning({ id: documentExtractions.id });
    return run.id;
  });
  return { documentId: id, extractionId };
}

// Deleting a document also deletes its extraction runs (cascade).
// Returns the storage key of the deleted file, or null if nothing was deleted.
export async function deleteDocument(companyId: string, id: string): Promise<string | null> {
  if (!UUID_PATTERN.test(id)) return null;
  const [deleted] = await getDb()
    .delete(documents)
    .where(and(eq(documents.companyId, companyId), eq(documents.id, id)))
    .returning({ storageKey: documents.storageKey });
  return deleted?.storageKey ?? null;
}

// Marks one run as extracted with the given data. Returns false if the run is not in the company.
export async function completeExtraction(
  companyId: string,
  extractionId: string,
  data: Record<string, unknown>
): Promise<boolean> {
  if (!UUID_PATTERN.test(extractionId)) return false;
  const db = getDb();
  const [owned] = await db
    .select({ id: documentExtractions.id })
    .from(documentExtractions)
    .innerJoin(documents, eq(documentExtractions.documentId, documents.id))
    .where(and(eq(documents.companyId, companyId), eq(documentExtractions.id, extractionId)))
    .limit(1);
  if (!owned) return false;

  await db
    .update(documentExtractions)
    .set({ status: 'extracted', data, error: null, updatedAt: new Date() })
    .where(eq(documentExtractions.id, extractionId));
  return true;
}

// Marks a run as failed and stores the reason. Returns false if the run is not in the company.
export async function failExtraction(
  companyId: string,
  extractionId: string,
  message: string
): Promise<boolean> {
  if (!UUID_PATTERN.test(extractionId)) return false;
  const db = getDb();
  const [owned] = await db
    .select({ id: documentExtractions.id })
    .from(documentExtractions)
    .innerJoin(documents, eq(documentExtractions.documentId, documents.id))
    .where(and(eq(documents.companyId, companyId), eq(documentExtractions.id, extractionId)))
    .limit(1);
  if (!owned) return false;

  await db
    .update(documentExtractions)
    .set({ status: 'failed', error: message, updatedAt: new Date() })
    .where(eq(documentExtractions.id, extractionId));
  return true;
}

// A processing run untouched for this long is treated as stuck (for example, the server stopped mid-run).
const STALE_AFTER_MS = 10 * 60 * 1000;

// Puts a run back to processing so it can run again. Returns false if the run is not in the company,
// or is processing and not stale.
export async function resetExtraction(companyId: string, extractionId: string): Promise<boolean> {
  if (!UUID_PATTERN.test(extractionId)) return false;
  const db = getDb();
  const [owned] = await db
    .select({ id: documentExtractions.id })
    .from(documentExtractions)
    .innerJoin(documents, eq(documentExtractions.documentId, documents.id))
    .where(and(eq(documents.companyId, companyId), eq(documentExtractions.id, extractionId)))
    .limit(1);
  if (!owned) return false;

  const staleBefore = new Date(Date.now() - STALE_AFTER_MS);
  const updated = await db
    .update(documentExtractions)
    .set({ status: 'processing', data: null, error: null, updatedAt: new Date() })
    .where(
      and(
        eq(documentExtractions.id, extractionId),
        or(
          ne(documentExtractions.status, 'processing'),
          lt(documentExtractions.updatedAt, staleBefore)
        )
      )
    )
    .returning({ id: documentExtractions.id });
  return updated.length > 0;
}

// Everything the background job needs for one run. Returns null if the run is not in the company.
export type ExtractionJob = {
  extractionId: string;
  documentId: string;
  fileName: string;
  contentType: string;
  storageKey: string;
  parserName: string;
  parserDescription: string;
  fields: FieldDef[];
};

export async function getExtractionJob(
  companyId: string,
  extractionId: string
): Promise<ExtractionJob | null> {
  if (!UUID_PATTERN.test(extractionId)) return null;
  const [row] = await getDb()
    .select({
      extractionId: documentExtractions.id,
      documentId: documents.id,
      fileName: documents.fileName,
      contentType: documents.contentType,
      storageKey: documents.storageKey,
      parserName: documentParsers.name,
      parserDescription: documentParsers.description,
      fields: documentParsers.config
    })
    .from(documentExtractions)
    .innerJoin(documents, eq(documentExtractions.documentId, documents.id))
    .innerJoin(documentParsers, eq(documentExtractions.parserId, documentParsers.id))
    .where(and(eq(documents.companyId, companyId), eq(documentExtractions.id, extractionId)))
    .limit(1);
  return row ?? null;
}
