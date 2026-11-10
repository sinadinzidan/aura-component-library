import { Button } from '@cognite/aura/components/button';
import { CheckboxGroup, CheckboxItem, CheckboxItemControl, CheckboxItemLabel } from '@cognite/aura/components/checkbox';
import { SegmentedControl, SegmentedControlButton, SegmentedControlList } from '@cognite/aura/components/segmented-control';
import { Slider } from '@cognite/aura/components/slider';
import { useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';

import { Sparkline } from '../../../library/industrial/Sparkline';
import { formatReading, formatValue } from '../../../library/industrial/status';
import type { StatusDescriptor } from '../../../library/industrial/status';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { ValueReadout } from '../../../library/industrial/ValueReadout';
import { ThemeScope } from '../../../library/themes/ThemeScope';
import { CameraRig } from '../../../library/three/CameraRig';
import type { Vec3 } from '../../../library/three/cameraTargets';
import { formationAt } from '../../../library/three/models/horizonHeight';
import type { Horizon } from '../../../library/three/models/horizonHeight';
import { HorizonSurface } from '../../../library/three/models/HorizonSurface';
import { StillScene } from '../../../library/three/models/StillScene';
import { SubseaTemplate } from '../../../library/three/models/SubseaTemplate';
import { wellFieldCameraTarget } from '../../../library/three/models/wellFieldCamera';
import type { WellFieldView } from '../../../library/three/models/wellFieldCamera';
import { WellFieldScene } from '../../../library/three/models/WellFieldScene';
import type { WellFieldLayers, WellFieldSceneWell } from '../../../library/three/models/WellFieldScene';
import { WELL_FIELD_TOKENS } from '../../../library/three/models/wellFieldTokens';
import { Wellhead } from '../../../library/three/models/Wellhead';
import type { WellheadKind } from '../../../library/three/models/Wellhead';
import { casingAtMd, deepestTvd, densifySurvey, pathPointToScene, pathToScene, planSurvey, pointAtTvd, wellPath } from '../../../library/three/models/wellPath';
import type { CasingString, WellPathPoint, WellPlan } from '../../../library/three/models/wellPath';
import { SceneCanvas } from '../../../library/three/SceneCanvas';
import { SceneLights } from '../../../library/three/SceneLights';
import { useTokenColors } from '../../../library/three/useTokenColors';
import { makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './well-field-3d.tsx?raw';

/** Scene units per metre: 100 m is one unit. */
const WELLFIELD3D_SCALE = 0.01;
/** Half the width of the mapped block and its depth below the seabed, in metres. */
const WELLFIELD3D_HALF_EXTENT = 3000;
const WELLFIELD3D_BLOCK_DEPTH = 3100;
const WELLFIELD3D_MAX_DEPTH = 3000;
/** Slots on the template are drawn 2.3 units apart, far wider than in reality, so the wellheads read. */
const WELLFIELD3D_SLOT_PITCH = 2.3;

/** Horizons of the Nordkapp Vest licence, shallowest first. Depths in metres below the seabed. */
const WELLFIELD3D_HORIZONS: readonly Horizon[] = [
  { id: 'kai', name: 'Top Kai', formation: 'Kai Fm', depth: 780, relief: 35, seed: 0.6 },
  { id: 'springar', name: 'Top Springar', formation: 'Springar Fm', depth: 1560, relief: 45, seed: 2.1 },
  { id: 'garn', name: 'Top Garn', formation: 'Garn Fm', depth: 2340, relief: 40, seed: 3.7, dipEast: 0.006 },
  { id: 'ile', name: 'Base Ile', formation: 'Ror Fm', depth: 2690, relief: 40, seed: 4.4, dipEast: 0.006 },
];

const WELLFIELD3D_OVERBURDEN = 'Naust Fm';
const WELLFIELD3D_RESERVOIR = { topId: 'garn', baseId: 'ile' };

type WellField3dStatus = 'flowing' | 'injecting' | 'choked' | 'water' | 'shut-in';

const WELLFIELD3D_STATUS: Record<WellField3dStatus, StatusDescriptor> = {
  flowing: { tone: 'success', label: 'Flowing', shape: 'dot' },
  injecting: { tone: 'success', label: 'Injecting', shape: 'dot' },
  choked: { tone: 'info', label: 'Choked back', shape: 'ring' },
  water: { tone: 'warning', label: 'High water cut', shape: 'square' },
  'shut-in': { tone: 'neutral', label: 'Shut in', shape: 'square' },
};

type WellField3dWell = {
  id: string;
  name: string;
  kind: WellheadKind;
  /** What it produces or injects, in words. */
  service: string;
  /** Row and column on the template, −1 to 1. */
  slot: readonly [number, number];
  plan: WellPlan;
  status: WellField3dStatus;
  /** Oil in Sm³/d for producers; injection rate in m³/d (water) or kSm³/d (gas) for injectors. */
  rate: number;
  rateUnit: string;
  /** Producers only. */
  gas?: number;
  waterCut?: number;
  choke: number;
  wellheadPressure: number;
  seed: number;
};

const WELLFIELD3D_WELLS: readonly WellField3dWell[] = [
  { id: 'a01', name: 'NK-A-01 H', kind: 'producer', service: 'Oil producer, horizontal', slot: [-1, -1], plan: { kickoffMd: 500, buildRate: 2.5, holdInc: 42, azimuth: 35, landing: { startMd: 2750, inc: 88, buildRate: 4 }, tdMd: 4150 }, status: 'flowing', rate: 1840, rateUnit: 'Sm³/d', gas: 412, waterCut: 18, choke: 64, wellheadPressure: 86, seed: 201 },
  { id: 'a02', name: 'NK-A-02 H', kind: 'producer', service: 'Oil producer, deviated', slot: [0, -1], plan: { kickoffMd: 600, buildRate: 2.5, holdInc: 30, azimuth: 80, tdMd: 3150 }, status: 'flowing', rate: 960, rateUnit: 'Sm³/d', gas: 228, waterCut: 34, choke: 72, wellheadPressure: 74, seed: 202 },
  { id: 'a03', name: 'NK-A-03 H', kind: 'producer', service: 'Oil producer, horizontal', slot: [1, -1], plan: { kickoffMd: 450, buildRate: 2.5, holdInc: 46, azimuth: 128, landing: { startMd: 2950, inc: 89, buildRate: 4 }, tdMd: 4200 }, status: 'water', rate: 720, rateUnit: 'Sm³/d', gas: 164, waterCut: 71, choke: 88, wellheadPressure: 52, seed: 203 },
  { id: 'a04', name: 'NK-A-04 H', kind: 'producer', service: 'Oil producer, deviated', slot: [1, 0], plan: { kickoffMd: 550, buildRate: 2.5, holdInc: 36, azimuth: 172, tdMd: 3350 }, status: 'shut-in', rate: 0, rateUnit: 'Sm³/d', gas: 0, waterCut: 0, choke: 0, wellheadPressure: 118, seed: 204 },
  { id: 'a05', name: 'NK-A-05 H', kind: 'producer', service: 'Oil producer, horizontal', slot: [1, 1], plan: { kickoffMd: 500, buildRate: 2.5, holdInc: 40, azimuth: 228, landing: { startMd: 2700, inc: 88, buildRate: 4 }, tdMd: 4150, turnRate: 0.6 }, status: 'flowing', rate: 2120, rateUnit: 'Sm³/d', gas: 486, waterCut: 9, choke: 58, wellheadPressure: 92, seed: 205 },
  { id: 'a06', name: 'NK-A-06 H', kind: 'injector', service: 'Water injector, deviated', slot: [-1, 0], plan: { kickoffMd: 500, buildRate: 2.5, holdInc: 41, azimuth: 272, tdMd: 3550 }, status: 'injecting', rate: 4200, rateUnit: 'm³/d', choke: 80, wellheadPressure: 196, seed: 206 },
  { id: 'a07', name: 'NK-A-07 H', kind: 'producer', service: 'Oil producer, deviated', slot: [-1, 1], plan: { kickoffMd: 650, buildRate: 2.5, holdInc: 27, azimuth: 312, tdMd: 3050, turnRate: 0.8 }, status: 'choked', rate: 540, rateUnit: 'Sm³/d', gas: 310, waterCut: 22, choke: 31, wellheadPressure: 104, seed: 207 },
  { id: 'a08', name: 'NK-A-08 H', kind: 'injector', service: 'Water injector, deviated', slot: [0, 1], plan: { kickoffMd: 500, buildRate: 2.5, holdInc: 39, azimuth: 350, tdMd: 3500 }, status: 'injecting', rate: 3650, rateUnit: 'm³/d', choke: 76, wellheadPressure: 188, seed: 208 },
  { id: 'a09', name: 'NK-A-09 H', kind: 'injector', service: 'Gas injector, near vertical', slot: [0, 0], plan: { kickoffMd: 900, buildRate: 2, holdInc: 14, azimuth: 205, tdMd: 2760 }, status: 'shut-in', rate: 0, rateUnit: 'kSm³/d', choke: 0, wellheadPressure: 142, seed: 209 },
];

function wellField3dCasings(well: WellField3dWell): CasingString[] {
  const strings: CasingString[] = [
    { name: '30 in conductor', shoeMd: 90 },
    { name: '20 in surface casing', shoeMd: 780 },
    { name: '13 3/8 in casing', shoeMd: 1700 },
    { name: '9 5/8 in casing', shoeMd: well.plan.landing ? well.plan.landing.startMd + 300 : Math.round((well.plan.tdMd * 0.72) / 10) * 10 },
  ];
  // Horizontal producers are completed open hole with screens; the others run a liner to total depth.
  return well.plan.landing ? strings : [...strings, { name: '7 in liner', shoeMd: well.plan.tdMd }];
}

type WellField3dModel = {
  well: WellField3dWell;
  path: WellPathPoint[];
  origin: Vec3;
  casings: CasingString[];
  scene: WellFieldSceneWell;
};

const WELLFIELD3D_MODELS: readonly WellField3dModel[] = WELLFIELD3D_WELLS.map((well) => {
  const path = wellPath(densifySurvey(planSurvey(well.plan), 80));
  const origin: Vec3 = [well.slot[0] * WELLFIELD3D_SLOT_PITCH, 0, well.slot[1] * WELLFIELD3D_SLOT_PITCH];
  const status = WELLFIELD3D_STATUS[well.status];
  return {
    well,
    path,
    origin,
    casings: wellField3dCasings(well),
    scene: { id: well.id, tag: well.name, kind: well.kind, points: pathToScene(path, origin, WELLFIELD3D_SCALE), status: status.label, tone: status.tone },
  };
});

const WELLFIELD3D_SCENE_WELLS: readonly WellFieldSceneWell[] = WELLFIELD3D_MODELS.map((model) => model.scene);

type WellField3dAtDepth =
  | { reached: true; formation: string; lining: string; atShoe: boolean; inc: number; md: number; position: Vec3 }
  | { reached: false; td: number };

/** What one well is doing where the cutting plane crosses it. */
function wellField3dAtDepth(model: WellField3dModel, depth: number): WellField3dAtDepth {
  const point = pointAtTvd(model.path, depth);
  if (!point) return { reached: false, td: deepestTvd(model.path) };
  const lining = casingAtMd(model.casings, point.md);
  return {
    reached: true,
    formation: formationAt(WELLFIELD3D_HORIZONS, point.tvd, point.east, point.north)?.formation ?? WELLFIELD3D_OVERBURDEN,
    lining: lining ? lining.casing.name : 'Open hole with screens',
    atShoe: lining?.atShoe ?? false,
    inc: point.inc,
    md: point.md,
    position: pathPointToScene(point, model.origin, WELLFIELD3D_SCALE),
  };
}

function wellField3dCrossings(depth: number): { id: string; position: Vec3 }[] {
  return WELLFIELD3D_MODELS.flatMap((model) => {
    const at = wellField3dAtDepth(model, depth);
    return at.reached ? [{ id: model.well.id, position: at.position }] : [];
  });
}

/** The interval the plane is in, by the mean depth of the horizons. */
function wellField3dInterval(depth: number): string {
  const above = [...WELLFIELD3D_HORIZONS].reverse().find((horizon) => horizon.depth <= depth);
  return above ? above.formation : WELLFIELD3D_OVERBURDEN;
}

/** Daily rate for the last 30 days, ending on the current rate. */
function wellField3dHistory(well: WellField3dWell): number[] {
  // A shut-in well: a declining month, then nothing since the valve closed nine days ago.
  if (well.rate === 0) return Array.from({ length: 30 }, (_, index) => (index < 21 ? 620 - index * 6 : 0));
  const values = makeValues({ seed: well.seed, points: 30, base: well.rate, amplitude: well.rate * 0.04, noise: well.rate * 0.02, drift: well.status === 'water' ? -well.rate * 0.25 : well.rate * 0.03, decimals: 0 });
  const shift = well.rate - values[values.length - 1];
  return values.map((value) => Math.max(0, Math.round(value + shift)));
}

const WELLFIELD3D_VIEWS: readonly { value: WellFieldView; label: string }[] = [
  { value: 'perspective', label: 'Perspective' },
  { value: 'section', label: 'Side section' },
  { value: 'plan', label: 'Top plan' },
];

function wellField3dIsView(value: unknown): value is WellFieldView {
  return WELLFIELD3D_VIEWS.some((view) => view.value === value);
}

const WELLFIELD3D_LAYERS: readonly { key: keyof WellFieldLayers; label: string }[] = [
  { key: 'horizons', label: 'Horizons' },
  { key: 'wellbores', label: 'Wellbores' },
  { key: 'reservoir', label: 'Reservoir zone' },
  { key: 'labels', label: 'Labels' },
];

const WELLFIELD3D_ALL_LAYERS: WellFieldLayers = { horizons: true, wellbores: true, reservoir: true, labels: true };

const WELLFIELD3D_GLASS = 'border border-default bg-[color-mix(in_oklab,var(--card-background)_80%,transparent)] backdrop-blur-md';

const WELLFIELD3D_FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ring-default)]';

/** Producers point up, injectors point down: the same shapes as the wellheads in the scene. */
function WellField3dKindMark({ kind }: { kind: WellheadKind }) {
  return (
    <svg viewBox="0 0 12 12" aria-hidden="true" className={`size-3 shrink-0 ${kind === 'producer' ? 'fill-chart-1-450' : 'fill-chart-2-450'}`}>
      {kind === 'producer' ? <path d="M6 1 11 11H1z" /> : <path d="M1 1h10L6 11z" />}
    </svg>
  );
}

function WellField3dViewSwitch({ view, onChange }: { view: WellFieldView; onChange: (view: WellFieldView) => void }) {
  return (
    <SegmentedControl
      value={view}
      onValueChange={(value) => {
        if (wellField3dIsView(value)) onChange(value);
      }}
    >
      <SegmentedControlList size="small" aria-label="Camera view">
        {WELLFIELD3D_VIEWS.map((option) => (
          <SegmentedControlButton key={option.value} value={option.value}>
            {option.label}
          </SegmentedControlButton>
        ))}
      </SegmentedControlList>
    </SegmentedControl>
  );
}

function WellField3dLayerList({ layers, onChange }: { layers: WellFieldLayers; onChange: (layers: WellFieldLayers) => void }) {
  return (
    <CheckboxGroup aria-label="Layers">
      {WELLFIELD3D_LAYERS.map((layer) => (
        <CheckboxItem key={layer.key}>
          <CheckboxItemControl checked={layers[layer.key]} onCheckedChange={(checked) => onChange({ ...layers, [layer.key]: checked === true })} />
          <CheckboxItemLabel>{layer.label}</CheckboxItemLabel>
        </CheckboxItem>
      ))}
    </CheckboxGroup>
  );
}

function WellField3dLegend() {
  return (
    <ul aria-label="Scene legend" className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-medium-foreground">
      <li className="flex items-center gap-1.5 whitespace-nowrap">
        <WellField3dKindMark kind="producer" /> Producer
      </li>
      <li className="flex items-center gap-1.5 whitespace-nowrap">
        <WellField3dKindMark kind="injector" /> Injector
      </li>
      <li className="flex items-center gap-1.5 whitespace-nowrap">
        <span aria-hidden="true" className="h-2.5 w-4 border border-[var(--primary-background)] bg-[color-mix(in_oklab,var(--primary-background)_16%,transparent)]" /> Cutting plane
      </li>
      <li className="flex items-center gap-1.5 whitespace-nowrap">
        <span aria-hidden="true" className="size-2.5 rounded-full border-2 border-base-foreground" /> Well crossing
      </li>
    </ul>
  );
}

function WellField3dDepthRuler({ depth, onChange }: { depth: number; onChange: (depth: number) => void }) {
  return (
    <div className="flex w-full items-start gap-4">
      <div className="flex w-36 shrink-0 flex-col gap-0.5">
        <span className="text-xs text-muted-foreground">Cutting plane</span>
        <ValueReadout value={depth} unit="m below seabed" size="sm" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 pt-1.5">
        <Slider
          aria-label="Depth of the cutting plane in metres below the seabed"
          value={[depth]}
          min={0}
          max={WELLFIELD3D_MAX_DEPTH}
          step={20}
          onValueChange={(value) => onChange(value[0] ?? 0)}
        />
        <div aria-hidden="true" className="relative h-5">
          {WELLFIELD3D_HORIZONS.map((horizon) => (
            <span
              key={horizon.id}
              className="absolute top-0 flex h-5 items-end border-l border-emphasized pl-1 text-xs leading-none tabular-nums text-muted-foreground"
              style={{ left: `${(horizon.depth / WELLFIELD3D_MAX_DEPTH) * 100}%` }}
            >
              {formatValue(horizon.depth)}
            </span>
          ))}
        </div>
      </div>
      <dl className="hidden w-32 shrink-0 flex-col gap-0.5 xl:flex">
        <dt className="text-xs text-muted-foreground">Interval</dt>
        <dd className="text-sm font-medium text-base-foreground">{wellField3dInterval(depth)}</dd>
      </dl>
    </div>
  );
}

function WellField3dDepthList({ depth, selectedId, onSelect }: { depth: number; selectedId?: string | null; onSelect?: (id: string) => void }) {
  return (
    <ul aria-label={`Wells at ${formatValue(depth)} metres below the seabed`} className="flex flex-col">
      {WELLFIELD3D_MODELS.map((model) => {
        const at = wellField3dAtDepth(model, depth);
        const body = (
          <>
            <span className="flex items-center gap-1.5">
              <WellField3dKindMark kind={model.well.kind} />
              <span className="font-mono text-xs font-medium text-base-foreground">{model.well.name}</span>
              <span className="ml-auto shrink-0 text-xs tabular-nums text-muted-foreground">
                {at.reached ? `${formatValue(at.inc)}° · ${formatValue(at.md)} m MD` : `ends at ${formatValue(at.td)} m`}
              </span>
            </span>
            {at.reached ? (
              <span className="flex flex-wrap gap-x-1.5 pl-[1.125rem] text-xs">
                <span className="text-medium-foreground">{at.formation}</span>
                <span aria-hidden="true" className="text-muted-foreground">
                  ·
                </span>
                <span className={at.atShoe ? 'font-medium text-base-foreground' : 'text-muted-foreground'}>
                  {at.lining}
                  {at.atShoe ? ' shoe' : ''}
                </span>
              </span>
            ) : (
              <span className="pl-[1.125rem] text-xs text-muted-foreground">Not this deep</span>
            )}
          </>
        );
        return (
          <li key={model.well.id}>
            {onSelect ? (
              <button
                type="button"
                aria-pressed={model.well.id === selectedId}
                onClick={() => onSelect(model.well.id)}
                className={`-mx-1.5 flex w-[calc(100%+0.75rem)] flex-col gap-0.5 rounded-md px-1.5 py-1.5 text-left hover:bg-secondary-background aria-pressed:bg-secondary-background ${WELLFIELD3D_FOCUS}`}
              >
                {body}
              </button>
            ) : (
              <div className="flex flex-col gap-0.5 py-1.5">{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function WellField3dStat({ label, value, unit, decimals = 0 }: { label: string; value: number | null; unit?: string; decimals?: number }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd>
        <ValueReadout value={value} unit={unit} decimals={decimals} size="sm" tone={label === 'Water cut' && value !== null && value > 60 ? 'warning' : 'neutral'} />
      </dd>
    </div>
  );
}

function WellField3dWellCard({ model, onClose }: { model: WellField3dModel; onClose?: () => void }) {
  const { well } = model;
  const producer = well.kind === 'producer';
  const history = wellField3dHistory(well);

  return (
    <section aria-label={`Well ${well.name}`} className="flex flex-col gap-3 rounded-lg border border-default bg-base-background p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 font-mono text-sm font-medium text-base-foreground">
            <WellField3dKindMark kind={well.kind} />
            {well.name}
          </p>
          <p className="text-xs text-muted-foreground">{well.service}</p>
        </div>
        {onClose ? (
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        ) : null}
      </div>
      <StatusIndicator {...WELLFIELD3D_STATUS[well.status]} size="sm" />
      <dl className="grid grid-cols-2 gap-x-3 gap-y-3">
        <WellField3dStat label={producer ? 'Oil rate' : 'Injection rate'} value={well.rate} unit={well.rateUnit} />
        {producer ? <WellField3dStat label="Gas rate" value={well.gas ?? null} unit="kSm³/d" /> : <WellField3dStat label="Injection pressure" value={well.wellheadPressure} unit="barg" />}
        {producer ? <WellField3dStat label="Water cut" value={well.waterCut ?? null} unit="%" /> : null}
        <WellField3dStat label="Choke" value={well.choke} unit="% open" />
        {producer ? <WellField3dStat label="Wellhead pressure" value={well.wellheadPressure} unit="barg" /> : null}
        <WellField3dStat label="Total depth" value={well.plan.tdMd} unit="m MD" />
      </dl>
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">{producer ? 'Oil rate' : 'Injection rate'}, last 30 days</span>
        <Sparkline
          values={history}
          label={`${producer ? 'Oil rate' : 'Injection rate'} of ${well.name}, last 30 days`}
          unit={well.rateUnit}
          variant="area"
          height={40}
          tone={well.status === 'water' ? 'warning' : 'neutral'}
          showLast
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Casing shoes at {model.casings.map((casing) => formatValue(casing.shoeMd)).join(', ')} m MD.
      </p>
    </section>
  );
}

function WellField3dFallback() {
  return (
    <ul className="flex flex-col gap-2 rounded-lg border border-default bg-card-background p-3">
      {WELLFIELD3D_WELLS.map((well) => (
        <li key={well.id} className="flex items-center justify-between gap-3 text-sm">
          <span className="flex min-w-0 items-center gap-1.5">
            <WellField3dKindMark kind={well.kind} />
            <span className="font-mono text-xs text-base-foreground">{well.name}</span>
            <span className="truncate text-xs text-muted-foreground">{well.kind === 'producer' ? 'Producer' : 'Injector'}</span>
          </span>
          <StatusIndicator {...WELLFIELD3D_STATUS[well.status]} size="sm" className="shrink-0" />
        </li>
      ))}
    </ul>
  );
}

type WellField3dInitial = { depth?: number; selectedId?: string | null; view?: WellFieldView; layers?: WellFieldLayers };

function WellField3dField({ initial = {}, still = false }: { initial?: WellField3dInitial; still?: boolean }) {
  const scope = useRef<HTMLDivElement>(null);
  const colors = useTokenColors(WELL_FIELD_TOKENS, scope);
  const [depth, setDepth] = useState(initial.depth ?? 1240);
  const [selectedId, setSelectedId] = useState<string | null>(initial.selectedId ?? null);
  const [view, setView] = useState<WellFieldView>(initial.view ?? 'perspective');
  const [layers, setLayers] = useState<WellFieldLayers>(initial.layers ?? WELLFIELD3D_ALL_LAYERS);
  const selected = WELLFIELD3D_MODELS.find((model) => model.well.id === selectedId);
  const reachedCount = wellField3dCrossings(depth).length;

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape' && selectedId !== null) {
      event.preventDefault();
      setSelectedId(null);
    }
  };

  return (
    <div
      ref={scope}
      tabIndex={-1}
      onKeyDown={onKeyDown}
      onPointerDownCapture={(event) => {
        // Orbit controls swallow the pointer event, so take focus by hand to keep Escape working.
        if (event.target instanceof HTMLCanvasElement) event.currentTarget.focus({ preventScroll: true });
      }}
      className="flex h-[46rem] w-full overflow-hidden rounded-xl border border-default bg-base-background outline-none"
    >
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="relative min-h-0 flex-1 bg-[linear-gradient(to_bottom,color-mix(in_oklab,var(--primary-background)_10%,transparent),transparent_45%)]">
          <SceneCanvas
            label={`3D model of the Nordkapp Vest well field: ${WELLFIELD3D_WELLS.length} wells below a subsea template, cutting plane at ${formatValue(depth)} metres below the seabed${selected ? `, ${selected.well.name} selected` : ''}`}
            fallback={<WellField3dFallback />}
            onPointerMissed={() => setSelectedId(null)}
          >
            <StillScene still={still}>
              <WellFieldScene
                wells={WELLFIELD3D_SCENE_WELLS}
                horizons={WELLFIELD3D_HORIZONS}
                reservoir={WELLFIELD3D_RESERVOIR}
                halfExtent={WELLFIELD3D_HALF_EXTENT}
                blockDepth={WELLFIELD3D_BLOCK_DEPTH}
                scale={WELLFIELD3D_SCALE}
                depth={depth}
                crossings={wellField3dCrossings(depth)}
                layers={layers}
                view={view}
                selectedId={selectedId}
                onSelect={(id) => setSelectedId(id === selectedId ? null : id)}
                colors={colors}
                padding={view === 'perspective' ? 0.9 : 0.86}
              />
            </StillScene>
          </SceneCanvas>

          <div className="pointer-events-none absolute inset-3 z-30 flex flex-col justify-between gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className={`pointer-events-auto flex flex-col gap-1 rounded-lg px-3 py-2 ${WELLFIELD3D_GLASS}`}>
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Layers</span>
                <WellField3dLayerList layers={layers} onChange={setLayers} />
              </div>
              <div className={`pointer-events-auto rounded-lg px-2 py-1 ${WELLFIELD3D_GLASS}`}>
                <WellField3dViewSwitch view={view} onChange={setView} />
              </div>
            </div>
            <div className={`pointer-events-auto self-start rounded-lg px-3 py-2 ${WELLFIELD3D_GLASS}`}>
              <WellField3dLegend />
            </div>
          </div>
        </div>
        <div className="shrink-0 border-t border-default bg-card-background px-4 py-3">
          <WellField3dDepthRuler depth={depth} onChange={setDepth} />
        </div>
      </div>

      <aside aria-label="Wells" className="flex w-80 shrink-0 flex-col border-l border-default bg-card-background">
        <header className="flex shrink-0 flex-col gap-0.5 border-b border-default px-4 py-3">
          <p className="text-sm font-medium text-base-foreground">Nordkapp Vest, template A</p>
          <p className="text-xs text-muted-foreground">
            {reachedCount} of {WELLFIELD3D_WELLS.length} wells cross {formatReading(depth, 'm')}, in the {wellField3dInterval(depth)}
          </p>
        </header>
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
          {selected ? <WellField3dWellCard key={selected.well.id} model={selected} onClose={() => setSelectedId(null)} /> : null}
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">At the cutting plane</span>
            <WellField3dDepthList depth={depth} selectedId={selectedId} onSelect={(id) => setSelectedId(id === selectedId ? null : id)} />
          </div>
        </div>
      </aside>
    </div>
  );
}

function WellField3dFieldEmber() {
  return (
    <ThemeScope preset="ember" className="w-full">
      <WellField3dField />
    </ThemeScope>
  );
}

function WellField3dFieldHologram() {
  return (
    <ThemeScope preset="hologram" className="w-full">
      <WellField3dField still initial={{ depth: 2440, selectedId: 'a03', view: 'section' }} />
    </ThemeScope>
  );
}

function WellField3dFieldAuraDark() {
  return (
    <ThemeScope preset="aura-dark" className="w-full">
      <WellField3dField still initial={{ depth: 1560, view: 'plan', layers: { horizons: false, wellbores: true, reservoir: false, labels: true } }} />
    </ThemeScope>
  );
}

function WellField3dPanelFrame({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <ThemeScope preset="ember" className="w-full">
      <div className={`flex w-full justify-center rounded-xl border border-default bg-base-background p-4 ${className}`}>{children}</div>
    </ThemeScope>
  );
}

function WellField3dPartHorizon() {
  const scope = useRef<HTMLDivElement>(null);
  const colors = useTokenColors(WELL_FIELD_TOKENS, scope);
  const horizon = WELLFIELD3D_HORIZONS[2];
  const target = wellFieldCameraTarget('perspective', { halfExtent: 20, depth: 3 }, { padding: 0.85 });

  return (
    <ThemeScope preset="ember" className="w-full">
      <div ref={scope} className="h-72 w-full overflow-hidden rounded-xl border border-default bg-base-background">
        <SceneCanvas label={`${horizon.name} horizon as an undulating low-poly surface around ${horizon.depth} metres`}>
          <StillScene>
            <SceneLights />
            <CameraRig target={{ position: target.position, lookAt: [0, 0, 0] }} minDistance={6} maxDistance={160} maxPolarAngle={Math.PI * 0.74} enablePan={false} />
            <group position={[0, horizon.depth * WELLFIELD3D_SCALE * 6, 0]} scale={[1, 6, 1]}>
              {colors ? <HorizonSurface horizon={horizon} halfExtent={2000} scale={WELLFIELD3D_SCALE} color={colors.horizon3.color} opacity={0.3} /> : null}
            </group>
          </StillScene>
        </SceneCanvas>
      </div>
    </ThemeScope>
  );
}

function WellField3dPartWellheads() {
  const scope = useRef<HTMLDivElement>(null);
  const colors = useTokenColors(WELL_FIELD_TOKENS, scope);
  const target = wellFieldCameraTarget('perspective', { halfExtent: 3.4, depth: 0 }, { padding: 0.8 });

  return (
    <ThemeScope preset="ember" className="w-full">
      <div ref={scope} className="relative h-72 w-full overflow-hidden rounded-xl border border-default bg-base-background">
        <SceneCanvas label="Subsea template with a producer wellhead pointing up and an injector wellhead pointing down">
          <StillScene>
            <SceneLights />
            <CameraRig target={{ position: target.position, lookAt: [0, 0.6, 0] }} minDistance={3} maxDistance={40} enablePan={false} />
            <SubseaTemplate size={[4.2, 4.2]} />
            {colors ? (
              <>
                <Wellhead position={[-0.9, 0, 0]} kind="producer" color={colors.producer.color} size={1.2} />
                <Wellhead position={[0.9, 0, 0]} kind="injector" color={colors.injector.color} size={1.2} />
              </>
            ) : null}
          </StillScene>
        </SceneCanvas>
        <div className={`absolute bottom-3 left-3 rounded-lg px-3 py-2 ${WELLFIELD3D_GLASS}`}>
          <ul aria-label="Wellhead legend" className="flex gap-4 text-xs text-medium-foreground">
            <li className="flex items-center gap-1.5">
              <WellField3dKindMark kind="producer" /> Producer
            </li>
            <li className="flex items-center gap-1.5">
              <WellField3dKindMark kind="injector" /> Injector
            </li>
          </ul>
        </div>
      </div>
    </ThemeScope>
  );
}

function WellField3dPartLayers() {
  const [layers, setLayers] = useState<WellFieldLayers>({ horizons: true, wellbores: true, reservoir: false, labels: true });
  const [view, setView] = useState<WellFieldView>('section');

  return (
    <WellField3dPanelFrame className="h-72 items-center">
      <div className="flex flex-col items-start gap-4">
        <WellField3dViewSwitch view={view} onChange={setView} />
        <div className={`flex flex-col gap-1 rounded-lg px-3 py-2 ${WELLFIELD3D_GLASS}`}>
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Layers</span>
          <WellField3dLayerList layers={layers} onChange={setLayers} />
        </div>
      </div>
    </WellField3dPanelFrame>
  );
}

function WellField3dPartSurvey() {
  const model = WELLFIELD3D_MODELS[0];
  const stations = wellPath(planSurvey(model.well.plan, 500));

  return (
    <WellField3dPanelFrame>
      <div className="flex w-full flex-col gap-2">
        <p className="text-sm text-base-foreground">
          <span className="font-mono font-medium">{model.well.name}</span> <span className="text-muted-foreground">survey, minimum curvature</span>
        </p>
        <table className="w-full text-sm">
          <caption className="sr-only">Survey stations of {model.well.name} with the computed position of each</caption>
          <thead>
            <tr className="text-xs text-muted-foreground">
              {['MD', 'Inc', 'Azi', 'TVD', 'North', 'East'].map((heading) => (
                <th key={heading} scope="col" className="pb-1.5 text-right font-medium first:text-left">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {stations.map((station) => (
              <tr key={station.md} className="border-t border-default">
                <td className="py-1 text-base-foreground">{formatValue(station.md)}</td>
                <td className="py-1 text-right text-medium-foreground">{formatValue(station.inc, 1)}°</td>
                <td className="py-1 text-right text-medium-foreground">{formatValue(station.azi)}°</td>
                <td className="py-1 text-right text-base-foreground">{formatValue(station.tvd)}</td>
                <td className="py-1 text-right text-medium-foreground">{formatValue(station.north)}</td>
                <td className="py-1 text-right text-medium-foreground">{formatValue(station.east)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-muted-foreground">Depths and offsets in metres from the wellhead. Measured depth, inclination and azimuth are the inputs; the rest is computed.</p>
      </div>
    </WellField3dPanelFrame>
  );
}

function WellField3dPartDepthRuler() {
  const [depth, setDepth] = useState(2340);

  return (
    <WellField3dPanelFrame>
      <div className="flex w-full flex-col gap-4">
        <div className="rounded-lg border border-default bg-card-background px-4 py-3">
          <WellField3dDepthRuler depth={depth} onChange={setDepth} />
        </div>
        <ul aria-label="Horizons" className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
          {WELLFIELD3D_HORIZONS.map((horizon) => (
            <li key={horizon.id} className="flex items-baseline justify-between gap-2">
              <span className={depth >= horizon.depth ? 'text-base-foreground' : 'text-muted-foreground'}>{horizon.name}</span>
              <span className="tabular-nums text-muted-foreground">{formatReading(horizon.depth, 'm')}</span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">Ticks under the slider mark the horizons, so the thumb can be parked on a formation top.</p>
      </div>
    </WellField3dPanelFrame>
  );
}

function WellField3dPartDepthList() {
  return (
    <WellField3dPanelFrame>
      <div className="flex w-full max-w-sm flex-col gap-1 rounded-lg border border-default bg-card-background p-4">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">At 1,700 m below seabed</span>
        <WellField3dDepthList depth={1700} />
      </div>
    </WellField3dPanelFrame>
  );
}

function WellField3dPartWellCard() {
  const [id, setId] = useState('a03');
  const model = WELLFIELD3D_MODELS.find((candidate) => candidate.well.id === id) ?? WELLFIELD3D_MODELS[0];

  return (
    <WellField3dPanelFrame>
      <div className="flex w-full max-w-sm flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          {['a03', 'a05', 'a06'].map((candidate) => (
            <Button key={candidate} variant={candidate === id ? 'secondary' : 'outline'} size="sm" aria-pressed={candidate === id} onClick={() => setId(candidate)}>
              {WELLFIELD3D_MODELS.find((entry) => entry.well.id === candidate)?.well.name}
            </Button>
          ))}
        </div>
        <WellField3dWellCard key={model.well.id} model={model} />
      </div>
    </WellField3dPanelFrame>
  );
}

function WellField3dPartFallback() {
  return (
    <ThemeScope preset="ember" className="w-full">
      <div className="h-[30rem] w-full overflow-hidden rounded-xl border border-default">
        <SceneCanvas label="3D model of the Nordkapp Vest well field" forceFallback fallback={<WellField3dFallback />}>
          <SceneLights />
        </SceneCanvas>
      </div>
    </ThemeScope>
  );
}

export default definePage({
  id: 'well-field-3d',
  title: 'Well field',
  summary:
    'The subsurface under one template: well paths curving down through the horizons into the reservoir. A cutting plane moves through the block and the rail beside it says what every well is doing at that depth.',
  guidance: {
    use: [
      'When depth is the question: which formation, which casing string, how steep the well is at a level.',
      'With paths computed from surveys, so the picture and the numbers in the rail come from the same stations.',
      'With type told twice: producers point up, injectors point down, and each has its own colour.',
      'With view presets for the classic drawings: side section and plan, next to free orbiting.',
    ],
    avoid: [
      'Reading rates off the scene. Rates, choke and water cut belong on the well card.',
      'True-scale wellheads: slots a few metres apart vanish next to three-kilometre paths, so the template is drawn larger.',
      'All layers on while following one well. Selecting a well ghosts the others; switch horizons off for a clean plan view.',
      'A vertical slider that grows upward for depth. Depth increases to the right here, with the horizons marked under the track.',
    ],
  },
  source,
  sections: [
    {
      id: 'experience',
      title: 'Experience',
      description:
        'Drag to orbit, scroll to zoom. Move the depth slider to send the cutting plane down through the block: rings mark where wells cross it and the rail lists formation, casing and inclination for each. Click a well, its label or its row to follow it and open its card; Escape lets go. Layers and view presets sit on the scene.',
      specimens: [
        {
          id: 'WellField3dFieldEmber',
          title: 'Well field',
          note: 'Pick it when production and subsurface people need one picture of where the wells go and what they pass through.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'three/models/WellFieldScene.tsx',
            'three/models/wellPath.ts',
            'three/models/horizonHeight.ts',
            'three/models/WellTube.tsx',
            'three/models/HorizonSurface.tsx',
            'three/models/Wellhead.tsx',
            'three/models/SubseaTemplate.tsx',
            'three/models/DepthPlane.tsx',
            'three/models/ReservoirZone.tsx',
            'three/models/wellFieldCamera.ts',
            'three/models/wellFieldTokens.ts',
            'three/models/StillScene.tsx',
            'three/SceneCanvas.tsx',
            'three/useTokenColors.ts',
            'industrial/Sparkline.tsx',
            'industrial/ValueReadout.tsx',
            'industrial/StatusIndicator.tsx',
            'themes/ThemeScope.tsx',
          ],
          Component: WellField3dFieldEmber,
        },
      ],
    },
    {
      id: 'themes',
      title: 'In other themes',
      description: 'The same field in two more presets, opened in the other two views and held still.',
      specimens: [
        {
          id: 'WellField3dFieldHologram',
          title: 'Hologram, side section on one well',
          note: 'Pick the side section to check a landing: the plane sits in the reservoir and one horizontal producer is in focus.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['three/models/WellFieldScene.tsx', 'three/models/wellFieldCamera.ts', 'three/models/StillScene.tsx', 'themes/ThemeScope.tsx'],
          Component: WellField3dFieldHologram,
        },
        {
          id: 'WellField3dFieldAuraDark',
          title: 'Aura dark, plan view',
          note: 'Pick the plan view with horizons off to see drainage: where each well heads from the template.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['three/models/WellFieldScene.tsx', 'three/models/wellFieldCamera.ts', 'three/models/StillScene.tsx', 'themes/ThemeScope.tsx'],
          Component: WellField3dFieldAuraDark,
        },
      ],
    },
    {
      id: 'parts',
      title: 'Parts',
      description: 'Scene pieces on their own, and the panels that read the scene.',
      specimens: [
        {
          id: 'WellField3dPartHorizon',
          title: 'Horizon surface',
          note: 'Pick a faceted, see-through surface for a formation top; relief is exaggerated six times here to show the shape.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['three/models/HorizonSurface.tsx', 'three/models/horizonHeight.ts', 'three/models/StillScene.tsx'],
          Component: WellField3dPartHorizon,
        },
        {
          id: 'WellField3dPartWellheads',
          title: 'Wellheads on a template',
          note: 'Pick shape plus colour for well type, so producers and injectors differ even in greyscale.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['three/models/Wellhead.tsx', 'three/models/SubseaTemplate.tsx', 'three/models/wellFieldTokens.ts'],
          Component: WellField3dPartWellheads,
        },
        {
          id: 'WellField3dPartLayers',
          title: 'Layers and view',
          note: 'Pick a short checklist for what the scene draws and a segmented control for the three standard views.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['three/models/wellFieldCamera.ts'],
          Component: WellField3dPartLayers,
        },
        {
          id: 'WellField3dPartSurvey',
          title: 'Survey to path',
          note: 'Pick the table when someone needs to check the numbers behind a path: stations in, positions out.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['three/models/wellPath.ts'],
          Component: WellField3dPartSurvey,
        },
        {
          id: 'WellField3dPartDepthRuler',
          title: 'Depth ruler',
          note: 'Pick it to move a cutting plane: the track is the depth axis and the ticks are the formation tops.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/ValueReadout.tsx', 'three/models/horizonHeight.ts'],
          Component: WellField3dPartDepthRuler,
        },
        {
          id: 'WellField3dPartDepthList',
          title: 'Wells at a depth',
          note: 'Pick it as the readout of a cutting plane: formation, lining and inclination per well, and which wells end above it.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['three/models/wellPath.ts', 'three/models/horizonHeight.ts'],
          Component: WellField3dPartDepthList,
        },
        {
          id: 'WellField3dPartWellCard',
          title: 'Well card',
          note: 'Pick it for the selected well: status, rates, choke and a month of production, for producers and injectors alike.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/Sparkline.tsx', 'industrial/ValueReadout.tsx', 'industrial/StatusIndicator.tsx'],
          Component: WellField3dPartWellCard,
        },
        {
          id: 'WellField3dPartFallback',
          title: 'Without WebGL',
          note: 'Pick a fallback that lists every well with type and status, so the field is still readable where 3D cannot render.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['three/SceneCanvas.tsx', 'three/webgl.ts', 'industrial/StatusIndicator.tsx'],
          Component: WellField3dPartFallback,
        },
      ],
    },
  ],
});
