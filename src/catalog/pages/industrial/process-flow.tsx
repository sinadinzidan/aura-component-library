import { Button } from '@cognite/aura/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardHeaderCenter, CardHeaderEnd, CardTitle } from '@cognite/aura/components/card';
import { IconArrowNarrowRight, IconChevronRight, IconMinus } from '@cognite/aura/icons';
import { Fragment } from 'react';

import { formatValue, healthStatus, runStateStatus } from '../../../library/industrial/status';
import type { StatusDescriptor } from '../../../library/industrial/status';
import { StatusDot } from '../../../library/industrial/StatusDot';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { ValueReadout } from '../../../library/industrial/ValueReadout';
import { ConditionList } from '../../../library/industrial/workflows/ConditionList';
import type { Condition } from '../../../library/industrial/workflows/ConditionList';
import { StageFlow } from '../../../library/industrial/workflows/StageFlow';
import type { FlowStage } from '../../../library/industrial/workflows/StageFlow';
import { StepList } from '../../../library/industrial/workflows/StepList';
import type { StepListItem } from '../../../library/industrial/workflows/StepList';
import { allConditionsMet, massBalance, stepProgress } from '../../../library/industrial/workflows/workflow';
import { ASSETS, SENSORS } from '../../data/plant';
import type { Asset, RunState, Sensor } from '../../data/plant';
import { definePage } from '../../types';

import source from './process-flow.tsx?raw';

function findSensor(id: string): Sensor {
  const sensor = SENSORS.find((candidate) => candidate.id === id);
  if (!sensor) throw new Error(`Unknown sensor ${id}`);
  return sensor;
}

function findAssetById(id: string): Asset {
  const asset = ASSETS.find((candidate) => candidate.id === id);
  if (!asset) throw new Error(`Unknown asset ${id}`);
  return asset;
}

const GAS_FLOW = findSensor('ft-92510');
const LEVEL = findSensor('lt-10012');
const DISCHARGE = findSensor('pt-92531');
const EXPORT_FLOW = findSensor('ft-20011');

/** The gas train in flow direction, one unit standing for each stage. */
const STAGES: readonly FlowStage[] = [
  {
    id: 'inlet',
    name: 'Inlet',
    tag: '20-XV-1105',
    status: runStateStatus('running'),
    reading: { label: GAS_FLOW.name, value: GAS_FLOW.value, unit: GAS_FLOW.unit },
  },
  {
    id: 'separation',
    name: 'Separation',
    tag: '20-VA-1001',
    status: runStateStatus('running'),
    reading: { label: LEVEL.name, value: LEVEL.value, unit: LEVEL.unit, decimals: 1 },
  },
  {
    id: 'compression',
    name: 'Compression',
    tag: '23-KA-9101',
    status: runStateStatus('running'),
    reading: { label: DISCHARGE.name, value: DISCHARGE.value, unit: DISCHARGE.unit, decimals: 1 },
    alarms: { count: 2, severity: 'high' },
  },
  {
    id: 'export',
    name: 'Export',
    tag: '27-PA-2001A',
    status: runStateStatus('running'),
    reading: { label: EXPORT_FLOW.name, value: EXPORT_FLOW.value, unit: EXPORT_FLOW.unit },
  },
];

const STAGES_WITH_BOTTLENECK: readonly FlowStage[] = STAGES.map((stage) => (stage.id === 'compression' ? { ...stage, bottleneck: true } : stage));

const RECOMPRESSION_STAGE: FlowStage = {
  id: 'recompression',
  name: 'Recompression',
  tag: '23-KA-9103',
  status: runStateStatus('tripped'),
  reading: { label: 'Discharge pressure', value: null, unit: 'barg' },
  alarms: { count: 1, severity: 'critical' },
};

type Stream = {
  id: string;
  name: string;
  from: string;
  to: string;
  /** Mass flow, t/h. */
  flow: number;
  /** barg. */
  pressure: number;
  /** °C. */
  temperature: number;
  phase: 'Mixed' | 'Gas' | 'Liquid';
};

const STREAMS: readonly Stream[] = [
  { id: 'S-101', name: 'Well stream', from: 'Inlet', to: '20-VA-1001', flow: 168.0, pressure: 13.4, temperature: 62.0, phase: 'Mixed' },
  { id: 'S-201', name: 'Separator gas', from: '20-VA-1001', to: '23-KA-9101', flow: 131.2, pressure: 12.4, temperature: 31.5, phase: 'Gas' },
  { id: 'S-202', name: 'Condensate', from: '20-VA-1001', to: '27-PA-2001A', flow: 29.6, pressure: 13.1, temperature: 58.2, phase: 'Liquid' },
  { id: 'S-203', name: 'Produced water', from: '20-VA-1001', to: 'Water treatment', flow: 6.9, pressure: 13.1, temperature: 58.2, phase: 'Liquid' },
  { id: 'S-301', name: 'Export gas', from: '23-KA-9102', to: 'Gas export', flow: 128.4, pressure: 48.6, temperature: 38.9, phase: 'Gas' },
  { id: 'S-302', name: 'Fuel gas', from: '23-KA-9102', to: '23-GT-9001', flow: 2.6, pressure: 28.0, temperature: 36.4, phase: 'Gas' },
];

const FLARE_FLOW = 0.3;
const BALANCE_IN = STREAMS.filter((stream) => stream.id === 'S-101');
const BALANCE_OUT = STREAMS.filter((stream) => ['S-202', 'S-203', 'S-301', 'S-302'].includes(stream.id));
const BALANCE = massBalance(
  BALANCE_IN.map((stream) => stream.flow),
  [...BALANCE_OUT.map((stream) => stream.flow), FLARE_FLOW]
);

type FlowLine = { id: string; from: string; to: string; flow: number; note?: string };

const FLOW_LINES: readonly FlowLine[] = [
  { id: 'l1', from: 'Inlet separator', to: '1st stage compressor', flow: 131.2 },
  { id: 'l2', from: '1st stage compressor', to: 'Interstage cooler', flow: 131.2 },
  { id: 'l3', from: 'Interstage cooler', to: '2nd stage compressor', flow: 131.0 },
  { id: 'l4', from: '2nd stage compressor', to: '1st stage compressor', flow: 0, note: 'Anti-surge recycle, valve closed' },
  { id: 'l5', from: 'Test separator', to: 'Recompressor', flow: 0, note: 'Recompressor tripped' },
];

type LineUpValve = { tag: string; name: string; position: 'open' | 'closed'; required: 'open' | 'closed' };

const LINE_UP: readonly LineUpValve[] = [
  { tag: '20-XV-1105', name: 'Inlet shutdown valve', position: 'open', required: 'open' },
  { tag: '23-XV-9120', name: '1st stage suction isolation', position: 'open', required: 'open' },
  { tag: '23-FV-9131', name: 'Anti-surge valve', position: 'closed', required: 'closed' },
  { tag: '23-XV-9140', name: 'Recompressor suction isolation', position: 'closed', required: 'closed' },
  { tag: '27-XV-2015', name: 'Export pump B discharge', position: 'closed', required: 'open' },
  { tag: '27-XV-2030', name: 'Export header isolation', position: 'open', required: 'open' },
];

const POSITION_STATUS: Record<LineUpValve['position'], StatusDescriptor> = {
  open: { tone: 'neutral', label: 'Open', shape: 'ring' },
  closed: { tone: 'neutral', label: 'Closed', shape: 'square' },
};

const PARCEL_STAGES = ['Receive', 'Stabilise', 'Meter', 'Load', 'Release'] as const;

const PARCEL_STEPS: readonly StepListItem[] = [
  { id: 'receive', label: 'Receive', detail: '06:10', state: 'done' },
  { id: 'stabilise', label: 'Stabilise', detail: '08:45', state: 'done' },
  { id: 'meter', label: 'Meter', detail: 'Since 11:20', state: 'active' },
  { id: 'load', label: 'Load', state: 'pending' },
  { id: 'release', label: 'Release', state: 'pending' },
];

type Parcel = { id: string; destination: string; volume: number; stage: number; held?: string };

const PARCELS: readonly Parcel[] = [
  { id: 'P-0312', destination: 'Stord terminal', volume: 4200, stage: 3 },
  { id: 'P-0313', destination: 'Stord terminal', volume: 3900, stage: 2 },
  { id: 'P-0314', destination: 'Hammerfest LNG', volume: 5100, stage: 2, held: 'Waiting for lab result' },
  { id: 'P-0311', destination: 'Stord terminal', volume: 4050, stage: 5 },
];

const RESTART_STEPS: readonly StepListItem[] = [
  { id: 'reset', label: 'Reset vibration trip', detail: 'Ingrid Haugen', state: 'done', meta: <StepTime>13:54</StepTime> },
  { id: 'lube', label: 'Confirm lube oil pressure above 1.8 barg', detail: '23-PT-92770 · 2.4 barg', state: 'done', meta: <StepTime>13:57</StepTime> },
  { id: 'seal', label: 'Pressurise seal gas', detail: 'Waiting for 23-PDT-92761 above 0.5 bar', state: 'active', meta: <StepTime>13:58</StepTime> },
  { id: 'suction', label: 'Open suction isolation 23-XV-9140', state: 'pending' },
  { id: 'crank', label: 'Crank to idle, 3,000 rpm', state: 'pending' },
  { id: 'load', label: 'Load to minimum flow', state: 'pending' },
];

const HELD_STEPS: readonly StepListItem[] = RESTART_STEPS.map((step) =>
  step.id === 'seal' ? { ...step, state: 'held', detail: 'Seal gas differential 0.3 bar, needs 0.5 bar', meta: undefined } : { ...step, meta: undefined }
);

const PERMISSIVES: readonly Condition[] = [
  { id: 'trip', label: 'Vibration trip reset', detail: '23-VT-92740 · 0.4 mm/s', state: 'met' },
  { id: 'lube', label: 'Lube oil pressure above 1.8 barg', detail: '23-PT-92770 · 2.4 barg', state: 'met' },
  { id: 'seal', label: 'Seal gas differential above 0.5 bar', detail: '23-PDT-92761 · 0.3 bar', state: 'unmet' },
  { id: 'suction', label: 'Suction pressure above 3 barg', detail: '23-PT-92730 · 4.1 barg', state: 'met' },
  { id: 'surge', label: 'Anti-surge valve fully open', detail: '23-FV-9331 · 100 %', state: 'met' },
  { id: 'wo', label: 'No open isolation on the unit', detail: 'WO-104482 isolation removed 13:50', state: 'met' },
];

const INTERLOCKS: readonly Condition[] = [
  { id: 'i-2301', label: 'I-2301 High-high vibration', detail: '23-VT-92740 · tripped 13:46 at 11.6 mm/s', state: 'unmet' },
  { id: 'i-2302', label: 'I-2302 Low lube oil pressure', detail: '23-PT-92770 · 2.4 barg', state: 'met' },
  { id: 'i-2303', label: 'I-2303 High discharge temperature', detail: '23-TT-92732 · 34.0 °C', state: 'met' },
  { id: 'i-2304', label: 'I-2304 Low seal gas differential', detail: 'Bypassed by Liv Wold until 18:00', state: 'bypassed' },
  { id: 'i-2305', label: 'I-2305 Surge detection', detail: '23-FT-92710 · no surge counted', state: 'met' },
];

type Lane = { id: string; name: string; share: number; state: RunState; stages: readonly FlowStage[] };

const pumpLane = (pump: Asset, flow: number | null, pressure: number | null): readonly FlowStage[] => [
  { id: `${pump.id}-suction`, name: 'Suction', tag: pump.tag.replace('PA', 'XV').replace(/[AB]$/, (train) => `1${train}`), status: pump.state === 'running' ? { tone: 'neutral', label: 'Open', shape: 'ring' } : { tone: 'neutral', label: 'Closed', shape: 'square' } },
  { id: pump.id, name: pump.name, tag: pump.tag, status: runStateStatus(pump.state), reading: { label: 'Discharge pressure', value: pressure, unit: 'barg', decimals: 1 } },
  { id: `${pump.id}-meter`, name: 'Metering', tag: pump.tag.replace('PA', 'FT'), status: flow === null ? { tone: 'neutral', label: 'No flow', shape: 'ring' } : { tone: 'success', label: 'Measuring', shape: 'dot' }, reading: { label: 'Flow', value: flow, unit: 'm³/h' } },
];

const LANES: readonly Lane[] = [
  { id: 'a', name: 'Train A', share: 100, state: 'running', stages: pumpLane(findAssetById('27-pa-2001a'), EXPORT_FLOW.value, 21.4) },
  { id: 'b', name: 'Train B', share: 0, state: 'standby', stages: pumpLane(findAssetById('27-pa-2001b'), null, null) },
];

const STRIP_UNITS: readonly { asset: Asset; reading: Sensor | null }[] = [
  { asset: findAssetById('20-xv-1105'), reading: null },
  { asset: findAssetById('20-va-1001'), reading: findSensor('pt-10010') },
  { asset: findAssetById('23-ka-9101'), reading: DISCHARGE },
  { asset: findAssetById('23-ha-9114'), reading: findSensor('tt-91141') },
  { asset: findAssetById('23-ka-9103'), reading: null },
  { asset: findAssetById('27-pa-2001a'), reading: EXPORT_FLOW },
];

type DiagramBlock = { id: string; x: number; y: number; name: string; tag: string; state: RunState };

const BLOCK_WIDTH = 108;
const BLOCK_HEIGHT = 52;

const DIAGRAM_BLOCKS: readonly DiagramBlock[] = [
  { id: 'inlet', x: 8, y: 92, name: 'Inlet', tag: '20-XV-1105', state: 'running' },
  { id: 'separator', x: 128, y: 92, name: 'Separator', tag: '20-VA-1001', state: 'running' },
  { id: 'stage-1', x: 248, y: 92, name: '1st stage', tag: '23-KA-9101', state: 'running' },
  { id: 'cooler', x: 368, y: 92, name: 'Cooler', tag: '23-HA-9114', state: 'running' },
  { id: 'stage-2', x: 488, y: 92, name: '2nd stage', tag: '23-KA-9102', state: 'running' },
  { id: 'gas-export', x: 608, y: 92, name: 'Gas export', tag: 'NK-27', state: 'running' },
  { id: 'pump-a', x: 128, y: 192, name: 'Pump A', tag: '27-PA-2001A', state: 'running' },
  { id: 'pump-b', x: 248, y: 192, name: 'Pump B', tag: '27-PA-2001B', state: 'standby' },
];

const TH = 'px-3 py-2 text-left text-xs font-medium text-muted-foreground';
const TD = 'px-3 py-2.5 align-middle';

function StepTime({ children }: { children: string }) {
  return <span className="text-xs text-muted-foreground tabular-nums">{children}</span>;
}

/** A state marker for the block diagram: the same four shapes as `StatusDot`, drawn in SVG. */
function DiagramStateMark({ x, y, state }: { x: number; y: number; state: RunState }) {
  if (state === 'running') return <circle cx={x} cy={y} r={4} className="fill-success-foreground-strong" />;
  if (state === 'standby') return <circle cx={x} cy={y} r={3} strokeWidth={2} className="fill-none stroke-info-foreground-strong" />;
  if (state === 'tripped') return <rect x={x - 3.5} y={y - 3.5} width={7} height={7} transform={`rotate(45 ${x} ${y})`} className="fill-critical-foreground-strong" />;
  return <rect x={x - 3.5} y={y - 3.5} width={7} height={7} rx={1} className={state === 'maintenance' ? 'fill-warning-foreground-strong' : 'fill-neutral-foreground-strong'} />;
}

/** Five segments, filled up to the stage a parcel has reached. */
function ParcelStageBar({ parcel }: { parcel: Parcel }) {
  return (
    <div role="img" aria-label={`Stage ${parcel.stage} of ${PARCEL_STAGES.length}: ${PARCEL_STAGES[parcel.stage - 1]}`} className="flex w-full gap-1">
      {PARCEL_STAGES.map((stage, index) => (
        <span
          key={stage}
          className={`h-1.5 flex-1 rounded-full ${index < parcel.stage - 1 || parcel.stage === PARCEL_STAGES.length ? 'bg-chart-1-450' : index === parcel.stage - 1 ? 'bg-chart-1-300' : 'bg-muted-background'}`}
        />
      ))}
    </div>
  );
}

function ProcessFlowStageSingle() {
  return (
    <div className="w-full max-w-56">
      <StageFlow label="Separation stage" stages={[STAGES[1]]} />
    </div>
  );
}

function ProcessFlowStageAlarms() {
  return (
    <div className="w-full max-w-56">
      <StageFlow label="Compression stage" stages={[STAGES[2]]} />
    </div>
  );
}

function ProcessFlowStageOffline() {
  return (
    <div className="w-full max-w-56">
      <StageFlow label="Recompression stage" stages={[RECOMPRESSION_STAGE]} />
    </div>
  );
}

function ProcessFlowCompactChain() {
  const chain = [...STAGES.slice(0, 3), RECOMPRESSION_STAGE, STAGES[3]];
  return (
    <ol aria-label="Gas train, stage states" className="flex flex-wrap items-center justify-center gap-x-2 gap-y-2">
      {chain.map((stage, index) => (
        <Fragment key={stage.id}>
          <li className="inline-flex items-center gap-1.5 text-sm text-base-foreground">
            <StatusDot size="sm" tone={stage.status.tone} shape={stage.status.shape} label={stage.status.label} />
            {stage.name}
          </li>
          {index < chain.length - 1 ? (
            <li aria-hidden role="presentation" className="text-muted-foreground">
              <IconChevronRight className="size-4" />
            </li>
          ) : null}
        </Fragment>
      ))}
    </ol>
  );
}

function ProcessFlowPipelineProgress() {
  const progress = stepProgress(PARCEL_STEPS);
  return (
    <div className="flex w-full max-w-lg flex-col gap-4">
      <div className="flex items-baseline justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-base-foreground">
            Condensate parcel <span className="font-mono">P-0312</span>
          </p>
          <p className="text-xs text-muted-foreground">4,200 m³ to Stord terminal</p>
        </div>
        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
          Stage {progress.currentIndex + 1} of {progress.total}
        </span>
      </div>
      <StepList orientation="horizontal" label="Parcel P-0312, stages" steps={PARCEL_STEPS} />
    </div>
  );
}

function ProcessFlowStages() {
  return <StageFlow label="Gas train, inlet to export" stages={STAGES} />;
}

function ProcessFlowBottleneck() {
  return (
    <div className="flex w-full flex-col gap-3">
      <StageFlow label="Gas train with bottleneck" stages={STAGES_WITH_BOTTLENECK} bottleneckLabel="Bottleneck · 87 % of capacity" />
      <p className="text-xs text-muted-foreground">
        Throughput is held at {formatValue(GAS_FLOW.value)} {GAS_FLOW.unit} by 1st stage discharge temperature, 141.2 °C against a 145 °C limit.
      </p>
    </div>
  );
}

function ProcessFlowStreamCard() {
  const stream = STREAMS[4];
  return (
    <Card className="w-full max-w-64">
      <div className="flex items-baseline justify-between gap-3">
        <span className="truncate text-sm font-medium text-base-foreground">{stream.name}</span>
        <span className="font-mono text-xs text-muted-foreground">{stream.id}</span>
      </div>
      <dl className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-xs text-muted-foreground">Flow</dt>
          <dd>
            <ValueReadout size="sm" value={stream.flow} unit="t/h" decimals={1} />
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-xs text-muted-foreground">Pressure</dt>
          <dd>
            <ValueReadout size="sm" value={stream.pressure} unit="barg" decimals={1} />
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-xs text-muted-foreground">Temperature</dt>
          <dd>
            <ValueReadout size="sm" value={stream.temperature} unit="°C" decimals={1} />
          </dd>
        </div>
      </dl>
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="font-mono">{stream.from}</span>
        <IconArrowNarrowRight aria-label="to" role="img" className="size-4" />
        {stream.to}
      </p>
    </Card>
  );
}

function ProcessFlowStreamTable() {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-xl border-collapse text-sm">
        <thead>
          <tr>
            <th scope="col" className={TH}>
              Stream
            </th>
            <th scope="col" className={TH}>
              From
            </th>
            <th scope="col" className={TH}>
              To
            </th>
            <th scope="col" className={`${TH} text-right`}>
              Flow, t/h
            </th>
            <th scope="col" className={`${TH} text-right`}>
              Pressure, barg
            </th>
            <th scope="col" className={`${TH} text-right`}>
              Temp., °C
            </th>
            <th scope="col" className={TH}>
              Phase
            </th>
          </tr>
        </thead>
        <tbody>
          {STREAMS.map((stream) => (
            <tr key={stream.id} className="border-t border-default">
              <td className={`${TD} whitespace-nowrap`}>
                <span className="font-mono text-xs text-muted-foreground">{stream.id}</span> <span className="text-base-foreground">{stream.name}</span>
              </td>
              <td className={`${TD} font-mono text-xs whitespace-nowrap text-muted-foreground`}>{stream.from}</td>
              <td className={`${TD} font-mono text-xs whitespace-nowrap text-muted-foreground`}>{stream.to}</td>
              <td className={`${TD} text-right text-base-foreground tabular-nums`}>{formatValue(stream.flow, 1)}</td>
              <td className={`${TD} text-right text-base-foreground tabular-nums`}>{formatValue(stream.pressure, 1)}</td>
              <td className={`${TD} text-right text-base-foreground tabular-nums`}>{formatValue(stream.temperature, 1)}</td>
              <td className={`${TD} text-muted-foreground`}>{stream.phase}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProcessFlowDirectionRows() {
  return (
    <ul aria-label="Flow between units" className="flex w-full max-w-lg flex-col gap-3">
      {FLOW_LINES.map((line) => {
        const flowing = line.flow > 0;
        return (
          <li key={line.id} className="flex items-center gap-3">
            <div className="flex min-w-0 flex-1 flex-col">
              <span className={`flex items-center gap-1.5 text-sm ${flowing ? 'text-base-foreground' : 'text-muted-foreground'}`}>
                <span className="truncate">{line.from}</span>
                {flowing ? (
                  <IconArrowNarrowRight aria-label="flows to" role="img" className="size-4 shrink-0 text-muted-foreground" />
                ) : (
                  <IconMinus aria-label="no flow to" role="img" className="size-4 shrink-0" />
                )}
                <span className="truncate">{line.to}</span>
              </span>
              {line.note ? <span className="text-xs text-muted-foreground">{line.note}</span> : null}
            </div>
            {flowing ? <ValueReadout size="xs" value={line.flow} unit="t/h" decimals={1} /> : <span className="text-xs text-muted-foreground">No flow</span>}
          </li>
        );
      })}
    </ul>
  );
}

function ProcessFlowLineUp() {
  const inPosition = LINE_UP.filter((valve) => valve.position === valve.required).length;
  return (
    <div className="flex w-full max-w-lg flex-col gap-3">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-sm font-medium text-base-foreground">Line-up for export on train B</span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {inPosition} of {LINE_UP.length} in position
        </span>
      </div>
      <ul aria-label="Valve line-up" className="flex flex-col gap-3">
        {LINE_UP.map((valve) => {
          const mismatch = valve.position !== valve.required;
          return (
            <li key={valve.tag} className="flex items-center gap-3">
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm text-base-foreground">{valve.name}</span>
                <span className="font-mono text-xs text-muted-foreground">{valve.tag}</span>
              </div>
              {mismatch ? <span className="text-xs font-medium text-warning-foreground-strong">Required {valve.required}</span> : null}
              <span className="w-16 shrink-0">
                <StatusIndicator size="sm" {...POSITION_STATUS[valve.position]} />
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ProcessFlowMassBalance() {
  return (
    <Card className="w-full max-w-64">
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">Mass balance, last hour</span>
        <div className="flex items-baseline gap-2">
          <ValueReadout value={BALANCE.percent} unit="%" decimals={2} />
          <span className="text-xs text-muted-foreground">imbalance</span>
        </div>
      </div>
      <dl className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-xs text-muted-foreground">In</dt>
          <dd>
            <ValueReadout size="xs" value={BALANCE.totalIn} unit="t/h" decimals={1} />
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-xs text-muted-foreground">Out</dt>
          <dd>
            <ValueReadout size="xs" value={BALANCE.totalOut} unit="t/h" decimals={1} />
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-3 border-t border-default pt-2">
          <dt className="text-xs text-muted-foreground">Unaccounted</dt>
          <dd>
            <ValueReadout size="xs" value={BALANCE.difference} unit="t/h" decimals={1} />
          </dd>
        </div>
      </dl>
      <StatusIndicator size="sm" tone="success" label="Within ±0.5 % tolerance" />
    </Card>
  );
}

function ProcessFlowBatchList() {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-lg border-collapse text-sm">
        <thead>
          <tr>
            <th scope="col" className={TH}>
              Parcel
            </th>
            <th scope="col" className={TH}>
              Destination
            </th>
            <th scope="col" className={`${TH} text-right`}>
              Volume, m³
            </th>
            <th scope="col" className={`${TH} w-2/5`}>
              Stage
            </th>
          </tr>
        </thead>
        <tbody>
          {PARCELS.map((parcel) => (
            <tr key={parcel.id} className="border-t border-default">
              <td className={`${TD} font-mono text-base-foreground`}>{parcel.id}</td>
              <td className={`${TD} text-muted-foreground`}>{parcel.destination}</td>
              <td className={`${TD} text-right text-base-foreground tabular-nums`}>{formatValue(parcel.volume)}</td>
              <td className={TD}>
                <div className="flex flex-col gap-1.5">
                  <ParcelStageBar parcel={parcel} />
                  <span className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span>{parcel.stage === PARCEL_STAGES.length ? 'Released' : PARCEL_STAGES[parcel.stage - 1]}</span>
                    {parcel.held ? <StatusIndicator size="sm" tone="warning" shape="square" label="On hold" detail={parcel.held} /> : null}
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProcessFlowUnitStrip() {
  return (
    <div className="w-full overflow-x-auto">
      <ul aria-label="Unit status, gas train" className="grid min-w-3xl grid-cols-6 divide-x divide-default rounded-xl bg-card-background">
        {STRIP_UNITS.map(({ asset, reading }) => (
          <li key={asset.id} className="flex min-w-0 flex-col gap-2 p-3">
            <div className="min-w-0">
              <p className="font-mono text-xs text-muted-foreground">{asset.tag}</p>
              <p className="truncate text-sm font-medium text-base-foreground">{asset.name}</p>
            </div>
            <StatusIndicator size="sm" {...runStateStatus(asset.state)} />
            <ValueReadout size="xs" value={reading ? reading.value : null} unit={reading?.unit} decimals={reading?.decimals} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProcessFlowStartSequence() {
  const progress = stepProgress(RESTART_STEPS);
  return (
    <div className="flex w-full max-w-lg flex-col gap-4">
      <div className="flex items-baseline justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-base-foreground">Restart sequence</p>
          <p className="text-xs text-muted-foreground">
            <span className="font-mono">23-KA-9103</span> Recompressor
          </p>
        </div>
        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
          Step {progress.currentIndex + 1} of {progress.total}
        </span>
      </div>
      <StepList label="Restart sequence, 23-KA-9103" steps={RESTART_STEPS} />
    </div>
  );
}

function ProcessFlowSequenceHeld() {
  return (
    <div className="flex w-full max-w-lg flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-base-foreground">Restart sequence</p>
          <p className="text-xs text-muted-foreground">
            <span className="font-mono">23-KA-9103</span> Recompressor
          </p>
        </div>
        <StatusIndicator variant="badge" tone="warning" label="On hold" detail="step 3" />
      </div>
      <StepList label="Restart sequence on hold, 23-KA-9103" steps={HELD_STEPS} showState />
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm">
          Abort sequence
        </Button>
        <Button variant="secondary" size="sm">
          Resume sequence
        </Button>
      </div>
    </div>
  );
}

function ProcessFlowPermissives() {
  const unmet = PERMISSIVES.filter((condition) => condition.state !== 'met').length;
  const ready = allConditionsMet(PERMISSIVES);
  return (
    <div className="flex w-full max-w-lg flex-col gap-4">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-sm font-medium text-base-foreground">Start permissives</span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {PERMISSIVES.length - unmet} of {PERMISSIVES.length} met
        </span>
      </div>
      <ConditionList label="Start permissives, 23-KA-9103" conditions={PERMISSIVES} />
      <div className="flex items-center justify-between gap-4 border-t border-default pt-4">
        <p className="text-xs text-muted-foreground">{ready ? 'All permissives are met.' : 'Seal gas differential must rise above 0.5 bar before start.'}</p>
        <Button size="sm" disabled={!ready}>
          Start compressor
        </Button>
      </div>
    </div>
  );
}

function ProcessFlowInterlocks() {
  return (
    <div className="flex w-full max-w-lg flex-col gap-4">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-sm font-medium text-base-foreground">Interlocks</span>
        <span className="text-xs text-muted-foreground">1 tripped · 1 bypassed</span>
      </div>
      <ConditionList label="Interlocks, 23-KA-9103" conditions={INTERLOCKS} stateLabels={{ met: 'Healthy', unmet: 'Tripped' }} />
    </div>
  );
}

function ProcessFlowTrainLanes() {
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-sm font-medium text-base-foreground">Condensate export</span>
        <span className="text-xs text-muted-foreground">Duty and standby, one train carries the load</span>
      </div>
      {LANES.map((lane) => (
        <div key={lane.id} className="grid grid-cols-[7rem_minmax(0,1fr)] items-center gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-base-foreground">{lane.name}</span>
            <StatusIndicator size="sm" {...runStateStatus(lane.state)} />
            <ValueReadout size="xs" value={lane.share} unit="% of load" />
          </div>
          <StageFlow label={`${lane.name}, suction to metering`} stages={lane.stages} />
        </div>
      ))}
    </div>
  );
}

function ProcessFlowBlockDiagram() {
  const centre = (block: DiagramBlock) => ({ x: block.x + BLOCK_WIDTH / 2, y: block.y + BLOCK_HEIGHT / 2 });
  const mainRow = DIAGRAM_BLOCKS.slice(0, 6);
  const stageOne = centre(DIAGRAM_BLOCKS[2]);
  const stageTwo = centre(DIAGRAM_BLOCKS[4]);
  const separator = centre(DIAGRAM_BLOCKS[1]);
  return (
    <div className="w-full overflow-x-auto">
      <svg
        role="img"
        aria-label="Block diagram of the gas train: inlet, inlet separator, 1st stage, cooler, 2nd stage and gas export in series, an anti-surge recycle from 2nd stage back to 1st stage, and condensate from the separator to export pumps A and B"
        viewBox="0 0 724 256"
        className="h-auto w-full min-w-2xl text-muted-foreground"
        fill="none"
      >
        {mainRow.slice(0, -1).map((block, index) => {
          const next = mainRow[index + 1];
          const y = block.y + BLOCK_HEIGHT / 2;
          return (
            <g key={block.id}>
              <line x1={block.x + BLOCK_WIDTH} y1={y} x2={next.x - 5} y2={y} stroke="currentColor" strokeWidth={1.5} />
              <path d={`M ${next.x - 6} ${y - 4} L ${next.x} ${y} L ${next.x - 6} ${y + 4} Z`} fill="currentColor" />
            </g>
          );
        })}
        <path
          d={`M ${stageTwo.x} ${stageTwo.y - BLOCK_HEIGHT / 2} V 48 H ${stageOne.x} V ${stageOne.y - BLOCK_HEIGHT / 2 - 5}`}
          stroke="currentColor"
          strokeWidth={1.5}
          strokeDasharray="5 4"
        />
        <path d={`M ${stageOne.x - 4} ${stageOne.y - BLOCK_HEIGHT / 2 - 6} L ${stageOne.x} ${stageOne.y - BLOCK_HEIGHT / 2} L ${stageOne.x + 4} ${stageOne.y - BLOCK_HEIGHT / 2 - 6} Z`} fill="currentColor" />
        <text x={(stageOne.x + stageTwo.x) / 2} y={38} textAnchor="middle" className="fill-muted-foreground text-xs">
          Anti-surge recycle
        </text>
        <path d={`M ${separator.x} ${separator.y + BLOCK_HEIGHT / 2} V ${192 - 5}`} stroke="currentColor" strokeWidth={1.5} />
        <path d={`M ${separator.x - 4} ${192 - 6} L ${separator.x} 192 L ${separator.x + 4} ${192 - 6} Z`} fill="currentColor" />
        <path d={`M ${separator.x} 168 H ${stageOne.x} V ${192 - 5}`} stroke="currentColor" strokeWidth={1.5} />
        <path d={`M ${stageOne.x - 4} ${192 - 6} L ${stageOne.x} 192 L ${stageOne.x + 4} ${192 - 6} Z`} fill="currentColor" />
        <text x={separator.x + 8} y={162} className="fill-muted-foreground text-xs">
          Condensate
        </text>
        <path d="M 356 218 H 430" stroke="currentColor" strokeWidth={1.5} />
        <path d="M 430 214 L 436 218 L 430 222 Z" fill="currentColor" />
        <text x={444} y={222} className="fill-muted-foreground text-xs">
          To Stord terminal
        </text>
        {DIAGRAM_BLOCKS.map((block) => (
          <g key={block.id}>
            <rect x={block.x} y={block.y} width={BLOCK_WIDTH} height={BLOCK_HEIGHT} rx={8} className="fill-card-background stroke-emphasized" strokeWidth={1} />
            <DiagramStateMark x={block.x + 14} y={block.y + 18} state={block.state} />
            <text x={block.x + 24} y={block.y + 22} className="fill-base-foreground text-xs font-medium">
              {block.name}
            </text>
            <text x={block.x + 10} y={block.y + 40} className="fill-muted-foreground font-mono text-xs">
              {block.tag}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function ProcessFlowDiagramLegend() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <span className="text-xs text-muted-foreground">Lines</span>
        <div className="flex items-center gap-3 text-xs text-base-foreground">
          <span aria-hidden className="w-8 border-t-2 border-muted-foreground" />
          Process line
        </div>
        <div className="flex items-center gap-3 text-xs text-base-foreground">
          <span aria-hidden className="w-8 border-t-2 border-dashed border-muted-foreground" />
          Recycle, normally no flow
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-xs text-muted-foreground">Unit state</span>
        <StatusIndicator size="sm" {...runStateStatus('running')} />
        <StatusIndicator size="sm" {...runStateStatus('standby')} />
        <StatusIndicator size="sm" {...runStateStatus('tripped')} />
        <StatusIndicator size="sm" {...runStateStatus('maintenance')} />
      </div>
    </div>
  );
}

function ProcessFlowOverview() {
  const area = findAssetById('nk-23');
  const unmet = PERMISSIVES.filter((condition) => condition.state !== 'met');
  return (
    <Card className="w-full">
      <CardHeader>
        <CardHeaderCenter>
          <CardTitle>Gas train</CardTitle>
          <CardDescription>Nordkapp plant · inlet to export · updated 14:00</CardDescription>
        </CardHeaderCenter>
        <CardHeaderEnd>
          <StatusIndicator variant="badge" {...healthStatus(area.health)} label="Running, limited" />
        </CardHeaderEnd>
      </CardHeader>
      <CardContent>
        <div className="flex w-full flex-col gap-4 rounded-xl bg-base-background p-3">
          <StageFlow label="Gas train overview" stages={STAGES_WITH_BOTTLENECK} bottleneckLabel="Bottleneck · 87 % of capacity" />
        </div>
        <div className="grid w-full grid-cols-1 gap-x-8 gap-y-4 lg:grid-cols-3">
          <div className="flex flex-col gap-3">
            <span className="text-xs font-medium text-muted-foreground">Main streams, t/h</span>
            <ul className="flex flex-col gap-2">
              {[STREAMS[0], STREAMS[1], STREAMS[4], STREAMS[2]].map((stream) => (
                <li key={stream.id} className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate text-base-foreground">
                    <span className="font-mono text-xs text-muted-foreground">{stream.id}</span> {stream.name}
                  </span>
                  <ValueReadout size="xs" value={stream.flow} decimals={1} />
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-3">
            <span className="text-xs font-medium text-muted-foreground">Mass balance, last hour</span>
            <div className="flex items-baseline gap-2">
              <ValueReadout size="md" value={BALANCE.percent} unit="%" decimals={2} />
              <span className="text-xs text-muted-foreground">imbalance</span>
            </div>
            <p className="text-xs text-muted-foreground tabular-nums">
              {formatValue(BALANCE.totalIn, 1)} t/h in · {formatValue(BALANCE.totalOut, 1)} t/h out
            </p>
            <StatusIndicator size="sm" tone="success" label="Within ±0.5 % tolerance" />
          </div>
          <div className="flex flex-col gap-3">
            <span className="text-xs font-medium text-muted-foreground">Recompressor restart</span>
            <StatusIndicator size="sm" {...runStateStatus('tripped')} detail="14 min ago" />
            <p className="text-sm text-base-foreground">
              {PERMISSIVES.length - unmet.length} of {PERMISSIVES.length} start permissives met
            </p>
            <p className="text-xs text-muted-foreground">Waiting for: {unmet.map((condition) => condition.label.toLowerCase()).join(', ')}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default definePage({
  id: 'process-flow',
  title: 'Process flow',
  summary:
    'Production units as connected stages in flow direction, each with its state and the one reading that tells how it is doing — plus the streams between them, the sequences that start them and the conditions that guard them.',
  guidance: {
    use: [
      'Order stages left to right in flow direction and keep that order on every screen.',
      'Show one key reading per stage; the rest belongs on the unit page.',
      'Mark the bottleneck in words and with an outline, and say what limits it.',
      'Give every permissive and interlock its evidence: the tag and the reading it is judged on.',
    ],
    avoid: [
      'Drawing a full P&ID where four connected cards answer the question.',
      'Colouring healthy stages green end to end; state is a small dot and a word.',
      'A disabled start button without the condition that blocks it.',
      'Arrows as the only sign of direction for assistive technology; name the flow in the label.',
    ],
  },
  source,
  sections: [
    {
      id: 'stages',
      title: 'Stages and connections',
      description: 'One stage on its own, a compact chain, and the whole train as connected cards.',
      specimens: [
        {
          id: 'ProcessFlowStageSingle',
          title: 'Stage card',
          note: 'Pick it as the building block: name, tag, state and one key reading.',
          origin: 'custom',
          uses: ['industrial/workflows/StageFlow.tsx', 'industrial/status.ts'],
          align: 'stretch',
          Component: ProcessFlowStageSingle,
        },
        {
          id: 'ProcessFlowStageAlarms',
          title: 'Stage with alarm count',
          note: 'Pick it when a stage has open alarms: the count takes the worst severity.',
          origin: 'custom',
          uses: ['industrial/workflows/StageFlow.tsx', 'industrial/operations/SeverityBadge.tsx'],
          align: 'stretch',
          Component: ProcessFlowStageAlarms,
        },
        {
          id: 'ProcessFlowStageOffline',
          title: 'Stage out of service',
          note: 'Pick it for a tripped or stopped unit: the state changes and the reading becomes a dash.',
          origin: 'custom',
          uses: ['industrial/workflows/StageFlow.tsx', 'industrial/status.ts'],
          align: 'stretch',
          Component: ProcessFlowStageOffline,
        },
        {
          id: 'ProcessFlowCompactChain',
          title: 'Compact chain',
          note: 'Pick it in a page header or table cell where the train must fit on one line.',
          origin: 'custom',
          uses: ['industrial/StatusDot.tsx', 'industrial/status.ts'],
          size: 'md',
          Component: ProcessFlowCompactChain,
        },
        {
          id: 'ProcessFlowPipelineProgress',
          title: 'Batch through stages',
          note: 'Pick it to follow one parcel or batch: which stages are behind it and where it is now.',
          origin: 'custom',
          uses: ['industrial/workflows/StepList.tsx', 'industrial/workflows/workflow.ts'],
          size: 'md',
          align: 'stretch',
          Component: ProcessFlowPipelineProgress,
        },
        {
          id: 'ProcessFlowStages',
          title: 'Connected stages',
          note: 'Pick it as the default overview of a train: inlet, separation, compression and export in flow order.',
          origin: 'custom',
          uses: ['industrial/workflows/StageFlow.tsx', 'industrial/status.ts'],
          size: 'full',
          align: 'stretch',
          Component: ProcessFlowStages,
        },
        {
          id: 'ProcessFlowBottleneck',
          title: 'Bottleneck highlight',
          note: 'Pick it when one stage limits throughput: outline it, label it and say what holds it back.',
          origin: 'custom',
          uses: ['industrial/workflows/StageFlow.tsx', 'industrial/status.ts'],
          size: 'full',
          align: 'stretch',
          Component: ProcessFlowBottleneck,
        },
      ],
    },
    {
      id: 'streams',
      title: 'Streams, batches and balance',
      description: 'What moves between the units, where the lines are open, and whether in equals out.',
      specimens: [
        {
          id: 'ProcessFlowStreamCard',
          title: 'Stream card',
          note: 'Pick it for one stream on a dashboard: flow, pressure and temperature with where it runs.',
          origin: 'custom',
          uses: ['industrial/ValueReadout.tsx'],
          align: 'stretch',
          Component: ProcessFlowStreamCard,
        },
        {
          id: 'ProcessFlowStreamTable',
          title: 'Stream table',
          note: 'Pick it to compare streams: one row each, numbers right-aligned in a shared unit.',
          origin: 'custom',
          uses: ['industrial/status.ts'],
          size: 'lg',
          align: 'stretch',
          Component: ProcessFlowStreamTable,
        },
        {
          id: 'ProcessFlowDirectionRows',
          title: 'Flow direction rows',
          note: 'Pick it for a short list of connections: from, to and how much, with idle lines dimmed and explained.',
          origin: 'custom',
          uses: ['industrial/ValueReadout.tsx'],
          size: 'md',
          align: 'stretch',
          Component: ProcessFlowDirectionRows,
        },
        {
          id: 'ProcessFlowLineUp',
          title: 'Line-up status',
          note: 'Pick it before a start or a switch-over: each valve with its position, and the ones out of position called out.',
          origin: 'custom',
          uses: ['industrial/StatusIndicator.tsx', 'industrial/status.ts'],
          size: 'md',
          align: 'stretch',
          Component: ProcessFlowLineUp,
        },
        {
          id: 'ProcessFlowMassBalance',
          title: 'Mass balance',
          note: 'Pick it to show that in equals out: the imbalance leads, the totals explain it.',
          origin: 'custom',
          uses: ['industrial/ValueReadout.tsx', 'industrial/StatusIndicator.tsx', 'industrial/workflows/workflow.ts'],
          align: 'stretch',
          Component: ProcessFlowMassBalance,
        },
        {
          id: 'ProcessFlowBatchList',
          title: 'Batches by stage',
          note: 'Pick it when several parcels move through the same stages and you need to see which are stuck.',
          origin: 'custom',
          uses: ['industrial/StatusIndicator.tsx', 'industrial/status.ts'],
          size: 'lg',
          align: 'stretch',
          Component: ProcessFlowBatchList,
        },
        {
          id: 'ProcessFlowUnitStrip',
          title: 'Unit status strip',
          note: 'Pick it across the top of a train view: every unit in flow order with state and one reading.',
          origin: 'custom',
          uses: ['industrial/StatusIndicator.tsx', 'industrial/ValueReadout.tsx', 'industrial/status.ts'],
          size: 'full',
          align: 'stretch',
          Component: ProcessFlowUnitStrip,
        },
      ],
    },
    {
      id: 'sequences',
      title: 'Start-up and safeguards',
      description: 'The steps that bring a unit online and the conditions that must hold first.',
      specimens: [
        {
          id: 'ProcessFlowStartSequence',
          title: 'Start-up sequence',
          note: 'Pick it while a sequence runs: finished steps with their time, the current step with what it waits for.',
          origin: 'custom',
          uses: ['industrial/workflows/StepList.tsx', 'industrial/workflows/workflow.ts'],
          size: 'md',
          align: 'stretch',
          Component: ProcessFlowStartSequence,
        },
        {
          id: 'ProcessFlowSequenceHeld',
          title: 'Sequence on hold',
          note: 'Pick it when a step cannot complete: the hold reason sits on the step and the way out sits below.',
          origin: 'custom',
          uses: ['industrial/workflows/StepList.tsx', 'industrial/StatusIndicator.tsx'],
          size: 'md',
          align: 'stretch',
          Component: ProcessFlowSequenceHeld,
        },
        {
          id: 'ProcessFlowPermissives',
          title: 'Permissive checklist',
          note: 'Pick it in front of a start action: all conditions must be met, and the blocking one is named beside the button.',
          origin: 'custom',
          uses: ['industrial/workflows/ConditionList.tsx'],
          size: 'md',
          align: 'stretch',
          Component: ProcessFlowPermissives,
        },
        {
          id: 'ProcessFlowInterlocks',
          title: 'Interlock status',
          note: 'Pick it to show what trips the unit: healthy, tripped and bypassed, each with its evidence.',
          origin: 'custom',
          uses: ['industrial/workflows/ConditionList.tsx'],
          size: 'md',
          align: 'stretch',
          Component: ProcessFlowInterlocks,
        },
      ],
    },
    {
      id: 'diagrams',
      title: 'Parallel trains and diagrams',
      description: 'Lanes for duty and standby, a simplified block diagram, and a full train overview.',
      specimens: [
        {
          id: 'ProcessFlowTrainLanes',
          title: 'Parallel train lanes',
          note: 'Pick it for A and B trains: one lane each, so duty and standby are compared stage by stage.',
          origin: 'custom',
          uses: ['industrial/workflows/StageFlow.tsx', 'industrial/StatusIndicator.tsx', 'industrial/ValueReadout.tsx'],
          size: 'full',
          align: 'stretch',
          Component: ProcessFlowTrainLanes,
        },
        {
          id: 'ProcessFlowBlockDiagram',
          title: 'Simplified block diagram',
          note: 'Pick it when branches and recycles matter: boxes and lines only, drawn with tokens so it follows the theme.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          Component: ProcessFlowBlockDiagram,
        },
        {
          id: 'ProcessFlowDiagramLegend',
          title: 'Diagram legend',
          note: 'Pick it beside any diagram that uses line styles and state marks without labels.',
          origin: 'custom',
          uses: ['industrial/StatusIndicator.tsx', 'industrial/status.ts'],
          Component: ProcessFlowDiagramLegend,
        },
        {
          id: 'ProcessFlowOverview',
          title: 'Train overview',
          note: 'Pick it as the landing block for a train: stages with the bottleneck, main streams, balance and what blocks the next start.',
          origin: 'custom',
          uses: ['industrial/workflows/StageFlow.tsx', 'industrial/workflows/ConditionList.tsx', 'industrial/workflows/workflow.ts', 'industrial/ValueReadout.tsx', 'industrial/StatusIndicator.tsx'],
          size: 'full',
          align: 'stretch',
          Component: ProcessFlowOverview,
        },
      ],
    },
  ],
});
