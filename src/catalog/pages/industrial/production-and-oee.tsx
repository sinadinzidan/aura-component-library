import { Button } from '@cognite/aura/components/button';
import { IconActivity, IconAlertTriangle, IconBolt, IconCircleCheck, IconClock, IconGauge, IconPlayerStop, IconTarget, IconTool } from '@cognite/aura/icons';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { Bars } from '../../../library/kit/Bars';
import { Canvas } from '../../../library/kit/Canvas';
import { DataTable, type DataTableColumn } from '../../../library/kit/DataTable';
import { Grid } from '../../../library/kit/Grid';
import { IconChip } from '../../../library/kit/IconChip';
import { ListRow } from '../../../library/kit/ListRow';
import { Meter } from '../../../library/kit/Meter';
import { Panel } from '../../../library/kit/Panel';
import { LossWaterfall } from '../../../library/kit/production-and-oee/LossWaterfall';
import { oeeOf, stateDuration, type OeeFactor } from '../../../library/kit/production-and-oee/oee';
import { OeeEquation } from '../../../library/kit/production-and-oee/OeeEquation';
import { StateStrip, type StateStripRow } from '../../../library/kit/production-and-oee/StateStrip';
import { RingGauge } from '../../../library/kit/RingGauge';
import { SectionHeader } from '../../../library/kit/SectionHeader';
import { SparkLine } from '../../../library/kit/SparkLine';
import { Stat } from '../../../library/kit/Stat';
import { StatGroup } from '../../../library/kit/StatGroup';
import { StatusPill } from '../../../library/kit/StatusPill';
import { TagId } from '../../../library/kit/TagId';
import type { Tone } from '../../../library/kit/tones';
import { TrendLine } from '../../../library/kit/TrendLine';
import type { LookId } from '../../../library/looks/looks';
import { LookScope } from '../../../library/looks/LookScope';
import { makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './production-and-oee.tsx?raw';

/** Week 11 at Nordkapp. Every OEE figure on this page is derived from these three factors. */
const OEE_FACTORS: OeeFactor[] = [
  { label: 'Availability', value: 93.6, target: 95, tone: 'teal', detail: '10.8 h stopped of 168 h planned' },
  { label: 'Performance', value: 91.2, target: 92, tone: 'blue', detail: '4.34 of 4.76 MSm³/d design rate' },
  { label: 'Quality', value: 96.9, target: 98, tone: 'purple', detail: '0.9 MSm³ off-spec gas recycled' },
];

const OEE_VALUE = oeeOf(OEE_FACTORS);

const OEE_TARGET = 85;

/** Losses in OEE points, in the order they occur. They sum to 100 − OEE. */
const OEE_LOSSES = [
  { label: 'Availability loss', value: 6.4, tone: 'teal' as const },
  { label: 'Performance loss', value: 8.2, tone: 'blue' as const },
  { label: 'Quality loss', value: 2.7, tone: 'purple' as const },
];

const OEE_SIX_LOSSES = [
  { label: 'Reduced rate', value: 5.1 },
  { label: 'Breakdowns', value: 4.3 },
  { label: 'Minor stops', value: 3.1 },
  { label: 'Start-up and adjustment', value: 2.1 },
  { label: 'Off-spec in operation', value: 1.8 },
  { label: 'Off-spec at start-up', value: 0.9 },
];

const OEE_WEEK_TREND = makeValues({ seed: 211, points: 12, base: 82.4, amplitude: 1.6, noise: 0.7, drift: 1.2, decimals: 1 });

const OEE_SHIFTS = ['Night 00–08', 'Day 08–16', 'Evening 16–24'];

const OEE_DAYS = ['Fri 6', 'Sat 7', 'Sun 8', 'Mon 9', 'Tue 10', 'Wed 11', 'Thu 12'];

const OEE_DAILY_EXPORT = [4.52, 4.49, 4.55, 4.47, 4.41, 4.21, 4.38];

const OEE_PLAN = 4.5;

function oeeCumulative(values: readonly number[]): number[] {
  let total = 0;
  return values.map((value) => {
    total += value;
    return Math.round(total * 100) / 100;
  });
}

const OEE_RUNNING: Tone = 'success';

/** Running state on Thursday 12 March until 14:00, in hours of the day. */
const OEE_STATE_ROWS: StateStripRow[] = [
  {
    label: '1st stage compressor',
    detail: '14.0 h running',
    segments: [{ from: 0, to: 14, state: 'Running', tone: OEE_RUNNING }],
  },
  {
    label: '2nd stage compressor',
    detail: '12.5 h running',
    segments: [
      { from: 0, to: 5, state: 'Running', tone: OEE_RUNNING },
      { from: 5, to: 6.5, state: 'Planned stop', tone: 'neutral' },
      { from: 6.5, to: 14, state: 'Running', tone: OEE_RUNNING },
    ],
  },
  {
    label: 'Recompressor',
    detail: '13.1 h running',
    segments: [
      { from: 0, to: 9.2, state: 'Running', tone: OEE_RUNNING },
      { from: 9.2, to: 9.9, state: 'Unplanned stop', tone: 'critical' },
      { from: 9.9, to: 13.77, state: 'Running', tone: OEE_RUNNING },
      { from: 13.77, to: 14, state: 'Unplanned stop', tone: 'critical' },
    ],
  },
  {
    label: 'Export pump A',
    detail: '13.4 h running',
    segments: [
      { from: 0, to: 11, state: 'Running', tone: OEE_RUNNING },
      { from: 11, to: 11.6, state: 'Reduced rate', tone: 'warning' },
      { from: 11.6, to: 14, state: 'Running', tone: OEE_RUNNING },
    ],
  },
];

const OEE_STATE_TICKS = [0, 4, 8, 12, 16, 20, 24].map((hour) => ({ at: hour, label: `${String(hour).padStart(2, '0')}:00` }));

const OEE_STATE_LEGEND = [
  { label: 'Running', tone: 'success' as const },
  { label: 'Reduced rate', tone: 'warning' as const },
  { label: 'Planned stop', tone: 'neutral' as const },
  { label: 'Unplanned stop', tone: 'critical' as const },
];

type OeeStop = { id: string; start: string; unit: string; tag: string; minutes: number; kind: 'Planned' | 'Unplanned'; cause: string | null; lost: number };

const OEE_STOPS: OeeStop[] = [
  { id: 'DT-2291', start: '12 Mar 13:46', unit: 'Recompressor', tag: '23-KA-9103', minutes: 14, kind: 'Unplanned', cause: null, lost: 0.03 },
  { id: 'DT-2290', start: '12 Mar 09:12', unit: 'Recompressor', tag: '23-KA-9103', minutes: 42, kind: 'Unplanned', cause: 'Vibration trip', lost: 0.09 },
  { id: 'DT-2289', start: '12 Mar 05:00', unit: '2nd stage compressor', tag: '23-KA-9102', minutes: 90, kind: 'Planned', cause: 'Seal gas filter change', lost: 0.11 },
  { id: 'DT-2287', start: '11 Mar 16:20', unit: 'Interstage cooler', tag: '23-HA-9114', minutes: 185, kind: 'Unplanned', cause: 'Cooler fouling', lost: 0.24 },
  { id: 'DT-2284', start: '10 Mar 02:05', unit: 'Export pump A', tag: '27-PA-2001A', minutes: 38, kind: 'Unplanned', cause: 'Power dip', lost: 0.05 },
  { id: 'DT-2281', start: '9 Mar 11:30', unit: 'Compressor gas turbine', tag: '23-GT-9001', minutes: 240, kind: 'Planned', cause: 'Borescope inspection', lost: 0.31 },
];

const OEE_CAUSE_CODES = ['Vibration trip', 'Instrument fault', 'Power dip', 'Operator stop'];

function oeeDuration(minutes: number): string {
  return minutes >= 60 ? `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')} min` : `${minutes} min`;
}

const OEE_STOP_COLUMNS: DataTableColumn<OeeStop>[] = [
  { id: 'start', header: 'Started', nowrap: true, cell: (row) => row.start },
  {
    id: 'unit',
    header: 'Unit',
    cell: (row) => (
      <span className="flex flex-col">
        <span className="font-medium">{row.unit}</span>
        <TagId>{row.tag}</TagId>
      </span>
    ),
  },
  { id: 'duration', header: 'Duration', numeric: true, nowrap: true, cell: (row) => oeeDuration(row.minutes) },
  { id: 'kind', header: 'Type', nowrap: true, cell: (row) => <StatusPill tone={row.kind === 'Planned' ? 'neutral' : 'critical'}>{row.kind}</StatusPill> },
  { id: 'cause', header: 'Cause code', cell: (row) => row.cause ?? <span className="font-medium text-(--kit-text)">Not coded</span> },
  { id: 'lost', header: 'Deferred, MSm³', numeric: true, cell: (row) => row.lost.toFixed(2) },
];

type OeeUnitRow = { unit: string; tag: string; availability: number; performance: number; quality: number; trend: number[] };

const OEE_UNITS: OeeUnitRow[] = [
  { unit: '1st stage compressor', tag: '23-KA-9101', availability: 99.1, performance: 93.4, quality: 97.2, trend: makeValues({ seed: 301, points: 14, base: 89.5, amplitude: 1, noise: 0.5, decimals: 1 }) },
  { unit: '2nd stage compressor', tag: '23-KA-9102', availability: 97.8, performance: 92.6, quality: 97.2, trend: makeValues({ seed: 302, points: 14, base: 87.6, amplitude: 1.2, noise: 0.5, decimals: 1 }) },
  { unit: 'Recompressor', tag: '23-KA-9103', availability: 88.4, performance: 86.9, quality: 96.1, trend: makeValues({ seed: 303, points: 14, base: 78, amplitude: 2, noise: 0.9, drift: -6, decimals: 1 }) },
  { unit: 'Export pump A', tag: '27-PA-2001A', availability: 98.9, performance: 95.8, quality: 99.4, trend: makeValues({ seed: 304, points: 14, base: 93.6, amplitude: 0.8, noise: 0.4, decimals: 1 }) },
];

function oeeUnitTone(value: number): Tone {
  return value >= OEE_TARGET ? 'success' : value >= OEE_TARGET - 5 ? 'warning' : 'critical';
}

const OEE_UNIT_WORD: Partial<Record<Tone, string>> = { success: 'On target', warning: 'Below target', critical: 'Well below' };

const OEE_UNIT_COLUMNS: DataTableColumn<OeeUnitRow>[] = [
  {
    id: 'unit',
    header: 'Unit',
    cell: (row) => (
      <span className="flex flex-col">
        <span className="font-medium">{row.unit}</span>
        <TagId>{row.tag}</TagId>
      </span>
    ),
  },
  { id: 'a', header: 'Availability', numeric: true, cell: (row) => `${row.availability.toFixed(1)} %` },
  { id: 'p', header: 'Performance', numeric: true, cell: (row) => `${row.performance.toFixed(1)} %` },
  { id: 'q', header: 'Quality', numeric: true, cell: (row) => `${row.quality.toFixed(1)} %` },
  { id: 'oee', header: 'OEE', numeric: true, cell: (row) => <span className="text-base font-semibold">{oeeOf([{ value: row.availability }, { value: row.performance }, { value: row.quality }]).toFixed(1)} %</span> },
  { id: 'trend', header: 'Last 14 days', width: '9rem', cell: (row) => <SparkLine values={row.trend} label={`OEE of ${row.unit}, last 14 days`} tone={oeeUnitTone(row.trend[row.trend.length - 1])} className="h-8 w-full" /> },
  {
    id: 'state',
    header: 'Against 85 %',
    nowrap: true,
    cell: (row) => {
      const tone = oeeUnitTone(oeeOf([{ value: row.availability }, { value: row.performance }, { value: row.quality }]));
      return <StatusPill tone={tone}>{OEE_UNIT_WORD[tone]}</StatusPill>;
    },
  },
];

/** One sheet of the page: a look scope with its canvas. Without a look it follows the app's look. */
function OeeSheet({ look, children }: { look?: LookId; children: ReactNode }) {
  const canvas = <Canvas className="h-full">{children}</Canvas>;
  return look ? (
    <LookScope look={look} className="h-full w-full">
      {canvas}
    </LookScope>
  ) : (
    <div className="h-full w-full">{canvas}</div>
  );
}

function ProductionOeeEquation() {
  return (
    <OeeSheet>
      <Panel
        title="Overall equipment effectiveness"
        subtitle="Week 11, 6–12 March · gas compression and export"
        icon={
          <IconChip tone="accent">
            <IconGauge />
          </IconChip>
        }
        actions={<StatusPill tone="warning">{(OEE_TARGET - OEE_VALUE).toFixed(1)} pts under target</StatusPill>}
        footer="Availability × performance × quality. The product is computed from the three factors, never entered."
      >
        <OeeEquation factors={OEE_FACTORS} resultTarget={OEE_TARGET} />
      </Panel>
    </OeeSheet>
  );
}

function ProductionOeeFactorRings() {
  return (
    <OeeSheet>
      <Panel title="Factors as rings" subtitle="Share of the ideal reached per factor" className="h-full">
        <div className="grid grid-cols-3 gap-4">
          {OEE_FACTORS.map((factor) => (
            <div key={factor.label} className="flex flex-col items-center gap-2 text-center">
              <RingGauge label={factor.label} value={factor.value} decimals={1} tone={factor.tone} size={124} />
              <span className="text-xs text-(--kit-text-2)">{factor.detail}</span>
            </div>
          ))}
        </div>
        <div className="mt-5 flex items-center justify-between gap-4 border-t border-(--kit-rule) pt-4">
          <Stat variant="plain" size="lg" label="OEE this week" value={OEE_VALUE} decimals={1} unit="%" delta={{ value: 0.8, unit: ' pts', caption: 'vs week 10' }} />
          <SparkLine values={OEE_WEEK_TREND} label="OEE, last 12 weeks" tone="accent" className="h-12 w-40" />
        </div>
      </Panel>
    </OeeSheet>
  );
}

function ProductionOeeFactorTargets() {
  return (
    <OeeSheet>
      <Panel title="Factors against target" subtitle="The marker is the weekly target" className="h-full">
        <div className="flex flex-col gap-5">
          {OEE_FACTORS.map((factor) => (
            <Meter key={factor.label} label={factor.label} value={factor.value} min={70} max={100} unit="%" decimals={1} tone={factor.tone} target={{ value: factor.target ?? 100, label: 'Target' }} />
          ))}
          <Meter label="OEE" size="lg" value={OEE_VALUE} min={70} max={100} unit="%" decimals={1} tone="accent" target={{ value: OEE_TARGET, label: 'Target' }} />
        </div>
      </Panel>
    </OeeSheet>
  );
}

function ProductionOeeWaterfall() {
  return (
    <OeeSheet>
      <Panel title="Where the 17.3 points went" subtitle="From the ideal week down to OEE, in OEE points" className="h-full">
        <LossWaterfall
          label="OEE loss waterfall, week 11: 100 % minus availability, performance and quality losses leaves 82.7 %"
          total={{ label: 'Ideal week', value: 100 }}
          losses={OEE_LOSSES}
          resultLabel="OEE"
          unit="%"
          decimals={1}
          baseline={60}
          height={300}
          notes="Performance is the largest loss: the train ran below design rate for most of Wednesday while the interstage cooler was fouled."
        />
      </Panel>
    </OeeSheet>
  );
}

function ProductionOeeSixLosses() {
  return (
    <OeeSheet>
      <Panel title="Six big losses" subtitle="OEE points lost per loss type, largest first" className="h-full">
        <Bars
          label="Six big losses in OEE points, week 11"
          orientation="horizontal"
          categories={OEE_SIX_LOSSES.map((loss) => loss.label)}
          series={[{ id: 'loss', label: 'OEE points lost', values: OEE_SIX_LOSSES.map((loss) => loss.value) }]}
          tones={['blue', 'teal', 'blue', 'teal', 'purple', 'purple']}
          unit="pts"
          decimals={1}
          showValues
          showLegend={false}
          height={300}
          notes="Blue belongs to performance, teal to availability, purple to quality — the same colours as the factors."
        />
      </Panel>
    </OeeSheet>
  );
}

function ProductionOeeShiftSoFar() {
  const recompressor = OEE_STATE_ROWS[2].segments;
  return (
    <OeeSheet>
      <Panel
        title="Day in progress"
        subtitle="Thursday 12 March, running state per unit until 14:00"
        actions={<StatusPill tone="critical" icon={<IconPlayerStop />}>Recompressor stopped 14 min</StatusPill>}
      >
        <StateStrip label="Running state per unit on 12 March until 14:00" rows={OEE_STATE_ROWS} start={0} end={24} ticks={OEE_STATE_TICKS} now={{ at: 14, label: 'Now 14:00' }} legend={OEE_STATE_LEGEND} size="lg" />
        <StatGroup joined columns={4} label="Day so far" className="mt-5">
          <Stat variant="plain" label="Exported so far" value={2.51} decimals={2} unit="MSm³" target="Plan to now 2.63" />
          <Stat variant="plain" label="Unplanned stops" value={`${Math.round(stateDuration(recompressor, 'Unplanned stop') * 60)}`} unit="min" target="2 events, recompressor" />
          <Stat variant="plain" label="Planned stops" value={90} unit="min" target="Seal gas filter change" />
          <Stat variant="plain" label="Needed to meet plan" value={4.72} decimals={2} unit="MSm³/d" target="Rate for the rest of the day" />
        </StatGroup>
      </Panel>
    </OeeSheet>
  );
}

function ProductionOeePlanByShift() {
  return (
    <OeeSheet>
      <Panel title="Output against plan by shift" subtitle="Wednesday 11 March, MSm³ per shift" className="h-full">
        <Bars
          label="Gas export per shift against plan on 11 March"
          categories={OEE_SHIFTS}
          series={[
            { id: 'plan', label: 'Plan', values: [1.5, 1.5, 1.5], tone: 'neutral' },
            { id: 'actual', label: 'Actual', values: [1.51, 1.48, 1.22], tone: 'accent' },
          ]}
          decimals={2}
          showValues
          height={260}
          notes="The evening shift lost 0.28 MSm³ to the cooler fouling stop that started at 16:20."
        />
      </Panel>
    </OeeSheet>
  );
}

function ProductionOeeCumulative() {
  const actual = oeeCumulative(OEE_DAILY_EXPORT);
  const gap = actual.map((total, index) => Math.round((total - OEE_PLAN * (index + 1)) * 100) / 100);
  return (
    <OeeSheet>
      <Panel title="Running gap to plan" subtitle="Week 11, cumulative export minus cumulative plan" className="h-full">
        <TrendLine
          label="Cumulative gas export minus cumulative plan, week 11"
          labels={OEE_DAYS}
          unit="MSm³"
          decimals={2}
          height={260}
          fill
          series={[{ id: 'gap', label: 'Ahead of or behind plan', values: gap, tone: 'accent' }]}
          limits={[{ value: 0, label: 'On plan', tone: 'neutral' }]}
          yDomain={[-0.6, 0.2]}
          notes={`The week closed ${Math.abs(gap[6]).toFixed(2)} MSm³ behind a plan of ${(OEE_PLAN * 7).toFixed(1)} MSm³; the gap opened on Wednesday and did not close.`}
        />
      </Panel>
    </OeeSheet>
  );
}

function ProductionOeeDowntimeLog() {
  return (
    <OeeSheet>
      <Panel title="Downtime log" subtitle="Week 11 · 6 events, 10.2 h, 0.83 MSm³ deferred" padding="none" className="h-full" footer="An event without a cause code stays at the top until someone codes it.">
        <DataTable label="Downtime events, week 11" columns={OEE_STOP_COLUMNS} rows={OEE_STOPS} rowKey={(row) => row.id} rowTone={(row) => (row.cause === null ? 'critical' : row.kind === 'Unplanned' ? 'warning' : undefined)} flush />
      </Panel>
    </OeeSheet>
  );
}

function ProductionOeeUncodedStop() {
  const [cause, setCause] = useState<string | null>(null);
  return (
    <OeeSheet>
      <Panel
        title="Ongoing stop"
        subtitle="Recompressor · 23-KA-9103"
        tone={cause ? 'neutral' : 'critical'}
        icon={
          <IconChip tone={cause ? 'neutral' : 'critical'}>
            <IconAlertTriangle />
          </IconChip>
        }
        className="h-full"
        footer={cause ? 'Coded by Ingrid Haugen at 14:00. Change it until the shift is handed over.' : 'Uncoded stops count as "Unknown" in the Pareto.'}
      >
        <Stat variant="plain" size="lg" label="Stopped since 13:46" value={14} unit="min" target="0.03 MSm³ deferred so far" />
        <p className="mt-4 text-sm font-medium text-(--kit-text)">{cause ? `Cause: ${cause}` : 'Pick a cause code'}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {OEE_CAUSE_CODES.map((code) => (
            <Button key={code} size="sm" variant={cause === code ? 'default' : 'secondary'} aria-pressed={cause === code} onClick={() => setCause(cause === code ? null : code)}>
              {code}
            </Button>
          ))}
        </div>
      </Panel>
    </OeeSheet>
  );
}

function ProductionOeeConsole() {
  return (
    <OeeSheet look="console">
      <Grid>
        <Panel title="OEE week 11" subtitle="A × P × Q" className="col-span-7">
          <OeeEquation factors={OEE_FACTORS} resultTarget={OEE_TARGET} size="sm" />
        </Panel>
        <Panel title="Unplanned stops" subtitle="Week 11 · 1 uncoded" tone="critical" className="col-span-5">
          <ul>
            {OEE_STOPS.filter((stop) => stop.kind === 'Unplanned').map((stop) => (
              <ListRow
                key={stop.id}
                tone={stop.cause ? 'warning' : 'critical'}
                title={`${stop.unit} · ${oeeDuration(stop.minutes)}`}
                meta={
                  <>
                    <TagId>{stop.tag}</TagId> · {stop.start} · {stop.cause ?? 'Not coded'}
                  </>
                }
                trailing={<StatusPill tone={stop.cause ? 'warning' : 'critical'}>{stop.cause ? 'Coded' : 'Code now'}</StatusPill>}
              />
            ))}
          </ul>
        </Panel>
        <Panel title="Running state" subtitle="12 March until 14:00" className="col-span-12">
          <StateStrip label="Running state per unit on 12 March, console" rows={OEE_STATE_ROWS} start={0} end={24} ticks={OEE_STATE_TICKS} now={{ at: 14, label: '14:00' }} legend={OEE_STATE_LEGEND} />
        </Panel>
      </Grid>
    </OeeSheet>
  );
}

function ProductionOeePoster() {
  return (
    <OeeSheet look="poster">
      <SectionHeader size="lg" title="We ran at 82.7 % of what this plant can do." description="Week 11. The target is 85 %. Rate, not stops, cost us the most." />
      <OeeEquation className="mt-6" factors={OEE_FACTORS} resultTarget={OEE_TARGET} />
      <Grid className="mt-6">
        <Panel title="Lost points by loss type" className="col-span-7">
          <Bars
            label="Six big losses in OEE points, poster"
            orientation="horizontal"
            categories={OEE_SIX_LOSSES.map((loss) => loss.label)}
            series={[{ id: 'loss', label: 'OEE points lost', values: OEE_SIX_LOSSES.map((loss) => loss.value) }]}
            tones={['blue', 'teal', 'blue', 'teal', 'purple', 'purple']}
            unit="pts"
            decimals={1}
            showValues
            showLegend={false}
            height={250}
          />
        </Panel>
        <Stat className="col-span-5" size="hero" tone="amber" emphasis="strong" label="Deferred this week" value={0.83} decimals={2} unit="MSm³" icon={<IconClock />} target="10.2 h of stops in 6 events" delta={{ value: 0.21, decimals: 2, good: 'down', caption: 'on week 10' }} />
      </Grid>
    </OeeSheet>
  );
}

function ProductionOeeBlueprint() {
  return (
    <OeeSheet look="blueprint">
      <Grid>
        <Panel title="OEE build-up" subtitle="Sheet 1 of 2 · week 11" className="col-span-12">
          <OeeEquation factors={OEE_FACTORS} resultTarget={OEE_TARGET} size="sm" />
        </Panel>
        <Panel title="Loss waterfall" subtitle="OEE points" className="col-span-7">
          <LossWaterfall label="OEE loss waterfall on a blueprint sheet" total={{ label: 'Ideal week', value: 100 }} losses={OEE_LOSSES} resultLabel="OEE" unit="%" decimals={1} baseline={60} height={250} />
        </Panel>
        <Panel title="Factor scales" subtitle="70–100 %, target marked" className="col-span-5">
          <div className="flex flex-col gap-5">
            {OEE_FACTORS.map((factor) => (
              <Meter key={factor.label} label={factor.label} value={factor.value} min={70} max={100} unit="%" decimals={1} tone={factor.tone} target={{ value: factor.target ?? 100, label: 'Target' }} />
            ))}
          </div>
        </Panel>
      </Grid>
    </OeeSheet>
  );
}

function ProductionOeeSignal() {
  return (
    <OeeSheet look="signal">
      <Grid>
        <Stat className="col-span-6" size="hero" tone="warning" label="OEE this week" value={OEE_VALUE} decimals={1} unit="%" state="Below target" stateIcon={<IconAlertTriangle />} target={`Target ${OEE_TARGET} %`} />
        <Stat className="col-span-6" size="hero" tone="critical" label="Recompressor" value={14} unit="min stopped" state="Stopped" stateIcon={<IconPlayerStop />} target="Not coded · since 13:46" />
        <Stat className="col-span-4" size="lg" tone="warning" label="Availability" value={93.6} decimals={1} unit="%" state="Watch" stateIcon={<IconAlertTriangle />} target="Target 95.0 %" />
        <Stat className="col-span-4" size="lg" tone="success" label="Performance" value={91.2} decimals={1} unit="%" state="Near target" stateIcon={<IconCircleCheck />} target="Target 92.0 %" />
        <Stat className="col-span-4" size="lg" tone="warning" label="Quality" value={96.9} decimals={1} unit="%" state="Watch" stateIcon={<IconAlertTriangle />} target="Target 98.0 %" />
      </Grid>
    </OeeSheet>
  );
}

function ProductionOeeEditorial() {
  return (
    <OeeSheet look="editorial">
      <SectionHeader size="lg" eyebrow="Week 11 production review" title="Rate, not stops, held OEE at 82.7 %" description="Availability recovered after Monday. The fouled interstage cooler then capped the rate for most of Wednesday." />
      <Grid className="mt-8">
        <OeeEquation className="col-span-12" factors={OEE_FACTORS} resultTarget={OEE_TARGET} />
        <div className="col-span-7">
          <LossWaterfall label="OEE loss waterfall, editorial" total={{ label: 'Ideal week', value: 100 }} losses={OEE_LOSSES} resultLabel="OEE" unit="%" decimals={1} baseline={60} height={240} />
        </div>
        <div className="col-span-5 flex flex-col gap-6">
          <Stat variant="plain" size="hero" label="Deferred production" value={0.83} decimals={2} unit="MSm³" target="2.6 % of the weekly plan of 31.5 MSm³" />
          <p className="text-base leading-7 text-(--kit-text)">
            Six stops took 10.2 hours. Two were planned and four were not; the longest unplanned one, 3 h 05 min on the interstage cooler, also explains most of the performance loss that followed it.
          </p>
          <p className="text-base leading-7 text-(--kit-text-2)">One stop on the recompressor is still open and has no cause code. Until it is coded it counts as unknown in the Pareto.</p>
        </div>
      </Grid>
    </OeeSheet>
  );
}

function ProductionOeeOverview() {
  return (
    <OeeSheet>
      <SectionHeader
        title="Production performance"
        description="Gas compression and export · week 11, 6–12 March"
        actions={
          <Button size="sm" variant="secondary">
            Export report
          </Button>
        }
      />
      <Grid className="mt-4">
        <Stat className="col-span-3" emphasis="strong" tone="accent" icon={<IconGauge />} label="OEE" value={OEE_VALUE} decimals={1} unit="%" delta={{ value: 0.8, unit: ' pts', caption: 'vs week 10' }} target={`Target ${OEE_TARGET}.0 %`} sparkline={OEE_WEEK_TREND} />
        <Stat className="col-span-3" tone="teal" icon={<IconActivity />} label="Availability" value={93.6} decimals={1} unit="%" delta={{ value: 1.9, unit: ' pts', caption: 'vs week 10' }} target="Target 95.0 %" />
        <Stat className="col-span-3" tone="blue" icon={<IconBolt />} label="Performance" value={91.2} decimals={1} unit="%" delta={{ value: -1.3, unit: ' pts', caption: 'vs week 10' }} target="Target 92.0 %" />
        <Stat className="col-span-3" tone="purple" icon={<IconTarget />} label="Quality" value={96.9} decimals={1} unit="%" delta={{ value: 0.2, unit: ' pts', caption: 'vs week 10' }} target="Target 98.0 %" />
        <Panel title="Daily export against plan" subtitle="MSm³ per day, plan 4.50" className="col-span-8">
          <Bars
            label="Daily gas export against the 4.50 plan, week 11"
            categories={OEE_DAYS}
            series={[{ id: 'export', label: 'Export', values: OEE_DAILY_EXPORT, tone: 'accent' }]}
            decimals={2}
            limit={{ value: OEE_PLAN, label: 'Plan', tone: 'warning' }}
            showValues
            showLegend={false}
            height={250}
            notes="Three of seven days met plan. Wednesday's dip is the cooler fouling stop."
          />
        </Panel>
        <Panel title="Losses" subtitle="OEE points, largest first" className="col-span-4" footer="17.3 points lost in total">
          <div className="flex flex-col gap-4">
            {OEE_LOSSES.slice()
              .sort((a, b) => b.value - a.value)
              .map((loss) => (
                <Meter key={loss.label} label={loss.label} value={loss.value} max={10} unit="pts" decimals={1} tone={loss.tone} hideScale />
              ))}
          </div>
          <div className="mt-5 border-t border-(--kit-rule) pt-4">
            <Stat variant="plain" size="lg" label="Deferred production" value={0.83} decimals={2} unit="MSm³" delta={{ value: 0.21, decimals: 2, good: 'down', caption: 'vs week 10' }} target="10.2 h of stops in 6 events" />
          </div>
        </Panel>
      </Grid>
    </OeeSheet>
  );
}

function ProductionOeeUnitComparison() {
  return (
    <OeeSheet>
      <Panel
        title="OEE by unit"
        subtitle="Week 11 · sorted as the gas flows"
        icon={
          <IconChip tone="blue">
            <IconTool />
          </IconChip>
        }
        padding="none"
        footer="The recompressor holds the train back: its availability and its rate are both the lowest."
      >
        <DataTable label="OEE and factors per unit, week 11" columns={OEE_UNIT_COLUMNS} rows={OEE_UNITS} rowKey={(row) => row.tag} rowTone={(row) => (row.tag === '23-KA-9103' ? 'critical' : undefined)} density="comfortable" flush />
      </Panel>
    </OeeSheet>
  );
}

function ProductionOeeWallBoard() {
  return (
    <OeeSheet look="glass">
      <Grid>
        <Panel title="OEE now" subtitle="Rolling 24 hours" className="col-span-4">
          <div className="flex flex-col items-center gap-3">
            <RingGauge label="OEE, rolling 24 hours" value={81.4} decimals={1} tone="accent" size={176} />
            <StatusPill tone="warning">3.6 pts under target</StatusPill>
          </div>
        </Panel>
        <Panel title="Factors" subtitle="Rolling 24 hours against target" className="col-span-4">
          <div className="flex flex-col gap-5">
            <Meter label="Availability" value={91.9} min={70} max={100} unit="%" decimals={1} tone="teal" target={{ value: 95, label: 'Target' }} />
            <Meter label="Performance" value={91.6} min={70} max={100} unit="%" decimals={1} tone="blue" target={{ value: 92, label: 'Target' }} />
            <Meter label="Quality" value={96.7} min={70} max={100} unit="%" decimals={1} tone="purple" target={{ value: 98, label: 'Target' }} />
          </div>
        </Panel>
        <Panel title="Today" subtitle="Until 14:00" className="col-span-4">
          <div className="flex flex-col gap-5">
            <Stat variant="plain" size="lg" label="Exported" value={2.51} decimals={2} unit="MSm³" target="Plan to now 2.63" />
            <Stat variant="plain" size="lg" label="Stopped" value={146} unit="min" target="56 unplanned · 90 planned" />
          </div>
        </Panel>
        <Panel title="Running state" subtitle="Thursday 12 March" className="col-span-12">
          <StateStrip label="Running state per unit on 12 March, wall board" rows={OEE_STATE_ROWS} start={0} end={24} ticks={OEE_STATE_TICKS} now={{ at: 14, label: 'Now 14:00' }} legend={OEE_STATE_LEGEND} />
        </Panel>
      </Grid>
    </OeeSheet>
  );
}

export default definePage({
  id: 'production-and-oee',
  title: 'Production and OEE',
  summary:
    'The kit for a production performance app: OEE as the multiplication it is, where the lost points went, output against plan by day and shift, and downtime with cause codes. Every figure on the page is derived from the same three factors, so the equation, the waterfall and the tiles always agree.',
  guidance: {
    use: [
      'Show OEE with its factors: a bare percentage hides whether stops, rate or quality is the problem.',
      'Order losses the way they occur: availability, then performance, then quality.',
      'Compare output with the plan for the same period, and say which period it is.',
      'Give every downtime event a cause code, and make an uncoded event easy to code.',
    ],
    avoid: [
      'Colouring OEE green above an arbitrary number; judge it against its target only.',
      'A loss chart with more than seven bars; group the tail as "Other".',
      'Mixing planned and unplanned downtime in one total without the split.',
      'Rounding factors separately from the OEE they multiply to.',
    ],
  },
  source,
  sections: [
    {
      id: 'oee',
      title: 'OEE and factors',
      description: 'The figure, the three factors behind it and each of them against its target.',
      specimens: [
        {
          id: 'ProductionOeeEquation',
          title: 'A × P × Q equation',
          note: 'Pick it as the opening block of a performance page: the product and what it is made of in one row.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/production-and-oee/OeeEquation.tsx', 'kit/Panel.tsx', 'kit/StatusPill.tsx'],
          Component: ProductionOeeEquation,
        },
        {
          id: 'ProductionOeeFactorRings',
          title: 'Factor rings',
          note: 'Pick it when the factors are read as shares of an ideal and the trend matters as much as the figure.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/RingGauge.tsx', 'kit/Stat.tsx', 'kit/SparkLine.tsx', 'kit/Panel.tsx'],
          Component: ProductionOeeFactorRings,
        },
        {
          id: 'ProductionOeeFactorTargets',
          title: 'Factors against target',
          note: 'Pick it when the question is which factor is furthest from its target.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/Meter.tsx', 'kit/Panel.tsx'],
          Component: ProductionOeeFactorTargets,
        },
      ],
    },
    {
      id: 'losses',
      title: 'Losses',
      description: 'Where the points between the ideal and the result went.',
      specimens: [
        {
          id: 'ProductionOeeWaterfall',
          title: 'Loss waterfall',
          note: 'Pick it to show the sequence: each loss starts where the previous one left the total.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/production-and-oee/LossWaterfall.tsx', 'kit/Panel.tsx'],
          Component: ProductionOeeWaterfall,
        },
        {
          id: 'ProductionOeeSixLosses',
          title: 'Six big losses',
          note: 'Pick it to rank the loss types against each other, coloured by the factor they belong to.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/Bars.tsx', 'kit/Panel.tsx'],
          Component: ProductionOeeSixLosses,
        },
      ],
    },
    {
      id: 'plan',
      title: 'Production against plan',
      description: 'The day in progress, the shifts of a finished day and the week as a running total.',
      specimens: [
        {
          id: 'ProductionOeeShiftSoFar',
          title: 'Day in progress',
          note: 'Pick it for the current day: state bands per unit up to now and the rate needed to still meet plan.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/production-and-oee/StateStrip.tsx', 'kit/StatGroup.tsx', 'kit/Stat.tsx', 'kit/Panel.tsx'],
          Component: ProductionOeeShiftSoFar,
        },
        {
          id: 'ProductionOeePlanByShift',
          title: 'Output by shift',
          note: 'Pick it to compare the shifts of one finished day with the same plan.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/Bars.tsx', 'kit/Panel.tsx'],
          Component: ProductionOeePlanByShift,
        },
        {
          id: 'ProductionOeeCumulative',
          title: 'Running gap to plan',
          note: 'Pick it when the question is whether the period will close on plan, not how one day went.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/TrendLine.tsx', 'kit/Panel.tsx'],
          Component: ProductionOeeCumulative,
        },
      ],
    },
    {
      id: 'downtime',
      title: 'Downtime',
      description: 'Every stop with its type and cause code, and the one that still needs coding.',
      specimens: [
        {
          id: 'ProductionOeeDowntimeLog',
          title: 'Downtime log',
          note: 'Pick it as the record behind the availability figure: planned and unplanned told apart in words.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/DataTable.tsx', 'kit/StatusPill.tsx', 'kit/TagId.tsx', 'kit/Panel.tsx'],
          Component: ProductionOeeDowntimeLog,
        },
        {
          id: 'ProductionOeeUncodedStop',
          title: 'Ongoing stop to code',
          note: 'Pick it where the operator codes a stop while it happens; the panel calms down once a cause is set.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/Panel.tsx', 'kit/Stat.tsx', 'kit/IconChip.tsx'],
          Component: ProductionOeeUncodedStop,
        },
      ],
    },
    {
      id: 'looks',
      title: 'In other looks',
      description: 'The same figures as different anatomy: blocks, drawings, state tiles and a typeset review.',
      specimens: [
        {
          id: 'ProductionOeeConsole',
          title: 'Console',
          note: 'Pick it for the control room: solid factor blocks, square state bands and stops as edge-marked rows.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/production-and-oee/OeeEquation.tsx', 'kit/production-and-oee/StateStrip.tsx', 'kit/ListRow.tsx', 'looks/LookScope.tsx'],
          Component: ProductionOeeConsole,
        },
        {
          id: 'ProductionOeePoster',
          title: 'Poster',
          note: 'Pick it for the weekly review screen: the finding as a headline and the equation as colour blocks.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/production-and-oee/OeeEquation.tsx', 'kit/Bars.tsx', 'kit/Stat.tsx', 'looks/LookScope.tsx'],
          Component: ProductionOeePoster,
        },
        {
          id: 'ProductionOeeBlueprint',
          title: 'Blueprint',
          note: 'Pick it for an engineering pack: ruled factor columns, an outlined waterfall and dimensioned scales.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/production-and-oee/OeeEquation.tsx', 'kit/production-and-oee/LossWaterfall.tsx', 'kit/Meter.tsx', 'looks/LookScope.tsx'],
          Component: ProductionOeeBlueprint,
        },
        {
          id: 'ProductionOeeSignal',
          title: 'Signal',
          note: 'Pick it for a wall screen: every tile is filled with its state and says it in a word.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/Stat.tsx', 'looks/LookScope.tsx'],
          Component: ProductionOeeSignal,
        },
        {
          id: 'ProductionOeeEditorial',
          title: 'Editorial',
          note: 'Pick it for the written weekly review: no cards, the finding as the headline and figures beside the text.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/production-and-oee/OeeEquation.tsx', 'kit/production-and-oee/LossWaterfall.tsx', 'kit/SectionHeader.tsx', 'looks/LookScope.tsx'],
          Component: ProductionOeeEditorial,
        },
      ],
    },
    {
      id: 'in-use',
      title: 'In use',
      description: 'Compositions that can be dropped into a product.',
      specimens: [
        {
          id: 'ProductionOeeOverview',
          title: 'Production overview',
          note: 'Pick it as the landing board of a performance app: four factor tiles, the week against plan and the losses.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/Stat.tsx', 'kit/Bars.tsx', 'kit/Meter.tsx', 'kit/Panel.tsx', 'kit/SectionHeader.tsx'],
          Component: ProductionOeeOverview,
        },
        {
          id: 'ProductionOeeUnitComparison',
          title: 'Unit comparison',
          note: 'Pick it to find the unit that holds the train back: factors, OEE, trend and verdict per unit.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/DataTable.tsx', 'kit/SparkLine.tsx', 'kit/StatusPill.tsx', 'kit/Panel.tsx'],
          Component: ProductionOeeUnitComparison,
        },
        {
          id: 'ProductionOeeWallBoard',
          title: 'Wall board',
          note: 'Pick it for the screen in the control room corridor: OEE as a ring, factors, today and the state bands.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/RingGauge.tsx', 'kit/Meter.tsx', 'kit/production-and-oee/StateStrip.tsx', 'looks/LookScope.tsx'],
          Component: ProductionOeeWallBoard,
        },
      ],
    },
  ],
});
