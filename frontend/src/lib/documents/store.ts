// Temporary browser storage until a backend exists. File contents live in file-store.ts.
const STORAGE_KEY = 'purrfect-ai.documents';

export type DocumentStatus = 'awaiting_extraction' | 'parsed';

export type ProcessedDocument = {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
  parserId: string;
  parserName: string;
  status: DocumentStatus;
  createdAt: string;
  // Extracted values keyed by field name. Null until extraction runs.
  data: Record<string, unknown> | null;
};

export function loadDocuments(): ProcessedDocument[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ProcessedDocument[]) : [];
  } catch {
    return [];
  }
}

function writeDocuments(documents: ProcessedDocument[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(documents));
}

export function getDocument(id: string): ProcessedDocument | undefined {
  return loadDocuments().find((document) => document.id === id);
}

export function saveDocument(document: ProcessedDocument): void {
  const documents = loadDocuments();
  const index = documents.findIndex((existing) => existing.id === document.id);
  if (index === -1) {
    documents.unshift(document);
  } else {
    documents[index] = document;
  }
  writeDocuments(documents);
}

export function deleteDocument(id: string): void {
  writeDocuments(loadDocuments().filter((document) => document.id !== id));
}
