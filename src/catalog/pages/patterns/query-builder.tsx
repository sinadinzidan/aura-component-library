import type { ReactNode } from 'react';

import { Table } from '../../../library/primitives/table/Table';
import { TableBody } from '../../../library/primitives/table/TableBody';
import { TableCaption } from '../../../library/primitives/table/TableCaption';
import { TableCell } from '../../../library/primitives/table/TableCell';
import { TableHead } from '../../../library/primitives/table/TableHead';
import { TableHeader } from '../../../library/primitives/table/TableHeader';
import { TableRow } from '../../../library/primitives/table/TableRow';
import { ThemeScope } from '../../../library/themes/ThemeScope';
import { ConditionRow } from '../../../library/tools/query-builder/ConditionRow';
import { GroupBlock } from '../../../library/tools/query-builder/GroupBlock';
import { QueryBuilder } from '../../../library/tools/query-builder/QueryBuilder';
import { ROOT_ID, operatorLabel, operatorsFor, validateQuery } from '../../../library/tools/query-builder/queryModel';
import type { Condition, FieldKind, Group, QueryDataset, QueryField, QueryValue, SavedQuery } from '../../../library/tools/query-builder/queryModel';
import { QueryChips, QuerySentence } from '../../../library/tools/query-builder/QuerySummary';
import { SavedQueries } from '../../../library/tools/query-builder/SavedQueries';
import { ALARMS, ASSETS, PEOPLE, SENSORS, WORK_ORDERS, findAsset, findPerson } from '../../data/plant';
import { REFERENCE_NOW } from '../../data/series';
import { definePage } from '../../types';

import source from './query-builder.tsx?raw';

const queryNoop = () => undefined;

const labelOf = (text: string): string => `${text.charAt(0).toUpperCase()}${text.slice(1)}`;
const options = (values: readonly string[]) => values.map((value) => ({ value, label: labelOf(value) }));

const QUERY_ASSETS: QueryDataset = {
  id: 'assets',
  label: 'Assets',
  noun: 'assets',
  recordKey: 'tag',
  fields: [
    { key: 'tag', label: 'Tag', kind: 'text' },
    { key: 'name', label: 'Name', kind: 'text' },
    { key: 'type', label: 'Type', kind: 'enum', options: options(['site', 'area', 'system', 'compressor', 'pump', 'separator', 'exchanger', 'valve', 'turbine']) },
    { key: 'state', label: 'State', kind: 'enum', options: options(['running', 'standby', 'stopped', 'tripped', 'maintenance']) },
    { key: 'health', label: 'Health', kind: 'enum', options: options(['good', 'watch', 'poor']) },
    { key: 'healthScore', label: 'Health score', kind: 'number', unit: '%' },
    { key: 'criticality', label: 'Criticality', kind: 'enum', options: [{ value: 'A', label: 'A' }, { value: 'B', label: 'B' }, { value: 'C', label: 'C' }] },
  ],
  columns: [
    { key: 'tag', label: 'Tag' },
    { key: 'name', label: 'Name' },
    { key: 'state', label: 'State' },
    { key: 'health', label: 'Health' },
    { key: 'healthScore', label: 'Score', kind: 'number', unit: '%' },
    { key: 'criticality', label: 'Crit.' },
  ],
  records: ASSETS.map((asset) => ({
    tag: asset.tag,
    name: asset.name,
    type: asset.type,
    state: asset.state,
    health: asset.health,
    healthScore: asset.healthScore,
    criticality: asset.criticality,
  })),
};

const QUERY_SENSORS: QueryDataset = {
  id: 'sensors',
  label: 'Sensors',
  noun: 'sensors',
  recordKey: 'tag',
  fields: [
    { key: 'tag', label: 'Tag', kind: 'text' },
    { key: 'name', label: 'Name', kind: 'text' },
    { key: 'asset', label: 'Asset', kind: 'text' },
    { key: 'unit', label: 'Unit', kind: 'enum', options: [...new Set(SENSORS.map((sensor) => sensor.unit))].map((unit) => ({ value: unit, label: unit })) },
    { key: 'quality', label: 'Quality', kind: 'enum', options: options(['good', 'uncertain', 'bad']) },
    { key: 'value', label: 'Value', kind: 'number' },
    { key: 'headroom', label: 'Headroom to high limit', kind: 'number', unit: '%' },
    { key: 'overLimit', label: 'Above high limit', kind: 'boolean' },
  ],
  columns: [
    { key: 'tag', label: 'Tag' },
    { key: 'name', label: 'Name' },
    { key: 'asset', label: 'Asset' },
    { key: 'value', label: 'Value', kind: 'number' },
    { key: 'unit', label: 'Unit' },
    { key: 'quality', label: 'Quality' },
  ],
  records: SENSORS.map((sensor) => ({
    tag: sensor.tag,
    name: sensor.name,
    asset: findAsset(sensor.assetId)?.tag ?? '',
    unit: sensor.unit,
    quality: sensor.quality,
    value: sensor.value,
    headroom: Math.round(((sensor.highLimit - sensor.value) / sensor.highLimit) * 1000) / 10,
    overLimit: sensor.value > sensor.highLimit,
  })),
};

const QUERY_ALARMS: QueryDataset = {
  id: 'alarms',
  label: 'Alarms',
  noun: 'alarms',
  recordKey: 'id',
  fields: [
    { key: 'id', label: 'Alarm', kind: 'text' },
    { key: 'message', label: 'Message', kind: 'text' },
    { key: 'severity', label: 'Severity', kind: 'enum', options: options(['critical', 'high', 'medium', 'low']) },
    { key: 'state', label: 'State', kind: 'enum', options: options(['active', 'acknowledged', 'shelved', 'cleared']) },
    { key: 'asset', label: 'Asset', kind: 'text' },
    { key: 'raisedAt', label: 'Raised', kind: 'date' },
  ],
  columns: [
    { key: 'id', label: 'Alarm' },
    { key: 'severity', label: 'Severity' },
    { key: 'message', label: 'Message' },
    { key: 'asset', label: 'Asset' },
    { key: 'state', label: 'State' },
    { key: 'raisedAt', label: 'Raised', kind: 'date' },
  ],
  records: ALARMS.map((alarm) => ({
    id: alarm.id,
    message: alarm.message,
    severity: alarm.severity,
    state: alarm.state,
    asset: findAsset(alarm.assetId)?.tag ?? '',
    raisedAt: alarm.raisedAt,
  })),
};

const QUERY_ORDERS: QueryDataset = {
  id: 'orders',
  label: 'Work orders',
  noun: 'work orders',
  recordKey: 'id',
  fields: [
    { key: 'id', label: 'Work order', kind: 'text' },
    { key: 'title', label: 'Title', kind: 'text' },
    { key: 'type', label: 'Type', kind: 'enum', options: options(['corrective', 'preventive', 'inspection', 'modification']) },
    { key: 'priority', label: 'Priority', kind: 'enum', options: [{ value: 'P1', label: 'P1' }, { value: 'P2', label: 'P2' }, { value: 'P3', label: 'P3' }, { value: 'P4', label: 'P4' }] },
    { key: 'status', label: 'Status', kind: 'enum', options: [{ value: 'open', label: 'Open' }, { value: 'planned', label: 'Planned' }, { value: 'in-progress', label: 'In progress' }, { value: 'waiting', label: 'Waiting' }, { value: 'done', label: 'Done' }] },
    { key: 'assignee', label: 'Assignee', kind: 'enum', options: [{ value: 'none', label: 'Unassigned' }, ...PEOPLE.map((person) => ({ value: person.id, label: person.name }))] },
    { key: 'dueAt', label: 'Due', kind: 'date' },
    { key: 'hours', label: 'Estimated effort', kind: 'number', unit: 'h' },
    { key: 'overdue', label: 'Overdue', kind: 'boolean' },
  ],
  columns: [
    { key: 'id', label: 'Work order' },
    { key: 'title', label: 'Title' },
    { key: 'priority', label: 'Priority' },
    { key: 'status', label: 'Status' },
    { key: 'assigneeName', label: 'Assignee' },
    { key: 'dueAt', label: 'Due', kind: 'date' },
    { key: 'hours', label: 'Effort', kind: 'number', unit: 'h' },
  ],
  records: WORK_ORDERS.map((order) => ({
    id: order.id,
    title: order.title,
    type: order.type,
    priority: order.priority,
    status: order.status,
    assignee: order.assigneeId ?? 'none',
    assigneeName: findPerson(order.assigneeId)?.name ?? 'Unassigned',
    dueAt: order.dueAt,
    hours: order.estimatedHours,
    overdue: order.status !== 'done' && order.dueAt < REFERENCE_NOW,
  })),
};

const QUERY_DATASETS = [QUERY_ORDERS, QUERY_ASSETS, QUERY_SENSORS, QUERY_ALARMS];

const val = (patch: Partial<QueryValue>): QueryValue => ({ a: '', b: '', list: [], unit: 'days', ...patch });
const cond = (id: string, field: string, op: Condition['op'], patch: Partial<QueryValue> = {}): Condition => ({ id, type: 'condition', field, op, value: val(patch) });
const group = (id: string, combinator: 'and' | 'or', children: Group['children'], negated = false): Group => ({ id, type: 'group', combinator, negated, children });

const QUERY_URGENT: Group = group(ROOT_ID, 'and', [
  cond('c1', 'priority', 'is-any-of', { list: ['P1', 'P2'] }),
  cond('c2', 'status', 'is-not', { a: 'done' }),
  group('g1', 'or', [cond('c3', 'assignee', 'is', { a: 'none' }), cond('c4', 'dueAt', 'in-next', { a: '2', unit: 'days' })]),
]);

const QUERY_NEGATED: Group = group(ROOT_ID, 'and', [
  cond('c1', 'state', 'is', { a: 'running' }),
  group('g1', 'or', [cond('c2', 'type', 'is', { a: 'pump' }), cond('c3', 'type', 'is', { a: 'valve' })], true),
]);

const QUERY_INVALID: Group = group(ROOT_ID, 'and', [
  cond('c1', 'priority', 'is-any-of'),
  cond('c2', 'hours', 'between', { a: '12', b: '4' }),
  cond('c3', 'dueAt', 'in-last', { a: '0' }),
  group('g1', 'or', []),
]);

const QUERY_DEEP: Group = group(ROOT_ID, 'and', [
  cond('c1', 'status', 'is-not', { a: 'done' }),
  group('g1', 'or', [cond('c2', 'priority', 'is', { a: 'P1' }), group('g2', 'and', [cond('c3', 'type', 'is', { a: 'corrective' }), cond('c4', 'overdue', 'is-true')])]),
]);

const QUERY_SAVED: SavedQuery[] = [
  { id: 's1', name: 'Urgent and unassigned', datasetId: 'orders', root: QUERY_URGENT },
  { id: 's2', name: 'Running, not pumps or valves', datasetId: 'assets', root: QUERY_NEGATED },
  {
    id: 's3',
    name: 'Critical alarms this week',
    datasetId: 'alarms',
    root: group(ROOT_ID, 'and', [cond('c1', 'severity', 'is-any-of', { list: ['critical', 'high'] }), cond('c2', 'raisedAt', 'in-last', { a: '7', unit: 'days' })]),
  },
];

const noDispatch = queryNoop;

function QueryFrame({ height, children }: { height?: string; children: ReactNode }) {
  return <div className={`w-full overflow-y-auto rounded-xl bg-card-background p-4 ${height ?? ''}`}>{children}</div>;
}

function QueryBuilderFull() {
  return (
    <QueryFrame height="h-[48rem]">
      <QueryBuilder datasets={QUERY_DATASETS} initialRoot={QUERY_URGENT} savedQueries={QUERY_SAVED} now={REFERENCE_NOW} />
    </QueryFrame>
  );
}

function QueryBuilderCompact() {
  return (
    <QueryFrame>
      <QueryBuilder
        compact
        datasets={[QUERY_ALARMS]}
        initialRoot={group(ROOT_ID, 'and', [cond('c1', 'severity', 'is-any-of', { list: ['critical', 'high'] }), cond('c2', 'state', 'is-not', { a: 'cleared' })])}
        now={REFERENCE_NOW}
      />
    </QueryFrame>
  );
}

function QueryBuilderRow({ condition, problem }: { condition: Condition; problem?: string }) {
  return (
    <ul className="w-full">
      <ConditionRow
        condition={condition}
        fields={QUERY_ORDERS.fields}
        position={1}
        problem={problem}
        onChangeField={queryNoop}
        onChangeOperator={queryNoop}
        onChangeValue={queryNoop}
        onRemove={queryNoop}
        onMove={queryNoop}
      />
    </ul>
  );
}

function QueryBuilderRowText() {
  return <QueryBuilderRow condition={cond('c1', 'title', 'contains', { a: 'bearing' })} />;
}

function QueryBuilderRowNumber() {
  return <QueryBuilderRow condition={cond('c1', 'hours', 'between', { a: '4', b: '16' })} />;
}

function QueryBuilderRowEnum() {
  return <QueryBuilderRow condition={cond('c1', 'priority', 'is-any-of', { list: ['P1', 'P2'] })} />;
}

function QueryBuilderRowDate() {
  return <QueryBuilderRow condition={cond('c1', 'dueAt', 'in-next', { a: '7', unit: 'days' })} />;
}

function QueryBuilderRowBoolean() {
  return <QueryBuilderRow condition={cond('c1', 'overdue', 'is-true')} />;
}

function QueryBuilderRowInvalid() {
  return <QueryBuilderRow condition={cond('c1', 'hours', 'between', { a: '12', b: '4' })} problem="The start must not be after the end." />;
}

const OPERATOR_KINDS: readonly { kind: FieldKind; label: string; example: QueryField }[] = [
  { kind: 'text', label: 'Text', example: { key: 't', label: 'Title', kind: 'text' } },
  { kind: 'number', label: 'Number', example: { key: 'n', label: 'Effort', kind: 'number', unit: 'h' } },
  { kind: 'enum', label: 'Choice', example: { key: 'e', label: 'Priority', kind: 'enum' } },
  { kind: 'date', label: 'Date', example: { key: 'd', label: 'Due', kind: 'date' } },
  { kind: 'boolean', label: 'Yes or no', example: { key: 'b', label: 'Overdue', kind: 'boolean' } },
];

function QueryBuilderOperatorSets() {
  return (
    <Table>
      <TableCaption srOnly>Operators offered for each field type</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Field type</TableHead>
          <TableHead>Operators</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {OPERATOR_KINDS.map((entry) => (
          <TableRow key={entry.kind}>
            <TableCell rowHeader wrap="nowrap" className="align-top">
              {entry.label}
            </TableCell>
            <TableCell className="align-top">{operatorsFor(entry.kind).map((op) => operatorLabel(op)).join(' · ')}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function QueryBuilderGroupNested() {
  return (
    <QueryFrame>
      <GroupBlock group={QUERY_DEEP} root={QUERY_DEEP} fields={QUERY_ORDERS.fields} issues={{}} dispatch={noDispatch} />
    </QueryFrame>
  );
}

function QueryBuilderGroupNegated() {
  return (
    <QueryFrame>
      <GroupBlock group={QUERY_NEGATED} root={QUERY_NEGATED} fields={QUERY_ASSETS.fields} issues={{}} dispatch={noDispatch} />
    </QueryFrame>
  );
}

function QueryBuilderSentence() {
  return (
    <div className="w-full max-w-xl">
      <QuerySentence root={QUERY_URGENT} fields={QUERY_ORDERS.fields} noun="Work orders" />
    </div>
  );
}

function QueryBuilderChips() {
  return (
    <div className="w-full">
      <QueryChips root={QUERY_URGENT} fields={QUERY_ORDERS.fields} noun="work orders" />
    </div>
  );
}

function QueryBuilderInvalid() {
  const issues = validateQuery(QUERY_INVALID, QUERY_ORDERS.fields);
  return (
    <QueryFrame>
      <GroupBlock group={QUERY_INVALID} root={QUERY_INVALID} fields={QUERY_ORDERS.fields} issues={issues} dispatch={noDispatch} />
    </QueryFrame>
  );
}

function QueryBuilderEmpty() {
  return (
    <QueryFrame>
      <QueryBuilder datasets={[QUERY_ORDERS]} now={REFERENCE_NOW} hideResults />
    </QueryFrame>
  );
}

function QueryBuilderSaved() {
  return (
    <QueryFrame>
      <SavedQueries queries={QUERY_SAVED} datasets={QUERY_DATASETS} activeId="s1" onLoad={queryNoop} onDelete={queryNoop} onSave={queryNoop} />
    </QueryFrame>
  );
}

function QueryBuilderReadOnly() {
  return (
    <QueryFrame>
      <div className="flex flex-col gap-3">
        <span className="text-xs font-medium text-muted-foreground">Saved by Liv Wold · read-only</span>
        <GroupBlock group={QUERY_URGENT} root={QUERY_URGENT} fields={QUERY_ORDERS.fields} issues={{}} dispatch={noDispatch} readOnly />
      </div>
    </QueryFrame>
  );
}

function QueryBuilderDark() {
  return (
    <ThemeScope preset="control-room" className="w-full">
      <QueryFrame height="h-[40rem]">
        <QueryBuilder datasets={QUERY_DATASETS} initialRoot={QUERY_URGENT} savedQueries={QUERY_SAVED} now={REFERENCE_NOW} />
      </QueryFrame>
    </ThemeScope>
  );
}

export default definePage({
  id: 'query-builder',
  title: 'Query builder',
  summary: 'Nested and/or filters over typed fields, restated in words and run live against the plant data.',
  guidance: {
    use: [
      'Let the field decide the operators and the operator decide the value editor, so no condition can be nonsense.',
      'Restate the query as a sentence and a few chips, so people can check what they built at a glance.',
      'Show the live result count; say why a condition is incomplete instead of quietly ignoring it.',
    ],
    avoid: [
      'Unlimited nesting. Cap the depth, disable the button and say why.',
      'An and/or toggle with no wording: write what each setting means beside it.',
      'Empty results with no way forward. Suggest removing a condition or widening a range.',
    ],
  },
  source,
  sections: [
    {
      id: 'builders',
      title: 'The builders',
      description: 'Working query builders: edit the query and watch the results change.',
      specimens: [
        {
          id: 'QueryBuilderFull',
          title: 'Full builder',
          note: 'Pick it for a power-user filter: nested groups, four data sets, live results and saved queries.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['tools/query-builder/QueryBuilder.tsx', 'tools/query-builder/GroupBlock.tsx', 'tools/query-builder/ResultsTable.tsx', 'tools/query-builder/SavedQueries.tsx'],
          Component: QueryBuilderFull,
        },
        {
          id: 'QueryBuilderCompact',
          title: 'Compact filter',
          note: 'Pick it for a toolbar filter: one level of conditions joined by And or Or, no groups.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['tools/query-builder/QueryBuilder.tsx'],
          Component: QueryBuilderCompact,
        },
      ],
    },
    {
      id: 'conditions',
      title: 'Conditions',
      description: 'One condition per field type; the operator set and the value editor follow.',
      specimens: [
        {
          id: 'QueryBuilderRowText',
          title: 'Text condition',
          note: 'Pick it for free text: contains, starts with, is empty.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['tools/query-builder/ConditionRow.tsx'],
          Component: QueryBuilderRowText,
        },
        {
          id: 'QueryBuilderRowNumber',
          title: 'Number range',
          note: 'Pick it for measurements: a range shows two ends, each with the unit.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['tools/query-builder/ConditionRow.tsx', 'tools/query-builder/ValueEditor.tsx'],
          Component: QueryBuilderRowNumber,
        },
        {
          id: 'QueryBuilderRowEnum',
          title: 'Choice, any of',
          note: 'Pick it for a fixed list: any-of opens a multi-select with chips.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['tools/query-builder/ConditionRow.tsx', 'tools/query-builder/ValueEditor.tsx'],
          Component: QueryBuilderRowEnum,
        },
        {
          id: 'QueryBuilderRowDate',
          title: 'Relative date',
          note: 'Pick it for rolling windows: "in the next 7 days" stays true tomorrow.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['tools/query-builder/ConditionRow.tsx', 'tools/query-builder/ValueEditor.tsx'],
          Component: QueryBuilderRowDate,
        },
        {
          id: 'QueryBuilderRowBoolean',
          title: 'Yes or no',
          note: 'Pick it for flags: the operator carries the whole condition, so no value is asked for.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['tools/query-builder/ConditionRow.tsx'],
          Component: QueryBuilderRowBoolean,
        },
        {
          id: 'QueryBuilderRowInvalid',
          title: 'Invalid condition',
          note: 'Pick it for an incomplete or contradictory condition: the reason sits under it and the query ignores it.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['tools/query-builder/ConditionRow.tsx'],
          Component: QueryBuilderRowInvalid,
        },
        {
          id: 'QueryBuilderOperatorSets',
          title: 'Operator sets',
          note: 'Pick it as a reference for which operators each field type offers.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['tools/query-builder/queryModel.ts', 'primitives/table/Table.tsx', 'primitives/table/TableCaption.tsx'],
          Component: QueryBuilderOperatorSets,
        },
      ],
    },
    {
      id: 'groups',
      title: 'Groups and summaries',
      description: 'Nesting, negation, the sentence and the chips.',
      specimens: [
        {
          id: 'QueryBuilderGroupNested',
          title: 'Nested groups',
          note: 'Pick it for logic that needs brackets: a group inside a group, down to the depth limit.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['tools/query-builder/GroupBlock.tsx'],
          Component: QueryBuilderGroupNested,
        },
        {
          id: 'QueryBuilderGroupNegated',
          title: 'Negated group',
          note: 'Pick it to exclude a set: Not turns "pumps or valves" into everything else.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['tools/query-builder/GroupBlock.tsx'],
          Component: QueryBuilderGroupNegated,
        },
        {
          id: 'QueryBuilderSentence',
          title: 'Sentence summary',
          note: 'Pick it above results: the query in plain words, with brackets only where they matter.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['tools/query-builder/QuerySummary.tsx'],
          Component: QueryBuilderSentence,
        },
        {
          id: 'QueryBuilderChips',
          title: 'Chip summary',
          note: 'Pick it where space is tight: one chip per top-level part, groups collapsed to a count.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['tools/query-builder/QuerySummary.tsx'],
          Component: QueryBuilderChips,
        },
        {
          id: 'QueryBuilderInvalid',
          title: 'Invalid query',
          note: 'Pick it to show every problem at once, including a group with nothing in it.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['tools/query-builder/GroupBlock.tsx'],
          Component: QueryBuilderInvalid,
        },
        {
          id: 'QueryBuilderEmpty',
          title: 'Empty query',
          note: 'Pick it for a new filter: say that every record matches and offer the first condition.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['tools/query-builder/QueryBuilder.tsx'],
          Component: QueryBuilderEmpty,
        },
      ],
    },
    {
      id: 'saved',
      title: 'Saved and shared queries',
      specimens: [
        {
          id: 'QueryBuilderSaved',
          title: 'Saved queries',
          note: 'Pick it to keep named queries: each shows its chips and loads with one click.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['tools/query-builder/SavedQueries.tsx'],
          Component: QueryBuilderSaved,
        },
        {
          id: 'QueryBuilderReadOnly',
          title: 'Read-only query',
          note: 'Pick it to show someone else’s query without letting them edit it.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['tools/query-builder/GroupBlock.tsx'],
          Component: QueryBuilderReadOnly,
        },
        {
          id: 'QueryBuilderDark',
          title: 'Dark scope',
          note: 'Pick it to check groups, chips and the results table on a dark control-room surface.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['tools/query-builder/QueryBuilder.tsx', 'themes/ThemeScope.tsx'],
          Component: QueryBuilderDark,
        },
      ],
    },
  ],
});
