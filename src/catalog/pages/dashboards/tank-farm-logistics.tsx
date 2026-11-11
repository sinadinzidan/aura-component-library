import { IconAlertOctagon, IconAlertTriangle, IconArrowDown, IconArrowUp, IconMinus } from '@cognite/aura/icons';
import { useState } from 'react';

import { AppFrame, type AppFrameNavItem } from '../../../library/kit/AppFrame';
import { Bars } from '../../../library/kit/Bars';
import { Canvas } from '../../../library/kit/Canvas';
import { DataTable, type DataTableColumn } from '../../../library/kit/DataTable';
import { Grid } from '../../../library/kit/Grid';
import { Meter } from '../../../library/kit/Meter';
import { Panel } from '../../../library/kit/Panel';
import { StatusPill } from '../../../library/kit/StatusPill';
import { TagId } from '../../../library/kit/TagId';
import { formatNumber, type Tone } from '../../../library/kit/tones';
import { LookScope } from '../../../library/looks/LookScope';
import { HOUR, REFERENCE_NOW } from '../../data/series';
import { definePage } from '../../types';

import source from './tank-farm-logistics.tsx?raw';

type TflProduct = 'crude' | 'condensate' | 'diesel' | 'water';

type TflTank = {
  id: string;
  product: TflProduct;
  /** Shell capacity in m³. */
  capacity: number;
  /** Fill in percent of capacity. */
  level: number;
  /** m³ per hour; positive fills the tank. */
  rate: number;
  /** Drawn height in px and relative width: the crude tanks are the big ones. */
  height: number;
  weight: number;
  /** Crude sits under a floating roof; the others have a fixed dome. */
  roof: 'floating' | 'dome';
};

type TflMovement = {
  id: string;
  lane: string;
  label: string;
  detail: string;
  product: TflProduct;
  tanks: readonly string[];
  /** Hours from now. */
  start: number;
  end: number;
  volume: number;
  direction: 'in' | 'out';
};

const TFL_PRODUCTS: Record<TflProduct, { label: string; tone: Tone }> = {
  crude: { label: 'Crude oil', tone: 'pink' },
  condensate: { label: 'Condensate', tone: 'amber' },
  diesel: { label: 'Diesel', tone: 'blue' },
  water: { label: 'Slop water', tone: 'teal' },
};

const TFL_HIGH = 90;

const TFL_LOW = 10;

const TFL_TANKS: readonly TflTank[] = [
  { id: 'T-101', product: 'crude', capacity: 60000, level: 72, rate: 620, height: 250, weight: 1.35, roof: 'floating' },
  { id: 'T-102', product: 'crude', capacity: 60000, level: 41, rate: 0, height: 250, weight: 1.35, roof: 'floating' },
  { id: 'T-103', product: 'crude', capacity: 60000, level: 88, rate: 0, height: 250, weight: 1.35, roof: 'floating' },
  { id: 'T-104', product: 'crude', capacity: 60000, level: 24, rate: -1800, height: 250, weight: 1.35, roof: 'floating' },
  { id: 'T-201', product: 'condensate', capacity: 30000, level: 64, rate: -40, height: 214, weight: 1.1, roof: 'dome' },
  { id: 'T-202', product: 'condensate', capacity: 30000, level: 9, rate: 90, height: 214, weight: 1.1, roof: 'dome' },
  { id: 'T-301', product: 'diesel', capacity: 15000, level: 55, rate: -60, height: 168, weight: 1, roof: 'dome' },
  { id: 'T-401', product: 'water', capacity: 15000, level: 47, rate: 25, height: 168, weight: 1, roof: 'dome' },
];

const TFL_LANES = ['Jetty 1', 'Jetty 2', 'Crude line', 'Condensate line', 'Truck rack'];

const TFL_MOVEMENTS: readonly TflMovement[] = [
  { id: 'm1', lane: 'Jetty 1', label: 'Nordic Sky', detail: 'MT Nordic Sky loads crude', product: 'crude', tanks: ['T-104', 'T-103'], start: -10, end: 12, volume: 62000, direction: 'out' },
  { id: 'm2', lane: 'Jetty 1', label: 'Barents Star', detail: 'MT Barents Star loads crude', product: 'crude', tanks: ['T-103', 'T-101'], start: 40, end: 64, volume: 80000, direction: 'out' },
  { id: 'm3', lane: 'Jetty 2', label: 'Fjordgas', detail: 'MT Fjordgas loads condensate', product: 'condensate', tanks: ['T-201'], start: 18, end: 36, volume: 18000, direction: 'out' },
  { id: 'm4', lane: 'Jetty 2', label: 'Lofoten', detail: 'MT Lofoten discharges diesel', product: 'diesel', tanks: ['T-301'], start: 60, end: 76, volume: 6000, direction: 'in' },
  { id: 'm5', lane: 'Crude line', label: 'Into T-101', detail: 'Crude rundown from the plant', product: 'crude', tanks: ['T-101'], start: -12, end: 17, volume: 18000, direction: 'in' },
  { id: 'm6', lane: 'Crude line', label: 'Into T-102', detail: 'Crude rundown from the plant', product: 'crude', tanks: ['T-102'], start: 17, end: 66, volume: 30400, direction: 'in' },
  { id: 'm7', lane: 'Crude line', label: 'Into T-104', detail: 'Crude rundown from the plant', product: 'crude', tanks: ['T-104'], start: 66, end: 84, volume: 11200, direction: 'in' },
  { id: 'm8', lane: 'Condensate line', label: 'Into T-202', detail: 'Condensate rundown from the plant', product: 'condensate', tanks: ['T-202'], start: -12, end: 84, volume: 8600, direction: 'in' },
  { id: 'm9', lane: 'Truck rack', label: 'Diesel', detail: 'Diesel road tankers', product: 'diesel', tanks: ['T-301'], start: -8, end: 4, volume: 600, direction: 'out' },
  { id: 'm10', lane: 'Truck rack', label: 'Diesel', detail: 'Diesel road tankers', product: 'diesel', tanks: ['T-301'], start: 16, end: 28, volume: 600, direction: 'out' },
  { id: 'm11', lane: 'Truck rack', label: 'Water', detail: 'Produced water to disposal', product: 'water', tanks: ['T-401'], start: 30, end: 42, volume: 900, direction: 'out' },
  { id: 'm12', lane: 'Truck rack', label: 'Diesel', detail: 'Diesel road tankers', product: 'diesel', tanks: ['T-301'], start: 44, end: 56, volume: 600, direction: 'out' },
  { id: 'm13', lane: 'Truck rack', label: 'Diesel', detail: 'Diesel road tankers', product: 'diesel', tanks: ['T-301'], start: 64, end: 76, volume: 600, direction: 'out' },
];

const TFL_WINDOW = { start: -12, end: 84 };

const TFL_DAYS = [
  { at: -12, label: 'Thu 12' },
  { at: 10, label: 'Fri 13' },
  { at: 34, label: 'Sat 14' },
  { at: 58, label: 'Sun 15' },
  { at: 82, label: '' },
];

const TFL_STOCK = TFL_TANKS.reduce((sum, tank) => sum + (tank.capacity * tank.level) / 100, 0);

const TFL_CAPACITY = TFL_TANKS.reduce((sum, tank) => sum + tank.capacity, 0);

const TFL_NAV: AppFrameNavItem[] = [
  { id: 'tanks', label: 'Tanks' },
  { id: 'jetties', label: 'Jetties', badge: '1' },
  { id: 'lines', label: 'Pipelines' },
  { id: 'trucks', label: 'Truck rack' },
  { id: 'books', label: 'Stock books' },
];

const TFL_WHEN = new Intl.DateTimeFormat('en-GB', { weekday: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });

/** "Fri 07:00" for a number of hours from now. */
function tflWhen(hours: number): string {
  return TFL_WHEN.format(REFERENCE_NOW + hours * HOUR).replace(',', '');
}

function tflFind(id: string): TflTank {
  return TFL_TANKS.find((tank) => tank.id === id) ?? TFL_TANKS[0];
}

function tflStock(tank: TflTank): number {
  return (tank.capacity * tank.level) / 100;
}

/** Room left before the high-high alarm, in m³. */
function tflUllage(tank: TflTank): number {
  return Math.max(0, (tank.capacity * (TFL_HIGH - tank.level)) / 100);
}

/** Stock above the low-low alarm: what the pumps can actually take, in m³. */
function tflPumpable(tank: TflTank): number {
  return Math.max(0, (tank.capacity * (tank.level - TFL_LOW)) / 100);
}

function tflAlarm(tank: TflTank): { word: string; tone: Tone } | null {
  if (tank.level < TFL_LOW) return { word: 'Low low', tone: 'critical' };
  if (tank.level >= TFL_HIGH - 3) return { word: 'High', tone: 'warning' };
  return null;
}

/** What happens next at the current rate, as a sentence. */
function tflOutlook(tank: TflTank): string {
  if (tank.rate > 0) {
    const hours = Math.round(tflUllage(tank) / tank.rate);
    return `Reaches high-high in ${hours} h, ${tflWhen(hours)}`;
  }
  if (tank.rate < 0) {
    const hours = Math.round(tflPumpable(tank) / -tank.rate);
    return `Reaches low-low in ${hours} h, ${tflWhen(hours)}`;
  }
  return 'Static: no movement lined up on this tank now';
}

function TflRate({ rate }: { rate: number }) {
  return (
    <span className="flex items-center gap-1 text-sm font-bold whitespace-nowrap tabular-nums [&>svg]:size-4">
      {rate > 0 ? <IconArrowUp aria-hidden="true" stroke={3} /> : rate < 0 ? <IconArrowDown aria-hidden="true" stroke={3} /> : <IconMinus aria-hidden="true" stroke={3} />}
      {rate === 0 ? 'Static' : `${formatNumber(Math.abs(rate))} m³/h`}
    </span>
  );
}

/** One tank as a filled silhouette. The numeral sits in the liquid when there is room for it. */
function TflTankFigure({ tank, selected = false, onSelect, height }: { tank: TflTank; selected?: boolean; onSelect?: (id: string) => void; height?: number }) {
  const product = TFL_PRODUCTS[tank.product];
  const alarm = tflAlarm(tank);
  const inside = tank.level >= 45;
  const bodyHeight = height ?? tank.height;
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={`${tank.id}, ${product.label}, ${tank.level} percent full`}
      onClick={() => onSelect?.(tank.id)}
      data-tone={product.tone}
      style={{ flexGrow: tank.weight }}
      className="group flex min-w-0 basis-0 cursor-pointer flex-col text-left text-[var(--kit-text)] outline-none"
    >
      <span className="mb-2 flex h-7 items-center justify-center">
        {alarm ? (
          <StatusPill tone={alarm.tone} icon={alarm.tone === 'critical' ? <IconAlertOctagon /> : <IconAlertTriangle />}>
            {alarm.word}
          </StatusPill>
        ) : (
          <TflRate rate={tank.rate} />
        )}
      </span>
      <span
        className={`flex flex-col transition-transform group-focus-visible:-translate-y-1 ${selected ? '-translate-y-2 drop-shadow-[7px_7px_0_var(--kit-text)]' : 'group-hover:-translate-y-1'}`}
      >
        {tank.roof === 'dome' ? <span className="h-6 rounded-t-[50%_100%] border-2 border-b-0 border-[var(--kit-rule-strong)] bg-[var(--kit-surface)]" /> : <span className="h-6" />}
        <span className="relative block overflow-hidden border-2 border-[var(--kit-rule-strong)] bg-[var(--kit-surface)]" style={{ height: bodyHeight }}>
          <span className="absolute inset-x-0 bottom-0 border-t-[6px] border-[var(--kit-rule-strong)] bg-[var(--t-pop)]" style={{ height: `${tank.level}%` }} />
          <span className="absolute inset-x-0 border-t-2 border-dashed border-[var(--kit-rule-strong)]" style={{ bottom: `${TFL_HIGH}%` }} />
          <span className="absolute inset-x-0 border-t-2 border-dashed border-[var(--kit-rule-strong)]" style={{ bottom: `${TFL_LOW}%` }} />
          <span
            className={`absolute inset-x-0 flex items-baseline justify-center gap-0.5 leading-none font-extrabold tracking-tighter tabular-nums ${inside ? 'text-[var(--t-on-pop)]' : ''}`}
            style={inside ? { top: `calc(${100 - tank.level}% + 20px)` } : { bottom: `calc(${tank.level}% + 14px)` }}
          >
            <span className={tank.weight > 1.2 ? 'text-6xl' : 'text-5xl'}>{tank.level}</span>
            <span className="text-lg">%</span>
          </span>
        </span>
      </span>
      <span className="h-1.5 bg-[var(--kit-rule-strong)]" />
      <span className={`mt-3 self-start py-0.5 text-base font-extrabold tabular-nums ${selected ? 'bg-[var(--kit-text)] px-1.5 text-[var(--kit-surface)]' : ''}`}>{tank.id}</span>
      <span className="mt-1 text-sm font-semibold whitespace-nowrap">{product.label}</span>
      <span className="text-sm whitespace-nowrap tabular-nums">{formatNumber(tflStock(tank))} m³</span>
    </button>
  );
}

function TflTankRow({ selected, onSelect }: { selected: string; onSelect: (id: string) => void }) {
  return (
    <div className="flex items-end gap-4">
      {TFL_TANKS.map((tank) => (
        <TflTankFigure key={tank.id} tank={tank} selected={tank.id === selected} onSelect={onSelect} />
      ))}
    </div>
  );
}

function TflProductKey() {
  return (
    <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold">
      {(['crude', 'condensate', 'diesel', 'water'] as const).map((id) => {
        const stock = TFL_TANKS.filter((tank) => tank.product === id).reduce((sum, tank) => sum + tflStock(tank), 0);
        return (
          <li key={id} data-tone={TFL_PRODUCTS[id].tone} className="flex items-center gap-2">
            <span className="size-4 border-2 border-[var(--kit-rule-strong)] bg-[var(--t-pop)]" />
            {TFL_PRODUCTS[id].label}
            <span className="tabular-nums">{formatNumber(stock)} m³</span>
          </li>
        );
      })}
      <li className="flex items-center gap-2">
        <span className="w-6 border-t-2 border-dashed border-[var(--kit-rule-strong)]" />
        High-high 90 % and low-low 10 %
      </li>
    </ul>
  );
}

function tflPosition(hours: number): number {
  return ((hours - TFL_WINDOW.start) / (TFL_WINDOW.end - TFL_WINDOW.start)) * 100;
}

/** Four days of movements by berth and line. Blocks that touch the selected tank are filled. */
function TflTimeline({ selected }: { selected: string }) {
  return (
    <div role="img" aria-label={`Movements for the next four days; those on ${selected} are filled`} className="grid grid-cols-[7.5rem_minmax(0,1fr)] text-sm">
      <span />
      <div className="relative h-8 border-b-2 border-[var(--kit-rule-strong)]">
        {TFL_DAYS.filter((day) => day.label).map((day) => (
          <span key={day.at} className="absolute top-0 pl-2 font-bold" style={{ left: `${tflPosition(day.at)}%` }}>
            {day.label}
          </span>
        ))}
      </div>
      {TFL_LANES.map((lane) => (
        <div key={lane} className="col-span-2 grid grid-cols-subgrid border-b-2 border-[var(--kit-rule-strong)] last:border-b-0">
          <span className="flex items-center font-bold">{lane}</span>
          <div className="relative h-12">
            {TFL_DAYS.slice(1).map((day) => (
              <span key={day.at} className="absolute inset-y-0 border-l-2 border-dotted border-[var(--kit-rule-strong)] opacity-40" style={{ left: `${tflPosition(day.at)}%` }} />
            ))}
            {TFL_MOVEMENTS.filter((movement) => movement.lane === lane).map((movement) => {
              const related = movement.tanks.includes(selected);
              return (
                <span
                  key={movement.id}
                  data-tone={TFL_PRODUCTS[movement.product].tone}
                  title={`${movement.detail}, ${formatNumber(movement.volume)} m³, ${tflWhen(movement.start)} to ${tflWhen(movement.end)}`}
                  className={`absolute inset-y-2 z-10 flex items-center overflow-hidden border-2 border-[var(--kit-rule-strong)] px-1.5 text-[0.8125rem] font-bold whitespace-nowrap ${
                    related ? 'bg-[var(--t-pop)] text-[var(--t-on-pop)] shadow-[3px_3px_0_var(--kit-text)]' : 'bg-[var(--kit-surface)]'
                  }`}
                  style={{ left: `${tflPosition(movement.start)}%`, width: `${tflPosition(movement.end) - tflPosition(movement.start)}%` }}
                >
                  {movement.label}
                </span>
              );
            })}
          </div>
        </div>
      ))}
      <span />
      <div className="relative h-0">
        <span className="absolute bottom-0 w-0.5 bg-[var(--kit-line-critical)]" style={{ left: `${tflPosition(0)}%`, height: `${TFL_LANES.length * 50 + 8}px` }} />
        <span
          className="absolute top-0 z-10 -translate-x-1/2 bg-[var(--kit-line-critical)] px-1.5 text-xs font-bold text-[var(--kit-surface)]"
          style={{ left: `${tflPosition(0)}%` }}
        >
          Now
        </span>
      </div>
    </div>
  );
}

/** The selected tank as one solid block: room left, what is pumpable, what comes next. */
function TflUllage({ tank }: { tank: TflTank }) {
  const product = TFL_PRODUCTS[tank.product];
  const next = TFL_MOVEMENTS.filter((movement) => movement.tanks.includes(tank.id) && movement.end > 0).slice(0, 2);
  const heel = TFL_LOW;
  const stock = Math.max(0, tank.level - TFL_LOW);
  const room = Math.max(0, TFL_HIGH - Math.max(tank.level, TFL_LOW));
  return (
    <section
      aria-label={`Ullage of ${tank.id}`}
      data-tone={product.tone}
      className="flex h-full flex-col gap-4 border-2 border-[var(--kit-rule-strong)] bg-[var(--t-pop)] p-5 text-[var(--t-on-pop)] shadow-[5px_5px_0_var(--kit-text)]"
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-extrabold">
          {tank.id} · {product.label}
        </h3>
        <TflRate rate={tank.rate} />
      </div>
      <div>
        <p className="text-7xl leading-none font-extrabold tracking-tighter tabular-nums">{formatNumber(tflUllage(tank))}</p>
        <p className="mt-1 text-base font-bold">m³ of ullage to high-high</p>
      </div>
      <div>
        <div className="flex h-7 border-2 border-[var(--t-on-pop)]" aria-hidden="true">
          <span className="bg-[var(--t-on-pop)] opacity-45" style={{ width: `${heel}%` }} />
          <span className="bg-[var(--t-on-pop)]" style={{ width: `${stock}%` }} />
          <span className="bg-[var(--mountain-white)]" style={{ width: `${room}%` }} />
        </div>
        <p className="mt-1.5 flex justify-between text-sm font-semibold tabular-nums">
          <span>Pumpable {formatNumber(tflPumpable(tank))}</span>
          <span>Shell {formatNumber(tank.capacity)}</span>
        </p>
      </div>
      <p className="text-base font-bold">{tflOutlook(tank)}.</p>
      <ul className="mt-auto border-t-2 border-[var(--t-on-pop)] text-sm font-semibold">
        {next.length === 0 ? <li className="py-2">Nothing scheduled in the next four days.</li> : null}
        {next.map((movement) => (
          <li key={movement.id} className="flex items-baseline justify-between gap-3 border-b-2 border-[var(--t-on-pop)] py-2 last:border-b-0">
            <span>
              {movement.detail}, {formatNumber(movement.volume)} m³ {movement.direction === 'in' ? 'in' : 'out'}
            </span>
            <span className="whitespace-nowrap tabular-nums">{movement.start <= 0 ? `until ${tflWhen(movement.end)}` : tflWhen(movement.start)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function TflMovementSummary({ tank }: { tank: TflTank }) {
  const touching = TFL_MOVEMENTS.filter((movement) => movement.tanks.includes(tank.id));
  const volume = (direction: TflMovement['direction']) => touching.filter((movement) => movement.direction === direction).reduce((sum, movement) => sum + movement.volume, 0);
  return (
    <p className="tabular-nums">
      {touching.length} {touching.length === 1 ? 'movement touches' : 'movements touch'} {tank.id}: {formatNumber(volume('in'))} m³ in, {formatNumber(volume('out'))} m³ out.
    </p>
  );
}

function TflMasthead({ current }: { current: string }) {
  return (
    <nav aria-label="Nordkapp terminal" className="flex items-stretch bg-[var(--kit-text)] text-[var(--kit-surface)]">
      <span className="flex items-center px-5 text-base font-extrabold">Nordkapp terminal</span>
      <ul className="flex">
        {TFL_NAV.map((item) => (
          <li key={item.id}>
            <span
              aria-current={item.id === current ? 'page' : undefined}
              className={`flex h-12 items-center gap-2 px-4 text-sm font-bold ${item.id === current ? 'bg-[var(--kit-surface)] text-[var(--kit-text)]' : ''}`}
            >
              {item.label}
              {item.badge ? <span className="bg-[var(--kit-line-pink)] px-1.5 text-[var(--kit-text)]">{item.badge}</span> : null}
            </span>
          </li>
        ))}
      </ul>
      <span className="ml-auto flex items-center px-5 text-sm font-bold tabular-nums">Thu 12 March · 14:00 UTC</span>
    </nav>
  );
}

function TankFarmLogisticsSignature() {
  const [selected, setSelected] = useState('T-101');
  const tank = tflFind(selected);
  return (
    <LookScope look="poster">
      <TflMasthead current="tanks" />
      <Canvas className="flex min-h-[760px] flex-col gap-7">
        <header className="flex flex-col gap-4">
          <h2 className="text-6xl leading-[0.95] font-extrabold tracking-tighter text-[var(--kit-text)]">
            {Math.round((TFL_STOCK / TFL_CAPACITY) * 100)} % full. Two ships load before Sunday.
          </h2>
          <p className="max-w-4xl text-base font-semibold text-[var(--kit-text)]">
            {formatNumber(TFL_STOCK)} m³ in eight tanks. T-103 sits 2 % under its high alarm until Barents Star arrives, and T-202 is below low-low with rundown refilling it.
          </p>
          <TflProductKey />
        </header>

        <TflTankRow selected={selected} onSelect={setSelected} />

        <div className="grid grid-cols-12 gap-5">
          <div className="col-span-4">
            <TflUllage tank={tank} />
          </div>
          <Panel
            className="col-span-8"
            title={`Movements on ${tank.id}`}
            subtitle="Next four days by berth and line; filled blocks touch this tank"
            footer={<TflMovementSummary tank={tank} />}
          >
            <div className="flex flex-1 flex-col justify-center pb-3">
              <TflTimeline selected={selected} />
            </div>
          </Panel>
        </div>
      </Canvas>
    </LookScope>
  );
}

const TFL_T103_WEEK = [61, 66, 71, 75, 79, 84, 88];

const TFL_T103_DAYS = ['Fri 6', 'Sat 7', 'Sun 8', 'Mon 9', 'Tue 10', 'Wed 11', 'Thu 12'];

type TflLedgerRow = { id: string; when: string; movement: string; direction: 'in' | 'out'; volume: number; after: number };

const TFL_LEDGER: readonly TflLedgerRow[] = [
  { id: 'l1', when: 'Thu 12, 06:10', movement: 'Topped up for Nordic Sky second parcel', direction: 'in', volume: 2400, after: 88 },
  { id: 'l2', when: 'Wed 11, 02:00', movement: 'Plant rundown, crude line', direction: 'in', volume: 14900, after: 84 },
  { id: 'l3', when: 'Mon 9, 18:30', movement: 'Plant rundown, crude line', direction: 'in', volume: 14200, after: 75 },
  { id: 'l4', when: 'Sat 7, 11:00', movement: 'Water draw-off to T-401', direction: 'out', volume: 310, after: 66 },
  { id: 'l5', when: 'Fri 6, 04:45', movement: 'MT Hammerfest lifted crude, jetty 1', direction: 'out', volume: 21800, after: 61 },
];

const TFL_LEDGER_COLUMNS: DataTableColumn<TflLedgerRow>[] = [
  { id: 'when', header: 'When', nowrap: true, cell: (row) => row.when },
  { id: 'movement', header: 'Movement', cell: (row) => row.movement },
  { id: 'direction', header: 'Direction', nowrap: true, cell: (row) => <StatusPill tone={row.direction === 'in' ? 'pink' : 'neutral'}>{row.direction === 'in' ? 'Received' : 'Shipped'}</StatusPill> },
  { id: 'volume', header: 'Volume, m³', numeric: true, cell: (row) => formatNumber(row.volume) },
  { id: 'after', header: 'Level after', numeric: true, cell: (row) => `${row.after} %` },
];

const TFL_MARKS = [
  { at: 95, label: 'Overfill 95 %' },
  { at: TFL_HIGH, label: 'High-high 90 %' },
  { at: 85, label: 'High 85 %' },
  { at: 20, label: 'Low 20 %' },
  { at: TFL_LOW, label: 'Low-low 10 %' },
];

/** One tank drawn large with its alarm ladder: the gauge an operator reads before lining up. */
function TflGaugeTank({ tank }: { tank: TflTank }) {
  const product = TFL_PRODUCTS[tank.product];
  return (
    <div data-tone={product.tone} className="grid h-full min-h-[420px] grid-cols-[minmax(0,1fr)_7.75rem] gap-3 text-[var(--kit-text)]" role="img" aria-label={`${tank.id} at ${tank.level} percent with its alarm levels`}>
      <div className="@container relative border-2 border-[var(--kit-rule-strong)] bg-[var(--kit-surface)]">
        <span className="absolute inset-x-0 bottom-0 border-t-[8px] border-[var(--kit-rule-strong)] bg-[var(--t-pop)]" style={{ height: `${tank.level}%` }} />
        <span className="absolute inset-x-0 flex flex-col items-center gap-2 text-[var(--t-on-pop)]" style={{ top: `calc(${100 - tank.level}% + 28px)` }}>
          <span className="flex items-baseline leading-none font-extrabold tracking-tighter tabular-nums">
            <span className="text-[length:min(6rem,44cqw)]">{tank.level}</span>
            <span className="text-[length:min(1.875rem,15cqw)]">%</span>
          </span>
          <span className="bg-[var(--t-pop)] px-1 text-center text-sm font-bold tabular-nums">{formatNumber(tflStock(tank))} m³</span>
        </span>
        {TFL_MARKS.map((mark) => (
          <span key={mark.at} className="absolute inset-x-0 border-t-2 border-dashed border-[var(--kit-rule-strong)]" style={{ bottom: `${mark.at}%` }} />
        ))}
      </div>
      <div className="relative text-sm font-bold">
        {TFL_MARKS.map((mark) => (
          <span key={mark.at} className="absolute left-0 translate-y-1/2 whitespace-nowrap" style={{ bottom: `${mark.at === 95 ? 97.5 : mark.at === 85 ? 82.5 : mark.at === 20 ? 21.5 : mark.at === TFL_LOW ? 6.5 : mark.at}%` }}>
            {mark.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function TankFarmLogisticsTankSheet() {
  const tank = tflFind('T-103');
  return (
    <LookScope look="poster">
      <AppFrame
        variant="masthead"
        brand={{ name: 'Nordkapp terminal' }}
        nav={TFL_NAV}
        current="tanks"
        title="T-103 is 2 % under its high alarm."
        subtitle="Crude oil, 60,000 m³ floating roof. It has been filling for a week and waits for MT Barents Star on Saturday 06:00."
      >
        <Grid>
          <Panel className="col-span-4 row-span-2" title="Gauge" subtitle="Radar level, 14:00 UTC" tone="pink">
            <TflGaugeTank tank={tank} />
          </Panel>
          <Panel className="col-span-8" title="Seven days of filling" subtitle="Level at midnight, percent of capacity">
            <Bars
              label="Level of T-103 at midnight for the last seven days against the high-high alarm"
              categories={TFL_T103_DAYS}
              series={[{ id: 'level', label: 'Level', values: TFL_T103_WEEK, tone: 'pink' }]}
              tones={['pink', 'pink', 'pink', 'pink', 'pink', 'pink', 'warning']}
              unit="%"
              showValues
              height={230}
              limit={{ value: TFL_HIGH, label: 'High-high', tone: 'accent' }}
            />
          </Panel>
          <Panel className="col-span-8" title="Ledger" subtitle="Last five movements on this tank" padding="none">
            <DataTable label="Movements on T-103" flush columns={TFL_LEDGER_COLUMNS} rows={TFL_LEDGER} rowKey={(row) => row.id} />
          </Panel>
        </Grid>
      </AppFrame>
    </LookScope>
  );
}

type TflBerth = { id: string; ship: string; cargo: string; product: TflProduct; loaded: number; total: number; completes: string; laytime: { used: number; allowed: number }; from: string };

const TFL_BERTHS: readonly TflBerth[] = [
  { id: 'Jetty 1', ship: 'Nordic Sky', cargo: 'Loading crude oil', product: 'crude', loaded: 27600, total: 62000, completes: 'Fri 00:00', laytime: { used: 14, allowed: 36 }, from: 'T-104' },
  { id: 'Jetty 2', ship: 'Fjordgas', cargo: 'Due for condensate', product: 'condensate', loaded: 0, total: 18000, completes: 'Sat 00:00', laytime: { used: 0, allowed: 24 }, from: 'T-201' },
];

/** A tanker in profile; cargo tanks fill from the bow as the parcel goes aboard. */
function TflShip({ share }: { share: number }) {
  const tanks = 6;
  return (
    <svg viewBox="0 0 420 120" aria-hidden="true" className="w-full">
      <path d="M 8 62 L 412 62 L 392 108 L 34 108 Z" fill="var(--t-on-pop)" />
      <rect x="318" y="14" width="58" height="48" fill="var(--kit-surface)" stroke="var(--t-on-pop)" strokeWidth="4" />
      <rect x="338" y="0" width="16" height="16" fill="var(--t-on-pop)" />
      <line x1="326" y1="32" x2="368" y2="32" stroke="var(--t-on-pop)" strokeWidth="4" />
      {Array.from({ length: tanks }, (_, index) => (
        <rect
          key={index}
          x={40 + index * 45}
          y="34"
          width="38"
          height="28"
          fill={index < Math.round(share * tanks) ? 'var(--t-on-pop)' : 'var(--kit-surface)'}
          stroke="var(--t-on-pop)"
          strokeWidth="4"
        />
      ))}
    </svg>
  );
}

function TflBerthBlock({ berth }: { berth: TflBerth }) {
  const share = berth.loaded / berth.total;
  return (
    <section
      aria-label={`${berth.id}: ${berth.ship}`}
      data-tone={TFL_PRODUCTS[berth.product].tone}
      className="flex h-full flex-col gap-4 border-2 border-[var(--kit-rule-strong)] bg-[var(--t-pop)] p-6 text-[var(--t-on-pop)] shadow-[5px_5px_0_var(--kit-text)]"
    >
      <div className="flex items-baseline justify-between gap-3 text-base font-bold">
        <span>{berth.id}</span>
        <span>{berth.cargo}</span>
      </div>
      <h3 className="text-6xl leading-none font-extrabold tracking-tighter">{berth.ship}</h3>
      <TflShip share={share} />
      <div className="flex items-end justify-between gap-4">
        <p>
          <span className="text-5xl leading-none font-extrabold tracking-tighter tabular-nums">{Math.round(share * 100)} %</span>
          <span className="mt-1 block text-sm font-bold tabular-nums">
            {formatNumber(berth.loaded)} of {formatNumber(berth.total)} m³ from {berth.from}
          </span>
        </p>
        <p className="text-right text-sm font-bold">
          Completes
          <span className="block text-2xl font-extrabold tabular-nums">{berth.completes}</span>
        </p>
      </div>
      <p className="mt-auto border-t-2 border-[var(--t-on-pop)] pt-3 text-sm font-bold tabular-nums">
        Laytime {berth.laytime.used} of {berth.laytime.allowed} h used
      </p>
    </section>
  );
}

type TflArrival = { id: string; ship: string; cargo: string; berth: string; eta: string; state: string; tone: Tone };

const TFL_ARRIVALS: readonly TflArrival[] = [
  { id: 'a1', ship: 'MT Fjordgas', cargo: '18,000 m³ condensate out', berth: 'Jetty 2', eta: 'Fri 08:00', state: 'Pilot booked', tone: 'success' },
  { id: 'a2', ship: 'MT Barents Star', cargo: '80,000 m³ crude out', berth: 'Jetty 1', eta: 'Sat 06:00', state: 'On passage', tone: 'info' },
  { id: 'a3', ship: 'MT Lofoten', cargo: '6,000 m³ diesel in', berth: 'Jetty 2', eta: 'Sun 02:00', state: 'Weather watch', tone: 'warning' },
];

const TFL_ARRIVAL_COLUMNS: DataTableColumn<TflArrival>[] = [
  { id: 'ship', header: 'Ship', nowrap: true, cell: (row) => row.ship },
  { id: 'cargo', header: 'Parcel', cell: (row) => row.cargo },
  { id: 'berth', header: 'Berth', nowrap: true, cell: (row) => row.berth },
  { id: 'eta', header: 'Arrives', nowrap: true, numeric: true, cell: (row) => row.eta },
  { id: 'state', header: 'State', nowrap: true, cell: (row) => <StatusPill tone={row.tone}>{row.state}</StatusPill> },
];

function TankFarmLogisticsJetties() {
  return (
    <LookScope look="poster">
      <TflMasthead current="jetties" />
      <Canvas>
        <Grid>
          {TFL_BERTHS.map((berth) => (
            <div key={berth.id} className="col-span-6">
              <TflBerthBlock berth={berth} />
            </div>
          ))}
          <Panel className="col-span-8" title="Next alongside" subtitle="Three arrivals in the next four days" padding="none">
            <DataTable label="Arrivals" flush columns={TFL_ARRIVAL_COLUMNS} rows={TFL_ARRIVALS} rowKey={(row) => row.id} />
          </Panel>
          <Panel className="col-span-4" title="Mooring limits" subtitle="Loading stops above the marks" tone="teal">
            <div className="flex flex-1 flex-col justify-between gap-5">
              <Meter label="Wind at the jetty head" value={10.4} max={25} unit="m/s" decimals={1} high={15} target={{ value: 15, label: 'Stop' }} tone="teal" />
              <Meter label="Swell" value={0.8} max={3} unit="m" decimals={1} high={1.5} target={{ value: 1.5, label: 'Stop' }} tone="teal" />
            </div>
          </Panel>
        </Grid>
      </Canvas>
    </LookScope>
  );
}

function TankFarmLogisticsPartTanks() {
  const [selected, setSelected] = useState('T-202');
  return (
    <LookScope look="poster">
      <Canvas>
        <div className="flex items-end gap-5">
          {['T-101', 'T-202', 'T-301'].map((id) => (
            <TflTankFigure key={id} tank={tflFind(id)} selected={id === selected} onSelect={setSelected} />
          ))}
        </div>
      </Canvas>
    </LookScope>
  );
}

function TankFarmLogisticsPartUllage() {
  return (
    <LookScope look="poster">
      <Canvas>
        <TflUllage tank={tflFind('T-104')} />
      </Canvas>
    </LookScope>
  );
}

function TankFarmLogisticsPartTimeline() {
  return (
    <LookScope look="poster">
      <Canvas>
        <Panel title="Movements on T-301" subtitle="Next four days by berth and line; filled blocks touch this tank">
          <TflTimeline selected="T-301" />
        </Panel>
      </Canvas>
    </LookScope>
  );
}

function TankFarmLogisticsPartBerth() {
  return (
    <LookScope look="poster">
      <Canvas>
        <TflBerthBlock berth={TFL_BERTHS[0]} />
      </Canvas>
    </LookScope>
  );
}

function TankFarmLogisticsPartGauge() {
  return (
    <LookScope look="poster">
      <Canvas>
        <Panel title="Gauge" subtitle="T-201 with its alarm ladder" tone="amber">
          <TflGaugeTank tank={tflFind('T-201')} />
        </Panel>
      </Canvas>
    </LookScope>
  );
}

function TankFarmLogisticsPartLedger() {
  return (
    <LookScope look="poster">
      <Canvas>
        <Panel title="Ledger" subtitle="Movements on one tank, newest first" padding="none">
          <DataTable label="Tank ledger" flush columns={TFL_LEDGER_COLUMNS} rows={TFL_LEDGER} rowKey={(row) => row.id} />
        </Panel>
      </Canvas>
    </LookScope>
  );
}

function TankFarmLogisticsPartKey() {
  return (
    <LookScope look="poster">
      <Canvas>
        <Panel title="Stock by product" subtitle="One colour per product, everywhere on the screen">
          <div className="flex flex-col gap-4">
            <TflProductKey />
            <p className="text-sm font-semibold">
              Tank <TagId>T-103</TagId> and <TagId>T-202</TagId> are outside their alarm lines.
            </p>
          </div>
        </Panel>
      </Canvas>
    </LookScope>
  );
}

export default definePage({
  id: 'tank-farm-logistics',
  title: 'Tank farm and logistics',
  summary:
    'A poster-style terminal board: eight tanks drawn as filled silhouettes across the full width, standing on the timeline of ships, pipelines and trucks that fill and empty them.',
  guidance: {
    use: [
      'When stock is physical: a level drawn in a tank is read faster than a percentage in a table.',
      'One solid colour per product, carried from the tank to its movements and its ullage block.',
      'Select a tank to answer the planner question: how much room, and what is lined up on it.',
    ],
    avoid: [
      'Silhouettes for more than a dozen tanks; group by product or use a ranked bar chart.',
      'Colouring tanks by alarm state: state is a word and an icon above the tank.',
      'Movement blocks too short to read; widen the window or drop the label and keep the lane name.',
    ],
  },
  source,
  sections: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description: 'The full board in the poster look. Select a tank to see its ullage and the movements that touch it.',
      specimens: [
        {
          id: 'TankFarmLogisticsSignature',
          title: 'Terminal board',
          note: 'Pick it for the planner screen of a terminal, where stock, room and the next ships have to be read together.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Canvas.tsx', 'kit/Panel.tsx', 'kit/StatusPill.tsx', 'looks/LookScope.tsx'],
          Component: TankFarmLogisticsSignature,
        },
      ],
    },
    {
      id: 'variations',
      title: 'Variations',
      description: 'Other screens of the same product: the sheet behind one tank, and the jetty board.',
      specimens: [
        {
          id: 'TankFarmLogisticsTankSheet',
          title: 'Tank sheet',
          note: 'Pick it for the screen behind a tank: its gauge with the alarm ladder, a week of level and the ledger.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/AppFrame.tsx', 'kit/Panel.tsx', 'kit/Bars.tsx', 'kit/DataTable.tsx'],
          Component: TankFarmLogisticsTankSheet,
        },
        {
          id: 'TankFarmLogisticsJetties',
          title: 'Jetty board',
          note: 'Pick it for the marine side: one block per berth with the ship alongside, how much is aboard and when it completes.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Canvas.tsx', 'kit/Grid.tsx', 'kit/Panel.tsx', 'kit/DataTable.tsx', 'kit/Meter.tsx'],
          Component: TankFarmLogisticsJetties,
        },
      ],
    },
    {
      id: 'parts',
      title: 'Parts',
      description: 'The pieces of the board on their own.',
      specimens: [
        {
          id: 'TankFarmLogisticsPartTanks',
          title: 'Tank silhouettes',
          note: 'Pick them to show level as a picture: floating roof or dome, alarm lines, and a state word above when one is crossed.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          bleed: true,
          uses: ['kit/StatusPill.tsx'],
          Component: TankFarmLogisticsPartTanks,
        },
        {
          id: 'TankFarmLogisticsPartBerth',
          title: 'Berth block',
          note: 'Pick it for a ship alongside: the name is the headline and the cargo tanks fill as the parcel goes aboard.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          bleed: true,
          Component: TankFarmLogisticsPartBerth,
        },
        {
          id: 'TankFarmLogisticsPartTimeline',
          title: 'Movements timeline',
          note: 'Pick it to plan against berths and lines; fill only the blocks that matter to the current selection.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Panel.tsx'],
          Component: TankFarmLogisticsPartTimeline,
        },
        {
          id: 'TankFarmLogisticsPartUllage',
          title: 'Ullage block',
          note: 'Pick it to answer one question in a solid block: how much room is left and when it runs out.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          bleed: true,
          Component: TankFarmLogisticsPartUllage,
        },
        {
          id: 'TankFarmLogisticsPartGauge',
          title: 'Gauge with alarm ladder',
          note: 'Pick it when one tank needs all five alarm levels named beside the liquid.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Panel.tsx'],
          Component: TankFarmLogisticsPartGauge,
        },
        {
          id: 'TankFarmLogisticsPartKey',
          title: 'Product key',
          note: 'Pick it as the legend and the stock summary at once: each product with its colour and its volume.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Panel.tsx', 'kit/TagId.tsx'],
          Component: TankFarmLogisticsPartKey,
        },
        {
          id: 'TankFarmLogisticsPartLedger',
          title: 'Tank ledger',
          note: 'Pick it for the audit trail of a tank: every receipt and shipment with the level it left behind.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Panel.tsx', 'kit/DataTable.tsx', 'kit/StatusPill.tsx'],
          Component: TankFarmLogisticsPartLedger,
        },
      ],
    },
  ],
});
