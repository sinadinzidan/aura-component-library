import { Button } from '@cognite/aura/components/button';
import { SegmentedControl, SegmentedControlButton, SegmentedControlList } from '@cognite/aura/components/segmented-control';
import { Slider } from '@cognite/aura/components/slider';
import { Switch } from '@cognite/aura/components/switch';
import { useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { ArcReadout } from '../../../library/experiences/futuristic/ArcReadout';
import { BracketFrame } from '../../../library/experiences/futuristic/BracketFrame';
import { GlowText } from '../../../library/experiences/futuristic/GlowText';
import { NeonSparkline } from '../../../library/experiences/futuristic/NeonSparkline';
import { formatReading, formatValue, runStateStatus } from '../../../library/industrial/status';
import type { Tone } from '../../../library/industrial/status';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { ThemeScope } from '../../../library/themes/ThemeScope';
import { CameraRig } from '../../../library/three/CameraRig';
import { frameBounds } from '../../../library/three/cameraTargets';
import { RAMP_KEYS, RAMP_LABELS, RAMP_SWATCH, RAMP_TOKENS, rampKey, rampStops } from '../../../library/three/models/componentRamp';
import { FaultCallout } from '../../../library/three/models/FaultCallout';
import { HologramScene } from '../../../library/three/models/HologramScene';
import { ProjectorBase } from '../../../library/three/models/ProjectorBase';
import { ScanPlane } from '../../../library/three/models/ScanPlane';
import { partSlice, scanHeight, scanRange, sectionRadiusAt, slicesAt } from '../../../library/three/models/scanSweep';
import type { WireframePart } from '../../../library/three/models/scanSweep';
import { StillScene } from '../../../library/three/models/StillScene';
import { WireframeModel } from '../../../library/three/models/WireframeModel';
import { SceneCanvas } from '../../../library/three/SceneCanvas';
import { SceneLights } from '../../../library/three/SceneLights';
import { usePrefersReducedMotion } from '../../../library/three/usePrefersReducedMotion';
import { useTokenColors } from '../../../library/three/useTokenColors';
import { WORK_ORDERS, findAsset } from '../../data/plant';
import { makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './hologram-asset.tsx?raw';

const HOLOASSET_ASSET_ID = '23-ka-9103';
const HOLOASSET_FAULT_ID = 'de-bearing';

type HoloAssetKind = 'Structure' | 'Bearing' | 'Seal' | 'Impeller' | 'Casing' | 'Coupling' | 'Driver';

type HoloAssetComponent = {
  part: WireframePart;
  name: string;
  kind: HoloAssetKind;
  /** 0–100. */
  health: number;
  /** Surface or metal temperature, °C. */
  temperature: number;
  /** Velocity, mm/s RMS. */
  vibration: number;
  /** Shown in the scan readout. Nozzles and the shaft are drawn but not listed. */
  listed: boolean;
};

/**
 * The recompressor stood on end for scanning: the shaft is the vertical axis and the scan plane
 * meets one component after another on its way up. Heights in scene units above the projector.
 */
const HOLOASSET_COMPONENTS: readonly HoloAssetComponent[] = [
  { part: { id: 'base', shape: 'box', center: [0, 1.8, 0], height: 0.4, width: 2.6, depth: 2.6 }, name: 'Thrust pedestal', kind: 'Structure', health: 97, temperature: 44, vibration: 0.6, listed: true },
  { part: { id: 'nde-bearing', shape: 'cylinder', center: [0, 2.4, 0], height: 0.6, radius: 0.7 }, name: 'Non-drive-end bearing', kind: 'Bearing', health: 86, temperature: 68, vibration: 2.9, listed: true },
  { part: { id: 'nde-seal', shape: 'cylinder', center: [0, 2.95, 0], height: 0.36, radius: 0.5 }, name: 'Non-drive-end seal', kind: 'Seal', health: 91, temperature: 54, vibration: 1.4, listed: true },
  { part: { id: 'casing', shape: 'cylinder', center: [0, 4.9, 0], height: 3.4, radius: 1.5, segments: 20 }, name: 'Barrel casing', kind: 'Casing', health: 90, temperature: 72, vibration: 1.8, listed: true },
  { part: { id: 'stage-1', shape: 'cylinder', center: [0, 3.9, 0], height: 0.3, radius: 1.1, radiusTop: 0.6 }, name: 'Impeller stage 1', kind: 'Impeller', health: 88, temperature: 61, vibration: 2.2, listed: true },
  { part: { id: 'stage-2', shape: 'cylinder', center: [0, 4.9, 0], height: 0.3, radius: 1.1, radiusTop: 0.6 }, name: 'Impeller stage 2', kind: 'Impeller', health: 84, temperature: 74, vibration: 2.6, listed: true },
  { part: { id: 'stage-3', shape: 'cylinder', center: [0, 5.9, 0], height: 0.3, radius: 1.1, radiusTop: 0.6 }, name: 'Impeller stage 3', kind: 'Impeller', health: 79, temperature: 88, vibration: 3.4, listed: true },
  { part: { id: 'suction', shape: 'box', center: [1.95, 3.9, 0], height: 0.9, width: 1.1, depth: 0.9 }, name: 'Suction nozzle', kind: 'Structure', health: 95, temperature: 48, vibration: 1.1, listed: false },
  { part: { id: 'discharge', shape: 'box', center: [-1.95, 5.9, 0], height: 0.8, width: 1.1, depth: 0.8 }, name: 'Discharge nozzle', kind: 'Structure', health: 94, temperature: 96, vibration: 1.3, listed: false },
  { part: { id: 'de-seal', shape: 'cylinder', center: [0, 6.85, 0], height: 0.36, radius: 0.5 }, name: 'Drive-end seal', kind: 'Seal', health: 63, temperature: 94, vibration: 5.2, listed: true },
  { part: { id: 'de-bearing', shape: 'cylinder', center: [0, 7.4, 0], height: 0.6, radius: 0.7 }, name: 'Drive-end bearing', kind: 'Bearing', health: 22, temperature: 118, vibration: 11.6, listed: true },
  { part: { id: 'coupling', shape: 'cylinder', center: [0, 8.2, 0], height: 0.9, radius: 0.42, segments: 12 }, name: 'Coupling', kind: 'Coupling', health: 71, temperature: 79, vibration: 6.4, listed: true },
  { part: { id: 'motor', shape: 'cylinder', center: [0, 10, 0], height: 2.6, radius: 1.25, segments: 20 }, name: 'Motor', kind: 'Driver', health: 93, temperature: 64, vibration: 1.9, listed: true },
  { part: { id: 'motor-fan', shape: 'cylinder', center: [0, 11.5, 0], height: 0.4, radius: 0.9, radiusTop: 0.7 }, name: 'Motor fan cowl', kind: 'Driver', health: 93, temperature: 52, vibration: 1.7, listed: false },
  { part: { id: 'shaft', shape: 'cylinder', center: [0, 5.35, 0], height: 6.7, radius: 0.13, segments: 8 }, name: 'Shaft', kind: 'Structure', health: 82, temperature: 70, vibration: 4.1, listed: false },
];

const HOLOASSET_PARTS: readonly WireframePart[] = HOLOASSET_COMPONENTS.map((component) => component.part);
const HOLOASSET_SLICES = HOLOASSET_PARTS.map(partSlice);
const HOLOASSET_RANGE = scanRange(HOLOASSET_SLICES);
const HOLOASSET_LISTED = HOLOASSET_COMPONENTS.filter((component) => component.listed);

type HoloAssetMode = 'structure' | 'thermal' | 'vibration';

const HOLOASSET_MODES: readonly { value: HoloAssetMode; label: string }[] = [
  { value: 'structure', label: 'Structure' },
  { value: 'thermal', label: 'Thermal' },
  { value: 'vibration', label: 'Vibration' },
];

/** The value each map paints, with the domain its ramp covers. */
const HOLOASSET_MAPS = {
  thermal: { label: 'Temperature', unit: '°C', decimals: 0, min: 40, max: 120, read: (component: HoloAssetComponent) => component.temperature },
  vibration: { label: 'Vibration', unit: 'mm/s', decimals: 1, min: 0, max: 12, read: (component: HoloAssetComponent) => component.vibration },
} as const;

function holoAssetIsMode(value: unknown): value is HoloAssetMode {
  return HOLOASSET_MODES.some((mode) => mode.value === value);
}

const HOLOASSET_TOKENS = { ...RAMP_TOKENS, accent: 'primary-background', critical: 'critical-foreground-strong' } as const;

function holoAssetHealthTone(health: number): Tone {
  if (health < 40) return 'critical';
  if (health < 70) return 'warning';
  return 'neutral';
}

/** Scan fraction that puts the plane on the middle of a component. */
function holoAssetScanFor(component: HoloAssetComponent): number {
  return (component.part.center[1] - HOLOASSET_RANGE.min) / (HOLOASSET_RANGE.max - HOLOASSET_RANGE.min);
}

function holoAssetPassing(scan: number): string[] {
  return slicesAt(HOLOASSET_SLICES, scanHeight(HOLOASSET_RANGE, scan)).map((slice) => slice.id);
}

/** Drive-end vibration over the 6 hours before the trip: flat, then a climb through the limits. */
const HOLOASSET_VIBRATION_TREND: readonly number[] = makeValues({ seed: 61, points: 36, base: 4.2, noise: 0.25, decimals: 1 }).map((value, index) =>
  index < 20 ? value : Math.round((value + ((index - 19) / 16) ** 1.6 * 7.4) * 10) / 10
);

const HOLOASSET_DIAGNOSIS = {
  finding: 'Outer race defect, drive-end bearing',
  confidence: 94,
  evidence: [
    'Velocity rose from 4.2 to 11.6 mm/s in 110 minutes; trip at 11.0.',
    'Spectrum peak at 3.1 × running speed, the outer race pass frequency.',
    'Bearing metal temperature 118 °C, 46 °C above the non-drive end.',
    'Seal and coupling next to it are heating; the rest of the train is normal.',
  ],
  action: 'Keep the recompressor isolated. Replace the drive-end bearing and inspect the seal before restart.',
} as const;

const HOLOASSET_FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ring-default)]';

function HoloAssetHealthBar({ health }: { health: number }) {
  const tone = holoAssetHealthTone(health);
  return (
    <span aria-hidden="true" className="block h-1 w-full overflow-hidden bg-[color-mix(in_oklab,var(--primary-background)_18%,transparent)]">
      <span
        className={`block h-full ${tone === 'critical' ? 'bg-critical-foreground-strong' : tone === 'warning' ? 'bg-warning-foreground-strong' : 'bg-[var(--primary-background)]'}`}
        style={{ width: `${health}%` }}
      />
    </span>
  );
}

function HoloAssetReadout({ scan, mode, onPick }: { scan: number; mode: HoloAssetMode; onPick?: (component: HoloAssetComponent) => void }) {
  const passing = holoAssetPassing(scan);
  // Top of the machine first, like the model.
  const rows = [...HOLOASSET_LISTED].reverse();

  return (
    <BracketFrame title="Scan readout" meta={`${Math.round(scan * 100)}%`} className="w-full" bodyClassName="gap-2">
      <p className="text-xs text-muted-foreground">
        {passing.length === 0 ? 'Plane between components.' : 'Plane passing the marked components. Pick one to move the plane to it.'}
      </p>
      <ul aria-label="Components along the scan axis, top first" className="flex min-h-0 flex-col overflow-y-auto">
        {rows.map((component) => {
          const active = passing.includes(component.part.id);
          const tone = holoAssetHealthTone(component.health);
          const map = mode === 'structure' ? null : HOLOASSET_MAPS[mode];
          const body = (
            <>
              <span className="flex items-baseline gap-2">
                <span aria-hidden="true" className={`w-2 shrink-0 font-mono text-xs ${active ? 'text-[color:var(--primary-background)]' : 'text-transparent'}`}>
                  ›
                </span>
                <span className={`min-w-0 flex-1 text-xs ${active ? 'font-medium text-base-foreground' : 'text-medium-foreground'}`}>{component.name}</span>
                <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">{map ? formatReading(map.read(component), map.unit, map.decimals) : component.kind}</span>
                <span
                  className={`w-7 shrink-0 text-right font-mono text-xs tabular-nums ${tone === 'critical' ? 'text-critical-foreground-strong' : tone === 'warning' ? 'text-warning-foreground-strong' : 'text-base-foreground'}`}
                >
                  {component.health}
                </span>
              </span>
              <span className="block pl-4">
                <HoloAssetHealthBar health={component.health} />
              </span>
            </>
          );
          return (
            <li key={component.part.id} data-active={active || undefined}>
              {onPick ? (
                <button
                  type="button"
                  aria-label={`${component.name}, health ${component.health}${active ? ', in the scan plane' : ''}`}
                  aria-pressed={active}
                  onClick={() => onPick(component)}
                  className={`flex w-full flex-col gap-1 px-1 py-1.5 text-left hover:bg-[color-mix(in_oklab,var(--primary-background)_10%,transparent)] ${HOLOASSET_FOCUS}`}
                >
                  {body}
                </button>
              ) : (
                <div className="flex flex-col gap-1 px-1 py-1.5">{body}</div>
              )}
            </li>
          );
        })}
      </ul>
      <p className="flex justify-end gap-1 text-xs text-muted-foreground">
        <span>Right column: health, 0 to 100</span>
      </p>
    </BracketFrame>
  );
}

function HoloAssetDiagnosis({ onLocate }: { onLocate?: () => void }) {
  const order = WORK_ORDERS.find((candidate) => candidate.assetId === HOLOASSET_ASSET_ID);

  return (
    <BracketFrame title="Diagnosis" meta="Fault located" tone="critical" className="w-full" bodyClassName="gap-3">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-base-foreground">{HOLOASSET_DIAGNOSIS.finding}</p>
          <StatusIndicator tone="critical" shape="diamond" label="Critical" detail="tripped on high vibration" size="sm" className="mt-1" />
        </div>
        <ArcReadout value={HOLOASSET_DIAGNOSIS.confidence} label="Confidence" unit="%" tone="critical" className="w-20" />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">Drive-end vibration, 6 hours to the trip</span>
        <NeonSparkline values={HOLOASSET_VIBRATION_TREND} label="Drive-end vibration, 6 hours to the trip" tone="critical" limit={11} unit="mm/s" height={44} />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Evidence</span>
        <ul className="flex flex-col gap-1.5">
          {HOLOASSET_DIAGNOSIS.evidence.map((line, index) => (
            <li key={line} className="flex gap-2 text-xs text-medium-foreground">
              <span aria-hidden="true" className="w-3 shrink-0 font-mono tabular-nums text-muted-foreground">
                {index + 1}
              </span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Recommended action</span>
        <p className="text-xs text-base-foreground">{HOLOASSET_DIAGNOSIS.action}</p>
        {order ? (
          <p className="text-xs text-muted-foreground">
            <span className="font-mono">{order.id}</span> · {order.priority} · {order.progress}% done
          </p>
        ) : null}
      </div>
      {onLocate ? (
        <div>
          <Button size="sm" variant="outline" onClick={onLocate}>
            Scan the bearing
          </Button>
        </div>
      ) : null}
    </BracketFrame>
  );
}

function HoloAssetModeSwitch({ mode, onChange }: { mode: HoloAssetMode; onChange: (mode: HoloAssetMode) => void }) {
  return (
    <SegmentedControl
      value={mode}
      onValueChange={(value) => {
        if (holoAssetIsMode(value)) onChange(value);
      }}
    >
      <SegmentedControlList size="small" aria-label="Colour the model by">
        {HOLOASSET_MODES.map((option) => (
          <SegmentedControlButton key={option.value} value={option.value}>
            {option.label}
          </SegmentedControlButton>
        ))}
      </SegmentedControlList>
    </SegmentedControl>
  );
}

function HoloAssetLegend({ mode }: { mode: HoloAssetMode }) {
  if (mode === 'structure') {
    return (
      <ul aria-label="Legend: structure" className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-medium-foreground">
        <li className="flex items-center gap-1.5 whitespace-nowrap">
          <span aria-hidden="true" className="h-2.5 w-4 border border-[var(--primary-background)]" /> Component
        </li>
        <li className="flex items-center gap-1.5 whitespace-nowrap">
          <span aria-hidden="true" className="h-2.5 w-4 border-2 border-critical-foreground-strong" /> Fault
        </li>
        <li className="flex items-center gap-1.5 whitespace-nowrap">
          <span aria-hidden="true" className="h-0.5 w-4 bg-base-foreground" /> Scan section
        </li>
      </ul>
    );
  }
  const map = HOLOASSET_MAPS[mode];
  const stops = rampStops(map.min, map.max);
  return (
    <ul aria-label={`Legend: ${map.label.toLowerCase()} in ${map.unit}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-medium-foreground">
      <li className="text-muted-foreground">
        {map.label}, {map.unit}
      </li>
      {RAMP_KEYS.map((key, index) => (
        <li key={key} className="flex items-center gap-1.5 whitespace-nowrap">
          <span aria-hidden="true" className={`h-2.5 w-4 ${RAMP_SWATCH[key]}`} />
          <span>{RAMP_LABELS[key]}</span>
          <span className="tabular-nums text-muted-foreground">
            {formatValue(stops[index].from)}–{formatValue(stops[index].to)}
          </span>
        </li>
      ))}
    </ul>
  );
}

function useHoloAssetColors(mode: HoloAssetMode) {
  const scope = useRef<HTMLDivElement>(null);
  const tokens = useTokenColors(HOLOASSET_TOKENS, scope);
  const colors: Record<string, string> = {};
  if (tokens) {
    for (const component of HOLOASSET_COMPONENTS) {
      if (mode === 'structure') colors[component.part.id] = component.part.id === HOLOASSET_FAULT_ID ? tokens.critical.color : tokens.accent.color;
      else colors[component.part.id] = tokens[rampKey(HOLOASSET_MAPS[mode].read(component), HOLOASSET_MAPS[mode].min, HOLOASSET_MAPS[mode].max)].color;
    }
  }
  return { scope, colors, ready: tokens !== null };
}

function HoloAssetFallback() {
  return (
    <ul className="flex flex-col gap-2 rounded-lg border border-default bg-card-background p-3">
      {[...HOLOASSET_LISTED].reverse().map((component) => (
        <li key={component.part.id} className="flex items-center justify-between gap-3 text-sm">
          <span className="min-w-0 truncate text-base-foreground">{component.name}</span>
          <StatusIndicator
            tone={holoAssetHealthTone(component.health) === 'neutral' ? 'success' : holoAssetHealthTone(component.health)}
            shape={component.health < 40 ? 'diamond' : component.health < 70 ? 'square' : 'dot'}
            label={`Health ${component.health}`}
            size="sm"
            className="shrink-0"
          />
        </li>
      ))}
    </ul>
  );
}

type HoloAssetInitial = { mode?: HoloAssetMode; scan?: number };

function HoloAssetScan({ initial = {}, still = false }: { initial?: HoloAssetInitial; still?: boolean }) {
  const [mode, setMode] = useState<HoloAssetMode>(initial.mode ?? 'structure');
  const [scan, setScan] = useState(initial.scan ?? 0.2);
  const [auto, setAuto] = useState(!still);
  const [engaged, setEngaged] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const { scope, colors, ready } = useHoloAssetColors(mode);
  const asset = findAsset(HOLOASSET_ASSET_ID);
  const fault = HOLOASSET_COMPONENTS.find((component) => component.part.id === HOLOASSET_FAULT_ID);
  const canMove = !still && !reducedMotion;
  const sweeping = auto && canMove;

  const moveTo = (fraction: number) => {
    setAuto(false);
    setScan(Math.min(1, Math.max(0, fraction)));
  };

  if (!asset) return null;

  return (
    <div
      ref={scope}
      onPointerEnter={() => setEngaged(true)}
      onPointerLeave={() => setEngaged(false)}
      onFocus={() => setEngaged(true)}
      onBlur={() => setEngaged(false)}
      className="relative h-[46rem] w-full overflow-hidden rounded-xl border border-default bg-base-background"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_85%,color-mix(in_oklab,var(--primary-background)_22%,transparent),transparent_60%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-40 [background-image:repeating-linear-gradient(to_bottom,color-mix(in_oklab,var(--primary-background)_10%,transparent)_0,color-mix(in_oklab,var(--primary-background)_10%,transparent)_1px,transparent_1px,transparent_4px)]"
      />
      <SceneCanvas
        label={`Holographic scan of ${asset.tag} ${asset.name}, coloured by ${mode}, scan plane at ${Math.round(scan * 100)} percent, fault at the drive-end bearing`}
        fallback={<HoloAssetFallback />}
      >
        <StillScene still={still}>
          {ready ? (
            <HologramScene
              parts={HOLOASSET_PARTS}
              colors={colors}
              faultId={HOLOASSET_FAULT_ID}
              fault={{ title: 'Drive-end bearing', detail: `Fault · ${HOLOASSET_DIAGNOSIS.confidence}% confidence`, onClick: fault ? () => moveTo(holoAssetScanFor(fault)) : undefined }}
              scan={scan}
              autoScan={sweeping}
              onScanChange={setScan}
              rotate={canMove && !engaged}
              insets={{ top: 40, bottom: 96, left: 250, right: 280 }}
              padding={0.92}
            />
          ) : null}
        </StillScene>
      </SceneCanvas>

      <div className="pointer-events-none absolute inset-4 z-30 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <GlowText variant="label">Holographic scan</GlowText>
            <p className="flex items-baseline gap-2">
              <GlowText mono className="text-lg font-semibold">
                {asset.tag}
              </GlowText>
              <span className="text-sm text-medium-foreground">{asset.name}</span>
            </p>
          </div>
          <StatusIndicator {...runStateStatus(asset.state)} detail="14 min ago" size="sm" pulse={!still} />
        </div>

        <div className="flex min-h-0 flex-1 items-start justify-between gap-3">
          <div className="pointer-events-auto flex max-h-full min-h-0 w-60 shrink-0">
            <HoloAssetReadout scan={scan} mode={mode} onPick={(component) => moveTo(holoAssetScanFor(component))} />
          </div>
          <div className="pointer-events-auto flex max-h-full min-h-0 w-64 shrink-0 overflow-y-auto">
            <HoloAssetDiagnosis onLocate={fault ? () => moveTo(holoAssetScanFor(fault)) : undefined} />
          </div>
        </div>

        <div className="pointer-events-auto flex flex-wrap items-center justify-between gap-x-5 gap-y-2 border border-[color-mix(in_oklab,var(--primary-background)_35%,transparent)] bg-[color-mix(in_oklab,var(--card-background)_72%,transparent)] px-3 py-2 backdrop-blur-md">
          <HoloAssetModeSwitch mode={mode} onChange={setMode} />
          <HoloAssetLegend mode={mode} />
          <div className="flex min-w-56 flex-1 items-center gap-3">
            <span className="shrink-0 text-xs uppercase tracking-wider text-muted-foreground">Scan</span>
            <Slider aria-label="Scan plane position, bottom to top" value={[Math.round(scan * 100)]} min={0} max={100} step={1} onValueChange={(value) => moveTo((value[0] ?? 0) / 100)} />
            {canMove ? (
              <Switch label="Auto" checked={auto} onCheckedChange={(checked) => setAuto(checked)} />
            ) : (
              <span className="shrink-0 text-xs text-muted-foreground">{still ? 'Manual' : 'Manual: reduced motion'}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function HoloAssetScanHologram() {
  return (
    <ThemeScope preset="hologram" className="w-full">
      <HoloAssetScan />
    </ThemeScope>
  );
}

function HoloAssetScanTron() {
  return (
    <ThemeScope preset="tron" className="w-full">
      <HoloAssetScan still initial={{ mode: 'vibration', scan: 0.59 }} />
    </ThemeScope>
  );
}

function HoloAssetScanNightVision() {
  return (
    <ThemeScope preset="night-vision" className="w-full">
      <HoloAssetScan still initial={{ mode: 'thermal', scan: 0.33 }} />
    </ThemeScope>
  );
}

function HoloAssetFrame({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <ThemeScope preset="hologram" className="w-full">
      <div className={`flex w-full justify-center rounded-xl border border-default bg-base-background p-4 ${className}`}>{children}</div>
    </ThemeScope>
  );
}

const HOLOASSET_STAGE_TARGET = frameBounds({ min: [-2.4, 0, -2.4], max: [2.4, 12, 2.4] }, { padding: 0.85, aspect: 1 });

function HoloAssetPartWireframe() {
  const { scope, colors, ready } = useHoloAssetColors('structure');

  return (
    <ThemeScope preset="hologram" className="w-full">
      <div ref={scope} className="h-80 w-full overflow-hidden rounded-xl border border-default bg-base-background">
        <SceneCanvas label="Wireframe model of the recompressor above its projector ring, fault in the critical colour">
          <StillScene>
            <SceneLights intensity={0.8} />
            <CameraRig target={HOLOASSET_STAGE_TARGET} minDistance={5} maxDistance={70} enablePan={false} />
            <ProjectorBase radius={2.6} beamHeight={1.2} />
            {ready ? <WireframeModel parts={HOLOASSET_PARTS} colors={colors} faultId={HOLOASSET_FAULT_ID} /> : null}
          </StillScene>
        </SceneCanvas>
      </div>
    </ThemeScope>
  );
}

function HoloAssetPartCallout() {
  const bearing = HOLOASSET_PARTS.filter((part) => ['de-seal', 'de-bearing', 'coupling'].includes(part.id));
  const { scope, colors, ready } = useHoloAssetColors('structure');

  return (
    <ThemeScope preset="hologram" className="w-full">
      <div ref={scope} className="h-80 w-full overflow-hidden rounded-xl border border-default bg-base-background">
        <SceneCanvas label="Drive-end bearing between seal and coupling, with a fault callout on a leader line">
          <StillScene>
            <SceneLights intensity={0.8} />
            <CameraRig target={frameBounds({ min: [-2.6, 6.4, -1], max: [1, 8.8, 1] }, { padding: 1.1, aspect: 1 })} minDistance={3} maxDistance={40} enablePan={false} />
            {ready ? <WireframeModel parts={bearing} colors={colors} faultId={HOLOASSET_FAULT_ID} /> : null}
            <FaultCallout position={[0, 7.4, 0]} title="Drive-end bearing" detail="Fault · 94% confidence" side="left" reach={56} />
          </StillScene>
        </SceneCanvas>
      </div>
    </ThemeScope>
  );
}

function HoloAssetPartReadout() {
  return (
    <HoloAssetFrame className="h-80">
      <div className="flex min-h-0 w-full max-w-64">
        <HoloAssetReadout scan={0.59} mode="vibration" />
      </div>
    </HoloAssetFrame>
  );
}

function HoloAssetPartScan() {
  const [scan, setScan] = useState(42);
  const { scope, colors, ready } = useHoloAssetColors('structure');
  const height = scanHeight(HOLOASSET_RANGE, scan / 100);
  const passing = holoAssetPassing(scan / 100);
  const names = HOLOASSET_COMPONENTS.filter((component) => component.listed && passing.includes(component.part.id)).map((component) => component.name);

  return (
    <ThemeScope preset="hologram" className="w-full">
      <div ref={scope} className="flex w-full flex-col gap-3 rounded-xl border border-default bg-base-background p-3">
        <div className="h-80 w-full">
          <SceneCanvas label={`Scan plane at ${scan} percent of the model, passing ${names.length > 0 ? names.join(' and ') : 'no component'}`}>
            <StillScene>
              <SceneLights intensity={0.8} />
              <CameraRig target={HOLOASSET_STAGE_TARGET} minDistance={5} maxDistance={70} enablePan={false} />
              {ready ? <WireframeModel parts={HOLOASSET_PARTS} colors={colors} activeIds={passing} /> : null}
              <group position={[0, height, 0]}>
                <ScanPlane radius={2.3} sectionRadius={sectionRadiusAt(HOLOASSET_SLICES, height)} />
              </group>
            </StillScene>
          </SceneCanvas>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex w-44 shrink-0 flex-col">
            <span className="text-xs text-muted-foreground">Plane passing</span>
            <span className="text-sm text-base-foreground">{names.length > 0 ? names.join(', ') : 'Nothing'}</span>
          </div>
          <Slider aria-label="Scan plane position" value={[scan]} min={0} max={100} step={1} onValueChange={(value) => setScan(value[0] ?? 0)} />
        </div>
      </div>
    </ThemeScope>
  );
}

function HoloAssetPartDiagnosis() {
  return (
    <HoloAssetFrame>
      <div className="w-full max-w-sm">
        <HoloAssetDiagnosis />
      </div>
    </HoloAssetFrame>
  );
}

function HoloAssetPartLegend() {
  const [mode, setMode] = useState<HoloAssetMode>('thermal');

  return (
    <HoloAssetFrame className="h-72 items-center">
      <div className="flex flex-col items-start gap-4">
        <HoloAssetModeSwitch mode={mode} onChange={setMode} />
        <HoloAssetLegend mode={mode} />
      </div>
    </HoloAssetFrame>
  );
}

function HoloAssetPartFallback() {
  return (
    <ThemeScope preset="hologram" className="w-full">
      <div className="h-[30rem] w-full overflow-hidden rounded-xl border border-default">
        <SceneCanvas label="Holographic scan of 23-KA-9103 Recompressor" forceFallback fallback={<HoloAssetFallback />}>
          <SceneLights />
        </SceneCanvas>
      </div>
    </ThemeScope>
  );
}

export default definePage({
  id: 'hologram-asset',
  title: 'Hologram asset',
  summary:
    'One tripped machine as a holographic scan: a wireframe you can see through, a plane sweeping along the shaft that names what it passes, and the fault lit in the critical colour with a line to its diagnosis.',
  guidance: {
    use: [
      'When the point is where inside a machine something is wrong, and what sits next to it.',
      'For briefings and wall screens: the sweep and the slow turn carry the eye without anyone touching it.',
      'With one fault at a time. One critical glow and one leader line read at a glance.',
      'With map modes that recolour by a measured value, each with a legend that gives ranges and words.',
    ],
    avoid: [
      'Engineering work on parts and instruments: the solid digital twin shows real shapes and measurement points.',
      'Light themes. Translucent faces and glowing edges need a dark surface behind them.',
      'A sweep nobody can stop. Under reduced motion the plane stands still and the slider moves it.',
      'Health by colour only: every component also shows its health as a number and a bar.',
    ],
  },
  source,
  sections: [
    {
      id: 'experience',
      title: 'Experience',
      description:
        'The model turns slowly and the scan plane sweeps up and down; both pause while the pointer is on the screen or the slider is used. Drag to orbit, scroll to zoom. Pick a component in the readout to park the plane on it, switch between Structure, Thermal and Vibration to recolour the model, and follow the leader line from the bearing to the diagnosis.',
      specimens: [
        {
          id: 'HoloAssetScanHologram',
          title: 'Hologram asset',
          note: 'Pick it to present a located fault: the scan shows where it is, the card says what it is and what to do.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'three/models/HologramScene.tsx',
            'three/models/WireframeModel.tsx',
            'three/models/ScanPlane.tsx',
            'three/models/ProjectorBase.tsx',
            'three/models/FaultCallout.tsx',
            'three/models/scanSweep.ts',
            'three/models/componentRamp.ts',
            'three/models/StillScene.tsx',
            'three/SceneCanvas.tsx',
            'three/useTokenColors.ts',
            'experiences/futuristic/BracketFrame.tsx',
            'experiences/futuristic/GlowText.tsx',
            'experiences/futuristic/ArcReadout.tsx',
            'experiences/futuristic/NeonSparkline.tsx',
            'industrial/StatusIndicator.tsx',
            'themes/ThemeScope.tsx',
          ],
          Component: HoloAssetScanHologram,
        },
      ],
    },
    {
      id: 'themes',
      title: 'In other themes',
      description: 'The same scan in two more dark presets, each in another map mode and held still with the plane parked.',
      specimens: [
        {
          id: 'HoloAssetScanTron',
          title: 'Tron, vibration map',
          note: 'Pick the vibration map to show how far the fault has spread: bearing high, coupling and seal elevated.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['three/models/HologramScene.tsx', 'three/models/componentRamp.ts', 'three/models/StillScene.tsx', 'themes/ThemeScope.tsx'],
          Component: HoloAssetScanTron,
        },
        {
          id: 'HoloAssetScanNightVision',
          title: 'Night vision, thermal map',
          note: 'Pick the thermal map to show heat travelling from the bearing into the seal and the last impeller stage.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['three/models/HologramScene.tsx', 'three/models/componentRamp.ts', 'three/models/StillScene.tsx', 'themes/ThemeScope.tsx'],
          Component: HoloAssetScanNightVision,
        },
      ],
    },
    {
      id: 'parts',
      title: 'Parts',
      description: 'The scene pieces and the bracketed panels on their own.',
      specimens: [
        {
          id: 'HoloAssetPartWireframe',
          title: 'Wireframe model',
          note: 'Pick edges over translucent faces when what is inside a casing matters as much as the casing.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['three/models/WireframeModel.tsx', 'three/models/ProjectorBase.tsx', 'three/models/scanSweep.ts', 'three/models/StillScene.tsx'],
          Component: HoloAssetPartWireframe,
        },
        {
          id: 'HoloAssetPartCallout',
          title: 'Fault callout',
          note: 'Pick a leader line when the explanation lives in a panel: it joins the spot to the words.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['three/models/FaultCallout.tsx', 'three/models/WireframeModel.tsx'],
          Component: HoloAssetPartCallout,
        },
        {
          id: 'HoloAssetPartReadout',
          title: 'Scan readout',
          note: 'Pick it to say in words what a scan plane is passing, with a health figure and bar for every component.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['experiences/futuristic/BracketFrame.tsx', 'three/models/scanSweep.ts'],
          Component: HoloAssetPartReadout,
        },
        {
          id: 'HoloAssetPartScan',
          title: 'Scan plane by hand',
          note: 'Pick the manual slider wherever motion is reduced or the viewer wants to stop on one component.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['three/models/ScanPlane.tsx', 'three/models/scanSweep.ts', 'three/models/WireframeModel.tsx'],
          Component: HoloAssetPartScan,
        },
        {
          id: 'HoloAssetPartDiagnosis',
          title: 'Diagnosis card',
          note: 'Pick it for a located fault: finding, confidence, the evidence behind it and one recommended action.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['experiences/futuristic/BracketFrame.tsx', 'experiences/futuristic/ArcReadout.tsx', 'experiences/futuristic/NeonSparkline.tsx', 'industrial/StatusIndicator.tsx'],
          Component: HoloAssetPartDiagnosis,
        },
        {
          id: 'HoloAssetPartLegend',
          title: 'Map mode and legend',
          note: 'Pick a four-step ramp with words and ranges, so a recoloured model can be read without guessing.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['three/models/componentRamp.ts'],
          Component: HoloAssetPartLegend,
        },
        {
          id: 'HoloAssetPartFallback',
          title: 'Without WebGL',
          note: 'Pick a fallback that lists the components top to bottom with their health, so the fault is still found.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['three/SceneCanvas.tsx', 'three/webgl.ts', 'industrial/StatusIndicator.tsx'],
          Component: HoloAssetPartFallback,
        },
      ],
    },
  ],
});
