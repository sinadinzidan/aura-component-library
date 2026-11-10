/** Pure layout for seven-segment numerals. Units are SVG user units; a digit cell is 12 × 20. */

export type SegmentId = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g';

export const SEGMENT_IDS: readonly SegmentId[] = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];

export const DIGIT_WIDTH = 12;
export const DIGIT_HEIGHT = 20;
const DIGIT_GAP = 4;
const MARK_WIDTH = 4;
const HALF_THICKNESS = 1.1;

/** Lit segments per character: a top, b top right, c bottom right, d bottom, e bottom left, f top left, g middle. */
const SEGMENTS: Record<string, readonly SegmentId[]> = {
  '0': ['a', 'b', 'c', 'd', 'e', 'f'],
  '1': ['b', 'c'],
  '2': ['a', 'b', 'g', 'e', 'd'],
  '3': ['a', 'b', 'g', 'c', 'd'],
  '4': ['f', 'g', 'b', 'c'],
  '5': ['a', 'f', 'g', 'c', 'd'],
  '6': ['a', 'f', 'g', 'e', 'c', 'd'],
  '7': ['a', 'b', 'c'],
  '8': ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
  '9': ['a', 'b', 'c', 'd', 'f', 'g'],
  '-': ['g'],
  '−': ['g'],
  ' ': [],
};

export type NumeralGlyph =
  | { kind: 'digit'; char: string; x: number; lit: readonly SegmentId[] }
  | { kind: 'colon' | 'dot'; char: string; x: number };

/** Segments lit for a character. Unknown characters light nothing. */
export function segmentsFor(char: string): readonly SegmentId[] {
  return SEGMENTS[char] ?? [];
}

/** Whether a character can be shown: digits, minus, space, colon, point and thousands comma. */
export function isNumeralChar(char: string): boolean {
  return char in SEGMENTS || char === ':' || char === '.' || char === ',';
}

/** Positions every character of `text` on one line. Commas are dropped; colons and points take a narrow cell. */
export function layoutNumerals(text: string): { glyphs: NumeralGlyph[]; width: number } {
  const glyphs: NumeralGlyph[] = [];
  let x = 0;
  for (const char of text) {
    if (char === ',') continue;
    if (char === ':' || char === '.') {
      glyphs.push({ kind: char === ':' ? 'colon' : 'dot', char, x });
      x += MARK_WIDTH + DIGIT_GAP;
    } else {
      glyphs.push({ kind: 'digit', char, x, lit: segmentsFor(char) });
      x += DIGIT_WIDTH + DIGIT_GAP;
    }
  }
  return { glyphs, width: Math.max(x - DIGIT_GAP, 0) };
}

function horizontal(cy: number): string {
  const t = HALF_THICKNESS;
  const left = 1.6;
  const right = DIGIT_WIDTH - 1.6;
  return `${left},${cy} ${left + t},${cy - t} ${right - t},${cy - t} ${right},${cy} ${right - t},${cy + t} ${left + t},${cy + t}`;
}

function vertical(cx: number, top: number, bottom: number): string {
  const t = HALF_THICKNESS;
  return `${cx},${top} ${cx + t},${top + t} ${cx + t},${bottom - t} ${cx},${bottom} ${cx - t},${bottom - t} ${cx - t},${top + t}`;
}

/** Polygon points of one segment inside a digit cell whose top-left corner is the origin. */
export function segmentPoints(id: SegmentId): string {
  const mid = DIGIT_HEIGHT / 2;
  switch (id) {
    case 'a':
      return horizontal(1.2);
    case 'g':
      return horizontal(mid);
    case 'd':
      return horizontal(DIGIT_HEIGHT - 1.2);
    case 'f':
      return vertical(1.2, 1.8, mid - 0.6);
    case 'b':
      return vertical(DIGIT_WIDTH - 1.2, 1.8, mid - 0.6);
    case 'e':
      return vertical(1.2, mid + 0.6, DIGIT_HEIGHT - 1.8);
    case 'c':
      return vertical(DIGIT_WIDTH - 1.2, mid + 0.6, DIGIT_HEIGHT - 1.8);
  }
}
