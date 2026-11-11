import type { Condition, Group, QueryDataset, QueryField, QueryValue } from './queryModel';

export const TEST_NOW = Date.UTC(2026, 2, 12, 14, 0, 0);
const DAY = 86_400_000;

export const TEST_FIELDS: QueryField[] = [
  { key: 'name', label: 'Name', kind: 'text' },
  { key: 'score', label: 'Health score', kind: 'number', unit: '%' },
  {
    key: 'state',
    label: 'State',
    kind: 'enum',
    options: [
      { value: 'running', label: 'Running' },
      { value: 'standby', label: 'Standby' },
      { value: 'tripped', label: 'Tripped' },
    ],
  },
  { key: 'due', label: 'Due', kind: 'date' },
  { key: 'overdue', label: 'Overdue', kind: 'boolean' },
];

export const TEST_DATASET: QueryDataset = {
  id: 'assets',
  label: 'Assets',
  noun: 'assets',
  fields: TEST_FIELDS,
  recordKey: 'tag',
  columns: [
    { key: 'tag', label: 'Tag' },
    { key: 'name', label: 'Name' },
    { key: 'score', label: 'Health score', kind: 'number', unit: '%' },
    { key: 'due', label: 'Due', kind: 'date' },
  ],
  records: [
    { tag: '23-KA-9103', name: 'Recompressor', score: 41, state: 'tripped', due: TEST_NOW - 3 * DAY, overdue: true },
    { tag: '23-KA-9101', name: '1st stage compressor', score: 72, state: 'running', due: TEST_NOW + 2 * DAY, overdue: false },
    { tag: '27-PA-2001A', name: 'Export pump A', score: 93, state: 'running', due: TEST_NOW + 30 * DAY, overdue: false },
    { tag: '27-PA-2001B', name: 'Export pump B', score: 90, state: 'standby', due: null, overdue: false },
  ],
};

export const TEST_OTHER_DATASET: QueryDataset = {
  id: 'orders',
  label: 'Work orders',
  noun: 'work orders',
  fields: [{ key: 'title', label: 'Title', kind: 'text' }],
  recordKey: 'id',
  columns: [
    { key: 'id', label: 'Work order' },
    { key: 'title', label: 'Title' },
  ],
  records: [{ id: 'WO-1', title: 'Inspect bearing' }],
};

export const value = (patch: Partial<QueryValue>): QueryValue => ({ a: '', b: '', list: [], unit: 'days', ...patch });
export const cond = (id: string, field: string, op: Condition['op'], patch: Partial<QueryValue> = {}): Condition => ({ id, type: 'condition', field, op, value: value(patch) });
export const group = (id: string, combinator: 'and' | 'or', children: Group['children'], negated = false): Group => ({ id, type: 'group', combinator, negated, children });
