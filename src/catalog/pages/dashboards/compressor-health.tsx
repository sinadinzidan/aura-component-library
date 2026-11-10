import { ChartContainer, chartSeriesColor } from '@cognite/aura/chart';
import type { ChartConfig } from '@cognite/aura/chart';
import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import {
  SegmentedControl,
  SegmentedControlButton,
  SegmentedControlList,
} from '@cognite/aura/components/segmented-control';
import { IconExternalLink } from '@cognite/aura/icons';
import { useState } from 'react';
import { CartesianGrid, ComposedChart, Line, Scatter, XAxis, YAxis, ZAxis } from 'recharts';

import { DashboardFrame } from '../../../library/dashboards/DashboardFrame';
import { DashboardCell, DashboardGrid } from '../../../library/dashboards/DashboardGrid';
import { DashboardPanel } from '../../../library/dashboards/DashboardPanel';
import { SeriesLegend } from '../../../library/industrial/charts/SeriesLegend';
import { TrendChart } from '../../../library/industrial/charts/TrendChart';
import { KpiTile } from '../../../library/industrial/KpiTile';
import { DueLabel } from '../../../library/industrial/operations/DueLabel';
import { HealthBreakdown } from '../../../library/industrial/operations/HealthBreakdown';
import { PriorityBadge } from '../../../library/industrial/operations/PriorityBadge';
import { workOrderStatusLabel } from '../../../library/industrial/operations/workOrders';
import { ProgressRing } from '../../../library/industrial/ProgressRing';
import { RadialGauge } from '../../../library/industrial/RadialGauge';
import { formatLimit, healthStatus, runStateStatus } from '../../../library/industrial/status';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { ThemeScope } from '../../../library/themes/ThemeScope';
import { SENSORS } from '../../data/plant';
import type { Sensor } from '../../data/plant';
import { DAY, HOUR, MINUTE, REFERENCE_NOW, formatDate, makeSeries, makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './compressor-health.tsx?raw';

const COMP_ASSET = {
  tag: '23-KA-9101',
  name: '1st stage compressor',
  state: 'running',
  health: 'watch',
  healthScore: 72,
  criticality: 'A',
} as const;

const COMP_FALLBACK_SENSOR: Sensor = {
  id: 'none',
  tag: '23-XX-00000',
  name: 'No signal',
  assetId: '23-ka-9101',
  unit: '',
  value: 0,
  lowLimit: 0,
  highLimit: 0,
  rangeMin: 0,
  rangeMax: 1,
  decimals: 0,
  quality: 'bad',
  seed: 1,
};

const compSensor = (id: string): Sensor => SENSORS.find((sensor) => sensor.id === id) ?? COMP_FALLBACK_SENSOR;

const COMP_VIBRATION = compSensor('vt-92540');
const COMP_TEMPERATURE = compSensor('tt-92532');
const COMP_DIALS = [compSensor('pt-92530'), compSensor('pt-92531'), compSensor('st-92501')];

const COMP_RUN_HOURS = 14620;
const COMP_OVERHAUL_INTERVAL = 24000;

const COMP_ALARM_AT = REFERENCE_NOW - 2 * HOUR;

/** 24 hours of drive-end vibration at 30-minute resolution, ending on the live value. */
const COMP_VIBRATION_POINTS = makeSeries({
  seed: COMP_VIBRATION.seed,
  points: 49,
  base: 5.5,
  amplitude: 0.15,
  noise: 0.12,
  drift: 1.2,
  cycles: 2,
  stepMs: 30 * MINUTE,
  max: 6.9,
}).map((point, index, all) => ({ t: point.t, v: index === all.length - 1 ? COMP_VIBRATION.value : point.v }));

const COMP_VIBRATION_SERIES = [{ key: 'vibration', label: 'Drive-end vibration', points: COMP_VIBRATION_POINTS }];

const COMP_VIBRATION_LIMITS = [
  { value: COMP_VIBRATION.highLimit, label: 'High 7.1', tone: 'warning', align: 'left' },
  { value: 11, label: 'Trip 11', tone: 'critical', align: 'left' },
] as const;

const COMP_VIBRATION_EVENTS = [{ t: COMP_ALARM_AT, label: 'Alarm', tone: 'warning' }] as const;

const COMP_INDICATORS = [
  { id: 'vibration', label: 'Vibration', score: 61, detail: '6.8 mm/s, rising' },
  { id: 'temperature', label: 'Temperature', score: 68, detail: '141 °C, near limit' },
  { id: 'performance', label: 'Performance', score: 84, detail: 'Efficiency −1.2%' },
  { id: 'lubrication', label: 'Lubrication', score: 90, detail: 'Oil sample clean' },
];

/** Compressor map: inlet flow in kSm³/h against pressure ratio, with the two limits of the envelope. */
const COMP_SURGE_LINE = [
  { flow: 110, surge: 3.0 },
  { flow: 130, surge: 3.5 },
  { flow: 150, surge: 4.0 },
  { flow: 170, surge: 4.5 },
  { flow: 182, surge: 4.8 },
];

const COMP_CHOKE_LINE = [
  { flow: 202, choke: 2.6 },
  { flow: 215, choke: 3.3 },
  { flow: 227, choke: 4.0 },
  { flow: 236, choke: 4.6 },
];

const COMP_MAP_FLOW = makeValues({ seed: 61, points: 24, base: 178, amplitude: 14, noise: 5, cycles: 1.5, decimals: 0 });
const COMP_MAP_RATIO = makeValues({ seed: 62, points: 24, base: 3.66, amplitude: 0.22, noise: 0.08, cycles: 1.5, decimals: 2 });

const COMP_MAP_HISTORY = COMP_MAP_FLOW.map((flow, index) => ({ flow, history: COMP_MAP_RATIO[index] ?? 3.7 }));

const COMP_MAP_NOW = [{ flow: 182, now: 3.7 }];

const COMP_MAP_CONFIG = {
  history: { label: 'Last 24 hours', color: 'var(--color-chart-1-300)' },
  now: { label: 'Now', color: chartSeriesColor(1) },
  surge: { label: 'Surge limit', color: 'var(--color-chart-critical-450)' },
  choke: { label: 'Choke limit', color: 'var(--color-chart-neutral-450)' },
} satisfies ChartConfig;

const COMP_MAP_LEGEND = [
  { key: 'now', label: 'Now', color: 'var(--color-chart-1-450)', mark: 'dot' },
  { key: 'history', label: 'Last 24 hours', color: 'var(--color-chart-1-300)', mark: 'dot' },
  { key: 'surge', label: 'Surge limit', color: 'var(--color-chart-critical-450)', mark: 'line' },
  { key: 'choke', label: 'Choke limit', color: 'var(--color-chart-neutral-450)', mark: 'dashed' },
] as const;

const COMP_ORDERS = [
  {
    id: 'WO-104466',
    title: 'Vibration survey, 1st stage compressor',
    priority: 'P2',
    status: 'open',
    dueAt: REFERENCE_NOW + 2 * DAY,
    hours: 4,
  },
  {
    id: 'WO-104473',
    title: 'Replace drive-end bearing temperature probe',
    priority: 'P2',
    status: 'planned',
    dueAt: REFERENCE_NOW + 5 * DAY,
    hours: 3,
  },
  {
    id: 'WO-104451',
    title: 'Lube oil sample and analysis',
    priority: 'P3',
    status: 'open',
    dueAt: REFERENCE_NOW - 2 * DAY,
    hours: 1,
  },
  {
    id: 'WO-104402',
    title: 'Change dry gas seal filter elements',
    priority: 'P3',
    status: 'waiting',
    dueAt: REFERENCE_NOW + 9 * DAY,
    hours: 6,
  },
] as const;

const COMP_EVIDENCE = [
  { id: 'trend', label: 'Vibration trend', value: '+1.2 mm/s in 24 h' },
  { id: 'margin', label: 'Margin to high limit', value: '0.3 mm/s' },
  { id: 'limit', label: 'Projected to reach limit', value: 'In about 6 h' },
  { id: 'spectrum', label: 'Dominant frequency', value: '1× running speed' },
];

function CompKpiRow() {
  return (
    <DashboardGrid>
      <DashboardCell span={3}>
        <KpiTile
          label="Health score"
          value={COMP_ASSET.healthScore}
          decimals={0}
          tone="warning"
          status={{ ...healthStatus(COMP_ASSET.health) }}
          delta={{ reference: 79, goodDirection: 'up', caption: 'vs last week', decimals: 0 }}
        />
      </DashboardCell>
      <DashboardCell span={3}>
        <KpiTile
          label="Drive-end vibration"
          value={COMP_VIBRATION.value}
          unit={COMP_VIBRATION.unit}
          decimals={1}
          delta={{ reference: 5.6, goodDirection: 'down', caption: 'vs 24 h ago' }}
          trend={{ values: COMP_VIBRATION_POINTS.map((point) => point.v), limit: COMP_VIBRATION.highLimit }}
        />
      </DashboardCell>
      <DashboardCell span={3}>
        <KpiTile
          label="Discharge temperature"
          value={COMP_TEMPERATURE.value}
          unit={COMP_TEMPERATURE.unit}
          decimals={1}
          delta={{ reference: 138.4, goodDirection: 'down', caption: 'vs 24 h ago' }}
          trend={{
            values: makeValues({ seed: COMP_TEMPERATURE.seed, points: 24, base: 138.6, amplitude: 1.2, noise: 0.5, drift: 2.6 }),
            limit: COMP_TEMPERATURE.highLimit,
          }}
        />
      </DashboardCell>
      <DashboardCell span={3}>
        <KpiTile
          label="Run hours since overhaul"
          value={COMP_RUN_HOURS}
          unit="h"
          decimals={0}
          target={{ value: COMP_OVERHAUL_INTERVAL, label: 'Overhaul due at' }}
        />
      </DashboardCell>
    </DashboardGrid>
  );
}

function CompVibrationPanel() {
  return (
    <DashboardPanel
      title="Vibration trend"
      description="Drive-end, last 24 hours, with high and trip limits"
      actions={
        <Button variant="ghost" size="sm">
          Open trend
        </Button>
      }
      footnote="Vibration rose from 5.6 to 6.8 mm/s in 24 hours and is 0.3 mm/s under the high limit; the alarm was raised at 12:00."
    >
      <TrendChart
        label="Drive-end vibration over the last 24 hours, rising from 5.6 to 6.8 millimetres per second, under the 7.1 high limit and the 11 trip limit, with an alarm at 12:00"
        series={COMP_VIBRATION_SERIES}
        limits={COMP_VIBRATION_LIMITS}
        events={COMP_VIBRATION_EVENTS}
        yDomain={[4, 12]}
        yTicks={[4, 6, 8, 10, 12]}
        unit={COMP_VIBRATION.unit}
        decimals={1}
        showLast
        heightClassName="h-64"
        className="w-full"
      />
    </DashboardPanel>
  );
}

function CompHealthPanel() {
  return (
    <DashboardPanel
      title="Health breakdown"
      description="Score per condition indicator, 0 to 100"
      footnote="Watch below 80, poor below 60. Scores are recalculated every hour from live readings and the latest inspections."
    >
      <div className="flex items-center gap-4">
        <ProgressRing label="Overall health" value={COMP_ASSET.healthScore} unit="" decimals={0} size="md" tone="warning" showLabel={false} />
        <div className="min-w-0 flex-1">
          <StatusIndicator {...healthStatus(COMP_ASSET.health)} />
          <p className="mt-1 text-xs text-muted-foreground">Down 7 points in a week, driven by vibration and temperature.</p>
        </div>
      </div>
      <HealthBreakdown indicators={COMP_INDICATORS} label="Compressor health by indicator" className="border-t border-default pt-3" />
    </DashboardPanel>
  );
}

function CompDialsPanel() {
  return (
    <DashboardPanel
      title="Operating readings"
      description="Suction, discharge and speed against their limits"
      footnote="All three readings are inside their operating limits; discharge pressure has 3.4 barg left to its high limit."
    >
      <ul className="flex w-full flex-wrap items-start justify-around gap-x-4 gap-y-6 py-4">
        {COMP_DIALS.map((sensor) => (
          <li key={sensor.id} className="flex min-w-0 flex-col items-center gap-2">
            <RadialGauge
              label={sensor.name}
              value={sensor.value}
              min={sensor.rangeMin}
              max={sensor.rangeMax}
              unit={sensor.unit}
              decimals={sensor.decimals}
              limits={{ low: sensor.lowLimit, high: sensor.highLimit, highHigh: sensor.highHighLimit }}
              size="md"
            />
            <p className="text-center text-xs tabular-nums text-muted-foreground">
              Limits {formatLimit(sensor.lowLimit, sensor.decimals)}–{formatLimit(sensor.highLimit, sensor.decimals)}
              {sensor.highHighLimit === undefined ? '' : ` · trip ${formatLimit(sensor.highHighLimit, sensor.decimals)}`}
            </p>
            <p className="font-mono text-xs text-muted-foreground">{sensor.tag}</p>
          </li>
        ))}
      </ul>
    </DashboardPanel>
  );
}

function CompEnvelopePanel() {
  return (
    <DashboardPanel
      title="Operating envelope"
      description="Pressure ratio against inlet flow, kSm³/h"
      footnote="Operating at 182 kSm³/h and ratio 3.7, 24% right of the surge limit; the last 24 hours stayed inside the envelope."
    >
      <div className="h-56 w-full">
        <ChartContainer
          config={COMP_MAP_CONFIG}
          className="aspect-auto h-full w-full"
          aria-label="Compressor map: the operating point at 182 thousand standard cubic metres per hour and pressure ratio 3.7 sits between the surge and choke limits, as did the last 24 hours"
        >
          <ComposedChart margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              type="number"
              dataKey="flow"
              domain={[100, 240]}
              ticks={[100, 120, 140, 160, 180, 200, 220, 240]}
              tickLine={false}
              axisLine={false}
              allowDuplicatedCategory={false}
            />
            <YAxis type="number" domain={[2.5, 5]} ticks={[2.5, 3, 3.5, 4, 4.5, 5]} tickLine={false} axisLine={false} width={32} />
            <Line
              data={COMP_SURGE_LINE}
              dataKey="surge"
              type="monotone"
              stroke="var(--color-surge)"
              strokeWidth={2}
              dot={false}
              activeDot={false}
              isAnimationActive={false}
            />
            <Line
              data={COMP_CHOKE_LINE}
              dataKey="choke"
              type="monotone"
              stroke="var(--color-choke)"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
              activeDot={false}
              isAnimationActive={false}
            />
            <ZAxis zAxisId="history" range={[24, 24]} />
            <ZAxis zAxisId="now" range={[140, 140]} />
            <Scatter data={COMP_MAP_HISTORY} dataKey="history" zAxisId="history" fill="var(--color-history)" isAnimationActive={false} />
            <Scatter
              data={COMP_MAP_NOW}
              dataKey="now"
              zAxisId="now"
              fill="var(--color-now)"
              stroke="var(--color-base-background)"
              strokeWidth={2}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ChartContainer>
      </div>
      <SeriesLegend items={COMP_MAP_LEGEND} label="Compressor map legend" />
    </DashboardPanel>
  );
}

function CompWorkOrdersPanel() {
  return (
    <DashboardPanel
      title="Open work orders"
      description={`${COMP_ORDERS.length} on ${COMP_ASSET.tag}, by priority`}
      actions={
        <Button variant="ghost" size="sm">
          Create work order
        </Button>
      }
    >
      <table className="w-full table-fixed text-left text-sm">
        <thead>
          <tr className="text-xs text-muted-foreground">
            <th scope="col" className="pb-2 pr-3 font-medium">
              Work order
            </th>
            <th scope="col" className="w-16 pb-2 pr-3 font-medium">
              Priority
            </th>
            <th scope="col" className="w-24 pb-2 pr-3 font-medium">
              Status
            </th>
            <th scope="col" className="w-14 pb-2 pr-3 text-right font-medium">
              Hours
            </th>
            <th scope="col" className="w-36 pb-2 font-medium">
              Due
            </th>
          </tr>
        </thead>
        <tbody>
          {COMP_ORDERS.map((order) => (
            <tr key={order.id} className="border-t border-default align-top">
              <td className="py-2 pr-3">
                <p className="line-clamp-2 text-base-foreground">{order.title}</p>
                <p className="font-mono text-xs text-muted-foreground">{order.id}</p>
              </td>
              <td className="py-2 pr-3">
                <PriorityBadge priority={order.priority} />
              </td>
              <td className="py-2 pr-3 text-medium-foreground">{workOrderStatusLabel(order.status)}</td>
              <td className="py-2 pr-3 text-right tabular-nums text-medium-foreground">{order.hours}</td>
              <td className="py-2">
                <DueLabel due={formatDate(order.dueAt)} overdue={order.dueAt < REFERENCE_NOW} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </DashboardPanel>
  );
}

function CompRecommendationPanel() {
  return (
    <DashboardPanel title="Recommendation" description="From condition monitoring, 13:20 UTC">
      <div className="flex flex-col gap-1">
        <p className="text-base font-medium text-base-foreground">Bring the vibration survey forward to this shift</p>
        <p className="text-sm text-medium-foreground">
          Drive-end vibration is climbing steadily at running speed, which points to developing unbalance or a bearing
          fault. A survey now decides between a planned stop and running to the next window.
        </p>
      </div>
      <dl className="flex flex-col border-t border-default">
        {COMP_EVIDENCE.map((item) => (
          <div key={item.id} className="flex items-baseline justify-between gap-3 border-b border-default py-2 text-sm">
            <dt className="text-muted-foreground">{item.label}</dt>
            <dd className="text-right tabular-nums text-base-foreground">{item.value}</dd>
          </div>
        ))}
      </dl>
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm">Reschedule survey</Button>
        <Button variant="outline" size="sm">
          Review evidence
        </Button>
      </div>
    </DashboardPanel>
  );
}

function CompDashboard() {
  const [range, setRange] = useState('24h');

  return (
    <DashboardFrame
      title="Compressor health"
      subtitle={`${COMP_ASSET.name} · Gas compression, Nordkapp · updated 14:00 UTC`}
      status={
        <>
          <span className="font-mono text-sm text-medium-foreground">{COMP_ASSET.tag}</span>
          <StatusIndicator {...runStateStatus(COMP_ASSET.state)} />
          <Badge variant="secondary">Criticality {COMP_ASSET.criticality}</Badge>
        </>
      }
      actions={
        <>
          <SegmentedControl value={range} onValueChange={(value) => setRange(String(value))}>
            <SegmentedControlList size="small" aria-label="Time range">
              <SegmentedControlButton value="24h">24 h</SegmentedControlButton>
              <SegmentedControlButton value="7d">7 d</SegmentedControlButton>
              <SegmentedControlButton value="30d">30 d</SegmentedControlButton>
            </SegmentedControlList>
          </SegmentedControl>
          <Button variant="outline" size="sm">
            <IconExternalLink /> Open asset
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <CompKpiRow />
        <DashboardGrid>
          <DashboardCell span={8}>
            <CompVibrationPanel />
          </DashboardCell>
          <DashboardCell span={4}>
            <CompHealthPanel />
          </DashboardCell>
          <DashboardCell span={6}>
            <CompDialsPanel />
          </DashboardCell>
          <DashboardCell span={6}>
            <CompEnvelopePanel />
          </DashboardCell>
          <DashboardCell span={7}>
            <CompWorkOrdersPanel />
          </DashboardCell>
          <DashboardCell span={5}>
            <CompRecommendationPanel />
          </DashboardCell>
        </DashboardGrid>
      </div>
    </DashboardFrame>
  );
}

function CompHealthDashSignature() {
  return (
    <ThemeScope preset="blueprint" className="w-full">
      <CompDashboard />
    </ThemeScope>
  );
}

function CompHealthDashAura() {
  return (
    <ThemeScope preset="aura" className="w-full">
      <CompDashboard />
    </ThemeScope>
  );
}

function CompHealthDashControlRoom() {
  return (
    <ThemeScope preset="control-room" className="w-full">
      <CompDashboard />
    </ThemeScope>
  );
}

function CompHealthDashSchematic() {
  return (
    <ThemeScope preset="schematic" className="w-full">
      <CompDashboard />
    </ThemeScope>
  );
}

function CompHealthDashKpiRow() {
  return <CompKpiRow />;
}

function CompHealthDashVibrationTrend() {
  return <CompVibrationPanel />;
}

function CompHealthDashBreakdown() {
  return <CompHealthPanel />;
}

function CompHealthDashReadings() {
  return <CompDialsPanel />;
}

function CompHealthDashEnvelope() {
  return <CompEnvelopePanel />;
}

function CompHealthDashWorkOrders() {
  return <CompWorkOrdersPanel />;
}

function CompHealthDashRecommendation() {
  return <CompRecommendationPanel />;
}

export default definePage({
  id: 'compressor-health',
  title: 'Compressor health',
  summary:
    'One machine in depth: how healthy the 1st stage compressor is, which indicator is pulling the score down, where it runs inside its envelope, and what to do next.',
  guidance: {
    use: [
      'As the detail screen behind an asset card, an alarm or a bad-actor list.',
      'When one critical machine justifies its own screen: compressors, turbines, large pumps.',
      'Put the tag, run state and criticality beside the title so the machine is never in doubt.',
      'End with the open work and one recommendation, so the screen leads to an action.',
    ],
    avoid: [
      'Dials for more than three readings; use a table of tags and limits instead.',
      'A trend without its limits, or limits without their values printed on the line.',
      'A health score with no breakdown; a single number cannot be acted on.',
      'Recommendations without the evidence and the reason behind them.',
    ],
  },
  source,
  sections: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description: 'Shown in the Blueprint theme: sharp corners and blue-tinted surfaces for engineering users.',
      specimens: [
        {
          id: 'CompHealthDashSignature',
          title: 'Compressor health',
          note: 'Pick it as the detail screen for one critical rotating machine.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'dashboards/DashboardFrame.tsx',
            'dashboards/DashboardGrid.tsx',
            'dashboards/DashboardPanel.tsx',
            'industrial/KpiTile.tsx',
            'industrial/RadialGauge.tsx',
            'industrial/ProgressRing.tsx',
            'industrial/StatusIndicator.tsx',
            'industrial/charts/TrendChart.tsx',
            'industrial/charts/SeriesLegend.tsx',
            'industrial/operations/HealthBreakdown.tsx',
            'industrial/operations/PriorityBadge.tsx',
            'industrial/operations/DueLabel.tsx',
            'themes/ThemeScope.tsx',
          ],
          Component: CompHealthDashSignature,
        },
      ],
    },
    {
      id: 'themes',
      title: 'In other themes',
      description: 'The same dashboard, unchanged, in three more presets.',
      specimens: [
        {
          id: 'CompHealthDashAura',
          title: 'Aura',
          note: 'Pick it when the screen sits inside a product that uses the design system as shipped.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['themes/ThemeScope.tsx', 'themes/themes.css'],
          Component: CompHealthDashAura,
        },
        {
          id: 'CompHealthDashControlRoom',
          title: 'Control room',
          note: 'Pick it for the operator console: dark, compact, sharp and high contrast.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['themes/ThemeScope.tsx', 'themes/themes.css'],
          Component: CompHealthDashControlRoom,
        },
        {
          id: 'CompHealthDashSchematic',
          title: 'Schematic',
          note: 'Pick it for tag-heavy engineering tools where monospaced figures line up.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['themes/ThemeScope.tsx', 'themes/themes.css'],
          Component: CompHealthDashSchematic,
        },
      ],
    },
    {
      id: 'panels',
      title: 'Panels',
      description: 'Each part on its own, ready to drop into another dashboard.',
      specimens: [
        {
          id: 'CompHealthDashKpiRow',
          title: 'Headline figures',
          note: 'Pick it as the first row: the score, the two readings behind it and the hours run.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['dashboards/DashboardGrid.tsx', 'industrial/KpiTile.tsx'],
          Component: CompHealthDashKpiRow,
        },
        {
          id: 'CompHealthDashVibrationTrend',
          title: 'Trend with limits',
          note: 'Pick it when distance to a high or trip limit is the story of the trend.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx', 'industrial/charts/TrendChart.tsx'],
          Component: CompHealthDashVibrationTrend,
        },
        {
          id: 'CompHealthDashBreakdown',
          title: 'Health breakdown',
          note: 'Pick it to show which condition indicator is pulling a health score down.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: [
            'dashboards/DashboardPanel.tsx',
            'industrial/operations/HealthBreakdown.tsx',
            'industrial/ProgressRing.tsx',
            'industrial/StatusIndicator.tsx',
          ],
          Component: CompHealthDashBreakdown,
        },
        {
          id: 'CompHealthDashReadings',
          title: 'Three dials',
          note: 'Pick it for the two or three readings an engineer checks first on a machine.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx', 'industrial/RadialGauge.tsx'],
          Component: CompHealthDashReadings,
        },
        {
          id: 'CompHealthDashEnvelope',
          title: 'Operating envelope',
          note: 'Pick it to show where a machine runs between its surge and choke limits.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx', 'industrial/charts/SeriesLegend.tsx'],
          Component: CompHealthDashEnvelope,
        },
        {
          id: 'CompHealthDashWorkOrders',
          title: 'Open work orders',
          note: 'Pick it to list the open jobs on one asset with priority and due date.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx', 'industrial/operations/PriorityBadge.tsx', 'industrial/operations/DueLabel.tsx'],
          Component: CompHealthDashWorkOrders,
        },
        {
          id: 'CompHealthDashRecommendation',
          title: 'Recommendation',
          note: 'Pick it when the screen should end in one next step, with the reason and the evidence.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx'],
          Component: CompHealthDashRecommendation,
        },
      ],
    },
  ],
});
