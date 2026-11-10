import { IconCheck, IconX } from '@cognite/aura/icons';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { Breaker } from '../../../library/industrial/diagrams/Breaker';
import { DiagramCanvas } from '../../../library/industrial/diagrams/DiagramCanvas';
import { EquipmentSymbol } from '../../../library/industrial/diagrams/EquipmentSymbol';
import { InstrumentBubble } from '../../../library/industrial/diagrams/InstrumentBubble';
import { PipeLine } from '../../../library/industrial/diagrams/PipeLine';
import { SYMBOLS, SYMBOL_GRID, symbolPort, symbolsIn } from '../../../library/industrial/diagrams/symbolPaths';
import type { SymbolCategory, SymbolKind, SymbolPort } from '../../../library/industrial/diagrams/symbolPaths';
import { breakerStatus, runStateAppearance, valvePositionStatus } from '../../../library/industrial/diagrams/symbolState';
import type { ValvePosition } from '../../../library/industrial/diagrams/symbolState';
import { ValueTag } from '../../../library/industrial/diagrams/ValueTag';
import { ValveSymbol } from '../../../library/industrial/diagrams/ValveSymbol';
import { healthStatus, runStateStatus, toneFromLimits } from '../../../library/industrial/status';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { ValueReadout } from '../../../library/industrial/ValueReadout';
import { ASSETS, SENSORS } from '../../data/plant';
import type { Asset, RunState, Sensor } from '../../data/plant';
import { definePage } from '../../types';

import source from './equipment-symbols.tsx?raw';

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

const RUN_STATES: readonly RunState[] = ['running', 'standby', 'stopped', 'tripped', 'maintenance'];
const VALVE_POSITIONS: readonly ValvePosition[] = ['open', 'closed', 'travelling', 'failed'];

/** The symbol each plant asset type is drawn with. */
const KIND_OF: Record<Asset['type'], SymbolKind> = {
  site: 'storage-tank',
  area: 'storage-tank',
  system: 'storage-tank',
  compressor: 'compressor',
  pump: 'centrifugal-pump',
  separator: 'horizontal-separator',
  exchanger: 'heat-exchanger',
  valve: 'shutdown-valve',
  turbine: 'gas-turbine',
};

/** Equipment only: the leaves of the asset hierarchy. */
const EQUIPMENT = ASSETS.filter((asset) => !['site', 'area', 'system'].includes(asset.type));

const PROCESS_GROUPS: readonly { title: string; categories: readonly SymbolCategory[] }[] = [
  { title: 'Rotating', categories: ['rotating'] },
  { title: 'Static', categories: ['static'] },
  { title: 'Valves, instruments and piping', categories: ['valve', 'instrument', 'piping'] },
];

const COMPRESSOR = findAssetById('23-ka-9101');
const RECOMPRESSOR = findAssetById('23-ka-9103');
const EXPORT_PUMP_A = findAssetById('27-pa-2001a');
const EXPORT_PUMP_B = findAssetById('27-pa-2001b');
const COOLING_PUMP = findAssetById('40-pa-4001');
const SEPARATOR = findAssetById('20-va-1001');
const COOLER = findAssetById('23-ha-9114');
const DISCHARGE_PRESSURE = findSensor('pt-92531');
const DISCHARGE_TEMPERATURE = findSensor('tt-92532');
const SHAFT_SPEED = findSensor('st-92501');
const EXPORT_FLOW = findSensor('ft-20011');
const SEPARATOR_LEVEL = findSensor('lt-10012');

const TH = 'px-3 py-2 text-left text-xs font-medium text-muted-foreground';
const TD = 'px-3 py-2 align-middle';

/** A symbol with its caption underneath, the unit every specimen on this page is built from. */
function EquipFigure({ caption, detail, children }: { caption: string; detail?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-2 text-center">
      {children}
      <div className="flex flex-col items-center gap-1">
        <span className="text-xs text-muted-foreground">{caption}</span>
        {detail}
      </div>
    </div>
  );
}

/** A symbol drawn from an asset, with the state shown by fill and tone. */
function EquipAssetSymbol({ asset, size = 'lg' }: { asset: Asset; size?: 'sm' | 'md' | 'lg' }) {
  return <EquipmentSymbol kind={KIND_OF[asset.type]} size={size} label={`${asset.tag} ${asset.name}, ${asset.state}`} {...runStateAppearance(asset.state)} />;
}

function EquipSymbolFullSet() {
  return (
    <div className="flex w-full flex-col gap-6">
      {PROCESS_GROUPS.map((group) => (
        <div key={group.title} className="grid grid-cols-1 gap-3 sm:grid-cols-[6rem_1fr]">
          <h4 className="pt-1 text-xs font-medium text-muted-foreground">{group.title}</h4>
          <div className="grid grid-cols-3 gap-x-4 gap-y-6 sm:grid-cols-4 lg:grid-cols-8">
            {group.categories.flatMap(symbolsIn).map((kind) => (
              <EquipFigure key={kind} caption={SYMBOLS[kind].label}>
                <EquipmentSymbol kind={kind} size="lg" />
              </EquipFigure>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function EquipSymbolSingle() {
  return (
    <EquipFigure caption="Centrifugal pump">
      <EquipmentSymbol kind="centrifugal-pump" size="lg" />
    </EquipFigure>
  );
}

function EquipSymbolSizes() {
  return (
    <div className="flex items-end gap-8">
      <EquipFigure caption="24">
        <EquipmentSymbol kind="compressor" size="sm" />
      </EquipFigure>
      <EquipFigure caption="32">
        <EquipmentSymbol kind="compressor" size="md" />
      </EquipFigure>
      <EquipFigure caption="48">
        <EquipmentSymbol kind="compressor" size="lg" />
      </EquipFigure>
    </div>
  );
}

function EquipSymbolInstrumentMounting() {
  return (
    <div className="flex items-start gap-8">
      <EquipFigure caption="Field mounted">
        <InstrumentBubble letters="PT" loop="92531" size="lg" />
      </EquipFigure>
      <EquipFigure caption="Control room">
        <InstrumentBubble letters="PIC" loop="92531" mounting="panel" size="lg" />
      </EquipFigure>
    </div>
  );
}

function EquipSymbolInstrumentBubbles() {
  const instruments = [
    { letters: 'PT', loop: '92531', caption: 'Pressure' },
    { letters: 'TT', loop: '92532', caption: 'Temperature' },
    { letters: 'FT', loop: '92510', caption: 'Flow' },
    { letters: 'LT', loop: '10012', caption: 'Level' },
  ];
  return (
    <div className="flex flex-wrap items-start justify-center gap-8">
      {instruments.map((instrument) => (
        <EquipFigure key={instrument.letters} caption={instrument.caption}>
          <InstrumentBubble letters={instrument.letters} loop={instrument.loop} size="lg" />
        </EquipFigure>
      ))}
    </div>
  );
}

function EquipSymbolPipeSegments() {
  const lines = [
    { y: 16, name: 'Main process line', weight: 'heavy', dashed: false, flow: true },
    { y: 48, name: 'Secondary line', weight: 'normal', dashed: false, flow: true },
    { y: 80, name: 'Utility line', weight: 'light', dashed: false, flow: true },
    { y: 112, name: 'No flow', weight: 'normal', dashed: true, flow: false },
    { y: 144, name: 'Instrument signal', weight: 'light', dashed: true, flow: false },
  ] as const;
  return (
    <DiagramCanvas label="Pipe segments: main, secondary and utility lines with flow arrows, a line with no flow and an instrument signal" width={360} height={160}>
      {lines.map((line) => (
        <g key={line.name}>
          <PipeLine points={[{ x: 8, y: line.y }, { x: 200, y: line.y }]} weight={line.weight} dashed={line.dashed} flow={line.flow ? 'forward' : undefined} arrows={2} />
          <text x={216} y={line.y + 4} fontSize={12} className="fill-muted-foreground">
            {line.name}
          </text>
        </g>
      ))}
    </DiagramCanvas>
  );
}

function EquipSymbolGrid() {
  const size = 216;
  const step = size / SYMBOL_GRID;
  const ticks = Array.from({ length: SYMBOL_GRID + 1 }, (_, index) => index * step);
  const ports: readonly SymbolPort[] = ['in', 'out', 'top', 'bottom'];
  return (
    <div className="flex flex-wrap items-center justify-center gap-6">
      <DiagramCanvas label="Heat exchanger symbol on its 24 unit construction grid, with the 2 unit margin and four connection ports marked" width={size} height={size}>
        {ticks.map((tick) => (
          <path key={tick} d={`M ${tick} 0 V ${size} M 0 ${tick} H ${size}`} strokeWidth={1} className="stroke-chart-gridlines" />
        ))}
        <rect x={step * 2} y={step * 2} width={step * 20} height={step * 20} strokeWidth={1} strokeDasharray="4 3" className="stroke-muted-foreground" />
        <EquipmentSymbol kind="heat-exchanger" size={size} cx={size / 2} cy={size / 2} className="text-base-foreground" />
        {ports.map((port) => {
          const point = symbolPort('heat-exchanger', port, size / 2, size / 2, size);
          return <rect key={port} x={point.x - 3.5} y={point.y - 3.5} width={7} height={7} className="fill-base-foreground" />;
        })}
      </DiagramCanvas>
      <ul className="flex flex-col gap-2 text-xs text-muted-foreground">
        <li>24 × 24 unit grid</li>
        <li>2 unit margin, dashed</li>
        <li>1.5 px stroke at every size</li>
        <li>Ports on the centre lines</li>
      </ul>
    </div>
  );
}

function EquipSymbolElectrical() {
  return (
    <div className="grid w-full grid-cols-3 gap-x-4 gap-y-6 sm:grid-cols-5">
      {symbolsIn('electrical').map((kind) => (
        <EquipFigure key={kind} caption={SYMBOLS[kind].label}>
          <EquipmentSymbol kind={kind} size="lg" />
        </EquipFigure>
      ))}
      <EquipFigure caption="Breaker">
        <Breaker state="closed" size="lg" />
      </EquipFigure>
      <EquipFigure caption="Generator">
        <EquipmentSymbol kind="generator" size="lg" />
      </EquipFigure>
    </div>
  );
}

function EquipSymbolRunStates() {
  return (
    <div className="grid w-full grid-cols-3 gap-x-4 gap-y-6 sm:grid-cols-5">
      {RUN_STATES.map((state) => (
        <div key={state} className="flex flex-col items-center gap-3">
          <EquipmentSymbol kind="compressor" size="lg" label={`Compressor, ${state}`} {...runStateAppearance(state)} />
          <StatusIndicator size="sm" {...runStateStatus(state)} />
        </div>
      ))}
    </div>
  );
}

function EquipSymbolStateInUse() {
  return (
    <div className="flex items-center gap-4">
      <EquipAssetSymbol asset={RECOMPRESSOR} />
      <div className="flex flex-col gap-1">
        <span className="font-mono text-xs text-muted-foreground">{RECOMPRESSOR.tag}</span>
        <span className="text-sm font-medium text-base-foreground">{RECOMPRESSOR.name}</span>
        <StatusIndicator size="sm" {...runStateStatus(RECOMPRESSOR.state)} detail="14 min ago" />
      </div>
    </div>
  );
}

function EquipSymbolValvePositions() {
  const types = [
    { type: 'gate', name: 'Gate' },
    { type: 'control', name: 'Control' },
    { type: 'shutdown', name: 'Shutdown' },
  ] as const;
  return (
    <table className="border-collapse text-sm">
      <thead>
        <tr>
          <th scope="col" className="sr-only">
            Valve type
          </th>
          {VALVE_POSITIONS.map((position) => (
            <th key={position} scope="col" className="px-3 pb-3 font-normal">
              <StatusIndicator size="sm" {...valvePositionStatus(position)} />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {types.map((row) => (
          <tr key={row.type}>
            <th scope="row" className="pr-3 text-left text-xs font-normal text-muted-foreground">
              {row.name}
            </th>
            {VALVE_POSITIONS.map((position) => (
              <td key={position} className="px-3 py-2">
                <ValveSymbol type={row.type} position={position} size="lg" className="mx-auto" />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function EquipSymbolRotatingRun() {
  const machines = [
    { kind: 'compressor', name: '1st stage compressor', state: 'running', speed: SHAFT_SPEED.value },
    { kind: 'centrifugal-pump', name: 'Export pump A', state: 'running', speed: 2960 },
    { kind: 'fan', name: 'Cooler fan', state: 'running', speed: 740 },
    { kind: 'centrifugal-pump', name: 'Export pump B', state: 'standby', speed: 0 },
  ] as const;
  return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-5">
      {machines.map((machine) => (
        <div key={machine.name} className="flex items-center gap-3">
          <EquipmentSymbol kind={machine.kind} size="lg" label={`${machine.name}, ${machine.state}`} {...runStateAppearance(machine.state)} />
          <div className="flex min-w-0 flex-col gap-1">
            <span className="truncate text-xs text-muted-foreground">{machine.name}</span>
            <ValueReadout size="xs" value={machine.speed} unit="rpm" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EquipSymbolWithTag() {
  return (
    <EquipFigure caption={EXPORT_PUMP_A.name} detail={<span className="font-mono text-xs text-base-foreground">{EXPORT_PUMP_A.tag}</span>}>
      <EquipAssetSymbol asset={EXPORT_PUMP_A} />
    </EquipFigure>
  );
}

function EquipSymbolWithValue() {
  return (
    <div className="flex items-center gap-4">
      <EquipAssetSymbol asset={EXPORT_PUMP_A} />
      <div className="flex flex-col gap-1.5">
        <span className="font-mono text-xs text-muted-foreground">{EXPORT_PUMP_A.tag}</span>
        <ValueReadout size="sm" value={EXPORT_FLOW.value} unit={EXPORT_FLOW.unit} />
        <span className="text-xs text-muted-foreground">{EXPORT_FLOW.name}</span>
      </div>
    </div>
  );
}

function EquipSymbolWithStatusBadge() {
  return (
    <div className="flex flex-col items-center gap-3">
      <EquipAssetSymbol asset={COOLING_PUMP} />
      <span className="font-mono text-xs text-base-foreground">{COOLING_PUMP.tag}</span>
      <StatusIndicator variant="badge" {...runStateStatus(COOLING_PUMP.state)} />
    </div>
  );
}

function EquipSymbolLabelPlacement() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-10">
      <EquipFigure caption="Label below, in a diagram" detail={<span className="font-mono text-xs text-base-foreground">{SEPARATOR.tag}</span>}>
        <EquipAssetSymbol asset={SEPARATOR} />
      </EquipFigure>
      <div className="flex items-center gap-3">
        <EquipAssetSymbol asset={SEPARATOR} size="md" />
        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-xs text-base-foreground">{SEPARATOR.tag}</span>
          <span className="text-xs text-muted-foreground">Label beside, in a list</span>
        </div>
      </div>
    </div>
  );
}

function EquipSymbolAbnormalValue() {
  const value = 146.3;
  const tone = toneFromLimits(value, { high: DISCHARGE_TEMPERATURE.highLimit, highHigh: DISCHARGE_TEMPERATURE.highHighLimit });
  return (
    <div className="flex items-center gap-4">
      <EquipAssetSymbol asset={COMPRESSOR} />
      <div className="flex flex-col gap-1.5">
        <span className="font-mono text-xs text-muted-foreground">{DISCHARGE_TEMPERATURE.tag}</span>
        <span className="flex items-baseline gap-2">
          <ValueReadout size="sm" value={value} unit={DISCHARGE_TEMPERATURE.unit} decimals={1} tone={tone} />
          <span className="text-xs font-semibold text-warning-foreground-strong">H</span>
        </span>
        <span className="text-xs text-muted-foreground">Limit {DISCHARGE_TEMPERATURE.highLimit} °C</span>
      </div>
    </div>
  );
}

function EquipSymbolSelectable() {
  const assets = [SEPARATOR, COMPRESSOR, COOLER, EXPORT_PUMP_A];
  const [selectedId, setSelectedId] = useState(COMPRESSOR.id);
  const selected = findAssetById(selectedId);
  return (
    <div className="flex w-full max-w-md flex-col items-center gap-4">
      <div role="group" aria-label="Select equipment" className="flex flex-wrap justify-center gap-2">
        {assets.map((asset) => (
          <button
            key={asset.id}
            type="button"
            aria-pressed={asset.id === selectedId}
            onClick={() => setSelectedId(asset.id)}
            className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border px-3 py-2.5 outline-none transition-colors focus-visible:shadow-focus-ring ${
              asset.id === selectedId ? 'border-emphasized bg-muted-background' : 'border-transparent hover:bg-muted-background'
            }`}
          >
            <EquipAssetSymbol asset={asset} />
            <span className="font-mono text-xs text-base-foreground">{asset.tag}</span>
          </button>
        ))}
      </div>
      <p aria-live="polite" className="text-xs text-muted-foreground">
        {selected.name} selected · hover or focus another symbol to preview it
      </p>
    </div>
  );
}

function EquipSymbolInDiagram() {
  const cx = 150;
  const cy = 92;
  const size = 56;
  const inlet = symbolPort('compressor', 'in', cx, cy, size);
  const outlet = symbolPort('compressor', 'out', cx, cy, size);
  return (
    <DiagramCanvas
      label={`${COMPRESSOR.tag} ${COMPRESSOR.name} with suction and discharge lines, a pressure transmitter and a discharge pressure of ${DISCHARGE_PRESSURE.value} barg`}
      width={400}
      height={170}
    >
      <PipeLine points={[{ x: 16, y: inlet.y }, inlet]} weight="heavy" flow="forward" />
      <PipeLine points={[outlet, { x: 384, y: outlet.y }]} weight="heavy" flow="forward" arrows={2} />
      <EquipmentSymbol kind="compressor" size={size} cx={cx} cy={cy} label={`${COMPRESSOR.tag}, running`} {...runStateAppearance(COMPRESSOR.state)} />
      <text x={cx} y={cy + 46} fontSize={10} textAnchor="middle" className="fill-base-foreground font-mono">
        {COMPRESSOR.tag}
      </text>
      <text x={cx} y={cy + 60} fontSize={10} textAnchor="middle" className="fill-muted-foreground">
        {COMPRESSOR.name}
      </text>
      <PipeLine points={[{ x: 268, y: outlet.y }, { x: 268, y: 50 }]} weight="light" dashed />
      <InstrumentBubble letters="PT" loop="92531" size={32} cx={268} cy={34} />
      <ValueTag x={292} y={24} value={DISCHARGE_PRESSURE.value} unit={DISCHARGE_PRESSURE.unit} decimals={1} />
    </DiagramCanvas>
  );
}

function EquipSymbolOnDark() {
  const assets = [SEPARATOR, COMPRESSOR, RECOMPRESSOR, COOLER, EXPORT_PUMP_A, EXPORT_PUMP_B];
  return (
    <div className="dark w-full rounded-lg bg-base-background p-6">
      <div className="grid grid-cols-3 gap-x-4 gap-y-6 sm:grid-cols-6">
        {assets.map((asset) => (
          <div key={asset.id} className="flex flex-col items-center gap-2">
            <EquipAssetSymbol asset={asset} />
            <span className="font-mono text-xs text-base-foreground">{asset.tag}</span>
            <StatusIndicator size="sm" {...runStateStatus(asset.state)} />
          </div>
        ))}
      </div>
    </div>
  );
}

function EquipSymbolLegend() {
  return (
    <div className="grid w-full max-w-md grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
      {RUN_STATES.map((state) => (
        <div key={state} className="flex items-center gap-3">
          <EquipmentSymbol kind="centrifugal-pump" size="sm" label={`Pump, ${state}`} {...runStateAppearance(state)} />
          <span className="text-xs text-base-foreground">{runStateStatus(state).label}</span>
        </div>
      ))}
      {VALVE_POSITIONS.map((position) => (
        <div key={position} className="flex items-center gap-3">
          <ValveSymbol position={position} size="sm" />
          <span className="text-xs text-base-foreground">Valve {valvePositionStatus(position).label.toLowerCase()}</span>
        </div>
      ))}
      <div className="flex items-center gap-3">
        <Breaker state="closed" size="sm" />
        <span className="text-xs text-base-foreground">Breaker {breakerStatus('closed').label.toLowerCase()}</span>
      </div>
      <div className="flex items-center gap-3">
        <EquipmentSymbol kind="pipe" size="sm" />
        <span className="text-xs text-base-foreground">Flow direction</span>
      </div>
    </div>
  );
}

function EquipSymbolDoColour() {
  const assets = [COMPRESSOR, findAssetById('23-ka-9102'), RECOMPRESSOR];
  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <p className="flex items-center gap-2 text-sm font-medium text-base-foreground">
        <IconCheck aria-hidden className="size-4 text-success-foreground-strong" />
        Do
      </p>
      <div className="flex justify-between gap-4">
        {assets.map((asset) => (
          <EquipFigure key={asset.id} caption={asset.tag} detail={<StatusIndicator size="sm" {...runStateStatus(asset.state)} />}>
            <EquipAssetSymbol asset={asset} />
          </EquipFigure>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">Running equipment stays grey and filled. The one tripped machine is the only colour on the screen, and it is also named.</p>
    </div>
  );
}

function EquipSymbolDontColour() {
  const assets = [
    { asset: COMPRESSOR, tone: 'success' },
    { asset: findAssetById('23-ka-9102'), tone: 'success' },
    { asset: RECOMPRESSOR, tone: 'critical' },
  ] as const;
  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <p className="flex items-center gap-2 text-sm font-medium text-base-foreground">
        <IconX aria-hidden className="size-4 text-critical-foreground-strong" />
        Don&apos;t
      </p>
      <div className="flex justify-between gap-4">
        {assets.map(({ asset, tone }) => (
          <EquipFigure key={asset.id} caption={asset.tag}>
            <EquipmentSymbol kind="compressor" size="lg" tone={tone} fill="solid" label={`${asset.tag}, coloured by state with no label`} />
          </EquipFigure>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">Green for running fills the screen with colour that says nothing is wrong, and red against green is unreadable without colour vision or a label.</p>
    </div>
  );
}

function EquipSymbolTrain() {
  const y = 64;
  const size = 48;
  const units = [
    { kind: 'shutdown-valve', x: 80, tag: '20-XV-1105', fill: 'none' },
    { kind: 'horizontal-separator', x: 200, tag: SEPARATOR.tag, fill: 'solid' },
    { kind: 'compressor', x: 330, tag: COMPRESSOR.tag, fill: 'solid' },
    { kind: 'heat-exchanger', x: 460, tag: COOLER.tag, fill: 'solid' },
    { kind: 'centrifugal-pump', x: 590, tag: EXPORT_PUMP_A.tag, fill: 'solid' },
  ] as const;
  const portY = (kind: SymbolKind, x: number) => symbolPort(kind, 'in', x, y, size).y;
  const valveOffset = y - portY('shutdown-valve', 80);
  return (
    <DiagramCanvas label="Five symbols joined into a train: shutdown valve, inlet separator, compressor, cooler and export pump, with flow from left to right" width={680} height={120}>
      {units.map((unit, index) => {
        const cy = unit.kind === 'shutdown-valve' ? y + valveOffset : y;
        const from = index === 0 ? { x: 16, y } : symbolPort(units[index - 1].kind, 'out', units[index - 1].x, units[index - 1].kind === 'shutdown-valve' ? y + valveOffset : y, size);
        return (
          <g key={unit.tag}>
            <PipeLine points={[from, symbolPort(unit.kind, 'in', unit.x, cy, size)]} weight="heavy" flow="forward" />
            <EquipmentSymbol kind={unit.kind} size={size} cx={unit.x} cy={cy} fill={unit.fill} label={unit.tag} />
            <text x={unit.x} y={108} fontSize={10} textAnchor="middle" className="fill-base-foreground font-mono">
              {unit.tag}
            </text>
          </g>
        );
      })}
      <PipeLine points={[symbolPort('centrifugal-pump', 'out', 590, y, size), { x: 664, y }]} weight="heavy" flow="forward" />
    </DiagramCanvas>
  );
}

function EquipSymbolEquipmentList() {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-xl border-collapse text-sm">
        <thead>
          <tr>
            <th scope="col" className={`${TH} w-12`}>
              <span className="sr-only">Symbol</span>
            </th>
            <th scope="col" className={TH}>
              Tag
            </th>
            <th scope="col" className={TH}>
              Equipment
            </th>
            <th scope="col" className={TH}>
              State
            </th>
            <th scope="col" className={TH}>
              Health
            </th>
          </tr>
        </thead>
        <tbody>
          {EQUIPMENT.slice(0, 8).map((asset) => (
            <tr key={asset.id} className="border-t border-default">
              <td className={TD}>
                <EquipAssetSymbol asset={asset} size="sm" />
              </td>
              <td className={`${TD} whitespace-nowrap font-mono text-xs text-base-foreground`}>{asset.tag}</td>
              <td className={`${TD} text-base-foreground`}>{asset.name}</td>
              <td className={TD}>
                <StatusIndicator size="sm" {...runStateStatus(asset.state)} />
              </td>
              <td className={TD}>
                <StatusIndicator size="sm" {...healthStatus(asset.health)} detail={String(asset.healthScore)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EquipSymbolLevelVessel() {
  return (
    <div className="flex items-center gap-4">
      <EquipAssetSymbol asset={SEPARATOR} />
      <div className="flex flex-col gap-1.5">
        <span className="font-mono text-xs text-muted-foreground">{SEPARATOR_LEVEL.tag}</span>
        <ValueReadout size="sm" value={SEPARATOR_LEVEL.value} unit={SEPARATOR_LEVEL.unit} decimals={1} />
        <span className="text-xs text-muted-foreground">
          Band {SEPARATOR_LEVEL.lowLimit}–{SEPARATOR_LEVEL.highLimit} %
        </span>
      </div>
    </div>
  );
}

export default definePage({
  id: 'equipment-symbols',
  title: 'Equipment symbols',
  summary:
    'One glyph set for pumps, compressors, vessels, valves, instruments and electrical gear, drawn on a shared 24-unit grid. Equipment is grey; fill says running or closed; colour appears only when something is wrong.',
  guidance: {
    use: [
      'Use the same glyph for the same equipment type everywhere: diagrams, lists, cards and legends.',
      'Show state with fill and a label: filled for running or closed, hollow for stopped or open.',
      'Keep colour for tripped, failed and maintenance, and always pair it with the state in words.',
      'Put the tag under the symbol in a diagram and beside it in a list.',
    ],
    avoid: [
      'Green for running and red for stopped; normal operation should not light up the screen.',
      'Gradients, shadows, 3D vessels or animated rotors.',
      'Scaling a symbol by stretching it; pick 24, 32 or 48 so strokes stay one weight.',
      'A symbol on its own where the tag or name is needed to tell two machines apart.',
    ],
  },
  source,
  sections: [
    {
      id: 'set',
      title: 'The set',
      description: 'Every glyph, the grid they share, and the instruments and lines that connect them.',
      specimens: [
        {
          id: 'EquipSymbolFullSet',
          title: 'Process symbols',
          note: 'Pick from this set first; a new equipment type gets a new glyph on the same grid, not a one-off drawing.',
          origin: 'custom',
          uses: ['industrial/diagrams/EquipmentSymbol.tsx', 'industrial/diagrams/symbolPaths.ts'],
          size: 'full',
          align: 'stretch',
          Component: EquipSymbolFullSet,
        },
        {
          id: 'EquipSymbolSingle',
          title: 'Single symbol',
          note: 'Pick it wherever an equipment type needs a picture: a card header, a list row, a legend.',
          origin: 'custom',
          uses: ['industrial/diagrams/EquipmentSymbol.tsx'],
          Component: EquipSymbolSingle,
        },
        {
          id: 'EquipSymbolSizes',
          title: 'Sizes',
          note: 'Pick 24 for table rows and legends, 32 for cards and dense diagrams, 48 for diagrams with room.',
          origin: 'custom',
          uses: ['industrial/diagrams/EquipmentSymbol.tsx'],
          Component: EquipSymbolSizes,
        },
        {
          id: 'EquipSymbolInstrumentMounting',
          title: 'Instrument mounting',
          note: 'Pick the centre line for a function that lives in the control system, the plain bubble for a field device.',
          origin: 'custom',
          uses: ['industrial/diagrams/InstrumentBubble.tsx'],
          Component: EquipSymbolInstrumentMounting,
        },
        {
          id: 'EquipSymbolInstrumentBubbles',
          title: 'Instrument bubbles',
          note: 'Pick it to mark where a measurement is taken, with the function letters and loop number of its tag.',
          origin: 'custom',
          uses: ['industrial/diagrams/InstrumentBubble.tsx'],
          size: 'md',
          Component: EquipSymbolInstrumentBubbles,
        },
        {
          id: 'EquipSymbolPipeSegments',
          title: 'Pipe segments',
          note: 'Pick the line weight by importance and a dash for no flow or a signal, so lines read without colour.',
          origin: 'custom',
          uses: ['industrial/diagrams/PipeLine.tsx', 'industrial/diagrams/FlowArrow.tsx', 'industrial/diagrams/DiagramCanvas.tsx'],
          size: 'md',
          Component: EquipSymbolPipeSegments,
        },
        {
          id: 'EquipSymbolGrid',
          title: 'Construction grid',
          note: 'Pick it as the template when drawing a new glyph, so it lines up and connects like the others.',
          origin: 'custom',
          uses: ['industrial/diagrams/EquipmentSymbol.tsx', 'industrial/diagrams/symbolPaths.ts', 'industrial/diagrams/DiagramCanvas.tsx'],
          size: 'md',
          Component: EquipSymbolGrid,
        },
        {
          id: 'EquipSymbolElectrical',
          title: 'Electrical symbols',
          note: 'Pick these for single-line diagrams; they read top to bottom and share the grid with the process set.',
          origin: 'custom',
          uses: ['industrial/diagrams/EquipmentSymbol.tsx', 'industrial/diagrams/Breaker.tsx', 'industrial/diagrams/symbolPaths.ts'],
          size: 'md',
          align: 'stretch',
          Component: EquipSymbolElectrical,
        },
      ],
    },
    {
      id: 'states',
      title: 'States',
      description: 'Fill and outline carry the state; colour is kept for the abnormal ones.',
      specimens: [
        {
          id: 'EquipSymbolRunStates',
          title: 'Run states',
          note: 'Pick it for any equipment that runs: filled is running, light is standby, hollow is stopped, colour is trouble.',
          origin: 'custom',
          uses: ['industrial/diagrams/EquipmentSymbol.tsx', 'industrial/diagrams/symbolState.ts', 'industrial/StatusIndicator.tsx'],
          size: 'lg',
          align: 'stretch',
          Component: EquipSymbolRunStates,
        },
        {
          id: 'EquipSymbolStateInUse',
          title: 'Tripped machine',
          note: 'Pick it to see an abnormal state in use: critical outline, the state in words, and how long ago.',
          origin: 'custom',
          uses: ['industrial/diagrams/EquipmentSymbol.tsx', 'industrial/diagrams/symbolState.ts', 'industrial/StatusIndicator.tsx'],
          Component: EquipSymbolStateInUse,
        },
        {
          id: 'EquipSymbolValvePositions',
          title: 'Valve positions',
          note: 'Pick it for actuated valves: hollow is open, solid is closed, half is travelling, a cross is a failure.',
          origin: 'custom',
          uses: ['industrial/diagrams/ValveSymbol.tsx', 'industrial/diagrams/symbolState.ts', 'industrial/StatusIndicator.tsx'],
          size: 'md',
          Component: EquipSymbolValvePositions,
        },
        {
          id: 'EquipSymbolRotatingRun',
          title: 'Run indication',
          note: 'Pick it for rotating equipment: the fill says it turns and the speed confirms it, with no animation.',
          origin: 'custom',
          uses: ['industrial/diagrams/EquipmentSymbol.tsx', 'industrial/diagrams/symbolState.ts', 'industrial/ValueReadout.tsx'],
          size: 'md',
          Component: EquipSymbolRotatingRun,
        },
      ],
    },
    {
      id: 'labels',
      title: 'Tags, values and selection',
      description: 'A symbol rarely stands alone: it carries a tag, a reading or a state.',
      specimens: [
        {
          id: 'EquipSymbolWithTag',
          title: 'With tag',
          note: 'Pick it on a diagram, where the tag is how people find the machine in the field.',
          origin: 'custom',
          uses: ['industrial/diagrams/EquipmentSymbol.tsx'],
          Component: EquipSymbolWithTag,
        },
        {
          id: 'EquipSymbolWithValue',
          title: 'With live value',
          note: 'Pick it when one reading defines the machine, such as flow for a pump.',
          origin: 'custom',
          uses: ['industrial/diagrams/EquipmentSymbol.tsx', 'industrial/ValueReadout.tsx'],
          Component: EquipSymbolWithValue,
        },
        {
          id: 'EquipSymbolWithStatusBadge',
          title: 'With status badge',
          note: 'Pick it in a card or header, where the state deserves a badge, not just a dot.',
          origin: 'custom',
          uses: ['industrial/diagrams/EquipmentSymbol.tsx', 'industrial/StatusIndicator.tsx'],
          Component: EquipSymbolWithStatusBadge,
        },
        {
          id: 'EquipSymbolAbnormalValue',
          title: 'With a value above its limit',
          note: 'Pick it to see where the colour goes: the reading and its flag turn warning, the running machine stays grey.',
          origin: 'custom',
          uses: ['industrial/diagrams/EquipmentSymbol.tsx', 'industrial/ValueReadout.tsx', 'industrial/status.ts'],
          Component: EquipSymbolAbnormalValue,
        },
        {
          id: 'EquipSymbolLevelVessel',
          title: 'Vessel with level',
          note: 'Pick it for separators and tanks in a list, where the level and its band matter more than a drawing of it.',
          origin: 'custom',
          uses: ['industrial/diagrams/EquipmentSymbol.tsx', 'industrial/ValueReadout.tsx'],
          Component: EquipSymbolLevelVessel,
        },
        {
          id: 'EquipSymbolLabelPlacement',
          title: 'Label placement',
          note: 'Pick below for diagrams, where lines enter from the sides, and beside for lists and legends.',
          origin: 'custom',
          uses: ['industrial/diagrams/EquipmentSymbol.tsx'],
          Component: EquipSymbolLabelPlacement,
        },
        {
          id: 'EquipSymbolSelectable',
          title: 'Hover and selected',
          note: 'Pick it when a symbol opens a detail view: selection is a surface and an outline, never a status colour.',
          origin: 'custom',
          uses: ['industrial/diagrams/EquipmentSymbol.tsx'],
          size: 'md',
          Component: EquipSymbolSelectable,
        },
        {
          id: 'EquipSymbolInDiagram',
          title: 'In a diagram with a value tag',
          note: 'Pick it as the smallest useful schematic: one machine, its lines, an instrument and its reading.',
          origin: 'custom',
          uses: [
            'industrial/diagrams/DiagramCanvas.tsx',
            'industrial/diagrams/EquipmentSymbol.tsx',
            'industrial/diagrams/PipeLine.tsx',
            'industrial/diagrams/InstrumentBubble.tsx',
            'industrial/diagrams/ValueTag.tsx',
          ],
          size: 'md',
          align: 'stretch',
          Component: EquipSymbolInDiagram,
        },
      ],
    },
    {
      id: 'context',
      title: 'In context',
      description: 'The set on a control-room surface, explained in a legend, and used in a train and a list.',
      specimens: [
        {
          id: 'EquipSymbolOnDark',
          title: 'On a dark control-room surface',
          note: 'Pick it for wall displays and night shift: the same rules hold, with the tripped machine still the only colour.',
          origin: 'custom',
          uses: ['industrial/diagrams/EquipmentSymbol.tsx', 'industrial/diagrams/symbolState.ts', 'industrial/StatusIndicator.tsx'],
          size: 'lg',
          align: 'stretch',
          Component: EquipSymbolOnDark,
        },
        {
          id: 'EquipSymbolLegend',
          title: 'Legend',
          note: 'Pick it beside any diagram, so nobody has to learn the fill and outline rules by guessing.',
          origin: 'custom',
          uses: ['industrial/diagrams/EquipmentSymbol.tsx', 'industrial/diagrams/ValveSymbol.tsx', 'industrial/diagrams/Breaker.tsx', 'industrial/diagrams/symbolState.ts'],
          align: 'stretch',
          Component: EquipSymbolLegend,
        },
        {
          id: 'EquipSymbolDoColour',
          title: 'Colour for the abnormal',
          note: 'Pick this rule for every screen: grey process, one colour for the thing that needs attention.',
          origin: 'custom',
          uses: ['industrial/diagrams/EquipmentSymbol.tsx', 'industrial/diagrams/symbolState.ts', 'industrial/StatusIndicator.tsx'],
          size: 'md',
          Component: EquipSymbolDoColour,
        },
        {
          id: 'EquipSymbolDontColour',
          title: 'Colour for everything',
          note: 'Avoid this: state carried by colour alone, with normal operation as loud as a trip.',
          origin: 'custom',
          uses: ['industrial/diagrams/EquipmentSymbol.tsx'],
          size: 'md',
          Component: EquipSymbolDontColour,
        },
        {
          id: 'EquipSymbolTrain',
          title: 'Symbols joined into a train',
          note: 'Pick it to check that glyphs connect on their ports before building a full process diagram.',
          origin: 'custom',
          uses: ['industrial/diagrams/DiagramCanvas.tsx', 'industrial/diagrams/EquipmentSymbol.tsx', 'industrial/diagrams/PipeLine.tsx', 'industrial/diagrams/symbolPaths.ts'],
          size: 'full',
          align: 'stretch',
          Component: EquipSymbolTrain,
        },
        {
          id: 'EquipSymbolEquipmentList',
          title: 'Equipment list',
          note: 'Pick it when a table needs the equipment type at a glance; the 24 size sits in a normal row.',
          origin: 'custom',
          uses: ['industrial/diagrams/EquipmentSymbol.tsx', 'industrial/diagrams/symbolState.ts', 'industrial/StatusIndicator.tsx', 'industrial/status.ts'],
          size: 'full',
          align: 'stretch',
          Component: EquipSymbolEquipmentList,
        },
      ],
    },
  ],
});
