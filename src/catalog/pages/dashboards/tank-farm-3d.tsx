import { Button } from '@cognite/aura/components/button';
import {
  SegmentedControl,
  SegmentedControlButton,
  SegmentedControlList,
} from '@cognite/aura/components/segmented-control';
import { Slider } from '@cognite/aura/components/slider';
import { Switch } from '@cognite/aura/components/switch';
import { IconArrowLeft } from '@cognite/aura/icons';
import { useReducer, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';

import { Sparkline } from '../../../library/industrial/Sparkline';
import { formatValue } from '../../../library/industrial/status';
import type { DotShape, Tone } from '../../../library/industrial/status';
import { StatusDot } from '../../../library/industrial/StatusDot';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { ValueReadout } from '../../../library/industrial/ValueReadout';
import { ThemeScope } from '../../../library/themes/ThemeScope';
import { Building } from '../../../library/three/Building';
import { FlareStack } from '../../../library/three/FlareStack';
import { PipeRun } from '../../../library/three/PipeRun';
import { SceneCanvas } from '../../../library/three/SceneCanvas';
import { BundWall } from '../../../library/three/scenes/BundWall';
import {
  activeMovements,
  daysOfCover,
  fillFraction,
  hourSteps,
  levelSeries,
  levelsAt,
  movementPhase,
  movementsOf,
  netRateAt,
  scrubberReducer,
  ullage,
} from '../../../library/three/scenes/inventoryProjection';
import type { InventoryMovement, InventoryTank, ScrubberAction, ScrubberState } from '../../../library/three/scenes/inventoryProjection';
import { Jetty } from '../../../library/three/scenes/Jetty';
import { SeaPlane } from '../../../library/three/scenes/SeaPlane';
import { StillScene } from '../../../library/three/scenes/StillScene';
import { TankerShip } from '../../../library/three/scenes/TankerShip';
import { TankFarm } from '../../../library/three/scenes/TankFarm';
import type { FarmFlow, FarmTank } from '../../../library/three/scenes/TankFarm';
import { bundRect, movementRoute } from '../../../library/three/scenes/tankFarmLayout';
import type { GroundRect, Manifold, ManifoldPort, TankSpot } from '../../../library/three/scenes/tankFarmLayout';
import { TimeScrubber } from '../../../library/three/scenes/TimeScrubber';
import type { ScrubberSpan } from '../../../library/three/scenes/TimeScrubber';
import { StorageTank } from '../../../library/three/StorageTank';
import type { TokenColors } from '../../../library/three/tokenColors';
import { TurntableStage } from '../../../library/three/TurntableStage';
import { useTokenColors } from '../../../library/three/useTokenColors';
import { HOUR, REFERENCE_NOW, formatDateTime } from '../../data/series';
import { definePage } from '../../types';

import source from './tank-farm-3d.tsx?raw';

type TankFarm3dProduct = 'crude' | 'condensate' | 'diesel' | 'gasoil' | 'methanol';

type TankFarm3dTank = TankSpot &
  InventoryTank & {
    tag: string;
    product: TankFarm3dProduct;
    row: 'north' | 'south';
  };

/** Chart tokens per product: categories, not status. Resolved to material colours for the rings. */
const TANKFARM3D_PRODUCT_TOKENS = {
  crude: 'chart-1-450',
  condensate: 'chart-2-450',
  diesel: 'chart-3-450',
  gasoil: 'chart-4-450',
  methanol: 'chart-5-450',
} as const;

const TANKFARM3D_PRODUCTS: Readonly<Record<TankFarm3dProduct, { name: string; swatch: string }>> = {
  crude: { name: 'Crude oil', swatch: 'bg-chart-1-450' },
  condensate: { name: 'Condensate', swatch: 'bg-chart-2-450' },
  diesel: { name: 'Diesel', swatch: 'bg-chart-3-450' },
  gasoil: { name: 'Marine gas oil', swatch: 'bg-chart-4-450' },
  methanol: { name: 'Methanol', swatch: 'bg-chart-5-450' },
};

/**
 * The Stord terminal tank farm: two bunded rows either side of the manifold header. x runs east
 * towards the jetty, z south; sizes in metres, volumes in m³ at 14:00 on 12 March.
 */
const TANKFARM3D_TANKS: readonly TankFarm3dTank[] = [
  { id: 'ta-201', tag: '61-TA-201', product: 'crude', row: 'north', center: [-66, -27], diameter: 18, height: 14, capacity: 20000, volume: 16400, dailyDemand: 4500 },
  { id: 'ta-202', tag: '61-TA-202', product: 'crude', row: 'north', center: [-40, -27], diameter: 18, height: 14, capacity: 20000, volume: 9800, dailyDemand: 3800 },
  { id: 'ta-203', tag: '61-TA-203', product: 'crude', row: 'north', center: [-15, -27], diameter: 16, height: 13, capacity: 20000, volume: 12600, dailyDemand: 3000 },
  { id: 'ta-204', tag: '61-TA-204', product: 'condensate', row: 'north', center: [9, -27], diameter: 14, height: 12, capacity: 12000, volume: 11000, dailyDemand: 2600 },
  { id: 'ta-205', tag: '61-TA-205', product: 'condensate', row: 'north', center: [32, -27], diameter: 14, height: 12, capacity: 12000, volume: 3100, dailyDemand: 900 },
  { id: 'ta-206', tag: '61-TA-206', product: 'diesel', row: 'south', center: [-64, 13], diameter: 16, height: 12, capacity: 8000, volume: 1100, dailyDemand: 420 },
  { id: 'ta-207', tag: '61-TA-207', product: 'gasoil', row: 'south', center: [-40, 13], diameter: 14, height: 11, capacity: 6000, volume: 4300, dailyDemand: 380 },
  { id: 'ta-208', tag: '61-TA-208', product: 'gasoil', row: 'south', center: [-18, 13], diameter: 12, height: 10, capacity: 4000, volume: 1900, dailyDemand: 260 },
  { id: 'ta-209', tag: '61-TA-209', product: 'methanol', row: 'south', center: [2, 13], diameter: 10, height: 10, capacity: 3000, volume: 620, dailyDemand: 240 },
];

type TankFarm3dMovement = InventoryMovement & { name: string; counterparty: string; port: ManifoldPort; lane: number };

/** The movement plan for the next 72 hours. The single berth takes one ship at a time. */
const TANKFARM3D_MOVEMENTS: readonly TankFarm3dMovement[] = [
  { id: 'mv-1', name: 'Crude lifting', counterparty: 'MT Nordfjell', from: 'ta-201', to: null, startHour: 4, endHour: 16, volume: 9000, port: 'jetty', lane: 0 },
  { id: 'mv-2', name: 'Bunker lifting', counterparty: 'Barge Karmsund', from: 'ta-207', to: null, startHour: 18, endHour: 22, volume: 1200, port: 'jetty', lane: 0 },
  { id: 'mv-3', name: 'Methanol receipt', counterparty: 'MT Fensfjord', from: null, to: 'ta-209', startHour: 24, endHour: 28, volume: 1500, port: 'jetty', lane: 0 },
  { id: 'mv-4', name: 'Condensate lifting', counterparty: 'MT Stavtind', from: 'ta-204', to: null, startHour: 34, endHour: 44, volume: 6500, port: 'jetty', lane: 0 },
  { id: 'mv-5', name: 'Diesel receipt', counterparty: 'MT Hardanger', from: null, to: 'ta-206', startHour: 46, endHour: 54, volume: 4000, port: 'jetty', lane: 0 },
  { id: 'mv-6', name: 'Crude lifting', counterparty: 'MT Sletringen', from: 'ta-202', to: null, startHour: 56, endHour: 70, volume: 11000, port: 'jetty', lane: 0 },
  { id: 'mv-7', name: 'Pipeline rundown', counterparty: 'Nordkapp export line', from: null, to: 'ta-202', startHour: 0, endHour: 30, volume: 6000, port: 'pipeline', lane: 1 },
  { id: 'mv-8', name: 'Pipeline rundown', counterparty: 'Nordkapp export line', from: null, to: 'ta-203', startHour: 30, endHour: 72, volume: 7000, port: 'pipeline', lane: 1 },
  { id: 'mv-9', name: 'Tank transfer', counterparty: 'From 61-TA-203', from: 'ta-203', to: 'ta-201', startHour: 20, endHour: 28, volume: 3000, port: 'jetty', lane: 2 },
];

const TANKFARM3D_HORIZON = 72;

const TANKFARM3D_MANIFOLD: Manifold = {
  headerZ: -7,
  y: 1,
  jetty: [
    [46, 1, -7],
    [58, 1, -7],
    [58, 3.4, -7],
    [84, 3.4, -7],
  ],
  pipeline: [
    [-78, 1, -7],
    [-88, 1, -7],
  ],
};

const TANKFARM3D_PLOT: GroundRect = { center: [-13, -5], size: [156, 92] };

const TANKFARM3D_SEA: GroundRect = { center: [91, -5], size: [52, 92] };

const TANKFARM3D_BUNDS: readonly GroundRect[] = (['north', 'south'] as const).flatMap((row) => {
  const rect = bundRect(
    TANKFARM3D_TANKS.filter((tank) => tank.row === row),
    4.5
  );
  return rect ? [rect] : [];
});

const TANKFARM3D_TICKS = [
  { hour: 0, label: 'Now' },
  { hour: 24, label: '+24 h' },
  { hour: 48, label: '+48 h' },
  { hour: 72, label: '+72 h' },
];

const TANKFARM3D_SERIES_HOURS = hourSteps(TANKFARM3D_HORIZON, 2);

type TankFarm3dColourBy = 'level' | 'product' | 'cover';

const TANKFARM3D_COLOUR_BY: readonly { value: TankFarm3dColourBy; label: string }[] = [
  { value: 'level', label: 'Level' },
  { value: 'product', label: 'Product' },
  { value: 'cover', label: 'Days of cover' },
];

type TankFarm3dMark = { tone?: Tone; shape?: DotShape; word?: string };

/** High above 90 %, low below 15 %; critical beyond 97 % or 5 %. Normal carries no status. */
function tankFarm3dLevelMark(fill: number): TankFarm3dMark {
  if (fill >= 0.97) return { tone: 'critical', shape: 'diamond', word: 'overfill' };
  if (fill <= 0.05) return { tone: 'critical', shape: 'diamond', word: 'empty' };
  if (fill >= 0.9) return { tone: 'warning', shape: 'square', word: 'high' };
  if (fill <= 0.15) return { tone: 'warning', shape: 'square', word: 'low' };
  return {};
}

/** Under 2 days is critical, under 3 a warning. */
function tankFarm3dCoverMark(days: number | null): TankFarm3dMark {
  if (days === null) return {};
  if (days < 2) return { tone: 'critical', shape: 'diamond', word: 'short' };
  if (days < 3) return { tone: 'warning', shape: 'square', word: 'tight' };
  return {};
}

function tankFarm3dIsColourBy(value: unknown): value is TankFarm3dColourBy {
  return TANKFARM3D_COLOUR_BY.some((option) => option.value === value);
}

function tankFarm3dTank(id: string): TankFarm3dTank | undefined {
  return TANKFARM3D_TANKS.find((tank) => tank.id === id);
}

function tankFarm3dTime(hour: number): string {
  return `${formatDateTime(REFERENCE_NOW + hour * HOUR)} UTC`;
}

function tankFarm3dKind(movement: InventoryMovement, tankId: string): string {
  if (movement.from && movement.to) return movement.to === tankId ? 'Transfer in' : 'Transfer out';
  return movement.to === tankId ? 'Receipt' : 'Lifting';
}

type TankFarm3dState = ScrubberState & { selectedId: string | null; colourBy: TankFarm3dColourBy; plan: boolean };

type TankFarm3dAction = ScrubberAction | { type: 'select'; id: string | null } | { type: 'colourBy'; value: TankFarm3dColourBy } | { type: 'plan'; value: boolean } | { type: 'openMovement'; id: string };

const TANKFARM3D_INITIAL: TankFarm3dState = { hour: 0, playing: false, selectedId: null, colourBy: 'level', plan: false };

function tankFarm3dReducer(state: TankFarm3dState, action: TankFarm3dAction): TankFarm3dState {
  switch (action.type) {
    case 'select':
      return { ...state, selectedId: action.id === state.selectedId ? null : action.id };
    case 'colourBy':
      return { ...state, colourBy: action.value };
    case 'plan':
      return { ...state, plan: action.value };
    case 'openMovement': {
      const movement = TANKFARM3D_MOVEMENTS.find((candidate) => candidate.id === action.id);
      if (!movement) return state;
      return { ...state, playing: false, hour: Math.round((movement.startHour + movement.endHour) / 2), selectedId: movement.from ?? movement.to };
    }
    default:
      return { ...state, ...scrubberReducer(state, action, TANKFARM3D_HORIZON) };
  }
}

/** Everything the scene and the panels show about one tank at one hour. */
function tankFarm3dSnapshot(tank: TankFarm3dTank, volume: number, colourBy: TankFarm3dColourBy, colours: TokenColors<typeof TANKFARM3D_PRODUCT_TOKENS> | null): FarmTank {
  const fill = fillFraction(volume, tank.capacity);
  const cover = daysOfCover(volume, tank.dailyDemand);
  const base = { id: tank.id, tag: tank.tag, center: tank.center, diameter: tank.diameter, height: tank.height, fill };
  if (colourBy === 'product') return { ...base, value: TANKFARM3D_PRODUCTS[tank.product].name, ringColor: colours?.[tank.product] };
  if (colourBy === 'cover') {
    const mark = tankFarm3dCoverMark(cover);
    return { ...base, value: cover === null ? 'No demand' : `${formatValue(cover, 1)} d${mark.word ? ` · ${mark.word}` : ''}`, tone: mark.tone, shape: mark.shape };
  }
  const mark = tankFarm3dLevelMark(fill);
  return { ...base, value: `${formatValue(fill * 100, 0)} %${mark.word ? ` · ${mark.word}` : ''}`, tone: mark.tone, shape: mark.shape };
}

function tankFarm3dFlows(hour: number): FarmFlow[] {
  return activeMovements(TANKFARM3D_MOVEMENTS, hour).flatMap((movement) => {
    const plan = TANKFARM3D_MOVEMENTS.find((candidate) => candidate.id === movement.id);
    const from = movement.from ? (tankFarm3dTank(movement.from) ?? null) : null;
    const to = movement.to ? (tankFarm3dTank(movement.to) ?? null) : null;
    const points = movementRoute(from, to, TANKFARM3D_MANIFOLD, plan?.port ?? 'jetty');
    return points.length > 1 ? [{ id: movement.id, points }] : [];
  });
}

function TankFarm3dLegend({ colourBy }: { colourBy: TankFarm3dColourBy }) {
  const item = 'flex items-center gap-1.5 whitespace-nowrap';
  return (
    <ul aria-label={`Ring colours by ${TANKFARM3D_COLOUR_BY.find((option) => option.value === colourBy)?.label.toLowerCase()}`} className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-medium-foreground">
      {colourBy === 'product' ? (
        Object.entries(TANKFARM3D_PRODUCTS).map(([key, product]) => (
          <li key={key} className={item}>
            <span aria-hidden="true" className={`size-2.5 rounded-full ${product.swatch}`} />
            {product.name}
          </li>
        ))
      ) : (
        <>
          <li className={item}>
            <StatusDot tone="neutral" shape="ring" size="md" />
            {colourBy === 'level' ? '15 to 90 %' : '3 days or more'}
          </li>
          <li className={item}>
            <StatusDot tone="warning" shape="square" size="md" />
            {colourBy === 'level' ? 'High or low' : 'Under 3 days'}
          </li>
          <li className={item}>
            <StatusDot tone="critical" shape="diamond" size="md" />
            {colourBy === 'level' ? 'Overfill or empty' : 'Under 2 days'}
          </li>
        </>
      )}
      <li className={item}>
        <svg viewBox="0 0 12 12" className="size-3 fill-[var(--primary-background)]" aria-hidden="true">
          <path d="M2 1.5 10 6 2 10.5z" />
        </svg>
        Transferring
      </li>
    </ul>
  );
}

function TankFarm3dColourSwitch({ value, onChange }: { value: TankFarm3dColourBy; onChange: (value: TankFarm3dColourBy) => void }) {
  return (
    <SegmentedControl
      value={value}
      onValueChange={(next) => {
        if (tankFarm3dIsColourBy(next)) onChange(next);
      }}
    >
      <SegmentedControlList size="small" aria-label="Colour rings by">
        {TANKFARM3D_COLOUR_BY.map((option) => (
          <SegmentedControlButton key={option.value} value={option.value}>
            {option.label}
          </SegmentedControlButton>
        ))}
      </SegmentedControlList>
    </SegmentedControl>
  );
}

function TankFarm3dStat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function TankFarm3dTankPanel({ tank, hour, onBack }: { tank: TankFarm3dTank; hour: number; onBack?: () => void }) {
  const volume = levelsAt([tank], TANKFARM3D_MOVEMENTS, hour)[tank.id];
  const fill = fillFraction(volume, tank.capacity);
  const cover = daysOfCover(volume, tank.dailyDemand);
  const levelMark = tankFarm3dLevelMark(fill);
  const coverMark = tankFarm3dCoverMark(cover);
  const rate = netRateAt(tank.id, TANKFARM3D_MOVEMENTS, hour);
  const series = levelSeries(tank, TANKFARM3D_MOVEMENTS, TANKFARM3D_SERIES_HOURS).map((value) => (value / tank.capacity) * 100);
  const movements = movementsOf(TANKFARM3D_MOVEMENTS, tank.id);

  return (
    <div className="flex flex-col gap-4">
      {onBack ? (
        <div>
          <Button variant="ghost" size="sm" onClick={onBack}>
            <IconArrowLeft /> All tanks
          </Button>
        </div>
      ) : null}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-sm font-medium text-base-foreground">{tank.tag}</p>
          <p className="flex items-center gap-1.5 text-sm text-medium-foreground">
            <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${TANKFARM3D_PRODUCTS[tank.product].swatch}`} />
            {TANKFARM3D_PRODUCTS[tank.product].name}
          </p>
        </div>
        <ValueReadout value={fill * 100} unit="%" size="md" tone={levelMark.tone ?? 'neutral'} className="shrink-0" />
      </div>

      <dl className="grid grid-cols-2 gap-x-3 gap-y-3">
        <TankFarm3dStat label="Volume">
          <ValueReadout value={volume} unit="m³" size="sm" />
        </TankFarm3dStat>
        <TankFarm3dStat label="Ullage">
          <ValueReadout value={ullage(volume, tank.capacity)} unit="m³" size="sm" />
        </TankFarm3dStat>
        <TankFarm3dStat label="Days of cover">
          <ValueReadout value={cover} unit="d" decimals={1} size="sm" tone={coverMark.tone ?? 'neutral'} />
        </TankFarm3dStat>
        <TankFarm3dStat label="Net flow">
          <ValueReadout value={rate} unit="m³/h" size="sm" />
        </TankFarm3dStat>
      </dl>
      {levelMark.tone || coverMark.tone ? (
        <div className="flex flex-col gap-1">
          {levelMark.tone ? <StatusIndicator tone={levelMark.tone} shape={levelMark.shape} label={`Level ${levelMark.word}`} detail={fill >= 0.9 ? 'limit 90 %' : 'limit 15 %'} size="sm" /> : null}
          {coverMark.tone ? <StatusIndicator tone={coverMark.tone} shape={coverMark.shape} label={`Cover ${coverMark.word}`} detail="target 3 d" size="sm" /> : null}
        </div>
      ) : null}

      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">Projected level, next 72 h</span>
        <Sparkline values={series} label={`${tank.tag} projected level over the next 72 hours`} unit="%" decimals={0} height={36} domain={[0, 100]} band={{ low: 15, high: 90 }} variant="area" />
        <span className="flex justify-between text-xs tabular-nums text-muted-foreground">
          <span>Now</span>
          <span>+72 h</span>
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">Planned movements</span>
        {movements.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing planned in the next 72 hours.</p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {movements.map((movement) => {
              const plan = TANKFARM3D_MOVEMENTS.find((candidate) => candidate.id === movement.id);
              const phase = movementPhase(movement, hour);
              const incoming = movement.to === tank.id;
              return (
                <li key={movement.id} className="flex flex-col gap-0.5">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="text-sm text-base-foreground">{tankFarm3dKind(movement, tank.id)}</span>
                    <span className="shrink-0 text-sm tabular-nums text-base-foreground">
                      {incoming ? '+' : '−'}
                      {formatValue(movement.volume, 0)} m³
                    </span>
                  </span>
                  <span className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span className="min-w-0 truncate">{plan?.counterparty}</span>
                    <span className="shrink-0 tabular-nums">
                      +{movement.startHour} to +{movement.endHour} h
                    </span>
                  </span>
                  <StatusIndicator
                    tone={phase === 'active' ? 'info' : 'neutral'}
                    shape={phase === 'active' ? 'dot' : phase === 'done' ? 'square' : 'ring'}
                    label={phase === 'active' ? 'Transferring' : phase === 'done' ? 'Done' : 'Planned'}
                    size="sm"
                  />
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function TankFarm3dStockPanel({ hour, onSelect }: { hour: number; onSelect?: (id: string) => void }) {
  const levels = levelsAt(TANKFARM3D_TANKS, TANKFARM3D_MOVEMENTS, hour);
  const total = TANKFARM3D_TANKS.reduce((sum, tank) => sum + levels[tank.id], 0);
  const capacity = TANKFARM3D_TANKS.reduce((sum, tank) => sum + tank.capacity, 0);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <span className="text-xs text-muted-foreground">Stock on hand</span>
        <ValueReadout value={total} unit="m³" size="md" />
        <span className="text-xs tabular-nums text-muted-foreground">
          {formatValue((total / capacity) * 100, 0)} % of {formatValue(capacity, 0)} m³
        </span>
      </div>
      <ul className="flex flex-col">
        {TANKFARM3D_TANKS.map((tank) => {
          const volume = levels[tank.id];
          const fill = fillFraction(volume, tank.capacity);
          const mark = tankFarm3dLevelMark(fill);
          const row = (
            <>
              <span className="flex items-baseline justify-between gap-2">
                <span className="font-mono text-xs text-base-foreground">{tank.tag}</span>
                <span className="flex items-center gap-1.5 text-xs tabular-nums text-base-foreground">
                  {mark.tone ? <StatusDot tone={mark.tone} shape={mark.shape} size="sm" label={`Level ${mark.word}`} /> : null}
                  {formatValue(fill * 100, 0)} %
                </span>
              </span>
              <span className="flex items-center gap-2">
                <span className="w-24 shrink-0 truncate text-xs text-muted-foreground">{TANKFARM3D_PRODUCTS[tank.product].name}</span>
                <span className="flex h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-secondary-background" aria-hidden="true">
                  <span className="bg-chart-1-450" style={{ width: `${fill * 100}%` }} />
                </span>
              </span>
            </>
          );
          return (
            <li key={tank.id}>
              {onSelect ? (
                <button
                  type="button"
                  aria-label={`${tank.tag}, ${TANKFARM3D_PRODUCTS[tank.product].name}, ${formatValue(fill * 100, 0)} percent full`}
                  onClick={() => onSelect(tank.id)}
                  className="-mx-1.5 flex w-[calc(100%+0.75rem)] flex-col gap-1 rounded-md px-1.5 py-1.5 text-left hover:bg-secondary-background focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ring-default)]"
                >
                  {row}
                </button>
              ) : (
                <div className="flex flex-col gap-1 py-1.5">{row}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function tankFarm3dSpans(selectedId: string | null): ScrubberSpan[] {
  return TANKFARM3D_MOVEMENTS.map((movement) => {
    const touches = movement.from === selectedId || movement.to === selectedId;
    const tank = tankFarm3dTank(movement.from ?? movement.to ?? '');
    return {
      id: movement.id,
      label: `${movement.name} ${tank ? tank.tag.slice(3) : ''}`.trim(),
      startHour: movement.startHour,
      endHour: movement.endHour,
      lane: movement.lane,
      highlighted: selectedId !== null && touches,
      dimmed: selectedId !== null && !touches,
    };
  });
}

function TankFarm3dScenery({ berthed }: { berthed: boolean }) {
  return (
    <>
      <Building position={[52, 0, 8]} size={[9, 4.2, 7]} />
      <FlareStack position={[-80, 0, 30]} height={18} />
      <Jetty position={[60, -0.6, -7]} length={22} height={4} />
      {berthed ? <TankerShip position={[96, -0.6, -9]} rotationY={Math.PI / 2} length={48} /> : null}
    </>
  );
}

function TankFarm3dFallbackList() {
  return (
    <div className="rounded-lg border border-default bg-card-background p-3">
      <TankFarm3dStockPanel hour={0} />
    </div>
  );
}

function TankFarm3dExperience({ initial = TANKFARM3D_INITIAL, still = false }: { initial?: TankFarm3dState; still?: boolean }) {
  const [state, dispatch] = useReducer(tankFarm3dReducer, initial);
  const scope = useRef<HTMLDivElement>(null);
  const colours = useTokenColors(TANKFARM3D_PRODUCT_TOKENS, scope);
  const levels = levelsAt(TANKFARM3D_TANKS, TANKFARM3D_MOVEMENTS, state.hour);
  const tanks = TANKFARM3D_TANKS.map((tank) => tankFarm3dSnapshot(tank, levels[tank.id], state.colourBy, colours));
  const flows = tankFarm3dFlows(state.hour);
  const selected = state.selectedId ? tankFarm3dTank(state.selectedId) : undefined;
  const berthed = activeMovements(TANKFARM3D_MOVEMENTS, state.hour).some((movement) => TANKFARM3D_MOVEMENTS.find((plan) => plan.id === movement.id)?.port === 'jetty' && !(movement.from && movement.to));

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape' && state.selectedId) {
      event.preventDefault();
      dispatch({ type: 'select', id: null });
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
      className="flex h-[48rem] w-full flex-col overflow-hidden rounded-xl border border-default bg-base-background outline-none"
    >
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-default px-4 py-2.5">
        <div className="flex min-w-0 items-baseline gap-3">
          <h3 className="text-sm font-semibold text-base-foreground">Stord terminal</h3>
          <span className="text-xs text-muted-foreground">Tank farm · 9 tanks · 1 berth</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-muted-foreground">Colour by</span>
          <TankFarm3dColourSwitch value={state.colourBy} onChange={(value) => dispatch({ type: 'colourBy', value })} />
          <Switch label="Plan view" checked={state.plan} onCheckedChange={(checked) => dispatch({ type: 'plan', value: checked })} />
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <div className="relative min-w-0 flex-1">
          <SceneCanvas
            label={`3D model of the Stord terminal tank farm ${Math.round(state.hour)} hours ahead, rings coloured by ${state.colourBy === 'cover' ? 'days of cover' : state.colourBy}${selected ? `, ${selected.tag} selected` : ''}`}
            fallback={<TankFarm3dFallbackList />}
            onPointerMissed={() => {
              if (state.selectedId) dispatch({ type: 'select', id: null });
            }}
          >
            <StillScene still={still}>
              <TankFarm
                tanks={tanks}
                bunds={TANKFARM3D_BUNDS}
                manifold={TANKFARM3D_MANIFOLD}
                flows={flows}
                plot={TANKFARM3D_PLOT}
                sea={TANKFARM3D_SEA}
                selectedId={state.selectedId}
                onSelect={(id) => dispatch({ type: 'select', id })}
                view={state.plan ? 'top' : 'perspective'}
                insets={{ bottom: 40 }}
              >
                <TankFarm3dScenery berthed={berthed} />
              </TankFarm>
            </StillScene>
          </SceneCanvas>
          <div className="pointer-events-none absolute inset-x-3 bottom-3 z-30 flex">
            <div className="pointer-events-auto rounded-lg border border-default bg-[color-mix(in_oklab,var(--card-background)_82%,transparent)] px-3 py-1.5 backdrop-blur-md">
              <TankFarm3dLegend colourBy={state.colourBy} />
            </div>
          </div>
        </div>

        <aside aria-label={selected ? `${selected.tag} inventory` : 'Stock by tank'} className="flex w-72 shrink-0 flex-col overflow-y-auto border-l border-default p-3">
          {selected ? (
            <TankFarm3dTankPanel key={selected.id} tank={selected} hour={state.hour} onBack={() => dispatch({ type: 'select', id: null })} />
          ) : (
            <TankFarm3dStockPanel hour={state.hour} onSelect={(id) => dispatch({ type: 'select', id })} />
          )}
        </aside>
      </div>

      <footer className="shrink-0 border-t border-default px-4 py-3">
        <TimeScrubber
          hour={state.hour}
          horizon={TANKFARM3D_HORIZON}
          playing={state.playing}
          onSeek={(hour) => dispatch({ type: 'seek', hour })}
          onPlay={() => dispatch({ type: 'play' })}
          onPause={() => dispatch({ type: 'pause' })}
          onTick={() => dispatch({ type: 'tick' })}
          timeLabel={tankFarm3dTime(state.hour)}
          ticks={TANKFARM3D_TICKS}
          spans={tankFarm3dSpans(state.selectedId)}
          onSelectSpan={(id) => dispatch({ type: 'openMovement', id })}
          actions={<span className="text-xs text-muted-foreground">{flows.length === 0 ? 'No transfers at this hour' : `${flows.length} ${flows.length === 1 ? 'transfer' : 'transfers'} under way`}</span>}
        />
      </footer>
    </div>
  );
}

function TankFarm3dNordicNight() {
  return (
    <ThemeScope preset="nordic-night" className="w-full">
      <TankFarm3dExperience />
    </ThemeScope>
  );
}

function TankFarm3dEmber() {
  return (
    <ThemeScope preset="ember" className="w-full">
      <TankFarm3dExperience initial={{ hour: 38, playing: false, selectedId: 'ta-204', colourBy: 'cover', plan: false }} still />
    </ThemeScope>
  );
}

function TankFarm3dSandstone() {
  return (
    <ThemeScope preset="sandstone" className="w-full">
      <TankFarm3dExperience initial={{ hour: 10, playing: false, selectedId: null, colourBy: 'product', plan: true }} still />
    </ThemeScope>
  );
}

function TankFarm3dStage({ label, children }: { label: string; children: ReactNode }) {
  return (
    <ThemeScope preset="nordic-night" className="w-full">
      <div className="h-72 w-full overflow-hidden rounded-xl border border-default bg-base-background">
        <SceneCanvas label={label}>
          <StillScene>{children}</StillScene>
        </SceneCanvas>
      </div>
    </ThemeScope>
  );
}

function TankFarm3dPartRings() {
  const scope = useRef<HTMLDivElement>(null);
  const colours = useTokenColors(TANKFARM3D_PRODUCT_TOKENS, scope);
  const [colourBy, setColourBy] = useState<TankFarm3dColourBy>('product');
  const tanks = TANKFARM3D_TANKS.filter((tank) => ['ta-204', 'ta-206', 'ta-209'].includes(tank.id)).map((tank, index) =>
    tankFarm3dSnapshot({ ...tank, center: [(index - 1) * 24, 0] }, tank.volume, colourBy, colours)
  );

  return (
    <ThemeScope preset="nordic-night" className="w-full">
      <div ref={scope} className="flex w-full flex-col gap-3 rounded-xl border border-default bg-base-background p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TankFarm3dColourSwitch value={colourBy} onChange={setColourBy} />
          <TankFarm3dLegend colourBy={colourBy} />
        </div>
        <div className="h-72 w-full">
          <SceneCanvas label={`Three tanks with indicator rings coloured by ${colourBy === 'cover' ? 'days of cover' : colourBy}`}>
            <StillScene>
              <TankFarm tanks={tanks} manifold={{ headerZ: 16, y: 1, jetty: [[30, 1, 16], [36, 1, 16]], pipeline: [[-30, 1, 16], [-36, 1, 16]] }} plot={{ center: [0, 2], size: [84, 44] }} />
            </StillScene>
          </SceneCanvas>
        </div>
      </div>
    </ThemeScope>
  );
}

function TankFarm3dPartTank() {
  const [level, setLevel] = useState(92);
  const mark = tankFarm3dLevelMark(level / 100);

  return (
    <ThemeScope preset="nordic-night" className="w-full">
      <div className="flex w-full flex-col gap-3 rounded-xl border border-default bg-base-background p-3">
        <div className="h-64 w-full">
          <SceneCanvas label={`Storage tank filled to ${level} percent with a level indicator ring`}>
            <StillScene>
              <TurntableStage subjectSize={[20, 13, 20]}>
                <StorageTank diameter={14} height={12} fill={level / 100} tone={mark.tone ?? 'neutral'} />
              </TurntableStage>
            </StillScene>
          </SceneCanvas>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex w-32 shrink-0 flex-col gap-0.5">
            <span className="text-xs text-muted-foreground">Level</span>
            <ValueReadout value={level} unit="%" size="sm" tone={mark.tone ?? 'neutral'} />
            <span className="text-xs text-muted-foreground">{mark.word ? `Level ${mark.word}` : 'Inside 15 to 90 %'}</span>
          </div>
          <Slider aria-label="Tank level" value={[level]} min={0} max={100} step={1} onValueChange={(value) => setLevel(value[0] ?? 0)} />
        </div>
      </div>
    </ThemeScope>
  );
}

function TankFarm3dPartBund() {
  const spots = TANKFARM3D_TANKS.filter((tank) => tank.row === 'south').map((tank, index) => ({ ...tank, center: [(index - 1.5) * 20, 0] as const }));
  const rect = bundRect(spots, 4);

  return (
    <TankFarm3dStage label="A bunded row of four tanks of different sizes">
      <TurntableStage subjectSize={[84, 12, 26]} padding={0.72}>
        {rect ? <BundWall rect={rect} /> : null}
        {spots.map((tank) => (
          <StorageTank key={tank.id} position={[tank.center[0], 0, tank.center[1]]} diameter={tank.diameter} height={tank.height} fill={fillFraction(tank.volume, tank.capacity)} />
        ))}
      </TurntableStage>
    </TankFarm3dStage>
  );
}

function TankFarm3dPartJetty() {
  return (
    <TankFarm3dStage label="Loading jetty with a tanker alongside">
      <TurntableStage subjectSize={[56, 14, 48]} padding={0.72}>
        <SeaPlane size={[70, 70]} level={1.2} cell={7} />
        <Jetty position={[-26, 1.2, 0]} length={22} height={4} />
        <TankerShip position={[10, 1.2, 0]} rotationY={Math.PI / 2} length={46} />
      </TurntableStage>
    </TankFarm3dStage>
  );
}

function TankFarm3dPartManifold() {
  const manifold: Manifold = { headerZ: 0, y: 1, jetty: [[26, 1, 0], [36, 1, 0]], pipeline: [[-26, 1, 0], [-36, 1, 0]] };
  const north: TankSpot = { id: 'a', center: [-14, -16], diameter: 12, height: 10 };
  const south: TankSpot = { id: 'b', center: [10, 15], diameter: 10, height: 9 };

  return (
    <TankFarm3dStage label="Manifold with a tank-to-tank transfer shown by flow chevrons">
      <TurntableStage subjectSize={[74, 12, 44]} padding={0.72}>
        <StorageTank position={[north.center[0], 0, north.center[1]]} diameter={north.diameter} height={north.height} fill={0.7} />
        <StorageTank position={[south.center[0], 0, south.center[1]]} diameter={south.diameter} height={south.height} fill={0.3} />
        <PipeRun points={[[-36, 1, 0], [36, 1, 0]]} radius={0.32} />
        <PipeRun points={movementRoute(north, south, manifold)} radius={0.4} flow spacing={5} />
      </TurntableStage>
    </TankFarm3dStage>
  );
}

function TankFarm3dPartScrubber() {
  const [state, dispatch] = useReducer((current: ScrubberState, action: ScrubberAction) => scrubberReducer(current, action, TANKFARM3D_HORIZON), { hour: 26, playing: false });
  const active = activeMovements(TANKFARM3D_MOVEMENTS, state.hour);

  return (
    <ThemeScope preset="nordic-night" className="w-full">
      <div className="flex w-full flex-col gap-3 rounded-xl border border-default bg-base-background p-4">
        <TimeScrubber
          hour={state.hour}
          horizon={TANKFARM3D_HORIZON}
          playing={state.playing}
          onSeek={(hour) => dispatch({ type: 'seek', hour })}
          onPlay={() => dispatch({ type: 'play' })}
          onPause={() => dispatch({ type: 'pause' })}
          onTick={() => dispatch({ type: 'tick' })}
          timeLabel={tankFarm3dTime(state.hour)}
          ticks={TANKFARM3D_TICKS}
          spans={tankFarm3dSpans(null)}
          actions={<span className="text-xs text-muted-foreground">{active.length === 0 ? 'No transfers at this hour' : `${active.length} under way`}</span>}
        />
      </div>
    </ThemeScope>
  );
}

function TankFarm3dPartPanel() {
  const [hour, setHour] = useState(38);
  const tank = tankFarm3dTank('ta-204');
  if (!tank) return null;

  return (
    <ThemeScope preset="nordic-night" className="w-full">
      <div className="flex w-full justify-center rounded-xl border border-default bg-base-background p-4">
        <div className="flex w-72 flex-col gap-4">
          <TankFarm3dTankPanel tank={tank} hour={hour} />
          <div className="flex items-center gap-3 border-t border-default pt-3">
            <span className="w-16 shrink-0 text-xs tabular-nums text-muted-foreground">+{hour} h</span>
            <Slider aria-label="Hours ahead" value={[hour]} min={0} max={TANKFARM3D_HORIZON} step={1} onValueChange={(value) => setHour(value[0] ?? 0)} />
          </div>
        </div>
      </div>
    </ThemeScope>
  );
}

function TankFarm3dPartStock() {
  return (
    <ThemeScope preset="nordic-night" className="w-full">
      <div className="flex w-full justify-center rounded-xl border border-default bg-base-background p-4">
        <div className="w-72">
          <TankFarm3dStockPanel hour={0} />
        </div>
      </div>
    </ThemeScope>
  );
}

function TankFarm3dPartFallback() {
  return (
    <ThemeScope preset="nordic-night" className="w-full">
      <div className="h-[34rem] w-full overflow-hidden rounded-xl border border-default">
        <SceneCanvas label="3D model of the Stord terminal tank farm" forceFallback fallback={<TankFarm3dFallbackList />}>
          <TankFarm tanks={[]} manifold={TANKFARM3D_MANIFOLD} plot={TANKFARM3D_PLOT} />
        </SceneCanvas>
      </div>
    </ThemeScope>
  );
}

export default definePage({
  id: 'tank-farm-3d',
  title: 'Tank farm in 3D',
  summary:
    'Inventory you can see in space and time. Every tank is filled to its level, a ring around it encodes level, product or days of cover, and a scrubber plays the movement plan for the next 72 hours — levels rise and fall, and the pipe that is transferring lights up.',
  guidance: {
    use: [
      'When stock questions are spatial: which tank the ship is drawing from, which line it takes, what stands next to it.',
      'To rehearse a movement plan: scrub ahead and watch for a tank running high, low or short of cover.',
      'With one encoding at a time on the rings, named in a legend that changes with it.',
      'With the stock list and the movement bars as the keyboard path to every tank.',
    ],
    avoid: [
      'Colouring whole tanks. The liquid shows the level; the ring carries the one encoded value.',
      'Playback that loops. It starts on a click, stops at the end of the window and can be paused.',
      'Reading exact volumes off the model. Numbers live in the docked panel.',
      'Three encodings at once. Switch what the rings mean rather than stacking marks.',
    ],
  },
  source,
  sections: [
    {
      id: 'experience',
      title: 'Experience',
      description:
        'Drag to orbit, scroll to zoom. Drag the time slider or press Play plan to run the next 72 hours. Click a tank, a row in the stock list or a movement bar to open that tank. Switch what the rings encode, or flip to the plan view.',
      specimens: [
        {
          id: 'TankFarm3dNordicNight',
          title: 'Tank farm in 3D',
          note: 'Pick it when planners need to see where stock sits and how a movement plan will change it over the coming days.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'three/SceneCanvas.tsx',
            'three/scenes/TankFarm.tsx',
            'three/scenes/tankFarmLayout.ts',
            'three/scenes/inventoryProjection.ts',
            'three/scenes/TimeScrubber.tsx',
            'three/scenes/Jetty.tsx',
            'three/scenes/TankerShip.tsx',
            'three/useTokenColors.ts',
            'industrial/ValueReadout.tsx',
            'industrial/StatusIndicator.tsx',
            'industrial/Sparkline.tsx',
            'themes/ThemeScope.tsx',
          ],
          Component: TankFarm3dNordicNight,
        },
      ],
    },
    {
      id: 'themes',
      title: 'In other themes',
      description: 'The same farm in two more presets, opened at other hours and held still. Ring and liquid colours are resolved from tokens, so they follow the theme.',
      specimens: [
        {
          id: 'TankFarm3dEmber',
          title: 'Ember, a lifting under way',
          note: 'Pick it for a night-shift screen: amber on black, here 38 hours ahead with the condensate tank open and its line flowing.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['three/SceneCanvas.tsx', 'three/scenes/TankFarm.tsx', 'three/scenes/StillScene.tsx', 'themes/ThemeScope.tsx'],
          Component: TankFarm3dEmber,
        },
        {
          id: 'TankFarm3dSandstone',
          title: 'Sandstone, plan view by product',
          note: 'Pick it for planning documents in daylight: a warm, light plot plan seen from above with rings coloured by product.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['three/SceneCanvas.tsx', 'three/scenes/TankFarm.tsx', 'three/scenes/StillScene.tsx', 'themes/ThemeScope.tsx'],
          Component: TankFarm3dSandstone,
        },
      ],
    },
    {
      id: 'parts',
      title: 'Parts',
      description: 'The pieces on their own: scenes on a stage you can drag, the scrubber, and the panels docked beside the model.',
      specimens: [
        {
          id: 'TankFarm3dPartRings',
          title: 'Indicator rings',
          note: 'Pick a ring to carry one encoded value per tank, and switch its meaning instead of adding a second mark.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['three/scenes/IndicatorRing.tsx', 'three/scenes/TankFarm.tsx', 'three/useTokenColors.ts'],
          Component: TankFarm3dPartRings,
        },
        {
          id: 'TankFarm3dPartTank',
          title: 'Tank with level ring',
          note: 'Pick it to show a level against its limits: the liquid moves, the ring changes only when a limit is crossed.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['three/StorageTank.tsx', 'three/StatusBeacon.tsx', 'three/TurntableStage.tsx'],
          Component: TankFarm3dPartTank,
        },
        {
          id: 'TankFarm3dPartBund',
          title: 'Bunded row',
          note: 'Pick a bund wall to group tanks that share containment; it reads as one unit from any angle.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['three/scenes/BundWall.tsx', 'three/scenes/tankFarmLayout.ts', 'three/StorageTank.tsx'],
          Component: TankFarm3dPartBund,
        },
        {
          id: 'TankFarm3dPartJetty',
          title: 'Jetty and tanker',
          note: 'Pick them to show the berth and whether it is occupied; the ship appears only while a cargo is being worked.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['three/scenes/Jetty.tsx', 'three/scenes/TankerShip.tsx', 'three/scenes/SeaPlane.tsx'],
          Component: TankFarm3dPartJetty,
        },
        {
          id: 'TankFarm3dPartManifold',
          title: 'Transfer route',
          note: 'Pick flow chevrons on the exact route a movement takes, so the eye can follow product from source to destination.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['three/PipeRun.tsx', 'three/scenes/tankFarmLayout.ts', 'three/StorageTank.tsx'],
          Component: TankFarm3dPartManifold,
        },
        {
          id: 'TankFarm3dPartScrubber',
          title: 'Time scrubber',
          note: 'Pick it to look ahead over a fixed window: planned spans sit above the track, and playback stops at the end.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['three/scenes/TimeScrubber.tsx', 'three/scenes/inventoryProjection.ts'],
          Component: TankFarm3dPartScrubber,
        },
        {
          id: 'TankFarm3dPartPanel',
          title: 'Tank inventory panel',
          note: 'Pick it as the docked detail for one tank: volume, ullage, cover, the projected level and what is planned.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['three/scenes/inventoryProjection.ts', 'industrial/ValueReadout.tsx', 'industrial/Sparkline.tsx', 'industrial/StatusIndicator.tsx'],
          Component: TankFarm3dPartPanel,
        },
        {
          id: 'TankFarm3dPartStock',
          title: 'Stock list',
          note: 'Pick it as the resting state of the side panel and the keyboard path to every tank in the scene.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['three/scenes/inventoryProjection.ts', 'industrial/ValueReadout.tsx', 'industrial/StatusDot.tsx'],
          Component: TankFarm3dPartStock,
        },
        {
          id: 'TankFarm3dPartFallback',
          title: 'Without WebGL',
          note: 'Pick a fallback that lists the same tanks and levels, so stock is readable where 3D cannot render.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['three/SceneCanvas.tsx', 'three/scenes/inventoryProjection.ts'],
          Component: TankFarm3dPartFallback,
        },
      ],
    },
  ],
});
