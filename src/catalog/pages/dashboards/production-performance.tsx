import { Button } from '@cognite/aura/components/button';
import { IconArrowRight, IconTool } from '@cognite/aura/icons';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { Bars } from '../../../library/kit/Bars';
import { Canvas } from '../../../library/kit/Canvas';
import { Delta } from '../../../library/kit/Delta';
import { LossBar, type LossSegment } from '../../../library/kit/production-performance/LossBar';
import { TagId } from '../../../library/kit/TagId';
import { cx, formatNumber, type Tone } from '../../../library/kit/tones';
import { LookScope } from '../../../library/looks/LookScope';
import { PLANT_KPIS } from '../../data/plant';
import { definePage } from '../../types';

import source from './production-performance.tsx?raw';

type PpFactorId = 'availability' | 'performance' | 'quality';

type PpFactor = { id: PpFactorId; label: string; value: number; target: number; tone: Tone; meaning: string };

/** Nordkapp, March 2026 to day 12. OEE is the product of the three factors: 96.4 × 90.5 × 94.8 %. */
const PP_FACTORS: Record<PpFactorId, PpFactor> = {
  availability: { id: 'availability', label: 'Availability', value: PLANT_KPIS.availability.value, target: 97.5, tone: 'teal', meaning: 'of planned hours' },
  performance: { id: 'performance', label: 'Performance', value: 90.5, target: 93, tone: 'blue', meaning: 'Rate against nameplate' },
  quality: { id: 'quality', label: 'Quality', value: 94.8, target: 96, tone: 'amber', meaning: 'Gas on specification' },
};

const PP_OEE = PLANT_KPIS.oee;

type PpLoss = {
  id: string;
  label: string;
  factor: PpFactorId;
  /** OEE points lost this month. */
  points: number;
  /** The same loss as gas not exported, MSm³. */
  volume: number;
  story: string;
  causes: readonly { label: string; points: number }[];
  /** Points lost on each of the twelve days so far. */
  days: readonly number[];
  action: { title: string; order: string; due: string };
};

const PP_LOSSES: readonly PpLoss[] = [
  {
    id: 'trips',
    label: 'Compressor trips',
    factor: 'availability',
    points: 2.2,
    volume: 1.19,
    story: 'Three trips in twelve days, two of them on the recompressor’s drive-end vibration.',
    causes: [
      { label: 'Recompressor vibration', points: 1.3 },
      { label: '1st stage surge', points: 0.6 },
      { label: 'Lube oil pressure', points: 0.3 },
    ],
    days: [0, 0, 11.4, 0, 0, 0, 0, 0, 5.6, 0, 2.1, 7.3],
    action: { title: 'Inspect the drive-end bearing', order: 'WO-104482', due: 'today' },
  },
  {
    id: 'planned',
    label: 'Planned work',
    factor: 'availability',
    points: 1.4,
    volume: 0.76,
    story: 'The interstage cooler inspection on the 5th and 6th took one train to reduced rate.',
    causes: [
      { label: 'Cooler inspection', points: 1.1 },
      { label: 'Valve stroke tests', points: 0.3 },
    ],
    days: [0, 0, 0, 0, 7.6, 9.2, 0, 0, 0, 0, 0, 0],
    action: { title: 'Move stroke tests to the April stop', order: 'WO-104431', due: '20 Mar' },
  },
  {
    id: 'cooler',
    label: 'Cooler capacity',
    factor: 'performance',
    points: 4.6,
    volume: 2.48,
    story: 'The fouled interstage cooler caps the rate every warm afternoon, and the cap is creeping up.',
    causes: [
      { label: 'Fouled tube bundle', points: 2.9 },
      { label: 'Warm sea water', points: 1.1 },
      { label: 'Bypass valve passing', points: 0.6 },
    ],
    days: [3.1, 3.4, 3.6, 3.9, 4.2, 4.4, 4.6, 4.9, 5.1, 5.4, 6.2, 6.4],
    action: { title: 'Clean the tube bundle', order: 'WO-104471', due: '16 Mar' },
  },
  {
    id: 'inlet',
    label: 'Inlet shortfall',
    factor: 'performance',
    points: 2.9,
    volume: 1.57,
    story: 'Upstream nominations came in under plan on five days; nothing the plant could make up.',
    causes: [
      { label: 'Low nominations', points: 2.1 },
      { label: 'Slugging at the inlet', points: 0.8 },
    ],
    days: [4.1, 0, 0, 6.3, 0, 0, 8.7, 0, 5.2, 0, 6.9, 3.6],
    action: { title: 'Agree a slug-handling window', order: 'WO-104466', due: '18 Mar' },
  },
  {
    id: 'speed',
    label: 'Reduced speed',
    factor: 'performance',
    points: 1.7,
    volume: 0.92,
    story: 'The 1st stage ran at 94 % speed while its vibration sat close to the alarm limit.',
    causes: [
      { label: 'Vibration margin', points: 1.2 },
      { label: 'Anti-surge recycle', points: 0.5 },
    ],
    days: [0, 0, 0, 0, 0, 0, 1.8, 2.4, 3.1, 3.6, 4.4, 5.1],
    action: { title: 'Run the vibration survey', order: 'WO-104466', due: '14 Mar' },
  },
  {
    id: 'offspec',
    label: 'Off-spec gas',
    factor: 'quality',
    points: 4.5,
    volume: 2.43,
    story: 'Hydrogen sulphide drifted above the export limit; held batches were recycled, not sold.',
    causes: [
      { label: 'Amine contactor carry-over', points: 3.2 },
      { label: 'Dew point excursions', points: 0.9 },
      { label: 'Sampling delays', points: 0.4 },
    ],
    days: [2.2, 2.4, 2.1, 3.3, 3.8, 3.1, 4.4, 5.2, 4.9, 6.1, 7.3, 9.2],
    action: { title: 'Change the amine filter', order: 'WO-104490', due: '13 Mar' },
  },
];

const PP_LOST = Math.round(PP_LOSSES.reduce((sum, loss) => sum + loss.points, 0) * 10) / 10;

const PP_SEGMENTS: LossSegment[] = PP_LOSSES.map((loss) => ({ id: loss.id, label: loss.label, value: loss.points, tone: PP_FACTORS[loss.factor].tone, note: PP_FACTORS[loss.factor].label }));

const PP_DAY_LABELS = Array.from({ length: 12 }, (_, index) => String(index + 1));

function PpBlock({ tone, invert = false, className, children }: { tone?: Tone; invert?: boolean; className?: string; children: ReactNode }) {
  return (
    <div
      data-tone={tone}
      className={cx(
        'flex min-w-0 flex-col p-5',
        invert ? 'bg-base-foreground text-base-background' : tone ? 'bg-[var(--t-pop)] text-[var(--t-on-pop)]' : 'bg-base-background text-base-foreground',
        className
      )}
    >
      {children}
    </div>
  );
}

function PpMosaic({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx('grid gap-0.5 border-2 border-base-foreground bg-base-foreground', className)}>{children}</div>;
}

function PpTitleBlock({ className }: { className?: string }) {
  return (
    <PpBlock invert className={cx('justify-between gap-3', className)}>
      <h2 className="text-3xl font-extrabold leading-none tracking-tighter">
        Production
        <br />
        performance
      </h2>
      <p className="text-sm font-bold">Nordkapp · March, day 12 of 31</p>
    </PpBlock>
  );
}

function PpExportBlock({ className }: { className?: string }) {
  return (
    <PpBlock tone="green" className={cx('justify-between gap-2', className)}>
      <p className="text-sm font-bold">Gas exported to date</p>
      <p className="text-5xl font-extrabold leading-none tracking-tighter tabular-nums">
        52.1<span className="ml-1.5 text-base font-bold tracking-normal">MSm³</span>
      </p>
      <p className="text-sm font-bold">1.9 short of the 54.0 planned</p>
    </PpBlock>
  );
}

function PpOeeBlock({ className }: { className?: string }) {
  return (
    <PpBlock tone="pink" className={cx('@container justify-between gap-2', className)}>
      <div className="flex items-start justify-between gap-3 text-base font-bold">
        <span>OEE this month</span>
        <span className="text-right text-sm">Availability × performance × quality</span>
      </div>
      <p className="whitespace-nowrap text-[39cqw] font-extrabold leading-[0.8] tracking-[-0.07em] tabular-nums">
        {formatNumber(PP_OEE.value, 1)}
        <span className="ml-[1.5cqw] text-[10cqw] tracking-tighter">%</span>
      </p>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-base font-bold">
        <span className="bg-[var(--t-on-pop)] px-2 py-0.5 text-[var(--t-pop)]">Target {formatNumber(PP_OEE.target, 1)} %</span>
        <span>{formatNumber(PP_OEE.target - PP_OEE.value, 1)} points to go</span>
        <span className="inline-flex items-center gap-1.5">
          <Delta value={PP_OEE.value - PP_OEE.previous} unit=" pts" /> on February
        </span>
      </div>
    </PpBlock>
  );
}

function PpFactorBlock({ factor, large = false, className }: { factor: PpFactor; large?: boolean; className?: string }) {
  return (
    <PpBlock tone={factor.tone} className={cx('justify-between gap-2', className)}>
      <p className="text-sm font-bold">{factor.label}</p>
      <p className={cx('font-extrabold leading-none tracking-tighter tabular-nums', large ? 'text-7xl' : 'text-5xl')}>
        {formatNumber(factor.value, 1)}
        <span className="ml-1 text-xl">%</span>
      </p>
      <p className="text-sm font-bold">
        {large ? `${factor.meaning} · ` : ''}target {formatNumber(factor.target, 1)}
      </p>
    </PpBlock>
  );
}

function PpLossBlock({ selected, onSelect, className }: { selected: string | null; onSelect: (id: string) => void; className?: string }) {
  return (
    <PpBlock className={cx('gap-3', className)}>
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="text-2xl font-extrabold tracking-tighter">Where {formatNumber(PP_LOST, 1)} points went</h3>
        <p className="text-sm font-bold">Tap a block to break it down</p>
      </div>
      <LossBar
        label="OEE points lost this month by cause"
        segments={PP_SEGMENTS}
        selected={selected}
        onSelect={onSelect}
        whole={{ total: 100, keptLabel: `${formatNumber(PP_OEE.value, 1)} % of what the plant could make was made`, lostLabel: `${formatNumber(PP_LOST, 1)} lost` }}
      />
    </PpBlock>
  );
}

function PpLossHeadline({ loss, className }: { loss: PpLoss; className?: string }) {
  const factor = PP_FACTORS[loss.factor];
  return (
    <PpBlock tone={factor.tone} className={cx('justify-between gap-3', className)}>
      <div>
        <p className="text-sm font-bold">
          {loss.label} · {factor.label.toLowerCase()} loss
        </p>
        <p className="mt-1 text-7xl font-extrabold leading-none tracking-tighter tabular-nums">
          −{formatNumber(loss.points, 1)}
          <span className="ml-1.5 text-xl">pts</span>
        </p>
      </div>
      <p className="text-base font-bold leading-snug">{loss.story}</p>
      <p className="text-sm font-bold">
        {formatNumber(loss.volume, 2)} MSm³ not exported · {Math.round((loss.points / PP_LOST) * 100)} % of all losses
      </p>
    </PpBlock>
  );
}

function PpLossCauses({ loss, className }: { loss: PpLoss; className?: string }) {
  const tone = PP_FACTORS[loss.factor].tone;
  return (
    <PpBlock className={cx('gap-3', className)}>
      <h3 className="text-lg font-extrabold tracking-tight">What is behind it</h3>
      <Bars
        label={`${loss.label}: OEE points lost by cause`}
        orientation="horizontal"
        categories={loss.causes.map((cause) => cause.label)}
        series={[{ id: 'points', label: 'Points lost', values: loss.causes.map((cause) => cause.points), tone }]}
        decimals={1}
        showValues
        height={loss.causes.length * 44 + 30}
      />
      <div className="mt-auto flex items-center gap-3 border-t-2 border-base-foreground pt-3">
        <span className="flex size-9 shrink-0 items-center justify-center bg-base-foreground text-base-background [&>svg]:size-5">
          <IconTool aria-hidden="true" />
        </span>
        <p className="min-w-0 flex-1 text-sm font-bold leading-tight">
          {loss.action.title}
          <span className="block font-semibold">
            <TagId>{loss.action.order}</TagId> · due {loss.action.due}
          </span>
        </p>
        <Button variant="outline" size="sm">
          Open <IconArrowRight />
        </Button>
      </div>
    </PpBlock>
  );
}

function PpLossDays({ loss, className }: { loss: PpLoss; className?: string }) {
  const tone = PP_FACTORS[loss.factor].tone;
  const worst = loss.days.indexOf(Math.max(...loss.days));
  return (
    <PpBlock className={cx('gap-3', className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <h3 className="whitespace-nowrap text-lg font-extrabold tracking-tight">Day by day</h3>
        <p className="text-sm font-bold">
          Worst on {worst + 1} March, −{formatNumber(loss.days[worst] ?? 0, 1)} pts
        </p>
      </div>
      <Bars
        label={`${loss.label}: OEE points lost on each day of March so far`}
        categories={PP_DAY_LABELS}
        series={[{ id: 'points', label: 'Points lost', values: loss.days, tone }]}
        tones={loss.days.map((_, day) => (day === worst ? 'accent' : tone))}
        decimals={1}
        height={196}
      />
    </PpBlock>
  );
}

function PpBoard() {
  const [selected, setSelected] = useState('cooler');
  const loss = PP_LOSSES.find((entry) => entry.id === selected) ?? PP_LOSSES[0];
  return (
    <LookScope look="poster">
      <Canvas className="flex h-[940px] flex-col">
        <PpMosaic className="min-h-0 flex-1 grid-cols-12 grid-rows-[minmax(8.5rem,1fr)_minmax(8.5rem,1fr)_auto_minmax(0,2.1fr)]">
          <PpTitleBlock className="col-span-3" />
          <PpOeeBlock className="col-span-5 row-span-2" />
          <PpFactorBlock factor={PP_FACTORS.availability} large className="col-span-4" />
          <PpExportBlock className="col-span-3" />
          <PpFactorBlock factor={PP_FACTORS.performance} className="col-span-2" />
          <PpFactorBlock factor={PP_FACTORS.quality} className="col-span-2" />
          <PpLossBlock selected={selected} onSelect={setSelected} className="col-span-12" />
          <PpLossHeadline loss={loss} className="col-span-3" />
          <PpLossCauses loss={loss} className="col-span-4" />
          <PpLossDays loss={loss} className="col-span-5" />
        </PpMosaic>
      </Canvas>
    </LookScope>
  );
}

function ProductionPerformanceSignature() {
  return <PpBoard />;
}

type PpDay = { day: number; oee: number; note: string };

const PP_DAYS: readonly PpDay[] = [
  { day: 1, oee: 88.4, note: 'A clean day. Rate limited only by the cooler in the afternoon.' },
  { day: 2, oee: 89.1, note: 'Best day of the month so far; nominations above plan.' },
  { day: 3, oee: 76.9, note: '1st stage compressor tripped for 4.5 hours on the night shift.' },
  { day: 4, oee: 82.3, note: 'Low nominations in the morning, recovered by evening.' },
  { day: 5, oee: 79.8, note: 'Interstage cooler out for inspection; one train at reduced rate.' },
  { day: 6, oee: 78.2, note: 'Inspection continued; back at full rate from 22:00.' },
  { day: 7, oee: 80.4, note: 'Inlet slugging held the rate back through the day shift.' },
  { day: 8, oee: 84.6, note: 'Steady, with the first held batch on hydrogen sulphide.' },
  { day: 9, oee: 77.5, note: 'Recompressor trip on the evening shift; restarted after two hours.' },
  { day: 10, oee: 83.9, note: 'Reduced speed on the 1st stage while vibration was trended.' },
  { day: 11, oee: 79.3, note: 'Two held batches and a short trip on the night shift.' },
  { day: 12, oee: 74.1, note: 'Today, forecast to midnight. Recompressor tripped at 13:46.' },
];

const ppDayTone = (oee: number): Tone => (oee >= PP_OEE.target ? 'green' : oee >= 80 ? 'amber' : 'pink');

/** March 2026 starts on a Sunday; the calendar runs Monday to Sunday. */
const PP_CALENDAR_OFFSET = 6;

const PP_WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function ProductionPerformanceCalendar() {
  const [selected, setSelected] = useState(9);
  const day = PP_DAYS.find((entry) => entry.day === selected) ?? PP_DAYS[0];
  return (
    <LookScope look="poster">
      <Canvas>
        <PpMosaic className="grid-cols-12">
          <PpBlock invert className="col-span-8 justify-end">
            <h2 className="text-5xl font-extrabold leading-none tracking-tighter">March, one block a day.</h2>
            <p className="mt-2 text-base font-bold">Daily OEE against the 85 % target. Pick a day to read what happened.</p>
          </PpBlock>
          <PpBlock tone={ppDayTone(day.oee)} className="col-span-4 row-span-2 justify-between gap-4">
            <p className="text-base font-bold">{day.day} March</p>
            <div>
              <p className="text-8xl font-extrabold leading-none tracking-tighter tabular-nums">
                {formatNumber(day.oee, 1)}
                <span className="ml-1 text-3xl">%</span>
              </p>
              <p className="mt-2 text-base font-bold">
                {day.oee >= PP_OEE.target ? `${formatNumber(day.oee - PP_OEE.target, 1)} points over target` : `${formatNumber(PP_OEE.target - day.oee, 1)} points under target`}
              </p>
            </div>
            <p className="text-lg font-bold leading-snug">{day.note}</p>
          </PpBlock>
          <div className="col-span-8 grid grid-cols-7 gap-0.5 bg-base-foreground">
            {PP_WEEKDAYS.map((weekday) => (
              <span key={weekday} className="bg-base-background px-3 py-1.5 text-sm font-bold text-base-foreground">
                {weekday}
              </span>
            ))}
            {Array.from({ length: PP_CALENDAR_OFFSET }, (_, index) => (
              <span key={`blank-${index}`} className="bg-base-background" />
            ))}
            {Array.from({ length: 31 }, (_, index) => {
              const entry = PP_DAYS.find((candidate) => candidate.day === index + 1);
              if (!entry) {
                return (
                  <span key={index} className="flex h-20 flex-col justify-between bg-base-background p-2.5 text-sm font-bold text-medium-foreground">
                    {index + 1}
                  </span>
                );
              }
              const active = entry.day === selected;
              return (
                <button
                  key={index}
                  type="button"
                  data-tone={ppDayTone(entry.oee)}
                  aria-pressed={active}
                  aria-label={`${entry.day} March, OEE ${formatNumber(entry.oee, 1)} percent`}
                  onClick={() => setSelected(entry.day)}
                  className={cx(
                    'flex h-20 cursor-pointer flex-col justify-between p-2.5 text-left outline-none focus-visible:[box-shadow:inset_0_0_0_4px_var(--base-background)]',
                    active ? 'bg-base-foreground text-[var(--t-pop)]' : 'bg-[var(--t-pop)] text-[var(--t-on-pop)]'
                  )}
                >
                  <span className="text-sm font-bold">{entry.day}</span>
                  <span className="text-3xl font-extrabold leading-none tracking-tighter tabular-nums">{formatNumber(entry.oee, 1)}</span>
                </button>
              );
            })}
            {Array.from({ length: 42 - 31 - PP_CALENDAR_OFFSET }, (_, index) => (
              <span key={`after-${index}`} className="bg-base-background" />
            ))}
          </div>
        </PpMosaic>
      </Canvas>
    </LookScope>
  );
}

type PpShift = { id: string; name: string; hours: string; lead: string; oee: number; lost: string; tone: Tone };

const PP_SHIFTS: readonly PpShift[] = [
  { id: 'day', name: 'Day', hours: '06:00 to 14:00', lead: 'Ingrid Haugen', oee: 85.9, lost: 'Cooler capacity, −3.1 pts', tone: 'green' },
  { id: 'evening', name: 'Evening', hours: '14:00 to 22:00', lead: 'Liv Wold', oee: 83.2, lost: 'Off-spec gas, −5.4 pts', tone: 'amber' },
  { id: 'night', name: 'Night', hours: '22:00 to 06:00', lead: 'Jonas Nyberg', oee: 79.0, lost: 'Compressor trips, −5.8 pts', tone: 'pink' },
];

function ProductionPerformanceShifts() {
  return (
    <LookScope look="poster">
      <Canvas>
        <PpMosaic className="grid-cols-[1.5fr_1.15fr_1fr]">
          {PP_SHIFTS.map((shift, index) => (
            <PpBlock key={shift.id} tone={shift.tone} className="min-h-80 justify-between gap-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-4xl font-extrabold leading-none tracking-tighter">{shift.name}</h3>
                  <p className="mt-1.5 text-sm font-bold">
                    {shift.hours} · {shift.lead}
                  </p>
                </div>
                <span className="bg-[var(--t-on-pop)] px-2.5 py-1 text-base font-extrabold text-[var(--t-pop)]">{index + 1}</span>
              </div>
              <p className={cx('font-extrabold leading-[0.85] tracking-tighter tabular-nums', index === 0 ? 'text-9xl' : 'text-8xl')}>
                {formatNumber(shift.oee, 1)}
                <span className="ml-1 text-3xl">%</span>
              </p>
              <p className="text-base font-bold">
                {shift.oee >= PP_OEE.target ? 'On target.' : `${formatNumber(PP_OEE.target - shift.oee, 1)} under target.`} Biggest loss: {shift.lost}
              </p>
            </PpBlock>
          ))}
          <PpBlock invert className="col-span-3 flex-row items-center justify-between gap-6">
            <p className="text-2xl font-extrabold tracking-tighter">The night shift carries most of the trips.</p>
            <p className="max-w-md text-sm font-bold">Two of three compressor trips this month fell between 22:00 and 06:00, when the sea-water cooled loop runs with the least margin.</p>
          </PpBlock>
        </PpMosaic>
      </Canvas>
    </LookScope>
  );
}

const PP_COOLER = PP_LOSSES[2];

function PpPart({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <LookScope look="poster" className={cx('flex flex-col', className)}>
      <Canvas className="flex min-h-0 flex-1 flex-col justify-center">{children}</Canvas>
    </LookScope>
  );
}

function ProductionPerformanceOee() {
  return (
    <PpPart className="h-[380px]">
      <PpMosaic className="flex-1">
        <PpOeeBlock />
      </PpMosaic>
    </PpPart>
  );
}

function ProductionPerformanceFactors() {
  return (
    <PpPart className="h-[380px]">
      <PpMosaic className="flex-1 grid-cols-2 grid-rows-2">
        <PpFactorBlock factor={PP_FACTORS.availability} large className="col-span-2" />
        <PpFactorBlock factor={PP_FACTORS.performance} />
        <PpFactorBlock factor={PP_FACTORS.quality} />
      </PpMosaic>
    </PpPart>
  );
}

function ProductionPerformanceLossBar() {
  const [selected, setSelected] = useState('offspec');
  return (
    <PpPart>
      <PpMosaic>
        <PpLossBlock selected={selected} onSelect={setSelected} />
      </PpMosaic>
    </PpPart>
  );
}

function ProductionPerformanceLossHeadline() {
  return (
    <PpPart className="h-[400px]">
      <PpMosaic className="flex-1">
        <PpLossHeadline loss={PP_COOLER} />
      </PpMosaic>
    </PpPart>
  );
}

function ProductionPerformanceCauses() {
  return (
    <PpPart className="h-[400px]">
      <PpMosaic className="flex-1">
        <PpLossCauses loss={PP_COOLER} />
      </PpMosaic>
    </PpPart>
  );
}

function ProductionPerformanceDays() {
  return (
    <PpPart className="h-[400px]">
      <PpMosaic className="flex-1">
        <PpLossDays loss={PP_COOLER} />
      </PpMosaic>
    </PpPart>
  );
}

export default definePage({
  id: 'production-performance',
  title: 'Production performance',
  summary:
    'OEE for the month as a poster: one enormous figure, the three factors that multiply into it, and a bar of solid blocks that accounts for every lost point. Tap a block and the bottom of the board breaks that loss down.',
  guidance: {
    use: [
      'For the daily production meeting, read from across the table or on a team screen.',
      'Colour each loss by the factor it reduces, so the bar and the factor blocks explain each other.',
      'Blow the lost share up to full width; at true scale the causes would be too thin to read or tap.',
    ],
    avoid: [
      'More than six or seven loss blocks; group the tail.',
      'Grey panels and thin type. In this look a block is either a colour, black or white.',
      'Status tones for categories. Pink here is a family, not an alarm.',
    ],
  },
  source,
  sections: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description: 'Poster look: a mosaic of unequal colour blocks around the OEE figure and the loss bar.',
      specimens: [
        {
          id: 'ProductionPerformanceSignature',
          title: 'OEE board',
          note: 'Pick it when one number leads the meeting and the next question is always where the rest went.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/production-performance/LossBar.tsx', 'kit/Bars.tsx', 'kit/Delta.tsx', 'looks/LookScope.tsx'],
          Component: ProductionPerformanceSignature,
        },
      ],
    },
    {
      id: 'variations',
      title: 'Variations',
      description: 'Other screens of the same product.',
      specimens: [
        {
          id: 'ProductionPerformanceCalendar',
          title: 'Month calendar',
          note: 'Pick it to find the bad days: one block a day, coloured by how close it came to target.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['looks/LookScope.tsx', 'kit/Canvas.tsx'],
          Component: ProductionPerformanceCalendar,
        },
        {
          id: 'ProductionPerformanceShifts',
          title: 'Shift scoreboard',
          note: 'Pick it to compare crews: three blocks ranked by OEE with each shift’s biggest loss.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['looks/LookScope.tsx', 'kit/Canvas.tsx'],
          Component: ProductionPerformanceShifts,
        },
      ],
    },
    {
      id: 'parts',
      title: 'Parts',
      description: 'The blocks of the board on their own.',
      specimens: [
        {
          id: 'ProductionPerformanceOee',
          title: 'OEE block',
          note: 'Use it for the one figure a screen exists for, with its target and change underneath.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Delta.tsx'],
          Component: ProductionPerformanceOee,
        },
        {
          id: 'ProductionPerformanceFactors',
          title: 'Factor blocks',
          note: 'Use them beside a product figure to show what multiplies into it.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          bleed: true,
          Component: ProductionPerformanceFactors,
        },
        {
          id: 'ProductionPerformanceLossBar',
          title: 'Loss bar',
          note: 'Use it to account for a shortfall cause by cause, each block a button.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/production-performance/LossBar.tsx'],
          Component: ProductionPerformanceLossBar,
        },
        {
          id: 'ProductionPerformanceLossHeadline',
          title: 'Loss headline',
          note: 'Use it to open a breakdown: the size of the loss, in points and in volume, and one sentence why.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          bleed: true,
          Component: ProductionPerformanceLossHeadline,
        },
        {
          id: 'ProductionPerformanceCauses',
          title: 'Causes and action',
          note: 'Use it to rank what is behind a loss and to end on the work order that addresses it.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Bars.tsx', 'kit/TagId.tsx'],
          Component: ProductionPerformanceCauses,
        },
        {
          id: 'ProductionPerformanceDays',
          title: 'Day by day',
          note: 'Use it to show whether a loss is a one-off or a trend.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Bars.tsx'],
          Component: ProductionPerformanceDays,
        },
      ],
    },
  ],
});
