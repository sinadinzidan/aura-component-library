import { Button } from '@cognite/aura/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardHeaderCenter, CardHeaderEnd, CardTitle } from '@cognite/aura/components/card';
import { IconArrowNarrowRight, IconCalendar, IconRefresh } from '@cognite/aura/icons';
import { Fragment, useState } from 'react';

import { MetadataList } from '../../../library/display/MetadataList';
import { LinearGauge } from '../../../library/industrial/LinearGauge';
import { formatValue } from '../../../library/industrial/status';
import type { StatusDescriptor, Tone } from '../../../library/industrial/status';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { ValueReadout } from '../../../library/industrial/ValueReadout';
import { GapTimeline } from '../../../library/industrial/workflows/GapTimeline';
import { RunHistoryStrip } from '../../../library/industrial/workflows/RunHistoryStrip';
import type { RunHistoryRun } from '../../../library/industrial/workflows/RunHistoryStrip';
import { TagChip } from '../../../library/industrial/workflows/TagChip';
import { coveragePercent, formatDuration, summarizeRuns } from '../../../library/industrial/workflows/workflow';
import type { Interval, RunStatus } from '../../../library/industrial/workflows/workflow';
import { DAY, HOUR, MINUTE, REFERENCE_NOW, formatDateTime, formatTime } from '../../data/series';
import { definePage } from '../../types';

import source from './data-quality.tsx?raw';

const RUN_STATUS: Record<RunStatus, StatusDescriptor> = {
  success: { tone: 'success', label: 'Succeeded', shape: 'dot' },
  failed: { tone: 'critical', label: 'Failed', shape: 'diamond' },
  running: { tone: 'info', label: 'Running', shape: 'ring' },
  skipped: { tone: 'neutral', label: 'Skipped', shape: 'ring' },
};

/** A run history from a compact code: s = success, f = failed, r = running, k = skipped. */
function runsFrom(code: string): RunHistoryRun[] {
  const status: Record<string, RunStatus> = { s: 'success', f: 'failed', r: 'running', k: 'skipped' };
  return [...code].map((letter, index) => ({ id: String(index), status: status[letter] ?? 'success' }));
}

type Pipeline = {
  id: string;
  kind: 'Extractor' | 'Transformation';
  source: string;
  status: RunStatus;
  /** When the last run started. */
  startedAt: number;
  /** `null` while running. */
  durationMs: number | null;
  rows: number | null;
  history: readonly RunHistoryRun[];
  schedule: string;
  nextRunAt: number | null;
};

const PIPELINES: readonly Pipeline[] = [
  { id: 'opcua-nordkapp-timeseries', kind: 'Extractor', source: 'OPC UA', status: 'success', startedAt: REFERENCE_NOW - 2 * MINUTE, durationMs: 38_000, rows: 1_243_800, history: runsFrom('ssssssssssssss'), schedule: 'Every 5 min', nextRunAt: REFERENCE_NOW + 3 * MINUTE },
  { id: 'pi-compression-backfill', kind: 'Extractor', source: 'PI', status: 'running', startedAt: REFERENCE_NOW - 8 * MINUTE, durationMs: null, rows: 412_600, history: runsFrom('sssssfsssssssr'), schedule: 'Every hour', nextRunAt: REFERENCE_NOW + 52 * MINUTE },
  { id: 'sap-work-orders', kind: 'Extractor', source: 'SAP', status: 'failed', startedAt: REFERENCE_NOW - 178 * MINUTE, durationMs: 4_000, rows: 0, history: runsFrom('ssssssssssffff'), schedule: 'Every 30 min', nextRunAt: REFERENCE_NOW + 2 * MINUTE },
  { id: 'tr-asset-hierarchy', kind: 'Transformation', source: 'RAW', status: 'success', startedAt: REFERENCE_NOW - 8 * HOUR, durationMs: 252_000, rows: 16_204, history: runsFrom('sssssssssfssss'), schedule: 'Daily at 06:00', nextRunAt: REFERENCE_NOW + 16 * HOUR },
  { id: 'tr-work-order-links', kind: 'Transformation', source: 'RAW', status: 'skipped', startedAt: REFERENCE_NOW - 150 * MINUTE, durationMs: 0, rows: null, history: runsFrom('sssssssssskkkk'), schedule: 'After sap-work-orders', nextRunAt: null },
];

type DataSource = { id: string; name: string; system: string; status: StatusDescriptor; detail: string; lastSeen: number; expectedMs: number };

const SOURCES: readonly DataSource[] = [
  { id: 'opcua', name: 'OPC UA', system: 'Nordkapp DCS', status: { tone: 'success', label: 'Connected', shape: 'dot' }, detail: '12,480 tags · latency 1.2 s', lastSeen: REFERENCE_NOW - 42_000, expectedMs: MINUTE },
  { id: 'pi', name: 'PI', system: 'Plant historian', status: { tone: 'warning', label: 'Lagging', shape: 'square' }, detail: 'Backfill running · 4 min behind', lastSeen: REFERENCE_NOW - 4 * MINUTE, expectedMs: MINUTE },
  { id: 'sap', name: 'SAP', system: 'Maintenance, PM module', status: { tone: 'critical', label: 'Failing', shape: 'diamond' }, detail: 'Authentication rejected since 11:02', lastSeen: REFERENCE_NOW - 192 * MINUTE, expectedMs: 30 * MINUTE },
  { id: 'docs', name: 'Document archive', system: 'Engineering documents', status: { tone: 'success', label: 'Connected', shape: 'dot' }, detail: '8,912 files · synced nightly', lastSeen: REFERENCE_NOW - 12 * HOUR, expectedMs: DAY },
];

const COMPLETENESS: readonly { source: string; expected: number; received: number }[] = [
  { source: 'OPC UA', expected: 17_971_200, received: 17_935_300 },
  { source: 'PI', expected: 4_320_000, received: 4_112_600 },
  { source: 'SAP', expected: 48, received: 42 },
  { source: 'Document archive', expected: 8_940, received: 8_912 },
];

type DataSet = { id: string; name: string; score: number; previous: number; issue: string };

const DATA_SETS: readonly DataSet[] = [
  { id: 'ds-timeseries', name: 'Nordkapp time series', score: 97, previous: 97, issue: 'No open issues' },
  { id: 'ds-assets', name: 'Nordkapp asset hierarchy', score: 92, previous: 90, issue: '14 assets without a parent' },
  { id: 'ds-maintenance', name: 'Nordkapp maintenance', score: 71, previous: 88, issue: 'Work orders 3 h stale' },
  { id: 'ds-documents', name: 'Nordkapp documents', score: 84, previous: 83, issue: '312 files without an asset link' },
];

const scoreTone = (score: number): Tone => (score < 75 ? 'critical' : score < 90 ? 'warning' : 'neutral');

const DAY_START = REFERENCE_NOW - DAY;

const TAG_GAPS: readonly { tag: string; gaps: readonly Interval[] }[] = [
  { tag: '23-PT-92531', gaps: [] },
  { tag: '23-TT-91141', gaps: [{ from: DAY_START + 9 * HOUR, to: DAY_START + 9.6 * HOUR }, { from: DAY_START + 17 * HOUR, to: DAY_START + 17.3 * HOUR }] },
  { tag: '27-IT-20013', gaps: [{ from: DAY_START + 3 * HOUR, to: DAY_START + 5.2 * HOUR }] },
  { tag: '40-TT-40015', gaps: [{ from: DAY_START + 15 * HOUR, to: REFERENCE_NOW }] },
];

const LATENCY_BUCKETS: readonly { label: string; share: number }[] = [
  { label: '<1 s', share: 38 },
  { label: '1–2', share: 34 },
  { label: '2–5', share: 17 },
  { label: '5–10', share: 7 },
  { label: '10–30', share: 3 },
  { label: '>30 s', share: 1 },
];

const LINKS: readonly { label: string; linked: number; total: number }[] = [
  { label: 'Assets with time series', linked: 1_184, total: 1_260 },
  { label: 'Assets with documents', linked: 948, total: 1_260 },
  { label: 'Assets with work orders', linked: 1_021, total: 1_260 },
  { label: 'Assets placed in 3D', linked: 612, total: 1_260 },
];

const LINEAGE: readonly { id: string; stage: string; name: string; detail: string; status: RunStatus }[] = [
  { id: 'source', stage: 'Source', name: 'SAP PM', detail: 'Work orders, notifications', status: 'failed' },
  { id: 'raw', stage: 'Staged', name: 'raw.sap.workorders', detail: '48,210 rows · 3 h old', status: 'success' },
  { id: 'transformed', stage: 'Transformed', name: 'tr-work-order-links', detail: 'Skipped, upstream failed', status: 'skipped' },
  { id: 'model', stage: 'Data model', name: 'Maintenance.WorkOrder', detail: '47,902 instances', status: 'success' },
];

const ISSUES: readonly { id: string; title: string; scope: string; tone: Tone; shape: StatusDescriptor['shape']; label: string; since: number }[] = [
  { id: 'i1', title: 'SAP work orders have stopped arriving', scope: 'sap-work-orders', tone: 'critical', shape: 'diamond', label: 'Critical', since: REFERENCE_NOW - 178 * MINUTE },
  { id: 'i2', title: 'Bearing temperature has no data', scope: '40-TT-40015', tone: 'warning', shape: 'square', label: 'High', since: REFERENCE_NOW - 9 * HOUR },
  { id: 'i3', title: 'Historian backfill is 4 min behind', scope: 'pi-compression-backfill', tone: 'info', shape: 'dot', label: 'Medium', since: REFERENCE_NOW - 8 * MINUTE },
  { id: 'i4', title: '312 documents have no asset link', scope: 'Nordkapp documents', tone: 'neutral', shape: 'ring', label: 'Low', since: REFERENCE_NOW - 6 * DAY },
];

const TH = 'px-3 py-2 text-left text-xs font-medium text-muted-foreground';
const TD = 'px-3 py-2.5 align-middle';

const formatRows = (rows: number | null): string => (rows === null ? '—' : formatValue(rows));
const ageOf = (timestamp: number): string => formatDuration(REFERENCE_NOW - timestamp);

/** Label, a large age, and whether that age is within what is expected. */
function FreshnessTile({ label, lastUpdate, expectedMs, expectedLabel }: { label: string; lastUpdate: number; expectedMs: number; expectedLabel: string }) {
  const age = REFERENCE_NOW - lastUpdate;
  const fresh = age <= expectedMs;
  return (
    <Card className="w-full max-w-64 gap-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-baseline gap-2">
        <span className={`text-2xl font-semibold tracking-tight tabular-nums ${fresh ? 'text-base-foreground' : 'text-warning-foreground-strong'}`}>{formatDuration(age)}</span>
        <span className="text-sm text-muted-foreground">ago</span>
      </div>
      <StatusIndicator size="sm" tone={fresh ? 'success' : 'warning'} shape={fresh ? 'dot' : 'square'} label={fresh ? 'Fresh' : 'Stale'} detail={expectedLabel} />
      <span className="text-xs text-muted-foreground tabular-nums">Last update {formatDateTime(lastUpdate)}</span>
    </Card>
  );
}

function PipelineName({ pipeline }: { pipeline: Pipeline }) {
  return (
    <div className="flex min-w-0 flex-col">
      <span className="truncate font-mono text-sm text-base-foreground">{pipeline.id}</span>
      <span className="truncate text-xs text-muted-foreground">
        {pipeline.kind} · {pipeline.source}
      </span>
    </div>
  );
}

function DataQualityFreshnessTile() {
  return <FreshnessTile label="Nordkapp time series" lastUpdate={REFERENCE_NOW - 42_000} expectedMs={MINUTE} expectedLabel="expected every 60 s" />;
}

function DataQualityFreshnessStale() {
  return <FreshnessTile label="Nordkapp work orders" lastUpdate={REFERENCE_NOW - 192 * MINUTE} expectedMs={30 * MINUTE} expectedLabel="expected every 30 min" />;
}

function DataQualityCoverage() {
  return (
    <Card className="w-full max-w-64 gap-3">
      <span className="text-xs text-muted-foreground">Tag coverage, last 24 h</span>
      <ValueReadout value={96.8} unit="%" decimals={1} />
      <LinearGauge label="Tags with data in the last 24 hours" value={96.8} target={99} unit="%" decimals={1} size="sm" showHeader={false} />
      <span className="text-xs text-muted-foreground tabular-nums">12,081 of 12,480 tags · target 99 %</span>
    </Card>
  );
}

function DataQualityFreshnessList() {
  return (
    <ul aria-label="Freshness by source" className="flex w-full max-w-lg flex-col divide-y divide-default">
      {SOURCES.map((item) => {
        const fresh = REFERENCE_NOW - item.lastSeen <= item.expectedMs;
        return (
          <li key={item.id} className="grid grid-cols-[minmax(0,1fr)_6rem_5rem] items-center gap-3 py-2">
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm text-base-foreground">{item.name}</span>
              <span className="truncate text-xs text-muted-foreground">Expected every {formatDuration(item.expectedMs)}</span>
            </div>
            <span className={`text-right text-sm tabular-nums ${fresh ? 'text-base-foreground' : 'font-medium text-warning-foreground-strong'}`}>{ageOf(item.lastSeen)} ago</span>
            <StatusIndicator size="sm" tone={fresh ? 'success' : 'warning'} shape={fresh ? 'dot' : 'square'} label={fresh ? 'Fresh' : 'Stale'} />
          </li>
        );
      })}
    </ul>
  );
}

function DataQualityCompleteness() {
  return (
    <div className="flex w-full max-w-lg flex-col gap-4">
      <span className="text-xs text-muted-foreground">Records received against expected, last 24 h</span>
      {COMPLETENESS.map((row) => {
        const percent = (row.received / row.expected) * 100;
        return (
          <div key={row.source} className="flex flex-col gap-1">
            <LinearGauge label={row.source} value={percent} unit="%" decimals={1} size="sm" tone={percent < 90 ? 'warning' : 'neutral'} />
            <span className="text-xs text-muted-foreground tabular-nums">
              {formatValue(row.received)} of {formatValue(row.expected)} · {formatValue(row.expected - row.received)} missing
            </span>
          </div>
        );
      })}
    </div>
  );
}

function DataQualityScore() {
  return (
    <ul aria-label="Quality score by data set" className="flex w-full max-w-lg flex-col divide-y divide-default">
      {DATA_SETS.map((dataSet) => {
        const tone = scoreTone(dataSet.score);
        const change = dataSet.score - dataSet.previous;
        return (
          <li key={dataSet.id} className="grid grid-cols-[minmax(0,1fr)_6rem_2.5rem] items-center gap-3 py-2">
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm text-base-foreground">{dataSet.name}</span>
              <span className="truncate text-xs text-muted-foreground">
                {dataSet.issue}
                {change === 0 ? '' : ` · ${change > 0 ? 'up' : 'down'} ${Math.abs(change)} since last week`}
              </span>
            </div>
            <LinearGauge label={`${dataSet.name} quality score`} value={dataSet.score} size="sm" tone={tone} showHeader={false} />
            <ValueReadout size="sm" value={dataSet.score} tone={tone} className="justify-end" />
          </li>
        );
      })}
    </ul>
  );
}

function DataQualityContextualisation() {
  return (
    <div className="flex w-full max-w-lg flex-col gap-4">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-sm font-medium text-base-foreground">Contextualisation coverage</span>
        <span className="text-xs text-muted-foreground tabular-nums">1,260 assets</span>
      </div>
      {LINKS.map((link) => (
        <div key={link.label} className="flex flex-col gap-1">
          <LinearGauge label={link.label} value={(link.linked / link.total) * 100} unit="%" size="sm" />
          <span className="text-xs text-muted-foreground tabular-nums">
            {formatValue(link.linked)} linked · {formatValue(link.total - link.linked)} to resolve
          </span>
        </div>
      ))}
    </div>
  );
}

function DataQualityRunStates() {
  return (
    <div className="flex flex-col gap-3">
      <StatusIndicator {...RUN_STATUS.success} />
      <StatusIndicator {...RUN_STATUS.running} detail="61 %" />
      <StatusIndicator {...RUN_STATUS.failed} />
      <StatusIndicator {...RUN_STATUS.skipped} detail="upstream failed" />
    </div>
  );
}

function DataQualityRunRow() {
  return (
    <ul aria-label="Latest pipeline runs" className="flex w-full flex-col divide-y divide-default">
      {PIPELINES.slice(0, 4).map((pipeline) => (
        <li key={pipeline.id} className="grid grid-cols-[minmax(0,1fr)_6.5rem_4rem_8rem_5rem] items-center gap-3 py-2">
          <PipelineName pipeline={pipeline} />
          <StatusIndicator size="sm" {...RUN_STATUS[pipeline.status]} />
          <span className="text-right text-xs text-muted-foreground tabular-nums">{pipeline.durationMs === null ? 'Running' : formatDuration(pipeline.durationMs)}</span>
          <span className="text-right text-sm whitespace-nowrap text-base-foreground tabular-nums">{formatRows(pipeline.rows)} rows</span>
          <span className="text-right text-xs text-muted-foreground tabular-nums">{ageOf(pipeline.startedAt)} ago</span>
        </li>
      ))}
    </ul>
  );
}

function DataQualityRunHistory() {
  return (
    <ul aria-label="Run history by pipeline" className="flex w-full max-w-lg flex-col gap-4">
      {PIPELINES.slice(0, 4).map((pipeline) => {
        const summary = summarizeRuns(pipeline.history);
        return (
          <li key={pipeline.id} className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 flex-col">
              <span className="truncate font-mono text-sm text-base-foreground">{pipeline.id}</span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {summary.counts.success} of {summary.total} succeeded
              </span>
            </div>
            <RunHistoryStrip label={`${pipeline.id}, last ${pipeline.history.length} runs`} runs={pipeline.history} />
          </li>
        );
      })}
    </ul>
  );
}

function DataQualityFailedRun() {
  const pipeline = PIPELINES[2];
  const [state, setState] = useState<'failed' | 'queued'>('failed');
  return (
    <Card className="w-full max-w-lg">
      <div className="flex items-start justify-between gap-4">
        <PipelineName pipeline={pipeline} />
        {state === 'failed' ? <StatusIndicator variant="badge" {...RUN_STATUS.failed} /> : <StatusIndicator variant="badge" tone="info" label="Retry queued" />}
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-base-foreground">The SAP gateway rejected the sign-in</p>
        <p className="text-sm text-muted-foreground">The service account password expired on 12 Mar. Renew it in the extractor configuration, then retry.</p>
      </div>
      <pre className="overflow-x-auto rounded-lg bg-muted-background p-3 font-mono text-xs text-base-foreground">
        {'11:02:14  POST /sap/opu/odata/PM_ORDER  401 Unauthorized\n11:02:14  Run aborted after 4 s, 0 rows written'}
      </pre>
      <div className="flex items-center justify-between gap-4">
        <span className="text-xs text-muted-foreground tabular-nums">
          Run 4 of 4 failed since {formatTime(REFERENCE_NOW - 268 * MINUTE)} · started {formatTime(pipeline.startedAt)}
        </span>
        <div className="flex shrink-0 gap-2">
          <Button variant="ghost" size="sm">
            View log
          </Button>
          <Button variant="secondary" size="sm" disabled={state === 'queued'} onClick={() => setState('queued')}>
            <IconRefresh /> Retry run
          </Button>
        </div>
      </div>
    </Card>
  );
}

function DataQualitySchedule() {
  return (
    <ul aria-label="Schedules and next runs" className="flex w-full max-w-lg flex-col divide-y divide-default">
      {PIPELINES.map((pipeline) => (
        <li key={pipeline.id} className="flex items-center gap-3 py-2">
          <IconCalendar aria-hidden className="size-4 shrink-0 text-muted-foreground" />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate font-mono text-sm text-base-foreground">{pipeline.id}</span>
            <span className="truncate text-xs text-muted-foreground">{pipeline.schedule}</span>
          </div>
          <div className="flex shrink-0 flex-col items-end">
            <span className="text-sm text-base-foreground tabular-nums">{pipeline.nextRunAt === null ? 'Waiting' : formatTime(pipeline.nextRunAt)}</span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {pipeline.nextRunAt === null ? 'on upstream run' : `in ${formatDuration(pipeline.nextRunAt - REFERENCE_NOW)}`}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

function DataQualitySourceStatus() {
  return (
    <ul aria-label="Data source status" className="flex w-full max-w-lg flex-col divide-y divide-default">
      {SOURCES.map((item) => (
        <li key={item.id} className="flex items-center gap-3 py-2">
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm text-base-foreground">
              {item.name} <span className="text-muted-foreground">· {item.system}</span>
            </span>
            <span className="truncate text-xs text-muted-foreground tabular-nums">{item.detail}</span>
          </div>
          <span className="w-24 shrink-0">
            <StatusIndicator size="sm" {...item.status} />
          </span>
        </li>
      ))}
    </ul>
  );
}

function DataQualityLineage() {
  return (
    <div className="w-full overflow-x-auto">
      <ol aria-label="Lineage of maintenance work orders, source to data model" className="flex min-w-3xl items-stretch">
        {LINEAGE.map((step, index) => (
          <Fragment key={step.id}>
            <li className="flex min-w-0 flex-1 flex-col gap-2 rounded-xl bg-card-background p-3">
              <span className="text-xs text-muted-foreground">{step.stage}</span>
              <span className="truncate font-mono text-sm text-base-foreground">{step.name}</span>
              <span className="truncate text-xs text-muted-foreground tabular-nums">{step.detail}</span>
              <StatusIndicator size="sm" {...RUN_STATUS[step.status]} label={step.status === 'success' ? 'Up to date' : RUN_STATUS[step.status].label} />
            </li>
            {index < LINEAGE.length - 1 ? (
              <li aria-hidden role="presentation" className="flex shrink-0 items-center px-1 text-muted-foreground">
                <IconArrowNarrowRight className="size-5" />
              </li>
            ) : null}
          </Fragment>
        ))}
      </ol>
    </div>
  );
}

function DataQualityGapTimeline() {
  const { tag, gaps } = TAG_GAPS[1];
  return (
    <div className="flex w-full max-w-lg flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        <TagChip tag={tag} />
        <span className="text-xs text-muted-foreground">Cooler outlet temperature · last 24 h</span>
      </div>
      <GapTimeline label={`${tag}, last 24 hours`} start={DAY_START} end={REFERENCE_NOW} gaps={gaps} startLabel={formatDateTime(DAY_START)} endLabel="Now" showSummary />
    </div>
  );
}

function DataQualityGapList() {
  return (
    <div className="flex w-full max-w-lg flex-col gap-3">
      <ul aria-label="Data gaps by tag, last 24 hours" className="flex flex-col gap-3">
        {TAG_GAPS.map(({ tag, gaps }) => {
          const coverage = coveragePercent(DAY_START, REFERENCE_NOW, gaps);
          return (
            <li key={tag} className="grid grid-cols-[7rem_minmax(0,1fr)_3.5rem] items-center gap-3">
              <span className="font-mono text-xs text-base-foreground">{tag}</span>
              <GapTimeline size="sm" label={`${tag}, last 24 hours`} start={DAY_START} end={REFERENCE_NOW} gaps={gaps} />
              <span className={`text-right text-xs tabular-nums ${coverage < 90 ? 'font-medium text-warning-foreground-strong' : 'text-muted-foreground'}`}>{formatValue(coverage, 1)} %</span>
            </li>
          );
        })}
      </ul>
      <div className="grid grid-cols-[7rem_minmax(0,1fr)_3.5rem] gap-3 text-xs text-muted-foreground tabular-nums">
        <span />
        <span className="flex justify-between">
          <span>{formatDateTime(DAY_START)}</span>
          <span>Now</span>
        </span>
        <span />
      </div>
    </div>
  );
}

function DataQualityLatency() {
  const peak = Math.max(...LATENCY_BUCKETS.map((bucket) => bucket.share));
  return (
    <div className="flex w-full max-w-64 flex-col gap-3">
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">Ingestion latency, last hour</span>
        <div className="flex items-baseline gap-3">
          <ValueReadout value={1.4} unit="s" decimals={1} />
          <span className="text-xs text-muted-foreground tabular-nums">median · p95 8.2 s</span>
        </div>
      </div>
      <div
        role="img"
        aria-label={`Latency distribution: ${LATENCY_BUCKETS.map((bucket) => `${bucket.label} ${bucket.share} percent`).join(', ')}`}
        className="grid grid-cols-6 items-end gap-1"
      >
        {LATENCY_BUCKETS.map((bucket) => (
          <div key={bucket.label} className="flex flex-col items-center gap-1">
            <span className="text-xs text-muted-foreground tabular-nums">{bucket.share}</span>
            <div className="flex h-16 w-full items-end">
              <span className="w-full rounded-xs bg-chart-1-450" style={{ height: `${Math.max((bucket.share / peak) * 100, 3)}%` }} />
            </div>
            <span className="text-xs whitespace-nowrap text-muted-foreground tabular-nums">{bucket.label}</span>
          </div>
        ))}
      </div>
      <span className="text-xs text-muted-foreground">Share of data points, %</span>
    </div>
  );
}

function DataQualityDuplicates() {
  const rows: readonly { label: string; count: number; note: string; tone: Tone }[] = [
    { label: 'Duplicate data points', count: 1_284, note: 'Removed on ingestion', tone: 'neutral' },
    { label: 'Outliers flagged', count: 37, note: 'Outside instrument range', tone: 'warning' },
    { label: 'Out-of-order points', count: 212, note: 'Re-sorted by timestamp', tone: 'neutral' },
  ];
  return (
    <div className="flex w-full max-w-64 flex-col gap-3">
      <span className="text-xs text-muted-foreground">Cleaning, last 24 h</span>
      <ul className="flex flex-col gap-3">
        {rows.map((row) => (
          <li key={row.label} className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-col">
              <span className="text-sm text-base-foreground">{row.label}</span>
              <span className="text-xs text-muted-foreground">{row.note}</span>
            </div>
            <ValueReadout size="sm" value={row.count} tone={row.tone} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function DataQualitySla() {
  return (
    <Card className="w-full max-w-64 gap-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">Freshness SLA, March</span>
        <StatusIndicator size="sm" tone="warning" shape="square" label="At risk" />
      </div>
      <ValueReadout value={99.21} unit="%" decimals={2} tone="warning" />
      <LinearGauge label="Time within freshness SLA this month" value={99.21} min={98} max={100} target={99.5} unit="%" decimals={2} size="sm" tone="warning" showHeader={false} />
      <span className="text-xs text-muted-foreground tabular-nums">Target 99.50 % · 2 h 12 min of 3 h 43 min budget used</span>
    </Card>
  );
}

function DataQualityDataSetCard() {
  const dataSet = DATA_SETS[2];
  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardHeaderCenter>
          <CardTitle>{dataSet.name}</CardTitle>
          <CardDescription>Work orders, notifications and operations from SAP PM</CardDescription>
        </CardHeaderCenter>
        <CardHeaderEnd>
          <StatusIndicator variant="badge" tone="critical" label="Stale" />
        </CardHeaderEnd>
      </CardHeader>
      <CardContent>
        <div className="grid w-full grid-cols-3 gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Quality score</span>
            <ValueReadout size="md" value={dataSet.score} tone={scoreTone(dataSet.score)} />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Last update</span>
            <ValueReadout size="md" value={3.2} unit="h ago" decimals={1} tone="warning" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Records</span>
            <ValueReadout size="md" value={47_902} />
          </div>
        </div>
        <MetadataList
          items={[
            { label: 'Owner', value: 'Magnus Solberg' },
            { label: 'Pipelines', value: '2 · 1 failing' },
            { label: 'Linked to assets', value: '96 %' },
            { label: 'Next run', value: formatTime(PIPELINES[2].nextRunAt ?? REFERENCE_NOW) },
          ]}
        />
      </CardContent>
    </Card>
  );
}

function DataQualityIssueList() {
  return (
    <div className="flex w-full max-w-lg flex-col gap-2">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-sm font-medium text-base-foreground">Open data issues</span>
        <span className="text-xs text-muted-foreground tabular-nums">{ISSUES.length} open · most severe first</span>
      </div>
      <ul className="flex flex-col divide-y divide-default">
        {ISSUES.map((issue) => (
          <li key={issue.id} className="grid grid-cols-[4.5rem_minmax(0,1fr)_auto] items-baseline gap-3 py-2">
            <StatusIndicator size="sm" tone={issue.tone} shape={issue.shape} label={issue.label} />
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm text-base-foreground">{issue.title}</span>
              <span className="truncate font-mono text-xs text-muted-foreground">{issue.scope}</span>
            </div>
            <span className="text-xs text-muted-foreground tabular-nums">{ageOf(issue.since)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DataQualityPipelineTable() {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-4xl border-collapse text-sm">
        <thead>
          <tr>
            <th scope="col" className={TH}>
              Pipeline
            </th>
            <th scope="col" className={TH}>
              Last run
            </th>
            <th scope="col" className={`${TH} text-right`}>
              Started
            </th>
            <th scope="col" className={`${TH} text-right`}>
              Duration
            </th>
            <th scope="col" className={`${TH} text-right`}>
              Rows
            </th>
            <th scope="col" className={TH}>
              Last 14 runs
            </th>
            <th scope="col" className={TH}>
              Schedule
            </th>
            <th scope="col" className={`${TH} text-right`}>
              Next run
            </th>
          </tr>
        </thead>
        <tbody>
          {PIPELINES.map((pipeline) => (
            <tr key={pipeline.id} className="border-t border-default">
              <td className={TD}>
                <PipelineName pipeline={pipeline} />
              </td>
              <td className={TD}>
                <StatusIndicator size="sm" {...RUN_STATUS[pipeline.status]} />
              </td>
              <td className={`${TD} text-right whitespace-nowrap text-muted-foreground tabular-nums`}>{formatTime(pipeline.startedAt)}</td>
              <td className={`${TD} text-right whitespace-nowrap text-muted-foreground tabular-nums`}>
                {pipeline.durationMs === null ? '—' : formatDuration(pipeline.durationMs)}
              </td>
              <td className={`${TD} text-right text-base-foreground tabular-nums`}>{formatRows(pipeline.rows)}</td>
              <td className={TD}>
                <RunHistoryStrip size="sm" label={`${pipeline.id}, last ${pipeline.history.length} runs`} runs={pipeline.history} />
              </td>
              <td className={`${TD} whitespace-nowrap text-muted-foreground`}>{pipeline.schedule}</td>
              <td className={`${TD} text-right whitespace-nowrap text-base-foreground tabular-nums`}>{pipeline.nextRunAt === null ? '—' : formatTime(pipeline.nextRunAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DataQualityOverview() {
  const failing = PIPELINES.filter((pipeline) => pipeline.status === 'failed').length;
  return (
    <Card className="w-full">
      <CardHeader>
        <CardHeaderCenter>
          <CardTitle>Data health, Nordkapp</CardTitle>
          <CardDescription>
            {SOURCES.length} sources · {PIPELINES.length} pipelines · checked {formatTime(REFERENCE_NOW)}
          </CardDescription>
        </CardHeaderCenter>
        <CardHeaderEnd>
          <StatusIndicator variant="badge" tone="warning" label={`${failing} pipeline failing`} />
        </CardHeaderEnd>
      </CardHeader>
      <CardContent>
        <div className="grid w-full grid-cols-2 gap-x-8 gap-y-4 lg:grid-cols-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Tag coverage, 24 h</span>
            <ValueReadout value={96.8} unit="%" decimals={1} />
            <span className="text-xs text-muted-foreground">Target 99 %</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Median latency</span>
            <ValueReadout value={1.4} unit="s" decimals={1} />
            <span className="text-xs text-muted-foreground tabular-nums">p95 8.2 s</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Oldest source</span>
            <ValueReadout value={3.2} unit="h" decimals={1} tone="warning" />
            <span className="text-xs text-muted-foreground">SAP, expected every 30 min</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Freshness SLA, March</span>
            <ValueReadout value={99.21} unit="%" decimals={2} tone="warning" />
            <span className="text-xs text-muted-foreground tabular-nums">Target 99.50 %</span>
          </div>
        </div>
        <div className="grid w-full grid-cols-1 gap-x-8 gap-y-4 border-t border-default pt-4 lg:grid-cols-2">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-muted-foreground">Sources</span>
            <ul className="flex flex-col gap-2">
              {SOURCES.map((item) => (
                <li key={item.id} className="grid grid-cols-[minmax(0,1fr)_5.5rem_6rem] items-center gap-3">
                  <span className="truncate text-sm text-base-foreground">{item.name}</span>
                  <StatusIndicator size="sm" {...item.status} />
                  <span className="text-right text-xs text-muted-foreground tabular-nums">{ageOf(item.lastSeen)} ago</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-muted-foreground">Pipelines, last 14 runs</span>
            <ul className="flex flex-col gap-2">
              {PIPELINES.slice(0, 4).map((pipeline) => (
                <li key={pipeline.id} className="flex items-center justify-between gap-3">
                  <span className="truncate font-mono text-xs text-base-foreground">{pipeline.id}</span>
                  <RunHistoryStrip size="sm" label={`${pipeline.id}, last ${pipeline.history.length} runs`} runs={pipeline.history} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default definePage({
  id: 'data-quality',
  title: 'Data quality',
  summary:
    'Whether the data behind a screen can be trusted: how fresh it is, how much of it arrived, which pipelines ran, and where the gaps are. Healthy data stays quiet; only what is late, missing or failing takes colour.',
  guidance: {
    use: [
      'State freshness as an age against what is expected, not as a bare timestamp.',
      'Show coverage and completeness as a share with the counts behind it.',
      'Give a failed run its cause in plain words, the raw error, and a retry beside it.',
      'Name every status in words; run squares carry a cross or dash as well as colour.',
    ],
    avoid: [
      'A green wall of healthy pipelines — success is the quiet default.',
      'A percentage without its denominator.',
      'Hiding skipped runs; say they were skipped and why.',
      'Charts of data health with no accessible summary of what they show.',
    ],
  },
  source,
  sections: [
    {
      id: 'freshness',
      title: 'Freshness and coverage',
      description: 'How old the data is and how much of what was expected has arrived.',
      specimens: [
        {
          id: 'DataQualityFreshnessTile',
          title: 'Freshness tile',
          note: 'Pick it to answer "how old is this data": the age leads, judged against the expected interval.',
          origin: 'custom',
          uses: ['industrial/StatusIndicator.tsx', 'industrial/workflows/workflow.ts'],
          align: 'stretch',
          Component: DataQualityFreshnessTile,
        },
        {
          id: 'DataQualityFreshnessStale',
          title: 'Freshness tile, stale',
          note: 'Pick the same tile when the age exceeds the interval: the number and the state turn amber.',
          origin: 'custom',
          uses: ['industrial/StatusIndicator.tsx', 'industrial/workflows/workflow.ts'],
          align: 'stretch',
          Component: DataQualityFreshnessStale,
        },
        {
          id: 'DataQualityCoverage',
          title: 'Coverage with bar',
          note: 'Pick it for a share of a whole: percent, a bar with the target mark, and the counts behind it.',
          origin: 'custom',
          uses: ['industrial/LinearGauge.tsx', 'industrial/ValueReadout.tsx'],
          align: 'stretch',
          Component: DataQualityCoverage,
        },
        {
          id: 'DataQualityFreshnessList',
          title: 'Freshness by source',
          note: 'Pick it to compare sources with different rhythms: each age is judged against its own interval.',
          origin: 'custom',
          uses: ['industrial/StatusIndicator.tsx', 'industrial/workflows/workflow.ts'],
          size: 'md',
          align: 'stretch',
          Component: DataQualityFreshnessList,
        },
        {
          id: 'DataQualityCompleteness',
          title: 'Completeness by source',
          note: 'Pick it to show how much of the expected data arrived from each source, with what is missing in numbers.',
          origin: 'custom',
          uses: ['industrial/LinearGauge.tsx', 'industrial/status.ts'],
          size: 'md',
          align: 'stretch',
          Component: DataQualityCompleteness,
        },
        {
          id: 'DataQualityScore',
          title: 'Quality score per data set',
          note: 'Pick it to rank data sets: one score each, the main issue beneath, colour only below the threshold.',
          origin: 'custom',
          uses: ['industrial/LinearGauge.tsx', 'industrial/ValueReadout.tsx'],
          size: 'md',
          align: 'stretch',
          Component: DataQualityScore,
        },
        {
          id: 'DataQualityContextualisation',
          title: 'Contextualisation coverage',
          note: 'Pick it to show how connected the data is: the share of assets linked to time series, documents and more.',
          origin: 'custom',
          uses: ['industrial/LinearGauge.tsx', 'industrial/status.ts'],
          size: 'md',
          align: 'stretch',
          Component: DataQualityContextualisation,
        },
      ],
    },
    {
      id: 'pipelines',
      title: 'Pipelines and runs',
      description: 'Extractors and transformations: the latest run, the history, the schedule and the path the data takes.',
      specimens: [
        {
          id: 'DataQualityRunStates',
          title: 'Run states',
          note: 'Pick these four words and shapes for every run, so a state reads the same in a row, a table and a card.',
          origin: 'custom',
          uses: ['industrial/StatusIndicator.tsx'],
          Component: DataQualityRunStates,
        },
        {
          id: 'DataQualityRunRow',
          title: 'Pipeline run rows',
          note: 'Pick it as the default line for a pipeline: kind and source, status, duration, rows and how long ago.',
          origin: 'custom',
          uses: ['industrial/StatusIndicator.tsx', 'industrial/workflows/workflow.ts'],
          size: 'lg',
          align: 'stretch',
          Component: DataQualityRunRow,
        },
        {
          id: 'DataQualityRunHistory',
          title: 'Run history strip',
          note: 'Pick it to show reliability at a glance: the last 14 runs as squares, failures and skips marked by a glyph.',
          origin: 'custom',
          uses: ['industrial/workflows/RunHistoryStrip.tsx', 'industrial/workflows/workflow.ts'],
          size: 'md',
          align: 'stretch',
          Component: DataQualityRunHistory,
        },
        {
          id: 'DataQualityFailedRun',
          title: 'Failed run detail',
          note: 'Pick it when someone opens a failed run: what went wrong in plain words, the raw error, and retry. Click retry to try.',
          origin: 'custom',
          uses: ['industrial/StatusIndicator.tsx'],
          size: 'md',
          align: 'stretch',
          Component: DataQualityFailedRun,
        },
        {
          id: 'DataQualitySchedule',
          title: 'Schedule and next run',
          note: 'Pick it to answer "when will this update": the schedule in words, the next run as a time and a countdown.',
          origin: 'custom',
          uses: ['industrial/workflows/workflow.ts'],
          size: 'md',
          align: 'stretch',
          Component: DataQualitySchedule,
        },
        {
          id: 'DataQualitySourceStatus',
          title: 'Data source status',
          note: 'Pick it for the systems behind the pipelines: OPC UA, PI, SAP and others, each with its connection state.',
          origin: 'custom',
          uses: ['industrial/StatusIndicator.tsx'],
          size: 'md',
          align: 'stretch',
          Component: DataQualitySourceStatus,
        },
        {
          id: 'DataQualityLineage',
          title: 'Lineage row',
          note: 'Pick it to trace a problem upstream: source, staged, transformed and data model, with the state at each hop.',
          origin: 'custom',
          uses: ['industrial/StatusIndicator.tsx'],
          size: 'full',
          align: 'stretch',
          Component: DataQualityLineage,
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
          note: 'Pick it for one time series: a bar with holes where data is missing, and coverage in numbers.',
          origin: 'custom',
          uses: ['industrial/workflows/GapTimeline.tsx', 'industrial/workflows/TagChip.tsx'],
          size: 'md',
          align: 'stretch',
          Component: DataQualityGapTimeline,
        },
        {
          id: 'DataQualityGapList',
          title: 'Gaps across tags',
          note: 'Pick it to see whether gaps line up across tags, which points at a shared cause upstream.',
          origin: 'custom',
          uses: ['industrial/workflows/GapTimeline.tsx', 'industrial/workflows/workflow.ts'],
          size: 'md',
          align: 'stretch',
          Component: DataQualityGapList,
        },
        {
          id: 'DataQualityLatency',
          title: 'Latency distribution',
          note: 'Pick it when the median hides a slow tail: the share of data points per latency bucket.',
          origin: 'custom',
          uses: ['industrial/ValueReadout.tsx'],
          align: 'stretch',
          Component: DataQualityLatency,
        },
        {
          id: 'DataQualityDuplicates',
          title: 'Duplicate and outlier counts',
          note: 'Pick it to show what cleaning did: counts with what happened to them, coloured only if someone must look.',
          origin: 'custom',
          uses: ['industrial/ValueReadout.tsx'],
          align: 'stretch',
          Component: DataQualityDuplicates,
        },
        {
          id: 'DataQualitySla',
          title: 'SLA status',
          note: 'Pick it for a service level: attainment against the target on a zoomed scale, and the error budget used.',
          origin: 'custom',
          uses: ['industrial/LinearGauge.tsx', 'industrial/ValueReadout.tsx', 'industrial/StatusIndicator.tsx'],
          align: 'stretch',
          Component: DataQualitySla,
        },
      ],
    },
    {
      id: 'summaries',
      title: 'Summaries',
      description: 'A data set card, an issue list, the pipeline register and a data health overview.',
      specimens: [
        {
          id: 'DataQualityDataSetCard',
          title: 'Data set summary card',
          note: 'Pick it in a catalogue of data sets: score, freshness and size up top, ownership and pipelines beneath.',
          origin: 'custom',
          uses: ['display/MetadataList.tsx', 'industrial/ValueReadout.tsx', 'industrial/StatusIndicator.tsx'],
          size: 'md',
          align: 'stretch',
          Component: DataQualityDataSetCard,
        },
        {
          id: 'DataQualityIssueList',
          title: 'Open data issues',
          note: 'Pick it as the to-do list for data owners: most severe first, with what is affected and for how long.',
          origin: 'custom',
          uses: ['industrial/StatusIndicator.tsx', 'industrial/workflows/workflow.ts'],
          size: 'md',
          align: 'stretch',
          Component: DataQualityIssueList,
        },
        {
          id: 'DataQualityPipelineTable',
          title: 'Pipeline table',
          note: 'Pick it as the register of pipelines: last run, duration, rows, 14-run history, schedule and next run.',
          origin: 'custom',
          uses: ['industrial/workflows/RunHistoryStrip.tsx', 'industrial/StatusIndicator.tsx', 'industrial/workflows/workflow.ts'],
          size: 'full',
          align: 'stretch',
          Component: DataQualityPipelineTable,
        },
        {
          id: 'DataQualityOverview',
          title: 'Data health overview',
          note: 'Pick it as the landing block for data health: four headline figures, then sources and pipeline history.',
          origin: 'custom',
          uses: ['industrial/workflows/RunHistoryStrip.tsx', 'industrial/StatusIndicator.tsx', 'industrial/ValueReadout.tsx', 'industrial/workflows/workflow.ts'],
          size: 'full',
          align: 'stretch',
          Component: DataQualityOverview,
        },
      ],
    },
  ],
});
