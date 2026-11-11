import { Button } from '@cognite/aura/components/button';
import { SegmentedControl, SegmentedControlButton, SegmentedControlList } from '@cognite/aura/components/segmented-control';
import {
  IconAlertOctagon,
  IconAlertTriangle,
  IconChartLine,
  IconCircleCheck,
  IconClockHour4,
  IconCloudOff,
  IconDatabaseOff,
  IconHourglass,
  IconRefresh,
  IconSparkles,
  IconTool,
} from '@cognite/aura/icons';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { Bars } from '../../../library/kit/Bars';
import { Canvas } from '../../../library/kit/Canvas';
import { DataTable, type DataTableColumn } from '../../../library/kit/DataTable';
import { EmptyPanel } from '../../../library/kit/EmptyPanel';
import { ConfidenceMeter } from '../../../library/kit/forecasts-and-predictions/ConfidenceMeter';
import { DriverBars, type Driver } from '../../../library/kit/forecasts-and-predictions/DriverBars';
import { coverage, fan, formatLead, mape, project, stepsToLimit, widen } from '../../../library/kit/forecasts-and-predictions/forecast';
import { ForecastChart } from '../../../library/kit/forecasts-and-predictions/ForecastChart';
import { LifeTimeline } from '../../../library/kit/forecasts-and-predictions/LifeTimeline';
import { Grid } from '../../../library/kit/Grid';
import { IconChip } from '../../../library/kit/IconChip';
import { ListRow } from '../../../library/kit/ListRow';
import { Meter } from '../../../library/kit/Meter';
import { Panel } from '../../../library/kit/Panel';
import { RingGauge } from '../../../library/kit/RingGauge';
import { Stat } from '../../../library/kit/Stat';
import { StatGroup } from '../../../library/kit/StatGroup';
import { StatusPill } from '../../../library/kit/StatusPill';
import { TagId } from '../../../library/kit/TagId';
import type { Tone } from '../../../library/kit/tones';
import { LookScope } from '../../../library/looks/LookScope';
import { ASSETS, PLANT_KPIS } from '../../data/plant';
import { DAY, HOUR, REFERENCE_NOW, formatDate, makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './forecasts-and-predictions.tsx?raw';

const FC_HOUR_LABEL = new Intl.DateTimeFormat('en-GB', { weekday: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });

const FC_VIB_LIMIT = 7.1;

const FC_VIB_HISTORY = [...makeValues({ seed: 14, points: 48, base: 5.86, amplitude: 0.1, noise: 0.05, drift: 0.86, cycles: 2, decimals: 2 }), 6.8];

const FC_VIB_FORECAST = project(FC_VIB_HISTORY, { steps: 36, lookback: 30, amplitude: 0.06, period: 24, decimals: 2 });

const FC_VIB_RANGE = widen(FC_VIB_FORECAST, 0.08, 0.5, 2);

const FC_VIB_LABELS = Array.from({ length: FC_VIB_HISTORY.length + FC_VIB_FORECAST.length }, (_, index) =>
  FC_HOUR_LABEL.format(REFERENCE_NOW + (index - FC_VIB_HISTORY.length + 1) * HOUR)
);

const FC_VIB_CROSS = stepsToLimit(6.8, FC_VIB_FORECAST, FC_VIB_LIMIT) ?? 0;

const FC_VIB_EARLY = stepsToLimit(
  6.8,
  FC_VIB_RANGE.map((span) => span.high),
  FC_VIB_LIMIT
);

const FC_TEMP_HISTORY = makeValues({ seed: 19, points: 25, base: 37.2, amplitude: 1.1, noise: 0.3, drift: 1.2, cycles: 1.5, decimals: 1 });

const FC_TEMP_FORECAST = project(FC_TEMP_HISTORY, { steps: 12, lookback: 16, amplitude: 0.5, period: 16, decimals: 1 });

const FC_TEMP_RANGE = widen(FC_TEMP_FORECAST, 0.4, 1.3, 1);

const FC_TEMP_ACTUAL = makeValues({ seed: 23, points: 12, base: 0.3, noise: 0.45, drift: 1.1, decimals: 1 }).map((offset, index) => Number((FC_TEMP_FORECAST[index] + offset).toFixed(1)));

const FC_TEMP_LABELS = Array.from({ length: 37 }, (_, index) => FC_HOUR_LABEL.format(REFERENCE_NOW + (index - 36) * HOUR));

const FC_TEMP_MAPE = mape(FC_TEMP_ACTUAL, FC_TEMP_FORECAST) ?? 0;

const FC_TEMP_COVERAGE = coverage(FC_TEMP_ACTUAL, FC_TEMP_RANGE) ?? 0;

const FC_EXPORT_HISTORY = [4.46, 4.51, 4.49, 4.53, 4.48, 4.5, 4.44, 4.52, 4.49, 4.55, 4.47, 4.41, 4.21, PLANT_KPIS.gasExport.value];

const FC_EXPORT_FORECAST = [4.4, 4.43, 4.46, 4.48, 4.5, 4.51, 4.52];

const FC_EXPORT_RANGE = widen(FC_EXPORT_FORECAST, 0.03, 0.12, 2);

const FC_EXPORT_LABELS = Array.from({ length: 21 }, (_, index) => formatDate(REFERENCE_NOW + (index - 13) * DAY));

const FC_EXPORT_UP = fan(FC_EXPORT_FORECAST, 0.02, 2);

const FC_EXPORT_DOWN = fan(FC_EXPORT_FORECAST, -0.07, 2);

const FC_WEEK_DAYS = ['Fri 13', 'Sat 14', 'Sun 15', 'Mon 16', 'Tue 17', 'Wed 18', 'Thu 19'];

const FC_ERROR_BY_HORIZON = [1.2, 1.9, 2.6, 3.8, 5.1, 6.9];

const FC_DRIVERS: readonly Driver[] = [
  { label: 'Drive-end vibration', impact: 18, detail: '6.8 mm/s, rising 0.4 a week' },
  { label: 'Discharge temperature', impact: 9, detail: '141.2 °C, 3.8 under the limit' },
  { label: 'Running hours since overhaul', impact: 6, detail: '14,200 h of 16,000 h' },
  { label: 'Lube oil condition', impact: -5, detail: 'Sampled 4 March, clean' },
  { label: 'Starts last 30 days', impact: -2, detail: '1 start, 0 trips' },
];

type FcRisk = { id: string; tag: string; name: string; probability: number; lead: number; confidence: number };

const FC_RISKS: readonly FcRisk[] = [
  { id: '23-ka-9103', tag: '23-KA-9103', name: 'Recompressor', probability: 71, lead: 6, confidence: 88 },
  { id: '23-ka-9101', tag: '23-KA-9101', name: '1st stage compressor', probability: 34, lead: 38, confidence: 82 },
  { id: '23-ha-9114', tag: '23-HA-9114', name: 'Interstage cooler', probability: 27, lead: 44, confidence: 64 },
  { id: '40-pa-4001', tag: '40-PA-4001', name: 'Cooling water pump', probability: 19, lead: 61, confidence: 47 },
  { id: '23-gt-9001', tag: '23-GT-9001', name: 'Compressor gas turbine', probability: 8, lead: 120, confidence: 85 },
];

function fcRiskTone(probability: number): Tone {
  if (probability >= 60) return 'critical';
  return probability >= 25 ? 'warning' : 'success';
}

function fcRiskWord(probability: number): string {
  if (probability >= 60) return 'Act now';
  return probability >= 25 ? 'Plan work' : 'Monitor';
}

function FcRiskIcon({ probability }: { probability: number }) {
  if (probability >= 60) return <IconAlertOctagon aria-hidden="true" />;
  return probability >= 25 ? <IconAlertTriangle aria-hidden="true" /> : <IconCircleCheck aria-hidden="true" />;
}

function FcModelPill() {
  return (
    <StatusPill tone="success" icon={<IconCircleCheck aria-hidden="true" />}>
      Updated 14:00
    </StatusPill>
  );
}

function FcVibrationChart({ height = 300, steps = 36, headline, notes, showLegend }: { height?: number; steps?: number; headline?: ReactNode; notes?: ReactNode; showLegend?: boolean }) {
  return (
    <ForecastChart
      label="Drive-end vibration, last 48 hours and forecast against the high limit"
      labels={FC_VIB_LABELS.slice(0, FC_VIB_HISTORY.length + steps)}
      history={FC_VIB_HISTORY}
      forecast={FC_VIB_FORECAST.slice(0, steps)}
      range={FC_VIB_RANGE.slice(0, steps)}
      rangeLabel="80 % range"
      limit={{ value: FC_VIB_LIMIT, label: 'High limit', tone: 'critical' }}
      crossing={FC_VIB_CROSS <= steps ? { steps: FC_VIB_CROSS, label: `Limit in ${formatLead(FC_VIB_CROSS)}` } : undefined}
      unit="mm/s"
      decimals={1}
      tone="blue"
      yDomain={[5, 9]}
      tickEvery={12}
      height={height}
      headline={headline}
      notes={notes}
      showLegend={showLegend}
    />
  );
}

function FcExportChart({ height = 300, scenarios = false, headline, notes }: { height?: number; scenarios?: boolean; headline?: ReactNode; notes?: ReactNode }) {
  return (
    <ForecastChart
      label="Gas export per day, last two weeks and the next seven days against plan"
      labels={FC_EXPORT_LABELS}
      history={FC_EXPORT_HISTORY}
      forecast={FC_EXPORT_FORECAST}
      range={scenarios ? undefined : FC_EXPORT_RANGE}
      rangeLabel="80 % range"
      forecastLabel={scenarios ? 'Base case' : 'Forecast'}
      scenarios={
        scenarios
          ? [
              { id: 'up', label: 'Recompressor back Saturday', values: FC_EXPORT_UP, tone: 'success' },
              { id: 'down', label: 'Recompressor out all week', values: FC_EXPORT_DOWN, tone: 'warning' },
            ]
          : []
      }
      limit={{ value: PLANT_KPIS.gasExport.target, label: 'Plan', tone: 'neutral' }}
      unit="MSm³/d"
      decimals={2}
      tone="blue"
      tickEvery={3}
      height={height}
      headline={headline}
      notes={notes}
    />
  );
}

function FcSheet({ title, subtitle, actions, footer, icon, children }: { title: string; subtitle: string; actions?: ReactNode; footer?: ReactNode; icon?: ReactNode; children: ReactNode }) {
  return (
    <Canvas>
      <Panel title={title} subtitle={subtitle} actions={actions} footer={footer} icon={icon}>
        {children}
      </Panel>
    </Canvas>
  );
}

function ForecastLineAndRange() {
  return (
    <FcSheet title="Drive-end vibration" subtitle="23-VT-92540 · measured for 48 hours, forecast for the next 36" actions={<FcModelPill />}>
      <FcVibrationChart
        height={320}
        headline={
          <div className="flex items-end gap-6">
            <Stat variant="plain" size="lg" label="Forecast in 24 hours" value={FC_VIB_FORECAST[23]} decimals={1} unit="mm/s" />
            <ConfidenceMeter percent={82} variant="block" detail="48 h of history, similar rise seen 4 times" />
          </div>
        }
      />
    </FcSheet>
  );
}

function ForecastBacktest() {
  return (
    <FcSheet title="Forecast against what happened" subtitle="Cooler outlet temperature · forecast made 12 hours ago">
      <ForecastChart
        label="Cooler outlet temperature: the forecast made 12 hours ago against the actual readings"
        labels={FC_TEMP_LABELS}
        history={FC_TEMP_HISTORY}
        forecast={FC_TEMP_FORECAST}
        range={FC_TEMP_RANGE}
        rangeLabel="80 % range"
        actual={FC_TEMP_ACTUAL}
        historyLabel="Measured then"
        unit="°C"
        tone="purple"
        tickEvery={6}
        height={260}
      />
      <StatGroup columns={3} joined label="Backtest scores" className="mt-4">
        <Stat variant="plain" size="sm" label="Mean error" value={FC_TEMP_MAPE} decimals={1} unit="%" />
        <Stat variant="plain" size="sm" label="Inside the range" value={FC_TEMP_COVERAGE} decimals={0} unit="%" />
        <Stat variant="plain" size="sm" label="Horizon" value="12 h" />
      </StatGroup>
    </FcSheet>
  );
}

function ForecastHorizon() {
  const [horizon, setHorizon] = useState('24');
  const steps = Number(horizon);
  return (
    <FcSheet
      title="Forecast horizon"
      subtitle="The further ahead, the wider the range"
      actions={
        <SegmentedControl value={horizon} onValueChange={(next) => setHorizon(String(next))}>
          <SegmentedControlList size="small" aria-label="Forecast horizon">
            <SegmentedControlButton value="12">12 h</SegmentedControlButton>
            <SegmentedControlButton value="24">24 h</SegmentedControlButton>
            <SegmentedControlButton value="36">36 h</SegmentedControlButton>
          </SegmentedControlList>
        </SegmentedControl>
      }
      footer={
        <span>
          In {horizon} hours: {FC_VIB_FORECAST[steps - 1].toFixed(1)} mm/s, between {FC_VIB_RANGE[steps - 1].low.toFixed(1)} and {FC_VIB_RANGE[steps - 1].high.toFixed(1)}.
        </span>
      }
    >
      <FcVibrationChart height={260} steps={steps} showLegend={false} />
    </FcSheet>
  );
}

function ForecastScenarios() {
  return (
    <FcSheet title="Export outlook by scenario" subtitle="Gas export per day · three cases that fan out from today">
      <FcExportChart
        scenarios
        height={300}
        headline={
          <div className="flex gap-8">
            <Stat variant="plain" size="md" label="Base case, Thursday 19" value={FC_EXPORT_FORECAST[6]} decimals={2} unit="MSm³/d" />
            <Stat variant="plain" size="md" label="Spread between cases" value={FC_EXPORT_UP[6] - FC_EXPORT_DOWN[6]} decimals={2} unit="MSm³/d" />
          </div>
        }
      />
    </FcSheet>
  );
}

function ForecastTimeToLimit() {
  return (
    <Canvas>
      <Grid>
        <Panel className="col-span-8" title="Time to limit" subtitle="Drive-end vibration against the 7.1 mm/s high limit">
          <FcVibrationChart height={300} />
        </Panel>
        <div className="col-span-4 flex flex-col gap-(--kit-gap)">
          <Stat
            size="lg"
            tone="warning"
            emphasis="strong"
            icon={<IconHourglass />}
            label="Reaches the high limit in"
            value={formatLead(FC_VIB_CROSS)}
            target={`Earliest ${formatLead(FC_VIB_EARLY ?? 0)} · 80 % range`}
          />
          <Panel title="What to do before then" className="flex-1">
            <ul className="flex flex-col">
              <ListRow
                leading={
                  <IconChip tone="amber" size="sm">
                    <IconTool />
                  </IconChip>
                }
                title="Vibration survey, 1st stage"
                meta="WO-104466 · open, 4 h"
                trailing={
                  <Button variant="outline" size="sm">
                    Schedule
                  </Button>
                }
              />
              <ListRow
                leading={
                  <IconChip tone="blue" size="sm">
                    <IconClockHour4 />
                  </IconChip>
                }
                title="Next planned stop"
                meta="Saturday 14 March, 06:00"
                trailing={<StatusPill tone="warning">After limit</StatusPill>}
              />
            </ul>
          </Panel>
        </div>
      </Grid>
    </Canvas>
  );
}

function ForecastRemainingLife() {
  return (
    <FcSheet
      title="Remaining useful life"
      subtitle="Drive-end bearing, 23-KA-9101"
      actions={<StatusPill tone="warning">Plan work</StatusPill>}
      footer={<ConfidenceMeter percent={82} detail="Model trained on 14 bearing failures" />}
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-end justify-between gap-4">
          <Stat variant="plain" size="lg" label="Most likely" value={38} unit="days" target="Between 24 and 55 days" />
          <RingGauge label="Life used" value={76} tone="warning" size={96} />
        </div>
        <LifeTimeline
          label="Remaining useful life, drive-end bearing"
          span={90}
          earliest={24}
          likely={38}
          latest={55}
          endLabel="90 d"
          markers={[{ at: 30, label: 'Planned stop', tone: 'info' }]}
        />
      </div>
    </FcSheet>
  );
}

function ForecastFailureRisk() {
  return (
    <FcSheet title="Probability of failure" subtitle="Next 30 days · ranked, with the lead time the model sees">
      <ul className="flex flex-col">
        {FC_RISKS.map((risk) => (
          <ListRow
            key={risk.id}
            tone={fcRiskTone(risk.probability)}
            title={
              <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] items-center gap-4">
                <div>
                  <div>{risk.name}</div>
                  <TagId>{risk.tag}</TagId>
                </div>
                <Meter label="Probability" value={risk.probability} max={100} unit="%" tone={fcRiskTone(risk.probability)} hideScale />
              </div>
            }
            trailing={
              <StatusPill tone={fcRiskTone(risk.probability)} icon={<FcRiskIcon probability={risk.probability} />}>
                {fcRiskWord(risk.probability)}
              </StatusPill>
            }
          />
        ))}
      </ul>
    </FcSheet>
  );
}

function ForecastConfidenceLevels() {
  return (
    <FcSheet title="How far to trust it" subtitle="Confidence is a level with a reason, not a bare percentage">
      <ul className="flex flex-col">
        <ListRow
          title="Drive-end vibration, 36 h"
          meta="Trend model · retrained daily"
          trailing={<ConfidenceMeter percent={86} variant="block" detail="48 h of clean history" />}
        />
        <ListRow
          title="Cooler outlet temperature, 12 h"
          meta="Seasonal model · signal quality uncertain"
          trailing={<ConfidenceMeter percent={64} variant="block" detail="Sensor flagged uncertain" />}
        />
        <ListRow
          title="Bearing temperature, 24 h"
          meta="Trend model · signal lost 9 hours ago"
          trailing={<ConfidenceMeter percent={31} variant="block" detail="9 h without data" />}
        />
      </ul>
    </FcSheet>
  );
}

function ForecastAccuracy() {
  return (
    <FcSheet title="Forecast accuracy" subtitle="Vibration model · backtested over the last 30 days" actions={<FcModelPill />}>
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] items-center gap-8">
        <div className="flex flex-col gap-5">
          <Stat variant="plain" size="lg" label="Mean error" value={3.1} decimals={1} unit="%" delta={{ value: -0.6, good: 'down', caption: 'vs last month' }} />
          <StatGroup columns={2} joined label="Accuracy scores">
            <Stat variant="plain" size="sm" label="Inside 80 % range" value={83} unit="%" target="Expected 80 %" />
            <Stat variant="plain" size="sm" label="Bias" value="+0.04" unit="mm/s" target="Slightly high" />
          </StatGroup>
        </div>
        <Bars
          label="Mean forecast error in percent by horizon"
          categories={['6 h', '12 h', '18 h', '24 h', '30 h', '36 h']}
          series={[{ id: 'error', label: 'Mean error, %', values: FC_ERROR_BY_HORIZON, tone: 'blue' }]}
          limit={{ value: 5, label: 'Acceptable', tone: 'warning' }}
          decimals={1}
          showValues
          showLegend
          height={240}
        />
      </div>
    </FcSheet>
  );
}

function ForecastDrivers() {
  return (
    <FcSheet
      icon={
        <IconChip tone="purple">
          <IconSparkles />
        </IconChip>
      }
      title="Why 34 % in 30 days"
      subtitle="1st stage compressor · what moves the failure risk, in points"
      footer={<span>Baseline for this compressor type is 8 %. Drivers add up to the prediction.</span>}
    >
      <DriverBars label="Drivers of failure risk" drivers={FC_DRIVERS} unit=" pts" />
    </FcSheet>
  );
}

function ForecastStates() {
  return (
    <Canvas>
      <Grid>
        <Panel className="col-span-6" title="Low confidence" subtitle="Cooling water pump · bearing temperature" actions={<StatusPill tone="warning">Treat with care</StatusPill>}>
          <ForecastChart
            label="Bearing temperature forecast with a wide range"
            labels={FC_TEMP_LABELS}
            history={FC_TEMP_HISTORY.slice(0, 16).map((value) => value + 24)}
            forecast={project(FC_TEMP_HISTORY.slice(0, 16), { steps: 12, decimals: 1 }).map((value) => value + 24)}
            range={widen(project(FC_TEMP_HISTORY.slice(0, 16), { steps: 12, decimals: 1 }), 2, 7, 1).map((span) => ({ low: span.low + 24, high: span.high + 24 }))}
            rangeLabel="80 % range"
            unit="°C"
            tone="amber"
            tickEvery={5}
            height={200}
            showLegend={false}
            notes={<ConfidenceMeter percent={31} variant="block" detail="Signal lost for 9 of the last 24 hours; the range is too wide to plan on." />}
          />
        </Panel>
        <Panel className="col-span-6" title="Stale forecast" subtitle="Export pump A · motor current" actions={<StatusPill tone="neutral">26 h old</StatusPill>}>
          <EmptyPanel
            icon={<IconClockHour4 />}
            title="Last forecast is from yesterday 12:00"
            description="The model run at 06:00 did not finish. The old forecast is hidden so nobody plans on it."
            action={
              <Button variant="outline" size="sm">
                <IconRefresh aria-hidden="true" />
                Run forecast now
              </Button>
            }
          />
        </Panel>
        <Panel className="col-span-6" title="Not enough history" subtitle="Test separator · level">
          <EmptyPanel
            icon={<IconDatabaseOff />}
            title="9 of 14 days collected"
            description="The model needs two weeks of readings before it will forecast. First forecast expected Tuesday 17 March."
          />
        </Panel>
        <Panel className="col-span-6" tone="critical" title="Forecast failed" subtitle="Recompressor · vibration" actions={<StatusPill tone="critical">Failed 13:52</StatusPill>}>
          <EmptyPanel
            icon={<IconCloudOff />}
            title="The model could not read its inputs"
            description="23-VT-92740 has reported bad quality since the trip at 13:46. Forecasts resume when the signal is good again."
            action={
              <Button variant="outline" size="sm">
                Open sensor
              </Button>
            }
          />
        </Panel>
      </Grid>
    </Canvas>
  );
}

const FC_RISK_COLUMNS: readonly DataTableColumn<FcRisk>[] = [
  { id: 'name', header: 'Unit', cell: (risk) => risk.name },
  { id: 'tag', header: 'Tag', nowrap: true, cell: (risk) => <TagId>{risk.tag}</TagId> },
  { id: 'probability', header: 'Fails in 30 d', numeric: true, cell: (risk) => `${risk.probability} %` },
  { id: 'lead', header: 'Lead time', numeric: true, nowrap: true, cell: (risk) => `${risk.lead} d` },
  { id: 'confidence', header: 'Confidence', cell: (risk) => <ConfidenceMeter percent={risk.confidence} /> },
  { id: 'action', header: 'Action', cell: (risk) => <StatusPill tone={fcRiskTone(risk.probability)}>{fcRiskWord(risk.probability)}</StatusPill> },
];

function ForecastLookConsole() {
  return (
    <LookScope look="console">
      <Canvas>
        <Grid>
          <Panel className="col-span-7" title="Drive-end vibration" subtitle="23-VT-92540 · forecast 36 h">
            <FcVibrationChart height={280} />
          </Panel>
          <div className="col-span-5 flex flex-col gap-(--kit-gap)">
            <Panel padding="none" title="Failure forecast" subtitle="30 days">
              <DataTable
                flush
                label="Failure forecast by unit"
                columns={FC_RISK_COLUMNS.filter((column) => column.id !== 'tag' && column.id !== 'confidence')}
                rows={FC_RISKS}
                rowKey={(risk) => risk.id}
                rowTone={(risk) => fcRiskTone(risk.probability)}
              />
            </Panel>
            <Panel className="flex-1" title="Model" subtitle="Vibration trend · run 14:00">
              <StatGroup columns={3} label="Model scores">
                <Stat variant="plain" size="md" label="Limit in" value={formatLead(FC_VIB_CROSS)} tone="warning" />
                <Stat variant="plain" size="md" label="Mean error" value={3.1} decimals={1} unit="%" />
                <Stat variant="plain" size="md" label="In range" value={83} unit="%" />
              </StatGroup>
            </Panel>
          </div>
        </Grid>
      </Canvas>
    </LookScope>
  );
}

function ForecastLookEditorial() {
  return (
    <LookScope look="editorial">
      <Canvas>
        <Grid>
          <StatGroup columns={3} label="Vibration outlook" className="col-span-12">
            <Stat variant="plain" size="hero" label="Reaches the high limit in" value={formatLead(FC_VIB_CROSS)} />
            <Stat variant="plain" size="lg" label="Forecast in 24 hours" value={FC_VIB_FORECAST[23]} decimals={1} unit="mm/s" target="Limit 7.1" />
            <Stat variant="plain" size="lg" label="Rise per day" value={(FC_VIB_FORECAST[23] - 6.8) / 1} decimals={2} unit="mm/s" target="Steady for two days" />
          </StatGroup>
          <Panel className="col-span-12" title="The bearing will cross its limit before the planned stop" subtitle="Drive-end vibration on the 1st stage compressor, 48 hours measured and 36 forecast.">
            <FcVibrationChart
              height={300}
              notes={
                <ol className="space-y-4">
                  <li>
                    <strong className="font-semibold text-base-foreground">Now.</strong> 6.8 mm/s, 0.3 under the high limit and rising steadily.
                  </li>
                  <li>
                    <strong className="font-semibold text-base-foreground">In {formatLead(FC_VIB_CROSS)}.</strong> The forecast meets 7.1 mm/s; the range says it could be as early as {formatLead(FC_VIB_EARLY ?? 0)}.
                  </li>
                  <li>
                    <strong className="font-semibold text-base-foreground">Saturday 06:00.</strong> The planned stop comes after the crossing, so the survey should move forward.
                  </li>
                </ol>
              }
            />
          </Panel>
        </Grid>
      </Canvas>
    </LookScope>
  );
}

function ForecastLookPoster() {
  return (
    <LookScope look="poster">
      <Canvas>
        <Grid>
          <Stat
            className="col-span-4"
            size="hero"
            tone="blue"
            label="Export next week"
            value={FC_EXPORT_FORECAST.reduce((sum, value) => sum + value, 0)}
            decimals={1}
            unit="MSm³"
            target="0.6 under the 31.5 plan"
          />
          <Panel className="col-span-8" title="Day by day against plan" subtitle="Forecast gas export, MSm³ per day">
            <Bars
              label="Forecast gas export per day next week against the plan"
              categories={FC_WEEK_DAYS}
              series={[{ id: 'forecast', label: 'Forecast', values: FC_EXPORT_FORECAST }]}
              tones={FC_EXPORT_FORECAST.map((value): Tone => (value >= PLANT_KPIS.gasExport.target ? 'green' : 'pink'))}
              limit={{ value: PLANT_KPIS.gasExport.target, label: 'Plan' }}
              decimals={2}
              showValues
              height={260}
            />
          </Panel>
        </Grid>
      </Canvas>
    </LookScope>
  );
}

function ForecastLookGlass() {
  return (
    <LookScope look="glass">
      <Canvas>
        <Grid>
          <Panel className="col-span-8" title="Gas export outlook" subtitle="Two weeks measured, seven days forecast">
            <FcExportChart
              height={300}
              headline={<Stat variant="plain" size="lg" label="Thursday 19 March" value={FC_EXPORT_FORECAST[6]} decimals={2} unit="MSm³/d" delta={{ value: FC_EXPORT_FORECAST[6] - PLANT_KPIS.gasExport.value, decimals: 2, caption: 'vs today' }} />}
            />
          </Panel>
          <Panel className="col-span-4" title="Model health" subtitle="Export forecast">
            <div className="grid flex-1 grid-cols-2 items-center justify-items-center gap-4">
              <RingGauge label="Confidence" value={84} tone="teal" size={108} />
              <RingGauge label="Inside range" value={83} tone="sky" size={108} />
              <RingGauge label="Mean error" value={3.1} max={10} decimals={1} tone="purple" size={108} />
              <RingGauge label="Data coverage" value={97} tone="green" size={108} />
            </div>
          </Panel>
        </Grid>
      </Canvas>
    </LookScope>
  );
}

function ForecastLookSignal() {
  return (
    <LookScope look="signal">
      <Canvas>
        <Grid>
          {FC_RISKS.slice(0, 4).map((risk) => (
            <Stat
              key={risk.id}
              className="col-span-3"
              size="lg"
              tone={fcRiskTone(risk.probability)}
              label={risk.name}
              state={fcRiskWord(risk.probability)}
              stateIcon={<FcRiskIcon probability={risk.probability} />}
              value={risk.lead}
              unit="days left"
              target={`${risk.probability} % chance of failure in 30 days`}
            />
          ))}
        </Grid>
      </Canvas>
    </LookScope>
  );
}

function ForecastLookBlueprint() {
  return (
    <LookScope look="blueprint">
      <Canvas>
        <Grid>
          <Panel className="col-span-8" title="Bearing life projection" subtitle="23-KA-9101 · drive end">
            <FcVibrationChart height={280} />
          </Panel>
          <Panel className="col-span-4" title="Life window" subtitle="Days from today">
            <div className="flex flex-1 flex-col justify-between gap-5">
              <LifeTimeline label="Remaining useful life" span={90} earliest={24} likely={38} latest={55} endLabel="90 d" markers={[{ at: 30, label: 'Stop', tone: 'info' }]} />
              <DriverBars label="Drivers of failure risk" drivers={FC_DRIVERS.slice(0, 3).map((driver) => ({ label: driver.label, impact: driver.impact }))} unit=" pts" />
            </div>
          </Panel>
        </Grid>
      </Canvas>
    </LookScope>
  );
}

function ForecastUsePredictionCard() {
  const [planned, setPlanned] = useState(false);
  return (
    <Canvas>
      <Grid>
        <Panel
          className="col-span-12"
          icon={
            <IconChip tone="amber">
              <IconSparkles />
            </IconChip>
          }
          title="Bearing wear predicted on the 1st stage compressor"
          subtitle="23-KA-9101 · prediction from 12 March 14:00"
          actions={
            <>
              <StatusPill tone={planned ? 'success' : 'warning'} icon={planned ? <IconCircleCheck aria-hidden="true" /> : <IconAlertTriangle aria-hidden="true" />}>
                {planned ? 'Work planned' : 'Plan work'}
              </StatusPill>
              <Button size="sm" onClick={() => setPlanned((current) => !current)}>
                {planned ? 'Undo' : 'Create work order'}
              </Button>
            </>
          }
          footer={<ConfidenceMeter percent={82} detail="Trend model, 48 h of clean history, similar rise seen 4 times on this fleet" />}
        >
          <div className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-8">
            <FcVibrationChart height={280} />
            <div className="flex flex-col gap-6">
              <StatGroup columns={2} joined label="Prediction">
                <Stat variant="plain" size="md" label="High limit in" value={formatLead(FC_VIB_CROSS)} />
                <Stat variant="plain" size="md" label="Failure in 30 d" value={34} unit="%" />
              </StatGroup>
              <DriverBars label="Drivers of failure risk" drivers={FC_DRIVERS.slice(0, 4)} unit=" pts" />
            </div>
          </div>
        </Panel>
      </Grid>
    </Canvas>
  );
}

function ForecastUseProductionOutlook() {
  const [scenarios, setScenarios] = useState('range');
  return (
    <Canvas>
      <Grid>
        <StatGroup columns={4} label="Export outlook" className="col-span-12">
          <Stat icon={<IconChartLine />} tone="blue" label="Forecast, next 7 days" value={FC_EXPORT_FORECAST.reduce((sum, value) => sum + value, 0)} decimals={1} unit="MSm³" target="Plan 31.5" />
          <Stat icon={<IconHourglass />} tone="amber" label="Back on plan" value="Tue 17" target="When the recompressor returns" />
          <Stat icon={<IconAlertTriangle />} tone="pink" label="Shortfall this week" value={0.61} decimals={2} unit="MSm³" delta={{ value: -0.2, decimals: 2, good: 'down', caption: 'vs yesterday’s forecast' }} />
          <Stat icon={<IconCircleCheck />} tone="teal" label="Forecast accuracy" value={96.9} decimals={1} unit="%" target="30-day backtest" />
        </StatGroup>
        <Panel
          className="col-span-8"
          title="Gas export against plan"
          subtitle="MSm³ per day"
          actions={
            <SegmentedControl value={scenarios} onValueChange={(next) => setScenarios(String(next))}>
              <SegmentedControlList size="small" aria-label="Forecast view">
                <SegmentedControlButton value="range">Range</SegmentedControlButton>
                <SegmentedControlButton value="scenarios">Scenarios</SegmentedControlButton>
              </SegmentedControlList>
            </SegmentedControl>
          }
        >
          <FcExportChart height={300} scenarios={scenarios === 'scenarios'} />
        </Panel>
        <Panel className="col-span-4" title="What the forecast assumes" subtitle="Change one and it is rerun">
          <ul className="flex flex-col">
            <ListRow title="Recompressor returns" meta="Bearing inspection WO-104482" trailing={<StatusPill tone="info">Mon 16</StatusPill>} />
            <ListRow title="Inlet pressure" meta="Holds at 13.1 barg" trailing={<StatusPill tone="success">Stable</StatusPill>} />
            <ListRow title="Cooler cleaning" meta="WO-104471, 16 h at reduced rate" trailing={<StatusPill tone="warning">Mon 16</StatusPill>} />
            <ListRow title="Units at watch" meta={`${ASSETS.filter((asset) => asset.health === 'watch').length} units, none expected to trip`} trailing={<StatusPill tone="neutral">Assumed</StatusPill>} />
          </ul>
        </Panel>
      </Grid>
    </Canvas>
  );
}

function ForecastUseRiskBoard() {
  return (
    <Canvas>
      <Panel
        padding="none"
        icon={
          <IconChip tone="pink">
            <IconAlertTriangle />
          </IconChip>
        }
        title="Failure forecast"
        subtitle="Gas compression and utilities · next 30 days, most urgent first"
        actions={<FcModelPill />}
      >
        <DataTable flush label="Failure forecast by unit" columns={FC_RISK_COLUMNS} rows={FC_RISKS} rowKey={(risk) => risk.id} rowTone={(risk) => (risk.probability >= 25 ? fcRiskTone(risk.probability) : undefined)} />
      </Panel>
    </Canvas>
  );
}

export default definePage({
  id: 'forecasts-and-predictions',
  title: 'Forecasts and predictions',
  summary:
    'What is expected to happen next and how far to trust it: a measured line that turns into a forecast with its range, the time left before a limit, remaining life, scenarios, and the reasons behind a prediction.',
  guidance: {
    use: [
      'Draw the forecast dashed and the measured line solid, with "now" marked where one becomes the other.',
      'Show the range, and say what it is: an 80 % range reads differently from a worst case.',
      'Turn a forecast into a lead time ("limit in 16 h") when someone has to act on it.',
      'State confidence as a level with a reason, and hide a forecast that is stale or failed.',
    ],
    avoid: [
      'A forecast line with no range; it looks more certain than it is.',
      'A bare confidence percentage; nobody knows whether 72 % is good.',
      'Extending the forecast further than the model has been tested.',
      'The same colour and stroke for measured and predicted values.',
    ],
  },
  source,
  sections: [
    {
      id: 'line-and-range',
      title: 'Forecast line and range',
      description: 'History turns into a forecast at now; the range widens with the horizon.',
      specimens: [
        {
          id: 'ForecastLineAndRange',
          title: 'History, forecast and range',
          note: 'Pick it as the default view of any forecast: measured, predicted, range, limit and the crossing in one plot.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/forecasts-and-predictions/ForecastChart.tsx', 'kit/forecasts-and-predictions/forecast.ts', 'kit/forecasts-and-predictions/ConfidenceMeter.tsx', 'kit/Stat.tsx'],
          Component: ForecastLineAndRange,
        },
        {
          id: 'ForecastBacktest',
          title: 'Forecast against actual',
          note: 'Pick it to show how an earlier forecast held up, with the error and range coverage written out.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/forecasts-and-predictions/ForecastChart.tsx', 'kit/forecasts-and-predictions/forecast.ts', 'kit/StatGroup.tsx'],
          Component: ForecastBacktest,
        },
        {
          id: 'ForecastHorizon',
          title: 'Horizon switch',
          note: 'Pick it when people plan on different horizons; the footer restates the forecast at the chosen one.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/forecasts-and-predictions/ForecastChart.tsx', 'kit/Panel.tsx'],
          Component: ForecastHorizon,
        },
        {
          id: 'ForecastScenarios',
          title: 'Scenario fan',
          note: 'Pick it when the future depends on a decision: each case is a named line fanning out from today.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/forecasts-and-predictions/ForecastChart.tsx', 'kit/forecasts-and-predictions/forecast.ts', 'kit/Stat.tsx'],
          Component: ForecastScenarios,
        },
      ],
    },
    {
      id: 'limits-and-life',
      title: 'Limits and remaining life',
      description: 'A forecast becomes useful when it is a lead time someone can plan against.',
      specimens: [
        {
          id: 'ForecastTimeToLimit',
          title: 'Time to limit',
          note: 'Pick it when the question is how long is left: the crossing is marked on the plot and repeated as the lead figure.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/forecasts-and-predictions/ForecastChart.tsx', 'kit/forecasts-and-predictions/forecast.ts', 'kit/Stat.tsx', 'kit/ListRow.tsx'],
          Component: ForecastTimeToLimit,
        },
        {
          id: 'ForecastRemainingLife',
          title: 'Remaining useful life',
          note: 'Pick it for wear-out predictions: the window is a stretch of time with planned stops on the same scale.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/forecasts-and-predictions/LifeTimeline.tsx', 'kit/forecasts-and-predictions/ConfidenceMeter.tsx', 'kit/RingGauge.tsx', 'kit/Stat.tsx'],
          Component: ForecastRemainingLife,
        },
        {
          id: 'ForecastFailureRisk',
          title: 'Probability of failure by unit',
          note: 'Pick it to rank where to spend maintenance hours; the pill turns the probability into an action.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/Meter.tsx', 'kit/ListRow.tsx', 'kit/StatusPill.tsx', 'kit/TagId.tsx'],
          Component: ForecastFailureRisk,
        },
      ],
    },
    {
      id: 'trust',
      title: 'Accuracy, confidence and reasons',
      description: 'What it takes for someone to act on a number a model produced.',
      specimens: [
        {
          id: 'ForecastConfidenceLevels',
          title: 'Confidence levels',
          note: 'Pick it wherever a prediction is listed: three bars, a word, the score and the reason.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/forecasts-and-predictions/ConfidenceMeter.tsx', 'kit/ListRow.tsx'],
          Component: ForecastConfidenceLevels,
        },
        {
          id: 'ForecastDrivers',
          title: 'Drivers of a prediction',
          note: 'Pick it to answer "why": each driver pushes the prediction up or down by a signed amount.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/forecasts-and-predictions/DriverBars.tsx', 'kit/IconChip.tsx', 'kit/Panel.tsx'],
          Component: ForecastDrivers,
        },
        {
          id: 'ForecastAccuracy',
          title: 'Accuracy by horizon',
          note: 'Pick it on a model page: error, coverage and bias, and how the error grows with the horizon.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/Bars.tsx', 'kit/StatGroup.tsx', 'kit/Stat.tsx'],
          Component: ForecastAccuracy,
        },
        {
          id: 'ForecastStates',
          title: 'Low confidence, stale, too little history, failed',
          note: 'Pick the state that is true: a forecast nobody should plan on is hidden and explained, not drawn.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/forecasts-and-predictions/ForecastChart.tsx', 'kit/forecasts-and-predictions/ConfidenceMeter.tsx', 'kit/EmptyPanel.tsx', 'kit/Panel.tsx'],
          Component: ForecastStates,
        },
      ],
    },
    {
      id: 'looks',
      title: 'Forecasts in six looks',
      description: 'The same predictions composed for an operator, a report, a team screen, a showpiece, a wall and a drawing.',
      specimens: [
        {
          id: 'ForecastLookConsole',
          title: 'Console: plot beside a dense risk table',
          note: 'Pick it for a control room, where the forecast sits edge to edge with the ranked list it feeds.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/forecasts-and-predictions/ForecastChart.tsx', 'kit/DataTable.tsx', 'looks/LookScope.tsx'],
          Component: ForecastLookConsole,
        },
        {
          id: 'ForecastLookEditorial',
          title: 'Editorial: headline lead time and annotated plot',
          note: 'Pick it for a report: the conclusion is the title and the notes beside the plot walk through it.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/forecasts-and-predictions/ForecastChart.tsx', 'kit/StatGroup.tsx', 'looks/LookScope.tsx'],
          Component: ForecastLookEditorial,
        },
        {
          id: 'ForecastLookPoster',
          title: 'Poster: a block figure and bars against plan',
          note: 'Pick it for a weekly team review, where each day is simply over or under the plan.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/Bars.tsx', 'kit/Stat.tsx', 'looks/LookScope.tsx'],
          Component: ForecastLookPoster,
        },
        {
          id: 'ForecastLookGlass',
          title: 'Glass: glowing outlook with model rings',
          note: 'Pick it for an executive view on a dark display.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/forecasts-and-predictions/ForecastChart.tsx', 'kit/RingGauge.tsx', 'looks/LookScope.tsx'],
          Component: ForecastLookGlass,
        },
        {
          id: 'ForecastLookSignal',
          title: 'Signal: lead-time tiles',
          note: 'Pick it for a wall screen: each tile is a unit, filled with what to do and counting the days left.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/Stat.tsx', 'looks/LookScope.tsx'],
          Component: ForecastLookSignal,
        },
        {
          id: 'ForecastLookBlueprint',
          title: 'Blueprint: line-only projection with a life window',
          note: 'Pick it for an engineering study, where the projection is a drawing with its points marked.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/forecasts-and-predictions/ForecastChart.tsx', 'kit/forecasts-and-predictions/LifeTimeline.tsx', 'kit/forecasts-and-predictions/DriverBars.tsx', 'looks/LookScope.tsx'],
          Component: ForecastLookBlueprint,
        },
      ],
    },
    {
      id: 'in-use',
      title: 'In use',
      description: 'Compositions ready to drop into a product.',
      specimens: [
        {
          id: 'ForecastUsePredictionCard',
          title: 'Prediction card with action',
          note: 'Pick it as the detail of one prediction: the plot, the lead time, the reasons and the button that acts on it.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/forecasts-and-predictions/ForecastChart.tsx', 'kit/forecasts-and-predictions/DriverBars.tsx', 'kit/forecasts-and-predictions/ConfidenceMeter.tsx', 'kit/StatGroup.tsx', 'kit/Panel.tsx'],
          Component: ForecastUsePredictionCard,
        },
        {
          id: 'ForecastUseProductionOutlook',
          title: 'Production outlook',
          note: 'Pick it as a planning board: figures, the outlook with range or scenarios, and the assumptions behind it.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/forecasts-and-predictions/ForecastChart.tsx', 'kit/StatGroup.tsx', 'kit/ListRow.tsx', 'kit/Panel.tsx'],
          Component: ForecastUseProductionOutlook,
        },
        {
          id: 'ForecastUseRiskBoard',
          title: 'Failure forecast table',
          note: 'Pick it for a reliability meeting: probability, lead time, confidence and action per unit.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/forecasts-and-predictions/ConfidenceMeter.tsx', 'kit/DataTable.tsx', 'kit/StatusPill.tsx'],
          Component: ForecastUseRiskBoard,
        },
      ],
    },
  ],
});
