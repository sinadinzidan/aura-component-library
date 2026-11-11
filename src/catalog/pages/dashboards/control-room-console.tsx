import { Button } from '@cognite/aura/components/button';
import { SegmentedControl, SegmentedControlButton, SegmentedControlList } from '@cognite/aura/components/segmented-control';
import {
  IconAlertOctagon,
  IconAlertTriangle,
  IconBell,
  IconBellOff,
  IconCheck,
  IconCircleCheck,
  IconDroplet,
  IconFlame,
  IconGauge,
  IconInfoCircle,
  IconMinus,
  IconPlus,
  IconRoute,
  IconX,
} from '@cognite/aura/icons';
import { useId, useState } from 'react';
import type { KeyboardEvent } from 'react';

import { AppFrame, type AppFrameNavItem } from '../../../library/kit/AppFrame';
import { Canvas } from '../../../library/kit/Canvas';
import { DataTable, type DataTableColumn } from '../../../library/kit/DataTable';
import { Legend } from '../../../library/kit/Legend';
import { Meter } from '../../../library/kit/Meter';
import { Panel } from '../../../library/kit/Panel';
import { StatusPill } from '../../../library/kit/StatusPill';
import { TagId } from '../../../library/kit/TagId';
import { formatNumber, toneLine, type Tone } from '../../../library/kit/tones';
import { TrendLine, type TrendLimit } from '../../../library/kit/TrendLine';
import { LookScope } from '../../../library/looks/LookScope';
import { ALARMS, ASSETS, type Alarm, type Asset } from '../../data/plant';
import { MINUTE, REFERENCE_NOW, formatAgo, formatTime, makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './control-room-console.tsx?raw';

type CrcKind = 'valve' | 'vessel' | 'compressor' | 'cooler' | 'turbine' | 'pump';

type CrcMode = 'auto' | 'manual' | 'cascade';

type CrcLoop = {
  tag: string;
  name: string;
  unit: string;
  pv: number;
  sp: number;
  out: number;
  max: number;
  high: number;
  step: number;
  decimals: number;
  seed: number;
};

type CrcPermissive = { label: string; ok: boolean };

type CrcPlacement = {
  kind: CrcKind;
  x: number;
  y: number;
  short: string;
  loop: CrcLoop;
  permissives: CrcPermissive[];
};

type CrcUnit = Asset & CrcPlacement;

const CRC_PLACEMENT: Record<string, CrcPlacement> = {
  '20-xv-1105': {
    kind: 'valve',
    x: 95,
    y: 200,
    short: 'XV-1105',
    loop: {
      tag: '20-ZIC-1105',
      name: 'Valve position',
      unit: '%',
      pv: 100,
      sp: 100,
      out: 100,
      max: 100,
      high: 100,
      step: 5,
      decimals: 0,
      seed: 61,
    },
    permissives: [
      { label: 'Instrument air pressure healthy', ok: true },
      { label: 'No emergency shutdown demand', ok: true },
      { label: 'Partial stroke test in date', ok: true },
    ],
  },
  '20-va-1001': {
    kind: 'vessel',
    x: 190,
    y: 200,
    short: 'VA-1001',
    loop: {
      tag: '20-LIC-10012',
      name: 'Separator level',
      unit: '%',
      pv: 54.3,
      sp: 55,
      out: 46,
      max: 100,
      high: 70,
      step: 1,
      decimals: 1,
      seed: 62,
    },
    permissives: [
      { label: 'Level transmitters agree within 2 %', ok: true },
      { label: 'Liquid outlet valve available', ok: true },
      { label: 'Pressure below relief setting', ok: true },
    ],
  },
  '23-ka-9103': {
    kind: 'compressor',
    x: 225,
    y: 62,
    short: 'KA-9103',
    loop: {
      tag: '23-PIC-92731',
      name: 'Discharge pressure',
      unit: 'barg',
      pv: 0,
      sp: 18,
      out: 0,
      max: 30,
      high: 21,
      step: 0.5,
      decimals: 1,
      seed: 63,
    },
    permissives: [
      { label: 'Vibration below trip limit', ok: false },
      { label: 'Bearing inspection signed off', ok: false },
      { label: 'Lube oil pressure healthy', ok: true },
      { label: 'Seal gas differential healthy', ok: true },
    ],
  },
  '23-ka-9101': {
    kind: 'compressor',
    x: 350,
    y: 200,
    short: 'KA-9101',
    loop: {
      tag: '23-PIC-92531',
      name: 'Discharge pressure',
      unit: 'barg',
      pv: 48.6,
      sp: 48.5,
      out: 71,
      max: 60,
      high: 52,
      step: 0.5,
      decimals: 1,
      seed: 64,
    },
    permissives: [
      { label: 'Anti-surge valve in automatic', ok: true },
      { label: 'Lube oil pressure healthy', ok: true },
      { label: 'Drive-end vibration below 7.1 mm/s', ok: true },
    ],
  },
  '23-ha-9114': {
    kind: 'cooler',
    x: 475,
    y: 200,
    short: 'HA-9114',
    loop: {
      tag: '23-TIC-91141',
      name: 'Outlet temperature',
      unit: '°C',
      pv: 38.9,
      sp: 36,
      out: 88,
      max: 60,
      high: 40,
      step: 0.5,
      decimals: 1,
      seed: 65,
    },
    permissives: [
      { label: 'Cooling water flow above 900 m³/h', ok: true },
      { label: 'Cooling water pump A available', ok: false },
      { label: 'Tube leak detector clear', ok: true },
    ],
  },
  '23-ka-9102': {
    kind: 'compressor',
    x: 600,
    y: 200,
    short: 'KA-9102',
    loop: {
      tag: '23-PIC-92631',
      name: 'Discharge pressure',
      unit: 'barg',
      pv: 96.2,
      sp: 96,
      out: 64,
      max: 120,
      high: 104,
      step: 0.5,
      decimals: 1,
      seed: 66,
    },
    permissives: [
      { label: 'Anti-surge valve in automatic', ok: true },
      { label: 'Lube oil pressure healthy', ok: true },
      { label: 'Export header pressure healthy', ok: true },
    ],
  },
  '23-gt-9001': {
    kind: 'turbine',
    x: 475,
    y: 335,
    short: 'GT-9001',
    loop: {
      tag: '23-SIC-92501',
      name: 'Shaft speed',
      unit: 'rpm',
      pv: 9840,
      sp: 9850,
      out: 82,
      max: 12000,
      high: 10500,
      step: 50,
      decimals: 0,
      seed: 67,
    },
    permissives: [
      { label: 'Fuel gas pressure healthy', ok: true },
      { label: 'Exhaust temperature spread below 40 °C', ok: true },
      { label: 'Flame detected on both scanners', ok: true },
    ],
  },
  '27-pa-2001a': {
    kind: 'pump',
    x: 300,
    y: 385,
    short: 'PA-2001A',
    loop: {
      tag: '27-FIC-20011',
      name: 'Export flow',
      unit: 'm³/h',
      pv: 412,
      sp: 410,
      out: 58,
      max: 600,
      high: 480,
      step: 10,
      decimals: 0,
      seed: 68,
    },
    permissives: [
      { label: 'Suction pressure above 2.5 barg', ok: true },
      { label: 'Motor winding temperature healthy', ok: true },
      { label: 'Minimum flow valve available', ok: true },
    ],
  },
  '27-pa-2001b': {
    kind: 'pump',
    x: 300,
    y: 432,
    short: 'PA-2001B',
    loop: {
      tag: '27-FIC-20012',
      name: 'Export flow',
      unit: 'm³/h',
      pv: 0,
      sp: 0,
      out: 0,
      max: 600,
      high: 480,
      step: 10,
      decimals: 0,
      seed: 69,
    },
    permissives: [
      { label: 'Suction pressure above 2.5 barg', ok: true },
      { label: 'Standby start test in date', ok: false },
      { label: 'Motor winding temperature healthy', ok: true },
    ],
  },
  '40-pa-4001': {
    kind: 'pump',
    x: 600,
    y: 62,
    short: 'PA-4001',
    loop: {
      tag: '40-FIC-40011',
      name: 'Cooling water flow',
      unit: 'm³/h',
      pv: 0,
      sp: 1240,
      out: 0,
      max: 2000,
      high: 1600,
      step: 20,
      decimals: 0,
      seed: 70,
    },
    permissives: [
      { label: 'Isolated for work order WO-104479', ok: false },
      { label: 'Bearing temperature signal healthy', ok: false },
      { label: 'Basin level above 40 %', ok: true },
    ],
  },
};

const CRC_UNITS: CrcUnit[] = ASSETS.flatMap((asset) => {
  const placement = CRC_PLACEMENT[asset.id];
  return placement ? [{ ...asset, ...placement }] : [];
});

const CRC_DEFAULT_UNIT = '23-ka-9101';

const CRC_STATE_TONE: Record<Asset['state'], Tone> = {
  running: 'success',
  standby: 'neutral',
  stopped: 'neutral',
  tripped: 'critical',
  maintenance: 'warning',
};

const CRC_STATE_LABEL: Record<Asset['state'], string> = {
  running: 'Running',
  standby: 'Standby',
  stopped: 'Stopped',
  tripped: 'Tripped',
  maintenance: 'Maintenance',
};

const CRC_SEVERITY_TONE: Record<Alarm['severity'], Tone> = {
  critical: 'critical',
  high: 'warning',
  medium: 'info',
  low: 'neutral',
};

const CRC_SEVERITY_LABEL: Record<Alarm['severity'], string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

const CRC_MODE_LABEL: Record<CrcMode, string> = {
  auto: 'Auto',
  manual: 'Manual',
  cascade: 'Cascade',
};

const CRC_UNACKED = ALARMS.filter((alarm) => alarm.state === 'active');

const CRC_HOURS = Array.from({ length: 25 }, (_, index) => formatTime(REFERENCE_NOW - (24 - index) * 5 * MINUTE));

const CRC_NAV: AppFrameNavItem[] = [
  { id: 'train', label: 'Gas train', icon: <IconRoute /> },
  { id: 'utilities', label: 'Utilities', icon: <IconDroplet /> },
  { id: 'flare', label: 'Flare', icon: <IconFlame /> },
  { id: 'alarms', label: 'Alarms', icon: <IconBell />, badge: '3' },
];

const CRC_INITIAL_SP: Record<string, number> = Object.fromEntries(CRC_UNITS.map((unit) => [unit.id, unit.loop.sp]));

const CRC_INITIAL_MODE: Record<string, CrcMode> = Object.fromEntries(CRC_UNITS.map((unit) => [unit.id, unit.id === '23-ka-9102' ? 'cascade' : 'auto']));

const CRC_SEQUENCE = [
  {
    time: '13:41:08',
    event: 'Drive-end vibration high',
    tag: '23-VT-92740',
    value: '7.4 mm/s',
    tone: 'warning',
  },
  {
    time: '13:44:52',
    event: 'Bearing temperature rising',
    tag: '23-TT-92745',
    value: '94.1 °C',
    tone: 'warning',
  },
  {
    time: '13:46:03',
    event: 'Vibration high-high, first out',
    tag: '23-VT-92740',
    value: '11.6 mm/s',
    tone: 'critical',
  },
  {
    time: '13:46:03',
    event: 'Recompressor trip',
    tag: '23-KA-9103',
    value: 'Tripped',
    tone: 'critical',
  },
  {
    time: '13:46:05',
    event: 'Anti-surge valve opened',
    tag: '23-FV-92720',
    value: '100 %',
    tone: 'neutral',
  },
  {
    time: '13:46:11',
    event: 'Flash gas routed to flare',
    tag: '43-PV-4302',
    value: '18 %',
    tone: 'info',
  },
  {
    time: '13:52:30',
    event: 'Trip acknowledged by I. Haugen',
    tag: 'Console 1',
    value: 'Ack',
    tone: 'neutral',
  },
] satisfies ReadonlyArray<{
  time: string;
  event: string;
  tag: string;
  value: string;
  tone: Tone;
}>;

const CRC_TRIP_VIBRATION = [3.9, 4.0, 3.9, 4.1, 4.2, 4.1, 4.3, 4.4, 4.6, 4.5, 4.8, 5.1, 5.3, 5.2, 5.6, 6.0, 6.4, 6.9, 7.4, 8.1, 9.2, 11.6, 6.1, 1.4, 0.2];

/** The reading a loop shows: an automatic loop on running equipment follows its setpoint. */
function crcReading(unit: CrcUnit, setpoint: number, mode: CrcMode): number {
  if (unit.state !== 'running' || mode === 'manual') return unit.loop.pv;
  return unit.loop.pv + (setpoint - unit.loop.sp);
}

function crcTrend(unit: CrcUnit, reading: number): number[] {
  const { loop } = unit;
  if (unit.state === 'tripped')
    return [
      ...makeValues({
        seed: loop.seed,
        points: 21,
        base: loop.sp,
        noise: loop.sp * 0.01,
      }),
      loop.sp * 0.7,
      loop.sp * 0.3,
      0.4,
      0,
    ];
  if (unit.state !== 'running') return Array.from({ length: 25 }, () => loop.pv);
  const swing = (loop.high - loop.sp) * 0.2 || loop.step;
  const history = makeValues({
    seed: loop.seed,
    points: 24,
    base: loop.pv,
    amplitude: swing,
    noise: swing * 0.4,
    cycles: 1.4,
    max: loop.max,
    decimals: loop.decimals,
  });
  return [...history, reading];
}

function crcFigure(value: number, loop: CrcLoop): string {
  return `${formatNumber(value, loop.decimals)} ${loop.unit}`;
}

function crcFill(state: Asset['state']): { fill: string; stroke: string } {
  if (state === 'running')
    return {
      fill: 'color-mix(in oklab, var(--kit-line-success) 30%, var(--kit-surface))',
      stroke: toneLine('success'),
    };
  if (state === 'tripped') return { fill: toneLine('critical'), stroke: toneLine('critical') };
  if (state === 'maintenance')
    return {
      fill: 'color-mix(in oklab, var(--kit-line-warning) 38%, var(--kit-surface))',
      stroke: toneLine('warning'),
    };
  return { fill: 'var(--kit-surface)', stroke: 'var(--kit-text-3)' };
}

function CrcSymbol({ unit, clipId, level }: { unit: CrcUnit; clipId: string; level: number }) {
  const { x, y } = unit;
  const paint = { ...crcFill(unit.state), strokeWidth: 2 };
  if (unit.kind === 'valve') {
    return (
      <g {...paint} strokeLinejoin="round">
        <path d={`M${x - 13},${y - 12} L${x},${y} L${x - 13},${y + 12} Z`} />
        <path d={`M${x + 13},${y - 12} L${x},${y} L${x + 13},${y + 12} Z`} />
        <path d={`M${x},${y} V${y - 18} M${x - 8},${y - 18} H${x + 8}`} fill="none" />
      </g>
    );
  }
  if (unit.kind === 'vessel') {
    return (
      <g>
        <clipPath id={clipId}>
          <rect x={x - 60} y={y - 28} width={120} height={56} rx={28} />
        </clipPath>
        <rect x={x - 60} y={y - 28} width={120} height={56} rx={28} fill="var(--kit-surface)" stroke="none" />
        <rect x={x - 60} y={y + 28 - (56 * level) / 100} width={120} height={56} fill={toneLine('amber')} opacity={0.55} clipPath={`url(#${clipId})`} />
        <rect x={x - 60} y={y - 28} width={120} height={56} rx={28} fill="none" stroke={paint.stroke} strokeWidth={2} />
      </g>
    );
  }
  if (unit.kind === 'compressor') {
    return <path {...paint} strokeLinejoin="round" d={`M${x - 24},${y - 26} L${x + 24},${y - 13} V${y + 13} L${x - 24},${y + 26} Z`} />;
  }
  if (unit.kind === 'cooler') {
    return (
      <g {...paint} strokeLinejoin="round">
        <circle cx={x} cy={y} r={22} />
        <path d={`M${x - 22},${y} H${x - 12} L${x - 6},${y - 10} L${x + 6},${y + 10} L${x + 12},${y} H${x + 22}`} fill="none" />
      </g>
    );
  }
  if (unit.kind === 'turbine') {
    return <path {...paint} strokeLinejoin="round" d={`M${x - 40},${y - 12} L${x + 40},${y - 25} V${y + 25} L${x - 40},${y + 12} Z`} />;
  }
  return (
    <g {...paint} strokeLinejoin="round">
      <circle cx={x} cy={y} r={16} />
      <path d={`M${x - 6},${y - 8} L${x + 8},${y} L${x - 6},${y + 8} Z`} fill={paint.stroke} stroke="none" />
    </g>
  );
}

function CrcValueBox({ x, y, text, tone = 'neutral', anchor = 'start' }: { x: number; y: number; text: string; tone?: Tone; anchor?: 'start' | 'end' }) {
  const width = text.length * 7.7 + 16;
  const left = anchor === 'end' ? x - width : x;
  const loud = tone === 'warning' || tone === 'critical';
  return (
    <g>
      <rect x={left} y={y} width={width} height={24} fill={loud ? toneLine(tone) : 'var(--kit-well)'} stroke={loud ? 'none' : 'var(--kit-rule)'} />
      <text x={left + width / 2} y={y + 17} textAnchor="middle" fontSize={14} fontWeight={600} fill={loud ? 'var(--kit-surface)' : 'var(--kit-text)'}>
        {text}
      </text>
    </g>
  );
}

const CRC_HALF: Record<CrcKind, { w: number; h: number }> = {
  valve: { w: 20, h: 24 },
  vessel: { w: 66, h: 34 },
  compressor: { w: 31, h: 33 },
  cooler: { w: 29, h: 29 },
  turbine: { w: 47, h: 32 },
  pump: { w: 22, h: 22 },
};

const CRC_LABEL_AT: Record<string, { dx: number; dy: number; anchor: 'start' | 'middle' | 'end' }> = {
  '20-xv-1105': { dx: 0, dy: -30, anchor: 'middle' },
  '20-va-1001': { dx: -20, dy: -36, anchor: 'start' },
  '23-ka-9103': { dx: 0, dy: -36, anchor: 'middle' },
  '23-ka-9101': { dx: 22, dy: -36, anchor: 'end' },
  '23-ha-9114': { dx: 0, dy: 44, anchor: 'middle' },
  '23-ka-9102': { dx: -22, dy: -36, anchor: 'start' },
  '23-gt-9001': { dx: 0, dy: 46, anchor: 'middle' },
  '27-pa-2001a': { dx: 0, dy: -24, anchor: 'middle' },
  '27-pa-2001b': { dx: 0, dy: 34, anchor: 'middle' },
  '40-pa-4001': { dx: 0, dy: -26, anchor: 'middle' },
};

type CrcMimicProps = {
  selected: string;
  onSelect: (id: string) => void;
  setpoints: Record<string, number>;
  modes: Record<string, CrcMode>;
};

/** The gas train as a process mimic: equipment symbols on pipes, with live values written beside them. */
function CrcMimic({ selected, onSelect, setpoints, modes }: CrcMimicProps) {
  const clipId = `crc${useId().replace(/[^a-z0-9]/gi, '')}`;
  const reading = (id: string): string => {
    const unit = CRC_UNITS.find((candidate) => candidate.id === id);
    if (!unit) return '';
    return crcFigure(crcReading(unit, setpoints[id] ?? unit.loop.sp, modes[id] ?? 'auto'), unit.loop);
  };
  const separator = CRC_UNITS.find((unit) => unit.id === '20-va-1001');
  const level = separator ? crcReading(separator, setpoints[separator.id] ?? separator.loop.sp, modes[separator.id] ?? 'auto') : 50;
  const gas = { stroke: toneLine('accent'), strokeWidth: 3, fill: 'none' };
  const idle = {
    stroke: 'var(--kit-text-3)',
    strokeWidth: 2,
    fill: 'none',
    strokeDasharray: '6 5',
  };
  const onKey = (event: KeyboardEvent<SVGGElement>, id: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect(id);
    }
  };

  return (
    <svg
      viewBox="0 0 760 470"
      className="h-full w-full"
      role="group"
      aria-label="Gas train mimic: inlet, separation, three compressors, cooler, turbine and export pumps"
    >
      <g {...gas} strokeLinejoin="round">
        <path d="M10,200 H82 M108,200 H130 M250,200 H326 M374,200 H453 M497,200 H576 M624,200 H738" />
        <path d="M738,200 l-10,-6 v12 Z" fill={toneLine('accent')} />
      </g>
      <path {...idle} d="M160,172 V62 H201 M249,62 H285 V200" />
      <path
        d="M190,228 V408 H250 M250,385 V432 M250,385 H284 M316,385 H350 V408 H402"
        stroke={toneLine('amber')}
        strokeWidth={3}
        fill="none"
        strokeLinejoin="round"
      />
      <path d="M402,408 l-10,-6 v12 Z" fill={toneLine('amber')} />
      <path {...idle} d="M250,432 H284 M316,432 H350 V408" />
      <path {...idle} stroke={toneLine('info')} d="M584,62 H475 V178" />
      <path d="M350,226 V285 M600,226 V285 M350,285 H600 M475,285 V312" stroke="var(--kit-text-3)" strokeWidth={5} fill="none" strokeLinecap="square" />

      <CrcValueBox x={10} y={130} text="4.61 MSm³/d" />
      <text x={10} y={122} fontSize={14} fill="var(--kit-text-2)">
        Inlet gas
      </text>
      <CrcValueBox x={98} y={238} text="13.1 barg" />
      <CrcValueBox x={382} y={150} text={reading('23-ka-9101')} />
      <CrcValueBox x={382} y={122} text="141.2 °C" />
      <CrcValueBox x={366} y={238} text="6.8 mm/s" tone="warning" />
      <CrcValueBox x={503} y={150} text={reading('23-ha-9114')} />
      <CrcValueBox x={636} y={210} text={reading('23-ka-9102')} />
      <CrcValueBox x={750} y={150} text="4.38 MSm³/d" anchor="end" />
      <text x={750} y={142} fontSize={14} textAnchor="end" fill="var(--kit-text-2)">
        Gas export
      </text>
      <CrcValueBox x={528} y={323} text={reading('23-gt-9001')} />
      <CrcValueBox x={412} y={396} text={reading('27-pa-2001a')} />
      <text x={412} y={440} fontSize={14} fill="var(--kit-text-2)">
        Condensate export
      </text>
      <text x={486} y={110} fontSize={14} fill="var(--kit-text-2)">
        Cooling water
      </text>
      <text x={150} y={110} fontSize={14} textAnchor="end" fill="var(--kit-text-2)">
        Flash gas
      </text>
      <text x={616} y={278} fontSize={14} fill="var(--kit-text-2)">
        Common shaft
      </text>

      {CRC_UNITS.map((unit) => {
        const half = CRC_HALF[unit.kind];
        const label = CRC_LABEL_AT[unit.id] ?? {
          dx: 0,
          dy: -36,
          anchor: 'middle',
        };
        const active = unit.id === selected;
        const abnormal = unit.state === 'tripped' || unit.state === 'maintenance';
        const word = CRC_STATE_LABEL[unit.state];
        const wordWidth = word.length * 7.7 + 16;
        const wordLeft = unit.id === '40-pa-4001' ? unit.x + 26 : unit.x - wordWidth / 2;
        const wordTop = unit.id === '40-pa-4001' ? unit.y - 12 : unit.y + 34;
        return (
          <g
            key={unit.id}
            role="button"
            tabIndex={0}
            aria-pressed={active}
            aria-label={`${unit.name} ${unit.tag}, ${word}`}
            className="cursor-pointer outline-none [&:focus-visible>rect:first-child]:stroke-[var(--kit-text)]"
            onClick={() => onSelect(unit.id)}
            onKeyDown={(event) => onKey(event, unit.id)}
          >
            <rect
              x={unit.x - half.w}
              y={unit.y - half.h}
              width={half.w * 2}
              height={half.h * 2}
              fill={active ? 'color-mix(in oklab, var(--kit-line-accent) 16%, transparent)' : 'transparent'}
              stroke={active ? 'var(--kit-text)' : 'transparent'}
              strokeWidth={2}
            />
            <CrcSymbol unit={unit} clipId={clipId} level={level} />
            {unit.kind === 'vessel' ? (
              <text x={unit.x} y={unit.y + 6} textAnchor="middle" fontSize={15} fontWeight={600} fill="var(--kit-text)">
                {reading(unit.id)}
              </text>
            ) : null}
            <text
              x={unit.x + label.dx}
              y={unit.y + label.dy}
              textAnchor={label.anchor}
              fontSize={14}
              fontWeight={active ? 700 : 500}
              fill={active ? 'var(--kit-text)' : 'var(--kit-text-2)'}
              textDecoration={active ? 'underline' : undefined}
            >
              {unit.short}
            </text>
            {abnormal ? (
              <g>
                <rect x={wordLeft} y={wordTop} width={wordWidth} height={24} fill={toneLine(CRC_STATE_TONE[unit.state])} />
                <text x={wordLeft + wordWidth / 2} y={wordTop + 17} textAnchor="middle" fontSize={14} fontWeight={700} fill="var(--kit-surface)">
                  {word}
                </text>
              </g>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

function CrcMimicLegend() {
  return (
    <Legend
      items={[
        { label: 'Process gas', tone: 'accent', mark: 'line' },
        { label: 'Condensate', tone: 'amber', mark: 'line' },
        { label: 'No flow', tone: 'neutral', mark: 'dashed' },
        { label: 'Running', tone: 'success' },
        { label: 'Maintenance', tone: 'warning' },
        { label: 'Tripped', tone: 'critical' },
      ]}
    />
  );
}

type CrcFaceplateProps = {
  unit: CrcUnit;
  setpoint: number;
  mode: CrcMode;
  onSetpoint: (value: number) => void;
  onMode: (mode: CrcMode) => void;
};

/** The operating window of one piece of equipment: reading, setpoint, output, mode and what blocks it. */
function CrcFaceplate({ unit, setpoint, mode, onSetpoint, onMode }: CrcFaceplateProps) {
  const { loop } = unit;
  const reading = crcReading(unit, setpoint, mode);
  const locked =
    unit.state !== 'running' ? `${CRC_STATE_LABEL[unit.state]}: setpoint is held` : mode === 'cascade' ? 'Cascade: the master loop writes the setpoint' : null;
  const step = (direction: 1 | -1) => onSetpoint(Math.min(loop.max, Math.max(0, Number((setpoint + direction * loop.step).toFixed(2)))));
  const near = reading > loop.high ? 'critical' : reading > loop.high - (loop.high - loop.sp) * 0.35 && loop.high < loop.max ? 'warning' : 'accent';

  return (
    <div className="flex flex-1 flex-col gap-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-lg leading-6 font-semibold text-base-foreground">{unit.name}</p>
          <p className="mt-0.5 flex flex-wrap gap-x-2 text-sm text-medium-foreground">
            <TagId>{unit.tag}</TagId>
            <span>{loop.tag}</span>
          </p>
        </div>
        <StatusPill tone={CRC_STATE_TONE[unit.state]} size="lg">
          {CRC_STATE_LABEL[unit.state]}
        </StatusPill>
      </div>

      <SegmentedControl value={mode} onValueChange={(next) => onMode(next === 'manual' ? 'manual' : next === 'cascade' ? 'cascade' : 'auto')}>
        <SegmentedControlList size="small" aria-label="Controller mode" className="w-full">
          <SegmentedControlButton value="auto">Auto</SegmentedControlButton>
          <SegmentedControlButton value="manual">Manual</SegmentedControlButton>
          <SegmentedControlButton value="cascade">Cascade</SegmentedControlButton>
        </SegmentedControlList>
      </SegmentedControl>

      <div className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,0.8fr)] items-end gap-3 border-y border-default py-3">
        <div>
          <p className="text-xs text-medium-foreground">{loop.name}</p>
          <p className="text-5xl leading-none font-medium tracking-tight text-base-foreground tabular-nums">{formatNumber(reading, loop.decimals)}</p>
        </div>
        <div>
          <p className="text-xs text-medium-foreground">Setpoint</p>
          <p className="text-2xl leading-7 font-medium tabular-nums" style={{ color: toneLine('accent') }}>
            {formatNumber(setpoint, loop.decimals)}
          </p>
        </div>
        <div>
          <p className="text-xs text-medium-foreground">Output</p>
          <p className="text-2xl leading-7 font-medium text-base-foreground tabular-nums">{loop.out} %</p>
        </div>
      </div>

      <Meter
        label={`Reading, ${loop.unit}`}
        value={reading}
        max={loop.max}
        unit={loop.unit}
        decimals={loop.decimals}
        high={loop.high < loop.max ? loop.high : undefined}
        target={{ value: setpoint, label: 'Setpoint' }}
        tone={near}
      />
      <Meter label="Output to final element" value={unit.state === 'running' ? loop.out : 0} max={100} unit="%" tone="neutral" hideScale />

      <div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" aria-label={`Lower setpoint by ${loop.step} ${loop.unit}`} disabled={locked !== null} onClick={() => step(-1)}>
            <IconMinus />
          </Button>
          <p className="flex-1 bg-muted-background py-1.5 text-center text-sm font-medium text-base-foreground tabular-nums">
            Setpoint {crcFigure(setpoint, loop)}
          </p>
          <Button variant="outline" size="sm" aria-label={`Raise setpoint by ${loop.step} ${loop.unit}`} disabled={locked !== null} onClick={() => step(1)}>
            <IconPlus />
          </Button>
        </div>
        <p className="mt-1.5 text-xs text-medium-foreground">
          {locked ?? `Steps of ${formatNumber(loop.step, loop.step < 1 ? 1 : 0)} ${loop.unit}. High alarm at ${crcFigure(loop.high, loop)}.`}
        </p>
      </div>

      <ul className="mt-auto flex flex-col gap-1.5 border-t border-default pt-3">
        {unit.permissives.map((permissive) => (
          <li key={permissive.label} className="flex items-center gap-2 text-sm text-base-foreground">
            <span
              className="flex size-5 shrink-0 items-center justify-center text-base-background [&>svg]:size-3.5"
              style={{
                background: toneLine(permissive.ok ? 'success' : 'critical'),
              }}
            >
              {permissive.ok ? <IconCheck aria-hidden="true" /> : <IconX aria-hidden="true" />}
            </span>
            <span className="min-w-0 flex-1">{permissive.label}</span>
            <span className="text-xs text-medium-foreground">{permissive.ok ? 'Healthy' : 'Blocking'}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CrcLoopTrend({ unit, setpoint, mode, height = 190 }: { unit: CrcUnit; setpoint: number; mode: CrcMode; height?: number }) {
  const { loop } = unit;
  const reading = crcReading(unit, setpoint, mode);
  const limits: TrendLimit[] = [{ value: setpoint, label: 'Setpoint', tone: 'info' }];
  if (loop.high < loop.max) limits.push({ value: loop.high, label: 'High alarm', tone: 'warning' });
  const values = crcTrend(unit, reading);
  const marks = [...values, ...limits.map((limit) => limit.value)];
  const pad = Math.max((Math.max(...marks) - Math.min(...marks)) * 0.18, loop.step);
  const floor = Math.max(0, Math.floor(Math.min(...marks) - pad));
  const ceiling = Math.ceil(Math.max(...marks) + pad);
  return (
    <TrendLine
      label={`${loop.name} of ${unit.name} over the last two hours against its setpoint and high alarm`}
      labels={CRC_HOURS}
      unit={loop.unit}
      decimals={loop.decimals}
      height={height}
      showLegend={false}
      yDomain={[floor, ceiling]}
      series={[{ id: 'pv', label: loop.name, values, tone: 'accent' }]}
      limits={limits}
    />
  );
}

type CrcLoopRow = {
  unit: CrcUnit;
  reading: number;
  setpoint: number;
  mode: CrcMode;
};

function CrcLoopTable({ selected, onSelect, setpoints, modes }: CrcMimicProps) {
  const rows: CrcLoopRow[] = CRC_UNITS.filter((unit) => unit.kind !== 'valve').map((unit) => {
    const setpoint = setpoints[unit.id] ?? unit.loop.sp;
    const mode = modes[unit.id] ?? 'auto';
    return { unit, setpoint, mode, reading: crcReading(unit, setpoint, mode) };
  });
  const columns: DataTableColumn<CrcLoopRow>[] = [
    {
      id: 'loop',
      header: 'Loop',
      nowrap: true,
      cell: (row) => (
        <button
          type="button"
          className="font-medium text-link-foreground underline-offset-2 hover:underline"
          aria-pressed={row.unit.id === selected}
          onClick={() => onSelect(row.unit.id)}
        >
          {row.unit.loop.tag}
        </button>
      ),
    },
    {
      id: 'pv',
      header: 'Reading / setpoint',
      numeric: true,
      nowrap: true,
      cell: (row) => (
        <>
          <span className="font-medium">{formatNumber(row.reading, row.unit.loop.decimals)}</span> / {formatNumber(row.setpoint, row.unit.loop.decimals)}{' '}
          {row.unit.loop.unit}
        </>
      ),
    },
    {
      id: 'mode',
      header: 'Mode',
      nowrap: true,
      cell: (row) => (row.unit.state === 'running' ? CRC_MODE_LABEL[row.mode] : row.unit.state === 'maintenance' ? 'Isolated' : CRC_STATE_LABEL[row.unit.state]),
    },
  ];
  return (
    <DataTable
      label="Control loops of the gas train"
      flush
      density="compact"
      columns={columns}
      rows={rows}
      rowKey={(row) => row.unit.id}
      rowTone={(row) =>
        row.unit.id === selected ? 'accent' : row.unit.state === 'running' || row.unit.state === 'standby' ? undefined : CRC_STATE_TONE[row.unit.state]
      }
    />
  );
}

function CrcSeverityIcon({ severity }: { severity: Alarm['severity'] }) {
  if (severity === 'critical') return <IconAlertOctagon aria-hidden="true" />;
  if (severity === 'high') return <IconAlertTriangle aria-hidden="true" />;
  if (severity === 'medium') return <IconInfoCircle aria-hidden="true" />;
  return <IconBell aria-hidden="true" />;
}

/** The newest unacknowledged alarm across the bottom of the console, with the one action it needs. */
function CrcAlarmBanner({
  acknowledged,
  onAcknowledge,
  onShow,
}: {
  acknowledged: readonly string[];
  onAcknowledge: (id: string) => void;
  onShow: (assetId: string) => void;
}) {
  const waiting = CRC_UNACKED.filter((alarm) => !acknowledged.includes(alarm.id));
  const alarm = waiting[0];
  if (!alarm) {
    return (
      <div className="flex items-center gap-3 bg-base-background px-4 py-3.5">
        <IconCircleCheck className="size-6 shrink-0 text-success-foreground-strong" aria-hidden="true" />
        <p className="text-lg font-semibold text-base-foreground">No unacknowledged alarms</p>
        <p className="text-sm text-medium-foreground">{CRC_UNACKED.length} acknowledged this hour. The horn is silent.</p>
      </div>
    );
  }
  const tone = CRC_SEVERITY_TONE[alarm.severity];
  return (
    <div className="flex items-stretch bg-base-background" role="status">
      <div className={`kit-tone-${tone} flex flex-1 items-center gap-3 px-4 py-2.5`} style={{ background: 'var(--t-solid)', color: 'var(--t-on-solid)' }}>
        <span className="[&>svg]:size-7">
          <CrcSeverityIcon severity={alarm.severity} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-lg leading-6 font-semibold">
            {CRC_SEVERITY_LABEL[alarm.severity]} · {alarm.message}
          </p>
          <p className="text-sm font-medium">
            {alarm.sensorTag} · {alarm.value} against {alarm.limit} · raised {formatAgo(alarm.raisedAt)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 px-4">
        <Button size="sm" onClick={() => onAcknowledge(alarm.id)}>
          <IconCheck /> Acknowledge
        </Button>
        <Button variant="outline" size="sm" onClick={() => onShow(alarm.assetId)}>
          Show equipment
        </Button>
        <span className="ml-2 flex items-center gap-1.5 text-sm text-medium-foreground">
          <IconBellOff className="size-4" aria-hidden="true" />
          {waiting.length} waiting
        </span>
      </div>
    </div>
  );
}

function CrcTools() {
  return (
    <>
      <span>Day shift · I. Haugen</span>
      <span className="font-medium tabular-nums">14:00:00 UTC</span>
    </>
  );
}

function useCrcConsole(initial: string) {
  const [selected, setSelected] = useState(initial);
  const [setpoints, setSetpoints] = useState(CRC_INITIAL_SP);
  const [modes, setModes] = useState(CRC_INITIAL_MODE);
  const [acknowledged, setAcknowledged] = useState<string[]>([]);
  const unit = CRC_UNITS.find((candidate) => candidate.id === selected) ?? CRC_UNITS[0];
  return {
    unit,
    selected: unit.id,
    setpoints,
    modes,
    acknowledged,
    setpoint: setpoints[unit.id] ?? unit.loop.sp,
    mode: modes[unit.id] ?? 'auto',
    select: (id: string) => setSelected(CRC_UNITS.some((candidate) => candidate.id === id) ? id : unit.id),
    setSetpoint: (value: number) => setSetpoints((current) => ({ ...current, [unit.id]: value })),
    setMode: (mode: CrcMode) => setModes((current) => ({ ...current, [unit.id]: mode })),
    acknowledge: (id: string) => setAcknowledged((current) => [...current, id]),
  };
}

function ControlRoomConsoleSignature() {
  const view = useCrcConsole(CRC_DEFAULT_UNIT);
  return (
    <LookScope look="console">
      <AppFrame brand={{ name: 'Nordkapp', detail: 'Console 1', mark: <IconFlame /> }} nav={CRC_NAV} current="train" padding="none" tools={<CrcTools />}>
        <div className="grid grid-cols-12 grid-rows-[35rem_19rem_auto] gap-px">
          <Panel
            className="col-span-8"
            title="Gas train"
            subtitle="Inlet to export · select equipment to open its faceplate"
            padding="none"
            footer={<CrcMimicLegend />}
          >
            <div className="min-h-0 flex-1 p-2">
              <CrcMimic selected={view.selected} onSelect={view.select} setpoints={view.setpoints} modes={view.modes} />
            </div>
          </Panel>
          <Panel
            className="col-span-4"
            title="Faceplate"
            subtitle={view.unit.short}
            tone={view.unit.state === 'tripped' ? 'critical' : view.unit.state === 'maintenance' ? 'warning' : 'neutral'}
          >
            <CrcFaceplate unit={view.unit} setpoint={view.setpoint} mode={view.mode} onSetpoint={view.setSetpoint} onMode={view.setMode} />
          </Panel>
          <Panel
            className="col-span-8"
            title={`${view.unit.loop.name} · ${view.unit.name}`}
            subtitle={`${view.unit.loop.tag} · ${view.unit.loop.unit} · last 2 h`}
          >
            <CrcLoopTrend unit={view.unit} setpoint={view.setpoint} mode={view.mode} height={220} />
          </Panel>
          <Panel className="col-span-4" title="Control loops" subtitle="9 loops" padding="none">
            <CrcLoopTable selected={view.selected} onSelect={view.select} setpoints={view.setpoints} modes={view.modes} />
          </Panel>
          <div className="col-span-12">
            <CrcAlarmBanner acknowledged={view.acknowledged} onAcknowledge={view.acknowledge} onShow={view.select} />
          </div>
        </div>
      </AppFrame>
    </LookScope>
  );
}

function ControlRoomConsoleTripReview() {
  const view = useCrcConsole('23-ka-9103');
  const [signedOff, setSignedOff] = useState(false);
  const blocking = view.unit.permissives.filter((permissive) => !permissive.ok).length - (signedOff ? 1 : 0);
  return (
    <LookScope look="console">
      <AppFrame brand={{ name: 'Nordkapp', detail: 'Console 1', mark: <IconFlame /> }} nav={CRC_NAV} current="alarms" padding="none" tools={<CrcTools />}>
        <div className="grid grid-cols-12 gap-px">
          <div className="col-span-12 flex items-stretch bg-base-background">
            <div
              className="kit-tone-critical flex items-center gap-3 px-4 py-3"
              style={{
                background: 'var(--t-solid)',
                color: 'var(--t-on-solid)',
              }}
            >
              <IconAlertOctagon className="size-7" aria-hidden="true" />
              <span className="text-xl font-semibold">Trip review</span>
            </div>
            <p className="flex flex-1 items-center px-4 text-sm text-medium-foreground">
              Recompressor 23-KA-9103 tripped at 13:46:03 on drive-end vibration high-high. Flash gas is routed to flare until restart.
            </p>
            <div className="flex items-center gap-2 px-4">
              <StatusPill tone={blocking > 0 ? 'critical' : 'success'}>{blocking > 0 ? `${blocking} blocking restart` : 'Ready to reset'}</StatusPill>
            </div>
          </div>

          <Panel className="col-span-7" title="Drive-end vibration before the trip" subtitle="23-VT-92740 · mm/s · 13:30 to 13:50">
            <TrendLine
              label="Drive-end vibration of the recompressor in the twenty minutes around the trip"
              labels={CRC_TRIP_VIBRATION.map((_, index) => formatTime(REFERENCE_NOW - 30 * MINUTE + index * 50_000))}
              unit="mm/s"
              decimals={1}
              height={250}
              showLegend={false}
              highlightLast={false}
              series={[
                {
                  id: 'vibration',
                  label: 'Drive-end vibration',
                  values: CRC_TRIP_VIBRATION,
                  tone: 'critical',
                },
              ]}
              limits={[
                { value: 11, label: 'Trip', tone: 'critical' },
                { value: 7.1, label: 'High alarm', tone: 'warning' },
              ]}
              bands={[{ from: 0, to: 7.1, tone: 'success' }]}
            />
          </Panel>
          <Panel className="col-span-5 row-span-2" title="Restart permissives" subtitle="23-KA-9103" tone="critical">
            <div className="flex flex-1 flex-col gap-4">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-xs text-medium-foreground">Time since trip</p>
                  <p className="text-5xl leading-none font-medium tracking-tight text-base-foreground tabular-nums">00:14</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-medium-foreground">Flared so far</p>
                  <p className="text-2xl font-medium text-base-foreground tabular-nums">1.9 kSm³</p>
                </div>
              </div>
              <ul className="flex flex-col border-t border-default">
                {view.unit.permissives.map((permissive) => {
                  const ok = permissive.ok || (signedOff && permissive.label.startsWith('Bearing'));
                  return (
                    <li key={permissive.label} className="flex items-center gap-3 border-b border-default py-3">
                      <span
                        className="flex size-7 shrink-0 items-center justify-center text-base-background [&>svg]:size-4"
                        style={{
                          background: toneLine(ok ? 'success' : 'critical'),
                        }}
                      >
                        {ok ? <IconCheck aria-hidden="true" /> : <IconX aria-hidden="true" />}
                      </span>
                      <span className="flex-1 text-base text-base-foreground">{permissive.label}</span>
                      <span className="text-sm text-medium-foreground">{ok ? 'Healthy' : 'Blocking'}</span>
                    </li>
                  );
                })}
              </ul>
              <p className="text-sm text-medium-foreground">
                Work order WO-104482 covers the bearing inspection. Tomás Barros is on the skid, due 20:00. Vibration must read below 11.0 mm/s on a barring
                turn before reset.
              </p>
              <div className="mt-auto flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => setSignedOff((current) => !current)}>
                  {signedOff ? 'Withdraw sign-off' : 'Sign off inspection'}
                </Button>
                <Button size="sm" disabled={blocking > 0}>
                  Reset trip
                </Button>
                <p className="basis-full text-xs text-medium-foreground">
                  {blocking > 0 ? 'Reset is locked while a permissive is blocking.' : 'All permissives healthy. Reset arms the start sequence.'}
                </p>
              </div>
            </div>
          </Panel>
          <Panel className="col-span-7" title="Sequence of events" subtitle="First out and what followed" padding="none">
            <DataTable
              label="Sequence of events around the recompressor trip"
              flush
              density="compact"
              columns={[
                {
                  id: 'time',
                  header: 'Time',
                  nowrap: true,
                  cell: (row) => row.time,
                },
                {
                  id: 'event',
                  header: 'Event',
                  cell: (row) => <span className="font-medium">{row.event}</span>,
                },
                {
                  id: 'tag',
                  header: 'Tag',
                  nowrap: true,
                  cell: (row) => <TagId>{row.tag}</TagId>,
                },
                {
                  id: 'value',
                  header: 'Value',
                  numeric: true,
                  nowrap: true,
                  cell: (row) => row.value,
                },
              ]}
              rows={CRC_SEQUENCE}
              rowKey={(row) => `${row.time}-${row.event}`}
              rowTone={(row) => (row.tone === 'neutral' ? undefined : row.tone)}
            />
          </Panel>
        </div>
      </AppFrame>
    </LookScope>
  );
}

function ControlRoomConsoleFieldPanel() {
  const view = useCrcConsole('23-ha-9114');
  return (
    <LookScope look="console" className="mx-auto w-full max-w-3xl">
      <AppFrame
        brand={{
          name: 'Nordkapp',
          detail: 'Field panel 23',
          mark: <IconFlame />,
        }}
        padding="none"
        tools={<span className="font-medium tabular-nums">14:00 UTC</span>}
      >
        <div className="grid grid-cols-1 gap-px">
          <ul className="grid grid-cols-6 gap-px" aria-label="Equipment">
            {CRC_UNITS.filter((unit) => unit.kind !== 'valve' && unit.kind !== 'vessel' && unit.id !== '27-pa-2001b' && unit.id !== '27-pa-2001a').map(
              (unit) => {
                const active = unit.id === view.selected;
                const tone = CRC_STATE_TONE[unit.state];
                return (
                  <li key={unit.id}>
                    <button
                      type="button"
                      aria-pressed={active}
                      onClick={() => view.select(unit.id)}
                      className={`kit-tone-${tone} flex h-full w-full flex-col gap-1 p-3 text-left ${active ? 'bg-medium-background' : 'bg-base-background'}`}
                      style={{
                        boxShadow: `inset 0 4px 0 ${active ? 'var(--kit-text)' : 'var(--t-line)'}`,
                      }}
                    >
                      <span className="text-sm font-semibold text-base-foreground">{unit.short}</span>
                      <span className="text-2xl leading-7 font-medium text-base-foreground tabular-nums">
                        {formatNumber(crcReading(unit, view.setpoints[unit.id] ?? unit.loop.sp, view.modes[unit.id] ?? 'auto'), unit.loop.decimals)}
                      </span>
                      <span className="text-xs text-medium-foreground">{unit.loop.unit}</span>
                      <span className="mt-1 text-xs font-semibold" style={{ color: 'var(--t-line)' }}>
                        {CRC_STATE_LABEL[unit.state]}
                      </span>
                    </button>
                  </li>
                );
              }
            )}
          </ul>
          <Panel title="Faceplate" subtitle={view.unit.short}>
            <CrcFaceplate unit={view.unit} setpoint={view.setpoint} mode={view.mode} onSetpoint={view.setSetpoint} onMode={view.setMode} />
          </Panel>
          <Panel title={view.unit.loop.name} subtitle={`${view.unit.loop.tag} · last 2 h`}>
            <CrcLoopTrend unit={view.unit} setpoint={view.setpoint} mode={view.mode} height={180} />
          </Panel>
          <CrcAlarmBanner acknowledged={view.acknowledged} onAcknowledge={view.acknowledge} onShow={view.select} />
        </div>
      </AppFrame>
    </LookScope>
  );
}

function ControlRoomConsoleMimic() {
  const view = useCrcConsole('23-ka-9102');
  return (
    <LookScope look="console">
      <Canvas padding="none">
        <Panel title="Gas train" subtitle="Process mimic" padding="none" footer={<CrcMimicLegend />}>
          <div className="h-[30rem] p-2">
            <CrcMimic selected={view.selected} onSelect={view.select} setpoints={view.setpoints} modes={view.modes} />
          </div>
        </Panel>
      </Canvas>
    </LookScope>
  );
}

function ControlRoomConsoleFaceplate() {
  const view = useCrcConsole('23-gt-9001');
  return (
    <LookScope look="console" className="w-full">
      <Canvas padding="none">
        <Panel title="Faceplate" subtitle={view.unit.short}>
          <CrcFaceplate unit={view.unit} setpoint={view.setpoint} mode={view.mode} onSetpoint={view.setSetpoint} onMode={view.setMode} />
        </Panel>
      </Canvas>
    </LookScope>
  );
}

function ControlRoomConsoleFaceplateLocked() {
  const view = useCrcConsole('40-pa-4001');
  return (
    <LookScope look="console" className="w-full">
      <Canvas padding="none">
        <Panel title="Faceplate" subtitle={view.unit.short} tone="warning">
          <CrcFaceplate unit={view.unit} setpoint={view.setpoint} mode={view.mode} onSetpoint={view.setSetpoint} onMode={view.setMode} />
        </Panel>
      </Canvas>
    </LookScope>
  );
}

function ControlRoomConsoleTrend() {
  const view = useCrcConsole('20-va-1001');
  return (
    <LookScope look="console" className="w-full">
      <Canvas padding="none">
        <Panel title={`${view.unit.loop.name} · ${view.unit.name}`} subtitle={`${view.unit.loop.tag} · last 2 h`} icon={<IconGauge className="size-4" />}>
          <CrcLoopTrend unit={view.unit} setpoint={view.setpoint} mode={view.mode} height={420} />
        </Panel>
      </Canvas>
    </LookScope>
  );
}

function ControlRoomConsoleLoops() {
  const view = useCrcConsole('23-ha-9114');
  return (
    <LookScope look="console" className="w-full">
      <Canvas padding="none">
        <Panel title="Control loops" subtitle="Select a loop" padding="none">
          <CrcLoopTable selected={view.selected} onSelect={view.select} setpoints={view.setpoints} modes={view.modes} />
        </Panel>
      </Canvas>
    </LookScope>
  );
}

function ControlRoomConsoleAlarmBanner() {
  const [acknowledged, setAcknowledged] = useState<string[]>([]);
  return (
    <LookScope look="console" className="w-full">
      <Canvas padding="none" className="flex flex-col gap-px">
        <CrcAlarmBanner acknowledged={acknowledged} onAcknowledge={(id) => setAcknowledged((current) => [...current, id])} onShow={() => undefined} />
        <CrcAlarmBanner acknowledged={CRC_UNACKED.slice(0, 1).map((alarm) => alarm.id)} onAcknowledge={() => undefined} onShow={() => undefined} />
        <CrcAlarmBanner acknowledged={CRC_UNACKED.map((alarm) => alarm.id)} onAcknowledge={() => undefined} onShow={() => undefined} />
      </Canvas>
    </LookScope>
  );
}

export default definePage({
  id: 'control-room-console',
  title: 'Control room console',
  summary:
    'An operator console for one process train: the gas train drawn as a mimic with live values on the pipes, the faceplate of the equipment you select, its loop trend, every control loop, and the newest unacknowledged alarm across the bottom.',
  guidance: {
    use: [
      'For operators who run a process from a screen all shift and act on single pieces of equipment.',
      'Keep the mimic the largest quadrant; everything else answers to what is selected on it.',
      'Colour only what is abnormal: running equipment stays quiet, tripped and isolated equipment carry a word.',
    ],
    avoid: [
      'KPI tiles and management figures: an operator needs readings, setpoints and alarms.',
      'Letting a setpoint change without saying why it is locked when it is.',
      'More than one alarm in the banner; the list lives in the alarm summary.',
    ],
  },
  source,
  sections: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description:
        'Click equipment on the mimic or a loop in the table, then step the setpoint or change mode. Acknowledge the alarm in the banner to see the next one.',
      specimens: [
        {
          id: 'ControlRoomConsoleSignature',
          title: 'Four-quadrant console',
          note: 'Pick it as the main screen of a control room position that runs one train.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/AppFrame.tsx', 'kit/Panel.tsx', 'kit/Meter.tsx', 'kit/TrendLine.tsx', 'kit/DataTable.tsx', 'looks/LookScope.tsx'],
          Component: ControlRoomConsoleSignature,
        },
      ],
    },
    {
      id: 'variations',
      title: 'Other screens',
      description: 'The same console after a trip, and on the panel-mounted tablet next to the skid.',
      specimens: [
        {
          id: 'ControlRoomConsoleTripReview',
          title: 'Trip review',
          note: 'Pick it for the screen an operator lands on after a trip: first out, sequence of events and what blocks the restart.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/AppFrame.tsx', 'kit/TrendLine.tsx', 'kit/DataTable.tsx', 'kit/StatusPill.tsx', 'looks/LookScope.tsx'],
          Component: ControlRoomConsoleTripReview,
        },
        {
          id: 'ControlRoomConsoleFieldPanel',
          title: 'Field panel',
          note: 'Pick it for a narrow panel at the skid, where a strip of equipment replaces the mimic.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/AppFrame.tsx', 'kit/Panel.tsx', 'kit/Meter.tsx', 'kit/TrendLine.tsx', 'looks/LookScope.tsx'],
          Component: ControlRoomConsoleFieldPanel,
        },
      ],
    },
    {
      id: 'parts',
      title: 'Parts',
      description: 'The quadrants and the banner on their own.',
      specimens: [
        {
          id: 'ControlRoomConsoleMimic',
          title: 'Process mimic',
          note: 'Pick it when operators think in flow order and need values where they are measured.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Panel.tsx', 'kit/Legend.tsx', 'kit/tones.ts'],
          Component: ControlRoomConsoleMimic,
        },
        {
          id: 'ControlRoomConsoleFaceplate',
          title: 'Faceplate',
          note: 'Pick it for the operating window of one loop: reading, setpoint, output, mode and permissives.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Panel.tsx', 'kit/Meter.tsx', 'kit/StatusPill.tsx', 'kit/TagId.tsx'],
          Component: ControlRoomConsoleFaceplate,
        },
        {
          id: 'ControlRoomConsoleTrend',
          title: 'Loop trend',
          note: 'Pick it under a mimic to show how the selected loop tracked its setpoint.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Panel.tsx', 'kit/TrendLine.tsx'],
          Component: ControlRoomConsoleTrend,
        },
        {
          id: 'ControlRoomConsoleFaceplateLocked',
          title: 'Locked faceplate',
          note: 'Pick it for isolated or tripped equipment: controls stay visible and say why they are held.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Panel.tsx', 'kit/Meter.tsx', 'kit/StatusPill.tsx'],
          Component: ControlRoomConsoleFaceplateLocked,
        },
        {
          id: 'ControlRoomConsoleAlarmBanner',
          title: 'Alarm banner',
          note: 'Pick it along the bottom of a console: one alarm, one action, and a calm state when nothing waits.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Canvas.tsx', 'kit/tones.ts'],
          Component: ControlRoomConsoleAlarmBanner,
        },
        {
          id: 'ControlRoomConsoleLoops',
          title: 'Loop table',
          note: 'Pick it as the keyboard route to the same selection as the mimic.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Panel.tsx', 'kit/DataTable.tsx'],
          Component: ControlRoomConsoleLoops,
        },
      ],
    },
  ],
});
