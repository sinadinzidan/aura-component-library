import { Button } from '@cognite/aura/components/button';
import { IconArrowDown, IconArrowUp, IconShip, IconTruck } from '@cognite/aura/icons';
import { useState } from 'react';

import { DashboardFrame } from '../../../library/dashboards/DashboardFrame';
import { DashboardCell, DashboardGrid } from '../../../library/dashboards/DashboardGrid';
import { DashboardPanel } from '../../../library/dashboards/DashboardPanel';
import { DaysOfCover } from '../../../library/industrial/domains/DaysOfCover';
import { daysOfCover, fillPercent, ullage } from '../../../library/industrial/domains/inventory';
import { ShareBarList } from '../../../library/industrial/domains/ShareBarList';
import { formatReading, formatValue, toneFromLimits } from '../../../library/industrial/status';
import type { StatusDescriptor } from '../../../library/industrial/status';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { ValueReadout } from '../../../library/industrial/ValueReadout';
import { ThemeScope } from '../../../library/themes/ThemeScope';
import { DAY, HOUR, REFERENCE_NOW, formatDate, formatDateTime } from '../../data/series';
import { definePage } from '../../types';

import source from './tank-farm-logistics.tsx?raw';

type TankFarmTank = {
  id: string;
  /** Tank tag. */
  tag: string;
  product: string;
  /** Shell capacity and current volume in m³. */
  capacity: number;
  volume: number;
  /** Operating band in percent of capacity. */
  minPercent: number;
  maxPercent: number;
  /** Average offtake in m³ per day. */
  dailyUse: number;
  /** Days from ordering a cargo to having it in the tank. */
  leadTimeDays: number;
};

const TANK_FARM_TANKS: readonly TankFarmTank[] = [
  { id: 't-101', tag: '61-TA-101', product: 'Marine gas oil', capacity: 15000, volume: 11250, minPercent: 15, maxPercent: 90, dailyUse: 620, leadTimeDays: 6 },
  { id: 't-102', tag: '61-TA-102', product: 'Diesel', capacity: 8000, volume: 3120, minPercent: 15, maxPercent: 90, dailyUse: 340, leadTimeDays: 5 },
  { id: 't-103', tag: '61-TA-103', product: 'Monoethylene glycol', capacity: 5000, volume: 610, minPercent: 15, maxPercent: 90, dailyUse: 150, leadTimeDays: 5 },
  { id: 't-104', tag: '61-TA-104', product: 'Methanol', capacity: 3000, volume: 2610, minPercent: 15, maxPercent: 90, dailyUse: 45, leadTimeDays: 10 },
  { id: 't-105', tag: '61-TA-105', product: 'Jet A-1', capacity: 4000, volume: 2240, minPercent: 20, maxPercent: 90, dailyUse: 110, leadTimeDays: 7 },
];

/** Midnight UTC before the reference time: the left edge of the schedule. */
const TANK_FARM_DAY_ZERO = REFERENCE_NOW - 14 * HOUR;

const TANK_FARM_DAYS = [0, 1, 2, 3, 4].map((offset) => formatDate(TANK_FARM_DAY_ZERO + offset * DAY));

const TANK_FARM_NOW = (REFERENCE_NOW - TANK_FARM_DAY_ZERO) / DAY;

type TankFarmMovement = {
  id: string;
  carrier: 'ship' | 'truck';
  name: string;
  berth: string;
  tankId: string;
  /** `in` discharges into the tank; `out` loads from it. */
  direction: 'in' | 'out';
  /** Volume in m³. */
  volume: number;
  /** Start and end in days from the left edge of the schedule. */
  start: number;
  end: number;
  alongside?: boolean;
};

const TANK_FARM_MOVEMENTS: readonly TankFarmMovement[] = [
  { id: 'mv-0318', carrier: 'ship', name: 'PSV Stril Polar', berth: 'Jetty 2', tankId: 't-101', direction: 'out', volume: 1800, start: 0.42, end: 0.8, alongside: true },
  { id: 'mv-0319', carrier: 'ship', name: 'PSV Havila Borg', berth: 'Jetty 2', tankId: 't-103', direction: 'out', volume: 450, start: 1.05, end: 1.45 },
  { id: 'mv-0320', carrier: 'truck', name: 'Road tanker HF-2', berth: 'Truck rack', tankId: 't-105', direction: 'out', volume: 180, start: 1.3, end: 1.5 },
  { id: 'mv-0321', carrier: 'ship', name: 'MT Bow Fjord', berth: 'Jetty 1', tankId: 't-103', direction: 'in', volume: 2800, start: 1.7, end: 2.45 },
  { id: 'mv-0322', carrier: 'ship', name: 'MS Island Crown', berth: 'Jetty 2', tankId: 't-101', direction: 'out', volume: 2400, start: 2.5, end: 3.05 },
  { id: 'mv-0323', carrier: 'ship', name: 'MT Nordic Tern', berth: 'Jetty 1', tankId: 't-102', direction: 'in', volume: 4200, start: 3.2, end: 4.1 },
];

type TankFarmLedgerEntry = {
  id: string;
  at: number;
  counterparty: string;
  tankId: string;
  direction: 'in' | 'out';
  volume: number;
  done: boolean;
};

const TANK_FARM_LEDGER: readonly TankFarmLedgerEntry[] = [
  { id: 'MV-0318', at: REFERENCE_NOW - 4 * HOUR, counterparty: 'PSV Stril Polar', tankId: 't-101', direction: 'out', volume: 1800, done: false },
  { id: 'MV-0317', at: REFERENCE_NOW - 8 * HOUR, counterparty: 'Road tanker NK-7', tankId: 't-103', direction: 'out', volume: 60, done: true },
  { id: 'MV-0316', at: REFERENCE_NOW - 18.5 * HOUR, counterparty: 'MT Nordic Tern', tankId: 't-101', direction: 'in', volume: 5200, done: true },
  { id: 'MV-0315', at: REFERENCE_NOW - 24 * HOUR, counterparty: 'Road tanker HF-2', tankId: 't-105', direction: 'out', volume: 90, done: true },
  { id: 'MV-0314', at: REFERENCE_NOW - 29 * HOUR, counterparty: 'PSV Havila Borg', tankId: 't-103', direction: 'out', volume: 420, done: true },
  { id: 'MV-0313', at: REFERENCE_NOW - 45.5 * HOUR, counterparty: 'MT Bow Fjord', tankId: 't-104', direction: 'in', volume: 1100, done: true },
];

const TANK_FARM_THROUGHPUT = [
  { id: 't-101', label: 'Marine gas oil', value: 9400 },
  { id: 't-102', label: 'Diesel', value: 2380 },
  { id: 't-103', label: 'Monoethylene glycol', value: 1050 },
  { id: 't-105', label: 'Jet A-1', value: 770 },
  { id: 't-104', label: 'Methanol', value: 315 },
];

function tankFarmTank(tankId: string): TankFarmTank {
  return TANK_FARM_TANKS.find((tank) => tank.id === tankId) ?? TANK_FARM_TANKS[0];
}

const tankFarmShortTag = (tank: TankFarmTank): string => tank.tag.slice(-6);

function tankFarmStatus(tank: TankFarmTank): StatusDescriptor | undefined {
  const level = fillPercent(tank.volume, tank.capacity);
  const tone = toneFromLimits(level, { low: tank.minPercent, high: tank.maxPercent });
  if (tone === 'neutral') return undefined;
  return { tone, label: level < tank.minPercent ? 'Below minimum' : 'Above maximum', shape: 'square' };
}

const tankFarmSigned = (direction: 'in' | 'out', volume: number): string => `${direction === 'in' ? '+' : '−'}${formatValue(volume, 0)}`;

const tankFarmDayTime = (dayOffset: number): string => formatDateTime(TANK_FARM_DAY_ZERO + dayOffset * DAY);

/** Body of the drawn tank in the 120 × 150 viewBox: where 0% and 100% sit. */
const TANK_FARM_BODY = { top: 30, bottom: 140, left: 10, right: 110 } as const;

const tankFarmLevelY = (percent: number): number => TANK_FARM_BODY.bottom - (percent / 100) * (TANK_FARM_BODY.bottom - TANK_FARM_BODY.top);

type TankFarmVesselProps = {
  tank: TankFarmTank;
  selected: boolean;
  onSelect: (tankId: string) => void;
};

/** One tank drawn to scale: liquid to its real level, minimum and maximum marked on the shell. */
function TankFarmVessel({ tank, selected, onSelect }: TankFarmVesselProps) {
  const level = fillPercent(tank.volume, tank.capacity);
  const status = tankFarmStatus(tank);
  const surface = tankFarmLevelY(level);
  const marks = [
    { key: 'max', percent: tank.maxPercent },
    { key: 'min', percent: tank.minPercent },
  ];
  const liquid = status ? (status.tone === 'critical' ? 'fill-chart-critical-300' : 'fill-chart-warning-300') : 'fill-chart-1-300';

  return (
    <li className="flex min-w-0 flex-col gap-3">
      <button
        type="button"
        aria-pressed={selected}
        aria-label={`${tank.product}, tank ${tank.tag}: ${formatValue(level, 0)}% full, ${formatValue(tank.volume, 0)} m³${status ? `, ${status.label.toLowerCase()}` : ''}`}
        onClick={() => onSelect(tank.id)}
        className={`group flex w-full cursor-pointer items-stretch gap-2 rounded-lg p-2 outline-none focus-visible:shadow-focus-ring ${selected ? 'bg-card-background-hover' : 'hover:bg-card-background-hover'}`}
      >
        <span className="relative block h-44 min-w-0 flex-1">
          <svg aria-hidden="true" viewBox="0 0 120 150" preserveAspectRatio="none" className="absolute inset-0 size-full">
            <path d="M 10 30 Q 60 6 110 30 L 110 140 L 10 140 Z" className="fill-base-background" />
            <rect x={TANK_FARM_BODY.left} y={surface} width={100} height={TANK_FARM_BODY.bottom - surface} className={liquid} />
            <line x1={TANK_FARM_BODY.left} x2={TANK_FARM_BODY.right} y1={surface} y2={surface} strokeWidth={1.5} vectorEffect="non-scaling-stroke" className={status ? 'stroke-base-foreground' : 'stroke-chart-1-450'} />
            {marks.map((mark) => (
              <line key={mark.key} x1={TANK_FARM_BODY.left} x2={118} y1={tankFarmLevelY(mark.percent)} y2={tankFarmLevelY(mark.percent)} strokeWidth={1} strokeDasharray="4 3" vectorEffect="non-scaling-stroke" className="stroke-muted-foreground" />
            ))}
            <path
              d="M 10 30 Q 60 6 110 30 L 110 140 L 10 140 Z"
              fill="none"
              strokeWidth={selected ? 3 : 1.5}
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              className={selected ? 'stroke-base-foreground' : 'stroke-emphasized group-hover:stroke-muted-foreground'}
            />
            <line x1={2} x2={118} y1={146} y2={146} strokeWidth={1.5} vectorEffect="non-scaling-stroke" className="stroke-emphasized" />
            <line x1={60} x2={60} y1={8} y2={18} strokeWidth={4} vectorEffect="non-scaling-stroke" className="stroke-emphasized" />
          </svg>
          <span className="absolute inset-x-0 top-[38%] flex justify-center">
            <span className="rounded-md bg-base-background px-2 py-1 text-2xl font-semibold tabular-nums leading-none text-base-foreground">{formatValue(level, 0)}%</span>
          </span>
        </span>
        <span aria-hidden="true" className="relative block w-9 shrink-0">
          {marks.map((mark) => (
            <span
              key={mark.key}
              className="absolute left-0 -translate-y-1/2 whitespace-nowrap text-xs tabular-nums leading-none text-muted-foreground"
              style={{ top: `${(tankFarmLevelY(mark.percent) / 150) * 100}%` }}
            >
              {mark.percent}%
            </span>
          ))}
        </span>
      </button>
      <div className="flex min-w-0 flex-col gap-2 px-2">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className={`text-sm text-base-foreground ${selected ? 'font-semibold' : 'font-medium'}`}>{tank.product}</span>
          <span className="font-mono text-xs text-muted-foreground">{tank.tag}</span>
        </div>
        <dl className="flex flex-col gap-1 text-xs">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3">
            <dt className="text-muted-foreground">Volume</dt>
            <dd className="tabular-nums text-base-foreground">{formatReading(tank.volume, 'm³', 0)}</dd>
          </div>
          <div className="flex flex-wrap items-baseline justify-between gap-x-3">
            <dt className="text-muted-foreground">Ullage</dt>
            <dd className="tabular-nums text-base-foreground">{formatReading(ullage(tank.capacity, tank.volume), 'm³', 0)}</dd>
          </div>
        </dl>
        {status ? <StatusIndicator {...status} size="sm" /> : <span className="text-xs text-muted-foreground">Inside operating band</span>}
      </div>
    </li>
  );
}

type TankFarmSelectionProps = {
  selectedTankId: string | null;
  onSelectTank: (tankId: string) => void;
};

/** The dominant element: the tank farm as a row of vessels, each one selectable. */
function TankFarmTanksPanel({ selectedTankId, onSelectTank }: TankFarmSelectionProps) {
  const total = TANK_FARM_TANKS.reduce((sum, tank) => sum + tank.volume, 0);
  const capacity = TANK_FARM_TANKS.reduce((sum, tank) => sum + tank.capacity, 0);

  return (
    <DashboardPanel
      title="Tanks"
      description="Level against the operating band; dashed lines mark minimum and maximum. Select a tank to follow its cargoes."
      footnote={`${formatValue(total, 0)} m³ in store across five tanks, ${formatValue((total / capacity) * 100, 0)}% of shell capacity. Only the glycol tank is outside its band.`}
    >
      <ul aria-label="Tanks" className="grid w-full grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-3 xl:grid-cols-5">
        {TANK_FARM_TANKS.map((tank) => (
          <TankFarmVessel key={tank.id} tank={tank} selected={tank.id === selectedTankId} onSelect={onSelectTank} />
        ))}
      </ul>
    </DashboardPanel>
  );
}

type TankFarmScheduleProps = TankFarmSelectionProps & {
  selectedMovementId: string | null;
  onSelectMovement: (movementId: string) => void;
};

/** Ships and road tankers over the next five days: one row per call, one bar per stay at the berth. */
function TankFarmSchedulePanel({ selectedTankId, selectedMovementId, onSelectMovement }: Omit<TankFarmScheduleProps, 'onSelectTank'>) {
  const related = TANK_FARM_MOVEMENTS.filter((movement) => movement.tankId === selectedTankId).length;

  return (
    <DashboardPanel
      title="Berth and loading schedule"
      description={
        selectedTankId === null
          ? 'Next five days, by arrival. Select a call to see its tank.'
          : `${related} of ${TANK_FARM_MOVEMENTS.length} calls move ${tankFarmTank(selectedTankId).product.toLowerCase()}; the others are dimmed.`
      }
      footnote="Six calls in five days: Jetty 2 is busy today and Saturday, Jetty 1 from Friday night. The line marks 14:00 today."
    >
      <div role="group" aria-label="Berth and loading schedule, next five days" className="grid w-full min-w-0 grid-cols-[minmax(9rem,13rem)_minmax(0,1fr)] gap-x-4">
        <span />
        <div aria-hidden="true" className="grid grid-cols-5 pb-2">
          {TANK_FARM_DAYS.map((day) => (
            <span key={day} className="text-xs tabular-nums text-muted-foreground">
              {day}
            </span>
          ))}
        </div>
        {TANK_FARM_MOVEMENTS.map((movement) => {
          const tank = tankFarmTank(movement.tankId);
          const isRelated = selectedTankId === null || movement.tankId === selectedTankId;
          const isSelected = movement.id === selectedMovementId;
          const Carrier = movement.carrier === 'ship' ? IconShip : IconTruck;
          const Direction = movement.direction === 'in' ? IconArrowDown : IconArrowUp;
          const action = movement.direction === 'in' ? 'discharges' : 'loads';
          return (
            <div key={movement.id} className="col-span-2 grid grid-cols-subgrid items-center border-t border-default py-3">
              <div className={`flex min-w-0 items-start gap-2 ${isRelated ? '' : 'opacity-50'}`}>
                <Carrier aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className={`text-sm text-base-foreground ${isSelected ? 'font-semibold' : ''}`}>{movement.name}</p>
                  <p className="text-xs tabular-nums text-muted-foreground">
                    {movement.berth} · {tankFarmSigned(movement.direction, movement.volume)} m³ <span className="font-mono">{tankFarmShortTag(tank)}</span>
                  </p>
                </div>
              </div>
              <div className="relative h-10 min-w-0">
                <div aria-hidden="true" className="absolute inset-0 grid grid-cols-5">
                  {TANK_FARM_DAYS.map((day) => (
                    <span key={day} className="border-l border-default" />
                  ))}
                </div>
                <span aria-hidden="true" className="absolute inset-y-0 w-px bg-base-foreground" style={{ left: `${(TANK_FARM_NOW / 5) * 100}%` }} />
                <button
                  type="button"
                  aria-pressed={isSelected}
                  aria-label={`${movement.name} ${action} ${formatValue(movement.volume, 0)} m³ of ${tank.product.toLowerCase()} at ${movement.berth}, ${tankFarmDayTime(movement.start)} to ${tankFarmDayTime(movement.end)}${movement.alongside ? ', alongside now' : ''}`}
                  onClick={() => onSelectMovement(movement.id)}
                  className={`absolute inset-y-1 flex min-w-6 cursor-pointer items-center justify-center rounded-md outline-none focus-visible:shadow-focus-ring ${
                    isRelated ? 'bg-chart-1-450 text-base-background' : 'bg-chart-neutral-200 text-muted-foreground'
                  } ${isSelected ? 'ring-2 ring-base-foreground ring-offset-2 ring-offset-card-background' : ''}`}
                  style={{ left: `${(movement.start / 5) * 100}%`, width: `${((movement.end - movement.start) / 5) * 100}%` }}
                >
                  <Direction aria-hidden className="size-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <IconArrowDown aria-hidden className="size-3.5" /> Discharge into tank
        </span>
        <span className="inline-flex items-center gap-1">
          <IconArrowUp aria-hidden className="size-3.5" /> Load from tank
        </span>
      </p>
    </DashboardPanel>
  );
}

/** What the selection means for stock: days of cover and where the planned cargoes leave the tank. */
function TankFarmCoverPanel({ selectedTankId, selectedMovementId }: { selectedTankId: string | null; selectedMovementId: string | null }) {
  if (selectedTankId === null) {
    return (
      <DashboardPanel title="Days of cover" description="Every tank at today's offtake, shortest first">
        <ul className="flex w-full flex-col gap-3">
          {[...TANK_FARM_TANKS]
            .sort((a, b) => (daysOfCover(a.volume, a.dailyUse) ?? 0) - (daysOfCover(b.volume, b.dailyUse) ?? 0))
            .map((tank) => (
              <li key={tank.id} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <span className="min-w-0 text-sm text-base-foreground">{tank.product}</span>
                <DaysOfCover variant="inline" label={tank.product} onHand={tank.volume} dailyUse={tank.dailyUse} leadTimeDays={tank.leadTimeDays} />
              </li>
            ))}
        </ul>
      </DashboardPanel>
    );
  }

  const tank = tankFarmTank(selectedTankId);
  const planned = TANK_FARM_MOVEMENTS.filter((movement) => movement.tankId === tank.id);
  const steps = planned.reduce<{ movement: TankFarmMovement; after: number }[]>((list, movement) => {
    const before = list.length === 0 ? tank.volume : list[list.length - 1].after;
    return [...list, { movement, after: before + (movement.direction === 'in' ? movement.volume : -movement.volume) }];
  }, []);

  return (
    <DashboardPanel title="Days of cover" description={`${tank.product} · ${formatReading(tank.dailyUse, 'm³/d', 0)} offtake`}>
      <DaysOfCover label={`Stock in ${tankFarmShortTag(tank)}`} onHand={tank.volume} dailyUse={tank.dailyUse} leadTimeDays={tank.leadTimeDays} />
      <div className="flex flex-col gap-2 border-t border-default pt-3">
        <p className="text-xs font-medium text-muted-foreground">Stock after planned calls</p>
        {steps.length === 0 ? (
          <p className="text-sm text-muted-foreground">No calls planned for this tank in the next five days.</p>
        ) : (
          <ol className="flex flex-col gap-2">
            {steps.map(({ movement, after }) => {
              const percent = fillPercent(after, tank.capacity);
              const outside = percent < tank.minPercent || percent > tank.maxPercent;
              return (
                <li key={movement.id} className={`flex flex-wrap items-baseline justify-between gap-x-3 rounded-md text-sm ${movement.id === selectedMovementId ? 'font-semibold' : ''}`}>
                  <span className="min-w-0 text-base-foreground">
                    {movement.name} <span className="text-xs font-normal tabular-nums text-muted-foreground">{tankFarmSigned(movement.direction, movement.volume)} m³</span>
                  </span>
                  <ValueReadout size="xs" value={after} unit={`m³ · ${formatValue(percent, 0)}%`} tone={outside ? 'warning' : 'neutral'} />
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </DashboardPanel>
  );
}

/** Custody transfers already measured: what left and entered which tank. */
function TankFarmLedgerPanel({ selectedTankId }: { selectedTankId: string | null }) {
  return (
    <DashboardPanel title="Movements ledger" description="Measured transfers, newest first">
      <table className="w-full table-fixed text-left text-sm">
        <thead>
          <tr className="text-xs text-muted-foreground">
            <th scope="col" className="w-28 pb-2 pr-3 font-medium">
              Ticket
            </th>
            <th scope="col" className="pb-2 pr-3 font-medium">
              Carrier
            </th>
            <th scope="col" className="w-32 pb-2 pr-3 font-medium">
              Tank
            </th>
            <th scope="col" className="w-24 pb-2 pr-3 text-right font-medium">
              Volume, m³
            </th>
            <th scope="col" className="w-28 pb-2 font-medium">
              State
            </th>
          </tr>
        </thead>
        <tbody>
          {TANK_FARM_LEDGER.map((entry) => {
            const related = selectedTankId === null || entry.tankId === selectedTankId;
            const marked = selectedTankId !== null && related;
            return (
              <tr key={entry.id} aria-current={marked ? 'true' : undefined} className={`border-t border-default align-top ${related ? '' : 'opacity-50'} ${marked ? 'bg-card-background-hover' : ''}`}>
                <td className={`border-l-2 py-2 pl-2 pr-3 ${marked ? 'border-l-base-foreground' : 'border-l-transparent'}`}>
                  <p className="font-mono text-xs text-base-foreground">{entry.id}</p>
                  <p className="text-xs tabular-nums text-muted-foreground">{formatDateTime(entry.at)}</p>
                </td>
                <td className="py-2 pr-3 text-base-foreground">{entry.counterparty}</td>
                <td className="py-2 pr-3 font-mono text-xs text-medium-foreground">{tankFarmShortTag(tankFarmTank(entry.tankId))}</td>
                <td className="py-2 pr-3 text-right tabular-nums text-base-foreground">{tankFarmSigned(entry.direction, entry.volume)}</td>
                <td className="py-2">
                  <StatusIndicator size="sm" tone={entry.done ? 'neutral' : 'info'} shape={entry.done ? 'dot' : 'ring'} label={entry.done ? 'Measured' : 'Loading'} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </DashboardPanel>
  );
}

function TankFarmThroughputPanel() {
  return (
    <DashboardPanel title="Throughput" description="Volume moved per product, last seven days">
      <ShareBarList label="Volume moved per product, last seven days" items={TANK_FARM_THROUGHPUT} unit="m³" showShare />
    </DashboardPanel>
  );
}

/*
 * Archetype: diagram-first — the tank farm drawn as a row of vessels, with the plan and the
 * books hanging under it.
 * Dominant element: the row of tank graphics with real fill levels and min/max marks.
 * Interaction: selecting a tank outlines it, highlights its calls in the schedule and its
 * ledger lines, and turns the cover panel into that tank's days of cover and projected stock;
 * selecting a call in the schedule selects its tank and marks the call.
 */
function TankFarmDashboard() {
  const [tankId, setTankId] = useState<string | null>('t-103');
  const [movementId, setMovementId] = useState<string | null>(null);

  const selectTank = (next: string) => {
    setTankId((current) => (current === next ? null : next));
    setMovementId(null);
  };
  const selectMovement = (next: string) => {
    const movement = TANK_FARM_MOVEMENTS.find((candidate) => candidate.id === next);
    if (!movement) return;
    setMovementId((current) => (current === next ? null : next));
    setTankId(movement.tankId);
  };

  return (
    <DashboardFrame
      title="Tank farm and logistics"
      subtitle="Stord terminal · five tanks, two jetties, one truck rack · updated 14:00 UTC"
      status={<StatusIndicator tone="warning" shape="square" label="Glycol below minimum" detail="cargo due Friday" />}
      actions={
        tankId === null ? null : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setTankId(null);
              setMovementId(null);
            }}
          >
            Show all tanks
          </Button>
        )
      }
    >
      <div className="flex flex-col gap-4">
        <TankFarmTanksPanel selectedTankId={tankId} onSelectTank={selectTank} />
        <DashboardGrid>
          <DashboardCell span={8}>
            <TankFarmSchedulePanel selectedTankId={tankId} selectedMovementId={movementId} onSelectMovement={selectMovement} />
          </DashboardCell>
          <DashboardCell span={4}>
            <div className="flex flex-col gap-4 [&>*]:flex-1">
              <TankFarmCoverPanel selectedTankId={tankId} selectedMovementId={movementId} />
              <TankFarmThroughputPanel />
            </div>
          </DashboardCell>
          <DashboardCell span={12}>
            <TankFarmLedgerPanel selectedTankId={tankId} />
          </DashboardCell>
        </DashboardGrid>
      </div>
    </DashboardFrame>
  );
}

function TankFarmDashSignature() {
  return (
    <ThemeScope preset="sandstone" className="w-full">
      <TankFarmDashboard />
    </ThemeScope>
  );
}

function TankFarmDashAura() {
  return (
    <ThemeScope preset="aura" className="w-full">
      <TankFarmDashboard />
    </ThemeScope>
  );
}

function TankFarmDashBlueprint() {
  return (
    <ThemeScope preset="blueprint" className="w-full">
      <TankFarmDashboard />
    </ThemeScope>
  );
}

function TankFarmDashNordicNight() {
  return (
    <ThemeScope preset="nordic-night" className="w-full">
      <TankFarmDashboard />
    </ThemeScope>
  );
}

function TankFarmDashTanks() {
  const [tankId, setTankId] = useState<string | null>(null);
  return <TankFarmTanksPanel selectedTankId={tankId} onSelectTank={(next) => setTankId((current) => (current === next ? null : next))} />;
}

function TankFarmDashSchedule() {
  const [movementId, setMovementId] = useState<string | null>('mv-0321');
  return <TankFarmSchedulePanel selectedTankId={null} selectedMovementId={movementId} onSelectMovement={(next) => setMovementId((current) => (current === next ? null : next))} />;
}

function TankFarmDashScheduleFiltered() {
  const [movementId, setMovementId] = useState<string | null>(null);
  return <TankFarmSchedulePanel selectedTankId="t-101" selectedMovementId={movementId} onSelectMovement={(next) => setMovementId((current) => (current === next ? null : next))} />;
}

function TankFarmDashCoverAll() {
  return <TankFarmCoverPanel selectedTankId={null} selectedMovementId={null} />;
}

function TankFarmDashCoverTank() {
  return <TankFarmCoverPanel selectedTankId="t-103" selectedMovementId="mv-0321" />;
}

function TankFarmDashThroughput() {
  return <TankFarmThroughputPanel />;
}

function TankFarmDashLedger() {
  return <TankFarmLedgerPanel selectedTankId={null} />;
}

function TankFarmDashLedgerTank() {
  return <TankFarmLedgerPanel selectedTankId="t-103" />;
}

export default definePage({
  id: 'tank-farm-logistics',
  title: 'Tank farm and logistics',
  summary:
    'What is in every tank, what is coming alongside and what has already been measured out. The tanks are drawn, because how full is a question people answer by looking; the plan and the ledger sit under the picture.',
  guidance: {
    use: [
      'For terminals, tank farms and stores where level against a band is the first question.',
      'When stock and logistics belong together: a tank, its cargoes and its ledger lines.',
      'Let one selection run through every panel, so the screen answers one tank at a time.',
      'Mark minimum and maximum on the drawing; the band is what makes a level good or bad.',
    ],
    avoid: [
      'Drawing more than six or seven vessels in a row — group them or switch to a table.',
      'Colouring every tank; only a tank outside its band takes a status colour.',
      'A schedule without a now line; nobody can tell planned from late.',
      'Hiding unrelated rows on selection — dim them, so the plan stays whole.',
    ],
  },
  source,
  sections: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description: 'Shown in the Sandstone theme. A diagram-first layout: the drawn tanks lead, and selecting one runs through the schedule, the cover and the ledger.',
      specimens: [
        {
          id: 'TankFarmDashSignature',
          title: 'Tank farm and logistics',
          note: 'Pick it when the physical picture of stock is the entry point to planning and bookkeeping.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'dashboards/DashboardFrame.tsx',
            'dashboards/DashboardGrid.tsx',
            'dashboards/DashboardPanel.tsx',
            'industrial/domains/DaysOfCover.tsx',
            'industrial/domains/ShareBarList.tsx',
            'industrial/domains/inventory.ts',
            'industrial/StatusIndicator.tsx',
            'industrial/ValueReadout.tsx',
            'themes/ThemeScope.tsx',
          ],
          Component: TankFarmDashSignature,
        },
      ],
    },
    {
      id: 'themes',
      title: 'In other themes',
      description: 'The same dashboard, unchanged, in three more presets.',
      specimens: [
        {
          id: 'TankFarmDashAura',
          title: 'Aura',
          note: 'Pick it when the terminal view lives inside a suite of standard Aura applications.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['themes/ThemeScope.tsx', 'themes/themes.css'],
          Component: TankFarmDashAura,
        },
        {
          id: 'TankFarmDashBlueprint',
          title: 'Blueprint',
          note: 'Pick it for engineering users: the drawn tanks suit sharp corners and blue line work.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['themes/ThemeScope.tsx', 'themes/themes.css'],
          Component: TankFarmDashBlueprint,
        },
        {
          id: 'TankFarmDashNordicNight',
          title: 'Nordic night',
          note: 'Pick it for the jetty office at night: dark, calm and low glare.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['themes/ThemeScope.tsx', 'themes/themes.css'],
          Component: TankFarmDashNordicNight,
        },
      ],
    },
    {
      id: 'panels',
      title: 'Panels',
      description: 'Each part on its own, with and without a tank selected.',
      specimens: [
        {
          id: 'TankFarmDashTanks',
          title: 'Tank row',
          note: 'Pick it as the lead element when up to six vessels should be compared by eye.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx', 'industrial/domains/inventory.ts', 'industrial/StatusIndicator.tsx'],
          Component: TankFarmDashTanks,
        },
        {
          id: 'TankFarmDashSchedule',
          title: 'Berth schedule',
          note: 'Pick it to show who is alongside when: one row per call, with a line for now.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx'],
          Component: TankFarmDashSchedule,
        },
        {
          id: 'TankFarmDashCoverAll',
          title: 'Cover, all tanks',
          note: 'Pick it when nothing is selected: every product ranked by how long it lasts.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx', 'industrial/domains/DaysOfCover.tsx'],
          Component: TankFarmDashCoverAll,
        },
        {
          id: 'TankFarmDashScheduleFiltered',
          title: 'Schedule for one tank',
          note: 'Pick it when a selection elsewhere should narrow the plan without removing the rest.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx'],
          Component: TankFarmDashScheduleFiltered,
        },
        {
          id: 'TankFarmDashCoverTank',
          title: 'Cover, one tank',
          note: 'Pick it to judge one product: cover against lead time, then stock after each planned call.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx', 'industrial/domains/DaysOfCover.tsx', 'industrial/ValueReadout.tsx'],
          Component: TankFarmDashCoverTank,
        },
        {
          id: 'TankFarmDashLedger',
          title: 'Movements ledger',
          note: 'Pick it for measured transfers: signed volumes, right-aligned, newest first.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx', 'industrial/StatusIndicator.tsx'],
          Component: TankFarmDashLedger,
        },
        {
          id: 'TankFarmDashThroughput',
          title: 'Throughput',
          note: 'Pick it to rank products by volume moved when exact figures matter as much as order.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx', 'industrial/domains/ShareBarList.tsx'],
          Component: TankFarmDashThroughput,
        },
        {
          id: 'TankFarmDashLedgerTank',
          title: 'Ledger for one tank',
          note: 'Pick it when the ledger follows a selection: matching lines are marked, the rest dimmed.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx', 'industrial/StatusIndicator.tsx'],
          Component: TankFarmDashLedgerTank,
        },
      ],
    },
  ],
});
