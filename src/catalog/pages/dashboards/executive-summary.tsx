import { ChartContainer, ChartTooltip, ChartTooltipContent, chartSeriesColor } from '@cognite/aura/chart';
import type { ChartConfig } from '@cognite/aura/chart';
import {
  SegmentedControl,
  SegmentedControlButton,
  SegmentedControlList,
} from '@cognite/aura/components/segmented-control';
import { useState } from 'react';
import { Area, AreaChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from 'recharts';

import { DashboardFrame } from '../../../library/dashboards/DashboardFrame';
import { formatValue } from '../../../library/industrial/status';
import { TrendDelta } from '../../../library/industrial/TrendDelta';
import { ThemeScope } from '../../../library/themes/ThemeScope';
import { PLANT_KPIS } from '../../data/plant';
import { makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './executive-summary.tsx?raw';

type ExecSummaryPoint = { lead: string; text: string };

type ExecSummaryNote = { id: string; day: number; text: string };

type ExecSummaryLoss = { id: string; cause: string; tag: string; volume: number; previous: number };

type ExecSummaryMonth = {
  id: string;
  /** "February 2026". */
  label: string;
  /** Month name alone, for the selector and axis. */
  name: string;
  short: string;
  days: number;
  headline: string;
  lede: string;
  /** Average gas export for the month in MSm³/d. */
  average: number;
  context: string;
  facts: readonly { label: string; value: string; note: string }[];
  /** Shape of the daily export curve: where it dipped and by how much. */
  curve: { seed: number; dipFrom: number; dipTo: number; depth: number };
  chartSummary: string;
  notes: readonly ExecSummaryNote[];
  well: readonly ExecSummaryPoint[];
  notWell: readonly ExecSummaryPoint[];
  next: readonly ExecSummaryPoint[];
  losses: readonly ExecSummaryLoss[];
  lossSummary: string;
  outlookTitle: string;
  outlook: string;
  dates: readonly { label: string; value: string }[];
  preparedBy: string;
};

const EXEC_SUMMARY_PLAN = PLANT_KPIS.gasExport.target;

const EXEC_SUMMARY_MONTHS: readonly ExecSummaryMonth[] = [
  {
    id: '2025-12',
    label: 'December 2025',
    name: 'December',
    short: 'Dec',
    days: 31,
    headline: 'Export ended 2% under plan after a cold week put hydrates in the export line.',
    lede: 'The plant ran at plan for twenty-five of thirty-one days. Six days of restricted export in the middle of the month account for almost all of the shortfall, and the methanol injection that cleared the line is now a standing winter procedure.',
    average: 4.41,
    context: 'Average gas export, against a plan of 4.50. The gap is 2.8 MSm³ over the month, most of it between the 12th and the 17th.',
    facts: [
      { label: 'Availability', value: '96.1%', note: 'target 97.5%' },
      { label: 'Energy intensity', value: '31.6 kWh/boe', note: 'target 30.0' },
      { label: 'Days since incident', value: '146', note: 'no recordables' },
    ],
    curve: { seed: 612, dipFrom: 12, dipTo: 17, depth: 0.36 },
    chartSummary: 'Export held close to plan except for 12 to 17 December, when hydrate formation restricted the export line to about 4.1 MSm³/d.',
    notes: [
      { id: '1', day: 12, text: 'Sea temperature drops to 3 °C; differential pressure rises across the export line.' },
      { id: '2', day: 15, text: 'Methanol injection doubled; rate held at 4.1 while the line clears.' },
      { id: '3', day: 18, text: 'Line clear and export back at plan.' },
    ],
    well: [
      { lead: 'No recordable incidents.', text: 'The winter readiness checks were closed before the cold week.' },
      { lead: 'Compression ran all month.', text: 'No unplanned stops on any of the three compressors.' },
      { lead: 'Flaring stayed under its limit.', text: '14.8 kSm³/d against a limit of 15.' },
    ],
    notWell: [
      { lead: 'Hydrates cost 2.9 MSm³.', text: 'The dew point margin was known to be thin and was not acted on.' },
      { lead: 'A power dip tripped the gas turbine.', text: 'Nine hours of reduced compression on the 27th.' },
      { lead: 'Backlog grew to 31 work orders.', text: 'Holiday staffing left planned work behind.' },
    ],
    next: [
      { lead: 'Make winter methanol dosing standard.', text: 'Procedure update due 15 January.' },
      { lead: 'Review the turbine ride-through settings.', text: 'With the grid operator in January.' },
      { lead: 'Clear the backlog to 25.', text: 'Two extra crews in weeks 2 and 3.' },
    ],
    losses: [
      { id: 'hydrate', cause: 'Hydrates in the export line', tag: 'NK-27', volume: 2.9, previous: 0 },
      { id: 'planned', cause: 'Planned maintenance', tag: 'NK-40', volume: 1.2, previous: 1.6 },
      { id: 'turbine', cause: 'Gas turbine trip on power dip', tag: '23-GT-9001', volume: 0.9, previous: 0 },
      { id: 'inlet', cause: 'Low inlet pressure', tag: '20-VA-1001', volume: 0.6, previous: 0.5 },
      { id: 'other', cause: 'Other, under 0.2 each', tag: 'NK', volume: 0.3, previous: 0.4 },
    ],
    lossSummary: 'Lost against a technical capacity of 4.60 MSm³/d: 5.9 MSm³ in total, half of it to hydrates.',
    outlookTitle: 'Outlook for January',
    outlook: 'January is planned at 4.50 with no major maintenance. Weather is the main risk: sea temperature stays low until March, and the export line has no margin without the higher methanol rate.',
    dates: [
      { label: 'Procedure update', value: '15 Jan' },
      { label: 'Grid operator review', value: '22 Jan' },
      { label: 'Next report', value: '3 Feb' },
    ],
    preparedBy: 'Prepared by Magnus Solberg, 5 January 2026',
  },
  {
    id: '2026-01',
    label: 'January 2026',
    name: 'January',
    short: 'Jan',
    days: 31,
    headline: 'Export finished 1% over plan in a month without a single unplanned compressor stop.',
    lede: 'January was the steadiest month since start-up. The winter methanol procedure held the export line open through the coldest week, and the only loss of note was an export pump trip during the storm on the 22nd.',
    average: 4.53,
    context: 'Average gas export, against a plan of 4.50. The plant delivered 0.9 MSm³ more than planned over the month.',
    facts: [
      { label: 'Availability', value: '98.2%', note: 'target 97.5%' },
      { label: 'Energy intensity', value: '30.4 kWh/boe', note: 'target 30.0' },
      { label: 'Days since incident', value: '177', note: 'no recordables' },
    ],
    curve: { seed: 733, dipFrom: 22, dipTo: 23, depth: 0.3 },
    chartSummary: 'Export stayed at or above plan on 27 of 31 days; the dip on 22 and 23 January is the export pump trip during the storm.',
    notes: [
      { id: '1', day: 8, text: 'Coldest week of the winter passes with the export line at full rate.' },
      { id: '2', day: 22, text: 'Storm trips export pump A; pump B takes over after forty minutes.' },
      { id: '3', day: 24, text: 'Pump A back in service after a seal flush.' },
    ],
    well: [
      { lead: 'Export beat plan by 0.9 MSm³.', text: 'Twenty-seven days at or above 4.50.' },
      { lead: 'Availability reached 98.2%.', text: 'The highest monthly figure on record.' },
      { lead: 'Backlog is down to 24.', text: 'The extra crews closed eleven overdue orders.' },
    ],
    notWell: [
      { lead: 'Export pump A tripped in the storm.', text: 'The standby start took forty minutes instead of five.' },
      { lead: 'Energy intensity is still over target.', text: '30.4 kWh/boe against 30.0.' },
      { lead: 'Cooler approach temperature is drifting.', text: 'Up 4 °C on the interstage cooler since December.' },
    ],
    next: [
      { lead: 'Test the standby pump start monthly.', text: 'First test on 6 February.' },
      { lead: 'Inspect the interstage cooler.', text: 'Thermography in week 6.' },
      { lead: 'Agree the energy plan for the spring.', text: 'Steering group on 19 February.' },
    ],
    losses: [
      { id: 'planned', cause: 'Planned maintenance', tag: 'NK-40', volume: 0.8, previous: 1.2 },
      { id: 'pump', cause: 'Export pump A trip', tag: '27-PA-2001A', volume: 0.6, previous: 0 },
      { id: 'inlet', cause: 'Low inlet pressure', tag: '20-VA-1001', volume: 0.4, previous: 0.6 },
      { id: 'weather', cause: 'Weather restrictions', tag: 'NK-27', volume: 0.3, previous: 2.9 },
      { id: 'other', cause: 'Other, under 0.2 each', tag: 'NK', volume: 0.1, previous: 0.3 },
    ],
    lossSummary: 'Lost against a technical capacity of 4.60 MSm³/d: 2.2 MSm³ in total, the lowest month this winter.',
    outlookTitle: 'Outlook for February',
    outlook: 'February is planned at 4.50. The drifting cooler is the item to watch: if the approach temperature keeps rising, compression will have to be turned down before the cleaning window in March.',
    dates: [
      { label: 'Standby pump test', value: '6 Feb' },
      { label: 'Steering group', value: '19 Feb' },
      { label: 'Next report', value: '3 Mar' },
    ],
    preparedBy: 'Prepared by Magnus Solberg, 3 February 2026',
  },
  {
    id: '2026-02',
    label: 'February 2026',
    name: 'February',
    short: 'Feb',
    days: 28,
    headline: 'Export was 3% under plan, held back by eleven days of a fouled interstage cooler.',
    lede: 'The drift flagged in January became a restriction on the 9th. Compression was turned down until an offline clean on the 16th, and the plant was back at plan from the 20th. Safety and flaring both improved.',
    average: 4.36,
    context: 'Average gas export, against a plan of 4.50. The gap is 3.9 MSm³ over the month, and the cooler explains two thirds of it.',
    facts: [
      { label: 'Availability', value: '95.7%', note: 'target 97.5%' },
      { label: 'Energy intensity', value: '32.1 kWh/boe', note: 'target 30.0' },
      { label: 'Days since incident', value: '205', note: 'no recordables' },
    ],
    curve: { seed: 854, dipFrom: 9, dipTo: 19, depth: 0.3 },
    chartSummary: 'Export ran at plan for the first week, fell to about 4.1 MSm³/d from 9 to 19 February while the cooler limited compression, and recovered after the clean.',
    notes: [
      { id: '1', day: 9, text: 'Interstage cooler 23-HA-9114 limits compression; rate cut to 4.1.' },
      { id: '2', day: 16, text: 'Offline chemical clean, fourteen hours at reduced rate.' },
      { id: '3', day: 20, text: 'Back at full rate; approach temperature down by 6 °C.' },
    ],
    well: [
      { lead: 'No recordable incidents.', text: '205 days since the last one.' },
      { lead: 'Flaring fell by 18%.', text: 'To 12.6 kSm³/d after the purge rate change.' },
      { lead: 'Planned work ran 94% to schedule.', text: 'The backlog is down to 23.' },
    ],
    notWell: [
      { lead: 'Cooler fouling cost 4.1 MSm³.', text: 'The January warning did not lead to an earlier clean.' },
      { lead: 'Energy intensity rose to 32.1.', text: 'Seven per cent over target while compression ran inefficiently.' },
      { lead: 'The recompressor seal is still on order.', text: 'Delivery has slipped twice; health is at 41.' },
    ],
    next: [
      { lead: 'Fit a differential pressure alarm on the cooler.', text: 'Work order due 20 March.' },
      { lead: 'Change the recompressor seal.', text: 'In the April window, if the part arrives.' },
      { lead: 'Decide on the anti-fouling dosing trial.', text: 'Decision by 31 March.' },
    ],
    losses: [
      { id: 'cooler', cause: 'Interstage cooler fouling', tag: '23-HA-9114', volume: 4.1, previous: 0 },
      { id: 'planned', cause: 'Planned maintenance', tag: 'NK-40', volume: 1.1, previous: 0.8 },
      { id: 'pump', cause: 'Export pump A trip', tag: '27-PA-2001A', volume: 0.7, previous: 0.6 },
      { id: 'inlet', cause: 'Low inlet pressure', tag: '20-VA-1001', volume: 0.5, previous: 0.4 },
      { id: 'other', cause: 'Other, under 0.2 each', tag: 'NK', volume: 0.3, previous: 0.1 },
    ],
    lossSummary: 'Lost against a technical capacity of 4.60 MSm³/d: 6.7 MSm³ in total, three times the January figure.',
    outlookTitle: 'Outlook for March',
    outlook: 'March is planned at 4.50 and started there. The recompressor is now the weakest unit in the plant: until its seal is changed, a trip would take export down by about 4% for as long as it lasts.',
    dates: [
      { label: 'Cooler alarm fitted', value: '20 Mar' },
      { label: 'Dosing decision', value: '31 Mar' },
      { label: 'Next report', value: '2 Apr' },
    ],
    preparedBy: 'Prepared by Magnus Solberg, 3 March 2026',
  },
];

function execSummaryMonth(monthId: string): ExecSummaryMonth {
  return EXEC_SUMMARY_MONTHS.find((month) => month.id === monthId) ?? EXEC_SUMMARY_MONTHS[EXEC_SUMMARY_MONTHS.length - 1];
}

/** Daily export for a month: a steady run with one dip, shifted so its mean is the reported average. */
function execSummaryDaily(month: ExecSummaryMonth): { day: number; export: number }[] {
  const { seed, dipFrom, dipTo, depth } = month.curve;
  const raw = makeValues({ seed, points: month.days, base: 4.5, amplitude: 0.03, noise: 0.03, cycles: 2, decimals: 3 }).map((value, index) => {
    const day = index + 1;
    const edge = day === dipFrom || day === dipTo ? 0.6 : 1;
    return day >= dipFrom && day <= dipTo ? value - depth * edge : value;
  });
  const shift = month.average - raw.reduce((sum, value) => sum + value, 0) / raw.length;
  return raw.map((value, index) => ({ day: index + 1, export: Math.round((value + shift) * 100) / 100 }));
}

const EXEC_SUMMARY_CHART_CONFIG = {
  export: { label: 'Gas export', color: chartSeriesColor(1) },
} satisfies ChartConfig;

/** Small numbered heading above each block, like the section marks of a printed report. */
function ExecSummarySectionMark({ number, children }: { number: string; children: string }) {
  return (
    <p className="flex items-baseline gap-3 border-t border-default pt-4 text-xs font-medium text-muted-foreground">
      <span className="tabular-nums">{number}</span>
      <span>{children}</span>
    </p>
  );
}

/** The month in one sentence, then one paragraph. */
function ExecSummaryHeadline({ month }: { month: ExecSummaryMonth }) {
  return (
    <header className="flex flex-col gap-6">
      <p className="text-sm font-medium text-muted-foreground">{month.label} · Nordkapp gas processing plant</p>
      <h4 className="max-w-4xl text-balance text-4xl font-semibold leading-tight tracking-tight text-base-foreground lg:text-5xl">{month.headline}</h4>
      <p className="max-w-prose text-lg leading-relaxed text-medium-foreground">{month.lede}</p>
    </header>
  );
}

/** One big number with a sentence of context and three quiet supporting facts. */
function ExecSummaryFigure({ month }: { month: ExecSummaryMonth }) {
  return (
    <section aria-label="Headline figure" className="flex flex-col gap-6">
      <ExecSummarySectionMark number="01">The number</ExecSummarySectionMark>
      <div className="grid grid-cols-1 items-end gap-x-12 gap-y-6 lg:grid-cols-2">
        <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-7xl font-semibold leading-none tracking-tight tabular-nums text-base-foreground lg:text-8xl">{formatValue(month.average, 2)}</span>
          <span className="flex flex-col gap-1 text-base text-muted-foreground">
            <span>MSm³/d</span>
            <TrendDelta value={month.average} reference={EXEC_SUMMARY_PLAN} format="percent" decimals={1} goodDirection="up" caption="vs plan" size="md" />
          </span>
        </p>
        <p className="max-w-prose text-base leading-relaxed text-medium-foreground">{month.context}</p>
      </div>
      <dl className="grid grid-cols-1 gap-x-12 gap-y-4 sm:grid-cols-3">
        {month.facts.map((fact) => (
          <div key={fact.label} className="flex flex-col gap-1">
            <dt className="text-xs text-muted-foreground">{fact.label}</dt>
            <dd className="flex flex-wrap items-baseline gap-x-2">
              <span className="text-xl font-semibold tabular-nums text-base-foreground">{fact.value}</span>
              <span className="text-xs tabular-nums text-muted-foreground">{fact.note}</span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** The wide chart: every day of the month against plan, with the numbered moments explained underneath. */
function ExecSummaryChart({ month }: { month: ExecSummaryMonth }) {
  const [activeNote, setActiveNote] = useState<string | null>(null);
  const data = execSummaryDaily(month);
  const ticks = [1, 7, 14, 21, month.days];

  return (
    <section aria-label="Daily export" className="flex flex-col gap-6">
      <ExecSummarySectionMark number="02">The month, day by day</ExecSummarySectionMark>
      <div className="h-72 w-full">
        <ChartContainer
          config={EXEC_SUMMARY_CHART_CONFIG}
          className="aspect-auto h-full w-full"
          aria-label={`Daily gas export in ${month.label} against the plan of ${formatValue(EXEC_SUMMARY_PLAN, 2)} million standard cubic metres per day. ${month.chartSummary}`}
        >
          <AreaChart data={data} margin={{ top: 24, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="day" ticks={ticks} tickFormatter={(day: number) => `${day} ${month.short}`} tickLine={false} axisLine={false} />
            <YAxis domain={[3.8, 4.8]} ticks={[3.8, 4, 4.2, 4.4, 4.6, 4.8]} tickLine={false} axisLine={false} width={32} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ReferenceLine
              y={EXEC_SUMMARY_PLAN}
              stroke="var(--muted-foreground)"
              strokeDasharray="4 4"
              label={{ value: `Plan ${formatValue(EXEC_SUMMARY_PLAN, 2)}`, position: 'insideBottomRight', fill: 'var(--muted-foreground)', fontSize: 12 }}
            />
            <Area dataKey="export" type="monotone" stroke="var(--color-export)" fill="var(--color-export)" fillOpacity={0.1} strokeWidth={2} isAnimationActive={false} />
            {month.notes.map((note) => (
              <ReferenceLine
                key={note.id}
                x={note.day}
                stroke="var(--base-foreground)"
                strokeWidth={activeNote === note.id ? 2 : 1}
                strokeDasharray={activeNote === note.id ? undefined : '2 3'}
                label={{ value: note.id, position: 'top', fill: 'var(--base-foreground)', fontSize: 12, fontWeight: 600 }}
              />
            ))}
          </AreaChart>
        </ChartContainer>
      </div>
      <ol aria-label="Moments marked on the chart" className="grid grid-cols-1 gap-x-12 gap-y-3 md:grid-cols-3">
        {month.notes.map((note) => (
          <li key={note.id}>
            <button
              type="button"
              aria-pressed={activeNote === note.id}
              onClick={() => setActiveNote((current) => (current === note.id ? null : note.id))}
              className={`flex w-full cursor-pointer items-baseline gap-3 rounded-md border-l-2 py-1 pl-3 text-left outline-none focus-visible:shadow-focus-ring ${
                activeNote === note.id ? 'border-l-base-foreground' : 'border-l-transparent hover:border-l-emphasized'
              }`}
            >
              <span className="text-sm font-semibold tabular-nums text-base-foreground">{note.id}</span>
              <span className="flex flex-col gap-0.5">
                <span className="text-xs tabular-nums text-muted-foreground">
                  {note.day} {month.short}
                </span>
                <span className="text-sm leading-relaxed text-medium-foreground">{note.text}</span>
              </span>
            </button>
          </li>
        ))}
      </ol>
      <p className="max-w-prose text-xs text-muted-foreground">{month.chartSummary} Select a note to mark its day.</p>
    </section>
  );
}

function ExecSummaryColumn({ title, points }: { title: string; points: readonly ExecSummaryPoint[] }) {
  return (
    <div className="flex flex-col gap-4 border-t-2 border-base-foreground pt-4">
      <h5 className="text-xl font-semibold text-base-foreground">{title}</h5>
      <ul className="flex flex-col gap-4">
        {points.map((point) => (
          <li key={point.lead} className="text-sm leading-relaxed text-medium-foreground">
            <span className="font-semibold text-base-foreground">{point.lead}</span> {point.text}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Three columns of three: what went well, what did not, what is next. */
function ExecSummaryReview({ month }: { month: ExecSummaryMonth }) {
  return (
    <section aria-label="Review" className="flex flex-col gap-6">
      <ExecSummarySectionMark number="03">In review</ExecSummarySectionMark>
      <div className="grid grid-cols-1 gap-x-12 gap-y-8 md:grid-cols-3">
        <ExecSummaryColumn title="What went well" points={month.well} />
        <ExecSummaryColumn title="What did not" points={month.notWell} />
        <ExecSummaryColumn title="What is next" points={month.next} />
      </div>
    </section>
  );
}

/** A ranked table whose bars sit in the rows: where the lost production went. */
function ExecSummaryLosses({ month }: { month: ExecSummaryMonth }) {
  const largest = Math.max(...month.losses.map((loss) => loss.volume));
  const total = month.losses.reduce((sum, loss) => sum + loss.volume, 0);

  return (
    <section aria-label="Lost production" className="flex flex-col gap-6">
      <ExecSummarySectionMark number="04">Where production was lost</ExecSummarySectionMark>
      <table className="w-full table-fixed text-left text-sm">
        <thead>
          <tr className="text-xs text-muted-foreground">
            <th scope="col" className="w-10 pb-3 font-medium">
              <span className="sr-only">Rank</span>
            </th>
            <th scope="col" className="w-2/5 pb-3 pr-6 font-medium">
              Cause
            </th>
            <th scope="col" className="pb-3 pr-6 font-medium">
              Share of all losses
            </th>
            <th scope="col" className="w-24 pb-3 pr-6 text-right font-medium">
              Lost, MSm³
            </th>
            <th scope="col" className="w-36 pb-3 text-right font-medium">
              Against last month
            </th>
          </tr>
        </thead>
        <tbody>
          {month.losses.map((loss, index) => (
            <tr key={loss.id} className="border-t border-default align-middle">
              <td className="py-4 text-xl font-semibold tabular-nums text-muted-foreground">{index + 1}</td>
              <td className="py-4 pr-6">
                <p className="text-base font-medium text-base-foreground">{loss.cause}</p>
                <p className="font-mono text-xs text-muted-foreground">{loss.tag}</p>
              </td>
              <td className="py-4 pr-6">
                <div className="flex items-center gap-3">
                  <span aria-hidden="true" className="block h-2 min-w-0 flex-1 rounded-full bg-chart-neutral-100">
                    <span className="block h-full rounded-full bg-chart-1-450" style={{ width: `${(loss.volume / largest) * 100}%` }} />
                  </span>
                  <span className="w-10 shrink-0 text-right text-xs tabular-nums text-muted-foreground">{formatValue((loss.volume / total) * 100, 0)}%</span>
                </div>
              </td>
              <td className="py-4 pr-6 text-right text-base font-medium tabular-nums text-base-foreground">{formatValue(loss.volume, 1)}</td>
              <td className="py-4 text-right">
                <TrendDelta value={loss.volume} reference={loss.previous} decimals={1} goodDirection="down" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="max-w-prose text-xs text-muted-foreground">{month.lossSummary}</p>
    </section>
  );
}

/** The closing paragraph and the dates that follow from it. */
function ExecSummaryOutlook({ month }: { month: ExecSummaryMonth }) {
  return (
    <section aria-label="Outlook" className="flex flex-col gap-6">
      <ExecSummarySectionMark number="05">Looking ahead</ExecSummarySectionMark>
      <div className="grid grid-cols-1 gap-x-12 gap-y-6 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <h5 className="text-3xl font-semibold tracking-tight text-base-foreground">{month.outlookTitle}</h5>
          <p className="max-w-prose text-lg leading-relaxed text-medium-foreground">{month.outlook}</p>
        </div>
        <dl className="flex flex-col">
          {month.dates.map((date) => (
            <div key={date.label} className="flex items-baseline justify-between gap-4 border-t border-default py-3">
              <dt className="text-sm text-medium-foreground">{date.label}</dt>
              <dd className="text-sm font-semibold tabular-nums text-base-foreground">{date.value}</dd>
            </div>
          ))}
        </dl>
      </div>
      <p className="text-xs text-muted-foreground">{month.preparedBy}</p>
    </section>
  );
}

/*
 * Archetype: a single scrolling narrative — a one-page printed report, read top to bottom, with
 * no panels and no grid of cards.
 * Dominant element: the headline sentence and the prose that follows it; figures illustrate it.
 * Interaction: the month selector swaps the whole narrative; in the chart, selecting a numbered
 * note marks its day.
 */
function ExecSummaryDashboard() {
  const [monthId, setMonthId] = useState(EXEC_SUMMARY_MONTHS[EXEC_SUMMARY_MONTHS.length - 1].id);
  const month = execSummaryMonth(monthId);

  return (
    <DashboardFrame
      title="Executive summary"
      subtitle="Monthly report to the asset leadership team"
      actions={
        <SegmentedControl value={monthId} onValueChange={(value) => setMonthId(String(value))}>
          <SegmentedControlList size="small" aria-label="Month">
            {EXEC_SUMMARY_MONTHS.map((option) => (
              <SegmentedControlButton key={option.id} value={option.id}>
                {option.name}
              </SegmentedControlButton>
            ))}
          </SegmentedControlList>
        </SegmentedControl>
      }
    >
      <article key={month.id} className="mx-auto flex w-full max-w-5xl flex-col gap-16 py-8">
        <ExecSummaryHeadline month={month} />
        <ExecSummaryFigure month={month} />
        <ExecSummaryChart month={month} />
        <ExecSummaryReview month={month} />
        <ExecSummaryLosses month={month} />
        <ExecSummaryOutlook month={month} />
      </article>
    </DashboardFrame>
  );
}

function ExecSummaryDashSignature() {
  return (
    <ThemeScope preset="editorial" className="w-full">
      <ExecSummaryDashboard />
    </ThemeScope>
  );
}

function ExecSummaryDashAura() {
  return (
    <ThemeScope preset="aura" className="w-full">
      <ExecSummaryDashboard />
    </ThemeScope>
  );
}

function ExecSummaryDashSandstone() {
  return (
    <ThemeScope preset="sandstone" className="w-full">
      <ExecSummaryDashboard />
    </ThemeScope>
  );
}

function ExecSummaryDashEditorialDark() {
  return (
    <ThemeScope preset="editorial-dark" className="w-full">
      <ExecSummaryDashboard />
    </ThemeScope>
  );
}

function ExecSummaryDashHeadline() {
  return <ExecSummaryHeadline month={EXEC_SUMMARY_MONTHS[1]} />;
}

function ExecSummaryDashFigure() {
  return <ExecSummaryFigure month={EXEC_SUMMARY_MONTHS[1]} />;
}

function ExecSummaryDashChart() {
  return <ExecSummaryChart month={EXEC_SUMMARY_MONTHS[0]} />;
}

function ExecSummaryDashReview() {
  return <ExecSummaryReview month={EXEC_SUMMARY_MONTHS[2]} />;
}

function ExecSummaryDashLosses() {
  return <ExecSummaryLosses month={EXEC_SUMMARY_MONTHS[0]} />;
}

function ExecSummaryDashOutlook() {
  return <ExecSummaryOutlook month={EXEC_SUMMARY_MONTHS[1]} />;
}

export default definePage({
  id: 'executive-summary',
  title: 'Executive summary',
  summary:
    'The month on one page, written to be read rather than scanned: a headline that states the result in words, one number, one chart, a short review and an outlook. A report, not a control panel.',
  guidance: {
    use: [
      'For readers who meet the plant once a month and need the conclusion first.',
      'When the story matters more than the instruments: say what happened, then show it.',
      'Keep each block to one idea and cap the line length so prose stays readable.',
      'Prepare the text per period; a selector swaps whole reports, not single figures.',
    ],
    avoid: [
      'Panels, tiles and borders around every block — whitespace separates the sections.',
      'A headline that is only a title; it should carry the result and its cause.',
      'More than one chart; a second figure belongs in a sentence.',
      'Live data and alarms; this page describes a closed period.',
    ],
  },
  source,
  sections: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description: 'Shown in the Editorial theme. A single scrolling narrative: headline, number, chart, review, ranking and outlook, with a month selector that swaps the whole text.',
      specimens: [
        {
          id: 'ExecSummaryDashSignature',
          title: 'Executive summary',
          note: 'Pick it for a monthly or quarterly report that leadership reads top to bottom.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['dashboards/DashboardFrame.tsx', 'industrial/TrendDelta.tsx', 'themes/ThemeScope.tsx'],
          Component: ExecSummaryDashSignature,
        },
      ],
    },
    {
      id: 'themes',
      title: 'In other themes',
      description: 'The same report, unchanged, in three more presets.',
      specimens: [
        {
          id: 'ExecSummaryDashAura',
          title: 'Aura',
          note: 'Pick it when the report is one page inside a standard Aura application.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['themes/ThemeScope.tsx', 'themes/themes.css'],
          Component: ExecSummaryDashAura,
        },
        {
          id: 'ExecSummaryDashSandstone',
          title: 'Sandstone',
          note: 'Pick it for a warmer, paper-like page that is often printed or exported.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['themes/ThemeScope.tsx', 'themes/themes.css'],
          Component: ExecSummaryDashSandstone,
        },
        {
          id: 'ExecSummaryDashEditorialDark',
          title: 'Editorial dark',
          note: 'Pick it when the report is presented on a large screen in a dimmed room.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['themes/ThemeScope.tsx', 'themes/themes.css'],
          Component: ExecSummaryDashEditorialDark,
        },
      ],
    },
    {
      id: 'panels',
      title: 'Story blocks',
      description: 'Each block of the narrative on its own, taken from different months.',
      specimens: [
        {
          id: 'ExecSummaryDashHeadline',
          title: 'Headline sentence',
          note: 'Pick it to open a report: the result and its cause in one sentence, then one paragraph.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          Component: ExecSummaryDashHeadline,
        },
        {
          id: 'ExecSummaryDashFigure',
          title: 'Big number with context',
          note: 'Pick it for the one figure the period is judged by, with a sentence that explains the gap.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['industrial/TrendDelta.tsx'],
          Component: ExecSummaryDashFigure,
        },
        {
          id: 'ExecSummaryDashChart',
          title: 'Annotated chart',
          note: 'Pick it when a curve needs its story: numbered moments on the chart, explained underneath.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          Component: ExecSummaryDashChart,
        },
        {
          id: 'ExecSummaryDashReview',
          title: 'Three-column review',
          note: 'Pick it to sort a period into what went well, what did not and what follows.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          Component: ExecSummaryDashReview,
        },
        {
          id: 'ExecSummaryDashLosses',
          title: 'Ranked table with bars',
          note: 'Pick it for a short ranking where the reader needs both the order and the exact figures.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['industrial/TrendDelta.tsx'],
          Component: ExecSummaryDashLosses,
        },
        {
          id: 'ExecSummaryDashOutlook',
          title: 'Closing outlook',
          note: 'Pick it to end a report: the main risk in prose and the dates that follow from it.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          Component: ExecSummaryDashOutlook,
        },
      ],
    },
  ],
});
