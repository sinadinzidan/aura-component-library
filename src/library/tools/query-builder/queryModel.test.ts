import {
  MAX_DEPTH,
  ROOT_ID,
  canAddGroup,
  changeField,
  changeOperator,
  chipsOf,
  countConditions,
  createCondition,
  createGroup,
  createQueryState,
  describeCondition,
  describeQuery,
  filterRecords,
  findNode,
  groupDepth,
  matches,
  operatorsFor,
  queryReducer,
  shapeOf,
  validateCondition,
  validateQuery,
} from './queryModel';
import type { Condition, Group, QueryAction, QueryField, QueryRecord, QueryState, QueryValue } from './queryModel';

const DAY = 86_400_000;
const NOW = Date.UTC(2026, 2, 12, 14, 0, 0);

const FIELDS: QueryField[] = [
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

const value = (patch: Partial<QueryValue>): QueryValue => ({ a: '', b: '', list: [], unit: 'days', ...patch });
const cond = (id: string, field: string, op: Condition['op'], patch: Partial<QueryValue> = {}): Condition => ({ id, type: 'condition', field, op, value: value(patch) });
const group = (id: string, combinator: 'and' | 'or', children: Group['children'], negated = false): Group => ({ id, type: 'group', combinator, negated, children });

const RECORDS: QueryRecord[] = [
  { name: 'Recompressor', score: 41, state: 'tripped', due: NOW - 3 * DAY, overdue: true },
  { name: '1st stage compressor', score: 72, state: 'running', due: NOW + 2 * DAY, overdue: false },
  { name: 'Export pump A', score: 93, state: 'running', due: NOW + 30 * DAY, overdue: false },
  { name: 'Export pump B', score: 90, state: 'standby', due: null, overdue: false },
];

const names = (root: Group): string[] => filterRecords(root, RECORDS, FIELDS, NOW).map((record) => String(record.name));

describe('operators', () => {
  it('offers a different set for each field type', () => {
    expect(operatorsFor('text')).toContain('contains');
    expect(operatorsFor('number')).toContain('between');
    expect(operatorsFor('enum')).toContain('is-any-of');
    expect(operatorsFor('date')).toContain('in-last');
    expect(operatorsFor('boolean')).toEqual(['is-true', 'is-false']);
  });

  it('maps each operator to the shape of its value', () => {
    expect(shapeOf('is-empty')).toBe('none');
    expect(shapeOf('gt')).toBe('single');
    expect(shapeOf('between')).toBe('range');
    expect(shapeOf('is-any-of')).toBe('multi');
    expect(shapeOf('in-last')).toBe('relative');
  });
});

describe(createCondition.name, () => {
  it('starts on the first field with its first operator', () => {
    expect(createCondition('c1', FIELDS)).toMatchObject({ field: 'name', op: 'contains' });
  });

  it('starts on a given field', () => {
    expect(createCondition('c1', FIELDS, 'score')).toMatchObject({ field: 'score', op: 'eq' });
  });
});

describe(changeField.name, () => {
  it('resets the operator and value for a field of another type', () => {
    const next = changeField(cond('c', 'name', 'contains', { a: 'pump' }), FIELDS, 'score');

    expect(next).toMatchObject({ field: 'score', op: 'eq', value: { a: '' } });
  });

  it('keeps the operator and value between fields of the same kind', () => {
    const fields: QueryField[] = [...FIELDS, { key: 'tag', label: 'Tag', kind: 'text' }];

    expect(changeField(cond('c', 'name', 'starts-with', { a: '23' }), fields, 'tag')).toMatchObject({ field: 'tag', op: 'starts-with', value: { a: '23' } });
  });

  it('starts again between enum fields, whose options differ', () => {
    const fields: QueryField[] = [...FIELDS, { key: 'health', label: 'Health', kind: 'enum', options: [{ value: 'good', label: 'Good' }] }];

    expect(changeField(cond('c', 'state', 'is', { a: 'running' }), fields, 'health').value.a).toBe('');
  });

  it('ignores an unknown field', () => {
    const condition = cond('c', 'name', 'contains');

    expect(changeField(condition, FIELDS, 'nope')).toBe(condition);
  });
});

describe(changeOperator.name, () => {
  it('keeps the value when the shape stays', () => {
    expect(changeOperator(cond('c', 'score', 'gt', { a: '50' }), 'lt').value.a).toBe('50');
  });

  it('turns a single value into a one-item list and back', () => {
    const multi = changeOperator(cond('c', 'state', 'is', { a: 'running' }), 'is-any-of');
    expect(multi.value.list).toEqual(['running']);
    expect(changeOperator(multi, 'is').value.a).toBe('running');
  });

  it('keeps the first end when a single value becomes a range', () => {
    expect(changeOperator(cond('c', 'score', 'gt', { a: '50' }), 'between').value).toMatchObject({ a: '50', b: '' });
  });

  it('drops the value when the new operator needs none', () => {
    expect(changeOperator(cond('c', 'name', 'contains', { a: 'x' }), 'is-empty').value.a).toBe('');
  });
});

describe('tree helpers', () => {
  const root = group(ROOT_ID, 'and', [cond('c1', 'name', 'contains', { a: 'x' }), group('g1', 'or', [group('g2', 'and', [cond('c2', 'score', 'gt', { a: '1' })])])]);

  it('finds a nested node', () => {
    expect(findNode(root, 'c2')?.id).toBe('c2');
    expect(findNode(root, 'nope')).toBeUndefined();
  });

  it('counts depth with the root as one', () => {
    expect(groupDepth(root, ROOT_ID)).toBe(1);
    expect(groupDepth(root, 'g2')).toBe(3);
    expect(groupDepth(root, 'c1')).toBeUndefined();
  });

  it('counts conditions through groups', () => {
    expect(countConditions(root)).toBe(2);
  });

  it('allows a group until the depth limit and says why not after', () => {
    expect(canAddGroup(root, 'g1')).toEqual({ ok: true });
    const blocked = canAddGroup(root, 'g2');
    expect(blocked.ok).toBe(false);
    expect(blocked.ok === false && blocked.reason).toContain(`${MAX_DEPTH} levels`);
  });
});

describe(queryReducer.name, () => {
  const start = (): QueryState => createQueryState('assets', FIELDS);
  const run = (state: QueryState, ...actions: QueryAction[]): QueryState => actions.reduce(queryReducer, state);

  it('adds conditions to a group, each with a new id', () => {
    const state = run(start(), { type: 'addCondition', groupId: ROOT_ID }, { type: 'addCondition', groupId: ROOT_ID });

    expect(state.root.children.map((child) => child.id)).toEqual(['c1', 'c2']);
  });

  it('adds a group and a condition inside it', () => {
    const state = run(start(), { type: 'addGroup', groupId: ROOT_ID }, { type: 'addCondition', groupId: 'g1' });

    expect(countConditions(state.root)).toBe(1);
    expect(groupDepth(state.root, 'g1')).toBe(2);
  });

  it('refuses a group past the depth limit and announces the reason', () => {
    const state = run(start(), { type: 'addGroup', groupId: ROOT_ID }, { type: 'addGroup', groupId: 'g1' }, { type: 'addGroup', groupId: 'g2' });

    expect(findNode(state.root, 'g3')).toBeUndefined();
    expect(state.announcement).toContain('levels deep');
  });

  it('removes a nested node but never the root', () => {
    const state = run(start(), { type: 'addGroup', groupId: ROOT_ID }, { type: 'addCondition', groupId: 'g1' }, { type: 'remove', id: 'c2' });

    expect(countConditions(state.root)).toBe(0);
    expect(run(state, { type: 'remove', id: ROOT_ID })).toBe(state);
  });

  it('reorders a condition within its group', () => {
    const state = run(start(), { type: 'addCondition', groupId: ROOT_ID }, { type: 'addCondition', groupId: ROOT_ID }, { type: 'move', id: 'c2', delta: -1 });

    expect(state.root.children.map((child) => child.id)).toEqual(['c2', 'c1']);
  });

  it('does not move past the ends', () => {
    const state = run(start(), { type: 'addCondition', groupId: ROOT_ID });

    expect(run(state, { type: 'move', id: 'c1', delta: -1 })).toBe(state);
  });

  it('switches and and or, and negates a group', () => {
    const state = run(start(), { type: 'setCombinator', groupId: ROOT_ID, combinator: 'or' }, { type: 'toggleNegate', groupId: ROOT_ID });

    expect(state.root).toMatchObject({ combinator: 'or', negated: true });
  });

  it('edits a condition: field, operator, value', () => {
    const state = run(
      start(),
      { type: 'addCondition', groupId: ROOT_ID },
      { type: 'changeField', id: 'c1', field: 'score' },
      { type: 'changeOperator', id: 'c1', op: 'gt' },
      { type: 'setValue', id: 'c1', patch: { a: '80' } },
    );

    expect(state.root.children[0]).toMatchObject({ field: 'score', op: 'gt', value: { a: '80' } });
  });

  it('clears the query', () => {
    expect(run(start(), { type: 'addCondition', groupId: ROOT_ID }, { type: 'clear' }).root.children).toEqual([]);
  });

  it('loads a saved query and continues numbering after its ids', () => {
    const saved = group(ROOT_ID, 'and', [cond('c7', 'name', 'contains', { a: 'pump' })]);

    const state = run(start(), { type: 'load', datasetId: 'sensors', fields: FIELDS, root: saved }, { type: 'addCondition', groupId: ROOT_ID });

    expect(state.datasetId).toBe('sensors');
    expect(state.root.children.map((child) => child.id)).toEqual(['c7', 'c8']);
  });

  it('starts an empty query when the data set changes', () => {
    const state = run(start(), { type: 'addCondition', groupId: ROOT_ID }, { type: 'setDataset', datasetId: 'alarms', fields: FIELDS });

    expect(state).toMatchObject({ datasetId: 'alarms' });
    expect(state.root.children).toEqual([]);
  });
});

describe(validateCondition.name, () => {
  it.each([
    [cond('c', 'name', 'contains'), 'Enter text to match.'],
    [cond('c', 'name', 'contains', { a: '  ' }), 'Enter text to match.'],
    [cond('c', 'score', 'gt'), 'Enter a number.'],
    [cond('c', 'score', 'gt', { a: 'abc' }), 'Enter a valid number.'],
    [cond('c', 'state', 'is'), 'Choose a value.'],
    [cond('c', 'state', 'is-any-of'), 'Choose at least one value.'],
    [cond('c', 'due', 'before'), 'Choose a date.'],
    [cond('c', 'due', 'before', { a: '12/03/2026' }), 'Enter a valid date.'],
    [cond('c', 'due', 'in-last', { a: '0' }), 'Enter a whole number above zero.'],
    [cond('c', 'due', 'in-last', { a: '1.5' }), 'Enter a whole number above zero.'],
    [cond('c', 'score', 'between', { a: '10' }), 'Enter the end of the range.'],
    [cond('c', 'score', 'between', { b: '10' }), 'Enter the start of the range.'],
    [cond('c', 'score', 'between', { a: '90', b: '10' }), 'The start must not be after the end.'],
    [cond('c', 'due', 'date-between', { a: '2026-03-20', b: '2026-03-01' }), 'The start must not be after the end.'],
    [cond('c', 'nope', 'contains'), 'Choose a field.'],
    [cond('c', 'name', 'gt'), 'Choose an operator.'],
  ])('flags %# with a reason', (condition, reason) => {
    expect(validateCondition(condition, FIELDS)).toBe(reason);
  });

  it.each([
    cond('c', 'name', 'is-empty'),
    cond('c', 'name', 'contains', { a: 'pump' }),
    cond('c', 'score', 'between', { a: '10', b: '10' }),
    cond('c', 'state', 'is-none-of', { list: ['running'] }),
    cond('c', 'due', 'in-next', { a: '7' }),
    cond('c', 'overdue', 'is-true'),
  ])('accepts a complete condition %#', (condition) => {
    expect(validateCondition(condition, FIELDS)).toBeUndefined();
  });
});

describe(validateQuery.name, () => {
  it('reports incomplete conditions and empty nested groups by id', () => {
    const root = group(ROOT_ID, 'and', [cond('c1', 'score', 'gt'), group('g1', 'or', []), cond('c2', 'overdue', 'is-true')]);

    expect(validateQuery(root, FIELDS)).toEqual({ c1: 'Enter a number.', g1: 'Add a condition or remove this group.' });
  });

  it('accepts an empty query', () => {
    expect(validateQuery(group(ROOT_ID, 'and', []), FIELDS)).toEqual({});
  });
});

describe(describeCondition.name, () => {
  it('writes field, operator and value', () => {
    expect(describeCondition(cond('c', 'score', 'gt', { a: '80' }), FIELDS)).toBe('Health score is above 80 %');
  });

  it('writes text values in quotes and enum values by label', () => {
    expect(describeCondition(cond('c', 'name', 'contains', { a: ' pump ' }), FIELDS)).toBe('Name contains “pump”');
    expect(describeCondition(cond('c', 'state', 'is', { a: 'running' }), FIELDS)).toBe('State is Running');
  });

  it('lists several values with or', () => {
    expect(describeCondition(cond('c', 'state', 'is-any-of', { list: ['running', 'standby', 'tripped'] }), FIELDS)).toBe('State is any of Running, Standby or Tripped');
  });

  it('writes ranges, dates and relative times', () => {
    expect(describeCondition(cond('c', 'score', 'between', { a: '40', b: '80' }), FIELDS)).toBe('Health score is between 40 % and 80 %');
    expect(describeCondition(cond('c', 'due', 'before', { a: '2026-03-12' }), FIELDS)).toBe('Due is before 12 Mar 2026');
    expect(describeCondition(cond('c', 'due', 'in-last', { a: '7', unit: 'days' }), FIELDS)).toBe('Due is in the last 7 days');
    expect(describeCondition(cond('c', 'due', 'in-next', { a: '1', unit: 'weeks' }), FIELDS)).toBe('Due is in the next 1 week');
  });

  it('writes operators with no value', () => {
    expect(describeCondition(cond('c', 'overdue', 'is-true'), FIELDS)).toBe('Overdue is true');
    expect(describeCondition(cond('c', 'name', 'is-empty'), FIELDS)).toBe('Name is empty');
  });

  it('writes nothing for an incomplete condition', () => {
    expect(describeCondition(cond('c', 'score', 'gt'), FIELDS)).toBe('');
  });
});

describe(describeQuery.name, () => {
  it('says all records for an empty query', () => {
    expect(describeQuery(group(ROOT_ID, 'and', []), FIELDS, 'Assets')).toBe('All assets');
  });

  it('joins conditions and wraps nested groups in parentheses', () => {
    const root = group(ROOT_ID, 'and', [cond('c1', 'state', 'is', { a: 'running' }), group('g1', 'or', [cond('c2', 'score', 'lt', { a: '50' }), cond('c3', 'overdue', 'is-true')])]);

    expect(describeQuery(root, FIELDS, 'Assets')).toBe('Assets where State is Running and (Health score is below 50 % or Overdue is true)');
  });

  it('writes a negated group with not', () => {
    const root = group(ROOT_ID, 'and', [group('g1', 'or', [cond('c1', 'state', 'is', { a: 'tripped' }), cond('c2', 'state', 'is', { a: 'standby' })], true)]);

    expect(describeQuery(root, FIELDS, 'Assets')).toBe('Assets where not (State is Tripped or State is Standby)');
  });

  it('leaves out incomplete conditions', () => {
    const root = group(ROOT_ID, 'and', [cond('c1', 'state', 'is', { a: 'running' }), cond('c2', 'score', 'gt')]);

    expect(describeQuery(root, FIELDS)).toBe('Records where State is Running');
  });
});

describe(chipsOf.name, () => {
  it('gives one chip per top-level part', () => {
    const root = group(ROOT_ID, 'and', [
      cond('c1', 'state', 'is', { a: 'running' }),
      group('g1', 'or', [cond('c2', 'score', 'lt', { a: '50' }), cond('c3', 'overdue', 'is-true')]),
      group('g2', 'and', [cond('c4', 'name', 'is-empty')], true),
      cond('c5', 'score', 'gt'),
    ]);

    expect(chipsOf(root, FIELDS).map((chip) => chip.text)).toEqual(['State is Running', 'Any of 2 conditions', 'Not 1 condition']);
  });

  it('skips empty groups', () => {
    expect(chipsOf(group(ROOT_ID, 'and', [group('g1', 'and', [])]), FIELDS)).toEqual([]);
  });
});

describe('evaluation', () => {
  it('matches everything for an empty query', () => {
    expect(names(group(ROOT_ID, 'and', []))).toHaveLength(4);
  });

  it('ignores incomplete conditions', () => {
    expect(names(group(ROOT_ID, 'and', [cond('c1', 'score', 'gt')]))).toHaveLength(4);
  });

  it('matches text case-insensitively', () => {
    expect(names(group(ROOT_ID, 'and', [cond('c1', 'name', 'contains', { a: 'PUMP' })]))).toEqual(['Export pump A', 'Export pump B']);
    expect(names(group(ROOT_ID, 'and', [cond('c1', 'name', 'starts-with', { a: 'export' })]))).toHaveLength(2);
    expect(names(group(ROOT_ID, 'and', [cond('c1', 'name', 'text-is', { a: 'recompressor' })]))).toEqual(['Recompressor']);
    expect(names(group(ROOT_ID, 'and', [cond('c1', 'name', 'not-contains', { a: 'export' })]))).toEqual(['Recompressor', '1st stage compressor']);
  });

  it.each([
    ['gt', { a: '90' }, ['Export pump A']],
    ['gte', { a: '90' }, ['Export pump A', 'Export pump B']],
    ['lt', { a: '72' }, ['Recompressor']],
    ['lte', { a: '72' }, ['Recompressor', '1st stage compressor']],
    ['eq', { a: '72' }, ['1st stage compressor']],
    ['neq', { a: '72' }, ['Recompressor', 'Export pump A', 'Export pump B']],
    ['between', { a: '70', b: '91' }, ['1st stage compressor', 'Export pump B']],
  ] as const)('compares numbers with %s', (op, patch, expected) => {
    expect(names(group(ROOT_ID, 'and', [cond('c1', 'score', op, patch)]))).toEqual(expected);
  });

  it('matches enums by one value, any of, or none of', () => {
    expect(names(group(ROOT_ID, 'and', [cond('c1', 'state', 'is', { a: 'running' })]))).toHaveLength(2);
    expect(names(group(ROOT_ID, 'and', [cond('c1', 'state', 'is-not', { a: 'running' })]))).toHaveLength(2);
    expect(names(group(ROOT_ID, 'and', [cond('c1', 'state', 'is-any-of', { list: ['tripped', 'standby'] })]))).toEqual(['Recompressor', 'Export pump B']);
    expect(names(group(ROOT_ID, 'and', [cond('c1', 'state', 'is-none-of', { list: ['running'] })]))).toEqual(['Recompressor', 'Export pump B']);
  });

  it('matches booleans', () => {
    expect(names(group(ROOT_ID, 'and', [cond('c1', 'overdue', 'is-true')]))).toEqual(['Recompressor']);
    expect(names(group(ROOT_ID, 'and', [cond('c1', 'overdue', 'is-false')]))).toHaveLength(3);
  });

  it('matches dates before, after and between whole days', () => {
    expect(names(group(ROOT_ID, 'and', [cond('c1', 'due', 'before', { a: '2026-03-12' })]))).toEqual(['Recompressor']);
    expect(names(group(ROOT_ID, 'and', [cond('c1', 'due', 'after', { a: '2026-03-12' })]))).toEqual(['1st stage compressor', 'Export pump A']);
    expect(names(group(ROOT_ID, 'and', [cond('c1', 'due', 'date-between', { a: '2026-03-14', b: '2026-03-14' })]))).toEqual(['1st stage compressor']);
  });

  it('matches relative dates against the given now', () => {
    expect(names(group(ROOT_ID, 'and', [cond('c1', 'due', 'in-last', { a: '7', unit: 'days' })]))).toEqual(['Recompressor']);
    expect(names(group(ROOT_ID, 'and', [cond('c1', 'due', 'in-next', { a: '1', unit: 'weeks' })]))).toEqual(['1st stage compressor']);
    expect(names(group(ROOT_ID, 'and', [cond('c1', 'due', 'in-next', { a: '5', unit: 'weeks' })]))).toEqual(['1st stage compressor', 'Export pump A']);
  });

  it('treats a missing date as not matching a positive test and as matching a negative one', () => {
    expect(names(group(ROOT_ID, 'and', [cond('c1', 'due', 'before', { a: '2030-01-01' })]))).not.toContain('Export pump B');
    expect(names(group(ROOT_ID, 'and', [cond('c1', 'state', 'is-not', { a: 'standby' })]))).not.toContain('Export pump B');
  });

  it('combines with and, or and nested groups', () => {
    const both = group(ROOT_ID, 'and', [cond('c1', 'state', 'is', { a: 'running' }), cond('c2', 'score', 'gt', { a: '80' })]);
    const either = group(ROOT_ID, 'or', [cond('c1', 'state', 'is', { a: 'tripped' }), cond('c2', 'score', 'gt', { a: '92' })]);
    const nested = group(ROOT_ID, 'and', [cond('c1', 'state', 'is', { a: 'running' }), group('g1', 'or', [cond('c2', 'score', 'lt', { a: '50' }), cond('c3', 'score', 'gt', { a: '92' })])]);

    expect(names(both)).toEqual(['Export pump A']);
    expect(names(either)).toEqual(['Recompressor', 'Export pump A']);
    expect(names(nested)).toEqual(['Export pump A']);
  });

  it('negates a group', () => {
    const root = group(ROOT_ID, 'and', [group('g1', 'or', [cond('c1', 'state', 'is', { a: 'running' }), cond('c2', 'state', 'is', { a: 'standby' })], true)]);

    expect(names(root)).toEqual(['Recompressor']);
  });

  it('reports a single record match', () => {
    expect(matches(group(ROOT_ID, 'and', [cond('c1', 'overdue', 'is-true')]), RECORDS[0], FIELDS, NOW)).toBe(true);
  });
});

describe(createGroup.name, () => {
  it('starts as an un-negated and group', () => {
    expect(createGroup('g')).toMatchObject({ combinator: 'and', negated: false, children: [] });
  });
});
