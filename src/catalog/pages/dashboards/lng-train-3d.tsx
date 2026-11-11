import { Button } from '@cognite/aura/components/button';
import { SegmentedControl, SegmentedControlButton, SegmentedControlList } from '@cognite/aura/components/segmented-control';
import { Slider } from '@cognite/aura/components/slider';
import { useReducer, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { TONE_VALUE_TEXT, formatValue } from '../../../library/industrial/status';
import type { Tone } from '../../../library/industrial/status';
import { StatusDot } from '../../../library/industrial/StatusDot';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { ValueReadout } from '../../../library/industrial/ValueReadout';
import { ThemeScope } from '../../../library/themes/ThemeScope';
import { HudPanel } from '../../../library/three/HudPanel';
import { AirCoolerBank } from '../../../library/three/plants/AirCoolerBank';
import { ContainmentTank } from '../../../library/three/plants/ContainmentTank';
import { CryogenicExchanger } from '../../../library/three/plants/CryogenicExchanger';
import { LngCarrier } from '../../../library/three/plants/LngCarrier';
import { LngSite } from '../../../library/three/plants/LngSite';
import type { LngLine, LngRack, LngUnitStatus } from '../../../library/three/plants/LngSite';
import type { LngUnit } from '../../../library/three/plants/lngSite';
import { LoadingArms } from '../../../library/three/plants/LoadingArms';
import { CRYOGENIC_EXCHANGER_SIZE, airCoolerBankSize, containmentTankSize, lngCarrierSize, slugCatcherSize } from '../../../library/three/plants/plantSizes';
import { SlugCatcher } from '../../../library/three/plants/SlugCatcher';
import { TemperatureRail } from '../../../library/three/plants/TemperatureRail';
import { TEMPERATURE_RAMP_TOKENS, formatTemperature, temperatureBands, temperatureGradient } from '../../../library/three/plants/temperatureRamp';
import type { TemperatureScale } from '../../../library/three/plants/temperatureRamp';
import { initialTourState, tourCameraTarget, tourFlightTarget, tourReducer, tourStopFor } from '../../../library/three/plants/tourState';
import type { TourState, TourStop } from '../../../library/three/plants/tourState';
import { TourStepper } from '../../../library/three/plants/TourStepper';
import { SceneCanvas } from '../../../library/three/SceneCanvas';
import { SceneLegend } from '../../../library/three/SceneLegend';
import type { SceneLegendItem } from '../../../library/three/SceneLegend';
import { Jetty } from '../../../library/three/scenes/Jetty';
import { StillScene } from '../../../library/three/scenes/StillScene';
import { TurntableStage } from '../../../library/three/TurntableStage';
import { useTokenColors } from '../../../library/three/useTokenColors';
import { definePage } from '../../types';

import source from './lng-train-3d.tsx?raw';

type LngTrain3dColourBy = 'status' | 'temperature';

type LngTrain3dFigure = { label: string; value: number; unit: string; decimals: number; tone?: Tone };

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
    stop: { focus: [66, 10, -4], distance: 142, azimuth: 36, elevation: 26 },
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

const LNGTRAIN3D_STATUS_LEGEND: readonly SceneLegendItem[] = [
  { kind: 'status', label: 'Warning', tone: 'warning' },
  { kind: 'status', label: 'Information', tone: 'info' },
  { kind: 'status', label: 'Standby', tone: 'neutral' },
  { kind: 'selection', label: 'Selected unit' },
  { kind: 'flow', label: 'Flow' },
];

const LNGTRAIN3D_GLASS = 'border border-default bg-[color-mix(in_oklab,var(--card-background)_78%,transparent)] backdrop-blur-md';
const LNGTRAIN3D_FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ring-default)]';

function lngTrain3dIsColourBy(value: unknown): value is LngTrain3dColourBy {
  return value === 'status' || value === 'temperature';
}

function lngTrain3dStageOfUnit(unit: LngUnit): number {
  return LNGTRAIN3D_STAGES.findIndex((stage) => stage.id === unit.stageId);
}

function lngTrain3dTarget(state: TourState) {
  const stop = tourStopFor(state, LNGTRAIN3D_STAGES.map((stage) => stage.stop), LNGTRAIN3D_OVERVIEW);
  return tourFlightTarget(tourCameraTarget(stop, 1.12), state.flights);
}

function lngTrain3dReadings(state: TourState): { temperature: number | null; subject: string } {
  const stage = LNGTRAIN3D_STAGES[state.stageIndex];
  if (!stage) return { temperature: null, subject: 'the whole site' };
  const unit = LNGTRAIN3D_UNITS.find((candidate) => candidate.id === state.selectedUnitId);
  return { temperature: unit?.temperature ?? stage.temperature, subject: unit ? unit.tag : stage.title };
}

function LngTrain3dColourSwitch({ value, onChange }: { value: LngTrain3dColourBy; onChange: (value: LngTrain3dColourBy) => void }) {
  return (
    <div className={`flex items-center gap-2 rounded-lg px-2 py-1 ${LNGTRAIN3D_GLASS}`}>
      <span className="text-xs text-muted-foreground">Colour by</span>
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
    </div>
  );
}

function LngTrain3dLegend({ colourBy }: { colourBy: LngTrain3dColourBy }) {
  if (colourBy === 'status') return <SceneLegend items={LNGTRAIN3D_STATUS_LEGEND} label="Status legend" />;
  const bands = temperatureBands(LNGTRAIN3D_SCALE);
  return (
    <div role="group" aria-label="Temperature legend" className="flex min-w-0 flex-col gap-1">
      <span className="text-xs text-muted-foreground">Ground ring shows process temperature</span>
      <span aria-hidden="true" className="h-2 w-64 max-w-full rounded-full border border-default" style={{ background: temperatureGradient('to right') }} />
      <span className="flex w-64 max-w-full justify-between text-xs tabular-nums text-medium-foreground">
        <span>{formatTemperature(bands[0].from)}</span>
        <span>{formatTemperature(Math.round((bands[2].from + bands[2].to) / 2))}</span>
        <span>{formatTemperature(bands[4].to)}</span>
      </span>
    </div>
  );
}

function LngTrain3dUnitButton({ unit, selected, colourBy, onSelect }: { unit: LngUnit; selected: boolean; colourBy: LngTrain3dColourBy; onSelect: () => void }) {
  const status = LNGTRAIN3D_STATUSES[unit.id];
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={`-mx-1.5 flex w-[calc(100%+0.75rem)] items-center justify-between gap-2 rounded-md px-1.5 py-1 text-left hover:bg-secondary-background aria-pressed:bg-secondary-background ${LNGTRAIN3D_FOCUS}`}
    >
      <span className="flex min-w-0 flex-col">
        <span className="font-mono text-xs text-base-foreground">{unit.tag}</span>
        <span className="truncate text-xs text-muted-foreground">{unit.name}</span>
      </span>
      {colourBy === 'temperature' && unit.temperature !== null ? (
        <span className="shrink-0 text-xs tabular-nums text-medium-foreground">{formatTemperature(unit.temperature)}</span>
      ) : status ? (
        <span className="flex shrink-0 items-center gap-1.5 text-xs text-medium-foreground">
          <StatusDot tone={status.tone} shape={status.shape} size="sm" />
          {status.text}
        </span>
      ) : null}
    </button>
  );
}

function LngTrain3dStageCard({ state, colourBy, onSelectUnit }: { state: TourState; colourBy: LngTrain3dColourBy; onSelectUnit: (unit: LngUnit) => void }) {
  const stage = LNGTRAIN3D_STAGES[state.stageIndex];
  if (!stage) {
    return (
      <HudPanel title="Site overview" meta="5 stops" className="pointer-events-auto w-80 shrink-0 self-start max-h-full">
        <p className="text-sm text-base-foreground">Nordkapp LNG, train 1: gas in from the west, liquid out to the carrier in the east.</p>
        <p className="text-sm text-muted-foreground">Follow the process stop by stop with the tour along the bottom, or click any unit to jump to its stop. Drag to look around on your own.</p>
        <Button size="sm" onClick={() => onSelectUnit(LNGTRAIN3D_UNITS[0])}>
          Start the tour
        </Button>
      </HudPanel>
    );
  }
  const units = LNGTRAIN3D_UNITS.filter((unit) => unit.stageId === stage.id);
  return (
    <HudPanel
      key={stage.id}
      title={`Stop ${state.stageIndex + 1} of ${LNGTRAIN3D_STAGES.length}`}
      meta={state.mode === 'free' ? 'Free view' : undefined}
      className="pointer-events-auto w-80 shrink-0 self-start max-h-full motion-safe:transition-[opacity,translate] motion-safe:duration-300 motion-safe:starting:translate-x-4 motion-safe:starting:opacity-0"
    >
      <div className="flex flex-col gap-1">
        <h4 className="text-base font-semibold text-base-foreground">{stage.title}</h4>
        <p className="text-sm text-medium-foreground">{stage.blurb}</p>
      </div>
      <dl className="grid grid-cols-3 gap-2">
        {stage.figures.map((figure) => (
          <div key={figure.label} className="flex min-w-0 flex-col gap-0.5">
            <dt className="text-xs leading-tight text-muted-foreground">{figure.label}</dt>
            <dd>
              <span className={`block text-base font-semibold tabular-nums ${TONE_VALUE_TEXT[figure.tone ?? 'neutral']}`}>{formatValue(figure.value, figure.decimals)}</span>
              <span className="block text-xs text-muted-foreground">{figure.unit}</span>
            </dd>
          </div>
        ))}
      </dl>
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-muted-foreground">Units at this stop</span>
        <ul className="flex flex-col">
          {units.map((unit) => (
            <li key={unit.id}>
              <LngTrain3dUnitButton unit={unit} selected={unit.id === state.selectedUnitId} colourBy={colourBy} onSelect={() => onSelectUnit(unit)} />
            </li>
          ))}
        </ul>
      </div>
    </HudPanel>
  );
}

function LngTrain3dFallbackList() {
  return (
    <ul className="flex flex-col gap-2 rounded-lg border border-default bg-card-background p-3">
      {LNGTRAIN3D_STAGES.map((stage) => (
        <li key={stage.id} className="flex items-center justify-between gap-3 text-sm">
          <span className="min-w-0 truncate text-base-foreground">{stage.title}</span>
          <span className="shrink-0 tabular-nums text-muted-foreground">{formatTemperature(stage.temperature)}</span>
        </li>
      ))}
    </ul>
  );
}

function LngTrain3dExperience({ initial = 0, initialColour = 'status', still = false }: { initial?: number; initialColour?: LngTrain3dColourBy; still?: boolean }) {
  // Archetype: a guided tour — the camera follows a fixed route along the process.
  // Interaction: step through the five stops (or click a unit) and the camera flies there; any
  //   drag leaves the tour, and Resume tour flies back to the current stop.
  const [state, dispatch] = useReducer(tourReducer, undefined, () => initialTourState(LNGTRAIN3D_STAGES.length, initial));
  const [colourBy, setColourBy] = useState<LngTrain3dColourBy>(initialColour);
  const rootRef = useRef<HTMLDivElement>(null);
  const ramp = useTokenColors(TEMPERATURE_RAMP_TOKENS, rootRef);
  const rampColors = ramp
    ? { step0: ramp.step0.color, step1: ramp.step1.color, step2: ramp.step2.color, step3: ramp.step3.color, step4: ramp.step4.color }
    : null;
  const { temperature, subject } = lngTrain3dReadings(state);
  const stage = LNGTRAIN3D_STAGES[state.stageIndex];

  const selectUnit = (unit: LngUnit) => {
    const index = lngTrain3dStageOfUnit(unit);
    if (index >= 0) dispatch({ type: 'goTo', stageIndex: index, unitId: unit.id });
  };
  const selectId = (id: string) => {
    const unit = LNGTRAIN3D_UNITS.find((candidate) => candidate.id === id);
    if (unit) selectUnit(unit);
  };

  return (
    <div
      ref={rootRef}
      onPointerDownCapture={(event) => {
        // Grabbing the scene leaves the tour; the camera keeps wherever the user takes it.
        if (event.target instanceof HTMLCanvasElement) dispatch({ type: 'detach' });
      }}
      onWheelCapture={(event) => {
        if (event.target instanceof HTMLCanvasElement) dispatch({ type: 'detach' });
      }}
      data-stage={stage?.id ?? 'overview'}
      data-mode={state.mode}
      className="relative h-[46rem] w-full overflow-hidden rounded-xl border border-default bg-base-background"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,color-mix(in_oklab,var(--primary-background)_12%,transparent),transparent_65%)]"
      />
      <SceneCanvas
        label={`3D model of the Nordkapp LNG train, ${stage ? `at stop ${state.stageIndex + 1}, ${stage.title}` : 'overview of the whole site'}, coloured by ${colourBy}`}
        fallback={<LngTrain3dFallbackList />}
        camera={{ position: [180, 200, 330], fov: 38, far: 3000 }}
      >
        <StillScene still={still}>
          <LngSite
            units={LNGTRAIN3D_UNITS}
            racks={LNGTRAIN3D_RACKS}
            lines={LNGTRAIN3D_LINES}
            land={{ center: [0, 0], size: [290, 170] }}
            sea={{ center: [215, 0], size: [150, 170], level: 0 }}
            target={lngTrain3dTarget(state)}
            insets={{ top: 56, bottom: 120, left: 150, right: 344 }}
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

      <div className="pointer-events-none absolute inset-3 z-30 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className={`pointer-events-auto flex flex-col rounded-lg px-3 py-1.5 ${LNGTRAIN3D_GLASS}`}>
            <span className="text-sm font-semibold text-base-foreground">Nordkapp LNG, train 1</span>
            <span className="text-xs text-muted-foreground">Guided tour along the process</span>
          </div>
          <div className="pointer-events-auto">
            <LngTrain3dColourSwitch value={colourBy} onChange={setColourBy} />
          </div>
        </div>

        <div className="flex min-h-0 flex-1 justify-between gap-3">
          <HudPanel title="Temperature" className="pointer-events-auto h-full max-h-[26rem] w-36 shrink-0 self-start">
            <TemperatureRail temperature={temperature} scale={LNGTRAIN3D_SCALE} ticks={LNGTRAIN3D_TICKS} subject={subject} className="h-full min-h-48" />
          </HudPanel>
          <LngTrain3dStageCard state={state} colourBy={colourBy} onSelectUnit={selectUnit} />
        </div>

        <div className={`pointer-events-auto flex flex-col gap-2 rounded-xl p-3 ${LNGTRAIN3D_GLASS}`}>
          <TourStepper
            stages={LNGTRAIN3D_STAGES}
            index={state.stageIndex}
            mode={state.mode}
            onSelect={(index) => dispatch({ type: 'goTo', stageIndex: index })}
            onPrevious={() => dispatch({ type: 'previous' })}
            onNext={() => dispatch({ type: 'next' })}
            onResume={() => dispatch({ type: 'resume' })}
            label="Tour along the process"
          />
          <LngTrain3dLegend colourBy={colourBy} />
        </div>
      </div>
    </div>
  );
}

function LngTrain3dAuraDark() {
  return (
    <ThemeScope preset="aura-dark" className="w-full">
      <LngTrain3dExperience initial={-1} />
    </ThemeScope>
  );
}

function LngTrain3dHologram() {
  return (
    <ThemeScope preset="hologram" className="w-full">
      <LngTrain3dExperience initial={2} initialColour="temperature" still />
    </ThemeScope>
  );
}

function LngTrain3dBlueprint() {
  return (
    <ThemeScope preset="blueprint" className="w-full">
      <LngTrain3dExperience initial={3} still />
    </ThemeScope>
  );
}

function LngTrain3dStage({ label, children, hologram = true }: { label: string; children: ReactNode; hologram?: boolean }) {
  return (
    <ThemeScope preset={hologram ? 'hologram' : 'aura-dark'} className="w-full">
      <div className="h-72 w-full overflow-hidden rounded-xl border border-default bg-base-background">
        <SceneCanvas label={label}>
          <StillScene>{children}</StillScene>
        </SceneCanvas>
      </div>
    </ThemeScope>
  );
}

function LngTrain3dPartExchanger() {
  return (
    <LngTrain3dStage label="Main cryogenic heat exchanger, a tall insulated tower in a steel structure">
      <TurntableStage subjectSize={CRYOGENIC_EXCHANGER_SIZE} padding={1.1}>
        <CryogenicExchanger />
      </TurntableStage>
    </LngTrain3dStage>
  );
}

function LngTrain3dPartCoolers() {
  return (
    <LngTrain3dStage label="A bank of eight fin-fan air coolers on a pipe rack">
      <TurntableStage subjectSize={airCoolerBankSize()} padding={1.05} view="isometric">
        <AirCoolerBank />
      </TurntableStage>
    </LngTrain3dStage>
  );
}

function LngTrain3dPartSlugCatcher() {
  return (
    <LngTrain3dStage label="Finger-type slug catcher with six parallel pipes">
      <TurntableStage subjectSize={slugCatcherSize()} padding={1.1} view="isometric">
        <SlugCatcher />
      </TurntableStage>
    </LngTrain3dStage>
  );
}

function LngTrain3dPartCarrier() {
  return (
    <LngTrain3dStage label="LNG carrier with four spherical tanks at a berth with loading arms">
      <TurntableStage subjectSize={lngCarrierSize()} padding={1}>
        <LngCarrier rotation={[0, Math.PI / 2, 0]} position={[0, 0, 0]} />
        <LoadingArms position={[-8, 0, 0]} rotation={[0, 0, 0]} connected={3} />
      </TurntableStage>
    </LngTrain3dStage>
  );
}

function LngTrain3dPartTank() {
  const [level, setLevel] = useState(62);
  return (
    <ThemeScope preset="hologram" className="w-full">
      <div className="flex w-full flex-col gap-3 rounded-xl border border-default bg-base-background p-3">
        <div className="h-60 w-full">
          <SceneCanvas label={`Full-containment LNG tank with a level gauge showing ${level} percent`}>
            <StillScene>
              <TurntableStage subjectSize={containmentTankSize()} padding={1.05}>
                <ContainmentTank fill={level / 100} tone={level > 90 ? 'warning' : undefined} />
              </TurntableStage>
            </StillScene>
          </SceneCanvas>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex w-24 shrink-0 flex-col">
            <span className="text-xs text-muted-foreground">Tank level</span>
            <ValueReadout value={level} unit="%" size="sm" tone={level > 90 ? 'warning' : 'neutral'} />
          </div>
          <Slider aria-label="Tank level" value={[level]} min={0} max={100} step={1} onValueChange={(value) => setLevel(value[0] ?? 0)} />
        </div>
      </div>
    </ThemeScope>
  );
}

function LngTrain3dPartThermometer() {
  const [stop, setStop] = useState(1);
  const temperatures = LNGTRAIN3D_STAGES.map((stage) => stage.temperature);
  return (
    <ThemeScope preset="hologram" className="w-full">
      <div className="flex w-full flex-col gap-3 rounded-xl border border-default bg-base-background p-4">
        <TemperatureRail temperature={temperatures[stop] ?? null} scale={LNGTRAIN3D_SCALE} ticks={LNGTRAIN3D_TICKS} subject={LNGTRAIN3D_STAGES[stop]?.title} className="h-56" />
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Stop: {LNGTRAIN3D_STAGES[stop]?.label}</span>
          <Slider aria-label="Tour stop" value={[stop]} min={0} max={LNGTRAIN3D_STAGES.length - 1} step={1} onValueChange={(value) => setStop(value[0] ?? 0)} />
        </div>
      </div>
    </ThemeScope>
  );
}

function LngTrain3dPartLegend() {
  return (
    <ThemeScope preset="hologram" className="w-full">
      <div className="flex w-full flex-col gap-5 rounded-xl border border-default bg-base-background p-4">
        <LngTrain3dLegend colourBy="temperature" />
        <LngTrain3dLegend colourBy="status" />
      </div>
    </ThemeScope>
  );
}

function LngTrain3dPartStepper() {
  const [state, dispatch] = useReducer(tourReducer, undefined, () => initialTourState(LNGTRAIN3D_STAGES.length, 1));
  return (
    <ThemeScope preset="hologram" className="w-full">
      <div className="flex w-full flex-col gap-3 rounded-xl border border-default bg-base-background p-4">
        <TourStepper
          stages={LNGTRAIN3D_STAGES}
          index={state.stageIndex}
          mode={state.mode}
          onSelect={(index) => dispatch({ type: 'goTo', stageIndex: index })}
          onPrevious={() => dispatch({ type: 'previous' })}
          onNext={() => dispatch({ type: 'next' })}
          onResume={() => dispatch({ type: 'resume' })}
        />
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => dispatch({ type: 'detach' })}>
            Look around freely
          </Button>
          <span className="text-xs text-muted-foreground">
            {state.mode === 'free' ? 'Free view: the tour waits where you left it.' : `Following the tour: ${LNGTRAIN3D_STAGES[state.stageIndex]?.title ?? 'overview'}.`}
          </span>
        </div>
        <StatusIndicator tone="neutral" shape="ring" label={state.mode === 'free' ? 'Tour paused' : 'Tour running'} size="sm" />
      </div>
    </ThemeScope>
  );
}

export default definePage({
  id: 'lng-train-3d',
  title: 'LNG train',
  summary:
    'A larger plant than Nordkapp: an LNG liquefaction train built along its process, from slug catcher to loading jetty. A tour flies the camera stop by stop while a card explains what happens and a thermometer follows the temperature down to minus 162 degrees.',
  guidance: {
    use: [
      'When the story has an order: a process, a pipeline, a journey the audience should follow in sequence.',
      'With a landmark the eye can return to: the cold tower tells you where you are on any stop.',
      'When one number changes along the route: a rail beside the scene keeps it in view at every stop.',
      'Free orbit alongside the tour, with a clear way back, so guidance never traps people.',
    ],
    avoid: [
      'Auto-playing tours: the user steps, the camera follows.',
      'Colouring whole equipment by temperature: use ground rings and print the number too.',
      'A tour without a keyboard path: the stepper and the unit list reach every stop.',
      'Hiding the plan: keep the overview one click away.',
    ],
  },
  source,
  sections: [
    {
      id: 'experience',
      title: 'Experience',
      description:
        'Step through Inlet, Treatment, Liquefaction, Storage and Loading with the buttons along the bottom, or click any unit to jump to its stop. Drag to orbit, scroll to zoom: the tour pauses and Resume tour flies back. Switch Colour by to Temperature to ring every unit by its process temperature.',
      specimens: [
        {
          id: 'LngTrain3dAuraDark',
          title: 'LNG train tour',
          note: 'Pick it when people should be led through a process in order, with the numbers that matter at each stop.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'three/SceneCanvas.tsx',
            'three/plants/LngSite.tsx',
            'three/plants/lngSite.ts',
            'three/plants/tourState.ts',
            'three/plants/TourStepper.tsx',
            'three/plants/TemperatureRail.tsx',
            'three/plants/temperatureRamp.ts',
            'three/plants/CryogenicExchanger.tsx',
            'three/plants/AirCoolerBank.tsx',
            'three/plants/SlugCatcher.tsx',
            'three/plants/ContainmentTank.tsx',
            'three/plants/LngCarrier.tsx',
            'three/plants/LoadingArms.tsx',
            'three/HudPanel.tsx',
            'three/SceneLegend.tsx',
            'industrial/ValueReadout.tsx',
            'themes/ThemeScope.tsx',
          ],
          Component: LngTrain3dAuraDark,
        },
      ],
    },
    {
      id: 'themes',
      title: 'In other themes',
      description: 'The same tour in a hologram theme at the liquefaction stop, coloured by temperature, and in a light blueprint theme at storage. Both render a single still frame.',
      specimens: [
        {
          id: 'LngTrain3dHologram',
          title: 'Hologram, by temperature',
          note: 'Pick it for a showroom or visitor-centre screen where the cold end should glow.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['three/plants/LngSite.tsx', 'three/plants/tourState.ts', 'three/plants/temperatureRamp.ts', 'three/scenes/StillScene.tsx', 'themes/ThemeScope.tsx'],
          Component: LngTrain3dHologram,
        },
        {
          id: 'LngTrain3dBlueprint',
          title: 'Blueprint, in a light theme',
          note: 'Pick it for engineering reviews in daylight: a pale plot plan with dark steel.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['three/plants/LngSite.tsx', 'three/plants/tourState.ts', 'three/scenes/StillScene.tsx', 'themes/ThemeScope.tsx'],
          Component: LngTrain3dBlueprint,
        },
      ],
    },
    {
      id: 'parts',
      title: 'Parts',
      description: 'The new models on a turntable you can drag, and the tour controls on their own.',
      specimens: [
        {
          id: 'LngTrain3dPartExchanger',
          title: 'Cryogenic exchanger',
          note: 'Pick it as the landmark of a liquefaction site: a tall insulated tower in an open steel structure.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['three/plants/CryogenicExchanger.tsx', 'three/TurntableStage.tsx', 'three/scenes/StillScene.tsx'],
          Component: LngTrain3dPartExchanger,
        },
        {
          id: 'LngTrain3dPartCoolers',
          title: 'Air cooler bank',
          note: 'Pick it for long rows of fin-fan coolers on a pipe rack, where one model per cooler would be too heavy.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['three/plants/AirCoolerBank.tsx', 'three/TurntableStage.tsx', 'three/scenes/StillScene.tsx'],
          Component: LngTrain3dPartCoolers,
        },
        {
          id: 'LngTrain3dPartSlugCatcher',
          title: 'Slug catcher',
          note: 'Pick it for the inlet of a gas plant: parallel sloping fingers with headers across them.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['three/plants/SlugCatcher.tsx', 'three/TurntableStage.tsx', 'three/scenes/StillScene.tsx'],
          Component: LngTrain3dPartSlugCatcher,
        },
        {
          id: 'LngTrain3dPartCarrier',
          title: 'Carrier and loading arms',
          note: 'Pick it to mark a berth as occupied: spherical tanks on deck and arms reaching the manifold.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['three/plants/LngCarrier.tsx', 'three/plants/LoadingArms.tsx', 'three/TurntableStage.tsx', 'three/scenes/StillScene.tsx'],
          Component: LngTrain3dPartCarrier,
        },
        {
          id: 'LngTrain3dPartTank',
          title: 'Containment tank with level',
          note: 'Pick it when the wall hides the liquid: a gauge strip on the side reads the level.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['three/plants/ContainmentTank.tsx', 'three/TurntableStage.tsx', 'industrial/ValueReadout.tsx'],
          Component: LngTrain3dPartTank,
        },
        {
          id: 'LngTrain3dPartThermometer',
          title: 'Temperature rail',
          note: 'Pick it for one number that changes along a route: a marker slides to the value at the current stop.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['three/plants/TemperatureRail.tsx', 'three/plants/temperatureRamp.ts'],
          Component: LngTrain3dPartThermometer,
        },
        {
          id: 'LngTrain3dPartLegend',
          title: 'Colour-by legends',
          note: 'Pick the legend that matches the switch: a token ramp for temperature, status marks for state.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['three/plants/temperatureRamp.ts', 'three/SceneLegend.tsx'],
          Component: LngTrain3dPartLegend,
        },
        {
          id: 'LngTrain3dPartStepper',
          title: 'Tour stepper',
          note: 'Pick it to guide people along a route while leaving them free to look around and come back.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['three/plants/TourStepper.tsx', 'three/plants/tourState.ts', 'industrial/StatusIndicator.tsx'],
          Component: LngTrain3dPartStepper,
        },
      ],
    },
  ],
});
