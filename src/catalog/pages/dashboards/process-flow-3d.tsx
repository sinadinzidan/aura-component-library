import { Button } from '@cognite/aura/components/button';
import { Switch } from '@cognite/aura/components/switch';
import { IconArrowLeft } from '@cognite/aura/icons';
import { useMemo, useReducer, useRef } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';

import { TONE_VALUE_TEXT, formatValue } from '../../../library/industrial/status';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { ValueReadout } from '../../../library/industrial/ValueReadout';
import { ThemeScope } from '../../../library/themes/ThemeScope';
import { frameBounds } from '../../../library/three/cameraTargets';
import type { Vec3 } from '../../../library/three/cameraTargets';
import { HudPanel } from '../../../library/three/HudPanel';
import type { PlantEquipment } from '../../../library/three/plantLayout';
import { FlowLine } from '../../../library/three/plants/FlowLine';
import { solveNetwork, traceStream } from '../../../library/three/plants/flowNetwork';
import type { FlowNetwork } from '../../../library/three/plants/flowNetwork';
import { FlowPlantScene } from '../../../library/three/plants/FlowPlantScene';
import type { FlowSceneLine, FlowSceneValve } from '../../../library/three/plants/FlowPlantScene';
import { flowScenarioReducer, initialFlowScenario, isScenario } from '../../../library/three/plants/flowScenarioState';
import type { FlowScenarioState } from '../../../library/three/plants/flowScenarioState';
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

const PROCESSFLOW3D_TARGET = frameBounds({ min: [-76, 0, -42], max: [76, 10, 30] }, { view: 'perspective', fov: 40, aspect: 1.5, padding: 0.6 });

const PROCESSFLOW3D_GLASS = 'border border-default bg-[color-mix(in_oklab,var(--card-background)_78%,transparent)] backdrop-blur-md';
const PROCESSFLOW3D_FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ring-default)]';

function processFlow3dLine(id: string): ProcessFlow3dLine | undefined {
  return PROCESSFLOW3D_LINES.find((line) => line.id === id);
}

function processFlow3dFlow(flows: Readonly<Record<string, number>>, id: string): number {
  return flows[id] ?? 0;
}

function processFlow3dScenarioLabel(state: FlowScenarioState): { label: string; tone: 'success' | 'critical' | 'warning'; shape: 'dot' | 'diamond' | 'square' } {
  if (isScenario(state, PROCESSFLOW3D_NORMAL)) return { label: 'Normal line-up', tone: 'success', shape: 'dot' };
  if (isScenario(state, PROCESSFLOW3D_TRIPPED)) return { label: 'Recompressor tripped', tone: 'critical', shape: 'diamond' };
  return { label: 'Custom line-up', tone: 'warning', shape: 'square' };
}

/** What each sink receives, in the order of the mass-balance readout. */
function processFlow3dBalance(closed: readonly string[]): { rows: { label: string; value: number }[]; held: number; imbalance: number } {
  const solution = solveNetwork(PROCESSFLOW3D_NETWORK, closed);
  const nodeLabel = (id: string) => PROCESSFLOW3D_NETWORK.nodes.find((node) => node.id === id)?.label ?? id;
  return {
    rows: [
      { label: 'Fed in', value: solution.supplied },
      ...['export', 'flare', 'tank', 'water'].map((id) => ({ label: nodeLabel(id), value: solution.delivered[id] ?? 0 })),
    ],
    held: solution.heldTotal,
    imbalance: solution.imbalance,
  };
}

function ProcessFlow3dFluidSwatch({ fluid }: { fluid: ProcessFlow3dFluid }) {
  return <span aria-hidden="true" className="size-2.5 shrink-0 rounded-full" style={{ background: PROCESSFLOW3D_FLUIDS[fluid].css }} />;
}

function ProcessFlow3dLegend({ orientation = 'horizontal' }: { orientation?: 'horizontal' | 'vertical' }) {
  return (
    <ul aria-label="Fluid legend" className={`flex text-xs text-medium-foreground ${orientation === 'horizontal' ? 'flex-wrap items-center gap-x-4 gap-y-1' : 'flex-col gap-2'}`}>
      {(Object.keys(PROCESSFLOW3D_FLUIDS) as ProcessFlow3dFluid[]).map((fluid) => (
        <li key={fluid} className="flex items-center gap-1.5 whitespace-nowrap">
          <ProcessFlow3dFluidSwatch fluid={fluid} />
          {PROCESSFLOW3D_FLUIDS[fluid].label}
        </li>
      ))}
      <li className="flex items-center gap-1.5 whitespace-nowrap">
        <span aria-hidden="true" className="size-2.5 shrink-0 rounded-full border border-emphasized" />
        No flow
      </li>
    </ul>
  );
}

function ProcessFlow3dValveList({ state, onToggle, onScenario }: { state: FlowScenarioState; onToggle: (valveId: string) => void; onScenario: (closed: readonly string[]) => void }) {
  return (
    <HudPanel title="Valves" meta={`${PROCESSFLOW3D_VALVES.filter((valve) => state.closed.includes(valve.id)).length} closed`} className="pointer-events-auto w-80 shrink-0 min-h-0">
      <ul className="flex flex-col gap-0.5">
        {PROCESSFLOW3D_VALVES.map((valve) => {
          const open = !state.closed.includes(valve.id);
          return (
            <li key={valve.id} className="flex items-center justify-between gap-2">
              <span className="flex min-w-0 flex-col">
                <span className="font-mono text-xs text-base-foreground">{valve.tag}</span>
                <span className="truncate text-xs text-muted-foreground">{valve.name}</span>
              </span>
              <span className="flex shrink-0 items-center gap-2">
                <span className={`w-12 text-right text-xs ${open ? 'text-muted-foreground' : 'font-medium text-warning-foreground-strong'}`}>{open ? 'Open' : 'Closed'}</span>
                <Switch aria-label={`${valve.tag} ${valve.name}, ${open ? 'open' : 'closed'}`} checked={open} onCheckedChange={() => onToggle(valve.id)} />
              </span>
            </li>
          );
        })}
      </ul>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => onScenario(PROCESSFLOW3D_TRIPPED)}>
          Trip recompressor
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onScenario(PROCESSFLOW3D_NORMAL)}>
          Reset
        </Button>
      </div>
    </HudPanel>
  );
}

function ProcessFlow3dBalance({ closed }: { closed: readonly string[] }) {
  const { rows, held, imbalance } = processFlow3dBalance(closed);
  return (
    <HudPanel title="Mass balance" meta={PROCESSFLOW3D_UNIT} className="pointer-events-auto w-80 shrink-0">
      <dl className="flex flex-col gap-1 text-sm">
        {rows.map((row, index) => (
          <div key={row.label} className={`flex items-baseline justify-between gap-3 ${index === 0 ? 'border-b border-default pb-1' : ''}`}>
            <dt className={index === 0 ? 'font-medium text-base-foreground' : 'text-muted-foreground'}>{row.label}</dt>
            <dd className="tabular-nums text-base-foreground">{formatValue(row.value, 1)}</dd>
          </div>
        ))}
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-muted-foreground">Held back at the source</dt>
          <dd className={`tabular-nums ${held > 0 ? TONE_VALUE_TEXT.warning : 'text-base-foreground'}`}>{formatValue(held, 1)}</dd>
        </div>
      </dl>
      <StatusIndicator
        tone={Math.abs(imbalance) < 0.05 ? 'success' : 'critical'}
        shape={Math.abs(imbalance) < 0.05 ? 'dot' : 'diamond'}
        label={Math.abs(imbalance) < 0.05 ? 'Balanced' : 'Out of balance'}
        detail={`${formatValue(imbalance, 1)} ${PROCESSFLOW3D_UNIT}`}
        size="sm"
      />
    </HudPanel>
  );
}

function ProcessFlow3dLineButton({ line, flow, selected, onSelect }: { line: ProcessFlow3dLine; flow: number; selected: boolean; onSelect: (id: string) => void }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => onSelect(line.id)}
      className={`-mx-1.5 flex w-[calc(100%+0.75rem)] items-center justify-between gap-2 rounded-md px-1.5 py-1 text-left hover:bg-secondary-background aria-pressed:bg-secondary-background ${PROCESSFLOW3D_FOCUS}`}
    >
      <span className="flex min-w-0 items-center gap-2">
        <ProcessFlow3dFluidSwatch fluid={line.fluid} />
        <span className="truncate text-sm text-base-foreground">{line.title}</span>
      </span>
      <span className={`shrink-0 text-xs tabular-nums ${flow > 0 ? 'text-medium-foreground' : 'text-warning-foreground-strong'}`}>{flow > 0 ? `${formatValue(flow, 1)} ${PROCESSFLOW3D_UNIT}` : 'No flow'}</span>
    </button>
  );
}

function ProcessFlow3dLineList({ flows, onSelect }: { flows: Readonly<Record<string, number>>; onSelect: (id: string) => void }) {
  return (
    <HudPanel title="Lines" meta={PROCESSFLOW3D_LINES.length} className="pointer-events-auto w-80 shrink-0 self-start max-h-full">
      <p className="text-xs text-muted-foreground">Click a line in the scene, or pick one here, to trace it.</p>
      <ul className="flex flex-col">
        {PROCESSFLOW3D_LINES.map((line) => (
          <li key={line.id}>
            <ProcessFlow3dLineButton line={line} flow={processFlow3dFlow(flows, line.id)} selected={false} onSelect={onSelect} />
          </li>
        ))}
      </ul>
    </HudPanel>
  );
}

function ProcessFlow3dPathList({ label, ids, onSelect }: { label: string; ids: readonly string[]; onSelect?: (id: string) => void }) {
  const lines = ids.flatMap((id) => {
    const line = processFlow3dLine(id);
    return line ? [line] : [];
  });
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {lines.length === 0 ? (
        <span className="text-sm text-muted-foreground">{label === 'Fed by' ? 'None: the stream starts here.' : 'None: the stream ends here.'}</span>
      ) : (
        <ul className="flex flex-wrap gap-1">
          {lines.map((line) => (
            <li key={line.id}>
              {onSelect ? (
                <button type="button" onClick={() => onSelect(line.id)} className={`flex items-center gap-1.5 rounded-md border border-default px-1.5 py-0.5 text-xs text-medium-foreground hover:border-emphasized ${PROCESSFLOW3D_FOCUS}`}>
                  <ProcessFlow3dFluidSwatch fluid={line.fluid} />
                  {line.title}
                </button>
              ) : (
                <span className="flex items-center gap-1.5 rounded-md border border-default px-1.5 py-0.5 text-xs text-medium-foreground">
                  <ProcessFlow3dFluidSwatch fluid={line.fluid} />
                  {line.title}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ProcessFlow3dStreamPanel({ line, closed, onClose, onSelect }: { line: ProcessFlow3dLine; closed: readonly string[]; onClose?: () => void; onSelect?: (id: string) => void }) {
  const solution = solveNetwork(PROCESSFLOW3D_NETWORK, closed);
  const flow = processFlow3dFlow(solution.flows, line.id);
  const trace = traceStream(PROCESSFLOW3D_NETWORK, line.id, solution.flows);
  const share = normalizeRate(flow, PROCESSFLOW3D_SUPPLY) * 100;
  const fluid = PROCESSFLOW3D_FLUIDS[line.fluid];
  return (
    <HudPanel
      title="Stream"
      actions={
        onClose ? (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <IconArrowLeft /> All lines
          </Button>
        ) : undefined
      }
      className="pointer-events-auto w-80 shrink-0 self-start max-h-full"
    >
      <div className="flex flex-col gap-1">
        <h4 className="text-base font-semibold text-base-foreground">{line.title}</h4>
        <span className="flex items-center gap-2 text-sm text-medium-foreground">
          <ProcessFlow3dFluidSwatch fluid={line.fluid} />
          {fluid.label}
        </span>
        {flow > 0 ? <StatusIndicator tone="neutral" shape="dot" label="Flowing" size="sm" /> : <StatusIndicator tone="warning" shape="square" label="No flow" detail="blocked upstream or closed" size="sm" />}
      </div>
      <dl className="grid grid-cols-3 gap-2">
        <div className="flex flex-col gap-0.5">
          <dt className="text-xs text-muted-foreground">Flow</dt>
          <dd>
            <ValueReadout value={flow} unit={PROCESSFLOW3D_UNIT} decimals={1} size="sm" tone={flow > 0 ? 'neutral' : 'warning'} />
          </dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-xs text-muted-foreground">Pressure</dt>
          <dd>
            <ValueReadout value={flow > 0 ? line.pressure : null} unit="barg" decimals={line.pressure < 10 ? 1 : 0} size="sm" />
          </dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-xs text-muted-foreground">Temperature</dt>
          <dd>
            <ValueReadout value={flow > 0 ? line.temperature : null} unit="°C" size="sm" />
          </dd>
        </div>
      </dl>
      <p className="text-xs tabular-nums text-muted-foreground">{formatValue(share, 0)} % of the well stream</p>
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-muted-foreground">Composition, mol %</span>
        <ul className="flex flex-col gap-1">
          {line.composition.map(([name, percent]) => (
            <li key={name} className="flex items-center gap-2 text-xs">
              <span className="w-32 shrink-0 truncate text-medium-foreground">{name}</span>
              <span aria-hidden="true" className="h-1.5 min-w-0 flex-1 rounded-full bg-secondary-background">
                <span className="block h-full rounded-full" style={{ width: `${percent}%`, background: fluid.css }} />
              </span>
              <span className="w-8 shrink-0 text-right tabular-nums text-base-foreground">{percent}</span>
            </li>
          ))}
        </ul>
      </div>
      <ProcessFlow3dPathList label="Fed by" ids={trace.upstream} onSelect={onSelect} />
      <ProcessFlow3dPathList label="Flows on to" ids={trace.downstream} onSelect={onSelect} />
    </HudPanel>
  );
}

function ProcessFlow3dFallbackList() {
  return (
    <ul className="flex flex-col gap-2 rounded-lg border border-default bg-card-background p-3">
      {PROCESSFLOW3D_LINES.slice(0, 6).map((line) => (
        <li key={line.id} className="flex items-center gap-2 text-sm text-base-foreground">
          <ProcessFlow3dFluidSwatch fluid={line.fluid} />
          {line.title}
        </li>
      ))}
    </ul>
  );
}

function ProcessFlow3dExperience({ initialClosed = PROCESSFLOW3D_NORMAL, initialSelected = null, still = false }: { initialClosed?: readonly string[]; initialSelected?: string | null; still?: boolean }) {
  // Archetype: flow tracing and what-if. The pipes are the subject; equipment is ghosted.
  // Interaction: click a line to trace what feeds it and where it goes; flip valves (or trip the
  //   recompressor) and the flow re-splits by conductance with the mass balance staying whole.
  const [state, dispatch] = useReducer(flowScenarioReducer, undefined, () => initialFlowScenario(initialClosed, initialSelected));
  const rootRef = useRef<HTMLDivElement>(null);
  const fluidColors = useTokenColors(PROCESSFLOW3D_FLUID_TOKENS, rootRef);
  const solution = useMemo(() => solveNetwork(PROCESSFLOW3D_NETWORK, state.closed), [state.closed]);
  const trace = useMemo(() => (state.selectedId ? traceStream(PROCESSFLOW3D_NETWORK, state.selectedId, solution.flows) : null), [state.selectedId, solution]);
  const selected = state.selectedId ? processFlow3dLine(state.selectedId) : undefined;
  const scenario = processFlow3dScenarioLabel(state);

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

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape' && state.selectedId) {
      event.preventDefault();
      dispatch({ type: 'clear' });
    }
  };

  return (
    <div
      ref={rootRef}
      tabIndex={-1}
      onKeyDown={onKeyDown}
      onPointerDownCapture={(event) => {
        if (event.target instanceof HTMLCanvasElement) event.currentTarget.focus({ preventScroll: true });
      }}
      data-scenario={isScenario(state, PROCESSFLOW3D_TRIPPED) ? 'tripped' : isScenario(state, PROCESSFLOW3D_NORMAL) ? 'normal' : 'custom'}
      className="relative h-[46rem] w-full overflow-hidden rounded-xl border border-default bg-base-background outline-none"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,color-mix(in_oklab,var(--primary-background)_14%,transparent),transparent_65%)]"
      />
      <SceneCanvas
        label={`3D view of the Nordkapp compression area with its pipes as moving particle streams, ${scenario.label.toLowerCase()}${selected ? `, tracing ${selected.title}` : ''}`}
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
            insets={{ top: 56, bottom: 64, left: 340, right: 364 }}
            onSelectLine={(lineId) => dispatch({ type: 'select', lineId })}
            time={still ? 2 : undefined}
          />
        </StillScene>
      </SceneCanvas>

      <div className="pointer-events-none absolute inset-3 z-30 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className={`pointer-events-auto flex flex-col rounded-lg px-3 py-1.5 ${PROCESSFLOW3D_GLASS}`}>
            <span className="text-sm font-semibold text-base-foreground">Nordkapp compression: process flow</span>
            <span className="text-xs text-muted-foreground">Particle speed and density follow the flow in each line</span>
          </div>
          <div className={`pointer-events-auto rounded-lg px-3 py-2 ${PROCESSFLOW3D_GLASS}`}>
            <StatusIndicator tone={scenario.tone} shape={scenario.shape} label={scenario.label} size="sm" />
          </div>
        </div>

        <div className="flex min-h-0 flex-1 justify-between gap-3">
          <div className="pointer-events-none flex min-h-0 flex-col gap-3 self-start max-h-full">
            <ProcessFlow3dValveList
              state={state}
              onToggle={(valveId) => dispatch({ type: 'toggleValve', valveId })}
              onScenario={(closed) => dispatch({ type: 'setValves', closed })}
            />
            <ProcessFlow3dBalance closed={state.closed} />
          </div>
          {selected ? (
            <ProcessFlow3dStreamPanel key={selected.id} line={selected} closed={state.closed} onClose={() => dispatch({ type: 'clear' })} onSelect={(lineId) => dispatch({ type: 'select', lineId })} />
          ) : (
            <ProcessFlow3dLineList flows={solution.flows} onSelect={(lineId) => dispatch({ type: 'select', lineId })} />
          )}
        </div>

        <div className={`pointer-events-auto flex items-center justify-between gap-4 rounded-xl px-3 py-2 ${PROCESSFLOW3D_GLASS}`}>
          <ProcessFlow3dLegend />
          <span className="hidden text-xs text-muted-foreground md:block">Chevrons replace particles under reduced motion</span>
        </div>
      </div>
    </div>
  );
}

function ProcessFlow3dTron() {
  return (
    <ThemeScope preset="tron" className="w-full">
      <ProcessFlow3dExperience />
    </ThemeScope>
  );
}

function ProcessFlow3dNordicNight() {
  return (
    <ThemeScope preset="nordic-night" className="w-full">
      <ProcessFlow3dExperience initialClosed={PROCESSFLOW3D_TRIPPED} initialSelected="e-flare" still />
    </ThemeScope>
  );
}

function ProcessFlow3dAuraDark() {
  return (
    <ThemeScope preset="aura-dark" className="w-full">
      <ProcessFlow3dExperience initialSelected="e-export" still />
    </ThemeScope>
  );
}

function ProcessFlow3dTronScope({ children }: { children: (colors: Record<ProcessFlow3dFluid, string> | null) => ReactNode }) {
  // Colours cannot cross into the canvas, so they are resolved here, inside the theme, and passed in as strings.
  const ref = useRef<HTMLDivElement>(null);
  const colors = useTokenColors(PROCESSFLOW3D_FLUID_TOKENS, ref);
  return (
    <ThemeScope preset="tron" className="w-full">
      <div ref={ref} className="w-full">
        {children(colors ? { gas: colors.gas.color, condensate: colors.condensate.color, water: colors.water.color, flare: colors.flare.color } : null)}
      </div>
    </ThemeScope>
  );
}

function ProcessFlow3dPartRates() {
  const rates = [0.12, 0.45, 1] as const;
  return (
    <ProcessFlow3dTronScope>
      {(colors) => (
        <div className="flex w-full flex-col gap-2 rounded-xl border border-default bg-base-background p-3">
          <div className="h-60 w-full">
            <SceneCanvas label="Three lines with particle streams at low, medium and full flow">
              <StillScene>
                <TurntableStage subjectSize={[34, 4, 12]} view="isometric" padding={1}>
                  {colors
                    ? rates.map((rate, index) => (
                        <FlowLine key={rate} id={`rate-${rate}`} route={[[-15, 1, (index - 1) * 4], [15, 1, (index - 1) * 4]]} color={colors.gas} rate={rate} time={3} />
                      ))
                    : null}
                </TurntableStage>
              </StillScene>
            </SceneCanvas>
          </div>
          <p className="text-xs text-muted-foreground">Low, medium and full flow: faster and denser as the rate rises.</p>
        </div>
      )}
    </ProcessFlow3dTronScope>
  );
}

function ProcessFlow3dPartValve() {
  const [open, toggle] = useReducer((value: boolean) => !value, true);
  return (
    <ProcessFlow3dTronScope>
      {(colors) => (
        <div className="flex w-full flex-col gap-3 rounded-xl border border-default bg-base-background p-3">
          <div className="h-60 w-full">
            <SceneCanvas label={`A line with a valve ${open ? 'open' : 'closed'}`}>
              <StillScene>
                <TurntableStage subjectSize={[16, 3, 6]} view="isometric" padding={0.9}>
                  {colors ? <FlowLine id="a" route={[[-7, 1.4, 0], [7, 1.4, 0]]} color={colors.gas} rate={open ? 0.7 : 0} time={3} /> : null}
                  <FlowValveMarker position={[0, 1.4, 0]} direction={[1, 0, 0]} open={open} />
                </TurntableStage>
              </StillScene>
            </SceneCanvas>
          </div>
          <Switch label={open ? 'Valve open' : 'Valve closed'} checked={open} onCheckedChange={() => toggle()} />
        </div>
      )}
    </ProcessFlow3dTronScope>
  );
}

function ProcessFlow3dPartChevrons() {
  return (
    <ProcessFlow3dTronScope>
      {(colors) => (
        <div className="h-64 w-full overflow-hidden rounded-xl border border-default bg-base-background">
          <SceneCanvas label="A line with still direction chevrons, as shown under reduced motion">
            <StillScene>
              <TurntableStage subjectSize={[34, 4, 8]} view="isometric" padding={1}>
                {colors ? <FlowLine id="c" route={[[-15, 1.4, 0], [15, 1.4, 0]]} color={colors.condensate} rate={0.6} /> : null}
              </TurntableStage>
            </StillScene>
          </SceneCanvas>
        </div>
      )}
    </ProcessFlow3dTronScope>
  );
}

function ProcessFlow3dPartLegend() {
  return (
    <ThemeScope preset="tron" className="w-full">
      <div className="flex w-full justify-center rounded-xl border border-default bg-base-background p-4">
        <ProcessFlow3dLegend orientation="vertical" />
      </div>
    </ThemeScope>
  );
}

function ProcessFlow3dPartBalance() {
  return (
    <ThemeScope preset="tron" className="w-full">
      <div className="flex w-full flex-col gap-4 rounded-xl border border-default bg-base-background p-4 md:flex-row">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <span className="text-xs text-muted-foreground">Normal line-up</span>
          <ProcessFlow3dBalance closed={PROCESSFLOW3D_NORMAL} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <span className="text-xs text-muted-foreground">Recompressor tripped</span>
          <ProcessFlow3dBalance closed={PROCESSFLOW3D_TRIPPED} />
        </div>
      </div>
    </ThemeScope>
  );
}

function ProcessFlow3dPartValves() {
  const [state, dispatch] = useReducer(flowScenarioReducer, undefined, () => initialFlowScenario(PROCESSFLOW3D_NORMAL));
  return (
    <ThemeScope preset="tron" className="w-full">
      <div className="flex w-full justify-center gap-4 rounded-xl border border-default bg-base-background p-4">
        <ProcessFlow3dValveList state={state} onToggle={(valveId) => dispatch({ type: 'toggleValve', valveId })} onScenario={(closed) => dispatch({ type: 'setValves', closed })} />
      </div>
    </ThemeScope>
  );
}

function ProcessFlow3dPartStream() {
  const line = processFlow3dLine('e-s-k2');
  if (!line) return null;
  return (
    <ThemeScope preset="tron" className="w-full">
      <div className="flex w-full justify-center rounded-xl border border-default bg-base-background p-4">
        <ProcessFlow3dStreamPanel line={line} closed={PROCESSFLOW3D_NORMAL} />
      </div>
    </ThemeScope>
  );
}

export default definePage({
  id: 'process-flow-3d',
  title: 'Process flow in 3D',
  summary:
    'The Nordkapp compression area with its pipes as the subject: equipment ghosted, every line a stream of particles moving at a speed and density that follow its flow. Click a line to trace it; close a valve or trip the recompressor and watch the flow re-split.',
  guidance: {
    use: [
      'When the question is where the flow goes: which line feeds this machine, what happens downstream if a valve closes.',
      'For what-if work: the model is small and pure, so every valve change has a result you can read in the balance.',
      'With a mass balance beside the scene: a stream that vanishes should show up as held back, never as a gap.',
      'With a legend for fluid colours and a list of the same lines for keyboard and screen reader users.',
    ],
    avoid: [
      'Using it as a simulator: it splits flow by conductance, it does not solve pressures.',
      'Hundreds of particles per line: density is capped, and speed carries the rest of the rate.',
      'Colour alone for blocked lines: a dark, empty tube, a closed-valve shape and the words No flow say it too.',
      'Motion under reduced motion: particles give way to still chevrons.',
    ],
  },
  source,
  sections: [
    {
      id: 'experience',
      title: 'Experience',
      description:
        'Drag to orbit, scroll to zoom. Click any line, or pick it in the list, to see its flow, pressure, temperature and composition and to light the path upstream and downstream. Flip valves on the left, or press Trip recompressor, and the flows re-split. Escape lets go of the selected line.',
      specimens: [
        {
          id: 'ProcessFlow3dTron',
          title: 'Process flow',
          note: 'Pick it when people need to see where the flow goes and what changes when a valve moves.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'three/SceneCanvas.tsx',
            'three/plants/FlowPlantScene.tsx',
            'three/plants/FlowLine.tsx',
            'three/plants/FlowParticles.tsx',
            'three/plants/FlowValveMarker.tsx',
            'three/plants/particlePositions.ts',
            'three/plants/flowNetwork.ts',
            'three/plants/flowScenarioState.ts',
            'three/HudPanel.tsx',
            'industrial/ValueReadout.tsx',
            'industrial/StatusIndicator.tsx',
            'themes/ThemeScope.tsx',
          ],
          Component: ProcessFlow3dTron,
        },
      ],
    },
    {
      id: 'themes',
      title: 'In other themes',
      description: 'The same screen in two more presets, one with the recompressor tripped and the flare line traced. Streams are frozen at one moment.',
      specimens: [
        {
          id: 'ProcessFlow3dNordicNight',
          title: 'Nordic night, recompressor tripped',
          note: 'Pick it for a control-room wall that must stay calm: muted blues and a single accent.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['three/plants/FlowPlantScene.tsx', 'three/plants/flowNetwork.ts', 'three/scenes/StillScene.tsx', 'themes/ThemeScope.tsx'],
          Component: ProcessFlow3dNordicNight,
        },
        {
          id: 'ProcessFlow3dAuraDark',
          title: 'Aura dark, export line traced',
          note: 'Pick it inside a standard dark Aura app, where the scene must not out-shout the product.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['three/plants/FlowPlantScene.tsx', 'three/plants/flowNetwork.ts', 'three/scenes/StillScene.tsx', 'themes/ThemeScope.tsx'],
          Component: ProcessFlow3dAuraDark,
        },
      ],
    },
    {
      id: 'parts',
      title: 'Parts',
      description: 'The pieces on their own: how flow shows as particles, the valve, and the panels that explain and control it.',
      specimens: [
        {
          id: 'ProcessFlow3dPartRates',
          title: 'Particles by flow rate',
          note: 'Pick it to show flow as motion: the same line at three rates, differing in speed and in density.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['three/plants/FlowLine.tsx', 'three/plants/FlowParticles.tsx', 'three/plants/particlePositions.ts', 'three/TurntableStage.tsx'],
          Component: ProcessFlow3dPartRates,
        },
        {
          id: 'ProcessFlow3dPartValve',
          title: 'Valve marker',
          note: 'Pick it for any switchable line: open it is a bow tie, closed it gains a plate and the line goes dark.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['three/plants/FlowValveMarker.tsx', 'three/plants/FlowLine.tsx', 'three/TurntableStage.tsx'],
          Component: ProcessFlow3dPartValve,
        },
        {
          id: 'ProcessFlow3dPartChevrons',
          title: 'Still chevrons',
          note: 'Pick it as the reduced-motion form: arrows that say which way the line flows without moving.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['three/plants/FlowParticles.tsx', 'three/scenes/StillScene.tsx'],
          Component: ProcessFlow3dPartChevrons,
        },
        {
          id: 'ProcessFlow3dPartLegend',
          title: 'Fluid legend',
          note: 'Pick it whenever particle colour means a fluid: three tokens and a mark for a dead line.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['three/plants/FlowParticles.tsx'],
          Component: ProcessFlow3dPartLegend,
        },
        {
          id: 'ProcessFlow3dPartBalance',
          title: 'Mass balance',
          note: 'Pick it beside any what-if model: supply against what each outlet receives, and what is held back.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['three/plants/flowNetwork.ts', 'three/HudPanel.tsx', 'industrial/StatusIndicator.tsx'],
          Component: ProcessFlow3dPartBalance,
        },
        {
          id: 'ProcessFlow3dPartValves',
          title: 'Valve list and scenarios',
          note: 'Pick it to let people change the line-up: a switch per valve, a scenario button and a reset.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['three/plants/flowScenarioState.ts', 'three/HudPanel.tsx'],
          Component: ProcessFlow3dPartValves,
        },
        {
          id: 'ProcessFlow3dPartStream',
          title: 'Stream panel',
          note: 'Pick it for the detail side of a traced line: flow, state, composition and the path around it.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['three/plants/flowNetwork.ts', 'three/HudPanel.tsx', 'industrial/ValueReadout.tsx'],
          Component: ProcessFlow3dPartStream,
        },
      ],
    },
  ],
});
