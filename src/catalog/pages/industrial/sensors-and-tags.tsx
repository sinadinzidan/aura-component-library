import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardHeaderCenter, CardHeaderEnd, CardTitle } from '@cognite/aura/components/card';
import { CheckboxItem, CheckboxItemControl, CheckboxItemLabel } from '@cognite/aura/components/checkbox';
import { Input } from '@cognite/aura/components/input';
import { Label } from '@cognite/aura/components/label';
import { Search } from '@cognite/aura/components/search';
import { SegmentedControl, SegmentedControlButton, SegmentedControlList } from '@cognite/aura/components/segmented-control';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import { IconCheck, IconMathFunction, IconPin, IconPinFilled } from '@cognite/aura/icons';
import { useState } from 'react';

import { CopyButton } from '../../../library/actions/CopyButton';
import { LinearGauge } from '../../../library/industrial/LinearGauge';
import { RangeIndicator } from '../../../library/industrial/RangeIndicator';
import { Sparkline } from '../../../library/industrial/Sparkline';
import { formatDelta, formatLimit, formatValue, qualityStatus, runStateStatus, toneFromLimits } from '../../../library/industrial/status';
import type { Limits, StatusDescriptor } from '../../../library/industrial/status';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { ValueReadout } from '../../../library/industrial/ValueReadout';
import { QualityBadge } from '../../../library/industrial/workflows/QualityBadge';
import { TagChip } from '../../../library/industrial/workflows/TagChip';
import { TagRow } from '../../../library/industrial/workflows/TagRow';
import { convertUnit, deviation } from '../../../library/industrial/workflows/workflow';
import { ASSETS, SENSORS, sensorsOf } from '../../data/plant';
import type { Asset, Sensor } from '../../data/plant';
import { makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './sensors-and-tags.tsx?raw';

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

const limitsOf = (sensor: Sensor): Limits => ({ low: sensor.lowLimit, high: sensor.highLimit, highHigh: sensor.highHighLimit });

/** 24 hourly values that end on the sensor's current value. */
const sensorTrend = (sensor: Sensor, drift = 0): number[] => [
  ...makeValues({
    seed: sensor.seed,
    points: 23,
    base: sensor.value - drift,
    drift,
    amplitude: (sensor.highLimit - sensor.lowLimit) * 0.05,
    noise: (sensor.highLimit - sensor.lowLimit) * 0.03,
    cycles: 2,
    decimals: sensor.decimals,
  }),
  sensor.value,
];

const DISCHARGE = findSensor('pt-92531');
const SUCTION = findSensor('pt-92530');
const TEMPERATURE = findSensor('tt-92532');
const VIBRATION = findSensor('vt-92540');
const LEVEL = findSensor('lt-10012');
const COOLER = findSensor('tt-91141');
const BEARING = findSensor('tt-40015');
const CURRENT = findSensor('it-20013');
const COMPRESSOR = findAssetById('23-ka-9101');

/** The redundant discharge transmitter, for comparing two tags that should agree. */
const DISCHARGE_B = { tag: '23-PT-92533', name: 'Discharge pressure B', value: 48.1 };
const DISCHARGE_B_TREND = sensorTrend(DISCHARGE).map((value, index) => Math.round((value - 0.3 - (index % 5) * 0.05) * 10) / 10);

const SYSTEMS: readonly { id: string; name: string }[] = [
  { id: 'nk-20', name: 'Inlet and separation' },
  { id: 'nk-23', name: 'Gas compression' },
  { id: 'nk-27', name: 'Gas export' },
  { id: 'nk-40', name: 'Cooling water' },
];

const sensorsInSystem = (systemId: string): Sensor[] => SENSORS.filter((sensor) => findAssetById(sensor.assetId).parentId === systemId);

type TagIssue = { sensor: Sensor; status: StatusDescriptor; detail: string; values: readonly number[]; shown: number | null };

const TAG_ISSUES: readonly TagIssue[] = [
  {
    sensor: SUCTION,
    status: { tone: 'warning', label: 'Flatline', shape: 'square' },
    detail: 'No change for 42 min',
    values: [...sensorTrend(SUCTION).slice(0, 12), ...Array.from({ length: 12 }, () => 12.4)],
    shown: 12.4,
  },
  {
    sensor: CURRENT,
    status: { tone: 'warning', label: 'Spike', shape: 'square' },
    detail: 'Jumped 31 A in one sample at 13:22',
    values: sensorTrend(CURRENT).map((value, index) => (index === 19 ? value + 31 : value)),
    shown: CURRENT.value,
  },
  {
    sensor: BEARING,
    status: { tone: 'critical', label: 'Out of range', shape: 'diamond' },
    detail: 'Reads below the 0 °C instrument range',
    values: [61.2, 61.4, 61.1, 61.5, 61.3, 61.6, 61.2, 0, 0, 0, 0, 0],
    shown: null,
  },
];

const TH = 'px-3 py-2 text-left text-xs font-medium text-muted-foreground';
const TD = 'px-3 py-2.5 align-middle';

const PRESSURE_UNITS = ['barg', 'psig', 'kPag'] as const;
type PressureUnit = (typeof PRESSURE_UNITS)[number];

function isPressureUnit(value: unknown): value is PressureUnit {
  return PRESSURE_UNITS.some((unit) => unit === value);
}

const LIMIT_FIELDS = [
  { id: 'lowLow', label: 'LL', hint: 'Low-low, trip' },
  { id: 'low', label: 'L', hint: 'Low, alarm' },
  { id: 'high', label: 'H', hint: 'High, alarm' },
  { id: 'highHigh', label: 'HH', hint: 'High-high, trip' },
] as const;

type LimitId = (typeof LIMIT_FIELDS)[number]['id'];

/** Limits must rise from LL to HH; returns the first pair that does not. */
function limitOrderError(values: Record<LimitId, string>): string | null {
  for (let index = 0; index < LIMIT_FIELDS.length - 1; index += 1) {
    const lower = LIMIT_FIELDS[index];
    const upper = LIMIT_FIELDS[index + 1];
    if (values[lower.id] === '' || values[upper.id] === '') continue;
    if (Number(values[lower.id]) >= Number(values[upper.id])) return `${lower.label} must be lower than ${upper.label}.`;
  }
  return null;
}

function SensorTagChip() {
  return (
    <div className="flex flex-col items-start gap-3">
      <TagChip tag={DISCHARGE.tag} />
      <TagChip tag={DISCHARGE.tag} quality="good" />
      <TagChip tag={COOLER.tag} quality="uncertain" />
      <TagChip tag={BEARING.tag} quality="bad" />
    </div>
  );
}

function SensorTagInlineText() {
  return (
    <p className="max-w-xs text-sm text-base-foreground">
      Discharge temperature <TagChip tag={TEMPERATURE.tag} onSelect={() => undefined} /> crossed its high limit at 13:22, eight minutes after suction pressure{' '}
      <TagChip tag={SUCTION.tag} onSelect={() => undefined} /> began to fall.
    </p>
  );
}

function SensorTagCopy() {
  return (
    <div className="flex flex-col items-start gap-1">
      <span className="text-xs text-muted-foreground">{DISCHARGE.name}</span>
      <div className="flex items-center gap-1 font-mono text-sm text-base-foreground">
        {DISCHARGE.tag}
        <CopyButton variant="ghost" size="icon-sm" text={DISCHARGE.tag} label="Copy tag" iconOnly />
      </div>
    </div>
  );
}

function SensorTagRow() {
  return (
    <div className="w-full max-w-lg">
      <TagRow tag={DISCHARGE.tag} name={DISCHARGE.name} value={DISCHARGE.value} unit={DISCHARGE.unit} decimals={1} quality={DISCHARGE.quality} />
    </div>
  );
}

function SensorTagRowSparkline() {
  return (
    <div className="w-full max-w-lg">
      <TagRow
        tag={VIBRATION.tag}
        name={VIBRATION.name}
        value={VIBRATION.value}
        unit={VIBRATION.unit}
        decimals={1}
        trailing={
          <div className="w-24 shrink-0">
            <Sparkline values={sensorTrend(VIBRATION, 1.4)} label={`${VIBRATION.name}, last 24 hours`} unit={VIBRATION.unit} limit={VIBRATION.highLimit} height={28} showLast />
          </div>
        }
      />
    </div>
  );
}

function SensorTagQualityStates() {
  return (
    <div className="flex w-full max-w-lg flex-col divide-y divide-default">
      <TagRow tag={DISCHARGE.tag} name={DISCHARGE.name} value={DISCHARGE.value} unit={DISCHARGE.unit} decimals={1} quality="good" />
      <TagRow tag={COOLER.tag} name={COOLER.name} value={COOLER.value} unit={COOLER.unit} decimals={1} quality="uncertain" />
      <TagRow tag={BEARING.tag} name={BEARING.name} value={null} unit={BEARING.unit} quality="bad" />
    </div>
  );
}

function SensorTagStale() {
  return (
    <div className="flex w-full max-w-lg flex-col divide-y divide-default">
      <TagRow tag={LEVEL.tag} name={LEVEL.name} value={LEVEL.value} unit={LEVEL.unit} decimals={1} quality="good" />
      <TagRow tag={COOLER.tag} name={COOLER.name} value={COOLER.value} unit={COOLER.unit} decimals={1} quality="uncertain" stale age="14 min" />
      <TagRow tag={CURRENT.tag} name={CURRENT.name} value={CURRENT.value} unit={CURRENT.unit} decimals={1} quality="uncertain" stale age="3 h" />
    </div>
  );
}

function SensorTagHealth() {
  return (
    <ul aria-label="Tag health issues" className="flex w-full max-w-lg flex-col divide-y divide-default">
      {TAG_ISSUES.map((issue) => (
        <li key={issue.sensor.id} className="grid grid-cols-[minmax(0,1fr)_5rem_6.5rem] items-center gap-3 py-2">
          <div className="flex min-w-0 flex-col">
            <span className="truncate font-mono text-sm text-base-foreground">{issue.sensor.tag}</span>
            <span className="truncate text-xs text-muted-foreground">{issue.detail}</span>
          </div>
          <Sparkline values={issue.values} label={`${issue.sensor.name}, last 24 hours`} unit={issue.sensor.unit} tone={issue.status.tone} height={24} />
          <StatusIndicator size="sm" {...issue.status} />
        </li>
      ))}
    </ul>
  );
}

function SensorTagComparison() {
  const difference = DISCHARGE.value - DISCHARGE_B.value;
  const domain = [44, 52] as const;
  return (
    <div className="flex w-full max-w-lg flex-col gap-3">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-sm font-medium text-base-foreground">Redundant transmitters</span>
        <StatusIndicator size="sm" tone="success" label="Agree within 1.0 barg" />
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2">
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-mono text-sm text-base-foreground">{DISCHARGE.tag}</span>
          <span className="text-xs text-muted-foreground">Transmitter A</span>
        </div>
        <Sparkline values={sensorTrend(DISCHARGE)} label={`${DISCHARGE.tag}, last 24 hours`} unit="barg" domain={domain} height={24} />
        <ValueReadout size="sm" value={DISCHARGE.value} unit="barg" decimals={1} />
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-mono text-sm text-base-foreground">{DISCHARGE_B.tag}</span>
          <span className="text-xs text-muted-foreground">Transmitter B</span>
        </div>
        <Sparkline values={DISCHARGE_B_TREND} label={`${DISCHARGE_B.tag}, last 24 hours`} unit="barg" domain={domain} height={24} />
        <ValueReadout size="sm" value={DISCHARGE_B.value} unit="barg" decimals={1} />
      </div>
      <p className="border-t border-default pt-3 text-xs text-muted-foreground tabular-nums">
        Difference {formatDelta(difference, 1)} barg · both trends on a shared 44–52 barg scale
      </p>
    </div>
  );
}

function SensorTagDeviation() {
  const setpoint = 50;
  const { absolute } = deviation(LEVEL.value, setpoint);
  return (
    <div className="flex w-full max-w-64 flex-col gap-3">
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">
          {LEVEL.name} · <span className="font-mono">{LEVEL.tag}</span>
        </span>
        <ValueReadout value={LEVEL.value} unit={LEVEL.unit} decimals={1} />
      </div>
      <LinearGauge label={`${LEVEL.name} against setpoint`} value={LEVEL.value} min={LEVEL.rangeMin} max={LEVEL.rangeMax} target={setpoint} unit="%" size="sm" showHeader={false} />
      <p className="text-xs text-muted-foreground tabular-nums">
        <span className="font-medium text-base-foreground">{formatDelta(absolute, 1)} %</span> from setpoint {formatValue(setpoint, 1)} %
      </p>
    </div>
  );
}

function SensorTagCalculated() {
  const ratio = (DISCHARGE.value + 1.013) / (SUCTION.value + 1.013);
  return (
    <div className="flex w-full max-w-64 flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-xs text-muted-foreground">Compression ratio</span>
          <ValueReadout value={ratio} decimals={2} />
        </div>
        <Badge variant="secondary">
          <IconMathFunction aria-hidden="true" />
          Calculated
        </Badge>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 rounded-lg bg-muted-background p-2 font-mono text-xs text-base-foreground">
        <span>(</span>
        <TagChip tag={DISCHARGE.tag} className="bg-base-background" />
        <span>+ 1.013) / (</span>
        <TagChip tag={SUCTION.tag} className="bg-base-background" />
        <span>+ 1.013)</span>
      </div>
      <p className="text-xs text-muted-foreground">Recalculated every 10 s from two inputs, both good quality.</p>
    </div>
  );
}

function SensorTagUnitConversion() {
  const [unit, setUnit] = useState<PressureUnit>('psig');
  const converted = convertUnit(DISCHARGE.value, 'barg', unit);
  return (
    <div className="flex w-full max-w-64 flex-col gap-3">
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">
          {DISCHARGE.name} · <span className="font-mono">{DISCHARGE.tag}</span>
        </span>
        <ValueReadout value={converted} unit={unit} decimals={unit === 'barg' ? 1 : 0} />
      </div>
      <SegmentedControl value={unit} onValueChange={(value) => (isPressureUnit(value) ? setUnit(value) : undefined)}>
        <SegmentedControlList size="small" aria-label="Display unit">
          {PRESSURE_UNITS.map((option) => (
            <SegmentedControlButton key={option} value={option} tabContent="label-only">
              {option}
            </SegmentedControlButton>
          ))}
        </SegmentedControlList>
      </SegmentedControl>
      <p className="text-xs text-muted-foreground tabular-nums">Stored as {formatValue(DISCHARGE.value, 1)} barg. Limits convert with the value.</p>
    </div>
  );
}

function SensorTagLiveList() {
  const sensors = sensorsOf(COMPRESSOR.id);
  return (
    <div className="flex w-full max-w-lg flex-col gap-2">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-base-foreground">{COMPRESSOR.name}</p>
          <p className="font-mono text-xs text-muted-foreground">{COMPRESSOR.tag}</p>
        </div>
        <StatusIndicator size="sm" tone="success" label="Live" detail="updated 14:00:02" />
      </div>
      <div className="flex flex-col divide-y divide-default">
        {sensors.map((sensor) => (
          <TagRow
            key={sensor.id}
            tag={sensor.tag}
            name={sensor.name}
            value={sensor.value}
            unit={sensor.unit}
            decimals={sensor.decimals}
            tone={toneFromLimits(sensor.value, limitsOf(sensor))}
          />
        ))}
      </div>
    </div>
  );
}

function SensorTagPinned() {
  const [pinned, setPinned] = useState<readonly string[]>([DISCHARGE.id, VIBRATION.id]);
  const candidates = [DISCHARGE, VIBRATION, TEMPERATURE, LEVEL];
  const ordered = [...candidates.filter((sensor) => pinned.includes(sensor.id)), ...candidates.filter((sensor) => !pinned.includes(sensor.id))];
  const toggle = (id: string) => setPinned((current) => (current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id]));
  return (
    <div className="flex w-full max-w-lg flex-col gap-2">
      <span className="text-xs text-muted-foreground tabular-nums">{pinned.length} pinned · pinned tags stay on top</span>
      <div className="flex flex-col divide-y divide-default">
        {ordered.map((sensor) => {
          const isPinned = pinned.includes(sensor.id);
          const label = isPinned ? `Unpin ${sensor.tag}` : `Pin ${sensor.tag}`;
          return (
            <TagRow
              key={sensor.id}
              tag={sensor.tag}
              name={sensor.name}
              value={sensor.value}
              unit={sensor.unit}
              decimals={sensor.decimals}
              leading={
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button variant="ghost" size="icon-sm" aria-label={label} aria-pressed={isPinned} onClick={() => toggle(sensor.id)}>
                        {isPinned ? <IconPinFilled /> : <IconPin />}
                      </Button>
                    }
                  />
                  <TooltipContent>{label}</TooltipContent>
                </Tooltip>
              }
            />
          );
        })}
      </div>
    </div>
  );
}

function SensorTagGroups() {
  return (
    <div className="flex w-full max-w-lg flex-col gap-4">
      {SYSTEMS.filter((system) => system.id !== 'nk-23').map((system) => {
        const sensors = sensorsInSystem(system.id);
        return (
          <section key={system.id} className="flex flex-col">
            <h4 className="flex items-baseline justify-between gap-3 border-b border-default pb-1 text-xs font-medium text-muted-foreground">
              <span>{system.name}</span>
              <span className="font-normal tabular-nums">
                {sensors.length} {sensors.length === 1 ? 'tag' : 'tags'}
              </span>
            </h4>
            {sensors.map((sensor) => (
              <TagRow key={sensor.id} tag={sensor.tag} name={sensor.name} value={sensor.quality === 'bad' ? null : sensor.value} unit={sensor.unit} decimals={sensor.decimals} quality={sensor.quality} />
            ))}
          </section>
        );
      })}
    </div>
  );
}

function SensorTagPicker() {
  const [query, setQuery] = useState('press');
  const [selected, setSelected] = useState(DISCHARGE.id);
  const needle = query.trim().toLowerCase();
  const matches = SENSORS.filter((sensor) => needle === '' || sensor.tag.toLowerCase().includes(needle) || sensor.name.toLowerCase().includes(needle)).slice(0, 5);
  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <Search aria-label="Search tags" placeholder="Search by tag or description" value={query} onChange={(event) => setQuery(event.target.value)} onClear={() => setQuery('')} />
      {matches.length === 0 ? (
        <p className="px-2 py-3 text-sm text-muted-foreground">No tags match "{query}". Search by tag number or by what it measures.</p>
      ) : (
        <ul role="listbox" aria-label="Matching tags" className="flex flex-col gap-0.5">
          {matches.map((sensor) => {
            const isSelected = sensor.id === selected;
            return (
              <li key={sensor.id} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => setSelected(sensor.id)}
                  className={`flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left hover:bg-muted-background focus-visible:shadow-focus-ring focus-visible:outline-none ${isSelected ? 'bg-muted-background' : ''}`}
                >
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-mono text-sm text-base-foreground">{sensor.tag}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {sensor.name} · {findAssetById(sensor.assetId).name}
                    </span>
                  </span>
                  <span className="text-xs text-muted-foreground">{sensor.unit}</span>
                  <IconCheck aria-hidden className={`size-4 text-base-foreground ${isSelected ? '' : 'invisible'}`} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <p className="px-2 text-xs text-muted-foreground tabular-nums">
        {matches.length} of {SENSORS.length} tags
      </p>
    </div>
  );
}

function SensorTagBulkSelect() {
  const sensors = sensorsOf(COMPRESSOR.id).slice(0, 5);
  const [selected, setSelected] = useState<readonly string[]>([DISCHARGE.id, TEMPERATURE.id]);
  const allSelected = selected.length === sensors.length;
  const toggle = (id: string, checked: boolean) => setSelected((current) => (checked ? [...current, id] : current.filter((entry) => entry !== id)));
  return (
    <div className="flex w-full max-w-lg flex-col gap-2">
      <div className="flex min-h-8 items-center justify-between gap-4">
        <CheckboxItem>
          <CheckboxItemControl
            checked={allSelected}
            indeterminate={selected.length > 0 && !allSelected}
            onCheckedChange={(checked) => setSelected(checked ? sensors.map((sensor) => sensor.id) : [])}
          />
          <CheckboxItemLabel>{selected.length === 0 ? 'Select all' : `${selected.length} of ${sensors.length} selected`}</CheckboxItemLabel>
        </CheckboxItem>
        {selected.length > 0 ? (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              Add to chart
            </Button>
            <Button variant="secondary" size="sm">
              Export values
            </Button>
          </div>
        ) : null}
      </div>
      <div className="flex flex-col divide-y divide-default border-t border-default">
        {sensors.map((sensor) => (
          <TagRow
            key={sensor.id}
            tag={sensor.tag}
            name={sensor.name}
            value={sensor.value}
            unit={sensor.unit}
            decimals={sensor.decimals}
            leading={<CheckboxItemControl aria-label={`Select ${sensor.tag}`} checked={selected.includes(sensor.id)} onCheckedChange={(checked) => toggle(sensor.id, checked)} />}
          />
        ))}
      </div>
    </div>
  );
}

function SensorTagSelection() {
  const [tags, setTags] = useState<readonly string[]>([DISCHARGE.tag, SUCTION.tag, TEMPERATURE.tag, VIBRATION.tag]);
  return (
    <div className="flex w-full max-w-lg flex-col gap-3">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-sm font-medium text-base-foreground">Tags on this chart</span>
        <span className="text-xs text-muted-foreground tabular-nums">{tags.length} of 8</span>
      </div>
      {tags.length === 0 ? (
        <p className="text-sm text-muted-foreground">No tags selected. Add tags from the picker to plot them.</p>
      ) : (
        <ul aria-label="Selected tags" className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <li key={tag}>
              <TagChip tag={tag} onRemove={() => setTags((current) => current.filter((entry) => entry !== tag))} />
            </li>
          ))}
        </ul>
      )}
      <div>
        <Button variant="ghost" size="sm" disabled={tags.length === 4} onClick={() => setTags([DISCHARGE.tag, SUCTION.tag, TEMPERATURE.tag, VIBRATION.tag])}>
          Restore selection
        </Button>
      </div>
    </div>
  );
}

function SensorTagTable() {
  const sensors = SENSORS.filter((sensor) => sensor.quality !== 'bad').slice(0, 8);
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-3xl border-collapse text-sm">
        <thead>
          <tr>
            <th scope="col" className={TH}>
              Tag
            </th>
            <th scope="col" className={TH}>
              Description
            </th>
            <th scope="col" className={`${TH} text-right`}>
              Value
            </th>
            <th scope="col" className={`${TH} text-right`}>
              Low
            </th>
            <th scope="col" className={`${TH} text-right`}>
              High
            </th>
            <th scope="col" className={`${TH} text-right`}>
              High-high
            </th>
            <th scope="col" className={`${TH} w-32`}>
              Last 24 h
            </th>
            <th scope="col" className={TH}>
              Quality
            </th>
          </tr>
        </thead>
        <tbody>
          {sensors.map((sensor) => {
            const tone = toneFromLimits(sensor.value, limitsOf(sensor));
            return (
              <tr key={sensor.id} className="border-t border-default">
                <td className={`${TD} font-mono whitespace-nowrap text-base-foreground`}>{sensor.tag}</td>
                <td className={`${TD} text-muted-foreground`}>{sensor.name}</td>
                <td className={`${TD} text-right`}>
                  <ValueReadout size="xs" value={sensor.value} unit={sensor.unit} decimals={sensor.decimals} tone={tone} />
                </td>
                <td className={`${TD} text-right text-muted-foreground tabular-nums`}>{formatLimit(sensor.lowLimit, sensor.decimals)}</td>
                <td className={`${TD} text-right text-muted-foreground tabular-nums`}>{formatLimit(sensor.highLimit, sensor.decimals)}</td>
                <td className={`${TD} text-right text-muted-foreground tabular-nums`}>
                  {sensor.highHighLimit === undefined ? '—' : formatLimit(sensor.highHighLimit, sensor.decimals)}
                </td>
                <td className={TD}>
                  <Sparkline values={sensorTrend(sensor)} label={`${sensor.name}, last 24 hours`} unit={sensor.unit} decimals={sensor.decimals} limit={sensor.highLimit} height={24} tone={tone} />
                </td>
                <td className={TD}>
                  <StatusIndicator size="sm" {...qualityStatus(sensor.quality)} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function SensorTagDetailCard() {
  const rows: readonly { label: string; value: string; mono?: boolean }[] = [
    { label: 'Equipment', value: `${COMPRESSOR.tag} ${COMPRESSOR.name}` },
    { label: 'Source', value: 'OPC UA · ns=2;s=23PT92531.PV', mono: true },
    { label: 'Instrument range', value: `${DISCHARGE.rangeMin}–${DISCHARGE.rangeMax} ${DISCHARGE.unit}` },
    { label: 'Sample interval', value: '1 s' },
    { label: 'Last calibration', value: '14 Jan 2026 · Jonas Nyberg' },
    { label: 'Next calibration', value: '14 Jan 2027' },
  ];
  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardHeaderCenter>
          <CardTitle>{DISCHARGE.name}</CardTitle>
          <CardDescription>
            <span className="font-mono">{DISCHARGE.tag}</span>
          </CardDescription>
        </CardHeaderCenter>
        <CardHeaderEnd>
          <QualityBadge quality={DISCHARGE.quality} />
        </CardHeaderEnd>
      </CardHeader>
      <CardContent>
        <ValueReadout size="lg" value={DISCHARGE.value} unit={DISCHARGE.unit} decimals={1} />
        <RangeIndicator
          className="w-full"
          label={`${DISCHARGE.name} within limits`}
          value={DISCHARGE.value}
          min={DISCHARGE.rangeMin}
          max={DISCHARGE.rangeMax}
          limits={limitsOf(DISCHARGE)}
          unit={DISCHARGE.unit}
          decimals={1}
          showHeader={false}
        />
        <dl className="grid w-full grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-2 text-sm">
          {rows.map((row) => (
            <div key={row.label} className="contents">
              <dt className="text-muted-foreground">{row.label}</dt>
              <dd className={`truncate text-base-foreground tabular-nums ${row.mono ? 'font-mono text-xs leading-5' : ''}`}>{row.value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

function SensorTagLimitEditor() {
  const [values, setValues] = useState<Record<LimitId, string>>({ lowLow: '85', low: '90', high: '145', highHigh: '140' });
  const error = limitOrderError(values);
  return (
    <div className="flex w-full max-w-lg flex-col gap-3">
      <div className="flex items-baseline justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-base-foreground">{TEMPERATURE.name}</p>
          <p className="font-mono text-xs text-muted-foreground">{TEMPERATURE.tag}</p>
        </div>
        <span className="text-xs text-muted-foreground">Limits in {TEMPERATURE.unit}</span>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {LIMIT_FIELDS.map((field) => (
          <div key={field.id} className="flex min-w-0 flex-col">
            <Label htmlFor={`sensor-tag-limit-${field.id}`}>{field.label}</Label>
            <Input
              id={`sensor-tag-limit-${field.id}`}
              type="number"
              inputMode="decimal"
              aria-describedby="sensor-tag-limit-hint"
              aria-invalid={error !== null && error.includes(`${field.label} `)}
              value={values[field.id]}
              onChange={(event) => setValues((current) => ({ ...current, [field.id]: event.target.value }))}
            />
            <span className="pt-1 text-xs text-muted-foreground">{field.hint}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between gap-4">
        <p id="sensor-tag-limit-hint" role={error ? 'alert' : undefined} className={`text-xs ${error ? 'font-medium text-critical-foreground-strong' : 'text-muted-foreground'}`}>
          {error ?? 'Limits rise from LL to HH. Leave a field empty for no limit.'}
        </p>
        <div className="flex shrink-0 gap-2">
          <Button variant="ghost" size="sm" onClick={() => setValues({ lowLow: '85', low: '90', high: '145', highHigh: '155' })}>
            Reset
          </Button>
          <Button size="sm" disabled={error !== null}>
            Save limits
          </Button>
        </div>
      </div>
    </div>
  );
}

function SensorTagAssetPanel() {
  const sensors = sensorsOf(COMPRESSOR.id);
  const outside = sensors.filter((sensor) => toneFromLimits(sensor.value, limitsOf(sensor)) !== 'neutral').length;
  return (
    <Card className="w-full">
      <CardHeader>
        <CardHeaderCenter>
          <CardTitle>{COMPRESSOR.name}</CardTitle>
          <CardDescription>
            <span className="font-mono">{COMPRESSOR.tag}</span> · {sensors.length} tags · {outside} outside limits
          </CardDescription>
        </CardHeaderCenter>
        <CardHeaderEnd>
          <StatusIndicator variant="badge" {...runStateStatus(COMPRESSOR.state)} />
        </CardHeaderEnd>
      </CardHeader>
      <CardContent>
        <div className="grid w-full grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2 xl:grid-cols-3">
          {sensors.map((sensor) => {
            const tone = toneFromLimits(sensor.value, limitsOf(sensor));
            return (
              <div key={sensor.id} className="flex min-w-0 flex-col gap-2">
                <div className="flex items-baseline justify-between gap-3">
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm text-base-foreground">{sensor.name}</span>
                    <span className="font-mono text-xs text-muted-foreground">{sensor.tag}</span>
                  </div>
                  <ValueReadout size="sm" value={sensor.value} unit={sensor.unit} decimals={sensor.decimals} tone={tone} />
                </div>
                <RangeIndicator
                  label={`${sensor.name} within limits`}
                  value={sensor.value}
                  min={sensor.rangeMin}
                  max={sensor.rangeMax}
                  limits={limitsOf(sensor)}
                  unit={sensor.unit}
                  decimals={sensor.decimals}
                  showHeader={false}
                  showLimits={false}
                />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default definePage({
  id: 'sensors-and-tags',
  title: 'Sensors and tags',
  summary:
    'A tag is the handle on a measurement: its number, what it measures, the current value with unit, and how far that value can be trusted. These are the rows, chips, lists and editors that show tags and let people pick, pin and configure them.',
  guidance: {
    use: [
      'Set tags in monospace and never truncate the tag number; truncate the description instead.',
      'Keep value, unit and quality in fixed columns so a list of tags reads as a table.',
      'Show quality and age whenever a value is not fresh and good, in words as well as colour.',
      'Colour a value only when it is outside its limits; a normal reading stays neutral.',
    ],
    avoid: [
      'A bad-quality number printed as if it were a reading; show a dash and the state.',
      'Converting units silently — say what the value is stored as.',
      'Saving limits that are out of order; validate LL below L below H below HH.',
      'Icon-only pin and copy buttons without a name and a tooltip.',
    ],
  },
  source,
  sections: [
    {
      id: 'tags',
      title: 'Tags and rows',
      description: 'The tag on its own as a chip, and on one line with its value.',
      specimens: [
        {
          id: 'SensorTagChip',
          title: 'Tag chip',
          note: 'Pick it wherever a tag is named outside a table; add the quality dot when trust matters.',
          origin: 'custom',
          uses: ['industrial/workflows/TagChip.tsx'],
          Component: SensorTagChip,
        },
        {
          id: 'SensorTagInlineText',
          title: 'Tags in a sentence',
          note: 'Pick it in notes, findings and log entries so each tag is a link to its trend.',
          origin: 'custom',
          uses: ['industrial/workflows/TagChip.tsx'],
          Component: SensorTagInlineText,
        },
        {
          id: 'SensorTagCopy',
          title: 'Copy tag',
          note: 'Pick it beside a tag people paste into other systems: one click, confirmed in place.',
          origin: 'custom',
          uses: ['actions/CopyButton.tsx'],
          Component: SensorTagCopy,
        },
        {
          id: 'SensorTagRow',
          title: 'Tag row',
          note: 'Pick it as the default line for a tag: number, description, value with unit, quality.',
          origin: 'custom',
          uses: ['industrial/workflows/TagRow.tsx'],
          size: 'md',
          align: 'stretch',
          Component: SensorTagRow,
        },
        {
          id: 'SensorTagRowSparkline',
          title: 'Tag row with trend',
          note: 'Pick it when the direction matters as much as the number: a 24-hour sparkline with the high limit.',
          origin: 'custom',
          uses: ['industrial/workflows/TagRow.tsx', 'industrial/Sparkline.tsx'],
          size: 'md',
          align: 'stretch',
          Component: SensorTagRowSparkline,
        },
      ],
    },
    {
      id: 'trust',
      title: 'Quality and derived values',
      description: 'How far a value can be trusted, and values that are compared, converted or calculated.',
      specimens: [
        {
          id: 'SensorTagQualityStates',
          title: 'Quality states',
          note: 'Pick it to show good, uncertain and bad side by side; a bad signal shows a dash, not a number.',
          origin: 'custom',
          uses: ['industrial/workflows/TagRow.tsx', 'industrial/status.ts'],
          size: 'md',
          align: 'stretch',
          Component: SensorTagQualityStates,
        },
        {
          id: 'SensorTagStale',
          title: 'Stale values',
          note: 'Pick it when a value has stopped updating: it dims and carries its age.',
          origin: 'custom',
          uses: ['industrial/workflows/TagRow.tsx'],
          size: 'md',
          align: 'stretch',
          Component: SensorTagStale,
        },
        {
          id: 'SensorTagHealth',
          title: 'Tag health',
          note: 'Pick it for a data-health view: flatline, spike and out of range, each with the trend that shows it.',
          origin: 'custom',
          uses: ['industrial/Sparkline.tsx', 'industrial/StatusIndicator.tsx'],
          size: 'md',
          align: 'stretch',
          Component: SensorTagHealth,
        },
        {
          id: 'SensorTagComparison',
          title: 'Two tags compared',
          note: 'Pick it for redundant transmitters or before and after: both values, both trends on one scale, and the difference.',
          origin: 'custom',
          uses: ['industrial/Sparkline.tsx', 'industrial/ValueReadout.tsx', 'industrial/StatusIndicator.tsx'],
          size: 'md',
          align: 'stretch',
          Component: SensorTagComparison,
        },
        {
          id: 'SensorTagDeviation',
          title: 'Deviation from setpoint',
          note: 'Pick it for a controlled variable: the value, the setpoint as a mark, and the signed distance between them.',
          origin: 'custom',
          uses: ['industrial/LinearGauge.tsx', 'industrial/ValueReadout.tsx', 'industrial/workflows/workflow.ts'],
          align: 'stretch',
          Component: SensorTagDeviation,
        },
        {
          id: 'SensorTagCalculated',
          title: 'Calculated tag',
          note: 'Pick it for a derived value: mark it as calculated and show the formula with its input tags.',
          origin: 'custom',
          uses: ['industrial/workflows/TagChip.tsx', 'industrial/ValueReadout.tsx'],
          align: 'stretch',
          Component: SensorTagCalculated,
        },
        {
          id: 'SensorTagUnitConversion',
          title: 'Unit conversion',
          note: 'Pick it when people read the same tag in different units: switch the display, keep the stored unit visible.',
          origin: 'custom',
          uses: ['industrial/ValueReadout.tsx', 'industrial/workflows/workflow.ts'],
          align: 'stretch',
          Component: SensorTagUnitConversion,
        },
      ],
    },
    {
      id: 'lists',
      title: 'Lists and selection',
      description: 'Many tags at once: live lists, groups, pins, a picker and bulk selection.',
      specimens: [
        {
          id: 'SensorTagLiveList',
          title: 'Live values for an asset',
          note: 'Pick it on an equipment page: every tag on the unit, with only out-of-limit values coloured.',
          origin: 'custom',
          uses: ['industrial/workflows/TagRow.tsx', 'industrial/status.ts', 'industrial/StatusIndicator.tsx'],
          size: 'md',
          align: 'stretch',
          Component: SensorTagLiveList,
        },
        {
          id: 'SensorTagPinned',
          title: 'Pinned tags',
          note: 'Pick it when people watch a few tags all shift: pinned ones move to the top. Click a pin to try.',
          origin: 'custom',
          uses: ['industrial/workflows/TagRow.tsx'],
          size: 'md',
          align: 'stretch',
          Component: SensorTagPinned,
        },
        {
          id: 'SensorTagGroups',
          title: 'Grouped by system',
          note: 'Pick it for a plant-wide list: a quiet heading per system with its tag count.',
          origin: 'custom',
          uses: ['industrial/workflows/TagRow.tsx'],
          size: 'md',
          align: 'stretch',
          Component: SensorTagGroups,
        },
        {
          id: 'SensorTagPicker',
          title: 'Tag picker',
          note: 'Pick it to choose one tag from many: search by number or description, with the equipment on each result.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: SensorTagPicker,
        },
        {
          id: 'SensorTagBulkSelect',
          title: 'Bulk selection',
          note: 'Pick it when an action applies to several tags: select all, a count, and the actions appear with the selection.',
          origin: 'custom',
          uses: ['industrial/workflows/TagRow.tsx'],
          size: 'md',
          align: 'stretch',
          Component: SensorTagBulkSelect,
        },
        {
          id: 'SensorTagSelection',
          title: 'Selected tags',
          note: 'Pick it to show what a chart or export covers: removable chips with a count against the maximum.',
          origin: 'custom',
          uses: ['industrial/workflows/TagChip.tsx'],
          size: 'md',
          align: 'stretch',
          Component: SensorTagSelection,
        },
      ],
    },
    {
      id: 'detail',
      title: 'Tables, limits and detail',
      description: 'The full register of tags, one tag in depth, and the editor for its limits.',
      specimens: [
        {
          id: 'SensorTagTable',
          title: 'Tag table with limits',
          note: 'Pick it to review many tags against their limits: value, low, high, high-high, a 24-hour trend and quality.',
          origin: 'custom',
          uses: ['industrial/Sparkline.tsx', 'industrial/ValueReadout.tsx', 'industrial/StatusIndicator.tsx', 'industrial/status.ts'],
          size: 'full',
          align: 'stretch',
          Component: SensorTagTable,
        },
        {
          id: 'SensorTagDetailCard',
          title: 'Tag detail card',
          note: 'Pick it for one tag in depth: value within its limits, where it comes from and when it was last calibrated.',
          origin: 'custom',
          uses: ['industrial/workflows/QualityBadge.tsx', 'industrial/RangeIndicator.tsx', 'industrial/ValueReadout.tsx'],
          size: 'md',
          align: 'stretch',
          Component: SensorTagDetailCard,
        },
        {
          id: 'SensorTagLimitEditor',
          title: 'Limit editor',
          note: 'Pick it to set LL, L, H and HH in one row; it refuses limits that are out of order. Shown with HH below H.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: SensorTagLimitEditor,
        },
        {
          id: 'SensorTagAssetPanel',
          title: 'Asset tag panel',
          note: 'Pick it as the tags block on an equipment page: every reading placed inside its operating range.',
          origin: 'custom',
          uses: ['industrial/RangeIndicator.tsx', 'industrial/ValueReadout.tsx', 'industrial/StatusIndicator.tsx', 'industrial/status.ts'],
          size: 'full',
          align: 'stretch',
          Component: SensorTagAssetPanel,
        },
      ],
    },
  ],
});
