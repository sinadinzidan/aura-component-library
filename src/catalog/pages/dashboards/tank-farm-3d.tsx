import { Button } from '@cognite/aura/components/button';
import { Slider } from '@cognite/aura/components/slider';
import { Switch } from '@cognite/aura/components/switch';
import { IconArrowDownRight, IconArrowUpRight, IconX } from '@cognite/aura/icons';
import { useReducer, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';

import { Legend } from '../../../library/kit/Legend';
import { Panel } from '../../../library/kit/Panel';
import { StatusPill } from '../../../library/kit/StatusPill';
import { TagId } from '../../../library/kit/TagId';
import { LevelBlock } from '../../../library/kit/tank-farm-3d/LevelBlock';
import { formatNumber } from '../../../library/kit/tones';
import type { FamilyTone, StatusTone } from '../../../library/kit/tones';
import { TrendLine } from '../../../library/kit/TrendLine';
import { LookScope } from '../../../library/looks/LookScope';
import { Building } from '../../../library/three/Building';
import { FlareStack } from '../../../library/three/FlareStack';
import { SceneCanvas } from '../../../library/three/SceneCanvas';
import { BundWall } from '../../../library/three/scenes/BundWall';
import { activeMovements, daysOfCover, fillFraction, hourSteps, levelSeries, levelsAt, movementPhase, movementsOf, netRateAt, scrubberReducer, totalAt, ullage } from '../../../library/three/scenes/inventoryProjection';
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
    [60, 1, -7],
    [60, 3.4, -7],
    [84, 3.4, -7],
  ],
  pipeline: [
    [-76, 1, -7],
    [-83, 1, -7],
  ],
};

const TANKFARM3D_PLOT: GroundRect = { center: [-10, -6], size: [148, 84] };

const TANKFARM3D_SEA: GroundRect = { center: [83, -6], size: [38, 84] };

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

/** Products are categories, not states: each gets a decorative family, on the blocks and on the rings. */
const TANKFARM3D_PRODUCTS: Readonly<Record<TankFarm3dProduct, { name: string; short: string; tone: FamilyTone }>> = {
  crude: { name: 'Crude oil', short: 'Crude', tone: 'blue' },
  condensate: { name: 'Condensate', short: 'Condensate', tone: 'teal' },
  diesel: { name: 'Diesel', short: 'Diesel', tone: 'amber' },
  gasoil: { name: 'Marine gas oil', short: 'Gas oil', tone: 'purple' },
  methanol: { name: 'Methanol', short: 'Methanol', tone: 'pink' },
};

/** The same families as ramp steps, resolved to material colours for the rings around the tanks. */
const TANKFARM3D_RING_TOKENS = {
  crude: 'fjord-400',
  condensate: 'nordic-400',
  diesel: 'amber-400',
  gasoil: 'dusk-400',
  methanol: 'pink-400',
} as const;

const TANKFARM3D_PRODUCT_IDS: readonly TankFarm3dProduct[] = ['crude', 'condensate', 'diesel', 'gasoil', 'methanol'];

const TANKFARM3D_CAPACITY = TANKFARM3D_TANKS.reduce((total, tank) => total + tank.capacity, 0);

type TankFarm3dMark = { tone: StatusTone; shape: 'square' | 'diamond'; word: string };

/** High above 90 %, low below 15 %; critical beyond 97 % or 5 %. Normal carries no status. */
function tankFarm3dLevelMark(fill: number): TankFarm3dMark | undefined {
  if (fill >= 0.97) return { tone: 'critical', shape: 'diamond', word: 'Overfill' };
  if (fill <= 0.05) return { tone: 'critical', shape: 'diamond', word: 'Empty' };
  if (fill >= 0.9) return { tone: 'warning', shape: 'square', word: 'High' };
  if (fill <= 0.15) return { tone: 'warning', shape: 'square', word: 'Low' };
  return undefined;
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

type TankFarm3dState = ScrubberState & { selectedId: string | null; plan: boolean };

type TankFarm3dAction = ScrubberAction | { type: 'select'; id: string | null } | { type: 'plan'; value: boolean } | { type: 'openMovement'; id: string };

const TANKFARM3D_INITIAL: TankFarm3dState = { hour: 0, playing: false, selectedId: null, plan: false };

function tankFarm3dReducer(state: TankFarm3dState, action: TankFarm3dAction): TankFarm3dState {
  switch (action.type) {
    case 'select':
      return { ...state, selectedId: action.id === state.selectedId ? null : action.id };
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

/** Everything the scene shows about one tank at one hour. The ring carries the product, the label the level. */
function tankFarm3dSnapshot(tank: TankFarm3dTank, volume: number, colours: TokenColors<typeof TANKFARM3D_RING_TOKENS> | null): FarmTank {
  const fill = fillFraction(volume, tank.capacity);
  const mark = tankFarm3dLevelMark(fill);
  // The scene label drops the system prefix: every tank here is in system 61.
  return {
    id: tank.id,
    tag: tank.tag.slice(3),
    center: tank.center,
    diameter: tank.diameter,
    height: tank.height,
    fill,
    value: `${formatNumber(fill * 100)} %${mark ? ` · ${mark.word.toLowerCase()}` : ''}`,
    tone: mark?.tone,
    shape: mark?.shape,
    ringColor: colours?.[tank.product],
  };
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

function tankFarm3dSpans(selectedId: string | null): ScrubberSpan[] {
  return TANKFARM3D_MOVEMENTS.map((movement) => {
    const touches = movement.from === selectedId || movement.to === selectedId;
    const tank = tankFarm3dTank(movement.from ?? movement.to ?? '');
    return {
      id: movement.id,
      // A bar shorter than twelve hours is too narrow for a tag; its full name is in the accessible description and the list above.
      label: tank && movement.endHour - movement.startHour >= 12 ? tank.tag.slice(3) : '',
      description: `${movement.name}, ${tank?.tag ?? ''}, ${movement.counterparty}`,
      startHour: movement.startHour,
      endHour: movement.endHour,
      lane: movement.lane,
      highlighted: selectedId !== null && touches,
      dimmed: selectedId !== null && !touches,
    };
  });
}

/** The ship at the berth at an hour, if any. */
function tankFarm3dBerth(hour: number): TankFarm3dMovement | undefined {
  const active = activeMovements(TANKFARM3D_MOVEMENTS, hour).map((movement) => movement.id);
  return TANKFARM3D_MOVEMENTS.find((movement) => active.includes(movement.id) && movement.port === 'jetty' && !(movement.from && movement.to));
}

/** A hard-edged poster box: thick ink border on the plain surface. */
const TANKFARM3D_BOX = 'border-2 border-[var(--kit-rule-strong)] bg-[var(--kit-surface)]';

/** Scene labels are plain DOM: keep them in the UI sans at a readable size. */
const TANKFARM3D_SCENE_TYPE = '[&_.font-mono]:[font-family:inherit] [&_.font-mono]:font-bold [&_.font-mono]:tabular-nums [&_[data-slot=scene-label]>:first-child]:text-[0.8125rem]';

/** One figure in the masthead: a caption over a very large numeral, no tile around it. */
function TankFarm3dFigure({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="flex flex-col items-end">
      <span className="text-xs font-semibold text-[var(--kit-text-3)]">{label}</span>
      <span className="flex items-baseline gap-1 whitespace-nowrap">
        <span className="text-3xl font-extrabold leading-none tabular-nums tracking-tight text-[var(--kit-text)]">{value}</span>
        {unit ? <span className="text-sm font-bold text-[var(--kit-text)]">{unit}</span> : null}
      </span>
    </div>
  );
}

/** The level mosaic: one block per tank, filled to its level in the colour of its product. */
function TankFarm3dBlocks({ hour, selectedId, onSelect, size = 'md', className = '' }: { hour: number; selectedId: string | null; onSelect?: (id: string) => void; size?: 'md' | 'lg'; className?: string }) {
  const levels = levelsAt(TANKFARM3D_TANKS, TANKFARM3D_MOVEMENTS, hour);
  return (
    <ul aria-label="Tank levels" className={`grid grid-cols-3 gap-3 ${className}`}>
      {TANKFARM3D_TANKS.map((tank) => {
        const fill = fillFraction(levels[tank.id], tank.capacity);
        const mark = tankFarm3dLevelMark(fill);
        return (
          <li key={tank.id} className="flex min-w-0">
            <LevelBlock
              className={size === 'lg' ? 'h-36 w-full' : 'h-[6.5rem] w-full'}
              label={tank.tag.slice(3)}
              caption={TANKFARM3D_PRODUCTS[tank.product].name}
              fill={fill}
              tone={TANKFARM3D_PRODUCTS[tank.product].tone}
              state={mark ? { tone: mark.tone, word: mark.word } : undefined}
              selected={tank.id === selectedId}
              onSelect={onSelect ? () => onSelect(tank.id) : undefined}
            />
          </li>
        );
      })}
    </ul>
  );
}

function TankFarm3dStat({ label, value, unit, note }: { label: string; value: string; unit?: string; note?: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <dt className="text-xs font-semibold text-[var(--kit-text-3)]">{label}</dt>
      <dd className="flex flex-col">
        <span className="flex items-baseline gap-1 whitespace-nowrap">
          <span className="text-2xl font-extrabold leading-none tabular-nums tracking-tight text-[var(--kit-text)]">{value}</span>
          {unit ? <span className="text-xs font-bold text-[var(--kit-text)]">{unit}</span> : null}
        </span>
        {note ? <span className="mt-1 text-xs font-semibold text-[var(--kit-text-2)]">{note}</span> : null}
      </dd>
    </div>
  );
}

/** The selected tank: what is in it now, how much room is left, and where the plan takes its level. */
function TankFarm3dTankPanel({ tank, hour, onClose, chartHeight = 132 }: { tank: TankFarm3dTank; hour: number; onClose?: () => void; chartHeight?: number }) {
  const volume = levelsAt([tank], TANKFARM3D_MOVEMENTS, hour)[tank.id];
  const cover = daysOfCover(volume, tank.dailyDemand);
  const rate = netRateAt(tank.id, TANKFARM3D_MOVEMENTS, hour);
  const series = levelSeries(tank, TANKFARM3D_MOVEMENTS, TANKFARM3D_SERIES_HOURS).map((value) => Math.round((value / tank.capacity) * 1000) / 10);
  const next = movementsOf(TANKFARM3D_MOVEMENTS, tank.id).find((movement) => movementPhase(movement, hour) !== 'done');
  const plan = next ? TANKFARM3D_MOVEMENTS.find((candidate) => candidate.id === next.id) : undefined;
  const product = TANKFARM3D_PRODUCTS[tank.product];

  return (
    <Panel
      className="h-full"
      tone={product.tone}
      title={tank.tag}
      subtitle={product.name}
      actions={
        onClose ? (
          <Button variant="outline" size="sm" onClick={onClose}>
            <IconX /> All tanks
          </Button>
        ) : undefined
      }
    >
      <div className="flex min-h-0 flex-1 flex-col justify-between gap-3">
        <dl className="grid grid-cols-3 gap-3">
          <TankFarm3dStat label="Volume" value={formatNumber(volume)} unit="m³" />
          <TankFarm3dStat label="Ullage" value={formatNumber(ullage(volume, tank.capacity))} unit="m³" />
          <TankFarm3dStat label="Days of cover" value={cover === null ? '—' : formatNumber(cover, 1)} unit={cover === null ? undefined : 'd'} />
        </dl>
        <p className="flex items-center gap-2 text-[0.8125rem] font-semibold text-[var(--kit-text)]">
          {rate === 0 ? null : rate > 0 ? <IconArrowUpRight aria-hidden="true" className="size-4 shrink-0" /> : <IconArrowDownRight aria-hidden="true" className="size-4 shrink-0" />}
          <span className="min-w-0">
            {next && plan
              ? `${movementPhase(next, hour) === 'active' ? 'Now' : `In ${Math.round(next.startHour - hour)} h`}: ${tankFarm3dKind(next, tank.id).toLowerCase()}, ${plan.counterparty}, ${formatNumber(next.volume)} m³`
              : 'No more movements planned in this window'}
          </span>
        </p>
        <TrendLine
          label={`Projected level of ${tank.tag} over the next 72 hours`}
          series={[{ id: 'level', label: 'Level', values: series, tone: product.tone }]}
          labels={TANKFARM3D_SERIES_HOURS.map((step) => (step % 24 === 0 ? (step === 0 ? 'Now' : `+${step} h`) : ''))}
          unit="%"
          decimals={0}
          limits={[
            { value: 90, label: 'High', tone: 'warning' },
            { value: 15, label: 'Low', tone: 'warning' },
          ]}
          yDomain={[0, 100]}
          height={chartHeight}
          fill
          highlightLast={false}
          showLegend={false}
        />
      </div>
    </Panel>
  );
}

/** What the detail slot shows while no tank is selected: the stock by product. */
function TankFarm3dStockPanel({ hour }: { hour: number }) {
  const levels = levelsAt(TANKFARM3D_TANKS, TANKFARM3D_MOVEMENTS, hour);
  const total = totalAt(TANKFARM3D_TANKS, TANKFARM3D_MOVEMENTS, hour);
  const rows = TANKFARM3D_PRODUCT_IDS.map((product) => {
    const tanks = TANKFARM3D_TANKS.filter((tank) => tank.product === product);
    const volume = tanks.reduce((sum, tank) => sum + levels[tank.id], 0);
    const capacity = tanks.reduce((sum, tank) => sum + tank.capacity, 0);
    return { product, volume, capacity, count: tanks.length };
  });

  return (
    <Panel className="h-full" title="Stock by product" subtitle="Pick a tank to see its plan">
      <div className="flex min-h-0 flex-1 flex-col justify-between gap-3">
        <div role="img" aria-label={`Stock by product: ${rows.map((row) => `${TANKFARM3D_PRODUCTS[row.product].name} ${formatNumber(row.volume)} cubic metres`).join(', ')}`} className="flex h-10 border-2 border-[var(--kit-rule-strong)]">
          {rows.map((row) => (
            <span key={row.product} data-tone={TANKFARM3D_PRODUCTS[row.product].tone} className="h-full border-r-2 border-[var(--kit-rule-strong)] bg-[var(--t-pop)] last:border-r-0" style={{ width: `${(row.volume / total) * 100}%` }} />
          ))}
        </div>
        <table className="w-full text-sm">
          <caption className="sr-only">Stock by product at this hour</caption>
          <thead>
            <tr className="text-left text-xs font-semibold text-[var(--kit-text-3)]">
              <th scope="col" className="pb-1 font-semibold">
                Product
              </th>
              <th scope="col" className="pb-1 text-right font-semibold">
                Tanks
              </th>
              <th scope="col" className="pb-1 text-right font-semibold">
                Volume, m³
              </th>
              <th scope="col" className="pb-1 text-right font-semibold">
                Full
              </th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {rows.map((row) => (
              <tr key={row.product} className="border-t-2 border-[var(--kit-rule-strong)]">
                <th scope="row" className="py-1.5 text-left font-bold text-[var(--kit-text)]">
                  <span className="flex items-center gap-2">
                    <span aria-hidden="true" data-tone={TANKFARM3D_PRODUCTS[row.product].tone} className="size-3.5 shrink-0 border-2 border-[var(--kit-rule-strong)] bg-[var(--t-pop)]" />
                    {TANKFARM3D_PRODUCTS[row.product].name}
                  </span>
                </th>
                <td className="py-1.5 text-right font-semibold text-[var(--kit-text-2)]">{row.count}</td>
                <td className="py-1.5 text-right font-bold text-[var(--kit-text)]">{formatNumber(row.volume)}</td>
                <td className="py-1.5 text-right font-bold text-[var(--kit-text)]">{formatNumber((row.volume / row.capacity) * 100)} %</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

/** The next movements from an hour on: under way first, then by start. Each row jumps the scrubber into it. */
function TankFarm3dMovements({ hour, selectedId, onOpen, limit = 3 }: { hour: number; selectedId: string | null; onOpen?: (id: string) => void; limit?: number }) {
  const upcoming = TANKFARM3D_MOVEMENTS.filter((movement) => movementPhase(movement, hour) !== 'done')
    .sort((a, b) => a.startHour - b.startHour)
    .slice(0, limit);
  return (
    <ol aria-label="Next movements" className="@container flex flex-col">
      {upcoming.length === 0 ? <li className="py-2 text-sm font-semibold text-[var(--kit-text)]">The plan is complete: nothing more to move in this window.</li> : null}
      {upcoming.map((movement) => {
        const tankId = movement.from ?? movement.to ?? '';
        const tank = tankFarm3dTank(tankId);
        const active = movementPhase(movement, hour) === 'active';
        const out = movement.to === null || (movement.from !== null && movement.from === tankId);
        const touches = selectedId !== null && (movement.from === selectedId || movement.to === selectedId);
        return (
          <li key={movement.id} className="border-t-2 border-[var(--kit-rule-strong)] first:border-t-0">
            <button
              type="button"
              disabled={!onOpen}
              onClick={() => onOpen?.(movement.id)}
              className={`grid w-full grid-cols-[4.5rem_minmax(0,1fr)_auto_auto] items-center gap-3 px-3 py-1.5 text-left text-sm hover:bg-[color-mix(in_oklab,var(--kit-text)_8%,transparent)] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--ring-default)] ${touches ? 'bg-[color-mix(in_oklab,var(--kit-text)_10%,transparent)]' : ''}`}
            >
              <span className={`w-fit px-1.5 text-xs font-bold leading-5 tabular-nums ${active ? 'bg-[var(--kit-text)] text-[var(--kit-surface)]' : 'border-2 border-[var(--kit-rule-strong)] text-[var(--kit-text)]'}`}>{active ? 'Now' : `+${Math.round(movement.startHour - hour)} h`}</span>
              <span className="flex min-w-0 flex-col leading-tight @xl:flex-row @xl:items-baseline @xl:gap-2">
                <span className="whitespace-nowrap font-bold text-[var(--kit-text)]">{movement.name}</span>
                <span className="whitespace-nowrap text-[0.8125rem] font-semibold text-[var(--kit-text-2)]">{movement.counterparty}</span>
              </span>
              <span data-tone={tank ? TANKFARM3D_PRODUCTS[tank.product].tone : 'neutral'} className="border-2 border-[var(--kit-rule-strong)] bg-[var(--t-pop)] px-1.5 text-xs font-bold leading-5 tabular-nums text-[var(--t-on-pop)]">
                {tank ? tank.tag.slice(3) : '—'}
              </span>
              <span className="w-24 whitespace-nowrap text-right font-bold tabular-nums text-[var(--kit-text)]">
                {out ? '−' : '+'}
                {formatNumber(movement.volume)} m³
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

function TankFarm3dScenery({ berthed }: { berthed: boolean }) {
  return (
    <>
      <Building position={[50, 0, 10]} size={[9, 4.2, 7]} />
      <FlareStack position={[-76, 0, 28]} height={18} />
      <Jetty position={[62, -0.6, -7]} length={20} height={4} />
      {berthed ? <TankerShip position={[94, -0.6, -8]} rotationY={Math.PI / 2} length={46} /> : null}
    </>
  );
}

function TankFarm3dFallbackList() {
  return (
    <ul className="flex flex-col border border-default bg-card-background px-3">
      {TANKFARM3D_TANKS.map((tank) => {
        const fill = fillFraction(tank.volume, tank.capacity);
        const mark = tankFarm3dLevelMark(fill);
        return (
          <li key={tank.id} className="flex items-center justify-between gap-3 border-b border-default py-1.5 text-sm last:border-b-0">
            <span className="flex min-w-0 items-baseline gap-2 text-base-foreground">
              <TagId>{tank.tag}</TagId> {TANKFARM3D_PRODUCTS[tank.product].name}
            </span>
            <span className="flex shrink-0 items-center gap-2 tabular-nums text-base-foreground">
              {formatNumber(fill * 100)} %{mark ? <StatusPill tone={mark.tone}>{mark.word}</StatusPill> : null}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

type TankFarm3dTerminalProps = {
  initial?: TankFarm3dState;
  /** `desk` sets the scene beside the level blocks; `portrait` stacks everything for a narrow screen. */
  layout?: 'desk' | 'portrait';
  still?: boolean;
};

function TankFarm3dTerminal({ initial = TANKFARM3D_INITIAL, layout = 'desk', still = false }: TankFarm3dTerminalProps) {
  // Archetype: poster — a heavy masthead with the totals set inline, the 3D farm in one thick
  //   frame and a mosaic of solid level blocks beside it.
  // Interaction: pick a tank on a block or in the scene; the others dim, its plan opens under the
  //   blocks and its movements light up on the time scrubber. Scrubbing moves every level at once.
  const [state, dispatch] = useReducer(tankFarm3dReducer, initial);
  const scope = useRef<HTMLDivElement>(null);
  const colours = useTokenColors(TANKFARM3D_RING_TOKENS, scope);
  const levels = levelsAt(TANKFARM3D_TANKS, TANKFARM3D_MOVEMENTS, state.hour);
  const tanks = TANKFARM3D_TANKS.map((tank) => tankFarm3dSnapshot(tank, levels[tank.id], colours));
  const flows = tankFarm3dFlows(state.hour);
  const selected = state.selectedId ? tankFarm3dTank(state.selectedId) : undefined;
  const berth = tankFarm3dBerth(state.hour);
  const total = totalAt(TANKFARM3D_TANKS, TANKFARM3D_MOVEMENTS, state.hour);
  const desk = layout === 'desk';

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape' && state.selectedId) {
      event.preventDefault();
      dispatch({ type: 'select', id: null });
    }
  };

  const scene = (
    <div className={`relative min-h-0 overflow-hidden shadow-[5px_5px_0_var(--kit-rule-strong)] ${TANKFARM3D_BOX} ${desk ? 'flex-1' : 'h-[24rem]'}`}>
      <SceneCanvas
        label={`3D model of the Stord terminal tank farm ${Math.round(state.hour)} hours ahead, rings coloured by product${selected ? `, ${selected.tag} selected` : ''}`}
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
            insets={{ top: 44, bottom: 8, left: 36 }}
          >
            <TankFarm3dScenery berthed={berth !== undefined} />
          </TankFarm>
        </StillScene>
      </SceneCanvas>
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center gap-3 border-b-2 border-[var(--kit-rule-strong)] bg-[var(--kit-surface)] px-3 py-2">
        <span className="shrink-0 text-xs font-bold text-[var(--kit-text)]">Rings</span>
        <Legend items={TANKFARM3D_PRODUCT_IDS.map((product) => ({ label: TANKFARM3D_PRODUCTS[product].short, tone: TANKFARM3D_PRODUCTS[product].tone }))} className="min-w-0" />
      </div>
      <div className="pointer-events-auto absolute bottom-3 left-3 z-30 border-2 border-[var(--kit-rule-strong)] bg-[var(--kit-surface)] px-3 py-1.5">
        <Switch label="Plan view" checked={state.plan} onCheckedChange={(checked) => dispatch({ type: 'plan', value: checked })} />
      </div>
    </div>
  );

  const scrubber = (
    <div className={`shrink-0 px-4 py-3 ${TANKFARM3D_BOX}`}>
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
        actions={<span className="text-[0.8125rem] font-semibold text-[var(--kit-text)]">{flows.length === 0 ? 'No transfers at this hour' : `${flows.length} ${flows.length === 1 ? 'transfer' : 'transfers'} under way`}</span>}
      />
    </div>
  );

  const detail = selected ? (
    <TankFarm3dTankPanel key={selected.id} tank={selected} hour={state.hour} onClose={() => dispatch({ type: 'select', id: null })} chartHeight={desk ? 132 : 180} />
  ) : (
    <TankFarm3dStockPanel hour={state.hour} />
  );

  return (
    <div
      ref={scope}
      tabIndex={-1}
      onKeyDown={onKeyDown}
      onPointerDownCapture={(event) => {
        // Orbit controls swallow the pointer event, so take focus by hand to keep Escape working.
        if (event.target instanceof HTMLCanvasElement) event.currentTarget.focus({ preventScroll: true });
      }}
      className={`flex w-full flex-col gap-5 bg-[var(--kit-canvas-bg)] p-5 text-[var(--kit-text)] outline-none ${desk ? 'h-[52rem]' : ''} ${TANKFARM3D_SCENE_TYPE}`}
    >
      <header className="flex shrink-0 flex-wrap items-end justify-between gap-x-8 gap-y-3 border-b-4 border-[var(--kit-rule-strong)] pb-3">
        <div className="flex flex-col">
          <h3 className="text-4xl font-extrabold leading-none tracking-tight text-[var(--kit-text)]">Stord terminal</h3>
          <span className="mt-1.5 text-sm font-semibold text-[var(--kit-text-2)]">Tank farm · 9 tanks · {berth ? `${berth.counterparty} at the berth` : 'berth free'}</span>
        </div>
        <div className="flex items-end gap-8">
          <TankFarm3dFigure label="Stock" value={formatNumber(total)} unit="m³" />
          <TankFarm3dFigure label="Filled" value={formatNumber((total / TANKFARM3D_CAPACITY) * 100)} unit="%" />
          <TankFarm3dFigure label="Looking at" value={state.hour === 0 ? 'Now' : `+${Math.round(state.hour)} h`} />
        </div>
      </header>

      {desk ? (
        <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_minmax(0,27rem)] gap-5">
          <div className="flex min-h-0 flex-col gap-5">
            {scene}
            <div className={`shrink-0 ${TANKFARM3D_BOX}`}>
              <TankFarm3dMovements hour={state.hour} selectedId={state.selectedId} onOpen={(id) => dispatch({ type: 'openMovement', id })} />
            </div>
            {scrubber}
          </div>
          <div className="flex min-h-0 flex-col gap-5">
            <TankFarm3dBlocks hour={state.hour} selectedId={state.selectedId} onSelect={(id) => dispatch({ type: 'select', id })} className="shrink-0" />
            <div className="min-h-0 flex-1">{detail}</div>
          </div>
        </div>
      ) : (
        <>
          {scene}
          <TankFarm3dBlocks hour={state.hour} selectedId={state.selectedId} onSelect={(id) => dispatch({ type: 'select', id })} size="lg" />
          <div className="h-[23rem]">{detail}</div>
          <div className={TANKFARM3D_BOX}>
            <TankFarm3dMovements hour={state.hour} selectedId={state.selectedId} onOpen={(id) => dispatch({ type: 'openMovement', id })} limit={4} />
          </div>
          {scrubber}
        </>
      )}
    </div>
  );
}

function TankFarm3dSignature() {
  return (
    <LookScope look="poster" className="w-full">
      <TankFarm3dTerminal />
    </LookScope>
  );
}

function TankFarm3dSelected() {
  return (
    <LookScope look="poster" className="w-full">
      <TankFarm3dTerminal initial={{ hour: 26, playing: false, selectedId: 'ta-209', plan: true }} still />
    </LookScope>
  );
}

function TankFarm3dPortrait() {
  return (
    <LookScope look="poster" className="mx-auto w-full max-w-[46rem]">
      <TankFarm3dTerminal initial={{ hour: 12, playing: false, selectedId: 'ta-201', plan: false }} layout="portrait" still />
    </LookScope>
  );
}

function TankFarm3dPartFrame({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <LookScope look="poster" className="w-full">
      <div className={`flex w-full flex-col gap-4 bg-[var(--kit-canvas-bg)] p-5 text-[var(--kit-text)] ${TANKFARM3D_SCENE_TYPE} ${className}`}>{children}</div>
    </LookScope>
  );
}

function TankFarm3dPartBlocks() {
  const [selectedId, setSelectedId] = useState<string | null>('ta-204');
  return (
    <TankFarm3dPartFrame className="h-[27rem] justify-center">
      <TankFarm3dBlocks hour={0} selectedId={selectedId} onSelect={(id) => setSelectedId(id === selectedId ? null : id)} />
    </TankFarm3dPartFrame>
  );
}

function TankFarm3dPartTankPanel() {
  const tank = tankFarm3dTank('ta-201');
  return <TankFarm3dPartFrame className="h-[27rem]">{tank ? <TankFarm3dTankPanel tank={tank} hour={0} chartHeight={170} /> : null}</TankFarm3dPartFrame>;
}

function TankFarm3dPartStock() {
  return (
    <TankFarm3dPartFrame className="h-[24rem]">
      <TankFarm3dStockPanel hour={0} />
    </TankFarm3dPartFrame>
  );
}

function TankFarm3dPartBlock() {
  const [level, setLevel] = useState(92);
  const mark = tankFarm3dLevelMark(level / 100);
  return (
    <TankFarm3dPartFrame className="h-[24rem]">
      <div className="grid min-h-0 flex-1 grid-cols-2 gap-5">
        <LevelBlock className="h-full" size="lg" label="TA-204" caption="Condensate" fill={level / 100} tone="teal" state={mark ? { tone: mark.tone, word: mark.word } : undefined} />
        <LevelBlock className="h-full" size="lg" label="TA-206" caption="Diesel" fill={1 - level / 100} tone="amber" state={tankFarm3dLevelMark(1 - level / 100)} />
      </div>
      <div className="flex items-center gap-4">
        <span className="w-28 shrink-0 text-sm font-bold text-[var(--kit-text)]">Transfer {level} %</span>
        <Slider aria-label="Share held in the first tank" value={[level]} min={0} max={100} step={1} onValueChange={(value) => setLevel(value[0] ?? 0)} />
      </div>
    </TankFarm3dPartFrame>
  );
}

function TankFarm3dPartTank() {
  const [level, setLevel] = useState(92);
  const mark = tankFarm3dLevelMark(level / 100);
  return (
    <TankFarm3dPartFrame className="h-80">
      <div className={`min-h-0 flex-1 ${TANKFARM3D_BOX}`}>
        <SceneCanvas label={`Storage tank filled to ${level} percent with a level indicator ring`}>
          <StillScene>
            <TurntableStage subjectSize={[20, 13, 20]}>
              <StorageTank diameter={14} height={12} fill={level / 100} tone={mark?.tone ?? 'neutral'} />
            </TurntableStage>
          </StillScene>
        </SceneCanvas>
      </div>
      <div className="flex items-center gap-4">
        <span className="w-28 shrink-0 text-sm font-bold tabular-nums text-[var(--kit-text)]">
          {level} %{mark ? ` · ${mark.word.toLowerCase()}` : ''}
        </span>
        <Slider aria-label="Tank level" value={[level]} min={0} max={100} step={1} onValueChange={(value) => setLevel(value[0] ?? 0)} />
      </div>
    </TankFarm3dPartFrame>
  );
}

function TankFarm3dPartBund() {
  const spots = TANKFARM3D_TANKS.filter((tank) => tank.row === 'south').map((tank, index) => ({ ...tank, center: [(index - 1.5) * 20, 0] as const }));
  const rect = bundRect(spots, 4);
  return (
    <TankFarm3dPartFrame className="h-80">
      <div className={`min-h-0 flex-1 ${TANKFARM3D_BOX}`}>
        <SceneCanvas label="A bunded row of four tanks of different sizes">
          <StillScene>
            <TurntableStage subjectSize={[84, 12, 26]} padding={0.6}>
              {rect ? <BundWall rect={rect} /> : null}
              {spots.map((tank) => (
                <StorageTank key={tank.id} position={[tank.center[0], 0, tank.center[1]]} diameter={tank.diameter} height={tank.height} fill={fillFraction(tank.volume, tank.capacity)} />
              ))}
            </TurntableStage>
          </StillScene>
        </SceneCanvas>
      </div>
      <p className="text-sm font-semibold text-[var(--kit-text)]">South row: diesel, marine gas oil and methanol inside one bund wall.</p>
    </TankFarm3dPartFrame>
  );
}

function TankFarm3dPartJetty() {
  return (
    <TankFarm3dPartFrame className="h-80">
      <div className={`min-h-0 flex-1 ${TANKFARM3D_BOX}`}>
        <SceneCanvas label="Loading jetty with a tanker alongside">
          <StillScene>
            <TurntableStage subjectSize={[56, 14, 48]} padding={0.72}>
              <SeaPlane size={[70, 70]} level={1.2} cell={7} />
              <Jetty position={[-26, 1.2, 0]} length={22} height={4} />
              <TankerShip position={[10, 1.2, 0]} rotationY={Math.PI / 2} length={46} />
            </TurntableStage>
          </StillScene>
        </SceneCanvas>
      </div>
      <p className="text-sm font-semibold text-[var(--kit-text)]">The single berth: a ship appears while a lifting or a receipt is under way.</p>
    </TankFarm3dPartFrame>
  );
}

function TankFarm3dPartScrubber() {
  const [state, dispatch] = useReducer(tankFarm3dReducer, { hour: 22, playing: false, selectedId: 'ta-201', plan: false });
  return (
    <TankFarm3dPartFrame>
      <div className={TANKFARM3D_BOX}>
        <TankFarm3dMovements hour={state.hour} selectedId={state.selectedId} onOpen={(id) => dispatch({ type: 'openMovement', id })} limit={4} />
      </div>
      <div className={`px-4 py-3 ${TANKFARM3D_BOX}`}>
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
          actions={<span className="text-[0.8125rem] font-semibold text-[var(--kit-text)]">Movements of {tankFarm3dTank(state.selectedId ?? '')?.tag ?? 'all tanks'} are highlighted</span>}
        />
      </div>
    </TankFarm3dPartFrame>
  );
}

export default definePage({
  id: 'tank-farm-3d',
  title: 'Tank farm in 3D',
  summary:
    'The Stord terminal as a poster: the 3D tank farm in one thick frame beside a mosaic of solid level blocks, each filled to its tank level in the colour of its product. Picking a tank opens its plan; a time scrubber moves every level through the next 72 hours.',
  guidance: {
    use: [
      'When the fill is the message: tank farms, silos, batteries, anything with a level and a product.',
      'With the same colour for a product on its block and on the ring around its tank, so the two views read as one.',
      'With a block per tank as the keyboard path: every tank in the scene is also a button beside it.',
      'With a bounded look-ahead, so planners can see which tank runs high or low before it does.',
    ],
    avoid: [
      'Status colour for products. Products are categories; a high or low level gets a flag with a word.',
      'More than about a dozen blocks. Group by product or bund before the mosaic turns into noise.',
      'Small or monospaced labels over the tanks: tag and level are read from across the room.',
      'Playback that loops: it starts on request and stops at the end of the plan.',
    ],
  },
  source,
  sections: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description:
        'Click a level block or a tank in the scene to select it: the other tanks dim, its plan opens under the blocks and its movements light up on the scrubber. Drag the scrubber, or press Play plan, and every block and tank follows the plan. Plan view looks straight down. Escape clears the selection.',
      specimens: [
        {
          id: 'TankFarm3dSignature',
          title: 'Terminal poster',
          note: 'Pick it for a terminal screen that has to say how full everything is from across the room, and still answer for one tank.',
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
            'three/scenes/TankerShip.tsx',
            'three/scenes/Jetty.tsx',
            'kit/tank-farm-3d/LevelBlock.tsx',
            'kit/Panel.tsx',
            'kit/TrendLine.tsx',
            'kit/Legend.tsx',
            'looks/LookScope.tsx',
          ],
          Component: TankFarm3dSignature,
        },
      ],
    },
    {
      id: 'variations',
      title: 'Other screens',
      description: 'The detail state from above, 26 hours ahead with the methanol tank selected mid-receipt, and the same terminal stacked for a portrait tablet. Both render a still frame.',
      specimens: [
        {
          id: 'TankFarm3dSelected',
          title: 'Tank selected, plan view',
          note: 'Pick it to follow one tank through a movement: the plan view shows the route, the panel the level it ends at.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['three/scenes/TankFarm.tsx', 'three/scenes/inventoryProjection.ts', 'three/scenes/StillScene.tsx', 'kit/tank-farm-3d/LevelBlock.tsx', 'kit/TrendLine.tsx', 'looks/LookScope.tsx'],
          Component: TankFarm3dSelected,
        },
        {
          id: 'TankFarm3dPortrait',
          title: 'Portrait tablet',
          note: 'Pick it for the jetty office tablet: scene, larger blocks, the selected tank and the scrubber in one column.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['three/scenes/TankFarm.tsx', 'three/scenes/StillScene.tsx', 'kit/tank-farm-3d/LevelBlock.tsx', 'kit/Panel.tsx', 'looks/LookScope.tsx'],
          Component: TankFarm3dPortrait,
        },
      ],
    },
    {
      id: 'parts',
      title: 'Parts',
      description: 'The level mosaic, the two states of the detail slot, the block at its large size, three models and the scrubber.',
      specimens: [
        {
          id: 'TankFarm3dPartBlocks',
          title: 'Level mosaic',
          note: 'Pick it to compare many levels at once: the fill is the bar, the numeral the value, the colour the product.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['kit/tank-farm-3d/LevelBlock.tsx', 'three/scenes/inventoryProjection.ts'],
          Component: TankFarm3dPartBlocks,
        },
        {
          id: 'TankFarm3dPartTankPanel',
          title: 'Tank plan',
          note: 'Pick it for one tank: volume, room left, days of cover, the next movement and the projected level against its limits.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['kit/Panel.tsx', 'kit/TrendLine.tsx', 'three/scenes/inventoryProjection.ts'],
          Component: TankFarm3dPartTankPanel,
        },
        {
          id: 'TankFarm3dPartStock',
          title: 'Stock by product',
          note: 'Pick it as the resting state of the detail slot: one stacked bar and a small table of the same numbers.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['kit/Panel.tsx', 'three/scenes/inventoryProjection.ts'],
          Component: TankFarm3dPartStock,
        },
        {
          id: 'TankFarm3dPartBlock',
          title: 'Level block, large',
          note: 'Pick the large size when two or three levels carry the screen. Drag to move product from one tank to the other.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['kit/tank-farm-3d/LevelBlock.tsx'],
          Component: TankFarm3dPartBlock,
        },
        {
          id: 'TankFarm3dPartTank',
          title: 'Tank with a level',
          note: 'Pick it when the liquid should be seen in the shell: the ring turns with the level state.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['three/StorageTank.tsx', 'three/TurntableStage.tsx', 'three/scenes/StillScene.tsx'],
          Component: TankFarm3dPartTank,
        },
        {
          id: 'TankFarm3dPartBund',
          title: 'Bunded row',
          note: 'Pick it to group tanks the way the site does: one wall around the tanks that share containment.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['three/scenes/BundWall.tsx', 'three/StorageTank.tsx', 'three/scenes/tankFarmLayout.ts', 'three/TurntableStage.tsx'],
          Component: TankFarm3dPartBund,
        },
        {
          id: 'TankFarm3dPartJetty',
          title: 'Jetty and tanker',
          note: 'Pick it to show that the berth is occupied without a word: the ship is there or it is not.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['three/scenes/Jetty.tsx', 'three/scenes/TankerShip.tsx', 'three/scenes/SeaPlane.tsx', 'three/TurntableStage.tsx'],
          Component: TankFarm3dPartJetty,
        },
        {
          id: 'TankFarm3dPartScrubber',
          title: 'Movement list and time scrubber',
          note: 'Pick them to look ahead over a plan: the list says what is next, the bars when, and either takes you into the movement.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['three/scenes/TimeScrubber.tsx', 'three/scenes/inventoryProjection.ts'],
          Component: TankFarm3dPartScrubber,
        },
      ],
    },
  ],
});
