import { chartSeriesColor } from '@cognite/aura/chart';
import { Slider } from '@cognite/aura/components/slider';
import { IconBell, IconFlag, IconTool } from '@cognite/aura/icons';
import { useState } from 'react';

import { ToggleGroup } from '../../../library/actions/ToggleGroup';
import { AnnotationKey } from '../../../library/industrial/charts/AnnotationKey';
import { SeriesLegend } from '../../../library/industrial/charts/SeriesLegend';
import { summarize } from '../../../library/industrial/charts/stats';
import { formatDayTime, formatSpan } from '../../../library/industrial/charts/timeAxis';
import { TrendChart } from '../../../library/industrial/charts/TrendChart';
import type { TrendEvent, TrendSeries } from '../../../library/industrial/charts/TrendChart';
import { sliceByTime, valueAt } from '../../../library/industrial/charts/trendData';
import type { TrendPoint } from '../../../library/industrial/charts/trendData';
import { formatReading } from '../../../library/industrial/status';
import type { Tone } from '../../../library/industrial/status';
import { StatusDot } from '../../../library/industrial/StatusDot';
import { ValueReadout } from '../../../library/industrial/ValueReadout';
import { HOUR, MINUTE, REFERENCE_NOW, formatTime, makeSeries } from '../../data/series';
import { definePage } from '../../types';

import source from './chart-annotations.tsx?raw';

const NOW = REFERENCE_NOW;
const STEP = 10 * MINUTE;

const trend = (options: { seed: number; base: number; amplitude?: number; noise?: number; drift?: number; cycles?: number; points?: number; end?: number }): TrendPoint[] =>
  makeSeries({ points: 145, stepMs: STEP, ...options }).map((point) => ({ t: point.t, v: point.v }));

const numbers = (points: readonly TrendPoint[]): number[] => points.flatMap((point) => (point.v === null ? [] : [point.v]));

/** Discharge pressure and temperature of the 1st stage compressor, last 24 hours. */
const PRESSURE = trend({ seed: 11, base: 48.2, amplitude: 1.4, noise: 0.4, cycles: 2 });
const TEMPERATURE = [...trend({ seed: 13, base: 137, amplitude: 3, noise: 0.9, drift: 5, cycles: 2 }).slice(0, -4), ...[143.6, 144.8, 145.7, 146.3].map((v, index) => ({ t: NOW - (3 - index) * STEP, v }))];
const SUCTION = trend({ seed: 12, base: 12.4, amplitude: 0.5, noise: 0.15, cycles: 2 });
const INTERSTAGE = trend({ seed: 18, base: 42.6, amplitude: 0.6, noise: 0.2, cycles: 2 });
const PRESSURE_SERIES: TrendSeries = { key: 'pressure', label: 'Discharge pressure', points: PRESSURE };
const TEMPERATURE_SERIES: TrendSeries = { key: 'temperature', label: 'Discharge temperature', points: TEMPERATURE };

/** Cooler outlet temperature with the cooler out of service for cleaning between 02:00 and 06:00. */
const WINDOW_FROM = NOW - 12 * HOUR;
const WINDOW_TO = NOW - 8 * HOUR;
const COOLER = trend({ seed: 19, base: 37.5, amplitude: 1.2, noise: 0.35, cycles: 2 }).map((point) => ({
  t: point.t,
  v: point.t > WINDOW_FROM && point.t < WINDOW_TO ? Math.round(((point.v ?? 0) - 9) * 10) / 10 : point.t >= WINDOW_TO ? Math.round(((point.v ?? 0) - 1.8) * 10) / 10 : point.v,
}));

/** Gas flow through the recompressor: a planned stop overnight and a trip in the early afternoon. */
const STOP_FROM = NOW - 17 * HOUR;
const STOP_TO = NOW - 13 * HOUR;
const TRIP_FROM = NOW - 3 * HOUR;
const TRIP_TO = NOW - 1.5 * HOUR;
const stopped = (t: number): boolean => (t >= STOP_FROM && t < STOP_TO) || (t >= TRIP_FROM && t < TRIP_TO);
const FLOW = makeSeries({ seed: 16, points: 145, base: 182, amplitude: 10, noise: 3, cycles: 2, stepMs: STEP, decimals: 0 }).map((point) => ({ t: point.t, v: stopped(point.t) ? 0 : point.v }));

/** Drive-end vibration with a two-hour excursion that the anomaly model flagged. */
const ANOMALY_FROM = NOW - 9 * HOUR;
const ANOMALY_TO = NOW - 7 * HOUR;
const VIBRATION = trend({ seed: 14, base: 5.4, amplitude: 0.3, noise: 0.12, cycles: 3 }).map((point) => {
  const inside = point.t >= ANOMALY_FROM && point.t <= ANOMALY_TO;
  const bump = inside ? Math.sin(((point.t - ANOMALY_FROM) / (ANOMALY_TO - ANOMALY_FROM)) * Math.PI) * 2.4 : 0;
  return { t: point.t, v: Math.round(((point.v ?? 0) + bump) * 10) / 10 };
});
const VIBRATION_PEAK = VIBRATION.reduce((peak, point) => ((point.v ?? 0) > (peak.v ?? 0) ? point : peak), VIBRATION[0]);

/** Export flow: 16 hours of history and an 8-hour forecast with its uncertainty band. */
const FORECAST_HISTORY = makeSeries({ seed: 20, points: 97, base: 412, amplitude: 16, noise: 5, cycles: 1.5, stepMs: STEP, decimals: 0 }).map((point) => ({ t: point.t, v: point.v }));
const FORECAST = Array.from({ length: 49 }, (_, index) => {
  const value = 412 - Math.sin((index / 48) * Math.PI) * 22 + index * 0.3;
  return { t: NOW + index * STEP, v: Math.round(value), low: Math.round(value - 4 - index * 0.55), high: Math.round(value + 4 + index * 0.55) };
});

/** Weekly OEE for 12 weeks against the 85 % target. */
const OEE = [80.1, 80.9, 81.4, 80.7, 82.2, 82.9, 83.4, 82.6, 83.8, 84.1, 81.9, 82.7].map((v, index) => ({ t: NOW - (11 - index) * 7 * 24 * HOUR, v }));

type AnnotationEvent = { id: string; t: number; kind: 'Alarm' | 'Work order' | 'Operator'; title: string; detail: string; tone: Tone };

/** What happened around the 1st stage compressor in the last 24 hours. */
const EVENTS: readonly AnnotationEvent[] = [
  { id: 'evt-1', t: NOW - 19 * HOUR, kind: 'Operator', title: 'Load raised to 185 kSm³/h', detail: 'Ingrid Haugen', tone: 'neutral' },
  { id: 'WO-104466', t: NOW - 11 * HOUR, kind: 'Work order', title: 'Vibration survey started', detail: 'WO-104466', tone: 'info' },
  { id: 'alm-4806', t: NOW - 5 * HOUR, kind: 'Alarm', title: 'Cooler outlet temperature high', detail: 'alm-4806 · 40.8 °C', tone: 'warning' },
  { id: 'alm-4811', t: NOW - 38 * MINUTE, kind: 'Alarm', title: 'Discharge temperature high', detail: 'alm-4811 · 146.3 °C', tone: 'warning' },
];

const EVENT_ICON = { Alarm: IconBell, 'Work order': IconTool, Operator: IconFlag };

const numbered = (events: readonly AnnotationEvent[], selectedId?: string): TrendEvent[] =>
  events.map((event, index) => ({ t: event.t, label: String(index + 1), tone: event.tone, solid: event.id === selectedId }));

/** 14 low-priority alarms spread over the day, too many to label one by one. */
const CROWDED: TrendEvent[] = [1.2, 2.1, 2.4, 4.8, 5.1, 5.3, 8.7, 9.2, 12.6, 13.1, 13.4, 16.9, 20.2, 21.5].map((hours) => ({ t: NOW - 24 * HOUR + hours * HOUR, tone: 'warning' as const }));

function ChartAnnotationLimitLabel() {
  return (
    <TrendChart
      label="Discharge pressure over the last 24 hours with its high limit of 52 barg drawn as a labelled dashed line; the limit is not reached"
      series={[PRESSURE_SERIES]}
      limits={[{ value: 52, label: 'High limit 52 barg', tone: 'warning' }]}
      yDomain={[44, 54]}
      yTicks={[44, 46, 48, 50, 52, 54]}
      unit="barg"
    />
  );
}

function ChartAnnotationTargetLine() {
  return (
    <TrendChart
      label="Weekly OEE for the last 12 weeks against the 85 percent target; it has stayed 1 to 5 points under the target"
      series={[{ key: 'oee', label: 'OEE', points: OEE, color: chartSeriesColor(3) }]}
      limits={[{ value: 85, label: 'Target 85 %', tone: 'neutral', align: 'left' }]}
      yDomain={[78, 88]}
      yTicks={[78, 80, 82, 84, 86, 88]}
      unit="%"
      summary="A target is a neutral line: missing it is a result, not an alarm."
    />
  );
}

function ChartAnnotationNowMarker() {
  return (
    <TrendChart
      label="Export flow for the last 16 hours with a marker at the current time and the planned rate for the next 8 hours"
      series={[
        { key: 'flow', label: 'Export flow', points: FORECAST_HISTORY, color: chartSeriesColor(2) },
        { key: 'plan', label: 'Planned rate', points: [{ t: NOW, v: 412 }, { t: NOW + 3 * HOUR, v: 412 }, { t: NOW + 3 * HOUR + STEP, v: 380 }, { t: NOW + 8 * HOUR, v: 380 }], variant: 'step', dashed: true, color: 'var(--color-chart-neutral-450)' },
      ]}
      events={[{ t: NOW, label: 'Now', solid: true }]}
      xDomain={[NOW - 16 * HOUR, NOW + 8 * HOUR]}
      yDomain={[340, 460]}
      yTicks={[340, 380, 420, 460]}
      unit="m³/h"
      decimals={0}
      legend
    />
  );
}

function ChartAnnotationForecastBoundary() {
  return (
    <TrendChart
      legend
      label="Export flow for the last 16 hours and its forecast for the next 8 hours; the forecast dips to about 390 cubic metres per hour around 18:00 and its uncertainty widens with time"
      series={[
        { key: 'flow', label: 'Measured', points: FORECAST_HISTORY, color: chartSeriesColor(2) },
        { key: 'forecast', label: 'Forecast', points: FORECAST.map((point) => ({ t: point.t, v: point.v })), dashed: true, color: chartSeriesColor(2) },
      ]}
      envelopes={[{ key: 'band', label: 'Forecast range', points: FORECAST.map((point) => ({ t: point.t, low: point.low, high: point.high })), color: 'var(--color-chart-2-100)' }]}
      regions={[{ from: NOW, to: NOW + 8 * HOUR, label: 'Forecast', tone: 'neutral' }]}
      events={[{ t: NOW, solid: true }]}
      xDomain={[NOW - 16 * HOUR, NOW + 8 * HOUR]}
      yDomain={[340, 460]}
      yTicks={[340, 380, 420, 460]}
      unit="m³/h"
      decimals={0}
    />
  );
}

function ChartAnnotationEventMarkers() {
  return (
    <TrendChart
      label="Discharge temperature over the last 24 hours with two events marked: a vibration survey started at 03:00 and a high temperature alarm was raised at 13:22"
      series={[TEMPERATURE_SERIES]}
      events={[
        { t: NOW - 11 * HOUR, label: 'Work order started', tone: 'info' },
        { t: NOW - 38 * MINUTE, label: 'Alarm raised', tone: 'warning' },
      ]}
      yDomain={[125, 150]}
      yTicks={[125, 130, 135, 140, 145, 150]}
      unit="°C"
    />
  );
}

function ChartAnnotationRegion() {
  return (
    <TrendChart
      label="Cooler outlet temperature over the last 24 hours with the maintenance window from 02:00 to 06:00 shaded; the temperature is 1.8 degrees lower after the cleaning"
      series={[{ key: 'cooler', label: 'Cooler outlet temperature', points: COOLER }]}
      regions={[{ from: WINDOW_FROM, to: WINDOW_TO, label: 'Maintenance', tone: 'neutral' }]}
      yDomain={[24, 42]}
      yTicks={[24, 30, 36, 42]}
      unit="°C"
      summary="WO-104471: tube bundle cleaned 02:00 to 06:00. Outlet temperature dropped from 37.5 to 35.7 °C."
    />
  );
}

function ChartAnnotationShutdown() {
  return (
    <TrendChart
      label="Recompressor gas flow over the last 24 hours with a planned stop from 21:00 to 01:00 and a trip from 11:00 to 12:30 shaded"
      series={[{ key: 'flow', label: 'Gas flow', points: FLOW, variant: 'area', color: chartSeriesColor(2) }]}
      regions={[
        { from: STOP_FROM, to: STOP_TO, label: 'Planned stop', tone: 'neutral' },
        { from: TRIP_FROM, to: TRIP_TO, label: 'Trip', tone: 'critical' },
      ]}
      yDomain={[0, 240]}
      yTicks={[0, 60, 120, 180, 240]}
      unit="kSm³/h"
      decimals={0}
    />
  );
}

function ChartAnnotationNumbered() {
  return (
    <div className="flex w-full flex-col gap-3">
      <TrendChart
        label="Discharge temperature over the last 24 hours with four numbered events, listed under the chart"
        series={[TEMPERATURE_SERIES]}
        events={numbered(EVENTS)}
        yDomain={[125, 150]}
        yTicks={[125, 130, 135, 140, 145, 150]}
        unit="°C"
      />
      <ol aria-label="Events" className="grid grid-cols-1 gap-x-6 gap-y-1 text-xs sm:grid-cols-2">
        {EVENTS.map((event, index) => (
          <li key={event.id} className="flex items-baseline gap-2">
            <span className="w-3 shrink-0 font-medium text-base-foreground tabular-nums">{index + 1}</span>
            <span className="shrink-0 text-muted-foreground tabular-nums">{formatTime(event.t)}</span>
            <span className="truncate text-medium-foreground">{event.title}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function ChartAnnotationThresholdCrossing() {
  return (
    <TrendChart
      label="Discharge temperature over the last 24 hours; the part above the 145 degree high limit, since 13:40, is drawn in warning colour"
      series={[TEMPERATURE_SERIES]}
      highlight={{ seriesKey: 'temperature', above: 145, tone: 'warning' }}
      limits={[{ value: 145, label: 'High 145', tone: 'warning', align: 'left' }]}
      markers={[{ t: NOW, v: 146.3, tone: 'warning' }]}
      yDomain={[125, 150]}
      yTicks={[125, 130, 135, 140, 145, 150]}
      unit="°C"
      summary="Crossed the high limit at 13:40 and still rising: 146.3 °C now."
    />
  );
}

function ChartAnnotationPointNote() {
  const point = PRESSURE.slice(84, 108).reduce((best, candidate) => ((candidate.v ?? 0) > (best.v ?? 0) ? candidate : best), PRESSURE[84]);
  return (
    <TrendChart
      label={`Discharge pressure over the last 24 hours with a note on the reading at ${formatTime(point.t)}: anti-surge valve opened`}
      series={[PRESSURE_SERIES]}
      markers={[{ t: point.t, v: point.v ?? 48, label: 'Anti-surge valve opened', tone: 'info' }]}
      yDomain={[44, 54]}
      yTicks={[44, 46, 48, 50, 52, 54]}
      unit="barg"
      summary={`Note by Liv Wold at ${formatTime(point.t)}: valve opened to 40 % to move the machine away from surge.`}
    />
  );
}

function ChartAnnotationAnomaly() {
  return (
    <TrendChart
      label={`Drive-end vibration over the last 24 hours with an anomaly flagged between 05:00 and 07:00, peaking at ${VIBRATION_PEAK.v} millimetres per second, still under the 7.1 high limit`}
      series={[{ key: 'vibration', label: 'Drive-end vibration', points: VIBRATION }]}
      regions={[{ from: ANOMALY_FROM, to: ANOMALY_TO, label: 'Anomaly', tone: 'info' }]}
      markers={[{ t: VIBRATION_PEAK.t, v: VIBRATION_PEAK.v ?? 0, label: `Peak ${VIBRATION_PEAK.v}`, tone: 'info' }]}
      limits={[{ value: 7.1, label: 'High 7.1', tone: 'warning' }]}
      yDomain={[4, 9]}
      yTicks={[4, 5, 6, 7, 8, 9]}
      unit="mm/s"
      summary="Flagged by the anomaly model: an unusual shape for this machine, although no limit was crossed."
    />
  );
}

function ChartAnnotationMinMax() {
  const low = PRESSURE.reduce((best, point) => ((point.v ?? Infinity) < (best.v ?? Infinity) ? point : best), PRESSURE[0]);
  const high = PRESSURE.reduce((best, point) => ((point.v ?? -Infinity) > (best.v ?? -Infinity) ? point : best), PRESSURE[0]);
  return (
    <TrendChart
      label={`Discharge pressure over the last 24 hours with its minimum of ${low.v} and maximum of ${high.v} barg marked`}
      series={[PRESSURE_SERIES]}
      markers={[
        { t: high.t, v: high.v ?? 0, label: `Max ${high.v}` },
        { t: low.t, v: low.v ?? 0, label: `Min ${low.v}`, labelPosition: 'bottom' },
      ]}
      yDomain={[44, 54]}
      yTicks={[44, 46, 48, 50, 52, 54]}
      unit="barg"
    />
  );
}

function ChartAnnotationCursorReadout() {
  const [cursor, setCursor] = useState(NOW - 9 * HOUR);
  const series = [
    { key: 'discharge', label: 'Discharge', points: PRESSURE, color: chartSeriesColor(1), unit: 'barg' },
    { key: 'interstage', label: 'Interstage', points: INTERSTAGE, color: chartSeriesColor(2), unit: 'barg' },
  ];
  return (
    <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-[minmax(0,1fr)_14rem]">
      <div className="flex min-w-0 flex-col gap-3">
        <TrendChart
          label={`Discharge and interstage pressure over the last 24 hours with a cursor at ${formatDayTime(cursor)}`}
          series={series}
          cursor={cursor}
          yDomain={[38, 54]}
          yTicks={[38, 42, 46, 50, 54]}
          unit="barg"
        />
        <div className="pl-11 pr-3">
          <Slider aria-label="Cursor time" min={NOW - 24 * HOUR} max={NOW} step={STEP} value={[cursor]} onValueChange={(next) => setCursor(next[0] ?? cursor)} />
        </div>
      </div>
      <div className="flex flex-col gap-3 rounded-xl bg-muted-background p-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Cursor</span>
          <span className="text-sm font-medium text-base-foreground tabular-nums">{formatDayTime(cursor)}</span>
        </div>
        <SeriesLegend
          orientation="column"
          label="Values at the cursor"
          items={series.map((entry) => ({ key: entry.key, label: entry.label, color: entry.color, value: valueAt(entry.points, cursor), unit: entry.unit, decimals: 1 }))}
        />
        <span className="text-xs text-muted-foreground tabular-nums">{formatSpan(NOW - cursor)} before now</span>
      </div>
    </div>
  );
}

function ChartAnnotationLegendValues() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-3">
      <span className="text-xs text-muted-foreground">1st stage compressor · now</span>
      <SeriesLegend
        orientation="column"
        label="Current values"
        items={[
          { key: 'discharge', label: 'Discharge pressure', color: chartSeriesColor(1), value: 48.6, unit: 'barg', decimals: 1 },
          { key: 'suction', label: 'Suction pressure', color: chartSeriesColor(2), value: 12.4, unit: 'barg', decimals: 1 },
          { key: 'temperature', label: 'Discharge temperature', color: chartSeriesColor(3), value: 146.3, unit: '°C', decimals: 1 },
          { key: 'bearing', label: 'Bearing temperature', color: chartSeriesColor(4), value: null, unit: '°C' },
        ]}
      />
    </div>
  );
}

function ChartAnnotationBrush() {
  const [selection, setSelection] = useState([NOW - 15 * HOUR, NOW - 9 * HOUR]);
  const stats = summarize(numbers(sliceByTime(PRESSURE, selection[0], selection[1])));
  return (
    <div className="flex w-full flex-col gap-3">
      <TrendChart
        label={`Discharge pressure over the last 24 hours with the period from ${formatTime(selection[0])} to ${formatTime(selection[1])} selected`}
        series={[PRESSURE_SERIES]}
        regions={[{ from: selection[0], to: selection[1], tone: 'selection' }]}
        yDomain={[44, 54]}
        yTicks={[44, 46, 48, 50, 52, 54]}
        unit="barg"
      />
      <div className="pl-11 pr-3">
        <Slider
          aria-label="Selected period"
          min={NOW - 24 * HOUR}
          max={NOW}
          step={STEP}
          minStepsBetweenValues={3}
          value={selection}
          onValueChange={(next) => (next.length === 2 ? setSelection(next) : undefined)}
        />
      </div>
      <p className="text-xs text-muted-foreground tabular-nums">
        Selected {formatTime(selection[0])} to {formatTime(selection[1])} ({formatSpan(selection[1] - selection[0])})
        {stats ? `: ${formatReading(stats.min, 'barg', 1)} to ${formatReading(stats.max, 'barg', 1)}, average ${formatReading(stats.mean, 'barg', 1)}.` : '.'}
      </p>
    </div>
  );
}

function ChartAnnotationCompareCursors() {
  const first = NOW - 20 * HOUR;
  const second = NOW - 4 * HOUR;
  const a = valueAt(TEMPERATURE, first) ?? 0;
  const b = valueAt(TEMPERATURE, second) ?? 0;
  return (
    <div className="flex w-full flex-col gap-3">
      <TrendChart
        label="Discharge temperature over the last 24 hours with two cursors, A at 18:00 and B at 10:00, to measure the change between them"
        series={[TEMPERATURE_SERIES]}
        events={[
          { t: first, label: 'A', solid: true },
          { t: second, label: 'B', solid: true },
        ]}
        markers={[
          { t: first, v: a },
          { t: second, v: b },
        ]}
        yDomain={[125, 150]}
        yTicks={[125, 130, 135, 140, 145, 150]}
        unit="°C"
      />
      <dl className="grid grid-cols-3 gap-4 text-xs">
        <div className="flex flex-col gap-1">
          <dt className="text-muted-foreground">A · {formatTime(first)}</dt>
          <dd>
            <ValueReadout size="sm" value={a} unit="°C" decimals={1} />
          </dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-muted-foreground">B · {formatTime(second)}</dt>
          <dd>
            <ValueReadout size="sm" value={b} unit="°C" decimals={1} />
          </dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-muted-foreground">B − A · {formatSpan(second - first)}</dt>
          <dd>
            <ValueReadout size="sm" value={b - a} unit="°C" decimals={1} />
          </dd>
        </div>
      </dl>
    </div>
  );
}

function ChartAnnotationEventList() {
  const [selected, setSelected] = useState('alm-4811');
  return (
    <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <TrendChart
        heightClassName="h-72"
        label="Discharge temperature of the 1st stage compressor over the last 24 hours with four numbered events; the selected event is drawn as a solid line"
        series={[TEMPERATURE_SERIES]}
        events={numbered(EVENTS, selected)}
        limits={[{ value: 145, label: 'High 145', tone: 'warning', align: 'left' }]}
        yDomain={[125, 150]}
        yTicks={[125, 130, 135, 140, 145, 150]}
        unit="°C"
        maxTicks={8}
      />
      <ol aria-label="Events in this period" className="flex flex-col gap-1">
        {EVENTS.map((event, index) => {
          const Icon = EVENT_ICON[event.kind];
          const active = event.id === selected;
          return (
            <li key={event.id}>
              <button
                type="button"
                aria-pressed={active}
                onClick={() => setSelected(event.id)}
                className={`flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left outline-none focus-visible:shadow-focus-ring ${active ? 'bg-muted-background' : 'hover:bg-muted-background'}`}
              >
                <span className="w-3 shrink-0 pt-0.5 text-xs font-medium text-base-foreground tabular-nums">{index + 1}</span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-sm text-base-foreground">{event.title}</span>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground tabular-nums">
                    <Icon aria-hidden className="size-3.5 shrink-0" />
                    {event.kind} · {formatTime(event.t)} · {event.detail}
                  </span>
                </span>
                <StatusDot tone={event.tone} size="sm" className="mt-1.5" />
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function ChartAnnotationCombined() {
  return (
    <div className="flex w-full flex-col gap-3">
      <TrendChart
        heightClassName="h-64"
        label="Cooler outlet temperature over the last 24 hours with a high limit, a maintenance window, an alarm marker and a note, explained in the key under the chart"
        series={[{ key: 'cooler', label: 'Cooler outlet temperature', points: COOLER }]}
        limits={[{ value: 40, label: 'High 40', tone: 'warning' }]}
        regions={[{ from: WINDOW_FROM, to: WINDOW_TO, label: 'Maintenance', tone: 'neutral' }]}
        events={[{ t: NOW - 16 * HOUR, label: 'Alarm', tone: 'warning' }]}
        markers={[{ t: WINDOW_TO + 2 * STEP, v: valueAt(COOLER, WINDOW_TO + 2 * STEP) ?? 0, label: 'Back in service', tone: 'info' }]}
        cursor={NOW - 3 * HOUR}
        yDomain={[24, 42]}
        yTicks={[24, 30, 36, 42]}
        unit="°C"
        maxTicks={8}
      />
      <AnnotationKey
        items={[
          { kind: 'limit', label: 'High limit', tone: 'warning' },
          { kind: 'region', label: 'Maintenance window' },
          { kind: 'event', label: 'Alarm raised', tone: 'warning' },
          { kind: 'marker', label: 'Note', tone: 'info' },
          { kind: 'cursor', label: 'Cursor' },
        ]}
      />
    </div>
  );
}

function ChartAnnotationKeyOnly() {
  return (
    <AnnotationKey
      className="flex-col items-start gap-y-2"
      items={[
        { kind: 'limit', label: 'Trip limit', tone: 'critical' },
        { kind: 'limit', label: 'High limit', tone: 'warning' },
        { kind: 'limit', label: 'Target' },
        { kind: 'region', label: 'Planned stop' },
        { kind: 'region', label: 'Trip', tone: 'critical' },
        { kind: 'event', label: 'Work order started', tone: 'info' },
        { kind: 'marker', label: 'Operator note', tone: 'info' },
      ]}
    />
  );
}

function ChartAnnotationCrowded() {
  return (
    <TrendChart
      label="Discharge pressure over the last 24 hours with 14 low-priority alarms as unlabelled markers; they cluster around 20:00 and 03:00"
      series={[PRESSURE_SERIES]}
      events={CROWDED}
      yDomain={[44, 54]}
      yTicks={[44, 46, 48, 50, 52, 54]}
      unit="barg"
      summary="14 alarms in this period. Markers are not labelled at this density; open the alarm list for details."
    />
  );
}

const LAYERS = [
  { value: 'limits', label: 'Limits' },
  { value: 'events', label: 'Events' },
  { value: 'maintenance', label: 'Maintenance' },
];

function ChartAnnotationToggle() {
  const [layers, setLayers] = useState(['limits', 'maintenance']);
  return (
    <div className="flex w-full flex-col gap-3">
      <ToggleGroup label="Annotation layers" options={LAYERS} value={layers} onValueChange={setLayers} size="sm" variant="outline" />
      <TrendChart
        label={`Cooler outlet temperature over the last 24 hours showing ${layers.length === 0 ? 'no annotation layers' : layers.join(', ')}`}
        series={[{ key: 'cooler', label: 'Cooler outlet temperature', points: COOLER }]}
        limits={layers.includes('limits') ? [{ value: 40, label: 'High 40', tone: 'warning' }] : []}
        regions={layers.includes('maintenance') ? [{ from: WINDOW_FROM, to: WINDOW_TO, label: 'Maintenance', tone: 'neutral' }] : []}
        events={layers.includes('events') ? [{ t: NOW - 16 * HOUR, label: 'Alarm', tone: 'warning' }, { t: NOW - 5 * HOUR, label: 'Alarm', tone: 'warning' }] : []}
        yDomain={[24, 42]}
        yTicks={[24, 30, 36, 42]}
        unit="°C"
      />
    </div>
  );
}

function ChartAnnotationNoEvents() {
  return (
    <TrendChart
      label="Suction pressure over the last 24 hours; no alarms, work orders or notes in this period"
      series={[{ key: 'suction', label: 'Suction pressure', points: SUCTION }]}
      limits={[{ value: 15, label: 'High 15', tone: 'warning' }]}
      yDomain={[10, 16]}
      yTicks={[10, 12, 14, 16]}
      unit="barg"
      summary="No alarms, work orders or notes in the last 24 hours."
    />
  );
}

function ChartAnnotationWithStates() {
  return (
    <TrendChart
      label="Recompressor gas flow over the last 24 hours with the trip at 11:00 marked and the run state as a strip underneath"
      series={[{ key: 'flow', label: 'Gas flow', points: FLOW, variant: 'area', color: chartSeriesColor(2) }]}
      events={[{ t: TRIP_FROM, label: 'Trip', tone: 'critical' }]}
      states={[
        { from: NOW - 24 * HOUR, to: STOP_FROM, label: 'Running', tone: 'neutral' },
        { from: STOP_FROM, to: STOP_TO, label: 'Planned stop', tone: 'info' },
        { from: STOP_TO, to: TRIP_FROM, label: 'Running', tone: 'neutral' },
        { from: TRIP_FROM, to: TRIP_TO, label: 'Tripped', tone: 'critical' },
        { from: TRIP_TO, to: NOW, label: 'Running', tone: 'neutral' },
      ]}
      statesLabel="Recompressor run state"
      yDomain={[0, 240]}
      yTicks={[0, 60, 120, 180, 240]}
      unit="kSm³/h"
      decimals={0}
    />
  );
}

export default definePage({
  id: 'chart-annotations',
  title: 'Chart annotations',
  summary:
    'Everything drawn on a trend that is not the data: limits and targets, events, shaded periods, notes, cursors and selections. Annotations turn "what happened" into "why", so each kind has one look and a key.',
  guidance: {
    use: [
      'Use a dashed horizontal line for a limit or target, a dotted vertical line for an event and a shaded band for a period.',
      'Label annotations on the chart when there are up to four; number them and list them beside the chart beyond that.',
      'Give status colour only to annotations that are a status: alarms, trips and limit excursions.',
      'Add a key as soon as a chart carries more than one kind of annotation.',
    ],
    avoid: [
      'Labels that sit on top of the series; move the label to the other end of the line.',
      'Shading every period; a chart that is mostly shaded has no background left to read against.',
      'Annotations without a time or a source; a marker should lead to the alarm, work order or note behind it.',
      'A cursor readout that only exists on hover; pin it so it works with keyboard and touch.',
    ],
  },
  source,
  sections: [
    {
      id: 'lines',
      title: 'Lines and boundaries',
      description: 'A value or a moment the series is read against.',
      specimens: [
        {
          id: 'ChartAnnotationLimitLabel',
          title: 'Limit line with label',
          note: 'Pick it for an operating limit: dashed, in warning colour, with its name and value on the line.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/TrendChart.tsx'],
          Component: ChartAnnotationLimitLabel,
        },
        {
          id: 'ChartAnnotationTargetLine',
          title: 'Target line with label',
          note: 'Pick the neutral line for targets, plans and capacities, which are goals and not alarm limits.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/TrendChart.tsx'],
          Component: ChartAnnotationTargetLine,
        },
        {
          id: 'ChartAnnotationNowMarker',
          title: 'Now marker',
          note: 'Pick it when the time axis runs into the future, so nobody reads the plan as measured data.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/TrendChart.tsx'],
          Component: ChartAnnotationNowMarker,
        },
        {
          id: 'ChartAnnotationForecastBoundary',
          title: 'Forecast boundary',
          note: 'Pick it where measured data hands over to a forecast: a solid line, a shaded future and a dashed series.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/TrendChart.tsx'],
          Component: ChartAnnotationForecastBoundary,
        },
      ],
    },
    {
      id: 'events-and-regions',
      title: 'Events and periods',
      description: 'Moments and stretches of time that explain the shape of the trend.',
      specimens: [
        {
          id: 'ChartAnnotationEventMarkers',
          title: 'Event markers',
          note: 'Pick it for up to four events that can carry their own label: an alarm raised, a work order started.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/TrendChart.tsx'],
          Component: ChartAnnotationEventMarkers,
        },
        {
          id: 'ChartAnnotationNumbered',
          title: 'Numbered events with list',
          note: 'Pick it when event names are too long for the plot; the numbers tie the markers to the list.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/TrendChart.tsx'],
          Component: ChartAnnotationNumbered,
        },
        {
          id: 'ChartAnnotationRegion',
          title: 'Maintenance window',
          note: 'Pick a neutral shaded band for a planned period, so the dip inside it is not mistaken for a fault.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/TrendChart.tsx'],
          Component: ChartAnnotationRegion,
        },
        {
          id: 'ChartAnnotationShutdown',
          title: 'Planned stop and trip',
          note: 'Pick it to tell stops apart: neutral for the planned one, critical for the trip.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/TrendChart.tsx'],
          Component: ChartAnnotationShutdown,
        },
      ],
    },
    {
      id: 'points-and-highlights',
      title: 'Points and highlights',
      description: 'Single readings and stretches of the series itself.',
      specimens: [
        {
          id: 'ChartAnnotationThresholdCrossing',
          title: 'Threshold crossing',
          note: 'Pick it to show exactly where a series left its limits; only the part beyond the limit changes colour.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/TrendChart.tsx', 'industrial/charts/trendData.ts'],
          Component: ChartAnnotationThresholdCrossing,
        },
        {
          id: 'ChartAnnotationPointNote',
          title: 'Point with note',
          note: 'Pick it for an operator note attached to one reading; the full note goes under the chart.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/TrendChart.tsx'],
          Component: ChartAnnotationPointNote,
        },
        {
          id: 'ChartAnnotationAnomaly',
          title: 'Annotated anomaly',
          note: 'Pick it for a model finding: the flagged period is shaded in info colour and its peak is marked.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/TrendChart.tsx'],
          Component: ChartAnnotationAnomaly,
        },
        {
          id: 'ChartAnnotationMinMax',
          title: 'Minimum and maximum',
          note: 'Pick it when the extremes of the period are what people would otherwise hunt for with the cursor.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/TrendChart.tsx'],
          Component: ChartAnnotationMinMax,
        },
      ],
    },
    {
      id: 'cursor-and-selection',
      title: 'Cursor and selection',
      description: 'Reading values at a time, between two times and across a period.',
      specimens: [
        {
          id: 'ChartAnnotationCursorReadout',
          title: 'Cursor with readout panel',
          note: 'Pick it to compare series at one moment; the pinned panel works without hover.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['industrial/charts/TrendChart.tsx', 'industrial/charts/SeriesLegend.tsx', 'industrial/charts/trendData.ts'],
          Component: ChartAnnotationCursorReadout,
        },
        {
          id: 'ChartAnnotationLegendValues',
          title: 'Legend with current values',
          note: 'Pick it beside a multi-series chart, so the legend doubles as the live readout.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['industrial/charts/SeriesLegend.tsx'],
          Component: ChartAnnotationLegendValues,
        },
        {
          id: 'ChartAnnotationBrush',
          title: 'Range selection',
          note: 'Pick it to let people mark a period and get its statistics, or zoom into it.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/TrendChart.tsx', 'industrial/charts/stats.ts'],
          Component: ChartAnnotationBrush,
        },
        {
          id: 'ChartAnnotationCompareCursors',
          title: 'Two cursors with difference',
          note: 'Pick it to measure a change: how much, and over how long, between two points in time.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/TrendChart.tsx', 'industrial/ValueReadout.tsx'],
          Component: ChartAnnotationCompareCursors,
        },
      ],
    },
    {
      id: 'linked',
      title: 'Linked and combined',
      description: 'Annotations tied to a list, and several kinds on one chart.',
      specimens: [
        {
          id: 'ChartAnnotationEventList',
          title: 'Event list linked to chart',
          note: 'Pick it for investigation: selecting an event in the list picks out its marker on the trend.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['industrial/charts/TrendChart.tsx', 'industrial/StatusDot.tsx'],
          Component: ChartAnnotationEventList,
        },
        {
          id: 'ChartAnnotationCombined',
          title: 'Several kinds with a key',
          note: 'Pick it when a chart needs a limit, a period, events and notes at once; the key keeps them apart.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['industrial/charts/TrendChart.tsx', 'industrial/charts/AnnotationKey.tsx'],
          Component: ChartAnnotationCombined,
        },
        {
          id: 'ChartAnnotationKeyOnly',
          title: 'Annotation key',
          note: 'Pick the stacked key in a side panel; every glyph matches how the annotation is drawn.',
          origin: 'custom',
          size: 'sm',
          uses: ['industrial/charts/AnnotationKey.tsx'],
          Component: ChartAnnotationKeyOnly,
        },
      ],
    },
    {
      id: 'density-and-layers',
      title: 'Density and layers',
      description: 'Many annotations, none, and letting people choose.',
      specimens: [
        {
          id: 'ChartAnnotationCrowded',
          title: 'Many events',
          note: 'Pick unlabelled markers and a count once labels would collide; the pattern is the message.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/TrendChart.tsx'],
          Component: ChartAnnotationCrowded,
        },
        {
          id: 'ChartAnnotationToggle',
          title: 'Layer toggles',
          note: 'Pick it when different roles need different annotations on the same trend.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/TrendChart.tsx', 'actions/ToggleGroup.tsx'],
          Component: ChartAnnotationToggle,
        },
        {
          id: 'ChartAnnotationWithStates',
          title: 'Event with state strip',
          note: 'Pick it when the event starts a state: the marker gives the moment, the strip gives the duration.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/TrendChart.tsx'],
          Component: ChartAnnotationWithStates,
        },
        {
          id: 'ChartAnnotationNoEvents',
          title: 'No events',
          note: 'Pick it to say that nothing happened; an empty plot alone could mean the events failed to load.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/TrendChart.tsx'],
          Component: ChartAnnotationNoEvents,
        },
      ],
    },
  ],
});
