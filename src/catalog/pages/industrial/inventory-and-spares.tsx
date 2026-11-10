import { ChartContainer, ChartTooltip, ChartTooltipContent, chartSeriesColor } from '@cognite/aura/chart';
import { Button } from '@cognite/aura/components/button';
import { Card } from '@cognite/aura/components/card';
import { Input } from '@cognite/aura/components/input';
import { Label } from '@cognite/aura/components/label';
import { IconArrowsExchange, IconMapPin, IconMinus, IconPlus } from '@cognite/aura/icons';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { Bar, BarChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from 'recharts';

import { DaysOfCover } from '../../../library/industrial/domains/DaysOfCover';
import { availableStock, fillPercent, reorderQuantity, stockStatus, ullage } from '../../../library/industrial/domains/inventory';
import { ShareBarList } from '../../../library/industrial/domains/ShareBarList';
import { StageFlow } from '../../../library/industrial/domains/StageFlow';
import { StockLevelBar } from '../../../library/industrial/domains/StockLevelBar';
import { TankInventoryTile } from '../../../library/industrial/domains/TankInventoryTile';
import { KpiTile } from '../../../library/industrial/KpiTile';
import { LevelMeter } from '../../../library/industrial/LevelMeter';
import { formatDelta, formatValue, toneFromLimits } from '../../../library/industrial/status';
import type { DotShape, Limits, Tone } from '../../../library/industrial/status';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { ValueReadout } from '../../../library/industrial/ValueReadout';
import { definePage } from '../../types';

import source from './inventory-and-spares.tsx?raw';

const CHART_FRAME = 'aspect-auto h-full w-full';
const TH = 'px-3 py-2 text-left text-xs font-medium text-muted-foreground';
const TD = 'px-3 py-2.5 align-middle';

type Tank = { tag: string; product: string; volume: number; capacity: number; limits: Limits };

const TANK_LIMITS: Limits = { lowLow: 5, low: 15, high: 85, highHigh: 92 };

/** The Nordkapp tank farm. Volumes in m³. */
const TANKS: readonly Tank[] = [
  { tag: '27-TA-3001', product: 'Stabilised condensate', volume: 3400, capacity: 5000, limits: TANK_LIMITS },
  { tag: '27-TA-3002', product: 'Stabilised condensate', volume: 4410, capacity: 5000, limits: TANK_LIMITS },
  { tag: '27-TA-3003', product: 'Off-spec condensate', volume: 270, capacity: 1500, limits: TANK_LIMITS },
  { tag: '44-TA-4401', product: 'Produced water', volume: 1120, capacity: 2000, limits: TANK_LIMITS },
  { tag: '62-TA-6201', product: 'Methanol', volume: 184, capacity: 400, limits: TANK_LIMITS },
  { tag: '62-TA-6205', product: 'Diesel', volume: 21, capacity: 250, limits: TANK_LIMITS },
];

type Part = {
  partNumber: string;
  description: string;
  serves: string;
  location: string;
  onHand: number;
  reserved: number;
  onOrder: number;
  min: number;
  reorderPoint: number;
  max: number;
  leadTimeWeeks: number;
  unitCost: number;
  risk: { tone: Tone; label: string; shape: DotShape };
};

const LOW_RISK = { tone: 'neutral', label: 'Low', shape: 'ring' } as const;
const MEDIUM_RISK = { tone: 'warning', label: 'Medium', shape: 'square' } as const;
const HIGH_RISK = { tone: 'critical', label: 'High', shape: 'diamond' } as const;

/** Critical spares, highest stock-out risk first. Cost in thousand NOK per unit. */
const PARTS: readonly Part[] = [
  { partNumber: '104-2291-DE', description: 'Bearing, drive end, recompressor', serves: '23-KA-9103', location: 'WH1 · A-04-2', onHand: 1, reserved: 1, onOrder: 2, min: 2, reorderPoint: 3, max: 4, leadTimeWeeks: 10, unitCost: 186, risk: HIGH_RISK },
  { partNumber: '104-3310-DGS', description: 'Dry gas seal cartridge', serves: '23-KA-9101/02', location: 'WH1 · C-01-1', onHand: 2, reserved: 0, onOrder: 0, min: 1, reorderPoint: 2, max: 4, leadTimeWeeks: 16, unitCost: 940, risk: MEDIUM_RISK },
  { partNumber: '118-0457-TB', description: 'Tube bundle gasket set, interstage cooler', serves: '23-HA-9114', location: 'WH1 · B-11-3', onHand: 1, reserved: 1, onOrder: 0, min: 1, reorderPoint: 1, max: 2, leadTimeWeeks: 6, unitCost: 42, risk: MEDIUM_RISK },
  { partNumber: '104-2271-MS', description: 'Mechanical seal, export pump', serves: '27-PA-2001A/B', location: 'WH1 · A-07-1', onHand: 6, reserved: 1, onOrder: 0, min: 2, reorderPoint: 4, max: 10, leadTimeWeeks: 8, unitCost: 68, risk: LOW_RISK },
  { partNumber: '131-9002-TT', description: 'Temperature transmitter, RTD', serves: 'Plant-wide', location: 'WH1 · D-02-4', onHand: 9, reserved: 1, onOrder: 0, min: 4, reorderPoint: 6, max: 12, leadTimeWeeks: 3, unitCost: 14, risk: LOW_RISK },
];

const BEARING = PARTS[0];
const GAS_SEAL = PARTS[1];
const PUMP_SEAL = PARTS[3];

type Chemical = { name: string; tank: string; onHand: number; dailyUse: number; leadTimeDays: number; nextDelivery: string };

/** Production chemicals: stock and average daily use in m³. */
const CHEMICALS: readonly Chemical[] = [
  { name: 'Methanol', tank: '62-TA-6201', onHand: 184, dailyUse: 9.5, leadTimeDays: 14, nextDelivery: '21 Mar' },
  { name: 'Corrosion inhibitor', tank: '62-TA-6203', onHand: 6.4, dailyUse: 0.9, leadTimeDays: 10, nextDelivery: 'not ordered' },
  { name: 'Scale inhibitor', tank: '62-TA-6204', onHand: 11.2, dailyUse: 0.4, leadTimeDays: 10, nextDelivery: '2 Apr' },
  { name: 'Triethylene glycol', tank: '62-TA-6207', onHand: 38, dailyUse: 0.6, leadTimeDays: 21, nextDelivery: '28 Apr' },
  { name: 'Lube oil, ISO VG 46', tank: '62-TA-6210', onHand: 4.1, dailyUse: 0, leadTimeDays: 7, nextDelivery: 'on request' },
];

/** Methanol issued per week, m³, last 12 weeks. */
const METHANOL_WEEKLY = [58, 61, 64, 60, 66, 71, 69, 74, 72, 63, 68, 66].map((volume, index) => ({ week: `W${index + 1}`, volume }));
const METHANOL_AVERAGE = Math.round((METHANOL_WEEKLY.reduce((sum, row) => sum + row.volume, 0) / METHANOL_WEEKLY.length) * 10) / 10;

type Movement = { id: string; time: string; kind: 'receipt' | 'issue' | 'transfer'; partNumber: string; description: string; quantity: number; route: string; reference: string; by: string };

const MOVEMENTS: readonly Movement[] = [
  { id: 'MV-88214', time: '12 Mar, 11:42', kind: 'issue', partNumber: '104-2291-DE', description: 'Bearing, drive end, recompressor', quantity: -1, route: 'WH1 · A-04-2 to work site', reference: 'WO-104482', by: 'Tomás Barros' },
  { id: 'MV-88209', time: '12 Mar, 09:15', kind: 'receipt', partNumber: '131-9002-TT', description: 'Temperature transmitter, RTD', quantity: 4, route: 'Supplier to WH1 · D-02-4', reference: 'PO-4500128611', by: 'Magnus Solberg' },
  { id: 'MV-88197', time: '11 Mar, 15:30', kind: 'transfer', partNumber: '104-2271-MS', description: 'Mechanical seal, export pump', quantity: 2, route: 'Stord terminal to WH1 · A-07-1', reference: 'TR-00417', by: 'Magnus Solberg' },
  { id: 'MV-88190', time: '11 Mar, 08:05', kind: 'issue', partNumber: '118-0457-TB', description: 'Tube bundle gasket set, interstage cooler', quantity: -1, route: 'WH1 · B-11-3 to work site', reference: 'WO-104471', by: 'Jonas Nyberg' },
  { id: 'MV-88176', time: '10 Mar, 13:20', kind: 'receipt', partNumber: '104-2271-MS', description: 'Mechanical seal, export pump', quantity: 3, route: 'Supplier to WH1 · A-07-1', reference: 'PO-4500128590', by: 'Magnus Solberg' },
];

const MOVEMENT_KIND = {
  receipt: { label: 'Goods receipt', Icon: IconPlus },
  issue: { label: 'Issue to work order', Icon: IconMinus },
  transfer: { label: 'Transfer in', Icon: IconArrowsExchange },
} as const;

const DELIVERY_STAGES = [
  { id: 'ordered', label: 'Ordered', detail: '8 Jan' },
  { id: 'shipped', label: 'Shipped', detail: '3 Mar' },
  { id: 'customs', label: 'Customs', detail: 'Due 13 Mar' },
  { id: 'warehouse', label: 'At warehouse', detail: 'Due 16 Mar' },
  { id: 'received', label: 'Received' },
];

function Panel({ title, meta, children }: { title: string; meta?: ReactNode; children: ReactNode }) {
  return (
    <Card className="w-full min-w-0">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-medium text-base-foreground">{title}</h3>
        {meta ? <span className="text-xs text-muted-foreground tabular-nums">{meta}</span> : null}
      </div>
      {children}
    </Card>
  );
}

/** `location` is "store · bin": the store in words, the bin code in monospace. */
function LocationChip({ location }: { location: string }) {
  const [store, bin] = location.split(' · ');
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-default px-1.5 py-0.5 text-xs text-medium-foreground">
      <IconMapPin aria-hidden="true" className="size-3.5 text-muted-foreground" />
      {store}
      {bin ? <span className="font-mono text-base-foreground">{bin}</span> : null}
    </span>
  );
}

function InventorySpareTankTile() {
  const tank = TANKS[0];
  return (
    <div className="w-full max-w-72 self-center">
      <TankInventoryTile {...tank} movement={{ direction: 'filling', rate: 42, rateUnit: 'm³/h' }} />
    </div>
  );
}

function InventorySpareTankTileHigh() {
  const tank = TANKS[1];
  return (
    <div className="w-full max-w-72 self-center">
      <TankInventoryTile {...tank} movement={{ direction: 'filling', rate: 42, rateUnit: 'm³/h' }} />
    </div>
  );
}

function InventorySpareTankTileOutOfService() {
  return (
    <div className="w-full max-w-72 self-center">
      <TankInventoryTile
        tag="27-TA-3004"
        product="Stabilised condensate"
        volume={0}
        capacity={5000}
        status={{ tone: 'neutral', label: 'Out of service', shape: 'square' }}
        movement={{ direction: 'static' }}
      />
    </div>
  );
}

function InventorySpareTankFarmRow() {
  return (
    <Panel title="Tank farm" meta="Volumes in m³ · 12 Mar, 14:00">
      <ul aria-label="Tanks" className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 xl:grid-cols-6">
        {TANKS.map((tank) => {
          const level = fillPercent(tank.volume, tank.capacity);
          const tone = toneFromLimits(level, tank.limits);
          return (
            <li key={tank.tag} className="flex min-w-0 gap-3">
              <LevelMeter label={`${tank.product} level, ${tank.tag}`} value={level} limits={tank.limits} height={104} decimals={1} showLimits={false} showReadout={false} />
              <div className="flex min-w-0 flex-col justify-between gap-1">
                <div className="flex flex-col gap-0.5">
                  <span className="font-mono text-xs text-base-foreground">{tank.tag}</span>
                  <span className="text-xs text-muted-foreground">{tank.product}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <ValueReadout size="sm" value={level} unit="%" decimals={1} tone={tone} />
                  {tone === 'neutral' ? null : (
                    <StatusIndicator size="sm" tone={tone} shape={tone === 'critical' ? 'diamond' : 'square'} label={level > 50 ? 'High level' : 'Low level'} />
                  )}
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {formatValue(tank.volume, 0)} · ullage {formatValue(ullage(tank.capacity, tank.volume), 0)}
                  </span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

function InventorySpareStockBar() {
  return (
    <Card className="w-full max-w-80 self-center">
      <StockLevelBar label={PUMP_SEAL.description} onHand={PUMP_SEAL.onHand} reserved={PUMP_SEAL.reserved} min={PUMP_SEAL.min} reorderPoint={PUMP_SEAL.reorderPoint} max={PUMP_SEAL.max} unit="ea" />
    </Card>
  );
}

function InventorySpareStockBarReorder() {
  return (
    <Card className="w-full max-w-80 self-center">
      <StockLevelBar label={GAS_SEAL.description} onHand={GAS_SEAL.onHand} min={GAS_SEAL.min} reorderPoint={GAS_SEAL.reorderPoint} max={GAS_SEAL.max} unit="ea" />
    </Card>
  );
}

function InventorySpareStockBarBelowMin() {
  return (
    <Card className="w-full max-w-80 self-center">
      <StockLevelBar label={BEARING.description} onHand={BEARING.onHand} reserved={BEARING.reserved} min={BEARING.min} reorderPoint={BEARING.reorderPoint} max={BEARING.max} unit="ea" />
    </Card>
  );
}

function InventorySpareDaysOfCover() {
  return (
    <Card className="w-full max-w-80 self-center gap-5">
      <DaysOfCover label="Scale inhibitor" onHand={11.2} dailyUse={0.4} leadTimeDays={10} />
      <DaysOfCover label="Methanol" onHand={184} dailyUse={9.5} leadTimeDays={14} />
      <DaysOfCover label="Corrosion inhibitor" onHand={6.4} dailyUse={0.9} leadTimeDays={10} />
    </Card>
  );
}

function InventorySpareLocationChip() {
  return (
    <ul aria-label="Storage locations" className="flex w-full max-w-80 flex-col gap-3 self-center text-sm">
      <li className="flex items-center justify-between gap-3">
        <span className="truncate text-base-foreground">Bearing, drive end</span>
        <LocationChip location="WH1 · A-04-2" />
      </li>
      <li className="flex items-center justify-between gap-3">
        <span className="truncate text-base-foreground">Spool piece, 8 in</span>
        <LocationChip location="Yard · Rack 3" />
      </li>
      <li className="flex items-center justify-between gap-3">
        <span className="truncate text-base-foreground">Dry gas seal, returned</span>
        <LocationChip location="Quarantine · Q-01" />
      </li>
      <li className="text-xs text-muted-foreground">Store in words, then aisle-bay-level in monospace so codes read back and copy cleanly.</li>
    </ul>
  );
}

function InventorySpareValueSummary() {
  return (
    <Card className="w-full max-w-80 self-center">
      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-muted-foreground">Inventory value</span>
        <ValueReadout size="md" value={48.6} unit="MNOK" decimals={1} />
      </div>
      <ShareBarList
        label="Inventory value by category, million NOK"
        items={[
          { id: 'critical', label: 'Critical spares', value: 21.4 },
          { id: 'slow', label: 'No movement in 24 months', value: 11.3 },
          { id: 'consumables', label: 'Consumables', value: 9.8 },
          { id: 'chemicals', label: 'Chemicals', value: 6.1 },
        ]}
        decimals={1}
        showShare
      />
    </Card>
  );
}

function InventorySpareConsumptionTrend() {
  return (
    <Panel title="Methanol consumption" meta="m³ per week, last 12 weeks">
      <div className="h-52 w-full">
        <ChartContainer
          config={{ volume: { label: 'Issued', color: chartSeriesColor(1) } }}
          className={CHART_FRAME}
          aria-label={`Methanol issued per week for 12 weeks, between 58 and 74 cubic metres, averaging ${METHANOL_AVERAGE}`}
        >
          <BarChart data={METHANOL_WEEKLY} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="week" tickLine={false} axisLine={false} />
            <YAxis domain={[0, 80]} ticks={[0, 20, 40, 60, 80]} tickLine={false} axisLine={false} width={24} />
            <ChartTooltip content={<ChartTooltipContent valueFormatter={(value) => `${value} m³`} />} />
            <Bar dataKey="volume" fill="var(--color-volume)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
            <ReferenceLine y={METHANOL_AVERAGE} stroke="var(--color-chart-neutral-450)" strokeDasharray="4 4" />
          </BarChart>
        </ChartContainer>
      </div>
      <p className="text-xs text-muted-foreground tabular-nums">Dashed line is the 12-week average, {formatValue(METHANOL_AVERAGE, 1)} m³ per week or 9.5 m³ per day. Days of cover use this figure.</p>
    </Panel>
  );
}

function InventorySpareChemicalInventory() {
  return (
    <Panel title="Chemical inventory" meta="m³">
      <div className="overflow-x-auto">
        <table aria-label="Chemical inventory with consumption and cover" className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th scope="col" className={`${TH} pl-0`}>
                Chemical
              </th>
              <th scope="col" className={`${TH} whitespace-nowrap text-right`}>
                On hand
              </th>
              <th scope="col" className={`${TH} whitespace-nowrap text-right`}>
                Per day
              </th>
              <th scope="col" className={`${TH} pr-0`}>
                Cover
              </th>
            </tr>
          </thead>
          <tbody>
            {CHEMICALS.map((chemical) => (
              <tr key={chemical.name} className="border-t border-default">
                <th scope="row" className={`${TD} pl-0 text-left font-normal text-base-foreground`}>
                  {chemical.name}
                  <span className="block font-mono text-xs text-muted-foreground">{chemical.tank}</span>
                </th>
                <td className={`${TD} text-right tabular-nums text-base-foreground`}>{formatValue(chemical.onHand, 1)}</td>
                <td className={`${TD} text-right tabular-nums text-medium-foreground`}>{formatValue(chemical.dailyUse, 1)}</td>
                <td className={`${TD} pr-0`}>
                  <DaysOfCover variant="inline" label={chemical.name} onHand={chemical.onHand} dailyUse={chemical.dailyUse} leadTimeDays={chemical.leadTimeDays} />
                  <span className="block text-xs text-muted-foreground tabular-nums">
                    Lead time {chemical.leadTimeDays} d · delivery {chemical.nextDelivery}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function PartFigures({ part }: { part: Part }) {
  const figures = [
    { label: 'On hand', value: part.onHand },
    { label: 'Reserved', value: part.reserved },
    { label: 'Available', value: availableStock(part.onHand, part.reserved) },
    { label: 'On order', value: part.onOrder },
  ];
  return (
    <dl className="grid grid-cols-5 gap-3">
      {figures.map((figure) => (
        <div key={figure.label} className="flex flex-col gap-1">
          <dt className="text-xs text-muted-foreground">{figure.label}</dt>
          <dd>
            <ValueReadout size="sm" value={figure.value} unit="ea" />
          </dd>
        </div>
      ))}
      <div className="flex flex-col gap-1">
        <dt className="text-xs text-muted-foreground">Lead time</dt>
        <dd>
          <ValueReadout size="sm" value={part.leadTimeWeeks} unit="wk" />
        </dd>
      </div>
    </dl>
  );
}

function InventorySparePartRow() {
  const part = PUMP_SEAL;
  return (
    <Card role="group" aria-label={`Spare part ${part.partNumber}`} className="w-full min-w-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="font-mono text-xs text-muted-foreground">{part.partNumber}</span>
          <span className="text-sm font-medium text-base-foreground">{part.description}</span>
          <span className="text-xs text-muted-foreground">
            Fits <span className="font-mono">{part.serves}</span>
          </span>
        </div>
        <LocationChip location={part.location} />
      </div>
      <PartFigures part={part} />
      <StockLevelBar showHeader={false} label={part.description} onHand={part.onHand} reserved={part.reserved} min={part.min} reorderPoint={part.reorderPoint} max={part.max} unit="ea" />
    </Card>
  );
}

function InventorySpareReorderCard() {
  const part = GAS_SEAL;
  const quantity = reorderQuantity(part.onHand, part.onOrder, part.max);
  return (
    <Card role="group" aria-label={`Reorder suggestion for ${part.description}`} className="w-full max-w-80 self-center gap-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">Reorder suggestion</span>
        <StatusIndicator size="sm" {...stockStatus(part)} />
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-base-foreground">{part.description}</span>
        <span className="font-mono text-xs text-muted-foreground">{part.partNumber}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-xs text-muted-foreground">Order</span>
        <ValueReadout size="md" value={quantity} unit="ea" />
        <span className="text-xs text-muted-foreground tabular-nums">· {formatValue(quantity * part.unitCost, 0)} kNOK</span>
      </div>
      <p className="text-xs text-muted-foreground tabular-nums">
        {part.onHand} on hand is at the reorder point of {part.reorderPoint}. Lead time is {part.leadTimeWeeks} weeks, so an order today arrives in early July.
      </p>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm">
          Dismiss
        </Button>
        <Button variant="secondary" size="sm">
          Create requisition
        </Button>
      </div>
    </Card>
  );
}

function InventorySpareCriticalList() {
  return (
    <div className="w-full overflow-x-auto">
      <table aria-label="Critical spares with stock-out risk" className="w-full min-w-176 border-collapse text-sm">
        <thead>
          <tr>
            <th scope="col" className={TH}>
              Part
            </th>
            <th scope="col" className={TH}>
              Fits
            </th>
            <th scope="col" className={`${TH} w-1/5`}>
              Stock against min, reorder, max
            </th>
            <th scope="col" className={`${TH} text-right`}>
              On hand
            </th>
            <th scope="col" className={`${TH} text-right`}>
              Available
            </th>
            <th scope="col" className={`${TH} text-right`}>
              Lead time
            </th>
            <th scope="col" className={TH}>
              Stock-out risk
            </th>
          </tr>
        </thead>
        <tbody>
          {PARTS.map((part) => (
            <tr key={part.partNumber} className="border-t border-default">
              <td className={TD}>
                <span className="text-base-foreground">{part.description}</span>
                <span className="block font-mono text-xs text-muted-foreground">{part.partNumber}</span>
              </td>
              <td className={`${TD} whitespace-nowrap font-mono text-xs text-medium-foreground`}>{part.serves}</td>
              <td className={TD}>
                <StockLevelBar showHeader={false} showScale={false} label={part.description} onHand={part.onHand} reserved={part.reserved} min={part.min} reorderPoint={part.reorderPoint} max={part.max} unit="ea" />
              </td>
              <td className={`${TD} text-right tabular-nums text-base-foreground`}>{part.onHand}</td>
              <td className={`${TD} text-right tabular-nums ${availableStock(part.onHand, part.reserved) === 0 ? 'font-medium text-critical-foreground-strong' : 'text-base-foreground'}`}>
                {availableStock(part.onHand, part.reserved)}
              </td>
              <td className={`${TD} whitespace-nowrap text-right tabular-nums text-medium-foreground`}>{part.leadTimeWeeks} wk</td>
              <td className={TD}>
                <StatusIndicator size="sm" {...part.risk} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InventorySpareReservation() {
  const lines = [
    { partNumber: '104-2291-DE', description: 'Bearing, drive end', required: 2, reserved: 1, state: { tone: 'critical', label: 'Short 1', shape: 'diamond' } as const },
    { partNumber: '104-2294-OS', description: 'Oil seal, drive end', required: 2, reserved: 2, state: { tone: 'success', label: 'Reserved', shape: 'dot' } as const },
    { partNumber: '190-0031-SH', description: 'Shim set', required: 1, reserved: 1, state: { tone: 'info', label: 'Picked', shape: 'ring' } as const },
  ];
  return (
    <Card role="group" aria-label="Material reservation for work order WO-104482" className="w-full min-w-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            Material reservation <span className="font-mono text-base-foreground">WO-104482</span>
          </span>
          <h3 className="text-sm font-medium text-base-foreground">Inspect recompressor drive-end bearing</h3>
        </div>
        <StatusIndicator variant="badge" tone="critical" label="1 line short" />
      </div>
      <ul aria-label="Reserved materials" className="flex flex-col gap-3">
        {lines.map((line) => (
          <li key={line.partNumber} className="grid grid-cols-[minmax(0,1fr)_auto_6rem] items-center gap-x-4">
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="truncate text-sm text-base-foreground">{line.description}</span>
              <span className="font-mono text-xs text-muted-foreground">{line.partNumber}</span>
            </div>
            <span className="text-sm tabular-nums text-base-foreground">
              {line.reserved} of {line.required}
            </span>
            <StatusIndicator size="sm" {...line.state} />
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-default pt-3">
        <span className="text-xs text-muted-foreground">2 bearings on order, due 16 Mar. The job is due 12 Mar, 20:00.</span>
        <Button variant="secondary" size="sm">
          Expedite order
        </Button>
      </div>
    </Card>
  );
}

function InventorySpareCycleCount() {
  const expected = PUMP_SEAL.onHand;
  const [counted, setCounted] = useState('5');
  const quantity = counted.trim() === '' ? null : Number(counted);
  const variance = quantity === null || Number.isNaN(quantity) ? null : quantity - expected;
  return (
    <Card role="group" aria-label="Cycle count task CC-0312-04" className="w-full min-w-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            Cycle count <span className="font-mono text-base-foreground">CC-0312-04</span>
          </span>
          <span className="text-sm font-medium text-base-foreground">{PUMP_SEAL.description}</span>
          <span className="font-mono text-xs text-muted-foreground">{PUMP_SEAL.partNumber}</span>
        </div>
        <LocationChip location={PUMP_SEAL.location} />
      </div>
      <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-muted-foreground">System quantity</span>
          <ValueReadout size="md" value={expected} unit="ea" />
        </div>
        <div className="flex w-28 flex-col">
          <Label htmlFor="inventory-cycle-count">Counted</Label>
          <Input id="inventory-cycle-count" inputMode="numeric" value={counted} onChange={(event) => setCounted(event.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5 pb-2" aria-live="polite">
          <span className="text-xs text-muted-foreground">Variance</span>
          {variance === null ? (
            <span className="text-sm text-muted-foreground">Enter a count</span>
          ) : variance === 0 ? (
            <StatusIndicator size="sm" tone="success" label="Matches" />
          ) : (
            <StatusIndicator size="sm" tone="warning" shape="square" label={`${formatDelta(variance, 0)} ea`} detail="recount before posting" />
          )}
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm">
          Skip bin
        </Button>
        <Button variant="secondary" size="sm" disabled={variance === null}>
          {variance === 0 || variance === null ? 'Confirm count' : 'Post variance'}
        </Button>
      </div>
    </Card>
  );
}

function InventorySpareMovementLog() {
  return (
    <div className="w-full overflow-x-auto">
      <table aria-label="Stock movement log" className="w-full min-w-176 border-collapse text-sm">
        <thead>
          <tr>
            <th scope="col" className={TH}>
              Time
            </th>
            <th scope="col" className={TH}>
              Movement
            </th>
            <th scope="col" className={TH}>
              Part
            </th>
            <th scope="col" className={`${TH} text-right`}>
              Quantity
            </th>
            <th scope="col" className={TH}>
              Route
            </th>
            <th scope="col" className={TH}>
              Reference
            </th>
            <th scope="col" className={TH}>
              By
            </th>
          </tr>
        </thead>
        <tbody>
          {MOVEMENTS.map((movement) => {
            const kind = MOVEMENT_KIND[movement.kind];
            return (
              <tr key={movement.id} className="border-t border-default">
                <td className={`${TD} whitespace-nowrap tabular-nums text-medium-foreground`}>{movement.time}</td>
                <td className={`${TD} whitespace-nowrap`}>
                  <span className="flex items-center gap-2 text-base-foreground">
                    <kind.Icon aria-hidden="true" className="size-4 text-muted-foreground" />
                    {kind.label}
                  </span>
                </td>
                <td className={TD}>
                  <span className="text-base-foreground">{movement.description}</span>
                  <span className="block font-mono text-xs text-muted-foreground">{movement.partNumber}</span>
                </td>
                <td className={`${TD} whitespace-nowrap text-right font-medium tabular-nums text-base-foreground`}>{formatDelta(movement.quantity, 0)} ea</td>
                <td className={`${TD} text-medium-foreground`}>{movement.route}</td>
                <td className={`${TD} whitespace-nowrap font-mono text-xs text-medium-foreground`}>{movement.reference}</td>
                <td className={`${TD} whitespace-nowrap text-medium-foreground`}>{movement.by}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function InventorySpareDeliveryTracker() {
  return (
    <Panel title="Delivery · bearings, drive end" meta={<span className="font-mono">PO-4500128744</span>}>
      <StageFlow label="Delivery of purchase order PO-4500128744" stages={DELIVERY_STAGES} current="shipped" />
      <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 border-t border-default pt-3 text-xs text-muted-foreground tabular-nums">
        <span>2 ea · Nordic Bearing Service · sea freight from Rotterdam</span>
        <span className="text-base-foreground">Expected at warehouse 16 Mar</span>
      </div>
    </Panel>
  );
}

function InventorySpareDeliveryDelayed() {
  return (
    <Panel title="Delivery · dry gas seal cartridge" meta={<span className="font-mono">PO-4500127981</span>}>
      <StageFlow
        label="Delivery of purchase order PO-4500127981"
        stages={[
          { id: 'ordered', label: 'Ordered', detail: '14 Nov' },
          { id: 'shipped', label: 'Shipped', detail: '2 Mar' },
          { id: 'customs', label: 'Customs' },
          { id: 'warehouse', label: 'At warehouse' },
          { id: 'received', label: 'Received' },
        ]}
        current="customs"
        currentTone="warning"
        currentNote="Held since 9 Mar"
      />
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-default pt-3">
        <span className="text-xs text-muted-foreground tabular-nums">Held for an export licence check. Expected at warehouse moved from 12 Mar to 20 Mar. No work order is waiting for this part.</span>
        <Button variant="ghost" size="sm">
          Contact forwarder
        </Button>
      </div>
    </Panel>
  );
}

function InventorySpareWarehouseOverview() {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiTile label="Inventory value" value={48.6} unit="MNOK" decimals={1} delta={{ reference: 47.9, caption: 'vs last month' }} />
        <KpiTile label="Spares below minimum" value={1} tone="critical" status={{ tone: 'critical', label: 'Critical spare', shape: 'diamond' }} footnote="Recompressor bearing · 2 on order, due 16 Mar" />
        <KpiTile label="Lines at reorder point" value={7} delta={{ reference: 5, goodDirection: 'down', caption: 'vs last week', decimals: 0 }} footnote="3 requisitions raised" />
        <KpiTile label="Reservations short" value={1} status={{ tone: 'warning', label: 'WO-104482', shape: 'square' }} footnote="Of 14 open reservations" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Panel title="Critical spares" meta="Highest stock-out risk first">
            <ul className="flex flex-col gap-4">
              {PARTS.slice(0, 4).map((part) => (
                <li key={part.partNumber} className="grid grid-cols-[minmax(0,1fr)_minmax(0,10rem)_5rem] items-center gap-x-4">
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate text-sm text-base-foreground">{part.description}</span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {part.partNumber} · {part.serves}
                    </span>
                  </div>
                  <StockLevelBar showHeader={false} showScale={false} label={part.description} onHand={part.onHand} reserved={part.reserved} min={part.min} reorderPoint={part.reorderPoint} max={part.max} unit="ea" />
                  <StatusIndicator size="sm" {...part.risk} />
                </li>
              ))}
            </ul>
          </Panel>
        </div>
        <div className="lg:col-span-2">
          <Panel title="Chemical cover" meta="Against lead time">
            <div className="flex flex-col gap-5">
              {CHEMICALS.slice(0, 3).map((chemical) => (
                <DaysOfCover key={chemical.name} label={chemical.name} onHand={chemical.onHand} dailyUse={chemical.dailyUse} leadTimeDays={chemical.leadTimeDays} />
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function InventorySparePartDetail() {
  const part = BEARING;
  return (
    <Card className="w-full min-w-0 gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="font-mono text-xs text-muted-foreground">{part.partNumber}</span>
          <h3 className="text-base font-semibold text-base-foreground">{part.description}</h3>
          <span className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            Critical spare · fits <span className="font-mono">{part.serves}</span>
            <LocationChip location={part.location} />
          </span>
        </div>
        <div className="flex items-center gap-3">
          <StatusIndicator variant="badge" {...stockStatus(part)} />
          <Button variant="secondary" size="sm">
            Create requisition
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <section aria-label="Stock" className="flex flex-col gap-4">
          <h4 className="text-xs font-medium text-muted-foreground">Stock</h4>
          <dl className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <dt className="text-xs text-muted-foreground">On hand</dt>
              <dd>
                <ValueReadout size="md" value={part.onHand} unit="ea" tone="critical" />
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-xs text-muted-foreground">Available</dt>
              <dd>
                <ValueReadout size="md" value={availableStock(part.onHand, part.reserved)} unit="ea" tone="critical" />
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-xs text-muted-foreground">On order</dt>
              <dd>
                <ValueReadout size="sm" value={part.onOrder} unit="ea" />
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-xs text-muted-foreground">Lead time</dt>
              <dd>
                <ValueReadout size="sm" value={part.leadTimeWeeks} unit="wk" />
              </dd>
            </div>
          </dl>
          <StockLevelBar showHeader={false} label={part.description} onHand={part.onHand} reserved={part.reserved} min={part.min} reorderPoint={part.reorderPoint} max={part.max} unit="ea" />
        </section>
        <section aria-label="Demand" className="flex flex-col gap-3">
          <h4 className="text-xs font-medium text-muted-foreground">Open demand</h4>
          <ul className="flex flex-col gap-3 text-sm">
            <li className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-base-foreground">Inspect recompressor drive-end bearing</span>
                <span className="text-xs text-muted-foreground">
                  <span className="font-mono">WO-104482</span> · needs 2, due 12 Mar, 20:00
                </span>
              </div>
              <StatusIndicator size="sm" tone="critical" shape="diamond" label="Short 1" />
            </li>
            <li className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-base-foreground">Purchase order, 2 ea</span>
                <span className="text-xs text-muted-foreground">
                  <span className="font-mono">PO-4500128744</span> · shipped, expected 16 Mar
                </span>
              </div>
              <StatusIndicator size="sm" tone="info" shape="ring" label="In transit" />
            </li>
          </ul>
        </section>
        <section aria-label="Latest movements" className="flex flex-col gap-3">
          <h4 className="text-xs font-medium text-muted-foreground">Latest movements</h4>
          <ul className="flex flex-col gap-2 text-sm">
            <li className="flex items-baseline justify-between gap-3">
              <span className="text-medium-foreground">
                Issue to <span className="font-mono text-xs">WO-104482</span>
              </span>
              <span className="tabular-nums text-base-foreground">−1 ea · 12 Mar</span>
            </li>
            <li className="flex items-baseline justify-between gap-3">
              <span className="text-medium-foreground">
                Issue to <span className="font-mono text-xs">WO-103977</span>
              </span>
              <span className="tabular-nums text-base-foreground">−2 ea · 18 Nov 2025</span>
            </li>
            <li className="flex items-baseline justify-between gap-3">
              <span className="text-medium-foreground">Goods receipt</span>
              <span className="tabular-nums text-base-foreground">+4 ea · 2 Sep 2025</span>
            </li>
          </ul>
          <p className="text-xs text-muted-foreground">Three used in six months against a planning rate of two per year. Review minimum and reorder point.</p>
        </section>
      </div>
    </Card>
  );
}

export default definePage({
  id: 'inventory-and-spares',
  title: 'Inventory and spares',
  summary:
    'The kit for a stores and materials app: what is in the tanks, what is on the shelves, whether it will last until the next delivery, and whether the part a work order needs is actually there.',
  guidance: {
    use: [
      'Show stock against its minimum, reorder point and maximum; a quantity alone says nothing.',
      'Separate on hand from available: reserved stock is not there for the next job.',
      'Judge cover against lead time, since ten days of stock is plenty or far too little depending on it.',
      'Print part numbers, bin locations and order numbers in monospace so they can be read back and copied.',
    ],
    avoid: [
      'Colouring healthy stock green; colour marks reorder, shortage and overfill only.',
      'A level percentage without the volume and the ullage behind it.',
      'Hiding lead time on critical spares; it is what makes a low count dangerous.',
      'Reorder suggestions without the reasoning and the quantity proposed.',
    ],
  },
  source,
  sections: [
    {
      id: 'tanks',
      title: 'Tank inventory',
      description: 'Bulk liquids: level, volume and the room left to fill.',
      specimens: [
        {
          id: 'InventorySpareTankTile',
          title: 'Tank inventory tile',
          note: 'Pick it for one tank: level as a drawing and a number, with volume, ullage and whether it is filling.',
          origin: 'custom',
          uses: ['industrial/domains/TankInventoryTile.tsx', 'industrial/domains/inventory.ts', 'industrial/LevelMeter.tsx'],
          Component: InventorySpareTankTile,
        },
        {
          id: 'InventorySpareTankTileHigh',
          title: 'Tank at high level',
          note: 'Pick it to see the warning state: above the high limit the tile names it and the level takes the warning colour.',
          origin: 'custom',
          uses: ['industrial/domains/TankInventoryTile.tsx', 'industrial/domains/inventory.ts'],
          Component: InventorySpareTankTileHigh,
        },
        {
          id: 'InventorySpareTankTileOutOfService',
          title: 'Tank out of service',
          note: 'Pick it for a tank that is empty on purpose, so a zero level is not read as a fault.',
          origin: 'custom',
          uses: ['industrial/domains/TankInventoryTile.tsx'],
          Component: InventorySpareTankTileOutOfService,
        },
        {
          id: 'InventorySpareTankFarmRow',
          title: 'Tank farm row',
          note: 'Pick it for the whole farm on one line: every tank on the same scale, with exceptions named.',
          origin: 'custom',
          uses: ['industrial/LevelMeter.tsx', 'industrial/domains/inventory.ts', 'industrial/ValueReadout.tsx'],
          size: 'full',
          align: 'stretch',
          Component: InventorySpareTankFarmRow,
        },
      ],
    },
    {
      id: 'stock',
      title: 'Stock levels and cover',
      description: 'A quantity against its planning levels, and how long it lasts.',
      specimens: [
        {
          id: 'InventorySpareStockBar',
          title: 'Stock level bar',
          note: 'Pick it for one item against its minimum, reorder point and maximum; the lighter end is reserved stock.',
          origin: 'custom',
          uses: ['industrial/domains/StockLevelBar.tsx', 'industrial/domains/inventory.ts'],
          Component: InventorySpareStockBar,
        },
        {
          id: 'InventorySpareStockBarReorder',
          title: 'At the reorder point',
          note: 'Pick it to see the warning state: the bar and the word "Reorder" appear together.',
          origin: 'custom',
          uses: ['industrial/domains/StockLevelBar.tsx', 'industrial/domains/inventory.ts'],
          Component: InventorySpareStockBarReorder,
        },
        {
          id: 'InventorySpareStockBarBelowMin',
          title: 'Below minimum',
          note: 'Pick it to see the critical state: under the safety stock, with the last unit already reserved.',
          origin: 'custom',
          uses: ['industrial/domains/StockLevelBar.tsx', 'industrial/domains/inventory.ts'],
          Component: InventorySpareStockBarBelowMin,
        },
        {
          id: 'InventorySpareDaysOfCover',
          title: 'Days of cover',
          note: 'Pick it for consumables: days of stock at current use, with the lead time as the mark to stay above.',
          origin: 'custom',
          uses: ['industrial/domains/DaysOfCover.tsx', 'industrial/domains/inventory.ts'],
          Component: InventorySpareDaysOfCover,
        },
        {
          id: 'InventorySpareLocationChip',
          title: 'Warehouse location chip',
          note: 'Pick it wherever a part is listed, so the picker knows the warehouse, aisle, bay and level.',
          origin: 'custom',
          Component: InventorySpareLocationChip,
        },
        {
          id: 'InventorySpareValueSummary',
          title: 'Inventory value summary',
          note: 'Pick it for the finance view: total value and the categories behind it, including stock that does not move.',
          origin: 'custom',
          uses: ['industrial/domains/ShareBarList.tsx', 'industrial/ValueReadout.tsx'],
          Component: InventorySpareValueSummary,
        },
        {
          id: 'InventorySpareConsumptionTrend',
          title: 'Consumption trend',
          note: 'Pick it to see where a daily-use figure comes from and whether consumption is drifting.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: InventorySpareConsumptionTrend,
        },
        {
          id: 'InventorySpareChemicalInventory',
          title: 'Chemical inventory',
          note: 'Pick it for production chemicals: stock, consumption rate and cover against lead time in one table.',
          origin: 'custom',
          uses: ['industrial/domains/DaysOfCover.tsx', 'industrial/domains/inventory.ts'],
          size: 'md',
          align: 'stretch',
          Component: InventorySpareChemicalInventory,
        },
      ],
    },
    {
      id: 'spares',
      title: 'Spare parts',
      description: 'Parts, the equipment they fit and the work orders that need them.',
      specimens: [
        {
          id: 'InventorySparePartRow',
          title: 'Spare part row',
          note: 'Pick it for one part: number, description, location, the four stock figures, lead time and its level bar.',
          origin: 'custom',
          uses: ['industrial/domains/StockLevelBar.tsx', 'industrial/domains/inventory.ts', 'industrial/ValueReadout.tsx'],
          size: 'lg',
          align: 'stretch',
          Component: InventorySparePartRow,
        },
        {
          id: 'InventorySpareReorderCard',
          title: 'Reorder suggestion',
          note: 'Pick it to propose an order: the quantity, what it costs and the reasoning, with one action to raise it.',
          origin: 'custom',
          uses: ['industrial/domains/inventory.ts', 'industrial/StatusIndicator.tsx', 'industrial/ValueReadout.tsx'],
          Component: InventorySpareReorderCard,
        },
        {
          id: 'InventorySpareCriticalList',
          title: 'Critical spares list',
          note: 'Pick it for the weekly spares review: stock against its levels, what is free, lead time and stock-out risk.',
          origin: 'custom',
          uses: ['industrial/domains/StockLevelBar.tsx', 'industrial/domains/inventory.ts', 'industrial/StatusIndicator.tsx'],
          size: 'full',
          align: 'stretch',
          Component: InventorySpareCriticalList,
        },
        {
          id: 'InventorySpareReservation',
          title: 'Material reservation',
          note: 'Pick it on a work order: each line reserved against required, and what is short before the job starts.',
          origin: 'custom',
          uses: ['industrial/StatusIndicator.tsx'],
          size: 'md',
          align: 'stretch',
          Component: InventorySpareReservation,
        },
        {
          id: 'InventorySpareCycleCount',
          title: 'Cycle-count task',
          note: 'Pick it for counting a bin: system quantity, the counted quantity and the variance as you type.',
          origin: 'custom',
          uses: ['industrial/StatusIndicator.tsx', 'industrial/ValueReadout.tsx'],
          size: 'md',
          align: 'stretch',
          Component: InventorySpareCycleCount,
        },
      ],
    },
    {
      id: 'movements',
      title: 'Movements and deliveries',
      description: 'What came in, what went out and what is on its way.',
      specimens: [
        {
          id: 'InventorySpareMovementLog',
          title: 'Stock movement log',
          note: 'Pick it for traceability: every receipt, issue and transfer with signed quantity, route and reference.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          Component: InventorySpareMovementLog,
        },
        {
          id: 'InventorySpareDeliveryTracker',
          title: 'Delivery tracker',
          note: 'Pick it to follow a purchase order from order to goods receipt.',
          origin: 'custom',
          uses: ['industrial/domains/StageFlow.tsx'],
          size: 'md',
          align: 'stretch',
          Component: InventorySpareDeliveryTracker,
        },
        {
          id: 'InventorySpareDeliveryDelayed',
          title: 'Delayed delivery',
          note: 'Pick it when a shipment is held: the stage says where and why, and the note says who is affected.',
          origin: 'custom',
          uses: ['industrial/domains/StageFlow.tsx'],
          size: 'md',
          align: 'stretch',
          Component: InventorySpareDeliveryDelayed,
        },
      ],
    },
    {
      id: 'blocks',
      title: 'Full blocks',
      description: 'A warehouse dashboard section and a part page.',
      specimens: [
        {
          id: 'InventorySpareWarehouseOverview',
          title: 'Warehouse overview',
          note: 'Pick it as the top of a stores dashboard: headline counts, critical spares at risk and chemical cover.',
          origin: 'custom',
          uses: ['industrial/KpiTile.tsx', 'industrial/domains/StockLevelBar.tsx', 'industrial/domains/DaysOfCover.tsx', 'industrial/StatusIndicator.tsx'],
          size: 'full',
          align: 'stretch',
          Component: InventorySpareWarehouseOverview,
        },
        {
          id: 'InventorySparePartDetail',
          title: 'Part detail',
          note: 'Pick it as the body of a part page: stock and levels, the demand against it and its recent movements.',
          origin: 'custom',
          uses: ['industrial/domains/StockLevelBar.tsx', 'industrial/domains/inventory.ts', 'industrial/ValueReadout.tsx', 'industrial/StatusIndicator.tsx'],
          size: 'full',
          align: 'stretch',
          Component: InventorySparePartDetail,
        },
      ],
    },
  ],
});
