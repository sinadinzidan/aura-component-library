import { CopyButton } from '../../../library/actions/CopyButton';
import { DoDont } from '../../../library/foundations/DoDont';
import { FormatExamples } from '../../../library/foundations/FormatExamples';
import {
  decimalsForMagnitude,
  formatAmount,
  formatCompact,
  formatCount,
  formatDateTimeUtc,
  formatDateWithYear,
  formatDuration,
  formatEngineering,
  formatMeasurement,
  formatPercent,
  formatRange,
  formatShare,
  formatSmartTime,
  formatTableTimestamp,
  formatTimeRange,
} from '../../../library/foundations/formatters';
import { formatDelta, formatReading, formatValue, severityStatus } from '../../../library/industrial/status';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { TrendDelta } from '../../../library/industrial/TrendDelta';
import { ValueReadout } from '../../../library/industrial/ValueReadout';
import { ALARMS, findAsset, PLANT_KPIS, SENSORS, WORK_ORDERS } from '../../data/plant';
import { DAY, formatAgo, formatDate, formatDateTime, formatTime, HOUR, MINUTE, REFERENCE_NOW } from '../../data/series';
import { definePage } from '../../types';

import source from './data-formatting.tsx?raw';

const PRESSURE = SENSORS[0];
const VIBRATION = SENSORS[3];
const GAS_FLOW = SENSORS[5];
const EXPORT_FLOW = SENSORS[9];
const BEARING = SENSORS[11];

const TRIP = REFERENCE_NOW - 14 * MINUTE;
const SHIFT_START = REFERENCE_NOW - 8 * HOUR;
const LAST_OVERHAUL = Date.UTC(2025, 10, 3, 9, 30, 0);

const COLUMN_VALUES = [182400, 9840, 412, 48.6, 6.8] as const;

const TABLE_ALARMS = ALARMS.slice(0, 5);

/** A reading with its label above, as it appears in tiles and side panels. */
function FormatReadout({ label, value, unit, decimals }: { label: string; value: number | null; unit: string; decimals: number }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <ValueReadout value={value} unit={value === null ? undefined : unit} decimals={decimals} size="sm" />
    </div>
  );
}

function FormatGuideThousands() {
  return (
    <FormatExamples
      caption="Thousands separators"
      rows={[
        { id: 'flow', label: 'Gas flow', code: 'formatValue(182400)', output: formatValue(182400), avoid: '182400' },
        { id: 'speed', label: 'Shaft speed', code: 'formatValue(9840)', output: formatValue(9840), avoid: '9 840' },
        { id: 'points', label: 'Data points', code: 'formatValue(1234567)', output: formatValue(1234567), avoid: '1.234.567' },
        { id: 'small', label: 'Export flow', code: 'formatValue(412)', output: formatValue(412) },
      ]}
    />
  );
}

function FormatGuideDecimals() {
  return (
    <FormatExamples
      caption="Decimals by magnitude"
      rows={[
        { id: 'a', label: 'Gas flow, Sm³/h', code: 'formatMeasurement(182400.4)', output: formatMeasurement(182400.4), note: '100 and up: none' },
        { id: 'b', label: 'Pressure, barg', code: 'formatMeasurement(48.62)', output: formatMeasurement(48.62), note: '10 to 100: one' },
        { id: 'c', label: 'Vibration, mm/s', code: 'formatMeasurement(6.816)', output: formatMeasurement(6.816), note: '1 to 10: two' },
        { id: 'd', label: 'Leak rate, kg/s', code: 'formatMeasurement(0.0421)', output: formatMeasurement(0.0421), note: 'Under 1: three' },
      ]}
    />
  );
}

function FormatGuideTabular() {
  return (
    <div className="grid w-full max-w-xs grid-cols-2 gap-4">
      <DoDont kind="do" caption="Right-aligned, tabular figures.">
        <ul className="flex flex-col gap-1 text-right text-sm text-base-foreground tabular-nums">
          {COLUMN_VALUES.map((value) => (
            <li key={value}>{formatValue(value, 1)}</li>
          ))}
        </ul>
      </DoDont>
      <DoDont kind="dont" caption="Left-aligned, mixed decimals.">
        <ul className="flex flex-col gap-1 text-sm text-base-foreground proportional-nums">
          {COLUMN_VALUES.map((value) => (
            <li key={value}>{String(value)}</li>
          ))}
        </ul>
      </DoDont>
    </div>
  );
}

function FormatGuidePercent() {
  return (
    <FormatExamples
      caption="Percentages"
      rows={[
        { id: 'a', label: 'Availability', code: 'formatPercent(96.4)', output: formatPercent(96.4), avoid: '96.4%' },
        { id: 'b', label: 'Level', code: 'formatPercent(54.3, 0)', output: formatPercent(54.3, 0) },
        { id: 'c', label: 'Share done', code: 'formatShare(2, 8)', output: formatShare(2, 8) },
        { id: 'd', label: 'No total', code: 'formatShare(0, 0)', output: formatShare(0, 0), avoid: 'NaN%' },
      ]}
    />
  );
}

function FormatGuideDeltas() {
  return (
    <FormatExamples
      caption="Signed changes"
      rows={[
        { id: 'up', label: 'Rise', code: 'formatDelta(0.82, 1)', output: formatDelta(0.82, 1), avoid: '0.8' },
        { id: 'down', label: 'Drop', code: 'formatDelta(-1.4, 1)', output: formatDelta(-1.4, 1), avoid: '-1.4' },
        { id: 'flat', label: 'No change', code: 'formatDelta(0.02, 1)', output: formatDelta(0.02, 1), avoid: '+0.0' },
        { id: 'none', label: 'No reference', code: 'formatDelta(null)', output: formatDelta(null) },
      ]}
    />
  );
}

function FormatGuideLargeNumbers() {
  return (
    <div className="flex w-full flex-col gap-4">
      <FormatExamples
        caption="Abbreviating large numbers"
        rows={[
          { id: 'k', label: 'Gas flow', code: 'formatCompact(182400)', output: formatCompact(182400) },
          { id: 'k0', label: 'Axis tick', code: 'formatCompact(150000, 0)', output: formatCompact(150000, 0) },
          { id: 'm', label: 'Data points', code: 'formatCompact(4380000)', output: formatCompact(4380000) },
          { id: 's', label: 'Under 1,000', code: 'formatCompact(412)', output: formatCompact(412) },
        ]}
      />
      <dl className="grid grid-cols-2 gap-4 text-xs">
        <div>
          <dt className="font-medium text-base-foreground">Abbreviate</dt>
          <dd className="mt-1 text-muted-foreground">KPI tiles, chart axes, badges and counts in navigation.</dd>
        </div>
        <div>
          <dt className="font-medium text-base-foreground">Write in full</dt>
          <dd className="mt-1 text-muted-foreground">
            Tables, limits, setpoints, exports and anything a person compares or copies.
          </dd>
        </div>
      </dl>
    </div>
  );
}

function FormatGuideRounding() {
  return (
    <div className="grid w-full grid-cols-2 gap-4">
      <DoDont kind="do" caption="A KPI is rounded to what a decision needs; a measurement keeps the sensor’s precision.">
        <div className="flex flex-col gap-3">
          <FormatReadout label="Availability, 30 days" value={PLANT_KPIS.availability.value} unit="%" decimals={1} />
          <FormatReadout label={PRESSURE.name} value={PRESSURE.value} unit={PRESSURE.unit} decimals={PRESSURE.decimals} />
        </div>
      </DoDont>
      <DoDont kind="dont" caption="Digits the instrument cannot measure, and a KPI nobody can read at a glance.">
        <div className="flex flex-col gap-3">
          <FormatReadout label="Availability, 30 days" value={96.4285714} unit="%" decimals={7} />
          <FormatReadout label={PRESSURE.name} value={48.6} unit={PRESSURE.unit} decimals={4} />
        </div>
      </DoDont>
    </div>
  );
}

function FormatGuideUnits() {
  return (
    <FormatExamples
      caption="Values with units"
      rows={[
        {
          id: 'p',
          label: 'Pressure',
          code: "formatReading(48.6, 'barg', 1)",
          output: formatReading(48.6, 'barg', 1),
          avoid: '48.6barg',
        },
        {
          id: 'f',
          label: 'Flow',
          code: "formatReading(412, 'm³/h')",
          output: formatReading(412, 'm³/h'),
          avoid: '412 m3/h',
        },
        {
          id: 't',
          label: 'Temperature',
          code: "formatReading(141.2, '°C', 1)",
          output: formatReading(141.2, '°C', 1),
          avoid: '141.2 C',
        },
        {
          id: 'v',
          label: 'Vibration',
          code: "formatReading(6.8, 'mm/s', 1)",
          output: formatReading(6.8, 'mm/s', 1),
          avoid: '6.8 MM/S',
        },
      ]}
    />
  );
}

function FormatGuideEngineering() {
  return (
    <FormatExamples
      caption="Engineering notation"
      rows={[
        { id: 'mw', label: 'Turbine power', code: "formatEngineering(12500000, 'W', 1)", output: formatEngineering(12500000, 'W', 1), avoid: '1.25e7 W' },
        { id: 'kw', label: 'Pump power', code: "formatEngineering(3500, 'W', 1)", output: formatEngineering(3500, 'W', 1), avoid: '3,500 W' },
        { id: 'ma', label: 'Loop current', code: "formatEngineering(0.0047, 'A')", output: formatEngineering(0.0047, 'A'), avoid: '0.0047 A' },
        { id: 'um', label: 'Shaft offset', code: "formatEngineering(0.000012, 'm', 0)", output: formatEngineering(0.000012, 'm', 0), avoid: '1.2E-5 m' },
      ]}
    />
  );
}

function FormatGuideRanges() {
  return (
    <FormatExamples
      caption="Ranges"
      rows={[
        {
          id: 'band',
          label: 'Operating band',
          code: "formatRange(40, 52, 'barg')",
          output: formatRange(PRESSURE.lowLimit, PRESSURE.highLimit, PRESSURE.unit),
          avoid: '40 - 52 barg',
        },
        { id: 'dec', label: 'Vibration', code: "formatRange(7.1, 11, 'mm/s', 1)", output: formatRange(7.1, 11, 'mm/s', 1) },
        { id: 'neg', label: 'Ambient', code: "formatRange(-20, 40, '°C')", output: formatRange(-20, 40, '°C'), avoid: '-20–40 °C' },
      ]}
    />
  );
}

function FormatGuideMissing() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-muted-background p-3">
          <FormatReadout label="No signal" value={null} unit={BEARING.unit} decimals={1} />
          <p className="mt-2 font-mono text-xs text-muted-foreground">formatValue(null)</p>
        </div>
        <div className="rounded-lg bg-muted-background p-3">
          <FormatReadout label="Measured zero" value={0} unit={BEARING.unit} decimals={1} />
          <p className="mt-2 font-mono text-xs text-muted-foreground">formatValue(0, 1)</p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        An em dash means nothing was measured. Zero is a measurement. Never show one for the other, and never leave the
        cell blank.
      </p>
    </div>
  );
}

function FormatGuideCurrency() {
  return (
    <FormatExamples
      caption="Money"
      rows={[
        { id: 'a', label: 'Deferred production', code: 'formatAmount(12400)', output: formatAmount(12400), avoid: '$12400' },
        { id: 'b', label: 'Spare part', code: "formatAmount(1250.5, 'NOK', 2)", output: formatAmount(1250.5, 'NOK', 2) },
        { id: 'c', label: 'Not costed', code: 'formatAmount(null)', output: formatAmount(null), avoid: 'USD 0' },
      ]}
    />
  );
}

function FormatGuideAbsoluteRelative() {
  const rows = [ALARMS[0], ALARMS[3], ALARMS[5], ALARMS[6]];

  return (
    <div className="flex w-full flex-col gap-3">
      <FormatExamples
        caption="Relative and absolute time"
        codeHeader="Age"
        outputHeader="formatSmartTime(t, now)"
        rows={rows.map((alarm) => ({
          id: alarm.id,
          label: alarm.message,
          code: formatDuration(REFERENCE_NOW - alarm.raisedAt),
          output: formatSmartTime(alarm.raisedAt, REFERENCE_NOW),
        }))}
      />
      <p className="text-xs text-muted-foreground">
        Up to 24 hours people judge by age, so show it relative. Beyond that they look things up by date, so show the
        date, with its year.
      </p>
    </div>
  );
}

function FormatGuideDateForms() {
  return (
    <FormatExamples
      caption="Written dates"
      rows={[
        { id: 'year', label: 'Date', code: 'formatDateWithYear(t)', output: formatDateWithYear(LAST_OVERHAUL), avoid: '03/11/2025', note: 'Written month: no day and month mix-up' },
        { id: 'ord', label: 'Short date', code: 'formatDate(t)', output: formatDate(TRIP), avoid: '12th March', note: 'No ordinals; year only when obvious' },
        { id: 'dt', label: 'Date and time', code: 'formatDateTimeUtc(t)', output: formatDateTimeUtc(TRIP), avoid: '12 Mar, 1:46pm', note: '"at" between date and time' },
        { id: 'short', label: 'Compact', code: 'formatDateTime(t)', output: formatDateTime(TRIP), note: 'Tooltips and chart axes' },
      ]}
    />
  );
}

function FormatGuideUtc() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-3">
      <dl className="flex flex-col gap-2 text-sm">
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-muted-foreground">Tripped</dt>
          <dd className="text-base-foreground tabular-nums">{formatTime(TRIP)} UTC</dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-muted-foreground">Last overhaul</dt>
          <dd className="text-base-foreground tabular-nums">{formatDateTimeUtc(LAST_OVERHAUL)}</dd>
        </div>
      </dl>
      <p className="text-xs text-muted-foreground">
        One zone for the whole product, labelled wherever a clock time stands alone. Convert in code; never ask the reader
        to.
      </p>
    </div>
  );
}

function FormatGuideDurations() {
  return (
    <FormatExamples
      caption="Durations"
      rows={[
        { id: 's', label: 'Valve stroke', code: 'formatDuration(45000)', output: formatDuration(45000) },
        { id: 'm', label: 'Alarm age', code: 'formatDuration(38 * MINUTE)', output: formatDuration(38 * MINUTE), avoid: '0.63 h' },
        { id: 'h', label: 'Downtime', code: 'formatDuration(200 * MINUTE)', output: formatDuration(200 * MINUTE), avoid: '3:20' },
        { id: 'd', label: 'Since test', code: 'formatDuration(52 * HOUR)', output: formatDuration(52 * HOUR), avoid: '52 hrs.' },
      ]}
    />
  );
}

function FormatGuideTimeRanges() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-3">
      <dl className="flex flex-col gap-2 text-sm">
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-muted-foreground">Day shift</dt>
          <dd className="text-base-foreground tabular-nums">
            {formatDate(SHIFT_START)}, {formatTimeRange(SHIFT_START, REFERENCE_NOW)}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-muted-foreground">Trip</dt>
          <dd className="text-base-foreground tabular-nums">Since {formatTime(TRIP)} UTC, ongoing</dd>
        </div>
      </dl>
      <p className="text-xs text-muted-foreground">
        Same format at both ends, an en dash between, the zone once. An open range gives its start and says it is
        ongoing.
      </p>
    </div>
  );
}

function FormatGuideIds() {
  const rows = [
    { label: 'Asset tag', value: '23-KA-9101' },
    { label: 'Time series', value: PRESSURE.tag },
    { label: 'Work order', value: WORK_ORDERS[0].id },
  ];

  return (
    <dl className="flex w-full max-w-xs flex-col gap-1">
      {rows.map((row) => (
        <div key={row.value} className="flex items-center justify-between gap-3">
          <dt className="text-sm text-muted-foreground">{row.label}</dt>
          <dd className="flex items-center gap-1 font-mono text-sm text-base-foreground">
            {row.value}
            <CopyButton variant="ghost" size="icon-sm" text={row.value} label={`Copy ${row.value}`} iconOnly />
          </dd>
        </div>
      ))}
    </dl>
  );
}

function FormatGuideIdInText() {
  return (
    <div className="grid w-full grid-cols-2 gap-4">
      <DoDont kind="do" caption="Name first, tag in monospace, exactly as it is stored.">
        <p className="text-sm text-base-foreground">
          Recompressor <span className="font-mono">23-KA-9103</span> tripped on high vibration.
        </p>
      </DoDont>
      <DoDont kind="dont" caption="Reformatted, lower-cased or wrapped tags cannot be searched or matched.">
        <p className="text-sm text-base-foreground">Compressor 23ka9103 tripped on high vibration.</p>
      </DoDont>
    </div>
  );
}

function FormatGuidePlurals() {
  return (
    <FormatExamples
      caption="Counts and plurals"
      rows={[
        { id: 'one', label: 'One', code: "formatCount(1, 'alarm')", output: formatCount(1, 'alarm'), avoid: '1 alarm(s)' },
        { id: 'many', label: 'Many', code: "formatCount(4, 'alarm')", output: formatCount(4, 'alarm'), avoid: 'Four alarms' },
        { id: 'zero', label: 'None', code: "formatCount(0, 'alarm')", output: formatCount(0, 'alarm'), avoid: 'No alarm' },
        {
          id: 'irregular',
          label: 'Irregular',
          code: "formatCount(12, 'time series', 'time series')",
          output: formatCount(12, 'time series', 'time series'),
          avoid: '12 time serieses',
        },
      ]}
    />
  );
}

function FormatGuideAlarmTable() {
  return (
    <table className="w-full border-collapse text-left text-sm">
      <caption className="sr-only">Alarms with formatted values, limits and timestamps</caption>
      <thead>
        <tr className="border-b border-default text-xs text-muted-foreground">
          <th scope="col" className="py-2 pr-3 font-medium">
            Raised (UTC)
          </th>
          <th scope="col" className="px-3 py-2 font-medium">
            Severity
          </th>
          <th scope="col" className="px-3 py-2 font-medium">
            Tag
          </th>
          <th scope="col" className="px-3 py-2 font-medium">
            Alarm
          </th>
          <th scope="col" className="px-3 py-2 text-right font-medium">
            Value
          </th>
          <th scope="col" className="py-2 pl-3 text-right font-medium">
            Age
          </th>
        </tr>
      </thead>
      <tbody>
        {TABLE_ALARMS.map((alarm) => (
          <tr key={alarm.id} className="border-b border-default last:border-b-0">
            <td className="py-2 pr-3 whitespace-nowrap text-base-foreground tabular-nums">
              {formatTableTimestamp(alarm.raisedAt)}
            </td>
            <td className="px-3 py-2">
              <StatusIndicator {...severityStatus(alarm.severity)} size="sm" />
            </td>
            <td className="px-3 py-2 font-mono text-xs whitespace-nowrap text-base-foreground">{alarm.sensorTag}</td>
            <td className="px-3 py-2 text-medium-foreground">{alarm.message}</td>
            <td className="px-3 py-2 text-right whitespace-nowrap text-base-foreground tabular-nums">{alarm.value}</td>
            <td className="py-2 pl-3 text-right whitespace-nowrap text-muted-foreground tabular-nums">
              {formatDuration(REFERENCE_NOW - alarm.raisedAt)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function FormatGuideReadingCard() {
  const asset = findAsset(VIBRATION.assetId);

  return (
    <div className="flex w-full max-w-xs flex-col gap-3 rounded-xl bg-card-background p-4">
      <div>
        <p className="text-sm font-medium text-card-foreground">{VIBRATION.name}</p>
        <p className="text-xs text-muted-foreground">
          {asset?.name} · <span className="font-mono">{VIBRATION.tag}</span>
        </p>
      </div>
      <ValueReadout value={VIBRATION.value} unit={VIBRATION.unit} decimals={VIBRATION.decimals} size="lg" />
      <TrendDelta value={VIBRATION.value} reference={6.1} decimals={1} unit={VIBRATION.unit} goodDirection="down" caption="vs yesterday" />
      <dl className="flex flex-col gap-1 border-t border-default pt-3 text-xs">
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Operating band</dt>
          <dd className="text-card-foreground tabular-nums">
            {formatRange(VIBRATION.lowLimit, VIBRATION.highLimit, VIBRATION.unit, 1)}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Updated</dt>
          <dd className="text-card-foreground tabular-nums">{formatAgo(REFERENCE_NOW - 2 * MINUTE)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Last survey</dt>
          <dd className="text-card-foreground tabular-nums">{formatDateWithYear(REFERENCE_NOW - 9 * DAY)}</dd>
        </div>
      </dl>
    </div>
  );
}

function FormatGuideDecimalsHelper() {
  const samples = [GAS_FLOW, EXPORT_FLOW, PRESSURE, VIBRATION];

  return (
    <div className="flex w-full flex-col gap-3">
      <FormatExamples
        caption="Sensor decimals compared with the magnitude rule"
        codeHeader="decimalsForMagnitude(value)"
        outputHeader="Reading"
        rows={samples.map((sensor) => ({
          id: sensor.id,
          label: sensor.name,
          code: String(decimalsForMagnitude(sensor.value)),
          output: formatReading(sensor.value, sensor.unit, sensor.decimals),
        }))}
      />
      <p className="text-xs text-muted-foreground">
        A sensor’s declared precision always wins. Fall back to the magnitude rule only when it has none.
      </p>
    </div>
  );
}

export default definePage({
  id: 'data-formatting',
  title: 'Data formatting',
  summary:
    'How numbers, units, dates, durations and identifiers are written, so the same reading looks the same in a tile, a table, a tooltip and a sentence. Every example shows the function that produced it.',
  guidance: {
    use: [
      'The shared formatters, never ad-hoc toFixed or string concatenation.',
      'Tabular figures and right alignment for any number that changes or sits in a column.',
      'A non-breaking space before the unit, a real minus sign, an en dash in ranges.',
      'An em dash for no value, and UTC stated wherever a clock time appears.',
    ],
    avoid: [
      'More decimals than the instrument or the decision supports.',
      'Abbreviated numbers in tables, limits or anything that is compared or copied.',
      'Numeric-only dates such as 03/11/2025, and ordinals such as 3rd.',
      'Zero, a blank or "N/A" where a value is missing.',
    ],
  },
  source,
  sections: [
    {
      id: 'numbers',
      title: 'Numbers',
      description: 'Separators, decimals, alignment, signs and counts.',
      specimens: [
        {
          id: 'FormatGuideThousands',
          title: 'Thousands separators',
          note: 'Every number of four digits or more, in every context.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['foundations/FormatExamples.tsx', 'industrial/status.ts'],
          Component: FormatGuideThousands,
        },
        {
          id: 'FormatGuideDecimals',
          title: 'Decimals by magnitude',
          note: 'When a value has no declared precision: about three significant digits.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['foundations/FormatExamples.tsx', 'foundations/formatters.ts'],
          Component: FormatGuideDecimals,
        },
        {
          id: 'FormatGuidePercent',
          title: 'Percentages',
          note: 'Shares, levels and KPIs; a share of nothing is missing, not zero.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['foundations/FormatExamples.tsx', 'foundations/formatters.ts'],
          Component: FormatGuidePercent,
        },
        {
          id: 'FormatGuideDeltas',
          title: 'Signed deltas',
          note: 'A change always carries its sign, with a real minus that lines up with the plus.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['foundations/FormatExamples.tsx', 'industrial/status.ts'],
          Component: FormatGuideDeltas,
        },
        {
          id: 'FormatGuideTabular',
          title: 'Aligned columns',
          note: 'Columns of numbers: same decimals, right-aligned, tabular figures.',
          origin: 'custom',
          align: 'stretch',
          uses: ['foundations/DoDont.tsx', 'industrial/status.ts'],
          Component: FormatGuideTabular,
        },
        {
          id: 'FormatGuideLargeNumbers',
          title: 'Large numbers',
          note: 'Abbreviate with k and M where the gist is enough; write in full where the digits matter.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['foundations/FormatExamples.tsx', 'foundations/formatters.ts'],
          Component: FormatGuideLargeNumbers,
        },
        {
          id: 'FormatGuidePlurals',
          title: 'Counts and plurals',
          note: 'Counts in copy: always a numeral, always the right noun form.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['foundations/FormatExamples.tsx', 'foundations/formatters.ts'],
          Component: FormatGuidePlurals,
        },
        {
          id: 'FormatGuideRounding',
          title: 'Rounding: KPI and measurement',
          note: 'Round a KPI for reading at a glance; show a measurement at its instrument precision.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['foundations/DoDont.tsx', 'industrial/ValueReadout.tsx'],
          Component: FormatGuideRounding,
        },
      ],
    },
    {
      id: 'units',
      title: 'Units, ranges and missing values',
      description: 'What goes around the number.',
      specimens: [
        {
          id: 'FormatGuideUnits',
          title: 'Units',
          note: 'Every reading: number, non-breaking space, then the unit with its real symbols and SI case.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['foundations/FormatExamples.tsx', 'industrial/status.ts'],
          Component: FormatGuideUnits,
        },
        {
          id: 'FormatGuideEngineering',
          title: 'Engineering notation',
          note: 'Values that span many orders of magnitude: scale the unit prefix, not the exponent.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['foundations/FormatExamples.tsx', 'foundations/formatters.ts'],
          Component: FormatGuideEngineering,
        },
        {
          id: 'FormatGuideRanges',
          title: 'Ranges',
          note: 'Limits and bands: an en dash, the unit once, and "to" when a bound is negative.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['foundations/FormatExamples.tsx', 'foundations/formatters.ts'],
          Component: FormatGuideRanges,
        },
        {
          id: 'FormatGuideCurrency',
          title: 'Money',
          note: 'Cost and loss figures: ISO code before the amount, until the product sets a locale.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['foundations/FormatExamples.tsx', 'foundations/formatters.ts'],
          Component: FormatGuideCurrency,
        },
        {
          id: 'FormatGuideMissing',
          title: 'Missing value and zero',
          note: 'A sensor with no signal shows an em dash; a sensor reading zero shows zero.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/ValueReadout.tsx'],
          Component: FormatGuideMissing,
        },
        {
          id: 'FormatGuideDecimalsHelper',
          title: 'Declared precision first',
          note: 'Use the sensor’s own decimals when it has them; the magnitude rule is the fallback.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['foundations/FormatExamples.tsx', 'foundations/formatters.ts', 'industrial/status.ts'],
          Component: FormatGuideDecimalsHelper,
        },
      ],
    },
    {
      id: 'time',
      title: 'Dates, times and durations',
      description: 'Operations views use the 24-hour clock in UTC throughout.',
      specimens: [
        {
          id: 'FormatGuideAbsoluteRelative',
          title: 'Relative or absolute',
          note: 'Relative up to 24 hours, absolute with the year after that.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['foundations/FormatExamples.tsx', 'foundations/formatters.ts'],
          Component: FormatGuideAbsoluteRelative,
        },
        {
          id: 'FormatGuideDurations',
          title: 'Durations',
          note: 'Ages, downtime and estimates: the two largest units, abbreviated without periods.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['foundations/FormatExamples.tsx', 'foundations/formatters.ts'],
          Component: FormatGuideDurations,
        },
        {
          id: 'FormatGuideDateForms',
          title: 'Written dates',
          note: 'Any date a person reads: day, written month, year.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['foundations/FormatExamples.tsx', 'foundations/formatters.ts'],
          Component: FormatGuideDateForms,
        },
        {
          id: 'FormatGuideUtc',
          title: 'Times with a zone',
          note: 'Wherever a clock time is shown outside a table that labels its column.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['foundations/formatters.ts'],
          Component: FormatGuideUtc,
        },
        {
          id: 'FormatGuideTimeRanges',
          title: 'Time ranges',
          note: 'Shifts, outages and anything with a start and an end, or a start and no end yet.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['foundations/formatters.ts'],
          Component: FormatGuideTimeRanges,
        },
      ],
    },
    {
      id: 'identifiers',
      title: 'Identifiers',
      description: 'Tags and IDs are data, not prose: monospace, unchanged, easy to copy.',
      specimens: [
        {
          id: 'FormatGuideIds',
          title: 'IDs and tags with copy',
          note: 'Anything a person will paste into a search or another system.',
          origin: 'custom',
          align: 'stretch',
          uses: ['actions/CopyButton.tsx'],
          Component: FormatGuideIds,
        },
        {
          id: 'FormatGuideIdInText',
          title: 'Tags in a sentence',
          note: 'When an identifier appears in running text, an alarm message or a toast.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['foundations/DoDont.tsx'],
          Component: FormatGuideIdInText,
        },
      ],
    },
    {
      id: 'in-context',
      title: 'In context',
      description: 'The rules applied together.',
      specimens: [
        {
          id: 'FormatGuideAlarmTable',
          title: 'Timestamps and values in a table',
          note: 'Sortable timestamps with the zone in the header, tags in monospace, values right-aligned.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['foundations/formatters.ts', 'industrial/StatusIndicator.tsx', 'industrial/status.ts'],
          Component: FormatGuideAlarmTable,
        },
        {
          id: 'FormatGuideReadingCard',
          title: 'A reading, fully formatted',
          note: 'One card using value, unit, delta, range, relative and absolute time.',
          origin: 'custom',
          align: 'stretch',
          surface: 'muted',
          uses: ['industrial/ValueReadout.tsx', 'industrial/TrendDelta.tsx', 'foundations/formatters.ts'],
          Component: FormatGuideReadingCard,
        },
      ],
    },
  ],
});
