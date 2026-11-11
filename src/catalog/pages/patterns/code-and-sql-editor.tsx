import { Kbd } from '@cognite/aura/components/kbd';
import { useState } from 'react';

import { ThemeScope } from '../../../library/themes/ThemeScope';
import { CodeEditor } from '../../../library/tools/code-editor/CodeEditor';
import { DiffView } from '../../../library/tools/code-editor/DiffView';
import { ErrorPanel } from '../../../library/tools/code-editor/ErrorPanel';
import { ExpressionEditor } from '../../../library/tools/code-editor/ExpressionEditor';
import { JsonPanel } from '../../../library/tools/code-editor/JsonPanel';
import { QueryHistoryList, SnippetList } from '../../../library/tools/code-editor/QueryLists';
import { QueryWorkbench } from '../../../library/tools/code-editor/QueryWorkbench';
import { ResultsTable } from '../../../library/tools/code-editor/ResultsTable';
import { SchemaBrowser } from '../../../library/tools/code-editor/SchemaBrowser';
import { runQuery } from '../../../library/tools/code-editor/sqlEvaluator';
import type { Database } from '../../../library/tools/code-editor/sqlTypes';
import type { HistoryEntry, Snippet } from '../../../library/tools/code-editor/workbenchState';
import { ALARMS, ASSETS, SENSORS, WORK_ORDERS, findPerson } from '../../data/plant';
import { definePage } from '../../types';

import source from './code-and-sql-editor.tsx?raw';

const CODESQL_ISO = (timestamp: number): string => new Date(timestamp).toISOString().slice(0, 16).replace('T', ' ');

/** The plant data as four tables, so a query can be run against the same records the other pages show. */
const CODESQL_DATABASE: Database = [
  {
    name: 'assets',
    description: 'Equipment in the asset hierarchy',
    columns: [
      { name: 'id', type: 'text' },
      { name: 'tag', type: 'text' },
      { name: 'name', type: 'text' },
      { name: 'type', type: 'text' },
      { name: 'state', type: 'text' },
      { name: 'health', type: 'text' },
      { name: 'health_score', type: 'number' },
      { name: 'criticality', type: 'text' },
    ],
    rows: ASSETS.map((asset) => ({
      id: asset.id,
      tag: asset.tag,
      name: asset.name,
      type: asset.type,
      state: asset.state,
      health: asset.health,
      health_score: asset.healthScore,
      criticality: asset.criticality,
    })),
  },
  {
    name: 'sensors',
    description: 'Instruments and their latest reading',
    columns: [
      { name: 'tag', type: 'text' },
      { name: 'name', type: 'text' },
      { name: 'asset_id', type: 'text' },
      { name: 'unit', type: 'text' },
      { name: 'value', type: 'number' },
      { name: 'low_limit', type: 'number' },
      { name: 'high_limit', type: 'number' },
      { name: 'quality', type: 'text' },
    ],
    rows: SENSORS.map((sensor) => ({
      tag: sensor.tag,
      name: sensor.name,
      asset_id: sensor.assetId,
      unit: sensor.unit,
      value: sensor.value,
      low_limit: sensor.lowLimit,
      high_limit: sensor.highLimit,
      quality: sensor.quality,
    })),
  },
  {
    name: 'alarms',
    description: 'Alarms raised in the last three days',
    columns: [
      { name: 'id', type: 'text' },
      { name: 'severity', type: 'text' },
      { name: 'message', type: 'text' },
      { name: 'sensor_tag', type: 'text' },
      { name: 'asset_id', type: 'text' },
      { name: 'state', type: 'text' },
      { name: 'raised_at', type: 'timestamp' },
    ],
    rows: ALARMS.map((alarm) => ({
      id: alarm.id,
      severity: alarm.severity,
      message: alarm.message,
      sensor_tag: alarm.sensorTag,
      asset_id: alarm.assetId,
      state: alarm.state,
      raised_at: CODESQL_ISO(alarm.raisedAt),
    })),
  },
  {
    name: 'work_orders',
    description: 'Open and recent work orders',
    columns: [
      { name: 'id', type: 'text' },
      { name: 'title', type: 'text' },
      { name: 'asset_id', type: 'text' },
      { name: 'type', type: 'text' },
      { name: 'priority', type: 'text' },
      { name: 'status', type: 'text' },
      { name: 'assignee', type: 'text' },
      { name: 'due_at', type: 'timestamp' },
      { name: 'estimated_hours', type: 'number' },
      { name: 'progress', type: 'number' },
    ],
    rows: WORK_ORDERS.map((order) => ({
      id: order.id,
      title: order.title,
      asset_id: order.assetId,
      type: order.type,
      priority: order.priority,
      status: order.status,
      assignee: findPerson(order.assigneeId)?.name ?? null,
      due_at: CODESQL_ISO(order.dueAt),
      estimated_hours: order.estimatedHours,
      progress: order.progress,
    })),
  },
];

const CODESQL_QUERY = [
  '-- Sensors close to their high limit',
  'SELECT tag, name, value, high_limit',
  'FROM sensors',
  "WHERE unit = 'barg' OR unit = '°C'",
  'ORDER BY value DESC',
  'LIMIT 8',
].join('\n');

const CODESQL_SNIPPETS: readonly Snippet[] = [
  { id: 'snippet-a', name: 'Active alarms', sql: "SELECT id, severity, message\nFROM alarms\nWHERE state = 'active'\nORDER BY severity" },
  { id: 'snippet-b', name: 'Unassigned work', sql: 'SELECT id, title, priority\nFROM work_orders\nWHERE assignee IS NULL' },
  { id: 'snippet-c', name: 'Poor health, critical assets', sql: "SELECT tag, name, health_score\nFROM assets\nWHERE health = 'poor' AND criticality = 'A'" },
];

const CODESQL_HISTORY: readonly HistoryEntry[] = [
  { id: 3, sql: "SELECT id, severity FROM alarms WHERE state = 'active'", ok: true, summary: '3 rows · 2 columns' },
  { id: 2, sql: 'SELECT tag, value FROM sensor', ok: false, summary: 'Table "sensor" does not exist. Did you mean sensors?' },
  { id: 1, sql: 'SELECT * FROM work_orders LIMIT 5', ok: true, summary: '5 rows · 10 columns' },
];

const CODESQL_BAD_QUERY = 'SELECT tag, vlaue\nFROM sensors\nWHERE unit = \'barg\'';

const CODESQL_JSON = JSON.stringify(
  {
    externalId: 'compressor-health',
    source: { database: 'plant', table: 'sensors', filter: { unit: 'barg' } },
    schedule: { cron: '*/15 * * * *', timezone: 'Europe/Oslo' },
    outputs: [{ name: 'high_pressure', limit: 52 }],
  },
  null,
  2
);

const CODESQL_JSON_BROKEN = '{\n  "externalId": "compressor-health",\n  "schedule": {\n    "cron": "*/15 * * * *"\n    "timezone": "Europe/Oslo"\n  }\n}';

const CODESQL_YAML = [
  '# Transformation config, managed in the deployment pipeline',
  'externalId: compressor-health',
  'destination:',
  '  type: time_series',
  '  dataSet: plant-operations',
  'schedule:',
  '  cron: "*/15 * * * *"',
  '  timezone: Europe/Oslo',
  'query: |',
  '  SELECT tag, value',
  '  FROM sensors',
  "  WHERE unit = 'barg'",
].join('\n');

const CODESQL_QUERY_BEFORE = 'SELECT tag, value\nFROM sensors\nWHERE unit = \'barg\'\nLIMIT 10';
const CODESQL_QUERY_AFTER = 'SELECT tag, value, high_limit\nFROM sensors\nWHERE unit = \'barg\'\n  AND value > 20\nLIMIT 10';

const CODESQL_INPUTS = { discharge: 48.6, suction: 12.4 };

function codeSqlRun(sql: string) {
  const result = runQuery(sql, CODESQL_DATABASE);
  if (!result.ok) throw new Error(result.error.message);
  return result;
}

function CodeSqlWorkbench() {
  return (
    <div className="h-[40rem] w-full">
      <QueryWorkbench database={CODESQL_DATABASE} initialQuery={CODESQL_QUERY} runOnStart snippets={CODESQL_SNIPPETS} history={CODESQL_HISTORY} />
    </div>
  );
}

function CodeSqlExpression() {
  return (
    <div className="w-full max-w-lg">
      <ExpressionEditor label="Compression ratio expression" initialValue="round(discharge / suction, 2)" inputs={CODESQL_INPUTS} unit="ratio" />
    </div>
  );
}

function CodeSqlExpressionInvalid() {
  return (
    <div className="w-full max-w-lg">
      <ExpressionEditor label="Expression with a mistake" initialValue="discharge / (suction - 12.4)" inputs={CODESQL_INPUTS} unit="ratio" />
    </div>
  );
}

function CodeSqlJsonValid() {
  return (
    <div className="w-full max-w-xl">
      <JsonPanel label="Transformation settings" initialValue={CODESQL_JSON} heightClassName="h-64" />
    </div>
  );
}

function CodeSqlEditorAlone() {
  const [text, setText] = useState(CODESQL_QUERY);
  return (
    <div className="w-full max-w-xl">
      <CodeEditor label="Query" language="sql" value={text} onChange={setText} heightClassName="h-56" />
    </div>
  );
}

function CodeSqlEditorLoading() {
  const [text, setText] = useState(CODESQL_QUERY);
  return (
    <div className="w-full max-w-xl">
      <CodeEditor label="Query, highlighter not loaded" language="sql" value={text} onChange={setText} heightClassName="h-56" highlighter={() => new Promise(() => {})} />
    </div>
  );
}

function CodeSqlShortcuts() {
  const rows = [
    [['Ctrl', '↵'], 'Run the query'],
    [['Tab'], 'Indent the selected lines'],
    [['Shift', 'Tab'], 'Outdent'],
    [['Ctrl', '/'], 'Comment or uncomment'],
    [['Ctrl', 'Z'], 'Undo'],
    [['Esc', 'Tab'], 'Leave the editor'],
  ] as const;
  return (
    <dl className="flex w-full max-w-xs flex-col gap-2 text-sm">
      {rows.map(([keys, action]) => (
        <div key={action} className="flex items-center justify-between gap-3">
          <dt className="text-medium-foreground">{action}</dt>
          <dd className="flex shrink-0 items-center gap-1">
            {keys.map((key) => (
              <Kbd key={key}>{key}</Kbd>
            ))}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function CodeSqlResultsTable() {
  return (
    <div className="w-full">
      <ResultsTable caption="Sensors by value" result={codeSqlRun('SELECT tag, name, unit, value, high_limit FROM sensors ORDER BY value DESC LIMIT 6')} heightClassName="max-h-72" />
    </div>
  );
}

function CodeSqlEmptyResult() {
  return (
    <div className="w-full max-w-md">
      <ResultsTable caption="Critical alarms that are cleared" result={codeSqlRun("SELECT id, message FROM alarms WHERE severity = 'critical' AND state = 'cleared'")} />
    </div>
  );
}

function CodeSqlErrorMarker() {
  const result = runQuery(CODESQL_BAD_QUERY, CODESQL_DATABASE);
  const error = result.ok ? null : result.error;
  return (
    <div className="flex w-full max-w-xl flex-col gap-3">
      <CodeEditor label="Query with an unknown column" language="sql" value={CODESQL_BAD_QUERY} readOnly error={error} heightClassName="h-32" />
      {error ? <ErrorPanel text={CODESQL_BAD_QUERY} error={error} /> : null}
    </div>
  );
}

function CodeSqlSyntaxError() {
  const sql = "SELECT tag FROM sensors WHERE unit = 'barg";
  const result = runQuery(sql, CODESQL_DATABASE);
  return <div className="w-full max-w-xl">{result.ok ? null : <ErrorPanel text={sql} error={result.error} />}</div>;
}

function CodeSqlTypeError() {
  const sql = "SELECT id FROM alarms WHERE severity > 3";
  const result = runQuery(sql, CODESQL_DATABASE);
  return <div className="w-full max-w-xl">{result.ok ? null : <ErrorPanel text={sql} error={result.error} />}</div>;
}

function CodeSqlSchema() {
  const [last, setLast] = useState('');
  return (
    <div className="flex w-full max-w-xs flex-col gap-2">
      <SchemaBrowser database={CODESQL_DATABASE} defaultOpen={['alarms']} onInsert={setLast} />
      <output className="text-xs text-muted-foreground">{last ? `Inserted ${last}` : 'Choose a name to insert it'}</output>
    </div>
  );
}

function CodeSqlHistory() {
  const [picked, setPicked] = useState('');
  return (
    <div className="flex w-full max-w-xs flex-col gap-2">
      <QueryHistoryList entries={CODESQL_HISTORY} onPick={setPicked} />
      <output className="truncate font-mono text-xs text-muted-foreground">{picked ? `Loaded ${picked.slice(0, 28)}` : ''}</output>
    </div>
  );
}

function CodeSqlSnippets() {
  const [snippets, setSnippets] = useState<readonly Snippet[]>(CODESQL_SNIPPETS);
  return (
    <div className="w-full max-w-xs">
      <SnippetList
        snippets={snippets}
        onPick={() => {}}
        onRemove={(id) => setSnippets((current) => current.filter((snippet) => snippet.id !== id))}
        onSave={(name) => setSnippets((current) => [...current, { id: `snippet-${current.length + 10}`, name: name.trim() || 'Untitled query', sql: CODESQL_QUERY }])}
      />
    </div>
  );
}

function CodeSqlJsonInvalid() {
  return (
    <div className="w-full max-w-xl">
      <JsonPanel label="Settings with a missing comma" initialValue={CODESQL_JSON_BROKEN} heightClassName="h-48" />
    </div>
  );
}

function CodeSqlYamlReadOnly() {
  return (
    <div className="w-full max-w-xl">
      <CodeEditor label="Transformation config" language="yaml" value={CODESQL_YAML} readOnly description="Read only. This configuration is changed through the deployment pipeline." heightClassName="h-64" />
      <p className="pt-2 text-xs text-muted-foreground">Read only. Changed through the deployment pipeline.</p>
    </div>
  );
}

function CodeSqlReadOnlyQuery() {
  return (
    <div className="w-full max-w-xl">
      <CodeEditor label="Published query" language="sql" value={CODESQL_QUERY} readOnly description="Read only. Published queries are edited as a new version." heightClassName="h-48" />
      <p className="pt-2 text-xs text-muted-foreground">Read only. Edit a copy to change it.</p>
    </div>
  );
}

function CodeSqlDiff() {
  return (
    <div className="w-full max-w-xl">
      <DiffView label="Changes to the query" before={CODESQL_QUERY_BEFORE} after={CODESQL_QUERY_AFTER} />
    </div>
  );
}

function CodeSqlDarkScope() {
  return (
    <ThemeScope preset="control-room" className="w-full rounded-xl bg-base-background p-4">
      <div className="h-[36rem] w-full">
        <QueryWorkbench database={CODESQL_DATABASE} initialQuery={CODESQL_QUERY} runOnStart snippets={CODESQL_SNIPPETS} history={CODESQL_HISTORY} defaultTab="snippets" />
      </div>
    </ThemeScope>
  );
}

export default definePage({
  id: 'code-and-sql-editor',
  title: 'Code and SQL editor',
  summary:
    'A query workbench with a highlighted editor, run, results, errors that point at the offending token, history, snippets and a schema browser; plus JSON validation, a single-line expression editor and read-only configuration.',
  guidance: {
    use: [
      'A real labelled textarea under the highlighting, so selection, caret and assistive technology behave like any field.',
      'Errors with a position: underline the token in the editor and say line, column and what to change.',
      'Keep Run on Ctrl+Enter and always on a visible button; Esc then Tab leaves the editor.',
    ],
    avoid: [
      'Running a query silently when it is empty or unchanged; say what happened.',
      'Hiding results behind a modal. Keep them under the editor so the query stays in view.',
      'Making configuration editable where it is owned elsewhere; show it read-only and say where to change it.',
    ],
  },
  source,
  sections: [
    {
      id: 'workbench',
      title: 'Workbench and editors',
      description: 'Edit the query, press Ctrl+Enter, click a table in the schema, load a snippet.',
      specimens: [
        {
          id: 'CodeSqlWorkbench',
          title: 'Query workbench',
          note: 'Analysts querying plant data: editor, results and a sidebar for schema, history and snippets.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: [
            'tools/code-editor/QueryWorkbench.tsx',
            'tools/code-editor/CodeEditor.tsx',
            'tools/code-editor/ResultsTable.tsx',
            'tools/code-editor/ErrorPanel.tsx',
            'tools/code-editor/SchemaBrowser.tsx',
            'tools/code-editor/QueryLists.tsx',
            'tools/code-editor/sqlEvaluator.ts',
          ],
          Component: CodeSqlWorkbench,
        },
        {
          id: 'CodeSqlExpression',
          title: 'Expression editor',
          note: 'Calculated tags: one line, a live sample result and buttons that insert source names.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['tools/code-editor/ExpressionEditor.tsx', 'tools/code-editor/expression.ts'],
          Component: CodeSqlExpression,
        },
        {
          id: 'CodeSqlExpressionInvalid',
          title: 'Expression with an error',
          note: 'A mistake is underlined where it is and explained in the helper line.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['tools/code-editor/ExpressionEditor.tsx'],
          Component: CodeSqlExpressionInvalid,
        },
      ],
    },
    {
      id: 'editor',
      title: 'The editor',
      description: 'Line numbers, current line, indent, pairs, comments and a fallback.',
      specimens: [
        {
          id: 'CodeSqlEditorAlone',
          title: 'Editor alone',
          note: 'Line numbers and current-line highlight, Tab to indent, quotes and brackets pair themselves.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['tools/code-editor/CodeEditor.tsx', 'tools/code-editor/editing.ts'],
          Component: CodeSqlEditorAlone,
        },
        {
          id: 'CodeSqlEditorLoading',
          title: 'Highlighter loading',
          note: 'Until the highlighter arrives, or if it fails, the text shows plain and stays fully editable.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['tools/code-editor/CodeEditor.tsx', 'tools/code-editor/useHighlightedCode.ts'],
          Component: CodeSqlEditorLoading,
        },
        {
          id: 'CodeSqlShortcuts',
          title: 'Keyboard',
          note: 'The shortcuts to show next to an editor, including how to leave it.',
          origin: 'custom',
          size: 'sm',
          Component: CodeSqlShortcuts,
        },
      ],
    },
    {
      id: 'results',
      title: 'Results and errors',
      description: 'What comes back, and what to say when nothing does.',
      specimens: [
        {
          id: 'CodeSqlResultsTable',
          title: 'Results table',
          note: 'Numbers right-aligned in tabular figures, a sticky header and the counts above.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['tools/code-editor/ResultsTable.tsx'],
          Component: CodeSqlResultsTable,
        },
        {
          id: 'CodeSqlEmptyResult',
          title: 'Empty result',
          note: 'No rows is an answer; say so and say what to loosen.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['tools/code-editor/ResultsTable.tsx'],
          Component: CodeSqlEmptyResult,
        },
        {
          id: 'CodeSqlErrorMarker',
          title: 'Error with marker',
          note: 'The unknown column is underlined in the editor and described under it with its position and a hint.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['tools/code-editor/CodeEditor.tsx', 'tools/code-editor/ErrorPanel.tsx'],
          Component: CodeSqlErrorMarker,
        },
        {
          id: 'CodeSqlSyntaxError',
          title: 'Unclosed text value',
          note: 'Syntax errors name the opening quote and tell what to add.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['tools/code-editor/ErrorPanel.tsx'],
          Component: CodeSqlSyntaxError,
        },
        {
          id: 'CodeSqlTypeError',
          title: 'Type mismatch',
          note: 'Comparing text with a number is caught before any row is read.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['tools/code-editor/ErrorPanel.tsx'],
          Component: CodeSqlTypeError,
        },
      ],
    },
    {
      id: 'sidebar',
      title: 'Schema, history and snippets',
      description: 'The sidebar parts of the workbench, on their own.',
      specimens: [
        {
          id: 'CodeSqlSchema',
          title: 'Schema browser',
          note: 'Tables and typed columns; choosing a name inserts it at the caret.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['tools/code-editor/SchemaBrowser.tsx'],
          Component: CodeSqlSchema,
        },
        {
          id: 'CodeSqlHistory',
          title: 'Query history',
          note: 'Earlier runs with their outcome in words; a row loads the query back.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['tools/code-editor/QueryLists.tsx'],
          Component: CodeSqlHistory,
        },
        {
          id: 'CodeSqlSnippets',
          title: 'Saved snippets',
          note: 'Named queries kept for reuse, with save and delete.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['tools/code-editor/QueryLists.tsx', 'patterns/collections/IconAction.tsx'],
          Component: CodeSqlSnippets,
        },
      ],
    },
    {
      id: 'languages',
      title: 'Languages and states',
      description: 'JSON that validates itself, configuration that cannot be edited, and a diff of two queries.',
      specimens: [
        {
          id: 'CodeSqlJsonValid',
          title: 'JSON, valid',
          note: 'Validated as you type; Format and Minify rewrite valid text only.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['tools/code-editor/JsonPanel.tsx', 'tools/code-editor/jsonTools.ts'],
          Component: CodeSqlJsonValid,
        },
        {
          id: 'CodeSqlJsonInvalid',
          title: 'JSON, invalid',
          note: 'The first problem is underlined and given a line and column.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['tools/code-editor/JsonPanel.tsx'],
          Component: CodeSqlJsonInvalid,
        },
        {
          id: 'CodeSqlYamlReadOnly',
          title: 'YAML, read only',
          note: 'Transformation config owned by a pipeline: visible and copyable, not editable, with the reason.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['tools/code-editor/CodeEditor.tsx'],
          Component: CodeSqlYamlReadOnly,
        },
        {
          id: 'CodeSqlReadOnlyQuery',
          title: 'Query, read only',
          note: 'A published query: readable and runnable elsewhere, edited as a new version.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['tools/code-editor/CodeEditor.tsx'],
          Component: CodeSqlReadOnlyQuery,
        },
        {
          id: 'CodeSqlDiff',
          title: 'Diff of two queries',
          note: 'Review a change before saving a new version: signs and words, not only colour.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['tools/code-editor/DiffView.tsx', 'tools/code-editor/diffLines.ts'],
          Component: CodeSqlDiff,
        },
        {
          id: 'CodeSqlDarkScope',
          title: 'Dark control-room scope',
          note: 'The workbench in a dark theme scope, with the snippets tab open.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'chrome',
          uses: ['themes/ThemeScope.tsx', 'tools/code-editor/QueryWorkbench.tsx'],
          Component: CodeSqlDarkScope,
        },
      ],
    },
  ],
});
