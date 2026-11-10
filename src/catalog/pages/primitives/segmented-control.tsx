import {
  SegmentedControl,
  SegmentedControlButton,
  SegmentedControlContent,
  SegmentedControlList,
} from '@cognite/aura/components/segmented-control';
import {
  Toolbar,
  ToolbarButton,
  ToolbarSegmentedControl,
  ToolbarSegmentedControlButton,
  ToolbarSeparator,
} from '@cognite/aura/components/toolbar';
import {
  IconChartLine,
  IconDeviceDesktop,
  IconDownload,
  IconLayoutGrid,
  IconList,
  IconMap,
  IconMoon,
  IconRefresh,
  IconSun,
  IconTable,
} from '@cognite/aura/icons';
import { useState } from 'react';

import { ALARMS, ASSETS, findAsset, sensorsOf, WORK_ORDERS } from '../../data/plant';
import { definePage } from '../../types';

import source from './segmented-control.tsx?raw';

const COMPRESSORS = ASSETS.filter((asset) => asset.type === 'compressor');
const OPEN_ORDERS = WORK_ORDERS.filter((order) => order.status !== 'done');
const DONE_ORDERS = WORK_ORDERS.filter((order) => order.status === 'done');
const COMPRESSOR_SENSORS = sensorsOf('23-ka-9101');
const COMPRESSOR_ALARMS = ALARMS.filter((alarm) => alarm.assetId === '23-ka-9101');
const COMPRESSOR_ORDERS = WORK_ORDERS.filter((order) => order.assetId === '23-ka-9101');

const RANGE_SUMMARY: Record<string, { label: string; average: string; peak: string }> = {
  '1h': { label: 'Last hour', average: '48.6 barg', peak: '49.0 barg' },
  '24h': { label: 'Last 24 hours', average: '48.2 barg', peak: '50.1 barg' },
  '7d': { label: 'Last 7 days', average: '47.9 barg', peak: '51.4 barg' },
};

const AGGREGATES: Record<string, string> = { avg: '141.2 °C', min: '136.8 °C', max: '146.3 °C' };

const PRESSURE_BARG = 48.6;

function asString(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback;
}

function SegmentedControlDefault() {
  return (
    <SegmentedControl defaultValue="overview">
      <SegmentedControlList aria-label="Asset view">
        <SegmentedControlButton value="overview" tabContent="label-only">
          Overview
        </SegmentedControlButton>
        <SegmentedControlButton value="sensors" tabContent="label-only">
          Sensors
        </SegmentedControlButton>
        <SegmentedControlButton value="history" tabContent="label-only">
          History
        </SegmentedControlButton>
      </SegmentedControlList>
    </SegmentedControl>
  );
}

function SegmentedControlTwoOptions() {
  return (
    <SegmentedControl defaultValue="live">
      <SegmentedControlList aria-label="Data mode">
        <SegmentedControlButton value="live" tabContent="label-only">
          Live
        </SegmentedControlButton>
        <SegmentedControlButton value="historical" tabContent="label-only">
          Historical
        </SegmentedControlButton>
      </SegmentedControlList>
    </SegmentedControl>
  );
}

function SegmentedControlIconLabel() {
  return (
    <SegmentedControl defaultValue="table">
      <SegmentedControlList aria-label="Result view">
        <SegmentedControlButton value="table">
          <IconTable /> Table
        </SegmentedControlButton>
        <SegmentedControlButton value="chart">
          <IconChartLine /> Chart
        </SegmentedControlButton>
        <SegmentedControlButton value="map">
          <IconMap /> Map
        </SegmentedControlButton>
      </SegmentedControlList>
    </SegmentedControl>
  );
}

function SegmentedControlIconOnly() {
  return (
    <SegmentedControl defaultValue="list">
      <SegmentedControlList aria-label="Layout">
        <SegmentedControlButton value="list" tabContent="icon-only" aria-label="List" title="List">
          <IconList />
        </SegmentedControlButton>
        <SegmentedControlButton value="grid" tabContent="icon-only" aria-label="Grid" title="Grid">
          <IconLayoutGrid />
        </SegmentedControlButton>
      </SegmentedControlList>
    </SegmentedControl>
  );
}

function SegmentedControlSmall() {
  return (
    <SegmentedControl defaultValue="overview">
      <SegmentedControlList size="small" aria-label="Asset view">
        <SegmentedControlButton value="overview" tabContent="label-only">
          Overview
        </SegmentedControlButton>
        <SegmentedControlButton value="sensors" tabContent="label-only">
          Sensors
        </SegmentedControlButton>
        <SegmentedControlButton value="history" tabContent="label-only">
          History
        </SegmentedControlButton>
      </SegmentedControlList>
    </SegmentedControl>
  );
}

function SegmentedControlSmallIconLabel() {
  return (
    <SegmentedControl defaultValue="chart">
      <SegmentedControlList size="small" aria-label="Result view">
        <SegmentedControlButton value="table">
          <IconTable /> Table
        </SegmentedControlButton>
        <SegmentedControlButton value="chart">
          <IconChartLine /> Chart
        </SegmentedControlButton>
      </SegmentedControlList>
    </SegmentedControl>
  );
}

function SegmentedControlSmallIconOnly() {
  return (
    <SegmentedControl defaultValue="grid">
      <SegmentedControlList size="small" aria-label="Layout">
        <SegmentedControlButton value="list" tabContent="icon-only" aria-label="List">
          <IconList />
        </SegmentedControlButton>
        <SegmentedControlButton value="grid" tabContent="icon-only" aria-label="Grid">
          <IconLayoutGrid />
        </SegmentedControlButton>
        <SegmentedControlButton value="map" tabContent="icon-only" aria-label="Map">
          <IconMap />
        </SegmentedControlButton>
      </SegmentedControlList>
    </SegmentedControl>
  );
}

function SegmentedControlShortLabels() {
  return (
    <SegmentedControl defaultValue="24h">
      <SegmentedControlList aria-label="Time range">
        <SegmentedControlButton value="1h" tabContent="label-only">
          1h
        </SegmentedControlButton>
        <SegmentedControlButton value="6h" tabContent="label-only">
          6h
        </SegmentedControlButton>
        <SegmentedControlButton value="24h" tabContent="label-only">
          24h
        </SegmentedControlButton>
        <SegmentedControlButton value="7d" tabContent="label-only">
          7d
        </SegmentedControlButton>
        <SegmentedControlButton value="30d" tabContent="label-only">
          30d
        </SegmentedControlButton>
      </SegmentedControlList>
    </SegmentedControl>
  );
}

function SegmentedControlWithCount() {
  return (
    <SegmentedControl defaultValue="open">
      <SegmentedControlList aria-label="Work order status">
        <SegmentedControlButton value="open">
          Open
          <span className="text-xs text-muted-foreground tabular-nums">{OPEN_ORDERS.length}</span>
        </SegmentedControlButton>
        <SegmentedControlButton value="done">
          Done
          <span className="text-xs text-muted-foreground tabular-nums">{DONE_ORDERS.length}</span>
        </SegmentedControlButton>
      </SegmentedControlList>
    </SegmentedControl>
  );
}

function SegmentedControlFullWidth() {
  return (
    <SegmentedControl defaultValue="details" className="w-full max-w-xs">
      <SegmentedControlList className="w-full" aria-label="Panel section">
        <SegmentedControlButton value="details" tabContent="label-only">
          Details
        </SegmentedControlButton>
        <SegmentedControlButton value="activity" tabContent="label-only">
          Activity
        </SegmentedControlButton>
      </SegmentedControlList>
    </SegmentedControl>
  );
}

function SegmentedControlDisabledOption() {
  return (
    <div className="flex flex-col items-center gap-2">
      <SegmentedControl defaultValue="table">
        <SegmentedControlList aria-label="Result view">
          <SegmentedControlButton value="table" tabContent="label-only">
            Table
          </SegmentedControlButton>
          <SegmentedControlButton value="chart" tabContent="label-only">
            Chart
          </SegmentedControlButton>
          <SegmentedControlButton value="map" tabContent="label-only" disabled>
            Map
          </SegmentedControlButton>
        </SegmentedControlList>
      </SegmentedControl>
      <p className="text-sm text-muted-foreground">Map needs assets with coordinates.</p>
    </div>
  );
}

function SegmentedControlAllDisabled() {
  return (
    <div className="flex flex-col items-center gap-2">
      <SegmentedControl defaultValue="live">
        <SegmentedControlList aria-label="Data mode">
          <SegmentedControlButton value="live" tabContent="label-only" disabled>
            Live
          </SegmentedControlButton>
          <SegmentedControlButton value="historical" tabContent="label-only" disabled>
            Historical
          </SegmentedControlButton>
        </SegmentedControlList>
      </SegmentedControl>
      <p className="text-sm text-muted-foreground">The recompressor is tripped. No live data.</p>
    </div>
  );
}

function SegmentedControlControlled() {
  const [aggregate, setAggregate] = useState('avg');

  return (
    <div className="flex flex-col items-center gap-3">
      <SegmentedControl value={aggregate} onValueChange={(value) => setAggregate(asString(value, 'avg'))}>
        <SegmentedControlList aria-label="Aggregate">
          <SegmentedControlButton value="min" tabContent="label-only">
            Min
          </SegmentedControlButton>
          <SegmentedControlButton value="avg" tabContent="label-only">
            Average
          </SegmentedControlButton>
          <SegmentedControlButton value="max" tabContent="label-only">
            Max
          </SegmentedControlButton>
        </SegmentedControlList>
      </SegmentedControl>
      <p className="text-xl font-semibold text-base-foreground tabular-nums" aria-live="polite">
        {AGGREGATES[aggregate]}
      </p>
    </div>
  );
}

function SegmentedControlWithPanels() {
  return (
    <SegmentedControl defaultValue="sensors" className="w-full max-w-md">
      <SegmentedControlList aria-label="1st stage compressor">
        <SegmentedControlButton value="sensors" tabContent="label-only">
          Sensors
        </SegmentedControlButton>
        <SegmentedControlButton value="alarms" tabContent="label-only">
          Alarms
        </SegmentedControlButton>
        <SegmentedControlButton value="work" tabContent="label-only">
          Work orders
        </SegmentedControlButton>
      </SegmentedControlList>
      <SegmentedControlContent value="sensors" className="h-24 pt-2">
        <ul className="flex flex-col gap-2">
          {COMPRESSOR_SENSORS.slice(0, 3).map((sensor) => (
            <li key={sensor.id} className="flex items-baseline justify-between gap-3 text-sm">
              <span className="truncate text-base-foreground">{sensor.name}</span>
              <span className="shrink-0 text-muted-foreground tabular-nums">{sensor.value.toFixed(sensor.decimals)} {sensor.unit}</span>
            </li>
          ))}
        </ul>
      </SegmentedControlContent>
      <SegmentedControlContent value="alarms" className="h-24 pt-2">
        <ul className="flex flex-col gap-2">
          {COMPRESSOR_ALARMS.map((alarm) => (
            <li key={alarm.id} className="flex items-baseline justify-between gap-3 text-sm">
              <span className="truncate text-base-foreground">{alarm.message}</span>
              <span className="shrink-0 text-muted-foreground tabular-nums">{alarm.value}</span>
            </li>
          ))}
        </ul>
      </SegmentedControlContent>
      <SegmentedControlContent value="work" className="h-24 pt-2">
        <ul className="flex flex-col gap-2">
          {COMPRESSOR_ORDERS.map((order) => (
            <li key={order.id} className="flex items-baseline justify-between gap-3 text-sm">
              <span className="truncate text-base-foreground">{order.title}</span>
              <span className="shrink-0 text-muted-foreground tabular-nums">{order.id}</span>
            </li>
          ))}
        </ul>
      </SegmentedControlContent>
    </SegmentedControl>
  );
}

function SegmentedControlChartRange() {
  const [range, setRange] = useState('24h');
  const summary = RANGE_SUMMARY[range];

  return (
    <div className="flex w-full max-w-md flex-col gap-4 rounded-xl bg-muted-background p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-base-foreground">Discharge pressure</p>
          <p className="text-xs text-muted-foreground">{summary.label}</p>
        </div>
        <SegmentedControl value={range} onValueChange={(value) => setRange(asString(value, '24h'))}>
          <SegmentedControlList size="small" aria-label="Time range">
            <SegmentedControlButton value="1h" tabContent="label-only">
              1h
            </SegmentedControlButton>
            <SegmentedControlButton value="24h" tabContent="label-only">
              24h
            </SegmentedControlButton>
            <SegmentedControlButton value="7d" tabContent="label-only">
              7d
            </SegmentedControlButton>
          </SegmentedControlList>
        </SegmentedControl>
      </div>
      <dl className="grid grid-cols-2 gap-4">
        <div>
          <dt className="text-xs text-muted-foreground">Average</dt>
          <dd className="text-xl font-semibold text-base-foreground tabular-nums">{summary.average}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Peak</dt>
          <dd className="text-xl font-semibold text-base-foreground tabular-nums">{summary.peak}</dd>
        </div>
      </dl>
    </div>
  );
}

function SegmentedControlLayoutSwitch() {
  const [layout, setLayout] = useState('list');

  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-base-foreground">Compressors</p>
        <SegmentedControl value={layout} onValueChange={(value) => setLayout(asString(value, 'list'))}>
          <SegmentedControlList size="small" aria-label="Layout">
            <SegmentedControlButton value="list" tabContent="icon-only" aria-label="List">
              <IconList />
            </SegmentedControlButton>
            <SegmentedControlButton value="grid" tabContent="icon-only" aria-label="Grid">
              <IconLayoutGrid />
            </SegmentedControlButton>
          </SegmentedControlList>
        </SegmentedControl>
      </div>
      <ul className={layout === 'grid' ? 'grid h-24 grid-cols-3 gap-2' : 'flex h-24 flex-col gap-2'}>
        {COMPRESSORS.map((asset) => (
          <li
            key={asset.id}
            className={
              layout === 'grid'
                ? 'flex flex-col justify-between rounded-lg bg-muted-background p-3'
                : 'flex items-baseline justify-between gap-3 text-sm'
            }
          >
            <span className="truncate text-sm text-base-foreground">{asset.name}</span>
            <span className="shrink-0 text-xs text-muted-foreground">{asset.tag}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SegmentedControlUnitSwitch() {
  const [unit, setUnit] = useState('barg');
  const reading = unit === 'barg' ? PRESSURE_BARG.toFixed(1) : (PRESSURE_BARG * 14.5038).toFixed(0);

  return (
    <div className="flex items-center gap-4">
      <p className="text-2xl font-semibold text-base-foreground tabular-nums" aria-live="polite">
        {reading} <span className="text-sm font-medium text-muted-foreground">{unit}</span>
      </p>
      <SegmentedControl value={unit} onValueChange={(value) => setUnit(asString(value, 'barg'))}>
        <SegmentedControlList size="small" aria-label="Pressure unit">
          <SegmentedControlButton value="barg" tabContent="label-only">
            barg
          </SegmentedControlButton>
          <SegmentedControlButton value="psig" tabContent="label-only">
            psig
          </SegmentedControlButton>
        </SegmentedControlList>
      </SegmentedControl>
    </div>
  );
}

function SegmentedControlStatusFilter() {
  const [status, setStatus] = useState('open');
  const orders = status === 'open' ? OPEN_ORDERS : status === 'done' ? DONE_ORDERS : WORK_ORDERS;

  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <SegmentedControl value={status} onValueChange={(value) => setStatus(asString(value, 'open'))}>
        <SegmentedControlList aria-label="Work order status">
          <SegmentedControlButton value="all">
            All
            <span className="text-xs text-muted-foreground tabular-nums">{WORK_ORDERS.length}</span>
          </SegmentedControlButton>
          <SegmentedControlButton value="open">
            Open
            <span className="text-xs text-muted-foreground tabular-nums">{OPEN_ORDERS.length}</span>
          </SegmentedControlButton>
          <SegmentedControlButton value="done">
            Done
            <span className="text-xs text-muted-foreground tabular-nums">{DONE_ORDERS.length}</span>
          </SegmentedControlButton>
        </SegmentedControlList>
      </SegmentedControl>
      <ul className="flex h-28 flex-col gap-2 overflow-hidden">
        {orders.slice(0, 4).map((order) => (
          <li key={order.id} className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate text-base-foreground">{order.title}</span>
            <span className="shrink-0 text-xs text-muted-foreground">{findAsset(order.assetId)?.tag}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SegmentedControlSettingRow() {
  return (
    <div className="flex w-full max-w-md items-center justify-between gap-4">
      <div className="min-w-0">
        <p id="segmented-control-density" className="text-sm font-medium text-base-foreground">
          Table density
        </p>
        <p className="text-sm text-muted-foreground">How much room each row takes.</p>
      </div>
      <SegmentedControl defaultValue="comfortable">
        <SegmentedControlList aria-labelledby="segmented-control-density">
          <SegmentedControlButton value="compact" tabContent="label-only">
            Compact
          </SegmentedControlButton>
          <SegmentedControlButton value="comfortable" tabContent="label-only">
            Comfortable
          </SegmentedControlButton>
        </SegmentedControlList>
      </SegmentedControl>
    </div>
  );
}

function SegmentedControlThemePicker() {
  return (
    <SegmentedControl defaultValue="system">
      <SegmentedControlList aria-label="Theme">
        <SegmentedControlButton value="light">
          <IconSun /> Light
        </SegmentedControlButton>
        <SegmentedControlButton value="dark">
          <IconMoon /> Dark
        </SegmentedControlButton>
        <SegmentedControlButton value="system">
          <IconDeviceDesktop /> System
        </SegmentedControlButton>
      </SegmentedControlList>
    </SegmentedControl>
  );
}

function SegmentedControlInToolbar() {
  return (
    <Toolbar aria-label="Trend tools">
      <ToolbarSegmentedControl defaultValue="24h" size="small" aria-label="Time range">
        <ToolbarSegmentedControlButton value="1h" tabContent="label-only">
          1h
        </ToolbarSegmentedControlButton>
        <ToolbarSegmentedControlButton value="24h" tabContent="label-only">
          24h
        </ToolbarSegmentedControlButton>
        <ToolbarSegmentedControlButton value="7d" tabContent="label-only">
          7d
        </ToolbarSegmentedControlButton>
      </ToolbarSegmentedControl>
      <ToolbarSeparator />
      <ToolbarButton size="icon-sm" aria-label="Refresh data">
        <IconRefresh />
      </ToolbarButton>
      <ToolbarButton size="icon-sm" aria-label="Download chart">
        <IconDownload />
      </ToolbarButton>
    </Toolbar>
  );
}

function SegmentedControlOnMuted() {
  return (
    <SegmentedControl defaultValue="planned">
      <SegmentedControlList aria-label="Schedule">
        <SegmentedControlButton value="planned" tabContent="label-only">
          Planned
        </SegmentedControlButton>
        <SegmentedControlButton value="actual" tabContent="label-only">
          Actual
        </SegmentedControlButton>
      </SegmentedControlList>
    </SegmentedControl>
  );
}

export default definePage({
  id: 'segmented-control',
  title: 'Segmented control',
  summary:
    'A segmented control switches between a small number of peer views or modes of the same content. One option is always selected.',
  docsSlug: 'segmented-control',
  guidance: {
    use: [
      'Two to five comparable views of the same thing: table, chart, map.',
      'Short modes people flip between often, such as a time range or a unit.',
      'Labels of one or two words; all labels, all icons, or icon plus label throughout.',
      'The small size inside card headers and toolbars.',
    ],
    avoid: [
      'Navigating between separate pages or routes — use tabs or the sidebar.',
      'Options that can be on at the same time — use toggles or checkboxes.',
      'More than five options, or long labels — use a select.',
      'Running a command — a segment selects, it never acts.',
    ],
  },
  source,
  sections: [
    {
      id: 'content',
      title: 'Content',
      description: 'What goes in a segment: a label, an icon, or both.',
      specimens: [
        {
          id: 'SegmentedControlDefault',
          title: 'Labels',
          note: 'The default: three peer views named in a word each.',
          origin: 'aura',
          Component: SegmentedControlDefault,
        },
        {
          id: 'SegmentedControlTwoOptions',
          title: 'Two options',
          note: 'A binary mode where both sides deserve a name, unlike a switch.',
          origin: 'aura',
          Component: SegmentedControlTwoOptions,
        },
        {
          id: 'SegmentedControlIconLabel',
          title: 'Icon and label',
          note: 'Views with a recognisable shape; the icon speeds up scanning.',
          origin: 'aura',
          Component: SegmentedControlIconLabel,
        },
        {
          id: 'SegmentedControlIconOnly',
          title: 'Icon only',
          note: 'Layout switches with universal icons; every segment still needs an accessible name.',
          origin: 'aura',
          Component: SegmentedControlIconOnly,
        },
        {
          id: 'SegmentedControlShortLabels',
          title: 'Five short options',
          note: 'The upper limit: abbreviations such as time ranges keep five in one row.',
          origin: 'aura',
          Component: SegmentedControlShortLabels,
        },
        {
          id: 'SegmentedControlWithCount',
          title: 'With counts',
          note: 'Each segment filters a list and shows how many items it holds.',
          origin: 'aura',
          Component: SegmentedControlWithCount,
        },
      ],
    },
    {
      id: 'size',
      title: 'Size',
      description: 'Default is 36px tall, small is 28px. Width follows the labels unless told otherwise.',
      specimens: [
        {
          id: 'SegmentedControlSmall',
          title: 'Small',
          note: 'Card headers, toolbars and other dense chrome.',
          origin: 'aura',
          Component: SegmentedControlSmall,
        },
        {
          id: 'SegmentedControlSmallIconLabel',
          title: 'Small, icon and label',
          note: 'The compact size still has room for an icon beside the label.',
          origin: 'aura',
          Component: SegmentedControlSmallIconLabel,
        },
        {
          id: 'SegmentedControlSmallIconOnly',
          title: 'Small, icon only',
          note: 'The tightest form, for a layout switch in a crowded header.',
          origin: 'aura',
          Component: SegmentedControlSmallIconOnly,
        },
        {
          id: 'SegmentedControlFullWidth',
          title: 'Full width',
          note: 'Fills a narrow side panel or drawer; segments share the width equally.',
          origin: 'aura',
          Component: SegmentedControlFullWidth,
        },
      ],
    },
    {
      id: 'states',
      title: 'States',
      description: 'Unavailable segments stay visible, with the reason next to the control.',
      specimens: [
        {
          id: 'SegmentedControlDisabledOption',
          title: 'One option disabled',
          note: 'A view that exists but has nothing to show for the current data.',
          origin: 'aura',
          Component: SegmentedControlDisabledOption,
        },
        {
          id: 'SegmentedControlAllDisabled',
          title: 'All options disabled',
          note: 'The mode cannot change right now; the selection still shows.',
          origin: 'aura',
          Component: SegmentedControlAllDisabled,
        },
        {
          id: 'SegmentedControlControlled',
          title: 'Controlled',
          note: 'The value lives in your state and drives something outside the control.',
          origin: 'aura',
          Component: SegmentedControlControlled,
        },
        {
          id: 'SegmentedControlOnMuted',
          title: 'On a muted surface',
          note: 'On a grey page or card the track still separates from the background.',
          origin: 'aura',
          surface: 'muted',
          Component: SegmentedControlOnMuted,
        },
      ],
    },
    {
      id: 'switching-content',
      title: 'Switching content',
      description: 'The control wired to what it switches.',
      specimens: [
        {
          id: 'SegmentedControlWithPanels',
          title: 'With panels',
          note: 'Built-in panels swap below the control, with tab semantics for free.',
          origin: 'aura',
          size: 'md',
          Component: SegmentedControlWithPanels,
        },
        {
          id: 'SegmentedControlStatusFilter',
          title: 'Status filter',
          note: 'Single-select filtering of a short list by one field.',
          origin: 'custom',
          size: 'md',
          Component: SegmentedControlStatusFilter,
        },
        {
          id: 'SegmentedControlChartRange',
          title: 'Time range in a card header',
          note: 'A small control in the header that re-scopes everything in the card.',
          origin: 'custom',
          size: 'md',
          Component: SegmentedControlChartRange,
        },
        {
          id: 'SegmentedControlLayoutSwitch',
          title: 'List and grid switch',
          note: 'The same records in two layouts, switched from the section header.',
          origin: 'custom',
          size: 'md',
          Component: SegmentedControlLayoutSwitch,
        },
      ],
    },
    {
      id: 'in-context',
      title: 'In context',
      description: 'Common places a segmented control lives.',
      specimens: [
        {
          id: 'SegmentedControlUnitSwitch',
          title: 'Unit switch',
          note: 'Flip a reading between two units without leaving it.',
          origin: 'custom',
          Component: SegmentedControlUnitSwitch,
        },
        {
          id: 'SegmentedControlThemePicker',
          title: 'Theme picker',
          note: 'Three exclusive preferences shown at once instead of hidden in a select.',
          origin: 'aura',
          Component: SegmentedControlThemePicker,
        },
        {
          id: 'SegmentedControlInToolbar',
          title: 'Inside a toolbar',
          note: 'The toolbar variant keeps the whole strip a single tab stop.',
          origin: 'aura',
          Component: SegmentedControlInToolbar,
        },
        {
          id: 'SegmentedControlSettingRow',
          title: 'Setting row',
          note: 'A preference with two named choices, labelled by the row.',
          origin: 'custom',
          size: 'md',
          Component: SegmentedControlSettingRow,
        },
      ],
    },
  ],
});
