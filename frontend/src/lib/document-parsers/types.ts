export type FieldKind = 'string' | 'number' | 'date' | 'boolean' | 'object' | 'array';

export type FieldDef = {
  id: string;
  // Human-readable label shown to the user, e.g. "Statement start date".
  label: string;
  // Key used in the extracted output, e.g. "start_date".
  name: string;
  kind: FieldKind;
  required: boolean;
  description: string;
  // Nested fields: children of an object, or the per-item fields of an array.
  children: FieldDef[];
};

export type DocumentParser = {
  id: string;
  name: string;
  description: string;
  fields: FieldDef[];
  createdAt: string;
  updatedAt: string;
};

export const FIELD_KINDS: { value: FieldKind; label: string }[] = [
  { value: 'string', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'boolean', label: 'Yes / No' },
  { value: 'object', label: 'Group' },
  { value: 'array', label: 'List (line items)' }
];

const NAME_PATTERN = /^[a-z][a-z0-9_]*$/;

export function isContainer(kind: FieldKind): boolean {
  return kind === 'object' || kind === 'array';
}

export function createField(kind: FieldKind = 'string'): FieldDef {
  return {
    id: crypto.randomUUID(),
    label: '',
    name: '',
    kind,
    required: false,
    description: '',
    children: isContainer(kind) ? [createField()] : []
  };
}

export function createParser(): DocumentParser {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name: '',
    description: '',
    fields: [],
    createdAt: now,
    updatedAt: now
  };
}

export function countFields(fields: FieldDef[]): number {
  return fields.reduce((total, field) => total + 1 + countFields(field.children), 0);
}

export function validateParser(parser: Pick<DocumentParser, 'name' | 'fields'>): string[] {
  const errors: string[] = [];
  if (!parser.name.trim()) errors.push('Document type name is required.');
  if (parser.fields.length === 0) errors.push('Add at least one field.');
  validateFields(parser.fields, 'the document', errors);
  return errors;
}

function validateFields(fields: FieldDef[], where: string, errors: string[]): void {
  const seen = new Set<string>();
  for (const field of fields) {
    const name = field.name;
    if (!name.trim()) {
      errors.push(`A field in ${where} has no name.`);
      continue;
    }
    if (!NAME_PATTERN.test(name)) {
      errors.push(`"${name}" in ${where} must use lowercase letters, numbers and underscores.`);
    }
    if (seen.has(name)) errors.push(`"${name}" is defined twice in ${where}.`);
    seen.add(name);

    if (isContainer(field.kind)) {
      if (field.children.length === 0) {
        errors.push(`"${name}" needs at least one nested field.`);
      }
      validateFields(field.children, `"${name}"`, errors);
    }
  }
}

type JsonSchema = {
  type?: string;
  format?: string;
  description?: string;
  properties?: Record<string, JsonSchema>;
  required?: string[];
  items?: JsonSchema;
  additionalProperties?: boolean;
  title?: string;
};

function objectSchema(fields: FieldDef[]): JsonSchema {
  return {
    type: 'object',
    properties: Object.fromEntries(fields.map((field) => [field.name, fieldSchema(field)])),
    required: fields.filter((field) => field.required).map((field) => field.name),
    additionalProperties: false
  };
}

function fieldSchema(field: FieldDef): JsonSchema {
  let schema: JsonSchema;
  switch (field.kind) {
    case 'object':
      schema = objectSchema(field.children);
      break;
    case 'array':
      schema = { type: 'array', items: objectSchema(field.children) };
      break;
    case 'date':
      schema = { type: 'string', format: 'date' };
      break;
    default:
      schema = { type: field.kind };
  }
  const label = field.label.trim();
  if (label) schema.title = label;
  const description = field.description.trim();
  if (description) schema.description = description;
  return schema;
}

// JSON-schema-style description of what the extraction step should return.
export function toExtractionSchema(
  parser: Pick<DocumentParser, 'name' | 'description' | 'fields'>
): JsonSchema {
  const schema = objectSchema(parser.fields);
  return {
    title: parser.name,
    description: parser.description.trim() || undefined,
    ...schema
  };
}
