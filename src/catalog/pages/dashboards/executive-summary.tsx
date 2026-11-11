import { Button } from '@cognite/aura/components/button';
import { IconChevronLeft, IconChevronRight } from '@cognite/aura/icons';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { Canvas } from '../../../library/kit/Canvas';
import { DataTable, type DataTableColumn } from '../../../library/kit/DataTable';
import { Delta } from '../../../library/kit/Delta';
import { annotationNumbers, type YearPoint } from '../../../library/kit/executive-summary/annotations';
import { YearChart } from '../../../library/kit/executive-summary/YearChart';
import { StatusPill } from '../../../library/kit/StatusPill';
import { cx, formatNumber } from '../../../library/kit/tones';
import { LookScope } from '../../../library/looks/LookScope';
import { PLANT_KPIS } from '../../data/plant';
import { definePage } from '../../types';

import source from './executive-summary.tsx?raw';

type EsPoint = { lead: string; text: string };

type EsMonth = {
  id: string;
  /** "March 2026". */
  name: string;
  short: string;
  /** Average gas export for the month, MSm³/d. */
  average: number;
  availability: number;
  /** kWh per barrel of oil equivalent. */
  energy: number;
  /** Days since the last recordable incident, at month end. */
  safeDays: number;
  headline: string;
  lede: string;
  /** What the numbered mark on the chart stands for, when the month has one. */
  event?: string;
  well: EsPoint;
  notWell: EsPoint;
  next: EsPoint;
  losses: readonly { cause: string; volume: number }[];
  outlook: string;
};

const ES_PLAN = PLANT_KPIS.gasExport.target;

const ES_MONTHS: readonly EsMonth[] = [
  {
    id: '2025-04',
    name: 'April 2025',
    short: 'Apr',
    average: 4.46,
    availability: 97.2,
    energy: 30.8,
    safeDays: 12,
    headline: 'A steady month, one per cent under plan, with the spring inspections done on time.',
    lede: 'April held close to plan on all but four days. A first-aid case on the 18th reset the incident counter, and the lessons from it changed how the lifting plan is signed off.',
    well: { lead: 'Inspections closed early.', text: 'All 14 pressure vessel inspections were finished two days ahead of the permit date.' },
    notWell: { lead: 'A hand injury during a lift.', text: 'First aid only, but the lifting plan had not been reviewed after a scope change.' },
    next: { lead: 'Prepare the June turnaround.', text: 'Long-lead parts for the 2nd stage compressor arrive in May.' },
    losses: [
      { cause: 'Planned inspections', volume: 0.7 },
      { cause: 'Low inlet pressure', volume: 0.4 },
      { cause: 'Other, under 0.2 each', volume: 0.2 },
    ],
    outlook: 'May is planned at 4.50 with no outages. The turnaround team mobilises in the last week.',
  },
  {
    id: '2025-05',
    name: 'May 2025',
    short: 'May',
    average: 4.52,
    availability: 98.1,
    energy: 30.2,
    safeDays: 43,
    headline: 'Export beat plan for the first time this year, on the best availability since start-up.',
    lede: 'Nothing tripped in May. The plant delivered 0.6 MSm³ more than planned and used the calm weeks to stage every turnaround job that could be done on the run.',
    well: { lead: 'No unplanned stops.', text: 'All three compressors ran the full month.' },
    notWell: { lead: 'Turnaround scope grew by 11 %.', text: 'Late findings on the export header added four days of welding.' },
    next: { lead: 'Shut down on 9 June.', text: 'Nine days planned, with the cooler bundle as the critical path.' },
    losses: [
      { cause: 'Low inlet pressure', volume: 0.3 },
      { cause: 'Valve stroke tests', volume: 0.2 },
      { cause: 'Other, under 0.2 each', volume: 0.1 },
    ],
    outlook: 'June carries the turnaround: nine days at zero export, planned at 3.15 for the month on a calendar basis.',
  },
  {
    id: '2025-06',
    name: 'June 2025',
    short: 'Jun',
    average: 4.12,
    availability: 71.4,
    energy: 33.9,
    safeDays: 73,
    headline: 'The turnaround finished a day late; the rest of the month ran above plan.',
    lede: 'Nine planned days became ten when a flange on the export header failed its leak test. Outside the outage the plant averaged 4.56, and all 212 turnaround jobs were closed without an injury.',
    event: 'Planned turnaround, ten days without export.',
    well: { lead: '212 jobs, no injuries.', text: 'The largest work scope since commissioning was completed with 140 contractors on site.' },
    notWell: { lead: 'One day lost to a leak test.', text: 'The flange was re-made; the gasket batch has been quarantined.' },
    next: { lead: 'Prove the new cooler bundle.', text: 'Performance test in the first warm week of July.' },
    losses: [
      { cause: 'Planned turnaround', volume: 9.8 },
      { cause: 'Leak test repeat', volume: 1.1 },
      { cause: 'Start-up losses', volume: 0.5 },
    ],
    outlook: 'July returns to 4.50. The summer sea temperature will be the first real test of the new cooler bundle.',
  },
  {
    id: '2025-07',
    name: 'July 2025',
    short: 'Jul',
    average: 4.49,
    availability: 97.6,
    energy: 30.6,
    safeDays: 104,
    headline: 'Back at plan after the turnaround, with the new cooler bundle holding through a warm month.',
    lede: 'July was the proof the turnaround worked. Discharge temperatures stayed eight degrees under last summer’s, and the only shortfall came from two days of low nominations.',
    well: { lead: 'The cooler passed its test.', text: 'Approach temperature of 4 °C at 14 °C sea water, better than design.' },
    notWell: { lead: 'Two days of low nominations.', text: 'Upstream maintenance was announced with one day’s notice.' },
    next: { lead: 'Agree a nomination notice period.', text: 'Seven days proposed to the upstream operator.' },
    losses: [
      { cause: 'Low nominations', volume: 0.5 },
      { cause: 'Low inlet pressure', volume: 0.3 },
      { cause: 'Other, under 0.2 each', volume: 0.2 },
    ],
    outlook: 'August is planned at 4.50 with full staffing and no outages.',
  },
  {
    id: '2025-08',
    name: 'August 2025',
    short: 'Aug',
    average: 4.55,
    availability: 98.4,
    energy: 30.1,
    safeDays: 135,
    headline: 'The best month of the year: one per cent over plan and the lowest energy use on record.',
    lede: 'August set three records at once: export, availability and energy intensity. The debottlenecked cooler let the compressors run at nameplate through the warmest weeks.',
    well: { lead: 'Record energy intensity.', text: '30.1 kWh/boe, within a tenth of the 30.0 target.' },
    notWell: { lead: 'Backlog crept to 26.', text: 'Holiday cover left preventive work behind for the second month.' },
    next: { lead: 'Storm season readiness.', text: 'Export line inspection and methanol stock check before October.' },
    losses: [
      { cause: 'Low inlet pressure', volume: 0.3 },
      { cause: 'Instrument faults', volume: 0.2 },
      { cause: 'Other, under 0.2 each', volume: 0.1 },
    ],
    outlook: 'September is planned at 4.50. The first autumn storms usually arrive in the second half.',
  },
  {
    id: '2025-09',
    name: 'September 2025',
    short: 'Sep',
    average: 4.43,
    availability: 96.5,
    energy: 30.9,
    safeDays: 165,
    headline: 'Storm Aina cost three days of export; the plant itself did not miss a beat.',
    lede: 'Export was restricted from the 19th to the 21st while the receiving terminal was evacuated. Nordkapp stayed warm and returned to plan within four hours of the terminal reopening.',
    event: 'Storm Aina closes the receiving terminal for three days.',
    well: { lead: 'A four-hour restart.', text: 'The hot standby procedure written after last winter worked first time.' },
    notWell: { lead: '2.1 MSm³ lost to the storm.', text: 'No line pack was available because the buffer was already full.' },
    next: { lead: 'Keep 10 % line pack in storm season.', text: 'New operating rule from 1 October.' },
    losses: [
      { cause: 'Terminal closed by storm', volume: 2.1 },
      { cause: 'Low inlet pressure', volume: 0.4 },
      { cause: 'Other, under 0.2 each', volume: 0.2 },
    ],
    outlook: 'October is planned at 4.50. Two more named storms are forecast; the line pack rule is now in force.',
  },
  {
    id: '2025-10',
    name: 'October 2025',
    short: 'Oct',
    average: 4.51,
    availability: 97.9,
    energy: 30.5,
    safeDays: 196,
    headline: 'On plan through two storms, thanks to the line pack kept in reserve.',
    lede: 'The rule introduced after Storm Aina paid for itself twice. Both October storms were ridden out on stored gas, and export finished a fraction over plan.',
    well: { lead: 'Line pack covered both storms.', text: 'Eleven hours of terminal restrictions with no loss of export.' },
    notWell: { lead: 'A turbine start failed twice.', text: 'A sticking fuel valve was replaced; the root cause report is due.' },
    next: { lead: 'Winterise the export line.', text: 'Heat tracing checks and methanol pump overhaul in November.' },
    losses: [
      { cause: 'Turbine failed starts', volume: 0.4 },
      { cause: 'Low inlet pressure', volume: 0.3 },
      { cause: 'Other, under 0.2 each', volume: 0.2 },
    ],
    outlook: 'November is planned at 4.50 with the methanol pump overhaul taking one train down for a day.',
  },
  {
    id: '2025-11',
    name: 'November 2025',
    short: 'Nov',
    average: 4.47,
    availability: 97.3,
    energy: 31.1,
    safeDays: 21,
    headline: 'A quiet month just under plan, with winter preparations finished before the first frost.',
    lede: 'November lost a day to the planned methanol pump overhaul and little else. A dropped object on the 9th, with nobody nearby, reset the incident counter for the last time this year.',
    well: { lead: 'Winter readiness closed.', text: 'All 38 checks signed off by the 24th.' },
    notWell: { lead: 'A dropped object from scaffolding.', text: 'No injury. Tool lanyards are now mandatory above two metres.' },
    next: { lead: 'Watch the dew point margin.', text: 'Sea temperature is forecast to reach 3 °C in mid-December.' },
    losses: [
      { cause: 'Methanol pump overhaul', volume: 0.6 },
      { cause: 'Low inlet pressure', volume: 0.3 },
      { cause: 'Other, under 0.2 each', volume: 0.2 },
    ],
    outlook: 'December is planned at 4.50. The export line has little margin if the sea is colder than forecast.',
  },
  {
    id: '2025-12',
    name: 'December 2025',
    short: 'Dec',
    average: 4.41,
    availability: 96.1,
    energy: 31.6,
    safeDays: 52,
    headline: 'Export ended two per cent under plan after a cold week put hydrates in the export line.',
    lede: 'The plant ran at plan for twenty-five of thirty-one days. Six days of restricted export in the middle of the month account for almost all of the shortfall, and the methanol dosing that cleared the line is now a standing winter procedure.',
    event: 'Hydrates restrict the export line for six days.',
    well: { lead: 'Compression ran all month.', text: 'No unplanned stops on any of the three compressors.' },
    notWell: { lead: 'Hydrates cost 2.9 MSm³.', text: 'The dew point margin was known to be thin and was not acted on.' },
    next: { lead: 'Make winter dosing standard.', text: 'Procedure update due 15 January.' },
    losses: [
      { cause: 'Hydrates in the export line', volume: 2.9 },
      { cause: 'Planned maintenance', volume: 1.2 },
      { cause: 'Gas turbine trip on power dip', volume: 0.9 },
    ],
    outlook: 'January is planned at 4.50 with no major maintenance. Weather is the main risk until the sea warms in March.',
  },
  {
    id: '2026-01',
    name: 'January 2026',
    short: 'Jan',
    average: 4.53,
    availability: 98.2,
    energy: 30.4,
    safeDays: 83,
    headline: 'Export finished one per cent over plan in a month without a single unplanned compressor stop.',
    lede: 'January was the steadiest month since start-up. The winter methanol procedure held the export line open through the coldest week, and the only loss of note was an export pump trip during the storm on the 22nd.',
    well: { lead: 'The winter procedure held.', text: 'Full rate through a week of 2 °C sea water.' },
    notWell: { lead: 'Export pump A tripped in the storm.', text: 'Pump B took over after forty minutes; the changeover should take five.' },
    next: { lead: 'Test the standby pump monthly.', text: 'The start test had lapsed since November.' },
    losses: [
      { cause: 'Planned maintenance', volume: 0.8 },
      { cause: 'Export pump A trip', volume: 0.6 },
      { cause: 'Low inlet pressure', volume: 0.4 },
    ],
    outlook: 'February is planned at 4.50. The interstage cooler shows the first signs of fouling since the turnaround.',
  },
  {
    id: '2026-02',
    name: 'February 2026',
    short: 'Feb',
    average: 4.36,
    availability: 96.9,
    energy: 31.9,
    safeDays: 111,
    headline: 'A fouled interstage cooler held the plant three per cent under plan for most of the month.',
    lede: 'From the 6th the compressors were limited by discharge temperature every afternoon. The loss was small each day and large in total: 4.1 MSm³, three times everything else combined.',
    event: 'Interstage cooler fouling caps the rate.',
    well: { lead: 'Found early by the trend.', text: 'The approach temperature alert flagged the fouling eleven days before the first alarm.' },
    notWell: { lead: 'No window to clean it.', text: 'The spare bundle was in the workshop and the cleaning crew booked elsewhere.' },
    next: { lead: 'Clean the bundle in March.', text: 'Work order raised; a two-day window is being agreed with the buyer.' },
    losses: [
      { cause: 'Interstage cooler fouling', volume: 4.1 },
      { cause: 'Planned maintenance', volume: 1.1 },
      { cause: 'Export pump A trip', volume: 0.7 },
    ],
    outlook: 'March is planned at 4.50, but the cooler will keep costing about 0.1 a day until it is cleaned.',
  },
  {
    id: '2026-03',
    name: 'March 2026',
    short: 'Mar',
    average: 4.34,
    availability: PLANT_KPIS.availability.value,
    energy: PLANT_KPIS.energyIntensity.value,
    safeDays: 123,
    headline: 'Twelve days in, export is four per cent under plan and the recompressor has tripped three times.',
    lede: 'The fouled cooler still caps the rate, and vibration on the recompressor’s drive-end bearing has now tripped the machine on the 3rd, the 9th and today. Each trip sends flash gas to flare until the restart.',
    event: 'Recompressor trips three times on vibration.',
    well: { lead: 'Flaring stayed inside its limit.', text: '12.4 kSm³/d against a limit of 15, even with three trips.' },
    notWell: { lead: 'The bearing was run to failure.', text: 'Vibration had trended upward for three weeks before the first trip.' },
    next: { lead: 'Inspect the bearing today.', text: 'WO-104482 is in progress; the cooler cleaning follows on the 16th.' },
    losses: [
      { cause: 'Interstage cooler fouling', volume: 2.5 },
      { cause: 'Recompressor trips', volume: 1.2 },
      { cause: 'Planned cooler inspection', volume: 0.8 },
    ],
    outlook: 'With the bearing replaced and the cooler cleaned by the 18th, the forecast for the month is 4.40, two per cent under plan.',
  },
];

const ES_POINTS: YearPoint[] = ES_MONTHS.map((month) => ({
  id: month.id,
  label: month.short,
  name: month.name,
  value: month.average,
  group: month.short === 'Apr' || month.short === 'Jan' ? month.id.slice(0, 4) : undefined,
  annotated: month.event !== undefined,
}));

const ES_NUMBERS = annotationNumbers(ES_POINTS);

const esDeviation = (month: EsMonth): number => ((month.average - ES_PLAN) / ES_PLAN) * 100;

function EsFigure({ month, size = 'xl' }: { month: EsMonth; size?: 'xl' | 'lg' }) {
  const gap = month.average - ES_PLAN;
  return (
    <div>
      <p className="text-sm font-medium text-medium-foreground">Average gas export, {month.name}</p>
      <p className={cx('font-medium tabular-nums text-base-foreground', size === 'xl' ? 'text-[11rem] leading-[0.82] tracking-[-0.06em]' : 'text-8xl leading-[0.9] tracking-[-0.05em]')}>
        {formatNumber(month.average, 2)}
      </p>
      <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-base text-medium-foreground">
        <span className="font-medium text-base-foreground">MSm³ a day</span>
        <Delta value={esDeviation(month)} unit=" %" />
        <span>
          {gap >= 0 ? 'over' : 'under'} the plan of {formatNumber(ES_PLAN, 2)}
        </span>
      </p>
    </div>
  );
}

function EsChart({ month, onSelect, height = 250 }: { month: EsMonth; onSelect: (id: string) => void; height?: number }) {
  return (
    <YearChart
      label="Average gas export per month over the last twelve months against the plan; select a month to read its report"
      points={ES_POINTS}
      selected={month.id}
      onSelect={onSelect}
      plan={ES_PLAN}
      unit="MSm³/d"
      height={height}
    />
  );
}

function EsNotes({ month }: { month: EsMonth }) {
  return (
    <ol className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
      {ES_MONTHS.filter((entry) => entry.event !== undefined).map((entry) => {
        const active = entry.id === month.id;
        return (
          <li key={entry.id} className={cx('flex gap-2.5', active ? 'text-base-foreground' : 'text-medium-foreground')}>
            <span
              className={cx(
                'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-[var(--kit-text)] text-xs font-semibold tabular-nums',
                active ? 'bg-[var(--kit-text)] text-base-background' : 'text-base-foreground'
              )}
            >
              {ES_NUMBERS.get(entry.id)}
            </span>
            <span>
              <strong className="font-semibold text-base-foreground">{entry.short}.</strong> {entry.event}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function EsProse({ month }: { month: EsMonth }) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-3xl font-medium leading-tight tracking-tight text-base-foreground">{month.headline}</h2>
      <p className="text-base leading-relaxed text-medium-foreground">{month.lede}</p>
    </div>
  );
}

function EsFacts({ month }: { month: EsMonth }) {
  const facts = [
    { label: 'Availability', value: `${formatNumber(month.availability, 1)} %`, note: 'target 97.5', ok: month.availability >= 97.5 },
    { label: 'Energy intensity', value: formatNumber(month.energy, 1), note: 'kWh/boe, target 30.0', ok: month.energy <= 30.5 },
    { label: 'Days since an incident', value: String(month.safeDays), note: 'at month end', ok: month.safeDays >= 60 },
  ];
  return (
    <dl className="flex flex-col">
      {facts.map((fact) => (
        <div key={fact.label} className="flex items-baseline gap-3 border-t border-[var(--kit-rule)] py-2.5">
          <dt className="flex-1 text-sm text-medium-foreground">
            <span className="block font-medium text-base-foreground">{fact.label}</span>
            {fact.note}
          </dt>
          <dd className={cx('text-4xl font-medium tracking-tight tabular-nums', fact.ok ? 'text-base-foreground' : 'text-critical-foreground-strong')}>{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}

const ES_VERDICTS = [
  { id: 'well', title: 'What went well', tone: 'success' },
  { id: 'notWell', title: 'What did not', tone: 'critical' },
  { id: 'next', title: 'What happens next', tone: 'info' },
] as const;

function EsVerdicts({ month, columns = true }: { month: EsMonth; columns?: boolean }) {
  return (
    <div className={cx('grid', columns ? 'grid-cols-3 gap-10' : 'grid-cols-1 gap-6')}>
      {ES_VERDICTS.map((verdict, index) => (
        <section key={verdict.id} className="border-t-2 border-[var(--kit-rule-strong)] pt-3">
          <p className="flex items-baseline gap-2 text-sm text-medium-foreground">
            <span className="tabular-nums">0{index + 1}</span>
            <StatusPill tone={verdict.tone}>{verdict.title}</StatusPill>
          </p>
          <p className="mt-3 text-xl font-medium leading-snug tracking-tight text-base-foreground">{month[verdict.id].lead}</p>
          <p className="mt-2 text-base leading-relaxed text-medium-foreground">{month[verdict.id].text}</p>
        </section>
      ))}
    </div>
  );
}

type EsLoss = EsMonth['losses'][number];

function EsLosses({ month }: { month: EsMonth }) {
  const total = month.losses.reduce((sum, loss) => sum + loss.volume, 0);
  const top = Math.max(...month.losses.map((loss) => loss.volume));
  const columns: DataTableColumn<EsLoss>[] = [
    { id: 'cause', header: 'Cause', cell: (loss) => loss.cause },
    {
      id: 'bar',
      header: 'Share of the losses',
      width: 'w-2/5',
      cell: (loss) => (
        <span className="flex items-center gap-3">
          <span className="h-2 bg-[var(--kit-text)]" style={{ width: `${Math.round((loss.volume / top) * 70)}%` }} />
          <span className="text-sm tabular-nums text-medium-foreground">{Math.round((loss.volume / total) * 100)} %</span>
        </span>
      ),
    },
    { id: 'volume', header: 'MSm³', numeric: true, cell: (loss) => <span className="text-lg font-medium">{formatNumber(loss.volume, 1)}</span> },
  ];
  return (
    <section className="border-t-2 border-[var(--kit-rule-strong)] pt-3">
      <h3 className="text-xl font-medium tracking-tight text-base-foreground">Where the volume went</h3>
      <p className="mt-1 text-sm text-medium-foreground">
        The three largest losses against technical capacity: {formatNumber(total, 1)} MSm³ in {month.name}.
      </p>
      <DataTable className="mt-3" label={`Largest production losses in ${month.name}`} columns={columns} rows={month.losses} rowKey={(loss) => loss.cause} />
    </section>
  );
}

function EsOutlook({ month }: { month: EsMonth }) {
  return (
    <section className="flex flex-col border-t-2 border-[var(--kit-rule-strong)] pt-3">
      <h3 className="text-xl font-medium tracking-tight text-base-foreground">Outlook</h3>
      <p className="mt-3 text-lg leading-relaxed text-base-foreground">{month.outlook}</p>
      <p className="mt-auto border-t border-[var(--kit-rule)] pt-3 text-sm text-medium-foreground">Prepared by Magnus Solberg, maintenance planner. Figures from the production accounting system at month end.</p>
    </section>
  );
}

function EsMasthead({ month, onStep }: { month: EsMonth; onStep: (step: number) => void }) {
  const index = ES_MONTHS.indexOf(month);
  return (
    <div className="flex items-center gap-4 border-b border-[var(--kit-rule-strong)] pb-3">
      <p className="text-sm font-semibold text-base-foreground">Nordkapp monthly</p>
      <p className="text-sm text-medium-foreground">Report to the asset board · issue {index + 16}</p>
      <div className="ml-auto flex items-center gap-1">
        <Button variant="ghost" size="icon-sm" aria-label="Previous month" disabled={index === 0} onClick={() => onStep(-1)}>
          <IconChevronLeft />
        </Button>
        <p aria-live="polite" className="w-36 text-center text-sm font-semibold tabular-nums text-base-foreground">
          {month.name}
        </p>
        <Button variant="ghost" size="icon-sm" aria-label="Next month" disabled={index === ES_MONTHS.length - 1} onClick={() => onStep(1)}>
          <IconChevronRight />
        </Button>
      </div>
    </div>
  );
}

function useEsMonth(initial: string) {
  const [id, setId] = useState(initial);
  const month = ES_MONTHS.find((entry) => entry.id === id) ?? ES_MONTHS[ES_MONTHS.length - 1];
  const step = (by: number) => {
    const next = ES_MONTHS[ES_MONTHS.indexOf(month) + by];
    if (next) setId(next.id);
  };
  return { month, select: setId, step };
}

function EsReport() {
  const { month, select, step } = useEsMonth('2026-03');
  return (
    <LookScope look="editorial">
      <Canvas padding="none" className="h-[920px] overflow-y-auto">
        <article className="mx-auto flex max-w-[1120px] flex-col gap-10 px-[clamp(1.5rem,5%,3.5rem)] py-8">
          <EsMasthead month={month} onStep={step} />
          <div className="grid grid-cols-12 gap-x-10">
            <div className="col-span-7 flex flex-col gap-6">
              <EsFigure month={month} />
              <EsChart month={month} onSelect={select} />
              <EsNotes month={month} />
            </div>
            <div className="col-span-5 flex flex-col justify-between gap-6 border-l border-[var(--kit-rule)] pl-10">
              <EsProse month={month} />
              <EsFacts month={month} />
            </div>
          </div>
          <EsVerdicts month={month} />
          <div className="grid grid-cols-12 gap-x-10">
            <div className="col-span-7">
              <EsLosses month={month} />
            </div>
            <div className="col-span-5 flex">
              <EsOutlook month={month} />
            </div>
          </div>
        </article>
      </Canvas>
    </LookScope>
  );
}

function ExecutiveSummarySignature() {
  return <EsReport />;
}

const ES_YEAR_AVERAGE = Math.round((ES_MONTHS.reduce((sum, month) => sum + month.average, 0) / ES_MONTHS.length) * 100) / 100;

const ES_YEAR_COLUMNS: DataTableColumn<EsMonth>[] = [
  { id: 'month', header: 'Month', nowrap: true, cell: (month) => month.name },
  { id: 'average', header: 'MSm³/d', numeric: true, cell: (month) => <span className="text-lg font-medium">{formatNumber(month.average, 2)}</span> },
  {
    id: 'deviation',
    header: 'Against plan',
    width: 'w-44',
    cell: (month) => {
      const deviation = esDeviation(month);
      const width = `${Math.min(50, Math.abs(deviation) * 5.5)}%`;
      return (
        <span className="relative block h-5 w-full">
          <span className="absolute inset-y-0 left-1/2 w-px bg-[var(--kit-rule-strong)]" />
          <span className={cx('absolute inset-y-1', deviation < 0 ? 'right-1/2 bg-[var(--kit-line-critical)]' : 'left-1/2 bg-[var(--kit-line-success)]')} style={{ width }} />
        </span>
      );
    },
  },
  { id: 'percent', header: '%', numeric: true, cell: (month) => <Delta value={esDeviation(month)} unit=" %" /> },
  { id: 'availability', header: 'Availability', numeric: true, muted: true, cell: (month) => `${formatNumber(month.availability, 1)} %` },
  { id: 'story', header: 'In one line', cell: (month) => month.event ?? month.well.lead },
];

function ExecutiveSummaryYear() {
  return (
    <LookScope look="editorial">
      <Canvas>
        <div className="mx-auto flex max-w-[1120px] flex-col gap-8">
          <header className="grid grid-cols-12 items-end gap-x-10 border-b-2 border-[var(--kit-rule-strong)] pb-6">
            <div className="col-span-7">
              <p className="text-sm font-medium text-medium-foreground">Nordkapp · twelve months to March 2026</p>
              <h2 className="mt-2 text-5xl font-medium leading-none tracking-tight text-base-foreground">Seven months at plan, five with a story.</h2>
            </div>
            <div className="col-span-5 flex items-end justify-end gap-8 text-right">
              <div>
                <p className="text-sm text-medium-foreground">Year average, MSm³/d</p>
                <p className="text-7xl font-medium leading-none tracking-tighter tabular-nums text-base-foreground">{formatNumber(ES_YEAR_AVERAGE, 2)}</p>
              </div>
              <div>
                <p className="text-sm text-medium-foreground">Plan</p>
                <p className="text-4xl font-medium leading-none tracking-tighter tabular-nums text-medium-foreground">{formatNumber(ES_PLAN, 2)}</p>
              </div>
            </div>
          </header>
          <DataTable label="Monthly gas export against plan for the last twelve months" columns={ES_YEAR_COLUMNS} rows={ES_MONTHS} rowKey={(month) => month.id} density="default" />
        </div>
      </Canvas>
    </LookScope>
  );
}

function ExecutiveSummaryPhone() {
  const { month, step } = useEsMonth('2026-02');
  const index = ES_MONTHS.indexOf(month);
  return (
    <LookScope look="editorial">
      <Canvas padding="none">
        <div className="flex justify-center bg-muted-background px-4 py-8">
          <article className="flex w-full max-w-[400px] flex-col gap-6 border border-[var(--kit-rule)] bg-base-background p-6">
            <div className="flex items-center justify-between border-b border-[var(--kit-rule-strong)] pb-3">
              <p className="text-sm font-semibold text-base-foreground">Nordkapp monthly</p>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon-sm" aria-label="Previous month" disabled={index === 0} onClick={() => step(-1)}>
                  <IconChevronLeft />
                </Button>
                <Button variant="ghost" size="icon-sm" aria-label="Next month" disabled={index === ES_MONTHS.length - 1} onClick={() => step(1)}>
                  <IconChevronRight />
                </Button>
              </div>
            </div>
            <EsFigure month={month} size="lg" />
            <h2 className="text-2xl font-medium leading-tight tracking-tight text-base-foreground">{month.headline}</h2>
            <EsVerdicts month={month} columns={false} />
          </article>
        </div>
      </Canvas>
    </LookScope>
  );
}

const ES_FEBRUARY = ES_MONTHS[10];

const ES_DECEMBER = ES_MONTHS[8];

function EsPart({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <LookScope look="editorial" className={cx('flex flex-col', className)}>
      <Canvas padding="none" className="flex min-h-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1 flex-col justify-center p-8">{children}</div>
      </Canvas>
    </LookScope>
  );
}

function ExecutiveSummaryFigure() {
  return (
    <EsPart className="h-[380px]">
      <EsFigure month={ES_DECEMBER} size="lg" />
    </EsPart>
  );
}

function ExecutiveSummaryChart() {
  const { month, select } = useEsMonth('2025-12');
  return (
    <EsPart className="h-[380px]">
      <EsChart month={month} onSelect={select} height={250} />
    </EsPart>
  );
}

function ExecutiveSummaryVerdicts() {
  return (
    <EsPart>
      <EsVerdicts month={ES_FEBRUARY} />
    </EsPart>
  );
}

function ExecutiveSummaryLosses() {
  return (
    <EsPart className="h-[420px]">
      <EsLosses month={ES_FEBRUARY} />
    </EsPart>
  );
}

function ExecutiveSummaryProse() {
  return (
    <EsPart className="h-[420px]">
      <div className="flex flex-col gap-6">
        <EsProse month={ES_FEBRUARY} />
        <EsOutlook month={ES_FEBRUARY} />
      </div>
    </EsPart>
  );
}

function ExecutiveSummaryMasthead() {
  const { month, step } = useEsMonth('2025-09');
  return (
    <EsPart>
      <div className="grid grid-cols-12 gap-x-10 gap-y-6">
        <div className="col-span-12">
          <EsMasthead month={month} onStep={step} />
        </div>
        <div className="col-span-7">
          <EsNotes month={month} />
        </div>
        <div className="col-span-5">
          <EsFacts month={month} />
        </div>
      </div>
    </EsPart>
  );
}

export default definePage({
  id: 'executive-summary',
  title: 'Executive summary',
  summary:
    'The month as one scrolling report: a single very large figure, a year of months on an annotated chart beside the prose that explains it, then what went well, what did not and what happens next. Switch month and every word and figure changes.',
  guidance: {
    use: [
      'For the monthly report to a board or leadership team, read top to bottom on screen or on paper.',
      'Lead with one figure and one sentence; everything else supports them.',
      'Number the events on the chart and explain each number in the text beside it.',
    ],
    avoid: [
      'Cards, tiles and coloured panels. Rules, columns and type size carry the structure.',
      'More than one giant figure; the second one halves the first.',
      'Live data. A report describes a closed period and says when it was prepared.',
    ],
  },
  source,
  sections: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description: 'Editorial look: a scrolling narrative led by one figure and an annotated year chart.',
      specimens: [
        {
          id: 'ExecutiveSummarySignature',
          title: 'Monthly report',
          note: 'Pick it when the reader wants the month explained, not a wall of indicators.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/executive-summary/YearChart.tsx', 'kit/executive-summary/annotations.ts', 'kit/DataTable.tsx', 'kit/Delta.tsx', 'kit/StatusPill.tsx', 'looks/LookScope.tsx'],
          Component: ExecutiveSummarySignature,
        },
      ],
    },
    {
      id: 'variations',
      title: 'Variations',
      description: 'Other screens of the same product.',
      specimens: [
        {
          id: 'ExecutiveSummaryYear',
          title: 'Year in review',
          note: 'Pick it for the annual look back: twelve months as a typographic table with the deviation drawn in.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/DataTable.tsx', 'kit/Delta.tsx'],
          Component: ExecutiveSummaryYear,
        },
        {
          id: 'ExecutiveSummaryPhone',
          title: 'Phone brief',
          note: 'Pick it for the version read on a phone before the meeting: the figure, the sentence and three verdicts.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Delta.tsx', 'kit/StatusPill.tsx'],
          Component: ExecutiveSummaryPhone,
        },
      ],
    },
    {
      id: 'parts',
      title: 'Parts',
      description: 'The pieces of the report on their own.',
      specimens: [
        {
          id: 'ExecutiveSummaryFigure',
          title: 'Headline figure',
          note: 'Use it for the one number of a report, with its unit and its distance from plan in words.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Delta.tsx'],
          Component: ExecutiveSummaryFigure,
        },
        {
          id: 'ExecutiveSummaryChart',
          title: 'Annotated year chart',
          note: 'Use it when a year of periods needs context and the chart should double as the period switch.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          bleed: true,
          uses: ['kit/executive-summary/YearChart.tsx'],
          Component: ExecutiveSummaryChart,
        },
        {
          id: 'ExecutiveSummaryVerdicts',
          title: 'Three verdicts',
          note: 'Use it to close an argument: what worked, what did not, what follows, one sentence each.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/StatusPill.tsx'],
          Component: ExecutiveSummaryVerdicts,
        },
        {
          id: 'ExecutiveSummaryLosses',
          title: 'Loss table',
          note: 'Use it for a short ranked list where a drawn bar helps and a chart would be too much.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          bleed: true,
          uses: ['kit/DataTable.tsx'],
          Component: ExecutiveSummaryLosses,
        },
        {
          id: 'ExecutiveSummaryProse',
          title: 'Headline and prose',
          note: 'Use it to carry the indicators inside sentences instead of tiles.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          bleed: true,
          Component: ExecutiveSummaryProse,
        },
        {
          id: 'ExecutiveSummaryMasthead',
          title: 'Masthead and notes',
          note: 'Use the masthead as the only chrome of a report: its name, its issue and the period pager.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/executive-summary/YearChart.tsx'],
          Component: ExecutiveSummaryMasthead,
        },
      ],
    },
  ],
});
