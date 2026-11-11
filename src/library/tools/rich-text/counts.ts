/** Words in a text: runs of characters between white space, ignoring Markdown markers on their own. */
export function countWords(text: string): number {
  return text.split(/\s+/).filter((word) => /[\p{L}\p{N}]/u.test(word)).length;
}

/** Characters as people count them: a letter with an accent or an emoji is one, a line break is one. */
export function countCharacters(text: string): number {
  return Array.from(text.replace(/\r\n/g, '\n')).length;
}

export type LengthStatus = 'ok' | 'near' | 'over';

export type LengthLimits = {
  /** Where the counter starts warning. The text is still accepted. */
  soft?: number;
  /** The most that can be saved. */
  max?: number;
};

/** Where a length stands against a soft and a hard limit. */
export function lengthStatus(length: number, limits: LengthLimits): LengthStatus {
  if (limits.max !== undefined && length > limits.max) return 'over';
  if (limits.soft !== undefined && length > limits.soft) return 'near';
  return 'ok';
}

const NUMBER = new Intl.NumberFormat('en-US');

/** The counter text: `861 / 2,000 characters`, or `2,014 / 2,000 characters, 14 over`. */
export function describeLength(length: number, limits: LengthLimits): string {
  if (limits.max === undefined) return `${NUMBER.format(length)} ${length === 1 ? 'character' : 'characters'}`;
  const base = `${NUMBER.format(length)} / ${NUMBER.format(limits.max)} characters`;
  return length > limits.max ? `${base}, ${NUMBER.format(length - limits.max)} over` : base;
}
