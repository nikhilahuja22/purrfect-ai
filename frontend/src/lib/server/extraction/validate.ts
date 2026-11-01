import type { FieldDef } from '$lib/document-parsers/types.js';

type CheckResult = {
  // Only the fields defined in the parser. Unknown keys from the model are dropped.
  data: Record<string, unknown>;
  errors: string[];
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const PRIMITIVE_CHECKS: Record<
  'string' | 'number' | 'boolean' | 'date',
  { check: (value: unknown) => boolean; expected: string }
> = {
  string: { check: (v) => typeof v === 'string', expected: 'text' },
  number: { check: (v) => typeof v === 'number' && Number.isFinite(v), expected: 'a number' },
  boolean: { check: (v) => typeof v === 'boolean', expected: 'true or false' },
  date: {
    check: (v) => typeof v === 'string' && DATE_PATTERN.test(v),
    expected: 'a date as YYYY-MM-DD'
  }
};

// Checks the model output against the parser fields.
// Missing required fields and wrong types are returned as errors, not thrown.
export function checkExtraction(fields: FieldDef[], input: unknown): CheckResult {
  const errors: string[] = [];
  const data = checkObject(fields, input, '', errors);
  return { data, errors };
}

function checkObject(
  fields: FieldDef[],
  input: unknown,
  path: string,
  errors: string[]
): Record<string, unknown> {
  if (!isRecord(input)) {
    errors.push(`${path || 'The result'} must be an object.`);
    return {};
  }

  const out: Record<string, unknown> = {};
  for (const field of fields) {
    const fieldPath = path ? `${path}.${field.name}` : field.name;
    const value = input[field.name];
    if (value === undefined || value === null) {
      if (field.required) errors.push(`${fieldPath} is required.`);
      continue;
    }
    out[field.name] = checkValue(field, value, fieldPath, errors);
  }
  return out;
}

function checkValue(field: FieldDef, value: unknown, path: string, errors: string[]): unknown {
  if (field.kind === 'object') {
    return checkObject(field.children, value, path, errors);
  }
  if (field.kind === 'array') {
    if (!Array.isArray(value)) {
      errors.push(`${path} must be a list.`);
      return [];
    }
    return value.map((item, index) => checkObject(field.children, item, `${path}[${index}]`, errors));
  }

  const rule = PRIMITIVE_CHECKS[field.kind];
  if (!rule.check(value)) errors.push(`${path} must be ${rule.expected}.`);
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
