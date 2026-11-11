import { Button } from '@cognite/aura/components/button';
import { Slider } from '@cognite/aura/components/slider';
import { Switch } from '@cognite/aura/components/switch';
import { IconAlertOctagon, IconAlertTriangle, IconArrowsMaximize, IconArrowsMinimize, IconCircleCheck, IconInfoCircle, IconStack2, IconX } from '@cognite/aura/icons';
import { useReducer, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';

import { DataTable } from '../../../library/kit/DataTable';
import type { DataTableColumn } from '../../../library/kit/DataTable';
import { Legend } from '../../../library/kit/Legend';
import type { LegendItem } from '../../../library/kit/Legend';
import { Meter } from '../../../library/kit/Meter';
import type { DeckStackLevel } from '../../../library/kit/offshore-platform-3d/deckLevels';
import { DeckStack } from '../../../library/kit/offshore-platform-3d/DeckStack';
import { Panel } from '../../../library/kit/Panel';
import { SparkLine } from '../../../library/kit/SparkLine';
import { Stat } from '../../../library/kit/Stat';
import { StatusPill } from '../../../library/kit/StatusPill';
import { TagId } from '../../../library/kit/TagId';
import { formatNumber } from '../../../library/kit/tones';
import type { StatusTone } from '../../../library/kit/tones';
import { LookScope } from '../../../library/looks/LookScope';
import { CompressorSkid } from '../../../library/three/CompressorSkid';
import { HorizontalVessel } from '../../../library/three/HorizontalVessel';
import type { PlantNodeStatus } from '../../../library/three/PlantScene';
import { PumpSkid } from '../../../library/three/PumpSkid';
import { SceneCanvas } from '../../../library/three/SceneCanvas';
import { DeckModule } from '../../../library/three/scenes/DeckModule';
import { Derrick } from '../../../library/three/scenes/Derrick';
import { explodeOffsets } from '../../../library/three/scenes/explode';
import { ExplodeLift } from '../../../library/three/scenes/ExplodeLift';
import { Helideck } from '../../../library/three/scenes/Helideck';
import { LivingQuarters } from '../../../library/three/scenes/LivingQuarters';
import { OffshorePlatform } from '../../../library/three/scenes/OffshorePlatform';
import { PlatformJacket } from '../../../library/three/scenes/PlatformJacket';
import { findLevel, findPlatformEquipment } from '../../../library/three/scenes/platformLayout';
import type { PlatformLayout } from '../../../library/three/scenes/platformLayout';
import { INITIAL_PLATFORM_STATE, platformDepth, platformReducer } from '../../../library/three/scenes/platformState';
import type { PlatformAction, PlatformState } from '../../../library/three/scenes/platformState';
import { StillScene } from '../../../library/three/scenes/StillScene';
import { TurntableStage } from '../../../library/three/TurntableStage';
import type { RunState } from '../../data/plant';
import { makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './offshore-platform-3d.tsx?raw';

/**
 * Valhall Sør, a fixed production platform. Levels are listed bottom first; equipment positions
 * are metres from the middle of each deck floor, x towards the living quarters, z towards the viewer.
 */
const PLATFORM3D_LAYOUT: PlatformLayout = {
  size: [40, 26],
  gap: 11,
  draught: 10,
  levels: [
    { id: 'jacket', name: 'Jacket', kind: 'jacket', elevation: 12, height: 14, equipment: [] },
    {
      id: 'cellar',
      name: 'Cellar deck',
      kind: 'deck',
      elevation: 12,
      height: 6,
      equipment: [
        { id: '21-pa-2001a', kind: 'pump', tag: '21-PA-2001A', position: [-12, 0, -7], scale: 1.2 },
        { id: '21-pa-2001b', kind: 'pump', tag: '21-PA-2001B', position: [-12, 0, 0], scale: 1.2 },
        { id: '56-va-2003', kind: 'horizontal-vessel', tag: '56-VA-2003', position: [2, 0, -7], scale: 0.62 },
        { id: '50-ha-2004', kind: 'heat-exchanger', tag: '50-HA-2004', position: [3, 0, 6], scale: 0.9 },
        { id: '13-xv-2010', kind: 'valve', tag: '13-XV-2010', position: [14, 0, 0] },
      ],
    },
    {
      id: 'main',
      name: 'Main deck',
      kind: 'deck',
      elevation: 18,
      height: 7,
      equipment: [
        { id: '20-va-2001', kind: 'horizontal-vessel', tag: '20-VA-2001', position: [-10, 0, -6], scale: 0.9 },
        { id: '20-va-2002', kind: 'horizontal-vessel', tag: '20-VA-2002', position: [-10, 0, 6], scale: 0.68 },
        { id: '23-ka-2101', kind: 'compressor', tag: '23-KA-2101', position: [9, 0, -7], scale: 0.85 },
        { id: '23-ka-2102', kind: 'compressor', tag: '23-KA-2102', position: [9, 0, 1], scale: 0.85 },
        { id: '23-ha-2114', kind: 'heat-exchanger', tag: '23-HA-2114', position: [9, 0, 9] },
      ],
      features: [{ id: 'flare-boom', kind: 'flare-boom', position: [-20, 1, -9], rotationY: Math.PI }],
    },
    {
      id: 'upper',
      name: 'Upper deck',
      kind: 'deck',
      elevation: 25,
      height: 0,
      equipment: [
        { id: '80-gt-2001', kind: 'turbine', tag: '80-GT-2001', position: [2, 0, 8], scale: 0.8 },
        { id: '23-hc-2201', kind: 'air-cooler', tag: '23-HC-2201', position: [-13, 0, 8], scale: 0.72 },
      ],
      features: [
        { id: 'derrick', kind: 'derrick', position: [-9, 0, -5] },
        { id: 'crane', kind: 'crane', position: [3, 0, -10], rotationY: 0.5 },
        { id: 'quarters', kind: 'quarters', position: [14.5, 0, 0] },
        { id: 'helideck', kind: 'helideck', position: [19, 13.7, 0] },
      ],
    },
  ],
};

type Platform3dReading = { label: string; value: number; unit: string; decimals: number; tone?: StatusTone; seed: number };

type Platform3dEquipment = { name: string; state: RunState; note: string; readings: readonly Platform3dReading[] };

/** What the readout card shows for each piece of equipment. Tags follow the plant's style. */
const PLATFORM3D_EQUIPMENT: Readonly<Record<string, Platform3dEquipment>> = {
  '21-pa-2001a': {
    name: 'Crude export pump A',
    state: 'running',
    note: 'Duty pump',
    readings: [
      { label: 'Discharge pressure', value: 38.4, unit: 'barg', decimals: 1, seed: 301 },
      { label: 'Flow', value: 412, unit: 'm³/h', decimals: 0, seed: 302 },
      { label: 'Bearing temperature', value: 61.2, unit: '°C', decimals: 1, seed: 303 },
    ],
  },
  '21-pa-2001b': {
    name: 'Crude export pump B',
    state: 'standby',
    note: 'Ready to start',
    readings: [
      { label: 'Discharge pressure', value: 0.4, unit: 'barg', decimals: 1, seed: 304 },
      { label: 'Flow', value: 0, unit: 'm³/h', decimals: 0, seed: 305 },
      { label: 'Bearing temperature', value: 18.6, unit: '°C', decimals: 1, seed: 306 },
    ],
  },
  '56-va-2003': {
    name: 'Closed drain drum',
    state: 'running',
    note: 'Level steady',
    readings: [
      { label: 'Level', value: 34, unit: '%', decimals: 0, seed: 307 },
      { label: 'Pressure', value: 0.8, unit: 'barg', decimals: 1, seed: 308 },
      { label: 'Temperature', value: 27.4, unit: '°C', decimals: 1, seed: 309 },
    ],
  },
  '50-ha-2004': {
    name: 'Seawater cooler',
    state: 'running',
    note: 'Fouling margin 18 %',
    readings: [
      { label: 'Outlet temperature', value: 31.6, unit: '°C', decimals: 1, seed: 310 },
      { label: 'Seawater flow', value: 880, unit: 'm³/h', decimals: 0, seed: 311 },
      { label: 'Differential pressure', value: 0.62, unit: 'bar', decimals: 2, seed: 312 },
    ],
  },
  '13-xv-2010': {
    name: 'Riser shutdown valve',
    state: 'running',
    note: 'Open · last stroke test 9 Mar',
    readings: [
      { label: 'Position', value: 100, unit: '%', decimals: 0, seed: 313 },
      { label: 'Riser pressure', value: 92.7, unit: 'barg', decimals: 1, seed: 314 },
      { label: 'Stroke time', value: 11.4, unit: 's', decimals: 1, seed: 315 },
    ],
  },
  '20-va-2001': {
    name: 'Inlet separator',
    state: 'running',
    note: 'Level above the high limit of 70 %',
    readings: [
      { label: 'Level', value: 74, unit: '%', decimals: 0, tone: 'warning', seed: 316 },
      { label: 'Pressure', value: 46.8, unit: 'barg', decimals: 1, seed: 317 },
      { label: 'Temperature', value: 58.3, unit: '°C', decimals: 1, seed: 318 },
    ],
  },
  '20-va-2002': {
    name: 'Test separator',
    state: 'standby',
    note: 'Next well test 13 Mar 06:00',
    readings: [
      { label: 'Level', value: 12, unit: '%', decimals: 0, seed: 319 },
      { label: 'Pressure', value: 4.1, unit: 'barg', decimals: 1, seed: 320 },
      { label: 'Temperature', value: 22.9, unit: '°C', decimals: 1, seed: 321 },
    ],
  },
  '23-ka-2101': {
    name: 'Export compressor A',
    state: 'running',
    note: 'Carrying full export load',
    readings: [
      { label: 'Discharge pressure', value: 141.6, unit: 'barg', decimals: 1, seed: 322 },
      { label: 'Shaft speed', value: 9860, unit: 'rpm', decimals: 0, seed: 323 },
      { label: 'Vibration', value: 4.3, unit: 'mm/s', decimals: 1, seed: 324 },
    ],
  },
  '23-ka-2102': {
    name: 'Export compressor B',
    state: 'tripped',
    note: 'Tripped on high vibration 14 min ago',
    readings: [
      { label: 'Discharge pressure', value: 2.1, unit: 'barg', decimals: 1, seed: 325 },
      { label: 'Shaft speed', value: 0, unit: 'rpm', decimals: 0, seed: 326 },
      { label: 'Vibration', value: 11.8, unit: 'mm/s', decimals: 1, tone: 'critical', seed: 327 },
    ],
  },
  '23-ha-2114': {
    name: 'Compressor aftercooler',
    state: 'running',
    note: 'Approach temperature normal',
    readings: [
      { label: 'Outlet temperature', value: 34.8, unit: '°C', decimals: 1, seed: 328 },
      { label: 'Inlet temperature', value: 128.2, unit: '°C', decimals: 1, seed: 329 },
      { label: 'Differential pressure', value: 0.41, unit: 'bar', decimals: 2, seed: 330 },
    ],
  },
  '80-gt-2001': {
    name: 'Main power turbine',
    state: 'running',
    note: 'Exhaust spread widening',
    readings: [
      { label: 'Load', value: 18.4, unit: 'MW', decimals: 1, seed: 331 },
      { label: 'Exhaust temperature', value: 512, unit: '°C', decimals: 0, tone: 'info', seed: 332 },
      { label: 'Speed', value: 9790, unit: 'rpm', decimals: 0, seed: 333 },
    ],
  },
  '23-hc-2201': {
    name: 'Gas cooler fin-fan',
    state: 'running',
    note: 'Two of two fans running',
    readings: [
      { label: 'Outlet temperature', value: 41.2, unit: '°C', decimals: 1, seed: 334 },
      { label: 'Fan speed', value: 78, unit: '%', decimals: 0, seed: 335 },
      { label: 'Motor current', value: 46.5, unit: 'A', decimals: 1, seed: 336 },
    ],
  },
};

/** Status marks in the scene: a ring and a label. Normal operation has none. */
const PLATFORM3D_STATUSES: Readonly<Record<string, PlantNodeStatus>> = {
  main: { tone: 'critical', shape: 'diamond', text: '2 alarms' },
  upper: { tone: 'info', shape: 'dot', text: '1 advisory' },
  '23-ka-2102': { tone: 'critical', shape: 'diamond', text: 'Tripped', pulse: true },
  '20-va-2001': { tone: 'warning', shape: 'square', text: 'High level' },
  '80-gt-2001': { tone: 'info', shape: 'dot', text: 'Advisory' },
  '21-pa-2001b': { tone: 'neutral', shape: 'ring', text: 'Standby' },
  '20-va-2002': { tone: 'neutral', shape: 'ring', text: 'Standby' },
};

type Platform3dManning = { levelId: string; onBoard: number; critical: number; warning: number; advisory: number };

/** People on each level and the open alarms raised from it, top deck first. */
const PLATFORM3D_MANNING: readonly Platform3dManning[] = [
  { levelId: 'upper', onBoard: 31, critical: 0, warning: 0, advisory: 1 },
  { levelId: 'main', onBoard: 9, critical: 1, warning: 1, advisory: 0 },
  { levelId: 'cellar', onBoard: 4, critical: 0, warning: 0, advisory: 0 },
  { levelId: 'jacket', onBoard: 0, critical: 0, warning: 0, advisory: 0 },
];

const PLATFORM3D_BEDS = 60;

const PLATFORM3D_ON_BOARD = PLATFORM3D_MANNING.reduce((total, level) => total + level.onBoard, 0);

const PLATFORM3D_RUN: Record<RunState, { tone: StatusTone; label: string }> = {
  running: { tone: 'success', label: 'Running' },
  standby: { tone: 'neutral', label: 'Standby' },
  stopped: { tone: 'neutral', label: 'Stopped' },
  tripped: { tone: 'critical', label: 'Tripped' },
  maintenance: { tone: 'warning', label: 'Maintenance' },
};

const PLATFORM3D_ELEVATION: Readonly<Record<string, string>> = { upper: '+25 m', main: '+18 m', cellar: '+12 m', jacket: 'Sea level' };

const PLATFORM3D_CARRIES: Readonly<Record<string, string>> = {
  upper: 'Power, gas cooling, drilling, quarters and helideck',
  main: 'Separation and export compression',
  cellar: 'Export pumps, drains and the riser valve',
  jacket: 'Legs, bracing and risers to the seabed',
};

/** The deck rail, top deck first, the way the platform stands. */
const PLATFORM3D_DECKS: readonly DeckStackLevel[] = PLATFORM3D_MANNING.map((level) => ({
  id: level.levelId,
  name: findLevel(PLATFORM3D_LAYOUT, level.levelId)?.name ?? level.levelId,
  elevation: PLATFORM3D_ELEVATION[level.levelId] ?? '',
  detail: PLATFORM3D_CARRIES[level.levelId],
  people: level.onBoard,
  alarms: [
    { tone: 'critical' as const, count: level.critical, label: 'critical' },
    { tone: 'warning' as const, count: level.warning, label: 'warning' },
    { tone: 'info' as const, count: level.advisory, label: 'advisory' },
  ].filter((alarm) => alarm.count > 0),
  weight: level.levelId === 'jacket' ? 1.25 : 1,
}));

type Platform3dRow = { id: string; levelId: string; tag: string; name: string; state: RunState; note: string; tone: StatusTone };

/** Every tagged unit, top deck first, with the tone of its scene status. */
const PLATFORM3D_ROWS: readonly Platform3dRow[] = [...PLATFORM3D_LAYOUT.levels].reverse().flatMap((level) =>
  level.equipment.flatMap((equipment) => {
    const detail = PLATFORM3D_EQUIPMENT[equipment.id];
    if (!detail) return [];
    const tone = PLATFORM3D_STATUSES[equipment.id]?.tone ?? 'neutral';
    return [{ id: equipment.id, levelId: level.id, tag: equipment.tag, name: detail.name, state: detail.state, note: detail.note, tone }];
  })
);

const PLATFORM3D_LEGEND: readonly LegendItem[] = [
  { label: 'Tripped', tone: 'critical' },
  { label: 'Warning', tone: 'warning' },
  { label: 'Advisory', tone: 'info' },
  { label: 'Standby', tone: 'neutral' },
  { label: 'Selected', tone: 'accent' },
];

const PLATFORM3D_FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ring-default)]';

/** Scene labels are plain DOM: keep them in the UI sans at a readable size. */
const PLATFORM3D_SCENE_TYPE = '[&_.font-mono]:[font-family:inherit] [&_.font-mono]:tabular-nums [&_[data-slot=scene-label]>:first-child]:text-[0.8125rem]';

function platform3dLevelName(levelId: string): string {
  return findLevel(PLATFORM3D_LAYOUT, levelId)?.name ?? levelId;
}

function platform3dTrend(reading: Platform3dReading): number[] {
  const span = Math.max(Math.abs(reading.value) * 0.06, 0.2);
  const raw = makeValues({ seed: reading.seed, points: 36, base: reading.value, amplitude: reading.value === 0 ? 0 : span, noise: reading.value === 0 ? 0 : span * 0.4, cycles: 1.5, decimals: reading.decimals + 1 });
  const shift = reading.value - raw[raw.length - 1];
  return raw.map((value) => Math.max(0, value + shift));
}

/** One segment of the title strip: a caption over a figure, between hairlines. */
function Platform3dFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex h-full flex-col justify-center border-l border-[var(--kit-rule)] px-4">
      <span className="text-xs leading-tight text-[var(--kit-text-3)]">{label}</span>
      <span className="whitespace-nowrap text-sm font-semibold tabular-nums leading-tight text-[var(--kit-text)]">{value}</span>
    </div>
  );
}

function Platform3dExplode({ amount, dispatch }: { amount: number; dispatch: (action: PlatformAction) => void }) {
  const percent = Math.round(amount * 100);
  const exploded = amount > 0.5;
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[0.8125rem] font-semibold text-[var(--kit-text)]">Deck separation</span>
        <span className="text-sm font-semibold tabular-nums text-[var(--kit-text)]">{percent} %</span>
      </div>
      <Slider aria-label="Deck separation" value={[percent]} min={0} max={100} step={1} onValueChange={(value) => dispatch({ type: 'setExplode', amount: (value[0] ?? 0) / 100 })} />
      <Button variant="outline" size="sm" onClick={() => dispatch({ type: 'toggleExplode' })} className="w-full">
        {exploded ? <IconArrowsMinimize /> : <IconArrowsMaximize />}
        {exploded ? 'Assemble decks' : 'Explode decks'}
      </Button>
    </div>
  );
}

function Platform3dEquipmentTable({ levelId, selectedId, onSelect }: { levelId: string | null; selectedId: string | null; onSelect?: (levelId: string, equipmentId: string) => void }) {
  const rows = levelId ? PLATFORM3D_ROWS.filter((row) => row.levelId === levelId) : PLATFORM3D_ROWS;
  const columns: DataTableColumn<Platform3dRow>[] = [
    {
      id: 'tag',
      header: 'Tag',
      nowrap: true,
      cell: (row) => (
        <button
          type="button"
          aria-pressed={row.id === selectedId}
          aria-label={`${row.tag}, ${row.name}`}
          onClick={() => onSelect?.(row.levelId, row.id)}
          className={`-mx-1 px-1 hover:underline aria-pressed:bg-[color-mix(in_oklab,var(--kit-line-accent)_24%,transparent)] aria-pressed:shadow-[inset_0_-2px_0_var(--kit-line-accent)] ${PLATFORM3D_FOCUS}`}
        >
          <TagId>{row.tag}</TagId>
        </button>
      ),
    },
    { id: 'name', header: 'Unit', nowrap: true, cell: (row) => row.name },
    { id: 'state', header: 'State', nowrap: true, cell: (row) => <StatusPill tone={PLATFORM3D_RUN[row.state].tone}>{PLATFORM3D_RUN[row.state].label}</StatusPill> },
  ];
  if (rows.length === 0) {
    return <p className="p-3.5 text-sm text-[var(--kit-text-2)]">The jacket carries no tagged equipment: legs, bracing and risers only.</p>;
  }
  return <DataTable flush label={levelId ? `Equipment on the ${platform3dLevelName(levelId).toLowerCase()}` : 'Equipment on all decks'} columns={columns} rows={rows} rowKey={(row) => row.id} rowTone={(row) => (row.tone === 'neutral' ? undefined : row.tone)} />;
}

/** What an isolated deck adds up to, as four figures under its equipment table. */
function Platform3dDeckFacts({ levelId }: { levelId: string }) {
  const rows = PLATFORM3D_ROWS.filter((row) => row.levelId === levelId);
  const manning = PLATFORM3D_MANNING.find((level) => level.levelId === levelId);
  const alarms = manning ? manning.critical + manning.warning + manning.advisory : 0;
  const facts = [
    { label: 'On board', value: String(manning?.onBoard ?? 0), tone: 'neutral' as const },
    { label: 'Units running', value: `${rows.filter((row) => row.state === 'running').length} of ${rows.length}`, tone: 'neutral' as const },
    { label: 'Open alarms', value: String(alarms), tone: manning && manning.critical > 0 ? ('critical' as const) : manning && manning.warning > 0 ? ('warning' as const) : ('neutral' as const) },
    { label: 'Elevation', value: PLATFORM3D_ELEVATION[levelId] ?? '', tone: 'neutral' as const },
  ];
  return (
    <dl className="grid grid-cols-2 gap-px border-t border-[var(--kit-rule)] bg-[var(--kit-rule)]">
      {facts.map((fact) => (
        <div key={fact.label} data-tone={fact.tone} className="flex flex-col gap-0.5 bg-[var(--kit-surface)] px-3.5 py-2.5">
          <dt className="text-[0.8125rem] text-[var(--kit-text-2)]">{fact.label}</dt>
          <dd className={`text-2xl font-medium leading-none tabular-nums ${fact.tone === 'neutral' ? 'text-[var(--kit-text)]' : 'text-[var(--t-ink)]'}`}>{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** The faceplate of one unit: state, the operator's note and three live readings with their trend. */
function Platform3dFaceplate({ equipmentId, onClose }: { equipmentId: string; onClose?: () => void }) {
  const found = findPlatformEquipment(PLATFORM3D_LAYOUT, equipmentId);
  const detail = PLATFORM3D_EQUIPMENT[equipmentId];
  if (!found || !detail) return null;
  const run = PLATFORM3D_RUN[detail.state];
  // The title strip takes the tone of what is wrong with the unit, if anything is.
  const tone = PLATFORM3D_STATUSES[equipmentId]?.tone ?? 'neutral';

  return (
    <Panel
      className="h-full"
      tone={tone}
      title={detail.name}
      subtitle={found.equipment.tag}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <div className="flex items-center gap-3">
          <StatusPill tone={run.tone} size="lg" icon={detail.state === 'tripped' ? <IconAlertOctagon /> : undefined}>
            {run.label}
          </StatusPill>
          <span className="min-w-0 flex-1 text-[0.8125rem] leading-snug text-[var(--kit-text-2)]">
            {found.level.name} · {detail.note}
          </span>
          {onClose ? (
            <Button variant="outline" size="sm" onClick={onClose}>
              <IconX /> Close
            </Button>
          ) : null}
        </div>
        <dl className="flex min-h-0 flex-1 flex-col justify-between">
          {detail.readings.map((reading) => (
            <div key={reading.label} data-tone={reading.tone ?? 'neutral'} className="flex items-center justify-between gap-3 border-t border-[var(--kit-rule)] py-1.5">
              <div className="flex min-w-0 flex-col">
                <dt className="whitespace-nowrap text-[0.8125rem] text-[var(--kit-text-2)]">{reading.label}</dt>
                <dd className="flex items-baseline gap-1.5">
                  <span className={`text-[1.75rem] font-medium leading-none tabular-nums ${reading.tone ? 'text-[var(--t-ink)]' : 'text-[var(--kit-text)]'}`}>{formatNumber(reading.value, reading.decimals)}</span>
                  <span className="text-[0.8125rem] text-[var(--kit-text-3)]">{reading.unit}</span>
                  {reading.tone ? <span className="text-[0.8125rem] font-semibold text-[var(--t-ink)]">{reading.tone === 'critical' ? 'Above trip' : reading.tone === 'warning' ? 'High' : 'Watch'}</span> : null}
                </dd>
              </div>
              <div className="w-28 shrink-0">
                <SparkLine values={platform3dTrend(reading)} label={`${reading.label}, last 6 hours`} tone={reading.tone ?? 'accent'} />
              </div>
            </div>
          ))}
        </dl>
      </div>
    </Panel>
  );
}

/** What the lower right panel shows while nothing is selected: who is on board and what is open. */
function Platform3dStatusPanel() {
  const critical = PLATFORM3D_MANNING.reduce((total, level) => total + level.critical, 0);
  const warning = PLATFORM3D_MANNING.reduce((total, level) => total + level.warning, 0);
  const advisory = PLATFORM3D_MANNING.reduce((total, level) => total + level.advisory, 0);
  return (
    <Panel className="h-full" title="Platform status" subtitle="Select a unit to open its faceplate">
      <div className="flex min-h-0 flex-1 flex-col justify-between gap-3">
        <div className="flex items-end justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-[0.8125rem] text-[var(--kit-text-2)]">Personnel on board</span>
            <span className="flex items-baseline gap-1.5">
              <span className="text-5xl font-medium leading-none tabular-nums text-[var(--kit-text)]">{PLATFORM3D_ON_BOARD}</span>
              <span className="text-sm text-[var(--kit-text-3)]">of {PLATFORM3D_BEDS} beds</span>
            </span>
          </div>
          <StatusPill tone="success" size="lg" icon={<IconCircleCheck />}>
            Helideck open
          </StatusPill>
        </div>
        <Meter label="Bed capacity used" value={PLATFORM3D_ON_BOARD} max={PLATFORM3D_BEDS} unit="beds" tone="accent" hideScale />
        <div className="grid grid-cols-3 gap-px bg-[var(--kit-rule)]">
          {[
            { tone: 'critical' as const, count: critical, label: 'Critical', icon: <IconAlertOctagon aria-hidden="true" className="size-4" /> },
            { tone: 'warning' as const, count: warning, label: 'Warning', icon: <IconAlertTriangle aria-hidden="true" className="size-4" /> },
            { tone: 'info' as const, count: advisory, label: 'Advisory', icon: <IconInfoCircle aria-hidden="true" className="size-4" /> },
          ].map((item) => (
            <div key={item.label} data-tone={item.tone} className="flex flex-col gap-1 bg-[var(--t-solid)] px-3 py-2 text-[var(--t-on-solid)]">
              <span className="flex items-center gap-1.5 text-[0.8125rem] font-semibold">
                {item.icon}
                {item.label}
              </span>
              <span className="text-3xl font-semibold leading-none tabular-nums">{item.count}</span>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}

function Platform3dFallbackList() {
  return (
    <ul className="flex flex-col border border-default bg-card-background px-3">
      {PLATFORM3D_DECKS.map((level) => (
        <li key={level.id} className="flex items-center justify-between gap-3 border-b border-default py-2 text-sm last:border-b-0">
          <span className="text-base-foreground">{level.name}</span>
          <span className="flex gap-1">
            {level.alarms.length === 0 ? <StatusPill tone="success">Normal</StatusPill> : level.alarms.map((alarm) => <StatusPill key={alarm.label} tone={alarm.tone}>{`${alarm.count} ${alarm.label}`}</StatusPill>)}
          </span>
        </li>
      ))}
    </ul>
  );
}

function Platform3dScene({ state, dispatch, showLabels, still, bottomInset = 56 }: { state: PlatformState; dispatch: (action: PlatformAction) => void; showLabels: boolean; still: boolean; bottomInset?: number }) {
  const level = state.levelId ? findLevel(PLATFORM3D_LAYOUT, state.levelId) : undefined;
  return (
    <SceneCanvas
      label={`3D model of the Valhall Sør platform, ${level ? `${level.name.toLowerCase()} isolated` : 'all levels'}, decks ${Math.round(state.explode * 100)} percent separated`}
      fallback={<Platform3dFallbackList />}
      onPointerMissed={() => dispatch({ type: 'clearEquipment' })}
    >
      <StillScene still={still}>
        <OffshorePlatform
          layout={PLATFORM3D_LAYOUT}
          explode={state.explode}
          levelId={state.levelId}
          selectedId={state.equipmentId}
          statuses={PLATFORM3D_STATUSES}
          onSelectLevel={(levelId) => dispatch({ type: 'isolate', levelId })}
          onSelectEquipment={(levelId, equipmentId) => dispatch({ type: 'selectEquipment', levelId, equipmentId })}
          showLabels={showLabels}
          insets={{ top: 8, bottom: bottomInset }}
        />
      </StillScene>
    </SceneCanvas>
  );
}

function Platform3dConsole({ initial = INITIAL_PLATFORM_STATE, still = false }: { initial?: PlatformState; still?: boolean }) {
  // Archetype: operator console — a title strip, a deck selector rail, the scene, and a table
  //   over a faceplate, all edge to edge on hairlines.
  // Interaction: pick a deck in the rail (or its label in the scene) to isolate it; the table
  //   narrows to that deck, and picking a unit opens its faceplate. Separation lifts the decks apart.
  const [state, dispatch] = useReducer(platformReducer, initial);
  const [showLabels, setShowLabels] = useState(true);
  const depth = platformDepth(state);
  const level = state.levelId ? findLevel(PLATFORM3D_LAYOUT, state.levelId) : undefined;

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape' && (depth !== 'platform' || state.explode > 0)) {
      event.preventDefault();
      dispatch({ type: 'up' });
    }
  };

  return (
    <div
      tabIndex={-1}
      onKeyDown={onKeyDown}
      onPointerDownCapture={(event) => {
        // Orbit controls swallow the pointer event, so take focus by hand to keep Escape working.
        if (event.target instanceof HTMLCanvasElement) event.currentTarget.focus({ preventScroll: true });
      }}
      data-depth={depth}
      className={`flex h-[48rem] w-full flex-col gap-px overflow-hidden bg-[var(--kit-canvas-bg)] text-[var(--kit-text)] outline-none ${PLATFORM3D_SCENE_TYPE}`}
    >
      <header className="flex h-14 shrink-0 items-stretch bg-[var(--kit-surface)]">
        <div className="flex items-center gap-3 px-4">
          <span aria-hidden="true" className="flex size-8 items-center justify-center bg-[var(--kit-line-accent)] text-[var(--kit-surface)]">
            <IconStack2 className="size-5" />
          </span>
          <div className="flex flex-col">
            <h3 className="text-base font-semibold leading-tight text-[var(--kit-text)]">Valhall Sør</h3>
            <span className="whitespace-nowrap text-xs leading-tight text-[var(--kit-text-3)]">Production platform · North Sea</span>
          </div>
        </div>
        <div data-tone="warning" className="flex items-center gap-2.5 bg-[var(--t-solid)] px-4 text-[var(--t-on-solid)]">
          <IconAlertTriangle aria-hidden="true" className="size-5" />
          <div className="flex flex-col">
            <span className="whitespace-nowrap text-base font-semibold leading-tight">Reduced export</span>
            <span className="whitespace-nowrap text-xs leading-tight">Compressor B tripped 14 min ago</span>
          </div>
        </div>
        <div className="hidden min-w-0 flex-1 items-stretch overflow-hidden @4xl:flex">
          <Platform3dFact label="Gas export" value="6.8 MSm³/d" />
          <Platform3dFact label="Wind" value="14 m/s NW" />
          <Platform3dFact label="Wave height" value="2.1 m" />
        </div>
        <div className="ml-auto flex items-center gap-4 border-l border-[var(--kit-rule)] px-4">
          <Switch label="Labels" checked={showLabels} onCheckedChange={(checked) => setShowLabels(checked)} />
          <span className="whitespace-nowrap text-sm font-semibold tabular-nums text-[var(--kit-text)]">14:00 UTC</span>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 gap-px">
        <aside aria-label="Deck selector" className="flex w-56 shrink-0 flex-col gap-px">
          <Panel className="min-h-0 flex-1" padding="none" title="Decks" subtitle="Pick one to isolate it">
            <DeckStack label="Decks of Valhall Sør, top first" levels={PLATFORM3D_DECKS} selectedId={state.levelId} onSelect={(levelId) => dispatch({ type: 'isolate', levelId })} className="flex-1" />
          </Panel>
          <div className="flex shrink-0 flex-col gap-3 bg-[var(--kit-surface)] p-3.5">
            <Platform3dExplode amount={state.explode} dispatch={dispatch} />
            <Button variant="ghost" size="sm" disabled={state.levelId === null} onClick={() => dispatch({ type: 'reset' })} className="w-full">
              {state.levelId === null ? 'All decks shown' : 'Show all decks'}
            </Button>
          </div>
        </aside>

        <div className="relative min-w-0 flex-1 bg-[var(--kit-surface)]">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,color-mix(in_oklab,var(--kit-line-accent)_14%,transparent),transparent_70%)]" />
          <Platform3dScene state={state} dispatch={dispatch} showLabels={showLabels} still={still} />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-[var(--kit-rule)] bg-[color-mix(in_oklab,var(--kit-surface)_88%,transparent)] px-3.5 py-2">
            <p className="whitespace-nowrap text-[0.8125rem] text-[var(--kit-text-2)]">
              <span className="font-semibold text-[var(--kit-text)]">{level ? `${level.name} isolated` : 'All decks'}</span>
              {' · '}
              {state.explode === 0 ? 'assembled' : `${Math.round(state.explode * 100)} % separated`}
            </p>
            <Legend items={PLATFORM3D_LEGEND} />
          </div>
        </div>

        <aside aria-label="Equipment and faceplate" className="flex w-[23rem] shrink-0 flex-col gap-px">
          <Panel className="min-h-0 flex-1" padding="none" title="Equipment" subtitle={level ? level.name : 'All decks'}>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <Platform3dEquipmentTable levelId={state.levelId} selectedId={state.equipmentId} onSelect={(levelId, equipmentId) => dispatch({ type: 'selectEquipment', levelId, equipmentId })} />
            </div>
            {state.levelId ? <Platform3dDeckFacts levelId={state.levelId} /> : null}
          </Panel>
          <div className="h-[19rem] shrink-0">
            {state.equipmentId ? <Platform3dFaceplate key={state.equipmentId} equipmentId={state.equipmentId} onClose={() => dispatch({ type: 'clearEquipment' })} /> : <Platform3dStatusPanel />}
          </div>
        </aside>
      </div>
    </div>
  );
}

function OffshorePlatform3dSignature() {
  return (
    <LookScope look="console" className="@container w-full">
      <Platform3dConsole />
    </LookScope>
  );
}

function OffshorePlatform3dIsolated() {
  return (
    <LookScope look="console" className="@container w-full">
      <Platform3dConsole initial={{ explode: 0.7, levelId: 'main', equipmentId: '23-ka-2102' }} still />
    </LookScope>
  );
}

/** The same platform for a wall screen: every deck is a tile filled with its state. */
function OffshorePlatform3dWall() {
  const [state, dispatch] = useReducer(platformReducer, { explode: 0.45, levelId: null, equipmentId: null });
  const tiles: readonly { id: string; tone: StatusTone; state: string; detail: string; icon: ReactNode }[] = [
    { id: 'upper', tone: 'info', state: 'Advisory', detail: 'Turbine exhaust spread widening', icon: <IconInfoCircle /> },
    { id: 'main', tone: 'critical', state: 'Tripped', detail: 'Export compressor B · high vibration', icon: <IconAlertOctagon /> },
    { id: 'cellar', tone: 'success', state: 'Normal', detail: 'Export pumps on duty', icon: <IconCircleCheck /> },
    { id: 'jacket', tone: 'success', state: 'Normal', detail: 'Structure and risers', icon: <IconCircleCheck /> },
  ];
  return (
    <LookScope look="signal" className="w-full">
      <div className={`grid h-[44rem] w-full grid-cols-[minmax(0,5fr)_minmax(0,7fr)] grid-rows-[auto_minmax(0,1fr)] gap-2 bg-[var(--kit-canvas-bg)] p-2 ${PLATFORM3D_SCENE_TYPE}`}>
        <div data-tone="warning" className="col-span-2 flex items-center justify-between gap-6 rounded-[var(--kit-radius)] bg-[var(--t-vivid)] px-6 py-4 text-[var(--t-on-vivid)]">
          <div className="flex items-center gap-4">
            <IconAlertTriangle aria-hidden="true" className="size-10" />
            <div className="flex flex-col">
              <span className="text-4xl font-extrabold leading-none tracking-tight">Reduced export</span>
              <span className="mt-1 text-base font-medium">Valhall Sør · one of two export compressors running</span>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-extrabold leading-none tabular-nums tracking-tight">{PLATFORM3D_ON_BOARD}</span>
            <span className="text-base font-medium">on board</span>
          </div>
        </div>
        <div className="grid min-h-0 grid-rows-4 gap-2">
          {tiles.map((tile) => (
            <Stat
              key={tile.id}
              label={platform3dLevelName(tile.id)}
              value={PLATFORM3D_MANNING.find((level) => level.levelId === tile.id)?.onBoard ?? 0}
              unit="on board"
              tone={tile.tone}
              state={tile.state}
              stateIcon={tile.icon}
              target={tile.detail}
              size="md"
            />
          ))}
        </div>
        <div className="relative min-h-0 overflow-hidden rounded-[var(--kit-radius)] bg-[var(--kit-surface)]">
          <Platform3dScene state={state} dispatch={dispatch} showLabels still bottomInset={16} />
        </div>
      </div>
    </LookScope>
  );
}

function Platform3dPartFrame({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <LookScope look="console" className="w-full">
      <div className={`flex w-full gap-px bg-[var(--kit-canvas-bg)] p-px text-[var(--kit-text)] ${className}`}>{children}</div>
    </LookScope>
  );
}

function OffshorePlatform3dPartDecks() {
  const [levelId, setLevelId] = useState<string | null>('main');
  return (
    <Platform3dPartFrame className="h-[26rem]">
      <Panel className="min-w-0 flex-1" padding="none" title="Decks" subtitle={levelId ? `${platform3dLevelName(levelId)} isolated` : 'All decks shown'}>
        <DeckStack label="Decks of Valhall Sør, top first" levels={PLATFORM3D_DECKS} selectedId={levelId} onSelect={(next) => setLevelId(next === levelId ? null : next)} className="flex-1" />
      </Panel>
    </Platform3dPartFrame>
  );
}

function OffshorePlatform3dPartTable() {
  const [selectedId, setSelectedId] = useState<string | null>('20-va-2001');
  return (
    <Platform3dPartFrame className="h-[26rem]">
      <Panel className="min-w-0 flex-1" padding="none" title="Equipment" subtitle="All decks, top first">
        <div className="min-h-0 flex-1 overflow-y-auto">
          <Platform3dEquipmentTable levelId={null} selectedId={selectedId} onSelect={(_levelId, equipmentId) => setSelectedId(equipmentId === selectedId ? null : equipmentId)} />
        </div>
      </Panel>
    </Platform3dPartFrame>
  );
}

function OffshorePlatform3dPartFaceplate() {
  return (
    <Platform3dPartFrame className="h-[19rem]">
      <div className="min-w-0 flex-1">
        <Platform3dFaceplate equipmentId="23-ka-2102" />
      </div>
    </Platform3dPartFrame>
  );
}

function OffshorePlatform3dPartStatus() {
  return (
    <Platform3dPartFrame className="h-[19rem]">
      <div className="min-w-0 flex-1">
        <Platform3dStatusPanel />
      </div>
    </Platform3dPartFrame>
  );
}

function OffshorePlatform3dPartExplode() {
  const [state, dispatch] = useReducer(platformReducer, { explode: 0.5, levelId: null, equipmentId: null });
  const offsets = explodeOffsets(3, state.explode, 6);
  return (
    <Platform3dPartFrame className="h-80">
      <div className="flex w-52 shrink-0 flex-col justify-center bg-[var(--kit-surface)] p-3.5">
        <Platform3dExplode amount={state.explode} dispatch={dispatch} />
      </div>
      <div className="min-w-0 flex-1 bg-[var(--kit-surface)]">
        <SceneCanvas label={`Three stacked modules, ${Math.round(state.explode * 100)} percent separated`}>
          <StillScene>
            <TurntableStage subjectSize={[22, 26, 14]} padding={0.72}>
              {offsets.map((offset, index) => (
                <ExplodeLift key={index} y={offset}>
                  <group position={[0, 0.7 + index * 4.5, 0]}>
                    <DeckModule size={[18, index === 2 ? 0 : 4.5, 10]} handrail={index === 2}>
                      {index === 0 ? <PumpSkid position={[-3, 0, 0]} /> : null}
                      {index === 1 ? <HorizontalVessel position={[0, 0, 0]} scale={0.7} /> : null}
                      {index === 2 ? <CompressorSkid position={[0, 0, 0]} scale={0.8} /> : null}
                    </DeckModule>
                  </group>
                </ExplodeLift>
              ))}
            </TurntableStage>
          </StillScene>
        </SceneCanvas>
      </div>
    </Platform3dPartFrame>
  );
}

function Platform3dStage({ label, caption, children }: { label: string; caption: string; children: ReactNode }) {
  return (
    <Platform3dPartFrame className="h-80 flex-col">
      <div className="min-h-0 flex-1 bg-[var(--kit-surface)]">
        <SceneCanvas label={label}>
          <StillScene>{children}</StillScene>
        </SceneCanvas>
      </div>
      <p className="bg-[var(--kit-surface)] px-3.5 py-2 text-[0.8125rem] text-[var(--kit-text-2)]">{caption}</p>
    </Platform3dPartFrame>
  );
}

function OffshorePlatform3dPartJacket() {
  return (
    <Platform3dStage label="Platform jacket with battered legs, cross-bracing and risers" caption="Jacket: four battered legs, bracing and risers.">
      <TurntableStage subjectSize={[34, 24, 22]} padding={0.95}>
        <PlatformJacket topSize={[22, 14]} baseSize={[32, 22]} topY={24} bottomY={0} />
      </TurntableStage>
    </Platform3dStage>
  );
}

function OffshorePlatform3dPartDerrick() {
  return (
    <Platform3dStage label="Drilling derrick on its drill floor" caption="Derrick: the landmark that says which end is which.">
      <TurntableStage subjectSize={[9, 30, 9]} padding={0.9}>
        <Derrick />
      </TurntableStage>
    </Platform3dStage>
  );
}

function OffshorePlatform3dPartQuarters() {
  return (
    <Platform3dStage label="Living quarters with a helideck on the roof" caption="Living quarters and helideck, upper deck east.">
      <TurntableStage subjectSize={[18, 15, 18]} padding={1.2}>
        <LivingQuarters position={[-2, 0, 0]} />
        <Helideck position={[2.5, 13.7, 0]} />
      </TurntableStage>
    </Platform3dStage>
  );
}

export default definePage({
  id: 'offshore-platform-3d',
  title: 'Offshore platform',
  summary:
    'Valhall Sør as an operator console. A deck selector rail stands beside the 3D platform the way the structure stands; picking a deck isolates it in the scene and narrows the equipment table, and picking a unit opens its faceplate.',
  guidance: {
    use: [
      'For stacked structures, where the level is the first question: platforms, process modules, buildings.',
      'With a rail that mirrors the structure top to bottom, so picking a deck needs no reading.',
      'With state as filled blocks and edge bars: an operator finds the tripped unit before reading a word.',
      'With separation as a slider, so people can stop where the deck they need is clear of the others.',
    ],
    avoid: [
      'Exploding by default: the assembled platform is the picture people recognise.',
      'Hiding the other decks when one is isolated. Ghost them, so the place in the structure stays readable.',
      'A faceplate that covers the scene. Dock it under the table.',
      'Monospaced tags. The UI sans with tabular figures reads faster at console density.',
    ],
  },
  source,
  sections: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description:
        'Pick a deck in the rail, or click its label in the scene, to isolate it: the other decks ghost and the table lists only that deck. Pick a tag in the table or a unit on the isolated deck to open its faceplate. Drag Deck separation to lift the decks apart. Escape steps back.',
      specimens: [
        {
          id: 'OffshorePlatform3dSignature',
          title: 'Platform console',
          note: 'Pick it for a control room that watches one installation all shift and needs to get from a deck to a unit in two clicks.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'three/SceneCanvas.tsx',
            'three/scenes/OffshorePlatform.tsx',
            'three/scenes/platformLayout.ts',
            'three/scenes/platformState.ts',
            'kit/offshore-platform-3d/DeckStack.tsx',
            'kit/Panel.tsx',
            'kit/DataTable.tsx',
            'kit/StatusPill.tsx',
            'kit/SparkLine.tsx',
            'kit/Meter.tsx',
            'kit/TagId.tsx',
            'kit/Legend.tsx',
            'looks/LookScope.tsx',
          ],
          Component: OffshorePlatform3dSignature,
        },
      ],
    },
    {
      id: 'variations',
      title: 'Other screens',
      description: 'The detail state with the main deck isolated and the tripped compressor on its faceplate, and the same platform recomposed for a wall screen. Both render a still frame.',
      specimens: [
        {
          id: 'OffshorePlatform3dIsolated',
          title: 'Main deck isolated, unit selected',
          note: 'Pick it as the working state during an upset: decks apart, one deck solid, one faceplate open.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['three/scenes/OffshorePlatform.tsx', 'three/scenes/platformState.ts', 'three/scenes/StillScene.tsx', 'kit/offshore-platform-3d/DeckStack.tsx', 'kit/DataTable.tsx', 'looks/LookScope.tsx'],
          Component: OffshorePlatform3dIsolated,
        },
        {
          id: 'OffshorePlatform3dWall',
          title: 'Wall screen, state per deck',
          note: 'Pick it for the screen everyone passes: each deck is a tile filled with its state, stacked like the platform beside it.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['three/scenes/OffshorePlatform.tsx', 'three/scenes/StillScene.tsx', 'kit/Stat.tsx', 'looks/LookScope.tsx'],
          Component: OffshorePlatform3dWall,
        },
      ],
    },
    {
      id: 'parts',
      title: 'Parts',
      description: 'The rail, the table and the two lower panels on their own, the separation control with a stack to try it on, and three platform models.',
      specimens: [
        {
          id: 'OffshorePlatform3dPartDecks',
          title: 'Deck selector rail',
          note: 'Pick it to choose a level of a stacked structure: elevation, people and open alarms on each block.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['kit/offshore-platform-3d/DeckStack.tsx', 'kit/Panel.tsx', 'kit/StatusPill.tsx'],
          Component: OffshorePlatform3dPartDecks,
        },
        {
          id: 'OffshorePlatform3dPartTable',
          title: 'Equipment table',
          note: 'Pick it as the keyboard path to every unit: status-banded rows, the tag is the button.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['kit/DataTable.tsx', 'kit/Panel.tsx', 'kit/StatusPill.tsx', 'kit/TagId.tsx'],
          Component: OffshorePlatform3dPartTable,
        },
        {
          id: 'OffshorePlatform3dPartFaceplate',
          title: 'Faceplate',
          note: 'Pick it for one unit: its state as a block, the note from the log and three readings with their trend.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['kit/Panel.tsx', 'kit/StatusPill.tsx', 'kit/SparkLine.tsx'],
          Component: OffshorePlatform3dPartFaceplate,
        },
        {
          id: 'OffshorePlatform3dPartStatus',
          title: 'Platform status',
          note: 'Pick it as the resting state of the faceplate slot: people on board and open alarms by class.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['kit/Panel.tsx', 'kit/Meter.tsx', 'kit/StatusPill.tsx'],
          Component: OffshorePlatform3dPartStatus,
        },
        {
          id: 'OffshorePlatform3dPartExplode',
          title: 'Separation control',
          note: 'Pick it for any exploded view: one button for all or nothing, a slider for anything between.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['three/scenes/explode.ts', 'three/scenes/ExplodeLift.tsx', 'three/scenes/DeckModule.tsx', 'three/scenes/platformState.ts', 'three/TurntableStage.tsx'],
          Component: OffshorePlatform3dPartExplode,
        },
        {
          id: 'OffshorePlatform3dPartJacket',
          title: 'Jacket',
          note: 'Pick it as the base of a fixed platform: battered legs, bracing and risers down to the seabed.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['three/scenes/PlatformJacket.tsx', 'three/TurntableStage.tsx', 'three/scenes/StillScene.tsx'],
          Component: OffshorePlatform3dPartJacket,
        },
        {
          id: 'OffshorePlatform3dPartDerrick',
          title: 'Derrick',
          note: 'Pick it as the landmark of a drilling platform, so every view has an obvious up and front.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['three/scenes/Derrick.tsx', 'three/TurntableStage.tsx', 'three/scenes/StillScene.tsx'],
          Component: OffshorePlatform3dPartDerrick,
        },
        {
          id: 'OffshorePlatform3dPartQuarters',
          title: 'Quarters and helideck',
          note: 'Pick it to mark where people are: the accommodation block with the helideck on its roof.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['three/scenes/LivingQuarters.tsx', 'three/scenes/Helideck.tsx', 'three/TurntableStage.tsx', 'three/scenes/StillScene.tsx'],
          Component: OffshorePlatform3dPartQuarters,
        },
      ],
    },
  ],
});
