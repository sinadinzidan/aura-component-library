import { Button } from '@cognite/aura/components/button';
import { SegmentedControl, SegmentedControlButton, SegmentedControlList } from '@cognite/aura/components/segmented-control';
import {
  IconAlertOctagon,
  IconAlertTriangle,
  IconCalendarRepeat,
  IconCircleCheck,
  IconClock,
  IconDatabase,
  IconFileText,
  IconHistory,
  IconMathFunction,
  IconPlayerPlay,
  IconPlugConnected,
  IconReload,
  IconRoute,
  IconSchema,
  IconSettings,
  IconShieldCheck,
} from '@cognite/aura/icons';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { AppFrame, type AppFrameNavItem } from '../../../library/kit/AppFrame';
import { Bars } from '../../../library/kit/Bars';
import { Canvas } from '../../../library/kit/Canvas';
import { DataTable, type DataTableColumn } from '../../../library/kit/DataTable';
import { Donut } from '../../../library/kit/Donut';
import { Grid } from '../../../library/kit/Grid';
import { HeatStrip, type HeatRow } from '../../../library/kit/HeatStrip';
import { IconChip } from '../../../library/kit/IconChip';
import { Legend } from '../../../library/kit/Legend';
import { Panel } from '../../../library/kit/Panel';
import { Stat } from '../../../library/kit/Stat';
import { StatusPill } from '../../../library/kit/StatusPill';
import { formatNumber, toneLine, type Tone } from '../../../library/kit/tones';
import { LookScope } from '../../../library/looks/LookScope';
import { MINUTE, REFERENCE_NOW, formatTime, makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './data-operations.tsx?raw';

type DoLane = 'source' | 'extractor' | 'transform' | 'model';

type DoState = 'healthy' | 'late' | 'failed';

type DoNode = {
  id: string;
  lane: DoLane;
  row: number;
  name: string;
  /** What it is, in the words of the team that owns it. */
  kind: string;
  state: DoState;
  /** The line under the name on the map. */
  meta: string;
  throughput: string;
  throughputUnit: string;
  freshness: string;
  success: number;
  /** Typical run time in seconds. */
  seconds: number;
  rows: number;
  seed: number;
  note: string;
};

type DoEdge = {
  from: string;
  to: string;
  label: string;
  weight: number;
  at?: number;
};

const DO_LANES: {
  id: DoLane;
  label: string;
  unit: string;
  tone: Tone;
  icon: ReactNode;
}[] = [
  {
    id: 'source',
    label: 'Sources',
    unit: 'systems',
    tone: 'blue',
    icon: <IconDatabase />,
  },
  {
    id: 'extractor',
    label: 'Extractors',
    unit: 'running',
    tone: 'teal',
    icon: <IconPlugConnected />,
  },
  {
    id: 'transform',
    label: 'Transformations',
    unit: 'jobs',
    tone: 'purple',
    icon: <IconMathFunction />,
  },
  {
    id: 'model',
    label: 'Data models',
    unit: 'views',
    tone: 'amber',
    icon: <IconSchema />,
  },
];

const DO_NODES: DoNode[] = [
  {
    id: 's-sap',
    lane: 'source',
    row: 0,
    name: 'SAP PM',
    kind: 'Maintenance system',
    state: 'healthy',
    meta: 'Work orders',
    throughput: '18.2',
    throughputUnit: 'k rows/h',
    freshness: '4 min',
    success: 100,
    seconds: 12,
    rows: 6100,
    seed: 71,
    note: 'Read through the OData gateway with a service account. Change pointers keep the load incremental.',
  },
  {
    id: 's-pi',
    lane: 'source',
    row: 1,
    name: 'PI historian',
    kind: 'Process historian',
    state: 'healthy',
    meta: '48 200 tags',
    throughput: '1.9',
    throughputUnit: 'M points/h',
    freshness: '20 s',
    success: 100,
    seconds: 6,
    rows: 640000,
    seed: 72,
    note: 'Snapshot and archive values for every tag with a point source of Nordkapp.',
  },
  {
    id: 's-opc',
    lane: 'source',
    row: 2,
    name: 'OPC UA gateway',
    kind: 'Control system gateway',
    state: 'late',
    meta: 'Lag 14 min',
    throughput: '420',
    throughputUnit: 'k points/h',
    freshness: '14 min',
    success: 96.4,
    seconds: 9,
    rows: 140000,
    seed: 73,
    note: 'The gateway in the compression area has answered slowly since the recompressor trip at 13:46.',
  },
  {
    id: 's-doc',
    lane: 'source',
    row: 3,
    name: 'Document archive',
    kind: 'File share',
    state: 'healthy',
    meta: 'Drawings, manuals',
    throughput: '310',
    throughputUnit: 'files/h',
    freshness: '22 min',
    success: 99.2,
    seconds: 40,
    rows: 105,
    seed: 74,
    note: 'Engineering drawings, datasheets and vendor manuals, crawled by modified date.',
  },
  {
    id: 'e-sap',
    lane: 'extractor',
    row: 0,
    name: 'SAP extractor',
    kind: 'Extractor',
    state: 'healthy',
    meta: 'Every 5 min',
    throughput: '18.2',
    throughputUnit: 'k rows/h',
    freshness: '4 min',
    success: 99.8,
    seconds: 48,
    rows: 1520,
    seed: 75,
    note: 'Writes orders, operations and notifications to the raw database sap_pm.',
  },
  {
    id: 'e-pi',
    lane: 'extractor',
    row: 1,
    name: 'PI extractor',
    kind: 'Extractor',
    state: 'healthy',
    meta: 'Streaming',
    throughput: '1.9',
    throughputUnit: 'M points/h',
    freshness: '20 s',
    success: 99.9,
    seconds: 5,
    rows: 640000,
    seed: 76,
    note: 'Streams data points straight to time series; backfills gaps after a restart.',
  },
  {
    id: 'e-opc',
    lane: 'extractor',
    row: 2,
    name: 'OPC UA extractor',
    kind: 'Extractor',
    state: 'late',
    meta: 'Lag 14 min',
    throughput: '420',
    throughputUnit: 'k points/h',
    freshness: '14 min',
    success: 96.4,
    seconds: 64,
    rows: 140000,
    seed: 77,
    note: 'Buffering on disk while the gateway is slow. Nothing is lost; values arrive late.',
  },
  {
    id: 'e-doc',
    lane: 'extractor',
    row: 3,
    name: 'File extractor',
    kind: 'Extractor',
    state: 'healthy',
    meta: 'Every 20 min',
    throughput: '310',
    throughputUnit: 'files/h',
    freshness: '22 min',
    success: 99.2,
    seconds: 95,
    rows: 105,
    seed: 78,
    note: 'Uploads new and changed files with their folder path as metadata.',
  },
  {
    id: 't-wo',
    lane: 'transform',
    row: 0,
    name: 'Clean work orders',
    kind: 'Transformation',
    state: 'healthy',
    meta: 'Every 20 min',
    throughput: '17.6',
    throughputUnit: 'k rows/h',
    freshness: '11 min',
    success: 99.6,
    seconds: 74,
    rows: 5870,
    seed: 79,
    note: 'Deduplicates orders, maps status codes and links each order to its asset.',
  },
  {
    id: 't-match',
    lane: 'transform',
    row: 1,
    name: 'Match tags',
    kind: 'Transformation',
    state: 'healthy',
    meta: 'Every 20 min',
    throughput: '2.3',
    throughputUnit: 'M rows/h',
    freshness: '9 min',
    success: 98.9,
    seconds: 212,
    rows: 767000,
    seed: 80,
    note: 'Matches historian and control system tags to assets by naming rules and reviewed suggestions.',
  },
  {
    id: 't-tree',
    lane: 'transform',
    row: 2,
    name: 'Build hierarchy',
    kind: 'Transformation',
    state: 'healthy',
    meta: 'Hourly',
    throughput: '2.1',
    throughputUnit: 'k rows/h',
    freshness: '38 min',
    success: 100,
    seconds: 131,
    rows: 2100,
    seed: 81,
    note: 'Rebuilds the asset tree from functional locations and equipment records.',
  },
  {
    id: 't-doc',
    lane: 'transform',
    row: 3,
    name: 'Classify documents',
    kind: 'Transformation',
    state: 'failed',
    meta: 'Failed 12:40',
    throughput: '0',
    throughputUnit: 'files/h',
    freshness: '1 h 40 min',
    success: 81.3,
    seconds: 160,
    rows: 105,
    seed: 82,
    note: 'Schema drift: column doc_class is missing in raw table documents.files since the 12:40 run.',
  },
  {
    id: 'm-wo',
    lane: 'model',
    row: 0,
    name: 'Work order',
    kind: 'Data model view',
    state: 'healthy',
    meta: '1.24 M instances',
    throughput: '17.6',
    throughputUnit: 'k rows/h',
    freshness: '11 min',
    success: 99.6,
    seconds: 8,
    rows: 5870,
    seed: 83,
    note: 'Read by the maintenance planner and the plant overview.',
  },
  {
    id: 'm-ts',
    lane: 'model',
    row: 1,
    name: 'Time series',
    kind: 'Data model view',
    state: 'healthy',
    meta: '48 200 instances',
    throughput: '2.3',
    throughputUnit: 'M rows/h',
    freshness: '9 min',
    success: 98.9,
    seconds: 6,
    rows: 767000,
    seed: 84,
    note: 'Read by trends, the control room console and the anomaly models.',
  },
  {
    id: 'm-asset',
    lane: 'model',
    row: 2,
    name: 'Asset',
    kind: 'Data model view',
    state: 'healthy',
    meta: '86 400 instances',
    throughput: '2.1',
    throughputUnit: 'k rows/h',
    freshness: '38 min',
    success: 100,
    seconds: 7,
    rows: 2100,
    seed: 85,
    note: 'The hierarchy every other view links to.',
  },
  {
    id: 'm-doc',
    lane: 'model',
    row: 3,
    name: 'Document',
    kind: 'Data model view',
    state: 'failed',
    meta: 'Stale 1 h 40 min',
    throughput: '0',
    throughputUnit: 'files/h',
    freshness: '1 h 40 min',
    success: 81.3,
    seconds: 9,
    rows: 0,
    seed: 86,
    note: 'No new documents since 12:20. Search and the field app show the last good version.',
  },
];

const DO_EDGES: DoEdge[] = [
  { from: 's-sap', to: 'e-sap', label: '18.2 k/h', weight: 2 },
  { from: 's-pi', to: 'e-pi', label: '1.9 M/h', weight: 4 },
  { from: 's-opc', to: 'e-opc', label: '420 k/h', weight: 3 },
  { from: 's-doc', to: 'e-doc', label: '310/h', weight: 1 },
  { from: 'e-sap', to: 't-wo', label: '18.2 k/h', weight: 2 },
  { from: 'e-sap', to: 't-tree', label: '2.1 k/h', weight: 1, at: 0.3 },
  { from: 'e-pi', to: 't-match', label: '1.9 M/h', weight: 4 },
  { from: 'e-opc', to: 't-match', label: '420 k/h', weight: 3, at: 0.3 },
  { from: 'e-doc', to: 't-doc', label: '310/h', weight: 1 },
  { from: 't-wo', to: 'm-wo', label: '17.6 k/h', weight: 2 },
  { from: 't-match', to: 'm-ts', label: '2.3 M/h', weight: 4 },
  { from: 't-match', to: 'm-asset', label: '86 k/h', weight: 2 },
  { from: 't-tree', to: 'm-asset', label: '2.1 k/h', weight: 1, at: 0.3 },
  { from: 't-doc', to: 'm-doc', label: 'Stopped', weight: 1 },
];

const DO_STATE_TONE: Record<DoState, Tone> = {
  healthy: 'success',
  late: 'warning',
  failed: 'critical',
};

const DO_STATE_LABEL: Record<DoState, string> = {
  healthy: 'Healthy',
  late: 'Running late',
  failed: 'Failing',
};

const DO_LANE_INDEX: Record<DoLane, number> = {
  source: 0,
  extractor: 1,
  transform: 2,
  model: 3,
};

const DO_NODE_WIDTH = 18;

const DO_NODE_HEIGHT = 62;

const DO_MAP_HEIGHT = 424;

const DO_NAV: AppFrameNavItem[] = [
  { id: 'pipelines', label: 'Pipelines', icon: <IconRoute /> },
  { id: 'runs', label: 'Runs', icon: <IconHistory /> },
  { id: 'quality', label: 'Freshness', icon: <IconShieldCheck /> },
  { id: 'schedules', label: 'Schedules', icon: <IconCalendarRepeat /> },
  { id: 'settings', label: 'Settings', icon: <IconSettings /> },
];

function doNode(id: string): DoNode {
  return DO_NODES.find((node) => node.id === id) ?? DO_NODES[0];
}

function doLeft(node: DoNode): number {
  return 1 + DO_LANE_INDEX[node.lane] * ((98 - DO_NODE_WIDTH) / 3);
}

function doTop(node: DoNode): number {
  return 58 + node.row * 90;
}

function doEdgeState(edge: DoEdge): DoState {
  const from = doNode(edge.from);
  const to = doNode(edge.to);
  if (from.state === 'failed') return 'failed';
  if (from.state === 'late' && to.state !== 'failed') return 'late';
  return 'healthy';
}

/** Everything that feeds a node and everything it feeds, including itself. */
function doLineage(id: string): Set<string> {
  const seen = new Set<string>([id]);
  const walk = (start: string, forward: boolean) => {
    for (const edge of DO_EDGES) {
      const next = forward ? (edge.from === start ? edge.to : null) : edge.to === start ? edge.from : null;
      if (next && !seen.has(next)) {
        seen.add(next);
        walk(next, forward);
      }
    }
  };
  walk(id, true);
  walk(id, false);
  return seen;
}

function DoStateIcon({ state }: { state: DoState }) {
  if (state === 'healthy') return <IconCircleCheck aria-hidden="true" />;
  if (state === 'late') return <IconAlertTriangle aria-hidden="true" />;
  return <IconAlertOctagon aria-hidden="true" />;
}

/** One system, job or view on the map: name, the line that matters now, and its state on the edge. */
function DoNodeCard({ node, selected, dimmed, onSelect }: { node: DoNode; selected: boolean; dimmed: boolean; onSelect?: (id: string) => void }) {
  const tone = DO_STATE_TONE[node.state];
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={`${node.name}, ${node.kind}, ${DO_STATE_LABEL[node.state]}`}
      onClick={() => onSelect?.(node.id)}
      className={`kit-tone-${tone} @container flex h-full w-full items-center gap-2 rounded-xl border bg-base-background py-2 pr-2 pl-3.5 text-left ${
        selected ? 'border-transparent outline-2 outline-offset-1 outline-[var(--kit-accent)]' : 'border-default hover:border-emphasized'
      }`}
      style={{
        boxShadow: `inset 4px 0 0 var(--t-line), ${selected ? '0 12px 24px -12px var(--effect-shadow-xl)' : dimmed ? '0 0 0 transparent' : '0 1px 2px var(--effect-shadow-md), 0 8px 16px -12px var(--effect-shadow-xl)'}`,
      }}
    >
      <span className="min-w-0 flex-1">
        <span className="block text-sm leading-4.5 font-semibold text-base-foreground">{node.name}</span>
        <span
          className={`mt-0.5 block text-xs leading-4 ${node.state === 'healthy' ? 'text-medium-foreground' : 'font-semibold'}`}
          style={node.state === 'healthy' ? undefined : { color: 'var(--t-ink)' }}
        >
          {node.meta}
        </span>
      </span>
      <span className="hidden shrink-0 @[10.5rem]:block [&>svg]:size-4.5" style={{ color: 'var(--t-ink)' }}>
        <DoStateIcon state={node.state} />
      </span>
    </button>
  );
}

/** Sources to data models, left to right: lanes, nodes, and edges that carry their throughput. */
function DoMap({ selected, onSelect }: { selected: string; onSelect: (id: string) => void }) {
  const lineage = doLineage(selected);
  return (
    <div className="relative" style={{ height: DO_MAP_HEIGHT }}>
      {DO_LANES.map((lane, index) => (
        <div
          key={lane.id}
          className={`kit-tone-${lane.tone} absolute inset-y-0 rounded-2xl`}
          style={{
            left: `${index * ((98 - DO_NODE_WIDTH) / 3)}%`,
            width: `${DO_NODE_WIDTH + 2}%`,
            background: 'color-mix(in oklab, var(--t-line) 8%, transparent)',
          }}
        >
          <div className="flex items-center gap-2 px-3 pt-3">
            <IconChip tone={lane.tone} size="sm">
              {lane.icon}
            </IconChip>
            <span className="text-sm font-semibold text-base-foreground">{lane.label}</span>
            <span
              className="ml-auto text-xs font-medium text-medium-foreground tabular-nums"
              aria-label={`${DO_NODES.filter((node) => node.lane === lane.id).length} ${lane.unit}`}
            >
              {DO_NODES.filter((node) => node.lane === lane.id).length}
            </span>
          </div>
        </div>
      ))}

      <svg viewBox={`0 0 100 ${DO_MAP_HEIGHT}`} preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
        {DO_EDGES.map((edge) => {
          const from = doNode(edge.from);
          const to = doNode(edge.to);
          const x1 = doLeft(from) + DO_NODE_WIDTH;
          const x2 = doLeft(to);
          const y1 = doTop(from) + DO_NODE_HEIGHT / 2;
          const y2 = doTop(to) + DO_NODE_HEIGHT / 2;
          const bend = (x2 - x1) / 2;
          const state = doEdgeState(edge);
          const lit = lineage.has(edge.from) && lineage.has(edge.to);
          return (
            <path
              key={`${edge.from}-${edge.to}`}
              d={`M${x1},${y1} C${x1 + bend},${y1} ${x2 - bend},${y2} ${x2},${y2}`}
              fill="none"
              stroke={state === 'healthy' ? toneLine('accent') : toneLine(DO_STATE_TONE[state])}
              strokeWidth={1.5 + edge.weight * 1.25}
              strokeDasharray={state === 'failed' ? '6 6' : undefined}
              strokeLinecap="round"
              opacity={lit ? (state === 'healthy' ? 0.8 : 1) : 0.32}
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
      </svg>

      {DO_EDGES.map((edge) => {
        const from = doNode(edge.from);
        const to = doNode(edge.to);
        const t = edge.at ?? 0.5;
        const x1 = doLeft(from) + DO_NODE_WIDTH;
        const x2 = doLeft(to);
        const y1 = doTop(from) + DO_NODE_HEIGHT / 2;
        const y2 = doTop(to) + DO_NODE_HEIGHT / 2;
        const ease = 3 * t * t - 2 * t * t * t;
        const along = 1.5 * (1 - t) * (1 - t) * t + 1.5 * (1 - t) * t * t + t * t * t;
        const state = doEdgeState(edge);
        const lit = lineage.has(edge.from) && lineage.has(edge.to);
        return (
          <span
            key={`${edge.from}-${edge.to}`}
            className={`kit-tone-${DO_STATE_TONE[state]} absolute -translate-x-1/2 -translate-y-1/2 rounded-full border bg-base-background px-1.5 py-px text-xs font-semibold whitespace-nowrap tabular-nums ${lit ? '' : 'opacity-40'} ${state === 'healthy' ? 'border-default text-base-foreground' : 'border-transparent'}`}
            style={{
              left: `${x1 + (x2 - x1) * along}%`,
              top: y1 + (y2 - y1) * ease,
              ...(state === 'healthy' ? {} : { background: 'var(--t-soft)', color: 'var(--t-on-soft)' }),
            }}
          >
            {edge.label}
          </span>
        );
      })}

      {DO_NODES.map((node) => (
        <div
          key={node.id}
          className="absolute"
          style={{
            left: `${doLeft(node)}%`,
            top: doTop(node),
            width: `${DO_NODE_WIDTH}%`,
            height: DO_NODE_HEIGHT,
          }}
        >
          <DoNodeCard node={node} selected={node.id === selected} dimmed={!lineage.has(node.id)} onSelect={onSelect} />
        </div>
      ))}
    </div>
  );
}

function DoMapLegend() {
  return (
    <Legend
      items={[
        { label: 'Flowing, width by volume', tone: 'accent', mark: 'line' },
        { label: 'Running late', tone: 'warning', mark: 'line' },
        { label: 'Stopped', tone: 'critical', mark: 'dashed' },
      ]}
    />
  );
}

type DoRun = {
  id: number;
  started: string;
  seconds: number;
  rows: number;
  result: DoState;
};

function doRuns(node: DoNode): DoRun[] {
  const durations = makeValues({
    seed: node.seed,
    points: 12,
    base: node.seconds,
    noise: node.seconds * 0.14,
    min: 1,
    decimals: 0,
  });
  return durations.map((seconds, index) => {
    const fromEnd = 11 - index;
    const result: DoState = node.state === 'failed' && fromEnd < 5 ? 'failed' : node.state === 'late' && fromEnd < 3 ? 'late' : 'healthy';
    return {
      id: 4816 - fromEnd,
      started: formatTime(REFERENCE_NOW - fromEnd * 20 * MINUTE),
      seconds: result === 'failed' ? Math.max(2, Math.round(seconds * 0.22)) : result === 'late' ? Math.round(seconds * 1.9) : seconds,
      rows: result === 'failed' ? 0 : Math.round(node.rows * (0.9 + (index % 4) * 0.05)),
      result,
    };
  });
}

function doCompact(rows: number): string {
  if (rows >= 1_000_000) return `${formatNumber(rows / 1_000_000, 2)} M`;
  if (rows >= 10_000) return `${formatNumber(rows / 1000, 0)} k`;
  return formatNumber(rows);
}

const DO_RESULT_LABEL: Record<DoState, string> = {
  healthy: 'Succeeded',
  late: 'Slow',
  failed: 'Failed',
};

function DoRunBars({ node, height = 190 }: { node: DoNode; height?: number }) {
  const runs = doRuns(node);
  return (
    <Bars
      label={`Duration of the last twelve runs of ${node.name}, coloured by result`}
      categories={runs.map((run) => run.started)}
      series={[
        {
          id: 'seconds',
          label: 'Duration',
          values: runs.map((run) => run.seconds),
          tone: 'success',
        },
      ]}
      tones={runs.map((run) => DO_STATE_TONE[run.result])}
      unit="s"
      height={height}
      limit={{
        value: Math.round(node.seconds * 1.6),
        label: 'Slow above',
        tone: 'warning',
      }}
      headline={
        <Legend
          items={[
            { label: 'Succeeded', tone: 'success' },
            { label: 'Slow', tone: 'warning' },
            { label: 'Failed', tone: 'critical' },
          ]}
        />
      }
    />
  );
}

const DO_RUN_COLUMNS: DataTableColumn<DoRun>[] = [
  {
    id: 'run',
    header: 'Run',
    nowrap: true,
    cell: (run) => <span className="font-medium tabular-nums">Run {run.id}</span>,
  },
  {
    id: 'started',
    header: 'Started',
    nowrap: true,
    numeric: true,
    cell: (run) => run.started,
  },
  {
    id: 'duration',
    header: 'Duration',
    nowrap: true,
    numeric: true,
    cell: (run) => `${run.seconds} s`,
  },
  {
    id: 'rows',
    header: 'Written',
    nowrap: true,
    numeric: true,
    cell: (run) => doCompact(run.rows),
  },
  {
    id: 'result',
    header: 'Result',
    nowrap: true,
    cell: (run) => <StatusPill tone={DO_STATE_TONE[run.result]}>{DO_RESULT_LABEL[run.result]}</StatusPill>,
  },
];

function DoRunTable({ node, limit = 4 }: { node: DoNode; limit?: number }) {
  return (
    <DataTable
      label={`Latest runs of ${node.name}`}
      flush
      density="default"
      columns={DO_RUN_COLUMNS}
      rows={doRuns(node).slice(-limit).reverse()}
      rowKey={(run) => String(run.id)}
      rowTone={(run) => (run.result === 'healthy' ? undefined : DO_STATE_TONE[run.result])}
    />
  );
}

function doNames(ids: string[]): string {
  return ids.length > 0 ? ids.map((id) => doNode(id).name).join(', ') : 'Nothing';
}

/** The selected node in words and three figures, with the one action it needs. */
function DoNodeSummary({ node }: { node: DoNode }) {
  const lane = DO_LANES[DO_LANE_INDEX[node.lane]];
  const reads = DO_EDGES.filter((edge) => edge.to === node.id).map((edge) => edge.from);
  const writes = DO_EDGES.filter((edge) => edge.from === node.id).map((edge) => edge.to);
  const tone = DO_STATE_TONE[node.state];
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-start gap-3">
        <IconChip tone={lane.tone} size="lg">
          {lane.icon}
        </IconChip>
        <div className="min-w-0 flex-1">
          <p className="text-lg leading-6 font-semibold text-base-foreground">{node.name}</p>
          <p className="text-sm text-medium-foreground">{node.kind}</p>
        </div>
        <StatusPill tone={tone} icon={<DoStateIcon state={node.state} />}>
          {DO_STATE_LABEL[node.state]}
        </StatusPill>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <Stat variant="plain" size="sm" label="Throughput" value={node.throughput} unit={node.throughputUnit} />
        <Stat variant="plain" size="sm" label="Data age" value={node.freshness} tone={node.state === 'healthy' ? 'neutral' : tone} />
        <Stat variant="plain" size="sm" label="Success, 7 days" value={node.success} decimals={1} unit="%" />
        <Stat variant="plain" size="sm" label="Typical run" value={node.seconds} unit="s" />
      </div>
      <p
        className={`kit-tone-${tone} rounded-xl px-3.5 py-3 text-sm leading-5`}
        style={node.state === 'healthy' ? { background: 'var(--kit-well)' } : { background: 'var(--t-soft)', color: 'var(--t-on-soft)' }}
      >
        {node.note}
      </p>
      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-sm">
        <dt className="text-medium-foreground">Reads from</dt>
        <dd className="font-medium text-base-foreground">{doNames(reads)}</dd>
        <dt className="text-medium-foreground">Writes to</dt>
        <dd className="font-medium text-base-foreground">{doNames(writes)}</dd>
      </dl>
      <div className="mt-auto flex gap-2">
        <Button size="sm">
          {node.state === 'failed' ? <IconReload /> : <IconPlayerPlay />} {node.state === 'failed' ? 'Retry run' : 'Run now'}
        </Button>
        <Button size="sm" variant="outline">
          <IconFileText /> Open logs
        </Button>
      </div>
    </div>
  );
}

function DoRange() {
  const [range, setRange] = useState('4h');
  return (
    <SegmentedControl value={range} onValueChange={(next) => setRange(String(next))}>
      <SegmentedControlList size="small" aria-label="Time range">
        <SegmentedControlButton value="4h">4 h</SegmentedControlButton>
        <SegmentedControlButton value="24h">24 h</SegmentedControlButton>
        <SegmentedControlButton value="7d">7 d</SegmentedControlButton>
      </SegmentedControlList>
    </SegmentedControl>
  );
}

function DataOperationsSignature() {
  const [selected, setSelected] = useState('t-doc');
  const node = doNode(selected);
  return (
    <LookScope look="studio">
      <AppFrame
        variant="rail"
        brand={{ name: 'Nordkapp data', mark: <IconDatabase /> }}
        nav={DO_NAV}
        current="pipelines"
        title="Data operations"
        subtitle="16 nodes, 14 healthy. 4.6 M rows moved in the last hour. Documents stopped at 12:40; control system data is 14 min late."
        status={
          <StatusPill tone="critical" size="lg" icon={<IconAlertOctagon />}>
            1 failing
          </StatusPill>
        }
        actions={<DoRange />}
      >
        <Grid>
          <Panel className="col-span-12" title="Pipeline map" subtitle="Select a node to see its runs. Edges carry rows per hour." actions={<DoMapLegend />}>
            <DoMap selected={selected} onSelect={setSelected} />
          </Panel>
          <Panel className="col-span-8" title={`Run history · ${node.name}`} subtitle="Last 12 runs, duration in seconds" padding="none">
            <div className="px-5 pt-1 pb-3">
              <DoRunBars node={node} height={170} />
            </div>
            <DoRunTable node={node} limit={4} />
          </Panel>
          <Panel className="col-span-4" tone={node.state === 'healthy' ? 'neutral' : DO_STATE_TONE[node.state]}>
            <DoNodeSummary node={node} />
          </Panel>
        </Grid>
      </AppFrame>
    </LookScope>
  );
}

const DO_STEPS = [
  {
    id: 'queue',
    label: 'Wait for worker',
    start: 0,
    seconds: 4,
    state: 'healthy',
    detail: 'Picked up by worker 3',
  },
  {
    id: 'read',
    label: 'Read raw table documents.files',
    start: 4,
    seconds: 11,
    state: 'healthy',
    detail: '105 rows read',
  },
  {
    id: 'validate',
    label: 'Validate against expected schema',
    start: 15,
    seconds: 3,
    state: 'failed',
    detail: 'Column doc_class not found',
  },
  {
    id: 'classify',
    label: 'Classify by title and content',
    start: 18,
    seconds: 96,
    state: 'late',
    detail: 'Not started',
  },
  {
    id: 'write',
    label: 'Write to view Document',
    start: 114,
    seconds: 22,
    state: 'late',
    detail: 'Not started',
  },
] satisfies ReadonlyArray<{
  id: string;
  label: string;
  start: number;
  seconds: number;
  state: DoState;
  detail: string;
}>;

const DO_LOG = [
  {
    time: '12:40:02',
    level: 'Info',
    text: 'Run 4812 started by schedule every 20 minutes.',
  },
  {
    time: '12:40:06',
    level: 'Info',
    text: 'Reading documents.files, cursor at 12:20:00.',
  },
  { time: '12:40:17', level: 'Info', text: '105 rows read in 11 s.' },
  {
    time: '12:40:20',
    level: 'Error',
    text: 'Schema check failed: expected column doc_class (string), found doc_category.',
  },
  {
    time: '12:40:20',
    level: 'Info',
    text: 'Nothing written. The view Document keeps its 12:20 version.',
  },
];

/** The steps of one run on a shared time axis: where the time went and where it stopped. */
function DoWaterfall() {
  const total = 136;
  return (
    <ol className="flex flex-1 flex-col justify-between gap-3">
      {DO_STEPS.map((step) => {
        const pending = step.state === 'late';
        const tone: Tone = pending ? 'neutral' : DO_STATE_TONE[step.state];
        const late = (step.start + step.seconds) / total > 0.8;
        return (
          <li key={step.id} className="grid grid-cols-[minmax(0,15rem)_minmax(0,1fr)] items-center gap-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-base-foreground">{step.label}</p>
              <p className="text-xs text-medium-foreground">{step.detail}</p>
            </div>
            <div className="relative h-8 rounded-lg bg-muted-background">
              <div
                className={`kit-tone-${tone} absolute inset-y-0 rounded-lg`}
                style={{
                  left: `${(step.start / total) * 100}%`,
                  width: `${Math.max((step.seconds / total) * 100, 2)}%`,
                  background: pending ? 'transparent' : 'var(--t-vivid)',
                  border: pending ? '1.5px dashed var(--kit-rule-strong)' : undefined,
                }}
              />
              <span
                className="absolute top-1/2 -translate-y-1/2 text-xs font-semibold whitespace-nowrap text-base-foreground tabular-nums"
                style={
                  late
                    ? {
                        right: `calc(${100 - (step.start / total) * 100}% + 8px)`,
                      }
                    : {
                        left: `calc(${((step.start + step.seconds) / total) * 100}% + 8px)`,
                      }
                }
              >
                {pending ? `planned ${step.seconds} s` : `${step.seconds} s`}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function DataOperationsRunDetail() {
  const node = doNode('t-doc');
  return (
    <LookScope look="studio">
      <AppFrame
        variant="rail"
        brand={{ name: 'Nordkapp data', mark: <IconDatabase /> }}
        nav={DO_NAV}
        current="runs"
        title="Run 4812 · Classify documents"
        subtitle="Started 12:40:02 by schedule. Stopped after 18 seconds at the schema check; four runs since have failed the same way."
        status={
          <StatusPill tone="critical" size="lg" icon={<IconAlertOctagon />}>
            Failed
          </StatusPill>
        }
        actions={
          <>
            <Button variant="outline" size="sm">
              <IconFileText /> Download log
            </Button>
            <Button size="sm">
              <IconReload /> Retry run
            </Button>
          </>
        }
      >
        <Grid>
          <Panel
            className="col-span-8"
            title="Steps"
            subtitle="Planned 136 s, stopped at 18 s"
            icon={
              <IconChip tone="purple">
                <IconClock />
              </IconChip>
            }
          >
            <DoWaterfall />
          </Panel>
          <Panel className="col-span-4" tone="critical" title="What went wrong" subtitle="First error of the run">
            <div className="flex flex-1 flex-col gap-3">
              <p className="text-xl leading-7 font-semibold text-base-foreground">The source renamed a column.</p>
              <p className="text-sm leading-5 text-medium-foreground">
                The file extractor started writing doc_category at 12:22 after the archive was upgraded. The transformation still reads doc_class.
              </p>
              <div className="mt-auto grid grid-cols-2 gap-3">
                <Stat variant="plain" size="sm" label="Documents waiting" value={517} />
                <Stat variant="plain" size="sm" label="Stale for" value="1 h 40" unit="min" tone="critical" />
              </div>
              <Button variant="outline" size="sm">
                Map doc_category to doc_class
              </Button>
            </div>
          </Panel>
          <Panel className="col-span-7" title="Log" subtitle="5 lines" padding="none">
            <DataTable
              label="Log lines of run 4812"
              flush
              columns={[
                {
                  id: 'time',
                  header: 'Time',
                  nowrap: true,
                  cell: (line) => line.time,
                },
                {
                  id: 'level',
                  header: 'Level',
                  nowrap: true,
                  cell: (line) => <StatusPill tone={line.level === 'Error' ? 'critical' : 'neutral'}>{line.level}</StatusPill>,
                },
                { id: 'text', header: 'Message', cell: (line) => line.text },
              ]}
              rows={DO_LOG}
              rowKey={(line) => `${line.time}-${line.text}`}
              rowTone={(line) => (line.level === 'Error' ? 'critical' : undefined)}
            />
          </Panel>
          <Panel className="col-span-5" title="Recent runs" subtitle={node.name} padding="none">
            <DoRunTable node={node} limit={5} />
          </Panel>
        </Grid>
      </AppFrame>
    </LookScope>
  );
}

/** Age of the newest data per hour, as a percentage of the freshness each view promises. */
function doShareOfPromise(minutes: number[], promised: number): number[] {
  return minutes.map((age) => Math.round((age / promised) * 100));
}

const DO_FRESHNESS: HeatRow[] = [
  {
    label: 'Work order',
    values: doShareOfPromise(
      makeValues({
        seed: 91,
        points: 24,
        base: 11,
        noise: 4,
        min: 3,
        decimals: 0,
      }),
      30
    ),
    tone: 'success',
  },
  {
    label: 'Time series',
    values: doShareOfPromise(
      [
        ...makeValues({
          seed: 92,
          points: 20,
          base: 6,
          noise: 2,
          min: 2,
          decimals: 0,
        }),
        9,
        12,
        14,
        14,
      ],
      10
    ),
    tone: 'warning',
  },
  {
    label: 'Asset',
    values: doShareOfPromise(
      makeValues({
        seed: 93,
        points: 24,
        base: 40,
        noise: 14,
        min: 10,
        decimals: 0,
      }),
      120
    ),
    tone: 'success',
  },
  {
    label: 'Document',
    values: doShareOfPromise(
      [
        ...makeValues({
          seed: 94,
          points: 19,
          base: 20,
          noise: 6,
          min: 6,
          decimals: 0,
        }),
        40,
        60,
        80,
        100,
        100,
      ],
      60
    ),
    tone: 'critical',
  },
];

const DO_SLA = [
  {
    view: 'Work order',
    target: '30 min',
    now: '11 min',
    met: 99.6,
    state: 'healthy',
  },
  {
    view: 'Time series',
    target: '10 min',
    now: '14 min',
    met: 97.1,
    state: 'late',
  },
  { view: 'Asset', target: '2 h', now: '38 min', met: 100, state: 'healthy' },
  {
    view: 'Document',
    target: '1 h',
    now: '1 h 40 min',
    met: 91.4,
    state: 'failed',
  },
] satisfies ReadonlyArray<{
  view: string;
  target: string;
  now: string;
  met: number;
  state: DoState;
}>;

function DataOperationsFreshness() {
  return (
    <LookScope look="studio">
      <AppFrame
        variant="rail"
        brand={{ name: 'Nordkapp data', mark: <IconDatabase /> }}
        nav={DO_NAV}
        current="quality"
        title="Freshness"
        subtitle="How old the newest data in each view is, against what its readers were promised."
        status={
          <StatusPill tone="warning" size="lg" icon={<IconAlertTriangle />}>
            2 of 4 outside target
          </StatusPill>
        }
        actions={<DoRange />}
      >
        <Grid>
          <Panel
            className="col-span-8"
            title="Age of newest data"
            subtitle="Per hour, as a share of the promised freshness. Darker is closer to the promise, or past it."
            icon={
              <IconChip tone="teal">
                <IconClock />
              </IconChip>
            }
          >
            <div className="flex flex-1 flex-col justify-center">
              <HeatStrip
                label="Age of the newest data per view and hour over the last 24 hours"
                rows={DO_FRESHNESS}
                axis={['24 h ago', 'Now']}
                size="lg"
                max={150}
              />
            </div>
          </Panel>
          <Panel
            className="col-span-4"
            title="Nodes by state"
            subtitle="All 16 nodes"
            icon={
              <IconChip tone="blue">
                <IconRoute />
              </IconChip>
            }
          >
            <div className="flex flex-1 items-center">
              <Donut
                label="Pipeline nodes by state"
                centerCaption="nodes"
                size={140}
                legend="bottom"
                className="w-full"
                segments={[
                  { label: 'Healthy', value: 12, tone: 'success' },
                  { label: 'Running late', value: 2, tone: 'warning' },
                  { label: 'Failing', value: 2, tone: 'critical' },
                ]}
              />
            </div>
          </Panel>
          <Panel className="col-span-12" title="Promises to readers" subtitle="Freshness targets per view, last 7 days" padding="none">
            <DataTable
              label="Freshness targets per data model view"
              flush
              columns={[
                {
                  id: 'view',
                  header: 'View',
                  cell: (row) => <span className="font-semibold">{row.view}</span>,
                },
                {
                  id: 'target',
                  header: 'Promised',
                  numeric: true,
                  nowrap: true,
                  cell: (row) => row.target,
                },
                {
                  id: 'now',
                  header: 'Now',
                  numeric: true,
                  nowrap: true,
                  cell: (row) => row.now,
                },
                {
                  id: 'met',
                  header: 'Met, 7 d',
                  numeric: true,
                  nowrap: true,
                  cell: (row) => `${formatNumber(row.met, 1)} %`,
                },
                {
                  id: 'state',
                  header: 'State',
                  nowrap: true,
                  cell: (row) => (
                    <StatusPill tone={DO_STATE_TONE[row.state]}>
                      {row.state === 'healthy' ? 'Within target' : row.state === 'late' ? 'Late' : 'Stale'}
                    </StatusPill>
                  ),
                },
              ]}
              rows={DO_SLA}
              rowKey={(row) => row.view}
              rowTone={(row) => (row.state === 'healthy' ? undefined : DO_STATE_TONE[row.state])}
            />
          </Panel>
        </Grid>
      </AppFrame>
    </LookScope>
  );
}

function DataOperationsNodeSummary() {
  return (
    <LookScope look="studio" className="w-full">
      <Canvas className="h-full">
        <Panel tone="warning">
          <DoNodeSummary node={doNode('e-opc')} />
        </Panel>
      </Canvas>
    </LookScope>
  );
}

function DataOperationsRunBars() {
  const node = doNode('e-opc');
  return (
    <LookScope look="studio" className="w-full">
      <Canvas className="h-full">
        <Panel title={`Run history · ${node.name}`} subtitle="Last 12 runs, duration in seconds">
          <DoRunBars node={node} height={250} />
        </Panel>
      </Canvas>
    </LookScope>
  );
}

function DataOperationsRuns() {
  const node = doNode('t-match');
  return (
    <LookScope look="studio" className="w-full">
      <Canvas className="h-full">
        <Panel title="Latest runs" subtitle={node.name} padding="none">
          <DoRunTable node={node} limit={6} />
        </Panel>
      </Canvas>
    </LookScope>
  );
}

function DataOperationsWaterfall() {
  return (
    <LookScope look="studio" className="w-full">
      <Canvas className="h-full">
        <Panel title="Steps of a run" subtitle="Run 4812 · stopped at the schema check">
          <DoWaterfall />
        </Panel>
      </Canvas>
    </LookScope>
  );
}

function DataOperationsNodes() {
  const [selected, setSelected] = useState('s-pi');
  return (
    <LookScope look="studio" className="w-full">
      <Canvas className="flex h-full flex-col justify-center gap-3">
        {['s-pi', 'e-opc', 't-doc'].map((id) => (
          <div key={id} style={{ height: DO_NODE_HEIGHT }}>
            <DoNodeCard node={doNode(id)} selected={id === selected} dimmed={false} onSelect={setSelected} />
          </div>
        ))}
      </Canvas>
    </LookScope>
  );
}

function DataOperationsLaneHeaders() {
  return (
    <LookScope look="studio" className="w-full">
      <Canvas className="flex h-full flex-col justify-center gap-3">
        {DO_LANES.map((lane) => (
          <div
            key={lane.id}
            className={`kit-tone-${lane.tone} flex items-center gap-2.5 rounded-2xl px-3 py-3`}
            style={{
              background: 'color-mix(in oklab, var(--t-line) 9%, transparent)',
            }}
          >
            <IconChip tone={lane.tone} size="sm">
              {lane.icon}
            </IconChip>
            <span className="text-sm font-semibold text-base-foreground">{lane.label}</span>
            <span className="ml-auto text-xs text-medium-foreground">4 {lane.unit}</span>
          </div>
        ))}
      </Canvas>
    </LookScope>
  );
}

function DataOperationsFreshnessStrip() {
  return (
    <LookScope look="studio" className="w-full">
      <Canvas className="h-full">
        <Panel title="Age of newest data" subtitle="Last 24 hours">
          <div className="flex flex-1 flex-col justify-center gap-4">
            <HeatStrip label="Age of the newest data per view and hour" rows={DO_FRESHNESS.slice(1)} axis={['24 h ago', 'Now']} max={150} />
            <Legend
              items={[
                { label: 'Within promise', tone: 'success' },
                { label: 'Late', tone: 'warning' },
                { label: 'Stale', tone: 'critical' },
              ]}
            />
          </div>
        </Panel>
      </Canvas>
    </LookScope>
  );
}

export default definePage({
  id: 'data-operations',
  title: 'Data operations',
  summary:
    'Where the data comes from and where it is stuck: sources, extractors, transformations and data model views drawn as lanes from left to right, with rows per hour on every edge and the run history of the node you select.',
  guidance: {
    use: [
      'For the team that keeps data flowing into a data model and is asked "why is this stale".',
      'Read it left to right: a red node dims everything that does not depend on it.',
      'Put the figures in the sentence under the title; the map is the dashboard.',
    ],
    avoid: [
      'A table of pipelines as the first screen; lineage is lost in rows.',
      'Colouring healthy edges by lane: colour on an edge means late or stopped.',
      'More than about twenty nodes per map; split by domain before it becomes a hairball.',
    ],
  },
  source,
  sections: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description: 'Select any node on the map: its lineage lights up, and the run history and summary below follow.',
      specimens: [
        {
          id: 'DataOperationsSignature',
          title: 'Pipeline lanes',
          note: 'Pick it as the home of a data operations team that owns the path from source systems to a data model.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/AppFrame.tsx', 'kit/Panel.tsx', 'kit/Bars.tsx', 'kit/DataTable.tsx', 'kit/Stat.tsx', 'kit/IconChip.tsx', 'looks/LookScope.tsx'],
          Component: DataOperationsSignature,
        },
      ],
    },
    {
      id: 'variations',
      title: 'Other screens',
      description: 'One failed run opened up, and the freshness board the readers of the data care about.',
      specimens: [
        {
          id: 'DataOperationsRunDetail',
          title: 'Run detail',
          note: 'Pick it for the page behind a failed run: the steps on a time axis, the first error in words and the log.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/AppFrame.tsx', 'kit/Panel.tsx', 'kit/DataTable.tsx', 'kit/Stat.tsx', 'looks/LookScope.tsx'],
          Component: DataOperationsRunDetail,
        },
        {
          id: 'DataOperationsFreshness',
          title: 'Freshness board',
          note: 'Pick it to report against freshness targets: age per hour as a heat strip and the promise per view.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/AppFrame.tsx', 'kit/HeatStrip.tsx', 'kit/Donut.tsx', 'kit/DataTable.tsx', 'looks/LookScope.tsx'],
          Component: DataOperationsFreshness,
        },
      ],
    },
    {
      id: 'parts',
      title: 'Parts',
      description: 'The panels around the map on their own.',
      specimens: [
        {
          id: 'DataOperationsNodeSummary',
          title: 'Node summary',
          note: 'Pick it beside a map or a list to describe the selected job in words, three figures and one action.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Panel.tsx', 'kit/Stat.tsx', 'kit/StatusPill.tsx', 'kit/IconChip.tsx'],
          Component: DataOperationsNodeSummary,
        },
        {
          id: 'DataOperationsRunBars',
          title: 'Run history bars',
          note: 'Pick it to show when a job turned slow or started failing: one bar per run, coloured by result.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Panel.tsx', 'kit/Bars.tsx', 'kit/Legend.tsx'],
          Component: DataOperationsRunBars,
        },
        {
          id: 'DataOperationsWaterfall',
          title: 'Run steps',
          note: 'Pick it to show where the time of one run went and which step stopped it.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Panel.tsx', 'kit/tones.ts'],
          Component: DataOperationsWaterfall,
        },
        {
          id: 'DataOperationsRuns',
          title: 'Run table',
          note: 'Pick it for the exact figures of the latest runs under a chart.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Panel.tsx', 'kit/DataTable.tsx', 'kit/StatusPill.tsx'],
          Component: DataOperationsRuns,
        },
        {
          id: 'DataOperationsNodes',
          title: 'Map nodes',
          note: 'Pick the node card for any graph of jobs: state on the edge, the line that matters under the name.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Canvas.tsx', 'kit/tones.ts'],
          Component: DataOperationsNodes,
        },
        {
          id: 'DataOperationsLaneHeaders',
          title: 'Lane headers',
          note: 'Pick a decorative family per lane so the stages of a flow can be told apart without a legend.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          bleed: true,
          uses: ['kit/IconChip.tsx', 'kit/tones.ts'],
          Component: DataOperationsLaneHeaders,
        },
        {
          id: 'DataOperationsFreshnessStrip',
          title: 'Freshness strip',
          note: 'Pick it as a compact answer to "has this been late before" for a few views.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Panel.tsx', 'kit/HeatStrip.tsx', 'kit/Legend.tsx'],
          Component: DataOperationsFreshnessStrip,
        },
      ],
    },
  ],
});
