/** Matching the columns of an imported file to the fields of the target, and judging the result. */

export type TargetField = {
  id: string;
  label: string;
  /** The import cannot run until a column is mapped to this field. */
  required?: boolean;
  /** Other header spellings that should map here automatically, such as "tag no". */
  aliases?: readonly string[];
};

/** Source column name → target field id, or `null` when the column is not imported. */
export type ColumnMapping = Readonly<Record<string, string | null>>;

export type MappingRowStatus = 'auto' | 'manual' | 'skipped' | 'duplicate';

/** Lower case, with punctuation and spacing removed, so "Tag No." equals "tag_no". */
export function normalizeHeader(header: string): string {
  return header.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/** Maps each column to the first unused field whose id, label or alias matches its header. */
export function suggestMapping(columns: readonly string[], fields: readonly TargetField[]): Record<string, string | null> {
  const used = new Set<string>();
  const mapping: Record<string, string | null> = {};
  for (const column of columns) {
    const header = normalizeHeader(column);
    const match = fields.find(
      (field) =>
        !used.has(field.id) &&
        [field.id, field.label, ...(field.aliases ?? [])].some((candidate) => normalizeHeader(candidate) === header)
    );
    mapping[column] = match?.id ?? null;
    if (match) used.add(match.id);
  }
  return mapping;
}

/** Required fields no column is mapped to. */
export function missingRequiredFields(mapping: ColumnMapping, fields: readonly TargetField[]): TargetField[] {
  const mapped = new Set(Object.values(mapping));
  return fields.filter((field) => field.required === true && !mapped.has(field.id));
}

/** Field ids that more than one column is mapped to. */
export function duplicateTargets(mapping: ColumnMapping): string[] {
  const counts = new Map<string, number>();
  for (const fieldId of Object.values(mapping)) {
    if (fieldId !== null) counts.set(fieldId, (counts.get(fieldId) ?? 0) + 1);
  }
  return [...counts].filter(([, count]) => count > 1).map(([fieldId]) => fieldId);
}

/** How one column is mapped: by the suggestion, by hand, to a field another column already uses, or not at all. */
export function mappingRowStatus(column: string, mapping: ColumnMapping, suggested: ColumnMapping): MappingRowStatus {
  const fieldId = mapping[column] ?? null;
  if (fieldId === null) return 'skipped';
  if (duplicateTargets(mapping).includes(fieldId)) return 'duplicate';
  return suggested[column] === fieldId ? 'auto' : 'manual';
}
