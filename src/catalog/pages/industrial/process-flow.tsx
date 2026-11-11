import { Button } from '@cognite/aura/components/button';
import {
  IconAlertTriangle,
  IconArrowsSplit2,
  IconCircleCheck,
  IconDroplet,
  IconEngine,
  IconFilter,
  IconFlame,
  IconListCheck,
  IconPlayerPause,
  IconPlayerPlay,
  IconRoute,
  IconShieldLock,
  IconTransfer,
} from '@cognite/aura/icons';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { Canvas } from '../../../library/kit/Canvas';
import { DataTable, type DataTableColumn } from '../../../library/kit/DataTable';
import { Grid } from '../../../library/kit/Grid';
import { IconChip } from '../../../library/kit/IconChip';
import { ListRow } from '../../../library/kit/ListRow';
import { Meter } from '../../../library/kit/Meter';
import { Panel } from '../../../library/kit/Panel';
import { BalanceFlow, type BalanceStream } from '../../../library/kit/process-flow/BalanceFlow';
import { BlockFlow, type FlowBlock, type FlowEdge } from '../../../library/kit/process-flow/BlockFlow';
import { ConditionBoard, type ConditionItem } from '../../../library/kit/process-flow/ConditionBoard';
import { bottleneckOf, massBalance, stepProgress, summariseConditions } from '../../../library/kit/process-flow/flow';
import { FlowStages, type FlowStageItem } from '../../../library/kit/process-flow/FlowStages';
import { StepSequence, type SequenceStep } from '../../../library/kit/process-flow/StepSequence';
import { TrainLanes, type TrainLane } from '../../../library/kit/process-flow/TrainLanes';
import { RingGauge } from '../../../library/kit/RingGauge';
import { SectionHeader } from '../../../library/kit/SectionHeader';
import { Stat } from '../../../library/kit/Stat';
import { StatGroup } from '../../../library/kit/StatGroup';
import { StatusPill } from '../../../library/kit/StatusPill';
import { TagId } from '../../../library/kit/TagId';
import type { Tone } from '../../../library/kit/tones';
import type { LookId } from '../../../library/looks/looks';
import { LookScope } from '../../../library/looks/LookScope';
import { definePage } from '../../types';

import source from './process-flow.tsx?raw';

/** The gas train in flow direction, one unit standing for each stage. */
const PROCESS_FLOW_STAGES: FlowStageItem[] = [
  { id: 'inlet', name: 'Inlet', tag: '20-XV-1105', state: 'Running', tone: 'success', icon: <IconDroplet />, value: 168, decimals: 1, unit: 't/h', caption: 'Well stream', load: 73 },
  { id: 'separation', name: 'Separation', tag: '20-VA-1001', state: 'Running', tone: 'success', icon: <IconFilter />, value: 54.3, decimals: 1, unit: '%', caption: 'Separator level', load: 61 },
  { id: 'compression', name: 'Compression', tag: '23-KA-9101', state: 'Running', tone: 'warning', icon: <IconEngine />, value: 48.6, decimals: 1, unit: 'barg', caption: 'Discharge pressure', load: 93, alarms: 2 },
  { id: 'export', name: 'Export', tag: '27-PA-2001A', state: 'Running', tone: 'success', icon: <IconTransfer />, value: 412, unit: 'm³/h', caption: 'Export flow', load: 69 },
];

const PROCESS_FLOW_LINKS = [{ label: '168.0 t/h' }, { label: '131.2 t/h' }, { label: '128.4 t/h' }];

const PROCESS_FLOW_STAGE_NOTES: Record<string, string> = {
  inlet: 'Wells on full choke. The shutdown valve passed its partial stroke test on 10 March.',
  separation: 'Level steady inside the 30 to 70 % band. Test separator on standby.',
  compression: 'Running on two stages while the recompressor is down. Discharge temperature is 3.8 °C under its high limit.',
  export: 'Pump A carries the full duty. Pump B is on standby with its start test overdue.',
};

/** The recompression branch while the recompressor is tripped. */
const PROCESS_FLOW_BRANCH: FlowStageItem[] = [
  { id: 'test-sep', name: 'Test separator', tag: '20-VA-1002', state: 'Standby', tone: 'info', icon: <IconFilter />, value: 0, decimals: 1, unit: 't/h', caption: 'Flash gas' },
  { id: 'recomp', name: 'Recompressor', tag: '23-KA-9103', state: 'Tripped', tone: 'critical', icon: <IconEngine />, value: null, unit: 'barg', caption: 'Discharge pressure', alarms: 1 },
  { id: 'flare', name: 'Flare', tag: '43-FL-0001', state: 'Taking load', tone: 'warning', icon: <IconFlame />, value: 0.3, decimals: 1, unit: 't/h', caption: 'Flared gas' },
];

const PROCESS_FLOW_BRANCH_LINKS = [{ state: 'stopped' as const, label: 'No flow' }, { label: '0.3 t/h' }];

type ProcessFlowStream = { id: string; name: string; from: string; to: string; flow: number; pressure: number; temperature: number; phase: 'Mixed' | 'Gas' | 'Liquid' };

const PROCESS_FLOW_STREAMS: ProcessFlowStream[] = [
  { id: 'S-101', name: 'Well stream', from: 'Inlet', to: '20-VA-1001', flow: 168.0, pressure: 13.4, temperature: 62.0, phase: 'Mixed' },
  { id: 'S-201', name: 'Separator gas', from: '20-VA-1001', to: '23-KA-9101', flow: 131.2, pressure: 12.4, temperature: 31.5, phase: 'Gas' },
  { id: 'S-202', name: 'Condensate', from: '20-VA-1001', to: '27-PA-2001A', flow: 29.6, pressure: 13.1, temperature: 58.2, phase: 'Liquid' },
  { id: 'S-203', name: 'Produced water', from: '20-VA-1001', to: 'Water treatment', flow: 6.9, pressure: 13.1, temperature: 58.2, phase: 'Liquid' },
  { id: 'S-301', name: 'Export gas', from: '23-KA-9102', to: 'Gas export', flow: 128.4, pressure: 48.6, temperature: 38.9, phase: 'Gas' },
  { id: 'S-302', name: 'Fuel gas', from: '23-KA-9102', to: '23-GT-9001', flow: 2.6, pressure: 28.0, temperature: 36.4, phase: 'Gas' },
];

const PROCESS_FLOW_PHASE_TONE: Record<ProcessFlowStream['phase'], Tone> = { Mixed: 'purple', Gas: 'teal', Liquid: 'blue' };

const PROCESS_FLOW_STREAM_COLUMNS: DataTableColumn<ProcessFlowStream>[] = [
  { id: 'id', header: 'Stream', cell: (stream) => <TagId>{stream.id}</TagId>, nowrap: true },
  { id: 'name', header: 'Service', cell: (stream) => <span className="font-medium">{stream.name}</span> },
  { id: 'route', header: 'From → to', cell: (stream) => `${stream.from} → ${stream.to}`, muted: true },
  { id: 'flow', header: 'Flow, t/h', cell: (stream) => stream.flow.toFixed(1), numeric: true },
  { id: 'pressure', header: 'Pressure, barg', cell: (stream) => stream.pressure.toFixed(1), numeric: true },
  { id: 'temperature', header: 'Temp, °C', cell: (stream) => stream.temperature.toFixed(1), numeric: true },
  { id: 'phase', header: 'Phase', cell: (stream) => <StatusPill tone={PROCESS_FLOW_PHASE_TONE[stream.phase]}>{stream.phase}</StatusPill> },
];

const PROCESS_FLOW_STREAM_COLUMNS_SHORT = PROCESS_FLOW_STREAM_COLUMNS.filter((column) => ['id', 'name', 'flow', 'pressure'].includes(column.id));

const PROCESS_FLOW_BALANCE_IN: BalanceStream[] = [{ id: 'feed', label: 'Well stream', value: 168.0, tone: 'purple' }];

const PROCESS_FLOW_BALANCE_OUT: BalanceStream[] = [
  { id: 'gas', label: 'Export gas', value: 128.4, tone: 'teal' },
  { id: 'condensate', label: 'Condensate', value: 29.6, tone: 'amber' },
  { id: 'water', label: 'Produced water', value: 6.9, tone: 'blue' },
  { id: 'fuel', label: 'Fuel gas', value: 2.6, tone: 'pink' },
  { id: 'flare', label: 'Flare', value: 0.3, tone: 'critical' },
];

const PROCESS_FLOW_BALANCE = massBalance(
  PROCESS_FLOW_BALANCE_IN.map((stream) => stream.value),
  PROCESS_FLOW_BALANCE_OUT.map((stream) => stream.value)
);

type ProcessFlowValve = { tag: string; name: string; position: 'Open' | 'Closed'; required: 'Open' | 'Closed' };

const PROCESS_FLOW_LINE_UP: ProcessFlowValve[] = [
  { tag: '20-XV-1105', name: 'Inlet shutdown valve', position: 'Open', required: 'Open' },
  { tag: '23-XV-9120', name: '1st stage suction isolation', position: 'Open', required: 'Open' },
  { tag: '23-FV-9131', name: 'Anti-surge valve', position: 'Closed', required: 'Closed' },
  { tag: '23-XV-9140', name: 'Recompressor suction isolation', position: 'Closed', required: 'Closed' },
  { tag: '27-XV-2015', name: 'Export pump B discharge', position: 'Closed', required: 'Open' },
  { tag: '27-XV-2030', name: 'Export header isolation', position: 'Open', required: 'Open' },
];

type ProcessFlowParcel = { id: string; destination: string; volume: number; stage: number; held?: string; times: readonly string[] };

const PROCESS_FLOW_PARCEL_STAGES = ['Receive', 'Stabilise', 'Meter', 'Load', 'Release'];

const PROCESS_FLOW_PARCELS: ProcessFlowParcel[] = [
  { id: 'P-0312', destination: 'Stord terminal', volume: 4200, stage: 2, times: ['06:10', '08:45', 'Since 11:20'] },
  { id: 'P-0313', destination: 'Stord terminal', volume: 3900, stage: 1, times: ['09:30', 'Since 12:05'] },
  { id: 'P-0314', destination: 'Hammerfest LNG', volume: 5100, stage: 1, held: 'Waiting for lab result', times: ['10:15', 'Held 12:40'] },
  { id: 'P-0311', destination: 'Stord terminal', volume: 4050, stage: 5, times: ['Mon 22:10', '00:35', '03:20', '05:50', '07:15'] },
];

function processFlowParcelSteps(parcel: ProcessFlowParcel): SequenceStep[] {
  return PROCESS_FLOW_PARCEL_STAGES.map((label, index) => ({
    id: label,
    label,
    time: parcel.times[index],
    state: index < parcel.stage ? 'done' : index === parcel.stage ? (parcel.held ? 'held' : 'active') : 'pending',
  }));
}

const PROCESS_FLOW_RESTART: SequenceStep[] = [
  { id: 'reset', label: 'Reset vibration trip', detail: 'Confirmed by Ingrid Haugen', time: '13:54', state: 'done' },
  { id: 'lube', label: 'Confirm lube oil pressure above 1.8 barg', detail: '23-PT-92770 · 2.4 barg', time: '13:57', state: 'done' },
  { id: 'seal', label: 'Pressurise seal gas', detail: 'Waiting for 23-PDT-92761 above 0.5 bar', time: 'Since 13:58', state: 'active' },
  { id: 'suction', label: 'Open suction isolation 23-XV-9140', state: 'pending' },
  { id: 'crank', label: 'Crank to idle, 3,000 rpm', state: 'pending' },
  { id: 'load', label: 'Load to minimum flow', state: 'pending' },
];

const PROCESS_FLOW_RESTART_HELD: SequenceStep[] = PROCESS_FLOW_RESTART.map((step) =>
  step.id === 'seal' ? { ...step, state: 'held', detail: 'Seal gas differential 0.3 bar, needs 0.5 bar', time: 'Held 14:00' } : step
);

const PROCESS_FLOW_PERMISSIVES: ConditionItem[] = [
  { id: 'trip', label: 'Vibration trip reset', detail: '23-VT-92740 · 0.4 mm/s', state: 'met' },
  { id: 'lube', label: 'Lube oil pressure above 1.8 barg', detail: '23-PT-92770 · 2.4 barg', state: 'met' },
  { id: 'seal', label: 'Seal gas differential above 0.5 bar', detail: '23-PDT-92761 · 0.3 bar', state: 'unmet' },
  { id: 'suction', label: 'Suction pressure above 3 barg', detail: '23-PT-92730 · 4.1 barg', state: 'met' },
  { id: 'surge', label: 'Anti-surge valve fully open', detail: '23-FV-9331 · 100 %', state: 'met' },
  { id: 'wo', label: 'No open isolation on the unit', detail: 'WO-104482 isolation removed 13:50', state: 'met' },
];

const PROCESS_FLOW_INTERLOCKS: ConditionItem[] = [
  { id: 'i-2301', label: 'I-2301 High-high vibration', detail: '23-VT-92740 · tripped 13:46 at 11.6 mm/s', state: 'unmet' },
  { id: 'i-2302', label: 'I-2302 Low lube oil pressure', detail: '23-PT-92770 · 2.4 barg', state: 'met' },
  { id: 'i-2303', label: 'I-2303 High discharge temperature', detail: '23-TT-92732 · 34.0 °C', state: 'met' },
  { id: 'i-2304', label: 'I-2304 Low seal gas differential', detail: 'Bypassed by Liv Wold until 18:00', state: 'bypassed' },
  { id: 'i-2305', label: 'I-2305 Surge detection', detail: '23-FT-92710 · no surge counted', state: 'met' },
  { id: 'i-2306', label: 'I-2306 Low suction pressure', detail: '23-PT-92730 · 4.1 barg', state: 'met' },
];

const PROCESS_FLOW_INTERLOCK_WORDS = { met: 'Healthy', unmet: 'Tripped', bypassed: 'Bypassed' };

const PROCESS_FLOW_LANES: TrainLane[] = [
  {
    id: 'a',
    name: 'Train A',
    state: 'Running',
    tone: 'success',
    share: 100,
    stages: [
      { id: 'a-suction', name: 'Suction', tag: '27-XV-2011A', state: 'Open', tone: 'success' },
      { id: 'a-pump', name: 'Export pump A', tag: '27-PA-2001A', state: 'Running', tone: 'success', value: 21.4, decimals: 1, unit: 'barg' },
      { id: 'a-meter', name: 'Metering', tag: '27-FT-2001A', state: 'Measuring', tone: 'success', value: 412, unit: 'm³/h' },
    ],
    links: [{ label: '412 m³/h' }, { label: '412 m³/h' }],
  },
  {
    id: 'b',
    name: 'Train B',
    state: 'Standby',
    tone: 'info',
    share: 0,
    stages: [
      { id: 'b-suction', name: 'Suction', tag: '27-XV-2011B', state: 'Closed', tone: 'neutral' },
      { id: 'b-pump', name: 'Export pump B', tag: '27-PA-2001B', state: 'Standby', tone: 'info', value: null, unit: 'barg' },
      { id: 'b-meter', name: 'Metering', tag: '27-FT-2001B', state: 'No flow', tone: 'neutral', value: 0, unit: 'm³/h' },
    ],
    links: [{ state: 'stopped' }, { state: 'stopped' }],
  },
];

const PROCESS_FLOW_BLOCKS: FlowBlock[] = [
  { id: 'wells', label: 'Wells', detail: '168.0 t/h', col: 0, row: 0, kind: 'terminal' },
  { id: 'separator', label: 'Separator', detail: '20-VA-1001', col: 1, row: 0, tone: 'success' },
  { id: 'stage-1', label: '1st stage', detail: '23-KA-9101', col: 2, row: 0, tone: 'warning' },
  { id: 'cooler', label: 'Cooler', detail: '23-HA-9114', col: 3, row: 0, tone: 'warning' },
  { id: 'stage-2', label: '2nd stage', detail: '23-KA-9102', col: 4, row: 0, tone: 'success' },
  { id: 'gas-export', label: 'Gas export', detail: '128.4 t/h', col: 5, row: 0, kind: 'terminal' },
  { id: 'pump-a', label: 'Pump A', detail: '27-PA-2001A', col: 2, row: 1, tone: 'success' },
  { id: 'terminal', label: 'Stord terminal', detail: '29.6 t/h', col: 3, row: 1, kind: 'terminal' },
  { id: 'recomp', label: 'Recompressor', detail: '23-KA-9103', col: 1, row: 1, tone: 'critical' },
  { id: 'turbine', label: 'Gas turbine', detail: '23-GT-9001', col: 4, row: 1, tone: 'success' },
];

const PROCESS_FLOW_EDGES: FlowEdge[] = [
  { id: 'e1', from: 'wells', to: 'separator', label: 'S-101', tone: 'accent' },
  { id: 'e2', from: 'separator', to: 'stage-1', label: 'S-201', tone: 'accent' },
  { id: 'e3', from: 'stage-1', to: 'cooler', tone: 'accent' },
  { id: 'e4', from: 'cooler', to: 'stage-2', tone: 'accent' },
  { id: 'e5', from: 'stage-2', to: 'gas-export', label: 'S-301', tone: 'accent' },
  { id: 'e6', from: 'stage-2', to: 'stage-1', label: 'Anti-surge recycle', kind: 'stopped' },
  { id: 'e7', from: 'separator', to: 'pump-a', label: 'S-202', tone: 'accent' },
  { id: 'e8', from: 'pump-a', to: 'terminal', tone: 'accent' },
  { id: 'e9', from: 'separator', to: 'recomp', kind: 'stopped' },
  { id: 'e10', from: 'stage-2', to: 'turbine', label: 'S-302', kind: 'utility' },
];

const PROCESS_FLOW_BLOCK_NOTES: Record<string, { state: string; tone: Tone; note: string }> = {
  wells: { state: 'Flowing', tone: 'success', note: 'Four wells on full choke deliver 168.0 t/h of mixed well stream.' },
  separator: { state: 'Running', tone: 'success', note: 'Level 54.3 %, pressure 13.1 barg. Splits the feed into gas, condensate and water.' },
  'stage-1': { state: 'Running, watch', tone: 'warning', note: 'Discharge temperature 141.2 °C against a 145 °C limit. Drive-end vibration 6.8 mm/s.' },
  cooler: { state: 'Running, watch', tone: 'warning', note: 'Outlet 38.9 °C, 1.1 °C under its limit. Tube bundle cleaning is waiting for parts.' },
  'stage-2': { state: 'Running', tone: 'success', note: 'Delivers 48.6 barg to the export header and 2.6 t/h of fuel gas to the turbine.' },
  'gas-export': { state: 'Receiving', tone: 'success', note: 'Export at 128.4 t/h, 4 % under the daily plan.' },
  'pump-a': { state: 'Running', tone: 'success', note: 'Carries the full condensate duty at 21.4 barg. Pump B is on standby.' },
  terminal: { state: 'Receiving', tone: 'success', note: 'Parcel P-0312 is metering; 4,200 m³ nominated for Stord.' },
  recomp: { state: 'Tripped', tone: 'critical', note: 'Tripped on high vibration at 13:46. Restart is held on seal gas differential.' },
  turbine: { state: 'Running', tone: 'success', note: 'Drives both compressor stages on 2.6 t/h of fuel gas.' },
};

function ProcessFlowSheet({ look, children }: { look?: LookId; children: ReactNode }) {
  const canvas = <Canvas className="h-full">{children}</Canvas>;
  return look ? (
    <LookScope look={look} className="h-full w-full">
      {canvas}
    </LookScope>
  ) : (
    <div className="h-full w-full">{canvas}</div>
  );
}

function ProcessFlowLineUpRows({ valves }: { valves: readonly ProcessFlowValve[] }) {
  return (
    <ul aria-label="Valve line-up" className="flex flex-col">
      {valves.map((valve) => {
        const right = valve.position === valve.required;
        return (
          <ListRow
            key={valve.tag}
            tone={right ? 'neutral' : 'warning'}
            title={valve.name}
            meta={right ? valve.tag : `${valve.tag} · must be ${valve.required.toLowerCase()}`}
            trailing={
              <StatusPill tone={right ? 'success' : 'warning'} icon={right ? <IconCircleCheck /> : <IconAlertTriangle />}>
                {valve.position}
              </StatusPill>
            }
          />
        );
      })}
    </ul>
  );
}

function ProcessFlowStageChain() {
  const [selectedId, setSelectedId] = useState('compression');
  const selected = PROCESS_FLOW_STAGES.find((stage) => stage.id === selectedId) ?? PROCESS_FLOW_STAGES[0];
  return (
    <ProcessFlowSheet>
      <Panel
        title="Gas train"
        subtitle="Inlet to export, in flow direction"
        icon={
          <IconChip tone="blue">
            <IconRoute />
          </IconChip>
        }
        actions={<StatusPill tone="warning">Reduced capacity</StatusPill>}
        footer={
          <span>
            <strong className="font-semibold text-(--kit-text)">{selected.name}.</strong> {PROCESS_FLOW_STAGE_NOTES[selected.id]}
          </span>
        }
      >
        <FlowStages label="Gas train, inlet to export" stages={PROCESS_FLOW_STAGES} links={PROCESS_FLOW_LINKS} selectedId={selectedId} onSelect={setSelectedId} />
      </Panel>
    </ProcessFlowSheet>
  );
}

function ProcessFlowBottleneck() {
  const limit = bottleneckOf(PROCESS_FLOW_STAGES);
  return (
    <ProcessFlowSheet>
      <Grid>
        <Panel className="col-span-12" title="Where the line is limited" subtitle="Load as a share of each stage's capacity">
          <FlowStages label="Gas train with bottleneck" stages={PROCESS_FLOW_STAGES} links={PROCESS_FLOW_LINKS} bottleneckId={limit?.id} />
        </Panel>
        <Panel className="col-span-12" title="Headroom" subtitle="Before compression limits export" tone="warning">
          <div className="grid grid-cols-3 items-center gap-8">
            <Stat variant="plain" size="lg" label="Compression load" value={93} unit="%" tone="warning" delta={{ value: 6, decimals: 0, unit: ' pts', good: 'down', caption: 'since the trip' }} />
            <Meter label="Export against capacity" value={128.4} max={140} unit="t/h" decimals={1} high={134} target={{ value: 134, label: 'Plan' }} tone="warning" />
            <p className="text-sm text-(--kit-text-2)">Two stages carry the duty of three. Bringing the recompressor back frees about 9 t/h of compression and stops the flaring.</p>
          </div>
        </Panel>
      </Grid>
    </ProcessFlowSheet>
  );
}

function ProcessFlowBranchStopped() {
  return (
    <ProcessFlowSheet>
      <Panel title="Recompression branch" subtitle="Flash gas route while the recompressor is down" actions={<StatusPill tone="critical">Tripped 13:46</StatusPill>} footer="A broken line carries nothing. Flash gas goes to flare until the restart completes.">
        <FlowStages label="Recompression branch" stages={PROCESS_FLOW_BRANCH} links={PROCESS_FLOW_BRANCH_LINKS} />
      </Panel>
    </ProcessFlowSheet>
  );
}

function ProcessFlowCompactChain() {
  return (
    <ProcessFlowSheet>
      <Panel title="Compact chain" subtitle="One line per stage, top to bottom">
        <FlowStages label="Gas train, compact" stages={PROCESS_FLOW_STAGES} links={PROCESS_FLOW_LINKS} size="compact" orientation="vertical" />
      </Panel>
    </ProcessFlowSheet>
  );
}

function ProcessFlowStreamTable() {
  return (
    <ProcessFlowSheet>
      <Panel title="Streams" subtitle="Six streams across the gas train, live" padding="none" footer="Flows are mass flows from the reconciled model, updated 14:00 UTC.">
        <DataTable label="Process streams" flush columns={PROCESS_FLOW_STREAM_COLUMNS} rows={PROCESS_FLOW_STREAMS} rowKey={(stream) => stream.id} />
      </Panel>
    </ProcessFlowSheet>
  );
}

function ProcessFlowMassBalance() {
  return (
    <ProcessFlowSheet>
      <Panel title="Mass balance" subtitle="Across the gas train, t/h">
        <BalanceFlow label="Mass balance across the gas train" inputs={PROCESS_FLOW_BALANCE_IN} outputs={PROCESS_FLOW_BALANCE_OUT} unit="t/h" height={260} />
      </Panel>
    </ProcessFlowSheet>
  );
}

function ProcessFlowLineUp() {
  const wrong = PROCESS_FLOW_LINE_UP.filter((valve) => valve.position !== valve.required).length;
  return (
    <ProcessFlowSheet>
      <Panel title="Line-up" subtitle={`${wrong} of ${PROCESS_FLOW_LINE_UP.length} valves out of position`}>
        <ProcessFlowLineUpRows valves={PROCESS_FLOW_LINE_UP} />
      </Panel>
    </ProcessFlowSheet>
  );
}

function ProcessFlowParcels() {
  const [selectedId, setSelectedId] = useState('P-0312');
  const selected = PROCESS_FLOW_PARCELS.find((parcel) => parcel.id === selectedId) ?? PROCESS_FLOW_PARCELS[0];
  return (
    <ProcessFlowSheet>
      <Panel title="Condensate parcels" subtitle="Four parcels between receipt and release">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-4 rounded-(--kit-radius-sm) bg-(--kit-well) p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-base font-semibold text-(--kit-text)">
                Parcel <TagId>{selected.id}</TagId>
              </p>
              <p className="text-sm text-(--kit-text-2) tabular-nums">
                {selected.volume.toLocaleString('en-GB')} m³ to {selected.destination}
              </p>
            </div>
            <StepSequence label={`Parcel ${selected.id}, stages`} steps={processFlowParcelSteps(selected)} orientation="horizontal" />
          </div>
          <ul aria-label="Parcels" className="grid grid-cols-2 gap-3">
            {PROCESS_FLOW_PARCELS.map((parcel) => {
              const done = parcel.stage >= PROCESS_FLOW_PARCEL_STAGES.length;
              return (
                <li key={parcel.id}>
                  <button
                    type="button"
                    aria-pressed={parcel.id === selectedId}
                    onClick={() => setSelectedId(parcel.id)}
                    className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-(--kit-radius-sm) border border-(--kit-rule) px-3 py-2.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring-default aria-pressed:border-(--kit-accent) aria-pressed:bg-(--kit-well)"
                  >
                    <span className="flex min-w-0 flex-col">
                      <TagId className="text-sm font-semibold">{parcel.id}</TagId>
                      <span className="text-xs text-(--kit-text-3)">{parcel.destination}</span>
                    </span>
                    <StatusPill tone={done ? 'success' : parcel.held ? 'warning' : 'info'}>{done ? 'Released' : (parcel.held ?? PROCESS_FLOW_PARCEL_STAGES[parcel.stage])}</StatusPill>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </Panel>
    </ProcessFlowSheet>
  );
}

function ProcessFlowStreamCard() {
  const stream = PROCESS_FLOW_STREAMS[4];
  return (
    <ProcessFlowSheet>
      <Panel
        title={stream.name}
        subtitle={`${stream.from} → ${stream.to}`}
        icon={
          <IconChip tone="teal">
            <IconArrowsSplit2 />
          </IconChip>
        }
        actions={<StatusPill tone="teal">{stream.phase}</StatusPill>}
        footer={`Stream ${stream.id} · 76.5 % of the feed by mass`}
      >
        <div className="flex flex-col gap-5">
          <Stat variant="plain" size="lg" label="Mass flow" value={stream.flow} decimals={1} unit="t/h" delta={{ value: -5.2, unit: ' t/h', caption: 'vs plan' }} />
          <Meter label="Pressure" value={stream.pressure} max={60} unit="barg" decimals={1} high={52} tone="teal" />
          <Meter label="Temperature" value={stream.temperature} max={60} unit="°C" decimals={1} high={40} tone="warning" />
        </div>
      </Panel>
    </ProcessFlowSheet>
  );
}

function ProcessFlowStartSequence() {
  const [held, setHeld] = useState(false);
  const steps = held ? PROCESS_FLOW_RESTART_HELD : PROCESS_FLOW_RESTART;
  const progress = stepProgress(steps.map((step) => step.state));
  return (
    <ProcessFlowSheet>
      <Panel
        title="Recompressor restart"
        subtitle={`Step ${(progress.current ?? 0) + 1} of ${progress.total} · ${held ? 'on hold' : 'in progress'}`}
        icon={
          <IconChip tone={held ? 'warning' : 'accent'}>
            <IconListCheck />
          </IconChip>
        }
        actions={
          <Button variant="outline" size="sm" onClick={() => setHeld((current) => !current)}>
            {held ? <IconPlayerPlay /> : <IconPlayerPause />}
            {held ? 'Resume' : 'Hold'}
          </Button>
        }
        tone={held ? 'warning' : 'neutral'}
        footer="Hold stops the sequence at the step in hand. Nothing that is already done is undone."
      >
        <StepSequence label="Recompressor restart sequence" steps={steps} />
      </Panel>
    </ProcessFlowSheet>
  );
}

function ProcessFlowPermissives() {
  return (
    <ProcessFlowSheet>
      <Panel
        title="Start permissives"
        subtitle="Recompressor 23-KA-9103"
        icon={
          <IconChip tone="critical">
            <IconShieldLock />
          </IconChip>
        }
        footer="Start stays locked until every permissive is met. Each line shows the tag it is judged on."
      >
        <ConditionBoard label="Start permissives, recompressor" items={PROCESS_FLOW_PERMISSIVES} />
      </Panel>
    </ProcessFlowSheet>
  );
}

function ProcessFlowInterlocks() {
  return (
    <ProcessFlowSheet>
      <Panel title="Interlocks" subtitle="Recompressor trip matrix, six interlocks" actions={<StatusPill tone="warning">1 bypassed until 18:00</StatusPill>}>
        <ConditionBoard label="Recompressor interlocks" items={PROCESS_FLOW_INTERLOCKS} words={PROCESS_FLOW_INTERLOCK_WORDS} layout="tiles" columns={3} />
      </Panel>
    </ProcessFlowSheet>
  );
}

function ProcessFlowTrainLanes() {
  return (
    <ProcessFlowSheet>
      <Panel title="Export pumps" subtitle="Duty and standby, same stages in the same columns" footer="Train B takes over within 40 s on a low-pressure trip of train A.">
        <TrainLanes label="Export pump trains" lanes={PROCESS_FLOW_LANES} />
      </Panel>
    </ProcessFlowSheet>
  );
}

function ProcessFlowBlockDiagram() {
  const [selectedId, setSelectedId] = useState('stage-1');
  const block = PROCESS_FLOW_BLOCKS.find((candidate) => candidate.id === selectedId) ?? PROCESS_FLOW_BLOCKS[0];
  const detail = PROCESS_FLOW_BLOCK_NOTES[block.id];
  return (
    <ProcessFlowSheet>
      <Panel
        title="Block flow diagram"
        subtitle="Gas train with condensate export and fuel gas. Select a block."
        actions={<StatusPill tone={detail.tone}>{`${block.label} · ${detail.state}`}</StatusPill>}
        footer={
          <span>
            <strong className="font-semibold text-(--kit-text)">{block.label}.</strong> {detail.note} Solid lines are process streams, dashed lines utilities, dotted lines carry nothing.
          </span>
        }
      >
        <BlockFlow label="Block flow diagram of the gas train" blocks={PROCESS_FLOW_BLOCKS} edges={PROCESS_FLOW_EDGES} selectedId={selectedId} onSelect={setSelectedId} />
      </Panel>
    </ProcessFlowSheet>
  );
}

function ProcessFlowConsole() {
  const interlocks = summariseConditions(PROCESS_FLOW_INTERLOCKS.map((item) => item.state));
  return (
    <ProcessFlowSheet look="console">
      <Grid>
        <Panel className="col-span-12" title="Gas train" subtitle="168.0 t/h in · 128.4 t/h exported" tone="warning">
          <FlowStages label="Gas train, console" stages={PROCESS_FLOW_STAGES} links={PROCESS_FLOW_LINKS} bottleneckId="compression" />
        </Panel>
        <Panel className="col-span-7" title="Streams" subtitle="t/h · barg" padding="none">
          <DataTable label="Process streams" flush columns={PROCESS_FLOW_STREAM_COLUMNS_SHORT} rows={PROCESS_FLOW_STREAMS} rowKey={(stream) => stream.id} />
        </Panel>
        <Panel className="col-span-5" title="Interlocks 23-KA-9103" subtitle={`${interlocks.unmet} tripped · ${interlocks.bypassed} bypassed`} tone="critical">
          <ConditionBoard label="Recompressor interlocks" items={PROCESS_FLOW_INTERLOCKS} words={PROCESS_FLOW_INTERLOCK_WORDS} hideSummary />
        </Panel>
      </Grid>
    </ProcessFlowSheet>
  );
}

function ProcessFlowPoster() {
  return (
    <ProcessFlowSheet look="poster">
      <div className="flex flex-col gap-6">
        <SectionHeader size="lg" title="Compression is the limit." description="Four stages, inlet to export. One of them runs at 93 % of what it can do." />
        <FlowStages label="Gas train, poster" stages={PROCESS_FLOW_STAGES.map((stage, index) => ({ ...stage, tone: stage.id === 'compression' ? 'warning' : (['blue', 'teal', 'warning', 'green'] as const)[index] }))} links={PROCESS_FLOW_LINKS} />
        <Panel title="Where the feed goes" subtitle="168.0 t/h in, by mass">
          <BalanceFlow label="Mass balance, poster" inputs={PROCESS_FLOW_BALANCE_IN} outputs={PROCESS_FLOW_BALANCE_OUT} unit="t/h" height={250} />
        </Panel>
      </div>
    </ProcessFlowSheet>
  );
}

function ProcessFlowBlueprint() {
  return (
    <ProcessFlowSheet look="blueprint">
      <Grid>
        <Panel className="col-span-12" title="Block flow diagram" subtitle="NK-PFD-001 · rev C">
          <BlockFlow label="Block flow diagram, drawing style" blocks={PROCESS_FLOW_BLOCKS} edges={PROCESS_FLOW_EDGES} />
        </Panel>
        <Panel className="col-span-4" title="Restart sequence" subtitle="23-KA-9103 · step 3 of 6">
          <StepSequence label="Recompressor restart, drawing style" steps={PROCESS_FLOW_RESTART} />
        </Panel>
        <Panel className="col-span-8" title="Start permissives" subtitle="23-KA-9103 · 5 of 6 met">
          <ConditionBoard label="Start permissives, drawing style" items={PROCESS_FLOW_PERMISSIVES} layout="tiles" columns={2} hideSummary />
        </Panel>
      </Grid>
    </ProcessFlowSheet>
  );
}

function ProcessFlowSignal() {
  return (
    <ProcessFlowSheet look="signal">
      <div className="flex flex-col gap-2">
        <FlowStages label="Gas train, wall screen" stages={PROCESS_FLOW_STAGES} links={PROCESS_FLOW_LINKS} />
        <Grid>
          <Panel className="col-span-4" title="Recompressor" subtitle="23-KA-9103" tone="critical">
            <div className="flex flex-col gap-1">
              <span className="text-4xl font-extrabold tracking-tight">Tripped</span>
              <span className="text-sm">High vibration at 13:46. Restart held on seal gas.</span>
            </div>
          </Panel>
          <Panel className="col-span-8" title="Interlocks" subtitle="Six on the recompressor">
            <ConditionBoard label="Recompressor interlocks, wall screen" items={PROCESS_FLOW_INTERLOCKS} words={PROCESS_FLOW_INTERLOCK_WORDS} layout="tiles" columns={3} hideSummary />
          </Panel>
        </Grid>
      </div>
    </ProcessFlowSheet>
  );
}

function ProcessFlowGlass() {
  const progress = stepProgress(PROCESS_FLOW_RESTART.map((step) => step.state));
  return (
    <ProcessFlowSheet look="glass">
      <Panel title="Recompressor restart" subtitle="Seal gas is pressurising">
        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-6">
          <div className="flex flex-col items-center gap-3">
            <RingGauge label="Sequence complete" value={progress.percent} size={132} tone="sky" />
            <StatusPill tone="sky">Step 3 of 6</StatusPill>
          </div>
          <StepSequence label="Recompressor restart, glass" steps={PROCESS_FLOW_RESTART} />
        </div>
      </Panel>
    </ProcessFlowSheet>
  );
}

function ProcessFlowEditorial() {
  return (
    <ProcessFlowSheet look="editorial">
      <div className="flex flex-col gap-8">
        <SectionHeader eyebrow="Start readiness" size="lg" title="One condition stands between the recompressor and a restart." description="Seal gas differential is 0.3 bar and needs 0.5. Everything else is in place." />
        <ConditionBoard label="Start permissives, report" items={PROCESS_FLOW_PERMISSIVES} />
      </div>
    </ProcessFlowSheet>
  );
}

function ProcessFlowTrainOverview() {
  const [selectedId, setSelectedId] = useState('compression');
  const selected = PROCESS_FLOW_STAGES.find((stage) => stage.id === selectedId) ?? PROCESS_FLOW_STAGES[0];
  return (
    <ProcessFlowSheet look="studio">
      <div className="flex flex-col gap-(--kit-gap)">
        <SectionHeader title="Gas train" description="Thursday 12 March · updated 14:00 UTC" actions={<StatusPill tone="warning">Reduced capacity</StatusPill>} />
        <StatGroup columns={4}>
          <Stat label="Feed" value={168} decimals={1} unit="t/h" icon={<IconDroplet />} tone="purple" delta={{ value: -1.2, unit: ' t/h', caption: 'vs yesterday' }} />
          <Stat label="Gas export" value={128.4} decimals={1} unit="t/h" icon={<IconTransfer />} tone="teal" delta={{ value: -5.2, unit: ' t/h', caption: 'vs plan' }} />
          <Stat label="Flared" value={0.3} decimals={1} unit="t/h" icon={<IconFlame />} tone="critical" delta={{ value: 0.3, unit: ' t/h', good: 'down', caption: 'since 13:46' }} />
          <Stat label="Unaccounted" value={Math.abs(PROCESS_FLOW_BALANCE.percent)} decimals={2} unit="%" icon={<IconCircleCheck />} tone="success" target="Tolerance 1.00 %" />
        </StatGroup>
        <Grid>
          <Panel className="col-span-12" title="Stages" subtitle="Select a stage for its note" footer={`${selected.name}. ${PROCESS_FLOW_STAGE_NOTES[selected.id]}`}>
            <FlowStages label="Gas train overview" stages={PROCESS_FLOW_STAGES} links={PROCESS_FLOW_LINKS} bottleneckId="compression" selectedId={selectedId} onSelect={setSelectedId} />
          </Panel>
          <Panel className="col-span-7" title="Mass balance" subtitle="Where the feed goes, t/h">
            <BalanceFlow label="Mass balance, overview" inputs={PROCESS_FLOW_BALANCE_IN} outputs={PROCESS_FLOW_BALANCE_OUT} unit="t/h" height={250} />
          </Panel>
          <Panel className="col-span-5" title="Line-up" subtitle="1 of 6 valves out of position">
            <ProcessFlowLineUpRows valves={PROCESS_FLOW_LINE_UP} />
          </Panel>
        </Grid>
      </div>
    </ProcessFlowSheet>
  );
}

function ProcessFlowRestartBoard() {
  const [held, setHeld] = useState(true);
  const steps = held ? PROCESS_FLOW_RESTART_HELD : PROCESS_FLOW_RESTART;
  const permissives = summariseConditions(PROCESS_FLOW_PERMISSIVES.map((item) => item.state));
  return (
    <ProcessFlowSheet look="soft">
      <div className="flex flex-col gap-(--kit-gap)">
        <SectionHeader
          title="Bring the recompressor back"
          description="Everything the shift needs to restart 23-KA-9103, in one place."
          actions={
            <Button onClick={() => setHeld((current) => !current)}>
              {held ? <IconPlayerPlay /> : <IconPlayerPause />}
              {held ? 'Resume sequence' : 'Hold sequence'}
            </Button>
          }
        />
        <Grid>
          <Panel className="col-span-5" title="Restart sequence" subtitle={held ? 'On hold at step 3' : 'Step 3 in progress'} tone={held ? 'amber' : 'blue'}>
            <StepSequence label="Recompressor restart board" steps={steps} />
          </Panel>
          <Panel className="col-span-7" title="Start permissives" subtitle={`${permissives.met} of ${permissives.total} met`} tone="pink">
            <ConditionBoard label="Start permissives, board" items={PROCESS_FLOW_PERMISSIVES} layout="tiles" columns={2} hideSummary />
          </Panel>
          <Panel className="col-span-12" title="Where the flash gas goes meanwhile" subtitle="Recompression branch" tone="purple">
            <FlowStages label="Recompression branch, board" stages={PROCESS_FLOW_BRANCH} links={PROCESS_FLOW_BRANCH_LINKS} />
          </Panel>
        </Grid>
      </div>
    </ProcessFlowSheet>
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
      'Drawing a full P&ID where four connected stages answer the question.',
      'A line with an arrow head where nothing flows; break the line instead.',
      'A disabled start button without the condition that blocks it.',
      'Counting a bypassed interlock as healthy.',
    ],
  },
  source,
  sections: [
    {
      id: 'stages',
      title: 'Stages and connections',
      description: 'Units in flow direction, joined by lines that say what moves between them.',
      specimens: [
        {
          id: 'ProcessFlowStageChain',
          title: 'Connected stages',
          note: 'Pick it as the header of a train page: four stages answer where the line stands, and a click explains one.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/process-flow/FlowStages.tsx', 'kit/process-flow/FlowConnector.tsx', 'kit/Panel.tsx'],
          Component: ProcessFlowStageChain,
        },
        {
          id: 'ProcessFlowBottleneck',
          title: 'Bottleneck with headroom',
          note: 'Pick it when the question is what limits throughput and how much is left.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/process-flow/FlowStages.tsx', 'kit/process-flow/flow.ts', 'kit/Meter.tsx', 'kit/Stat.tsx'],
          Component: ProcessFlowBottleneck,
        },
        {
          id: 'ProcessFlowBranchStopped',
          title: 'Stopped branch',
          note: 'Pick it when part of the route carries nothing: the line breaks and the diverted flow is shown.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          bleed: true,
          uses: ['kit/process-flow/FlowStages.tsx', 'kit/process-flow/FlowConnector.tsx'],
          Component: ProcessFlowBranchStopped,
        },
        {
          id: 'ProcessFlowStreamCard',
          title: 'Stream card',
          note: 'Pick it for one stream on a unit page, with the two readings that describe its condition.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Panel.tsx', 'kit/Stat.tsx', 'kit/Meter.tsx'],
          Component: ProcessFlowStreamCard,
        },
      ],
    },
    {
      id: 'streams',
      title: 'Streams, batches and balance',
      description: 'What flows, where it goes and whether it adds up.',
      specimens: [
        {
          id: 'ProcessFlowStreamTable',
          title: 'Stream table',
          note: 'Pick it when engineers need every stream with its conditions side by side.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/DataTable.tsx', 'kit/Panel.tsx', 'kit/TagId.tsx'],
          Component: ProcessFlowStreamTable,
        },
        {
          id: 'ProcessFlowMassBalance',
          title: 'Mass balance',
          note: 'Pick it to show where the feed ends up and whether the balance closes.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          bleed: true,
          uses: ['kit/process-flow/BalanceFlow.tsx', 'kit/process-flow/flow.ts'],
          Component: ProcessFlowMassBalance,
        },
        {
          id: 'ProcessFlowLineUp',
          title: 'Line-up status',
          note: 'Pick it before a start or a changeover, to find the valve that is not where it must be.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          bleed: true,
          uses: ['kit/ListRow.tsx', 'kit/StatusPill.tsx'],
          Component: ProcessFlowLineUp,
        },
        {
          id: 'ProcessFlowParcels',
          title: 'Batches through stages',
          note: 'Pick it when discrete parcels move through fixed stages and one of them can be held.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          bleed: true,
          uses: ['kit/process-flow/StepSequence.tsx', 'kit/StatusPill.tsx'],
          Component: ProcessFlowParcels,
        },
        {
          id: 'ProcessFlowCompactChain',
          title: 'Compact chain',
          note: 'Pick it in a side column where the full stage block does not fit.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          bleed: true,
          uses: ['kit/process-flow/FlowStages.tsx'],
          Component: ProcessFlowCompactChain,
        },
      ],
    },
    {
      id: 'sequences',
      title: 'Start-up and safeguards',
      description: 'The steps that start a unit and the conditions that guard it.',
      specimens: [
        {
          id: 'ProcessFlowStartSequence',
          title: 'Start-up sequence',
          note: 'Pick it while a sequence runs: the step in hand is the loudest thing, and it can be held.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          bleed: true,
          uses: ['kit/process-flow/StepSequence.tsx', 'kit/process-flow/flow.ts'],
          Component: ProcessFlowStartSequence,
        },
        {
          id: 'ProcessFlowPermissives',
          title: 'Permissive checklist',
          note: 'Pick it next to a start button, so a blocked start explains itself.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          bleed: true,
          uses: ['kit/process-flow/ConditionBoard.tsx', 'kit/process-flow/flow.ts'],
          Component: ProcessFlowPermissives,
        },
        {
          id: 'ProcessFlowInterlocks',
          title: 'Interlock tiles',
          note: 'Pick it for a trip matrix read at a glance; a bypass is never drawn as healthy.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/process-flow/ConditionBoard.tsx'],
          Component: ProcessFlowInterlocks,
        },
      ],
    },
    {
      id: 'diagrams',
      title: 'Parallel trains and diagrams',
      description: 'Duty and standby side by side, and the whole unit as blocks.',
      specimens: [
        {
          id: 'ProcessFlowTrainLanes',
          title: 'Parallel train lanes',
          note: 'Pick it for duty and standby equipment that must be compared stage by stage.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/process-flow/TrainLanes.tsx', 'kit/process-flow/FlowStages.tsx'],
          Component: ProcessFlowTrainLanes,
        },
        {
          id: 'ProcessFlowBlockDiagram',
          title: 'Block flow diagram',
          note: 'Pick it when branches and recycles matter and a straight chain would hide them.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/process-flow/BlockFlow.tsx', 'kit/process-flow/blockRoute.ts'],
          Component: ProcessFlowBlockDiagram,
        },
      ],
    },
    {
      id: 'looks',
      title: 'In other looks',
      description: 'The same parts change anatomy with the look: state edges, solid tiles, drawn boxes, state-filled blocks.',
      specimens: [
        {
          id: 'ProcessFlowConsole',
          title: 'Console',
          note: 'Pick it for an operator screen: stages are blocks with a state edge, tables are dense.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/process-flow/FlowStages.tsx', 'kit/process-flow/ConditionBoard.tsx', 'kit/DataTable.tsx', 'looks/LookScope.tsx'],
          Component: ProcessFlowConsole,
        },
        {
          id: 'ProcessFlowPoster',
          title: 'Poster',
          note: 'Pick it for a review screen: stages are solid tiles and the balance is drawn in blocks of colour.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/process-flow/FlowStages.tsx', 'kit/process-flow/BalanceFlow.tsx', 'looks/LookScope.tsx'],
          Component: ProcessFlowPoster,
        },
        {
          id: 'ProcessFlowBlueprint',
          title: 'Blueprint',
          note: 'Pick it in engineering tools: blocks are drawn boxes, steps are outlined numerals.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/process-flow/BlockFlow.tsx', 'kit/process-flow/StepSequence.tsx', 'kit/process-flow/ConditionBoard.tsx', 'looks/LookScope.tsx'],
          Component: ProcessFlowBlueprint,
        },
        {
          id: 'ProcessFlowSignal',
          title: 'Signal',
          note: 'Pick it for a wall screen: every stage and interlock is filled with its state and says it in a word.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/process-flow/FlowStages.tsx', 'kit/process-flow/ConditionBoard.tsx', 'looks/LookScope.tsx'],
          Component: ProcessFlowSignal,
        },
        {
          id: 'ProcessFlowGlass',
          title: 'Glass',
          note: 'Pick it for a showpiece view of one sequence, with progress as a ring.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          bleed: true,
          uses: ['kit/process-flow/StepSequence.tsx', 'kit/RingGauge.tsx', 'looks/LookScope.tsx'],
          Component: ProcessFlowGlass,
        },
        {
          id: 'ProcessFlowEditorial',
          title: 'Editorial',
          note: 'Pick it in a handover report: the verdict is the headline and the checklist is the evidence.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          bleed: true,
          uses: ['kit/process-flow/ConditionBoard.tsx', 'kit/SectionHeader.tsx', 'looks/LookScope.tsx'],
          Component: ProcessFlowEditorial,
        },
      ],
    },
    {
      id: 'in-use',
      title: 'In use',
      description: 'Compositions that can be dropped into a product.',
      specimens: [
        {
          id: 'ProcessFlowTrainOverview',
          title: 'Train overview',
          note: 'Pick it as the landing view of one process train: headline figures, stages, balance and line-up.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/process-flow/FlowStages.tsx', 'kit/process-flow/BalanceFlow.tsx', 'kit/StatGroup.tsx', 'kit/ListRow.tsx', 'looks/LookScope.tsx'],
          Component: ProcessFlowTrainOverview,
        },
        {
          id: 'ProcessFlowRestartBoard',
          title: 'Restart board',
          note: 'Pick it for the shift that brings a tripped unit back: sequence, permissives and the diverted flow together.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/process-flow/StepSequence.tsx', 'kit/process-flow/ConditionBoard.tsx', 'kit/process-flow/FlowStages.tsx', 'looks/LookScope.tsx'],
          Component: ProcessFlowRestartBoard,
        },
      ],
    },
  ],
});
