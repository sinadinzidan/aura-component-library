import { chartSeriesColor } from '@cognite/aura/chart';
import { Alert, AlertDescription, AlertTitle } from '@cognite/aura/components/alert';
import { Button } from '@cognite/aura/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardHeaderCenter, CardTitle } from '@cognite/aura/components/card';
import { useState } from 'react';

import { confidenceBand, extendSeries, fanScenario, formatLeadTime, mape, percentErrors, timeToLimit } from '../../../library/industrial/analytics/forecast';
import type { ForecastPoint } from '../../../library/industrial/analytics/forecast';
import { ForecastChart } from '../../../library/industrial/analytics/ForecastChart';
import { PredictionCard } from '../../../library/industrial/analytics/PredictionCard';
import type { PredictionDriver } from '../../../library/industrial/analytics/PredictionCard';
import { CategoryChart } from '../../../library/industrial/charts/CategoryChart';
import type { CategoryRow } from '../../../library/industrial/charts/CategoryChart';
import { ChartPlaceholder } from '../../../library/industrial/charts/ChartPlaceholder';
import type { TimeRangeOption } from '../../../library/industrial/charts/timeRanges';
import { TimeRangeSwitch } from '../../../library/industrial/charts/TimeRangeSwitch';
import { TrendCard } from '../../../library/industrial/charts/TrendCard';
import { TrendChart } from '../../../library/industrial/charts/TrendChart';
import { PercentileBand } from '../../../library/industrial/domains2/PercentileBand';
import { KpiTile } from '../../../library/industrial/KpiTile';
import { formatReading, formatValue } from '../../../library/industrial/status';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { ValueReadout } from '../../../library/industrial/ValueReadout';
import { ASSETS, PLANT_KPIS, SENSORS } from '../../data/plant';
import type { Sensor } from '../../data/plant';
import { DAY, HOUR, MINUTE, REFERENCE_NOW, formatDate, formatTime, makeSeries } from '../../data/series';
import { definePage } from '../../types';

import source from './forecasts-and-predictions.tsx?raw';

const NOW = REFERENCE_NOW;

function forecastPredSensor(id: string): Sensor {
  const sensor = SENSORS.find((candidate) => candidate.id === id);
  if (!sensor) throw new Error(`Unknown sensor ${id}`);
  return sensor;
}

type ForecastPredWindow = { hours: number; stepMs: number; drift?: number; amplitude?: number; cycles?: number; noise?: number; end?: number; endValue?: number };

/** Measured history for a sensor that ends on `endValue` (its current value by default). */
function forecastPredHistory(sensor: Sensor, { hours, stepMs, drift = 0, amplitude = 0, cycles = 1, noise = 0.2, end = NOW, endValue = sensor.value }: ForecastPredWindow): ForecastPoint[] {
  const history = makeSeries({
    seed: sensor.seed,
    points: Math.round((hours * HOUR) / stepMs),
    base: endValue - drift,
    drift,
    amplitude,
    cycles,
    noise,
    stepMs,
    end: end - stepMs,
    decimals: sensor.decimals,
  });
  return [...history.map((point) => ({ t: point.t, v: point.v })), { t: end, v: endValue }];
}

const TEMPERATURE = forecastPredSensor('tt-92532');
const EXPORT_FLOW = forecastPredSensor('ft-20011');
const VIBRATION = forecastPredSensor('vt-92540');

/** Discharge temperature: 12 hours measured, climbing, and the next 12 hours predicted. */
const TEMP_HISTORY = forecastPredHistory(TEMPERATURE, { hours: 12, stepMs: 15 * MINUTE, drift: 7.4, noise: 0.25 });
const TEMP_FORECAST = extendSeries(TEMP_HISTORY, { steps: 48, lookback: 48 });
const TEMP_BAND = confidenceBand(TEMP_FORECAST, { initial: 0.4, growth: 3.6 });
const TEMP_LIMIT_AT = timeToLimit(TEMP_FORECAST, TEMPERATURE.highLimit) ?? NOW + 6 * HOUR;
const TEMP_EARLIEST = timeToLimit(TEMP_BAND.map((point) => ({ t: point.t, v: point.high })), TEMPERATURE.highLimit) ?? TEMP_LIMIT_AT;
/** Predicted change over the next hour (four 15-minute steps). */
const TEMP_RATE = TEMP_FORECAST[3].v - TEMPERATURE.value;
const TEMP_LEAD = formatLeadTime(TEMP_LIMIT_AT - NOW);
const TEMP_LEAD_RANGE = `${formatLeadTime(TEMP_EARLIEST - NOW)} at the earliest`;

const TEMP_LIMITS = [
  { value: 155, label: 'Trip 155', tone: 'critical', align: 'left' },
  { value: 145, label: 'High 145', tone: 'warning', align: 'left' },
] as const;

/** A backtest: the forecast made 12 hours ago against what was then measured. */
const BACKTEST_AT = NOW - 12 * HOUR;
const BACKTEST_FULL = forecastPredHistory(EXPORT_FLOW, { hours: 24, stepMs: 30 * MINUTE, amplitude: 14, cycles: 1, noise: 3, drift: 6 });
const BACKTEST_HISTORY = BACKTEST_FULL.filter((point) => point.t <= BACKTEST_AT);
const BACKTEST_ACTUAL = BACKTEST_FULL.filter((point) => point.t >= BACKTEST_AT);
const BACKTEST_FORECAST = extendSeries(BACKTEST_HISTORY, { steps: 24, lookback: 12, slopeFactor: 0.35, amplitude: -9, periodSteps: 40, decimals: 0 });
const BACKTEST_MAPE = mape(BACKTEST_ACTUAL, BACKTEST_FORECAST) ?? 0;
const BACKTEST_WORST = Math.max(...percentErrors(BACKTEST_ACTUAL, BACKTEST_FORECAST).map((point) => point.v));

const HORIZONS: readonly TimeRangeOption[] = [
  { value: '6h', label: '6 h', name: 'Next 6 hours', spanMs: 6 * HOUR },
  { value: '24h', label: '24 h', name: 'Next 24 hours', spanMs: 24 * HOUR },
  { value: '3d', label: '3 d', name: 'Next 3 days', spanMs: 3 * DAY },
];

function forecastPredHorizon(spanMs: number) {
  const stepMs = spanMs / 36;
  const history = forecastPredHistory(EXPORT_FLOW, { hours: spanMs / HOUR, stepMs, amplitude: 12, cycles: spanMs / DAY, noise: 2.5 });
  const forecast = extendSeries(history, { steps: 36, lookback: 36, slopeFactor: 0.2, amplitude: 12, periodSteps: (DAY / stepMs) * 1, decimals: 0 });
  return { history, forecast, band: confidenceBand(forecast, { initial: 4, growth: 6 + (spanMs / DAY) * 9, decimals: 0 }) };
}

/** Plant power demand: two days measured with a daily pattern, two days predicted. */
const DEMAND_HISTORY = makeSeries({ seed: 52, points: 49, base: 42, amplitude: 4.2, cycles: 2, noise: 0.5 }).map((point) => ({ t: point.t, v: point.v }));
const DEMAND_FORECAST = extendSeries(DEMAND_HISTORY, { steps: 48, lookback: 48, slopeFactor: 0, amplitude: 4.2, periodSteps: 24 });
const DEMAND_BAND = confidenceBand(DEMAND_FORECAST, { initial: 0.6, growth: 1.8 });
const DEMAND_PEAK = DEMAND_FORECAST.reduce((peak, point) => (point.v > peak.v ? point : peak), DEMAND_FORECAST[0]);

/** Daily gas export: two weeks measured, two weeks ahead in three scenarios. */
const EXPORT_HISTORY = makeSeries({ seed: 31, points: 14, base: 4.34, amplitude: 0.08, noise: 0.05, cycles: 1.5, stepMs: DAY, decimals: 2 }).map((point, index, all) => ({
  t: point.t,
  v: index === all.length - 1 ? PLANT_KPIS.gasExport.value : point.v,
}));
const EXPORT_BASE = extendSeries(EXPORT_HISTORY, { steps: 14, stepMs: DAY, slopeFactor: 0, decimals: 2 });
const EXPORT_HIGH = fanScenario(EXPORT_BASE, 0.045, 2);
const EXPORT_LOW = fanScenario(EXPORT_BASE, -0.09, 2);

const FORECAST_PRED_SCENARIOS = [
  { key: 'high', label: 'Recompressor back 14 Mar', points: EXPORT_HIGH, end: EXPORT_HIGH[EXPORT_HIGH.length - 1].v },
  { key: 'base', label: 'Recompressor back 20 Mar', points: EXPORT_BASE, end: EXPORT_BASE[EXPORT_BASE.length - 1].v },
  { key: 'low', label: 'Recompressor out all period', points: EXPORT_LOW, end: EXPORT_LOW[EXPORT_LOW.length - 1].v },
];

/** Daily production: the past week measured, the next six days predicted, against the plan. */
const PRODUCTION_ROWS: CategoryRow[] = [4.41, 4.46, 3.62, 3.98, 4.21, 4.33, 4.38, null, null, null, null, null, null].map((actual, index) => {
  const forecast = [4.36, 4.39, 4.47, 4.52, 4.54, 4.55][index - 7] ?? null;
  return { category: formatDate(NOW + (index - 6) * DAY), actual, forecast, plan: 4.5 };
});
const PRODUCTION_FORECAST_TOTAL = PRODUCTION_ROWS.reduce((sum, row) => sum + (typeof row.forecast === 'number' ? row.forecast : 0), 0);

/** Probability of a failure within 30 days per rotating machine, from the condition model. */
const FAILURE_ROWS: CategoryRow[] = [
  { id: '23-ka-9103', probability: 41 },
  { id: '23-ka-9101', probability: 23 },
  { id: '40-pa-4001', probability: 17 },
  { id: '23-gt-9001', probability: 8 },
  { id: '23-ka-9102', probability: 6 },
  { id: '27-pa-2001a', probability: 3 },
].map((row) => ({ category: ASSETS.find((asset) => asset.id === row.id)?.name ?? row.id, probability: row.probability }));

/** Daily forecast error for the last 30 days, creeping up since the recompressor trip changed the plant. */
const ERROR_TREND = makeSeries({ seed: 64, points: 30, base: 2.6, drift: 2.4, noise: 0.5, stepMs: DAY, min: 1.2 }).map((point) => ({ t: point.t, v: point.v }));

const TEMP_DRIVERS: readonly PredictionDriver[] = [
  { id: 'cooler', label: 'Cooler outlet temperature rising', detail: '23-TT-91141 · +2.5 °C in 24 h', weight: 0.46, direction: 'up' },
  { id: 'ratio', label: 'Pressure ratio above normal', detail: '23-PT-92531 / 23-PT-92530 · 3.9 against 3.6', weight: 0.27, direction: 'up' },
  { id: 'ambient', label: 'Ambient temperature', detail: 'Forecast 11 °C at 18:00', weight: 0.15, direction: 'up' },
  { id: 'load', label: 'Planned load reduction at 20:00', detail: 'Export nomination drops 4 %', weight: 0.12, direction: 'down' },
];

const LIFE_DRIVERS: readonly PredictionDriver[] = [
  { id: 'vibration', label: 'Vibration trend', detail: '23-VT-92540 · +0.9 mm/s in 24 h', weight: 0.52, direction: 'down' },
  { id: 'temperature', label: 'Bearing temperature', detail: '4 °C above the fleet median', weight: 0.31, direction: 'down' },
  { id: 'starts', label: 'Starts since overhaul', detail: '212 of 400 design starts', weight: 0.17, direction: 'down' },
];

function ForecastPredBasic() {
  return (
    <ForecastChart
      label={'Discharge temperature of the 1st stage compressor for the last 12 hours and forecast for the next 12; it is predicted to keep rising from 141.2 degrees Celsius'}
      history={TEMP_HISTORY}
      forecast={TEMP_FORECAST}
      now={NOW}
      yDomain={[130, 150]}
      yTicks={[130, 135, 140, 145, 150]}
      unit="°C"
      summary="Solid is measured, dashed is predicted. The vertical line marks where measurement ends."
    />
  );
}

function ForecastPredConfidenceBand() {
  const last = TEMP_BAND[TEMP_BAND.length - 1];
  return (
    <ForecastChart
      label={`Discharge temperature forecast for the next 12 hours with its P10 to P90 range; by ${formatTime(last.t)} the range spans ${formatValue(last.low, 1)} to ${formatValue(last.high, 1)} degrees Celsius`}
      history={TEMP_HISTORY}
      forecast={TEMP_FORECAST}
      band={TEMP_BAND}
      now={NOW}
      yDomain={[130, 155]}
      yTicks={[130, 135, 140, 145, 150, 155]}
      unit="°C"
      summary={`Eight of ten outcomes fall inside the band: ${formatReading(last.low, '°C', 1)} to ${formatReading(last.high, '°C', 1)} at ${formatTime(last.t)}.`}
    />
  );
}

function ForecastPredBacktest() {
  return (
    <ForecastChart
      label={`Export flow forecast made at ${formatTime(BACKTEST_AT)} against the flow measured since; the mean error is ${formatValue(BACKTEST_MAPE, 1)} percent`}
      history={BACKTEST_HISTORY}
      forecast={BACKTEST_FORECAST}
      actual={BACKTEST_ACTUAL}
      now={BACKTEST_AT}
      nowLabel="Forecast made"
      forecastLabel="Forecast from 02:00"
      actualLabel="Measured since"
      yDomain={[360, 460]}
      yTicks={[360, 385, 410, 435, 460]}
      unit="m³/h"
      decimals={0}
      summary={`Mean error ${formatValue(BACKTEST_MAPE, 1)} %, largest ${formatValue(BACKTEST_WORST, 1)} %. The forecast missed the dip around 08:00.`}
    />
  );
}

function ForecastPredHorizonSwitch() {
  const [horizon, setHorizon] = useState('24h');
  const option = HORIZONS.find((candidate) => candidate.value === horizon) ?? HORIZONS[1];
  const { history, forecast, band } = forecastPredHorizon(option.spanMs ?? DAY);
  const end = band[band.length - 1];

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm font-medium text-base-foreground">Export flow forecast</span>
        <TimeRangeSwitch options={HORIZONS} value={horizon} onValueChange={setHorizon} label="Forecast horizon" />
      </div>
      <ForecastChart
        label={`Export flow with a forecast for the ${option.name?.toLowerCase() ?? horizon}; the range widens to ${formatValue(end.low)} to ${formatValue(end.high)} cubic metres per hour at the end`}
        history={history}
        forecast={forecast}
        band={band}
        now={NOW}
        yDomain={[340, 480]}
        yTicks={[340, 375, 410, 445, 480]}
        unit="m³/h"
        decimals={0}
        legend={false}
        summary={`${option.name}: ${formatValue(end.low)} to ${formatValue(end.high)} m³/h at the end of the horizon. A longer horizon always has a wider range.`}
      />
    </div>
  );
}

function ForecastPredTimeToLimit() {
  return (
    <ForecastChart
      label={`Discharge temperature forecast against its high limit of 145 degrees Celsius; it is predicted to reach the limit at ${formatTime(TEMP_LIMIT_AT)}, in about ${TEMP_LEAD}`}
      history={TEMP_HISTORY}
      forecast={TEMP_FORECAST}
      band={TEMP_BAND}
      now={NOW}
      limits={TEMP_LIMITS}
      markers={[{ t: TEMP_LIMIT_AT, v: TEMPERATURE.highLimit, label: `High limit in ~${TEMP_LEAD}`, tone: 'warning', labelPosition: 'top' }]}
      yDomain={[130, 160]}
      yTicks={[130, 140, 150, 160]}
      maxTicks={8}
      unit="°C"
      heightClassName="h-64"
      summary={`Reaches the 145 °C high limit at about ${formatTime(TEMP_LIMIT_AT)} (${TEMP_LEAD_RANGE}). The 155 °C trip limit is outside the 12 hour horizon.`}
    />
  );
}

function ForecastPredTimeToLimitTile() {
  return (
    <Card className="w-full max-w-xs" role="group" aria-label="Time to high limit, discharge temperature">
      <CardHeader>
        <CardHeaderCenter>
          <CardTitle as="h4">Time to high limit</CardTitle>
          <CardDescription>
            <span className="font-mono">23-TT-92532</span> · 145 °C
          </CardDescription>
        </CardHeaderCenter>
      </CardHeader>
      <CardContent>
        <div className="flex w-full flex-col gap-3">
          <p className="flex items-baseline gap-2">
            <span className="text-3xl font-semibold tracking-tight tabular-nums text-warning-foreground-strong">~{TEMP_LEAD}</span>
            <span className="text-sm text-muted-foreground tabular-nums">at about {formatTime(TEMP_LIMIT_AT)}</span>
          </p>
          <StatusIndicator size="sm" tone="warning" shape="square" label="Act this shift" detail={TEMP_LEAD_RANGE} />
          <p className="text-xs text-muted-foreground">
            Now {formatReading(TEMPERATURE.value, '°C', 1)}, rising {formatValue(TEMP_RATE, 1)} °C per hour.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function ForecastPredRemainingLife() {
  return (
    <Card className="w-full" role="group" aria-label="Remaining useful life, drive-end bearing">
      <CardHeader>
        <CardHeaderCenter>
          <CardTitle as="h4">Remaining useful life</CardTitle>
          <CardDescription>
            Drive-end bearing · <span className="font-mono">23-KA-9101</span>
          </CardDescription>
        </CardHeaderCenter>
      </CardHeader>
      <CardContent>
        <div className="flex w-full flex-col gap-4">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <ValueReadout value={38} unit="days" size="lg" />
            <span className="text-sm text-muted-foreground tabular-nums">most likely · 21 to 62 days</span>
          </div>
          <PercentileBand label="Remaining useful life, drive-end bearing" p10={21} p50={38} p90={62} unit="d" decimals={0} min={0} max={80} reference={{ value: 26, label: 'Planned stop, 7 Apr' }} />
          <p className="text-xs text-muted-foreground">One outcome in ten ends before the planned stop on 7 April. Estimated from the vibration trend of {formatReading(VIBRATION.value, 'mm/s', 1)} against the 11 mm/s trip limit.</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ForecastPredFailureProbability() {
  return (
    <CategoryChart
      layout="rows"
      label="Probability of failure within 30 days by machine; the recompressor is highest at 41 percent and two machines are above the 20 percent action level"
      rows={FAILURE_ROWS}
      series={[{ key: 'probability', label: 'Probability of failure, 30 days' }]}
      colorOf={(row) => (typeof row.probability === 'number' && row.probability >= 20 ? 'var(--color-chart-warning-450)' : undefined)}
      references={[{ value: 20, label: 'Action 20 %', tone: 'warning' }]}
      domain={[0, 50]}
      ticks={[0, 10, 20, 30, 40, 50]}
      unit="%"
      decimals={0}
      valueLabels
      axisWidth={148}
      barSize={14}
      heightClassName="h-64"
      summary="Two machines are above the 20 % action level: the recompressor (41 %) and the 1st stage compressor (23 %)."
    />
  );
}

function ForecastPredProductionVsPlan() {
  return (
    <CategoryChart
      legend
      label={'Gas export per day: seven days measured and six days forecast against the 4.5 million cubic metre plan; the forecast reaches plan on 16 March'}
      rows={PRODUCTION_ROWS}
      series={[
        { key: 'actual', label: 'Measured', stack: 'export' },
        { key: 'forecast', label: 'Forecast', stack: 'export', color: 'var(--color-chart-1-200)' },
        { key: 'plan', label: 'Plan', type: 'step', dashed: true, color: 'var(--color-chart-neutral-450)' },
      ]}
      domain={[0, 5]}
      ticks={[0, 1, 2, 3, 4, 5]}
      labelEvery={2}
      unit="MSm³"
      decimals={2}
      summary={`Forecast for 13 to 18 March: ${formatValue(PRODUCTION_FORECAST_TOTAL, 1)} MSm³ against a plan of 27.0. Export is predicted back on plan from 16 March.`}
    />
  );
}

function ForecastPredDemand() {
  return (
    <ForecastChart
      label={`Plant power demand for the last two days and forecast for the next two, following its daily pattern; the next peak is ${formatValue(DEMAND_PEAK.v, 1)} megawatts at ${formatTime(DEMAND_PEAK.t)}`}
      history={DEMAND_HISTORY}
      forecast={DEMAND_FORECAST}
      band={DEMAND_BAND}
      now={NOW}
      limits={[{ value: 50, label: 'Grid import limit 50', tone: 'neutral', align: 'left' }]}
      yDomain={[30, 55]}
      yTicks={[30, 35, 40, 45, 50, 55]}
      unit="MW"
      summary={`Next peak ${formatReading(DEMAND_PEAK.v, 'MW', 1)} on ${formatDate(DEMAND_PEAK.t)} at ${formatTime(DEMAND_PEAK.t)}, inside the 50 MW import limit.`}
    />
  );
}

function ForecastPredScenarioFan() {
  return (
    <ForecastChart
      label="Daily gas export for the last two weeks and three scenarios for the next two, depending on when the recompressor returns; they end between 3.99 and 4.58 million cubic metres per day"
      history={EXPORT_HISTORY}
      scenarios={FORECAST_PRED_SCENARIOS}
      now={NOW}
      limits={[{ value: 4.5, label: 'Plan 4.50', tone: 'neutral', align: 'left' }]}
      yDomain={[3.6, 4.8]}
      yTicks={[3.6, 3.9, 4.2, 4.5, 4.8]}
      unit="MSm³/d"
      decimals={2}
      heightClassName="h-64"
      summary="Only the early return meets the plan. Each scenario starts from today's measured value."
    />
  );
}

function ForecastPredScenarioEnds() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-3">
      <p className="text-sm font-medium text-base-foreground">Export on 26 March</p>
      <ul aria-label="Predicted gas export on 26 March by scenario" className="flex flex-col divide-y divide-default">
        {FORECAST_PRED_SCENARIOS.map((scenario, index) => (
          <li key={scenario.key} className="flex items-center justify-between gap-3 py-2.5">
            <span className="flex min-w-0 items-center gap-2 text-sm text-base-foreground">
              <span aria-hidden="true" className="h-0 w-3 shrink-0 border-t-2 border-dashed" style={{ borderColor: chartSeriesColor(index + 2) }} />
              {scenario.label}
            </span>
            <ValueReadout size="xs" value={scenario.end} unit="MSm³/d" decimals={2} tone={scenario.end < 4.2 ? 'warning' : 'neutral'} />
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground">Plan 4.50 MSm³/d. Below 4.20 the monthly nomination is missed.</p>
    </div>
  );
}

function ForecastPredAccuracyTile() {
  return (
    <KpiTile
      className="w-full max-w-xs"
      label="Forecast error (MAPE), 12 h ahead"
      value={BACKTEST_MAPE}
      unit="%"
      decimals={1}
      delta={{ reference: 2.1, goodDirection: 'down', caption: 'vs last week', decimals: 1 }}
      target={{ value: 5, label: 'Retrain above' }}
      trend={{ values: ERROR_TREND.slice(-14).map((point) => point.v), label: 'Daily forecast error, last 14 days' }}
      footnote="Export flow model · 27-FT-20011"
    />
  );
}

function ForecastPredErrorTrend() {
  const latest = ERROR_TREND[ERROR_TREND.length - 1].v;
  return (
    <TrendChart
      label={`Daily forecast error of the export flow model for the last 30 days, rising from about 2.5 to ${formatValue(latest, 1)} percent against the 5 percent retraining level`}
      series={[{ key: 'error', label: 'Mean absolute percentage error', points: ERROR_TREND }]}
      highlight={{ seriesKey: 'error', above: 5, tone: 'warning' }}
      limits={[{ value: 5, label: 'Retrain above 5 %', tone: 'warning', align: 'left' }]}
      events={[{ t: NOW - 4 * DAY, label: 'Recompressor trip' }]}
      yDomain={[0, 8]}
      yTicks={[0, 2, 4, 6, 8]}
      unit="%"
      summary="The error has grown since the trip on 8 March changed how the plant runs. The model has not seen this operating mode."
    />
  );
}

function ForecastPredModelInfo() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-3">
      <StatusIndicator tone="success" label="Forecast is current" detail="updated 13:55" />
      <dl className="flex flex-col gap-2 text-sm">
        {[
          ['Model', 'Export flow v3.2'],
          ['Trained', '2 Mar on 90 days'],
          ['Inputs', '14 tags, all good quality'],
          ['Next update', '14:10'],
        ].map(([label, value]) => (
          <div key={label} className="flex items-baseline justify-between gap-3">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="text-right text-base-foreground tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

const CONFIDENCE_LEVELS = [
  { tone: 'neutral', shape: 'dot', label: 'High confidence', detail: '80 % or more', text: 'Act on it. Shown like any other value.' },
  { tone: 'neutral', shape: 'ring', label: 'Medium confidence', detail: '50 to 79 %', text: 'Use it to plan; check the drivers first.' },
  { tone: 'warning', shape: 'square', label: 'Low confidence', detail: 'under 50 %', text: 'Shown greyed. Not a basis for action.' },
] as const;

function ForecastPredConfidenceLevels() {
  return (
    <ul aria-label="Confidence levels" className="flex w-full max-w-xs flex-col gap-4">
      {CONFIDENCE_LEVELS.map((level) => (
        <li key={level.label} className="flex flex-col gap-1">
          <StatusIndicator size="sm" tone={level.tone} shape={level.shape} label={level.label} detail={level.detail} />
          <span className="text-xs text-muted-foreground">{level.text}</span>
        </li>
      ))}
    </ul>
  );
}

function ForecastPredStale() {
  return (
    <div className="w-full max-w-sm">
      <Alert variant="warning">
        <AlertTitle>Forecast is 26 hours old</AlertTitle>
        <AlertDescription>The last update failed at 11:55 on 11 March because 23-TT-91141 reports uncertain quality. Values shown are from the previous run.</AlertDescription>
      </Alert>
    </div>
  );
}

function ForecastPredLowConfidence() {
  return (
    <ForecastChart
      lowConfidence
      label="Discharge temperature forecast with low confidence, drawn in grey; the range spans more than 15 degrees after 12 hours"
      history={TEMP_HISTORY}
      forecast={TEMP_FORECAST}
      band={confidenceBand(TEMP_FORECAST, { initial: 2, growth: 9 })}
      forecastLabel="Forecast, low confidence"
      now={NOW}
      yDomain={[125, 165]}
      yTicks={[125, 135, 145, 155, 165]}
      unit="°C"
      summary="Confidence 34 %. The plant is in an operating mode the model has little data for; treat the line as a direction, not a value."
    />
  );
}

function ForecastPredNoForecast() {
  return (
    <ChartPlaceholder
      state="empty"
      title="No forecast for this tag"
      description="23-ST-92501 has no forecasting model. Forecasts exist for 14 of the 212 tags on this machine."
      action={
        <Button variant="secondary" size="sm">
          Request forecast
        </Button>
      }
    />
  );
}

function ForecastPredLoading() {
  return <ChartPlaceholder state="loading" title="Loading discharge temperature forecast" heightClassName="h-44" />;
}

function ForecastPredShortHistory() {
  return <ChartPlaceholder state="empty" title="Not enough history" description="The model needs 14 days of data. 40-TT-40015 has 3 days since the transmitter was replaced." heightClassName="h-44" />;
}

function ForecastPredFailed() {
  return (
    <ChartPlaceholder
      state="error"
      title="Could not run the forecast"
      description="The forecasting service did not answer."
      heightClassName="h-44"
      action={
        <Button variant="secondary" size="sm">
          Try again
        </Button>
      }
    />
  );
}

function ForecastPredCardDrivers() {
  return (
    <PredictionCard
      title="Time to high limit"
      subject="23-TT-92532 · Discharge temperature, 1st stage compressor"
      headline={`~${TEMP_LEAD}`}
      range={`${TEMP_LEAD_RANGE} · about ${formatTime(TEMP_LIMIT_AT)}`}
      tone="warning"
      confidence={0.86}
      drivers={TEMP_DRIVERS}
      meta="Model v3.2 · trained 2 Mar · updated 13:55"
      actions={
        <Button variant="secondary" size="sm">
          Open trend
        </Button>
      }
    />
  );
}

function ForecastPredCardLife() {
  return (
    <PredictionCard
      title="Remaining useful life"
      subject="23-KA-9101 · Drive-end bearing"
      headline="38 days"
      range="21 to 62 days"
      confidence={0.64}
      drivers={LIFE_DRIVERS}
      driversTitle="What shortens it"
      meta="Condition model v1.8 · updated 12 Mar, 06:00"
      actions={
        <Button variant="secondary" size="sm">
          Create work order
        </Button>
      }
    />
  );
}

function ForecastPredDashboardBlock() {
  return (
    <div className="grid w-full grid-cols-1 gap-4 xl:grid-cols-3">
      <TrendCard
        className="xl:col-span-2"
        title="Discharge temperature"
        description="23-TT-92532 · 1st stage compressor · 12 hours measured, 12 hours forecast"
        reading={{ value: TEMPERATURE.value, unit: '°C', decimals: 1 }}
        delta={{ reference: TEMP_HISTORY[0].v, caption: 'in 12 h', goodDirection: 'down' }}
        status={{ tone: 'warning', label: `High limit in ~${TEMP_LEAD}`, shape: 'square' }}
        summary={`Predicted to reach the 145 °C high limit at about ${formatTime(TEMP_LIMIT_AT)} (${TEMP_LEAD_RANGE}). Cleaning the interstage cooler, WO-104471, removes the main driver.`}
      >
        <ForecastChart
          label={`Discharge temperature measured for 12 hours and forecast for 12 with its P10 to P90 range; predicted to reach the 145 degree high limit in about ${TEMP_LEAD}`}
          history={TEMP_HISTORY}
          forecast={TEMP_FORECAST}
          band={TEMP_BAND}
          now={NOW}
          limits={TEMP_LIMITS}
          markers={[{ t: TEMP_LIMIT_AT, v: TEMPERATURE.highLimit, label: `~${TEMP_LEAD}`, tone: 'warning', labelPosition: 'top' }]}
          yDomain={[130, 160]}
          yTicks={[130, 140, 150, 160]}
          maxTicks={8}
          unit="°C"
          heightClassName="h-72"
        />
      </TrendCard>
      <PredictionCard
        title="Why it is rising"
        subject="Drivers of the forecast"
        headline={`~${TEMP_LEAD}`}
        range="to the high limit"
        tone="warning"
        confidence={0.86}
        drivers={TEMP_DRIVERS}
        driversTitle="Drivers"
        meta="Model v3.2 · updated 13:55"
      />
    </div>
  );
}

export default definePage({
  id: 'forecasts-and-predictions',
  title: 'Forecasts and predictions',
  summary:
    'Where a value is heading and how sure the model is: forecast lines that never pass for measurements, ranges that widen with the horizon, time-to-limit and remaining-life estimates, and the drivers behind each prediction.',
  guidance: {
    use: [
      'Mark where measurement ends, and draw everything after it dashed.',
      'Show a range, not only a line; say what the range means (P10–P90).',
      'Turn a forecast into the answer people need: when it reaches a limit, and how sure that is.',
      'Put model, training date and last update beside every prediction.',
    ],
    avoid: [
      'A forecast in the same line style as the measurement.',
      'Exact-looking numbers for uncertain things; write "~6 h", not "5 h 52 min".',
      'Status colour on a forecast that does not cross a limit.',
      'Hiding a low-confidence forecast; grey it and say why instead.',
    ],
  },
  source,
  sections: [
    {
      id: 'line-and-range',
      title: 'Forecast line and range',
      description: 'History, a boundary at "now", a dashed forecast and the range around it.',
      specimens: [
        {
          id: 'ForecastPredBasic',
          title: 'History and forecast',
          note: 'Pick it as the default: one measured series continued by its forecast, with the boundary marked.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/analytics/ForecastChart.tsx', 'industrial/analytics/forecast.ts'],
          Component: ForecastPredBasic,
        },
        {
          id: 'ForecastPredConfidenceBand',
          title: 'Confidence band',
          note: 'Pick it whenever a decision depends on the forecast: the P10–P90 range shows how far it can be trusted.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/analytics/ForecastChart.tsx', 'industrial/analytics/forecast.ts'],
          Component: ForecastPredConfidenceBand,
        },
        {
          id: 'ForecastPredBacktest',
          title: 'Forecast against actual',
          note: 'Pick it to show how an earlier forecast held up, so people can judge the next one.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/analytics/ForecastChart.tsx', 'industrial/analytics/forecast.ts'],
          Component: ForecastPredBacktest,
        },
        {
          id: 'ForecastPredHorizonSwitch',
          title: 'Forecast horizon switch',
          note: 'Pick it when people plan on different horizons; the range visibly widens as the horizon grows.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/analytics/ForecastChart.tsx', 'industrial/charts/TimeRangeSwitch.tsx', 'industrial/analytics/forecast.ts'],
          Component: ForecastPredHorizonSwitch,
        },
      ],
    },
    {
      id: 'limits-and-life',
      title: 'Limits and remaining life',
      description: 'The forecast turned into the answer an operator or planner needs.',
      specimens: [
        {
          id: 'ForecastPredTimeToLimit',
          title: 'Time to limit',
          note: 'Pick it when the question is "when does this become a problem": the crossing is marked and named.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['industrial/analytics/ForecastChart.tsx', 'industrial/analytics/forecast.ts'],
          Component: ForecastPredTimeToLimit,
        },
        {
          id: 'ForecastPredTimeToLimitTile',
          title: 'Time-to-limit tile',
          note: 'Pick it on an overview, where the lead time is the figure and the chart is one click away.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['industrial/analytics/forecast.ts', 'industrial/StatusIndicator.tsx'],
          Component: ForecastPredTimeToLimitTile,
        },
        {
          id: 'ForecastPredRemainingLife',
          title: 'Remaining useful life',
          note: 'Pick it for maintenance planning: the estimate is a range, set against the next planned stop.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/domains2/PercentileBand.tsx', 'industrial/ValueReadout.tsx'],
          Component: ForecastPredRemainingLife,
        },
        {
          id: 'ForecastPredFailureProbability',
          title: 'Probability of failure by asset',
          note: 'Pick it to rank a fleet by risk; only machines above the action level take colour.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/CategoryChart.tsx'],
          Component: ForecastPredFailureProbability,
        },
      ],
    },
    {
      id: 'production-and-scenarios',
      title: 'Production, demand and scenarios',
      description: 'Forecasts against a plan, with a pattern, and as several possible futures.',
      specimens: [
        {
          id: 'ForecastPredProductionVsPlan',
          title: 'Production forecast against plan',
          note: 'Pick it for daily volumes: measured bars are solid, forecast bars are light, the plan is a line.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/CategoryChart.tsx'],
          Component: ForecastPredProductionVsPlan,
        },
        {
          id: 'ForecastPredDemand',
          title: 'Demand forecast',
          note: 'Pick it for values with a daily pattern, where the next peak and its size are the finding.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/analytics/ForecastChart.tsx', 'industrial/analytics/forecast.ts'],
          Component: ForecastPredDemand,
        },
        {
          id: 'ForecastPredScenarioFan',
          title: 'Scenario fan',
          note: 'Pick it when the future depends on a decision: two or three named scenarios from one starting point.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['industrial/analytics/ForecastChart.tsx', 'industrial/analytics/forecast.ts'],
          Component: ForecastPredScenarioFan,
        },
        {
          id: 'ForecastPredScenarioEnds',
          title: 'Scenario outcomes',
          note: 'Pick it beside a fan chart, to give each scenario its end value in figures.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['industrial/ValueReadout.tsx'],
          Component: ForecastPredScenarioEnds,
        },
      ],
    },
    {
      id: 'accuracy-and-trust',
      title: 'Accuracy and trust',
      description: 'How good the model has been, how fresh it is and how much weight to put on it.',
      specimens: [
        {
          id: 'ForecastPredAccuracyTile',
          title: 'Forecast accuracy tile',
          note: 'Pick it to put one number on model quality: the mean error of recent forecasts against a retraining level.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['industrial/KpiTile.tsx', 'industrial/analytics/forecast.ts'],
          Component: ForecastPredAccuracyTile,
        },
        {
          id: 'ForecastPredErrorTrend',
          title: 'Error trend',
          note: 'Pick it to see a model degrade over time and connect it to what changed in the plant.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['industrial/charts/TrendChart.tsx'],
          Component: ForecastPredErrorTrend,
        },
        {
          id: 'ForecastPredModelInfo',
          title: 'Model and freshness',
          note: 'Pick it next to any prediction: which model, trained when, on what, and when it last ran.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['industrial/StatusIndicator.tsx'],
          Component: ForecastPredModelInfo,
        },
        {
          id: 'ForecastPredConfidenceLevels',
          title: 'Confidence levels',
          note: 'Pick it as the legend for confidence: three levels, each with what it lets you do.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['industrial/StatusIndicator.tsx', 'industrial/analytics/forecast.ts'],
          Component: ForecastPredConfidenceLevels,
        },
        {
          id: 'ForecastPredStale',
          title: 'Stale forecast',
          note: 'Pick it when the last run failed: say how old the forecast is and why, above the values it affects.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          Component: ForecastPredStale,
        },
      ],
    },
    {
      id: 'states',
      title: 'States',
      description: 'Low confidence, no model, and the usual loading and failure.',
      specimens: [
        {
          id: 'ForecastPredLowConfidence',
          title: 'Low confidence',
          note: 'Pick it when the model is unsure: the forecast stays visible but loses its colour, and the summary says why.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/analytics/ForecastChart.tsx', 'industrial/analytics/forecast.ts'],
          Component: ForecastPredLowConfidence,
        },
        {
          id: 'ForecastPredNoForecast',
          title: 'No forecast',
          note: 'Pick it for a tag without a model; say so plainly and offer the way to get one.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/ChartPlaceholder.tsx'],
          Component: ForecastPredNoForecast,
        },
        {
          id: 'ForecastPredLoading',
          title: 'Loading',
          note: 'Pick it while the forecast runs; the skeleton keeps the height of the chart.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/charts/ChartPlaceholder.tsx'],
          Component: ForecastPredLoading,
        },
        {
          id: 'ForecastPredShortHistory',
          title: 'Not enough history',
          note: 'Pick it when a model exists but cannot run yet; give the amount needed and the amount there is.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/charts/ChartPlaceholder.tsx'],
          Component: ForecastPredShortHistory,
        },
        {
          id: 'ForecastPredFailed',
          title: 'Forecast failed',
          note: 'Pick it when the run failed, which is different from having no model, and offer a retry.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/charts/ChartPlaceholder.tsx'],
          Component: ForecastPredFailed,
        },
      ],
    },
    {
      id: 'prediction-cards',
      title: 'Prediction cards',
      description: 'The prediction, its confidence and the reasons, in the frame a dashboard uses.',
      specimens: [
        {
          id: 'ForecastPredCardDrivers',
          title: 'Prediction with drivers',
          note: 'Pick it to answer "why": the ranked inputs let an engineer check the prediction against the plant.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/analytics/PredictionCard.tsx', 'industrial/analytics/forecast.ts'],
          Component: ForecastPredCardDrivers,
        },
        {
          id: 'ForecastPredCardLife',
          title: 'Life estimate with action',
          note: 'Pick it when the prediction should lead to work: the range, medium confidence and a button to plan the job.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/analytics/PredictionCard.tsx'],
          Component: ForecastPredCardLife,
        },
        {
          id: 'ForecastPredDashboardBlock',
          title: 'Forecast with explanation',
          note: 'Pick it as the forecast block of an equipment page: trend, range, time to limit and the drivers side by side.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['industrial/charts/TrendCard.tsx', 'industrial/analytics/ForecastChart.tsx', 'industrial/analytics/PredictionCard.tsx', 'industrial/analytics/forecast.ts'],
          Component: ForecastPredDashboardBlock,
        },
      ],
    },
  ],
});
