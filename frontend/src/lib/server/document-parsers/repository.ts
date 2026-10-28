import { and, desc, eq } from 'drizzle-orm';
import type { DocumentParser } from '$lib/document-parsers/types.js';
import type { ParserInput } from '$lib/server/document-parsers/form.js';
import { getDb } from '$lib/server/db/index.js';
import { documentParsers, type DocumentParserRow } from '$lib/server/db/schema.js';

const UNIQUE_VIOLATION = '23505';
const FOREIGN_KEY_VIOLATION = '23503';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class DuplicateParserNameError extends Error {
  constructor() {
    super('A document type with this name already exists.');
    this.name = 'DuplicateParserNameError';
  }
}

export class ParserInUseError extends Error {
  constructor() {
    super('This document type has documents extracted with it. Delete those documents first.');
    this.name = 'ParserInUseError';
  }
}

function errorCode(err: unknown): string | undefined {
  const direct = (err as { code?: string } | null)?.code;
  return direct ?? (err as { cause?: { code?: string } } | null)?.cause?.code;
}

function isUniqueViolation(err: unknown): boolean {
  return errorCode(err) === UNIQUE_VIOLATION;
}

function toParser(row: DocumentParserRow): DocumentParser {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    fields: row.config,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

export async function listDocumentParsers(companyId: string): Promise<DocumentParser[]> {
  const rows = await getDb()
    .select()
    .from(documentParsers)
    .where(eq(documentParsers.companyId, companyId))
    .orderBy(desc(documentParsers.updatedAt));
  return rows.map(toParser);
}

export async function getDocumentParser(
  companyId: string,
  id: string
): Promise<DocumentParser | null> {
  if (!UUID_PATTERN.test(id)) return null;
  const [row] = await getDb()
    .select()
    .from(documentParsers)
    .where(and(eq(documentParsers.companyId, companyId), eq(documentParsers.id, id)))
    .limit(1);
  return row ? toParser(row) : null;
}

export async function createDocumentParser(
  companyId: string,
  submitterId: string,
  input: ParserInput
): Promise<void> {
  try {
    await getDb().insert(documentParsers).values({
      companyId,
      submitterId,
      name: input.name,
      description: input.description,
      config: input.fields
    });
  } catch (err) {
    if (isUniqueViolation(err)) throw new DuplicateParserNameError();
    throw err;
  }
}

// Returns false when no parser with that id belongs to the company.
export async function updateDocumentParser(
  companyId: string,
  id: string,
  input: ParserInput
): Promise<boolean> {
  if (!UUID_PATTERN.test(id)) return false;
  try {
    const rows = await getDb()
      .update(documentParsers)
      .set({
        name: input.name,
        description: input.description,
        config: input.fields,
        updatedAt: new Date()
      })
      .where(and(eq(documentParsers.companyId, companyId), eq(documentParsers.id, id)))
      .returning({ id: documentParsers.id });
    return rows.length > 0;
  } catch (err) {
    if (isUniqueViolation(err)) throw new DuplicateParserNameError();
    throw err;
  }
}

export async function deleteDocumentParser(companyId: string, id: string): Promise<void> {
  if (!UUID_PATTERN.test(id)) return;
  try {
    await getDb()
      .delete(documentParsers)
      .where(and(eq(documentParsers.companyId, companyId), eq(documentParsers.id, id)));
  } catch (err) {
    // document_extractions references parsers with ON DELETE RESTRICT.
    if (errorCode(err) === FOREIGN_KEY_VIOLATION) throw new ParserInUseError();
    throw err;
  }
}
