import { SegmentedControl, SegmentedControlButton, SegmentedControlList } from '@cognite/aura/components/segmented-control';
import { IconCalendarStats, IconChartBar, IconClock, IconFlame } from '@cognite/aura/icons';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { Bars } from '../../../library/kit/Bars';
import { Canvas } from '../../../library/kit/Canvas';
import { DataTable, type DataTableColumn } from '../../../library/kit/DataTable';
import { Donut } from '../../../library/kit/Donut';
import { Grid } from '../../../library/kit/Grid';
import { HeatStrip } from '../../../library/kit/HeatStrip';
import { IconChip } from '../../../library/kit/IconChip';
import { Panel } from '../../../library/kit/Panel';
import { CalendarGrid } from '../../../library/kit/production-charts/CalendarGrid';
import { DeviationBars } from '../../../library/kit/production-charts/DeviationBars';
import { Pareto } from '../../../library/kit/production-charts/Pareto';
import { paretoRows, type CalendarDay } from '../../../library/kit/production-charts/paretoLogic';
import { SectionHeader } from '../../../library/kit/SectionHeader';
import { Stat } from '../../../library/kit/Stat';
import { StatGroup } from '../../../library/kit/StatGroup';
import { StatusPill } from '../../../library/kit/StatusPill';
import type { Tone } from '../../../library/kit/tones';
import { TrendLine } from '../../../library/kit/TrendLine';
import type { LookId } from '../../../library/looks/looks';
import { LookScope } from '../../../library/looks/LookScope';
import { makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './production-charts.tsx?raw';

const CHARTS_PLAN = 4.5;

const CHARTS_TOLERANCE = 0.05;

/** Gas export per day in March 2026, MSm³/d. Day 12 is in progress and has no result yet. */
const CHARTS_MARCH = [4.53, 4.56, 4.51, 4.48, 4.57, 4.52, 4.49, 4.55, 4.47, 4.41, 4.21];

const CHARTS_DAYS: CalendarDay[] = Array.from({ length: 31 }, (_, index) => ({ day: index + 1, value: CHARTS_MARCH[index] }));

const CHARTS_WEEK_LABELS = ['Thu 5', 'Fri 6', 'Sat 7', 'Sun 8', 'Mon 9', 'Tue 10', 'Wed 11'];

const CHARTS_WEEK = CHARTS_MARCH.slice(4);

function chartsDayTone(value: number): Tone {
  return value >= CHARTS_PLAN - CHARTS_TOLERANCE ? 'success' : value >= CHARTS_PLAN - 0.15 ? 'warning' : 'critical';
}

const CHARTS_DAY_WORD: Partial<Record<Tone, string>> = { success: 'Met plan', warning: 'Just under plan', critical: 'Missed plan' };

const CHARTS_DAY_NOTES: Record<number, string> = {
  10: 'Reduced rate for six hours while the interstage cooler outlet temperature was high.',
  11: 'Cooler fouling stop from 16:20, 3 h 05 min. Evening shift lost 0.28 MSm³.',
};

const CHARTS_CAUSES = [
  { label: 'Cooler fouling', value: 9.4 },
  { label: 'Vibration trip', value: 7.8 },
  { label: 'Planned inspection', value: 4.0 },
  { label: 'Instrument fault', value: 2.1 },
  { label: 'Power dip', value: 1.3 },
  { label: 'Other', value: 0.9 },
];

const CHARTS_MONTHS = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];

const CHARTS_MONTHLY = [136.2, 131.4, 138.9, 137.1, 124.6, 49.3];

const CHARTS_MONTHLY_PLAN = [139.5, 135, 139.5, 139.5, 126, 49.5];

const CHARTS_DAILY_30 = makeValues({ seed: 512, points: 30, base: 4.46, amplitude: 0.07, noise: 0.05, cycles: 2, decimals: 2 });

function chartsRolling(values: readonly number[], window: number): number[] {
  return values.map((_, index) => {
    const slice = values.slice(Math.max(0, index - window + 1), index + 1);
    return Math.round((slice.reduce((sum, value) => sum + value, 0) / slice.length) * 100) / 100;
  });
}

const CHARTS_30_LABELS = Array.from({ length: 30 }, (_, index) => (index < 18 ? `${index + 11} Feb` : `${index - 17} Mar`));

const CHARTS_OEE_WEEKS = ['W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10', 'W11'];

const CHARTS_UNITS = ['1st stage compressor', '2nd stage compressor', 'Recompressor', 'Interstage cooler', 'Export pump A', 'Gas turbine'];

const CHARTS_UNIT_OUTPUT = [99.1, 97.8, 88.4, 91.2, 98.9, 96.6];

const CHARTS_STOP_HOURS = [
  { label: 'Recompressor', values: [0, 0, 0, 0, 0, 0, 0, 0, 0, 42, 0, 0, 0, 14, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { label: 'Interstage cooler', values: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 40, 60, 60, 25, 0, 0, 0, 0] },
  { label: '2nd stage compressor', values: [0, 0, 0, 0, 0, 60, 30, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { label: 'Export pump A', values: [0, 0, 38, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
];

const CHARTS_RANGES = {
  '7 d': { labels: CHARTS_WEEK_LABELS, values: CHARTS_WEEK, caption: 'Last 7 finished days' },
  '11 d': { labels: CHARTS_MARCH.map((_, index) => `${index + 1}`), values: CHARTS_MARCH, caption: 'March to date' },
} as const;

type ChartsRange = keyof typeof CHARTS_RANGES;

function isChartsRange(value: string): value is ChartsRange {
  return value in CHARTS_RANGES;
}

function chartsMean(values: readonly number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/** One sheet of the page: a look scope with its canvas. Without a look it follows the app's look. */
function ChartsSheet({ look, children }: { look?: LookId; children: ReactNode }) {
  const canvas = <Canvas className="h-full">{children}</Canvas>;
  return look ? (
    <LookScope look={look} className="h-full w-full">
      {canvas}
    </LookScope>
  ) : (
    <div className="h-full w-full">{canvas}</div>
  );
}

function ProductionChartsDailyTarget() {
  return (
    <ChartsSheet>
      <Panel title="Daily export against plan" subtitle="MSm³ per day, 5–11 March" className="h-full">
        <Bars
          label="Gas export per day against the 4.50 plan, 5 to 11 March"
          categories={CHARTS_WEEK_LABELS}
          series={[{ id: 'export', label: 'Export', values: CHARTS_WEEK }]}
          tones={CHARTS_WEEK.map((value) => (chartsDayTone(value) === 'critical' ? 'critical' : 'accent'))}
          decimals={2}
          limit={{ value: CHARTS_PLAN, label: 'Plan', tone: 'warning' }}
          showValues
          showLegend={false}
          height={270}
          notes="Five of seven days met plan. Only Wednesday, which missed by more than the tolerance, takes a status colour."
        />
      </Panel>
    </ChartsSheet>
  );
}

function ProductionChartsDeviation() {
  return (
    <ChartsSheet>
      <Panel title="Deviation from plan" subtitle="MSm³ per day above or below 4.50" className="h-full">
        <DeviationBars
          label="Daily gas export minus plan, 5 to 11 March"
          categories={CHARTS_WEEK_LABELS}
          values={CHARTS_WEEK.map((value) => Math.round((value - CHARTS_PLAN) * 100) / 100)}
          reference="Plan 4.50"
          decimals={2}
          tolerance={CHARTS_TOLERANCE}
          step={0.1}
          height={270}
          notes="The same week with the plan as the zero line: the detail near the top of the bars becomes the whole chart."
        />
      </Panel>
    </ChartsSheet>
  );
}

function ProductionChartsCalendar() {
  const [selected, setSelected] = useState(11);
  const value = CHARTS_MARCH[selected - 1];
  const tone = chartsDayTone(value);
  return (
    <ChartsSheet>
      <Grid>
        <Panel
          title="March 2026"
          subtitle="Gas export per day, MSm³ · select a day"
          icon={
            <IconChip tone="blue">
              <IconCalendarStats />
            </IconChip>
          }
          className="col-span-8"
        >
          <CalendarGrid label="Gas export per day, March 2026" days={CHARTS_DAYS} firstWeekday={6} toneOf={chartsDayTone} decimals={2} today={12} selected={selected} onSelect={setSelected} />
        </Panel>
        <Panel title={`${selected} March`} subtitle="Selected day" tone={tone} className="col-span-4" footer="Green met plan within 0.05, amber is up to 0.15 under, red is further under.">
          <Stat variant="plain" size="hero" label="Gas export" value={value} decimals={2} unit="MSm³/d" delta={{ value: value - CHARTS_PLAN, decimals: 2, caption: 'vs plan 4.50' }} />
          <div className="mt-4">
            <StatusPill tone={tone} size="lg">
              {CHARTS_DAY_WORD[tone]}
            </StatusPill>
          </div>
          <p className="mt-4 text-sm leading-6 text-(--kit-text-2)">{CHARTS_DAY_NOTES[selected] ?? 'No stops or rate reductions logged on this day.'}</p>
        </Panel>
      </Grid>
    </ChartsSheet>
  );
}

function ProductionChartsStacked() {
  return (
    <ChartsSheet>
      <Panel title="Output by stream" subtitle="kSm³ oil equivalent per day" className="h-full">
        <Bars
          label="Daily output stacked by stream: gas, condensate and NGL"
          categories={CHARTS_WEEK_LABELS}
          stacked
          series={[
            { id: 'gas', label: 'Gas', values: [4.57, 4.52, 4.49, 4.55, 4.47, 4.41, 4.21], tone: 'blue' },
            { id: 'condensate', label: 'Condensate', values: [1.12, 1.1, 1.09, 1.13, 1.08, 1.05, 0.98], tone: 'teal' },
            { id: 'ngl', label: 'NGL', values: [0.61, 0.6, 0.6, 0.62, 0.59, 0.57, 0.52], tone: 'purple' },
          ]}
          decimals={1}
          height={270}
          notes="Three parts that add up to total output. All three fall together on Wednesday: the cause is upstream of the split."
        />
      </Panel>
    </ChartsSheet>
  );
}

function ProductionChartsRanking() {
  const order = CHARTS_UNITS.map((unit, index) => ({ unit, value: CHARTS_UNIT_OUTPUT[index] })).sort((a, b) => b.value - a.value);
  return (
    <ChartsSheet>
      <Panel title="Availability by unit" subtitle="Week 11, best first" className="h-full">
        <Bars
          label="Availability per unit in week 11, ranked"
          orientation="horizontal"
          categories={order.map((row) => row.unit)}
          series={[{ id: 'availability', label: 'Availability', values: order.map((row) => row.value) }]}
          tones={order.map((row) => (row.value < 90 ? 'critical' : row.value < 95 ? 'warning' : 'accent'))}
          unit="%"
          decimals={1}
          limit={{ value: 95, label: 'Target', tone: 'neutral' }}
          showValues
          showLegend={false}
          height={270}
          notes="Ranked lists run sideways so the unit names stay readable. Two units sit under the 95 % target."
        />
      </Panel>
    </ChartsSheet>
  );
}

function ProductionChartsPareto() {
  return (
    <ChartsSheet>
      <Panel title="Downtime by cause" subtitle="March to date, hours · 25.5 h in total" className="h-full">
        <Pareto
          label="Pareto of downtime hours by cause, March to date"
          items={CHARTS_CAUSES}
          unit="h"
          decimals={1}
          height={320}
          notes="Three causes make up 83 % of the downtime. Cooler fouling and the vibration trips are both on the compression train."
        />
      </Panel>
    </ChartsSheet>
  );
}

function ProductionChartsPlannedSplit() {
  return (
    <ChartsSheet>
      <Panel title="Planned and unplanned" subtitle="March to date" className="h-full" footer="Never report the total without the split.">
        <div className="flex h-full flex-col items-center justify-center gap-4">
          <Donut
            label="Downtime split into planned and unplanned hours"
            segments={[
              { label: 'Unplanned', value: 21.5, tone: 'critical' },
              { label: 'Planned', value: 4, tone: 'neutral' },
            ]}
            centerValue="25.5 h"
            centerCaption="stopped"
            legend="bottom"
            decimals={1}
            unit="h"
            size={168}
          />
        </div>
      </Panel>
    </ChartsSheet>
  );
}

function ProductionChartsOeeOverTime() {
  return (
    <ChartsSheet>
      <Panel title="OEE components over time" subtitle="Weekly, percent" className="h-full">
        <TrendLine
          label="Availability, performance and quality per week, weeks 4 to 11"
          labels={CHARTS_OEE_WEEKS}
          unit="%"
          decimals={1}
          height={270}
          yDomain={[84, 100]}
          series={[
            { id: 'availability', label: 'Availability', values: [95.8, 96.1, 94.9, 95.4, 93.2, 94.6, 91.7, 93.6], tone: 'teal' },
            { id: 'performance', label: 'Performance', values: [92.4, 92.9, 93.1, 92.2, 92.8, 92.6, 92.5, 91.2], tone: 'blue' },
            { id: 'quality', label: 'Quality', values: [97.8, 97.5, 97.9, 97.2, 97.4, 96.8, 96.7, 96.9], tone: 'purple' },
          ]}
          notes="Availability is the factor that moves; performance and quality drift slowly. The value axis starts at 84 %."
        />
      </Panel>
    </ChartsSheet>
  );
}

function ProductionChartsStopHeat() {
  return (
    <ChartsSheet>
      <Panel title="When the stops happened" subtitle="Minutes stopped per hour of the day, week 11" className="h-full" footer="Dark cells are full hours lost. The evening block is the cooler stop.">
        <HeatStrip
          label="Minutes stopped per hour of the day and unit, week 11"
          rows={CHARTS_STOP_HOURS}
          axis={['00:00', '24:00']}
          ticks={['00', '04', '08', '12', '16', '20', '24']}
          scale={{ label: 'Minutes stopped per hour', low: '0', high: '60' }}
          max={60}
          tone="critical"
          size="lg"
        />
      </Panel>
    </ChartsSheet>
  );
}

function ProductionChartsMonthly() {
  return (
    <ChartsSheet>
      <Panel title="Monthly export against plan" subtitle="MSm³ per month · March is to date" className="h-full">
        <Bars
          label="Gas export per month against plan, October to March"
          categories={CHARTS_MONTHS}
          series={[
            { id: 'plan', label: 'Plan', values: CHARTS_MONTHLY_PLAN, tone: 'neutral' },
            { id: 'actual', label: 'Actual', values: CHARTS_MONTHLY, tone: 'accent' },
          ]}
          decimals={0}
          height={250}
          headline={<Stat variant="plain" size="lg" label="Gas year to date" value={717.5} decimals={1} unit="MSm³" delta={{ value: -11.5, caption: 'vs plan 729.0' }} />}
          notes="March shows eleven finished days against the plan for the same eleven days, so the pair stays comparable."
        />
      </Panel>
    </ChartsSheet>
  );
}

function ProductionChartsRolling() {
  return (
    <ChartsSheet>
      <Panel title="Daily export with rolling average" subtitle="Last 30 days, MSm³/d" className="h-full">
        <TrendLine
          label="Daily gas export and its seven-day rolling average, last 30 days"
          labels={CHARTS_30_LABELS}
          unit="MSm³/d"
          decimals={2}
          height={300}
          series={[
            { id: 'daily', label: 'Daily', values: CHARTS_DAILY_30, tone: 'neutral', dashed: true },
            { id: 'rolling', label: '7-day average', values: chartsRolling(CHARTS_DAILY_30, 7), tone: 'accent' },
          ]}
          limits={[{ value: CHARTS_PLAN, label: 'Plan', tone: 'warning' }]}
          notes="The average takes the day-to-day noise out; judge the trend on the solid line and single days on the dashed one."
        />
      </Panel>
    </ChartsSheet>
  );
}

function ProductionChartsConsole() {
  return (
    <ChartsSheet look="console">
      <Grid>
        <Panel title="Export against plan" subtitle="MSm³/d · 5–11 March" className="col-span-5">
          <DeviationBars
            label="Daily export minus plan, console"
            categories={CHARTS_WEEK_LABELS}
            values={CHARTS_WEEK.map((value) => Math.round((value - CHARTS_PLAN) * 100) / 100)}
            reference="Plan 4.50"
            decimals={2}
            tolerance={CHARTS_TOLERANCE}
            step={0.1}
            height={280}
          />
        </Panel>
        <Panel title="Downtime Pareto" subtitle="Hours · March to date" className="col-span-7">
          <Pareto label="Pareto of downtime by cause, console" items={CHARTS_CAUSES} unit="h" decimals={1} height={280} />
        </Panel>
      </Grid>
    </ChartsSheet>
  );
}

function ProductionChartsPoster() {
  return (
    <ChartsSheet look="poster">
      <SectionHeader size="lg" title="One bad day cost the week." description="Gas export, 5–11 March. Plan is 4.50 MSm³ a day." />
      <Grid className="mt-6">
        <Panel title="Export per day" subtitle="MSm³/d" className="col-span-8">
          <Bars
            label="Gas export per day against plan, poster"
            categories={CHARTS_WEEK_LABELS}
            series={[{ id: 'export', label: 'Export', values: CHARTS_WEEK }]}
            tones={CHARTS_WEEK.map((value) => (chartsDayTone(value) === 'critical' ? 'pink' : 'blue'))}
            decimals={2}
            limit={{ value: CHARTS_PLAN, label: 'Plan' }}
            showValues
            showLegend={false}
            height={300}
          />
        </Panel>
        <div className="col-span-4 flex flex-col gap-(--kit-gap)">
          <Stat className="flex-1" size="hero" tone="pink" emphasis="strong" label="Wednesday 11" value={4.21} decimals={2} unit="MSm³" target="0.29 under plan" />
          <Stat className="flex-1" size="lg" tone="green" emphasis="strong" label="Days on plan" value="5 of 7" target="Within 0.05 of 4.50" />
        </div>
      </Grid>
    </ChartsSheet>
  );
}

function ProductionChartsBlueprint() {
  return (
    <ChartsSheet look="blueprint">
      <Grid>
        <Panel title="Rolling average" subtitle="MSm³/d · 30 days" className="col-span-7">
          <TrendLine
            label="Seven-day rolling average of gas export on a blueprint"
            labels={CHARTS_30_LABELS}
            unit="MSm³/d"
            decimals={2}
            height={280}
            series={[
              { id: 'daily', label: 'Daily', values: CHARTS_DAILY_30, tone: 'neutral', dashed: true },
              { id: 'rolling', label: '7-day average', values: chartsRolling(CHARTS_DAILY_30, 7), tone: 'accent' },
            ]}
            limits={[{ value: CHARTS_PLAN, label: 'Plan', tone: 'warning' }]}
          />
        </Panel>
        <Panel title="Deviation" subtitle="From plan 4.50" className="col-span-5">
          <DeviationBars
            label="Daily export minus plan, blueprint"
            categories={CHARTS_WEEK_LABELS.map((day) => day.slice(0, 3))}
            values={CHARTS_WEEK.map((value) => Math.round((value - CHARTS_PLAN) * 100) / 100)}
            reference="Plan"
            decimals={2}
            tolerance={CHARTS_TOLERANCE}
            step={0.1}
            height={280}
          />
        </Panel>
      </Grid>
    </ChartsSheet>
  );
}

function ProductionChartsSoft() {
  return (
    <ChartsSheet look="soft">
      <Grid>
        <Panel title="March so far" subtitle="Export per day, MSm³" tone="blue" className="col-span-7">
          <CalendarGrid label="Gas export per day, March 2026, soft" days={CHARTS_DAYS} firstWeekday={6} toneOf={chartsDayTone} decimals={2} today={12} />
        </Panel>
        <Panel title="Where the hours went" subtitle="Downtime by cause" tone="pink" className="col-span-5">
          <Donut
            label="Downtime hours by cause, March to date"
            segments={[
              { label: 'Cooler fouling', value: 9.4, tone: 'pink' },
              { label: 'Vibration trip', value: 7.8, tone: 'purple' },
              { label: 'Planned inspection', value: 4, tone: 'teal' },
              { label: 'All other', value: 4.3, tone: 'amber' },
            ]}
            centerValue="25.5 h"
            centerCaption="stopped"
            legend="bottom"
            decimals={1}
            unit="h"
            size={184}
          />
        </Panel>
      </Grid>
    </ChartsSheet>
  );
}

function ProductionChartsGlass() {
  return (
    <ChartsSheet look="glass">
      <Grid>
        <Panel title="Gas export" subtitle="Seven-day average, last 30 days" className="col-span-8">
          <TrendLine
            label="Seven-day average of gas export, glass"
            labels={CHARTS_30_LABELS}
            unit="MSm³/d"
            decimals={2}
            height={290}
            fill
            series={[{ id: 'rolling', label: '7-day average', values: chartsRolling(CHARTS_DAILY_30, 7), tone: 'accent' }]}
            limits={[{ value: CHARTS_PLAN, label: 'Plan', tone: 'warning' }]}
            headline={<Stat variant="plain" size="hero" label="March to date" value={chartsMean(CHARTS_MARCH)} decimals={2} unit="MSm³/d" delta={{ value: chartsMean(CHARTS_MARCH) - CHARTS_PLAN, decimals: 2, caption: 'vs plan' }} />}
          />
        </Panel>
        <Panel title="Stops by cause" subtitle="Share of 25.5 h" className="col-span-4">
          <Donut
            label="Downtime hours by cause, glass"
            segments={[
              { label: 'Cooler fouling', value: 9.4, tone: 'pink' },
              { label: 'Vibration trip', value: 7.8, tone: 'amber' },
              { label: 'Planned inspection', value: 4, tone: 'teal' },
              { label: 'All other', value: 4.3, tone: 'neutral' },
            ]}
            centerValue="25.5 h"
            centerCaption="stopped"
            legend="bottom"
            decimals={1}
            unit="h"
            size={176}
          />
        </Panel>
      </Grid>
    </ChartsSheet>
  );
}

type ChartsCauseRow = { label: string; value: number; share: number; cumulative: number; vital: boolean };

const CHARTS_CAUSE_COLUMNS: DataTableColumn<ChartsCauseRow>[] = [
  { id: 'cause', header: 'Cause', cell: (row) => <span className="font-medium">{row.label}</span> },
  { id: 'hours', header: 'Hours', numeric: true, cell: (row) => row.value.toFixed(1) },
  { id: 'share', header: 'Share', numeric: true, cell: (row) => `${row.share.toFixed(0)} %` },
  { id: 'focus', header: 'Focus', nowrap: true, cell: (row) => (row.vital ? <StatusPill tone="accent">Fix first</StatusPill> : <StatusPill tone="neutral">Later</StatusPill>) },
];

function ProductionChartsDowntimeCard() {
  return (
    <ChartsSheet>
      <Grid>
        <Panel
          title="Downtime, March to date"
          subtitle="Hours by cause, largest first"
          icon={
            <IconChip tone="amber">
              <IconClock />
            </IconChip>
          }
          className="col-span-6"
        >
          <Pareto label="Pareto of downtime by cause with the vital few marked" items={CHARTS_CAUSES} unit="h" decimals={1} height={300} />
        </Panel>
        <Panel title="Causes" subtitle="The first three reach 80 %" padding="none" className="col-span-6" footer="6 causes · 25.5 h · 21.5 h unplanned">
          <DataTable label="Downtime causes with share and running share" columns={CHARTS_CAUSE_COLUMNS} rows={paretoRows(CHARTS_CAUSES)} rowKey={(row) => row.label} rowTone={(row) => (row.vital ? 'accent' : undefined)} flush />
        </Panel>
      </Grid>
    </ChartsSheet>
  );
}

function ProductionChartsOverviewCard() {
  const [range, setRange] = useState<ChartsRange>('7 d');
  const { labels, values, caption } = CHARTS_RANGES[range];
  const mean = chartsMean(values);
  const met = values.filter((value) => chartsDayTone(value) === 'success').length;
  return (
    <ChartsSheet>
      <Panel
        title="Gas export"
        subtitle={`${caption} · MSm³ per day against plan 4.50`}
        icon={
          <IconChip tone="accent">
            <IconFlame />
          </IconChip>
        }
        actions={
          <SegmentedControl
            value={range}
            onValueChange={(value: string) => {
              if (isChartsRange(value)) setRange(value);
            }}
          >
            <SegmentedControlList aria-label="Range">
              <SegmentedControlButton value="7 d">7 days</SegmentedControlButton>
              <SegmentedControlButton value="11 d">Month to date</SegmentedControlButton>
            </SegmentedControlList>
          </SegmentedControl>
        }
      >
        <StatGroup joined columns={4} label="Period summary">
          <Stat variant="plain" label="Average" value={mean} decimals={2} unit="MSm³/d" delta={{ value: mean - CHARTS_PLAN, decimals: 2, caption: 'vs plan' }} />
          <Stat variant="plain" label="Days on plan" value={`${met} of ${values.length}`} target="Within 0.05 of plan" />
          <Stat variant="plain" label="Best day" value={Math.max(...values)} decimals={2} unit="MSm³" target={`Day ${labels[values.indexOf(Math.max(...values))]}`} />
          <Stat variant="plain" label="Worst day" value={Math.min(...values)} decimals={2} unit="MSm³" target={`Day ${labels[values.indexOf(Math.min(...values))]}`} />
        </StatGroup>
        <Bars
          className="mt-5"
          label={`Gas export per day against plan, ${caption.toLowerCase()}`}
          categories={labels}
          series={[{ id: 'export', label: 'Export', values }]}
          tones={values.map((value) => (chartsDayTone(value) === 'critical' ? 'critical' : 'accent'))}
          decimals={2}
          limit={{ value: CHARTS_PLAN, label: 'Plan', tone: 'warning' }}
          showValues
          showLegend={false}
          height={280}
        />
      </Panel>
    </ChartsSheet>
  );
}

function ProductionChartsReviewBoard() {
  return (
    <ChartsSheet look="editorial">
      <SectionHeader
        size="lg"
        eyebrow="Production review, week 11"
        title="Export held plan for five days, then the cooler fouled"
        description="Deviation from the 4.50 MSm³/d plan per day, and what the stops were made of."
        actions={
          <IconChip tone="neutral">
            <IconChartBar />
          </IconChip>
        }
      />
      <Grid className="mt-8">
        <div className="col-span-6">
          <DeviationBars
            label="Daily export minus plan, review"
            categories={CHARTS_WEEK_LABELS}
            values={CHARTS_WEEK.map((value) => Math.round((value - CHARTS_PLAN) * 100) / 100)}
            reference="Plan 4.50"
            decimals={2}
            tolerance={CHARTS_TOLERANCE}
            step={0.1}
            height={280}
          />
          <p className="mt-3 text-sm leading-6 text-(--kit-text-2)">Figure 1. Wednesday alone accounts for the weekly shortfall of 0.28 MSm³.</p>
        </div>
        <div className="col-span-6">
          <Pareto label="Pareto of downtime by cause, review" items={CHARTS_CAUSES} unit="h" decimals={1} height={280} />
          <p className="mt-3 text-sm leading-6 text-(--kit-text-2)">Figure 2. Two causes on the compression train make up two thirds of all downtime.</p>
        </div>
      </Grid>
    </ChartsSheet>
  );
}

export default definePage({
  id: 'production-charts',
  title: 'Production charts',
  summary:
    'Output, losses and downtime per day, shift, stream and cause. Bars for amounts per period, lines for rates and running averages, a dashed line for whatever the result is measured against, and colour only on the periods that need explaining.',
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
      'Truncating the value axis of a bar chart; switch to deviation bars or a line when the detail is near the top.',
      'Comparing an unfinished day with full days without marking it as in progress.',
    ],
  },
  source,
  sections: [
    {
      id: 'against-target',
      title: 'Output against target',
      description: 'The same days as amounts, as deviation from plan and as a calendar.',
      specimens: [
        {
          id: 'ProductionChartsDailyTarget',
          title: 'Daily bars with plan line',
          note: 'Pick it for a week or two of daily results measured against one plan.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/Bars.tsx', 'kit/Panel.tsx'],
          Component: ProductionChartsDailyTarget,
        },
        {
          id: 'ProductionChartsDeviation',
          title: 'Deviation from plan',
          note: 'Pick it when every bar is close to the plan and the difference is the message.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/production-charts/DeviationBars.tsx', 'kit/Panel.tsx'],
          Component: ProductionChartsDeviation,
        },
        {
          id: 'ProductionChartsCalendar',
          title: 'Production calendar',
          note: 'Pick it for a month: weekends, runs of bad days and the day in progress read at a glance, and a day opens its detail.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/production-charts/CalendarGrid.tsx', 'kit/Stat.tsx', 'kit/StatusPill.tsx', 'kit/Panel.tsx'],
          Component: ProductionChartsCalendar,
        },
      ],
    },
    {
      id: 'breakdowns',
      title: 'Breakdowns and comparisons',
      description: 'Parts of a total and units against each other.',
      specimens: [
        {
          id: 'ProductionChartsStacked',
          title: 'Stacked by stream',
          note: 'Pick it when the parts add up to a total people care about and there are four or fewer.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/Bars.tsx', 'kit/Panel.tsx'],
          Component: ProductionChartsStacked,
        },
        {
          id: 'ProductionChartsRanking',
          title: 'Ranked units',
          note: 'Pick it to rank units with long names against a common target.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/Bars.tsx', 'kit/Panel.tsx'],
          Component: ProductionChartsRanking,
        },
      ],
    },
    {
      id: 'downtime-and-losses',
      title: 'Downtime and losses',
      description: 'What stopped production, how much of it was planned, and when it happened.',
      specimens: [
        {
          id: 'ProductionChartsPareto',
          title: 'Pareto',
          note: 'Pick it to decide what to fix first: sorted bars, running share and the vital few marked.',
          origin: 'custom',
          size: 'lg',
          bleed: true,
          uses: ['kit/production-charts/Pareto.tsx', 'kit/Panel.tsx'],
          Component: ProductionChartsPareto,
        },
        {
          id: 'ProductionChartsPlannedSplit',
          title: 'Planned and unplanned',
          note: 'Pick it beside any downtime total so the split is never left out.',
          origin: 'custom',
          size: 'sm',
          bleed: true,
          uses: ['kit/Donut.tsx', 'kit/Panel.tsx'],
          Component: ProductionChartsPlannedSplit,
        },
        {
          id: 'ProductionChartsOeeOverTime',
          title: 'OEE components over time',
          note: 'Pick it to see which factor moves from week to week.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/TrendLine.tsx', 'kit/Panel.tsx'],
          Component: ProductionChartsOeeOverTime,
        },
        {
          id: 'ProductionChartsStopHeat',
          title: 'Stops by hour',
          note: 'Pick it to see whether stops cluster at a time of day or on one unit.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/HeatStrip.tsx', 'kit/Panel.tsx'],
          Component: ProductionChartsStopHeat,
        },
      ],
    },
    {
      id: 'longer-periods',
      title: 'Longer periods',
      description: 'Months against plan and a noisy daily series with its average.',
      specimens: [
        {
          id: 'ProductionChartsMonthly',
          title: 'Monthly with year to date',
          note: 'Pick it for a management view: months against plan with the running total as the headline.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/Bars.tsx', 'kit/Stat.tsx', 'kit/Panel.tsx'],
          Component: ProductionChartsMonthly,
        },
        {
          id: 'ProductionChartsRolling',
          title: 'Rolling average',
          note: 'Pick it when daily values are noisy and the question is the trend.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/TrendLine.tsx', 'kit/Panel.tsx'],
          Component: ProductionChartsRolling,
        },
      ],
    },
    {
      id: 'looks',
      title: 'In other looks',
      description: 'The same charts drawn as console panels, poster blocks, drawings, soft cards and glass.',
      specimens: [
        {
          id: 'ProductionChartsConsole',
          title: 'Console',
          note: 'Pick it for the control room: square bars, both grids, axis lines and edge-to-edge panels.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/production-charts/DeviationBars.tsx', 'kit/production-charts/Pareto.tsx', 'looks/LookScope.tsx'],
          Component: ProductionChartsConsole,
        },
        {
          id: 'ProductionChartsPoster',
          title: 'Poster',
          note: 'Pick it for a review screen: outlined solid bars, the finding as the headline and the bad day as a block.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/Bars.tsx', 'kit/Stat.tsx', 'kit/SectionHeader.tsx', 'looks/LookScope.tsx'],
          Component: ProductionChartsPoster,
        },
        {
          id: 'ProductionChartsBlueprint',
          title: 'Blueprint',
          note: 'Pick it for an engineering pack: line-only charts with point markers in title-block panels.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/TrendLine.tsx', 'kit/production-charts/DeviationBars.tsx', 'looks/LookScope.tsx'],
          Component: ProductionChartsBlueprint,
        },
        {
          id: 'ProductionChartsSoft',
          title: 'Soft',
          note: 'Pick it for a friendly team page: a pastel calendar and a thick donut in tinted, rounded cards.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/production-charts/CalendarGrid.tsx', 'kit/Donut.tsx', 'looks/LookScope.tsx'],
          Component: ProductionChartsSoft,
        },
        {
          id: 'ProductionChartsGlass',
          title: 'Glass',
          note: 'Pick it for a showpiece screen: one glowing trend as the hero with a ring beside it.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/TrendLine.tsx', 'kit/Donut.tsx', 'kit/Stat.tsx', 'looks/LookScope.tsx'],
          Component: ProductionChartsGlass,
        },
      ],
    },
    {
      id: 'in-use',
      title: 'In use',
      description: 'Compositions that can be dropped into a product.',
      specimens: [
        {
          id: 'ProductionChartsOverviewCard',
          title: 'Export card with range switch',
          note: 'Pick it as the main card of a production page: summary figures, the bars and a period switch.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/Bars.tsx', 'kit/StatGroup.tsx', 'kit/Stat.tsx', 'kit/Panel.tsx'],
          Component: ProductionChartsOverviewCard,
        },
        {
          id: 'ProductionChartsDowntimeCard',
          title: 'Downtime analysis',
          note: 'Pick it for the downtime review: the Pareto with the same rows as a table beside it.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/production-charts/Pareto.tsx', 'kit/DataTable.tsx', 'kit/StatusPill.tsx', 'kit/Panel.tsx'],
          Component: ProductionChartsDowntimeCard,
        },
        {
          id: 'ProductionChartsReviewBoard',
          title: 'Weekly review spread',
          note: 'Pick it for the written review: two numbered figures under a headline that states the finding.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/production-charts/DeviationBars.tsx', 'kit/production-charts/Pareto.tsx', 'kit/SectionHeader.tsx', 'looks/LookScope.tsx'],
          Component: ProductionChartsReviewBoard,
        },
      ],
    },
  ],
});
