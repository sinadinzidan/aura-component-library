import { ChartContainer, ChartTooltip, ChartTooltipContent, chartSeriesColor } from '@cognite/aura/chart';
import type { ChartConfig } from '@cognite/aura/chart';
import { Button } from '@cognite/aura/components/button';
import {
  SegmentedControl,
  SegmentedControlButton,
  SegmentedControlList,
} from '@cognite/aura/components/segmented-control';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import { IconChevronLeft, IconChevronRight } from '@cognite/aura/icons';
import { Fragment, useState } from 'react';
import { Area, Bar, CartesianGrid, ComposedChart, Line, ReferenceLine, XAxis, YAxis } from 'recharts';

import { DashboardFrame } from '../../../library/dashboards/DashboardFrame';
import { DashboardCell, DashboardGrid } from '../../../library/dashboards/DashboardGrid';
import { DashboardPanel } from '../../../library/dashboards/DashboardPanel';
import { LossWaterfall } from '../../../library/experiences/journeys/LossWaterfall';
import { Sparkline } from '../../../library/industrial/Sparkline';
import { formatValue } from '../../../library/industrial/status';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { ValueReadout } from '../../../library/industrial/ValueReadout';
import { ThemeScope } from '../../../library/themes/ThemeScope';
import { formatDate } from '../../data/series';
import { definePage } from '../../types';

import source from './production-performance.tsx?raw';

/** Gas export, March 2026. Twelve days are in; day 12 is today's forecast. Volumes in MSm³. */
const PERF_PLAN = 4.5;
const PERF_MONTH_DAYS = 31;
const PERF_UNIT = 'MSm³';

type PerfCauseId = 'planned' | 'trips' | 'capacity' | 'inlet' | 'other';

const PERF_CAUSES: readonly { id: PerfCauseId; label: string }[] = [
  { id: 'planned', label: 'Planned work' },
  { id: 'trips', label: 'Compressor trips' },
  { id: 'capacity', label: 'Cooler capacity' },
  { id: 'inlet', label: 'Inlet shortfall' },
  { id: 'other', label: 'Other' },
];

type PerfDay = {
  day: number;
  losses: Record<PerfCauseId, number>;
  /** How the day's loss fell on the day, evening and night shift; sums to 1. */
  shiftWeights: readonly [number, number, number];
  note?: string;
};

const PERF_EVEN: readonly [number, number, number] = [0.34, 0.33, 0.33];

const PERF_DAYS: readonly PerfDay[] = [
  { day: 1, losses: { planned: 0, trips: 0, capacity: 0.04, inlet: 0.02, other: 0.01 }, shiftWeights: PERF_EVEN },
  { day: 2, losses: { planned: 0, trips: 0, capacity: 0.05, inlet: 0, other: 0.02 }, shiftWeights: PERF_EVEN },
  { day: 3, losses: { planned: 0, trips: 0.86, capacity: 0.05, inlet: 0, other: 0.01 }, shiftWeights: [0.05, 0.1, 0.85], note: '1st stage compressor tripped for 4.5 hours on the night shift.' },
  { day: 4, losses: { planned: 0, trips: 0, capacity: 0.06, inlet: 0.03, other: 0.01 }, shiftWeights: PERF_EVEN },
  { day: 5, losses: { planned: 1.35, trips: 0, capacity: 0.06, inlet: 0, other: 0.01 }, shiftWeights: [0.6, 0.4, 0], note: 'Interstage cooler taken out for inspection; one train at reduced rate.' },
  { day: 6, losses: { planned: 1.62, trips: 0, capacity: 0.07, inlet: 0, other: 0.02 }, shiftWeights: [0.55, 0.45, 0], note: 'Cooler inspection continued; back at full rate from 22:00.' },
  { day: 7, losses: { planned: 0, trips: 0, capacity: 0.07, inlet: 0.05, other: 0.01 }, shiftWeights: PERF_EVEN },
  { day: 8, losses: { planned: 0, trips: 0, capacity: 0.08, inlet: 0, other: 0.01 }, shiftWeights: PERF_EVEN },
  { day: 9, losses: { planned: 0, trips: 0.42, capacity: 0.08, inlet: 0.02, other: 0.02 }, shiftWeights: [0.1, 0.8, 0.1], note: 'Recompressor trip on the evening shift; restarted after two hours.' },
  { day: 10, losses: { planned: 0, trips: 0, capacity: 0.09, inlet: 0, other: 0.01 }, shiftWeights: PERF_EVEN },
  { day: 11, losses: { planned: 0, trips: 0.16, capacity: 0.1, inlet: 0.02, other: 0.01 }, shiftWeights: [0.2, 0.2, 0.6] },
  { day: 12, losses: { planned: 0, trips: 0.02, capacity: 0.09, inlet: 0, other: 0.01 }, shiftWeights: [0.9, 0.05, 0.05], note: 'Today, forecast to midnight. Recompressor tripped at 13:46.' },
];

const perfRound = (value: number): number => Math.round(value * 100) / 100;
const perfDayLoss = (day: PerfDay): number => perfRound(PERF_CAUSES.reduce((sum, cause) => sum + day.losses[cause.id], 0));
const perfDayActual = (day: PerfDay): number => perfRound(PERF_PLAN - perfDayLoss(day));
const perfDayLabel = (day: number): string => formatDate(Date.UTC(2026, 2, day));

const PERF_LAST_DAY = PERF_DAYS.length;
const PERF_ACTUAL_TO_DATE = perfRound(PERF_DAYS.reduce((sum, day) => sum + perfDayActual(day), 0));
const PERF_PLAN_TO_DATE = perfRound(PERF_PLAN * PERF_LAST_DAY);
const PERF_PLAN_MONTH = perfRound(PERF_PLAN * PERF_MONTH_DAYS);
/** Run rate of the days without a trip or planned work, used for the forecast. */
const PERF_RUN_RATE = 4.36;
const PERF_FORECAST_MONTH = perfRound(PERF_ACTUAL_TO_DATE + PERF_RUN_RATE * (PERF_MONTH_DAYS - PERF_LAST_DAY));

const PERF_CAUSE_TOTALS = PERF_CAUSES.map((cause) => ({
  id: cause.id,
  label: cause.label,
  value: perfRound(PERF_DAYS.reduce((sum, day) => sum + day.losses[cause.id], 0)),
}));

type PerfChartRow = {
  day: string;
  plan: number;
  actual: number | null;
  forecast: number | null;
  gap: [number, number] | null;
  daily: number | null;
  dailySelected: number | null;
};

function perfChartRows(selectedDay: number, withForecast: boolean): PerfChartRow[] {
  let cumulative = 0;
  return Array.from({ length: PERF_MONTH_DAYS }, (_, index) => {
    const dayNumber = index + 1;
    const record = PERF_DAYS[index];
    const plan = perfRound(PERF_PLAN * dayNumber);
    if (record) cumulative = perfRound(cumulative + perfDayActual(record));
    const forecast = dayNumber >= PERF_LAST_DAY ? perfRound(PERF_ACTUAL_TO_DATE + PERF_RUN_RATE * (dayNumber - PERF_LAST_DAY)) : null;
    const lower = record ? cumulative : forecast;
    return {
      day: String(dayNumber),
      plan,
      actual: record ? cumulative : null,
      forecast: withForecast ? forecast : null,
      gap: lower !== null && (record || withForecast) ? [lower, plan] : null,
      daily: record && dayNumber !== selectedDay ? perfDayActual(record) : null,
      dailySelected: record && dayNumber === selectedDay ? perfDayActual(record) : null,
    };
  });
}

const PERF_CHART_CONFIG = {
  actual: { label: 'Actual, cumulative', color: chartSeriesColor(1) },
  forecast: { label: 'Forecast, cumulative', color: chartSeriesColor(1) },
  plan: { label: 'Plan, cumulative', color: 'var(--color-muted-foreground)' },
  daily: { label: 'Daily production', color: 'var(--color-chart-neutral-300)' },
  dailySelected: { label: 'Daily production', color: chartSeriesColor(1) },
} satisfies ChartConfig;

const PERF_SHIFTS = [
  { id: 'day', label: 'Day', hours: '06–14', lead: 'Liv Wold' },
  { id: 'evening', label: 'Evening', hours: '14–22', lead: 'Ingrid Haugen' },
  { id: 'night', label: 'Night', hours: '22–06', lead: 'Magnus Solberg' },
] as const;

const PERF_SHIFT_PLAN = PERF_PLAN / PERF_SHIFTS.length;

function perfShiftSplit(day: PerfDay): number[] {
  const loss = perfDayLoss(day);
  return day.shiftWeights.map((weight) => perfRound(PERF_SHIFT_PLAN - loss * weight));
}

const PERF_SHIFT_SCORES = PERF_SHIFTS.map((shift, index) => {
  const produced = perfRound(PERF_DAYS.reduce((sum, day) => sum + (perfShiftSplit(day)[index] ?? 0), 0));
  const plan = perfRound(PERF_SHIFT_PLAN * PERF_LAST_DAY);
  const daily = PERF_DAYS.map((day) => perfShiftSplit(day)[index] ?? 0);
  return { ...shift, daily, produced, lost: perfRound(plan - produced), attainment: (produced / plan) * 100 };
}).sort((a, b) => b.attainment - a.attainment);

function perfWorstDay(cause: PerfCauseId): PerfDay {
  return PERF_DAYS.reduce((worst, day) => (day.losses[cause] > worst.losses[cause] ? day : worst), PERF_DAYS[0]);
}

function ProdPerfDashHeroPanel({ selectedDay, onSelectDay, withForecast }: { selectedDay: number; onSelectDay: (day: number) => void; withForecast: boolean }) {
  const rows = perfChartRows(selectedDay, withForecast);
  const behind = perfRound(PERF_PLAN_TO_DATE - PERF_ACTUAL_TO_DATE);

  return (
    <DashboardPanel
      title="Cumulative gas export"
      description="March, actual against plan · bars are daily production · click a day to inspect it"
      footnote={`After ${PERF_LAST_DAY} days the plant has exported ${formatValue(PERF_ACTUAL_TO_DATE, 2)} ${PERF_UNIT}, ${formatValue(behind, 2)} behind plan; at the current run rate the month ends at ${formatValue(PERF_FORECAST_MONTH, 1)} of ${formatValue(PERF_PLAN_MONTH, 1)} ${PERF_UNIT}.`}
    >
      <div className="h-96 w-full cursor-pointer">
        <ChartContainer
          config={PERF_CHART_CONFIG}
          className="aspect-auto h-full w-full"
          aria-label={`Cumulative gas export in March against plan. ${formatValue(PERF_ACTUAL_TO_DATE, 2)} of ${formatValue(PERF_PLAN_TO_DATE, 1)} million standard cubic metres planned to date. Day ${selectedDay} is selected.`}
        >
          <ComposedChart
            data={rows}
            margin={{ top: 8, right: 0, bottom: 0, left: 0 }}
            onClick={(state) => {
              const day = Number(state.activeLabel);
              if (Number.isInteger(day) && day >= 1 && day <= PERF_LAST_DAY) onSelectDay(day);
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis dataKey="day" tickLine={false} axisLine={false} ticks={['1', '5', '10', '15', '20', '25', '31']} />
            {/* The two axes share the plot: daily bars fill the band below the cumulative zero line, so
                4.5 on the right axis (a full day at plan) sits exactly where the cumulative lines start. */}
            <YAxis yAxisId="cumulative" domain={[-45, 150]} ticks={[0, 50, 100, 150]} tickLine={false} axisLine={false} width={36} />
            <YAxis yAxisId="daily" orientation="right" domain={[0, 19.5]} ticks={[0, 2.25, 4.5]} tickLine={false} axisLine={false} width={36} />
            <ChartTooltip content={<ChartTooltipContent labelFormatter={(label) => perfDayLabel(Number(label))} />} />
            <Bar yAxisId="daily" dataKey="daily" stackId="daily" fill="var(--color-daily)" radius={2} isAnimationActive={false} />
            <Bar yAxisId="daily" dataKey="dailySelected" stackId="daily" fill="var(--color-dailySelected)" radius={2} isAnimationActive={false} />
            <Area
              yAxisId="cumulative"
              dataKey="gap"
              type="linear"
              stroke="none"
              fill="var(--color-actual)"
              fillOpacity={0.14}
              tooltipType="none"
              connectNulls={false}
              isAnimationActive={false}
            />
            <Line yAxisId="cumulative" dataKey="plan" type="linear" stroke="var(--color-plan)" strokeDasharray="5 4" strokeWidth={1.5} dot={false} isAnimationActive={false} />
            <Line yAxisId="cumulative" dataKey="forecast" type="linear" stroke="var(--color-forecast)" strokeDasharray="2 4" strokeWidth={2} dot={false} isAnimationActive={false} />
            <Line yAxisId="cumulative" dataKey="actual" type="linear" stroke="var(--color-actual)" strokeWidth={2.5} dot={false} isAnimationActive={false} />
            <ReferenceLine yAxisId="cumulative" x={String(selectedDay)} stroke="var(--color-actual)" strokeWidth={1} />
          </ComposedChart>
        </ChartContainer>
      </div>
      <ul aria-label="Chart key" className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
        <li className="inline-flex items-center gap-2">
          <span aria-hidden className="w-5 border-t-2 border-chart-1-450" /> Actual, cumulative
        </li>
        <li className="inline-flex items-center gap-2">
          <span aria-hidden className="w-5 border-t-2 border-dashed border-emphasized" /> Plan, cumulative
        </li>
        {withForecast ? (
          <li className="inline-flex items-center gap-2">
            <span aria-hidden className="w-5 border-t-2 border-dotted border-chart-1-450" /> Forecast at {formatValue(PERF_RUN_RATE, 2)} {PERF_UNIT}/d
          </li>
        ) : null}
        <li className="inline-flex items-center gap-2">
          <span aria-hidden className="size-2.5 rounded-xs bg-chart-1-100" /> Shortfall
        </li>
        <li className="inline-flex items-center gap-2">
          <span aria-hidden className="size-2.5 rounded-xs bg-chart-neutral-300" /> Daily production, right axis
        </li>
      </ul>
    </DashboardPanel>
  );
}

function ProdPerfDashDayRail({ selectedDay, onSelectDay }: { selectedDay: number; onSelectDay: (day: number) => void }) {
  const day = PERF_DAYS[selectedDay - 1] ?? PERF_DAYS[0];
  const actual = perfDayActual(day);
  const loss = perfDayLoss(day);
  const split = perfShiftSplit(day);
  const largest = Math.max(...PERF_CAUSES.map((cause) => day.losses[cause.id]), 0.01);

  return (
    <DashboardPanel
      title={perfDayLabel(day.day)}
      description={day.day === PERF_LAST_DAY ? 'Today, forecast' : `Day ${day.day} of ${PERF_MONTH_DAYS}`}
      actions={
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button variant="ghost" size="icon-sm" aria-label="Previous day" disabled={day.day <= 1} onClick={() => onSelectDay(day.day - 1)}>
                  <IconChevronLeft />
                </Button>
              }
            />
            <TooltipContent>Previous day</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button variant="ghost" size="icon-sm" aria-label="Next day" disabled={day.day >= PERF_LAST_DAY} onClick={() => onSelectDay(day.day + 1)}>
                  <IconChevronRight />
                </Button>
              }
            />
            <TooltipContent>Next day</TooltipContent>
          </Tooltip>
        </div>
      }
    >
      <div className="flex flex-col gap-1">
        <p className="text-xs text-muted-foreground">Production</p>
        <ValueReadout value={actual} unit={PERF_UNIT} decimals={2} size="lg" />
        <p className="text-xs text-muted-foreground tabular-nums">
          {formatValue((actual / PERF_PLAN) * 100, 1)}% of the {formatValue(PERF_PLAN, 2)} plan · {formatValue(loss, 2)} lost
        </p>
      </div>

      <div className="flex flex-col gap-2 border-t border-default pt-3">
        <p className="text-xs font-medium text-muted-foreground">Losses by cause</p>
        <ul className="flex flex-col gap-2">
          {PERF_CAUSES.map((cause) => {
            const value = day.losses[cause.id];
            return (
              <li key={cause.id} className="flex flex-col gap-1">
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span className={value > 0 ? 'text-base-foreground' : 'text-muted-foreground'}>{cause.label}</span>
                  <span className={`tabular-nums ${value > 0 ? 'text-base-foreground' : 'text-muted-foreground'}`}>{value > 0 ? formatValue(value, 2) : '—'}</span>
                </div>
                <div aria-hidden className="h-1 w-full rounded-full bg-chart-neutral-100">
                  <div className="h-1 rounded-full bg-chart-1-450" style={{ width: `${(value / largest) * 100}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="flex flex-col gap-2 border-t border-default pt-3">
        <p className="text-xs font-medium text-muted-foreground">Shift split</p>
        <ul className="flex flex-col gap-1.5">
          {PERF_SHIFTS.map((shift, index) => (
            <li key={shift.id} className="flex items-baseline justify-between gap-2 text-sm">
              <span className="text-base-foreground">
                {shift.label} <span className="text-xs text-muted-foreground tabular-nums">{shift.hours}</span>
              </span>
              <span className="tabular-nums text-base-foreground">{formatValue(split[index] ?? 0, 2)}</span>
            </li>
          ))}
        </ul>
      </div>

      {day.note ? <p className="border-t border-default pt-3 text-xs text-medium-foreground">{day.note}</p> : null}
    </DashboardPanel>
  );
}

function ProdPerfDashWaterfallPanel({
  cause,
  onSelectCause,
  onSelectDay,
}: {
  cause: PerfCauseId | null;
  onSelectCause: (cause: PerfCauseId) => void;
  onSelectDay: (day: number) => void;
}) {
  const selected = PERF_CAUSE_TOTALS.find((entry) => entry.id === cause);
  const worst = cause ? perfWorstDay(cause) : null;
  const affected = cause ? PERF_DAYS.filter((day) => day.losses[cause] > 0).length : 0;

  return (
    <DashboardPanel
      title="Loss waterfall"
      description={`Month to date, plan to actual in ${PERF_UNIT} · select a loss to trace it`}
      footnote={
        selected && worst && cause
          ? `${selected.label}: ${formatValue(selected.value, 2)} ${PERF_UNIT} over ${affected} ${affected === 1 ? 'day' : 'days'}, most on ${perfDayLabel(worst.day)} (${formatValue(worst.losses[cause], 2)}).`
          : `Planned work and compressor trips make up ${formatValue(((PERF_CAUSE_TOTALS[0]?.value ?? 0) + (PERF_CAUSE_TOTALS[1]?.value ?? 0)) / (PERF_PLAN_TO_DATE - PERF_ACTUAL_TO_DATE) * 100, 0)}% of the shortfall.`
      }
      actions={
        worst ? (
          <Button variant="ghost" size="sm" onClick={() => onSelectDay(worst.day)}>
            Show worst day
          </Button>
        ) : undefined
      }
    >
      <LossWaterfall
        start={{ id: 'plan', label: 'Plan', value: PERF_PLAN_TO_DATE }}
        losses={PERF_CAUSE_TOTALS}
        endLabel="Actual"
        endId="actual"
        unit={PERF_UNIT}
        decimals={2}
        floorStep={5}
        label="Month-to-date gas export, plan to actual"
        selectedId={cause}
        onSelect={(id) => {
          const match = PERF_CAUSES.find((entry) => entry.id === id);
          if (match) onSelectCause(match.id);
        }}
      />
    </DashboardPanel>
  );
}

function ProdPerfDashShiftPanel() {
  return (
    <DashboardPanel title="Shift scoreboard" description="Month to date, best attainment first"
      footnote="Bars are daily production per shift, 1 to 12 March, on a scale of 0 to the 1.50 MSm³ shift plan. Losses are booked to the shift they fell on.">
      <table className="w-full table-fixed text-left text-sm">
        <thead>
          <tr className="text-xs text-muted-foreground">
            <th scope="col" className="w-6 pb-2 font-medium">
              <span className="sr-only">Rank</span>
            </th>
            <th scope="col" className="pb-2 pr-3 font-medium">
              Shift
            </th>
            <th scope="col" className="w-20 pb-2 pr-3 text-right font-medium">
              Produced
            </th>
            <th scope="col" className="w-14 pb-2 pr-3 text-right font-medium">
              Lost
            </th>
            <th scope="col" className="w-16 pb-2 text-right font-medium">
              Of plan
            </th>
          </tr>
        </thead>
        <tbody>
          {PERF_SHIFT_SCORES.map((shift, index) => (
            <Fragment key={shift.id}>
              <tr className="border-t border-default align-top">
                <td className="pt-3 tabular-nums text-muted-foreground">{index + 1}</td>
                <td className="pt-3 pr-3">
                  <p className="font-medium text-base-foreground">
                    {shift.label} <span className="text-xs font-normal text-muted-foreground tabular-nums">{shift.hours}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{shift.lead}</p>
                </td>
                <td className="pt-3 pr-3 text-right tabular-nums text-base-foreground">{formatValue(shift.produced, 2)}</td>
                <td className="pt-3 pr-3 text-right tabular-nums text-medium-foreground">{formatValue(shift.lost, 2)}</td>
                <td className="pt-3 text-right tabular-nums text-base-foreground">{formatValue(shift.attainment, 1)}%</td>
              </tr>
              <tr>
                <td />
                <td colSpan={4} className="pt-2 pb-3">
                  <Sparkline
                    values={shift.daily}
                    label={`${shift.label} shift, daily production 1 to ${PERF_LAST_DAY} March`}
                    variant="bar"
                    height={28}
                    domain={[0, PERF_SHIFT_PLAN]}
                    unit={PERF_UNIT}
                    decimals={2}
                  />
                </td>
              </tr>
            </Fragment>
          ))}
        </tbody>
      </table>
    </DashboardPanel>
  );
}

function ProdPerfDashDashboard() {
  // Archetype: hero chart with a narrow side rail. One chart owns the screen; the rail beside it
  //   is its inspector, and two supporting panels sit underneath. No headline tile row.
  // Dominant element: the cumulative actual-against-plan chart for the month, with the shortfall
  //   shaded and daily production as bars along its foot.
  // Interaction: select a day (click the chart, or step with the rail's arrows) and the rail
  //   shows that day's production, losses by cause and shift split; select a loss in the
  //   waterfall to trace it and jump to its worst day; switch the forecast on or off.
  const [selectedDay, setSelectedDay] = useState(6);
  const [cause, setCause] = useState<PerfCauseId | null>(null);
  const [view, setView] = useState('forecast');
  const attainment = (PERF_ACTUAL_TO_DATE / PERF_PLAN_TO_DATE) * 100;

  return (
    <DashboardFrame
      title="Production performance"
      subtitle={`Nordkapp gas export · March 2026 · day ${PERF_LAST_DAY} of ${PERF_MONTH_DAYS}`}
      status={<StatusIndicator tone="warning" label={`${formatValue(attainment, 1)}% of plan to date`} shape="square" />}
      actions={
        <SegmentedControl value={view} onValueChange={(value) => setView(String(value))}>
          <SegmentedControlList size="small" aria-label="Chart extent">
            <SegmentedControlButton value="to-date">To date</SegmentedControlButton>
            <SegmentedControlButton value="forecast">With forecast</SegmentedControlButton>
          </SegmentedControlList>
        </SegmentedControl>
      }
    >
      <DashboardGrid>
        <DashboardCell span={9}>
          <ProdPerfDashHeroPanel selectedDay={selectedDay} onSelectDay={setSelectedDay} withForecast={view === 'forecast'} />
        </DashboardCell>
        <DashboardCell span={3}>
          <ProdPerfDashDayRail selectedDay={selectedDay} onSelectDay={setSelectedDay} />
        </DashboardCell>
        <DashboardCell span={7}>
          <ProdPerfDashWaterfallPanel cause={cause} onSelectCause={setCause} onSelectDay={setSelectedDay} />
        </DashboardCell>
        <DashboardCell span={5}>
          <ProdPerfDashShiftPanel />
        </DashboardCell>
      </DashboardGrid>
    </DashboardFrame>
  );
}

function ProdPerfDashSignature() {
  return (
    <ThemeScope preset="nordic" className="w-full">
      <ProdPerfDashDashboard />
    </ThemeScope>
  );
}

function ProdPerfDashAura() {
  return (
    <ThemeScope preset="aura" className="w-full">
      <ProdPerfDashDashboard />
    </ThemeScope>
  );
}

function ProdPerfDashDenseData() {
  return (
    <ThemeScope preset="dense-data" className="w-full">
      <ProdPerfDashDashboard />
    </ThemeScope>
  );
}

function ProdPerfDashControlRoom() {
  return (
    <ThemeScope preset="control-room" className="w-full">
      <ProdPerfDashDashboard />
    </ThemeScope>
  );
}

function ProdPerfDashPanelHero() {
  const [selectedDay, setSelectedDay] = useState(3);

  return <ProdPerfDashHeroPanel selectedDay={selectedDay} onSelectDay={setSelectedDay} withForecast />;
}

function ProdPerfDashPanelDayRail() {
  const [selectedDay, setSelectedDay] = useState(5);

  return <ProdPerfDashDayRail selectedDay={selectedDay} onSelectDay={setSelectedDay} />;
}

function ProdPerfDashPanelWaterfall() {
  const [cause, setCause] = useState<PerfCauseId | null>('trips');

  return <ProdPerfDashWaterfallPanel cause={cause} onSelectCause={setCause} onSelectDay={() => undefined} />;
}

function ProdPerfDashPanelShifts() {
  return <ProdPerfDashShiftPanel />;
}

function ProdPerfDashPanelToDate() {
  const [selectedDay, setSelectedDay] = useState(9);

  return <ProdPerfDashHeroPanel selectedDay={selectedDay} onSelectDay={setSelectedDay} withForecast={false} />;
}

function ProdPerfDashPanelQuietDay() {
  const [selectedDay, setSelectedDay] = useState(8);

  return <ProdPerfDashDayRail selectedDay={selectedDay} onSelectDay={setSelectedDay} />;
}

export default definePage({
  id: 'production-performance',
  title: 'Production performance',
  summary:
    'How the month is going against plan, and why. One large cumulative chart carries the story; select a day and the side rail explains it, while a loss waterfall and a shift scoreboard account for the shortfall.',
  guidance: {
    use: [
      'For the daily production meeting and the monthly review, where plan against actual is the question.',
      'When one chart deserves most of the screen and everything else explains it.',
      'Let a selection in the chart drive the rail, so detail never needs a second page.',
      'Shade the gap between plan and actual; two near-parallel lines are hard to compare.',
    ],
    avoid: [
      'A row of headline tiles above the chart; the chart is the headline.',
      'More than five loss categories. Group the tail into "Other".',
      'Status colour on a normal day. A shortfall is data until someone judges it.',
      'A waterfall whose axis is cut without saying so.',
    ],
  },
  source,
  sections: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description: 'Shown in the Nordic theme. Click a day in the chart or step with the arrows in the rail; select a loss in the waterfall to trace it.',
      specimens: [
        {
          id: 'ProdPerfDashSignature',
          title: 'Production performance',
          note: 'Pick it when a production team steers by one plan-against-actual curve and needs the reasons one click away.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'dashboards/DashboardFrame.tsx',
            'dashboards/DashboardGrid.tsx',
            'dashboards/DashboardPanel.tsx',
            'experiences/journeys/LossWaterfall.tsx',
            'experiences/journeys/waterfallSteps.ts',
            'industrial/StatusIndicator.tsx',
            'industrial/ValueReadout.tsx',
            'themes/ThemeScope.tsx',
          ],
          Component: ProdPerfDashSignature,
        },
      ],
    },
    {
      id: 'themes',
      title: 'In other themes',
      description: 'The same dashboard, unchanged, in three more presets.',
      specimens: [
        {
          id: 'ProdPerfDashAura',
          title: 'Aura',
          note: 'Pick it when the dashboard lives among other Fusion pages and should not stand apart.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['themes/ThemeScope.tsx', 'themes/themes.css'],
          Component: ProdPerfDashAura,
        },
        {
          id: 'ProdPerfDashDenseData',
          title: 'Dense data',
          note: 'Pick it for analysts who keep it open beside tables: compact spacing and sharp corners.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['themes/ThemeScope.tsx', 'themes/themes.css'],
          Component: ProdPerfDashDenseData,
        },
        {
          id: 'ProdPerfDashControlRoom',
          title: 'Control room',
          note: 'Pick it for the screen in the morning-meeting room or on the console: dark and high contrast.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['themes/ThemeScope.tsx', 'themes/themes.css'],
          Component: ProdPerfDashControlRoom,
        },
      ],
    },
    {
      id: 'panels',
      title: 'Panels',
      description: 'Each part on its own, ready to drop into another dashboard.',
      specimens: [
        {
          id: 'ProdPerfDashPanelHero',
          title: 'Cumulative chart',
          note: 'Pick it as the one dominant chart: cumulative actual against plan, with the shortfall shaded and a selectable day.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx'],
          Component: ProdPerfDashPanelHero,
        },
        {
          id: 'ProdPerfDashPanelDayRail',
          title: 'Day rail',
          note: 'Pick it as the inspector beside a chart: the selected day, its losses by cause and its shift split.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx', 'industrial/ValueReadout.tsx'],
          Component: ProdPerfDashPanelDayRail,
        },
        {
          id: 'ProdPerfDashPanelWaterfall',
          title: 'Loss waterfall',
          note: 'Pick it to account for a gap: plan, each loss category and what is left, with a selectable loss.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx', 'experiences/journeys/LossWaterfall.tsx', 'experiences/journeys/waterfallSteps.ts'],
          Component: ProdPerfDashPanelWaterfall,
        },
        {
          id: 'ProdPerfDashPanelShifts',
          title: 'Shift scoreboard',
          note: 'Pick it to compare a few teams on the same plan, ranked, with produced and lost volumes.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx'],
          Component: ProdPerfDashPanelShifts,
        },
        {
          id: 'ProdPerfDashPanelToDate',
          title: 'Chart without forecast',
          note: 'Pick it for a closed period or when no forecast is trusted; only what has happened is drawn.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx'],
          Component: ProdPerfDashPanelToDate,
        },
        {
          id: 'ProdPerfDashPanelQuietDay',
          title: 'Day rail, normal day',
          note: 'Pick it to check that the rail stays calm on a day with almost no loss.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx', 'industrial/ValueReadout.tsx'],
          Component: ProdPerfDashPanelQuietDay,
        },
      ],
    },
  ],
});
