import { IconAlertOctagon, IconAlertTriangle, IconCheck, IconInfoCircle } from '@cognite/aura/icons';
import { useId, useState } from 'react';
import type { ReactNode } from 'react';

import { Canvas } from '../../../library/kit/Canvas';
import { deviationPercent, tapePosition, tapeTicks } from '../../../library/kit/glass-cockpit/tape';
import { Meter } from '../../../library/kit/Meter';
import { arcLine, polarPoint, valueAngle } from '../../../library/kit/radial-mission-control/polar';
import { SparkLine } from '../../../library/kit/SparkLine';
import { StatusPill } from '../../../library/kit/StatusPill';
import { TagId } from '../../../library/kit/TagId';
import type { Tone } from '../../../library/kit/tones';
import { formatNumber } from '../../../library/kit/tones';
import { TrendLine } from '../../../library/kit/TrendLine';
import { LookScope } from '../../../library/looks/LookScope';
import { ALARMS, PLANT_KPIS, type Alarm } from '../../data/plant';
import { formatAgo, formatTime, makeSeries, makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './glass-cockpit.tsx?raw';

type GcPage = 'machines' | 'trend' | 'alerts' | 'checklist';

type GcMachine = {
  tag: string;
  name: string;
  state: string;
  tone: Tone;
  /** Shaft speed in rpm. */
  speed: number;
  temperature: number;
  vibration: number;
};

type GcBand = { from: number; to: number; tone: Tone };

const GC_PAGES: readonly { id: GcPage; label: string }[] = [
  { id: 'machines', label: 'Machines' },
  { id: 'trend', label: 'Trend' },
  { id: 'alerts', label: 'Alerts' },
  { id: 'checklist', label: 'Checklist' },
];

const GC_MACHINES: readonly GcMachine[] = [
  { tag: '23-KA-9101', name: '1st stage', state: 'Running', tone: 'warning', speed: 9840, temperature: 141.2, vibration: 6.8 },
  { tag: '23-KA-9102', name: '2nd stage', state: 'Running', tone: 'success', speed: 9620, temperature: 128.4, vibration: 3.2 },
  { tag: '23-KA-9103', name: 'Recompressor', state: 'Tripped', tone: 'critical', speed: 0, temperature: 64.0, vibration: 0 },
];

const GC_MODES: readonly { label: string; mode: string; tone: Tone }[] = [
  { label: 'Throughput', mode: 'Plan hold', tone: 'success' },
  { label: 'Compression', mode: '2 of 3 trains', tone: 'warning' },
  { label: 'Anti-surge', mode: 'Armed', tone: 'success' },
  { label: 'Flare', mode: 'Standby', tone: 'info' },
];

/** Share of the compression load on train A, in percent. */
const GC_LOAD_A = 58;

const GC_PLAN_MARGIN = deviationPercent(PLANT_KPIS.gasExport.value, PLANT_KPIS.gasExport.target);

const GC_OPEN_ALERTS = ALARMS.filter((alarm) => alarm.state !== 'cleared');

const GC_LEVEL: Record<Alarm['severity'], { word: string; tone: Tone }> = {
  critical: { word: 'Warning', tone: 'critical' },
  high: { word: 'Caution', tone: 'warning' },
  medium: { word: 'Advisory', tone: 'info' },
  low: { word: 'Advisory', tone: 'info' },
};

const GC_CHECKLIST: readonly { id: string; text: string }[] = [
  { id: 'isolate', text: 'Recompressor isolated and depressurised' },
  { id: 'load', text: 'Load moved to 1st and 2nd stage' },
  { id: 'surge', text: 'Anti-surge margins confirmed above 10 %' },
  { id: 'temp', text: '1st stage discharge temperature under 145 °C' },
  { id: 'permit', text: 'Work permit issued for bearing inspection' },
  { id: 'export', text: 'Export nomination revised with the terminal' },
];

const GC_SPEED_TRENDS: readonly (readonly number[])[] = [
  makeValues({ seed: 15, points: 32, base: 9800, amplitude: 120, noise: 40 }),
  makeValues({ seed: 25, points: 32, base: 9600, amplitude: 90, noise: 30 }),
  [...makeValues({ seed: 35, points: 30, base: 9400, amplitude: 100, noise: 40 }), 3200, 0],
];

const GC_TREND = makeSeries({ seed: 11, points: 25, base: 48.2, amplitude: 1.8, noise: 0.5, decimals: 1 });

const GC_TREND_HOURS = GC_TREND.map((point) => formatTime(point.t));

const GC_TREND_SECOND = makeValues({ seed: 12, points: 25, base: 44.5, amplitude: 1.2, noise: 0.4, decimals: 1 });

/** A display in the bezel: black glass, a name strip on top, optional keys underneath. */
function GcDisplay({ name, detail, footer, className = '', children }: { name: string; detail: string; footer?: ReactNode; className?: string; children: ReactNode }) {
  return (
    <section
      aria-label={name}
      className={`flex min-w-0 flex-col overflow-hidden rounded-[18px] border border-[var(--kit-rule-strong)] bg-[var(--mountain-black)] shadow-[inset_0_0_0_4px_var(--mountain-900)] ${className}`}
    >
      <header className="flex items-baseline justify-between gap-3 px-5 pt-4 pb-3">
        <h3 className="text-base font-semibold">{name}</h3>
        <p className="text-sm text-[var(--kit-text-2)]">{detail}</p>
      </header>
      <div className="flex flex-1 flex-col px-5 pb-5">{children}</div>
      {footer}
    </section>
  );
}

/** The mode strip across the top of the primary display: what each control loop is doing. */
function GcModes() {
  return (
    <dl className="grid grid-cols-4 divide-x divide-[var(--kit-rule)] rounded-[10px] border border-[var(--kit-rule)]">
      {GC_MODES.map((mode) => (
        <div key={mode.label} data-tone={mode.tone} className="px-3 py-2">
          <dt className="text-xs text-[var(--kit-text-2)]">{mode.label}</dt>
          <dd className="text-sm leading-tight font-semibold text-[var(--t-ink)]">{mode.mode}</dd>
        </div>
      ))}
    </dl>
  );
}

type GcTapeProps = {
  label: string;
  unit: string;
  value: number;
  decimals: number;
  /** Half the window: the tape shows `value ± span`. */
  span: number;
  step: number;
  /** The target bug on the scale. */
  bug?: { value: number; label: string };
  /** Limit bands drawn along the edge. */
  bands?: readonly GcBand[];
  /** Which edge carries the ticks: the one facing the attitude indicator. */
  edge: 'left' | 'right';
};

/** A vertical tape: the scale slides past a fixed pointer that carries the value. */
function GcTape({ label, unit, value, decimals, span, step, bug, bands = [], edge }: GcTapeProps) {
  const ticks = tapeTicks(value, span, step).filter((tick) => Math.abs(tick.offset) < 0.94);
  const flip = edge === 'right' ? 'flex-row-reverse' : '';
  return (
    <div className="flex h-full min-w-0 flex-col gap-1.5 text-center">
      <p className="text-xs leading-tight font-medium text-[var(--kit-text-2)]">{label}</p>
      <div
        role="meter"
        aria-label={label}
        aria-valuemin={value - span}
        aria-valuemax={value + span}
        aria-valuenow={value}
        aria-valuetext={`${formatNumber(value, decimals)} ${unit}`}
        className="relative flex-1 rounded-[10px] border border-[var(--kit-rule)] bg-[color-mix(in_oklab,var(--mountain-white)_7%,transparent)]"
      >
        {bands.map((band) => (
          <span
            key={band.from}
            data-tone={band.tone}
            className={`absolute w-1.5 bg-[var(--t-line)] ${edge === 'left' ? 'left-0' : 'right-0'}`}
            style={{ top: `${tapePosition(band.to, value, span)}%`, bottom: `${100 - tapePosition(band.from, value, span)}%` }}
          />
        ))}
        {ticks.map((tick) => (
          <span key={tick.value} className={`absolute inset-x-2 flex -translate-y-1/2 items-center gap-1.5 ${flip}`} style={{ top: `${50 - tick.offset * 50}%` }}>
            <span className={`h-0.5 bg-[var(--kit-text-2)] ${tick.major ? 'w-3' : 'w-1.5'}`} />
            {tick.major && Math.abs(tick.offset) > 0.2 ? <span className="text-xs leading-none text-[var(--kit-text-2)] tabular-nums">{formatNumber(tick.value, decimals)}</span> : null}
          </span>
        ))}
        {bug ? (
          <span
            data-tone="pink"
            title={`${bug.label} ${formatNumber(bug.value, decimals)} ${unit}`}
            className={`absolute h-5 w-2.5 -translate-y-1/2 border-2 border-[var(--t-line)] ${edge === 'left' ? 'right-0 border-r-0' : 'left-0 border-l-0'}`}
            style={{ top: `${tapePosition(bug.value, value, span)}%` }}
          />
        ) : null}
        <p className="absolute inset-x-1 top-1/2 -translate-y-1/2 rounded-[6px] border-2 border-[var(--kit-accent)] bg-[var(--mountain-black)] py-1.5 text-xl leading-none font-semibold tabular-nums">
          {formatNumber(value, decimals)}
        </p>
      </div>
      <p className="text-xs leading-tight text-[var(--kit-text-2)]">
        {unit}
        {bug ? (
          <span data-tone="pink" className="block font-medium text-[var(--t-ink)] tabular-nums">
            {bug.label} {formatNumber(bug.value, decimals)}
          </span>
        ) : null}
      </p>
    </div>
  );
}

const GC_PITCH_STEP = 13;

type GcAttitudeProps = {
  /** Production against plan in percent: below plan pitches down. */
  pitch: number;
  /** Load imbalance between the trains in degrees: positive rolls toward train A. */
  roll: number;
};

/** The process balance drawn as an attitude indicator: level wings on the horizon mean on plan and in balance. */
function GcAttitude({ pitch, roll }: GcAttitudeProps) {
  const clip = useId();
  const pointer = polarPoint(150, 150, 118, -roll);
  return (
    <div
      role="img"
      aria-label={`Process balance: ${formatNumber(Math.abs(pitch), 1)} % ${pitch < 0 ? 'under' : 'over'} plan, rolled ${Math.abs(roll)} degrees toward train ${roll > 0 ? 'A' : 'B'}`}
      className="relative aspect-square w-full"
    >
      <svg viewBox="0 0 300 300" className="absolute inset-0 size-full" aria-hidden="true">
        <defs>
          <clipPath id={clip}>
            <rect width="300" height="300" rx="18" />
          </clipPath>
        </defs>
        <g clipPath={`url(#${clip})`}>
          <g transform={`rotate(${-roll} 150 150) translate(0 ${pitch * GC_PITCH_STEP})`}>
            <rect x="-300" y="-450" width="900" height="600" style={{ fill: 'var(--fjord-600)' }} />
            <rect x="-300" y="150" width="900" height="600" style={{ fill: 'var(--amber-800)' }} />
            <line x1="-300" y1="150" x2="600" y2="150" strokeWidth="2.5" style={{ stroke: 'var(--mountain-white)' }} />
            {[-6, -4, -2, 2, 4, 6].map((mark) => {
              const y = 150 - mark * GC_PITCH_STEP;
              const half = mark % 4 === 0 ? 44 : 24;
              return (
                <g key={mark}>
                  <line x1={150 - half} y1={y} x2={150 + half} y2={y} strokeWidth="2" style={{ stroke: 'var(--mountain-white)' }} />
                  {mark % 4 === 0 ? (
                    <text x={150 + half + 8} y={y + 5} fontSize="15" fontWeight="600" style={{ fill: 'var(--mountain-white)' }}>
                      {mark > 0 ? `+${mark}` : `−${Math.abs(mark)}`}
                    </text>
                  ) : null}
                </g>
              );
            })}
          </g>
          <g fill="none" strokeWidth="2" style={{ stroke: 'var(--mountain-white)' }}>
            <path d={arcLine(150, 150, 126, -30, 30)} />
            {[-30, -20, -10, 0, 10, 20, 30].map((mark) => {
              const from = polarPoint(150, 150, 126, mark);
              const to = polarPoint(150, 150, mark % 30 === 0 ? 140 : 134, mark);
              return <line key={mark} x1={from.x} y1={from.y} x2={to.x} y2={to.y} />;
            })}
          </g>
          <path
            d={`M ${pointer.x} ${pointer.y} l -8 14 h 16 Z`}
            transform={`rotate(${-roll} ${pointer.x} ${pointer.y})`}
            style={{ fill: 'var(--mountain-white)' }}
          />
          <g fill="none" strokeWidth="6" strokeLinecap="square" style={{ stroke: 'var(--amber-400)' }}>
            <path d="M 62 150 H 116 V 164" />
            <path d="M 238 150 H 184 V 164" />
          </g>
          <rect x="145" y="145" width="10" height="10" style={{ fill: 'var(--amber-400)' }} />
        </g>
      </svg>
      <span className="absolute top-3 left-3 rounded-[6px] bg-[color-mix(in_oklab,var(--mountain-black)_55%,transparent)] px-2 py-0.5 text-xs font-medium">Over plan</span>
      <span className="absolute bottom-3 left-3 rounded-[6px] bg-[color-mix(in_oklab,var(--mountain-black)_55%,transparent)] px-2 py-0.5 text-xs font-medium">Under plan</span>
    </div>
  );
}

/** The load split between the two trains as a slip-style bar: the marker is centred when they share evenly. */
function GcBalance() {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
      <p className="text-sm font-medium tabular-nums">
        Train A <span className="text-lg font-semibold">{GC_LOAD_A} %</span>
      </p>
      <div role="img" aria-label={`Load split: train A ${GC_LOAD_A} %, train B ${100 - GC_LOAD_A} %`} className="relative h-4 rounded-full border border-[var(--kit-rule-strong)]">
        <span className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-[var(--kit-text-2)]" />
        <span data-tone="warning" className="absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--t-line)]" style={{ left: `${100 - GC_LOAD_A}%` }} />
      </div>
      <p className="text-sm font-medium tabular-nums">
        <span className="text-lg font-semibold">{100 - GC_LOAD_A} %</span> Train B
      </p>
    </div>
  );
}

/** The flight instruments of the plant: export tape, balance indicator, pressure tape. */
function GcPrimary() {
  return (
    <div className="flex flex-1 flex-col justify-between gap-4">
      <GcModes />
      <div className="grid grid-cols-[5.25rem_minmax(0,1fr)_5.25rem] gap-3">
        <GcTape label="Gas export" unit="MSm³/d" value={PLANT_KPIS.gasExport.value} decimals={2} span={0.45} step={0.1} bug={{ value: PLANT_KPIS.gasExport.target, label: 'Plan' }} edge="right" />
        <GcAttitude pitch={GC_PLAN_MARGIN} roll={GC_LOAD_A - 50} />
        <GcTape
          label="Discharge"
          unit="barg"
          value={48.6}
          decimals={1}
          span={9}
          step={2}
          bands={[
            { from: 52, to: 55, tone: 'warning' },
            { from: 55, to: 60, tone: 'critical' },
          ]}
          edge="left"
        />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <p className="rounded-[10px] border border-[var(--kit-rule)] px-3 py-2 text-sm text-[var(--kit-text-2)]">
          Plan margin
          <span data-tone="warning" className="block text-2xl leading-tight font-semibold text-[var(--t-ink)] tabular-nums">
            −{formatNumber(Math.abs(GC_PLAN_MARGIN), 1)} %
          </span>
        </p>
        <p className="rounded-[10px] border border-[var(--kit-rule)] px-3 py-2 text-sm text-[var(--kit-text-2)]">
          Train imbalance
          <span data-tone="warning" className="block text-2xl leading-tight font-semibold text-[var(--t-ink)] tabular-nums">
            {GC_LOAD_A - 50} pts to A
          </span>
        </p>
        <p className="rounded-[10px] border border-[var(--kit-rule)] px-3 py-2 text-sm text-[var(--kit-text-2)]">
          Surge margin
          <span data-tone="success" className="block text-2xl leading-tight font-semibold text-[var(--t-ink)] tabular-nums">
            14.2 %
          </span>
        </p>
      </div>
      <GcBalance />
    </div>
  );
}

/** An engine-style dial: speed as an arc with a red line, the figure in the middle. */
function GcDial({ machine }: { machine: GcMachine }) {
  const end = valueAngle(machine.speed, 0, 12000, -135, 135);
  const redline = valueAngle(10500, 0, 12000, -135, 135);
  const tick = polarPoint(60, 60, 58, redline);
  const tickIn = polarPoint(60, 60, 40, redline);
  return (
    <div data-tone={machine.tone} className="flex min-w-0 flex-col items-center gap-2 text-center">
      <div
        role="meter"
        aria-label={`${machine.name} speed`}
        aria-valuemin={0}
        aria-valuemax={12000}
        aria-valuenow={machine.speed}
        aria-valuetext={`${formatNumber(machine.speed)} rpm`}
        className="relative aspect-square w-full max-w-44"
      >
        <svg viewBox="0 0 120 120" className="absolute inset-0 size-full" aria-hidden="true" fill="none">
          <path d={arcLine(60, 60, 50, -135, 135)} strokeWidth="9" strokeLinecap="round" style={{ stroke: 'var(--kit-track)' }} />
          <path d={arcLine(60, 60, 50, redline, 135)} strokeWidth="9" strokeLinecap="round" style={{ stroke: 'color-mix(in oklab, var(--kit-line-critical) 55%, transparent)' }} />
          {machine.speed > 0 ? <path d={arcLine(60, 60, 50, -135, end)} strokeWidth="9" strokeLinecap="round" style={{ stroke: 'var(--t-line)' }} /> : null}
          <line x1={tickIn.x} y1={tickIn.y} x2={tick.x} y2={tick.y} strokeWidth="2.5" style={{ stroke: 'var(--kit-line-critical)' }} />
        </svg>
        <p className="absolute inset-0 flex flex-col items-center justify-center pt-1">
          <span className="text-2xl leading-none font-semibold tabular-nums">{formatNumber(machine.speed)}</span>
          <span className="mt-1 text-xs text-[var(--kit-text-2)]">rpm</span>
        </p>
      </div>
      <div>
        <p className="text-sm leading-tight font-semibold">{machine.name}</p>
        <p className="text-xs text-[var(--kit-text-2)]">
          <TagId>{machine.tag}</TagId>
        </p>
      </div>
      <StatusPill tone={machine.tone}>{machine.state}</StatusPill>
    </div>
  );
}

function GcMachines() {
  return (
    <div className="flex flex-1 flex-col justify-between gap-5">
      <div className="grid grid-cols-3 gap-4">
        {GC_MACHINES.map((machine) => (
          <GcDial key={machine.tag} machine={machine} />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-4">
        {GC_MACHINES.map((machine, index) => (
          <div key={machine.tag} className="flex min-w-0 flex-col gap-3 rounded-[10px] border border-[var(--kit-rule)] p-3">
            <div>
              <p className="text-xs text-[var(--kit-text-2)]">Speed, last 8 h</p>
              <SparkLine values={GC_SPEED_TRENDS[index]} label={`${machine.name} speed, last 8 hours`} tone={machine.tone} variant="line" className="mt-1 h-12 w-full" />
            </div>
            <Meter label="Outlet" value={machine.temperature} max={180} decimals={1} unit="°C" high={145} tone={machine.temperature > 140 ? 'warning' : 'success'} hideScale />
            <Meter label="Vibration" value={machine.vibration} max={15} decimals={1} unit="mm/s" high={7.1} tone={machine.vibration > 6 ? 'warning' : 'success'} hideScale />
          </div>
        ))}
      </div>
    </div>
  );
}

function GcTrend() {
  return (
    <div className="flex flex-1 flex-col justify-center">
      <TrendLine
        label="Discharge pressure of the 1st and 2nd stage compressors, last 24 hours, against the high limit"
        series={[
          { id: 'first', label: '1st stage', values: GC_TREND.map((point) => point.v), tone: 'accent' },
          { id: 'second', label: '2nd stage', values: GC_TREND_SECOND, tone: 'purple' },
        ]}
        labels={GC_TREND_HOURS}
        unit="barg"
        decimals={1}
        limits={[{ value: 52, label: 'High', tone: 'warning' }]}
        yDomain={[40, 56]}
        height={360}
        highlightLast
      />
    </div>
  );
}

function GcAlertIcon({ severity }: { severity: Alarm['severity'] }) {
  if (severity === 'critical') return <IconAlertOctagon className="size-5 shrink-0" aria-hidden="true" />;
  if (severity === 'high') return <IconAlertTriangle className="size-5 shrink-0" aria-hidden="true" />;
  return <IconInfoCircle className="size-5 shrink-0" aria-hidden="true" />;
}

/** The crew alerting list: warnings first, then cautions, then advisories, each spelled out. */
function GcAlerts() {
  return (
    <ul className="flex flex-1 flex-col gap-2">
      {GC_OPEN_ALERTS.map((alarm) => {
        const level = GC_LEVEL[alarm.severity];
        return (
          <li key={alarm.id} data-tone={level.tone} className="flex flex-1 items-center gap-3 rounded-[10px] border border-[color-mix(in_oklab,var(--t-line)_45%,transparent)] bg-[color-mix(in_oklab,var(--t-line)_12%,transparent)] px-3 py-2">
            <span className="flex w-24 shrink-0 items-center gap-1.5 text-sm font-semibold text-[var(--t-ink)]">
              <GcAlertIcon severity={alarm.severity} />
              {level.word}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm leading-snug font-medium">{alarm.message}</span>
              <span className="block text-xs text-[var(--kit-text-2)] tabular-nums">
                <TagId>{alarm.sensorTag}</TagId> · {alarm.value}
              </span>
            </span>
            <span className="shrink-0 text-xs text-[var(--kit-text-2)] tabular-nums">{formatAgo(alarm.raisedAt)}</span>
          </li>
        );
      })}
    </ul>
  );
}

function GcChecklist({ done, onToggle }: { done: readonly string[]; onToggle: (id: string) => void }) {
  return (
    <div className="flex flex-1 flex-col gap-3">
      <p className="text-sm text-[var(--kit-text-2)] tabular-nums">
        Recompressor trip · {done.length} of {GC_CHECKLIST.length} complete
      </p>
      <ul className="flex flex-1 flex-col gap-2">
        {GC_CHECKLIST.map((item) => {
          const checked = done.includes(item.id);
          return (
            <li key={item.id} className="flex flex-1">
              <button
                type="button"
                role="checkbox"
                aria-checked={checked}
                data-tone="success"
                onClick={() => onToggle(item.id)}
                className={`flex w-full items-center gap-3 rounded-[10px] border px-3 py-2 text-left text-sm font-medium outline-offset-2 focus-visible:outline-2 focus-visible:outline-[var(--kit-accent)] ${
                  checked ? 'border-[color-mix(in_oklab,var(--t-line)_45%,transparent)] text-[var(--t-ink)]' : 'border-[var(--kit-rule)]'
                }`}
              >
                <span className={`flex size-5 shrink-0 items-center justify-center rounded border-2 ${checked ? 'border-[var(--t-line)]' : 'border-[var(--kit-text-2)]'}`}>
                  {checked ? <IconCheck className="size-4" aria-hidden="true" /> : null}
                </span>
                {item.text}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** The key row under the multi-function display: one key per page, the lit one is showing. */
function GcSoftkeys({ page, onPage }: { page: GcPage; onPage: (page: GcPage) => void }) {
  return (
    <div role="group" aria-label="Display pages" className="grid grid-cols-4 gap-2 border-t border-[var(--kit-rule)] bg-[var(--mountain-950)] p-3">
      {GC_PAGES.map((entry) => (
        <button
          key={entry.id}
          type="button"
          aria-pressed={entry.id === page}
          onClick={() => onPage(entry.id)}
          className={`rounded-[6px] border-t-[3px] px-2 py-2 text-sm font-semibold outline-offset-2 focus-visible:outline-2 focus-visible:outline-[var(--kit-accent)] ${
            entry.id === page ? 'border-[var(--kit-accent)] bg-[color-mix(in_oklab,var(--kit-accent)_22%,transparent)]' : 'border-transparent bg-[var(--mountain-800)] text-[var(--kit-text-2)]'
          }`}
        >
          {entry.label}
        </button>
      ))}
    </div>
  );
}

function GcPageBody({ page, done, onToggle }: { page: GcPage; done: readonly string[]; onToggle: (id: string) => void }) {
  if (page === 'trend') return <GcTrend />;
  if (page === 'alerts') return <GcAlerts />;
  if (page === 'checklist') return <GcChecklist done={done} onToggle={onToggle} />;
  return <GcMachines />;
}

const GC_PAGE_DETAIL: Record<GcPage, string> = {
  machines: 'Compression train',
  trend: 'Discharge pressure, 24 h',
  alerts: '1 warning · 2 cautions · 3 advisories',
  checklist: 'Abnormal procedure',
};

/** The cockpit bezel: flat dark metal behind the displays. */
function GcBezel({ className = '', children }: { className?: string; children: ReactNode }) {
  return (
    <div data-look="glass" className={`p-4 ${className}`} style={{ background: 'linear-gradient(180deg, var(--mountain-800), var(--mountain-950))' }}>
      {children}
    </div>
  );
}

function gcToggle(done: readonly string[], id: string): string[] {
  return done.includes(id) ? done.filter((entry) => entry !== id) : [...done, id];
}

function GlassCockpitSignature() {
  const [page, setPage] = useState<GcPage>('machines');
  const [done, setDone] = useState<readonly string[]>(['isolate', 'load', 'permit']);
  return (
    <LookScope look="glass">
      <Canvas padding="none">
        <GcBezel className="grid min-h-[46rem] grid-cols-[minmax(0,1.12fr)_minmax(0,1fr)] gap-4">
          <GcDisplay name="Primary display" detail="Nordkapp · 14:00 UTC">
            <GcPrimary />
          </GcDisplay>
          <GcDisplay name={GC_PAGES.find((entry) => entry.id === page)?.label ?? 'Machines'} detail={GC_PAGE_DETAIL[page]} footer={<GcSoftkeys page={page} onPage={setPage} />}>
            <GcPageBody page={page} done={done} onToggle={(id) => setDone(gcToggle(done, id))} />
          </GcDisplay>
        </GcBezel>
      </Canvas>
    </LookScope>
  );
}

function GlassCockpitAbnormal() {
  const [done, setDone] = useState<readonly string[]>(['isolate', 'load']);
  return (
    <LookScope look="glass">
      <Canvas padding="none">
        <GcBezel className="h-full">
          <GcDisplay name="Abnormal: recompressor trip" detail="Alerts beside the procedure" className="h-full">
            <div className="grid flex-1 grid-cols-[minmax(0,6fr)_minmax(0,5fr)] gap-5">
              <GcAlerts />
              <GcChecklist done={done} onToggle={(id) => setDone(gcToggle(done, id))} />
            </div>
          </GcDisplay>
        </GcBezel>
      </Canvas>
    </LookScope>
  );
}

function GlassCockpitStandby() {
  return (
    <LookScope look="glass">
      <Canvas padding="none">
        <GcBezel className="h-full">
          <GcDisplay name="Standby instrument" detail="Balance only" className="h-full">
            <div className="flex flex-1 flex-col justify-between gap-4">
              <GcAttitude pitch={GC_PLAN_MARGIN} roll={GC_LOAD_A - 50} />
              <GcBalance />
              <p className="text-sm text-[var(--kit-text-2)] tabular-nums">
                Export {formatNumber(PLANT_KPIS.gasExport.value, 2)} MSm³/d, {formatNumber(Math.abs(GC_PLAN_MARGIN), 1)} % under plan
              </p>
            </div>
          </GcDisplay>
        </GcBezel>
      </Canvas>
    </LookScope>
  );
}

function GlassCockpitAttitude() {
  const [roll, setRoll] = useState(8);
  return (
    <LookScope look="glass" className="w-full">
      <Canvas padding="none">
        <GcBezel className="flex flex-col gap-3">
          <GcAttitude pitch={GC_PLAN_MARGIN} roll={roll} />
          <div className="grid grid-cols-3 gap-2">
            {[-12, 0, 8].map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={roll === value}
                onClick={() => setRoll(value)}
                className={`rounded-[6px] px-2 py-2 text-sm font-semibold outline-offset-2 focus-visible:outline-2 focus-visible:outline-[var(--kit-accent)] ${
                  roll === value ? 'bg-[color-mix(in_oklab,var(--kit-accent)_22%,transparent)]' : 'bg-[var(--mountain-800)] text-[var(--kit-text-2)]'
                }`}
              >
                {value === 0 ? 'Balanced' : value > 0 ? `${value} to A` : `${Math.abs(value)} to B`}
              </button>
            ))}
          </div>
        </GcBezel>
      </Canvas>
    </LookScope>
  );
}

function GlassCockpitTapes() {
  return (
    <LookScope look="glass" className="w-full">
      <Canvas padding="none">
        <GcBezel>
          <div className="grid h-80 grid-cols-3 gap-4 rounded-[18px] bg-[var(--mountain-black)] p-4">
            <GcTape label="Gas export" unit="MSm³/d" value={PLANT_KPIS.gasExport.value} decimals={2} span={0.45} step={0.1} bug={{ value: 4.5, label: 'Plan' }} edge="right" />
            <GcTape label="Discharge" unit="barg" value={48.6} decimals={1} span={9} step={2} bands={[{ from: 52, to: 60, tone: 'warning' }]} edge="left" />
            <GcTape label="Suction" unit="barg" value={12.4} decimals={1} span={4} step={1} bands={[{ from: 5, to: 10, tone: 'warning' }]} edge="left" />
          </div>
        </GcBezel>
      </Canvas>
    </LookScope>
  );
}

function GlassCockpitModes() {
  const [page, setPage] = useState<GcPage>('trend');
  return (
    <LookScope look="glass" className="w-full">
      <Canvas padding="none">
        <GcBezel className="flex h-full flex-col justify-center gap-4">
          <div className="rounded-[18px] bg-[var(--mountain-black)] p-4">
            <GcModes />
          </div>
          <div className="overflow-hidden rounded-[18px]">
            <GcSoftkeys page={page} onPage={setPage} />
          </div>
        </GcBezel>
      </Canvas>
    </LookScope>
  );
}

function GlassCockpitMachines() {
  return (
    <LookScope look="glass" className="w-full">
      <Canvas padding="none">
        <GcBezel>
          <GcDisplay name="Machines" detail="Compression train">
            <GcMachines />
          </GcDisplay>
        </GcBezel>
      </Canvas>
    </LookScope>
  );
}

function GlassCockpitAlerts() {
  return (
    <LookScope look="glass" className="w-full">
      <Canvas padding="none">
        <GcBezel className="h-full">
          <GcDisplay name="Alerts" detail="Most severe first" className="h-full">
            <GcAlerts />
          </GcDisplay>
        </GcBezel>
      </Canvas>
    </LookScope>
  );
}

export default definePage({
  id: 'glass-cockpit',
  title: 'Glass cockpit',
  summary:
    'The plant flown like an aircraft: a primary display with tapes and a balance indicator that is level when production is on plan, and a multi-function display paged with keys.',
  guidance: {
    use: [
      'When two or three quantities must be held against targets all shift: tapes show value, target and limits in one place.',
      'The balance indicator for a pair of deviations that should both be zero, such as plan margin and train imbalance.',
      'Page keys for a secondary display, so the primary instruments never move.',
    ],
    avoid: [
      'Borrowing the look without the logic: every instrument here maps to a named process quantity.',
      'More than four page keys, or keys that change the primary display.',
      'Colour without a word in the alert list: each row says warning, caution or advisory.',
    ],
  },
  source,
  sections: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description: 'Use the keys under the right display to page it: machines, trend, alerts and a checklist you can tick.',
      specimens: [
        {
          id: 'GlassCockpitSignature',
          title: 'Primary and multi-function display',
          note: 'Pick it for a control desk where one person holds production on plan and scans the machines beside it.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/glass-cockpit/tape.ts', 'kit/radial-mission-control/polar.ts', 'kit/Meter.tsx', 'kit/TrendLine.tsx', 'kit/StatusPill.tsx', 'looks/LookScope.tsx'],
          Component: GlassCockpitSignature,
        },
      ],
    },
    {
      id: 'variations',
      title: 'Variations',
      description: 'Two more screens: the abnormal layout that puts alerts beside the procedure, and the standby instrument.',
      specimens: [
        {
          id: 'GlassCockpitAbnormal',
          title: 'Abnormal procedure',
          note: 'Pick it after a trip: what is wrong on the left, what to do about it on the right, ticked off as you go.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          bleed: true,
          uses: ['kit/TagId.tsx', 'kit/Canvas.tsx'],
          Component: GlassCockpitAbnormal,
        },
        {
          id: 'GlassCockpitStandby',
          title: 'Standby instrument',
          note: 'Pick it for a small always-on display: the balance indicator and the load split, nothing to operate.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          bleed: true,
          uses: ['kit/radial-mission-control/polar.ts'],
          Component: GlassCockpitStandby,
        },
      ],
    },
    {
      id: 'parts',
      title: 'Parts',
      description: 'The instruments on their own.',
      specimens: [
        {
          id: 'GlassCockpitAttitude',
          title: 'Balance indicator',
          note: 'Pick it for two deviations that should both be zero; try the three load splits to see it roll.',
          origin: 'custom',
          align: 'stretch',
          bleed: true,
          uses: ['kit/radial-mission-control/polar.ts'],
          Component: GlassCockpitAttitude,
        },
        {
          id: 'GlassCockpitTapes',
          title: 'Tapes',
          note: 'Pick a tape when the value, its target and its limits matter more than its history.',
          origin: 'custom',
          align: 'stretch',
          bleed: true,
          uses: ['kit/glass-cockpit/tape.ts'],
          Component: GlassCockpitTapes,
        },
        {
          id: 'GlassCockpitModes',
          title: 'Mode strip and page keys',
          note: 'Pick the strip to say what each control loop is doing, and the keys to page a secondary display.',
          origin: 'custom',
          align: 'stretch',
          bleed: true,
          Component: GlassCockpitModes,
        },
        {
          id: 'GlassCockpitMachines',
          title: 'Machine dials',
          note: 'Pick it to compare identical machines side by side: speed against the red line, then two limits each.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Meter.tsx', 'kit/StatusPill.tsx', 'kit/radial-mission-control/polar.ts'],
          Component: GlassCockpitMachines,
        },
        {
          id: 'GlassCockpitAlerts',
          title: 'Alert list',
          note: 'Pick it when alarms need a rank a person can say out loud: warning, caution, advisory.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          bleed: true,
          uses: ['kit/TagId.tsx'],
          Component: GlassCockpitAlerts,
        },
      ],
    },
  ],
});
