import { ChartContainer, ChartTooltip, ChartTooltipContent, chartSeriesColor } from '@cognite/aura/chart';
import type { ChartConfig } from '@cognite/aura/chart';
import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import {
  SegmentedControl,
  SegmentedControlButton,
  SegmentedControlList,
} from '@cognite/aura/components/segmented-control';
import { IconRefresh } from '@cognite/aura/icons';
import { useState } from 'react';
import { Area, AreaChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from 'recharts';

import { DashboardFrame } from '../../../library/dashboards/DashboardFrame';
import { DashboardCell, DashboardGrid } from '../../../library/dashboards/DashboardGrid';
import { DashboardPanel } from '../../../library/dashboards/DashboardPanel';
import { KpiTile } from '../../../library/industrial/KpiTile';
import { ProgressRing } from '../../../library/industrial/ProgressRing';
import { healthStatus, runStateStatus, severityStatus } from '../../../library/industrial/status';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { ThemeScope } from '../../../library/themes/ThemeScope';
import { ALARMS, ASSETS, PLANT_KPIS, WORK_ORDERS, childrenOf, findAsset, findPerson } from '../../data/plant';
import { formatAgo, formatDate, formatTime, makeSeries, makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './plant-overview.tsx?raw';

const OVERVIEW_EXPORT = makeSeries({ seed: 31, points: 24, base: 4.32, amplitude: 0.14, noise: 0.04, cycles: 1.2, decimals: 2 }).map(
  (point) => ({ time: formatTime(point.t), export: point.v })
);

const OVERVIEW_EXPORT_CONFIG = {
  export: { label: 'Gas export', color: chartSeriesColor(1) },
} satisfies ChartConfig;

const OVERVIEW_OPEN_ALARMS = ALARMS.filter((alarm) => alarm.state === 'active' || alarm.state === 'acknowledged');

const OVERVIEW_DUE_ORDERS = WORK_ORDERS.filter((order) => order.status !== 'done').slice(0, 5);

const OVERVIEW_AREAS = childrenOf('nk');

const OVERVIEW_EQUIPMENT = ASSETS.filter((asset) => !['site', 'area', 'system'].includes(asset.type));

const OVERVIEW_ORDER_STATUS = {
  open: 'Open',
  planned: 'Planned',
  'in-progress': 'In progress',
  waiting: 'Waiting',
  done: 'Done',
} as const;

function OverviewKpiRow() {
  return (
    <DashboardGrid>
      <DashboardCell span={3}>
        <KpiTile
          label="Availability"
          value={PLANT_KPIS.availability.value}
          unit="%"
          decimals={1}
          delta={{ reference: PLANT_KPIS.availability.previous, goodDirection: 'up', caption: 'vs last week' }}
          trend={{ values: makeValues({ seed: 41, points: 24, base: 96.8, amplitude: 0.5, noise: 0.2 }) }}
        />
      </DashboardCell>
      <DashboardCell span={3}>
        <KpiTile
          label="Gas export"
          value={PLANT_KPIS.gasExport.value}
          unit="MSm³/d"
          decimals={2}
          delta={{ reference: PLANT_KPIS.gasExport.previous, goodDirection: 'up', caption: 'vs yesterday', decimals: 2 }}
          trend={{ values: OVERVIEW_EXPORT.map((point) => point.export) }}
        />
      </DashboardCell>
      <DashboardCell span={3}>
        <KpiTile
          label="Energy intensity"
          value={PLANT_KPIS.energyIntensity.value}
          unit="kWh/boe"
          decimals={1}
          delta={{ reference: PLANT_KPIS.energyIntensity.previous, goodDirection: 'down', caption: 'vs last week' }}
          trend={{ values: makeValues({ seed: 43, points: 24, base: 31.8, amplitude: 0.6, noise: 0.3, drift: -0.8 }) }}
        />
      </DashboardCell>
      <DashboardCell span={3}>
        <KpiTile
          label="Active alarms"
          value={PLANT_KPIS.activeAlarms.value}
          decimals={0}
          tone="critical"
          status={{ tone: 'critical', label: '1 critical' }}
          delta={{ reference: PLANT_KPIS.activeAlarms.previous, goodDirection: 'down', caption: 'vs yesterday', decimals: 0 }}
        />
      </DashboardCell>
    </DashboardGrid>
  );
}

function OverviewExportPanel() {
  return (
    <DashboardPanel
      title="Gas export"
      description="Last 24 hours against the daily plan"
      footnote="Export averaged 4.33 MSm³/d, 4% under the 4.50 plan, with the dip following the recompressor trip."
    >
      <div className="h-56 w-full">
        <ChartContainer
          config={OVERVIEW_EXPORT_CONFIG}
          className="aspect-auto h-full w-full"
          aria-label="Gas export over the last 24 hours, between 4.1 and 4.5 million standard cubic metres per day, under the 4.5 plan"
        >
          <AreaChart data={OVERVIEW_EXPORT} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="time" tickLine={false} axisLine={false} minTickGap={40} />
            <YAxis domain={[4, 4.6]} ticks={[4, 4.2, 4.4, 4.6]} tickLine={false} axisLine={false} width={32} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ReferenceLine y={PLANT_KPIS.gasExport.target} stroke="var(--muted-foreground)" strokeDasharray="4 4" />
            <Area
              dataKey="export"
              type="monotone"
              stroke="var(--color-export)"
              fill="var(--color-export)"
              fillOpacity={0.12}
              strokeWidth={2}
              isAnimationActive={false}
            />
          </AreaChart>
        </ChartContainer>
      </div>
    </DashboardPanel>
  );
}

function OverviewAreaHealthPanel() {
  return (
    <DashboardPanel title="Area health" description="Condition score per area">
      <ul className="flex flex-col gap-3">
        {OVERVIEW_AREAS.map((area) => (
          <li key={area.id} className="flex items-center gap-3">
            <ProgressRing
              label={`${area.name} health`}
              value={area.healthScore}
              unit=""
              decimals={0}
              size="sm"
              tone={healthStatus(area.health).tone}
              showLabel={false}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-base-foreground">{area.name}</p>
              <p className="font-mono text-xs text-muted-foreground">{area.tag}</p>
            </div>
            <StatusIndicator {...healthStatus(area.health)} size="sm" />
          </li>
        ))}
      </ul>
    </DashboardPanel>
  );
}

function OverviewAlarmsPanel() {
  return (
    <DashboardPanel
      title="Open alarms"
      description={`${OVERVIEW_OPEN_ALARMS.length} open, most severe first`}
      actions={
        <Button variant="ghost" size="sm">
          View all
        </Button>
      }
    >
      <ul className="flex flex-col gap-3">
        {OVERVIEW_OPEN_ALARMS.map((alarm) => (
          <li key={alarm.id} className="flex items-start gap-3">
            <div className="w-20 shrink-0 pt-0.5">
              <StatusIndicator {...severityStatus(alarm.severity)} size="sm" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-base-foreground">{alarm.message}</p>
              <p className="truncate text-xs text-muted-foreground">
                <span className="font-mono">{alarm.sensorTag}</span> · {alarm.value} · limit {alarm.limit}
              </p>
            </div>
            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{formatAgo(alarm.raisedAt)}</span>
          </li>
        ))}
      </ul>
    </DashboardPanel>
  );
}

function OverviewWorkOrdersPanel() {
  return (
    <DashboardPanel
      title="Work orders"
      description="Open and planned, by due date"
      actions={
        <Button variant="ghost" size="sm">
          Open planner
        </Button>
      }
    >
      <table className="w-full table-fixed text-left text-sm">
        <thead>
          <tr className="text-xs text-muted-foreground">
            <th scope="col" className="pb-2 pr-3 font-medium">
              Work order
            </th>
            <th scope="col" className="w-28 pb-2 pr-3 font-medium">
              Status
            </th>
            <th scope="col" className="w-36 pb-2 pr-3 font-medium">
              Owner
            </th>
            <th scope="col" className="w-16 pb-2 text-right font-medium">
              Due
            </th>
          </tr>
        </thead>
        <tbody>
          {OVERVIEW_DUE_ORDERS.map((order) => (
            <tr key={order.id} className="border-t border-default align-top">
              <td className="py-2 pr-3">
                <p className="line-clamp-2 text-base-foreground">{order.title}</p>
                <p className="truncate font-mono text-xs text-muted-foreground">
                  {order.id} · {findAsset(order.assetId)?.tag}
                </p>
              </td>
              <td className="whitespace-nowrap py-2 pr-3">
                <Badge variant={order.status === 'in-progress' ? 'inProgress' : 'secondary'}>
                  {OVERVIEW_ORDER_STATUS[order.status]}
                </Badge>
              </td>
              <td className="truncate py-2 pr-3 text-medium-foreground">
                {findPerson(order.assigneeId)?.name ?? 'Unassigned'}
              </td>
              <td className="whitespace-nowrap py-2 text-right tabular-nums text-medium-foreground">
                {formatDate(order.dueAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </DashboardPanel>
  );
}

function OverviewEquipmentPanel() {
  return (
    <DashboardPanel title="Equipment" description="Run state of every main unit">
      <ul className="grid grid-cols-2 gap-x-6 gap-y-3 md:grid-cols-3 xl:grid-cols-4">
        {OVERVIEW_EQUIPMENT.map((asset) => (
          <li key={asset.id} className="flex min-w-0 items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm text-base-foreground">{asset.name}</p>
              <p className="font-mono text-xs text-muted-foreground">{asset.tag}</p>
            </div>
            <StatusIndicator {...runStateStatus(asset.state)} size="sm" />
          </li>
        ))}
      </ul>
    </DashboardPanel>
  );
}

function OverviewDashboard() {
  const [range, setRange] = useState('24h');

  return (
    <DashboardFrame
      title="Plant overview"
      subtitle="Nordkapp gas processing plant · updated 14:00 UTC"
      status={<StatusIndicator tone="warning" label="Reduced capacity" detail="recompressor tripped" />}
      actions={
        <>
          <SegmentedControl value={range} onValueChange={(value) => setRange(String(value))}>
            <SegmentedControlList size="small" aria-label="Time range">
              <SegmentedControlButton value="8h">8 h</SegmentedControlButton>
              <SegmentedControlButton value="24h">24 h</SegmentedControlButton>
              <SegmentedControlButton value="7d">7 d</SegmentedControlButton>
            </SegmentedControlList>
          </SegmentedControl>
          <Button variant="outline" size="sm">
            <IconRefresh /> Refresh
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <OverviewKpiRow />
        <DashboardGrid>
          <DashboardCell span={8}>
            <OverviewExportPanel />
          </DashboardCell>
          <DashboardCell span={4}>
            <OverviewAreaHealthPanel />
          </DashboardCell>
          <DashboardCell span={6}>
            <OverviewAlarmsPanel />
          </DashboardCell>
          <DashboardCell span={6}>
            <OverviewWorkOrdersPanel />
          </DashboardCell>
          <DashboardCell span={12}>
            <OverviewEquipmentPanel />
          </DashboardCell>
        </DashboardGrid>
      </div>
    </DashboardFrame>
  );
}

function PlantOverviewSignature() {
  return (
    <ThemeScope preset="aura" className="w-full">
      <OverviewDashboard />
    </ThemeScope>
  );
}

function PlantOverviewControlRoom() {
  return (
    <ThemeScope preset="control-room" className="w-full">
      <OverviewDashboard />
    </ThemeScope>
  );
}

function PlantOverviewBlueprint() {
  return (
    <ThemeScope preset="blueprint" className="w-full">
      <OverviewDashboard />
    </ThemeScope>
  );
}

function PlantOverviewField() {
  return (
    <ThemeScope preset="field" className="w-full">
      <OverviewDashboard />
    </ThemeScope>
  );
}

function PlantOverviewKpiRow() {
  return <OverviewKpiRow />;
}

function PlantOverviewExportTrend() {
  return <OverviewExportPanel />;
}

function PlantOverviewAreaHealth() {
  return <OverviewAreaHealthPanel />;
}

function PlantOverviewOpenAlarms() {
  return <OverviewAlarmsPanel />;
}

function PlantOverviewWorkOrders() {
  return <OverviewWorkOrdersPanel />;
}

function PlantOverviewEquipment() {
  return <OverviewEquipmentPanel />;
}

export default definePage({
  id: 'plant-overview',
  title: 'Plant overview',
  summary:
    'The first screen of the day: how the plant is running, what changed, and what needs attention. Four headline figures, one trend, then the lists people act on.',
  guidance: {
    use: [
      'As the landing page of a plant or site application.',
      'When one screen has to serve operators, engineers and managers at once.',
      'Keep it to one question per panel and one headline row of four figures.',
      'Lead with the abnormal: the plant state sits beside the title.',
    ],
    avoid: [
      'More than four tiles in the headline row — move the rest into a panel.',
      'Charts without a one-line summary of what they show.',
      'Colour on figures that are normal; colour marks a judged change or an abnormal state.',
      'Panels of different padding or header style in the same grid.',
    ],
  },
  source,
  sections: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description: 'Shown in the Aura theme. Built on one 12-column grid, with every panel sharing the same header and padding.',
      specimens: [
        {
          id: 'PlantOverviewSignature',
          title: 'Plant overview',
          note: 'Pick it as the default landing page for a plant, site or asset application.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'dashboards/DashboardFrame.tsx',
            'dashboards/DashboardGrid.tsx',
            'dashboards/DashboardPanel.tsx',
            'industrial/KpiTile.tsx',
            'industrial/ProgressRing.tsx',
            'industrial/StatusIndicator.tsx',
            'themes/ThemeScope.tsx',
          ],
          Component: PlantOverviewSignature,
        },
      ],
    },
    {
      id: 'themes',
      title: 'In other themes',
      description: 'The same dashboard, unchanged, in three more presets.',
      specimens: [
        {
          id: 'PlantOverviewControlRoom',
          title: 'Control room',
          note: 'Pick it for an operator console: dark, compact, sharp and high contrast.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['themes/ThemeScope.tsx', 'themes/themes.css'],
          Component: PlantOverviewControlRoom,
        },
        {
          id: 'PlantOverviewBlueprint',
          title: 'Blueprint',
          note: 'Pick it for engineering users: blue accents, tinted panels and sharp corners.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['themes/ThemeScope.tsx', 'themes/themes.css'],
          Component: PlantOverviewBlueprint,
        },
        {
          id: 'PlantOverviewField',
          title: 'Field',
          note: 'Pick it for tablets on site: more space, softer shapes and stronger contrast.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['themes/ThemeScope.tsx', 'themes/themes.css'],
          Component: PlantOverviewField,
        },
      ],
    },
    {
      id: 'panels',
      title: 'Panels',
      description: 'Each part on its own, ready to drop into another dashboard.',
      specimens: [
        {
          id: 'PlantOverviewKpiRow',
          title: 'Headline figures',
          note: 'Pick it as the first row: four tiles of one size, most important first.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['dashboards/DashboardGrid.tsx', 'industrial/KpiTile.tsx'],
          Component: PlantOverviewKpiRow,
        },
        {
          id: 'PlantOverviewExportTrend',
          title: 'Trend against plan',
          note: 'Pick it for the one production figure the plant is steered by.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx'],
          Component: PlantOverviewExportTrend,
        },
        {
          id: 'PlantOverviewAreaHealth',
          title: 'Area health',
          note: 'Pick it to compare a handful of areas or systems by one score.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx', 'industrial/ProgressRing.tsx', 'industrial/StatusIndicator.tsx'],
          Component: PlantOverviewAreaHealth,
        },
        {
          id: 'PlantOverviewOpenAlarms',
          title: 'Open alarms',
          note: 'Pick it when the overview must show what is abnormal right now.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx', 'industrial/StatusIndicator.tsx'],
          Component: PlantOverviewOpenAlarms,
        },
        {
          id: 'PlantOverviewWorkOrders',
          title: 'Work orders',
          note: 'Pick it to show the next few jobs with owner and due date.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx'],
          Component: PlantOverviewWorkOrders,
        },
        {
          id: 'PlantOverviewEquipment',
          title: 'Equipment states',
          note: 'Pick it to list every main unit with its run state in one block.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx', 'industrial/StatusIndicator.tsx'],
          Component: PlantOverviewEquipment,
        },
      ],
    },
  ],
});
