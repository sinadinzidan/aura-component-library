import { Button } from '@cognite/aura/components/button';
import { DatePicker, DateTimeRangePicker } from '@cognite/aura/components/date-time-pickers';
import { HelperText } from '@cognite/aura/components/helper-text';
import { Label } from '@cognite/aura/components/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@cognite/aura/components/select';
import { Separator } from '@cognite/aura/components/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import { IconChevronLeft, IconChevronRight, IconRefresh, IconWorld } from '@cognite/aura/icons';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { useId, useState } from 'react';

import { ChartPlaceholder } from '../../../library/industrial/charts/ChartPlaceholder';
import { LiveToggle } from '../../../library/industrial/charts/LiveToggle';
import { OverviewNavigator } from '../../../library/industrial/charts/OverviewNavigator';
import { PlaybackBar } from '../../../library/industrial/charts/PlaybackBar';
import { formatClock, formatDay, formatDayTime, formatRange, formatRelative, formatSpan } from '../../../library/industrial/charts/timeAxis';
import { TimeRangeSwitch } from '../../../library/industrial/charts/TimeRangeSwitch';
import type { TimeRangeOption } from '../../../library/industrial/charts/TimeRangeSwitch';
import { TimeStepper } from '../../../library/industrial/charts/TimeStepper';
import { windowEndingAt } from '../../../library/industrial/charts/timeWindow';
import { TrendChart } from '../../../library/industrial/charts/TrendChart';
import type { TrendChartProps } from '../../../library/industrial/charts/TrendChart';
import { aggregatePoints, sliceByTime, valueAt } from '../../../library/industrial/charts/trendData';
import type { TrendPoint } from '../../../library/industrial/charts/trendData';
import { ZoomControls } from '../../../library/industrial/charts/ZoomControls';
import { ValueReadout } from '../../../library/industrial/ValueReadout';
import { DateRangePresetPicker } from '../../../library/navigation/DateRangePresetPicker';
import type { DateRange } from '../../../library/navigation/DateRangePresetPicker';
import { DAY, HOUR, MINUTE, REFERENCE_NOW, makeSeries } from '../../data/series';
import { definePage } from '../../types';

import source from './time-navigation.tsx?raw';

const NOW = REFERENCE_NOW;
const STEP = 10 * MINUTE;
const FIRST = NOW - 30 * DAY;

/** Discharge pressure of the 1st stage compressor: 30 days at 10-minute resolution. */
const HISTORY: TrendPoint[] = makeSeries({ seed: 11, points: 4321, base: 48.2, amplitude: 1.4, noise: 0.4, cycles: 60, stepMs: STEP }).map((point) => ({ t: point.t, v: point.v }));
/** Suction pressure for the same period, for dashboards with a second chart. */
const SECOND: TrendPoint[] = makeSeries({ seed: 12, points: 4321, base: 12.4, amplitude: 0.5, noise: 0.15, cycles: 60, stepMs: STEP }).map((point) => ({ t: point.t, v: point.v }));

/** The points inside a window, averaged into at most about 200 buckets so long ranges stay light. */
function timeNavPoints(source: readonly TrendPoint[], from: number, to: number): TrendPoint[] {
  const inside = sliceByTime(source, from, to);
  if (inside.length <= 220) return inside;
  const bucket = Math.ceil((to - from) / 200 / STEP) * STEP;
  return aggregatePoints(inside, bucket).map((point) => ({ t: point.t, v: Math.round(point.avg * 10) / 10 }));
}

type TimeNavTrendProps = { from: number; to: number; what?: string } & Partial<Omit<TrendChartProps, 'series' | 'label' | 'xDomain'>>;

/** The chart every specimen on this page steers: discharge pressure over the chosen window. */
function TimeNavTrend({ from, to, what = 'Discharge pressure', ...rest }: TimeNavTrendProps) {
  return (
    <TrendChart
      heightClassName="h-36"
      label={`${what}, ${formatRange(from, to)}`}
      series={[{ key: 'pressure', label: what, points: timeNavPoints(HISTORY, from, to) }]}
      xDomain={[from, to]}
      yDomain={[44, 52]}
      yTicks={[44, 48, 52]}
      {...rest}
    />
  );
}

const PRESETS = [
  { value: '1h', label: '1 h', name: 'Last hour', spanMs: HOUR },
  { value: '8h', label: '8 h', name: 'Last 8 hours', spanMs: 8 * HOUR },
  { value: '24h', label: '24 h', name: 'Last 24 hours', spanMs: DAY },
  { value: '7d', label: '7 d', name: 'Last 7 days', spanMs: 7 * DAY },
  { value: '30d', label: '30 d', name: 'Last 30 days', spanMs: 30 * DAY },
] as const satisfies readonly TimeRangeOption[];

const spanOf = (value: string): number => PRESETS.find((preset) => preset.value === value)?.spanMs ?? DAY;
const nameOf = (value: string): string => PRESETS.find((preset) => preset.value === value)?.name ?? value;

/** The catalog's fixed "now" as a local time, so pickers show 12 March 14:00 in every time zone. */
function toLocal(timestamp: number): Dayjs {
  const date = new Date(timestamp);
  return dayjs(new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes()));
}

const fromLocal = (value: Dayjs): number => Date.UTC(value.year(), value.month(), value.date(), value.hour(), value.minute());

function TimeNavPresetButtons() {
  const [range, setRange] = useState('8h');
  const [from, to] = windowEndingAt(NOW, spanOf(range));
  return (
    <div className="flex w-full flex-col gap-3">
      <div role="group" aria-label="Time range" className="flex flex-wrap items-center gap-1">
        {PRESETS.map((preset) => (
          <Button key={preset.value} size="sm" variant={preset.value === range ? 'secondary' : 'ghost'} aria-pressed={preset.value === range} aria-label={preset.name} onClick={() => setRange(preset.value)}>
            {preset.label}
          </Button>
        ))}
      </div>
      <TimeNavTrend from={from} to={to} />
      <p className="text-xs text-muted-foreground tabular-nums">{formatRange(from, to)} UTC</p>
    </div>
  );
}

function TimeNavSegmented() {
  const [range, setRange] = useState('24h');
  const [from, to] = windowEndingAt(NOW, spanOf(range));
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-base-foreground">Discharge pressure</span>
        <TimeRangeSwitch options={PRESETS.slice(0, 4)} value={range} onValueChange={setRange} />
      </div>
      <TimeNavTrend from={from} to={to} />
      <p className="text-xs text-muted-foreground tabular-nums">{nameOf(range)}</p>
    </div>
  );
}

function TimeNavSegmentedSizes() {
  const [small, setSmall] = useState('8h');
  const [regular, setRegular] = useState('24h');
  return (
    <div className="flex flex-col items-start gap-4">
      <TimeRangeSwitch label="Time range, small" size="small" options={PRESETS.slice(0, 4)} value={small} onValueChange={setSmall} />
      <TimeRangeSwitch label="Time range, default" size="default" options={PRESETS.slice(0, 4)} value={regular} onValueChange={setRegular} />
    </div>
  );
}

const RANGE_ITEMS = [
  { value: 'shift', label: 'This shift' },
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: 'month', label: 'This month' },
];

function TimeNavPresetSelect() {
  const id = useId();
  const [range, setRange] = useState('shift');
  return (
    <div className="flex w-full max-w-56 flex-col">
      <Label htmlFor={id}>Time range</Label>
      <Select items={RANGE_ITEMS} value={range} onValueChange={setRange}>
        <SelectTrigger id={id}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {RANGE_ITEMS.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <HelperText>{range === 'shift' ? 'Day shift, 06:00 to 14:00' : 'Times are in UTC'}</HelperText>
    </div>
  );
}

function TimeNavDateJump() {
  const id = useId();
  const [day, setDay] = useState<Dayjs | null>(toLocal(NOW).startOf('day'));
  const start = day ? fromLocal(day) : null;
  return (
    <div role="group" aria-labelledby={id} className="flex w-full max-w-56 flex-col">
      <Label id={id}>Go to day</Label>
      <DatePicker value={day} onChange={setDay} format="D MMM YYYY" placeholder="Select a day" />
      <HelperText>{start === null ? 'Pick a day to show its 24 hours' : `Shows ${formatRange(start, Math.min(start + DAY, NOW))}`}</HelperText>
    </div>
  );
}

function TimeNavCustomRange() {
  const [range, setRange] = useState<[Dayjs | null, Dayjs | null]>([toLocal(NOW - 2 * DAY), toLocal(NOW - DAY)]);
  const from = range[0] ? fromLocal(range[0]) : null;
  const to = range[1] ? fromLocal(range[1]) : null;
  const valid = from !== null && to !== null && to > from;
  return (
    <div className="flex w-full flex-col gap-3">
      <div role="group" aria-label="Custom time range" className="w-full max-w-md">
        <DateTimeRangePicker value={range} onChange={setRange} format="D MMM YYYY HH:mm" />
      </div>
      {valid ? <TimeNavTrend from={from} to={to} /> : <ChartPlaceholder state="empty" heightClassName="h-36" title="Choose a start and an end" />}
      <p className="text-xs text-muted-foreground tabular-nums">{valid ? `${formatSpan(to - from)} selected, ending ${formatSpan(NOW - to)} ago` : 'No range selected'}</p>
    </div>
  );
}

function TimeNavPresetsWithCustom() {
  const today = toLocal(NOW).startOf('day').toDate();
  const [range, setRange] = useState<DateRange>([toLocal(NOW - 6 * DAY).startOf('day').toDate(), today]);
  const days = range[0] && range[1] ? Math.round((range[1].getTime() - range[0].getTime()) / DAY) + 1 : 0;
  return (
    <div className="flex w-full flex-col gap-3">
      <DateRangePresetPicker value={range} onChange={setRange} now={today} />
      <p className="text-xs text-muted-foreground">{days > 0 ? `${days} ${days === 1 ? 'day' : 'days'} selected. Pick custom dates to leave the presets.` : 'Pick a start and an end date.'}</p>
    </div>
  );
}

function TimeNavRelativeAbsolute() {
  const [mode, setMode] = useState('relative');
  const [from, to] = windowEndingAt(NOW, 8 * HOUR);
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground tabular-nums">{mode === 'relative' ? 'Last 8 hours' : `${formatRange(from, to)} UTC`}</span>
        <TimeRangeSwitch
          label="Time labels"
          options={[
            { value: 'relative', label: 'Relative', name: 'Relative time labels' },
            { value: 'absolute', label: 'Absolute', name: 'Absolute time labels' },
          ]}
          value={mode}
          onValueChange={setMode}
        />
      </div>
      <TimeNavTrend from={from} to={to} formatTick={mode === 'relative' ? (timestamp) => formatRelative(timestamp, NOW) : undefined} />
    </div>
  );
}

const ZONES = [
  { value: 'UTC', label: 'UTC', name: 'Coordinated Universal Time' },
  { value: 'Europe/Oslo', label: 'Plant time', name: 'Plant time, Europe/Oslo' },
];

function TimeNavTimezone() {
  const [zone, setZone] = useState('UTC');
  const [from, to] = windowEndingAt(NOW, 8 * HOUR);
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground tabular-nums">
          <IconWorld aria-hidden className="size-3.5" />
          {formatRange(from, to, zone)} {zone === 'UTC' ? 'UTC' : 'CET (UTC+1)'}
        </span>
        <TimeRangeSwitch label="Time zone" options={ZONES} value={zone} onValueChange={setZone} />
      </div>
      <TimeNavTrend from={from} to={to} timeZone={zone} />
    </div>
  );
}

function TimeNavStepper() {
  const [window, setWindow] = useState<[number, number]>(windowEndingAt(NOW - 8 * HOUR, 8 * HOUR));
  return (
    <div className="flex w-full flex-col gap-3">
      <TimeStepper showLatest value={window} onValueChange={setWindow} bounds={{ min: FIRST, max: NOW }} />
      <TimeNavTrend from={window[0]} to={window[1]} />
    </div>
  );
}

const HOME_WINDOW: [number, number] = windowEndingAt(NOW, 8 * HOUR);

function TimeNavZoom() {
  const [window, setWindow] = useState<[number, number]>(HOME_WINDOW);
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground tabular-nums">{formatRange(window[0], window[1])}</span>
        <ZoomControls showSpan anchor="end" value={window} onValueChange={setWindow} home={HOME_WINDOW} bounds={{ min: FIRST, max: NOW, minSpanMs: HOUR, maxSpanMs: 8 * DAY }} />
      </div>
      <TimeNavTrend from={window[0]} to={window[1]} />
    </div>
  );
}

function TimeNavLive() {
  const [live, setLive] = useState(true);
  const [from, to] = windowEndingAt(NOW, HOUR);
  return (
    <div className="flex w-full flex-col gap-3">
      <LiveToggle live={live} onLiveChange={setLive} lastUpdated={NOW} now={NOW} interval="every 5 s" />
      <TimeNavTrend from={from} to={to} showLast={live} />
    </div>
  );
}

const REPLAY_FROM = NOW - 8 * HOUR;

function TimeNavPlayback() {
  const [position, setPosition] = useState(NOW - 5 * HOUR);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(2);
  const value = valueAt(HISTORY, position);
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs text-muted-foreground">Replay of the day shift · discharge pressure</span>
        <ValueReadout size="sm" value={value} unit="barg" decimals={1} />
      </div>
      <TimeNavTrend from={REPLAY_FROM} to={NOW} cursor={position} regions={[{ from: position, to: NOW, tone: 'neutral' }]} />
      <PlaybackBar
        from={REPLAY_FROM}
        to={NOW}
        value={position}
        onValueChange={setPosition}
        playing={playing}
        onPlayingChange={setPlaying}
        speed={speed}
        onSpeedChange={setSpeed}
        stepMs={STEP}
        tickMs={500}
        formatTime={(timestamp) => formatClock(timestamp)}
      />
    </div>
  );
}

const OVERVIEW_FROM = NOW - 7 * DAY;
const OVERVIEW_VALUES = aggregatePoints(sliceByTime(HISTORY, OVERVIEW_FROM, NOW), HOUR).map((point) => point.avg);

function TimeNavOverviewDetail() {
  const [window, setWindow] = useState<[number, number]>([NOW - 3 * DAY, NOW - 2 * DAY]);
  return (
    <div className="flex w-full flex-col gap-3">
      <TimeNavTrend heightClassName="h-56" from={window[0]} to={window[1]} maxTicks={8} unit="barg" axisWidth={44} />
      <div className="pl-11 pr-3">
        <OverviewNavigator
          label="Discharge pressure, last 7 days"
          values={OVERVIEW_VALUES}
          from={OVERVIEW_FROM}
          to={NOW}
          value={window}
          onValueChange={setWindow}
          stepMs={HOUR}
        />
      </div>
    </div>
  );
}

const SHIFTS = [
  { value: 'night', label: 'Night', name: 'Night shift, 22:00 to 06:00', startHour: -2 },
  { value: 'day', label: 'Day', name: 'Day shift, 06:00 to 14:00', startHour: 6 },
  { value: 'evening', label: 'Evening', name: 'Evening shift, 14:00 to 22:00', startHour: 14 },
];

function TimeNavShift() {
  const [shift, setShift] = useState('day');
  const [dayOffset, setDayOffset] = useState(0);
  const midnight = NOW - 14 * HOUR - dayOffset * DAY;
  const start = midnight + (SHIFTS.find((option) => option.value === shift)?.startHour ?? 6) * HOUR;
  const end = Math.min(start + 8 * HOUR, NOW);
  const future = start >= NOW;
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button variant="ghost" size="icon-sm" aria-label="Previous day" onClick={() => setDayOffset(dayOffset + 1)}>
                  <IconChevronLeft />
                </Button>
              }
            />
            <TooltipContent>Previous day</TooltipContent>
          </Tooltip>
          <span aria-live="polite" className="min-w-14 text-center text-sm text-base-foreground tabular-nums">
            {formatDay(midnight)}
          </span>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={dayOffset === 0 ? 'Next day, unavailable: today is the latest day' : 'Next day'}
                  title={dayOffset === 0 ? 'Today is the latest day' : undefined}
                  disabled={dayOffset === 0}
                  onClick={() => setDayOffset(dayOffset - 1)}
                >
                  <IconChevronRight />
                </Button>
              }
            />
            <TooltipContent>Next day</TooltipContent>
          </Tooltip>
        </div>
        <TimeRangeSwitch label="Shift" options={SHIFTS} value={shift} onValueChange={setShift} />
      </div>
      {future ? (
        <ChartPlaceholder state="empty" heightClassName="h-36" title="This shift has not started" description="The evening shift starts at 14:00." />
      ) : (
        <TimeNavTrend from={start} to={start + 8 * HOUR} showLast={end < start + 8 * HOUR} />
      )}
      <p className="text-xs text-muted-foreground tabular-nums">{future ? 'No data yet' : `${formatRange(start, start + 8 * HOUR)} UTC`}</p>
    </div>
  );
}

const COMPARE_ITEMS = [
  { value: 'none', label: 'No comparison', offset: 0 },
  { value: 'previous', label: 'Previous 8 hours', offset: 8 * HOUR },
  { value: 'yesterday', label: 'Same time yesterday', offset: DAY },
  { value: 'week', label: 'Same time last week', offset: 7 * DAY },
];

function TimeNavCompare() {
  const id = useId();
  const [compare, setCompare] = useState('yesterday');
  const [from, to] = windowEndingAt(NOW, 8 * HOUR);
  const offset = COMPARE_ITEMS.find((item) => item.value === compare)?.offset ?? 0;
  const current = timeNavPoints(HISTORY, from, to);
  const ghost = timeNavPoints(HISTORY, from - offset, to - offset).map((point) => ({ t: point.t + offset, v: point.v }));
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex w-full max-w-56 flex-col">
        <Label htmlFor={id}>Compare with</Label>
        <Select items={COMPARE_ITEMS} value={compare} onValueChange={setCompare}>
          <SelectTrigger id={id}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COMPARE_ITEMS.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <TrendChart
        legend={offset > 0}
        heightClassName="h-36"
        label={`Discharge pressure for the last 8 hours${offset > 0 ? ` compared with ${COMPARE_ITEMS.find((item) => item.value === compare)?.label.toLowerCase()}` : ''}`}
        series={[
          ...(offset > 0 ? [{ key: 'compare', label: `${formatRange(from - offset, to - offset)}`, points: ghost, ghost: true }] : []),
          { key: 'pressure', label: 'Last 8 hours', points: current, color: 'var(--color-chart-1-450)' },
        ]}
        xDomain={[from, to]}
        yDomain={[44, 52]}
        yTicks={[44, 48, 52]}
      />
    </div>
  );
}

/** Ten-second raw samples for 2 hours. */
const RAW_2H: TrendPoint[] = makeSeries({ seed: 11, points: 721, base: 48.4, amplitude: 0.5, noise: 0.35, cycles: 1.5, stepMs: 10_000, decimals: 2 }).map((point) => ({ t: point.t, v: point.v }));

const GRANULARITIES = [
  { value: 'raw', label: 'Raw', bucket: 0 },
  { value: '1m', label: '1 minute average', bucket: MINUTE },
  { value: '1h', label: '1 hour average', bucket: HOUR },
  { value: '1d', label: '1 day average', bucket: DAY },
];

function TimeNavGranularity() {
  const id = useId();
  const [granularity, setGranularity] = useState('1m');
  const bucket = GRANULARITIES.find((item) => item.value === granularity)?.bucket ?? 0;
  const points = bucket === 0 ? RAW_2H : aggregatePoints(RAW_2H, bucket).map((point) => ({ t: point.t, v: Math.round(point.avg * 100) / 100 }));
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex w-full max-w-56 flex-col">
        <Label htmlFor={id}>Granularity</Label>
        <Select items={GRANULARITIES} value={granularity} onValueChange={setGranularity}>
          <SelectTrigger id={id}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {GRANULARITIES.map((item) => (
              <SelectItem key={item.value} value={item.value} disabled={item.value === '1d'}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <HelperText>1 day average needs a range of at least 2 days.</HelperText>
      </div>
      <TrendChart
        heightClassName="h-36"
        label={`Discharge pressure for the last 2 hours at ${GRANULARITIES.find((item) => item.value === granularity)?.label.toLowerCase()} granularity, ${points.length} points`}
        series={[{ key: 'pressure', label: 'Discharge pressure', points, variant: granularity === '1h' ? 'step' : 'line' }]}
        xDomain={[NOW - 2 * HOUR, NOW]}
        yDomain={[46, 50]}
        yTicks={[46, 48, 50]}
      />
      <p className="text-xs text-muted-foreground tabular-nums">{points.length} points drawn for 2 hours.</p>
    </div>
  );
}

const REFRESH_ITEMS = [
  { value: 'off', label: 'Off' },
  { value: '5s', label: 'Every 5 seconds' },
  { value: '30s', label: 'Every 30 seconds' },
  { value: '1m', label: 'Every minute' },
  { value: '5m', label: 'Every 5 minutes' },
];

function TimeNavAutoRefresh() {
  const id = useId();
  const [interval, setInterval] = useState('30s');
  const [from, to] = windowEndingAt(NOW, 8 * HOUR);
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex items-end justify-between gap-3">
        <div className="flex w-full max-w-56 flex-col">
          <Label htmlFor={id}>Refresh</Label>
          <Select items={REFRESH_ITEMS} value={interval} onValueChange={setInterval}>
            <SelectTrigger id={id}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REFRESH_ITEMS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground tabular-nums">Updated {formatClock(NOW)}</span>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button variant="ghost" size="icon-sm" aria-label="Refresh now">
                  <IconRefresh />
                </Button>
              }
            />
            <TooltipContent>Refresh now</TooltipContent>
          </Tooltip>
        </div>
      </div>
      <TimeNavTrend from={from} to={to} />
    </div>
  );
}

function TimeNavPaused() {
  const [live, setLive] = useState(false);
  return <LiveToggle live={live} onLiveChange={setLive} lastUpdated={live ? NOW : NOW - 18 * MINUTE} now={NOW} interval="every 5 s" className="flex-col items-start" />;
}

function TimeNavAtLatest() {
  const [window, setWindow] = useState<[number, number]>(windowEndingAt(NOW, DAY));
  return (
    <div className="flex flex-col items-center gap-2">
      <TimeStepper value={window} onValueChange={setWindow} bounds={{ min: FIRST, max: NOW }} className="flex-wrap justify-center" />
      <span className="text-xs text-muted-foreground">Forward is off at the latest data.</span>
    </div>
  );
}

function TimeNavLoadingRange() {
  const [range, setRange] = useState('7d');
  return (
    <div className="flex w-full flex-col gap-3">
      <TimeRangeSwitch options={PRESETS.slice(0, 4)} value={range} onValueChange={setRange} className="self-end" />
      <ChartPlaceholder state="loading" title={`Loading ${nameOf(range).toLowerCase()}`} heightClassName="h-36" />
    </div>
  );
}

function TimeNavChartToolbar() {
  const [window, setWindow] = useState<[number, number]>(HOME_WINDOW);
  const [live, setLive] = useState(true);
  const preset = PRESETS.find((option) => option.spanMs === window[1] - window[0] && window[1] === NOW)?.value ?? '';
  const change = (next: [number, number]) => {
    setWindow(next);
    setLive(next[1] >= NOW);
  };
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <TimeRangeSwitch options={PRESETS.slice(0, 4)} value={preset} onValueChange={(value) => change(windowEndingAt(NOW, spanOf(value)))} />
        <Separator orientation="vertical" className="data-[orientation=vertical]:h-4" />
        <TimeStepper value={window} onValueChange={change} bounds={{ min: FIRST, max: NOW }} />
        <Separator orientation="vertical" className="data-[orientation=vertical]:h-4" />
        <ZoomControls anchor="end" value={window} onValueChange={change} home={HOME_WINDOW} bounds={{ min: FIRST, max: NOW, minSpanMs: HOUR, maxSpanMs: 8 * DAY }} />
        <LiveToggle
          className="ml-auto"
          live={live}
          onLiveChange={(next) => {
            setLive(next);
            if (next) setWindow(windowEndingAt(NOW, window[1] - window[0]));
          }}
          lastUpdated={live ? NOW : window[1]}
          now={NOW}
        />
      </div>
      <TimeNavTrend heightClassName="h-56" from={window[0]} to={window[1]} maxTicks={8} unit="barg" showLast={live} limits={[{ value: 52, label: 'High 52', tone: 'warning', align: 'left' }]} yDomain={[44, 54]} yTicks={[44, 46, 48, 50, 52, 54]} />
    </div>
  );
}

function TimeNavStickyToolbar() {
  const [range, setRange] = useState('24h');
  const [window, setWindow] = useState<[number, number]>(windowEndingAt(NOW, DAY));
  const pick = (value: string) => {
    setRange(value);
    setWindow(windowEndingAt(NOW, spanOf(value)));
  };
  const move = (next: [number, number]) => {
    setWindow(next);
    setRange(next[1] === NOW ? range : '');
  };
  return (
    <div role="region" aria-label="Compressor dashboard" tabIndex={0} className="h-96 w-full overflow-y-auto rounded-xl border border-default outline-none focus-visible:shadow-focus-ring">
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-default bg-base-background px-4 py-2">
        <span className="text-sm font-medium text-base-foreground">1st stage compressor</span>
        <TimeRangeSwitch options={PRESETS.slice(1)} value={range} onValueChange={pick} className="ml-auto" />
        <TimeStepper value={window} onValueChange={move} bounds={{ min: FIRST, max: NOW }} />
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <IconWorld aria-hidden className="size-3.5" />
          UTC
        </span>
      </div>
      <div className="flex flex-col gap-6 p-4">
        {[
          { name: 'Discharge pressure', unit: 'barg', source: HISTORY, domain: [44, 52] as const, ticks: [44, 48, 52] },
          { name: 'Suction pressure', unit: 'barg', source: SECOND, domain: [10, 15] as const, ticks: [10, 12.5, 15] },
          { name: 'Discharge pressure, hourly average', unit: 'barg', source: HISTORY, domain: [44, 52] as const, ticks: [44, 48, 52] },
        ].map((chart, index) => (
          <div key={chart.name} className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-xs text-muted-foreground">{chart.name}</span>
              <ValueReadout size="xs" value={valueAt(chart.source, window[1])} unit={chart.unit} decimals={1} />
            </div>
            <TrendChart
              heightClassName="h-40"
              label={`${chart.name}, ${formatRange(window[0], window[1])}`}
              series={[{ key: 'value', label: chart.name, points: index === 2 ? aggregatePoints(sliceByTime(chart.source, window[0], window[1]), HOUR).map((point) => ({ t: point.t, v: Math.round(point.avg * 10) / 10 })) : timeNavPoints(chart.source, window[0], window[1]), variant: index === 2 ? 'step' : 'line' }]}
              xDomain={window}
              yDomain={chart.domain}
              yTicks={chart.ticks}
              maxTicks={8}
            />
          </div>
        ))}
        <p className="text-xs text-muted-foreground tabular-nums">All charts show {formatDayTime(window[0])} to {formatDayTime(window[1])} UTC. Scroll: the time toolbar stays in view.</p>
      </div>
    </div>
  );
}

export default definePage({
  id: 'time-navigation',
  title: 'Time navigation',
  summary:
    'The controls that decide which stretch of time a chart or a whole dashboard shows: presets, custom ranges, stepping, zooming, live mode, playback and the settings that change how time is read.',
  guidance: {
    use: [
      'Offer the ranges people work in — hour, shift, day, week — as one-click presets and keep a custom range for the rest.',
      'Always write out the window being shown, with its time zone, next to the control that changes it.',
      'Give every pointer gesture a button: step, zoom and reset must work from the keyboard.',
      'Use one time control for a dashboard and let every chart follow it.',
    ],
    avoid: [
      'Stepping or zooming into the future; disable the control at "now" and say why.',
      'A live view that keeps moving while someone inspects it; pause on interaction and show how far behind it is.',
      'Mixing local time and UTC on one screen without labelling which is which.',
      'Changing the y range when the time range changes; people lose their bearings.',
    ],
  },
  source,
  sections: [
    {
      id: 'presets',
      title: 'Range presets',
      description: 'One click to the ranges people use most.',
      specimens: [
        {
          id: 'TimeNavPresetButtons',
          title: 'Preset buttons',
          note: 'Pick it in a toolbar with room: five ranges as quiet buttons, the current one pressed.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/TrendChart.tsx', 'industrial/charts/timeWindow.ts', 'industrial/charts/timeAxis.ts'],
          Component: TimeNavPresetButtons,
        },
        {
          id: 'TimeNavSegmented',
          title: 'Segmented range switch',
          note: 'Pick it in a chart or card header: compact, and one range is always selected.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/TimeRangeSwitch.tsx', 'industrial/charts/TrendChart.tsx'],
          Component: TimeNavSegmented,
        },
        {
          id: 'TimeNavSegmentedSizes',
          title: 'Switch sizes',
          note: 'Pick small inside cards and chart headers, default in page toolbars.',
          origin: 'custom',
          uses: ['industrial/charts/TimeRangeSwitch.tsx'],
          Component: TimeNavSegmentedSizes,
        },
        {
          id: 'TimeNavPresetSelect',
          title: 'Range select',
          note: 'Pick it when there are more than five ranges or their names are long, such as "This shift".',
          origin: 'custom',
          align: 'stretch',
          Component: TimeNavPresetSelect,
        },
        {
          id: 'TimeNavDateJump',
          title: 'Go to day',
          note: 'Pick it for reviews of a known date, such as the day of an incident.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/charts/timeAxis.ts'],
          Component: TimeNavDateJump,
        },
      ],
    },
    {
      id: 'custom-and-labels',
      title: 'Custom ranges and time labels',
      description: 'Exact start and end, and how the axis names time.',
      specimens: [
        {
          id: 'TimeNavCustomRange',
          title: 'Custom range',
          note: 'Pick it when the period has an exact start and end, down to the minute.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/TrendChart.tsx', 'industrial/charts/ChartPlaceholder.tsx'],
          Component: TimeNavCustomRange,
        },
        {
          id: 'TimeNavPresetsWithCustom',
          title: 'Presets with custom dates',
          note: 'Pick it for day-level ranges: presets cover the common cases, the picker everything else.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['navigation/DateRangePresetPicker.tsx'],
          Component: TimeNavPresetsWithCustom,
        },
        {
          id: 'TimeNavRelativeAbsolute',
          title: 'Relative and absolute labels',
          note: 'Pick relative labels for live monitoring and absolute ones for reports and incident reviews.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/TrendChart.tsx', 'industrial/charts/TimeRangeSwitch.tsx', 'industrial/charts/timeAxis.ts'],
          Component: TimeNavRelativeAbsolute,
        },
        {
          id: 'TimeNavTimezone',
          title: 'Time zone indicator',
          note: 'Pick it whenever people in different places share a screen: the zone is named beside the range.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/TrendChart.tsx', 'industrial/charts/TimeRangeSwitch.tsx', 'industrial/charts/timeAxis.ts'],
          Component: TimeNavTimezone,
        },
      ],
    },
    {
      id: 'moving',
      title: 'Moving through time',
      description: 'Step, zoom, follow live data, replay, and navigate from an overview.',
      specimens: [
        {
          id: 'TimeNavStepper',
          title: 'Step back and forward',
          note: 'Pick it to page through history one window at a time, with a way back to the latest data.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/TimeStepper.tsx', 'industrial/charts/TrendChart.tsx'],
          Component: TimeNavStepper,
        },
        {
          id: 'TimeNavZoom',
          title: 'Zoom in, out and reset',
          note: 'Pick it next to any chart that can be zoomed by dragging; the buttons are the keyboard path.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/ZoomControls.tsx', 'industrial/charts/TrendChart.tsx'],
          Component: TimeNavZoom,
        },
        {
          id: 'TimeNavLive',
          title: 'Live toggle with last updated',
          note: 'Pick it on any view that follows new data, so people can freeze it and see how fresh it is.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/LiveToggle.tsx', 'industrial/charts/TrendChart.tsx'],
          Component: TimeNavLive,
        },
        {
          id: 'TimeNavPlayback',
          title: 'Playback bar',
          note: 'Pick it to replay a shift or an incident; the scrubber and the chart cursor share one position.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/PlaybackBar.tsx', 'industrial/charts/TrendChart.tsx'],
          Component: TimeNavPlayback,
        },
        {
          id: 'TimeNavOverviewDetail',
          title: 'Overview and detail',
          note: 'Pick it for long periods: the strip shows the whole week, the chart shows the selected window.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['industrial/charts/OverviewNavigator.tsx', 'industrial/charts/TrendChart.tsx'],
          Component: TimeNavOverviewDetail,
        },
      ],
    },
    {
      id: 'period-settings',
      title: 'Period settings',
      description: 'Shifts, comparisons, granularity and refresh.',
      specimens: [
        {
          id: 'TimeNavShift',
          title: 'Shift selector',
          note: 'Pick it where work is organised in shifts: a day stepper and day, evening or night.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/TimeRangeSwitch.tsx', 'industrial/charts/TrendChart.tsx', 'industrial/charts/ChartPlaceholder.tsx'],
          Component: TimeNavShift,
        },
        {
          id: 'TimeNavCompare',
          title: 'Compare period',
          note: 'Pick it to overlay an earlier period as a ghost line; the legend names both periods.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/TrendChart.tsx'],
          Component: TimeNavCompare,
        },
        {
          id: 'TimeNavGranularity',
          title: 'Granularity',
          note: 'Pick it to let people trade detail for speed; options that make no sense for the range are disabled.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/TrendChart.tsx', 'industrial/charts/trendData.ts'],
          Component: TimeNavGranularity,
        },
        {
          id: 'TimeNavAutoRefresh',
          title: 'Refresh interval',
          note: 'Pick it for dashboards that poll rather than stream: an interval, the last update and a manual refresh.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/TrendChart.tsx'],
          Component: TimeNavAutoRefresh,
        },
      ],
    },
    {
      id: 'states',
      title: 'States',
      description: 'Paused, at the edge of the data, and loading a new range.',
      specimens: [
        {
          id: 'TimeNavPaused',
          title: 'Paused and behind',
          note: 'Pick it to show a frozen view honestly: when it was paused and how far behind it is.',
          origin: 'custom',
          uses: ['industrial/charts/LiveToggle.tsx'],
          Component: TimeNavPaused,
        },
        {
          id: 'TimeNavAtLatest',
          title: 'At the latest data',
          note: 'Pick the disabled forward button with a reason, instead of letting people step into empty time.',
          origin: 'custom',
          uses: ['industrial/charts/TimeStepper.tsx'],
          Component: TimeNavAtLatest,
        },
        {
          id: 'TimeNavLoadingRange',
          title: 'Loading a new range',
          note: 'Pick it after a range change: the control stays usable and the chart keeps its height.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/charts/TimeRangeSwitch.tsx', 'industrial/charts/ChartPlaceholder.tsx'],
          Component: TimeNavLoadingRange,
        },
      ],
    },
    {
      id: 'toolbars',
      title: 'Time toolbars',
      description: 'The controls combined, for one chart and for a whole dashboard.',
      specimens: [
        {
          id: 'TimeNavChartToolbar',
          title: 'Chart time toolbar',
          note: 'Pick it above a main trend: presets, stepping, zoom and live in one row, all moving the same window.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: [
            'industrial/charts/TimeRangeSwitch.tsx',
            'industrial/charts/TimeStepper.tsx',
            'industrial/charts/ZoomControls.tsx',
            'industrial/charts/LiveToggle.tsx',
            'industrial/charts/TrendChart.tsx',
          ],
          Component: TimeNavChartToolbar,
        },
        {
          id: 'TimeNavStickyToolbar',
          title: 'Sticky dashboard toolbar',
          note: 'Pick it for a dashboard: one time control stays in view while scrolling and every chart follows it.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['industrial/charts/TimeRangeSwitch.tsx', 'industrial/charts/TimeStepper.tsx', 'industrial/charts/TrendChart.tsx'],
          Component: TimeNavStickyToolbar,
        },
      ],
    },
  ],
});
