import { Button } from '@cognite/aura/components/button';
import {
  SegmentedControl,
  SegmentedControlButton,
  SegmentedControlList,
} from '@cognite/aura/components/segmented-control';
import {
  IconBolt,
  IconBulb,
  IconCloud,
  IconEngine,
  IconFlame,
  IconLeaf,
  IconPlug,
  IconRecycle,
  IconWind,
  IconX,
} from '@cognite/aura/icons';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { Bars } from '../../../library/kit/Bars';
import { Canvas } from '../../../library/kit/Canvas';
import { Delta } from '../../../library/kit/Delta';
import { MixDonut, type MixSegment } from '../../../library/kit/energy-and-emissions-dashboard/MixDonut';
import { IconChip } from '../../../library/kit/IconChip';
import { ListRow } from '../../../library/kit/ListRow';
import { Meter } from '../../../library/kit/Meter';
import { Panel } from '../../../library/kit/Panel';
import { RingGauge } from '../../../library/kit/RingGauge';
import { SparkLine } from '../../../library/kit/SparkLine';
import { StatusPill } from '../../../library/kit/StatusPill';
import { cx, formatNumber, type Tone } from '../../../library/kit/tones';
import { TrendArea } from '../../../library/kit/TrendArea';
import { LookScope } from '../../../library/looks/LookScope';
import { makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './energy-and-emissions-dashboard.tsx?raw';

type EeMode = 'energy' | 'co2';

type EeIdea = { title: string; detail: string; saving: string; status: 'Proposed' | 'In study' | 'Planned' };

type EeView = {
  id: string;
  label: string;
  /** Name on the dock. */
  short: string;
  tone: Tone;
  /** MW, 24-hour average. */
  energy: number;
  /** Tonnes of CO₂ a day. */
  co2: number;
  /** Installed or contracted capacity, MW. */
  capacity: number;
  /** Change on last week, percent. */
  change: number;
  /** What the gauge card measures for this view. */
  gauge: { title: string; value: number; caption: string };
  /** Daily averages for the last seven days, MW. */
  week: readonly number[];
  consumers: readonly { label: string; value: number }[];
  idea: EeIdea;
  seed: number;
};

/** Nordkapp, 24-hour average for Thursday 12 March. 112 MW in, 358 tonnes of CO₂. */
const EE_SOURCES: readonly EeView[] = [
  {
    id: 'gas',
    label: 'Fuel gas turbines',
    short: 'Fuel gas',
    tone: 'amber',
    energy: 58,
    co2: 318,
    capacity: 72,
    change: 2.1,
    gauge: { title: 'Load factor', value: 81, caption: '58 of 72 MW installed' },
    week: [55, 56, 54, 57, 56, 61, 58],
    consumers: [
      { label: 'Gas compression', value: 41 },
      { label: 'Power generation', value: 12 },
      { label: 'Hot oil heater', value: 5 },
    ],
    idea: { title: 'Recover turbine exhaust heat', detail: 'A waste heat unit on the second turbine would retire most heater firing.', saving: '−9 MW · −52 t CO₂ a day', status: 'In study' },
    seed: 401,
  },
  {
    id: 'grid',
    label: 'Grid import, hydro',
    short: 'Grid',
    tone: 'blue',
    energy: 26,
    co2: 6,
    capacity: 40,
    change: -3.4,
    gauge: { title: 'Cable loading', value: 65, caption: '26 of 40 MW contracted' },
    week: [29, 28, 30, 27, 28, 24, 26],
    consumers: [
      { label: 'Export pumps', value: 11 },
      { label: 'Cooling water', value: 8 },
      { label: 'Utilities and buildings', value: 7 },
    ],
    idea: { title: 'Move one compressor to electric drive', detail: 'The spare 14 MW on the cable can carry the recompressor after its overhaul.', saving: '−14 MW of fuel gas · −77 t CO₂ a day', status: 'Proposed' },
    seed: 402,
  },
  {
    id: 'wind',
    label: 'Offshore wind link',
    short: 'Wind',
    tone: 'teal',
    energy: 14,
    co2: 0,
    capacity: 24,
    change: 18.6,
    gauge: { title: 'Capacity factor', value: 58, caption: '14 of 24 MW installed' },
    week: [9, 17, 21, 6, 11, 19, 14],
    consumers: [
      { label: 'Gas compression, electric', value: 8 },
      { label: 'Export pumps', value: 4 },
      { label: 'Battery charging', value: 2 },
    ],
    idea: { title: 'Follow the wind with cooling load', detail: 'Pre-cool the water loop when the turbines produce more than the plant can take.', saving: '−2 MW of grid import at peak', status: 'Planned' },
    seed: 403,
  },
  {
    id: 'heat',
    label: 'Waste heat recovery',
    short: 'Waste heat',
    tone: 'green',
    energy: 8,
    co2: 0,
    capacity: 9,
    change: 0.8,
    gauge: { title: 'Recovery rate', value: 89, caption: '8 of 9 MW recoverable' },
    week: [8, 8, 7, 8, 8, 8, 8],
    consumers: [
      { label: 'Hot oil loop', value: 6 },
      { label: 'Condensate stabiliser', value: 2 },
    ],
    idea: { title: 'Clean the economiser bundle', detail: 'Fouling costs about 1 MW of recovered heat; cleaning fits the April shutdown.', saving: '+1 MW recovered', status: 'Planned' },
    seed: 404,
  },
  {
    id: 'flare',
    label: 'Flared gas',
    short: 'Flare',
    tone: 'pink',
    energy: 4,
    co2: 21,
    capacity: 5,
    change: 34.8,
    gauge: { title: 'Share of flare permit', value: 83, caption: '12.4 of 15 kSm³ a day' },
    week: [2, 2, 3, 2, 2, 3, 4],
    consumers: [
      { label: 'Flash gas since the trip', value: 3 },
      { label: 'Pilots and purge', value: 1 },
    ],
    idea: { title: 'Restart the recompressor', detail: 'Flash gas has gone to flare since the 13:46 trip. Recovering it ends most flaring.', saving: '−3 MW · −16 t CO₂ a day', status: 'Planned' },
    seed: 405,
  },
  {
    id: 'diesel',
    label: 'Diesel backup',
    short: 'Diesel',
    tone: 'purple',
    energy: 2,
    co2: 13,
    capacity: 12,
    change: -41,
    gauge: { title: 'Running hours limit', value: 17, caption: '86 of 500 hours this year' },
    week: [3, 1, 0, 4, 3, 2, 2],
    consumers: [
      { label: 'Emergency switchboard test', value: 1 },
      { label: 'Fire water pumps', value: 1 },
    ],
    idea: { title: 'Test on battery, not diesel', detail: 'The weekly switchboard test can run from the 4 MWh battery instead.', saving: '−1 MW · −6 t CO₂ a day', status: 'Proposed' },
    seed: 406,
  },
];

const EE_TOTAL_ENERGY = EE_SOURCES.reduce((sum, entry) => sum + entry.energy, 0);

const EE_TOTAL_CO2 = EE_SOURCES.reduce((sum, entry) => sum + entry.co2, 0);

const EE_ALL: EeView = {
  id: 'all',
  label: 'All sources',
    short: 'All sources',
  tone: 'accent',
  energy: EE_TOTAL_ENERGY,
  co2: EE_TOTAL_CO2,
  capacity: 162,
  change: 1.2,
  gauge: { title: 'Low-carbon share', value: 43, caption: '48 of 112 MW from hydro, wind and heat' },
  week: [106, 112, 115, 104, 108, 117, 112],
  consumers: [
    { label: 'Gas compression', value: 49 },
    { label: 'Export pumps', value: 15 },
    { label: 'Power generation', value: 12 },
  ],
  idea: { title: 'Electrify the recompressor', detail: 'The largest single cut on the list: the cable has room and the drive is due for overhaul.', saving: '−14 MW of fuel gas · −77 t CO₂ a day', status: 'Proposed' },
  seed: 400,
};

const EE_DAYS = ['Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu'];

const EE_IDEA_TONE: Record<EeIdea['status'], Tone> = { Proposed: 'neutral', 'In study': 'info', Planned: 'success' };

function eeView(id: string | null): EeView {
  return EE_SOURCES.find((entry) => entry.id === id) ?? EE_ALL;
}

function eeSegments(mode: EeMode): MixSegment[] {
  return EE_SOURCES.filter((entry) => (mode === 'energy' ? entry.energy : entry.co2) > 0).map((entry) => ({
    id: entry.id,
    label: entry.label,
    value: mode === 'energy' ? entry.energy : entry.co2,
    tone: entry.tone,
  }));
}

function EeSourceIcon({ id }: { id: string }) {
  if (id === 'gas') return <IconEngine />;
  if (id === 'grid') return <IconPlug />;
  if (id === 'wind') return <IconWind />;
  if (id === 'heat') return <IconRecycle />;
  if (id === 'flare') return <IconFlame />;
  if (id === 'diesel') return <IconCloud />;
  return <IconBolt />;
}

const eeUnit = (mode: EeMode): string => (mode === 'energy' ? 'MW' : 't CO₂/d');

const eeValue = (view: EeView, mode: EeMode): number => (mode === 'energy' ? view.energy : view.co2);

const eeShare = (view: EeView, mode: EeMode): number => Math.round((eeValue(view, mode) / (mode === 'energy' ? EE_TOTAL_ENERGY : EE_TOTAL_CO2)) * 100);

function EeDonut({ mode, selected, onSelect, className }: { mode: EeMode; selected: string | null; onSelect: (id: string | null) => void; className?: string }) {
  const view = eeView(selected);
  return (
    <MixDonut
      className={className}
      label={mode === 'energy' ? 'Energy in by source, 24-hour average' : 'CO₂ emitted by source, tonnes a day'}
      segments={eeSegments(mode)}
      selected={selected}
      onSelect={onSelect}
      unit={eeUnit(mode)}
      thickness={0.32}
    >
      <span data-tone={view.tone} className="flex max-w-[54cqw] flex-col items-center">
        <span className="text-[clamp(0.75rem,3.8cqw,1rem)] font-semibold leading-tight text-[var(--kit-text-2)]">{selected === null ? (mode === 'energy' ? 'Energy in' : 'CO₂ emitted') : view.label}</span>
        <span className="text-[18cqw] font-bold leading-none tracking-tight tabular-nums text-[var(--kit-text)]">{formatNumber(eeValue(view, mode))}</span>
        <span className="mt-[1cqw] text-[clamp(0.75rem,3.8cqw,1rem)] font-semibold leading-tight text-[var(--kit-text-2)]">{mode === 'energy' ? 'MW, 24-hour average' : 'tonnes a day'}</span>
        {selected === null ? null : (
          <span className="mt-[1.5cqw] rounded-full bg-[var(--t-soft)] px-2.5 py-0.5 text-[clamp(0.75rem,3.4cqw,0.875rem)] font-semibold text-[var(--t-on-soft)]">{eeShare(view, mode)} % of the mix</span>
        )}
      </span>
    </MixDonut>
  );
}

function EeFigure({ value, unit, decimals = 0 }: { value: number; unit: string; decimals?: number }) {
  return (
    <p className="text-5xl font-bold leading-none tracking-tight tabular-nums text-[var(--kit-text)]">
      {formatNumber(value, decimals)} <span className="text-base font-semibold text-[var(--kit-text-2)]">{unit}</span>
    </p>
  );
}

/** A satellite keeps its own family while the whole is shown, and takes the source's once one is picked. */
const eeTone = (view: EeView, own: Tone): Tone => (view.id === 'all' ? own : view.tone);

function EeOutputCard({ view, mode, className }: { view: EeView; mode: EeMode; className?: string }) {
  const values = makeValues({ seed: view.seed, points: 24, base: eeValue(view, mode), amplitude: eeValue(view, mode) * 0.06, noise: eeValue(view, mode) * 0.03, cycles: 1.5, min: 0, decimals: 1 });
  return (
    <Panel className={className} tone={eeTone(view, 'amber')} title={mode === 'energy' ? 'Output now' : 'Emitting now'}>
      <div className="flex flex-1 flex-col justify-between gap-2">
        <EeFigure value={eeValue(view, mode)} unit={eeUnit(mode)} />
        <div className="flex items-center gap-2 text-sm text-[var(--kit-text-2)]">
          <Delta value={view.change} unit="%" good={view.id === 'wind' || view.id === 'heat' ? 'up' : 'down'} />
          on last week
        </div>
        <SparkLine values={values} label={`${view.label} over the last 24 hours`} tone={eeTone(view, 'amber')} className="h-10 w-full" />
      </div>
    </Panel>
  );
}

function EeGaugeCard({ view, className }: { view: EeView; className?: string }) {
  return (
    <Panel className={className} tone={eeTone(view, 'teal')} title={view.gauge.title}>
      <div className="flex flex-1 items-center gap-5">
        <RingGauge label={`${view.label}: ${view.gauge.title}`} value={view.gauge.value} size={100} tone={eeTone(view, 'teal')} hideLabel className="shrink-0" />
        <p className="min-w-0 text-sm font-medium text-[var(--kit-text-2)]">{view.gauge.caption}</p>
      </div>
    </Panel>
  );
}

function EeConsumersCard({ view, className }: { view: EeView; className?: string }) {
  const top = Math.max(...view.consumers.map((consumer) => consumer.value));
  return (
    <Panel className={className} tone={eeTone(view, 'blue')} title="Where it goes">
      <div className="flex flex-1 flex-col justify-between gap-2">
        {view.consumers.map((consumer) => (
          <Meter key={consumer.label} label={consumer.label} value={consumer.value} max={top} unit="MW" tone={eeTone(view, 'blue')} hideScale />
        ))}
      </div>
    </Panel>
  );
}

function EeOtherCard({ view, mode, className }: { view: EeView; mode: EeMode; className?: string }) {
  const intensity = view.energy === 0 ? 0 : (view.co2 * 1000) / (view.energy * 24);
  return (
    <Panel className={className} tone={eeTone(view, 'pink')} title={mode === 'energy' ? 'Carbon' : 'Energy'}>
      <div className="flex flex-1 flex-col justify-between gap-2">
        <EeFigure value={mode === 'energy' ? view.co2 : view.energy} unit={eeUnit(mode === 'energy' ? 'co2' : 'energy')} />
        <p className="text-sm font-medium text-[var(--kit-text-2)]">
          {view.co2 === 0 ? 'No direct emissions from this source.' : `${formatNumber(intensity)} kg CO₂ for every MWh it delivers.`}
        </p>
        <StatusPill tone={view.co2 === 0 ? 'success' : view.id === 'all' || intensity > 200 ? 'warning' : 'neutral'} icon={view.co2 === 0 ? <IconLeaf /> : undefined} className="self-start">
          {view.co2 === 0 ? 'Carbon free' : view.id === 'all' ? '51 t over the daily budget' : `${Math.round((view.co2 / EE_TOTAL_CO2) * 100)} % of site CO₂`}
        </StatusPill>
      </div>
    </Panel>
  );
}

function EeWeekCard({ view, className }: { view: EeView; className?: string }) {
  const low = Math.min(...view.week);
  const high = Math.max(...view.week);
  return (
    <Panel className={className} tone={eeTone(view, 'purple')} title="Seven days">
      <div className="flex flex-1 flex-col justify-between gap-2">
        <SparkLine values={view.week} label={`${view.label}, daily average for the last seven days`} tone={eeTone(view, 'purple')} variant="bars" className="h-16 w-full" />
        <div className="flex justify-between text-xs font-medium text-[var(--kit-text-2)]">
          {EE_DAYS.map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>
        <p className="text-sm font-medium text-[var(--kit-text-2)]">
          Between {low} and {high} MW a day.
        </p>
      </div>
    </Panel>
  );
}

function EeIdeaCard({ view, className }: { view: EeView; className?: string }) {
  return (
    <Panel className={className} tone={eeTone(view, 'green')} title="Best idea" actions={<StatusPill tone={EE_IDEA_TONE[view.idea.status]}>{view.idea.status}</StatusPill>}>
      <div className="flex flex-1 flex-col justify-between gap-2">
        <div>
          <p className="text-base font-bold text-[var(--kit-text)]">{view.idea.title}</p>
          <p className="mt-1 text-sm text-[var(--kit-text-2)]">{view.idea.detail}</p>
        </div>
        <p className="flex items-center gap-2 text-sm font-bold text-[var(--kit-text)] [&>svg]:size-4">
          <IconBulb aria-hidden="true" />
          {view.idea.saving}
        </p>
      </div>
    </Panel>
  );
}

function EeToolbar({ mode, onMode }: { mode: EeMode; onMode: (mode: EeMode) => void }) {
  return (
    <div className="flex items-center gap-4 self-center rounded-full bg-[var(--kit-surface)] py-2 pl-2 pr-5 shadow-lg">
      <IconChip tone="accent" size="sm">
        <IconBolt />
      </IconChip>
      <span className="whitespace-nowrap text-base font-bold text-[var(--kit-text)]">Nordkapp energy</span>
      <SegmentedControl value={mode} onValueChange={(next) => onMode(next === 'co2' ? 'co2' : 'energy')}>
        <SegmentedControlList size="small" aria-label="Measure">
          <SegmentedControlButton value="energy">Energy</SegmentedControlButton>
          <SegmentedControlButton value="co2">CO₂</SegmentedControlButton>
        </SegmentedControlList>
      </SegmentedControl>
      <span className="whitespace-nowrap text-sm font-medium text-[var(--kit-text-2)]">Thu 12 March</span>
    </div>
  );
}

function EeDock({ mode, selected, onSelect }: { mode: EeMode; selected: string | null; onSelect: (id: string | null) => void }) {
  return (
    <div role="group" aria-label="Source" className="flex flex-wrap items-center justify-center gap-2">
      {[EE_ALL, ...EE_SOURCES].map((entry) => {
        const id = entry.id === 'all' ? null : entry.id;
        const active = selected === id;
        return (
          <button
            key={entry.id}
            type="button"
            data-tone={entry.tone}
            aria-pressed={active}
            onClick={() => onSelect(id)}
            className={cx(
              'flex h-10 cursor-pointer items-center gap-2 rounded-full pl-2.5 pr-4 text-sm font-semibold outline-none transition-colors focus-visible:[box-shadow:var(--shadow-focus-ring)]',
              active ? 'bg-[var(--t-solid)] text-[var(--t-on-solid)] shadow-md' : 'bg-[var(--kit-surface)] text-[var(--kit-text)] hover:bg-[var(--t-soft)]'
            )}
          >
            <span className={cx('size-3 rounded-full', active ? 'bg-current' : 'bg-[var(--t-line)]')} />
            {entry.short}
            <span className={cx('tabular-nums', active ? '' : 'text-[var(--kit-text-2)]')}>{formatNumber(eeValue(entry, mode))}</span>
          </button>
        );
      })}
    </div>
  );
}

function EeOrbit() {
  const [mode, setMode] = useState<EeMode>('energy');
  const [selected, setSelected] = useState<string | null>(null);
  const view = eeView(selected);
  const pick = (id: string | null) => setSelected(id !== null && eeSegments(mode).some((segment) => segment.id === id) ? id : null);
  const switchMode = (next: EeMode) => {
    setMode(next);
    if (selected !== null && !eeSegments(next).some((segment) => segment.id === selected)) setSelected(null);
  };

  return (
    <LookScope look="soft">
      <Canvas className="flex h-[900px] flex-col gap-5">
        <EeToolbar mode={mode} onMode={switchMode} />
        <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_minmax(0,1fr)] gap-5">
          <div className="grid min-h-0 grid-rows-3 gap-5">
            <EeOutputCard view={view} mode={mode} className="ml-6" />
            <EeGaugeCard view={view} className="mr-6" />
            <EeConsumersCard view={view} className="ml-6" />
          </div>
          <div className="flex min-w-0 items-center justify-center">
            <EeDonut mode={mode} selected={selected} onSelect={pick} className="w-full max-w-[430px]" />
          </div>
          <div className="grid min-h-0 grid-rows-3 gap-5">
            <EeOtherCard view={view} mode={mode} className="mr-6" />
            <EeWeekCard view={view} className="ml-6" />
            <EeIdeaCard view={view} className="mr-6" />
          </div>
        </div>
        <EeDock mode={mode} selected={selected} onSelect={pick} />
      </Canvas>
    </LookScope>
  );
}

function EnergyAndEmissionsDashboardSignature() {
  return <EeOrbit />;
}

const EE_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Cumulative CO₂ this year in kilotonnes, to 12 March, then the forecast at today's rate. */
const EE_YEAR_ACTUAL = [0, 11.4, 21.6, 26.1];

const EE_YEAR_LABELS = ['1 Jan', '1 Feb', '1 Mar', '12 Mar', '1 Apr', '1 May', '1 Jun', '1 Jul', '1 Aug', '1 Sep', '1 Oct', '1 Nov', '31 Dec'];

const EE_YEAR_FORECAST = [0, 11.4, 21.6, 26.1, 32.9, 43.6, 54.7, 65.4, 76.5, 87.6, 98.3, 109.4, 120.1];

/** The permit of 112 kt spread evenly over the year, at the same dates. */
const EE_YEAR_BUDGET = [0, 9.3, 18.7, 22.1, 28, 37.3, 46.7, 56, 65.3, 74.7, 84, 93.3, 112];

const EE_MONTH_SOURCES = [
  { id: 'gas', label: 'Fuel gas turbines', tone: 'amber', values: [9.9, 8.9, 3.9] },
  { id: 'flare', label: 'Flared gas', tone: 'pink', values: [0.9, 0.7, 0.4] },
  { id: 'other', label: 'Diesel and grid', tone: 'purple', values: [0.6, 0.6, 0.2] },
] as const;

function EnergyAndEmissionsDashboardPermit() {
  const [scope, setScope] = useState('year');
  const year = scope === 'year';
  return (
    <LookScope look="soft">
      <Canvas className="flex flex-col gap-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-[var(--kit-text)]">The permit lasts until late November</h2>
            <p className="mt-1 text-base text-[var(--kit-text-2)]">At today’s rate Nordkapp emits 120 kt of CO₂ this year against a permit of 112 kt.</p>
          </div>
          <SegmentedControl value={scope} onValueChange={(next) => setScope(String(next))}>
            <SegmentedControlList size="small" aria-label="Period">
              <SegmentedControlButton value="year">Whole year</SegmentedControlButton>
              <SegmentedControlButton value="date">To date</SegmentedControlButton>
            </SegmentedControlList>
          </SegmentedControl>
        </div>
        <div className="grid grid-cols-12 gap-5">
          <Panel className="col-span-4" tone="amber" title="Permit used">
            <div className="flex flex-1 flex-col items-center justify-center gap-4">
              <RingGauge label="Share of the annual CO₂ permit used" value={23} size={208} tone="amber" hideLabel />
              <p className="text-center text-sm font-medium text-[var(--kit-text-2)]">
                26.1 of 112 kt used with 19 % of the year gone.
                <strong className="block text-base font-bold text-[var(--kit-text)]">4 points ahead of budget</strong>
              </p>
            </div>
          </Panel>
          <Panel className="col-span-8" title={year ? 'Cumulative CO₂, forecast to December' : 'Cumulative CO₂ to 12 March'} subtitle="Kilotonnes against an even budget">
            <TrendArea
              label="Cumulative CO₂ emissions this year against the permit budget"
              labels={year ? EE_YEAR_LABELS : EE_YEAR_LABELS.slice(0, 4)}
              unit="kt"
              decimals={1}
              height={270}
              series={[
                { id: 'actual', label: year ? 'Actual and forecast' : 'Actual', values: year ? EE_YEAR_FORECAST : EE_YEAR_ACTUAL, tone: 'amber' },
                { id: 'budget', label: 'Even budget', values: year ? EE_YEAR_BUDGET : EE_YEAR_BUDGET.slice(0, 4), tone: 'neutral', dashed: true },
              ]}
              limits={year ? [{ value: 112, label: 'Permit', tone: 'critical' }] : []}
            />
          </Panel>
          <Panel className="col-span-7" tone="pink" title="This year by source" subtitle="Kilotonnes of CO₂ a month">
            <Bars
              label="CO₂ emitted per month this year, by source"
              categories={EE_MONTHS.slice(0, 3)}
              series={EE_MONTH_SOURCES.map((entry) => ({ id: entry.id, label: entry.label, values: entry.values, tone: entry.tone }))}
              stacked
              decimals={1}
              unit="kt"
              height={200}
            />
          </Panel>
          <Panel className="col-span-5" tone="green" title="What closes the gap" subtitle="8 kt to find before December">
            <ul className="flex flex-1 flex-col justify-between">
              {[EE_SOURCES[1], EE_SOURCES[0], EE_SOURCES[4]].map((entry) => (
                <ListRow
                  key={entry.id}
                  leading={
                    <IconChip tone={entry.tone} size="sm">
                      <EeSourceIcon id={entry.id} />
                    </IconChip>
                  }
                  title={entry.idea.title}
                  meta={entry.idea.saving}
                  trailing={<StatusPill tone={EE_IDEA_TONE[entry.idea.status]}>{entry.idea.status}</StatusPill>}
                />
              ))}
            </ul>
          </Panel>
        </div>
      </Canvas>
    </LookScope>
  );
}

function EnergyAndEmissionsDashboardPhone() {
  const [selected, setSelected] = useState<string | null>('wind');
  const view = eeView(selected);
  return (
    <LookScope look="soft">
      <Canvas className="flex justify-center">
        <div className="flex w-full max-w-[390px] flex-col gap-4 rounded-[40px] bg-[var(--kit-surface)] p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--kit-text-2)]">Thu 12 March</p>
              <h2 className="text-2xl font-bold tracking-tight text-[var(--kit-text)]">Energy mix</h2>
            </div>
            {selected === null ? null : (
              <Button variant="outline" size="sm" onClick={() => setSelected(null)}>
                <IconX /> All sources
              </Button>
            )}
          </div>
          <EeDonut mode="energy" selected={selected} onSelect={setSelected} className="mx-auto w-full max-w-[300px]" />
          <EeGaugeCard view={view} />
          <ul className="flex flex-col gap-2">
            {EE_SOURCES.slice(0, 4).map((entry) => (
              <li key={entry.id}>
                <button
                  type="button"
                  data-tone={entry.tone}
                  aria-pressed={selected === entry.id}
                  onClick={() => setSelected(selected === entry.id ? null : entry.id)}
                  className={cx(
                    'flex w-full cursor-pointer items-center gap-3 rounded-3xl p-3 text-left outline-none focus-visible:[box-shadow:var(--shadow-focus-ring)]',
                    selected === entry.id ? 'bg-[var(--t-soft)]' : 'bg-[var(--kit-well)]'
                  )}
                >
                  <IconChip tone={entry.tone} size="sm">
                    <EeSourceIcon id={entry.id} />
                  </IconChip>
                  <span className="flex-1 text-sm font-semibold text-[var(--kit-text)]">{entry.label}</span>
                  <span className="text-base font-bold tabular-nums text-[var(--kit-text)]">{entry.energy} MW</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </Canvas>
    </LookScope>
  );
}

function EePart({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <LookScope look="soft" className={cx('flex flex-col', className)}>
      <Canvas className="flex min-h-0 flex-1 flex-col justify-center gap-5">{children}</Canvas>
    </LookScope>
  );
}

function EnergyAndEmissionsDashboardDonut() {
  const [selected, setSelected] = useState<string | null>('grid');
  return (
    <EePart className="h-[500px]">
      <EeDonut mode="energy" selected={selected} onSelect={setSelected} className="mx-auto w-full max-w-[400px]" />
    </EePart>
  );
}

function EnergyAndEmissionsDashboardControls() {
  const [mode, setMode] = useState<EeMode>('co2');
  const [selected, setSelected] = useState<string | null>('gas');
  return (
    <EePart className="h-[500px]">
      <EeToolbar mode={mode} onMode={setMode} />
      <EeDonut mode={mode} selected={selected} onSelect={setSelected} className="mx-auto w-full max-w-[250px]" />
      <EeDock mode={mode} selected={selected} onSelect={setSelected} />
    </EePart>
  );
}

function EnergyAndEmissionsDashboardOutput() {
  return (
    <EePart className="h-[310px]">
      <EeOutputCard view={EE_SOURCES[0]} mode="energy" />
    </EePart>
  );
}

function EnergyAndEmissionsDashboardGauge() {
  return (
    <EePart className="h-[310px]">
      <EeGaugeCard view={EE_SOURCES[2]} />
    </EePart>
  );
}

function EnergyAndEmissionsDashboardConsumers() {
  return (
    <EePart className="h-[310px]">
      <EeConsumersCard view={EE_SOURCES[1]} />
    </EePart>
  );
}

function EnergyAndEmissionsDashboardCarbon() {
  return (
    <EePart className="h-[310px]">
      <EeOtherCard view={EE_SOURCES[4]} mode="energy" />
    </EePart>
  );
}

function EnergyAndEmissionsDashboardWeek() {
  return (
    <EePart className="h-[310px]">
      <EeWeekCard view={EE_SOURCES[2]} />
    </EePart>
  );
}

function EnergyAndEmissionsDashboardIdea() {
  return (
    <EePart className="h-[310px]">
      <EeIdeaCard view={EE_SOURCES[3]} />
    </EePart>
  );
}

export default definePage({
  id: 'energy-and-emissions-dashboard',
  title: 'Energy and emissions',
  summary:
    'Where the plant’s energy comes from and what it emits. A large mix donut holds the total; pick a slice and the six cards around it answer for that source: output, loading, where it goes, carbon, the week and the best idea to cut it.',
  guidance: {
    use: [
      'When a handful of sources or categories make up one total and each deserves the same set of answers.',
      'Keep the satellites’ roles fixed and let the selection change their content, so the eye learns where to look.',
      'Offer the same picture in energy and in CO₂; the shares differ and that is the insight.',
    ],
    avoid: [
      'More than about seven slices; group the tail.',
      'A legend far from the ring. The dock under it is the legend and the selector at once.',
      'Status colour for categories: sources get decorative families, judgements get status tones.',
    ],
  },
  source,
  sections: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description: 'Soft look: the energy-mix donut in the centre with satellite cards around it.',
      specimens: [
        {
          id: 'EnergyAndEmissionsDashboardSignature',
          title: 'Energy mix orbit',
          note: 'Pick it for an energy or sustainability lead who explores one total by its parts.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/energy-and-emissions-dashboard/MixDonut.tsx', 'kit/Panel.tsx', 'kit/RingGauge.tsx', 'kit/Meter.tsx', 'kit/SparkLine.tsx', 'looks/LookScope.tsx'],
          Component: EnergyAndEmissionsDashboardSignature,
        },
      ],
    },
    {
      id: 'variations',
      title: 'Variations',
      description: 'Other screens of the same product.',
      specimens: [
        {
          id: 'EnergyAndEmissionsDashboardPermit',
          title: 'Permit year',
          note: 'Pick it for the emissions review: how much of the annual permit is used and what closes the gap.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/TrendArea.tsx', 'kit/Bars.tsx', 'kit/RingGauge.tsx', 'kit/ListRow.tsx'],
          Component: EnergyAndEmissionsDashboardPermit,
        },
        {
          id: 'EnergyAndEmissionsDashboardPhone',
          title: 'Phone',
          note: 'Pick it for a quick look on a phone: the donut, one gauge and the sources as a list.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/energy-and-emissions-dashboard/MixDonut.tsx', 'kit/IconChip.tsx'],
          Component: EnergyAndEmissionsDashboardPhone,
        },
      ],
    },
    {
      id: 'parts',
      title: 'Parts',
      description: 'The donut, its controls and the six satellites on their own.',
      specimens: [
        {
          id: 'EnergyAndEmissionsDashboardDonut',
          title: 'Mix donut',
          note: 'Use it when the parts of a total should be picked directly on the chart.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          bleed: true,
          uses: ['kit/energy-and-emissions-dashboard/MixDonut.tsx'],
          Component: EnergyAndEmissionsDashboardDonut,
        },
        {
          id: 'EnergyAndEmissionsDashboardControls',
          title: 'Toolbar and dock',
          note: 'Use the floating toolbar for the measure and the dock as legend and selector in one.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          bleed: true,
          uses: ['kit/energy-and-emissions-dashboard/MixDonut.tsx', 'kit/IconChip.tsx'],
          Component: EnergyAndEmissionsDashboardControls,
        },
        {
          id: 'EnergyAndEmissionsDashboardOutput',
          title: 'Output card',
          note: 'Use it for the headline figure of the selection with its change and 24-hour shape.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Panel.tsx', 'kit/Delta.tsx', 'kit/SparkLine.tsx'],
          Component: EnergyAndEmissionsDashboardOutput,
        },
        {
          id: 'EnergyAndEmissionsDashboardGauge',
          title: 'Gauge card',
          note: 'Use it for a share of a capacity or limit, with the two figures written out.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          bleed: true,
          uses: ['kit/RingGauge.tsx'],
          Component: EnergyAndEmissionsDashboardGauge,
        },
        {
          id: 'EnergyAndEmissionsDashboardConsumers',
          title: 'Consumers card',
          note: 'Use it to rank the few largest users of the selected source.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Meter.tsx'],
          Component: EnergyAndEmissionsDashboardConsumers,
        },
        {
          id: 'EnergyAndEmissionsDashboardCarbon',
          title: 'Carbon card',
          note: 'Use it to put the other measure next to the headline: carbon beside energy, or the reverse.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          bleed: true,
          uses: ['kit/StatusPill.tsx'],
          Component: EnergyAndEmissionsDashboardCarbon,
        },
        {
          id: 'EnergyAndEmissionsDashboardWeek',
          title: 'Week card',
          note: 'Use it for a short history where the shape matters more than exact values.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          bleed: true,
          uses: ['kit/SparkLine.tsx'],
          Component: EnergyAndEmissionsDashboardWeek,
        },
        {
          id: 'EnergyAndEmissionsDashboardIdea',
          title: 'Idea card',
          note: 'Use it to end on an action: the best saving for the selection and how far it has come.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Panel.tsx', 'kit/StatusPill.tsx'],
          Component: EnergyAndEmissionsDashboardIdea,
        },
      ],
    },
  ],
});
