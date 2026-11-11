import { Button } from '@cognite/aura/components/button';
import { Card } from '@cognite/aura/components/card';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@cognite/aura/components/dialog';
import { Input } from '@cognite/aura/components/input';
import { Label } from '@cognite/aura/components/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@cognite/aura/components/select';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { CategoryChart } from '../../../library/industrial/charts/CategoryChart';
import { ParetoChart } from '../../../library/industrial/charts/ParetoChart';
import { KpiTile } from '../../../library/industrial/KpiTile';
import { LinearGauge } from '../../../library/industrial/LinearGauge';
import { alignByPhase, alignTime, deviationScore, phaseDurations } from '../../../library/industrial/safety/goldenBatch';
import type { BatchPhase, BatchPoint } from '../../../library/industrial/safety/goldenBatch';
import { GoldenBatchChart } from '../../../library/industrial/safety/GoldenBatchChart';
import { PhaseTimeline } from '../../../library/industrial/safety/PhaseTimeline';
import type { TimelinePhase } from '../../../library/industrial/safety/PhaseTimeline';
import type { DotShape, Tone } from '../../../library/industrial/status';
import { formatDelta, formatValue } from '../../../library/industrial/status';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { TrendDelta } from '../../../library/industrial/TrendDelta';
import { ValueReadout } from '../../../library/industrial/ValueReadout';
import { SignOffBlock } from '../../../library/industrial/workflows/SignOffBlock';
import type { SignOffSigner } from '../../../library/industrial/workflows/SignOffBlock';
import { StepList } from '../../../library/industrial/workflows/StepList';
import type { StepListItem } from '../../../library/industrial/workflows/StepList';
import { deviation } from '../../../library/industrial/workflows/workflow';
import { createRandom } from '../../data/series';
import { definePage } from '../../types';

import source from './batch-and-recipe.tsx?raw';

const TH = 'px-3 py-2 text-left text-xs font-medium text-muted-foreground';
const TD = 'px-3 py-2.5 align-middle';

const BATCH = { id: 'B-2603-118', recipe: 'R-CI40 v7', product: 'Corrosion inhibitor CI-40', vessel: '62-RA-6201', site: 'Stord terminal', started: '12 Mar, 12:02', size: '5 200 kg' };

const GOLDEN_PHASES: BatchPhase[] = [
  { id: 'charge', label: 'Charge', start: 0, end: 20 },
  { id: 'heat', label: 'Heat', start: 20, end: 60 },
  { id: 'react', label: 'React', start: 60, end: 150 },
  { id: 'hold', label: 'Hold', start: 150, end: 180 },
  { id: 'cool', label: 'Cool', start: 180, end: 230 },
  { id: 'transfer', label: 'Transfer', start: 230, end: 250 },
];

const GOLDEN: BatchPoint[] = [
  { t: 0, v: 20 },
  { t: 20, v: 22 },
  { t: 60, v: 85 },
  { t: 150, v: 86 },
  { t: 180, v: 86 },
  { t: 230, v: 35 },
  { t: 250, v: 34 },
];

const CURRENT_PHASES: BatchPhase[] = [
  { id: 'charge', label: 'Charge', start: 0, end: 18 },
  { id: 'heat', label: 'Heat', start: 18, end: 64 },
  { id: 'react', label: 'React', start: 64, end: 118, complete: false },
];

function rawProfile(): BatchPoint[] {
  const random = createRandom(2603118);
  const points: BatchPoint[] = [];
  for (let t = 0; t <= 118; t += 4) {
    const aligned = alignTime(t, CURRENT_PHASES, GOLDEN_PHASES) ?? 0;
    const upper = GOLDEN.findIndex((point) => point.t >= aligned);
    const a = GOLDEN[Math.max(upper - 1, 0)];
    const b = GOLDEN[Math.max(upper, 0)];
    const base = b.t === a.t ? b.v : a.v + ((b.v - a.v) * (aligned - a.t)) / (b.t - a.t);
    const bump = t >= 92 && t <= 106 ? 4.5 : 0;
    points.push({ t, v: Math.round((base + (random() - 0.5) * 1.6 + bump) * 10) / 10 });
  }
  return points;
}

const RAW = rawProfile();
const ALIGNED = alignByPhase(RAW, CURRENT_PHASES, GOLDEN_PHASES);

const TIMELINE: TimelinePhase[] = [
  { id: 'charge', label: 'Charge', expected: 20, actual: 18, state: 'done' },
  { id: 'heat', label: 'Heat', expected: 40, actual: 46, state: 'done' },
  { id: 'react', label: 'React', expected: 90, actual: 54, state: 'current' },
  { id: 'hold', label: 'Hold', expected: 30, actual: null, state: 'upcoming' },
  { id: 'cool', label: 'Cool', expected: 50, actual: null, state: 'upcoming' },
  { id: 'transfer', label: 'Transfer', expected: 20, actual: null, state: 'upcoming' },
];

type BatchState = 'running' | 'hold' | 'complete' | 'released' | 'rejected' | 'planned';

const BATCH_STATUS: Record<BatchState, { tone: Tone; label: string; shape: DotShape }> = {
  running: { tone: 'info', label: 'Running', shape: 'dot' },
  hold: { tone: 'warning', label: 'On hold', shape: 'square' },
  complete: { tone: 'neutral', label: 'Complete, awaiting release', shape: 'ring' },
  released: { tone: 'success', label: 'Released', shape: 'dot' },
  rejected: { tone: 'critical', label: 'Rejected', shape: 'diamond' },
  planned: { tone: 'neutral', label: 'Planned', shape: 'ring' },
};

const BATCHES: readonly { id: string; recipe: string; product: string; vessel: string; state: BatchState; cycle: number | null; yieldPct: number | null; energy: number | null }[] = [
  { id: 'B-2603-118', recipe: 'R-CI40 v7', product: 'CI-40', vessel: '62-RA-6201', state: 'running', cycle: null, yieldPct: null, energy: null },
  { id: 'B-2603-117', recipe: 'R-DM12 v3', product: 'DM-12 demulsifier', vessel: '62-RA-6202', state: 'hold', cycle: null, yieldPct: null, energy: null },
  { id: 'B-2603-116', recipe: 'R-CI40 v7', product: 'CI-40', vessel: '62-RA-6201', state: 'complete', cycle: 238, yieldPct: 98.4, energy: 61.2 },
  { id: 'B-2603-115', recipe: 'R-CI40 v7', product: 'CI-40', vessel: '62-RA-6201', state: 'released', cycle: 247, yieldPct: 98.9, energy: 62.8 },
  { id: 'B-2603-114', recipe: 'R-DM12 v3', product: 'DM-12 demulsifier', vessel: '62-RA-6202', state: 'rejected', cycle: 251, yieldPct: 91.2, energy: 66.4 },
  { id: 'B-2603-113', recipe: 'R-CI40 v7', product: 'CI-40', vessel: '62-RA-6201', state: 'released', cycle: 244, yieldPct: 99.1, energy: 62.0 },
  { id: 'B-2603-119', recipe: 'R-CI40 v7', product: 'CI-40', vessel: '62-RA-6201', state: 'planned', cycle: null, yieldPct: null, energy: null },
];

const STEPS = [
  { no: 1, step: 'Charge solvent SV-9012', parameter: 'Mass', unit: 'kg', setpoint: 2400, actual: 2398.6, tolerance: 12, decimals: 1 },
  { no: 2, step: 'Charge ethoxylate EO-5521', parameter: 'Mass', unit: 'kg', setpoint: 1800, actual: 1803.2, tolerance: 9, decimals: 1 },
  { no: 3, step: 'Heat to reaction temperature', parameter: 'Temperature', unit: '°C', setpoint: 85, actual: 85.2, tolerance: 2, decimals: 1 },
  { no: 4, step: 'Start agitator', parameter: 'Speed', unit: 'rpm', setpoint: 120, actual: 120, tolerance: 5, decimals: 0 },
  { no: 5, step: 'Dose amine AM-3307 over 30 min', parameter: 'Mass', unit: 'kg', setpoint: 640, actual: 640.4, tolerance: 4, decimals: 1 },
  { no: 6, step: 'Hold reaction temperature', parameter: 'Temperature', unit: '°C', setpoint: 85, actual: 87.9, tolerance: 2, decimals: 1 },
  { no: 7, step: 'Keep reactor pressure', parameter: 'Pressure', unit: 'barg', setpoint: 1.2, actual: 1.25, tolerance: 0.1, decimals: 2 },
  { no: 8, step: 'Cool to transfer temperature', parameter: 'Temperature', unit: '°C', setpoint: 35, actual: null, tolerance: 2, decimals: 1 },
];

const ADDITIONS = [
  { time: '12:04', material: 'Solvent SV-9012', lot: 'SV-9012-2602-07', planned: 2400, actual: 2398.6, by: 'Ingrid Haugen' },
  { time: '12:17', material: 'Ethoxylate EO-5521', lot: 'EO-5521-2601-33', planned: 1800, actual: 1803.2, by: 'Ingrid Haugen' },
  { time: '13:08', material: 'Amine AM-3307', lot: 'AM-3307-2602-12', planned: 640, actual: 640.4, by: 'Tomás Barros' },
  { time: '13:41', material: 'Catalyst CT-0214', lot: 'CT-0214-2512-02', planned: 12, actual: 12.1, by: 'Tomás Barros' },
];

const EQUIPMENT_ROWS = [
  { vessel: '62-RA-6201', name: 'Reactor 1', bookings: [{ id: 'B-116', from: 0, to: 4, state: 'done' }, { id: 'B-118', from: 6, to: 10.2, state: 'running' }, { id: 'B-119', from: 12, to: 16.2, state: 'planned' }] },
  { vessel: '62-RA-6202', name: 'Reactor 2', bookings: [{ id: 'B-114', from: 0, to: 3, state: 'done' }, { id: 'B-117', from: 5, to: 9, state: 'hold' }, { id: 'B-120', from: 14, to: 18, state: 'planned' }] },
  { vessel: '62-TK-6210', name: 'Transfer tank', bookings: [{ id: 'B-116', from: 4, to: 5, state: 'done' }, { id: 'B-118', from: 10.2, to: 11.2, state: 'planned' }] },
];

const FOCUS_BAR: Record<string, string> = {
  done: 'bg-chart-1-300',
  running: 'bg-chart-1-450',
  hold: 'bg-chart-warning-450',
  planned: 'border border-dashed border-emphasized',
};

const PARAMETER_CHANGES = [
  { at: '12 Mar, 13:22', who: 'Aisha Khan', parameter: 'React temperature setpoint', from: '85.0 °C', to: '86.0 °C', why: 'Viscosity trending high in the sample' },
  { at: '12 Mar, 12:47', who: 'Ingrid Haugen', parameter: 'Agitator speed', from: '110 rpm', to: '120 rpm', why: 'Recipe R-CI40 v7 step 4' },
  { at: '11 Mar, 16:10', who: 'Aisha Khan', parameter: 'Recipe R-CI40 version', from: 'v6', to: 'v7', why: 'Approved by change request MoC-0219' },
];

const GENEALOGY = {
  lots: [
    { id: 'SV-9012-2602-07', label: 'Solvent' },
    { id: 'EO-5521-2601-33', label: 'Ethoxylate' },
    { id: 'AM-3307-2602-12', label: 'Amine' },
    { id: 'CT-0214-2512-02', label: 'Catalyst' },
  ],
  outputs: [
    { id: 'CI40-260312-A', label: 'IBC 0451, 1 000 kg' },
    { id: 'CI40-260312-B', label: 'IBC 0452, 1 000 kg' },
    { id: 'CI40-260312-C', label: 'Drum line, 3 000 kg' },
  ],
};

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

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm text-base-foreground">{children}</dd>
    </div>
  );
}

const SCORE = deviationScore(ALIGNED, GOLDEN, 2);
const LAST = ALIGNED[ALIGNED.length - 1];

function BatchRecipeHeader() {
  return (
    <Card role="group" aria-label={`Batch ${BATCH.id}`} className="w-full min-w-0 gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">
            Batch <span className="font-mono text-base-foreground">{BATCH.id}</span> · {BATCH.site}
          </span>
          <h3 className="text-base font-semibold text-base-foreground">{BATCH.product}</h3>
        </div>
        <StatusIndicator variant="badge" {...BATCH_STATUS.running} detail="React" />
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
        <Fact label="Recipe">
          <span className="font-mono text-xs">{BATCH.recipe}</span>
        </Fact>
        <Fact label="Vessel">
          <span className="font-mono text-xs">{BATCH.vessel}</span>
        </Fact>
        <Fact label="Elapsed">
          <span className="tabular-nums">118 min of 250</span>
        </Fact>
        <Fact label="Against golden batch">
          <span className="tabular-nums text-warning-foreground-strong">{formatDelta(118 - LAST.t)} min behind</span>
        </Fact>
      </dl>
    </Card>
  );
}

function BatchRecipePhaseTimeline() {
  return (
    <Panel title="Phases" meta={`${BATCH.id} · expected 250 min`}>
      <PhaseTimeline label={`Phases of batch ${BATCH.id}`} phases={TIMELINE} />
    </Panel>
  );
}

function BatchRecipePhaseHeld() {
  const held: TimelinePhase[] = TIMELINE.map((phase) => (phase.id === 'react' ? { ...phase, state: 'held', actual: 31 } : phase));
  return (
    <Panel title="Batch on hold" meta="B-2603-117">
      <PhaseTimeline label="Phases of batch B-2603-117, on hold in React" phases={held} />
      <p className="text-xs text-muted-foreground">Held by Liv Wold at 13:12: sample outside the viscosity limit. Agitation and temperature are kept.</p>
    </Panel>
  );
}

function BatchRecipeElapsed() {
  return (
    <Card role="group" aria-label="Elapsed time" className="w-full max-w-72 gap-3 self-center">
      <span className="text-xs text-muted-foreground">Elapsed against expected</span>
      <div className="flex items-baseline gap-2">
        <ValueReadout size="md" value={118} unit="min" />
        <span className="text-xs text-muted-foreground tabular-nums">of 250 expected</span>
      </div>
      <LinearGauge label="Elapsed time" value={118} max={250} target={Math.round(LAST.t)} size="sm" showHeader={false} />
      <span className="text-xs text-muted-foreground tabular-nums">Tick marks where the golden batch would be: {formatValue(LAST.t)} min.</span>
    </Card>
  );
}

function BatchRecipeList() {
  return (
    <div className="w-full overflow-x-auto">
      <table aria-label="Batches" className="w-full min-w-208 border-collapse text-sm">
        <thead>
          <tr>
            <th scope="col" className={TH}>
              Batch
            </th>
            <th scope="col" className={TH}>
              Product and recipe
            </th>
            <th scope="col" className={TH}>
              Vessel
            </th>
            <th scope="col" className={TH}>
              Status
            </th>
            <th scope="col" className={`${TH} text-right`}>
              Cycle, min
            </th>
            <th scope="col" className={`${TH} text-right`}>
              Yield, %
            </th>
          </tr>
        </thead>
        <tbody>
          {BATCHES.map((batch) => (
            <tr key={batch.id} className="border-t border-default">
              <th scope="row" className={`${TD} text-left font-mono text-xs font-normal text-base-foreground`}>
                {batch.id}
              </th>
              <td className={`${TD} text-base-foreground`}>
                {batch.product}
                <span className="block font-mono text-xs text-muted-foreground">{batch.recipe}</span>
              </td>
              <td className={`${TD} font-mono text-xs text-medium-foreground`}>{batch.vessel}</td>
              <td className={TD}>
                <StatusIndicator size="sm" {...BATCH_STATUS[batch.state]} />
              </td>
              <td className={`${TD} text-right tabular-nums text-medium-foreground`}>{formatValue(batch.cycle)}</td>
              <td className={`${TD} text-right tabular-nums text-medium-foreground`}>{formatValue(batch.yieldPct, 1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BatchRecipeEquipment() {
  const span = 24;
  return (
    <Card className="w-full min-w-0 gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-medium text-base-foreground">Equipment allocation</h3>
        <span className="text-xs text-muted-foreground">12 Mar, from 06:00</span>
      </div>
      <div className="flex flex-col gap-3">
        <div aria-hidden="true" className="grid grid-cols-[9rem_minmax(0,1fr)] gap-x-3 text-xs tabular-nums text-muted-foreground">
          <span />
          <span className="flex justify-between">
            {['06:00', '12:00', '18:00', '00:00', '06:00'].map((label, index) => (
              <span key={`${label}-${index}`}>{label}</span>
            ))}
          </span>
        </div>
        {EQUIPMENT_ROWS.map((row) => (
          <div key={row.vessel} className="grid grid-cols-[9rem_minmax(0,1fr)] items-center gap-x-3">
            <span className="flex flex-col">
              <span className="font-mono text-xs text-base-foreground">{row.vessel}</span>
              <span className="text-xs text-muted-foreground">{row.name}</span>
            </span>
            <ul aria-label={`Bookings of ${row.name}`} className="relative h-8 rounded-md bg-muted-background">
              {row.bookings.map((booking) => (
                <li
                  key={`${booking.id}-${booking.from}`}
                  data-state={booking.state}
                  className={`absolute top-1 flex h-6 items-center overflow-hidden rounded-md px-1.5 text-xs ${FOCUS_BAR[booking.state]} ${booking.state === 'planned' ? 'text-medium-foreground' : booking.state === 'done' ? 'text-base-foreground' : 'text-base-background'}`}
                  style={{ left: `${(booking.from / span) * 100}%`, width: `${((booking.to - booking.from) / span) * 100}%` }}
                >
                  <span className="truncate">
                    {booking.id}
                    <span className="sr-only">, {booking.state === 'done' ? 'finished' : booking.state === 'running' ? 'running' : booking.state === 'hold' ? 'on hold' : 'planned'}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">Solid, light: finished. Solid, dark: running. Dashed: planned. Amber: on hold.</p>
    </Card>
  );
}

function BatchRecipeSteps() {
  return (
    <div className="w-full overflow-x-auto">
      <table aria-label="Recipe steps with setpoints and actuals" className="w-full min-w-208 border-collapse text-sm">
        <thead>
          <tr>
            <th scope="col" className={TH}>
              Step
            </th>
            <th scope="col" className={TH}>
              Parameter
            </th>
            <th scope="col" className={`${TH} text-right`}>
              Setpoint
            </th>
            <th scope="col" className={`${TH} text-right`}>
              Actual
            </th>
            <th scope="col" className={`${TH} text-right`}>
              Deviation
            </th>
            <th scope="col" className={TH}>
              Result
            </th>
          </tr>
        </thead>
        <tbody>
          {STEPS.map((row) => {
            const result = row.actual === null ? null : deviation(row.actual, row.setpoint);
            const outside = result !== null && Math.abs(result.absolute) > row.tolerance;
            return (
              <tr key={row.no} className="border-t border-default">
                <th scope="row" className={`${TD} text-left font-normal text-base-foreground`}>
                  <span className="pr-2 text-xs tabular-nums text-muted-foreground">{row.no}</span>
                  {row.step}
                </th>
                <td className={`${TD} text-medium-foreground`}>{row.parameter}</td>
                <td className={`${TD} text-right tabular-nums text-medium-foreground`}>
                  {formatValue(row.setpoint, row.decimals)} {row.unit}
                </td>
                <td className={`${TD} text-right tabular-nums text-base-foreground`}>{row.actual === null ? 'Not reached' : `${formatValue(row.actual, row.decimals)} ${row.unit}`}</td>
                <td className={`${TD} text-right tabular-nums ${outside ? 'font-medium text-warning-foreground-strong' : 'text-medium-foreground'}`}>
                  {result === null ? formatValue(null) : `${formatDelta(result.absolute, row.decimals)} ${row.unit}`}
                </td>
                <td className={TD}>
                  {result === null ? <StatusIndicator size="sm" tone="neutral" shape="ring" label="Not started" /> : outside ? <StatusIndicator size="sm" tone="warning" shape="square" label={`Outside ±${row.tolerance}`} /> : <StatusIndicator size="sm" tone="success" label="Within limits" />}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function BatchRecipeStepList() {
  const steps: StepListItem[] = [
    { id: 'charge', label: 'Charge solvent and ethoxylate', detail: '12:04 to 12:20', state: 'done' },
    { id: 'heat', label: 'Heat to 85 °C', detail: '46 min, 6 min over', state: 'done' },
    { id: 'dose', label: 'Dose amine over 30 min', detail: '13:08 to 13:38', state: 'done' },
    { id: 'react', label: 'Hold at 85 °C for 90 min', detail: '54 of 90 min', state: 'active' },
    { id: 'cool', label: 'Cool to 35 °C', state: 'pending' },
    { id: 'transfer', label: 'Transfer to the filling line', state: 'pending' },
  ];
  return (
    <Panel title="Recipe steps" meta={BATCH.recipe}>
      <StepList label="Recipe steps for batch B-2603-118" steps={steps} showState />
    </Panel>
  );
}

function BatchRecipeAdditions() {
  return (
    <div className="w-full overflow-x-auto">
      <table aria-label="Material additions" className="w-full min-w-176 border-collapse text-sm">
        <thead>
          <tr>
            <th scope="col" className={TH}>
              Time
            </th>
            <th scope="col" className={TH}>
              Material
            </th>
            <th scope="col" className={TH}>
              Lot
            </th>
            <th scope="col" className={`${TH} text-right`}>
              Planned, kg
            </th>
            <th scope="col" className={`${TH} text-right`}>
              Added, kg
            </th>
            <th scope="col" className={TH}>
              Added by
            </th>
          </tr>
        </thead>
        <tbody>
          {ADDITIONS.map((row) => (
            <tr key={row.lot} className="border-t border-default">
              <td className={`${TD} tabular-nums text-medium-foreground`}>{row.time}</td>
              <th scope="row" className={`${TD} text-left font-normal text-base-foreground`}>
                {row.material}
              </th>
              <td className={`${TD} font-mono text-xs text-medium-foreground`}>{row.lot}</td>
              <td className={`${TD} text-right tabular-nums text-medium-foreground`}>{formatValue(row.planned, 1)}</td>
              <td className={`${TD} text-right tabular-nums text-base-foreground`}>{formatValue(row.actual, 1)}</td>
              <td className={`${TD} text-medium-foreground`}>{row.by}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BatchRecipeParameterAudit() {
  return (
    <Panel title="Parameter changes" meta="Latest first">
      <ul className="flex flex-col">
        {PARAMETER_CHANGES.map((change, index) => (
          <li key={change.at} className={`flex flex-col gap-0.5 py-3 ${index === 0 ? 'pt-0' : 'border-t border-default'}`}>
            <span className="text-sm text-base-foreground">
              {change.parameter}: <span className="tabular-nums text-muted-foreground line-through">{change.from}</span> <span className="tabular-nums font-medium">{change.to}</span>
            </span>
            <span className="text-xs text-muted-foreground">{change.why}</span>
            <span className="text-xs tabular-nums text-muted-foreground">
              {change.who} · {change.at}
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

type RunState = 'running' | 'hold' | 'aborted';

function BatchRecipeControls() {
  const [state, setState] = useState<RunState>('running');
  const [holdOpen, setHoldOpen] = useState(false);
  const [abortOpen, setAbortOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const matches = typed.trim() === BATCH.id;
  const status = state === 'running' ? BATCH_STATUS.running : state === 'hold' ? BATCH_STATUS.hold : BATCH_STATUS.rejected;
  return (
    <Panel title="Batch controls" meta={<span className="font-mono">{BATCH.id}</span>}>
      <div className="flex items-center justify-between gap-3">
        <StatusIndicator variant="badge" {...status} label={state === 'aborted' ? 'Aborted' : status.label} />
        <span role="status" className="text-xs text-muted-foreground">
          {state === 'running' ? 'The batch follows the recipe.' : state === 'hold' ? 'Held at the end of the current step.' : 'Stopped. The vessel needs cleaning before reuse.'}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        <Dialog open={holdOpen} onOpenChange={setHoldOpen}>
          <DialogTrigger render={<Button variant="secondary" disabled={state !== 'running'}>Hold batch</Button>} />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Hold batch {BATCH.id}?</DialogTitle>
              <DialogDescription>The batch stops at the end of the current step. Heating and agitation continue. Resume within 30 minutes or the product may need rework.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose render={<Button variant="ghost">Keep running</Button>} />
              <Button
                onClick={() => {
                  setState('hold');
                  setHoldOpen(false);
                }}
              >
                Hold batch
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Button variant="ghost" disabled={state !== 'hold'} onClick={() => setState('running')}>
          Resume batch
        </Button>
        <Dialog
          open={abortOpen}
          onOpenChange={(open) => {
            setAbortOpen(open);
            if (!open) setTyped('');
          }}
        >
          <DialogTrigger render={<Button variant="destructive" disabled={state === 'aborted'}>Abort batch</Button>} />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Abort batch {BATCH.id}?</DialogTitle>
              <DialogDescription>Aborting stops all dosing and heating and sends 5 200 kg of material to the off-spec tank. It cannot be undone.</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col pt-2">
              <Label htmlFor="batch-abort-confirm">Type the batch number to confirm</Label>
              <Input id="batch-abort-confirm" value={typed} onChange={(event) => setTyped(event.target.value)} placeholder={BATCH.id} />
            </div>
            <DialogFooter>
              <DialogClose render={<Button variant="ghost">Cancel</Button>} />
              <Button
                variant="destructive"
                disabled={!matches}
                onClick={() => {
                  setState('aborted');
                  setAbortOpen(false);
                }}
              >
                Abort batch
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Panel>
  );
}

function BatchRecipeGolden() {
  return (
    <Card className="w-full min-w-0 gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h3 className="text-sm font-medium text-base-foreground">Reactor temperature against the golden batch</h3>
        <span className="font-mono text-xs text-muted-foreground">62-TT-6215</span>
      </div>
      <GoldenBatchChart label="Reactor temperature of batch B-2603-118 against the golden batch" golden={GOLDEN} current={ALIGNED} goldenPhases={GOLDEN_PHASES} tolerance={2} unit="°C" yDomain={[0, 100]} />
    </Card>
  );
}

const TOLERANCES = [
  { value: '1', label: '±1 °C' },
  { value: '2', label: '±2 °C' },
  { value: '4', label: '±4 °C' },
];

function BatchRecipeGoldenTolerance() {
  const [tolerance, setTolerance] = useState('2');
  return (
    <Card className="w-full min-w-0 gap-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h3 className="text-sm font-medium text-base-foreground">Tolerance band</h3>
        <div className="flex w-40 flex-col">
          <Label htmlFor="batch-golden-tolerance">Tolerance</Label>
          <Select items={TOLERANCES} value={tolerance} onValueChange={(value) => (typeof value === 'string' ? setTolerance(value) : undefined)}>
            <SelectTrigger id="batch-golden-tolerance" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TOLERANCES.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <GoldenBatchChart label="Reactor temperature against the golden batch with an adjustable tolerance" golden={GOLDEN} current={ALIGNED} goldenPhases={GOLDEN_PHASES} tolerance={Number(tolerance)} unit="°C" yDomain={[0, 100]} heightClassName="h-48" />
    </Card>
  );
}

function BatchRecipeGoldenScore() {
  return (
    <Panel title="Deviation score" meta="Against golden batch">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
        <div className="flex flex-col gap-1">
          <dt className="text-xs text-muted-foreground">Within tolerance</dt>
          <dd>
            <ValueReadout size="md" value={SCORE.conformance} unit="%" />
          </dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-xs text-muted-foreground">Excursions</dt>
          <dd>
            <ValueReadout size="md" value={SCORE.excursions.length} tone={SCORE.excursions.length > 0 ? 'warning' : 'neutral'} />
          </dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-xs text-muted-foreground">Largest deviation</dt>
          <dd>
            <ValueReadout size="md" value={SCORE.maxDeviation} unit="°C" decimals={1} />
          </dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-xs text-muted-foreground">Root-mean-square</dt>
          <dd>
            <ValueReadout size="md" value={SCORE.rms} unit="°C" decimals={2} />
          </dd>
        </div>
      </dl>
      <p className="border-t border-default pt-3 text-xs text-muted-foreground">{SCORE.compared} samples compared after alignment by phase.</p>
    </Panel>
  );
}

function BatchRecipeAlignment() {
  const rows = phaseDurations(CURRENT_PHASES, GOLDEN_PHASES);
  return (
    <Panel title="Alignment by phase" meta="Minutes">
      <table aria-label="Phase durations against the golden batch" className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th scope="col" className={`${TH} pl-0`}>
              Phase
            </th>
            <th scope="col" className={`${TH} text-right`}>
              Golden
            </th>
            <th scope="col" className={`${TH} text-right`}>
              This batch
            </th>
            <th scope="col" className={`${TH} pr-0 text-right`}>
              Over
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-default">
              <th scope="row" className={`${TD} pl-0 text-left font-normal text-base-foreground`}>
                {row.label}
              </th>
              <td className={`${TD} text-right tabular-nums text-medium-foreground`}>{row.expected}</td>
              <td className={`${TD} text-right tabular-nums text-base-foreground`}>{row.actual ?? 'Not started'}</td>
              <td className={`${TD} pr-0 text-right tabular-nums ${row.overrun !== null && row.overrun > 0 ? 'font-medium text-warning-foreground-strong' : 'text-medium-foreground'}`}>{row.overrun === null ? formatValue(null) : formatDelta(row.overrun)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-muted-foreground">Each finished phase is stretched to the golden phase before values are compared, so a slow heat-up does not show as a deviation in React.</p>
    </Panel>
  );
}

function BatchRecipePareto() {
  return (
    <Panel title="Where batches run late" meta="Last 30 batches">
      <ParetoChart
        label="Minutes over the golden batch by phase, last 30 batches"
        rows={[
          { label: 'Heat', value: 212 },
          { label: 'React', value: 148 },
          { label: 'Cool', value: 96 },
          { label: 'Charge', value: 41 },
          { label: 'Transfer', value: 38 },
          { label: 'Hold', value: 22 },
        ]}
        unit="min"
        valueLabel="Minutes over"
        heightClassName="h-56"
      />
    </Panel>
  );
}

function BatchRecipeKpiTiles() {
  return (
    <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
      <KpiTile label="Cycle time" value={238} unit="min" delta={{ reference: 250, goodDirection: 'down', caption: 'vs golden batch' }} footnote="Last completed batch B-2603-116" />
      <KpiTile label="Yield" value={98.4} unit="%" decimals={1} delta={{ reference: 99.1, goodDirection: 'up', decimals: 1, caption: 'vs last 5 batches' }} footnote="Target 98.5 %" />
      <KpiTile label="Energy" value={61.2} unit="kWh/t" decimals={1} delta={{ reference: 62.8, goodDirection: 'down', decimals: 1, caption: 'vs last 5 batches' }} footnote="Steam and electricity per tonne" />
    </div>
  );
}

function BatchRecipeComparison() {
  const done = BATCHES.filter((batch) => batch.cycle !== null);
  const reference = { cycle: 250, yieldPct: 99, energy: 62 };
  return (
    <div className="w-full overflow-x-auto">
      <table aria-label="Batch-to-batch comparison" className="w-full min-w-208 border-collapse text-sm">
        <thead>
          <tr>
            <th scope="col" className={TH}>
              Batch
            </th>
            <th scope="col" className={`${TH} text-right`}>
              Cycle, min
            </th>
            <th scope="col" className={TH}>
              Against golden
            </th>
            <th scope="col" className={`${TH} text-right`}>
              Yield, %
            </th>
            <th scope="col" className={TH}>
              Against 99.0
            </th>
            <th scope="col" className={`${TH} text-right`}>
              Energy, kWh/t
            </th>
            <th scope="col" className={TH}>
              Against 62
            </th>
          </tr>
        </thead>
        <tbody>
          {done.map((batch) => (
            <tr key={batch.id} className="border-t border-default">
              <th scope="row" className={`${TD} text-left font-mono text-xs font-normal text-base-foreground`}>
                {batch.id}
              </th>
              <td className={`${TD} text-right tabular-nums text-base-foreground`}>{formatValue(batch.cycle)}</td>
              <td className={TD}>{batch.cycle === null ? null : <TrendDelta value={batch.cycle} reference={reference.cycle} decimals={0} goodDirection="down" size="sm" />}</td>
              <td className={`${TD} text-right tabular-nums text-base-foreground`}>{formatValue(batch.yieldPct, 1)}</td>
              <td className={TD}>{batch.yieldPct === null ? null : <TrendDelta value={batch.yieldPct} reference={reference.yieldPct} decimals={1} goodDirection="up" size="sm" />}</td>
              <td className={`${TD} text-right tabular-nums text-base-foreground`}>{formatValue(batch.energy, 1)}</td>
              <td className={TD}>{batch.energy === null ? null : <TrendDelta value={batch.energy} reference={reference.energy} decimals={1} goodDirection="down" size="sm" />}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BatchRecipeCycleChart() {
  return (
    <Panel title="Cycle time by batch" meta="Minutes">
      <CategoryChart
        label="Cycle time of the last eight batches against the golden batch of 250 minutes. Every batch finished within 5 minutes of it."
        rows={[
          { category: '106', cycle: 252 },
          { category: '107', cycle: 249 },
          { category: '108', cycle: 255 },
          { category: '112', cycle: 246 },
          { category: '113', cycle: 244 },
          { category: '114', cycle: 251 },
          { category: '115', cycle: 247 },
          { category: '116', cycle: 238 },
        ]}
        series={[{ key: 'cycle', label: 'Cycle time' }]}
        references={[{ value: 250, label: 'Golden 250', tone: 'neutral' }]}
        domain={[200, 270]}
        unit="min"
        heightClassName="h-56"
      />
    </Panel>
  );
}

function BatchRecipeRelease() {
  const steps: StepListItem[] = [
    { id: 'sample', label: 'Sample taken at end of React', detail: 'Lab sample S-260312-31', state: 'done' },
    { id: 'lab', label: 'Lab results within specification', detail: 'Viscosity 41 cSt, specification 38 to 44', state: 'done' },
    { id: 'dev', label: 'Deviations closed', detail: 'DEV-0412 is open', state: 'held' },
    { id: 'review', label: 'Batch record reviewed', state: 'pending' },
    { id: 'release', label: 'Released by quality', state: 'pending' },
  ];
  return (
    <Panel title="Quality release" meta={BATCH.id}>
      <StepList label="Quality release steps" steps={steps} showState />
    </Panel>
  );
}

function BatchRecipeDeviations() {
  return (
    <div className="w-full overflow-x-auto">
      <table aria-label="Deviation log" className="w-full min-w-208 border-collapse text-sm">
        <thead>
          <tr>
            <th scope="col" className={TH}>
              Deviation
            </th>
            <th scope="col" className={TH}>
              What happened
            </th>
            <th scope="col" className={TH}>
              Classification
            </th>
            <th scope="col" className={TH}>
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-t border-default">
            <th scope="row" className={`${TD} text-left font-mono text-xs font-normal text-base-foreground`}>
              DEV-0412
            </th>
            <td className={`${TD} text-base-foreground`}>
              Reactor temperature {formatValue(Math.abs(SCORE.maxDeviation), 1)} °C above the golden profile for 14 minutes in React.
              <span className="block text-xs text-muted-foreground">Raised by the system, 12 Mar 13:36</span>
            </td>
            <td className={`${TD} text-medium-foreground`}>Minor, product not affected</td>
            <td className={TD}>
              <StatusIndicator size="sm" tone="warning" shape="square" label="Open" />
            </td>
          </tr>
          <tr className="border-t border-default">
            <th scope="row" className={`${TD} text-left font-mono text-xs font-normal text-base-foreground`}>
              DEV-0409
            </th>
            <td className={`${TD} text-base-foreground`}>
              Heat phase 6 minutes longer than expected.
              <span className="block text-xs text-muted-foreground">Raised by Ingrid Haugen, 12 Mar 13:08</span>
            </td>
            <td className={`${TD} text-medium-foreground`}>Observation</td>
            <td className={TD}>
              <StatusIndicator size="sm" tone="success" label="Closed" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function BatchRecipeSignature() {
  const [signed, setSigned] = useState<readonly string[]>(['operator']);
  const signers: SignOffSigner[] = [
    { id: 'operator', role: 'Operator', name: 'Ingrid Haugen', state: signed.includes('operator') ? 'signed' : 'pending', at: '12 Mar, 13:40' },
    { id: 'supervisor', role: 'Shift supervisor', name: 'Liv Wold', state: signed.includes('supervisor') ? 'signed' : 'pending', at: '12 Mar, 13:55' },
    { id: 'quality', role: 'Quality assurance', name: 'Aisha Khan', state: signed.includes('quality') ? 'signed' : 'pending', at: '12 Mar, 14:05' },
  ];
  return (
    <Panel title="Deviation DEV-0412 signatures" meta="Electronic signature">
      <SignOffBlock label="Signatures for deviation DEV-0412" signers={signers} currentSignerId={signers.find((signer) => signer.state === 'pending')?.id} onSign={(id) => setSigned((current) => [...current, id])} signLabel="Sign deviation" />
      <p className="border-t border-default pt-3 text-xs text-muted-foreground">Each signature records the signer, the time and the meaning: reviewed, approved, or released.</p>
    </Panel>
  );
}

function BatchRecipeReport() {
  return (
    <Card role="group" aria-label="Batch report summary" className="w-full min-w-0 gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h3 className="text-sm font-medium text-base-foreground">Batch report B-2603-116</h3>
        <StatusIndicator variant="badge" {...BATCH_STATUS.complete} />
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
        <Fact label="Product">CI-40, 5 200 kg</Fact>
        <Fact label="Recipe">
          <span className="font-mono text-xs">R-CI40 v7</span>
        </Fact>
        <Fact label="Cycle time">
          <span className="tabular-nums">238 min, golden 250</span>
        </Fact>
        <Fact label="Yield">
          <span className="tabular-nums">98.4 %</span>
        </Fact>
        <Fact label="Deviations">1 observation, closed</Fact>
        <Fact label="Materials">4 lots, all verified</Fact>
      </dl>
      <p className="border-t border-default pt-3 text-xs text-muted-foreground">Waiting for review by quality assurance.</p>
    </Card>
  );
}

function BatchRecipeGenealogy() {
  return (
    <Panel title="Genealogy" meta="CI40-260312">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center">
        <ul aria-label="Raw material lots" className="flex flex-col gap-2">
          {GENEALOGY.lots.map((lot) => (
            <li key={lot.id} className="flex flex-col rounded-md bg-muted-background px-2.5 py-1.5">
              <span className="font-mono text-xs text-base-foreground">{lot.id}</span>
              <span className="text-xs text-muted-foreground">{lot.label}</span>
            </li>
          ))}
        </ul>
        <span aria-hidden="true" className="hidden text-muted-foreground sm:block">→</span>
        <div className="flex flex-col gap-1 rounded-md border border-emphasized px-3 py-2">
          <span className="text-xs text-muted-foreground">Batch</span>
          <span className="font-mono text-sm font-medium text-base-foreground">{BATCH.id}</span>
          <span className="text-xs text-muted-foreground">{BATCH.recipe}</span>
        </div>
        <span aria-hidden="true" className="hidden text-muted-foreground sm:block">→</span>
        <ul aria-label="Product lots" className="flex flex-col gap-2">
          {GENEALOGY.outputs.map((lot) => (
            <li key={lot.id} className="flex flex-col rounded-md bg-muted-background px-2.5 py-1.5">
              <span className="font-mono text-xs text-base-foreground">{lot.id}</span>
              <span className="text-xs text-muted-foreground">{lot.label}</span>
            </li>
          ))}
        </ul>
      </div>
      <p className="text-xs text-muted-foreground">Read left to right: raw material lots go into the batch, the batch makes the product lots.</p>
    </Panel>
  );
}

function BatchRecipeMonitor() {
  return (
    <div className="flex w-full flex-col gap-4">
      <BatchRecipeHeader />
      <Panel title="Phases" meta="Expected 250 min">
        <PhaseTimeline label={`Phases of batch ${BATCH.id}`} phases={TIMELINE} />
      </Panel>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <BatchRecipeGolden />
        <div className="flex min-w-0 flex-col gap-4">
          <BatchRecipeGoldenScore />
          <BatchRecipeControls />
        </div>
      </div>
      <BatchRecipeSteps />
    </div>
  );
}

export default definePage({
  id: 'batch-and-recipe',
  title: 'Batch and recipe',
  summary:
    'Views for a batch process at the Stord terminal: the batch and its phases, the recipe steps against their setpoints, a running batch compared with the golden batch after alignment by phase, batch-to-batch comparison, material lots, deviations with electronic signatures and the controls to hold or abort. Dates, lots and measurements are plain facts, always with their units.',
  guidance: {
    use: [
      'Show phases at the width of their expected duration, with time so far against expected.',
      'Align a running batch to the golden batch phase by phase before judging it.',
      'Write deviations in words with phase, size and duration, and keep the batch record readable on its own.',
      'Ask for confirmation to hold and abort in words that say what happens to the material.',
    ],
    avoid: [
      'Judging a batch against the golden profile by clock time alone.',
      'Colour as the only sign of a deviation or a held batch.',
      'An abort button that works on one click.',
      'Releasing a batch with an open deviation without a visible reason.',
    ],
  },
  source,
  sections: [
    {
      id: 'batch',
      title: 'The batch',
      description: 'Where a batch is and how long it has taken.',
      specimens: [
        {
          id: 'BatchRecipeHeader',
          title: 'Batch header',
          note: 'Pick it at the top of a batch page: identity, recipe, vessel, phase and time against the golden batch.',
          origin: 'custom',
          uses: ['industrial/StatusIndicator.tsx', 'industrial/safety/goldenBatch.ts'],
          size: 'full',
          align: 'stretch',
          Component: BatchRecipeHeader,
        },
        {
          id: 'BatchRecipePhaseTimeline',
          title: 'Phase timeline',
          note: 'Pick it for progress through the recipe: each phase as wide as it should take, the current one filling.',
          origin: 'custom',
          uses: ['industrial/safety/PhaseTimeline.tsx'],
          size: 'full',
          align: 'stretch',
          Component: BatchRecipePhaseTimeline,
        },
        {
          id: 'BatchRecipePhaseHeld',
          title: 'Phase on hold',
          note: 'Pick it when a batch is held: the phase says so in words and the reason sits below.',
          origin: 'custom',
          uses: ['industrial/safety/PhaseTimeline.tsx'],
          size: 'lg',
          align: 'stretch',
          Component: BatchRecipePhaseHeld,
        },
        {
          id: 'BatchRecipeElapsed',
          title: 'Elapsed against expected',
          note: 'Pick it for a small answer to "are we on time": elapsed minutes with a tick for where the golden batch would be.',
          origin: 'custom',
          uses: ['industrial/LinearGauge.tsx', 'industrial/ValueReadout.tsx'],
          size: 'sm',
          Component: BatchRecipeElapsed,
        },
        {
          id: 'BatchRecipeList',
          title: 'Batch list',
          note: 'Pick it for the batches of a shift or a day: product, vessel and a written status each.',
          origin: 'custom',
          uses: ['industrial/StatusIndicator.tsx'],
          size: 'full',
          align: 'stretch',
          Component: BatchRecipeList,
        },
        {
          id: 'BatchRecipeEquipment',
          title: 'Equipment allocation',
          note: 'Pick it to see which vessel holds which batch when: finished, running, held and planned bookings.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          Component: BatchRecipeEquipment,
        },
      ],
    },
    {
      id: 'recipe',
      title: 'Recipe, materials and changes',
      description: 'What the recipe asks for, what was done and who changed what.',
      specimens: [
        {
          id: 'BatchRecipeSteps',
          title: 'Recipe steps with setpoints and actuals',
          note: 'Pick it for the batch record: setpoint, actual and deviation for each step, outside-limit steps in words.',
          origin: 'custom',
          uses: ['industrial/workflows/workflow.ts', 'industrial/StatusIndicator.tsx'],
          size: 'full',
          align: 'stretch',
          Component: BatchRecipeSteps,
        },
        {
          id: 'BatchRecipeStepList',
          title: 'Recipe step progress',
          note: 'Pick it as the operator view of the recipe: done, in progress and not started.',
          origin: 'custom',
          uses: ['industrial/workflows/StepList.tsx'],
          size: 'md',
          align: 'stretch',
          Component: BatchRecipeStepList,
        },
        {
          id: 'BatchRecipeParameterAudit',
          title: 'Parameter change audit',
          note: 'Pick it for traceability: every changed setting with old and new value, reason, person and time.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: BatchRecipeParameterAudit,
        },
        {
          id: 'BatchRecipeAdditions',
          title: 'Material additions log',
          note: 'Pick it for what went into the vessel: material, lot number, planned and added quantity.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          Component: BatchRecipeAdditions,
        },
        {
          id: 'BatchRecipeControls',
          title: 'Hold and abort controls',
          note: 'Pick it for controls that change a running batch: each dialog says what happens, and abort needs the batch number typed.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: BatchRecipeControls,
        },
      ],
    },
    {
      id: 'golden',
      title: 'Golden batch',
      description: 'Comparing a running batch with the best known profile.',
      specimens: [
        {
          id: 'BatchRecipeGolden',
          title: 'Golden-batch comparison',
          note: 'Pick it to judge a running batch: its trend over the golden profile and tolerance band, with excursions marked.',
          origin: 'custom',
          uses: ['industrial/safety/GoldenBatchChart.tsx', 'industrial/safety/goldenBatch.ts'],
          size: 'full',
          align: 'stretch',
          Component: BatchRecipeGolden,
        },
        {
          id: 'BatchRecipeGoldenTolerance',
          title: 'Adjustable tolerance',
          note: 'Pick it when the band is still being agreed: widen or narrow it and see which excursions remain.',
          origin: 'custom',
          uses: ['industrial/safety/GoldenBatchChart.tsx'],
          size: 'lg',
          align: 'stretch',
          Component: BatchRecipeGoldenTolerance,
        },
        {
          id: 'BatchRecipeGoldenScore',
          title: 'Deviation score',
          note: 'Pick it beside the chart: share within tolerance, excursions, the largest deviation and the root-mean-square.',
          origin: 'custom',
          uses: ['industrial/safety/goldenBatch.ts', 'industrial/ValueReadout.tsx'],
          size: 'sm',
          align: 'stretch',
          Component: BatchRecipeGoldenScore,
        },
        {
          id: 'BatchRecipeAlignment',
          title: 'Alignment by phase',
          note: 'Pick it to explain why a late phase does not move the rest: durations against the golden batch for each phase.',
          origin: 'custom',
          uses: ['industrial/safety/goldenBatch.ts'],
          size: 'md',
          align: 'stretch',
          Component: BatchRecipeAlignment,
        },
        {
          id: 'BatchRecipePareto',
          title: 'Phase overrun Pareto',
          note: 'Pick it to decide where to improve: the phases that cause most of the lost minutes.',
          origin: 'custom',
          uses: ['industrial/charts/ParetoChart.tsx'],
          size: 'md',
          align: 'stretch',
          Component: BatchRecipePareto,
        },
      ],
    },
    {
      id: 'compare',
      title: 'Batch-to-batch comparison',
      description: 'Cycle time, yield and energy over several batches.',
      specimens: [
        {
          id: 'BatchRecipeKpiTiles',
          title: 'Batch KPIs',
          note: 'Pick it for the headline: cycle time, yield and energy of the last batch against a reference.',
          origin: 'custom',
          uses: ['industrial/KpiTile.tsx'],
          size: 'full',
          align: 'stretch',
          Component: BatchRecipeKpiTiles,
        },
        {
          id: 'BatchRecipeComparison',
          title: 'Batch comparison table',
          note: 'Pick it to compare batches of one recipe: each figure beside its change against the reference.',
          origin: 'custom',
          uses: ['industrial/TrendDelta.tsx'],
          size: 'full',
          align: 'stretch',
          Component: BatchRecipeComparison,
        },
        {
          id: 'BatchRecipeCycleChart',
          title: 'Cycle time by batch',
          note: 'Pick it to see spread: cycle time of recent batches against the golden batch.',
          origin: 'custom',
          uses: ['industrial/charts/CategoryChart.tsx'],
          size: 'md',
          align: 'stretch',
          Component: BatchRecipeCycleChart,
        },
        {
          id: 'BatchRecipeGenealogy',
          title: 'Genealogy',
          note: 'Pick it for traceability: raw material lots into the batch, the batch into product lots.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: BatchRecipeGenealogy,
        },
      ],
    },
    {
      id: 'quality',
      title: 'Quality release and deviations',
      description: 'What has to be true before a batch leaves.',
      specimens: [
        {
          id: 'BatchRecipeRelease',
          title: 'Quality release steps',
          note: 'Pick it for release: each step with its state, and the open deviation that holds it.',
          origin: 'custom',
          uses: ['industrial/workflows/StepList.tsx'],
          size: 'md',
          align: 'stretch',
          Component: BatchRecipeRelease,
        },
        {
          id: 'BatchRecipeSignature',
          title: 'Deviation e-signature',
          note: 'Pick it for deviation sign-off: roles in order, each signature with name and time.',
          origin: 'custom',
          uses: ['industrial/workflows/SignOffBlock.tsx'],
          size: 'md',
          align: 'stretch',
          Component: BatchRecipeSignature,
        },
        {
          id: 'BatchRecipeDeviations',
          title: 'Deviation log',
          note: 'Pick it for the exceptions of a batch: what happened, how it is classified and whether it is closed.',
          origin: 'custom',
          uses: ['industrial/safety/goldenBatch.ts', 'industrial/StatusIndicator.tsx'],
          size: 'full',
          align: 'stretch',
          Component: BatchRecipeDeviations,
        },
        {
          id: 'BatchRecipeReport',
          title: 'Batch report summary',
          note: 'Pick it as the front of a batch record: product, cycle, yield, deviations and what it waits for.',
          origin: 'custom',
          uses: ['industrial/StatusIndicator.tsx'],
          size: 'md',
          align: 'stretch',
          Component: BatchRecipeReport,
        },
      ],
    },
    {
      id: 'blocks',
      title: 'Full block',
      description: 'A running batch on one screen.',
      specimens: [
        {
          id: 'BatchRecipeMonitor',
          title: 'Batch monitor',
          note: 'Pick it as the page for a running batch: header, phases, golden comparison, score, controls and recipe steps.',
          origin: 'custom',
          uses: ['industrial/safety/PhaseTimeline.tsx', 'industrial/safety/GoldenBatchChart.tsx', 'industrial/safety/goldenBatch.ts', 'industrial/workflows/workflow.ts'],
          size: 'full',
          align: 'stretch',
          Component: BatchRecipeMonitor,
        },
      ],
    },
  ],
});
