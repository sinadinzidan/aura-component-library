import { SegmentedControl, SegmentedControlButton, SegmentedControlList } from '@cognite/aura/components/segmented-control';
import { Switch } from '@cognite/aura/components/switch';
import { IconAlertTriangle, IconChevronRight, IconCircleCheck, IconTool } from '@cognite/aura/icons';
import { useId, useState } from 'react';
import type { ReactNode } from 'react';

import { Canvas } from '../../../library/kit/Canvas';
import { cylinderBody, labelSlots, layoutParts } from '../../../library/kit/hologram-asset/explode';
import { IconChip } from '../../../library/kit/IconChip';
import { Meter } from '../../../library/kit/Meter';
import { Panel } from '../../../library/kit/Panel';
import { RingGauge } from '../../../library/kit/RingGauge';
import { SparkLine } from '../../../library/kit/SparkLine';
import { StatusPill } from '../../../library/kit/StatusPill';
import { TagId } from '../../../library/kit/TagId';
import type { Tone } from '../../../library/kit/tones';
import { LookScope } from '../../../library/looks/LookScope';
import { WORK_ORDERS } from '../../data/plant';
import { formatDate, makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './hologram-asset.tsx?raw';

type HaReading = { label: string; value: number; max: number; unit: string; decimals: number; high?: number };

type HaPart = {
  id: string;
  name: string;
  /** Callout text. */
  short: string;
  kind: 'shaft' | 'bearing' | 'seal' | 'casing' | 'impeller';
  length: number;
  radius: number;
  inside?: boolean;
  health: number;
  note: string;
  readings: readonly [HaReading, HaReading];
  seed: number;
};

const HA_PARTS: readonly HaPart[] = [
  {
    id: 'coupling',
    name: 'Coupling',
    short: 'Coupling',
    kind: 'shaft',
    length: 56,
    radius: 32,
    health: 94,
    note: 'Alignment checked at the last turnaround; no drift since.',
    readings: [
      { label: 'Alignment offset', value: 0.04, max: 0.2, unit: 'mm', decimals: 2, high: 0.1 },
      { label: 'Torque', value: 78, max: 100, unit: '%', decimals: 0, high: 95 },
    ],
    seed: 61,
  },
  {
    id: 'de-bearing',
    name: 'Drive-end bearing',
    short: 'Drive-end bearing',
    kind: 'bearing',
    length: 44,
    radius: 50,
    health: 58,
    note: 'Vibration has climbed 1.4 mm/s in two weeks and is 0.3 under the high limit. A survey is ordered.',
    readings: [
      { label: 'Vibration', value: 6.8, max: 15, unit: 'mm/s', decimals: 1, high: 7.1 },
      { label: 'Temperature', value: 84, max: 120, unit: '°C', decimals: 0, high: 95 },
    ],
    seed: 14,
  },
  {
    id: 'seal',
    name: 'Dry gas seal',
    short: 'Dry gas seal',
    kind: 'seal',
    length: 32,
    radius: 58,
    health: 88,
    note: 'Primary vent flow steady. Seal gas filter changed in February.',
    readings: [
      { label: 'Primary leakage', value: 2.1, max: 8, unit: 'Nm³/h', decimals: 1, high: 5 },
      { label: 'Seal gas differential', value: 1.8, max: 4, unit: 'bar', decimals: 1 },
    ],
    seed: 63,
  },
  {
    id: 'casing-in',
    name: 'Casing, suction side',
    short: 'Suction casing',
    kind: 'casing',
    length: 118,
    radius: 112,
    health: 90,
    note: 'Suction conditions inside the operating window.',
    readings: [
      { label: 'Inlet pressure', value: 12.4, max: 20, unit: 'barg', decimals: 1, high: 15 },
      { label: 'Inlet temperature', value: 34, max: 80, unit: '°C', decimals: 0, high: 50 },
    ],
    seed: 12,
  },
  {
    id: 'impeller-1',
    name: 'Impeller, stage 1',
    short: 'Impeller 1',
    kind: 'impeller',
    length: 22,
    radius: 94,
    inside: true,
    health: 86,
    note: 'Stage efficiency within two points of the as-new curve.',
    readings: [
      { label: 'Stage efficiency', value: 81, max: 100, unit: '%', decimals: 0 },
      { label: 'Fouling index', value: 0.2, max: 1, unit: '', decimals: 1, high: 0.5 },
    ],
    seed: 65,
  },
  {
    id: 'impeller-2',
    name: 'Impeller, stage 2',
    short: 'Impeller 2',
    kind: 'impeller',
    length: 22,
    radius: 86,
    inside: true,
    health: 71,
    note: 'Fouling is past the wash threshold, which is why the discharge runs hot.',
    readings: [
      { label: 'Stage efficiency', value: 76, max: 100, unit: '%', decimals: 0 },
      { label: 'Fouling index', value: 0.6, max: 1, unit: '', decimals: 1, high: 0.5 },
    ],
    seed: 66,
  },
  {
    id: 'casing-out',
    name: 'Casing, discharge side',
    short: 'Discharge casing',
    kind: 'casing',
    length: 118,
    radius: 112,
    health: 66,
    note: 'Outlet temperature is 3.8 °C under its high limit while the machine carries the recompressor load.',
    readings: [
      { label: 'Outlet temperature', value: 141.2, max: 180, unit: '°C', decimals: 1, high: 145 },
      { label: 'Outlet pressure', value: 48.6, max: 60, unit: 'barg', decimals: 1, high: 52 },
    ],
    seed: 13,
  },
  {
    id: 'nde-bearing',
    name: 'Non-drive-end bearing',
    short: 'Non-drive-end bearing',
    kind: 'bearing',
    length: 44,
    radius: 50,
    health: 91,
    note: 'Quiet and cool. Last oil sample clean.',
    readings: [
      { label: 'Vibration', value: 3.1, max: 15, unit: 'mm/s', decimals: 1, high: 7.1 },
      { label: 'Temperature', value: 71, max: 120, unit: '°C', decimals: 0, high: 95 },
    ],
    seed: 68,
  },
  {
    id: 'thrust',
    name: 'Thrust bearing',
    short: 'Thrust bearing',
    kind: 'bearing',
    length: 36,
    radius: 40,
    health: 93,
    note: 'Axial position stable through the load change at 13:46.',
    readings: [
      { label: 'Axial position', value: 0.12, max: 0.6, unit: 'mm', decimals: 2, high: 0.4 },
      { label: 'Pad temperature', value: 68, max: 120, unit: '°C', decimals: 0, high: 100 },
    ],
    seed: 69,
  },
];

const HA_WIDTH = 1000;

const HA_HEIGHT = 440;

const HA_AXIS = 212;

const HA_ORDERS = WORK_ORDERS.filter((order) => order.assetId === '23-ka-9101' || order.assetId === '23-ha-9114');

function haTone(health: number): Tone {
  return health >= 80 ? 'accent' : health >= 50 ? 'warning' : 'critical';
}

function haWord(health: number): string {
  return health >= 80 ? 'Healthy' : health >= 50 ? 'Watch' : 'Poor';
}

function haPart(id: string): HaPart {
  return HA_PARTS.find((part) => part.id === id) ?? HA_PARTS[0];
}

/** One part of the machine as a translucent cylinder with the details its kind needs. */
function HaShape({ part, picked }: { part: HaPart; picked: boolean }) {
  const rx = part.radius * 0.26;
  const fill = `color-mix(in oklab, var(--t-line) ${picked ? 42 : 13}%, transparent)`;
  const cap = `color-mix(in oklab, var(--t-line) ${picked ? 55 : 22}%, transparent)`;
  const ring = (scale: number) => <ellipse cx={part.length} cy={HA_AXIS} rx={rx * scale} ry={part.radius * scale} fill="none" strokeWidth="1" />;
  return (
    <g strokeWidth={picked ? 2.5 : 1.5} style={{ stroke: 'var(--t-line)' }}>
      {part.kind === 'casing' ? (
        <path d={`M ${part.length * 0.34} ${HA_AXIS - part.radius} v -34 h ${part.length * 0.32} v 34`} style={{ fill }} />
      ) : null}
      <path d={cylinderBody(0, part.length, HA_AXIS, part.radius)} style={{ fill }} />
      {part.kind === 'casing'
        ? [0.3, 0.6].map((at) => (
            <path
              key={at}
              d={`M ${part.length * at} ${HA_AXIS - part.radius} A ${rx} ${part.radius} 0 0 1 ${part.length * at} ${HA_AXIS + part.radius}`}
              fill="none"
              strokeWidth="1"
              opacity="0.6"
            />
          ))
        : null}
      <ellipse cx={part.length} cy={HA_AXIS} rx={rx} ry={part.radius} style={{ fill: cap }} />
      {part.kind === 'impeller' ? (
        <g opacity="0.8">
          {ring(0.72)}
          {ring(0.3)}
          {Array.from({ length: 8 }, (_, blade) => {
            const angle = (blade * Math.PI) / 4;
            return (
              <line
                key={blade}
                x1={part.length + Math.cos(angle) * rx * 0.3}
                y1={HA_AXIS + Math.sin(angle) * part.radius * 0.3}
                x2={part.length + Math.cos(angle + 0.5) * rx * 0.95}
                y2={HA_AXIS + Math.sin(angle + 0.5) * part.radius * 0.95}
                strokeWidth="1"
              />
            );
          })}
        </g>
      ) : null}
      {part.kind === 'bearing' || part.kind === 'seal' ? <g opacity="0.8">{ring(0.55)}</g> : null}
      {part.kind === 'casing' ? <g opacity="0.7">{ring(0.82)}</g> : null}
    </g>
  );
}

type HaStageProps = {
  exploded: boolean;
  selected: string;
  onSelect: (id: string) => void;
  /** Run the scan line down the stage. */
  scan?: boolean;
  /** Callout labels above and below; turn off for a small stage. */
  callouts?: boolean;
};

/** The hologram: the machine drawn part by part along its shaft, pulled apart or assembled, with a callout per part. */
function HaStage({ exploded, selected, onSelect, scan = false, callouts = true }: HaStageProps) {
  const beam = useId();
  const slots = layoutParts(HA_PARTS, exploded, HA_WIDTH, 44);
  const labels = labelSlots(HA_PARTS.length, HA_WIDTH);
  const first = slots[0];
  const last = slots[slots.length - 1];
  const move = 'transition-all duration-700 ease-in-out motion-reduce:transition-none';
  return (
    <div className="relative w-full" style={{ aspectRatio: `${HA_WIDTH} / ${HA_HEIGHT}` }}>
      <svg viewBox={`0 0 ${HA_WIDTH} ${HA_HEIGHT}`} className="absolute inset-0 size-full" role="group" aria-label="1st stage compressor, exploded view">
        <defs>
          <linearGradient id={beam} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" style={{ stopColor: 'var(--kit-accent)', stopOpacity: 0.34 }} />
            <stop offset="1" style={{ stopColor: 'var(--kit-accent)', stopOpacity: 0 }} />
          </linearGradient>
        </defs>
        <path d="M 180 372 L 60 40 H 940 L 820 372 Z" fill={`url(#${beam})`} opacity="0.55" />
        <g fill="none" style={{ stroke: 'var(--kit-accent)' }}>
          <ellipse cx="500" cy="372" rx="320" ry="26" strokeWidth="2" style={{ fill: 'color-mix(in oklab, var(--kit-accent) 20%, transparent)', filter: 'drop-shadow(0 0 14px var(--kit-accent))' }} />
          <ellipse cx="500" cy="372" rx="230" ry="18" strokeWidth="1" opacity="0.7" />
          <ellipse cx="500" cy="372" rx="130" ry="10" strokeWidth="1" opacity="0.5" />
        </g>
        {callouts
          ? HA_PARTS.map((part, index) => {
              const up = index % 2 === 0;
              const slot = slots[index];
              return (
                <line
                  key={part.id}
                  data-tone={haTone(part.health)}
                  x1={labels[index]}
                  y1={up ? 58 : HA_HEIGHT - 44}
                  x2={slot.centre}
                  y2={up ? HA_AXIS - part.radius : HA_AXIS + part.radius}
                  strokeWidth={part.id === selected ? 2 : 1}
                  strokeDasharray={part.id === selected ? undefined : '3 4'}
                  style={{ stroke: 'var(--t-line)' }}
                />
              );
            })
          : null}
        <rect
          y={HA_AXIS - 9}
          height="18"
          rx="9"
          className={move}
          style={{ x: first.start - 26, width: last.end - first.start + 52, fill: 'color-mix(in oklab, var(--kit-accent) 30%, transparent)', stroke: 'var(--kit-accent)' }}
        />
        {HA_PARTS.map((part, index) => {
          const picked = part.id === selected;
          return (
            <g
              key={part.id}
              data-tone={haTone(part.health)}
              className={`cursor-pointer ${move}`}
              style={{
                transform: `translate(${slots[index].start}px, 0px)`,
                opacity: picked ? 1 : 0.72,
                filter: picked ? 'drop-shadow(0 0 10px var(--t-line))' : undefined,
              }}
              onClick={() => onSelect(part.id)}
            >
              <HaShape part={part} picked={picked} />
            </g>
          );
        })}
        {scan ? (
          <rect x="60" width="880" height="3" style={{ fill: 'var(--kit-accent)', filter: 'drop-shadow(0 0 8px var(--kit-accent))' }}>
            <animate attributeName="y" values="60;360;60" dur="6s" repeatCount="indefinite" />
          </rect>
        ) : null}
      </svg>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{ background: 'repeating-linear-gradient(0deg, transparent 0 3px, color-mix(in oklab, var(--mountain-black) 70%, transparent) 3px 4px)' }}
      />
      {callouts
        ? HA_PARTS.map((part, index) => {
            const picked = part.id === selected;
            return (
              <button
                key={part.id}
                type="button"
                data-tone={haTone(part.health)}
                aria-pressed={picked}
                onClick={() => onSelect(part.id)}
                className={`absolute w-[10.4%] -translate-x-1/2 rounded-[10px] border px-1 py-1 text-center text-xs leading-tight font-medium outline-offset-2 focus-visible:outline-2 focus-visible:outline-[var(--kit-accent)] ${
                  picked
                    ? 'border-[var(--t-line)] bg-[color-mix(in_oklab,var(--t-line)_30%,var(--mountain-black))]'
                    : 'border-[color-mix(in_oklab,var(--t-line)_50%,transparent)] bg-[color-mix(in_oklab,var(--mountain-black)_60%,transparent)]'
                } ${index % 2 === 0 ? 'top-0' : 'bottom-0'}`}
                style={{ left: `${(labels[index] / HA_WIDTH) * 100}%` }}
              >
                <span className="block">{part.short}</span>
                <span className="block font-semibold text-[var(--t-ink)] tabular-nums">{part.health}</span>
              </button>
            );
          })
        : null}
    </div>
  );
}

/** The sheet of the picked part: state, health, two readings against their limits and the recent trend. */
function HaPartSheet({ part, className }: { part: HaPart; className?: string }) {
  const tone = haTone(part.health);
  const status: Tone = tone === 'accent' ? 'success' : tone;
  return (
    <Panel
      className={className}
      tone={tone === 'accent' ? 'neutral' : tone}
      title={part.name}
      subtitle="Picked part"
      actions={
        <StatusPill tone={status} icon={tone === 'accent' ? <IconCircleCheck /> : <IconAlertTriangle />}>
          {haWord(part.health)}
        </StatusPill>
      }
    >
      <div className="grid flex-1 grid-cols-[6.5rem_minmax(0,1fr)] items-center gap-5">
        <div className="flex flex-col items-center gap-3">
          <RingGauge label="Health" value={part.health} unit="" tone={status} size={104} hideLabel />
          <SparkLine
            values={makeValues({ seed: part.seed, points: 36, base: part.readings[0].value, amplitude: part.readings[0].value * 0.06, noise: part.readings[0].value * 0.02, drift: part.health < 80 ? part.readings[0].value * 0.12 : 0 })}
            label={`${part.readings[0].label}, last 14 days`}
            tone={status === 'success' ? 'accent' : status}
            variant="area"
            className="h-10 w-full"
          />
        </div>
        <div className="flex flex-col gap-4">
          {part.readings.map((reading) => (
            <Meter
              key={reading.label}
              label={reading.label}
              value={reading.value}
              max={reading.max}
              unit={reading.unit}
              decimals={reading.decimals}
              high={reading.high}
              tone={reading.high !== undefined && reading.value > reading.high * 0.9 ? 'warning' : 'accent'}
              hideScale
            />
          ))}
          <p className="text-sm leading-snug text-[var(--kit-text-2)]">{part.note}</p>
        </div>
      </div>
    </Panel>
  );
}

/** The machine as a whole: its health and how many parts need attention. */
function HaAssetCard({ className }: { className?: string }) {
  const watch = HA_PARTS.filter((part) => part.health < 80).length;
  return (
    <Panel className={className} title="1st stage compressor" subtitle="23-KA-9101 · Gas compression">
      <div className="flex flex-1 items-center gap-5">
        <RingGauge label="Machine health" value={72} unit="" tone="warning" size={80} hideLabel />
        <dl className="flex flex-1 flex-col gap-2 text-sm">
          {[
            ['Speed', '9,840 rpm'],
            ['Flow', '182 kSm³/h'],
            ['On watch', `${watch} of ${HA_PARTS.length} parts`],
            ['Run time', '41,260 h'],
          ].map(([label, value]) => (
            <div key={label} className="flex items-baseline justify-between gap-2 border-b border-[var(--kit-rule)] pb-1.5 last:border-b-0 last:pb-0">
              <dt className="text-[var(--kit-text-2)]">{label}</dt>
              <dd className="font-semibold whitespace-nowrap tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </Panel>
  );
}

function HaOrders({ className }: { className?: string }) {
  return (
    <Panel className={className} title="Work on this machine" subtitle={`${HA_ORDERS.length} open orders`}>
      <ul className="flex flex-1 flex-col justify-center gap-3">
        {HA_ORDERS.map((order) => (
          <li key={order.id} className="flex items-center gap-3">
            <IconChip tone="purple" size="sm">
              <IconTool />
            </IconChip>
            <div className="min-w-0 flex-1">
              <p className="text-sm leading-snug font-medium">{order.title}</p>
              <p className="text-xs text-[var(--kit-text-2)] tabular-nums">
                <TagId>{order.id}</TagId> · {order.priority} · due {formatDate(order.dueAt)}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function HaViewSwitch({ exploded, onChange }: { exploded: boolean; onChange: (exploded: boolean) => void }) {
  return (
    <SegmentedControl value={exploded ? 'exploded' : 'assembled'} onValueChange={(next) => onChange(String(next) === 'exploded')}>
      <SegmentedControlList size="small" aria-label="View">
        <SegmentedControlButton value="assembled">Assembled</SegmentedControlButton>
        <SegmentedControlButton value="exploded">Exploded</SegmentedControlButton>
      </SegmentedControlList>
    </SegmentedControl>
  );
}

/** Where the machine sits in the plant, as the screen's only chrome. */
function HaCrumbs() {
  return (
    <nav aria-label="Location" className="flex flex-wrap items-center gap-1.5 text-sm text-[var(--kit-text-2)]">
      <span>Nordkapp</span>
      <IconChevronRight className="size-4" aria-hidden="true" />
      <span>Gas compression</span>
      <IconChevronRight className="size-4" aria-hidden="true" />
      <span className="font-semibold text-[var(--kit-text)]">1st stage compressor</span>
    </nav>
  );
}

/** The projector room: dark, lit from below in the accent colour. */
function HaRoom({ className = '', children }: { className?: string; children: ReactNode }) {
  return (
    <div
      data-look="glass"
      className={`flex flex-col gap-4 p-5 ${className}`}
      style={{
        background:
          'radial-gradient(60% 55% at 50% 62%, color-mix(in oklab, var(--sky-600) 40%, transparent), transparent 72%), radial-gradient(50% 40% at 50% 0%, color-mix(in oklab, var(--dusk-600) 34%, transparent), transparent 70%), var(--mountain-black)',
      }}
    >
      {children}
    </div>
  );
}

function HologramAssetSignature() {
  const [exploded, setExploded] = useState(true);
  const [selected, setSelected] = useState('de-bearing');
  const [scan, setScan] = useState(false);
  return (
    <LookScope look="glass">
      <Canvas padding="none">
        <HaRoom>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <HaCrumbs />
            <div className="flex items-center gap-5">
              <Switch label="Scan line" checked={scan} onCheckedChange={setScan} />
              <HaViewSwitch exploded={exploded} onChange={setExploded} />
            </div>
          </div>
          <HaStage exploded={exploded} selected={selected} onSelect={setSelected} scan={scan} />
          <div className="grid grid-cols-[minmax(0,5fr)_minmax(0,7fr)_minmax(0,5fr)] gap-4">
            <HaAssetCard />
            <HaPartSheet part={haPart(selected)} />
            <HaOrders />
          </div>
        </HaRoom>
      </Canvas>
    </LookScope>
  );
}

function HologramAssetCondition() {
  const [selected, setSelected] = useState('casing-out');
  const ranked = [...HA_PARTS].sort((a, b) => a.health - b.health);
  return (
    <LookScope look="glass">
      <Canvas padding="none">
        <HaRoom className="h-full">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-[var(--kit-text-2)]">Condition overlay</p>
              <p className="text-2xl font-semibold tracking-tight">Assembled, worst part first</p>
            </div>
            <StatusPill tone="warning" size="lg" icon={<IconAlertTriangle />}>
              4 parts on watch
            </StatusPill>
          </div>
          <div className="grid flex-1 grid-cols-[minmax(0,6fr)_minmax(0,5fr)] items-center gap-5">
            <HaStage exploded={false} selected={selected} onSelect={setSelected} callouts={false} />
            <ol className="flex flex-col gap-1.5">
              {ranked.map((part) => {
                const picked = part.id === selected;
                return (
                  <li key={part.id}>
                    <button
                      type="button"
                      data-tone={haTone(part.health)}
                      aria-pressed={picked}
                      onClick={() => setSelected(part.id)}
                      className={`grid w-full grid-cols-[minmax(0,1fr)_6rem_2rem] items-center gap-3 rounded-[10px] border px-3 py-1.5 text-left text-sm outline-offset-2 focus-visible:outline-2 focus-visible:outline-[var(--kit-accent)] ${
                        picked ? 'border-[var(--t-line)] bg-[color-mix(in_oklab,var(--t-line)_22%,transparent)]' : 'border-[var(--kit-rule)]'
                      }`}
                    >
                      <span className="font-medium">{part.name}</span>
                      <span className="h-2 overflow-hidden rounded-full bg-[var(--kit-track)]">
                        <span className="block h-full rounded-full bg-[var(--t-line)]" style={{ width: `${part.health}%` }} />
                      </span>
                      <span className="text-right font-semibold text-[var(--t-ink)] tabular-nums">{part.health}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        </HaRoom>
      </Canvas>
    </LookScope>
  );
}

function HologramAssetPartFocus() {
  const [selected, setSelected] = useState('impeller-2');
  const part = haPart(selected);
  const index = HA_PARTS.findIndex((entry) => entry.id === selected);
  const step = (offset: number) => setSelected(HA_PARTS[(index + offset + HA_PARTS.length) % HA_PARTS.length].id);
  const key = 'rounded-full border border-[var(--kit-rule-strong)] px-4 py-1.5 text-sm font-medium outline-offset-2 focus-visible:outline-2 focus-visible:outline-[var(--kit-accent)]';
  return (
    <LookScope look="glass">
      <Canvas padding="none">
        <HaRoom className="h-full">
          <div className="flex items-center justify-between gap-3">
            <button type="button" className={key} onClick={() => step(-1)}>
              Previous
            </button>
            <p className="text-sm text-[var(--kit-text-2)] tabular-nums" aria-live="polite">
              Part {index + 1} of {HA_PARTS.length}
            </p>
            <button type="button" className={key} onClick={() => step(1)}>
              Next
            </button>
          </div>
          <div data-tone={haTone(part.health)} className="flex flex-1 flex-col items-center justify-center gap-2 py-2 text-center">
            <svg viewBox={`${-70} ${HA_AXIS - 130} ${part.length + 140} 260`} className="h-44 w-full" aria-hidden="true" style={{ filter: 'drop-shadow(0 0 12px var(--t-line))' }}>
              <HaShape part={part} picked />
            </svg>
            <p className="text-xl font-semibold">{part.name}</p>
            <p className="text-5xl leading-none font-semibold tracking-tight text-[var(--t-ink)] tabular-nums">{part.health}</p>
            <p className="text-sm text-[var(--kit-text-2)]">Health · {haWord(part.health)}</p>
          </div>
          <div className="flex flex-col gap-3">
            {part.readings.map((reading) => (
              <Meter key={reading.label} label={reading.label} value={reading.value} max={reading.max} unit={reading.unit} decimals={reading.decimals} high={reading.high} hideScale />
            ))}
          </div>
        </HaRoom>
      </Canvas>
    </LookScope>
  );
}

function HologramAssetStage() {
  const [exploded, setExploded] = useState(false);
  const [selected, setSelected] = useState('casing-in');
  return (
    <LookScope look="glass" className="w-full">
      <Canvas padding="none">
        <HaRoom>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium">{haPart(selected).name}</p>
            <HaViewSwitch exploded={exploded} onChange={setExploded} />
          </div>
          <HaStage exploded={exploded} selected={selected} onSelect={setSelected} callouts={false} />
        </HaRoom>
      </Canvas>
    </LookScope>
  );
}

function HologramAssetPartSheet() {
  return (
    <LookScope look="glass" className="w-full">
      <Canvas padding="none">
        <HaRoom className="h-full justify-center">
          <HaPartSheet part={haPart('casing-out')} />
        </HaRoom>
      </Canvas>
    </LookScope>
  );
}

function HologramAssetCard() {
  return (
    <LookScope look="glass" className="w-full">
      <Canvas padding="none">
        <HaRoom className="h-full justify-center">
          <HaAssetCard />
        </HaRoom>
      </Canvas>
    </LookScope>
  );
}

function HologramAssetOrders() {
  return (
    <LookScope look="glass" className="w-full">
      <Canvas padding="none">
        <HaRoom className="h-full justify-center">
          <HaOrders />
        </HaRoom>
      </Canvas>
    </LookScope>
  );
}

function HologramAssetShapes() {
  const kinds = ['coupling', 'de-bearing', 'seal', 'impeller-1'].map(haPart);
  return (
    <LookScope look="glass" className="w-full">
      <Canvas padding="none">
        <HaRoom className="h-full justify-center">
          <ul className="grid grid-cols-4 gap-3">
            {kinds.map((part) => (
              <li key={part.id} data-tone={haTone(part.health)} className="flex flex-col items-center gap-1 text-center">
                <svg viewBox={`${-50} ${HA_AXIS - 110} ${part.length + 100} 220`} className="h-28 w-full" aria-hidden="true">
                  <HaShape part={part} picked={false} />
                </svg>
                <span className="text-xs font-medium">{part.short}</span>
              </li>
            ))}
          </ul>
        </HaRoom>
      </Canvas>
    </LookScope>
  );
}

export default definePage({
  id: 'hologram-asset',
  title: 'Hologram asset',
  summary:
    'One machine projected in the middle of the screen and pulled apart along its shaft: every part has a callout with its health, and picking one opens its sheet underneath.',
  guidance: {
    use: [
      'For one critical machine whose condition is the sum of a few named parts.',
      'Exploded to find the part, assembled to see the machine; the switch moves the parts, it does not reload.',
      'Tint a part only when it needs attention, so the eye lands on it first.',
    ],
    avoid: [
      'More than about ten parts in one view: group sub-assemblies and drill in instead.',
      'A scan line or rotation running by default: it is a switch and starts off.',
      'Callouts without numbers: each label carries the health figure, the colour only repeats it.',
    ],
  },
  source,
  sections: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description: 'Pick a part on the machine or by its callout; switch between exploded and assembled in the top bar.',
      specimens: [
        {
          id: 'HologramAssetSignature',
          title: 'Exploded machine',
          note: 'Pick it when an engineer needs to see which part of a machine is driving its condition.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/hologram-asset/explode.ts', 'kit/Panel.tsx', 'kit/Meter.tsx', 'kit/RingGauge.tsx', 'kit/SparkLine.tsx', 'looks/LookScope.tsx'],
          Component: HologramAssetSignature,
        },
      ],
    },
    {
      id: 'variations',
      title: 'Variations',
      description: 'Two more screens: the assembled machine beside a ranked condition list, and one part on its own for a narrow display.',
      specimens: [
        {
          id: 'HologramAssetCondition',
          title: 'Condition overlay',
          note: 'Pick it for a review: the machine stays assembled and the list ranks its parts from worst to best.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          bleed: true,
          uses: ['kit/hologram-asset/explode.ts', 'kit/StatusPill.tsx'],
          Component: HologramAssetCondition,
        },
        {
          id: 'HologramAssetPartFocus',
          title: 'Part focus',
          note: 'Pick it on a tablet at the machine: one part, its health and two readings, stepped with two buttons.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Meter.tsx', 'kit/hologram-asset/explode.ts'],
          Component: HologramAssetPartFocus,
        },
      ],
    },
    {
      id: 'parts',
      title: 'Parts',
      description: 'The stage and the panels on their own.',
      specimens: [
        {
          id: 'HologramAssetStage',
          title: 'Stage without callouts',
          note: 'Pick it where space is short: the machine alone, the picked part named above it.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          bleed: true,
          uses: ['kit/hologram-asset/explode.ts'],
          Component: HologramAssetStage,
        },
        {
          id: 'HologramAssetShapes',
          title: 'Part shapes',
          note: 'Pick a shape per kind of part: shaft piece, bearing, seal and impeller are all one cylinder with different details.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          bleed: true,
          uses: ['kit/hologram-asset/explode.ts'],
          Component: HologramAssetShapes,
        },
        {
          id: 'HologramAssetPartSheet',
          title: 'Part sheet',
          note: 'Pick it under or beside the stage for the picked part: state, health, two readings and the trend.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Panel.tsx', 'kit/Meter.tsx', 'kit/RingGauge.tsx', 'kit/SparkLine.tsx'],
          Component: HologramAssetPartSheet,
        },
        {
          id: 'HologramAssetCard',
          title: 'Machine card',
          note: 'Pick it to keep the whole machine in view while a single part is open.',
          origin: 'custom',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Panel.tsx', 'kit/RingGauge.tsx'],
          Component: HologramAssetCard,
        },
        {
          id: 'HologramAssetOrders',
          title: 'Work orders',
          note: 'Pick it to show what is already being done about the parts on watch.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Panel.tsx', 'kit/IconChip.tsx', 'kit/TagId.tsx'],
          Component: HologramAssetOrders,
        },
      ],
    },
  ],
});
