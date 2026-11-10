/** Splits typed or pasted text into tags on commas and line breaks, dropping blanks. */
export function splitTags(text: string): string[] {
  return text
    .split(/[,\n]/)
    .map((part) => part.trim())
    .filter((part) => part !== '');
}
