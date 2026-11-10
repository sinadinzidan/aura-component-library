export type ValidationCounts = { valid: number; warnings: number; errors: number };

const NUMBER = new Intl.NumberFormat('en-US');

/** One sentence that says what the counts mean for the import. */
export function validationVerdict(counts: ValidationCounts, noun: { one: string; other: string }): string {
  const rows = (count: number) => `${NUMBER.format(count)} ${count === 1 ? noun.one : noun.other}`;
  if (counts.valid + counts.warnings + counts.errors === 0) return `No ${noun.other} to check.`;
  if (counts.errors > 0) return `${rows(counts.errors)} cannot be imported until fixed or skipped.`;
  if (counts.warnings > 0) return `Every ${noun.one} can be imported. ${rows(counts.warnings)} will be imported with a warning.`;
  return `All ${rows(counts.valid)} are ready to import.`;
}
