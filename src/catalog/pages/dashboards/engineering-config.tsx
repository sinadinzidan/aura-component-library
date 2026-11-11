import { Button } from '@cognite/aura/components/button';
import { SegmentedControl, SegmentedControlButton, SegmentedControlList } from '@cognite/aura/components/segmented-control';
import {
  IconAlertTriangle,
  IconArrowBackUp,
  IconBinaryTree,
  IconCheck,
  IconGitCompare,
  IconHistory,
  IconListCheck,
  IconRuler2,
  IconSend,
  IconSettings,
  IconTable,
  IconX,
} from '@cognite/aura/icons';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { AppFrame } from '../../../library/kit/AppFrame';
import { Canvas } from '../../../library/kit/Canvas';
import { DataTable, type DataTableColumn } from '../../../library/kit/DataTable';
import { Grid } from '../../../library/kit/Grid';
import { Panel } from '../../../library/kit/Panel';
import { StatusPill } from '../../../library/kit/StatusPill';
import { formatNumber, toneLine } from '../../../library/kit/tones';
import { TrendLine } from '../../../library/kit/TrendLine';
import { LookScope } from '../../../library/looks/LookScope';
import { definePage } from '../../types';

import source from './engineering-config.tsx?raw';

type EcMode = 'live' | 'draft' | 'compare';

type EcLimitKey = 'low' | 'high' | 'trip';

type EcLimits = {
  low: number;
  high: number;
  trip: number;
  deadband: number;
  delay: number;
  priority: string;
};

type EcConfig = {
  id: string;
  tag: string;
  name: string;
  asset: string;
  unit: string;
  decimals: number;
  range: readonly [number, number];
  /** The part of the range the drawing shows, so a change of a few units is visible. */
  window: readonly [number, number];
  tick: number;
  /** Reading at the time of the draft. */
  now: number;
  live: EcLimits;
  draft: EcLimits;
  owner: string;
  reason: string;
};

const EC_CONFIGS: EcConfig[] = [
  {
    id: 'tt-92532',
    tag: '23-TT-92532',
    name: 'Discharge temperature',
    asset: '1st stage compressor',
    unit: '°C',
    decimals: 1,
    range: [0, 180],
    window: [130, 160],
    tick: 5,
    now: 141.2,
    live: {
      low: 90,
      high: 145,
      trip: 155,
      deadband: 1,
      delay: 5,
      priority: 'High',
    },
    draft: {
      low: 90,
      high: 142,
      trip: 152,
      deadband: 1,
      delay: 10,
      priority: 'High',
    },
    owner: 'Aisha Khan',
    reason: 'Vendor bulletin RB-114 lowers the continuous discharge limit after the seal upgrade.',
  },
  {
    id: 'vt-92540',
    tag: '23-VT-92540',
    name: 'Drive-end vibration',
    asset: '1st stage compressor',
    unit: 'mm/s',
    decimals: 1,
    range: [0, 15],
    window: [3, 13],
    tick: 1,
    now: 6.8,
    live: {
      low: 0,
      high: 7.1,
      trip: 11,
      deadband: 0.2,
      delay: 3,
      priority: 'High',
    },
    draft: {
      low: 0,
      high: 7.5,
      trip: 11,
      deadband: 0.2,
      delay: 3,
      priority: 'High',
    },
    owner: 'Aisha Khan',
    reason: 'Baseline moved after the coupling realignment; the alarm has been standing for three weeks.',
  },
  {
    id: 'pt-92531',
    tag: '23-PT-92531',
    name: 'Discharge pressure',
    asset: '1st stage compressor',
    unit: 'barg',
    decimals: 1,
    range: [0, 60],
    window: [36, 58],
    tick: 2,
    now: 48.6,
    live: {
      low: 40,
      high: 52,
      trip: 55,
      deadband: 0.5,
      delay: 2,
      priority: 'High',
    },
    draft: {
      low: 40,
      high: 52,
      trip: 55,
      deadband: 0.5,
      delay: 2,
      priority: 'High',
    },
    owner: 'Ingrid Haugen',
    reason: 'No change in this draft.',
  },
  {
    id: 'tt-91141',
    tag: '23-TT-91141',
    name: 'Cooler outlet temperature',
    asset: 'Interstage cooler',
    unit: '°C',
    decimals: 1,
    range: [0, 60],
    window: [30, 50],
    tick: 2,
    now: 38.9,
    live: {
      low: 20,
      high: 40,
      trip: 45,
      deadband: 0.5,
      delay: 30,
      priority: 'Medium',
    },
    draft: {
      low: 20,
      high: 42,
      trip: 46,
      deadband: 0.5,
      delay: 30,
      priority: 'Medium',
    },
    owner: 'Magnus Solberg',
    reason: 'Summer cooling water runs 2 °C warmer; the alarm fires daily without an action.',
  },
  {
    id: 'lt-10012',
    tag: '20-LT-10012',
    name: 'Separator level',
    asset: 'Inlet separator',
    unit: '%',
    decimals: 1,
    range: [0, 100],
    window: [20, 90],
    tick: 10,
    now: 54.3,
    live: {
      low: 30,
      high: 70,
      trip: 85,
      deadband: 1,
      delay: 5,
      priority: 'Medium',
    },
    draft: {
      low: 35,
      high: 70,
      trip: 85,
      deadband: 1,
      delay: 5,
      priority: 'Medium',
    },
    owner: 'Ingrid Haugen',
    reason: 'Gas blow-by study asks for 5 % more liquid seal at the low alarm.',
  },
  {
    id: 'it-20013',
    tag: '27-IT-20013',
    name: 'Motor current',
    asset: 'Export pump A',
    unit: 'A',
    decimals: 1,
    range: [0, 120],
    window: [70, 110],
    tick: 5,
    now: 86.2,
    live: {
      low: 40,
      high: 95,
      trip: 105,
      deadband: 1,
      delay: 5,
      priority: 'Medium',
    },
    draft: {
      low: 40,
      high: 95,
      trip: 105,
      deadband: 1,
      delay: 5,
      priority: 'Medium',
    },
    owner: 'Jonas Nyberg',
    reason: 'No change in this draft.',
  },
];

const EC_LIMIT_KEYS: readonly EcLimitKey[] = ['low', 'high', 'trip'];

const EC_LIMIT_LETTER: Record<EcLimitKey, string> = {
  low: 'L',
  high: 'H',
  trip: 'HH',
};

const EC_LIMIT_NAME: Record<EcLimitKey, string> = {
  low: 'Low alarm',
  high: 'High alarm',
  trip: 'High-high trip',
};

type EcTreeRow = {
  id: string;
  depth: number;
  label: string;
  tag: string;
  configId?: string;
};

const EC_TREE: EcTreeRow[] = [
  { id: 'nk', depth: 0, label: 'Nordkapp plant', tag: 'NK' },
  { id: 'nk-20', depth: 1, label: 'Inlet and separation', tag: 'NK-20' },
  { id: 'va-1001', depth: 2, label: 'Inlet separator', tag: '20-VA-1001' },
  {
    id: 'r-lt',
    depth: 3,
    label: 'Separator level',
    tag: '20-LT-10012',
    configId: 'lt-10012',
  },
  { id: 'nk-23', depth: 1, label: 'Gas compression', tag: 'NK-23' },
  { id: 'ka-9101', depth: 2, label: '1st stage compressor', tag: '23-KA-9101' },
  {
    id: 'r-pt',
    depth: 3,
    label: 'Discharge pressure',
    tag: '23-PT-92531',
    configId: 'pt-92531',
  },
  {
    id: 'r-tt',
    depth: 3,
    label: 'Discharge temperature',
    tag: '23-TT-92532',
    configId: 'tt-92532',
  },
  {
    id: 'r-vt',
    depth: 3,
    label: 'Drive-end vibration',
    tag: '23-VT-92540',
    configId: 'vt-92540',
  },
  { id: 'ha-9114', depth: 2, label: 'Interstage cooler', tag: '23-HA-9114' },
  {
    id: 'r-ct',
    depth: 3,
    label: 'Cooler outlet temperature',
    tag: '23-TT-91141',
    configId: 'tt-91141',
  },
  { id: 'nk-27', depth: 1, label: 'Gas export', tag: 'NK-27' },
  { id: 'pa-2001a', depth: 2, label: 'Export pump A', tag: '27-PA-2001A' },
  {
    id: 'r-it',
    depth: 3,
    label: 'Motor current',
    tag: '27-IT-20013',
    configId: 'it-20013',
  },
];

/** The accent of the drawing: everything that differs between live and draft is drawn in it. */
const EC_ACCENT = toneLine('warning');

function ecConfig(id: string): EcConfig {
  return EC_CONFIGS.find((config) => config.id === id) ?? EC_CONFIGS[0];
}

type EcDiffRow = {
  id: string;
  property: string;
  live: string;
  draft: string;
  delta: string;
  changed: boolean;
};

function ecDiff(config: EcConfig): EcDiffRow[] {
  const figure = (value: number, unit: string) => `${formatNumber(value, config.decimals)} ${unit}`;
  const signed = (value: number, unit: string) => `${value > 0 ? '+' : '−'}${formatNumber(Math.abs(value), config.decimals)} ${unit}`;
  const limits = EC_LIMIT_KEYS.map((key): EcDiffRow => {
    const change = config.draft[key] - config.live[key];
    return {
      id: key,
      property: `${EC_LIMIT_NAME[key]} (${EC_LIMIT_LETTER[key]})`,
      live: figure(config.live[key], config.unit),
      draft: figure(config.draft[key], config.unit),
      delta: change === 0 ? '—' : signed(change, config.unit),
      changed: change !== 0,
    };
  });
  const deadband = config.draft.deadband - config.live.deadband;
  const delay = config.draft.delay - config.live.delay;
  return [
    ...limits,
    {
      id: 'deadband',
      property: 'Deadband',
      live: figure(config.live.deadband, config.unit),
      draft: figure(config.draft.deadband, config.unit),
      delta: deadband === 0 ? '—' : signed(deadband, config.unit),
      changed: deadband !== 0,
    },
    {
      id: 'delay',
      property: 'On-delay',
      live: `${config.live.delay} s`,
      draft: `${config.draft.delay} s`,
      delta: delay === 0 ? '—' : `${delay > 0 ? '+' : '−'}${Math.abs(delay)} s`,
      changed: delay !== 0,
    },
    {
      id: 'priority',
      property: 'Priority',
      live: config.live.priority,
      draft: config.draft.priority,
      delta: '—',
      changed: config.live.priority !== config.draft.priority,
    },
  ];
}

function ecChangeCount(config: EcConfig): number {
  return ecDiff(config).filter((row) => row.changed).length;
}

const EC_TOTAL_CHANGES = EC_CONFIGS.reduce((sum, config) => sum + ecChangeCount(config), 0);

type EcCheck = { id: string; label: string; detail: string; pass: boolean };

function ecChecks(config: EcConfig): EcCheck[] {
  const { draft } = config;
  const span = config.range[1] - config.range[0];
  const margin = draft.high - config.now;
  const ordered = draft.low < draft.high && draft.high < draft.trip;
  const inside = draft.low >= config.range[0] && draft.trip <= config.range[1];
  return [
    {
      id: 'order',
      label: 'Limits in order',
      detail: ordered ? 'L below H below HH' : 'Limits overlap',
      pass: ordered,
    },
    {
      id: 'range',
      label: 'Inside instrument range',
      detail: `${formatNumber(config.range[0])} to ${formatNumber(config.range[1])} ${config.unit}`,
      pass: inside,
    },
    {
      id: 'margin',
      label: 'Margin to current reading',
      detail: `${formatNumber(margin, config.decimals)} ${config.unit} below H${margin / span < 0.01 ? ', expect a standing alarm' : ''}`,
      pass: margin / span >= 0.01,
    },
    {
      id: 'deadband',
      label: 'Deadband under 5 % of the band',
      detail: `${formatNumber(draft.deadband, config.decimals)} ${config.unit}`,
      pass: draft.deadband <= (draft.high - draft.low) * 0.05,
    },
  ];
}

function ecHatch(color: string): string {
  return `repeating-linear-gradient(135deg, ${color} 0 1.5px, transparent 1.5px 6px)`;
}

/** A dimension line as on a drawing: two arrowheads, extension ticks and the measure written on it. */
function EcDimension({
  from,
  to,
  top,
  label,
  accent = false,
  side = 'center',
}: {
  from: number;
  to: number;
  top: number;
  label: string;
  accent?: boolean;
  side?: 'center' | 'before' | 'after';
}) {
  const left = Math.min(from, to);
  const width = Math.abs(to - from);
  const color = accent ? EC_ACCENT : 'var(--kit-text)';
  const text =
    side === 'center' ? 'left-1/2 -translate-x-1/2 bottom-1.5' : side === 'before' ? 'right-full mr-3 -translate-y-1/2' : 'left-full ml-3 -translate-y-1/2';
  return (
    <div
      className="absolute h-0"
      style={{
        left: `${left}%`,
        width: `${width}%`,
        top,
        borderTop: `1.5px solid ${color}`,
      }}
    >
      <span
        className="absolute top-[-5.5px] left-0 size-0"
        style={{
          borderBlock: '4.75px solid transparent',
          borderRight: `8px solid ${color}`,
          transform: 'translateX(-1px)',
        }}
      />
      <span
        className="absolute top-[-5.5px] right-0 size-0"
        style={{
          borderBlock: '4.75px solid transparent',
          borderLeft: `8px solid ${color}`,
          transform: 'translateX(1px)',
        }}
      />
      <span className={`absolute bg-[var(--kit-halo)] px-1 text-sm leading-4 font-semibold whitespace-nowrap tabular-nums ${text}`} style={{ color }}>
        {label}
      </span>
    </div>
  );
}

type EcRailProps = {
  config: EcConfig;
  limits: EcLimits;
  /** Limits to compare against: a flag whose value differs is drawn in the accent. */
  against: EcLimits;
  top: number;
  name: string;
  flags: 'above' | 'below';
};

/** One revision as a rail on the scale: the normal band hatched, and a flag at every limit. */
function EcRail({ config, limits, against, top, name, flags }: EcRailProps) {
  const [start, end] = config.window;
  const at = (value: number) => ((value - start) / (end - start)) * 100;
  const clamp = (value: number) => Math.min(100, Math.max(0, at(value)));
  return (
    <>
      <p className="absolute left-0 w-24 -translate-y-1/2 text-sm leading-4 font-semibold" style={{ top }}>
        {name}
      </p>
      <div className="absolute right-0 left-28" style={{ top }}>
        <div className="absolute inset-x-0 top-[-1px] h-0.5 bg-[var(--kit-text)]" />
        <div
          className="absolute h-3"
          style={{
            left: `${clamp(limits.low)}%`,
            width: `${clamp(limits.high) - clamp(limits.low)}%`,
            top: flags === 'above' ? 2 : -14,
            background: ecHatch('color-mix(in oklab, var(--kit-text) 45%, transparent)'),
          }}
        />
        <div
          className="absolute h-3"
          style={{
            left: `${clamp(limits.high)}%`,
            width: `${clamp(limits.trip) - clamp(limits.high)}%`,
            top: flags === 'above' ? 2 : -14,
            background: ecHatch(EC_ACCENT),
          }}
        />
        <div
          className="absolute h-3"
          style={{
            left: `${clamp(limits.trip)}%`,
            right: 0,
            top: flags === 'above' ? 2 : -14,
            background: toneLine('critical'),
            opacity: 0.8,
          }}
        />
        {EC_LIMIT_KEYS.map((key) => {
          const value = limits[key];
          const position = at(value);
          if (position < 0 || position > 100) return null;
          const changed = value !== against[key];
          return (
            <div key={key} className="absolute" style={{ left: `${position}%` }}>
              <span className="absolute -left-px w-0.5 bg-[var(--kit-text)]" style={flags === 'above' ? { top: -22, height: 22 } : { top: 0, height: 22 }} />
              <span
                className="absolute -translate-x-1/2 border px-1.5 py-0.5 text-sm leading-4 font-semibold whitespace-nowrap tabular-nums"
                style={{
                  top: flags === 'above' ? -46 : 22,
                  borderColor: changed ? EC_ACCENT : 'var(--kit-text)',
                  background: changed && flags === 'below' ? EC_ACCENT : 'var(--kit-halo)',
                  color: changed && flags === 'below' ? 'var(--kit-halo)' : changed ? EC_ACCENT : 'var(--kit-text)',
                }}
              >
                {EC_LIMIT_LETTER[key]} {formatNumber(value, config.decimals)}
              </span>
            </div>
          );
        })}
      </div>
    </>
  );
}

/** Live and draft limits of one tag drawn to scale, with every change dimensioned between the rails. */
function EcLadder({ config, mode }: { config: EcConfig; mode: EcMode }) {
  const [start, end] = config.window;
  const at = (value: number) => ((value - start) / (end - start)) * 100;
  const ticks = Array.from({ length: Math.floor((end - start) / config.tick) + 1 }, (_, index) => start + index * config.tick);
  const compare = mode === 'compare';
  const liveTop = compare ? 96 : 170;
  const draftTop = compare ? 276 : 170;
  const changes = EC_LIMIT_KEYS.filter((key) => config.live[key] !== config.draft[key] && at(config.live[key]) >= 0 && at(config.draft[key]) <= 100);
  const shown = mode === 'draft' ? config.draft : config.live;
  const span = config.range[1] - config.range[0];
  const offScale = EC_LIMIT_KEYS.filter((key) => at(shown[key]) < 0);

  return (
    <div
      className="relative h-[24.5rem]"
      role="img"
      aria-label={`${config.name} limits, ${mode === 'compare' ? 'live against draft' : mode}, drawn on a scale from ${start} to ${end} ${config.unit}`}
    >
      {mode !== 'draft' ? <EcRail config={config} limits={config.live} against={config.draft} top={liveTop} name="Live · rev C" flags="above" /> : null}
      {mode !== 'live' ? (
        <EcRail config={config} limits={config.draft} against={config.live} top={draftTop} name="Draft · rev D" flags={compare ? 'below' : 'above'} />
      ) : null}

      <div className="absolute inset-y-0 right-0 left-28">
        {compare
          ? changes.map((key) => (
              <div key={key}>
                <span
                  className="absolute w-px"
                  style={{
                    left: `${at(config.live[key])}%`,
                    top: liveTop,
                    height: draftTop - liveTop,
                    background: `repeating-linear-gradient(${EC_ACCENT} 0 5px, transparent 5px 9px)`,
                  }}
                />
                <span
                  className="absolute w-px"
                  style={{
                    left: `${at(config.draft[key])}%`,
                    top: liveTop,
                    height: draftTop - liveTop,
                    background: `repeating-linear-gradient(${EC_ACCENT} 0 5px, transparent 5px 9px)`,
                  }}
                />
                <EcDimension
                  from={at(config.live[key])}
                  to={at(config.draft[key])}
                  top={(liveTop + draftTop) / 2}
                  accent
                  label={`${config.draft[key] > config.live[key] ? '+' : '−'}${formatNumber(Math.abs(config.draft[key] - config.live[key]), config.decimals)} ${config.unit}`}
                />
              </div>
            ))
          : null}
        {(compare ? [config.live, config.draft] : [shown]).map((limits, index) => (
          <EcDimension
            key={index}
            from={at(config.now)}
            to={at(limits.high)}
            top={compare && index === 1 ? draftTop - 40 : liveTop + 40}
            accent={(limits.high - config.now) / span < 0.01}
            side="before"
            label={`Margin ${formatNumber(limits.high - config.now, config.decimals)} ${config.unit}`}
          />
        ))}

        <span
          className="absolute w-px"
          style={{
            left: `${at(config.now)}%`,
            top: 16,
            bottom: 34,
            background: 'repeating-linear-gradient(var(--kit-text) 0 9px, transparent 9px 12px, var(--kit-text) 12px 14px, transparent 14px 17px)',
          }}
        />
        <span
          className="absolute top-0 -translate-x-1/2 bg-[var(--kit-text)] px-1.5 py-0.5 text-sm leading-4 font-semibold whitespace-nowrap text-[var(--kit-halo)] tabular-nums"
          style={{ left: `${at(config.now)}%` }}
        >
          Now {formatNumber(config.now, config.decimals)}
        </span>

        <div className="absolute inset-x-0 bottom-0 h-8 border-t border-[var(--kit-text)]">
          {ticks.map((tick) => (
            <span key={tick} className="absolute top-0 h-1.5 w-px bg-[var(--kit-text)]" style={{ left: `${at(tick)}%` }}>
              <span className="absolute top-2.5 left-0 -translate-x-1/2 text-xs text-[var(--kit-text-2)] tabular-nums">{formatNumber(tick)}</span>
            </span>
          ))}
        </div>
      </div>
      <p className="absolute bottom-0 left-0 w-24 text-xs leading-4 text-[var(--kit-text-2)]">
        Scale, {config.unit}
        {offScale.length > 0 ? ` · ${offScale.map((key) => `${EC_LIMIT_LETTER[key]} ${formatNumber(shown[key], config.decimals)}`).join(', ')} off scale` : ''}
      </p>
    </div>
  );
}

const EC_DIFF_COLUMNS: DataTableColumn<EcDiffRow>[] = [
  {
    id: 'property',
    header: 'Property',
    nowrap: true,
    cell: (row) => <span className={row.changed ? 'font-semibold' : ''}>{row.property}</span>,
  },
  {
    id: 'live',
    header: 'Live · rev C',
    numeric: true,
    nowrap: true,
    cell: (row) => (row.changed ? <span className="line-through">{row.live}</span> : row.live),
  },
  {
    id: 'draft',
    header: 'Draft · rev D',
    numeric: true,
    nowrap: true,
    cell: (row) => <span className={row.changed ? 'font-semibold' : ''}>{row.draft}</span>,
  },
  {
    id: 'delta',
    header: 'Change',
    numeric: true,
    nowrap: true,
    cell: (row) =>
      row.changed ? (
        <span className="font-semibold" style={{ color: EC_ACCENT }}>
          {row.delta === '—' ? 'Changed' : row.delta}
        </span>
      ) : (
        <span className="text-[var(--kit-text-3)]">None</span>
      ),
  },
];

function EcDiffTable({ config }: { config: EcConfig }) {
  return (
    <DataTable
      label={`Live and draft properties of ${config.tag}`}
      columns={EC_DIFF_COLUMNS}
      rows={ecDiff(config)}
      rowKey={(row) => row.id}
      rowTone={(row) => (row.changed ? 'warning' : undefined)}
    />
  );
}

/** The configuration tree: areas and equipment as headings, tags as rows that carry their change count. */
function EcTree({ selected, onSelect }: { selected: string; onSelect: (id: string) => void }) {
  return (
    <ul className="@container flex flex-1 flex-col" aria-label="Configuration tree">
      {EC_TREE.map((row) => {
        const config = row.configId ? ecConfig(row.configId) : null;
        const changes = config ? ecChangeCount(config) : 0;
        const active = config !== null && config.id === selected;
        const guides = Array.from({ length: row.depth }, (_, index) => (
          <span key={index} aria-hidden="true" className="w-3 shrink-0 self-stretch border-l border-dashed border-[var(--kit-rule)] @[15rem]:w-4" />
        ));
        if (!config) {
          return (
            <li key={row.id} className="flex items-center pl-1">
              {guides}
              <span className={`flex-1 py-1.5 leading-5 ${row.depth < 2 ? 'text-sm font-semibold' : 'text-sm font-medium'}`}>
                {row.label} <span className="font-normal whitespace-nowrap text-[var(--kit-text-3)] tabular-nums">{row.tag}</span>
              </span>
            </li>
          );
        }
        return (
          <li key={row.id} className="flex items-stretch pl-1">
            {guides}
            <button
              type="button"
              aria-current={active ? 'true' : undefined}
              onClick={() => onSelect(config.id)}
              className={`flex min-w-0 flex-1 items-center justify-between gap-2 px-2 py-1.5 text-left hover:bg-[color-mix(in_oklab,var(--kit-text)_8%,transparent)] ${active ? 'bg-[var(--kit-text)] text-[var(--kit-halo)] hover:bg-[var(--kit-text)]' : ''}`}
            >
              <span className="min-w-0">
                <span className="block text-sm leading-5 font-semibold whitespace-nowrap tabular-nums">{row.tag}</span>
                <span className={`block text-xs leading-4 ${active ? '' : 'text-[var(--kit-text-2)]'}`}>{row.label}</span>
              </span>
              {changes > 0 ? (
                <span
                  aria-label={`${changes} ${changes === 1 ? 'change' : 'changes'} in draft`}
                  className="shrink-0 border px-1.5 text-xs leading-5 font-semibold whitespace-nowrap"
                  style={active ? { borderColor: 'currentColor' } : { borderColor: EC_ACCENT, color: EC_ACCENT }}
                >
                  <span aria-hidden="true" className="@[15rem]:hidden">
                    Δ {changes}
                  </span>
                  <span className="hidden @[15rem]:inline">
                    {changes} {changes === 1 ? 'change' : 'changes'}
                  </span>
                </span>
              ) : null}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function EcSheetRow({ label, children, changed = false }: { label: string; children: ReactNode; changed?: boolean }) {
  return (
    <div className="grid grid-cols-[5.75rem_minmax(0,1fr)] items-baseline gap-2 border-b border-dashed border-[var(--kit-rule)] py-1.5">
      <dt className="text-xs text-[var(--kit-text-2)]">{label}</dt>
      <dd className="text-sm font-medium tabular-nums" style={changed ? { color: EC_ACCENT } : undefined}>
        {children}
      </dd>
    </div>
  );
}

function EcCheckList({ config }: { config: EcConfig }) {
  return (
    <ul className="flex flex-col gap-2">
      {ecChecks(config).map((check) => (
        <li key={check.id} className="flex items-start gap-2.5">
          <span
            className="mt-0.5 flex size-5 shrink-0 items-center justify-center border [&>svg]:size-3.5"
            style={check.pass ? undefined : { borderColor: EC_ACCENT, color: EC_ACCENT }}
          >
            {check.pass ? <IconCheck aria-hidden="true" /> : <IconAlertTriangle aria-hidden="true" />}
          </span>
          <span className="min-w-0">
            <span className="block text-sm leading-5 font-semibold">{check.label}</span>
            <span className="block text-xs leading-4" style={{ color: check.pass ? 'var(--kit-text-2)' : EC_ACCENT }}>
              {check.pass ? 'Passed' : 'Warning'} · {check.detail}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Every property of the selected tag as a sheet; fields the draft changes are drawn in the accent. */
function EcPropertySheet({ config, mode }: { config: EcConfig; mode: EcMode }) {
  const limits = mode === 'live' ? config.live : config.draft;
  const mark = (changed: boolean) => changed && mode !== 'live';
  const figure = (value: number) => `${formatNumber(value, config.decimals)} ${config.unit}`;
  return (
    <div className="flex flex-1 flex-col gap-4">
      <dl>
        <EcSheetRow label="Tag">
          <span className="whitespace-nowrap">{config.tag}</span>
        </EcSheetRow>
        <EcSheetRow label="Description">{config.name}</EcSheetRow>
        <EcSheetRow label="Equipment">{config.asset}</EcSheetRow>
        <EcSheetRow label="Range">
          {formatNumber(config.range[0])} to {formatNumber(config.range[1])} {config.unit}
        </EcSheetRow>
        <EcSheetRow label="Low alarm" changed={mark(config.live.low !== config.draft.low)}>
          {figure(limits.low)}
        </EcSheetRow>
        <EcSheetRow label="High alarm" changed={mark(config.live.high !== config.draft.high)}>
          {figure(limits.high)}
        </EcSheetRow>
        <EcSheetRow label="High-high trip" changed={mark(config.live.trip !== config.draft.trip)}>
          {figure(limits.trip)}
        </EcSheetRow>
        <EcSheetRow label="Deadband" changed={mark(config.live.deadband !== config.draft.deadband)}>
          {figure(limits.deadband)}
        </EcSheetRow>
        <EcSheetRow label="On-delay" changed={mark(config.live.delay !== config.draft.delay)}>
          {limits.delay} s
        </EcSheetRow>
        <EcSheetRow label="Priority">{limits.priority}</EcSheetRow>
        <EcSheetRow label="Owner">{config.owner}</EcSheetRow>
      </dl>
      <div>
        <p className="text-xs text-[var(--kit-text-2)]">Reason for change</p>
        <p className="mt-1 text-sm leading-5">{config.reason}</p>
      </div>
      <div className="mt-auto border-t border-[var(--kit-text)] pt-3">
        <p className="mb-2 text-xs text-[var(--kit-text-2)]">Checks on the draft</p>
        <EcCheckList config={config} />
      </div>
    </div>
  );
}

/** The controls of the drawing, floating over it: which revision to show, and what to do with the draft. */
function EcToolbar({ mode, onMode, sent, onSend }: { mode: EcMode; onMode: (mode: EcMode) => void; sent: boolean; onSend: () => void }) {
  return (
    <div
      role="toolbar"
      aria-label="Revision"
      className="flex items-center gap-3 border border-[var(--kit-text)] bg-[var(--kit-halo)] p-2 shadow-[5px_5px_0_color-mix(in_oklab,var(--kit-text)_22%,transparent)]"
    >
      <SegmentedControl value={mode} onValueChange={(next) => onMode(next === 'live' ? 'live' : next === 'draft' ? 'draft' : 'compare')}>
        <SegmentedControlList size="small" aria-label="Revision shown">
          <SegmentedControlButton value="live">Live</SegmentedControlButton>
          <SegmentedControlButton value="draft">Draft</SegmentedControlButton>
          <SegmentedControlButton value="compare">Compare</SegmentedControlButton>
        </SegmentedControlList>
      </SegmentedControl>
      <span aria-hidden="true" className="h-6 w-px bg-[var(--kit-rule)]" />
      <Button variant="ghost" size="sm">
        <IconArrowBackUp /> Revert
      </Button>
      <Button size="sm" onClick={onSend}>
        {sent ? <IconCheck /> : <IconSend />} {sent ? 'Sent for approval' : `Send ${EC_TOTAL_CHANGES} changes`}
      </Button>
    </div>
  );
}

function EcTitleBlock({ revision = 'C live · D draft', status }: { revision?: string; status: string }) {
  return (
    <>
      <div>
        <p className="text-xs">Drawing</p>
        <p className="text-sm font-semibold">NK-CFG-023</p>
      </div>
      <div>
        <p className="text-xs">Revision</p>
        <p className="text-sm font-semibold">{revision}</p>
      </div>
      <div>
        <p className="text-xs">Status</p>
        <p className="text-sm font-semibold">{status}</p>
      </div>
    </>
  );
}

function EngineeringConfigSignature() {
  const [selected, setSelected] = useState('tt-92532');
  const [mode, setMode] = useState<EcMode>('compare');
  const [sent, setSent] = useState(false);
  const config = ecConfig(selected);
  const changes = ecChangeCount(config);
  return (
    <LookScope look="blueprint">
      <AppFrame
        brand={{
          name: 'Alarm limits',
          detail: 'Nordkapp configuration',
          mark: <IconSettings />,
        }}
        tools={<EcTitleBlock status={sent ? 'Awaiting approval' : `${EC_TOTAL_CHANGES} changes in draft`} />}
      >
        <div className="relative">
          <Grid className="min-h-[55rem] pb-20">
            <Panel className="col-span-3" title="Tree" subtitle="6 tags" icon={<IconBinaryTree className="size-4" />} padding="tight">
              <EcTree selected={selected} onSelect={setSelected} />
            </Panel>
            <Panel
              className="col-span-6"
              title={`${config.tag} · ${config.name}`}
              subtitle={mode === 'compare' ? `${changes} ${changes === 1 ? 'change' : 'changes'}` : mode === 'live' ? 'Live' : 'Draft'}
              icon={<IconGitCompare className="size-4" />}
            >
              <div className="flex flex-1 flex-col justify-between gap-6">
                <EcLadder config={config} mode={mode} />
                <EcDiffTable config={config} />
              </div>
            </Panel>
            <Panel className="col-span-3" title="Properties" subtitle={mode === 'live' ? 'Rev C' : 'Rev D'} icon={<IconTable className="size-4" />}>
              <EcPropertySheet config={config} mode={mode} />
            </Panel>
          </Grid>
          <div className="absolute inset-x-0 bottom-3 flex justify-center">
            <EcToolbar mode={mode} onMode={setMode} sent={sent} onSend={() => setSent((before) => !before)} />
          </div>
        </div>
      </AppFrame>
    </LookScope>
  );
}

const EC_CHANGED = EC_CONFIGS.filter((config) => ecChangeCount(config) > 0);

type EcVerdict = 'accepted' | 'rejected';

function EngineeringConfigChangeSet() {
  const [verdicts, setVerdicts] = useState<Record<string, EcVerdict>>({
    'tt-91141': 'accepted',
    'lt-10012': 'accepted',
  });
  const decide = (id: string, verdict: EcVerdict) => setVerdicts((before) => ({ ...before, [id]: verdict }));
  const accepted = EC_CHANGED.filter((config) => verdicts[config.id] === 'accepted').length;
  const decided = EC_CHANGED.filter((config) => verdicts[config.id] !== undefined).length;
  return (
    <LookScope look="blueprint">
      <AppFrame
        brand={{
          name: 'Alarm limits',
          detail: 'Review of revision D',
          mark: <IconSettings />,
        }}
        tools={<EcTitleBlock revision="D draft" status={`${decided} of ${EC_CHANGED.length} reviewed`} />}
      >
        <Grid>
          <div className="col-span-9 flex flex-col gap-[var(--kit-gap)]">
            {EC_CHANGED.map((config) => {
              const verdict = verdicts[config.id];
              const rows = ecDiff(config).filter((row) => row.changed);
              return (
                <Panel
                  key={config.id}
                  title={`${config.tag} · ${config.name}`}
                  subtitle={verdict === 'accepted' ? 'Accepted' : verdict === 'rejected' ? 'Rejected' : 'To review'}
                  icon={<IconRuler2 className="size-4" />}
                >
                  <div className="grid grid-cols-[minmax(0,1fr)_15rem] items-center gap-6">
                    <div>
                      <ul className="flex flex-wrap gap-x-6 gap-y-1">
                        {rows.map((row) => (
                          <li key={row.id} className="text-sm">
                            <span className="text-[var(--kit-text-2)]">{row.property}</span> <span className="line-through tabular-nums">{row.live}</span>{' '}
                            <span className="font-semibold tabular-nums" style={{ color: EC_ACCENT }}>
                              {row.draft}
                            </span>
                          </li>
                        ))}
                      </ul>
                      <p className="mt-2 text-sm leading-5 text-[var(--kit-text-2)]">{config.reason}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      {ecChecks(config).some((check) => !check.pass) ? (
                        <StatusPill tone="warning" icon={<IconAlertTriangle />}>
                          1 check warns
                        </StatusPill>
                      ) : (
                        <StatusPill tone="success" icon={<IconCheck />}>
                          4 checks passed
                        </StatusPill>
                      )}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={verdict === 'accepted' ? 'default' : 'outline'}
                          aria-pressed={verdict === 'accepted'}
                          onClick={() => decide(config.id, 'accepted')}
                        >
                          <IconCheck /> Accept
                        </Button>
                        <Button
                          size="sm"
                          variant={verdict === 'rejected' ? 'default' : 'outline'}
                          aria-pressed={verdict === 'rejected'}
                          onClick={() => decide(config.id, 'rejected')}
                        >
                          <IconX /> Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                </Panel>
              );
            })}
          </div>
          <Panel className="col-span-3" title="Approval" subtitle="Rev D" icon={<IconListCheck className="size-4" />}>
            <div className="flex flex-1 flex-col gap-4">
              <div>
                <p className="text-6xl leading-none font-medium tracking-tight tabular-nums">
                  {accepted}
                  <span className="text-2xl text-[var(--kit-text-2)]"> / {EC_CHANGED.length}</span>
                </p>
                <p className="mt-1 text-sm text-[var(--kit-text-2)]">tags accepted</p>
              </div>
              <dl>
                <EcSheetRow label="Prepared">Aisha Khan · 11 Mar</EcSheetRow>
                <EcSheetRow label="Checked">Magnus Solberg · 12 Mar</EcSheetRow>
                <EcSheetRow label="Approved" changed={decided < EC_CHANGED.length}>
                  {decided < EC_CHANGED.length ? 'Open' : 'Liv Wold · today'}
                </EcSheetRow>
                <EcSheetRow label="Applies">Next shift change, 19:00</EcSheetRow>
              </dl>
              <p className="text-sm leading-5 text-[var(--kit-text-2)]">
                Rejected tags stay on revision C. Accepted limits download to the control system at the next shift change.
              </p>
              <Button size="sm" className="mt-auto w-full" disabled={decided < EC_CHANGED.length}>
                Approve revision D
              </Button>
              <p className="text-xs text-[var(--kit-text-2)]">
                {decided < EC_CHANGED.length ? `Review the remaining ${EC_CHANGED.length - decided} to approve.` : 'Every tag has a verdict.'}
              </p>
            </div>
          </Panel>
        </Grid>
      </AppFrame>
    </LookScope>
  );
}

const EC_REVISIONS = [
  {
    rev: 'D',
    date: 'Draft',
    by: 'Aisha Khan',
    note: 'Seal upgrade and summer cooling water limits',
    changes: 7,
    alarms: 0,
  },
  {
    rev: 'C',
    date: '14 Jan 2026',
    by: 'Magnus Solberg',
    note: 'Recompressor vibration trip after bearing change',
    changes: 3,
    alarms: 61,
  },
  {
    rev: 'B',
    date: '2 Oct 2025',
    by: 'Aisha Khan',
    note: 'Alarm rationalisation, compression area',
    changes: 41,
    alarms: 74,
  },
  {
    rev: 'A',
    date: '18 Jun 2025',
    by: 'Ingrid Haugen',
    note: 'As commissioned',
    changes: 212,
    alarms: 138,
  },
];

const EC_ALARM_WEEKS = [142, 136, 139, 131, 128, 133, 90, 78, 81, 74, 70, 76, 72, 69, 73, 66, 62, 64, 59, 61, 63, 60, 58, 61];

function EngineeringConfigRevisions() {
  const [selected, setSelected] = useState('C');
  const revision = EC_REVISIONS.find((entry) => entry.rev === selected) ?? EC_REVISIONS[1];
  return (
    <LookScope look="blueprint">
      <AppFrame
        brand={{
          name: 'Alarm limits',
          detail: 'Revision history',
          mark: <IconSettings />,
        }}
        tools={<EcTitleBlock revision={`${revision.rev} selected`} status={revision.date === 'Draft' ? 'Not applied' : `Applied ${revision.date}`} />}
      >
        <Grid>
          <Panel className="col-span-7" title="Alarms per week" subtitle="Compression area · 24 weeks" icon={<IconHistory className="size-4" />}>
            <TrendLine
              label="Alarms per week in the compression area across revisions A to C"
              labels={EC_ALARM_WEEKS.map((_, index) => `W${index + 34 > 52 ? index + 34 - 52 : index + 34}`)}
              decimals={0}
              height={300}
              showLegend={false}
              series={[
                {
                  id: 'alarms',
                  label: 'Alarms per week',
                  values: EC_ALARM_WEEKS,
                  tone: 'accent',
                },
              ]}
              limits={[{ value: 70, label: 'Target', tone: 'warning' }]}
              notes={
                <p className="text-sm text-[var(--kit-text-2)]">
                  Revision B, applied in week 40, removed 41 nuisance limits; the weekly alarm load has nearly halved since.
                </p>
              }
            />
          </Panel>
          <Panel className="col-span-5" title="Revision table" subtitle="NK-CFG-023" icon={<IconTable className="size-4" />}>
            <div className="flex flex-1 flex-col justify-between gap-4">
              <DataTable
                label="Revisions of the alarm limit configuration"
                columns={[
                  {
                    id: 'rev',
                    header: 'Rev',
                    nowrap: true,
                    cell: (row) => (
                      <button
                        type="button"
                        aria-pressed={row.rev === selected}
                        onClick={() => setSelected(row.rev)}
                        className={`px-2 py-0.5 font-semibold ${row.rev === selected ? 'bg-[var(--kit-text)] text-[var(--kit-halo)]' : 'underline underline-offset-2'}`}
                      >
                        {row.rev}
                      </button>
                    ),
                  },
                  {
                    id: 'date',
                    header: 'Applied',
                    nowrap: true,
                    cell: (row) => row.date,
                  },
                  {
                    id: 'by',
                    header: 'By',
                    nowrap: true,
                    cell: (row) => row.by,
                  },
                  {
                    id: 'changes',
                    header: 'Changes',
                    numeric: true,
                    cell: (row) => row.changes,
                  },
                ]}
                rows={EC_REVISIONS}
                rowKey={(row) => row.rev}
                rowTone={(row) => (row.date === 'Draft' ? 'warning' : undefined)}
              />
              <div className="border border-[var(--kit-text)] p-3">
                <p className="text-xs text-[var(--kit-text-2)]">Revision {revision.rev}</p>
                <p className="mt-1 text-lg leading-6 font-semibold">{revision.note}</p>
                <p className="mt-2 text-sm text-[var(--kit-text-2)]">
                  {revision.changes} limits changed by {revision.by}
                  {revision.alarms > 0 ? `. ${revision.alarms} alarms per week while it was live.` : '. Not applied yet.'}
                </p>
              </div>
            </div>
          </Panel>
        </Grid>
      </AppFrame>
    </LookScope>
  );
}

function EngineeringConfigLadder() {
  const [mode, setMode] = useState<EcMode>('compare');
  const config = ecConfig('tt-91141');
  return (
    <LookScope look="blueprint" className="w-full">
      <Canvas className="h-full">
        <Panel
          title={`${config.tag} · ${config.name}`}
          subtitle="Limit ladder"
          icon={<IconRuler2 className="size-4" />}
          actions={
            <SegmentedControl value={mode} onValueChange={(next) => setMode(next === 'live' ? 'live' : next === 'draft' ? 'draft' : 'compare')}>
              <SegmentedControlList size="small" aria-label="Revision shown">
                <SegmentedControlButton value="live">Live</SegmentedControlButton>
                <SegmentedControlButton value="draft">Draft</SegmentedControlButton>
                <SegmentedControlButton value="compare">Compare</SegmentedControlButton>
              </SegmentedControlList>
            </SegmentedControl>
          }
        >
          <EcLadder config={config} mode={mode} />
        </Panel>
      </Canvas>
    </LookScope>
  );
}

function EngineeringConfigTree() {
  const [selected, setSelected] = useState('vt-92540');
  return (
    <LookScope look="blueprint" className="w-full">
      <Canvas className="h-full">
        <Panel title="Tree" subtitle="6 tags" icon={<IconBinaryTree className="size-4" />} padding="tight">
          <EcTree selected={selected} onSelect={setSelected} />
        </Panel>
      </Canvas>
    </LookScope>
  );
}

function EngineeringConfigDiffTable() {
  const config = ecConfig('tt-92532');
  return (
    <LookScope look="blueprint" className="w-full">
      <Canvas className="h-full">
        <Panel title="Property diff" subtitle={config.tag} icon={<IconGitCompare className="size-4" />}>
          <EcDiffTable config={config} />
        </Panel>
      </Canvas>
    </LookScope>
  );
}

function EngineeringConfigPropertySheet() {
  return (
    <LookScope look="blueprint" className="w-full">
      <Canvas className="h-full">
        <Panel title="Property sheet" subtitle="Rev D" icon={<IconTable className="size-4" />}>
          <EcPropertySheet config={ecConfig('lt-10012')} mode="draft" />
        </Panel>
      </Canvas>
    </LookScope>
  );
}

function EngineeringConfigDimensions() {
  return (
    <LookScope look="blueprint" className="w-full">
      <Canvas className="h-full">
        <Panel title="Dimension lines" subtitle="Annotation" icon={<IconRuler2 className="size-4" />}>
          <div className="relative h-44">
            <EcDimension from={6} to={62} top={40} label="Normal band 52.0 °C" />
            <EcDimension from={62} to={90} top={40} label="+3.0 °C" accent />
            <EcDimension from={14} to={20} top={110} label="Margin 0.8 °C" accent side="after" />
            <span className="absolute top-6 bottom-6 left-[6%] w-px bg-[var(--kit-text)]" />
            <span className="absolute top-6 bottom-6 left-[62%] w-px bg-[var(--kit-text)]" />
            <span className="absolute top-6 bottom-20 left-[90%] w-px" style={{ background: EC_ACCENT }} />
          </div>
        </Panel>
      </Canvas>
    </LookScope>
  );
}

function EngineeringConfigToolbar() {
  const [mode, setMode] = useState<EcMode>('draft');
  const [sent, setSent] = useState(false);
  return (
    <LookScope look="blueprint" className="w-full">
      <Canvas className="flex h-full items-center justify-center">
        <EcToolbar mode={mode} onMode={setMode} sent={sent} onSend={() => setSent((before) => !before)} />
      </Canvas>
    </LookScope>
  );
}

export default definePage({
  id: 'engineering-config',
  title: 'Engineering configuration',
  summary:
    'Alarm limits as an engineering drawing: a configuration tree, the selected tag with live and draft limits drawn to scale and every change dimensioned between them, a property sheet with checks, and a floating toolbar that switches revision.',
  guidance: {
    use: [
      'For changes that are reviewed before they reach the control system: limits, setpoints, parameters.',
      'Draw the change to scale; a table says what changed, a dimension says how much it matters.',
      'One accent for everything that differs between live and draft, and nothing else.',
    ],
    avoid: [
      'Editing live values in place with no draft and no revision.',
      'Status colours for change: a change is not an alarm.',
      'Hiding the current reading; a new limit is judged by its margin to it.',
    ],
  },
  source,
  sections: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description: 'Select a tag in the tree. The toolbar switches the drawing between the live revision, the draft, and both with dimensions.',
      specimens: [
        {
          id: 'EngineeringConfigSignature',
          title: 'Tree, diff and property sheet',
          note: 'Pick it for a configuration tool where an engineer prepares a revision and has to see what each change does.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/AppFrame.tsx', 'kit/Panel.tsx', 'kit/DataTable.tsx', 'kit/Grid.tsx', 'kit/tones.ts', 'looks/LookScope.tsx'],
          Component: EngineeringConfigSignature,
        },
      ],
    },
    {
      id: 'variations',
      title: 'Other screens',
      description: 'The review of the whole change set, and the revision history with its effect on alarm load.',
      specimens: [
        {
          id: 'EngineeringConfigChangeSet',
          title: 'Change set review',
          note: 'Pick it for the approver: every changed tag with its reason and checks, and a verdict per tag.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/AppFrame.tsx', 'kit/Panel.tsx', 'kit/StatusPill.tsx', 'looks/LookScope.tsx'],
          Component: EngineeringConfigChangeSet,
        },
        {
          id: 'EngineeringConfigRevisions',
          title: 'Revision history',
          note: 'Pick it to show what earlier revisions did: a revision table beside the measure they were meant to move.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/AppFrame.tsx', 'kit/TrendLine.tsx', 'kit/DataTable.tsx', 'looks/LookScope.tsx'],
          Component: EngineeringConfigRevisions,
        },
      ],
    },
    {
      id: 'parts',
      title: 'Parts',
      description: 'The panels of the drawing on their own.',
      specimens: [
        {
          id: 'EngineeringConfigLadder',
          title: 'Limit ladder',
          note: 'Pick it to compare two sets of limits on one scale, with the current reading drawn through both.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Panel.tsx', 'kit/tones.ts'],
          Component: EngineeringConfigLadder,
        },
        {
          id: 'EngineeringConfigTree',
          title: 'Configuration tree',
          note: 'Pick it to find a tag by where it sits in the plant, with change counts on the rows.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Panel.tsx'],
          Component: EngineeringConfigTree,
        },
        {
          id: 'EngineeringConfigDiffTable',
          title: 'Property diff',
          note: 'Pick it for the exact before and after of every property, changed rows first to the eye.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Panel.tsx', 'kit/DataTable.tsx'],
          Component: EngineeringConfigDiffTable,
        },
        {
          id: 'EngineeringConfigPropertySheet',
          title: 'Property sheet',
          note: 'Pick it as the full record of one tag, with the checks a draft has to pass.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Panel.tsx'],
          Component: EngineeringConfigPropertySheet,
        },
        {
          id: 'EngineeringConfigDimensions',
          title: 'Dimension lines',
          note: 'Pick it to write a measure onto a chart the way a drawing does: between two arrowheads.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Panel.tsx', 'kit/tones.ts'],
          Component: EngineeringConfigDimensions,
        },
        {
          id: 'EngineeringConfigToolbar',
          title: 'Floating toolbar',
          note: 'Pick it when the controls belong to the canvas, not to a panel: revision switch and the one commit action.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Canvas.tsx'],
          Component: EngineeringConfigToolbar,
        },
      ],
    },
  ],
});
