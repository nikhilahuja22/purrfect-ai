import type { OcrLine, OcrPage } from './ocr.js';

// Caps the spaces between two text pieces so one far-away column does not add a huge gap.
const MAX_GAP_SPACES = 40;

// Turns OCR boxes into plain text with rough columns kept, so the model can see which values share a row.
export function renderLayout(pages: OcrPage[]): string {
  return pages.map(renderPage).join('\n\n');
}

function renderPage(page: OcrPage): string {
  const charWidth = averageCharWidth(page.lines);
  const rows = groupRows(page.lines).map((row) => renderRow(row, charWidth));
  return `--- Page ${page.pageNumber} ---\n${rows.join('\n')}`;
}

// Pixels per character, estimated from the lines on this page.
function averageCharWidth(lines: OcrLine[]): number {
  let width = 0;
  let chars = 0;
  for (const line of lines) {
    width += line.x1 - line.x0;
    chars += line.text.length;
  }
  return chars > 0 && width > 0 ? width / chars : 10;
}

// Lines whose vertical centres are close enough share one row.
function groupRows(lines: OcrLine[]): OcrLine[][] {
  const sorted = [...lines].sort((a, b) => centreY(a) - centreY(b));
  const rows: OcrLine[][] = [];
  for (const line of sorted) {
    const last = rows.at(-1);
    const tolerance = (line.y1 - line.y0) * 0.5;
    if (last && Math.abs(centreY(line) - centreY(last[0])) <= tolerance) {
      last.push(line);
    } else {
      rows.push([line]);
    }
  }
  return rows;
}

function renderRow(row: OcrLine[], charWidth: number): string {
  const ordered = [...row].sort((a, b) => a.x0 - b.x0);
  let out = '';
  for (const line of ordered) {
    const target = Math.round(line.x0 / charWidth);
    const spaces =
      out.length === 0
        ? Math.min(target, MAX_GAP_SPACES)
        : Math.min(Math.max(target - out.length, 1), MAX_GAP_SPACES);
    out += ' '.repeat(spaces) + line.text;
  }
  return out.trimEnd();
}

function centreY(line: OcrLine): number {
  return (line.y0 + line.y1) / 2;
}
