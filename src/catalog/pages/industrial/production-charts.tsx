import { chartSeriesColor } from '@cognite/aura/chart';
import { Button } from '@cognite/aura/components/button';
import { useState } from 'react';

import { ChartCard } from '../../../library/data/ChartCard';
import { CategoryChart } from '../../../library/industrial/charts/CategoryChart';
import type { CategoryRow } from '../../../library/industrial/charts/CategoryChart';
import { ChartPlaceholder } from '../../../library/industrial/charts/ChartPlaceholder';
import { HeatMapGrid } from '../../../library/industrial/charts/HeatMapGrid';
import { ParetoChart } from '../../../library/industrial/charts/ParetoChart';
import { TimeRangeSwitch } from '../../../library/industrial/charts/TimeRangeSwitch';
import { TrendCard } from '../../../library/industrial/charts/TrendCard';
import { TrendChart } from '../../../library/industrial/charts/TrendChart';
import { formatReading } from '../../../library/industrial/status';
import { TrendDelta } from '../../../library/industrial/TrendDelta';
import { ValueReadout } from '../../../library/industrial/ValueReadout';
import { ASSETS, PLANT_KPIS } from '../../data/plant';
import { DAY, HOUR, REFERENCE_NOW, formatDate, makeSeries, makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './production-charts.tsx?raw';

const NOW = REFERENCE_NOW;
const TARGET = PLANT_KPIS.gasExport.target;
const SOFT_BAR = 'var(--color-chart-1-200)';
const PLAN_LINE = 'var(--color-chart-neutral-450)';
const SHORTFALL = 'var(--color-chart-warning-450)';

const round = (value: number, decimals = 2): number => Math.round(value * 10 ** decimals) / 10 ** decimals;
const sum = (values: readonly number[]): number => values.reduce((total, value) => total + value, 0);

/** Gas export per day for the last 28 days, MSm³. The recompressor trip on 8 March cost most of a day. */
const DAILY_EXPORT: readonly number[] = makeValues({ seed: 51, points: 28, base: 4.5, noise: 0.14, stepMs: DAY, decimals: 2 }).map((value, index) =>
  index === 23 ? 3.62 : index === 24 ? 4.05 : index === 27 ? PLANT_KPIS.gasExport.value : value
);
const DAY_LABELS: readonly string[] = DAILY_EXPORT.map((_, index) => formatDate(NOW - (27 - index) * DAY));

const LAST_14: CategoryRow[] = DAILY_EXPORT.slice(14).map((actual, index) => ({ category: DAY_LABELS[14 + index], actual, deviation: round(actual - TARGET) }));
const LAST_7 = LAST_14.slice(7);
const daysOnTarget = (days: readonly number[]): number => days.filter((value) => value >= TARGET).length;
const MET_14 = daysOnTarget(DAILY_EXPORT.slice(14));
const MONTH_ACTUAL = round(sum(DAILY_EXPORT.slice(16)), 1);
const MONTH_GAP = round(TARGET * 12 - MONTH_ACTUAL, 1);

/** March so far: running total against a plan of 4.5 MSm³ per day. */
const MONTH_TO_DATE: CategoryRow[] = Array.from({ length: 31 }, (_, index) => ({
  category: String(index + 1),
  plan: round(TARGET * (index + 1), 1),
  actual: index < 12 ? round(sum(DAILY_EXPORT.slice(16, 17 + index)), 1) : null,
}));

/** Hourly gas throughput, kSm³/h, against the 210 kSm³/h design capacity of the compression train. */
const THROUGHPUT = makeSeries({ seed: 16, points: 97, base: 184, amplitude: 14, noise: 4, cycles: 2, stepMs: HOUR / 4, max: 207, decimals: 0 }).map((point) => ({ t: point.t, v: point.v }));

const STREAMS: CategoryRow[] = [
  [2.4, 1.3, 0.5],
  [2.5, 1.4, 0.5],
  [2.0, 1.2, 0.4],
  [2.2, 1.4, 0.5],
  [2.7, 1.3, 0.5],
  [2.5, 1.4, 0.5],
  [2.5, 1.4, 0.5],
].map(([pipeline, lng, local], index) => ({ category: String(LAST_7[index].category), pipeline, lng, local }));

const SHIFTS: CategoryRow[] = [
  [1.52, 1.47, 1.43],
  [1.2, 1.31, 1.11],
  [1.38, 1.36, 1.31],
  [1.55, 1.5, 1.46],
  [1.49, 1.48, 1.41],
].map(([day, evening, night], index) => ({ category: String(LAST_7[index + 2].category), day, evening, night }));

/** Share of planned output delivered over the last 30 days, per piece of equipment. */
const ATTAINMENT: CategoryRow[] = ASSETS.filter((asset) => ['compressor', 'pump', 'turbine', 'exchanger'].includes(asset.type))
  .map((asset) => ({ category: asset.name, attainment: round(70 + asset.healthScore * 0.31, 1) }))
  .sort((a, b) => b.attainment - a.attainment);

const ENERGY: CategoryRow[] = makeValues({ seed: 57, points: 14, base: 31.6, noise: 0.7, drift: -1.2, stepMs: DAY, decimals: 1 }).map((intensity, index) => ({
  category: DAY_LABELS[14 + index],
  intensity: index === 9 ? 35.8 : index === 13 ? PLANT_KPIS.energyIntensity.value : intensity,
}));

const DOWNTIME_CAUSES = [
  { label: 'Compressor trip', value: 41 },
  { label: 'Planned maintenance', value: 26 },
  { label: 'Instrument fault', value: 14 },
  { label: 'Cooling water loss', value: 9 },
  { label: 'Power dip', value: 6 },
  { label: 'Operator stop', value: 4 },
  { label: 'Other', value: 3 },
];
const DOWNTIME_TOTAL = sum(DOWNTIME_CAUSES.map((cause) => cause.value));

const DOWNTIME_WEEKS: CategoryRow[] = [
  { category: 'Week 6', planned: 8, unplanned: 5 },
  { category: 'Week 7', planned: 4, unplanned: 9 },
  { category: 'Week 8', planned: 12, unplanned: 3 },
  { category: 'Week 9', planned: 2, unplanned: 7 },
  { category: 'Week 10', planned: 6, unplanned: 4 },
  { category: 'Week 11', planned: 0, unplanned: 31 },
];

/** OEE as a bridge from planned time to effective output, in percent of planned production time. */
const OEE_BRIDGE: CategoryRow[] = [
  { category: 'Planned time', span: [0, 100] },
  { category: 'Availability loss', span: [96.4, 100] },
  { category: 'Performance loss', span: [87, 96.4] },
  { category: 'Quality loss', span: [82.7, 87] },
  { category: 'OEE', span: [0, 82.7] },
];

const OEE_WEEKS: CategoryRow[] = [
  { category: 'Week 6', availability: 97.8, performance: 91.2, quality: 95.9 },
  { category: 'Week 7', availability: 97.1, performance: 90.4, quality: 96.3 },
  { category: 'Week 8', availability: 98.0, performance: 92.1, quality: 95.2 },
  { category: 'Week 9', availability: 97.4, performance: 91.6, quality: 96.0 },
  { category: 'Week 10', availability: 97.1, performance: 90.9, quality: 95.8 },
  { category: 'Week 11', availability: 96.4, performance: 90.2, quality: 95.5 },
];

const AVAILABILITY: CategoryRow[] = [98.2, 97.9, 98.4, 97.6, 98.1, 97.8, 98.3, 97.7, 98.0, 91.4, 94.8, 97.2, 97.5, 96.4].map((availability, index) => ({
  category: DAY_LABELS[14 + index],
  availability,
}));

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHLY_2025 = [136, 124, 138, 131, 118, 129, 137, 135, 126, 139, 133, 138];
const MONTHLY: CategoryRow[] = MONTHS.map((month, index) => ({
  category: month,
  monthly: MONTHLY_2025[index],
  ytd: sum(MONTHLY_2025.slice(0, index + 1)),
  ytdPlan: Math.round((1620 / 12) * (index + 1)),
}));

const ROLLING: CategoryRow[] = DAILY_EXPORT.map((actual, index) => ({
  category: DAY_LABELS[index],
  actual,
  average: index < 6 ? null : round(sum(DAILY_EXPORT.slice(index - 6, index + 1)) / 7),
}));

/** Today's bar only covers the 14 hours so far. */
const IN_PROGRESS: CategoryRow[] = LAST_7.map((row, index) => (index === 6 ? { category: 'Today', actual: 2.58 } : { category: row.category, actual: row.actual }));

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
/** 16 February was a Monday, so the 28 days fill four whole weeks ending on Sunday 15 March; the last three days have no data yet. */
const CALENDAR_WEEKS = ['16 Feb', '23 Feb', '2 Mar', '9 Mar'];
const CALENDAR_VALUES: (number | null)[][] = CALENDAR_WEEKS.map((_, week) =>
  WEEKDAYS.map((_day, day) => {
    const index = week * 7 + day + 3;
    return index < DAILY_EXPORT.length ? round((DAILY_EXPORT[index] / TARGET) * 100, 0) : null;
  })
);

function ProductionChartDailyVsTarget() {
  return (
    <CategoryChart
      label={`Gas export per day for the last 14 days against the 4.5 million cubic metre target; ${MET_14} days met it and 8 March fell to 3.62 after the recompressor trip`}
      rows={LAST_14}
      series={[{ key: 'actual', label: 'Gas export' }]}
      references={[{ value: TARGET, label: 'Target 4.5' }]}
      domain={[0, 5]}
      ticks={[0, 1, 2, 3, 4, 5]}
      labelEvery={2}
      unit="MSm³"
      decimals={2}
      summary={`${MET_14} of 14 days met the 4.5 MSm³ target; the low on 8 March follows the recompressor trip.`}
    />
  );
}

function ProductionChartDeviation() {
  return (
    <CategoryChart
      label="Deviation of daily gas export from target for the last 14 days; the largest shortfall is 0.88 million cubic metres on 8 March"
      rows={LAST_14}
      series={[{ key: 'deviation', label: 'Deviation from target' }]}
      colorOf={(row) => (typeof row.deviation === 'number' && row.deviation < -0.3 ? SHORTFALL : undefined)}
      references={[{ value: 0, label: 'Target', align: 'left' }]}
      domain={[-1, 0.5]}
      ticks={[-1, -0.5, 0, 0.5]}
      labelEvery={2}
      unit="MSm³"
      decimals={2}
      summary="Bars above the line beat the target. Shortfalls of more than 0.3 MSm³ are marked."
    />
  );
}

function ProductionChartCumulative() {
  return (
    <CategoryChart
      legend
      label={`Cumulative gas export in March against plan; after 12 days the total is ${MONTH_ACTUAL} against a plan of 54 million cubic metres`}
      rows={MONTH_TO_DATE}
      series={[
        { key: 'actual', label: 'Actual', type: 'area' },
        { key: 'plan', label: 'Plan', type: 'line', dashed: true, color: PLAN_LINE },
      ]}
      domain={[0, 150]}
      ticks={[0, 50, 100, 150]}
      labelEvery={5}
      unit="MSm³"
      decimals={1}
      summary={`${MONTH_GAP} MSm³ behind plan on day 12 of 31; most of the gap opened on 8 and 9 March.`}
    />
  );
}

function ProductionChartThroughputCapacity() {
  return (
    <TrendChart
      label="Gas throughput over the last 24 hours against the 210 thousand cubic metre per hour capacity; peak use is 98 percent"
      series={[{ key: 'throughput', label: 'Throughput', points: THROUGHPUT, variant: 'area', color: chartSeriesColor(2) }]}
      limits={[{ value: 210, label: 'Capacity 210', tone: 'neutral' }]}
      yDomain={[0, 240]}
      yTicks={[0, 60, 120, 180, 240]}
      unit="kSm³/h"
      decimals={0}
      summary="Running at 81 to 98 % of capacity; no headroom around the two daily peaks."
    />
  );
}

function ProductionChartStackedByStream() {
  return (
    <CategoryChart
      legend
      label="Gas export per day by stream for the last 7 days against plan; pipeline is the largest share and all three dipped on 8 March"
      rows={STREAMS}
      series={[
        { key: 'pipeline', label: 'Pipeline', stack: 'export' },
        { key: 'lng', label: 'LNG', stack: 'export' },
        { key: 'local', label: 'Local grid', stack: 'export' },
      ]}
      references={[{ value: TARGET, label: 'Plan 4.5' }]}
      domain={[0, 5]}
      ticks={[0, 1, 2, 3, 4, 5]}
      unit="MSm³"
      decimals={1}
    />
  );
}

function ProductionChartShiftComparison() {
  return (
    <CategoryChart
      legend
      label="Gas export per shift for 5 days; the night shift is lowest every day and all shifts dropped on 8 March"
      rows={SHIFTS}
      series={[
        { key: 'day', label: 'Day shift' },
        { key: 'evening', label: 'Evening shift' },
        { key: 'night', label: 'Night shift' },
      ]}
      domain={[0, 2]}
      ticks={[0, 0.5, 1, 1.5, 2]}
      unit="MSm³"
      decimals={2}
    />
  );
}

function ProductionChartTopBottom() {
  return (
    <CategoryChart
      layout="rows"
      valueLabels
      hideValueAxis
      label="Plan attainment by equipment for the last 30 days, best first; the recompressor is lowest at 82.7 percent"
      rows={ATTAINMENT}
      series={[{ key: 'attainment', label: 'Plan attainment' }]}
      colorOf={(row) => (typeof row.attainment === 'number' && row.attainment < 90 ? SHORTFALL : undefined)}
      domain={[0, 100]}
      unit="%"
      decimals={1}
      heightClassName="h-64"
      barSize={14}
      summary="Ranked best to worst. Equipment below 90 % attainment is marked."
    />
  );
}

function ProductionChartEnergyPerUnit() {
  return (
    <CategoryChart
      label="Energy used per barrel of oil equivalent for the last 14 days against the target of 30 kilowatt hours; it peaked at 35.8 on 8 March and is 31.2 today"
      rows={ENERGY}
      series={[{ key: 'intensity', label: 'Energy intensity', type: 'line', color: chartSeriesColor(3) }]}
      references={[{ value: PLANT_KPIS.energyIntensity.target, label: 'Target 30', align: 'left', below: true }]}
      domain={[28, 36]}
      ticks={[28, 30, 32, 34, 36]}
      labelEvery={2}
      unit="kWh/boe"
      decimals={1}
      summary="Lower is better. Energy per unit rises when output falls, as on 8 March."
    />
  );
}

function ProductionChartDowntimeByCause() {
  return (
    <CategoryChart
      layout="rows"
      valueLabels
      hideValueAxis
      label="Downtime by cause for the last 30 days; compressor trips lead with 41 of 103 hours"
      rows={DOWNTIME_CAUSES.map((cause) => ({ category: cause.label, hours: cause.value }))}
      series={[{ key: 'hours', label: 'Downtime' }]}
      unit="h"
      heightClassName="h-64"
      barSize={14}
    />
  );
}

function ProductionChartPareto() {
  return <ParetoChart legend wrapLabels label="Pareto of downtime by cause, last 30 days" rows={DOWNTIME_CAUSES} unit="h" valueLabel="Downtime" />;
}

function ProductionChartPlannedUnplanned() {
  return (
    <CategoryChart
      legend
      label="Planned and unplanned downtime per week for 6 weeks; week 11 has 31 unplanned hours from the recompressor trip"
      rows={DOWNTIME_WEEKS}
      series={[
        { key: 'planned', label: 'Planned', stack: 'downtime', color: 'var(--color-chart-neutral-300)' },
        { key: 'unplanned', label: 'Unplanned', stack: 'downtime', color: chartSeriesColor(1) },
      ]}
      domain={[0, 40]}
      ticks={[0, 10, 20, 30, 40]}
      unit="h"
    />
  );
}

function ProductionChartOeeBridge() {
  return (
    <CategoryChart
      valueLabels
      wrapLabels
      label="OEE loss breakdown: from 100 percent planned time, availability losses take 3.6, performance losses 9.4 and quality losses 4.3 points, leaving an OEE of 82.7 percent"
      rows={OEE_BRIDGE}
      series={[{ key: 'span', label: 'Share of planned time' }]}
      colorOf={(row) => (String(row.category).endsWith('loss') ? SOFT_BAR : undefined)}
      domain={[0, 100]}
      ticks={[0, 25, 50, 75, 100]}
      unit="%"
      decimals={1}
      summary="Performance is the largest loss: 9.4 of the 17.3 points between planned time and OEE."
    />
  );
}

function ProductionChartOeeComponents() {
  return (
    <CategoryChart
      legend
      label="Availability, performance and quality per week for 6 weeks; all three are slightly down in week 11"
      rows={OEE_WEEKS}
      series={[
        { key: 'availability', label: 'Availability', type: 'line' },
        { key: 'performance', label: 'Performance', type: 'line' },
        { key: 'quality', label: 'Quality', type: 'line' },
      ]}
      domain={[85, 100]}
      ticks={[85, 90, 95, 100]}
      unit="%"
      decimals={1}
    />
  );
}

function ProductionChartAvailability() {
  return (
    <CategoryChart
      label="Plant availability per day for the last 14 days against the 97.5 percent target; it fell to 91.4 on 8 March and is 96.4 today"
      rows={AVAILABILITY}
      series={[{ key: 'availability', label: 'Availability', type: 'line' }]}
      references={[{ value: PLANT_KPIS.availability.target, label: 'Target 97.5', align: 'left', below: true }]}
      domain={[90, 100]}
      ticks={[90, 92.5, 95, 97.5, 100]}
      labelEvery={2}
      unit="%"
      decimals={1}
      summary="Above target on 9 of 14 days; four days below since the trip on 8 March."
    />
  );
}

function ProductionChartMonthlyYtd() {
  return (
    <CategoryChart
      legend
      label="Monthly gas export for 2025 on the left axis with the year-to-date total and plan on the right axis; the year closed at 1,584 against a plan of 1,620 million cubic metres"
      rows={MONTHLY}
      series={[
        { key: 'monthly', label: 'Monthly export', color: SOFT_BAR },
        { key: 'ytd', label: 'Year to date', type: 'line', axis: 'right', color: chartSeriesColor(1) },
        { key: 'ytdPlan', label: 'Year-to-date plan', type: 'line', dashed: true, axis: 'right', color: PLAN_LINE },
      ]}
      domain={[0, 160]}
      ticks={[0, 40, 80, 120, 160]}
      rightDomain={[0, 1800]}
      unit="MSm³ per month"
      rightUnit="MSm³ to date"
      summary="2025 closed 36 MSm³ (2.2 %) under plan; the gap opened during the May turnaround."
    />
  );
}

function ProductionChartRollingAverage() {
  return (
    <CategoryChart
      legend
      label="Gas export per day for the last 28 days with a 7-day rolling average; the average dips after the trip on 8 March"
      rows={ROLLING}
      series={[
        { key: 'actual', label: 'Daily export', color: SOFT_BAR },
        { key: 'average', label: '7-day average', type: 'line', color: chartSeriesColor(1) },
      ]}
      references={[{ value: TARGET, label: 'Target 4.5', align: 'left' }]}
      domain={[0, 5]}
      ticks={[0, 1, 2, 3, 4, 5]}
      labelEvery={7}
      unit="MSm³"
      decimals={2}
    />
  );
}

function ProductionChartCalendar() {
  return (
    <HeatMapGrid
      showValues
      label="Daily gas export as percent of target for the four weeks from 16 February; most days are between 96 and 102 percent, 8 March is lowest at 80"
      rows={CALENDAR_WEEKS}
      columns={WEEKDAYS}
      values={CALENDAR_VALUES}
      domain={[88, 104]}
      unit="%"
      cellClassName="h-9"
      rowLabelClassName="w-14"
      legend={{ title: 'Percent of daily target', low: '88 or less', high: '104', empty: 'Not yet reported' }}
      summary="Rows are weeks starting on the date shown. The dip on Sunday 8 March is the recompressor trip."
    />
  );
}

function ProductionChartInProgress() {
  return (
    <CategoryChart
      valueLabels
      label="Gas export per day for the last 7 days; today shows 2.58 million cubic metres after 14 of 24 hours"
      rows={IN_PROGRESS}
      series={[{ key: 'actual', label: 'Gas export' }]}
      colorOf={(row) => (row.category === 'Today' ? SOFT_BAR : undefined)}
      references={[{ value: TARGET, label: 'Target 4.5', below: true }]}
      domain={[0, 5]}
      ticks={[0, 1, 2, 3, 4, 5]}
      decimals={2}
      unit="MSm³"
      summary="Today is still filling: 2.58 MSm³ by 14:00, on pace for 4.4 MSm³."
    />
  );
}

function ProductionChartValueLabels() {
  return (
    <CategoryChart
      valueLabels
      hideValueAxis
      label="Gas export per day for the last 5 days in million cubic metres, between 3.62 and 4.52"
      rows={LAST_7.slice(2)}
      series={[{ key: 'actual', label: 'Gas export' }]}
      domain={[0, 5]}
      decimals={2}
      heightClassName="h-44"
    />
  );
}

function ProductionChartLoading() {
  return <ChartPlaceholder state="loading" title="Loading production figures" heightClassName="h-44" />;
}

function ProductionChartEmpty() {
  return (
    <ChartPlaceholder
      state="empty"
      heightClassName="h-52"
      title="No production reported"
      description="Nothing is booked for 13 March yet."
      action={
        <Button variant="secondary" size="sm">
          Show last week
        </Button>
      }
    />
  );
}

function ProductionChartWithHeader() {
  const kpi = PLANT_KPIS.gasExport;
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <span className="text-xs text-muted-foreground">Gas export · today</span>
          <ValueReadout value={kpi.value} unit={kpi.unit} decimals={2} size="lg" />
        </div>
        <TrendDelta value={kpi.value} reference={kpi.target} decimals={2} unit={kpi.unit} goodDirection="up" caption="vs target" />
      </div>
      <CategoryChart
        label="Gas export per day for the last 14 days against the 4.5 million cubic metre target, latest 4.38"
        rows={LAST_14}
        series={[{ key: 'actual', label: 'Gas export' }]}
        references={[{ value: TARGET, label: 'Target 4.5', align: 'left' }]}
        domain={[0, 5]}
        ticks={[0, 2.5, 5]}
        labelEvery={2}
        decimals={2}
        heightClassName="h-40"
      />
    </div>
  );
}

function ProductionChartDowntimeCard() {
  return (
    <TrendCard
      title="Downtime"
      description="Nordkapp plant · last 30 days"
      reading={{ value: DOWNTIME_TOTAL, unit: 'h', decimals: 0 }}
      delta={{ reference: 71, caption: 'vs previous 30 days', goodDirection: 'down', decimals: 0 }}
      summary="Compressor trips and planned maintenance make up 65 % of the 103 hours."
    >
      <CategoryChart
        layout="rows"
        valueLabels
        hideValueAxis
        label="Downtime by cause for the last 30 days; compressor trips lead with 41 hours"
        rows={DOWNTIME_CAUSES.slice(0, 5).map((cause) => ({ category: cause.label, hours: cause.value }))}
        series={[{ key: 'hours', label: 'Downtime' }]}
        unit="h"
        heightClassName="h-44"
        barSize={12}
      />
    </TrendCard>
  );
}

const OVERVIEW_RANGES = [
  { value: '7d', label: '7 d', name: 'Last 7 days' },
  { value: '14d', label: '14 d', name: 'Last 14 days' },
  { value: '28d', label: '28 d', name: 'Last 28 days' },
];

function ProductionChartOverviewCard() {
  const [range, setRange] = useState('14d');
  const days = range === '7d' ? 7 : range === '14d' ? 14 : 28;
  const window = DAILY_EXPORT.slice(-days);
  const rows = window.map((actual, index) => ({ category: DAY_LABELS[DAY_LABELS.length - days + index], actual }));
  const met = daysOnTarget(window);

  return (
    <ChartCard
      title="Gas export"
      description={`Nordkapp plant · last ${days} days`}
      actions={<TimeRangeSwitch options={OVERVIEW_RANGES} value={range} onValueChange={setRange} />}
      series={[
        { key: 'actual', label: 'Daily export', color: chartSeriesColor(1) },
        { key: 'plan', label: 'Plan, 4.5 MSm³ per day', color: PLAN_LINE },
      ]}
      summary={`${formatReading(sum(window), 'MSm³', 1)} exported against a plan of ${formatReading(TARGET * days, 'MSm³', 1)}; ${met} of ${days} days met the daily target.`}
    >
      <CategoryChart
        label={`Gas export per day for the last ${days} days against the plan of 4.5 million cubic metres per day; ${met} days met it`}
        rows={rows}
        series={[{ key: 'actual', label: 'Daily export' }]}
        references={[{ value: TARGET, label: 'Plan 4.5' }]}
        domain={[0, 5]}
        ticks={[0, 1, 2, 3, 4, 5]}
        labelEvery={days === 28 ? 3 : 1}
        unit="MSm³"
        decimals={2}
        heightClassName="h-64"
      />
    </ChartCard>
  );
}

export default definePage({
  id: 'production-charts',
  title: 'Production charts',
  summary:
    'Output, losses and downtime per day, shift, stream and cause. Bars for amounts per period, lines for rates and running totals, and a dashed line for whatever the result is measured against.',
  guidance: {
    use: [
      'Start bars at zero and draw the target, plan or capacity as a dashed, labelled line.',
      'Sort rankings and downtime causes largest first, and print the values when there are few bars.',
      'Use one colour per series and a status colour only for the bars that miss by more than the tolerance.',
      'State the period and the finding under the chart: how many days met target, what caused the dip.',
    ],
    avoid: [
      'Colouring every bar green or red against target; the eye should land on the exceptions.',
      'Stacking more than four parts, or stacking parts that do not add up to a meaningful total.',
      'Truncating the value axis of a bar chart; switch to a line when the detail is near the top.',
      'Comparing an unfinished day with full days without marking it as in progress.',
    ],
  },
  source,
  sections: [
    {
      id: 'against-target',
      title: 'Output against target',
      description: 'What was produced, and how that compares with the plan or the capacity.',
      specimens: [
        {
          id: 'ProductionChartDailyVsTarget',
          title: 'Daily bars with target line',
          note: 'Pick it as the default production view: one bar per day and the daily target as a line.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/CategoryChart.tsx'],
          Component: ProductionChartDailyVsTarget,
        },
        {
          id: 'ProductionChartDeviation',
          title: 'Deviation from target',
          note: 'Pick it when the gap is the message: bars grow up or down from the target line.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/CategoryChart.tsx'],
          Component: ProductionChartDeviation,
        },
        {
          id: 'ProductionChartCumulative',
          title: 'Cumulative actual and plan',
          note: 'Pick it for month and year targets, where the question is whether the total will be reached.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/CategoryChart.tsx'],
          Component: ProductionChartCumulative,
        },
        {
          id: 'ProductionChartThroughputCapacity',
          title: 'Throughput against capacity',
          note: 'Pick it to show how much headroom is left; capacity is a neutral line, not an alarm limit.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/TrendChart.tsx'],
          Component: ProductionChartThroughputCapacity,
        },
      ],
    },
    {
      id: 'breakdowns',
      title: 'Breakdowns and comparisons',
      description: 'The same output split by stream, shift or equipment.',
      specimens: [
        {
          id: 'ProductionChartStackedByStream',
          title: 'Stacked by stream',
          note: 'Pick it when the parts add up to the total and both the total and the mix matter.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/CategoryChart.tsx'],
          Component: ProductionChartStackedByStream,
        },
        {
          id: 'ProductionChartShiftComparison',
          title: 'Shift comparison',
          note: 'Pick grouped bars to compare two or three groups side by side within each day.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/CategoryChart.tsx'],
          Component: ProductionChartShiftComparison,
        },
        {
          id: 'ProductionChartTopBottom',
          title: 'Top and bottom performers',
          note: 'Pick a sorted row chart for rankings; long names fit and the worst performers are marked.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/CategoryChart.tsx'],
          Component: ProductionChartTopBottom,
        },
        {
          id: 'ProductionChartEnergyPerUnit',
          title: 'Energy per unit produced',
          note: 'Pick a line for an intensity or rate, where the level matters more than the amount.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/CategoryChart.tsx'],
          Component: ProductionChartEnergyPerUnit,
        },
      ],
    },
    {
      id: 'downtime-and-losses',
      title: 'Downtime and losses',
      description: 'Where the output went: stops, their causes and the OEE losses.',
      specimens: [
        {
          id: 'ProductionChartDowntimeByCause',
          title: 'Downtime by cause',
          note: 'Pick it to answer "what stopped us" at a glance, with the hours printed on each bar.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/CategoryChart.tsx'],
          Component: ProductionChartDowntimeByCause,
        },
        {
          id: 'ProductionChartPareto',
          title: 'Pareto',
          note: 'Pick it to decide what to fix first: the causes behind the first 80 % are drawn strongest.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/ParetoChart.tsx', 'industrial/charts/stats.ts'],
          Component: ProductionChartPareto,
        },
        {
          id: 'ProductionChartPlannedUnplanned',
          title: 'Planned and unplanned downtime',
          note: 'Pick it to separate maintenance that was chosen from stops that were not.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/CategoryChart.tsx'],
          Component: ProductionChartPlannedUnplanned,
        },
        {
          id: 'ProductionChartOeeBridge',
          title: 'OEE loss breakdown',
          note: 'Pick it to walk from planned time to OEE; each floating bar is one kind of loss.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/CategoryChart.tsx'],
          Component: ProductionChartOeeBridge,
        },
        {
          id: 'ProductionChartOeeComponents',
          title: 'OEE components over time',
          note: 'Pick it to see which of availability, performance and quality is moving the OEE.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/CategoryChart.tsx'],
          Component: ProductionChartOeeComponents,
        },
        {
          id: 'ProductionChartAvailability',
          title: 'Availability over time',
          note: 'Pick it for a percentage near 100, where a zoomed line shows what bars would hide.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/CategoryChart.tsx'],
          Component: ProductionChartAvailability,
        },
      ],
    },
    {
      id: 'longer-periods',
      title: 'Longer periods',
      description: 'Months, rolling averages, calendars and the day that is not over yet.',
      specimens: [
        {
          id: 'ProductionChartMonthlyYtd',
          title: 'Monthly with year to date',
          note: 'Pick it for a yearly review: monthly bars on one axis, the running total and its plan on the other.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/CategoryChart.tsx'],
          Component: ProductionChartMonthlyYtd,
        },
        {
          id: 'ProductionChartRollingAverage',
          title: 'Rolling average',
          note: 'Pick it when daily bars are noisy and the trend underneath is what people need.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/CategoryChart.tsx'],
          Component: ProductionChartRollingAverage,
        },
        {
          id: 'ProductionChartCalendar',
          title: 'Production calendar strip',
          note: 'Pick it to spot weekday patterns and single bad days across several weeks.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/HeatMapGrid.tsx'],
          Component: ProductionChartCalendar,
        },
        {
          id: 'ProductionChartInProgress',
          title: 'Day in progress',
          note: 'Pick it whenever the last period is unfinished; a lighter bar keeps it from reading as a miss.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/CategoryChart.tsx'],
          Component: ProductionChartInProgress,
        },
      ],
    },
    {
      id: 'compact-and-states',
      title: 'Compact and states',
      description: 'Small footprints and what to show when there is nothing to draw.',
      specimens: [
        {
          id: 'ProductionChartValueLabels',
          title: 'Labelled bars, no axis',
          note: 'Pick it for five to seven bars in a narrow column, where printed values replace the axis.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/charts/CategoryChart.tsx'],
          Component: ProductionChartValueLabels,
        },
        {
          id: 'ProductionChartLoading',
          title: 'Loading',
          note: 'Pick it while figures load; the skeleton holds the place of the chart.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/charts/ChartPlaceholder.tsx'],
          Component: ProductionChartLoading,
        },
        {
          id: 'ProductionChartEmpty',
          title: 'No data',
          note: 'Pick it when nothing is booked for the period, and point to a period that has data.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/charts/ChartPlaceholder.tsx'],
          Component: ProductionChartEmpty,
        },
      ],
    },
    {
      id: 'cards',
      title: 'In a card',
      description: 'The charts above with a headline figure, controls and a summary.',
      specimens: [
        {
          id: 'ProductionChartWithHeader',
          title: 'With headline figure',
          note: 'Pick it when today’s number is the headline and the bars give it context.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/CategoryChart.tsx', 'industrial/ValueReadout.tsx', 'industrial/TrendDelta.tsx'],
          Component: ProductionChartWithHeader,
        },
        {
          id: 'ProductionChartDowntimeCard',
          title: 'Downtime card',
          note: 'Pick it on a production dashboard: total downtime, its change and the top causes.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/TrendCard.tsx', 'industrial/charts/CategoryChart.tsx'],
          Component: ProductionChartDowntimeCard,
        },
        {
          id: 'ProductionChartOverviewCard',
          title: 'Production overview card',
          note: 'Pick it as the main chart of a production page: range switch, plan line, legend and a computed summary.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['data/ChartCard.tsx', 'industrial/charts/CategoryChart.tsx', 'industrial/charts/TimeRangeSwitch.tsx'],
          Component: ProductionChartOverviewCard,
        },
      ],
    },
  ],
});
