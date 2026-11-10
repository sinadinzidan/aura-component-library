import { ChartContainer, ChartTooltip, ChartTooltipContent, chartSeriesColor } from '@cognite/aura/chart';
import type { ChartConfig } from '@cognite/aura/chart';
import { Card, CardContent, CardDescription, CardHeader, CardHeaderCenter, CardHeaderEnd, CardTitle } from '@cognite/aura/components/card';
import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from 'recharts';

import { Sparkline } from '../../../library/industrial/Sparkline';
import { qualityStatus, toneFromLimits } from '../../../library/industrial/status';
import type { Limits } from '../../../library/industrial/status';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { TrendDelta } from '../../../library/industrial/TrendDelta';
import { ValueReadout } from '../../../library/industrial/ValueReadout';
import { PLANT_KPIS, SENSORS, sensorsOf } from '../../data/plant';
import type { Sensor } from '../../data/plant';
import { DAY, HOUR, formatTime, makeSeries, makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './sparklines-and-trends.tsx?raw';

function findSensor(id: string): Sensor {
  const sensor = SENSORS.find((candidate) => candidate.id === id);
  if (!sensor) throw new Error(`Unknown sensor ${id}`);
  return sensor;
}

const limitsOf = (sensor: Sensor): Limits => ({
  low: sensor.lowLimit > sensor.rangeMin ? sensor.lowLimit : undefined,
  high: sensor.highLimit,
  highHigh: sensor.highHighLimit,
});

/** Hourly values that end on the sensor's current value. `drift` is the total move across the window. */
const sensorTrend = (sensor: Sensor, points = 48, drift = 0): number[] => [
  ...makeValues({
    seed: sensor.seed,
    points: points - 1,
    base: sensor.value - drift,
    drift,
    amplitude: (sensor.highLimit - sensor.lowLimit) * 0.05,
    noise: (sensor.highLimit - sensor.lowLimit) * 0.03,
    cycles: 2,
    decimals: sensor.decimals,
  }),
  sensor.value,
];

const TH = 'px-3 py-2 text-left text-xs font-medium text-muted-foreground';
const TD = 'px-3 py-2 align-middle';

const KPI = PLANT_KPIS;
const DISCHARGE_PRESSURE = findSensor('pt-92531');
const SUCTION_PRESSURE = findSensor('pt-92530');
const DISCHARGE_TEMPERATURE = findSensor('tt-92532');
const VIBRATION = findSensor('vt-92540');
const SEPARATOR_LEVEL = findSensor('lt-10012');
const EXPORT_FLOW = findSensor('ft-20011');
const MOTOR_CURRENT = findSensor('it-20013');

const PRESSURE_TREND = sensorTrend(DISCHARGE_PRESSURE);
const LEVEL_TREND = sensorTrend(SEPARATOR_LEVEL);
const FLOW_TREND = sensorTrend(EXPORT_FLOW);
const HOT_TEMPERATURE_TREND = [...sensorTrend(DISCHARGE_TEMPERATURE, 48, 10).slice(0, -1), 146.3];
const TRIP_VIBRATION_TREND = [...makeValues({ seed: 41, points: 40, base: 5.2, drift: 2.4, noise: 0.25, decimals: 1 }), 8.4, 9.1, 9.9, 10.4, 11.2, 11.6];
const ALARMS_PER_HOUR = [2, 1, 0, 3, 2, 4, 7, 9, 5, 3, 2, 1, 1, 0, 2, 3, 6, 8, 4, 2, 1, 2, 3, 4];
const FLARING_PER_DAY = makeValues({ seed: 43, points: 14, base: 13, noise: 3.2, stepMs: DAY, min: 6, decimals: 1 });

function SparklineLine() {
  return <Sparkline width={160} values={PRESSURE_TREND} label="Discharge pressure, last 48 hours" unit="barg" />;
}

function SparklineArea() {
  return <Sparkline width={160} variant="area" values={FLOW_TREND} label="Export flow, last 48 hours" unit="m³/h" decimals={0} />;
}

function SparklineBar() {
  return <Sparkline width={160} variant="bar" values={ALARMS_PER_HOUR} label="Alarms per hour, last 24 hours" decimals={0} />;
}

function SparklineLastPoint() {
  return <Sparkline width={160} showLast values={LEVEL_TREND} label="Separator level, last 48 hours" unit="%" />;
}

function SparklineWithLimit() {
  return (
    <Sparkline
      width={160}
      height={40}
      showLast
      values={PRESSURE_TREND}
      limit={DISCHARGE_PRESSURE.highLimit}
      label="Discharge pressure against its high limit of 52 barg, last 48 hours"
      unit="barg"
    />
  );
}

function SparklineWithBand() {
  return (
    <Sparkline
      width={160}
      height={40}
      showLast
      values={LEVEL_TREND}
      band={{ low: 45, high: 62 }}
      label="Separator level against its normal band of 45 to 62 %, last 48 hours"
      unit="%"
    />
  );
}

function SparklineHeights() {
  return (
    <div className="flex items-end gap-6">
      {[16, 24, 32, 48].map((height) => (
        <div key={height} className="flex flex-col items-start gap-2">
          <Sparkline width={96} height={height} values={PRESSURE_TREND} label={`Discharge pressure at ${height} pixels high`} unit="barg" />
          <span className="text-xs text-muted-foreground tabular-nums">{height} px</span>
        </div>
      ))}
    </div>
  );
}

function SparklineFluid() {
  return (
    <div className="flex w-full flex-col gap-2 self-center">
      <Sparkline variant="area" height={48} values={sensorTrend(DISCHARGE_PRESSURE, 96)} label="Discharge pressure, last 4 days" unit="barg" />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>4 d ago</span>
        <span>Now</span>
      </div>
    </div>
  );
}

function SparklineSharedDomain() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-3 self-center">
      {[SUCTION_PRESSURE, DISCHARGE_PRESSURE].map((sensor) => (
        <div key={sensor.id} className="flex items-center gap-3">
          <span className="w-32 shrink-0 text-xs text-muted-foreground">{sensor.name}</span>
          <Sparkline height={28} values={sensorTrend(sensor)} domain={[0, 60]} label={`${sensor.name} on a shared 0 to 60 barg scale`} unit={sensor.unit} />
        </div>
      ))}
    </div>
  );
}

function SparklineDensity() {
  return (
    <div className="flex flex-col gap-4">
      {[12, 48, 168].map((points) => (
        <div key={points} className="flex items-center gap-3">
          <Sparkline width={160} height={24} values={sensorTrend(SEPARATOR_LEVEL, points)} label={`Separator level, ${points} hourly points`} unit="%" />
          <span className="text-xs text-muted-foreground tabular-nums">{points} points</span>
        </div>
      ))}
    </div>
  );
}

function SparklineInText() {
  return (
    <p className="max-w-xs text-sm text-base-foreground">
      Export flow has held steady{' '}
      <Sparkline width={56} height={16} values={FLOW_TREND.slice(-24)} label="Export flow, last 24 hours" unit="m³/h" decimals={0} className="inline-block align-middle" /> at{' '}
      <span className="font-medium tabular-nums">412 m³/h</span> since the pump swap on Tuesday.
    </p>
  );
}

function SparklineWarning() {
  return (
    <Sparkline
      width={160}
      height={40}
      showLast
      tone="warning"
      values={HOT_TEMPERATURE_TREND}
      limit={DISCHARGE_TEMPERATURE.highLimit}
      label="Discharge temperature, above its high limit of 145 °C"
      unit="°C"
    />
  );
}

function SparklineCritical() {
  return (
    <Sparkline
      width={160}
      height={40}
      showLast
      variant="area"
      tone="critical"
      values={TRIP_VIBRATION_TREND}
      limit={11}
      label="Recompressor vibration, at its trip limit of 11 mm/s"
      unit="mm/s"
    />
  );
}

function SparklineBarOverLimit() {
  return <Sparkline width={160} height={40} variant="bar" values={ALARMS_PER_HOUR} limit={6} label="Alarms per hour against the target of 6, last 24 hours" decimals={0} />;
}

function SparklineFlat() {
  return <Sparkline width={160} values={[38.9, 38.9, 38.9, 38.9, 38.9, 38.9, 38.9, 38.9]} label="Cooler outlet temperature, frozen signal" unit="°C" tone="warning" />;
}

function SparklineNoData() {
  return (
    <div className="flex flex-col items-start gap-2">
      <Sparkline width={160} values={[]} label="Bearing temperature, last 48 hours" />
      <span className="text-xs text-muted-foreground">No data in the last 48 h</span>
    </div>
  );
}

function SparklineDeltaUpGood() {
  return <TrendDelta size="md" value={KPI.oee.value} reference={KPI.oee.previous} unit="%" goodDirection="up" caption="vs last week" />;
}

function SparklineDeltaUpBad() {
  return <TrendDelta size="md" value={146.3} reference={141.2} unit="°C" goodDirection="down" caption="in 1 h" />;
}

function SparklineDeltaDownGood() {
  return <TrendDelta size="md" value={KPI.flaring.value} reference={KPI.flaring.previous} unit={KPI.flaring.unit} goodDirection="down" caption="vs last week" />;
}

function SparklineDeltaNeutral() {
  return <TrendDelta size="md" value={9840} reference={9790} decimals={0} unit="rpm" caption="vs 1 h ago" />;
}

function SparklineDeltaPercent() {
  return <TrendDelta size="md" value={KPI.mtbf.value} reference={KPI.mtbf.previous} format="percent" goodDirection="up" caption="vs last quarter" />;
}

function SparklineDeltaNoChange() {
  return <TrendDelta size="md" value={KPI.daysSinceIncident.value} reference={KPI.daysSinceIncident.value} decimals={0} unit="d" goodDirection="up" caption="vs yesterday" />;
}

function SparklineDeltaSizes() {
  return (
    <div className="flex flex-col items-start gap-3">
      <TrendDelta size="sm" value={KPI.gasExport.value} reference={KPI.gasExport.previous} decimals={2} goodDirection="up" caption="vs yesterday" />
      <TrendDelta size="md" value={KPI.gasExport.value} reference={KPI.gasExport.previous} decimals={2} goodDirection="up" caption="vs yesterday" />
    </div>
  );
}

function SparklineWithValue() {
  return (
    <div className="flex w-full max-w-xs items-center justify-between gap-4 self-center">
      <div className="flex flex-col gap-2">
        <span className="text-xs text-muted-foreground">{DISCHARGE_PRESSURE.name}</span>
        <ValueReadout value={DISCHARGE_PRESSURE.value} unit={DISCHARGE_PRESSURE.unit} decimals={1} />
        <TrendDelta value={DISCHARGE_PRESSURE.value} reference={PRESSURE_TREND[PRESSURE_TREND.length - 25]} unit="barg" caption="in 24 h" />
      </div>
      <Sparkline showLast className="max-w-32" height={40} values={PRESSURE_TREND} label="Discharge pressure, last 48 hours" unit="barg" />
    </div>
  );
}

function SparklineReadingList() {
  const sensors = sensorsOf('23-ka-9101').slice(0, 5);
  return (
    <Card className="w-full max-w-md self-center">
      <CardHeader>
        <CardHeaderCenter>
          <CardTitle>1st stage compressor</CardTitle>
          <CardDescription>23-KA-9101 · last 48 hours</CardDescription>
        </CardHeaderCenter>
      </CardHeader>
      <CardContent>
        <ul className="flex w-full flex-col gap-3">
          {sensors.map((sensor) => (
            <li key={sensor.id} className="grid grid-cols-[minmax(0,1fr)_6rem_6.5rem] items-center gap-4">
              <span className="truncate text-sm text-base-foreground">{sensor.name}</span>
              <Sparkline height={24} values={sensorTrend(sensor)} label={`${sensor.name}, last 48 hours`} unit={sensor.unit} decimals={sensor.decimals} />
              <ValueReadout size="xs" value={sensor.value} unit={sensor.unit} decimals={sensor.decimals} className="justify-self-end" />
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function SparklineSmallMultiples() {
  const sensors = [SUCTION_PRESSURE, DISCHARGE_PRESSURE, DISCHARGE_TEMPERATURE, VIBRATION, EXPORT_FLOW, MOTOR_CURRENT];
  return (
    <div className="grid w-full grid-cols-2 gap-x-6 gap-y-5 self-center lg:grid-cols-3">
      {sensors.map((sensor) => (
        <div key={sensor.id} className="flex min-w-0 flex-col gap-2">
          <div className="flex items-baseline justify-between gap-2">
            <span className="truncate text-xs text-muted-foreground">{sensor.name}</span>
            <ValueReadout size="xs" value={sensor.value} unit={sensor.unit} decimals={sensor.decimals} />
          </div>
          <Sparkline
            variant="area"
            height={40}
            values={sensorTrend(sensor)}
            limit={sensor.highLimit}
            domain={[sensor.lowLimit, sensor.highHighLimit ?? sensor.highLimit * 1.05]}
            label={`${sensor.name} against its high limit, last 48 hours`}
            unit={sensor.unit}
            decimals={sensor.decimals}
          />
        </div>
      ))}
    </div>
  );
}

function SparklineTagTable() {
  const rows = [...SENSORS.slice(0, 4), ...SENSORS.slice(6)].map((sensor) => ({
    sensor,
    values: sensor.quality === 'bad' ? [] : sensorTrend(sensor, 48, sensor.seed % 3 === 0 ? (sensor.highLimit - sensor.lowLimit) * 0.12 : 0),
  }));
  return (
    <div className="w-full self-center overflow-x-auto">
      <table className="w-full min-w-2xl border-collapse text-sm">
        <thead>
          <tr>
            <th scope="col" className={TH}>
              Tag
            </th>
            <th scope="col" className={TH}>
              Measurement
            </th>
            <th scope="col" className={TH}>
              Last 48 h
            </th>
            <th scope="col" className={`${TH} text-right`}>
              Value
            </th>
            <th scope="col" className={`${TH} text-right`}>
              24 h change
            </th>
            <th scope="col" className={TH}>
              Quality
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ sensor, values }) => (
            <tr key={sensor.id} className="border-t border-default">
              <td className={`${TD} whitespace-nowrap text-base-foreground tabular-nums`}>{sensor.tag}</td>
              <td className={`${TD} text-muted-foreground`}>{sensor.name}</td>
              <td className={`${TD} w-36`}>
                <Sparkline height={24} values={values} label={`${sensor.name}, last 48 hours`} unit={sensor.unit} decimals={sensor.decimals} />
              </td>
              <td className={`${TD} text-right`}>
                <ValueReadout
                  size="xs"
                  value={sensor.quality === 'bad' ? null : sensor.value}
                  unit={sensor.unit}
                  decimals={sensor.decimals}
                  tone={toneFromLimits(sensor.value, limitsOf(sensor))}
                />
              </td>
              <td className={`${TD} text-right`}>
                {values.length > 24 ? (
                  <TrendDelta value={sensor.value} reference={values[values.length - 25]} decimals={sensor.decimals} />
                ) : (
                  <span className="text-xs text-muted-foreground">No data</span>
                )}
              </td>
              <td className={TD}>
                <StatusIndicator size="sm" {...qualityStatus(sensor.quality)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SparklineDailyBars() {
  return (
    <Card className="w-full max-w-sm self-center">
      <CardHeader>
        <CardHeaderCenter>
          <CardTitle>Flaring</CardTitle>
          <CardDescription>Daily volume against the permit of 15 kSm³/d</CardDescription>
        </CardHeaderCenter>
        <CardHeaderEnd>
          <StatusIndicator size="sm" tone="warning" shape="square" label="3 days over" />
        </CardHeaderEnd>
      </CardHeader>
      <CardContent>
        <div className="flex w-full flex-col gap-2">
          <Sparkline variant="bar" height={64} values={FLARING_PER_DAY} limit={KPI.flaring.target} label="Flaring per day against the permit, last 14 days" unit="kSm³/d" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>27 Feb</span>
            <span>12 Mar</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const TREND_CONFIG = {
  pressure: { label: 'Discharge pressure', color: chartSeriesColor(1) },
} satisfies ChartConfig;

const TREND_DATA = makeSeries({ seed: 11, points: 48, base: 47.8, amplitude: 1.6, noise: 0.5, cycles: 2, stepMs: HOUR / 2, decimals: 1 }).map((point) => ({
  time: formatTime(point.t),
  pressure: point.v,
}));

function SparklineToFullChart() {
  return (
    <Card className="w-full self-center">
      <CardHeader>
        <CardHeaderCenter>
          <CardTitle>Discharge pressure</CardTitle>
          <CardDescription>23-PT-92531 · last 24 hours · high limit 52 barg</CardDescription>
        </CardHeaderCenter>
        <CardHeaderEnd>
          <ValueReadout value={DISCHARGE_PRESSURE.value} unit="barg" decimals={1} />
        </CardHeaderEnd>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={TREND_CONFIG}
          aria-label="Discharge pressure over the last 24 hours, between 45 and 51 barg and below the high limit of 52 barg; latest 48.6 barg"
          className="aspect-auto h-56 w-full"
        >
          <LineChart data={TREND_DATA} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="time" tickLine={false} axisLine={false} interval={7} tickMargin={8} />
            <YAxis domain={[40, 56]} tickLine={false} axisLine={false} width={32} tickCount={5} />
            <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
            <ReferenceLine y={52} stroke="var(--color-chart-neutral-450)" strokeDasharray="3 3" />
            <Line dataKey="pressure" type="monotone" stroke="var(--color-pressure)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export default definePage({
  id: 'sparklines-and-trends',
  title: 'Sparklines and trends',
  summary:
    'Word-sized trends and signed changes that sit beside a value: a sparkline shows the shape of the last period, a trend delta says how far the value moved and whether that is good.',
  guidance: {
    use: [
      'Put a sparkline next to the value it explains, in tiles, table rows and list items.',
      'Mark the last point when the sparkline sits beside the current value.',
      'Add a limit line or band when the question is "how close to the limit", not "what shape".',
      'Give trend deltas a good direction for KPIs and leave it out for process values.',
    ],
    avoid: [
      'Reading exact values off a sparkline — use a chart with axes for that.',
      'Different y scales in sparklines that people will compare; share the domain.',
      'Colouring a sparkline by status unless the series is in that state now.',
      'A delta without saying what it is compared with.',
    ],
  },
  source,
  sections: [
    {
      id: 'variants',
      title: 'Sparkline variants',
      description: 'Three marks and three optional references.',
      specimens: [
        {
          id: 'SparklineLine',
          title: 'Line',
          note: 'Pick it for a continuous signal such as a pressure, temperature or flow.',
          origin: 'custom',
          uses: ['industrial/Sparkline.tsx'],
          Component: SparklineLine,
        },
        {
          id: 'SparklineArea',
          title: 'Area',
          note: 'Pick it for volumes and totals, where the amount under the line means something.',
          origin: 'custom',
          uses: ['industrial/Sparkline.tsx'],
          Component: SparklineArea,
        },
        {
          id: 'SparklineBar',
          title: 'Bars',
          note: 'Pick it for counts per period — alarms per hour, starts per day — not for continuous signals.',
          origin: 'custom',
          uses: ['industrial/Sparkline.tsx'],
          Component: SparklineBar,
        },
        {
          id: 'SparklineLastPoint',
          title: 'Last point marked',
          note: 'Pick it when the current value is printed next to the sparkline, to tie the two together.',
          origin: 'custom',
          uses: ['industrial/Sparkline.tsx'],
          Component: SparklineLastPoint,
        },
        {
          id: 'SparklineWithLimit',
          title: 'With limit line',
          note: 'Pick it when the reading has one limit that matters and the margin to it is the message.',
          origin: 'custom',
          uses: ['industrial/Sparkline.tsx'],
          Component: SparklineWithLimit,
        },
        {
          id: 'SparklineWithBand',
          title: 'With normal band',
          note: 'Pick it for controlled values that should stay inside a band, such as a level.',
          origin: 'custom',
          uses: ['industrial/Sparkline.tsx'],
          Component: SparklineWithBand,
        },
      ],
    },
    {
      id: 'size-and-scale',
      title: 'Size and scale',
      description: 'How big to draw it, how many points to give it and which y range to use.',
      specimens: [
        {
          id: 'SparklineHeights',
          title: 'Heights',
          note: 'Pick 16 px inline with text, 24 px in table rows, 32 px in tiles and 48 px as a card header.',
          origin: 'custom',
          uses: ['industrial/Sparkline.tsx'],
          size: 'md',
          Component: SparklineHeights,
        },
        {
          id: 'SparklineDensity',
          title: 'Point density',
          note: 'Pick a window that gives 24 to 100 points; fewer looks jagged and more turns into noise.',
          origin: 'custom',
          uses: ['industrial/Sparkline.tsx'],
          Component: SparklineDensity,
        },
        {
          id: 'SparklineFluid',
          title: 'Fills its container',
          note: 'Pick it without a width when the sparkline should follow a card or column as it resizes.',
          origin: 'custom',
          uses: ['industrial/Sparkline.tsx'],
          size: 'md',
          align: 'stretch',
          Component: SparklineFluid,
        },
        {
          id: 'SparklineSharedDomain',
          title: 'Shared scale',
          note: 'Pick it when sparklines will be compared with each other, so equal height means equal value.',
          origin: 'custom',
          uses: ['industrial/Sparkline.tsx'],
          align: 'stretch',
          Component: SparklineSharedDomain,
        },
        {
          id: 'SparklineInText',
          title: 'In a sentence',
          note: 'Pick it in shift logs and summaries, where the trend backs up a statement.',
          origin: 'custom',
          uses: ['industrial/Sparkline.tsx'],
          Component: SparklineInText,
        },
      ],
    },
    {
      id: 'states',
      title: 'States',
      description: 'Status colour only when the series is in that state now; plus frozen and missing signals.',
      specimens: [
        {
          id: 'SparklineWarning',
          title: 'Above limit',
          note: 'Pick it when the latest value has crossed its operating limit.',
          origin: 'custom',
          uses: ['industrial/Sparkline.tsx'],
          Component: SparklineWarning,
        },
        {
          id: 'SparklineCritical',
          title: 'At trip limit',
          note: 'Pick it when the series has run into a trip limit and the lead-up explains why.',
          origin: 'custom',
          uses: ['industrial/Sparkline.tsx'],
          Component: SparklineCritical,
        },
        {
          id: 'SparklineBarOverLimit',
          title: 'Bars over limit',
          note: 'Pick it to pick out the periods that went over a target, without colouring the rest.',
          origin: 'custom',
          uses: ['industrial/Sparkline.tsx'],
          Component: SparklineBarOverLimit,
        },
        {
          id: 'SparklineFlat',
          title: 'Frozen signal',
          note: 'Pick it to see how a stuck transmitter looks: a dead-flat line is itself a finding.',
          origin: 'custom',
          uses: ['industrial/Sparkline.tsx'],
          Component: SparklineFlat,
        },
        {
          id: 'SparklineNoData',
          title: 'No data',
          note: 'Pick it when the window has no points; the placeholder keeps the row height and says so.',
          origin: 'custom',
          uses: ['industrial/Sparkline.tsx'],
          Component: SparklineNoData,
        },
      ],
    },
    {
      id: 'trend-delta',
      title: 'Trend delta',
      description: 'A signed change against a previous value, coloured by whether it is good news.',
      specimens: [
        {
          id: 'SparklineDeltaUpGood',
          title: 'Rise, good',
          note: 'Pick it for KPIs where higher is better and the value went up.',
          origin: 'custom',
          uses: ['industrial/TrendDelta.tsx'],
          Component: SparklineDeltaUpGood,
        },
        {
          id: 'SparklineDeltaDownGood',
          title: 'Fall, good',
          note: 'Pick it for KPIs where lower is better and the value went down.',
          origin: 'custom',
          uses: ['industrial/TrendDelta.tsx'],
          Component: SparklineDeltaDownGood,
        },
        {
          id: 'SparklineDeltaUpBad',
          title: 'Rise, bad',
          note: 'Pick it when a value that should stay low is climbing.',
          origin: 'custom',
          uses: ['industrial/TrendDelta.tsx'],
          Component: SparklineDeltaUpBad,
        },
        {
          id: 'SparklineDeltaNeutral',
          title: 'No judgement',
          note: 'Pick it for process values, where a change is information and not a verdict.',
          origin: 'custom',
          uses: ['industrial/TrendDelta.tsx'],
          Component: SparklineDeltaNeutral,
        },
        {
          id: 'SparklineDeltaPercent',
          title: 'Percent change',
          note: 'Pick it when the relative move matters more than the amount, or units differ between rows.',
          origin: 'custom',
          uses: ['industrial/TrendDelta.tsx'],
          Component: SparklineDeltaPercent,
        },
        {
          id: 'SparklineDeltaNoChange',
          title: 'No change',
          note: 'Pick it to confirm the value was compared and did not move, instead of hiding the delta.',
          origin: 'custom',
          uses: ['industrial/TrendDelta.tsx'],
          Component: SparklineDeltaNoChange,
        },
        {
          id: 'SparklineDeltaSizes',
          title: 'Sizes',
          note: 'Pick small under a tile value and in table cells, medium on its own line.',
          origin: 'custom',
          uses: ['industrial/TrendDelta.tsx'],
          Component: SparklineDeltaSizes,
        },
      ],
    },
    {
      id: 'compositions',
      title: 'Rows, tables and charts',
      description: 'Sparklines and deltas beside the values they explain.',
      specimens: [
        {
          id: 'SparklineWithValue',
          title: 'Value with trend',
          note: 'Pick it as the smallest complete reading: name, value, change and shape.',
          origin: 'custom',
          uses: ['industrial/Sparkline.tsx', 'industrial/TrendDelta.tsx', 'industrial/ValueReadout.tsx'],
          align: 'stretch',
          Component: SparklineWithValue,
        },
        {
          id: 'SparklineDailyBars',
          title: 'Daily bars against a permit',
          note: 'Pick it for a daily total with a limit, where the days over it are what people look for.',
          origin: 'custom',
          uses: ['industrial/Sparkline.tsx', 'industrial/StatusIndicator.tsx'],
          size: 'md',
          align: 'stretch',
          Component: SparklineDailyBars,
        },
        {
          id: 'SparklineReadingList',
          title: 'Readings list',
          note: 'Pick it on an asset card to list each reading with its recent shape.',
          origin: 'custom',
          uses: ['industrial/Sparkline.tsx', 'industrial/ValueReadout.tsx'],
          size: 'md',
          align: 'stretch',
          Component: SparklineReadingList,
        },
        {
          id: 'SparklineSmallMultiples',
          title: 'Small multiples',
          note: 'Pick it to scan a machine for the one reading closing in on its limit.',
          origin: 'custom',
          uses: ['industrial/Sparkline.tsx', 'industrial/ValueReadout.tsx'],
          size: 'lg',
          align: 'stretch',
          Component: SparklineSmallMultiples,
        },
        {
          id: 'SparklineTagTable',
          title: 'Tag table with trends',
          note: 'Pick it for a sensor list where each row needs its trend, value, change and quality.',
          origin: 'custom',
          uses: ['industrial/Sparkline.tsx', 'industrial/TrendDelta.tsx', 'industrial/ValueReadout.tsx', 'industrial/StatusIndicator.tsx', 'industrial/status.ts'],
          size: 'full',
          align: 'stretch',
          Component: SparklineTagTable,
        },
        {
          id: 'SparklineToFullChart',
          title: 'When a sparkline is not enough',
          note: 'Pick a chart with axes, a tooltip and a limit line once people need to read values or times.',
          origin: 'custom',
          uses: ['industrial/ValueReadout.tsx'],
          size: 'full',
          align: 'stretch',
          Component: SparklineToFullChart,
        },
      ],
    },
  ],
});
