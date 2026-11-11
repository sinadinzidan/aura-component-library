import { Button } from '@cognite/aura/components/button';
import {
  IconAlertOctagon,
  IconAlertTriangle,
  IconArrowsShuffle,
  IconBox,
  IconCircleCheck,
  IconClock,
  IconDatabase,
  IconFileText,
  IconLink,
  IconPlugConnected,
  IconRefresh,
  IconRoute,
  IconServer,
  IconTimeline,
  IconTool,
} from '@cognite/aura/icons';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { AppFrame, type AppFrameNavItem } from '../../../library/kit/AppFrame';
import { Bars } from '../../../library/kit/Bars';
import { Canvas } from '../../../library/kit/Canvas';
import { GapTimeline, type GapRow } from '../../../library/kit/data-quality/GapTimeline';
import { LineageFlow, type LineageNode } from '../../../library/kit/data-quality/LineageFlow';
import {
  FRESHNESS_LABEL,
  FRESHNESS_TONE,
  RUN_LABEL,
  RUN_TONE,
  coveragePercent,
  formatDuration,
  freshness,
  longestGap,
  summarizeRuns,
  type Run,
  type RunStatus,
} from '../../../library/kit/data-quality/quality';
import { RunStrip } from '../../../library/kit/data-quality/RunStrip';
import { DataTable, type DataTableColumn } from '../../../library/kit/DataTable';
import { Histogram } from '../../../library/kit/distributions/Histogram';
import { bucketize } from '../../../library/kit/distributions/stats';
import { Grid } from '../../../library/kit/Grid';
import { HeatStrip } from '../../../library/kit/HeatStrip';
import { IconChip } from '../../../library/kit/IconChip';
import { ListRow } from '../../../library/kit/ListRow';
import { Meter } from '../../../library/kit/Meter';
import { Panel } from '../../../library/kit/Panel';
import { RingGauge } from '../../../library/kit/RingGauge';
import { SectionHeader } from '../../../library/kit/SectionHeader';
import { Stat } from '../../../library/kit/Stat';
import { StatGroup } from '../../../library/kit/StatGroup';
import { StatusPill } from '../../../library/kit/StatusPill';
import { TagId } from '../../../library/kit/TagId';
import { formatNumber, type Tone } from '../../../library/kit/tones';
import { TrendArea } from '../../../library/kit/TrendArea';
import type { LookId } from '../../../library/looks/looks';
import { LookScope } from '../../../library/looks/LookScope';
import { DAY, HOUR, MINUTE, REFERENCE_NOW, createRandom, formatAgo, formatDateTime, formatTime, makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './data-quality.tsx?raw';

const DQ_STATUS: Record<string, RunStatus> = { s: 'success', f: 'failed', r: 'running', k: 'skipped' };

/** A run history from a compact code, newest last: s = success, f = failed, r = running, k = skipped. */
function dqRuns(code: string, everyMs: number, typicalMs: number, seed: number, error?: string): Run[] {
  const random = createRandom(seed);
  return [...code].map((letter, index) => {
    const status = DQ_STATUS[letter] ?? 'success';
    const durationMs = status === 'success' ? Math.round(typicalMs * (0.7 + random() * 0.6)) : status === 'failed' ? 4_000 : 0;
    return {
      id: `run-${index}`,
      status,
      startedAt: REFERENCE_NOW - (code.length - 1 - index) * everyMs - 2 * MINUTE,
      durationMs,
      rows: status === 'success' ? Math.round((durationMs / 1000) * 320) : 0,
      error: status === 'failed' ? error : undefined,
    };
  });
}

type DqPipeline = {
  id: string;
  kind: 'Extractor' | 'Transformation';
  source: string;
  schedule: string;
  nextRunAt: number | null;
  runs: readonly Run[];
};

const DQ_PIPELINES: readonly DqPipeline[] = [
  { id: 'opcua-nordkapp-timeseries', kind: 'Extractor', source: 'OPC UA', schedule: 'Every 5 min', nextRunAt: REFERENCE_NOW + 3 * MINUTE, runs: dqRuns('ssssssssssssssssssssssss', 5 * MINUTE, 38_000, 3) },
  { id: 'pi-compression-backfill', kind: 'Extractor', source: 'PI', schedule: 'Every hour', nextRunAt: REFERENCE_NOW + 52 * MINUTE, runs: dqRuns('ssssssssssssssfssssssssr', HOUR, 412_000, 5, 'Historian timeout after 600 s') },
  {
    id: 'sap-work-orders',
    kind: 'Extractor',
    source: 'SAP',
    schedule: 'Every 30 min',
    nextRunAt: REFERENCE_NOW + 2 * MINUTE,
    runs: dqRuns('sssssssssssssssssfffffff', 30 * MINUTE, 96_000, 7, '401 Unauthorized: service account token rejected by SAP gateway'),
  },
  { id: 'tr-asset-hierarchy', kind: 'Transformation', source: 'RAW', schedule: 'Daily at 06:00', nextRunAt: REFERENCE_NOW + 16 * HOUR, runs: dqRuns('ssssssssssssssssssfsssss', DAY, 252_000, 9, 'Duplicate external id 23-KA-9103') },
  { id: 'tr-work-order-links', kind: 'Transformation', source: 'RAW', schedule: 'After sap-work-orders', nextRunAt: null, runs: dqRuns('ssssssssssssssssskkkkkkk', 30 * MINUTE, 61_000, 11) },
];

const DQ_SAP = DQ_PIPELINES[2];

const dqLastRun = (pipeline: DqPipeline): Run => pipeline.runs[pipeline.runs.length - 1];

type DqSource = { id: string; name: string; system: string; detail: string; lastSeen: number; expectedMs: number };

const DQ_SOURCES: readonly DqSource[] = [
  { id: 'opcua', name: 'OPC UA', system: 'Nordkapp DCS', detail: '12,480 tags · latency 1.2 s', lastSeen: REFERENCE_NOW - 42_000, expectedMs: MINUTE },
  { id: 'pi', name: 'PI', system: 'Plant historian', detail: 'Backfill running, catching up', lastSeen: REFERENCE_NOW - 2.4 * MINUTE, expectedMs: MINUTE },
  { id: 'sap', name: 'SAP', system: 'Maintenance, PM module', detail: 'Authentication rejected since 10:48', lastSeen: REFERENCE_NOW - 192 * MINUTE, expectedMs: 30 * MINUTE },
  { id: 'lims', name: 'LIMS', system: 'Laboratory samples', detail: '36 samples today', lastSeen: REFERENCE_NOW - 50 * MINUTE, expectedMs: HOUR },
  { id: 'docs', name: 'Document archive', system: 'Engineering documents', detail: '8,912 files · synced nightly', lastSeen: REFERENCE_NOW - 12 * HOUR, expectedMs: DAY },
];

const DQ_SOURCE_COLUMNS: DataTableColumn<DqSource>[] = [
  { id: 'source', header: 'Source', cell: (row) => row.name },
  { id: 'system', header: 'System', muted: true, cell: (row) => row.system },
  { id: 'detail', header: 'Detail', muted: true, cell: (row) => row.detail },
  { id: 'seen', header: 'Last data', numeric: true, nowrap: true, cell: (row) => formatAgo(row.lastSeen) },
  { id: 'expected', header: 'Expected every', numeric: true, nowrap: true, cell: (row) => formatDuration(row.expectedMs) },
  {
    id: 'state',
    header: 'State',
    nowrap: true,
    cell: (row) => {
      const state = freshness(REFERENCE_NOW - row.lastSeen, row.expectedMs);
      return <StatusPill tone={FRESHNESS_TONE[state]}>{FRESHNESS_LABEL[state]}</StatusPill>;
    },
  },
];

const dqSourceTone = (row: DqSource): Tone | undefined => {
  const state = freshness(REFERENCE_NOW - row.lastSeen, row.expectedMs);
  return state === 'fresh' ? undefined : FRESHNESS_TONE[state];
};

const DQ_COMPLETENESS: { source: string; share: number; tone: Tone }[] = [
  { source: 'OPC UA time series', share: 99.8, tone: 'success' },
  { source: 'PI historian backfill', share: 95.2, tone: 'warning' },
  { source: 'SAP work orders', share: 87.5, tone: 'critical' },
  { source: 'Document archive', share: 99.7, tone: 'success' },
];

const DQ_DATA_SETS: { id: string; name: string; score: number; previous: number; issue: string; tone: Tone }[] = [
  { id: 'ds-timeseries', name: 'Time series', score: 97, previous: 97, issue: 'No open issues', tone: 'blue' },
  { id: 'ds-assets', name: 'Asset hierarchy', score: 92, previous: 90, issue: '14 assets without a parent', tone: 'teal' },
  { id: 'ds-maintenance', name: 'Maintenance', score: 71, previous: 88, issue: 'Work orders 3 h stale', tone: 'critical' },
  { id: 'ds-documents', name: 'Documents', score: 84, previous: 83, issue: '312 files without an asset', tone: 'amber' },
];

const DQ_LINKS: { label: string; linked: number; total: number; tone: Tone }[] = [
  { label: 'Time series', linked: 1_184, total: 1_260, tone: 'accent' },
  { label: 'Work orders', linked: 1_021, total: 1_260, tone: 'teal' },
  { label: 'Documents', linked: 948, total: 1_260, tone: 'purple' },
  { label: 'Placed in 3D', linked: 612, total: 1_260, tone: 'pink' },
];

const DQ_DAY_START = REFERENCE_NOW - DAY;

const DQ_GAPS: GapRow[] = [
  { id: 'pt-92531', label: '23-PT-92531', sublabel: 'Discharge pressure', gaps: [] },
  {
    id: 'tt-91141',
    label: '23-TT-91141',
    sublabel: 'Cooler outlet temperature',
    gaps: [
      { from: DQ_DAY_START + 9 * HOUR, to: DQ_DAY_START + 9.6 * HOUR },
      { from: DQ_DAY_START + 17 * HOUR, to: DQ_DAY_START + 17.3 * HOUR },
    ],
  },
  { id: 'vt-92540', label: '23-VT-92540', sublabel: 'Drive-end vibration', gaps: [{ from: DQ_DAY_START + 11.2 * HOUR, to: DQ_DAY_START + 11.4 * HOUR }] },
  { id: 'it-20013', label: '27-IT-20013', sublabel: 'Motor current', gaps: [{ from: DQ_DAY_START + 3 * HOUR, to: DQ_DAY_START + 5.2 * HOUR }] },
  { id: 'tt-40015', label: '40-TT-40015', sublabel: 'Bearing temperature', gaps: [{ from: DQ_DAY_START + 15 * HOUR, to: REFERENCE_NOW }] },
];

const DQ_GAP_TICKS = [0, 6, 12, 18, 24].map((hour) => ({ at: DQ_DAY_START + hour * HOUR, label: hour === 24 ? 'Now' : formatTime(DQ_DAY_START + hour * HOUR) }));

const DQ_GAP_CAUSE: Record<string, string> = {
  'tt-91141': 'Transmitter restart',
  'vt-92540': 'Network glitch',
  'it-20013': 'Extractor redeploy',
  'tt-40015': 'Sensor fault, signal lost',
};

type DqGap = { id: string; tag: string; from: number; to: number; cause: string };

const DQ_GAP_LIST: DqGap[] = DQ_GAPS.flatMap((row) => row.gaps.map((gap, index) => ({ id: `${row.id}-${index}`, tag: row.label, from: gap.from, to: gap.to, cause: DQ_GAP_CAUSE[row.id] ?? 'Unknown' }))).sort(
  (a, b) => b.to - b.from - (a.to - a.from)
);

const DQ_GAP_COLUMNS: DataTableColumn<DqGap>[] = [
  { id: 'tag', header: 'Series', nowrap: true, cell: (gap) => <TagId>{gap.tag}</TagId> },
  { id: 'from', header: 'From', nowrap: true, cell: (gap) => formatDateTime(gap.from) },
  { id: 'length', header: 'Length', numeric: true, nowrap: true, cell: (gap) => formatDuration(gap.to - gap.from) },
  { id: 'cause', header: 'Cause', muted: true, cell: (gap) => gap.cause },
];

const DQ_ALL_GAPS = DQ_GAPS.flatMap((row) => row.gaps);

const DQ_MEAN_COVERAGE = DQ_GAPS.reduce((sum, row) => sum + coveragePercent(DQ_DAY_START, REFERENCE_NOW, row.gaps), 0) / DQ_GAPS.length;

/** Seconds from measurement to availability for the last 1,000 points; a long tail from the historian backfill. */
const dqLatencyRandom = createRandom(29);

const DQ_LATENCY = Array.from({ length: 1000 }, () => {
  const draw = dqLatencyRandom();
  return draw < 0.93 ? 0.4 + dqLatencyRandom() * 4.2 * dqLatencyRandom() + dqLatencyRandom() * 1.6 : 6 + dqLatencyRandom() * 13;
});

const DQ_LATENCY_BINS = bucketize(DQ_LATENCY, { bins: 20, min: 0, max: 20 });

const DQ_LATE_SHARE = (DQ_LATENCY.filter((value) => value > 10).length / DQ_LATENCY.length) * 100;

const DQ_CLEANING = [
  { rule: 'Duplicates removed', rows: 1204 },
  { rule: 'Outliers flagged', rows: 318 },
  { rule: 'Flatlines flagged', rows: 86 },
  { rule: 'Out of order, resorted', rows: 41 },
];

const DQ_LINEAGE: LineageNode[] = [
  { id: 'source', stage: 'Source', name: 'SAP PM', detail: 'Work orders and notifications', state: 'Failing', tone: 'critical', icon: <IconServer /> },
  { id: 'extract', stage: 'Extractor', name: 'sap-work-orders', detail: '7 failed runs since 10:48', state: 'Failed', tone: 'critical', icon: <IconPlugConnected /> },
  { id: 'raw', stage: 'Staged', name: 'raw.sap.workorders', detail: '48,210 rows · 3 h old', state: 'Stale', tone: 'warning', icon: <IconDatabase /> },
  { id: 'transform', stage: 'Transformation', name: 'tr-work-order-links', detail: 'Waits for the extractor', state: 'Skipped', tone: 'neutral', icon: <IconArrowsShuffle /> },
  { id: 'model', stage: 'Data model', name: 'WorkOrder view', detail: '47,902 instances served', state: 'Serving old data', tone: 'warning', icon: <IconBox /> },
];

const DQ_LINEAGE_NOTE: Record<string, { title: string; text: string; action: string }> = {
  source: { title: 'SAP PM rejects the service account', text: 'The gateway has answered 401 since 10:48. Nothing downstream can refresh until the token is renewed.', action: 'Renew credentials' },
  extract: { title: 'Extractor has failed 7 runs in a row', text: 'Each run stops after 4 s at authentication. It retries every 30 minutes; next attempt 14:02.', action: 'Open run log' },
  raw: { title: 'Staged rows are 3 h 12 min old', text: 'The last successful write was at 10:48. The table is intact, only out of date.', action: 'Inspect table' },
  transform: { title: 'Transformation is skipped on purpose', text: 'It runs after the extractor succeeds, so it has skipped 7 times rather than rewrite stale links.', action: 'Run anyway' },
  model: { title: 'Work orders in the model are out of date', text: 'Applications still read 47,902 work orders, but anything created in SAP after 10:48 is missing.', action: 'See consumers' },
};

type DqIssue = { id: string; title: string; scope: string; tone: Tone; level: string; since: number; icon: ReactNode };

const DQ_ISSUES: DqIssue[] = [
  { id: 'i1', title: 'SAP work orders have stopped arriving', scope: 'sap-work-orders', tone: 'critical', level: 'Critical', since: REFERENCE_NOW - 192 * MINUTE, icon: <IconAlertOctagon /> },
  { id: 'i2', title: 'Bearing temperature has no data', scope: '40-TT-40015', tone: 'warning', level: 'High', since: REFERENCE_NOW - 9 * HOUR, icon: <IconAlertTriangle /> },
  { id: 'i3', title: 'Historian backfill is behind', scope: 'pi-compression-backfill', tone: 'info', level: 'Medium', since: REFERENCE_NOW - 8 * MINUTE, icon: <IconClock /> },
  { id: 'i4', title: '312 documents have no asset link', scope: 'Nordkapp documents', tone: 'neutral', level: 'Low', since: REFERENCE_NOW - 6 * DAY, icon: <IconLink /> },
];

const DQ_PIPELINE_COLUMNS: DataTableColumn<DqPipeline>[] = [
  {
    id: 'pipeline',
    header: 'Pipeline',
    cell: (pipeline) => (
      <div>
        <div className="font-medium whitespace-nowrap">{pipeline.id}</div>
        <div className="text-xs text-[var(--kit-text-2)]">
          {pipeline.kind} · {pipeline.source}
        </div>
      </div>
    ),
  },
  { id: 'schedule', header: 'Schedule', muted: true, nowrap: true, cell: (pipeline) => pipeline.schedule },
  { id: 'state', header: 'Last run', nowrap: true, cell: (pipeline) => <StatusPill tone={RUN_TONE[dqLastRun(pipeline).status]}>{RUN_LABEL[dqLastRun(pipeline).status]}</StatusPill> },
  {
    id: 'history',
    header: 'Last 24 runs',
    width: 'w-56',
    cell: (pipeline) => <RunStrip label={`Last 24 runs of ${pipeline.id}`} runs={pipeline.runs} variant="blocks" height={18} formatStart={formatDateTime} />,
  },
  { id: 'rate', header: 'Success', numeric: true, nowrap: true, cell: (pipeline) => `${formatNumber(summarizeRuns(pipeline.runs).successRate, 0)} %` },
  { id: 'next', header: 'Next run', numeric: true, nowrap: true, muted: true, cell: (pipeline) => (pipeline.nextRunAt ? formatTime(pipeline.nextRunAt) : 'On trigger') },
];

const dqPipelineTone = (pipeline: DqPipeline): Tone | undefined => {
  const status = dqLastRun(pipeline).status;
  return status === 'success' ? undefined : RUN_TONE[status];
};

const DQ_NAV: AppFrameNavItem[] = [
  { id: 'health', label: 'Data health', icon: <IconCircleCheck /> },
  { id: 'pipelines', label: 'Pipelines', icon: <IconRoute />, badge: '1' },
  { id: 'sources', label: 'Sources', icon: <IconServer /> },
  { id: 'gaps', label: 'Gaps', icon: <IconTimeline /> },
  { id: 'issues', label: 'Issues', icon: <IconAlertTriangle />, badge: '4' },
];

const DQ_LAG = makeValues({ seed: 71, points: 24, base: 38, amplitude: 6, noise: 5, min: 20, decimals: 0 });

const DQ_BACKFILL_LAG = makeValues({ seed: 72, points: 24, base: 5, amplitude: 1, noise: 0.5, drift: -2.6, min: 1, decimals: 1 });

const DQ_SAP_AGE = [18, 4, 22, 9, 26, 12, 28, 6, 20, 10, 24, 8, 27, 14, 3, 20, 5, 34, 64, 94, 124, 154, 184, 192];

const DQ_DOCS_AGE = Array.from({ length: 24 }, (_, index) => (index + 12) % 24);

const DQ_HOURS = Array.from({ length: 25 }, (_, index) => formatTime(DQ_DAY_START + index * HOUR));

const DQ_SCORE_TREND = makeValues({ seed: 77, points: 25, base: 92, amplitude: 1, noise: 0.6, drift: -6, decimals: 1 });

function DqSheet({ look, children }: { look: LookId; children: ReactNode }) {
  return (
    <LookScope look={look} className="flex h-full flex-col">
      <Canvas className="flex-1">{children}</Canvas>
    </LookScope>
  );
}

function DqGapTimeline({ compact = false }: { compact?: boolean }) {
  return (
    <GapTimeline
      label="Data gaps for five series over the last 24 hours; the bearing temperature has had no data since 05:00"
      rows={DQ_GAPS}
      start={DQ_DAY_START}
      end={REFERENCE_NOW}
      ticks={compact ? DQ_GAP_TICKS.filter((_, index) => index % 2 === 0) : DQ_GAP_TICKS}
    />
  );
}

function DqIssueList({ limit = 4 }: { limit?: number }) {
  return (
    <ul>
      {DQ_ISSUES.slice(0, limit).map((issue) => (
        <ListRow
          key={issue.id}
          tone={issue.tone}
          leading={
            <IconChip tone={issue.tone} size="sm">
              {issue.icon}
            </IconChip>
          }
          title={issue.title}
          meta={
            <>
              <TagId>{issue.scope}</TagId> · {issue.level}
            </>
          }
          trailing={formatAgo(issue.since)}
        />
      ))}
    </ul>
  );
}

function DqFreshnessStats() {
  return (
    <StatGroup columns={4} label="Freshness per data type">
      <Stat label="Time series lag" value={42} unit="s" icon={<IconClock />} tone="success" state="Fresh" target="Expected within 1 min" sparkline={DQ_LAG} />
      <Stat label="Backfill lag" value={2.4} decimals={1} unit="min" icon={<IconDatabase />} tone="warning" state="Late" target="Expected within 1 min" sparkline={DQ_BACKFILL_LAG} />
      <Stat label="Work orders age" value="3 h 12 min" icon={<IconTool />} tone="critical" state="Stale" stateIcon={<IconAlertOctagon />} target="Expected every 30 min" sparkline={DQ_SAP_AGE} />
      <Stat label="Documents age" value={12} unit="h" icon={<IconFileText />} tone="success" state="Fresh" target="Synced nightly" sparkline={DQ_DOCS_AGE} />
    </StatGroup>
  );
}

function DataQualityFreshness() {
  return (
    <DqSheet look="studio">
      <Grid>
        <div className="col-span-12">
          <DqFreshnessStats />
        </div>
        <Panel
          className="col-span-12"
          title="Arrival delay by source"
          subtitle="Each cell is one hour of the last 24; darker means later than expected"
          icon={
            <IconChip tone="blue">
              <IconClock />
            </IconChip>
          }
        >
          <HeatStrip
            label="Arrival delay per hour by source over the last 24 hours; SAP has been late since 10:48"
            size="lg"
            rows={[
              { label: 'OPC UA', values: makeValues({ seed: 91, points: 24, base: 1, noise: 0.8, min: 0, decimals: 0 }), tone: 'success' },
              { label: 'PI historian', values: makeValues({ seed: 92, points: 24, base: 2, noise: 1.2, drift: 4, min: 0, decimals: 0 }), tone: 'warning' },
              { label: 'SAP', values: [1, 0, 1, 1, 0, 1, 2, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 9, 9, 9, 9], tone: 'critical' },
              { label: 'Document archive', values: makeValues({ seed: 94, points: 24, base: 0.6, noise: 0.5, min: 0, decimals: 0 }), tone: 'success' },
            ]}
            max={9}
            ticks={['14:00', '20:00', '02:00', '08:00', 'Now']}
            scale={{ label: 'Delay against the expected interval', low: 'On time', high: '3× late' }}
          />
        </Panel>
      </Grid>
    </DqSheet>
  );
}

function DataQualityFreshnessBySource() {
  return (
    <DqSheet look="console">
      <Grid>
        <Panel className="col-span-9" title="Sources" subtitle="5 connected systems" padding="none">
          <DataTable label="Freshness by source system" flush columns={DQ_SOURCE_COLUMNS} rows={DQ_SOURCES} rowKey={(row) => row.id} rowTone={dqSourceTone} />
        </Panel>
        <Grid stack className="col-span-3">
          <Stat label="Sources fresh" value="3 of 5" tone="warning" target="1 late · 1 stale" />
          <Stat label="Oldest data" value="3 h 12 min" tone="critical" target="SAP · limit 30 min" />
        </Grid>
      </Grid>
    </DqSheet>
  );
}

function DataQualityCompleteness() {
  return (
    <DqSheet look="soft">
      <Panel tone="teal" title="Completeness" subtitle="Rows received against rows expected, last 24 hours">
        <div className="flex flex-col gap-5">
          {DQ_COMPLETENESS.map((row) => (
            <Meter key={row.source} size="lg" label={row.source} value={row.share} min={80} max={100} decimals={1} unit="%" tone={row.tone} target={{ value: 99, label: 'Target' }} />
          ))}
        </div>
      </Panel>
    </DqSheet>
  );
}

function DataQualityContextualisation() {
  return (
    <DqSheet look="glass">
      <Panel title="Contextualisation" subtitle="Share of 1,260 assets linked to each data type">
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 py-2">
          {DQ_LINKS.map((link) => (
            <div key={link.label} className="flex items-center gap-4">
              <RingGauge label={`Assets with ${link.label.toLowerCase()}`} value={(link.linked / link.total) * 100} tone={link.tone} size={104} hideLabel />
              <div>
                <p className="text-sm font-semibold">{link.label}</p>
                <p className="text-xs tabular-nums text-[var(--kit-text-2)]">
                  {formatNumber(link.linked)} of {formatNumber(link.total)}
                </p>
                <p className="text-xs tabular-nums text-[var(--kit-text-2)]">{formatNumber(link.total - link.linked)} to link</p>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </DqSheet>
  );
}

function DataQualityScores() {
  return (
    <DqSheet look="poster">
      <Grid>
        <SectionHeader className="col-span-12" title="Quality score per data set" description="Completeness, timeliness and validity rolled into one figure out of 100." />
        {DQ_DATA_SETS.map((set) => (
          <Stat
            key={set.id}
            className="col-span-3"
            size="lg"
            label={set.name}
            value={set.score}
            unit="/ 100"
            tone={set.tone}
            delta={{ value: set.score - set.previous, decimals: 0, unit: ' pts', caption: 'vs last week' }}
            target={set.issue}
          />
        ))}
      </Grid>
    </DqSheet>
  );
}

function DataQualityRunHistory() {
  const [selected, setSelected] = useState('run-19');
  const run = DQ_SAP.runs.find((entry) => entry.id === selected) ?? dqLastRun(DQ_SAP);
  const summary = summarizeRuns(DQ_SAP.runs);

  return (
    <DqSheet look="studio">
      <Grid>
        <Panel
          className="col-span-8"
          title="sap-work-orders"
          subtitle="Extractor · every 30 min · last 24 runs, bar height is duration"
          icon={
            <IconChip tone="critical">
              <IconPlugConnected />
            </IconChip>
          }
          actions={
            <StatusPill tone="critical" icon={<IconAlertOctagon />}>
              {summary.consecutiveFailures} failures in a row
            </StatusPill>
          }
          footer="Select a run to inspect it"
        >
          <div className="flex flex-col gap-4">
            <RunStrip label="Last 24 runs of sap-work-orders" runs={DQ_SAP.runs} height={120} selected={selected} onSelect={setSelected} formatStart={formatDateTime} />
            <div className="flex justify-between text-xs tabular-nums text-[var(--kit-text-2)]">
              <span>{formatDateTime(DQ_SAP.runs[0].startedAt)}</span>
              <span>Success rate {formatNumber(summary.successRate, 0)} %</span>
              <span>{formatDateTime(dqLastRun(DQ_SAP).startedAt)}</span>
            </div>
          </div>
        </Panel>
        <Panel className="col-span-4" title={`Run at ${formatTime(run.startedAt)}`} subtitle={formatDateTime(run.startedAt)} actions={<StatusPill tone={RUN_TONE[run.status]}>{RUN_LABEL[run.status]}</StatusPill>}>
          <ul>
            <ListRow title="Duration" trailing={formatDuration(run.durationMs)} />
            <ListRow title="Rows written" trailing={formatNumber(run.rows ?? 0)} />
            <ListRow title="Triggered by" trailing="Schedule" />
          </ul>
          {run.error ? <p className="mt-3 text-sm leading-5 text-[var(--kit-line-critical)]">{run.error}</p> : <p className="mt-3 text-sm leading-5 text-[var(--kit-text-2)]">Completed without warnings.</p>}
        </Panel>
      </Grid>
    </DqSheet>
  );
}

function DataQualityPipelineTable() {
  return (
    <DqSheet look="console">
      <Panel title="Pipelines" subtitle="5 pipelines · 1 failing · 1 running" padding="none">
        <DataTable label="Pipelines with their last runs" flush columns={DQ_PIPELINE_COLUMNS} rows={DQ_PIPELINES} rowKey={(pipeline) => pipeline.id} rowTone={dqPipelineTone} />
      </Panel>
    </DqSheet>
  );
}

function DataQualityLineage() {
  const [selected, setSelected] = useState('extract');
  const note = DQ_LINEAGE_NOTE[selected] ?? DQ_LINEAGE_NOTE.extract;
  const node = DQ_LINEAGE.find((entry) => entry.id === selected) ?? DQ_LINEAGE[1];

  return (
    <DqSheet look="studio">
      <Panel
        title="Lineage of maintenance work orders"
        subtitle="From SAP to the data model · select a step"
        icon={
          <IconChip tone="purple">
            <IconRoute />
          </IconChip>
        }
      >
        <div className="flex flex-col gap-5">
          <LineageFlow label="Lineage of work orders from SAP to the data model" nodes={DQ_LINEAGE} selected={selected} onSelect={setSelected} />
          <div data-tone={node.tone} className="flex flex-wrap items-center gap-4 rounded-[var(--kit-radius-sm)] bg-[var(--t-soft)] p-4">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[var(--kit-text)]">{note.title}</p>
              <p className="text-sm leading-5 text-[var(--kit-text-2)]">{note.text}</p>
            </div>
            <Button variant="outline" size="sm">
              {note.action}
            </Button>
          </div>
        </div>
      </Panel>
    </DqSheet>
  );
}

function DataQualityFailedRun() {
  return (
    <DqSheet look="blueprint">
      <Grid>
        <Panel className="col-span-12" title="Data flow DF-014 · SAP work orders" subtitle="Rev B · 12 Mar 2026">
          <LineageFlow label="Lineage of work orders drawn as a data flow" nodes={DQ_LINEAGE} />
        </Panel>
        <Panel className="col-span-5" title="Failed run" subtitle="run-23 · 13:58">
          <ul>
            <ListRow title="Pipeline" trailing={<TagId>sap-work-orders</TagId>} />
            <ListRow title="Stopped after" trailing="4 s" />
            <ListRow title="Step" trailing="Authenticate" />
            <ListRow tone="critical" title="Consecutive failures" trailing="7" />
          </ul>
        </Panel>
        <Panel className="col-span-7" title="Log" subtitle="Last 7 lines" actions={<Button variant="outline" size="sm">Retry run</Button>}>
          <pre className="overflow-x-auto font-mono text-xs leading-5 whitespace-pre-wrap text-[var(--kit-text)]">
            {`13:58:02  INFO   Starting sap-work-orders, schedule tick
13:58:02  INFO   Requesting token for svc-cdf-extract
13:58:05  ERROR  401 Unauthorized from SAP gateway
13:58:06  ERROR  Token rejected: credentials expired 12 Mar 10:45
13:58:06  INFO   Run failed after 4 s, next attempt 14:28
13:58:06  WARN   7 consecutive failures, paging integration on call
13:58:07  INFO   Downstream tr-work-order-links marked as skipped`}
          </pre>
        </Panel>
      </Grid>
    </DqSheet>
  );
}

function DataQualitySchedule() {
  return (
    <DqSheet look="soft">
      <Panel tone="blue" title="Next runs" subtitle="Schedule for the coming hours">
        <ul>
          {[...DQ_PIPELINES]
            .sort((a, b) => (a.nextRunAt ?? Infinity) - (b.nextRunAt ?? Infinity))
            .map((pipeline) => (
              <ListRow
                key={pipeline.id}
                leading={
                  <IconChip tone={RUN_TONE[dqLastRun(pipeline).status]} size="sm">
                    {pipeline.kind === 'Extractor' ? <IconPlugConnected /> : <IconArrowsShuffle />}
                  </IconChip>
                }
                title={pipeline.id}
                meta={pipeline.schedule}
                trailing={pipeline.nextRunAt ? `${formatTime(pipeline.nextRunAt)} · in ${formatDuration(pipeline.nextRunAt - REFERENCE_NOW)}` : 'On trigger'}
              />
            ))}
        </ul>
      </Panel>
    </DqSheet>
  );
}

function DataQualitySourceStatus() {
  return (
    <DqSheet look="signal">
      <StatGroup columns={2} label="Source systems" className="h-full">
        <Stat label="OPC UA · Nordkapp DCS" value="42 s" tone="success" state="Fresh" stateIcon={<IconCircleCheck />} target="Limit 1 min" />
        <Stat label="PI · Plant historian" value="2.4 min" tone="warning" state="Late" stateIcon={<IconAlertTriangle />} target="Limit 1 min" />
        <Stat label="SAP · Maintenance" value="3 h 12 min" tone="critical" state="Stale" stateIcon={<IconAlertOctagon />} target="Limit 30 min" />
        <Stat label="Document archive" value="12 h" tone="success" state="Fresh" stateIcon={<IconCircleCheck />} target="Limit 24 h" />
      </StatGroup>
    </DqSheet>
  );
}

function DataQualityGapTimeline() {
  return (
    <DqSheet look="studio">
      <Grid>
        <Panel
          className="col-span-9"
          title="Gaps in the last 24 hours"
          subtitle="Five series on the 1st stage compressor and its auxiliaries"
          icon={
            <IconChip tone="amber">
              <IconTimeline />
            </IconChip>
          }
        >
          <DqGapTimeline />
        </Panel>
        <Grid stack className="col-span-3">
          <Stat label="Mean coverage" value={DQ_MEAN_COVERAGE} decimals={1} unit="%" tone="warning" target="Target 99.0 %" />
          <Stat label="Longest gap" value={formatDuration(longestGap(DQ_DAY_START, REFERENCE_NOW, DQ_ALL_GAPS))} tone="critical" target="40-TT-40015 · ongoing" />
          <Stat label="Series with gaps" value="4 of 5" target="6 gaps in total" />
        </Grid>
      </Grid>
    </DqSheet>
  );
}

function DataQualityGapList() {
  return (
    <DqSheet look="editorial">
      <Panel title="Gaps by length" subtitle="Last 24 hours, longest first">
        <DataTable label="Data gaps over the last 24 hours, longest first" columns={DQ_GAP_COLUMNS} rows={DQ_GAP_LIST} rowKey={(gap) => gap.id} />
      </Panel>
    </DqSheet>
  );
}

function DataQualityLatency() {
  return (
    <DqSheet look="glass">
      <Panel title="Ingestion latency" subtitle="Measurement to availability, last 1,000 points">
        <Histogram
          label={`Distribution of ingestion latency for the last 1,000 points; ${formatNumber(DQ_LATE_SHARE, 1)} % arrived later than the 10 second target`}
          counts={DQ_LATENCY_BINS}
          min={0}
          max={20}
          xTitle="Latency, seconds"
          yTitle="Points"
          height={290}
          limits={[{ value: 10, label: 'Target', tone: 'critical', side: 'above' }]}
        />
      </Panel>
    </DqSheet>
  );
}

function DataQualityCleaning() {
  return (
    <DqSheet look="poster">
      <Panel title="Cleaning rules" subtitle="Rows touched in the last 24 hours">
        <Bars
          label="Rows touched by each cleaning rule in the last 24 hours; duplicates lead with 1,204"
          orientation="horizontal"
          categories={DQ_CLEANING.map((row) => row.rule)}
          series={[{ id: 'rows', label: 'Rows', values: DQ_CLEANING.map((row) => row.rows), tone: 'amber' }]}
          showValues
          height={260}
        />
      </Panel>
    </DqSheet>
  );
}

function DataQualitySla() {
  return (
    <DqSheet look="signal">
      <Grid>
        <Stat className="col-span-12" size="hero" label="Freshness agreement, this month" value={98.1} decimals={1} unit="%" tone="warning" state="At risk" stateIcon={<IconAlertTriangle />} target="Agreed 99.0 % · 6 h 42 min of allowance used" />
        <Stat className="col-span-6" label="Time series" value={99.8} decimals={1} unit="%" tone="success" state="Met" />
        <Stat className="col-span-6" label="Work orders" value={93.4} decimals={1} unit="%" tone="critical" state="Missed" />
      </Grid>
    </DqSheet>
  );
}

function DataQualityOverview() {
  return (
    <LookScope look="studio">
      <AppFrame
        brand={{ name: 'Nordkapp data', detail: 'Cognite Data Fusion', mark: <IconDatabase /> }}
        nav={DQ_NAV}
        current="health"
        title="Data health"
        subtitle="Thursday 12 March · updated 14:00 UTC"
        status={
          <StatusPill tone="critical" icon={<IconAlertOctagon />}>
            1 source failing
          </StatusPill>
        }
        actions={
          <Button variant="outline" size="sm">
            <IconRefresh /> Refresh
          </Button>
        }
      >
        <Grid>
          <div className="col-span-12">
            <DqFreshnessStats />
          </div>
          <Panel className="col-span-12" title="Pipelines" subtitle="5 pipelines · last 24 runs each" padding="none">
            <DataTable label="Pipelines with their last runs" flush columns={DQ_PIPELINE_COLUMNS} rows={DQ_PIPELINES} rowKey={(pipeline) => pipeline.id} rowTone={dqPipelineTone} />
          </Panel>
          <Panel className="col-span-7" title="Gaps in the last 24 hours" subtitle="Watched series">
            <DqGapTimeline compact />
          </Panel>
          <Panel className="col-span-5" title="Open issues" subtitle="4 open, most severe first" actions={<Button variant="ghost" size="sm">View all</Button>}>
            <DqIssueList />
          </Panel>
        </Grid>
      </AppFrame>
    </LookScope>
  );
}

function DataQualityOperations() {
  return (
    <DqSheet look="console">
      <Grid>
        <SectionHeader
          className="col-span-12"
          size="sm"
          title="Pipeline operations"
          description="Nordkapp · 14:00 UTC"
          actions={
            <StatusPill tone="critical" icon={<IconAlertOctagon />}>
              sap-work-orders failing
            </StatusPill>
          }
        />
        <div className="col-span-12">
          <StatGroup columns={4} label="Pipeline summary">
            <Stat variant="plain" label="Runs today" value={412} />
            <Stat variant="plain" label="Failed" value={8} tone="critical" />
            <Stat variant="plain" label="Rows written" value="29.8 M" />
            <Stat variant="plain" label="Median latency" value={1.2} decimals={1} unit="s" tone="success" />
          </StatGroup>
        </div>
        {DQ_PIPELINES.slice(0, 3).map((pipeline) => {
          const summary = summarizeRuns(pipeline.runs);
          const last = dqLastRun(pipeline);
          return (
            <Panel key={pipeline.id} className="col-span-4" tone={RUN_TONE[last.status]} title={pipeline.id} subtitle={pipeline.schedule}>
              <div className="flex flex-col gap-3">
                <RunStrip label={`Last 24 runs of ${pipeline.id}`} runs={pipeline.runs} height={72} formatStart={formatDateTime} />
                <div className="flex items-center justify-between text-xs tabular-nums text-[var(--kit-text-2)]">
                  <StatusPill tone={RUN_TONE[last.status]}>{RUN_LABEL[last.status]}</StatusPill>
                  <span>
                    {formatNumber(summary.successRate, 0)} % of {summary.total} runs
                  </span>
                </div>
              </div>
            </Panel>
          );
        })}
        <Panel className="col-span-8" title="Sources" padding="none">
          <DataTable label="Freshness by source system" flush columns={DQ_SOURCE_COLUMNS.filter((column) => column.id !== 'detail')} rows={DQ_SOURCES} rowKey={(row) => row.id} rowTone={dqSourceTone} />
        </Panel>
        <Panel className="col-span-4" title="Open issues" subtitle="4 open">
          <DqIssueList limit={3} />
        </Panel>
      </Grid>
    </DqSheet>
  );
}

function DataQualityReport() {
  return (
    <DqSheet look="editorial">
      <Grid>
        <SectionHeader
          className="col-span-12"
          size="lg"
          eyebrow="Nordkapp · weekly data quality report · week 11"
          title="Maintenance data went stale on Thursday; everything else held"
          description="One expired SAP credential stopped work orders for three hours and pulled the maintenance score from 88 to 71."
        />
        <div className="col-span-12">
          <StatGroup columns={4} label="Quality score per data set">
            {DQ_DATA_SETS.map((set) => (
              <Stat key={set.id} variant="plain" label={set.name} value={set.score} unit="/ 100" delta={{ value: set.score - set.previous, decimals: 0, unit: ' pts', caption: 'vs last week' }} />
            ))}
          </StatGroup>
        </div>
        <Panel className="col-span-7" title="Maintenance score, last 24 hours">
          <TrendArea
            label="Quality score of the maintenance data set over the last 24 hours"
            labels={DQ_HOURS}
            series={[{ id: 'score', label: 'Score', values: DQ_SCORE_TREND, tone: 'accent' }]}
            decimals={0}
            height={260}
            yDomain={[80, 94]}
            limits={[{ value: 90, label: 'Target', tone: 'critical' }]}
            notes="The score starts to fall at 10:48, when the SAP gateway first rejected the extractor. It will recover within one run of the credential being renewed."
          />
        </Panel>
        <Panel className="col-span-5" title="Longest gaps">
          <DataTable label="Longest data gaps this week" columns={DQ_GAP_COLUMNS.filter((column) => column.id !== 'from')} rows={DQ_GAP_LIST.slice(0, 5)} rowKey={(gap) => gap.id} />
        </Panel>
      </Grid>
    </DqSheet>
  );
}

export default definePage({
  id: 'data-quality',
  title: 'Data quality',
  summary:
    'Whether the data can be trusted right now: freshness, completeness, pipeline runs, lineage and gaps, shown as finished sheets in the looks they suit.',
  guidance: {
    use: [
      'Lead with freshness against the expected interval — "3 h old, expected every 30 min" — not a bare timestamp.',
      'Show runs as a history so one failure reads differently from seven in a row.',
      'Draw gaps on a time axis and write coverage as a percentage beside each series.',
      'Trace a problem along the lineage to the step where it starts.',
    ],
    avoid: [
      'A green tick for a pipeline that succeeded on stale input.',
      'Timestamps without a judgement: say fresh, late or stale.',
      'Hiding skipped runs — a skip is information about the step upstream.',
    ],
  },
  source,
  sections: [
    {
      id: 'freshness',
      title: 'Freshness and coverage',
      description: 'How old the data is, how much of it arrived and how well it is connected.',
      specimens: [
        {
          id: 'DataQualityFreshness',
          title: 'Freshness tiles with delay strip',
          note: 'Pick it as the top of a data health page: one tile per data type and the last day of delay per source.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/Stat.tsx', 'kit/StatGroup.tsx', 'kit/HeatStrip.tsx', 'kit/Panel.tsx'],
          Component: DataQualityFreshness,
        },
        {
          id: 'DataQualityFreshnessBySource',
          title: 'Freshness by source',
          note: 'Pick it for an operator table of source systems where a late row must stand out by its edge.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/DataTable.tsx', 'kit/data-quality/quality.ts', 'kit/StatusPill.tsx', 'looks/LookScope.tsx'],
          Component: DataQualityFreshnessBySource,
        },
        {
          id: 'DataQualityCompleteness',
          title: 'Completeness against target',
          note: 'Pick it to compare received against expected rows per source on one scale with the target marked.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/Meter.tsx', 'looks/LookScope.tsx'],
          Component: DataQualityCompleteness,
        },
        {
          id: 'DataQualityContextualisation',
          title: 'Contextualisation coverage',
          note: 'Pick it to show how much of the asset hierarchy is linked to each kind of data.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/RingGauge.tsx', 'looks/LookScope.tsx'],
          Component: DataQualityContextualisation,
        },
        {
          id: 'DataQualityScores',
          title: 'Score per data set',
          note: 'Pick it for a review screen where four scores and their change must land from across the room.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/Stat.tsx', 'kit/SectionHeader.tsx', 'looks/LookScope.tsx'],
          Component: DataQualityScores,
        },
      ],
    },
    {
      id: 'pipelines',
      title: 'Pipelines and runs',
      description: 'What ran, how it ended and what it feeds.',
      specimens: [
        {
          id: 'DataQualityRunHistory',
          title: 'Run history with detail',
          note: 'Pick it on a pipeline page: bars show duration and outcome, and selecting a run opens its facts.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/data-quality/RunStrip.tsx', 'kit/data-quality/quality.ts', 'kit/ListRow.tsx', 'kit/Panel.tsx'],
          Component: DataQualityRunHistory,
        },
        {
          id: 'DataQualityPipelineTable',
          title: 'Pipeline table',
          note: 'Pick it to watch many pipelines at once, each with its last 24 runs as a strip in the row.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/DataTable.tsx', 'kit/data-quality/RunStrip.tsx', 'looks/LookScope.tsx'],
          Component: DataQualityPipelineTable,
        },
        {
          id: 'DataQualityLineage',
          title: 'Lineage with explanation',
          note: 'Pick it to trace stale data to its cause; selecting a step explains it and offers the next action.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/data-quality/LineageFlow.tsx', 'kit/Panel.tsx'],
          Component: DataQualityLineage,
        },
        {
          id: 'DataQualityFailedRun',
          title: 'Failed run on a data flow sheet',
          note: 'Pick it for an integration engineer: the flow as a drawing, the failed run and its log underneath.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/data-quality/LineageFlow.tsx', 'kit/ListRow.tsx', 'looks/LookScope.tsx'],
          Component: DataQualityFailedRun,
        },
        {
          id: 'DataQualitySchedule',
          title: 'Schedule and next run',
          note: 'Pick it to answer when data will next refresh, ordered by the soonest run.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/ListRow.tsx', 'kit/IconChip.tsx', 'looks/LookScope.tsx'],
          Component: DataQualitySchedule,
        },
        {
          id: 'DataQualitySourceStatus',
          title: 'Source status tiles',
          note: 'Pick it for a wall screen in the integration room: each source is a tile filled with its state.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/Stat.tsx', 'kit/StatGroup.tsx', 'looks/LookScope.tsx'],
          Component: DataQualitySourceStatus,
        },
      ],
    },
    {
      id: 'gaps',
      title: 'Gaps, latency and cleaning',
      description: 'Where data is missing, how late it arrives and what was corrected on the way in.',
      specimens: [
        {
          id: 'DataQualityGapTimeline',
          title: 'Gap timeline',
          note: 'Pick it to see when and for how long each series had no data, with coverage per row.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/data-quality/GapTimeline.tsx', 'kit/data-quality/quality.ts', 'kit/Stat.tsx'],
          Component: DataQualityGapTimeline,
        },
        {
          id: 'DataQualityGapList',
          title: 'Gaps as a table',
          note: 'Pick it in a report, where gaps are ranked by length and each has its cause written out.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/DataTable.tsx', 'kit/TagId.tsx', 'looks/LookScope.tsx'],
          Component: DataQualityGapList,
        },
        {
          id: 'DataQualityLatency',
          title: 'Latency distribution',
          note: 'Pick it to judge ingestion delay against a target: the tail beyond the line is what breaks the agreement.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/distributions/Histogram.tsx', 'looks/LookScope.tsx'],
          Component: DataQualityLatency,
        },
        {
          id: 'DataQualityCleaning',
          title: 'Cleaning rule counts',
          note: 'Pick it to show what the cleaning rules changed, ranked by the number of rows touched.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/Bars.tsx', 'looks/LookScope.tsx'],
          Component: DataQualityCleaning,
        },
        {
          id: 'DataQualitySla',
          title: 'Freshness agreement',
          note: 'Pick it when one agreed percentage decides the state, with the parts that make it up below.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/Stat.tsx', 'looks/LookScope.tsx'],
          Component: DataQualitySla,
        },
      ],
    },
    {
      id: 'in-use',
      title: 'In use',
      description: 'Whole screens ready to drop into a product.',
      specimens: [
        {
          id: 'DataQualityOverview',
          title: 'Data health page',
          note: 'Pick it as the landing page of a data operations product used at a desk.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/AppFrame.tsx', 'kit/data-quality/GapTimeline.tsx', 'kit/data-quality/RunStrip.tsx', 'kit/DataTable.tsx', 'kit/ListRow.tsx'],
          Component: DataQualityOverview,
        },
        {
          id: 'DataQualityOperations',
          title: 'Pipeline operations board',
          note: 'Pick it for the integration team that watches pipelines all day and needs density and unmistakable state.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/data-quality/RunStrip.tsx', 'kit/StatGroup.tsx', 'kit/DataTable.tsx', 'looks/LookScope.tsx'],
          Component: DataQualityOperations,
        },
        {
          id: 'DataQualityReport',
          title: 'Weekly data quality report',
          note: 'Pick it for a weekly report that is read top to bottom and sent as a PDF.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/StatGroup.tsx', 'kit/TrendArea.tsx', 'kit/DataTable.tsx', 'looks/LookScope.tsx'],
          Component: DataQualityReport,
        },
      ],
    },
  ],
});
