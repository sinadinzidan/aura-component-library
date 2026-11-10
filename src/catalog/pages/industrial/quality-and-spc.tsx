import { ChartContainer, ChartTooltip, ChartTooltipContent, chartSeriesColor } from '@cognite/aura/chart';
import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import { Card } from '@cognite/aura/components/card';
import { IconAlertTriangle, IconCircleCheck, IconHexagon } from '@cognite/aura/icons';
import type { ReactNode } from 'react';
import { CartesianGrid, Line, LineChart, ReferenceArea, ReferenceLine, XAxis, YAxis } from 'recharts';

import { CapabilitySummary } from '../../../library/industrial/domains/CapabilitySummary';
import { ControlChart } from '../../../library/industrial/domains/ControlChart';
import { RUN_RULE_TEXT, controlLimits, runRuleViolations, specCompliance } from '../../../library/industrial/domains/spc';
import { StageFlow } from '../../../library/industrial/domains/StageFlow';
import { KpiTile } from '../../../library/industrial/KpiTile';
import { RangeIndicator } from '../../../library/industrial/RangeIndicator';
import { formatValue } from '../../../library/industrial/status';
import type { DotShape, Tone } from '../../../library/industrial/status';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { ValueReadout } from '../../../library/industrial/ValueReadout';
import { DAY, HOUR, REFERENCE_NOW, createRandom, formatDateTime, formatTime, makeSeries, makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './quality-and-spc.tsx?raw';

const CHART_FRAME = 'aspect-auto h-full w-full';
const TH = 'px-3 py-2 text-left text-xs font-medium text-muted-foreground';
const TD = 'px-3 py-2.5 align-middle';

/** Seeded, roughly normal measurements: the sum of twelve uniform draws around a mean. */
function measurements(seed: number, count: number, mean: number, sigma: number, decimals: number): number[] {
  const random = createRandom(seed);
  const factor = 10 ** decimals;
  return Array.from({ length: count }, () => {
    let total = 0;
    for (let draw = 0; draw < 12; draw += 1) total += random();
    return Math.round((mean + (total - 6) * sigma) * factor) / factor;
  });
}

const chunk = (values: readonly number[], size: number): number[][] =>
  Array.from({ length: Math.floor(values.length / size) }, (_, index) => values.slice(index * size, (index + 1) * size));

/** Wobbe index of the sales gas in MJ/Sm³: 25 subgroups of 5 analyser readings, one subgroup every 2 hours. */
const WOBBE_SPEC = { lsl: 49.6, usl: 51.6 };
const WOBBE_VALUES = measurements(72, 125, 50.6, 0.22, 2);
const WOBBE = controlLimits(chunk(WOBBE_VALUES, 5));
const SUBGROUP_TIMES = WOBBE.means.map((_, index) => formatDateTime(REFERENCE_NOW - (WOBBE.means.length - 1 - index) * 2 * HOUR));

/** A later period judged against the same limits: one spike, then the process settles 0.13 higher. */
const WOBBE_SHIFTED = controlLimits(chunk(measurements(76, 125, 50.6, 0.22, 2), 5)).means.map(
  (value, index) => Math.round((value + (index === 7 ? 0.42 : index >= 14 ? 0.13 : 0)) * 1000) / 1000
);
const WOBBE_VIOLATIONS = runRuleViolations(WOBBE_SHIFTED, WOBBE.xbar);

/** CO₂ content of the sales gas in mol %, 100 lab results. The process sits high in its spec. */
const CO2_SPEC = { lsl: 1.5, usl: 2.5 };
const CO2_VALUES = measurements(91, 100, 2.18, 0.11, 2);

const COMPLIANCE_TREND = [...makeValues({ seed: 81, points: 29, base: 99.3, drift: -0.6, noise: 0.25, stepMs: DAY, max: 100 }), 98.6];
const YIELD_TREND = [...makeValues({ seed: 82, points: 29, base: 95.4, drift: 1.2, noise: 0.5, stepMs: DAY, max: 100 }), 96.8];

const DEW_POINT_LIMIT = -18;

/** Water dew point at export in °C, hourly for 48 hours. It must stay below −18 °C. */
const DEW_POINT = makeSeries({ seed: 83, points: 48, base: -22.4, amplitude: 1.3, noise: 0.5, drift: 2.6, cycles: 2 }).map((point) => ({
  time: formatTime(point.t),
  label: formatDateTime(point.t),
  dewPoint: point.v,
}));

type LabResult = {
  sampleId: string;
  time: string;
  point: string;
  parameter: string;
  method: string;
  result: number;
  unit: string;
  decimals: number;
  low?: number;
  high?: number;
};

const LAB_RESULTS: readonly LabResult[] = [
  { sampleId: 'S-260312-07', time: '12 Mar, 10:00', point: '27-AP-2010', parameter: 'Wobbe index', method: 'ISO 6976', result: 50.62, unit: 'MJ/Sm³', decimals: 2, low: 49.6, high: 51.6 },
  { sampleId: 'S-260312-07', time: '12 Mar, 10:00', point: '27-AP-2010', parameter: 'CO₂', method: 'ISO 6974', result: 2.58, unit: 'mol %', decimals: 2, high: 2.5 },
  { sampleId: 'S-260312-07', time: '12 Mar, 10:00', point: '27-AP-2010', parameter: 'H₂S', method: 'ISO 19739', result: 2.1, unit: 'mg/Sm³', decimals: 1, high: 5 },
  { sampleId: 'S-260312-06', time: '12 Mar, 08:00', point: '27-AP-2011', parameter: 'Water dew point', method: 'ISO 6327', result: -19.8, unit: '°C', decimals: 1, high: -18 },
  { sampleId: 'S-260312-05', time: '12 Mar, 06:00', point: '27-AP-2011', parameter: 'Hydrocarbon dew point', method: 'ISO 23874', result: -4.2, unit: '°C', decimals: 1, high: -3 },
  { sampleId: 'S-260312-04', time: '12 Mar, 06:00', point: '20-AP-1030', parameter: 'Condensate RVP', method: 'ASTM D323', result: 71.8, unit: 'kPa', decimals: 1, high: 70 },
  { sampleId: 'S-260312-03', time: '12 Mar, 04:00', point: '27-AP-2010', parameter: 'Gross calorific value', method: 'ISO 6976', result: 40.31, unit: 'MJ/Sm³', decimals: 2, low: 38.1, high: 43.7 },
];

const inSpec = (row: LabResult): boolean => (row.low === undefined || row.result >= row.low) && (row.high === undefined || row.result <= row.high);

function specText(row: LabResult): string {
  if (row.low !== undefined && row.high !== undefined) return `${formatValue(row.low, row.decimals)} to ${formatValue(row.high, row.decimals)}`;
  if (row.high !== undefined) return `Max ${formatValue(row.high, row.decimals)}`;
  return row.low !== undefined ? `Min ${formatValue(row.low, row.decimals)}` : 'No limit';
}

const IN_SPEC = { tone: 'success', label: 'In spec', shape: 'dot' } as const;
const OUT_OF_SPEC = { tone: 'critical', label: 'Out of spec', shape: 'diamond' } as const;

const SAMPLE_STAGES = [
  { id: 'taken', label: 'Taken', detail: '10:00 · Jonas Nyberg' },
  { id: 'received', label: 'Received in lab', detail: '10:25' },
  { id: 'analysis', label: 'In analysis', detail: 'Since 10:40' },
  { id: 'approved', label: 'Approved' },
];

type ScheduleEntry = { time: string; point: string; analysis: string; state: { tone: Tone; label: string; shape: DotShape } };

const SCHEDULE: readonly ScheduleEntry[] = [
  { time: '06:00', point: '27-AP-2011', analysis: 'Dew points', state: { tone: 'success', label: 'Approved', shape: 'dot' } },
  { time: '10:00', point: '27-AP-2010', analysis: 'Gas composition', state: { tone: 'info', label: 'In lab', shape: 'ring' } },
  { time: '12:00', point: '20-AP-1030', analysis: 'Condensate RVP', state: { tone: 'critical', label: 'Overdue 2 h', shape: 'diamond' } },
  { time: '16:00', point: '27-AP-2010', analysis: 'Gas composition', state: { tone: 'neutral', label: 'Due in 2 h', shape: 'ring' } },
  { time: '18:00', point: '27-AP-2011', analysis: 'Dew points', state: { tone: 'neutral', label: 'Scheduled', shape: 'ring' } },
];

const OFF_SPEC_EVENTS = [
  { id: 'OS-0311', start: '12 Mar, 09:40', duration: 'Ongoing, 4 h 20 min', parameter: 'CO₂', peak: '2.58 mol %', limit: 'Max 2.50', volume: '0.79 MSm³', disposition: 'Blending with Valhall Sør gas', open: true },
  { id: 'OS-0310', start: '10 Mar, 21:10', duration: '1 h 30 min', parameter: 'Water dew point', peak: '−16.9 °C', limit: 'Max −18.0', volume: '0.27 MSm³', disposition: 'Accepted by buyer under waiver', open: false },
  { id: 'OS-0309', start: '6 Mar, 03:05', duration: '50 min', parameter: 'Condensate RVP', peak: '73.4 kPa', limit: 'Max 70.0', volume: '48 Sm³', disposition: 'Recycled to stabiliser', open: false },
];

function Panel({ title, meta, children }: { title: string; meta?: ReactNode; children: ReactNode }) {
  return (
    <Card className="w-full min-w-0">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-medium text-base-foreground">{title}</h3>
        {meta ? <span className="text-xs text-muted-foreground tabular-nums">{meta}</span> : null}
      </div>
      {children}
    </Card>
  );
}

function QualitySpcXbarChart() {
  return (
    <Panel title="Wobbe index · X-bar chart" meta="MJ/Sm³ · subgroup means, n = 5">
      <ControlChart label="Wobbe index, subgroup means" values={WOBBE.means} limits={WOBBE.xbar} categories={SUBGROUP_TIMES} unit="MJ/Sm³" decimals={2} centerLabel="CL" height={200} />
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <StatusIndicator size="sm" tone="success" label="In control" detail="no run-rule violations" />
        <span className="text-xs text-muted-foreground">25 subgroups, one every 2 hours</span>
      </div>
    </Panel>
  );
}

function QualitySpcLimitsSummary() {
  const rows = [
    { label: 'Upper control limit', value: WOBBE.xbar.ucl },
    { label: 'Centre line', value: WOBBE.xbar.center },
    { label: 'Lower control limit', value: WOBBE.xbar.lcl },
    { label: 'Mean range', value: WOBBE.range.center },
    { label: 'Estimated std dev', value: WOBBE.sigma },
  ];
  return (
    <Card className="w-full max-w-72 self-center gap-3">
      <div className="flex flex-col gap-0.5">
        <span className="text-xs text-muted-foreground">Control limits · Wobbe index</span>
        <span className="text-xs text-muted-foreground">MJ/Sm³</span>
      </div>
      <dl className="flex flex-col gap-2 text-sm">
        {rows.map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-3">
            <dt className="text-medium-foreground">{row.label}</dt>
            <dd className="font-medium tabular-nums text-base-foreground">{formatValue(row.value, 3)}</dd>
          </div>
        ))}
      </dl>
      <p className="border-t border-default pt-3 text-xs text-muted-foreground">Fixed on 10 Mar from 25 subgroups of 5. Recalculate only after a deliberate process change.</p>
    </Card>
  );
}

function QualitySpcRunRules() {
  return (
    <Panel title="X-bar chart with run-rule violations" meta="Wobbe index · limits from 10 Mar">
      <ControlChart label="Wobbe index, subgroup means against fixed limits" values={WOBBE_SHIFTED} limits={WOBBE.xbar} categories={SUBGROUP_TIMES} unit="MJ/Sm³" decimals={2} showSigmaLines />
      <ul aria-label="Run rules broken" className="flex flex-col gap-1.5 text-xs">
        {[...new Set(WOBBE_VIOLATIONS.map((violation) => violation.rule))].map((rule) => (
          <li key={rule} className="flex items-baseline gap-2">
            <span className="font-medium tabular-nums text-critical-foreground-strong">Rule {rule}</span>
            <span className="text-medium-foreground">{RUN_RULE_TEXT[rule]}</span>
            <span className="ml-auto whitespace-nowrap tabular-nums text-muted-foreground">
              Subgroup{' '}
              {WOBBE_VIOLATIONS.filter((violation) => violation.rule === rule)
                .map((violation) => violation.index + 1)
                .join(', ')}
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function QualitySpcRangeChart() {
  return (
    <Panel title="Wobbe index · range chart" meta="MJ/Sm³ · subgroup ranges, n = 5">
      <ControlChart label="Wobbe index, subgroup ranges" values={WOBBE.ranges} limits={WOBBE.range} categories={SUBGROUP_TIMES} unit="MJ/Sm³" decimals={2} centerLabel="R̄" />
      <p className="text-xs text-muted-foreground">The lower limit is zero for subgroups of fewer than seven. Read this chart first: the X-bar limits only hold while the spread is stable.</p>
    </Panel>
  );
}

function QualitySpcXbarRPair() {
  return (
    <Card className="w-full min-w-0">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h3 className="text-sm font-medium text-base-foreground">Wobbe index · X-bar and R</h3>
        <StatusIndicator size="sm" tone="critical" shape="diamond" label="Out of control" detail={`${WOBBE_VIOLATIONS.length} points flagged`} />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-muted-foreground">Subgroup mean, MJ/Sm³</span>
        <ControlChart label="Wobbe index, subgroup means" values={WOBBE_SHIFTED} limits={WOBBE.xbar} unit="MJ/Sm³" decimals={2} centerLabel="CL" height={168} />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-muted-foreground">Subgroup range, MJ/Sm³</span>
        <ControlChart label="Wobbe index, subgroup ranges" values={WOBBE.ranges} limits={WOBBE.range} categories={SUBGROUP_TIMES} unit="MJ/Sm³" decimals={2} centerLabel="R̄" height={112} />
      </div>
      <p className="text-xs text-muted-foreground">The mean has shifted up since subgroup 15 while the range is unchanged: look for a change in feed composition, not in the analyser.</p>
    </Card>
  );
}

function QualitySpcCapability() {
  return (
    <Panel title="Capability · Wobbe index" meta="125 readings · spec 49.6 to 51.6 MJ/Sm³">
      <CapabilitySummary label="Wobbe index" values={WOBBE_VALUES} lsl={WOBBE_SPEC.lsl} usl={WOBBE_SPEC.usl} unit="MJ/Sm³" />
    </Panel>
  );
}

function QualitySpcCapabilityOffCentre() {
  return (
    <Panel title="Capability · CO₂ content" meta="100 lab results · spec 1.50 to 2.50 mol %">
      <CapabilitySummary label="CO₂ content" values={CO2_VALUES} lsl={CO2_SPEC.lsl} usl={CO2_SPEC.usl} unit="mol %" decimals={2} />
      <p className="text-xs text-muted-foreground">Cp is fine but Cpk is not: the spread fits the spec, the process just sits too close to the upper limit.</p>
    </Panel>
  );
}

function QualitySpcComplianceTile() {
  return (
    <div className="w-full max-w-72 self-center">
      <KpiTile
        label="Spec compliance"
        value={98.6}
        unit="%"
        decimals={1}
        status={{ tone: 'warning', label: 'Below target', shape: 'square' }}
        delta={{ reference: 99.2, goodDirection: 'up', caption: 'vs last week' }}
        target={{ value: 99.5 }}
        trend={{ values: COMPLIANCE_TREND, label: 'Spec compliance, last 30 days' }}
        footnote="Share of export hours with every parameter in spec"
      />
    </div>
  );
}

function QualitySpcFirstPassYield() {
  return (
    <div className="w-full max-w-72 self-center">
      <KpiTile
        label="First-pass yield"
        value={96.8}
        unit="%"
        decimals={1}
        delta={{ reference: 95.9, goodDirection: 'up', caption: 'vs last month' }}
        target={{ value: 97 }}
        trend={{ values: YIELD_TREND, label: 'First-pass yield, last 30 days' }}
        footnote="Volume delivered on spec without blending or recycle"
      />
    </div>
  );
}

function QualitySpcGradeBadge() {
  return (
    <ul aria-label="Product quality grades" className="flex w-full max-w-72 flex-col gap-3 self-center text-sm">
      <li className="flex items-center justify-between gap-3">
        <span className="text-base-foreground">NGL</span>
        <Badge variant="success">
          <IconCircleCheck aria-hidden="true" />
          Grade A · on spec
        </Badge>
      </li>
      <li className="flex items-center justify-between gap-3">
        <span className="text-base-foreground">Condensate</span>
        <Badge variant="warning">
          <IconAlertTriangle aria-hidden="true" />
          Grade B · downgraded
        </Badge>
      </li>
      <li className="flex items-center justify-between gap-3">
        <span className="text-base-foreground">Sales gas</span>
        <Badge variant="error">
          <IconHexagon aria-hidden="true" />
          Off spec
        </Badge>
      </li>
      <li className="flex items-center justify-between gap-3">
        <span className="text-base-foreground">Produced water</span>
        <Badge variant="archived">Not graded</Badge>
      </li>
    </ul>
  );
}

function QualitySpcParameterTrend() {
  return (
    <Panel title="Water dew point at export" meta="°C, last 48 hours">
      <div className="h-56 w-full">
        <ChartContainer
          config={{ dewPoint: { label: 'Water dew point', color: chartSeriesColor(1) } }}
          className={CHART_FRAME}
          aria-label="Water dew point over 48 hours, rising from about minus 23 towards the specification limit of minus 18 degrees and still inside the specification band"
        >
          <LineChart data={DEW_POINT} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={48} />
            <YAxis domain={[-26, -14]} ticks={[-26, -22, -18, -14]} tickLine={false} axisLine={false} width={32} />
            <ChartTooltip content={<ChartTooltipContent valueFormatter={(value) => `${value} °C`} />} />
            <ReferenceArea y1={-26} y2={DEW_POINT_LIMIT} fill="var(--color-chart-neutral-100)" stroke="none" />
            <ReferenceLine y={DEW_POINT_LIMIT} stroke="var(--color-chart-critical-450)" strokeDasharray="4 4" />
            <Line dataKey="dewPoint" type="monotone" stroke="var(--color-dewPoint)" strokeWidth={2} dot={false} isAnimationActive={false} />
          </LineChart>
        </ChartContainer>
      </div>
      <p className="text-xs text-muted-foreground">Shaded band is the specification, dashed line its limit of −18 °C. Margin now 1.4 °C, down from 4.6 °C two days ago.</p>
    </Panel>
  );
}

function QualitySpcSpecGauges() {
  return (
    <Panel title="Latest results against specification" meta="Sales gas · 12 Mar, 10:00">
      <div className="flex flex-col gap-4">
        <RangeIndicator label="Wobbe index" value={50.62} min={48.6} max={52.6} limits={{ low: 49.6, high: 51.6 }} unit="MJ/Sm³" decimals={2} />
        <RangeIndicator label="Gross calorific value" value={40.31} min={36} max={46} limits={{ low: 38.1, high: 43.7 }} unit="MJ/Sm³" decimals={2} />
        <RangeIndicator label="CO₂" value={2.58} min={0} max={3} limits={{ high: 2.5 }} tone="critical" unit="mol %" decimals={2} />
        <RangeIndicator label="H₂S" value={2.1} min={0} max={6} limits={{ high: 5 }} unit="mg/Sm³" decimals={1} />
      </div>
    </Panel>
  );
}

function SampleCard({ row, action }: { row: LabResult; action?: ReactNode }) {
  const ok = inSpec(row);
  return (
    <Card role="group" aria-label={`Sample ${row.sampleId}, ${row.parameter}`} className="w-full min-w-0 gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="font-mono text-base-foreground">{row.sampleId}</span>
          <span className="tabular-nums">{row.time}</span>
        </span>
        <StatusIndicator size="sm" {...(ok ? IN_SPEC : OUT_OF_SPEC)} />
      </div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-sm font-medium text-base-foreground">{row.parameter}</span>
          <span className="text-xs text-muted-foreground">
            {row.method} · sample point <span className="font-mono">{row.point}</span>
          </span>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <ValueReadout size="md" value={row.result} unit={row.unit} decimals={row.decimals} tone={ok ? 'neutral' : 'critical'} />
          <span className="text-xs text-muted-foreground tabular-nums">Spec {specText(row).toLowerCase()}</span>
        </div>
      </div>
      {action}
    </Card>
  );
}

function QualitySpcSampleRow() {
  return <SampleCard row={LAB_RESULTS[0]} />;
}

function QualitySpcSampleRowOutOfSpec() {
  return (
    <SampleCard
      row={LAB_RESULTS[1]}
      action={
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-default pt-3">
          <span className="text-xs text-muted-foreground">0.08 mol % above the limit. Confirm with a second sample before reporting.</span>
          <Button variant="secondary" size="sm">
            Request retest
          </Button>
        </div>
      }
    />
  );
}

function QualitySpcSampleFlow() {
  return (
    <Panel title="Sample status" meta={<span className="font-mono">S-260312-07</span>}>
      <StageFlow label="Sample S-260312-07 status" stages={SAMPLE_STAGES} current="analysis" />
    </Panel>
  );
}

function QualitySpcSampleFlowHeld() {
  return (
    <Panel title="Sample status" meta={<span className="font-mono">S-260312-04</span>}>
      <StageFlow
        label="Sample S-260312-04 status"
        stages={[
          { id: 'taken', label: 'Taken', detail: '06:00 · Jonas Nyberg' },
          { id: 'received', label: 'Received in lab', detail: '06:20' },
          { id: 'analysis', label: 'In analysis' },
          { id: 'approved', label: 'Approved' },
        ]}
        current="analysis"
        currentTone="warning"
        currentNote="Retest requested, 08:05"
      />
    </Panel>
  );
}

function QualitySpcLabResultsTable() {
  return (
    <div className="w-full overflow-x-auto">
      <table aria-label="Lab results, 12 March" className="w-full min-w-144 border-collapse text-sm">
        <thead>
          <tr>
            <th scope="col" className={TH}>
              Sample
            </th>
            <th scope="col" className={TH}>
              Parameter
            </th>
            <th scope="col" className={`${TH} text-right`}>
              Result
            </th>
            <th scope="col" className={TH}>
              Specification
            </th>
            <th scope="col" className={TH}>
              Verdict
            </th>
          </tr>
        </thead>
        <tbody>
          {LAB_RESULTS.map((row) => {
            const ok = inSpec(row);
            return (
              <tr key={`${row.sampleId}-${row.parameter}`} className={`border-t border-default ${ok ? '' : 'bg-critical-background'}`}>
                <td className={`${TD} whitespace-nowrap`}>
                  <span className={`font-mono text-xs ${ok ? 'text-medium-foreground' : 'text-critical-foreground'}`}>{row.sampleId}</span>
                  <span className={`block text-xs tabular-nums ${ok ? 'text-muted-foreground' : 'text-critical-foreground'}`}>{row.time}</span>
                </td>
                <td className={`${TD} ${ok ? 'text-base-foreground' : 'text-critical-foreground'}`}>
                  {row.parameter}
                  <span className={`block text-xs ${ok ? 'text-muted-foreground' : 'text-critical-foreground'}`}>{row.method}</span>
                </td>
                <td className={`${TD} whitespace-nowrap text-right tabular-nums ${ok ? 'text-base-foreground' : 'font-semibold text-critical-foreground'}`}>
                  {formatValue(row.result, row.decimals)}
                  <span className={`pl-1 text-xs font-normal ${ok ? 'text-muted-foreground' : 'text-critical-foreground'}`}>{row.unit}</span>
                </td>
                <td className={`${TD} whitespace-nowrap tabular-nums ${ok ? 'text-medium-foreground' : 'text-critical-foreground'}`}>{specText(row)}</td>
                <td className={TD}>
                  {ok ? <StatusIndicator size="sm" {...IN_SPEC} /> : <span className="flex items-center gap-1.5 text-xs font-medium text-critical-foreground">◆ Out of spec</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function QualitySpcSamplingSchedule() {
  return (
    <Card className="w-full max-w-80 self-center gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs text-muted-foreground">Sampling schedule</span>
        <span className="text-xs text-muted-foreground">12 Mar</span>
      </div>
      <ol className="flex flex-col gap-3">
        {SCHEDULE.map((entry) => (
          <li key={`${entry.time}-${entry.point}`} className="grid grid-cols-[2.75rem_minmax(0,1fr)] gap-x-3">
            <span className="text-sm tabular-nums text-medium-foreground">{entry.time}</span>
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="flex items-center justify-between gap-2">
                <span className="truncate text-sm text-base-foreground">{entry.analysis}</span>
                <StatusIndicator size="sm" {...entry.state} />
              </span>
              <span className="font-mono text-xs text-muted-foreground">{entry.point}</span>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}

function QualitySpcOffSpecEvents() {
  return (
    <Panel title="Off-spec events" meta="Last 7 days · 3 events">
      <ul className="flex flex-col">
        {OFF_SPEC_EVENTS.map((event, index) => (
          <li key={event.id} className={`flex flex-col gap-1.5 py-3 ${index === 0 ? 'pt-0' : 'border-t border-default'} ${index === OFF_SPEC_EVENTS.length - 1 ? 'pb-0' : ''}`}>
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
              <span className="flex items-center gap-2 text-sm font-medium text-base-foreground">
                {event.parameter}
                <span className="font-mono text-xs font-normal text-muted-foreground">{event.id}</span>
              </span>
              {event.open ? (
                <StatusIndicator size="sm" tone="critical" shape="diamond" label="Ongoing" pulse />
              ) : (
                <StatusIndicator size="sm" tone="neutral" shape="square" label="Closed" />
              )}
            </div>
            <dl className="grid grid-cols-3 gap-x-4 gap-y-1 text-xs">
              <div className="flex flex-col gap-0.5">
                <dt className="text-muted-foreground">Peak · limit</dt>
                <dd className="tabular-nums text-base-foreground">
                  {event.peak} · {event.limit.toLowerCase()}
                </dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="text-muted-foreground">Started · lasted</dt>
                <dd className="tabular-nums text-base-foreground">
                  {event.start} · {event.duration.toLowerCase()}
                </dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="text-muted-foreground">Volume affected</dt>
                <dd className="tabular-nums text-base-foreground">{event.volume}</dd>
              </div>
            </dl>
            <span className="text-xs text-muted-foreground">Disposition: {event.disposition}</span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function QualitySpcDeviationCard() {
  return (
    <Card role="group" aria-label="Non-conformance NCR-2026-014" className="w-full min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          Non-conformance <span className="font-mono text-base-foreground">NCR-2026-014</span>
        </span>
        <div className="flex items-center gap-2">
          <Badge variant="warning">
            <IconAlertTriangle aria-hidden="true" />
            Major
          </Badge>
          <StatusIndicator variant="badge" tone="info" label="Under investigation" />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-medium text-base-foreground">CO₂ content above sales gas specification</h3>
        <p className="text-sm text-medium-foreground">
          Sample <span className="font-mono text-xs">S-260312-07</span> measured 2.58 mol % against a maximum of 2.50. The online analyser has read above 2.50 since 09:40.
        </p>
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
        <div className="flex flex-col gap-0.5">
          <dt className="text-xs text-muted-foreground">Containment</dt>
          <dd className="text-sm text-base-foreground">Blending with Valhall Sør gas since 10:55</dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-xs text-muted-foreground">Root cause</dt>
          <dd className="text-sm text-muted-foreground">Not yet determined</dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-xs text-muted-foreground">Owner</dt>
          <dd className="text-sm text-base-foreground">Aisha Khan</dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-xs text-muted-foreground">Investigation due</dt>
          <dd className="text-sm tabular-nums text-base-foreground">19 Mar 2026</dd>
        </div>
      </dl>
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="ghost" size="sm">
          Add corrective action
        </Button>
        <Button variant="secondary" size="sm">
          Record root cause
        </Button>
      </div>
    </Card>
  );
}

function QualitySpcCertificate() {
  const rows = LAB_RESULTS.filter((row) => row.point.startsWith('27-') && row.parameter !== 'CO₂');
  const certified = [...rows.slice(0, 1), { ...LAB_RESULTS[1], result: 2.31 }, ...rows.slice(1)];
  return (
    <Card className="mx-auto w-full max-w-3xl min-w-0 gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-base font-semibold text-base-foreground">Certificate of analysis</h3>
          <span className="font-mono text-xs text-muted-foreground">CoA-2026-0311-NK</span>
        </div>
        <Badge variant="success">
          <IconCircleCheck aria-hidden="true" />
          Conforms to specification
        </Badge>
      </div>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
        <div className="flex flex-col gap-0.5">
          <dt className="text-xs text-muted-foreground">Product</dt>
          <dd className="text-sm text-base-foreground">Sales gas</dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-xs text-muted-foreground">Delivery period</dt>
          <dd className="text-sm tabular-nums text-base-foreground">11 Mar, 06:00–06:00</dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-xs text-muted-foreground">Quantity</dt>
          <dd className="text-sm tabular-nums text-base-foreground">4.21 MSm³</dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-xs text-muted-foreground">Delivery point</dt>
          <dd className="text-sm text-base-foreground">Stord terminal</dd>
        </div>
      </dl>
      <div className="overflow-x-auto">
        <table aria-label="Certified results" className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th scope="col" className={`${TH} pl-0`}>
                Parameter
              </th>
              <th scope="col" className={TH}>
                Method
              </th>
              <th scope="col" className={TH}>
                Specification
              </th>
              <th scope="col" className={`${TH} text-right`}>
                Result
              </th>
              <th scope="col" className={`${TH} pr-0`}>
                Unit
              </th>
            </tr>
          </thead>
          <tbody>
            {certified.map((row) => (
              <tr key={row.parameter} className="border-t border-default">
                <th scope="row" className={`${TD} pl-0 text-left font-normal text-base-foreground`}>
                  {row.parameter}
                </th>
                <td className={`${TD} text-medium-foreground`}>{row.method}</td>
                <td className={`${TD} whitespace-nowrap tabular-nums text-medium-foreground`}>{specText(row)}</td>
                <td className={`${TD} text-right font-medium tabular-nums text-base-foreground`}>{formatValue(row.result, row.decimals)}</td>
                <td className={`${TD} pr-0 text-muted-foreground`}>{row.unit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">
        Results are flow-weighted averages for the delivery period, from the fiscal analyser at <span className="font-mono">27-AP-2010</span> and verified by laboratory spot samples.
      </p>
      <div className="flex flex-wrap justify-between gap-3 border-t border-default pt-4 text-xs text-muted-foreground">
        <span>Approved by Aisha Khan, laboratory supervisor</span>
        <span className="tabular-nums">Issued 12 Mar 2026, 07:15 UTC</span>
      </div>
    </Card>
  );
}

function QualitySpcOverview() {
  const compliance = specCompliance(CO2_VALUES, CO2_SPEC.lsl, CO2_SPEC.usl);
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiTile label="Spec compliance" value={98.6} unit="%" decimals={1} delta={{ reference: 99.2, goodDirection: 'up', caption: 'vs last week' }} target={{ value: 99.5 }} />
        <KpiTile label="First-pass yield" value={96.8} unit="%" decimals={1} delta={{ reference: 95.9, goodDirection: 'up', caption: 'vs last month' }} target={{ value: 97 }} />
        <KpiTile label="CO₂ results in spec" value={compliance} unit="%" decimals={0} footnote="Last 100 lab results" />
        <KpiTile label="Open off-spec events" value={1} tone="critical" status={{ tone: 'critical', label: 'CO₂', shape: 'diamond' }} footnote="OS-0311 · ongoing 4 h 20 min" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Panel title="Wobbe index · X-bar chart" meta="MJ/Sm³ · n = 5">
            <ControlChart label="Wobbe index, subgroup means against fixed limits" values={WOBBE_SHIFTED} limits={WOBBE.xbar} categories={SUBGROUP_TIMES} unit="MJ/Sm³" decimals={2} height={200} />
          </Panel>
        </div>
        <div className="lg:col-span-2">
          <Panel title="Latest lab results" meta="12 Mar">
            <ul className="flex flex-col gap-3">
              {LAB_RESULTS.slice(0, 5).map((row) => (
                <li key={`${row.sampleId}-${row.parameter}`} className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate text-sm text-base-foreground">{row.parameter}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">Spec {specText(row).toLowerCase()}</span>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <ValueReadout size="xs" value={row.result} unit={row.unit} decimals={row.decimals} tone={inSpec(row) ? 'neutral' : 'critical'} />
                    {inSpec(row) ? null : <StatusIndicator size="sm" {...OUT_OF_SPEC} />}
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}

export default definePage({
  id: 'quality-and-spc',
  title: 'Quality and SPC',
  summary:
    'The kit for a quality app: control charts that separate signal from noise, capability against specification, lab samples from the sample point to the approved result, and what happens when a result is off spec.',
  guidance: {
    use: [
      'Control limits come from the process; specification limits come from the customer. Never draw one as the other.',
      'Mark every point that breaks a run rule and say which rule, so the reader knows why it is flagged.',
      'Print the specification next to every lab result, and the verdict in words.',
      'Read the range chart before the X-bar chart: the mean limits only hold while the spread is stable.',
    ],
    avoid: [
      'Recalculating control limits every time new data arrives; a shift would then hide itself.',
      'Reporting Cp without Cpk: a narrow process can still sit against a limit.',
      'Highlighting in-spec results in green; only the exceptions need colour.',
      'A certificate that shows results without method, specification and approver.',
    ],
  },
  source,
  sections: [
    {
      id: 'control-charts',
      title: 'Control charts',
      description: 'Subgroup means and ranges against limits calculated from the process itself.',
      specimens: [
        {
          id: 'QualitySpcXbarChart',
          title: 'X-bar chart',
          note: 'Pick it to watch the level of a process: subgroup means with centre line and control limits.',
          origin: 'custom',
          uses: ['industrial/domains/ControlChart.tsx', 'industrial/domains/spc.ts', 'industrial/StatusIndicator.tsx'],
          size: 'lg',
          align: 'stretch',
          Component: QualitySpcXbarChart,
        },
        {
          id: 'QualitySpcLimitsSummary',
          title: 'Control limit summary',
          note: 'Pick it next to a chart when the exact limits and where they come from must be on record.',
          origin: 'custom',
          uses: ['industrial/domains/spc.ts'],
          Component: QualitySpcLimitsSummary,
        },
        {
          id: 'QualitySpcRunRules',
          title: 'Run-rule violations',
          note: 'Pick it when the process is drifting: flagged points carry their rule number and the rules are listed.',
          origin: 'custom',
          uses: ['industrial/domains/ControlChart.tsx', 'industrial/domains/spc.ts'],
          size: 'md',
          align: 'stretch',
          Component: QualitySpcRunRules,
        },
        {
          id: 'QualitySpcRangeChart',
          title: 'Range chart',
          note: 'Pick it to watch the spread within subgroups; it pairs with every X-bar chart.',
          origin: 'custom',
          uses: ['industrial/domains/ControlChart.tsx', 'industrial/domains/spc.ts'],
          size: 'md',
          align: 'stretch',
          Component: QualitySpcRangeChart,
        },
        {
          id: 'QualitySpcXbarRPair',
          title: 'X-bar and R together',
          note: 'Pick it as the standard SPC view: both charts on one time axis, with a verdict and a reading of it.',
          origin: 'custom',
          uses: ['industrial/domains/ControlChart.tsx', 'industrial/domains/spc.ts', 'industrial/StatusIndicator.tsx'],
          size: 'full',
          align: 'stretch',
          Component: QualitySpcXbarRPair,
        },
      ],
    },
    {
      id: 'capability',
      title: 'Capability and compliance',
      description: 'How well the process fits its specification, as indices, distributions and headline figures.',
      specimens: [
        {
          id: 'QualitySpcCapability',
          title: 'Capability summary',
          note: 'Pick it to answer "can this process hold the spec": Cp, Cpk and the histogram between its limits.',
          origin: 'custom',
          uses: ['industrial/domains/CapabilitySummary.tsx', 'industrial/domains/spc.ts'],
          size: 'md',
          align: 'stretch',
          Component: QualitySpcCapability,
        },
        {
          id: 'QualitySpcCapabilityOffCentre',
          title: 'Capability, off centre',
          note: 'Pick it to see the marginal state: a good Cp with a poor Cpk, and a bar beyond the limit.',
          origin: 'custom',
          uses: ['industrial/domains/CapabilitySummary.tsx', 'industrial/domains/spc.ts'],
          size: 'md',
          align: 'stretch',
          Component: QualitySpcCapabilityOffCentre,
        },
        {
          id: 'QualitySpcComplianceTile',
          title: 'Spec compliance tile',
          note: 'Pick it for the headline quality figure on a dashboard, with its target and trend.',
          origin: 'custom',
          uses: ['industrial/KpiTile.tsx'],
          Component: QualitySpcComplianceTile,
        },
        {
          id: 'QualitySpcFirstPassYield',
          title: 'First-pass yield tile',
          note: 'Pick it to show how much product was right the first time, without blending or rework.',
          origin: 'custom',
          uses: ['industrial/KpiTile.tsx'],
          Component: QualitySpcFirstPassYield,
        },
        {
          id: 'QualitySpcGradeBadge',
          title: 'Quality grade badge',
          note: 'Pick it in product lists and batch headers: grade and verdict in one badge, with an icon per verdict.',
          origin: 'custom',
          Component: QualitySpcGradeBadge,
        },
        {
          id: 'QualitySpcParameterTrend',
          title: 'Parameter trend with spec band',
          note: 'Pick it for a parameter with a one-sided limit, to see the margin shrink before it is gone.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: QualitySpcParameterTrend,
        },
        {
          id: 'QualitySpcSpecGauges',
          title: 'Results against specification',
          note: 'Pick it to place the latest result of each parameter inside its spec band, two-sided or one-sided.',
          origin: 'custom',
          uses: ['industrial/RangeIndicator.tsx'],
          size: 'md',
          align: 'stretch',
          Component: QualitySpcSpecGauges,
        },
      ],
    },
    {
      id: 'lab',
      title: 'Lab samples',
      description: 'A sample from the sample point to an approved result.',
      specimens: [
        {
          id: 'QualitySpcSampleRow',
          title: 'Lab sample result',
          note: 'Pick it for one result: sample ID, time, analysis, and the result next to its specification.',
          origin: 'custom',
          uses: ['industrial/StatusIndicator.tsx', 'industrial/ValueReadout.tsx'],
          size: 'md',
          align: 'stretch',
          Component: QualitySpcSampleRow,
        },
        {
          id: 'QualitySpcSampleRowOutOfSpec',
          title: 'Out-of-spec result',
          note: 'Pick it to see the failing state: the number turns critical, the verdict says so, and a retest is offered.',
          origin: 'custom',
          uses: ['industrial/StatusIndicator.tsx', 'industrial/ValueReadout.tsx'],
          size: 'md',
          align: 'stretch',
          Component: QualitySpcSampleRowOutOfSpec,
        },
        {
          id: 'QualitySpcSampleFlow',
          title: 'Sample status flow',
          note: 'Pick it to show where a sample is between the sample point and an approved result.',
          origin: 'custom',
          uses: ['industrial/domains/StageFlow.tsx'],
          size: 'md',
          align: 'stretch',
          Component: QualitySpcSampleFlow,
        },
        {
          id: 'QualitySpcSampleFlowHeld',
          title: 'Sample held for retest',
          note: 'Pick it when a stage is held up: the current stage takes a warning tone and says why.',
          origin: 'custom',
          uses: ['industrial/domains/StageFlow.tsx'],
          size: 'md',
          align: 'stretch',
          Component: QualitySpcSampleFlowHeld,
        },
        {
          id: 'QualitySpcLabResultsTable',
          title: 'Lab results table',
          note: 'Pick it for the day’s results: out-of-spec rows are tinted, bold and marked in words.',
          origin: 'custom',
          uses: ['industrial/StatusIndicator.tsx'],
          size: 'lg',
          align: 'stretch',
          Component: QualitySpcLabResultsTable,
        },
        {
          id: 'QualitySpcSamplingSchedule',
          title: 'Sampling schedule',
          note: 'Pick it for the field operator: which samples are due today, where, and which are late.',
          origin: 'custom',
          uses: ['industrial/StatusIndicator.tsx'],
          Component: QualitySpcSamplingSchedule,
        },
      ],
    },
    {
      id: 'deviations',
      title: 'Deviations',
      description: 'What is recorded when product leaves its specification.',
      specimens: [
        {
          id: 'QualitySpcOffSpecEvents',
          title: 'Off-spec events',
          note: 'Pick it to list periods outside specification with peak, duration, volume affected and what was done with it.',
          origin: 'custom',
          uses: ['industrial/StatusIndicator.tsx'],
          size: 'md',
          align: 'stretch',
          Component: QualitySpcOffSpecEvents,
        },
        {
          id: 'QualitySpcDeviationCard',
          title: 'Non-conformance card',
          note: 'Pick it for a formal deviation: what happened, containment, root cause, owner and the next step.',
          origin: 'custom',
          uses: ['industrial/StatusIndicator.tsx'],
          size: 'md',
          align: 'stretch',
          Component: QualitySpcDeviationCard,
        },
      ],
    },
    {
      id: 'blocks',
      title: 'Full blocks',
      description: 'A quality dashboard section and the document that leaves with the product.',
      specimens: [
        {
          id: 'QualitySpcOverview',
          title: 'Quality overview',
          note: 'Pick it as the top of a quality dashboard: headline tiles, the control chart and the latest results.',
          origin: 'custom',
          uses: ['industrial/KpiTile.tsx', 'industrial/domains/ControlChart.tsx', 'industrial/domains/spc.ts', 'industrial/ValueReadout.tsx'],
          size: 'full',
          align: 'stretch',
          Component: QualitySpcOverview,
        },
        {
          id: 'QualitySpcCertificate',
          title: 'Certificate of analysis',
          note: 'Pick it for the document sent with a delivery: product, period, certified results with method and spec, and approval.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          Component: QualitySpcCertificate,
        },
      ],
    },
  ],
});
