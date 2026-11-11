import { aggregate, distinctValues, expandableIds, heatStep, pivot, recordsOf, visiblePivotRows } from './pivot';
import type { PivotRecord, PivotSpec } from './pivot';

const RECORDS: readonly PivotRecord[] = [
  { area: 'Compression', type: 'Corrective', month: 'Jan', hours: 8, downtime: 4 },
  { area: 'Compression', type: 'Corrective', month: 'Feb', hours: 6, downtime: 2 },
  { area: 'Compression', type: 'Preventive', month: 'Jan', hours: 10, downtime: 0 },
  { area: 'Export', type: 'Preventive', month: 'Feb', hours: 4, downtime: 0 },
  { area: 'Export', type: 'Corrective', month: 'Feb', hours: 2, downtime: 1 },
];

const SPEC: PivotSpec = { rows: ['area', 'type'], column: 'month', measure: 'hours', aggregation: 'sum', order: { month: ['Jan', 'Feb', 'Mar'] } };

describe('aggregate', () => {
  it('sums, counts and averages', () => {
    expect(aggregate(RECORDS, [0, 1], 'hours', 'sum').value).toBe(14);
    expect(aggregate(RECORDS, [0, 1], 'hours', 'count').value).toBe(2);
    expect(aggregate(RECORDS, [0, 1], 'hours', 'average').value).toBe(7);
  });

  it('has no value for no records', () => {
    expect(aggregate(RECORDS, [], 'hours', 'sum')).toEqual({ value: null, count: 0, records: [] });
  });

  it('counts a non-numeric measure as zero', () => {
    expect(aggregate(RECORDS, [0], 'area', 'sum').value).toBe(0);
  });
});

describe('distinctValues', () => {
  it('lists values in the preferred order, then naturally', () => {
    expect(distinctValues(RECORDS, 'month', { month: ['Feb'] })).toEqual(['Feb', 'Jan']);
    expect(distinctValues(RECORDS, 'area')).toEqual(['Compression', 'Export']);
  });

  it('sorts numeric text as numbers', () => {
    const numbers = [{ n: '10' }, { n: '9' }, { n: '100' }];
    expect(distinctValues(numbers, 'n')).toEqual(['9', '10', '100']);
  });
});

describe('pivot', () => {
  const result = pivot(RECORDS, SPEC);

  it('orders the columns', () => {
    expect(result.columns.map((column) => column.key)).toEqual(['Jan', 'Feb']);
  });

  it('nests row groups by field order', () => {
    expect(result.groups.map((group) => group.label)).toEqual(['Compression', 'Export']);
    expect(result.groups[0].children.map((group) => group.label)).toEqual(['Corrective', 'Preventive']);
    expect(result.groups[0].children[0].id).toBe('Compression/Corrective');
    expect(result.groups[0].children[0].level).toBe(1);
  });

  it('puts leaf values in their cells', () => {
    const leaf = result.groups[0].children[0];
    expect(leaf.cells.map((cell) => cell.value)).toEqual([8, 6]);
    expect(leaf.total.value).toBe(14);
  });

  it('computes subtotals from the records', () => {
    const compression = result.groups[0];
    expect(compression.cells.map((cell) => cell.value)).toEqual([18, 6]);
    expect(compression.total.value).toBe(24);
  });

  it('computes the grand total', () => {
    expect(result.grandTotal.cells.map((cell) => cell.value)).toEqual([18, 12]);
    expect(result.grandTotal.total.value).toBe(30);
  });

  it('leaves empty cells without a value', () => {
    const exportPreventive = result.groups[1].children[1];
    expect(exportPreventive.cells[0].value).toBeNull();
    expect(exportPreventive.cells[1].value).toBe(4);
  });

  it('keeps the records behind each cell for drill-through', () => {
    expect(result.groups[0].children[0].cells[1].records).toEqual([1]);
    expect(recordsOf(RECORDS, result.groups[1].total.records)).toHaveLength(2);
  });

  it('gives the range of the leaf cells for heat shading', () => {
    expect(result.range).toEqual({ min: 2, max: 10 });
  });

  it('averages from records, not from averages', () => {
    const averaged = pivot(RECORDS, { ...SPEC, aggregation: 'average' });
    expect(averaged.groups[0].total.value).toBe(8);
    expect(averaged.grandTotal.total.value).toBe(6);
  });

  it('counts records', () => {
    const counted = pivot(RECORDS, { ...SPEC, aggregation: 'count', measure: 'hours' });
    expect(counted.groups[0].total.value).toBe(3);
    expect(counted.grandTotal.total.value).toBe(5);
  });

  it('uses one All column without a column field', () => {
    const flat = pivot(RECORDS, { ...SPEC, column: null });
    expect(flat.columns).toEqual([{ key: 'All', label: 'All' }]);
    expect(flat.groups[0].cells[0].value).toBe(24);
  });

  it('gives only the grand total without row fields', () => {
    const totals = pivot(RECORDS, { ...SPEC, rows: [] });
    expect(totals.groups).toEqual([]);
    expect(totals.grandTotal.total.value).toBe(30);
    expect(totals.range).toBeNull();
  });

  it('is empty for no records', () => {
    const empty = pivot([], SPEC);
    expect(empty.groups).toEqual([]);
    expect(empty.columns).toEqual([]);
    expect(empty.grandTotal.total.value).toBeNull();
    expect(empty.recordCount).toBe(0);
  });

  it('labels a missing value as None', () => {
    const gaps = pivot([{ area: '', hours: 1 }], { rows: ['area'], column: null, measure: 'hours', aggregation: 'sum' });
    expect(gaps.groups[0].label).toBe('None');
  });
});

describe('visiblePivotRows', () => {
  const { groups } = pivot(RECORDS, SPEC);

  it('lists parents and their children', () => {
    expect(visiblePivotRows(groups, new Set()).map((row) => row.group.id)).toEqual([
      'Compression',
      'Compression/Corrective',
      'Compression/Preventive',
      'Export',
      'Export/Corrective',
      'Export/Preventive',
    ]);
  });

  it('hides the children of a collapsed group', () => {
    const rows = visiblePivotRows(groups, new Set(['Compression']));
    expect(rows.map((row) => row.group.id)).toEqual(['Compression', 'Export', 'Export/Corrective', 'Export/Preventive']);
    expect(rows[0]).toMatchObject({ expandable: true, expanded: false });
  });

  it('marks leaves as not expandable', () => {
    expect(visiblePivotRows(groups, new Set())[1]).toMatchObject({ expandable: false, expanded: false });
  });

  it('names the groups that can collapse', () => {
    expect(expandableIds(groups)).toEqual(['Compression', 'Export']);
  });
});

describe('heatStep', () => {
  const range = { min: 0, max: 100 };

  it('splits the range into equal steps', () => {
    expect([0, 24, 25, 60, 99, 100].map((value) => heatStep(value, range))).toEqual([0, 0, 1, 2, 3, 3]);
  });

  it('has no step without a value or a spread', () => {
    expect(heatStep(null, range)).toBeNull();
    expect(heatStep(5, null)).toBeNull();
    expect(heatStep(5, { min: 5, max: 5 })).toBeNull();
  });

  it('clamps values outside the range', () => {
    expect(heatStep(-5, range)).toBe(0);
    expect(heatStep(500, range)).toBe(3);
  });
});
