import type { ExtractionStatus } from '$lib/server/db/schema.js';

export const EXTRACTION_STATUS_LABELS: Record<ExtractionStatus, string> = {
  processing: 'Processing',
  extracted: 'Extracted',
  failed: 'Failed'
};

export function extractionBadgeVariant(
  status: ExtractionStatus
): 'default' | 'secondary' | 'destructive' {
  if (status === 'extracted') return 'default';
  if (status === 'failed') return 'destructive';
  return 'secondary';
}
