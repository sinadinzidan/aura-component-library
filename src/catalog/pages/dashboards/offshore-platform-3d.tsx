import { Button } from '@cognite/aura/components/button';
import { Switch } from '@cognite/aura/components/switch';
import { IconUsers, IconX } from '@cognite/aura/icons';
import { useReducer, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';

import { Sparkline } from '../../../library/industrial/Sparkline';
import { runStateStatus } from '../../../library/industrial/status';
import type { RunState, Tone } from '../../../library/industrial/status';
import { StatusDot } from '../../../library/industrial/StatusDot';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { ValueReadout } from '../../../library/industrial/ValueReadout';
import { ThemeScope } from '../../../library/themes/ThemeScope';
import { CompressorSkid } from '../../../library/three/CompressorSkid';
import { HorizontalVessel } from '../../../library/three/HorizontalVessel';
import type { PlantNodeStatus } from '../../../library/three/PlantScene';
import { PumpSkid } from '../../../library/three/PumpSkid';
import { SceneCanvas } from '../../../library/three/SceneCanvas';
import { SceneLegend } from '../../../library/three/SceneLegend';
import type { SceneLegendItem } from '../../../library/three/SceneLegend';
import { DeckModule } from '../../../library/three/scenes/DeckModule';
import { Derrick } from '../../../library/three/scenes/Derrick';
import { explodeOffsets } from '../../../library/three/scenes/explode';
import { ExplodeControl } from '../../../library/three/scenes/ExplodeControl';
import { ExplodeLift } from '../../../library/three/scenes/ExplodeLift';
import { FlareBoom } from '../../../library/three/scenes/FlareBoom';
import { Helideck } from '../../../library/three/scenes/Helideck';
import { LivingQuarters } from '../../../library/three/scenes/LivingQuarters';
import { OffshorePlatform } from '../../../library/three/scenes/OffshorePlatform';
import { PedestalCrane } from '../../../library/three/scenes/PedestalCrane';
import { PlatformJacket } from '../../../library/three/scenes/PlatformJacket';
import { findLevel, findPlatformEquipment } from '../../../library/three/scenes/platformLayout';
import type { PlatformLayout } from '../../../library/three/scenes/platformLayout';
import { INITIAL_PLATFORM_STATE, platformDepth, platformReducer } from '../../../library/three/scenes/platformState';
import type { PlatformState } from '../../../library/three/scenes/platformState';
import { StillScene } from '../../../library/three/scenes/StillScene';
import { TurntableStage } from '../../../library/three/TurntableStage';
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
  draught: 5,
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

type Platform3dReading = { label: string; value: number; unit: string; decimals: number; tone?: Tone; seed: number };

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

const PLATFORM3D_LEGEND: readonly SceneLegendItem[] = [
  { kind: 'status', label: 'Tripped', tone: 'critical' },
  { kind: 'status', label: 'Warning', tone: 'warning' },
  { kind: 'status', label: 'Advisory', tone: 'info' },
  { kind: 'status', label: 'Standby', tone: 'neutral' },
  { kind: 'selection', label: 'Selected' },
];

const PLATFORM3D_GLASS = 'border border-default bg-[color-mix(in_oklab,var(--card-background)_82%,transparent)] backdrop-blur-md';

const PLATFORM3D_FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ring-default)]';

function platform3dLevelName(levelId: string): string {
  return findLevel(PLATFORM3D_LAYOUT, levelId)?.name ?? levelId;
}

function platform3dTrend(reading: Platform3dReading): number[] {
  const span = Math.max(Math.abs(reading.value) * 0.06, 0.2);
  const raw = makeValues({ seed: reading.seed, points: 36, base: reading.value, amplitude: reading.value === 0 ? 0 : span, noise: reading.value === 0 ? 0 : span * 0.4, cycles: 1.5, decimals: reading.decimals + 1 });
  const shift = reading.value - raw[raw.length - 1];
  return raw.map((value) => Math.max(0, value + shift));
}

function Platform3dAlarmMarks({ level }: { level: Platform3dManning }) {
  const total = level.critical + level.warning + level.advisory;
  if (total === 0) return <span className="text-xs text-muted-foreground">No alarms</span>;
  return (
    <span className="flex items-center gap-2 text-xs tabular-nums text-medium-foreground">
      {level.critical > 0 ? (
        <span className="flex items-center gap-1">
          <StatusDot tone="critical" shape="diamond" size="sm" label="Critical alarms" />
          {level.critical}
        </span>
      ) : null}
      {level.warning > 0 ? (
        <span className="flex items-center gap-1">
          <StatusDot tone="warning" shape="square" size="sm" label="Warnings" />
          {level.warning}
        </span>
      ) : null}
      {level.advisory > 0 ? (
        <span className="flex items-center gap-1">
          <StatusDot tone="info" shape="dot" size="sm" label="Advisories" />
          {level.advisory}
        </span>
      ) : null}
    </span>
  );
}

function Platform3dDeckSelector({ levelId, onIsolate }: { levelId: string | null; onIsolate: (levelId: string) => void }) {
  return (
    <div role="group" aria-label="Isolate a level" className="flex flex-col gap-1">
      {PLATFORM3D_MANNING.map((level) => {
        const status = PLATFORM3D_STATUSES[level.levelId];
        const name = platform3dLevelName(level.levelId);
        return (
          <button
            key={level.levelId}
            type="button"
            aria-pressed={level.levelId === levelId}
            aria-label={`${name}${status?.text ? `, ${status.text}` : ''}`}
            onClick={() => onIsolate(level.levelId)}
            className={`flex items-center justify-between gap-2 rounded-lg border border-default px-3 py-2 text-left text-sm text-base-foreground hover:border-emphasized aria-pressed:border-[var(--primary-background)] aria-pressed:bg-[color-mix(in_oklab,var(--primary-background)_14%,transparent)] ${PLATFORM3D_FOCUS}`}
          >
            <span className="whitespace-nowrap">{name.replace(' deck', '')}</span>
            {status?.tone ? <StatusDot tone={status.tone} shape={status.shape} size="sm" /> : null}
          </button>
        );
      })}
    </div>
  );
}

function Platform3dManningStrip({ levelId, onIsolate }: { levelId: string | null; onIsolate?: (levelId: string) => void }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-end justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Personnel on board</span>
          <ValueReadout value={PLATFORM3D_ON_BOARD} unit={`of ${PLATFORM3D_BEDS} beds`} size="md" />
        </div>
        <IconUsers aria-hidden="true" className="size-4 text-muted-foreground" />
      </div>
      <ul className="flex flex-col">
        {PLATFORM3D_MANNING.map((level) => {
          const name = platform3dLevelName(level.levelId);
          const row = (
            <>
              <span className="flex items-center justify-between gap-2">
                <span className="text-sm text-base-foreground">{name}</span>
                <span className="flex items-center gap-1 text-sm tabular-nums text-base-foreground">
                  {level.onBoard}
                  <span className="text-xs text-muted-foreground">on board</span>
                </span>
              </span>
              <span className="flex h-1 overflow-hidden rounded-full bg-secondary-background" aria-hidden="true">
                <span className="bg-chart-1-450" style={{ width: `${(level.onBoard / PLATFORM3D_ON_BOARD) * 100}%` }} />
              </span>
              <Platform3dAlarmMarks level={level} />
            </>
          );
          return (
            <li key={level.levelId}>
              {onIsolate ? (
                <button
                  type="button"
                  aria-pressed={level.levelId === levelId}
                  onClick={() => onIsolate(level.levelId)}
                  className={`-mx-1.5 flex w-[calc(100%+0.75rem)] flex-col gap-1.5 rounded-md px-1.5 py-2 text-left hover:bg-secondary-background aria-pressed:bg-secondary-background ${PLATFORM3D_FOCUS}`}
                >
                  {row}
                </button>
              ) : (
                <div className="flex flex-col gap-1.5 py-2">{row}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Platform3dEquipmentList({ levelId, selectedId, onSelect }: { levelId: string; selectedId: string | null; onSelect: (levelId: string, equipmentId: string) => void }) {
  const level = findLevel(PLATFORM3D_LAYOUT, levelId);
  if (!level) return null;
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">Equipment on {level.name.toLowerCase()}</span>
      {level.equipment.length === 0 ? (
        <p className="text-sm text-muted-foreground">No tagged equipment. Next structural inspection 2 Apr.</p>
      ) : (
        <ul className="flex flex-col">
          {level.equipment.map((equipment) => {
            const info = PLATFORM3D_EQUIPMENT[equipment.id];
            const status = PLATFORM3D_STATUSES[equipment.id];
            return (
              <li key={equipment.id}>
                <button
                  type="button"
                  aria-pressed={equipment.id === selectedId}
                  onClick={() => onSelect(level.id, equipment.id)}
                  className={`-mx-1.5 flex w-[calc(100%+0.75rem)] items-center justify-between gap-2 rounded-md px-1.5 py-1.5 text-left hover:bg-secondary-background aria-pressed:bg-secondary-background ${PLATFORM3D_FOCUS}`}
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="font-mono text-xs text-base-foreground">{equipment.tag}</span>
                    <span className="text-xs text-muted-foreground">{info?.name}</span>
                  </span>
                  {status?.tone ? <StatusDot tone={status.tone} shape={status.shape} size="sm" label={status.text} /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Platform3dReadout({ equipmentId, onClose }: { equipmentId: string; onClose?: () => void }) {
  const found = findPlatformEquipment(PLATFORM3D_LAYOUT, equipmentId);
  const info = PLATFORM3D_EQUIPMENT[equipmentId];
  if (!found || !info) return null;
  const lead = info.readings.find((reading) => reading.tone) ?? info.readings[0];

  return (
    <section aria-label={`${found.equipment.tag} readout`} className={`flex flex-col gap-3 rounded-xl px-4 py-3 ${PLATFORM3D_GLASS}`}>
      <div className="flex items-center gap-x-4 gap-y-1">
        <p className="flex min-w-0 flex-wrap items-baseline gap-x-2">
          <span className="font-mono text-sm font-medium text-base-foreground">{found.equipment.tag}</span>
          <span className="text-sm text-medium-foreground">{info.name}</span>
        </p>
        <StatusIndicator {...runStateStatus(info.state)} size="sm" pulse={info.state === 'tripped'} className="shrink-0" />
        <span className="ml-auto hidden min-w-0 truncate text-xs text-muted-foreground @2xl:block">{info.note}</span>
        {onClose ? (
          <Button variant="ghost" size="sm" onClick={onClose} className="ml-auto shrink-0 @2xl:ml-0">
            <IconX /> Close
          </Button>
        ) : null}
      </div>
      <div className="grid grid-cols-[repeat(3,minmax(0,1fr))_minmax(0,1.2fr)] items-end gap-x-4 border-t border-default pt-3">
        {info.readings.map((reading) => (
          <div key={reading.label} className="flex min-w-0 flex-col gap-1">
            <span className="text-xs text-muted-foreground">{reading.label}</span>
            <ValueReadout value={reading.value} unit={reading.unit} decimals={reading.decimals} size="sm" tone={reading.tone ?? 'neutral'} />
          </div>
        ))}
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-xs text-muted-foreground">{lead.label}, 36 h</span>
          <Sparkline values={platform3dTrend(lead)} label={`${lead.label}, last 36 hours`} unit={lead.unit} decimals={lead.decimals} height={24} tone={lead.tone ?? 'neutral'} showLast />
        </div>
      </div>
    </section>
  );
}

function Platform3dFallbackList() {
  return (
    <ul className="flex flex-col gap-2 rounded-lg border border-default bg-card-background p-3">
      {PLATFORM3D_MANNING.map((level) => {
        const status = PLATFORM3D_STATUSES[level.levelId];
        return (
          <li key={level.levelId} className="flex items-center justify-between gap-3 text-sm">
            <span className="text-base-foreground">{platform3dLevelName(level.levelId)}</span>
            <StatusIndicator tone={status?.tone ?? 'neutral'} shape={status?.shape ?? 'ring'} label={status?.text ?? 'No open alarms'} size="sm" className="shrink-0" />
          </li>
        );
      })}
    </ul>
  );
}

function Platform3dExperience({ initial = INITIAL_PLATFORM_STATE, still = false }: { initial?: PlatformState; still?: boolean }) {
  const [state, dispatch] = useReducer(platformReducer, initial);
  const [showLabels, setShowLabels] = useState(true);
  const depth = platformDepth(state);
  const level = state.levelId ? findLevel(PLATFORM3D_LAYOUT, state.levelId) : undefined;
  const selected = state.equipmentId ? findPlatformEquipment(PLATFORM3D_LAYOUT, state.equipmentId) : null;

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
      className="flex h-[46rem] w-full flex-col overflow-hidden rounded-xl border border-default bg-base-background outline-none"
    >
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-default px-4 py-2.5">
        <div className="flex min-w-0 items-baseline gap-3">
          <h3 className="text-sm font-semibold text-base-foreground">Valhall Sør</h3>
          <span className="text-xs text-muted-foreground">Production platform · North Sea</span>
        </div>
        <div className="flex items-center gap-5">
          <StatusIndicator tone="warning" shape="square" label="Reduced export" detail="compressor B tripped" size="sm" />
          <Switch label="Labels" checked={showLabels} onCheckedChange={(checked) => setShowLabels(checked)} />
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside aria-label="Decks and separation" className="flex w-44 shrink-0 flex-col gap-4 border-r border-default p-3">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Decks</span>
            <Platform3dDeckSelector levelId={state.levelId} onIsolate={(levelId) => dispatch({ type: 'isolate', levelId })} />
            <Button variant="ghost" size="sm" disabled={state.levelId === null} onClick={() => dispatch({ type: 'up' })} className="w-full">
              Show all levels
            </Button>
          </div>
          <ExplodeControl amount={state.explode} onAmountChange={(amount) => dispatch({ type: 'setExplode', amount })} onToggle={() => dispatch({ type: 'toggleExplode' })} className="flex-1 border-t border-default pt-4" />
        </aside>

        <div className="relative min-w-0 flex-1">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,color-mix(in_oklab,var(--primary-background)_12%,transparent),transparent_70%)]"
          />
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
                insets={{ bottom: selected ? 140 : 44 }}
              />
            </StillScene>
          </SceneCanvas>

          <div className="pointer-events-none absolute inset-x-3 bottom-3 z-30 flex flex-col gap-2">
            {selected && state.equipmentId ? (
              <div key={state.equipmentId} className="@container pointer-events-auto motion-safe:transition-[opacity,translate] motion-safe:duration-300 motion-safe:starting:translate-y-3 motion-safe:starting:opacity-0">
                <Platform3dReadout equipmentId={state.equipmentId} onClose={() => dispatch({ type: 'clearEquipment' })} />
              </div>
            ) : (
              <p className={`self-start rounded-lg px-3 py-1.5 text-xs text-medium-foreground ${PLATFORM3D_GLASS}`}>
                {level ? (level.equipment.length > 0 ? `Select equipment on the ${level.name.toLowerCase()} to read it.` : 'The jacket carries no tagged equipment.') : 'Separate the decks, or pick one to isolate it.'}
              </p>
            )}
          </div>
        </div>

        <aside aria-label="Personnel and alarms" className="flex w-60 shrink-0 flex-col gap-4 overflow-y-auto border-l border-default p-3">
          <Platform3dManningStrip levelId={state.levelId} onIsolate={(levelId) => dispatch({ type: 'isolate', levelId })} />
          {state.levelId ? (
            <div className="border-t border-default pt-3">
              <Platform3dEquipmentList
                levelId={state.levelId}
                selectedId={state.equipmentId}
                onSelect={(levelId, equipmentId) => dispatch({ type: 'selectEquipment', levelId, equipmentId })}
              />
            </div>
          ) : null}
          <div className="mt-auto border-t border-default pt-3">
            <SceneLegend items={PLATFORM3D_LEGEND} />
          </div>
        </aside>
      </div>
    </div>
  );
}

function Platform3dHologram() {
  return (
    <ThemeScope preset="hologram" className="w-full">
      <Platform3dExperience />
    </ThemeScope>
  );
}

function Platform3dTron() {
  return (
    <ThemeScope preset="tron" className="w-full">
      <Platform3dExperience initial={{ explode: 1, levelId: null, equipmentId: null }} still />
    </ThemeScope>
  );
}

function Platform3dBlueprint() {
  return (
    <ThemeScope preset="blueprint" className="w-full">
      <Platform3dExperience initial={{ explode: 0.6, levelId: 'main', equipmentId: '23-ka-2102' }} still />
    </ThemeScope>
  );
}

function Platform3dStage({ label, children }: { label: string; children: ReactNode }) {
  return (
    <ThemeScope preset="hologram" className="w-full">
      <div className="h-72 w-full overflow-hidden rounded-xl border border-default bg-base-background">
        <SceneCanvas label={label}>
          <StillScene>{children}</StillScene>
        </SceneCanvas>
      </div>
    </ThemeScope>
  );
}

function Platform3dPartJacket() {
  return (
    <Platform3dStage label="Platform jacket with battered legs, cross-bracing and risers">
      <TurntableStage subjectSize={[34, 24, 22]} padding={0.95}>
        <PlatformJacket topSize={[22, 14]} baseSize={[32, 22]} topY={24} bottomY={0} />
      </TurntableStage>
    </Platform3dStage>
  );
}

function Platform3dPartDerrick() {
  return (
    <Platform3dStage label="Drilling derrick on its drill floor">
      <TurntableStage subjectSize={[9, 30, 9]} padding={0.9}>
        <Derrick />
      </TurntableStage>
    </Platform3dStage>
  );
}

function Platform3dPartHelideck() {
  return (
    <Platform3dStage label="Living quarters with a helideck on the roof">
      <TurntableStage subjectSize={[18, 15, 18]} padding={1}>
        <LivingQuarters position={[-2, 0, 0]} />
        <Helideck position={[2.5, 13.7, 0]} />
      </TurntableStage>
    </Platform3dStage>
  );
}

function Platform3dPartDeck() {
  return (
    <Platform3dStage label="Deck module carrying a separator, a compressor and two pumps">
      <TurntableStage subjectSize={[32, 9, 20]} padding={0.85}>
        <group position={[0, 0.7, 0]}>
          <DeckModule size={[30, 7, 18]}>
            <HorizontalVessel position={[-8, 0, -4]} scale={0.8} tone="warning" />
            <CompressorSkid position={[7, 0, -4]} scale={0.8} />
            <PumpSkid position={[-9, 0, 5]} />
            <PumpSkid position={[-3, 0, 5]} />
          </DeckModule>
        </group>
      </TurntableStage>
    </Platform3dStage>
  );
}

function Platform3dPartBooms() {
  return (
    <Platform3dStage label="Flare boom with a lit flare and a pedestal crane on a deck edge">
      <TurntableStage subjectSize={[44, 22, 14]} padding={0.8}>
        <group position={[8, 0.7, 0]}>
          <DeckModule size={[22, 0, 12]} handrail>
            <FlareBoom position={[-11, 1, 0]} rotationY={Math.PI} length={22} />
            <PedestalCrane position={[5, 0, 0]} rotationY={0.4} boom={16} />
          </DeckModule>
        </group>
      </TurntableStage>
    </Platform3dStage>
  );
}

function Platform3dPartExplode() {
  const [amount, setAmount] = useState(0.5);
  const offsets = explodeOffsets(3, amount, 6);

  return (
    <ThemeScope preset="hologram" className="w-full">
      <div className="flex h-80 w-full gap-4 rounded-xl border border-default bg-base-background p-3">
        <ExplodeControl amount={amount} onAmountChange={setAmount} onToggle={() => setAmount(amount > 0.5 ? 0 : 1)} noun="modules" className="w-40 shrink-0" />
        <div className="min-w-0 flex-1">
          <SceneCanvas label={`Three stacked modules, ${Math.round(amount * 100)} percent separated`}>
            <TurntableStage subjectSize={[22, 26, 14]} padding={0.95}>
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
          </SceneCanvas>
        </div>
      </div>
    </ThemeScope>
  );
}

function Platform3dPartDecks() {
  const [levelId, setLevelId] = useState<string | null>('main');
  const toggle = (next: string) => setLevelId(next === levelId ? null : next);

  return (
    <ThemeScope preset="hologram" className="w-full">
      <div className="flex h-80 w-full gap-4 rounded-xl border border-default bg-base-background p-3">
        <div className="flex w-36 shrink-0 flex-col gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Decks</span>
          <Platform3dDeckSelector levelId={levelId} onIsolate={toggle} />
        </div>
        <div className="min-w-0 flex-1 overflow-y-auto border-l border-default pl-4">
          <Platform3dManningStrip levelId={levelId} onIsolate={toggle} />
        </div>
      </div>
    </ThemeScope>
  );
}

function Platform3dPartReadout() {
  return (
    <ThemeScope preset="hologram" className="w-full">
      <div className="@container flex w-full flex-col gap-3 rounded-xl border border-default bg-base-background bg-[radial-gradient(ellipse_at_50%_40%,color-mix(in_oklab,var(--primary-background)_18%,transparent),transparent_70%)] p-4">
        <Platform3dReadout equipmentId="23-ka-2102" />
        <Platform3dReadout equipmentId="20-va-2001" />
      </div>
    </ThemeScope>
  );
}

function Platform3dPartFallback() {
  return (
    <ThemeScope preset="hologram" className="w-full">
      <div className="h-80 w-full overflow-hidden rounded-xl border border-default">
        <SceneCanvas label="3D model of the Valhall Sør platform" forceFallback fallback={<Platform3dFallbackList />}>
          <OffshorePlatform layout={PLATFORM3D_LAYOUT} />
        </SceneCanvas>
      </div>
    </ThemeScope>
  );
}

export default definePage({
  id: 'offshore-platform-3d',
  title: 'Offshore platform',
  summary:
    'A production platform you can take apart. Slide the decks away from each other to see what stands on each one, isolate a deck to walk it, and read any machine from a card docked under the model — with people on board and alarms per deck always in view.',
  guidance: {
    use: [
      'For stacked structures where one level hides the next: platforms, modules, multi-storey process buildings.',
      'When the question is "what is on that deck, and is anyone there": the model answers where, the strips answer who and what.',
      'With the deck buttons and the equipment list as the keyboard path to everything the pointer can reach.',
      'Keep the readout compact and docked, so the model stays the subject.',
    ],
    avoid: [
      'An exploded view of a single-level plant. Nothing is hidden, so nothing is gained.',
      'Labels on every deck at once. Name the levels from afar and the equipment only on the isolated deck.',
      'Hiding the other decks completely. Ghosting them keeps the sense of where the isolated deck sits.',
      'Explode animation that cannot be stopped. It runs once per change and jumps under reduced motion.',
    ],
  },
  source,
  sections: [
    {
      id: 'experience',
      title: 'Experience',
      description:
        'Drag to orbit, scroll to zoom. Use the slider or the button to separate the decks. Pick a deck on the left to isolate it, then click equipment on it to dock its readout. Escape steps back.',
      specimens: [
        {
          id: 'Platform3dHologram',
          title: 'Offshore platform',
          note: 'Pick it when decks hide each other and people need to see inside a stacked installation without losing its shape.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'three/SceneCanvas.tsx',
            'three/scenes/OffshorePlatform.tsx',
            'three/scenes/platformLayout.ts',
            'three/scenes/platformState.ts',
            'three/scenes/explode.ts',
            'three/scenes/ExplodeControl.tsx',
            'three/scenes/ExplodeLift.tsx',
            'three/SceneLegend.tsx',
            'industrial/ValueReadout.tsx',
            'industrial/StatusIndicator.tsx',
            'industrial/Sparkline.tsx',
            'themes/ThemeScope.tsx',
          ],
          Component: Platform3dHologram,
        },
      ],
    },
    {
      id: 'themes',
      title: 'In other themes',
      description: 'The same platform in two more presets, opened in different states and held still. Scene colours are resolved from tokens, so steel, sea and flare follow the theme.',
      specimens: [
        {
          id: 'Platform3dTron',
          title: 'Tron, fully exploded',
          note: 'Pick it for a command wall: cyan structure on near-black with every deck floating clear of the next.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['three/SceneCanvas.tsx', 'three/scenes/OffshorePlatform.tsx', 'three/scenes/StillScene.tsx', 'themes/ThemeScope.tsx'],
          Component: Platform3dTron,
        },
        {
          id: 'Platform3dBlueprint',
          title: 'Blueprint, main deck isolated',
          note: 'Pick it for engineering tools in daylight: a pale drawing-board look with one deck in focus and a machine read out.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['three/SceneCanvas.tsx', 'three/scenes/OffshorePlatform.tsx', 'three/scenes/StillScene.tsx', 'themes/ThemeScope.tsx'],
          Component: Platform3dBlueprint,
        },
      ],
    },
    {
      id: 'parts',
      title: 'Parts',
      description: 'The pieces on their own: structures on a turntable you can drag, the explode control, and the panels around the scene.',
      specimens: [
        {
          id: 'Platform3dPartJacket',
          title: 'Jacket',
          note: 'Pick it as the substructure of any fixed platform; the legs run on below a sea plane.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['three/scenes/PlatformJacket.tsx', 'three/scenes/latticeGeometry.ts', 'three/TurntableStage.tsx'],
          Component: Platform3dPartJacket,
        },
        {
          id: 'Platform3dPartDerrick',
          title: 'Derrick',
          note: 'Pick it as the landmark of a drilling installation; it is a lattice of struts, so it stays light.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['three/scenes/Derrick.tsx', 'three/scenes/LatticeFrame.tsx', 'three/TurntableStage.tsx'],
          Component: Platform3dPartDerrick,
        },
        {
          id: 'Platform3dPartHelideck',
          title: 'Quarters and helideck',
          note: 'Pick them together to mark the safe end of a platform and give the model its orientation.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['three/scenes/Helideck.tsx', 'three/scenes/LivingQuarters.tsx', 'three/TurntableStage.tsx'],
          Component: Platform3dPartHelideck,
        },
        {
          id: 'Platform3dPartDeck',
          title: 'Deck module',
          note: 'Pick it to carry equipment on a level: a plate on girders with columns up to the deck above.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['three/scenes/DeckModule.tsx', 'three/HorizontalVessel.tsx', 'three/CompressorSkid.tsx', 'three/PumpSkid.tsx'],
          Component: Platform3dPartDeck,
        },
        {
          id: 'Platform3dPartBooms',
          title: 'Flare boom and crane',
          note: 'Pick lattice booms for anything cantilevered off a deck edge: flares, cranes, bridges.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['three/scenes/FlareBoom.tsx', 'three/scenes/PedestalCrane.tsx', 'three/scenes/DeckModule.tsx'],
          Component: Platform3dPartBooms,
        },
        {
          id: 'Platform3dPartExplode',
          title: 'Explode control',
          note: 'Pick it for any exploded view: one button for all or nothing, a vertical slider for everything between.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['three/scenes/ExplodeControl.tsx', 'three/scenes/ExplodeLift.tsx', 'three/scenes/explode.ts', 'three/scenes/DeckModule.tsx'],
          Component: Platform3dPartExplode,
        },
        {
          id: 'Platform3dPartDecks',
          title: 'Deck selector and manning',
          note: 'Pick it beside a stacked model: the buttons isolate a level, the strip says who is there and what is alarming.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/StatusDot.tsx', 'industrial/ValueReadout.tsx'],
          Component: Platform3dPartDecks,
        },
        {
          id: 'Platform3dPartReadout',
          title: 'Docked equipment readout',
          note: 'Pick a low, wide card under the model when the detail is three numbers and a trend, not a full inspector.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['industrial/ValueReadout.tsx', 'industrial/StatusIndicator.tsx', 'industrial/Sparkline.tsx'],
          Component: Platform3dPartReadout,
        },
        {
          id: 'Platform3dPartFallback',
          title: 'Without WebGL',
          note: 'Pick a fallback that lists the same levels and their state, so the screen still works where 3D cannot render.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['three/SceneCanvas.tsx', 'industrial/StatusIndicator.tsx'],
          Component: Platform3dPartFallback,
        },
      ],
    },
  ],
});
