import { Button } from '@cognite/aura/components/button';
import { Input } from '@cognite/aura/components/input';
import {
  IconAlertOctagon,
  IconAlertTriangle,
  IconCircleCheck,
  IconClock,
  IconFlask,
  IconPlayerPause,
  IconPlayerPlay,
  IconPlayerStop,
  IconSignature,
  IconTemperature,
  IconTestPipe,
} from '@cognite/aura/icons';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { AppFrame } from '../../../library/kit/AppFrame';
import { Bars } from '../../../library/kit/Bars';
import { BatchLane, type LaneRow } from '../../../library/kit/batch-and-recipe/BatchLane';
import { Genealogy } from '../../../library/kit/batch-and-recipe/Genealogy';
import { alignByPhase, alignTime, deviationScore, phaseDurations, type BatchPhase, type BatchPoint } from '../../../library/kit/batch-and-recipe/goldenBatch';
import { GoldenProfile } from '../../../library/kit/batch-and-recipe/GoldenProfile';
import type { TrackPhase } from '../../../library/kit/batch-and-recipe/phases';
import { PhaseTrack } from '../../../library/kit/batch-and-recipe/PhaseTrack';
import { Canvas } from '../../../library/kit/Canvas';
import { BlockNotice } from '../../../library/kit/dashboard-blocks/BlockNotice';
import { RangeSwitch } from '../../../library/kit/dashboard-blocks/RangeSwitch';
import { DataTable, type DataTableColumn } from '../../../library/kit/DataTable';
import { Grid } from '../../../library/kit/Grid';
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
import type { LookId } from '../../../library/looks/looks';
import { LookScope } from '../../../library/looks/LookScope';
import { createRandom } from '../../data/series';
import { definePage } from '../../types';

import source from './batch-and-recipe.tsx?raw';

const BR_BATCH = { id: 'B-2603-118', recipe: 'R-CI40 v7', product: 'Corrosion inhibitor CI-40', vessel: '62-RA-6201', site: 'Stord terminal', started: '12 Mar, 12:02', size: '5 200 kg' };

const BR_GOLDEN_PHASES: BatchPhase[] = [
  { id: 'charge', label: 'Charge', start: 0, end: 20 },
  { id: 'heat', label: 'Heat', start: 20, end: 60 },
  { id: 'react', label: 'React', start: 60, end: 150 },
  { id: 'hold', label: 'Hold', start: 150, end: 180 },
  { id: 'cool', label: 'Cool', start: 180, end: 230 },
  { id: 'transfer', label: 'Transfer', start: 230, end: 250 },
];

const BR_GOLDEN: BatchPoint[] = [
  { t: 0, v: 20 },
  { t: 20, v: 22 },
  { t: 60, v: 85 },
  { t: 150, v: 86 },
  { t: 180, v: 86 },
  { t: 230, v: 35 },
  { t: 250, v: 34 },
];

const BR_CURRENT_PHASES: BatchPhase[] = [
  { id: 'charge', label: 'Charge', start: 0, end: 18 },
  { id: 'heat', label: 'Heat', start: 18, end: 64 },
  { id: 'react', label: 'React', start: 64, end: 118, complete: false },
];

function brRawProfile(): BatchPoint[] {
  const random = createRandom(2603118);
  const points: BatchPoint[] = [];
  for (let t = 0; t <= 118; t += 4) {
    const aligned = alignTime(t, BR_CURRENT_PHASES, BR_GOLDEN_PHASES) ?? 0;
    const upper = BR_GOLDEN.findIndex((point) => point.t >= aligned);
    const a = BR_GOLDEN[Math.max(upper - 1, 0)];
    const b = BR_GOLDEN[Math.max(upper, 0)];
    const base = b.t === a.t ? b.v : a.v + ((b.v - a.v) * (aligned - a.t)) / (b.t - a.t);
    const bump = t >= 92 && t <= 106 ? 4.5 : 0;
    points.push({ t, v: Math.round((base + (random() - 0.5) * 1.6 + bump) * 10) / 10 });
  }
  return points;
}

const BR_ALIGNED = alignByPhase(brRawProfile(), BR_CURRENT_PHASES, BR_GOLDEN_PHASES);

const BR_SCORE = deviationScore(BR_ALIGNED, BR_GOLDEN, 2);

const BR_LAST = BR_ALIGNED[BR_ALIGNED.length - 1];

const BR_DURATIONS = phaseDurations(BR_CURRENT_PHASES, BR_GOLDEN_PHASES);

const BR_TRACK: TrackPhase[] = [
  { id: 'charge', label: 'Charge', expected: 20, actual: 18, state: 'done' },
  { id: 'heat', label: 'Heat', expected: 40, actual: 46, state: 'done' },
  { id: 'react', label: 'React', expected: 90, actual: 54, state: 'current' },
  { id: 'hold', label: 'Hold', expected: 30, actual: null, state: 'upcoming' },
  { id: 'cool', label: 'Cool', expected: 50, actual: null, state: 'upcoming' },
  { id: 'transfer', label: 'Transfer', expected: 20, actual: null, state: 'upcoming' },
];

const BR_TRACK_HELD: TrackPhase[] = BR_TRACK.map((phase) => (phase.id === 'react' ? { ...phase, state: 'held' } : phase));

type BrBatchState = 'running' | 'hold' | 'complete' | 'released' | 'rejected' | 'planned';

type BrBatch = { id: string; recipe: string; product: string; vessel: string; state: BrBatchState; cycle: number | null; yieldPct: number | null; energy: number | null };

const BR_STATE: Record<BrBatchState, { tone: Tone; label: string }> = {
  running: { tone: 'info', label: 'Running' },
  hold: { tone: 'warning', label: 'On hold' },
  complete: { tone: 'purple', label: 'Awaiting release' },
  released: { tone: 'success', label: 'Released' },
  rejected: { tone: 'critical', label: 'Rejected' },
  planned: { tone: 'neutral', label: 'Planned' },
};

const BR_BATCHES: BrBatch[] = [
  { id: 'B-2603-118', recipe: 'R-CI40 v7', product: 'CI-40', vessel: '62-RA-6201', state: 'running', cycle: null, yieldPct: null, energy: null },
  { id: 'B-2603-117', recipe: 'R-DM12 v3', product: 'DM-12 demulsifier', vessel: '62-RA-6202', state: 'hold', cycle: null, yieldPct: null, energy: null },
  { id: 'B-2603-116', recipe: 'R-CI40 v7', product: 'CI-40', vessel: '62-RA-6201', state: 'complete', cycle: 238, yieldPct: 98.4, energy: 61.2 },
  { id: 'B-2603-115', recipe: 'R-CI40 v7', product: 'CI-40', vessel: '62-RA-6201', state: 'released', cycle: 247, yieldPct: 98.9, energy: 62.8 },
  { id: 'B-2603-114', recipe: 'R-DM12 v3', product: 'DM-12 demulsifier', vessel: '62-RA-6202', state: 'rejected', cycle: 251, yieldPct: 91.2, energy: 66.4 },
  { id: 'B-2603-113', recipe: 'R-CI40 v7', product: 'CI-40', vessel: '62-RA-6201', state: 'released', cycle: 244, yieldPct: 99.1, energy: 62.0 },
  { id: 'B-2603-119', recipe: 'R-CI40 v7', product: 'CI-40', vessel: '62-RA-6201', state: 'planned', cycle: null, yieldPct: null, energy: null },
];

const BR_FINISHED = BR_BATCHES.filter((batch) => batch.cycle !== null);

const brFigure = (value: number | null, decimals: number, unit: string): string => (value === null ? '—' : `${formatNumber(value, decimals)} ${unit}`);

const BR_BATCH_COLUMNS: DataTableColumn<BrBatch>[] = [
  { id: 'batch', header: 'Batch', nowrap: true, cell: (batch) => <TagId>{batch.id}</TagId> },
  { id: 'product', header: 'Product', nowrap: true, cell: (batch) => batch.product },
  { id: 'recipe', header: 'Recipe', nowrap: true, muted: true, cell: (batch) => batch.recipe },
  { id: 'vessel', header: 'Vessel', nowrap: true, cell: (batch) => <TagId>{batch.vessel}</TagId> },
  { id: 'state', header: 'State', nowrap: true, cell: (batch) => <StatusPill tone={BR_STATE[batch.state].tone}>{BR_STATE[batch.state].label}</StatusPill> },
  { id: 'cycle', header: 'Cycle', numeric: true, cell: (batch) => brFigure(batch.cycle, 0, 'min') },
  { id: 'yield', header: 'Yield', numeric: true, cell: (batch) => brFigure(batch.yieldPct, 1, '%') },
];

type BrStep = { no: number; step: string; unit: string; setpoint: number; actual: number | null; tolerance: number; decimals: number };

const BR_STEPS: BrStep[] = [
  { no: 1, step: 'Charge solvent SV-9012', unit: 'kg', setpoint: 2400, actual: 2398.6, tolerance: 12, decimals: 1 },
  { no: 2, step: 'Charge ethoxylate EO-5521', unit: 'kg', setpoint: 1800, actual: 1803.2, tolerance: 9, decimals: 1 },
  { no: 3, step: 'Heat to reaction temperature', unit: '°C', setpoint: 85, actual: 85.2, tolerance: 2, decimals: 1 },
  { no: 4, step: 'Start agitator', unit: 'rpm', setpoint: 120, actual: 120, tolerance: 5, decimals: 0 },
  { no: 5, step: 'Dose amine AM-3307 over 30 min', unit: 'kg', setpoint: 640, actual: 640.4, tolerance: 4, decimals: 1 },
  { no: 6, step: 'Hold reaction temperature', unit: '°C', setpoint: 85, actual: 87.9, tolerance: 2, decimals: 1 },
  { no: 7, step: 'Keep reactor pressure', unit: 'barg', setpoint: 1.2, actual: 1.25, tolerance: 0.1, decimals: 2 },
  { no: 8, step: 'Cool to transfer temperature', unit: '°C', setpoint: 35, actual: null, tolerance: 2, decimals: 1 },
];

const brStepState = (step: BrStep): { tone: Tone; label: string } => {
  if (step.actual === null) return { tone: 'neutral', label: 'Not started' };
  return Math.abs(step.actual - step.setpoint) > step.tolerance ? { tone: 'critical', label: 'Outside limit' } : { tone: 'success', label: 'Within limit' };
};

const BR_STEP_COLUMNS: DataTableColumn<BrStep>[] = [
  { id: 'no', header: 'No.', numeric: true, width: 'w-12', cell: (step) => step.no },
  { id: 'step', header: 'Step', cell: (step) => step.step },
  { id: 'setpoint', header: 'Setpoint', numeric: true, cell: (step) => `${formatNumber(step.setpoint, step.decimals)} ${step.unit}` },
  { id: 'actual', header: 'Actual', numeric: true, cell: (step) => (step.actual === null ? '—' : `${formatNumber(step.actual, step.decimals)} ${step.unit}`) },
  {
    id: 'deviation',
    header: 'Deviation',
    numeric: true,
    cell: (step) => (step.actual === null ? '—' : `${step.actual - step.setpoint >= 0 ? '+' : '−'}${formatNumber(Math.abs(step.actual - step.setpoint), step.decimals)}`),
  },
  { id: 'limit', header: 'Limit', numeric: true, muted: true, cell: (step) => `± ${formatNumber(step.tolerance, step.decimals)}` },
  { id: 'state', header: 'State', nowrap: true, cell: (step) => <StatusPill tone={brStepState(step).tone}>{brStepState(step).label}</StatusPill> },
];

const BR_ADDITIONS = [
  { time: '12:04', material: 'Solvent SV-9012', lot: 'SV-9012-2602-07', planned: 2400, actual: 2398.6, by: 'Ingrid Haugen' },
  { time: '12:17', material: 'Ethoxylate EO-5521', lot: 'EO-5521-2601-33', planned: 1800, actual: 1803.2, by: 'Ingrid Haugen' },
  { time: '13:08', material: 'Amine AM-3307', lot: 'AM-3307-2602-12', planned: 640, actual: 640.4, by: 'Tomás Barros' },
  { time: '13:41', material: 'Catalyst CT-0214', lot: 'CT-0214-2512-02', planned: 12, actual: 12.1, by: 'Tomás Barros' },
];

const BR_CHANGES = [
  { at: '12 Mar, 13:22', who: 'Aisha Khan', parameter: 'React temperature setpoint', from: '85.0 °C', to: '86.0 °C', why: 'Viscosity trending high in the sample' },
  { at: '12 Mar, 12:47', who: 'Ingrid Haugen', parameter: 'Agitator speed', from: '110 rpm', to: '120 rpm', why: 'Recipe R-CI40 v7 step 4' },
  { at: '11 Mar, 16:10', who: 'Aisha Khan', parameter: 'Recipe R-CI40 version', from: 'v6', to: 'v7', why: 'Approved by change request MoC-0219' },
];

const BR_LANES: LaneRow[] = [
  {
    id: 'r1',
    name: 'Reactor 1',
    tag: '62-RA-6201',
    bookings: [
      { id: 'b116', label: 'B-116', from: 0, to: 4, state: 'done' },
      { id: 'b118', label: 'B-118', from: 6, to: 10.2, state: 'running' },
      { id: 'b119', label: 'B-119', from: 12, to: 16.2, state: 'planned' },
    ],
  },
  {
    id: 'r2',
    name: 'Reactor 2',
    tag: '62-RA-6202',
    bookings: [
      { id: 'b114', label: 'B-114', from: 0, to: 3, state: 'done' },
      { id: 'b117', label: 'B-117', from: 5, to: 9, state: 'hold' },
      { id: 'b120', label: 'B-120', from: 14, to: 18, state: 'planned' },
    ],
  },
  {
    id: 'tk',
    name: 'Transfer tank',
    tag: '62-TK-6210',
    bookings: [
      { id: 't116', label: 'B-116', from: 4, to: 6, state: 'done' },
      { id: 't118', label: 'B-118', from: 10.2, to: 12.2, state: 'planned' },
    ],
  },
];

const BR_LANE_TICKS = ['06:00', '09:00', '12:00', '15:00', '18:00', '21:00', '00:00'];

const BR_BOOKING_NOTE: Record<string, string> = {
  b116: 'B-2603-116 finished at 10:00 and awaits release.',
  b118: 'B-2603-118 is in React, 6 minutes behind the golden batch.',
  b119: 'B-2603-119 is planned for 18:00, after cleaning.',
  b114: 'B-2603-114 was rejected on yield.',
  b117: 'B-2603-117 is on hold: amine feed pump tripped.',
  b120: 'B-2603-120 is planned for 20:00.',
  t116: 'Transfer of B-2603-116 finished at 12:00.',
  t118: 'Transfer of B-2603-118 is planned for 16:12.',
};

type BrReleaseState = 'done' | 'held' | 'pending';

const BR_RELEASE: { id: string; label: string; detail: string; state: BrReleaseState }[] = [
  { id: 'sample', label: 'Sample taken at end of React', detail: 'Lab sample S-260312-31', state: 'done' },
  { id: 'lab', label: 'Lab results within specification', detail: 'Viscosity 41 cSt, specification 38 to 44', state: 'done' },
  { id: 'dev', label: 'Deviations closed', detail: 'DEV-0412 is open', state: 'held' },
  { id: 'review', label: 'Batch record reviewed', detail: 'Waits for the deviation', state: 'pending' },
  { id: 'release', label: 'Released by quality', detail: 'Waits for the review', state: 'pending' },
];

const BR_RELEASE_STATE: Record<BrReleaseState, { tone: Tone; label: string; icon: ReactNode }> = {
  done: { tone: 'success', label: 'Done', icon: <IconCircleCheck /> },
  held: { tone: 'warning', label: 'Held', icon: <IconPlayerPause /> },
  pending: { tone: 'neutral', label: 'Pending', icon: <IconClock /> },
};

const BR_SIGNERS = [
  { id: 'operator', role: 'Operator', name: 'Ingrid Haugen', at: '12 Mar, 13:40' },
  { id: 'supervisor', role: 'Shift supervisor', name: 'Liv Wold', at: '12 Mar, 13:55' },
  { id: 'quality', role: 'Quality assurance', name: 'Aisha Khan', at: '12 Mar, 14:05' },
];

type BrDeviation = { id: string; batch: string; what: string; cls: 'Minor' | 'Major' | 'Critical'; state: 'Open' | 'Closed'; owner: string };

const BR_DEVIATIONS: BrDeviation[] = [
  { id: 'DEV-0412', batch: 'B-2603-118', what: 'Reaction temperature 2.9 °C above setpoint for 14 minutes', cls: 'Major', state: 'Open', owner: 'Aisha Khan' },
  { id: 'DEV-0409', batch: 'B-2603-117', what: 'Amine feed pump tripped during dosing', cls: 'Major', state: 'Open', owner: 'Tomás Barros' },
  { id: 'DEV-0405', batch: 'B-2603-114', what: 'Yield 91.2 %, below the 97 % limit', cls: 'Critical', state: 'Closed', owner: 'Aisha Khan' },
  { id: 'DEV-0398', batch: 'B-2603-113', what: 'Heat phase 5 minutes longer than the recipe allows', cls: 'Minor', state: 'Closed', owner: 'Liv Wold' },
];

const BR_CLASS_TONE: Record<BrDeviation['cls'], Tone> = { Minor: 'info', Major: 'warning', Critical: 'critical' };

const BR_DEVIATION_COLUMNS: DataTableColumn<BrDeviation>[] = [
  { id: 'id', header: 'Deviation', nowrap: true, cell: (row) => <TagId>{row.id}</TagId> },
  { id: 'batch', header: 'Batch', nowrap: true, cell: (row) => <TagId>{row.batch}</TagId> },
  { id: 'what', header: 'What happened', cell: (row) => row.what },
  { id: 'class', header: 'Class', nowrap: true, cell: (row) => <StatusPill tone={BR_CLASS_TONE[row.cls]}>{row.cls}</StatusPill> },
  { id: 'state', header: 'State', nowrap: true, cell: (row) => <StatusPill tone={row.state === 'Open' ? 'warning' : 'success'}>{row.state}</StatusPill> },
  { id: 'owner', header: 'Owner', nowrap: true, muted: true, cell: (row) => row.owner },
];

const BR_LOT_TONES: Tone[] = ['blue', 'teal', 'purple', 'amber'];

const BR_TOLERANCES = [
  { id: '1', label: '± 1 °C' },
  { id: '2', label: '± 2 °C' },
  { id: '4', label: '± 4 °C' },
];

function BrSheet({ look, children }: { look: LookId; children: ReactNode }) {
  return (
    <LookScope look={look}>
      <Canvas>{children}</Canvas>
    </LookScope>
  );
}

function BrGolden({ tolerance = 2, height = 300 }: { tolerance?: number; height?: number }) {
  return (
    <GoldenProfile
      label="Reactor temperature of batch B-2603-118 against the golden batch and its tolerance band"
      golden={BR_GOLDEN}
      actual={BR_ALIGNED}
      phases={BR_GOLDEN_PHASES}
      tolerance={tolerance}
      excursions={deviationScore(BR_ALIGNED, BR_GOLDEN, tolerance).excursions}
      unit="°C"
      yDomain={[10, 100]}
      height={height}
    />
  );
}

function BrFacts() {
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
      {[
        ['Product', BR_BATCH.product],
        ['Recipe', BR_BATCH.recipe],
        ['Vessel', BR_BATCH.vessel],
        ['Batch size', BR_BATCH.size],
        ['Started', BR_BATCH.started],
        ['Site', BR_BATCH.site],
      ].map(([term, value]) => (
        <div key={term}>
          <dt className="text-xs leading-4 text-(--kit-text-2)">{term}</dt>
          <dd className="leading-5 font-medium text-(--kit-text) tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function BatchRecipeHeader() {
  return (
    <BrSheet look="studio">
      <Grid>
        <SectionHeader
          className="col-span-12"
          size="lg"
          eyebrow={`${BR_BATCH.recipe} · ${BR_BATCH.vessel}`}
          title={`Batch ${BR_BATCH.id}`}
          description={`${BR_BATCH.product} · started ${BR_BATCH.started}`}
          actions={
            <StatusPill tone="info" size="lg" icon={<IconPlayerPlay />}>
              Running · React
            </StatusPill>
          }
        />
        <Stat className="col-span-3" label="Elapsed" value={118} unit="min" icon={<IconClock />} tone="blue" target="Golden batch at 114 min" emphasis="strong" />
        <Stat className="col-span-3" label="Reactor temperature" value={BR_LAST.v} decimals={1} unit="°C" icon={<IconTemperature />} tone="amber" target="Setpoint 85.0 °C" />
        <Stat className="col-span-3" label="Within tolerance" value={BR_SCORE.conformance} unit="%" icon={<IconCircleCheck />} tone="teal" target={`${BR_SCORE.excursions.length} excursion`} />
        <Stat className="col-span-3" label="Expected finish" value="16:16" icon={<IconFlask />} tone="purple" delta={{ value: 4, decimals: 0, unit: ' min', good: 'down', caption: 'vs golden' }} />
        <Panel className="col-span-12" title="Phases" subtitle="Each phase is as wide as the recipe allows">
          <PhaseTrack label={`Phases of batch ${BR_BATCH.id}`} phases={BR_TRACK} />
        </Panel>
      </Grid>
    </BrSheet>
  );
}

function BatchRecipePhases() {
  const [selectedId, setSelectedId] = useState('react');
  const phase = BR_TRACK_HELD.find((candidate) => candidate.id === selectedId);
  return (
    <BrSheet look="console">
      <Grid>
        <Panel className="col-span-12" title={`${BR_BATCH.id} · running`} subtitle="Select a phase" padding="none">
          <PhaseTrack label="Phases of the running batch" phases={BR_TRACK} selectedId={selectedId} onSelect={setSelectedId} />
        </Panel>
        <Panel className="col-span-12" title="B-2603-117 · on hold" subtitle="R-DM12 v3 · 62-RA-6202" tone="warning" padding="none">
          <PhaseTrack label="Phases of the held batch" phases={BR_TRACK_HELD} />
        </Panel>
        <Panel className="col-span-7" title="Hold reason">
          <BlockNotice tone="warning" icon={<IconPlayerPause />} title="Amine feed pump 62-PA-6215 tripped" detail="Held by Tomás Barros at 13:12. Dosing resumes from 412 of 640 kg when the pump is back." />
        </Panel>
        <Panel className="col-span-5" title={`Selected phase · ${phase?.label ?? ''}`}>
          <Stat variant="plain" label="Minutes" value={phase?.actual === null ? '—' : `${phase?.actual ?? 0} of ${phase?.expected ?? 0}`} target={phase?.actual === null ? 'Not started' : 'Against the recipe'} />
        </Panel>
      </Grid>
    </BrSheet>
  );
}

function BatchRecipeList() {
  return (
    <BrSheet look="studio">
      <Panel title="Batches" subtitle="Stord terminal · today and yesterday" padding="none" icon={<IconChip tone="blue"><IconFlask /></IconChip>}>
        <DataTable
          label="Batches"
          flush
          columns={BR_BATCH_COLUMNS}
          rows={BR_BATCHES}
          rowKey={(batch) => batch.id}
          rowTone={(batch) => (batch.state === 'hold' || batch.state === 'rejected' ? BR_STATE[batch.state].tone : undefined)}
        />
      </Panel>
    </BrSheet>
  );
}

function BatchRecipeEquipment() {
  const [selectedId, setSelectedId] = useState('b118');
  return (
    <BrSheet look="blueprint">
      <Panel title="Vessel allocation" subtitle="12 Mar · 06:00 to 00:00" footer={BR_BOOKING_NOTE[selectedId]}>
        <BatchLane label="Vessel allocation from 06:00 to midnight" rows={BR_LANES} hours={18} ticks={BR_LANE_TICKS} nowAt={8} selectedId={selectedId} onSelect={setSelectedId} />
      </Panel>
    </BrSheet>
  );
}

function BatchRecipeSteps() {
  return (
    <BrSheet look="studio">
      <Panel title="Recipe steps" subtitle={`${BR_BATCH.recipe} · setpoint, actual and deviation`} padding="none" footer="One step is outside its limit: DEV-0412 was raised automatically.">
        <DataTable label="Recipe steps with setpoints and actuals" flush columns={BR_STEP_COLUMNS} rows={BR_STEPS} rowKey={(step) => String(step.no)} rowTone={(step) => (brStepState(step).tone === 'critical' ? 'critical' : undefined)} />
      </Panel>
    </BrSheet>
  );
}

function BatchRecipeStepProgress() {
  const done = BR_STEPS.filter((step) => step.actual !== null).length - 1;
  return (
    <BrSheet look="soft">
      <Grid>
        <Panel className="col-span-4" tone="teal" title="Recipe progress" subtitle={BR_BATCH.recipe}>
          <div className="flex h-full flex-col items-center justify-center gap-4">
            <RingGauge label="Steps done" value={done} max={BR_STEPS.length} unit={`of ${BR_STEPS.length}`} size={168} tone="teal" />
            <StatusPill tone="info" size="lg" icon={<IconPlayerPlay />}>
              Step {done + 1} in progress
            </StatusPill>
          </div>
        </Panel>
        <Panel className="col-span-8" title="Steps" subtitle="What the operator does next">
          <ul>
            {BR_STEPS.slice(3).map((step) => {
              const state: { tone: Tone; label: string } = step.actual === null ? { tone: 'neutral', label: 'Not started' } : step.no > done ? { tone: 'info', label: 'In progress' } : { tone: 'success', label: 'Done' };
              return (
                <ListRow
                  key={step.no}
                  tone={state.tone}
                  leading={
                    <IconChip tone={state.tone} size="sm">
                      {state.label === 'Done' ? <IconCircleCheck /> : state.label === 'In progress' ? <IconPlayerPlay /> : <IconClock />}
                    </IconChip>
                  }
                  title={`${step.no}. ${step.step}`}
                  meta={`Setpoint ${formatNumber(step.setpoint, step.decimals)} ${step.unit}`}
                  trailing={<StatusPill tone={state.tone}>{state.label}</StatusPill>}
                />
              );
            })}
          </ul>
        </Panel>
      </Grid>
    </BrSheet>
  );
}

function BatchRecipeAdditions() {
  return (
    <BrSheet look="editorial">
      <Grid>
        <Panel className="col-span-6" title="Material additions" subtitle="What went into the vessel">
          <ul>
            {BR_ADDITIONS.map((addition) => (
              <ListRow
                key={addition.lot}
                title={addition.material}
                meta={
                  <>
                    <TagId>{addition.lot}</TagId>
                    <span>
                      {addition.time} · {addition.by}
                    </span>
                  </>
                }
                trailing={
                  <span className="text-right tabular-nums">
                    <span className="block text-base font-semibold text-(--kit-text)">{formatNumber(addition.actual, 1)} kg</span>
                    <span className="block text-xs">of {formatNumber(addition.planned, 0)} planned</span>
                  </span>
                }
              />
            ))}
          </ul>
        </Panel>
        <Panel className="col-span-6" title="Parameter changes" subtitle="Who changed what, and why">
          <ul>
            {BR_CHANGES.map((change) => (
              <ListRow
                key={change.at}
                title={change.parameter}
                meta={
                  <>
                    <span className="font-medium text-(--kit-text) tabular-nums">
                      {change.from} → {change.to}
                    </span>
                    <span>{change.why}</span>
                  </>
                }
                trailing={
                  <span className="text-right">
                    <span className="block">{change.who}</span>
                    <span className="block text-xs tabular-nums">{change.at}</span>
                  </span>
                }
              />
            ))}
          </ul>
        </Panel>
      </Grid>
    </BrSheet>
  );
}

function BatchRecipeControls() {
  const [state, setState] = useState<'running' | 'hold' | 'confirm' | 'aborted'>('running');
  const [typed, setTyped] = useState('');
  const held = state === 'hold' || state === 'confirm';
  return (
    <BrSheet look="console">
      <Grid>
        <Panel className="col-span-5" title={`${BR_BATCH.id} · control`} subtitle={BR_BATCH.vessel} tone={state === 'aborted' ? 'critical' : held ? 'warning' : 'info'}>
          <div className="flex h-full flex-col gap-4">
            <Stat variant="plain" size="lg" label="Batch state" value={state === 'aborted' ? 'Aborted' : held ? 'On hold' : 'Running'} target={state === 'aborted' ? 'Vessel goes to safe state' : held ? 'Phase timer stopped at 54 min' : 'React · 54 of 90 min'} />
            <div className="mt-auto flex flex-wrap gap-2">
              {state === 'running' ? (
                <Button variant="outline" onClick={() => setState('hold')}>
                  <IconPlayerPause /> Hold batch
                </Button>
              ) : null}
              {held ? (
                <Button onClick={() => setState('running')}>
                  <IconPlayerPlay /> Resume
                </Button>
              ) : null}
              {state === 'hold' ? (
                <Button variant="destructive" onClick={() => setState('confirm')}>
                  <IconPlayerStop /> Abort batch
                </Button>
              ) : null}
              {state === 'aborted' ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setTyped('');
                    setState('running');
                  }}
                >
                  Reset the example
                </Button>
              ) : null}
            </div>
          </div>
        </Panel>
        <Panel className="col-span-7" title="What happens" subtitle="Every action says its consequence before it is taken">
          {state === 'running' ? <BlockNotice variant="block" tone="info" icon={<IconPlayerPlay />} title="Batch is running" detail="Hold stops dosing and the phase timer; heating and agitation continue. A batch must be on hold before it can be aborted." /> : null}
          {state === 'hold' ? <BlockNotice variant="block" tone="warning" icon={<IconPlayerPause />} title="Batch is on hold" detail="Dosing and the phase timer are stopped. Resume continues from 54 minutes. Abort ends the batch and cannot be undone." /> : null}
          {state === 'confirm' ? (
            <div className="flex h-full flex-col gap-3">
              <BlockNotice tone="critical" icon={<IconAlertOctagon />} title="Abort ends the batch" detail="5 200 kg will be routed to rework. This cannot be undone." />
              <label htmlFor="br-abort" className="text-sm font-medium text-(--kit-text)">
                Type the batch number {BR_BATCH.id} to confirm
              </label>
              <div className="flex flex-wrap gap-2">
                <Input id="br-abort" value={typed} onChange={(event) => setTyped(event.target.value)} placeholder={BR_BATCH.id} className="max-w-56" />
                <Button variant="destructive" disabled={typed !== BR_BATCH.id} onClick={() => setState('aborted')}>
                  Abort batch
                </Button>
                <Button variant="ghost" onClick={() => setState('hold')}>
                  Keep on hold
                </Button>
              </div>
            </div>
          ) : null}
          {state === 'aborted' ? <BlockNotice variant="block" tone="critical" icon={<IconPlayerStop />} title="Batch aborted" detail="Aborted by Ingrid Haugen at 14:02. Deviation DEV-0413 was opened and the vessel is cooling to 35 °C." /> : null}
        </Panel>
      </Grid>
    </BrSheet>
  );
}

function BatchRecipeGolden() {
  return (
    <BrSheet look="studio">
      <Grid>
        <Panel className="col-span-9" title="Golden-batch comparison" subtitle="Reactor temperature, aligned phase by phase" icon={<IconChip tone="amber"><IconTemperature /></IconChip>}>
          <BrGolden />
        </Panel>
        <Grid stack className="col-span-3">
          <Stat label="Within tolerance" value={BR_SCORE.conformance} unit="%" tone="teal" target={`${BR_SCORE.compared} points compared`} />
          <Stat label="Largest deviation" value={`${BR_SCORE.maxDeviation > 0 ? '+' : '−'}${formatNumber(Math.abs(BR_SCORE.maxDeviation), 1)}`} unit="°C" tone="critical" target="In React" />
          <Stat label="RMS deviation" value={BR_SCORE.rms} decimals={2} unit="°C" tone="neutral" target="Tolerance ± 2.0" />
        </Grid>
      </Grid>
    </BrSheet>
  );
}

function BatchRecipeGoldenTolerance() {
  const [tolerance, setTolerance] = useState('2');
  const score = deviationScore(BR_ALIGNED, BR_GOLDEN, Number(tolerance));
  return (
    <BrSheet look="glass">
      <Grid>
        <Panel className="col-span-9" title="Adjustable tolerance" subtitle="Widen or narrow the band and see which excursions remain" actions={<RangeSwitch label="Tolerance" options={BR_TOLERANCES} value={tolerance} onChange={setTolerance} />}>
          <BrGolden tolerance={Number(tolerance)} height={280} />
        </Panel>
        <Panel className="col-span-3" title="Conformance" subtitle={`At ± ${tolerance} °C`}>
          <div className="flex h-full flex-col items-center justify-center gap-4">
            <RingGauge label="Points within tolerance" value={score.conformance} size={148} tone={score.conformance >= 90 ? 'success' : 'warning'} hideLabel />
            <p className="text-center text-sm text-(--kit-text-2)">
              {score.excursions.length === 0 ? 'No excursions' : `${score.excursions.length} excursion${score.excursions.length === 1 ? '' : 's'}`} · {score.compared} points
            </p>
          </div>
        </Panel>
      </Grid>
    </BrSheet>
  );
}

function BatchRecipeAlignment() {
  const started = BR_DURATIONS.filter((duration) => duration.actual !== null);
  return (
    <BrSheet look="blueprint">
      <Grid>
        <Panel className="col-span-7" title="Alignment by phase" subtitle="Minutes per phase · this batch against the golden batch">
          <Bars
            label="Minutes per phase for this batch and the golden batch"
            orientation="horizontal"
            categories={BR_DURATIONS.map((duration) => duration.label)}
            series={[
              { id: 'actual', label: 'This batch', values: BR_DURATIONS.map((duration) => duration.actual ?? 0), tone: 'accent' },
              { id: 'golden', label: 'Golden batch', values: BR_DURATIONS.map((duration) => duration.expected), tone: 'amber' },
            ]}
            unit="min"
            showValues
            height={300}
          />
        </Panel>
        <Panel className="col-span-5" title="Started phases" subtitle="Golden duration marked">
          <div className="flex h-full flex-col justify-between gap-4">
          {started.map((duration) => (
            <Meter
              key={duration.id}
              label={duration.label}
              value={duration.actual ?? 0}
              max={Math.max(duration.expected * 1.3, duration.actual ?? 0)}
              unit="min"
              target={{ value: duration.expected, label: 'Golden' }}
              tone={duration.overrun !== null && duration.overrun > 0 ? 'warning' : 'accent'}
            />
          ))}
          <p className="text-sm leading-5 text-(--kit-text-2)">Each finished phase is stretched to the golden phase before values are compared, so a late Heat does not shift React.</p>
          </div>
        </Panel>
      </Grid>
    </BrSheet>
  );
}

function BatchRecipePareto() {
  return (
    <BrSheet look="poster">
      <Grid>
        <Panel className="col-span-8" title="Phase overrun" subtitle="Lost minutes per phase, last 20 batches">
          <Bars
            label="Lost minutes per phase over the last twenty batches"
            categories={['Heat', 'React', 'Cool', 'Charge', 'Transfer', 'Hold']}
            series={[{ id: 'lost', label: 'Lost minutes', values: [86, 54, 31, 12, 7, 4] }]}
            tones={['pink', 'pink', 'amber', 'blue', 'blue', 'blue']}
            unit="min"
            showValues
            height={260}
          />
        </Panel>
        <Grid stack className="col-span-4">
          <Stat label="Heat and React" value={72} unit="%" tone="pink" target="of all lost minutes" />
          <Stat label="Lost per batch" value={9.7} decimals={1} unit="min" tone="amber" target="194 min in 20 batches" />
        </Grid>
      </Grid>
    </BrSheet>
  );
}

function BatchRecipeKpis() {
  return (
    <BrSheet look="signal">
      <StatGroup columns={4} label="Last finished batch">
        <Stat label="Cycle time" value={238} unit="min" tone="success" state="Fast" stateIcon={<IconCircleCheck />} target="Golden 250 min" />
        <Stat label="Yield" value={98.4} decimals={1} unit="%" tone="success" state="In spec" stateIcon={<IconCircleCheck />} target="Limit 97.0 %" />
        <Stat label="Energy" value={61.2} decimals={1} unit="kWh/t" tone="success" state="Normal" stateIcon={<IconCircleCheck />} target="Reference 62.0" />
        <Stat label="Release" value="DEV-0412" tone="warning" state="Waiting" stateIcon={<IconAlertTriangle />} target="1 deviation open" />
      </StatGroup>
    </BrSheet>
  );
}

function BatchRecipeComparison() {
  return (
    <BrSheet look="studio">
      <Grid>
        <Panel className="col-span-8" title="Finished batches" subtitle="Cycle, yield and energy" padding="none">
          <DataTable
            label="Finished batches compared"
            flush
            columns={[
              ...BR_BATCH_COLUMNS.filter((column) => ['batch', 'state', 'cycle', 'yield'].includes(column.id)),
              { id: 'energy', header: 'Energy', numeric: true, cell: (batch) => brFigure(batch.energy, 1, 'kWh/t') },
            ]}
            rows={BR_FINISHED}
            rowKey={(batch) => batch.id}
            rowTone={(batch) => (batch.state === 'rejected' ? 'critical' : undefined)}
          />
        </Panel>
        <Panel className="col-span-4" title="Cycle time by batch" subtitle="Minutes against the golden batch">
          <Bars
            label="Cycle time of the last four finished batches against the golden batch"
            categories={BR_FINISHED.map((batch) => batch.id.slice(-3))}
            series={[{ id: 'cycle', label: 'Cycle time', values: BR_FINISHED.map((batch) => batch.cycle ?? 0) }]}
            tones={BR_FINISHED.map((batch) => ((batch.cycle ?? 0) > 250 ? 'warning' : 'accent'))}
            showValues
            height={220}
            limit={{ value: 250, label: 'Golden', tone: 'success' }}
          />
        </Panel>
      </Grid>
    </BrSheet>
  );
}

function BatchRecipeGenealogy() {
  return (
    <BrSheet look="soft">
      <Panel title="Genealogy" subtitle="Raw material lots into the batch, the batch into product lots">
        <Genealogy
          label={`Genealogy of batch ${BR_BATCH.id}`}
          inputs={BR_ADDITIONS.map((addition, index) => ({ id: addition.lot, label: addition.material, detail: `${formatNumber(addition.actual, 1)} kg`, tone: BR_LOT_TONES[index] }))}
          batch={{ id: BR_BATCH.id, label: BR_BATCH.product, detail: `${BR_BATCH.size} · ${BR_BATCH.vessel}` }}
          outputs={[
            { id: 'CI40-260312-A', label: 'IBC 0451', detail: '1 000 kg', tone: 'green' },
            { id: 'CI40-260312-B', label: 'IBC 0452', detail: '1 000 kg', tone: 'green' },
            { id: 'CI40-260312-C', label: 'Drum line', detail: '3 000 kg', tone: 'green' },
          ]}
        />
      </Panel>
    </BrSheet>
  );
}

function BrReleaseRows() {
  return (
    <ul>
      {BR_RELEASE.map((step) => (
        <ListRow
          key={step.id}
          tone={BR_RELEASE_STATE[step.state].tone}
          leading={
            <IconChip tone={BR_RELEASE_STATE[step.state].tone} size="sm">
              {BR_RELEASE_STATE[step.state].icon}
            </IconChip>
          }
          title={step.label}
          meta={step.detail}
          trailing={<StatusPill tone={BR_RELEASE_STATE[step.state].tone}>{BR_RELEASE_STATE[step.state].label}</StatusPill>}
        />
      ))}
    </ul>
  );
}

function BatchRecipeRelease() {
  const [signed, setSigned] = useState(1);
  return (
    <BrSheet look="studio">
      <Grid>
        <Panel className="col-span-6" title="Quality release" subtitle={`${BR_BATCH.id} · held by one open deviation`} icon={<IconChip tone="teal"><IconTestPipe /></IconChip>}>
          <BrReleaseRows />
        </Panel>
        <Panel className="col-span-6" title="Deviation DEV-0412 signatures" subtitle="Roles sign in order" icon={<IconChip tone="purple"><IconSignature /></IconChip>}>
          <ul>
            {BR_SIGNERS.map((signer, index) => (
              <ListRow
                key={signer.id}
                tone={index < signed ? 'success' : index === signed ? 'info' : 'neutral'}
                title={signer.role}
                meta={index < signed ? `${signer.name} · signed ${signer.at}` : signer.name}
                trailing={
                  index < signed ? (
                    <StatusPill tone="success" icon={<IconCircleCheck />}>
                      Signed
                    </StatusPill>
                  ) : index === signed ? (
                    <Button size="sm" onClick={() => setSigned(signed + 1)}>
                      Sign deviation
                    </Button>
                  ) : (
                    <StatusPill tone="neutral">Waiting</StatusPill>
                  )
                }
              />
            ))}
          </ul>
          <BlockNotice className="mt-4" tone={signed >= BR_SIGNERS.length ? 'success' : 'info'} icon={<IconSignature />} title={signed >= BR_SIGNERS.length ? 'Deviation signed by all three roles' : `${BR_SIGNERS.length - signed} of ${BR_SIGNERS.length} signatures outstanding`} detail="The batch record can be reviewed once the deviation is fully signed." />
        </Panel>
      </Grid>
    </BrSheet>
  );
}

function BatchRecipeDeviations() {
  return (
    <BrSheet look="editorial">
      <Grid>
        <SectionHeader className="col-span-12" size="sm" eyebrow="Quality" title="Two deviations are open; one holds a release" />
        <div className="col-span-12">
          <DataTable label="Deviation log" columns={BR_DEVIATION_COLUMNS} rows={BR_DEVIATIONS} rowKey={(row) => row.id} rowTone={(row) => (row.state === 'Open' ? 'warning' : undefined)} />
        </div>
      </Grid>
    </BrSheet>
  );
}

function BatchRecipeMonitor() {
  return (
    <LookScope look="studio">
      <AppFrame
        variant="topbar"
        brand={{ name: 'Stord terminal', detail: 'Batch execution', mark: <IconFlask /> }}
        nav={[
          { id: 'batch', label: 'Batch' },
          { id: 'recipe', label: 'Recipe' },
          { id: 'record', label: 'Record' },
          { id: 'deviations', label: 'Deviations', badge: '1' },
        ]}
        current="batch"
        title={`Batch ${BR_BATCH.id}`}
        subtitle={`${BR_BATCH.product} · ${BR_BATCH.recipe} · ${BR_BATCH.vessel}`}
        status={
          <StatusPill tone="info" icon={<IconPlayerPlay />}>
            Running · React
          </StatusPill>
        }
        actions={
          <Button variant="outline" size="sm">
            <IconPlayerPause /> Hold batch
          </Button>
        }
      >
        <Grid>
          <Panel className="col-span-12" padding="tight">
            <PhaseTrack label={`Phases of batch ${BR_BATCH.id}`} phases={BR_TRACK} />
          </Panel>
          <Panel className="col-span-8" title="Reactor temperature" subtitle="Against the golden batch">
            <BrGolden height={390} />
          </Panel>
          <Grid stack className="col-span-4">
            <Stat label="Within tolerance" value={BR_SCORE.conformance} unit="%" tone="teal" icon={<IconCircleCheck />} target={`${BR_SCORE.excursions.length} excursion in React`} />
            <Stat label="Elapsed" value={118} unit="min" tone="blue" icon={<IconClock />} delta={{ value: 4, decimals: 0, unit: ' min', good: 'down', caption: 'vs golden' }} />
            <Panel title="Batch">
              <BrFacts />
            </Panel>
          </Grid>
          <Panel className="col-span-12" title="Recipe steps" subtitle="Setpoint, actual and deviation" padding="none">
            <DataTable label="Recipe steps" flush columns={BR_STEP_COLUMNS} rows={BR_STEPS.slice(2)} rowKey={(step) => String(step.no)} rowTone={(step) => (brStepState(step).tone === 'critical' ? 'critical' : undefined)} />
          </Panel>
        </Grid>
      </AppFrame>
    </LookScope>
  );
}

function BatchRecipeControlRoom() {
  return (
    <BrSheet look="console">
      <Grid>
        <Panel className="col-span-12" title="Batch plant · Stord terminal" subtitle="12 Mar · 14:00" padding="none">
          <StatGroup columns={5} joined label="Plant figures">
            <Stat variant="plain" size="sm" label="Running" value={1} tone="info" target="B-2603-118" />
            <Stat variant="plain" size="sm" label="On hold" value={1} tone="warning" target="B-2603-117" />
            <Stat variant="plain" size="sm" label="Awaiting release" value={1} tone="purple" target="B-2603-116" />
            <Stat variant="plain" size="sm" label="Open deviations" value={2} tone="critical" target="1 major" />
            <Stat variant="plain" size="sm" label="Yield, 7 days" value={97.6} decimals={1} unit="%" target="Limit 97.0" />
          </StatGroup>
        </Panel>
        <Panel className="col-span-12" title="62-RA-6201 · B-2603-118" subtitle="R-CI40 v7" padding="none">
          <PhaseTrack label="Phases in reactor 1" phases={BR_TRACK} />
        </Panel>
        <Panel className="col-span-12" title="62-RA-6202 · B-2603-117" subtitle="R-DM12 v3 · amine feed pump tripped" tone="warning" padding="none">
          <PhaseTrack label="Phases in reactor 2" phases={BR_TRACK_HELD} />
        </Panel>
        <Panel className="col-span-7" title="Vessel allocation" subtitle="06:00 to 00:00">
          <BatchLane label="Vessel allocation from 06:00 to midnight" rows={BR_LANES} hours={18} ticks={BR_LANE_TICKS} nowAt={8} />
        </Panel>
        <Panel className="col-span-5" title="Batches" padding="none">
          <DataTable label="Batches" flush columns={BR_BATCH_COLUMNS.filter((column) => ['batch', 'vessel', 'state'].includes(column.id))} rows={BR_BATCHES.slice(0, 6)} rowKey={(batch) => batch.id} rowTone={(batch) => (batch.state === 'hold' || batch.state === 'rejected' ? BR_STATE[batch.state].tone : undefined)} />
        </Panel>
      </Grid>
    </BrSheet>
  );
}

function BatchRecipeRecord() {
  return (
    <LookScope look="editorial">
      <AppFrame brand={{ name: 'Batch record', detail: `${BR_BATCH.site} · issued 12 Mar 2026` }} nav={[]} title={`${BR_BATCH.id} — ${BR_BATCH.product}`} subtitle="Complete, awaiting release: one major deviation is open">
        <Grid>
          <StatGroup className="col-span-12" columns={4} label="Batch figures">
            <Stat variant="plain" size="lg" label="Cycle time" value={254} unit="min" delta={{ value: 4, decimals: 0, unit: ' min', good: 'down', caption: 'vs golden' }} />
            <Stat variant="plain" size="lg" label="Yield" value={98.6} decimals={1} unit="%" target="Limit 97.0 %" />
            <Stat variant="plain" size="lg" label="Within tolerance" value={BR_SCORE.conformance} unit="%" target="± 2.0 °C" />
            <Stat variant="plain" size="lg" label="Deviations" value={1} target="DEV-0412, major" />
          </StatGroup>
          <Panel className="col-span-7" title="Temperature against the golden batch">
            <BrGolden height={260} />
          </Panel>
          <Panel className="col-span-5" title="Release">
            <BrReleaseRows />
          </Panel>
          <Panel className="col-span-12" title="Genealogy">
            <Genealogy
              label={`Genealogy of batch ${BR_BATCH.id}`}
              inputs={BR_ADDITIONS.map((addition) => ({ id: addition.lot, label: addition.material, detail: `${formatNumber(addition.actual, 1)} kg` }))}
              batch={{ id: BR_BATCH.id, label: BR_BATCH.product, detail: BR_BATCH.size }}
              outputs={[
                { id: 'CI40-260312-A', label: 'IBC 0451', detail: '1 000 kg' },
                { id: 'CI40-260312-B', label: 'IBC 0452', detail: '1 000 kg' },
                { id: 'CI40-260312-C', label: 'Drum line', detail: '3 000 kg' },
              ]}
            />
          </Panel>
        </Grid>
      </AppFrame>
    </LookScope>
  );
}

export default definePage({
  id: 'batch-and-recipe',
  title: 'Batch and recipe',
  summary:
    'Following a batch through its recipe: phase tracks, vessel allocation, steps with setpoints and actuals, the golden-batch comparison, batch-to-batch figures, genealogy and quality release — in seven looks and three finished screens.',
  guidance: {
    use: [
      'Draw each phase as wide as the recipe allows, so being late is visible without reading a number.',
      'Align a running batch to the golden batch phase by phase before comparing values.',
      'Say what a control does before it does it; make abort need a hold first and the batch number typed.',
      'Show what holds a release next to the release steps.',
    ],
    avoid: [
      'Comparing a batch with the golden profile on raw clock time.',
      'Colour alone for a held or rejected batch: write the state.',
      'Drawing planned bookings like finished ones.',
      'Hiding who changed a parameter and why.',
    ],
  },
  source,
  sections: [
    {
      id: 'batch',
      title: 'The batch',
      description: 'Where a batch is, and which vessel holds it.',
      specimens: [
        {
          id: 'BatchRecipeHeader',
          title: 'Batch header with phase track',
          note: 'Pick it at the top of a batch page: identity, state, four figures and the phases as bars.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/batch-and-recipe/PhaseTrack.tsx', 'kit/SectionHeader.tsx', 'kit/Stat.tsx'],
          Component: BatchRecipeHeader,
        },
        {
          id: 'BatchRecipePhases',
          title: 'Phase blocks, running and held',
          note: 'Pick it on an operator console: every phase is a block with its state as a word; select one for its minutes.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/batch-and-recipe/PhaseTrack.tsx', 'kit/dashboard-blocks/BlockNotice.tsx', 'kit/Panel.tsx'],
          Component: BatchRecipePhases,
        },
        {
          id: 'BatchRecipeList',
          title: 'Batch list',
          note: 'Pick it for the batches of a shift: product, vessel, a written state and the figures of finished ones.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/DataTable.tsx', 'kit/StatusPill.tsx', 'kit/TagId.tsx'],
          Component: BatchRecipeList,
        },
        {
          id: 'BatchRecipeEquipment',
          title: 'Vessel allocation',
          note: 'Pick it to see which vessel holds which batch when; planned bookings stay outlined. Select a booking.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/batch-and-recipe/BatchLane.tsx', 'kit/Panel.tsx'],
          Component: BatchRecipeEquipment,
        },
      ],
    },
    {
      id: 'recipe',
      title: 'Recipe, materials and control',
      description: 'What the recipe asks for, what was done and who changed what.',
      specimens: [
        {
          id: 'BatchRecipeSteps',
          title: 'Steps with setpoints and actuals',
          note: 'Pick it for the batch record: setpoint, actual, deviation and limit per step, with the state in words.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/DataTable.tsx', 'kit/StatusPill.tsx', 'kit/Panel.tsx'],
          Component: BatchRecipeSteps,
        },
        {
          id: 'BatchRecipeStepProgress',
          title: 'Step progress for the operator',
          note: 'Pick it as the operator view: a ring for how far the recipe is and the next steps as a list.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/RingGauge.tsx', 'kit/ListRow.tsx', 'kit/IconChip.tsx'],
          Component: BatchRecipeStepProgress,
        },
        {
          id: 'BatchRecipeAdditions',
          title: 'Additions and parameter changes',
          note: 'Pick it for traceability: every lot added with its quantity, every changed setting with who and why.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/ListRow.tsx', 'kit/TagId.tsx', 'kit/Panel.tsx'],
          Component: BatchRecipeAdditions,
        },
        {
          id: 'BatchRecipeControls',
          title: 'Hold and abort controls',
          note: 'Pick it for controls that change a running batch: hold first, then abort with the batch number typed.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/dashboard-blocks/BlockNotice.tsx', 'kit/Stat.tsx', 'kit/Panel.tsx'],
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
          note: 'Pick it to judge a running batch: its trend over the golden profile and band, excursions marked, score beside.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/batch-and-recipe/GoldenProfile.tsx', 'kit/batch-and-recipe/goldenBatch.ts', 'kit/Stat.tsx'],
          Component: BatchRecipeGolden,
        },
        {
          id: 'BatchRecipeGoldenTolerance',
          title: 'Adjustable tolerance',
          note: 'Pick it while the band is still being agreed: change it and watch the excursions and the conformance ring.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/batch-and-recipe/GoldenProfile.tsx', 'kit/dashboard-blocks/RangeSwitch.tsx', 'kit/RingGauge.tsx'],
          Component: BatchRecipeGoldenTolerance,
        },
        {
          id: 'BatchRecipeAlignment',
          title: 'Alignment by phase',
          note: 'Pick it to explain the comparison: minutes per phase against the golden batch, with the golden mark on each meter.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/Bars.tsx', 'kit/Meter.tsx', 'kit/batch-and-recipe/goldenBatch.ts'],
          Component: BatchRecipeAlignment,
        },
        {
          id: 'BatchRecipePareto',
          title: 'Phase overrun ranking',
          note: 'Pick it to decide where to improve: the phases that cause most of the lost minutes, largest first.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/Bars.tsx', 'kit/Stat.tsx'],
          Component: BatchRecipePareto,
        },
      ],
    },
    {
      id: 'comparison',
      title: 'Batch to batch',
      description: 'Figures over several batches and where the material went.',
      specimens: [
        {
          id: 'BatchRecipeKpis',
          title: 'Last batch as state tiles',
          note: 'Pick it for a plant-floor screen: each figure of the last batch is judged in a word.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/Stat.tsx', 'kit/StatGroup.tsx'],
          Component: BatchRecipeKpis,
        },
        {
          id: 'BatchRecipeComparison',
          title: 'Batch comparison',
          note: 'Pick it to compare batches of a recipe: the table for exact figures, the bars for spread against the golden batch.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/DataTable.tsx', 'kit/Bars.tsx', 'kit/Panel.tsx'],
          Component: BatchRecipeComparison,
        },
        {
          id: 'BatchRecipeGenealogy',
          title: 'Genealogy',
          note: 'Pick it for traceability: raw material lots into the batch, the batch into product lots.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/batch-and-recipe/Genealogy.tsx', 'kit/Panel.tsx'],
          Component: BatchRecipeGenealogy,
        },
      ],
    },
    {
      id: 'release',
      title: 'Quality release and deviations',
      description: 'What has to be true before a batch leaves.',
      specimens: [
        {
          id: 'BatchRecipeRelease',
          title: 'Release steps and signatures',
          note: 'Pick it for release: the steps with what holds them, and the deviation signed role by role.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/ListRow.tsx', 'kit/StatusPill.tsx', 'kit/IconChip.tsx'],
          Component: BatchRecipeRelease,
        },
        {
          id: 'BatchRecipeDeviations',
          title: 'Deviation log',
          note: 'Pick it for the exceptions across batches: what happened, its class, its state and its owner.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/DataTable.tsx', 'kit/SectionHeader.tsx', 'kit/StatusPill.tsx'],
          Component: BatchRecipeDeviations,
        },
      ],
    },
    {
      id: 'in-use',
      title: 'In use',
      description: 'Three finished screens built from the parts above.',
      specimens: [
        {
          id: 'BatchRecipeMonitor',
          title: 'Batch monitor',
          note: 'Pick it as the page for a running batch: phases, golden comparison, score, facts and recipe steps.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/AppFrame.tsx', 'kit/batch-and-recipe/PhaseTrack.tsx', 'kit/batch-and-recipe/GoldenProfile.tsx', 'kit/DataTable.tsx'],
          Component: BatchRecipeMonitor,
        },
        {
          id: 'BatchRecipeControlRoom',
          title: 'Batch plant overview',
          note: 'Pick it for the control room: plant figures, one phase track per reactor, allocation and the batch list.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/batch-and-recipe/PhaseTrack.tsx', 'kit/batch-and-recipe/BatchLane.tsx', 'kit/StatGroup.tsx', 'kit/DataTable.tsx'],
          Component: BatchRecipeControlRoom,
        },
        {
          id: 'BatchRecipeRecord',
          title: 'Batch record',
          note: 'Pick it as the document that leaves with the batch: figures, the temperature profile, release and genealogy.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/AppFrame.tsx', 'kit/batch-and-recipe/GoldenProfile.tsx', 'kit/batch-and-recipe/Genealogy.tsx', 'kit/StatGroup.tsx'],
          Component: BatchRecipeRecord,
        },
      ],
    },
  ],
});
