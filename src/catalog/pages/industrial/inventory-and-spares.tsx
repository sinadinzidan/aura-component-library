import { Button } from '@cognite/aura/components/button';
import { CheckboxItem, CheckboxItemControl, CheckboxItemLabel } from '@cognite/aura/components/checkbox';
import {
  IconAlertTriangle,
  IconArrowsExchange,
  IconBox,
  IconBuildingWarehouse,
  IconCircleCheck,
  IconCylinder,
  IconDroplet,
  IconMinus,
  IconPackage,
  IconPlus,
  IconShoppingCart,
  IconTool,
  IconTruck,
} from '@cognite/aura/icons';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { Bars } from '../../../library/kit/Bars';
import { Canvas } from '../../../library/kit/Canvas';
import { DataTable, type DataTableColumn } from '../../../library/kit/DataTable';
import { Donut } from '../../../library/kit/Donut';
import { Grid } from '../../../library/kit/Grid';
import { IconChip } from '../../../library/kit/IconChip';
import { CoverStrip } from '../../../library/kit/inventory-and-spares/CoverStrip';
import { DeliveryTrack, type DeliveryStage } from '../../../library/kit/inventory-and-spares/DeliveryTrack';
import {
  availableStock,
  fillPercent,
  reorderQuantity,
  stockVerdict,
  tankVerdict,
  ullage,
  type StockLevels,
} from '../../../library/kit/inventory-and-spares/stock';
import { StockBar } from '../../../library/kit/inventory-and-spares/StockBar';
import { TankGauge } from '../../../library/kit/inventory-and-spares/TankGauge';
import { ListRow } from '../../../library/kit/ListRow';
import { Panel } from '../../../library/kit/Panel';
import { RingGauge } from '../../../library/kit/RingGauge';
import { SectionHeader } from '../../../library/kit/SectionHeader';
import { Stat } from '../../../library/kit/Stat';
import { StatGroup } from '../../../library/kit/StatGroup';
import { StatusPill } from '../../../library/kit/StatusPill';
import { TagId } from '../../../library/kit/TagId';
import type { Tone } from '../../../library/kit/tones';
import { TrendArea } from '../../../library/kit/TrendArea';
import type { LookId } from '../../../library/looks/looks';
import { LookScope } from '../../../library/looks/LookScope';
import { makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './inventory-and-spares.tsx?raw';

type InventorySparesTank = { tag: string; product: string; volume: number; capacity: number; outOfService?: boolean };

/** The Nordkapp tank farm. Volumes in m³. */
const INVENTORY_SPARES_TANKS: InventorySparesTank[] = [
  { tag: '27-TA-3001', product: 'Stabilised condensate', volume: 3400, capacity: 5000 },
  { tag: '27-TA-3002', product: 'Stabilised condensate', volume: 4410, capacity: 5000 },
  { tag: '27-TA-3003', product: 'Off-spec condensate', volume: 0, capacity: 1500, outOfService: true },
  { tag: '44-TA-4401', product: 'Produced water', volume: 1120, capacity: 2000 },
  { tag: '62-TA-6201', product: 'Methanol', volume: 184, capacity: 400 },
  { tag: '62-TA-6205', product: 'Diesel', volume: 21, capacity: 250 },
];

type InventorySparesPart = StockLevels & {
  partNumber: string;
  description: string;
  serves: string;
  location: string;
  leadTimeWeeks: number;
  /** Thousand NOK per unit. */
  unitCost: number;
};

/** Critical spares, highest stock-out risk first. */
const INVENTORY_SPARES_PARTS: InventorySparesPart[] = [
  { partNumber: '104-2291-DE', description: 'Bearing, drive end, recompressor', serves: '23-KA-9103', location: 'WH1 · A-04-2', onHand: 1, reserved: 1, onOrder: 2, min: 2, reorderPoint: 3, max: 4, leadTimeWeeks: 10, unitCost: 86 },
  { partNumber: '104-3310-DGS', description: 'Dry gas seal cartridge', serves: '23-KA-9101', location: 'WH1 · C-01-1', onHand: 2, reserved: 0, onOrder: 0, min: 1, reorderPoint: 2, max: 4, leadTimeWeeks: 16, unitCost: 420 },
  { partNumber: '118-0457-TB', description: 'Tube bundle gasket set', serves: '23-HA-9114', location: 'WH1 · B-11-3', onHand: 1, reserved: 1, onOrder: 0, min: 1, reorderPoint: 1, max: 2, leadTimeWeeks: 6, unitCost: 14 },
  { partNumber: '104-2271-MS', description: 'Mechanical seal, export pump', serves: '27-PA-2001A', location: 'WH1 · A-07-1', onHand: 6, reserved: 1, onOrder: 0, min: 2, reorderPoint: 4, max: 10, leadTimeWeeks: 8, unitCost: 38 },
  { partNumber: '131-9002-TT', description: 'Temperature transmitter, RTD', serves: 'Plant-wide', location: 'WH1 · D-02-4', onHand: 9, reserved: 1, onOrder: 0, min: 4, reorderPoint: 6, max: 12, leadTimeWeeks: 3, unitCost: 9 },
];

const INVENTORY_SPARES_BEARING = INVENTORY_SPARES_PARTS[0];

const INVENTORY_SPARES_PART_COLUMNS: DataTableColumn<InventorySparesPart>[] = [
  {
    id: 'part',
    header: 'Part',
    cell: (part) => (
      <span className="flex flex-col">
        <span className="font-medium">{part.description}</span>
        <TagId>{part.partNumber}</TagId>
      </span>
    ),
  },
  { id: 'serves', header: 'Serves', nowrap: true, cell: (part) => <TagId>{part.serves}</TagId> },
  { id: 'location', header: 'Location', muted: true, nowrap: true, cell: (part) => part.location },
  { id: 'free', header: 'Free', numeric: true, cell: (part) => availableStock(part) },
  { id: 'onHand', header: 'On hand', numeric: true, muted: true, cell: (part) => part.onHand },
  { id: 'min', header: 'Min', numeric: true, muted: true, cell: (part) => part.min },
  { id: 'lead', header: 'Lead time', numeric: true, nowrap: true, cell: (part) => `${part.leadTimeWeeks} wk` },
  {
    id: 'state',
    header: 'State',
    nowrap: true,
    cell: (part) => {
      const verdict = stockVerdict(part);
      return <StatusPill tone={verdict.tone}>{verdict.word}</StatusPill>;
    },
  },
];

type InventorySparesChemical = { name: string; onHand: number; dailyUse: number; leadTimeDays: number };

/** Production chemicals: stock and average daily use in m³. */
const INVENTORY_SPARES_CHEMICALS: InventorySparesChemical[] = [
  { name: 'Methanol', onHand: 184, dailyUse: 9.4, leadTimeDays: 10 },
  { name: 'Corrosion inhibitor', onHand: 26, dailyUse: 1.6, leadTimeDays: 14 },
  { name: 'Diesel', onHand: 21, dailyUse: 3.2, leadTimeDays: 9 },
];

const INVENTORY_SPARES_METHANOL_WEEKS = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10', 'W11', 'W12'];

const INVENTORY_SPARES_METHANOL_USE = [58, 61, 64, 60, 66, 71, 69, 74, 72, 63, 68, 66];

const INVENTORY_SPARES_LEVEL_RAW = makeValues({ seed: 27, points: 29, base: 52, amplitude: 7, noise: 1.2, cycles: 2, drift: 20, min: 20, max: 95, decimals: 0 });

/** The same trend, tilted so it ends on the level the tank shows now. */
const INVENTORY_SPARES_LEVEL = INVENTORY_SPARES_LEVEL_RAW.map((value, index, all) => Math.round(value + ((88 - all[all.length - 1]) * index) / (all.length - 1)));

const INVENTORY_SPARES_LEVEL_LABELS = INVENTORY_SPARES_LEVEL.map((_, index) => `${6 + Math.floor(index / 4)} Mar`);

type InventorySparesMovement = { id: string; time: string; kind: 'Receipt' | 'Issue' | 'Transfer'; description: string; reference: string; quantity: number; tone: Tone };

const INVENTORY_SPARES_MOVEMENTS: InventorySparesMovement[] = [
  { id: 'm-1', time: '13:42', kind: 'Issue', description: 'Bearing, drive end, recompressor', reference: 'WO-104482 · Tomás Barros', quantity: -1, tone: 'amber' },
  { id: 'm-2', time: '11:05', kind: 'Receipt', description: 'Temperature transmitter, RTD', reference: 'PO 4500128790 · 4 pcs inspected', quantity: 4, tone: 'green' },
  { id: 'm-3', time: '09:30', kind: 'Transfer', description: 'Mechanical seal, export pump', reference: 'WH2 to WH1 · A-07-1', quantity: 2, tone: 'blue' },
  { id: 'm-4', time: '08:12', kind: 'Issue', description: 'Tube bundle gasket set', reference: 'WO-104471 · Magnus Solberg', quantity: -1, tone: 'amber' },
];

const INVENTORY_SPARES_STAGES: DeliveryStage[] = [
  { id: 'ordered', name: 'Ordered', when: '3 Mar', detail: 'PO 4500128841 · 2 bearings', state: 'done' },
  { id: 'shipped', name: 'Shipped from supplier', when: '7 Mar', detail: 'Schaeffler, Schweinfurt', state: 'done' },
  { id: 'customs', name: 'Customs clearance', when: 'Since 9 Mar', detail: 'Held: material certificate missing', state: 'delayed' },
  { id: 'transport', name: 'Transport to Hammerfest', when: 'Expected 17 Mar', state: 'upcoming' },
  { id: 'received', name: 'Received and inspected', when: 'Expected 19 Mar', detail: '5 days later than promised', state: 'upcoming' },
];

type InventorySparesPick = { id: string; description: string; partNumber: string; location: string; quantity: number };

const INVENTORY_SPARES_PICKS: InventorySparesPick[] = [
  { id: 'p-1', description: 'Bearing, drive end, recompressor', partNumber: '104-2291-DE', location: 'A-04-2', quantity: 1 },
  { id: 'p-2', description: 'Bearing housing O-ring kit', partNumber: '104-2295-OR', location: 'A-04-5', quantity: 2 },
  { id: 'p-3', description: 'Lube oil filter element', partNumber: '109-1120-FE', location: 'B-02-1', quantity: 1 },
];

/** One sheet of the page: a look scope with its canvas. Without a look it follows the app's look. */
function InventorySparesSheet({ look, children }: { look?: LookId; children: ReactNode }) {
  const canvas = <Canvas className="h-full">{children}</Canvas>;
  return look ? (
    <LookScope look={look} className="h-full w-full">
      {canvas}
    </LookScope>
  ) : (
    <div className="h-full w-full">{canvas}</div>
  );
}

function InventorySparesTankFarm() {
  const [selected, setSelected] = useState('27-TA-3002');
  const tank = INVENTORY_SPARES_TANKS.find((item) => item.tag === selected) ?? INVENTORY_SPARES_TANKS[0];
  return (
    <InventorySparesSheet>
      <Panel
        title="Tank farm"
        subtitle="Six tanks · levels at 14:00 · dashed lines are the low and high limits"
        icon={<IconCylinder />}
        footer={
          <span className="text-sm text-(--kit-text-2)">
            Selected: {tank.product}, <TagId>{tank.tag}</TagId>. {tank.outOfService ? 'Out of service for inspection until 21 March.' : `Room for ${ullage(tank.volume, tank.capacity).toLocaleString('en-GB')} m³ before the tank is full.`}
          </span>
        }
      >
        <div className="grid grid-cols-6 gap-5">
          {INVENTORY_SPARES_TANKS.map((item) => (
            <TankGauge key={item.tag} {...item} selected={item.tag === selected} onSelect={() => setSelected(item.tag)} />
          ))}
        </div>
      </Panel>
    </InventorySparesSheet>
  );
}

function InventorySparesTankStates() {
  return (
    <InventorySparesSheet>
      <Grid>
        <Panel className="col-span-4" title="Normal" subtitle="Between the limits" actions={<StatusPill tone="success">Normal</StatusPill>}>
          <TankGauge size="lg" {...INVENTORY_SPARES_TANKS[0]} />
        </Panel>
        <Panel className="col-span-4" tone="critical" title="High level" subtitle="Above 85 %: plan an offload" actions={<StatusPill tone="critical">High level</StatusPill>}>
          <TankGauge size="lg" {...INVENTORY_SPARES_TANKS[1]} />
        </Panel>
        <Panel className="col-span-4" title="Out of service" subtitle="Drained for inspection" actions={<StatusPill tone="neutral">Out of service</StatusPill>}>
          <TankGauge size="lg" {...INVENTORY_SPARES_TANKS[2]} />
        </Panel>
      </Grid>
    </InventorySparesSheet>
  );
}

function InventorySparesTankDetail() {
  const tank = INVENTORY_SPARES_TANKS[1];
  const percent = fillPercent(tank.volume, tank.capacity);
  return (
    <InventorySparesSheet>
      <Grid>
        <Panel className="col-span-3" title={tank.product} subtitle="Level now" actions={<StatusPill tone="critical">{tankVerdict(percent, 15, 85).word}</StatusPill>}>
          <TankGauge size="lg" {...tank} />
        </Panel>
        <Panel className="col-span-9" title="Level, last 7 days" subtitle="27-TA-3002 · percent of capacity" icon={<IconDroplet />}>
          <TrendArea
            label="Tank level over the last 7 days against the high and low limits"
            labels={INVENTORY_SPARES_LEVEL_LABELS}
            unit="%"
            height={250}
            yDomain={[0, 100]}
            series={[{ id: 'level', label: 'Level', values: INVENTORY_SPARES_LEVEL, tone: 'accent' }]}
            limits={[
              { value: 85, label: 'High', tone: 'critical' },
              { value: 15, label: 'Low', tone: 'warning' },
            ]}
            notes="Filling at about 110 m³ a day since the offload on 8 March. At this rate the tank is full on Saturday; the next tanker is booked for Friday."
          />
        </Panel>
      </Grid>
    </InventorySparesSheet>
  );
}

function InventorySparesStockBars() {
  return (
    <InventorySparesSheet>
      <Panel title="Stock levels" subtitle="Free, reserved and on order against min, reorder point and max" icon={<IconPackage />}>
        <div className="flex flex-col gap-6">
          <StockBar label={INVENTORY_SPARES_PARTS[3].description} {...INVENTORY_SPARES_PARTS[3]} />
          <StockBar label={INVENTORY_SPARES_PARTS[1].description} {...INVENTORY_SPARES_PARTS[1]} />
          <StockBar label={INVENTORY_SPARES_BEARING.description} {...INVENTORY_SPARES_BEARING} />
        </div>
      </Panel>
    </InventorySparesSheet>
  );
}

function InventorySparesCover() {
  return (
    <InventorySparesSheet>
      <Panel title="Days of cover" subtitle="One cell per day ahead · the gap marks the delivery lead time" icon={<IconDroplet />}>
        <div className="flex flex-col gap-6">
          {INVENTORY_SPARES_CHEMICALS.map((chemical) => (
            <CoverStrip key={chemical.name} label={chemical.name} onHand={chemical.onHand} dailyUse={chemical.dailyUse} unit="m³" leadTimeDays={chemical.leadTimeDays} />
          ))}
        </div>
      </Panel>
    </InventorySparesSheet>
  );
}

function InventorySparesValue() {
  return (
    <InventorySparesSheet>
      <Grid>
        <Panel className="col-span-5" title="Inventory value" subtitle="Warehouse 1, million NOK">
          <Donut
            label="Inventory value by category, million NOK"
            centerValue="48.2"
            centerCaption="MNOK"
            decimals={1}
            segments={[
              { label: 'Rotating equipment', value: 21.4, tone: 'blue' },
              { label: 'Instruments', value: 9.8, tone: 'teal' },
              { label: 'Valves', value: 8.6, tone: 'purple' },
              { label: 'Consumables', value: 5.1, tone: 'amber' },
              { label: 'Other', value: 3.3, tone: 'neutral' },
            ]}
          />
        </Panel>
        <Panel className="col-span-7" title="Methanol consumption" subtitle="m³ per week, last 12 weeks">
          <Bars
            label="Methanol consumption per week over the last 12 weeks, against the 12-week average"
            categories={INVENTORY_SPARES_METHANOL_WEEKS}
            series={[{ id: 'use', label: 'Consumption', values: INVENTORY_SPARES_METHANOL_USE, tone: 'teal' }]}
            unit="m³"
            limit={{ value: 66, label: 'Average', tone: 'neutral' }}
            height={210}
          />
        </Panel>
      </Grid>
    </InventorySparesSheet>
  );
}

function InventorySparesPartsTable() {
  return (
    <InventorySparesSheet>
      <Panel title="Critical spares" subtitle="Highest stock-out risk first" icon={<IconTool />} padding="none" actions={<Button size="sm" variant="secondary">Export list</Button>}>
        <DataTable
          label="Critical spares"
          flush
          columns={INVENTORY_SPARES_PART_COLUMNS}
          rows={INVENTORY_SPARES_PARTS}
          rowKey={(part) => part.partNumber}
          rowTone={(part) => {
            const tone = stockVerdict(part).tone;
            return tone === 'success' ? undefined : tone;
          }}
        />
      </Panel>
    </InventorySparesSheet>
  );
}

function InventorySparesReorder() {
  const part = INVENTORY_SPARES_PARTS[1];
  const suggested = reorderQuantity(part);
  const [quantity, setQuantity] = useState(suggested);
  const [ordered, setOrdered] = useState(false);
  return (
    <InventorySparesSheet>
      <Panel
        title="Reorder suggestion"
        subtitle={part.description}
        icon={<IconShoppingCart />}
        tone="warning"
        actions={<StatusPill tone={ordered ? 'success' : 'warning'}>{ordered ? 'Requested' : stockVerdict(part).word}</StatusPill>}
        footer={
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-(--kit-text-2) tabular-nums">
              {quantity} × {part.unitCost} kNOK = <span className="font-semibold text-(--kit-text)">{quantity * part.unitCost} kNOK</span> · arrives in {part.leadTimeWeeks} weeks
            </span>
            <Button size="sm" disabled={ordered || quantity === 0} onClick={() => setOrdered(true)}>
              Request purchase
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-5">
          <StockBar label="Stock now" hideVerdict {...part} />
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Order quantity</p>
              <p className="text-xs text-(--kit-text-2)">Suggested {suggested} to reach the maximum of {part.max}</p>
            </div>
            <div className="flex items-center gap-3">
              <Button size="sm" variant="secondary" aria-label="One fewer" disabled={ordered || quantity === 0} onClick={() => setQuantity(quantity - 1)}>
                <IconMinus />
              </Button>
              <span aria-live="polite" className="w-8 text-center text-2xl font-semibold tabular-nums">
                {quantity}
              </span>
              <Button size="sm" variant="secondary" aria-label="One more" disabled={ordered || quantity >= part.max} onClick={() => setQuantity(quantity + 1)}>
                <IconPlus />
              </Button>
            </div>
          </div>
        </div>
      </Panel>
    </InventorySparesSheet>
  );
}

function InventorySparesReservation() {
  const [picked, setPicked] = useState<string[]>(['p-1']);
  const toggle = (id: string, on: boolean) => setPicked(on ? [...picked, id] : picked.filter((item) => item !== id));
  return (
    <InventorySparesSheet>
      <Panel
        title="Material reservation"
        subtitle="WO-104482 · Inspect recompressor drive-end bearing"
        icon={<IconBox />}
        actions={<StatusPill tone={picked.length === INVENTORY_SPARES_PICKS.length ? 'success' : 'info'}>{picked.length} of {INVENTORY_SPARES_PICKS.length} picked</StatusPill>}
        footer={
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-(--kit-text-2)">Needed at the compressor hall by 16:00</span>
            <Button size="sm" disabled={picked.length < INVENTORY_SPARES_PICKS.length}>
              Hand over
            </Button>
          </div>
        }
      >
        <div className="flex flex-col">
          {INVENTORY_SPARES_PICKS.map((pick) => (
            <ListRow
              key={pick.id}
              tone={picked.includes(pick.id) ? 'success' : 'neutral'}
              leading={
                <CheckboxItem>
                  <CheckboxItemControl checked={picked.includes(pick.id)} onCheckedChange={(checked) => toggle(pick.id, checked === true)} />
                  <CheckboxItemLabel>
                    <span className="sr-only">Picked: {pick.description}</span>
                  </CheckboxItemLabel>
                </CheckboxItem>
              }
              title={pick.description}
              meta={
                <>
                  <TagId>{pick.partNumber}</TagId> · shelf {pick.location}
                </>
              }
              trailing={<span className="text-base font-semibold tabular-nums">{pick.quantity} pcs</span>}
            />
          ))}
        </div>
      </Panel>
    </InventorySparesSheet>
  );
}

function InventorySparesMovements() {
  return (
    <InventorySparesSheet>
      <Panel title="Stock movements" subtitle="Warehouse 1 · today" icon={<IconArrowsExchange />} actions={<Button size="sm" variant="ghost">View all</Button>}>
        <div className="flex flex-col">
          {INVENTORY_SPARES_MOVEMENTS.map((movement) => (
            <ListRow
              key={movement.id}
              leading={
                <IconChip tone={movement.tone} size="sm">
                  {movement.kind === 'Receipt' ? <IconPlus /> : movement.kind === 'Issue' ? <IconMinus /> : <IconArrowsExchange />}
                </IconChip>
              }
              title={movement.description}
              meta={`${movement.kind} · ${movement.reference}`}
              trailing={
                <span className="flex flex-col items-end">
                  <span className="text-base font-semibold tabular-nums">
                    {movement.quantity > 0 ? '+' : '−'}
                    {Math.abs(movement.quantity)} pcs
                  </span>
                  <span className="text-xs text-(--kit-text-2) tabular-nums">{movement.time}</span>
                </span>
              }
            />
          ))}
        </div>
      </Panel>
    </InventorySparesSheet>
  );
}

function InventorySparesDelivery() {
  return (
    <InventorySparesSheet>
      <Panel
        title="Delivery of drive-end bearings"
        subtitle="2 pcs · needed for WO-104482"
        icon={<IconTruck />}
        tone="critical"
        actions={<StatusPill tone="critical" icon={<IconAlertTriangle />}>5 days late</StatusPill>}
        footer={<span className="text-sm text-(--kit-text-2)">The one bearing on the shelf is reserved. A second failure before 19 March cannot be covered.</span>}
      >
        <DeliveryTrack label="Delivery of drive-end bearings, PO 4500128841" stages={INVENTORY_SPARES_STAGES} />
      </Panel>
    </InventorySparesSheet>
  );
}

function InventorySparesConsole() {
  return (
    <InventorySparesSheet look="console">
      <Grid>
        <StatGroup className="col-span-12" columns={4} label="Warehouse figures">
          <Stat variant="plain" label="Parts below minimum" value={1} tone="critical" target="Bearing, drive end" />
          <Stat variant="plain" label="At reorder point" value={2} tone="warning" target="Gas seal, gasket set" />
          <Stat variant="plain" label="Tanks at high level" value={1} tone="critical" target="27-TA-3002 at 88 %" />
          <Stat variant="plain" label="Late deliveries" value={1} tone="warning" target="PO 4500128841, 5 days" />
        </StatGroup>
        <Panel className="col-span-4" title="Condensate tanks" subtitle="Level, m³">
          <div className="grid grid-cols-2 gap-4">
            <TankGauge {...INVENTORY_SPARES_TANKS[0]} />
            <TankGauge {...INVENTORY_SPARES_TANKS[1]} />
          </div>
        </Panel>
        <Panel className="col-span-8" title="Critical spares" subtitle="Free stock against minimum" padding="none">
          <DataTable
            label="Critical spares"
            flush
            columns={INVENTORY_SPARES_PART_COLUMNS.filter((column) => column.id !== 'location' && column.id !== 'onHand')}
            rows={INVENTORY_SPARES_PARTS}
            rowKey={(part) => part.partNumber}
            rowTone={(part) => {
              const tone = stockVerdict(part).tone;
              return tone === 'success' ? undefined : tone;
            }}
          />
        </Panel>
      </Grid>
    </InventorySparesSheet>
  );
}

function InventorySparesPoster() {
  return (
    <InventorySparesSheet look="poster">
      <Grid>
        <Stat className="col-span-4" size="hero" tone="pink" label="Below minimum" value={1} unit="part" />
        <Stat className="col-span-4" size="hero" tone="amber" label="Reorder now" value={2} unit="parts" />
        <Stat className="col-span-4" size="hero" tone="green" label="Healthy" value={2} unit="parts" />
        <Panel className="col-span-12" title="Critical spares on the shelf">
          <div className="grid grid-cols-2 gap-x-10 gap-y-7">
            {INVENTORY_SPARES_PARTS.slice(0, 4).map((part) => (
              <StockBar key={part.partNumber} label={part.description} {...part} />
            ))}
          </div>
        </Panel>
      </Grid>
    </InventorySparesSheet>
  );
}

function InventorySparesBlueprint() {
  return (
    <InventorySparesSheet look="blueprint">
      <Grid>
        <Panel className="col-span-8" title="Tank farm elevation" subtitle="Drawing NK-62-L-001 · levels at 14:00">
          <div className="grid grid-cols-4 gap-6">
            <TankGauge size="lg" {...INVENTORY_SPARES_TANKS[0]} />
            <TankGauge size="lg" {...INVENTORY_SPARES_TANKS[1]} />
            <TankGauge size="lg" {...INVENTORY_SPARES_TANKS[3]} />
            <TankGauge size="lg" {...INVENTORY_SPARES_TANKS[4]} />
          </div>
        </Panel>
        <Panel className="col-span-4" title="Cover schedule" subtitle="Days ahead, 28-day horizon">
          <div className="flex flex-col gap-6">
            {INVENTORY_SPARES_CHEMICALS.map((chemical) => (
              <CoverStrip key={chemical.name} label={chemical.name} onHand={chemical.onHand} dailyUse={chemical.dailyUse} unit="m³" leadTimeDays={chemical.leadTimeDays} />
            ))}
          </div>
        </Panel>
      </Grid>
    </InventorySparesSheet>
  );
}

function InventorySparesSignal() {
  return (
    <InventorySparesSheet look="signal">
      <Grid>
        <Stat className="col-span-3" size="lg" tone="success" state="Normal" stateIcon={<IconCircleCheck />} label="27-TA-3001 · Condensate" value={68} unit="%" target="Room for 1,600 m³" />
        <Stat className="col-span-3" size="lg" tone="critical" state="High" stateIcon={<IconAlertTriangle />} label="27-TA-3002 · Condensate" value={88} unit="%" target="Full on Saturday" />
        <Stat className="col-span-3" size="lg" tone="success" state="Normal" stateIcon={<IconCircleCheck />} label="62-TA-6201 · Methanol" value={46} unit="%" target="19 days of cover" />
        <Stat className="col-span-3" size="lg" tone="warning" state="Low" stateIcon={<IconAlertTriangle />} label="62-TA-6205 · Diesel" value={8} unit="%" target="6 days of cover" />
      </Grid>
    </InventorySparesSheet>
  );
}

function InventorySparesGlass() {
  return (
    <InventorySparesSheet look="glass">
      <Grid>
        <Panel className="col-span-8" title="Tank levels" subtitle="Percent of capacity">
          <div className="flex h-full items-center justify-around gap-4">
            <RingGauge label="Condensate A" value={68} tone="sky" size={128} />
            <RingGauge label="Condensate B" value={88} tone="pink" size={128} />
            <RingGauge label="Produced water" value={56} tone="teal" size={128} />
            <RingGauge label="Methanol" value={46} tone="purple" size={128} />
          </div>
        </Panel>
        <Stat
          className="col-span-4"
          size="hero"
          label="Stock value"
          value={48.2}
          decimals={1}
          unit="MNOK"
          icon={<IconBuildingWarehouse />}
          tone="sky"
          delta={{ value: -1.3, good: 'down', caption: 'vs last month' }}
          target="2,140 stocked parts"
        />
      </Grid>
    </InventorySparesSheet>
  );
}

function InventorySparesSoft() {
  return (
    <InventorySparesSheet look="soft">
      <Grid>
        {INVENTORY_SPARES_PARTS.slice(0, 3).map((part, index) => {
          const verdict = stockVerdict(part);
          const tones: Tone[] = ['pink', 'amber', 'blue'];
          return (
            <Panel key={part.partNumber} className="col-span-4" tone={tones[index]} title={part.description} subtitle={`Shelf ${part.location}`} footer={<StatusPill tone={verdict.tone}>{verdict.word}</StatusPill>}>
              <StockBar label="On the shelf" hideVerdict {...part} />
            </Panel>
          );
        })}
      </Grid>
    </InventorySparesSheet>
  );
}

function InventorySparesWarehouse() {
  return (
    <InventorySparesSheet>
      <Grid>
        <SectionHeader
          className="col-span-12"
          size="sm"
          level={4}
          title="Warehouse 1"
          description="Hammerfest · 2,140 stocked parts · counted 2 March"
          actions={
            <Button size="sm" variant="secondary">
              <IconShoppingCart />
              Reorder list
            </Button>
          }
        />
        <Stat className="col-span-3" label="Stock value" value={48.2} decimals={1} unit="MNOK" icon={<IconBuildingWarehouse />} tone="blue" delta={{ value: -1.3, good: 'down', caption: 'vs last month' }} />
        <Stat className="col-span-3" label="Service level" value={96.8} decimals={1} unit="%" icon={<IconCircleCheck />} tone="green" delta={{ value: 0.6, unit: ' pts', caption: 'vs last month' }} target="Target 97 %" />
        <Stat className="col-span-3" label="Below minimum" value={1} unit="critical part" icon={<IconAlertTriangle />} tone="critical" target="Bearing, drive end" />
        <Stat className="col-span-3" label="Late deliveries" value={1} icon={<IconTruck />} tone="amber" target="5 days, held in customs" />
        <Panel className="col-span-8" title="Critical spares" subtitle="Highest stock-out risk first" padding="none">
          <DataTable
            label="Critical spares"
            flush
            columns={INVENTORY_SPARES_PART_COLUMNS.filter((column) => column.id !== 'onHand' && column.id !== 'min')}
            rows={INVENTORY_SPARES_PARTS}
            rowKey={(part) => part.partNumber}
            rowTone={(part) => {
              const tone = stockVerdict(part).tone;
              return tone === 'success' ? undefined : tone;
            }}
          />
        </Panel>
        <Panel className="col-span-4" title="Chemicals" subtitle="Days of cover against lead time">
          <div className="flex flex-col gap-5">
            {INVENTORY_SPARES_CHEMICALS.map((chemical) => (
              <CoverStrip key={chemical.name} label={chemical.name} onHand={chemical.onHand} dailyUse={chemical.dailyUse} unit="m³" leadTimeDays={chemical.leadTimeDays} horizonDays={21} />
            ))}
          </div>
        </Panel>
      </Grid>
    </InventorySparesSheet>
  );
}

function InventorySparesPartDetail() {
  const part = INVENTORY_SPARES_BEARING;
  const verdict = stockVerdict(part);
  return (
    <InventorySparesSheet>
      <Grid>
        <SectionHeader
          className="col-span-12"
          size="sm"
          level={4}
          title={part.description}
          description={`${part.partNumber} · serves ${part.serves} · shelf ${part.location}`}
          actions={
            <StatusPill tone={verdict.tone} icon={<IconAlertTriangle />}>
              {verdict.word}
            </StatusPill>
          }
        />
        <Panel className="col-span-7" title="Stock" subtitle="Free, reserved and on order">
          <div className="flex flex-col gap-6">
            <StatGroup joined columns={4} label="Stock figures">
              <Stat variant="plain" size="sm" label="Free" value={availableStock(part)} tone="critical" />
              <Stat variant="plain" size="sm" label="Reserved" value={part.reserved} />
              <Stat variant="plain" size="sm" label="On order" value={part.onOrder} />
              <Stat variant="plain" size="sm" label="Lead time" value={part.leadTimeWeeks} unit="wk" />
            </StatGroup>
            <StockBar label="On the shelf" {...part} />
            <ListRow
              tone="info"
              leading={
                <IconChip tone="info" size="sm">
                  <IconTool />
                </IconChip>
              }
              title="Reserved for WO-104482"
              meta="Inspect recompressor drive-end bearing · Tomás Barros"
              trailing={<span className="text-base font-semibold tabular-nums">1 pcs</span>}
            />
          </div>
        </Panel>
        <Panel
          className="col-span-5"
          title="Incoming"
          subtitle="PO 4500128841 · 2 pcs"
          icon={<IconTruck />}
          actions={<StatusPill tone="critical">5 days late</StatusPill>}
        >
          <DeliveryTrack label="Incoming delivery, PO 4500128841" stages={INVENTORY_SPARES_STAGES} />
        </Panel>
      </Grid>
    </InventorySparesSheet>
  );
}

export default definePage({
  id: 'inventory-and-spares',
  title: 'Inventory and spares',
  summary:
    'What is in the tanks and on the shelves: tank levels against their limits, stock against minimum and reorder point, days of cover against lead time, and deliveries on their way. Each part is shown in several looks.',
  guidance: {
    use: [
      'Show free stock, not only stock on hand: reservations are already spent.',
      'Mark minimum, reorder point and maximum on the bar and name them.',
      'Measure cover in days against the delivery lead time.',
      'Say the state in a word next to every level.',
    ],
    avoid: [
      'A fill colour alone to say a tank is high or low.',
      'A level for a tank that is out of service.',
      'Hiding stock on order: it changes the decision to reorder.',
      'A delivery date without saying it has slipped.',
    ],
  },
  source,
  sections: [
    {
      id: 'tanks',
      title: 'Tank inventory',
      description: 'Levels drawn as vessels with their limits.',
      specimens: [
        {
          id: 'InventorySparesTankFarm',
          title: 'Tank farm',
          note: 'Pick it for the terminal overview: every tank side by side, selectable, with its level, volume and state.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/inventory-and-spares/TankGauge.tsx', 'kit/inventory-and-spares/stock.ts', 'kit/Panel.tsx'],
          Component: InventorySparesTankFarm,
        },
        {
          id: 'InventorySparesTankStates',
          title: 'Normal, high level, out of service',
          note: 'Pick the large vessel when one tank is the subject; a tank out of service shows no level at all.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/inventory-and-spares/TankGauge.tsx', 'kit/StatusPill.tsx'],
          Component: InventorySparesTankStates,
        },
        {
          id: 'InventorySparesTankDetail',
          title: 'Tank with level trend',
          note: 'Pick it to plan an offload: the level now beside a week of history against the limits.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/inventory-and-spares/TankGauge.tsx', 'kit/TrendArea.tsx'],
          Component: InventorySparesTankDetail,
        },
      ],
    },
    {
      id: 'stock-and-cover',
      title: 'Stock levels and cover',
      description: 'How much is free to use and how long it lasts.',
      specimens: [
        {
          id: 'InventorySparesStockBars',
          title: 'Stock level bars',
          note: 'Pick it to compare parts: healthy, at the reorder point and below minimum read at a glance.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/inventory-and-spares/StockBar.tsx', 'kit/inventory-and-spares/stock.ts'],
          Component: InventorySparesStockBars,
        },
        {
          id: 'InventorySparesCover',
          title: 'Days of cover',
          note: 'Pick it for consumables: the strip shows whether stock lasts until a new delivery can arrive.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/inventory-and-spares/CoverStrip.tsx'],
          Component: InventorySparesCover,
        },
        {
          id: 'InventorySparesValue',
          title: 'Value and consumption',
          note: 'Pick it for the monthly review: where the money sits and how fast a chemical is used.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/Donut.tsx', 'kit/Bars.tsx', 'kit/Panel.tsx'],
          Component: InventorySparesValue,
        },
      ],
    },
    {
      id: 'spare-parts',
      title: 'Spare parts',
      description: 'Finding, reordering and picking parts.',
      specimens: [
        {
          id: 'InventorySparesPartsTable',
          title: 'Critical spares table',
          note: 'Pick the table when parts are compared on free stock, minimum and lead time, sorted by risk.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/DataTable.tsx', 'kit/StatusPill.tsx', 'kit/TagId.tsx'],
          Component: InventorySparesPartsTable,
        },
        {
          id: 'InventorySparesReorder',
          title: 'Reorder suggestion',
          note: 'Pick it where the planner decides: stock now, a suggested quantity to adjust, cost and arrival.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/inventory-and-spares/StockBar.tsx', 'kit/inventory-and-spares/stock.ts', 'kit/Panel.tsx'],
          Component: InventorySparesReorder,
        },
        {
          id: 'InventorySparesReservation',
          title: 'Material reservation',
          note: 'Pick it for the storekeeper: the parts a work order needs, ticked off as they are picked.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/ListRow.tsx', 'kit/Panel.tsx'],
          Component: InventorySparesReservation,
        },
      ],
    },
    {
      id: 'movements-and-deliveries',
      title: 'Movements and deliveries',
      description: 'What went in and out, and what is on its way.',
      specimens: [
        {
          id: 'InventorySparesMovements',
          title: 'Stock movement log',
          note: 'Pick it to answer where a part went: receipts, issues and transfers with signed quantities.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/ListRow.tsx', 'kit/IconChip.tsx'],
          Component: InventorySparesMovements,
        },
        {
          id: 'InventorySparesDelivery',
          title: 'Delayed delivery',
          note: 'Pick the track when a delivery matters to a job: each stage with its date, and the delay with its reason.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/inventory-and-spares/DeliveryTrack.tsx', 'kit/Panel.tsx'],
          Component: InventorySparesDelivery,
        },
      ],
    },
    {
      id: 'looks',
      title: 'In other looks',
      description: 'The same stock as a console, poster blocks, a drawing, state tiles, rings and pastel cards.',
      specimens: [
        {
          id: 'InventorySparesConsole',
          title: 'Console stock board',
          note: 'Pick it for the logistics desk: counts in a strip, square tanks and a dense table.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/StatGroup.tsx', 'kit/DataTable.tsx', 'kit/inventory-and-spares/TankGauge.tsx', 'looks/LookScope.tsx'],
          Component: InventorySparesConsole,
        },
        {
          id: 'InventorySparesPoster',
          title: 'Poster shelf board',
          note: 'Pick it for the screen in the warehouse: three counts and the critical parts as thick bars.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/Stat.tsx', 'kit/inventory-and-spares/StockBar.tsx', 'looks/LookScope.tsx'],
          Component: InventorySparesPoster,
        },
        {
          id: 'InventorySparesBlueprint',
          title: 'Blueprint tank elevation',
          note: 'Pick it for a drawing-style overview: outlined vessels with hatched levels and a cover schedule.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/inventory-and-spares/TankGauge.tsx', 'kit/inventory-and-spares/CoverStrip.tsx', 'looks/LookScope.tsx'],
          Component: InventorySparesBlueprint,
        },
        {
          id: 'InventorySparesSignal',
          title: 'Signal tank tiles',
          note: 'Pick it for a wall screen at the loading bay: one tile per tank, filled with its state.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/Stat.tsx', 'looks/LookScope.tsx'],
          Component: InventorySparesSignal,
        },
        {
          id: 'InventorySparesGlass',
          title: 'Glass level rings',
          note: 'Pick it for an executive view: tank levels as rings beside the value of the stock.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/RingGauge.tsx', 'kit/Stat.tsx', 'looks/LookScope.tsx'],
          Component: InventorySparesGlass,
        },
        {
          id: 'InventorySparesSoft',
          title: 'Soft part cards',
          note: 'Pick it for a self-service kiosk: one roomy card per part with its shelf and state.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/Panel.tsx', 'kit/inventory-and-spares/StockBar.tsx', 'looks/LookScope.tsx'],
          Component: InventorySparesSoft,
        },
      ],
    },
    {
      id: 'in-use',
      title: 'In use',
      description: 'Compositions that can be dropped into a product.',
      specimens: [
        {
          id: 'InventorySparesWarehouse',
          title: 'Warehouse overview',
          note: 'Pick it as the landing page for materials: four figures, the critical spares and chemical cover.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/Stat.tsx', 'kit/DataTable.tsx', 'kit/inventory-and-spares/CoverStrip.tsx', 'kit/SectionHeader.tsx'],
          Component: InventorySparesWarehouse,
        },
        {
          id: 'InventorySparesPartDetail',
          title: 'Part detail',
          note: 'Pick it when one part is in question: stock, the reservation that holds it and the delivery that is late.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/inventory-and-spares/StockBar.tsx', 'kit/inventory-and-spares/DeliveryTrack.tsx', 'kit/StatGroup.tsx', 'kit/ListRow.tsx'],
          Component: InventorySparesPartDetail,
        },
      ],
    },
  ],
});
