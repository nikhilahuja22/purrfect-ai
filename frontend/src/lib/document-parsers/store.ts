import type { DocumentParser, FieldDef } from '$lib/document-parsers/types.js';

// Temporary browser storage until a backend exists.
const STORAGE_KEY = 'purrfect-ai.document-parsers';

// Fills in fields added after a parser was saved (e.g. label).
function normalizeFields(fields: FieldDef[] = []): FieldDef[] {
  return fields.map((field) => ({
    ...field,
    label: field.label ?? '',
    children: normalizeFields(field.children)
  }));
}

export function loadParsers(): DocumentParser[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsers = JSON.parse(raw) as DocumentParser[];
    return parsers.map((parser) => ({ ...parser, fields: normalizeFields(parser.fields) }));
  } catch {
    return [];
  }
}

function writeParsers(parsers: DocumentParser[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(parsers));
}

export function getParser(id: string): DocumentParser | undefined {
  return loadParsers().find((parser) => parser.id === id);
}

export function saveParser(parser: DocumentParser): void {
  const parsers = loadParsers();
  const updated: DocumentParser = { ...parser, updatedAt: new Date().toISOString() };
  const index = parsers.findIndex((existing) => existing.id === parser.id);
  if (index === -1) {
    parsers.push(updated);
  } else {
    parsers[index] = updated;
  }
  writeParsers(parsers);
}

export function deleteParser(id: string): void {
  writeParsers(loadParsers().filter((parser) => parser.id !== id));
}
