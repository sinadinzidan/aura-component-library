import { Button } from '@cognite/aura/components/button';
import {
  SegmentedControl,
  SegmentedControlButton,
  SegmentedControlList,
} from '@cognite/aura/components/segmented-control';
import { IconActivity, IconAlertTriangle, IconBell, IconCircleCheck, IconFlame } from '@cognite/aura/icons';
import type { ReactNode } from 'react';

import { Bars } from '../../../library/kit/Bars';
import { Canvas } from '../../../library/kit/Canvas';
import { DataTable, type DataTableColumn } from '../../../library/kit/DataTable';
import { Grid } from '../../../library/kit/Grid';
import { IconChip } from '../../../library/kit/IconChip';
import { ListRow } from '../../../library/kit/ListRow';
import { Meter } from '../../../library/kit/Meter';
import { Panel } from '../../../library/kit/Panel';
import { RingGauge } from '../../../library/kit/RingGauge';
import { SectionHeader } from '../../../library/kit/SectionHeader';
import { Stat } from '../../../library/kit/Stat';
import { StatusPill } from '../../../library/kit/StatusPill';
import { TagId } from '../../../library/kit/TagId';
import type { Tone } from '../../../library/kit/tones';
import { TrendArea } from '../../../library/kit/TrendArea';
import { LOOK_DEFINITIONS, LOOKS, type LookId } from '../../../library/looks/looks';
import { LookScope } from '../../../library/looks/LookScope';
import { ASSETS, PLANT_KPIS, type Asset } from '../../data/plant';
import { formatTime, makeSeries, makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './looks.tsx?raw';

const LOOKS_EXPORT = makeSeries({ seed: 31, points: 25, base: 4.32, amplitude: 0.14, noise: 0.04, cycles: 1.2, decimals: 2 });

const LOOKS_HOURS = LOOKS_EXPORT.map((point) => formatTime(point.t));

const LOOKS_AVAILABILITY = makeValues({ seed: 41, points: 24, base: 96.8, amplitude: 0.5, noise: 0.2 });

const LOOKS_UNITS = ASSETS.filter((asset) => ['23-ka-9101', '23-ka-9103', '27-pa-2001b'].includes(asset.id));

const LOOKS_STATE_TONE: Record<Asset['state'], Tone> = {
  running: 'success',
  standby: 'info',
  stopped: 'neutral',
  tripped: 'critical',
  maintenance: 'warning',
};

const LOOKS_STATE_LABEL: Record<Asset['state'], string> = {
  running: 'Running',
  standby: 'Standby',
  stopped: 'Stopped',
  tripped: 'Tripped',
  maintenance: 'Maintenance',
};

const LOOKS_UNIT_COLUMNS: DataTableColumn<Asset>[] = [
  { id: 'unit', header: 'Unit', cell: (unit) => unit.name },
  { id: 'state', header: 'State', nowrap: true, cell: (unit) => <StatusPill tone={LOOKS_STATE_TONE[unit.state]}>{LOOKS_STATE_LABEL[unit.state]}</StatusPill> },
  { id: 'health', header: 'Health', numeric: true, cell: (unit) => `${unit.healthScore} %` },
];

function LooksBoard({ look }: { look: LookId }) {
  return (
    <LookScope look={look}>
      <Canvas>
        <Grid>
          <SectionHeader
            className="col-span-12"
            size="sm"
            level={4}
            title="Nordkapp"
            description="Gas processing · 14:00 UTC"
            actions={
              <StatusPill tone="warning" icon={<IconAlertTriangle />}>
                Reduced capacity
              </StatusPill>
            }
          />
          <Stat
            className="col-span-6"
            label="Gas export"
            value={PLANT_KPIS.gasExport.value}
            decimals={2}
            unit="MSm³/d"
            icon={<IconFlame />}
            tone="blue"
            delta={{ value: 0.17, decimals: 2, caption: 'vs yesterday' }}
          />
          <Stat
            className="col-span-6"
            label="Active alarms"
            value={PLANT_KPIS.activeAlarms.value}
            icon={<IconBell />}
            tone="critical"
            state="Critical"
            delta={{ value: -3, decimals: 0, good: 'down', caption: 'vs yesterday' }}
          />
          <Panel className="col-span-12" title="Gas export" subtitle="Last 24 hours against plan">
            <TrendArea
              label="Gas export over the last 24 hours against the plan"
              labels={LOOKS_HOURS}
              unit="MSm³/d"
              decimals={2}
              height={170}
              series={[{ id: 'export', label: 'Export', values: LOOKS_EXPORT.map((point) => point.v), tone: 'accent' }]}
              limits={[{ value: 4.5, label: 'Plan', tone: 'warning' }]}
            />
          </Panel>
          <Panel className="col-span-12" title="Units" padding="none">
            <DataTable
              label="Units"
              flush
              columns={LOOKS_UNIT_COLUMNS}
              rows={LOOKS_UNITS}
              rowKey={(unit) => unit.id}
              rowTone={(unit) => (unit.state === 'running' ? undefined : LOOKS_STATE_TONE[unit.state])}
            />
          </Panel>
        </Grid>
      </Canvas>
    </LookScope>
  );
}

function LooksEach({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-2 xl:grid-cols-4">
      {LOOKS.map((look) => (
        <LookScope key={look} look={look} className="flex flex-col">
          <Canvas className="flex flex-1 flex-col">
            {/* Console and signal run edge to edge; the inset keeps every cell comparable. */}
            <div className="flex flex-1 flex-col gap-4 p-3">
              <p className="text-sm font-semibold">{LOOK_DEFINITIONS[look].label}</p>
              {children}
            </div>
          </Canvas>
        </LookScope>
      ))}
    </div>
  );
}

function LooksStudio() {
  return <LooksBoard look="studio" />;
}

function LooksConsole() {
  return <LooksBoard look="console" />;
}

function LooksPoster() {
  return <LooksBoard look="poster" />;
}

function LooksGlass() {
  return <LooksBoard look="glass" />;
}

function LooksEditorial() {
  return <LooksBoard look="editorial" />;
}

function LooksSoft() {
  return <LooksBoard look="soft" />;
}

function LooksBlueprint() {
  return <LooksBoard look="blueprint" />;
}

function LooksSignal() {
  return <LooksBoard look="signal" />;
}

function LooksAnatomyPanel() {
  return (
    <LooksEach>
      <Panel
        title="Open alarms"
        subtitle="5 open"
        icon={
          <IconChip tone="amber" size="sm">
            <IconBell />
          </IconChip>
        }
        footer="Updated 14:00 UTC"
      >
        <ul>
          <ListRow tone="critical" title="Recompressor tripped" meta={<TagId>23-VT-92740</TagId>} trailing="14 min" />
          <ListRow tone="warning" title="Discharge temperature high" meta={<TagId>23-TT-92532</TagId>} trailing="38 min" />
        </ul>
      </Panel>
    </LooksEach>
  );
}

function LooksAnatomyStat() {
  return (
    <LooksEach>
      <Stat
        label="Availability"
        value={PLANT_KPIS.availability.value}
        decimals={1}
        unit="%"
        icon={<IconActivity />}
        tone="teal"
        state="Under target"
        stateIcon={<IconAlertTriangle />}
        delta={{ value: -0.7, caption: 'vs last week' }}
        target="Target 97.5"
        sparkline={LOOKS_AVAILABILITY}
      />
    </LooksEach>
  );
}

function LooksAnatomyStatus() {
  return (
    <LooksEach>
      <div className="flex flex-wrap items-center gap-2">
        <StatusPill tone="success" icon={<IconCircleCheck />}>
          Running
        </StatusPill>
        <StatusPill tone="warning">Watch</StatusPill>
        <StatusPill tone="critical">Tripped</StatusPill>
      </div>
      <Meter label="Drive-end vibration" value={6.8} max={15} unit="mm/s" decimals={1} high={7.1} target={{ value: 7.1, label: 'High limit' }} tone="warning" />
      <div className="flex items-center justify-between gap-3">
        <RingGauge label="Gas compression health" value={78} unit="" size={76} tone="warning" hideLabel />
        <IconChip tone="blue">
          <IconFlame />
        </IconChip>
        <TagId variant="chip">23-KA-9101</TagId>
      </div>
    </LooksEach>
  );
}

function LooksAnatomyChart() {
  return (
    <LooksEach>
      <Panel title="Export per day" padding="tight">
        <Bars
          label="Gas export per day for the last five days"
          categories={['Sun', 'Mon', 'Tue', 'Wed', 'Thu']}
          series={[{ id: 'export', label: 'Export', values: [4.55, 4.47, 4.41, 4.21, 4.38], tone: 'accent' }]}
          decimals={1}
          height={150}
        />
      </Panel>
    </LooksEach>
  );
}

function LooksAnatomyControls() {
  return (
    <LooksEach>
      <div className="flex flex-wrap items-center gap-2">
        <SegmentedControl defaultValue="24h">
          <SegmentedControlList size="small" aria-label="Time range">
            <SegmentedControlButton value="8h">8 h</SegmentedControlButton>
            <SegmentedControlButton value="24h">24 h</SegmentedControlButton>
            <SegmentedControlButton value="7d">7 d</SegmentedControlButton>
          </SegmentedControlList>
        </SegmentedControl>
        <Button size="sm">Acknowledge</Button>
        <Button size="sm" variant="outline">
          Shelve
        </Button>
      </div>
    </LooksEach>
  );
}

export default definePage({
  id: 'looks',
  title: 'Looks',
  summary:
    'A look is a design language: it changes how a screen is built — canvas, panels, figures, status, tables, charts and controls — not just its colours. Eight looks ship with the kit, and each still takes any accent, mode, shape and density.',
  guidance: {
    use: [
      'Wrap a screen in LookScope with a look id, or pick a look in the theme menu to set it for the whole app.',
      'Build with the kit in src/library/kit; its parts read the look and rebuild themselves.',
      'Choose by the room and the reader: studio at a desk, console for operators, signal on a wall, editorial for reports.',
    ],
    avoid: [
      'Mixing looks on one screen.',
      'Overriding a look with utilities on kit parts; extend looks.css or the kit instead.',
      'Using a dark-only look (console, glass, signal) for documents that are printed.',
    ],
  },
  source,
  sections: [
    {
      id: 'gallery',
      title: 'The same board in eight looks',
      description: 'One header, two figures, a trend and a table. Nothing but the look id changes between them.',
      specimens: [
        {
          id: 'LooksStudio',
          title: 'Studio',
          note: 'Pick it as the default for product screens: tinted canvas, elevated cards, icon chips, gradient charts.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['looks/LookScope.tsx', 'looks/looks.ts', 'looks/looks.css'],
          Component: LooksStudio,
        },
        {
          id: 'LooksConsole',
          title: 'Console',
          note: 'Pick it for operator screens: dark, edge to edge on hairlines, title strips, status blocks.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['looks/LookScope.tsx', 'looks/looks.css'],
          Component: LooksConsole,
        },
        {
          id: 'LooksPoster',
          title: 'Poster',
          note: 'Pick it when a few numbers must land from a distance: solid colour blocks, heavy type, thick borders.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['looks/LookScope.tsx', 'looks/looks.css'],
          Component: LooksPoster,
        },
        {
          id: 'LooksGlass',
          title: 'Glass',
          note: 'Pick it for showpiece and executive views on dark displays: blurred panels on a gradient, glowing lines.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['looks/LookScope.tsx', 'looks/looks.css'],
          Component: LooksGlass,
        },
        {
          id: 'LooksEditorial',
          title: 'Editorial',
          note: 'Pick it for reports: no cards, rules and columns, very large figures, numbered sections.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['looks/LookScope.tsx', 'looks/looks.css'],
          Component: LooksEditorial,
        },
        {
          id: 'LooksSoft',
          title: 'Soft',
          note: 'Pick it for friendly internal tools: large radii, pastel cards in colour families, pills.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['looks/LookScope.tsx', 'looks/looks.css'],
          Component: LooksSoft,
        },
        {
          id: 'LooksBlueprint',
          title: 'Blueprint',
          note: 'Pick it for engineering tools: outlined panels with corner ticks on grid paper, line-only charts.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['looks/LookScope.tsx', 'looks/looks.css'],
          Component: LooksBlueprint,
        },
        {
          id: 'LooksSignal',
          title: 'Signal',
          note: 'Pick it for wall screens: every tile is filled with its state and says it in a word.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['looks/LookScope.tsx', 'looks/looks.css'],
          Component: LooksSignal,
        },
      ],
    },
    {
      id: 'anatomy',
      title: 'Anatomy',
      description: 'What a look decides, part by part.',
      specimens: [
        {
          id: 'LooksAnatomyPanel',
          title: 'Panel',
          note: 'Compare border, shadow, fill, header style, padding and radius before choosing a look for a dense screen.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/Panel.tsx', 'kit/ListRow.tsx'],
          Component: LooksAnatomyPanel,
        },
        {
          id: 'LooksAnatomyStat',
          title: 'Figure',
          note: 'Compare how a KPI is drawn: chip and sparkline, solid block, state word or dimension line.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/Stat.tsx'],
          Component: LooksAnatomyStat,
        },
        {
          id: 'LooksAnatomyStatus',
          title: 'Status, meter and gauge',
          note: 'Compare how state is carried: soft pills, filled blocks, outlines, segmented or hatched bars.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/StatusPill.tsx', 'kit/Meter.tsx', 'kit/RingGauge.tsx'],
          Component: LooksAnatomyStatus,
        },
        {
          id: 'LooksAnatomyChart',
          title: 'Chart',
          note: 'Compare bar width, corner radius, grid and axis treatment.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/Bars.tsx', 'kit/ChartFrame.tsx'],
          Component: LooksAnatomyChart,
        },
        {
          id: 'LooksAnatomyControls',
          title: 'Controls',
          note: 'Compare the corner radius a look gives Aura controls: pills in soft and glass, square in console and poster.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['looks/looks.css'],
          Component: LooksAnatomyControls,
        },
      ],
    },
  ],
});
