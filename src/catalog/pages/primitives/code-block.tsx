import { Badge } from '@cognite/aura/components/badge';
import {
  CodeBlock,
  CodeBlockCollapseButton,
  CodeBlockCopyButton,
  CodeBlockDownloadButton,
} from '@cognite/aura/components/code-block';
import { Tabs, TabsLabel, TabsList, TabsPanel, TabsTrigger } from '@cognite/aura/components/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import { useState } from 'react';

import { SENSORS } from '../../data/plant';
import { definePage } from '../../types';

import source from './code-block.tsx?raw';

const CODE_TSX = [
  "import { Badge } from '@cognite/aura/components/badge';",
  '',
  "type AlarmBadgeProps = { severity: 'critical' | 'high' | 'low'; count: number };",
  '',
  'export function AlarmBadge({ severity, count }: AlarmBadgeProps) {',
  "  const variant = severity === 'low' ? 'archived' : 'error';",
  '',
  '  return (',
  '    <Badge variant={variant} aria-label={`${count} ${severity} alarms`}>',
  '      {count}',
  '    </Badge>',
  '  );',
  '}',
].join('\n');

const CODE_JSON = [
  '{',
  '  "externalId": "23-PT-92531",',
  '  "name": "Discharge pressure",',
  '  "unit": "barg",',
  '  "isStep": false,',
  '  "assetExternalId": "23-KA-9101",',
  '  "metadata": {',
  '    "lowLimit": "40",',
  '    "highLimit": "52"',
  '  }',
  '}',
].join('\n');

const CODE_SQL = [
  'SELECT',
  '  wo.id            AS work_order,',
  '  a.tag            AS asset_tag,',
  '  wo.priority,',
  '  wo.estimated_hours',
  'FROM work_orders AS wo',
  'JOIN assets AS a ON a.id = wo.asset_id',
  "WHERE wo.status IN ('open', 'planned')",
  "  AND a.area = 'NK-23'",
  'ORDER BY wo.priority, wo.due_at;',
].join('\n');

const CODE_PYTHON = [
  'from cognite.client import CogniteClient',
  '',
  'client = CogniteClient()',
  '',
  'pressure = client.time_series.data.retrieve(',
  '    external_id="23-PT-92531",',
  '    start="24h-ago",',
  '    end="now",',
  '    aggregates=["average"],',
  '    granularity="1h",',
  ')',
  '',
  'print(pressure.to_pandas().describe())',
].join('\n');

const CODE_BASH = [
  'cdf auth verify',
  'cdf build --env prod',
  'cdf deploy --env prod --dry-run',
].join('\n');

const CODE_YAML = [
  'externalId: tr_work_orders_nordkapp',
  'name: Work orders, Nordkapp',
  'destination:',
  '  type: instances',
  '  dataModel:',
  '    space: nordkapp',
  '    externalId: Maintenance',
  '    version: "3"',
  'schedule:',
  '  interval: "0 * * * *"',
  '  isPaused: false',
  'conflictMode: upsert',
].join('\n');

const CODE_TEXT = [
  '14:02:11  INFO   Transformation tr_work_orders_nordkapp started',
  '14:02:14  INFO   Read 8 rows from raw.sap.work_orders',
  '14:02:15  WARN   1 row skipped: missing asset reference (WO-104466)',
  '14:02:16  INFO   Upserted 7 instances into nordkapp.Maintenance',
  '14:02:16  INFO   Finished in 4.8 s',
].join('\n');

const CODE_HTTP = [
  'POST /api/v1/projects/nordkapp/timeseries/data/list HTTP/1.1',
  'Host: api.cognitedata.com',
  'Authorization: Bearer <token>',
  'Content-Type: application/json',
  '',
  '{',
  '  "items": [{ "externalId": "23-PT-92531" }],',
  '  "start": "24h-ago",',
  '  "aggregates": ["average"],',
  '  "granularity": "1h"',
  '}',
].join('\n');

const CODE_RESPONSE = [
  '{',
  '  "items": [',
  '    {',
  '      "externalId": "23-PT-92531",',
  '      "unit": "barg",',
  '      "datapoints": [',
  '        { "timestamp": 1773324000000, "average": 48.2 },',
  '        { "timestamp": 1773327600000, "average": 48.6 }',
  '      ]',
  '    }',
  '  ]',
  '}',
].join('\n');

const CODE_ONE_LINE = 'npm install @cognite/aura @cognite/app-sdk';

const CODE_PROMPT = '$ npm install @cognite/aura @cognite/app-sdk';

const CODE_LONG_LINE = [
  'curl --request POST --url https://api.cognitedata.com/api/v1/projects/nordkapp/timeseries/data/latest --header "Authorization: Bearer $CDF_TOKEN" --header "Content-Type: application/json" \\',
  '  --data \'{"items":[{"externalId":"23-PT-92531"},{"externalId":"23-TT-92532"},{"externalId":"23-VT-92540"}]}\'',
].join('\n');

/** 60 lines of real sensor metadata, long enough to be cut to a preview when collapsed. */
const CODE_LONG_JSON = JSON.stringify(
  SENSORS.slice(0, 6).map((sensor) => ({
    externalId: sensor.tag,
    name: sensor.name,
    unit: sensor.unit,
    lowLimit: sensor.lowLimit,
    highLimit: sensor.highLimit,
    rangeMin: sensor.rangeMin,
    rangeMax: sensor.rangeMax,
    quality: sensor.quality,
  })),
  null,
  2
);

const CODE_BEFORE = [
  'const response = await fetch(url);',
  'const body = await response.json();',
  'setRows(body.items);',
].join('\n');

const CODE_AFTER = [
  'const response = await fetch(url);',
  'if (!response.ok) {',
  '  throw new Error(`Request failed with ${response.status}`);',
  '}',
  'const body: unknown = await response.json();',
  'setRows(parseRows(body));',
].join('\n');

const CODE_SDK_TS = [
  'const datapoints = await client.datapoints.retrieve({',
  "  items: [{ externalId: '23-PT-92531' }],",
  "  start: '24h-ago',",
  "  aggregates: ['average'],",
  "  granularity: '1h',",
  '});',
].join('\n');

function CodeBlockCopyAction() {
  return (
    <Tooltip>
      <TooltipTrigger render={<CodeBlockCopyButton aria-label="Copy code" />} />
      <TooltipContent>Copy code</TooltipContent>
    </Tooltip>
  );
}

function CodeBlockDownloadAction({ fileName }: { fileName: string }) {
  return (
    <Tooltip>
      <TooltipTrigger render={<CodeBlockDownloadButton fileName={fileName} aria-label={`Download ${fileName}`} />} />
      <TooltipContent>Download {fileName}</TooltipContent>
    </Tooltip>
  );
}

function CodeBlockCollapseAction() {
  return (
    <Tooltip>
      <TooltipTrigger render={<CodeBlockCollapseButton aria-label="Expand or collapse code" />} />
      <TooltipContent>Expand or collapse</TooltipContent>
    </Tooltip>
  );
}

function CodeBlockTsx() {
  return <CodeBlock code={CODE_TSX} language="tsx" />;
}

function CodeBlockJson() {
  return <CodeBlock code={CODE_JSON} language="json" />;
}

function CodeBlockSql() {
  return <CodeBlock code={CODE_SQL} language="sql" />;
}

function CodeBlockPython() {
  return <CodeBlock code={CODE_PYTHON} language="python" />;
}

function CodeBlockBash() {
  return <CodeBlock code={CODE_BASH} language="bash" />;
}

function CodeBlockYaml() {
  return <CodeBlock code={CODE_YAML} language="yaml" />;
}

function CodeBlockPlainText() {
  return <CodeBlock code={CODE_TEXT} language="text" />;
}

function CodeBlockLineNumbers() {
  return <CodeBlock code={CODE_SQL} language="sql" showLineNumbers />;
}

function CodeBlockSingleLine() {
  return <CodeBlock code={CODE_ONE_LINE} language="bash" />;
}

function CodeBlockLongLines() {
  return <CodeBlock code={CODE_LONG_LINE} language="bash" />;
}

function CodeBlockCollapsed() {
  return (
    <CodeBlock code={CODE_PYTHON} language="python" collapsed>
      <CodeBlockCollapseAction />
    </CodeBlock>
  );
}

function CodeBlockCollapsedLong() {
  return (
    <CodeBlock code={CODE_LONG_JSON} language="json" collapsed showLineNumbers>
      <CodeBlockCollapseAction />
      <CodeBlockCopyAction />
    </CodeBlock>
  );
}

function CodeBlockTall() {
  return (
    <CodeBlock code={CODE_LONG_JSON} language="json" showLineNumbers style={{ maxHeight: '16rem' }}>
      <CodeBlockCopyAction />
    </CodeBlock>
  );
}

function CodeBlockWithCopy() {
  return (
    <CodeBlock code={CODE_JSON} language="json">
      <CodeBlockCopyAction />
    </CodeBlock>
  );
}

function CodeBlockWithDownload() {
  return (
    <CodeBlock code={CODE_YAML} language="yaml">
      <CodeBlockCopyAction />
      <CodeBlockDownloadAction fileName="tr_work_orders_nordkapp.yaml" />
    </CodeBlock>
  );
}

function CodeBlockAllActions() {
  return (
    <CodeBlock code={CODE_PYTHON} language="python" showLineNumbers>
      <CodeBlockCollapseAction />
      <CodeBlockCopyAction />
      <CodeBlockDownloadAction fileName="discharge_pressure.py" />
    </CodeBlock>
  );
}

function CodeBlockCopyWithoutPrompt() {
  return (
    <CodeBlock code={CODE_PROMPT} copyText={CODE_ONE_LINE} language="bash">
      <CodeBlockCopyAction />
    </CodeBlock>
  );
}

function CodeBlockCopyFeedback() {
  const [status, setStatus] = useState('Hover the block and copy the query.');

  return (
    <div className="flex w-full flex-col gap-2">
      <CodeBlock code={CODE_SQL} language="sql">
        <Tooltip>
          <TooltipTrigger
            render={
              <CodeBlockCopyButton
                aria-label="Copy query"
                onCopy={() => setStatus('Query copied to the clipboard.')}
                onError={() => setStatus('Copying is blocked in this browser. Select the query and copy it manually.')}
              />
            }
          />
          <TooltipContent>Copy query</TooltipContent>
        </Tooltip>
      </CodeBlock>
      <p role="status" className="text-xs text-muted-foreground">
        {status}
      </p>
    </div>
  );
}

function CodeBlockWithFileHeader() {
  return (
    <div className="w-full overflow-hidden rounded-xl bg-card-background">
      <div className="flex items-center justify-between gap-3 px-4 pt-3">
        <p className="truncate font-mono text-xs text-medium-foreground">transformations/tr_work_orders_nordkapp.yaml</p>
        <Badge variant="secondary">YAML</Badge>
      </div>
      <CodeBlock code={CODE_YAML} language="yaml" showLineNumbers>
        <CodeBlockCopyAction />
        <CodeBlockDownloadAction fileName="tr_work_orders_nordkapp.yaml" />
      </CodeBlock>
    </div>
  );
}

function CodeBlockLanguageTabs() {
  return (
    <Tabs defaultValue="python" className="flex w-full flex-col gap-3">
      <TabsList aria-label="SDK language">
        <TabsTrigger value="python">
          <TabsLabel>Python</TabsLabel>
        </TabsTrigger>
        <TabsTrigger value="typescript">
          <TabsLabel>TypeScript</TabsLabel>
        </TabsTrigger>
        <TabsTrigger value="curl">
          <TabsLabel>cURL</TabsLabel>
        </TabsTrigger>
      </TabsList>
      <TabsPanel value="python">
        <CodeBlock code={CODE_PYTHON} language="python">
          <CodeBlockCopyAction />
        </CodeBlock>
      </TabsPanel>
      <TabsPanel value="typescript">
        <CodeBlock code={CODE_SDK_TS} language="ts">
          <CodeBlockCopyAction />
        </CodeBlock>
      </TabsPanel>
      <TabsPanel value="curl">
        <CodeBlock code={CODE_LONG_LINE} language="bash">
          <CodeBlockCopyAction />
        </CodeBlock>
      </TabsPanel>
    </Tabs>
  );
}

function CodeBlockRequestResponse() {
  return (
    <div className="grid w-full gap-4 md:grid-cols-2">
      <section className="flex min-w-0 flex-col gap-2">
        <h4 className="text-xs font-medium text-muted-foreground">Request</h4>
        <CodeBlock code={CODE_HTTP} language="http">
          <CodeBlockCopyAction />
        </CodeBlock>
      </section>
      <section className="flex min-w-0 flex-col gap-2">
        <h4 className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          Response <Badge variant="success">200 OK</Badge>
        </h4>
        <CodeBlock code={CODE_RESPONSE} language="json">
          <CodeBlockCopyAction />
        </CodeBlock>
      </section>
    </div>
  );
}

function CodeBlockBeforeAfter() {
  return (
    <div className="grid w-full gap-4 md:grid-cols-2">
      <section className="flex min-w-0 flex-col gap-2">
        <h4 className="text-xs font-medium text-muted-foreground">Before</h4>
        <CodeBlock code={CODE_BEFORE} language="ts" showLineNumbers />
      </section>
      <section className="flex min-w-0 flex-col gap-2">
        <h4 className="text-xs font-medium text-muted-foreground">After</h4>
        <CodeBlock code={CODE_AFTER} language="ts" showLineNumbers>
          <CodeBlockCopyAction />
        </CodeBlock>
      </section>
    </div>
  );
}

function CodeBlockInstallSteps() {
  return (
    <ol className="flex w-full flex-col gap-4">
      {[
        { title: 'Install the packages', code: CODE_ONE_LINE },
        { title: 'Check that you are signed in', code: 'cdf auth verify' },
        { title: 'Deploy to the project', code: 'cdf deploy --env prod' },
      ].map((step, index) => (
        <li key={step.title} className="flex flex-col gap-2">
          <p className="flex items-center gap-2 text-sm font-medium text-base-foreground">
            <span className="flex size-5 items-center justify-center rounded-md bg-muted-background text-xs tabular-nums text-medium-foreground">
              {index + 1}
            </span>
            {step.title}
          </p>
          <CodeBlock code={step.code} language="bash">
            <CodeBlockCopyAction />
          </CodeBlock>
        </li>
      ))}
    </ol>
  );
}

function CodeBlockRunOutput() {
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-base-foreground">Work orders, Nordkapp</p>
          <p className="text-xs text-muted-foreground">Last run 12 Mar, 14:02 · 4.8 s</p>
        </div>
        <Badge variant="warning">1 row skipped</Badge>
      </div>
      <CodeBlock code={CODE_SQL} language="sql" showLineNumbers>
        <CodeBlockCopyAction />
      </CodeBlock>
      <CodeBlock code={CODE_TEXT} language="text" aria-label="Run log">
        <CodeBlockCopyAction />
      </CodeBlock>
    </div>
  );
}

export default definePage({
  id: 'code-block',
  title: 'Code block',
  summary:
    'A code block shows read-only code with syntax highlighting in both themes. It can number lines, collapse to a preview, and carry copy, download and collapse actions that appear on hover and focus.',
  docsSlug: 'code-block',
  guidance: {
    use: [
      'Code, queries, configuration and payloads that people read or copy.',
      'Set the language so highlighting matches; use text for logs and output.',
      'Add a copy button to anything people are meant to paste somewhere else.',
      'Collapse long blocks that sit in the middle of other content.',
    ],
    avoid: [
      'Editing — a code block is read-only; use an editor component.',
      'Short inline references such as a tag or key; use inline monospace text.',
      'Line numbers on one-line commands.',
      'Prompts or placeholders inside the copied text; set copyText to the clean version.',
    ],
  },
  source,
  sections: [
    {
      id: 'languages',
      title: 'Languages',
      description: 'Highlighting follows the language prop. These are the ones industrial apps use most.',
      specimens: [
        {
          id: 'CodeBlockTsx',
          title: 'TSX',
          note: 'Component examples in documentation and generated UI code.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: CodeBlockTsx,
        },
        {
          id: 'CodeBlockPython',
          title: 'Python',
          note: 'SDK snippets and notebook cells.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: CodeBlockPython,
        },
        {
          id: 'CodeBlockSql',
          title: 'SQL',
          note: 'Transformation and data quality queries.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: CodeBlockSql,
        },
        {
          id: 'CodeBlockJson',
          title: 'JSON',
          note: 'API payloads and resource definitions.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: CodeBlockJson,
        },
        {
          id: 'CodeBlockYaml',
          title: 'YAML',
          note: 'Deployment and pipeline configuration.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: CodeBlockYaml,
        },
        {
          id: 'CodeBlockBash',
          title: 'Bash',
          note: 'Commands people run in a terminal.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: CodeBlockBash,
        },
        {
          id: 'CodeBlockPlainText',
          title: 'Plain text',
          note: 'Logs and command output, where highlighting would only add noise.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: CodeBlockPlainText,
        },
      ],
    },
    {
      id: 'display',
      title: 'Display options',
      description: 'Line numbers, long lines, and what happens when the code is longer than its slot.',
      specimens: [
        {
          id: 'CodeBlockLineNumbers',
          title: 'With line numbers',
          note: 'Code that text or an error message refers to by line.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: CodeBlockLineNumbers,
        },
        {
          id: 'CodeBlockSingleLine',
          title: 'Single line',
          note: 'One command; the block shrinks to one row.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: CodeBlockSingleLine,
        },
        {
          id: 'CodeBlockLongLines',
          title: 'Long lines',
          note: 'Lines never wrap; the block scrolls sideways so copied code stays intact.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: CodeBlockLongLines,
        },
        {
          id: 'CodeBlockCollapsed',
          title: 'Collapsed',
          note: 'Starts as a faded preview when the code is supporting detail. Hover to expand.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: CodeBlockCollapsed,
        },
        {
          id: 'CodeBlockCollapsedLong',
          title: 'Collapsed, long content',
          note: 'Large payloads: only the first lines are rendered until the block is expanded.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: CodeBlockCollapsedLong,
        },
        {
          id: 'CodeBlockTall',
          title: 'Capped height',
          note: 'A lower height cap than the default, for blocks inside panels; the code scrolls inside.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: CodeBlockTall,
        },
      ],
    },
    {
      id: 'actions',
      title: 'Actions',
      description: 'Buttons sit in the top right corner and appear on hover and keyboard focus.',
      specimens: [
        {
          id: 'CodeBlockWithCopy',
          title: 'Copy',
          note: 'The default for anything meant to be pasted; the icon turns into a check for two seconds.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: CodeBlockWithCopy,
        },
        {
          id: 'CodeBlockWithDownload',
          title: 'Copy and download',
          note: 'Whole files, where people want the file with its name rather than the text.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: CodeBlockWithDownload,
        },
        {
          id: 'CodeBlockAllActions',
          title: 'Collapse, copy and download',
          note: 'Long generated code in a conversation or report.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: CodeBlockAllActions,
        },
        {
          id: 'CodeBlockCopyWithoutPrompt',
          title: 'Copy without the prompt',
          note: 'Shows a shell prompt but copies only the command.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: CodeBlockCopyWithoutPrompt,
        },
        {
          id: 'CodeBlockCopyFeedback',
          title: 'Copy with a status message',
          note: 'Says what happened in text, including when the browser blocks the clipboard.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: CodeBlockCopyFeedback,
        },
      ],
    },
    {
      id: 'compositions',
      title: 'Compositions',
      description: 'Code blocks with headers, tabs and each other.',
      specimens: [
        {
          id: 'CodeBlockWithFileHeader',
          title: 'With file header',
          note: 'Names the file the code belongs to, on the same surface as the block.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: CodeBlockWithFileHeader,
        },
        {
          id: 'CodeBlockLanguageTabs',
          title: 'Language tabs',
          note: 'The same call in several languages; people pick theirs once.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: CodeBlockLanguageTabs,
        },
        {
          id: 'CodeBlockInstallSteps',
          title: 'Numbered steps',
          note: 'Setup guides: one command per step, each with its own copy button.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: CodeBlockInstallSteps,
        },
        {
          id: 'CodeBlockRunOutput',
          title: 'Query and run log',
          note: 'A transformation with its last run: status first, then the query, then the output.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: CodeBlockRunOutput,
        },
        {
          id: 'CodeBlockRequestResponse',
          title: 'Request and response',
          note: 'API documentation and debugging: what was sent beside what came back.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          Component: CodeBlockRequestResponse,
        },
        {
          id: 'CodeBlockBeforeAfter',
          title: 'Before and after',
          note: 'A suggested change shown as two numbered blocks; only the new version can be copied.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          Component: CodeBlockBeforeAfter,
        },
      ],
    },
  ],
});
