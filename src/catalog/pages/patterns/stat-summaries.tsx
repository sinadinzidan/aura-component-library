import { Button } from '@cognite/aura/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardHeaderCenter, CardHeaderEnd, CardTitle } from '@cognite/aura/components/card';
import { Progress } from '@cognite/aura/components/progress';
import { Skeleton } from '@cognite/aura/components/skeleton';
import { IconArrowRight, IconClock, IconRefresh } from '@cognite/aura/icons';

import { PersonAvatar } from '../../../library/display/PersonAvatar';
import { Sparkline } from '../../../library/industrial/Sparkline';
import { TONE_MARK_BG, formatValue, runStateStatus, severityStatus } from '../../../library/industrial/status';
import type { Tone } from '../../../library/industrial/status';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { TrendDelta } from '../../../library/industrial/TrendDelta';
import { BreakdownList } from '../../../library/patterns/collections/BreakdownList';
import { DataTable } from '../../../library/patterns/collections/DataTable';
import type { DataTableColumn } from '../../../library/patterns/collections/DataTable';
import { DistributionStrip } from '../../../library/patterns/collections/DistributionStrip';
import { IconAction } from '../../../library/patterns/collections/IconAction';
import { StatRow } from '../../../library/patterns/collections/StatRow';
import { ALARMS, ASSETS, PEOPLE, PLANT_KPIS, WORK_ORDERS } from '../../data/plant';
import type { RunState, Severity } from '../../data/plant';
import { makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './stat-summaries.tsx?raw';

const STAT_SUMMARY_EQUIPMENT = ASSETS.filter((asset) => !['site', 'area', 'system'].includes(asset.type));
const STAT_SUMMARY_RUN_STATES: readonly RunState[] = ['running', 'standby', 'maintenance', 'tripped', 'stopped'];
const STAT_SUMMARY_SEVERITIES: readonly Severity[] = ['critical', 'high', 'medium', 'low'];

const STAT_SUMMARY_AVAILABILITY = makeValues({ seed: 41, points: 30, base: 96.8, amplitude: 0.6, noise: 0.25, drift: -0.4, max: 100 });
const STAT_SUMMARY_EXPORT = makeValues({ seed: 31, points: 30, base: 4.3, amplitude: 0.12, noise: 0.04, drift: 0.15, decimals: 2 });
const STAT_SUMMARY_FLARING = makeValues({ seed: 43, points: 30, base: 16, amplitude: 2, noise: 0.8, drift: -5 });

const STAT_SUMMARY_ALARMS_BY_AREA = [
  { id: 'nk-23', label: 'Gas compression', value: 64 },
  { id: 'nk-20', label: 'Inlet and separation', value: 27 },
  { id: 'nk-27', label: 'Gas export', value: 19 },
  { id: 'nk-40', label: 'Cooling water', value: 12 },
  { id: 'nk-50', label: 'Utilities', value: 6 },
] as const;

const STAT_SUMMARY_BAD_ACTORS = [
  { id: 'vt-92740', label: 'Recompressor vibration', detail: '23-VT-92740', value: 38 },
  { id: 'tt-92532', label: 'Discharge temperature', detail: '23-TT-92532', value: 21 },
  { id: 'lt-10012', label: 'Separator level', detail: '20-LT-10012', value: 14 },
  { id: 'tt-91141', label: 'Cooler outlet temperature', detail: '23-TT-91141', value: 11 },
  { id: 'it-20013', label: 'Motor current', detail: '27-IT-20013', value: 9 },
  { id: 'pt-10010', label: 'Separator pressure', detail: '20-PT-10010', value: 4 },
] as const;

const STAT_SUMMARY_COMPLETED = [
  { personId: 'tb', done: 14, hours: 61 },
  { personId: 'jn', done: 11, hours: 38 },
  { personId: 'ak', done: 7, hours: 44 },
  { personId: 'ms', done: 5, hours: 22 },
] as const;

const STAT_SUMMARY_FUNNEL = [
  { id: 'raised', label: 'Alarms raised', value: 128 },
  { id: 'acknowledged', label: 'Acknowledged in time', value: 112 },
  { id: 'investigated', label: 'Investigated', value: 46 },
  { id: 'orders', label: 'Work order created', value: 31 },
  { id: 'closed', label: 'Work order completed', value: 24 },
] as const;

/** One day of the last 30: neutral when all was well, toned on the days with an incident. */
const STAT_SUMMARY_DAYS: readonly Tone[] = Array.from({ length: 30 }, (_, day): Tone =>
  day === 17 ? 'critical' : day === 6 || day === 18 ? 'warning' : 'neutral'
);

function statSummaryCount(state: RunState): number {
  return STAT_SUMMARY_EQUIPMENT.filter((asset) => asset.state === state).length;
}

function StatSummaryRowThree() {
  return (
    <StatRow
      label="Maintenance summary"
      stats={[
        { id: 'open', label: 'Open work orders', value: PLANT_KPIS.openWorkOrders.value },
        { id: 'overdue', label: 'Overdue', value: 3 },
        { id: 'done', label: 'Completed this week', value: 37 },
      ]}
    />
  );
}

function StatSummaryRowWithDetail() {
  const { availability, activeAlarms, mtbf } = PLANT_KPIS;

  return (
    <StatRow
      label="Plant summary with targets"
      stats={[
        { id: 'availability', label: 'Availability', value: availability.value, unit: '%', detail: `Target ${availability.target} %` },
        { id: 'alarms', label: 'Active alarms', value: activeAlarms.value, detail: '1 critical' },
        { id: 'mtbf', label: 'MTBF', value: mtbf.value, unit: 'h', detail: `Target ${mtbf.target} h` },
      ]}
    />
  );
}

function StatSummaryRowFive() {
  const { availability, oee, gasExport, energyIntensity, flaring } = PLANT_KPIS;

  return (
    <StatRow
      label="Production summary, last 24 hours"
      size="large"
      stats={[
        {
          id: 'availability',
          label: 'Availability',
          value: availability.value,
          unit: '%',
          detail: <TrendDelta value={availability.value} reference={availability.previous} goodDirection="up" caption="vs yesterday" />,
        },
        {
          id: 'oee',
          label: 'OEE',
          value: oee.value,
          unit: '%',
          detail: <TrendDelta value={oee.value} reference={oee.previous} goodDirection="up" caption="vs yesterday" />,
        },
        {
          id: 'export',
          label: 'Gas export',
          value: gasExport.value.toFixed(2),
          unit: gasExport.unit,
          detail: <TrendDelta value={gasExport.value} reference={gasExport.previous} decimals={2} goodDirection="up" caption="vs yesterday" />,
        },
        {
          id: 'energy',
          label: 'Energy intensity',
          value: energyIntensity.value,
          unit: energyIntensity.unit,
          detail: <TrendDelta value={energyIntensity.value} reference={energyIntensity.previous} goodDirection="down" caption="vs yesterday" />,
        },
        {
          id: 'flaring',
          label: 'Flaring',
          value: flaring.value,
          unit: flaring.unit,
          detail: <TrendDelta value={flaring.value} reference={flaring.previous} goodDirection="down" caption="vs yesterday" />,
        },
      ]}
    />
  );
}

function StatSummaryDeltaPeriod() {
  const kpi = PLANT_KPIS.openWorkOrders;

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">Open work orders</span>
      <span className="text-3xl font-semibold tabular-nums text-base-foreground">{kpi.value}</span>
      <TrendDelta value={kpi.value} reference={kpi.previous} decimals={0} goodDirection="down" caption="vs last week" />
      <span className="text-xs text-muted-foreground">6–12 March</span>
    </div>
  );
}

function StatSummaryWithSparkline() {
  const kpi = PLANT_KPIS.gasExport;

  return (
    <div className="flex w-full max-w-xs flex-col gap-2">
      <span className="text-xs text-muted-foreground">Gas export, last 30 days</span>
      <div className="flex items-end justify-between gap-4">
        <span className="text-3xl font-semibold tabular-nums text-base-foreground">
          {kpi.value.toFixed(2)}
          <span className="ml-1 text-sm font-normal text-muted-foreground">{kpi.unit}</span>
        </span>
        <Sparkline values={STAT_SUMMARY_EXPORT} label="Gas export, last 30 days" unit={kpi.unit} decimals={2} width={112} height={36} showLast />
      </div>
    </div>
  );
}

function StatSummaryTarget() {
  const kpi = PLANT_KPIS.daysSinceIncident;

  return (
    <div className="flex w-full max-w-xs flex-col gap-2">
      <span className="text-xs text-muted-foreground">Days since last recordable incident</span>
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-3xl font-semibold tabular-nums text-base-foreground">{kpi.value}</span>
        <span className="text-xs tabular-nums text-muted-foreground">Target {kpi.target}</span>
      </div>
      <Progress value={kpi.value} max={kpi.target} aria-label={`${kpi.value} of ${kpi.target} days`} />
      <span className="text-xs tabular-nums text-muted-foreground">
        {Math.round((kpi.value / kpi.target) * 100)}% of the way · {kpi.target - kpi.value} days to go
      </span>
    </div>
  );
}

function StatSummaryHero() {
  const kpi = PLANT_KPIS.availability;

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-1">
        <span className="text-sm text-muted-foreground">Plant availability, March to date</span>
        <span className="text-6xl font-semibold tracking-tight tabular-nums text-base-foreground">
          {kpi.value}
          <span className="ml-1 text-2xl font-normal text-muted-foreground">%</span>
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <TrendDelta value={kpi.value} reference={kpi.previous} goodDirection="up" caption="vs February" size="md" />
        <TrendDelta value={kpi.value} reference={kpi.target} goodDirection="up" caption={`vs target ${kpi.target} %`} size="md" />
      </div>
      <Sparkline
        values={STAT_SUMMARY_AVAILABILITY}
        label="Availability, last 30 days"
        unit="%"
        height={56}
        variant="area"
        limit={kpi.target}
        limitTone="neutral"
      />
    </div>
  );
}

function StatSummaryThisVsLast() {
  const rows = [
    { label: 'Gas export', unit: 'MSm³/d', now: PLANT_KPIS.gasExport.value, before: PLANT_KPIS.gasExport.previous, decimals: 2, good: 'up' },
    { label: 'Availability', unit: '%', now: PLANT_KPIS.availability.value, before: PLANT_KPIS.availability.previous, decimals: 1, good: 'up' },
    { label: 'Flaring', unit: 'kSm³/d', now: PLANT_KPIS.flaring.value, before: PLANT_KPIS.flaring.previous, decimals: 1, good: 'down' },
    { label: 'Active alarms', unit: '', now: PLANT_KPIS.activeAlarms.value, before: PLANT_KPIS.activeAlarms.previous, decimals: 0, good: 'down' },
  ] as const;

  return (
    <table aria-label="This week against last week" className="w-full text-sm">
      <thead>
        <tr className="border-b border-default text-xs text-muted-foreground">
          <th scope="col" className="py-2 text-left font-medium">
            Measure
          </th>
          <th scope="col" className="py-2 text-right font-medium">
            This week
          </th>
          <th scope="col" className="py-2 text-right font-medium">
            Last week
          </th>
          <th scope="col" className="py-2 text-right font-medium">
            Change
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.label} className="border-b border-default last:border-b-0">
            <th scope="row" className="py-2.5 text-left font-normal text-medium-foreground">
              {row.label}
              {row.unit ? <span className="ml-1.5 text-xs text-muted-foreground">{row.unit}</span> : null}
            </th>
            <td className="py-2.5 text-right font-semibold tabular-nums text-base-foreground">{formatValue(row.now, row.decimals)}</td>
            <td className="py-2.5 text-right tabular-nums text-muted-foreground">{formatValue(row.before, row.decimals)}</td>
            <td className="py-2.5 text-right">
              <TrendDelta value={row.now} reference={row.before} format="percent" goodDirection={row.good} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function StatSummaryGridInCard() {
  const cells = [
    { label: 'Availability', value: PLANT_KPIS.availability.value, unit: '%' },
    { label: 'OEE', value: PLANT_KPIS.oee.value, unit: '%' },
    { label: 'MTBF', value: PLANT_KPIS.mtbf.value, unit: 'h' },
    { label: 'Open work orders', value: PLANT_KPIS.openWorkOrders.value, unit: '' },
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardHeaderCenter>
          <CardTitle>Reliability</CardTitle>
          <CardDescription>Nordkapp, last 30 days</CardDescription>
        </CardHeaderCenter>
        <CardHeaderEnd>
          <Button variant="ghost" size="sm">
            Details <IconArrowRight />
          </Button>
        </CardHeaderEnd>
      </CardHeader>
      <CardContent>
        <dl className="grid w-full grid-cols-2 gap-x-6 gap-y-4">
          {cells.map((cell) => (
            <div key={cell.label} className="flex flex-col gap-1">
              <dt className="text-xs text-muted-foreground">{cell.label}</dt>
              <dd className="text-2xl font-semibold tabular-nums text-base-foreground">
                {cell.value}
                {cell.unit ? <span className="ml-1 text-sm font-normal text-muted-foreground">{cell.unit}</span> : null}
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

function StatSummaryRowInCard() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardHeaderCenter>
          <CardTitle>Alarm load</CardTitle>
          <CardDescription>Control room, day shift</CardDescription>
        </CardHeaderCenter>
      </CardHeader>
      <CardContent>
        <StatRow
          label="Alarm load, day shift"
          stats={[
            { id: 'rate', label: 'Alarms per hour', value: '5.3', detail: 'Guideline: under 6' },
            { id: 'standing', label: 'Standing alarms', value: 4, detail: '1 older than 24 h' },
            { id: 'shelved', label: 'Shelved', value: 1, detail: 'Returns 17:00' },
          ]}
        />
      </CardContent>
    </Card>
  );
}

function StatSummaryBreakdown() {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-medium text-base-foreground">Alarms by area</h3>
        <span className="text-xs tabular-nums text-muted-foreground">128 in the last 7 days</span>
      </div>
      <BreakdownList label="Alarms by area, last 7 days" items={STAT_SUMMARY_ALARMS_BY_AREA} scale="total" showShare />
    </div>
  );
}

function StatSummaryRanked() {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-medium text-base-foreground">Top 5 alarm sources</h3>
        <span className="text-xs text-muted-foreground">Last 7 days</span>
      </div>
      <BreakdownList label="Top 5 alarm sources, last 7 days" items={STAT_SUMMARY_BAD_ACTORS} ranked limit={5} />
    </div>
  );
}

function StatSummaryDistribution() {
  const types = [
    { id: 'corrective', label: 'Corrective', value: 9 },
    { id: 'preventive', label: 'Preventive', value: 8 },
    { id: 'inspection', label: 'Inspection', value: 4 },
    { id: 'modification', label: 'Modification', value: 2 },
  ];

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">Open work orders by type</span>
        <span className="text-2xl font-semibold tabular-nums text-base-foreground">{PLANT_KPIS.openWorkOrders.value}</span>
      </div>
      <DistributionStrip label="Open work orders by type" segments={types} />
    </div>
  );
}

function StatSummarySeverityStrip() {
  const segments = STAT_SUMMARY_SEVERITIES.map((severity) => ({
    id: severity,
    label: severityStatus(severity).label,
    value: ALARMS.filter((alarm) => alarm.severity === severity && alarm.state !== 'cleared').length,
    tone: severityStatus(severity).tone,
  }));

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">Open alarms by severity</span>
        <span className="text-2xl font-semibold tabular-nums text-base-foreground">
          {segments.reduce((sum, segment) => sum + segment.value, 0)}
        </span>
      </div>
      <DistributionStrip label="Open alarms by severity" segments={segments} />
    </div>
  );
}

function StatSummaryStatusCounts() {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-medium text-base-foreground">Equipment by state</h3>
        <span className="text-xs tabular-nums text-muted-foreground">{STAT_SUMMARY_EQUIPMENT.length} units</span>
      </div>
      <dl className="grid w-full auto-cols-fr grid-flow-col gap-4">
        {STAT_SUMMARY_RUN_STATES.map((state) => (
          <div key={state} className="flex flex-col gap-1">
            <dd className="text-2xl font-semibold tabular-nums text-base-foreground">{statSummaryCount(state)}</dd>
            <dt>
              <StatusIndicator {...runStateStatus(state)} size="sm" />
            </dt>
          </div>
        ))}
      </dl>
      <DistributionStrip
        label="Equipment by state"
        legend="none"
        size="sm"
        segments={STAT_SUMMARY_RUN_STATES.map((state) => ({
          id: state,
          label: runStateStatus(state).label,
          value: statSummaryCount(state),
          tone: runStateStatus(state).tone,
        }))}
      />
    </div>
  );
}

function StatSummaryUptime() {
  const incidents = STAT_SUMMARY_DAYS.filter((tone) => tone !== 'neutral').length;

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Data pipeline uptime, last 30 days</span>
          <span className="text-2xl font-semibold tabular-nums text-base-foreground">
            99.21<span className="ml-1 text-sm font-normal text-muted-foreground">%</span>
          </span>
        </div>
        <span className="text-xs tabular-nums text-muted-foreground">SLA 99.0 % · 5 h 41 min down</span>
      </div>
      <div
        role="img"
        aria-label={`Uptime per day, last 30 days: ${incidents} days with incidents`}
        className="flex h-8 w-full items-stretch gap-0.5"
      >
        {STAT_SUMMARY_DAYS.map((tone, index) => (
          <span key={index} className={`flex-1 rounded-xs ${tone === 'neutral' ? 'bg-chart-neutral-300' : TONE_MARK_BG[tone]}`} />
        ))}
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>11 Feb</span>
        <span className="flex items-center gap-4">
          <StatusIndicator tone="warning" shape="square" label="Degraded" size="sm" />
          <StatusIndicator tone="critical" shape="diamond" label="Outage" size="sm" />
        </span>
        <span>12 Mar</span>
      </div>
    </div>
  );
}

function StatSummaryLeaderboard() {
  const top = STAT_SUMMARY_COMPLETED[0].done;

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-medium text-base-foreground">Work orders completed</h3>
        <span className="text-xs text-muted-foreground">This month</span>
      </div>
      <ol aria-label="Work orders completed this month, by technician" className="flex flex-col gap-3">
        {STAT_SUMMARY_COMPLETED.map((entry, index) => {
          const person = PEOPLE.find((candidate) => candidate.id === entry.personId);
          if (!person) return null;
          return (
            <li key={entry.personId} className="grid grid-cols-[auto_auto_minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-3">
              <span className="w-4 text-xs tabular-nums text-muted-foreground">{index + 1}</span>
              <PersonAvatar name={person.name} initials={person.initials} sizes="xsm" />
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-sm text-base-foreground">{person.name}</span>
                <span className="truncate text-xs text-muted-foreground">{entry.hours} h logged</span>
              </span>
              <span aria-hidden="true" className="block h-1.5 overflow-hidden rounded-full bg-muted-background">
                <span className="block h-full rounded-full bg-chart-1-450" style={{ width: `${(entry.done / top) * 100}%` }} />
              </span>
              <span className="w-6 text-right text-sm font-medium tabular-nums text-base-foreground">{entry.done}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function StatSummaryFunnel() {
  const first = STAT_SUMMARY_FUNNEL[0].value;

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-medium text-base-foreground">From alarm to completed work</h3>
        <span className="text-xs text-muted-foreground">Last 7 days</span>
      </div>
      <ol aria-label="Alarm follow-up steps, last 7 days" className="flex flex-col gap-2">
        {STAT_SUMMARY_FUNNEL.map((step, index) => {
          const previous = index === 0 ? step.value : STAT_SUMMARY_FUNNEL[index - 1].value;
          return (
            <li key={step.id} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto] items-center gap-3">
              <span className="truncate text-sm text-base-foreground">{step.label}</span>
              <span aria-hidden="true" className="block h-5 overflow-hidden rounded-sm bg-muted-background">
                <span className="block h-full rounded-sm bg-chart-1-300" style={{ width: `${(step.value / first) * 100}%` }} />
              </span>
              <span className="w-8 text-right text-sm font-medium tabular-nums text-base-foreground">{step.value}</span>
              <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">
                {index === 0 ? '' : `${Math.round((step.value / previous) * 100)}%`}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="text-xs text-muted-foreground">Percentages are the share kept from the step before.</p>
    </div>
  );
}

function StatSummaryScorecard() {
  type Row = {
    id: string;
    name: string;
    unit: string;
    value: number;
    target: number;
    previous: number;
    decimals: number;
    good: 'up' | 'down';
    trend: readonly number[];
  };
  const rows: readonly Row[] = [
    { id: 'availability', name: 'Availability', ...PLANT_KPIS.availability, decimals: 1, good: 'up', trend: STAT_SUMMARY_AVAILABILITY },
    { id: 'export', name: 'Gas export', ...PLANT_KPIS.gasExport, decimals: 2, good: 'up', trend: STAT_SUMMARY_EXPORT },
    { id: 'flaring', name: 'Flaring', ...PLANT_KPIS.flaring, decimals: 1, good: 'down', trend: STAT_SUMMARY_FLARING },
    {
      id: 'energy',
      name: 'Energy intensity',
      ...PLANT_KPIS.energyIntensity,
      decimals: 1,
      good: 'down',
      trend: makeValues({ seed: 47, points: 30, base: 32, amplitude: 0.8, noise: 0.3, drift: -1 }),
    },
  ];
  const onTarget = (row: Row) => (row.good === 'up' ? row.value >= row.target : row.value <= row.target);
  const columns: readonly DataTableColumn<Row>[] = [
    {
      id: 'kpi',
      header: 'KPI',
      cell: (row) => (
        <span className="text-base-foreground">
          {row.name} <span className="text-xs text-muted-foreground">{row.unit}</span>
        </span>
      ),
    },
    { id: 'value', header: 'Actual', align: 'end', cell: (row) => <span className="font-semibold text-base-foreground">{formatValue(row.value, row.decimals)}</span> },
    { id: 'target', header: 'Target', align: 'end', cell: (row) => <span className="text-muted-foreground">{formatValue(row.target, row.decimals)}</span> },
    {
      id: 'change',
      header: 'vs last month',
      align: 'end',
      cell: (row) => <TrendDelta value={row.value} reference={row.previous} format="percent" goodDirection={row.good} />,
    },
    {
      id: 'trend',
      header: '30 days',
      width: 'w-32',
      cell: (row) => <Sparkline values={row.trend} label={`${row.name}, last 30 days`} unit={row.unit} decimals={row.decimals} width={104} height={22} />,
    },
    {
      id: 'status',
      header: 'Status',
      cell: (row) =>
        onTarget(row) ? (
          <StatusIndicator tone="neutral" shape="dot" label="On target" size="sm" />
        ) : (
          <StatusIndicator tone="warning" shape="square" label="Off target" size="sm" />
        ),
    },
  ];

  return <DataTable label="Monthly scorecard" columns={columns} rows={rows} getRowId={(row) => row.id} />;
}

function StatSummaryLoading() {
  return (
    <div role="status" aria-label="Loading summary" className="grid w-full auto-cols-fr grid-flow-col gap-6">
      {[0, 1].map((index) => (
        <div key={index} className="flex flex-col gap-2">
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-7 w-1/2" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      ))}
    </div>
  );
}

function StatSummaryNoData() {
  return (
    <StatRow
      label="Night shift summary"
      stats={[
        { id: 'export', label: 'Gas export', value: '—', detail: 'No data yet' },
        { id: 'alarms', label: 'Alarms raised', value: 0, detail: 'None this shift' },
      ]}
    />
  );
}

function StatSummaryStale() {
  return (
    <div className="flex w-full flex-col gap-3">
      <StatRow
        label="Plant summary, last known values"
        stats={[
          { id: 'availability', label: 'Availability', value: PLANT_KPIS.availability.value, unit: '%' },
          { id: 'alarms', label: 'Active alarms', value: PLANT_KPIS.activeAlarms.value },
        ]}
      />
      <div className="flex items-center justify-between gap-3 rounded-lg bg-warning-background px-3 py-1.5 text-xs text-warning-foreground">
        <span className="flex items-center gap-1.5">
          <IconClock aria-hidden="true" className="size-3.5" /> Updated 42 min ago
        </span>
        <IconAction label="Refresh summary">
          <IconRefresh />
        </IconAction>
      </div>
    </div>
  );
}

function StatSummaryWorkload() {
  const open = WORK_ORDERS.filter((order) => order.status !== 'done');
  const hours = open.reduce((sum, order) => sum + order.estimatedHours, 0);
  const byPriority = (['P1', 'P2', 'P3', 'P4'] as const).map((priority) => ({
    id: priority,
    label: priority,
    value: open.filter((order) => order.priority === priority).reduce((sum, order) => sum + order.estimatedHours, 0),
  }));

  return (
    <div className="flex w-full flex-col gap-4">
      <StatRow
        label="Maintenance backlog"
        stats={[
          { id: 'orders', label: 'Backlog', value: open.length, unit: 'orders' },
          { id: 'hours', label: 'Effort', value: hours, unit: 'h' },
        ]}
      />
      <BreakdownList label="Estimated hours by priority" items={byPriority} unit="h" layout="inline" />
    </div>
  );
}

export default definePage({
  id: 'stat-summaries',
  title: 'Stat summaries',
  summary:
    'Numbers at a glance: rows of headline figures, a figure against its past or its target, and how a total breaks down. Figures stay neutral; colour appears only where a change or a state has been judged.',
  guidance: {
    use: [
      'Lead with three to five figures that answer the question the page is opened for.',
      'Give every figure a label, a unit and a period; add a comparison when the number alone means little.',
      'Use one neutral data colour for bars and trends; keep status colour for judged changes and states.',
      'Repeat every chart value in text, in a legend or at the end of its bar.',
    ],
    avoid: [
      'More than five headline figures in a row; that is a table.',
      'Colouring a number just because it is important.',
      'A delta without saying what it is compared with.',
      'Pie charts for more than a few parts; use a breakdown list.',
    ],
  },
  source,
  sections: [
    {
      id: 'rows',
      title: 'Stat rows',
      description: 'Equal columns of headline figures.',
      specimens: [
        {
          id: 'StatSummaryRowThree',
          title: 'Three figures',
          note: 'The smallest summary: three counts with labels, separated by thin rules.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collections/StatRow.tsx'],
          Component: StatSummaryRowThree,
        },
        {
          id: 'StatSummaryRowWithDetail',
          title: 'With units and targets',
          note: 'Add a unit and one line of context when a bare number would raise the question "is that good?".',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collections/StatRow.tsx'],
          Component: StatSummaryRowWithDetail,
        },
        {
          id: 'StatSummaryRowFive',
          title: 'Five figures with deltas',
          note: 'The top of a dashboard: the most figures a row can carry, each with its change since yesterday.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/collections/StatRow.tsx', 'industrial/TrendDelta.tsx'],
          Component: StatSummaryRowFive,
        },
      ],
    },
    {
      id: 'single',
      title: 'Single figures',
      description: 'One number with the context that makes it mean something.',
      specimens: [
        {
          id: 'StatSummaryDeltaPeriod',
          title: 'Delta and period',
          note: 'State the change, what it is compared with and the dates the figure covers.',
          origin: 'custom',
          uses: ['industrial/TrendDelta.tsx'],
          Component: StatSummaryDeltaPeriod,
        },
        {
          id: 'StatSummaryWithSparkline',
          title: 'With sparkline',
          note: 'Add the recent shape when the direction of travel matters as much as the level.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/Sparkline.tsx'],
          Component: StatSummaryWithSparkline,
        },
        {
          id: 'StatSummaryTarget',
          title: 'Target and progress',
          note: 'A figure that counts towards a goal shows the goal and how far there is to go.',
          origin: 'custom',
          align: 'stretch',
          Component: StatSummaryTarget,
        },
        {
          id: 'StatSummaryHero',
          title: 'Big number hero',
          note: 'One figure owns the top of the page, with two comparisons and its trend against target.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/TrendDelta.tsx', 'industrial/Sparkline.tsx'],
          Component: StatSummaryHero,
        },
        {
          id: 'StatSummaryThisVsLast',
          title: 'This period against last',
          note: 'Several measures over two periods, with the change judged by which direction is good.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/TrendDelta.tsx'],
          Component: StatSummaryThisVsLast,
        },
      ],
    },
    {
      id: 'breakdowns',
      title: 'Breakdowns and rankings',
      description: 'How a total splits, and who or what is at the top.',
      specimens: [
        {
          id: 'StatSummaryBreakdown',
          title: 'Breakdown list with bars',
          note: 'Shares of a total by category, with the count and percentage at the end of each bar.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collections/BreakdownList.tsx'],
          Component: StatSummaryBreakdown,
        },
        {
          id: 'StatSummaryRanked',
          title: 'Ranked top five',
          note: 'Largest first, numbered and cut at five, for finding the worst offenders.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collections/BreakdownList.tsx'],
          Component: StatSummaryRanked,
        },
        {
          id: 'StatSummaryDistribution',
          title: 'Distribution strip',
          note: 'One stacked bar and a legend for a total that splits into a handful of categories.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collections/DistributionStrip.tsx'],
          Component: StatSummaryDistribution,
        },
        {
          id: 'StatSummarySeverityStrip',
          title: 'Distribution by severity',
          note: 'The same strip in status colours when the parts are severities or states.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collections/DistributionStrip.tsx'],
          Component: StatSummarySeverityStrip,
        },
        {
          id: 'StatSummaryLeaderboard',
          title: 'Leaderboard',
          note: 'People ranked by one measure, with a second fact under each name.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['display/PersonAvatar.tsx'],
          Component: StatSummaryLeaderboard,
        },
        {
          id: 'StatSummaryFunnel',
          title: 'Step counts',
          note: 'A funnel as plain bars: how many items reach each step and what share was kept.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: StatSummaryFunnel,
        },
      ],
    },
    {
      id: 'operations',
      title: 'Operations summaries',
      description: 'Summaries assembled for states, uptime and scorecards.',
      specimens: [
        {
          id: 'StatSummaryStatusCounts',
          title: 'Status counts',
          note: 'How many units are in each run state, as counts with shaped dots over one strip.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collections/DistributionStrip.tsx', 'industrial/StatusIndicator.tsx'],
          Component: StatSummaryStatusCounts,
        },
        {
          id: 'StatSummaryUptime',
          title: 'Uptime against SLA',
          note: 'The uptime figure, the commitment it is held to, and one cell per day showing when it dipped.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/StatusIndicator.tsx'],
          Component: StatSummaryUptime,
        },
        {
          id: 'StatSummaryGridInCard',
          title: 'Stat grid in a card',
          note: 'Four related figures in a two-by-two grid under one card title.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: StatSummaryGridInCard,
        },
        {
          id: 'StatSummaryRowInCard',
          title: 'Stat row in a card',
          note: 'A titled row of figures as one block of a dashboard.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collections/StatRow.tsx'],
          Component: StatSummaryRowInCard,
        },
        {
          id: 'StatSummaryScorecard',
          title: 'Mini scorecard table',
          note: 'Actual, target, change, trend and verdict per KPI, when figures need comparing line by line.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['patterns/collections/DataTable.tsx', 'industrial/TrendDelta.tsx', 'industrial/Sparkline.tsx', 'industrial/StatusIndicator.tsx'],
          Component: StatSummaryScorecard,
        },
        {
          id: 'StatSummaryWorkload',
          title: 'Figures over a breakdown',
          note: 'Headline figures with the split that explains them directly underneath.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/collections/StatRow.tsx', 'patterns/collections/BreakdownList.tsx'],
          Component: StatSummaryWorkload,
        },
      ],
    },
    {
      id: 'states',
      title: 'States',
      description: 'What a summary shows before, without and after fresh data.',
      specimens: [
        {
          id: 'StatSummaryLoading',
          title: 'Loading',
          note: 'Skeletons in the shape of label, figure and detail, so nothing shifts when numbers arrive.',
          origin: 'custom',
          align: 'stretch',
          Component: StatSummaryLoading,
        },
        {
          id: 'StatSummaryNoData',
          title: 'No data',
          note: 'An em dash and a reason where a figure is missing; a real zero stays a zero.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/collections/StatRow.tsx'],
          Component: StatSummaryNoData,
        },
        {
          id: 'StatSummaryStale',
          title: 'Stale figures',
          note: 'Keep the last known numbers, say how old they are and offer a refresh.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/collections/StatRow.tsx', 'patterns/collections/IconAction.tsx'],
          Component: StatSummaryStale,
        },
      ],
    },
  ],
});
