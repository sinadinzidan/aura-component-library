/**
 * A small pivot engine: groups flat records by one or more row fields and one column field, and
 * aggregates a measure (sum, count or average) in every group and cell. Subtotals and the grand
 * total are computed from the underlying records, so an average of averages is never shown.
 */

export type PivotValue = string | number;
export type PivotRecord = Readonly<Record<string, PivotValue>>;
export type Aggregation = 'sum' | 'count' | 'average';

export type PivotSpec = {
  /** Fields to group rows by, outermost first. Empty gives only the grand total. */
  rows: readonly string[];
  /** Field whose values become columns; `null` gives one "All" column. */
  column: string | null;
  /** Field to aggregate. Ignored for `count`. */
  measure: string;
  aggregation: Aggregation;
  /** Preferred order of values for a field; values not listed follow in natural order. */
  order?: Readonly<Record<string, readonly string[]>>;
};

/** One aggregated figure and the records behind it. */
export type PivotCell = {
  /** `null` when no record falls in the cell. */
  value: number | null;
  count: number;
  /** Indexes into the input records, for drill-through. */
  records: readonly number[];
};

export type PivotColumn = { key: string; label: string };

export type PivotGroup = {
  /** Path of the group, unique in the table: `Compression/Compressors`. */
  id: string;
  field: string;
  key: string;
  label: string;
  level: number;
  /** One cell per column; for a parent this is its subtotal. */
  cells: readonly PivotCell[];
  total: PivotCell;
  children: readonly PivotGroup[];
};

export type PivotResult = {
  columns: readonly PivotColumn[];
  groups: readonly PivotGroup[];
  /** Totals across all rows: one cell per column and the overall total. */
  grandTotal: { cells: readonly PivotCell[]; total: PivotCell };
  /** Smallest and largest value among the body cells (groups and totals excluded), for heat shading. */
  range: { min: number; max: number } | null;
  recordCount: number;
};

const ALL_KEY = 'All';

function compare(field: string, order: PivotSpec['order']): (a: string, b: string) => number {
  const listed = order?.[field] ?? [];
  return (a, b) => {
    const ia = listed.indexOf(a);
    const ib = listed.indexOf(b);
    if (ia !== -1 || ib !== -1) return (ia === -1 ? Infinity : ia) - (ib === -1 ? Infinity : ib);
    const na = Number(a);
    const nb = Number(b);
    if (a !== '' && b !== '' && Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
    return a.localeCompare(b, 'en');
  };
}

function measureOf(record: PivotRecord, field: string): number {
  const value = record[field];
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

/** Aggregates the records at the given indexes. */
export function aggregate(records: readonly PivotRecord[], indexes: readonly number[], measure: string, aggregation: Aggregation): PivotCell {
  if (indexes.length === 0) return { value: null, count: 0, records: [] };
  if (aggregation === 'count') return { value: indexes.length, count: indexes.length, records: indexes };
  const sum = indexes.reduce((total, index) => total + measureOf(records[index], measure), 0);
  return { value: aggregation === 'sum' ? sum : sum / indexes.length, count: indexes.length, records: indexes };
}

/** Distinct values of a field in display order. */
export function distinctValues(records: readonly PivotRecord[], field: string, order?: PivotSpec['order']): string[] {
  return [...new Set(records.map((record) => String(record[field] ?? '')))].sort(compare(field, order));
}

/** Builds the pivot of `records` described by `spec`. */
export function pivot(records: readonly PivotRecord[], spec: PivotSpec): PivotResult {
  const columnKeys = spec.column === null ? [ALL_KEY] : distinctValues(records, spec.column, spec.order);
  const columns = columnKeys.map((key) => ({ key, label: key === '' ? 'None' : key }));
  const columnOf = (record: PivotRecord): string => (spec.column === null ? ALL_KEY : String(record[spec.column] ?? ''));

  const cellsFor = (indexes: readonly number[]): PivotCell[] =>
    columnKeys.map((key) =>
      aggregate(
        records,
        indexes.filter((index) => columnOf(records[index]) === key),
        spec.measure,
        spec.aggregation
      )
    );

  const build = (indexes: readonly number[], level: number, parentId: string): PivotGroup[] => {
    const field = spec.rows[level];
    if (field === undefined) return [];
    const keys = [...new Set(indexes.map((index) => String(records[index][field] ?? '')))].sort(compare(field, spec.order));
    return keys.map((key) => {
      const inGroup = indexes.filter((index) => String(records[index][field] ?? '') === key);
      const id = parentId === '' ? key : `${parentId}/${key}`;
      return {
        id,
        field,
        key,
        label: key === '' ? 'None' : key,
        level,
        cells: cellsFor(inGroup),
        total: aggregate(records, inGroup, spec.measure, spec.aggregation),
        children: build(inGroup, level + 1, id),
      };
    });
  };

  const all = records.map((_, index) => index);
  const groups = build(all, 0, '');
  const leaves: PivotGroup[] = [];
  const collect = (list: readonly PivotGroup[]) => {
    for (const group of list) {
      if (group.children.length === 0) leaves.push(group);
      else collect(group.children);
    }
  };
  collect(groups);
  const values = leaves.flatMap((leaf) => leaf.cells.map((cell) => cell.value)).filter((value): value is number => value !== null);

  return {
    columns,
    groups,
    grandTotal: { cells: cellsFor(all), total: aggregate(records, all, spec.measure, spec.aggregation) },
    range: values.length === 0 ? null : { min: Math.min(...values), max: Math.max(...values) },
    recordCount: records.length,
  };
}

/** A visible row of a pivot: a group and whether it can be collapsed. */
export type PivotRow = { group: PivotGroup; expandable: boolean; expanded: boolean };

/** The rows to draw, in order, leaving out the children of collapsed groups. */
export function visiblePivotRows(groups: readonly PivotGroup[], collapsed: ReadonlySet<string>): PivotRow[] {
  const rows: PivotRow[] = [];
  const walk = (list: readonly PivotGroup[]) => {
    for (const group of list) {
      const expandable = group.children.length > 0;
      const expanded = expandable && !collapsed.has(group.id);
      rows.push({ group, expandable, expanded });
      if (expanded) walk(group.children);
    }
  };
  walk(groups);
  return rows;
}

/** Ids of every group that has children, so "collapse all" can name them. */
export function expandableIds(groups: readonly PivotGroup[]): string[] {
  return groups.flatMap((group) => (group.children.length === 0 ? [] : [group.id, ...expandableIds(group.children)]));
}

/** Which of `steps` heat levels a value falls in (0 is the lightest); `null` for no value or no spread. */
export function heatStep(value: number | null, range: { min: number; max: number } | null, steps = 4): number | null {
  if (value === null || range === null || range.max <= range.min) return null;
  const position = (value - range.min) / (range.max - range.min);
  return Math.min(steps - 1, Math.max(0, Math.floor(position * steps)));
}

/** The record at each index, for a drill-through panel. */
export function recordsOf(records: readonly PivotRecord[], indexes: readonly number[]): PivotRecord[] {
  return indexes.map((index) => records[index]);
}
