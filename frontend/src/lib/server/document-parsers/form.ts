import {
  FIELD_KINDS,
  validateParser,
  type FieldDef,
  type FieldKind
} from '$lib/document-parsers/types.js';

export type ParserInput = {
  name: string;
  description: string;
  fields: FieldDef[];
};

export type ParserFormResult = { ok: true; value: ParserInput } | { ok: false; errors: string[] };

const KINDS = new Set<string>(FIELD_KINDS.map((option) => option.value));
const UNREADABLE = 'The fields could not be read. Please try again.';

// Rebuilds the field tree from untrusted JSON, keeping only known properties.
function toFields(raw: unknown): FieldDef[] | null {
  if (!Array.isArray(raw)) return null;
  const fields: FieldDef[] = [];
  for (const item of raw) {
    if (typeof item !== 'object' || item === null) return null;
    const field = item as Record<string, unknown>;
    if (typeof field.kind !== 'string' || !KINDS.has(field.kind)) return null;
    const children = toFields(field.children ?? []);
    if (!children) return null;
    fields.push({
      id: typeof field.id === 'string' && field.id ? field.id : crypto.randomUUID(),
      label: typeof field.label === 'string' ? field.label : '',
      name: typeof field.name === 'string' ? field.name : '',
      kind: field.kind as FieldKind,
      required: field.required === true,
      description: typeof field.description === 'string' ? field.description : '',
      children
    });
  }
  return fields;
}

export function readParserForm(formData: FormData): ParserFormResult {
  const name = String(formData.get('name') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();

  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get('config') ?? '[]'));
  } catch {
    return { ok: false, errors: [UNREADABLE] };
  }

  const fields = toFields(raw);
  if (!fields) return { ok: false, errors: [UNREADABLE] };

  const value: ParserInput = { name, description, fields };
  const errors = validateParser(value);
  return errors.length > 0 ? { ok: false, errors } : { ok: true, value };
}
