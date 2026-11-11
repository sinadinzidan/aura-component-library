import { Switch } from '@cognite/aura/components/switch';
import { IconAlertOctagon, IconAlertTriangle, IconCircleCheck } from '@cognite/aura/icons';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { Canvas } from '../../../library/kit/Canvas';
import { Legend } from '../../../library/kit/Legend';
import { Meter } from '../../../library/kit/Meter';
import { Panel } from '../../../library/kit/Panel';
import { StatusPill } from '../../../library/kit/StatusPill';
import type { Tone } from '../../../library/kit/tones';
import { TrendArea } from '../../../library/kit/TrendArea';
import { isoBox, isoPoint, isoPoints, type IsoView } from '../../../library/kit/tron-grid-ops/iso';
import { LookScope } from '../../../library/looks/LookScope';
import { REFERENCE_NOW, HOUR, formatTime, makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './tron-grid-ops.tsx?raw';

type TgoMeter = { label: string; value: number; max: number; unit: string; decimals: number; high?: number };

type TgoZone = {
  id: string;
  name: string;
  state: 'Nominal' | 'Watch' | 'Tripped';
  figure: { label: string; value: string; unit: string };
  meters: readonly TgoMeter[];
  trend: { label: string; unit: string; base: number; seed: number; decimals: number; limit?: number };
  /** Plate on the ground grid: x, y, width, depth. */
  plate: readonly [number, number, number, number];
  /** Equipment on the plate: x and y from the plate corner, width, depth, height, and a state override. */
  blocks: readonly (readonly [number, number, number, number, number, Tone?])[];
};

type TgoPipe = { id: string; kind: 'gas' | 'water' | 'power'; path: readonly (readonly [number, number])[] };

const TGO_VIEW: IsoView = { originX: 312, originY: 76, unit: 30 };

const TGO_STATE_TONE: Record<TgoZone['state'], Tone> = { Nominal: 'accent', Watch: 'warning', Tripped: 'critical' };

const TGO_ZONES: readonly TgoZone[] = [
  {
    id: 'inlet',
    name: 'Inlet and separation',
    state: 'Nominal',
    figure: { label: 'Feed gas', value: '4.61', unit: 'MSm³/d' },
    meters: [
      { label: 'Separator level', value: 54.3, max: 100, unit: '%', decimals: 1, high: 70 },
      { label: 'Separator pressure', value: 13.1, max: 20, unit: 'barg', decimals: 1, high: 15 },
      { label: 'Zone load', value: 88, max: 100, unit: '%', decimals: 0 },
    ],
    trend: { label: 'Separator level', unit: '%', base: 54, seed: 17, decimals: 1, limit: 70 },
    plate: [0, 0, 5, 4.5],
    blocks: [
      [0.6, 0.7, 3.2, 1, 1],
      [0.6, 2.7, 2.2, 0.9, 0.8],
      [3.9, 2.4, 0.6, 0.6, 0.6],
    ],
  },
  {
    id: 'compression',
    name: 'Gas compression',
    state: 'Tripped',
    figure: { label: 'Discharge pressure', value: '48.6', unit: 'barg' },
    meters: [
      { label: 'Discharge temperature', value: 141.2, max: 180, unit: '°C', decimals: 1, high: 145 },
      { label: 'Drive-end vibration', value: 6.8, max: 15, unit: 'mm/s', decimals: 1, high: 7.1 },
      { label: 'Zone load', value: 97, max: 100, unit: '%', decimals: 0, high: 95 },
    ],
    trend: { label: 'Discharge pressure', unit: 'barg', base: 48.2, seed: 11, decimals: 1, limit: 52 },
    plate: [6, 0, 5.6, 4.5],
    blocks: [
      [0.5, 0.5, 1.2, 2.5, 1.5, 'warning'],
      [2.2, 0.5, 1.2, 2.5, 1.5],
      [3.9, 0.5, 1.2, 2.5, 1.5, 'critical'],
      [0.5, 3.4, 4.6, 0.6, 0.6],
    ],
  },
  {
    id: 'flare',
    name: 'Flare and relief',
    state: 'Nominal',
    figure: { label: 'Flaring', value: '12.4', unit: 'kSm³/d' },
    meters: [
      { label: 'Knock-out drum level', value: 12, max: 100, unit: '%', decimals: 0, high: 60 },
      { label: 'Purge gas flow', value: 42, max: 80, unit: 'Sm³/h', decimals: 0 },
      { label: 'Relief load', value: 4, max: 100, unit: '%', decimals: 0, high: 50 },
    ],
    trend: { label: 'Flaring', unit: 'kSm³/d', base: 13, seed: 47, decimals: 1 },
    plate: [12.4, 0, 1.6, 2.2],
    blocks: [[0.55, 0.8, 0.5, 0.5, 5.2]],
  },
  {
    id: 'cooling',
    name: 'Cooling water',
    state: 'Watch',
    figure: { label: 'Supply temperature', value: '18.4', unit: '°C' },
    meters: [
      { label: 'Cooler outlet', value: 38.9, max: 60, unit: '°C', decimals: 1, high: 40 },
      { label: 'Header pressure', value: 4.6, max: 8, unit: 'barg', decimals: 1 },
      { label: 'Zone load', value: 74, max: 100, unit: '%', decimals: 0 },
    ],
    trend: { label: 'Cooler outlet temperature', unit: '°C', base: 38.4, seed: 19, decimals: 1, limit: 40 },
    plate: [0, 6, 4, 5],
    blocks: [
      [0.6, 0.7, 1.6, 1.6, 2.2],
      [2.8, 1.1, 0.8, 0.8, 0.7, 'warning'],
      [0.6, 3.3, 2.8, 0.9, 0.7],
    ],
  },
  {
    id: 'power',
    name: 'Power generation',
    state: 'Nominal',
    figure: { label: 'Load', value: '31.4', unit: 'MW' },
    meters: [
      { label: 'Spinning reserve', value: 9, max: 20, unit: 'MW', decimals: 0 },
      { label: 'Fuel gas pressure', value: 24.2, max: 40, unit: 'barg', decimals: 1 },
      { label: 'Zone load', value: 78, max: 100, unit: '%', decimals: 0 },
    ],
    trend: { label: 'Generation load', unit: 'MW', base: 31, seed: 24, decimals: 1 },
    plate: [5, 6, 4, 5],
    blocks: [
      [0.5, 0.6, 2.4, 0.9, 1.2],
      [0.5, 2, 2.4, 0.9, 1.2],
      [0.5, 3.4, 2.4, 0.9, 1.2],
      [3.2, 0.8, 0.4, 0.4, 3],
    ],
  },
  {
    id: 'export',
    name: 'Gas export',
    state: 'Nominal',
    figure: { label: 'Export rate', value: '4.38', unit: 'MSm³/d' },
    meters: [
      { label: 'Export flow', value: 412, max: 600, unit: 'm³/h', decimals: 0, high: 480 },
      { label: 'Motor current', value: 86.2, max: 120, unit: 'A', decimals: 1, high: 95 },
      { label: 'Zone load', value: 82, max: 100, unit: '%', decimals: 0 },
    ],
    trend: { label: 'Export rate', unit: 'MSm³/d', base: 4.32, seed: 31, decimals: 2, limit: 4.5 },
    plate: [10, 6, 4, 5],
    blocks: [
      [0.6, 0.7, 1, 1, 0.8],
      [0.6, 2.8, 1, 1, 0.8],
      [2.2, 1.1, 1.3, 2.6, 1.1],
    ],
  },
];

const TGO_PIPES: readonly TgoPipe[] = [
  { id: 'feed', kind: 'gas', path: [[-1.6, 2.2], [0, 2.2]] },
  { id: 'to-compression', kind: 'gas', path: [[5, 2.2], [6, 2.2]] },
  { id: 'to-flare', kind: 'gas', path: [[11.6, 1.1], [12.4, 1.1]] },
  { id: 'to-export', kind: 'gas', path: [[10.6, 4.5], [10.6, 5.25], [12, 5.25], [12, 6]] },
  { id: 'export-out', kind: 'gas', path: [[14, 8.5], [15.4, 8.5]] },
  { id: 'cooling', kind: 'water', path: [[2, 6], [2, 5.25], [7, 5.25], [7, 4.5]] },
  { id: 'power', kind: 'power', path: [[8.6, 6], [8.6, 4.5]] },
];

const TGO_PIPE_TONE: Record<TgoPipe['kind'], Tone> = { gas: 'pink', water: 'blue', power: 'amber' };

const TGO_HOURS = Array.from({ length: 25 }, (_, index) => formatTime(REFERENCE_NOW - (24 - index) * HOUR));

function tgoZone(id: string): TgoZone {
  return TGO_ZONES.find((zone) => zone.id === id) ?? TGO_ZONES[0];
}

/** Height of a zone's name tag: above its buildings, ignoring a thin stack that towers over the rest. */
function tgoTagHeight(zone: TgoZone): number {
  const bulky = zone.blocks.filter((block) => block[2] >= 0.6 || zone.blocks.length === 1).map((block) => block[4]);
  return Math.max(...bulky) + 0.9;
}

function TgoStateIcon({ state }: { state: TgoZone['state'] }) {
  if (state === 'Tripped') return <IconAlertOctagon />;
  if (state === 'Watch') return <IconAlertTriangle />;
  return <IconCircleCheck />;
}

type TgoMapProps = {
  selected: string;
  onSelect: (id: string) => void;
  /** Draw the lines between zones. */
  flows?: boolean;
  /** Move dashes along the lines. */
  animate?: boolean;
  /** Name tags over the zones. */
  tags?: boolean;
};

/** The plant as a neon isometric map: one plate per zone, glowing outlines for equipment, lines for what flows between. */
function TgoMap({ selected, onSelect, flows = true, animate = false, tags = true }: TgoMapProps) {
  const face = (tone: number) => `color-mix(in oklab, var(--t-line) ${tone}%, var(--mountain-black))`;
  return (
    <div className="relative w-full" style={{ aspectRatio: '700 / 470' }}>
      <svg viewBox="0 0 700 470" className="absolute inset-0 size-full" role="group" aria-label="Isometric map of the Nordkapp plant by zone">
        {flows
          ? TGO_PIPES.map((pipe) => (
              <polyline
                key={pipe.id}
                data-tone={TGO_PIPE_TONE[pipe.kind]}
                points={isoPoints(TGO_VIEW, pipe.path.map(([x, y]) => [x, y, 0.05]))}
                fill="none"
                strokeWidth="3"
                strokeLinejoin="round"
                strokeDasharray={animate ? '10 8' : undefined}
                style={{ stroke: 'var(--t-line)', filter: 'drop-shadow(0 0 5px var(--t-line))' }}
              >
                {animate ? <animate attributeName="stroke-dashoffset" from="36" to="0" dur="1.2s" repeatCount="indefinite" /> : null}
              </polyline>
            ))
          : null}
        {TGO_ZONES.map((zone) => {
          const [x, y, width, depth] = zone.plate;
          const picked = zone.id === selected;
          const plate = isoBox(TGO_VIEW, x, y, width, depth, 0.12);
          return (
            <g
              key={zone.id}
              data-tone={TGO_STATE_TONE[zone.state]}
              className="cursor-pointer transition-transform duration-300 motion-reduce:transition-none"
              style={{ transform: picked ? 'translateY(-8px)' : undefined, filter: `drop-shadow(0 0 ${picked ? 12 : 4}px var(--t-line))` }}
              onClick={() => onSelect(zone.id)}
            >
              <g strokeWidth={picked ? 2.5 : 1.5} strokeLinejoin="round" style={{ stroke: 'var(--t-line)' }}>
                <polygon points={plate.left} style={{ fill: face(20) }} />
                <polygon points={plate.right} style={{ fill: face(12) }} />
                <polygon points={plate.top} style={{ fill: face(picked ? 34 : 10) }} />
              </g>
              {zone.blocks.map(([dx, dy, w, d, h, tone], index) => {
                const box = isoBox(TGO_VIEW, x + dx, y + dy, w, d, h, 0.12);
                return (
                  <g key={index} data-tone={tone} strokeWidth="1.5" strokeLinejoin="round" style={{ stroke: 'var(--t-line)' }}>
                    <polygon points={box.left} style={{ fill: face(tone ? 46 : 30) }} />
                    <polygon points={box.right} style={{ fill: face(tone ? 30 : 18) }} />
                    <polygon points={box.top} style={{ fill: face(tone ? 62 : 44) }} />
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>
      {tags
        ? TGO_ZONES.map((zone) => {
            const [x, y, width, depth] = zone.plate;
            const point = isoPoint(TGO_VIEW, x + width / 2, y + depth / 2, tgoTagHeight(zone));
            const picked = zone.id === selected;
            return (
              <span
                key={zone.id}
                data-tone={TGO_STATE_TONE[zone.state]}
                className={`pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-[8px] border px-2 py-1 text-xs leading-tight font-semibold whitespace-nowrap ${
                  picked
                    ? 'border-[var(--t-line)] bg-[color-mix(in_oklab,var(--t-line)_34%,var(--mountain-black))]'
                    : 'border-[color-mix(in_oklab,var(--t-line)_55%,transparent)] bg-[color-mix(in_oklab,var(--mountain-black)_72%,transparent)]'
                }`}
                style={{ left: `${(point.x / 700) * 100}%`, top: `${(point.y / 470) * 100}%` }}
              >
                {zone.name}
                {zone.state === 'Nominal' ? null : <span className="block font-medium text-[var(--t-ink)]">{zone.state}</span>}
              </span>
            );
          })
        : null}
    </div>
  );
}

/** The grid floor: lines running to a horizon, with a glow where they meet it. */
function TgoFloor({ className = '', children }: { className?: string; children: ReactNode }) {
  return (
    <div
      data-look="glass"
      className={`relative overflow-hidden ${className}`}
      style={{
        background:
          'radial-gradient(70% 34% at 50% 40%, color-mix(in oklab, var(--pink-600) 32%, transparent), transparent 70%), linear-gradient(180deg, var(--mountain-black) 0%, color-mix(in oklab, var(--dusk-900) 55%, var(--mountain-black)) 40%, var(--mountain-black) 100%)',
      }}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-[40%] bottom-0 [perspective:520px]">
        <div
          className="absolute inset-x-[-60%] top-0 h-[220%] origin-top [transform:rotateX(74deg)]"
          style={{
            backgroundImage:
              'linear-gradient(color-mix(in oklab, var(--kit-accent) 55%, transparent) 1.5px, transparent 1.5px), linear-gradient(90deg, color-mix(in oklab, var(--kit-accent) 55%, transparent) 1.5px, transparent 1.5px)',
            backgroundSize: '64px 64px',
            maskImage: 'linear-gradient(180deg, transparent 0%, var(--mountain-black) 22%, var(--mountain-black) 100%)',
          }}
        />
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-[40%] h-px"
        style={{ background: 'linear-gradient(90deg, transparent, var(--kit-accent), transparent)', boxShadow: '0 0 24px 3px var(--kit-accent)' }}
      />
      <div className="relative h-full">{children}</div>
    </div>
  );
}

/** The left rail: every zone as a row, the picked one opened below with its figure and meters. */
function TgoRail({ selected, onSelect, className }: { selected: string; onSelect: (id: string) => void; className?: string }) {
  const zone = tgoZone(selected);
  return (
    <Panel className={className} title="Nordkapp grid" subtitle="6 zones · 14:00 UTC">
      <ul className="flex flex-col gap-1">
        {TGO_ZONES.map((entry) => {
          const picked = entry.id === selected;
          return (
            <li key={entry.id}>
              <button
                type="button"
                data-tone={TGO_STATE_TONE[entry.state]}
                aria-pressed={picked}
                onClick={() => onSelect(entry.id)}
                className={`flex w-full items-center gap-2.5 rounded-[10px] border px-2.5 py-1.5 text-left text-sm outline-offset-2 focus-visible:outline-2 focus-visible:outline-[var(--kit-accent)] ${
                  picked ? 'border-[var(--t-line)] bg-[color-mix(in_oklab,var(--t-line)_22%,transparent)] font-semibold' : 'border-transparent font-medium'
                }`}
              >
                <span aria-hidden="true" className="h-5 w-1 shrink-0 rounded-full bg-[var(--t-line)]" style={{ boxShadow: '0 0 8px var(--t-line)' }} />
                <span className="min-w-0 flex-1">{entry.name}</span>
                <span className="shrink-0 text-xs font-medium text-[var(--t-ink)]">{entry.state}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <div className="mt-4 flex flex-1 flex-col justify-between gap-4 border-t border-[var(--kit-rule)] pt-4">
        <div>
          <p className="text-sm text-[var(--kit-text-2)]">{zone.figure.label}</p>
          <p className="text-5xl leading-none font-semibold tracking-tight tabular-nums">
            {zone.figure.value} <span className="text-base font-medium text-[var(--kit-text-2)]">{zone.figure.unit}</span>
          </p>
        </div>
        {zone.meters.map((meter) => (
          <Meter
            key={meter.label}
            label={meter.label}
            value={meter.value}
            max={meter.max}
            unit={meter.unit}
            decimals={meter.decimals}
            high={meter.high}
            tone={meter.high !== undefined && meter.value > meter.high * 0.94 ? 'warning' : 'accent'}
            hideScale
          />
        ))}
      </div>
    </Panel>
  );
}

/** The picked zone's lead reading over the last day. */
function TgoTrend({ zone, compact = false, className }: { zone: TgoZone; compact?: boolean; className?: string }) {
  const values = makeValues({ seed: zone.trend.seed, points: 25, base: zone.trend.base, amplitude: zone.trend.base * 0.03, noise: zone.trend.base * 0.01, decimals: zone.trend.decimals });
  return (
    <Panel
      className={className}
      padding="tight"
      title={zone.trend.label}
      subtitle={compact ? 'Last 24 h' : `${zone.name} · last 24 h`}
      actions={
        compact ? undefined : (
          <StatusPill tone={zone.state === 'Nominal' ? 'success' : TGO_STATE_TONE[zone.state]} icon={<TgoStateIcon state={zone.state} />}>
            {zone.state}
          </StatusPill>
        )
      }
    >
      <TrendArea
        label={`${zone.trend.label} in ${zone.name}, last 24 hours`}
        series={[{ id: 'value', label: zone.trend.label, values, tone: 'accent' }]}
        labels={TGO_HOURS}
        unit={zone.trend.unit}
        decimals={zone.trend.decimals}
        limits={zone.trend.limit && !compact ? [{ value: zone.trend.limit, label: 'Limit', tone: 'warning' }] : undefined}
        height={compact ? 104 : 132}
        highlightLast
      />
    </Panel>
  );
}

/** The floating toolbar: what the map shows and whether it moves. */
function TgoToolbar({ flows, onFlows, animate, onAnimate }: { flows: boolean; onFlows: (on: boolean) => void; animate: boolean; onAnimate: (on: boolean) => void }) {
  return (
    <div className="flex items-center gap-5 rounded-full border border-[var(--kit-rule-strong)] bg-[color-mix(in_oklab,var(--mountain-black)_60%,transparent)] px-5 py-2 backdrop-blur-md">
      <Switch label="Flow lines" checked={flows} onCheckedChange={onFlows} />
      <Switch label="Animate flow" checked={animate} onCheckedChange={onAnimate} />
    </div>
  );
}

function TgoLegend() {
  return (
    <Legend
      items={[
        { label: 'Gas', tone: 'pink' },
        { label: 'Cooling water', tone: 'blue' },
        { label: 'Power', tone: 'amber' },
      ]}
    />
  );
}

function TronGridOpsSignature() {
  const [selected, setSelected] = useState('compression');
  const [flows, setFlows] = useState(true);
  const [animate, setAnimate] = useState(false);
  const zone = tgoZone(selected);
  return (
    <LookScope look="glass">
      <Canvas padding="none">
        <TgoFloor className="h-[47.5rem]">
          <div className="grid h-full grid-cols-[19rem_minmax(0,1fr)] gap-4 p-4">
            <TgoRail selected={selected} onSelect={setSelected} />
            <div className="relative flex min-w-0 flex-col">
              <div data-tone={TGO_STATE_TONE[zone.state]} className="w-fit max-w-[calc(100%-18.5rem)] pt-1 pl-2">
                <p className="text-sm text-[var(--kit-text-2)]">Zone in focus</p>
                <p className="text-3xl leading-tight font-semibold tracking-tight">{zone.name}</p>
                <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-[var(--t-ink)] [&>svg]:size-4">
                  <TgoStateIcon state={zone.state} />
                  {zone.state}
                </p>
              </div>
              <div className="flex flex-1 items-end pb-3">
                <TgoMap selected={selected} onSelect={setSelected} flows={flows} animate={animate && flows} />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <TgoLegend />
                <TgoToolbar flows={flows} onFlows={setFlows} animate={animate} onAnimate={setAnimate} />
              </div>
              <div className="absolute top-0 right-0 w-[17.5rem]">
                <TgoTrend zone={zone} compact />
              </div>
            </div>
          </div>
        </TgoFloor>
      </Canvas>
    </LookScope>
  );
}

function TronGridOpsZone() {
  const [selected, setSelected] = useState('cooling');
  const zone = tgoZone(selected);
  return (
    <LookScope look="glass">
      <Canvas padding="none">
        <TgoFloor className="h-full">
          <div className="flex h-full flex-col gap-4 p-5">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm text-[var(--kit-text-2)]">Zone briefing</p>
                <p className="text-3xl font-semibold tracking-tight">{zone.name}</p>
              </div>
              <div role="group" aria-label="Zones" className="flex flex-wrap gap-1.5">
                {TGO_ZONES.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    data-tone={TGO_STATE_TONE[entry.state]}
                    aria-pressed={entry.id === selected}
                    onClick={() => setSelected(entry.id)}
                    className={`rounded-full border px-3 py-1 text-sm font-medium outline-offset-2 focus-visible:outline-2 focus-visible:outline-[var(--kit-accent)] ${
                      entry.id === selected ? 'border-[var(--t-line)] bg-[color-mix(in_oklab,var(--t-line)_26%,transparent)]' : 'border-[color-mix(in_oklab,var(--t-line)_45%,transparent)]'
                    }`}
                  >
                    {entry.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid flex-1 grid-cols-3 gap-4">
              {zone.meters.map((meter) => (
                <Panel key={meter.label} padding="tight">
                  <p className="text-sm text-[var(--kit-text-2)]">{meter.label}</p>
                  <p className="mt-1 text-4xl leading-none font-semibold tracking-tight tabular-nums">
                    {meter.value.toFixed(meter.decimals)} <span className="text-sm font-medium text-[var(--kit-text-2)]">{meter.unit}</span>
                  </p>
                  <Meter label="Of range" value={meter.value} max={meter.max} decimals={meter.decimals} unit={meter.unit} high={meter.high} className="mt-4" />
                </Panel>
              ))}
            </div>
            <TgoTrend zone={zone} />
          </div>
        </TgoFloor>
      </Canvas>
    </LookScope>
  );
}

function TronGridOpsPortrait() {
  const [selected, setSelected] = useState('export');
  const zone = tgoZone(selected);
  return (
    <LookScope look="glass">
      <Canvas padding="none">
        <TgoFloor className="h-full">
          <div className="flex h-full flex-col justify-between gap-3 p-4">
            <div>
              <p className="text-sm text-[var(--kit-text-2)]">{zone.figure.label}</p>
              <p className="text-4xl leading-none font-semibold tracking-tight tabular-nums">
                {zone.figure.value} <span className="text-sm font-medium text-[var(--kit-text-2)]">{zone.figure.unit}</span>
              </p>
            </div>
            <TgoMap selected={selected} onSelect={setSelected} tags={false} />
            <ul className="grid grid-cols-2 gap-1.5">
              {TGO_ZONES.map((entry) => (
                <li key={entry.id}>
                  <button
                    type="button"
                    data-tone={TGO_STATE_TONE[entry.state]}
                    aria-pressed={entry.id === selected}
                    onClick={() => setSelected(entry.id)}
                    className={`w-full rounded-[10px] border px-2 py-1.5 text-left text-xs leading-tight font-medium outline-offset-2 focus-visible:outline-2 focus-visible:outline-[var(--kit-accent)] ${
                      entry.id === selected
                        ? 'border-[var(--t-line)] bg-[color-mix(in_oklab,var(--t-line)_30%,var(--mountain-black))]'
                        : 'border-[color-mix(in_oklab,var(--t-line)_45%,transparent)] bg-[color-mix(in_oklab,var(--mountain-black)_70%,transparent)]'
                    }`}
                  >
                    {entry.name}
                    <span className="block text-[var(--t-ink)]">{entry.state}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </TgoFloor>
      </Canvas>
    </LookScope>
  );
}

function TronGridOpsMap() {
  const [selected, setSelected] = useState('power');
  const [animate, setAnimate] = useState(false);
  return (
    <LookScope look="glass" className="w-full">
      <Canvas padding="none">
        <div data-look="glass" className="flex flex-col gap-2 bg-[var(--mountain-black)] p-4">
          <div className="flex items-center justify-between gap-3">
            <TgoLegend />
            <Switch label="Animate flow" checked={animate} onCheckedChange={setAnimate} />
          </div>
          <TgoMap selected={selected} onSelect={setSelected} animate={animate} />
        </div>
      </Canvas>
    </LookScope>
  );
}

function TronGridOpsFloor() {
  return (
    <LookScope look="glass" className="w-full">
      <Canvas padding="none">
        <TgoFloor className="h-72">
          <div className="flex h-full flex-col items-center justify-start gap-1 p-6 text-center">
            <p className="text-2xl font-semibold tracking-tight">Nordkapp grid</p>
            <p className="text-sm text-[var(--kit-text-2)]">Six zones on one floor</p>
          </div>
        </TgoFloor>
      </Canvas>
    </LookScope>
  );
}

function TronGridOpsRail() {
  const [selected, setSelected] = useState('inlet');
  return (
    <LookScope look="glass" className="w-full">
      <Canvas padding="none">
        <TgoFloor className="h-full">
          <div className="flex h-full flex-col p-4">
            <TgoRail selected={selected} onSelect={setSelected} className="flex-1" />
          </div>
        </TgoFloor>
      </Canvas>
    </LookScope>
  );
}

function TronGridOpsTrend() {
  return (
    <LookScope look="glass" className="w-full">
      <Canvas padding="none">
        <TgoFloor className="h-full">
          <div className="flex h-full flex-col justify-center gap-4 p-4">
            <TgoTrend zone={tgoZone('compression')} />
            <TgoTrend zone={tgoZone('power')} />
          </div>
        </TgoFloor>
      </Canvas>
    </LookScope>
  );
}

function TronGridOpsToolbar() {
  const [flows, setFlows] = useState(true);
  const [animate, setAnimate] = useState(false);
  return (
    <LookScope look="glass" className="w-full">
      <Canvas padding="none">
        <TgoFloor className="h-72">
          <div className="flex h-full flex-col items-center justify-between p-5">
            <TgoToolbar flows={flows} onFlows={setFlows} animate={animate} onAnimate={setAnimate} />
            <div className="rounded-full border border-[var(--kit-rule)] bg-[color-mix(in_oklab,var(--mountain-black)_60%,transparent)] px-4 py-2">
              <TgoLegend />
            </div>
          </div>
        </TgoFloor>
      </Canvas>
    </LookScope>
  );
}

export default definePage({
  id: 'tron-grid-ops',
  title: 'Grid operations',
  summary:
    'The plant as a neon isometric map standing on a grid floor: zones are glowing plates, equipment is outlined in the colour of its state, and what flows between zones runs as lines of light.',
  guidance: {
    use: [
      'When where things are matters as much as how they are doing: zones, their neighbours and what connects them.',
      'For a handful of zones with a few landmark shapes each; the map is a diagram, not a model.',
      'One line colour per medium, with the legend always in view.',
    ],
    avoid: [
      'Neon on text: glow is for lines and outlines, words stay in plain high-contrast type.',
      'Flow animation by default: it is a switch and starts off.',
      'Drawing every asset: past twenty shapes the map stops being readable at a glance.',
    ],
  },
  source,
  sections: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description: 'Pick a zone on the map or in the rail; the rail, the name tag and the trend follow. Flow lines and their animation are switches.',
      specimens: [
        {
          id: 'TronGridOpsSignature',
          title: 'Neon plant map',
          note: 'Pick it as a showpiece overview where the layout of the plant is the navigation.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/tron-grid-ops/iso.ts', 'kit/Panel.tsx', 'kit/Meter.tsx', 'kit/TrendArea.tsx', 'kit/Legend.tsx', 'looks/LookScope.tsx'],
          Component: TronGridOpsSignature,
        },
      ],
    },
    {
      id: 'variations',
      title: 'Variations',
      description: 'Two more screens: a zone briefing without the map, and the portrait layout for a narrow display.',
      specimens: [
        {
          id: 'TronGridOpsZone',
          title: 'Zone briefing',
          note: 'Pick it after choosing a zone: three readings large, each on its range, and the lead trend underneath.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Panel.tsx', 'kit/Meter.tsx', 'kit/TrendArea.tsx'],
          Component: TronGridOpsZone,
        },
        {
          id: 'TronGridOpsPortrait',
          title: 'Portrait map',
          note: 'Pick it for a tablet or a kiosk: figure on top, map in the middle, zones as buttons below.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          bleed: true,
          uses: ['kit/tron-grid-ops/iso.ts'],
          Component: TronGridOpsPortrait,
        },
      ],
    },
    {
      id: 'parts',
      title: 'Parts',
      description: 'The map, the floor and the floating panels on their own.',
      specimens: [
        {
          id: 'TronGridOpsMap',
          title: 'Isometric map',
          note: 'Pick it on a plain dark surface when the grid floor would be too much.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          bleed: true,
          uses: ['kit/tron-grid-ops/iso.ts', 'kit/Legend.tsx'],
          Component: TronGridOpsMap,
        },
        {
          id: 'TronGridOpsRail',
          title: 'Zone rail',
          note: 'Pick it beside any map: the list is the keyboard path and the lower half shows the picked zone.',
          origin: 'custom',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Panel.tsx', 'kit/Meter.tsx'],
          Component: TronGridOpsRail,
        },
        {
          id: 'TronGridOpsFloor',
          title: 'Grid floor',
          note: 'Pick it as the backdrop of a showpiece screen; keep content above the horizon or on glass panels.',
          origin: 'custom',
          align: 'stretch',
          bleed: true,
          Component: TronGridOpsFloor,
        },
        {
          id: 'TronGridOpsToolbar',
          title: 'Floating toolbar and legend',
          note: 'Pick them to keep map controls off the map: a pill of switches on top, the line colours below.',
          origin: 'custom',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Legend.tsx'],
          Component: TronGridOpsToolbar,
        },
        {
          id: 'TronGridOpsTrend',
          title: 'Zone trend',
          note: 'Pick it as the floating panel in the free corner of the map for the picked zone.',
          origin: 'custom',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Panel.tsx', 'kit/TrendArea.tsx', 'kit/StatusPill.tsx'],
          Component: TronGridOpsTrend,
        },
      ],
    },
  ],
});
