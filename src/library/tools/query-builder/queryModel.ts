/**
 * The model of the query builder: nested groups of conditions, the operators each field type
 * offers, the reducer that edits a query, validation with reasons, and the pure functions that
 * describe a query in words and evaluate it against records. No React in here.
 */

export type FieldKind = 'text' | 'number' | 'enum' | 'date' | 'boolean';

export type QueryOption = { value: string; label: string };

export type QueryField = {
  key: string;
  label: string;
  kind: FieldKind;
  /** Number fields: shown after the value. */
  unit?: string;
  /** Enum fields: the values a record can hold. */
  options?: readonly QueryOption[];
};

export type Operator =
  | 'contains'
  | 'not-contains'
  | 'text-is'
  | 'text-is-not'
  | 'starts-with'
  | 'is-empty'
  | 'is-not-empty'
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'between'
  | 'is'
  | 'is-not'
  | 'is-any-of'
  | 'is-none-of'
  | 'before'
  | 'after'
  | 'date-between'
  | 'in-last'
  | 'in-next'
  | 'is-true'
  | 'is-false';

/** How many values an operator needs, which decides the editor: none, one, two ends, a list, or "N units". */
export type ValueShape = 'none' | 'single' | 'range' | 'multi' | 'relative';

export type RelativeUnit = 'hours' | 'days' | 'weeks';

/** One value slot set for every shape; the operator decides which slots are read. */
export type QueryValue = { a: string; b: string; list: readonly string[]; unit: RelativeUnit };

export type Condition = { id: string; type: 'condition'; field: string; op: Operator; value: QueryValue };
export type Group = { id: string; type: 'group'; combinator: 'and' | 'or'; negated: boolean; children: readonly QueryNode[] };
export type QueryNode = Condition | Group;

export type Cell = string | number | boolean | null;
export type QueryRecord = Readonly<Record<string, Cell>>;

/** Levels of groups allowed, the root included. */
export const MAX_DEPTH = 3;

const OPERATORS: Record<FieldKind, readonly Operator[]> = {
  text: ['contains', 'not-contains', 'text-is', 'text-is-not', 'starts-with', 'is-empty', 'is-not-empty'],
  number: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'between'],
  enum: ['is', 'is-not', 'is-any-of', 'is-none-of'],
  date: ['before', 'after', 'date-between', 'in-last', 'in-next'],
  boolean: ['is-true', 'is-false'],
};

const LABELS: Record<Operator, string> = {
  contains: 'contains',
  'not-contains': 'does not contain',
  'text-is': 'is',
  'text-is-not': 'is not',
  'starts-with': 'starts with',
  'is-empty': 'is empty',
  'is-not-empty': 'is not empty',
  eq: 'equals',
  neq: 'does not equal',
  gt: 'is above',
  gte: 'is at least',
  lt: 'is below',
  lte: 'is at most',
  between: 'is between',
  is: 'is',
  'is-not': 'is not',
  'is-any-of': 'is any of',
  'is-none-of': 'is none of',
  before: 'is before',
  after: 'is after',
  'date-between': 'is between',
  'in-last': 'is in the last',
  'in-next': 'is in the next',
  'is-true': 'is true',
  'is-false': 'is false',
};

const SHAPES: Record<Operator, ValueShape> = {
  contains: 'single',
  'not-contains': 'single',
  'text-is': 'single',
  'text-is-not': 'single',
  'starts-with': 'single',
  'is-empty': 'none',
  'is-not-empty': 'none',
  eq: 'single',
  neq: 'single',
  gt: 'single',
  gte: 'single',
  lt: 'single',
  lte: 'single',
  between: 'range',
  is: 'single',
  'is-not': 'single',
  'is-any-of': 'multi',
  'is-none-of': 'multi',
  before: 'single',
  after: 'single',
  'date-between': 'range',
  'in-last': 'relative',
  'in-next': 'relative',
  'is-true': 'none',
  'is-false': 'none',
};

export const operatorsFor = (kind: FieldKind): readonly Operator[] => OPERATORS[kind];
export const operatorLabel = (op: Operator): string => LABELS[op];
export const shapeOf = (op: Operator): ValueShape => SHAPES[op];

export const EMPTY_VALUE: QueryValue = { a: '', b: '', list: [], unit: 'days' };

export const findField = (fields: readonly QueryField[], key: string): QueryField | undefined => fields.find((field) => field.key === key);

/** A condition on the first field with its first operator and no value yet. */
export function createCondition(id: string, fields: readonly QueryField[], fieldKey?: string): Condition {
  const field = (fieldKey ? findField(fields, fieldKey) : undefined) ?? fields[0];
  return { id, type: 'condition', field: field?.key ?? '', op: field ? OPERATORS[field.kind][0] : 'contains', value: EMPTY_VALUE };
}

export const createGroup = (id: string, combinator: 'and' | 'or' = 'and'): Group => ({ id, type: 'group', combinator, negated: false, children: [] });

/** Moves a condition to another field: keeps the operator and value when they still make sense, otherwise starts again. */
export function changeField(condition: Condition, fields: readonly QueryField[], fieldKey: string): Condition {
  const next = findField(fields, fieldKey);
  const previous = findField(fields, condition.field);
  if (!next) return condition;
  if (previous && previous.kind === next.kind && previous.key !== next.key && next.kind !== 'enum') return { ...condition, field: fieldKey };
  if (previous && previous.key === next.key) return condition;
  return { ...condition, field: fieldKey, op: OPERATORS[next.kind][0], value: EMPTY_VALUE };
}

/** Changes the operator and drops values the new operator cannot use. */
export function changeOperator(condition: Condition, op: Operator): Condition {
  const from = shapeOf(condition.op);
  const to = shapeOf(op);
  if (from === to) return { ...condition, op };
  if (to === 'multi' && from === 'single' && condition.value.a !== '') return { ...condition, op, value: { ...EMPTY_VALUE, list: [condition.value.a] } };
  if (to === 'single' && from === 'multi' && condition.value.list.length > 0) return { ...condition, op, value: { ...EMPTY_VALUE, a: condition.value.list[0] } };
  if (to === 'range' && from === 'single') return { ...condition, op, value: { ...EMPTY_VALUE, a: condition.value.a } };
  if (to === 'single' && from === 'range') return { ...condition, op, value: { ...EMPTY_VALUE, a: condition.value.a } };
  return { ...condition, op, value: EMPTY_VALUE };
}

// ---------------------------------------------------------------------------- tree helpers

export function findNode(node: QueryNode, id: string): QueryNode | undefined {
  if (node.id === id) return node;
  if (node.type === 'group') {
    for (const child of node.children) {
      const found = findNode(child, id);
      if (found) return found;
    }
  }
  return undefined;
}

/** Depth of a group, the root being 1. Undefined when the id is not in the tree. */
export function groupDepth(root: Group, id: string, depth = 1): number | undefined {
  if (root.id === id) return depth;
  for (const child of root.children) {
    if (child.type === 'group') {
      const found = groupDepth(child, id, depth + 1);
      if (found !== undefined) return found;
    }
  }
  return undefined;
}

/** Whether a group can be added inside the given group, and if not, why. */
export function canAddGroup(root: Group, groupId: string): { ok: true } | { ok: false; reason: string } {
  const depth = groupDepth(root, groupId);
  if (depth === undefined || depth + 1 > MAX_DEPTH) {
    return { ok: false, reason: `Groups nest ${MAX_DEPTH} levels deep at most. Add the condition to this group instead.` };
  }
  return { ok: true };
}

function mapNode(node: QueryNode, id: string, change: (node: QueryNode) => QueryNode): QueryNode {
  if (node.id === id) return change(node);
  if (node.type !== 'group') return node;
  return { ...node, children: node.children.map((child) => mapNode(child, id, change)) };
}

function removeNode(group: Group, id: string): Group {
  return { ...group, children: group.children.filter((child) => child.id !== id).map((child) => (child.type === 'group' ? removeNode(child, id) : child)) };
}

function moveNode(group: Group, id: string, delta: number): Group {
  const index = group.children.findIndex((child) => child.id === id);
  if (index !== -1) {
    const target = index + delta;
    if (target < 0 || target >= group.children.length) return group;
    const children = [...group.children];
    [children[index], children[target]] = [children[target], children[index]];
    return { ...group, children };
  }
  return { ...group, children: group.children.map((child) => (child.type === 'group' ? moveNode(child, id, delta) : child)) };
}

/** Condition numbers in reading order, by id: the first condition is 1. Used for accessible names. */
export function conditionPositions(root: Group): Record<string, number> {
  const positions: Record<string, number> = {};
  let next = 1;
  const visit = (node: QueryNode) => {
    if (node.type === 'condition') {
      positions[node.id] = next;
      next += 1;
    } else {
      node.children.forEach(visit);
    }
  };
  visit(root);
  return positions;
}

export function countConditions(node: QueryNode): number {
  return node.type === 'condition' ? 1 : node.children.reduce((total, child) => total + countConditions(child), 0);
}

// ---------------------------------------------------------------------------- reducer

export type QueryState = {
  datasetId: string;
  fields: readonly QueryField[];
  root: Group;
  nextId: number;
  /** The latest result in words, for an `aria-live` region. */
  announcement: string;
};

export type QueryAction =
  | { type: 'addCondition'; groupId: string }
  | { type: 'addGroup'; groupId: string }
  | { type: 'remove'; id: string }
  | { type: 'move'; id: string; delta: number }
  | { type: 'setCombinator'; groupId: string; combinator: 'and' | 'or' }
  | { type: 'toggleNegate'; groupId: string }
  | { type: 'changeField'; id: string; field: string }
  | { type: 'changeOperator'; id: string; op: Operator }
  | { type: 'setValue'; id: string; patch: Partial<QueryValue> }
  | { type: 'clear' }
  | { type: 'load'; datasetId: string; fields: readonly QueryField[]; root: Group }
  | { type: 'setDataset'; datasetId: string; fields: readonly QueryField[] };

export const ROOT_ID = 'root';

export function createQueryState(datasetId: string, fields: readonly QueryField[], root: Group = createGroup(ROOT_ID)): QueryState {
  return { datasetId, fields, root, nextId: 1, announcement: '' };
}

const idNumber = (id: string): number => Number(id.replace(/\D/g, '')) || 0;

function maxId(node: QueryNode): number {
  return node.type === 'group' ? node.children.reduce((max, child) => Math.max(max, maxId(child)), idNumber(node.id)) : idNumber(node.id);
}

function mapRoot(state: QueryState, change: (root: Group) => QueryNode, announcement: string): QueryState {
  const next = change(state.root);
  return next.type === 'group' ? { ...state, root: next, announcement } : state;
}

export function queryReducer(state: QueryState, action: QueryAction): QueryState {
  switch (action.type) {
    case 'addCondition': {
      const id = `c${state.nextId}`;
      const condition = createCondition(id, state.fields);
      const root = mapNode(state.root, action.groupId, (node) => (node.type === 'group' ? { ...node, children: [...node.children, condition] } : node));
      return { ...state, root: root as Group, nextId: state.nextId + 1, announcement: 'Added a condition.' };
    }
    case 'addGroup': {
      const allowed = canAddGroup(state.root, action.groupId);
      if (!allowed.ok) return { ...state, announcement: allowed.reason };
      const id = `g${state.nextId}`;
      const root = mapNode(state.root, action.groupId, (node) => (node.type === 'group' ? { ...node, children: [...node.children, createGroup(id, 'or')] } : node));
      return { ...state, root: root as Group, nextId: state.nextId + 1, announcement: 'Added a group.' };
    }
    case 'remove':
      return action.id === state.root.id ? state : { ...state, root: removeNode(state.root, action.id), announcement: 'Removed.' };
    case 'move': {
      const root = moveNode(state.root, action.id, action.delta);
      return root === state.root ? state : { ...state, root, announcement: action.delta < 0 ? 'Moved up.' : 'Moved down.' };
    }
    case 'setCombinator':
      return mapRoot(state, (root) => mapNode(root, action.groupId, (node) => (node.type === 'group' ? { ...node, combinator: action.combinator } : node)), `Match ${action.combinator === 'and' ? 'all' : 'any'} of the conditions.`);
    case 'toggleNegate':
      return mapRoot(state, (root) => mapNode(root, action.groupId, (node) => (node.type === 'group' ? { ...node, negated: !node.negated } : node)), 'Toggled not.');
    case 'changeField':
      return mapRoot(state, (root) => mapNode(root, action.id, (node) => (node.type === 'condition' ? changeField(node, state.fields, action.field) : node)), '');
    case 'changeOperator':
      return mapRoot(state, (root) => mapNode(root, action.id, (node) => (node.type === 'condition' ? changeOperator(node, action.op) : node)), '');
    case 'setValue':
      return mapRoot(state, (root) => mapNode(root, action.id, (node) => (node.type === 'condition' ? { ...node, value: { ...node.value, ...action.patch } } : node)), '');
    case 'clear':
      return { ...state, root: createGroup(ROOT_ID), announcement: 'Cleared the query.' };
    case 'load':
      return { datasetId: action.datasetId, fields: action.fields, root: action.root, nextId: maxId(action.root) + 1, announcement: 'Loaded the saved query.' };
    case 'setDataset':
      return { ...createQueryState(action.datasetId, action.fields), announcement: 'Switched data set.' };
    default:
      return state;
  }
}

// ---------------------------------------------------------------------------- validation

const parseDate = (text: string): number | undefined => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return undefined;
  const time = Date.parse(`${text}T00:00:00Z`);
  return Number.isFinite(time) ? time : undefined;
};

const parseNumber = (text: string): number | undefined => {
  if (text.trim() === '') return undefined;
  const value = Number(text);
  return Number.isFinite(value) ? value : undefined;
};

function singleProblem(kind: FieldKind, text: string, which: 'value' | 'start' | 'end'): string | undefined {
  const name = which === 'value' ? '' : which === 'start' ? 'the start of the range' : 'the end of the range';
  if (kind === 'number') {
    if (text.trim() === '') return which === 'value' ? 'Enter a number.' : `Enter ${name}.`;
    return parseNumber(text) === undefined ? 'Enter a valid number.' : undefined;
  }
  if (kind === 'date') {
    if (text === '') return which === 'value' ? 'Choose a date.' : `Choose ${name}.`;
    return parseDate(text) === undefined ? 'Enter a valid date.' : undefined;
  }
  if (kind === 'enum') return text === '' ? 'Choose a value.' : undefined;
  return text.trim() === '' ? 'Enter text to match.' : undefined;
}

/** Why a condition cannot be used yet, or undefined when it is complete. */
export function validateCondition(condition: Condition, fields: readonly QueryField[]): string | undefined {
  const field = findField(fields, condition.field);
  if (!field) return 'Choose a field.';
  if (!OPERATORS[field.kind].includes(condition.op)) return 'Choose an operator.';
  const { value } = condition;
  switch (shapeOf(condition.op)) {
    case 'none':
      return undefined;
    case 'single':
      return singleProblem(field.kind, value.a, 'value');
    case 'range': {
      const start = singleProblem(field.kind, value.a, 'start');
      if (start) return start;
      const end = singleProblem(field.kind, value.b, 'end');
      if (end) return end;
      const low = field.kind === 'date' ? parseDate(value.a) : parseNumber(value.a);
      const high = field.kind === 'date' ? parseDate(value.b) : parseNumber(value.b);
      return low !== undefined && high !== undefined && low > high ? 'The start must not be after the end.' : undefined;
    }
    case 'multi':
      return value.list.length === 0 ? 'Choose at least one value.' : undefined;
    case 'relative': {
      const amount = parseNumber(value.a);
      return amount === undefined || !Number.isInteger(amount) || amount <= 0 ? 'Enter a whole number above zero.' : undefined;
    }
    default:
      return undefined;
  }
}

/** Reasons by node id: incomplete conditions and groups with nothing in them. */
export function validateQuery(root: Group, fields: readonly QueryField[]): Record<string, string> {
  const issues: Record<string, string> = {};
  const visit = (node: QueryNode, isRoot: boolean) => {
    if (node.type === 'condition') {
      const reason = validateCondition(node, fields);
      if (reason) issues[node.id] = reason;
      return;
    }
    if (node.children.length === 0 && !isRoot) issues[node.id] = 'Add a condition or remove this group.';
    node.children.forEach((child) => visit(child, false));
  };
  visit(root, true);
  return issues;
}

// ---------------------------------------------------------------------------- describing

const DATE_FORMAT = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

function formatDateText(text: string): string {
  const time = parseDate(text);
  return time === undefined ? text : DATE_FORMAT.format(time);
}

const UNIT_NAME: Record<RelativeUnit, [string, string]> = { hours: ['hour', 'hours'], days: ['day', 'days'], weeks: ['week', 'weeks'] };

function joinWords(items: readonly string[], word: 'and' | 'or'): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} ${word} ${items[items.length - 1]}`;
}

/** The value of a condition as the sentence says it: "82 %", "Running or Standby", "7 days". */
export function describeValue(condition: Condition, field: QueryField): string {
  const { value } = condition;
  const optionLabel = (key: string): string => field.options?.find((option) => option.value === key)?.label ?? key;
  const amount = (text: string): string => (field.kind === 'number' && field.unit ? `${text} ${field.unit}` : field.kind === 'date' ? formatDateText(text) : text);
  switch (shapeOf(condition.op)) {
    case 'none':
      return '';
    case 'single':
      if (field.kind === 'enum') return optionLabel(value.a);
      if (field.kind === 'text') return `“${value.a.trim()}”`;
      return amount(value.a);
    case 'range':
      return `${amount(value.a)} and ${amount(value.b)}`;
    case 'multi':
      return joinWords(value.list.map(optionLabel), 'or');
    case 'relative': {
      const [singular, plural] = UNIT_NAME[value.unit];
      return `${value.a} ${Number(value.a) === 1 ? singular : plural}`;
    }
    default:
      return '';
  }
}

/** "Discharge pressure is above 50 barg". Empty when the condition is incomplete. */
export function describeCondition(condition: Condition, fields: readonly QueryField[]): string {
  const field = findField(fields, condition.field);
  if (!field || validateCondition(condition, fields)) return '';
  const value = describeValue(condition, field);
  return `${field.label} ${operatorLabel(condition.op)}${value ? ` ${value}` : ''}`;
}

function describeNode(node: QueryNode, fields: readonly QueryField[], nested: boolean): string {
  if (node.type === 'condition') return describeCondition(node, fields);
  const parts = node.children.map((child) => describeNode(child, fields, true)).filter((part) => part !== '');
  if (parts.length === 0) return '';
  const joined = parts.join(` ${node.combinator} `);
  if (node.negated) return `not (${joined})`;
  return nested && parts.length > 1 ? `(${joined})` : joined;
}

/** The whole query as one sentence: "Work orders where Priority is any of P1 or P2 and not (Status is Done)". */
export function describeQuery(root: Group, fields: readonly QueryField[], noun = 'Records'): string {
  const text = describeNode(root, fields, false);
  return text === '' ? `All ${noun.toLowerCase()}` : `${noun} where ${text}`;
}

export type Chip = { id: string; text: string; group: boolean };

/** One short chip per top-level part of the query. A group collapses to "Any of 3 conditions". */
export function chipsOf(root: Group, fields: readonly QueryField[]): Chip[] {
  const chips: Chip[] = [];
  for (const child of root.children) {
    if (child.type === 'condition') {
      const text = describeCondition(child, fields);
      if (text) chips.push({ id: child.id, text, group: false });
    } else {
      const count = countConditions(child);
      if (count === 0) continue;
      const lead = child.negated ? 'Not' : child.combinator === 'or' ? 'Any of' : 'All of';
      chips.push({ id: child.id, text: `${lead} ${count} condition${count === 1 ? '' : 's'}`, group: true });
    }
  }
  return chips;
}

// ---------------------------------------------------------------------------- evaluation

const UNIT_MS: Record<RelativeUnit, number> = { hours: 3_600_000, days: 86_400_000, weeks: 7 * 86_400_000 };

function compare(cell: Cell, condition: Condition, field: QueryField, now: number): boolean {
  const { value, op } = condition;
  if (op === 'is-empty') return cell === null || cell === '';
  if (op === 'is-not-empty') return cell !== null && cell !== '';
  if (op === 'is-true') return cell === true;
  if (op === 'is-false') return cell === false;
  if (cell === null) return op === 'not-contains' || op === 'text-is-not' || op === 'is-not' || op === 'is-none-of' || op === 'neq';
  if (field.kind === 'text') {
    const text = String(cell).toLowerCase();
    const wanted = value.a.trim().toLowerCase();
    if (op === 'contains') return text.includes(wanted);
    if (op === 'not-contains') return !text.includes(wanted);
    if (op === 'text-is') return text === wanted;
    if (op === 'text-is-not') return text !== wanted;
    return text.startsWith(wanted);
  }
  if (field.kind === 'enum') {
    const text = String(cell);
    if (op === 'is') return text === value.a;
    if (op === 'is-not') return text !== value.a;
    if (op === 'is-any-of') return value.list.includes(text);
    return !value.list.includes(text);
  }
  if (typeof cell !== 'number') return false;
  if (field.kind === 'number') {
    const a = Number(value.a);
    const b = Number(value.b);
    switch (op) {
      case 'eq':
        return cell === a;
      case 'neq':
        return cell !== a;
      case 'gt':
        return cell > a;
      case 'gte':
        return cell >= a;
      case 'lt':
        return cell < a;
      case 'lte':
        return cell <= a;
      default:
        return cell >= a && cell <= b;
    }
  }
  const day = 86_400_000;
  const from = parseDate(value.a) ?? Number.NaN;
  const to = parseDate(value.b) ?? Number.NaN;
  switch (op) {
    case 'before':
      return cell < from;
    case 'after':
      return cell >= from + day;
    case 'date-between':
      return cell >= from && cell < to + day;
    case 'in-last':
      return cell <= now && cell >= now - Number(value.a) * UNIT_MS[value.unit];
    default:
      return cell >= now && cell <= now + Number(value.a) * UNIT_MS[value.unit];
  }
}

type Context = { fields: readonly QueryField[]; now: number };

/** True or false for the record, or null when the node has nothing complete to judge by. */
function evaluateNode(node: QueryNode, record: QueryRecord, context: Context): boolean | null {
  if (node.type === 'condition') {
    const field = findField(context.fields, node.field);
    if (!field || validateCondition(node, context.fields)) return null;
    return compare(record[node.field] ?? null, node, field, context.now);
  }
  const results = node.children.map((child) => evaluateNode(child, record, context)).filter((result): result is boolean => result !== null);
  if (results.length === 0) return null;
  const combined = node.combinator === 'and' ? results.every(Boolean) : results.some(Boolean);
  return node.negated ? !combined : combined;
}

/** Whether a record matches. Incomplete conditions and empty groups are left out, so an empty query matches everything. */
export function matches(root: Group, record: QueryRecord, fields: readonly QueryField[], now: number): boolean {
  return evaluateNode(root, record, { fields, now }) !== false;
}

export function filterRecords<T extends QueryRecord>(root: Group, records: readonly T[], fields: readonly QueryField[], now: number): T[] {
  return records.filter((record) => matches(root, record, fields, now));
}

// ---------------------------------------------------------------------------- saved queries

export type SavedQuery = { id: string; name: string; datasetId: string; root: Group };

// ---------------------------------------------------------------------------- data sets

export type QueryColumn = { key: string; label: string; kind?: FieldKind; unit?: string };

/** What a query runs against: the fields it can use, the records, and the columns the results show. */
export type QueryDataset = {
  id: string;
  /** Name in the data-set picker: "Work orders". */
  label: string;
  /** Plural noun for sentences: "work orders". */
  noun: string;
  fields: readonly QueryField[];
  columns: readonly QueryColumn[];
  records: readonly QueryRecord[];
  /** Field that identifies a record, used as the row key. */
  recordKey: string;
};
