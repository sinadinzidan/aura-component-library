import { Card, CardContent, CardDescription, CardHeader, CardHeaderCenter, CardHeaderEnd, CardTitle } from '@cognite/aura/components/card';

import { LevelMeter } from '../../../library/industrial/LevelMeter';
import { LinearGauge } from '../../../library/industrial/LinearGauge';
import { ProgressRing } from '../../../library/industrial/ProgressRing';
import { RadialGauge } from '../../../library/industrial/RadialGauge';
import { RangeIndicator } from '../../../library/industrial/RangeIndicator';
import { healthStatus, runStateStatus, toneFromLimits } from '../../../library/industrial/status';
import type { Limits, Tone } from '../../../library/industrial/status';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { ValueReadout } from '../../../library/industrial/ValueReadout';
import { ASSETS, PLANT_KPIS, SENSORS, WORK_ORDERS, sensorsOf } from '../../data/plant';
import type { Asset, Sensor } from '../../data/plant';
import { definePage } from '../../types';

import source from './gauges-and-meters.tsx?raw';

function findSensor(id: string): Sensor {
  const sensor = SENSORS.find((candidate) => candidate.id === id);
  if (!sensor) throw new Error(`Unknown sensor ${id}`);
  return sensor;
}

function findAssetById(id: string): Asset {
  const asset = ASSETS.find((candidate) => candidate.id === id);
  if (!asset) throw new Error(`Unknown asset ${id}`);
  return asset;
}

/** Plant sensor limits in the shape the gauges take. */
const limitsOf = (sensor: Sensor): Limits => ({
  low: sensor.lowLimit > sensor.rangeMin ? sensor.lowLimit : undefined,
  high: sensor.highLimit,
  highHigh: sensor.highHighLimit,
});

const healthTone = (score: number): Tone => (score < 50 ? 'critical' : score < 75 ? 'warning' : 'neutral');

const TH = 'px-3 py-2 text-left text-xs font-medium text-muted-foreground';
const TD = 'px-3 py-2.5 align-middle';

const DISCHARGE_PRESSURE = findSensor('pt-92531');
const SUCTION_PRESSURE = findSensor('pt-92530');
const DISCHARGE_TEMPERATURE = findSensor('tt-92532');
const VIBRATION = findSensor('vt-92540');
const SHAFT_SPEED = findSensor('st-92501');
const SEPARATOR_LEVEL = findSensor('lt-10012');
const SEPARATOR_PRESSURE = findSensor('pt-10010');
const MOTOR_CURRENT = findSensor('it-20013');
const EXPORT_FLOW = findSensor('ft-20011');
const BEARING_TEMPERATURE = findSensor('tt-40015');
const COOLER_TEMPERATURE = findSensor('tt-91141');

function GaugeRadialPlain() {
  return <RadialGauge label={EXPORT_FLOW.name} value={EXPORT_FLOW.value} max={EXPORT_FLOW.rangeMax} unit={EXPORT_FLOW.unit} />;
}

function GaugeRadialWithZones() {
  return (
    <RadialGauge
      label={DISCHARGE_PRESSURE.name}
      value={DISCHARGE_PRESSURE.value}
      max={DISCHARGE_PRESSURE.rangeMax}
      unit={DISCHARGE_PRESSURE.unit}
      decimals={1}
      limits={limitsOf(DISCHARGE_PRESSURE)}
    />
  );
}

function GaugeRadialWithTarget() {
  return (
    <RadialGauge
      label="Shaft speed, setpoint 10,000 rpm"
      value={SHAFT_SPEED.value}
      max={SHAFT_SPEED.rangeMax}
      unit={SHAFT_SPEED.unit}
      limits={limitsOf(SHAFT_SPEED)}
      target={10000}
    />
  );
}

function GaugeRadialSizes() {
  return (
    <div className="flex flex-wrap items-end justify-center gap-8">
      <RadialGauge size="sm" label={SUCTION_PRESSURE.name} value={SUCTION_PRESSURE.value} max={SUCTION_PRESSURE.rangeMax} unit={SUCTION_PRESSURE.unit} decimals={1} limits={limitsOf(SUCTION_PRESSURE)} />
      <RadialGauge size="md" label={SUCTION_PRESSURE.name} value={SUCTION_PRESSURE.value} max={SUCTION_PRESSURE.rangeMax} unit={SUCTION_PRESSURE.unit} decimals={1} limits={limitsOf(SUCTION_PRESSURE)} />
      <RadialGauge size="lg" label={SUCTION_PRESSURE.name} value={SUCTION_PRESSURE.value} max={SUCTION_PRESSURE.rangeMax} unit={SUCTION_PRESSURE.unit} decimals={1} limits={limitsOf(SUCTION_PRESSURE)} />
    </div>
  );
}

function GaugeRadialWarning() {
  return (
    <RadialGauge
      label={DISCHARGE_TEMPERATURE.name}
      value={146.3}
      max={DISCHARGE_TEMPERATURE.rangeMax}
      unit={DISCHARGE_TEMPERATURE.unit}
      decimals={1}
      limits={limitsOf(DISCHARGE_TEMPERATURE)}
    />
  );
}

function GaugeRadialCritical() {
  return (
    <RadialGauge label="Recompressor vibration" value={11.6} max={VIBRATION.rangeMax} unit={VIBRATION.unit} decimals={1} limits={limitsOf(VIBRATION)} />
  );
}

function GaugeRadialNoData() {
  return (
    <RadialGauge
      label={BEARING_TEMPERATURE.name}
      value={null}
      max={BEARING_TEMPERATURE.rangeMax}
      unit={BEARING_TEMPERATURE.unit}
      limits={limitsOf(BEARING_TEMPERATURE)}
    />
  );
}

function GaugeRadialBare() {
  return (
    <RadialGauge
      size="sm"
      label={SEPARATOR_PRESSURE.name}
      value={SEPARATOR_PRESSURE.value}
      max={SEPARATOR_PRESSURE.rangeMax}
      unit={SEPARATOR_PRESSURE.unit}
      decimals={1}
      showRange={false}
      showLabel={false}
    />
  );
}

function GaugeLinearPlain() {
  return (
    <div className="w-full max-w-xs self-center">
      <LinearGauge label={EXPORT_FLOW.name} value={EXPORT_FLOW.value} max={EXPORT_FLOW.rangeMax} unit={EXPORT_FLOW.unit} />
    </div>
  );
}

function GaugeLinearWithZones() {
  return (
    <div className="w-full max-w-xs self-center">
      <LinearGauge
        label={MOTOR_CURRENT.name}
        value={MOTOR_CURRENT.value}
        max={MOTOR_CURRENT.rangeMax}
        unit={MOTOR_CURRENT.unit}
        decimals={1}
        limits={limitsOf(MOTOR_CURRENT)}
      />
    </div>
  );
}

function GaugeLinearWithTarget() {
  return (
    <div className="w-full max-w-xs self-center">
      <LinearGauge label="Availability" value={PLANT_KPIS.availability.value} min={90} max={100} unit="%" decimals={1} target={PLANT_KPIS.availability.target} />
    </div>
  );
}

function GaugeLinearWithScale() {
  return (
    <div className="w-full max-w-xs self-center">
      <LinearGauge
        label={DISCHARGE_PRESSURE.name}
        value={DISCHARGE_PRESSURE.value}
        max={DISCHARGE_PRESSURE.rangeMax}
        unit={DISCHARGE_PRESSURE.unit}
        decimals={1}
        limits={limitsOf(DISCHARGE_PRESSURE)}
        showScale
      />
    </div>
  );
}

function GaugeLinearSmall() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-4 self-center">
      <LinearGauge size="sm" label={SUCTION_PRESSURE.name} value={SUCTION_PRESSURE.value} max={SUCTION_PRESSURE.rangeMax} unit={SUCTION_PRESSURE.unit} decimals={1} limits={limitsOf(SUCTION_PRESSURE)} />
      <LinearGauge size="md" label={SUCTION_PRESSURE.name} value={SUCTION_PRESSURE.value} max={SUCTION_PRESSURE.rangeMax} unit={SUCTION_PRESSURE.unit} decimals={1} limits={limitsOf(SUCTION_PRESSURE)} />
    </div>
  );
}

function GaugeLinearWarning() {
  return (
    <div className="w-full max-w-xs self-center">
      <LinearGauge label={MOTOR_CURRENT.name} value={96.4} max={MOTOR_CURRENT.rangeMax} unit={MOTOR_CURRENT.unit} decimals={1} limits={limitsOf(MOTOR_CURRENT)} />
    </div>
  );
}

function GaugeLinearBarOnly() {
  return (
    <div className="flex w-full max-w-xs items-center gap-3 self-center">
      <span className="w-24 shrink-0 truncate text-sm text-base-foreground">{VIBRATION.tag}</span>
      <LinearGauge
        size="sm"
        showHeader={false}
        label={VIBRATION.name}
        value={VIBRATION.value}
        max={VIBRATION.rangeMax}
        unit={VIBRATION.unit}
        decimals={1}
        limits={limitsOf(VIBRATION)}
      />
      <ValueReadout size="xs" value={VIBRATION.value} unit={VIBRATION.unit} decimals={1} />
    </div>
  );
}

function GaugeRangePlain() {
  return (
    <div className="w-full max-w-xs self-center">
      <RangeIndicator
        label={SUCTION_PRESSURE.name}
        value={SUCTION_PRESSURE.value}
        min={SUCTION_PRESSURE.rangeMin}
        max={SUCTION_PRESSURE.rangeMax}
        limits={limitsOf(SUCTION_PRESSURE)}
        unit={SUCTION_PRESSURE.unit}
        decimals={1}
      />
    </div>
  );
}

function GaugeRangeNearLimit() {
  return (
    <div className="w-full max-w-xs self-center">
      <RangeIndicator
        label={COOLER_TEMPERATURE.name}
        value={COOLER_TEMPERATURE.value}
        min={COOLER_TEMPERATURE.rangeMin}
        max={COOLER_TEMPERATURE.rangeMax}
        limits={limitsOf(COOLER_TEMPERATURE)}
        unit={COOLER_TEMPERATURE.unit}
        decimals={1}
      />
    </div>
  );
}

function GaugeRangeOutside() {
  return (
    <div className="w-full max-w-xs self-center">
      <RangeIndicator
        label={COOLER_TEMPERATURE.name}
        value={40.8}
        min={COOLER_TEMPERATURE.rangeMin}
        max={COOLER_TEMPERATURE.rangeMax}
        limits={limitsOf(COOLER_TEMPERATURE)}
        unit={COOLER_TEMPERATURE.unit}
        decimals={1}
      />
    </div>
  );
}

function GaugeRangeBarOnly() {
  return (
    <div className="flex w-full max-w-xs items-center gap-3 self-center">
      <RangeIndicator
        showHeader={false}
        showLimits={false}
        label={SEPARATOR_PRESSURE.name}
        value={SEPARATOR_PRESSURE.value}
        min={SEPARATOR_PRESSURE.rangeMin}
        max={SEPARATOR_PRESSURE.rangeMax}
        limits={limitsOf(SEPARATOR_PRESSURE)}
        unit={SEPARATOR_PRESSURE.unit}
        decimals={1}
      />
      <ValueReadout size="xs" value={SEPARATOR_PRESSURE.value} unit={SEPARATOR_PRESSURE.unit} decimals={1} />
    </div>
  );
}

function GaugeLevelPlain() {
  return <LevelMeter label="Test separator level" value={41.5} decimals={1} />;
}

function GaugeLevelWithLimits() {
  return <LevelMeter label={SEPARATOR_LEVEL.name} value={SEPARATOR_LEVEL.value} decimals={1} limits={limitsOf(SEPARATOR_LEVEL)} />;
}

function GaugeLevelHigh() {
  return <LevelMeter label={SEPARATOR_LEVEL.name} value={71.2} decimals={1} limits={limitsOf(SEPARATOR_LEVEL)} />;
}

function GaugeLevelRow() {
  return (
    <div className="flex items-start gap-8">
      <LevelMeter height={112} showLimits={false} label="Inlet separator" value={SEPARATOR_LEVEL.value} decimals={1} limits={limitsOf(SEPARATOR_LEVEL)} />
      <LevelMeter height={112} showLimits={false} label="Test separator" value={41.5} decimals={1} limits={limitsOf(SEPARATOR_LEVEL)} />
      <LevelMeter height={112} showLimits={false} label="Flare knock-out drum" value={87.4} decimals={1} limits={limitsOf(SEPARATOR_LEVEL)} />
    </div>
  );
}

function GaugeRingPlain() {
  return <ProgressRing size="lg" label="Availability" value={PLANT_KPIS.availability.value} decimals={1} showLabel />;
}

function GaugeRingSizes() {
  return (
    <div className="flex items-center gap-8">
      <ProgressRing size="sm" label="OEE" value={PLANT_KPIS.oee.value} />
      <ProgressRing size="md" label="OEE" value={PLANT_KPIS.oee.value} />
      <ProgressRing size="lg" label="OEE" value={PLANT_KPIS.oee.value} />
    </div>
  );
}

function GaugeRingInline() {
  const order = WORK_ORDERS[0];
  return (
    <div className="flex w-full max-w-xs items-center justify-between gap-4 self-center">
      <div className="min-w-0">
        <p className="truncate text-sm text-base-foreground">{order.title}</p>
        <p className="text-xs text-muted-foreground">{order.id}</p>
      </div>
      <ProgressRing size="sm" label={`${order.id} progress`} value={order.progress} />
    </div>
  );
}

function GaugeRingToned() {
  const assets = ['23-ka-9102', '23-ka-9101', '23-ka-9103'].map(findAssetById);
  return (
    <div className="flex items-start gap-8">
      {assets.map((asset) => (
        <ProgressRing key={asset.id} label={`${asset.name} health`} value={asset.healthScore} unit="" tone={healthTone(asset.healthScore)} showLabel />
      ))}
    </div>
  );
}

function GaugeRingCustomMax() {
  return (
    <ProgressRing
      size="lg"
      label="Days since incident, goal 365"
      value={PLANT_KPIS.daysSinceIncident.value}
      max={PLANT_KPIS.daysSinceIncident.target}
      unit="d"
      showLabel
    />
  );
}

function GaugeCompressorCard() {
  const compressor = findAssetById('23-ka-9101');
  const sensors = [DISCHARGE_PRESSURE, DISCHARGE_TEMPERATURE, VIBRATION];
  return (
    <Card className="w-full max-w-2xl self-center">
      <CardHeader>
        <CardHeaderCenter>
          <CardTitle>{compressor.name}</CardTitle>
          <CardDescription>{compressor.tag} · Gas compression</CardDescription>
        </CardHeaderCenter>
        <CardHeaderEnd>
          <StatusIndicator variant="badge" {...runStateStatus(compressor.state)} />
        </CardHeaderEnd>
      </CardHeader>
      <CardContent className="grid grid-cols-1 justify-items-center gap-6 sm:grid-cols-3">
        {sensors.map((sensor) => (
          <RadialGauge
            key={sensor.id}
            label={sensor.name}
            value={sensor.value}
            min={sensor.rangeMin}
            max={sensor.rangeMax}
            unit={sensor.unit}
            decimals={sensor.decimals}
            limits={limitsOf(sensor)}
          />
        ))}
      </CardContent>
    </Card>
  );
}

function GaugeSensorList() {
  const compressor = findAssetById('23-ka-9101');
  return (
    <Card className="w-full max-w-md self-center">
      <CardHeader>
        <CardHeaderCenter>
          <CardTitle>{compressor.name}</CardTitle>
          <CardDescription>{compressor.tag} · 6 live readings</CardDescription>
        </CardHeaderCenter>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {sensorsOf(compressor.id).map((sensor) => (
          <LinearGauge
            key={sensor.id}
            label={sensor.name}
            value={sensor.value}
            min={sensor.rangeMin}
            max={sensor.rangeMax}
            unit={sensor.unit}
            decimals={sensor.decimals}
            limits={limitsOf(sensor)}
          />
        ))}
      </CardContent>
    </Card>
  );
}

function GaugeSeparatorCard() {
  const separator = findAssetById('20-va-1001');
  return (
    <Card className="w-full max-w-md self-center">
      <CardHeader>
        <CardHeaderCenter>
          <CardTitle>{separator.name}</CardTitle>
          <CardDescription>{separator.tag} · Inlet and separation</CardDescription>
        </CardHeaderCenter>
        <CardHeaderEnd>
          <StatusIndicator variant="badge" {...runStateStatus(separator.state)} />
        </CardHeaderEnd>
      </CardHeader>
      <CardContent className="flex-row gap-6">
        <LevelMeter label="Level" value={SEPARATOR_LEVEL.value} decimals={1} limits={limitsOf(SEPARATOR_LEVEL)} />
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <RangeIndicator
            label="Pressure"
            value={SEPARATOR_PRESSURE.value}
            min={SEPARATOR_PRESSURE.rangeMin}
            max={SEPARATOR_PRESSURE.rangeMax}
            limits={limitsOf(SEPARATOR_PRESSURE)}
            unit={SEPARATOR_PRESSURE.unit}
            decimals={1}
          />
          <RangeIndicator label="Level" value={SEPARATOR_LEVEL.value} min={0} max={100} limits={limitsOf(SEPARATOR_LEVEL)} unit="%" decimals={1} />
          <LinearGauge label="Health score" value={separator.healthScore} tone={healthTone(separator.healthScore)} />
        </div>
      </CardContent>
    </Card>
  );
}

function GaugeLimitsTable() {
  const sensors = SENSORS.filter((sensor) => sensor.quality !== 'bad').slice(0, 7);
  return (
    <div className="w-full self-center overflow-x-auto">
      <table className="w-full min-w-xl border-collapse text-sm">
        <thead>
          <tr>
            <th scope="col" className={TH}>
              Tag
            </th>
            <th scope="col" className={TH}>
              Measurement
            </th>
            <th scope="col" className={`${TH} w-2/5`}>
              Position in operating band
            </th>
            <th scope="col" className={`${TH} text-right`}>
              Value
            </th>
          </tr>
        </thead>
        <tbody>
          {sensors.map((sensor) => (
            <tr key={sensor.id} className="border-t border-default">
              <td className={`${TD} whitespace-nowrap text-base-foreground tabular-nums`}>{sensor.tag}</td>
              <td className={`${TD} text-muted-foreground`}>{sensor.name}</td>
              <td className={TD}>
                <RangeIndicator
                  showHeader={false}
                  showLimits={false}
                  label={sensor.name}
                  value={sensor.value}
                  min={sensor.rangeMin}
                  max={sensor.rangeMax}
                  limits={limitsOf(sensor)}
                  unit={sensor.unit}
                  decimals={sensor.decimals}
                />
              </td>
              <td className={`${TD} text-right`}>
                <ValueReadout size="xs" value={sensor.value} unit={sensor.unit} decimals={sensor.decimals} tone={toneFromLimits(sensor.value, limitsOf(sensor))} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function GaugeHealthRow() {
  const areas = ASSETS.filter((asset) => asset.type === 'area' || asset.type === 'system');
  return (
    <div className="grid w-full grid-cols-2 gap-4 self-center lg:grid-cols-4">
      {areas.map((area) => (
        <Card key={area.id} className="items-center gap-3">
          <ProgressRing size="lg" label={`${area.name} health score`} value={area.healthScore} unit="" tone={healthTone(area.healthScore)} />
          <div className="flex flex-col items-center gap-1">
            <span className="text-sm font-medium text-base-foreground">{area.name}</span>
            <StatusIndicator size="sm" {...healthStatus(area.health)} />
          </div>
        </Card>
      ))}
    </div>
  );
}

export default definePage({
  id: 'gauges-and-meters',
  title: 'Gauges and meters',
  summary:
    'A single reading placed against its range, limits or target: dials, bullet bars, operating-band indicators, vessel levels and rings. They answer "is this where it should be?" faster than a number alone.',
  guidance: {
    use: [
      'Use a dial for a few key readings of one machine; use bars when there are more than four.',
      'Pass the limits and let the gauge decide its colour, so every gauge agrees with the alarm system.',
      'Use the range indicator when distance to a limit matters more than distance from zero.',
      'Always print the value and unit; the drawing supports the number, it does not replace it.',
    ],
    avoid: [
      'Colouring the normal range green — normal is neutral, colour is for warning and critical.',
      'Dials in tables or long lists; a bar or a range indicator takes a tenth of the space.',
      'A progress ring for a value with limits; it has no place to show them.',
      'Needles, gradients, bevels or 3D effects.',
    ],
  },
  source,
  sections: [
    {
      id: 'radial',
      title: 'Radial gauge',
      description: 'A 270° dial with the value in the middle and limit zones as a thin outer ring.',
      specimens: [
        {
          id: 'GaugeRadialPlain',
          title: 'Plain',
          note: 'Pick it for a reading with a range but no limits worth showing.',
          origin: 'custom',
          uses: ['industrial/RadialGauge.tsx'],
          Component: GaugeRadialPlain,
        },
        {
          id: 'GaugeRadialWithZones',
          title: 'With limit zones',
          note: 'Pick it when the reading has operating and trip limits; the zones show how much room is left.',
          origin: 'custom',
          uses: ['industrial/RadialGauge.tsx', 'industrial/status.ts'],
          Component: GaugeRadialWithZones,
        },
        {
          id: 'GaugeRadialWithTarget',
          title: 'With setpoint',
          note: 'Pick it for controlled values, where the gap between reading and setpoint is the story.',
          origin: 'custom',
          uses: ['industrial/RadialGauge.tsx'],
          Component: GaugeRadialWithTarget,
        },
        {
          id: 'GaugeRadialWarning',
          title: 'Above high limit',
          note: 'Pick it to see the abnormal state: arc and number turn warning together once the limit is crossed.',
          origin: 'custom',
          uses: ['industrial/RadialGauge.tsx'],
          Component: GaugeRadialWarning,
        },
        {
          id: 'GaugeRadialCritical',
          title: 'At trip limit',
          note: 'Pick it to see the trip state: the reading is in the critical zone and reads critical everywhere.',
          origin: 'custom',
          uses: ['industrial/RadialGauge.tsx'],
          Component: GaugeRadialCritical,
        },
        {
          id: 'GaugeRadialNoData',
          title: 'No data',
          note: 'Pick it when the signal is lost: the scale and zones stay, the value arc and number do not.',
          origin: 'custom',
          uses: ['industrial/RadialGauge.tsx'],
          Component: GaugeRadialNoData,
        },
        {
          id: 'GaugeRadialSizes',
          title: 'Sizes',
          note: 'Pick small for cards and list rows, medium for dashboards, large for a headline reading.',
          origin: 'custom',
          uses: ['industrial/RadialGauge.tsx'],
          size: 'lg',
          Component: GaugeRadialSizes,
        },
        {
          id: 'GaugeRadialBare',
          title: 'Without range and label',
          note: 'Pick it inside a tile or row that already names the reading.',
          origin: 'custom',
          uses: ['industrial/RadialGauge.tsx'],
          Component: GaugeRadialBare,
        },
      ],
    },
    {
      id: 'linear',
      title: 'Linear gauge',
      description: 'A bullet bar: value from the start of the range, zones as a strip, target as a tick.',
      specimens: [
        {
          id: 'GaugeLinearPlain',
          title: 'Plain',
          note: 'Pick it for a reading against its range when there are no limits to show.',
          origin: 'custom',
          uses: ['industrial/LinearGauge.tsx'],
          align: 'stretch',
          Component: GaugeLinearPlain,
        },
        {
          id: 'GaugeLinearWithZones',
          title: 'With limit zones',
          note: 'Pick it when the reading has high and trip limits and several readings stack in a list.',
          origin: 'custom',
          uses: ['industrial/LinearGauge.tsx'],
          align: 'stretch',
          Component: GaugeLinearWithZones,
        },
        {
          id: 'GaugeLinearWithTarget',
          title: 'With target',
          note: 'Pick it for a KPI against its target; narrow the range so the gap is visible.',
          origin: 'custom',
          uses: ['industrial/LinearGauge.tsx'],
          align: 'stretch',
          Component: GaugeLinearWithTarget,
        },
        {
          id: 'GaugeLinearWithScale',
          title: 'With scale',
          note: 'Pick it when the range is not obvious from the unit and people need the end values.',
          origin: 'custom',
          uses: ['industrial/LinearGauge.tsx'],
          align: 'stretch',
          Component: GaugeLinearWithScale,
        },
        {
          id: 'GaugeLinearWarning',
          title: 'Above high limit',
          note: 'Pick it to see the abnormal state: bar and number turn warning inside the warning zone.',
          origin: 'custom',
          uses: ['industrial/LinearGauge.tsx'],
          align: 'stretch',
          Component: GaugeLinearWarning,
        },
        {
          id: 'GaugeLinearSmall',
          title: 'Sizes',
          note: 'Pick small in side panels and dense lists, medium everywhere else.',
          origin: 'custom',
          uses: ['industrial/LinearGauge.tsx'],
          align: 'stretch',
          Component: GaugeLinearSmall,
        },
        {
          id: 'GaugeLinearBarOnly',
          title: 'Bar only',
          note: 'Pick it in a table cell or row that already prints the tag and value.',
          origin: 'custom',
          uses: ['industrial/LinearGauge.tsx', 'industrial/ValueReadout.tsx'],
          align: 'stretch',
          Component: GaugeLinearBarOnly,
        },
      ],
    },
    {
      id: 'range-and-level',
      title: 'Operating band and level',
      description: 'Where a value sits between its limits, and how full a vessel is.',
      specimens: [
        {
          id: 'GaugeRangePlain',
          title: 'Inside the band',
          note: 'Pick it for pressures and temperatures, where the question is how close the value is to either limit.',
          origin: 'custom',
          uses: ['industrial/RangeIndicator.tsx'],
          align: 'stretch',
          Component: GaugeRangePlain,
        },
        {
          id: 'GaugeRangeNearLimit',
          title: 'Near the limit',
          note: 'Pick it to see a reading that is still normal but running out of margin.',
          origin: 'custom',
          uses: ['industrial/RangeIndicator.tsx'],
          align: 'stretch',
          Component: GaugeRangeNearLimit,
        },
        {
          id: 'GaugeRangeOutside',
          title: 'Outside the band',
          note: 'Pick it to see the abnormal state: the marker leaves the band and turns warning with the number.',
          origin: 'custom',
          uses: ['industrial/RangeIndicator.tsx'],
          align: 'stretch',
          Component: GaugeRangeOutside,
        },
        {
          id: 'GaugeRangeBarOnly',
          title: 'Band only',
          note: 'Pick it in table cells and list rows, next to a value that is printed separately.',
          origin: 'custom',
          uses: ['industrial/RangeIndicator.tsx', 'industrial/ValueReadout.tsx'],
          align: 'stretch',
          Component: GaugeRangeBarOnly,
        },
        {
          id: 'GaugeLevelPlain',
          title: 'Level',
          note: 'Pick it for a tank or vessel where "how full" is the whole question.',
          origin: 'custom',
          uses: ['industrial/LevelMeter.tsx'],
          Component: GaugeLevelPlain,
        },
        {
          id: 'GaugeLevelWithLimits',
          title: 'Level with limits',
          note: 'Pick it for process vessels with low, high and trip levels.',
          origin: 'custom',
          uses: ['industrial/LevelMeter.tsx'],
          Component: GaugeLevelWithLimits,
        },
        {
          id: 'GaugeLevelHigh',
          title: 'Level above high limit',
          note: 'Pick it to see the abnormal state: the fill and the number turn warning above the H tick.',
          origin: 'custom',
          uses: ['industrial/LevelMeter.tsx'],
          Component: GaugeLevelHigh,
        },
        {
          id: 'GaugeLevelRow',
          title: 'Row of vessels',
          note: 'Pick it to compare levels across a tank farm or a train of separators.',
          origin: 'custom',
          uses: ['industrial/LevelMeter.tsx'],
          size: 'md',
          Component: GaugeLevelRow,
        },
      ],
    },
    {
      id: 'rings',
      title: 'Progress ring',
      description: 'A share of a whole: availability, completion, a health score.',
      specimens: [
        {
          id: 'GaugeRingPlain',
          title: 'Plain',
          note: 'Pick it for a percentage that has no limits, only a whole.',
          origin: 'custom',
          uses: ['industrial/ProgressRing.tsx'],
          Component: GaugeRingPlain,
        },
        {
          id: 'GaugeRingSizes',
          title: 'Sizes',
          note: 'Pick small inline with text, medium in cards, large as the centre of a tile.',
          origin: 'custom',
          uses: ['industrial/ProgressRing.tsx'],
          Component: GaugeRingSizes,
        },
        {
          id: 'GaugeRingInline',
          title: 'Inline in a row',
          note: 'Pick it to show completion of a work order or job at the end of a list row.',
          origin: 'custom',
          uses: ['industrial/ProgressRing.tsx'],
          align: 'stretch',
          Component: GaugeRingInline,
        },
        {
          id: 'GaugeRingToned',
          title: 'Scored',
          note: 'Pick it for health scores, where a low score is itself a warning or critical state.',
          origin: 'custom',
          uses: ['industrial/ProgressRing.tsx'],
          size: 'md',
          Component: GaugeRingToned,
        },
        {
          id: 'GaugeRingCustomMax',
          title: 'Against a goal',
          note: 'Pick it when the whole is a goal in another unit, such as days or hours.',
          origin: 'custom',
          uses: ['industrial/ProgressRing.tsx'],
          Component: GaugeRingCustomMax,
        },
      ],
    },
    {
      id: 'compositions',
      title: 'Cards and tables',
      description: 'Gauges grouped the way an asset page or overview would use them.',
      specimens: [
        {
          id: 'GaugeCompressorCard',
          title: 'Compressor card',
          note: 'Pick it for the three readings that define a machine, under its name and run state.',
          origin: 'custom',
          uses: ['industrial/RadialGauge.tsx', 'industrial/StatusIndicator.tsx', 'industrial/status.ts'],
          size: 'lg',
          align: 'stretch',
          Component: GaugeCompressorCard,
        },
        {
          id: 'GaugeSensorList',
          title: 'Readings list',
          note: 'Pick it when a machine has more readings than dials can hold; bars stack and compare.',
          origin: 'custom',
          uses: ['industrial/LinearGauge.tsx'],
          size: 'md',
          align: 'stretch',
          Component: GaugeSensorList,
        },
        {
          id: 'GaugeSeparatorCard',
          title: 'Vessel card',
          note: 'Pick it for a separator or tank: the level drawn as a vessel, the rest as bands.',
          origin: 'custom',
          uses: ['industrial/LevelMeter.tsx', 'industrial/RangeIndicator.tsx', 'industrial/LinearGauge.tsx', 'industrial/StatusIndicator.tsx'],
          size: 'md',
          align: 'stretch',
          Component: GaugeSeparatorCard,
        },
        {
          id: 'GaugeHealthRow',
          title: 'Area health row',
          note: 'Pick it on a plant overview to compare the health score of each area.',
          origin: 'custom',
          uses: ['industrial/ProgressRing.tsx', 'industrial/StatusIndicator.tsx', 'industrial/status.ts'],
          size: 'lg',
          align: 'stretch',
          Component: GaugeHealthRow,
        },
        {
          id: 'GaugeLimitsTable',
          title: 'Tag table with operating bands',
          note: 'Pick it to scan many tags for the one drifting towards a limit.',
          origin: 'custom',
          uses: ['industrial/RangeIndicator.tsx', 'industrial/ValueReadout.tsx', 'industrial/status.ts'],
          size: 'full',
          align: 'stretch',
          Component: GaugeLimitsTable,
        },
      ],
    },
  ],
});
