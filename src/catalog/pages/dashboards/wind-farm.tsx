import { Button } from '@cognite/aura/components/button';
import { SegmentedControl, SegmentedControlButton, SegmentedControlList } from '@cognite/aura/components/segmented-control';
import {
  IconAlertOctagon,
  IconAlertTriangle,
  IconBolt,
  IconChartLine,
  IconCircleCheck,
  IconClipboardList,
  IconMap2,
  IconPlayerPause,
  IconTool,
  IconTopologyStar3,
  IconWind,
  IconWindmill,
} from '@cognite/aura/icons';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { AppFrame, type AppFrameNavItem } from '../../../library/kit/AppFrame';
import { Canvas } from '../../../library/kit/Canvas';
import { Grid } from '../../../library/kit/Grid';
import { IconChip } from '../../../library/kit/IconChip';
import { ListRow } from '../../../library/kit/ListRow';
import { Meter } from '../../../library/kit/Meter';
import { Panel } from '../../../library/kit/Panel';
import { SparkLine } from '../../../library/kit/SparkLine';
import { Stat } from '../../../library/kit/Stat';
import { StatusPill } from '../../../library/kit/StatusPill';
import { formatNumber, type Tone } from '../../../library/kit/tones';
import { TrendArea } from '../../../library/kit/TrendArea';
import { LookScope } from '../../../library/looks/LookScope';
import { REFERENCE_NOW, HOUR, createRandom, formatTime, makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './wind-farm.tsx?raw';

type WfState = 'running' | 'curtailed' | 'maintenance' | 'fault';

type WfMetric = 'output' | 'wind' | 'availability';

type WfTurbine = {
  id: string;
  /** String the turbine is cabled into: A–D. */
  string: string;
  /** Position on the map in percent of its width and height. */
  x: number;
  y: number;
  state: WfState;
  /** MW now, of 5.0 rated. */
  output: number;
  /** Hub-height wind speed in m/s. */
  wind: number;
  /** 30-day availability in percent. */
  availability: number;
  rotorSpeed: number;
  gearboxTemp: number;
  trend: number[];
};

const WF_RATED = 5;

const WF_STRINGS = ['A', 'B', 'C', 'D'];

const WF_SPECIAL: Record<string, WfState> = {
  B03: 'fault',
  C04: 'maintenance',
  D02: 'curtailed',
};

/** Power in MW for a hub-height wind speed: cut-in 3 m/s, rated 12 m/s, cut-out 25 m/s. */
function wfPower(wind: number): number {
  if (wind < 3 || wind > 25) return 0;
  return WF_RATED * Math.min(1, ((wind - 3) / 9) ** 3);
}

function wfBuildTurbines(): WfTurbine[] {
  const random = createRandom(2611);
  return WF_STRINGS.flatMap((string, row) =>
    Array.from({ length: 5 }, (_, col): WfTurbine => {
      const id = `${string}0${col + 1}`;
      const state = WF_SPECIAL[id] ?? 'running';
      // Wind comes from the west, so every column further east sits deeper in the wake.
      const wind = Number((11.7 - col * 0.6 + (random() - 0.5) * 0.9).toFixed(1));
      const free = wfPower(wind);
      const output = Number((state === 'fault' || state === 'maintenance' ? 0 : state === 'curtailed' ? Math.min(free, 2) : free).toFixed(1));
      const availability = Number((state === 'fault' ? 86.2 : state === 'maintenance' ? 91.4 : 95.2 + random() * 4.4).toFixed(1));
      const trend = makeValues({
        seed: 700 + row * 10 + col,
        points: 25,
        base: free,
        amplitude: 0.5,
        noise: 0.22,
        min: 0,
        max: WF_RATED,
        cycles: 1.4,
      });
      const shaped = trend.map((value, index) => {
        if (state === 'fault' && index >= 19) return 0;
        if (state === 'maintenance' && index >= 8) return 0;
        if (state === 'curtailed' && index >= 20) return Math.min(value, 2);
        return value;
      });
      return {
        id,
        string,
        x: 33.6 + col * 6.8 + (row % 2) * 2.8,
        y: 23 + row * 17.5,
        state,
        output,
        wind,
        availability,
        rotorSpeed: output === 0 ? 0 : Number((6 + (output / WF_RATED) * 6.1).toFixed(1)),
        gearboxTemp: Number((state === 'fault' ? 78.4 : 48 + (output / WF_RATED) * 14 + random() * 3).toFixed(1)),
        trend: [...shaped.slice(0, -1), output],
      };
    }),
  );
}

const WF_TURBINES = wfBuildTurbines();

const WF_FARM_OUTPUT = WF_TURBINES.reduce((sum, turbine) => sum + turbine.output, 0);

const WF_FARM_CAPACITY = WF_TURBINES.length * WF_RATED;

const WF_RUNNING = WF_TURBINES.filter((turbine) => turbine.state === 'running').length;

const WF_FARM_TREND = Array.from({ length: 25 }, (_, index) => Number(WF_TURBINES.reduce((sum, turbine) => sum + (turbine.trend[index] ?? 0), 0).toFixed(1)));

const WF_HOURS = Array.from({ length: 25 }, (_, index) => formatTime(REFERENCE_NOW - (24 - index) * HOUR));

const WF_METRICS: Record<
  WfMetric,
  {
    label: string;
    unit: string;
    decimals: number;
    min: number;
    max: number;
    tone: Tone;
    read: (turbine: WfTurbine) => number;
  }
> = {
  output: {
    label: 'Output',
    unit: 'MW',
    decimals: 1,
    min: 0,
    max: WF_RATED,
    tone: 'blue',
    read: (turbine) => turbine.output,
  },
  wind: {
    label: 'Wind speed',
    unit: 'm/s',
    decimals: 1,
    min: 8,
    max: 12.5,
    tone: 'teal',
    read: (turbine) => turbine.wind,
  },
  availability: {
    label: 'Availability',
    unit: '%',
    decimals: 1,
    min: 94,
    max: 100,
    tone: 'purple',
    read: (turbine) => turbine.availability,
  },
};

const WF_STATE_LABEL: Record<WfState, string> = {
  running: 'Running',
  curtailed: 'Curtailed',
  maintenance: 'In service',
  fault: 'Fault',
};

const WF_STATE_TONE: Record<WfState, Tone> = {
  running: 'success',
  curtailed: 'info',
  maintenance: 'warning',
  fault: 'critical',
};

const WF_STATE_NOTE: Record<WfState, string> = {
  running: 'Producing on the free wind. No open alarms.',
  curtailed: 'Held at 2.0 MW by the grid operator until 16:00.',
  maintenance: 'Stopped since 21:00 for the annual blade inspection.',
  fault: 'Tripped at 08:52 on gearbox oil temperature. Crew boat booked for 15:30.',
};

/** Rose sectors clockwise from north, as percent of the last 30 days in three speed bins. */
const WF_ROSE: readonly {
  label: string;
  bins: readonly [number, number, number];
}[] = [
  { label: 'N', bins: [1.6, 1.4, 0.4] },
  { label: 'NNE', bins: [1.2, 0.9, 0.2] },
  { label: 'ENE', bins: [1.1, 0.8, 0.1] },
  { label: 'E', bins: [1.4, 1.1, 0.3] },
  { label: 'ESE', bins: [1.3, 1.6, 0.4] },
  { label: 'SSE', bins: [1.8, 2.4, 0.9] },
  { label: 'S', bins: [2.2, 3.6, 1.6] },
  { label: 'SSW', bins: [2.6, 5.2, 2.9] },
  { label: 'WSW', bins: [3.1, 8.4, 5.6] },
  { label: 'W', bins: [2.8, 6.9, 4.1] },
  { label: 'WNW', bins: [2.1, 4.2, 2.0] },
  { label: 'NNW', bins: [1.9, 2.3, 0.8] },
];

const WF_NAV: AppFrameNavItem[] = [
  { id: 'map', label: 'Map', icon: <IconMap2 /> },
  { id: 'turbines', label: 'Turbines', icon: <IconWindmill /> },
  { id: 'strings', label: 'Strings', icon: <IconTopologyStar3 /> },
  { id: 'forecast', label: 'Forecast', icon: <IconChartLine /> },
  { id: 'work', label: 'Work', icon: <IconClipboardList />, badge: '3' },
];

function wfFind(id: string): WfTurbine {
  return WF_TURBINES.find((turbine) => turbine.id === id) ?? WF_TURBINES[0];
}

/** Position of a value on a metric's scale, 0–1. */
function wfShare(metric: WfMetric, value: number): number {
  const { min, max } = WF_METRICS[metric];
  return Math.min(1, Math.max(0, (value - min) / (max - min)));
}

/** One hue from pale to full strength: the map's sequential scale. */
function wfFill(tone: Tone, share: number): string {
  return `color-mix(in oklab, var(--kit-line-${tone}) ${Math.round(16 + share * 84)}%, var(--kit-surface))`;
}

function WfStateIcon({ state }: { state: WfState }) {
  if (state === 'fault') return <IconAlertOctagon />;
  if (state === 'maintenance') return <IconTool />;
  if (state === 'curtailed') return <IconPlayerPause />;
  return <IconCircleCheck />;
}

function WfMetricSwitch({ metric, onChange }: { metric: WfMetric; onChange: (metric: WfMetric) => void }) {
  return (
    <SegmentedControl
      value={metric}
      onValueChange={(next) => {
        if (next === 'output' || next === 'wind' || next === 'availability') onChange(next);
      }}
    >
      <SegmentedControlList size="small" aria-label="Colour the map by">
        <SegmentedControlButton value="output">Output</SegmentedControlButton>
        <SegmentedControlButton value="wind">Wind speed</SegmentedControlButton>
        <SegmentedControlButton value="availability">Availability</SegmentedControlButton>
      </SegmentedControlList>
    </SegmentedControl>
  );
}

function WfMarker({ turbine, metric, selected, onSelect }: { turbine: WfTurbine; metric: WfMetric; selected: boolean; onSelect: (id: string) => void }) {
  const definition = WF_METRICS[metric];
  const value = definition.read(turbine);
  const share = wfShare(metric, value);
  const down = turbine.state === 'fault' || turbine.state === 'maintenance';
  const flagged = turbine.state !== 'running';
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={`Turbine ${turbine.id}, ${WF_STATE_LABEL[turbine.state]}, ${formatNumber(value, definition.decimals)} ${definition.unit}`}
      onClick={() => onSelect(turbine.id)}
      style={{ left: `${turbine.x}%`, top: `${turbine.y}%` }}
      className="group absolute flex -translate-x-1/2 -translate-y-1/2 cursor-pointer flex-col items-center gap-2 outline-none"
    >
      <span
        data-tone={WF_STATE_TONE[turbine.state]}
        style={
          down
            ? undefined
            : {
                background: wfFill(definition.tone, share),
                color: share > 0.5 ? 'var(--kit-surface)' : 'var(--kit-text)',
              }
        }
        className={`relative flex size-11 items-center justify-center rounded-full border-2 border-[var(--kit-surface)] text-sm font-semibold tabular-nums shadow-md transition-transform group-hover:scale-110 group-focus-visible:ring-2 group-focus-visible:ring-[var(--kit-text)] ${
          down ? 'bg-[var(--t-vivid)] text-[var(--t-on-vivid)] [&>svg]:size-5' : ''
        } ${selected ? 'scale-110 ring-[3px] ring-[var(--kit-text)] ring-offset-2 ring-offset-[var(--kit-surface)]' : ''}`}
      >
        {down ? <WfStateIcon state={turbine.state} /> : formatNumber(value, definition.decimals)}
        {flagged && !down ? (
          <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-[var(--t-vivid)] text-[var(--t-on-vivid)] [&>svg]:size-3">
            <WfStateIcon state={turbine.state} />
          </span>
        ) : null}
      </span>
      <span className={`rounded-full px-1.5 text-xs font-medium ${selected ? 'bg-[var(--kit-text)] text-[var(--kit-surface)]' : 'text-[var(--kit-text-2)]'}`}>{turbine.id}</span>
    </button>
  );
}

const WF_SUBSTATION = { x: 48.6, y: 49.2 };

/** The sea chart under the markers: depth contours, licence boundary, array and export cables. */
function WfChart() {
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" className="absolute inset-0 size-full">
      {['M -2 14 C 22 4, 48 20, 74 8 S 96 6, 102 12', 'M -2 46 C 16 36, 30 58, 52 40 S 86 30, 102 44', 'M -2 82 C 18 70, 40 92, 62 78 S 90 72, 102 86'].map((path) => (
        <g key={path}>
          <path d={`${path} L 102 102 L -2 102 Z`} fill="var(--kit-line-blue)" fillOpacity="0.055" />
          <path d={path} fill="none" stroke="var(--kit-line-blue)" strokeOpacity="0.3" strokeWidth="1.25" vectorEffect="non-scaling-stroke" />
        </g>
      ))}
      <path
        d="M 20 12.5 L 78 12.5 L 78 87 L 20 87 Z"
        fill="color-mix(in oklab, var(--kit-surface) 46%, transparent)"
        stroke="var(--kit-text-3)"
        strokeDasharray="6 5"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
      />
      {WF_STRINGS.map((string) => {
        const row = WF_TURBINES.filter((turbine) => turbine.string === string);
        const first = row[0];
        const last = row[row.length - 1];
        const tap = Math.min(Math.max(WF_SUBSTATION.x, first.x), last.x);
        return (
          <g key={string} fill="none" stroke="var(--kit-text-2)" strokeOpacity="0.55" strokeWidth="1.5" vectorEffect="non-scaling-stroke">
            <path d={`M ${first.x} ${first.y} L ${last.x} ${last.y}`} vectorEffect="non-scaling-stroke" />
            <path d={`M ${tap} ${first.y} L ${WF_SUBSTATION.x} ${WF_SUBSTATION.y}`} vectorEffect="non-scaling-stroke" />
          </g>
        );
      })}
      {WF_TURBINES.filter((turbine) => turbine.output > 0).map((turbine) => (
        <path
          key={turbine.id}
          d={`M ${turbine.x} ${turbine.y} l 5.4 -2.2`}
          fill="none"
          stroke="var(--kit-surface)"
          strokeOpacity={0.35 + (turbine.output / WF_RATED) * 0.5}
          strokeWidth="14"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      ))}
      <path
        d={`M ${WF_SUBSTATION.x} 79 L ${WF_SUBSTATION.x} 100`}
        fill="none"
        stroke="var(--kit-line-amber)"
        strokeWidth="2.5"
        strokeDasharray="10 5"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function WfMap({ metric, selected, onSelect, inset = false }: { metric: WfMetric; selected: string; onSelect: (id: string) => void; inset?: boolean }) {
  return (
    <div className="absolute inset-0 bg-[color-mix(in_oklab,var(--kit-line-blue)_12%,var(--kit-surface))]">
      <WfChart />
      <span className="absolute -translate-x-1/2 text-xs font-medium whitespace-nowrap text-[var(--kit-text-2)]" style={{ left: `${WF_SUBSTATION.x}%`, top: inset ? '4%' : '14%' }}>
        Licence area PL 1102
      </span>
      <span className="absolute text-xs font-medium whitespace-nowrap text-[var(--kit-text-2)]" style={{ left: `${WF_SUBSTATION.x + 1.2}%`, top: '82.5%' }}>
        Export, 132 kV
      </span>
      <span
        className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 rounded-md border-2 border-[var(--kit-text)] bg-[var(--kit-surface)] px-2 py-1 text-xs font-semibold text-[var(--kit-text)] shadow-sm [&>svg]:size-4"
        style={{ left: `${WF_SUBSTATION.x}%`, top: `${WF_SUBSTATION.y}%` }}
      >
        <IconBolt aria-hidden="true" /> Substation
      </span>
      {WF_TURBINES.map((turbine) => (
        <WfMarker key={turbine.id} turbine={turbine} metric={metric} selected={turbine.id === selected} onSelect={onSelect} />
      ))}
    </div>
  );
}

function wfWedge(inner: number, outer: number, from: number, to: number): string {
  const point = (radius: number, degrees: number) => {
    const angle = ((degrees - 90) * Math.PI) / 180;
    return `${(110 + radius * Math.cos(angle)).toFixed(2)} ${(110 + radius * Math.sin(angle)).toFixed(2)}`;
  };
  return `M ${point(inner, from)} L ${point(outer, from)} A ${outer} ${outer} 0 0 1 ${point(outer, to)} L ${point(inner, to)} A ${inner} ${inner} 0 0 0 ${point(inner, from)} Z`;
}

const WF_ROSE_SCALE = 4.4;

const WF_ROSE_SHADES = [34, 66, 100];

/** Wind rose: how often the wind blew from each direction, stacked by speed. The arrow is now. */
function WfRose({ direction = 255 }: { direction?: number }) {
  return (
    <svg viewBox="0 0 220 220" role="img" aria-label="Wind rose for the last 30 days: the wind blew from west-south-west 17 percent of the time" className="size-[220px] shrink-0">
      {[5, 10, 15].map((percent) => (
        <circle key={percent} cx="110" cy="110" r={12 + percent * WF_ROSE_SCALE} fill="none" stroke="var(--kit-rule)" strokeDasharray={percent === 15 ? undefined : '3 4'} />
      ))}
      {WF_ROSE.map((sector, index) => {
        let inner = 12;
        return sector.bins.map((bin, level) => {
          const outer = inner + bin * WF_ROSE_SCALE;
          const path = wfWedge(inner, outer, index * 30 - 12, index * 30 + 12);
          inner = outer;
          return <path key={`${sector.label}-${level}`} d={path} fill={`color-mix(in oklab, var(--kit-line-teal) ${WF_ROSE_SHADES[level]}%, var(--kit-surface))`} />;
        });
      })}
      <g transform={`rotate(${direction} 110 110)`}>
        <path d="M 110 6 L 104 20 L 110 16 L 116 20 Z" fill="var(--kit-text)" />
      </g>
      {[
        { label: 'N', x: 110, y: 26 },
        { label: 'E', x: 197, y: 114 },
        { label: 'S', x: 110, y: 203 },
        { label: 'W', x: 22, y: 114 },
      ].map((mark) => (
        <text key={mark.label} x={mark.x} y={mark.y} textAnchor="middle" fontSize="12" fontWeight="600" fill="var(--kit-text-2)">
          {mark.label}
        </text>
      ))}
      <text x="150" y="67" fontSize="12" fill="var(--kit-text-3)">
        15 %
      </text>
    </svg>
  );
}

function WfRoseKey() {
  return (
    <ul className="flex w-full justify-between gap-2 text-xs whitespace-nowrap text-[var(--kit-text-2)]">
      {['Under 6', '6 to 12', 'Over 12 m/s'].map((label, level) => (
        <li key={label} className="flex items-center gap-1.5">
          <span
            className="size-3 rounded-sm"
            style={{
              background: `color-mix(in oklab, var(--kit-line-teal) ${WF_ROSE_SHADES[level]}%, var(--kit-surface))`,
            }}
          />
          {label}
        </li>
      ))}
    </ul>
  );
}

function WfScale({ metric }: { metric: WfMetric }) {
  const definition = WF_METRICS[metric];
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-[var(--kit-text-2)]">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-[var(--kit-text)]">
          {definition.label}, {definition.unit}
        </span>
        <span className="tabular-nums">{formatNumber(definition.min, 0)}</span>
        <span
          className="h-3 w-28 rounded-full"
          style={{
            background: `linear-gradient(90deg, ${wfFill(definition.tone, 0)}, ${wfFill(definition.tone, 1)})`,
          }}
        />
        <span className="tabular-nums">{formatNumber(definition.max, metric === 'wind' ? 1 : 0)}</span>
      </div>
      {(['fault', 'maintenance', 'curtailed'] as const).map((state) => (
        <span key={state} data-tone={WF_STATE_TONE[state]} className="flex items-center gap-1.5">
          <span className="flex size-5 items-center justify-center rounded-full bg-[var(--t-vivid)] text-[var(--t-on-vivid)] [&>svg]:size-3">
            <WfStateIcon state={state} />
          </span>
          {WF_STATE_LABEL[state]}
        </span>
      ))}
    </div>
  );
}

function WfFarmCard() {
  return (
    <Panel className="h-auto">
      <div className="flex items-center gap-3">
        <IconChip tone="blue">
          <IconWindmill />
        </IconChip>
        <div>
          <h2 className="text-lg leading-tight font-semibold text-[var(--kit-text)]">Havsul wind farm</h2>
          <p className="text-sm text-[var(--kit-text-2)]">Barents Sea · 100 MW</p>
        </div>
      </div>
      <p className="mt-5 flex items-baseline gap-2 text-[var(--kit-text)]">
        <span className="text-6xl leading-none font-semibold tracking-tight tabular-nums">{formatNumber(WF_FARM_OUTPUT, 1)}</span>
        <span className="text-xl font-medium text-[var(--kit-text-2)]">MW</span>
      </p>
      <SparkLine values={WF_FARM_TREND} label="Farm output over the last 24 hours" tone="blue" className="mt-3 h-12 w-full" />
      <p className="mt-4 text-sm leading-relaxed text-[var(--kit-text-2)]">
        <strong className="font-semibold text-[var(--kit-text)]">{Math.round((WF_FARM_OUTPUT / WF_FARM_CAPACITY) * 100)} % of capacity</strong> in a 10.4 m/s west-south-westerly.{' '}
        <strong className="font-semibold text-[var(--kit-text)]">{WF_RUNNING} of 20</strong> turbines run free; the back rows lose a third to wake.
      </p>
    </Panel>
  );
}

function WfRoseCard() {
  return (
    <Panel
      className="h-auto"
      title="Wind"
      subtitle="From WSW, 255°"
      actions={
        <p className="whitespace-nowrap text-[var(--kit-text)]">
          <span className="text-3xl leading-none font-semibold tabular-nums">10.4</span>
          <span className="ml-1 text-sm text-[var(--kit-text-2)]">m/s</span>
        </p>
      }
    >
      <div className="flex flex-col items-center gap-3">
        <WfRose />
        <WfRoseKey />
        <p className="w-full text-xs text-[var(--kit-text-2)]">Share of the last 30 days by direction and speed.</p>
      </div>
    </Panel>
  );
}

function WfTurbineCard({ turbine, metric, actions }: { turbine: WfTurbine; metric: WfMetric; actions?: ReactNode }) {
  const definition = WF_METRICS[metric];
  const rank = [...WF_TURBINES].sort((a, b) => definition.read(b) - definition.read(a)).findIndex((entry) => entry.id === turbine.id) + 1;
  return (
    <Panel
      title={`Turbine ${turbine.id}`}
      subtitle={`String ${turbine.string} · 5.0 MW rated`}
      actions={
        <StatusPill tone={WF_STATE_TONE[turbine.state]} icon={<WfStateIcon state={turbine.state} />}>
          {WF_STATE_LABEL[turbine.state]}
        </StatusPill>
      }
      footer={actions}
    >
      <div className="flex flex-1 flex-col gap-5">
        <div className="flex items-end justify-between gap-3">
          <p className="flex items-baseline gap-1.5 text-[var(--kit-text)]">
            <span className="text-5xl leading-none font-semibold tracking-tight tabular-nums">{formatNumber(definition.read(turbine), definition.decimals)}</span>
            <span className="text-base text-[var(--kit-text-2)]">{definition.unit}</span>
          </p>
          <p className="text-right text-sm text-[var(--kit-text-2)]">
            {definition.label}
            <br />
            <span className="font-medium text-[var(--kit-text)]">Ranked {rank} of 20</span>
          </p>
        </div>
        <p data-tone={WF_STATE_TONE[turbine.state]} className="rounded-lg bg-[var(--t-soft)] px-3 py-2 text-sm text-[var(--t-on-soft)]">
          {WF_STATE_NOTE[turbine.state]}
        </p>
        <TrendArea
          label={`Output of turbine ${turbine.id} over the last 24 hours`}
          labels={WF_HOURS}
          unit="MW"
          decimals={1}
          height={170}
          yDomain={[0, WF_RATED]}
          series={[
            {
              id: 'output',
              label: 'Output',
              values: turbine.trend,
              tone: 'blue',
            },
          ]}
          limits={[{ value: WF_RATED, label: 'Rated', tone: 'neutral' }]}
        />
        <div className="flex flex-1 flex-col justify-between gap-4">
          <Meter label="Wind at hub" value={turbine.wind} max={25} unit="m/s" decimals={1} target={{ value: 12, label: 'Rated' }} tone="teal" />
          <Meter label="Rotor speed" value={turbine.rotorSpeed} max={14} unit="rpm" decimals={1} tone="blue" hideScale />
          <Meter
            label="Gearbox oil"
            value={turbine.gearboxTemp}
            max={90}
            unit="°C"
            decimals={1}
            high={72}
            target={{ value: 72, label: 'Limit' }}
            tone={turbine.gearboxTemp > 72 ? 'critical' : 'purple'}
          />
        </div>
      </div>
    </Panel>
  );
}

function WindFarmSignature() {
  const [metric, setMetric] = useState<WfMetric>('output');
  const [selected, setSelected] = useState('B03');
  const turbine = wfFind(selected);
  return (
    <LookScope look="studio">
      <Canvas padding="none" className="relative h-[820px] overflow-hidden">
        <WfMap metric={metric} selected={selected} onSelect={setSelected} />

        <div className="absolute top-4 bottom-4 left-4 flex w-[264px] flex-col justify-between gap-4">
          <WfFarmCard />
          <WfRoseCard />
        </div>

        <div className="pointer-events-none absolute inset-y-4 right-[344px] left-[296px] flex flex-col items-center justify-between">
          <div className="pointer-events-auto rounded-full border border-[var(--kit-rule)] bg-[var(--kit-surface)] p-1.5 shadow-lg">
            <WfMetricSwitch metric={metric} onChange={setMetric} />
          </div>
          <div className="pointer-events-auto rounded-2xl border border-[var(--kit-rule)] bg-[var(--kit-surface)] px-4 py-2.5 shadow-lg">
            <WfScale metric={metric} />
          </div>
        </div>

        <div className="absolute top-4 right-4 bottom-4 w-[312px]">
          <WfTurbineCard
            turbine={turbine}
            metric={metric}
            actions={
              <div className="flex w-full gap-2">
                <Button size="sm" className="flex-1">
                  Open turbine
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  Work order
                </Button>
              </div>
            }
          />
        </div>
      </Canvas>
    </LookScope>
  );
}

const WF_CURVE = Array.from({ length: 51 }, (_, index) => ({
  wind: index * 0.5,
  power: wfPower(index * 0.5),
}));

function wfCurvePoints(turbineSeed: number, loss: number): { wind: number; power: number }[] {
  const random = createRandom(turbineSeed);
  return Array.from({ length: 90 }, () => {
    const wind = 2.5 + random() * 15.5;
    const power = Math.max(0, Math.min(WF_RATED, wfPower(wind) * (1 - loss * random()) + (random() - 0.5) * 0.25));
    return { wind, power };
  });
}

const WF_CURVE_POINTS = wfCurvePoints(91, 0.2);

/** Measured ten-minute points against the warranted power curve. */
function WfPowerCurve() {
  const x = (wind: number) => 56 + (wind / 25) * 620;
  const y = (power: number) => 262 - (power / WF_RATED) * 232;
  const line = WF_CURVE.map((point, index) => `${index === 0 ? 'M' : 'L'} ${x(point.wind).toFixed(1)} ${y(point.power).toFixed(1)}`).join(' ');
  return (
    <svg
      viewBox="0 0 700 304"
      role="img"
      aria-label="Power curve of turbine B03: measured points fall under the warranted curve between 7 and 12 metres per second"
      className="w-full"
    >
      {[0, 1, 2, 3, 4, 5].map((power) => (
        <g key={power}>
          <line x1="56" x2="676" y1={y(power)} y2={y(power)} stroke="var(--kit-rule)" />
          <text x="46" y={y(power) + 4} textAnchor="end" fontSize="14" fill="var(--kit-text-2)">
            {power}
          </text>
        </g>
      ))}
      {[0, 5, 10, 15, 20, 25].map((wind) => (
        <text key={wind} x={x(wind)} y="284" textAnchor="middle" fontSize="14" fill="var(--kit-text-2)">
          {wind}
        </text>
      ))}
      <text x="676" y="300" textAnchor="end" fontSize="14" fill="var(--kit-text-2)">
        Wind at hub, m/s
      </text>
      <text x="56" y="14" fontSize="14" fill="var(--kit-text-2)">
        Output, MW
      </text>
      <rect x={x(7)} y="30" width={x(12) - x(7)} height="232" fill="var(--kit-line-warning)" fillOpacity="0.1" />
      <text x={x(9.5)} y="64" textAnchor="middle" fontSize="14" fontWeight="600" fill="var(--kit-line-warning)">
        Under curve
      </text>
      {[
        { wind: 3, label: 'Cut-in' },
        { wind: 12, label: 'Rated' },
      ].map((mark) => (
        <g key={mark.label}>
          <line x1={x(mark.wind)} x2={x(mark.wind)} y1="30" y2="262" stroke="var(--kit-text-3)" strokeDasharray="4 4" />
          <text x={x(mark.wind) + 6} y="44" fontSize="14" fill="var(--kit-text-2)">
            {mark.label}
          </text>
        </g>
      ))}
      {WF_CURVE_POINTS.map((point, index) => (
        <circle key={index} cx={x(point.wind)} cy={y(point.power)} r="3.5" fill="var(--kit-line-blue)" fillOpacity="0.55" />
      ))}
      <path d={line} fill="none" stroke="var(--kit-text)" strokeWidth="2.25" />
      <circle cx={x(11.1)} cy={y(3.1)} r="7" fill="var(--kit-line-critical)" stroke="var(--kit-surface)" strokeWidth="2.5" />
      <text x={x(11.1) + 12} y={y(3.1) + 16} fontSize="14" fontWeight="600" fill="var(--kit-text)">
        08:50, last point before the trip
      </text>
    </svg>
  );
}

/** Nacelle heading against the wind: the gap between the two needles is the yaw error. */
function WfYawDial({ wind = 255, nacelle = 247 }: { wind?: number; nacelle?: number }) {
  return (
    <svg viewBox="0 0 220 220" role="img" aria-label={`Nacelle heading ${nacelle} degrees against wind from ${wind} degrees`} className="size-[220px] shrink-0">
      <circle cx="110" cy="110" r="92" fill="var(--kit-well)" stroke="var(--kit-rule)" />
      {Array.from({ length: 36 }, (_, index) => (
        <line
          key={index}
          x1="110"
          y1={index % 9 === 0 ? 20 : 24}
          x2="110"
          y2="32"
          stroke="var(--kit-text-3)"
          strokeWidth={index % 9 === 0 ? 2 : 1}
          transform={`rotate(${index * 10} 110 110)`}
        />
      ))}
      <path d={wfWedge(0, 78, nacelle, wind)} fill="var(--kit-line-warning)" fillOpacity="0.28" />
      <g transform={`rotate(${wind} 110 110)`}>
        <line x1="110" y1="110" x2="110" y2="34" stroke="var(--kit-line-teal)" strokeWidth="3" strokeDasharray="6 4" />
      </g>
      <g transform={`rotate(${nacelle} 110 110)`}>
        <path d="M 110 30 L 102 52 L 110 46 L 118 52 Z" fill="var(--kit-text)" />
        <line x1="110" y1="110" x2="110" y2="46" stroke="var(--kit-text)" strokeWidth="3" />
        <line x1="70" y1="110" x2="150" y2="110" stroke="var(--kit-text)" strokeWidth="5" strokeLinecap="round" />
      </g>
      <circle cx="110" cy="110" r="7" fill="var(--kit-surface)" stroke="var(--kit-text)" strokeWidth="2.5" />
      <text x="110" y="15" textAnchor="middle" fontSize="12" fontWeight="600" fill="var(--kit-text-2)">
        N
      </text>
      <text x="110" y="216" textAnchor="middle" fontSize="12" fontWeight="600" fill="var(--kit-text-2)">
        S
      </text>
    </svg>
  );
}

const WF_FAULT_LOG: readonly {
  time: string;
  title: string;
  detail: string;
  tone: Tone;
}[] = [
  {
    time: '08:52',
    title: 'Trip: gearbox oil temperature high-high',
    detail: '78.4 °C against a trip limit of 78.0 °C',
    tone: 'critical',
  },
  {
    time: '08:31',
    title: 'Gearbox oil temperature high',
    detail: '72.6 °C against a limit of 72.0 °C',
    tone: 'warning',
  },
  {
    time: '07:48',
    title: 'Oil cooler fan 2 not running',
    detail: 'Start command sent, no feedback after 10 s',
    tone: 'warning',
  },
  {
    time: '06:10',
    title: 'Yaw error above 6° for 30 minutes',
    detail: 'Nacelle 247°, wind 255°',
    tone: 'info',
  },
];

function WindFarmTurbineSheet() {
  const turbine = wfFind('B03');
  return (
    <LookScope look="studio">
      <AppFrame
        variant="topbar"
        brand={{ name: 'Havsul', detail: 'Wind farm', mark: <IconWindmill /> }}
        nav={WF_NAV}
        current="turbines"
        title="Turbine B03"
        subtitle="String B · commissioned 2021 · tripped today at 08:52"
        status={
          <StatusPill tone="critical" size="lg" icon={<IconAlertOctagon />}>
            Fault
          </StatusPill>
        }
        actions={
          <>
            <Button variant="outline" size="sm">
              Back to map
            </Button>
            <Button size="sm">Create work order</Button>
          </>
        }
      >
        <Grid>
          <Panel className="col-span-8" title="Power curve" subtitle="Ten-minute averages, last 7 days, against the warranted curve">
            <div className="flex flex-1 flex-col justify-between gap-4">
              <WfPowerCurve />
              <div className="flex flex-wrap gap-x-10 gap-y-3 border-t border-[var(--kit-rule)] pt-4">
                <Stat variant="plain" size="sm" label="Energy lost to the curve" value={38.6} decimals={1} unit="MWh this week" tone="warning" />
                <Stat variant="plain" size="sm" label="Capacity factor" value={41.2} decimals={1} unit="%" />
                <Stat variant="plain" size="sm" label="Lost since the trip" value={19.4} decimals={1} unit="MWh" tone="critical" />
              </div>
            </div>
          </Panel>
          <Panel className="col-span-4" title="Yaw" subtitle="Nacelle heading against the wind">
            <div className="flex flex-1 flex-col items-center justify-between gap-4">
              <WfYawDial />
              <p className="text-sm text-[var(--kit-text-2)]">
                The nacelle sat 8° off the wind for most of the morning. Past 6° the rotor sheds load unevenly and the gearbox runs hotter.
              </p>
              <div className="grid w-full grid-cols-3 gap-3 text-sm">
                <p className="text-[var(--kit-text-2)]">
                  Wind
                  <br />
                  <span className="text-lg font-semibold text-[var(--kit-text)] tabular-nums">255°</span>
                </p>
                <p className="text-[var(--kit-text-2)]">
                  Nacelle
                  <br />
                  <span className="text-lg font-semibold text-[var(--kit-text)] tabular-nums">247°</span>
                </p>
                <p className="text-[var(--kit-text-2)]">
                  Error
                  <br />
                  <span className="text-lg font-semibold text-[var(--kit-line-warning)] tabular-nums">8°</span>
                </p>
              </div>
            </div>
          </Panel>
          <Panel className="col-span-5" title="Drivetrain" subtitle="At the moment of the trip">
            <div className="flex flex-1 flex-col justify-between gap-5">
              <Meter label="Gearbox oil" value={turbine.gearboxTemp} max={90} unit="°C" decimals={1} high={72} target={{ value: 72, label: 'Limit' }} tone="critical" />
              <Meter label="Main bearing" value={58.2} max={90} unit="°C" decimals={1} high={75} target={{ value: 75, label: 'Limit' }} tone="blue" />
              <Meter label="Generator winding" value={96.5} max={160} unit="°C" decimals={1} high={140} target={{ value: 140, label: 'Limit' }} tone="blue" />
              <Meter label="Tower vibration" value={1.8} max={6} unit="mm/s" decimals={1} high={4.5} target={{ value: 4.5, label: 'Limit' }} tone="blue" />
            </div>
          </Panel>
          <Panel className="col-span-7" title="What led to the trip" subtitle="Events on B03 today, newest first">
            <ul className="flex flex-1 flex-col justify-between">
              {WF_FAULT_LOG.map((event) => (
                <ListRow
                  key={event.time}
                  tone={event.tone}
                  leading={
                    <IconChip tone={event.tone} size="sm">
                      {event.tone === 'critical' ? <IconAlertOctagon /> : event.tone === 'warning' ? <IconAlertTriangle /> : <IconWind />}
                    </IconChip>
                  }
                  title={event.title}
                  meta={event.detail}
                  trailing={event.time}
                />
              ))}
            </ul>
          </Panel>
        </Grid>
      </AppFrame>
    </LookScope>
  );
}

function WfStringLane({ string, selected, onSelect }: { string: string; selected: string; onSelect: (id: string) => void }) {
  const row = WF_TURBINES.filter((turbine) => turbine.string === string);
  const total = row.reduce((sum, turbine) => sum + turbine.output, 0);
  return (
    <div className="grid grid-cols-[7rem_minmax(0,1fr)] items-end gap-4 border-b border-[var(--kit-rule)] py-4 last:border-b-0">
      <div>
        <p className="text-sm font-medium text-[var(--kit-text-2)]">String {string}</p>
        <p className="text-3xl leading-tight font-semibold text-[var(--kit-text)] tabular-nums">{formatNumber(total, 1)}</p>
        <p className="text-xs text-[var(--kit-text-2)]">MW of 25</p>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {row.map((turbine) => {
          const down = turbine.state === 'fault' || turbine.state === 'maintenance';
          return (
            <button
              key={turbine.id}
              type="button"
              aria-pressed={turbine.id === selected}
              aria-label={`Turbine ${turbine.id}, ${WF_STATE_LABEL[turbine.state]}, ${formatNumber(turbine.output, 1)} MW`}
              onClick={() => onSelect(turbine.id)}
              data-tone={WF_STATE_TONE[turbine.state]}
              className={`flex cursor-pointer flex-col gap-1.5 rounded-lg p-1.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--kit-text)] ${
                turbine.id === selected ? 'bg-[var(--kit-well)] ring-2 ring-[var(--kit-text)]' : ''
              }`}
            >
              <span className="flex h-24 items-end rounded-md bg-[var(--kit-track)]">
                {down ? (
                  <span className="flex h-full w-full items-center justify-center rounded-md bg-[var(--t-soft)] text-[var(--t-on-soft)] [&>svg]:size-5">
                    <WfStateIcon state={turbine.state} />
                  </span>
                ) : (
                  <span
                    className="w-full rounded-md"
                    style={{
                      height: `${Math.max(6, (turbine.output / WF_RATED) * 100)}%`,
                      background: turbine.state === 'curtailed' ? 'var(--kit-line-info)' : 'var(--kit-line-blue)',
                    }}
                  />
                )}
              </span>
              <span className="flex items-baseline justify-between gap-1 text-xs">
                <span className="font-medium text-[var(--kit-text)]">{turbine.id}</span>
                <span className="text-[var(--kit-text-2)] tabular-nums">{formatNumber(turbine.output, 1)}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WindFarmStrings() {
  const [selected, setSelected] = useState('D02');
  const turbine = wfFind(selected);
  return (
    <LookScope look="studio">
      <Canvas>
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm text-[var(--kit-text-2)]">Havsul wind farm · by string</p>
              <h2 className="text-2xl font-semibold text-[var(--kit-text)]">{formatNumber(WF_FARM_OUTPUT, 1)} MW from four strings</h2>
            </div>
            <StatusPill tone="critical" size="lg" icon={<IconAlertOctagon />}>
              1 fault
            </StatusPill>
          </div>
          <Panel className="h-auto" title="Output per turbine" subtitle="Bar height is share of the 5.0 MW rating; west is on the left">
            {WF_STRINGS.map((string) => (
              <WfStringLane key={string} string={string} selected={selected} onSelect={setSelected} />
            ))}
          </Panel>
          <Panel className="h-auto" tone={WF_STATE_TONE[turbine.state]}>
            <div className="flex items-center gap-4">
              <IconChip tone={WF_STATE_TONE[turbine.state]} size="lg">
                <WfStateIcon state={turbine.state} />
              </IconChip>
              <div className="min-w-0 flex-1">
                <p className="text-base font-semibold text-[var(--kit-text)]">
                  Turbine {turbine.id} · {WF_STATE_LABEL[turbine.state]}
                </p>
                <p className="text-sm text-[var(--kit-text-2)]">{WF_STATE_NOTE[turbine.state]}</p>
              </div>
              <p className="text-right whitespace-nowrap text-[var(--kit-text)]">
                <span className="text-3xl font-semibold tabular-nums">{formatNumber(turbine.output, 1)}</span>
                <span className="ml-1 text-sm text-[var(--kit-text-2)]">MW</span>
              </p>
            </div>
          </Panel>
          <nav aria-label="Sections" className="mx-auto flex gap-1 rounded-full border border-[var(--kit-rule)] bg-[var(--kit-surface)] p-1.5 shadow-lg">
            {WF_NAV.slice(0, 4).map((item) => (
              <span
                key={item.id}
                aria-current={item.id === 'strings' ? 'page' : undefined}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium [&>svg]:size-4 ${
                  item.id === 'strings' ? 'bg-[var(--kit-text)] text-[var(--kit-surface)]' : 'text-[var(--kit-text-2)]'
                }`}
              >
                {item.icon}
                {item.label}
              </span>
            ))}
          </nav>
        </div>
      </Canvas>
    </LookScope>
  );
}

function WindFarmPartMap() {
  const [selected, setSelected] = useState('A02');
  return (
    <LookScope look="studio">
      <Canvas padding="none" className="relative h-[520px] overflow-hidden">
        <WfMap metric="wind" selected={selected} onSelect={setSelected} inset />
      </Canvas>
    </LookScope>
  );
}

function WindFarmPartFarmCard() {
  return (
    <LookScope look="studio">
      <Canvas>
        <WfFarmCard />
      </Canvas>
    </LookScope>
  );
}

function WindFarmPartRose() {
  return (
    <LookScope look="studio">
      <Canvas>
        <WfRoseCard />
      </Canvas>
    </LookScope>
  );
}

function WindFarmPartTurbineCard() {
  return (
    <LookScope look="studio">
      <Canvas>
        <WfTurbineCard turbine={wfFind('A02')} metric="output" />
      </Canvas>
    </LookScope>
  );
}

function WindFarmPartPowerCurve() {
  return (
    <LookScope look="studio">
      <Canvas>
        <Panel title="Power curve" subtitle="Measured points against the warranted curve">
          <WfPowerCurve />
        </Panel>
      </Canvas>
    </LookScope>
  );
}

function WindFarmPartYaw() {
  return (
    <LookScope look="studio">
      <Canvas>
        <Panel title="Yaw error" subtitle="Solid needle is the nacelle, dashed is the wind">
          <div className="flex flex-1 items-center justify-center">
            <WfYawDial />
          </div>
        </Panel>
      </Canvas>
    </LookScope>
  );
}

export default definePage({
  id: 'wind-farm',
  title: 'Wind farm',
  summary:
    'A map-first screen for an offshore wind farm: every turbine sits where it stands at sea, coloured by the metric you pick, with the farm, the wind and the selected turbine on cards floating over the chart.',
  guidance: {
    use: [
      'When position explains the numbers: wake, strings and cable routes only make sense on the layout.',
      'One sequential hue per metric, with stopped and faulted units in status colour plus an icon.',
      'Floating cards for the summary and the selection, so the map keeps the full canvas.',
    ],
    avoid: [
      'A map for assets whose location does not matter; use a table or a ranked bar chart.',
      'Rainbow scales, or colouring by two metrics at once.',
      'Covering the array with cards: keep the turbines in the clear middle of the canvas.',
    ],
  },
  source,
  sections: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description: 'The full screen in the studio look. Select a turbine on the map and switch what the colour means.',
      specimens: [
        {
          id: 'WindFarmSignature',
          title: 'Farm map',
          note: 'Pick it as the landing screen of a wind operations centre, where the first question is which turbines are down and where.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Canvas.tsx', 'kit/Panel.tsx', 'kit/TrendArea.tsx', 'kit/Meter.tsx', 'kit/StatusPill.tsx', 'kit/SparkLine.tsx', 'looks/LookScope.tsx'],
          Component: WindFarmSignature,
        },
      ],
    },
    {
      id: 'variations',
      title: 'Variations',
      description: 'Other screens of the same product: the sheet behind one turbine, and the farm by electrical string on a tablet.',
      specimens: [
        {
          id: 'WindFarmTurbineSheet',
          title: 'Turbine sheet',
          note: 'Pick it for the screen behind a map marker, where an engineer works out why one turbine underperforms or tripped.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/AppFrame.tsx', 'kit/Panel.tsx', 'kit/Meter.tsx', 'kit/ListRow.tsx', 'kit/Stat.tsx'],
          Component: WindFarmTurbineSheet,
        },
        {
          id: 'WindFarmStrings',
          title: 'Strings on a tablet',
          note: 'Pick it for a crew boat tablet: the farm as four cable strings with a bottom dock instead of a map.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Canvas.tsx', 'kit/Panel.tsx', 'kit/IconChip.tsx', 'kit/StatusPill.tsx'],
          Component: WindFarmStrings,
        },
      ],
    },
    {
      id: 'parts',
      title: 'Parts',
      description: 'The pieces of the screen on their own.',
      specimens: [
        {
          id: 'WindFarmPartMap',
          title: 'Turbine map',
          note: 'Pick it wherever the layout itself is the chart; here coloured by wind speed to show the wake.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Canvas.tsx'],
          Component: WindFarmPartMap,
        },
        {
          id: 'WindFarmPartFarmCard',
          title: 'Farm summary card',
          note: 'Pick it to state the one headline figure in a sentence instead of a row of tiles.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Panel.tsx', 'kit/SparkLine.tsx', 'kit/IconChip.tsx'],
          Component: WindFarmPartFarmCard,
        },
        {
          id: 'WindFarmPartRose',
          title: 'Wind rose',
          note: 'Pick it to show where the wind comes from and how hard, with the current direction as an arrow.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Panel.tsx'],
          Component: WindFarmPartRose,
        },
        {
          id: 'WindFarmPartTurbineCard',
          title: 'Turbine card',
          note: 'Pick it as the selection card: the figure, its rank, a day of output and three drivetrain readings.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Panel.tsx', 'kit/TrendArea.tsx', 'kit/Meter.tsx', 'kit/StatusPill.tsx'],
          Component: WindFarmPartTurbineCard,
        },
        {
          id: 'WindFarmPartPowerCurve',
          title: 'Power curve',
          note: 'Pick it to judge a turbine against its warranted curve and point at the band where it falls short.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Panel.tsx'],
          Component: WindFarmPartPowerCurve,
        },
        {
          id: 'WindFarmPartYaw',
          title: 'Yaw dial',
          note: 'Pick it for a heading against a reference, where the angle between two needles is the reading.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Panel.tsx'],
          Component: WindFarmPartYaw,
        },
      ],
    },
  ],
});
