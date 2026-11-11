import { Button } from '@cognite/aura/components/button';
import { IconAlertOctagon, IconAlertTriangle, IconCircleCheck, IconDroplet, IconGauge, IconPlugConnectedX, IconRefresh } from '@cognite/aura/icons';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { Canvas } from '../../../library/kit/Canvas';
import { DataTable, type DataTableColumn } from '../../../library/kit/DataTable';
import { BandScale } from '../../../library/kit/gauges-and-meters/BandScale';
import { BlockGauge } from '../../../library/kit/gauges-and-meters/BlockGauge';
import { DialGauge, type DialZone } from '../../../library/kit/gauges-and-meters/DialGauge';
import { LevelTank, type LevelMark } from '../../../library/kit/gauges-and-meters/LevelTank';
import { limitState, limitTone, limitWord, type Limits } from '../../../library/kit/gauges-and-meters/limits';
import { Grid } from '../../../library/kit/Grid';
import { IconChip } from '../../../library/kit/IconChip';
import { Legend } from '../../../library/kit/Legend';
import { ListRow } from '../../../library/kit/ListRow';
import { Meter } from '../../../library/kit/Meter';
import { Panel } from '../../../library/kit/Panel';
import { RingGauge } from '../../../library/kit/RingGauge';
import { SparkLine } from '../../../library/kit/SparkLine';
import { Stat } from '../../../library/kit/Stat';
import { StatusPill } from '../../../library/kit/StatusPill';
import { TagId } from '../../../library/kit/TagId';
import type { Tone } from '../../../library/kit/tones';
import { LookScope } from '../../../library/looks/LookScope';
import { PLANT_KPIS, SENSORS, WORK_ORDERS, childrenOf, type Asset, type Sensor } from '../../data/plant';
import { makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './gauges-and-meters.tsx?raw';

const GAUGE_TRAIN = SENSORS.filter((sensor) => ['pt-92531', 'tt-92532', 'vt-92540', 'st-92501'].includes(sensor.id));

const GAUGE_PRESSURE = GAUGE_TRAIN[0];

const GAUGE_TEMPERATURE = GAUGE_TRAIN[1];

const GAUGE_VIBRATION = GAUGE_TRAIN[2];

const GAUGE_SPEED = GAUGE_TRAIN[3];

const GAUGE_LIVE = SENSORS.filter((sensor) => sensor.quality !== 'bad');

const GAUGE_AREAS = childrenOf('nk');

const GAUGE_HEALTH_TONE: Record<Asset['health'], Tone> = { good: 'success', watch: 'warning', poor: 'critical' };

const GAUGE_HEALTH_LABEL: Record<Asset['health'], string> = { good: 'Good', watch: 'Watch', poor: 'Poor' };

const GAUGE_VESSELS = [
  { id: '20-VA-1001', name: 'Inlet separator', level: 54.3 },
  { id: '20-VA-1002', name: 'Test separator', level: 31.5 },
  { id: '23-VA-9105', name: 'Suction scrubber', level: 73.8 },
  { id: '23-VA-9115', name: 'Interstage scrubber', level: 88.2 },
  { id: '27-TA-2010', name: 'Condensate tank', level: 46.0 },
];

const GAUGE_LEVEL_LIMITS: Limits = { low: 30, high: 70, trip: 85 };

const GAUGE_LEVEL_MARKS: readonly LevelMark[] = [
  { value: 85, label: 'Trip 85', tone: 'critical' },
  { value: 70, label: 'High 70', tone: 'warning' },
  { value: 30, label: 'Low 30', tone: 'info' },
];

const GAUGE_DONE_ORDERS = WORK_ORDERS.filter((order) => order.status === 'done').length;

function gaugeLimits(sensor: Sensor): Limits {
  return { low: sensor.lowLimit, high: sensor.highLimit, trip: sensor.highHighLimit };
}

function gaugeZones(sensor: Sensor): DialZone[] {
  if (sensor.highHighLimit === undefined) return [{ from: sensor.highLimit, to: sensor.rangeMax, tone: 'warning' }];
  return [
    { from: sensor.highLimit, to: sensor.highHighLimit, tone: 'warning' },
    { from: sensor.highHighLimit, to: sensor.rangeMax, tone: 'critical' },
  ];
}

function GaugeStateIcon({ tone }: { tone: Tone }) {
  if (tone === 'critical') return <IconAlertOctagon aria-hidden="true" />;
  if (tone === 'warning') return <IconAlertTriangle aria-hidden="true" />;
  return <IconCircleCheck aria-hidden="true" />;
}

function GaugeStatePill({ sensor, value = sensor.value }: { sensor: Sensor; value?: number }) {
  const tone = limitTone(value, gaugeLimits(sensor));
  return (
    <StatusPill tone={tone} icon={<GaugeStateIcon tone={tone} />}>
      {limitWord(value, gaugeLimits(sensor))}
    </StatusPill>
  );
}

function GaugeDial({
  sensor,
  value = sensor.value,
  size = 168,
  ticks,
  variant,
  zones = true,
  pill = true,
}: {
  sensor: Sensor;
  value?: number;
  size?: number;
  ticks?: number;
  variant?: 'arc' | 'needle';
  zones?: boolean;
  pill?: boolean;
}) {
  return (
    <DialGauge
      label={sensor.name}
      value={value}
      min={sensor.rangeMin}
      max={sensor.rangeMax}
      unit={sensor.unit}
      decimals={sensor.decimals}
      zones={zones ? gaugeZones(sensor) : []}
      tone={limitTone(value, gaugeLimits(sensor))}
      size={size}
      ticks={ticks}
      variant={variant}
      caption={pill ? <GaugeStatePill sensor={sensor} value={value} /> : undefined}
    />
  );
}

function GaugeMeter({ sensor, size }: { sensor: Sensor; size?: 'md' | 'lg' }) {
  const tone = limitTone(sensor.value, gaugeLimits(sensor));
  return (
    <Meter
      label={sensor.name}
      value={sensor.value}
      min={sensor.rangeMin}
      max={sensor.rangeMax}
      unit={sensor.unit}
      decimals={sensor.decimals}
      low={sensor.lowLimit > sensor.rangeMin ? sensor.lowLimit : undefined}
      high={sensor.highLimit}
      target={{ value: sensor.highLimit, label: 'High limit' }}
      tone={tone === 'success' ? 'accent' : tone}
      size={size}
    />
  );
}

function GaugeBand({ sensor, compact }: { sensor: Sensor; compact?: boolean }) {
  return (
    <BandScale
      label={sensor.name}
      value={sensor.value}
      min={sensor.rangeMin}
      max={sensor.rangeMax}
      unit={sensor.unit}
      decimals={sensor.decimals}
      low={sensor.lowLimit}
      high={sensor.highLimit}
      trip={sensor.highHighLimit}
      tone={limitTone(sensor.value, gaugeLimits(sensor))}
      compact={compact}
    />
  );
}

function GaugeBlocks({ sensor, size, orientation }: { sensor: Sensor; size?: 'md' | 'lg'; orientation?: 'horizontal' | 'vertical' }) {
  return (
    <BlockGauge
      label={sensor.name}
      value={sensor.value}
      min={sensor.rangeMin}
      max={sensor.rangeMax}
      unit={sensor.unit}
      decimals={sensor.decimals}
      high={sensor.highLimit}
      trip={sensor.highHighLimit}
      tone="success"
      size={size}
      orientation={orientation}
    />
  );
}

function GaugeTank({ vessel, height, marks = true }: { vessel: (typeof GAUGE_VESSELS)[number]; height?: number; marks?: boolean }) {
  return (
    <LevelTank
      label={vessel.name}
      caption={vessel.id}
      value={vessel.level}
      decimals={1}
      marks={marks ? GAUGE_LEVEL_MARKS : []}
      tone={limitState(vessel.level, GAUGE_LEVEL_LIMITS) === 'normal' ? 'info' : limitTone(vessel.level, GAUGE_LEVEL_LIMITS)}
      height={height}
    />
  );
}

function GaugeLivePill() {
  return (
    <StatusPill tone="success" icon={<IconCircleCheck aria-hidden="true" />}>
      Live
    </StatusPill>
  );
}

function GaugeSheet({ title, subtitle, actions, footer, children }: { title: string; subtitle: string; actions?: ReactNode; footer?: ReactNode; children: ReactNode }) {
  return (
    <Canvas>
      <Panel title={title} subtitle={subtitle} actions={actions} footer={footer}>
        {children}
      </Panel>
    </Canvas>
  );
}

function GaugeDialTrain() {
  return (
    <GaugeSheet title="1st stage compressor" subtitle="23-KA-9101 · four readings against their limits" actions={<GaugeLivePill />}>
      <div className="grid grid-cols-4 items-start justify-items-center gap-6">
        {GAUGE_TRAIN.map((sensor) => (
          <GaugeDial key={sensor.id} sensor={sensor} size={184} />
        ))}
      </div>
    </GaugeSheet>
  );
}

function GaugeDialStates() {
  return (
    <GaugeSheet title="Drive-end vibration" subtitle="The same dial as the reading climbs through its limits">
      <div className="grid grid-cols-5 items-start justify-items-center gap-4">
        {[3.4, 6.8, 8.9, 11.6].map((value) => (
          <GaugeDial key={value} sensor={GAUGE_VIBRATION} value={value} size={150} />
        ))}
        <DialGauge
          label={GAUGE_VIBRATION.name}
          value={null}
          max={GAUGE_VIBRATION.rangeMax}
          unit={GAUGE_VIBRATION.unit}
          zones={gaugeZones(GAUGE_VIBRATION)}
          size={150}
          caption={
            <StatusPill tone="neutral" icon={<IconPlugConnectedX aria-hidden="true" />}>
              No data
            </StatusPill>
          }
        />
      </div>
    </GaugeSheet>
  );
}

function GaugeDialSizes() {
  return (
    <GaugeSheet title="Discharge pressure" subtitle="Three sizes: in a row, in a card, as the hero of a panel">
      <div className="flex items-end justify-around gap-6">
        <GaugeDial sensor={GAUGE_PRESSURE} size={112} zones={false} pill={false} />
        <GaugeDial sensor={GAUGE_PRESSURE} size={160} pill={false} />
        <GaugeDial sensor={GAUGE_PRESSURE} size={232} ticks={7} />
      </div>
    </GaugeSheet>
  );
}

function GaugeDialNeedle() {
  return (
    <GaugeSheet title="Needle on a zoned scale" subtitle="The limits are the scale; the needle says where the reading is on it">
      <div className="grid grid-cols-3 items-start justify-items-center gap-6">
        <GaugeDial sensor={GAUGE_PRESSURE} variant="needle" size={200} ticks={7} />
        <GaugeDial sensor={GAUGE_TEMPERATURE} variant="needle" size={200} ticks={7} />
        <GaugeDial sensor={GAUGE_VIBRATION} variant="needle" size={200} ticks={6} />
      </div>
    </GaugeSheet>
  );
}

function GaugeDialSetpoint() {
  const [setpoint, setSetpoint] = useState(46);
  return (
    <GaugeSheet
      title="Pressure controller"
      subtitle="23-PIC-92531 · reading against its setpoint"
      footer={<span>The dark mark on the scale is the setpoint; the arc is the reading.</span>}
    >
      <div className="flex items-center justify-around gap-6">
        <DialGauge
          label="Discharge pressure"
          value={GAUGE_PRESSURE.value}
          max={GAUGE_PRESSURE.rangeMax}
          unit="barg"
          decimals={1}
          zones={gaugeZones(GAUGE_PRESSURE)}
          setpoint={setpoint}
          tone={Math.abs(GAUGE_PRESSURE.value - setpoint) > 3 ? 'warning' : 'success'}
          size={200}
          ticks={7}
        />
        <div className="flex flex-col gap-4">
          <Stat variant="plain" size="md" label="Setpoint" value={setpoint} decimals={1} unit="barg" />
          <Stat variant="plain" size="sm" label="Deviation" value={GAUGE_PRESSURE.value - setpoint} decimals={1} unit="barg" />
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setSetpoint((current) => Math.max(40, current - 1))}>
              Lower
            </Button>
            <Button variant="outline" size="sm" onClick={() => setSetpoint((current) => Math.min(52, current + 1))}>
              Raise
            </Button>
          </div>
        </div>
      </div>
    </GaugeSheet>
  );
}

function GaugeMeterStack() {
  return (
    <GaugeSheet title="Compressor readings" subtitle="Bars with the high limit marked and the out-of-range zones shaded" actions={<GaugeLivePill />}>
      <div className="flex flex-col gap-6">
        {GAUGE_TRAIN.map((sensor) => (
          <GaugeMeter key={sensor.id} sensor={sensor} />
        ))}
        <Legend
          items={[
            { label: 'Reading', tone: 'accent' },
            { label: 'Near or above a limit', tone: 'warning' },
          ]}
        />
      </div>
    </GaugeSheet>
  );
}

function GaugeBandScales() {
  return (
    <GaugeSheet title="Operating bands" subtitle="A pointer on the scale; the band is where it should stay">
      <div className="flex flex-col gap-6">
        {[GAUGE_PRESSURE, GAUGE_TEMPERATURE, GAUGE_VIBRATION].map((sensor) => (
          <div key={sensor.id} className="grid grid-cols-[minmax(0,1fr)_7.5rem] items-center gap-5">
            <GaugeBand sensor={sensor} />
            <div className="flex justify-end">
              <GaugeStatePill sensor={sensor} />
            </div>
          </div>
        ))}
      </div>
    </GaugeSheet>
  );
}

function GaugeBlockBars() {
  return (
    <GaugeSheet title="Bargraphs" subtitle="Lit blocks take the colour of the zone they reach">
      <div className="flex flex-col gap-6">
        <GaugeBlocks sensor={GAUGE_PRESSURE} size="lg" />
        <GaugeBlocks sensor={GAUGE_TEMPERATURE} />
        <BlockGauge label="Recompressor vibration" value={11.6} max={15} unit="mm/s" decimals={1} high={7.1} trip={11} tone="success" />
      </div>
    </GaugeSheet>
  );
}

function GaugeBlockLadders() {
  return (
    <GaugeSheet title="Train at a glance" subtitle="Ladders side by side: the tall or red one is the one to look at">
      <div className="grid grid-cols-6 items-end justify-items-center gap-3">
        {GAUGE_LIVE.slice(0, 4).map((sensor) => (
          <GaugeBlocks key={sensor.id} sensor={sensor} orientation="vertical" />
        ))}
        <BlockGauge label="Recompressor vibration" value={11.6} max={15} unit="mm/s" decimals={1} high={7.1} trip={11} tone="success" orientation="vertical" />
        <GaugeBlocks sensor={GAUGE_LIVE[10]} orientation="vertical" />
      </div>
    </GaugeSheet>
  );
}

function GaugeLevelRow() {
  return (
    <GaugeSheet title="Vessel levels" subtitle="Inlet and compression · low, high and trip lines on every vessel" actions={<GaugeLivePill />}>
      <div className="grid grid-cols-5 items-end justify-items-center gap-4">
        {GAUGE_VESSELS.map((vessel) => (
          <GaugeTank key={vessel.id} vessel={vessel} height={180} />
        ))}
      </div>
    </GaugeSheet>
  );
}

function GaugeLevelDrum() {
  return (
    <GaugeSheet title="Inlet separator" subtitle="20-VA-1001 · a lying vessel with its readings beside it">
      <div className="flex items-center justify-between gap-6">
        <LevelTank label="Liquid level" caption="20-LT-10012" value={54.3} decimals={1} shape="drum" height={132} marks={GAUGE_LEVEL_MARKS} tone="info" />
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <GaugeMeter sensor={SENSORS[7]} />
          <Meter label="Level" value={54.3} max={100} unit="%" decimals={1} low={30} high={70} target={{ value: 50, label: 'Setpoint' }} />
        </div>
      </div>
    </GaugeSheet>
  );
}

function GaugeRings() {
  return (
    <GaugeSheet title="Shares of a whole" subtitle="Rings for scores and progress, never for a value with limits">
      <div className="grid grid-cols-4 items-start justify-items-center gap-4">
        <RingGauge label="Availability" value={PLANT_KPIS.availability.value} decimals={1} tone="teal" size={132} />
        <RingGauge label="OEE" value={PLANT_KPIS.oee.value} decimals={1} tone="blue" size={132} />
        <RingGauge label="Orders closed" value={GAUGE_DONE_ORDERS} max={WORK_ORDERS.length} unit={`of ${WORK_ORDERS.length}`} tone="purple" size={132} />
        <RingGauge label="Days to record" value={PLANT_KPIS.daysSinceIncident.value} max={PLANT_KPIS.daysSinceIncident.target} unit="days" tone="success" size={132} />
      </div>
    </GaugeSheet>
  );
}

function GaugeRingRows() {
  return (
    <GaugeSheet title="Area health" subtitle="A small ring leads each row; the pill says what the score means">
      <ul className="flex flex-col">
        {GAUGE_AREAS.map((area) => (
          <ListRow
            key={area.id}
            leading={<RingGauge hideLabel label={`${area.name} health`} value={area.healthScore} unit="" size={52} tone={GAUGE_HEALTH_TONE[area.health]} />}
            title={area.name}
            meta={<TagId>{area.tag}</TagId>}
            trailing={<StatusPill tone={GAUGE_HEALTH_TONE[area.health]}>{GAUGE_HEALTH_LABEL[area.health]}</StatusPill>}
          />
        ))}
      </ul>
    </GaugeSheet>
  );
}

function GaugeLookGlass() {
  return (
    <LookScope look="glass">
      <Canvas>
        <Grid>
          <Panel className="col-span-8" title="Compression train" subtitle="1st stage compressor, live" actions={<GaugeLivePill />}>
            <div className="grid flex-1 grid-cols-4 items-center justify-items-center gap-4">
              {GAUGE_TRAIN.map((sensor) => (
                <GaugeDial key={sensor.id} sensor={sensor} size={156} />
              ))}
            </div>
          </Panel>
          <Panel className="col-span-4" title="Area health" subtitle="Condition score per area">
            <div className="grid flex-1 grid-cols-2 items-center justify-items-center gap-4">
              {GAUGE_AREAS.map((area) => (
                <RingGauge key={area.id} label={area.name} value={area.healthScore} unit="" size={96} tone={GAUGE_HEALTH_TONE[area.health]} />
              ))}
            </div>
          </Panel>
        </Grid>
      </Canvas>
    </LookScope>
  );
}

function GaugeLookPoster() {
  return (
    <LookScope look="poster">
      <Canvas>
        <Grid>
          <Stat className="col-span-4" size="hero" tone="amber" label="Drive-end vibration" value={GAUGE_VIBRATION.value} decimals={1} unit="mm/s" target="0.3 under the 7.1 limit" />
          <Panel className="col-span-8" title="How close to the limit" subtitle="Each block is one twenty-fourth of the range">
            <div className="flex flex-1 flex-col justify-between gap-5">
              <GaugeBlocks sensor={GAUGE_VIBRATION} size="lg" />
              <GaugeBlocks sensor={GAUGE_TEMPERATURE} size="lg" />
              <GaugeBlocks sensor={GAUGE_PRESSURE} size="lg" />
            </div>
          </Panel>
        </Grid>
      </Canvas>
    </LookScope>
  );
}

function GaugeLookBlueprint() {
  return (
    <LookScope look="blueprint">
      <Canvas>
        <Grid>
          <Panel className="col-span-7" title="Operating envelope" subtitle="23-KA-9101 · bands dimensioned in engineering units">
            <div className="flex flex-1 flex-col justify-between gap-5">
              {[GAUGE_PRESSURE, GAUGE_TEMPERATURE, GAUGE_VIBRATION].map((sensor) => (
                <GaugeBand key={sensor.id} sensor={sensor} />
              ))}
            </div>
          </Panel>
          <Panel className="col-span-5" title="Instrument faces" subtitle="Needle on a ticked scale">
            <div className="grid flex-1 grid-cols-2 items-center justify-items-center gap-4">
              <GaugeDial sensor={GAUGE_PRESSURE} size={208} ticks={5} />
              <GaugeDial sensor={GAUGE_SPEED} size={208} ticks={5} />
            </div>
          </Panel>
        </Grid>
      </Canvas>
    </LookScope>
  );
}

function GaugeLookSignal() {
  return (
    <LookScope look="signal">
      <Canvas>
        <Grid>
          {[GAUGE_PRESSURE, GAUGE_TEMPERATURE, GAUGE_VIBRATION].map((sensor) => {
            const tone = limitTone(sensor.value, gaugeLimits(sensor));
            return (
              <Stat
                key={sensor.id}
                className="col-span-3"
                size="lg"
                tone={tone}
                label={sensor.name}
                state={limitWord(sensor.value, gaugeLimits(sensor))}
                stateIcon={<GaugeStateIcon tone={tone} />}
                value={sensor.value}
                decimals={sensor.decimals}
                unit={sensor.unit}
                target={`High limit ${sensor.highLimit}`}
              />
            );
          })}
          <Stat
            className="col-span-3"
            size="lg"
            tone="critical"
            label="Recompressor vibration"
            state="Trip"
            stateIcon={<IconAlertOctagon aria-hidden="true" />}
            value={11.6}
            decimals={1}
            unit="mm/s"
            target="Trip limit 11"
          />
        </Grid>
      </Canvas>
    </LookScope>
  );
}

function GaugeLookConsole() {
  return (
    <LookScope look="console">
      <Canvas>
        <Grid>
          <Panel className="col-span-5" title="Train bargraphs" subtitle="23-KA-9101">
            <div className="grid flex-1 grid-cols-5 items-end justify-items-center gap-2">
              {GAUGE_LIVE.slice(0, 5).map((sensor) => (
                <GaugeBlocks key={sensor.id} sensor={sensor} orientation="vertical" />
              ))}
            </div>
          </Panel>
          <Panel className="col-span-7" title="Readings" subtitle="Limit zones on the track">
            <div className="flex flex-1 flex-col justify-between gap-4">
              {[GAUGE_PRESSURE, GAUGE_TEMPERATURE, GAUGE_VIBRATION].map((sensor) => (
                <GaugeMeter key={sensor.id} sensor={sensor} size="lg" />
              ))}
            </div>
          </Panel>
        </Grid>
      </Canvas>
    </LookScope>
  );
}

function GaugeLookSoft() {
  return (
    <LookScope look="soft">
      <Canvas>
        <Grid>
          <Panel className="col-span-7" tone="sky" title="Vessel levels" subtitle="Inlet and compression">
            <div className="grid flex-1 grid-cols-4 items-end justify-items-center gap-3">
              {GAUGE_VESSELS.slice(0, 4).map((vessel) => (
                <GaugeTank key={vessel.id} vessel={vessel} height={150} marks={false} />
              ))}
            </div>
          </Panel>
          <Panel className="col-span-5" tone="green" title="Plant scores" subtitle="This week">
            <div className="grid flex-1 grid-cols-2 items-center justify-items-center gap-4">
              <RingGauge label="Availability" value={PLANT_KPIS.availability.value} decimals={1} tone="teal" size={120} />
              <RingGauge label="OEE" value={PLANT_KPIS.oee.value} decimals={1} tone="purple" size={120} />
            </div>
          </Panel>
        </Grid>
      </Canvas>
    </LookScope>
  );
}

function GaugeUseCompressorCard() {
  const [refreshed, setRefreshed] = useState(false);
  return (
    <Canvas>
      <Grid>
        <Panel
          className="col-span-12"
          icon={
            <IconChip tone="blue">
              <IconGauge />
            </IconChip>
          }
          title="1st stage compressor"
          subtitle="23-KA-9101 · Gas compression"
          actions={
            <>
              <StatusPill tone="warning" icon={<IconAlertTriangle aria-hidden="true" />}>
                Watch
              </StatusPill>
              <Button variant="outline" size="sm" onClick={() => setRefreshed(true)}>
                <IconRefresh aria-hidden="true" />
                Refresh
              </Button>
            </>
          }
          footer={<span>{refreshed ? 'Refreshed just now' : 'Updated 14:00 UTC'} · vibration is 0.3 mm/s under its high limit</span>}
        >
          <div className="grid grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)] items-center gap-8">
            <GaugeDial sensor={GAUGE_VIBRATION} size={224} ticks={6} />
            <div className="flex flex-col gap-5">
              <GaugeMeter sensor={GAUGE_PRESSURE} />
              <GaugeMeter sensor={GAUGE_TEMPERATURE} />
              <GaugeMeter sensor={GAUGE_SPEED} />
            </div>
            <div className="flex flex-col gap-4">
              <Stat variant="plain" size="md" label="Health score" value={72} unit="/ 100" delta={{ value: -6, decimals: 0, caption: 'in 30 days' }} />
              <div>
                <p className="mb-1 text-sm font-medium text-(--kit-text-2)">Vibration, last 24 hours</p>
                <SparkLine
                  className="h-16 w-full"
                  label="Drive-end vibration, last 24 hours"
                  tone="warning"
                  values={makeValues({ seed: GAUGE_VIBRATION.seed, points: 24, base: 6.1, amplitude: 0.2, noise: 0.12, drift: 0.7 })}
                />
              </div>
            </div>
          </div>
        </Panel>
      </Grid>
    </Canvas>
  );
}

function GaugeUseVesselBoard() {
  const [selected, setSelected] = useState(GAUGE_VESSELS[3].id);
  const vessel = GAUGE_VESSELS.find((item) => item.id === selected) ?? GAUGE_VESSELS[0];
  const state = limitState(vessel.level, GAUGE_LEVEL_LIMITS);
  const tone = state === 'normal' ? 'success' : limitTone(vessel.level, GAUGE_LEVEL_LIMITS);
  return (
    <LookScope look="console">
      <Canvas>
        <Grid>
          <Panel className="col-span-8" title="Vessel levels" subtitle="Select a vessel">
            <div className="grid flex-1 grid-cols-5 items-end justify-items-center gap-2">
              {GAUGE_VESSELS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={item.id === selected}
                  onClick={() => setSelected(item.id)}
                  className="cursor-pointer p-2 outline-none hover:bg-(--kit-track) focus-visible:ring-2 focus-visible:ring-(--kit-text) aria-pressed:bg-(--kit-track)"
                >
                  <GaugeTank vessel={item} height={150} marks={false} />
                </button>
              ))}
            </div>
          </Panel>
          <Panel className="col-span-4" tone={tone} title={vessel.name} subtitle={vessel.id}>
            <div className="flex flex-1 flex-col justify-between gap-4">
              <div className="flex items-center justify-between gap-3">
                <Stat variant="plain" size="lg" label="Level" value={vessel.level} decimals={1} unit="%" />
                <StatusPill tone={tone} size="lg" icon={<GaugeStateIcon tone={tone} />}>
                  {limitWord(vessel.level, GAUGE_LEVEL_LIMITS)}
                </StatusPill>
              </div>
              <BlockGauge label="Level against limits" value={vessel.level} max={100} unit="%" decimals={1} high={70} trip={85} tone="info" size="lg" />
              <BandScale label="Operating band" value={vessel.level} max={100} unit="%" decimals={1} low={30} high={70} trip={85} tone={tone} />
            </div>
          </Panel>
        </Grid>
      </Canvas>
    </LookScope>
  );
}

const GAUGE_TAG_COLUMNS: readonly DataTableColumn<Sensor>[] = [
  { id: 'tag', header: 'Tag', cell: (sensor) => <TagId>{sensor.tag}</TagId>, nowrap: true },
  { id: 'name', header: 'Measurement', cell: (sensor) => sensor.name },
  { id: 'value', header: 'Value', numeric: true, nowrap: true, cell: (sensor) => `${sensor.value.toLocaleString('en-GB')} ${sensor.unit}` },
  { id: 'band', header: 'Position in operating band', width: 'w-72', cell: (sensor) => <GaugeBand compact sensor={sensor} /> },
  { id: 'state', header: 'State', cell: (sensor) => <GaugeStatePill sensor={sensor} /> },
];

function GaugeUseTagTable() {
  return (
    <Canvas>
      <Panel
        padding="none"
        icon={
          <IconChip tone="teal">
            <IconDroplet />
          </IconChip>
        }
        title="Tags against their bands"
        subtitle={`${GAUGE_LIVE.length} live tags · green stretch is the operating band`}
      >
        <DataTable
          flush
          label="Tags against their operating bands"
          columns={GAUGE_TAG_COLUMNS}
          rows={GAUGE_LIVE.slice(0, 8)}
          rowKey={(sensor) => sensor.id}
          rowTone={(sensor) => (limitState(sensor.value, gaugeLimits(sensor)) === 'normal' ? undefined : limitTone(sensor.value, gaugeLimits(sensor)))}
        />
      </Panel>
    </Canvas>
  );
}

export default definePage({
  id: 'gauges-and-meters',
  title: 'Gauges and meters',
  summary:
    'A single reading placed against its range, limits or target: dials, bargraphs, operating-band scales, vessel levels and rings. They answer "is this where it should be?" faster than a number alone, and each look draws them with its own anatomy.',
  guidance: {
    use: [
      'Use a dial for a few key readings of one machine; use bars or ladders when there are more than four.',
      'Pass the limits and let the gauge decide its colour and state word, so every gauge agrees with the alarm system.',
      'Use a band scale when distance to a limit matters more than distance from zero.',
      'Always print the value and unit; the drawing supports the number, it does not replace it.',
    ],
    avoid: [
      'A dial in every table row; a compact band scale takes a tenth of the space.',
      'A ring for a value with limits; it has no place to show them.',
      'State by colour alone: pair the colour with a word or an icon.',
      'Mixing gauge anatomies on one screen; pick the one the look gives you.',
    ],
  },
  source,
  sections: [
    {
      id: 'dials',
      title: 'Dial gauges',
      description: 'A 270° scale with the value in the middle, limit zones around it and the state underneath.',
      specimens: [
        {
          id: 'GaugeDialTrain',
          title: 'Dials for one machine',
          note: 'Pick it for the three or four readings that say how one machine is doing.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/gauges-and-meters/DialGauge.tsx', 'kit/gauges-and-meters/limits.ts', 'kit/Panel.tsx', 'kit/StatusPill.tsx'],
          Component: GaugeDialTrain,
        },
        {
          id: 'GaugeDialStates',
          title: 'States',
          note: 'Pick the state from the limits: normal, near limit, high, trip and no data each have a colour and a word.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/gauges-and-meters/DialGauge.tsx', 'kit/gauges-and-meters/limits.ts', 'kit/StatusPill.tsx'],
          Component: GaugeDialStates,
        },
        {
          id: 'GaugeDialSizes',
          title: 'Sizes and ticks',
          note: 'Pick the small dial for a row, the medium for a card, and the large one with ticks as the hero of a panel.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/gauges-and-meters/DialGauge.tsx'],
          Component: GaugeDialSizes,
        },
        {
          id: 'GaugeDialSetpoint',
          title: 'With setpoint',
          note: 'Pick it for a controlled value, where the gap between reading and setpoint is the story.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/gauges-and-meters/DialGauge.tsx', 'kit/Stat.tsx'],
          Component: GaugeDialSetpoint,
        },
        {
          id: 'GaugeDialNeedle',
          title: 'Needle on a zoned scale',
          note: 'Pick it when the scale itself should show the limits, as on a physical instrument face.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/gauges-and-meters/DialGauge.tsx'],
          Component: GaugeDialNeedle,
        },
      ],
    },
    {
      id: 'linear',
      title: 'Bars, bands and bargraphs',
      description: 'Straight gauges for lists, tables and anywhere more than four readings sit together.',
      specimens: [
        {
          id: 'GaugeMeterStack',
          title: 'Meters with limits',
          note: 'Pick it for a stack of readings that share a panel; the marker is the high limit.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/Meter.tsx', 'kit/Legend.tsx', 'kit/Panel.tsx'],
          Component: GaugeMeterStack,
        },
        {
          id: 'GaugeBandScales',
          title: 'Operating band scales',
          note: 'Pick it when the reading should stay inside a band and the distance to either edge matters.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/gauges-and-meters/BandScale.tsx', 'kit/StatusPill.tsx'],
          Component: GaugeBandScales,
        },
        {
          id: 'GaugeBlockBars',
          title: 'Bargraphs',
          note: 'Pick it for a control-room feel: the lit end changes colour as the value passes a limit.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/gauges-and-meters/BlockGauge.tsx'],
          Component: GaugeBlockBars,
        },
        {
          id: 'GaugeBlockLadders',
          title: 'Ladders',
          note: 'Pick it to compare many tags of one train at a glance without reading a number.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/gauges-and-meters/BlockGauge.tsx'],
          Component: GaugeBlockLadders,
        },
      ],
    },
    {
      id: 'levels-and-rings',
      title: 'Levels and rings',
      description: 'Vessels drawn with their liquid and limit lines, and rings for shares of a whole.',
      specimens: [
        {
          id: 'GaugeLevelRow',
          title: 'Row of vessels',
          note: 'Pick it for the levels of one area; the vessel over its high line is obvious from across the room.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/gauges-and-meters/LevelTank.tsx', 'kit/Panel.tsx'],
          Component: GaugeLevelRow,
        },
        {
          id: 'GaugeLevelDrum',
          title: 'Lying vessel with readings',
          note: 'Pick it for a separator detail, where level, pressure and setpoint belong together.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/gauges-and-meters/LevelTank.tsx', 'kit/Meter.tsx'],
          Component: GaugeLevelDrum,
        },
        {
          id: 'GaugeRingRows',
          title: 'Rings in a list',
          note: 'Pick it for a short ranked list of scores, such as health per area.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/RingGauge.tsx', 'kit/ListRow.tsx', 'kit/StatusPill.tsx'],
          Component: GaugeRingRows,
        },
        {
          id: 'GaugeRings',
          title: 'Rings',
          note: 'Pick a ring for a percentage, a score or progress towards a goal.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/RingGauge.tsx'],
          Component: GaugeRings,
        },
      ],
    },
    {
      id: 'looks',
      title: 'The same readings in six looks',
      description: 'A look changes the anatomy of a gauge, not only its colour.',
      specimens: [
        {
          id: 'GaugeLookGlass',
          title: 'Glass: glowing arcs and rings',
          note: 'Pick it for a showpiece on a dark display, where thin lit arcs carry the reading.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/gauges-and-meters/DialGauge.tsx', 'kit/RingGauge.tsx', 'looks/LookScope.tsx'],
          Component: GaugeLookGlass,
        },
        {
          id: 'GaugeLookPoster',
          title: 'Poster: block gauges',
          note: 'Pick it for a team screen where one figure and its distance to the limit must land from across the room.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/gauges-and-meters/BlockGauge.tsx', 'kit/Stat.tsx', 'looks/LookScope.tsx'],
          Component: GaugeLookPoster,
        },
        {
          id: 'GaugeLookBlueprint',
          title: 'Blueprint: dimensioned scales',
          note: 'Pick it for engineering documents, where the band is written out as a dimension.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/gauges-and-meters/BandScale.tsx', 'kit/gauges-and-meters/DialGauge.tsx', 'looks/LookScope.tsx'],
          Component: GaugeLookBlueprint,
        },
        {
          id: 'GaugeLookSignal',
          title: 'Signal: state-filled tiles',
          note: 'Pick it for a wall screen: the tile is the gauge and its colour is the state.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/Stat.tsx', 'kit/gauges-and-meters/limits.ts', 'looks/LookScope.tsx'],
          Component: GaugeLookSignal,
        },
        {
          id: 'GaugeLookConsole',
          title: 'Console: ladders and segmented tracks',
          note: 'Pick it for an operator who watches the same train all shift and needs density.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/gauges-and-meters/BlockGauge.tsx', 'kit/Meter.tsx', 'looks/LookScope.tsx'],
          Component: GaugeLookConsole,
        },
        {
          id: 'GaugeLookSoft',
          title: 'Soft: rounded vessels and thick rings',
          note: 'Pick it for a friendly overview aimed at people outside the control room.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/gauges-and-meters/LevelTank.tsx', 'kit/RingGauge.tsx', 'looks/LookScope.tsx'],
          Component: GaugeLookSoft,
        },
      ],
    },
    {
      id: 'in-use',
      title: 'In use',
      description: 'Compositions ready to drop into a product.',
      specimens: [
        {
          id: 'GaugeUseCompressorCard',
          title: 'Compressor card',
          note: 'Pick it as the summary of one machine: the reading that matters as a dial, the rest as bars.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/gauges-and-meters/DialGauge.tsx', 'kit/Meter.tsx', 'kit/Stat.tsx', 'kit/SparkLine.tsx', 'kit/Panel.tsx'],
          Component: GaugeUseCompressorCard,
        },
        {
          id: 'GaugeUseVesselBoard',
          title: 'Vessel board',
          note: 'Pick it for a level overview with detail on demand; select a vessel to read it against its limits.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/gauges-and-meters/LevelTank.tsx', 'kit/gauges-and-meters/BlockGauge.tsx', 'kit/gauges-and-meters/BandScale.tsx', 'looks/LookScope.tsx'],
          Component: GaugeUseVesselBoard,
        },
        {
          id: 'GaugeUseTagTable',
          title: 'Tag table with operating bands',
          note: 'Pick it for many tags: a compact band scale per row shows where each one sits.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/gauges-and-meters/BandScale.tsx', 'kit/DataTable.tsx', 'kit/TagId.tsx'],
          Component: GaugeUseTagTable,
        },
      ],
    },
  ],
});
