import { Button } from '@cognite/aura/components/button';
import { SegmentedControl, SegmentedControlButton, SegmentedControlList } from '@cognite/aura/components/segmented-control';
import { Slider } from '@cognite/aura/components/slider';
import { IconArrowLeft, IconArrowRight, IconChevronRight, IconPlayerPlay, IconRoute, IconShip, IconSnowflake, IconWorld } from '@cognite/aura/icons';
import { useReducer, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { AppFrame, type AppFrameNavItem } from '../../../library/kit/AppFrame';
import { Canvas } from '../../../library/kit/Canvas';
import { IconChip } from '../../../library/kit/IconChip';
import { Legend } from '../../../library/kit/Legend';
import { Panel } from '../../../library/kit/Panel';
import { SceneStage } from '../../../library/kit/scene/SceneStage';
import { ToggleChip } from '../../../library/kit/scene/ToggleChip';
import { StatusPill } from '../../../library/kit/StatusPill';
import { TagId } from '../../../library/kit/TagId';
import { formatNumber, type StatusTone } from '../../../library/kit/tones';
import { TrendLine } from '../../../library/kit/TrendLine';
import { LookScope } from '../../../library/looks/LookScope';
import { ContainmentTank } from '../../../library/three/plants/ContainmentTank';
import { CryogenicExchanger } from '../../../library/three/plants/CryogenicExchanger';
import { LngCarrier } from '../../../library/three/plants/LngCarrier';
import { LngSite } from '../../../library/three/plants/LngSite';
import type { LngLine, LngRack, LngUnitStatus } from '../../../library/three/plants/LngSite';
import type { LngUnit } from '../../../library/three/plants/lngSite';
import { LoadingArms } from '../../../library/three/plants/LoadingArms';
import { CRYOGENIC_EXCHANGER_SIZE, containmentTankSize, lngCarrierSize } from '../../../library/three/plants/plantSizes';
import { TemperatureRail } from '../../../library/three/plants/TemperatureRail';
import { TEMPERATURE_RAMP_TOKENS, TEMPERATURE_RAMP_VARS, formatTemperature, temperatureFraction, temperatureGradient, temperatureRampKey } from '../../../library/three/plants/temperatureRamp';
import type { TemperatureScale } from '../../../library/three/plants/temperatureRamp';
import { initialTourState, tourCameraTarget, tourFlightTarget, tourReducer, tourStopFor } from '../../../library/three/plants/tourState';
import type { TourAction, TourState, TourStop } from '../../../library/three/plants/tourState';
import { SceneCanvas } from '../../../library/three/SceneCanvas';
import { Jetty } from '../../../library/three/scenes/Jetty';
import { StillScene } from '../../../library/three/scenes/StillScene';
import { TurntableStage } from '../../../library/three/TurntableStage';
import { useTokenColors } from '../../../library/three/useTokenColors';
import { definePage } from '../../types';

import source from './lng-train-3d.tsx?raw';

type LngTrain3dColourBy = 'status' | 'temperature';

type LngTrain3dFigure = { label: string; value: number; unit: string; decimals: number; tone?: StatusTone };

type LngTrain3dStage = {
  id: string;
  label: string;
  title: string;
  blurb: string;
  /** Process temperature at this stop in °C. */
  temperature: number;
  figures: readonly LngTrain3dFigure[];
  stop: TourStop;
};

const LNGTRAIN3D_SCALE: TemperatureScale = { warm: 30, cold: -162 };
const LNGTRAIN3D_TICKS: readonly number[] = [30, -30, -90, -162];

/** The tour: five stops along the process, each with where the camera stands. */
const LNGTRAIN3D_STAGES: readonly LngTrain3dStage[] = [
  {
    id: 'inlet',
    label: 'Inlet',
    title: 'Inlet facilities',
    blurb: 'Feed gas arrives by pipeline with water and condensate in it. The slug catcher lets liquid slugs settle out; the inlet separator splits what is left into gas, condensate and water.',
    temperature: 28,
    figures: [
      { label: 'Feed gas', value: 18.4, unit: 'MSm³/d', decimals: 1 },
      { label: 'Inlet pressure', value: 118, unit: 'barg', decimals: 0 },
      { label: 'Slug volume held', value: 142, unit: 'm³', decimals: 0 },
    ],
    stop: { focus: [-112, 5, -6], distance: 92, azimuth: 38, elevation: 28 },
  },
  {
    id: 'treatment',
    label: 'Treatment',
    title: 'Gas treatment',
    blurb: 'Carbon dioxide and water would freeze solid long before the gas turns liquid. An amine absorber takes out the acid gas, and dehydration beds dry the gas to less than one part per million.',
    temperature: 4,
    figures: [
      { label: 'CO₂ in treated gas', value: 38, unit: 'ppm', decimals: 0 },
      { label: 'Water content', value: 0.6, unit: 'ppm', decimals: 1 },
      { label: 'Amine circulation', value: 410, unit: 'm³/h', decimals: 0 },
    ],
    stop: { focus: [-64, 8, -22], distance: 118, azimuth: 36, elevation: 30 },
  },
  {
    id: 'liquefaction',
    label: 'Liquefaction',
    title: 'Liquefaction',
    blurb: 'Refrigerant compressors, cooled by banks of air coolers, drive the cycle in the main cryogenic heat exchanger. Gas rises through the cold tower and leaves as liquid at minus 162 degrees.',
    temperature: -162,
    figures: [
      { label: 'Compressor power', value: 62, unit: 'MW', decimals: 0 },
      { label: 'LNG production', value: 560, unit: 't/h', decimals: 0 },
      { label: 'Cold end outlet', value: -161.4, unit: '°C', decimals: 1 },
    ],
    stop: { focus: [-32, 14, 4], distance: 190, azimuth: 24, elevation: 30 },
  },
  {
    id: 'storage',
    label: 'Storage',
    title: 'LNG storage',
    blurb: 'Two full-containment tanks hold the liquid at atmospheric pressure. Heat leaking in boils off a little gas, which is compressed and sent back into the process.',
    temperature: -162,
    figures: [
      { label: 'Tank 601 level', value: 62, unit: '%', decimals: 0 },
      { label: 'Tank 602 level', value: 92, unit: '%', decimals: 0, tone: 'warning' },
      { label: 'Boil-off rate', value: 0.05, unit: '%/d', decimals: 2 },
    ],
    stop: { focus: [66, 10, -4], distance: 215, azimuth: 36, elevation: 28 },
  },
  {
    id: 'loading',
    label: 'Loading',
    title: 'Jetty and loading',
    blurb: 'LNG runs out along the trestle to the berth, where marine loading arms connect to the carrier. The ship fills its spherical tanks while vapour returns ashore.',
    temperature: -160,
    figures: [
      { label: 'Carrier loaded', value: 64, unit: '%', decimals: 0 },
      { label: 'Loading rate', value: 10000, unit: 'm³/h', decimals: 0 },
      { label: 'Arms connected', value: 3, unit: 'of 4', decimals: 0 },
    ],
    stop: { focus: [160, 6, -4], distance: 175, azimuth: 66, elevation: 26 },
  },
];

const LNGTRAIN3D_OVERVIEW: TourStop = { focus: [14, 4, 0], distance: 400, azimuth: 26, elevation: 32 };

const LNGTRAIN3D_UNITS: readonly LngUnit[] = [
  { id: '20-sc-001', kind: 'slug-catcher', tag: '20-SC-001', name: 'Slug catcher', stageId: 'inlet', position: [-112, 0, -34], temperature: 28, count: 6, landmark: true },
  { id: '20-va-010', kind: 'separator', tag: '20-VA-010', name: 'Inlet separator', stageId: 'inlet', position: [-112, 0, 22], temperature: 26 },
  { id: '24-ca-101', kind: 'column', tag: '24-CA-101', name: 'Acid gas absorber', stageId: 'treatment', position: [-76, 0, -34], temperature: 38, height: 32 },
  { id: '26-va-201', kind: 'vessel', tag: '26-VA-201', name: 'Dehydration bed A', stageId: 'treatment', position: [-58, 0, -34], temperature: 4, height: 14 },
  { id: '26-va-202', kind: 'vessel', tag: '26-VA-202', name: 'Dehydration bed B', stageId: 'treatment', position: [-48, 0, -34], temperature: 4, height: 14 },
  { id: '30-hx-301', kind: 'mche', tag: '30-HX-301', name: 'Main cryogenic exchanger', stageId: 'liquefaction', position: [-22, 0, -36], temperature: -150, height: 44, landmark: true },
  { id: '32-gt-401', kind: 'turbine', tag: '32-GT-401', name: 'Refrigerant driver 1', stageId: 'liquefaction', position: [-62, 0, 20], temperature: 40 },
  { id: '32-ka-401', kind: 'compressor', tag: '32-KA-401', name: 'Refrigerant compressor 1', stageId: 'liquefaction', position: [-47, 0, 20], temperature: 40 },
  { id: '32-gt-402', kind: 'turbine', tag: '32-GT-402', name: 'Refrigerant driver 2', stageId: 'liquefaction', position: [-62, 0, 36], temperature: 40 },
  { id: '32-ka-402', kind: 'compressor', tag: '32-KA-402', name: 'Refrigerant compressor 2', stageId: 'liquefaction', position: [-47, 0, 36], temperature: 40 },
  { id: '33-ea-501', kind: 'cooler-bank', tag: '33-EA-501', name: 'Refrigerant air coolers A', stageId: 'liquefaction', position: [-4, 0, 32], temperature: 45, count: 8 },
  { id: '33-ea-502', kind: 'cooler-bank', tag: '33-EA-502', name: 'Refrigerant air coolers B', stageId: 'liquefaction', position: [-4, 0, 47], temperature: 45, count: 8 },
  { id: '50-tk-601', kind: 'tank', tag: '50-TK-601', name: 'LNG tank 1', stageId: 'storage', position: [62, 0, -38], temperature: -162, fill: 0.62, landmark: true },
  { id: '50-tk-602', kind: 'tank', tag: '50-TK-602', name: 'LNG tank 2', stageId: 'storage', position: [62, 0, 32], temperature: -162, fill: 0.92 },
  { id: '60-xa-701', kind: 'loading-arms', tag: '60-XA-701', name: 'Marine loading arms', stageId: 'loading', position: [164, 0, -4], temperature: -160, count: 4, connected: 3 },
  { id: 'carrier', kind: 'carrier', tag: 'LNGC Fjordvind', name: 'LNG carrier', stageId: 'loading', position: [178, 0, -4], rotationY: Math.PI / 2, temperature: -162, landmark: true },
  { id: '90-fl-001', kind: 'flare', tag: '90-FL-001', name: 'Flare', stageId: null, position: [104, 0, -66], temperature: null, height: 36 },
  { id: '95-cr-001', kind: 'control-room', tag: '95-CR-001', name: 'Control building', stageId: null, position: [112, 0, 42], temperature: null },
  { id: '94-bu-001', kind: 'building', tag: '94-BU-001', name: 'Substation', stageId: null, position: [112, 0, 58], temperature: null },
];

const LNGTRAIN3D_RACKS: readonly LngRack[] = [{ id: 'spine', position: [0, 0, -4], length: 280 }];

const LNGTRAIN3D_LINES: readonly LngLine[] = [
  { id: 'feed', points: [[-146, 5.8, -4], [-130, 5.8, -4]] },
  { id: 'rundown', points: [[80, 5.8, -4], [140, 5.8, -4], [158, 5, -4]] },
];

const LNGTRAIN3D_STATUSES: Readonly<Record<string, LngUnitStatus>> = {
  '33-ea-502': { tone: 'warning', shape: 'square', text: 'Fan 6 fault' },
  '50-tk-602': { tone: 'warning', shape: 'square', text: '92 % · high level' },
  '32-ka-402': { tone: 'neutral', shape: 'ring', text: 'Standby' },
  carrier: { tone: 'info', shape: 'dot', text: 'Loading 64 %' },
};

function lngTrain3dIsColourBy(value: unknown): value is LngTrain3dColourBy {
  return value === 'status' || value === 'temperature';
}

function lngTrain3dStageOfUnit(unit: LngUnit): number {
  return LNGTRAIN3D_STAGES.findIndex((stage) => stage.id === unit.stageId);
}

function lngTrain3dTarget(state: TourState, zoom = 1.12) {
  const stop = tourStopFor(state, LNGTRAIN3D_STAGES.map((stage) => stage.stop), LNGTRAIN3D_OVERVIEW);
  return tourFlightTarget(tourCameraTarget(stop, zoom), state.flights);
}

function lngTrain3dReadings(state: TourState): { temperature: number | null; subject: string } {
  const stage = LNGTRAIN3D_STAGES[state.stageIndex];
  if (!stage) return { temperature: null, subject: 'the whole site' };
  const unit = LNGTRAIN3D_UNITS.find((candidate) => candidate.id === state.selectedUnitId);
  return { temperature: unit?.temperature ?? stage.temperature, subject: unit ? unit.tag : stage.title };
}


/** The site without its always-moving parts: the flare flame flickers for as long as it is drawn. */
const LNGTRAIN3D_QUIET_UNITS: readonly LngUnit[] = LNGTRAIN3D_UNITS.filter((unit) => unit.kind !== 'flare');

const LNGTRAIN3D_FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring-default)]';

const LNGTRAIN3D_NAV: AppFrameNavItem[] = [
  { id: 'tour', label: 'Process tour', icon: <IconRoute /> },
  { id: 'site', label: 'Site', icon: <IconWorld /> },
  { id: 'cold', label: 'Cold chain', icon: <IconSnowflake /> },
  { id: 'cargo', label: 'Cargo', icon: <IconShip />, badge: '1' },
];

/** The ramp colour a temperature plots in, as a CSS value, so a swatch always matches the scene. */
function lngTrain3dSwatch(temperature: number): string {
  return TEMPERATURE_RAMP_VARS[temperatureRampKey(temperature, LNGTRAIN3D_SCALE)];
}

function lngTrain3dStatusTone(unit: LngUnit): StatusTone | undefined {
  const tone = LNGTRAIN3D_STATUSES[unit.id]?.tone;
  return tone === 'warning' || tone === 'info' || tone === 'neutral' || tone === 'critical' || tone === 'success' ? tone : undefined;
}

function LngTrain3dFallbackList() {
  return (
    <ul className="flex flex-col gap-2 rounded-xl border border-default bg-card-background p-4">
      {LNGTRAIN3D_STAGES.map((stage) => (
        <li key={stage.id} className="flex items-baseline justify-between gap-4 text-sm">
          <span className="text-base-foreground">{stage.title}</span>
          <span className="tabular-nums text-medium-foreground">{formatTemperature(stage.temperature)}</span>
        </li>
      ))}
    </ul>
  );
}

function LngTrain3dColourSwitch({ value, onChange }: { value: LngTrain3dColourBy; onChange: (value: LngTrain3dColourBy) => void }) {
  return (
    <SegmentedControl
      value={value}
      onValueChange={(next) => {
        if (lngTrain3dIsColourBy(next)) onChange(next);
      }}
    >
      <SegmentedControlList size="small" aria-label="Colour the site by">
        <SegmentedControlButton value="status">Status</SegmentedControlButton>
        <SegmentedControlButton value="temperature">Temperature</SegmentedControlButton>
      </SegmentedControlList>
    </SegmentedControl>
  );
}

function LngTrain3dLegend({ colourBy }: { colourBy: LngTrain3dColourBy }) {
  if (colourBy === 'status') {
    return (
      <Legend
        items={[
          { label: 'Warning', tone: 'warning' },
          { label: 'Information', tone: 'info' },
          { label: 'Standby', tone: 'neutral' },
        ]}
      />
    );
  }
  return (
    <div role="group" aria-label="Temperature legend" className="flex items-center gap-3 text-sm tabular-nums text-[color:var(--kit-text-2)]">
      <span>{formatTemperature(LNGTRAIN3D_SCALE.warm)}</span>
      <span aria-hidden="true" className="h-2.5 w-48 rounded-full" style={{ background: temperatureGradient('to right') }} />
      <span>{formatTemperature(LNGTRAIN3D_SCALE.cold)}</span>
    </div>
  );
}

type LngTrain3dSceneProps = {
  state: TourState;
  dispatch: (action: TourAction) => void;
  colourBy: LngTrain3dColourBy;
  insets?: { top?: number; right?: number; bottom?: number; left?: number };
  still?: boolean;
  /** Continuous motion: flow along the trunk lines and the lit flare. Off, the scene only renders when something changes. */
  live?: boolean;
  /** Multiplier on the camera distance of every stop, for narrow frames. */
  zoom?: number;
  /** Corner content over the scene. */
  overlay?: ReactNode;
  className?: string;
};

/** The site in 3D inside a stage; grabbing it leaves the tour. */
function LngTrain3dScene({ state, dispatch, colourBy, insets, still = false, live = false, zoom, overlay, className }: LngTrain3dSceneProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const ramp = useTokenColors(TEMPERATURE_RAMP_TOKENS, rootRef);
  const rampColors = ramp ? { step0: ramp.step0.color, step1: ramp.step1.color, step2: ramp.step2.color, step3: ramp.step3.color, step4: ramp.step4.color } : null;
  const stage = LNGTRAIN3D_STAGES[state.stageIndex];
  const selectId = (id: string) => {
    const unit = LNGTRAIN3D_UNITS.find((candidate) => candidate.id === id);
    const index = unit ? lngTrain3dStageOfUnit(unit) : -1;
    if (index >= 0) dispatch({ type: 'goTo', stageIndex: index, unitId: id });
  };

  return (
    <div
      ref={rootRef}
      data-stage={stage?.id ?? 'overview'}
      data-mode={state.mode}
      onPointerDownCapture={(event) => {
        // Grabbing the scene leaves the tour; the camera keeps wherever the user takes it.
        if (event.target instanceof HTMLCanvasElement) dispatch({ type: 'detach' });
      }}
      onWheelCapture={(event) => {
        if (event.target instanceof HTMLCanvasElement) dispatch({ type: 'detach' });
      }}
      className={className}
    >
      <SceneStage className="h-full" overlay={overlay}>
        <SceneCanvas
          label={`3D model of the Nordkapp LNG train, ${stage ? `at stop ${state.stageIndex + 1}, ${stage.title}` : 'overview of the whole site'}, coloured by ${colourBy}`}
          fallback={<LngTrain3dFallbackList />}
          camera={{ position: [180, 200, 330], fov: 38, far: 3000 }}
        >
          <StillScene still={still}>
            <LngSite
              units={live ? LNGTRAIN3D_UNITS : LNGTRAIN3D_QUIET_UNITS}
              racks={LNGTRAIN3D_RACKS}
              lines={live ? LNGTRAIN3D_LINES : []}
              land={{ center: [0, 0], size: [290, 170] }}
              sea={{ center: [215, 0], size: [150, 170], level: 0 }}
              target={lngTrain3dTarget(state, zoom)}
              insets={insets}
              activeStageId={stage?.id ?? null}
              selectedUnitId={state.selectedUnitId}
              onSelect={selectId}
              colourBy={colourBy}
              statuses={LNGTRAIN3D_STATUSES}
              rampColors={rampColors}
              scale={LNGTRAIN3D_SCALE}
            >
              <Jetty position={[138, 0, -4]} length={26} />
            </LngSite>
          </StillScene>
        </SceneCanvas>
      </SceneStage>
    </div>
  );
}

function LngTrain3dTemperatureChip({ temperature }: { temperature: number }) {
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap font-semibold tabular-nums">
      <span aria-hidden="true" className="size-3 rounded-full ring-2 ring-[color:var(--kit-surface)]" style={{ background: lngTrain3dSwatch(temperature) }} />
      {formatTemperature(temperature)}
    </span>
  );
}

type LngTrain3dStripProps = { state: TourState; dispatch: (action: TourAction) => void; compact?: boolean };

/** The process strip: one card per stop in process order, the current one raised, with the way forward and back. */
function LngTrain3dStrip({ state, dispatch, compact = false }: LngTrain3dStripProps) {
  const following = state.mode === 'tour';

  return (
    <nav aria-label="Process, stop by stop" className="flex items-stretch gap-3">
      <Button variant="outline" size="icon" aria-label="Previous stop" disabled={state.stageIndex <= -1 && following} onClick={() => dispatch({ type: 'previous' })} className="self-center">
        <IconArrowLeft />
      </Button>
      <ol className="grid min-w-0 flex-1 grid-cols-5 gap-2">
        {LNGTRAIN3D_STAGES.map((stage, index) => {
          const current = index === state.stageIndex;
          const passed = index < state.stageIndex;
          const figure = stage.figures[0];
          return (
            <li key={stage.id} className="relative flex min-w-0">
              <button
                type="button"
                aria-current={current ? 'step' : undefined}
                onClick={() => dispatch({ type: 'goTo', stageIndex: index })}
                className={`flex min-w-0 flex-1 flex-col gap-2 rounded-[var(--kit-radius-sm)] border text-left transition-[translate,box-shadow] ${compact ? 'p-2.5' : 'p-3.5'} ${LNGTRAIN3D_FOCUS} ${
                  current
                    ? '-translate-y-1.5 border-transparent bg-[var(--primary-background)] text-[color:var(--primary-foreground)] shadow-[0_16px_28px_-14px_var(--primary-background)]'
                    : 'border-[color:var(--kit-rule)] bg-[var(--kit-surface)] text-[color:var(--kit-text)] hover:border-[color:var(--kit-rule-strong)]'
                }`}
              >
                <span className={compact ? 'flex flex-col gap-1.5' : 'flex items-center gap-2'}>
                  <span
                    aria-hidden="true"
                    className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums ${
                      current ? 'bg-[var(--primary-foreground)] text-[color:var(--primary-background)]' : passed ? 'bg-[var(--kit-text)] text-[color:var(--kit-surface)]' : 'bg-[var(--kit-track)] text-[color:var(--kit-text-2)]'
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span className={`min-w-0 text-sm font-semibold ${compact ? '' : 'truncate'}`}>{stage.label}</span>
                </span>
                <span className={`leading-none tracking-tight ${compact ? 'mt-auto text-base' : 'text-2xl'}`}>
                  <LngTrain3dTemperatureChip temperature={stage.temperature} />
                </span>
                {compact ? null : (
                  <span className={`text-xs ${current ? 'opacity-90' : 'text-[color:var(--kit-text-2)]'}`}>
                    {figure.label}{' '}
                    <span className="font-semibold tabular-nums">
                      {formatNumber(figure.value, figure.decimals)} {figure.unit}
                    </span>
                  </span>
                )}
              </button>
              {index < LNGTRAIN3D_STAGES.length - 1 ? <IconChevronRight aria-hidden="true" className="absolute -right-[0.8125rem] top-1/2 z-10 size-4 -translate-y-1/2 text-[color:var(--kit-text-3)]" /> : null}
            </li>
          );
        })}
      </ol>
      <Button variant="outline" size="icon" aria-label="Next stop" disabled={state.stageIndex >= LNGTRAIN3D_STAGES.length - 1 && following} onClick={() => dispatch({ type: 'next' })} className="self-center">
        <IconArrowRight />
      </Button>
    </nav>
  );
}

function LngTrain3dUnitRow({ unit, selected, colourBy, onSelect }: { unit: LngUnit; selected: boolean; colourBy: LngTrain3dColourBy; onSelect: () => void }) {
  const status = LNGTRAIN3D_STATUSES[unit.id];
  const tone = lngTrain3dStatusTone(unit);

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={`flex w-full items-center justify-between gap-3 rounded-[var(--kit-radius-sm)] border border-transparent px-3 py-1.5 text-left hover:bg-[var(--kit-well)] aria-pressed:border-[var(--primary-background)] aria-pressed:bg-[color-mix(in_oklab,var(--primary-background)_8%,transparent)] ${LNGTRAIN3D_FOCUS}`}
    >
      <span className="flex min-w-0 items-baseline gap-2">
        <span className="truncate text-sm font-medium text-[color:var(--kit-text)]">{unit.name}</span>
        <span className="shrink-0 text-xs text-[color:var(--kit-text-3)]">
          <TagId>{unit.tag}</TagId>
        </span>
      </span>
      {colourBy === 'temperature' && unit.temperature !== null ? (
        <span className="shrink-0 text-sm text-[color:var(--kit-text)]">
          <LngTrain3dTemperatureChip temperature={unit.temperature} />
        </span>
      ) : status && tone ? (
        <StatusPill tone={tone}>{status.text}</StatusPill>
      ) : (
        <span className="shrink-0 text-xs text-[color:var(--kit-text-3)]">Normal</span>
      )}
    </button>
  );
}

type LngTrain3dStageCardProps = { state: TourState; dispatch: (action: TourAction) => void; colourBy: LngTrain3dColourBy; className?: string };

/** What the current stop is: the plain-language explanation, three figures and the units standing there. */
function LngTrain3dStageCard({ state, dispatch, colourBy, className }: LngTrain3dStageCardProps) {
  const stage = LNGTRAIN3D_STAGES[state.stageIndex];
  if (!stage) {
    return (
      <Panel
        className={className}
        title="The whole site"
        subtitle="Nordkapp LNG, train 1"
        icon={
          <IconChip tone="accent">
            <IconWorld />
          </IconChip>
        }
      >
        <div className="flex flex-1 flex-col gap-4">
          <p className="text-sm text-[color:var(--kit-text-2)]">Gas comes in from the west at 28 °C and leaves for the carrier in the east as liquid at −162 °C. Five stops follow it through the plant.</p>
          <dl className="grid grid-cols-3 gap-3">
            {[
              { label: 'Feed gas', value: '18.4', unit: 'MSm³/d' },
              { label: 'LNG made', value: '560', unit: 't/h' },
              { label: 'Carrier', value: '64', unit: '% loaded' },
            ].map((item) => (
              <div key={item.label} className="flex flex-col">
                <dt className="text-xs text-[color:var(--kit-text-3)]">{item.label}</dt>
                <dd className="text-2xl font-semibold tracking-tight tabular-nums text-[color:var(--kit-text)]">{item.value}</dd>
                <dd className="text-xs text-[color:var(--kit-text-2)]">{item.unit}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-auto">
            <Button onClick={() => dispatch({ type: 'goTo', stageIndex: 0 })}>
              <IconPlayerPlay /> Start at the inlet
            </Button>
          </div>
        </div>
      </Panel>
    );
  }
  const units = LNGTRAIN3D_UNITS.filter((unit) => unit.stageId === stage.id);
  const next = LNGTRAIN3D_STAGES[state.stageIndex + 1];

  return (
    <Panel
      className={className}
      title={stage.title}
      subtitle={`Stop ${state.stageIndex + 1} of ${LNGTRAIN3D_STAGES.length}`}
      icon={
        <span aria-hidden="true" className="flex size-10 items-center justify-center rounded-full bg-[var(--primary-background)] text-base font-semibold tabular-nums text-[color:var(--primary-foreground)]">
          {state.stageIndex + 1}
        </span>
      }
      actions={
        <span className="text-base text-[color:var(--kit-text)]">
          <LngTrain3dTemperatureChip temperature={stage.temperature} />
        </span>
      }
    >
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <p className="text-sm text-[color:var(--kit-text-2)]">{stage.blurb}</p>
        <dl className="grid grid-cols-3 gap-3 border-y border-[color:var(--kit-rule)] py-3">
          {stage.figures.map((figure) => (
            <div key={figure.label} data-tone={figure.tone ?? 'neutral'} className="flex min-w-0 flex-col">
              <dt className="text-xs leading-4 text-[color:var(--kit-text-3)]">{figure.label}</dt>
              <dd className={`text-2xl font-semibold tracking-tight tabular-nums ${figure.tone ? 'text-[color:var(--t-ink)]' : 'text-[color:var(--kit-text)]'}`}>{formatNumber(figure.value, figure.decimals)}</dd>
              <dd className="text-xs text-[color:var(--kit-text-2)]">{figure.unit}</dd>
            </div>
          ))}
        </dl>
        <div className="flex min-h-0 flex-col gap-1">
          <h4 className="text-sm font-semibold text-[color:var(--kit-text)]">Units at this stop</h4>
          <ul className="-mx-3 flex min-h-0 flex-col overflow-y-auto">
            {units.map((unit) => (
              <li key={unit.id}>
                <LngTrain3dUnitRow unit={unit} selected={unit.id === state.selectedUnitId} colourBy={colourBy} onSelect={() => dispatch({ type: 'goTo', stageIndex: state.stageIndex, unitId: unit.id })} />
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-auto flex flex-col gap-2 border-t border-[color:var(--kit-rule)] pt-3">
          <div className="flex items-baseline justify-between text-xs text-[color:var(--kit-text-2)]">
            <span>Process temperature here</span>
            <span className="tabular-nums">
              {formatTemperature(LNGTRAIN3D_SCALE.warm)} to {formatTemperature(LNGTRAIN3D_SCALE.cold)}
            </span>
          </div>
          <div role="img" aria-label={`Process temperature at this stop: ${formatTemperature(stage.temperature)}`} className="relative h-3 rounded-full" style={{ background: temperatureGradient('to right') }}>
            <span
              className="absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-[color:var(--kit-text)] bg-[var(--kit-surface)] shadow-[0_2px_6px_var(--effect-shadow-xl)]"
              style={{ left: `${Math.min(97, Math.max(3, temperatureFraction(stage.temperature, LNGTRAIN3D_SCALE) * 100))}%` }}
            />
          </div>
          {next ? (
            <Button variant="outline" size="sm" onClick={() => dispatch({ type: 'next' })} className="mt-1 w-full">
              Next: {next.title} <IconArrowRight />
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => dispatch({ type: 'overview' })} className="mt-1 w-full">
              <IconWorld /> Back to the whole site
            </Button>
          )}
        </div>
      </div>
    </Panel>
  );
}

/** The corner furniture of the scene: where the camera is, the legend, and the way back into the tour. */
type LngTrain3dSceneOverlayProps = {
  state: TourState;
  dispatch: (action: TourAction) => void;
  colourBy: LngTrain3dColourBy;
  onColourBy?: (value: LngTrain3dColourBy) => void;
  live?: boolean;
  onLive?: (live: boolean) => void;
};

function LngTrain3dSceneOverlay({ state, dispatch, colourBy, onColourBy, live = false, onLive }: LngTrain3dSceneOverlayProps) {
  const stage = LNGTRAIN3D_STAGES[state.stageIndex];
  const chip = 'pointer-events-auto rounded-2xl border border-[color:var(--kit-rule)] bg-[color-mix(in_oklab,var(--card-background)_88%,transparent)] px-3.5 py-2 shadow-[0_6px_16px_-10px_var(--effect-shadow-xl)] backdrop-blur-md';

  return (
    <div className="flex h-full flex-col justify-between p-4">
      <div className="flex items-start justify-between gap-3">
        <p className={`${chip} text-sm text-[color:var(--kit-text)]`}>
          <span className="font-semibold">{stage ? stage.title : 'Whole site'}</span>
          <span className="text-[color:var(--kit-text-2)]"> · {state.mode === 'free' ? 'free view' : stage ? `stop ${state.stageIndex + 1} of ${LNGTRAIN3D_STAGES.length}` : 'overview'}</span>
        </p>
        <div className="pointer-events-auto flex items-center gap-2">
          {state.mode === 'free' ? (
            <Button size="sm" onClick={() => dispatch({ type: 'resume' })}>
              <IconPlayerPlay /> Resume tour
            </Button>
          ) : null}
          <Button variant="outline" size="sm" disabled={state.stageIndex === -1 && state.mode === 'tour'} onClick={() => dispatch({ type: 'overview' })}>
            <IconWorld /> Whole site
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className={chip}>
          <LngTrain3dLegend colourBy={colourBy} />
        </div>
        <div className="pointer-events-auto flex items-center gap-2">
          {onLive ? (
            <ToggleChip icon={<IconPlayerPlay />} pressed={live} onPressedChange={onLive} className="bg-[var(--kit-surface)]">
              Live flow
            </ToggleChip>
          ) : null}
          {onColourBy ? <LngTrain3dColourSwitch value={colourBy} onChange={onColourBy} /> : null}
        </div>
      </div>
    </div>
  );
}

function LngTrain3dSceneFrame({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`overflow-hidden rounded-[var(--kit-radius)] border border-[color:var(--kit-rule)] bg-[var(--kit-well)] shadow-[var(--kit-panel-shadow)] ${className}`}>{children}</div>;
}

function LngTrain3dTour({ initial = 2, still = false }: { initial?: number; still?: boolean }) {
  const [state, dispatch] = useReducer(tourReducer, undefined, () => initialTourState(LNGTRAIN3D_STAGES.length, initial));
  const [colourBy, setColourBy] = useState<LngTrain3dColourBy>('status');
  // Motion that never ends is opt-in; camera flights between stops always animate.
  const [live, setLive] = useState(false);

  return (
    <LookScope look="studio">
      <AppFrame
        variant="topbar"
        brand={{ name: 'Nordkapp LNG', detail: 'Train 1', mark: <IconSnowflake /> }}
        nav={LNGTRAIN3D_NAV}
        current="tour"
        tools={<StatusPill tone="success">At rate · 560 t/h</StatusPill>}
      >
        <div className="flex flex-col gap-[var(--kit-gap)]">
          <div className="grid h-[36rem] grid-cols-[minmax(0,1fr)_23rem] grid-rows-[minmax(0,1fr)] gap-[var(--kit-gap)]">
            <LngTrain3dSceneFrame className="h-full">
              <LngTrain3dScene
                className="h-full"
                state={state}
                dispatch={dispatch}
                colourBy={colourBy}
                insets={{ top: 50, bottom: 50 }}
                still={still}
                live={live}
                overlay={<LngTrain3dSceneOverlay state={state} dispatch={dispatch} colourBy={colourBy} onColourBy={setColourBy} live={live} onLive={still ? undefined : setLive} />}
              />
            </LngTrain3dSceneFrame>
            <LngTrain3dStageCard key={state.stageIndex} state={state} dispatch={dispatch} colourBy={colourBy} className="min-h-0" />
          </div>
          <Panel title="From gas to ship" subtitle="The process in five stops. Pick one and the camera flies there." padding="default">
            <LngTrain3dStrip state={state} dispatch={dispatch} />
          </Panel>
        </div>
      </AppFrame>
    </LookScope>
  );
}

function LngTrainSignature() {
  return <LngTrain3dTour />;
}

/** Another screen of the same product: the cold chain. The site coloured by temperature beside the profile it follows. */
function LngTrainColdChain() {
  const [state, dispatch] = useReducer(tourReducer, undefined, () => initialTourState(LNGTRAIN3D_STAGES.length, -1));
  const { temperature, subject } = lngTrain3dReadings(state);

  return (
    <LookScope look="studio">
      <Canvas className="grid h-[40rem] grid-cols-[10.5rem_minmax(0,1fr)_22rem] grid-rows-[minmax(0,1fr)] gap-[var(--kit-gap)]">
        <Panel title="Temperature" subtitle={temperature === null ? 'Whole site' : subject}>
          <TemperatureRail temperature={temperature} scale={LNGTRAIN3D_SCALE} ticks={LNGTRAIN3D_TICKS} subject={subject} className="min-h-0 flex-1" />
        </Panel>
        <LngTrain3dSceneFrame className="h-full">
          <LngTrain3dScene className="h-full" state={state} dispatch={dispatch} colourBy="temperature" insets={{ top: 50, bottom: 50 }} zoom={1.7} still overlay={<LngTrain3dSceneOverlay state={state} dispatch={dispatch} colourBy="temperature" />} />
        </LngTrain3dSceneFrame>
        <div className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-[var(--kit-gap)]">
          <Panel
            tone="info"
            title="190 degrees colder"
            subtitle="From pipeline to cargo tank"
            icon={
              <IconChip tone="info">
                <IconSnowflake />
              </IconChip>
            }
          >
            <p className="text-sm text-[color:var(--kit-text-2)]">Almost all of the drop happens in one place: the main cryogenic exchanger takes the gas from 4 °C to −162 °C. Everything after it only has to keep the liquid cold.</p>
          </Panel>
          <Panel title="Temperature by stop" subtitle="Process temperature, °C">
            <TrendLine
              label="Process temperature at each of the five stops, from 28 degrees at the inlet to minus 162 at storage"
              labels={LNGTRAIN3D_STAGES.map((stage) => stage.label)}
              series={[{ id: 'temperature', label: 'Process temperature', values: LNGTRAIN3D_STAGES.map((stage) => stage.temperature), tone: 'info' }]}
              limits={[{ value: 0, label: 'Freezing', tone: 'neutral' }]}
              unit="°C"
              yDomain={[-180, 40]}
              height={230}
              highlightLast={false}
              showLegend={false}
            />
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {LNGTRAIN3D_STAGES.map((stage, index) => (
                <li key={stage.id}>
                  <button
                    type="button"
                    aria-pressed={index === state.stageIndex}
                    onClick={() => dispatch({ type: 'goTo', stageIndex: index })}
                    className={`rounded-full border border-[color:var(--kit-rule)] px-3 py-1.5 text-sm font-medium text-[color:var(--kit-text)] hover:border-[color:var(--kit-rule-strong)] aria-pressed:border-transparent aria-pressed:bg-[var(--primary-background)] aria-pressed:text-[color:var(--primary-foreground)] ${LNGTRAIN3D_FOCUS}`}
                  >
                    {stage.label}
                  </button>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </Canvas>
    </LookScope>
  );
}

/** The tour on a tablet: scene on top, the strip without its figures, and the stop below. */
function LngTrainTablet() {
  const [state, dispatch] = useReducer(tourReducer, undefined, () => initialTourState(LNGTRAIN3D_STAGES.length, 4));

  return (
    <LookScope look="studio" className="mx-auto w-full max-w-[48rem]">
      <Canvas className="flex flex-col gap-[var(--kit-gap)]">
        <LngTrain3dSceneFrame className="h-[24rem]">
          <LngTrain3dScene className="h-full" state={state} dispatch={dispatch} colourBy="status" insets={{ top: 50, bottom: 50 }} still overlay={<LngTrain3dSceneOverlay state={state} dispatch={dispatch} colourBy="status" />} />
        </LngTrain3dSceneFrame>
        <LngTrain3dStrip state={state} dispatch={dispatch} compact />
        <LngTrain3dStageCard key={state.stageIndex} state={state} dispatch={dispatch} colourBy="status" />
      </Canvas>
    </LookScope>
  );
}

function LngTrain3dPartStage({ label, children, footer }: { label: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <LookScope look="studio" className="w-full">
      <Canvas className="flex h-[26rem] flex-col gap-3">
        <LngTrain3dSceneFrame className="min-h-0 flex-1">
          <SceneStage className="h-full">
            <SceneCanvas label={label}>
              <StillScene>{children}</StillScene>
            </SceneCanvas>
          </SceneStage>
        </LngTrain3dSceneFrame>
        {footer}
      </Canvas>
    </LookScope>
  );
}

function LngTrainPartStrip() {
  const [state, dispatch] = useReducer(tourReducer, undefined, () => initialTourState(LNGTRAIN3D_STAGES.length, 1));

  return (
    <LookScope look="studio" className="w-full">
      <Canvas className="flex flex-col gap-3">
        <Panel title="From gas to ship" subtitle={state.stageIndex < 0 ? 'Overview' : `Stop ${state.stageIndex + 1}: ${LNGTRAIN3D_STAGES[state.stageIndex].title}`}>
          <LngTrain3dStrip state={state} dispatch={dispatch} />
        </Panel>
      </Canvas>
    </LookScope>
  );
}

function LngTrainPartStageCard() {
  const [state, dispatch] = useReducer(tourReducer, undefined, () => initialTourState(LNGTRAIN3D_STAGES.length, 3));

  return (
    <LookScope look="studio" className="w-full">
      <Canvas className="flex h-[32rem] flex-col">
        <LngTrain3dStageCard key={state.stageIndex} state={state} dispatch={dispatch} colourBy="status" />
      </Canvas>
    </LookScope>
  );
}

function LngTrainPartRail() {
  const [stop, setStop] = useState(1);
  const stage = LNGTRAIN3D_STAGES[stop];

  return (
    <LookScope look="studio" className="w-full">
      <Canvas className="flex h-[32rem] flex-col">
        <Panel title="Temperature" subtitle={stage.title} footer={<Slider aria-label="Tour stop" value={[stop]} min={0} max={LNGTRAIN3D_STAGES.length - 1} step={1} onValueChange={(value) => setStop(value[0] ?? 0)} />}>
          <TemperatureRail temperature={stage.temperature} scale={LNGTRAIN3D_SCALE} ticks={LNGTRAIN3D_TICKS} subject={stage.title} className="min-h-0 flex-1" />
        </Panel>
      </Canvas>
    </LookScope>
  );
}

function LngTrainPartExchanger() {
  return (
    <LngTrain3dPartStage label="Main cryogenic heat exchanger, a tall insulated tower in a steel structure">
      <TurntableStage subjectSize={CRYOGENIC_EXCHANGER_SIZE} padding={1.2}>
        <CryogenicExchanger />
      </TurntableStage>
    </LngTrain3dPartStage>
  );
}

function LngTrainPartTank() {
  const [level, setLevel] = useState(92);

  return (
    <LngTrain3dPartStage
      label={`Full-containment LNG tank with a level gauge showing ${level} percent`}
      footer={
        <div className="flex items-center gap-3">
          <StatusPill tone={level > 90 ? 'warning' : 'success'}>
            {level} % {level > 90 ? '· high level' : ''}
          </StatusPill>
          <Slider aria-label="Tank level" value={[level]} min={0} max={100} step={1} onValueChange={(value) => setLevel(value[0] ?? 0)} />
        </div>
      }
    >
      <TurntableStage subjectSize={containmentTankSize()} padding={1.05}>
        <ContainmentTank fill={level / 100} tone={level > 90 ? 'warning' : undefined} />
      </TurntableStage>
    </LngTrain3dPartStage>
  );
}

function LngTrainPartCarrier() {
  return (
    <LngTrain3dPartStage label="LNG carrier with four spherical tanks at a berth with loading arms">
      <TurntableStage subjectSize={lngCarrierSize()} padding={0.95}>
        <LngCarrier rotation={[0, Math.PI / 2, 0]} position={[0, 0, 0]} />
        <LoadingArms position={[-8, 0, 0]} rotation={[0, 0, 0]} connected={3} />
      </TurntableStage>
    </LngTrain3dPartStage>
  );
}

function LngTrainPartLegends() {
  const [colourBy, setColourBy] = useState<LngTrain3dColourBy>('temperature');

  return (
    <LookScope look="studio" className="w-full">
      <Canvas className="flex h-[32rem] flex-col justify-center gap-5">
        <LngTrain3dColourSwitch value={colourBy} onChange={setColourBy} />
        <div>
          <Panel padding="tight">
            <LngTrain3dLegend colourBy={colourBy} />
          </Panel>
        </div>
        <p className="text-sm text-[color:var(--kit-text-2)]">{colourBy === 'status' ? 'A ring on the ground carries the status; the equipment stays steel.' : 'The ground ring takes the colour of the process temperature at that unit.'}</p>
      </Canvas>
    </LookScope>
  );
}

export default definePage({
  id: 'lng-train-3d',
  title: 'LNG train',
  summary:
    'A whole liquefaction site in 3D with the process laid out as a strip of five stops underneath. Stepping along the strip flies the camera from the inlet to the carrier at the jetty, and the card beside the scene explains each stop in plain words with its figures and units.',
  guidance: {
    use: [
      'For a plant too large to take in at once, where a fixed route teaches the process better than free flight.',
      'With the process as a strip in reading order under the scene, so position in the plant and position in the process are one thing.',
      'With temperature shown twice: a swatch and a number on every stop, never colour alone.',
      'For onboarding, visitor screens and shift briefings.',
    ],
    avoid: [
      'Monitoring one machine: use the compressor digital twin.',
      'Locking the camera. Grabbing the scene leaves the tour, and one button flies back to the stop.',
      'Colouring the equipment itself. Status and temperature are ground rings; steel stays steel.',
      'More than six or seven stops. Past that the strip stops being readable at a glance.',
    ],
  },
  source,
  sections: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description: 'Pick a stop in the strip, or use the arrows, and the camera flies there. Click a unit in the scene or in the card to select it. Drag the scene to look around; Resume tour brings you back. Whole site shows everything at once, and Live flow adds what never stops moving: flow along the trunk lines and the lit flare.',
      specimens: [
        {
          id: 'LngTrainSignature',
          title: 'LNG train',
          note: 'Pick it to walk someone through a large plant in process order, one stop at a time.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: [
            'kit/AppFrame.tsx',
            'kit/Panel.tsx',
            'kit/scene/SceneStage.tsx',
            'kit/StatusPill.tsx',
            'kit/Legend.tsx',
            'looks/LookScope.tsx',
            'three/plants/LngSite.tsx',
            'three/plants/lngSite.ts',
            'three/plants/tourState.ts',
            'three/plants/temperatureRamp.ts',
            'three/scenes/Jetty.tsx',
            'three/SceneCanvas.tsx',
            'three/useTokenColors.ts',
          ],
          Component: LngTrainSignature,
        },
      ],
    },
    {
      id: 'variations',
      title: 'Other screens',
      description: 'The cold chain, where the site is coloured by temperature next to the profile it follows, and the tour on a tablet.',
      specimens: [
        {
          id: 'LngTrainColdChain',
          title: 'Cold chain',
          note: 'Pick it to explain where the cold is made: the whole site by temperature, a thermometer rail and the profile by stop.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['three/plants/LngSite.tsx', 'three/plants/TemperatureRail.tsx', 'three/plants/temperatureRamp.ts', 'kit/TrendLine.tsx', 'kit/Panel.tsx', 'kit/scene/SceneStage.tsx'],
          Component: LngTrainColdChain,
        },
        {
          id: 'LngTrainTablet',
          title: 'Tablet',
          note: 'Pick it for a briefing on a tablet: scene on top, the strip reduced to stop and temperature, the stop explained below.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['three/plants/LngSite.tsx', 'three/plants/tourState.ts', 'kit/Panel.tsx', 'kit/scene/SceneStage.tsx'],
          Component: LngTrainTablet,
        },
      ],
    },
    {
      id: 'parts',
      title: 'Parts',
      description: 'The strip, the stop card, the thermometer and three landmarks of the site.',
      specimens: [
        {
          id: 'LngTrainPartStrip',
          title: 'Process strip',
          note: 'Pick it as the control of a guided tour: one card per stop with its temperature and lead figure, the current one raised.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['three/plants/tourState.ts', 'three/plants/temperatureRamp.ts', 'kit/Panel.tsx'],
          Component: LngTrainPartStrip,
        },
        {
          id: 'LngTrainPartStageCard',
          title: 'Stop card',
          note: 'Pick it to explain a stop: what happens here in plain words, three figures, and the units as buttons.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Panel.tsx', 'kit/StatusPill.tsx', 'kit/TagId.tsx'],
          Component: LngTrainPartStageCard,
        },
        {
          id: 'LngTrainPartRail',
          title: 'Temperature rail',
          note: 'Pick a thermometer rail when one quantity changes along a route; the marker slides and the number is always printed.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          bleed: true,
          uses: ['three/plants/TemperatureRail.tsx', 'three/plants/temperatureRamp.ts', 'kit/Panel.tsx'],
          Component: LngTrainPartRail,
        },
        {
          id: 'LngTrainPartLegends',
          title: 'Colour by',
          note: 'Pick one switch for what the ground rings mean, with the legend changing with it.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Legend.tsx', 'three/plants/temperatureRamp.ts'],
          Component: LngTrainPartLegends,
        },
        {
          id: 'LngTrainPartExchanger',
          title: 'Cryogenic exchanger',
          note: 'Pick it as the landmark of a liquefaction train: the tall cold tower every visitor asks about.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          bleed: true,
          uses: ['three/plants/CryogenicExchanger.tsx', 'three/TurntableStage.tsx', 'kit/scene/SceneStage.tsx'],
          Component: LngTrainPartExchanger,
        },
        {
          id: 'LngTrainPartTank',
          title: 'Containment tank',
          note: 'Pick it for storage: the level shows on the side gauge and a high level takes the warning colour and a word.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          bleed: true,
          uses: ['three/plants/ContainmentTank.tsx', 'three/TurntableStage.tsx', 'kit/StatusPill.tsx'],
          Component: LngTrainPartTank,
        },
        {
          id: 'LngTrainPartCarrier',
          title: 'Carrier at the berth',
          note: 'Pick it for the end of the chain: a carrier with spherical tanks and three of four loading arms connected.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          bleed: true,
          uses: ['three/plants/LngCarrier.tsx', 'three/plants/LoadingArms.tsx', 'three/TurntableStage.tsx'],
          Component: LngTrainPartCarrier,
        },
      ],
    },
  ],
});
