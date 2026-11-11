import { Button } from '@cognite/aura/components/button';
import { Switch } from '@cognite/aura/components/switch';
import { IconAlertTriangle, IconArrowBackUp, IconCircleCheck, IconPointer, IconRuler2 } from '@cognite/aura/icons';
import { useMemo, useReducer, useRef } from 'react';
import type { ReactNode } from 'react';

import { Bars } from '../../../library/kit/Bars';
import { Canvas } from '../../../library/kit/Canvas';
import { DataTable, type DataTableColumn } from '../../../library/kit/DataTable';
import { EmptyPanel } from '../../../library/kit/EmptyPanel';
import { Panel } from '../../../library/kit/Panel';
import { SceneStage } from '../../../library/kit/scene/SceneStage';
import { StatusPill } from '../../../library/kit/StatusPill';
import { TagId } from '../../../library/kit/TagId';
import { formatNumber, type StatusTone } from '../../../library/kit/tones';
import { LookScope } from '../../../library/looks/LookScope';
import { frameBounds } from '../../../library/three/cameraTargets';
import type { Vec3 } from '../../../library/three/cameraTargets';
import type { PlantEquipment } from '../../../library/three/plantLayout';
import { FlowLine } from '../../../library/three/plants/FlowLine';
import { solveNetwork, traceStream } from '../../../library/three/plants/flowNetwork';
import type { FlowNetwork } from '../../../library/three/plants/flowNetwork';
import { FlowPlantScene } from '../../../library/three/plants/FlowPlantScene';
import type { FlowSceneLine, FlowSceneValve } from '../../../library/three/plants/FlowPlantScene';
import { flowScenarioReducer, initialFlowScenario, isScenario } from '../../../library/three/plants/flowScenarioState';
import type { FlowScenarioAction, FlowScenarioState } from '../../../library/three/plants/flowScenarioState';
import { FlowValveMarker } from '../../../library/three/plants/FlowValveMarker';
import { normalizeRate } from '../../../library/three/plants/particlePositions';
import { SceneCanvas } from '../../../library/three/SceneCanvas';
import { StillScene } from '../../../library/three/scenes/StillScene';
import { TurntableStage } from '../../../library/three/TurntableStage';
import { useTokenColors } from '../../../library/three/useTokenColors';
import { definePage } from '../../types';

import source from './process-flow-3d.tsx?raw';

type ProcessFlow3dFluid = 'gas' | 'condensate' | 'water' | 'flare';

type ProcessFlow3dLine = {
  id: string;
  title: string;
  fluid: ProcessFlow3dFluid;
  /** Barg, °C and composition in mol per cent, normal operation. */
  pressure: number;
  temperature: number;
  composition: readonly (readonly [string, number])[];
  route: readonly Vec3[];
};

type ProcessFlow3dValve = { id: string; tag: string; name: string; lineId: string; at: number };

const PROCESSFLOW3D_FLUIDS: Readonly<Record<ProcessFlow3dFluid, { label: string; token: string; css: string }>> = {
  gas: { label: 'Gas', token: 'chart-1-450', css: 'var(--chart-1-450)' },
  condensate: { label: 'Condensate', token: 'chart-3-450', css: 'var(--chart-3-450)' },
  water: { label: 'Produced water', token: 'chart-2-450', css: 'var(--chart-2-450)' },
  flare: { label: 'Flare gas', token: 'chart-warning-450', css: 'var(--chart-warning-450)' },
};

const PROCESSFLOW3D_FLUID_TOKENS = {
  gas: 'chart-1-450',
  condensate: 'chart-3-450',
  water: 'chart-2-450',
  flare: 'chart-warning-450',
} as const;

/** Mass flow unit of the whole screen. */
const PROCESSFLOW3D_UNIT = 't/h';
const PROCESSFLOW3D_SUPPLY = 200;

/** Nodes and lines of the compression area. Flows are re-split by conductance when valves move. */
const PROCESSFLOW3D_NETWORK: FlowNetwork = {
  nodes: [
    { id: 'feed', label: 'Well stream', kind: 'source', supply: PROCESSFLOW3D_SUPPLY },
    { id: 'sep', label: 'Inlet separator 20-VA-1001', kind: 'unit', yields: { gas: 0.78, condensate: 0.15, water: 0.07 } },
    { id: 'k1', label: '1st stage compressor 23-KA-9101', kind: 'unit' },
    { id: 'k2', label: '2nd stage compressor 23-KA-9102', kind: 'unit' },
    { id: 'k3', label: 'Recompressor 23-KA-9103', kind: 'unit' },
    { id: 'cooler', label: 'Gas cooler 23-HA-9114', kind: 'unit' },
    { id: 'scrubber', label: 'Export scrubber 27-VG-2001', kind: 'unit', yields: { gas: 0.985, condensate: 0.015 } },
    { id: 'cond', label: 'Condensate header', kind: 'unit' },
    { id: 'export', label: 'Gas export', kind: 'sink' },
    { id: 'flare', label: 'Flare', kind: 'sink' },
    { id: 'tank', label: 'Condensate tank', kind: 'sink' },
    { id: 'water', label: 'Produced water', kind: 'sink' },
  ],
  edges: [
    { id: 'e-feed', from: 'feed', to: 'sep', group: 'feed', conductance: 1, valveId: 'v-esd' },
    { id: 'e-s-k1', from: 'sep', to: 'k1', group: 'gas', conductance: 1, valveId: 'v-k1' },
    { id: 'e-s-k2', from: 'sep', to: 'k2', group: 'gas', conductance: 1, valveId: 'v-k2' },
    { id: 'e-s-k3', from: 'sep', to: 'k3', group: 'gas', conductance: 1, valveId: 'v-k3' },
    { id: 'e-flare', from: 'sep', to: 'flare', group: 'gas', conductance: 0.35, valveId: 'v-flare' },
    { id: 'e-k1-c', from: 'k1', to: 'cooler', group: 'gas', conductance: 1 },
    { id: 'e-k2-c', from: 'k2', to: 'cooler', group: 'gas', conductance: 1 },
    { id: 'e-k3-c', from: 'k3', to: 'cooler', group: 'gas', conductance: 1 },
    { id: 'e-c-scr', from: 'cooler', to: 'scrubber', group: 'gas', conductance: 1 },
    { id: 'e-export', from: 'scrubber', to: 'export', group: 'gas', conductance: 1, valveId: 'v-export' },
    { id: 'e-scr-cond', from: 'scrubber', to: 'cond', group: 'condensate', conductance: 1 },
    { id: 'e-pa', from: 'sep', to: 'cond', group: 'condensate', conductance: 1, valveId: 'v-pa' },
    { id: 'e-pb', from: 'sep', to: 'cond', group: 'condensate', conductance: 1, valveId: 'v-pb' },
    { id: 'e-tank', from: 'cond', to: 'tank', group: 'condensate', conductance: 1 },
    { id: 'e-water', from: 'sep', to: 'water', group: 'water', conductance: 1 },
  ],
};

const PROCESSFLOW3D_LINES: readonly ProcessFlow3dLine[] = [
  { id: 'e-feed', title: 'Well stream', fluid: 'gas', pressure: 62, temperature: 38, composition: [['Methane', 78], ['Ethane and heavier', 15], ['Water', 4], ['CO₂', 3]], route: [[-72, 1.4, -14], [-57, 1.4, -14]] },
  { id: 'e-s-k1', title: 'Suction to 1st stage', fluid: 'gas', pressure: 61, temperature: 36, composition: [['Methane', 84], ['Ethane and heavier', 12], ['CO₂', 3], ['Water', 1]], route: [[-49, 4.4, -14], [-49, 8, -14], [-32, 8, -14], [-32, 8, -24], [-18, 8, -24], [-18, 4.2, -24]] },
  { id: 'e-s-k2', title: 'Suction to 2nd stage', fluid: 'gas', pressure: 61, temperature: 36, composition: [['Methane', 84], ['Ethane and heavier', 12], ['CO₂', 3], ['Water', 1]], route: [[-49, 4.4, -14], [-49, 7, -14], [-30, 7, -14], [-30, 7, -9], [-18, 7, -9], [-18, 4.2, -9]] },
  { id: 'e-s-k3', title: 'Suction to recompressor', fluid: 'gas', pressure: 61, temperature: 36, composition: [['Methane', 84], ['Ethane and heavier', 12], ['CO₂', 3], ['Water', 1]], route: [[-49, 4.4, -14], [-49, 6, -14], [-28, 6, -14], [-28, 6, 6], [-18, 6, 6], [-18, 4.2, 6]] },
  { id: 'e-flare', title: 'Relief to flare', fluid: 'flare', pressure: 3.2, temperature: 34, composition: [['Methane', 84], ['Ethane and heavier', 12], ['CO₂', 3], ['Water', 1]], route: [[-49, 4.4, -14], [-49, 9.5, -14], [-49, 9.5, -40], [58, 9.5, -40], [58, 9.5, -32], [58, 4, -32]] },
  { id: 'e-k1-c', title: '1st stage discharge', fluid: 'gas', pressure: 96, temperature: 128, composition: [['Methane', 84], ['Ethane and heavier', 12], ['CO₂', 3], ['Water', 1]], route: [[-12, 4.2, -24], [-12, 5, -24], [10.5, 5, -24], [10.5, 5, -9], [10.5, 3.4, -9]] },
  { id: 'e-k2-c', title: '2nd stage discharge', fluid: 'gas', pressure: 96, temperature: 128, composition: [['Methane', 84], ['Ethane and heavier', 12], ['CO₂', 3], ['Water', 1]], route: [[-12, 4.2, -9], [-12, 5.6, -9], [14, 5.6, -9], [14, 3.4, -9]] },
  { id: 'e-k3-c', title: 'Recompressor discharge', fluid: 'gas', pressure: 96, temperature: 124, composition: [['Methane', 84], ['Ethane and heavier', 12], ['CO₂', 3], ['Water', 1]], route: [[-12, 4.2, 6], [-12, 4.8, 6], [17.5, 4.8, 6], [17.5, 4.8, -9], [17.5, 3.4, -9]] },
  { id: 'e-c-scr', title: 'Cooled gas to scrubber', fluid: 'gas', pressure: 94, temperature: 41, composition: [['Methane', 84], ['Ethane and heavier', 12], ['CO₂', 3], ['Water', 1]], route: [[18.6, 1.8, -9], [38, 1.8, -9]] },
  { id: 'e-export', title: 'Export gas', fluid: 'gas', pressure: 93, temperature: 41, composition: [['Methane', 87], ['Ethane and heavier', 10], ['CO₂', 3]], route: [[40, 8.2, -9], [40, 10, -9], [72, 10, -9]] },
  { id: 'e-scr-cond', title: 'Scrubber liquid', fluid: 'condensate', pressure: 93, temperature: 41, composition: [['Propane and heavier', 71], ['Ethane', 22], ['Water', 7]], route: [[40, 1.2, -7], [40, 1.2, 15], [24, 1.2, 15]] },
  { id: 'e-pa', title: 'Condensate pump A', fluid: 'condensate', pressure: 9, temperature: 36, composition: [['Propane and heavier', 76], ['Ethane', 20], ['Water', 4]], route: [[-49, 1, -12.4], [-49, 1, 13], [24, 1, 13], [24, 1, 15]] },
  { id: 'e-pb', title: 'Condensate pump B', fluid: 'condensate', pressure: 9, temperature: 36, composition: [['Propane and heavier', 76], ['Ethane', 20], ['Water', 4]], route: [[-46.5, 1, -12.4], [-46.5, 1, 17], [22, 1, 17], [22, 1, 15], [24, 1, 15]] },
  { id: 'e-tank', title: 'Condensate to tank', fluid: 'condensate', pressure: 2, temperature: 35, composition: [['Propane and heavier', 76], ['Ethane', 20], ['Water', 4]], route: [[24, 1, 15], [24, 1, 20.8]] },
  { id: 'e-water', title: 'Produced water', fluid: 'water', pressure: 8, temperature: 36, composition: [['Water', 97], ['Dissolved gas', 2], ['Oil in water', 1]], route: [[-52, 1, -12.4], [-52, 1, 22], [-59.5, 1, 22]] },
];

const PROCESSFLOW3D_VALVES: readonly ProcessFlow3dValve[] = [
  { id: 'v-esd', tag: '20-XV-1105', name: 'Inlet shutdown', lineId: 'e-feed', at: 0.5 },
  { id: 'v-k1', tag: '23-XV-9101', name: 'Suction, 1st stage', lineId: 'e-s-k1', at: 0.55 },
  { id: 'v-k2', tag: '23-XV-9102', name: 'Suction, 2nd stage', lineId: 'e-s-k2', at: 0.55 },
  { id: 'v-k3', tag: '23-XV-9103', name: 'Suction, recompressor', lineId: 'e-s-k3', at: 0.55 },
  { id: 'v-flare', tag: '23-XV-9190', name: 'Relief to flare', lineId: 'e-flare', at: 0.08 },
  { id: 'v-export', tag: '27-XV-2010', name: 'Export', lineId: 'e-export', at: 0.5 },
  { id: 'v-pa', tag: '27-XV-2101', name: 'Condensate pump A', lineId: 'e-pa', at: 0.12 },
  { id: 'v-pb', tag: '27-XV-2102', name: 'Condensate pump B', lineId: 'e-pb', at: 0.12 },
];

/** Normal line-up: the flare relief is shut and pump B is standby. */
const PROCESSFLOW3D_NORMAL: readonly string[] = ['v-flare', 'v-pb'];
/** The recompressor trip: its suction closes and the relief to flare opens. */
const PROCESSFLOW3D_TRIPPED: readonly string[] = ['v-k3', 'v-pb'];

const PROCESSFLOW3D_EQUIPMENT: readonly PlantEquipment[] = [
  { id: '20-va-1001', kind: 'horizontal-vessel', tag: '20-VA-1001', position: [-50, 0, -14] },
  { id: '23-ka-9101', kind: 'compressor', tag: '23-KA-9101', position: [-16, 0, -24] },
  { id: '23-ka-9102', kind: 'compressor', tag: '23-KA-9102', position: [-16, 0, -9] },
  { id: '23-ka-9103', kind: 'compressor', tag: '23-KA-9103', position: [-16, 0, 6] },
  { id: '23-ha-9114', kind: 'heat-exchanger', tag: '23-HA-9114', position: [14, 0, -9] },
  { id: '27-vg-2001', kind: 'vertical-vessel', tag: '27-VG-2001', position: [40, 0, -9] },
  { id: '27-pa-2001a', kind: 'pump', tag: '27-PA-2001A', position: [-36, 0, 13], scale: 1.3 },
  { id: '27-pa-2001b', kind: 'pump', tag: '27-PA-2001B', position: [-36, 0, 17.6], scale: 1.3 },
  { id: 'tank', kind: 'storage-tank', tag: 'Condensate tank', position: [24, 0, 26], fill: 0.5, scale: 0.9 },
  { id: 'water', kind: 'horizontal-vessel', tag: 'Water vessel', position: [-64, 0, 22], scale: 0.8 },
  { id: 'flare', kind: 'flare', tag: 'Flare', position: [58, 0, -32] },
];

const PROCESSFLOW3D_LABELLED: readonly string[] = ['20-va-1001', '23-ka-9101', '23-ka-9102', '23-ka-9103', '23-ha-9114', '27-vg-2001', 'flare'];

const PROCESSFLOW3D_TARGET = frameBounds({ min: [-76, 0, -42], max: [76, 10, 30] }, { view: 'perspective', fov: 40, aspect: 1.5, padding: 0.62 });

function processFlow3dLine(id: string): ProcessFlow3dLine | undefined {
  return PROCESSFLOW3D_LINES.find((line) => line.id === id);
}

function processFlow3dFlow(flows: Readonly<Record<string, number>>, id: string): number {
  return flows[id] ?? 0;
}

const PROCESSFLOW3D_FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring-default)]';

const PROCESSFLOW3D_FLUID_ORDER: readonly ProcessFlow3dFluid[] = ['gas', 'condensate', 'water', 'flare'];

/** Stream numbers as they would stand on the drawing: S-01 for the first line, and so on. */
function processFlow3dNumber(lineId: string): string {
  return `S-${String(PROCESSFLOW3D_LINES.findIndex((line) => line.id === lineId) + 1).padStart(2, '0')}`;
}

type ProcessFlow3dScenario = { id: 'normal' | 'tripped' | 'custom'; label: string; tone: StatusTone; icon: ReactNode };

function processFlow3dScenario(state: FlowScenarioState): ProcessFlow3dScenario {
  if (isScenario(state, PROCESSFLOW3D_NORMAL)) return { id: 'normal', label: 'Normal line-up', tone: 'success', icon: <IconCircleCheck /> };
  if (isScenario(state, PROCESSFLOW3D_TRIPPED)) return { id: 'tripped', label: 'Recompressor tripped', tone: 'critical', icon: <IconAlertTriangle /> };
  return { id: 'custom', label: 'Custom line-up', tone: 'warning', icon: <IconAlertTriangle /> };
}

const PROCESSFLOW3D_SINKS: readonly { id: string; label: string; fluid: ProcessFlow3dFluid }[] = [
  { id: 'export', label: 'Gas export', fluid: 'gas' },
  { id: 'flare', label: 'Flare', fluid: 'flare' },
  { id: 'tank', label: 'Condensate tank', fluid: 'condensate' },
  { id: 'water', label: 'Produced water', fluid: 'water' },
];

function ProcessFlow3dFluidSwatch({ fluid }: { fluid: ProcessFlow3dFluid }) {
  return <span aria-hidden="true" className="inline-block h-1.5 w-5 shrink-0 rounded-full" style={{ background: PROCESSFLOW3D_FLUIDS[fluid].css }} />;
}

function ProcessFlow3dLegend({ direction = 'row' }: { direction?: 'row' | 'column' }) {
  return (
    <ul aria-label="Fluid legend" className={`flex text-sm text-[color:var(--kit-text)] ${direction === 'row' ? 'flex-wrap items-center gap-x-5 gap-y-1' : 'flex-col gap-2.5'}`}>
      {PROCESSFLOW3D_FLUID_ORDER.map((fluid) => (
        <li key={fluid} className="flex items-center gap-2 whitespace-nowrap">
          <ProcessFlow3dFluidSwatch fluid={fluid} />
          {PROCESSFLOW3D_FLUIDS[fluid].label}
        </li>
      ))}
      <li className="flex items-center gap-2 whitespace-nowrap">
        <span aria-hidden="true" className="inline-block h-1.5 w-5 shrink-0 rounded-full border border-[color:var(--kit-rule-strong)]" />
        No flow
      </li>
    </ul>
  );
}

function ProcessFlow3dFallbackList() {
  return (
    <ul className="flex flex-col gap-2 rounded-xl border border-default bg-card-background p-4">
      {PROCESSFLOW3D_LINES.slice(0, 6).map((line) => (
        <li key={line.id} className="flex items-center gap-2 text-sm text-base-foreground">
          <ProcessFlow3dFluidSwatch fluid={line.fluid} />
          {line.title}
        </li>
      ))}
    </ul>
  );
}

type ProcessFlow3dSceneProps = {
  state: FlowScenarioState;
  dispatch: (action: FlowScenarioAction) => void;
  insets?: { top?: number; right?: number; bottom?: number; left?: number };
  still?: boolean;
  overlay?: ReactNode;
  className?: string;
};

/** The compression area in 3D with every line as a particle stream. Clicking a line selects its stream. */
function ProcessFlow3dScene({ state, dispatch, insets, still = false, overlay, className }: ProcessFlow3dSceneProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const fluidColors = useTokenColors(PROCESSFLOW3D_FLUID_TOKENS, rootRef);
  const solution = useMemo(() => solveNetwork(PROCESSFLOW3D_NETWORK, state.closed), [state.closed]);
  const trace = useMemo(() => (state.selectedId ? traceStream(PROCESSFLOW3D_NETWORK, state.selectedId, solution.flows) : null), [state.selectedId, solution]);
  const selected = state.selectedId ? processFlow3dLine(state.selectedId) : undefined;
  const lines: FlowSceneLine[] = fluidColors
    ? PROCESSFLOW3D_LINES.map((line) => ({
        id: line.id,
        route: line.route,
        color: fluidColors[line.fluid].color,
        rate: normalizeRate(processFlow3dFlow(solution.flows, line.id), PROCESSFLOW3D_SUPPLY),
        emphasis: !trace ? 'normal' : line.id === state.selectedId ? 'selected' : trace.upstream.includes(line.id) || trace.downstream.includes(line.id) ? 'traced' : 'faded',
      }))
    : [];
  const valves: FlowSceneValve[] = PROCESSFLOW3D_VALVES.map((valve) => ({ id: valve.id, tag: valve.tag, lineId: valve.lineId, at: valve.at, open: !state.closed.includes(valve.id) }));

  return (
    <div ref={rootRef} data-scenario={processFlow3dScenario(state).id} className={className}>
      <SceneStage className="h-full" backdrop="none" onEscape={() => dispatch({ type: 'clear' })} overlay={overlay}>
        <SceneCanvas
          label={`3D view of the Nordkapp compression area with its pipes as moving particle streams, ${processFlow3dScenario(state).label.toLowerCase()}${selected ? `, tracing ${selected.title}` : ''}`}
          fallback={<ProcessFlow3dFallbackList />}
          camera={{ position: [0, 80, 120], fov: 40, far: 2000 }}
        >
          <StillScene still={still}>
            <FlowPlantScene
              equipment={PROCESSFLOW3D_EQUIPMENT}
              labelled={PROCESSFLOW3D_LABELLED}
              lines={lines}
              valves={valves}
              size={[150, 90]}
              target={PROCESSFLOW3D_TARGET}
              insets={insets}
              onSelectLine={(lineId) => dispatch({ type: 'select', lineId })}
              time={still ? 2 : undefined}
            />
          </StillScene>
        </SceneCanvas>
      </SceneStage>
    </div>
  );
}

type ProcessFlow3dRow = { line: ProcessFlow3dLine; number: string; flow: number; selected: boolean };

function processFlow3dRows(state: FlowScenarioState): ProcessFlow3dRow[] {
  const flows = solveNetwork(PROCESSFLOW3D_NETWORK, state.closed).flows;
  return PROCESSFLOW3D_LINES.map((line) => ({ line, number: processFlow3dNumber(line.id), flow: processFlow3dFlow(flows, line.id), selected: line.id === state.selectedId }));
}

function processFlow3dColumns(onSelect: (lineId: string) => void): DataTableColumn<ProcessFlow3dRow>[] {
  return [
    { id: 'number', header: 'No.', cell: (row) => <TagId>{row.number}</TagId>, nowrap: true, width: 'w-16' },
    {
      id: 'stream',
      header: 'Stream',
      cell: (row) => (
        <button type="button" aria-pressed={row.selected} onClick={() => onSelect(row.line.id)} className={`text-left underline-offset-4 hover:underline aria-pressed:font-semibold aria-pressed:underline ${PROCESSFLOW3D_FOCUS}`}>
          {row.line.title}
        </button>
      ),
      nowrap: true,
    },
    {
      id: 'fluid',
      header: 'Fluid',
      cell: (row) => (
        <span className="inline-flex items-center gap-2 whitespace-nowrap">
          <ProcessFlow3dFluidSwatch fluid={row.line.fluid} />
          {PROCESSFLOW3D_FLUIDS[row.line.fluid].label}
        </span>
      ),
    },
    { id: 'flow', header: `Flow, ${PROCESSFLOW3D_UNIT}`, cell: (row) => (row.flow > 0 ? formatNumber(row.flow, 1) : 'No flow'), numeric: true },
    { id: 'share', header: 'Of feed', cell: (row) => `${formatNumber(normalizeRate(row.flow, PROCESSFLOW3D_SUPPLY) * 100)} %`, numeric: true, muted: true },
    { id: 'pressure', header: 'barg', cell: (row) => (row.flow > 0 ? formatNumber(row.line.pressure, row.line.pressure < 10 ? 1 : 0) : '–'), numeric: true },
    { id: 'temperature', header: '°C', cell: (row) => (row.flow > 0 ? formatNumber(row.line.temperature) : '–'), numeric: true },
  ];
}

/** The stream table of the drawing: every line with its number, fluid and conditions. A row selects its stream. */
function ProcessFlow3dStreamTable({ state, onSelect }: { state: FlowScenarioState; onSelect: (lineId: string) => void }) {
  return (
    <DataTable
      label="Stream table: every line with its fluid, flow, share of the feed, pressure and temperature"
      columns={processFlow3dColumns(onSelect)}
      rows={processFlow3dRows(state)}
      rowKey={(row) => row.line.id}
      rowTone={(row) => (row.selected ? 'accent' : row.flow > 0 ? undefined : 'warning')}
      density="compact"
      flush
    />
  );
}

/** A dimension line with a value on it, the way a length is noted on a drawing. */
function ProcessFlow3dDimension({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <dt className="text-xs text-[color:var(--kit-text-2)]">{label}</dt>
      <dd className="flex items-baseline gap-1">
        <span className="text-2xl font-medium tabular-nums text-[color:var(--kit-text)]">{value}</span>
        <span className="text-xs text-[color:var(--kit-text-2)]">{unit}</span>
      </dd>
      <span aria-hidden="true" className="relative h-2 border-x border-[color:var(--kit-rule-strong)]">
        <span className="absolute inset-x-0 top-1/2 h-px bg-[var(--kit-rule-strong)]" />
      </span>
    </div>
  );
}

function ProcessFlow3dPath({ label, ids, onSelect }: { label: string; ids: readonly string[]; onSelect?: (lineId: string) => void }) {
  const chip = 'inline-flex items-center border border-[color:var(--kit-rule)] px-2 py-1 text-xs font-medium text-[color:var(--kit-text)]';
  return (
    <div className="flex flex-col gap-1.5">
      <h4 className="text-xs text-[color:var(--kit-text-2)]">{label}</h4>
      {ids.length === 0 ? (
        <p className="text-sm text-[color:var(--kit-text-2)]">{label === 'Fed by' ? 'Nothing: the stream starts here.' : 'Nothing: the stream ends here.'}</p>
      ) : (
        <ul className="flex flex-wrap gap-1.5">
          {ids.map((id) => (
            <li key={id}>
              {onSelect ? (
                <button type="button" aria-label={`${processFlow3dNumber(id)}, ${processFlow3dLine(id)?.title ?? id}`} title={processFlow3dLine(id)?.title} onClick={() => onSelect(id)} className={`${chip} hover:border-[color:var(--kit-rule-strong)] ${PROCESSFLOW3D_FOCUS}`}>
                  <TagId>{processFlow3dNumber(id)}</TagId>
                </button>
              ) : (
                <span className={chip}>
                  <TagId>{processFlow3dNumber(id)}</TagId>
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

type ProcessFlow3dSheetProps = { state: FlowScenarioState; onSelect?: (lineId: string) => void; onClear?: () => void; className?: string };

/** The sheet of the selected stream: its conditions as dimensions, its composition, and its path. */
function ProcessFlow3dSheet({ state, onSelect, onClear, className }: ProcessFlow3dSheetProps) {
  const line = state.selectedId ? processFlow3dLine(state.selectedId) : undefined;
  if (!line) {
    return (
      <Panel className={className} title="Stream sheet" subtitle="No stream selected">
        <EmptyPanel icon={<IconPointer />} title="Pick a stream" description="Click a line in the scene or a row in the stream table to see its conditions, composition and path." />
      </Panel>
    );
  }
  const solution = solveNetwork(PROCESSFLOW3D_NETWORK, state.closed);
  const flow = processFlow3dFlow(solution.flows, line.id);
  const trace = traceStream(PROCESSFLOW3D_NETWORK, line.id, solution.flows);
  const fluid = PROCESSFLOW3D_FLUIDS[line.fluid];
  const share = normalizeRate(flow, PROCESSFLOW3D_SUPPLY) * 100;

  return (
    <Panel
      className={className}
      title={`${processFlow3dNumber(line.id)} · ${line.title}`}
      subtitle={fluid.label}
      tone={flow > 0 ? 'neutral' : 'warning'}
      actions={
        onClear ? (
          <Button variant="ghost" size="icon-sm" aria-label="Let go of the stream" onClick={onClear}>
            <IconArrowBackUp />
          </Button>
        ) : undefined
      }
    >
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex items-end justify-between gap-3">
          <p className="flex items-baseline gap-2">
            <span className="text-5xl font-medium tracking-tight tabular-nums text-[color:var(--kit-text)]">{formatNumber(flow, 1)}</span>
            <span className="text-base text-[color:var(--kit-text-2)]">{PROCESSFLOW3D_UNIT}</span>
          </p>
          {flow > 0 ? (
            <StatusPill tone="success" icon={<IconCircleCheck />}>
              Flowing
            </StatusPill>
          ) : (
            <StatusPill tone="warning" icon={<IconAlertTriangle />}>
              No flow
            </StatusPill>
          )}
        </div>
        <dl className="grid grid-cols-2 gap-4">
          <ProcessFlow3dDimension label="Pressure" value={flow > 0 ? formatNumber(line.pressure, line.pressure < 10 ? 1 : 0) : '–'} unit="barg" />
          <ProcessFlow3dDimension label="Temperature" value={flow > 0 ? formatNumber(line.temperature) : '–'} unit="°C" />
        </dl>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-3 text-xs text-[color:var(--kit-text-2)]">
            <span>Share of the well stream</span>
            <span className="text-sm font-medium tabular-nums text-[color:var(--kit-text)]">{formatNumber(share)} %</span>
          </div>
          <span aria-hidden="true" className="h-2.5 border border-[color:var(--kit-rule-strong)]">
            <span className="block h-full" style={{ width: `${Math.min(100, share)}%`, background: fluid.css }} />
          </span>
        </div>
        <div className="flex flex-col gap-2">
          <h4 className="text-xs text-[color:var(--kit-text-2)]">Composition, mol %</h4>
          <ul className="flex flex-col gap-2">
            {line.composition.map(([name, percent]) => (
              <li key={name} className="grid grid-cols-[9rem_minmax(0,1fr)_2rem] items-center gap-2 text-sm">
                <span className="truncate text-[color:var(--kit-text)]">{name}</span>
                <span aria-hidden="true" className="h-2.5 border border-[color:var(--kit-rule-strong)]">
                  <span className="block h-full" style={{ width: `${percent}%`, background: fluid.css }} />
                </span>
                <span className="text-right font-medium tabular-nums text-[color:var(--kit-text)]">{percent}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-auto flex flex-col gap-3">
          <ProcessFlow3dPath label="Fed by" ids={trace.upstream} onSelect={onSelect} />
          <ProcessFlow3dPath label="Flows on to" ids={trace.downstream} onSelect={onSelect} />
        </div>
      </div>
    </Panel>
  );
}

type ProcessFlow3dValvesProps = { state: FlowScenarioState; dispatch: (action: FlowScenarioAction) => void; className?: string };

/** The valve line-up: every valve as a switch, with the two named scenarios as buttons. */
function ProcessFlow3dValves({ state, dispatch, className }: ProcessFlow3dValvesProps) {
  const closed = PROCESSFLOW3D_VALVES.filter((valve) => state.closed.includes(valve.id)).length;
  const flows = solveNetwork(PROCESSFLOW3D_NETWORK, state.closed).flows;

  return (
    <Panel
      className={className}
      title="Valve line-up"
      subtitle={`${closed} of ${PROCESSFLOW3D_VALVES.length} closed`}
      footer={
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => dispatch({ type: 'setValves', closed: PROCESSFLOW3D_TRIPPED })}>
            Trip recompressor
          </Button>
          <Button size="sm" variant="ghost" onClick={() => dispatch({ type: 'setValves', closed: PROCESSFLOW3D_NORMAL })}>
            Normal line-up
          </Button>
        </div>
      }
    >
      <ul className="flex flex-1 flex-col justify-between">
        {PROCESSFLOW3D_VALVES.map((valve) => {
          const open = !state.closed.includes(valve.id);
          const flow = processFlow3dFlow(flows, valve.lineId);
          return (
            <li key={valve.id} className="flex items-center justify-between gap-3 border-b border-[color:var(--kit-rule)] py-2 last:border-b-0">
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium text-[color:var(--kit-text)]">{valve.name}</span>
                <span className="truncate text-xs tabular-nums text-[color:var(--kit-text-2)]">
                  <TagId>{valve.tag}</TagId> · {processFlow3dNumber(valve.lineId)} · {flow > 0 ? `${formatNumber(flow, 1)} ${PROCESSFLOW3D_UNIT}` : 'no flow'}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-3">
                <span className={`w-12 text-right text-sm ${open ? 'text-[color:var(--kit-text-2)]' : 'font-semibold text-[color:var(--kit-line-warning)]'}`}>{open ? 'Open' : 'Closed'}</span>
                <Switch aria-label={`${valve.tag} ${valve.name}, ${open ? 'open' : 'closed'}`} checked={open} onCheckedChange={() => dispatch({ type: 'toggleValve', valveId: valve.id })} />
              </span>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

/** Where the feed ends up: each destination as a bar to scale, and whether the balance closes. */
function ProcessFlow3dBalance({ closed, direction = 'column', className }: { closed: readonly string[]; direction?: 'row' | 'column'; className?: string }) {
  const solution = solveNetwork(PROCESSFLOW3D_NETWORK, closed);
  const balanced = Math.abs(solution.imbalance) < 0.05;
  const rows = [...PROCESSFLOW3D_SINKS.map((sink) => ({ label: sink.label, value: solution.delivered[sink.id] ?? 0, css: PROCESSFLOW3D_FLUIDS[sink.fluid].css })), { label: 'Held back at source', value: solution.heldTotal, css: 'var(--kit-line-warning)' }];

  return (
    <Panel
      className={className}
      title="Mass balance"
      subtitle={`${formatNumber(solution.supplied, 1)} ${PROCESSFLOW3D_UNIT} fed in`}
      actions={
        <StatusPill tone={balanced ? 'success' : 'critical'} icon={balanced ? <IconCircleCheck /> : <IconAlertTriangle />}>
          {balanced ? 'Balanced' : 'Out of balance'}
        </StatusPill>
      }
    >
      <dl className={direction === 'row' ? 'grid grid-cols-5 gap-5' : 'flex flex-1 flex-col justify-between gap-3'}>
        {rows.map((row) => (
          <div key={row.label} className="flex min-w-0 flex-col gap-1.5">
            <dt className="truncate text-xs text-[color:var(--kit-text-2)]">{row.label}</dt>
            <dd className="flex items-baseline gap-1">
              <span className="text-2xl font-medium tabular-nums text-[color:var(--kit-text)]">{formatNumber(row.value, 1)}</span>
              <span className="text-xs text-[color:var(--kit-text-2)]">{PROCESSFLOW3D_UNIT}</span>
            </dd>
            <span aria-hidden="true" className="h-2.5 border border-[color:var(--kit-rule-strong)]">
              <span className="block h-full" style={{ width: `${Math.min(100, (row.value / PROCESSFLOW3D_SUPPLY) * 100)}%`, background: row.css }} />
            </span>
          </div>
        ))}
      </dl>
    </Panel>
  );
}

/** The title block of the drawing: what it is, its number and revision, the basis and the line-up shown. */
function ProcessFlow3dTitleBlock({ state }: { state: FlowScenarioState }) {
  const scenario = processFlow3dScenario(state);
  const cell = 'flex flex-col justify-center gap-0.5 border-l border-[color:var(--kit-rule-strong)] px-4 py-2 [&:nth-child(2)]:border-l-0 @5xl:[&:nth-child(2)]:border-l';

  return (
    <div className="@container">
      <header className="grid grid-cols-4 border border-[color:var(--kit-rule-strong)] bg-[var(--kit-surface)] @5xl:grid-cols-[minmax(0,1fr)_auto_auto_auto_auto]">
        <div className="col-span-4 flex items-center gap-3 border-b border-[color:var(--kit-rule-strong)] px-4 py-3 @5xl:col-span-1 @5xl:border-b-0">
          <IconRuler2 aria-hidden="true" className="size-7 shrink-0 text-[color:var(--kit-text)]" />
          <div className="min-w-0">
            <h2 className="text-xl font-medium tracking-tight text-[color:var(--kit-text)]">Nordkapp compression: process flow</h2>
            <p className="text-sm text-[color:var(--kit-text-2)]">Particle speed and density follow the flow in each line</p>
          </div>
        </div>
        <div className={cell}>
          <span className="text-xs text-[color:var(--kit-text-2)]">Drawing</span>
          <span className="text-sm font-medium text-[color:var(--kit-text)]">
            <TagId>NK-23-PF-001</TagId>
          </span>
        </div>
        <div className={cell}>
          <span className="text-xs text-[color:var(--kit-text-2)]">Revision</span>
          <span className="text-sm font-medium text-[color:var(--kit-text)]">C · 12 Mar</span>
        </div>
        <div className={cell}>
          <span className="text-xs text-[color:var(--kit-text-2)]">Basis</span>
          <span className="text-sm font-medium tabular-nums text-[color:var(--kit-text)]">
            {PROCESSFLOW3D_SUPPLY} {PROCESSFLOW3D_UNIT} well stream
          </span>
        </div>
        <div className={cell}>
          <span className="text-xs text-[color:var(--kit-text-2)]">Line-up</span>
          <StatusPill tone={scenario.tone} icon={scenario.icon}>
            {scenario.label}
          </StatusPill>
        </div>
      </header>
    </div>
  );
}

function ProcessFlow3dSceneLegend() {
  return (
    <div className="flex h-full items-end justify-between gap-3 p-3">
      <div className="pointer-events-auto border border-[color:var(--kit-rule-strong)] bg-[color-mix(in_oklab,var(--card-background)_90%,transparent)] px-3 py-2">
        <ProcessFlow3dLegend />
      </div>
      <p className="border border-[color:var(--kit-rule)] bg-[color-mix(in_oklab,var(--card-background)_90%,transparent)] px-3 py-2 text-xs text-[color:var(--kit-text-2)]">Click a line to trace it · Esc to let go</p>
    </div>
  );
}

function ProcessFlow3dDrawing({ initialClosed = PROCESSFLOW3D_NORMAL, initialSelected = 'e-export', still = false }: { initialClosed?: readonly string[]; initialSelected?: string | null; still?: boolean }) {
  const [state, dispatch] = useReducer(flowScenarioReducer, undefined, () => initialFlowScenario(initialClosed, initialSelected));
  const select = (lineId: string) => dispatch({ type: 'select', lineId });

  return (
    <LookScope look="blueprint">
      <Canvas className="flex flex-col gap-[var(--kit-gap)]">
        <ProcessFlow3dTitleBlock state={state} />
        <div className="grid grid-cols-[minmax(0,1fr)_22rem] items-stretch gap-[var(--kit-gap)]">
          <div className="grid min-w-0 grid-rows-[34rem_auto_auto] gap-[var(--kit-gap)]">
            <Panel title="Flow scene" subtitle="Compression area, looking north" padding="none">
              <ProcessFlow3dScene className="min-h-0 flex-1" state={state} dispatch={dispatch} insets={{ bottom: 50 }} still={still} overlay={<ProcessFlow3dSceneLegend />} />
            </Panel>
            <Panel title="Stream table" subtitle={`${PROCESSFLOW3D_LINES.length} streams · select one to trace it`} padding="none">
              <ProcessFlow3dStreamTable state={state} onSelect={select} />
            </Panel>
            <ProcessFlow3dBalance closed={state.closed} direction="row" />
          </div>
          <div className="grid min-w-0 grid-rows-[34rem_minmax(0,1fr)] gap-[var(--kit-gap)]">
            <ProcessFlow3dSheet key={state.selectedId ?? 'none'} state={state} onSelect={select} onClear={() => dispatch({ type: 'clear' })} />
            <ProcessFlow3dValves state={state} dispatch={dispatch} />
          </div>
        </div>
      </Canvas>
    </LookScope>
  );
}

function ProcessFlowSignature() {
  return <ProcessFlow3dDrawing />;
}

/** The detail state: the recompressor has tripped and the relief to flare is the stream being traced. */
function ProcessFlowTripped() {
  return <ProcessFlow3dDrawing initialClosed={PROCESSFLOW3D_TRIPPED} initialSelected="e-flare" still />;
}

/** The same model as an operator's what-if console: valves on a rail, the scene, and where the feed ends up against normal. */
function ProcessFlowWhatIf() {
  const [state, dispatch] = useReducer(flowScenarioReducer, undefined, () => initialFlowScenario(PROCESSFLOW3D_TRIPPED, null));
  const scenario = processFlow3dScenario(state);
  const normal = solveNetwork(PROCESSFLOW3D_NETWORK, PROCESSFLOW3D_NORMAL);
  const current = solveNetwork(PROCESSFLOW3D_NETWORK, state.closed);

  return (
    <LookScope look="console">
      <Canvas padding="none" className="grid h-[44rem] grid-cols-[21rem_minmax(0,1fr)] grid-rows-[minmax(0,1fr)_auto] gap-px bg-[var(--kit-rule)]">
        <ProcessFlow3dValves state={state} dispatch={dispatch} className="row-span-2" />
        <Panel title="What if" subtitle="Flip a valve and the flow re-splits" tone={scenario.tone} padding="none" actions={<StatusPill tone={scenario.tone}>{scenario.label}</StatusPill>}>
          <ProcessFlow3dScene className="min-h-0 flex-1" state={state} dispatch={dispatch} insets={{ bottom: 40 }} still overlay={<ProcessFlow3dSceneLegend />} />
        </Panel>
        <Panel title="Where the feed ends up" subtitle={`${PROCESSFLOW3D_UNIT}, this line-up against normal`}>
          <Bars
            label="Flow delivered to each destination in this line-up against the normal line-up"
            orientation="horizontal"
            categories={PROCESSFLOW3D_SINKS.map((sink) => sink.label)}
            series={[
              { id: 'normal', label: 'Normal', values: PROCESSFLOW3D_SINKS.map((sink) => normal.delivered[sink.id] ?? 0), tone: 'neutral' },
              { id: 'current', label: 'This line-up', values: PROCESSFLOW3D_SINKS.map((sink) => current.delivered[sink.id] ?? 0), tone: scenario.tone === 'success' ? 'accent' : scenario.tone },
            ]}
            unit={PROCESSFLOW3D_UNIT}
            decimals={1}
            showValues
            height={190}
          />
        </Panel>
      </Canvas>
    </LookScope>
  );
}

function ProcessFlowPartTable() {
  const [state, dispatch] = useReducer(flowScenarioReducer, undefined, () => initialFlowScenario(PROCESSFLOW3D_TRIPPED, 'e-s-k2'));

  return (
    <LookScope look="blueprint" className="w-full">
      <Canvas>
        <Panel title="Stream table" subtitle="Recompressor tripped: its suction and discharge carry nothing" padding="none">
          <ProcessFlow3dStreamTable state={state} onSelect={(lineId) => dispatch({ type: 'select', lineId })} />
        </Panel>
      </Canvas>
    </LookScope>
  );
}

function ProcessFlowPartSheet() {
  const [state, dispatch] = useReducer(flowScenarioReducer, undefined, () => initialFlowScenario(PROCESSFLOW3D_NORMAL, 'e-s-k2'));

  return (
    <LookScope look="blueprint" className="w-full">
      <Canvas className="flex h-[36rem] flex-col">
        <ProcessFlow3dSheet key={state.selectedId ?? 'none'} state={state} onSelect={(lineId) => dispatch({ type: 'select', lineId })} onClear={() => dispatch({ type: 'clear' })} />
      </Canvas>
    </LookScope>
  );
}

function ProcessFlowPartValves() {
  const [state, dispatch] = useReducer(flowScenarioReducer, undefined, () => initialFlowScenario(PROCESSFLOW3D_NORMAL));

  return (
    <LookScope look="blueprint" className="w-full">
      <Canvas className="flex h-[36rem] flex-col">
        <ProcessFlow3dValves state={state} dispatch={dispatch} />
      </Canvas>
    </LookScope>
  );
}

function ProcessFlowPartBalance() {
  const [tripped, toggle] = useReducer((value: boolean) => !value, true);

  return (
    <LookScope look="blueprint" className="w-full">
      <Canvas className="flex flex-col gap-4">
        <ProcessFlow3dBalance closed={tripped ? PROCESSFLOW3D_TRIPPED : PROCESSFLOW3D_NORMAL} direction="row" />
        <Switch label={tripped ? 'Recompressor tripped' : 'Normal line-up'} checked={tripped} onCheckedChange={() => toggle()} />
      </Canvas>
    </LookScope>
  );
}

function ProcessFlowPartTitleBlock() {
  return (
    <LookScope look="blueprint" className="w-full">
      <Canvas className="flex flex-col justify-center gap-4">
        <ProcessFlow3dTitleBlock state={initialFlowScenario(PROCESSFLOW3D_TRIPPED)} />
        <div className="self-start border border-[color:var(--kit-rule-strong)] bg-[var(--kit-surface)] px-4 py-3">
          <ProcessFlow3dLegend />
        </div>
      </Canvas>
    </LookScope>
  );
}

function ProcessFlow3dPartScene({ label, children, footer }: { label: string; children: (colors: Record<ProcessFlow3dFluid, string> | null) => ReactNode; footer?: ReactNode }) {
  // Colours cannot cross into the canvas, so they are resolved here, inside the look, and passed in as strings.
  const ref = useRef<HTMLDivElement>(null);
  const colors = useTokenColors(PROCESSFLOW3D_FLUID_TOKENS, ref);

  return (
    <LookScope look="blueprint" className="w-full">
      <Canvas className="flex h-80 flex-col gap-3">
        <div ref={ref} className="min-h-0 flex-1 border border-[color:var(--kit-rule-strong)] bg-[var(--kit-surface)]">
          <SceneStage className="h-full" backdrop="none">
            <SceneCanvas label={label}>
              <StillScene>{children(colors ? { gas: colors.gas.color, condensate: colors.condensate.color, water: colors.water.color, flare: colors.flare.color } : null)}</StillScene>
            </SceneCanvas>
          </SceneStage>
        </div>
        {footer}
      </Canvas>
    </LookScope>
  );
}

function ProcessFlowPartRates() {
  const rates = [0.12, 0.45, 1] as const;

  return (
    <ProcessFlow3dPartScene label="Three lines with particle streams at low, medium and full flow" footer={<p className="text-sm text-[color:var(--kit-text-2)]">Low, medium and full flow: faster and denser as the rate rises.</p>}>
      {(colors) => (
        <TurntableStage subjectSize={[34, 4, 12]} view="isometric" padding={0.6}>
          {colors ? rates.map((rate, index) => <FlowLine key={rate} id={`rate-${rate}`} route={[[-15, 1, (index - 1) * 4], [15, 1, (index - 1) * 4]]} color={colors.gas} rate={rate} time={3} />) : null}
        </TurntableStage>
      )}
    </ProcessFlow3dPartScene>
  );
}

function ProcessFlowPartValve() {
  const [open, toggle] = useReducer((value: boolean) => !value, false);

  return (
    <ProcessFlow3dPartScene label={`A line with a valve ${open ? 'open' : 'closed'}`} footer={<Switch label={open ? 'Valve open' : 'Valve closed'} checked={open} onCheckedChange={() => toggle()} />}>
      {(colors) => (
        <TurntableStage subjectSize={[16, 3, 6]} view="isometric" padding={0.55}>
          {colors ? <FlowLine id="a" route={[[-7, 1.4, 0], [7, 1.4, 0]]} color={colors.gas} rate={open ? 0.7 : 0} time={3} /> : null}
          <FlowValveMarker position={[0, 1.4, 0]} direction={[1, 0, 0]} open={open} />
        </TurntableStage>
      )}
    </ProcessFlow3dPartScene>
  );
}

export default definePage({
  id: 'process-flow-3d',
  title: 'Process flow in 3D',
  summary:
    'A process flow diagram that moves: the compression area in 3D with every line a stream of particles, over the stream table of the same drawing. Select a stream in the scene or in the table to trace it and open its sheet; close a valve or trip the recompressor and the flows re-split.',
  guidance: {
    use: [
      'When the question is where the flow goes: which line feeds this machine, what happens downstream if a valve closes.',
      'With the stream table under the scene, numbered the same way, so every moving line can be read as a row.',
      'With a mass balance beside it: a stream that vanishes shows up as held back, never as a gap.',
      'For engineering reviews, where a drawing with a title block and stream numbers is the familiar form.',
    ],
    avoid: [
      'Using it as a simulator: it splits flow by conductance, it does not solve pressures.',
      'Colour alone for blocked lines: an empty tube, a closed-valve shape and the words No flow say it too.',
      'Hiding the table on small screens. Without it the scene is the only way in, and it is one image to a screen reader.',
      'Motion under reduced motion: particles give way to still chevrons.',
    ],
  },
  source,
  sections: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description: 'Drag to orbit, scroll to zoom. Click a line in the scene, or its row in the stream table, to trace it upstream and downstream and open its sheet. Flip valves on the right, or trip the recompressor, and watch the table and the balance follow. Escape lets go of the stream.',
      specimens: [
        {
          id: 'ProcessFlowSignature',
          title: 'Process flow',
          note: 'Pick it when people need to see where the flow goes and read each stream as a numbered row at the same time.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: [
            'kit/Panel.tsx',
            'kit/DataTable.tsx',
            'kit/scene/SceneStage.tsx',
            'kit/StatusPill.tsx',
            'kit/TagId.tsx',
            'looks/LookScope.tsx',
            'three/plants/FlowPlantScene.tsx',
            'three/plants/flowNetwork.ts',
            'three/plants/flowScenarioState.ts',
            'three/plants/particlePositions.ts',
            'three/SceneCanvas.tsx',
            'three/useTokenColors.ts',
          ],
          Component: ProcessFlowSignature,
        },
      ],
    },
    {
      id: 'variations',
      title: 'Other screens',
      description: 'The drawing after the recompressor has tripped, with the relief to flare traced, and the same model as an operator what-if console.',
      specimens: [
        {
          id: 'ProcessFlowTripped',
          title: 'Recompressor tripped',
          note: 'Pick it to see the detail state: one suction closed, the relief open, and the flare stream traced through table and sheet.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Panel.tsx', 'kit/DataTable.tsx', 'kit/scene/SceneStage.tsx', 'three/plants/FlowPlantScene.tsx', 'three/plants/flowNetwork.ts'],
          Component: ProcessFlowTripped,
        },
        {
          id: 'ProcessFlowWhatIf',
          title: 'What-if console',
          note: 'Pick it for operators trying a line-up: valves on a rail, the scene, and each destination compared with normal.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Bars.tsx', 'kit/Panel.tsx', 'kit/scene/SceneStage.tsx', 'three/plants/FlowPlantScene.tsx', 'three/plants/flowNetwork.ts', 'looks/LookScope.tsx'],
          Component: ProcessFlowWhatIf,
        },
      ],
    },
    {
      id: 'parts',
      title: 'Parts',
      description: 'The table, the sheet, the line-up and balance, and what a line looks like at different rates.',
      specimens: [
        {
          id: 'ProcessFlowPartTable',
          title: 'Stream table',
          note: 'Pick it as the readable twin of a flow scene: numbered streams, a row that selects, and blocked lines marked in words.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/DataTable.tsx', 'kit/Panel.tsx', 'kit/TagId.tsx'],
          Component: ProcessFlowPartTable,
        },
        {
          id: 'ProcessFlowPartSheet',
          title: 'Stream sheet',
          note: 'Pick it as the detail of one stream: flow, conditions noted like dimensions, composition and the path both ways.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Panel.tsx', 'kit/StatusPill.tsx', 'kit/EmptyPanel.tsx', 'three/plants/flowNetwork.ts'],
          Component: ProcessFlowPartSheet,
        },
        {
          id: 'ProcessFlowPartValves',
          title: 'Valve line-up',
          note: 'Pick switches for a small set of valves, with the state in a word and the named scenarios as buttons.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Panel.tsx', 'kit/TagId.tsx', 'three/plants/flowScenarioState.ts'],
          Component: ProcessFlowPartValves,
        },
        {
          id: 'ProcessFlowPartBalance',
          title: 'Mass balance',
          note: 'Pick it next to any what-if: every destination to scale, what is held back, and whether the sum closes.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Panel.tsx', 'kit/StatusPill.tsx', 'three/plants/flowNetwork.ts'],
          Component: ProcessFlowPartBalance,
        },
        {
          id: 'ProcessFlowPartTitleBlock',
          title: 'Title block and legend',
          note: 'Pick a title block as the header of a drawing-style screen: number, revision, basis and the line-up shown.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/StatusPill.tsx', 'kit/TagId.tsx'],
          Component: ProcessFlowPartTitleBlock,
        },
        {
          id: 'ProcessFlowPartRates',
          title: 'Flow rates',
          note: 'Pick particle speed and density together to show rate; one alone is hard to compare between lines.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          bleed: true,
          uses: ['three/plants/FlowLine.tsx', 'three/plants/FlowParticles.tsx', 'three/TurntableStage.tsx', 'kit/scene/SceneStage.tsx'],
          Component: ProcessFlowPartRates,
        },
        {
          id: 'ProcessFlowPartValve',
          title: 'Valve on a line',
          note: 'Pick a valve marker that changes shape when closed, so a blocked line never depends on colour.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          bleed: true,
          uses: ['three/plants/FlowValveMarker.tsx', 'three/plants/FlowLine.tsx', 'three/TurntableStage.tsx'],
          Component: ProcessFlowPartValve,
        },
      ],
    },
  ],
});
