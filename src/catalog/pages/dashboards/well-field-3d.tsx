import { SegmentedControl, SegmentedControlButton, SegmentedControlList } from '@cognite/aura/components/segmented-control';
import { Slider } from '@cognite/aura/components/slider';
import { useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';

import { DataTable } from '../../../library/kit/DataTable';
import type { DataTableColumn } from '../../../library/kit/DataTable';
import { Panel } from '../../../library/kit/Panel';
import { SparkLine } from '../../../library/kit/SparkLine';
import { StatusPill } from '../../../library/kit/StatusPill';
import { TagId } from '../../../library/kit/TagId';
import { formatNumber } from '../../../library/kit/tones';
import type { StatusTone } from '../../../library/kit/tones';
import type { SectionPoint } from '../../../library/kit/well-field-3d/sectionGeometry';
import { WellSection } from '../../../library/kit/well-field-3d/WellSection';
import type { WellSectionHorizon, WellSectionMark } from '../../../library/kit/well-field-3d/WellSection';
import { LookScope } from '../../../library/looks/LookScope';
import { CameraRig } from '../../../library/three/CameraRig';
import type { Vec3 } from '../../../library/three/cameraTargets';
import { formationAt, horizonDepthAt } from '../../../library/three/models/horizonHeight';
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
import { casingAtMd, deepestTvd, densifySurvey, pathPointToScene, pathToScene, planSurvey, pointAtMd, pointAtTvd, wellPath } from '../../../library/three/models/wellPath';
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

const WELLFIELD3D_STATUS: Record<WellField3dStatus, { tone: StatusTone; label: string; shape: 'dot' | 'ring' | 'square' }> = {
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

const WELLFIELD3D_SHORT_STATUS: Record<WellField3dStatus, string> = { flowing: 'Flowing', injecting: 'Injecting', choked: 'Choked', water: 'Water cut', 'shut-in': 'Shut in' };

const WELLFIELD3D_VIEWS: readonly { value: WellFieldView; label: string }[] = [
  { value: 'perspective', label: '3D' },
  { value: 'section', label: 'Side' },
  { value: 'plan', label: 'Plan' },
];

function wellField3dIsView(value: unknown): value is WellFieldView {
  return WELLFIELD3D_VIEWS.some((view) => view.value === value);
}

/** The section drawing keeps one extent for every well, so its scale never jumps between wells. */
const WELLFIELD3D_SECTION_DEPARTURE = Math.ceil(Math.max(...WELLFIELD3D_MODELS.flatMap((model) => model.path.map((point) => Math.hypot(point.north, point.east)))) / 500) * 500;

function wellField3dShoeLabel(casing: CasingString): string {
  return `${casing.name.replace(' surface casing', '').replace(' casing', '').replace(' conductor', '')} shoe`;
}

/** One well flattened onto the vertical plane through its azimuth: path, horizons along it, and the marks on the path. */
function wellField3dSection(model: WellField3dModel): { path: SectionPoint[]; horizons: WellSectionHorizon[]; marks: WellSectionMark[] } {
  const azimuth = (model.well.plan.azimuth * Math.PI) / 180;
  const flatten = (point: WellPathPoint): SectionPoint => ({ departure: Math.hypot(point.north, point.east), tvd: point.tvd });
  const steps = Array.from({ length: WELLFIELD3D_SECTION_DEPARTURE / 250 + 1 }, (_, index) => index * 250);
  const kickoff = pointAtMd(model.path, model.well.plan.kickoffMd);
  const toe = model.path[model.path.length - 1];
  const shoes = model.casings.filter((casing) => casing.shoeMd > 300 && casing.shoeMd < model.well.plan.tdMd);

  return {
    path: model.path.map(flatten),
    horizons: WELLFIELD3D_HORIZONS.map((horizon) => ({
      id: horizon.id,
      name: horizon.name,
      points: steps.map((departure) => ({ departure, tvd: horizonDepthAt(horizon, Math.sin(azimuth) * departure, Math.cos(azimuth) * departure) })),
    })),
    marks: [
      ...(kickoff ? [{ id: 'kickoff', kind: 'kickoff' as const, label: `Kick-off ${formatNumber(model.well.plan.kickoffMd)} m`, ...flatten(kickoff) }] : []),
      ...shoes.flatMap((casing) => {
        const point = pointAtMd(model.path, casing.shoeMd);
        return point ? [{ id: casing.name, kind: 'shoe' as const, label: wellField3dShoeLabel(casing), ...flatten(point) }] : [];
      }),
      { id: 'td', kind: 'td' as const, label: `TD ${formatNumber(toe.md)} m MD`, ...flatten(toe) },
    ],
  };
}

/** Scene labels are plain DOM: keep them in the UI sans at a readable size. */
const WELLFIELD3D_SCENE_TYPE = '[&_.font-mono]:[font-family:inherit] [&_.font-mono]:tabular-nums [&_[data-slot=scene-label]>:first-child]:text-[0.8125rem]';

const WELLFIELD3D_FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ring-default)]';

/** Producers point up, injectors point down: the same shapes as the wellheads in the scene. */
function WellField3dKindMark({ kind }: { kind: WellheadKind }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 12 12" className="size-3 shrink-0 fill-current">
      <path d={kind === 'producer' ? 'M6 1 11 11H1Z' : 'M6 11 11 1H1Z'} />
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

/** The well index: every slot on the template as a cell of the drawing; the picked one is inked in. */
function WellField3dPicker({ selectedId, onSelect }: { selectedId: string; onSelect: (id: string) => void }) {
  return (
    <ul aria-label="Wells on template A" className="grid h-full grid-cols-3 @2xl:grid-cols-9">
      {WELLFIELD3D_WELLS.map((well) => {
        const status = WELLFIELD3D_STATUS[well.status];
        const selected = well.id === selectedId;
        return (
          <li key={well.id} className="flex border-b border-r border-[var(--kit-rule)] @2xl:border-b-0 @2xl:last:border-r-0">
            <button
              type="button"
              aria-pressed={selected}
              aria-label={`${well.name}, ${well.kind}, ${status.label}`}
              onClick={() => onSelect(well.id)}
              className={`flex w-full flex-col justify-center gap-1 px-3 py-2 text-left hover:bg-[color-mix(in_oklab,var(--kit-text)_8%,transparent)] aria-pressed:bg-[var(--kit-text)] aria-pressed:text-[var(--kit-halo)] ${WELLFIELD3D_FOCUS}`}
            >
              <span className="flex items-center gap-1.5 text-sm font-semibold tabular-nums">
                <WellField3dKindMark kind={well.kind} />
                {well.name.slice(3, 7)}
              </span>
              <span data-tone={status.tone} className={`whitespace-nowrap text-xs font-medium ${selected || status.tone === 'neutral' ? '' : 'text-[var(--t-ink)]'}`}>
                {WELLFIELD3D_SHORT_STATUS[well.status]}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/** The title block every drawing carries in its corner. */
function WellField3dTitleBlock({ sheet, title }: { sheet: string; title: string }) {
  const cells = [
    { label: 'Licence', value: 'PL 1042' },
    { label: 'Datum', value: 'Seabed' },
    { label: 'Scale', value: '1 : 25 000' },
    { label: 'Sheet', value: sheet },
  ];
  return (
    <div className="flex h-full flex-col border border-[var(--kit-text)] bg-[var(--kit-surface)] text-[var(--kit-text)]">
      <div className="flex flex-1 flex-col justify-center border-b border-[var(--kit-text)] px-3 py-1.5">
        <span className="text-xs text-[var(--kit-text-2)]">Drawing</span>
        <span className="text-[0.9375rem] font-semibold leading-tight">{title}</span>
      </div>
      <dl className="grid grid-cols-2">
        {cells.map((cell, index) => (
          <div key={cell.label} className={`flex flex-col px-3 py-1 ${index % 2 === 0 ? 'border-r border-[var(--kit-rule)]' : ''} ${index < 2 ? 'border-b border-[var(--kit-rule)]' : ''}`}>
            <dt className="text-xs text-[var(--kit-text-2)]">{cell.label}</dt>
            <dd className="whitespace-nowrap text-[0.8125rem] font-medium tabular-nums">{cell.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function WellField3dFigure({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="flex min-w-0 flex-col border-l border-[var(--kit-rule)] pl-3 first:border-l-0 first:pl-0">
      <dt className="whitespace-nowrap text-xs text-[var(--kit-text-2)]">{label}</dt>
      <dd className="flex items-baseline gap-1 whitespace-nowrap">
        <span className="text-xl font-medium tabular-nums text-[var(--kit-text)]">{value}</span>
        {unit ? <span className="text-xs text-[var(--kit-text-2)]">{unit}</span> : null}
      </dd>
    </div>
  );
}

/** Production or injection figures of one well, as a ruled strip under its section. */
function WellField3dFigures({ model, depth }: { model: WellField3dModel; depth: number }) {
  const { well } = model;
  const at = wellField3dAtDepth(model, depth);
  const status = WELLFIELD3D_STATUS[well.status];
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <span className="flex items-center gap-2 text-[0.8125rem] text-[var(--kit-text)]">
          <StatusPill tone={status.tone}>{status.label}</StatusPill>
          {well.service}
        </span>
        <span className="text-[0.8125rem] tabular-nums text-[var(--kit-text-2)]">
          {at.reached ? `At ${formatNumber(depth)} m: ${at.formation}, ${at.lining.toLowerCase()}, ${formatNumber(at.inc)}° inclination` : `Ends above the plane, at ${formatNumber(at.td)} m TVD`}
        </span>
      </div>
      <dl className="grid grid-cols-4 gap-3 border-t border-[var(--kit-text)] pt-2.5">
        <WellField3dFigure label={well.kind === 'producer' ? 'Oil rate' : 'Injection rate'} value={formatNumber(well.rate)} unit={well.rateUnit} />
        {well.kind === 'producer' ? <WellField3dFigure label="Water cut" value={formatNumber(well.waterCut ?? 0)} unit="%" /> : <WellField3dFigure label="Total depth" value={formatNumber(well.plan.tdMd)} unit="m MD" />}
        <WellField3dFigure label="Choke" value={formatNumber(well.choke)} unit="%" />
        <WellField3dFigure label="Wellhead pressure" value={formatNumber(well.wellheadPressure)} unit="barg" />
      </dl>
    </div>
  );
}

function WellField3dSectionDrawing({ model, depth, className = '' }: { model: WellField3dModel; depth?: number; className?: string }) {
  const section = wellField3dSection(model);
  return (
    <WellSection
      className={className}
      label={`Vertical section of ${model.well.name} along azimuth ${model.well.plan.azimuth} degrees: depth against departure, with horizons, casing shoes and total depth`}
      path={section.path}
      horizons={section.horizons}
      band={{ topId: WELLFIELD3D_RESERVOIR.topId, baseId: WELLFIELD3D_RESERVOIR.baseId, label: 'Reservoir' }}
      marks={section.marks}
      plane={depth === undefined ? undefined : { tvd: depth, label: 'Plane' }}
      maxDeparture={WELLFIELD3D_SECTION_DEPARTURE}
      maxDepth={WELLFIELD3D_MAX_DEPTH}
    />
  );
}

function WellField3dFallback() {
  return (
    <ul className="flex flex-col border border-default bg-card-background px-3">
      {WELLFIELD3D_WELLS.map((well) => (
        <li key={well.id} className="flex items-center justify-between gap-3 border-b border-default py-1.5 text-sm last:border-b-0">
          <span className="flex min-w-0 items-center gap-2 text-base-foreground">
            <WellField3dKindMark kind={well.kind} />
            <TagId>{well.name}</TagId>
          </span>
          <StatusPill tone={WELLFIELD3D_STATUS[well.status].tone}>{WELLFIELD3D_STATUS[well.status].label}</StatusPill>
        </li>
      ))}
    </ul>
  );
}

function WellField3dScene({ depth, selectedId, onSelect, view, still, layers }: { depth: number; selectedId: string | null; onSelect: (id: string) => void; view: WellFieldView; still: boolean; layers?: WellFieldLayers }) {
  const scope = useRef<HTMLDivElement>(null);
  const colors = useTokenColors(WELL_FIELD_TOKENS, scope);
  const selected = WELLFIELD3D_MODELS.find((model) => model.well.id === selectedId);
  return (
    <div ref={scope} className="relative h-full min-h-0 w-full">
      <SceneCanvas
        label={`3D model of the Nordkapp Vest well field: ${WELLFIELD3D_WELLS.length} wells below a subsea template, cutting plane at ${formatNumber(depth)} metres below the seabed${selected ? `, ${selected.well.name} selected` : ''}`}
        fallback={<WellField3dFallback />}
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
            onSelect={onSelect}
            colors={colors}
            padding={view === 'perspective' ? 1.12 : 0.9}
          />
        </StillScene>
      </SceneCanvas>
    </div>
  );
}

function WellField3dPlaneControl({ depth, onChange }: { depth: number; onChange: (depth: number) => void }) {
  return (
    <div className="flex w-full items-center gap-4">
      <div className="flex shrink-0 flex-col">
        <span className="text-xs text-[var(--kit-text-2)]">Cutting plane, {wellField3dInterval(depth)}</span>
        <span className="text-base font-medium tabular-nums text-[var(--kit-text)]">{formatNumber(depth)} m TVD</span>
      </div>
      <Slider aria-label="Depth of the cutting plane in metres below the seabed" value={[depth]} min={0} max={WELLFIELD3D_MAX_DEPTH} step={20} onValueChange={(value) => onChange(value[0] ?? 0)} />
    </div>
  );
}

type WellField3dInitial = { depth?: number; selectedId?: string; view?: WellFieldView };

function WellField3dDrawing({ initial = {}, still = false }: { initial?: WellField3dInitial; still?: boolean }) {
  // Archetype: engineering drawing — the 3D field model and a true-scale section of one well as
  //   two views of the same sheet, with a well index and a title block along the bottom edge.
  // Interaction: pick a well in the index or in the model and the section redraws for it; the
  //   cutting plane is one depth shared by both views.
  const [depth, setDepth] = useState(initial.depth ?? 1240);
  const [selectedId, setSelectedId] = useState(initial.selectedId ?? 'a01');
  const [view, setView] = useState<WellFieldView>(initial.view ?? 'perspective');
  const selected = WELLFIELD3D_MODELS.find((model) => model.well.id === selectedId) ?? WELLFIELD3D_MODELS[0];
  const reached = wellField3dCrossings(depth).length;

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = WELLFIELD3D_WELLS.findIndex((well) => well.id === selected.well.id);
    if (!(event.target instanceof HTMLCanvasElement) && event.target !== event.currentTarget) return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      const next = (index + (event.key === 'ArrowRight' ? 1 : -1) + WELLFIELD3D_WELLS.length) % WELLFIELD3D_WELLS.length;
      setSelectedId(WELLFIELD3D_WELLS[next].id);
    }
  };

  return (
    <div
      tabIndex={-1}
      onKeyDown={onKeyDown}
      onPointerDownCapture={(event) => {
        // Orbit controls swallow the pointer event, so take focus by hand to keep the arrow keys working.
        if (event.target instanceof HTMLCanvasElement) event.currentTarget.focus({ preventScroll: true });
      }}
      className={`grid h-[52rem] w-full grid-cols-[minmax(0,11fr)_minmax(0,10fr)] grid-rows-[minmax(0,1fr)_auto] gap-6 p-7 text-[var(--kit-text)] outline-none [background:var(--kit-canvas-bg)] ${WELLFIELD3D_SCENE_TYPE}`}
    >
      <Panel
        className="min-h-0"
        padding="none"
        title="Field model"
        subtitle={`${reached} of ${WELLFIELD3D_WELLS.length} wells cross the plane`}
        actions={<WellField3dViewSwitch view={view} onChange={setView} />}
        footer={<WellField3dPlaneControl depth={depth} onChange={setDepth} />}
      >
        <WellField3dScene depth={depth} selectedId={selected.well.id} onSelect={setSelectedId} view={view} still={still} />
      </Panel>

      <Panel className="min-h-0" title={`Section A–A′, ${selected.well.name}`} subtitle={`Along azimuth ${selected.well.plan.azimuth}°, true scale, metres`} footer={<WellField3dFigures model={selected} depth={depth} />}>
        <WellField3dSectionDrawing model={selected} depth={depth} className="min-h-0 flex-1" />
      </Panel>

      <div className="@container col-span-2 grid grid-cols-[minmax(0,1fr)_17rem] gap-6">
        <Panel padding="none" title="Well index" subtitle="Template A, 9 slots">
          <WellField3dPicker selectedId={selected.well.id} onSelect={setSelectedId} />
        </Panel>
        <WellField3dTitleBlock title="Well field, model and section" sheet="3 of 9" />
      </div>
    </div>
  );
}

function WellField3dSignature() {
  return (
    <LookScope look="blueprint" className="w-full">
      <WellField3dDrawing />
    </LookScope>
  );
}

type WellField3dStation = { md: number; inc: number; azi: number; tvd: number; north: number; east: number };

const WELLFIELD3D_SURVEY_COLUMNS: DataTableColumn<WellField3dStation>[] = [
  { id: 'md', header: 'MD', numeric: true, cell: (station) => formatNumber(station.md) },
  { id: 'inc', header: 'Inc', numeric: true, muted: true, cell: (station) => `${formatNumber(station.inc, 1)}°` },
  { id: 'azi', header: 'Azi', numeric: true, muted: true, cell: (station) => `${formatNumber(station.azi)}°` },
  { id: 'tvd', header: 'TVD', numeric: true, cell: (station) => formatNumber(station.tvd) },
  { id: 'north', header: 'North', numeric: true, muted: true, cell: (station) => formatNumber(station.north) },
  { id: 'east', header: 'East', numeric: true, muted: true, cell: (station) => formatNumber(station.east) },
];

function WellField3dSurveyTable({ model, step = 500 }: { model: WellField3dModel; step?: number }) {
  const stations = wellPath(planSurvey(model.well.plan, step));
  return <DataTable flush label={`Survey stations of ${model.well.name}`} columns={WELLFIELD3D_SURVEY_COLUMNS} rows={stations} rowKey={(station) => String(station.md)} />;
}

/** One well as a drawing sheet: no 3D, the section large, the survey and the casing programme beside it. */
function WellField3dWellSheet() {
  const model = WELLFIELD3D_MODELS[2];
  return (
    <LookScope look="blueprint" className="w-full">
      <div className="grid h-[46rem] w-full grid-cols-[minmax(0,6fr)_minmax(0,5fr)] grid-rows-[minmax(0,1fr)_auto] gap-6 p-7 text-[var(--kit-text)] [background:var(--kit-canvas-bg)]">
        <Panel className="row-span-2 min-h-0" title={`Section A–A′, ${model.well.name}`} subtitle={`Along azimuth ${model.well.plan.azimuth}°, true scale, metres`} footer={<WellField3dFigures model={model} depth={1900} />}>
          <WellField3dSectionDrawing model={model} depth={1900} className="min-h-0 flex-1" />
        </Panel>
        <Panel className="min-h-0" padding="none" title="Survey" subtitle="Minimum curvature, metres from the wellhead">
          <div className="min-h-0 flex-1 overflow-y-auto">
            <WellField3dSurveyTable model={model} step={600} />
          </div>
        </Panel>
        <div className="grid grid-cols-[minmax(0,1fr)_14rem] gap-6">
          <Panel title="Casing programme">
            <ol className="flex flex-col">
              {model.casings.map((casing) => (
                <li key={casing.name} className="flex items-baseline justify-between gap-3 border-b border-[var(--kit-rule)] py-1 text-[0.8125rem] last:border-b-0">
                  <span className="whitespace-nowrap text-[var(--kit-text)]">{casing.name.replace(' casing', '')}</span>
                  <span className="whitespace-nowrap tabular-nums text-[var(--kit-text-2)]">shoe {formatNumber(casing.shoeMd)} m</span>
                </li>
              ))}
            </ol>
          </Panel>
          <WellField3dTitleBlock title={model.well.name} sheet="6 of 9" />
        </div>
      </div>
    </LookScope>
  );
}

type WellField3dRow = { model: WellField3dModel; history: number[] };

/** The whole template from above: the plan view beside the well list, with no well in section. */
function WellField3dFieldPlan() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const rows: WellField3dRow[] = WELLFIELD3D_MODELS.map((model) => ({ model, history: wellField3dHistory(model.well) }));
  const columns: DataTableColumn<WellField3dRow>[] = [
    {
      id: 'well',
      header: 'Well',
      nowrap: true,
      cell: (row) => (
        <button
          type="button"
          aria-pressed={row.model.well.id === selectedId}
          onClick={() => setSelectedId(row.model.well.id === selectedId ? null : row.model.well.id)}
          className={`-mx-1 flex items-center gap-1.5 px-1 font-semibold tabular-nums hover:underline aria-pressed:bg-[var(--kit-text)] aria-pressed:text-[var(--kit-halo)] ${WELLFIELD3D_FOCUS}`}
        >
          <WellField3dKindMark kind={row.model.well.kind} />
          {row.model.well.name}
        </button>
      ),
    },
    { id: 'status', header: 'Status', nowrap: true, cell: (row) => <StatusPill tone={WELLFIELD3D_STATUS[row.model.well.status].tone}>{WELLFIELD3D_STATUS[row.model.well.status].label}</StatusPill> },
    { id: 'rate', header: 'Rate', numeric: true, nowrap: true, cell: (row) => `${formatNumber(row.model.well.rate)} ${row.model.well.rateUnit}` },
    {
      id: 'trend',
      header: '30 days',
      width: 'w-24',
      cell: (row) => (
        <div className="w-20">
          <SparkLine values={row.history} label={`${row.model.well.name} rate, last 30 days`} highlightLast={false} />
        </div>
      ),
    },
    { id: 'td', header: 'TD, m MD', numeric: true, muted: true, cell: (row) => formatNumber(row.model.well.plan.tdMd) },
  ];
  return (
    <LookScope look="blueprint" className="w-full">
      <div className={`grid h-[42rem] w-full grid-cols-[minmax(0,5fr)_minmax(0,6fr)] gap-6 p-7 text-[var(--kit-text)] [background:var(--kit-canvas-bg)] ${WELLFIELD3D_SCENE_TYPE}`}>
        <Panel className="min-h-0" padding="none" title="Plan view" subtitle="North up, wellbores projected to the seabed">
          <WellField3dScene depth={2400} selectedId={selectedId} onSelect={(id) => setSelectedId(id === selectedId ? null : id)} view="plan" still layers={{ horizons: false, wellbores: true, reservoir: true, labels: true }} />
        </Panel>
        <div className="grid min-h-0 grid-rows-[minmax(0,1fr)_auto] gap-6">
          <Panel className="min-h-0" padding="none" title="Wells" subtitle="5 producing, 2 injecting, 2 shut in">
            <div className="min-h-0 flex-1 overflow-y-auto">
              <DataTable flush label="Wells on template A" columns={columns} rows={rows} rowKey={(row) => row.model.well.id} rowTone={(row) => (row.model.well.status === 'water' ? 'warning' : undefined)} />
            </div>
          </Panel>
          <div className="grid grid-cols-[minmax(0,1fr)_17rem] gap-6">
            <Panel title="Legend">
              <ul className="flex flex-wrap gap-x-5 gap-y-1 text-[0.8125rem] text-[var(--kit-text)]">
                <li className="flex items-center gap-1.5">
                  <WellField3dKindMark kind="producer" /> Producer
                </li>
                <li className="flex items-center gap-1.5">
                  <WellField3dKindMark kind="injector" /> Injector
                </li>
                <li className="flex items-center gap-1.5">
                  <span aria-hidden="true" className="size-2.5 rounded-full border-2 border-current" /> Crosses 2,400 m here
                </li>
              </ul>
            </Panel>
            <WellField3dTitleBlock title="Well field, plan" sheet="1 of 9" />
          </div>
        </div>
      </div>
    </LookScope>
  );
}

function WellField3dPartFrame({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <LookScope look="blueprint" className="w-full">
      <div className={`flex w-full flex-col gap-5 p-6 text-[var(--kit-text)] [background:var(--kit-canvas-bg)] ${className}`}>{children}</div>
    </LookScope>
  );
}

function WellField3dPartSection() {
  const [wellId, setWellId] = useState('a02');
  const model = WELLFIELD3D_MODELS.find((candidate) => candidate.well.id === wellId) ?? WELLFIELD3D_MODELS[0];
  return (
    <WellField3dPartFrame className="h-[34rem]">
      <Panel
        className="min-h-0 flex-1"
        title={`Section A–A′, ${model.well.name}`}
        subtitle={model.well.service}
        actions={
          <SegmentedControl value={wellId} onValueChange={(value) => setWellId(value)}>
            <SegmentedControlList size="small" aria-label="Well in section">
              <SegmentedControlButton value="a02">A-02</SegmentedControlButton>
              <SegmentedControlButton value="a05">A-05</SegmentedControlButton>
              <SegmentedControlButton value="a09">A-09</SegmentedControlButton>
            </SegmentedControlList>
          </SegmentedControl>
        }
      >
        <WellField3dSectionDrawing model={model} className="min-h-0 flex-1" />
      </Panel>
    </WellField3dPartFrame>
  );
}

function WellField3dPartSurvey() {
  const model = WELLFIELD3D_MODELS[0];
  return (
    <WellField3dPartFrame className="h-[34rem]">
      <Panel className="min-h-0 flex-1" padding="none" title={`Survey, ${model.well.name}`} subtitle="Measured depth, inclination and azimuth are the inputs">
        <div className="min-h-0 flex-1 overflow-y-auto">
          <WellField3dSurveyTable model={model} step={400} />
        </div>
      </Panel>
    </WellField3dPartFrame>
  );
}

function WellField3dPartPicker() {
  const [selectedId, setSelectedId] = useState('a03');
  return (
    <WellField3dPartFrame className="@container">
      <Panel padding="none" title="Well index" subtitle="Template A, 9 slots">
        <WellField3dPicker selectedId={selectedId} onSelect={setSelectedId} />
      </Panel>
    </WellField3dPartFrame>
  );
}

function WellField3dPartTitleBlock() {
  return (
    <WellField3dPartFrame className="h-full justify-center">
      <div className="h-28">
        <WellField3dTitleBlock title="Well field, model and section" sheet="3 of 9" />
      </div>
    </WellField3dPartFrame>
  );
}

function WellField3dPartPlane() {
  const [depth, setDepth] = useState(2340);
  const model = WELLFIELD3D_MODELS[4];
  return (
    <WellField3dPartFrame className="h-80 justify-center">
      <Panel title="Cutting plane" subtitle="One depth for the model and the section">
        <div className="flex flex-col gap-4">
          <WellField3dPlaneControl depth={depth} onChange={setDepth} />
          <WellField3dFigures model={model} depth={depth} />
        </div>
      </Panel>
    </WellField3dPartFrame>
  );
}

function WellField3dPartWellheads() {
  const scope = useRef<HTMLDivElement>(null);
  const colors = useTokenColors(WELL_FIELD_TOKENS, scope);
  const target = wellFieldCameraTarget('perspective', { halfExtent: 3.4, depth: 0 }, { padding: 0.8 });
  return (
    <WellField3dPartFrame className="h-80">
      <Panel className="min-h-0 flex-1" padding="none" title="Template and wellheads" subtitle="Up produces, down injects">
        <div ref={scope} className="relative h-full min-h-0 w-full">
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
        </div>
      </Panel>
    </WellField3dPartFrame>
  );
}

function WellField3dPartHorizon() {
  const scope = useRef<HTMLDivElement>(null);
  const colors = useTokenColors(WELL_FIELD_TOKENS, scope);
  const horizon = WELLFIELD3D_HORIZONS[2];
  const target = wellFieldCameraTarget('perspective', { halfExtent: 20, depth: 3 }, { padding: 0.85 });
  return (
    <WellField3dPartFrame className="h-80">
      <Panel className="min-h-0 flex-1" padding="none" title={horizon.name} subtitle={`Mean depth ${formatNumber(horizon.depth)} m, relief exaggerated six times`}>
        <div ref={scope} className="relative h-full min-h-0 w-full">
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
      </Panel>
    </WellField3dPartFrame>
  );
}

export default definePage({
  id: 'well-field-3d',
  title: 'Well field',
  summary:
    'Nine wells under a subsea template, as an engineering drawing with two views: the 3D field model and a true-scale vertical section of the well you pick, with horizons, casing shoes and dimension lines. One cutting plane depth runs through both.',
  guidance: {
    use: [
      'When geometry below ground is the subject: well planning, anti-collision reviews, completion design.',
      'With the section beside the model: the model says where the well goes, the section says how deep and how far.',
      'With one scale and one extent for every well, so two sections can be compared by eye.',
      'With a well index beside the canvas, so every well can be picked without a pointer.',
    ],
    avoid: [
      'Colour for anything but the two well kinds and the one reference plane: it is a drawing.',
      'A stretched depth axis without saying so. True scale keeps the angles honest.',
      'Labels that shrink with the drawing. Draw in real pixels and keep text at reading size.',
      'Production monitoring in this view: rates are a footnote here, not the story.',
    ],
  },
  source,
  sections: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description:
        'Pick a well in the index along the bottom, or click its path in the model: the section on the right redraws for that well and the figures under it follow. Drag the cutting plane to move one depth through both views. 3D, Side and Plan turn the model; drag to orbit, scroll to zoom. With the model focused, the arrow keys step through the wells.',
      specimens: [
        {
          id: 'WellField3dSignature',
          title: 'Model and section',
          note: 'Pick it when people need to read one well exactly while keeping its neighbours in view.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'three/SceneCanvas.tsx',
            'three/models/WellFieldScene.tsx',
            'three/models/wellPath.ts',
            'three/models/horizonHeight.ts',
            'three/models/wellFieldTokens.ts',
            'kit/well-field-3d/WellSection.tsx',
            'kit/well-field-3d/sectionGeometry.ts',
            'kit/Panel.tsx',
            'kit/StatusPill.tsx',
            'looks/LookScope.tsx',
          ],
          Component: WellField3dSignature,
        },
      ],
    },
    {
      id: 'variations',
      title: 'Other sheets',
      description: 'Two more sheets of the same drawing set: one well with its survey and casing programme and no 3D at all, and the whole template from above beside the well list.',
      specimens: [
        {
          id: 'WellField3dWellSheet',
          title: 'Well sheet',
          note: 'Pick it for the review of one well: the section large, the survey stations and the casing programme beside it.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['kit/well-field-3d/WellSection.tsx', 'kit/DataTable.tsx', 'kit/Panel.tsx', 'three/models/wellPath.ts', 'looks/LookScope.tsx'],
          Component: WellField3dWellSheet,
        },
        {
          id: 'WellField3dFieldPlan',
          title: 'Field plan',
          note: 'Pick it as the index sheet: where every well goes seen from above, and what each one is doing.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['three/models/WellFieldScene.tsx', 'three/models/StillScene.tsx', 'kit/DataTable.tsx', 'kit/SparkLine.tsx', 'kit/StatusPill.tsx', 'looks/LookScope.tsx'],
          Component: WellField3dFieldPlan,
        },
      ],
    },
    {
      id: 'parts',
      title: 'Parts',
      description: 'The section drawing, the survey table, the well index, the title block, the plane control and two models.',
      specimens: [
        {
          id: 'WellField3dPartSection',
          title: 'Section drawing',
          note: 'Pick it for one well in true scale: depth against departure with horizons, shoes and dimension lines.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['kit/well-field-3d/WellSection.tsx', 'kit/well-field-3d/sectionGeometry.ts', 'kit/Panel.tsx'],
          Component: WellField3dPartSection,
        },
        {
          id: 'WellField3dPartSurvey',
          title: 'Survey table',
          note: 'Pick it to show the numbers behind a path: three measured columns and three computed ones.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['kit/DataTable.tsx', 'kit/Panel.tsx', 'three/models/wellPath.ts'],
          Component: WellField3dPartSurvey,
        },
        {
          id: 'WellField3dPartPicker',
          title: 'Well index',
          note: 'Pick it to choose one of a fixed set: the slots of a template as cells, the picked one inked in.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['kit/Panel.tsx'],
          Component: WellField3dPartPicker,
        },
        {
          id: 'WellField3dPartTitleBlock',
          title: 'Title block',
          note: 'Pick it to sign a drawing: what it shows, its datum, scale and sheet number in one corner.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          Component: WellField3dPartTitleBlock,
        },
        {
          id: 'WellField3dPartPlane',
          title: 'Cutting plane control',
          note: 'Pick it to move one depth through every view: the formation and what lines the hole update as it moves.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['kit/Panel.tsx', 'kit/StatusPill.tsx', 'three/models/horizonHeight.ts'],
          Component: WellField3dPartPlane,
        },
        {
          id: 'WellField3dPartWellheads',
          title: 'Template and wellheads',
          note: 'Pick it to tell producers from injectors at a glance: shape first, colour second.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['three/models/SubseaTemplate.tsx', 'three/models/Wellhead.tsx', 'three/CameraRig.tsx', 'three/models/StillScene.tsx'],
          Component: WellField3dPartWellheads,
        },
        {
          id: 'WellField3dPartHorizon',
          title: 'Horizon surface',
          note: 'Pick it for a geological surface: translucent, low-poly, with its relief exaggerated enough to read.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['three/models/HorizonSurface.tsx', 'three/models/horizonHeight.ts', 'three/CameraRig.tsx'],
          Component: WellField3dPartHorizon,
        },
      ],
    },
  ],
});
