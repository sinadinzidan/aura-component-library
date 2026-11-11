import { Button } from '@cognite/aura/components/button';
import { CheckboxItem, CheckboxItemControl, CheckboxItemLabel } from '@cognite/aura/components/checkbox';
import { Input } from '@cognite/aura/components/input';
import { Label } from '@cognite/aura/components/label';
import { Search } from '@cognite/aura/components/search';
import { SegmentedControl, SegmentedControlButton, SegmentedControlList } from '@cognite/aura/components/segmented-control';
import { IconActivity, IconAlertTriangle, IconCircleCheck, IconCircleX, IconCloudOff, IconGauge, IconMathFunction, IconPin, IconPinFilled, IconTemperature, IconWaveSine } from '@cognite/aura/icons';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { CopyButton } from '../../../library/actions/CopyButton';
import { Canvas } from '../../../library/kit/Canvas';
import { DataTable, type DataTableColumn } from '../../../library/kit/DataTable';
import { Grid } from '../../../library/kit/Grid';
import { IconChip } from '../../../library/kit/IconChip';
import { ListRow } from '../../../library/kit/ListRow';
import { Meter } from '../../../library/kit/Meter';
import { Panel } from '../../../library/kit/Panel';
import { RingGauge } from '../../../library/kit/RingGauge';
import { SectionHeader } from '../../../library/kit/SectionHeader';
import { LimitScale } from '../../../library/kit/sensors-and-tags/LimitScale';
import { TagCard } from '../../../library/kit/sensors-and-tags/TagCard';
import { convertPressure, judgeValue, parseTag, qualityStatus, shareInside, type TagLimits, type TagQuality } from '../../../library/kit/sensors-and-tags/tags';
import { TagValueRow } from '../../../library/kit/sensors-and-tags/TagValueRow';
import { SparkLine } from '../../../library/kit/SparkLine';
import { Stat } from '../../../library/kit/Stat';
import { StatGroup } from '../../../library/kit/StatGroup';
import { StatusPill } from '../../../library/kit/StatusPill';
import { TagId } from '../../../library/kit/TagId';
import type { Tone } from '../../../library/kit/tones';
import { TrendLine } from '../../../library/kit/TrendLine';
import type { LookId } from '../../../library/looks/looks';
import { LookScope } from '../../../library/looks/LookScope';
import { ALARMS, SENSORS, findAsset, type Sensor } from '../../data/plant';
import { formatAgo, formatTime, makeSeries, makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './sensors-and-tags.tsx?raw';

function sensorsTagsFind(id: string): Sensor {
  const sensor = SENSORS.find((candidate) => candidate.id === id);
  if (!sensor) throw new Error(`Unknown sensor ${id}`);
  return sensor;
}

const sensorsTagsLimits = (sensor: Sensor): TagLimits => ({
  low: sensor.lowLimit > sensor.rangeMin ? sensor.lowLimit : undefined,
  high: sensor.highLimit,
  highHigh: sensor.highHighLimit,
});

const sensorsTagsTrend = (sensor: Sensor, points = 24): number[] => {
  const values = makeValues({ seed: sensor.seed, points, base: sensor.value * 0.985, amplitude: (sensor.highLimit - sensor.lowLimit) * 0.05, noise: (sensor.highLimit - sensor.lowLimit) * 0.02, cycles: 1.4, decimals: sensor.decimals });
  return [...values.slice(0, -1), sensor.value];
};

const sensorsTagsRow = (sensor: Sensor) => ({
  tag: sensor.tag,
  name: sensor.name,
  value: sensor.value,
  unit: sensor.unit,
  decimals: sensor.decimals,
  limits: sensorsTagsLimits(sensor),
  range: [sensor.rangeMin, sensor.rangeMax] as const,
  quality: sensor.quality,
  trend: sensorsTagsTrend(sensor),
});

const SENSORS_TAGS_PRESSURE = sensorsTagsFind('pt-92531');

const SENSORS_TAGS_SUCTION = sensorsTagsFind('pt-92530');

const SENSORS_TAGS_TEMPERATURE = sensorsTagsFind('tt-92532');

const SENSORS_TAGS_VIBRATION = sensorsTagsFind('vt-92540');

const SENSORS_TAGS_COOLER = sensorsTagsFind('tt-91141');

const SENSORS_TAGS_BEARING = sensorsTagsFind('tt-40015');

const SENSORS_TAGS_LEVEL = sensorsTagsFind('lt-10012');

const SENSORS_TAGS_COMPRESSOR = SENSORS.filter((sensor) => sensor.assetId === '23-ka-9101');

const SENSORS_TAGS_HOURS = makeSeries({ seed: 5, points: 25, base: 0 }).map((point) => formatTime(point.t));

const SENSORS_TAGS_PRESSURE_DAY = sensorsTagsTrend(SENSORS_TAGS_PRESSURE, 25);

const SENSORS_TAGS_SUCTION_DAY = sensorsTagsTrend(SENSORS_TAGS_SUCTION, 25);

const SENSORS_TAGS_VIBRATION_DAY = [...makeValues({ seed: 14, points: 24, base: 5.6, amplitude: 0.5, noise: 0.2, drift: 1.4, cycles: 1.2, decimals: 1 }), 6.8];

const SENSORS_TAGS_QUALITY_ICON: Record<TagQuality, ReactNode> = {
  good: <IconCircleCheck />,
  uncertain: <IconAlertTriangle />,
  bad: <IconCircleX />,
  stale: <IconCloudOff />,
};

const SENSORS_TAGS_QUALITY_ROWS: Array<{ quality: TagQuality; meaning: string; shown: string; count: number }> = [
  { quality: 'good', meaning: 'Transmitter healthy, value inside its range', shown: 'Value judged against limits', count: 1184 },
  { quality: 'uncertain', meaning: 'Value held, substituted or outside calibration', shown: 'Value shown with a warning, still judged', count: 37 },
  { quality: 'bad', meaning: 'Open loop, failed transmitter or comms error', shown: 'Dash in place of the value, no judgement', count: 9 },
  { quality: 'stale', meaning: 'No update within three scan periods', shown: 'Last value greyed with its age', count: 14 },
];

const SENSORS_TAGS_QUALITY_COLUMNS: DataTableColumn<(typeof SENSORS_TAGS_QUALITY_ROWS)[number]>[] = [
  {
    id: 'quality',
    header: 'Quality',
    nowrap: true,
    cell: (row) => (
      <StatusPill tone={qualityStatus(row.quality).tone} icon={SENSORS_TAGS_QUALITY_ICON[row.quality]}>
        {qualityStatus(row.quality).word}
      </StatusPill>
    ),
  },
  { id: 'meaning', header: 'What the source says', cell: (row) => row.meaning },
  { id: 'shown', header: 'How the value is shown', cell: (row) => row.shown },
  { id: 'count', header: 'Tags now', numeric: true, cell: (row) => row.count.toLocaleString('en-GB') },
];

/** One sheet of the page: a look scope with its canvas. Without a look it follows the app's look. */
function SensorsTagsSheet({ look, children }: { look?: LookId; children: ReactNode }) {
  const canvas = <Canvas className="h-full">{children}</Canvas>;
  return look ? (
    <LookScope look={look} className="h-full w-full">
      {canvas}
    </LookScope>
  ) : (
    <div className="h-full w-full">{canvas}</div>
  );
}

function SensorsTagsPart({ part, meaning, tone }: { part: string; meaning: string; tone: Tone }) {
  return (
    <div data-tone={tone} className="flex min-w-0 flex-1 flex-col items-center gap-2">
      <span className="w-full py-3 text-center text-3xl font-semibold tabular-nums" style={{ background: 'var(--t-soft)', color: 'var(--t-on-soft)', borderRadius: 'var(--kit-radius-sm)' }}>
        {part}
      </span>
      <span className="text-center text-sm text-(--kit-text-2)">{meaning}</span>
    </div>
  );
}

function SensorsAndTagsAnatomy() {
  const parts = parseTag(SENSORS_TAGS_PRESSURE.tag);
  return (
    <SensorsTagsSheet>
      <Grid>
        <Panel className="col-span-7" title="How a tag reads" subtitle="Area, measured variable and function, loop number">
          <div className="flex flex-1 items-start gap-3">
            <SensorsTagsPart part={parts?.area ?? ''} meaning="Area 23, gas compression" tone="blue" />
            <SensorsTagsPart part={parts?.func ?? ''} meaning="Pressure transmitter" tone="teal" />
            <SensorsTagsPart part={parts?.loop ?? ''} meaning="Loop on the 1st stage discharge" tone="purple" />
          </div>
        </Panel>
        <Panel className="col-span-5" title="Showing a tag" subtitle="Readable sans with tabular figures, never monospace">
          <ul>
            <ListRow title="Plain, in tables and metadata" trailing={<TagId>23-PT-92531</TagId>} />
            <ListRow title="Chip, inside a sentence" trailing={<TagId variant="chip">23-PT-92531</TagId>} />
            <ListRow title="With copy, where people paste it elsewhere" trailing={<span className="flex items-center gap-2"><TagId variant="chip">23-PT-92531</TagId><CopyButton text="23-PT-92531" size="sm" variant="ghost" iconOnly label="Copy tag" /></span>} />
          </ul>
        </Panel>
        <Panel className="col-span-12" title="Tags in a sentence">
          <p className="text-base leading-7 text-(--kit-text)">
            Discharge temperature <TagId variant="chip">23-TT-92532</TagId> rose to 146.3 °C at 13:22 while suction pressure <TagId variant="chip">23-PT-92530</TagId> held at 12.4 barg, so the rise follows the cooler <TagId variant="chip">23-TT-91141</TagId> and not the load.
          </p>
        </Panel>
      </Grid>
    </SensorsTagsSheet>
  );
}

function SensorsAndTagsCards() {
  return (
    <SensorsTagsSheet>
      <Grid>
        <TagCard className="col-span-4" {...sensorsTagsRow(SENSORS_TAGS_PRESSURE)} asset="1st stage compressor" caption="93 % of the high limit, steady for 6 h" />
        <TagCard className="col-span-4" {...sensorsTagsRow(SENSORS_TAGS_VIBRATION)} asset="1st stage compressor" caption="96 % of the high limit, rising 0.2 mm/s per day" />
        <TagCard className="col-span-4" {...sensorsTagsRow(SENSORS_TAGS_BEARING)} asset="Cooling water pump" caption="Transmitter fault since 05:02" actions={<Button variant="outline" size="sm">Open work order WO-104479</Button>} />
      </Grid>
    </SensorsTagsSheet>
  );
}

function SensorsAndTagsRows() {
  return (
    <SensorsTagsSheet>
      <Panel title="1st stage compressor" subtitle="23-KA-9101 · six tags, live" padding="tight" actions={<StatusPill tone="warning">2 near limit</StatusPill>}>
        <ul className="[&>li:first-child]:border-t-0!">
          {SENSORS_TAGS_COMPRESSOR.map((sensor) => (
            <TagValueRow key={sensor.id} {...sensorsTagsRow(sensor)} />
          ))}
        </ul>
      </Panel>
    </SensorsTagsSheet>
  );
}

function SensorsAndTagsQuality() {
  return (
    <SensorsTagsSheet>
      <Grid>
        <Panel className="col-span-12" title="Signal quality" subtitle="Four states, each with a word, an icon and a rule for the value" padding="none">
          <DataTable label="Signal quality states" flush columns={SENSORS_TAGS_QUALITY_COLUMNS} rows={SENSORS_TAGS_QUALITY_ROWS} rowKey={(row) => row.quality} />
        </Panel>
        <Panel className="col-span-12" title="The same four states in a list" subtitle="Cooling and utility tags" padding="tight">
          <ul className="[&>li:first-child]:border-t-0!">
            <TagValueRow {...sensorsTagsRow(SENSORS_TAGS_LEVEL)} />
            <TagValueRow {...sensorsTagsRow(SENSORS_TAGS_COOLER)} age="Held value, calibration overdue" />
            <TagValueRow {...sensorsTagsRow(SENSORS_TAGS_BEARING)} age="No update for 9 h" />
            <TagValueRow {...sensorsTagsRow(sensorsTagsFind('it-20013'))} quality="stale" age="14 min old" />
          </ul>
        </Panel>
      </Grid>
    </SensorsTagsSheet>
  );
}

function SensorsAndTagsLimitScales() {
  return (
    <SensorsTagsSheet>
      <Grid>
        {[SENSORS_TAGS_PRESSURE, SENSORS_TAGS_VIBRATION, { ...SENSORS_TAGS_TEMPERATURE, value: 146.3 }].map((sensor) => {
          const judgement = judgeValue(sensor.value, sensorsTagsLimits(sensor));
          return (
            <Panel key={sensor.id} className="col-span-4" title={sensor.name} subtitle={sensor.tag} actions={<StatusPill tone={judgement.tone}>{judgement.word}</StatusPill>}>
              <LimitScale label={`${sensor.name} on its range`} value={sensor.value} min={sensor.rangeMin} max={sensor.rangeMax} unit={sensor.unit} decimals={sensor.decimals} limits={sensorsTagsLimits(sensor)} flag />
            </Panel>
          );
        })}
      </Grid>
    </SensorsTagsSheet>
  );
}

function sensorsTagsNumber(text: string, fallback: number): number {
  const parsed = Number(text);
  return text.trim() !== '' && Number.isFinite(parsed) ? parsed : fallback;
}

function SensorsAndTagsLimitEditor() {
  const [low, setLow] = useState('40');
  const [high, setHigh] = useState('52');
  const [trip, setTrip] = useState('55');
  const limits: TagLimits = { low: sensorsTagsNumber(low, 40), high: sensorsTagsNumber(high, 52), highHigh: sensorsTagsNumber(trip, 55) };
  const ordered = (limits.low ?? 0) < (limits.high ?? 0) && (limits.high ?? 0) < (limits.highHigh ?? 0);
  const inside = Math.round(shareInside(SENSORS_TAGS_PRESSURE_DAY, limits) * 100);
  return (
    <SensorsTagsSheet>
      <Grid>
        <Panel
          className="col-span-5"
          title="Edit limits"
          subtitle="23-PT-92531, discharge pressure, barg"
          footer={
            <div className="flex w-full items-center justify-between gap-3">
              <span className="text-sm text-(--kit-text-2)">{ordered ? 'Changes need approval from the process engineer.' : 'Limits must rise from low to high to trip.'}</span>
              <Button size="sm" disabled={!ordered}>
                Request change
              </Button>
            </div>
          }
        >
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="sensors-tags-low">Low</Label>
              <Input id="sensors-tags-low" inputMode="decimal" value={low} onChange={(event) => setLow(event.target.value)} />
            </div>
            <div>
              <Label htmlFor="sensors-tags-high">High</Label>
              <Input id="sensors-tags-high" inputMode="decimal" value={high} onChange={(event) => setHigh(event.target.value)} />
            </div>
            <div>
              <Label htmlFor="sensors-tags-trip">Trip</Label>
              <Input id="sensors-tags-trip" inputMode="decimal" value={trip} onChange={(event) => setTrip(event.target.value)} />
            </div>
          </div>
        </Panel>
        <Panel className="col-span-7" title="Preview" subtitle="How the last 24 hours would have been judged">
          <div className="flex flex-1 flex-col justify-between gap-6">
            <LimitScale label="Discharge pressure with the edited limits" value={SENSORS_TAGS_PRESSURE.value} min={0} max={60} unit="barg" limits={limits} flag />
            <div className="grid grid-cols-3 gap-4">
              <Stat variant="plain" label="Inside limits" value={inside} unit="%" target="Of 25 hourly samples" tone={inside >= 95 ? 'success' : 'warning'} />
              <Stat variant="plain" label="Window width" value={(limits.high ?? 0) - (limits.low ?? 0)} decimals={1} unit="barg" target="Was 12.0 barg" />
              <Stat variant="plain" label="Margin to trip" value={(limits.highHigh ?? 0) - SENSORS_TAGS_PRESSURE.value} decimals={1} unit="barg" target="From the live value" />
            </div>
          </div>
        </Panel>
      </Grid>
    </SensorsTagsSheet>
  );
}

function SensorsAndTagsDeviation() {
  const setpoint = 47;
  const deviation = SENSORS_TAGS_PRESSURE.value - setpoint;
  return (
    <SensorsTagsSheet>
      <Grid>
        <Panel className="col-span-4" title="Deviation from setpoint" subtitle="23-PC-92531, discharge pressure control">
          <div className="flex flex-1 flex-col justify-between gap-5">
            <Stat variant="plain" size="lg" label="Process value" value={SENSORS_TAGS_PRESSURE.value} decimals={1} unit="barg" delta={{ value: deviation, decimals: 1, unit: ' barg', caption: 'above setpoint 47.0', good: 'none' }} />
            <LimitScale label="Process value and setpoint" value={SENSORS_TAGS_PRESSURE.value} min={0} max={60} unit="barg" limits={sensorsTagsLimits(SENSORS_TAGS_PRESSURE)} setpoint={setpoint} />
            <Meter label="Controller output" value={72} max={100} unit="%" tone="accent" hideScale />
          </div>
        </Panel>
        <Panel className="col-span-8" title="Process value against setpoint" subtitle="Last 24 hours, with the allowed deviation band of ±2 barg">
          <TrendLine
            label="Discharge pressure against setpoint"
            labels={SENSORS_TAGS_HOURS}
            unit="barg"
            decimals={1}
            height={250}
            yDomain={[42, 54]}
            bands={[{ from: 45, to: 49, tone: 'success' }]}
            limits={[{ value: 52, label: 'High', tone: 'critical' }]}
            series={[
              { id: 'pv', label: 'Process value', values: SENSORS_TAGS_PRESSURE_DAY, tone: 'accent' },
              { id: 'sp', label: 'Setpoint', values: SENSORS_TAGS_PRESSURE_DAY.map(() => setpoint), tone: 'neutral', dashed: true },
            ]}
          />
        </Panel>
      </Grid>
    </SensorsTagsSheet>
  );
}

const SENSORS_TAGS_UNITS = ['barg', 'psi', 'kPa'] as const;

function SensorsAndTagsCalculated() {
  const [unit, setUnit] = useState<string>('barg');
  const ratio = (SENSORS_TAGS_PRESSURE.value + 1.013) / (SENSORS_TAGS_SUCTION.value + 1.013);
  const decimals = unit === 'barg' ? 1 : 0;
  return (
    <SensorsTagsSheet>
      <Grid>
        <Panel className="col-span-7" title="Calculated tag" subtitle="23-PR-92531X, compression ratio" icon={<IconChip tone="purple"><IconMathFunction /></IconChip>} actions={<StatusPill tone="success">Inputs good</StatusPill>}>
          <div className="flex flex-1 flex-col justify-between gap-5">
            <div className="flex flex-wrap items-center gap-2 rounded-(--kit-radius-sm) bg-(--kit-well) p-4 text-base text-(--kit-text)">
              <span>(</span>
              <TagId variant="chip">23-PT-92531</TagId>
              <span>+ 1.013 ) ÷ (</span>
              <TagId variant="chip">23-PT-92530</TagId>
              <span>+ 1.013 )</span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Stat variant="plain" size="lg" label="Compression ratio" value={ratio} decimals={2} target="Design 3.60 to 3.90" />
              <Stat variant="plain" label="Discharge" value={SENSORS_TAGS_PRESSURE.value} decimals={1} unit="barg" target="Good, live" />
              <Stat variant="plain" label="Suction" value={SENSORS_TAGS_SUCTION.value} decimals={1} unit="barg" target="Good, live" />
            </div>
          </div>
        </Panel>
        <Panel
          className="col-span-5"
          title="Unit conversion"
          subtitle="Stored in barg, shown in the unit you pick"
          actions={
            <SegmentedControl value={unit} onValueChange={(next) => setUnit(String(next))}>
              <SegmentedControlList size="small" aria-label="Pressure unit">
                {SENSORS_TAGS_UNITS.map((option) => (
                  <SegmentedControlButton key={option} value={option}>
                    {option}
                  </SegmentedControlButton>
                ))}
              </SegmentedControlList>
            </SegmentedControl>
          }
        >
          <div className="flex flex-1 flex-col justify-between gap-5">
            <Stat variant="plain" size="lg" label="Discharge pressure" value={convertPressure(SENSORS_TAGS_PRESSURE.value, 'barg', unit)} decimals={decimals} unit={unit} target={`High limit ${convertPressure(52, 'barg', unit).toFixed(decimals)} ${unit}`} />
            <LimitScale
              label="Discharge pressure in the chosen unit"
              value={convertPressure(SENSORS_TAGS_PRESSURE.value, 'barg', unit)}
              min={0}
              max={convertPressure(60, 'barg', unit)}
              unit={unit}
              decimals={decimals}
              limits={{ low: convertPressure(40, 'barg', unit), high: convertPressure(52, 'barg', unit), highHigh: convertPressure(55, 'barg', unit) }}
            />
          </div>
        </Panel>
      </Grid>
    </SensorsTagsSheet>
  );
}

function SensorsAndTagsCompare() {
  return (
    <SensorsTagsSheet>
      <Grid>
        <Panel className="col-span-8" title="Two tags compared" subtitle="Discharge and suction pressure, last 24 hours">
          <TrendLine
            label="Discharge and suction pressure"
            labels={SENSORS_TAGS_HOURS}
            unit="barg"
            decimals={1}
            height={260}
            yDomain={[0, 60]}
            limits={[{ value: 52, label: 'High', tone: 'critical' }]}
            series={[
              { id: 'discharge', label: '23-PT-92531 discharge', values: SENSORS_TAGS_PRESSURE_DAY, tone: 'blue' },
              { id: 'suction', label: '23-PT-92530 suction', values: SENSORS_TAGS_SUCTION_DAY, tone: 'teal' },
            ]}
          />
        </Panel>
        <div className="col-span-4 grid grid-rows-2 gap-(--kit-gap)">
          <Stat tone="blue" icon={<IconGauge />} label="Discharge pressure" value={SENSORS_TAGS_PRESSURE.value} decimals={1} unit="barg" target="23-PT-92531 · high 52.0" sparkline={SENSORS_TAGS_PRESSURE_DAY} />
          <Stat tone="teal" icon={<IconGauge />} label="Suction pressure" value={SENSORS_TAGS_SUCTION.value} decimals={1} unit="barg" target="23-PT-92530 · high 15.0" sparkline={SENSORS_TAGS_SUCTION_DAY} />
        </div>
      </Grid>
    </SensorsTagsSheet>
  );
}

function SensorsAndTagsPicker() {
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState<string[]>(['pt-92531', 'tt-92532']);
  const matches = SENSORS.filter((sensor) => `${sensor.tag} ${sensor.name}`.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 7);
  const toggle = (id: string, checked: boolean) => setPicked((current) => (checked ? [...current.filter((item) => item !== id), id] : current.filter((item) => item !== id)));
  return (
    <SensorsTagsSheet>
      <Grid>
        <Panel className="col-span-7" title="Add tags to the chart" subtitle={`${matches.length} of ${SENSORS.length} tags match`}>
          <div className="flex flex-col gap-3">
            <Search aria-label="Search tags" placeholder="Search by tag or name" value={query} onChange={(event) => setQuery(event.target.value)} onClear={() => setQuery('')} />
            <ul className="flex flex-col">
              {matches.map((sensor) => (
                <li key={sensor.id} className="flex items-center justify-between gap-4 py-2" style={{ borderTop: '1px solid var(--kit-rule)' }}>
                  <CheckboxItem>
                    <CheckboxItemControl checked={picked.includes(sensor.id)} onCheckedChange={(checked) => toggle(sensor.id, checked === true)} />
                    <CheckboxItemLabel>{sensor.name}</CheckboxItemLabel>
                  </CheckboxItem>
                  <span className="flex items-center gap-3">
                    <span className="text-sm text-(--kit-text-2)">{findAsset(sensor.assetId)?.name}</span>
                    <TagId variant="chip">{sensor.tag}</TagId>
                  </span>
                </li>
              ))}
              {matches.length === 0 ? <li className="py-6 text-center text-sm text-(--kit-text-2)">No tag matches. Try the loop number or part of the name.</li> : null}
            </ul>
          </div>
        </Panel>
        <Panel
          className="col-span-5"
          title="Selected"
          subtitle={`${picked.length} ${picked.length === 1 ? 'tag' : 'tags'}, up to 8 on one chart`}
          footer={
            <div className="flex w-full items-center justify-between gap-3">
              <Button variant="ghost" size="sm" onClick={() => setPicked([])} disabled={picked.length === 0}>
                Clear
              </Button>
              <Button size="sm" disabled={picked.length === 0}>
                Add to chart
              </Button>
            </div>
          }
        >
          {picked.length === 0 ? (
            <p className="flex flex-1 items-center justify-center text-sm text-(--kit-text-2)">Tick a tag on the left to add it here.</p>
          ) : (
            <ul>
              {picked.map((id) => {
                const sensor = sensorsTagsFind(id);
                return (
                  <ListRow
                    key={id}
                    title={sensor.name}
                    meta={<TagId>{sensor.tag}</TagId>}
                    trailing={
                      <Button variant="ghost" size="sm" onClick={() => toggle(id, false)}>
                        Remove
                      </Button>
                    }
                  />
                );
              })}
            </ul>
          )}
        </Panel>
      </Grid>
    </SensorsTagsSheet>
  );
}

function SensorsAndTagsPinned() {
  const [pinned, setPinned] = useState<string[]>(['vt-92540', 'tt-92532']);
  const toggle = (id: string) => setPinned((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  const ordered = [...SENSORS_TAGS_COMPRESSOR.filter((sensor) => pinned.includes(sensor.id)), ...SENSORS_TAGS_COMPRESSOR.filter((sensor) => !pinned.includes(sensor.id))];
  return (
    <SensorsTagsSheet>
      <Panel title="Watch list" subtitle={`${pinned.length} pinned to the top, the rest in tag order`} padding="tight">
        <ul className="[&>li:first-child]:border-t-0!">
          {ordered.map((sensor) => {
            const isPinned = pinned.includes(sensor.id);
            return (
              <TagValueRow
                key={sensor.id}
                {...sensorsTagsRow(sensor)}
                compact
                leading={
                  <Button variant="ghost" size="sm" aria-label={isPinned ? `Unpin ${sensor.name}` : `Pin ${sensor.name}`} aria-pressed={isPinned} onClick={() => toggle(sensor.id)}>
                    {isPinned ? <IconPinFilled /> : <IconPin />}
                  </Button>
                }
              />
            );
          })}
        </ul>
      </Panel>
    </SensorsTagsSheet>
  );
}

const SENSORS_TAGS_TABLE_COLUMNS: DataTableColumn<Sensor>[] = [
  { id: 'tag', header: 'Tag', nowrap: true, cell: (sensor) => <TagId>{sensor.tag}</TagId> },
  { id: 'name', header: 'Name', cell: (sensor) => sensor.name },
  { id: 'asset', header: 'Asset', cell: (sensor) => findAsset(sensor.assetId)?.name ?? '' },
  { id: 'value', header: 'Value', numeric: true, nowrap: true, cell: (sensor) => (sensor.quality === 'bad' ? '—' : `${sensor.value.toLocaleString('en-GB', { minimumFractionDigits: sensor.decimals, maximumFractionDigits: sensor.decimals })} ${sensor.unit}`) },
  { id: 'low', header: 'Low', numeric: true, muted: true, cell: (sensor) => sensor.lowLimit.toLocaleString('en-GB') },
  { id: 'high', header: 'High', numeric: true, muted: true, cell: (sensor) => sensor.highLimit.toLocaleString('en-GB') },
  { id: 'trip', header: 'Trip', numeric: true, muted: true, cell: (sensor) => sensor.highHighLimit?.toLocaleString('en-GB') ?? '—' },
  {
    id: 'state',
    header: 'State',
    nowrap: true,
    cell: (sensor) => {
      const judgement = sensor.quality === 'good' ? judgeValue(sensor.value, sensorsTagsLimits(sensor)) : { tone: qualityStatus(sensor.quality).tone, word: `${qualityStatus(sensor.quality).word} signal` };
      return <StatusPill tone={judgement.tone}>{judgement.word}</StatusPill>;
    },
  },
];

function sensorsTagsTableTone(sensor: Sensor): Tone | undefined {
  const tone = sensor.quality === 'good' ? judgeValue(sensor.value, sensorsTagsLimits(sensor)).tone : qualityStatus(sensor.quality).tone;
  return tone === 'success' ? undefined : tone;
}

function SensorsAndTagsTable() {
  return (
    <SensorsTagsSheet>
      <Panel title="Tags with limits" subtitle="Nordkapp plant, 12 of 1 244 tags" padding="none" actions={<Button variant="outline" size="sm">Export limits</Button>}>
        <DataTable label="Tags with limits" flush columns={SENSORS_TAGS_TABLE_COLUMNS} rows={SENSORS} rowKey={(sensor) => sensor.id} rowTone={sensorsTagsTableTone} />
      </Panel>
    </SensorsTagsSheet>
  );
}

function SensorsAndTagsConsole() {
  return (
    <SensorsTagsSheet look="console">
      <Grid>
        <StatGroup className="col-span-12" columns={4} label="Tag health">
          <Stat variant="plain" size="lg" label="Tags scanned" value="1 244" tone="success" state="Live" target="Scan period 1 s" />
          <Stat variant="plain" size="lg" label="Near a limit" value={2} tone="warning" state="Watch" target="Both on 23-KA-9101" />
          <Stat variant="plain" size="lg" label="Bad quality" value={9} tone="critical" state="Bad" target="1 on a critical loop" />
          <Stat variant="plain" size="lg" label="Stale" value={14} tone="neutral" state="Stale" target="Gateway NK-GW-03" />
        </StatGroup>
        <Panel className="col-span-12" title="Live values" subtitle="Compression and utilities" padding="none">
          <ul className="[&>li:first-child]:border-t-0! [&>li]:px-4">
            {[...SENSORS_TAGS_COMPRESSOR.slice(0, 4), SENSORS_TAGS_COOLER, SENSORS_TAGS_BEARING].map((sensor) => (
              <TagValueRow key={sensor.id} {...sensorsTagsRow(sensor)} />
            ))}
          </ul>
        </Panel>
      </Grid>
    </SensorsTagsSheet>
  );
}

function SensorsAndTagsPoster() {
  return (
    <SensorsTagsSheet look="poster">
      <Grid>
        <Stat className="col-span-4" size="lg" tone="blue" label="Discharge pressure" value={48.6} decimals={1} unit="barg" target="23-PT-92531 · high 52.0" />
        <Stat className="col-span-4" size="lg" tone="amber" label="Discharge temperature" value={141.2} decimals={1} unit="°C" target="23-TT-92532 · high 145.0" />
        <Stat className="col-span-4" size="lg" tone="pink" label="Drive-end vibration" value={6.8} decimals={1} unit="mm/s" target="23-VT-92540 · high 7.1" />
        <Panel className="col-span-12" title="Against limits">
          <div className="grid grid-cols-3 gap-8">
            {[SENSORS_TAGS_PRESSURE, SENSORS_TAGS_TEMPERATURE, SENSORS_TAGS_VIBRATION].map((sensor) => (
              <LimitScale key={sensor.id} label={`${sensor.name} against limits`} value={sensor.value} min={sensor.rangeMin} max={sensor.rangeMax} unit={sensor.unit} limits={sensorsTagsLimits(sensor)} />
            ))}
          </div>
        </Panel>
      </Grid>
    </SensorsTagsSheet>
  );
}

function SensorsAndTagsGlass() {
  return (
    <SensorsTagsSheet look="glass">
      <Grid>
        {[SENSORS_TAGS_PRESSURE, SENSORS_TAGS_TEMPERATURE, SENSORS_TAGS_VIBRATION, SENSORS_TAGS_LEVEL].map((sensor) => {
          const judgement = judgeValue(sensor.value, sensorsTagsLimits(sensor));
          return (
            <Panel key={sensor.id} className="col-span-3" title={sensor.name} subtitle={sensor.tag}>
              <div className="flex flex-1 flex-col items-center gap-3">
                <RingGauge label={sensor.name} hideLabel value={sensor.value} min={sensor.rangeMin} max={sensor.rangeMax} unit={sensor.unit} decimals={sensor.decimals} tone={judgement.tone === 'success' ? 'accent' : judgement.tone} size={150} />
                <StatusPill tone={judgement.tone}>{judgement.word}</StatusPill>
                <SparkLine values={sensorsTagsTrend(sensor)} label={`${sensor.name}, last 24 hours`} tone={judgement.tone === 'success' ? 'accent' : judgement.tone} />
              </div>
            </Panel>
          );
        })}
      </Grid>
    </SensorsTagsSheet>
  );
}

const SENSORS_TAGS_DATASHEET: Array<[string, string]> = [
  ['Service', '1st stage compressor discharge'],
  ['Instrument', 'Pressure transmitter, 4–20 mA HART'],
  ['Calibrated range', '0 to 60 barg'],
  ['Accuracy', '±0.075 % of span'],
  ['Process connection', '½ in NPT, 2-valve manifold'],
  ['Last calibration', '14 January 2026, as found +0.04 barg'],
];

function SensorsAndTagsBlueprint() {
  return (
    <SensorsTagsSheet look="blueprint">
      <Grid>
        <Panel className="col-span-7" title="Instrument data sheet" subtitle="23-PT-92531 · rev C · sheet 1 of 1">
          <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 text-sm">
            {SENSORS_TAGS_DATASHEET.map(([term, detail]) => (
              <div key={term} className="col-span-2 grid grid-cols-subgrid border-b py-2 last:border-b-0" style={{ borderColor: 'var(--kit-rule)' }}>
                <dt className="text-(--kit-text-2)">{term}</dt>
                <dd className="font-medium text-(--kit-text)">{detail}</dd>
              </div>
            ))}
          </dl>
        </Panel>
        <Panel className="col-span-5" title="Alarm and trip settings" subtitle="Dimensions in barg">
          <div className="flex flex-1 flex-col justify-between gap-6">
            <LimitScale label="Discharge pressure settings" value={SENSORS_TAGS_PRESSURE.value} min={0} max={60} unit="barg" limits={sensorsTagsLimits(SENSORS_TAGS_PRESSURE)} flag />
            <LimitScale label="Suction pressure settings" value={SENSORS_TAGS_SUCTION.value} min={0} max={20} unit="barg" limits={sensorsTagsLimits(SENSORS_TAGS_SUCTION)} flag />
            <p className="text-sm text-(--kit-text-2)">Hatched zones are outside the operating window. The marker shows the reading at 14:00.</p>
          </div>
        </Panel>
      </Grid>
    </SensorsTagsSheet>
  );
}

function SensorsAndTagsSignal() {
  return (
    <SensorsTagsSheet look="signal">
      <Grid>
        <TagCard className="col-span-3" {...sensorsTagsRow(SENSORS_TAGS_PRESSURE)} trend={undefined} />
        <TagCard className="col-span-3" {...sensorsTagsRow({ ...SENSORS_TAGS_TEMPERATURE, value: 146.3 })} trend={undefined} />
        <TagCard className="col-span-3" {...sensorsTagsRow(SENSORS_TAGS_VIBRATION)} trend={undefined} />
        <TagCard className="col-span-3" {...sensorsTagsRow(SENSORS_TAGS_BEARING)} trend={undefined} />
      </Grid>
    </SensorsTagsSheet>
  );
}

const SENSORS_TAGS_VIBRATION_ALARMS = ALARMS.filter((alarm) => alarm.assetId === '23-ka-9101');

function SensorsAndTagsDetail() {
  return (
    <SensorsTagsSheet look="studio">
      <Grid>
        <div className="col-span-12 flex flex-wrap items-center gap-4">
          <IconChip tone="warning" size="lg">
            <IconWaveSine />
          </IconChip>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 text-sm font-medium text-(--kit-text-2)">
              <TagId variant="chip">23-VT-92540</TagId> 1st stage compressor · gas compression
            </p>
            <h3 className="text-2xl font-semibold text-(--kit-text)">Drive-end vibration</h3>
          </div>
          <StatusPill tone="warning" size="lg" icon={<IconAlertTriangle />}>
            Near limit
          </StatusPill>
          <CopyButton text="23-VT-92540" size="sm" variant="outline" label="Copy tag" />
          <Button size="sm">Add to chart</Button>
        </div>
        <Stat className="col-span-4" size="hero" emphasis="strong" icon={<IconActivity />} label="Live value" value={6.8} decimals={1} unit="mm/s" delta={{ value: 1.2, decimals: 1, unit: 'mm/s', caption: 'in 24 h', good: 'down' }} target="96 % of the high limit 7.1" sparkline={SENSORS_TAGS_VIBRATION_DAY} />
        <Panel className="col-span-8" title="Last 24 hours" subtitle="Hourly average with alarm and trip limits">
          <TrendLine
            label="Drive-end vibration, last 24 hours"
            labels={SENSORS_TAGS_HOURS}
            unit="mm/s"
            decimals={1}
            height={230}
            yDomain={[0, 12]}
            limits={[
              { value: 7.1, label: 'High', tone: 'warning' },
              { value: 11, label: 'Trip', tone: 'critical' },
            ]}
            series={[{ id: 'vibration', label: 'Drive-end vibration', values: SENSORS_TAGS_VIBRATION_DAY, tone: 'warning' }]}
          />
        </Panel>
        <Panel className="col-span-4" title="Position on range" subtitle="0 to 15 mm/s RMS">
          <div className="flex flex-1 flex-col justify-between gap-5">
            <LimitScale label="Drive-end vibration on its range" value={6.8} min={0} max={15} unit="mm/s" limits={{ high: 7.1, highHigh: 11 }} flag />
            <Meter label="Time above 6.5 mm/s today" value={38} max={100} unit="%" tone="warning" hideScale />
          </div>
        </Panel>
        <Panel className="col-span-4" title="Source" subtitle="Quality good, scanned every second" padding="tight">
          <ul>
            <ListRow title="Transmitter" meta="Accelerometer, 100 mV/g, drive-end bearing housing" />
            <ListRow title="Last calibration" meta="3 February 2026, within tolerance" />
            <ListRow title="Historian" meta="1 s raw, 1 min and 1 h aggregates" />
          </ul>
        </Panel>
        <Panel className="col-span-4" title="Alarms on this asset" subtitle="Open and acknowledged" padding="tight">
          <ul>
            {SENSORS_TAGS_VIBRATION_ALARMS.map((alarm) => (
              <ListRow key={alarm.id} tone={alarm.severity === 'high' ? 'warning' : 'info'} title={alarm.message} meta={<><TagId>{alarm.sensorTag}</TagId><span>{alarm.value} · limit {alarm.limit}</span></>} trailing={formatAgo(alarm.raisedAt)} />
            ))}
            <ListRow title="Vibration survey planned" meta="WO-104466, due 14 March, unassigned" />
          </ul>
        </Panel>
      </Grid>
    </SensorsTagsSheet>
  );
}

function SensorsAndTagsAssetPanel() {
  return (
    <SensorsTagsSheet look="studio">
      <Grid>
        <SectionHeader className="col-span-12" title="1st stage compressor" description="23-KA-9101 · running · health 72 of 100" actions={<Button variant="outline" size="sm">Open asset</Button>} />
        <TagCard className="col-span-4" {...sensorsTagsRow(SENSORS_TAGS_PRESSURE)} caption="93 % of the high limit" />
        <TagCard className="col-span-4" {...sensorsTagsRow(SENSORS_TAGS_TEMPERATURE)} caption="97 % of the high limit" />
        <TagCard className="col-span-4" {...sensorsTagsRow(SENSORS_TAGS_VIBRATION)} caption="96 % of the high limit" />
        <Panel className="col-span-8" title="Other tags" subtitle="Inside limits" padding="tight">
          <ul className="[&>li:first-child]:border-t-0!">
            {SENSORS_TAGS_COMPRESSOR.filter((sensor) => !['pt-92531', 'tt-92532', 'vt-92540'].includes(sensor.id)).map((sensor) => (
              <TagValueRow key={sensor.id} {...sensorsTagsRow(sensor)} compact />
            ))}
          </ul>
        </Panel>
        <Panel className="col-span-4" title="Signal quality" subtitle="Six tags on this asset" icon={<IconChip tone="teal"><IconTemperature /></IconChip>}>
          <div className="flex flex-1 flex-col justify-between gap-4">
            <Meter size="lg" label="Good quality" value={6} max={6} tone="success" hideScale />
            <Meter label="Inside limits" value={4} max={6} tone="warning" hideScale />
            <p className="text-sm text-(--kit-text-2)">Two tags are within 5 % of their high limit. Both follow the fouled interstage cooler.</p>
          </div>
        </Panel>
      </Grid>
    </SensorsTagsSheet>
  );
}

export default definePage({
  id: 'sensors-and-tags',
  title: 'Sensors and tags',
  summary:
    'Tag ids, live values, limits and signal quality. A tag is always a readable id with a name, a figure with its unit, where that figure stands against its limits, and whether the signal can be trusted. The same parts are shown as cards, rows and tables, and in five looks.',
  guidance: {
    use: [
      'Show the tag id in the UI sans with tabular figures, next to a human name.',
      'Judge a value against its limits in words: normal, near limit, above limit.',
      'Replace the figure with a dash when the signal is bad, and say how old a stale value is.',
      'Draw limits on the instrument range so the margin is visible, not only the number.',
    ],
    avoid: [
      'Monospace tag ids and 11 px grey captions.',
      'A value without its unit, or limits without the range they sit on.',
      'Judging a bad or stale value against limits as if it were live.',
      'Colour as the only sign that a tag is near or above a limit.',
    ],
  },
  source,
  sections: [
    {
      id: 'tags',
      title: 'Tags and values',
      description: 'The id, the card, the row and the quality of the signal.',
      specimens: [
        {
          id: 'SensorsAndTagsAnatomy',
          title: 'Tag anatomy',
          note: 'Explain the tag scheme once and use the plain and chip forms consistently after that.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/TagId.tsx', 'kit/sensors-and-tags/tags.ts', 'actions/CopyButton.tsx', 'kit/Panel.tsx'],
          Component: SensorsAndTagsAnatomy,
        },
        {
          id: 'SensorsAndTagsCards',
          title: 'Tag cards',
          note: 'Use a card when a handful of tags matter and each needs its figure, trend and limits.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/sensors-and-tags/TagCard.tsx', 'kit/sensors-and-tags/LimitScale.tsx', 'kit/SparkLine.tsx'],
          Component: SensorsAndTagsCards,
        },
        {
          id: 'SensorsAndTagsRows',
          title: 'Tag rows',
          note: 'Use rows with aligned columns when all tags of an asset are read top to bottom.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/sensors-and-tags/TagValueRow.tsx', 'kit/Panel.tsx'],
          Component: SensorsAndTagsRows,
        },
        {
          id: 'SensorsAndTagsQuality',
          title: 'Signal quality states',
          note: 'Decide how good, uncertain, bad and stale values are shown before building any list.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/sensors-and-tags/tags.ts', 'kit/sensors-and-tags/TagValueRow.tsx', 'kit/DataTable.tsx'],
          Component: SensorsAndTagsQuality,
        },
      ],
    },
    {
      id: 'limits',
      title: 'Limits and derived values',
      description: 'Where a value stands, how limits are edited, and values computed from other tags.',
      specimens: [
        {
          id: 'SensorsAndTagsLimitScales',
          title: 'Limit scale',
          note: 'Show the reading on its range with the limit zones when the margin matters more than the number.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/sensors-and-tags/LimitScale.tsx', 'kit/sensors-and-tags/tags.ts'],
          Component: SensorsAndTagsLimitScales,
        },
        {
          id: 'SensorsAndTagsLimitEditor',
          title: 'Limit editor',
          note: 'Preview edited limits against recent data so nobody sets a limit that would alarm all day.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/sensors-and-tags/LimitScale.tsx', 'kit/sensors-and-tags/tags.ts', 'kit/Stat.tsx'],
          Component: SensorsAndTagsLimitEditor,
        },
        {
          id: 'SensorsAndTagsDeviation',
          title: 'Deviation from setpoint',
          note: 'Pair the process value with its setpoint and allowed band for controlled loops.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/sensors-and-tags/LimitScale.tsx', 'kit/TrendLine.tsx', 'kit/Stat.tsx', 'kit/Meter.tsx'],
          Component: SensorsAndTagsDeviation,
        },
        {
          id: 'SensorsAndTagsCalculated',
          title: 'Calculated tag and unit conversion',
          note: 'Show the formula with its input tags, and convert units at display time rather than in the data.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/TagId.tsx', 'kit/sensors-and-tags/tags.ts', 'kit/sensors-and-tags/LimitScale.tsx', 'kit/Stat.tsx'],
          Component: SensorsAndTagsCalculated,
        },
        {
          id: 'SensorsAndTagsCompare',
          title: 'Two tags compared',
          note: 'Plot related tags on one axis when the relationship between them is the question.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/TrendLine.tsx', 'kit/Stat.tsx'],
          Component: SensorsAndTagsCompare,
        },
      ],
    },
    {
      id: 'lists',
      title: 'Lists and selection',
      description: 'Finding, picking, pinning and tabulating tags.',
      specimens: [
        {
          id: 'SensorsAndTagsPicker',
          title: 'Tag picker',
          note: 'Search by id or name and keep the selection visible while people keep searching.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/Panel.tsx', 'kit/ListRow.tsx', 'kit/TagId.tsx'],
          Component: SensorsAndTagsPicker,
        },
        {
          id: 'SensorsAndTagsPinned',
          title: 'Pinned watch list',
          note: 'Let operators pin the tags they are watching this shift to the top of a list.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/sensors-and-tags/TagValueRow.tsx', 'kit/Panel.tsx'],
          Component: SensorsAndTagsPinned,
        },
        {
          id: 'SensorsAndTagsTable',
          title: 'Tag table with limits',
          note: 'Use the table for engineers who audit limits across many tags at once.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/DataTable.tsx', 'kit/sensors-and-tags/tags.ts', 'kit/TagId.tsx'],
          Component: SensorsAndTagsTable,
        },
      ],
    },
    {
      id: 'looks',
      title: 'The same parts in other looks',
      description: 'Edge-barred rows on a console, solid readouts on a poster, ring gauges on glass, dimensioned scales on a drawing, state-filled tiles on a wall.',
      specimens: [
        {
          id: 'SensorsAndTagsConsole',
          title: 'Console: live value board',
          note: 'Pick the console look for the control room, where dense rows are scanned all shift.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/sensors-and-tags/TagValueRow.tsx', 'kit/StatGroup.tsx', 'looks/LookScope.tsx'],
          Component: SensorsAndTagsConsole,
        },
        {
          id: 'SensorsAndTagsPoster',
          title: 'Poster: block readouts',
          note: 'Pick the poster look when three figures must be read from across a workshop.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/Stat.tsx', 'kit/sensors-and-tags/LimitScale.tsx', 'looks/LookScope.tsx'],
          Component: SensorsAndTagsPoster,
        },
        {
          id: 'SensorsAndTagsGlass',
          title: 'Glass: ring gauges',
          note: 'Pick the glass look for a presentation screen where each tag is a glowing dial.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/RingGauge.tsx', 'kit/SparkLine.tsx', 'kit/sensors-and-tags/tags.ts', 'looks/LookScope.tsx'],
          Component: SensorsAndTagsGlass,
        },
        {
          id: 'SensorsAndTagsBlueprint',
          title: 'Blueprint: instrument data sheet',
          note: 'Pick the blueprint look for instrument documentation with settings drawn as dimensioned scales.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/sensors-and-tags/LimitScale.tsx', 'kit/Panel.tsx', 'looks/LookScope.tsx'],
          Component: SensorsAndTagsBlueprint,
        },
        {
          id: 'SensorsAndTagsSignal',
          title: 'Signal: state-filled tag tiles',
          note: 'Pick the signal look for a wall screen where the tile colour is the message.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/sensors-and-tags/TagCard.tsx', 'looks/LookScope.tsx'],
          Component: SensorsAndTagsSignal,
        },
      ],
    },
    {
      id: 'in-use',
      title: 'In use',
      description: 'Compositions that could be dropped into a product.',
      specimens: [
        {
          id: 'SensorsAndTagsDetail',
          title: 'Tag detail page',
          note: 'Use as the page behind any tag: live value, trend with limits, position on range, source and alarms.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/Stat.tsx', 'kit/TrendLine.tsx', 'kit/sensors-and-tags/LimitScale.tsx', 'kit/ListRow.tsx', 'looks/LookScope.tsx'],
          Component: SensorsAndTagsDetail,
        },
        {
          id: 'SensorsAndTagsAssetPanel',
          title: 'Asset tag panel',
          note: 'Use on an asset page: the tags that need attention as cards, the rest as compact rows.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/sensors-and-tags/TagCard.tsx', 'kit/sensors-and-tags/TagValueRow.tsx', 'kit/Meter.tsx', 'looks/LookScope.tsx'],
          Component: SensorsAndTagsAssetPanel,
        },
      ],
    },
  ],
});
