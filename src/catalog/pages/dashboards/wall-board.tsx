import { ChartContainer, chartSeriesColor } from '@cognite/aura/chart';
import type { ChartConfig } from '@cognite/aura/chart';
import { Button } from '@cognite/aura/components/button';
import { Card } from '@cognite/aura/components/card';
import {
  IconAlertCircle,
  IconAlertOctagon,
  IconAlertTriangle,
  IconArrowLeft,
  IconArrowRight,
  IconCircleCheck,
} from '@cognite/aura/icons';
import { useState } from 'react';
import { Area, AreaChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from 'recharts';

import { DashboardFrame } from '../../../library/dashboards/DashboardFrame';
import { DashboardPanel } from '../../../library/dashboards/DashboardPanel';
import { KpiTile } from '../../../library/industrial/KpiTile';
import { TONE_TEXT, formatValue, healthStatus, severityStatus } from '../../../library/industrial/status';
import type { Health, Severity } from '../../../library/industrial/status';
import { ThemeScope } from '../../../library/themes/ThemeScope';
import { ALARMS, PLANT_KPIS, childrenOf, findAsset } from '../../data/plant';
import { REFERENCE_NOW, formatAgo, formatTime, makeSeries, makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './wall-board.tsx?raw';

type WallFocus = {
  areaId: string;
  /** The one measurement the area is read by from across the room. */
  label: string;
  unit: string;
  decimals: number;
  series: ReturnType<typeof makeSeries>;
  domain: readonly [number, number];
  ticks: readonly number[];
  high: number;
  /** One sentence on the state of the area. */
  state: string;
};

const WALL_FOCUS: readonly WallFocus[] = [
  {
    areaId: 'nk-20',
    label: 'Separator level',
    unit: '%',
    decimals: 1,
    series: makeSeries({ seed: 17, points: 24, base: 54, amplitude: 4, noise: 1.2, cycles: 1.5 }),
    domain: [30, 80],
    ticks: [30, 40, 50, 60, 70, 80],
    high: 70,
    state: 'All units running. Test separator on well N-4.',
  },
  {
    areaId: 'nk-23',
    label: 'Discharge pressure',
    unit: 'barg',
    decimals: 1,
    series: makeSeries({ seed: 11, points: 24, base: 48.4, amplitude: 1.1, noise: 0.35, cycles: 1.5 }),
    domain: [40, 56],
    ticks: [40, 44, 48, 52, 56],
    high: 52,
    state: 'Recompressor tripped at 13:46. Two of three compressors on load.',
  },
  {
    areaId: 'nk-27',
    label: 'Export flow',
    unit: 'm³/h',
    decimals: 0,
    series: makeSeries({ seed: 20, points: 24, base: 412, amplitude: 14, noise: 5, cycles: 1.2, decimals: 0 }),
    domain: [300, 500],
    ticks: [300, 350, 400, 450, 500],
    high: 480,
    state: 'Pump A carries the export. Pump B on standby.',
  },
  {
    areaId: 'nk-40',
    label: 'Supply temperature',
    unit: '°C',
    decimals: 1,
    series: makeSeries({ seed: 23, points: 24, base: 18.4, amplitude: 0.8, noise: 0.3, cycles: 1.2 }),
    domain: [14, 26],
    ticks: [14, 18, 22, 26],
    high: 24,
    state: 'Cooling water pump in maintenance until 13 March.',
  },
];

const WALL_AREAS = childrenOf('nk');

const WALL_OPEN_ALARMS = ALARMS.filter((alarm) => alarm.state === 'active' || alarm.state === 'acknowledged');

const WALL_TOP_ALARMS = WALL_OPEN_ALARMS.slice(0, 3);

const WALL_CHART_CONFIG = {
  value: { label: 'Value', color: chartSeriesColor(1) },
} satisfies ChartConfig;

const WALL_HEALTH_ICON: Record<Health, typeof IconCircleCheck> = {
  good: IconCircleCheck,
  watch: IconAlertTriangle,
  poor: IconAlertOctagon,
};

const WALL_SEVERITY_ICON: Record<Severity, typeof IconCircleCheck> = {
  critical: IconAlertOctagon,
  high: IconAlertTriangle,
  medium: IconAlertCircle,
  low: IconAlertCircle,
};

function wallAlarmCount(areaId: string): number {
  return WALL_OPEN_ALARMS.filter((alarm) => alarm.assetId === areaId || findAsset(alarm.assetId)?.parentId === areaId).length;
}

function wallFocusAt(index: number): WallFocus {
  return WALL_FOCUS[((index % WALL_FOCUS.length) + WALL_FOCUS.length) % WALL_FOCUS.length];
}

function WallStateBand() {
  return (
    <section
      aria-label="Plant state"
      className="flex w-full flex-wrap items-center gap-x-6 gap-y-3 rounded-xl bg-warning-background p-6 text-warning-foreground"
    >
      <IconAlertTriangle aria-hidden="true" className="size-12 shrink-0" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-4xl font-semibold">Reduced capacity</p>
        <p className="text-xl">Recompressor 23-KA-9103 tripped at 13:46. Export is at 97% of plan.</p>
      </div>
      <p className="text-2xl font-medium tabular-nums">Since 13:46</p>
    </section>
  );
}

function WallFocusPanel({ index }: { index: number }) {
  const focus = wallFocusAt(index);
  const area = findAsset(focus.areaId);
  const position = WALL_FOCUS.indexOf(focus) + 1;
  const latest = focus.series[focus.series.length - 1].v;
  const health = healthStatus(area?.health ?? 'good');
  const HealthIcon = WALL_HEALTH_ICON[area?.health ?? 'good'];
  const rows = focus.series.map((point) => ({ time: formatTime(point.t), value: point.v }));

  return (
    <DashboardPanel
      title={area?.name ?? focus.areaId}
      actions={
        <span className="text-xl tabular-nums text-muted-foreground">
          {position} of {WALL_FOCUS.length}
        </span>
      }
    >
      <div className="flex flex-col gap-2">
        <p className="text-2xl text-muted-foreground">{focus.label}</p>
        <p className="flex flex-wrap items-baseline gap-x-4 leading-none">
          <span className="text-8xl font-semibold tabular-nums tracking-tight text-base-foreground">{formatValue(latest, focus.decimals)}</span>
          <span className="text-4xl text-muted-foreground">{focus.unit}</span>
        </p>
      </div>
      <p className="flex items-start gap-3 text-2xl text-base-foreground">
        <HealthIcon aria-hidden="true" className={`mt-1 size-7 shrink-0 ${TONE_TEXT[health.tone]}`} />
        <span>
          <span className="font-medium">{health.label}.</span> {focus.state}
        </span>
      </p>
      <div className="h-64 w-full">
        <ChartContainer
          config={WALL_CHART_CONFIG}
          className="aspect-auto h-full w-full"
          aria-label={`${focus.label} in ${area?.name ?? 'the area'} over the last 24 hours, now ${formatValue(latest, focus.decimals)} ${focus.unit} against a high limit of ${focus.high}`}
        >
          <AreaChart data={rows} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="time" tickLine={false} axisLine={false} minTickGap={72} tick={{ fontSize: '1.125rem' }} tickMargin={8} height={36} />
            <YAxis
              domain={[focus.domain[0], focus.domain[1]]}
              ticks={[...focus.ticks]}
              tickLine={false}
              axisLine={false}
              width={56}
              tick={{ fontSize: '1.125rem' }}
            />
            <ReferenceLine y={focus.high} stroke="var(--color-muted-foreground)" strokeDasharray="6 6" strokeWidth={2} />
            <Area
              dataKey="value"
              type="monotone"
              stroke="var(--color-value)"
              fill="var(--color-value)"
              fillOpacity={0.12}
              strokeWidth={3}
              isAnimationActive={false}
            />
          </AreaChart>
        </ChartContainer>
      </div>
      <p className="text-xl text-muted-foreground">
        Last 24 hours. The dashed line is the high limit of {focus.high} {focus.unit}.
      </p>
    </DashboardPanel>
  );
}

function WallExportTile() {
  return (
    <KpiTile
      size="large"
      label="Gas export"
      value={PLANT_KPIS.gasExport.value}
      unit="MSm³/d"
      decimals={2}
      delta={{ reference: PLANT_KPIS.gasExport.target, goodDirection: 'up', caption: 'against plan', decimals: 2 }}
      trend={{ values: makeValues({ seed: 31, points: 24, base: 4.32, amplitude: 0.14, noise: 0.04, cycles: 1.2, decimals: 2 }), label: 'Gas export, last 24 hours' }}
    />
  );
}

function WallAvailabilityTile() {
  return (
    <KpiTile
      size="large"
      label="Availability"
      value={PLANT_KPIS.availability.value}
      unit="%"
      decimals={1}
      trend={{ values: makeValues({ seed: 41, points: 24, base: 96.8, amplitude: 0.5, noise: 0.2 }), label: 'Availability, last 24 hours' }}
    />
  );
}

function WallAlarmsTile() {
  return (
    <KpiTile
      size="large"
      label="Open alarms"
      value={WALL_OPEN_ALARMS.length}
      decimals={0}
      tone="critical"
      trend={{ values: [3, 3, 2, 2, 3, 4, 4, 3, 3, 4, 4, WALL_OPEN_ALARMS.length], variant: 'bar', label: 'Open alarms, last 12 hours' }}
    />
  );
}

function WallClockBlock() {
  return (
    <Card aria-label="Clock and shift" role="group">
      <div className="flex w-full flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <p className="flex items-baseline gap-3 leading-none">
          <span className="text-6xl font-semibold tabular-nums tracking-tight text-base-foreground">{formatTime(REFERENCE_NOW)}</span>
          <span className="text-2xl text-muted-foreground">UTC</span>
        </p>
        <div className="flex flex-col gap-1">
          <p className="text-xl font-medium text-base-foreground">Day shift · Liv Wold</p>
          <p className="text-xl tabular-nums text-muted-foreground">Updated 14:00:00 · live</p>
        </div>
      </div>
    </Card>
  );
}

function WallAreasPanel({ index }: { index: number }) {
  const focused = wallFocusAt(index).areaId;
  return (
    <DashboardPanel title="Areas">
      <ul className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
        {WALL_AREAS.map((area) => {
          const health = healthStatus(area.health);
          const HealthIcon = WALL_HEALTH_ICON[area.health];
          const alarms = wallAlarmCount(area.id);
          const inFocus = area.id === focused;
          return (
            <li
              key={area.id}
              aria-current={inFocus ? 'true' : undefined}
              className={`flex min-w-0 flex-col gap-2 rounded-lg border p-4 ${inFocus ? 'border-emphasized bg-base-background' : 'border-transparent bg-muted-background'}`}
            >
              <p className="text-2xl font-medium text-base-foreground">{area.name}</p>
              <p className="flex items-center gap-2 text-xl text-base-foreground">
                <HealthIcon aria-hidden="true" className={`size-6 shrink-0 ${TONE_TEXT[health.tone]}`} />
                {health.label}
              </p>
              <p className="text-xl tabular-nums text-muted-foreground">
                {alarms === 0 ? 'No alarms' : `${alarms} ${alarms === 1 ? 'alarm' : 'alarms'}`}
              </p>
            </li>
          );
        })}
      </ul>
    </DashboardPanel>
  );
}

function WallAlarmsPanel() {
  return (
    <DashboardPanel title="Top alarms">
      <ol className="flex w-full flex-col gap-5">
        {WALL_TOP_ALARMS.map((alarm) => {
          const severity = severityStatus(alarm.severity);
          const SeverityIcon = WALL_SEVERITY_ICON[alarm.severity];
          return (
            <li key={alarm.id} className="flex min-w-0 items-start gap-4">
              <SeverityIcon aria-hidden="true" className={`mt-1 size-8 shrink-0 ${TONE_TEXT[severity.tone]}`} />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <p className="text-2xl font-medium text-base-foreground">{alarm.message}</p>
                <p className="text-xl text-muted-foreground">
                  {severity.label} · <span className="font-mono">{alarm.sensorTag}</span> · <span className="tabular-nums">{formatAgo(alarm.raisedAt)}</span>
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </DashboardPanel>
  );
}

/**
 * Archetype: one giant figure with satellites — a full-width state band, then a mosaic of unequal
 * blocks around the figure of the area in focus.
 * Dominant element: the giant figure and its trend.
 * Interaction: Previous and Next in the frame step the focus through the plant areas; the figure,
 * its trend and the marked area block follow. Nothing else on the board is interactive.
 */
function WallDashboard() {
  const [index, setIndex] = useState(1);

  return (
    <DashboardFrame
      title="Wall board"
      subtitle="Nordkapp gas processing plant"
      actions={
        <>
          <Button variant="outline" onClick={() => setIndex((current) => current - 1)}>
            <IconArrowLeft /> Previous area
          </Button>
          <Button variant="outline" onClick={() => setIndex((current) => current + 1)}>
            Next area <IconArrowRight />
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <WallStateBand />
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
          <div className="flex min-w-0 flex-col [&>*]:flex-1">
            <WallFocusPanel index={index} />
          </div>
          <div className="flex min-w-0 flex-col gap-4 [&>*:first-child]:flex-1">
            <WallExportTile />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <WallAvailabilityTile />
              <WallAlarmsTile />
            </div>
            <WallClockBlock />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <div className="flex min-w-0 flex-col [&>*]:flex-1">
            <WallAreasPanel index={index} />
          </div>
          <div className="flex min-w-0 flex-col [&>*]:flex-1">
            <WallAlarmsPanel />
          </div>
        </div>
      </div>
    </DashboardFrame>
  );
}

function WallBoardSignature() {
  return (
    <ThemeScope preset="wall-display" className="w-full">
      <WallDashboard />
    </ThemeScope>
  );
}

function WallBoardControlRoom() {
  return (
    <ThemeScope preset="control-room" className="w-full">
      <WallDashboard />
    </ThemeScope>
  );
}

function WallBoardAuraDark() {
  return (
    <ThemeScope preset="aura-dark" className="w-full">
      <WallDashboard />
    </ThemeScope>
  );
}

function WallBoardFjordDark() {
  return (
    <ThemeScope preset="fjord-dark" className="w-full">
      <WallDashboard />
    </ThemeScope>
  );
}

function WallBoardStateBand() {
  return <WallStateBand />;
}

function WallBoardFocus() {
  const [index, setIndex] = useState(0);
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => setIndex((current) => current - 1)}>
          <IconArrowLeft /> Previous area
        </Button>
        <Button variant="outline" onClick={() => setIndex((current) => current + 1)}>
          Next area <IconArrowRight />
        </Button>
      </div>
      <WallFocusPanel index={index} />
    </div>
  );
}

function WallBoardClock() {
  return <WallClockBlock />;
}

function WallBoardFigures() {
  return (
    <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
      <WallExportTile />
      <WallAvailabilityTile />
      <WallAlarmsTile />
    </div>
  );
}

function WallBoardAreas() {
  return <WallAreasPanel index={1} />;
}

function WallBoardAlarms() {
  return <WallAlarmsPanel />;
}

export default definePage({
  id: 'wall-board',
  title: 'Wall board',
  summary:
    'A screen read from across the room: the plant state in one band, one giant figure for the area in focus, and a few large blocks around it. Nothing small, nothing to operate beyond stepping the focus.',
  guidance: {
    use: [
      'On a large screen in a control room, workshop or office that nobody sits in front of.',
      'Say the plant state in words, in the largest band on the board.',
      'Give one figure the room: the area in focus, with its trend, stepped by hand or by the display controller.',
      'Keep to large type and a handful of blocks; three alarms, not thirty.',
    ],
    avoid: [
      'Tables, filters and anything that needs a pointer — nobody can reach the wall.',
      'Text under the size of a heading; from five metres it is noise.',
      'More than three headline figures beside the focus figure.',
      'A light theme in a dim room: the board would light the room.',
    ],
  },
  source,
  sections: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description:
        'Shown in the Wall display theme: dark, spacious and high contrast. A state band over a mosaic; Previous and Next step the area in focus.',
      specimens: [
        {
          id: 'WallBoardSignature',
          title: 'Wall board',
          note: 'Pick it for a shared screen that has to be understood in a glance from the far side of the room.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'dashboards/DashboardFrame.tsx',
            'dashboards/DashboardPanel.tsx',
            'industrial/KpiTile.tsx',
            'industrial/status.ts',
            'themes/ThemeScope.tsx',
          ],
          Component: WallBoardSignature,
        },
      ],
    },
    {
      id: 'themes',
      title: 'In other themes',
      description: 'The same board, unchanged, in three more dark presets. A wall board stays dark so it does not light the room.',
      specimens: [
        {
          id: 'WallBoardControlRoom',
          title: 'Control room',
          note: 'Pick it when the board hangs above the consoles and should match them: compact and sharp.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['themes/ThemeScope.tsx', 'themes/themes.css'],
          Component: WallBoardControlRoom,
        },
        {
          id: 'WallBoardAuraDark',
          title: 'Aura dark',
          note: 'Pick it for an office wall, where the board sits beside other Aura screens in dark mode.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['themes/ThemeScope.tsx', 'themes/themes.css'],
          Component: WallBoardAuraDark,
        },
        {
          id: 'WallBoardFjordDark',
          title: 'Fjord dark',
          note: 'Pick it for a lobby or visitor area, with the brand blue on dark surfaces.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['themes/ThemeScope.tsx', 'themes/themes.css'],
          Component: WallBoardFjordDark,
        },
      ],
    },
    {
      id: 'panels',
      title: 'Panels',
      description: 'Each part on its own, ready to drop into another board.',
      specimens: [
        {
          id: 'WallBoardStateBand',
          title: 'Plant state band',
          note: 'Pick it across the top of a board when the state of the plant must be the first thing read.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          Component: WallBoardStateBand,
        },
        {
          id: 'WallBoardFocus',
          title: 'Giant figure in focus',
          note: 'Pick it as the centrepiece: one measurement in very large type with its trend, stepped area by area.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx', 'industrial/status.ts'],
          Component: WallBoardFocus,
        },
        {
          id: 'WallBoardClock',
          title: 'Clock and shift',
          note: 'Pick it so anyone glancing up knows the time, who holds the shift and that the data is live.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          Component: WallBoardClock,
        },
        {
          id: 'WallBoardFigures',
          title: 'Headline figures',
          note: 'Pick it for the three plant figures beside the focus, the first one wider than the others.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['industrial/KpiTile.tsx'],
          Component: WallBoardFigures,
        },
        {
          id: 'WallBoardAreas',
          title: 'Area status blocks',
          note: 'Pick it to show every area as one block with its state in words and its alarm count.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx', 'industrial/status.ts'],
          Component: WallBoardAreas,
        },
        {
          id: 'WallBoardAlarms',
          title: 'Top three alarms',
          note: 'Pick it to put the three most severe alarms on the wall in type that carries.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx', 'industrial/status.ts'],
          Component: WallBoardAlarms,
        },
      ],
    },
  ],
});
