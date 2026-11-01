import { toExtractionSchema } from '$lib/document-parsers/types.js';
import {
  completeExtraction,
  failExtraction,
  getExtractionJob
} from '$lib/server/documents/repository.js';
import { getIntegrationSecret } from '$lib/server/integrations/repository.js';
import { getObjectBytes } from '$lib/server/storage/s3.js';
import { askDeepSeekForJson } from './deepseek.js';
import { renderLayout } from './layout.js';
import { ocrDocument } from './ocr.js';
import { checkExtraction } from './validate.js';

// Keeps the prompt well inside the model's context window.
const MAX_TEXT_CHARS = 120_000;

// Runs OCR, then DeepSeek, then saves the result on the run.
// Does not throw. Any failure is saved on the run as status failed.
export async function runExtraction(companyId: string, extractionId: string): Promise<void> {
  try {
    const job = await getExtractionJob(companyId, extractionId);
    if (!job) return;

    const integration = await getIntegrationSecret(companyId, 'deepseek');
    if (!integration) throw new Error('Connect DeepSeek on the Integrations page first.');

    const bytes = await getObjectBytes(job.storageKey);
    const pages = await ocrDocument(bytes, job.contentType);
    const text = renderLayout(pages);
    if (text.trim() === '') throw new Error('No text was found in the document.');
    if (text.length > MAX_TEXT_CHARS) {
      throw new Error('The document has too much text to extract in one request.');
    }

    const schema = toExtractionSchema({
      name: job.parserName,
      description: job.parserDescription,
      fields: job.fields
    });
    const raw = await askDeepSeekForJson({
      apiKey: integration.apiKey,
      model: integration.defaultModel ?? 'deepseek-chat',
      system: buildSystemPrompt(schema),
      user: `Document text from OCR. Spaces show the layout and "--- Page N ---" marks pages.\n\n${text}`
    });

    const { data, errors } = checkExtraction(job.fields, raw);
    if (errors.length > 0) {
      throw new Error(`The result did not match the parser: ${errors.slice(0, 3).join(' ')}`);
    }
    await completeExtraction(companyId, extractionId, data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Extraction failed.';
    await failExtraction(companyId, extractionId, message).catch(() => false);
  }
}

function buildSystemPrompt(schema: unknown): string {
  return [
    'You extract structured data from the OCR text of one document.',
    'Respond with a single JSON object that matches the JSON schema below.',
    'Use null for any value that is not in the document.',
    'Use YYYY-MM-DD for dates and plain numbers without currency symbols or thousand separators.',
    JSON.stringify(schema, null, 2)
  ].join('\n\n');
}
