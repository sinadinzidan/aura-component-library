import { Button } from '@cognite/aura/components/button';
import { IconAlertTriangle, IconClock, IconPlayerPlay, IconPlayerStop, IconRefresh } from '@cognite/aura/icons';
import { useState } from 'react';

import { DashboardFrame } from '../../../library/dashboards/DashboardFrame';
import { DashboardCell, DashboardGrid } from '../../../library/dashboards/DashboardGrid';
import { DashboardPanel } from '../../../library/dashboards/DashboardPanel';
import { Sparkline } from '../../../library/industrial/Sparkline';
import { TONE_TEXT } from '../../../library/industrial/status';
import type { Tone } from '../../../library/industrial/status';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { RunHistoryStrip } from '../../../library/industrial/workflows/RunHistoryStrip';
import type { RunStatus } from '../../../library/industrial/workflows/workflow';
import { ThemeScope } from '../../../library/themes/ThemeScope';
import { makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './data-operations.tsx?raw';

type DataOpsState = 'ok' | 'failed' | 'stale' | 'running';

type DataOpsLogLine = { time: string; level: 'INFO' | 'WARN' | 'ERROR'; text: string };

type DataOpsNode = {
  id: string;
  /** 0 sources, 1 extractors, 2 raw, 3 transformations, 4 data model. */
  column: number;
  row: number;
  name: string;
  detail: string;
  state: DataOpsState;
  /** Age of the newest data, as shown on the node. */
  freshness: string;
  schedule: string;
  rows: string;
  latency: string;
  duration: string;
  /** Last 14 runs, oldest first: s success, f failed, k skipped. */
  history: string;
  error?: { time: string; text: string };
  logs: readonly DataOpsLogLine[];
  seed: number;
};

const DATA_OPS_COLUMNS = ['Sources', 'Extractors', 'Raw', 'Transformations', 'Data model'] as const;

const DATA_OPS_KIND = ['Source system', 'Extractor', 'Raw table', 'Transformation', 'Data model view'] as const;

const DATA_OPS_NODES: readonly DataOpsNode[] = [
  {
    id: 'src-opcua',
    column: 0,
    row: 0,
    name: 'OPC UA',
    detail: 'Compression area PLCs, 1 840 nodes',
    state: 'ok',
    freshness: '4 s',
    schedule: 'Subscription',
    rows: '1 840 nodes',
    latency: '0.4 s',
    duration: 'Continuous',
    history: 'ssssssssssssss',
    logs: [
      { time: '13:59:58', level: 'INFO', text: 'session keep-alive ok, 1 840 monitored items' },
      { time: '13:59:28', level: 'INFO', text: 'publish interval 1 000 ms, queue depth 0' },
      { time: '13:44:10', level: 'INFO', text: 'certificate valid for 212 days' },
      { time: '13:30:02', level: 'INFO', text: 'namespace ns=3 browsed, no new nodes' },
    ],
    seed: 201,
  },
  {
    id: 'src-pi',
    column: 0,
    row: 1,
    name: 'PI archive',
    detail: 'Plant historian, 12 400 tags',
    state: 'ok',
    freshness: '1 min',
    schedule: 'Always on',
    rows: '12 400 tags',
    latency: '1.1 s',
    duration: 'Continuous',
    history: 'ssssssssssssss',
    logs: [
      { time: '13:59:40', level: 'INFO', text: 'archive nk-pi-01 reachable, snapshot lag 1.1 s' },
      { time: '13:45:00', level: 'INFO', text: 'tag count 12 400, 0 new since 13:30' },
      { time: '13:30:00', level: 'INFO', text: 'backfill window closed, 0 gaps' },
      { time: '13:15:00', level: 'INFO', text: 'archive nk-pi-01 reachable, snapshot lag 0.9 s' },
    ],
    seed: 202,
  },
  {
    id: 'src-sap',
    column: 0,
    row: 2,
    name: 'SAP PM',
    detail: 'Work orders and notifications',
    state: 'ok',
    freshness: '2 min',
    schedule: 'Always on',
    rows: '48 200 orders',
    latency: '2.8 s',
    duration: 'Continuous',
    history: 'ssssssssssssss',
    logs: [
      { time: '13:58:12', level: 'INFO', text: 'OData service PM_ORDER_SRV responds in 2.8 s' },
      { time: '13:40:00', level: 'INFO', text: 'service user CDF_EXTRACT password changed by SAP basis' },
      { time: '13:30:00', level: 'INFO', text: '14 orders changed since 13:00' },
      { time: '13:00:00', level: 'INFO', text: '9 orders changed since 12:30' },
    ],
    seed: 203,
  },
  {
    id: 'ext-opcua',
    column: 1,
    row: 0,
    name: 'opcua-nk23',
    detail: 'OPC UA extractor 2.31 on nk-edge-02',
    state: 'ok',
    freshness: '6 s',
    schedule: 'Streaming',
    rows: '412 000 points',
    latency: '1.2 s',
    duration: 'Continuous',
    history: 'ssssssssssssss',
    logs: [
      { time: '13:59:57', level: 'INFO', text: 'pushed 6 870 datapoints in 1.2 s' },
      { time: '13:59:47', level: 'INFO', text: 'pushed 6 902 datapoints in 1.1 s' },
      { time: '13:59:37', level: 'INFO', text: 'pushed 6 855 datapoints in 1.3 s' },
      { time: '13:52:04', level: 'WARN', text: 'node 23-VT-92740 reported bad quality, forwarded' },
    ],
    seed: 204,
  },
  {
    id: 'ext-pi',
    column: 1,
    row: 1,
    name: 'pi-nk-af',
    detail: 'PI extractor 3.4 on nk-edge-01',
    state: 'ok',
    freshness: '2 min',
    schedule: 'Every 1 min',
    rows: '186 000 points',
    latency: '9 s',
    duration: '14 s',
    history: 'ssssssssskssss',
    logs: [
      { time: '13:59:00', level: 'INFO', text: 'run finished, 186 000 points, 14 s' },
      { time: '13:58:00', level: 'INFO', text: 'run finished, 185 400 points, 13 s' },
      { time: '13:57:00', level: 'INFO', text: 'run finished, 186 300 points, 14 s' },
      { time: '13:49:00', level: 'WARN', text: 'run skipped, previous run still active' },
    ],
    seed: 205,
  },
  {
    id: 'ext-sap',
    column: 1,
    row: 2,
    name: 'sap-odata',
    detail: 'SAP OData extractor 1.9 on nk-edge-01',
    state: 'failed',
    freshness: '6 h 12 min',
    schedule: 'Every 30 min',
    rows: '0 rows',
    latency: 'No data',
    duration: '3 s',
    history: 'ssffffffffffff',
    error: {
      time: '13:30:03',
      text: '401 Unauthorized from PM_ORDER_SRV: credentials for service user CDF_EXTRACT were rejected',
    },
    logs: [
      { time: '13:30:03', level: 'ERROR', text: '401 Unauthorized from PM_ORDER_SRV, run aborted' },
      { time: '13:30:00', level: 'INFO', text: 'run started, cursor 2026-03-12T07:48:00Z' },
      { time: '13:00:03', level: 'ERROR', text: '401 Unauthorized from PM_ORDER_SRV, run aborted' },
      { time: '12:30:03', level: 'ERROR', text: '401 Unauthorized from PM_ORDER_SRV, run aborted' },
      { time: '07:48:11', level: 'INFO', text: 'run finished, 14 rows, 11 s' },
    ],
    seed: 206,
  },
  {
    id: 'raw-opcua',
    column: 2,
    row: 0,
    name: 'opcua.points',
    detail: 'Datapoints staging, 7 day retention',
    state: 'ok',
    freshness: '8 s',
    schedule: 'On write',
    rows: '248 M rows',
    latency: '2 s',
    duration: 'Continuous',
    history: 'ssssssssssssss',
    logs: [
      { time: '13:59:58', level: 'INFO', text: 'ingested 6 870 rows, table size 248 M' },
      { time: '13:59:48', level: 'INFO', text: 'ingested 6 902 rows' },
      { time: '13:00:00', level: 'INFO', text: 'retention removed 41 M rows older than 7 d' },
      { time: '12:59:58', level: 'INFO', text: 'ingested 6 811 rows' },
    ],
    seed: 207,
  },
  {
    id: 'raw-pi',
    column: 2,
    row: 1,
    name: 'pi.tags',
    detail: 'Tag metadata and AF paths',
    state: 'ok',
    freshness: '2 min',
    schedule: 'On write',
    rows: '12 400 rows',
    latency: '3 s',
    duration: 'Continuous',
    history: 'ssssssssssssss',
    logs: [
      { time: '13:59:02', level: 'INFO', text: 'upserted 0 rows, 12 400 unchanged' },
      { time: '13:30:02', level: 'INFO', text: 'upserted 3 rows, descriptions changed' },
      { time: '13:00:02', level: 'INFO', text: 'upserted 0 rows, 12 400 unchanged' },
      { time: '12:30:02', level: 'INFO', text: 'upserted 0 rows, 12 400 unchanged' },
    ],
    seed: 208,
  },
  {
    id: 'raw-sap',
    column: 2,
    row: 2,
    name: 'sap.orders',
    detail: 'Work orders staging',
    state: 'stale',
    freshness: '6 h 12 min',
    schedule: 'On write',
    rows: '48 186 rows',
    latency: 'No writes',
    duration: 'Idle',
    history: 'sskkkkkkkkkkkk',
    logs: [
      { time: '13:30:04', level: 'WARN', text: 'no writes for 5 h 42 min, expected every 30 min' },
      { time: '13:00:04', level: 'WARN', text: 'no writes for 5 h 12 min, expected every 30 min' },
      { time: '08:30:04', level: 'WARN', text: 'freshness target of 45 min missed' },
      { time: '07:48:11', level: 'INFO', text: 'upserted 14 rows' },
    ],
    seed: 209,
  },
  {
    id: 'tr-ts',
    column: 3,
    row: 0,
    name: 'ts-context',
    detail: 'Links time series to assets by tag',
    state: 'running',
    freshness: '3 min',
    schedule: 'Every 5 min',
    rows: '1 840 rows',
    latency: '38 s',
    duration: '41 s',
    history: 'ssssssssssssss',
    logs: [
      { time: '14:00:00', level: 'INFO', text: 'run started, 1 840 candidates' },
      { time: '13:55:41', level: 'INFO', text: 'run finished, 1 838 matched, 2 unmatched, 41 s' },
      { time: '13:55:40', level: 'WARN', text: 'no asset for 23-VT-92741 and 23-VT-92742' },
      { time: '13:50:39', level: 'INFO', text: 'run finished, 1 838 matched, 2 unmatched, 39 s' },
    ],
    seed: 210,
  },
  {
    id: 'tr-asset',
    column: 3,
    row: 1,
    name: 'asset-tree',
    detail: 'Builds the hierarchy from AF and SAP locations',
    state: 'ok',
    freshness: '22 min',
    schedule: 'Every 30 min',
    rows: '6 214 rows',
    latency: '1 min 4 s',
    duration: '1 min 12 s',
    history: 'sssssssfssssss',
    logs: [
      { time: '13:31:12', level: 'INFO', text: 'run finished, 6 214 assets, 0 created, 3 updated' },
      { time: '13:31:10', level: 'WARN', text: 'sap.orders is stale, kept last known functional locations' },
      { time: '13:01:09', level: 'INFO', text: 'run finished, 6 214 assets, 0 created, 0 updated' },
      { time: '12:31:14', level: 'INFO', text: 'run finished, 6 214 assets, 0 created, 1 updated' },
    ],
    seed: 211,
  },
  {
    id: 'tr-wo',
    column: 3,
    row: 2,
    name: 'wo-sync',
    detail: 'Maps SAP orders to the work order view',
    state: 'stale',
    freshness: '6 h 10 min',
    schedule: 'After sap.orders',
    rows: '0 rows',
    latency: 'Not run',
    duration: 'Skipped',
    history: 'sskkkkkkkkkkkk',
    logs: [
      { time: '13:30:05', level: 'WARN', text: 'skipped, upstream sap.orders has no new rows' },
      { time: '13:00:05', level: 'WARN', text: 'skipped, upstream sap.orders has no new rows' },
      { time: '12:30:05', level: 'WARN', text: 'skipped, upstream sap.orders has no new rows' },
      { time: '07:50:02', level: 'INFO', text: 'run finished, 14 rows, 9 s' },
    ],
    seed: 212,
  },
  {
    id: 'dm-ts',
    column: 4,
    row: 0,
    name: 'TimeSeries',
    detail: 'nordkapp:TimeSeries v4',
    state: 'ok',
    freshness: '3 min',
    schedule: 'On transform',
    rows: '14 240 instances',
    latency: '4 s',
    duration: 'Continuous',
    history: 'ssssssssssssss',
    logs: [
      { time: '13:55:42', level: 'INFO', text: 'applied 1 838 edges to Asset' },
      { time: '13:50:40', level: 'INFO', text: 'applied 1 838 edges to Asset' },
      { time: '13:45:41', level: 'INFO', text: 'applied 1 838 edges to Asset' },
      { time: '13:40:40', level: 'INFO', text: 'applied 1 837 edges to Asset' },
    ],
    seed: 213,
  },
  {
    id: 'dm-asset',
    column: 4,
    row: 1,
    name: 'Asset',
    detail: 'nordkapp:Asset v7',
    state: 'ok',
    freshness: '22 min',
    schedule: 'On transform',
    rows: '6 214 instances',
    latency: '6 s',
    duration: 'Continuous',
    history: 'ssssssssssssss',
    logs: [
      { time: '13:31:13', level: 'INFO', text: 'applied 3 updates, 6 214 instances' },
      { time: '13:01:10', level: 'INFO', text: 'no changes, 6 214 instances' },
      { time: '12:31:15', level: 'INFO', text: 'applied 1 update, 6 214 instances' },
      { time: '12:01:11', level: 'INFO', text: 'no changes, 6 214 instances' },
    ],
    seed: 214,
  },
  {
    id: 'dm-wo',
    column: 4,
    row: 2,
    name: 'WorkOrder',
    detail: 'nordkapp:WorkOrder v3',
    state: 'stale',
    freshness: '6 h 10 min',
    schedule: 'On transform',
    rows: '48 186 instances',
    latency: 'No writes',
    duration: 'Idle',
    history: 'sskkkkkkkkkkkk',
    logs: [
      { time: '13:30:06', level: 'WARN', text: 'freshness target of 1 h missed by 5 h 10 min' },
      { time: '08:50:06', level: 'WARN', text: 'freshness target of 1 h missed' },
      { time: '07:50:03', level: 'INFO', text: 'applied 14 updates, 48 186 instances' },
      { time: '07:20:02', level: 'INFO', text: 'applied 6 updates, 48 186 instances' },
    ],
    seed: 215,
  },
];

const DATA_OPS_EDGES: readonly (readonly [string, string])[] = [
  ['src-opcua', 'ext-opcua'],
  ['src-pi', 'ext-pi'],
  ['src-sap', 'ext-sap'],
  ['ext-opcua', 'raw-opcua'],
  ['ext-pi', 'raw-pi'],
  ['ext-sap', 'raw-sap'],
  ['raw-opcua', 'tr-ts'],
  ['raw-pi', 'tr-ts'],
  ['raw-pi', 'tr-asset'],
  ['raw-sap', 'tr-asset'],
  ['raw-sap', 'tr-wo'],
  ['tr-ts', 'dm-ts'],
  ['tr-asset', 'dm-asset'],
  ['tr-wo', 'dm-wo'],
];

const DATA_OPS_STATE: Record<DataOpsState, { label: string; tone: Tone }> = {
  ok: { label: 'Healthy', tone: 'neutral' },
  failed: { label: 'Failed', tone: 'critical' },
  stale: { label: 'Stale', tone: 'warning' },
  running: { label: 'Running', tone: 'info' },
};

const DATA_OPS_RUN: Record<string, RunStatus> = { s: 'success', f: 'failed', k: 'skipped' };

const DATA_OPS_GRID_COLUMNS = { gridTemplateColumns: 'repeat(4, minmax(0, 1fr) minmax(0, 0.28fr)) minmax(0, 1fr)' };

function dataOpsNode(id: string): DataOpsNode {
  return DATA_OPS_NODES.find((node) => node.id === id) ?? DATA_OPS_NODES[0];
}

/** The selected node with everything upstream and downstream of it. */
function dataOpsLineage(id: string): ReadonlySet<string> {
  const found = new Set<string>([id]);
  const walk = (from: string, direction: 0 | 1) => {
    for (const edge of DATA_OPS_EDGES) {
      const next = edge[direction] === from ? edge[1 - direction] : undefined;
      if (next !== undefined && !found.has(next)) {
        found.add(next);
        walk(next, direction);
      }
    }
  };
  walk(id, 0);
  walk(id, 1);
  return found;
}

function dataOpsRuns(node: DataOpsNode, manualRun: boolean) {
  const runs = [...node.history].map((letter, index) => ({ id: `${node.id}-${index}`, status: DATA_OPS_RUN[letter] ?? 'success' }));
  if (node.state === 'running' || manualRun) runs.push({ id: `${node.id}-now`, status: 'running' });
  return runs;
}

/** Rows per run: a seeded figure for every run that succeeded, nothing for a failed or skipped one. */
function dataOpsRowsPerRun(node: DataOpsNode): number[] {
  const values = makeValues({ seed: node.seed, points: node.history.length, base: 60, amplitude: 8, noise: 6, min: 30, max: 100 });
  return values.map((value, index) => (node.history[index] === 's' ? value : 0));
}

function DataOpsStateLabel({ state }: { state: DataOpsState }) {
  const { label, tone } = DATA_OPS_STATE[state];
  if (state === 'ok') return <span className="text-xs text-muted-foreground">{label}</span>;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${TONE_TEXT[tone]}`}>
      {state === 'failed' ? <IconAlertTriangle aria-hidden="true" className="size-3.5 shrink-0" /> : null}
      {state === 'stale' ? <IconClock aria-hidden="true" className="size-3.5 shrink-0" /> : null}
      {state === 'running' ? <IconPlayerPlay aria-hidden="true" className="size-3.5 shrink-0" /> : null}
      {label}
    </span>
  );
}

type DataOpsNodeButtonProps = {
  node: DataOpsNode;
  selected: boolean;
  related: boolean;
  onSelect: (id: string) => void;
};

function DataOpsNodeButton({ node, selected, related, onSelect }: DataOpsNodeButtonProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={`${node.name}, ${DATA_OPS_KIND[node.column]}, ${DATA_OPS_STATE[node.state].label}, data ${node.freshness} old`}
      className={`flex h-full w-full min-w-0 cursor-pointer flex-col gap-1 rounded-lg border p-2 text-left outline-none focus-visible:shadow-focus-ring ${
        selected
          ? 'border-emphasized bg-medium-background'
          : `border-default bg-base-background hover:bg-muted-background ${related ? '' : 'opacity-70'}`
      }`}
      onClick={() => onSelect(node.id)}
    >
      <span className="break-words font-mono text-xs font-medium text-base-foreground">{node.name}</span>
      <DataOpsStateLabel state={node.state} />
      <span className="text-xs tabular-nums text-muted-foreground">{node.freshness} old</span>
    </button>
  );
}

type DataOpsLinksProps = { gap: number; lineage: ReadonlySet<string> };

/** The connector lines between two neighbouring columns. Rows are equal height, so a row centre is 50, 150 or 250. */
function DataOpsLinks({ gap, lineage }: DataOpsLinksProps) {
  const edges = DATA_OPS_EDGES.map(([from, to]) => ({ from: dataOpsNode(from), to: dataOpsNode(to) })).filter(
    (edge) => edge.from.column === gap
  );
  return (
    <div aria-hidden="true" className="relative row-span-3 row-start-2" style={{ gridColumnStart: gap * 2 + 2 }}>
      <svg viewBox="0 0 100 300" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible">
        {edges.map((edge) => {
          const y1 = edge.from.row * 100 + 50;
          const y2 = edge.to.row * 100 + 50;
          const blocked = edge.from.state === 'failed' || edge.from.state === 'stale';
          const active = lineage.has(edge.from.id) && lineage.has(edge.to.id);
          return (
            <path
              key={`${edge.from.id}-${edge.to.id}`}
              d={`M 0 ${y1} C 50 ${y1}, 50 ${y2}, 100 ${y2}`}
              fill="none"
              stroke="currentColor"
              strokeWidth={active ? 2 : 1.25}
              strokeDasharray={blocked ? '5 4' : undefined}
              vectorEffect="non-scaling-stroke"
              className={active ? 'text-base-foreground' : 'text-muted-foreground opacity-50'}
            />
          );
        })}
      </svg>
    </div>
  );
}

type DataOpsSelectionProps = { selectedId: string; onSelect: (id: string) => void };

/** The dominant element: five stages left to right, every node a button, every dependency a line. */
function DataOpsLineagePanel({ selectedId, onSelect }: DataOpsSelectionProps) {
  const lineage = dataOpsLineage(selectedId);
  return (
    <DashboardPanel
      title="Pipeline lineage"
      description="From source system to data model, left to right"
      footnote="Solid lines carry data. Dashed lines are blocked by a failed or stale node upstream. Faded nodes are outside the selected lineage."
    >
      <div
        role="group"
        aria-label="Pipeline lineage: 15 nodes in five stages. The SAP OData extractor is failing, which leaves three downstream nodes stale."
        className="grid w-full grid-rows-[auto_repeat(3,minmax(0,1fr))] gap-y-2"
        style={DATA_OPS_GRID_COLUMNS}
      >
        {DATA_OPS_COLUMNS.map((column, index) => (
          <p
            key={column}
            className="row-start-1 pb-1 text-xs font-medium text-muted-foreground"
            style={{ gridColumnStart: index * 2 + 1 }}
          >
            {column}
          </p>
        ))}
        {DATA_OPS_NODES.map((node) => (
          <div key={node.id} style={{ gridColumnStart: node.column * 2 + 1, gridRowStart: node.row + 2 }}>
            <DataOpsNodeButton
              node={node}
              selected={node.id === selectedId}
              related={lineage.has(node.id)}
              onSelect={onSelect}
            />
          </div>
        ))}
        {[0, 1, 2, 3].map((gap) => (
          <DataOpsLinks key={gap} gap={gap} lineage={lineage} />
        ))}
      </div>
    </DashboardPanel>
  );
}

type DataOpsNodeProps = { nodeId: string; manualRun: boolean };

function DataOpsLogPanel({ nodeId, manualRun }: DataOpsNodeProps) {
  const node = dataOpsNode(nodeId);
  const lines: readonly DataOpsLogLine[] = manualRun
    ? [{ time: '14:00:07', level: 'INFO', text: 'manual run started by ingrid.haugen' }, ...node.logs]
    : node.logs;
  return (
    <DashboardPanel title="Log tail" description={`${node.name} · newest first`} footnote="Follows the selected node.">
      <ol
        aria-label={`Latest log lines for ${node.name}`}
        className="flex w-full flex-col gap-2 rounded-lg bg-muted-background p-3 font-mono text-xs"
      >
        {lines.slice(0, 5).map((line) => (
          <li key={`${line.time}-${line.text}`} className="flex min-w-0 flex-col gap-0.5">
            <span className="flex items-center gap-2 tabular-nums text-muted-foreground">
              {line.time}
              <span
                className={
                  line.level === 'ERROR'
                    ? 'font-semibold text-critical-foreground-strong'
                    : line.level === 'WARN'
                      ? 'font-semibold text-warning-foreground-strong'
                      : ''
                }
              >
                {line.level}
              </span>
            </span>
            <span className="break-words text-base-foreground">{line.text}</span>
          </li>
        ))}
      </ol>
    </DashboardPanel>
  );
}

function DataOpsRunHistoryBlock({ nodeId, manualRun }: DataOpsNodeProps) {
  const node = dataOpsNode(nodeId);
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <p className="text-xs font-medium text-muted-foreground">Run history</p>
      <RunHistoryStrip runs={dataOpsRuns(node, manualRun)} label={`${node.name}, latest runs`} showSummary />
      <p className="text-xs text-muted-foreground">Oldest to newest · {node.schedule.toLowerCase()}</p>
    </div>
  );
}

function DataOpsThroughputBlock({ nodeId }: { nodeId: string }) {
  const node = dataOpsNode(nodeId);
  const figures = [
    { label: 'Rows, last run', value: node.rows },
    { label: 'Latency', value: node.latency },
    { label: 'Duration', value: node.duration },
    { label: 'Schedule', value: node.schedule },
  ];
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <p className="text-xs font-medium text-muted-foreground">Rows and latency</p>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
        {figures.map((figure) => (
          <div key={figure.label} className="min-w-0">
            <dt className="text-xs text-muted-foreground">{figure.label}</dt>
            <dd className="text-sm font-medium tabular-nums text-base-foreground">{figure.value}</dd>
          </div>
        ))}
      </dl>
      <Sparkline
        values={dataOpsRowsPerRun(node)}
        label={`${node.name}, rows per run over the latest runs`}
        variant="bar"
        height={32}
      />
    </div>
  );
}

function DataOpsLastErrorBlock({ nodeId }: { nodeId: string }) {
  const node = dataOpsNode(nodeId);
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <p className="text-xs font-medium text-muted-foreground">Last error</p>
      {node.error ? (
        <div className="flex flex-col gap-1 rounded-lg bg-critical-background p-3 text-critical-foreground">
          <p className="flex items-center gap-1.5 text-xs font-medium">
            <IconAlertTriangle aria-hidden="true" className="size-3.5 shrink-0" />
            Failed at {node.error.time} UTC
          </p>
          <p className="break-words font-mono text-xs">{node.error.text}</p>
        </div>
      ) : (
        <p className="text-sm text-medium-foreground">
          {node.state === 'stale'
            ? 'No error on this node. It is waiting for sap-odata upstream.'
            : 'No errors in the latest 14 runs.'}
        </p>
      )}
    </div>
  );
}

type DataOpsInspectorProps = DataOpsNodeProps & { onToggleRun: (id: string) => void };

/** The drawer under the graph: everything about the selected node, and the one action on it. */
function DataOpsInspectorPanel({ nodeId, manualRun, onToggleRun }: DataOpsInspectorProps) {
  const node = dataOpsNode(nodeId);
  return (
    <DashboardPanel
      title={node.name}
      description={`${DATA_OPS_KIND[node.column]} · ${node.detail}`}
      actions={
        <div className="flex flex-wrap items-center justify-end gap-3">
          <DataOpsStateLabel state={manualRun ? 'running' : node.state} />
          {manualRun ? (
            <Button variant="outline" size="sm" onClick={() => onToggleRun(node.id)}>
              <IconPlayerStop /> Cancel run
            </Button>
          ) : (
            <Button size="sm" onClick={() => onToggleRun(node.id)}>
              <IconPlayerPlay /> Run now
            </Button>
          )}
        </div>
      }
    >
      <div className="grid w-full grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-3">
        <DataOpsRunHistoryBlock nodeId={nodeId} manualRun={manualRun} />
        <DataOpsThroughputBlock nodeId={nodeId} />
        <DataOpsLastErrorBlock nodeId={nodeId} />
      </div>
    </DashboardPanel>
  );
}

function DataOpsSummaryStrip() {
  const figures = [
    { label: 'Healthy nodes', value: '11 of 15' },
    { label: 'Failing', value: '1 extractor' },
    { label: 'Oldest data', value: '6 h 12 min' },
    { label: 'Rows today', value: '18.4 M' },
  ];
  return (
    <dl className="flex w-full flex-wrap gap-x-8 gap-y-2">
      {figures.map((figure) => (
        <div key={figure.label} className="flex items-baseline gap-2">
          <dt className="text-xs text-muted-foreground">{figure.label}</dt>
          <dd className="text-sm font-medium tabular-nums text-base-foreground">{figure.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function useDataOpsSelection(initialId: string) {
  const [selectedId, setSelectedId] = useState(initialId);
  const [manualRuns, setManualRuns] = useState<readonly string[]>([]);
  const toggleRun = (id: string) =>
    setManualRuns((current) => (current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id]));
  return { selectedId, setSelectedId, manualRun: manualRuns.includes(selectedId), toggleRun };
}

/**
 * Archetype: diagram-first lineage graph with a log rail and a full-width bottom drawer.
 * Dominant element: the left-to-right node and edge graph of the pipeline, sources to data model.
 * Interaction: selecting a node highlights its lineage, fills the drawer (run history, rows and
 * latency, last error, Run now) and points the log tail at that node; Run now adds a running run.
 */
function DataOpsDashboard() {
  const { selectedId, setSelectedId, manualRun, toggleRun } = useDataOpsSelection('ext-sap');

  return (
    <DashboardFrame
      title="Data operations"
      subtitle="Nordkapp · project nordkapp-prod · updated 14:00 UTC"
      status={<StatusIndicator tone="critical" shape="diamond" label="1 pipeline failing" detail="work orders 6 h old" />}
      actions={
        <Button variant="outline" size="sm">
          <IconRefresh /> Refresh
        </Button>
      }
      toolbar={<DataOpsSummaryStrip />}
    >
      <DashboardGrid>
        <DashboardCell span={9}>
          <DataOpsLineagePanel selectedId={selectedId} onSelect={setSelectedId} />
        </DashboardCell>
        <DashboardCell span={3}>
          <DataOpsLogPanel nodeId={selectedId} manualRun={manualRun} />
        </DashboardCell>
        <DashboardCell span={12}>
          <DataOpsInspectorPanel nodeId={selectedId} manualRun={manualRun} onToggleRun={toggleRun} />
        </DashboardCell>
      </DashboardGrid>
    </DashboardFrame>
  );
}

function DataOpsDashSignature() {
  return (
    <ThemeScope preset="terminal" className="w-full">
      <DataOpsDashboard />
    </ThemeScope>
  );
}

function DataOpsDashAura() {
  return (
    <ThemeScope preset="aura" className="w-full">
      <DataOpsDashboard />
    </ThemeScope>
  );
}

function DataOpsDashDenseData() {
  return (
    <ThemeScope preset="dense-data" className="w-full">
      <DataOpsDashboard />
    </ThemeScope>
  );
}

function DataOpsDashNightVision() {
  return (
    <ThemeScope preset="night-vision" className="w-full">
      <DataOpsDashboard />
    </ThemeScope>
  );
}

function DataOpsDashLineage() {
  const [selectedId, setSelectedId] = useState('tr-asset');
  return <DataOpsLineagePanel selectedId={selectedId} onSelect={setSelectedId} />;
}

function DataOpsDashInspector() {
  const { selectedId, manualRun, toggleRun } = useDataOpsSelection('ext-sap');
  return <DataOpsInspectorPanel nodeId={selectedId} manualRun={manualRun} onToggleRun={toggleRun} />;
}

function DataOpsDashLogTail() {
  return <DataOpsLogPanel nodeId="ext-sap" manualRun={false} />;
}

function DataOpsDashRunHistory() {
  return (
    <div className="flex w-full flex-col gap-6">
      <DataOpsRunHistoryBlock nodeId="ext-pi" manualRun={false} />
      <DataOpsRunHistoryBlock nodeId="ext-sap" manualRun={false} />
    </div>
  );
}

function DataOpsDashThroughput() {
  return (
    <div className="w-full">
      <DataOpsThroughputBlock nodeId="ext-opcua" />
    </div>
  );
}

function DataOpsDashLastError() {
  return (
    <div className="flex w-full flex-col gap-6">
      <DataOpsLastErrorBlock nodeId="ext-sap" />
      <DataOpsLastErrorBlock nodeId="raw-sap" />
    </div>
  );
}

function DataOpsDashSummary() {
  return <DataOpsSummaryStrip />;
}

export default definePage({
  id: 'data-operations',
  title: 'Data operations',
  summary:
    'Where the data comes from and where it is stuck: every source, extractor, raw table, transformation and data model view as one lineage graph, with the runs, logs and one action for the node you select.',
  guidance: {
    use: [
      'For the people who keep extractors and transformations running.',
      'When a stale figure downstream has to be traced back to the node that broke.',
      'Keep the graph to stages people recognise and at most three lanes.',
      'Say failed and stale in words with an icon, and dash the lines they block.',
    ],
    avoid: [
      'Showing every table and job of the project; group them or filter to one data product.',
      'Status by colour alone on the nodes or the lines.',
      'A log that does not follow the selection: one node, one tail.',
      'Run buttons on nodes you cannot trigger, such as source systems you do not own.',
    ],
  },
  source,
  sections: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description: 'Shown in the Terminal theme. Select a node to follow its lineage, runs and log.',
      specimens: [
        {
          id: 'DataOpsDashSignature',
          title: 'Data operations',
          note: 'Pick it as the home screen of a data engineering or integration team.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'dashboards/DashboardFrame.tsx',
            'dashboards/DashboardGrid.tsx',
            'dashboards/DashboardPanel.tsx',
            'industrial/workflows/RunHistoryStrip.tsx',
            'industrial/Sparkline.tsx',
            'industrial/StatusIndicator.tsx',
            'themes/ThemeScope.tsx',
          ],
          Component: DataOpsDashSignature,
        },
      ],
    },
    {
      id: 'themes',
      title: 'In other themes',
      description: 'The same dashboard, unchanged, in three more presets.',
      specimens: [
        {
          id: 'DataOpsDashAura',
          title: 'Aura',
          note: 'Pick it when data operations is one page of a wider product in the default theme.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['themes/ThemeScope.tsx', 'themes/themes.css'],
          Component: DataOpsDashAura,
        },
        {
          id: 'DataOpsDashDenseData',
          title: 'Dense data',
          note: 'Pick it for a light, compact console that sits beside tables and query tools.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['themes/ThemeScope.tsx', 'themes/themes.css'],
          Component: DataOpsDashDenseData,
        },
        {
          id: 'DataOpsDashNightVision',
          title: 'Night vision',
          note: 'Pick it for a monitoring wall that stays on all night.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['themes/ThemeScope.tsx', 'themes/themes.css'],
          Component: DataOpsDashNightVision,
        },
      ],
    },
    {
      id: 'panels',
      title: 'Panels',
      description: 'Each part on its own, ready to drop into another dashboard.',
      specimens: [
        {
          id: 'DataOpsDashSummary',
          title: 'Summary strip',
          note: 'Pick it under the header when four plain figures say enough about the whole pipeline.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          Component: DataOpsDashSummary,
        },
        {
          id: 'DataOpsDashLineage',
          title: 'Lineage graph',
          note: 'Pick it when people have to see what feeds what before they act.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx'],
          Component: DataOpsDashLineage,
        },
        {
          id: 'DataOpsDashInspector',
          title: 'Node inspector',
          note: 'Pick it as the drawer under a graph or table: one selected job, its runs, figures and action.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx', 'industrial/workflows/RunHistoryStrip.tsx', 'industrial/Sparkline.tsx'],
          Component: DataOpsDashInspector,
        },
        {
          id: 'DataOpsDashLogTail',
          title: 'Log tail',
          note: 'Pick it beside a selection when the last few lines usually explain the state.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx'],
          Component: DataOpsDashLogTail,
        },
        {
          id: 'DataOpsDashRunHistory',
          title: 'Run history',
          note: 'Pick it to show whether a job fails now and then or has been failing since a point in time.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['industrial/workflows/RunHistoryStrip.tsx'],
          Component: DataOpsDashRunHistory,
        },
        {
          id: 'DataOpsDashThroughput',
          title: 'Rows and latency',
          note: 'Pick it for the four figures of one job with the rows per run as bars.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['industrial/Sparkline.tsx'],
          Component: DataOpsDashThroughput,
        },
        {
          id: 'DataOpsDashLastError',
          title: 'Last error',
          note: 'Pick it to separate a node that failed from one that only waits for a failure upstream.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          Component: DataOpsDashLastError,
        },
      ],
    },
  ],
});
