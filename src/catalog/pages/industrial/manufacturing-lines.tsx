import { Button } from '@cognite/aura/components/button';
import { Card } from '@cognite/aura/components/card';
import { CheckboxGroup, CheckboxItem, CheckboxItemControl, CheckboxItemLabel } from '@cognite/aura/components/checkbox';
import { IconArrowRight } from '@cognite/aura/icons';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { LabelledProgress } from '../../../library/feedback/LabelledProgress';
import { CategoryChart } from '../../../library/industrial/charts/CategoryChart';
import { Histogram } from '../../../library/industrial/charts/Histogram';
import { ParetoChart } from '../../../library/industrial/charts/ParetoChart';
import { bucketize } from '../../../library/industrial/charts/stats';
import { ShareBarList } from '../../../library/industrial/domains/ShareBarList';
import { STATION_STATES, bottleneckIndex, firstPassYield, formatClock, stationStatus } from '../../../library/industrial/domains2/lines';
import type { StationState } from '../../../library/industrial/domains2/lines';
import { LineStatusStrip } from '../../../library/industrial/domains2/LineStatusStrip';
import { StationCard } from '../../../library/industrial/domains2/StationCard';
import { TaktIndicator } from '../../../library/industrial/domains2/TaktIndicator';
import { KpiTile } from '../../../library/industrial/KpiTile';
import { LinearGauge } from '../../../library/industrial/LinearGauge';
import { TONE_SURFACE, formatDelta, formatValue } from '../../../library/industrial/status';
import type { Tone } from '../../../library/industrial/status';
import { StatusDot } from '../../../library/industrial/StatusDot';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { TrendDelta } from '../../../library/industrial/TrendDelta';
import { ValueReadout } from '../../../library/industrial/ValueReadout';
import { makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './manufacturing-lines.tsx?raw';

const TH = 'px-3 py-2 text-left text-xs font-medium text-muted-foreground';
const TD = 'px-3 py-2.5 align-middle';
const TAKT = 45;

type Shape = 'dot' | 'ring' | 'square' | 'diamond';
type Verdict = { tone: Tone; label: string; shape: Shape };

type Station = {
  id: string;
  code: string;
  operation: string;
  state: StationState;
  detail?: string;
  /** Mean cycle time of the last 20 parts, in seconds. */
  cycleTime: number;
  count: number;
  started: number;
  passedFirstTime: number;
};

/** Line 3 at the Stord workshop: valve actuator assembly, eight stations, takt 45 seconds. */
const STATIONS: readonly Station[] = [
  { id: 'op10', code: 'OP 10', operation: 'Housing load', state: 'running', cycleTime: 38.4, count: 561, started: 566, passedFirstTime: 563 },
  { id: 'op20', code: 'OP 20', operation: 'Bearing press', state: 'running', cycleTime: 41.2, count: 556, started: 561, passedFirstTime: 549 },
  { id: 'op30', code: 'OP 30', operation: 'Gear fit', state: 'blocked', detail: 'Buffer to OP 40 full · 6 min', cycleTime: 40.6, count: 548, started: 556, passedFirstTime: 541 },
  { id: 'op40', code: 'OP 40', operation: 'Seal and torque', state: 'down', detail: 'Seal feeder jam · since 13:22', cycleTime: 46.8, count: 536, started: 548, passedFirstTime: 508 },
  { id: 'op50', code: 'OP 50', operation: 'Leak test', state: 'starved', detail: 'No parts from OP 40 · 5 min', cycleTime: 43.1, count: 534, started: 536, passedFirstTime: 521 },
  { id: 'op60', code: 'OP 60', operation: 'Function test', state: 'running', cycleTime: 42.5, count: 531, started: 534, passedFirstTime: 527 },
  { id: 'op70', code: 'OP 70', operation: 'Label and scan', state: 'running', cycleTime: 31.9, count: 530, started: 531, passedFirstTime: 530 },
  { id: 'op80', code: 'OP 80', operation: 'Pack out', state: 'idle', detail: 'Waiting for a full tray', cycleTime: 36.0, count: 528, started: 530, passedFirstTime: 528 },
];

const SHIFT_PLAN = 600;
const SHIFT_COUNT = STATIONS[STATIONS.length - 1].count;
const BOTTLENECK = STATIONS[bottleneckIndex(STATIONS.map((station) => station.cycleTime))];

function mfgLineStation(id: string): Station {
  const station = STATIONS.find((candidate) => candidate.id === id);
  if (!station) throw new Error(`Unknown station ${id}`);
  return station;
}

/** Hour by hour for the day shift, 06:00–14:00. Breaks at 08:00 and 11:00 lower the plan. */
const SHIFT_HOURS = [
  { hour: '06–07', plan: 80, actual: 78, note: '' },
  { hour: '07–08', plan: 80, actual: 81, note: '' },
  { hour: '08–09', plan: 60, actual: 58, note: 'Break' },
  { hour: '09–10', plan: 80, actual: 74, note: 'OP 40 seal misfeed, 5 min' },
  { hour: '10–11', plan: 80, actual: 80, note: '' },
  { hour: '11–12', plan: 60, actual: 52, note: 'Break, changeover to variant B' },
  { hour: '12–13', plan: 80, actual: 61, note: 'OP 40 slow after changeover' },
  { hour: '13–14', plan: 80, actual: 44, note: 'OP 40 down from 13:22' },
].map((row, index, rows) => ({
  ...row,
  cumulativePlan: rows.slice(0, index + 1).reduce((sum, entry) => sum + entry.plan, 0),
  cumulativeActual: rows.slice(0, index + 1).reduce((sum, entry) => sum + entry.actual, 0),
}));

/** Cycle times of the last 160 parts through OP 40, in seconds. The slow tail is the seal feeder. */
const CYCLE_SAMPLES = [...makeValues({ seed: 81, points: 130, base: 43.6, noise: 1.5, decimals: 1 }), ...makeValues({ seed: 82, points: 30, base: 49.5, noise: 1.8, decimals: 1 })];
const CYCLE_BINS = bucketize(CYCLE_SAMPLES, { bins: 14, min: 39, max: 53 });
const OVER_TAKT = CYCLE_SAMPLES.filter((value) => value > TAKT).length;

/** Parts scrapped or reworked this shift, by reason. */
const DEFECTS = [
  { reason: 'Seal nicked', scrap: 9, rework: 14 },
  { reason: 'Torque out of window', scrap: 2, rework: 15 },
  { reason: 'Leak test fail', scrap: 6, rework: 7 },
  { reason: 'Bearing not seated', scrap: 1, rework: 6 },
  { reason: 'Label unreadable', scrap: 0, rework: 1 },
];

/** Downtime this week by reason, in minutes. */
const DOWNTIME_REASONS = [
  { label: 'Seal feeder jam', value: 148 },
  { label: 'Changeover', value: 96 },
  { label: 'Material wait', value: 54 },
  { label: 'Torque tool', value: 41 },
  { label: 'Tester calibration', value: 22 },
  { label: 'Label printer', value: 12 },
  { label: 'Other', value: 9 },
];

type Buffer = { id: string; between: string; level: number; capacity: number; min: number; verdict?: Verdict };

const BUFFERS: readonly Buffer[] = [
  { id: 'b1', between: 'OP 10 → OP 20', level: 4, capacity: 12, min: 2 },
  { id: 'b2', between: 'OP 20 → OP 30', level: 9, capacity: 12, min: 2 },
  { id: 'b3', between: 'OP 30 → OP 40', level: 12, capacity: 12, min: 2, verdict: { tone: 'warning', label: 'Full, blocks OP 30', shape: 'square' } },
  { id: 'b4', between: 'OP 40 → OP 50', level: 0, capacity: 8, min: 2, verdict: { tone: 'info', label: 'Empty, starves OP 50', shape: 'ring' } },
  { id: 'b5', between: 'OP 50 → OP 60', level: 3, capacity: 8, min: 2 },
  { id: 'b6', between: 'OP 60 → OP 70', level: 5, capacity: 8, min: 2 },
];

const CHANGEOVER_STEPS = [
  { id: 'clear', label: 'Clear variant A parts from all buffers' },
  { id: 'fixture', label: 'Swap OP 30 gear fixture to B' },
  { id: 'torque', label: 'Load torque program TQ-B-07 at OP 40' },
  { id: 'label', label: 'Load label template for variant B' },
  { id: 'first', label: 'Run and approve first-off part' },
];

type AssistCall = { id: string; station: string; kind: string; raised: string; waited: string; who: string; verdict: Verdict };

const ASSIST_CALLS: readonly AssistCall[] = [
  { id: 'c-318', station: 'OP 40', kind: 'Maintenance', raised: '13:22', waited: '38 min', who: 'Tomás Barros on site', verdict: { tone: 'critical', label: 'Line stopped', shape: 'diamond' } },
  { id: 'c-319', station: 'OP 50', kind: 'Quality', raised: '13:41', waited: '19 min', who: 'Unassigned', verdict: { tone: 'warning', label: 'Waiting', shape: 'square' } },
  { id: 'c-317', station: 'OP 10', kind: 'Material', raised: '13:05', waited: 'Answered in 4 min', who: 'Jonas Nyberg', verdict: { tone: 'neutral', label: 'Closed', shape: 'ring' } },
];

type BoardLine = { id: string; name: string; product: string; state: StationState; count: number; plan: number; detail: string };

const BOARD: readonly BoardLine[] = [
  { id: 'l1', name: 'Line 1', product: 'Gate valve body', state: 'running', count: 412, plan: 400, detail: 'Takt 68 s' },
  { id: 'l2', name: 'Line 2', product: 'Ball valve trim', state: 'running', count: 688, plan: 700, detail: 'Takt 39 s' },
  { id: 'l3', name: 'Line 3', product: 'Actuator, variant B', state: 'down', count: SHIFT_COUNT, plan: SHIFT_PLAN, detail: 'OP 40 seal feeder · 38 min' },
  { id: 'l4', name: 'Line 4', product: 'Positioner', state: 'starved', count: 251, plan: 280, detail: 'Waiting for housings · 12 min' },
  { id: 'l5', name: 'Line 5', product: 'Pressure test', state: 'blocked', count: 334, plan: 340, detail: 'Dispatch lane full · 4 min' },
  { id: 'l6', name: 'Line 6', product: 'Spare parts kitting', state: 'idle', count: 96, plan: 96, detail: 'Order complete' },
];

const GATE_CHECKS: readonly { id: string; label: string; result: string; verdict: Verdict }[] = [
  { id: 'torque', label: 'Torque, 5 samples', result: '11.8–12.3 Nm', verdict: { tone: 'success', label: 'Pass', shape: 'dot' } },
  { id: 'leak', label: 'Leak rate, 5 samples', result: 'Max 0.8 mL/min', verdict: { tone: 'success', label: 'Pass', shape: 'dot' } },
  { id: 'visual', label: 'Seal visual, 13 samples', result: '2 nicked', verdict: { tone: 'critical', label: 'Fail', shape: 'diamond' } },
  { id: 'label', label: 'Label scan, all parts', result: '48 of 48', verdict: { tone: 'success', label: 'Pass', shape: 'dot' } },
];

const GENEALOGY = [
  { id: 'g1', serial: 'ACT-B-260312-0527', order: 'PO-88214', lots: ['HSG L2291', 'BRG L0417', 'SEAL L7730'], result: { tone: 'success', label: 'Shipped', shape: 'dot' } },
  { id: 'g2', serial: 'ACT-B-260312-0528', order: 'PO-88214', lots: ['HSG L2291', 'BRG L0417', 'SEAL L7731'], result: { tone: 'warning', label: 'On hold, seal lot', shape: 'square' } },
  { id: 'g3', serial: 'ACT-B-260312-0529', order: 'PO-88214', lots: ['HSG L2292', 'BRG L0417', 'SEAL L7731'], result: { tone: 'critical', label: 'Scrapped at OP 50', shape: 'diamond' } },
] satisfies readonly { id: string; serial: string; order: string; lots: readonly string[]; result: Verdict }[];

function Panel({ title, meta, children }: { title: string; meta?: ReactNode; children: ReactNode }) {
  return (
    <Card className="w-full min-w-0">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 className="text-sm font-medium text-base-foreground">{title}</h3>
        {meta ? <span className="text-xs tabular-nums text-muted-foreground">{meta}</span> : null}
      </div>
      {children}
    </Card>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="whitespace-nowrap tabular-nums text-base-foreground">{children}</dd>
    </div>
  );
}

function MfgLineStatusStrip() {
  return (
    <Panel title="Line 3, actuator assembly" meta="Flow left to right · 12 Mar, 14:00">
      <LineStatusStrip label="Line 3" stations={STATIONS.map((station) => ({ id: station.id, name: station.code, state: station.state, operation: station.operation }))} />
      <p className="text-xs text-muted-foreground">OP 40 is down. OP 30 upstream is blocked by a full buffer, and OP 50 downstream has run out of parts.</p>
    </Panel>
  );
}

function MfgLineBottleneck() {
  return (
    <Card className="w-full max-w-72 gap-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">Bottleneck, Line 3</span>
        <StatusIndicator size="sm" tone="critical" label="Over takt" shape="diamond" />
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="font-mono text-sm font-medium text-base-foreground">{BOTTLENECK.code}</span>
        <span className="text-xs text-muted-foreground">{BOTTLENECK.operation}</span>
      </div>
      <TaktIndicator cycleTime={BOTTLENECK.cycleTime} takt={TAKT} />
      <dl className="flex flex-col gap-1.5 text-xs">
        <Fact label="Line rate it allows">{formatValue(3600 / BOTTLENECK.cycleTime)} per hour</Fact>
        <Fact label="Rate at takt">{formatValue(3600 / TAKT)} per hour</Fact>
        <Fact label="Next slowest">OP 50 · 43.1 s</Fact>
      </dl>
    </Card>
  );
}

function MfgLineStationCard() {
  const station = mfgLineStation('op20');
  return (
    <div className="w-full max-w-72">
      <StationCard code={station.code} name={station.operation} state={station.state} cycleTime={station.cycleTime} takt={TAKT} count={station.count} target={560} />
    </div>
  );
}

function MfgLineStationBlocked() {
  const station = mfgLineStation('op30');
  return (
    <div className="w-full max-w-72">
      <StationCard code={station.code} name={station.operation} state={station.state} detail={station.detail} cycleTime={station.cycleTime} takt={TAKT} count={station.count} target={560} />
    </div>
  );
}

function MfgLineStationDown() {
  const station = mfgLineStation('op40');
  return (
    <div className="w-full max-w-72">
      <StationCard code={station.code} name={station.operation} state={station.state} detail={station.detail} cycleTime={station.cycleTime} takt={TAKT} count={station.count} target={560} />
    </div>
  );
}

function MfgLineStateLegend() {
  const meaning: Record<StationState, string> = {
    running: 'Making parts',
    idle: 'Nothing scheduled, or waiting to start',
    blocked: 'Finished part cannot leave: downstream is full',
    starved: 'No part to work on: upstream has not delivered',
    down: 'Stopped by a fault at this station',
  };
  return (
    <ul aria-label="Station states" className="flex w-full max-w-72 flex-col gap-3">
      {STATION_STATES.map((state) => (
        <li key={state} className="flex flex-col gap-0.5">
          <StatusIndicator {...stationStatus(state)} />
          <span className="pl-4 text-xs text-muted-foreground">{meaning[state]}</span>
        </li>
      ))}
    </ul>
  );
}

function MfgLineDowntimeClock() {
  return (
    <Card className="w-full max-w-72 gap-3">
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-sm font-medium text-base-foreground">OP 40</span>
        <StatusIndicator size="sm" {...stationStatus('down')} pulse />
      </div>
      <ValueReadout size="lg" value={38} unit="min stopped" tone="critical" />
      <dl className="flex flex-col gap-1.5 text-xs">
        <Fact label="Reason">Seal feeder jam</Fact>
        <Fact label="Stopped at">13:22</Fact>
        <Fact label="Maintenance on site">13:31</Fact>
        <Fact label="Parts lost so far">{formatValue((38 * 60) / TAKT)}</Fact>
      </dl>
    </Card>
  );
}

function MfgLineTaktStates() {
  return (
    <div className="flex w-full max-w-72 flex-col gap-5">
      <TaktIndicator label="OP 10 · Housing load" cycleTime={38.4} takt={TAKT} max={60} />
      <TaktIndicator label="OP 50 · Leak test" cycleTime={43.1} takt={TAKT} max={60} />
      <TaktIndicator label="OP 40 · Seal and torque" cycleTime={46.8} takt={TAKT} max={60} />
    </div>
  );
}

function MfgLineCountVsTarget() {
  const needed = SHIFT_PLAN - SHIFT_COUNT;
  return (
    <Card className="w-full max-w-72 gap-3">
      <span className="text-xs text-muted-foreground">Good parts, day shift</span>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <ValueReadout size="lg" value={SHIFT_COUNT} />
        <span className="text-sm tabular-nums text-muted-foreground">of {SHIFT_PLAN}</span>
      </div>
      <LinearGauge showHeader={false} label="Good parts against shift plan" value={SHIFT_COUNT} max={SHIFT_PLAN} target={SHIFT_PLAN} />
      <TrendDelta value={SHIFT_COUNT} reference={SHIFT_PLAN} decimals={0} goodDirection="up" caption="vs plan" />
      <dl className="flex flex-col gap-1.5 border-t border-default pt-3 text-xs">
        <Fact label="Rate, last hour">44 per hour</Fact>
        <Fact label="Planned rate">80 per hour</Fact>
        <Fact label="Short at shift end">{needed} parts</Fact>
      </dl>
    </Card>
  );
}

function MfgLineShiftTable() {
  return (
    <Panel title="Day shift by hour" meta="Line 3 · 12 March · good parts">
      <div className="w-full overflow-x-auto">
        <table aria-label="Production by hour for the day shift, plan against actual" className="w-full min-w-144 border-collapse text-sm">
          <thead>
            <tr>
              <th scope="col" className={`${TH} pl-0`}>
                Hour
              </th>
              <th scope="col" className={`${TH} text-right`}>
                Plan
              </th>
              <th scope="col" className={`${TH} text-right`}>
                Actual
              </th>
              <th scope="col" className={`${TH} text-right`}>
                Gap
              </th>
              <th scope="col" className={`${TH} text-right`}>
                Cumulative
              </th>
              <th scope="col" className={`${TH} pr-0`}>
                Note
              </th>
            </tr>
          </thead>
          <tbody>
            {SHIFT_HOURS.map((row) => {
              const gap = row.actual - row.plan;
              const tone = gap <= -10 ? 'text-critical-foreground-strong' : gap < -3 ? 'text-warning-foreground-strong' : 'text-medium-foreground';
              return (
                <tr key={row.hour} className="border-t border-default">
                  <th scope="row" className={`${TD} whitespace-nowrap pl-0 text-left font-normal tabular-nums text-medium-foreground`}>
                    {row.hour}
                  </th>
                  <td className={`${TD} text-right tabular-nums text-medium-foreground`}>{row.plan}</td>
                  <td className={`${TD} text-right tabular-nums text-base-foreground`}>{row.actual}</td>
                  <td className={`${TD} text-right tabular-nums ${tone}`}>{formatDelta(gap)}</td>
                  <td className={`${TD} whitespace-nowrap text-right tabular-nums text-base-foreground`}>
                    {row.cumulativeActual} <span className="text-muted-foreground">of {row.cumulativePlan}</span>
                  </td>
                  <td className={`${TD} pr-0 text-xs text-muted-foreground`}>{row.note}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function MfgLineChangeover() {
  const [done, setDone] = useState<readonly string[]>(['clear', 'fixture', 'torque']);
  const elapsed = 12 * 60 + 5;
  const target = 18 * 60;
  const toggle = (id: string, checked: boolean) => setDone((current) => (checked ? [...current, id] : current.filter((entry) => entry !== id)));
  return (
    <Panel title="Changeover, variant A to B" meta="Line 3 · started 11:20">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-3xl font-semibold tabular-nums tracking-tight text-base-foreground">{formatClock(elapsed)}</span>
        <span className="text-sm tabular-nums text-muted-foreground">of {formatClock(target)} target</span>
      </div>
      <LabelledProgress label="Changeover time used" value={elapsed} max={target} valueText={`${formatClock(target - elapsed)} left`} size="sm" />
      <CheckboxGroup aria-label="Changeover checklist" className="w-full">
        {CHANGEOVER_STEPS.map((step) => (
          <CheckboxItem key={step.id}>
            <CheckboxItemControl checked={done.includes(step.id)} onCheckedChange={(checked) => toggle(step.id, checked)} />
            <CheckboxItemLabel>{step.label}</CheckboxItemLabel>
          </CheckboxItem>
        ))}
      </CheckboxGroup>
      <p className="text-xs tabular-nums text-muted-foreground">
        {done.length} of {CHANGEOVER_STEPS.length} steps done{done.length === CHANGEOVER_STEPS.length ? '. Ready to release the line.' : '. The line stays locked until the first-off part is approved.'}
      </p>
    </Panel>
  );
}

function MfgLineWipBuffers() {
  return (
    <Panel title="WIP buffers" meta="Parts between stations">
      <ul aria-label="Buffer levels between stations" className="flex w-full flex-col gap-3">
        {BUFFERS.map((buffer) => (
          <li key={buffer.id} className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <span className="font-mono text-xs text-base-foreground">{buffer.between}</span>
              <span className="flex items-baseline gap-3">
                {buffer.verdict ? <StatusIndicator size="sm" {...buffer.verdict} /> : null}
                <span className="text-xs tabular-nums text-medium-foreground">
                  {buffer.level} of {buffer.capacity}
                </span>
              </span>
            </div>
            <LinearGauge
              showHeader={false}
              size="sm"
              label={`Buffer ${buffer.between}`}
              value={buffer.level}
              max={buffer.capacity}
              target={buffer.min}
              tone={buffer.verdict ? buffer.verdict.tone : 'neutral'}
            />
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground">The tick is the minimum that keeps the next station fed through a short stop.</p>
    </Panel>
  );
}

function MfgLineCycleHistogram() {
  return (
    <Panel title="Cycle time distribution, OP 40" meta="Last 160 parts">
      <Histogram
        label={`Distribution of OP 40 cycle times against the takt of 45 seconds; ${OVER_TAKT} of ${CYCLE_SAMPLES.length} cycles were over takt`}
        bins={CYCLE_BINS}
        unit="s"
        decimals={0}
        countLabel="cycles"
        limits={[{ value: TAKT, label: 'Takt 45', tone: 'critical' }]}
        outside={{ high: TAKT, tone: 'critical' }}
        heightClassName="h-48"
        summary={`${OVER_TAKT} of ${CYCLE_SAMPLES.length} cycles over takt. Two humps: normal cycles near 44 s, and a slow group near 50 s when the seal is re-fed.`}
      />
    </Panel>
  );
}

function MfgLineScrapByReason() {
  const scrap = DEFECTS.reduce((sum, row) => sum + row.scrap, 0);
  const rework = DEFECTS.reduce((sum, row) => sum + row.rework, 0);
  return (
    <Panel title="Scrap and rework by reason" meta={`Day shift · ${scrap} scrapped, ${rework} reworked`}>
      <CategoryChart
        label="Parts scrapped and reworked this shift by reason; nicked seals and torque faults account for two thirds"
        rows={DEFECTS}
        categoryKey="reason"
        layout="rows"
        series={[
          { key: 'scrap', label: 'Scrap', stack: 'defects', color: 'var(--color-chart-1-450)' },
          { key: 'rework', label: 'Rework', stack: 'defects', color: 'var(--color-chart-1-200)' },
        ]}
        axisWidth={132}
        legend
        heightClassName="h-52"
        summary="Three of the five reasons trace back to OP 40."
      />
    </Panel>
  );
}

function MfgLineFirstPassYield() {
  const items = STATIONS.map((station) => {
    const value = firstPassYield(station.passedFirstTime, station.started) ?? 0;
    return { id: station.id, label: station.code, value, detail: station.operation, tone: value < 95 ? ('warning' as const) : undefined };
  });
  const rolled = items.reduce((product, item) => product * (item.value / 100), 1) * 100;
  return (
    <Panel title="First-pass yield per station" meta={`Rolled throughput ${formatValue(rolled, 1)} %`}>
      <ShareBarList label="First-pass yield per station, day shift" items={items} unit="%" decimals={1} max={100} />
    </Panel>
  );
}

function MfgLineQualityGate() {
  return (
    <Card className="w-full max-w-80 gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-base-foreground">Quality gate, end of line</span>
          <span className="font-mono text-xs text-muted-foreground">Lot L3-260312-B2 · 48 parts</span>
        </div>
        <StatusIndicator variant="badge" tone="critical" label="Hold" />
      </div>
      <ul aria-label="Gate checks" className="flex flex-col">
        {GATE_CHECKS.map((check) => (
          <li key={check.id} className="flex items-center justify-between gap-3 border-t border-default py-2 text-xs last:pb-0">
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="text-base-foreground">{check.label}</span>
              <span className="tabular-nums text-muted-foreground">{check.result}</span>
            </span>
            <StatusIndicator size="sm" {...check.verdict} />
          </li>
        ))}
      </ul>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm">
          View samples
        </Button>
        <Button variant="secondary" size="sm">
          Start sorting
        </Button>
      </div>
    </Card>
  );
}

function MfgLineYieldTile() {
  return (
    <div className="w-full max-w-72">
      <KpiTile
        label="First-pass yield, Line 3"
        value={92.9}
        unit="%"
        decimals={1}
        status={{ tone: 'warning', label: 'Below target', shape: 'square' }}
        delta={{ reference: 95.6, goodDirection: 'up', caption: 'vs last shift', decimals: 1 }}
        target={{ value: 96 }}
        trend={{ values: [96.1, 95.8, 96.4, 95.2, 95.9, 95.6, 92.9], variant: 'bar', label: 'First-pass yield, last 7 shifts' }}
      />
    </div>
  );
}

function MfgLineGenealogy() {
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 className="text-sm font-medium text-base-foreground">Unit genealogy</h3>
        <span className="text-xs text-muted-foreground">Order PO-88214 · seal lot L7731 under investigation</span>
      </div>
      <ul aria-label="Units with their component lots" className="flex w-full flex-col">
        {GENEALOGY.map((unit) => (
          <li key={unit.id} className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-default py-3 first:border-t-0 last:pb-0">
            <div className="flex w-48 flex-col gap-0.5">
              <span className="font-mono text-sm text-base-foreground">{unit.serial}</span>
              <span className="font-mono text-xs text-muted-foreground">{unit.order}</span>
            </div>
            <ul aria-label={`Component lots of ${unit.serial}`} className="flex flex-1 flex-wrap items-center gap-1.5">
              {unit.lots.map((lot) => (
                <li key={lot} className={`rounded-md px-1.5 py-0.5 font-mono text-xs ${lot === 'SEAL L7731' ? TONE_SURFACE.warning : 'bg-muted-background text-medium-foreground'}`}>
                  {lot}
                </li>
              ))}
            </ul>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              OP 10 <IconArrowRight aria-hidden className="size-3" /> OP 80
            </span>
            <StatusIndicator size="sm" {...unit.result} className="w-40" />
          </li>
        ))}
      </ul>
    </div>
  );
}

function MfgLineDowntimePareto() {
  return (
    <Panel title="Downtime reasons" meta="Line 3 · this week · minutes">
      <ParetoChart label="Downtime by reason on Line 3 this week" rows={DOWNTIME_REASONS} unit="min" valueLabel="Downtime" wrapLabels legend heightClassName="h-60" />
    </Panel>
  );
}

function MfgLineAssistCalls() {
  return (
    <Panel title="Operator calls" meta="Line 3 · last hour">
      <ul aria-label="Operator assist requests" className="flex w-full flex-col">
        {ASSIST_CALLS.map((call) => (
          <li key={call.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-default py-3 first:border-t-0 first:pt-0 last:pb-0">
            <div className="flex min-w-0 flex-1 basis-40 flex-col gap-0.5">
              <span className="text-sm text-base-foreground">
                <span className="font-mono">{call.station}</span> · {call.kind}
              </span>
              <span className="text-xs tabular-nums text-muted-foreground">
                Raised {call.raised} · {call.waited} · {call.who}
              </span>
            </div>
            <StatusIndicator size="sm" {...call.verdict} pulse={call.verdict.tone === 'critical'} />
            {call.who === 'Unassigned' ? (
              <Button variant="secondary" size="sm">
                Take call
              </Button>
            ) : null}
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function MfgLineAndonBoard() {
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 className="text-base font-semibold text-base-foreground">Stord workshop</h3>
        <span className="text-xs tabular-nums text-muted-foreground">Day shift · 12 Mar, 14:00</span>
      </div>
      <ul aria-label="Andon board, all lines" className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {BOARD.map((line) => {
          const status = stationStatus(line.state);
          return (
            <li key={line.id} className={`flex min-w-0 flex-col gap-3 rounded-xl p-4 ${line.state === 'running' ? 'bg-muted-background text-base-foreground' : TONE_SURFACE[status.tone]}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-lg font-semibold leading-none">{line.name}</span>
                  <span className="text-xs opacity-80">{line.product}</span>
                </div>
                <span className="flex items-center gap-1.5 text-sm font-medium">
                  <StatusDot tone={status.tone} shape={status.shape} />
                  {status.label}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-semibold tabular-nums tracking-tight">{formatValue(line.count)}</span>
                <span className="text-sm tabular-nums opacity-80">of {formatValue(line.plan)}</span>
                <span className="ml-auto text-sm font-medium tabular-nums">{formatDelta(line.count - line.plan)}</span>
              </div>
              <span className="text-xs opacity-80">{line.detail}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function MfgLineOverview() {
  const shown = ['op30', 'op40', 'op50'].map(mfgLineStation);
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="text-base font-semibold text-base-foreground">Line 3, actuator assembly</h3>
        <span className="text-xs tabular-nums text-muted-foreground">Day shift · takt {TAKT} s · variant B since 11:38</span>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiTile size="compact" label="Good parts" value={SHIFT_COUNT} delta={{ reference: SHIFT_PLAN, goodDirection: 'up', caption: 'vs plan', decimals: 0 }} target={{ value: SHIFT_PLAN, label: 'Plan' }} />
        <KpiTile size="compact" label="Rate, last hour" value={44} unit="per hour" status={{ tone: 'critical', label: 'Line stopped', shape: 'diamond' }} target={{ value: 80 }} />
        <KpiTile size="compact" label="First-pass yield" value={92.9} unit="%" decimals={1} delta={{ reference: 95.6, goodDirection: 'up', caption: 'vs last shift', decimals: 1 }} />
        <KpiTile size="compact" label="Downtime, shift" value={51} unit="min" delta={{ reference: 14, goodDirection: 'down', caption: 'vs last shift', decimals: 0 }} />
      </div>
      <LineStatusStrip label="Line 3" stations={STATIONS.map((station) => ({ id: station.id, name: station.code, state: station.state, operation: station.operation }))} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {shown.map((station, index) => (
          <StationCard
            key={station.id}
            code={station.code}
            name={station.operation}
            state={station.state}
            detail={station.detail}
            cycleTime={station.cycleTime}
            takt={TAKT}
            count={station.count}
            target={560 - index * 4}
          />
        ))}
      </div>
    </div>
  );
}

export default definePage({
  id: 'manufacturing-lines',
  title: 'Manufacturing lines',
  summary:
    'The kit for discrete manufacturing applications: line and station state, cycle time against takt, count against plan, changeovers, buffers, quality gates and the losses behind a missed shift target.',
  guidance: {
    use: [
      'Five station states with words and shapes: running, idle, blocked, starved and down.',
      'Cycle time against takt wherever pace is shown; the gap in seconds is the message.',
      'Stations in flow order, so blocked and starved point to the station that causes them.',
      'Plan, actual and cumulative together, hour by hour, with a note where they part.',
    ],
    avoid: [
      'Treating blocked and starved as downtime of the station that shows them.',
      'A count without its plan for this point in the shift.',
      'Timers that keep running in a screenshot; show elapsed against a target.',
      'Colouring every running station green; the board should point at the exception.',
    ],
  },
  source,
  sections: [
    {
      id: 'line-and-stations',
      title: 'Line and stations',
      description: 'Where the flow is broken, and which station sets the pace.',
      specimens: [
        {
          id: 'MfgLineStatusStrip',
          title: 'Line status strip',
          note: 'The whole line in one row, to see which station stops the flow and which only suffer from it.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['industrial/domains2/LineStatusStrip.tsx', 'industrial/domains2/lines.ts'],
          Component: MfgLineStatusStrip,
        },
        {
          id: 'MfgLineBottleneck',
          title: 'Bottleneck indicator',
          note: 'Naming the constraint: the slowest station and the line rate it allows.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/domains2/TaktIndicator.tsx', 'industrial/domains2/lines.ts', 'industrial/StatusIndicator.tsx'],
          Component: MfgLineBottleneck,
        },
        {
          id: 'MfgLineStationCard',
          title: 'Station card',
          note: 'One station keeping pace: cycle time against takt and count against plan.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/domains2/StationCard.tsx', 'industrial/domains2/TaktIndicator.tsx', 'industrial/domains2/lines.ts'],
          Component: MfgLineStationCard,
        },
        {
          id: 'MfgLineStationBlocked',
          title: 'Station blocked',
          note: 'A healthy station that cannot hand its part on; the card says what it waits for.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/domains2/StationCard.tsx', 'industrial/domains2/TaktIndicator.tsx', 'industrial/domains2/lines.ts'],
          Component: MfgLineStationBlocked,
        },
        {
          id: 'MfgLineStationDown',
          title: 'Station down and over takt',
          note: 'The station that causes the stop, with its fault and a cycle time that was already too slow.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/domains2/StationCard.tsx', 'industrial/domains2/TaktIndicator.tsx', 'industrial/domains2/lines.ts'],
          Component: MfgLineStationDown,
        },
        {
          id: 'MfgLineStateLegend',
          title: 'Station states',
          note: 'The five states and what each means, as a legend beside a line view.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/domains2/lines.ts', 'industrial/StatusIndicator.tsx'],
          Component: MfgLineStateLegend,
        },
        {
          id: 'MfgLineTaktStates',
          title: 'Cycle time against takt',
          note: 'The three verdicts side by side: slack, no slack and over takt.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/domains2/TaktIndicator.tsx', 'industrial/domains2/lines.ts'],
          Component: MfgLineTaktStates,
        },
        {
          id: 'MfgLineDowntimeClock',
          title: 'Current stop',
          note: 'A stop in progress: how long, why, and when help arrived.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/domains2/lines.ts', 'industrial/StatusIndicator.tsx', 'industrial/ValueReadout.tsx'],
          Component: MfgLineDowntimeClock,
        },
      ],
    },
    {
      id: 'count-and-pace',
      title: 'Count, pace and changeover',
      description: 'Whether the shift will make its number, and what stands between variants.',
      specimens: [
        {
          id: 'MfgLineShiftTable',
          title: 'Shift production by hour',
          note: 'The hour-by-hour board: plan, actual and cumulative, with a note on every hour that fell short.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          Component: MfgLineShiftTable,
        },
        {
          id: 'MfgLineCountVsTarget',
          title: 'Count against target with rate',
          note: 'The number above the line: parts made, the plan and the rate it is running at.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/LinearGauge.tsx', 'industrial/TrendDelta.tsx', 'industrial/ValueReadout.tsx'],
          Component: MfgLineCountVsTarget,
        },
        {
          id: 'MfgLineChangeover',
          title: 'Changeover timer and checklist',
          note: 'A changeover in progress: time used against target and the steps left before release. Tick a step to try.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['feedback/LabelledProgress.tsx', 'industrial/domains2/lines.ts'],
          Component: MfgLineChangeover,
        },
        {
          id: 'MfgLineWipBuffers',
          title: 'WIP buffer levels',
          note: 'Parts waiting between stations, where a full or an empty buffer explains a blocked or starved neighbour.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/LinearGauge.tsx', 'industrial/StatusIndicator.tsx'],
          Component: MfgLineWipBuffers,
        },
      ],
    },
    {
      id: 'quality',
      title: 'Cycle times and quality',
      description: 'How consistent the work is, and what it costs when it is not.',
      specimens: [
        {
          id: 'MfgLineCycleHistogram',
          title: 'Cycle-time histogram with takt',
          note: 'Whether a station is slow all the time or only sometimes, which point to different fixes.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/Histogram.tsx', 'industrial/charts/stats.ts'],
          Component: MfgLineCycleHistogram,
        },
        {
          id: 'MfgLineScrapByReason',
          title: 'Scrap and rework by reason',
          note: 'Defects ranked by reason, split into parts lost and parts saved.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/CategoryChart.tsx'],
          Component: MfgLineScrapByReason,
        },
        {
          id: 'MfgLineFirstPassYield',
          title: 'First-pass yield per station',
          note: 'Finding the station where parts fail first time, and what the losses multiply to.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/domains/ShareBarList.tsx', 'industrial/domains2/lines.ts'],
          Component: MfgLineFirstPassYield,
        },
        {
          id: 'MfgLineQualityGate',
          title: 'Quality gate result',
          note: 'A lot at the end-of-line gate, with each check, its result and the decision.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/StatusIndicator.tsx'],
          Component: MfgLineQualityGate,
        },
        {
          id: 'MfgLineYieldTile',
          title: 'First-pass yield tile',
          note: 'Line quality as one figure, shift by shift, against its target.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/KpiTile.tsx'],
          Component: MfgLineYieldTile,
        },
        {
          id: 'MfgLineGenealogy',
          title: 'Batch and lot genealogy rows',
          note: 'Tracing units to the component lots built into them, to scope a hold or a recall.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['industrial/StatusIndicator.tsx', 'industrial/status.ts'],
          Component: MfgLineGenealogy,
        },
      ],
    },
    {
      id: 'losses-and-calls',
      title: 'Losses and calls',
      description: 'What stopped the line, and who is being asked to help.',
      specimens: [
        {
          id: 'MfgLineDowntimePareto',
          title: 'Downtime reasons Pareto',
          note: 'Picking what to fix first: the few reasons behind most of the lost minutes.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/ParetoChart.tsx'],
          Component: MfgLineDowntimePareto,
        },
        {
          id: 'MfgLineAssistCalls',
          title: 'Operator call rows',
          note: 'Assist requests from the line, with how long each has waited and who has it.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/StatusIndicator.tsx'],
          Component: MfgLineAssistCalls,
        },
        {
          id: 'MfgLineAndonBoard',
          title: 'Andon status board',
          note: 'Every line on one wall display, readable from across the hall, with exceptions tinted.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['industrial/domains2/lines.ts', 'industrial/StatusDot.tsx', 'industrial/status.ts'],
          Component: MfgLineAndonBoard,
        },
      ],
    },
    {
      id: 'full-blocks',
      title: 'Full blocks',
      description: 'The pieces combined into a line view.',
      specimens: [
        {
          id: 'MfgLineOverview',
          title: 'Line overview',
          note: 'The team leader view of one line: shift figures, the strip and the stations around the stop.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['industrial/domains2/LineStatusStrip.tsx', 'industrial/domains2/StationCard.tsx', 'industrial/domains2/lines.ts', 'industrial/KpiTile.tsx'],
          Component: MfgLineOverview,
        },
      ],
    },
  ],
});
